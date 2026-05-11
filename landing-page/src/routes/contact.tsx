import { createFileRoute } from "@tanstack/react-router";
import { Reveal } from "@/components/site/Reveal";
import { EnvelopeSimple, MapPin, Phone, CalendarCheck } from "@phosphor-icons/react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — HoldCo OS" },
      { name: "description", content: "Talk to our team. Book a demo, get support, or partner with HoldCo OS." },
      { property: "og:title", content: "Contact HoldCo OS" },
      { property: "og:description", content: "Demo bookings, partnerships and support." },
    ],
  }),
  component: Contact,
});

const faqs = [
  ["How fast can we onboard?", "Most teams are operational within an afternoon."],
  ["Do you offer migration?", "Yes — our team migrates entities and historical filings for you."],
  ["Can I trial first?", "Every plan includes a 14-day trial with full functionality."],
];

function Contact() {
  return (
    <div className="bg-gradient-hero">
      <section className="mx-auto max-w-7xl px-6 pt-24 pb-20">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Get in touch</p>
          <h1 className="mt-3 text-5xl md:text-7xl font-light tracking-tighter text-gradient max-w-3xl">
            Let's talk operations.
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            Book a personalised walkthrough or reach out — we typically reply within one business day.
          </p>
        </Reveal>

        <div className="mt-16 grid lg:grid-cols-3 gap-8">
          <Reveal className="lg:col-span-2">
            <form className="glass-strong rounded-3xl p-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Full name" placeholder="Lerato Modise" />
                <Field label="Work email" placeholder="lerato@company.co.za" type="email" />
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Company" placeholder="Veld Capital" />
                <Field label="Number of entities" placeholder="1 – 5" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Message</label>
                <textarea
                  rows={5}
                  placeholder="Tell us about your operation…"
                  className="mt-2 w-full rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-primary/60 focus:bg-white/[0.05] transition"
                />
              </div>
              <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground btn-glow">
                <CalendarCheck size={16} /> Book a demo
              </button>
            </form>
          </Reveal>

          <Reveal delay={0.1}>
            <aside className="space-y-4">
              <InfoCard icon={<EnvelopeSimple size={18}/>} title="Email" lines={["hello@holdcoos.co.za", "support@holdcoos.co.za"]} />
              <InfoCard icon={<MapPin size={18}/>} title="Office" lines={["Sandton, Johannesburg", "Cape Town · Remote-first"]} />
              <InfoCard icon={<Phone size={18}/>} title="Sales" lines={["+27 (0) 10 035 0000"]} />

              <div className="glass rounded-2xl p-5">
                <div className="text-sm font-medium">FAQ</div>
                <ul className="mt-3 space-y-3">
                  {faqs.map(([q, a]) => (
                    <li key={q}>
                      <div className="text-sm">{q}</div>
                      <div className="text-xs text-muted-foreground mt-1">{a}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</label>
      <input
        {...props}
        className="mt-2 w-full rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-primary/60 focus:bg-white/[0.05] transition"
      />
    </div>
  );
}

function InfoCard({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <div className="mt-2 text-sm text-muted-foreground space-y-1">
        {lines.map((l) => <div key={l}>{l}</div>)}
      </div>
    </div>
  );
}
