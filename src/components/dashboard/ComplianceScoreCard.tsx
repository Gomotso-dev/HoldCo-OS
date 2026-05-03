import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ShieldAlert, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { ComplianceScoreService, ComplianceScore } from '../../services/complianceScore';
import { cn } from '../../lib/utils';

interface ComplianceScoreCardProps {
  userId: string;
}

export default function ComplianceScoreCard({ userId }: ComplianceScoreCardProps) {
  const [data, setData] = useState<ComplianceScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScore() {
      try {
        setLoading(true);
        console.log('[ComplianceScoreCard] Fetching score for userId:', userId);
        const scoreData = await ComplianceScoreService.getGroupComplianceScore(userId);
        console.log('[ComplianceScoreCard] Received data:', scoreData);
        setData(scoreData);
      } catch (err) {
        console.error('[ComplianceScoreCard] Failed to fetch compliance score:', err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) fetchScore();
    else console.warn('[ComplianceScoreCard] No userId provided');
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-center h-32 mb-6">
        <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    console.log('[ComplianceScoreCard] No data available, returning null');
    return null;
  }

  const getStatusColor = (label: string) => {
    switch (label) {
      case 'Healthy': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Needs Attention': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'At Risk': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Critical': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getIcon = (label: string) => {
    switch (label) {
      case 'Healthy': return <ShieldCheck className="h-8 w-8 text-emerald-500" />;
      case 'Needs Attention': return <Shield className="h-8 w-8 text-amber-500" />;
      case 'At Risk': return <AlertTriangle className="h-8 w-8 text-orange-500" />;
      case 'Critical': return <ShieldAlert className="h-8 w-8 text-red-500" />;
      default: return <Shield className="h-8 w-8 text-gray-400" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 overflow-hidden relative"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-6">
          {/* Circular Score Plate */}
          <div className="relative flex-shrink-0">
            <svg className="h-20 w-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-100"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={226.2}
                strokeDashoffset={226.2 - (226.2 * data.score) / 100}
                className={cn(
                  "transition-all duration-1000 ease-out",
                  data.score >= 80 ? "text-emerald-500" :
                  data.score >= 60 ? "text-amber-500" :
                  data.score >= 40 ? "text-orange-500" : "text-red-500"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-gray-900 leading-none">{data.score}%</span>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Compliance Health</h3>
              <span className={cn(
                "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                getStatusColor(data.label)
              )}>
                {data.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Overall risk profile for your company group.
            </p>
          </div>
        </div>

        <div className="flex-1 md:max-w-xs">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Key Risk Factors</h4>
          {data.riskReasons.length > 0 ? (
            <ul className="space-y-1.5">
              {data.riskReasons.map((reason, idx) => (
                <li key={idx} className="flex items-center text-[11px] font-bold text-gray-700">
                  <div className="w-1 h-1 rounded-full bg-red-400 mr-2 flex-shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] font-bold text-emerald-600 flex items-center">
              <ShieldCheck className="h-3 w-3 mr-1.5" />
              All critical obligations are up to date
            </p>
          )}
        </div>

        <div className="hidden lg:block">
           {getIcon(data.label)}
        </div>
      </div>
    </motion.div>
  );
}
