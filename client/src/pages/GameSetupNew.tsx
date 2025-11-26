import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNumberInput } from '@/components/GameComponents';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Zap, Loader2, Users, Search, Clock } from 'lucide-react';

export default function GameSetup() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [gameMode, setGameMode] = useState<string>('ai');
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string } | null>(null);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { digits, currentSlot, inputDigit, clearInput, getValue, isComplete, focusSlot } = useNumberInput();

  // Search users API
  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/search/users', searchQuery],
    enabled: searchQuery.length >= 2 && gameMode === 'friend' && showFriendPicker,
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const response = await apiRequest('GET', `/api/search/users?q=${encodeURIComponent(searchQuery)}`, {});
      return response.json();
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode) setGameMode(mode);
  }, []);

  const createGameMutation = useMutation({
    mutationFn: async () => {
      if (gameMode === 'friend' && !selectedFriend) {
        throw new Error('Please select a friend to challenge');
      }
      
      const response = await apiRequest('POST', '/api/games', { 
        gameMode,
        difficulty: 'standard',
        friendId: gameMode === 'friend' ? selectedFriend?.id : undefined,
        friendName: gameMode === 'friend' ? selectedFriend?.name : undefined,
      });
      return response.json();
    },
    onSuccess: (game) => {
      setSecretMutation.mutate({
        gameId: game.id,
        secretNumber: getValue(),
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create game',
        variant: 'destructive',
      });
    },
  });

  const setSecretMutation = useMutation({
    mutationFn: async ({ gameId, secretNumber }: { gameId: string; secretNumber: string }) => {
      const response = await apiRequest('PUT', `/api/games/${gameId}/secret`, { secretNumber });
      return response.json();
    },
    onSuccess: (game) => {
      toast({
        title: 'Challenge Sent!',
        description: `Waiting for ${selectedFriend?.name} to accept...`,
      });
      setLocation(`/game/play/${game.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start game',
        variant: 'destructive',
      });
    },
  });

  const handleStart = () => {
    if (gameMode === 'friend' && !selectedFriend) {
      toast({
        title: 'Select a Player',
        description: 'Please search and select a player to challenge',
        variant: 'destructive',
      });
      return;
    }
    
    if (!isComplete()) {
      toast({
        title: 'Invalid Number',
        description: 'Please enter a complete 4-digit number',
        variant: 'destructive',
      });
      return;
    }
    createGameMutation.mutate();
  };

  const getOpponentName = () => {
    switch (gameMode) {
      case 'ai': return 'AI Assistant';
      case 'friend': return selectedFriend?.name || 'Player to Challenge';
      case 'random': return 'Random Opponent';
      default: return 'Opponent';
    }
  };

  const isLoading = createGameMutation.isPending || setSecretMutation.isPending;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="text-purple-200 hover:text-white hover:bg-purple-500/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Choose Your Number</h1>
            <p className="text-purple-200 text-sm">vs {getOpponentName()}</p>
          </div>
        </div>

        {/* User Search Modal */}
        {showFriendPicker && gameMode === 'friend' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <Card className="w-full sm:max-w-md border-purple-500/30 bg-slate-900 backdrop-blur max-h-96 flex flex-col">
              <CardHeader className="sticky top-0 bg-slate-900/95">
                <CardTitle className="text-white">Search Player</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 overflow-y-auto">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    placeholder="Enter username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 text-white rounded-lg border border-purple-500/30 focus:border-purple-500 focus:outline-none placeholder-slate-500"
                  />
                </div>

                {/* Search Results */}
                {searchQuery.length >= 2 ? (
                  <>
                    {searchResults.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-purple-300 text-sm">No players found</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map((result: any) => (
                          <button
                            key={result.id}
                            onClick={() => {
                              setSelectedFriend({ id: result.id, name: result.name });
                              setShowFriendPicker(false);
                              setSearchQuery('');
                              toast({
                                title: 'Player Selected',
                                description: `You're about to challenge ${result.name}!`,
                              });
                            }}
                            className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-purple-500/20 transition-colors border border-purple-500/20 hover:border-purple-500/50"
                          >
                            <div className="font-semibold text-white">{result.name}</div>
                            <div className="text-xs text-purple-300">
                              {result.stats?.gamesWon} wins • {result.stats?.winRate}% win rate
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-purple-300 text-sm">Type at least 2 characters to search</p>
                  </div>
                )}

                {/* Cancel Button */}
                <Button
                  onClick={() => {
                    setShowFriendPicker(false);
                    setSearchQuery('');
                  }}
                  variant="outline"
                  className="w-full border-purple-500/30 text-purple-300 mt-4"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instructions */}
        <Card className="mb-6 border-purple-500/20 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-lg">Invite & Challenge</CardTitle>
          </CardHeader>
          <CardContent className="text-purple-200 text-sm space-y-2">
            <div className="flex gap-2">
              <div className="text-purple-400 font-bold">1.</div>
              <p>Pick your 4-digit secret number</p>
            </div>
            <div className="flex gap-2">
              <div className="text-purple-400 font-bold">2.</div>
              <p>Search by username to invite friend</p>
            </div>
            <div className="flex gap-2">
              <div className="text-purple-400 font-bold">3.</div>
              <p>They have 5 minutes to accept</p>
            </div>
            <div className="flex gap-2">
              <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-300">Challenge expires after 5 minutes</p>
            </div>
          </CardContent>
        </Card>

        {/* Player Search Button for Friend Mode */}
        {gameMode === 'friend' && (
          <Button
            onClick={() => setShowFriendPicker(true)}
            variant="outline"
            className="w-full mb-6 border-purple-500/30 text-purple-300 h-11 hover:bg-purple-500/10 font-semibold"
          >
            <Users className="w-4 h-4 mr-2" />
            {selectedFriend ? `Challenge ${selectedFriend.name}` : 'Search Player to Challenge'}
          </Button>
        )}

        {/* Number Input */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-4">Your Secret Number</label>
          
          <div className="flex justify-center gap-2 mb-6">
            {digits.map((digit, i) => (
              <button
                key={i}
                onClick={() => focusSlot(i)}
                className={`w-14 h-14 rounded-lg font-bold text-lg transition-all ${
                  digit
                    ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                } ${i === currentSlot ? 'ring-2 ring-purple-400 scale-110' : ''}`}
              >
                {digit || '•'}
              </button>
            ))}
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                onClick={() => inputDigit(num.toString())}
                className="h-12 text-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all active:scale-95"
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={() => inputDigit('0')}
              className="col-span-2 h-12 text-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all active:scale-95"
            >
              0
            </Button>
            <Button
              onClick={clearInput}
              variant="destructive"
              className="h-12 text-lg font-semibold"
            >
              ⌫
            </Button>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          disabled={!isComplete() || isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-12 rounded-lg font-semibold transition-all disabled:opacity-50"
          data-testid="button-start-game"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              {gameMode === 'friend' ? 'Send Challenge' : 'Start Game'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
