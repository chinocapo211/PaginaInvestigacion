/* Panel de administración — edita data/contenido.js y lo publica en GitHub */
(function () {
  "use strict";

  var DRAFT_KEY = window.SITE_DRAFT_KEY || "nn-admin-borrador";
  var normalizar = window.SITE_NORMALIZAR;
  var lineaUrl = window.SITE_LINEA_URL;
  var noticiaUrl = window.SITE_NOTICIA_URL;
  var LOCAL = !!window.SITE_MODO_LOCAL; // modo maqueta: sin GitHub, todo queda en este navegador

  /* ---------- Bloques para armar las páginas de noticias y líneas ---------- */
  var TIPOS_BLOQUE = {
    titulo: { nombre: "Título", icono: "T", desc: "Un título grande para empezar una parte.", campos: [
      { fila: [{ k: "texto_es", label: "Título (español)" }, { k: "texto_en", label: "Título (inglés)" }] }] },
    subtitulo: { nombre: "Subtítulo", icono: "t", desc: "Un título más chico, dentro de una parte.", campos: [
      { fila: [{ k: "texto_es", label: "Subtítulo (español)" }, { k: "texto_en", label: "Subtítulo (inglés)" }] }] },
    parrafo: { nombre: "Texto", icono: "¶", desc: "Uno o varios párrafos de texto.", campos: [
      { fila: [{ k: "texto_es", label: "Texto (español)", tipo: "textarea" }, { k: "texto_en", label: "Texto (inglés)", tipo: "textarea" }] }],
      ayuda: "Para separar párrafos, dejá una línea en blanco." },
    imagen: { nombre: "Imagen", icono: "▣", desc: "Una foto o ilustración, con epígrafe opcional.", campos: [
      { k: "src", label: "Imagen", tipo: "imagen" },
      { fila: [{ k: "pie_es", label: "Epígrafe (español, opcional)" }, { k: "pie_en", label: "Epígrafe (inglés)" }] }] },
    lista: { nombre: "Lista", icono: "•", desc: "Puntos, uno debajo del otro.", campos: [
      { fila: [{ k: "items_es", label: "Puntos (español)", tipo: "textarea" }, { k: "items_en", label: "Puntos (inglés)", tipo: "textarea" }] }],
      ayuda: "Un punto por renglón." },
    datos: { nombre: "Datos destacados", icono: "#", desc: "Números o datos clave en recuadros.", campos: [
      { fila: [{ k: "items_es", label: "Datos (español)", tipo: "textarea", ph: "~22 kHz | Llamadas largas…" }, { k: "items_en", label: "Datos (inglés)", tipo: "textarea", ph: "~22 kHz | Long calls…" }] }],
      ayuda: "Un dato por renglón, con el formato: número o valor | descripción. Se muestran como recuadros." },
    boton: { nombre: "Botón", icono: "↗", desc: "Un botón que lleva a otra página.", campos: [
      { fila: [{ k: "texto_es", label: "Texto del botón (español)" }, { k: "texto_en", label: "Texto del botón (inglés)" }] },
      { k: "url", label: "Enlace", tipo: "url", ph: "https://... o noticias.html" }] },
    resaltado: { nombre: "Texto resaltado", icono: "❝", desc: "Una frase o pregunta destacada en color.", campos: [
      { fila: [{ k: "texto_es", label: "Texto resaltado (español)", tipo: "textarea" }, { k: "texto_en", label: "Texto resaltado (inglés)", tipo: "textarea" }] }],
      ayuda: "Una frase o pregunta que se destaca en color." },
    imagenTexto: { nombre: "Imagen con texto al lado", icono: "◧", desc: "Imagen a un costado y texto al otro.", campos: [
      { k: "src", label: "Imagen", tipo: "imagen" },
      { fila: [{ k: "titulo_es", label: "Título (español, opcional)" }, { k: "titulo_en", label: "Título (inglés)" }] },
      { fila: [{ k: "texto_es", label: "Texto (español)", tipo: "textarea" }, { k: "texto_en", label: "Texto (inglés)", tipo: "textarea" }] },
      { fila: [{ k: "resaltado_es", label: "Frase resaltada (español, opcional)", tipo: "textarea" }, { k: "resaltado_en", label: "Frase resaltada (inglés)", tipo: "textarea" }] }],
      ayuda: "Si ponés varios seguidos, la imagen va alternando de lado. Para separar párrafos, dejá una línea en blanco." }
  };
  var GH_KEY = "nn-admin-github";
  var DATA_PATH = "data/contenido.js";
  var DEFAULT_REPO = { owner: "chinocapo211", repo: "PaginaInvestigacion", branch: "main" };

  /* ---------- Listas editables ---------- */
  var SECCIONES = {
    marcos: {
      titulo: "Marcos conceptuales", singular: "marco conceptual", conPagina: true, ancho: true,
      limite: function () { return 1; }, enPortadaTexto: "el marco conceptual de la portada",
      ayuda: "El primero de la lista es el que aparece en la portada. Para cambiarlo, usá las flechas ↑ ↓.",
      campos: [
        { paso: 1, titulo: "Cómo se ve desde afuera",
          texto: "Es la tarjeta que presenta al marco conceptual: aparece en la portada (si este marco está primero en la lista) y en “Ver todos los marcos conceptuales”. Solo lleva una imagen, un título y una descripción corta." },
        { k: "imagen", label: "Imagen", tipo: "imagen", carpeta: "marcos", max: 1200, cuadrada: false, ayuda: "Por ejemplo, un logo o una ilustración." },
        { fila: [
          { k: "titulo_es", label: "Título (español)", req: true, ph: "La información como código dinámico" },
          { k: "titulo_en", label: "Título (inglés)" }
        ] },
        { fila: [
          { k: "descripcion_es", label: "Descripción (español)", tipo: "textarea", req: true, ayuda: "Una o dos oraciones que expliquen la idea." },
          { k: "descripcion_en", label: "Descripción (inglés)", tipo: "textarea" }
        ] },
        { tipo: "vistaTarjeta" },
        { paso: 2, titulo: "Cómo se ve la página",
          texto: "Es lo que se abre al hacer clic en la tarjeta. Arriba aparece el título; debajo, lo que armes acá sumando bloques. La descripción no se repite en la página." },
        { k: "contenido", tipo: "bloques", carpeta: "marcos" }
      ],
      tarjeta: { img: "imagen", titulo: "titulo_es", texto: "descripcion_es" },
      resumen: function (m) { return [m.titulo_es, m.descripcion_es]; },
      thumb: function (m) { return { foto: m.imagen, texto: "", cuadrada: true }; },
      donde: function (m, i) {
        return [
          i < 1 ? ["Portada", "index.html#marco-" + m.id] : null,
          ["Todos los marcos", "marcos.html#marco-" + m.id],
          ["Su página", window.SITE_MARCO_URL(m)]
        ];
      }
    },
    lineas: {
      titulo: "Líneas de investigación", singular: "línea", conPagina: true, ancho: true,
      limite: function (d) { return d.ajustes.portadaLineas; }, enPortadaTexto: "las líneas de la portada",
      ayuda: "Las primeras de la lista aparecen en la portada (cuántas, se elige en Ajustes).",
      campos: [
        { paso: 1, titulo: "Cómo se ve desde afuera",
          texto: "Es la tarjeta de la línea: aparece en la portada (si está entre las primeras de la lista) y en “Ver todas las líneas”." },
        { fila: [
          { k: "titulo_es", label: "Título (español)", req: true },
          { k: "titulo_en", label: "Título (inglés)" }
        ] },
        { fila: [
          { k: "corto_es", label: "Nombre corto (español)", ph: "Ultrasonidos", ayuda: "Se usa en el pie de página y en las tarjetas de personas." },
          { k: "corto_en", label: "Nombre corto (inglés)", ph: "Ultrasonics" }
        ] },
        { fila: [
          { k: "resumen_es", label: "Resumen (español)", tipo: "textarea", req: true, ayuda: "Texto corto de la tarjeta." },
          { k: "resumen_en", label: "Resumen (inglés)", tipo: "textarea" }
        ] },
        { k: "imagen", label: "Imagen de portada", tipo: "imagen", carpeta: "lineas", max: 1600, cuadrada: false, ayuda: "Aparece en la tarjeta y arriba de la página." },
        { tipo: "vistaTarjeta" },
        { paso: 2, titulo: "Cómo se ve la página",
          texto: "Es lo que se abre al hacer clic en la tarjeta. Arriba aparece el título; debajo, lo que armes acá con bloques. El resumen no se repite en la página. Las personas y publicaciones de la línea se agregan solas al final." },
        { k: "contenido", tipo: "bloques", carpeta: "lineas" }
      ],
      tarjeta: { img: "imagen", titulo: "titulo_es", texto: "resumen_es", mas: "Ver proyecto →" },
      resumen: function (l) { return [l.titulo_es, l.corto_es || ""]; },
      thumb: function (l) { return { foto: l.imagen, texto: "", cuadrada: true }; },
      donde: function (l, i, enPortada) {
        return [
          enPortada ? ["Portada", "index.html#linea-" + l.id] : null,
          ["Todas las líneas", "lineas.html#linea-" + l.id],
          ["Su página", lineaUrl(l)]
        ];
      }
    },
    personas: {
      titulo: "Personas", singular: "persona",
      ayuda: "Aparecen en la sección Personas de la portada y en la página de las líneas que tengan marcadas.",
      campos: [
        { k: "nombre", label: "Nombre y apellido", req: true },
        { fila: [
          { k: "rol_es", label: "Rol (español)", ph: "Becario/a doctoral" },
          { k: "rol_en", label: "Rol (inglés)", ph: "PhD Student" }
        ] },
        { k: "foto", label: "Foto", tipo: "imagen", carpeta: "personas", max: 600, ayuda: "Mejor una foto cuadrada. Si no hay, se muestran las iniciales." },
        { k: "linkedin", label: "Enlace a LinkedIn u otro perfil", tipo: "url", ph: "https://www.linkedin.com/in/..." },
        { k: "lineas", label: "Líneas de investigación", tipo: "lineas" }
      ],
      resumen: function (p) { return [p.nombre, p.rol_es]; },
      thumb: function (p) { return { foto: p.foto, texto: iniciales(p.nombre) }; },
      donde: function (p) {
        return [["Portada", "index.html#persona-" + p.id]].concat(enLineas(p, "persona-" + p.id));
      }
    },
    noticias: {
      titulo: "Noticias", singular: "noticia", conPagina: true, ancho: true, nuevasArriba: true,
      limite: function (d) { return d.ajustes.portadaNoticias; }, enPortadaTexto: "las noticias de la portada",
      ayuda: "Las primeras de la lista aparecen en la portada (cuántas, se elige en Ajustes). Las nuevas se agregan arriba.",
      campos: [
        { paso: 1, titulo: "Cómo se ve desde afuera",
          texto: "Es la tarjeta de la noticia: aparece en la portada (si está entre las primeras de la lista) y en “Ver todas las noticias”." },
        { k: "fecha", label: "Fecha", ph: "Marzo 2026", req: true },
        { fila: [
          { k: "titulo_es", label: "Título (español)", req: true },
          { k: "titulo_en", label: "Título (inglés)", ayuda: "Si queda vacío, se usa el título en español." }
        ] },
        { fila: [
          { k: "texto_es", label: "Resumen (español)", tipo: "textarea", ayuda: "Texto corto de la tarjeta." },
          { k: "texto_en", label: "Resumen (inglés)", tipo: "textarea" }
        ] },
        { k: "imagen", label: "Imagen de portada (opcional)", tipo: "imagen", carpeta: "noticias", max: 1600, cuadrada: false, ayuda: "Aparece en la tarjeta y arriba de la página." },
        { tipo: "vistaTarjeta" },
        { paso: 2, titulo: "Cómo se ve la página",
          texto: "Es lo que se abre al hacer clic en la tarjeta. Arriba aparecen la fecha y el título; debajo, lo que armes acá con bloques. El resumen no se repite en la página." },
        { k: "contenido", tipo: "bloques", carpeta: "noticias" }
      ],
      tarjeta: { img: "imagen", titulo: "titulo_es", texto: "texto_es", fecha: "fecha", mas: "Leer más →" },
      resumen: function (n) { return [n.titulo_es, n.fecha]; },
      thumb: function (n) { return { foto: n.imagen, texto: "", cuadrada: true }; },
      donde: function (n, i, enPortada) {
        return [
          enPortada ? ["Portada", "index.html#noticia-" + n.id] : null,
          ["Todas las noticias", "noticias.html#noticia-" + n.id],
          ["Su página", noticiaUrl(n)]
        ];
      }
    },
    publicaciones: {
      titulo: "Publicaciones", singular: "publicación",
      ayuda: "En el sitio se ordenan solas por año. También aparecen en la página de las líneas que tengan marcadas.",
      campos: [
        { fila: [
          { k: "anio", label: "Año", ph: "2026", req: true },
          { k: "url", label: "Enlace (DOI o PDF, opcional)", tipo: "url", ph: "https://doi.org/..." }
        ] },
        { k: "autores", label: "Autores", ph: "Apellido A, Apellido B.", req: true },
        { k: "titulo", label: "Título", req: true },
        { k: "revista", label: "Revista" },
        { k: "lineas", label: "Líneas de investigación", tipo: "lineas" }
      ],
      resumen: function (p) { return [p.titulo, [p.anio, p.autores].filter(Boolean).join(" · ")]; },
      donde: function (p) {
        return [["Portada", "index.html#pub-" + p.id]].concat(enLineas(p, "pub-" + p.id));
      }
    },
    subsidios: {
      titulo: "Subsidios", singular: "subsidio",
      ayuda: "Aparecen en la sección Subsidios de la portada, en este orden.",
      campos: [
        { fila: [
          { k: "periodo", label: "Período", ph: "2025 – 2028", req: true },
          { k: "entidad", label: "Entidad y código", ph: "ANPCyT · PICT-2023-0000" }
        ] },
        { k: "titulo", label: "Título del proyecto", req: true },
        { k: "responsable", label: "Responsable" }
      ],
      resumen: function (s) { return [s.titulo, [s.periodo, s.entidad].filter(Boolean).join(" · ")]; },
      donde: function (s) { return [["Portada", "index.html#subsidio-" + s.id]]; }
    },
    galeria: {
      titulo: "Vida de laboratorio", singular: "foto",
      ayuda: "Fotos de la sección Vida de laboratorio de la portada, en este orden.",
      campos: [
        { k: "foto", label: "Foto", tipo: "imagen", carpeta: "vida-del-lab", max: 1400, cuadrada: false },
        { k: "texto_es", label: "Descripción (español)", req: true },
        { k: "texto_en", label: "Descripción (inglés)" }
      ],
      resumen: function (g) { return [g.texto_es, g.foto ? "Con foto" : "Sin foto"]; },
      thumb: function (g) { return { foto: g.foto, texto: "", cuadrada: true }; },
      donde: function (g) { return [["Portada", "index.html#foto-" + g.id]]; }
    }
  };

  /* ---------- Formularios simples (un solo objeto) ---------- */
  var OBJETOS = {
    contacto: {
      titulo: "Contacto",
      ayuda: "Aparece en la sección Contacto de la portada y en el pie de todas las páginas.",
      donde: [["Contacto en la portada", "index.html#contacto"]],
      campos: [
        { k: "email", label: "Email", ph: "laboratorio@itba.edu.ar" },
        { fila: [
          { k: "departamento_es", label: "Departamento (español)" },
          { k: "departamento_en", label: "Departamento (inglés)" }
        ] },
        { fila: [
          { k: "institucion_es", label: "Institución (español)" },
          { k: "institucion_en", label: "Institución (inglés)" }
        ] },
        { fila: [
          { k: "calle", label: "Calle y número", ph: "Iguazú 341" },
          { k: "codigoPostal", label: "Código postal", ph: "(1437)" }
        ] },
        { fila: [
          { k: "ciudad_es", label: "Ciudad y país (español)" },
          { k: "ciudad_en", label: "Ciudad y país (inglés)" }
        ] },
        { seccion: "Mapa" },
        { k: "mapaLink", label: "Link de Google Maps", tipo: "mapa" },
        { k: "mapa", label: "Dirección para buscar en el mapa (si no pegás un link)", ph: "Iguazú 341, Buenos Aires, Argentina",
          ayuda: "Solo se usa si el link de arriba queda vacío o no alcanza para ubicar el lugar. Si también queda vacía, se usan la calle y la ciudad." },
        { k: "cursosUrl", label: "Enlace a cursos de doctorado", tipo: "url" }
      ]
    },
    ajustes: {
      titulo: "Ajustes",
      ayuda: "Opciones generales del sitio.",
      campos: [
        { seccion: "Qué aparece en la portada" },
        { fila: [
          { k: "portadaNoticias", label: "Cantidad de noticias en la portada", tipo: "numero",
            ayuda: "Se muestran las primeras de la lista de Noticias. Si hay más, aparece el botón “Ver todas las noticias”." },
          { k: "portadaLineas", label: "Cantidad de líneas en la portada", tipo: "numero",
            ayuda: "Se muestran las primeras de la lista de Líneas. Si hay más, aparece el botón “Ver todas las líneas”." }
        ] },
        { tipo: "nota", texto: "Marcos conceptuales: en la portada aparece siempre uno solo, el primero de su lista." },
        { seccion: "Avisos" },
        { k: "mostrarAvisosEjemplo", tipo: "check", label: "Mostrar los recuadros amarillos de “Contenido de ejemplo”",
          ayuda: "Desmarcalo cuando hayas reemplazado el contenido de ejemplo por el real." }
      ]
    }
  };

  /* ---------- Estado ---------- */
  var state = { data: null, base: "", imagenes: {} };
  var tabActual = "ayuda";
  var $ = function (sel) { return document.querySelector(sel); };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function nuevoId() { return "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function iniciales(n) {
    var p = String(n || "").trim().split(/\s+/).filter(Boolean);
    return p.length ? (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() : "?";
  }
  function slug(s) {
    return String(s || "foto").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "foto";
  }
  function lineaById(id) { return state.data.lineas.filter(function (l) { return l.id === id; })[0] || null; }
  function enLineas(item, ancla) {
    return (item.lineas || []).map(function (id) {
      var l = lineaById(id);
      return l ? [l.corto_es || l.titulo_es, lineaUrl(l) + "#" + ancla] : null;
    });
  }
  function camposPlanos(campos) {
    var out = [];
    campos.forEach(function (c) { if (c.fila) out.push.apply(out, c.fila); else out.push(c); });
    return out;
  }
  function campoVisible(c, item) { return !c.si || c.si(item); }

  function hayCambios() {
    return JSON.stringify(state.data) !== state.base || Object.keys(state.imagenes).length > 0;
  }

  // Quita de la lista de pendientes las fotos nuevas que ya nadie usa
  function limpiarImagenes() {
    var texto = JSON.stringify(state.data) + (edicion ? JSON.stringify(edicion.item) : "");
    Object.keys(state.imagenes).forEach(function (p) {
      if (texto.indexOf(JSON.stringify(p)) === -1) delete state.imagenes[p];
    });
  }

  function guardarBorrador() {
    limpiarImagenes();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        data: state.data, base: state.base, imagenes: state.imagenes, guardado: Date.now()
      }));
    } catch (e) {
      aviso("error", "No se pudo guardar el borrador en este navegador (puede que las fotos sean demasiado pesadas). Publicá pronto para no perder los cambios.");
    }
    actualizarEstado();
  }

  function cargarInicial() {
    var publicado = normalizar(window.SITE_DATA);
    var publicadoJson = JSON.stringify(publicado);
    var borrador = null;
    try { borrador = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { borrador = null; }

    if (borrador && borrador.data) {
      var conCambios = JSON.stringify(borrador.data) !== borrador.base || Object.keys(borrador.imagenes || {}).length;
      var viejo = Date.now() - (borrador.guardado || 0) > 15 * 60 * 1000;
      if (conCambios || (!LOCAL && !viejo && borrador.base !== publicadoJson)) {
        // Hay cambios sin publicar, o se publicó hace poco y el sitio todavía no se actualizó
        state.data = normalizar(borrador.data);
        state.base = borrador.base;
        state.imagenes = borrador.imagenes || {};
        if (conCambios && !LOCAL) {
          aviso("info", "Se recuperaron cambios que todavía no publicaste" +
            (borrador.guardado ? " (guardados el " + new Date(borrador.guardado).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short", hourCycle: "h23" }) + ")" : "") + ".");
          if (borrador.base !== publicadoJson) {
            aviso("warn", "Ojo: el sitio publicado cambió desde que empezaste estos cambios. Si publicás, se reemplaza por lo que ves acá.");
          }
        }
        return;
      }
    }
    state.data = publicado;
    state.base = publicadoJson;
    state.imagenes = {};
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* nada */ }
  }

  /* ---------- Avisos y estado ---------- */
  function aviso(tipo, msg, html) {
    var el = $("#aviso");
    if (!msg) { el.hidden = true; el.innerHTML = ""; return; }
    el.className = "adm-alert" + (tipo && tipo !== "info" ? " " + tipo : "");
    el.innerHTML = html ? msg : esc(msg);
    el.hidden = false;
  }

  function actualizarEstado() {
    var dirty = hayCambios();
    if (LOCAL) {
      $("#estado").textContent = "Demostración · cambios solo locales";
      $("#estado").className = "adm-pill ok";
      $("#btn-descartar").hidden = !dirty;
      return;
    }
    var pill = $("#estado");
    pill.textContent = dirty ? "Cambios sin publicar" : "Todo publicado";
    pill.className = "adm-pill " + (dirty ? "dirty" : "ok");
    $("#btn-descartar").hidden = !dirty;
    $("#btn-publicar").disabled = !dirty;
    $("#nota-borrador").hidden = !dirty;
  }

  /* ---------- Pestañas ---------- */
  // "Cómo funciona": la guía completa del panel (su texto está en admin.html, en <template id="tpl-ayuda">)
  function renderAyuda() {
    $("#panel").innerHTML = '<div class="adm-card adm-guide-page">' + $("#tpl-ayuda").innerHTML + "</div>";
    $("#panel [data-guia-local]").hidden = !LOCAL;
    $("#panel [data-guia-github]").hidden = LOCAL;
  }

  function mostrarTab(tab) {
    tabActual = tab;
    document.querySelectorAll("#tabs [data-tab]").forEach(function (b) {
      b.setAttribute("aria-current", b.getAttribute("data-tab") === tab ? "true" : "false");
    });
    if (SECCIONES[tab]) renderLista(tab);
    else if (OBJETOS[tab]) renderObjeto(tab);
    else if (tab === "ayuda") renderAyuda();
    else renderPublicacion();
    try { history.replaceState(null, "", location.pathname); } catch (e) { /* file:// */ }
  }

  function urlImagen(path) {
    if (!path) return "";
    return state.imagenes[path] || path;
  }

  // Abre el sitio (con el borrador) en el lugar donde aparece cada cosa
  function urlPreview(url) {
    if (LOCAL) return url; // en modo maqueta el sitio ya muestra los cambios
    var m = url.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
    return m[1] + (m[2] ? m[2] + "&vista-previa" : "?vista-previa") + (m[3] || "");
  }

  function dondeHtml(lista) {
    lista = (lista || []).filter(Boolean);
    if (!lista.length) return "";
    return '<span class="adm-where">Aparece en: ' + lista.map(function (d) {
      return '<a href="' + esc(urlPreview(d[1])) + '" target="_blank" rel="noopener" data-ver>' + esc(d[0]) + " ↗</a>";
    }).join("") + "</span>";
  }

  function thumbHtml(t) {
    if (!t) return "";
    var cls = "adm-thumb" + (t.cuadrada ? " square" : "");
    var foto = urlImagen(t.foto);
    return '<div class="' + cls + '">' + (foto ? '<img src="' + esc(foto) + '" alt="">' : esc(t.texto)) + "</div>";
  }

  function renderLista(tab) {
    var sec = SECCIONES[tab];
    var lista = state.data[tab];
    var html = '<div class="adm-card">' +
      '<div class="adm-toolbar"><h2>' + sec.titulo + "</h2>" +
      '<button type="button" class="adm-btn primary" data-accion="agregar">+ Agregar ' + sec.singular + "</button></div>" +
      '<p class="adm-help">' + esc(sec.ayuda) + "</p>";
    if (!lista.length) {
      html += '<p class="adm-empty">Todavía no hay nada cargado.</p>';
    } else {
      var limite = sec.limite ? sec.limite(state.data) : Infinity;
      html += '<ol class="adm-list">' + lista.map(function (it, i) {
        var r = sec.resumen(it, i);
        var enPortada = i < limite;
        var tag = sec.limite && enPortada ? { t: "★ Destacada · en la portada", cls: "star" } : (sec.etiqueta ? sec.etiqueta(it, i) : null);
        var divisor = sec.limite && i === limite
          ? '<li class="adm-divider">Desde acá para abajo no aparecen en la portada: se ven con el botón “Ver todas”.</li>' : "";
        return divisor + '<li class="adm-item' + (sec.limite && enPortada ? " featured" : "") + '">' +
          (sec.thumb ? thumbHtml(sec.thumb(it)) : "") +
          '<div class="adm-sum"><strong>' + esc(r[0] || "(sin título)") +
          (tag ? ' <em class="adm-tag ' + tag.cls + '">' + esc(tag.t) + "</em>" : "") + "</strong>" +
          (r[1] ? '<span class="adm-sub">' + esc(r[1]) + "</span>" : "") +
          (sec.donde ? dondeHtml(sec.donde(it, i, enPortada)) : "") + "</div>" +
          '<div class="adm-actions">' +
          '<button type="button" class="adm-btn small ghost" data-accion="subir" data-i="' + i + '" title="Mover arriba" aria-label="Mover arriba"' + (i === 0 ? " disabled" : "") + ">↑</button>" +
          '<button type="button" class="adm-btn small ghost" data-accion="bajar" data-i="' + i + '" title="Mover abajo" aria-label="Mover abajo"' + (i === lista.length - 1 ? " disabled" : "") + ">↓</button>" +
          '<button type="button" class="adm-btn small" data-accion="editar" data-i="' + i + '">Editar</button>' +
          '<button type="button" class="adm-btn small danger" data-accion="borrar" data-i="' + i + '">Eliminar</button>' +
          "</div></li>";
      }).join("") + "</ol>";
    }
    html += "</div>";
    $("#panel").innerHTML = html;
  }

  function accionLista(accion, i) {
    var lista = state.data[tabActual];
    var sec = SECCIONES[tabActual];
    if (accion === "agregar") return abrirEditor(tabActual, -1);
    if (accion === "editar") return abrirEditor(tabActual, i);
    if (accion === "borrar") {
      var it = lista[i];
      var nombre = sec.resumen(it)[0] || sec.singular;
      var extra = tabActual === "lineas" ? " También se quita de las personas y publicaciones que la tengan marcada." : "";
      if (!confirm("¿Eliminar “" + nombre + "”? " + (LOCAL ? "Se quita del sitio." : "Se quita del sitio cuando publiques.") + extra)) return;
      lista.splice(i, 1);
      if (tabActual === "lineas") {
        ["personas", "publicaciones"].forEach(function (k) {
          state.data[k].forEach(function (x) { x.lineas = (x.lineas || []).filter(function (id) { return id !== it.id; }); });
        });
      }
    } else if (accion === "subir" && i > 0) {
      lista.splice(i - 1, 0, lista.splice(i, 1)[0]);
    } else if (accion === "bajar" && i < lista.length - 1) {
      lista.splice(i + 1, 0, lista.splice(i, 1)[0]);
    } else return;
    guardarBorrador();
    renderLista(tabActual);
  }

  /* ---------- Campos de formulario ---------- */
  function campoHtml(c, item) {
    if (!campoVisible(c, item)) return "";
    if (c.seccion) return '<h3 class="adm-sec">' + esc(c.seccion) + "</h3>";
    if (c.paso) {
      return '<div class="adm-step"><span class="adm-step-num">' + c.paso + "</span><div><h3>" + esc(c.titulo) + "</h3><p>" + esc(c.texto) + "</p></div></div>";
    }
    if (c.tipo === "vistaTarjeta") {
      return '<div class="adm-preview"><span class="adm-preview-label">Así se va a ver la tarjeta:</span><div data-vista-tarjeta></div></div>';
    }
    if (c.tipo === "nota") return '<p class="adm-note">' + esc(c.texto) + "</p>";
    if (c.tipo === "bloques") {
      return '<div class="adm-field">' +
        '<div class="adm-blocks" data-bloques="' + c.k + '"></div>' +
        '<div class="adm-add"><p class="adm-add-title">Agregar un bloque a la página</p>' +
        '<p class="adm-add-help">Tocá el tipo de bloque que quieras: se agrega al final de la página. Después podés moverlo con ↑ ↓ o quitarlo.</p>' +
        '<div class="adm-palette">' + Object.keys(TIPOS_BLOQUE).map(function (t) {
          var b = TIPOS_BLOQUE[t];
          return '<button type="button" class="adm-pal" data-add-bloque="' + t + '"><span class="adm-pal-ico">' + esc(b.icono) + "</span>" +
            "<strong>" + esc(b.nombre) + "</strong><small>" + esc(b.desc) + "</small></button>";
        }).join("") + "</div></div></div>";
    }
    var v = item[c.k];
    var id = "f-" + c.k;
    var label = esc(c.label) + (c.req ? ' <span class="req">*</span>' : "");
    var ayuda = c.ayuda ? "<small>" + esc(c.ayuda) + "</small>" : "";
    if (c.tipo === "textarea") {
      return '<div class="adm-field"><label for="' + id + '">' + label + '</label><textarea id="' + id + '" name="' + c.k + '"' +
        (c.grande ? ' class="grande"' : "") + (c.ph ? ' placeholder="' + esc(c.ph) + '"' : "") + ">" + esc(v) + "</textarea>" + ayuda + "</div>";
    }
    if (c.tipo === "numero") {
      return '<div class="adm-field"><label for="' + id + '">' + label + '</label><input type="number" min="1" max="12" step="1" id="' + id + '" name="' + c.k + '" value="' + esc(v) + '" class="adm-num">' + ayuda + "</div>";
    }
    if (c.tipo === "mapa") {
      return '<div class="adm-field"><label for="' + id + '">' + label + '</label>' +
        '<textarea id="' + id + '" name="' + c.k + '" rows="2" placeholder="Pegá acá el link o el código de Google Maps">' + esc(v) + "</textarea>" +
        '<details class="adm-howto"><summary>¿Cómo copio el link?</summary><ol>' +
        "<li>Buscá el lugar en <strong>Google Maps</strong>.</li>" +
        "<li>Tocá <strong>Compartir</strong>.</li>" +
        "<li>Lo más preciso: elegí la pestaña <strong>Insertar un mapa</strong> y tocá <strong>Copiar HTML</strong>.</li>" +
        "<li>También sirve <strong>Copiar vínculo</strong>, o copiar la dirección de la barra del navegador.</li>" +
        "<li>Pegalo en este campo. Abajo vas a ver cómo queda el mapa.</li></ol></details>" +
        '<p class="adm-map-status" data-map-status></p>' +
        '<iframe class="adm-map-preview" data-map-preview title="Vista previa del mapa" loading="lazy"></iframe></div>';
    }
    if (c.tipo === "check") {
      return '<div class="adm-field"><div class="adm-checks"><label><input type="checkbox" name="' + c.k + '"' + (v ? " checked" : "") + "> " +
        esc(c.label) + "</label></div>" + ayuda + "</div>";
    }
    if (c.tipo === "lineas") {
      var sel = v || [];
      var opciones = state.data.lineas.map(function (l) {
        return '<label><input type="checkbox" name="' + c.k + '" value="' + esc(l.id) + '"' + (sel.indexOf(l.id) !== -1 ? " checked" : "") + "> " + esc(l.titulo_es) + "</label>";
      }).join("");
      return '<div class="adm-field"><span class="adm-label">' + label + '</span><div class="adm-checks">' +
        (opciones || "<small>Todavía no hay líneas cargadas.</small>") + "</div>" + ayuda + "</div>";
    }
    if (c.tipo === "imagen") {
      var cuadrada = c.cuadrada === false;
      return '<div class="adm-field" data-imagen="' + c.k + '"><span class="adm-label">' + label + '</span>' +
        '<div class="adm-image">' +
        '<div class="adm-thumb' + (cuadrada ? " square" : "") + '" data-prev></div>' +
        '<label class="adm-btn small">Elegir foto…<input type="file" accept="image/*" hidden data-file></label>' +
        '<button type="button" class="adm-btn small ghost" data-quitar>Quitar foto</button>' +
        '<input type="hidden" name="' + c.k + '" value="' + esc(v) + '">' +
        "</div>" + ayuda + "</div>";
    }
    // Los enlaces van en type="text": type="url" rechazaría rutas internas como ribio.html
    return '<div class="adm-field"><label for="' + id + '">' + label + '</label><input type="text" id="' + id + '" name="' + c.k + '" value="' + esc(v) + '"' +
      (c.ph ? ' placeholder="' + esc(c.ph) + '"' : "") + ">" + ayuda + "</div>";
  }

  function camposHtml(campos, item) {
    return campos.map(function (c) {
      if (c.fila) return '<div class="adm-row">' + c.fila.map(function (f) { return campoHtml(f, item); }).join("") + "</div>";
      return campoHtml(c, item);
    }).join("");
  }

  // Lee los valores del formulario; devuelve la lista de obligatorios vacíos
  function leerCampos(form, campos, item) {
    var faltan = [];
    camposPlanos(campos).forEach(function (c) {
      if (!c.k || !campoVisible(c, item)) return;
      if (c.tipo === "lineas") {
        item[c.k] = Array.prototype.slice.call(form.querySelectorAll('input[name="' + c.k + '"]:checked')).map(function (x) { return x.value; });
        return;
      }
      var el = form.elements[c.k];
      if (!el) return;
      if (c.tipo === "check") { item[c.k] = el.checked; return; }
      if (c.tipo === "numero") { var n = parseInt(el.value, 10); item[c.k] = n > 0 ? Math.min(n, 12) : 1; return; }
      var val = String(el.value || "").trim();
      if (c.tipo === "url" && val && /^(javascript|data|vbscript):/i.test(val)) val = "";
      if (c.tipo === "url" && val && /^www\./i.test(val)) val = "https://" + val;
      item[c.k] = val;
      if (c.req && !val) faltan.push(c.label);
    });
    return faltan;
  }

  /* ---------- Editor (ventana con formulario) ---------- */
  var edicion = null; // { tab, index, item }

  function abrirEditor(tab, index) {
    var sec = SECCIONES[tab];
    var item = index >= 0 ? clone(state.data[tab][index]) : { id: nuevoId() };
    edicion = { tab: tab, index: index, item: item };
    $("#editor-titulo").textContent = (index >= 0 ? "Editar " : "Agregar ") + sec.singular;
    $("#editor-campos").innerHTML = camposHtml(sec.campos, item);
    $("#editor-error").hidden = true;

    camposPlanos(sec.campos).forEach(function (c) {
      if (c.tipo === "imagen") prepararImagen(c);
      if (c.tipo === "bloques") prepararBloques(c);
    });
    prepararVistaTarjeta(sec);

    var dlg = $("#editor");
    dlg.classList.toggle("wide", !!sec.ancho);
    $("#editor-form").scrollTop = 0;
    dlg.showModal();
    var primero = dlg.querySelector("input[type=text], textarea");
    if (primero) primero.focus();
  }

  function prepararImagen(c) {
    var box = document.querySelector('[data-imagen="' + c.k + '"]');
    var hidden = box.querySelector('input[type=hidden]');
    var prev = box.querySelector("[data-prev]");
    var quitar = box.querySelector("[data-quitar]");
    function pintar() {
      var u = urlImagen(hidden.value);
      prev.innerHTML = u ? '<img src="' + esc(u) + '" alt="">' : "—";
      quitar.hidden = !hidden.value;
    }
    pintar();
    function avisar() { $("#editor-form").dispatchEvent(new Event("input")); }
    quitar.addEventListener("click", function () { hidden.value = ""; pintar(); avisar(); });
    box.querySelector("[data-file]").addEventListener("change", function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      cargarImagen(file, c.max || 1200, c.carpeta).then(function (path) {
        hidden.value = path;
        edicion.item[c.k + "__pendiente"] = path; // para que no se descarte antes de guardar
        pintar();
        avisar();
      });
      ev.target.value = "";
    });
  }

  // Achica la imagen elegida y la deja pendiente de subir; devuelve la ruta que tendrá en el sitio
  function cargarImagen(file, max, carpeta) {
    return achicarImagen(file, max).then(function (dataUrl) {
      var form = $("#editor-form");
      var el = form.elements.nombre || form.elements.titulo_es || form.elements.texto_es;
      var base = (el && el.value) || file.name.replace(/\.[^.]+$/, "");
      var path = "assets/img/" + carpeta + "/" + slug(base) + "-" + Date.now().toString(36) + ".jpg";
      state.imagenes[path] = dataUrl;
      return path;
    }).catch(function (e) {
      alert("No se pudo leer esa imagen. Probá con un JPG o PNG.");
      throw e;
    });
  }

  /* ---------- Vista previa de la tarjeta (paso 1), se actualiza mientras se escribe ---------- */
  function prepararVistaTarjeta(sec) {
    var box = document.querySelector("[data-vista-tarjeta]");
    var form = $("#editor-form");
    form.oninput = null;
    if (!box || !sec.tarjeta) return;
    var t = sec.tarjeta;
    function val(k) { var el = form.elements[k]; return el ? String(el.value || "").trim() : ""; }
    function pintar() {
      var foto = urlImagen(val(t.img));
      box.innerHTML = '<div class="pv-card">' +
        (foto ? '<div class="pv-img"><img src="' + esc(foto) + '" alt=""></div>' : '<div class="pv-img pv-empty">Sin imagen</div>') +
        '<div class="pv-body">' + (t.fecha && val(t.fecha) ? "<time>" + esc(val(t.fecha)) + "</time>" : "") +
        "<h4>" + esc(val(t.titulo) || "Título") + "</h4>" +
        "<p>" + esc(val(t.texto) || "Descripción…") + "</p>" +
        '<span class="pv-more">' + esc(t.mas || "Conocé más →") + "</span></div></div>";
    }
    form.oninput = function (ev) { if (!ev.target.hasAttribute("data-b")) pintar(); };
    pintar();
  }

  /* ---------- Editor de bloques (contenido de la página) ---------- */
  function prepararBloques(c) {
    var cont = document.querySelector('[data-bloques="' + c.k + '"]');
    var form = $("#editor-form");
    if (!Array.isArray(edicion.item[c.k])) edicion.item[c.k] = [];
    var lista = edicion.item[c.k];

    function campoBloque(f, b, i) {
      var v = b[f.k] || "";
      var attrs = ' data-b="' + i + '" data-f="' + f.k + '"';
      if (f.tipo === "imagen") {
        var u = urlImagen(v);
        return '<div class="adm-field"><div class="adm-image">' +
          '<div class="adm-thumb square">' + (u ? '<img src="' + esc(u) + '" alt="">' : "—") + "</div>" +
          '<label class="adm-btn small">' + (v ? "Cambiar imagen…" : "Elegir imagen…") + '<input type="file" accept="image/*" hidden data-b-file="' + i + '"></label>' +
          "</div></div>";
      }
      var input = f.tipo === "textarea"
        ? "<textarea" + attrs + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : "") + ">" + esc(v) + "</textarea>"
        : '<input type="text"' + attrs + ' value="' + esc(v) + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : "") + ">";
      return '<div class="adm-field"><label>' + esc(f.label) + "</label>" + input + "</div>";
    }

    function pintar() {
      if (!lista.length) {
        cont.innerHTML = '<div class="adm-empty-page"><p><strong>La página todavía está vacía.</strong> Podés empezar con un modelo ' +
          "(un título, un texto y una imagen, listos para completar) o agregar bloques uno por uno con los botones de abajo.</p>" +
          '<button type="button" class="adm-btn primary small" data-modelo>Empezar con un modelo</button></div>';
        return;
      }
      cont.innerHTML = lista.map(function (b, i) {
        var t = TIPOS_BLOQUE[b.tipo];
        if (!t) return "";
        return '<div class="adm-block">' +
          '<div class="adm-block-head"><strong><span class="adm-pal-ico">' + esc(t.icono) + "</span> " + (i + 1) + ". " + esc(t.nombre) + "</strong>" +
          '<span class="adm-actions">' +
          '<button type="button" class="adm-btn small ghost" data-b-mover="-1" data-b-i="' + i + '" aria-label="Subir bloque"' + (i === 0 ? " disabled" : "") + ">↑</button>" +
          '<button type="button" class="adm-btn small ghost" data-b-mover="1" data-b-i="' + i + '" aria-label="Bajar bloque"' + (i === lista.length - 1 ? " disabled" : "") + ">↓</button>" +
          '<button type="button" class="adm-btn small danger" data-b-borrar="' + i + '">Quitar</button>' +
          "</span></div>" +
          t.campos.map(function (f) {
            if (f.fila) return '<div class="adm-row">' + f.fila.map(function (x) { return campoBloque(x, b, i); }).join("") + "</div>";
            return campoBloque(f, b, i);
          }).join("") +
          (t.ayuda ? '<small class="adm-block-help">' + esc(t.ayuda) + "</small>" : "") +
          "</div>";
      }).join("");
    }

    cont.addEventListener("input", function (ev) {
      var el = ev.target;
      if (!el.hasAttribute("data-b")) return;
      lista[Number(el.getAttribute("data-b"))][el.getAttribute("data-f")] = el.value;
    });
    cont.addEventListener("change", function (ev) {
      var el = ev.target;
      if (!el.hasAttribute("data-b-file")) return;
      var i = Number(el.getAttribute("data-b-file"));
      var file = el.files && el.files[0];
      if (!file) return;
      cargarImagen(file, 1600, c.carpeta).then(function (path) {
        lista[i].src = path;
        delete lista[i].src_en; // la versión en inglés era de la imagen anterior
        pintar();
      });
    });
    cont.addEventListener("click", function (ev) {
      if (ev.target.closest("[data-modelo]")) {
        lista.push({ tipo: "titulo" }, { tipo: "parrafo" }, { tipo: "imagen" });
        pintar();
        var campo = cont.querySelector("input[type=text], textarea");
        if (campo) campo.focus();
        return;
      }
      var mover = ev.target.closest("[data-b-mover]");
      var borrar = ev.target.closest("[data-b-borrar]");
      if (mover) {
        var i = Number(mover.getAttribute("data-b-i")), j = i + Number(mover.getAttribute("data-b-mover"));
        lista.splice(j, 0, lista.splice(i, 1)[0]);
        pintar();
      } else if (borrar) {
        var k = Number(borrar.getAttribute("data-b-borrar"));
        if (!confirm("¿Quitar este bloque?")) return;
        lista.splice(k, 1);
        pintar();
      }
    });
    form.querySelectorAll("[data-add-bloque]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        lista.push({ tipo: btn.getAttribute("data-add-bloque") });
        pintar();
        var bloques = cont.querySelectorAll(".adm-block");
        var ultimo = bloques[bloques.length - 1];
        if (ultimo) {
          ultimo.scrollIntoView({ block: "center", behavior: "smooth" });
          var campo = ultimo.querySelector("input[type=text], textarea");
          if (campo) campo.focus({ preventScroll: true });
        }
      });
    });
    pintar();
  }

  // Achica la foto en el navegador para que el sitio cargue rápido
  function achicarImagen(file, max) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        var im = new Image();
        im.onerror = reject;
        im.onload = function () {
          var escala = Math.min(1, max / Math.max(im.width, im.height));
          var w = Math.round(im.width * escala), h = Math.round(im.height * escala);
          var cv = document.createElement("canvas");
          cv.width = w; cv.height = h;
          var g = cv.getContext("2d");
          g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); // fondo para PNG transparentes
          g.drawImage(im, 0, 0, w, h);
          resolve(cv.toDataURL("image/jpeg", 0.85));
        };
        im.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Id legible para la dirección de la página (linea.html?id=..., noticia.html?id=...)
  function idUnico(lista, titulo, propio) {
    var base = slug(titulo) || "pagina", id = base, n = 2;
    while (lista.some(function (x) { return x.id === id && x !== propio; })) id = base + "-" + n++;
    return id;
  }

  function guardarEditor(ev) {
    ev.preventDefault();
    var sec = SECCIONES[edicion.tab];
    var form = $("#editor-form");
    var item = edicion.item;
    var faltan = leerCampos(form, sec.campos, item);
    if (faltan.length) {
      var err = $("#editor-error");
      err.textContent = "Falta completar: " + faltan.join(", ") + ".";
      err.hidden = false;
      return;
    }
    Object.keys(item).forEach(function (k) { if (/__pendiente$/.test(k)) delete item[k]; });
    if (sec.conPagina && edicion.index < 0) item.id = idUnico(state.data[edicion.tab], item.nombre_es || item.titulo_es, item);
    if (edicion.index >= 0) state.data[edicion.tab][edicion.index] = item;
    else if (sec.nuevasArriba) state.data[edicion.tab].unshift(item);
    else state.data[edicion.tab].push(item);
    $("#editor").close();
    edicion = null;
    guardarBorrador();
    renderLista(tabActual);
  }

  function cerrarEditor() {
    $("#editor").close();
    edicion = null;
    limpiarImagenes(); // descarta fotos elegidas y no guardadas
    actualizarEstado();
  }

  /* ---------- Contacto y Ajustes ---------- */
  function renderObjeto(tab) {
    var o = OBJETOS[tab];
    var obj = state.data[tab];
    $("#panel").innerHTML = '<form class="adm-card" id="obj-form" onsubmit="return false">' +
      '<div class="adm-toolbar"><h2>' + esc(o.titulo) + "</h2></div>" +
      '<p class="adm-help">' + esc(o.ayuda) + (o.donde ? " " + dondeHtml(o.donde) : "") + "</p>" +
      camposHtml(o.campos, obj) +
      '<p class="adm-help">' + (LOCAL ? "Los cambios se guardan solos (solo en este navegador)." : "Los cambios se guardan solos como borrador. Tocá “Publicar” para que se vean en el sitio.") + "</p></form>";
    var form = $("#obj-form");
    function guardar() { leerCampos(form, o.campos, obj); guardarBorrador(); actualizarMapa(); }
    function actualizarMapa() {
      var prev = form.querySelector("[data-map-preview]");
      if (!prev || !window.SITE_MAPA) return;
      var info = window.SITE_MAPA(obj);
      var msg = {
        "": "Sin link: el mapa se arma con la dirección escrita.",
        insertar: "✓ Código de “Insertar un mapa” reconocido: el mapa muestra exactamente ese lugar.",
        link: "✓ Link de Google Maps reconocido.",
        corto: "⚠ Es un link corto (maps.app.goo.gl). Sirve para el botón “Ver en Google Maps”, pero el mapa de la página se arma con la dirección escrita. Para que muestre el lugar exacto, usá “Insertar un mapa → Copiar HTML”.",
        desconocido: "⚠ Es un link de Google Maps pero no indica un lugar. Copiá el link con el lugar seleccionado, o usá “Insertar un mapa”.",
        invalido: "⚠ Eso no parece un link de Google Maps. Revisá lo que pegaste."
      }[info.estado];
      var st = form.querySelector("[data-map-status]");
      st.textContent = msg;
      st.className = "adm-map-status " + (info.estado === "insertar" || info.estado === "link" ? "ok" : info.estado ? "warn" : "");
      if (info.embed && prev.getAttribute("src") !== info.embed) prev.setAttribute("src", info.embed);
      prev.hidden = !info.embed;
    }
    form.addEventListener("input", guardar);
    form.addEventListener("change", guardar);
    actualizarMapa();
  }

  /* ---------- GitHub ---------- */
  function detectarRepo() {
    var m = location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i);
    if (m) {
      var repo = location.pathname.split("/").filter(Boolean)[0];
      if (repo && !/\.html$/i.test(repo)) return { owner: m[1], repo: repo, branch: "main" };
      return { owner: m[1], repo: m[1] + ".github.io", branch: "main" };
    }
    return DEFAULT_REPO;
  }

  function cfg() {
    var c = null;
    try { c = JSON.parse(localStorage.getItem(GH_KEY) || sessionStorage.getItem(GH_KEY) || "null"); } catch (e) { c = null; }
    var d = detectarRepo();
    c = c || {};
    return { owner: c.owner || d.owner, repo: c.repo || d.repo, branch: c.branch || d.branch, token: c.token || "", recordar: !!c.recordar };
  }

  function guardarCfg(c) {
    var s = JSON.stringify(c);
    try {
      localStorage.removeItem(GH_KEY); sessionStorage.removeItem(GH_KEY);
      (c.recordar ? localStorage : sessionStorage).setItem(GH_KEY, s);
    } catch (e) { /* sin almacenamiento */ }
  }

  function errorGitHub(status, msg) {
    if (status === 401) return "GitHub rechazó el token (puede estar mal copiado o vencido).";
    if (status === 403) return "El token no tiene permiso para escribir en el repositorio. Revisá que tenga “Contents: Read and write”." + (msg ? " (" + msg + ")" : "");
    if (status === 404) return "No se encontró el repositorio o la rama, o el token no tiene acceso a ese repositorio.";
    if (status === 409 || status === 422) return "GitHub no aceptó el cambio: " + (msg || "conflicto") + ". Probá de nuevo.";
    return "Error de GitHub (" + status + ")" + (msg ? ": " + msg : "");
  }

  async function gh(method, path, body) {
    var c = cfg();
    if (!c.token) throw new Error("Falta el token de GitHub.");
    var headers = { Accept: "application/vnd.github+json", Authorization: "Bearer " + c.token, "X-GitHub-Api-Version": "2022-11-28" };
    if (body) headers["Content-Type"] = "application/json";
    var r;
    try {
      r = await fetch("https://api.github.com/repos/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo) + path, {
        method: method, headers: headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store"
      });
    } catch (e) {
      throw new Error("No se pudo conectar con GitHub. Revisá la conexión a internet.");
    }
    if (!r.ok) {
      var msg = "";
      try { msg = (await r.json()).message || ""; } catch (e) { /* sin cuerpo */ }
      var err = new Error(errorGitHub(r.status, msg));
      err.status = r.status;
      throw err;
    }
    return r.status === 204 ? null : r.json();
  }

  function rama() { return cfg().branch.split("/").map(encodeURIComponent).join("/"); }

  function serializar(d) { return "window.SITE_DATA = " + JSON.stringify(d, null, 2) + ";\n"; }

  function parsear(texto) {
    var json = texto.replace(/^﻿?\s*window\.SITE_DATA\s*=\s*/, "").replace(/;\s*$/, "");
    return JSON.parse(json);
  }

  function decodeB64(b64) {
    var bin = atob(String(b64).replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  async function leerPublicadoGitHub() {
    try {
      var f = await gh("GET", "/contents/" + DATA_PATH + "?ref=" + rama());
      return normalizar(parsear(decodeB64(f.content)));
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  async function publicar() {
    var c = cfg();
    if (!c.token) {
      mostrarTab("publicacion");
      aviso("warn", "Para publicar, primero conectá el panel con GitHub (es una sola vez por navegador).");
      return;
    }
    var btn = $("#btn-publicar");
    btn.disabled = true;
    btn.textContent = "Publicando…";
    aviso("info", "Publicando cambios…");
    try {
      // ¿Alguien publicó otra cosa mientras tanto?
      var remoto = await leerPublicadoGitHub();
      if (remoto && JSON.stringify(remoto) !== state.base && JSON.stringify(remoto) !== JSON.stringify(state.data)) {
        if (!confirm("Alguien publicó cambios en el sitio después de que empezaste a editar. Si seguís, esos cambios se reemplazan por los tuyos. ¿Publicar igual?")) {
          aviso("warn", "No se publicó nada. Podés usar “Traer lo último publicado” en Conexión con GitHub (perdés tus cambios sin publicar).");
          return;
        }
      }

      limpiarImagenes();
      var ref = await gh("GET", "/git/ref/heads/" + rama());
      var commitPadre = await gh("GET", "/git/commits/" + ref.object.sha);
      var arbol = [];
      var paths = Object.keys(state.imagenes);
      for (var i = 0; i < paths.length; i++) {
        aviso("info", "Subiendo fotos (" + (i + 1) + " de " + paths.length + ")…");
        var blob = await gh("POST", "/git/blobs", { content: state.imagenes[paths[i]].split(",")[1], encoding: "base64" });
        arbol.push({ path: paths[i], mode: "100644", type: "blob", sha: blob.sha });
      }
      arbol.push({ path: DATA_PATH, mode: "100644", type: "blob", content: serializar(state.data) });
      var tree = await gh("POST", "/git/trees", { base_tree: commitPadre.tree.sha, tree: arbol });
      var commit = await gh("POST", "/git/commits", {
        message: "Actualizar contenido desde el panel de administración",
        tree: tree.sha, parents: [ref.object.sha]
      });
      await gh("PATCH", "/git/refs/heads/" + rama(), { sha: commit.sha });

      state.base = JSON.stringify(state.data);
      state.imagenes = {};
      guardarBorrador();
      aviso("ok", "¡Listo! Los cambios se publicaron. El sitio puede tardar uno o dos minutos en mostrarlos.");
      if (SECCIONES[tabActual]) renderLista(tabActual);
    } catch (e) {
      aviso("error", "No se pudo publicar. " + e.message);
    } finally {
      btn.textContent = "Publicar";
      actualizarEstado();
    }
  }

  function descargar(nombre, blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function descargarArchivos() {
    limpiarImagenes();
    descargar("contenido.js", new Blob([serializar(state.data)], { type: "text/javascript" }));
    var paths = Object.keys(state.imagenes);
    paths.forEach(function (p, i) {
      setTimeout(function () {
        fetch(state.imagenes[p]).then(function (r) { return r.blob(); }).then(function (b) { descargar(p.split("/").pop(), b); });
      }, 400 * (i + 1));
    });
    aviso("info", "Se descargó <code>contenido.js</code>: copialo en la carpeta <code>data/</code> del sitio, reemplazando el anterior." +
      (paths.length ? " También se descargaron fotos nuevas; cada una va en:<br>" + paths.map(function (p) { return "<code>" + esc(p) + "</code>"; }).join("<br>") : ""), true);
  }

  function renderPublicacion() {
    var c = cfg();
    $("#panel").innerHTML =
      '<div class="adm-card"><div class="adm-toolbar"><h2>Conexión con GitHub</h2></div>' +
      '<p class="adm-help">El sitio está guardado en GitHub. Al tocar “Publicar”, el panel guarda los cambios ahí con un <strong>token</strong> (una clave de acceso). ' +
      "Sin el token nadie puede modificar el sitio, aunque abra esta página.</p>" +
      "<p class=\"adm-help\"><strong>Cómo crear el token</strong> (una sola vez):</p>" +
      '<ol class="adm-steps">' +
      '<li>Entrá a <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a> con una cuenta que tenga acceso al repositorio.</li>' +
      "<li>Poné un nombre (por ejemplo “Panel del sitio”) y una fecha de vencimiento.</li>" +
      "<li>En <em>Repository access</em> elegí <em>Only select repositories</em> y marcá <strong>" + esc(c.repo) + "</strong>.</li>" +
      "<li>En <em>Permissions → Repository permissions</em>, poné <strong>Contents</strong> en <em>Read and write</em>.</li>" +
      "<li>Tocá <em>Generate token</em>, copiá el código y pegalo acá abajo.</li></ol>" +
      '<div class="adm-row">' +
      '<div class="adm-field"><label for="gh-owner">Usuario u organización</label><input type="text" id="gh-owner" value="' + esc(c.owner) + '"></div>' +
      '<div class="adm-field"><label for="gh-repo">Repositorio</label><input type="text" id="gh-repo" value="' + esc(c.repo) + '"></div>' +
      "</div>" +
      '<div class="adm-row">' +
      '<div class="adm-field"><label for="gh-branch">Rama</label><input type="text" id="gh-branch" value="' + esc(c.branch) + '"></div>' +
      '<div class="adm-field"><label for="gh-token">Token</label><input type="password" id="gh-token" value="' + esc(c.token) + '" placeholder="github_pat_..." autocomplete="off"></div>' +
      "</div>" +
      '<div class="adm-field"><div class="adm-checks"><label><input type="checkbox" id="gh-recordar"' + (c.recordar ? " checked" : "") + "> Recordar el token en este navegador</label></div>" +
      "<small>Si no lo marcás, el token se borra al cerrar la pestaña. No lo marques en computadoras compartidas.</small></div>" +
      '<div class="adm-buttons"><button type="button" class="adm-btn primary" id="gh-guardar">Guardar y probar conexión</button>' +
      '<button type="button" class="adm-btn ghost danger" id="gh-olvidar">Olvidar token</button></div></div>' +

      '<div class="adm-card"><div class="adm-toolbar"><h2>Otras opciones</h2></div>' +
      '<p class="adm-help"><strong>Traer lo último publicado:</strong> carga en el panel lo que está guardado ahora en GitHub. Sirve si otra persona publicó cambios. Se pierden los cambios sin publicar de este navegador.</p>' +
      '<div class="adm-buttons"><button type="button" class="adm-btn" id="gh-traer">Traer lo último publicado</button></div>' +
      '<p class="adm-help" style="margin-top:18px"><strong>Sin GitHub:</strong> descargá el archivo de contenido (y las fotos nuevas) para subirlos a mano.</p>' +
      '<div class="adm-buttons"><button type="button" class="adm-btn" id="gh-descargar">Descargar archivos</button></div></div>';

    function leerForm() {
      return {
        owner: $("#gh-owner").value.trim(), repo: $("#gh-repo").value.trim(),
        branch: $("#gh-branch").value.trim() || "main", token: $("#gh-token").value.trim(),
        recordar: $("#gh-recordar").checked
      };
    }
    $("#gh-guardar").addEventListener("click", async function () {
      var nc = leerForm();
      guardarCfg(nc);
      if (!nc.token) { aviso("warn", "Guardado, pero falta el token para poder publicar."); return; }
      aviso("info", "Probando conexión…");
      try {
        var info = await gh("GET", "");
        await gh("GET", "/git/ref/heads/" + rama());
        if (info.permissions && !info.permissions.push) throw new Error("El token puede ver el repositorio pero no escribir en él.");
        aviso("ok", "Conexión correcta con " + info.full_name + ". Ya podés publicar.");
      } catch (e) {
        aviso("error", e.message);
      }
    });
    $("#gh-olvidar").addEventListener("click", function () {
      var nc = leerForm(); nc.token = ""; nc.recordar = false;
      guardarCfg(nc);
      $("#gh-token").value = ""; $("#gh-recordar").checked = false;
      aviso("ok", "Se borró el token de este navegador.");
    });
    $("#gh-traer").addEventListener("click", async function () {
      if (hayCambios() && !confirm("Vas a perder los cambios sin publicar. ¿Seguir?")) return;
      aviso("info", "Trayendo contenido desde GitHub…");
      try {
        var remoto = await leerPublicadoGitHub();
        if (!remoto) throw new Error("No se encontró " + DATA_PATH + " en el repositorio.");
        state.data = remoto;
        state.base = JSON.stringify(remoto);
        state.imagenes = {};
        guardarBorrador();
        aviso("ok", "Listo: el panel muestra lo último publicado.");
      } catch (e) {
        aviso("error", e.message);
      }
    });
    $("#gh-descargar").addEventListener("click", descargarArchivos);
  }

  /* ---------- Arranque ---------- */
  function init() {
    cargarInicial();
    actualizarEstado();

    document.querySelectorAll("#tabs [data-tab]").forEach(function (b) {
      b.addEventListener("click", function () { aviso(); mostrarTab(b.getAttribute("data-tab")); });
    });
    $("#panel").addEventListener("click", function (ev) {
      if (ev.target.closest("[data-ver]")) { guardarBorrador(); return; } // el link abre la vista previa
      var b = ev.target.closest("[data-accion]");
      if (b) accionLista(b.getAttribute("data-accion"), Number(b.getAttribute("data-i")));
    });
    $("#editor-form").addEventListener("submit", guardarEditor);
    $("#editor-cancelar").addEventListener("click", cerrarEditor);
    $("#editor").addEventListener("cancel", function (ev) { ev.preventDefault(); cerrarEditor(); });

    $("#btn-publicar").addEventListener("click", publicar);
    if (LOCAL) {
      $("#btn-publicar").hidden = true;
      $("#btn-preview").textContent = "Ver sitio ↗";
      $("#btn-descartar").textContent = "Volver al contenido original";
      var tabGh = document.querySelector('#tabs [data-tab="publicacion"]');
      if (tabGh) tabGh.hidden = true;
    }
    $("#btn-preview").addEventListener("click", function () {
      guardarBorrador();
      window.open(LOCAL ? "index.html" : "index.html?vista-previa", "_blank");
    });
    $("#btn-descartar").addEventListener("click", function () {
      if (!confirm(LOCAL
        ? "¿Borrar todos tus cambios y volver al contenido original del sitio?"
        : "¿Descartar todos los cambios sin publicar?")) return;
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* nada */ }
      state.data = normalizar(JSON.parse(state.base));
      state.imagenes = {};
      aviso("ok", "Se descartaron los cambios.");
      actualizarEstado();
      mostrarTab(tabActual);
    });

    // Al entrar al panel siempre se muestra primero "Cómo funciona"
    mostrarTab("ayuda");
  }

  if (!window.SITE_DATA || !normalizar) {
    document.addEventListener("DOMContentLoaded", function () {
      document.getElementById("panel").innerHTML = '<div class="adm-alert error">No se pudo cargar <code>data/contenido.js</code>.</div>';
    });
    return;
  }
  init();
})();
