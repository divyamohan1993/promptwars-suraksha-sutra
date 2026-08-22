#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${repo_dir}"

if [[ ! -f .env ]]; then
  echo "Missing ${repo_dir}/.env" >&2
  exit 1
fi

export APP_VERSION="$(git rev-parse --short HEAD)"
docker compose --env-file .env -f infra/compose/compose.prod.yml build
docker compose --env-file .env -f infra/compose/compose.prod.yml up -d --remove-orphans

for _ in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:3000/api/v1/health >/dev/null \
    && curl --fail --silent http://127.0.0.1:8080/ >/dev/null; then
    "${repo_dir}/scripts/install-edge.sh" https
    curl --fail --silent "${PUBLIC_ORIGIN}/healthz" >/dev/null
    echo "Deployed ${APP_VERSION} to ${PUBLIC_ORIGIN}"
    exit 0
  fi
  sleep 2
done

docker compose --env-file .env -f infra/compose/compose.prod.yml ps
docker compose --env-file .env -f infra/compose/compose.prod.yml logs --tail=100
exit 1

