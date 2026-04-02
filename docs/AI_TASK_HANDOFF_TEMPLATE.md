# AI Task Handoff Template

Use this template when handing a task to Copilot/agents.

Governance index: `docs/AI_GOVERNANCE_INDEX.md`

## 1) Task Header

- Task ID:
- Owner:
- Date:
- Mode: (ARCHITECT | BUILDER | DEBUGGER | REVIEWER | DOCS)

## 2) Objective

- Goal:
- Expected outcome:
- Definition of done:

## 3) Scope

- In scope:
- Out of scope:
- Allowed files/folders:
- Forbidden files/folders:

## 4) Constraints

- Follow: `docs/IAI_FOUNDATION_AI_SYSTEM.md`
- Architecture constraints:
- Performance constraints:
- Security constraints:
- Token budget constraints:

## 5) Inputs

- Related docs:
- Existing files to read first:
- Known assumptions:
- Open questions:

## 6) Required Workflow

1. ANALYZE
2. PLAN
3. IMPLEMENT
4. VERIFY

## 7) Output Requirements

- Include filename for each changed file
- Full file output only when requested
- No unrelated refactor
- Minimal changes only

## 8) Verification Checklist

- Typecheck status:
- Test status:
- Risk points:
- Rollback notes:

## 9) Handoff Summary

- What changed:
- Why changed:
- Remaining risks:
- Next recommended step:

---

## Quick Usage Prompt

```text
Follow docs/IAI_FOUNDATION_AI_SYSTEM.md strictly.

Use docs/AI_TASK_HANDOFF_TEMPLATE.md.

Start with ANALYZE only.

Task:
[paste task details]
```
