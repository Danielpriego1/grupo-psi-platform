#!/usr/bin/env bash
# Supabase keep-alive ping.
# Prevents the free-tier project from pausing after 7 days of inactivity.
# Scheduled from cron; see README.md.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "$(date -Is) - ERROR: env file not found: $ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${VITE_SUPABASE_PUBLISHABLE_KEY:-}" ]]; then
  echo "$(date -Is) - ERROR: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY missing in $ENV_FILE"
  exit 1
fi

# Returns the HTTP status code for a path on the project, or 000 on a network failure.
ping() {
  curl -s -o /dev/null -w "%{http_code}" --max-time 20 \
    -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
    "$VITE_SUPABASE_URL$1"
}

# REST reaches Postgres through PostgREST, so it proves the database itself is awake.
# 200 with an empty array is a healthy response: RLS hides rows from the anon role.
db_status=$(ping "/rest/v1/clients?select=id&limit=1")
# Auth health covers the case where only the gateway is up and the database is not.
auth_status=$(ping "/auth/v1/health")

if [[ "$db_status" == "200" || "$db_status" == "206" ]]; then
  echo "$(date -Is) - OK: db=$db_status auth=$auth_status"
  exit 0
fi

echo "$(date -Is) - ERROR: db=$db_status auth=$auth_status (project may be paused)"
exit 1
