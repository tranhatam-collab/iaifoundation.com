# AI Prompt Templates

Use these templates with Copilot/agents to enforce repository behavior.

Governance index: `docs/AI_GOVERNANCE_INDEX.md`

## Pre-Flight Checklist

Before running any template, ensure:

- I read `docs/IAI_FOUNDATION_AI_SYSTEM.md` first.
- I stay inside task scope only.
- I avoid unrelated refactors.
- I use minimal file reads and minimal edits.
- I follow ANALYZE -> PLAN -> IMPLEMENT -> VERIFY.

## 1) Analyze Only

```text
Follow docs/IAI_FOUNDATION_AI_SYSTEM.md strictly.

Start with ANALYZE only.

Task:
[describe task]
```

## 2) Analyze + Plan (No Implementation)

```text
Follow docs/IAI_FOUNDATION_AI_SYSTEM.md strictly.

Task:
[describe feature]

Do not implement yet.
Start with ANALYZE and PLAN.
```

## 3) Build Feature

```text
Follow docs/IAI_FOUNDATION_AI_SYSTEM.md strictly.

Task:
[feature]

First ANALYZE, then PLAN, then IMPLEMENT, then VERIFY.
Keep changes minimal and in-scope.
```

## 4) Debug Bug

```text
Follow docs/IAI_FOUNDATION_AI_SYSTEM.md strictly.

Bug:
[error details]

Find root cause first.
Apply minimal fix only.
Then VERIFY.
```

## 5) Reviewer Mode

```text
Follow docs/IAI_FOUNDATION_AI_SYSTEM.md strictly.

Mode: REVIEWER

Review these files:
[file list]

Output only issues, risks, and minimal fixes.
No broad refactor.
```

## 6) Architect Mode

```text
Follow docs/IAI_FOUNDATION_AI_SYSTEM.md strictly.

Mode: ARCHITECT

Task:
[design problem]

No code.
Provide ANALYZE + PLAN only.
```

## 7) Docs Mode

```text
Follow docs/IAI_FOUNDATION_AI_SYSTEM.md strictly.

Mode: DOCS

Task:
[docs task]

Write concise, structured documentation only.
```

## 8) Runtime/API Task (Scoped)

```text
Follow docs/IAI_FOUNDATION_AI_SYSTEM.md strictly.

Task:
[runtime or api task]

Respect locked structure:
- app -> frontend
- api -> backend
- packages -> shared logic
- infra -> infrastructure
- docs -> documentation

No cross-layer mixing.
```
