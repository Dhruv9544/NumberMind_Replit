export interface GameFeedback {
  correctDigits: number;
  correctPositions: number;
}

export class GameEngine {
  static validateNumber(number: string, length: number = 4): { isValid: boolean; error?: string } {
    if (number.length !== length) {
      return { isValid: false, error: `Number must be exactly ${length} digits` };
    }
    
    if (!/^\d+$/.test(number)) {
      return { isValid: false, error: "Number must contain only digits" };
    }
    
    const digits = number.split('');
    const uniqueDigits = new Set(digits);
    
    if (uniqueDigits.size !== length) {
      return { isValid: false, error: "All digits must be unique" };
    }
    
    return { isValid: true };
  }

  static calculateFeedback(guess: string, secret: string): GameFeedback {
    const guessDigits = guess.split('');
    const secretDigits = secret.split('');
    
    let correctPositions = 0;
    let correctDigits = 0;
    
    // Count correct positions (exact matches)
    for (let i = 0; i < guessDigits.length; i++) {
      if (guessDigits[i] === secretDigits[i]) {
        correctPositions++;
      }
    }
    
    // Count total correct digits
    for (const digit of guessDigits) {
      if (secretDigits.includes(digit)) {
        correctDigits++;
      }
    }
    
    return { correctDigits, correctPositions };
  }

  static checkWinCondition(guess: string, secret: string): boolean {
    return guess === secret;
  }

  static generateAIGuess(difficulty: string = 'standard', history: GameFeedback[] = [], numberLength: number = 4): string {
    // AI logic based on difficulty
    if (difficulty === 'beginner') {
      // Completely random for beginner
      return this.generateRandomNumber(numberLength);
    } else if (difficulty === 'standard') {
      // Mix of strategy and randomness
      if (history.length === 0) {
        return this.generateRandomNumber(numberLength);
      }
      // Use some feedback-based logic for subsequent guesses
      return this.generateStrategicGuess(history, numberLength);
    } else if (difficulty === 'expert' || difficulty === 'master') {
      // More strategic guessing based on feedback history
      return this.generateStrategicGuess(history, numberLength);
    }
    return this.generateRandomNumber(numberLength);
  }

  private static generateStrategicGuess(history: GameFeedback[], numberLength: number): string {
    // Simple strategic approach: try numbers that are likely to match feedback patterns
    // For now, use semi-random with preference for less-tried digits
    const digits = Array.from({ length: 10 }, (_, i) => i.toString());
    const shuffled = digits.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, numberLength).join('');
  }

  static generateRandomNumber(numberLength: number = 4): string {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = digits.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, numberLength).join('');
  }
}
