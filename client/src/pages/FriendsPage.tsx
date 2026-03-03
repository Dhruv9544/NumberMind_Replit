import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  UserPlus,
  Users,
  Swords,
  Check,
  X,
  UserMinus,
  Search,
  Loader2,
  Clock,
  Wifi,
  WifiOff,
  Bell,
  ShieldCheck,
} from "lucide-react";
import { GameLoader } from "@/components/GameLoader";

/* ─── Types ─────────────────────────────────────────────── */
interface Friend {
  id: string;
  username: string;
  profileImageUrl?: string;
  friendshipId: string;
  online: boolean;
}

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  sender?: { id: string; username: string; profileImageUrl?: string };
  receiver?: { id: string; username: string; profileImageUrl?: string };
}

interface SearchUser {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
}

type Tab = "friends" | "requests";

/* ─── Sub-components ─────────────────────────────────────── */
function Avatar({
  username,
  imageUrl,
  size = "md",
}: {
  username?: string | null;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sz =
    size === "sm"
      ? "w-9 h-9 text-sm"
      : size === "lg"
      ? "w-14 h-14 text-xl"
      : "w-11 h-11 text-base";
  const initial = (username?.[0] ?? "?").toUpperCase();
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={username ?? ""}
        className={cn(sz, "rounded-full object-cover border-2 border-neutral-700")}
      />
    );
  }
  return (
    <div
      className={cn(
        sz,
        "rounded-full bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center font-black text-white border-2 border-neutral-700"
      )}
    >
      {initial}
    </div>
  );
}

function OnlineBadge({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
        online
          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
          : "bg-neutral-800 border-neutral-700 text-neutral-500"
      )}
    >
      {online ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
      {online ? "Online" : "Offline"}
    </span>
  );
}

/* ─── AddFriend inline search ────────────────────────────── */
function AddFriendBox({
  onSend,
  isSending,
}: {
  onSend: (username: string) => void;
  isSending: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SearchUser | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim().replace(/^@/, "");

  // Live search - only when NOT yet selected
  const { data: suggestions = [], isFetching } = useQuery<SearchUser[]>({
    queryKey: ["/api/search/users", trimmed],
    queryFn: async () => {
      if (trimmed.length < 1) return [];
      const res = await fetch(
        `/api/search/users?q=${encodeURIComponent(trimmed)}`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: trimmed.length >= 1 && !selected,
    staleTime: 3000,
  });

  const showResults = trimmed.length >= 1 && !selected;

  const handleSelect = (user: SearchUser) => {
    setSelected(user);
    setQuery(user.username);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSend = () => {
    const username = selected?.username || trimmed;
    if (username) {
      onSend(username);
      setSelected(null);
      setQuery("");
    }
  };

  return (
    <div className="space-y-3">
      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          {isFetching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          )}
          <Input
            ref={inputRef}
            id="add-friend-input"
            placeholder="Search by username..."
            value={query}
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              if (selected) setSelected(null); // clear selection on re-type
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (selected?.username || trimmed)) handleSend();
              if (e.key === "Escape") handleClear();
            }}
            className="pl-9 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600 focus:border-emerald-500/50 rounded-xl"
          />
          {/* Clear X */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSend}
          disabled={isSending || (!selected && !trimmed)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 rounded-xl shrink-0"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
        </Button>
      </div>

      {/* Selected preview chip */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center text-white font-black text-[10px] shrink-0">
                {selected.username?.[0]?.toUpperCase()}
              </div>
              <span className="text-emerald-400 font-bold text-sm">@{selected.username}</span>
              <span className="text-neutral-500 text-xs">selected</span>
              <button onClick={handleClear} className="ml-auto text-neutral-500 hover:text-neutral-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline search results - no floating, no z-index issues */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-neutral-700 bg-neutral-800/60 overflow-hidden">
              {suggestions.length === 0 && !isFetching ? (
                <div className="px-4 py-3 text-sm text-neutral-500 flex items-center gap-2">
                  <Search className="w-4 h-4 opacity-40" />
                  No users found for &quot;{trimmed}&quot;
                </div>
              ) : (
                <ul className="divide-y divide-neutral-800">
                  {suggestions.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(user)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-700/50 transition-colors group"
                      >
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center text-white font-black text-sm shrink-0 border border-neutral-700">
                          {user.username?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-neutral-200 group-hover:text-white transition-colors">
                            @{user.username}
                          </p>
                          {user.name && user.name !== user.username && (
                            <p className="text-neutral-500 text-xs truncate">{user.name}</p>
                          )}
                        </div>
                        {/* Tap to select hint */}
                        <span className="text-[10px] text-neutral-600 group-hover:text-emerald-500 font-bold shrink-0 transition-colors">
                          Select
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function FriendsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("friends");

  /* Queries */
  const { data: friends = [], isLoading: loadingFriends } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
    refetchInterval: 8000,
  });

  const { data: requests, isLoading: loadingRequests } = useQuery<{
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
  }>({
    queryKey: ["/api/friends/requests"],
    refetchInterval: 10000,
  });

  const incoming = requests?.incoming ?? [];
  const outgoing = requests?.outgoing ?? [];
  const pendingCount = incoming.length;

  /* Mutations */
  const sendRequestMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("POST", "/api/friends/request", { username });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Request Sent!", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (err: any) => {
      toast({ title: "Could not send request", description: err.message, variant: "destructive" });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", "/api/friends/accept", { requestId });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Friend added!", description: "You are now friends." });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const declineMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", "/api/friends/decline", { requestId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", "/api/friends/cancel", { requestId });
      return res.json();
    },
    onSuccess: () => {
      toast({ description: "Request cancelled" });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("DELETE", `/api/friends/${encodeURIComponent(username)}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ description: "Friend removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const challengeMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("POST", "/api/friends/challenge", { username });
      return res.json();
    },
    onSuccess: (data, username) => {
      toast({ title: "Challenge Sent! ⚔️", description: "Waiting for your friend to accept..." });
      setLocation(`/game/setup?mode=friend&gameId=${data.game.id}&opponent=${encodeURIComponent(username)}`);
    },
    onError: (err: any) => toast({ title: "Cannot challenge", description: err.message, variant: "destructive" }),
  });

  const isLoading = loadingFriends || loadingRequests;

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-neutral-950">
        <GameLoader text="Loading friends..." />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-neutral-950 text-neutral-50 pb-16 font-sans overflow-x-hidden">
      {/* Background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </Link>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">
              Social
            </p>
            <h1 className="text-3xl font-black tracking-tight italic uppercase">
              Friends <span className="text-emerald-400">&amp; Rivals</span>
            </h1>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-emerald-500 text-neutral-950 font-black px-3 h-7 text-xs rounded-lg animate-pulse">
              {pendingCount} pending
            </Badge>
          )}
        </div>

        {/* Add Friend Box */}
        <Card className="border-neutral-800 bg-neutral-900/60 backdrop-blur-sm rounded-2xl mb-6">
          <CardContent className="p-4">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
              Add a Friend
            </p>
            <AddFriendBox
              onSend={(username) => sendRequestMutation.mutate(username)}
              isSending={sendRequestMutation.isPending}
            />
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 bg-neutral-900 rounded-xl border border-neutral-800">
          {(
            [
              { id: "friends", label: "My Friends", icon: Users, count: friends.length },
              { id: "requests", label: "Requests", icon: Bell, count: pendingCount },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                tab === t.id
                  ? "bg-neutral-800 text-white shadow"
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                    t.id === "requests"
                      ? "bg-emerald-500 text-neutral-950"
                      : "bg-neutral-700 text-neutral-300"
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === "friends" && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {friends.length === 0 ? (
                <Card className="border-neutral-800 bg-neutral-900/40 rounded-2xl border-dashed">
                  <CardContent className="py-14 text-center">
                    <Users className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-400 font-bold">No friends yet</p>
                    <p className="text-neutral-600 text-sm mt-1">
                      Search by username above to add friends.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                friends.map((friend) => (
                  <motion.div key={friend.id} layout>
                    <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm rounded-2xl hover:border-neutral-700 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar
                              username={friend.username}
                              imageUrl={friend.profileImageUrl}
                            />
                            <span
                              className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-neutral-900",
                                friend.online ? "bg-emerald-500" : "bg-neutral-600"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-white">@{friend.username}</p>
                            <OnlineBadge online={friend.online} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              disabled={!friend.online || challengeMutation.isPending}
                              onClick={() => challengeMutation.mutate(friend.username!)}
                              title={friend.online ? "Challenge!" : "Friend is offline"}
                              className={cn(
                                "h-9 px-4 font-bold rounded-xl text-xs",
                                friend.online
                                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow shadow-emerald-500/20"
                                  : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                              )}
                            >
                              <Swords className="w-3.5 h-3.5 mr-1.5" />
                              {friend.online ? "Challenge" : "Offline"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                friend.username && removeMutation.mutate(friend.username)
                              }
                              disabled={removeMutation.isPending}
                              className="h-9 w-9 p-0 text-neutral-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                              title="Remove friend"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {tab === "requests" && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              {/* Incoming */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3 flex items-center gap-2">
                  <Bell className="w-3 h-3 text-emerald-500" />
                  Incoming Requests
                  {incoming.length > 0 && (
                    <span className="bg-emerald-500 text-neutral-950 px-1.5 rounded-full text-[9px] font-black">
                      {incoming.length}
                    </span>
                  )}
                </p>
                {incoming.length === 0 ? (
                  <p className="text-neutral-600 text-sm text-center py-4">
                    No incoming requests
                  </p>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {incoming.map((req) => (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          layout
                        >
                          <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm rounded-2xl border-emerald-500/10 hover:border-emerald-500/20 transition-all">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  username={req.sender?.username}
                                  imageUrl={req.sender?.profileImageUrl}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-white">
                                    @{req.sender?.username ?? "..."}
                                  </p>
                                  <div className="flex items-center gap-1 text-neutral-500 text-xs mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    {new Date(req.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => acceptMutation.mutate(req.id)}
                                    disabled={acceptMutation.isPending}
                                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                                  >
                                    {acceptMutation.isPending &&
                                    acceptMutation.variables === req.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="w-3.5 h-3.5 mr-1" />
                                        Accept
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => declineMutation.mutate(req.id)}
                                    disabled={declineMutation.isPending}
                                    className="h-9 w-9 p-0 text-neutral-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                                    title="Decline"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Outgoing */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-blue-500" />
                  Sent Requests
                  {outgoing.length > 0 && (
                    <span className="bg-neutral-700 text-neutral-300 px-1.5 rounded-full text-[9px] font-black">
                      {outgoing.length}
                    </span>
                  )}
                </p>
                {outgoing.length === 0 ? (
                  <p className="text-neutral-600 text-sm text-center py-4">
                    No outgoing requests
                  </p>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {outgoing.map((req) => (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          layout
                        >
                          <Card className="border-neutral-800 bg-neutral-900/40 rounded-2xl">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  username={req.receiver?.username}
                                  imageUrl={req.receiver?.profileImageUrl}
                                  size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-neutral-300">
                                    @{req.receiver?.username ?? "..."}
                                  </p>
                                  <p className="text-neutral-600 text-xs mt-0.5">
                                    Pending acceptance...
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => cancelMutation.mutate(req.id)}
                                  disabled={cancelMutation.isPending}
                                  className="h-8 px-3 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs"
                                >
                                  <X className="w-3.5 h-3.5 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
