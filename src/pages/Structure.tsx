import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Building2, ChevronRight, Plus, Share2, Loader2, AlertCircle, Users, ArrowRight, X, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Company, CompanyRelationship } from '../types';

export default function Structure() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [relationships, setRelationships] = useState<CompanyRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Relationship Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRelId, setEditingRelId] = useState<string | null>(null);
  const [relForm, setRelForm] = useState({
    parent_company_id: '',
    child_company_id: '',
    ownership_percentage: 100,
    relationship_type: 'Subsidiary',
    effective_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [companiesRes, relationshipsRes] = await Promise.all([
        supabase
          .from('companies')
          .select('*')
          .eq('owner_id', user.id)
          .order('name', { ascending: true }),
        supabase
          .from('company_relationships')
          .select('*')
      ]);

      if (companiesRes.error) throw companiesRes.error;
      
      setCompanies(companiesRes.data || []);
      setRelationships(relationshipsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching structure data:', err.message);
      setError('Failed to load group structure.');
    } finally {
      setLoading(false);
    }
  }

  function openModal(rel?: CompanyRelationship) {
    if (rel) {
      setEditingRelId(rel.id);
      setRelForm({
        parent_company_id: rel.parent_company_id,
        child_company_id: rel.child_company_id,
        ownership_percentage: rel.ownership_percentage,
        relationship_type: rel.relationship_type,
        effective_date: rel.effective_date || new Date().toISOString().split('T')[0],
        notes: rel.notes || ''
      });
    } else {
      setEditingRelId(null);
      setRelForm({
        parent_company_id: '',
        child_company_id: '',
        ownership_percentage: 100,
        relationship_type: 'Subsidiary',
        effective_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingRelId(null);
    setError(null);
  }

  async function handleRelSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (relForm.parent_company_id === relForm.child_company_id) {
      setError('Parent and child company cannot be the same.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        parent_company_id: relForm.parent_company_id,
        child_company_id: relForm.child_company_id,
        ownership_percentage: relForm.ownership_percentage,
        relationship_type: relForm.relationship_type,
        effective_date: relForm.effective_date,
        notes: relForm.notes,
        owner_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (editingRelId) {
        const { error: submitErr } = await supabase
          .from('company_relationships')
          .update(payload)
          .eq('id', editingRelId);
        if (submitErr) throw submitErr;
        setSuccess('Relationship updated successfully.');
      } else {
        const { error: submitErr } = await supabase
          .from('company_relationships')
          .insert([{ ...payload, created_at: new Date().toISOString() }]);
        if (submitErr) throw submitErr;
        setSuccess('Relationship created successfully.');
      }

      fetchData();
      closeModal();
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteRelationship(id: string) {
    if (!confirm('Are you sure you want to remove this relationship?')) return;

    try {
      setIsSubmitting(true);
      const { error: deleteErr } = await supabase
        .from('company_relationships')
        .delete()
        .eq('id', id);
      
      if (deleteErr) throw deleteErr;
      
      setSuccess('Relationship removed successfully.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const holdCos = companies.filter(c => c.group_role === 'Holding Company');
  const subsidiaries = companies.filter(c => c.group_role !== 'Holding Company');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Group Structure</h2>
          <p className="text-gray-500 mt-1">Visualize ownership and control across your entities.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Share2 className="h-5 w-5 mr-2" />
          <span className="font-medium">Update Relationships</span>
        </button>
      </div>

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl flex items-center space-x-3"
        >
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </motion.div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm overflow-x-auto min-h-[600px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-600" />
            <p>Loading structure...</p>
          </div>
        ) : companies.length > 0 ? (
          <div className="min-w-[1000px] flex flex-col items-center space-y-16">
            {/* Holding Companies Level */}
            <div className="flex justify-center gap-12">
              {holdCos.map((holdCo) => (
                <div key={holdCo.id} className="relative flex flex-col items-center">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-indigo-600 text-white border-2 border-indigo-600 shadow-xl w-64 text-center z-10"
                  >
                    <div className="p-3 bg-white/10 rounded-xl w-fit mx-auto mb-4">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg truncate">{holdCo.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-indigo-100">
                      Primary Holding Company
                    </p>
                  </motion.div>

                  {/* Connection Line to Subsidiaries */}
                  <div className="h-16 w-0.5 bg-gray-200 mt-0" />
                  
                  {/* Subsidiaries Level */}
                  <div className="flex justify-center gap-8 mt-0">
                    {subsidiaries.map((sub, sIdx) => {
                      // Check if this sub is related to this holdCo
                      const rel = relationships.find(r => r.parent_company_id === holdCo.id && r.child_company_id === sub.id);
                      if (!rel && holdCos.length > 1) return null; // Only show if related, or if only one holdCo exists show all as fallback

                      return (
                        <div key={sub.id} className="relative flex flex-col items-center pt-8">
                          {/* Horizontal connection line */}
                          <div className="absolute top-0 h-0.5 bg-gray-200 w-full" />
                          <div className="absolute top-0 h-8 w-0.5 bg-gray-200" />
                          
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: sIdx * 0.1 }}
                            className="p-5 rounded-2xl bg-white text-gray-900 border border-gray-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all w-56 text-center group"
                          >
                            <div className="p-2.5 bg-gray-50 rounded-xl w-fit mx-auto mb-3 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <h4 className="font-bold text-sm truncate">{sub.name}</h4>
                            <div className="flex items-center justify-center mt-2 space-x-2">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">{sub.group_role}</span>
                              {rel && (
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                  {rel.ownership_percentage}%
                                </span>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {holdCos.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
                {companies.map((company, idx) => (
                  <motion.div 
                    key={company.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-6 rounded-2xl bg-white text-gray-900 border border-gray-200 shadow-sm hover:border-indigo-300 transition-all text-center group"
                  >
                    <div className="p-3 bg-gray-50 rounded-xl w-fit mx-auto mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg">{company.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-gray-400">
                      {company.groupRole}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
            
            <button className="mt-8 flex items-center px-6 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all group">
              <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Add New Entity to Structure</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <Network className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No entities found</h3>
            <p className="text-gray-500 mt-1">Start by adding your first company to visualize the group structure.</p>
          </div>
        )}
      </div>

      {/* Relationship Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingRelId ? 'Edit Relationship' : 'Add New Relationship'}
                  </h3>
                </div>
                <button 
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleRelSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Parent Company</label>
                      <select
                        required
                        value={relForm.parent_company_id}
                        onChange={(e) => setRelForm({ ...relForm, parent_company_id: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      >
                        <option value="">Select Parent</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Child / Subsidiary</label>
                      <select
                        required
                        value={relForm.child_company_id}
                        onChange={(e) => setRelForm({ ...relForm, child_company_id: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      >
                        <option value="">Select Child</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Ownership %</label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          step="0.01"
                          value={relForm.ownership_percentage}
                          onChange={(e) => setRelForm({ ...relForm, ownership_percentage: parseFloat(e.target.value) })}
                          className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Relationship Type</label>
                      <select
                        required
                        value={relForm.relationship_type}
                        onChange={(e) => setRelForm({ ...relForm, relationship_type: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      >
                        <option value="Holding Company">Holding Company</option>
                        <option value="Subsidiary">Subsidiary</option>
                        <option value="Associate">Associate</option>
                        <option value="Joint Venture">Joint Venture</option>
                        <option value="Investment">Investment</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Effective Date</label>
                      <input
                        type="date"
                        required
                        value={relForm.effective_date}
                        onChange={(e) => setRelForm({ ...relForm, effective_date: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Notes (Optional)</label>
                    <textarea
                      value={relForm.notes}
                      onChange={(e) => setRelForm({ ...relForm, notes: e.target.value })}
                      placeholder="Details about the ownership structure or voting rights..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[80px]"
                    />
                  </div>

                  <div className="flex justify-end pt-4 space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        editingRelId ? 'Save Changes' : 'Create Relationship'
                      )}
                    </button>
                  </div>
                </form>

                {/* Existing Relationships List */}
                {!editingRelId && relationships.length > 0 && (
                  <div className="mt-12">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Existing Relationships</h4>
                    <div className="space-y-3">
                      {relationships.map((rel) => {
                        const parent = companies.find(c => c.id === rel.parent_company_id);
                        const child = companies.find(c => c.id === rel.child_company_id);
                        return (
                          <div key={rel.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                            <div className="flex items-center space-x-4">
                              <div className="text-sm">
                                <span className="font-bold text-gray-900">{parent?.name || 'Unknown'}</span>
                                <span className="mx-2 text-gray-400">→</span>
                                <span className="font-bold text-gray-900">{child?.name || 'Unknown'}</span>
                                <div className="text-[10px] uppercase font-bold text-indigo-600 mt-1">
                                  {rel.ownership_percentage}% • {rel.relationship_type}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openModal(rel)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <Users className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => deleteRelationship(rel.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
