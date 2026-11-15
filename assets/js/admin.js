/* Panel de administración — edita data/contenido.js y lo publica en GitHub */
(function () {
  "use strict";

  var LINEAS = window.SITE_LINEAS || [];
  var DRAFT_KEY = window.SITE_DRAFT_KEY || "nn-admin-borrador";
  var GH_KEY = "nn-admin-github";
  var DATA_PATH = "data/contenido.js";
  var DEFAULT_REPO = { owner: "chinocapo211", repo: "PaginaInvestigacion", branch: "main" };

  /* ---------- Qué se puede editar ---------- */
  var SECCIONES = {
    personas: {
      titulo: "Personas", singular: "persona",
      ayuda: "Integrantes del laboratorio. Aparecen en la portada y en la página de cada línea de investigación que tengan marcada.",
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
      resumen: function (p) { return [p.nombre, [p.rol_es, nombresLineas(p.lineas)].filter(Boolean).join(" · ")]; },
      thumb: function (p) { return { foto: p.foto, texto: iniciales(p.nombre) }; }
    },
    noticias: {
      titulo: "Noticias", singular: "noticia",
      ayuda: "Se muestran en la portada en este orden (la primera de la lista aparece primero).",
      campos: [
        { k: "fecha", label: "Fecha", ph: "Marzo 2026", req: true },
        { k: "titulo_es", label: "Título (español)", req: true },
        { k: "titulo_en", label: "Título (inglés)", ayuda: "Si queda vacío, se usa el título en español." },
        { k: "texto_es", label: "Texto (español)", tipo: "textarea" },
        { k: "texto_en", label: "Texto (inglés)", tipo: "textarea" },
        { k: "enlace", label: "Enlace “Más información” (opcional)", tipo: "url", ph: "https://... o ribio.html" }
      ],
      resumen: function (n) { return [n.titulo_es, n.fecha]; }
    },
    publicaciones: {
      titulo: "Publicaciones", singular: "publicación",
      ayuda: "En el sitio se ordenan solas por año, de la más nueva a la más vieja. Marcá las líneas para que también aparezcan en la página de cada proyecto.",
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
      resumen: function (p) { return [p.titulo, [p.anio, p.autores].filter(Boolean).join(" · ")]; }
    },
    subsidios: {
      titulo: "Subsidios", singular: "subsidio",
      ayuda: "Se muestran en la portada en este orden.",
      campos: [
        { fila: [
          { k: "periodo", label: "Período", ph: "2025 – 2028", req: true },
          { k: "entidad", label: "Entidad y código", ph: "ANPCyT · PICT-2023-0000" }
        ] },
        { k: "titulo", label: "Título del proyecto", req: true },
        { k: "responsable", label: "Responsable" }
      ],
      resumen: function (s) { return [s.titulo, [s.periodo, s.entidad].filter(Boolean).join(" · ")]; }
    },
    galeria: {
      titulo: "Vida del lab", singular: "foto",
      ayuda: "Galería de fotos de la portada. Si una tarjeta no tiene foto, se muestra un recuadro con el texto.",
      campos: [
        { k: "foto", label: "Foto", tipo: "imagen", carpeta: "vida-del-lab", max: 1400, cuadrada: false },
        { k: "texto_es", label: "Descripción (español)", req: true },
        { k: "texto_en", label: "Descripción (inglés)" }
      ],
      resumen: function (g) { return [g.texto_es, g.foto ? "Con foto" : "Sin foto"]; },
      thumb: function (g) { return { foto: g.foto, texto: "", cuadrada: true }; }
    }
  };

  /* ---------- Estado ---------- */
  var state = { data: null, base: "", imagenes: {} };
  var tabActual = "personas";
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
  function nombresLineas(ids) {
    return (ids || []).map(function (id) {
      var l = LINEAS.filter(function (x) { return x.id === id; })[0];
      return l ? l.corto_es : null;
    }).filter(Boolean).join(", ");
  }
  function slug(s) {
    return String(s || "foto").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "foto";
  }

  function normalizar(d) {
    d = d ? clone(d) : {};
    d.ajustes = d.ajustes || {};
    if (d.ajustes.mostrarAvisosEjemplo === undefined) d.ajustes.mostrarAvisosEjemplo = true;
    if (d.ajustes.email === undefined) d.ajustes.email = "";
    Object.keys(SECCIONES).forEach(function (k) { if (!Array.isArray(d[k])) d[k] = []; });
    return d;
  }

  function hayCambios() {
    return JSON.stringify(state.data) !== state.base || Object.keys(state.imagenes).length > 0;
  }

  // Quita de la lista de pendientes las fotos nuevas que ya nadie usa
  function limpiarImagenes() {
    var usadas = {};
    Object.keys(SECCIONES).forEach(function (k) {
      state.data[k].forEach(function (it) { if (it.foto) usadas[it.foto] = true; });
    });
    Object.keys(state.imagenes).forEach(function (p) { if (!usadas[p]) delete state.imagenes[p]; });
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
      if (conCambios || (!viejo && borrador.base !== publicadoJson)) {
        // Hay cambios sin publicar, o se publicó hace poco y el sitio todavía no se actualizó
        state.data = normalizar(borrador.data);
        state.base = borrador.base;
        state.imagenes = borrador.imagenes || {};
        if (conCambios) {
          aviso("info", "Se recuperaron cambios que todavía no publicaste" +
            (borrador.guardado ? " (guardados el " + new Date(borrador.guardado).toLocaleString("es-AR") + ")" : "") + ".");
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
    var pill = $("#estado");
    pill.textContent = dirty ? "Cambios sin publicar" : "Todo publicado";
    pill.className = "adm-pill " + (dirty ? "dirty" : "ok");
    $("#btn-descartar").hidden = !dirty;
    $("#btn-publicar").disabled = !dirty;
  }

  /* ---------- Pestañas ---------- */
  function mostrarTab(tab) {
    tabActual = tab;
    document.querySelectorAll("#tabs [data-tab]").forEach(function (b) {
      b.setAttribute("aria-current", b.getAttribute("data-tab") === tab ? "true" : "false");
    });
    if (SECCIONES[tab]) renderLista(tab);
    else if (tab === "ajustes") renderAjustes();
    else renderPublicacion();
    try { history.replaceState(null, "", "#" + tab); } catch (e) { /* file:// */ }
  }

  function urlImagen(path) {
    if (!path) return "";
    return state.imagenes[path] || path;
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
      html += '<ol class="adm-list">' + lista.map(function (it, i) {
        var r = sec.resumen(it);
        return '<li class="adm-item">' +
          (sec.thumb ? thumbHtml(sec.thumb(it)) : "") +
          '<div class="adm-sum"><strong>' + esc(r[0] || "(sin título)") + "</strong><span>" + esc(r[1] || "") + "</span></div>" +
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
      var nombre = sec.resumen(lista[i])[0] || sec.singular;
      if (!confirm("¿Eliminar “" + nombre + "”? Se quita del sitio cuando publiques.")) return;
      lista.splice(i, 1);
    } else if (accion === "subir" && i > 0) {
      lista.splice(i - 1, 0, lista.splice(i, 1)[0]);
    } else if (accion === "bajar" && i < lista.length - 1) {
      lista.splice(i + 1, 0, lista.splice(i, 1)[0]);
    } else return;
    guardarBorrador();
    renderLista(tabActual);
  }

  /* ---------- Editor (ventana con formulario) ---------- */
  var edicion = null; // { tab, index, item }

  function campoHtml(c, item) {
    var v = item[c.k];
    var id = "f-" + c.k;
    var label = esc(c.label) + (c.req ? ' <span class="req">*</span>' : "");
    var ayuda = c.ayuda ? "<small>" + esc(c.ayuda) + "</small>" : "";
    if (c.tipo === "textarea") {
      return '<div class="adm-field"><label for="' + id + '">' + label + '</label><textarea id="' + id + '" name="' + c.k + '">' + esc(v) + "</textarea>" + ayuda + "</div>";
    }
    if (c.tipo === "lineas") {
      var sel = v || [];
      return '<div class="adm-field"><span class="adm-label">' + label + '</span><div class="adm-checks">' +
        LINEAS.map(function (l) {
          return '<label><input type="checkbox" name="' + c.k + '" value="' + l.id + '"' + (sel.indexOf(l.id) !== -1 ? " checked" : "") + "> " + esc(l.nombre_es) + "</label>";
        }).join("") + "</div>" + ayuda + "</div>";
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

  function camposPlanos(campos) {
    var out = [];
    campos.forEach(function (c) { if (c.fila) out.push.apply(out, c.fila); else out.push(c); });
    return out;
  }

  function abrirEditor(tab, index) {
    var sec = SECCIONES[tab];
    var item = index >= 0 ? clone(state.data[tab][index]) : { id: nuevoId() };
    edicion = { tab: tab, index: index, item: item };
    $("#editor-titulo").textContent = (index >= 0 ? "Editar " : "Agregar ") + sec.singular;
    $("#editor-campos").innerHTML = sec.campos.map(function (c) {
      if (c.fila) return '<div class="adm-row">' + c.fila.map(function (f) { return campoHtml(f, item); }).join("") + "</div>";
      return campoHtml(c, item);
    }).join("");
    $("#editor-error").hidden = true;

    camposPlanos(sec.campos).filter(function (c) { return c.tipo === "imagen"; }).forEach(prepararImagen);

    var dlg = $("#editor");
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
    quitar.addEventListener("click", function () { hidden.value = ""; pintar(); });
    box.querySelector("[data-file]").addEventListener("change", function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      achicarImagen(file, c.max || 1200).then(function (dataUrl) {
        var form = $("#editor-form");
        var base = (form.elements.nombre && form.elements.nombre.value) || (form.elements.texto_es && form.elements.texto_es.value) || file.name.replace(/\.[^.]+$/, "");
        var path = "assets/img/" + c.carpeta + "/" + slug(base) + "-" + Date.now().toString(36) + ".jpg";
        state.imagenes[path] = dataUrl;
        hidden.value = path;
        pintar();
      }).catch(function () {
        alert("No se pudo leer esa imagen. Probá con un JPG o PNG.");
      });
      ev.target.value = "";
    });
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

  function guardarEditor(ev) {
    ev.preventDefault();
    var sec = SECCIONES[edicion.tab];
    var form = $("#editor-form");
    var item = edicion.item;
    var faltan = [];
    camposPlanos(sec.campos).forEach(function (c) {
      if (c.tipo === "lineas") {
        item[c.k] = Array.prototype.slice.call(form.querySelectorAll('input[name="' + c.k + '"]:checked')).map(function (x) { return x.value; });
        return;
      }
      var val = String(form.elements[c.k].value || "").trim();
      if (c.tipo === "url" && val && /^(javascript|data|vbscript):/i.test(val)) val = "";
      if (c.tipo === "url" && val && /^www\./i.test(val)) val = "https://" + val;
      item[c.k] = val;
      if (c.req && !val) faltan.push(c.label);
    });
    if (faltan.length) {
      var err = $("#editor-error");
      err.textContent = "Falta completar: " + faltan.join(", ") + ".";
      err.hidden = false;
      return;
    }
    if (edicion.index >= 0) state.data[edicion.tab][edicion.index] = item;
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

  /* ---------- Ajustes ---------- */
  function renderAjustes() {
    var a = state.data.ajustes;
    $("#panel").innerHTML = '<div class="adm-card"><div class="adm-toolbar"><h2>Ajustes</h2></div>' +
      '<p class="adm-help">Datos generales del sitio.</p>' +
      '<div class="adm-field"><label for="aj-email">Email de contacto</label>' +
      '<input type="text" id="aj-email" value="' + esc(a.email) + '" placeholder="laboratorio@itba.edu.ar"></div>' +
      '<div class="adm-field"><div class="adm-checks"><label><input type="checkbox" id="aj-avisos"' + (a.mostrarAvisosEjemplo ? " checked" : "") + "> " +
      "Mostrar los recuadros amarillos de “Contenido de ejemplo”</label></div>" +
      "<small>Desmarcalo cuando hayas reemplazado el contenido de ejemplo por el real.</small></div></div>";
    $("#aj-email").addEventListener("input", function (e) { a.email = e.target.value.trim(); guardarBorrador(); });
    $("#aj-avisos").addEventListener("change", function (e) { a.mostrarAvisosEjemplo = e.target.checked; guardarBorrador(); });
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
      var b = ev.target.closest("[data-accion]");
      if (b) accionLista(b.getAttribute("data-accion"), Number(b.getAttribute("data-i")));
    });
    $("#editor-form").addEventListener("submit", guardarEditor);
    $("#editor-cancelar").addEventListener("click", cerrarEditor);
    $("#editor").addEventListener("cancel", function (ev) { ev.preventDefault(); cerrarEditor(); });

    $("#btn-publicar").addEventListener("click", publicar);
    $("#btn-preview").addEventListener("click", function () {
      guardarBorrador();
      window.open("index.html?vista-previa", "_blank");
    });
    $("#btn-descartar").addEventListener("click", function () {
      if (!confirm("¿Descartar todos los cambios sin publicar?")) return;
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* nada */ }
      state.data = normalizar(JSON.parse(state.base));
      state.imagenes = {};
      aviso("ok", "Se descartaron los cambios.");
      actualizarEstado();
      mostrarTab(tabActual);
    });

    var inicial = (location.hash || "").slice(1);
    var validas = Object.keys(SECCIONES).concat(["ajustes", "publicacion"]);
    mostrarTab(validas.indexOf(inicial) !== -1 ? inicial : "personas");
  }

  if (!window.SITE_DATA) {
    document.addEventListener("DOMContentLoaded", function () {
      document.getElementById("panel").innerHTML = '<div class="adm-alert error">No se pudo cargar <code>data/contenido.js</code>.</div>';
    });
    return;
  }
  init();
})();
