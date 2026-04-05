#!/bin/bash

echo "[DevilXteam MD] Starting..."

if command -v yt-dlp &> /dev/null; then
  echo "[yt-dlp] Found: $(which yt-dlp)"
elif [ -f /tmp/yt-dlp ]; then
  chmod 755 /tmp/yt-dlp 2>/dev/null
  echo "[yt-dlp] Found: /tmp/yt-dlp"
elif [ -f /usr/local/bin/yt-dlp ]; then
  chmod 755 /usr/local/bin/yt-dlp 2>/dev/null
  echo "[yt-dlp] Found: /usr/local/bin/yt-dlp"
else
  echo "[yt-dlp] Not found, downloading standalone binary..."
  curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o /tmp/yt-dlp 2>/dev/null || \
  curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /tmp/yt-dlp 2>/dev/null
  chmod 755 /tmp/yt-dlp 2>/dev/null
  if [ -f /tmp/yt-dlp ]; then
    echo "[yt-dlp] Downloaded to /tmp/yt-dlp"
  else
    echo "[yt-dlp] Download failed - some features limited"
  fi
fi

if command -v python3 &> /dev/null; then
  echo "[python3] Found: $(python3 --version 2>&1)"
else
  echo "[python3] Not found - using standalone yt-dlp binary"
fi

if command -v ffmpeg &> /dev/null; then
  echo "[ffmpeg] Found"
else
  echo "[ffmpeg] Not found - media conversion limited"
fi

mkdir -p temp

node index.js
