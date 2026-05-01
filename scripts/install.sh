#!/usr/bin/env bash
# install.sh — LiftLog EC2 setup
# Usage: bash scripts/install.sh

set -euo pipefail

BOLD="\e[1m"
GREEN="\e[32m"
YELLOW="\e[33m"
RESET="\e[0m"

info()    { echo -e "${GREEN}[install]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[install]${RESET} $*"; }
section() { echo -e "\n${BOLD}=== $* ===${RESET}"; }

section "Updating system packages"
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl git sqlite3 build-essential

section "Installing Docker"
if command -v docker &>/dev/null; then
  info "Docker already installed — skipping"
else
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker ubuntu
  info "Docker installed"
fi
info "Docker $(docker --version)"

section "Configuring swap"
if [ ! -f /swapfile ]; then
  sudo fallocate -l 1G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  info "1GB swap created and enabled"
else
  sudo swapon /swapfile 2>/dev/null || true
  info "Swap already configured — re-enabled"
fi

section "install.sh complete"
info "System is ready. Clone your repo and run: sudo docker compose up --build -d"