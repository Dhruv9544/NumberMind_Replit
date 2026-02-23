import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, UserRound, Swords, Loader2 } from "lucide-react";

interface FoundUser {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  email?: string;
}

export default function FriendChallenge() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FoundUser | null>(null);

  // Search the DB directly when user types
  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    setSelectedUser(null);

    const trimmed = q.trim().replace(/^@/, "");
    if (trimmed.length < 1) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/search/users?q=${encodeURIComponent(trimmed)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Search failed");
      const data: FoundUser[] = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Create a game and send challenge notification to the selected user
  const challengeMutation = useMutation({
    mutationFn: async (opponent: FoundUser) => {
      const res = await apiRequest("POST", "/api/games", {
        gameMode: "friend",
        difficulty: "standard",
        friendId: opponent.id,
        friendName: opponent.username,
      });
      return res.json();
    },
    onSuccess: (game, opponent) => {
      toast({
        title: "Challenge Sent! ⚔️",
        description: `@${opponent.username} has been notified. Waiting for them to join...`,
      });
      // Take the challenger to the game setup page
      setLocation(`/game/setup?mode=friend&gameId=${game.id}`);
    },
    onError: () => {
      toast({
        title: "Failed to send challenge",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSelectAndChallenge = (found: FoundUser) => {
    setSelectedUser(found);
    challengeMutation.mutate(found);
  };

  const getInitials = (name: string, username: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
    }
    return username?.[0]?.toUpperCase() ?? "?";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto p-4 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-purple-200 hover:text-white hover:bg-purple-500/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Challenge a Player</h1>
            <p className="text-purple-300 text-sm mt-1">Search by username to challenge anyone</p>
          </div>
        </div>

        {/* Search box */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
          <Input
            id="search-username-input"
            type="text"
            placeholder="Enter a username to search..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-11 pr-4 py-3 bg-slate-800/60 border-purple-500/30 text-white placeholder-purple-400 focus:border-purple-400 focus:ring-purple-400 rounded-xl text-base"
            autoComplete="off"
            autoFocus
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 animate-spin" />
          )}
        </div>

        {/* Results */}
        {!searching && searchQuery.trim().length > 0 && results.length === 0 && (
          <Card className="border-purple-500/20 bg-slate-900/60 backdrop-blur">
            <CardContent className="py-10 text-center">
              <UserRound className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-50" />
              <p className="text-purple-300 text-base">No user found with that username.</p>
              <p className="text-purple-400/60 text-sm mt-1">Try a different username.</p>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((found) => {
              const isSelected = selectedUser?.id === found.id;
              const isPending = isSelected && challengeMutation.isPending;

              return (
                <Card
                  key={found.id}
                  className="border-purple-500/30 bg-gradient-to-br from-slate-800/80 to-purple-900/40 backdrop-blur overflow-hidden transition-all hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      {/* Avatar + Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
                          {found.avatar ? (
                            <img
                              src={found.avatar}
                              alt={found.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(found.name, found.username)
                          )}
                        </div>
                        <div>
                          <div className="text-white font-semibold text-base leading-tight">
                            @{found.username}
                          </div>
                          {found.name && found.name !== found.username && (
                            <div className="text-purple-300 text-sm">{found.name}</div>
                          )}
                        </div>
                      </div>

                      {/* Challenge button */}
                      <Button
                        id={`challenge-btn-${found.id}`}
                        onClick={() => handleSelectAndChallenge(found)}
                        disabled={isPending || challengeMutation.isPending}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold px-5 py-2 rounded-lg gap-2 shadow-md transition-all"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Swords className="w-4 h-4" />
                            Challenge
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty state when no search yet */}
        {!searching && searchQuery.trim().length === 0 && (
          <Card className="border-purple-500/10 bg-slate-900/30 backdrop-blur mt-4">
            <CardContent className="py-12 text-center">
              <Swords className="w-14 h-14 text-purple-500/40 mx-auto mb-4" />
              <p className="text-purple-300/70 text-base">
                Type a username above to find a player and challenge them.
              </p>
              <p className="text-purple-400/40 text-sm mt-2">
                They'll receive an instant notification to play!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
