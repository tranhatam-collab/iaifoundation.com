const apiBaseUrl = new URL(process.env.API_SMOKE_BASE_URL || 'https://api.iaifoundation.com');
const retries = positiveInteger(process.env.SMOKE_RETRIES, 1);
const retryDelayMs = positiveInteger(process.env.SMOKE_RETRY_DELAY_MS, 2_000);

let lastError;
for (let attempt = 1; attempt <= retries; attempt += 1) {
  try {
    await verifyContainment();
    console.log(`API containment smoke PASS: ${apiBaseUrl.origin}`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }
}

console.error(lastError instanceof Error ? lastError.message : String(lastError));
process.exit(1);

async function verifyContainment() {
  const health = await fetch(new URL('/health', apiBaseUrl));
  require(health.status === 200, `/health returned ${health.status}`);
  require(health.headers.get('content-type')?.startsWith('application/json'), '/health did not return JSON');
  const healthPayload = await health.json();
  require(healthPayload?.ok === true, '/health did not report ok=true');

  for (const headers of [{}, { Authorization: 'Bearer release-smoke-must-not-authorize' }]) {
    const runtime = await fetch(new URL('/v1/tenants', apiBaseUrl), { headers });
    require(runtime.status === 503, `/v1/tenants returned ${runtime.status}, expected 503`);
    require(runtime.headers.get('content-type')?.startsWith('application/json'), '/v1/tenants did not return JSON');
    const payload = await runtime.json();
    require(payload?.error?.code === 'SERVICE_UNAVAILABLE', '/v1/tenants did not return SERVICE_UNAVAILABLE');
  }
}

function require(condition, message) {
  if (!condition) throw new Error(`API containment smoke failed: ${message}`);
}

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
