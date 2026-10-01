#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
test -f .env
test -z "$(git status --porcelain --untracked-files=no)" || {
  echo 'Deployment checkout has local changes; refusing to overwrite them.' >&2
  exit 1
}

git fetch --quiet origin main
previous=$(git rev-parse HEAD)
target=$(git rev-parse origin/main)
if [ "$previous" = "$target" ]; then
  echo "BookMG already at $target"
  exit 0
fi
git merge-base --is-ancestor "$previous" "$target" || {
  echo 'origin/main is not a fast-forward; refusing to replace the deployment.' >&2
  exit 1
}

domain=$(sed -n 's/^BOOKMG_DOMAIN=//p' .env | head -n 1)
test -n "$domain"
check() {
  docker compose exec -T be npm run db:check >/dev/null &&
    curl --fail --silent --show-error --retry 10 --retry-delay 3 --retry-all-errors \
      --resolve "$domain:443:127.0.0.1" "https://$domain/api/health" -o /dev/null &&
    curl --fail --silent --show-error --retry 10 --retry-delay 3 --retry-all-errors \
      --resolve "$domain:443:127.0.0.1" "https://$domain/shelf" -o /dev/null
}

git merge --ff-only "$target"
if docker compose up -d --build && check; then
  echo "BookMG deployed $target"
  exit 0
fi

echo "Deployment failed; restoring $previous" >&2
git reset --hard "$previous"
docker compose up -d --build && check || true
exit 1
