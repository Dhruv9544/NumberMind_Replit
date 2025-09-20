import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function FriendChallenge() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: friends } = useQuery({
    queryKey: ["/api/users/me/friends"],
  });

  const handleChallengeFriend = (friendId: string) => {
    // In a real implementation, this would create a game with the specific friend
    setLocation(`/game/setup?mode=friend&opponent=${friendId}`);
  };

  const handleInviteByCode = () => {
    // TODO: Implement invite by game code functionality
    toast({
      title: "Coming Soon",
      description: "Invite by game code feature will be available soon!",
    });
  };

  const handleShareInvite = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join me in NumberMind!",
        text: "Challenge me to a logic deduction game in NumberMind!",
        url: window.location.origin,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(`Join me in NumberMind! ${window.location.origin}`);
      toast({
        title: "Link Copied",
        description: "Invite link copied to clipboard!",
      });
    }
  };

  const filteredFriends = Array.isArray(friends) ? friends.filter((friend: any) =>
    friend.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "F";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto bg-background min-h-screen relative overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <i className="fas fa-arrow-left text-xl"></i>
            </Button>
            <h2 className="text-xl font-bold">Challenge Friend</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInviteByCode}
              data-testid="button-add-friend"
            >
              <i className="fas fa-user-plus text-xl"></i>
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
            <Input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-friends"
            />
          </div>
          
          {/* Friends List */}
          {filteredFriends.length > 0 ? (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center">
                <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
                Friends ({filteredFriends.length})
              </h3>
              <div className="space-y-2">
                {filteredFriends.map((friend: any, index: number) => (
                  <Card key={friend.id || index} className="hover:bg-card/80 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                              <span data-testid={`friend-avatar-${index}`}>
                                {getInitials(friend.firstName, friend.lastName)}
                              </span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-background"></div>
                          </div>
                          <div>
                            <div className="font-semibold" data-testid={`friend-name-${index}`}>
                              {friend.firstName || friend.lastName 
                                ? `${friend.firstName || ""} ${friend.lastName || ""}`.trim()
                                : friend.email?.split("@")[0] || "Friend"
                              }
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Online now
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleChallengeFriend(friend.id)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-semibold transition-colors"
                          data-testid={`button-challenge-${index}`}
                        >
                          Challenge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <Card className="bg-muted/30">
                <CardContent className="p-6 text-center">
                  <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
                  <h3 className="font-semibold mb-2">No Friends Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery 
                      ? "No friends match your search. Try a different name or email."
                      : "Add friends to challenge them to exciting NumberMind games!"
                    }
                  </p>
                  <Button
                    onClick={handleInviteByCode}
                    variant="outline"
                    size="sm"
                    data-testid="button-invite-friends"
                  >
                    <i className="fas fa-user-plus mr-2"></i>
                    Invite Friends
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleInviteByCode}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground p-4 rounded-lg font-semibold transition-colors"
              data-testid="button-invite-by-code"
            >
              <i className="fas fa-qrcode mr-2"></i>
              Invite by Game Code
            </Button>
            
            <Button
              onClick={handleShareInvite}
              variant="secondary"
              className="w-full p-4 rounded-lg font-semibold transition-colors border border-border"
              data-testid="button-share-invite"
            >
              <i className="fas fa-share mr-2"></i>
              Share Invite Link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
