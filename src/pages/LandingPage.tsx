import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Clock, 
  FileText, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  AlertCircle, 
  Lock, 
  BarChart3, 
  Search, 
  Menu,
  X,
  PlusCircle,
  ChevronRight,
  Database,
  Cloud
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const features = [
    {
      title: 'Compliance Health Score',
      description: 'A live, single number showing how compliant your entire group is right now. Red means urgent. Green means covered.',
      icon: BarChart3,
      bg: 'bg-amber-100',
      stroke: '#d97706'
    },
    {
      title: "Today's Actions",
      description: 'Wake up knowing exactly what needs to be done across all companies — prioritised by urgency and deadline proximity.',
      icon: Zap,
      bg: 'bg-green-100',
      stroke: '#16a34a'
    },
    {
      title: 'Document Vault',
      description: 'Every MOI, tax clearance, and CIPC filing — stored securely, categorised, and findable in seconds.',
      icon: FileText,
      bg: 'bg-indigo-100',
      stroke: '#4338ca'
    },
    {
      title: 'Evidence Linking',
      description: 'Attach proof directly to every compliance item. SARS receipts linked to VAT. CIPC linked to Annual Returns.',
      icon: LinkIcon,
      bg: 'bg-rose-100',
      stroke: '#be185d'
    },
    {
      title: 'Compliance Calendar',
      description: 'SARS, CIPC, Labour, and POPIA deadlines across all entities on one calendar. See what\'s due at a glance.',
      icon: Clock,
      bg: 'bg-sky-100',
      stroke: '#0369a1'
    },
    {
      title: 'Export Reports',
      description: 'Generate a professional, audit-ready group compliance report in seconds. Perfect for investor meetings.',
      icon: DownloadIcon,
      bg: 'bg-emerald-100',
      stroke: '#15803d'
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-700">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 font-display uppercase">HoldCo OS</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">How it works</a>
              <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Pricing</a>
              <a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">FAQ</a>
              <button 
                onClick={() => navigate('/login')}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                Get Early Access
              </button>
            </div>

            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-50 bg-white pt-20 px-4 md:hidden"
          >
            <div className="flex flex-col space-y-4">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold py-2">Features</a>
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold py-2">How it works</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold py-2">Pricing</a>
              <button 
                onClick={() => { setIsMenuOpen(false); navigate('/login'); }}
                className="bg-indigo-600 text-white py-4 rounded-xl font-bold font-display uppercase tracking-widest"
              >
                Get Early Access
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-indigo-50 to-white">
        <div className="absolute top-[-80px] right-[-160px] w-[560px] h-[560px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-4 py-1.5 rounded-full mb-8"
            >
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Now in Early Access — 100% Free</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.05] mb-8 font-display"
            >
              Stop Managing Companies <br />
              <span className="text-indigo-600">With Spreadsheets.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              HoldCo OS is the centralized compliance platform for South African founders running multiple companies. Track CIPC, SARS & Labour deadlines — before they cost you.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 shadow-xl shadow-indigo-200 uppercase tracking-widest text-sm"
              >
                <Zap className="h-5 w-5 fill-current" />
                <span>Get Early Access — Free</span>
              </button>
              <a 
                href="#how-it-works"
                className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all uppercase tracking-widest text-sm"
              >
                See how it works →
              </a>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative px-4 max-w-5xl mx-auto overflow-hidden rounded-2xl shadow-[0_50px_100px_-20px_rgba(79,70,229,0.15)] border border-slate-200"
          >
            <div className="bg-slate-900 rounded-t-2xl p-3 flex items-center space-x-2">
              <div className="flex space-x-1.5 leading-none">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="flex-1 text-center pr-6">
                <div className="inline-block bg-slate-800 rounded-md px-16 py-1 text-[10px] text-slate-400 font-mono">holdcoos.app/dashboard</div>
              </div>
            </div>
            <div className="bg-white rounded-b-2xl overflow-hidden aspect-video">
               <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-24 w-24 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest">Platform Dashboard Preview</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Proof Strip */}
      <div className="bg-slate-50 border-y border-slate-100 py-6 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center uppercase tracking-[0.2em] text-[10px] font-black text-slate-400">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="flex items-center space-x-2">
              <span className="text-slate-900 font-bold">8+</span>
              <span>companies in one view</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />
            <div className="flex items-center space-x-2">
              <span>Tracks</span>
              <span className="text-slate-900 font-bold">CIPC • SARS • Labour • POPIA</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />
            <div className="flex items-center space-x-2">
              <span>Built for</span>
              <span className="text-slate-900 font-bold">South Africa</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />
            <div className="flex items-center space-x-2">
              <span className="text-slate-900 font-bold">Free</span>
              <span>during early access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <section className="py-24 bg-slate-900 text-white relative">
         <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-20 text-center mx-auto">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 block">The Real Problem</span>
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight font-display tracking-tight">
              You're running companies on WhatsApp groups and spreadsheets.
            </h2>
            <p className="text-lg text-slate-400 font-medium leading-relaxed">
              Every missed CIPC annual return or SARS deadline costs you money, credibility, and peace of mind. It's not sustainable — and it's preventable.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <ProblemCard 
              icon={Clock} 
              title="Missed Deadlines" 
              desc="CIPC annual returns, SARS VAT submissions, provisional tax — each one missed triggers penalties and possible deregistration."
            />
            <ProblemCard 
              icon={FileText} 
              title="Scattered Documents" 
              desc="MOIs in email. Tax clearances in WhatsApp. Share certificates nobody can find. When auditors ask, the scramble begins."
            />
            <ProblemCard 
              icon={Building2} 
              title="No Group-Level View" 
              desc="You run 3, 5, or 8 companies but have no single dashboard showing what's overdue or how healthy your overall group is."
            />
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="features" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 mb-6 block font-display">Contrast the Chaos</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-display">What changes with HoldCo OS</h2>
            <p className="text-slate-500 mt-4 text-lg font-medium">Stop reacting to compliance crises. Start managing your group proactively.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 lg:p-12 transition-transform hover:-rotate-1">
              <h3 className="text-xl font-black text-slate-700 mb-10 flex items-center font-display uppercase tracking-tight">
                <span className="text-rose-500 mr-3 text-2xl">❌</span> Without HoldCo OS
              </h3>
              <ul className="space-y-6">
                <ComparisonItem bad text="Deadlines in shared spreadsheets" />
                <div className="h-px bg-slate-200" />
                <ComparisonItem bad text="Documents scattered across email and Drive" />
                <div className="h-px bg-slate-200" />
                <ComparisonItem bad text="No visibility across all entities simultaneously" />
                <div className="h-px bg-slate-200" />
                <ComparisonItem bad text="Panic when investors request due diligence" />
                <div className="h-px bg-slate-200" />
                <ComparisonItem bad text="Surprised by SARS penalties you didn't see coming" />
              </ul>
            </div>

            <div className="bg-indigo-600 text-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl shadow-indigo-200 transition-transform hover:rotate-1">
              <h3 className="text-xl font-black mb-10 flex items-center font-display uppercase tracking-tight">
                <span className="mr-3 text-2xl text-emerald-400">✓</span> With HoldCo OS
              </h3>
              <ul className="space-y-6">
                <ComparisonItem text="All deadlines tracked automatically for all entities" />
                <div className="h-px bg-indigo-500" />
                <ComparisonItem text="Secure document vault — searchable in seconds" />
                <div className="h-px bg-indigo-500" />
                <ComparisonItem text="Today's Actions dashboard shows exactly what to do" />
                <div className="h-px bg-indigo-500" />
                <ComparisonItem text="Investor-ready: export a full report instantly" />
                <div className="h-px bg-indigo-500" />
                <ComparisonItem text="Compliance Health Score shows group risk at a glance" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 text-balance">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 mb-6 block font-display">Everything Built-In</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-display">Deep compliance, simplified</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 hover:shadow-2xl hover:border-indigo-100 transition-all group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-8 ${feature.bg} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <feature.icon className="h-6 w-6" style={{ stroke: feature.stroke }} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4 font-display uppercase tracking-tight leading-tight">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-white relative">
         <div className="absolute inset-0 bg-indigo-50/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-24 max-w-xl mx-auto">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 mb-6 block font-display">The Operating System</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-display">Up and running in minutes</h2>
            <p className="text-slate-500 mt-6 font-medium text-lg">No accountant training needed. Add your companies and the system handles the rest.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-[48px] left-[25%] right-[25%] h-0.5 bg-indigo-100 -z-10" />
            <Step num={1} title="Add Companies" desc="Register every entity in your group. Enter basic details — your compliance framework is created automatically." />
            <Step num={2} title="Auto-Roadmap" desc="Obligations are generated based on your entity types. SARS, CIPC, Labour — all tracked without manual setup." icon={Search} />
            <Step num={3} title="Audit Ready" desc="Upload proof, mark actions complete, and generate reports. You're now ready for investors or auditors anytime." icon={ShieldCheck} />
          </div>
        </div>
      </section>

      {/* Security Strip */}
      <div className="bg-slate-900 py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12 text-white">
                <div className="flex items-start space-x-4">
                    <Lock className="h-6 w-6 text-indigo-400 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold uppercase tracking-widest text-sm mb-2">Row Level Security</h4>
                        <p className="text-xs text-slate-400 font-medium">Complete data isolation at the database level. Only you can access your entities.</p>
                    </div>
                </div>
                <div className="flex items-start space-x-4">
                    <Database className="h-6 w-6 text-indigo-400 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold uppercase tracking-widest text-sm mb-2">Supabase Infrastructure</h4>
                        <p className="text-xs text-slate-400 font-medium">Built on top of enterprise-grade cloud services used by thousands of global apps.</p>
                    </div>
                </div>
                <div className="flex items-start space-x-4">
                    <Cloud className="h-6 w-6 text-indigo-400 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold uppercase tracking-widest text-sm mb-2">Automated Backups</h4>
                        <p className="text-xs text-slate-400 font-medium">Your documents and logs are secured with real-time replication and nightly backups.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-indigo-50 overflow-hidden relative">
         <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-200/50 blur-[100px] rounded-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto bg-white border-2 border-indigo-600 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-700 px-6 py-2.5 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest border-l border-b border-indigo-200">Early Access Offer</div>
            
            <h2 className="text-5xl font-black text-slate-900 mb-4 font-display uppercase tracking-tight">R0</h2>
            <p className="text-slate-500 font-bold mb-10 text-lg uppercase tracking-tight italic">Completely Free while in early access</p>
            
            <div className="space-y-4 mb-10 text-left bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <CheckItem text="Unlimited Companies" />
              <CheckItem text="Full Compliance Roadmap" />
              <CheckItem text="Document Vault Access" />
              <CheckItem text="Audit Report Generation" />
            </div>

            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
            >
              Get Early Access Now
            </button>
            <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">No credit card required • No commitment • Cancel anytime<br />Early users notified 30 days before pricing launches</p>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 font-display uppercase tracking-tight leading-none mb-4">FAQ</h2>
            <p className="text-slate-500 font-bold">Frequently Asked Questions</p>
          </div>
          <div className="space-y-4">
            <FaqItem 
              q="Who exactly is HoldCo OS for?" 
              a="HoldCo OS is built for South African founders, directors, and CFOs who manage multiple legal entities. If you own or oversee more than one company and find manual tracking stressful, this is for you."
            />
            <FaqItem 
              q="Does this replace my accountant?" 
              a="No — HoldCo OS complements your accountant's work. By having your documents organized and your roadmap clear, you make their job faster and reduce the billable hours they spend hunting for information."
            />
            <FaqItem 
              q="Is my data truly private?" 
              a="Yes. Every company record in HoldCo OS is protected by Row Level Security (RLS). This means your data is cryptographically isolated from other users. Not even our team can access your documents without your permission."
            />
            <FaqItem 
              q="What if I have an unusual entity type?" 
              a="We currently support private companies (Pty Ltd), NPOs, CCs, and individual trusts. If you have a specific structure not covered, our team can help you build custom obligations."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-white/5 pt-24 pb-12 text-white overflow-hidden relative">
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-8">
                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <span className="text-xl font-black tracking-tight uppercase font-display">HoldCo OS</span>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed max-w-sm mb-10">
                South Africa's first compliance operating system forfounders running multiple companies. Track CIPC, SARS, Labour, and POPIA in one view.
              </p>
              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Encrypted Storage</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-10">Product</h4>
              <ul className="space-y-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
                <li><a href="#features" className="hover:text-white transition-colors">Core Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Hub</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-10">Accountability</h4>
              <ul className="space-y-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
                <li><a href="#faq" className="hover:text-white transition-colors">Support FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Platform Security</a></li>
                <li><a href="/login" className="hover:text-white transition-colors">Partner Access</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-10">Stay Informed</h4>
              <p className="text-xs font-bold text-slate-500 mb-8 uppercase tracking-widest leading-relaxed">Join 150+ founders for monthly SA compliance updates.</p>
              <div className="flex flex-col gap-4">
                 <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs font-bold focus:outline-none focus:border-indigo-600 transition-colors uppercase tracking-widest"
                 />
                 <button className="bg-indigo-600 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-700 transition-all">Submit</button>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">© 2026 HoldCo OS. Built in Cape Town, South Africa.</p>
            <div className="flex items-center space-x-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] cursor-default">
              <span className="hover:text-indigo-400 transition-colors">Privacy Policy</span>
              <span className="hover:text-indigo-400 transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProblemCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/[0.08] transition-all group border-b-4 border-b-transparent hover:border-b-indigo-500/50">
      <div className="bg-rose-500/10 p-5 rounded-2xl w-fit mb-8 text-rose-500 group-hover:rotate-12 transition-transform shadow-inner">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tighter font-display leading-none">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed font-medium antialiased">{desc}</p>
    </div>
  );
}

function ComparisonItem({ text, bad = false }: { text: string, bad?: boolean }) {
  return (
    <li className="flex items-start space-x-5">
      <div className={cn("mt-1.5 flex-shrink-0", bad ? "text-slate-400" : "text-emerald-400")}>
        <CheckCircle2 className="h-4 w-4" />
      </div>
      <span className={cn("text-sm font-bold tracking-widest uppercase leading-tight", bad ? "text-slate-500" : "text-white")}>
        {text}
      </span>
    </li>
  );
}

function Step({ num, title, desc, icon: Icon = Building2 }: { num: number, title: string, desc: string, icon?: any }) {
  return (
    <div className="text-center relative group p-4 border border-transparent rounded-[2rem] hover:bg-slate-50 hover:border-slate-100 transition-all duration-500">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-lg group-hover:shadow-xl transition-all relative border border-indigo-100">
        <Icon className="h-8 w-8" />
        <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-[10px] font-black p-3 rounded-2xl shadow-xl">{num}</div>
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight font-display">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed max-w-[240px] mx-auto text-sm">{desc}</p>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center space-x-4 group cursor-default">
      <div className="bg-indigo-100 p-1.5 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        <CheckCircle2 className="h-4 w-4" />
      </div>
      <span className="text-xs font-bold text-slate-700 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{text}</span>
    </div>
  );
}

function FaqItem({ q, a }: { q: string, a: string }) {
  return (
    <details className="group bg-white border border-slate-100 rounded-3xl overflow-hidden transition-all duration-300 open:shadow-xl open:border-indigo-100">
      <summary className="p-8 cursor-pointer flex items-center justify-between font-black text-slate-900 uppercase tracking-tight group-open:bg-indigo-50/30 transition-colors font-display">
        {q}
        <div className="bg-slate-50 p-2 rounded-xl text-indigo-600 group-open:rotate-45 transition-transform">
          <PlusCircle className="h-5 w-5" />
        </div>
      </summary>
      <div className="px-8 pb-8 text-slate-50 font-medium leading-relaxed text-sm antialiased">
        {a}
      </div>
    </details>
  );
}

function LinkIcon(props: any) {
  return (
    <svg 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function DownloadIcon(props: any) {
  return (
    <svg 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
