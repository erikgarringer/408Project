#!/usr/bin/env bash
# LiftLog — App configuration and launch
# Run after install.sh, from the project root directory
# Usage: bash scripts/configure.sh

set -euo pipefail

BOLD="\e[1m"
GREEN="\e[32m"
YELLOW="\e[33m"
RESET="\e[0m"

info()    { echo -e "${GREEN}[configure]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[configure]${RESET} $*"; }
section() { echo -e "\n${BOLD}=== $* ===${RESET}"; }

# Must be run from project root
if [[ ! -f "package.json" ]]; then
  echo "Error: run this script from the project root (where package.json lives)"
  exit 1
fi

# ── 1. npm install ────────────────────────────────────────────────────────────
section "Installing Node dependencies"
npm install
info "Dependencies installed"

# ── 2. .env setup ────────────────────────────────────────────────────────────
section "Environment configuration"
if [[ -f ".env" ]]; then
  warn ".env already exists — skipping copy"
else
  cp .env.example .env
  info "Copied .env.example → .env"

  read -rp "  Enter PORT (default 3000): " USER_PORT
  USER_PORT="${USER_PORT:-3000}"
  sed -i "s/^PORT=.*/PORT=${USER_PORT}/" .env

  info ".env written with PORT=${USER_PORT}"
fi

# Changed how init is handled. 
# # ── 3. Database init ──────────────────────────────────────────────────────────
# section "Initializing database"
# mkdir -p db
# node db/init-db.js
# info "Schema applied"

# # ── 4. Seed sample data ───────────────────────────────────────────────────────
# section "Seeding sample data"
# node db/seed.js

# ── 5. Start with PM2 ────────────────────────────────────────────────────────
section "Starting app with PM2"
pm2 delete liftlog 2>/dev/null || true
pm2 start app.js --name liftlog
pm2 save
info "App started and PM2 process list saved"

# ── 6. Done ───────────────────────────────────────────────────────────────────
section "configure.sh complete"
PUBLIC_IP=$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 || echo "<your-ec2-ip>")
info "LiftLog is live at http://${PUBLIC_IP}"
info "To check status: pm2 status"
info "To view logs:    pm2 logs liftlog"
