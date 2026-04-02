# IAIFOUNDATION MULTI MODEL ROUTER

## PURPOSE

Select best AI model for each task.

Governance index: `docs/AI_GOVERNANCE_INDEX.md`

Goal:
- maximize quality
- minimize cost
- ensure reliability

---

# 1. CORE PRINCIPLE

DO NOT use one model for everything.

Route based on task.

---

# 2. MODEL ROLES

## CLAUDE (PRIMARY)

Use for:
- code generation
- reasoning
- architecture

---

## OPENAI (SECONDARY)

Use for:
- orchestration
- structured output
- agent coordination

---

## GEMINI (COST LAYER)

Use for:
- large context
- data processing
- low-cost tasks

---

# 3. ROUTING RULES

## SIMPLE TASK
-> Gemini

## MEDIUM TASK
-> OpenAI

## COMPLEX TASK
-> Claude

---

# 4. FALLBACK SYSTEM

IF model fails:

1. retry same model
2. fallback to next model
3. reduce context size

---

# 5. COST OPTIMIZATION

- use Gemini for bulk
- use Claude for critical
- avoid long context in expensive models

---

# 6. REQUEST STRUCTURE

task -> classify -> route -> execute -> validate

---

# 7. RESPONSE VALIDATION

- check correctness
- check consistency
- check structure

---

# 8. ADVANCED STRATEGY

For large tasks:

1. split into sub-tasks
2. route separately
3. combine results

---

# 9. RESULT

- reduce cost 40-70%
- increase accuracy
- improve system reliability
