/**
 * ExampleBox — standalone visual example card.
 *
 * Shows a secret / guess pair with Dig + Pos results
 * highlighted interactively. Used on the Setup page and
 * in the How-to-Play tour.
 */

import { Target, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExampleBoxProps {
  secret: string;
  guess: string;
  pos: number;
  dig: number;
  /** Indices in the guess row to highlight */
  highlightGuess?: number[];
  /** Optional caption / footnote text */
  caption?: string;
  /** Toggle the "win" gold border accent */
  win?: boolean;
  className?: string;
}

export function ExampleBox({
  secret,
  guess,
  pos,
  dig,
  highlightGuess = [],
  caption,
  win = false,
  className,
}: ExampleBoxProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 space-y-3 text-sm",
        win
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-neutral-900/70 border-neutral-800",
        className
      )}
    >
      {/* Secret row */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 w-14 shrink-0">
          Secret
        </span>
        <div className="flex gap-1.5">
          {secret.split("").map((d, i) => (
            <div
              key={i}
              className="w-8 h-9 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-black text-sm text-neutral-500"
            >
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-800" />

      {/* Guess row */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 w-14 shrink-0">
          Guess
        </span>
        <div className="flex gap-1.5 flex-1">
          {guess.split("").map((d, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-9 rounded-lg flex items-center justify-center font-black text-sm border transition-all",
                highlightGuess.includes(i)
                  ? pos > 0 && highlightGuess.every((hi) => hi < pos)
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                    : "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                  : "bg-neutral-800 border-neutral-700 text-neutral-300"
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Pos + Dig badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2 py-1.5">
              <Target className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-[13px] font-black text-emerald-400 tabular-nums">
                {pos}
              </span>
            </div>
            <span className="text-[8px] font-black uppercase text-neutral-600">
              Pos
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-0.5 bg-yellow-500/10 border border-yellow-500/25 rounded-lg px-2 py-1.5">
              <Hash className="w-3 h-3 text-yellow-400 shrink-0" />
              <span className="text-[13px] font-black text-yellow-400 tabular-nums">
                {dig}
              </span>
            </div>
            <span className="text-[8px] font-black uppercase text-neutral-600">
              Dig
            </span>
          </div>
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <p className="text-[11px] text-white-500 leading-relaxed pt-1 border-t border-neutral-800">
          {caption}
        </p>
      )}
    </div>
  );
}
