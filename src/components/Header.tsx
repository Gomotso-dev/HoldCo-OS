import { Bell, Search, PlusCircle, Menu, HelpCircle, ShieldCheck, Building2, Shield, FileUp, ChevronDown, CheckCircle2, AlertCircle, Clock, FileWarning, ExternalLink, X, Info, Calendar } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Company, ComplianceItem, Document } from '../types';

const pageTitles: Record<string, string> = {
  '/': 'HoldCo Dashboard',
  '/companies': 'Company Register',
  '/structure': 'Group Structure',
  '/documents': 'Document Vault',
  '/compliance': 'Compliance Calendar',
  '/finance': 'Finance Tracker',
  '/settings': 'Platform Settings',
};

interface SearchResults {
  companies: any[];
  compliance: any[];
  documents: any[];
}

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || 'HoldCo OS';
  
  // Menu States
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults>({ companies: [], compliance: [], documents: [] });
  const [isSearching, setIsSearching] = useState(false);
  
  // Notification States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsNewMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Notifications
  useEffect(() => {
    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: compliance } = await supabase
        .from('compliance')
        .select('*, companies!companyId ( name )')
        .eq('owner_id', user.id);

      if (compliance) {
        const now = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(now.getDate() + 3);

        const urgentNotifs = (compliance as any[]).map(item => {
          const dueDate = new Date(item.dueDate || item.due_date);
          const isOverdue = item.status === 'Overdue' || (dueDate < now && item.status !== 'Completed');
          const isDueToday = dueDate.toDateString() === now.toDateString();
          const isDueSoon = dueDate > now && dueDate <= threeDaysLater;
          const isMissingDocs = item.status !== 'Completed' && item.required_documents?.length > 0 && !item.linkedDocumentId;

          if (isOverdue || isDueToday || isDueSoon || isMissingDocs) {
            return {
              id: item.id,
              title: item.title,
              company: item.companies?.name || 'Unknown Company',
              type: isOverdue ? 'overdue' : isDueToday ? 'today' : isDueSoon ? 'soon' : 'missing_docs',
              dueDate: item.dueDate || item.due_date,
              url: `/compliance?id=${item.id}`
            };
          }
          return null;
        }).filter(Boolean);

        setNotifications(urgentNotifs);
        setUnreadCount(urgentNotifs.length);
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Global Search Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults({ companies: [], compliance: [], documents: [] });
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [companiesRes, complianceRes, documentsRes] = await Promise.all([
        supabase.from('companies').select('*').eq('owner_id', user.id).or(`name.ilike.%${searchQuery}%,registrationNumber.ilike.%${searchQuery}%`).limit(5),
        supabase.from('compliance').select('*, companies!companyId ( name )').eq('owner_id', user.id).or(`title.ilike.%${searchQuery}%,type.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`).limit(5),
        supabase.from('documents').select('*, companies!companyId ( name )').eq('owner_id', user.id).or(`title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`).limit(5)
      ]);

      setSearchResults({
        companies: companiesRes.data || [],
        compliance: complianceRes.data || [],
        documents: documentsRes.data || []
      });
      setIsSearching(false);
      setIsSearchOpen(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleNewRecordAction = (path: string) => {
    setIsNewMenuOpen(false);
    navigate(path);
  };

  const newRecordOptions = [
    { 
      label: 'New Company', 
      icon: Building2, 
      path: '/companies?new=true',
      description: 'Add a new legal entity to your group'
    },
    { 
      label: 'New Compliance Item', 
      icon: Shield, 
      path: '/compliance?new=true',
      description: 'Log a SARS, CIPC or other task'
    },
    { 
      label: 'Upload Document', 
      icon: FileUp, 
      path: '/documents?upload=true',
      description: 'Securely store a new file in the vault'
    }
  ];

  const faqs = [
    { q: "What is HoldCo OS?", a: "A centralized operating system for managing multiple legal entities, compliance requirements, and corporate governance for business groups." },
    { q: "How do I add a company?", a: "Click 'New Record' > 'New Company' or go to the Company Register and click 'Add Company'." },
    { q: "How does compliance setup work?", a: "The Setup Wizard uses your company details to generate standard regulatory obligations automatically." },
    { q: "What does 'Missing Documents' mean?", a: "A compliance item is marked as needing evidence (e.g. return receipt) but no document has been linked yet." },
    { q: "What counts as evidence?", a: "Typically PDF certificates, receipts, or official filing acknowledgments from regulators like SARS or CIPC." },
    { q: "How do I export a report?", a: "Go to the Dashboard or Compliance page and click 'Export Report'. You can filter by group or individual company." },
    { q: "How do I mark an obligation complete?", a: "Click the status badge on any compliance item and update it to 'Completed'. Remember to link evidence if required." }
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-[100] shadow-sm h-16 md:h-18 print:hidden no-print">
      <div className="px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-gray-50 focus:outline-none transition-all active:scale-95"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-2 md:ml-0 flex items-center">
            <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">{title}</h1>
            <span className="hidden xs:inline-block ml-3 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-md uppercase tracking-widest border border-indigo-100">Beta</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Global Search */}
          <div className="relative hidden lg:block" ref={searchRef}>
            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all focus-within:bg-white shadow-inner">
              <Search className={cn("h-4 w-4 text-gray-400 mr-3", isSearching && "animate-pulse")} />
              <input
                type="text"
                placeholder="Search group data..."
                className="bg-transparent border-none focus:ring-0 text-sm w-48 lg:w-64 font-medium text-gray-600 placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
              />
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden z-[110]"
                >
                  <div className="max-h-[70vh] overflow-y-auto p-2">
                    {searchResults.companies.length === 0 && searchResults.compliance.length === 0 && searchResults.documents.length === 0 ? (
                      <div className="p-12 text-center">
                        <Search className="h-8 w-8 text-gray-100 mx-auto mb-3" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No results found for "{searchQuery}"</p>
                      </div>
                    ) : (
                      <>
                        {searchResults.companies.length > 0 && (
                          <div className="mb-4">
                            <p className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50 rounded-xl mb-1">Legal Entities</p>
                            {searchResults.companies.map(c => (
                              <button 
                                key={c.id} 
                                onClick={() => { navigate(`/companies?id=${c.id}`); setIsSearchOpen(false); }}
                                className="w-full flex items-center p-3 hover:bg-indigo-50 rounded-2xl transition-colors text-left group"
                              >
                                <Building2 className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 mr-3" />
                                <div>
                                  <p className="text-sm font-bold text-gray-900 leading-tight">{c.name}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">{c.registrationNumber}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {searchResults.compliance.length > 0 && (
                          <div className="mb-4">
                            <p className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50 rounded-xl mb-1">Compliance Obligations</p>
                            {searchResults.compliance.map(i => (
                              <button 
                                key={i.id} 
                                onClick={() => { navigate(`/compliance?id=${i.id}`); setIsSearchOpen(false); }}
                                className="w-full flex items-center p-3 hover:bg-indigo-50 rounded-2xl transition-colors text-left group"
                              >
                                <ShieldCheck className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 mr-3" />
                                <div>
                                  <p className="text-sm font-bold text-gray-900 leading-tight">{i.title}</p>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">{i.regulator || i.category}</span>
                                    <span className="text-[9px] text-gray-300">•</span>
                                    <span className="text-[9px] font-bold text-gray-400 truncate max-w-[120px]">{i.companies?.name}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {searchResults.documents.length > 0 && (
                          <div className="mb-2">
                            <p className="px-3 py-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50 rounded-xl mb-1">Document Vault</p>
                            {searchResults.documents.map(d => (
                              <button 
                                key={d.id} 
                                onClick={() => { navigate(`/documents?id=${d.id}`); setIsSearchOpen(false); }}
                                className="w-full flex items-center p-3 hover:bg-indigo-50 rounded-2xl transition-colors text-left group"
                              >
                                <FileUp className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 mr-3" />
                                <div>
                                  <p className="text-sm font-bold text-gray-900 leading-tight">{d.title}</p>
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{d.category}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center border-l border-gray-100 pl-4 space-x-1 md:space-x-2">
            <button 
                title="System Status"
                className="hidden sm:flex p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
            >
                <ShieldCheck className="h-5 w-5" />
            </button>
            
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  title="Notifications"
                  className={cn(
                    "p-2 rounded-xl transition-all relative",
                    isNotificationsOpen ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  )}
              >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 block h-4 w-4 rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="fixed lg:absolute left-0 right-0 lg:left-auto lg:right-0 top-16 md:top-18 lg:top-full lg:mt-2 w-full lg:w-96 bg-white lg:rounded-3xl border-b lg:border border-gray-100 shadow-2xl overflow-hidden z-50 flex flex-col max-h-[calc(100vh-64px)] md:max-h-[calc(100vh-72px)] lg:max-h-[32rem]"
                  >
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
                      <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Platform Alerts</p>
                      <button className="text-[9px] font-black text-indigo-600 uppercase">Clear All</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                      {notifications.length > 0 ? (
                        <div className="space-y-1">
                          {notifications.map((n) => (
                            <button 
                              key={n.id}
                              onClick={() => { navigate(n.url); setIsNotificationsOpen(false); }}
                              className="w-full flex items-start p-3 hover:bg-gray-50 rounded-2xl transition-colors text-left group"
                            >
                              <div className={cn(
                                "p-2 rounded-xl mr-3 flex-shrink-0 transition-all group-hover:scale-110",
                                n.type === 'overdue' ? "bg-red-50 text-red-600" : 
                                n.type === 'today' ? "bg-orange-50 text-orange-600" : 
                                n.type === 'soon' ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"
                              )}>
                                {n.type === 'overdue' ? <AlertCircle className="h-4 w-4" /> : 
                                 n.type === 'today' ? <Clock className="h-4 w-4" /> : 
                                 n.type === 'soon' ? <Calendar className="h-4 w-4" /> : <FileWarning className="h-4 w-4" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 line-clamp-1">{n.title}</p>
                                <p className="text-[10px] text-gray-500 font-medium truncate">{n.company}</p>
                                <p className={cn(
                                  "text-[9px] font-black uppercase tracking-tighter mt-1",
                                  n.type === 'overdue' ? "text-red-500" : "text-gray-400"
                                )}>
                                  {n.type === 'overdue' ? 'Overdue Action' : n.type === 'today' ? 'Due Today' : n.type === 'soon' ? `Due ${formatDate(n.dueDate)}` : 'Missing Evidence'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center">
                          <CheckCircle2 className="h-8 w-8 text-emerald-100 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">You're all caught up</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 text-center flex-shrink-0">
                       <button onClick={() => {navigate('/compliance'); setIsNotificationsOpen(false);}} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                          View Compliance Calendar
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Help Icon */}
            <button 
                onClick={() => setIsHelpOpen(true)}
                title="Help & Support"
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            >
                <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              className={cn(
                "hidden sm:flex items-center px-4 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 group",
                isNewMenuOpen ? "bg-indigo-600 text-white" : "bg-gray-900 text-white hover:bg-black"
              )}
            >
              <PlusCircle className={cn(
                "h-4 w-4 mr-2 transition-colors",
                isNewMenuOpen ? "text-white" : "text-gray-400 group-hover:text-white"
              )} />
              <span className="text-xs font-black uppercase tracking-widest mr-2">New Record</span>
              <ChevronDown className={cn(
                "h-3 w-3 transition-transform duration-200",
                isNewMenuOpen ? "rotate-180" : ""
              )} />
            </button>

            {/* Mobile "+" Button */}
            <button 
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              className="sm:hidden p-2.5 bg-gray-900 text-white rounded-xl shadow-lg active:scale-95"
            >
              <PlusCircle className="h-6 w-6" />
            </button>

            <AnimatePresence>
              {isNewMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-[110] origin-top-right"
                >
                  <div className="p-3">
                    <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Create New Record</p>
                    <div className="grid grid-cols-1 gap-1">
                      {newRecordOptions.map((option) => (
                        <button
                          key={option.label}
                          onClick={() => handleNewRecordAction(option.path)}
                          className="flex items-start p-3 hover:bg-indigo-50 rounded-xl transition-all group group-active:scale-[0.98]"
                        >
                          <div className="p-2.5 bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-indigo-600 rounded-lg transition-colors shadow-sm">
                            <option.icon className="h-5 w-5" />
                          </div>
                          <div className="ml-3 text-left">
                            <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-700">{option.label}</p>
                            <p className="text-[10px] text-gray-400 line-clamp-1">{option.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">HoldCo OS Actions</p>
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Help / FAQ Modal */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHelpOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 bg-indigo-600 text-white relative flex-shrink-0">
                 <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                       <ShieldCheck className="h-8 w-8 text-indigo-200" />
                       <button 
                        onClick={() => setIsHelpOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                       >
                         <X className="h-6 w-6" />
                       </button>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Platform Guide & Support</h3>
                    <p className="text-indigo-100 font-medium italic">Everything you need to know about navigating HoldCo OS</p>
                 </div>
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-32 -translate-y-32"></div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                 <div className="space-y-6">
                    {faqs.map((faq, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group hover:border-indigo-200 transition-colors">
                        <div className="flex items-start">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Info className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-wide">{faq.q}</h4>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">{faq.a}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>

                 <div className="mt-12 p-8 bg-black rounded-3xl text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Still need assistance?</p>
                    <p className="text-white font-bold mb-6">Contact our technical architecture team for 24/7 group support.</p>
                    <button className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 active:scale-95 transition-all shadow-lg flex items-center mx-auto">
                       <ExternalLink className="h-4 w-4 mr-2" />
                       Support Center
                    </button>
                 </div>
              </div>

              <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                 <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cortex Engine Ready</span>
                 </div>
                 <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">v1.1 Stable Build</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
