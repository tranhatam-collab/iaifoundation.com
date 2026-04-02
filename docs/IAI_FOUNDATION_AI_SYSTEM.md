# IAI FOUNDATION - AI SYSTEM (FINAL)

## PURPOSE

Control how AI works in this repository.

Governance index: `docs/AI_GOVERNANCE_INDEX.md`

Prompt templates: `docs/AI_PROMPT_TEMPLATES.md`

Goal:
- maximum accuracy
- minimum token usage
- zero architecture drift

---

# 1. CORE RULE

ALWAYS:

1. ANALYZE -> PLAN -> IMPLEMENT -> VERIFY
2. USE ONLY existing repo information
3. OUTPUT FULL FILES (no partial code)
4. MAKE minimal changes only
5. STAY inside task scope

---

# 2. STRICT CONSTRAINTS

DO NOT:

- assume missing architecture
- modify unrelated files
- introduce mock logic
- rename structure without approval
- refactor outside task

IF unclear -> STOP and ASK

---

# 3. TOKEN OPTIMIZATION

- only read necessary files
- summarize instead of dumping code
- reuse previous conclusions
- avoid repeating context

---

# 4. SYSTEM STRUCTURE (LOCKED)

- app -> frontend
- api -> backend
- packages -> shared logic
- infra -> infrastructure
- docs -> documentation

NO cross-layer mixing.

---

# 5. WORKFLOW

## STEP 1 - ANALYZE
- read files
- summarize in 5-8 bullets
- no code

## STEP 2 - PLAN
- minimal safe solution
- list affected files

## STEP 3 - IMPLEMENT
- follow structure
- full file output

## STEP 4 - VERIFY
- risks
- break points
- test steps

---

# 6. OUTPUT FORMAT

Always:

- include filename
- full file only
- no explanation inside code

---

# 7. TASK MODES

- ARCHITECT -> analyze + design (no code)
- BUILDER -> implement
- DEBUGGER -> fix minimal
- REVIEWER -> audit
- DOCS -> write structured docs

---

# 8. ERROR PREVENTION

If missing info:
-> STOP

If uncertain:
-> STATE assumption

---

# 9. QUALITY STANDARD

Every output must improve:

- clarity
- consistency
- maintainability
- scalability

---

# 10. FINAL RULE

DO LESS, BUT CORRECT.

Minimal correct > complex wrong
