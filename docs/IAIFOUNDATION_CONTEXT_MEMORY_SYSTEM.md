# IAIFOUNDATION CONTEXT MEMORY SYSTEM

## PURPOSE

Reduce token usage by avoiding repeated context processing.

Governance index: `docs/AI_GOVERNANCE_INDEX.md`

Goal:
- reuse knowledge
- avoid re-analysis
- keep AI consistent across sessions

---

# 1. MEMORY TYPES

## 1.1 STATIC MEMORY (LONG-TERM)

Stored in:
- docs/*
- architecture files

Contains:
- system structure
- API design
- core rules

RULE:
-> never re-analyze unless changed

---

## 1.2 SESSION MEMORY (SHORT-TERM)

Stored in chat/session.

Contains:
- current task
- current assumptions
- recent decisions

RULE:
-> reuse, do not restate

---

## 1.3 DERIVED MEMORY (CRITICAL)

AI-generated summaries.

Example:
- architecture summary
- module summary

FORMAT:

[MEMORY]
- system: ...
- api: ...
- module: ...

RULE:
-> reuse instead of re-reading files

---

# 2. MEMORY STRATEGY

## ALWAYS:

1. load minimal files
2. summarize once
3. reuse summary
4. avoid re-analysis

---

# 3. MEMORY WORKFLOW

STEP 1 - FIRST LOAD
- read files
- summarize

STEP 2 - STORE
- create memory block

STEP 3 - REUSE
- reference memory
- do NOT reload files

---

# 4. TOKEN OPTIMIZATION RULES

DO:
- summarize large files
- reuse memory
- use bullet points

DO NOT:
- paste full files repeatedly
- re-analyze unchanged code
- duplicate context

---

# 5. MEMORY FORMAT (STANDARD)

[MEMORY: SYSTEM]
- architecture: ...
- layers: ...
- flow: ...

[MEMORY: MODULE]
- name: ...
- purpose: ...
- files: ...

---

# 6. INVALID MEMORY (AVOID)

- vague summaries
- long paragraphs
- duplicated info
- outdated info

---

# 7. REFRESH RULE

Only refresh memory if:
- file changed
- architecture changed
- new module added

---

# 8. RESULT

Using this system:
- reduce token 50-80%
- increase consistency
- reduce hallucination
