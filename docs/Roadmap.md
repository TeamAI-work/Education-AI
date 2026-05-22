# Education-AI Roadmap

## Milestones

### Phase 1: Foundation — COMPLETE
- [x] Design System & Global Navigation
- [x] Premium UI/UX Framework (Green Theme, Framer Motion)
- [x] Supabase client setup & auth-decoupled UUID system

### Phase 2: Level 1 — Explorers (Grade 1–4) — COMPLETE
- [x] Alphabet Writing (Tracing) — SVG paths, boundary mask, accuracy checker
- [x] Show & Tell (Image Upload UI — AI RAG pending)
- [x] Living Math (Drag-and-Drop emoji counting + Supabase logging)
- [x] Level 1 Dashboard (glassmorphism sidebar + 2x2 feature grid)
- [x] Student Onboarding (name + avatar modal)
- [x] Gamification — streak tracking, activity logging, profile persistence
- [x] Performance pass — CSS animations, throttled draw loop, cached SVG sampling
- [x] No-scroll layout — all screens locked to 100dvh with flex-budget
- [x] Emoji encoding — all emojis converted to Unicode escapes (ASCII-safe)
- [ ] TTS Integration (deferred)
- [x] Trophy Room UI — fully functional daily task display & reset alerts

### Phase 3: Level 2 — Focus & Habit (Grade 5–8) — COMPLETE
- [x] Daily Streak Calendar parsing Supabase user_streaks active_dates array
- [x] Selection-based text highlight Note Taker engine with Floating tooltip
- [x] Cloud-synchronized Digital Notebook with inline note editing (Title/Content)
- [x] Persistent Supabase notebook_notes table storage and deletions
- [x] Modularized RAG academic Chatbot subcomponents (ChatHeader, MessageItem, ChatInputForm, ActiveSourcesIndicator)
- [x] Dynamic **Daily Tasks Reset** system (badge progress clears to 0% at midnight)
- [x] Independent **Daily Tasks Streak Tracker** (stored in localStorage, updates on completing >= 3 daily tasks)
- [x] **Auto-Streak on Launch** (login/activity streak advances automatically upon opening the app, removing task completion dependency)
- [x] **Localized Timezone Standardization** (uses sv-SE date strings across all files to completely eliminate UTC offset day-shifting bugs)
- [x] **Mobile Responsiveness** — Level 2 Dashboard and Chat page fully responsive with slide-over overlay drawers
- [x] **Supabase FK Hardening** — Resolved 409 Conflict errors on chat_sessions and user_streaks; implemented async self-healing resolvers (resolveProfileId, resolveUserId) across all page-mount call sites
- [x] **useNoteSelection TypeError Fix** — Split shared event handler into dedicated mouseup and selectionchange callbacks to prevent .closest() crash on Document node

### Phase 4: Level 3 — Strategic Preparation (Grade 9–10) — NOT STARTED
- [ ] Concept Mapping (React-Flow Mind Maps)
- [ ] Mock Test Simulator (AI Generation & Exam-standard Marking)
- [ ] Pomodoro Timer, Streaks, & Note Taker

### Phase 5: Level 4 — Pathway & Weightage (Grade 11–12) — NOT STARTED
- [ ] Career Pathway (Performance-based Suggestions)
- [ ] Chapter Wise Weightage (Historical Exam Analysis)
- [ ] Note Taker, Concept Mapping, Mock Test Sim, Pomodoro, & Streaks

### Phase 6: Final Polish — NOT STARTED
- [ ] Global Integration & Performance Optimization
- [ ] RAG Pipeline Hooks
