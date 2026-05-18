# Agent Protocols — Education-AI Project

These are standing instructions for the AI agent working on this project.
All protocols apply across sessions and must be followed automatically.

---

## Protocol: "Update the Brain"

**Trigger phrase**: Any variant of "update the brain", "update brain", "sync the brain"

**The AI must do the following, in order:**

1. **Update `docs/Roadmap.md`** — Mark any newly completed milestones with `[x]`.
2. **Update `docs/Tasks.md`** — Check off all tasks completed in the session.
3. **Update the session `walkthrough.md`** artifact — Document what was built with technical detail.
4. **Update the session `task.md`** artifact — Reflect current task statuses.
5. **Generate a High-Fidelity Daily Engineering Progress Report** designed for a Reporting Head. 

### Report Format (Mandatory)
The chat response must end with a structured report of **EXACTLY 3 high-impact lines**:
- **Line 1 (Infrastructure)**: High-level overview of core achievements and data/backend milestones.
- **Line 2 (Technical)**: Deep dive into architecture, performance (60 FPS, GPU), and engineering logic.
- **Line 3 (Impact/Next)**: Summary of business value delivered and clear transition to the next phase.

**Tone**: Professional, technical, and high-impact. Keep it extremely concise but dense with technical achievements.

---

## Protocol: "What phase are we in?"

**Trigger phrase**: "what phase", "which phase"

**The AI must:**
1. Read `docs/Roadmap.md`
2. Read `docs/Tasks.md`
3. Report the current active phase, % completion estimate, and the next 2 immediate tasks.
