import type { MiddlewareHandler } from 'hono';
import type { Env } from '../index.js';
import { AppError, ERROR_CODES } from '@intent-os/contracts/api';
import { isFeatureEnabled, loadConfig } from '../config/env.js';

export function featureFlagMiddleware(feature: 'stablecoin' | 'advanced_device_gateways' | 'ai_assist'): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const config = loadConfig(c.env as unknown as Record<string, string | undefined>);

    if (!isFeatureEnabled(config, feature)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Feature '${feature}' is not enabled for this environment`,
        { feature, environment: config.ENVIRONMENT },
        403,
      );
    }

    await next();
  };
}
