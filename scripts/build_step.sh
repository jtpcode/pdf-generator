#!/bin/bash

echo "Build script"

npm --prefix frontend install
npm --prefix backend install
npm --prefix backend run build:ui