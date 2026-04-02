# IAIFOUNDATION REALTIME AGENT SYSTEM

## PURPOSE

Enable parallel agent execution with controlled coordination.

Governance index: `docs/AI_GOVERNANCE_INDEX.md`

Goal:
- speed up delivery
- keep role separation
- prevent conflict and overwrite

---

# 1. AGENT TOPOLOGY

Core agents:
- architect-agent
- builder-agent
- debugger-agent
- reviewer-agent
- docs-agent

Coordinator:
- routes tasks
- enforces sequence
- merges outputs

---

# 2. PARALLEL STRATEGY

Run in parallel only when independent:
- file-level independence
- module-level independence
- no shared write target

If shared target exists -> serialize.

---

# 3. CONFLICT CONTROL

Before write:
- lock file scope

After write:
- verify lock release

If collision:
- coordinator resolves by priority

Priority:
1. debugger
2. builder
3. docs

---

# 4. LIVE HANDOFF FORMAT

Each agent emits:
- state
- changed files
- assumptions
- blockers

---

# 5. REALTIME RULES

- no silent assumption
- no hidden rewrite
- no cross-role escalation without coordinator

---

# 6. OBSERVABILITY

Track:
- agent latency
- token usage
- conflict count
- rollback count

---

# 7. RESULT

- faster multi-task execution
- fewer merge conflicts
- higher predictability
