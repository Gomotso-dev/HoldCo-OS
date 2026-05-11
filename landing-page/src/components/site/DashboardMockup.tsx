import { motion } from "framer-motion";
import { TrendUp, ShieldCheck, FileText, Bell, Buildings, ChartLineUp } from "@phosphor-icons/react";

export function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="absolute -inset-8 bg-gradient-primary opacity-30 blur-3xl rounded-full" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative glass-strong rounded-3xl p-4 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)]"
      >
        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <div className="ml-4 text-xs text-muted-foreground">app.holdco.os / overview</div>
        </div>

        <div className="grid grid-cols-12 gap-4 p-2">
          {/* Sidebar */}
          <div className="col-span-3 hidden md:block glass rounded-2xl p-4 space-y-1 text-sm">
            {["Overview","Companies","Compliance","Documents","Team","Reports"].map((s, i) => (
              <div key={s} className={`px-3 py-2 rounded-lg ${i===0?"bg-primary/15 text-foreground":"text-muted-foreground"}`}>{s}</div>
            ))}
          </div>

          {/* Main */}
          <div className="col-span-12 md:col-span-9 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat icon={<ShieldCheck size={18} />} label="Compliance" value="98%" trend="+2.4" />
              <Stat icon={<Buildings size={18} />} label="Entities" value="14" trend="+1" />
              <Stat icon={<Bell size={18} />} label="Due in 30d" value="6" trend="-3" />
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium">Compliance health</div>
                <div className="text-xs text-muted-foreground">Last 90 days</div>
              </div>
              <Sparkline />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-3"><FileText size={16}/> Upcoming deadlines</div>
                <ul className="space-y-2 text-sm">
                  {[
                    ["CIPC Annual Return — Sandton Holdings", "12 Jun"],
                    ["SARS VAT201 — Cape Tech (Pty) Ltd", "25 Jun"],
                    ["EMP201 Filing — Veld Capital", "07 Jul"],
                  ].map(([t,d])=>(
                    <li key={t} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t}</span>
                      <span className="text-xs px-2 py-1 rounded-md bg-white/5">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-3"><ChartLineUp size={16}/> Activity</div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Thandi filed VAT201 for Cape Tech</li>
                  <li>3 documents added to Vault</li>
                  <li>CIPC return marked submitted</li>
                  <li>New entity onboarded: Veld Capital</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <div className="flex items-center gap-2">{icon}<span>{label}</span></div>
        <span className="flex items-center gap-1 text-gold"><TrendUp size={12}/>{trend}</span>
      </div>
      <div className="mt-2 text-2xl tracking-tight">{value}</div>
    </div>
  );
}

function Sparkline() {
  const points = "0,40 30,35 60,38 90,28 120,30 150,22 180,25 210,15 240,18 270,10 300,14";
  return (
    <svg viewBox="0 0 300 60" className="w-full h-24">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.62 0.19 258)" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="oklch(0.62 0.19 258)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline fill="none" stroke="oklch(0.72 0.16 258)" strokeWidth="1.5" points={points} />
      <polygon fill="url(#g)" points={`${points} 300,60 0,60`} />
    </svg>
  );
}
