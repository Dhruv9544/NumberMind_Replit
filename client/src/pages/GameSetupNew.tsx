import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNumberInput } from '@/components/GameComponents';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Zap, Loader2, Users, Search, Clock, Bot, Globe, HelpCircle } from 'lucide-react';

export default function GameSetup() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [gameMode, setGameMode] = useState<string>('ai');
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string } | null>(null);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { digits, currentSlot, inputDigit, clearInput, getValue, isComplete, focusSlot } = useNumberInput();

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
      if (gameMode === 'ai') {
        toast({
          title: 'Game Started!',
          description: 'Playing against AI. Make your first guess!',
        });
      } else if (gameMode === 'friend') {
        toast({
          title: 'Challenge Sent!',
          description: `Waiting for ${selectedFriend?.name} to accept...`,
        });
      } else if (gameMode === 'random') {
        toast({
          title: 'Searching...',
          description: 'Looking for an opponent...',
        });
      }
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

  const getModeInfo = () => {
    switch (gameMode) {
      case 'ai':
        return { icon: Bot, name: 'AI Practice', color: 'from-purple-600 to-blue-600' };
      case 'friend':
        return { icon: Users, name: 'Challenge Friend', color: 'from-blue-600 to-cyan-600' };
      case 'random':
        return { icon: Globe, name: 'Random Opponent', color: 'from-cyan-600 to-teal-600' };
      default:
        return { icon: Zap, name: 'Game', color: 'from-purple-600 to-blue-600' };
    }
  };

  const modeInfo = getModeInfo();
  const ModeIcon = modeInfo.icon;
  const isLoading = createGameMutation.isPending || setSecretMutation.isPending;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="text-purple-200 hover:text-white hover:bg-purple-500/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ModeIcon className="w-5 h-5 text-purple-400" />
              <h1 className="text-xl font-bold text-white font-sans">{modeInfo.name}</h1>
            </div>
            <p className="text-purple-200 text-sm">Set your secret number</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHowToPlay(true)}
            className="text-purple-200 hover:text-white hover:bg-purple-500/20"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </div>

        {/* How to Play Modal */}
        {showHowToPlay && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-purple-500/30 bg-slate-900/95 backdrop-blur">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold text-white">How to Play</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <h3 className="text-white font-bold mb-3 text-center">🎯 Goal</h3>
                  <p className="text-purple-200 text-sm text-center">
                    Guess your opponent's 4-digit secret number before they guess yours!
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-bold text-center">📊 Feedback Symbols</h3>
                  
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="bg-green-500/30 text-green-400 px-3 py-2 rounded-lg text-lg font-bold">
                      ✓
                    </div>
                    <div>
                      <p className="text-green-400 font-bold">Correct Position</p>
                      <p className="text-green-300 text-xs">Right digit in the right spot</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <div className="bg-yellow-500/30 text-yellow-400 px-3 py-2 rounded-lg text-lg font-bold">
                      ◆
                    </div>
                    <div>
                      <p className="text-yellow-400 font-bold">Correct Digit</p>
                      <p className="text-yellow-300 text-xs">Right digit, wrong position</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3">
                  <h4 className="text-white font-semibold mb-2 text-sm">Example:</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {['1', '2', '3', '4'].map((d, i) => (
                        <div key={i} className="w-8 h-8 rounded bg-slate-700 text-purple-300 flex items-center justify-center text-sm font-bold">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm font-bold">✓2</span>
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-sm font-bold">◆1</span>
                    </div>
                  </div>
                  <p className="text-purple-300 text-xs mt-2">
                    2 digits are in the correct position, 1 more digit exists but in wrong position
                  </p>
                </div>

                <Button
                  onClick={() => setShowHowToPlay(false)}
                  className={`w-full bg-gradient-to-r ${modeInfo.color} text-white h-12 rounded-xl font-bold text-lg`}
                >
                  Got It! Let's Play
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Friend Search Modal */}
        {showFriendPicker && gameMode === 'friend' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <Card className="w-full sm:max-w-md border-purple-500/30 bg-slate-900 backdrop-blur max-h-96 flex flex-col">
              <CardHeader className="sticky top-0 bg-slate-900/95">
                <CardTitle className="text-white">Search by Username</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 overflow-y-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    placeholder="@username"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 text-white rounded-xl border border-purple-500/30 focus:border-purple-500 focus:outline-none placeholder-slate-500 font-medium"
                  />
                </div>

                {searchQuery.length >= 2 ? (
                  <>
                    {searchResults.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-purple-300">No players found</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map((result: any) => (
                          <button
                            key={result.id}
                            onClick={() => {
                              setSelectedFriend({ id: result.id, name: result.username || result.name });
                              setShowFriendPicker(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left p-4 rounded-xl bg-slate-800 hover:bg-purple-500/20 transition-all border border-purple-500/20 hover:border-purple-500/50"
                          >
                            <div className="font-bold text-white">@{result.username || result.name}</div>
                            <div className="text-xs text-purple-300 mt-1">
                              🏆 {result.stats?.gamesWon || 0} wins • {result.stats?.winRate || 0}% win rate
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-purple-300 text-sm">Type username to search</p>
                  </div>
                )}

                <Button
                  onClick={() => {
                    setShowFriendPicker(false);
                    setSearchQuery('');
                  }}
                  variant="outline"
                  className="w-full border-purple-500/30 text-purple-300"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mode-specific info */}
        {gameMode === 'ai' && (
          <Card className="mb-4 border-purple-500/20 bg-purple-500/10 backdrop-blur">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Bot className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-white font-bold">Practice Mode</p>
                  <p className="text-purple-200 text-sm">Play against AI to improve your skills</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {gameMode === 'random' && (
          <Card className="mb-4 border-cyan-500/20 bg-cyan-500/10 backdrop-blur">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-cyan-400" />
                <div>
                  <p className="text-white font-bold">Random Match</p>
                  <p className="text-cyan-200 text-sm">Play against real players online</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Friend Selection */}
        {gameMode === 'friend' && (
          <Button
            onClick={() => setShowFriendPicker(true)}
            variant="outline"
            className="w-full mb-4 border-blue-500/30 text-blue-300 h-14 hover:bg-blue-500/10 font-bold rounded-xl"
          >
            <Users className="w-5 h-5 mr-2" />
            {selectedFriend ? `@${selectedFriend.name}` : 'Search Player by Username'}
          </Button>
        )}

        {/* Number Input */}
        <Card className="mb-4 border-purple-500/20 bg-slate-900/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg text-center">Your Secret Number</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-3 mb-6">
              {digits.map((digit, i) => (
                <button
                  key={i}
                  onClick={() => focusSlot(i)}
                  className={`w-16 h-16 rounded-xl font-bold text-2xl transition-all shadow-lg ${
                    digit
                      ? `bg-gradient-to-br ${modeInfo.color} text-white`
                      : 'bg-slate-700/80 text-slate-400 border-2 border-dashed border-purple-500/30'
                  } ${i === currentSlot ? 'ring-4 ring-purple-400/50 scale-110' : ''}`}
                >
                  {digit || '?'}
                </button>
              ))}
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  onClick={() => inputDigit(num.toString())}
                  className="h-14 text-xl font-bold bg-slate-700/80 hover:bg-slate-600 text-white rounded-xl transition-all active:scale-95 border border-purple-500/20"
                >
                  {num}
                </Button>
              ))}
              <Button
                onClick={() => inputDigit('0')}
                className="col-span-2 h-14 text-xl font-bold bg-slate-700/80 hover:bg-slate-600 text-white rounded-xl transition-all active:scale-95 border border-purple-500/20"
              >
                0
              </Button>
              <Button
                onClick={clearInput}
                variant="destructive"
                className="h-14 text-xl font-bold rounded-xl"
              >
                ⌫
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Challenge Timer Notice */}
        {gameMode === 'friend' && selectedFriend && (
          <div className="flex items-center justify-center gap-2 mb-4 text-yellow-300 text-sm">
            <Clock className="w-4 h-4" />
            <span>Challenge expires in 5 minutes after sending</span>
          </div>
        )}

        {/* Start Button */}
        <Button
          onClick={handleStart}
          disabled={!isComplete() || isLoading || (gameMode === 'friend' && !selectedFriend)}
          className={`w-full bg-gradient-to-r ${modeInfo.color} hover:opacity-90 text-white h-14 rounded-xl font-bold text-lg transition-all disabled:opacity-50 shadow-lg`}
          data-testid="button-start-game"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {gameMode === 'random' ? 'Finding Opponent...' : 'Starting...'}
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              {gameMode === 'ai' ? 'Start Practice' : gameMode === 'friend' ? 'Send Challenge' : 'Find Opponent'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
