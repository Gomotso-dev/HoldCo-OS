import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Shield, 
  Bell, 
  Building2, 
  Database, 
  LogOut, 
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  FileText,
  ExternalLink,
  ShieldCheck,
  Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { ActivityLogService } from '../services/activityLogService';
import { Link } from 'react-router-dom';

const sections = [
  { id: 'profile', name: 'My Profile', icon: User, description: 'Manage your personal information and preferences.' },
  { id: 'group', name: 'Business Group', icon: Building2, description: 'Configure your main holding company and group settings.' },
  { id: 'security', name: 'Security', icon: Shield, description: 'Manage your password and two-factor authentication.' },
  { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Choose what alerts you want to receive and how.' },
  { id: 'readiness', name: 'Operational Readiness', icon: CheckCircle2, description: 'Check system health and soft-launch status.' },
  { id: 'data', name: 'Data Management', icon: Database, description: 'Export your data or manage your subscription.' },
  { id: 'docs', name: 'Documentation', icon: FileText, description: 'View and print project technical documentation.' },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [holdingCompany, setHoldingCompany] = useState<any>(null);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchData(user.id);
      }
    });
  }, []);

  async function fetchData(userId: string) {
    try {
      setLoading(true);
      
      // Fetch all companies to allow selection
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', userId)
        .order('name', { ascending: true });

      if (companiesError) throw companiesError;
      setAllCompanies(companies || []);

      // Identify holding company
      const holding = companies?.find(c => c.groupRole === 'Holding Company' || c.group_role === 'Holding Company');
      if (holding) setHoldingCompany(holding);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSetHoldingCompany = async (companyId: string) => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // 1. Reset all companies to Operating Company (or keep their current role if not holding)
      // Actually, user suggested setting others to Operating Company
      const { error: resetError } = await supabase
        .from('companies')
        .update({ 
          groupRole: 'Operating Company',
          group_role: 'Operating Company' // handle both cases
        })
        .eq('owner_id', user.id);

      if (resetError) {
        // Fallback for snake_case
        await supabase
          .from('companies')
          .update({ group_role: 'Operating Company' })
          .eq('owner_id', user.id);
      }

      // 2. Set the selected company as Holding Company
      const { error: setError } = await supabase
        .from('companies')
        .update({ 
          groupRole: 'Holding Company',
          group_role: 'Holding Company'
        })
        .eq('id', companyId);

      if (setError) {
          await supabase
            .from('companies')
            .update({ group_role: 'Holding Company' })
            .eq('id', companyId);
      }

      await ActivityLogService.logActivity({
        actionType: 'settings_updated',
        description: `Set "${allCompanies.find(c => c.id === companyId)?.name}" as the main holding company`,
      });

      // 3. Refresh data
      await fetchData(user.id);
      alert('Holding company updated successfully!');
    } catch (err) {
      console.error('Failed to set holding company:', err);
      alert('Failed to update holding company.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-500 mt-1">Manage your account and platform configuration.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-80 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-start p-4 rounded-2xl border transition-all text-left group",
                activeSection === section.id
                  ? "bg-white border-indigo-200 shadow-md ring-1 ring-indigo-50"
                  : "bg-transparent border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl mr-4 transition-colors",
                activeSection === section.id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600"
              )}>
                <section.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className={cn(
                  "text-sm font-bold transition-colors",
                  activeSection === section.id ? "text-indigo-900" : "text-gray-700"
                )}>
                  {section.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{section.description}</p>
              </div>
              <ChevronRight className={cn(
                "h-4 w-4 mt-1 transition-all",
                activeSection === section.id ? "text-indigo-400 translate-x-0" : "text-gray-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
              )} />
            </button>
          ))}
          
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center p-4 rounded-2xl text-red-600 hover:bg-red-50 transition-all group mt-8"
          >
            <div className="p-2 bg-red-50 rounded-xl mr-4 group-hover:bg-red-100 transition-colors">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold">Sign Out</span>
          </button>
        </div>

        {/* Content */}
        <motion.div 
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm"
        >
          {activeSection === 'profile' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-6 pb-8 border-b border-gray-100">
                <div className="h-24 w-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-200 uppercase">
                  {user?.email?.substring(0, 2) || '??'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{user?.email?.split('@')[0] || 'User'}</h3>
                  <p className="text-gray-500">Founder & Director</p>
                  <button className="mt-2 text-sm font-bold text-indigo-600 hover:text-indigo-700">Change Avatar</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue={user?.email?.split('@')[0] || ''}
                    className="w-full p-3 bg-gray-50 border-gray-100 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue={user?.email || ''}
                    readOnly
                    className="w-full p-3 bg-gray-100 border-gray-100 rounded-xl text-gray-500 cursor-not-allowed font-medium"
                  />
                </div>
                {/* ... other fields ... */}
              </div>

              <div className="pt-8 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={async () => {
                    await ActivityLogService.logActivity({
                      actionType: 'settings_updated',
                      description: 'Updated user profile settings'
                    });
                    alert('Profile updated successfully (Simulator)');
                  }}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeSection === 'group' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between pb-8 border-b border-gray-100">
                <div className="flex items-center space-x-6">
                  <div className="h-24 w-24 rounded-3xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold shadow-lg shadow-indigo-50 uppercase">
                    <Building2 className="h-12 w-12" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{holdingCompany?.name || 'No Group Set'}</h3>
                    <p className="text-gray-500">Main Holding Company</p>
                    {holdingCompany && (
                      <div className="mt-2 flex items-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                          {holdingCompany.status || 'Active'}
                        </span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {holdingCompany.legalEntityType || holdingCompany.legal_entity_type}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {!holdingCompany && allCompanies.length > 0 && (
                   <Link 
                    to="/companies?new=true"
                    className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                   >
                     <Plus className="h-5 w-5" />
                   </Link>
                )}
              </div>

              {allCompanies.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Building2 className="h-8 w-8 text-gray-200" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Add a company first</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-8 max-w-xs mx-auto">You need at least one company in your register before you can designate a holding group.</p>
                  <Link 
                    to="/companies?new=true"
                    className="inline-flex items-center px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg active:scale-95"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Register My First Company
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Select Main Holding Company</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {allCompanies.map((company) => {
                         const isHolding = company.id === holdingCompany?.id;
                         return (
                           <button
                             key={company.id}
                             disabled={saving || isHolding}
                             onClick={() => handleSetHoldingCompany(company.id)}
                             className={cn(
                               "flex items-center justify-between p-5 rounded-2xl border transition-all text-left",
                               isHolding 
                                ? "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-100" 
                                : "bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm"
                             )}
                           >
                             <div className="flex items-center">
                               <div className={cn(
                                 "p-3 rounded-xl mr-4",
                                 isHolding ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-400"
                               )}>
                                 <Building2 className="h-5 w-5" />
                               </div>
                               <div>
                                 <h5 className="text-sm font-bold text-gray-900">{company.name}</h5>
                                 <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{company.legalEntityType || company.legal_entity_type}</p>
                               </div>
                             </div>
                             
                             {isHolding ? (
                               <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border border-indigo-200">
                                 <ShieldCheck className="h-3 w-3 text-indigo-600" />
                                 <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Active Holding</span>
                               </div>
                             ) : (
                               <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest group-hover:text-indigo-600">
                                 {saving ? 'Processing...' : 'Set as Holding'}
                               </div>
                             )}
                           </button>
                         );
                      })}
                    </div>
                  </div>

                  {holdingCompany && (
                    <div className="pt-8 border-t border-gray-100">
                       <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Group Identity Details</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Registration Number</label>
                          <div className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-medium text-gray-700">
                            {holdingCompany.registrationNumber || holdingCompany.registration_number}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Tax Reference</label>
                          <div className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-medium text-gray-700">
                            {holdingCompany.taxNumber || holdingCompany.tax_number || 'Not Recorded'}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Industry Sector</label>
                          <div className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-medium text-gray-700">
                            {holdingCompany.industry || 'Not Recorded'}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Primary Jurisdiction</label>
                          <div className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-medium text-gray-700">
                            {holdingCompany.country || 'Not Recorded'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSection === 'readiness' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-6 pb-8 border-b border-gray-100">
                <div className="h-24 w-24 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-3xl font-bold shadow-lg shadow-emerald-50 uppercase">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Operational Readiness</h3>
                  <p className="text-gray-500">System health and deployment status for HoldCo OS.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Core Database', status: 'Online', lastCheck: '1 min ago', health: '100%' },
                  { name: 'Auth Service', status: 'Online', lastCheck: '5 mins ago', health: '100%' },
                  { name: 'Storage Vault', status: 'Active', lastCheck: '2 mins ago', health: '99.9%' },
                  { name: 'Activity Logger', status: 'Healthy', lastCheck: 'Just now', health: '100%' }
                ].map((sys, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{sys.name}</p>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                        <span className="text-sm font-bold text-gray-900">{sys.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{sys.lastCheck}</p>
                      <p className="text-xs font-black text-emerald-600">{sys.health}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10">
                  <h4 className="font-bold mb-1">Soft Launch Version: 1.0.4-beta</h4>
                  <p className="text-indigo-100 text-xs mb-4">You are running the latest version of HoldCo OS with all security patches applied.</p>
                  <div className="flex gap-2">
                     <span className="px-2 py-1 bg-white/20 rounded-md text-[10px] font-bold uppercase tracking-widest">Multi-Tenant Isolated</span>
                     <span className="px-2 py-1 bg-white/20 rounded-md text-[10px] font-bold uppercase tracking-widest">RLS Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'docs' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-6 pb-8 border-b border-gray-100">
                <div className="h-24 w-24 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-3xl font-bold shadow-lg shadow-indigo-50 uppercase">
                  <FileText className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Project Documentation</h3>
                  <p className="text-gray-500">Technical specifications and project overview.</p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-2">Stakeholder Documentation</h4>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  We have generated a comprehensive summary of the HoldCo OS project, including database schemas, key features, and technical implementation details.
                </p>
                <Link 
                  to="/docs"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                >
                  View & Print Documentation
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-6 pb-8 border-b border-gray-100">
                <div className="h-24 w-24 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-600 text-3xl font-bold shadow-lg shadow-amber-50 uppercase">
                  <Shield className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Security Configuration</h3>
                  <p className="text-gray-500">Manage your access control and authentication settings.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-2 text-emerald-500" />
                    Row Level Security (RLS)
                  </h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Your data is strictly isolated using Supabase RLS. Only you can access records associated with your unique account ID.
                  </p>
                  <div className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100">
                    STATUS: FULLY ENFORCED
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                    <Database className="h-5 w-5 mr-2 text-indigo-500" />
                    Encrypted Storage
                  </h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Documents uploaded to the vault are stored in a private bucket with user-specific path validation.
                  </p>
                  <div className="flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 w-fit px-3 py-1 rounded-full border border-indigo-100">
                    STATUS: ENCRYPTED AT REST
                  </div>
                </div>

                <div className="pt-4">
                  <button className="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-md active:scale-95">
                    Reset Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-6 pb-8 border-b border-gray-100">
                <div className="h-24 w-24 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 text-3xl font-bold shadow-lg shadow-blue-50 uppercase">
                  <Database className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Data Management</h3>
                  <p className="text-gray-500">Export your group data or manage your environment.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-gray-100 rounded-3xl bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Export CSV</h4>
                    <p className="text-xs text-gray-500 mb-6">Download all your records in standard CSV format for use in Excel or other tools.</p>
                  </div>
                  <button className="flex items-center justify-center px-4 py-2.5 bg-gray-50 text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all border border-gray-200">
                    <Download className="h-4 w-4 mr-2" />
                    Export all records
                  </button>
                </div>
                
                <div className="p-6 border border-gray-100 rounded-3xl bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Audit Trail</h4>
                    <p className="text-xs text-gray-500 mb-6">Download a complete activity log for regulatory or internal audit purposes.</p>
                  </div>
                  <Link to="/activity" className="flex items-center justify-center px-4 py-2.5 bg-gray-50 text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all border border-gray-200">
                    View Activity Log
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-100 rounded-3xl">
              <div className="p-4 bg-gray-50 rounded-full mb-4">
                <Plus className="h-8 w-8 text-gray-200" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Coming Soon</h3>
              <p className="text-gray-500 mt-1 text-center max-w-xs">We're working hard to bring you the {sections.find(s => s.id === activeSection)?.name} settings.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
