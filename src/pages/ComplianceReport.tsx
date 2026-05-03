import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Printer, 
  ChevronLeft, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  FileWarning, 
  History,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Building,
  FileText,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ComplianceScoreService, ComplianceScore } from '../services/complianceScore';
import { ActivityLogService, ActivityLog } from '../services/activityLogService';
import { cn, formatDate } from '../lib/utils';

type ReportMode = 'group' | 'company';

export default function ComplianceReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportMode, setReportMode] = useState<ReportMode>('group');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [data, setData] = useState<{
    score: ComplianceScore;
    companies: any[];
    complianceItems: any[];
    activityLogs: ActivityLog[];
    stats: any;
  } | null>(null);

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // 1. Group Stats & Score
        let score: ComplianceScore;
        try {
          score = await ComplianceScoreService.getGroupComplianceScore(user.id);
        } catch (err) {
          score = { 
            score: 0, 
            label: 'Critical', 
            riskReasons: ['Unable to calculate score at this time'],
            total_items: 0,
            overdue_count: 0,
            due_soon_count: 0,
            missing_documents_count: 0
          };
        }
        
        // 2. Fetch Companies
        let finalCompanies: any[] = [];
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select(`
            *,
            compliance!companyId ( count ),
            documents!companyId ( count )
          `)
          .eq('owner_id', user.id);

        if (companiesError) {
          const { data: rawCompanies } = await supabase
            .from('companies')
            .select(`
              *,
              compliance!company_id ( count ),
              documents!company_id ( count )
            `)
            .eq('owner_id', user.id);
          finalCompanies = rawCompanies || [];
        } else {
          finalCompanies = companies || [];
        }

        // 3. Fetch Compliance Items
        let finalItems: any[] = [];
        const { data: complianceItems, error: complianceError } = await supabase
          .from('compliance')
          .select('*, companies!companyId ( name )')
          .eq('owner_id', user.id)
          .order('dueDate', { ascending: true });

        if (complianceError) {
          const { data: fallbackItems, error: fallbackError } = await supabase
            .from('compliance')
            .select('*, companies!company_id ( name )')
            .eq('owner_id', user.id)
            .order('due_date', { ascending: true });
          
          if (fallbackError) {
            const { data: rawItems } = await supabase.from('compliance').select('*').eq('owner_id', user.id);
            finalItems = (rawItems || []).map(i => ({ ...i, regulator: i.type || i.category, dueDate: i.dueDate || i.due_date, companyId: i.companyId || i.company_id }));
          } else {
            finalItems = (fallbackItems || []).map(i => ({ ...i, regulator: i.type || i.category, dueDate: i.dueDate || i.due_date, companyId: i.companyId || i.company_id }));
          }
        } else {
          finalItems = (complianceItems || []).map(i => ({ ...i, regulator: i.type || i.category }));
        }

        // 4. Fetch Activity Logs
        const activityLogs = await ActivityLogService.getRecentActivity(user.id, 50);

        // 5. Fetch ALL Documents for evidence linking
        const { data: allDocs } = await supabase
          .from('documents')
          .select('*')
          .eq('owner_id', user.id);
        setDocuments(allDocs || []);

        const stats = {
          totalCompanies: finalCompanies.length,
          totalCompliance: finalItems.length,
          overdue: finalItems.filter(i => i.status === 'Overdue').length,
          dueSoon: finalItems.filter(i => {
            const dueDateStr = i.dueDate || i.due_date;
            if (!dueDateStr) return false;
            const dueDate = new Date(dueDateStr);
            const today = new Date();
            const diff = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
            return diff > 0 && diff <= 7;
          }).length,
          missingDocs: finalItems.filter(i => i.status !== 'Completed' && i.required_documents?.length > 0).length
        };

        setData({
          score,
          companies: finalCompanies,
          complianceItems: finalItems,
          activityLogs: activityLogs || [],
          stats
        });
      } catch (err) {
        console.error('[ComplianceReport] Critical failure:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, [navigate]);

  const filteredData = useMemo(() => {
    if (!data) return null;
    
    if (reportMode === 'group' || !selectedCompanyId) {
      return data;
    }

    const company = data.companies.find(c => c.id === selectedCompanyId);
    if (!company) return data;

    const complianceItems = data.complianceItems.filter(i => i.companyId === selectedCompanyId);
    const activityLogs = data.activityLogs.filter(l => l.companyId === selectedCompanyId);
    const companyDocs = documents.filter(d => d.companyId === selectedCompanyId);

    // Calculate company specific stats
    const stats = {
      totalCompanies: 1,
      totalCompliance: complianceItems.length,
      overdue: complianceItems.filter(i => i.status === 'Overdue').length,
      dueSoon: complianceItems.filter(i => {
        const dueDateStr = i.dueDate;
        if (!dueDateStr) return false;
        const dueDate = new Date(dueDateStr);
        const today = new Date();
        const diff = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        return diff > 0 && diff <= 7;
      }).length,
      missingDocs: complianceItems.filter(i => i.status !== 'Completed' && i.required_documents?.length > 0).length
    };

    return {
      score: data.score, // Use group score as context
      companies: [company],
      complianceItems,
      activityLogs,
      stats,
      documents: companyDocs
    };
  }, [data, reportMode, selectedCompanyId, documents]);

  const selectedCompany = useMemo(() => {
    return data?.companies.find(c => c.id === selectedCompanyId);
  }, [data, selectedCompanyId]);

    const handleDownloadHTML = async () => {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;

    // Log the export action
    await ActivityLogService.logActivity({
      actionType: 'report_exported' as any,
      description: `Exported ${reportMode === 'group' ? 'Group' : (selectedCompany?.name || 'Company')} Compliance Report as HTML`,
      companyId: reportMode === 'company' ? selectedCompanyId : undefined
    });

    const exportTitle = reportMode === 'group' ? 'HoldCo OS - Group Compliance Report' : `HoldCo OS - ${selectedCompany?.name || 'Company'} Compliance Report`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${exportTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; background-color: #f9fafb; padding: 2rem; display: flex; justify-content: center; }
          .print-area { background: white; max-width: 1024px; width: 100%; border-radius: 1.5rem; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        <div class="print-area">
          ${reportContent.innerHTML}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `holdco-os-${reportMode === 'group' ? 'group' : (selectedCompany?.name || 'company').toLowerCase().replace(/\s+/g, '-')}-report.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Generating Your report...</p>
        </div>
      </div>
    );
  }

  if (!filteredData || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-xl max-w-md w-full">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">No Report Data</h2>
          <p className="text-gray-500 mb-8">We couldn't find any data to generate the requested report.</p>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest active:scale-95">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 print:bg-white print:pb-0">
      {/* Header / Actions - Hidden on Print */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-[60] print:hidden no-print">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button 
                onClick={() => setReportMode('group')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center transition-all",
                  reportMode === 'group' ? "bg-white text-indigo-600 shadow-sm ring-1 ring-gray-100" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <LayoutGrid className="h-3 w-3 mr-2" />
                Group Report
              </button>
              <button 
                onClick={() => setReportMode('company')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center transition-all",
                  reportMode === 'company' ? "bg-white text-indigo-600 shadow-sm ring-1 ring-gray-100" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Building className="h-3 w-3 mr-2" />
                Company Report
              </button>
            </div>
            {reportMode === 'company' && (
              <select 
                className="bg-gray-50 border border-gray-200 text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                <option value="">Select Company</option>
                {data.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <div className="flex items-center space-x-3">
             <div className="text-right hidden xl:block mr-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Saving as PDF?</p>
                <p className="text-[9px] text-gray-500 leading-none">Choose "Save as PDF" in print dialog</p>
             </div>
             <button 
              onClick={handleDownloadHTML}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
              <Download className="h-4 w-4 mr-2 text-indigo-600" />
              Download Report
            </button>
             <button 
              onClick={async () => {
                await ActivityLogService.logActivity({
                  actionType: 'report_printed' as any,
                  description: `Printed ${reportMode === 'group' ? 'Group' : (selectedCompany?.name || 'Company')} Compliance Report`,
                  companyId: reportMode === 'company' ? selectedCompanyId : undefined
                });
                window.print();
              }}
              className="px-6 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-gray-900 transition-all shadow-lg active:scale-95"
            >
              <Printer className="h-4 w-4 mr-2 text-indigo-400" />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Report Canvas */}
        <div id="report-content" className="print-area mt-8">
          <div className="bg-white shadow-2xl rounded-3xl overflow-hidden print:shadow-none print:rounded-none print:mt-0 print:max-w-full border border-gray-100">
            {/* Report Header */}
            <div className="px-12 py-16 bg-gray-900 text-white relative">
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
                      {reportMode === 'group' ? 'Group Compliance Report' : (selectedCompany?.name || 'Company Compliance Report')}
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] flex items-center">
                      <Calendar className="h-3 w-3 mr-2" />
                      Generated on {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {reportMode === 'company' && selectedCompany && (
                      <p className="mt-2 text-indigo-400 font-black uppercase tracking-widest text-[10px]">
                        Registration: {selectedCompany.registrationNumber || 'N/A'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-indigo-400">{filteredData.score.score}%</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                      {reportMode === 'group' ? 'Group Health Index' : 'Entity Standing'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
                   <div>
                     <div className="text-2xl font-black">{filteredData.stats.totalCompanies}</div>
                     <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                       {reportMode === 'group' ? 'Active Entities' : 'Report Context'}
                     </div>
                   </div>
                   <div>
                     <div className="text-2xl font-black">{filteredData.stats.totalCompliance}</div>
                     <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monitored items</div>
                   </div>
                   <div>
                     <div className={cn("text-2xl font-black", filteredData.stats.overdue > 0 ? "text-red-400" : "text-emerald-400")}>{filteredData.stats.overdue}</div>
                     <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overdue Items</div>
                   </div>
                   <div>
                     <div className="text-2xl font-black">{filteredData.stats.missingDocs}</div>
                     <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evidence Gaps</div>
                   </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-3xl rounded-full translate-x-20 -translate-y-20"></div>
            </div>

            {/* Section 1: Executive Summary */}
            <div className="p-12 border-b border-gray-100">
              <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center">
                <ShieldCheck className="h-5 w-5 mr-3 text-indigo-600" />
                Executive Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Current Risk Profile</h3>
                  <p className="text-[11px] text-gray-700 font-medium leading-relaxed">
                    The {reportMode === 'group' ? 'group-wide' : (selectedCompany?.name || 'entity')} analysis indicates a health index of <span className="font-bold text-indigo-600">{filteredData.score.score}%</span>. 
                    {filteredData.stats.overdue > 0 
                      ? ` Immediate attention is required for ${filteredData.stats.overdue} overdue items to minimize regulatory exposure.` 
                      : " All monitored regulatory workflows are currently in good standing."}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Compliance Warnings</h3>
                  <ul className="space-y-2">
                    {filteredData.score.riskReasons.map((reason, idx) => (
                      <li key={idx} className="text-[10px] font-bold text-gray-600 flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2" />
                        {reason}
                      </li>
                    ))}
                    {filteredData.stats.missingDocs > 0 && (
                      <li className="text-[10px] font-bold text-orange-600 flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2" />
                        {filteredData.stats.missingDocs} items are pending document verification.
                      </li>
                    )}
                    {filteredData.stats.overdue === 0 && filteredData.score.riskReasons.length === 0 && (
                      <li className="text-[10px] font-black uppercase text-emerald-600 flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-2" />
                        No Critical Risks Identified
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 2: Portfolio / Company Details */}
            {reportMode === 'group' ? (
              <div className="p-12 border-b border-gray-100 bg-gray-50/30">
                <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center">
                  <Building2 className="h-5 w-5 mr-3 text-indigo-600" />
                  Portfolio Breakdown
                </h2>
                <div className="overflow-hidden border border-gray-100 rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Entity Name</th>
                        <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Registration</th>
                        <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                        <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Open Obligations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredData.companies.map((company) => (
                        <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-gray-900">{company.name}</td>
                          <td className="px-6 py-4 text-[10px] font-mono font-bold text-gray-500 tracking-tighter">{company.registrationNumber || 'N/A'}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
                              company.status?.toLowerCase() === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"
                            )}>
                              {company.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-xs">
                            {company.compliance?.count || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : selectedCompany ? (
              <div className="p-12 border-b border-gray-100 bg-gray-50/30">
                <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center">
                  <Building2 className="h-5 w-5 mr-3 text-indigo-600" />
                  Legal Entity Snapshot
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Incorporation Date</p>
                        <p className="text-xs font-bold text-gray-900">{formatDate(selectedCompany.incorporationDate)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Financial Year End</p>
                        <p className="text-xs font-bold text-gray-900">{selectedCompany.financialYearEnd || 'Not Set'}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Entity Structure</p>
                        <p className="text-xs font-bold text-gray-900">{selectedCompany.legalEntityType || 'Standard Company'}</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Group Position</p>
                        <p className="text-xs font-bold text-gray-900">{selectedCompany.groupRole || 'Subsidiary'}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tax Reference</p>
                        <p className="text-xs font-mono font-bold text-gray-900">{selectedCompany.taxNumber || 'Pending Verification'}</p>
                      </div>
                      {selectedCompany.notes && (
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Governance Notes</p>
                          <p className="text-[10px] text-gray-600 font-medium leading-relaxed italic">{selectedCompany.notes}</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            ) : null}

            {/* Section 3: Compliance Grid */}
            <div className="p-12 border-b border-gray-100">
              <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center">
                <Clock className="h-5 w-5 mr-3 text-indigo-600" />
                {reportMode === 'group' ? 'Consolidated Compliance Grid' : 'Mandatory Obligations & Filings'}
              </h2>
              <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm">
                <table className="w-full text-left border-collapse">
                   <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Requirement</th>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Deadline</th>
                      {reportMode === 'company' && <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Filing Evidence</th>}
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Outcome</th>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Criticality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredData.complianceItems.length > 0 ? filteredData.complianceItems.slice(0, 100).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-gray-900 leading-tight">{item.title}</span>
                            {reportMode === 'group' && <span className="text-[8px] text-gray-500 font-black uppercase tracking-tight mt-0.5">{item.companies?.name}</span>}
                            <div className="flex items-center space-x-2 mt-1">
                               <span className="text-[8px] text-indigo-500 font-extrabold uppercase bg-indigo-50 px-1.5 py-0.5 rounded">{item.regulator}</span>
                               {item.category && <span className="text-[8px] text-gray-400 font-bold uppercase">{item.category}</span>}
                            </div>
                          </div>
                        </td>
                        <td className={cn(
                          "px-6 py-4 text-[11px] font-bold tabular-nums whitespace-nowrap",
                          item.status === 'Overdue' ? "text-red-600" : "text-gray-900"
                        )}>
                          {formatDate(item.dueDate || item.due_date)}
                        </td>
                        {reportMode === 'company' && (
                          <td className="px-6 py-4 text-center">
                            {item.linkedDocumentId ? (
                              <div className="inline-flex items-center text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                Verified
                              </div>
                            ) : (
                              <div className="inline-flex items-center text-[8px] font-black uppercase text-gray-300 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                                Pending
                              </div>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "text-[10px] font-black uppercase px-2 py-1 rounded-lg",
                            item.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                            item.status === 'Overdue' ? "bg-red-50 text-red-600 border border-red-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                          )}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={cn(
                             "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                             item.priority === 'High' || item.risk_level === 'High' ? "bg-red-900 text-white" : "bg-gray-100 text-gray-400"
                           )}>
                             {item.priority || item.risk_level || 'Normal'}
                           </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={reportMode === 'company' ? 5 : 4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                             <ShieldCheck className="h-8 w-8 text-gray-100 mb-2" />
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No maintenance records currently registered</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Evidence Inventory (Only for Company Mode) */}
            {reportMode === 'company' && (filteredData as any).documents?.length > 0 && (
              <div className="p-12 border-b border-gray-100 bg-gray-50/30">
                <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center">
                  <FileText className="h-5 w-5 mr-3 text-indigo-600" />
                  Regulatory Evidence Inventory
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(filteredData as any).documents.map((doc: any) => (
                    <div key={doc.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group shadow-sm transition-all hover:bg-gray-50/50">
                       <div className="flex items-center min-w-0">
                          <div className="p-2 bg-indigo-50 rounded-xl mr-3">
                             <FileText className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                             <p className="text-[10px] font-black text-gray-900 truncate pr-4">{doc.title}</p>
                             <div className="flex items-center space-x-2">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{doc.category}</span>
                                <span className="text-[7px] font-bold text-indigo-300 uppercase leading-none border border-indigo-100 px-1 rounded">{doc.fileType?.split('/')[1] || 'DOC'}</span>
                             </div>
                          </div>
                       </div>
                       <ExternalLink className="h-3 w-3 text-gray-200 no-print" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 5: Audit Log */}
            <div className="p-12">
              <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center">
                <History className="h-5 w-5 mr-3 text-indigo-600" />
                Verified Maintenance Trail
              </h2>
              <div className="space-y-3">
                {filteredData.activityLogs.length > 0 ? filteredData.activityLogs.slice(0, 20).map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 border-dashed">
                    <div className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-4 shadow-sm" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-700 leading-snug">{log.description}</p>
                        {reportMode === 'group' && <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-widest mt-0.5">{log.company_name || 'Group System'}</p>}
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-gray-400 tabular-nums uppercase">{formatDate(log.createdAt)}</span>
                  </div>
                )) : (
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic text-center py-6">Audit trail is currently sterile</p>
                )}
              </div>
            </div>

            {/* Final Footer */}
            <div className="px-12 py-10 bg-gray-50 text-center border-t border-gray-100">
               <div className="flex items-center justify-center mb-4 space-x-4">
                  <div className="h-[1px] w-12 bg-gray-200" />
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-[10px] font-black">H</div>
                  <div className="h-[1px] w-12 bg-gray-200" />
               </div>
               <p className="text-[9px] font-black text-gray-900 uppercase tracking-[0.4em] mb-1">HoldCo OS Business Intelligence Report</p>
               <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] max-w-sm mx-auto">
                 This document is a true reflection of the regulatory standing of the group as of {new Date().toLocaleString()}. 
                 Verified by complianceEngine v1.0 • South Africa
               </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }

          .print-area {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          
          #report-content {
            margin-top: 0 !important;
          }

          .rounded-3xl { border-radius: 0 !important; }
          .shadow-2xl { box-shadow: none !important; }
          .min-h-screen { min-h: auto !important; }
          
          @page { margin: 1cm; size: auto; }
          .page-break { page-break-after: always; }
          
          /* Force backgrounds in print */
          .bg-gray-900 { background-color: #111827 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bg-indigo-50 { background-color: #eef2ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bg-emerald-50 { background-color: #ecfdf5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bg-gray-50 { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .text-white { color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .text-indigo-400 { color: #818cf8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
