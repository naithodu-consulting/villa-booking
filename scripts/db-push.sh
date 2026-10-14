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
PROD_REF="REPLACE_WITH_PROD_REF" # Villa 19 Production — set this once the project is created

# The production project was never created, so Vercel production is pointed at
# DEV_REF. A push to "staging" therefore changes what the live site serves as
# soon as ISR revalidates, with no deploy involved. Until a real production
# project exists and the Vercel env vars are repointed, DEV_REF has to be
# treated as production or this script guards nothing.
# Flip to false once PROD_REF above is a real ref.
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
      echo "  Re-run from a terminal, or set DEV_REF_SERVES_PROD=false once a"
      echo "  separate production project exists."
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
