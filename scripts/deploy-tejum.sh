#!/usr/bin/env bash
# Auto-deploy main to https://tejum.in/perfumes/ on the cPanel host.
# Cron runs this under the tejum user. It never touches the site's other paths.
set -Eeuo pipefail
export PATH="/opt/cpanel/ea-nodejs22/bin:/usr/local/cpanel/3rdparty/lib/path-bin:/usr/bin:/bin:/usr/local/bin:$PATH"
export HOME="/home/tejum"
APP_DIR="/home/tejum/perfumes-source"
WEB_DIR="/home/tejum/public_html/perfumes"
REVISION_FILE="$APP_DIR/.deployed-revision"
cd "$APP_DIR"
exec 9>"$APP_DIR/.deploy.lock"
flock -n 9 || exit 0

git fetch --quiet --prune origin main
LATEST="$(git rev-parse origin/main)"
CURRENT="$(cat "$REVISION_FILE" 2>/dev/null || true)"
if [[ "$LATEST" == "$CURRENT" && -s "$WEB_DIR/index.html" ]]; then
  exit 0
fi

echo "[$(date -Is)] Deploying perfume commit $LATEST"
# This resets only the dedicated source checkout; no other server files.
git reset --hard origin/main >/dev/null
npm install --no-audit --no-fund --prefer-offline
npm run typecheck
npm run build
test -s out/index.html
test -d out/_next/static
# Keep the public site untouched if dependency installation or build fails.
install -d -m 755 "$WEB_DIR"
# delay-updates avoids serving partially written hashed JS/CSS files.
rsync -a --delete-delay --delay-updates out/ "$WEB_DIR/"
find "$WEB_DIR" -type d -exec chmod 755 {} +
find "$WEB_DIR" -type f -exec chmod 644 {} +
printf '%s\n' "$LATEST" > "$REVISION_FILE"
echo "[$(date -Is)] Perfumes deployed: $LATEST"
