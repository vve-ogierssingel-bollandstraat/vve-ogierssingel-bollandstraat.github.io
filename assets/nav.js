"use strict";
// Gedeelde paginanavigatie. Elke pagina toont eerst de taalkeuze en daaronder
// dezelfde drie bestemmingen, zodat er niets verspringt bij het doorklikken.
const VVE_NAV = {
 "nl": {
  "navRules": "Gebouwregels",
  "navReport": "Melding doen",
  "navUpdates": "Informatie voor eigenaren"
 },
 "en": {
  "navRules": "Building rules",
  "navReport": "Report an issue",
  "navUpdates": "Owner updates"
 },
 "de": {
  "navRules": "Gebäuderegeln",
  "navReport": "Problem melden",
  "navUpdates": "Informationen für Eigentümer"
 },
 "pl": {
  "navRules": "Regulamin budynku",
  "navReport": "Zgłoś problem",
  "navUpdates": "Informacje dla właścicieli"
 },
 "ro": {
  "navRules": "Regulamentul clădirii",
  "navReport": "Raportează o problemă",
  "navUpdates": "Informații pentru proprietari"
 },
 "bg": {
  "navRules": "Правила на сградата",
  "navReport": "Подайте сигнал",
  "navUpdates": "Информация за собствениците"
 },
 "cs": {
  "navRules": "Pravidla budovy",
  "navReport": "Nahlásit problém",
  "navUpdates": "Informace pro vlastníky"
 },
 "sk": {
  "navRules": "Pravidlá budovy",
  "navReport": "Nahlásiť problém",
  "navUpdates": "Informácie pre vlastníkov"
 },
 "hu": {
  "navRules": "Házirend",
  "navReport": "Probléma bejelentése",
  "navUpdates": "Tulajdonosi tájékoztató"
 },
 "hr": {
  "navRules": "Pravila zgrade",
  "navReport": "Prijavite problem",
  "navUpdates": "Informacije za vlasnike"
 },
 "sr": {
  "navRules": "Pravila zgrade",
  "navReport": "Prijavite problem",
  "navUpdates": "Informacije za vlasnike"
 },
 "uk": {
  "navRules": "Правила будинку",
  "navReport": "Повідомити про проблему",
  "navUpdates": "Інформація для власників"
 },
 "ru": {
  "navRules": "Правила дома",
  "navReport": "Сообщить о проблеме",
  "navUpdates": "Информация для собственников"
 },
 "zh": {
  "navRules": "建筑规则",
  "navReport": "提交报告",
  "navUpdates": "业主动态"
 }
};
const VVE_PAGES = [
  {key:"rules",  file:"index.html",     label:"navRules"},
  {key:"report", file:"melden.html",    label:"navReport"},
  {key:"owners", file:"eigenaren.html", label:"navUpdates"}
];
window.vveRenderNav = function (code) {
  const container = document.getElementById("pageNav");
  if (!container) return;
  const language = VVE_NAV[code] ? code : "nl";
  const current = container.dataset.page;
  container.replaceChildren(...VVE_PAGES.map(page => {
    const link = document.createElement("a");
    link.textContent = VVE_NAV[language][page.label];
    link.href = page.file + "?lang=" + language;
    if (page.key === current) {link.setAttribute("aria-current", "page"); link.removeAttribute("href");}
    return link;
  }));
};
document.addEventListener("DOMContentLoaded", () => {
  window.vveRenderNav(document.documentElement.lang || "nl");
});
