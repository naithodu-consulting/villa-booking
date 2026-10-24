#!/usr/bin/env bash
#
# Calls the calendar sync endpoint. This is what a scheduler runs.
#
# Hostinger cron, hourly, offset off the hour so it does not land with every
# other job on a shared host:
#
#   17 * * * * /home/<user>/villa-booking/scripts/ical-sync.sh >> /home/<user>/ical-sync.log 2>&1
#
# CRON_SECRET and APP_URL come from the environment. A cron job gets almost no
# environment, so set them in the crontab itself or point ENV_FILE at a file
# holding them.
set -euo pipefail

ENV_FILE="${ENV_FILE:-}"
if [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
  set -a; . "$ENV_FILE"; set +a
fi

: "${CRON_SECRET:?CRON_SECRET is not set}"
APP_URL="${APP_URL:-https://villa19.in}"

# -f so a non-2xx is a failure the scheduler can see; -m so a hung request
# cannot overlap the next run.
curl -fsS -m 60 \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${APP_URL}/api/cron/ical-sync" \
  | sed "s/^/[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] /"
