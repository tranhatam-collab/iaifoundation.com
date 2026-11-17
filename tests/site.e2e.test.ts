import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const buildRoot = join(process.cwd(), '.wrangler', 'pages-build');

async function routeHtml(route: string): Promise<string> {
  const relativePath = route === '/'
    ? 'index.html'
    : route.endsWith('.html')
      ? route.slice(1)
      : join(route.slice(1), 'index.html');
  return readFile(join(buildRoot, relativePath), 'utf8');
}

const publicRoutes = [
  '/',
  '/404.html',
  '/contact/',
  '/docs/',
  '/docs/language-seo-standard/',
  '/docs/locale-seo-brief-template/',
  '/docs/multilingual-release-qa-checklist/',
  '/partners/',
  '/support/',
  '/privacy/',
  '/terms/',
  '/sign-in/',
  '/vi/',
  '/vi/docs/',
  '/vi/docs/language-seo-standard/',
  '/vi/docs/locale-seo-brief-template/',
  '/vi/docs/multilingual-release-qa-checklist/',
  '/vi/partners/',
];

describe('generated public website', () => {
  test.each(publicRoutes)('%s has a navigable, semantic shell', async (route) => {
    const html = await routeHtml(route);

    expect(html).toContain('href="#main-content"');
    expect(html).toMatch(/<main[^>]*id="main-content"/);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).not.toMatch(/\sstyle=/);
  });

  test('home uses the local editorial hero asset with fixed dimensions', async () => {
    const html = await routeHtml('/');

    expect(html).toMatch(
      /<img[^>]+src="\/assets\/intent-governance-hero\.jpg\?v=[a-f0-9]+"[^>]+width="1600"[^>]+height="650"[^>]+fetchpriority="high"/,
    );
  });

  test('contact is an honest mail link, not a simulated waitlist', async () => {
    const html = await routeHtml('/contact/');

    expect(html).toContain('mailto:hello@iaifoundation.com');
    expect(html).not.toContain('<form');
    expect(html).not.toMatch(/waitlist/i);
  });

  test('sign-in clearly reports that private runtime access is unavailable', async () => {
    const html = await routeHtml('/sign-in/');

    expect(html).toContain('Private runtime access is not available');
    expect(html).not.toContain('/api/auth/');
    expect(html).not.toContain('<form');
  });

  test('localized pages expose reciprocal alternates', async () => {
    const english = await routeHtml('/docs/language-seo-standard/');
    const vietnamese = await routeHtml('/vi/docs/language-seo-standard/');

    expect(english).toContain('hreflang="vi" href="https://iaifoundation.com/vi/docs/language-seo-standard/"');
    expect(vietnamese).toContain('hreflang="en" href="https://iaifoundation.com/docs/language-seo-standard/"');
  });
});
