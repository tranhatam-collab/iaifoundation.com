# IAI FOUNDATION — BRAND v2.0 "INTENT SOVEREIGN"

**Version:** 2.0 — DEMO BRANCH (`brand/v2.0-intent-sovereign`)
**Status:** Founder review pending
**Date:** 2026-05-08
**Site:** iaifoundation.com
**Brand role:** parent foundation for IAI ecosystem (Intent OS / Universal Intent Infrastructure)

---

## 0. ONE-LINER

> **Foundational sovereignty for intent-driven systems.**
> IAI Foundation là tầng nền — nơi intent của con người, tổ chức, AI, robot được chuyển thành kết quả thực với chính sách, phê duyệt, thanh toán, hành động thiết bị, và proof.

---

## 1. CHỖ ĐỨNG TRONG HỆ IAI

| Brand | Phân biệt thị giác | Vai trò |
|---|---|---|
| **Nhà Chung** | Gold + White + Black | Cộng đồng sống thật |
| **OMDALA** | Deep space + Cyan + Verification gold | Operating layer for real-world value |
| **IAI Foundation** ⭐ | Deep ink + **Intent violet** + Verification gold | Foundational intent infrastructure |

→ Mỗi brand IAI có hue chính riêng, **dùng chung gold cho verification** = ngôn ngữ trust thống nhất.

---

## 2. PALETTE — 4 LỚP

### 2.1 INK SUBSTRATE (deep authority — 60–70% UI)

| Token | HEX | Use |
|---|---|---|
| `--iaif-ink-950` | `#080A12` | Outermost background (deeper than current `#0b1020`) |
| `--iaif-ink-900` | `#0B0E1A` | Surface base |
| `--iaif-ink-800` | `#131826` | Elevated card |
| `--iaif-ink-700` | `#1A2236` | Elevated 2 |

### 2.2 INTENT VIOLET (sovereignty signal — 20–30% UI)

| Token | HEX | Use |
|---|---|---|
| `--iaif-violet-700` | `#4A2FBF` | Deep emphasis, gradient bottom |
| `--iaif-violet-600` | `#6347D9` | Mid |
| `--iaif-violet-500` | `#7C5CFF` | **Primary intent signal** — CTA, eyebrow, edge line |
| `--iaif-violet-400` | `#9A82FF` | Hover, lighter |
| `--iaif-violet-300` | `#BAA8FF` | Tints |
| `--iaif-violet-200` | `#DCD0FF` | Faint, gradient text fade |

### 2.3 PERIWINKLE (existing — secondary in v2.0, < 10%)

| Token | HEX | Use |
|---|---|---|
| `--iaif-peri-500` | `#8FB3FF` | Existing accent (kept for backward compat) |
| `--iaif-peri-400` | `#A8C4FF` | Lighter |

### 2.4 GOLD VERIFICATION (IAI ecosystem standard — < 5% UI, signal only)

| Token | HEX | Use |
|---|---|---|
| `--iaif-gold-500` | `#D4AF37` | Verified seal · sovereignty proof badge |
| `--iaif-gold-bright` | `#FFD700` | 24K success peak (✓) |
| `--iaif-gold-soft` | `rgba(212,175,55,0.18)` | Background tint |

> Gold = **proof seal** trong IAI ecosystem. Cùng giá trị màu với Nhà Chung (giá trị thật) và OMDALA (verification). Khác cách dùng: Foundation dùng gold cho **sovereignty seal khi intent đã được proof end-to-end**.

### 2.5 NEUTRAL TEXT

| Token | HEX | Use |
|---|---|---|
| `--iaif-white-100` | `#FFFFFF` | Primary text |
| `--iaif-white-200` | `#E8EDF5` | Secondary |
| `--iaif-white-300` | `#B8C1D3` | Muted (matches existing) |

---

## 3. NGUYÊN TẮC KẾT HỢP

### ✅ DO

- Ink substrate (60–70%) + Intent violet signal (20–30%) + White text (10–15%) + Gold proof (< 5%)
- Intent violet ở: eyebrow leading line, button primary, panel corners, hero edge, scrollbar
- Gold CHỈ ở: verified-seal, proof-badge khi intent run đã có audit trail thành công
- Single-pixel intent lines (1px hairline violet) > heavy borders
- Intent sweep animation (22s, opacity 0.5) > flashy gradients
- Hero h1 gradient text (white → violet-300) cho cảm xúc "rising intent"

### ❌ DON'T

- Gold cho decorative — phá triết lý "verification only"
- Mix intent violet với cyan-500 cùng lúc — sẽ nhầm với OMDALA
- Replace periwinkle ngay (giữ cho backward compat một thời gian)
- Heavy purple gradients fullscreen — phá brand traits "foundational, durable"
- Magenta, đỏ tươi, vàng tươi — không thuộc palette

---

## 4. DIFFERENTIATION ANALYSIS

### IAI Foundation vs OMDALA (must be distinguishable)

| Trục | OMDALA | IAI Foundation |
|---|---|---|
| Primary signal | Cyan `#3de7ff` | **Violet `#7C5CFF`** |
| Animation | Scan-line horizontal | **Intent sweep vertical** |
| Substrate | Space `#040816` | **Ink `#080A12` (warmer-blue)** |
| Brand traits | Coordination · execution · trust | **Foundation · sovereignty · authority** |
| Voice | Operating layer ("we coordinate") | Infrastructure ("we define the layer") |

### IAI Foundation vs Nhà Chung

| Trục | Nhà Chung | IAI Foundation |
|---|---|---|
| Hue | Warm gold | **Cool ink + violet** |
| Cảm xúc | Có nơi thuộc về | **Có authority để act** |
| Audience | End-user / cư dân | **Builder / operator / org** |

---

## 5. COMPONENT STATES

### Button

```
Primary (.btn-primary):
  bg: violet-500 · color: white · radius: pill
  hover: violet-400 + shadow-intent-strong + translateY(-1px) + sheen sweep
  focus: 0 0 0 3px rgba(124,92,255,0.4)

Secondary (.btn-secondary):
  bg: rgba(255,255,255,0.04) · border: violet-soft · color: white
  hover: bg violet-soft + border violet-500 + color violet-400
```

### Panel/Card

```
Default:
  bg: gradient(rgba(19,24,38,0.6) → rgba(11,14,26,0.4))
  border: 1px white-soft
  corner ticks (top-left + bottom-right): 12px violet-500, opacity 0.55

Hover:
  border: violet-500 rgba(0.3)
  corner ticks: opacity 1
```

### Verified seal (gold sovereignty proof)

```
.verified-seal, .proof-badge:
  inline-flex pill · padding 4px 10px
  bg: gold-soft · color: gold-500 · border: gold rgba(0.32)
  prefix ✓ in gold-bright

Use: chỉ khi intent run đã có proof trail completed.
```

### Inline link

```
.prose a, .content a, .docs-content a:
  color: violet-400 · underline 1px violet rgba(0.45) · offset 3px
  hover: violet-300 underline + text-shadow violet glow
```

---

## 6. ANIMATION

| Element | Animation | Duration | Type |
|---|---|---|---|
| Body intent sweep | `iaif-intent-sweep` 0% → 200% | 22s linear infinite | Subtle ambient (slower than OMDALA scan để khác biệt) |
| Button primary | sheen sweep on hover | 0.7s ease-luxury | Interaction |
| Panel corner ticks | opacity 0.55 → 1 | 0.42s ease-luxury | Hover |
| Hero edge line | static box-shadow glow | — | None |

`prefers-reduced-motion: reduce` được tôn trọng.

---

## 7. SUBSTRATE BACKGROUND

3 lớp:
1. **Existing:** radial blue glow top + base gradient `#0a1020 → #09101b` (kept)
2. **NEW:** intent violet ambient bottom-left (radial 35%, opacity 0.14) — signature mới
3. **NEW:** vertical line grid 64px wide (sovereignty/structure cue)
4. **NEW:** intent-sweep animation 22s — khác direction & speed với OMDALA scan

---

## 8. SO SÁNH v1 (current) → v2.0

| Tiêu chí | v1 (current) | v2.0 (Intent Sovereign) |
|---|---|---|
| Background | Deep blue radial + base | Ink + intent violet ambient + line grid + sweep |
| Accent | Periwinkle `#8FB3FF` | **Intent violet `#7C5CFF`** primary; periwinkle secondary |
| Verification | (none defined) | **Gold seal/badge** for sovereignty proof |
| Hero h1 | Plain white | Gradient text white → violet-300 |
| Panel cards | Plain border | **Corner ticks + hover** intent violet |
| Eyebrow | (undefined) | Violet leading hairline 24px + 0.22em tracking |
| Buttons | (undefined) | **Primary violet with sheen** + secondary violet-bordered |
| Animation | None | **Intent sweep 22s** + sheen sweep |
| Easing | Generic | **Luxury cubic** (IAI ecosystem standard) |
| Reduced motion | Unspecified | **Respected** |

---

## 9. APPLICATION CHECKLIST

Mọi PR touch UI phải pass:

- [ ] Body có ink-950/900 substrate + intent violet ambient (bottom-left)
- [ ] Hero h1 render gradient text (white → violet-300)
- [ ] Eyebrow có leading violet hairline 24px
- [ ] Button primary dùng violet-500 + sheen sweep on hover
- [ ] Panel cards có corner ticks intent violet (top-left + bottom-right)
- [ ] Verified seal (nếu dùng) chỉ ở context proof-completed
- [ ] Gold KHÔNG xuất hiện ở context decorative
- [ ] Intent violet primary hue dominant (KHÔNG cyan — tránh nhầm OMDALA)
- [ ] `prefers-reduced-motion: reduce` test pass
- [ ] WCAG 2.1 AA contrast pass
- [ ] Brand-lint script pass: `bash scripts/brand-lint-iaifoundation.sh`

---

## 10. PHẠM VI ÁP DỤNG (V2.0 DEMO)

**LÀM:**
- ✅ `style.css` (root — append-only overlay)
- ✅ `docs/IAIFOUNDATION_V2_INTENT_SOVEREIGN.md` (file này)
- ✅ `scripts/brand-lint-iaifoundation.sh`

**KHÔNG LÀM:**
- ❌ `apps/api`, `apps/workers-runtime`, `apps/workers-connectors` (không có UI public)
- ❌ `index.html` content (chỉ CSS overlay)
- ❌ `app.js` (logic không thay đổi)
- ❌ `docs/` content (chỉ thêm brand book)
- ❌ Routes / SEO / OpenAPI / migrations

---

## 11. ROLLBACK

100% an toàn — append-only CSS overlay.

```bash
cd iaifoundation.com
git revert <v2.0-commit-sha>
```

Không có schema/route/API/content thay đổi.

---

## 12. NEXT — KHI FOUNDER DUYỆT

- [ ] Founder ký off branch `brand/v2.0-intent-sovereign`
- [ ] Tạo PR + merge vào `main`
- [ ] Cloudflare Pages auto-deploy preview
- [ ] Verify production parity
- [ ] Quyết định mở rộng sang sub-sites: `docs.iai.one`, `app.iai.one`, `flow.iai.one`, `home.iai.one`, etc.

---

## 13. INTENT SOVEREIGN PHILOSOPHY (deep dive)

Tại sao **violet** thay vì cyan/teal/gold cho IAI Foundation?

**Violet** là màu của:
- Sovereignty (purple = royalty, authority, command)
- Boundary của visible spectrum (rìa của possibility)
- Intent layer (psychology: violet associated với higher-order thinking, design intent)

**Đối lập với cyan của OMDALA:** OMDALA điều phối thực tế hiện tại; IAI Foundation **định nghĩa layer** mà điều phối đó tồn tại trên. Violet = "designer of the substrate", cyan = "operator of the surface".

**Đối lập với gold của Nhà Chung:** Nhà Chung là giá trị tích lũy (vàng = wealth); IAI Foundation là authority định nghĩa luật game (violet = sovereign command).

**Common ground (gold verification):** Cả 3 đều coi proof / verification / trust là tối thượng → gold seal là ngôn ngữ chung.

---

— Claude · 2026-05-08
