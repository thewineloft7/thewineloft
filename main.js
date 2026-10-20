(function () {
  "use strict";

  /* =====================================================================
     THE WINE LOFT · main.js
     ---------------------------------------------------------------------
     No hace falta tocar este archivo: tus datos están en datos.js.

     Todo el contenido ya está escrito en index.html. Este archivo:
       1. lo actualiza con lo que pusiste en datos.js (textos, combos,
          vinos, fotos y fechas),
       2. arma el pedido en 4 pasos y el perfil guardado en el dispositivo,
       3. suma los efectos: apariciones, foto que sigue al mouse, números
          que suben, estaciones con «Ahora» y la marca del pie.
     Cada parte corre por separado: si una falla, las demás siguen y la
     página igual se ve completa.
     ===================================================================== */

  var data = window.__BRAND__ || {};
  var doc = document;
  var root = doc.documentElement;

  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
    "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var ISO = /^\d{4}-\d{2}-\d{2}$/;
  var FONDOS = [
    { id: "loft", l: "Loft" },
    { id: "biblioteca", l: "Biblioteca" },
    { id: "noche", l: "Azul noche" },
    { id: "bordo", l: "Bordó" }
  ];

  /* Si datos.js falta o tiene un error, se usan los combos originales. */
  var COMBOS_BASE = [
    { id: "reserva", nombre: "Caja Reserva", tipo: "caja", precio: "70000", botellas: "4",
      descripcion: "Cuatro vinos con más guarda y más historia.", destacado: "La más pedida",
      agotado: "si", agotadoTexto: "Esta caja ya no se vende. La dejamos acá para que conozcas lo que trajo.",
      foto: "caja-reserva-octubre.webp", fotoTexto: "Los cuatro vinos de la Caja Reserva de octubre en la biblioteca del loft: Corazón Valiente, Calivista, Chañarmuyo y Tükma", linkPago: "",
      vinos: [
        { nombre: "Chañarmuyo", varietal: "Malbec 2022", region: "La Rioja", nota: "Este pide asado.", foto: "" },
        { nombre: "Tükma Reserva", varietal: "Cabernet Sauvignon 2022", region: "Salta", nota: "Abrilo media hora antes.", foto: "" }] },
    { id: "clasica", nombre: "Caja Clásica", tipo: "caja", precio: "55000", botellas: "4",
      descripcion: "Cuatro vinos para todos los días, bien elegidos.", destacado: "",
      foto: "", fotoTexto: "Los vinos de la Caja Clásica sobre la mesa, foto vertical", linkPago: "",
      vinos: [
        { nombre: "Tinto a confirmar", varietal: "Varietal", region: "Región", nota: "Nota del que eligió.", foto: "" },
        { nombre: "Tinto a confirmar", varietal: "Varietal", region: "Región", nota: "Nota del que eligió.", foto: "" }] },
    { id: "duo-reserva", nombre: "Combo Autor", tipo: "duo", precio: "25000", botellas: "2",
      descripcion: "Dos vinos para una ocasión que lo merece.", destacado: "",
      foto: "duo-reserva-cielo.webp", fotoTexto: "Marioneta Malbec y 13 Clés Malbec", linkPago: "",
      vinos: [
        { nombre: "Marioneta", varietal: "Malbec", region: "Mendoza", nota: "Pide pizza casera.", foto: "v-marioneta-recorte.webp" },
        { nombre: "13 Clés", varietal: "Malbec", region: "Argentina", nota: "Guardalo para el domingo.", foto: "v-13cles-recorte.webp" }] },
    { id: "duo-clasico", nombre: "Combo Origen", tipo: "duo", precio: "18500", botellas: "2",
      descripcion: "Dos vinos para la cena de esta noche.", destacado: "",
      foto: "duo-clasico-cielo.webp", fotoTexto: "Tepeyac Reserva Malbec y Criolla Argentina Tinta", linkPago: "",
      vinos: [
        { nombre: "Tepeyac Reserva", varietal: "Malbec", region: "Mendoza", nota: "Para el asado del sábado.", foto: "v-tepeyac-recorte.webp" },
        { nombre: "Criolla Argentina", varietal: "Tinta · Bodega Niven 2025", region: "Mendoza", nota: "Con algo para picar.", foto: "v-criolla-recorte.webp" }] }
  ];
  var MENSAJES_BASE = {
    pedido: "Hola! Quiero pedir la {combo} de {mes} ({total}).\nSorpresas: {sorpresas}.\nAdicionales: {adicionales}.{regalo}\nMis datos: {direccion}.\nNombre: {nombre} · WhatsApp: {telefono}",
    pedidoVarios: "Hola! Quiero hacer este pedido de {mes} ({total}):\n{detalle}\nNombre: {nombre} · WhatsApp: {telefono}",
    avisame: "Hola! Quiero que me avisen cuando abran las reservas de la caja de {proximoMes}. Me interesa la {combo}.",
    consulta: "Hola! Quiero saber más sobre The Wine Loft.",
    encargue: "Hola! Quiero encargar {vino}. ¿Me confirman el precio y cuándo lo tienen?",
    encargueConsulta: "Hola! Quiero consultar por un vino por encargue."
  };

  /* ------------------------------------------------------------------
     Ayudantes
     ------------------------------------------------------------------ */

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  function safe(fn, name) {
    try {
      fn();
    } catch (err) {
      if (window.console && console.warn) console.warn("[Wine Loft] Falló «" + name + "»:", err);
    }
  }

  function str(v) {
    if (typeof v === "string") return v.trim();
    if (typeof v === "number") return String(v);
    return "";
  }
  function filled(v) { return str(v) !== ""; }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /* Texto de datos.js → HTML seguro, con *cursiva* y \n como salto de línea */
  function format(s) {
    return esc(str(s)).replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/\*/g, "").replace(/\r?\n|\\n/g, "<br>");
  }
  function money(n) { return "$" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function num(v) {
    var n = parseInt(str(v).replace(/\D/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }
  function slug(s) {
    return str(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function rutaFoto(v) {
    var s = str(v).replace(/\\/g, "/");
    if (!s) return "";
    return s.indexOf("/") === -1 ? "assets/img/" + s : s;
  }
  function placeholder(texto) {
    return '<div class="ph"><span class="ph__tag">[IMAGEN AQUÍ: ' + esc(texto || "foto sugerida") + "]</span></div>";
  }

  var store = {
    get: function (k) { try { return JSON.parse(window.localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { window.localStorage.removeItem(k); } catch (e) { /* nada */ } }
  };
  var session = {
    get: function (k) { try { return JSON.parse(window.sessionStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* nada */ } },
    del: function (k) { try { window.sessionStorage.removeItem(k); } catch (e) { /* nada */ } }
  };

  function toast(msg) {
    var t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove("show"); }, 3400);
  }

  /* ------------------------------------------------------------------
     Datos normalizados
     ------------------------------------------------------------------ */

  var TX = data.textos || {};
  var FOTOS = data.fotos || {};
  var MES = str(data.mes) || "octubre";
  var ANIO = str(data.anio) || String(new Date().getFullYear());
  var RESERVAS = str(data.reservas) || "1 al 3";
  var PAGO = str(data.pago) || "hasta el 6";
  var ENTREGAS = str(data.entregas) || "7 al 10";
  var GOAL = Math.max(2, num(data.regaloCada) || 5);

  var COMBOS = (Array.isArray(data.combos) ? data.combos : COMBOS_BASE)
    .filter(function (c) { return c && filled(c.nombre) && num(c.precio) > 0; })
    .map(function (c, i) {
      var vinos = Array.isArray(c.vinos) ? c.vinos.filter(function (v) { return v && filled(v.nombre); }) : [];
      return {
        id: filled(c.id) ? slug(c.id) : "combo-" + (i + 1),
        nombre: str(c.nombre),
        tipo: str(c.tipo).toLowerCase() === "duo" ? "duo" : "caja",
        precio: num(c.precio),
        botellas: num(c.botellas) || Math.max(vinos.length, 1),
        descripcion: str(c.descripcion),
        destacado: str(c.destacado),
        agotado: c.agotado === true || /^(si|sí|true|1|x)$/i.test(str(c.agotado)),
        agotadoTexto: str(c.agotadoTexto),
        foto: rutaFoto(c.foto),
        fotoTexto: str(c.fotoTexto),
        linkPago: /^https?:\/\//i.test(str(c.linkPago)) ? str(c.linkPago) : "",
        vinos: vinos
      };
    });
  function combo(id) {
    for (var i = 0; i < COMBOS.length; i++) if (COMBOS[i].id === id) return COMBOS[i];
    return COMBOS[0];
  }
  var CAJAS = COMBOS.filter(function (c) { return c.tipo === "caja"; });
  var DISPONIBLES = COMBOS.filter(function (c) { return !c.agotado; });
  /* El combo a abrir: el pedido, si está a la venta; si no, la primera caja disponible */
  function aLaVenta(id) {
    var c = id ? combo(id) : null;
    if (c && c.id === id && !c.agotado) return c;
    for (var i = 0; i < DISPONIBLES.length; i++) if (DISPONIBLES[i].tipo === "caja") return DISPONIBLES[i];
    return DISPONIBLES[0] || null;
  }
  var DUOS = COMBOS.filter(function (c) { return c.tipo === "duo"; });

  var PREFS = (Array.isArray(data.preferencias) ? data.preferencias : ["Sin blancos", "Sin rosados", "Sin espumantes"])
    .filter(filled).map(function (l) { return { id: slug(l), l: str(l) }; });
  var ZONAS = (Array.isArray(data.zonas) ? data.zonas : ["Paraná", "Alrededores de Paraná", "Interior de Entre Ríos"])
    .filter(filled).map(str);

  /* Adicionales del pedido */
  var ADIC = (function () {
    var a = data.adicionales || {};
    function uno(k, nombre, detalle) {
      var x = a[k] || {};
      return { id: k, nombre: str(x.nombre) || nombre, detalle: str(x.detalle) || detalle, precio: num(x.precio) };
    }
    return {
      charcuteria: uno("charcuteria", "Charcutería", "Salame y queso"),
      cristaleria: uno("cristaleria", "Cristalería", "Una copa de cristal"),
      regalo: uno("regalo", "Para regalo", "Lo enviamos a donde nos indiques, con una carta de feliz cumpleaños. Incluye charcutería o cristalería, el que elijas (o los dos: el segundo se suma aparte).")
    };
  })();
  function precioAdic(x) { return x.precio ? "+ " + money(x.precio) : "precio a confirmar"; }
  /* Si el regalo lleva los dos adicionales, uno va incluido en el precio
     del regalo y el otro se cobra: el de menor precio (el precio del
     regalo ya cubre cualquiera de los dos). Sin precios cargados, queda
     «a confirmar». */
  function cobradaEnAmbas() {
    var a = ADIC.charcuteria.precio, b = ADIC.cristaleria.precio;
    if (a && b) return a <= b ? "charcuteria" : "cristaleria";
    return !a ? "charcuteria" : "cristaleria";
  }

  var WA = str(data.whatsapp).replace(/\D/g, "");
  var hasWA = WA.length >= 10;
  var hayLinks = COMBOS.some(function (c) { return !!c.linkPago; });
  var modoPrueba = !hasWA && !hayLinks;

  function waLink(msg) { return "https://wa.me/" + WA + (msg ? "?text=" + encodeURIComponent(msg) : ""); }

  /* Avisos al mail del club (con Web3Forms, gratis): perfil nuevo, cambio
     de «no quiero recibir» y copia de cada pedido. Sin clave en datos.js
     no se manda nada. Nunca frena la página: si falla, sigue igual. */
  var CLAVE_AVISOS = str(data.claveAvisos);
  var hayAvisos = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(CLAVE_AVISOS);
  function avisar(asunto, campos) {
    if (!hayAvisos) return;
    try {
      var fd = new FormData();
      fd.append("access_key", CLAVE_AVISOS);
      fd.append("subject", asunto);
      fd.append("from_name", "Página de The Wine Loft");
      Object.keys(campos).forEach(function (k) { if (filled(campos[k])) fd.append(k, String(campos[k])); });
      var p = fetch("https://api.web3forms.com/submit", { method: "POST", body: fd, keepalive: true, headers: { Accept: "application/json" } });
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* sin aviso, la página sigue */ }
  }
  /* Planilla del club (Google, gratis): cada perfil y cada pedido quedan
     anotados ahí, el dueño tilda «Pagado» y la página trae de vuelta las
     cajas pagadas de cada socio, en cualquier celular. Sin link en
     datos.js todo sigue como antes, guardado solo en el dispositivo. */
  var PLANILLA = str(data.planilla);
  var hayPlanilla = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(PLANILLA);
  /* Mismo criterio que la planilla: 10 dígitos, sin 54, sin 9, sin 0 */
  function telKey(t) {
    var d = str(t).replace(/\D/g, "");
    if (d.indexOf("549") === 0) d = d.slice(3);
    else if (d.indexOf("54") === 0 && d.length > 10) d = d.slice(2);
    d = d.replace(/^0+/, "");
    /* 0343 15 4123456: se saca el 15 que va después de la característica */
    if (d.length === 12) [3, 4, 2].some(function (n) { if (d.substr(n, 2) === "15") { d = d.slice(0, n) + d.slice(n + 2); return true; } return false; });
    return d.length >= 10 ? d.slice(-10) : "";
  }
  function planillaEnviar(o) {
    if (!hayPlanilla || !telKey(o.tel)) return;
    try {
      var p = fetch(PLANILLA, { method: "POST", mode: "no-cors", keepalive: true, body: JSON.stringify(o) });
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* sin planilla, la página sigue */ }
  }
  function planillaLeer(tel, cb) {
    var k = telKey(tel);
    if (!hayPlanilla || !k || !window.fetch) { cb(null); return; }
    fetch(PLANILLA + "?tel=" + k).then(function (r) { return r.json(); })
      .then(function (d) { cb(d && d.ok ? d : null); }, function () { cb(null); });
  }

  function ahora() {
    try { return new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" }); }
    catch (e) { return new Date().toLocaleString(); }
  }

  /* ------------------------------------------------------------------
     Fecha de hoy en Argentina y estado de las reservas
     ------------------------------------------------------------------ */

  function hoy() {
    var q = /[?&]hoy=(\d{4}-\d{2}-\d{2})/.exec(window.location.search || "");
    if (q) return q[1];
    try {
      var o = {};
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit"
      }).formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
      var s = o.year + "-" + o.month + "-" + o.day;
      if (ISO.test(s)) return s;
    } catch (e) { /* navegador viejo */ }
    var d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }
  function dia(iso) { return parseInt(iso.slice(8, 10), 10); }
  function mesNum(iso) { return parseInt(iso.slice(5, 7), 10); }

  var DIAS_RESERVA = (function () {
    var m = RESERVAS.match(/\d+/g) || [];
    return { a: parseInt(m[0] || "1", 10), b: parseInt(m[1] || m[0] || "3", 10) };
  })();

  var estado = (function () {
    var desde = str(data.reservasDesde), hasta = str(data.reservasHasta), h = hoy();
    var proxMes = (function () {
      var m = mesNum(h);
      if (dia(h) > DIAS_RESERVA.b) m = m === 12 ? 1 : m + 1;
      return MESES[m - 1];
    })();
    if (!ISO.test(desde) || !ISO.test(hasta)) {
      return { tipo: "abierto", texto: "Reservas del " + RESERVAS + " de cada mes", prox: proxMes, sinFecha: true };
    }
    if (h < desde) return { tipo: "pronto", texto: "Reservas del " + dia(desde) + " al " + dia(hasta) + " de " + MESES[mesNum(desde) - 1], prox: MESES[mesNum(desde) - 1] };
    if (h > hasta) return { tipo: "cerrado", texto: "Próximas reservas: " + RESERVAS + " de " + proxMes, prox: proxMes };
    return { tipo: "abierto", texto: "Reservas abiertas hasta el " + dia(hasta) + " de " + MESES[mesNum(hasta) - 1], prox: proxMes };
  })();

  function MENSAJES(clave, vals) {
    var m = data.mensajes || {};
    var base = typeof m[clave] === "string" && m[clave].trim() ? m[clave] : MENSAJES_BASE[clave] || "";
    vals = vals || {};
    return base.replace(/\\n/g, "\n").replace(/\{(\w+)\}/g, function (all, k) { return k in vals ? vals[k] : ""; });
  }

  /* ------------------------------------------------------------------
     1. Textos, datos sueltos y fotos
     ------------------------------------------------------------------ */

  function applyTexts() {
    $$("[data-texto]").forEach(function (el) {
      var k = el.getAttribute("data-texto");
      if (!(k in TX) || Array.isArray(TX[k])) return;
      if (filled(TX[k])) el.innerHTML = format(TX[k]);
      else if (el.tagName !== "H1") el.hidden = true;
    });
    $$("[data-dato]").forEach(function (el) {
      var k = el.getAttribute("data-dato");
      if (filled(data[k])) el.textContent = str(data[k]);
    });
    $$("[data-regla]").forEach(function (el) {
      var k = el.getAttribute("data-regla");
      el.textContent = k === "entregas" ? ENTREGAS : k === "pago" ? PAGO : RESERVAS;
    });
    $$("[data-mes]").forEach(function (el) { el.textContent = MES; });
    $$("[data-mes-anio]").forEach(function (el) { el.textContent = cap(MES) + " " + ANIO; });
    $$("[data-regalo-cada]").forEach(function (el) { el.textContent = String(GOAL); });
    $$("[data-anio]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

    var aviso = $("[data-aviso]");
    if (aviso && "aviso" in data) {
      if (filled(data.aviso)) aviso.textContent = str(data.aviso);
      else aviso.hidden = true;
    }
    if (DISPONIBLES.length) {
      var min = Math.min.apply(null, DISPONIBLES.map(function (c) { return c.precio; }));
      $$("[data-desde]").forEach(function (el) { el.textContent = money(min); });
    }

    var faq = $("#faqList");
    if (faq && Array.isArray(TX.preguntas)) {
      var qs = TX.preguntas.filter(function (q) { return q && filled(q.p); });
      if (qs.length) {
        faq.innerHTML = qs.map(function (q, i) {
          return "<details" + (i === 0 ? " open" : "") + "><summary>" + format(q.p) + "</summary>" +
            (filled(q.r) ? "<p>" + format(q.r) + "</p>" : "") + "</details>";
        }).join("");
      }
    }

    /* Números grandes de la regla: «reservás hasta el 03 y pagás hasta el 06» */
    var big = $("[data-big]");
    var diaPago = parseInt((PAGO.match(/\d+/) || ["6"])[0], 10);
    if (big) big.innerHTML =
      '<span class="rule__n"><small>' + esc(str(TX.reglaReserva) || "Reservás hasta el") + "</small>" + pad2(DIAS_RESERVA.b) + "</span>" +
      "<em>y</em>" +
      '<span class="rule__n"><small>' + esc(str(TX.reglaPago) || "pagás hasta el") + "</small>" + pad2(diaPago) + "</span>";
  }

  /* Cada espacio de foto: foto entera si está cargada, si no «IMAGEN AQUÍ» */
  function slot(el, src, texto) {
    if (!el) return;
    if (src) {
      el.innerHTML = '<img src="' + esc(src) + '" alt="' + esc(texto) + '">';
      el.classList.add("has-img");
      var img = $("img", el);
      img.onerror = function () { el.classList.remove("has-img"); el.innerHTML = placeholder(texto); };
    } else {
      el.classList.remove("has-img");
      el.innerHTML = placeholder(texto);
    }
  }
  function applyFotos() {
    $$("[data-slot]").forEach(function (el) {
      var k = el.getAttribute("data-slot");
      if (!(k in FOTOS) && !((k + "Texto") in FOTOS)) {
        if ($("img", el)) el.classList.add("has-img");
        return;
      }
      slot(el, rutaFoto(FOTOS[k]), str(FOTOS[k + "Texto"]));
    });
  }

  function applyContactos() {
    var ig = str(data.instagram).replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?#].*$/, "");
    var email = str(data.email);
    var items = {
      whatsapp: hasWA ? { href: waLink(MENSAJES("consulta")), text: "WhatsApp", blank: true } : null,
      instagram: ig ? { href: "https://instagram.com/" + encodeURIComponent(ig), text: "@" + ig, blank: true } : null,
      email: email.indexOf("@") > 0 ? { href: "mailto:" + email, text: email } : null
    };
    var alguno = false;
    Object.keys(items).forEach(function (k) {
      var it = items[k];
      $$('[data-contacto="' + k + '"]').forEach(function (li) {
        if (!it) return;
        var a = $("a", li);
        if (a) {
          a.textContent = it.text;
          a.setAttribute("href", it.href);
          if (it.blank) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
        }
        li.hidden = false;
        alguno = true;
      });
    });
    var sin = $("[data-sin-contacto]");
    if (sin) sin.hidden = alguno;
  }

  /* ------------------------------------------------------------------
     2. La caja del mes (menú) y los dúos (lista)
     ------------------------------------------------------------------ */

  function pours(c) {
    var html = c.vinos.map(function (v, i) {
      var meta = ["N.º " + (i + 1), str(v.varietal), str(v.region)].filter(Boolean).join(" · ");
      return "<li><span class=\"pours__meta\">" + esc(meta) + "</span><b>" + esc(v.nombre) + "</b>" +
        (filled(v.nota) ? '<span class="hand">' + format(v.nota) + "</span>" : "") + "</li>";
    }).join("");
    var resto = c.botellas - c.vinos.length;
    if (resto > 0) {
      var desde = c.vinos.length + 1;
      html += '<li class="pours__surprise"><span class="pours__meta">N.º ' + (resto === 1 ? desde : desde + (resto === 2 ? " y " : " a ") + c.botellas) + "</span>" +
        "<b>" + (resto === 1 ? "Una sorpresa" : (resto === 2 ? "Dos" : resto) + " sorpresas") + "</b>" +
        '<span class="pours__x">Puede ser tinto, blanco, rosado o espumante.</span></li>';
    }
    return html;
  }

  function figura(c) {
    return (c.foto
      ? '<img src="' + esc(c.foto) + '" alt="' + esc(c.fotoTexto || ("Los vinos de " + c.nombre)) + '">'
      : placeholder(c.fotoTexto || ("Los vinos de " + c.nombre))) +
      (c.agotado ? '<span class="soldout">Sold out</span>' : "");
  }

  function applyMenu() {
    var st = $("[data-estado]");
    if (st) {
      st.classList.toggle("open", estado.tipo === "abierto");
      $("span", st).textContent = estado.texto;
    }
    var box = $("[data-flights]"), sticky = $(".menu__sticky");
    if (!box || !CAJAS.length) return;
    var primera = true;
    box.innerHTML = CAJAS.map(function (c) {
      var boton = "";
      if (!c.agotado) {
        boton = '<a class="btn' + (primera ? "" : " btn--line") + '" href="#club" data-order="' + c.id + '">Reservar ' + esc(c.nombre) + "</a>";
        primera = false;
      }
      return '<article class="flight rv' + (c.agotado ? " is-soldout" : "") + '" data-flight="' + c.id + '">' +
        '<figure class="slot flight__media">' + figura(c) + "</figure>" +
        (c.agotado ? '<span class="tag tag--soldout">Sold out</span>' : c.destacado ? '<span class="tag">' + esc(c.destacado) + "</span>" : "") +
        '<p class="flight__price">' + money(c.precio) + "</p>" +
        "<h3>" + esc(c.nombre) + "</h3>" +
        (c.descripcion ? '<p class="flight__desc">' + format(c.descripcion) + "</p>" : "") +
        '<p class="flight__per">' + c.botellas + " vinos · " + money(c.precio / c.botellas) + " c/u</p>" +
        '<ol class="pours">' + pours(c) + "</ol>" +
        (c.agotado ? '<p class="flight__off">' + format(c.agotadoTexto || "Esta caja ya no se vende.") + "</p>" : boton) +
        "</article>";
    }).join("");
    if (sticky) {
      sticky.innerHTML = CAJAS.map(function (c, i) {
        return '<figure class="slot menu__fig' + (i === 0 ? " is-on" : "") + '" data-menu-fig="' + c.id + '">' + figura(c) + "</figure>";
      }).join("");
      $$(".menu__fig img", sticky).forEach(function (img) {
        img.onerror = function () { var f = img.parentNode, b = $(".soldout", f); f.innerHTML = placeholder(img.alt) + (b ? b.outerHTML : ""); };
      });
    }
  }

  /* La foto fija cambia según la caja que estás leyendo */
  function initMenuSwap() {
    var figs = $$(".menu__fig");
    if (figs.length < 2 || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.getAttribute("data-flight");
        figs.forEach(function (f) { f.classList.toggle("is-on", f.getAttribute("data-menu-fig") === id); });
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    $$("[data-flight]").forEach(function (f) { io.observe(f); });
  }

  function applyDuos() {
    var box = $("[data-duos]");
    if (!box) return;
    var sec = $("#duos");
    if (!DUOS.length) { if (sec) sec.hidden = true; return; }
    var total = 0;
    box.innerHTML = DUOS.map(function (c) {
      total += c.vinos.length;
      return '<div class="wgroup rv">' +
        '<div class="wgroup__head"' + (c.foto ? ' data-img="' + esc(c.foto) + '"' : "") + ">" +
        '<span class="eyebrow">' + esc(c.nombre) + "</span>" +
        '<span class="wgroup__desc">' + format(c.descripcion) + "</span>" +
        '<b class="wgroup__price">' + money(c.precio) + "</b>" +
        (c.agotado ? '<span class="tag tag--soldout">Sold out</span>' : '<a class="btn btn--sm" href="#duos" data-order="' + c.id + '" data-paso="1">Comprar</a>') + "</div>" +
        c.vinos.map(function (v, i) {
          var foto = rutaFoto(v.foto);
          var meta = [str(v.varietal), str(v.region)].filter(Boolean).join(" · ");
          return '<a class="wrow" href="#duos"' + (c.agotado ? "" : ' data-order="' + c.id + '" data-paso="1"') + (foto ? ' data-img="' + esc(foto) + '"' : "") + ">" +
            '<span class="wrow__n">N.º ' + (i + 1) + '</span><span class="wrow__name">' + esc(v.nombre) + "</span>" +
            '<span class="wrow__meta">' + esc(meta) + "</span>" +
            '<span class="wrow__note hand">' + format(v.nota) + "</span>" +
            (foto ? '<img class="wrow__thumb" src="' + esc(foto) + '" alt="">' : "") + "</a>";
        }).join("") + "</div>";
    }).join("");
    var sup = $("[data-duos-count]");
    if (sup) sup.textContent = pad2(total);
  }

  /* Foto que sigue al mouse en la lista de dúos (solo con mouse) */
  function initCursorImg() {
    if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var wrap = $(".cursor-img"), img = wrap && $("img", wrap), list = $("[data-duos]");
    if (!wrap || !img || !list) return;
    var x = 0, y = 0, tx = 0, ty = 0, on = false, raf = 0;
    function loop() {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      var rot = Math.max(-8, Math.min(8, (tx - x) * 0.08));
      wrap.style.transform = "translate3d(" + (x + 24).toFixed(1) + "px," + (y - wrap.offsetHeight / 2).toFixed(1) + "px,0) rotate(" + rot.toFixed(2) + "deg)";
      raf = on || Math.abs(tx - x) > 0.5 ? requestAnimationFrame(loop) : 0;
    }
    list.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      var t = e.target.closest ? e.target.closest("[data-img]") : null;
      if (t) {
        var src = t.getAttribute("data-img");
        if (img.getAttribute("src") !== src) img.setAttribute("src", src);
        /* en cada vino, la botella recortada (sin fondo); en el dúo, la foto */
        wrap.classList.toggle("cut", t.classList.contains("wrow"));
        if (!on) { x = tx; y = ty; }
        on = true;
        wrap.classList.add("on");
      } else {
        on = false;
        wrap.classList.remove("on");
      }
      if (!raf) raf = requestAnimationFrame(loop);
    });
    list.addEventListener("mouseleave", function () { on = false; wrap.classList.remove("on"); });
  }

  /* ------------------------------------------------------------------
     3. Vinos por estación (y la marca «Ahora» en la estación actual)
     ------------------------------------------------------------------ */

  var ALTURAS = [0.66, 0.84, 1, 0.74, 0.9, 0.7];
  var EST_BASE = [
    { nombre: "Verano", meses: "Diciembre a febrero", texto: "Acidez alta, poco cuerpo y bien fríos. Con el calor, lo que pide el cuerpo es refrescarse.", uvas: "Chardonnay sin barrica y Criolla Chica" },
    { nombre: "Otoño", meses: "Marzo a mayo", texto: "Cuerpo medio, frutados y con taninos amables, para pastas, carnes al horno y hongos.", uvas: "Malbec y Pinot Noir" },
    { nombre: "Invierno", meses: "Junio a agosto", texto: "Cuerpo pleno, taninos firmes y crianza en madera, a la altura del locro, los guisos y el cordero.", uvas: "Cabernet Sauvignon y Tannat" },
    { nombre: "Primavera", meses: "Septiembre a noviembre", texto: "Frescos, aromáticos y livianos, para una cocina más verde y ligera que no canse el paladar.", uvas: "Torrontés y Sauvignon Blanc" }
  ];
  function claveEst(n) { return slug(n).replace(/-/g, ""); }

  function applyEstaciones() {
    var list = $("[data-estaciones]");
    if (!list) return;
    var est = (Array.isArray(TX.estaciones) ? TX.estaciones : EST_BASE).filter(function (e) { return e && filled(e.nombre); }).slice(0, 6);
    if (!est.length) return;
    list.innerHTML = est.map(function (e, i) {
      var k = "est" + (i + 1);
      return '<li class="year__item" style="--h:' + ALTURAS[i] + '" data-est="' + claveEst(e.nombre) + '">' +
        '<div class="year__mediabox"><figure class="slot year__media" data-slot="' + k + '"></figure></div>' +
        '<span class="year__dot"></span>' +
        '<p class="year__day">' + esc(e.nombre) + "</p>" +
        (filled(e.meses) ? '<p class="year__t">' + esc(e.meses) + "</p>" : "") +
        (filled(e.texto) ? '<p class="year__x">' + format(e.texto) + "</p>" : "") +
        (filled(e.uvas)
          ? '<ul class="year__uvas" aria-label="Uvas de ' + esc(str(e.nombre).toLowerCase()) + '">' +
            str(e.uvas).split(/\s*,\s*|\s+y\s+/).filter(filled).map(function (u) { return "<li>" + esc(u) + "</li>"; }).join("") + "</ul>"
          : '<p class="year__x todo">[COMPLETAR: qué uvas se toman en ' + esc(str(e.nombre).toLowerCase()) + "]</p>") + "</li>";
    }).join("");
    $$("[data-slot]", list).forEach(function (el) {
      var k = el.getAttribute("data-slot");
      slot(el, rutaFoto(FOTOS[k]), str(FOTOS[k + "Texto"]) || "Foto vertical de la estación");
    });
    list.style.setProperty("--n", String(est.length));
  }

  /* Estación de hoy en el hemisferio sur */
  function estacionActual() {
    var m = mesNum(hoy());
    return m === 12 || m <= 2 ? "verano" : m <= 5 ? "otono" : m <= 8 ? "invierno" : "primavera";
  }
  function placeHoy() {
    var track = $(".year__track"), marker = $("[data-hoy]");
    var items = $$(".year__item");
    if (!track || !marker || !items.length) return;
    var actual = null, clave = estacionActual();
    items.forEach(function (li) {
      var es = li.getAttribute("data-est") === clave;
      li.classList.toggle("is-now", es);
      if (es) actual = li;
    });
    if (!actual) { marker.hidden = true; return; }
    var dot = $(".year__dot", actual);
    var r = dot.getBoundingClientRect(), t = track.getBoundingClientRect();
    marker.style.left = (r.left - t.left + r.width / 2).toFixed(1) + "px";
    $("span", marker).textContent = "Ahora";
    marker.hidden = false;
  }

  /* ------------------------------------------------------------------
     4. Tu perfil en el club (en «Cómo funciona»)
     ------------------------------------------------------------------ */

  /* La tarjeta «Ejemplo de perfil» (Lucía M., 3 cajas). Está en «Cómo
     funciona» y, en el celular, en «Mi perfil». Si en datos.js el regalo
     llega con otra cantidad de cajas, se rearma sola. */
  function applyClubCard() {
    if (GOAL === 5) return;
    var n = Math.min(3, GOAL - 1), falta = GOAL - n, h = "";
    for (var i = 1; i <= GOAL; i++) {
      h += '<span class="stamp' + (i <= n ? " on" : "") + (i === GOAL ? " gift" : "") + '"><span>' + i + "</span></span>";
    }
    $$("[data-club-card]").forEach(function (card) {
      var st = $("[data-stamps]", card);
      st.innerHTML = h;
      st.style.gridTemplateColumns = "repeat(" + GOAL + ", minmax(0, 1fr))";
      $(".meter", card).style.setProperty("--p", String(Math.round(n / GOAL * 100)));
      $("[data-cnt]", card).textContent = n + " de " + GOAL + " cajas";
      $("[data-left]", card).textContent = "Te " + (falta === 1 ? "falta 1" : "faltan " + falta) + " para el regalo";
    });
  }

  /* ------------------------------------------------------------------
     5. Preferencias, medidor y perfil guardado en el dispositivo
     ------------------------------------------------------------------ */

  var pagePrefs = [];

  function chips(el, set, prefix, onChange) {
    if (!el) return;
    el.innerHTML = PREFS.map(function (p) {
      return '<span class="chip"><input type="checkbox" id="' + prefix + "-" + p.id + '"' + (set.indexOf(p.id) > -1 ? " checked" : "") +
        '><label for="' + prefix + "-" + p.id + '">' + esc(p.l) + "</label></span>";
    }).join("");
    PREFS.forEach(function (p) {
      var inp = $("#" + prefix + "-" + p.id);
      if (!inp) return;
      inp.addEventListener("change", function () {
        var i = set.indexOf(p.id);
        if (inp.checked && i < 0) set.push(p.id);
        if (!inp.checked && i > -1) set.splice(i, 1);
        if (onChange) onChange();
      });
    });
  }
  function prefNombres(ids) {
    return PREFS.filter(function (p) { return ids.indexOf(p.id) > -1; }).map(function (p) { return p.l; }).join(", ");
  }
  function prefLabels(ids) {
    return PREFS.filter(function (p) { return ids.indexOf(p.id) > -1; }).map(function (p) { return p.l.toLowerCase(); });
  }

  function renderMeter(el, count, animate) {
    if (!el) return;
    var c = Math.min(count, GOAL), st = $(".stamps", el), html = "";
    for (var i = 0; i < GOAL; i++) {
      html += '<div class="stamp' + (i === GOAL - 1 ? " gift" : "") + (i < c ? " on" : "") + '"><span>' + (i + 1) + "</span></div>";
    }
    st.style.gridTemplateColumns = "repeat(" + GOAL + ", minmax(0, 1fr))";
    st.innerHTML = html;
    $(".cnt", el).textContent = c + " de " + GOAL + " cajas";
    $(".left", el).textContent = c >= GOAL ? "¡Regalo desbloqueado!" : "Te falta" + (GOAL - c > 1 ? "n " : " ") + (GOAL - c) + " para el regalo";
    var set = function () { el.style.setProperty("--p", String(c / GOAL * 100)); };
    if (animate) { el.style.setProperty("--p", "0"); requestAnimationFrame(function () { requestAnimationFrame(set); }); }
    else set();
  }

  var KEY = "twl_perfil";
  var user = store.get(KEY) || session.get("twl_demo");
  if (user && !Array.isArray(user.history)) user = null;

  function save() {
    if (!user) return;
    if (user.demo) session.set("twl_demo", user);
    else store.set(KEY, user);
  }
  function demoUser() {
    return {
      demo: true, name: "Lucía", tel: "", email: "lucia@ejemplo.com", since: "julio", prefs: PREFS.length > 1 ? [PREFS[1].id] : [],
      zona: ZONAS[0] || "", dir: "", loc: "", bg: "biblioteca", photo: null,
      history: [
        { m: "Julio", c: "Caja Reserva", price: 70000, mensual: true },
        { m: "Agosto", c: "Caja Clásica", price: 55000, mensual: true },
        { m: "Agosto", c: "Combo Origen", price: 18500, mensual: false },
        { m: "Septiembre", c: "Caja Reserva", price: 70000, mensual: true },
        { m: "Septiembre", c: "Combo Autor", price: 25000, mensual: false }
      ]
    };
  }
  /* Con planilla, solo suman las cajas que el club marcó como pagadas */
  function countMensual(u) { return u.history.reduce(function (a, h) { return a + (h.mensual !== false && h.pagado !== false ? (h.n || 1) : 0); }, 0); }

  /* Trae de la planilla los pedidos del socio. Los que se mandaron hace
     poco y todavía no aparecen ahí quedan como «a confirmar». */
  var syncAt = 0;
  function sync(force) {
    if (!hayPlanilla || !user || user.demo || !telKey(user.tel)) return;
    if (!force && Date.now() - syncAt < 15000) return;
    syncAt = Date.now();
    var quien = user;
    planillaLeer(quien.tel, function (d) {
      if (!d || user !== quien) return;
      var ids = {};
      var hist = d.pedidos.map(function (h) { ids[h.id] = 1; return { m: h.m, c: h.c, price: h.price, mensual: h.mensual, n: h.n, pagado: h.pagado, id: h.id }; });
      var recien = quien.history.filter(function (h) { return h.id && !ids[h.id] && h.pagado === false && Date.now() - (h.t || 0) < 3 * 864e5; });
      quien.history = hist.concat(recien);
      if (d.socio && d.socio.zona && !quien.zona) quien.zona = d.socio.zona;
      save();
      safe(paintPerfilRapido, "acceso rápido al perfil");
      if (current === "perfil") renderPerfil(false);
    });
  }
  function inicial(n) { return ((str(n) || "?").charAt(0) || "?").toUpperCase(); }
  function avatarInto(el, u, name) {
    if (!el) return;
    el.textContent = "";
    if (u && u.photo) {
      var img = doc.createElement("img");
      img.src = u.photo; img.alt = "";
      el.appendChild(img);
    } else {
      el.textContent = inicial(name || (u && u.name));
    }
  }

  function refreshNav() {
    var login = $("#btnLogin"), av = $("#btnAvatar");
    if (login) login.hidden = !!user;
    if (av) { av.hidden = !user; if (user) avatarInto(av, user); }
    var cta = $("#clubCta");
    if (cta) cta.textContent = user ? "Ver mi perfil" : "Crear mi perfil";
    safe(paintPerfilRapido, "acceso rápido al perfil");
  }

  /* Tarjeta «Tu perfil» arriba de los combos (solo en el celular):
     sin perfil invita a crearlo; con perfil muestra sus cajas */
  var ICONO_PERFIL = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.8"></circle><path d="M4.8 20c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6"></path></svg>';
  function paintPerfilRapido() {
    var box = $("#perfil-rapido");
    if (!box) return;
    var av = $("[data-prapido-av]", box), ey = $("[data-prapido-eyebrow]", box), ti = $("[data-prapido-titulo]", box),
      sub = $("[data-prapido-sub]", box), st = $("[data-prapido-stamps]", box), go2 = $("[data-prapido-go]", box);
    if (user) {
      var c = Math.min(countMensual(user), GOAL), falta = GOAL - c, h = "";
      avatarInto(av, user);
      av.classList.add("is-user");
      ey.textContent = user.demo ? "Perfil de ejemplo" : "Tu perfil";
      ti.textContent = "Hola, " + user.name;
      sub.textContent = c >= GOAL ? "¡Tu regalo viaja con la próxima caja!"
        : c + " de " + GOAL + " cajas · te " + (falta === 1 ? "falta 1" : "faltan " + falta) + " para el regalo";
      for (var i = 1; i <= GOAL; i++) h += '<i class="' + (i <= c ? "on" : "") + (i === GOAL ? " gift" : "") + '"></i>';
      st.innerHTML = h;
      st.hidden = false;
      go2.textContent = "Ver";
    } else {
      av.innerHTML = ICONO_PERFIL;
      av.classList.remove("is-user");
      ey.textContent = "Tu perfil en el club";
      ti.textContent = "Creá tu perfil";
      sub.textContent = "Cada caja del mes suma para tu regalo sorpresa.";
      st.hidden = true;
      go2.textContent = "Entrar";
    }
  }

  function fondoPicker(el, name, cur, onPick) {
    if (!el) return;
    el.innerHTML = FONDOS.map(function (f) {
      return '<label><input type="radio" name="' + name + '" value="' + f.id + '"' + (cur === f.id ? " checked" : "") +
        '><span class="sw bg-' + f.id + '"></span><small>' + f.l + "</small></label>";
    }).join("");
    $$("input", el).forEach(function (i) { i.addEventListener("change", function () { onPick(i.value); }); });
  }

  function readPhoto(input, cb) {
    var f = input.files && input.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      var im = new Image();
      im.onload = function () {
        var S = 240, c = doc.createElement("canvas"), k = Math.min(im.width, im.height);
        c.width = c.height = S;
        c.getContext("2d").drawImage(im, (im.width - k) / 2, (im.height - k) / 2, k, k, 0, 0, S, S);
        cb(c.toDataURL("image/jpeg", 0.85));
      };
      im.src = r.result;
    };
    r.readAsDataURL(f);
  }

  var draft = { name: "", photo: null, bg: "loft", zona: ZONAS[0] || "", prefs: [] };
  var afterSignup = null;

  function paintPreview() {
    var cv = $("#pvCover");
    if (cv) cv.className = "cv bg-" + draft.bg;
    avatarInto($("#pvAvatar"), draft, draft.name);
    avatarInto($("#suAvatar"), draft, draft.name);
    var n = $("#pvName"); if (n) n.textContent = draft.name || "Tu nombre";
    var z = $("#pvZona"); if (z) z.textContent = draft.zona || "Paraná";
  }

  function initSignup() {
    var zona = $("#suZona");
    if (zona) {
      zona.innerHTML = ZONAS.map(function (z) { return "<option>" + esc(z) + "</option>"; }).join("");
      zona.addEventListener("change", function () { draft.zona = zona.value; paintPreview(); });
    }
    fondoPicker($("#suBgs"), "subg", draft.bg, function (v) { draft.bg = v; paintPreview(); });
    chips($("#suPrefs"), draft.prefs, "sp");
    var nm = $("#suName");
    if (nm) nm.addEventListener("input", function () { draft.name = nm.value; paintPreview(); });
    var ph = $("#suPhoto");
    if (ph) ph.addEventListener("change", function () { readPhoto(ph, function (d) { draft.photo = d; paintPreview(); }); });

    var form = $("#suForm");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = str($("#suName").value), tel = str($("#suTel").value), email = str($("#suEmail").value), err = $("#suErr");
      if (!name) { err.textContent = "Escribí tu nombre."; return; }
      if (hayPlanilla && !telKey(tel)) { err.textContent = "Escribí tu WhatsApp con la característica (por ejemplo 343 4123456): con él entrás desde cualquier celular."; return; }
      if (email && !/^\S+@\S+\.\S+$/.test(email)) { err.textContent = "Revisá el email, parece incompleto."; return; }
      if (!$("#suAge").checked) { err.textContent = "Para crear tu perfil, confirmá que sos mayor de 18 años."; return; }
      err.textContent = "";
      loggedIn({
        name: name, tel: tel, email: email, since: MES, prefs: draft.prefs.slice(), zona: draft.zona,
        dir: "", loc: "", bg: draft.bg, photo: draft.photo, history: []
      }, "Bienvenido/a al loft, " + name + ".");
      avisar("Perfil nuevo: " + name, {
        "Nombre": name, "WhatsApp": tel, "email": email, "Zona": draft.zona,
        "No quiere recibir": prefNombres(draft.prefs) || "nada (sin restricciones)",
        "Fecha": ahora()
      });
      planillaEnviar({ accion: "perfil", tel: tel, nombre: name, email: email, zona: draft.zona, prefs: prefNombres(draft.prefs) || "" });
      sync(true);
    });
    var sl = $("#suLogin");
    if (sl) sl.addEventListener("click", function () { openLogin(); });
    var demo = $("#suDemo");
    if (demo) demo.addEventListener("click", function () { loggedIn(demoUser(), "Entraste con el perfil de ejemplo."); });
    $$("[data-demo]").forEach(function (b) {
      b.addEventListener("click", function () { loggedIn(demoUser(), "Entraste con el perfil de ejemplo."); });
    });
    /* Si los avisos están activos, el cliente lo sabe antes de crear su perfil */
    var dev = $(".su-device");
    if (dev && hayPlanilla) dev.textContent = "Tu perfil queda guardado en este celular o computadora y en el club: si cambiás de celular, entrás con tu WhatsApp. No hace falta contraseña.";
    else if (dev && hayAvisos) dev.textContent = str(dev.textContent) + " Tus datos nos llegan a nosotros, solo para coordinar tus cajas.";
    paintPreview();
  }

  function openSignup(cb, msg) {
    afterSignup = cb || null;
    var m = $("#suMsg");
    if (m) { m.hidden = !msg; m.textContent = msg || ""; }
    go("perfil", true);
  }

  function loggedIn(u, msg) {
    user = u;
    if (!u.demo) session.del("twl_demo");
    var ok = true;
    if (u.demo) session.set("twl_demo", u); else ok = store.set(KEY, u);
    pagePrefs.length = 0;
    u.prefs.forEach(function (p) { pagePrefs.push(p); });
    refreshNav();
    closeLogin(true);
    toast(ok ? msg : "Tu navegador no deja guardar datos: el perfil dura hasta que cierres la página.");
    var m = $("#suMsg"); if (m) m.hidden = true;
    go("perfil", true);
    if (afterSignup) { var f = afterSignup; afterSignup = null; setTimeout(f, 500); }
  }

  function renderDash(animate) {
    if (!user) return;
    $("#dCover").className = "cover bg-" + (user.bg || "noche");
    avatarInto($("#dAvatar"), user);
    $("#dName").textContent = user.name + ".";
    $("#dSince").textContent = "Socio/a desde " + user.since + (user.zona ? " · " + user.zona : "");
    $("#demoNote").hidden = !user.demo;
    $("#logout").textContent = user.demo ? "Salir del ejemplo" : "Cerrar sesión";
    var c = countMensual(user);
    var duos = user.history.reduce(function (a, h) { return a + (h.mensual === false ? (h.n || 1) : 0); }, 0);
    $("#stCajas").textContent = c;
    $("#stDuos").textContent = duos;
    $("#pNote").textContent = c >= GOAL ? "Tu regalo viaja con la próxima caja." : c === GOAL - 1 ? "La próxima caja trae regalo." :
      hayPlanilla && !user.demo ? "Cada caja del mes suma una marca cuando confirmamos el pago." : "Cada caja del mes suma una marca.";
    var pm = $("#pMeter");
    if (animate) { renderMeter(pm, 0, false); setTimeout(function () { renderMeter(pm, c, true); }, 400); }
    else renderMeter(pm, c, false);
    $("#pNext").innerHTML =
      "<div><span>Caja</span><b>" + esc(cap(MES)) + "</b></div>" +
      "<div><span>Reservas</span><b>" + (estado.tipo === "abierto" && !estado.sinFecha ? esc(estado.texto.replace("Reservas ", "")) : esc(RESERVAS + " de " + estado.prox)) + "</b></div>" +
      "<div><span>Entrega</span><b>" + esc(ENTREGAS) + "</b></div>" +
      "<div><span>Zona</span><b>" + esc(user.zona || "A completar") + "</b></div>";
    var pset = user.prefs;
    chips($("#profilePrefs"), pset, "pf", function () {
      save();
      pagePrefs.length = 0; pset.forEach(function (p) { pagePrefs.push(p); });
      $("#prefSaved").textContent = "Guardado. Lo tenemos en cuenta desde la próxima caja.";
      avisarPrefs();
    });
    $("#prefSaved").textContent = "";
    $("#pHist").innerHTML = user.history.length
      ? user.history.slice().reverse().map(function (h) {
        return "<tr><td>" + esc(h.m) + "</td><td>" + esc(h.c) + '<span class="pill">' + (h.pagado === false ? "a confirmar" : h.mensual === false ? "dúo" : "suma") +
          "</span></td><td>" + (h.price ? money(h.price) : "—") + "</td></tr>";
      }).join("")
      : '<tr><td colspan="3">Todavía no hiciste pedidos. Tu primera caja ya suma.</td></tr>';
    avatarInto($("#edAvatar"), user);
    fondoPicker($("#edBgs"), "edbg", user.bg, function (v) {
      user.bg = v; save();
      $("#dCover").className = "cover bg-" + v;
      $("#edSaved").textContent = "Fondo actualizado.";
    });
  }

  /* Cambio de «No quiero recibir» en el perfil: un solo aviso aunque
     marque y desmarque varias veces seguidas */
  var prefsTimer = null;
  function avisarPrefs() {
    if (!user || user.demo || (!hayAvisos && !hayPlanilla)) return;
    clearTimeout(prefsTimer);
    prefsTimer = setTimeout(function () {
      if (!user || user.demo) return;
      avisar("Cambió lo que no quiere recibir: " + user.name, {
        "Nombre": user.name, "WhatsApp": user.tel, "email": user.email, "Zona": user.zona,
        "No quiere recibir": prefNombres(user.prefs) || "nada (sin restricciones)",
        "Fecha": ahora()
      });
      planillaEnviar({ accion: "perfil", tel: user.tel, nombre: user.name, zona: user.zona, prefs: prefNombres(user.prefs) || "" });
    }, 4000);
  }

  function renderPerfil(animate) {
    $("#signup").hidden = !!user;
    $("#dash").hidden = !user;
    if (user) renderDash(animate); else paintPreview();
    if (animate) sync();
  }

  function initDash() {
    var edit = $("#editBtn");
    if (edit) edit.addEventListener("click", function () {
      var ed = $("#editor");
      ed.hidden = !ed.hidden;
      edit.textContent = ed.hidden ? "Editar perfil" : "Listo";
      $("#edSaved").textContent = "";
    });
    var ph = $("#edPhoto");
    if (ph) ph.addEventListener("change", function () {
      readPhoto(ph, function (d) {
        user.photo = d; save();
        avatarInto($("#dAvatar"), user); avatarInto($("#edAvatar"), user); refreshNav();
        $("#edSaved").textContent = "Foto actualizada.";
      });
    });
    var armado = 0;
    function salir() {
      var lo = $("#logout");
      /* Confirmación en dos toques (sin ventanas del navegador) */
      if (user && !user.demo && Date.now() - armado > 5000) {
        armado = Date.now();
        lo.textContent = "Tocá de nuevo para borrar tu perfil";
        toast("Tu perfil se borra de este dispositivo. Tocá «Cerrar sesión» de nuevo para confirmar.");
        setTimeout(function () { if (user && !user.demo) lo.textContent = "Cerrar sesión"; }, 5000);
        return;
      }
      armado = 0;
      var eraDemo = user && user.demo;
      user = null;
      store.del(KEY); session.del("twl_demo");
      pagePrefs.length = 0;
      refreshNav();
      $("#editor").hidden = true; $("#editBtn").textContent = "Editar perfil";
      go("inicio", true);
      toast(eraDemo ? "Saliste del perfil de ejemplo." : "Cerraste sesión.");
    }
    var lo = $("#logout"); if (lo) lo.addEventListener("click", salir);
    var de = $("#demoExit"); if (de) de.addEventListener("click", salir);
    var av = $("#btnAvatar"); if (av) av.addEventListener("click", function () { go("perfil", true); });
  }

  /* ------------------------------------------------------------------
     6. Ingresar (modal) y capas
     ------------------------------------------------------------------ */

  var lastFocus = null;
  function show(el) {
    lastFocus = doc.activeElement;
    el.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("show"); }); });
  }
  function hide(el, cb) {
    el.classList.remove("show");
    setTimeout(function () {
      el.hidden = true;
      if (cb) cb();
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* nada */ } }
    }, 450);
  }
  function scrimOn() {
    var s = $("#scrim");
    s.hidden = false;
    requestAnimationFrame(function () { s.classList.add("show"); });
  }
  function scrimOff() {
    var s = $("#scrim");
    s.classList.remove("show");
    setTimeout(function () { if (!s.classList.contains("show")) s.hidden = true; }, 350);
  }

  function openLogin() {
    scrimOn();
    show($("#loginModal"));
    setTimeout(function () { var b = $("#lgCreate"); if (b) b.focus(); }, 120);
  }
  function closeLogin(quick) {
    var m = $("#loginModal");
    if (!m || m.hidden) return;
    if (quick) { m.classList.remove("show"); m.hidden = true; }
    else hide(m);
    if ($("#drawer").hidden) scrimOff();
  }

  function initLogin() {
    var b = $("#btnLogin");
    if (b) b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); openLogin(); });
    $("#loginModal [data-close]").addEventListener("click", function () { closeLogin(); });
    $("#lgCreate").addEventListener("click", function () { closeLogin(true); openSignup(); });
    $("#lgDemo").addEventListener("click", function () { loggedIn(demoUser(), "Entraste con el perfil de ejemplo."); });
    /* Con planilla, el perfil se recupera en cualquier celular con el WhatsApp */
    var tf = $("#lgTelForm");
    if (tf && hayPlanilla) {
      tf.hidden = false;
      $("#lgSwitch").hidden = true;
      var sub = $("#loginModal .sub");
      if (sub) sub.textContent = "Si ya creaste tu perfil, entrá con el WhatsApp que usaste. Si es tu primera vez, creá uno: no hace falta contraseña.";
      tf.addEventListener("submit", function (e) {
        e.preventDefault();
        var tel = str($("#lgTel").value), er = $("#lgErr"), bt = $("#lgEnter");
        if (!telKey(tel)) { er.textContent = "Escribí tu WhatsApp con la característica, por ejemplo 343 4123456."; return; }
        er.textContent = ""; bt.disabled = true; bt.textContent = "Buscando tu perfil…";
        planillaLeer(tel, function (d) {
          bt.disabled = false; bt.textContent = "Entrar con mi WhatsApp";
          if (!d) { er.textContent = "No pudimos conectarnos. Probá de nuevo en un rato."; return; }
          if (!d.socio) { er.textContent = "No encontramos un perfil con ese número. Revisalo o creá tu perfil."; return; }
          var nombres = str(d.socio.prefs).split(/,\s*/);
          var prefs = PREFS.filter(function (p) { return nombres.indexOf(p.l) !== -1; }).map(function (p) { return p.id; });
          loggedIn({
            name: d.socio.name, tel: tel, email: "", since: MES, prefs: prefs, zona: d.socio.zona || ZONAS[0] || "",
            dir: "", loc: "", bg: "loft", photo: null,
            history: d.pedidos.map(function (h) { return { m: h.m, c: h.c, price: h.price, mensual: h.mensual, n: h.n, pagado: h.pagado, id: h.id }; })
          }, "Hola de nuevo, " + d.socio.name + ".");
          $("#lgTel").value = "";
        });
      });
    }
    $("#scrim").addEventListener("click", function () {
      if (!$("#loginModal").hidden) closeLogin(); else closeOrder();
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var mn = $("#mnav");
      if (mn && mn.open) { mn.open = false; return; }
      if (!$("#loginModal").hidden) closeLogin();
      else if (!$("#drawer").hidden) closeOrder();
    });
  }

  /* ------------------------------------------------------------------
     7. El pedido paso a paso
     ------------------------------------------------------------------ */

  var order = { combo: "", cant: 1, prefs: [], zona: "", loc: "", dir: "", nom: "", tel: "", age: false,
    charcuteria: false, cristaleria: false, regalo: false, incluye: "charcuteria", gNom: "", gLoc: "", gDir: "" };
  var step = 0, steps = [];

  /* El pedido puede tener varios combos: los ya agregados quedan en
     «cart» y el que se está armando es «order». */
  var MAXCANT = 10;
  var ITEM = ["combo", "cant", "prefs", "zona", "loc", "dir", "charcuteria", "cristaleria", "regalo", "incluye", "gNom", "gLoc", "gDir"];
  var cart = [];
  function copiaItem(o) {
    var it = {};
    ITEM.forEach(function (k) { it[k] = k === "prefs" ? (o.prefs || []).slice() : o[k]; });
    return it;
  }
  function todos() { return cart.concat([order]); }
  /* Otro combo: se vuelven a hacer todas las preguntas. Los datos de
     envío quedan escritos para no tener que cargarlos de nuevo. */
  function itemNuevo() {
    order.cant = 1;
    order.prefs = pagePrefs.slice();
    order.charcuteria = order.cristaleria = order.regalo = false;
    order.incluye = "charcuteria";
    order.gNom = order.gLoc = order.gDir = "";
  }
  function unidades(items, tipo) {
    return items.reduce(function (a, it) { return a + (!tipo || combo(it.combo).tipo === tipo ? (it.cant || 1) : 0); }, 0);
  }

  function openOrder(id, startAt, opts) {
    var elegido = aLaVenta(id);
    if (!elegido) { toast("Por ahora no hay combos a la venta."); return; }
    order.combo = elegido.id;
    if (opts && opts.regalo) order.regalo = true;
    order.prefs = pagePrefs.slice();
    if (user) {
      order.nom = order.nom || (user.demo ? "" : user.name);
      order.tel = order.tel || user.tel || "";
      order.zona = order.zona || user.zona || "";
      order.dir = order.dir || user.dir || "";
      order.loc = order.loc || user.loc || "";
    }
    step = startAt || 0;
    buildSteps();
    renderStep();
    scrimOn();
    show($("#drawer"));
    doc.body.style.overflow = "hidden";
    setTimeout(function () { var x = $("#drawer [data-close]"); if (x) x.focus(); }, 150);
  }
  function closeOrder() {
    var d = $("#drawer");
    if (!d || d.hidden) return;
    hide(d);
    scrimOff();
    doc.body.style.overflow = "";
  }

  function buildSteps() {
    var m = combo(order.combo).tipo === "caja";
    steps = m ? ["combo", "prefs", "envio", "extras", "resumen"] : ["combo", "envio", "extras", "resumen"];
    if (step >= steps.length) step = steps.length - 1;
  }
  function paintProgress(all) {
    $("#pSteps").innerHTML = steps.map(function (_, i) { return '<i class="' + (all || i <= step ? "on" : "") + '"></i>'; }).join("");
  }
  function cerradoPara(c) { return c.tipo === "caja" && estado.tipo !== "abierto"; }

  function renderStep(keepScroll) {
    buildSteps();
    paintProgress(false);
    var s = steps[step], c = combo(order.combo), body = $("#dBody"), foot = $("#dFoot");
    var scrollAntes = body.scrollTop;
    $("#dTitle").textContent = { combo: "Elegí tu combo", prefs: "Tus sorpresas", envio: order.regalo ? "Tus datos" : "¿Dónde te la llevamos?", extras: "¿Querés sumar algo?", resumen: "Revisá tu pedido" }[s];
    var back = step > 0 || cart.length ? '<button type="button" class="btn btn--line" id="back">' + (step === 0 ? "Volver al pedido" : "Volver") + "</button>" : "<span></span>";

    if (s === "combo") {
      var opt = function (x) {
        return '<div class="opt"><input type="radio" name="combo" id="o-' + x.id + '" value="' + x.id + '"' + (order.combo === x.id ? " checked" : "") + (x.agotado ? " disabled" : "") +
          '><label for="o-' + x.id + '"><span><b>' + esc(x.nombre) + (x.agotado ? '<span class="opt__tag">Sold out</span>' : "") + "</b><small>" + x.botellas + " vinos" +
          (x.tipo === "caja" ? " · entrega del " + esc(ENTREGAS) : " · cualquier día del mes") + '</small></span><span class="pr">' + money(x.precio) + "</span></label></div>";
      };
      body.innerHTML = '<div class="pane"><p>La caja de ' + esc(MES) + " trae dos tintos anunciados y dos sorpresas. Los dúos van por fuera del club: se piden cualquier día del mes.</p>" +
        (CAJAS.length ? '<div class="opt-group">Cajas del mes</div>' + CAJAS.map(opt).join("") : "") +
        (DUOS.length ? '<div class="opt-group">Dúos de todos los días</div>' + DUOS.map(opt).join("") : "") + "</div>";
      $$("input[name=combo]", body).forEach(function (r) {
        r.addEventListener("change", function () { order.combo = r.value; buildSteps(); paintProgress(false); });
      });
      foot.innerHTML = back + '<button type="button" class="btn" id="next">Seguir</button>';
    }

    if (s === "prefs") {
      body.innerHTML = '<div class="pane"><h4>' + esc(c.nombre) + "</h4><p>Estos dos ya los conocés:</p>" +
        '<div class="mini-wines">' + c.vinos.map(function (x) {
          return "<div><b>" + esc(x.nombre) + "</b><span>" + esc(str(x.varietal)) + "</span></div>";
        }).join("") +
        (c.botellas > c.vinos.length ? "<div><b>" + (c.botellas - c.vinos.length) + " sorpresas</b><span>elegidas por nosotros</span></div>" : "") + "</div>" +
        (PREFS.length ? '<h4 style="font-size:1.3rem">¿Hay algo que no quieras recibir?</h4><p style="margin-bottom:0">Marcalo y lo dejamos afuera de tus sorpresas.</p><div class="chips" id="orderPrefs"></div>' : "") +
        (user ? '<label class="check" style="margin-top:1.25rem"><input type="checkbox" id="savePrefs" checked> Guardar en mi perfil para los próximos meses</label>'
          : '<p class="note">Con un perfil, tus preferencias quedan guardadas y tus cajas suman para el regalo.</p>') + "</div>";
      chips($("#orderPrefs"), order.prefs, "op");
      foot.innerHTML = back + '<button type="button" class="btn" id="next">Seguir</button>';
    }

    if (s === "envio") {
      body.innerHTML = '<div class="pane"><p>' + format(filled(TX.envioTexto) ? TX.envioTexto : "Enviamos a Paraná, alrededores y el interior de Entre Ríos.") + "</p>" +
        (order.regalo ? '<p class="note" style="margin-top:0">Acá van tus datos. La dirección de quien recibe el regalo la cargás en el paso siguiente.</p>' : "") +
        '<div class="field"><label for="eZona">Zona</label><select id="eZona"><option value="">Elegí tu zona</option>' +
        ZONAS.map(function (z) { return "<option" + (order.zona === z ? " selected" : "") + ">" + esc(z) + "</option>"; }).join("") + "</select></div>" +
        '<div class="row2"><div class="field"><label for="eLoc">Localidad</label><input id="eLoc" value="' + esc(order.loc) + '" placeholder="Ej.: Oro Verde"></div>' +
        '<div class="field"><label for="eDir">Dirección</label><input id="eDir" value="' + esc(order.dir) + '" placeholder="Calle y número" autocomplete="street-address"></div></div>' +
        '<div class="row2"><div class="field"><label for="eNom">Nombre y apellido</label><input id="eNom" value="' + esc(order.nom) + '" autocomplete="name"></div>' +
        '<div class="field"><label for="eTel">WhatsApp</label><input id="eTel" value="' + esc(order.tel) + '" inputmode="tel" placeholder="343 ..." autocomplete="tel"></div></div>' +
        '<label class="check"><input type="checkbox" id="eAge"' + (order.age ? " checked" : "") + "> Declaro ser mayor de 18 años.</label>" +
        '<p class="err" id="eErr" aria-live="polite"></p></div>';
      var z = $("#eZona"), loc = $("#eLoc");
      if (!order.loc && order.zona === ZONAS[0]) loc.value = ZONAS[0];
      z.addEventListener("change", function () { if (z.value === ZONAS[0] && !loc.value) loc.value = ZONAS[0]; });
      foot.innerHTML = back + '<button type="button" class="btn" id="next">Seguir</button>';
    }

    if (s === "extras") {
      var chk = function (x, est) {
        return '<div class="opt opt--check"><input type="checkbox" id="x-' + x.id + '"' + (order[x.id] || est ? " checked" : "") + (est ? " disabled" : "") +
          '><label for="x-' + x.id + '"><span><b>' + esc(x.nombre) + "</b><small>" +
          esc(x.detalle + (est === "incl" ? " · incluida en el regalo" : est === "cobra" ? " · va en el regalo, se suma aparte" : "")) + "</small></span>" +
          '<span class="pr' + (est === "incl" ? ' pr--incl">incluida' : (est ? ' pr--incl">' : '">') + esc(precioAdic(x))) + "</span></label></div>";
      };
      var incluida = estadoAdic;
      var g = ADIC.regalo;
      body.innerHTML = '<div class="pane"><p>Opcionales para sumar a tu pedido. Si no querés nada, seguí.</p>' +
        '<div class="opt-group">Para acompañar</div>' +
        '<div data-x-list>' + chk(ADIC.charcuteria, incluida("charcuteria")) + chk(ADIC.cristaleria, incluida("cristaleria")) + "</div>" +
        '<div class="opt-group">¿Es para regalar?</div>' +
        '<div class="opt opt--check"><input type="checkbox" id="x-regalo"' + (order.regalo ? " checked" : "") + '><label for="x-regalo"><span><b>' + esc(g.nombre) + "</b><small>" + esc(g.detalle) + '</small></span><span class="pr">' + esc(precioAdic(g)) + "</span></label></div>" +
        '<div class="gift-box" id="giftBox"' + (order.regalo ? "" : " hidden") + ">" +
        '<p class="opt-group">¿Qué incluimos en el regalo?</p>' +
        '<div class="chips">' +
        '<span class="chip"><input type="radio" name="incluye" id="inc-charcuteria" value="charcuteria"' + (order.incluye === "charcuteria" ? " checked" : "") + '><label for="inc-charcuteria">' + esc(ADIC.charcuteria.nombre) + " (" + esc(ADIC.charcuteria.detalle.toLowerCase()) + ")</label></span>" +
        '<span class="chip"><input type="radio" name="incluye" id="inc-cristaleria" value="cristaleria"' + (order.incluye === "cristaleria" ? " checked" : "") + '><label for="inc-cristaleria">' + esc(ADIC.cristaleria.nombre) + " (" + esc(ADIC.cristaleria.detalle.toLowerCase()) + ")</label></span>" +
        '<span class="chip"><input type="radio" name="incluye" id="inc-ambas" value="ambas"' + (order.incluye === "ambas" ? " checked" : "") + '><label for="inc-ambas">Las dos</label></span>' +
        "</div>" +
        '<p class="note" style="margin:-0.4rem 0 1rem">Uno va incluido en el precio del regalo. Si elegís los dos, el segundo se suma como adicional' +
        (ADIC.charcuteria.precio && ADIC.cristaleria.precio ? " (" + esc(precioAdic(ADIC[cobradaEnAmbas()]).replace("+ ", "")) + ")" : "") + ".</p>" +
        '<div class="field"><label for="gNom">¿Para quién es?</label><input id="gNom" value="' + esc(order.gNom) + '" placeholder="Nombre de quien lo recibe"></div>' +
        '<div class="row2"><div class="field"><label for="gLoc">Localidad</label><input id="gLoc" value="' + esc(order.gLoc) + '" placeholder="Ej.: Paraná"></div>' +
        '<div class="field"><label for="gDir">Dirección del regalo</label><input id="gDir" value="' + esc(order.gDir) + '" placeholder="Calle y número"></div></div>' +
        '<p class="note">Lo enviamos a esta dirección con una carta de feliz cumpleaños' + (c.tipo === "caja" ? ", del " + esc(ENTREGAS) : "") + ".</p></div>" +
        '<p class="err" id="xErr" aria-live="polite"></p></div>';
      var pintar = function () {
        ["charcuteria", "cristaleria"].forEach(function (k) {
          var wrap = $("#x-" + k).parentNode;
          var tmp = doc.createElement("div");
          tmp.innerHTML = chk(ADIC[k], incluida(k));
          wrap.parentNode.replaceChild(tmp.firstChild, wrap);
          $("#x-" + k).addEventListener("change", function (e) { order[k] = e.target.checked; });
        });
      };
      ["charcuteria", "cristaleria"].forEach(function (k) {
        $("#x-" + k).addEventListener("change", function (e) { order[k] = e.target.checked; });
      });
      $("#x-regalo").addEventListener("change", function (e) {
        order.regalo = e.target.checked;
        $("#giftBox").hidden = !order.regalo;
        pintar();
      });
      $$("input[name=incluye]", body).forEach(function (r) {
        r.addEventListener("change", function () { order.incluye = r.value; pintar(); });
      });
      foot.innerHTML = back + '<button type="button" class="btn" id="next">Ver resumen</button>';
    }

    if (s === "resumen") {
      var mensual = c.tipo === "caja";
      var pr = prefLabels(order.prefs);
      var items = todos(), varios = cart.length > 0 || order.cant > 1;
      var tp = cuentaPedido(), ci = cuenta(order);
      var cajasN = unidades(items, "caja");
      var algunaCerrada = items.some(function (it) { return cerradoPara(combo(it.combo)); });
      body.innerHTML = '<div class="pane">' +
        (cart.length ? '<div class="cart"><p class="opt-group">Ya en tu pedido</p>' + cart.map(function (it, i) {
          return '<div class="cart__row"><span><b>' + esc(combo(it.combo).nombre) + (it.cant > 1 ? " × " + it.cant : "") + "</b><small>" + esc(resumenCorto(it)) + "</small></span>" +
            '<span class="cart__pr">' + money(cuenta(it).total) + '</span><button type="button" class="linkish" data-quitar="' + i + '">Quitar</button></div>';
        }).join("") + "</div>" : "") +
        '<div class="summary"><div>' +
        '<p class="eyebrow">' + (cart.length ? "Combo " + (cart.length + 1) + " · " : "") + (mensual ? "Caja de " : "Dúo de ") + esc(MES) + "</p>" +
        "<dl><dt>Combo</dt><dd>" + esc(c.nombre) + " · " + c.botellas + " vinos</dd>" +
        (mensual ? "<dt>Sorpresas</dt><dd>" + esc(pr.length ? pr.join(", ") : "sin restricciones") + "</dd><dt>Pago</dt><dd>" + esc(PAGO) + "</dd><dt>Entrega</dt><dd>del " + esc(ENTREGAS) + "</dd>"
          : "<dt>Entrega</dt><dd>coordinamos por WhatsApp</dd>") +
        "<dt>Adicionales</dt><dd>" + esc(textoAdicionales()) + "</dd>" +
        (order.regalo ? "<dt>Para regalo</dt><dd>" + esc(textoRegalo()) + "</dd>" : "") +
        "<dt>" + (order.regalo ? "Tus datos" : "Envío a") + "</dt><dd>" + esc(order.dir + ", " + order.loc) + "</dd><dt>Costo de envío</dt><dd>te lo confirmamos</dd></dl>" +
        '<div class="qty"><span><b>¿Cuántas veces querés este combo?</b><small>Se repite igual, con sus adicionales' + (order.regalo ? " y el regalo" : "") + ".</small></span>" +
        '<span class="qty__ctl"><button type="button" id="qMenos" aria-label="Uno menos"' + (order.cant <= 1 ? " disabled" : "") + ">−</button>" +
        '<output id="qCant" aria-live="polite">' + order.cant + "</output>" +
        '<button type="button" id="qMas" aria-label="Uno más"' + (order.cant >= MAXCANT ? " disabled" : "") + ">+</button></span></div>" +
        (varios ? '<div class="tot tot--sub"><span>Este combo' + (order.cant > 1 ? " × " + order.cant : "") + "</span><b>" + money(ci.total) + "</b></div>" : "") +
        '<div class="tot"><span>' + (varios ? "Total del pedido" : "Total") + (tp.aConfirmar ? " (sin lo que falta confirmar)" : "") + "</span><b>" + money(tp.total) + "</b></div></div></div>" +
        '<button type="button" class="btn btn--line btn--add" id="addMore">+ Agregar otro combo a la compra</button>' +
        (tp.aConfirmar ? '<p class="note">El precio de ' + esc(tp.aConfirmar) + " te lo confirmamos por WhatsApp.</p>" : "") +
        (algunaCerrada ? '<p class="note">Hoy las reservas de las cajas están cerradas: abren del ' + esc(RESERVAS) + " de " + esc(estado.prox) + "." +
          (modoPrueba ? " Mientras el sitio está en preparación podés seguir para ver el recorrido." : "") + "</p>" : "") +
        (user && cajasN && !(algunaCerrada && !modoPrueba) ? '<p class="hand" style="margin-top:1.25rem">' +
          (hayPlanilla && !user.demo ? (cajasN === 1 ? "Cuando confirmemos el pago, esta caja suma en tu perfil." : "Cuando confirmemos el pago, estas " + cajasN + " cajas suman en tu perfil.") :
          cajasN === 1 ? "Esta caja suma " + Math.min(countMensual(user) + 1, GOAL) + " de " + GOAL + " en tu perfil."
            : "Estas " + cajasN + " cajas suman: quedás en " + Math.min(countMensual(user) + cajasN, GOAL) + " de " + GOAL + " en tu perfil.") + "</p>" : "") +
        (!user && cajasN ? '<p class="note">¿Querés que ' + (cajasN === 1 ? "esta caja sume" : "estas cajas sumen") + ' para el regalo? <button type="button" class="linkish" id="loginHere">Creá tu perfil</button></p>' : "") +
        "</div>";
      var lh = $("#loginHere");
      if (lh) lh.addEventListener("click", function () { closeOrder(); openSignup(function () { openOrder(order.combo, steps.length - 1); }); });
      $("#qMenos").addEventListener("click", function () { if (order.cant > 1) { order.cant--; renderStep(true); } });
      $("#qMas").addEventListener("click", function () { if (order.cant < MAXCANT) { order.cant++; renderStep(true); } });
      $$("[data-quitar]", body).forEach(function (q) {
        q.addEventListener("click", function () { cart.splice(+q.getAttribute("data-quitar"), 1); renderStep(true); });
      });
      $("#addMore").addEventListener("click", function () {
        cart.push(copiaItem(order));
        itemNuevo();
        var sig = aLaVenta("");
        if (sig) order.combo = sig.id;
        step = 0;
        renderStep();
        toast("Combo agregado. Elegí el próximo.");
      });

      var accion = finalAction();
      var href = accion.tipo === "wa" ? waLink(mensajePedido())
        : accion.tipo === "avisame" ? waLink(MENSAJES("avisame", { proximoMes: estado.prox, combo: nombresDe(items), mes: MES }))
        : accion.tipo === "mp" ? c.linkPago : "";
      foot.innerHTML = back + (!accion.label
        ? '<span class="note">' + accion.nota + "</span>"
        : href
          ? '<a class="btn ' + accion.cls + '" id="pay" href="' + esc(href) + '" target="_blank" rel="noopener">' + accion.label + "</a>"
          : '<button type="button" class="btn ' + accion.cls + '" id="pay">' + accion.label + "</button>");
      var pay = $("#pay");
      /* El enlace abre WhatsApp o Mercado Pago en otra pestaña; acá solo
         se muestra el «¡Listo!». */
      if (pay) pay.addEventListener("click", function () { setTimeout(function () { finish(accion); }, 0); });
    }

    /* Con varios combos, cada paso recuerda en cuál vas */
    if (cart.length && s !== "resumen") {
      var pane = $(".pane", body);
      if (pane) pane.insertAdjacentHTML("afterbegin", '<p class="cart-bar"><b>Combo ' + (cart.length + 1) + " de tu pedido</b><span>Ya llevás " +
        unidades(cart) + (unidades(cart) === 1 ? " combo" : " combos") + " · " + money(cuentaPedidoDe(cart).total) + "</span></p>");
    }

    var b = $("#back");
    if (b) b.addEventListener("click", function () {
      if (step === 0 && cart.length) {
        /* Volver al combo anterior: sale del carrito y vuelve a su resumen */
        var prev = cart.pop();
        ITEM.forEach(function (k) { order[k] = prev[k]; });
        step = 99;
        renderStep();
        return;
      }
      collect(false); step--; renderStep();
    });
    var n = $("#next");
    if (n) n.addEventListener("click", function () { if (!collect(true)) return; step++; renderStep(); });
    body.scrollTop = keepScroll ? scrollAntes : 0;
  }

  /* Qué hace el último botón. Mientras no haya WhatsApp ni links de pago
     cargados, funciona como en el prototipo (modo prueba). El link de
     Mercado Pago tiene un precio fijo: se usa solo si el pedido es un
     combo, una vez y sin nada que se cobre aparte. */
  function finalAction() {
    if (modoPrueba) return { tipo: "prueba", label: "Pagar con Mercado Pago", cls: "mp" };
    var items = todos(), c = combo(order.combo);
    var todasCerradas = items.every(function (it) { return cerradoPara(combo(it.combo)); });
    if (todasCerradas) {
      if (hasWA) return { tipo: "avisame", label: "Avisame cuando abra", cls: "" };
      return { tipo: "nada", nota: "Las reservas abren del " + esc(RESERVAS) + " de " + esc(estado.prox) + "." };
    }
    var simple = items.length === 1 && order.cant === 1 && !order.regalo && !adicCobrados().length;
    if (simple && c.linkPago) return { tipo: "mp", label: "Pagar con Mercado Pago", cls: "mp" };
    if (hasWA) return { tipo: "wa", label: "Enviar pedido por WhatsApp", cls: "wa" };
    return { tipo: "nada", nota: simple ? "Escribinos para pedir este combo." : "Escribinos para armar este pedido." };
  }
  function nombresDe(items) {
    var n = [];
    items.forEach(function (it) { var x = combo(it.combo).nombre; if (n.indexOf(x) < 0) n.push(x); });
    return lista(n);
  }
  function lista(arr) { return arr.join(", ").replace(/, ([^,]*)$/, " y $1"); }

  /* Cómo queda cada adicional: "" = según lo que marcó, "incl" = va en el
     regalo sin costo, "cobra" = va en el regalo y se cobra aparte */
  function estadoAdic(k, it) {
    it = it || order;
    if (!it.regalo) return "";
    if (it.incluye === "ambas") return k === cobradaEnAmbas() ? "cobra" : "incl";
    return it.incluye === k ? "incl" : "";
  }
  /* Adicionales que se cobran (lo incluido en el regalo no se cobra aparte) */
  function adicCobrados(it) {
    it = it || order;
    return ["charcuteria", "cristaleria"].filter(function (k) {
      var e = estadoAdic(k, it);
      return e ? e === "cobra" : it[k];
    });
  }
  function textoAdic(x) { return x.nombre.toLowerCase() + " (" + x.detalle.toLowerCase() + ")"; }
  function textoAdicionales(it) {
    it = it || order;
    var l = adicCobrados(it).map(function (k) {
      return textoAdic(ADIC[k]) + (estadoAdic(k, it) === "cobra" ? ", el segundo del regalo" : "");
    });
    return l.length ? l.join(", ") : "ninguno";
  }
  function textoRegalo(it) {
    it = it || order;
    var con = it.incluye === "ambas"
      ? "y lleva " + textoAdic(ADIC.charcuteria) + " y " + textoAdic(ADIC.cristaleria) + " (uno incluido y el otro aparte)"
      : "e incluye " + textoAdic(ADIC[it.incluye] || ADIC.charcuteria);
    return "para " + it.gNom + ", en " + [it.gDir, it.gLoc].filter(Boolean).join(", ") + ". Va con carta de feliz cumpleaños " + con;
  }
  /* Lo que cuesta un combo del pedido (con sus adicionales y la cantidad) */
  function cuenta(it) {
    it = it || order;
    var c = combo(it.combo), u = c.precio, falta = [];
    adicCobrados(it).map(function (k) { return ADIC[k]; }).concat(it.regalo ? [ADIC.regalo] : []).forEach(function (x) {
      if (x.precio) u += x.precio; else falta.push(x.nombre.toLowerCase());
    });
    return { total: u * Math.max(1, it.cant || 1), falta: falta, aConfirmar: lista(falta) };
  }
  function cuentaPedidoDe(items) {
    var total = 0, falta = [];
    items.forEach(function (it) {
      var cu = cuenta(it);
      total += cu.total;
      cu.falta.forEach(function (f) { if (falta.indexOf(f) < 0) falta.push(f); });
    });
    return { total: total, aConfirmar: lista(falta) };
  }
  function cuentaPedido() { return cuentaPedidoDe(todos()); }
  function resumenCorto(it) {
    var c = combo(it.combo), pr = prefLabels(it.prefs);
    return [
      c.tipo === "caja" ? "sorpresas: " + (pr.length ? pr.join(", ").toLowerCase() : "sin restricciones") : "",
      adicCobrados(it).map(function (k) { return ADIC[k].nombre.toLowerCase(); }).join(" y "),
      it.regalo ? "para regalo a " + it.gNom : "a " + it.dir
    ].filter(Boolean).join(" · ");
  }

  function lineaItem(it, i) {
    var c = combo(it.combo), pr = prefLabels(it.prefs), cu = cuenta(it);
    return (i + 1) + ") " + c.nombre + (it.cant > 1 ? " × " + it.cant : "") + " (" + money(cu.total) + (cu.aConfirmar ? " + " + cu.aConfirmar + " a confirmar" : "") + ")" +
      (cerradoPara(c) && !modoPrueba ? ", para cuando abran las reservas de " + estado.prox : "") + ".\n" +
      (c.tipo === "caja" ? "   Sorpresas: " + (pr.length ? pr.join(", ") : "sin restricciones") + ".\n" : "") +
      "   Adicionales: " + textoAdicionales(it) + ".\n" +
      (it.regalo ? "   Es para regalo: " + textoRegalo(it) + ".\n" : "") +
      "   Entrega: " + [it.dir, it.loc, it.zona].filter(Boolean).join(", ") + ".";
  }
  function mensajePedido() {
    var items = todos(), cp = cuentaPedido();
    var total = money(cp.total) + (cp.aConfirmar ? " + " + cp.aConfirmar + ", precio a confirmar" : "");
    if (items.length > 1) {
      return MENSAJES("pedidoVarios", { mes: MES, total: total, detalle: items.map(lineaItem).join("\n"), nombre: order.nom, telefono: order.tel });
    }
    var c = combo(order.combo), pr = prefLabels(order.prefs);
    return MENSAJES("pedido", {
      combo: c.nombre + (order.cant > 1 ? " × " + order.cant : ""), mes: MES, total: total,
      adicionales: textoAdicionales(),
      regalo: order.regalo ? "\nEs para regalo: " + textoRegalo() + "." : "",
      sorpresas: c.tipo === "caja" ? (pr.length ? pr.join(", ") : "sin restricciones") : "no aplica (dúo)",
      direccion: [order.dir, order.loc, order.zona].filter(Boolean).join(", "),
      nombre: order.nom, telefono: order.tel, proximoMes: estado.prox
    });
  }

  function collect(validate) {
    var s = steps[step];
    if (s === "prefs" && user && $("#savePrefs") && $("#savePrefs").checked) {
      user.prefs = order.prefs.slice(); save();
      pagePrefs.length = 0; order.prefs.forEach(function (p) { pagePrefs.push(p); });
    }
    if (s === "envio") {
      order.zona = $("#eZona").value;
      order.loc = str($("#eLoc").value);
      order.dir = str($("#eDir").value);
      order.nom = str($("#eNom").value);
      order.tel = str($("#eTel").value);
      order.age = $("#eAge").checked;
      if (validate) {
        var miss = [!order.zona && "tu zona", !order.loc && "la localidad", !order.dir && "la dirección", !order.nom && "tu nombre", !order.tel && "tu WhatsApp"].filter(Boolean);
        if (miss.length) { $("#eErr").textContent = "Falta completar " + miss.join(", ") + "."; return false; }
        if (!order.age) { $("#eErr").textContent = "Para seguir, confirmá que sos mayor de 18 años."; return false; }
      }
      if (user) { user.zona = order.zona; user.dir = order.dir; user.loc = order.loc; if (!user.tel) user.tel = order.tel; save(); }
    }
    if (s === "extras" && order.regalo) {
      order.gNom = str($("#gNom").value);
      order.gLoc = str($("#gLoc").value);
      order.gDir = str($("#gDir").value);
      if (validate) {
        var faltan = [!order.gNom && "para quién es", !order.gLoc && "la localidad", !order.gDir && "la dirección del regalo"].filter(Boolean);
        if (faltan.length) { $("#xErr").textContent = "Para el regalo falta " + faltan.join(", ") + "."; return false; }
      }
    }
    return true;
  }

  function finish(accion) {
    var items = todos(), msg = mensajePedido(), gift = false;
    var cajasN = unidades(items, "caja"), duosN = unidades(items, "duo"), totalN = unidades(items);
    var primero = items[0], c = combo(primero.combo), mensual = c.tipo === "caja";
    var regalos = items.filter(function (it) { return it.regalo; });
    /* Copia al mail del club (solo pedidos de verdad: no en modo prueba) */
    if (accion.tipo === "wa" || accion.tipo === "mp" || accion.tipo === "avisame") {
      var cpA = cuentaPedido();
      avisar(accion.tipo === "avisame" ? "Quiere que le avisen cuando abran las reservas"
        : "Pedido nuevo: " + order.nom + " (" + money(cpA.total) + (cpA.aConfirmar ? " + a confirmar" : "") + ")", {
        "Qué hizo": accion.tipo === "wa" ? "Tocó «Enviar pedido por WhatsApp»: se le abrió WhatsApp con este mensaje para mandártelo."
          : accion.tipo === "mp" ? "Tocó «Pagar con Mercado Pago»: fue a pagar con el link del combo."
          : "Tocó «Avisame cuando abra»: se le abrió WhatsApp con este mensaje para mandártelo.",
        "Nombre": order.nom, "WhatsApp": order.tel,
        "Mensaje": accion.tipo === "avisame" ? MENSAJES("avisame", { proximoMes: estado.prox, combo: nombresDe(items), mes: MES }) : msg,
        "Perfil en la página": user && !user.demo ? user.name + " (" + countMensual(user) + " de " + GOAL + " cajas antes de este pedido)" : "",
        "Fecha": ahora()
      });
    }
    var pedidoId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var renglones = items.map(function (it, n) {
      var ci = combo(it.combo);
      return { m: cap(MES), c: ci.nombre + (it.cant > 1 ? " × " + it.cant : "") + (it.regalo ? " (regalo)" : ""),
        price: cuenta(it).total, mensual: ci.tipo === "caja", n: it.cant || 1, id: pedidoId + "-" + n };
    });
    var enPlanilla = hayPlanilla && (accion.tipo === "wa" || accion.tipo === "mp") && (!user || !user.demo);
    if (enPlanilla) {
      planillaEnviar({ accion: "pedido", id: pedidoId, tel: user ? user.tel || order.tel : order.tel, nombre: user ? user.name : order.nom,
        items: renglones.map(function (r) { return { m: r.m, c: r.c, price: r.price, mensual: r.mensual, n: r.n }; }) });
    }
    if (accion.tipo !== "avisame" && user) {
      var before = countMensual(user);
      renglones.forEach(function (r) {
        if (enPlanilla) { r.pagado = false; r.t = Date.now(); }
        user.history.push(r);
      });
      save();
      safe(paintPerfilRapido, "acceso rápido al perfil");
      gift = cajasN > 0 && before < GOAL && countMensual(user) >= GOAL;
    }
    /* El próximo pedido arranca de cero: sin combos agregados, adicionales ni regalo */
    cart = [];
    itemNuevo();
    paintProgress(true);
    $("#dTitle").textContent = "¡Listo!";
    var titulo, texto, extra = "";
    if (accion.tipo === "avisame") {
      titulo = "Te avisamos.";
      texto = "Mandá el mensaje de WhatsApp y te escribimos cuando abran las reservas de " + esc(estado.prox) + ".";
    } else if (accion.tipo === "mp") {
      titulo = "Terminá el pago en Mercado Pago.";
      texto = "Se abrió en otra pestaña. " + (hasWA ? "Después mandanos tu pedido por WhatsApp así sabemos a dónde llevarlo." : "Cuando se acredite, te confirmamos la entrega.");
      if (hasWA) extra = '<a class="btn wa" href="' + esc(waLink(msg)) + '" target="_blank" rel="noopener">Mandar mi pedido por WhatsApp</a>';
    } else if (accion.tipo === "wa") {
      titulo = "Tu pedido está en WhatsApp.";
      texto = "Envialo y te confirmamos el pago y la entrega" + (cajasN ? " del " + esc(ENTREGAS) : "") + ".";
      extra = '<a class="btn btn--line" href="' + esc(waLink(msg)) + '" target="_blank" rel="noopener">Abrir WhatsApp de nuevo</a>';
    } else if (totalN === 1) {
      titulo = mensual ? "Tu caja está reservada." : "Tu dúo está pedido.";
      texto = primero.regalo ? "Le enviamos el regalo a " + esc(primero.gNom) + ", a " + esc(primero.gDir + ", " + primero.gLoc) + ", con una carta de feliz cumpleaños."
        : mensual ? "Te la llevamos del " + esc(ENTREGAS) + " a " + esc(primero.dir + ", " + primero.loc) + "." : "Te escribimos por WhatsApp para coordinar la entrega.";
      extra = '<p class="small">Sitio en preparación: este pedido todavía no se envió ni se cobró.</p>';
    } else {
      titulo = "Tu pedido está reservado.";
      texto = "Son " + totalN + " combos." + (cajasN ? " Las cajas llegan del " + esc(ENTREGAS) + "." : "") +
        (duosN ? " Los dúos los coordinamos por WhatsApp." : "") +
        (regalos.length ? (regalos.length === 1 ? " El regalo va" : " Los regalos van") + " con una carta de feliz cumpleaños." : "");
      extra = '<p class="small">Sitio en preparación: este pedido todavía no se envió ni se cobró.</p>';
    }
    $("#dBody").innerHTML = '<div class="done"><img src="assets/img/logo.webp" alt=""><h4>' + titulo + "</h4><p>" + texto + "</p>" +
      (accion.tipo !== "avisame" && gift ? '<p class="hand">¡Y esta trae tu regalo sorpresa!</p>' : "") +
      extra + finEncargue() + "</div>";
    $("#dFoot").innerHTML = "<span></span>" + (user ? '<button type="button" class="btn" id="seeProfile">Ver mi perfil</button>' : '<button type="button" class="btn" id="closeDone">Cerrar</button>');
    var sp = $("#seeProfile");
    if (sp) sp.addEventListener("click", function () { closeOrder(); setTimeout(function () { go("perfil", true); }, 400); });
    var cd = $("#closeDone");
    if (cd) cd.addEventListener("click", closeOrder);
    var fe = $("[data-fin-encargue]");
    if (fe) fe.addEventListener("click", closeOrder);
  }

  /* Al final del pedido, un acceso a «Por encargue» */
  function finEncargue() {
    if (!$("#encargue")) return "";
    var t = listaEncargue().length ? "¿Buscás algo especial? Mirá los vinos por encargue"
      : (filled(TX.encarguePronto) ? str(TX.encarguePronto) : "Próximamente") + ": vinos por encargue";
    return '<p class="done__enc"><a href="#encargue" data-go data-fin-encargue>' + esc(t) + " →</a></p>";
  }

  /* ------------------------------------------------------------------
     8. Navegación: la página y «Mi perfil»
     ------------------------------------------------------------------ */

  var current = "inicio";

  function go(v, push, smooth) {
    var perfil = v === "perfil";
    var target = !perfil && v && v !== "inicio" ? doc.getElementById(v) : null;
    if (!perfil && v && v !== "inicio" && !target) v = "inicio";
    var antes = current;
    current = perfil ? "perfil" : "inicio";
    $$(".view").forEach(function (el) { el.classList.toggle("active", el.getAttribute("data-view") === current); });
    $$(".hd__nav a").forEach(function (a) { a.classList.toggle("cur", a.getAttribute("href") === "#" + v); });
    if (push) { try { history.pushState(null, "", "#" + (v || "inicio")); } catch (e) { /* file:// viejo */ } }
    var mn = $("#mnav"); if (mn) mn.open = false;
    if (perfil) {
      safe(function () { renderPerfil(true); }, "perfil");
      try { window.scrollTo({ top: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, 0); }
      return;
    }
    var suave = smooth && antes === "inicio";
    if (target) {
      try { target.scrollIntoView({ behavior: suave ? "smooth" : "instant", block: "start" }); } catch (e) { target.scrollIntoView(); }
      /* Si algo cambió de alto mientras bajaba, termina de acomodar */
      clearTimeout(go._t);
      go._t = setTimeout(function corregir() {
        var hd = $("#hd"), alto = hd ? hd.getBoundingClientRect().height : 64;
        var off = target.getBoundingClientRect().top - alto;
        if (Math.abs(off) > 6) { try { target.scrollIntoView({ behavior: "instant", block: "start" }); } catch (e) { target.scrollIntoView(); } }
      }, suave ? 1100 : 120);
    } else {
      try { window.scrollTo({ top: 0, behavior: suave ? "smooth" : "instant" }); } catch (e) { window.scrollTo(0, 0); }
    }
    if (antes !== "inicio") setTimeout(function () { safe(refreshEffects, "efectos"); }, 60);
  }

  function initNav() {
    $("#drawer [data-close]").addEventListener("click", closeOrder);
    /* Un solo escuchador para los botones de pedido y los links internos */
    doc.addEventListener("click", function (e) {
      if (!e.target.closest) return;
      var o = e.target.closest("[data-order]");
      if (o) {
        e.preventDefault();
        var mn = $("#mnav"); if (mn) mn.open = false;
        openOrder(o.getAttribute("data-order"), parseInt(o.getAttribute("data-paso") || "0", 10), { regalo: o.hasAttribute("data-regalo") });
        return;
      }
      var a = e.target.closest("a[data-go]");
      if (a) {
        e.preventDefault();
        go((a.getAttribute("href") || "").slice(1), true, true);
        return;
      }
      var mn2 = $("#mnav");
      if (mn2 && mn2.open && !mn2.contains(e.target)) mn2.open = false;
    });
    root.classList.add("views-on");
    var fromHash = function () {
      var v = (window.location.hash || "").slice(1);
      if (v === "contenido") return;
      go(v, false, true);
    };
    window.addEventListener("popstate", fromHash);
    go((window.location.hash || "").slice(1), false, false);
  }

  /* ------------------------------------------------------------------
     9. Efectos: apariciones, títulos palabra por palabra y scroll
     ------------------------------------------------------------------ */

  /* Parte cada título en palabras para que aparezcan de a una */
  function splitWords(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
            var s = doc.createElement("span");
            s.className = "w";
            s.style.setProperty("--i", String(i++));
            s.textContent = p;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          walk(n);
        }
      });
    })(el);
  }

  var io = null;
  function initReveal() {
    $$("[data-split]").forEach(function (el) { if (!el.hidden) splitWords(el); });
    var items = $$(".rv, [data-split]");
    if (!items.length || !("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
    root.classList.add("rv-on");
    /* Seguro: a los 6 s se muestra todo lo que ya pasó por la pantalla */
    setTimeout(function () {
      var h = window.innerHeight || root.clientHeight;
      $$(".rv:not(.in), [data-split]:not(.in)").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < h) el.classList.add("in");
      });
    }, 6000);
  }


  /* ------------------------------------------------------------------
     La copa que derrama vino en «Dúos». Avanza con el scroll y, si se
     vuelve a subir, retrocede. Es un dibujo (SVG): no usa imágenes.
     ------------------------------------------------------------------ */
  var pour = null;
  var TILT = 108;

  /* Forma real de la palabra «Dúos.»: se dibuja letra por letra en un
     canvas invisible (en el mismo lugar que en la página) para saber
     dónde hay letra y dónde no. Devuelve la máscara en coordenadas de la
     sección. */
  function mascaraPalabra(span, sr) {
    var tw = doc.createTreeWalker(span, NodeFilter.SHOW_TEXT, null, false), nodo, letras = [];
    while ((nodo = tw.nextNode())) {
      for (var i = 0; i < nodo.length; i++) {
        var ch = nodo.data.charAt(i);
        if (!ch.trim()) continue;
        var r = doc.createRange();
        r.setStart(nodo, i); r.setEnd(nodo, i + 1);
        var b = r.getBoundingClientRect();
        if (b.width) letras.push({ ch: ch, l: b.left - sr.left, t: b.top - sr.top, w: b.width, h: b.height });
      }
    }
    if (!letras.length) return null;
    var cs = getComputedStyle(span);
    var L = Math.floor(Math.min.apply(null, letras.map(function (q) { return q.l; }))) - 4;
    var T = Math.floor(Math.min.apply(null, letras.map(function (q) { return q.t; }))) - 4;
    var R = Math.ceil(Math.max.apply(null, letras.map(function (q) { return q.l + q.w; }))) + 4;
    var B = Math.ceil(Math.max.apply(null, letras.map(function (q) { return q.t + q.h; }))) + 4;
    var w = R - L, h = B - T;
    var cv = doc.createElement("canvas");
    cv.width = w; cv.height = h;
    var cx = cv.getContext("2d");
    if (!cx) return null;
    cx.font = [cs.fontStyle, cs.fontWeight, cs.fontSize, cs.fontFamily].join(" ");
    cx.textBaseline = "alphabetic";
    cx.fillStyle = "#000";
    letras.forEach(function (q) {
      var m = cx.measureText(q.ch);
      var asc = m.fontBoundingBoxAscent || q.h * 0.78;
      cx.fillText(q.ch, q.l - L, q.t - T + asc);
    });
    var px = cx.getImageData(0, 0, w, h).data, mask = new Uint8Array(w * h);
    for (var j = 0; j < w * h; j++) mask[j] = px[j * 4 + 3] > 110 ? 1 : 0;
    return { L: L, T: T, w: w, h: h, mask: mask, letras: letras };
  }

  /* Camino del vino sobre las letras: cae, y al tocar letra se desliza
     por su borde (como sobre un sólido) hasta que vuelve a caer. */
  function caminoSobreLetras(M, x0, dir) {
    function solido(x, y) { return x >= 0 && x < M.w && y >= 0 && y < M.h && M.mask[y * M.w + x] === 1; }
    var x = Math.round(x0 - M.L), y = 0, pts = [], guard = 0, toco = null;
    if (x < 0 || x >= M.w) return null;
    while (y < M.h - 1 && guard++ < 6000) {
      if (!solido(x, y + 1)) { y++; }
      else {
        if (!toco) toco = [x, y];
        if (!solido(x + dir, y + 1)) { x += dir; y++; }
        else if (!solido(x + dir, y)) { x += dir; }
        else if (!solido(x - dir, y + 1)) { dir = -dir; x += dir; y++; }
        else break;
      }
      /* pegado a la letra: se corre apenas hacia afuera para que se vea la capa de vino */
      var pegado = solido(x, y + 1) || solido(x - dir, y) || solido(x - dir, y + 1);
      pts.push([x + M.L + (pegado ? dir * 0.8 : 0), y + M.T - (pegado ? 1.6 : 0)]);
    }
    if (!toco) return null;
    /* puntos cada ~3 px para un trazo suave */
    var out = [], ult = null;
    pts.forEach(function (p, i) {
      if (!ult || Math.abs(p[0] - ult[0]) + Math.abs(p[1] - ult[1]) >= 3 || i === pts.length - 1) { out.push(p); ult = p; }
    });
    return { pts: out, hit: [toco[0] + M.L, toco[1] + M.T] };
  }

  function buildPour() {
    var sec = $("#duos"), box = sec && $(".pour", sec);
    pour = null;
    if (!box) return;
    box.innerHTML = "";
    if (!sec.offsetHeight) { sec.classList.remove("pour-on"); return; }
    var list = $(".wlist", sec), head = $(".wines__head h2", sec), word = head && $("[data-split]", head);
    if (!list || !word) return;
    sec.classList.add("pour-on");                 /* deja aire arriba para la copa */
    /* medir sin las animaciones de aparición (que corren las letras) */
    sec.classList.add("pour-mide");
    var sr = sec.getBoundingClientRect();
    var M = mascaraPalabra(word, sr);
    var lr = list.getBoundingClientRect();
    sec.classList.remove("pour-mide");
    if (!M) return;
    var W = sec.clientWidth, H = sec.offsetHeight;
    var movil = window.innerWidth <= 760;
    var S = movil ? 78 : 118, k = S / 100;
    var a = TILT * Math.PI / 180, lado = -1;      /* la copa se inclina hacia la izquierda */
    var lipDx = lado * 28 * k * (Math.cos(a) + Math.sin(a)), lipDy = 28 * k * (Math.sin(a) - Math.cos(a));

    /* el chorro cae sobre la primera letra («D»): corre por su techo,
       baja por la curva y gotea entre la «D» y la «ú» */
    var q = M.letras[0];
    var x = Math.round(q.l + q.w * 0.42);
    var flujo = caminoSobreLetras(M, x, 1);

    /* la copa: más arriba que cualquier letra que tenga debajo */
    var gx = x - lipDx;
    var desde = Math.max(0, Math.floor(gx - 0.4 * S - M.L)), hasta = Math.min(M.w - 1, Math.ceil(gx + 0.66 * S - M.L));
    var cima = M.h;
    for (var cxp = desde; cxp <= hasta; cxp++) {
      for (var cyp = 0; cyp < M.h; cyp++) if (M.mask[cyp * M.w + cxp]) { cima = Math.min(cima, cyp); break; }
    }
    var y0 = M.T + Math.min(cima, M.h) - (movil ? 34 : 58);
    var gy = y0 - lipDy;
    var yEnd = lr.bottom - sr.top + (movil ? 30 : 46);

    /* el camino completo: caída libre, recorrido por la letra y caída hasta el charco */
    var pts = [[x, y0]];
    var xFin = x, yHit = null, hitX = x;
    if (flujo) {
      yHit = flujo.hit[1]; hitX = flujo.hit[0];
      flujo.pts.forEach(function (p) { if (p[1] > y0) pts.push(p); });
      xFin = pts[pts.length - 1][0];
    }
    var yUlt = pts[pts.length - 1][1];
    for (var yy = yUlt, i = 0; yy < yEnd; i++) {
      yy = Math.min(yEnd, yy + 44);
      pts.push([xFin + Math.sin(i * 1.7) * 1.1, yy]);
    }
    var d = "M" + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" L");
    function n(v) { return (v * k).toFixed(1); }
    var vino = "#8E2232", vinoClaro = "#B8404F";
    box.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '">' +
      '<defs><linearGradient id="pourG" gradientUnits="userSpaceOnUse" x1="0" y1="' + y0.toFixed(0) + '" x2="0" y2="' + yEnd.toFixed(0) + '">' +
      '<stop offset="0" stop-color="' + vinoClaro + '"/><stop offset=".5" stop-color="' + vino + '"/><stop offset="1" stop-color="' + vinoClaro + '"/></linearGradient>' +
      '<clipPath id="pourBowl"><path d="M' + n(-28) + "," + n(-28) + " C" + n(-30) + "," + n(-3) + " " + n(-22) + "," + n(17) + " 0," + n(22) + " C" + n(22) + "," + n(17) + " " + n(30) + "," + n(-3) + " " + n(28) + "," + n(-28) + 'Z"/></clipPath></defs>' +
      '<path class="pour__stream" d="' + d + '" fill="none" stroke="url(#pourG)" stroke-width="' + (movil ? 3.5 : 5) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      (yHit !== null ? '<ellipse class="pour__bead" cx="' + hitX.toFixed(1) + '" cy="' + (yHit - 1).toFixed(1) + '" rx="0" ry="0" fill="' + vino + '"/>' : "") +
      '<ellipse class="pour__pool" cx="' + xFin.toFixed(1) + '" cy="' + yEnd.toFixed(1) + '" rx="0" ry="0" fill="' + vino + '"/>' +
      '<circle class="pour__drop" r="' + (movil ? 2 : 2.8) + '" cx="0" cy="0" fill="' + vinoClaro + '"/>' +
      '<circle class="pour__drop" r="' + (movil ? 1.4 : 1.9) + '" cx="0" cy="0" fill="' + vinoClaro + '"/>' +
      '<g class="pour__glass" transform="translate(' + gx.toFixed(1) + "," + gy.toFixed(1) + ')">' +
      '<g clip-path="url(#pourBowl)"><g class="pour__level"><rect class="pour__wine" x="' + n(-40) + '" y="' + n(2) + '" width="' + n(80) + '" height="' + n(70) + '" fill="' + vino + '"/></g></g>' +
      '<g fill="none" stroke="rgba(241,231,211,.78)" stroke-width="1.4" stroke-linecap="round">' +
      '<path d="M' + n(-28) + "," + n(-28) + " C" + n(-30) + "," + n(-3) + " " + n(-22) + "," + n(17) + " 0," + n(22) + " C" + n(22) + "," + n(17) + " " + n(30) + "," + n(-3) + " " + n(28) + "," + n(-28) + '"/>' +
      '<ellipse cx="0" cy="' + n(-28) + '" rx="' + n(28) + '" ry="' + n(3.5) + '"/>' +
      '<path d="M0,' + n(22) + " L0," + n(64) + '"/>' +
      '<ellipse cx="0" cy="' + n(66) + '" rx="' + n(19) + '" ry="' + n(3) + '"/>' +
      '<path d="M' + n(-19) + "," + n(-14) + " C" + n(-20) + "," + n(-2) + " " + n(-15) + "," + n(9) + " " + n(-8) + "," + n(14) + '" stroke="rgba(241,231,211,.35)"/>' +
      "</g></g></svg>";
    var stream = $(".pour__stream", box);
    var len = stream.getTotalLength ? stream.getTotalLength() : (yEnd - y0);
    /* largo del camino hasta tocar la letra (para la gotita del impacto) */
    var lenHit = yHit !== null ? Math.max(0, yHit - y0) : 0;
    stream.style.strokeDasharray = len.toFixed(1);
    stream.style.strokeDashoffset = len.toFixed(1);
    pour = {
      sec: sec, gx: gx, gy: gy, y0: y0, yEnd: yEnd, S: S, len: len, lenHit: lenHit, movil: movil, lado: lado,
      glass: $(".pour__glass", box), level: $(".pour__level", box), wine: $(".pour__wine", box),
      stream: stream, pool: $(".pour__pool", box), bead: $(".pour__bead", box), drops: $$(".pour__drop", box)
    };
    tickPour();
  }
  function tickPour() {
    if (!pour) return;
    var vh = window.innerHeight || root.clientHeight;
    var top = pour.sec.getBoundingClientRect().top;
    var k = pour.S / 100;
    /* El charco tiene que terminar de formarse antes del final de la
       página (en el celular «Dúos» queda casi al final y no se llegaba).
       «fin» es la altura de pantalla donde el charco queda completo. */
    var maxS = Math.max(0, root.scrollHeight - vh);
    var charcoAbajo = top + pour.yEnd + (window.pageYOffset || root.scrollTop || 0) - maxS;
    var crece = vh * (pour.movil ? 0.12 : 0.22);
    var fin = Math.max(vh * (pour.movil ? 0.5 : 0.33), charcoAbajo + vh * 0.15);
    var linea = Math.min(fin + crece, vh * 0.9);
    /* 1) la copa se inclina mientras sube por la pantalla */
    var t1 = clamp01((linea + vh * 0.35 - (top + pour.gy)) / (vh * 0.35));
    var e = t1 * t1 * (3 - 2 * t1);
    /* 2) el vino avanza acompañando el scroll (y retrocede si se sube) */
    var t2 = clamp01((linea - (top + pour.y0)) / (pour.yEnd - pour.y0));
    /* 3) al llegar abajo se forma un charquito */
    var t3 = clamp01((linea - (top + pour.yEnd)) / (linea - fin));
    var ang = e * TILT * pour.lado;
    pour.glass.setAttribute("transform", "translate(" + pour.gx.toFixed(1) + "," + pour.gy.toFixed(1) + ") rotate(" + ang.toFixed(2) + ")");
    pour.level.setAttribute("transform", "rotate(" + (-ang).toFixed(2) + ")");
    pour.wine.setAttribute("y", ((2 + 18 * e + 14 * t2) * k).toFixed(2));   /* se va vaciando */
    var largo = pour.len * t2;
    pour.stream.style.strokeDashoffset = (pour.len - largo).toFixed(1);
    pour.stream.style.visibility = t2 > 0 ? "visible" : "hidden";
    /* gotitas en la punta, solo mientras cae (no mientras recorre la letra) */
    var cae = t2 > 0.002 && t2 < 0.998 && pour.stream.getPointAtLength;
    if (cae) {
      var p = pour.stream.getPointAtLength(largo), p0 = pour.stream.getPointAtLength(Math.max(0, largo - 8));
      cae = Math.abs(p.x - p0.x) < 2.5;
      pour.drops.forEach(function (c, i) {
        c.setAttribute("cx", (p.x + (i ? 0.8 : 0)).toFixed(1));
        c.setAttribute("cy", (p.y + (i ? 26 : 12)).toFixed(1));
      });
    }
    pour.drops.forEach(function (c) { c.style.visibility = cae ? "visible" : "hidden"; });
    /* gotita que se forma donde el vino golpea la letra */
    if (pour.bead) {
      var b = clamp01((largo - pour.lenHit) / 40);
      pour.bead.setAttribute("rx", (b * (pour.movil ? 4 : 6.5)).toFixed(1));
      pour.bead.setAttribute("ry", (b * (pour.movil ? 1.6 : 2.4)).toFixed(1));
    }
    var R = pour.movil ? 34 : 64;
    var g = t3 * (2 - t3);
    pour.pool.setAttribute("rx", (R * g).toFixed(1));
    pour.pool.setAttribute("ry", (R * 0.15 * g).toFixed(1));
  }

  /* Efectos ligados al scroll: números que suben, fotos escalonadas,
     la copa de «Dúos» y la marca del pie. Ninguno recorta fotos. */
  var fx = {};
  function refreshEffects() {
    fx.hero = $(".hero__copy");
    fx.rule = $(".rule");
    fx.big = $("[data-big]");
    fx.year = $(".year__track");
    fx.media = $$(".year__media");
    fx.ft = $(".ft");
    fx.word = $(".ft__word");
    fx.hd = $("#hd");
    fx.ancho = window.matchMedia ? window.matchMedia("(min-width: 861px)") : null;
    safe(placeHoy, "hoy");
    safe(buildPour, "copa");
    tick();
  }
  function tick() {
    var vh = window.innerHeight || root.clientHeight;
    var y = window.pageYOffset || root.scrollTop || 0;
    if (fx.hd) fx.hd.classList.toggle("scrolled", y > 8);
    if (current !== "inicio") return;
    var ancho = !fx.ancho || fx.ancho.matches;
    if (fx.hero) {
      if (ancho && y < vh) {
        fx.hero.style.transform = "translateY(" + (-y * 0.18).toFixed(1) + "px)";
        fx.hero.style.opacity = String(clamp01(1 - y / (vh * 0.9)).toFixed(3));
      } else { fx.hero.style.transform = ""; fx.hero.style.opacity = ""; }
    }
    if (fx.rule && fx.big) {
      var r = fx.rule.getBoundingClientRect();
      var p = clamp01((vh - r.top) / (vh * 0.8));
      fx.big.style.setProperty("--rise", ((1 - p) * 62).toFixed(2) + "%");
    }
    if (fx.year && fx.media.length) {
      var ry = fx.year.getBoundingClientRect();
      var py = clamp01((vh - ry.top) / (vh * 0.9));
      fx.media.forEach(function (m, i) {
        /* suben desde un poco más arriba y se acomodan: nunca bajan sobre la línea */
        m.style.setProperty("--ty", ancho ? (-(1 - py) * (24 + (i % 3) * 16)).toFixed(1) + "px" : "0px");
      });
    }
    tickPour();
    if (fx.ft && fx.word) {
      var rf = fx.word.getBoundingClientRect();
      var pf = clamp01((vh - rf.top) / (rf.height * 0.9 + 1));
      fx.word.style.setProperty("--wy", ((1 - pf) * 45).toFixed(2) + "%");
    }
  }
  function initScrollFx() {
    var pend = false;
    window.addEventListener("scroll", function () {
      if (!pend) { pend = true; requestAnimationFrame(function () { pend = false; tick(); }); }
    }, { passive: true });
    var t = 0;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { safe(fitWord, "marca"); safe(refreshEffects, "efectos"); }, 150);
    });
    refreshEffects();
  }

  /* La marca gigante del pie ocupa justo el ancho de la pantalla */
  function fitWord() {
    var p = $(".ft__word"), s = p && $("span", p);
    if (!p || !s) return;
    p.style.fontSize = "100px";
    var w = s.getBoundingClientRect().width;
    var max = p.getBoundingClientRect().width;
    if (w > 0 && max > 0) p.style.fontSize = Math.min(240, (100 * max * 0.97) / w).toFixed(1) + "px";
  }

  /* ------------------------------------------------------------------
     10. Mayoría de edad y bienvenida
     ------------------------------------------------------------------ */

  function initGate() {
    var gate = $("#gate");
    if (!gate) return;
    var ok = false;
    try { ok = window.sessionStorage.getItem("twl_edad") === "ok"; } catch (e) { ok = false; }
    /* Quien ya tiene perfil declaró ser mayor de 18 al crearlo: no se le pregunta más */
    if (ok || (user && !user.demo)) return;
    function cerrar() {
      gate.classList.add("gone");
      setTimeout(function () { gate.hidden = true; }, 650);
      doc.body.style.overflow = "";
    }
    $("#gateYes").addEventListener("click", function () {
      try { window.sessionStorage.setItem("twl_edad", "ok"); } catch (e) { /* nada */ }
      if (user) { cerrar(); return; }
      $("#gateAge").hidden = true;
      $("#gateWelcome").hidden = false;
      $("#wCreate").focus();
    });
    $("#gateNo").addEventListener("click", function () { $("#gateMsg").hidden = false; });
    $("#wCreate").addEventListener("click", function () { cerrar(); openSignup(); });
    $("#wLogin").addEventListener("click", function () { cerrar(); openLogin(); });
    $("#wSkip").addEventListener("click", cerrar);
    gate.hidden = false;
    doc.body.style.overflow = "hidden";
    setTimeout(function () { $("#gateYes").focus(); }, 60);
  }

  /* ------------------------------------------------------------------
     Por encargue: el catálogo de vinos que se traen a pedido. Se arma
     con la lista «encargue» de datos.js; si está vacía, se ve un aviso.
     «Encargar» abre WhatsApp con el mensaje y manda una copia al mail.
     ------------------------------------------------------------------ */

  function listaEncargue() {
    return (Array.isArray(data.encargue) ? data.encargue : []).filter(function (v) { return v && filled(v.nombre); });
  }

  function applyEncargue() {
    var grid = $("[data-encargue]"), vacio = $("[data-encargue-vacio]"), art = $("[data-encargue-art]"), sec = $("#encargue");
    if (!grid) return;
    var lista = listaEncargue();
    if (!lista.length) {
      /* Todavía sin vinos: el cartel «Próximamente» y, con WhatsApp, el botón para consultar */
      grid.hidden = true;
      if (vacio) vacio.hidden = false;
      if (art) art.hidden = false;
      var wa = $("[data-encargue-wa]");
      if (wa && hasWA) {
        wa.href = waLink(MENSAJES("encargueConsulta", {}));
        wa.hidden = false;
        wa.addEventListener("click", function () {
          avisar("Consulta por encargue", {
            "Qué hizo": "Tocó «Consultar por WhatsApp» en «Por encargue» (todavía sin vinos cargados).",
            "Perfil en la página": user && !user.demo ? user.name + (user.tel ? " · " + user.tel : "") : "",
            "Fecha": ahora()
          });
        });
      }
      return;
    }
    if (vacio) vacio.hidden = true;
    if (art) art.hidden = true;
    if (sec) sec.classList.add("is-lista");
    grid.hidden = false;
    function nombreLargo(v) {
      return str(v.nombre) + (filled(v.bodega) ? " de " + str(v.bodega) : "") + (filled(v.varietal) ? " (" + str(v.varietal) + ")" : "");
    }
    grid.innerHTML = lista.map(function (v, i) {
      var precio = num(v.precio), foto = rutaFoto(v.foto);
      var meta = [v.bodega, v.varietal, v.region].map(str).filter(Boolean).join(" · ");
      var media = foto
        ? '<img src="' + esc(foto) + '" alt="' + esc(str(v.nombre)) + '" loading="lazy">'
        : '<span class="enc__mono" aria-hidden="true">' + esc(inicial(v.nombre)) + "</span>";
      var accion = hasWA
        ? '<a class="btn btn--sm enc__btn" href="' + esc(waLink(MENSAJES("encargue", { vino: nombreLargo(v) }))) + '" target="_blank" rel="noopener" data-encargar="' + i + '">Encargar</a>'
        : '<span class="enc__nota">Escribinos para encargarlo.</span>';
      return '<article class="enc rv"><figure class="enc__media">' + media + "</figure>" +
        '<div class="enc__body">' + (meta ? '<p class="enc__meta">' + esc(meta) + "</p>" : "") +
        "<h3>" + esc(str(v.nombre)) + "</h3>" +
        (filled(v.nota) ? '<p class="enc__note hand">' + esc(str(v.nota)) + "</p>" : "") +
        '<div class="enc__row"><span class="enc__price">' + (precio ? money(precio) : "Consultar precio") + "</span>" + accion + "</div>" +
        "</div></article>";
    }).join("");
    $$("[data-encargar]", grid).forEach(function (a) {
      a.addEventListener("click", function () {
        var v = lista[parseInt(a.getAttribute("data-encargar"), 10)];
        if (!v) return;
        avisar("Encargue: " + str(v.nombre), {
          "Qué hizo": "Tocó «Encargar»: se le abrió WhatsApp con el mensaje para mandártelo.",
          "Vino": nombreLargo(v),
          "Precio": num(v.precio) ? money(num(v.precio)) : "a confirmar",
          "Perfil en la página": user && !user.demo ? user.name + (user.tel ? " · " + user.tel : "") : "",
          "Fecha": ahora()
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------ */

  function boot() {
    safe(applyTexts, "textos");
    safe(applyFotos, "fotos");
    safe(applyContactos, "contacto");
    safe(applyMenu, "caja del mes");
    safe(applyDuos, "dúos");
    safe(applyEncargue, "por encargue");
    safe(applyEstaciones, "vinos por estación");
    safe(applyClubCard, "tarjeta del club");
    safe(function () { if (user) user.prefs.forEach(function (p) { pagePrefs.push(p); }); }, "preferencias");
    safe(initSignup, "alta de perfil");
    safe(initDash, "panel del perfil");
    safe(initLogin, "ingresar");
    safe(function () { sync(true); }, "planilla");
    safe(refreshNav, "encabezado");
    safe(initNav, "navegación");
    safe(initReveal, "apariciones");
    safe(initMenuSwap, "foto de la caja");
    safe(initCursorImg, "foto de los dúos");
    safe(fitWord, "marca");
    safe(initScrollFx, "efectos");
    safe(initGate, "mayoría de edad");
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { safe(fitWord, "marca"); safe(refreshEffects, "efectos"); });
    window.addEventListener("load", function () { safe(refreshEffects, "efectos"); });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
