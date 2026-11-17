#!/usr/bin/env bash
# ============================================================
# IAI FOUNDATION — BRAND v2.0 LINTER (Intent Sovereign)
# Usage: bash scripts/brand-lint-iaifoundation.sh [path]
# Default path: . (root, scans index.html + style.css + docs)
#
# Source: docs/IAIFOUNDATION_V2_INTENT_SOVEREIGN.md
# ============================================================
set -euo pipefail

TARGET="${1:-.}"
[ -d "$TARGET" ] || { echo "❌ Target not found: $TARGET"; exit 1; }

echo "🔍 IAI Foundation brand-lint: $TARGET"
echo ""

FAILED=0

# ─────────────────────────────────────────────────────────────
# 1. WORD FILTER (Foundation category language)
# ─────────────────────────────────────────────────────────────
declare -a FORBIDDEN=(
  # Wrong category
  "social network"
  "social app"
  "marketplace product"
  "chatbot product"
  # Hype phrases
  "revolutionary"
  "disruptive innovation"
  "next-gen"
  "game changer"
  "game-changer"
  # Investment language (legal risk)
  "guaranteed return"
  "guaranteed profit"
  "guaranteed yield"
  "fixed return"
)

echo "─── Word filter (public-facing files only) ───"
# Build file list: only public-facing surfaces (not apps/packages/openapi/etc)
PUBLIC_FILES=$(find "$TARGET" -maxdepth 3 -type f \
  \( -name "*.html" -o -name "*.css" -o -name "*.txt" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -not -path "*/.wrangler/*" \
  -not -path "*/apps/*" \
  -not -path "*/packages/*" \
  -not -path "*/openapi/*" 2>/dev/null)

if [ -z "$PUBLIC_FILES" ]; then
  echo "✅ No public files to scan"
else
  for phrase in "${FORBIDDEN[@]}"; do
    raw=$(echo "$PUBLIC_FILES" | xargs grep -Iil "$phrase" 2>/dev/null || true)
    [ -z "$raw" ] && continue
    # Check if context is negated
    bad=$(echo "$PUBLIC_FILES" | xargs grep -Ini "$phrase" 2>/dev/null \
      | grep -ivE "(not a |is not |không phải |never )[^.]{0,40}${phrase}" || true)
    if [ -n "$bad" ]; then
      echo "❌ \"$phrase\""
      echo "$bad" | head -2 | sed 's/^/     /'
      FAILED=1
    fi
  done
  [ "$FAILED" -eq 0 ] && echo "✅ No forbidden phrases"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# 2. PALETTE TOKENS (v2.0 Intent Sovereign)
# ─────────────────────────────────────────────────────────────
echo "─── Palette tokens ───"
CSS="$TARGET/style.css"
if [ -f "$CSS" ]; then
  # Ink substrate (deeper than #0b1020)
  if grep -qi "#080A12\|#0B0E1A" "$CSS"; then
    echo "✅ Ink substrate (#080A12) present"
  else
    echo "⚠️  Ink substrate not found — v2.0 not fully applied"
  fi

  # Intent violet primary
  if grep -qi "#7C5CFF" "$CSS"; then
    echo "✅ Intent Violet (#7C5CFF) present"
  else
    echo "❌ Intent Violet #7C5CFF NOT FOUND"
    FAILED=1
  fi

  # Gold verification (IAI ecosystem standard)
  if grep -qi "#D4AF37" "$CSS"; then
    echo "✅ Gold-500 (#D4AF37) verification present"
  else
    echo "⚠️  Gold-500 not yet present — verified-seal disabled"
  fi

  # Anti-collision: must NOT use OMDALA's primary cyan as primary
  # (cyan-500 #3de7ff is OK if used minimal, but should not dominate)
  cyan_count=$(grep -c "#3de7ff\|#7ef2ff" "$CSS" 2>/dev/null || echo 0)
  if [ "$cyan_count" -gt 3 ]; then
    echo "⚠️  Heavy cyan usage ($cyan_count refs) — risk of OMDALA collision"
  fi

  # v2.0 animations
  if grep -q "iaif-intent-sweep\|iaif-ease-luxury" "$CSS"; then
    echo "✅ v2.0 Intent Sovereign animations present"
  else
    echo "⚠️  v2.0 animations missing"
  fi
fi
echo ""

# ─────────────────────────────────────────────────────────────
# 3. ACCESSIBILITY
# ─────────────────────────────────────────────────────────────
echo "─── Accessibility ───"
if grep -rq "prefers-reduced-motion" "$TARGET" --include="*.css" 2>/dev/null; then
  echo "✅ prefers-reduced-motion handled"
else
  echo "⚠️  prefers-reduced-motion missing (required by §6)"
fi

if [ -f "$CSS" ] && grep -q "color-scheme:" "$CSS"; then
  echo "✅ color-scheme declared"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# 4. BRAND CONSISTENCY (IAI Foundation, Intent OS)
# ─────────────────────────────────────────────────────────────
echo "─── Brand consistency ───"
# Quick check on root index.html
if [ -f "$TARGET/index.html" ] && grep -qiE "IAI Foundation|Intent OS" "$TARGET/index.html"; then
  echo "✅ Brand name 'IAI Foundation' / 'Intent OS' present in index.html"
else
  echo "⚠️  Brand name not detected in index.html"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════"
if [ "$FAILED" -eq 0 ]; then
  echo "✅ IAI Foundation brand-lint PASSED."
  echo "   Source: docs/IAIFOUNDATION_V2_INTENT_SOVEREIGN.md"
  exit 0
else
  echo "❌ IAI Foundation brand-lint FAILED."
  exit 1
fi
