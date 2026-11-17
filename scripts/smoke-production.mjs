const baseUrl = new URL(process.env.SMOKE_BASE_URL || 'https://iaifoundation.com');
const retries = positiveInteger(process.env.SMOKE_RETRIES, 1);
const retryDelayMs = positiveInteger(process.env.SMOKE_RETRY_DELAY_MS, 2_000);
const expectedRoutes = [
  '/',
  '/docs/',
  '/partners/',
  '/vi/',
  '/vi/docs/',
  '/contact/',
  '/support/',
  '/privacy/',
  '/terms/',
  '/sign-in/',
];

let lastError;
for (let attempt = 1; attempt <= retries; attempt += 1) {
  try {
    await verifyProduction();
    console.log(`Production smoke PASS: ${baseUrl.origin} (${expectedRoutes.length} public routes plus 404 and asset checks).`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }
}

console.error(lastError instanceof Error ? lastError.message : String(lastError));
process.exit(1);

async function verifyProduction() {
  for (const route of expectedRoutes) {
    const response = await fetch(new URL(route, baseUrl), { redirect: 'follow' });
    require(response.status === 200, `${route} returned ${response.status}`);
    require(response.headers.get('content-type')?.startsWith('text/html'), `${route} did not return HTML`);
  }

  const missing = await fetch(new URL('/release-smoke-not-found', baseUrl), { redirect: 'follow' });
  require(missing.status === 404, `unknown route returned ${missing.status}, expected 404`);

  const home = await fetch(new URL('/', baseUrl));
  const homeHtml = await home.text();
  const csp = home.headers.get('content-security-policy') || '';
  require(homeHtml.includes('Turn intent into real-world outcomes.'), 'home release marker is missing');
  require(homeHtml.includes('/assets/intent-governance-hero.jpg?v='), 'hashed hero asset is missing');
  require(!homeHtml.includes('<form'), 'home contains an inactive form');
  require(csp.includes("frame-ancestors 'none'"), 'CSP frame-ancestors protection is missing');
  require(!csp.includes('unsafe-inline'), 'CSP permits unsafe-inline');

  const signIn = await fetch(new URL('/sign-in/', baseUrl));
  const signInHtml = await signIn.text();
  require(signInHtml.includes('Private runtime access is not available.'), 'sign-in containment copy is missing');
  require(!signInHtml.includes('<form'), 'sign-in contains a form');
  require(!/api\.iaifoundation\.com|magic-link|auth\/google/i.test(signInHtml), 'sign-in exposes a private runtime endpoint');

  const heroPath = homeHtml.match(/\/assets\/intent-governance-hero\.jpg\?v=[a-f0-9]+/)?.[0];
  require(Boolean(heroPath), 'unable to resolve hero asset URL');
  const hero = await fetch(new URL(heroPath, baseUrl));
  require(hero.status === 200, `hero asset returned ${hero.status}`);
  require(hero.headers.get('content-type') === 'image/jpeg', 'hero asset content type is not image/jpeg');
}

function require(condition, message) {
  if (!condition) throw new Error(`Production smoke failed: ${message}`);
}

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
