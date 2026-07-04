#!/usr/bin/env bash
# Extract SPKI SHA-256 pins and iOS .cer bundle files for SSL pinning.
# Usage: ./scripts/extract-ssl-pins.sh tray-ecru.vercel.app

set -euo pipefail

HOST="${1:-tray-ecru.vercel.app}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_SSL_DIR="${SCRIPT_DIR}/../ios/app/SSLPinning"

echo "Public key pins for ${HOST}:"
PINS=()
INDEX=0

TMP_CERTS="$(mktemp)"
echo | openssl s_client -servername "$HOST" -connect "${HOST}:443" -showcerts 2>/dev/null \
  | awk '/BEGIN CERTIFICATE/,/END CERTIFICATE/{print}' > "${TMP_CERTS}"

while IFS= read -r line; do
  if [ "$line" = "-----BEGIN CERTIFICATE-----" ]; then
    cert=""
  fi
  cert="${cert}${line}"$'\n'
  if [ "$line" = "-----END CERTIFICATE-----" ]; then
    INDEX=$((INDEX + 1))
    PIN="$(printf '%s' "$cert" \
      | openssl x509 -pubkey -noout 2>/dev/null \
      | openssl pkey -pubin -outform der 2>/dev/null \
      | openssl dgst -sha256 -binary \
      | openssl enc -base64)"
    PINS+=("$PIN")
    echo "$PIN"

    mkdir -p "${IOS_SSL_DIR}"
    CER_PATH="${IOS_SSL_DIR}/${HOST}-${INDEX}.cer"
    printf '%s' "$cert" | openssl x509 -outform der -out "${CER_PATH}"
    echo "  -> wrote ${CER_PATH}"
  fi
done < "${TMP_CERTS}"

rm -f "${TMP_CERTS}"

if [ "${#PINS[@]}" -eq 0 ]; then
  echo "No certificates found for ${HOST}" >&2
  exit 1
fi

echo
echo "Add to app/.env (Android public-key pins):"
echo "SSL_PINNING_PUBLIC_KEY_HASHES=$(IFS=,; echo "${PINS[*]}")"
echo
echo "iOS: bundled .cer files above are used by react-native-ssl-pinning (not the .env hashes)."
