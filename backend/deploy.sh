#!/usr/bin/env bash
# Beheer van het vertrouwelijke meldloket (Cloudflare Worker + R2 + Turnstile).
#
# Herhaalbaar: bestaande bucket en secrets worden overgeslagen, niet overschreven.
# Secrets komen nooit in deze repository terecht.
#
#   ./deploy.sh status    Toon huidige stand
#   ./deploy.sh setup     Bucket, deploy en ontbrekende secrets
#   ./deploy.sh enable    Zet ontvangst aan (ACCEPT_REPORTS=true)
#   ./deploy.sh disable   Zet ontvangst uit
#
# Verwacht CLOUDFLARE_API_TOKEN en CLOUDFLARE_ACCOUNT_ID in de omgeving:
#   set -a; . ~/.config/vve-cloudflare.env; set +a

set -euo pipefail

WORKER="vve-meldingen"
BUCKET="vve-meldingen-prive"
KEYFILE="${HOME}/vve-meldingen-sleutels.txt"
SECRETS=(TAG_RANGES_JSON ENCRYPTION_KEY RATE_LIMIT_SECRET TURNSTILE_SECRET_KEY RESEND_API_KEY NOTIFY_FROM NOTIFY_TO)

ok()   { printf '[OK]   %s\n' "$*"; }
warn() { printf '[WARN] %s\n' "$*" >&2; }
fail() { printf '[FAIL] %s\n' "$*" >&2; exit 1; }
step() { printf '\n=== %s ===\n' "$*"; }

wr() { timeout 300 npx --yes wrangler@4 "$@"; }

cd "$(dirname "$0")"
[ -f wrangler.toml ] || fail "wrangler.toml niet gevonden. Draai dit vanuit backend/."
[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || fail "CLOUDFLARE_API_TOKEN ontbreekt in de omgeving."
[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ] || fail "CLOUDFLARE_ACCOUNT_ID ontbreekt in de omgeving."

api() {
  local method="$1" path="$2"; shift 2
  curl -sS -X "${method}" "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}${path}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" "$@"
}

has_secret() {
  wr secret list --name "${WORKER}" 2>/dev/null | python3 -c "
import sys, json
try: data = json.load(sys.stdin)
except Exception: sys.exit(1)
sys.exit(0 if any(x.get('name') == sys.argv[1] for x in data) else 1)
" "$1"
}

put_secret() {
  printf '%s' "$2" | wr secret put "$1" --name "${WORKER}" >/dev/null \
    && ok "Secret $1 ingesteld" || fail "Secret $1 kon niet worden ingesteld."
}

generate_key() {
  local name="$1" value
  value="$(python3 -c 'import os,base64;print(base64.b64encode(os.urandom(32)).decode())')"
  put_secret "${name}" "${value}"
  umask 077
  printf '%s=%s\n' "${name}" "${value}" >> "${KEYFILE}"
  chmod 600 "${KEYFILE}"
  ok "${name} ook bewaard in ${KEYFILE}"
}

ask_tag_ranges() {
  cat <<'EOF'

TAG_RANGES_JSON - begin- en eindgrenzen van de ingekochte tagpartijen.
Geen lijst met afzonderlijke tags. Zie backend/README.md. Vorm:

  [{"radix":10,"width":10,"start":"0001234500","end":"0001234599"}]

Geef het pad naar een bestand met die JSON, zodat het uit je shell-historie blijft.
EOF
  local path json
  read -r -p "Pad naar JSON-bestand: " path
  [ -f "${path}" ] || fail "Bestand niet gevonden: ${path}"

  # Valideer met exact dezelfde parser als de Worker, voordat er iets omhoog gaat.
  node --input-type=module -e '
    import {readFileSync} from "node:fs";
    const {parseRanges} = await import(process.argv[1]);
    const ranges = parseRanges(readFileSync(process.argv[2], "utf8"));
    console.error(`[OK]   ${ranges.length} partij(en) geldig bevonden`);
  ' "$(pwd)/worker.mjs" "${path}" || fail "Ongeldige tagreeksen. Er is niets geupload."

  json="$(python3 -c 'import sys,json,io;print(json.dumps(json.loads(io.open(sys.argv[1]).read())))' "${path}")"
  put_secret TAG_RANGES_JSON "${json}"
}

ask_secret() {
  local name="$1" prompt="$2" value
  read -r -s -p "${prompt}: " value; echo
  [ -n "${value}" ] || fail "${name} mag niet leeg zijn."
  put_secret "${name}" "${value}"
}

ask_recipients() {
  local raw json
  read -r -p "NOTIFY_TO (e-mailadressen, komma-gescheiden): " raw
  json="$(RAW="${raw}" python3 -c '
import os, json, re, sys
items = [s.strip() for s in os.environ["RAW"].split(",") if s.strip()]
if not 1 <= len(items) <= 5: sys.exit("1 tot 5 ontvangers")
for a in items:
    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", a): sys.exit("ongeldig adres: " + a)
print(json.dumps(items))
')" || fail "Ongeldige ontvangerslijst."
  put_secret NOTIFY_TO "${json}"
}

set_accept() {
  local value="$1"
  python3 -c "
import io, re, sys
want = sys.argv[1]
path = 'wrangler.toml'
text = io.open(path, encoding='utf-8').read()
new, count = re.subn(r'^ACCEPT_REPORTS = .*\$', 'ACCEPT_REPORTS = \"%s\"' % want, text, flags=re.M)
if not count: sys.exit('ACCEPT_REPORTS niet gevonden in wrangler.toml')
if new != text:
    io.open(path, 'w', encoding='utf-8').write(new)
    print('[OK]   wrangler.toml op ACCEPT_REPORTS=%s gezet' % want)
else:
    print('[OK]   ACCEPT_REPORTS stond al op %s' % want)
" "${value}" || fail "wrangler.toml kon niet worden aangepast."
  wr deploy || fail "Deploy mislukt."
  ok "Gedeployed met ACCEPT_REPORTS=${value}"
  warn "Commit de wijziging in wrangler.toml zodat de repository de werkelijkheid volgt."
}

cmd_status() {
  printf 'Worker:   %s\n' "${WORKER}"
  printf 'Bucket:   %s\n' "${BUCKET}"
  printf 'Vars:     %s\n' "$(grep -E '^(ACCEPT_REPORTS|ALLOWED_ORIGIN|KEY_ID)' wrangler.toml | tr '\n' ' ')"
  printf 'Voorkant: %s\n' "$(grep -oE 'enabled: *(true|false)' ../assets/melding-config.js || echo onbekend)"
  printf 'Secrets:\n'
  for name in "${SECRETS[@]}"; do
    if has_secret "${name}"; then printf '  [OK]   %s\n' "${name}"; else printf '  [MIST] %s\n' "${name}"; fi
  done
}

cmd_setup() {
  step "Bucket"
  if api GET /r2/buckets | grep -q "\"${BUCKET}\""; then
    ok "Bucket ${BUCKET} bestaat al"
  else
    api POST /r2/buckets -H 'Content-Type: application/json' -H 'cf-r2-jurisdiction: eu' \
      --data "{\"name\":\"${BUCKET}\",\"locationHint\":\"weur\"}" >/dev/null
    ok "Bucket ${BUCKET} aangemaakt met EU-jurisdictie"
  fi
  warn "Controleer in het dashboard: geen publieke toegang en een lifecycle van 180 dagen."

  step "Deploy"
  wr deploy || fail "Deploy mislukt."

  step "Secrets"
  for name in "${SECRETS[@]}"; do
    if has_secret "${name}"; then ok "${name} bestaat al - overgeslagen"; continue; fi
    case "${name}" in
      TAG_RANGES_JSON)      ask_tag_ranges ;;
      ENCRYPTION_KEY)       generate_key ENCRYPTION_KEY ;;
      RATE_LIMIT_SECRET)    generate_key RATE_LIMIT_SECRET ;;
      TURNSTILE_SECRET_KEY) ask_secret TURNSTILE_SECRET_KEY "Turnstile server-secret" ;;
      RESEND_API_KEY)       ask_secret RESEND_API_KEY "Resend API-sleutel" ;;
      NOTIFY_FROM)          ask_secret NOTIFY_FROM "NOTIFY_FROM (geverifieerd afzenderadres)" ;;
      NOTIFY_TO)            ask_recipients ;;
    esac
  done

  step "Stand"; cmd_status
  cat <<EOF

Bewaar ${KEYFILE} in de wachtwoordkluis van de VvE. Zonder ENCRYPTION_KEY is geen
enkele ontvangen melding nog te ontsleutelen; Cloudflare kan die sleutel niet
voor je herstellen.
EOF
}

cmd_enable() {
  step "Voorwaarden"
  local missing=0
  for name in "${SECRETS[@]}"; do
    if has_secret "${name}"; then ok "${name} aanwezig"; else warn "${name} ONTBREEKT"; missing=1; fi
  done
  [ "${missing}" -eq 0 ] || fail "Zet eerst alle secrets met ./deploy.sh setup."
  step "Ontvangst aanzetten"; set_accept true
}

cmd_disable() {
  step "Ontvangst uitzetten"; set_accept false
  warn "Zet ook enabled op false in assets/melding-config.js."
}

case "${1:-status}" in
  status)  cmd_status ;;
  setup)   cmd_setup ;;
  enable)  cmd_enable ;;
  disable) cmd_disable ;;
  *)       fail "Onbekend: ${1}. Gebruik status, setup, enable of disable." ;;
esac
