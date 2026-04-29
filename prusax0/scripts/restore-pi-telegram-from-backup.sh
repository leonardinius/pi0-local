#!/usr/bin/env bash
set -euo pipefail
# Restore @llblab/pi-telegram from a backup .tgz made by our backup step
# Usage:
#   ./restore-pi-telegram-from-backup.sh /home/agent/.pi/agent/tmp/pi-telegram-0.3.0-backup-20260429005456.tgz
# Optionally pass --restart to restart systemd service work-pi after install

TGZ=${1:-}
RESTART=${2:-}
if [[ -z "$TGZ" || ! -f "$TGZ" ]]; then
  echo "Usage: $0 /path/to/pi-telegram-*.tgz [--restart]" >&2
  exit 2
fi

BIN_DIR="$HOME/.npm-global/bin"
PKG_DIR="$HOME/.npm-global/lib/node_modules/@llblab/pi-telegram"

# Install from local tarball (keeps our patched contents)
npm i -g "$TGZ"

# Quick sanity: binary still present
if [[ ! -x "$BIN_DIR/pi" ]]; then
  echo "ERROR: pi binary not found at $BIN_DIR/pi after reinstall" >&2
  exit 1
fi

echo "Installed @llblab/pi-telegram from $TGZ"

if [[ "$RESTART" == "--restart" ]]; then
  if command -v sudo >/dev/null 2>&1; then
    sudo systemctl restart work-pi
    sudo systemctl status --no-pager --lines=20 work-pi || true
  else
    echo "NOTE: sudo not available, skip restart."
  fi
fi
