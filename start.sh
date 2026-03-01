#!/usr/bin/env bash
set -e

npm run ensure:deps

npx vite --host --open
