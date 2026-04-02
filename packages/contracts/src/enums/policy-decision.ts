export const POLICY_DECISION = {
  ALLOW: 'allow',
  DENY: 'deny',
  ALLOW_WITH_APPROVAL: 'allow_with_approval',
  ALLOW_WITH_LIMITS: 'allow_with_limits',
  ALLOW_WITH_ADDITIONAL_PROOF: 'allow_with_additional_proof',
  ESCALATE_TO_HUMAN: 'escalate_to_human',
  QUARANTINE: 'quarantine',
} as const;

export type PolicyDecision = (typeof POLICY_DECISION)[keyof typeof POLICY_DECISION];
