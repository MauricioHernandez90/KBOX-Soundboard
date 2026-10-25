#!/bin/bash
set -e
echo "=== Caja Sonidos PRO - Setup Linux ==="
sudo apt update
sudo apt install -y libwebkit2gtk-4.0-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev nodejs npm
if ! command -v rustc &> /dev/null; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source $HOME/.cargo/env
fi
npm install
echo "Listo. Ejecuta: npm run dev"
