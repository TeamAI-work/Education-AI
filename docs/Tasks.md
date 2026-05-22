# Education-AI Tasks

## Phase 1: Foundation (COMPLETE)
- [x] Install Core Dependencies (Router, Framer Motion, Lucide)
- [x] Define Design System (Variables.css — `--color-level-1: #00D166`)
- [x] Setup Routing (App.jsx with react-router-dom)
- [x] Build Landing Page (Hero + Level Select)
- [x] Supabase Client & Database Schema (auth-decoupled, UUID-based)

> [!TIP]
> For granular sub-tasks, see [.agent/tasks/Phase-1-Tasks.md](file:///f:/GMS%20Work/Office%20Projects/Education-AI/.agent/tasks/Phase-1-Tasks.md)

## Phase 2: Level 1 — Explorers (COMPLETE)
- [x] Alphabet Tracing Canvas (SVG paths, boundary mask, accuracy scoring)
- [x] Show & Tell UI (Image upload — RAG pending)
- [x] Living Math Drag-and-Drop (emoji counting + Supabase logging)
- [x] Level 1 Dashboard (`/level1/dashboard`) — glassmorphism, sidebar, feature cards
- [x] Student Onboarding modal (name + avatar picker)
- [x] Supabase Integration — profiles, user_streaks, activity_logs (auth-decoupled)
- [x] Gamification — daily streak tracking, activity logging via `gamification.js`
- [x] Performance Optimization — CSS keyframe animations replacing JS Framer Motion loops
- [x] No-Scroll Layout — all screens locked to 100dvh, flex-budget layout
- [x] Emoji Encoding Fix — all emojis converted to Unicode escape sequences (ASCII-safe)
- [ ] TTS Integration
- [x] Badges / Trophy Room UI (Fully functional daily task display & reset alerts)

> [!TIP]
> For granular sub-tasks, see [.agent/tasks/Phase-2-Tasks.md](file:///f:/GMS%20Work/Office%20Projects/Education-AI/.agent/tasks/Phase-2-Tasks.md)

## Phase 3: Level 2 — Focus & Habit (COMPLETE)
- [x] Daily Streak Calendar (dynamic parsing of Supabase active_dates array)
- [x] Selection-based Note Taker (highlight tooltip capture engine)
- [x] Persistent Digital Notebook (Supabase notebook_notes cloud integration)
- [x] Inline Edit System (edit note titles & highlighted content directly in drawer cards)
- [x] Modular Refactoring (extracted ChatHeader, MessageItem, ChatInputForm, ActiveSourcesIndicator)
- [x] Dynamic **Daily Tasks Reset** system (badge progress clears to 0% at midnight)
- [x] Independent **Daily Tasks Streak Tracker** (localStorage-based, rewards completing >= 3 daily tasks)
- [x] **Auto-Streak on Launch** (login/activity streak advances automatically upon opening the app, removing task completion dependency)
- [x] **Localized Timezone Standardization** (uses sv-SE date strings across all files to completely eliminate UTC offset day-shifting bugs)
- [x] **Level 2 Mobile Responsiveness** — Dashboard and Chat page with slide-over drawer overlays, responsive header, touch-optimized note cards
- [x] **Supabase FK Hardening** — Fixed 409 Conflict on chat_sessions (resolveUserId in studyChatbotHelpers.js) and user_streaks (resolveProfileId in gamification.js); guarded stale-cache fallback in useStudentProfile
- [x] **useNoteSelection TypeError Fix** — Separated mouseup and selectionchange into dedicated handlers; selectionchange no longer calls .closest() on Document node

> [!TIP]
> For granular sub-tasks, see [.agent/tasks/Phase-3-Tasks.md](file:///f:/GMS%20Work/Office%20Projects/Education-AI/.agent/tasks/Phase-3-Tasks.md)

## Phase 4: Level 3 — Strategic Preparation (Not Started)
- [ ] Concept Mapping (`react-flow`)
- [ ] Mock Test Simulator
- [ ] AI Grading & Analytics View
- [ ] Pomodoro Focus Timer

> [!TIP]
> For granular sub-tasks, see [.agent/tasks/Phase-4-Tasks.md](file:///f:/GMS%20Work/Office%20Projects/Education-AI/.agent/tasks/Phase-4-Tasks.md)

## Phase 5: Level 4 — Pathway & Weightage (Not Started)
- [ ] AI Career Pathway Suggester
- [ ] Chapter Weightage Visualizations
- [ ] Subject Strength Radar Chart
- [ ] Senior Unified Dashboard

> [!TIP]
> For granular sub-tasks, see [.agent/tasks/Phase-5-Tasks.md](file:///f:/GMS%20Work/Office%20Projects/Education-AI/.agent/tasks/Phase-5-Tasks.md)

## Phase 6: Final Polish & RAG Integration (Not Started)
- [ ] Global State Management (Zustand)
- [ ] RAG Communication Hooks
- [ ] Cross-Level Progress Sync
- [ ] Production Performance Audit

> [!TIP]
> For granular sub-tasks, see [.agent/tasks/Phase-6-Tasks.md](file:///f:/GMS%20Work/Office%20Projects/Education-AI/.agent/tasks/Phase-6-Tasks.md)

## Completed (Archive)
- [x] Project Initialization
- [x] Phased Roadmap Planning
- [x] Documentation Setup
