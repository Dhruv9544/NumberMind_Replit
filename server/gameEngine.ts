export interface GameFeedback {
  correctDigits: number;
  correctPositions: number;
}

export class GameEngine {
  static validateNumber(number: string): { isValid: boolean; error?: string } {
    if (number.length !== 4) {
      return { isValid: false, error: "Number must be exactly 4 digits" };
    }
    
    if (!/^\d{4}$/.test(number)) {
      return { isValid: false, error: "Number must contain only digits" };
    }
    
    const digits = number.split('');
    const uniqueDigits = new Set(digits);
    
    if (uniqueDigits.size !== 4) {
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
    for (let i = 0; i < 4; i++) {
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

  static generateAIGuess(difficulty: string, history: GameFeedback[] = []): string {
    // Simple AI that generates random valid numbers
    // In a more sophisticated implementation, this would use the feedback history
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = digits.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4).join('');
  }

  static generateRandomNumber(): string {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = digits.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4).join('');
  }
}
