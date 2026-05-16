#!/usr/bin/env bash
# Keep-alive ping para evitar que Lovable Cloud pause la BD por inactividad.
# Ejecutar via cron cada 5 días.

SUPABASE_URL="https://wcnbqlpbqansyvslxlth.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbmJxbHBicWFuc3l2c2x4bHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjQ2MDIsImV4cCI6MjA4ODYwMDYwMn0.jEHYbwi9_jfIZm5ypNXtMDIco4cfdet58t2haw_3vi8"

status=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/")

if [ "$status" = "200" ]; then
  echo "$(date) - OK: Supabase respondió 200"
  exit 0
else
  echo "$(date) - ERROR: status=$status"
  exit 1
fi
