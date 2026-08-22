#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="${repo_dir}/.env"

if [[ ! -f "${env_file}" ]]; then
  echo "Missing ${env_file}" >&2
  exit 1
fi

public_host="$(sed -n 's/^PUBLIC_HOST=//p' "${env_file}" | tail -n 1)"
if [[ ! "${public_host}" =~ ^[a-zA-Z0-9.-]+$ ]]; then
  echo "PUBLIC_HOST must be a DNS hostname" >&2
  exit 1
fi

resolved_ip="$(getent ahostsv4 "${public_host}" | awk 'NR == 1 {print $1}')"
expected_ip="$(curl -fsS -H 'Metadata-Flavor: Google' http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)"
if [[ "${resolved_ip}" != "${expected_ip}" ]]; then
  echo "${public_host} resolves to ${resolved_ip}, expected ${expected_ip}" >&2
  exit 1
fi

sudo certbot certonly --nginx --non-interactive --agree-tos --register-unsafely-without-email -d "${public_host}"
"${repo_dir}/scripts/install-edge.sh" https
curl -fsS "https://${public_host}/healthz" >/dev/null
echo "TLS certificate active for ${public_host}"
