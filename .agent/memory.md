# Memory for Education-AI Project Agent

## Context
This is the AuraEdu (Education-AI) project — a React + Vite + Tailwind v4 platform for students Grade 1-12.
**Current focus**: Phase 3 — Level 2 (Focus & Habit, Grade 5-8).
Design theme: Green (#00D166), dark background (#0a0f1e). Level 1 Explorer theme complete.

## Architecture
- All Level 1 routes registered in `src/App.jsx`
- Student profiles stored via UUID in `localStorage` (no Supabase Auth required)
- Gamification logic: `src/lib/gamification.js` — logActivity(), updateStreak()
- Student profile hook: `src/lib/useStudentProfile.js` — getStoredUserId()
- Letter SVG paths: `src/data/letterPaths.js`
- Supabase tables used: `profiles`, `user_streaks`, `activity_logs`
- RLS patch required: `supabase/schema_patch.sql` (must be run manually in Supabase SQL editor)

## Layout Standard — ALL SCREENS
Every screen MUST be locked to 100dvh with no scroll:
- Root div: `width: 100vw; height: 100dvh; overflow: hidden`
- Fixed sections (headers, footers, buttons): `flex-shrink-0`
- Flexible content area: `flex-1 min-h-0`
- Never use `justify-center` alone on a flex-col that has variable content

## Emoji Standard — CRITICAL
**ALL emojis in JSX/JS files MUST use Unicode escape sequences** — e.g. `'\u{1F31F}'` not `'🌟'`
Reason: PowerShell `Get-Content` without `-Encoding UTF8` corrupts multi-byte UTF-8 emoji.
Direct emoji in JSX text is safe ONLY when written by the file tool (write_to_file), never via PowerShell.
See unicode map in docs/Decisions.md.

## Performance Rules
- Decorative animations: CSS `@keyframes` only (floatBob, pulseSlow, bobSpin in index.css)
- AlphabetTracer: ref points cached once per letter, progress throttled to every 8 draw points
- Never call `getBoundingClientRect()` inside a mousemove handler

## Learnings
- SVG paths for letter tracing are defined in `src/data/letterPaths.js`
- Boundary enforcement uses a pre-calculated off-screen canvas pixel mask
- AlphabetTracer split-screen: Left 65% canvas, Right 35% control panel
- No global Sidebar on Level 1 landing/tracing pages — sidebar only inside Dashboard
- Accuracy = 70% coverage + 30% precision against SVG skeleton

## Protocols
See full protocol definitions at: `.agent/prompts/protocols.md`

### "Update the Brain" — MANDATORY PROTOCOL
When user says "update the brain":
1. Update `docs/Roadmap.md` and `docs/Tasks.md` with completed tasks.
2. Update `.agent/state.json` and `.agent/memory.md`.
3. Update Second Brain: `f:/GMS Work/Second Brain/Projects/Office Projects/Education-AI/`.
4. **MANDATORY**: End response with a **High-Fidelity Daily Engineering Progress Report** designed for a Reporting Head. 
   - **Structure**: Exactly **3 high-impact lines** (1. Infrastructure/Data, 2. Technical/Architecture, 3. Impact/Next Phase).
   - **Tone**: Professional, technical, and extremely concise. Focus on "impressing" management with dense technical keywords.

### "What phase are we in?" — Quick Reference
Read `docs/Roadmap.md` + `docs/Tasks.md`, then report: current phase, % done, next 2 tasks.
