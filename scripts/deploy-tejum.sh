#!/usr/bin/env bash
# Publish GitHub Actions' verified static export to https://tejum.in/perfumes/.
# Runs in the tejum account; never modifies other tejum.in directories.
set -Eeuo pipefail
export PATH="/usr/local/cpanel/3rdparty/lib/path-bin:/usr/bin:/bin:/usr/local/bin:$PATH"
export HOME="/home/tejum"
APP_DIR="/home/tejum/perfumes-source"
WEB_DIR="/home/tejum/public_html/perfumes"
REVISION_FILE="$APP_DIR/.deployed-revision"
cd "$APP_DIR"
exec 9>"$APP_DIR/.deploy.lock"
flock -n 9 || exit 0

# --single-branch checkout needs an explicit remote-tracking ref for deploy-perfumes.
git fetch --quiet --prune origin \
  +refs/heads/main:refs/remotes/origin/main \
  +refs/heads/deploy-perfumes:refs/remotes/origin/deploy-perfumes
SOURCE_SHA="$(git rev-parse origin/main)"
BUILT_SHA="$(git show origin/deploy-perfumes:.source-revision | tr -d '\r\n')"
CURRENT="$(cat "$REVISION_FILE" 2>/dev/null || true)"
if [[ "$BUILT_SHA" != "$SOURCE_SHA" ]]; then
  echo "[$(date -Is)] Awaiting GitHub Actions build for $SOURCE_SHA (latest artifact: $BUILT_SHA)"
  exit 0
fi
if [[ "$CURRENT" == "$SOURCE_SHA" && -s "$WEB_DIR/index.html" ]]; then
  exit 0
fi

echo "[$(date -Is)] Publishing verified perfume build $SOURCE_SHA"
# Update only this dedicated source checkout so the versioned deploy script stays current.
git reset --hard origin/main >/dev/null
STAGE="$(mktemp -d "$APP_DIR/.staged-site.XXXXXX")"
trap 'rm -rf "$STAGE"' EXIT
git archive origin/deploy-perfumes | tar -xf - -C "$STAGE"
test -s "$STAGE/index.html"
test -d "$STAGE/_next/static"
install -d -m 755 "$WEB_DIR"
rsync -a --delete-delay --delay-updates \
  --exclude='.source-revision' --exclude='.nojekyll' \
  "$STAGE/" "$WEB_DIR/"
find "$WEB_DIR" -type d -exec chmod 755 {} +
find "$WEB_DIR" -type f -exec chmod 644 {} +
printf '%s\n' "$SOURCE_SHA" > "$REVISION_FILE"
echo "[$(date -Is)] Perfumes deployed: $SOURCE_SHA"
