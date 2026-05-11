import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/site/Reveal";
import { Check, Sparkle } from "@phosphor-icons/react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — HoldCo OS" },
      { name: "description", content: "Simple, transparent pricing. Built for founders, holding companies, accountants and enterprises." },
      { property: "og:title", content: "HoldCo OS Pricing" },
      { property: "og:description", content: "Starter, Growth and Enterprise plans for South African operators." },
    ],
  }),
  component: Pricing,
});

const plans = [
  {
    name: "Starter",
    price: "R 490",
    cadence: "/month",
    desc: "For founders running one to three companies.",
    features: ["Up to 3 entities", "CIPC + SARS deadline tracking", "Document vault", "Email reminders", "1 team seat"],
    cta: "Start free trial",
  },
  {
    name: "Growth",
    price: "R 1 490",
    cadence: "/month",
    desc: "For holding companies and growing operations.",
    features: ["Up to 15 entities", "Compliance health score", "Team accountability", "Priority reminders", "Up to 10 team seats", "Accountant access"],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    desc: "For accounting firms, groups and complex structures.",
    features: ["Unlimited entities", "SSO + advanced security", "Custom workflows", "Dedicated success manager", "API & integrations", "Onboarding & migration"],
    cta: "Talk to sales",
  },
];

function Pricing() {
  return (
    <div className="bg-gradient-hero">
      <section className="mx-auto max-w-7xl px-6 pt-24 pb-12 text-center">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Pricing</p>
          <h1 className="mt-4 text-5xl md:text-7xl font-light tracking-tighter text-gradient">Pricing built for serious operators.</h1>
          <p className="mt-5 text-muted-foreground max-w-xl mx-auto">Transparent plans that scale with the number of entities you operate. Cancel any time.</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.06}>
              <div className={`relative rounded-3xl p-8 h-full ${p.featured ? "glass-strong border-primary/40 shadow-[0_30px_80px_-20px_rgba(26,115,232,0.5)]" : "glass"}`}>
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-gradient-primary text-primary-foreground">
                    <Sparkle size={12} weight="fill" /> Recommended
                  </div>
                )}
                <h3 className="text-lg">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl tracking-tighter">{p.price}</span>
                  <span className="text-muted-foreground text-sm">{p.cadence}</span>
                </div>
                <Link
                  to="/contact"
                  className={`mt-6 inline-flex w-full items-center justify-center px-4 py-3 rounded-xl text-sm transition ${
                    p.featured
                      ? "bg-gradient-primary text-primary-foreground btn-glow"
                      : "glass hover:bg-white/5"
                  }`}
                >
                  {p.cta}
                </Link>
                <ul className="mt-8 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check size={16} className="mt-0.5 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-16 glass rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl tracking-tight">Accountants & advisory firms</h3>
              <p className="mt-2 text-muted-foreground max-w-xl">Manage all of your client entities in one workspace with white-glove onboarding and partner pricing.</p>
            </div>
            <Link to="/contact" className="px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground btn-glow">Become a partner</Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
