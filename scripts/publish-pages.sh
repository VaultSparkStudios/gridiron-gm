#!/usr/bin/env bash
# Publish the desktop and mobile builds to the gh-pages branch, and only if everything passes:
# unit tests, a production build, and the browser smoke test (a full season played end to end).
# Usage: npm run publish:pages [-- <repo-url>]
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE="${1:-https://github.com/EvanDAmours/27_Gridiron_GM}"

echo "== unit tests";   npm test --silent
echo "== build";        npm run build --silent
echo "== smoke test";   npm run smoke --silent
echo "== pages build";  npm run build:pages:all --silent

rev="$(git rev-parse --short HEAD)"
cd dist
touch .nojekyll
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Publish ${rev}"
git push -q -f "$REMOTE" gh-pages 2>&1 | grep -v "acknowledgments\|negotiation" || true
rm -rf .git
echo "Published ${rev}: desktop $(ls assets | grep '^index-.*js$'), mobile $(ls mobile/assets | grep '^index-.*js$')"
