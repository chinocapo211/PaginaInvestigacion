/* Laboratorio de Navegación & Neurocognición — contenido editable
   Dibuja personas, publicaciones, subsidios, noticias, galería y contacto
   a partir de data/contenido.js (que se edita desde admin.html).

   En el HTML, cada bloque se marca con data-render="<sección>".
   Lo que está escrito dentro del bloque solo se ve si los datos no cargan. */
(function () {
  "use strict";

  var LINEAS = [
    { id: "ultrasonidos", pagina: "linea-ultrasonidos.html", corto_es: "Ultrasonidos", corto_en: "Ultrasonics",
      nombre_es: "Vocalizaciones ultrasónicas y dinámica de la memoria", nombre_en: "Ultrasonic Vocalizations and Memory Dynamics" },
    { id: "desorientacion", pagina: "linea-desorientacion.html", corto_es: "Desorientación", corto_en: "Disorientation",
      nombre_es: "Desorientación espacial e integración de trayectoria", nombre_en: "Spatial Disorientation and Path Integration" },
    { id: "navegacion", pagina: "linea-navegacion.html", corto_es: "Navegación", corto_en: "Navigation",
      nombre_es: "Ecología del movimiento y eficiencia de navegación", nombre_en: "Movement Ecology and Navigation Efficiency" }
  ];

  var DRAFT_KEY = "nn-admin-borrador";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Solo enlaces http(s), mailto, anclas o rutas del propio sitio
  function safeUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    if (/^(https?:|mailto:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return ""; // javascript:, data:, etc.
    return u;
  }

  function isExternal(u) { return /^https?:/i.test(u); }

  // Texto en los dos idiomas (si falta el inglés, repite el español)
  function bi(es, en) {
    es = es || ""; en = en || es;
    return '<span lang="es">' + esc(es) + '</span><span lang="en">' + esc(en) + "</span>";
  }

  function lineaById(id) {
    for (var i = 0; i < LINEAS.length; i++) if (LINEAS[i].id === id) return LINEAS[i];
    return null;
  }

  function enLinea(item, linea) {
    return !linea || (item.lineas || []).indexOf(linea) !== -1;
  }

  function initials(nombre) {
    var parts = String(nombre || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "NN";
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }

  function vacio(es, en) {
    return '<p class="empty-note">' + bi(es, en) + "</p>";
  }

  /* ---------- Vista previa del borrador (desde admin.html) ---------- */
  function cargarDatos() {
    var data = window.SITE_DATA || null;
    var imagenes = {};
    var preview = /[?&]vista-previa\b/.test(location.search);
    if (preview) {
      try {
        var b = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
        if (b && b.data) { data = b.data; imagenes = b.imagenes || {}; }
      } catch (e) { /* sin borrador */ }
    }
    return { data: data, imagenes: imagenes, preview: preview };
  }

  var ctx = null;

  function img(path) {
    if (!path) return "";
    if (ctx && ctx.imagenes[path]) return ctx.imagenes[path]; // imagen nueva aún no publicada
    return safeUrl(path);
  }

  /* ---------- Secciones ---------- */
  var render = {
    personas: function (d, el) {
      var linea = el.getAttribute("data-linea");
      var lista = (d.personas || []).filter(function (p) { return enLinea(p, linea); });
      if (!lista.length) return vacio("Próximamente.", "Coming soon.");
      return lista.map(function (p) {
        var foto = img(p.foto);
        var avatar = foto
          ? '<img src="' + esc(foto) + '" alt="' + esc(p.nombre) + '" loading="lazy">'
          : esc(initials(p.nombre));
        var links = [];
        var li = safeUrl(p.linkedin);
        if (li) links.push('<a href="' + esc(li) + '" target="_blank" rel="noopener">LinkedIn</a>');
        if (!linea) {
          (p.lineas || []).forEach(function (id) {
            var l = lineaById(id);
            if (l) links.push('<a href="' + l.pagina + '">' + bi(l.corto_es, l.corto_en) + "</a>");
          });
        }
        return '<article class="person">' +
          '<div class="avatar">' + avatar + "</div>" +
          "<h3>" + esc(p.nombre) + "</h3>" +
          '<div class="role">' + bi(p.rol_es, p.rol_en) + "</div>" +
          (links.length ? '<div class="links">' + links.join("") + "</div>" : "") +
          "</article>";
      }).join("");
    },

    publicaciones: function (d, el) {
      var linea = el.getAttribute("data-linea");
      var lista = (d.publicaciones || []).filter(function (p) { return enLinea(p, linea); });
      lista.sort(function (a, b) { return String(b.anio).localeCompare(String(a.anio)); });
      if (!lista.length) return '<li class="empty">' + bi("Próximamente.", "Coming soon.") + "</li>";
      return lista.map(function (p) {
        var url = safeUrl(p.url);
        var titulo = esc(p.titulo);
        if (url) titulo = '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + titulo + "</a>";
        return "<li>" +
          '<span class="pub-year">' + esc(p.anio) + "</span> " +
          '<span class="pub-authors">' + esc(p.autores) + "</span> " +
          '<span class="pub-title">' + titulo + "</span> " +
          '<span class="pub-journal">' + esc(p.revista) + "</span>" +
          "</li>";
      }).join("");
    },

    subsidios: function (d) {
      var lista = d.subsidios || [];
      if (!lista.length) return '<li class="empty">' + bi("Próximamente.", "Coming soon.") + "</li>";
      return lista.map(function (s) {
        return "<li>" +
          '<div class="grant-period">' + esc(s.periodo) + "</div>" +
          "<div>" +
          '<div class="grant-funder">' + esc(s.entidad) + "</div>" +
          '<div class="grant-title">' + esc(s.titulo) + "</div>" +
          (s.responsable ? '<div class="grant-pi">' + bi("Responsable:", "Principal investigator:") + " " + esc(s.responsable) + "</div>" : "") +
          "</div></li>";
      }).join("");
    },

    noticias: function (d) {
      var lista = d.noticias || [];
      if (!lista.length) return vacio("No hay noticias por ahora.", "No news yet.");
      return lista.map(function (n) {
        var url = safeUrl(n.enlace);
        var mas = url
          ? ' <a href="' + esc(url) + '"' + (isExternal(url) ? ' target="_blank" rel="noopener"' : "") + ">" +
            bi("Más información", "Learn more") + "</a>"
          : "";
        return '<article class="news-item">' +
          '<time datetime="' + esc(n.fecha) + '">' + esc(n.fecha) + "</time>" +
          "<h3>" + bi(n.titulo_es, n.titulo_en) + "</h3>" +
          "<p>" + bi(n.texto_es, n.texto_en) + mas + "</p>" +
          "</article>";
      }).join("");
    },

    galeria: function (d) {
      var lista = d.galeria || [];
      if (!lista.length) return vacio("Próximamente.", "Coming soon.");
      return lista.map(function (g) {
        var foto = img(g.foto);
        if (!foto) return '<div class="ph">' + bi(g.texto_es, g.texto_en) + "</div>";
        return '<figure class="photo">' +
          '<img src="' + esc(foto) + '" alt="' + esc(g.texto_es) + '" loading="lazy">' +
          (g.texto_es ? "<figcaption>" + bi(g.texto_es, g.texto_en) + "</figcaption>" : "") +
          "</figure>";
      }).join("");
    },

    email: function (d) {
      var email = (d.ajustes && d.ajustes.email) || "";
      if (!email) return bi("(a completar)", "(to be completed)");
      return '<a href="mailto:' + esc(email) + '">' + esc(email) + "</a>";
    }
  };

  function aplicar() {
    ctx = cargarDatos();
    var d = ctx.data;
    if (!d) return; // sin datos: queda el contenido escrito en el HTML

    document.querySelectorAll("[data-render]").forEach(function (el) {
      var fn = render[el.getAttribute("data-render")];
      if (fn) el.innerHTML = fn(d, el);
    });

    // Recuadros amarillos de "contenido de ejemplo"
    var avisos = !d.ajustes || d.ajustes.mostrarAvisosEjemplo !== false;
    document.querySelectorAll("[data-aviso]").forEach(function (el) { el.hidden = !avisos; });

    if (ctx.preview) {
      var bar = document.createElement("div");
      bar.className = "preview-bar";
      bar.innerHTML = "Vista previa del borrador · todavía no está publicado · <a href=\"admin.html\">Volver al panel</a>";
      document.body.insertBefore(bar, document.body.firstChild);
      // Mantener la vista previa al navegar entre páginas del sitio
      document.querySelectorAll("a[href]").forEach(function (a) {
        var h = a.getAttribute("href");
        if (/^[a-z0-9-]+\.html(#.*)?$/i.test(h) && h.indexOf("admin.html") !== 0) {
          var parts = h.split("#");
          a.setAttribute("href", parts[0] + "?vista-previa" + (parts[1] ? "#" + parts[1] : ""));
        }
      });
    }
  }

  window.SITE_LINEAS = LINEAS;
  window.SITE_DRAFT_KEY = DRAFT_KEY;

  document.addEventListener("DOMContentLoaded", aplicar);
})();
