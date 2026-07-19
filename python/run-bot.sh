#!/bin/bash
while true; do
  python3 -u /workspace/projects/tera/python/tera/agent.py >> /tmp/tera-bot.log 2>&1
  echo "Bot exited at $(date). Restarting in 5s..." >> /tmp/tera-bot.log
  sleep 5
done
