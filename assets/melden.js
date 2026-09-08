"use strict";

// De dertien niet-Nederlandse tabellen staan in assets/melden-i18n.js.
const translations = Object.assign({}, window.VVE_MELDEN_I18N);

const nl = {};
document.querySelectorAll("[data-i18n]").forEach(el => { nl[el.dataset.i18n] = el.textContent; });
Object.assign(nl,{tagWhereAlt:"Twee tags met een pijl naar de code op de metalen beugel, en een invoerveld waarin dat nummer wordt ingevuld.",sending:"Bezig met verzenden…",invalid:"Controleer de verplichte velden.",fileError:"Gebruik maximaal 3 JPG-, PNG- of PDF-bestanden van maximaal 2 MB per bestand.",tagError:"Vul een tagnummer van 4–32 letters of cijfers in, of kies voor een anoniem signaal.",captcha:"Rond de beveiligingscontrole af voordat u verzendt.",serverError:"De ontvangst kon niet worden bevestigd. Uw invoer staat er nog. Probeer het later opnieuw. Uw melding kan al wel zijn aangekomen; vermeld bij opnieuw verzenden dat het mogelijk een dubbele melding is.",rateError:"Te veel pogingen. Wacht een minuut en probeer opnieuw.",captchaError:"De beveiligingscontrole is verlopen of niet gelukt. Voer deze opnieuw uit.",captchaBlocked:"De beveiligingscontrole kon niet worden geladen. Schakel een adblocker of privacy-extensie uit voor deze pagina, of probeer een andere browser. Melden per e-mail kan ook.",ready:"Uw melding wordt beveiligd verzonden. Het bestuur controleert uw tag intern.",futureError:"De datum van de gebeurtenis mag niet in de toekomst liggen."});
translations.nl = nl;
const form = document.getElementById("report-form"), submit = document.getElementById("submit"), error = document.getElementById("error");
const config = window.VVE_MELDING_CONFIG || {};
let language = "nl", token = "", widgetId, busy = false, ready = false;
const t = key => translations[language][key] || nl[key];
const $ = id => document.getElementById(id);
const localDate = new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Amsterdam",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
$("event-date").max = localDate;
function setLanguage(code) {
  language = translations[code] ? code : "en";
  document.documentElement.lang = language;
  document.querySelectorAll("[data-i18n]").forEach(el => {el.textContent = t(el.dataset.i18n);});
  document.querySelectorAll("[data-i18n-alt]").forEach(el => {el.alt = t(el.dataset.i18nAlt);});
  document.querySelectorAll("[data-language]").forEach(el => el.setAttribute("aria-pressed",String(el.dataset.language === language)));
  $("availability").textContent = t(ready ? "ready" : "unavailable");
  submit.textContent = t(busy ? "sending" : "submit");
  error.hidden = true;
}
document.querySelectorAll("[data-language]").forEach(el => el.addEventListener("click",() => setLanguage(el.dataset.language)));
setLanguage(new URLSearchParams(location.search).get("lang") || (navigator.language || "nl").split("-")[0]);
function showError(key) {error.textContent = t(key);error.hidden = false;error.focus();}
// Het vinkje heeft gevolgen die de bewoner niet kan overzien: geen opvolging,
// geen contact, kortere bewaartermijn. Daarom een bevestiging vooraf.
const anonDialog = $("anon-dialog");
function undoAnonymous() {
  $("anonymous").checked = false;
  $("anonymous").dispatchEvent(new Event("change",{bubbles:true}));
  $("tag").focus();
}
$("anonymous").addEventListener("change",() => {if ($("anonymous").checked) anonDialog.showModal();});
$("anon-back").addEventListener("click",() => {anonDialog.close();undoAnonymous();});
$("anon-proceed").addEventListener("click",() => anonDialog.close());
// Escape telt als terugkeren: dat is de veilige uitkomst, niet de anonieme.
anonDialog.addEventListener("cancel",event => {event.preventDefault();anonDialog.close();undoAnonymous();});

$("anonymous").addEventListener("change",() => {
  $("tag").disabled = $("anonymous").checked;
  $("tag").required = !$("anonymous").checked;
  $("contact").disabled = $("anonymous").checked;
  if ($("anonymous").checked) {$("tag").value = "";$("contact").checked = false;}
});
$("repeated").addEventListener("change",() => {$("repeat-field").hidden = $("repeated").value !== "ja";});
const tagHelp = $("tag-help-dialog");
$("tag-help-open").addEventListener("click",() => tagHelp.showModal());
$("tag-help-close").addEventListener("click",() => tagHelp.close());
tagHelp.addEventListener("click",event => {if (event.target === tagHelp) tagHelp.close();});
const DURATION_CATEGORIES = ["geluid","rook-geur"];
$("category").addEventListener("change",() => {
  const relevant = DURATION_CATEGORIES.includes($("category").value);
  $("duration-field").hidden = !relevant;
  $("duration").required = relevant;
  if (!relevant) $("duration").value = "";
});

// Do not load third-party code or send any data while this draft is disabled.
try {
  const endpoint = new URL(config.endpoint);
  ready = config.enabled === true && endpoint.protocol === "https:" && !endpoint.username && !endpoint.password && endpoint.pathname === "/api/meldingen" && !endpoint.search && !endpoint.hash && typeof config.turnstileSiteKey === "string" && config.turnstileSiteKey.length > 10;
} catch {ready = false;}
if (ready) {
  window.vveTurnstileLoaded = () => {
    // Een extensie of privacybrowser kan window.turnstile op een lege stub zetten.
    if (!window.turnstile || typeof window.turnstile.render !== "function") {
      console.error("turnstile-stub", {type: typeof window.turnstile, keys: window.turnstile ? Object.keys(window.turnstile) : null});
      showError("captchaBlocked");return;
    }
    try {
    widgetId = window.turnstile.render("#turnstile-widget",{
      sitekey:config.turnstileSiteKey,action:"melding",language:language === "zh" ? "zh-cn" : language,
      callback:value => {token = value;submit.disabled = busy;},
      "expired-callback":() => {token = "";submit.disabled = true;},
      "error-callback":() => {token = "";submit.disabled = true;showError("captchaError");}
    });
    } catch (e) {console.error("turnstile-render", e);showError("captchaBlocked");}
  };
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=vveTurnstileLoaded&render=explicit";
  script.async = true;
  script.onerror = () => {console.error("turnstile-network");showError("captchaBlocked");};
  document.head.appendChild(script);
  setTimeout(() => {
    if (widgetId !== undefined) return;
    // Onderscheid: is het script wel gedraaid maar bleef de widget uit, of kwam er niets?
    const loaded = typeof window.turnstile !== "undefined";
    console.error("turnstile-timeout", {turnstileAanwezig: loaded, render: loaded ? typeof window.turnstile.render : null});
    showError("captchaBlocked");
  },15000);
  $("availability").textContent = t("ready");
}
form.addEventListener("submit",async event => {
  event.preventDefault();
  if (!ready || busy) return;
  error.hidden = true;
  if (!form.reportValidity()) {showError("invalid");return;}
  const tag = $("tag").value.replace(/[\s-]/g,"").toUpperCase();
  if (!$("anonymous").checked && !/^[A-Z0-9]{4,32}$/.test(tag)) {showError("tagError");$("tag").focus();return;}
  if ($("event-date").value > localDate) {showError("futureError");return;}
  const files = Array.from($("attachments").files);
  if (files.length > 3 || files.some(f => f.size < 1 || f.size > 2*1024*1024 || !["image/jpeg","image/png","application/pdf"].includes(f.type))) {showError("fileError");return;}
  if (!token) {showError("captcha");return;}
  const data = new FormData();
  data.append("report",JSON.stringify({
    tag:$("anonymous").checked ? "" : tag,anonymous:$("anonymous").checked,category:$("category").value,
    eventDate:$("event-date").value,eventTime:$("event-time").value,timeZone:"Europe/Amsterdam",duration:$("duration-field").hidden ? "" : $("duration").value,
    location:$("location").value.trim(),description:$("description").value.trim(),repeated:$("repeated").value,
    repeatDetails:$("repeated").value === "ja" ? $("repeat-details").value.trim() : "",
    contactAllowed:$("contact").checked,truthful:$("truthful").checked,language,website:$("website").value
  }));
  data.append("turnstileToken",token);
  files.forEach(file => data.append("attachments",file));
  busy = true;submit.disabled = true;submit.textContent = t("sending");
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(),30000);
  try {
    const response = await fetch(config.endpoint,{method:"POST",body:data,credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer",signal:controller.signal});
    const result = await response.json();
    if (!response.ok) {showError(response.status === 429 ? "rateError" : response.status === 403 ? "captchaError" : response.status === 400 || response.status === 413 ? "invalid" : "serverError");return;}
    if (response.status !== 201 || !/^VVE-[0-9A-F]{32}$/.test(result.reportId)) throw new Error("receipt");
    form.reset();form.hidden = true;$("availability").hidden = true;
    $("report-id").textContent = result.reportId;$("success").hidden = false;$("success").focus();
  } catch {showError("serverError");}
  finally {
    clearTimeout(timeout);busy = false;token = "";submit.disabled = true;submit.textContent = t("submit");
    if (!form.hidden && window.turnstile && widgetId !== undefined) window.turnstile.reset(widgetId);
  }
});
