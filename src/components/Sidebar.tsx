import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Network, 
  Files, 
  CalendarClock, 
  Wallet, 
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  Activity,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Document Vault', href: '/documents', icon: Files },
  { name: 'Compliance', href: '/compliance', icon: CalendarClock },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  const SidebarContent = ({ className }: { className?: string }) => (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center justify-between flex-shrink-0 px-6 mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">HoldCo OS</span>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="md:hidden p-2 text-gray-400 hover:text-gray-500 rounded-xl transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200',
                      isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.name}</span>
                  {isActive && <ChevronRight className="h-4 w-4 text-indigo-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <button 
          onClick={handleSignOut}
          className="flex-shrink-0 w-full group block"
        >
          <div className="flex items-center">
            <div>
              <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold uppercase">
                {user?.email?.substring(0, 2) || '??'}
              </div>
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate max-w-[120px]">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">Founder</p>
            </div>
            <LogOut className="ml-auto h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0 border-r border-gray-200 print:hidden no-print">
        <div className="w-64">
           <SidebarContent />
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 md:hidden no-print">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
              aria-hidden="true"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative flex flex-col w-full max-w-xs h-full bg-white shadow-2xl focus:outline-none"
            >
              <SidebarContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
