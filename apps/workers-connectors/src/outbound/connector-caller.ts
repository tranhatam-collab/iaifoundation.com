export interface ConnectorCallerResult {
  success: boolean;
  response?: Record<string, unknown>;
  error?: string;
  latency_ms: number;
}

export async function callConnector(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: Record<string, unknown>,
  timeoutMs: number = 10000,
): Promise<ConnectorCallerResult> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        latency_ms: latencyMs,
      };
    }

    const data = await response.json() as Record<string, unknown>;
    return {
      success: true,
      response: data,
      latency_ms: latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: latencyMs,
    };
  }
}
