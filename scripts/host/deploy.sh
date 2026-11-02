#!/bin/zsh
# Mac mini（Tailscale の mac-mini-1）のハコよみを main の最新にする（L-20261102-39）。
# 使い方：scripts/host/deploy.sh   （手元の Mac から。.env.local は Mac mini 側に置いたものを使う）
set -euo pipefail
HOST=${HAKOYOMI_HOST:-mac-mini-1}

ssh "$HOST" 'set -euo pipefail
  export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH
  cd ~/hakoyomi
  git fetch -q origin main && git reset -q --hard origin/main
  npm ci --no-audit --no-fund --silent
  npm run build --silent
  launchctl kickstart -k "gui/$(id -u)/dev.yutok.hakoyomi.web"
  git log --oneline -1'
