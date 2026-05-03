import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden print:h-auto print:overflow-visible">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden print:overflow-visible">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 overflow-x-hidden print:overflow-visible print:p-0">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
