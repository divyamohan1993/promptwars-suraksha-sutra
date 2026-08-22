#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="${repo_dir}/.env"
mode="${1:-bootstrap}"

if [[ ! -f "${env_file}" ]]; then
  echo "Missing ${env_file}" >&2
  exit 1
fi

public_host="$(sed -n 's/^PUBLIC_HOST=//p' "${env_file}" | tail -n 1)"
if [[ ! "${public_host}" =~ ^[a-zA-Z0-9.-]+$ ]]; then
  echo "PUBLIC_HOST must be a DNS hostname" >&2
  exit 1
fi

case "${mode}" in
  bootstrap) template="${repo_dir}/infra/nginx/bootstrap.conf.template" ;;
  https) template="${repo_dir}/infra/nginx/https.conf.template" ;;
  *) echo "Usage: $0 [bootstrap|https]" >&2; exit 1 ;;
esac

rendered="$(mktemp)"
trap 'rm -f "${rendered}"' EXIT
sed "s/__PUBLIC_HOST__/${public_host}/g" "${template}" > "${rendered}"

sudo install -m 0644 "${rendered}" /etc/nginx/sites-available/suraksha-sutra.conf
sudo ln -sfn /etc/nginx/sites-available/suraksha-sutra.conf /etc/nginx/sites-enabled/suraksha-sutra.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "Installed ${mode} edge configuration for ${public_host}"
