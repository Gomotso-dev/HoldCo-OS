import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Clock, CheckCircle2, ShieldAlert, Loader2, ChevronRight, Check, Upload } from 'lucide-react';
import { getTodaysActions, TodaysAction } from '../../services/complianceActions';
import { ActivityLogService } from '../../services/activityLogService';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface TodaysActionPanelProps {
  userId: string;
}

export default function TodaysActionPanel({ userId }: TodaysActionPanelProps) {
  const navigate = useNavigate();
  const [actions, setActions] = useState<TodaysAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingActionId, setConfirmingActionId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchActions = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('[TodaysActionPanel] Fetching actions for userId:', userId);
      const data = await getTodaysActions(userId);
      setActions(data);
    } catch (err: any) {
      console.error('[TodaysActionPanel] Failed to fetch today\'s actions:', err);
      setError('We encountered a temporary issue loading your workspace actions. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchActions();
    }
  }, [userId]);

  const handleView = (itemId: string) => {
    navigate(`/compliance?itemId=${itemId}`);
  };

  const handleMarkComplete = async (itemId: string) => {
    try {
      setIsUpdating(true);
      const { error: updateError } = await supabase
        .from('compliance')
        .update({ status: 'Completed', updatedAt: new Date().toISOString() })
        .eq('id', itemId);

      if (updateError) throw updateError;
      
      // 2. Fetch action details for logging
      const { data: itemData } = await supabase
        .from('compliance')
        .select('title, companyId')
        .eq('id', itemId)
        .single();

      if (itemData) {
        await ActivityLogService.logActivity({
          actionType: 'compliance_completed' as any,
          description: `Completed compliance task: ${itemData.title}`,
          companyId: itemData.companyId,
          complianceId: itemId
        });
      }

      // Refresh list
      await fetchActions();
      setConfirmingActionId(null);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert('Failed to complete action');
    } finally {
      setIsUpdating(false);
    }
  };

  const getDueMessage = (action: TodaysAction) => {
    const days = Math.abs(action.days_until_due);
    if (action.urgency_type === 'overdue') {
      return `Overdue by ${days} day${days !== 1 ? 's' : ''} — penalties may apply`;
    }
    if (action.urgency_type === 'due_today') {
      return 'Due today — complete this as soon as possible';
    }
    return `Due in ${days} day${days !== 1 ? 's' : ''}`;
  };

  const getBadgeStyles = (type: string) => {
    switch (type) {
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'due_today':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
  };

  const getReadinessBadgeStyles = (status: string) => {
    switch (status) {
      case 'Ready to Submit':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Missing Documents':
        return 'bg-orange-50 text-orange-700 border-orange-100';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const getRiskBadgeStyles = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case 'due_today':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-indigo-500" />;
    }
  };

  if (loading && actions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading urgent actions...</p>
      </div>
    );
  }

  if (error && actions.length === 0) {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-100 p-6 flex flex-col items-center justify-center text-center">
        <AlertCircle className="h-8 w-8 text-red-600 mb-2" />
        <p className="text-sm font-bold text-red-700">{error}</p>
        <button onClick={fetchActions} className="mt-4 text-xs font-black uppercase text-red-600 hover:underline">Try Again</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
          Today's Actions
        </h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Showing Top {actions.length}
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {actions.length > 0 ? (
          actions.map((action) => (
            <div 
              key={action.id}
              className={cn(
                "px-6 py-5 flex flex-col sm:flex-row sm:items-center hover:bg-gray-50/50 transition-colors group relative",
                action.urgency_type === 'overdue' && "bg-red-50/20"
              )}
            >
              <div className="flex items-start flex-1 min-w-0">
                <div className="mr-4 mt-0.5 flex-shrink-0">
                  {getIcon(action.urgency_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="text-sm font-black text-gray-900 truncate">{action.compliance_name}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                      getBadgeStyles(action.urgency_type)
                    )}>
                      {action.urgency_type.replace('_', ' ')}
                    </span>
                    {action.risk_level && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                        getRiskBadgeStyles(action.risk_level)
                      )}>
                        {action.risk_level} Risk
                      </span>
                    )}
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                      getReadinessBadgeStyles(action.document_readiness)
                    )}>
                      {action.document_readiness}
                    </span>
                  </div>
                  <div className="flex items-center text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">
                    <span className="truncate max-w-[150px]">{action.company_name}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span>{action.regulator}</span>
                  </div>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-tight",
                    action.urgency_type === 'overdue' ? "text-red-500" : 
                    action.urgency_type === 'due_today' ? "text-amber-600" : "text-gray-400"
                  )}>
                    {getDueMessage(action)}
                  </p>
                  {action.document_readiness === 'Missing Documents' && (
                    <p className="text-[9px] text-orange-600 font-bold uppercase tracking-tight mt-1.5 flex items-center">
                      <AlertCircle className="h-2.5 w-2.5 mr-1" />
                      Upload required documents before completing this item
                    </p>
                  )}
                </div>
              </div>

              {/* Action Section */}
              <div className="mt-4 sm:mt-0 sm:ml-6 flex items-center space-x-2">
                <AnimatePresence mode="wait">
                  {confirmingActionId === action.id ? (
                    <motion.div 
                      key="confirm"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center space-x-2"
                    >
                      <button
                        disabled={isUpdating}
                        onClick={() => handleMarkComplete(action.id)}
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center hover:bg-emerald-700 transition-colors"
                      >
                        {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Check className="h-3 w-3 mr-1.5" />}
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmingActionId(null)}
                        className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="actions"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-2"
                    >
                      {action.document_readiness === 'Missing Documents' && (
                        <button
                          onClick={() => navigate(`/documents?companyId=${action.companyId}&complianceId=${action.id}&upload=true&title=${encodeURIComponent(action.required_documents[0] || '')}`)}
                          className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm shadow-orange-100 active:scale-95 flex items-center"
                        >
                          <Upload className="h-3 w-3 mr-1.5" />
                          Upload Document
                        </button>
                      )}
                      <button
                        onClick={() => handleView(action.id)}
                        className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95 flex items-center"
                      >
                        View Item
                        <ChevronRight className="ml-1.5 h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setConfirmingActionId(action.id)}
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm shadow-indigo-100 active:scale-95"
                      >
                        Complete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">✅ You're all caught up</h4>
            <p className="text-xs text-gray-500 font-medium mt-1">No urgent actions require your attention today.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
