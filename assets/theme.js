"use strict";
// Gedeeld over alle pagina's. Bewust zonder defer en in <head>: het thema moet
// vaststaan voordat er iets geverfd wordt, anders flitst de pagina eerst licht.
(() => {
  const root = document.documentElement;
  const saved = (() => {try {return localStorage.getItem("theme");} catch {return null;}})();
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function apply(dark) {
    root.dataset.theme = dark ? "dark" : "";
    const button = document.getElementById("themeToggle");
    if (button) button.textContent = dark ? "☀️" : "🌙";
  }
  function set(dark) {
    apply(dark);
    try {localStorage.setItem("theme", dark ? "dark" : "light");} catch {}
  }

  apply(saved ? saved === "dark" : media.matches);

  document.addEventListener("DOMContentLoaded", () => {
    apply(root.dataset.theme === "dark");
    const button = document.getElementById("themeToggle");
    if (button) button.addEventListener("click", () => set(root.dataset.theme !== "dark"));
  });

  media.addEventListener("change", event => {
    let stored = null;
    try {stored = localStorage.getItem("theme");} catch {}
    if (!stored) apply(event.matches);
  });
})();
