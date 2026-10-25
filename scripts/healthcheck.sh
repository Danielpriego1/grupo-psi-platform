#!/usr/bin/env bash
#
# Uptime watchdog for grupopsi.com.
#
# Probes the public HTTP surface and the TLS certificate, then pushes an ntfy
# notification ONLY on a state transition (healthy -> broken, broken -> healthy).
# Without the state file, a multi-hour outage would emit one notification per run
# and the alert would be ignored within the first hour.
#
# Scope, stated honestly: this runs on the same VPS it monitors, so it detects a
# broken deploy, a stopped Caddy container, or an expiring certificate. It cannot
# detect the VPS itself being down. That still needs an external monitor.
#
# Configuration: ~/.config/grupopsi-health/config, sourced as shell. Expected keys:
#   NTFY_TOPIC      topic on ntfy.sh to publish to (required to alert)
#   NTFY_SERVER     defaults to https://ntfy.sh
#   CERT_WARN_DAYS  defaults to 14

set -uo pipefail

CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/grupopsi-health"
CONFIG="$CONFIG_DIR/config"
STATE="$CONFIG_DIR/state"
LOG="${HEALTHCHECK_LOG:-$HOME/logs/grupopsi-health.log}"

NTFY_TOPIC=""
NTFY_SERVER="https://ntfy.sh"
CERT_WARN_DAYS=14

# shellcheck source=/dev/null
[[ -r "$CONFIG" ]] && source "$CONFIG"

UA="grupopsi-healthcheck/1.0"

http_code() {
  curl -sS -o /dev/null -w '%{http_code}' --max-time 15 -A "$UA" "$1" 2>/dev/null || printf '000'
}

failures=()

for url in "https://grupopsi.com/" "https://www.grupopsi.com/" "https://grupopsi.com/contacto"; do
  code="$(http_code "$url")"
  [[ "$code" == "200" ]] || failures+=("$url returned HTTP $code")
done

expiry="$(echo | openssl s_client -servername grupopsi.com -connect grupopsi.com:443 2>/dev/null \
  | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)"

if [[ -n "$expiry" ]]; then
  days=$(( ( $(date -d "$expiry" +%s) - $(date +%s) ) / 86400 ))
  (( days < CERT_WARN_DAYS )) && failures+=("TLS certificate expires in ${days} day(s)")
else
  failures+=("TLS certificate could not be read on grupopsi.com:443")
fi

if (( ${#failures[@]} == 0 )); then
  current="ok"
else
  current="broken"
fi

previous=""
[[ -r "$STATE" ]] && previous="$(cat "$STATE" 2>/dev/null)"

notify() {
  local title="$1" priority="$2" tags="$3" body="$4"
  if [[ -z "$NTFY_TOPIC" ]]; then
    echo "$(date -Is) WARN no NTFY_TOPIC configured, alert not delivered: $title" >&2
    return
  fi
  curl -sS --max-time 15 -o /dev/null \
    -H "Title: $title" \
    -H "Priority: $priority" \
    -H "Tags: $tags" \
    -d "$body" \
    "$NTFY_SERVER/$NTFY_TOPIC" 2>/dev/null \
    || echo "$(date -Is) WARN ntfy push failed for: $title" >&2
}

mkdir -p "$CONFIG_DIR" "$(dirname "$LOG")"

if [[ "$current" != "$previous" ]]; then
  if [[ "$current" == "broken" ]]; then
    body="$(printf '%s\n' "${failures[@]}")"
    {
      printf '%s DOWN %s\n' "$(date -Is)" "$(printf '%s; ' "${failures[@]}")"
    } >> "$LOG"
    notify "grupopsi.com is DOWN" "high" "rotating_light" "$body"
  else
    printf '%s UP again\n' "$(date -Is)" >> "$LOG"
    [[ "$previous" == "broken" ]] && notify "grupopsi.com recovered" "default" "white_check_mark" "All checks pass again."
  fi
  printf '%s' "$current" > "$STATE"
fi

if [[ "$current" == "broken" ]]; then
  exit 1
fi
exit 0
