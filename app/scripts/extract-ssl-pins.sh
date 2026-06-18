#!/usr/bin/env bash
# Extract SPKI SHA-256 pins for SSL pinning configuration.
# Usage: ./scripts/extract-ssl-pins.sh tray-ecru.vercel.app

set -euo pipefail

HOST="${1:-tray-ecru.vercel.app}"

echo "Public key pins for ${HOST}:"
echo | openssl s_client -servername "$HOST" -connect "${HOST}:443" -showcerts 2>/dev/null \
  | awk '/BEGIN CERTIFICATE/,/END CERTIFICATE/{print}' \
  | while IFS= read -r line; do
      if [ "$line" = "-----BEGIN CERTIFICATE-----" ]; then
        cert=""
      fi
      cert="${cert}${line}"$'\n'
      if [ "$line" = "-----END CERTIFICATE-----" ]; then
        printf '%s' "$cert" \
          | openssl x509 -pubkey -noout 2>/dev/null \
          | openssl pkey -pubin -outform der 2>/dev/null \
          | openssl dgst -sha256 -binary \
          | openssl enc -base64
      fi
    done
