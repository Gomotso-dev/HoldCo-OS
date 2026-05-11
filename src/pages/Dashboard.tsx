import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  AlertCircle, 
  FileWarning, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Files,
  Wallet,
  Loader2,
  ArrowRightLeft,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  AreaChart,
  Area
} from 'recharts';
import { cn, formatRelativeTime } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { ActivityLogService, ActivityLog } from '../services/activityLogService';
import { SafeChart } from '../components/SafeChart';
import TodaysActionPanel from '../components/dashboard/TodaysActionPanel';
import ComplianceScoreCard from '../components/dashboard/ComplianceScoreCard';

import { NotificationService } from '../services/notificationService';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { name: 'Total Companies', value: '0', icon: Building2, change: '0', changeType: 'neutral' },
    { name: 'Active Deadlines', value: '0', icon: Clock, change: '0', changeType: 'neutral' },
    { name: 'Overdue Items', value: '0', icon: AlertCircle, change: '0', changeType: 'neutral' },
    { name: 'Missing Documents', value: '0', icon: FileWarning, change: '0', changeType: 'neutral' },
  ]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [companiesCount, setCompaniesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [urgentCount, setUrgentCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardData();
  }, []);

  // Handle Notifications
  useEffect(() => {
    if (userId) {
      const today = new Date().toISOString().split('T')[0];
      const lastSummary = localStorage.getItem(`last_summary_${userId}`);
      
      // Send daily summary once per day
      if (lastSummary !== today) {
        NotificationService.sendDailySummary(userId);
        localStorage.setItem(`last_summary_${userId}`, today);
      }

      // Process triggers (1-day alerts, etc.) once per session
      const sessionTriggered = sessionStorage.getItem(`session_triggered_${userId}`);
      if (!sessionTriggered) {
        NotificationService.processTriggers(userId);
        sessionStorage.setItem(`session_triggered_${userId}`, 'true');
      }
    }
  }, [userId]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // 1. Fetch Companies Count
      const { count: companiesCountRes } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      
      setCompaniesCount(companiesCountRes || 0);

      // 2. Fetch Active Deadlines Count
      const { count: deadlinesCount, data: upcomingCompliance } = await supabase
        .from('compliance')
        .select('due_date, status', { count: 'exact' })
        .eq('owner_id', user.id)
        .neq('status', 'Completed');

      const overdueCount = upcomingCompliance?.filter(item => item.status === 'Overdue').length || 0;

      // Calculate urgent compliance (Overdue + Due in next 7 days)
      const nowTime = new Date();
      nowTime.setHours(0, 0, 0, 0); // Start of today
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(23, 59, 59, 999); // End of next week
      
      const urgentItems = upcomingCompliance?.filter(item => {
        if (item.status === 'Overdue') return true;
        const dueDateValue = new Date(item.due_date);
        return dueDateValue <= nextWeek;
      }) || [];
      
      setUrgentCount(urgentItems.length);

      // 3. Fetch Expiring Documents Count (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const threshold = thirtyDaysFromNow.toISOString().split('T')[0];
      
      const docsRes = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .lte('expiry_date', threshold);
      
      let expiringDocsCount = docsRes.count;
      if (docsRes.error) {
        console.error('Expiring documents fetch error:', docsRes.error);
        // We will just report 0 rather than falling back to non-existent columns
        expiringDocsCount = 0;
      }

      // 4. Fetch Total Cash (Sum of Income - Sum of Expenses)
      const { data: financeData } = await supabase
        .from('finance')
        .select('amount, type, date')
        .eq('owner_id', user.id);

      const totalIncome = financeData?.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0) || 0;
      const totalExpenses = financeData?.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0) || 0;
      const netCash = totalIncome - totalExpenses;

      // 5. Process Chart Data (Last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const last6Months = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
          name: months[d.getMonth()],
          monthNum: d.getMonth(),
          year: d.getFullYear(),
          income: 0,
          expenses: 0
        });
      }

      financeData?.forEach(tx => {
        const txDate = new Date(tx.date);
        const chartMonth = last6Months.find(m => m.monthNum === txDate.getMonth() && m.year === txDate.getFullYear());
        if (chartMonth) {
          if (tx.type === 'Income') chartMonth.income += tx.amount;
          if (tx.type === 'Expense') chartMonth.expenses += tx.amount;
        }
      });

      setChartData(last6Months.map(({ name, income, expenses }) => ({ name, income, expenses })));

      // 6. Fetch Recent Activity
      const activityData = await ActivityLogService.getRecentActivity(user.id, 5);
      setRecentActivity(activityData);

      setStats([
        { name: 'Total Companies', value: (companiesCountRes || 0).toString(), icon: Building2, change: '0', changeType: 'neutral' },
        { name: 'Active Deadlines', value: (deadlinesCount || 0).toString(), icon: Clock, change: '0', changeType: 'neutral' },
        { name: 'Overdue Items', value: overdueCount.toString(), icon: AlertCircle, change: '0', changeType: 'danger' },
        { name: 'Missing Documents', value: (expiringDocsCount || 0).toString(), icon: FileWarning, change: '0', changeType: 'neutral' },
      ]);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err.message);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Welcome back</h2>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening across your business group today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link 
            to="/compliance-report"
            className="flex items-center px-4 py-2 bg-black text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-md active:scale-95"
          >
            <Printer className="h-4 w-4 mr-2" />
            Export Report
          </Link>
          <div className="flex items-center space-x-2 text-[10px] md:text-sm text-gray-500 bg-white px-3 md:px-4 py-2 rounded-xl border border-gray-200 shadow-sm w-fit">
            <Clock className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-medium">Last updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          <button 
            onClick={() => fetchDashboardData()}
            className="ml-auto text-xs font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Onboarding Checklist for New Founders */}
      {companiesCount === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-600 rounded-2xl md:rounded-3xl p-4 md:p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 md:gap-8 items-start">
            <div className="w-full">
              <h3 className="text-lg md:text-2xl font-black mb-1 md:mb-3 flex items-center">
                Launch Checklist <span className="ml-3 text-[10px] bg-white text-indigo-600 px-2 py-0.5 rounded-full uppercase font-black">Beta</span>
              </h3>
              <p className="text-xs md:text-sm text-indigo-100 mb-4 md:mb-8 max-w-lg">Welcome to HoldCo OS. Build your single source of truth for your business group.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {[
                  { title: 'Add your first company', desc: 'Centralize your entity data', icon: Building2, link: '/companies', step: 1 },
                  { title: 'Upload key documents', desc: 'CIPC, Tax, and Legal papers', icon: Files, link: '/documents', step: 2 },
                  { title: 'Log compliance deadlines', desc: 'Never miss a filing again', icon: Clock, link: '/compliance', step: 3 },
                ].map((step, i) => (
                  <Link 
                    key={i} 
                    to={step.link}
                    className="flex items-center md:items-start bg-white/10 hover:bg-white/20 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/10 transition-all group"
                  >
                    <div className="bg-white/20 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-lg md:rounded-xl mr-3 md:mr-4 flex-shrink-0 font-black text-xs md:text-base">
                      {step.step}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-xs md:text-sm truncate">{step.title}</p>
                      <p className="text-[10px] md:text-xs text-indigo-500/0 md:text-indigo-100 truncate">{step.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {[
          { name: 'New Company', icon: Building2, link: '/companies', color: 'bg-blue-600' },
          { name: 'New Deadline', icon: Clock, link: '/compliance', color: 'bg-amber-600' },
          { name: 'New Document', icon: Files, link: '/documents', color: 'bg-purple-600' },
        ].map((action, i) => (
          <Link
            key={i}
            to={action.link}
            className="flex flex-col md:flex-row items-center justify-center md:justify-start p-3 md:p-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group min-h-[64px] md:min-h-0"
          >
            <div className={cn("p-2 rounded-xl text-white md:mr-3 shadow-sm group-hover:scale-110 transition-transform mb-2 md:mb-0", action.color)}>
              <action.icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-700 text-center md:text-left">{action.name}</span>
          </Link>
        ))}
      </div>

      {/* Compliance Health Score */}
      {!loading && userId && (
        <ComplianceScoreCard userId={userId} />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
              </div>
              <div className={cn(
                "flex items-center text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                stat.changeType === 'increase' ? "bg-green-50 text-green-700" : 
                stat.changeType === 'decrease' ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"
              )}>
                {stat.changeType === 'increase' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                 stat.changeType === 'decrease' ? <ArrowDownRight className="h-3 w-3 mr-1" /> : null}
                {stat.change}
              </div>
            </div>
            <p className="text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-400">{stat.name}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                {loading && index === 0 ? <Loader2 className="h-5 w-5 animate-spin inline" /> : stat.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Today's Action Panel */}
      {!loading && userId && (
        <TodaysActionPanel userId={userId} />
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <button 
              onClick={() => navigate('/activity')}
              className="text-sm text-indigo-600 font-medium hover:text-indigo-700 active:scale-95 transition-transform"
            >
              View all
            </button>
          </div>
          <div className="space-y-6">
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <div key={item.id} className="flex items-start space-x-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    item.action_type === 'document_uploaded' ? "bg-blue-50 text-blue-600" :
                    item.action_type === 'compliance_completed' ? "bg-emerald-50 text-emerald-600" :
                    item.action_type === 'setup_completed' ? "bg-purple-50 text-purple-600" :
                    item.action_type === 'company_created' ? "bg-indigo-50 text-indigo-600" :
                    item.action_type === 'compliance_generated' ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-600"
                  )}>
                    {item.action_type === 'document_uploaded' ? <Files className="h-4 w-4" /> :
                     item.action_type === 'compliance_completed' ? <CheckCircle2 className="h-4 w-4" /> :
                     item.action_type === 'setup_completed' ? <ShieldCheck className="h-4 w-4" /> : 
                     item.action_type === 'company_created' ? <Building2 className="h-4 w-4" /> : 
                     item.action_type === 'compliance_generated' ? <Clock className="h-4 w-4" /> : <ArrowRightLeft className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.description}</p>
                    <p className="text-xs text-gray-500 truncate">{item.company_name || 'System'}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(item.created_at)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400">
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
          <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex items-center space-x-3">
              <AlertCircle className={cn("h-5 w-5", urgentCount > 0 ? "text-indigo-600" : "text-emerald-600")} />
              <p className="text-xs font-medium text-indigo-900">
                {urgentCount > 0 ? (
                  <>
                    You have <span className="font-bold">{urgentCount} urgent compliance item{urgentCount !== 1 ? 's' : ''}</span> requiring attention.
                  </>
                ) : (
                  "You're all caught up — no compliance items due this week."
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
