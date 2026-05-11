import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/site/Reveal";
import { ArrowUpRight } from "@phosphor-icons/react";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — HoldCo OS" },
      { name: "description", content: "Essays on compliance, operations and the future of African business infrastructure." },
      { property: "og:title", content: "HoldCo OS — Field Notes" },
      { property: "og:description", content: "Writing on compliance, operations and African business infrastructure." },
    ],
  }),
  component: Blog,
});

const posts = [
  {
    tag: "Compliance",
    title: "How South African businesses miss compliance deadlines",
    excerpt: "Most penalties don't come from negligence — they come from invisibility. Here's how to fix that.",
    date: "May 02, 2026",
    read: "6 min read",
  },
  {
    tag: "Operations",
    title: "Why founders need operational visibility",
    excerpt: "If you can't see your operation, you can't lead it. A practical framework for founder dashboards.",
    date: "Apr 18, 2026",
    read: "8 min read",
  },
  {
    tag: "CIPC",
    title: "Understanding CIPC annual returns",
    excerpt: "A clear, modern guide to filing — what's required, when it's due, and how to never miss again.",
    date: "Mar 27, 2026",
    read: "5 min read",
  },
  {
    tag: "Infrastructure",
    title: "Building the operating system for African businesses",
    excerpt: "Notes on what we learned designing software for the realities of operating in South Africa.",
    date: "Mar 09, 2026",
    read: "9 min read",
  },
];

function Blog() {
  return (
    <div className="bg-gradient-hero">
      <section className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Field notes</p>
          <h1 className="mt-4 text-5xl md:text-7xl font-light tracking-tighter text-gradient max-w-3xl">
            Writing on operations, compliance and infrastructure.
          </h1>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.05}>
              <Link to="/blog" className="group block glass rounded-3xl overflow-hidden hover:bg-white/[0.06] transition">
                <div className="relative h-56 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent">
                  <div className="absolute inset-0 grid-bg opacity-60" />
                  <div className="absolute bottom-4 left-4 text-xs px-2.5 py-1 rounded-full glass">{p.tag}</div>
                </div>
                <div className="p-7">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.date}</span>
                    <span>{p.read}</span>
                  </div>
                  <h2 className="mt-3 text-2xl tracking-tight group-hover:text-foreground">{p.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
                  <div className="mt-5 inline-flex items-center gap-1 text-sm text-primary">
                    Read essay <ArrowUpRight size={14}/>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
