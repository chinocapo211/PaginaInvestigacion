/* Laboratorio de Navegación & Neurocognición — contenido editable
   Dibuja líneas, noticias, personas, publicaciones, subsidios, galería y contacto
   a partir de data/contenido.js (que se edita desde admin.html).

   En el HTML, cada bloque se marca con data-render="<bloque>".
   Lo que está escrito dentro del bloque solo se ve si los datos no cargan. */
(function () {
  "use strict";

  var DRAFT_KEY = "nn-admin-borrador";

  /* ---------- Valores por defecto (si data/contenido.js no los trae) ---------- */
  var DEFAULT_LINEAS = [
    { id: "ultrasonidos", destacada: true, imagen: "assets/img/linea-ultrasonidos.jpg",
      titulo_es: "Vocalizaciones ultrasónicas y dinámica de la memoria", titulo_en: "Ultrasonic Vocalizations and Memory Dynamics",
      corto_es: "Ultrasonidos", corto_en: "Ultrasonics",
      resumen_es: "Las ratas se comunican con sonidos por encima de lo que el oído humano puede percibir. Estudiamos qué nos dicen esas vocalizaciones sobre cómo se forman, se evocan y se transforman las memorias.",
      resumen_en: "Rats communicate with sounds above the range of human hearing. We study what these vocalizations reveal about how memories are formed, retrieved, and transformed." },
    { id: "desorientacion", destacada: true, imagen: "assets/img/linea-desorientacion.jpg",
      titulo_es: "Desorientación espacial e integración de trayectoria", titulo_en: "Spatial Disorientation and Path Integration",
      corto_es: "Desorientación", corto_en: "Disorientation",
      resumen_es: "Cómo el cerebro estima la propia posición a partir del movimiento y qué ocurre cuando esas señales internas entran en conflicto, como en el vuelo.",
      resumen_en: "How the brain estimates its own position from self-motion, and what happens when those internal signals conflict, as in flight." },
    { id: "navegacion", destacada: true, imagen: "assets/img/linea-navegacion.jpg",
      titulo_es: "Ecología del movimiento y eficiencia de navegación", titulo_en: "Movement Ecology and Navigation Efficiency",
      corto_es: "Navegación", corto_en: "Navigation",
      resumen_es: "Trayectorias, decisiones y estrategias: cómo los animales exploran y aprenden a moverse de forma eficiente en entornos complejos.",
      resumen_en: "Trajectories, decisions, and strategies: how animals explore and learn to move efficiently through complex environments." }
  ];

  var DEFAULT_CONTACTO = {
    email: "",
    departamento_es: "Departamento de Investigación y Doctorado",
    departamento_en: "Research and Doctorate Department",
    institucion_es: "Instituto Tecnológico de Buenos Aires (ITBA)",
    institucion_en: "Buenos Aires Institute of Technology (ITBA)",
    calle: "Iguazú 341",
    codigoPostal: "(1437)",
    ciudad_es: "Ciudad de Buenos Aires, Argentina",
    ciudad_en: "Buenos Aires, Argentina",
    mapa: "Iguazú 341, Buenos Aires, Argentina",
    cursosUrl: "https://investigacion.itba.edu.ar/cursos-de-doctorado/"
  };

  var LISTAS = ["lineas", "personas", "publicaciones", "subsidios", "noticias", "galeria"];

  function copia(o) { return JSON.parse(JSON.stringify(o)); }

  // Completa lo que falte y adapta datos guardados con versiones anteriores del panel
  function normalizar(d) {
    d = d ? copia(d) : {};
    d.ajustes = d.ajustes || {};
    if (d.ajustes.mostrarAvisosEjemplo === undefined) d.ajustes.mostrarAvisosEjemplo = true;
    if (!d.contacto) {
      d.contacto = copia(DEFAULT_CONTACTO);
      d.contacto.email = d.ajustes.email || "";
    }
    delete d.ajustes.email;
    Object.keys(DEFAULT_CONTACTO).forEach(function (k) {
      if (d.contacto[k] === undefined) d.contacto[k] = DEFAULT_CONTACTO[k];
    });
    if (!Array.isArray(d.lineas)) d.lineas = copia(DEFAULT_LINEAS);
    LISTAS.forEach(function (k) { if (!Array.isArray(d[k])) d[k] = []; });

    d.lineas.forEach(function (l) {
      if (!Array.isArray(l.contenido)) {
        l.contenido = l.descripcion_es ? [{ tipo: "parrafo", texto_es: l.descripcion_es, texto_en: l.descripcion_en || "" }] : [];
      }
      delete l.pagina; delete l.descripcion_es; delete l.descripcion_en;
      if (l.destacada === undefined) l.destacada = true;
    });
    d.noticias.forEach(function (n, i) {
      if (n.destacada === undefined) n.destacada = i === 0;
      if (n.imagen === undefined) n.imagen = "";
      if (!Array.isArray(n.contenido)) {
        n.contenido = [];
        if (n.enlace) n.contenido.push({ tipo: "boton", texto_es: "Más información", texto_en: "Learn more", url: n.enlace });
      }
      delete n.enlace;
    });
    return d;
  }

  /* ---------- Utilidades ---------- */
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
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return "";
    return u;
  }

  function isExternal(u) { return /^https?:/i.test(u); }

  // Texto en los dos idiomas (si falta el inglés, repite el español)
  function bi(es, en) {
    es = es || ""; en = en || es;
    return '<span lang="es">' + esc(es) + '</span><span lang="en">' + esc(en) + "</span>";
  }

  // Párrafos separados por una línea en blanco; un salto simple queda como salto de línea
  function parrafos(es, en) {
    var a = String(es || "").split(/\n\s*\n/), b = String(en || es || "").split(/\n\s*\n/);
    return a.filter(function (p) { return p.trim(); }).map(function (p, i) {
      var e = (b[i] || p).trim();
      return '<p><span lang="es">' + esc(p.trim()).replace(/\n/g, "<br>") + '</span><span lang="en">' + esc(e).replace(/\n/g, "<br>") + "</span></p>";
    }).join("");
  }

  function renglones(t) { return String(t || "").split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean); }

  function initials(nombre) {
    var parts = String(nombre || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "NN";
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }

  function lineaUrl(l) { return "linea.html?id=" + encodeURIComponent(l.id); }
  function noticiaUrl(n) { return "noticia.html?id=" + encodeURIComponent(n.id); }

  function vacio(es, en) { return '<p class="empty-note">' + bi(es, en) + "</p>"; }

  function boton(href, es, en) {
    var ext = isExternal(href);
    return '<a class="btn" href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + bi(es, en) + (ext ? " ↗" : "") + "</a>";
  }

  /* ---------- Datos (o borrador, en vista previa) ---------- */
  var ctx = { data: null, imagenes: {}, preview: false };

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
    return { data: data ? normalizar(data) : null, imagenes: imagenes, preview: preview };
  }

  function img(path) {
    if (!path) return "";
    if (ctx.imagenes[path]) return ctx.imagenes[path]; // imagen nueva aún no publicada
    return safeUrl(path);
  }

  function porId(lista, id) {
    for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
    return null;
  }

  function enLinea(item, linea) { return !linea || (item.lineas || []).indexOf(linea) !== -1; }

  function idUrl() {
    var m = location.search.match(/[?&]id=([^&#]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  function ponerTitulo(es, en) {
    var root = document.documentElement;
    root.setAttribute("data-title-es", es + " | Laboratorio de Navegación & Neurocognición");
    root.setAttribute("data-title-en", (en || es) + " | Navigation & Neurocognition Laboratory");
    document.title = root.getAttribute("data-title-" + (root.getAttribute("data-lang") === "en" ? "en" : "es"));
  }

  /* ---------- Bloques de contenido de una página (títulos, textos, imágenes…) ---------- */
  var BLOQUES = {
    titulo: function (b) { return "<h2>" + bi(b.texto_es, b.texto_en) + "</h2>"; },
    subtitulo: function (b) { return "<h3>" + bi(b.texto_es, b.texto_en) + "</h3>"; },
    parrafo: function (b) { return parrafos(b.texto_es, b.texto_en); },
    imagen: function (b) {
      var src = img(b.src);
      if (!src) return "";
      var en = b.src_en ? img(b.src_en) : "";
      var alt = esc(b.pie_es || "");
      var im = en
        ? '<img lang="es" src="' + esc(src) + '" alt="' + alt + '" loading="lazy"><img lang="en" src="' + esc(en) + '" alt="' + esc(b.pie_en || b.pie_es || "") + '" loading="lazy">'
        : '<img src="' + esc(src) + '" alt="' + alt + '" loading="lazy">';
      return '<figure class="art-fig">' + im + (b.pie_es ? "<figcaption>" + bi(b.pie_es, b.pie_en) + "</figcaption>" : "") + "</figure>";
    },
    lista: function (b) {
      var es = renglones(b.items_es), en = renglones(b.items_en);
      if (!es.length) return "";
      return "<ul>" + es.map(function (x, i) { return "<li>" + bi(x, en[i]) + "</li>"; }).join("") + "</ul>";
    },
    datos: function (b) {
      var es = renglones(b.items_es), en = renglones(b.items_en);
      if (!es.length) return "";
      return '<div class="facts">' + es.map(function (x, i) {
        var p = x.split("|"), q = String(en[i] || x).split("|");
        var valor = p.length > 1 ? p[0].trim() : "";
        var tes = (p.length > 1 ? p.slice(1).join("|") : p[0]).trim();
        var ten = (q.length > 1 ? q.slice(1).join("|") : q[0]).trim();
        return '<div class="fact">' + (valor ? "<strong>" + esc(valor) + "</strong>" : "") + bi(tes, ten) + "</div>";
      }).join("") + "</div>";
    },
    boton: function (b) {
      var u = safeUrl(b.url);
      if (!u || !b.texto_es) return "";
      return '<p class="art-btn">' + boton(u, b.texto_es, b.texto_en) + "</p>";
    }
  };

  function bloquesHtml(lista) {
    return (lista || []).map(function (b) { return BLOQUES[b.tipo] ? BLOQUES[b.tipo](b) : ""; }).join("");
  }

  function articulo(item) {
    var portada = img(item.imagen);
    var cuerpo = bloquesHtml(item.contenido);
    if (!cuerpo && !portada) cuerpo = "<p>" + bi(item.resumen_es || item.texto_es, item.resumen_en || item.texto_en) + "</p>";
    return '<article class="article">' +
      (portada ? '<img class="art-cover" src="' + esc(portada) + '" alt="">' : "") +
      cuerpo + "</article>";
  }

  /* ---------- Tarjetas ---------- */
  function tarjetaLinea(l) {
    var foto = img(l.imagen);
    return '<a class="line-card" id="linea-' + esc(l.id) + '" href="' + esc(lineaUrl(l)) + '">' +
      '<div class="thumb">' + (foto ? '<img src="' + esc(foto) + '" alt="" loading="lazy">' : "") + "</div>" +
      '<div class="body"><h3>' + bi(l.titulo_es, l.titulo_en) + "</h3>" +
      "<p>" + bi(l.resumen_es, l.resumen_en) + "</p>" +
      '<span class="more">' + bi("Ver proyecto →", "View project →") + "</span></div></a>";
  }

  function tarjetaNoticia(n) {
    var foto = img(n.imagen);
    return '<a class="news-card" id="noticia-' + esc(n.id) + '" href="' + esc(noticiaUrl(n)) + '">' +
      (foto ? '<div class="thumb"><img src="' + esc(foto) + '" alt="" loading="lazy"></div>' : "") +
      '<div class="body"><time datetime="' + esc(n.fecha) + '">' + esc(n.fecha) + "</time>" +
      "<h3>" + bi(n.titulo_es, n.titulo_en) + "</h3>" +
      (n.texto_es ? "<p>" + bi(n.texto_es, n.texto_en) + "</p>" : "") +
      '<span class="more">' + bi("Leer más →", "Read more →") + "</span></div></a>";
  }

  /* ---------- Bloques del HTML ---------- */
  var render = {
    /* Líneas de investigación */
    "lineas-destacadas": function (d) {
      var lista = d.lineas.filter(function (l) { return l.destacada; });
      if (!lista.length) return vacio("Próximamente.", "Coming soon.");
      return lista.map(tarjetaLinea).join("");
    },
    "lineas-todas": function (d) {
      if (!d.lineas.length) return vacio("Próximamente.", "Coming soon.");
      return d.lineas.map(tarjetaLinea).join("");
    },
    "lineas-mas": function (d) {
      var dest = d.lineas.filter(function (l) { return l.destacada; }).length;
      return d.lineas.length > dest ? boton("lineas.html", "Ver todas las líneas", "See all research lines") : "";
    },
    "lineas-footer": function (d) {
      var lista = d.lineas.filter(function (l) { return l.destacada; });
      var html = lista.map(function (l) {
        return '<li><a href="' + esc(lineaUrl(l)) + '">' + bi(l.corto_es || l.titulo_es, l.corto_en || l.titulo_en) + "</a></li>";
      }).join("");
      if (d.lineas.length > lista.length) html += '<li><a href="lineas.html">' + bi("Todas las líneas", "All research lines") + "</a></li>";
      return html;
    },

    /* Página de una línea (linea.html?id=...) */
    "linea-hero": function (d) {
      var l = porId(d.lineas, idUrl());
      if (!l) return "<h1>" + bi("Línea no encontrada", "Research line not found") + "</h1>";
      ponerTitulo(l.titulo_es, l.titulo_en);
      return "<h1>" + bi(l.titulo_es, l.titulo_en) + "</h1><p>" + bi(l.resumen_es, l.resumen_en) + "</p>";
    },
    "linea-cuerpo": function (d) {
      var l = porId(d.lineas, idUrl());
      if (!l) return '<p><a href="lineas.html">' + bi("Ver todas las líneas", "See all research lines") + "</a></p>";
      return articulo(l);
    },

    /* Noticias */
    "noticias-destacadas": function (d) {
      var lista = d.noticias.filter(function (n) { return n.destacada; });
      if (!lista.length) return d.noticias.length ? "" : vacio("No hay noticias por ahora.", "No news yet.");
      return lista.map(tarjetaNoticia).join("");
    },
    noticias: function (d) {
      if (!d.noticias.length) return vacio("No hay noticias por ahora.", "No news yet.");
      return d.noticias.map(tarjetaNoticia).join("");
    },
    "noticias-mas": function (d) {
      var dest = d.noticias.filter(function (n) { return n.destacada; }).length;
      return d.noticias.length > dest ? boton("noticias.html", "Ver todas las noticias", "See all news") : "";
    },
    "noticia-hero": function (d) {
      var n = porId(d.noticias, idUrl());
      if (!n) return "<h1>" + bi("Noticia no encontrada", "News item not found") + "</h1>";
      ponerTitulo(n.titulo_es, n.titulo_en);
      return '<time class="hero-date" datetime="' + esc(n.fecha) + '">' + esc(n.fecha) + "</time>" +
        "<h1>" + bi(n.titulo_es, n.titulo_en) + "</h1>" + (n.texto_es ? "<p>" + bi(n.texto_es, n.texto_en) + "</p>" : "");
    },
    "noticia-cuerpo": function (d) {
      var n = porId(d.noticias, idUrl());
      if (!n) return '<p><a href="noticias.html">' + bi("Ver todas las noticias", "See all news") + "</a></p>";
      return articulo(n) + '<p class="art-back"><a href="noticias.html">' + bi("← Todas las noticias", "← All news") + "</a></p>";
    },

    /* Personas */
    personas: function (d, el) {
      var linea = el.getAttribute("data-linea");
      var lista = d.personas.filter(function (p) { return enLinea(p, linea); });
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
            var l = porId(d.lineas, id);
            if (l) links.push('<a href="' + esc(lineaUrl(l)) + '">' + bi(l.corto_es || l.titulo_es, l.corto_en || l.titulo_en) + "</a>");
          });
        }
        return '<article class="person" id="persona-' + esc(p.id) + '">' +
          '<div class="avatar">' + avatar + "</div>" +
          "<h3>" + esc(p.nombre) + "</h3>" +
          '<div class="role">' + bi(p.rol_es, p.rol_en) + "</div>" +
          (links.length ? '<div class="links">' + links.join("") + "</div>" : "") +
          "</article>";
      }).join("");
    },

    /* Publicaciones */
    publicaciones: function (d, el) {
      var linea = el.getAttribute("data-linea");
      var lista = d.publicaciones.filter(function (p) { return enLinea(p, linea); });
      lista.sort(function (a, b) { return String(b.anio).localeCompare(String(a.anio)); });
      if (!lista.length) return '<li class="empty">' + bi("Próximamente.", "Coming soon.") + "</li>";
      return lista.map(function (p) {
        var url = safeUrl(p.url);
        var titulo = esc(p.titulo);
        if (url) titulo = '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + titulo + "</a>";
        return '<li id="pub-' + esc(p.id) + '">' +
          '<span class="pub-year">' + esc(p.anio) + "</span> " +
          '<span class="pub-authors">' + esc(p.autores) + "</span> " +
          '<span class="pub-title">' + titulo + "</span> " +
          '<span class="pub-journal">' + esc(p.revista) + "</span>" +
          "</li>";
      }).join("");
    },

    /* Subsidios */
    subsidios: function (d) {
      if (!d.subsidios.length) return '<li class="empty">' + bi("Próximamente.", "Coming soon.") + "</li>";
      return d.subsidios.map(function (s) {
        return '<li id="subsidio-' + esc(s.id) + '">' +
          '<div class="grant-period">' + esc(s.periodo) + "</div>" +
          "<div>" +
          '<div class="grant-funder">' + esc(s.entidad) + "</div>" +
          '<div class="grant-title">' + esc(s.titulo) + "</div>" +
          (s.responsable ? '<div class="grant-pi">' + bi("Responsable:", "Principal investigator:") + " " + esc(s.responsable) + "</div>" : "") +
          "</div></li>";
      }).join("");
    },

    /* Vida del lab */
    galeria: function (d) {
      if (!d.galeria.length) return vacio("Próximamente.", "Coming soon.");
      return d.galeria.map(function (g) {
        var foto = img(g.foto);
        if (!foto) return '<div class="ph" id="foto-' + esc(g.id) + '">' + bi(g.texto_es, g.texto_en) + "</div>";
        return '<figure class="photo" id="foto-' + esc(g.id) + '">' +
          '<img src="' + esc(foto) + '" alt="' + esc(g.texto_es) + '" loading="lazy">' +
          (g.texto_es ? "<figcaption>" + bi(g.texto_es, g.texto_en) + "</figcaption>" : "") +
          "</figure>";
      }).join("");
    },

    /* Contacto */
    contacto: function (d) {
      var c = d.contacto;
      var email = c.email
        ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a>"
        : bi("(a completar)", "(to be completed)");
      var cursos = safeUrl(c.cursosUrl);
      var host = cursos.replace(/^https?:\/\//i, "").split("/")[0];
      return "<dt>" + bi("Dirección", "Address") + "</dt>" +
        "<dd>" + direccionHtml(c, ", ") + "</dd>" +
        "<dt>Email</dt><dd>" + email + "</dd>" +
        (cursos ? "<dt>" + bi("Cursos de doctorado", "Doctoral courses") + '</dt><dd><a href="' + esc(cursos) + '" target="_blank" rel="noopener">' + esc(host) + "</a></dd>" : "");
    },
    direccion: function (d) { return direccionHtml(d.contacto, "<br>"); },
    mapa: function (d, el) {
      var c = d.contacto;
      var q = c.mapa || [c.calle, c.ciudad_es].filter(Boolean).join(", ");
      el.hidden = !q;
      if (q) {
        var src = "https://www.google.com/maps?q=" + encodeURIComponent(q) + "&output=embed";
        if (el.getAttribute("src") !== src) el.setAttribute("src", src);
        el.setAttribute("title", "Mapa: " + q);
      }
      return null;
    },
    "cursos-link": function (d, el) {
      var u = safeUrl(d.contacto.cursosUrl);
      (el.closest("li") || el).hidden = !u;
      if (u) el.setAttribute("href", u);
      return null;
    }
  };

  function direccionHtml(c, sep) {
    var lineas = [];
    if (c.departamento_es) lineas.push(bi(c.departamento_es, c.departamento_en));
    if (c.institucion_es) lineas.push(bi(c.institucion_es, c.institucion_en));
    var calle = esc(c.calle || "");
    var ciudad = [c.codigoPostal ? esc(c.codigoPostal) : "", c.ciudad_es ? bi(c.ciudad_es, c.ciudad_en) : ""]
      .filter(Boolean).join(" ");
    if (sep === "<br>") {
      if (calle) lineas.push(calle);
      if (ciudad) lineas.push(ciudad);
      return lineas.join("<br>");
    }
    var ult = [calle, ciudad].filter(Boolean).join(", ");
    if (ult) lineas.push(ult);
    return lineas.join("<br>");
  }

  /* ---------- Vista previa: mantenerla al navegar por el sitio ---------- */
  function conPreview(href) {
    var m = href.match(/^([a-z0-9-]+\.html)(\?[^#]*)?(#.*)?$/i);
    if (!m || m[1] === "admin.html") return null;
    var q = m[2] ? m[2] + "&vista-previa" : "?vista-previa";
    return m[1] + q + (m[3] || "");
  }

  function aplicar() {
    ctx = cargarDatos();
    var d = ctx.data;
    if (!d) return; // sin datos: queda el contenido escrito en el HTML

    var id = idUrl();
    document.querySelectorAll('[data-linea="@url"]').forEach(function (el) { el.setAttribute("data-linea", id); });

    document.querySelectorAll("[data-render]").forEach(function (el) {
      var fn = render[el.getAttribute("data-render")];
      if (!fn) return;
      var html = fn(d, el);
      if (html !== null && html !== undefined) el.innerHTML = html;
    });

    // Recuadros amarillos de "contenido de ejemplo"
    var avisos = d.ajustes.mostrarAvisosEjemplo !== false;
    document.querySelectorAll("[data-aviso]").forEach(function (el) { el.hidden = !avisos; });

    if (ctx.preview) {
      var bar = document.createElement("div");
      bar.className = "preview-bar";
      bar.innerHTML = "Vista previa del borrador · todavía no está publicado · <a href=\"admin.html\">Volver al panel</a>";
      document.body.insertBefore(bar, document.body.firstChild);
      document.querySelectorAll("a[href]").forEach(function (a) {
        var nuevo = conPreview(a.getAttribute("href"));
        if (nuevo) a.setAttribute("href", nuevo);
      });
    }

    // Si se llegó con #algo (por ejemplo desde el panel), ir hasta ese elemento y resaltarlo
    if (location.hash.length > 1) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target && target.tagName !== "SECTION") {
        target.classList.add("is-target");
        setTimeout(function () { target.scrollIntoView({ block: "center" }); }, 60);
      }
    }
  }

  window.SITE_NORMALIZAR = normalizar;
  window.SITE_LINEA_URL = lineaUrl;
  window.SITE_NOTICIA_URL = noticiaUrl;
  window.SITE_DRAFT_KEY = DRAFT_KEY;

  document.addEventListener("DOMContentLoaded", aplicar);
})();
