export interface PaymentIntent {
  id: string;
  run_id: string;
  step_id: string;
  payment_type: string;
  amount: number;
  currency_or_asset: string;
  beneficiary_id: string;
  funding_source_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SettlementRecord {
  id: string;
  payment_intent_id: string;
  provider: string;
  provider_txn_ref: string;
  network_ref: string | null;
  amount: number;
  asset: string;
  status: string;
  fee_amount: number | null;
  settled_at: string | null;
  created_at: string;
}

export interface Beneficiary {
  id: string;
  tenant_id: string;
  type: string;
  name: string;
  country_code: string | null;
  payout_method_ref: string | null;
  wallet_address_ref: string | null;
  verification_status: string;
  risk_score: number | null;
  created_at: string;
}

export interface WalletProfile {
  id: string;
  tenant_id: string;
  workspace_id: string;
  wallet_type: string;
  provider: string;
  custody_mode: string;
  supported_assets: string;
  settlement_currency: string | null;
  status: string;
  policy_profile_id: string | null;
  created_at: string;
  updated_at: string;
}
