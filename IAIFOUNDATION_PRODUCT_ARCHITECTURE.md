# IAIFoundation.com — Product Architecture

## Cloudflare-first mapping

- Public website: Cloudflare Pages
- API / edge services: Cloudflare Workers
- Durable execution: Cloudflare Workflows
- Coordination / hot state: Durable Objects
- Queue backbone: Cloudflare Queues
- Relational control data: D1
- Binary evidence: R2
- Semantic retrieval: Vectorize or equivalent external vector DB

## Agent roles

- Planner Agent
- Policy Interpreter
- Verifier Agent
- Executor Agent
- Summarizer / Reporter

## Runtime flow

1. User submits intent
2. Intent normalized into structured form
3. Policy pre-check runs
4. Planner builds execution draft
5. Approval graph resolved
6. Required approvals collected
7. Workflow execution begins
8. Actions hit external systems or devices
9. Proof collected after each critical step
10. Final verification runs
11. Outcome bundle generated
12. Logs, receipts, and proof recorded
