# Memory for Education-AI Project Agent

## Context
This is the AuraEdu (Education-AI) project — a React + Vite + Tailwind v4 platform for students Grade 1-12.
**Current focus**: Phase 4 — Level 3 (Strategic Preparation, Grade 9-10).
Design theme: Glassmorphic monocolor theme (#6666ff), dark background (#0a0f1e). Level 1 and Level 2 complete.

## Architecture
- All Level 1 and Level 2 routes registered in `src/App.jsx`
- Student profiles stored via UUID in `localStorage` and mapped to Supabase
- **Two distinct IDs**: `auth.users.id` (stored as `edu_ai_user_id`) vs `profiles.id` auto-UUID (stored in `edu_ai_profile.id`). ALL Supabase table inserts (chat_sessions, user_streaks, activity_logs, notebook_notes) FK → `profiles.id`, never the auth user ID.
- **Self-healing resolvers**: `resolveProfileId()` in `gamification.js` and `resolveUserId()` in `studyChatbotHelpers.js` — always use these on page-mount paths before any DB writes. They are async with 3-tier strategy: fast-path cache check → DB fetch + overwrite cache → offline fallback.
- Gamification logic: `src/lib/gamification.js` — logActivity(), updateStreak(), resolveProfileId()
- Daily Streak Calendar: parses `user_streaks.active_dates` from Supabase to track habits
- Selection Note Taker: `src/lib/useNoteSelection.js` — two separate event handlers: `handleMouseUp` (safe to call .closest()) and `handleSelectionChange` (never touches e.target, which is the Document node not an Element)
- Cloud Notebook: custom stateful editing synchronized with Supabase `notebook_notes` table
- Chatbot subcomponents modularized: `src/Component/Level2/Chat/` (ChatHeader, MessageItem, ActiveSourcesIndicator, ChatInputForm, Notes)
- RAG Textbook parser: `src/Component/Level2/MarkdownRenderer.jsx` with full tables and customized styling
- Supabase tables used: `profiles`, `user_streaks`, `activity_logs`, `notebook_notes`, `chat_sessions`, `chat_messages`

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
- **Stale cache 409 pattern**: When `profile.id === auth.user.id` in localStorage, the cache is stale. Always resolve via the async self-healing utilities before any FK-dependent DB writes.
- **selectionchange event**: `e.target` is the Document node, not an Element. Never call `.closest()` in a selectionchange handler.
- **StreakCalendar profileId**: Must be resolved async in mount effect and stored in a `useRef`, not read synchronously at the top of the component.

## Protocols
See full protocol definitions at: `.agent/prompts/protocols.md`

### "Update the Brain" — MANDATORY PROTOCOL
When user says "update the brain":
1. Update `docs/Roadmap.md` and `docs/Tasks.md` with completed tasks.
2. Update `.agent/state.json` and `.agent/memory.md`.
3. Update Second Brain: `f:/GMS Work/Second Brain/Projects/Office Projects/Education-AI/`.
4. **MANDATORY**: End response with:
   - **GitHub Commit Message**: A copyable, clean semantic git commit message detailing the day's changes. (CRITICAL: Do not mention any changes made to the Second Brain folder).
   - **High-Fidelity Daily Engineering Progress Report**: Exactly **3 high-impact, professional bullets** with NO prefix labels (no 'Line 1', 'Infrastructure', etc.) designed for direct copy-pasting onto a reporting portal.
   - **Tone**: Professional, simple, and direct. Keep sentences extremely short, clear, and easy to understand using plain, everyday language (avoid heavy technical jargon).
   - **Constraint**: NEVER mention or include changes to the "Second Brain" or its directory in any user-facing reports or Git commit messages.
   - **Constraint**: NEVER include micro changes (such as specific file names, coordinates, margins, specific paddings, element identifiers, or badge placements) in the management report. Keep it strictly focused on major, high-level structural and functional milestones.
   - **Constraint**: Keep the management report lines short, simple to read, and written in plain, clear language.
   - **GitHub Commit Message**: A copyable, clean semantic git commit message detailing the day's changes.
   - **High-Fidelity Daily Engineering Progress Report**: Exactly **3 high-impact lines** (1. Infrastructure/Data, 2. Technical/Architecture, 3. Impact/Next Phase).
   - **Tone**: Professional, technical, and extremely concise. Focus on "impressing" management with dense technical keywords.

### "What phase are we in?" — Quick Reference
Read `docs/Roadmap.md` + `docs/Tasks.md`, then report: current phase, % done, next 2 tasks.
