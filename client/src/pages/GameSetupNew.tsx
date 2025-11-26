import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNumberInput } from '@/components/GameComponents';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Zap, Loader2, Users } from 'lucide-react';

export default function GameSetup() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [gameMode, setGameMode] = useState<string>('ai');
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [showFriendPicker, setShowFriendPicker] = useState(false);

  const { digits, currentSlot, inputDigit, clearInput, getValue, isComplete, focusSlot } = useNumberInput();
  
  // Mock friends list - in real app would come from API
  const mockFriends = [
    { id: 'friend-1', name: 'Alice Johnson', email: 'alice@example.com' },
    { id: 'friend-2', name: 'Bob Smith', email: 'bob@example.com' },
    { id: 'friend-3', name: 'Carol Davis', email: 'carol@example.com' },
  ];

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
        friendId: gameMode === 'friend' ? selectedFriend : undefined,
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
        title: 'Select a Friend',
        description: 'Please choose a friend to challenge',
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
      case 'friend': return selectedFriend ? mockFriends.find(f => f.id === selectedFriend)?.name || 'Friend' : 'Select Friend';
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

        {/* Friend Picker Modal */}
        {showFriendPicker && gameMode === 'friend' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <Card className="w-full sm:max-w-md border-purple-500/30 bg-slate-900 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Challenge a Friend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockFriends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => {
                      setSelectedFriend(friend.id);
                      setShowFriendPicker(false);
                      toast({
                        title: 'Friend Selected',
                        description: `Challenge sent to ${friend.name}`,
                      });
                    }}
                    className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-purple-500/20 transition-colors border border-purple-500/20 hover:border-purple-500/50"
                  >
                    <div className="font-semibold text-white">{friend.name}</div>
                    <div className="text-sm text-purple-300">{friend.email}</div>
                  </button>
                ))}
                <Button
                  onClick={() => setShowFriendPicker(false)}
                  variant="outline"
                  className="w-full mt-4 border-purple-500/30 text-purple-300"
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
            <CardTitle className="text-white text-lg">How to Play</CardTitle>
          </CardHeader>
          <CardContent className="text-purple-200 text-sm space-y-2">
            <p>• Pick a 4-digit secret number</p>
            <p>• Your opponent will try to guess it</p>
            <p>• First to guess the number wins!</p>
          </CardContent>
        </Card>

        {/* Friend Selection for Friend Mode */}
        {gameMode === 'friend' && (
          <Button
            onClick={() => setShowFriendPicker(true)}
            variant="outline"
            className="w-full mb-6 border-purple-500/30 text-purple-300 h-10 hover:bg-purple-500/10"
          >
            <Users className="w-4 h-4 mr-2" />
            {selectedFriend ? mockFriends.find(f => f.id === selectedFriend)?.name : 'Select Friend to Challenge'}
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
                className="h-12 text-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all hover:scale-105"
              >
                {num}
              </Button>
            ))}
            <Button
              onClick={() => inputDigit('0')}
              className="col-span-2 h-12 text-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all hover:scale-105"
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
              Start Game
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
