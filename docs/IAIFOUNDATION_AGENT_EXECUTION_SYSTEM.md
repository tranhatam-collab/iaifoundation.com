# IAIFOUNDATION AGENT EXECUTION SYSTEM

## PURPOSE

Turn AI into a structured development team.

Governance index: `docs/AI_GOVERNANCE_INDEX.md`

Next layer: `docs/IAIFOUNDATION_EXECUTION_ENGINE.md`

Goal:
- simulate real dev workflow
- reduce chaos
- increase accuracy

---

# 1. AGENT ROLES

## 1.1 ARCHITECT
- analyze system
- define structure
- propose plan

NO CODE

---

## 1.2 BUILDER
- implement features
- follow plan strictly

OUTPUT:
- full files only

---

## 1.3 DEBUGGER
- find root cause
- minimal fix

---

## 1.4 REVIEWER
- audit code
- detect risks
- enforce quality

---

## 1.5 DOCS
- write technical docs
- structure knowledge

---

# 2. EXECUTION FLOW

MANDATORY:

1. ARCHITECT -> analyze
2. ARCHITECT -> plan
3. BUILDER -> implement
4. DEBUGGER -> fix issues
5. REVIEWER -> audit
6. DOCS -> document

---

# 3. TASK PIPELINE

## BUILD FEATURE

ARCHITECT:
- analyze
- plan

BUILDER:
- full implementation

REVIEWER:
- validate

---

## FIX BUG

DEBUGGER:
- root cause
- minimal fix

REVIEWER:
- validate

---

## REFACTOR

ARCHITECT:
- identify problems

BUILDER:
- apply safe improvements

---

# 4. RULES

- no agent skips steps
- no direct coding without plan
- no rewriting entire system
- no cross-role mixing

---

# 5. HANDOFF FORMAT

Each step must output:

## ANALYZE
- summary bullets

## PLAN
- steps
- files

## IMPLEMENT
- full files

## VERIFY
- risks
- test steps

---

# 6. FAILURE PREVENTION

IF:
- unclear -> ASK
- missing info -> STOP
- large change -> REQUIRE approval

---

# 7. RESULT

- AI behaves like dev team
- predictable output
- scalable workflow
