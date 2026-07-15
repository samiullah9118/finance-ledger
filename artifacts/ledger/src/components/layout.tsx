import { Link, useLocation } from "wouter";
import { LayoutDashboard, Receipt, PieChart, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/budget", label: "Budget", icon: PieChart },
  { href: "/goals", label: "Goals", icon: Target },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border flex flex-col hidden md:flex shrink-0"
        style={{ background: "hsl(240 22% 5%)" }}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2v10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold tracking-tight text-lg text-foreground" style={{ letterSpacing: "-0.02em" }}>
              Ledger
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/4"
              )}
              style={isActive ? {
                background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.10))",
                boxShadow: "inset 0 0 0 1px rgba(99,102,241,0.2)"
              } : {}}>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                    style={{ background: "linear-gradient(180deg, #6366f1, #8b5cf6)" }} />
                )}
                <item.icon className={cn(
                  "w-4 h-4 transition-colors shrink-0",
                  isActive ? "text-indigo-400" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))", border: "1px solid rgba(99,102,241,0.25)" }}>
              <span className="text-xs font-semibold text-indigo-300">L</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground truncate">Personal</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Mobile Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2v10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold tracking-tight text-foreground">Ledger</span>
          </div>

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href} className={cn(
                "p-2 rounded-lg transition-colors",
                (item.href === "/" ? location === "/" : location.startsWith(item.href))
                  ? "text-indigo-400 bg-indigo-500/10"
                  : "text-muted-foreground hover:bg-white/5"
              )}>
                <item.icon className="w-5 h-5" />
              </Link>
            ))}
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
