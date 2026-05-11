import { Printer, Download, ArrowLeft, Building2, ShieldCheck, Network, Code2, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Documentation() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white p-8 md:p-16 print:p-0">
      {/* Header - Hidden on Print */}
      <div className="max-w-4xl mx-auto mb-12 flex items-center justify-between print:hidden">
        <Link to="/settings" className="flex items-center text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Link>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print to PDF
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="max-w-4xl mx-auto space-y-12 print:space-y-8">
        {/* Title Section */}
        <div className="text-center border-b pb-12 print:pb-8">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 print:w-16 print:h-16">
            <Building2 className="h-10 w-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4 print:text-3xl">HoldCo OS</h1>
          <p className="text-xl text-gray-500 print:text-lg">Project Documentation & Technical Specification</p>
          <p className="text-sm text-gray-400 mt-4 uppercase tracking-widest font-bold">Generated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Section 1: Overview */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Project Overview</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            HoldCo OS is a specialized management platform designed for holding companies to oversee their entire ecosystem of subsidiaries, legal entities, and compliance obligations. The platform provides a centralized "Source of Truth" for corporate governance, financial health, and group-wide activity tracking.
          </p>
        </section>

        {/* Section 2: Database Schema */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Database className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Database Schema (Supabase)</h2>
          </div>
          <p className="text-gray-600 mb-4">
            The database uses a hybrid naming convention to balance system consistency with frontend developer experience.
          </p>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 font-mono text-sm overflow-x-auto">
            <h4 className="font-bold text-gray-900 mb-4">Table: companies</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              <div className="flex justify-between border-b pb-1"><span className="text-indigo-600">name</span> <span className="text-gray-400">TEXT</span></div>
              <div className="flex justify-between border-b pb-1"><span className="text-indigo-600">legal_entity_type</span> <span className="text-gray-400">TEXT</span></div>
              <div className="flex justify-between border-b pb-1"><span className="text-indigo-600">group_role</span> <span className="text-gray-400">TEXT</span></div>
              <div className="flex justify-between border-b pb-1"><span className="text-indigo-600">registration_number</span> <span className="text-gray-400">TEXT</span></div>
              <div className="flex justify-between border-b pb-1"><span className="text-indigo-600">incorporation_date</span> <span className="text-gray-400">DATE</span></div>
              <div className="flex justify-between border-b pb-1"><span className="text-indigo-600">financial_year_end</span> <span className="text-gray-400">TEXT</span></div>
              <div className="flex justify-between border-b pb-1"><span className="text-indigo-600">owner_id</span> <span className="text-gray-400">UUID (FK)</span></div>
              <div className="flex justify-between border-b pb-1"><span className="text-indigo-600">created_at</span> <span className="text-gray-400">TIMESTAMPTZ</span></div>
            </div>
          </div>
        </section>

        {/* Section 3: Key Features */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Network className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Key Features</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">Entity Register</h4>
              <p className="text-sm text-gray-500">Comprehensive onboarding for SA legal entities with specific support for (Pty) Ltd, Inc, NPC, and CC structures.</p>
            </div>
            <div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">Group Visualization</h4>
              <p className="text-sm text-gray-500">Dynamic tree-view mapping of holding structures, identifying parent-child relationships and ownership percentages.</p>
            </div>
            <div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">Compliance Vault</h4>
              <p className="text-sm text-gray-500">Real-time deadline tracking for CIPC annual returns, tax filings, and internal governance milestones.</p>
            </div>
            <div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">Financial Overview</h4>
              <p className="text-sm text-gray-500">Consolidated transaction logging and intercompany transfer tracking across the entire group.</p>
            </div>
          </div>
        </section>

        {/* Section 4: Technical Implementation */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Code2 className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Technical Implementation</h2>
          </div>
          <div className="prose prose-indigo max-w-none text-gray-600">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Frontend:</strong> React 18 with Vite, utilizing Tailwind CSS for responsive, utility-first styling.</li>
              <li><strong>State Management:</strong> React Hooks (useState, useEffect) for local state and Supabase client for data persistence.</li>
              <li><strong>Security:</strong> Row Level Security (RLS) policies enforced on Supabase, scoped to the <code>owner_id</code> field.</li>
              <li><strong>Animations:</strong> Framer Motion used for smooth route transitions and interactive modal experiences.</li>
              <li><strong>Type Safety:</strong> Full TypeScript implementation ensuring data integrity between the database and UI.</li>
            </ul>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t text-center text-gray-400 text-xs uppercase tracking-widest">
          <p>© {new Date().getFullYear()} HoldCo OS • Internal Corporate Documentation</p>
        </footer>
      </div>
    </div>
  );
}
