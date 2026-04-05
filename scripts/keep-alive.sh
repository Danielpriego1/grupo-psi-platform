#!/bin/bash
curl -s -o /dev/null -w "%{http_code}" \
  https://wcnbqlpbqansyvslxlth.supabase.co/rest/v1/ \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbmJxbHBicWFuc3l2c2x4bHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjQ2MDIsImV4cCI6MjA4ODYwMDYwMn0.jEHYbwi9_jfIZm5ypNXtMDIco4cfdet58t2haw_3vi8" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbmJxbHBicWFuc3l2c2x4bHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjQ2MDIsImV4cCI6MjA4ODYwMDYwMn0.jEHYbwi9_jfIZm5ypNXtMDIco4cfdet58t2haw_3vi8"
echo " - Supabase ping OK $(date)"
