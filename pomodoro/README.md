# Hearth: a warm Pomodoro timer

Hearth is a Pomodoro timer built on a **"Warm Tech"** idea: cozy, organic and calm instead of cold and robotic. It cares more about focus and small moments of wellbeing than about strict productivity numbers.

## Run it

```bash
cd pomodoro
npm install
npm run dev        # http://localhost:5173
```

| Script            | What it does                                   |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Starts the Vite dev server with hot reload     |
| `npm run build`   | Type-checks and builds a production bundle     |
| `npm run preview` | Serves the production build locally            |
| `npm test`        | Runs the unit tests (Vitest)                   |
| `npm run lint`    | Lints the code (Oxlint)                        |

There's no backend. All progress is stored in `localStorage` under keys that start with `hearth:`.

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4.** The palette lives in the `@theme` block in [`src/index.css`](src/index.css), which is Tailwind v4's configuration file.
- **Framer Motion** handles the spring physics and organic micro-interactions.
- **Lucide React** provides the icons.
- **Web Audio API** synthesises every ambient sound. The app ships no audio files.
- **Fraunces** (with its `SOFT` axis turned up) and **Figtree** are bundled locally through Fontsource.

## Design tokens

| Token               | Hex       | Role                          |
| ------------------- | --------- | ----------------------------- |
| `clay`              | `#F7F4EF` | Background (Soft Clay Cream)  |
| `ivory`             | `#FFFFFF` | Surfaces and cards            |
| `terracotta`        | `#C86D51` | Primary colour, Focus mode    |
| `sage`              | `#587B6A` | Secondary colour, Rest mode   |
| `amber-soft`        | `#E6A15C` | Accents and achievements      |
| `charcoal`          | `#2C2A29` | Text and headings             |

Every token becomes a utility class (`bg-terracotta`, `text-sage/80`, …). `black` is remapped to charcoal, so pure `#000000` never appears in the UI. `shadow-sm` is tinted warm too.

## Features

### Organic timer
- Three modes: Deep Focus (25 min), Short Rest (5 min) and Long Rest (15 min). All durations can be changed.
- The SVG ring isn't a perfect circle. It's a smooth Catmull-Rom loop whose radius drifts on slow sine waves, so it looks alive, and it wobbles a little more while the timer runs.
- During a rest, the inner shape breathes on an 8-second cycle that matches the *breathe in… / breathe out…* caption.
- The tab title updates as you go: `24:59 - Deep Focus`, `Paused · …`, or the warm loading message.
- The timer counts down to a timestamp, so it stays accurate in throttled background tabs and after a page reload.

### Artificial latency ("Zero Robot Effect")
- Starting a session, changing modes, completing a block and saving settings all pause for a random **1.2–1.8 s** ([`src/lib/latency.ts`](src/lib/latency.ts)).
- During that pause the app shows a gentle breathing shape and a message such as *"Preparing your calm space…"*, *"Taking a deep breath…"* or *"Setting up focus mode…"*. All of this copy lives in [`src/lib/copy.ts`](src/lib/copy.ts).
- Resuming from pause is instant on purpose, because you never really left.

### Flexible Focus Streaks
- A finished focus block counts as a **Quality Block**.
- **Close enough counts:** a block you end after 80% or more of its time still counts.
- Shorter attempts don't count as blocks, but their focused minutes are still added to the day.
- **Rhythm** is the non-punitive streak. One block is enough for a day to count; the daily goal is only an invitation. Up to **2 quiet days in a row** are treated as rest days that keep your rhythm going, and today never counts against you. The logic is in [`src/lib/rhythm.ts`](src/lib/rhythm.ts) and covered by unit tests.
- When you reach your daily goal for the first time that day, a **watercolour bloom** plays. Pigment spreads using SVG turbulence and displacement with multiply blending.

### Micro-wellbeing rewards
- **Rest notes:** each Quality Block unlocks a new stoic or creative quote, 23 in total. Quotes only show up while a rest is underway, so they're a reward for stepping away. A newly unlocked quote is shown first.
- **Soundscape:** soft rain, a fireplace and warm (brown) noise, all generated live with Web Audio. You can mix them, each one has its own volume, and they fade in and out gently.
- A soft two-note chime plays when a session ends. You can turn it off.

### Little extras
- An optional *"What deserves your attention?"* intention for each focus block
- <kbd>Space</kbd> starts or pauses the timer
- Respects `prefers-reduced-motion`
- Responsive down to 320 px

## Project structure

```
src/
  App.tsx                 # composition, toasts, title, keyboard
  index.css               # Tailwind v4 @theme (design tokens) + base styles
  components/             # TimerCard, OrganicRing, TodayCard, QuoteCard, Soundscape,
                          # SettingsSheet, WatercolorBloom, PreparingOverlay, …
  hooks/
    usePomodoro.ts        # timer state machine + organic latency
    useProgress.ts        # Quality Blocks, rhythm, quote unlocks
    useAmbient.ts         # soundscape state
    usePersistentState.ts # useState + localStorage
  lib/
    audio/engine.ts       # Web Audio synthesis (rain, fire, noise, chime)
    copy.ts               # every user-facing string
    quotes.ts             # unlockable quotes
    rhythm.ts             # flexible streak logic (+ rhythm.test.ts)
```
