# NumberMind Design Guidelines

## Design Approach
**Reference-Based Gaming UI** - Drawing from modern puzzle games like Wordle, Chess.com, and competitive gaming platforms. Emphasis on clarity during gameplay with engaging marketing presentation.

## Typography System
**Fonts:** 
- Primary: Inter (UI elements, body text)
- Display: Space Grotesk (headings, game titles)

**Hierarchy:**
- Hero Display: 4xl-6xl, bold, tight leading
- Section Headers: 2xl-3xl, semibold
- Game Elements: xl-2xl, medium (numbers, guesses)
- Body: base-lg, regular
- UI Labels: sm-base, medium

## Layout System
**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16, 20
- Game grid padding: p-6 to p-8
- Section spacing: py-16 to py-24
- Card gaps: gap-4 to gap-6
- Component margins: m-4 to m-8

**Containers:**
- Landing sections: max-w-7xl
- Game interface: max-w-4xl (centered gameplay area)
- Content blocks: max-w-2xl

## Component Library

### Landing Page Components
**Hero Section (80vh):**
- Left: Animated game preview showing sample Bulls/Cows gameplay with glowing number tiles
- Right: Headline, subheadline, dual CTA buttons (Play Now + Watch Demo)
- Floating stats badges: "10K+ Active Players", "Real-time Multiplayer"

**How It Works (3-column grid):**
Cards with large numerals (01, 02, 03), step descriptions, subtle glow effects on hover

**Features Showcase (alternating 2-column):**
- Row 1: Real-time multiplayer (screenshot/mockup left, text right)
- Row 2: Smart hints system (text left, visual right)
- Row 3: Global leaderboards (screenshot left, text right)

**Live Games Ticker:**
Horizontal scroll of active game cards showing real-time matches

**Leaderboard Preview (3-column podium):**
Top 3 players with medal icons, stats, profile pictures

### Game Interface Components
**Lobby Card:**
Glass-morphism card with player avatars in a circle, ready status indicators, start button with pulse animation

**Game Board:**
- Number input grid (large, tactile buttons with subtle depth)
- Guess history list (collapsible, shows Bulls/Cows count with color coding)
- Timer component (circular progress ring)
- Opponent's status panel (compact, real-time updates)

**Result Modal:**
Full-screen overlay with confetti animation (winner) or encouraging message, game stats breakdown, rematch/exit buttons

### Navigation & Controls
**Header:**
Logo left, nav items center (Play, Leaderboard, How to Play), user profile/login right, theme toggle

**Footer:**
Social links, quick nav, "Created by" attribution, newsletter signup inline

## Visual Design Elements

**Cards & Containers:**
- Shadcn card components with subtle border
- Glass-morphism for overlays (backdrop-blur-lg, bg-opacity-10)
- Elevated states: shadow-lg to shadow-2xl
- Rounded corners: rounded-lg to rounded-xl

**Buttons:**
- Primary: Blue gradient with purple tint, shadow-md
- Secondary: Outlined with hover fill
- Ghost: Minimal with subtle hover background
- Buttons on images: backdrop-blur-md with semi-transparent background

**Number Tiles (Game Specific):**
Large square buttons (aspect-square), bold typography, state variations:
- Unselected: neutral with subtle border
- Selected: blue glow with scale transform
- Correct (Bull): green accent with success animation
- Present (Cow): yellow accent with pulse
- Incorrect: red flash, fade to disabled state

**Animations (Minimal & Purposeful):**
- Page transitions: fade + slide (200ms)
- Number selection: scale(1.05) + glow (150ms)
- Guess submission: slide-in from bottom (300ms)
- Victory: confetti burst + scale-up modal
- NO continuous/looping animations except timer

## Responsive Breakpoints
- Mobile (<768px): Single column, full-width game board, stacked features
- Tablet (768-1024px): 2-column layouts, condensed spacing
- Desktop (>1024px): Multi-column grids, spacious game interface

## Dark/Light Mode Strategy
**Light Mode:**
- Background: neutral-50
- Cards: white with neutral-200 borders
- Text: neutral-900/800

**Dark Mode:**
- Background: neutral-950
- Cards: neutral-900 with neutral-800 borders
- Text: neutral-50/100
- Enhanced glow effects on interactive elements

**Consistent Across Modes:**
- Blue primary remains vibrant
- Purple accents adjust slightly for contrast
- Shadows become subtle glows in dark mode

## Images Section

**Hero Image:**
Large hero image showing an exciting gameplay moment - two players' screens side-by-side with glowing number grids, Bulls/Cows indicators, and timer countdown. Photorealistic 3D render or high-quality illustration style. Place behind/beside hero content with gradient overlay for text readability.

**Feature Screenshots:**
Three polished game interface mockups showing: 1) Multiplayer lobby with avatars, 2) Active gameplay with guess history, 3) Victory screen with confetti. Place within features section alternating left/right.

**Background Patterns:**
Subtle grid pattern or abstract number motifs on landing sections (very low opacity, decorative only).