#!/usr/bin/env bash
# db-push.sh — safely push migrations to the linked Supabase project.
# Blocks pushes to Villa 19 Production unless --production flag is explicitly passed.
# Refuses pushes to any unrecognised project ref.
#
# Usage:
#   ./scripts/db-push.sh              # push to staging/dev (safe, default)
#   ./scripts/db-push.sh --production # push to production (requires typed confirmation)
#
# Linked project is tracked in supabase/.temp/project-ref (written by `supabase link`).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ─── Project refs ─────────────────────────────────────────────────────────────
DEV_REF="hlmqcdzazbrztfovixjk"   # Villa Project Development (remote-local / staging)
PROD_REF="vluukungxufnnnpcusal"  # Villa 19 Production — created 2026-10-19

# Villa 19 Production now exists, but Vercel production has NOT been repointed
# at it yet, so DEV_REF is still what the live site serves: a push there changes
# what guests see as soon as ISR revalidates, with no deploy involved.
#
# So this stays true for now. The condition is not "does a production project
# exist" — it is "is DEV_REF still serving live traffic". Flipping it the moment
# the new project was created would have removed the guard while it was still
# the only thing protecting the live database.
#
# Flip to false in the same change that repoints the Vercel production env vars
# (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) at PROD_REF.
# See docs/PROD_DB_SETUP.md step 11.
DEV_REF_SERVES_PROD=true

PROJECT_REF_FILE="${REPO_ROOT}/supabase/.temp/project-ref"

# ─── Read currently linked project ────────────────────────────────────────────
if [[ ! -f "$PROJECT_REF_FILE" ]]; then
  echo ""
  echo "  ERROR: No linked Supabase project found."
  echo "  Run: supabase link"
  echo "  Then use --project-ref hlmqcdzazbrztfovixjk for staging."
  echo ""
  exit 1
fi

LINKED_REF=$(cat "$PROJECT_REF_FILE")

# ─── Route by linked project ──────────────────────────────────────────────────
if [[ "$LINKED_REF" == "$PROD_REF" ]]; then
  # Production path — explicit flag + typed confirmation required
  if [[ "${1:-}" != "--production" ]]; then
    echo ""
    echo "  ╔══════════════════════════════════════════════════════════════╗"
    echo "  ║  BLOCKED: linked to VILLA 19 PRODUCTION (${LINKED_REF})  ║"
    echo "  ║                                                              ║"
    echo "  ║  Pushing without an explicit flag is not allowed.            ║"
    echo "  ║  To push to production, run:                                 ║"
    echo "  ║    ./scripts/db-push.sh --production                        ║"
    echo "  ╚══════════════════════════════════════════════════════════════╝"
    echo ""
    exit 1
  fi

  echo ""
  echo "  ╔══════════════════════════════════════════════════════════════╗"
  echo "  ║  WARNING: You are about to push migrations to               ║"
  echo "  ║  VILLA 19 PRODUCTION (${LINKED_REF}).                 ║"
  echo "  ║  This affects real guest data and live bookings.            ║"
  echo "  ╚══════════════════════════════════════════════════════════════╝"
  echo ""
  if [[ ! -t 0 ]]; then
    echo "  Refusing to push to production from a non-interactive shell."
    echo ""
    exit 1
  fi
  read -r -p "  Type 'yes-production' to confirm: " confirm
  if [[ "$confirm" != "yes-production" ]]; then
    echo "  Aborted."
    exit 1
  fi
  echo ""
  echo "  Pushing to Villa 19 Production (${LINKED_REF})..."

elif [[ "$LINKED_REF" == "$DEV_REF" ]]; then
  if [[ "${1:-}" == "--production" ]]; then
    echo ""
    echo "  ERROR: --production flag passed but linked project is Staging, not Production."
    echo "  Re-link to the production project first: supabase link"
    echo ""
    exit 1
  fi

  if [[ "$DEV_REF_SERVES_PROD" == "true" ]]; then
    echo ""
    echo "  ╔══════════════════════════════════════════════════════════════╗"
    echo "  ║  WARNING: this project is what the LIVE SITE serves.         ║"
    echo "  ║  No separate production database exists yet, so migrations   ║"
    echo "  ║  pushed here reach guests as soon as ISR revalidates.        ║"
    echo "  ╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "  Linked: ${LINKED_REF}"
    echo ""
    # A non-interactive shell cannot answer, and silently proceeding is the
    # exact failure this script exists to prevent.
    if [[ ! -t 0 ]]; then
      echo "  Refusing to push to the live database from a non-interactive shell."
      echo "  Re-run from a terminal. DEV_REF_SERVES_PROD stays true until the"
      echo "  Vercel production env vars point at PROD_REF, not merely until"
      echo "  the production project exists - it already does."
      echo ""
      exit 1
    fi
    read -r -p "  Type 'yes-live' to confirm: " confirm
    if [[ "$confirm" != "yes-live" ]]; then
      echo "  Aborted."
      exit 1
    fi
    echo ""
    echo "  Pushing to ${LINKED_REF} (currently serving live)..."
  else
    echo "  Pushing to Villa Project Development / Staging (${DEV_REF})..."
  fi

else
  echo ""
  echo "  ERROR: Linked project '${LINKED_REF}' is not recognised."
  echo "  Expected: staging (${DEV_REF}) or production (${PROD_REF})."
  echo "  Refusing to push to an unknown project. Re-link first."
  echo ""
  exit 1
fi

cd "${REPO_ROOT}" && supabase db push --linked
echo ""
echo "  Done. Run 'npm run supabase:types' to regenerate TypeScript types."
