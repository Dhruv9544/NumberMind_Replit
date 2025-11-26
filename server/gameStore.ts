// In-memory game store for reliable persistence during development
interface StoredGame {
  id: string;
  player1Id: string;
  player2Id?: string;
  player1Secret?: string;
  player2Secret?: string;
  gameMode: string;
  difficulty: string;
  status: 'waiting' | 'active' | 'finished';
  currentTurn?: string;
  winnerId?: string;
  moves: StoredMove[];
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

interface StoredMove {
  id: string;
  gameId: string;
  playerId: string;
  guess: string;
  correctDigits: number;
  correctPositions: number;
  moveNumber: number;
  createdAt: Date;
}

class GameStore {
  private games = new Map<string, StoredGame>();
  private userStats = new Map<string, any>();

  createGame(game: Omit<StoredGame, 'id' | 'createdAt' | 'moves'>): StoredGame {
    const id = 'game-' + Math.random().toString(36).substr(2, 9);
    const storedGame: StoredGame = {
      ...game,
      id,
      moves: [],
      createdAt: new Date(),
    };
    this.games.set(id, storedGame);
    return storedGame;
  }

  getGame(id: string): StoredGame | undefined {
    return this.games.get(id);
  }

  updateGame(id: string, updates: Partial<StoredGame>): StoredGame {
    const game = this.games.get(id);
    if (!game) throw new Error('Game not found');
    const updated = { ...game, ...updates };
    this.games.set(id, updated);
    return updated;
  }

  addMove(gameId: string, move: Omit<StoredMove, 'id' | 'createdAt'>): StoredMove {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');
    
    const storedMove: StoredMove = {
      ...move,
      id: 'move-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    game.moves.push(storedMove);
    return storedMove;
  }

  getMoves(gameId: string): StoredMove[] {
    const game = this.games.get(gameId);
    return game?.moves || [];
  }

  getAllGames(): StoredGame[] {
    return Array.from(this.games.values());
  }

  getUserGames(userId: string): StoredGame[] {
    return Array.from(this.games.values()).filter(
      g => g.player1Id === userId || g.player2Id === userId
    );
  }
}

export const gameStore = new GameStore();
