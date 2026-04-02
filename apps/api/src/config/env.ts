export type EnvName = 'development' | 'staging' | 'production';

export interface EnvConfig {
  ENVIRONMENT: EnvName;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  JWT_SECRET: string;
  JWT_EXPIRY_SECONDS: number;
  MAX_RUN_TIMEOUT_MS: number;
  DEFAULT_APPROVAL_EXPIRY_HOURS: number;
  PROOF_ARTIFACT_TTL_DAYS: number;
  AUDIT_RETENTION_DAYS: number;
  RATE_LIMIT_PER_MINUTE: number;
  ENABLE_STABLECOIN: boolean;
  ENABLE_ADVANCED_DEVICE_GATEWAYS: boolean;
  ENABLE_AI_ASSIST: boolean;
}

export function loadConfig(env: Record<string, string | undefined>): EnvConfig {
  const environment = (env.ENVIRONMENT || 'development') as EnvName;

  return {
    ENVIRONMENT: environment,
    LOG_LEVEL: (env.LOG_LEVEL || (environment === 'production' ? 'info' : 'debug')) as EnvConfig['LOG_LEVEL'],
    JWT_SECRET: env.JWT_SECRET || 'dev-secret-change-in-production',
    JWT_EXPIRY_SECONDS: parseInt(env.JWT_EXPIRY_SECONDS || '3600', 10),
    MAX_RUN_TIMEOUT_MS: parseInt(env.MAX_RUN_TIMEOUT_MS || '3600000', 10),
    DEFAULT_APPROVAL_EXPIRY_HOURS: parseInt(env.DEFAULT_APPROVAL_EXPIRY_HOURS || '24', 10),
    PROOF_ARTIFACT_TTL_DAYS: parseInt(env.PROOF_ARTIFACT_TTL_DAYS || '365', 10),
    AUDIT_RETENTION_DAYS: parseInt(env.AUDIT_RETENTION_DAYS || '2555', 10),
    RATE_LIMIT_PER_MINUTE: parseInt(env.RATE_LIMIT_PER_MINUTE || '60', 10),
    ENABLE_STABLECOIN: env.ENABLE_STABLECOIN === 'true',
    ENABLE_ADVANCED_DEVICE_GATEWAYS: env.ENABLE_ADVANCED_DEVICE_GATEWAYS === 'true',
    ENABLE_AI_ASSIST: env.ENABLE_AI_ASSIST === 'true',
  };
}

export function isFeatureEnabled(config: EnvConfig, feature: 'stablecoin' | 'advanced_device_gateways' | 'ai_assist'): boolean {
  switch (feature) {
    case 'stablecoin': return config.ENABLE_STABLECOIN;
    case 'advanced_device_gateways': return config.ENABLE_ADVANCED_DEVICE_GATEWAYS;
    case 'ai_assist': return config.ENABLE_AI_ASSIST;
    default: return false;
  }
}
