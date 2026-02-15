import { useEffect, useState } from 'react';
import { useWebSocketContext } from '@/context/WebSocketContext';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(gameId?: string, userId?: string) {
  const { isConnected, lastMessage: globalLastMessage, sendMessage: globalSendMessage } = useWebSocketContext();
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    if (!gameId || !userId || !isConnected) return;

    // Join this specific game room
    globalSendMessage({
      type: 'join_game',
      gameId,
      userId,
    });
  }, [gameId, userId, isConnected, globalSendMessage]);

  // Filter messages for this specific game
  useEffect(() => {
    if (globalLastMessage && gameId) {
      // Only forward game-specific messages
      if (
        globalLastMessage.type === 'player_joined' ||
        globalLastMessage.type === 'opponent_move' ||
        globalLastMessage.type === 'game_state_update'
      ) {
        setLastMessage(globalLastMessage);
      }
    }
  }, [globalLastMessage, gameId]);

  const sendMessage = (message: WebSocketMessage) => {
    globalSendMessage(message);
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}
