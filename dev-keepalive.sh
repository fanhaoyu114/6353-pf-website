#!/bin/bash
cd /home/z/my-project
while true; do
  echo "=== START $(date '+%H:%M:%S') ===" >> /home/z/my-project/dev.log
  bun run dev >> /home/z/my-project/dev.log 2>&1
  echo "=== DIED $(date '+%H:%M:%S'), restart in 2s ===" >> /home/z/my-project/dev.log
  # 清理损坏的缓存
  rm -rf /home/z/my-project/.next/cache /home/z/my-project/node_modules/.cache 2>/dev/null
  sleep 2
done
