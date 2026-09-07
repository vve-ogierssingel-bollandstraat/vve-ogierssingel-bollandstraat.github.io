"use strict";
const ownerPanels = [...document.querySelectorAll("[data-content]")];
const ownerLanguages = ownerPanels.map(el => el.dataset.content);
function showLanguage(code, updateUrl = false) {
  const requested = String(code || "").toLowerCase().split(/[-_]/)[0];
  const language = ownerLanguages.includes(requested) ? requested : "nl";
  document.documentElement.lang = language;
  ownerPanels.forEach(el => {el.hidden = el.dataset.content !== language;});
  document.querySelectorAll("[data-language]").forEach(el => el.setAttribute("aria-pressed",String(el.dataset.language === language)));
  const title = ownerPanels.find(el => el.dataset.content === language).querySelector("h1");
  document.title = `${title.textContent} – VvE Ogierssingel / Bollandstraat`;
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set("lang",language);
    history.replaceState(null,"",url);
  }
}
document.querySelectorAll("[data-language]").forEach(el => el.addEventListener("click",() => showLanguage(el.dataset.language,true)));
showLanguage(new URLSearchParams(location.search).get("lang") || (navigator.language || "nl").split("-")[0]);
