/* Laboratorio de Navegación & Neurocognición — idioma, menú y onda del encabezado */
(function () {
  "use strict";

  var root = document.documentElement;
  var STORAGE_KEY = "nn-lab-lang";

  function getSavedLang() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setLang(lang) {
    if (lang !== "en") lang = "es"; // español por defecto
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang);

    var title = root.getAttribute("data-title-" + lang);
    if (title) document.title = title;

    document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-set-lang") === lang ? "true" : "false");
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* sin almacenamiento */ }
  }

  setLang(getSavedLang() || "es");

  document.addEventListener("DOMContentLoaded", function () {
    setLang(root.getAttribute("data-lang"));

    document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () { setLang(btn.getAttribute("data-set-lang")); });
    });

    // Menú móvil
    var menuBtn = document.querySelector(".menu-btn");
    var nav = document.querySelector(".nav");
    if (menuBtn && nav) {
      menuBtn.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      nav.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          nav.classList.remove("open");
          menuBtn.setAttribute("aria-expanded", "false");
        });
      });
    }

    // Año del pie de página
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    setupHeroMoves();
  });

  /* Trayectorias del encabezado: se detienen si el usuario prefiere menos movimiento */
  function setupHeroMoves() {
    if (!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    document.querySelectorAll(".hero-moves").forEach(function (svg) {
      if (svg.pauseAnimations) svg.pauseAnimations();
    });
  }
})();
