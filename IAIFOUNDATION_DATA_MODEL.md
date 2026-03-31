# IAIFoundation.com — Data Model Foundation

## Core entities

- workspace
- user
- membership
- role
- policy
- intent
- plan
- approval_request
- approval_decision
- run
- run_step
- proof_bundle
- proof_artifact
- integration
- device
- wallet_account
- payment_instruction
- payment_event
- audit_event

## Data design rules

1. All critical objects need workspace scope.
2. All critical transitions should emit audit events.
3. Mutable state must be easy to inspect.
4. Proof artifacts should live in object storage with metadata in relational tables.
5. External provider references should always be stored.
6. Deletion should be soft for critical operational records.
