/**
 * PracticeMode — inline mini Bulls & Cows demo.
 *
 * Lets the user make one guess against a fixed hidden 2-digit number
 * (easier than the real 4-digit game) so they can feel the feedback
 * system before committing to a real match.
 *
 * Props:
 *   onDone  – called when the user dismisses / finishes the practice round
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Target, Hash, CheckCircle2, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── simple Bulls & Cows engine for 2-digit demo ─────── */
function calcFeedback(secret: string, guess: string) {
  let pos = 0;
  let dig = 0;
  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) pos++;
    else if (secret.includes(guess[i])) dig++;
  }
  return { pos, dig: pos + dig }; // dig = total matching (pos + elsewhere)
}

const PRACTICE_SECRET = "52";
const VALID_DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

interface PracticeModeProps {
  onDone: () => void;
}

interface Attempt {
  guess: string;
  pos: number;
  dig: number;
}

export function PracticeMode({ onDone }: PracticeModeProps) {
  const [input, setInput] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [won, setWon] = useState(false);

  const addDigit = (d: string) => {
    if (input.length >= 2) return;
    // prevent repeats
    if (input.includes(d)) return;
    setInput([...input, d]);
  };

  const erase = () => setInput(input.slice(0, -1));

  const submit = () => {
    if (input.length < 2) return;
    const guess = input.join("");
    const { pos, dig } = calcFeedback(PRACTICE_SECRET, guess);
    const attempt: Attempt = { guess, pos, dig };
    setAttempts([...attempts, attempt]);
    setInput([]);
    if (pos === 2) setWon(true);
  };

  const reset = () => {
    setInput([]);
    setAttempts([]);
    setWon(false);
  };

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-purple-500/10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">
            🎮 Practice Round
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            Guess the hidden <strong className="text-white">2-digit number</strong> to feel the feedback system!
          </p>
        </div>
        <button
          onClick={onDone}
          className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors shrink-0"
          aria-label="Close practice"
        >
          <X className="w-3 h-3 text-neutral-500" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Input slots */}
        <div className="flex justify-center gap-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={cn(
                "w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-black border-2 transition-all",
                input[i]
                  ? "bg-neutral-800 border-purple-500/50 text-purple-300"
                  : "bg-neutral-900 border-dashed border-neutral-700 text-neutral-700"
              )}
            >
              {input[i] || "·"}
            </div>
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-5 gap-1.5 max-w-[200px] mx-auto">
          {VALID_DIGITS.map((n) => (
            <button
              key={n}
              onClick={() => addDigit(n)}
              disabled={won}
              className={cn(
                "h-9 rounded-lg border font-bold text-sm transition-all active:scale-90",
                input.includes(n)
                  ? "bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed"
                  : "bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:border-purple-500/40"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 max-w-[200px] mx-auto">
          <Button
            variant="outline"
            onClick={erase}
            disabled={input.length === 0 || won}
            className="flex-1 h-9 border-neutral-800 text-neutral-500 hover:text-white rounded-xl text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Erase
          </Button>
          <Button
            onClick={submit}
            disabled={input.length < 2 || won}
            className="flex-[2] h-9 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs"
          >
            Guess!
          </Button>
        </div>

        {/* Attempt history */}
        <AnimatePresence>
          {attempts.map((a, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border",
                a.pos === 2
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-neutral-900/60 border-neutral-800"
              )}
            >
              {/* Guess digits */}
              <div className="flex gap-1.5">
                {a.guess.split("").map((d, i) => (
                  <div
                    key={i}
                    className="w-8 h-9 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-black text-sm text-neutral-200"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="flex-1" />
              {/* Badges */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-1.5 py-1">
                  <Target className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] font-black text-emerald-400">{a.pos}</span>
                </div>
                <div className="flex items-center gap-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-1.5 py-1">
                  <Hash className="w-3 h-3 text-yellow-400" />
                  <span className="text-[11px] font-black text-yellow-400">{a.dig}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Win state */}
        <AnimatePresence>
          {won && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div>
                <p className="font-black text-emerald-400">You cracked it! 🎉</p>
                <p className="text-xs text-neutral-400 mt-1">
                  The secret was <strong className="text-white">{PRACTICE_SECRET}</strong>.
                  You're ready for the real game!
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={reset}
                  className="flex-1 border-neutral-700 text-neutral-400 hover:bg-neutral-800 rounded-xl text-xs h-9"
                >
                  Try again
                </Button>
                <Button
                  onClick={onDone}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs h-9"
                >
                  Start Real Game →
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not-won hint */}
        {!won && attempts.length > 0 && (
          <p className="text-[10px] text-center text-neutral-600">
            Secret is a 2-digit number with unique digits 1–9.{" "}
            <button
              onClick={reset}
              className="text-purple-500 underline hover:text-purple-400"
            >
              Reset
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
