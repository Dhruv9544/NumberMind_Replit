import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Gamepad2,
  LogOut,
  User,
  Trophy,
  Bell,
  Users,
  Menu,
  LogIn,
  Info,
  HelpCircle,
} from "lucide-react";

export function Navbar() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);

  // All hooks must be at the top — React Rules of Hooks
  const { user, isLoading: authLoading } = useAuth();

  const { data: friendRequests } = useQuery<{
    incoming: any[];
    outgoing: any[];
  }>({
    queryKey: ["/api/friends/requests"],
    enabled: !!user,
    refetchInterval: 15000,
  });
  const pendingCount = friendRequests?.incoming?.length ?? 0;

  // ── Conditional renders (after all hooks) ──────────────────────
  if (authLoading) return null;                           // avoid flash during auth check
  if (location === "/auth") return null;                  // auth page has its own layout
  if (location === "/" && !user) return null;             // landing page has its own LandingNav

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      queryClient.clear();
      window.location.href = "/";
    } catch {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const mobileAuthLinks = [
    { href: "#how-it-works", icon: HelpCircle, label: "How To Play", color: "text-cyan-500" },
    { href: "#benefits",     icon: Info,        label: "About",       color: "text-purple-500" },
  ];

  const mobileUserLinks = [
    { href: "/leaderboard",   icon: Trophy, label: "Leaderboard",   color: "text-amber-500",   badge: undefined as number | undefined },
    { href: "/friends",       icon: Users,  label: "Friends",       color: "text-emerald-500", badge: pendingCount > 0 ? pendingCount : undefined },
    { href: "/notifications", icon: Bell,   label: "Notifications", color: "text-blue-500",    badge: undefined as number | undefined },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* ── Logo ──────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-3 group transition-all active:scale-95">
            <div className="relative">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl rotate-3 group-hover:rotate-12 transition-transform flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Gamepad2 className="w-6 h-6 text-neutral-950 -rotate-3 group-hover:-rotate-12 transition-transform" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-lg flex items-center justify-center border-2 border-neutral-950 z-10 shadow-lg">
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black italic tracking-tighter leading-none group-hover:text-emerald-400 transition-colors uppercase">
                Number<span className="text-emerald-500">Mind</span>
              </h1>
              <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-neutral-600 group-hover:text-neutral-400 transition-colors">
                Tactical Enigma
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav (md+) — only when authenticated ── */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              {/* Links */}
              <div className="flex items-center gap-4">
                <Link
                  href="/leaderboard"
                  className="text-sm font-medium text-neutral-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <Trophy className="w-4 h-4" />
                  Leaderboard
                </Link>

                <Link
                  href="/friends"
                  className="relative text-sm font-medium text-neutral-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <Users className="w-4 h-4" />
                  Friends
                  {pendingCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-emerald-500 text-neutral-950 text-[9px] font-black rounded-full flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/notifications"
                  className="text-sm font-medium text-neutral-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <Bell className="w-4 h-4" />
                  Notifications
                </Link>
              </div>

              {/* Profile + Logout */}
              <div className="flex items-center gap-3 pl-4 border-l border-neutral-800">
                <Link href={`/profile/${user.id}`} className="flex items-center gap-2 group cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                    <User className="w-4 h-4 text-neutral-400 group-hover:text-emerald-400" />
                  </div>
                  <p className="text-xs font-medium text-white hidden lg:block">
                    @{user.username || "player"}
                  </p>
                </Link>

                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="icon"
                  className="text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-full"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Mobile Hamburger (below md) ───────────────── */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="bg-neutral-950 border-neutral-800 w-72 p-0">
                {/* Header */}
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-neutral-800">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.3)]">
                      <Gamepad2 className="w-5 h-5 text-neutral-950" />
                    </div>
                    <span className="text-lg font-black italic uppercase text-white">
                      Number<span className="text-emerald-500">Mind</span>
                    </span>
                  </SheetTitle>
                </SheetHeader>

                {/* Body */}
                <nav className="flex flex-col gap-1 px-3 py-4">
                  {user ? (
                    // ── Authenticated mobile menu ──────────────────────
                    <>
                      {/* Profile pill — valid: <Link> renders <a>, no nested button */}
                      <Link
                        href={`/profile/${user.id}`}
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 mb-2 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all group"
                      >
                        <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                          <User className="w-4 h-4 text-neutral-400 group-hover:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white leading-tight">
                            @{user.username || "player"}
                          </p>
                          <p className="text-[10px] font-bold uppercase text-neutral-600 tracking-wider">
                            View Profile
                          </p>
                        </div>
                      </Link>

                      {/* Nav links — Link renders <a> directly, no nested <button> */}
                      {mobileUserLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSheetOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-900 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center border border-neutral-800 group-hover:border-neutral-700">
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                          </div>
                          <span className="flex-1 text-sm font-bold text-neutral-300 group-hover:text-white transition-colors">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="w-5 h-5 bg-emerald-500 text-neutral-950 text-[9px] font-black rounded-full flex items-center justify-center">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ))}

                      {/* Divider */}
                      <div className="my-2 border-t border-neutral-800" />

                      {/* Logout — plain <button>, semantically correct */}
                      <button
                        type="button"
                        onClick={() => { setSheetOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 transition-colors group text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center border border-neutral-800 group-hover:border-red-500/40">
                          <LogOut className="w-4 h-4 text-red-400" />
                        </div>
                        <span className="text-sm font-bold text-neutral-400 group-hover:text-red-400 transition-colors">
                          Logout
                        </span>
                      </button>
                    </>
                  ) : (
                    // ── Unauthenticated mobile menu ────────────────────
                    <>
                      {/* Login CTA */}
                      <Link
                        href="/auth"
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors mb-2"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <LogIn className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-wide text-white">
                          Login / Sign Up
                        </span>
                      </Link>

                      <div className="my-1 border-t border-neutral-800" />

                      {/* Anchor links to landing page sections */}
                      {mobileAuthLinks.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={() => setSheetOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-900 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center border border-neutral-800 group-hover:border-neutral-700">
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                          </div>
                          <span className="text-sm font-bold text-neutral-300 group-hover:text-white transition-colors">
                            {item.label}
                          </span>
                        </a>
                      ))}
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </nav>
  );
}
