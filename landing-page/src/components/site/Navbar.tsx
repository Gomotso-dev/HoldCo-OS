import { Link } from "@tanstack/react-router";
import { List, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/pricing", label: "Pricing" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl bg-background/60 border-b border-white/5" : ""
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary glow-primary grid place-items-center text-primary-foreground font-semibold text-sm">H</div>
          <span className="font-medium tracking-tight">HoldCo<span className="text-muted-foreground">OS</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition">Sign in</Link>
          <Link
            to="/contact"
            className="text-sm px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground btn-glow transition shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
          >
            Book a demo
          </Link>
        </div>
        <button onClick={() => setOpen(true)} className="md:hidden text-foreground" aria-label="Open menu">
          <List size={24} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35 }}
            className="fixed inset-0 z-50 md:hidden bg-background/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between h-16 px-6 border-b border-white/5">
              <span className="font-medium">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close"><X size={24} /></button>
            </div>
            <nav className="flex flex-col p-6 gap-2">
              {links.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="py-3 text-2xl tracking-tight">
                  {l.label}
                </Link>
              ))}
              <Link to="/contact" onClick={() => setOpen(false)} className="mt-6 text-center px-4 py-3 rounded-xl bg-gradient-primary text-primary-foreground">
                Book a demo
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
