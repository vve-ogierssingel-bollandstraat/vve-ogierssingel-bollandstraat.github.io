// Public configuration only. Never add secrets, tag numbers or resident data here.
// Reception is administered separately; see backend/README.md and backend/deploy.sh.
window.VVE_MELDING_CONFIG = Object.freeze({
  enabled: true,
  endpoint: "https://vve-meldingen.vve-ogierssingel.workers.dev/api/meldingen",
  turnstileSiteKey: "0x4AAAAAAEr5tw0elQhSZbtG"
});
