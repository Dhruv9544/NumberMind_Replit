import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NumberSlotProps {
  value: string;
  isActive?: boolean;
  onClick?: () => void;
  dataTestId?: string;
}

export function NumberSlot({ value, isActive, onClick, dataTestId }: NumberSlotProps) {
  return (
    <div
      className={cn(
        "w-14 h-14 bg-card border-2 rounded-lg flex items-center justify-center text-2xl font-bold transition-all duration-200 cursor-pointer hover:border-primary",
        isActive && "border-primary glow-effect",
        !isActive && "border-border"
      )}
      onClick={onClick}
      data-testid={dataTestId}
    >
      <span className={cn(value === "_" && "text-muted-foreground")}>
        {value || "_"}
      </span>
    </div>
  );
}

interface NumberPadProps {
  onDigitClick: (digit: number) => void;
  onClear: () => void;
  onSubmit?: () => void;
  onRandom?: () => void;
  submitLabel?: string;
  showSubmit?: boolean;
  showRandom?: boolean;
  disabledDigits?: number[];
}

export function NumberPad({
  onDigitClick,
  onClear,
  onSubmit,
  onRandom,
  submitLabel = "Submit",
  showSubmit = false,
  showRandom = false,
  disabledDigits = [],
}: NumberPadProps) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
      {digits.slice(0, 9).map((digit) => (
        <Button
          key={digit}
          variant="secondary"
          size="sm"
          className="h-12 font-semibold"
          onClick={() => onDigitClick(digit)}
          disabled={disabledDigits.includes(digit)}
          data-testid={`digit-${digit}`}
        >
          {digit}
        </Button>
      ))}
      
      <Button
        variant="destructive"
        size="sm"
        className="h-12 font-semibold"
        onClick={onClear}
        data-testid="button-clear"
      >
        <i className="fas fa-backspace"></i>
      </Button>
      
      <Button
        variant="secondary"
        size="sm"
        className="h-12 font-semibold col-start-2"
        onClick={() => onDigitClick(0)}
        disabled={disabledDigits.includes(0)}
        data-testid="digit-0"
      >
        0
      </Button>
      
      {showRandom && (
        <Button
          variant="outline"
          size="sm"
          className="h-12 font-semibold col-span-2 bg-accent hover:bg-accent/90 text-accent-foreground"
          onClick={onRandom}
          data-testid="button-random"
        >
          Random
        </Button>
      )}
      
      {showSubmit && (
        <Button
          variant="default"
          size="sm"
          className={cn(
            "h-12 font-semibold",
            showRandom ? "col-span-3" : "col-span-3 col-start-2"
          )}
          onClick={onSubmit}
          data-testid="button-submit-guess"
        >
          {submitLabel}
        </Button>
      )}
    </div>
  );
}

interface GameHistoryProps {
  moves: Array<{
    guess: string;
    correctDigits: number;
    correctPositions: number;
  }>;
}

export function GameHistory({ moves }: GameHistoryProps) {
  return (
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {moves.map((move, index) => (
        <Card key={index} className="slide-in" data-testid={`history-move-${index}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {move.guess.split('').map((digit, digitIndex) => (
                  <span
                    key={digitIndex}
                    className="w-8 h-8 bg-secondary rounded border text-center leading-8 font-bold"
                    data-testid={`history-digit-${index}-${digitIndex}`}
                  >
                    {digit}
                  </span>
                ))}
              </div>
              <div className="flex space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-chart-3 rounded-full"></div>
                  <span data-testid={`correct-digits-${index}`}>{move.correctDigits}</span>
                  <span className="text-muted-foreground">digits</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <span data-testid={`correct-positions-${index}`}>{move.correctPositions}</span>
                  <span className="text-muted-foreground">positions</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface PlayerInfoProps {
  name: string;
  avatar: string;
  streak: number;
  isActive?: boolean;
}

export function PlayerInfo({ name, avatar, streak, isActive }: PlayerInfoProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all",
        isActive ? "bg-gradient-to-br from-primary to-accent ring-2 ring-primary" : "bg-gradient-to-br from-muted to-secondary"
      )}>
        <span data-testid="player-avatar">{avatar}</span>
      </div>
      <div>
        <div className="font-semibold text-sm" data-testid="player-name">{name}</div>
        <div className="text-xs text-muted-foreground flex items-center">
          <span className="text-chart-3">🔥</span>
          <span data-testid="player-streak">{streak}</span>
        </div>
      </div>
    </div>
  );
}

interface GameStatusProps {
  status: string;
  currentPlayer?: string;
  turnNumber?: number;
}

export function GameStatus({ status, currentPlayer, turnNumber }: GameStatusProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-accent rounded-full pulse-animation"></div>
          <span className="font-semibold" data-testid="game-status">{status}</span>
          {turnNumber && (
            <div className="text-sm text-muted-foreground">
              - Turn <span data-testid="turn-number">{turnNumber}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function useNumberInput(maxLength: number = 4) {
  const [digits, setDigits] = useState<string[]>(new Array(maxLength).fill(''));
  const [currentSlot, setCurrentSlot] = useState(0);

  const inputDigit = (digit: number) => {
    const digitStr = digit.toString();
    
    // Check if digit is already used
    if (digits.includes(digitStr)) {
      return false;
    }

    if (currentSlot < maxLength) {
      const newDigits = [...digits];
      newDigits[currentSlot] = digitStr;
      setDigits(newDigits);
      
      if (currentSlot < maxLength - 1) {
        setCurrentSlot(currentSlot + 1);
      }
      return true;
    }
    return false;
  };

  const clearInput = () => {
    if (currentSlot > 0) {
      const newSlot = currentSlot - 1;
      const newDigits = [...digits];
      newDigits[newSlot] = '';
      setDigits(newDigits);
      setCurrentSlot(newSlot);
    }
  };

  const randomNumber = () => {
    const availableDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = availableDigits.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, maxLength).map(d => d.toString());
    setDigits(selected);
    setCurrentSlot(maxLength);
  };

  const getValue = () => digits.join('');
  
  const isComplete = () => digits.every(d => d !== '') && new Set(digits).size === maxLength;
  
  const reset = () => {
    setDigits(new Array(maxLength).fill(''));
    setCurrentSlot(0);
  };

  const focusSlot = (index: number) => {
    if (index >= 0 && index < maxLength) {
      setCurrentSlot(index);
    }
  };

  return {
    digits,
    currentSlot,
    inputDigit,
    clearInput,
    randomNumber,
    getValue,
    isComplete,
    reset,
    focusSlot,
  };
}
