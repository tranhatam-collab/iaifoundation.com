# IAIFoundation.com — Language and Multilingual SEO Standard

- Version: 1.0
- Status: Locked / Active
- Effective date: 2026-04-21
- Scope: All public website pages, metadata, structured data, locale manifests, navigation labels, and future localized routes for `iaifoundation.com`
- Owner: Founder
- Enforced by: Product Owner, Tech Lead, SEO Lead, QA Lead, Content Lead, AI agents
- Parent protocol: `MASTER_DEV_EXECUTION_PROTOCOL_2026.md`

---

## 0. Non-Negotiable Statement

This document locks the language and multilingual SEO baseline for the public IAIFoundation.com website.

No contributor, AI system, or automation is allowed to:

- Publish a localized page without locale-specific SEO.
- Reuse English metadata on a Vietnamese page.
- Publish Vietnamese copy without proper diacritics.
- Mix languages on a page except for locked product names or approved technical nouns.
- Add a new locale without route parity, `hreflang`, sitemap updates, and QA evidence.
- Change locked terminology without recording the decision in a spec, ADR, or approved release note.

If a conflict exists, follow the precedence defined in `MASTER_DEV_EXECUTION_PROTOCOL_2026.md`.

---

## 1. Purpose

This standard exists to ensure:

- Every language is treated as a first-class product surface.
- Every locale has its own search intent, metadata, and indexing strategy.
- Vietnamese SEO is not treated as a translation side effect of English SEO.
- Future multilingual expansion can happen without breaking route stability or search signals.
- Human teams and AI systems follow one operating baseline for copy, metadata, and localization QA.

Success means:

- One page = one clear language.
- One locale = one unique SEO package.
- Canonical, `hreflang`, schema, and navigation all agree.
- Vietnamese copy reads naturally for Vietnam-based users and uses full diacritics.
- New locales can be added without refactoring the route model.

---

## 2. Locked Baseline for This Repository

### 2.1 Production Host Rules

- Primary production host: `https://iaifoundation.com`
- `https://www.iaifoundation.com` is not the preferred canonical host.
- All canonical URLs must use the apex host.
- `x-default` points to the default English route unless a dedicated global gateway page is introduced later.

### 2.2 Current Locked Locale Map

| Locale | Language tag | OG locale | Base path | Status |
|---|---|---|---|---|
| English | `en` | `en_US` | `/` | Default locale |
| Vietnamese (Vietnam) | `vi` | `vi_VN` | `/vi/` | Active localized locale |

### 2.3 Current Locked Route Pattern

The route key stays stable across locales. Non-default locales must use a locale prefix.

| Route key | English URL | Vietnamese URL |
|---|---|---|
| home | `/` | `/vi/` |
| docs | `/docs/` | `/vi/docs/` |
| partners | `/partners/` | `/vi/partners/` |

Rules:

- The English route remains the root-level default.
- Localized routes must mirror the same route key structure under the locale prefix.
- Do not invent a different information architecture per locale without explicit approval.
- Keep filenames and route keys stable to preserve static-first deployment compatibility.

---

## 3. Language Governance Rules

### 3.1 Page-Language Rule

Every public page must have one dominant language.

Required:

- `<html lang="...">` matches the page locale.
- Navigation labels, CTA labels, headings, body copy, and meta descriptions match the page locale.
- Structured data `inLanguage` matches the page locale.
- Breadcrumb labels match the page locale.

Allowed exceptions:

- Brand names: `IAI Foundation`
- Product names: `Intent OS`
- Approved technical nouns when translation would reduce clarity or break a locked naming contract

### 3.2 Translation Quality Rule

Localized copy must be editorially correct, not just machine-converted.

Required:

- Natural phrasing for the target market
- Correct grammar and punctuation
- Correct diacritics for Vietnamese
- Consistent terminology across UI, docs index pages, metadata, and schema

Not allowed:

- Half-translated navigation
- Literal metadata carryover from English
- Mixed locale anchor text on the same localized page
- Unreviewed placeholder translations

### 3.3 Product Naming Rule

The following names stay locked unless an approved naming decision replaces them:

- `IAI Foundation`
- `Intent OS`

The following descriptive phrase is locked for the Vietnamese homepage positioning:

- `Hạ tầng Thực thi Ý định Phổ quát`

---

## 4. Vietnamese Language Standard (`vi-VN`)

Vietnamese for this repository is not generic `vi`. It must target Vietnam-based readers and Vietnamese search behavior.

### 4.1 Locale Identity

- Language tag: `vi`
- Regional target: Vietnam
- OG locale: `vi_VN`
- Tone: clear, formal, modern, product-grade Vietnamese
- Audience: founders, operators, developers, infrastructure partners, pilot organizations, researchers

### 4.2 Writing Rules

Required:

- Use full Vietnamese diacritics everywhere in visible UI and metadata.
- Prefer clear modern Vietnamese over awkward loan-translation.
- Keep sentence flow concise and professional.
- Translate search-facing copy for Vietnamese user intent, not for word-by-word equivalence.

Avoid:

- Non-diacritic text such as `Tieng Viet`, `Dang ky`, `Tai lieu`, `Doi tac`
- Overly casual slang
- Over-translating locked product names
- Mixing multiple pronoun styles within the same page
- Clickbait SEO phrasing

### 4.3 Locked Vietnamese Terminology

| English concept | Locked Vietnamese usage | Rule |
|---|---|---|
| trust layer | `lớp tin cậy` | Use in strategy and positioning copy |
| execution layer | `lớp thực thi` | Use when describing the missing infrastructure layer |
| workflow | `quy trình` | Default public-facing translation |
| orchestration | `điều phối` | Use in architecture and runtime explanations |
| proof | `bằng chứng` | Default public-facing term |
| proof trail | `vệt bằng chứng` | Use when describing auditability |
| audit trail | `vệt kiểm toán` or `dấu vết kiểm toán` | Use whichever best fits sentence flow, but stay consistent within a page |
| governed run | `phiên chạy có kiểm soát` | Preferred public-facing phrase |
| policy | `chính sách` | Default usage |
| governance | `quản trị` | Use for governance framing |
| approval | `phê duyệt` | Default usage |
| pilot | `thí điểm` | Preferred public-facing term |
| builder | `người xây dựng` | Preferred public-facing term for the docs layer |

### 4.4 Vietnamese SEO Rule

Vietnamese SEO must be authored as its own search surface.

Required for every Vietnamese page:

- Unique `title`
- Unique `meta description`
- Unique visible `H1`
- Vietnamese anchor text in internal navigation
- `canonical` pointing to the Vietnamese URL itself
- `hreflang="vi"` entry
- `og:locale` = `vi_VN`
- Vietnamese `og:title` and `og:description`
- Vietnamese `twitter:title` and `twitter:description`
- Structured data with `inLanguage: "vi"`

Not allowed:

- Using the English keyword set as the Vietnamese keyword set
- Copying English meta descriptions and only changing body copy
- Indexing a Vietnamese URL before its metadata and schema are localized

---

## 5. Locale-Specific SEO Standard

Each locale must have its own SEO package.

### 5.1 Minimum SEO Package Per Localized Page

Every indexable page must define:

- Locale-specific `title`
- Locale-specific `meta description`
- Locale-specific `canonical`
- Full `hreflang` cluster for all live equivalents
- `x-default`
- Locale-specific Open Graph title and description
- Locale-specific Twitter title and description
- Locale-specific structured data name/description and `inLanguage`
- One clear `H1`
- Locale-appropriate internal linking and anchor text

### 5.2 Search Intent Rule

Each locale must be planned against its own search intent.

That means each localized page must define:

- Primary keyword cluster
- Supporting semantic terms
- Intended audience
- Search intent type: informational, navigational, partnership, documentation, etc.
- Tone and terminology choices for that locale

The SEO brief must be created per locale, not copied from the source language.

### 5.3 Duplicate Signal Prevention

To avoid duplicate-content confusion:

- Each locale page must self-canonicalize.
- Each locale page must reference all live alternates.
- Titles and descriptions must differ meaningfully between locales.
- Body copy must be truly localized, not token-swapped.
- Internal links should keep users inside the same locale whenever an equivalent exists.

---

## 6. Locked Current SEO Baseline

The current live release establishes the initial SEO baseline for the active routes below. Future edits must remain locale-specific.

| Route key | Locale | Primary search intent |
|---|---|---|
| home | `en` | Intent OS / intent infrastructure / trust layer positioning |
| home | `vi` | hạ tầng thực thi ý định / lớp tin cậy / điều phối AI và quy trình |
| docs | `en` | public specs / architecture / Intent OS documentation |
| docs | `vi` | tài liệu Intent OS / kiến trúc Intent OS / đặc tả công khai |
| partners | `en` | partner inquiry / pilot partner / infrastructure collaboration |
| partners | `vi` | đối tác hạ tầng / đối tác thí điểm / hợp tác đồng xây |

Rules:

- The Vietnamese page must target Vietnamese query patterns.
- The English page must target English query patterns.
- No locale may depend on another locale's metadata to rank.

---

## 7. Required File Updates for Any Locale Change

Any shipped language or SEO change must review and update the relevant surfaces below:

- Localized HTML page file
- Alternate locale HTML page file
- `sitemap.xml`
- `locales/site.locales.json`
- Navigation language switcher links
- Structured data block on the affected page
- Page-level Open Graph and Twitter metadata
- Canonical URL
- `hreflang` links

Review when relevant:

- `404.html`
- `site.webmanifest`
- public docs index pages
- release notes

No locale work is considered complete if sitemap or `hreflang` updates are missing.

---

## 8. Companion Operating Files

The following documents are mandatory companions to this standard:

- `LOCALE_SEO_BRIEF_TEMPLATE.md`
- `MULTILINGUAL_RELEASE_QA_CHECKLIST.md`

Rules:

- Every new locale must start with `LOCALE_SEO_BRIEF_TEMPLATE.md`.
- Every multilingual release must pass `MULTILINGUAL_RELEASE_QA_CHECKLIST.md`.
- These files do not replace the locked rules in this standard. They operationalize them.

---

## 9. Future Locale Expansion Standard

Before adding a new locale, the team must complete the following in order.

### 8.1 Stage 1 - Locale Brief

Create a locale brief containing:

- Target market
- Writing tone
- Search behavior assumptions
- Translation risk list
- Initial keyword clusters by route

### 8.2 Stage 2 - Route Parity

Define route parity for every existing indexable route.

Example pattern:

- `/<locale>/`
- `/<locale>/docs/`
- `/<locale>/partners/`

Do not ship partial route parity as indexable unless explicitly approved.

### 8.3 Stage 3 - SEO Pack

Create locale-specific:

- Titles
- Descriptions
- H1s
- Open Graph copy
- Twitter copy
- Structured data names and descriptions
- Internal anchor labels

### 8.4 Stage 4 - Technical Wiring

Update:

- localized files
- `hreflang`
- sitemap alternates
- locale manifest
- language switchers
- canonical rules

### 8.5 Stage 5 - QA

Verify:

- No mixed-language visible copy
- No non-diacritic Vietnamese text
- No missing alternate links
- No canonical mismatch
- No missing schema language
- No broken locale-to-locale navigation

---

## 10. Definition of Done for Language and SEO Work

A language or SEO task is only done when all of the following are true:

- Copy is correct for the target locale.
- Metadata is unique for the target locale.
- `canonical` is correct.
- `hreflang` cluster is complete.
- Sitemap reflects the localized route.
- Structured data is localized.
- Internal links prefer the same locale.
- QA evidence exists.
- Release smoke test confirms the live page is serving the intended locale metadata.

Claiming completion without metadata evidence is not allowed.

---

## 11. QA Checklist

Use this checklist before release:

1. The page language matches the locale.
2. The page has one clear H1.
3. Title and description are unique for that locale.
4. `canonical` points to the correct locale URL on `iaifoundation.com`.
5. `hreflang` includes every live alternate plus `x-default`.
6. Open Graph and Twitter metadata match the page locale.
7. Structured data `inLanguage` matches the page locale.
8. Navigation and CTA labels match the page locale.
9. Vietnamese pages use full diacritics.
10. The sitemap includes the localized URL and alternates.
11. The language switcher points to true equivalents.
12. Live smoke test confirms the deployed HTML contains the expected localized metadata.

---

## 12. Change Control

The following changes require explicit approval and must be logged:

- Changing the default locale
- Changing the route model for localized pages
- Changing locked Vietnamese terminology
- Publishing a locale without route parity
- Replacing self-canonical locale pages with cross-locale canonicals
- Indexing machine-generated translations without editorial review

Until a replacement is approved, this standard remains the locked baseline.
