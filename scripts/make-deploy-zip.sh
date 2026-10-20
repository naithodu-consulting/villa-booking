#!/usr/bin/env bash
# make-deploy-zip.sh — build the archive Hostinger's "Upload your files" expects.
#
# Hostinger Business deploys this app as a Node.js web app. GitHub integration
# is unavailable on this account ("temporarily disabled while managing
# clients"), and the public-repository-URL path is blocked too, so every deploy
# is a manual upload. That makes the contents of this archive something worth
# getting right once rather than assembling by hand each time.
#
# What goes in: source, configuration, public assets, migrations.
# What stays out, and why:
#
#   node_modules/   ~600 MB. Hostinger runs its own install from the lockfile.
#   .next/          ~400 MB. Hostinger runs its own build.
#   .git/           ~65 MB of history the host has no use for.
#   .env*           SECRETS. The service-role key, the Razorpay secrets and the
#                   Resend key live here. They belong in Hostinger's
#                   Environment variables panel and must never travel in a file.
#                   This is the single most important exclusion in the script.
#   docs/ (internal) The audit, the launch plan and this deployment plan
#                   describe where the system is weak. Not for a web root.
#   tools/          Local design scratch files, already gitignored.
#
# The archive is verified after it is built: if anything secret-shaped or any
# env file is found inside, the script deletes it and fails rather than leaving
# a dangerous file lying around to be uploaded by mistake.
#
# Usage:  ./scripts/make-deploy-zip.sh  [output-path]

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-${REPO_ROOT}/villa-booking-deploy.zip}"

cd "$REPO_ROOT"

# ─── Refuse to package a tree that does not build ────────────────────────────
# A ZIP is a one-way trip: once uploaded, the next signal is a build log on
# someone else's machine. Catch it here instead.
echo "  Typechecking..."
npx tsc --noEmit
echo "  Linting..."
npm run lint

# ─── Record what is being shipped ────────────────────────────────────────────
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
DIRTY=""
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  DIRTY=" (uncommitted changes present)"
fi
echo "  Packaging ${COMMIT}${DIRTY}"

rm -f "$OUT"

zip -rq "$OUT" . \
  -x 'node_modules/*' \
     '.next/*' \
     '.git/*' \
     '.env' '.env.*' \
     'supabase/.temp/*' \
     'supabase/.branches/*' \
     '.vercel/*' \
     'coverage/*' \
     '*.tsbuildinfo' \
     '.DS_Store' '*/.DS_Store' \
     'docs/AUDIT_*' \
     'docs/PRODUCTION_LAUNCH_PLAN.md' \
     'docs/PROD_DB_SETUP.md' \
     'docs/HOSTINGER_GO_LIVE.md' \
     'tools/*' \
     'public/tools/*' \
     '*.zip'

# ─── Verify before anyone uploads it ─────────────────────────────────────────
fail() { echo "  FAILED: $1"; rm -f "$OUT"; exit 1; }

# An env file would carry live credentials to a web host.
if unzip -l "$OUT" | awk '{print $4}' | grep -qE '(^|/)\.env'; then
  fail "an .env file is inside the archive"
fi

# Belt and braces: look for the shapes of the actual secrets, in case something
# was pasted into a source file. Supabase JWTs, Razorpay live keys, Resend keys.
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
unzip -qo "$OUT" -d "$TMP"
# This script is excluded from its own scan: it carries the patterns below as
# literal text, so it matches itself every time. That is not a theoretical
# tidy-up - the first run of this check failed on exactly that, which is a
# reassuring sign the scan works and a reminder that a self-referential grep
# needs saying out loud.
if grep -rlE 'eyJ[A-Za-z0-9_-]{30,}|rzp_live_[A-Za-z0-9]+|re_[A-Za-z0-9]{20,}|sb_secret' "$TMP" 2>/dev/null \
     | grep -v 'scripts/make-deploy-zip.sh' | grep -q .; then
  echo "  Offending file(s):"
  grep -rlE 'eyJ[A-Za-z0-9_-]{30,}|rzp_live_[A-Za-z0-9]+|re_[A-Za-z0-9]{20,}|sb_secret' "$TMP" 2>/dev/null \
    | grep -v 'scripts/make-deploy-zip.sh' | sed "s|${TMP}/|    |"
  fail "something secret-shaped is inside the archive"
fi

# These must be present or the build cannot run.
for required in package.json package-lock.json src public; do
  unzip -l "$OUT" | awk '{print $4}' | grep -q "^${required}" \
    || fail "missing ${required}"
done

# The Next config, whatever extension it carries. Checked without pinning one:
# this list named next.config.ts, and kept failing after the file became
# next.config.mjs to work around the host's old glibc.
unzip -l "$OUT" | awk '{print $4}' | grep -qE '^next\.config\.(mjs|js|ts)$' \
  || fail "missing next.config.*"

# The migrations, which are the content as well as the schema.
MIGRATIONS="$(unzip -l "$OUT" | awk '{print $4}' | grep -c '^supabase/migrations/.*\.sql$' || true)"
[ "$MIGRATIONS" -gt 0 ] || fail "no migrations in the archive"

SIZE="$(du -h "$OUT" | cut -f1)"
echo
echo "  Ready: $OUT  (${SIZE}, ${MIGRATIONS} migrations)"
echo
echo "  Upload at: Hostinger dashboard, Websites, Create Website, Web App,"
echo "  Upload your website files."
echo
echo "  Set every environment variable BEFORE deploying. RESEND_API_KEY,"
echo "  PROPERTY_WHATSAPP and CONTENT_REVALIDATE_SECRET each fail silently"
echo "  when missing, so the deploy will look fine and be broken."
