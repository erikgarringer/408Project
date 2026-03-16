#!/usr/bin/env bash
# LiftLog — System setup for a fresh Ubuntu 24.04 EC2 instance
# Run once as ubuntu (sudo privileges required)
# Usage: bash install.sh

set -euo pipefail

# Text formatting
BOLD="\e[1m"
GREEN="\e[32m"
YELLOW="\e[33m"
RESET="\e[0m"

info()    { echo -e "${GREEN}[install]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[install]${RESET} $*"; }
section() { echo -e "\n${BOLD}=== $* ===${RESET}"; }

# ── 1. System packages ───────────────────────────────────────────────────────
section "Updating system packages"
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl git sqlite3 build-essential

# ── 2. Node.js 20 via NodeSource ─────────────────────────────────────────────
section "Installing Node.js 20"
if command -v node &>/dev/null && [[ "$(node -v)" == v20* ]]; then
  info "Node.js 20 already installed — skipping"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
info "Node $(node -v) / npm $(npm -v)"

# ── 3. PM2 ───────────────────────────────────────────────────────────────────
section "Installing PM2"
if command -v pm2 &>/dev/null; then
  info "PM2 already installed — skipping"
else
  sudo npm install -g pm2
fi

# Configure PM2 to start on boot
PM2_STARTUP=$(pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>&1 | tail -1)
if [[ "$PM2_STARTUP" == sudo* ]]; then
  eval "$PM2_STARTUP"
fi
info "PM2 startup configured"

# ── 4. nginx ─────────────────────────────────────────────────────────────────
section "Installing and configuring nginx"
sudo apt-get install -y nginx

# Write reverse proxy config
sudo tee /etc/nginx/sites-available/liftlog > /dev/null <<'NGINX'
server {
    listen 80;
    server_name _;

    # Proxy all traffic to the Express app
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

# Enable the site, remove default
sudo ln -sf /etc/nginx/sites-available/liftlog /etc/nginx/sites-enabled/liftlog
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
info "nginx configured as reverse proxy → port 3000"

# ── 5. Done ──────────────────────────────────────────────────────────────────
section "install.sh complete"
info "System is ready. Run configure.sh next to set up the app."
