import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-32">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground font-semibold text-sm">H</div>
            <span className="font-medium tracking-tight">HoldCo<span className="text-muted-foreground">OS</span></span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            The Operating System for South African Businesses. Compliance, company administration and operational visibility — unified.
          </p>
        </div>
        <div>
          <div className="text-sm font-medium mb-4">Product</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Features</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Demo</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-medium mb-4">Company</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} HoldCo OS. Built in South Africa.</p>
          <p>Compliance-ready. Enterprise-grade. Investor-trusted.</p>
        </div>
      </div>
    </footer>
  );
}
