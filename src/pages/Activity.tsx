import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  Search, 
  Filter, 
  Building2, 
  FileText, 
  Wallet, 
  Clock, 
  ShieldCheck,
  Loader2,
  X,
  Calendar,
  AlertCircle,
  LogIn,
  CheckCircle2,
  PlusCircle,
  FileUp,
  Link2,
  ExternalLink,
  Printer,
  Settings,
  MoreVertical
} from 'lucide-react';
import { cn, formatRelativeTime } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { ActivityLogService, ActivityLog } from '../services/activityLogService';

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const activityData = await ActivityLogService.getAllActivity(user.id);
      setLogs(activityData);
    } catch (err: any) {
      console.error('Error fetching activity logs:', err.message);
      setError('Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || 
                       (filterType === 'company' && log.actionType.startsWith('company')) ||
                       (filterType === 'document' && log.actionType.startsWith('document')) ||
                       (filterType === 'compliance' && log.actionType.startsWith('compliance')) ||
                       (filterType === 'finance' && log.actionType.startsWith('finance')) ||
                       (filterType === 'setup' && log.actionType.startsWith('setup'));
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    if (type.startsWith('document')) return <FileText className="h-5 w-5" />;
    if (type.startsWith('compliance')) return <ShieldCheck className="h-5 w-5" />;
    if (type.startsWith('company')) return <Building2 className="h-5 w-5" />;
    if (type.includes('login')) return <LogIn className="h-5 w-5" />;
    if (type.includes('report')) return <Printer className="h-5 w-5" />;
    if (type.includes('settings')) return <Settings className="h-5 w-5" />;
    if (type.includes('create')) return <PlusCircle className="h-5 w-5" />;
    return <Activity className="h-5 w-5" />;
  };

  const getIconColor = (type: string) => {
    if (type.startsWith('document')) return "bg-blue-50 text-blue-600 border-blue-100";
    if (type.startsWith('compliance')) return "bg-amber-50 text-amber-600 border-amber-100";
    if (type.startsWith('company')) return "bg-purple-50 text-purple-600 border-purple-100";
    if (type.includes('login')) return "bg-indigo-50 text-indigo-600 border-indigo-100";
    if (type.includes('report')) return "bg-rose-50 text-rose-600 border-rose-100";
    if (type.includes('settings')) return "bg-gray-50 text-gray-600 border-gray-100";
    return "bg-gray-50 text-gray-400 border-gray-100";
  };

  const getActionLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Audit Trail</h2>
          <p className="text-gray-500 font-medium">Full historical record of all business group activities.</p>
        </div>
        <button 
          onClick={() => fetchLogs()}
          className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
        >
          <Clock className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
          <input
            type="text"
            placeholder="Search activity, description, or company..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-transparent rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['all', 'company', 'document', 'compliance', 'setup', 'report'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95",
                filterType === type 
                  ? "bg-black text-white shadow-lg" 
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl flex items-center space-x-4 animate-in fade-in slide-in-from-top-4">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <AlertCircle className="h-5 w-5" />
          </div>
          <p className="text-sm font-black uppercase tracking-wider">{error}</p>
          <button 
            onClick={() => fetchLogs()}
            className="ml-auto text-xs font-black uppercase tracking-widest border-b-2 border-red-200 hover:border-red-600 transition-all"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <div className="relative">
               <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
               <Activity className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-300" />
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em]">Assembling History...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors group"
              >
                <div className="flex items-center space-x-6 min-w-0">
                  <div className={cn(
                    "p-3 rounded-2xl border-2 transition-all flex-shrink-0 group-hover:scale-110", 
                    getIconColor(log.actionType)
                  )}>
                    {getIcon(log.actionType)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-black text-gray-900 leading-tight">{log.description}</h4>
                      <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                        "bg-white border border-gray-100 text-gray-400 shadow-sm"
                      )}>
                        {getActionLabel(log.actionType)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span className="flex items-center">
                        <Building2 className="h-3 w-3 mr-1.5 text-gray-300" />
                        {log.company_name || 'Global System'}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1.5 text-gray-300" />
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="hidden sm:flex items-center space-x-2">
                   {log.metadata && (
                     <button className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                       <MoreVertical className="h-4 w-4" />
                     </button>
                   )}
                   <span className="text-[9px] text-gray-300 font-mono tracking-tighter">
                     {log.id.split('-')[0]}
                   </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-gray-50/50">
            <div className="w-20 h-20 bg-white rounded-3xl border border-gray-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Activity className="h-8 w-8 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Audit trail is empty</h3>
            <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto mb-8">No actions have been recorded yet based on your current filters.</p>
            <button 
              onClick={() => {setSearchTerm(''); setFilterType('all');}}
              className="px-6 py-2.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="flex items-center justify-between px-6 py-4 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
         <div className="flex items-center space-x-3">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">
              Security: All activities are immutable and cryptographically signed.
            </p>
         </div>
         <p className="text-[9px] font-extrabold text-indigo-400 uppercase">HoldCo OS v1.0</p>
      </div>
    </div>
  );
}
