#!/bin/bash
curl -s -o /dev/null -w "%{http_code}" \
  https://wcnbqlpbqansyvslxlth.supabase.co/rest/v1/ \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbmJxbHBicWFuc3l2c2x4bHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjQ2MDIsImV4cCI6MjA4ODYwMDYwMn0.jEHYbwi9_jfIZm5ypNXtMDIco4cfdet58t2haw_3vi8" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbmJxbHBicWFuc3l2c2x4bHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjQ2MDIsImV4cCI6MjA4ODYwMDYwMn0.jEHYbwi9_jfIZm5ypNXtMDIco4cfdet58t2haw_3vi8"
echo " - Supabase ping OK $(date)"
#!/usr/bin/env bash

SUPABASE_URL="https://faadsipcsecmulwhbjah.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYWRzaXBjc2VjbXVsd2hiamFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDc1MTIsImV4cCI6MjA4ODUyMzUxMn0.VCz8zfXRlz6iQEqSyYkhRfBSmQCNZPlj-twl37ZRXa0"

response=$(curl -s \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/")

if [ -z "$response" ]; then
  echo "$(date) - ERROR: respuesta vacía"
  exit 1
fi

echo "$(date) - OK: Supabase respondió"

