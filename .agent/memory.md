# Memory for Education-AI Project Agent

## Context
This is the AuraEdu (Education-AI) project — a React + Vite + Tailwind platform for students Grade 1-12.
Current focus: Level 1 (Explorers, Grade 1-4). Design theme: Green (#00D166), dark background (#0a0f1e).

## Learnings
- SVG paths for letter tracing are defined in `src/data/letterPaths.js`
- Boundary enforcement uses a pre-calculated off-screen canvas pixel mask
- Split-screen layout: Left 65% canvas, Right 35% control panel
- All Level 1 routes are registered in `src/App.jsx`

## Decisions
- No global Sidebar on Level 1 landing/tracing pages — sidebar only inside Dashboard
- "LET'S GO!" button on landing navigates to `/level1/dashboard`
- Accuracy = 60% coverage + 40% precision against SVG skeleton

## Protocols
See full protocol definitions at: `.agent/prompts/protocols.md`

### "Update the Brain" — Quick Reference
When user says "update the brain":
1. Update `docs/Roadmap.md` and `docs/Tasks.md` with completed tasks
2. Update the `walkthrough.md` and `task.md` session artifacts
3. **End response with a 3-4 point Today's Progress Summary in plain English**

### "What phase are we in?" — Quick Reference
Read `docs/Roadmap.md` + `docs/Tasks.md`, then report: current phase, % done, next 2 tasks.

