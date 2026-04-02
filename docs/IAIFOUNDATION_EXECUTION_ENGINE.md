# IAIFOUNDATION EXECUTION ENGINE (LEVEL 3)

## PURPOSE

Turn AI into a fully autonomous execution system.

Governance index: `docs/AI_GOVERNANCE_INDEX.md`

Previous layer: `docs/IAIFOUNDATION_AGENT_EXECUTION_SYSTEM.md`

Goal:
- break tasks into steps
- route to best model
- execute like real dev team
- minimize cost + maximize output

---

# 1. CORE FLOW

task
-> classify
-> split
-> assign agent
-> route model
-> execute
-> validate
-> merge result

---

# 2. TASK CLASSIFICATION

## TYPE A - SIMPLE
- small code
- minor fix

MODEL:
-> GPT-5.4 mini

---

## TYPE B - STANDARD
- feature
- API
- multi-file

MODEL:
-> GPT-5.3-Codex

---

## TYPE C - COMPLEX
- architecture
- system design

MODEL:
-> GPT-5.4

---

## TYPE D - BULK
- reading repo
- summarizing

MODEL:
-> Gemini Flash

---

## TYPE E - LARGE CONTEXT
- large system
- deep analysis

MODEL:
-> Gemini Pro

---

# 3. TASK SPLITTING

Large task must be split:

Example:

Feature:
-> analyze
-> API
-> logic
-> UI
-> test

Each routed separately

---

# 4. EXECUTION LOOP

FOR each sub-task:

1. select model
2. execute
3. validate output
4. retry if needed
5. store result

---

# 5. VALIDATION LAYER

Check:
- syntax
- logic
- structure
- consistency

If fail:
-> retry or fallback model

---

# 6. FALLBACK STRATEGY

If model fails:

1. retry same
2. switch model
3. reduce context

---

# 7. COST CONTROL

- use mini for small
- use Gemini for bulk
- reserve Codex for core logic
- reserve GPT-5.4 for design only

---

# 8. MEMORY INTEGRATION

- reuse summaries
- avoid re-reading files
- store architecture memory

---

# 9. FINAL OUTPUT

Combine:
- code
- explanation
- test steps

---

# 10. RESULT

- AI works like team
- scalable system
- optimized cost
