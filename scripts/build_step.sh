#!/bin/bash

echo "Build script"

npm --prefix frontend ci
npm --prefix backend ci

echo "Installing Chromium for Puppeteer..."
cd backend && npx puppeteer browsers install chrome

npm run build:ui