import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => void;
  socket: WebSocket | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
    
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('🔌 Global WebSocket connected');
      setIsConnected(true);
      // Identify this connection with the user
      socket.send(JSON.stringify({
        type: 'identify',
        userId: user.id,
      }));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('📨 WebSocket message:', message);
      setLastMessage(message);

      // Handle global events
      switch (message.type) {
        case 'challenge_received':
          toast({
            title: '⚔️ Challenge Received!',
            description: `@${message.fromPlayerName || message.fromPlayerUsername} wants to play! Check Challenges to accept.`,
            duration: 30000,
          });
          break;

        case 'challenge_declined':
          toast({
            title: '❌ Challenge Declined',
            description: message.message || 'Your challenge was declined.',
            variant: 'destructive',
            duration: 6000,
          });
          break;

        case 'opponent_left':
          toast({
            title: '🏆 Opponent Left',
            description: message.message || 'Your opponent left. You win by forfeit!',
            duration: 10000,
          });
          // lastMessage is set above — GamePlayNew will refetch and show win screen
          break;

        case 'match_found':
          toast({
            title: '🎯 Match Found!',
            description: `Playing against ${message.opponentName}`,
          });
          setLocation(`/game/play/${message.gameId}`);
          break;

        case 'player_joined':
          // Game-specific message, will be handled by game component
          break;

        case 'opponent_move':
          // Game-specific message, will be handled by game component
          break;

        case 'game_state_update':
          // Game-specific message, will be handled by game component
          break;

        case 'rematch_request':
          toast({
            title: '🔁 Rematch Requested!',
            description: `${message.fromPlayerName || 'Your opponent'} wants a rematch! Check the game to respond.`,
            duration: 20000,
          });
          break;

        case 'rematch_declined':
          toast({
            title: '❌ Rematch Declined',
            description: 'Your opponent declined the rematch.',
            variant: 'destructive',
            duration: 6000,
          });
          break;

        case 'rematch_accepted':
          // Navigation handled by GamePlayNew via lastMessage
          break;

        default:
          console.log('Unhandled message type:', message.type);
      }
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [user?.id, toast, setLocation]);

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage, socket: wsRef.current }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}
