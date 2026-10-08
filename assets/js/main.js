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

    drawHeroWave();
  });

  /* Onda tenue tipo vocalización ultrasónica en el encabezado de la portada */
  function drawHeroWave() {
    var canvas = document.querySelector(".hero-wave");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var w, h, t = 0;

    function resize() {
      var dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var waves = [
      { color: "rgba(31, 214, 176, 0.55)", amp: 0.10, freq: 0.018, speed: 0.012, y: 0.62 },
      { color: "rgba(26, 167, 232, 0.50)", amp: 0.07, freq: 0.031, speed: 0.018, y: 0.70 },
      { color: "rgba(122, 53, 224, 0.45)", amp: 0.05, freq: 0.052, speed: 0.025, y: 0.78 }
    ];

    function frame() {
      ctx.clearRect(0, 0, w, h);
      waves.forEach(function (wv) {
        ctx.beginPath();
        for (var x = 0; x <= w; x += 3) {
          // envolvente que modula la amplitud, como los "chirps" de una vocalización
          var env = 0.5 + 0.5 * Math.sin(x * 0.004 + t * wv.speed * 0.6);
          var y = h * wv.y + Math.sin(x * wv.freq + t * wv.speed * 6) * h * wv.amp * env;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wv.color;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      });
      t += 1;
      if (!reduce) requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", function () { resize(); if (reduce) frame(); });
    frame();
  }
})();
