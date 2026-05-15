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
5. **Give the user a brief 3–4 point summary of today's completed work** in the chat response. This summary must be concise, plain-English, and highlight only the most impactful things done.

### Summary Format (mandatory)
After updating all files, end the response with:

> **Today's Progress Summary:**
> 1. [Completed item 1 — one sentence]
> 2. [Completed item 2 — one sentence]
> 3. [Completed item 3 — one sentence]
> *(optional 4th point if significant)*

---

## Protocol: "What phase are we in?"

**Trigger phrase**: "what phase", "which phase"

**The AI must:**
1. Read `docs/Roadmap.md`
2. Read `docs/Tasks.md`
3. Report the current active phase, % completion estimate, and the next 2 immediate tasks.
