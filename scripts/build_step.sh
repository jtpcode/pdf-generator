#!/bin/bash

echo "Build script"

npm --prefix frontend ci
npm --prefix backend ci

npm --prefix backend run build:ui