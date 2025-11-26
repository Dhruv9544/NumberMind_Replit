// In-memory game store with challenge management
interface StoredGame {
  id: string;
  code: string;
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

interface StoredChallenge {
  id: string;
  gameId: string;
  fromPlayerId: string;
  toPlayerId: string;
  fromPlayerName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

class GameStore {
  private games = new Map<string, StoredGame>();
  private challenges = new Map<string, StoredChallenge>();
  private userStats = new Map<string, any>();

  generateGameCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  createGame(game: Omit<StoredGame, 'id' | 'code' | 'createdAt' | 'moves'>): StoredGame {
    const id = 'game-' + Math.random().toString(36).substr(2, 9);
    const storedGame: StoredGame = {
      ...game,
      id,
      code: this.generateGameCode(),
      moves: [],
      createdAt: new Date(),
    };
    this.games.set(id, storedGame);
    return storedGame;
  }

  getGame(id: string): StoredGame | undefined {
    return this.games.get(id);
  }

  getGameByCode(code: string): StoredGame | undefined {
    return Array.from(this.games.values()).find(g => g.code === code);
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

  createChallenge(challenge: Omit<StoredChallenge, 'id' | 'createdAt' | 'expiresAt'>): StoredChallenge {
    const id = 'challenge-' + Math.random().toString(36).substr(2, 9);
    const now = new Date();
    const storedChallenge: StoredChallenge = {
      ...challenge,
      id,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes
    };
    this.challenges.set(id, storedChallenge);
    return storedChallenge;
  }

  getChallenge(id: string): StoredChallenge | undefined {
    return this.challenges.get(id);
  }

  updateChallenge(id: string, updates: Partial<StoredChallenge>): StoredChallenge {
    const challenge = this.challenges.get(id);
    if (!challenge) throw new Error('Challenge not found');
    const updated = { ...challenge, ...updates };
    this.challenges.set(id, updated);
    return updated;
  }

  getPendingChallengesForUser(userId: string): StoredChallenge[] {
    return Array.from(this.challenges.values()).filter(
      c => c.toPlayerId === userId && c.status === 'pending' && c.expiresAt > new Date()
    );
  }

  getChallengesByGame(gameId: string): StoredChallenge[] {
    return Array.from(this.challenges.values()).filter(c => c.gameId === gameId);
  }

  getAllGames(): StoredGame[] {
    return Array.from(this.games.values());
  }

  getUserGames(userId: string): StoredGame[] {
    return Array.from(this.games.values()).filter(
      g => g.player1Id === userId || g.player2Id === userId
    );
  }

  expireOldChallenges(): void {
    const now = new Date();
    this.challenges.forEach((challenge, id) => {
      if (challenge.expiresAt < now && challenge.status === 'pending') {
        challenge.status = 'expired';
        this.challenges.set(id, challenge);
      }
    });
  }
}

export const gameStore = new GameStore();

// Clean up expired challenges every minute
setInterval(() => {
  gameStore.expireOldChallenges();
}, 60000);
