import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const outputDir = resolve(rootDir, '.wrangler/pages-build');
const buildDate = new Date().toISOString().slice(0, 10);
const assetUrls = {
  app: `/app.js?v=${hashFile(resolve(rootDir, 'app.js'))}`,
  style: `/style.css?v=${hashFile(resolve(rootDir, 'style.css'))}`,
};

const localeFiles = ['en', 'vi'];
const locales = Object.fromEntries(
  localeFiles.map((code) => [code, JSON.parse(readFileSync(resolve(rootDir, 'content', `${code}.json`), 'utf8'))]),
);
const defaultLocale = 'en';
const routeKeys = Object.keys(locales[defaultLocale].pages);

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

copyStaticAssets();
renderPublicPages();
writeFileSync(resolve(outputDir, 'site.webmanifest'), renderManifest(), 'utf8');
writeFileSync(resolve(outputDir, 'sitemap.xml'), renderSitemap(), 'utf8');
mkdirSync(resolve(outputDir, 'locales'), { recursive: true });
writeFileSync(resolve(outputDir, 'locales/site.locales.json'), renderLocaleManifest(), 'utf8');

console.log(outputDir);

function copyStaticAssets() {
  const rootFiles = ['_headers', '_redirects', 'robots.txt', 'favicon.svg', 'og-image.svg', 'CNAME', 'app.js', 'style.css'];
  for (const file of rootFiles) {
    copyFileSync(resolve(rootDir, file), resolve(outputDir, file));
  }

  if (existsSync(resolve(rootDir, 'docs'))) {
    copyDirectoryFiltered(resolve(rootDir, 'docs'), resolve(outputDir, 'docs'), (sourcePath) => !sourcePath.endsWith('.html'));
  }

  for (const file of ['IAIFOUNDATION_CLOUDFLARE_GITHUB_SETUP.md', 'IAIFOUNDATION_DATA_MODEL.md', 'IAIFOUNDATION_INFORMATION_ARCHITECTURE.md', 'IAIFOUNDATION_LANGUAGE_AND_MULTILINGUAL_SEO_STANDARD.md', 'IAIFOUNDATION_MASTER_SPEC.md', 'IAIFOUNDATION_POLICY_ENGINE.md', 'IAIFOUNDATION_PRODUCT_ARCHITECTURE.md', 'IAIFOUNDATION_ROADMAP_12_24_MONTHS.md', 'IAIFOUNDATION_WEB_CONTENT_AND_COPY.md', 'LOCALE_SEO_BRIEF_TEMPLATE.md', 'MULTILINGUAL_RELEASE_QA_CHECKLIST.md']) {
    copyFileSync(resolve(rootDir, file), resolve(outputDir, file));
  }

  if (existsSync(resolve(rootDir, 'content'))) {
    cpSync(resolve(rootDir, 'content'), resolve(outputDir, 'content'), { recursive: true });
  }
}

function renderPublicPages() {
  for (const localeCode of localeFiles) {
    const locale = locales[localeCode];
    for (const [pageKey, page] of Object.entries(locale.pages)) {
      if (pageKey === 'notFound' && localeCode !== defaultLocale) continue;
      const html = renderPage(localeCode, pageKey, page);
      writeRouteFile(page.path, html);
    }
  }
}

function renderPage(localeCode, pageKey, page) {
  const locale = locales[localeCode];
  const canonical = absoluteUrl(page.path);
  const alternates = pageKey === 'notFound' ? [] : localeFiles.map((code) => ({
    hreflang: code,
    href: absoluteUrl(locales[code].pages[pageKey].path),
  }));
  const xDefault = pageKey === 'notFound' ? null : absoluteUrl(locales[defaultLocale].pages[pageKey].path);
  const bodyAttrs = [
    `data-menu-open-text="${escapeAttribute(locale.ui.menuOpenText)}"`,
    `data-menu-close-text="${escapeAttribute(locale.ui.menuCloseText)}"`,
    `data-menu-open-aria="${escapeAttribute(locale.ui.menuOpenAria)}"`,
    `data-menu-close-aria="${escapeAttribute(locale.ui.menuCloseAria)}"`,
    `data-waitlist-success="${escapeAttribute(locale.ui.waitlistSuccess)}"`,
  ].join(' ');

  const headParts = [
    '<!doctype html>',
    `<html lang="${escapeAttribute(locale.htmlLang)}">`,
    '<head>',
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width,initial-scale=1" />',
    `  <title>${escapeHtml(page.title)}</title>`,
    `  <meta name="description" content="${escapeAttribute(page.description)}" />`,
    `  <meta name="robots" content="${pageKey === 'notFound' ? 'noindex,follow' : 'index,follow,max-image-preview:large'}" />`,
    `  <meta name="author" content="${escapeAttribute(locale.site.name)}" />`,
    '  <meta name="format-detection" content="telephone=no" />',
    `  <meta name="theme-color" content="${escapeAttribute(locale.site.themeColor)}" />`,
    `  <meta property="og:title" content="${escapeAttribute(page.ogTitle || page.title)}" />`,
    `  <meta property="og:description" content="${escapeAttribute(page.ogDescription || page.description)}" />`,
    '  <meta property="og:type" content="website" />',
    `  <meta property="og:url" content="${escapeAttribute(canonical)}" />`,
    `  <meta property="og:site_name" content="${escapeAttribute(locale.site.name)}" />`,
    `  <meta property="og:locale" content="${escapeAttribute(locale.ogLocale)}" />`,
    `  <meta property="og:image" content="${escapeAttribute(absoluteUrl(locale.site.ogImage))}" />`,
    `  <meta property="og:image:alt" content="${escapeAttribute(page.ogImageAlt || locale.site.name)}" />`,
    '  <meta name="twitter:card" content="summary_large_image" />',
    `  <meta name="twitter:title" content="${escapeAttribute(page.twitterTitle || page.title)}" />`,
    `  <meta name="twitter:description" content="${escapeAttribute(page.twitterDescription || page.description)}" />`,
    `  <link rel="canonical" href="${escapeAttribute(canonical)}" />`,
  ];

  if (alternates.length) {
    for (const alternate of alternates) {
      headParts.push(`  <link rel="alternate" hreflang="${alternate.hreflang}" href="${escapeAttribute(alternate.href)}" />`);
    }
    headParts.push(`  <link rel="alternate" hreflang="x-default" href="${escapeAttribute(xDefault)}" />`);
  }

  headParts.push(
    `  <link rel="icon" type="image/svg+xml" href="${escapeAttribute(locale.site.favicon)}" />`,
    `  <link rel="manifest" href="${escapeAttribute(locale.site.manifest)}" />`,
    `  <link rel="stylesheet" href="${escapeAttribute(assetUrls.style)}" />`,
    `  <script type="application/ld+json">${renderSchema(localeCode, pageKey, page)}</script>`,
    '</head>',
    `<body ${bodyAttrs}>`,
    `  <a class="skip-link" href="#main-content">${escapeHtml(locale.ui.skipLink)}</a>`,
    renderHeader(localeCode, pageKey, page),
    renderMain(localeCode, pageKey, page),
    renderFooter(localeCode, page.footerKey || 'docs'),
    `  <script src="${escapeAttribute(assetUrls.app)}"></script>`,
    '</body>',
    '</html>',
  );

  return headParts.join('\n');
}

function renderHeader(localeCode, pageKey, page) {
  const locale = locales[localeCode];
  const navKey = page.template === 'home' ? 'home' : 'section';
  const navItems = locale.navigation[navKey] || [];
  const alternatePath = pageKey === 'notFound' ? (localeCode === 'vi' ? '/' : '/vi/') : locales[getAlternateLocale(localeCode)].pages[pageKey].path;
  const currentPath = page.path;

  return [
    '  <header class="site-header">',
    '    <div class="container nav">',
    `      <a class="brand" href="${escapeAttribute(localeCode === 'en' ? '/' : '/vi/')}">${escapeHtml(locale.site.name)}</a>`,
    '      <div class="nav-actions">',
    `        <nav class="desktop-nav" aria-label="${escapeAttribute(locale.ui.primaryNavLabel)}">`,
    ...navItems.map((item) => `          <a href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a>`),
    '        </nav>',
    `        <div class="lang-switch" aria-label="${escapeAttribute(locale.ui.languageSwitcherLabel)}">`,
    `          <a class="lang-link${localeCode === 'en' ? ' is-active' : ''}" href="${escapeAttribute(localeCode === 'en' ? currentPath : alternatePath)}" hreflang="en" lang="en"${localeCode === 'en' ? ' aria-current="page"' : ''}>🇺🇸 English</a>`,
    `          <a class="lang-link${localeCode === 'vi' ? ' is-active' : ''}" href="${escapeAttribute(localeCode === 'vi' ? currentPath : alternatePath)}" hreflang="vi" lang="vi"${localeCode === 'vi' ? ' aria-current="page"' : ''}>🇻🇳 Tiếng Việt</a>`,
    '        </div>',
    `        <button class="menu-toggle" aria-expanded="false" aria-controls="mobile-menu" aria-label="${escapeAttribute(locale.ui.menuOpenAria)}">${escapeHtml(locale.ui.menuOpenText)}</button>`,
    '      </div>',
    '    </div>',
    '    <div id="mobile-menu" class="mobile-menu container" hidden style="display:none;">',
    ...navItems.map((item) => `      <a href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a>`),
    '    </div>',
    '  </header>',
  ].join('\n');
}

function renderMain(localeCode, pageKey, page) {
  switch (page.template) {
    case 'home':
      return renderHome(localeCode, page);
    case 'docsHub':
      return renderDocsHub(page);
    case 'partners':
      return renderPartners(page);
    case 'docArticle':
      return renderDocArticle(localeCode, page);
    case 'notFound':
      return renderNotFound(page);
    default:
      throw new Error(`Unsupported template: ${page.template}`);
  }
}

function renderHome(localeCode, page) {
  const locale = locales[localeCode];
  const sections = page.sections;
  return [
    '  <main id="main-content">',
    '    <section class="hero">',
    '      <div class="container hero-grid">',
    '        <div>',
    `          <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>`,
    `          <h1>${escapeHtml(page.h1)}</h1>`,
    `          <p class="lead">${escapeHtml(page.lead)}</p>`,
    '          <div class="hero-actions">',
    `            <a class="button primary" href="${escapeAttribute(page.primaryCta.href)}">${escapeHtml(page.primaryCta.label)}</a>`,
    `            <a class="button secondary" href="${escapeAttribute(page.secondaryCta.href)}">${escapeHtml(page.secondaryCta.label)}</a>`,
    '          </div>',
    '        </div>',
    '        <div class="hero-card">',
    ...page.stackItems.map((item) => `          <div class="stack-item">${escapeHtml(item)}</div>`),
    '        </div>',
    '      </div>',
    '    </section>',
    renderTextSection('thesis', sections.thesis),
    renderTextSection('what-is', sections.whatIs, true),
    renderCardSection('architecture', sections.architecture),
    renderListCardSection('use-cases', sections.useCases, true),
    renderTextSection('proof', sections.proof),
    renderListSection('principles', sections.principles, true),
    renderTimelineSection('roadmap', sections.roadmap),
    renderTextSection('builders', sections.builders, true),
    '    <section id="contact" class="section cta-section">',
    '      <div class="container cta-card">',
    '        <div>',
    `          <p class="section-label">${escapeHtml(sections.contact.label)}</p>`,
    `          <h2>${escapeHtml(sections.contact.title)}</h2>`,
    `          <p>${escapeHtml(sections.contact.text)}</p>`,
    '        </div>',
    '        <form id="waitlist-form" class="waitlist-form">',
    `          <input type="email" id="waitlist-email" name="email" placeholder="${escapeAttribute(locale.ui.emailPlaceholder)}" required aria-label="${escapeAttribute(locale.ui.emailLabel)}" />`,
    `          <button type="submit" class="button primary">${escapeHtml(locale.registries.forms.waitlist.submit)}</button>`,
    '        </form>',
    '        <p id="waitlist-message" class="waitlist-message" hidden></p>',
    `        <a class="button secondary" href="${escapeAttribute(sections.contact.emailHref)}">${escapeHtml(sections.contact.emailLabel)}</a>`,
    '      </div>',
    '    </section>',
    '  </main>',
  ].join('\n');
}

function renderDocsHub(page) {
  return [
    '  <main id="main-content">',
    '    <section class="section">',
    '      <div class="container narrow">',
    `        <p class="section-label">${escapeHtml(page.eyebrow)}</p>`,
    `        <h1>${escapeHtml(page.h1)}</h1>`,
    `        <p class="lead">${escapeHtml(page.lead)}</p>`,
    ...(page.summaryNote ? [`        <p class="meta-note">${escapeHtml(page.summaryNote)}</p>`] : []),
    '      </div>',
    '    </section>',
    ...page.groups.map((group, index) => renderDocsGroup(group, index % 2 === 0)),
    '    <section id="contact" class="section cta-section">',
    '      <div class="container cta-card">',
    '        <div>',
    `          <p class="section-label">${escapeHtml(page.contact.label)}</p>`,
    `          <h2>${escapeHtml(page.contact.title)}</h2>`,
    `          <p>${escapeHtml(page.contact.text)}</p>`,
    '        </div>',
    `        <a class="button primary" href="${escapeAttribute(page.contact.button.href)}">${escapeHtml(page.contact.button.label)}</a>`,
    '      </div>',
    '    </section>',
    '  </main>',
  ].join('\n');
}

function renderDocsGroup(group, isAlt) {
  const classes = ['section'];
  if (isAlt) classes.push('alt');
  const containerClass = group.narrow ? 'container narrow' : 'container';
  return [
    `    <section class="${classes.join(' ')}">`,
    `      <div class="${containerClass}">`,
    `        <p class="section-label">${escapeHtml(group.label)}</p>`,
    '        <div class="card-grid">',
    ...group.cards.map((card) => [
      '          <article class="card">',
      `            <h3>${escapeHtml(card.title)}</h3>`,
      `            <p>${escapeHtml(card.text)}</p>`,
      `            <a class="doc-link" href="${escapeAttribute(card.href)}">${escapeHtml(card.linkLabel)}</a>`,
      ...(card.sourceHref ? [`            <a class="doc-link" href="${escapeAttribute(card.sourceHref)}">${escapeHtml(card.sourceLabel)}</a>`] : []),
      '          </article>',
    ].join('\n')),
    '        </div>',
    '      </div>',
    '    </section>',
  ].join('\n');
}

function renderPartners(page) {
  return [
    '  <main id="main-content">',
    '    <section class="hero">',
    '      <div class="container narrow">',
    `        <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>`,
    `        <h1>${escapeHtml(page.h1)}</h1>`,
    `        <p class="lead">${escapeHtml(page.lead)}</p>`,
    '      </div>',
    '    </section>',
    renderCardSection(null, page.partnerTypes, true),
    renderListSection(null, page.offer),
    '    <section id="contact" class="section cta-section">',
    '      <div class="container cta-card">',
    '        <div>',
    `          <p class="section-label">${escapeHtml(page.contact.label)}</p>`,
    `          <h2>${escapeHtml(page.contact.title)}</h2>`,
    `          <p>${escapeHtml(page.contact.text)}</p>`,
    '        </div>',
    `        <a class="button primary" href="${escapeAttribute(page.contact.button.href)}">${escapeHtml(page.contact.button.label)}</a>`,
    '      </div>',
    '    </section>',
    '  </main>',
  ].join('\n');
}

function renderDocArticle(localeCode, page) {
  const locale = locales[localeCode];
  return [
    '  <main id="main-content">',
    '    <section class="hero">',
    '      <div class="container narrow">',
    `        <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>`,
    `        <h1>${escapeHtml(page.h1)}</h1>`,
    `        <p class="lead">${escapeHtml(page.lead)}</p>`,
    `        <p class="meta-note">${escapeHtml(page.summary)}</p>`,
    '      </div>',
    '    </section>',
    ...page.sections.map((section, index) => renderArticleSection(section, index % 2 === 1)),
    '    <section class="section cta-section">',
    '      <div class="container cta-card">',
    '        <div>',
    `          <p class="section-label">${escapeHtml(locale.ui.articleNextStepLabel)}</p>`,
    `          <h2>${escapeHtml(page.sourceDoc.label)}</h2>`,
    `          <p>${escapeHtml(locale.ui.articleSourceNote)}</p>`,
    '        </div>',
    `        <a class="button primary" href="${escapeAttribute(page.sourceDoc.href)}">${escapeHtml(page.sourceDoc.label)}</a>`,
    '      </div>',
    '    </section>',
    ...(page.relatedLinks?.length ? [
      '    <section class="section alt">',
      '      <div class="container narrow">',
      `        <p class="section-label">${escapeHtml(locale.ui.articleRelatedLabel)}</p>`,
      '        <div class="card-grid">',
      ...page.relatedLinks.map((link) => [
        '          <article class="card">',
        `            <h3>${escapeHtml(link.label)}</h3>`,
        `            <a class="doc-link" href="${escapeAttribute(link.href)}">${escapeHtml(locale.ui.articleRelatedLinkLabel)} →</a>`,
        '          </article>',
      ].join('\n')),
      '        </div>',
      '      </div>',
      '    </section>',
    ] : []),
    '  </main>',
  ].join('\n');
}

function renderArticleSection(section, isAlt) {
  const classes = ['section'];
  if (isAlt) classes.push('alt');
  return [
    `    <section class="${classes.join(' ')}">`,
    '      <div class="container narrow">',
    `        <p class="section-label">${escapeHtml(section.label)}</p>`,
    `        <h2>${escapeHtml(section.title)}</h2>`,
    ...(section.paragraphs || []).map((paragraph) => `        <p>${escapeHtml(paragraph)}</p>`),
    ...(section.items?.length ? [
      '        <ul class="principles">',
      ...section.items.map((item) => `          <li>${escapeHtml(item)}</li>`),
      '        </ul>',
    ] : []),
    '      </div>',
    '    </section>',
  ].join('\n');
}

function renderNotFound(page) {
  return [
    '  <main id="main-content">',
    '    <section class="section" style="min-height:60vh;display:flex;align-items:center;">',
    '      <div class="container narrow" style="text-align:center;">',
    `        <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>`,
    `        <h1 style="max-width:none;">${escapeHtml(page.h1)}</h1>`,
    `        <p class="lead" style="margin:0 auto 12px;">${escapeHtml(page.lead)}</p>`,
    `        <p class="meta-note" style="margin:0 auto 28px;">${escapeHtml(page.metaNote)}</p>`,
    '        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">',
    ...page.actions.map((action) => `          <a class="button ${action.style}" href="${escapeAttribute(action.href)}">${escapeHtml(action.label)}</a>`),
    '        </div>',
    '      </div>',
    '    </section>',
    '  </main>',
  ].join('\n');
}

function renderTextSection(id, section, isAlt = false) {
  const classes = ['section'];
  if (isAlt) classes.push('alt');
  return [
    `    <section${id ? ` id="${escapeAttribute(id)}"` : ''} class="${classes.join(' ')}">`,
    '      <div class="container narrow">',
    `        <p class="section-label">${escapeHtml(section.label)}</p>`,
    `        <h2>${escapeHtml(section.title)}</h2>`,
    ...(section.paragraphs || []).map((paragraph) => `        <p>${escapeHtml(paragraph)}</p>`),
    '      </div>',
    '    </section>',
  ].join('\n');
}

function renderCardSection(id, section, isAlt = false) {
  const classes = ['section'];
  if (isAlt) classes.push('alt');
  return [
    `    <section${id ? ` id="${escapeAttribute(id)}"` : ''} class="${classes.join(' ')}">`,
    '      <div class="container">',
    `        <p class="section-label">${escapeHtml(section.label)}</p>`,
    `        <h2>${escapeHtml(section.title)}</h2>`,
    '        <div class="card-grid">',
    ...section.cards.map((card) => `          <article class="card"><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.text)}</p></article>`),
    '        </div>',
    '      </div>',
    '    </section>',
  ].join('\n');
}

function renderListCardSection(id, section, isAlt = false) {
  const classes = ['section'];
  if (isAlt) classes.push('alt');
  return [
    `    <section id="${escapeAttribute(id)}" class="${classes.join(' ')}">`,
    '      <div class="container">',
    `        <p class="section-label">${escapeHtml(section.label)}</p>`,
    `        <h2>${escapeHtml(section.title)}</h2>`,
    '        <div class="list-grid">',
    ...section.cards.map((card) => `          <div class="list-card"><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.text)}</p></div>`),
    '        </div>',
    '      </div>',
    '    </section>',
  ].join('\n');
}

function renderListSection(id, section, isAlt = false) {
  const classes = ['section'];
  if (isAlt) classes.push('alt');
  return [
    `    <section${id ? ` id="${escapeAttribute(id)}"` : ''} class="${classes.join(' ')}">`,
    '      <div class="container narrow">',
    `        <p class="section-label">${escapeHtml(section.label)}</p>`,
    `        <h2>${escapeHtml(section.title)}</h2>`,
    '        <ul class="principles">',
    ...section.items.map((item) => `          <li>${escapeHtml(item)}</li>`),
    '        </ul>',
    '      </div>',
    '    </section>',
  ].join('\n');
}

function renderTimelineSection(id, section) {
  return [
    `    <section id="${escapeAttribute(id)}" class="section">`,
    '      <div class="container narrow">',
    `        <p class="section-label">${escapeHtml(section.label)}</p>`,
    `        <h2>${escapeHtml(section.title)}</h2>`,
    '        <div class="timeline">',
    ...section.items.map((item) => [
      '          <div class="timeline-item">',
      '            <div class="timeline-dot"></div>',
      '            <div class="timeline-content">',
      `              <h3>${escapeHtml(item.title)}</h3>`,
      `              <p>${escapeHtml(item.text)}</p>`,
      '            </div>',
      '          </div>',
    ].join('\n')),
    '        </div>',
    '      </div>',
    '    </section>',
  ].join('\n');
}

function renderFooter(localeCode, footerKey) {
  const locale = locales[localeCode];
  const footer = locale.footers[footerKey] || locale.footers.docs;
  return [
    '  <footer class="site-footer">',
    '    <div class="container footer-grid">',
    '      <div>',
    `        <p class="brand footer-brand">${escapeHtml(locale.site.name)}</p>`,
    `        <p class="footer-text">${escapeHtml(locale.site.brandDescription)}</p>`,
    '      </div>',
    ...footer.columns.map((column) => [
      '      <div>',
      `        <p class="footer-heading">${escapeHtml(column.heading)}</p>`,
      ...(column.links || []).map((link) => `        <a href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`),
      ...(column.text || []).map((line) => `        <p class="footer-text">${escapeHtml(line)}</p>`),
      '      </div>',
    ].join('\n')),
    '    </div>',
    '  </footer>',
  ].join('\n');
}

function renderSchema(localeCode, pageKey, page) {
  const locale = locales[localeCode];
  const pageUrl = absoluteUrl(page.path);
  const breadcrumb = buildBreadcrumb(localeCode, pageKey, page);
  let graph;

  if (page.template === 'home') {
    graph = [
      {
        '@type': 'Organization',
        '@id': `${absoluteUrl('/')}#organization`,
        name: locale.site.name,
        url: absoluteUrl('/'),
        logo: absoluteUrl(locale.site.favicon),
        description: locale.site.brandDescription,
        email: 'hello@iaifoundation.com',
        sameAs: [],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'hello@iaifoundation.com',
          contactType: 'general inquiry',
          availableLanguage: ['en', 'vi']
        }
      },
      {
        '@type': 'WebSite',
        '@id': `${absoluteUrl('/')}#website`,
        url: absoluteUrl('/'),
        name: locale.site.name,
        description: locale.site.websiteDescription,
        publisher: { '@id': `${absoluteUrl('/')}#organization` },
        inLanguage: ['en', 'vi']
      },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: page.title,
        description: page.description,
        isPartOf: { '@id': `${absoluteUrl('/')}#website` },
        about: { '@id': `${absoluteUrl('/')}#organization` },
        inLanguage: locale.locale
      }
    ];
  } else {
    const pageType = page.template === 'docArticle' ? 'Article' : (page.template === 'docsHub' ? 'CollectionPage' : 'WebPage');
    graph = [
      {
        '@type': pageType,
        '@id': `${pageUrl}#page`,
        url: pageUrl,
        name: page.title,
        description: page.description,
        isPartOf: { '@id': `${absoluteUrl('/')}#website` },
        inLanguage: locale.locale
      },
      breadcrumb,
    ];
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)
    .replace(/</g, '\\u003c');
}

function buildBreadcrumb(localeCode, pageKey, page) {
  const locale = locales[localeCode];
  const items = [];
  const homeLabel = localeCode === 'vi' ? 'Trang chủ' : 'Home';
  items.push({ '@type': 'ListItem', position: 1, name: homeLabel, item: absoluteUrl(locale.pages.home.path) });

  if (pageKey !== 'home' && pageKey !== 'notFound') {
    if (pageKey === 'docs') {
      items.push({ '@type': 'ListItem', position: 2, name: stripSiteSuffix(page.h1), item: absoluteUrl(page.path) });
    } else if (page.template === 'docArticle') {
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: localeCode === 'vi' ? 'Tài liệu' : 'Docs',
        item: absoluteUrl(locale.pages.docs.path),
      });
      items.push({ '@type': 'ListItem', position: 3, name: stripSiteSuffix(page.h1), item: absoluteUrl(page.path) });
    } else {
      items.push({ '@type': 'ListItem', position: 2, name: stripSiteSuffix(page.h1), item: absoluteUrl(page.path) });
    }
  }

  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(page.path)}#breadcrumb`,
    itemListElement: items,
  };
}

function renderManifest() {
  const locale = locales[defaultLocale];
  return JSON.stringify({
    name: `${locale.site.name} - Intent OS`,
    short_name: locale.site.name,
    description: locale.site.websiteDescription,
    lang: locale.htmlLang,
    dir: 'ltr',
    start_url: '/',
    display: 'standalone',
    background_color: locale.site.themeColor,
    theme_color: locale.site.themeColor,
    icons: [
      {
        src: locale.site.favicon,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ]
  }, null, 2);
}

function renderLocaleManifest() {
  const localizedRoutes = routeKeys
    .filter((key) => key !== 'notFound')
    .map((key) => ({
      key,
      alternates: Object.fromEntries(localeFiles.map((code) => [code, absoluteUrl(locales[code].pages[key].path)])),
    }));

  return JSON.stringify({
    defaultLocale,
    supportedLocales: localeFiles.map((code) => ({
      code,
      label: locales[code].languageLabel,
      hreflang: code,
      ogLocale: locales[code].ogLocale,
      basePath: locales[code].basePath,
    })),
    plannedLocales: [],
    localizedRoutes,
  }, null, 2);
}

function renderSitemap() {
  const entries = routeKeys.filter((key) => key !== 'notFound').flatMap((key) => (
    localeFiles.map((code) => {
      const page = locales[code].pages[key];
      const alternates = localeFiles.map((localeCode) => `    <xhtml:link rel="alternate" hreflang="${localeCode}" href="${escapeAttribute(absoluteUrl(locales[localeCode].pages[key].path))}" />`).join('\n');
      const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeAttribute(absoluteUrl(locales[defaultLocale].pages[key].path))}" />`;
      const priority = key === 'home' ? (code === defaultLocale ? '1.0' : '0.95') : (key === 'docs' ? (code === defaultLocale ? '0.9' : '0.85') : (key.includes('Standard') || key.includes('Template') || key.includes('Checklist') ? '0.7' : (code === defaultLocale ? '0.8' : '0.75')));
      return [
        '  <url>',
        `    <loc>${escapeHtml(absoluteUrl(page.path))}</loc>`,
        alternates,
        xDefault,
        `    <lastmod>${buildDate}</lastmod>`,
        `    <changefreq>${key === 'home' ? 'weekly' : 'monthly'}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
  ));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="https://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
  ].join('\n');
}

function writeRouteFile(routePath, html) {
  const normalizedPath = routePath === '/' ? '/index.html' : routePath;
  const finalPath = normalizedPath.endsWith('/') ? join(normalizedPath, 'index.html') : normalizedPath;
  const target = resolve(outputDir, `.${finalPath}`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html, 'utf8');
}

function copyDirectoryFiltered(sourceDir, targetDir, shouldCopy) {
  const sourceStats = statSync(sourceDir);
  if (!sourceStats.isDirectory()) return;
  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = resolve(sourceDir, entry.name);
    const targetPath = resolve(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryFiltered(sourcePath, targetPath, shouldCopy);
      continue;
    }
    if (shouldCopy(sourcePath)) {
      mkdirSync(dirname(targetPath), { recursive: true });
      copyFileSync(sourcePath, targetPath);
    }
  }
}

function absoluteUrl(pathname) {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${locales[defaultLocale].site.preferredHost}${normalized}`;
}

function getAlternateLocale(localeCode) {
  return localeCode === 'en' ? 'vi' : 'en';
}

function stripSiteSuffix(text) {
  return text.replace(/\s+-\s+IAI Foundation Docs$/, '').trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

function hashFile(filePath) {
  return createHash('sha256')
    .update(readFileSync(filePath))
    .digest('hex')
    .slice(0, 12);
}
