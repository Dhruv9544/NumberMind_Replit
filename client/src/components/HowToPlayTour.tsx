/**
 * HowToPlayTour
 *
 * A two-layer onboarding system:
 *   1. Slide-modal  – shown automatically for first-time users (localStorage gate).
 *                     Can be replayed via resetTour() + forceShow prop.
 *   2. Joyride tour – optional DOM-spotlight walkthrough, triggered by the
 *                     "Take a Quick Tour" button on the last slide.
 *
 * Exports:
 *   HowToPlayTour  – main component (place anywhere in the game tree)
 *   resetTour()    – call to clear localStorage so the tour re-appears
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Joyride,
  STATUS,
  EVENTS,
  type Step,
  type EventData,
  type TooltipRenderProps,
} from "react-joyride";
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
  BookOpen,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExampleBox } from "@/components/ExampleBox";

/* ─── constants ─────────────────────────────────────────── */
export const STORAGE_KEY = "numbermind_tour_seen_v2";

/* ─── Joyride steps ─────────────────────────────────────── */
const JOYRIDE_STEPS: Step[] = [
  {
    target: '[data-tour="secret-input"]',
    title: "🔒 Set Your Secret",
    content:
      "Pick any 4-digit number with ALL unique digits (no repeats). Your opponent will try to crack this!",
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: '[data-tour="numpad"]',
    title: "🎯 Enter Digits",
    content:
      "Tap the numpad or type on your keyboard to fill in the four slots. Backspace erases the last digit.",
    skipBeacon: true,
    placement: "top",
  },
  {
    target: '[data-tour="example-box"]',
    title: "💡 Read the Example",
    content:
      "This example shows exactly how feedback works. Dig = matching digits anywhere; Pos = right digit, right spot.",
    skipBeacon: true,
    placement: "top",
  },
  {
    target: '[data-tour="start-btn"]',
    title: "🚀 Start the Game",
    content:
      "Once your secret is set, hit this button to lock it in and start guessing your opponent's number!",
    skipBeacon: true,
    placement: "top",
  },
];

/* ─── slide definitions ─────────────────────────────────── */
const SLIDES = [
  {
    id: "welcome",
    icon: <Zap className="w-8 h-8 text-emerald-400" />,
    title: "Welcome to NumberMind!",
    subtitle: "A code-cracking deduction game",
    body: (
      <div className="space-y-4">
        <p className="text-neutral-300 text-sm leading-relaxed text-center max-w-xs mx-auto">
          Each player picks a{" "}
          <span className="text-emerald-400 font-bold">secret 4-digit number</span>{" "}
          with{" "}
          <span className="text-emerald-400 font-bold">all unique digits</span>.
          Take turns guessing each other's number using the hints — first to
          crack it wins! 🏆
        </p>
        <div className="grid grid-cols-3 gap-2 text-center mt-2">
          {[
            { icon: "🔒", label: "Set a secret" },
            { icon: "🎯", label: "Guess theirs" },
            { icon: "🏆", label: "Win!" },
          ].map((s) => (
            <div
              key={s.label}
              className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700 flex flex-col items-center gap-1"
            >
              <span className="text-2xl">{s.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "setup",
    icon: <Eye className="w-8 h-8 text-blue-400" />,
    title: "Set Your Secret Number",
    subtitle: "4 unique digits — keep it hidden!",
    body: (
      <div className="space-y-4 w-full">
        <p className="text-neutral-400 text-xs text-center">
          Choose any 4 digits — <strong className="text-white">no repeats allowed</strong>
        </p>
        <div className="flex justify-center gap-2">
          {["3", "7", "1", "9"].map((d, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12 * i, type: "spring" }}
              className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-neutral-800 border-2 border-emerald-500/50 flex items-center justify-center text-xl sm:text-2xl font-black text-emerald-400"
            >
              {d}
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-center">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            ✓ 3719 — Valid
          </div>
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            ✗ 1123 — Repeated!
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "dig",
    icon: <Hash className="w-8 h-8 text-yellow-400" />,
    title: "Feedback symbol for correct digit",
    subtitle: "How many digits are correct in your guess?",
    body: (
      <div className="space-y-3 w-full">
        <p className="text-neutral-400 text-xs text-center">
          <span className="text-yellow-400 font-bold">Dig</span> tells you how
          many digits in your guess also exist{" "}
          <em>In</em> opponent's secret number(includes Pos hits).
        </p>
        <ExampleBox
          secret="3719"
          guess="1456"
          pos={0}
          dig={1}
          highlightGuess={[0]}
          caption="1 appears in the secret → Dig = 1, Pos = 0"
        />
        <ExampleBox
          secret="3719"
          guess="3186"
          pos={1}
          dig={2}
          highlightGuess={[0, 1]}
          caption="3 and 1 are in the secret → Dig = 2, Pos = 1 (3 is also in right spot)"
        />
      </div>
    ),
  },
  {
    id: "pos",
    icon: <Target className="w-8 h-8 text-emerald-400" />,
    title: "Feedback symbol for correct position",
    subtitle: "Right digit, right spot",
    body: (
      <div className="space-y-3 w-full">
        <p className="text-neutral-400 text-xs text-center">
          <span className="text-emerald-400 font-bold">Pos</span> digit is correct and in the exact right position. Pos ≤ Dig always.
        </p>
        <ExampleBox
          secret="3719"
          guess="3486"
          pos={1}
          dig={1}
          highlightGuess={[0]}
          caption="3 is in position 1 exactly → Pos = 1, Dig = 1"
        />
        <ExampleBox
          secret="3719"
          guess="3150"
          pos={1}
          dig={2}
          highlightGuess={[0, 1]}
          caption="3 → right spot; 1 → in secret but wrong position → Pos=1, Dig=2"
        />
      </div>
    ),
  },
  {
    id: "example",
    icon: <BookOpen className="w-8 h-8 text-purple-400" />,
    title: "Full Example",
    subtitle: "Put it all together",
    body: (
      <div className="space-y-3 w-full">
        <p className="text-neutral-400 text-xs text-center">
          Secret is <strong className="text-white">1234</strong>. You guess{" "}
          <strong className="text-white">1243</strong>.
        </p>
        <ExampleBox
          secret="1234"
          guess="1243"
          pos={2}
          dig={4}
          highlightGuess={[0, 1, 2, 3]}
          caption="All 4 digits exist (Dig=4). But only 1 and 2 are in the correct spots (Pos=2)."
        />
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-yellow-200 leading-relaxed">
            <strong>Strategy:</strong> When Dig is high but Pos is low, you have
            the right digits — just in the wrong order. Shift them around!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "win",
    icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
    title: "How to Win",
    subtitle: "4 Pos = Game Over! 🏆",
    body: (
      <div className="space-y-3 w-full">
        <p className="text-neutral-400 text-xs text-center">
          Use each guess's Dig and Pos to eliminate possibilities. When you get{" "}
          <span className="text-emerald-400 font-bold">Pos = 4</span>, you've
          cracked the code!
        </p>
        <ExampleBox
          secret="3719"
          guess="3719"
          pos={4}
          dig={4}
          highlightGuess={[0, 1, 2, 3]}
          caption="All 4 digits in exact positions → Pos = 4 = WIN! 🏆"
          win
        />
        <div className="p-3 rounded-xl bg-neutral-800 border border-neutral-700 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            <strong>Pro tip:</strong> Track digits that gave you Dig but not Pos
            — they exist in the secret but are in the wrong position!
          </p>
        </div>
      </div>
    ),
  },
];

/* ─── Joyride custom tooltip ─────────────────────────────── */
function JoyrideTooltip({
  step,
  index,
  size,
  isLastStep,
  primaryProps,
  backProps,
  skipProps,
  tooltipProps,
}: any) {
  return (
    <div
      {...tooltipProps}
      className="bg-neutral-900 border border-neutral-700 rounded-2xl p-5 max-w-xs shadow-2xl shadow-black/60 text-white"
      style={{ fontFamily: "inherit" }}
    >
      {step.title && (
        <p className="font-black text-base mb-2">{step.title}</p>
      )}
      <p className="text-sm text-neutral-300 leading-relaxed">{step.content}</p>
      <div className="flex items-center justify-between mt-4 gap-2">
        <button
          {...skipProps}
          className="text-xs text-neutral-500 hover:text-neutral-300 underline transition-colors"
        >
          Skip tour
        </button>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-300 hover:bg-neutral-700 transition-colors"
            >
              Back
            </button>
          )}
          <button
            {...primaryProps}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white transition-colors"
          >
            {isLastStep ? "Done 🎉" : `Next (${index + 1}/${size})`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────── */
export interface HowToPlayTourProps {
  /** Force showing the slide-modal regardless of localStorage */
  forceShow?: boolean;
  /** Called when the modal is closed/completed */
  onClose?: () => void;
  /** Enable the Joyride DOM spotlight tour (requires data-tour attributes in DOM) */
  enableJoyride?: boolean;
}

export function HowToPlayTour({
  forceShow = false,
  onClose,
  enableJoyride = false,
}: HowToPlayTourProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [runJoyride, setRunJoyride] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (forceShow || !seen) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [forceShow]);

  const close = (startJoyride = false) => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    if (startJoyride && enableJoyride) setRunJoyride(true);
    onClose?.();
  };

  const next = () => {
    if (step < SLIDES.length - 1) setStep(step + 1);
    else close();
  };

  const prev = () => setStep(Math.max(0, step - 1));

  /* Joyride callback */
  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    if (
      status === STATUS.FINISHED ||
      status === STATUS.SKIPPED
    ) {
      setRunJoyride(false);
    }
  };

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <>
      {/* ── Joyride Spotlight Tour ── */}
      {enableJoyride && (
        <Joyride
          steps={JOYRIDE_STEPS}
          run={runJoyride}
          onEvent={handleJoyrideCallback}
          options={{
            continuous: true,
            showProgress: true,
            showSkipButton: true,
            tooltipComponent: JoyrideTooltip as any,
            zIndex: 10000,
            overlayColor: "rgba(0,0,0,0.65)",
          } as any}
        />
      )}

      {/* ── Slide Modal ── */}
      <AnimatePresence>
        {visible && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
              onClick={() => close()}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl shadow-black/60 flex flex-col max-h-[92svh] sm:max-h-none overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-neutral-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                      How to Play — {step + 1}/{SLIDES.length}
                    </span>
                  </div>
                  <button
                    onClick={() => close()}
                    className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
                    aria-label="Close tutorial"
                  >
                    <X className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 pt-3 sm:pt-4 px-6 shrink-0">
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      aria-label={`Go to step ${i + 1}`}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === step
                          ? "w-6 bg-emerald-500"
                          : "w-1.5 bg-neutral-700 hover:bg-neutral-600"
                      )}
                    />
                  ))}
                </div>

                {/* Slide content */}
                <div className="px-4 sm:px-6 pb-4 pt-3 sm:pt-4 flex-1 flex flex-col overflow-y-auto overscroll-contain sm:min-h-[340px] sm:max-h-[60vh]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slide.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col items-center gap-4 flex-1"
                    >
                      {/* Icon */}
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                        {slide.icon}
                      </div>

                      {/* Title */}
                      <div className="text-center shrink-0">
                        <h2 className="text-base sm:text-xl font-black tracking-tight leading-tight">
                          {slide.title}
                        </h2>
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">
                          {slide.subtitle}
                        </p>
                      </div>

                      {/* Body */}
                      <div className="w-full">{slide.body}</div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer nav */}
                <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-2 flex flex-col gap-2 border-t border-neutral-800/50 shrink-0">
                  <div className="flex gap-3">
                    {step > 0 ? (
                      <Button
                        variant="outline"
                        onClick={prev}
                        className="flex-1 border-neutral-700 bg-transparent hover:bg-neutral-800 h-10 sm:h-12"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => close()}
                        className="flex-1 border-neutral-700 bg-transparent hover:bg-neutral-800 h-10 sm:h-12 text-neutral-500"
                      >
                        Skip
                      </Button>
                    )}

                    <Button
                      onClick={next}
                      className={cn(
                        "flex-[2] h-10 sm:h-12 font-black uppercase tracking-wider",
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

                  {/* Take Joyride tour link — only on last slide when enabled */}
                  {isLast && enableJoyride && (
                    <button
                      onClick={() => close(true)}
                      className="flex items-center justify-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-400 transition-colors py-1"
                    >
                      <Play className="w-3 h-3" />
                      Take a quick interactive tour instead
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/** Call this to reset the tour so it shows again */
export function resetTour() {
  localStorage.removeItem(STORAGE_KEY);
}
