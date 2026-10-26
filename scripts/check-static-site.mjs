import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const outputDir = resolve(rootDir, '.wrangler/pages-build');
const failures = [];

if (!existsSync(outputDir)) {
  fail('build', 'missing .wrangler/pages-build; run npm run build first');
  finish();
}

const htmlFiles = walk(outputDir).filter((file) => extname(file) === '.html');
const expectedRoutes = [
  '/',
  '/404.html',
  '/contact/',
  '/docs/',
  '/docs/language-seo-standard/',
  '/docs/locale-seo-brief-template/',
  '/docs/multilingual-release-qa-checklist/',
  '/partners/',
  '/privacy/',
  '/sign-in/',
  '/support/',
  '/terms/',
  '/vi/',
  '/vi/docs/',
  '/vi/docs/language-seo-standard/',
  '/vi/docs/locale-seo-brief-template/',
  '/vi/docs/multilingual-release-qa-checklist/',
  '/vi/partners/',
];

for (const route of expectedRoutes) {
  const file = routeToFile(route);
  if (!existsSync(file)) fail(route, 'missing generated route');
}

for (const file of htmlFiles) {
  checkHtml(file);
  checkRootMirror(file);
}
checkLocaleParity();
checkCss();
checkHeaders();
finish();

function checkHtml(file) {
  const html = readFileSync(file, 'utf8');
  const relative = relativePath(file);
  const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;
  const sectionLabelCount = (html.match(/class="section-label"/g) || []).length;

  requireMatch(html, /<html lang="[a-z]{2}(?:-[A-Z]{2})?">/, relative, 'missing valid html lang');
  requireMatch(html, /<title>[^<]+<\/title>/, relative, 'missing title');
  requireMatch(html, /<meta name="description" content="[^"]+" \/>/, relative, 'missing meta description');
  requireMatch(html, /<link rel="canonical" href="https:\/\/iaifoundation\.com\/[^"]*" \/>/, relative, 'missing canonical URL');
  requireMatch(html, /<a class="skip-link" href="#main-content">/, relative, 'missing skip link');
  requireMatch(html, /<main[^>]*id="main-content"/, relative, 'missing main landmark');
  if (h1Count !== 1) fail(relative, `expected exactly 1 h1, found ${h1Count}`);
  for (const tag of ['main', 'header', 'footer', 'nav', 'section', 'article', 'figure', 'div', 'ul', 'li']) {
    const opens = (html.match(new RegExp(`<${tag}(?:\\s|>)`, 'gi')) || []).length;
    const closes = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    if (opens !== closes) fail(relative, `unbalanced <${tag}> elements: ${opens} open, ${closes} close`);
  }
  if (sectionLabelCount > 1) fail(relative, `too many repeated section labels (${sectionLabelCount})`);
  if (/\sstyle="/i.test(html)) fail(relative, 'inline style attribute is not allowed');
  if (/<form(?:\s|>)/i.test(html)) fail(relative, 'form found without an active server-side workflow');
  if (/api\.iaifoundation\.com|magic-link|auth\/google/i.test(html)) fail(relative, 'inactive private-runtime endpoint exposed');
  if (/[—–]/.test(stripJsonLd(html))) fail(relative, 'visible copy contains a prohibited long dash');
  if (/\.\.\./.test(stripJsonLd(html))) fail(relative, 'visible copy uses three periods instead of an ellipsis');

  const scriptOpenCount = (html.match(/<script\b/gi) || []).length;
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  if (scripts.length !== scriptOpenCount) fail(relative, 'malformed or unclosed script element');

  for (const script of scripts) {
    const attrs = script[1];
    const body = script[2].trim();
    if (!/\ssrc="/.test(attrs) && body && !/type="application\/ld\+json"/.test(attrs)) {
      fail(relative, 'inline executable script is not allowed by CSP');
    }
  }

  for (const image of html.matchAll(/<img\s+([^>]+)>/gi)) {
    const attrs = image[1];
    if (!/\salt="[^"]*"/.test(` ${attrs}`)) fail(relative, 'image missing alt text');
    if (!/\swidth="\d+"/.test(` ${attrs}`) || !/\sheight="\d+"/.test(` ${attrs}`)) {
      fail(relative, 'image missing explicit dimensions');
    }
  }

  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    checkInternalLink(file, html, match[1]);
  }
}

function checkRootMirror(file) {
  const relative = relativePath(file);
  const mirror = resolve(rootDir, relative);
  if (!existsSync(mirror)) {
    fail(relative, 'missing root deployment snapshot');
    return;
  }
  if (readFileSync(mirror, 'utf8') !== readFileSync(file, 'utf8')) {
    fail(relative, 'root deployment snapshot differs from Pages artifact');
  }
}

function checkInternalLink(sourceFile, sourceHtml, href) {
  if (/^(?:https?:|mailto:|tel:)/.test(href)) return;
  const [pathname, hash = ''] = href.split('#', 2);
  let targetFile = sourceFile;
  if (pathname) {
    if (!pathname.startsWith('/')) return;
    targetFile = routeToFile(pathname.split('?')[0]);
    if (!existsSync(targetFile)) {
      fail(relativePath(sourceFile), `broken internal link: ${href}`);
      return;
    }
  }
  if (hash) {
    const targetHtml = targetFile === sourceFile ? sourceHtml : readFileSync(targetFile, 'utf8');
    const escapedHash = escapeRegExp(decodeURIComponent(hash));
    if (!new RegExp(`\\sid="${escapedHash}"`).test(targetHtml)) {
      fail(relativePath(sourceFile), `missing anchor target: ${href}`);
    }
  }
}

function checkLocaleParity() {
  const en = JSON.parse(readFileSync(resolve(rootDir, 'content/en.json'), 'utf8'));
  const vi = JSON.parse(readFileSync(resolve(rootDir, 'content/vi.json'), 'utf8'));
  const enKeys = Object.keys(en.pages).filter((key) => key !== 'notFound').sort();
  const viKeys = Object.keys(vi.pages).filter((key) => key !== 'notFound').sort();
  if (JSON.stringify(enKeys) !== JSON.stringify(viKeys)) fail('content', 'English and Vietnamese route keys differ');

  for (const locale of [en, vi]) {
    for (const [pageKey, page] of Object.entries(locale.pages)) {
      scanDuplicateArrays(page, `${locale.locale}.${pageKey}`);
    }
  }
}

function scanDuplicateArrays(value, label) {
  if (Array.isArray(value)) {
    const strings = value.filter((item) => typeof item === 'string');
    if (new Set(strings).size !== strings.length) fail(label, 'duplicate copy found in an array');
    value.forEach((item, index) => scanDuplicateArrays(item, `${label}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) scanDuplicateArrays(child, `${label}.${key}`);
  }
}

function checkCss() {
  const css = readFileSync(resolve(outputDir, 'style.css'), 'utf8');
  if (/transition\s*:\s*all\b/.test(css)) fail('style.css', 'transition: all is not allowed');
  if (/outline\s*:\s*none\b/.test(css)) fail('style.css', 'outline: none is not allowed');
  if (/height\s*:\s*100vh\b/.test(css)) fail('style.css', 'use dynamic viewport units instead of 100vh');
  requireMatch(css, /@media \(prefers-reduced-motion: reduce\)/, 'style.css', 'missing reduced-motion handling');
  requireMatch(css, /:focus-visible/, 'style.css', 'missing visible focus style');
}

function checkHeaders() {
  const headers = readFileSync(resolve(outputDir, '_headers'), 'utf8');
  requireMatch(headers, /Content-Security-Policy:/, '_headers', 'missing CSP');
  if (/unsafe-inline/.test(headers)) fail('_headers', 'CSP must not allow unsafe-inline');
  requireMatch(headers, /frame-ancestors 'none'/, '_headers', 'clickjacking protection must fail closed');
}

function routeToFile(route) {
  const clean = route.split('?')[0];
  if (clean === '/') return resolve(outputDir, 'index.html');
  if (clean.endsWith('.html') || extname(clean)) return resolve(outputDir, `.${clean}`);
  return resolve(outputDir, `.${clean.endsWith('/') ? clean : `${clean}/`}index.html`);
}

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const file = join(directory, entry);
    return statSync(file).isDirectory() ? walk(file) : [file];
  });
}

function stripJsonLd(html) {
  return html.replace(
    /<script\b(?=[^>]*\btype="application\/ld\+json")[^>]*>[\s\S]*?<\/script\s*>/gi,
    '',
  );
}

function requireMatch(value, pattern, label, message) {
  if (!pattern.test(value)) fail(label, message);
}

function relativePath(file) {
  return file.slice(outputDir.length + 1);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fail(label, message) {
  failures.push(`${label}: ${message}`);
}

function finish() {
  if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join('\n'));
    process.exit(1);
  }
  console.log(`Static site checks passed for ${htmlFiles?.length || 0} HTML files.`);
}
