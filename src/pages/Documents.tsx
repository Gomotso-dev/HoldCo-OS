import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Upload, 
  FileText, 
  Download, 
  MoreHorizontal, 
  Building2, 
  Calendar,
  ShieldCheck,
  FileWarning,
  CheckCircle2,
  Loader2,
  X,
  Trash2,
  Plus,
  AlertCircle
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { ActivityLogService } from '../services/activityLogService';
import { Document, Company } from '../types';
import { EmptyState } from '../components/EmptyState';

interface DocumentWithCompany extends Document {
  companies: {
    name: string;
  };
}

const categories = [
  'All Documents',
  'Incorporation',
  'Tax & VAT',
  'Governance',
  'Contracts',
  'Shareholder',
  'Bank & Finance',
];

export default function Documents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('All Documents');
  const [documents, setDocuments] = useState<DocumentWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentWithCompany | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
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
    company_id: '',
    category: 'Incorporation',
    title: '',
    issue_date: '',
    expiry_date: '',
    notes: '',
    compliance_id: ''
  });

  useEffect(() => {
    const upload = searchParams.get('upload');
    const company_id = searchParams.get('companyId');
    const compliance_id = searchParams.get('complianceId');
    const title = searchParams.get('title');

    if (upload === 'true' && !isModalOpen) {
      setFormData(prev => ({
        ...prev,
        company_id: company_id || prev.company_id,
        compliance_id: compliance_id || prev.compliance_id,
        title: title || prev.title
      }));
      setIsModalOpen(true);
      // Clear the search params after processing
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  function closeModal() {
    setIsModalOpen(false);
    setFile(null);
    setFormData({
      company_id: '',
      category: 'Incorporation',
      title: '',
      issue_date: '',
      expiry_date: '',
      notes: '',
      compliance_id: ''
    });
  }

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch companies for dropdown
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .order('name');
      
      setCompanies(companiesData || []);

      // Fetch documents with company names
      const docsQueryRes = await supabase
        .from('documents')
        .select(`
          *,
          companies!company_id (
            name
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (docsQueryRes.error) {
        console.error('Documents fetch error:', docsQueryRes.error);
        throw docsQueryRes.error;
      }
      setDocuments(docsQueryRes.data || []);
    } catch (err: any) {
      console.error('Error fetching documents:', err.message);
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }

  // Helper to get clean storage path from URL or path
  function getStoragePath(file_url: string) {
    if (!file_url) return '';
    
    // If it's a full URL, extract the path after 'documents/'
    if (file_url.includes('/storage/v1/object/')) {
      const parts = file_url.split('/documents/');
      // Get the last part and handle edge case where documents might be in the filename
      // But typically it's .../public/documents/path/to/file
      return parts[parts.length - 1];
    }
    
    // If it already starts with 'documents/', strip it
    if (file_url.startsWith('documents/')) {
      return file_url.replace(/^documents\//, '');
    }
    
    return file_url;
  }

  async function handleDownload(doc: DocumentWithCompany) {
    try {
      setDownloadingId(doc.id);
      const path = getStoragePath(doc.file_url);
      
      if (!path) throw new Error('Document path not found.');

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 60);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Failed to generate secure link.');

      // Open in new tab or trigger download
      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Could not open document: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validation
      if (!file) throw new Error('Please select a file to upload.');
      if (!formData.company_id) throw new Error('Please select a company.');
      if (!formData.title.trim()) throw new Error('Please enter a document title.');
      if (!formData.category) throw new Error('Please select a category.');

      // File type validation
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Unsupported file type. Please upload a PDF, PNG, or JPG.');
      }

      // File size validation (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds the 10MB limit.');
      }

      let file_url = '';
      let file_type = file.type;

      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const sanitizedFileName = file.name.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, '-').toLowerCase();
      const fileName = `${Date.now()}-${sanitizedFileName}`;
      
      // Store relative path ONLY (no 'documents/' prefix inside the bucket)
      const filePath = `${user.id}/${formData.company_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('bucket not found')) {
          throw new Error('Storage bucket "documents" not found. Please create it in your Supabase dashboard.');
        }
        throw uploadError;
      }

      // Store the specific storage path in the DB
      file_url = filePath;

      // 3. Insert into database
      const timestamp = new Date().toISOString();
      const { data, error: insertError } = await supabase
        .from('documents')
        .insert([{
          company_id: formData.company_id,
          category: formData.category,
          title: formData.title,
          file_url: file_url,
          file_type: file_type,
          notes: formData.notes || null,
          issue_date: formData.issue_date || null,
          expiry_date: formData.expiry_date || null,
          owner_id: user.id,
          uploaded_by: user.id,
          version_number: 1,
          created_at: timestamp,
          updated_at: timestamp
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        // Link to compliance item if provided
        if (formData.compliance_id) {
          await supabase
            .from('compliance')
            .update({ 
               linked_document_id: data.id
            })
            .eq('id', formData.compliance_id);
        }

        await ActivityLogService.logActivity({
          action_type: 'document_uploaded' as any,
          description: formData.compliance_id 
            ? `Uploaded and linked document: ${data.title}`
            : `Uploaded document: ${data.title}`,
          company_id: data.company_id,
          document_id: data.id,
          compliance_id: formData.compliance_id || undefined
        });
        setSuccess(formData.compliance_id 
          ? `Document uploaded and linked to compliance item. Ready to submit!`
          : `Document "${data.title}" successfully uploaded.`);
      }

      closeModal();
      await fetchData();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An unexpected error occurred during upload.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!docToDelete) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docToDelete.id);

      if (error) throw error;

      await ActivityLogService.logActivity({
        action_type: 'document_uploaded' as any,
        description: `Deleted document: ${docToDelete.title}`,
        company_id: docToDelete.company_id,
        document_id: docToDelete.id
      });
      setSuccess(`Document "${docToDelete.title}" successfully deleted.`);
      setIsDeleteModalOpen(false);
      setDocToDelete(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.companies?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All Documents' || doc.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Document Vault</h2>
          <p className="text-gray-500 mt-1 text-sm">Securely store and manage all company-related files.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
        >
          <Upload className="h-5 w-5 mr-2" />
          <span className="text-xs font-black uppercase tracking-widest">Upload Document</span>
        </button>
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
            onClick={() => fetchData()}
            className="ml-auto text-xs font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Card - Full width on mobile, moved above categories */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents by title, company..."
              className="w-full pl-10 pr-4 py-2 border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm md:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Filter</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Categories Section */}
        <div className="lg:w-64 flex-shrink-0">
          {/* Desktop Categories (Vertical Sidebar) */}
          <div className="hidden lg:block space-y-1 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm h-fit sticky top-24">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-4">Categories</h3>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all",
                  activeCategory === cat
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Mobile Categories (Horizontal Scroll) */}
          <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border",
                  activeCategory === cat
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Document List Container */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-600" />
                <p>Loading documents...</p>
              </div>
            ) : filteredDocuments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Document</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest px-8">Actions</th>
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredDocuments.map((doc, index) => {
                    const isExpiring = doc.expiry_date && (new Date(doc.expiry_date).getTime() - new Date().getTime()) < (30 * 24 * 60 * 60 * 1000);
                    return (
                      <motion.tr 
                        key={doc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 mr-3 group-hover:scale-110 transition-transform">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{doc.title}</span>
                              <span className="text-[10px] text-gray-400 font-medium">v{doc.version_number || 1} • {doc.file_type?.toUpperCase() || 'PDF'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-xs font-bold text-gray-600 uppercase tracking-tight">
                            <Building2 className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            {doc.companies?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-black rounded-md uppercase tracking-widest border border-gray-100">
                            {doc.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-xs font-bold tabular-nums text-gray-700">
                            <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            {formatDate(doc.issue_date || doc.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isExpiring ? (
                            <div className="flex items-center text-rose-600 text-[10px] font-black bg-rose-50 px-2.5 py-1 rounded-full w-fit border border-rose-100 uppercase tracking-wider">
                              <FileWarning className="h-3 w-3 mr-1" />
                              Expiring Soon
                            </div>
                          ) : (
                            <div className="flex items-center text-emerald-600 text-[10px] font-black bg-emerald-50 px-2.5 py-1 rounded-full w-fit border border-emerald-100 uppercase tracking-wider">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Valid
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right px-8 text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {doc.file_url && (
                              <button 
                                onClick={() => handleDownload(doc)}
                                disabled={downloadingId === doc.id}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100 disabled:opacity-50"
                                title="View / Download"
                              >
                                {downloadingId === doc.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setDocToDelete(doc);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-rose-100"
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
            </div>
          ) : (
            <div className="py-20 text-center">
              <EmptyState
                icon={ShieldCheck}
                title={searchTerm ? "No documents found" : (activeCategory === 'All Documents' ? "Vault Empty" : `No ${activeCategory} Files`)}
                description={
                  searchTerm 
                    ? `We couldn't find any documents matching "${searchTerm}". Try a different name or company.` 
                    : activeCategory === 'All Documents'
                      ? "Your document vault is currently empty. Start by uploading your company's incorporation or tax documents."
                      : `No documents have been categorized as ${activeCategory} yet.`
                }
                actionLabel={searchTerm ? "Clear Search" : "Upload Your First Document"}
                onAction={() => (searchTerm ? setSearchTerm('') : setIsModalOpen(true))}
              />
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
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
                <h3 className="text-xl font-bold text-gray-900">Upload Document</h3>
                <button 
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document File</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-2xl hover:border-indigo-500 transition-colors cursor-pointer relative group">
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-10 w-10 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        <div className="flex text-sm text-gray-600">
                          <span className="relative font-medium text-indigo-600">
                            {file ? file.name : 'Upload a file'}
                          </span>
                          {!file && <p className="pl-1">or drag and drop</p>}
                        </div>
                        <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <select
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      value={formData.company_id}
                      onChange={e => setFormData({ ...formData, company_id: e.target.value })}
                    >
                      <option value="">Select Company</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Tax Clearance Certificate"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.filter(c => c !== 'All Documents').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        value={formData.issue_date}
                        onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        value={formData.expiry_date}
                        onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Upload Record'}
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
              className="bg-white rounded-3xl shadow-2xl w-full max-md overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Document?</h3>
                <p className="text-gray-500">
                  Are you sure you want to delete <span className="font-bold text-gray-900">{docToDelete?.title}</span>? 
                  This action cannot be undone.
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
