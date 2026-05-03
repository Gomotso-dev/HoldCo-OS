import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, 
  ArrowLeft, 
  Edit3, 
  Upload, 
  Plus, 
  FileText, 
  Users, 
  ShieldCheck, 
  Calendar, 
  Wallet, 
  Activity,
  ChevronRight,
  CheckCircle2,
  Clock,
  Download,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Trash2,
  ClipboardList
} from 'lucide-react';
import { cn, formatRelativeTime, formatDate, formatCurrency } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { ActivityLogService } from '../services/activityLogService';

// standardized logging helper using camelCase fields
const logCompanyActivity = (params: { eventType: 'create' | 'update' | 'delete', description: string, companyId?: string }) => 
  ActivityLogService.logActivity({ 
    actionType: (params.eventType === 'create' ? 'company_created' : 'company_updated') as any, 
    description: params.description, 
    companyId: params.companyId
  });
import { Company, ComplianceItem, Document, FinanceTransaction, Shareholder, Director, ActivityLog, BeneficialOwner, CompanyLegalType, CompanyGroupRole, CompanyStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { ComplianceSetupWizard } from '../components/companies/ComplianceSetupWizard';

const tabs = [
  { id: 'overview', name: 'Overview', icon: Building2 },
  { id: 'legal', name: 'Legal & Tax', icon: ShieldCheck },
  { id: 'ownership', name: 'Ownership', icon: Users },
  { id: 'documents', name: 'Documents', icon: FileText },
  { id: 'compliance', name: 'Compliance', icon: Calendar },
  { id: 'finance', name: 'Finance', icon: Wallet },
  { id: 'activity', name: 'Activity', icon: Activity },
];

export default function CompanyProfile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [company, setCompany] = useState<Company | null>(null);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [shareholders, setShareholders] = useState<any[]>([]);
  const [directors, setDirectors] = useState<any[]>([]);
  const [beneficialOwners, setBeneficialOwners] = useState<BeneficialOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isShareholderModalOpen, setIsShareholderModalOpen] = useState(false);
  const [isDirectorModalOpen, setIsDirectorModalOpen] = useState(false);
  const [isBeneficialOwnerModalOpen, setIsBeneficialOwnerModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShareholderEditMode, setIsShareholderEditMode] = useState(false);
  const [editingShareholderId, setEditingShareholderId] = useState<string | null>(null);
  const [isDirectorEditMode, setIsDirectorEditMode] = useState(false);
  const [editingDirectorId, setEditingDirectorId] = useState<string | null>(null);
  const [isBeneficialOwnerEditMode, setIsBeneficialOwnerEditMode] = useState(false);
  const [editingBeneficialOwnerId, setEditingBeneficialOwnerId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string;
    name: string;
    type: 'shareholder' | 'director' | 'beneficial_owner';
  } | null>(null);
  const [shareholderForm, setShareholderForm] = useState({
    name: '',
    type: 'Person' as 'Person' | 'Entity',
    ownershipPercentage: 0,
    shareClass: 'Ordinary',
    issueDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [directorForm, setDirectorForm] = useState({
    fullName: '',
    roleTitle: 'Director',
    appointmentDate: new Date().toISOString().split('T')[0],
    email: '',
    phone: ''
  });
  const [beneficialOwnerForm, setBeneficialOwnerForm] = useState({
    fullName: '',
    controlType: 'Direct Ownership',
    ownershipPercentage: 0,
    effectiveDate: new Date().toISOString().split('T')[0],
    status: 'Active' as 'Active' | 'Inactive',
    notes: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    tradingName: '',
    legalEntityType: 'Private Company (Pty) Ltd' as CompanyLegalType,
    groupRole: 'Operating Company' as CompanyGroupRole,
    registrationNumber: '',
    incorporationDate: '',
    financialYearEnd: 'February',
    taxNumber: '',
    vatNumber: '',
    payeNumber: '',
    uifNumber: '',
    status: 'Active' as CompanyStatus,
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchCompany();
      fetchCompliance();
      fetchDocuments();
      fetchFinance();
      fetchActivity();
      fetchOwnership();
    }
  }, [id]);

  async function fetchOwnership() {
    try {
      const [shRes, dirRes, boRes] = await Promise.all([
        supabase.from('shareholders').select('*').eq('companyId', id).order('ownershipPercentage', { ascending: false }),
        supabase.from('directors').select('*').eq('companyId', id).order('appointmentDate', { ascending: false }),
        supabase.from('beneficial_owners').select('*').eq('companyId', id).order('ownershipPercentage', { ascending: false })
      ]);
      
      if (shRes.error) {
        console.warn('Shareholders fetch failed, trying fallback...');
        const shFallback = await supabase.from('shareholders').select('*').eq('company_id', id).order('ownership_percentage', { ascending: false });
        setShareholders((shFallback.data || []).map((sh: any) => ({
          ...sh,
          companyId: sh.companyId || sh.company_id,
          ownershipPercentage: sh.ownershipPercentage || sh.ownership_percentage,
          shareClass: sh.shareClass || sh.share_class,
          issueDate: sh.issueDate || sh.issue_date
        })));
      } else {
        setShareholders(shRes.data || []);
      }

      if (dirRes.error) {
        console.warn('Directors fetch failed, trying fallback...');
        const dirFallback = await supabase.from('directors').select('*').eq('company_id', id).order('appointment_date', { ascending: false });
        setDirectors((dirFallback.data || []).map((dir: any) => ({
          ...dir,
          companyId: dir.companyId || dir.company_id,
          fullName: dir.fullName || dir.full_name,
          roleTitle: dir.roleTitle || dir.role_title,
          appointmentDate: dir.appointmentDate || dir.appointment_date,
          idNumber: dir.idNumber || dir.id_number,
          passportNumber: dir.passportNumber || dir.passport_number,
          resignationDate: dir.resignationDate || dir.resignation_date
        })));
      } else {
        setDirectors(dirRes.data || []);
      }

      if (boRes.error) {
        console.warn('Beneficial owners fetch failed, trying fallback...');
        const boFallback = await supabase.from('beneficial_owners').select('*').eq('company_id', id).order('ownership_percentage', { ascending: false });
        setBeneficialOwners((boFallback.data || []).map((bo: any) => ({
          ...bo,
          companyId: bo.companyId || bo.company_id,
          fullName: bo.fullName || bo.full_name,
          controlType: bo.controlType || bo.control_type,
          ownershipPercentage: bo.ownershipPercentage || bo.ownership_percentage,
          effectiveDate: bo.effectiveDate || bo.effective_date
        })));
      } else {
        setBeneficialOwners(boRes.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching ownership data:', err.message);
    }
  }

  async function fetchFinance() {
    try {
      const { data, error } = await supabase
        .from('finance')
        .select('*')
        .eq('companyId', id)
        .order('date', { ascending: false });

      if (error) {
        console.warn('Finance fetch failed, trying fallback...');
        const fallbackRes = await supabase
          .from('finance')
          .select('*')
          .eq('company_id', id)
          .order('date', { ascending: false });
        
        if (fallbackRes.error) throw fallbackRes.error;
        const mapped = (fallbackRes.data || []).map((tx: any) => ({
          ...tx,
          companyId: tx.companyId || tx.company_id,
          relatedCompanyId: tx.relatedCompanyId || tx.related_company_id,
          paymentMethod: tx.paymentMethod || tx.payment_method,
          referenceNumber: tx.referenceNumber || tx.reference_number,
          linkedDocumentId: tx.linkedDocumentId || tx.linked_document_id,
          createdAt: tx.createdAt || tx.created_at,
          updatedAt: tx.updatedAt || tx.updated_at
        }));
        setFinanceTransactions(mapped);
      } else {
        setFinanceTransactions(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching finance:', err.message);
    }
  }

  async function fetchDocuments() {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('companyId', id)
        .order('createdAt', { ascending: false });

      if (error) {
        console.warn('Documents fetch failed, trying fallback...');
        const fallbackRes = await supabase
          .from('documents')
          .select('*')
          .eq('company_id', id)
          .order('created_at', { ascending: false });
        
        if (fallbackRes.error) throw fallbackRes.error;
        const mapped = (fallbackRes.data || []).map((doc: any) => ({
          ...doc,
          companyId: doc.companyId || doc.company_id,
          fileUrl: doc.fileUrl || doc.file_url,
          createdAt: doc.createdAt || doc.created_at
        }));
        setDocuments(mapped);
      } else {
        setDocuments(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching documents:', err.message);
    }
  }

  async function fetchCompliance() {
    try {
      const { data, error } = await supabase
        .from('compliance')
        .select('*')
        .eq('companyId', id)
        .order('dueDate', { ascending: true });

      if (error) {
        console.warn('Compliance fetch failed, trying fallback...');
        const fallbackRes = await supabase
          .from('compliance')
          .select('*')
          .eq('company_id', id)
          .order('due_date', { ascending: true });
        
        if (fallbackRes.error) throw fallbackRes.error;
        const mapped = (fallbackRes.data || []).map((item: any) => ({
          ...item,
          companyId: item.companyId || item.company_id,
          dueDate: item.dueDate || item.due_date
        }));
        setComplianceItems(mapped);
      } else {
        setComplianceItems(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching compliance:', err.message);
    }
  }

  async function fetchActivity() {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('companyId', id)
        .order('createdAt', { ascending: false });

      if (error) {
        console.warn('Activity fetch failed, trying fallback...');
        const fallbackRes = await supabase
          .from('activity_log')
          .select('*')
          .eq('company_id', id)
          .order('created_at', { ascending: false });
        
        if (fallbackRes.error) throw fallbackRes.error;
        const mapped = (fallbackRes.data || []).map((log: any) => ({
          ...log,
          companyId: log.companyId || log.company_id,
          createdAt: log.createdAt || log.created_at
        }));
        setActivityLogs(mapped);
      } else {
        setActivityLogs(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching activity:', err.message);
    }
  }

  async function fetchCompany() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;
      setCompany(data);
      setEditFormData({
        name: data.name,
        tradingName: data.tradingName || '',
        legalEntityType: data.legalEntityType,
        groupRole: data.groupRole,
        registrationNumber: data.registrationNumber,
        incorporationDate: data.incorporationDate,
        financialYearEnd: data.financialYearEnd,
        taxNumber: data.taxNumber || '',
        vatNumber: data.vatNumber || '',
        payeNumber: data.payeNumber || '',
        uifNumber: data.uifNumber || '',
        status: data.status,
        notes: data.notes || '',
      });
    } catch (err: any) {
      console.error('Error fetching company:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Helper to get clean storage path from URL or path
  function getStoragePath(fileUrl: string) {
    if (!fileUrl) return '';
    if (fileUrl.includes('/storage/v1/object/')) {
      const parts = fileUrl.split('/documents/');
      return parts[parts.length - 1];
    }
    if (fileUrl.startsWith('documents/')) {
      return fileUrl.replace(/^documents\//, '');
    }
    return fileUrl;
  }

  async function handleDownload(doc: Document) {
    try {
      setDownloadingId(doc.id);
      const path = getStoragePath(doc.fileUrl);
      if (!path) throw new Error('Document path not found.');

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 60);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Failed to generate secure link.');

      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Could not open document: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleShareholderSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        companyId: id,
        name: shareholderForm.name,
        type: shareholderForm.type,
        ownershipPercentage: shareholderForm.ownershipPercentage,
        shareClass: shareholderForm.shareClass,
        issueDate: shareholderForm.issueDate,
        notes: shareholderForm.notes,
        owner_id: user.id
      };

      if (isShareholderEditMode && editingShareholderId) {
        const { error } = await supabase
          .from('shareholders')
          .update({
            ...payload,
            updatedAt: new Date().toISOString()
          })
          .eq('id', editingShareholderId)
          .eq('owner_id', user.id);

        if (error) throw error;

        await logCompanyActivity({
          eventType: 'update',
          description: `Updated shareholder info: ${shareholderForm.name}`,
          companyId: id
        });
      } else {
        const { error } = await supabase
          .from('shareholders')
          .insert([{
            ...payload,
            createdAt: new Date().toISOString()
          }]);

        if (error) throw error;
        
        await logCompanyActivity({
          eventType: 'create',
          description: `Added shareholder: ${shareholderForm.name}`,
          companyId: id
        });
      }

      setSuccess(`Shareholder "${shareholderForm.name}" successfully ${isShareholderEditMode ? 'updated' : 'added'}.`);
      closeShareholderModal();
      fetchOwnership();
    } catch (err: any) {
      console.error('Shareholder submission error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function closeShareholderModal() {
    setIsShareholderModalOpen(false);
    setIsShareholderEditMode(false);
    setEditingShareholderId(null);
    setShareholderForm({
      name: '',
      type: 'Person',
      ownershipPercentage: 0,
      shareClass: 'Ordinary',
      issueDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  }

  function openShareholderAddModal() {
    setIsShareholderEditMode(false);
    setEditingShareholderId(null);
    setShareholderForm({
      name: '',
      type: 'Person',
      ownershipPercentage: 0,
      shareClass: 'Ordinary',
      issueDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsShareholderModalOpen(true);
  }

  function openShareholderEditModal(sh: any) {
    setShareholderForm({
      name: sh.name,
      type: sh.type,
      ownershipPercentage: sh.ownershipPercentage,
      shareClass: sh.shareClass,
      issueDate: sh.issueDate,
      notes: sh.notes || ''
    });
    setEditingShareholderId(sh.id);
    setIsShareholderEditMode(true);
    setIsShareholderModalOpen(true);
  }

  async function handleDirectorSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        companyId: id,
        fullName: directorForm.fullName,
        roleTitle: directorForm.roleTitle,
        appointmentDate: directorForm.appointmentDate,
        email: directorForm.email,
        phone: directorForm.phone,
        owner_id: user.id
      };

      if (isDirectorEditMode && editingDirectorId) {
        const { error } = await supabase
          .from('directors')
          .update({
            ...payload,
            updatedAt: new Date().toISOString()
          })
          .eq('id', editingDirectorId)
          .eq('owner_id', user.id);

        if (error) throw error;

        await logCompanyActivity({
          eventType: 'update',
          description: `Updated director info: ${directorForm.fullName}`,
          companyId: id
        });
      } else {
        const { error } = await supabase
          .from('directors')
          .insert([{
            ...payload,
            createdAt: new Date().toISOString()
          }]);

        if (error) throw error;

        await logCompanyActivity({
          eventType: 'create',
          description: `Appointed director: ${directorForm.fullName}`,
          companyId: id
        });
      }

      setSuccess(`Director "${directorForm.fullName}" successfully ${isDirectorEditMode ? 'updated' : 'appointed'}.`);
      closeDirectorModal();
      fetchOwnership();
    } catch (err: any) {
      console.error('Director submission error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function closeDirectorModal() {
    setIsDirectorModalOpen(false);
    setIsDirectorEditMode(false);
    setEditingDirectorId(null);
    setDirectorForm({
      fullName: '',
      roleTitle: 'Director',
      appointmentDate: new Date().toISOString().split('T')[0],
      email: '',
      phone: ''
    });
  }

  function openDirectorAddModal() {
    setIsDirectorEditMode(false);
    setEditingDirectorId(null);
    setDirectorForm({
      fullName: '',
      roleTitle: 'Director',
      appointmentDate: new Date().toISOString().split('T')[0],
      email: '',
      phone: ''
    });
    setIsDirectorModalOpen(true);
  }

  function openDirectorEditModal(dir: any) {
    setDirectorForm({
      fullName: dir.fullName,
      roleTitle: dir.roleTitle,
      appointmentDate: dir.appointmentDate,
      email: dir.email || '',
      phone: dir.phone || ''
    });
    setEditingDirectorId(dir.id);
    setIsDirectorEditMode(true);
    setIsDirectorModalOpen(true);
  }

  async function handleDeleteShareholder(shId: string, shName: string) {
    setDeleteConfirmation({ id: shId, name: shName, type: 'shareholder' });
  }

  async function confirmDeleteShareholder(shId: string, shName: string) {
    try {
      const { error } = await supabase.from('shareholders').delete().eq('id', shId);
      if (error) throw error;
      await logCompanyActivity({
        eventType: 'delete',
        description: `Removed shareholder: ${shName}`,
        companyId: id
      });
      fetchOwnership();
      setDeleteConfirmation(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteDirector(dirId: string, dirName: string) {
    setDeleteConfirmation({ id: dirId, name: dirName, type: 'director' });
  }

  async function confirmDeleteDirector(dirId: string, dirName: string) {
    try {
      const { error } = await supabase.from('directors').delete().eq('id', dirId);
      if (error) throw error;
      await logCompanyActivity({
        eventType: 'delete',
        description: `Removed director: ${dirName}`,
        companyId: id
      });
      fetchOwnership();
      setDeleteConfirmation(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleBeneficialOwnerSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        companyId: id,
        fullName: beneficialOwnerForm.fullName,
        controlType: beneficialOwnerForm.controlType,
        ownershipPercentage: beneficialOwnerForm.ownershipPercentage,
        effectiveDate: beneficialOwnerForm.effectiveDate,
        status: beneficialOwnerForm.status,
        notes: beneficialOwnerForm.notes,
        owner_id: user.id
      };

      if (isBeneficialOwnerEditMode && editingBeneficialOwnerId) {
        const { error } = await supabase
          .from('beneficial_owners')
          .update({
            ...payload,
            updatedAt: new Date().toISOString()
          })
          .eq('id', editingBeneficialOwnerId)
          .eq('owner_id', user.id);

        if (error) throw error;

        await logCompanyActivity({
          eventType: 'update',
          description: `Updated beneficial owner info: ${beneficialOwnerForm.fullName}`,
          companyId: id
        });
      } else {
        const { error } = await supabase
          .from('beneficial_owners')
          .insert([{
            ...payload,
            createdAt: new Date().toISOString()
          }]);

        if (error) throw error;

        await logCompanyActivity({
          eventType: 'create',
          description: `Added beneficial owner: ${beneficialOwnerForm.fullName}`,
          companyId: id
        });
      }

      setSuccess(`Beneficial owner "${beneficialOwnerForm.fullName}" successfully ${isBeneficialOwnerEditMode ? 'updated' : 'added'}.`);
      closeBeneficialOwnerModal();
      fetchOwnership();
    } catch (err: any) {
      console.error('Beneficial owner submission error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function closeBeneficialOwnerModal() {
    setIsBeneficialOwnerModalOpen(false);
    setIsBeneficialOwnerEditMode(false);
    setEditingBeneficialOwnerId(null);
    setBeneficialOwnerForm({
      fullName: '',
      controlType: 'Direct Ownership',
      ownershipPercentage: 0,
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      notes: ''
    });
  }

  function openBeneficialOwnerAddModal() {
    setIsBeneficialOwnerEditMode(false);
    setEditingBeneficialOwnerId(null);
    setBeneficialOwnerForm({
      fullName: '',
      controlType: 'Direct Ownership',
      ownershipPercentage: 0,
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      notes: ''
    });
    setIsBeneficialOwnerModalOpen(true);
  }

  function openBeneficialOwnerEditModal(bo: any) {
    setBeneficialOwnerForm({
      fullName: bo.fullName,
      controlType: bo.controlType,
      ownershipPercentage: bo.ownershipPercentage,
      effectiveDate: bo.effectiveDate,
      status: bo.status,
      notes: bo.notes || ''
    });
    setEditingBeneficialOwnerId(bo.id);
    setIsBeneficialOwnerEditMode(true);
    setIsBeneficialOwnerModalOpen(true);
  }

  async function handleDeleteBeneficialOwner(boId: string, boName: string) {
    setDeleteConfirmation({ id: boId, name: boName, type: 'beneficial_owner' });
  }

  async function confirmDeleteBeneficialOwner(boId: string, boName: string) {
    try {
      const { error } = await supabase.from('beneficial_owners').delete().eq('id', boId);
      if (error) throw error;
      await logCompanyActivity({
        eventType: 'delete',
        description: `Removed beneficial owner: ${boName}`,
        companyId: id
      });
      fetchOwnership();
      setDeleteConfirmation(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('companies')
        .update({
          name: editFormData.name,
          tradingName: editFormData.tradingName || null,
          legalEntityType: editFormData.legalEntityType,
          groupRole: editFormData.groupRole,
          registrationNumber: editFormData.registrationNumber,
          incorporationDate: editFormData.incorporationDate,
          financialYearEnd: editFormData.financialYearEnd,
          taxNumber: editFormData.taxNumber || null,
          vatNumber: editFormData.vatNumber || null,
          payeNumber: editFormData.payeNumber || null,
          uifNumber: editFormData.uifNumber || null,
          status: editFormData.status,
          notes: editFormData.notes || null,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await ActivityLogService.logActivity({
        actionType: 'company_updated' as any,
        description: `Updated company details for ${editFormData.name}`,
        companyId: id as string
      });

      setIsEditModalOpen(false);
      fetchCompany();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-600" />
        <p>Loading company profile...</p>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Error loading company</h3>
        <p className="text-gray-500 mt-1">{error || 'Company not found'}</p>
        <Link to="/companies" className="mt-6 inline-flex items-center text-indigo-600 font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Register
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-3 rounded-2xl flex items-center space-x-3 shadow-xl backdrop-blur-sm"
        >
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-bold tracking-tight">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-4 hover:bg-emerald-100 p-1 rounded-full transition-colors">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link 
            to="/companies" 
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{company.name}</h2>
              <StatusBadge status={company.status} />
            </div>
            <p className="text-gray-400 font-mono text-xs mt-1 uppercase tracking-widest">{company.registrationNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center px-5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            <span className="text-xs font-black uppercase tracking-widest leading-none">Set Up Compliance</span>
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
          >
            <Edit3 className="h-4 w-4 mr-2 text-indigo-600" />
            <span className="text-xs font-black uppercase tracking-widest leading-none">Edit Details</span>
          </button>
          <button 
            onClick={() => setActiveTab('documents')}
            className="flex items-center px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="text-xs font-black uppercase tracking-widest leading-none">Upload Doc</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {company && (
        <ComplianceSetupWizard
          company={company}
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onComplete={() => {
            setIsWizardOpen(false);
            fetchCompany();
            fetchCompliance();
          }}
        />
      )}

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">Edit Company Details</h3>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Basic Information</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        value={editFormData.name}
                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trading Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        value={editFormData.tradingName}
                        onChange={e => setEditFormData({ ...editFormData, tradingName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Legal Entity Type *</label>
                      <select
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        value={editFormData.legalEntityType}
                        onChange={e => setEditFormData({ ...editFormData, legalEntityType: e.target.value as CompanyLegalType })}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Group Role *</label>
                      <select
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        value={editFormData.groupRole}
                        onChange={e => setEditFormData({ ...editFormData, groupRole: e.target.value as CompanyGroupRole })}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                      <select
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        value={editFormData.status}
                        onChange={e => setEditFormData({ ...editFormData, status: e.target.value as CompanyStatus })}
                      >
                        <option value="Active">Active</option>
                        <option value="Dormant">Dormant</option>
                        <option value="Pending">Pending</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Legal & Tax</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        value={editFormData.registrationNumber}
                        onChange={e => setEditFormData({ ...editFormData, registrationNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Incorporation Date *</label>
                      <input
                        required
                        type="date"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        value={editFormData.incorporationDate}
                        onChange={e => setEditFormData({ ...editFormData, incorporationDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year End *</label>
                      <select
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        value={editFormData.financialYearEnd}
                        onChange={e => setEditFormData({ ...editFormData, financialYearEnd: e.target.value })}
                      >
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax Number</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        value={editFormData.taxNumber}
                        onChange={e => setEditFormData({ ...editFormData, taxNumber: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          value={editFormData.vatNumber}
                          onChange={e => setEditFormData({ ...editFormData, vatNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PAYE Number</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          value={editFormData.payeNumber}
                          onChange={e => setEditFormData({ ...editFormData, payeNumber: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Additional Details</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      value={editFormData.notes}
                      onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shareholder Modal */}
      <AnimatePresence>
        {isShareholderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">{isShareholderEditMode ? 'Edit Shareholder' : 'Add Shareholder'}</h3>
                <button onClick={closeShareholderModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleShareholderSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    value={shareholderForm.name}
                    onChange={e => setShareholderForm({ ...shareholderForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      value={shareholderForm.type}
                      onChange={e => setShareholderForm({ ...shareholderForm, type: e.target.value as any })}
                    >
                      <option value="Person">Person</option>
                      <option value="Entity">Entity</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ownership %</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      value={shareholderForm.ownershipPercentage}
                      onChange={e => setShareholderForm({ ...shareholderForm, ownershipPercentage: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Share Class</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      value={shareholderForm.shareClass}
                      onChange={e => setShareholderForm({ ...shareholderForm, shareClass: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      value={shareholderForm.issueDate}
                      onChange={e => setShareholderForm({ ...shareholderForm, issueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeShareholderModal} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : isShareholderEditMode ? 'Save Changes' : 'Add Shareholder'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Director Modal */}
      <AnimatePresence>
        {isDirectorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">{isDirectorEditMode ? 'Edit Director' : 'Appoint Director'}</h3>
                <button onClick={closeDirectorModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleDirectorSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    value={directorForm.fullName}
                    onChange={e => setDirectorForm({ ...directorForm, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Title</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    value={directorForm.roleTitle}
                    onChange={e => setDirectorForm({ ...directorForm, roleTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    value={directorForm.appointmentDate}
                    onChange={e => setDirectorForm({ ...directorForm, appointmentDate: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      value={directorForm.email}
                      onChange={e => setDirectorForm({ ...directorForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      value={directorForm.phone}
                      onChange={e => setDirectorForm({ ...directorForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeDirectorModal} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : isDirectorEditMode ? 'Save Changes' : 'Appoint Director'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Beneficial Owner Modal */}
      <AnimatePresence>
        {isBeneficialOwnerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">{isBeneficialOwnerEditMode ? 'Edit Beneficial Owner' : 'Add Beneficial Owner'}</h3>
                <button onClick={closeBeneficialOwnerModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleBeneficialOwnerSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    value={beneficialOwnerForm.fullName}
                    onChange={e => setBeneficialOwnerForm({ ...beneficialOwnerForm, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Control Type</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    value={beneficialOwnerForm.controlType}
                    onChange={e => setBeneficialOwnerForm({ ...beneficialOwnerForm, controlType: e.target.value })}
                  >
                    <option value="Direct Ownership">Direct Ownership</option>
                    <option value="Indirect Ownership">Indirect Ownership</option>
                    <option value="Senior Management">Senior Management</option>
                    <option value="Other Control">Other Control</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ownership %</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      value={beneficialOwnerForm.ownershipPercentage}
                      onChange={e => setBeneficialOwnerForm({ ...beneficialOwnerForm, ownershipPercentage: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      value={beneficialOwnerForm.effectiveDate}
                      onChange={e => setBeneficialOwnerForm({ ...beneficialOwnerForm, effectiveDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    rows={2}
                    value={beneficialOwnerForm.notes}
                    onChange={e => setBeneficialOwnerForm({ ...beneficialOwnerForm, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeBeneficialOwnerModal} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : isBeneficialOwnerEditMode ? 'Save Changes' : 'Add Beneficial Owner'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Removal</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Are you sure you want to remove <span className="font-bold">{deleteConfirmation.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setDeleteConfirmation(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (deleteConfirmation.type === 'shareholder') confirmDeleteShareholder(deleteConfirmation.id, deleteConfirmation.name);
                      else if (deleteConfirmation.type === 'director') confirmDeleteDirector(deleteConfirmation.id, deleteConfirmation.name);
                      else if (deleteConfirmation.type === 'beneficial_owner') confirmDeleteBeneficialOwner(deleteConfirmation.id, deleteConfirmation.name);
                    }}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 -mx-4 md:-mx-8 px-4 md:px-8 overflow-x-auto scrollbar-hide sticky top-16 z-10">
        <nav className="flex space-x-8 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center py-4 px-1 border-b-2 text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <tab.icon className={cn(
                "h-4 w-4 mr-2",
                activeTab === tab.id ? "text-indigo-600" : "text-gray-400"
              )} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="pb-12"
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Card */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Company Summary</h3>
                <p className="text-gray-600 leading-relaxed">{company.notes}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Trading Name</p>
                    <p className="text-sm font-medium text-gray-900">{company.tradingName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Legal Entity Type</p>
                    <p className="text-sm font-medium text-gray-900">{company.legalEntityType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Group Role</p>
                    <p className="text-sm font-medium text-gray-900">{company.groupRole}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Incorporation Date</p>
                    <p className="text-sm font-medium text-gray-900">{company.incorporationDate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Financial Year End</p>
                    <p className="text-sm font-medium text-gray-900">{company.financialYearEnd}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Registration Number</p>
                    <p className="text-sm font-medium text-gray-900">{company.registrationNumber}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                    <p className="text-xs text-gray-500">Documents</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {complianceItems.filter(i => i.status !== 'Completed' && i.status !== 'Cancelled').length}
                    </p>
                    <p className="text-xs text-gray-500">Active Deadlines</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      R {(financeTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0) - 
                          financeTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Net Cash Flow</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Compliance Status */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Compliance Status</h3>
                <div className="space-y-4">
                  {complianceItems.length > 0 ? (
                    complianceItems
                      .filter(i => i.status !== 'Completed' && i.status !== 'Cancelled')
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .slice(0, 3)
                      .map((item) => {
                        const daysLeft = Math.ceil((new Date(item.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const isOverdue = daysLeft < 0;
                        
                        return (
                          <div key={item.id} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 truncate mr-2">{item.title}</span>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
                              isOverdue ? "text-red-600 bg-red-50" : 
                              daysLeft <= 7 ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50"
                            )}>
                              {isOverdue ? 'OVERDUE' : `DUE IN ${daysLeft} DAYS`}
                            </span>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-sm text-gray-500 italic">No active deadlines.</p>
                  )}
                </div>
                <Link 
                  to="/compliance"
                  className="w-full mt-6 py-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-all block text-center"
                >
                  View Full Calendar
                </Link>
              </div>

              {/* Recent Documents */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Recent Documents</h3>
                <div className="space-y-4">
                  {documents.length > 0 ? (
                    documents.slice(0, 3).map((doc) => (
                      <div 
                        key={doc.id} 
                        className={cn(
                          "flex items-center space-x-3 group cursor-pointer",
                          downloadingId === doc.id && "opacity-50 pointer-events-none"
                        )}
                        onClick={() => doc.fileUrl && handleDownload(doc)}
                      >
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                          {downloadingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                          <p className="text-xs text-gray-500">Uploaded {doc.createdAt.split('T')[0]}</p>
                        </div>
                        <Download className="h-4 w-4 text-gray-300 group-hover:text-gray-600" />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No documents uploaded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'legal' && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-8">Legal & Tax Identifiers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Income Tax Number</label>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-mono text-gray-900">{company.taxNumber}</span>
                  <button className="text-xs text-indigo-600 font-bold hover:underline">Copy</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">VAT Number</label>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-mono text-gray-900">{company.vatNumber}</span>
                  <button className="text-xs text-indigo-600 font-bold hover:underline">Copy</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">PAYE Number</label>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-mono text-gray-900">{company.payeNumber}</span>
                  <button className="text-xs text-indigo-600 font-bold hover:underline">Copy</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">UIF Number</label>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-mono text-gray-900">{company.uifNumber}</span>
                  <button className="text-xs text-indigo-600 font-bold hover:underline">Copy</button>
                </div>
              </div>
            </div>
            
            <div className="mt-12 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-900">Tax Compliance Note</h4>
                  <p className="text-sm text-indigo-800 mt-1">
                    This company is currently in good standing with SARS. The next provisional tax payment is due on 31 August 2024.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Compliance Deadlines</h3>
              <Link 
                to="/compliance"
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                Manage All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {complianceItems.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {complianceItems.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          item.status === 'Completed' ? "bg-green-50 text-green-600" :
                          item.status === 'Overdue' ? "bg-red-50 text-red-600" :
                          item.status === 'In Progress' ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                        )}>
                          {item.status === 'Completed' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{item.type} • Due {item.dueDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full",
                          item.priority === 'High' ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"
                        )}>
                          {item.priority}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No deadlines found</h3>
                <p className="text-gray-500 mt-1">This company has no active compliance deadlines.</p>
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Company Documents</h3>
              <Link 
                to="/documents"
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                Document Vault
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {documents.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{doc.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{doc.category} • Uploaded {doc.createdAt.split('T')[0]}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.fileUrl && (
                          <button 
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50"
                          >
                            {downloadingId === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
                <p className="text-gray-500 mt-1">No documents have been uploaded for this company yet.</p>
                <Link 
                  to="/documents"
                  className="mt-6 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Finance Tab */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Financial Overview</h3>
              <Link 
                to="/finance"
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                Finance Tracker
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Income</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">
                  R {financeTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Expenses</p>
                <p className="text-xl font-bold text-red-700 mt-1">
                  R {financeTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Net Flow</p>
                <p className="text-xl font-bold text-indigo-700 mt-1">
                  R {(
                    financeTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0) -
                    financeTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0)
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            {financeTransactions.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {financeTransactions.map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          tx.type === 'Income' ? "bg-emerald-50 text-emerald-600" :
                          tx.type === 'Expense' ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"
                        )}>
                          {tx.type === 'Income' ? <ArrowUpRight className="h-5 w-5" /> : 
                           tx.type === 'Expense' ? <ArrowDownRight className="h-5 w-5" /> : 
                           <ArrowRightLeft className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{tx.description}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{tx.date} • {tx.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-bold",
                          tx.type === 'Income' ? "text-emerald-600" : 
                          tx.type === 'Expense' ? "text-red-600" : "text-gray-900"
                        )}>
                          {tx.type === 'Income' ? '+' : tx.type === 'Expense' ? '-' : ''}
                          R {tx.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">{tx.paymentMethod}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
                <p className="text-gray-500 mt-1">No financial transactions have been logged for this company yet.</p>
                <Link 
                  to="/finance"
                  className="mt-6 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Log Transaction
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            </div>

            {activityLogs.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          log.entityType === 'document' ? "bg-blue-50 text-blue-600" :
                          log.entityType === 'compliance' ? "bg-amber-50 text-amber-600" :
                          log.entityType === 'finance' ? "bg-emerald-50 text-emerald-600" :
                          log.entityType === 'company' ? "bg-purple-50 text-purple-600" : "bg-gray-50 text-gray-600"
                        )}>
                          {log.entityType === 'document' ? <FileText className="h-5 w-5" /> :
                           log.entityType === 'compliance' ? <Clock className="h-5 w-5" /> :
                           log.entityType === 'finance' ? <Wallet className="h-5 w-5" /> : 
                           log.entityType === 'company' ? <Building2 className="h-5 w-5" /> : <ArrowRightLeft className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{log.description}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(log.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No activity found</h3>
                <p className="text-gray-500 mt-1">No activities have been logged for this company yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Ownership Tab */}
        {activeTab === 'ownership' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Shareholders Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Shareholders</h3>
                  <button 
                    onClick={openShareholderAddModal}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {shareholders.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {shareholders.map((sh) => (
                        <div key={sh.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                              {sh.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{sh.name}</p>
                              <p className="text-xs text-gray-500">{sh.type} • {sh.shareClass}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right mr-2">
                              <p className="text-sm font-bold text-gray-900">{sh.ownershipPercentage}%</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">Ownership</p>
                            </div>
                            <button 
                              onClick={() => openShareholderEditModal(sh)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteShareholder(sh.id, sh.name)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No shareholders recorded.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Directors Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Directors</h3>
                  <button 
                    onClick={openDirectorAddModal}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {directors.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {directors.map((dir) => (
                        <div key={dir.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
                              {dir.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{dir.fullName}</p>
                              <p className="text-xs text-gray-500">{dir.roleTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right mr-2">
                              <p className="text-xs font-medium text-gray-600">Appointed</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{dir.appointmentDate}</p>
                            </div>
                            <button 
                              onClick={() => openDirectorEditModal(dir)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteDirector(dir.id, dir.fullName)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No directors recorded.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Beneficial Owners Section */}
              <div className="space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Beneficial Owners</h3>
                  <button 
                    onClick={openBeneficialOwnerAddModal}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {beneficialOwners.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {beneficialOwners.map((bo) => (
                        <div key={bo.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                              {bo.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{bo.fullName}</p>
                              <p className="text-xs text-gray-500">{bo.controlType} • {bo.status}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right mr-2">
                              <p className="text-sm font-bold text-gray-900">{bo.ownershipPercentage}%</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">Control</p>
                            </div>
                            <button 
                              onClick={() => openBeneficialOwnerEditModal(bo)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteBeneficialOwner(bo.id, bo.fullName)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No beneficial owners recorded.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
