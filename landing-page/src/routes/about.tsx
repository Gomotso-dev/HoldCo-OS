import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/site/Reveal";
import { Compass, Heart, Shield, Sparkle } from "@phosphor-icons/react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — HoldCo OS" },
      { name: "description", content: "We're building the operating system for the next generation of South African businesses." },
      { property: "og:title", content: "About HoldCo OS" },
      { property: "og:description", content: "Founder story, mission and the future of African business infrastructure." },
    ],
  }),
  component: About,
});

const values = [
  { icon: Shield, title: "Trust by default", desc: "Security, privacy and audit-readiness are not features — they are foundations." },
  { icon: Compass, title: "Operator-first", desc: "We design for the people running real companies, not for theoretical workflows." },
  { icon: Sparkle, title: "Premium craft", desc: "Software for serious work should feel as considered as the work itself." },
  { icon: Heart, title: "Built in Africa", desc: "Designed for the realities of doing business in South Africa, and the continent at large." },
];

function About() {
  return (
    <div className="bg-gradient-hero">
      <section className="mx-auto max-w-5xl px-6 pt-24 pb-16 text-center">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">About HoldCo OS</p>
          <h1 className="mt-4 text-5xl md:text-7xl font-light tracking-tighter text-gradient">
            Building the infrastructure for the next era of African business.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            HoldCo OS was born from a simple observation: South African founders spend too much time managing administration and too little time building.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <Reveal>
          <h2 className="text-xs uppercase tracking-[0.2em] text-gold">Founder story</h2>
          <div className="mt-4 space-y-5 text-muted-foreground leading-relaxed">
            <p className="text-foreground text-xl tracking-tight">
              We were running a small holding company. Three entities became seven. Seven became fourteen. The spreadsheets multiplied. The deadlines slipped.
            </p>
            <p>
              We searched for software built for the way we actually operated — across CIPC filings, SARS deadlines, multiple boards, multiple accountants, multiple jurisdictions of attention. Nothing fit. So we built it.
            </p>
            <p>
              HoldCo OS is the tool we wished existed: a single, beautifully engineered operating system for everyone who carries the operational weight of a South African business.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <Reveal>
          <h2 className="text-4xl md:text-5xl tracking-tighter text-gradient max-w-2xl">What we believe.</h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.05}>
              <div className="glass rounded-2xl p-6 h-full">
                <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center text-primary">
                  <v.icon size={20} weight="duotone" />
                </div>
                <h3 className="mt-5 text-lg">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <Reveal>
          <h2 className="text-4xl md:text-6xl tracking-tighter font-light text-gradient">
            The future of business infrastructure in Africa is being written now.
          </h2>
          <p className="mt-6 text-muted-foreground max-w-2xl mx-auto">
            We're hiring operators, engineers and designers who want to build it with us.
          </p>
          <Link to="/contact" className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground btn-glow">
            Get in touch
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
