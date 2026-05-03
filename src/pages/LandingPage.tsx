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
  FileWarning, 
  HelpCircle,
  Menu,
  X,
  PlusCircle,
  Link2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const stats = [
    { label: 'Companies Tracked', value: '840+' },
    { label: 'Deadlines Managed', value: '12k+' },
    { label: 'Audit Readiness', value: '100%' },
    { label: 'Investor Rating', value: '5-Star' },
  ];

  const features = [
    {
      title: 'Compliance Health Score',
      description: 'A live, single number showing how compliant your entire group is right now. Red means risk. Green means security.',
      icon: BarChart3,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      title: 'Today’s Actions',
      description: 'Wake up knowing exactly what needs focus across your entities. Prioritized by risk and deadline proximity.',
      icon: Zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      title: 'Evidence-Linked Vault',
      description: 'The "Vault" isn’t just storage—it’s an audit trail. Link CIPC receipts and tax clearances directly to obligations.',
      icon: FileText,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      title: 'Auto Roadmap',
      description: 'Built for South Africa. SARS, CIPC, and Labour obligations are generated automatically when you add an entity.',
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Group Reporting',
      description: 'Export audit-ready group reports in seconds. Perfect for investor due diligence or board presentations.',
      icon: Building2,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Data Isolation',
      description: 'Enterprise-grade Row Level Security ensures your company data is strictly private and mathematically isolated.',
      icon: ShieldCheck,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    }
  ];

  const problems = [
    { title: 'Missed Deadlines', detail: 'Penalties from CIPC and SARS add up fast when you lose track.' },
    { title: 'Information Chaos', detail: 'Documents scattered across Drive, WhatsApp, and private emails.' },
    { title: 'Audit Panic', detail: 'The scramble to find proof when investors or auditors ask for records.' },
    { title: 'Entity Blindness', detail: 'No clear view of the health of your multiple companies at once.' }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-700">
      {/* Sticky Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900 uppercase">HoldCo OS</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-10">
              <a href="#features" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Features</a>
              <a href="#how" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">How it Works</a>
              <a href="#pricing" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Pricing</a>
              <button 
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                Sign In
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 bg-white pt-24 px-6 md:hidden"
          >
            <div className="space-y-8 flex flex-col items-center text-center">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black uppercase tracking-tight">Features</a>
              <a href="#how" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black uppercase tracking-tight">How it Works</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-2xl font-black uppercase tracking-tight">Pricing</a>
              <button 
                onClick={() => { setIsMenuOpen(false); navigate('/login'); }}
                className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden bg-slate-50/50">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-8">
                Built for South African Business Groups
              </span>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-8">
                Manage all your entities. <br className="hidden lg:block" />
                <span className="text-indigo-600">Zero compliance chaos.</span>
              </h1>
              <p className="text-lg text-slate-500 font-medium leading-relaxed mb-12 max-w-xl mx-auto lg:mx-0">
                Stop juggling MOIs and SARS deadlines in spreadsheets. HoldCo OS is the centralized operating system for founders, holding companies, and finance teams.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-16">
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-500 transition-all active:scale-95 shadow-2xl shadow-indigo-200 flex items-center justify-center group"
                >
                  Get Early Access — Free
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <a href="#how" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center group">
                  See how it works
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
              <div className="flex flex-wrap justify-center lg:justify-start gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-slate-900" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Secure Infrastructure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-slate-900" />
                  <span className="text-[10px] font-black uppercase tracking-widest">SARB/CIPC Ready</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-5 w-5 text-slate-900" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Audit-Ready Logs</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-indigo-600/5 blur-[100px] rounded-full -z-10 animate-pulse" />
              <div className="bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(79,70,229,0.15)] border border-indigo-50 p-4 transform perspective-1000 rotate-y-[-5deg]">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200" 
                  alt="Dashboard Preview" 
                  className="rounded-[2rem] w-full h-auto object-cover border border-gray-100"
                />
                {/* Floating Elements for visual interest */}
                <div className="absolute -top-10 -right-10 bg-white p-6 rounded-3xl shadow-2xl border border-gray-50 max-w-[200px] animate-bounce-slow">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audit Status</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">Health Score: 98%</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center group">
                <p className="text-3xl font-black text-slate-900 tracking-tighter mb-1 transition-transform group-hover:scale-110">{stat.value}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-24">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 block">The Problem</span>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-8">Spreadsheets are killing <br className="hidden md:block" /> your entities.</h2>
            <p className="text-indigo-200 opacity-60 font-medium text-lg max-w-2xl mx-auto italic">“We didn’t know the CIPC filing was due until the bank threatened to freeze our accounts.”</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((p, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all group">
                <div className="bg-red-500/10 p-4 rounded-2xl w-fit mb-6 text-red-400 group-hover:rotate-6 transition-transform">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-3">{p.title}</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">{p.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[3rem] border border-gray-100 hover:border-indigo-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group"
              >
                <div className={cn("p-5 rounded-2xl w-fit mb-8 transition-transform group-hover:scale-110", f.bg, f.color)}>
                  <f.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-4">{f.title}</h3>
                <p className="text-slate-500 font-medium text-sm leading-7">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how" className="py-32 bg-indigo-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="mb-20">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-6 block">The Workflow</span>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-8">From setup to audit-ready in <br className="hidden md:block" /> three simple steps.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-16 relative">
            {/* Connection Lines (Desktop) */}
            <div className="hidden lg:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-indigo-500/50 -z-10" />
            
            {[
              { 
                step: '01', 
                title: 'Add Your Entities', 
                desc: 'Register every holding and operating company. We support Private, NPOs, Public, and Sole Props.',
                icon: Building2
              },
              { 
                step: '02', 
                title: 'Review Roadmap', 
                desc: 'Our engine generates a timeline of SARS, CIPC, and Labour obligations for each entity automatically.',
                icon: Search
              },
              { 
                step: '03', 
                title: 'Upload & Track', 
                desc: 'Complete actions, link evidence, and watch your ComplianceScore climb. You’re now audit-ready.',
                icon: ShieldCheck
              },
            ].map((s, i) => (
              <div key={i} className="text-center group">
                <div className="w-24 h-24 bg-white text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl group-hover:scale-110 transition-transform relative">
                  <s.icon className="h-10 w-10" />
                  <div className="absolute -top-3 -right-3 bg-indigo-900 text-white text-xs font-black p-3 rounded-xl shadow-lg">
                    {s.step}
                  </div>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4">{s.title}</h3>
                <p className="text-indigo-100/70 font-medium max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison: Benefits */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="bg-slate-50 rounded-[3.5rem] p-8 lg:p-20 overflow-hidden relative">
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100/50 blur-[100px] rounded-full translate-x-20 translate-y-20" />
              <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
                 <div>
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900 mb-8 leading-tight">Investor-grade records. <br className="hidden md:block"/> No extra hire.</h2>
                    <div className="space-y-6">
                       {[
                         'Avoid SARS administrative penalties (R250 - R16,000/mo)',
                         'Ensure Tax Clearance is always current',
                         'CIPC Annual Returns tracked & reminded',
                         'Multi-user access for founders & accountants',
                         'Private company data isolation by default'
                       ].map((item, i) => (
                         <div key={i} className="flex items-center space-x-4">
                            <div className="bg-emerald-100 p-1 rounded-full text-emerald-600">
                               <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <span className="text-slate-600 font-bold group hover:text-indigo-600 transition-colors cursor-default">{item}</span>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-white">
                    <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">The Real Payoff</p>
                    <p className="text-2xl font-black text-slate-900 italic leading-tight mb-8">“During our Series A, HoldCo OS saved us weeks of scramble. The data room was ready before the VCs even asked.”</p>
                    <div className="flex items-center space-x-4">
                       <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">JD</div>
                       <div>
                          <p className="text-sm font-black text-slate-900 uppercase">James de Villiers</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Multi-Entity Founder</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Pricing / Early Access Section */}
      <section id="pricing" className="py-32 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-none">Free while we <br className="hidden md:block" /> build the future.</h2>
            <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto mb-16">HoldCo OS is currently in early access. Join now and get <strong>full access to every feature</strong> for free. No credit card required.</p>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="max-w-2xl mx-auto bg-white border-2 border-indigo-600 p-12 rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(79,70,229,0.2)] relative overflow-hidden text-left"
            >
              <div className="absolute top-0 right-0 bg-indigo-600 text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-bl-3xl">
                Early Access Benefit
              </div>
              
              <div className="flex items-end mb-10">
                <span className="text-6xl font-black text-slate-900 tracking-tighter leading-none">R0</span>
                <span className="text-lg font-bold text-slate-400 ml-3 mb-1 uppercase tracking-widest">/ For now</span>
              </div>

              <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 mb-12">
                 {[
                   'Unlimited Companies',
                   'All Compliance Roadmap',
                   'Document Vault (Full)',
                   'Priority Support',
                   'Audit Reports Export',
                   'Activity Log History'
                 ].map((feat, i) => (
                   <div key={i} className="flex items-center space-x-3">
                      <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{feat}</span>
                   </div>
                 ))}
              </div>

              <button 
                onClick={() => navigate('/login')}
                className="w-full py-6 bg-slate-900 text-white font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Claim Your Seat
              </button>
              <p className="text-center mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Join 150+ SA founders today</p>
            </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Got Questions?</h2>
              <p className="text-slate-500 font-medium mt-2">Everything you need to know about South Africa’s first HoldCo OS.</p>
           </div>
           <div className="space-y-4">
              {[
                { q: "Is this built for South African law?", a: "Yes. Our compliance engine was built specifically for SA business types (Pty Ltd, NPO, CC) and tracks SARS, CIPC, Labour (UIF/SDL), and POPIA requirements." },
                { q: "How secure is my company data?", a: "We use enterpirse-grade Row Level Security (RLS) via Supabase. This means your data is cryptographically isolated from other users at the database level." },
                { q: "Does this replace my accountant?", a: "No. It makes them faster. HoldCo OS keeps you organized between accounting visits, so they spend less time searching for MOIs and more time on high-value advice." },
                { q: "What happens when early access ends?", a: "We will introduce fair, tiered pricing based on company volume. All early access users will receive a legacy discount and plenty of advance notice." }
              ].map((faq, i) => (
                <details key={i} className="bg-white border border-gray-100 rounded-3xl group overflow-hidden transition-all">
                   <summary className="p-8 cursor-pointer flex items-center justify-between font-bold text-slate-900 uppercase tracking-tight group-open:bg-indigo-50/50 transition-colors">
                      {faq.q}
                      <PlusCircle className="h-5 w-5 text-indigo-400 group-open:rotate-45 transition-transform" />
                   </summary>
                   <div className="px-8 pb-8 text-slate-500 leading-7 text-sm font-medium">
                      {faq.a}
                   </div>
                </details>
              ))}
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
              <div className="lg:col-span-1">
                 <div className="flex items-center space-x-3 mb-8">
                    <div className="bg-indigo-600 p-2 rounded-xl">
                      <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-black tracking-tight uppercase">HoldCo OS</span>
                 </div>
                 <p className="text-slate-500 text-sm font-medium leading-7 mb-8 pr-8">
                    The modern operating system for South African holding companies and multi-entity founders.
                 </p>
                 <div className="flex space-x-4">
                    {/* Social icons if needed, or simple status text */}
                    <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Cortex Engine Online</span>
                    </div>
                 </div>
              </div>

              <div>
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-8">Product</h4>
                 <ul className="space-y-4">
                    <li><a href="#features" className="text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Features</a></li>
                    <li><a href="#how" className="text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">How it Works</a></li>
                    <li><a href="#pricing" className="text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Pricing</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-8">Legal</h4>
                 <ul className="space-y-4">
                    <li><a href="#" className="text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Privacy Policy</a></li>
                    <li><a href="#" className="text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Terms of Service</a></li>
                    <li><a href="#" className="text-sm font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Security</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-8">Stay Updated</h4>
                 <p className="text-xs font-bold text-slate-500 leading-relaxed mb-6">Join our newsletter for SA compliance updates and new feature drops.</p>
                 <div className="flex flex-col gap-3">
                    <input 
                      type="email" 
                      placeholder="founder@entity.com" 
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-600 transition-colors"
                    />
                    <button className="w-full bg-indigo-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Subscribe</button>
                 </div>
              </div>
           </div>

           <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">© 2026 HoldCo OS — Developed in Cape Town, South Africa.</p>
              <div className="flex items-center space-x-6 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                 <span>Privacy</span>
                 <span>Cookies</span>
                 <span>Data Subject Request</span>
              </div>
           </div>
        </div>
      </footer>

      {/* Floating CTA for Mobile */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-6 right-6 z-50 md:hidden"
        >
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-indigo-500/20 active:scale-95 transition-transform"
          >
            Claim Free Access
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
