import { useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Gamepad2, LogOut, User, Trophy, Bell } from "lucide-react";

export function Navbar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useQuery<{ id: string; email: string; firstName?: string; lastName?: string; username?: string }>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      queryClient.clear();
      setLocation('/');
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
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
              <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-neutral-600 group-hover:text-neutral-400 transition-colors">Tactical Enigma</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden md:flex items-center gap-4 mr-4">
              <Link href="/leaderboard" className="text-sm font-medium text-neutral-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                Leaderboard
              </Link>
              <Link href="/notifications" className="relative text-sm font-medium text-neutral-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
                <Bell className="w-4 h-4" />
                Notifications
              </Link>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-neutral-800">
              <Link href={`/profile/${user.id}`} className="flex items-center gap-2 group cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                  <User className="w-4 h-4 text-neutral-400 group-hover:text-emerald-400" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-white">@{user.username || 'player'}</p>
                </div>
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
        </div>
      </div>
    </nav>
  );
}
