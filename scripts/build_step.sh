#!/bin/bash

echo "Build script"

npm --prefix frontend ci
npm --prefix backend ci

echo "Installing Chromium for Puppeteer..."
npx puppeteer browsers install chrome

npm --prefix backend run build:ui