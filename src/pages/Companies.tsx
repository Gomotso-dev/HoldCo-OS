import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Plus, 
  Building2, 
  MoreVertical, 
  ExternalLink,
  CheckCircle2,
  Clock,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, formatDate } from '../lib/utils';
import { Company, CompanyStatus, CompanyLegalType, CompanyGroupRole } from '../types';
import { supabase } from '../lib/supabase';
import { ActivityLogService } from '../services/activityLogService';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { ComplianceEngine } from '../services/complianceEngine';
import { ComplianceSetupWizard } from '../components/companies/ComplianceSetupWizard';

export default function Companies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [newCompanyForWizard, setNewCompanyForWizard] = useState<Company | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    legalEntityType: 'Private Company (Pty) Ltd' as CompanyLegalType,
    groupRole: 'Operating Company' as CompanyGroupRole,
    registrationNumber: '',
    incorporationDate: new Date().toISOString().split('T')[0],
    financialYearEnd: 'February',
    status: 'Active' as CompanyStatus,
    notes: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const newParam = searchParams.get('new');
    if (newParam === 'true' && !isModalOpen) {
      setIsModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, isModalOpen]);

  async function fetchCompanies() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setCompanies(data || []);
    } catch (err: any) {
      console.error('Error fetching companies:', err.message);
      setError('Failed to load companies. Please ensure the "companies" table exists in your Supabase project.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('[AddCompany] Auth error:', authError);
        throw new Error('You must be logged in to create a company.');
      }

      console.log('[AddCompany] User ID:', user.id);
      
      const insertPayload = {
        name: formData.name,
        legalEntityType: formData.legalEntityType,
        groupRole: formData.groupRole,
        registrationNumber: formData.registrationNumber,
        incorporationDate: formData.incorporationDate,
        financialYearEnd: formData.financialYearEnd,
        status: formData.status,
        notes: formData.notes || null,
        owner_id: user.id
      };

      console.log('[AddCompany] Insert payload:', insertPayload);

      const { data: insertedData, error: insertError } = await supabase
        .from('companies')
        .insert([insertPayload])
        .select();

      if (insertError) {
        console.error('[AddCompany] Insert error:', insertError);
        throw new Error(`Unable to add company: ${insertError.message || 'Unknown database error'}`);
      }

      const data = insertedData && insertedData.length > 0 ? insertedData[0] : null;

      if (data) {
        console.log('[AddCompany] Successfully created company:', data.id);
        
        // 1. Create a default tax profile for the new company
        const { error: profileError } = await supabase
          .from('company_tax_profiles')
          .insert([{
            company_id: data.id,
            owner_id: user.id,
            vat_registered: false,
            paye_registered: false,
            uif_registered: false,
            has_employees: false
          }]);

        if (profileError) {
          console.warn('[AddCompany] Failed to create tax profile:', profileError.message);
        } else {
          // 2. Generate initial compliance items
          try {
            const taxProfile = { vat_registered: false, paye_registered: false, uif_registered: false };
            await ComplianceEngine.generateComplianceForCompany(data, taxProfile);
          } catch (compError: any) {
            console.warn('[AddCompany] Auto compliance generation failed:', compError.message);
          }
        }

        await ActivityLogService.logActivity({
          action_type: 'company_created' as any,
          description: `Created new company: ${data.name}`,
          companyId: data.id
        });
        
        setIsModalOpen(false);
        setNewCompanyForWizard(data);
        setIsWizardOpen(true);
        setSuccess(`Company "${data.name}" successfully created.`);
      }

      setFormData({
        name: '',
        legalEntityType: 'Private Company (Pty) Ltd',
        groupRole: 'Operating Company',
        registrationNumber: '',
        incorporationDate: new Date().toISOString().split('T')[0],
        financialYearEnd: 'February',
        status: 'Active',
        notes: ''
      });
      fetchCompanies();
    } catch (err: any) {
      console.error('[AddCompany] Error:', err.message);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(company: Company) {
    setCompanyToDelete(company);
    setIsDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!companyToDelete) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyToDelete.id);

      if (error) throw error;

      await ActivityLogService.logActivity({
        action_type: 'company_updated' as any,
        description: `Deleted company: ${companyToDelete.name}`,
        companyId: companyToDelete.id
      });
      setSuccess(`Company "${companyToDelete.name}" successfully deleted.`);
      setIsDeleteModalOpen(false);
      setCompanyToDelete(null);
      fetchCompanies();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Company Register</h2>
          <p className="text-gray-500 mt-1">Manage all legal entities in your business group.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="h-5 w-5 mr-2" />
          <span className="font-medium">Add New Company</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, registration number..."
            className="w-full pl-10 pr-4 py-2 border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4 mr-2" />
            <span>Filter</span>
          </button>
          <select className="border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors focus:ring-indigo-500 focus:border-indigo-500">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Dormant</option>
          </select>
        </div>
      </div>

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center space-x-3 shadow-sm"
        >
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <button 
            onClick={() => fetchCompanies()}
            className="ml-auto text-xs font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Companies Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-600" />
          <p>Loading companies...</p>
        </div>
      ) : filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
            >
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-50 rounded-xl group-hover:scale-110 transition-transform">
                    <Building2 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <StatusBadge status={company.status} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight group-hover:text-indigo-600 transition-colors">{company.name}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                    {company.groupRole}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                    {company.legalEntityType}
                  </span>
                </div>
                
                <div className="space-y-2.5">
                  <div className="flex items-center text-xs text-gray-500">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                    <span className="font-medium truncate">{company.registrationNumber || 'No reg number'}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                    <span>Incorp: {formatDate(company.incorporationDate)}</span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <Link 
                  to={`/companies/${company.id}`}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center transition-colors"
                >
                  View Profile
                  <ExternalLink className="h-4 w-4 ml-1.5" />
                </Link>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleDelete(company)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete Entity"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title={searchTerm ? "No companies found" : "Your register is empty"}
          description={searchTerm ? `We couldn't find any results matching "${searchTerm}". Try a different keyword.` : "Add your first entity to start managing ownership, compliance, and finances for your group."}
          actionLabel={searchTerm ? "Clear Search" : "Add Your First Company"}
          onAction={() => searchTerm ? setSearchTerm('') : setIsModalOpen(true)}
        />
      )}

      {/* Add Company Modal */}
      {newCompanyForWizard && (
        <ComplianceSetupWizard
          company={newCompanyForWizard}
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onComplete={() => {
            setIsWizardOpen(false);
            fetchCompanies();
          }}
        />
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">Add New Company</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="Enter full registered company name"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 2024/123456/07"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={formData.registrationNumber}
                      onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                    />
                  </div>

                  {/* Progressive Disclosure / Hidden Advanced Fields */}
                  <div className="pt-2">
                    <button 
                      type="button"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                      onClick={(e) => {
                        const target = e.currentTarget.nextElementSibling as HTMLElement;
                        target.classList.toggle('hidden');
                      }}
                    >
                      + Show advanced details (Legal type, Year end...)
                    </button>
                    <div className="hidden grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Legal Entity Type</label>
                        <select
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                          value={formData.legalEntityType}
                          onChange={e => setFormData({ ...formData, legalEntityType: e.target.value as CompanyLegalType })}
                        >
                          <option value="Private Company (Pty) Ltd">Private Company (Pty) Ltd</option>
                          <option value="Public Company (Ltd)">Public Company (Ltd)</option>
                          <option value="Personal Liability Company (Inc)">Personal Liability Company (Inc)</option>
                          <option value="Non-Profit Company (NPC)">Non-Profit Company (NPC)</option>
                          <option value="State-Owned Company (SOC Ltd)">State-Owned Company (SOC Ltd)</option>
                          <option value="Close Corporation (CC)">Close Corporation (CC)</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Sole Proprietorship">Sole Proprietorship</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Group Role</label>
                        <select
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                          value={formData.groupRole}
                          onChange={e => setFormData({ ...formData, groupRole: e.target.value as CompanyGroupRole })}
                        >
                          <option value="Holding Company">Holding Company</option>
                          <option value="Subsidiary">Subsidiary</option>
                          <option value="Associate">Associate</option>
                          <option value="Operating Company">Operating Company</option>
                          <option value="SPV">SPV</option>
                          <option value="Dormant Entity">Dormant Entity</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Incorporation Date</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                          value={formData.incorporationDate}
                          onChange={e => setFormData({ ...formData, incorporationDate: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year End</label>
                        <select
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                          value={formData.financialYearEnd}
                          onChange={e => setFormData({ ...formData, financialYearEnd: e.target.value })}
                        >
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                          value={formData.notes}
                          onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Company'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Company?</h3>
                <p className="text-gray-500">
                  Are you sure you want to delete <span className="font-bold text-gray-900">{companyToDelete?.name}</span>? 
                  This action cannot be undone and will remove all associated data.
                </p>
              </div>
              <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-white transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
