#!/usr/bin/env bash
# Creates a test admin user via GoTrue Admin API (local only).
# Direct SQL inserts into auth.users break GoTrue's identity tables — always use the API.
#
# Usage: ./supabase/seeds/seed_test_admin.sh
# Requires: local Supabase running (npm run supabase:start)

set -euo pipefail

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-http://127.0.0.1:54321}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [[ -z "$SERVICE_ROLE_KEY" ]]; then
  # Try loading from .env.local
  if [[ -f ".env.local" ]]; then
    SERVICE_ROLE_KEY=$(grep -E '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2-)
  fi
fi

if [[ -z "$SERVICE_ROLE_KEY" ]]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY not set."
  echo "Run 'npm run supabase:start' and copy the service_role key from the output into .env.local"
  exit 1
fi

ADMIN_EMAIL="admin@urwavilla.local"
ADMIN_PASSWORD="Admin@local123"
PROPERTY_ID="a1b2c3d4-0000-0000-0000-000000000001"

echo "Creating test admin user: $ADMIN_EMAIL"

RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\",
    \"email_confirm\": true,
    \"user_metadata\": { \"full_name\": \"Villa Admin\" }
  }")

USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -z "$USER_ID" ]]; then
  echo "User may already exist, or error:"
  echo "$RESPONSE"
  exit 0
fi

echo "Created user: $USER_ID"

# Assign admin role and link to property
psql "postgresql://postgres:postgres@localhost:54332/postgres" -c \
  "INSERT INTO profiles (id, full_name, role, property_id)
   VALUES ('${USER_ID}', 'Villa Admin', 'admin', '${PROPERTY_ID}')
   ON CONFLICT (id) DO UPDATE SET role = 'admin', property_id = '${PROPERTY_ID}';"

echo ""
echo "✓ Test admin ready"
echo "  Email:    $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo "  Login at: http://localhost:3000/admin/login"
