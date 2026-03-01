import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Target,
  Hash,
  ArrowRight,
  ArrowLeft,
  X,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Zap,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "numbermind_tour_seen";

/* ─── slide definitions ─────────────────────────────────── */
const SLIDES = [
  {
    id: "welcome",
    icon: <Zap className="w-8 h-8 text-emerald-400" />,
    title: "Welcome to NumberMind!",
    subtitle: "A code-cracking deduction game",
    body: (
      <p className="text-neutral-300 text-sm leading-relaxed text-center max-w-xs mx-auto">
        Each player picks a <span className="text-emerald-400 font-bold">secret 4-digit number</span> with{" "}
        <span className="text-emerald-400 font-bold">all unique digits</span>. Take turns guessing your
        opponent's number using the feedback clues - first to crack it wins! 🏆
      </p>
    ),
  },
  {
    id: "setup",
    icon: <Eye className="w-8 h-8 text-blue-400" />,
    title: "Set Your Secret Number",
    subtitle: "Choose wisely - it must be unique",
    body: (
      <div className="space-y-3 w-full">
        <p className="text-neutral-400 text-xs text-center">Enter a 4-digit number with all different digits</p>
        <div className="flex justify-center gap-2">
          {["3", "7", "1", "9"].map((d, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 * i, type: "spring" }}
              className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-neutral-800 border-2 border-emerald-500/50 flex items-center justify-center text-xl sm:text-2xl font-black text-emerald-400"
            >
              {d}
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-center">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            ✓ 3719 - Valid
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            ✗ 1123 - Repeated digits!
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "dig",
    icon: <Hash className="w-8 h-8 text-yellow-400" />,
    title: "Dig - Common Digits",
    subtitle: "How many digits are shared?",
    body: (
      <div className="space-y-4 w-full">
        <p className="text-neutral-400 text-xs text-center">
          <span className="text-yellow-400 font-bold">Dig</span> counts how many digits in your guess also
          exist <em>anywhere</em> in the secret (includes Pos hits).
        </p>
        <LiveExample
          secret="3719"
          guess="1456"
          label="1 is in the secret → Dig = 1"
          digColor="yellow"
          posValue={0}
          digValue={1}
          highlight={{ guess: [0], secret: [2] }}
        />
        <LiveExample
          secret="3719"
          guess="3186"
          label="3 and 1 are in the secret → Dig = 2"
          digColor="yellow"
          posValue={1}
          digValue={2}
          highlight={{ guess: [0, 2], secret: [0, 2] }}
        />
      </div>
    ),
  },
  {
    id: "pos",
    icon: <Target className="w-8 h-8 text-emerald-400" />,
    title: "Pos - Exact Position",
    subtitle: "Right digit, right spot",
    body: (
      <div className="space-y-4 w-full">
        <p className="text-neutral-400 text-xs text-center">
          <span className="text-emerald-400 font-bold">Pos</span> counts digits that are both correct AND in
          the exact right position. Pos ≤ Dig always.
        </p>
        <LiveExample
          secret="3719"
          guess="3486"
          label="3 is in pos 1 exactly → Pos=1, Dig=1"
          digColor="emerald"
          posValue={1}
          digValue={1}
          highlight={{ guess: [0], secret: [0] }}
        />
        <LiveExample
          secret="3719"
          guess="3150"
          label="3→right, 1→present but wrong spot → Pos=1, Dig=2"
          digColor="yellow"
          posValue={1}
          digValue={2}
          highlight={{ guess: [0, 2], secret: [0, 2] }}
        />
      </div>
    ),
  },
  {
    id: "win",
    icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
    title: "How to Win",
    subtitle: "4 Pos = Game Over!",
    body: (
      <div className="space-y-4 w-full">
        <p className="text-neutral-400 text-xs text-center">
          Use each guess's Dig and Pos to eliminate possibilities. When you get{" "}
          <span className="text-emerald-400 font-bold">Pos = 4</span>, you've cracked the code!
        </p>
        <LiveExample
          secret="3719"
          guess="3719"
          label="All 4 in exact positions → Pos = 4 = WIN! 🏆"
          digColor="emerald"
          posValue={4}
          digValue={4}
          highlight={{ guess: [0, 1, 2, 3], secret: [0, 1, 2, 3] }}
          win
        />
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-yellow-200 leading-relaxed">
            <strong>Tip:</strong> Track which digits gave you Dig but not Pos - they exist in the secret but
            are in the wrong position!
          </p>
        </div>
      </div>
    ),
  },
];

/* ─── helper component for live example rows ─────────────── */
function LiveExample({
  secret,
  guess,
  label,
  posValue,
  digValue,
  highlight,
  win,
  digColor,
}: {
  secret: string;
  guess: string;
  label: string;
  posValue: number;
  digValue: number;
  highlight: { guess: number[]; secret: number[] };
  win?: boolean;
  digColor: "yellow" | "emerald";
}) {
  return (
    <div className={cn("p-3 rounded-xl border space-y-2", win ? "bg-emerald-500/10 border-emerald-500/30" : "bg-neutral-900/60 border-neutral-800")}>
      <div className="flex items-center justify-between gap-2">
        {/* guess digits */}
        <div className="flex gap-1">
          {guess.split("").map((d, i) => (
            <div
              key={i}
              className={cn(
                "w-7 h-8 sm:w-8 sm:h-9 rounded-lg flex items-center justify-center text-sm font-black border transition-all",
                highlight.guess.includes(i)
                  ? digColor === "emerald"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                  : "bg-neutral-800 border-neutral-700 text-neutral-400"
              )}
            >
              {d}
            </div>
          ))}
        </div>
        {/* badges */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-1.5 py-1">
            <Target className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-black text-emerald-400 tabular-nums">{posValue}</span>
          </div>
          <div className="flex items-center gap-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-1.5 py-1">
            <Hash className="w-3 h-3 text-yellow-400 shrink-0" />
            <span className="text-[11px] font-black text-yellow-400 tabular-nums">{digValue}</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">{label}</p>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────── */
interface HowToPlayTourProps {
  /** Force showing the tour regardless of localStorage */
  forceShow?: boolean;
  /** Called when the tour is closed/completed */
  onClose?: () => void;
}

export function HowToPlayTour({ forceShow = false, onClose }: HowToPlayTourProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (forceShow || !seen) {
      // Small delay so the game UI renders first
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [forceShow]);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    onClose?.();
  };

  const next = () => {
    if (step < SLIDES.length - 1) setStep(step + 1);
    else close();
  };

  const prev = () => setStep(Math.max(0, step - 1));

  if (!visible) return null;

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
            onClick={close}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <div className="w-full sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl shadow-black/60 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    How to Play - Step {step + 1}/{SLIDES.length}
                  </span>
                </div>
                <button
                  onClick={close}
                  className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 pt-4 px-6">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === step ? "w-6 bg-emerald-500" : "w-1.5 bg-neutral-700 hover:bg-neutral-600"
                    )}
                  />
                ))}
              </div>

              {/* Slide content */}
              <div className="px-6 pb-6 pt-4 min-h-[340px] flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center gap-4 flex-1"
                  >
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                      {slide.icon}
                    </div>

                    {/* Title */}
                    <div className="text-center">
                      <h2 className="text-xl font-black tracking-tight">{slide.title}</h2>
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        {slide.subtitle}
                      </p>
                    </div>

                    {/* Body */}
                    <div className="w-full flex-1">{slide.body}</div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer nav */}
              <div className="px-6 pb-6 flex gap-3">
                {step > 0 ? (
                  <Button
                    variant="outline"
                    onClick={prev}
                    className="flex-1 border-neutral-700 bg-transparent hover:bg-neutral-800 h-12"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={close}
                    className="flex-1 border-neutral-700 bg-transparent hover:bg-neutral-800 h-12 text-neutral-500"
                  >
                    Skip Tour
                  </Button>
                )}
                <Button
                  onClick={next}
                  className={cn(
                    "flex-[2] h-12 font-black uppercase tracking-wider",
                    isLast
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white"
                  )}
                >
                  {isLast ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Let's Play!
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Call this to reset the tour so it shows again (for testing/replay help button) */
export function resetTour() {
  localStorage.removeItem(STORAGE_KEY);
}
