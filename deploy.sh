#!/usr/bin/env bash
# =============================================================================
# OS-INTEL :: one-shot deploy to GitHub + Vercel
#
# Run this from inside the unzipped os-intel/ directory.
# Prerequisites:
#   - gh CLI installed + authenticated (brew install gh && gh auth login)
#   - vercel CLI installed + authenticated (npm i -g vercel && vercel login)
#   - ANTHROPIC_API_KEY exported in your shell
#
# Supabase is already live at egdrjuwvuxajmopgklvf.supabase.co
# =============================================================================

set -euo pipefail

REPO_NAME="${REPO_NAME:-os-intel}"
VERCEL_PROJECT="${VERCEL_PROJECT:-os-intel}"
SUPABASE_URL="https://egdrjuwvuxajmopgklvf.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZHJqdXd2dXhham1vcGdrbHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NDQxMTIsImV4cCI6MjA5MjIyMDExMn0.eyyjlh49DJ6DlnzoBZblwItpzlg2v4z18mWp6f3WHgo"

# --- sanity checks -----------------------------------------------------------
command -v gh >/dev/null || { echo "✗ gh CLI not found. brew install gh"; exit 1; }
command -v vercel >/dev/null || { echo "✗ vercel CLI not found. npm i -g vercel"; exit 1; }
command -v git >/dev/null || { echo "✗ git not found"; exit 1; }

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "✗ ANTHROPIC_API_KEY is not set in your shell."
  echo "  Get one from https://console.anthropic.com and run:"
  echo "    export ANTHROPIC_API_KEY=sk-ant-..."
  exit 1
fi

# --- 1. Git init + first commit ---------------------------------------------
if [[ ! -d .git ]]; then
  echo "→ Initializing git repo..."
  git init -q
  git branch -M main
fi

echo "→ Committing..."
git add -A
git commit -q -m "init: os-intel" || echo "  (nothing to commit)"

# --- 2. Create GitHub repo ---------------------------------------------------
echo "→ Creating GitHub repo ($REPO_NAME)..."
if gh repo view "$REPO_NAME" >/dev/null 2>&1; then
  echo "  repo already exists — pushing to it"
  git remote add origin "$(gh repo view "$REPO_NAME" --json url -q .url).git" 2>/dev/null || true
else
  gh repo create "$REPO_NAME" --private --source=. --push
fi

git push -u origin main 2>/dev/null || true

# --- 3. Vercel project + env vars -------------------------------------------
echo "→ Linking Vercel project..."
vercel link --yes --project "$VERCEL_PROJECT" >/dev/null || true

echo "→ Setting env vars (production, preview, development)..."
for env in production preview development; do
  printf "%s" "$SUPABASE_URL"      | vercel env add NEXT_PUBLIC_SUPABASE_URL "$env" --sensitive >/dev/null 2>&1 || true
  printf "%s" "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY "$env" --sensitive >/dev/null 2>&1 || true
  printf "%s" "$ANTHROPIC_API_KEY" | vercel env add ANTHROPIC_API_KEY "$env" --sensitive >/dev/null 2>&1 || true
done

# --- 4. Deploy ---------------------------------------------------------------
echo "→ Deploying to production..."
vercel --prod

echo ""
echo "✓ Done."
echo ""
echo "Next:"
echo "  1. Open the Vercel URL above"
echo "  2. Click 'Request access' → sign up → you're in"
echo "  3. Supabase: Authentication → Providers → disable email confirmation"
echo "     (for faster dev; re-enable in production)"
