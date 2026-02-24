import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Gamepad2,
  Brain,
  Zap,
  Trophy,
  Users,
  Bot,
  Globe,
  ShieldCheck,
  Target,
  TrendingUp,
  Lightbulb,
  Swords,
  ChevronRight,
  ArrowRight,
  Hash,
  Eye,
  Lock,
  Star,
  Flame,
  CircleCheck,
  Timer,
  Layers,
  Github,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Animation helpers
// ─────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const directions = {
    up: { y: 32, x: 0 },
    down: { y: -32, x: 0 },
    left: { y: 0, x: 32 },
    right: { y: 0, x: -32 },
    none: { y: 0, x: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Section Wrapper
// ─────────────────────────────────────────────
function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("relative w-full px-4 sm:px-6 lg:px-8", className)}
    >
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────
function LandingNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-default">
            <div className="relative">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl rotate-3 group-hover:rotate-12 transition-transform duration-300 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <Gamepad2 className="w-5 h-5 text-neutral-950 -rotate-3 group-hover:-rotate-12 transition-transform duration-300" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-neutral-950 shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                <div className="w-full h-full rounded-full bg-cyan-400 animate-ping opacity-75" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black italic tracking-tighter uppercase text-white">
                Number<span className="text-emerald-400">Mind</span>
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
            <a
              href="#how-it-works"
              className="hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a href="#benefits" className="hover:text-white transition-colors">
              Benefits
            </a>
            <a
              href="#multiplayer"
              className="hover:text-white transition-colors"
            >
              Multiplayer
            </a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-400 hover:text-white hidden sm:flex"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
              >
                Play Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────
// 1. HERO SECTION
// ─────────────────────────────────────────────
function HeroSection() {
  return (
    <Section className="pt-24 pb-28 sm:pt-32 sm:pb-36 overflow-hidden">
      {/* Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center gap-8">
        {/* Top badge */}
        <FadeIn delay={0}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-700/60 text-xs font-bold uppercase tracking-wider text-emerald-400 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live Multiplayer · Brain Training · Free to Play
          </div>
        </FadeIn>

        {/* Headline */}
        <FadeIn delay={0.1}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] uppercase italic max-w-4xl">
            <span className="text-white">Crack the</span>
            <br />
            <span className="text-emerald-400 drop-shadow-[0_0_40px_rgba(52,211,153,0.4)]">
              Code.
            </span>{" "}
            <span className="text-white">Beat</span>
            <br />
            <span className="text-cyan-400 drop-shadow-[0_0_40px_rgba(34,211,238,0.3)]">
              the Mind.
            </span>
          </h1>
        </FadeIn>

        {/* Subheading */}
        <FadeIn delay={0.2}>
          <p className="text-neutral-400 text-lg sm:text-xl max-w-xl leading-relaxed font-medium">
            NumberMind is the ultimate{" "}
            <span className="text-white font-semibold">
              real-time strategic deduction game
            </span>
            . Choose your secret, decode your opponent's, and outsmart them
            before they crack yours.
          </p>
        </FadeIn>

        {/* CTAs */}
        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/auth">
              <Button
                size="lg"
                className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-wide text-base shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_50px_rgba(16,185,129,0.55)] transition-all duration-300 group"
              >
                <Play className="w-5 h-5 mr-2 fill-white group-hover:scale-110 transition-transform" />
                Start Playing Free
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 border-neutral-700 bg-transparent text-neutral-300 hover:bg-neutral-900 hover:text-white hover:border-neutral-500 font-semibold transition-all duration-300"
              >
                How It Works
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
          </div>
        </FadeIn>

        {/* Social proof */}
        <FadeIn delay={0.4}>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-xs text-neutral-500 font-medium">
            {[
              { icon: ShieldCheck, text: "No credit card needed" },
              { icon: Zap, text: "Instant — no download" },
              { icon: Users, text: "Real opponents, real time" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <item.icon className="w-3.5 h-3.5 text-emerald-500" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Hero Mock UI */}
        <FadeIn delay={0.5} className="w-full max-w-2xl mt-4">
          <HeroMockUI />
        </FadeIn>
      </div>
    </Section>
  );
}

function HeroMockUI() {
  const moves = [
    { guess: "1 2 3 4", digits: 3, positions: 1, you: true },
    { guess: "5 6 7 8", digits: 2, positions: 0, you: false },
    { guess: "2 4 6 1", digits: 3, positions: 2, you: true },
    { guess: "3 1 7 4", digits: 2, positions: 1, you: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="rounded-3xl border border-neutral-800 bg-neutral-900/80 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/60"
    >
      {/* Window bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-950/60">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Live Game
            </span>
          </div>
        </div>
        <Timer className="w-4 h-4 text-neutral-600" />
      </div>

      {/* Players Row */}
      <div className="grid grid-cols-2 divide-x divide-neutral-800">
        {[
          { name: "You", color: "text-emerald-400", icon: "🧠" },
          { name: "Opponent", color: "text-cyan-400", icon: "🤖" },
        ].map((p, i) => (
          <div key={i} className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm">
              {p.icon}
            </div>
            <div>
              <p className={cn("text-xs font-black uppercase", p.color)}>
                {p.name}
              </p>
              <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider">
                {i === 0 ? "4 guesses" : "4 guesses"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Moves */}
      <div className="p-4 space-y-2">
        {moves.map((move, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: move.you ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.15 }}
            className={cn(
              "flex items-center justify-between px-4 py-2.5 rounded-xl border",
              move.you
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-cyan-500/5 border-cyan-500/20"
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-wider",
                  move.you ? "text-emerald-500" : "text-cyan-500"
                )}
              >
                {move.you ? "YOU" : "OPP"}
              </span>
              <span className="font-mono text-sm font-bold text-white tracking-widest">
                {move.guess}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Target className="w-3 h-3 text-emerald-400" />
                <span className="text-xs font-black text-emerald-400">
                  {move.positions}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Hash className="w-3 h-3 text-yellow-400" />
                <span className="text-xs font-black text-yellow-400">
                  {move.digits}
                </span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Input row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="flex items-center gap-3 mt-3 px-4 py-3 rounded-xl border border-neutral-700/60 bg-neutral-800/40"
        >
          <div className="flex gap-2">
            {["?", "?", "?", "?"].map((d, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-black text-neutral-500"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="flex-1" />
          <div className="px-3 py-1.5 rounded-lg bg-emerald-600/80 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3" /> Guess
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// 2. HOW IT WORKS SECTION
// ─────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      icon: Lock,
      title: "Choose Your Secret",
      description:
        "Pick a 4-digit number with all unique digits. Your opponent will spend the whole game trying to crack it.",
      color: "emerald",
      detail: "E.g. 1, 3, 7, 9 — easy to set, hard to guess.",
    },
    {
      step: "02",
      icon: Target,
      title: "Guess Strategically",
      description:
        "Take turns making guesses. After each guess you'll see how many digits are correct and how many are in the right position.",
      color: "cyan",
      detail: "Green = right position. Yellow = right digit, wrong spot.",
    },
    {
      step: "03",
      icon: Trophy,
      title: "Outsmart & Win",
      description:
        "Use logic and deduction to narrow down the possibilities faster than your opponent. First to crack it wins.",
      color: "amber",
      detail: "Average games last 5–8 rounds. Can you do it in 3?",
    },
  ];

  const colorMap = {
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: "text-emerald-400",
      step: "text-emerald-500",
      glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]",
    },
    cyan: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      icon: "text-cyan-400",
      step: "text-cyan-500",
      glow: "group-hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      icon: "text-amber-400",
      step: "text-amber-500",
      glow: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]",
    },
  };

  return (
    <Section id="how-it-works" className="py-28">
      <FadeIn>
        <div className="text-center mb-16">
          <Badge
            variant="outline"
            className="border-neutral-700 text-neutral-400 mb-4 uppercase tracking-widest text-[10px] font-black"
          >
            Simple to Learn
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight uppercase italic text-white mb-4">
            How It <span className="text-emerald-400">Works</span>
          </h2>
          <p className="text-neutral-400 max-w-lg mx-auto text-base">
            Master the rules in 60 seconds. Spend a lifetime perfecting your strategy.
          </p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, i) => {
          const c = colorMap[step.color as keyof typeof colorMap];
          return (
            <FadeIn key={i} delay={i * 0.12} direction="up">
              <Card
                className={cn(
                  "group relative border-neutral-800 bg-neutral-900/60 backdrop-blur-sm rounded-3xl overflow-hidden hover:border-neutral-700 transition-all duration-300 h-full",
                  c.glow
                )}
              >
                <CardContent className="p-8 flex flex-col gap-5 h-full">
                  {/* Step number + icon */}
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center border",
                        c.bg,
                        c.border
                      )}
                    >
                      <step.icon className={cn("w-7 h-7", c.icon)} />
                    </div>
                    <span
                      className={cn(
                        "text-6xl font-black italic opacity-15 group-hover:opacity-30 transition-opacity",
                        c.step
                      )}
                    >
                      {step.step}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">
                      {step.title}
                    </h3>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                      {step.description}
                    </p>
                    <div
                      className={cn(
                        "px-3 py-2 rounded-xl text-[11px] font-bold text-neutral-400 border",
                        c.border,
                        c.bg
                      )}
                    >
                      💡 {step.detail}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          );
        })}
      </div>

      {/* Connector arrows for desktop */}
      <div className="hidden md:flex items-center justify-center gap-0 mt-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────
// 3. BENEFITS SECTION
// ─────────────────────────────────────────────
function BenefitsSection() {
  const benefits = [
    {
      icon: Brain,
      title: "Sharpen Logical Thinking",
      description:
        "Every guess is a structured experiment. You'll build and refine logical frameworks with each game.",
      color: "emerald",
    },
    {
      icon: Eye,
      title: "Train Pattern Recognition",
      description:
        "Learn to identify hidden patterns faster. Your brain will start connecting clues automatically.",
      color: "cyan",
    },
    {
      icon: Lightbulb,
      title: "Boost Problem-Solving",
      description:
        "Constrained by information, forced to be creative. NumberMind builds the exact skills elite problem-solvers use.",
      color: "amber",
    },
    {
      icon: TrendingUp,
      title: "Track Your Progress",
      description:
        "Detailed stats, win streaks, and leaderboard rankings show exactly how your skills sharpen over time.",
      color: "purple",
    },
    {
      icon: Swords,
      title: "Competitive Edge",
      description:
        "Real-time pvp means every game is unpredictable. Out-think real humans, not algorithms.",
      color: "rose",
    },
    {
      icon: Zap,
      title: "Fast & Addictive",
      description:
        "Games last 3–10 minutes. One more game is always just a click away — perfectly optimized for flow state.",
      color: "blue",
    },
  ];

  const colorMap: Record<string, { icon: string; bg: string; border: string }> = {
    emerald: {
      icon: "text-emerald-400",
      bg: "bg-emerald-500/8",
      border: "border-emerald-500/15",
    },
    cyan: {
      icon: "text-cyan-400",
      bg: "bg-cyan-500/8",
      border: "border-cyan-500/15",
    },
    amber: {
      icon: "text-amber-400",
      bg: "bg-amber-500/8",
      border: "border-amber-500/15",
    },
    purple: {
      icon: "text-purple-400",
      bg: "bg-purple-500/8",
      border: "border-purple-500/15",
    },
    rose: {
      icon: "text-rose-400",
      bg: "bg-rose-500/8",
      border: "border-rose-500/15",
    },
    blue: {
      icon: "text-blue-400",
      bg: "bg-blue-500/8",
      border: "border-blue-500/15",
    },
  };

  return (
    <Section
      id="benefits"
      className="py-28 bg-neutral-900/30 rounded-3xl"
    >
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/3 rounded-full blur-[100px]" />
      </div>

      <FadeIn>
        <div className="text-center mb-16 relative z-10">
          <Badge
            variant="outline"
            className="border-neutral-700 text-neutral-400 mb-4 uppercase tracking-widest text-[10px] font-black"
          >
            Why It Matters
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight uppercase italic text-white mb-4">
            Train Your <span className="text-cyan-400">Mind</span>
          </h2>
          <p className="text-neutral-400 max-w-lg mx-auto text-base">
            NumberMind isn't just a game — it's a cognitive workout disguised as something you can't stop playing.
          </p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
        {benefits.map((b, i) => {
          const c = colorMap[b.color];
          return (
            <FadeIn key={i} delay={i * 0.08}>
              <Card className="group border-neutral-800 bg-neutral-900/70 backdrop-blur-sm rounded-2xl hover:border-neutral-700 hover:-translate-y-1 transition-all duration-300 h-full">
                <CardContent className="p-6 flex flex-col gap-4 h-full">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center border",
                      c.bg,
                      c.border
                    )}
                  >
                    <b.icon className={cn("w-6 h-6", c.icon)} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase italic tracking-tight mb-1.5">
                      {b.title}
                    </h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          );
        })}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────
// 4. MULTIPLAYER SECTION
// ─────────────────────────────────────────────
function MultiplayerSection() {
  const modes = [
    {
      icon: Users,
      title: "Challenge Friends",
      description:
        "Send a direct challenge to a friend. Set your secret number and wait for them to accept — then battle it out in real time.",
      badge: "PvP",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      feature: ["Real-time turns", "Friend invite link", "Private match"],
    },
    {
      icon: Globe,
      title: "Random Matchmaking",
      description:
        "Jump into the global queue and get matched with a real opponent instantly. No waiting, no frills — pure competition.",
      badge: "Global",
      badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      feature: ["Instant match", "Skill-based queue", "Ranked games"],
    },
    {
      icon: Bot,
      title: "Practice vs AI",
      description:
        "Warm up against our AI opponent with adjustable difficulty. Perfect for learning strategies before going online.",
      badge: "Training",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      feature: [
        "3 difficulty levels",
        "Unlimited practice",
        "Instant feedback",
      ],
    },
  ];

  const leaderboardMock = [
    { rank: 1, name: "cipher_x", wins: 142, rate: "87%", streak: 12 },
    { rank: 2, name: "mindbreaker", wins: 128, rate: "83%", streak: 8 },
    { rank: 3, name: "num_rogue", wins: 119, rate: "79%", streak: 6 },
    { rank: 4, name: "deduce_pro", wins: 97, rate: "74%", streak: 3 },
    { rank: 5, name: "crackcode", wins: 88, rate: "71%", streak: 5 },
  ];

  return (
    <Section id="multiplayer" className="py-28">
      <FadeIn>
        <div className="text-center mb-16">
          <Badge
            variant="outline"
            className="border-neutral-700 text-neutral-400 mb-4 uppercase tracking-widest text-[10px] font-black"
          >
            Real-Time Battles
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight uppercase italic text-white mb-4">
            Multiplayer <span className="text-emerald-400">Combat</span>
          </h2>
          <p className="text-neutral-400 max-w-lg mx-auto text-base">
            Three ways to compete. One goal: be the fastest mind in the room.
          </p>
        </div>
      </FadeIn>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {modes.map((mode, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <Card className="group border-neutral-800 bg-neutral-900/70 backdrop-blur-sm rounded-3xl hover:border-neutral-700 hover:-translate-y-1 transition-all duration-300 h-full">
              <CardContent className="p-7 flex flex-col gap-5 h-full">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center group-hover:border-neutral-600 transition-colors">
                    <mode.icon className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
                  </div>
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-black uppercase border",
                      mode.badgeColor
                    )}
                  >
                    {mode.badge}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tight mb-2">
                    {mode.title}
                  </h3>
                  <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                    {mode.description}
                  </p>
                  <ul className="space-y-1.5">
                    {mode.feature.map((f, fi) => (
                      <li
                        key={fi}
                        className="flex items-center gap-2 text-xs text-neutral-500 font-medium"
                      >
                        <CircleCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      {/* Leaderboard Preview */}
      <FadeIn delay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Leaderboard */}
          <Card className="border-neutral-800 bg-neutral-900/60 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="font-black text-white uppercase italic text-sm tracking-tight">
                    Global Leaderboard
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="border-amber-500/30 text-amber-400 text-[10px] font-black uppercase"
                >
                  Live
                </Badge>
              </div>

              {/* Rows */}
              <div className="divide-y divide-neutral-800/50">
                {leaderboardMock.map((player, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className={cn(
                      "flex items-center gap-4 px-6 py-3.5 hover:bg-neutral-800/30 transition-colors cursor-default",
                      i === 0 && "bg-amber-500/5"
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 text-center text-sm font-black",
                        i === 0
                          ? "text-amber-400"
                          : i === 1
                          ? "text-neutral-300"
                          : i === 2
                          ? "text-amber-700"
                          : "text-neutral-600"
                      )}
                    >
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : player.rank}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-black text-neutral-400">
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">
                        @{player.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-neutral-400 font-bold">
                        {player.wins}W
                      </span>
                      <span className="text-emerald-400 font-black">
                        {player.rate}
                      </span>
                      <div className="flex items-center gap-1 text-orange-400">
                        <Flame className="w-3 h-3 fill-orange-400" />
                        <span className="font-black">{player.streak}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right: Text */}
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-3xl font-black uppercase italic tracking-tight text-white mb-3">
                Rise Through the <span className="text-amber-400">Ranks</span>
              </h3>
              <p className="text-neutral-400 leading-relaxed">
                Every match counts. Win games, build your streak, and climb the
                global leaderboard. Your username is your reputation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Star, label: "Win Rate Tracked", color: "text-amber-400" },
                { icon: Flame, label: "Streak Rewards", color: "text-orange-400" },
                { icon: Trophy, label: "Global Rankings", color: "text-yellow-400" },
                { icon: Layers, label: "Game History", color: "text-cyan-400" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800"
                >
                  <stat.icon className={cn("w-4 h-4 flex-shrink-0", stat.color)} />
                  <span className="text-xs font-bold text-neutral-300">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/auth">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] transition-all w-full sm:w-auto">
                <Trophy className="w-4 h-4 mr-2" />
                Join & Compete Now
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>
    </Section>
  );
}

// ─────────────────────────────────────────────
// 5. STATS BANNER
// ─────────────────────────────────────────────
function StatsBanner() {
  const stats = [
    { value: "10K+", label: "Games Played", icon: Gamepad2 },
    { value: "3–8", label: "Avg. Rounds Per Game", icon: Target },
    { value: "< 60s", label: "To Learn", icon: Zap },
    { value: "∞", label: "Replay Value", icon: TrendingUp },
  ];

  return (
    <Section className="py-16">
      <FadeIn>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 text-center p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors group"
            >
              <stat.icon className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-black italic text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </FadeIn>
    </Section>
  );
}

// ─────────────────────────────────────────────
// 6. CTA SECTION
// ─────────────────────────────────────────────
function CTASection() {
  return (
    <Section className="py-28">
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/70 backdrop-blur-sm px-8 py-20 text-center">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/8 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-cyan-500/5 rounded-full blur-[80px]" />
          </div>

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block mb-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                <Brain className="w-9 h-9 text-neutral-950" />
              </div>
            </motion.div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-white mb-4 leading-[0.95]">
              Ready to Challenge
              <br />
              <span className="text-emerald-400">Your Mind?</span>
            </h2>
            <p className="text-neutral-400 text-lg mb-10 max-w-md mx-auto">
              Join thousands of players sharpening their logic. It's free,
              instant, and dangerously addictive.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth">
                <Button
                  size="lg"
                  className="h-14 px-10 bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-wide text-base shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] transition-all duration-300 group"
                >
                  <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform fill-white" />
                  Start Playing — It's Free
                </Button>
              </Link>
            </div>

            <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-neutral-600">
              No credit card · No download · Just your mind
            </p>
          </div>
        </div>
      </FadeIn>
    </Section>
  );
}

// ─────────────────────────────────────────────
// 7. FOOTER
// ─────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-neutral-800/60 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Gamepad2 className="w-4.5 h-4.5 text-neutral-950 w-5 h-5" />
              </div>
              <span className="text-base font-black italic uppercase tracking-tighter text-white">
                Number<span className="text-emerald-400">Mind</span>
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-600">
              Decipher. Deduce. Dominate.
            </p>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-6 text-xs font-medium text-neutral-500">
            <a
              href="#how-it-works"
              className="hover:text-neutral-300 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#benefits"
              className="hover:text-neutral-300 transition-colors"
            >
              Benefits
            </a>
            <a
              href="#multiplayer"
              className="hover:text-neutral-300 transition-colors"
            >
              Multiplayer
            </a>
            <Link href="/auth" className="hover:text-neutral-300 transition-colors">
              Play
            </Link>
          </div>

          {/* GitHub placeholder */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all text-xs font-bold"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </div>

        <Separator className="my-8 bg-neutral-800/60" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-700">
          <span>© 2025 NumberMind · All rights reserved</span>
          <span>Build v2.4.0 · Codename: Enigma</span>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// PAGE EXPORT
// ─────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <LandingNav />
      <main>
        <HeroSection />
        <StatsBanner />
        <HowItWorksSection />
        <BenefitsSection />
        <MultiplayerSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
