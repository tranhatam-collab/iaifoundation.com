-- 0003_payments.sql
-- Wallet profiles, funding sources, beneficiaries, payment_intents, payment_attempts, settlement_records, payment_reconciliations, balance_snapshots

CREATE TABLE IF NOT EXISTS wallet_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  wallet_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  custody_mode TEXT NOT NULL,
  supported_assets_json TEXT,
  settlement_currency TEXT,
  status TEXT NOT NULL,
  policy_profile_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS funding_sources (
  id TEXT PRIMARY KEY,
  wallet_profile_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_ref TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (wallet_profile_id) REFERENCES wallet_profiles(id)
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  country_code TEXT,
  payout_method_ref TEXT,
  wallet_address_ref TEXT,
  verification_status TEXT NOT NULL,
  risk_score REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_intents (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency_or_asset TEXT NOT NULL,
  beneficiary_id TEXT NOT NULL,
  funding_source_id TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_attempts (
  id TEXT PRIMARY KEY,
  payment_intent_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_txn_ref TEXT,
  status TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  attempted_at TEXT NOT NULL,
  error_reason TEXT,
  FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(id)
);

CREATE TABLE IF NOT EXISTS settlement_records (
  id TEXT PRIMARY KEY,
  payment_intent_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_txn_ref TEXT NOT NULL,
  network_ref TEXT,
  amount NUMERIC NOT NULL,
  asset TEXT NOT NULL,
  status TEXT NOT NULL,
  fee_amount NUMERIC,
  settled_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (provider, provider_txn_ref),
  FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(id)
);

CREATE TABLE IF NOT EXISTS payment_reconciliations (
  id TEXT PRIMARY KEY,
  payment_intent_id TEXT NOT NULL,
  expected_amount NUMERIC NOT NULL,
  actual_amount NUMERIC,
  status TEXT NOT NULL,
  reconciled_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(id)
);

CREATE TABLE IF NOT EXISTS balance_snapshots (
  id TEXT PRIMARY KEY,
  wallet_profile_id TEXT NOT NULL,
  asset TEXT NOT NULL,
  balance NUMERIC NOT NULL,
  snapshot_at TEXT NOT NULL,
  FOREIGN KEY (wallet_profile_id) REFERENCES wallet_profiles(id)
);
