"use strict";
function showLanguage(code) {
  const language = ["nl","en","zh"].includes(code) ? code : "en";
  document.documentElement.lang = language;
  document.querySelectorAll("[data-content]").forEach(el => {el.hidden = el.dataset.content !== language;});
  document.querySelectorAll("[data-language]").forEach(el => el.setAttribute("aria-pressed",String(el.dataset.language === language)));
}
document.querySelectorAll("[data-language]").forEach(el => el.addEventListener("click",() => showLanguage(el.dataset.language)));
showLanguage(new URLSearchParams(location.search).get("lang") || (navigator.language || "nl").split("-")[0]);
