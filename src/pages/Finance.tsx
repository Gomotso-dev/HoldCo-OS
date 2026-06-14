import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from '../components/EmptyState';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Building2, 
  Calendar,
  MoreHorizontal,
  Download,
  ArrowRightLeft,
  Loader2,
  X,
  Trash2,
  Edit3,
  AlertCircle,
  FileText,
  PieChart as PieChartIcon,
  ChevronRight,
  Info,
  Link as LinkIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { SafeChart } from '../components/SafeChart';
import { ActivityLogService } from '../services/activityLogService';
import { FinanceTransaction, Company, TransactionType, Document } from '../types';
import { format, subDays, startOfMonth, startOfQuarter, startOfYear, isWithinInterval } from 'date-fns';

interface TransactionWithCompany extends FinanceTransaction {
  companies: {
    name: string;
  };
  relatedCompany?: {
    name: string;
  };
}

const TRANSACTION_TYPES: TransactionType[] = [
  'Income', 'Expense', 'Transfer', 'Loan', 'Investment', 'Tax', 'Salary'
];

const INCOME_CATEGORIES = [
  'Sales', 
  'Services', 
  'Investor Funding', 
  'Loan Received', 
  'Shareholder Contribution', 
  'Refund Received',
  'Other Income'
];

const EXPENSE_CATEGORIES = [
  'Rent', 
  'Salaries', 
  'Software', 
  'Compliance', 
  'Legal', 
  'Tax', 
  'Travel', 
  'Utilities', 
  'Marketing', 
  'Office Supplies', 
  'Bank Charges', 
  'Reimbursement',
  'Other Expense'
];

const INTERCOMPANY_CATEGORIES = [
  'Intercompany Funding', 
  'Internal Loan', 
  'Shared Cost Recovery', 
  'Capital Injection',
  'Internal Transfer'
];

export default function Finance() {
  const [transactions, setTransactions] = useState<TransactionWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [viewScope, setViewScope] = useState<'all' | 'single'>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'30d' | '3m' | '6m' | '1y'>('3m');
  const [filterMode, setFilterMode] = useState<'all' | 'intercompany' | 'compliance' | 'docs'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<TransactionWithCompany | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<TransactionWithCompany | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    company_id: '',
    related_company_id: '',
    intercompany: false,
    compliance: false,
    date: new Date().toISOString().split('T')[0],
    type: 'Income' as TransactionType,
    category: INCOME_CATEGORIES[0],
    amount: '',
    description: '',
    payment_method: 'EFT',
    counterparty: '',
    reference_number: '',
    linked_document_id: '',
    notes: ''
  });

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Parallel fetch for better performance
      const [companiesRes, docsRes] = await Promise.all([
        supabase.from('companies').select('*').eq('owner_id', user.id).order('name'),
        supabase.from('documents').select('*').eq('owner_id', user.id).order('title')
      ]);

      if (companiesRes.error) throw companiesRes.error;
      if (docsRes.error) throw docsRes.error;

      setCompanies(companiesRes.data || []);
      setDocuments(docsRes.data || []);
      
      // 3. Fetch Transactions
      const financeRes = await supabase
        .from('finance')
        .select('*, companies!company_id(name)')
        .eq('owner_id', user.id)
        .order('date', { ascending: false });

      if (financeRes.error) {
        console.error('Finance fetch error:', financeRes.error);
        throw financeRes.error;
      }

      const txs = financeRes.data || [];
      // Enrich with related company name if intercompany
      const enrichedTxs = txs.map((tx: any) => {
        if (tx.related_company_id) {
          const relComp = (companiesRes.data || []).find(c => c.id === tx.related_company_id);
          return { ...tx, related_company: relComp ? { name: relComp.name } : undefined };
        }
        return tx;
      });

      setTransactions(enrichedTxs);
    } catch (err: any) {
      console.error('Error fetching data:', err.message);
      setError('Failed to load financial data.');
    } finally {
      setLoading(false);
    }
  }

  const handleTypeChange = (type: TransactionType) => {
    let category = '';
    if (type === 'Income') category = INCOME_CATEGORIES[0];
    else if (type === 'Expense') category = EXPENSE_CATEGORIES[0];
    else if (type === 'Transfer') category = INTERCOMPANY_CATEGORIES[0];
    else category = 'Other';

    setFormData({ 
      ...formData, 
      type, 
      category,
      intercompany: type === 'Transfer' || formData.intercompany 
    });
  };

  function closeModal() {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingTxId(null);
    setFormData({
      company_id: '',
      related_company_id: '',
      intercompany: false,
      compliance: false,
      date: new Date().toISOString().split('T')[0],
      type: 'Income',
      category: INCOME_CATEGORIES[0],
      amount: '',
      description: '',
      payment_method: 'EFT',
      counterparty: '',
      reference_number: '',
      linked_document_id: '',
      notes: ''
    });
  }

  function openEditModal(tx: TransactionWithCompany) {
    setIsEditMode(true);
    setEditingTxId(tx.id);
    setFormData({
      company_id: tx.company_id,
      related_company_id: tx.related_company_id || '',
      intercompany: tx.intercompany || false,
      compliance: tx.compliance || false,
      date: tx.date,
      type: tx.type,
      category: tx.category,
      amount: tx.amount.toString(),
      description: tx.description,
      payment_method: tx.payment_method,
      counterparty: tx.counterparty || '',
      reference_number: tx.reference_number || '',
      linked_document_id: tx.linked_document_id || '',
      notes: tx.notes || ''
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount greater than 0.');
      }

      const payload = {
    company_id: formData.company_id,
    related_company_id: formData.intercompany ? formData.related_company_id || null : null,
    intercompany: formData.intercompany,
    compliance: formData.compliance || ['Tax', 'Compliance', 'Legal'].includes(formData.category) || formData.type === 'Tax',
    date: formData.date,
    type: formData.type,
    category: formData.category,
    amount: amount,
    description: formData.description,
    payment_method: formData.payment_method,
    counterparty: formData.counterparty || null,
    reference_number: formData.reference_number || null,
    linked_document_id: formData.linked_document_id || null,
    notes: formData.notes || null,
    owner_id: user.id,
    created_at: new Date().toISOString()
  };

      const { data, error } = isEditMode && editingTxId
        ? await supabase
            .from('finance')
            .update({
              ...payload,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingTxId)
            .eq('owner_id', user.id)
            .select()
            .single()
        : await supabase
            .from('finance')
            .insert([{
              ...payload,
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();

      if (error) throw error;

      if (data) {
          ActivityLogService.logActivity({
            action_type: isEditMode ? 'finance_updated' : 'finance_created',
            description: isEditMode 
              ? `Updated ${data.type.toLowerCase()}: R ${data.amount.toLocaleString()} - ${data.description}`
              : `Logged ${data.type.toLowerCase()}: R ${data.amount.toLocaleString()} - ${data.description}`,
            company_id: data.company_id
          });
      }

      closeModal();
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!txToDelete) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('finance')
        .delete()
        .eq('id', txToDelete.id);

      if (error) throw error;

      ActivityLogService.logActivity({
        action_type: 'finance_deleted',
        description: `Deleted transaction: ${txToDelete.description}`,
        company_id: txToDelete.company_id
      });
      setIsDeleteModalOpen(false);
      setTxToDelete(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Memoized calculations
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesCompany = viewScope === 'all' || selectedCompanyId === 'all' || tx.company_id === selectedCompanyId;
      const matchesSearch = 
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.companies?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.counterparty || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = 
        (!dateRange.start || tx.date >= dateRange.start) &&
        (!dateRange.end || tx.date <= dateRange.end);
      
      const matchesFilterMode = 
        filterMode === 'all' ? true :
        filterMode === 'intercompany' ? tx.intercompany :
        filterMode === 'compliance' ? tx.compliance :
        filterMode === 'docs' ? !!tx.linked_document_id : true;
      
      return matchesCompany && matchesSearch && matchesDate && matchesFilterMode;
    });
  }, [transactions, viewScope, selectedCompanyId, searchTerm, dateRange, filterMode]);

  const stats = useMemo(() => {
    if (!filteredTransactions.length && !companies.length) {
      return { income: 0, expenses: 0, intercompany: 0, netFlow: 0, complianceSpend: 0, activeCompanies: 0, negativeFlowCompanies: 0, companyPerformance: [] };
    }

    const income = filteredTransactions
      .filter(t => t.type === 'Income' || t.type === 'Investment' || (t.type === 'Loan' && t.amount > 0))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'Expense' || t.type === 'Tax' || t.type === 'Salary' || t.type === 'Bank Charge')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const intercompany = filteredTransactions
      .filter(t => t.intercompany)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const netFlow = income - expenses;
    
    // Compliance spend
    const complianceSpend = filteredTransactions
      .filter(t => t.compliance || t.category === 'Compliance' || t.category === 'Tax' || t.category === 'Legal' || t.type === 'Tax')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const activeCompanies = new Set(filteredTransactions.map(t => t.company_id)).size;
    
    const companyPerformance = (companies || []).map(c => {
      const companyTxs = filteredTransactions.filter(t => t.company_id === c.id);
      const inc = companyTxs
        .filter(t => t.type === 'Income' || t.type === 'Investment')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const exp = companyTxs
        .filter(t => t.type === 'Expense' || t.type === 'Tax' || t.type === 'Salary')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      return {
        id: c.id,
        name: c.name,
        income: inc,
        expenses: exp,
        net: inc - exp
      };
    }).sort((a, b) => b.income - a.income);

    const negativeFlowCompanies = companyPerformance.filter(c => c.net < 0).length;

    return { income, expenses, intercompany, netFlow, complianceSpend, activeCompanies, negativeFlowCompanies, companyPerformance };
  }, [filteredTransactions, companies]);

  const chartData = useMemo(() => {
    if (!filteredTransactions.length) return [];

    const sorted = [...filteredTransactions]
      .filter(tx => !!tx.date)
      .sort((a, b) => a.date.localeCompare(b.date));
      
    const dataByDate: Record<string, { date: string, income: number, expense: number, net: number }> = {};
    
    sorted.forEach(tx => {
      const date = tx.date;
      if (!dataByDate[date]) {
        dataByDate[date] = { date, income: 0, expense: 0, net: 0 };
      }
      
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'Income' || tx.type === 'Investment') {
        dataByDate[date].income += amt;
      } else if (tx.type === 'Expense' || tx.type === 'Tax' || tx.type === 'Salary') {
        dataByDate[date].expense += amt;
      }
      dataByDate[date].net = dataByDate[date].income - dataByDate[date].expense;
    });

    return Object.values(dataByDate);
  }, [filteredTransactions]);

  function exportToCSV() {
    if (filteredTransactions.length === 0) return;

    const headers = [
      'Date', 'Company', 'Type', 'Category', 'Amount', 
      'Description', 'Counterparty', 'Payment Method', 'Reference',
      'Intercompany', 'Related Company', 'Compliance', 'Notes'
    ];
    const rows = filteredTransactions.map(tx => [
      tx.date,
      tx.companies?.name,
      tx.type,
      tx.category,
      tx.amount,
      tx.description,
      tx.counterparty || '',
      tx.payment_method,
      tx.reference_number || '',
      tx.intercompany ? 'Yes' : 'No',
      tx.related_company?.name || '',
      tx.compliance ? 'Yes' : 'No',
      tx.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `finance_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Finance Tracker</h2>
          <p className="text-gray-500 mt-1 text-sm font-medium">Group-wide financial control and transaction visibility.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="hidden sm:flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Download className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-semibold text-sm">Export</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="h-5 w-5 mr-2" />
            <span className="font-semibold text-sm">Log Transaction</span>
          </button>
        </div>
      </div>

      {/* Scope and Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex p-1 bg-gray-50 rounded-xl w-fit border border-gray-100">
          <button
            onClick={() => { setViewScope('all'); setSelectedCompanyId('all'); }}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
              viewScope === 'all' 
                ? "bg-white text-indigo-700 shadow-sm border border-indigo-100" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            All Companies
          </button>
          <button
            onClick={() => setViewScope('single')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
              viewScope === 'single' 
                ? "bg-white text-indigo-700 shadow-sm border border-indigo-100" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Single Company
          </button>
        </div>

        {viewScope === 'single' && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <select
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:ring-indigo-500 focus:border-indigo-500 min-w-[200px]"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
            >
              <option value="all">Select Company</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex p-1 bg-gray-50 rounded-xl w-fit border border-gray-100 ml-auto">
          {(['30d', '3m', '6m', '1y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all uppercase tracking-wider",
                timeRange === r 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

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

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all border-b-4 border-b-emerald-500"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
              Revenue
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-0.5">Total Income</p>
          <p className="text-3xl font-black text-gray-900 mt-1 tabular-nums">
            R {loading ? '...' : stats.income.toLocaleString()}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all border-b-4 border-b-red-500"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-2xl text-red-600 group-hover:scale-110 transition-transform">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
              Outflow
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-0.5">Total Expenses</p>
          <p className="text-3xl font-black text-gray-900 mt-1 tabular-nums">
            R {loading ? '...' : stats.expenses.toLocaleString()}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-indigo-600 p-6 rounded-3xl border border-indigo-700 shadow-xl relative overflow-hidden group hover:bg-black transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-2xl text-white group-hover:scale-110 transition-transform">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="flex items-center text-[10px] font-black text-white/50 uppercase tracking-widest bg-black/20 px-2 py-1 rounded-lg">
              Net Flow
            </div>
          </div>
          <p className="text-xs font-bold text-white/60 uppercase tracking-widest px-0.5">Net cash flow</p>
          <p className="text-3xl font-black text-white mt-1 tabular-nums">
            R {loading ? '...' : stats.netFlow.toLocaleString()}
          </p>
          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
            <Wallet className="h-32 w-32 text-white" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all border-b-4 border-b-blue-500"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
              <ArrowRightLeft className="h-6 w-6" />
            </div>
            <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
              Internal
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-0.5 whitespace-nowrap">Intercompany Movement</p>
          <p className="text-3xl font-black text-blue-700 mt-1 tabular-nums font-mono">
            R {loading ? '...' : stats.intercompany.toLocaleString()}
          </p>
        </motion.div>
      </div>

      {/* Launcher Indicators - Secondary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                <AlertCircle className="h-6 w-6" />
            </div>
            <div>
                <p className="text-sm font-black text-gray-900">{stats.negativeFlowCompanies} Companies</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Negative Net Flow This Period</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Building2 className="h-6 w-6" />
            </div>
            <div>
                <p className="text-sm font-black text-gray-900">{stats.activeCompanies} Active Entities</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Generating Transactions</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                <FileText className="h-6 w-6" />
            </div>
            <div>
                <p className="text-sm font-black text-gray-900">R {stats.complianceSpend.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tax & Compliance Overhead</p>
            </div>
        </div>
      </div>

      {/* Visual Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
              Financial Trend Analysis
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Income</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expense</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <SafeChart height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                    tickFormatter={(val) => format(new Date(val), 'MMM dd')}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                    tickFormatter={(val) => `R${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                    itemStyle={{ padding: '0px' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
            </SafeChart>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-indigo-600" />
              Company Leaderboard
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Relative performance ranking</p>
          </div>
          
          <div className="space-y-4 flex-1">
            {stats.companyPerformance.slice(0, 5).map((cp, idx) => (
                <div key={cp.id} className="group cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-gray-300 w-4">#0{idx + 1}</span>
                            <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors uppercase tracking-tight line-clamp-1">{cp.name}</span>
                        </div>
                        <span className="text-xs font-black text-gray-900 tabular-nums">R {cp.income.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-600 group-hover:bg-indigo-500 transition-all rounded-full"
                            style={{ width: `${Math.max(10, Math.min(100, (cp.income / (stats.income || 1)) * 100))}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-1 px-0.5">
                        <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span className={cn(cp.net >= 0 ? "text-emerald-500" : "text-red-500")}>
                                {cp.net >= 0 ? '+' : ''} R {cp.net.toLocaleString()}
                            </span>
                            <span className="mx-1 opacity-20">|</span>
                            <span>Net Flow</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-gray-200 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                </div>
            ))}
            {stats.companyPerformance.length === 0 && (
                <div className="py-12">
                  <EmptyState
                    icon={TrendingUp}
                    title="No performance data"
                    description="Performance metrics will appear here once you've logged transactions for your companies."
                    className="border-none p-0 bg-transparent"
                  />
                </div>
            )}
          </div>
          
          <button 
            onClick={() => setViewScope('single')}
            className="w-full mt-6 py-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold text-xs hover:bg-white transition-all flex items-center justify-center group"
          >
            Switch to Entity View
            <ArrowRightLeft className="ml-2 h-3 w-3 text-gray-400 group-hover:rotate-180 transition-transform" />
          </button>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by description, company, reference, counterparty..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex p-1 bg-white rounded-2xl border border-gray-200 shadow-sm h-fit">
               <button 
                  onClick={() => setFilterMode('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                    filterMode === 'all' ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
                  )}
               >
                 All
               </button>
               <button 
                  onClick={() => setFilterMode('intercompany')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                    filterMode === 'intercompany' ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50 text-blue-600/70"
                  )}
               >
                 Intercompany
               </button>
               <button 
                  onClick={() => setFilterMode('compliance')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                    filterMode === 'compliance' ? "bg-amber-500 text-white" : "text-gray-500 hover:bg-gray-50 text-amber-600/70"
                  )}
               >
                 Compliance
               </button>
               <button 
                  onClick={() => setFilterMode('docs')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                    filterMode === 'docs' ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50 text-emerald-600/70"
                  )}
               >
                 With Docs
               </button>
            </div>

            <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
              <input
                type="date"
                className="px-3 py-2 border-none bg-transparent rounded-xl text-xs font-bold text-gray-600 focus:ring-0"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
              <span className="text-gray-300">/</span>
              <input
                type="date"
                className="px-3 py-2 border-none bg-transparent rounded-xl text-xs font-bold text-gray-600 focus:ring-0"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
              {(dateRange.start || dateRange.end) && (
                <button 
                  onClick={() => setDateRange({ start: '', end: '' })}
                  className="p-1 px-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <button className="flex items-center px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-50 transition-all font-bold text-sm shadow-sm">
              <Filter className="h-4 w-4 mr-2" />
              <span>More Filters</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-600" />
              <p className="font-semibold text-lg">Analyzing financial records...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Details</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Links</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest text-indigo-600">Action</th>
                  </tr>
                </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                  {filteredTransactions.map((tx, index) => (
                    <motion.tr 
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{format(new Date(tx.date), 'MMM dd')}</span>
                          <span className="text-[10px] font-bold text-gray-400">{format(new Date(tx.date), 'yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{tx.companies?.name}</p>
                            {tx.intercompany && tx.relatedCompany && (
                                <div className="flex items-center text-[10px] font-bold text-blue-600 mt-0.5">
                                    <ArrowRightLeft className="h-2 w-2 mr-1" />
                                    <span>TO: {tx.relatedCompany.name}</span>
                                </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                             <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm",
                                tx.type === 'Income' ? "bg-emerald-500 text-white" :
                                tx.type === 'Expense' ? "bg-red-500 text-white" :
                                tx.type === 'Transfer' ? "bg-blue-600 text-white" : "bg-gray-400 text-white"
                             )}>
                               {tx.type}
                             </span>
                             <span className="text-xs font-bold text-gray-900 line-clamp-1">{tx.description}</span>
                          </div>
                          <div className="flex items-center text-[10px] font-bold text-gray-400 mt-1 space-x-2">
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{tx.category}</span>
                            <span>•</span>
                            <span className="uppercase tracking-wider">{tx.payment_method}</span>
                            {tx.counterparty && (
                                <>
                                    <span>•</span>
                                    <span className="text-indigo-600 uppercase tracking-widest">{tx.counterparty}</span>
                                </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                            {tx.linked_document_id ? (
                                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm" title="Linked Document">
                                    <FileText className="h-4 w-4" />
                                </div>
                            ) : (
                                <div className="p-1.5 bg-gray-50 rounded-lg text-gray-300 border border-dashed border-gray-200" title="No Document Linked">
                                    <FileText className="h-4 w-4" />
                                </div>
                            )}
                            {tx.intercompany && (
                                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 shadow-sm" title="Intercompany Transfer">
                                    <ArrowRightLeft className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex flex-col items-end">
                            <span className={cn(
                                "text-base font-black tabular-nums",
                                tx.type === 'Income' ? "text-emerald-600" : 
                                tx.type === 'Expense' ? "text-red-600" : "text-gray-900"
                            )}>
                                {tx.type === 'Income' ? '+' : tx.type === 'Expense' ? '-' : ''}
                                R {tx.amount.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">{tx.reference_number || 'NO REF'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(tx);
                                }}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Edit"
                            >
                                <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setTxToDelete(tx);
                                    setIsDeleteModalOpen(true);
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTx(tx);
                                }}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 m-6">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <Wallet className="h-10 w-10 text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No transactions synced</h3>
              <p className="text-gray-500 mt-2 max-w-sm mx-auto text-sm">
                Begin tracking your group's financial performance by logging your first transaction.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-8 inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Plus className="h-5 w-5 mr-2" />
                Log First Transaction
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Log Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{isEditMode ? 'Modify Audit Entry' : 'Log Transaction'}</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Financial Operations Audit</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 text-gray-400 hover:text-gray-900 hover:bg-white rounded-2xl transition-all shadow-sm active:scale-90"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                <div className="space-y-6">
                  {/* Scope Definition */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Transaction Actor</h4>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Originator Company</label>
                            <select
                                required
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-gray-900 transition-all"
                                value={formData.company_id}
                                onChange={e => setFormData({ ...formData, company_id: e.target.value })}
                            >
                                <option value="">Select Company</option>
                                {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                         </div>
                         <div className="flex items-center space-x-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                            <input
                                type="checkbox"
                                id="intercompany-toggle"
                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                checked={formData.intercompany}
                                onChange={(e) => setFormData({ ...formData, intercompany: e.target.checked, type: e.target.checked ? 'Transfer' : formData.type })}
                            />
                            <label htmlFor="intercompany-toggle" className="text-sm font-bold text-indigo-900 cursor-pointer user-select-none">
                                Intercompany Transaction
                            </label>
                         </div>
                         <div className="flex items-center space-x-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                            <input
                                type="checkbox"
                                id="compliance-toggle"
                                className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                                checked={formData.compliance}
                                onChange={(e) => setFormData({ ...formData, compliance: e.target.checked })}
                            />
                            <label htmlFor="compliance-toggle" className="text-sm font-bold text-amber-900 cursor-pointer user-select-none">
                                Compliance / Tax Related
                            </label>
                         </div>
                         {formData.intercompany && (
                             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Related Company</label>
                                  <select
                                      required
                                      className="w-full px-5 py-3 bg-blue-50 border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-gray-900 transition-all"
                                      value={formData.related_company_id}
                                      onChange={e => setFormData({ ...formData, related_company_id: e.target.value })}
                                  >
                                      <option value="">Select Related Entity</option>
                                      {companies.filter(c => c.id !== formData.company_id).map(c => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                      ))}
                                  </select>
                                </div>
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                                  <label className="block text-[10px] font-black text-blue-600 mb-2 uppercase tracking-widest">Internal Transfer Type</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {['Internal Loan', 'Funding', 'Reimbursement', 'Cost Recovery'].map(subType => (
                                      <button
                                        key={subType}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, category: subType === 'Funding' ? 'Intercompany Funding' : subType === 'Cost Recovery' ? 'Shared Cost Recovery' : subType })}
                                        className={cn(
                                          "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all",
                                          (formData.category.includes(subType) || (formData.category === 'Intercompany Funding' && subType === 'Funding'))
                                            ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                                            : "bg-white text-blue-600 border-blue-100 hover:bg-blue-50"
                                        )}
                                      >
                                        {subType}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                             </motion.div>
                         )}
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Details & Timing</h4>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Financial Date</label>
                            <input
                                required
                                type="date"
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-gray-900 transition-all"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Operation Type</label>
                            <select
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-gray-900 transition-all"
                                value={formData.type}
                                onChange={e => handleTypeChange(e.target.value as TransactionType)}
                            >
                                {TRANSACTION_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Amount (ZAR)</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400">R</span>
                        <input
                            required
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full pl-10 pr-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-black text-gray-900 tabular-nums transition-all text-lg"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Classification</label>
                      <select
                        required
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-gray-900 transition-all"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                      >
                         {formData.type === 'Income' && INCOME_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                         {formData.type === 'Expense' && EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                         {formData.type === 'Transfer' && INTERCOMPANY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                         {!['Income', 'Expense', 'Transfer'].includes(formData.type) && <option value="Other">Other</option>}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Operational Description</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Sales Revenue Q1 - SaaS"
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-gray-900 transition-all"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Counterparty / Payee</label>
                        <input
                            type="text"
                            placeholder="Entity or individual name"
                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-gray-900 transition-all"
                            value={formData.counterparty}
                            onChange={e => setFormData({ ...formData, counterparty: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Document Evidence</label>
                        <select
                            className="w-full px-5 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 font-bold text-gray-700 transition-all text-sm"
                            value={formData.linked_document_id}
                            onChange={e => setFormData({ ...formData, linked_document_id: e.target.value })}
                        >
                            <option value="">No Document Linked</option>
                            {documents.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.title}</option>
                            ))}
                        </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Payment Method</label>
                      <select
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-gray-900 transition-all"
                        value={formData.payment_method}
                        onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                      >
                        <option value="EFT">Electronic Funds Transfer (EFT)</option>
                        <option value="Debit Order">Direct Debit</option>
                        <option value="Credit Card">Corp Credit Card</option>
                        <option value="Cash">Petty Cash</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Reference / Invoice #</label>
                      <input
                        type="text"
                        placeholder="Internal or external reference"
                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-gray-900 transition-all"
                        value={formData.reference_number}
                        onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-8 py-4 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-bold group"
                  >
                    Discard Entry
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all font-black flex items-center justify-center disabled:opacity-50 shadow-xl hover:shadow-2xl active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : isEditMode ? 'Update Audit Entry' : 'Confirm & Log Audit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[70] flex items-center justify-end bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto border-l border-gray-200"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                            selectedTx.type === 'Income' ? "bg-emerald-50 text-emerald-600" :
                            selectedTx.type === 'Expense' ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"
                        )}>
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight line-clamp-1">{selectedTx.description}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Audit # {selectedTx.id.split('-')[0]}</p>
                        </div>
                    </div>
                    <button 
                      onClick={() => setSelectedTx(null)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                    >
                      <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Value</span>
                        <span className={cn(
                            "text-2xl font-black tabular-nums",
                            selectedTx.type === 'Income' ? "text-emerald-600" : "text-gray-900"
                        )}>
                            R {selectedTx.amount.toLocaleString()}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                            <p className="text-xs font-bold text-gray-900">{format(new Date(selectedTx.date), 'dd MMMM yyyy')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Company</p>
                            <p className="text-xs font-bold text-indigo-600">{selectedTx.companies?.name}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 border-b pb-2">Business Meaning</h4>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <span className="text-xs font-bold text-gray-500">Operation Type</span>
                            <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">{selectedTx.type}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <span className="text-xs font-bold text-gray-500">Classification</span>
                            <span className="text-xs font-bold text-gray-900">{selectedTx.category}</span>
                        </div>
                        {selectedTx.intercompany && (
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center">
                                    <ArrowRightLeft className="h-3 w-3 mr-1" />
                                    Intercompany Flow
                                </p>
                                <p className="text-xs font-bold text-blue-900">
                                    Funds {selectedTx.type === 'Transfer' ? 'transferred to' : 'related to'} <span className="underline">{selectedTx.relatedCompany?.name || 'Group Entity'}</span>
                                </p>
                                <p className="text-[10px] text-blue-500 mt-1 uppercase tracking-widest font-black">Transfer logic: {selectedTx.category}</p>
                            </div>
                        )}
                        {selectedTx.compliance && (
                             <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl">
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Compliance Critical
                                </p>
                                <p className="text-xs font-bold text-amber-900">
                                    This transaction is flagged for professional audit (Tax/Legal/Statutory).
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 border-b pb-2">Full Audit Trail</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Counterparty</span>
                            <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{selectedTx.counterparty || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Method</span>
                            <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{selectedTx.payment_method}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference Number</span>
                            <span className="text-xs font-black text-indigo-600 font-mono tracking-tighter truncate max-w-[200px]">{selectedTx.reference_number || 'None provided'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logged At</span>
                            <span className="text-[10px] font-bold text-gray-500">{selectedTx.created_at ? format(new Date(selectedTx.created_at), 'dd MMM yyyy, HH:mm') : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {selectedTx.linked_document_id && documents.find(d => d.id === selectedTx.linked_document_id) && (
                    <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-between group cursor-pointer hover:bg-emerald-100 transition-all">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-900">Supporting Evidence</p>
                                <p className="text-[10px] font-bold text-emerald-600 tracking-tight line-clamp-1">{documents.find(d => d.id === selectedTx.linked_document_id)?.title}</p>
                            </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                )}

                {selectedTx.notes && (
                    <div className="p-6 bg-yellow-50 rounded-3xl border border-yellow-100">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center">
                            <Info className="h-3 w-3 mr-1" />
                            Internal Controller Notes
                        </p>
                        <p className="text-xs text-amber-900 leading-relaxed italic">
                            "{selectedTx.notes}"
                        </p>
                    </div>
                )}

                <div className="pt-8 border-t border-gray-100 flex space-x-3">
                    <button 
                        onClick={() => {
                            setTxToDelete(selectedTx);
                            setSelectedTx(null);
                            setIsDeleteModalOpen(true);
                        }}
                        className="flex-1 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-all flex items-center justify-center"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Purge Transaction
                    </button>
                    <button 
                        onClick={() => setSelectedTx(null)}
                        className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all"
                    >
                        Close Inspector
                    </button>
                </div>
              </div>
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
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 transform -rotate-3 border border-red-100">
                  <Trash2 className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-4">Purge Record?</h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">
                  You are about to delete <span className="font-bold text-gray-900">"{txToDelete?.description}"</span>. 
                  This will remove the transaction from group audit history.
                  <br /><br />
                  This action is irreversible.
                </p>
              </div>
              <div className="flex gap-3 p-8 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-bold flex items-center justify-center disabled:opacity-50 shadow-lg"
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
