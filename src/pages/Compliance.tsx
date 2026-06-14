import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Plus, 
  Filter, 
  Search,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Loader2,
  X,
  Trash2,
  PieChart,
  LayoutDashboard,
  Table as TableIcon,
  ShieldCheck,
  FileText,
  UserCheck,
  Stethoscope,
  Link as LinkIcon,
  Download,
  AlertTriangle,
  History,
  FileBadge
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { ActivityLogService } from '../services/activityLogService';
import { ComplianceItem, Company, ComplianceStatus, Document } from '../types';
import { format, isAfter, isBefore, addDays, startOfDay, startOfMonth } from 'date-fns';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';

interface ComplianceWithCompany extends ComplianceItem {
  companies: {
    name: string;
  };
}

type ComplianceView = 'overview' | 'register' | 'calendar' | 'sars' | 'cipc' | 'labour' | 'popia';

const COMPLIANCE_CATEGORIES = [
  { id: 'SARS', icon: PieChart, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-100' },
  { id: 'CIPC', icon: ShieldCheck, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-100' },
  { id: 'Labour', icon: UserCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100' },
  { id: 'POPIA', icon: Stethoscope, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-100' },
  { id: 'Governance', icon: FileBadge, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-100' },
  { id: 'Other', icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-100' }
];

const SARS_TYPES = ['ITR14', 'ITR12', 'VAT201', 'EMP201', 'Provisional Tax', 'Dividends Tax'];
const CIPC_TYPES = ['Annual Return', 'Director Change', 'Beneficial Ownership', 'CoR 39', 'CoR 14.1'];
const LABOUR_TYPES = ['Employment Contract', 'Disciplinary Code', 'Termination Letter', 'UIF Filing', 'COIDA'];
const POPIA_TYPES = ['Privacy Notice', 'Data Processing Agreement', 'Consent Register', 'Breach Notification'];

export default function Compliance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeView, setActiveView] = useState<ComplianceView>('overview');
  const [viewScope, setViewScope] = useState<'all' | 'single'>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [complianceItems, setComplianceItems] = useState<ComplianceWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ComplianceWithCompany | null>(null);
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
  const initialFormState = {
    company_id: '',
    category: 'Other' as ComplianceItem['category'],
    type: '',
    title: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    reminder_date: '',
    priority: 'Medium' as ComplianceItem['priority'],
    status: 'Pending' as ComplianceStatus,
    linked_document_id: '',
    notes: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const newParam = searchParams.get('new');
    const itemId = searchParams.get('itemId');

    if (newParam === 'true' && !isModalOpen) {
      handleAddClick();
      setSearchParams({}, { replace: true });
    } else if (itemId && !isModalOpen && complianceItems.length > 0) {
      const item = complianceItems.find(i => i.id === itemId);
      if (item) {
        handleEditClick(item);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, isModalOpen, complianceItems]);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch companies and documents
      const [companiesRes, docsRes] = await Promise.all([
        supabase.from('companies').select('*').eq('owner_id', user.id).order('name'),
        supabase.from('documents').select('*').eq('owner_id', user.id).order('title')
      ]);
      
      setCompanies(companiesRes.data || []);
      setDocuments(docsRes.data || []);

      // Fetch compliance items with company names
      const complianceRes = await supabase
        .from('compliance')
        .select(`
          *,
          companies!company_id (
            name
          )
        `)
        .eq('owner_id', user.id)
        .order('due_date', { ascending: true });

      if (complianceRes.error) {
        console.error('Compliance fetch error:', complianceRes.error);
        throw complianceRes.error;
      }
      setComplianceItems(complianceRes.data || []);
    } catch (err: any) {
      console.error('Error fetching compliance data:', err.message);
      setError('Failed to load compliance data.');
    } finally {
      setLoading(false);
    }
  }

  function handleAddClick(category?: ComplianceItem['category']) {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      ...initialFormState,
      category: category || 'Other',
      company_id: selectedCompanyId !== 'all' ? selectedCompanyId : ''
    });
    setIsModalOpen(true);
  }

  function handleEditClick(item: ComplianceWithCompany) {
    setIsEditMode(true);
    setEditingId(item.id);
    setFormData({
      company_id: item.company_id,
      category: item.category || 'Other',
      type: item.type || '',
      title: item.title,
      due_date: item.due_date,
      reminder_date: item.reminder_date || '',
      priority: item.priority,
      status: item.status,
      linked_document_id: item.linked_document_id || '',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const timestamp = new Date().toISOString();
      
      // Ensure specific fields are used and handle linked_document_id correctly
      const payload: any = {
        company_id: formData.company_id,
        category: formData.category,
        type: formData.type || null,
        title: formData.title,
        due_date: formData.due_date,
        reminder_date: formData.reminder_date || null,
        priority: formData.priority,
        status: formData.status,
        linked_document_id: formData.linked_document_id || null,
        notes: formData.notes || null,
        updated_at: timestamp
      };

      if (isEditMode && editingId) {
        // Explicit fields for update as per requirement
        const updatePayload = {
          due_date: payload.due_date,
          status: payload.status,
          notes: payload.notes,
          linked_document_id: payload.linked_document_id,
          updated_at: timestamp
        };

        const { error: updateError } = await supabase
          .from('compliance')
          .update(updatePayload)
          .eq('id', editingId);

        if (updateError) {
          console.error('Supabase update error:', updateError);
          throw updateError;
        }

        await ActivityLogService.logActivity({
          action_type: 'compliance_updated',
          description: `Updated compliance record: ${formData.title}`,
          company_id: formData.company_id
        });
      } else {
        const { data, error: insertError } = await supabase
          .from('compliance')
          .insert([{
            ...payload,
            owner_id: user.id,
            created_at: timestamp
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Supabase insert error:', insertError);
          throw insertError;
        }

        if (data) {
          await ActivityLogService.logActivity({
            action_type: 'compliance_created',
            description: `Created new compliance record: ${data.title}`,
            company_id: data.company_id
          });
        }
      }

      setSuccess(`Compliance item "${formData.title}" successfully ${isEditMode ? 'updated' : 'created'}.`);
      setIsModalOpen(false);
      setFormData(initialFormState);
      fetchData();
    } catch (err: any) {
      console.error('HandleSubmit failed:', err);
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!itemToDelete) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('compliance')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      await ActivityLogService.logActivity({
        action_type: 'compliance_deleted',
        description: `Deleted compliance record: ${itemToDelete.title}`,
        company_id: itemToDelete.company_id
      });
      setSuccess(`Compliance item "${itemToDelete.title}" successfully deleted.`);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');

  const filteredItems = useMemo(() => {
    return complianceItems.filter(item => {
      const matchesScope = viewScope === 'all' || selectedCompanyId === 'all' || item.company_id === selectedCompanyId;
      const matchesSearch = 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.companies?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesView = 
        activeView === 'overview' || 
        activeView === 'register' || 
        activeView === 'calendar' ||
        (activeView === 'sars' && item.category === 'SARS') ||
        (activeView === 'cipc' && item.category === 'CIPC') ||
        (activeView === 'labour' && item.category === 'Labour') ||
        (activeView === 'popia' && item.category === 'POPIA');

      const matchesStatusFilter = 
        activeFilter === 'all' ? true :
        activeFilter === 'pending' ? item.status === 'Pending' :
        activeFilter === 'overdue' ? item.status === 'Overdue' :
        activeFilter === 'completed' ? item.status === 'Completed' : true;

      return matchesScope && matchesSearch && matchesView && matchesStatusFilter;
    });
  }, [complianceItems, viewScope, selectedCompanyId, searchTerm, activeView, activeFilter]);

  const stats = useMemo(() => {
    const relevant = complianceItems.filter(i => 
      viewScope === 'all' || selectedCompanyId === 'all' || i.company_id === selectedCompanyId
    );
    const now = startOfDay(new Date());
    
    return {
      overdue: relevant.filter(i => i.status === 'Overdue' || (i.status !== 'Completed' && isBefore(new Date(i.due_date), now))).length,
      upcoming: relevant.filter(i => {
        const due = new Date(i.due_date);
        const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 14 && i.status !== 'Completed';
      }).length,
      completed: relevant.filter(i => i.status === 'Completed').length,
      highPriority: relevant.filter(i => (i.priority === 'High' || i.priority === 'Critical') && i.status !== 'Completed').length,
      byCategory: COMPLIANCE_CATEGORIES.map(cat => ({
        ...cat,
        count: relevant.filter(i => i.category === cat.id && i.status !== 'Completed').length
      }))
    };
  }, [complianceItems, viewScope, selectedCompanyId]);

  const calendarDays = useMemo(() => {
    const today = new Date();
    const start = startOfMonth(today);
    const days = [];
    // Just a simple month view for now
    for (let i = 0; i < 31; i++) {
        const day = addDays(start, i);
        if (day.getMonth() !== start.getMonth()) break;
        
        const items = complianceItems.filter(item => {
            const itemDate = new Date(item.due_date);
            return itemDate.getDate() === day.getDate() && 
                   itemDate.getMonth() === day.getMonth() && 
                   itemDate.getFullYear() === day.getFullYear();
        });
        
        days.push({ day, items });
    }
    return days;
  }, [complianceItems]);

  const renderRegister = (items: ComplianceWithCompany[]) => (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden border-collapse">
      {/* Desktop Table */}
      <table className="hidden md:table w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status / Readiness</th>
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Company / Category</th>
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Compliance Item</th>
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Due Date</th>
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((item, index) => {
            const requiredDocs = item.required_documents || [];
            const companyDocs = documents.filter(doc => doc.company_id === item.company_id);
            const foundAll = requiredDocs.length > 0 && requiredDocs.every(req => 
              companyDocs.some(doc => 
                doc.title.toLowerCase().includes(req.toLowerCase()) || 
                doc.category.toLowerCase().includes(req.toLowerCase())
              )
            );
            const readiness = requiredDocs.length === 0 ? 'No Documents Required' : foundAll ? 'Ready to Submit' : 'Missing Documents';

            return (
              <motion.tr 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="hover:bg-gray-50/50 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-1">
                    <StatusBadge status={item.status} />
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border w-fit whitespace-nowrap",
                      readiness === 'Ready to Submit' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      readiness === 'Missing Documents' ? "bg-orange-50 text-orange-700 border-orange-100" :
                      "bg-gray-50 text-gray-400 border-gray-100"
                    )}>
                      {readiness}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{item.companies?.name}</span>
                    <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      <span className="mr-2">{item.category}</span>
                      {item.linked_document_id && <LinkIcon className="h-2.5 w-2.5 text-indigo-400" />}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">{item.title}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{item.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      "text-sm font-black tabular-nums",
                      item.status === 'Overdue' ? "text-red-600" : "text-gray-900"
                    )}>
                      {formatDate(item.due_date)}
                    </span>
                    {item.status !== 'Completed' && (
                      <span className="text-[9px] font-bold text-gray-400 uppercase">
                          {isAfter(new Date(item.due_date), new Date()) ? 'Upcoming' : 'Overdue'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => handleEditClick(item)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setItemToDelete(item);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-100">
        {items.map((item, index) => {
          const requiredDocs = item.required_documents || [];
          const companyDocs = documents.filter(doc => doc.company_id === item.company_id);
          const foundAll = requiredDocs.length > 0 && requiredDocs.every(req => 
            companyDocs.some(doc => 
              doc.title.toLowerCase().includes(req.toLowerCase()) || 
              doc.category.toLowerCase().includes(req.toLowerCase())
            )
          );
          const readiness = requiredDocs.length === 0 ? 'No Documents Required' : foundAll ? 'Ready to Submit' : 'Missing Documents';

          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <StatusBadge status={item.status} />
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border w-fit",
                    readiness === 'Ready to Submit' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    readiness === 'Missing Documents' ? "bg-orange-50 text-orange-700 border-orange-100" :
                    "bg-gray-50 text-gray-400 border-gray-100"
                  )}>
                    {readiness}
                  </span>
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  item.status === 'Overdue' ? "text-red-600" : "text-gray-900"
                )}>
                  Due: {formatDate(item.due_date)}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900">{item.title}</h4>
                <p className="text-xs text-gray-500 font-medium">{item.companies?.name}</p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[9px] font-black rounded uppercase">{item.category}</span>
                  <span className={cn(
                    "text-[9px] font-black uppercase",
                    item.priority === 'Critical' ? "text-red-600" :
                    item.priority === 'High' ? "text-orange-600" : "text-gray-400"
                  )}>{item.priority}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleEditClick(item)}
                    className="p-2 bg-gray-50 text-gray-500 rounded-lg active:scale-95"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setItemToDelete(item);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 bg-red-50 text-red-500 rounded-lg active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="py-20 text-center">
          <EmptyState 
            icon={ShieldCheck}
            title={searchTerm ? "No matching records" : `No ${activeView} items loggged`}
            description={searchTerm ? "Try searching for a different term or company." : `You haven't added any ${activeView} compliance obligations yet.`}
            actionLabel={searchTerm ? "Clear Search" : "Add Your First Item"}
            onAction={() => {
              if (searchTerm) {
                setSearchTerm('');
              } else {
                handleAddClick(activeView === 'overview' ? 'Other' : activeView.toUpperCase() as any);
              }
            }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header and Scope Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex flex-col md:flex-row md:items-center">
            Compliance Control
            <div className="mt-2 md:mt-0 md:ml-3 flex p-1 bg-gray-100 rounded-xl border border-gray-200/50 w-fit">
               <button
                 onClick={() => { setViewScope('all'); setSelectedCompanyId('all'); }}
                 className={cn(
                   "px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                   viewScope === 'all' ? "bg-white text-indigo-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"
                 )}
               >
                 All Entities
               </button>
               <button
                 onClick={() => setViewScope('single')}
                 className={cn(
                   "px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                   viewScope === 'single' ? "bg-white text-indigo-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"
                 )}
               >
                 Single Entity
               </button>
            </div>
          </h2>
          <p className="hidden md:block text-gray-500 text-sm font-medium mt-1">Manage SARS, CIPC, and South African regulatory workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          {viewScope === 'single' && (
            <select
              className="flex-1 md:flex-none px-3 md:px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] md:text-xs font-bold text-gray-900 focus:ring-indigo-500 shadow-sm min-w-[140px] md:min-w-[180px]"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
            >
              <option value="all">Select Company...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button 
            onClick={() => handleAddClick()}
            className="flex items-center px-4 md:px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 shadow-indigo-200"
          >
            <Plus className="h-4 w-4 mr-1 md:mr-2" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Add Item</span>
          </button>
        </div>
      </div>

      {/* Internal Sub-Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-1 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'register', label: 'Register', icon: TableIcon },
            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
            { id: 'sars', label: 'SARS', icon: PieChart },
            { id: 'cipc', label: 'CIPC', icon: ShieldCheck },
            { id: 'labour', label: 'Labour', icon: UserCheck },
            { id: 'popia', label: 'POPIA', icon: Stethoscope },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as ComplianceView)}
              className={cn(
                "flex items-center px-3 md:px-4 py-3 text-[10px] md:text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap outline-none",
                activeView === tab.id 
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/10" 
                  : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
              )}
            >
              <tab.icon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              {tab.label}
            </button>
          ))}
      </div>

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center space-x-3 shadow-sm mb-6"
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
            onClick={() => fetchData()}
            className="ml-auto text-xs font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView + selectedCompanyId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === 'overview' && (
            <div className="space-y-8">
               {/* Stat Cards */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Critically Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
                    { label: 'Upcoming Deadlines', value: stats.upcoming, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
                    { label: 'High Priority Items', value: stats.highPriority, icon: Loader2, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
                    { label: 'Completed (MTD)', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-50' }
                  ].map((s, idx) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <div className={cn("p-3 rounded-2xl", s.bgColor, s.color)}>
                          <s.icon className="h-6 w-6" />
                        </div>
                        <span className="text-3xl font-black text-gray-900 tabular-nums">{loading ? '...' : s.value}</span>
                      </div>
                      <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] relative z-10">{s.label}</p>
                      <div className={cn("absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform", s.color)}>
                         <s.icon className="h-32 w-32" />
                      </div>
                    </motion.div>
                  ))}
               </div>

               {/* Risk & Health Section */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Category Breakdown */}
                  <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Group Risk Heatmap</h3>
                    <div className="space-y-4">
                      {stats.byCategory.map(cat => (
                        <div key={cat.id} className="group cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center">
                                <div className={cn("p-2 rounded-lg mr-3", cat.bgColor, cat.color)}>
                                  <cat.icon className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-black text-gray-700 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{cat.id} Obligations</span>
                             </div>
                             <span className="text-xs font-black text-gray-900">{cat.count}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                             <div 
                                className={cn("h-full rounded-full transition-all", cat.bgColor.replace('50', '500'))}
                                style={{ width: `${Math.max(5, (cat.count / (stats.upcoming + stats.overdue || 1)) * 100)}%` }}
                             />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Immediate Deadlines */}
                  <div className="lg:col-span-2 space-y-6">
                     <div className="flex items-center justify-between">
                       <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center">
                         <History className="h-4 w-4 mr-2 text-indigo-600" />
                         Urgent Compliance Items
                       </h3>
                       <button onClick={() => setActiveView('register')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View Full Register</button>
                     </div>

                     <div className="bg-white rounded-3xl border border-gray-200 shadow-sm divide-y divide-gray-50 overflow-hidden">
                        {filteredItems.slice(0, 5).map(item => (
                          <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                             <div className="flex items-center space-x-4">
                                <div className={cn(
                                   "w-2 h-10 rounded-full",
                                   item.priority === 'Critical' ? "bg-red-500" :
                                   item.priority === 'High' ? "bg-orange-500" : "bg-indigo-500"
                                )} />
                                <div>
                                   <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                   <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                      <Building2 className="h-3 w-3 mr-1" />
                                      {item.companies?.name}
                                      <span className="mx-2 opacity-20">|</span>
                                      <span>{item.category}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-6">
                                <div className="text-right">
                                   <p className={cn(
                                      "text-xs font-black tabular-nums",
                                      item.status === 'Overdue' ? "text-red-600" : "text-gray-900"
                                   )}>
                                      {formatDate(item.due_date)}
                                   </p>
                                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">DEADLINE</p>
                                </div>
                                <button onClick={() => handleEditClick(item)} className="p-2 text-gray-200 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all">
                                   <ChevronRight className="h-4 w-4" />
                                </button>
                             </div>
                          </div>
                        ))}
                        {filteredItems.length === 0 && (
                          <EmptyState
                            className="border-none bg-transparent py-12"
                            icon={ShieldCheck}
                            title="All Clear!"
                            description="No urgent compliance obligations found for the current selection."
                          />
                        )}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeView === 'register' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm items-center">
                 <div className="flex-1 relative group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search register by title, company, or category..."
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all text-sm font-medium"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <div className="relative">
                    <button 
                        onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                        className="flex items-center px-4 py-3 text-gray-600 hover:text-indigo-600 transition-colors uppercase text-[10px] font-black tracking-widest border border-gray-100 rounded-2xl bg-white shadow-sm whitespace-nowrap outline-none"
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        <span>Filter: {activeFilter}</span>
                    </button>
                    {isFilterMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden py-1">
                            {['all', 'pending', 'overdue', 'completed'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => { setActiveFilter(f as any); setIsFilterMenuOpen(false); }}
                                    className={cn(
                                        "w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-indigo-50 transition-colors",
                                        activeFilter === f ? "text-indigo-600 bg-indigo-50/50" : "text-gray-600"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}
                 </div>
                 <button onClick={() => fetchData()} className="p-3 text-gray-400 hover:text-indigo-600 transition-all border border-gray-100 rounded-2xl bg-white shadow-sm">
                    <Loader2 className={cn("h-4 w-4", loading && "animate-spin")} />
                 </button>
              </div>

              {renderRegister(filteredItems)}
            </div>
          )}

          {activeView === 'calendar' && (
             <div className="space-y-6">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2 text-indigo-600" />
                        {format(new Date(), 'MMMM yyyy')}
                    </h3>
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-1" /> Overdue</div>
                        <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-indigo-500 mr-1" /> Pending</div>
                        <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1" /> Completed</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="bg-gray-50 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
                    ))}
                    {/* Padding for first day of month (simple implementation) */}
                    {Array.from({ length: startOfMonth(new Date()).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-white/50 h-32 md:h-40" />
                    ))}
                    {calendarDays.map((cd, i) => (
                        <div 
                            key={i} 
                            className={cn(
                                "bg-white h-32 md:h-40 p-2 border-t border-gray-100 transition-colors hover:bg-gray-50/50",
                                format(cd.day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "bg-indigo-50/20" : ""
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={cn(
                                    "text-xs font-black tabular-nums",
                                    format(cd.day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "text-indigo-600 bg-white px-1.5 py-0.5 rounded-md shadow-sm border border-indigo-100" : "text-gray-400"
                                )}>
                                    {cd.day.getDate()}
                                </span>
                            </div>
                            <div className="space-y-1">
                                {cd.items.slice(0, 3).map(item => (
                                    <button 
                                        key={item.id}
                                        onClick={() => handleEditClick(item)}
                                        className={cn(
                                            "w-full text-left p-1 rounded-md text-[10px] font-bold truncate transition-all hover:scale-[1.02]",
                                            item.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                            item.status === 'Overdue' ? "bg-red-50 text-red-700 border border-red-100" :
                                            "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                        )}
                                        title={item.title}
                                    >
                                        {item.title}
                                    </button>
                                ))}
                                {cd.items.length > 3 && (
                                    <p className="text-[9px] font-black text-gray-300 text-center uppercase mt-1">+{cd.items.length - 3} more</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          )}

          {(activeView === 'sars' || activeView === 'cipc' || activeView === 'labour' || activeView === 'popia') && (
            <div className="space-y-6">
               <div className="bg-indigo-900 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-2xl">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div>
                        <h3 className="text-2xl font-black tracking-tight flex items-center uppercase text-white">
                           {COMPLIANCE_CATEGORIES.find(c => c.id.toLowerCase() === activeView)?.id || activeView} Workspace
                           <span className="ml-3 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold border border-white/20">Operational</span>
                        </h3>
                        <p className="text-indigo-100/70 text-sm mt-1 max-w-lg">
                           {activeView === 'sars' && "Manage your income tax, VAT, and employee tax filings across your entity group."}
                           {activeView === 'cipc' && "Track annual returns, director updates, and beneficial ownership submissions."}
                           {activeView === 'labour' && "Centralize employment contracts, labour compliance, and workplace policies."}
                           {activeView === 'popia' && "Your privacy compliance workspace for data processing and breach management."}
                        </p>
                     </div>
                     <button 
                        onClick={() => handleAddClick(activeView.toUpperCase() as ComplianceItem['category'])}
                        className="px-6 py-3 bg-white text-indigo-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                     >
                        New {activeView.toUpperCase()} Entry
                     </button>
                  </div>
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                     {(() => {
                        const Icon = COMPLIANCE_CATEGORIES.find(c => c.id.toLowerCase() === activeView)?.icon || ShieldCheck;
                        return <Icon className="h-48 w-48 text-white" />;
                     })()}
                  </div>
               </div>

               {/* Section Specific Filtered Register */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{activeView} Records</h4>
                     <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                           {filteredItems.filter(i => i.status === 'Completed').length} Resolved
                        </span>
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                           {filteredItems.filter(i => i.status === 'Overdue').length} Risk Items
                        </span>
                     </div>
                  </div>
                  {renderRegister(filteredItems)}
                  {filteredItems.length === 0 && (
                    <div className="bg-white p-20 rounded-3xl border border-gray-100 border-dashed text-center">
                       <History className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                       <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">No {activeView.toUpperCase()} items found</h4>
                       <p className="text-gray-400 font-medium text-xs mt-1 max-w-xs mx-auto">This workspace is currently empty. Start by adding your first compliance obligation for this category.</p>
                       <button onClick={() => handleAddClick(activeView.toUpperCase() as ComplianceItem['category'])} className="mt-6 px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">Start logging obligations</button>
                    </div>
                  )}
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                   <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">
                     {isEditMode ? 'Modify Obligation' : 'New Compliance Entry'}
                   </h3>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">SA Multi-Company Control</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 text-gray-400 hover:text-red-500 hover:bg-white rounded-2xl transition-all shadow-sm active:scale-90"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Selected Entity</label>
                    <select
                      required
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-gray-900 text-sm"
                      value={formData.company_id}
                      onChange={e => setFormData({ ...formData, company_id: e.target.value })}
                    >
                      <option value="">Select Company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Scope Category</label>
                    <select
                      required
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-gray-900 text-sm"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as any, type: '' })}
                    >
                      {COMPLIANCE_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.id}</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Obligation Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Annual Tax Submission FY24"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-gray-900 text-sm"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Specific Type</label>
                    <div className="relative">
                      <input
                        list="type-suggestions"
                        placeholder="Select or type..."
                        className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-gray-900 text-sm"
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                      />
                      <datalist id="type-suggestions">
                         {formData.category === 'SARS' && SARS_TYPES.map(t => <option key={t} value={t} />)}
                         {formData.category === 'CIPC' && CIPC_TYPES.map(t => <option key={t} value={t} />)}
                         {formData.category === 'Labour' && LABOUR_TYPES.map(t => <option key={t} value={t} />)}
                         {formData.category === 'POPIA' && POPIA_TYPES.map(t => <option key={t} value={t} />)}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Severity / Priority</label>
                    <select
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-gray-900 text-sm"
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                    >
                      <option value="Low">Low - Informational</option>
                      <option value="Medium">Medium - Required</option>
                      <option value="High">High - Legal Risk</option>
                      <option value="Critical">Critical - Urgent/Penalties</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Deadline Date</label>
                    <input
                      required
                      type="date"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-gray-900 text-sm"
                      value={formData.due_date}
                      onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Workflow Status</label>
                    <select
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-gray-900 text-sm"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="Pending">Pending Audit</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Submitted">Submitted / Filed</option>
                      <option value="Completed">Completed / Verified</option>
                      <option value="Overdue">Overdue Risk</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Linked Document (Evidence)</label>
                    <div className="relative">
                       <select
                          className="w-full px-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-gray-900 text-sm appearance-none"
                          value={formData.linked_document_id}
                          onChange={e => setFormData({ ...formData, linked_document_id: e.target.value })}
                       >
                          <option value="">No Evidence Linked</option>
                          {documents.filter(d => !formData.company_id || d.company_id === formData.company_id).map(d => (
                            <option key={d.id} value={d.id}>{d.title} ({d.category})</option>
                          ))}
                       </select>
                       <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    
                    {/* Display linked document evidence details */}
                    {formData.linked_document_id && (
                      <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                        {(() => {
                          const linkedDoc = documents.find(d => d.id === formData.linked_document_id);
                          if (!linkedDoc) return <p className="text-[10px] font-bold text-red-500 uppercase">Document not found in vault</p>;
                          return (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="p-2 bg-white rounded-xl shadow-sm mr-3">
                                  <FileText className="h-4 w-4 text-indigo-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-black text-gray-900">{linkedDoc.title}</p>
                                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                                    {linkedDoc.category} • {linkedDoc.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
                                  </p>
                                </div>
                              </div>
                              {linkedDoc.fileUrl && (
                                <a 
                                  href={`#view-${linkedDoc.id}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    // Normally we'd use handleDownload from Documents.tsx but here we can just show a link or similar
                                    // For now, let's just show an indicator
                                    alert('To view/download evidence, please visit the Document Vault.');
                                  }}
                                  className="p-2 text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Internal Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Add internal context, reference numbers, or filing notes..."
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-bold text-gray-900 text-sm"
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-8 py-4 border border-gray-200 text-gray-500 rounded-2xl hover:bg-gray-50 transition-all font-black uppercase text-xs tracking-widest"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all font-black uppercase text-xs tracking-widest flex items-center justify-center disabled:opacity-50 shadow-xl"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (isEditMode ? 'Verify Changes' : 'Confirm Entry')}
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden p-8"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-xl">
                  <Trash2 className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">Purge Record?</h3>
                <p className="text-gray-500 font-medium">
                  Are you sure you want to delete <span className="font-bold text-gray-900">{itemToDelete?.title}</span>? 
                  This will remove the obligation from the group register.
                </p>
              </div>
              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-4 border border-gray-100 text-gray-400 rounded-2xl hover:bg-gray-50 transition-all font-black uppercase text-xs tracking-widest"
                >
                  Retain
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-black uppercase text-xs tracking-widest flex items-center justify-center shadow-lg active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Purge'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
