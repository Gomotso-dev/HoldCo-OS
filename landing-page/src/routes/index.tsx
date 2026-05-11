import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight, ShieldCheck, Bell, FileText, Buildings, ChartBar, Users, Heartbeat, Lightning,
  CheckCircle, Quotes,
} from "@phosphor-icons/react";
import { DashboardMockup } from "@/components/site/DashboardMockup";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HoldCo OS — Run every company from one operating system" },
      { name: "description", content: "Centralize CIPC compliance, SARS deadlines, documents and operations across every entity in one intelligent dashboard built for South African businesses." },
    ],
  }),
  component: Home,
});

const features = [
  { icon: FileText, title: "CIPC Annual Returns", desc: "Track filings, deadlines and statuses across every entity in your group." },
  { icon: ShieldCheck, title: "SARS Deadline Monitoring", desc: "Never miss VAT201, EMP201 or provisional tax with intelligent reminders." },
  { icon: Buildings, title: "Multi-Company Dashboard", desc: "One view of every company you operate, invest in or administer." },
  { icon: FileText, title: "Centralized Document Vault", desc: "Audit-ready storage for MOIs, share registers, contracts and resolutions." },
  { icon: Heartbeat, title: "Compliance Health Score", desc: "Quantify regulatory health for every entity, in real time." },
  { icon: Bell, title: "Smart Reminders", desc: "Email, in-app and team alerts that escalate before deadlines slip." },
  { icon: Users, title: "Team Accountability", desc: "Assign owners, track ownership and prove who did what, when." },
  { icon: ChartBar, title: "Insights & Reporting", desc: "Board-ready reports across compliance, operations and entity health." },
];

const press = ["Forbes Africa", "TechCrunch", "Ventureburn", "BusinessTech", "TechCentral", "ITWeb", "Daily Maverick", "Moneyweb"];

const steps = [
  { n: "01", title: "Add your companies", desc: "Onboard entities in seconds. We pull structure, directors and filings automatically." },
  { n: "02", title: "Activate compliance tracking", desc: "CIPC and SARS obligations sync to a unified calendar with smart reminders." },
  { n: "03", title: "Operate from one dashboard", desc: "Documents, deadlines, team and reports — every company, one source of truth." },
];

const testimonials = [
  { name: "Lerato M.", role: "Founder, Veld Capital", quote: "We replaced four spreadsheets and an inbox folder. HoldCo OS is the spine of our group." },
  { name: "Sipho N.", role: "CA(SA), Sentinel Advisory", quote: "Onboarded 32 client entities in a weekend. Deadlines never slip — my team finally sleeps." },
  { name: "Anika P.", role: "COO, Cape Tech Holdings", quote: "It feels like Linear for compliance. Premium, fast, quietly powerful." },
  { name: "Tebogo K.", role: "Operations Lead", quote: "The compliance health score made our board meetings ten minutes shorter." },
];

const faqs = [
  ["Does HoldCo OS integrate with CIPC?", "Yes. We sync entity data, directors and annual return statuses with the CIPC registry."],
  ["Can I manage multiple companies?", "From two to two hundred. HoldCo OS is built for founders, holding companies and accountants."],
  ["Is my company data secure?", "Bank-grade encryption at rest and in transit, granular permissions and full audit logs."],
  ["Can accountants access the platform?", "Invite your accountant or external advisors with scoped, read-only or collaborative access."],
  ["How do reminders work?", "Multi-channel — email, in-app and team escalations — tuned to each obligation's risk profile."],
  ["Is HoldCo OS built for South Africa?", "Designed in South Africa, for the realities of CIPC, SARS, B-BBEE and POPIA."],
];

function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Built for South African businesses
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-5xl md:text-7xl font-light tracking-tighter text-gradient max-w-4xl mx-auto"
          >
            Run every company from one operating system.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground"
          >
            HoldCo OS centralizes compliance, company administration, SARS obligations, documents and operational visibility into one intelligent platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/contact" className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground btn-glow transition shadow-[0_10px_40px_-10px_rgba(26,115,232,0.6)]">
              Start Managing Smarter <ArrowRight className="transition group-hover:translate-x-0.5" size={16}/>
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass hover:bg-white/5 transition">
              Book a Demo
            </Link>
          </motion.div>

          <div className="mt-20">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* Press / Trust */}
      <section className="py-16 border-y border-white/5 bg-background/40">
        <Reveal>
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">Trusted by modern South African businesses</p>
        </Reveal>
        <div className="mt-8 overflow-hidden">
          <div className="marquee flex gap-16 whitespace-nowrap">
            {[...press, ...press].map((p, i) => (
              <span key={i} className="text-2xl tracking-tight text-muted-foreground/70 font-light">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Platform</p>
              <h2 className="mt-3 text-4xl md:text-5xl tracking-tighter text-gradient">Everything your operation needs. Nothing it doesn't.</h2>
              <p className="mt-4 text-muted-foreground">A purpose-built operating system for the realities of running real businesses in South Africa.</p>
            </div>
          </Reveal>
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.04}>
                <div className="group h-full glass rounded-2xl p-6 transition hover:bg-white/[0.06] hover:-translate-y-0.5">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center text-primary group-hover:bg-primary/25 transition">
                    <f.icon size={20} weight="duotone" />
                  </div>
                  <h3 className="mt-5 text-lg">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-28 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">How it works</p>
              <h2 className="mt-3 text-4xl md:text-5xl tracking-tighter text-gradient">From spreadsheet chaos to operating system in three steps.</h2>
            </div>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div className="glass rounded-2xl p-8 h-full">
                  <div className="text-gold text-sm tracking-widest">{s.n}</div>
                  <h3 className="mt-3 text-2xl tracking-tight">{s.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{s.desc}</p>
                  <div className="mt-6 h-32 rounded-xl bg-gradient-to-br from-primary/20 to-transparent border border-white/5 grid place-items-center text-primary/80">
                    <Lightning size={28} weight="duotone" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-28 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Our mission</p>
            <h2 className="mt-4 text-4xl md:text-6xl tracking-tighter font-light text-gradient">
              South African businesses should spend less time buried in paperwork — and more time building the future.
            </h2>
            <p className="mt-6 text-muted-foreground max-w-2xl mx-auto">
              HoldCo OS exists to simplify business administration, empower founders, and modernize the infrastructure that South African companies run on.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Product showcase */}
      <section className="py-28 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">The dashboard</p>
              <h2 className="mt-3 text-4xl md:text-5xl tracking-tighter text-gradient">A command center for serious operators.</h2>
            </div>
          </Reveal>
          <div className="mt-14"><DashboardMockup /></div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28 border-t border-white/5 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <h2 className="text-4xl md:text-5xl tracking-tighter text-gradient max-w-2xl">Built for the people running real operations.</h2>
          </Reveal>
        </div>
        <div className="mt-12 overflow-hidden">
          <div className="marquee flex gap-6 whitespace-normal">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="w-[380px] shrink-0 glass rounded-2xl p-6">
                <Quotes className="text-primary" size={22} weight="fill" />
                <p className="mt-3 text-sm text-foreground/90 leading-relaxed">{t.quote}</p>
                <div className="mt-5 text-xs text-muted-foreground">
                  <div className="text-foreground">{t.name}</div>
                  {t.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-28 border-t border-white/5">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <h2 className="text-4xl md:text-5xl tracking-tighter text-gradient text-center">Frequently asked.</h2>
          </Reveal>
          <div className="mt-12 divide-y divide-white/5 glass rounded-2xl">
            {faqs.map(([q, a]) => (
              <details key={q} className="group p-6">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-6">
                  <span className="text-base">{q}</span>
                  <span className="text-muted-foreground group-open:rotate-45 transition">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl glass-strong p-12 text-center">
            <div className="absolute inset-0 bg-gradient-primary opacity-20" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl tracking-tighter text-gradient">Operate at the standard your business deserves.</h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Join the founders, accountants and holding companies modernizing South African business infrastructure.</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link to="/contact" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground btn-glow">
                  Start Managing Smarter <ArrowRight size={16}/>
                </Link>
                <Link to="/pricing" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass hover:bg-white/5">See pricing</Link>
              </div>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><CheckCircle size={14} className="text-gold"/> POPIA compliant</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle size={14} className="text-gold"/> Bank-grade security</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle size={14} className="text-gold"/> Built in SA</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
