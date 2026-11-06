/* The Wine Loft · planilla del club
   Se pega en la planilla de Google: Extensiones → Apps Script.
   Los pasos completos están en planilla/LEEME-planilla.txt.

   Crea sola estas hojas:
   - Con el formato de tu Excel, un bloque por pedido:
     «CONMBOS MENSUALES» (las cajas), «DIARIOS» (los dúos),
     «ESPUMANTES» (cajas de 6) y «BOTELLAS SOLAS».
   - «VINOS DEL MES»: qué 4 vinos lleva cada caja según lo que quiere
     recibir el cliente. La cambiás vos cada mes.
   - «COSTOS»: el costo de cada vino. Los costos y ganancias se calculan
     solos desde acá.
   - «Pedidos»: cada pedido que llega desde la página. Vos tildás «Pagado»
     cuando te paga. Solo las cajas pagadas suman para el regalo.
   - «Socios»: cada perfil, con el total de cajas pagadas y de plata.
   No hace falta tocar nada de este código. */

/* Para correr desde el editor: reemplaza en «VINOS DEL MES» las filas de las
   cajas (RESERVA y CLASICO) por las de VINOS_INICIALES y actualiza los costos.
   Las filas de los dúos y de otros combos no se tocan. */
function actualizarVinos() {
  var h = hojaVinos(), vals = h.getDataRange().getValues();
  var cajas = { "RESERVA": 1, "CLASICO": 1 };
  var quedan = vals.slice(1).filter(function (r) { return !cajas[norm(r[0])] && String(r.join("")).trim(); });
  var nuevas = VINOS_INICIALES.slice(1).filter(function (r) { return cajas[r[0]]; });
  var todas = nuevas.concat(quedan);
  if (vals.length > 1) h.getRange(2, 1, vals.length - 1, 3).clearContent();
  h.getRange(2, 1, todas.length, 3).setValues(todas.map(function (r) { return [r[0], r[1], r[2]]; }));
  actualizarCostos();
}

/* Para correr desde el editor: pone en «COSTOS» los costos de COSTOS_INICIALES
   (agrega los vinos que falten y no toca los que no están en la lista) */
function actualizarCostos() {
  var h = hojaCostos(), vals = h.getDataRange().getValues(), fila = {};
  for (var i = 1; i < vals.length; i++) fila[norm(vals[i][0])] = i + 1;
  COSTOS_INICIALES.slice(1).forEach(function (c) {
    if (c[1] === "") return;
    var f = fila[norm(c[0])];
    if (!f) { f = h.getLastRow() + 1; h.getRange(f, 1).setValue(c[0]); }
    h.getRange(f, 2).setValue(c[1]).setNumberFormat(PLATA);
  });
}

/* ID de la planilla (lo que va entre /d/ y /edit en su dirección).
   Hace falta si el código está en un proyecto de Apps Script aparte;
   si está pegado desde Extensiones → Apps Script, puede quedar vacío. */
var ID_PLANILLA = "1f1vcCh343JK7-fTt788goEXEY60_AQUft9WQT4OBFaU";
function libro() {
  return ID_PLANILLA ? SpreadsheetApp.openById(ID_PLANILLA) : SpreadsheetApp.getActiveSpreadsheet();
}

var HOJA_PEDIDOS = "Pedidos";
var HOJA_SOCIOS = "Socios";
var COL_PEDIDOS = ["Fecha", "WhatsApp", "Nombre", "Mes", "Combo", "Cantidad", "Tipo", "Monto", "Pagado", "Id"];
var COL_SOCIOS = ["WhatsApp", "Nombre", "Email", "Zona", "No quiere recibir", "Alta", "Cajas pagadas", "Total pagado"];

/* Mismo criterio que la página: 10 dígitos, sin 54, sin 9, sin 0 */
function telKey(t) {
  var d = String(t || "").replace(/\D/g, "");
  if (d.indexOf("549") === 0) d = d.slice(3);
  else if (d.indexOf("54") === 0 && d.length > 10) d = d.slice(2);
  d = d.replace(/^0+/, "");
  /* 0343 15 4123456: se saca el 15 que va después de la característica */
  if (d.length === 12) [3, 4, 2].some(function (n) { if (d.substr(n, 2) === "15") { d = d.slice(0, n) + d.slice(n + 2); return true; } return false; });
  return d.length >= 10 ? d.slice(-10) : "";
}

function hoja(nombre, cols) {
  var ss = libro();
  var h = ss.getSheetByName(nombre);
  if (!h) {
    h = ss.insertSheet(nombre);
    h.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight("bold");
    h.setFrozenRows(1);
    h.getRange("B:B").setNumberFormat("@");
    if (nombre === HOJA_SOCIOS) h.getRange("A:A").setNumberFormat("@");
  }
  return h;
}

/* Para probar desde el editor: crea todas las hojas */
function preparar() {
  hojaFormato(HOJA_CAJAS, CAB_CAJAS);
  hojaFormato(HOJA_DIARIOS, CAB_DIARIOS);
  hojaFormato(HOJA_ESPUMANTES, CAB_ESPUMANTES);
  hojaFormato(HOJA_BOTELLAS, CAB_BOTELLAS);
  hojaVinos();
  hojaCostos();
  hoja(HOJA_PEDIDOS, COL_PEDIDOS);
  hoja(HOJA_SOCIOS, COL_SOCIOS);
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function esPagado(v) {
  return v === true || /^(s[ií]|x|ok|pagado|true)$/i.test(String(v).trim());
}

/* La página pregunta por un WhatsApp: devuelve nombre, zona y pedidos */
function doGet(e) {
  var k = telKey(e && e.parameter && e.parameter.tel);
  if (!k) return json({ ok: false, error: "tel" });
  var soc = hoja(HOJA_SOCIOS, COL_SOCIOS).getDataRange().getValues();
  var socio = null;
  for (var i = 1; i < soc.length; i++) {
    if (telKey(soc[i][0]) === k) {
      socio = { name: String(soc[i][1]), zona: String(soc[i][3]), prefs: String(soc[i][4]) };
      break;
    }
  }
  var ped = hoja(HOJA_PEDIDOS, COL_PEDIDOS).getDataRange().getValues();
  var pedidos = [];
  for (var j = 1; j < ped.length; j++) {
    var r = ped[j];
    if (telKey(r[1]) !== k) continue;
    pedidos.push({ m: String(r[3]), c: String(r[4]), n: Number(r[5]) || 1, mensual: String(r[6]) !== "dúo",
      price: Number(r[7]) || 0, pagado: esPagado(r[8]), id: String(r[9]) });
  }
  return json({ ok: true, socio: socio, pedidos: pedidos });
}

/* La página manda un perfil nuevo (o cambiado), un pedido o un espumante */
function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false }); }
  var k = telKey(d.tel);
  if (!k && d.accion === "perfil") return json({ ok: false, error: "tel" });
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (d.accion === "perfil") guardarSocio(k, d);
    else if (d.accion === "pedido") guardarPedido(k, d);
    else if (d.accion === "espumante") guardarEspumante(d);
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true });
}

function txt(v, max) { return String(v == null ? "" : v).slice(0, max || 200); }

function guardarSocio(k, d) {
  var h = hoja(HOJA_SOCIOS, COL_SOCIOS);
  var vals = h.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (telKey(vals[i][0]) === k) {
      /* Ya existe: solo se actualiza lo que no quiere recibir y la zona */
      if (d.accion !== "perfil") return;
      if (d.zona) h.getRange(i + 1, 4).setValue(txt(d.zona));
      h.getRange(i + 1, 5).setValue(txt(d.prefs));
      return;
    }
  }
  var fila = h.getLastRow() + 1;
  h.getRange(fila, 1, 1, 6).setValues([[k, txt(d.nombre, 80), txt(d.email, 120), txt(d.zona), txt(d.prefs), new Date()]]);
  h.getRange(fila, 7).setFormula('=SUMIFS(' + HOJA_PEDIDOS + '!F:F,' + HOJA_PEDIDOS + '!B:B,A' + fila + ',' +
    HOJA_PEDIDOS + '!G:G,"caja",' + HOJA_PEDIDOS + '!I:I,TRUE)');
  h.getRange(fila, 8).setFormula('=SUMIFS(' + HOJA_PEDIDOS + '!H:H,' + HOJA_PEDIDOS + '!B:B,A' + fila + ',' +
    HOJA_PEDIDOS + '!I:I,TRUE)').setNumberFormat("$ #,##0");
}

function guardarPedido(k, d) {
  var h = hoja(HOJA_PEDIDOS, COL_PEDIDOS);
  var id = txt(d.id, 40);
  if (id) {
    var ids = h.getLastRow() > 1 ? h.getRange(2, 10, h.getLastRow() - 1, 1).getValues() : [];
    for (var i = 0; i < ids.length; i++) if (String(ids[i][0]).indexOf(id + "-") === 0) return; /* ya llegó */
  }
  var items = Array.isArray(d.items) ? d.items.slice(0, 20) : [];
  if (!items.length) return;
  /* Primero, con el formato de tu Excel */
  items.forEach(function (it) {
    try {
      if (it.mensual === false) bloqueDuo(d, it); else bloqueCaja(d, it);
    } catch (err) { /* si falla el formato, igual queda en «Pedidos» */ }
  });
  if (!k) return; /* sin un WhatsApp válido no puede sumar para el regalo */
  var ahora = new Date();
  var filas = items.map(function (it, n) {
    return [ahora, k, txt(d.nombre, 80), txt(it.m, 30), txt(it.c, 120), Math.max(1, Math.min(10, Number(it.n) || 1)),
      it.mensual === false ? "dúo" : "caja", Number(it.price) || 0, false, id + "-" + n];
  });
  var desde = h.getLastRow() + 1;
  h.getRange(desde, 1, filas.length, filas[0].length).setValues(filas);
  h.getRange(desde, 9, filas.length, 1).insertCheckboxes();
  h.getRange(desde, 8, filas.length, 1).setNumberFormat("$ #,##0");
  /* Si pidió sin perfil, igual queda en «Socios» para ver su total */
  guardarSocio(k, d);
}


/* =====================================================================
   CON EL FORMATO DE TU EXCEL
   Un bloque por pedido, igual que en «ALTO EXCEL DE WINELOFT».
   ===================================================================== */

/* Si importaste tu Excel, la pestaña se llama «CONMBOS MENSUALES»: se usa esa. */
var HOJA_CAJAS = ["CONMBOS MENSUALES", "COMBOS MENSUALES"];
var HOJA_DIARIOS = "DIARIOS";
var HOJA_ESPUMANTES = "ESPUMANTES";
var HOJA_BOTELLAS = "BOTELLAS SOLAS";
var HOJA_VINOS = "VINOS DEL MES";
var HOJA_COSTOS = "COSTOS";

var CAB_CAJAS = ["CLIENTE", "DIRECCION", "COMBO", "VINOS", "CANTIDAD", "PRECIO VTA", "COSTO", "GANANCIA P/BOTELLA",
  "PRECIO COMBO", "COSTO COMBO", "GANANCIA COMBO", "¿QUIERE ROSADO O BLANCO?", "COMBO R/B", "CANTIDAD", "PRECIO VTA",
  "COSTO", "GANANCIA P/BOTELLA", "PRECIO COMBO", "COSTO COMBO", "GANANCIA COMBO", "TIPO DE COMPRA", "¿CHARCUTERÍA O CRISTALERÍA?", "¿ES PARA REGALO?"];
var CAB_DIARIOS = ["CLIENTE", "DIRECCION", "COMBO", "VINOS", "CANTIDAD", "PRECIO VTA", "COSTO", "GANANCIA P/BOTELLA",
  "PRECIO COMBO", "COSTO COMBO", "GANANCIA COMBO", "TIPO DE COMPRA", "¿CHARCUTERÍA O CRISTALERÍA?", "¿ES PARA REGALO?"];
var CAB_ESPUMANTES = ["CLIENTE", "DIRECCION", "COMBO", "ESPUMANTE", "CANTIDAD", "PRECIO VTA", "COSTO", "GANANCIA P/BOTELLA",
  "PRECIO COMBO", "COSTO COMBO", "GANANCIA COMBO", "TIPO DE COMPRA", "¿CHARCUTERÍA O CRISTALERÍA?", "¿ES PARA REGALO?"];
var CAB_BOTELLAS = ["CLIENTE", "DIRECCION", "VINOS", "CANTIDAD", "PRECIO VTA", "COSTO", "GANANCIA P/BOTELLA", "TIPO DE COMPRA", "¿CHARCUTERÍA O CRISTALERÍA?", "¿ES PARA REGALO?"];

/* Cómo se ve cada combo en la columna «TIPO DE COMPRA» */
var TIPOS = { "RESERVA": "CAJA RESERVA", "CLASICO": "CAJA CLÁSICA", "ORIGEN": "COMBO ORIGEN", "AUTOR": "COMBO AUTOR" };

/* Cómo se llama cada combo de la página en tu Excel */
var ALIAS = { "reserva": "RESERVA", "clasica": "CLASICO", "duo-clasico": "ORIGEN", "duo-reserva": "AUTOR" };

/* Lo que ya tenía tu Excel: se copia a «VINOS DEL MES» y «COSTOS» la primera vez */
/* Vinos de noviembre 2026. Las cajas llevan un rosado y un blanco; si el cliente
   no quiere uno, entra el primer tinto suplente; si no quiere ninguno, entran los dos.
   Clásica: suplentes garnacha negra y ponce de leon. Reserva: tukma y las perdices reserva. */
var VINOS_INICIALES = [
  ["COMBO", "VARIANTE", "VINO"],
  ["RESERVA", "ROSADO Y BLANCO", "mi terruño petit verdot"],
  ["RESERVA", "ROSADO Y BLANCO", "coordenada cabernet sauvignon"],
  ["RESERVA", "ROSADO Y BLANCO", "CORAZON VALIENTE TRAMINER"],
  ["RESERVA", "ROSADO Y BLANCO", "LAS PERDICES CLASSIQUE ROSE"],
  ["RESERVA", "SOLO ROSADO", "mi terruño petit verdot"],
  ["RESERVA", "SOLO ROSADO", "coordenada cabernet sauvignon"],
  ["RESERVA", "SOLO ROSADO", "LAS PERDICES CLASSIQUE ROSE"],
  ["RESERVA", "SOLO ROSADO", "tukma reserva tannat"],
  ["RESERVA", "SOLO BLANCO", "mi terruño petit verdot"],
  ["RESERVA", "SOLO BLANCO", "coordenada cabernet sauvignon"],
  ["RESERVA", "SOLO BLANCO", "CORAZON VALIENTE TRAMINER"],
  ["RESERVA", "SOLO BLANCO", "tukma reserva tannat"],
  ["RESERVA", "TINTOS", "mi terruño petit verdot"],
  ["RESERVA", "TINTOS", "coordenada cabernet sauvignon"],
  ["RESERVA", "TINTOS", "tukma reserva tannat"],
  ["RESERVA", "TINTOS", "las perdices reserva malbec"],
  ["CLASICO", "ROSADO Y BLANCO", "pala corazon malbec"],
  ["CLASICO", "ROSADO Y BLANCO", "abismal destino malbec"],
  ["CLASICO", "ROSADO Y BLANCO", "GOYENECHEA MERLOT ROSE"],
  ["CLASICO", "ROSADO Y BLANCO", "GATA FLORA RESERVA TORRONTES"],
  ["CLASICO", "SOLO ROSADO", "pala corazon malbec"],
  ["CLASICO", "SOLO ROSADO", "abismal destino malbec"],
  ["CLASICO", "SOLO ROSADO", "GOYENECHEA MERLOT ROSE"],
  ["CLASICO", "SOLO ROSADO", "garnacha negra"],
  ["CLASICO", "SOLO BLANCO", "pala corazon malbec"],
  ["CLASICO", "SOLO BLANCO", "abismal destino malbec"],
  ["CLASICO", "SOLO BLANCO", "GATA FLORA RESERVA TORRONTES"],
  ["CLASICO", "SOLO BLANCO", "garnacha negra"],
  ["CLASICO", "TINTOS", "pala corazon malbec"],
  ["CLASICO", "TINTOS", "abismal destino malbec"],
  ["CLASICO", "TINTOS", "garnacha negra"],
  ["CLASICO", "TINTOS", "ponce de leon reserva bonarda"],
  ["ORIGEN", "", "bodega niven tinta criolla"],
  ["ORIGEN", "", "tepeyac reserva malbec"],
  ["AUTOR", "", "marioneta malbec"],
  ["AUTOR", "", "13 cles malbec"]
];
/* Costos: lista de CATALINO Distribuciones, noviembre 2026 (columna PRECIO).
   Marioneta Malbec no figura en la de noviembre: queda el de septiembre. */
var COSTOS_INICIALES = [
  ["VINO", "COSTO"],
  ["mi terruño petit verdot", 17162],
  ["coordenada cabernet sauvignon", 10633],
  ["tukma reserva tannat", 15275],
  ["las perdices reserva malbec", 9425],
  ["LAS PERDICES CLASSIQUE ROSE", 12025],
  ["GATA FLORA RESERVA TORRONTES", 11050],
  ["pala corazon malbec", 9425],
  ["abismal destino malbec", 9425],
  ["ponce de leon reserva bonarda", 9550],
  ["garnacha negra", 8710],
  ["francisco stocco reserva cabernet", 8835],
  ["GOYENECHEA MERLOT ROSE", 6667],
  ["CORAZON VALIENTE TRAMINER", 12350],
  ["bodega niven tinta criolla", 5655],
  ["tepeyac reserva malbec", 7008],
  ["marioneta malbec", 7180],
  ["13 cles malbec", 6815],
  ["Mastroeni Extra Brut", 8100],
  ["Las Perdices Champenoise Joven Extra Brut", 6825],
  ["Keo Extra Brut 100% Pinot Noir", 11946],
  ["Chañarmuyo Champenoise Brut Nature", 15022]
];

var PLATA = "$ #,##0";

function letra(c) { var s = ""; while (c > 0) { var m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; }
function norm(v) {
  return String(v == null ? "" : v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
}

function hojaFormato(nombres, cab) {
  var ss = libro();
  nombres = [].concat(nombres);
  for (var i = 0; i < nombres.length; i++) {
    var h0 = ss.getSheetByName(nombres[i]);
    if (h0) { cabecerasFaltantes(h0, cab); return h0; }
  }
  var h = ss.insertSheet(nombres[nombres.length - 1]);
  h.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight("bold")
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);
  h.setRowHeight(1, 44);
  h.setFrozenRows(1);
  return h;
}

/* Si la pestaña ya existía, le agrega al final los títulos de las columnas nuevas */
function cabecerasFaltantes(h, cab) {
  var n = cab.length, fila = h.getRange(1, 1, 1, n).getValues()[0];
  for (var c = 0; c < n; c++) {
    if (String(fila[c]).trim()) continue;
    h.getRange(1, c + 1).setValue(cab[c]).setFontWeight("bold").setHorizontalAlignment("center")
      .setVerticalAlignment("middle").setWrap(true);
  }
}

function hojaVinos() {
  var ss = libro();
  var h = ss.getSheetByName(HOJA_VINOS);
  if (h) return h;
  h = ss.insertSheet(HOJA_VINOS);
  h.getRange(1, 1, VINOS_INICIALES.length, 3).setValues(VINOS_INICIALES);
  h.getRange(1, 1, 1, 3).setFontWeight("bold");
  h.setFrozenRows(1);
  return h;
}

function hojaCostos() {
  var ss = libro();
  var h = ss.getSheetByName(HOJA_COSTOS);
  if (h) return h;
  h = ss.insertSheet(HOJA_COSTOS);
  h.getRange(1, 1, COSTOS_INICIALES.length, 2).setValues(COSTOS_INICIALES);
  h.getRange(1, 1, 1, 2).setFontWeight("bold");
  h.getRange("B:B").setNumberFormat(PLATA);
  h.setFrozenRows(1);
  return h;
}

/* Qué acepta en las sorpresas, como en la columna «¿QUIERE ROSADO O BLANCO?» */
function variante(prefs) {
  var p = norm(prefs);
  var r = p.indexOf("SIN ROSADOS") < 0, b = p.indexOf("SIN BLANCOS") < 0;
  if (r && b) return { texto: "SI", clave: "ROSADO Y BLANCO" };
  if (r) return { texto: "SI R/NO B", clave: "SOLO ROSADO" };
  if (b) return { texto: "NO R/SI B", clave: "SOLO BLANCO" };
  return { texto: "NO", clave: "TINTOS" };
}

function claveCombo(it) {
  return ALIAS[it.id] || norm(it.combo || it.c).replace(/^(CAJA|COMBO) /, "");
}

/* Los vinos de «VINOS DEL MES» para ese combo y esa variante. Si no están
   cargados, los vinos anunciados en la página y «sorpresa (completar)». */
function vinosDe(clave, varClave, anunciados, botellas) {
  var vals = hojaVinos().getDataRange().getValues(), propios = [], sinVar = [];
  for (var i = 1; i < vals.length; i++) {
    if (norm(vals[i][0]) !== clave || !String(vals[i][2]).trim()) continue;
    var v = norm(vals[i][1]);
    if (v === varClave) propios.push(String(vals[i][2]).trim());
    else if (!v) sinVar.push(String(vals[i][2]).trim());
  }
  var l = propios.length ? propios : sinVar;
  if (l.length) return l;
  var n = Math.max(1, Math.min(12, Number(botellas) || 4));
  /* Esa variante no está cargada: van los vinos que se repiten en todas las
     variantes de esa caja (los anunciados) y las sorpresas para completar */
  var porVar = {};
  for (var j = 1; j < vals.length; j++) {
    if (norm(vals[j][0]) !== clave || !String(vals[j][2]).trim()) continue;
    var k = norm(vals[j][1]);
    (porVar[k] = porVar[k] || []).push(String(vals[j][2]).trim());
  }
  var grupos = Object.keys(porVar).map(function (k) { return porVar[k]; });
  if (grupos.length) {
    l = grupos[0].filter(function (v) {
      return grupos.every(function (g) { return g.map(norm).indexOf(norm(v)) >= 0; });
    });
  } else {
    l = (Array.isArray(anunciados) ? anunciados : []).map(String).filter(String);
  }
  l = l.slice(0, n);
  while (l.length < n) l.push("sorpresa (completar)");
  return l;
}

function costo(celda) { return '=IFERROR(VLOOKUP(' + celda + ",'" + HOJA_COSTOS + "'!$A:$B,2,FALSE),\"\")"; }
function cliente(d) { return txt(d.cliente || d.nombre, 80) || "Por WhatsApp (ver el chat)"; }
function direccion(d, it) {
  if (it && it.regalo) return txt("Regalo para " + (it.regalo.para || "") + ": " + (it.regalo.dir || ""), 160);
  return txt(it && it.dir || d.dir || "", 160);
}
function nota(d, it) {
  return ["Desde la página · " + Utilities.formatDate(new Date(), "America/Argentina/Buenos_Aires", "dd/MM/yyyy HH:mm"),
    d.tel ? "WhatsApp: " + txt(d.tel, 40) : "",
    it && it.m ? "Caja de: " + txt(it.m, 30) : "",
    it && it.prefs ? "No quiere recibir: " + txt(it.prefs, 80) : "",
    it && it.adicionales ? "Adicionales: " + txt(it.adicionales, 160) : "",
    it && it.regalo ? "Regalo para " + txt(it.regalo.para, 80) + " (" + txt(it.regalo.dir, 160) + ")" : ""
  ].filter(String).join("\n");
}

/* Escribe un bloque: una fila por vino, con las fórmulas de tu Excel.
   col = primera columna del grupo (VINOS en D, o COMBO R/B en M). */
function bloque(h, d, it, comboTxt, vinos, col, desde) {
  var n = vinos.length, f0 = h.getLastRow() + 1, f1 = f0 + n - 1;
  var cant = Math.max(1, Math.min(10, Number(it.n) || 1));
  var precio = Number(it.precio) || 0;
  var porBotella = precio && n ? Math.round(precio / n) : "";
  var cV = letra(col), cE = letra(col + 1), cF = letra(col + 2), cG = letra(col + 3), cI = letra(col + 5), cJ = letra(col + 6);
  var filas = vinos.map(function (v, i) {
    var r = f0 + i;
    return [v, cant, porBotella, costo(cV + r), '=IF(' + cG + r + '="","",' + cF + r + "-" + cG + r + ")"];
  });
  h.getRange(f0, col, n, 5).setValues(filas);
  h.getRange(f0, 1, 1, 3).setValues([[cliente(d), direccion(d, it), comboTxt]]);
  h.getRange(f0, col + 5).setValue(precio * cant);
  h.getRange(f0, col + 6).setFormula("=SUMPRODUCT(" + cE + f0 + ":" + cE + f1 + "," + cG + f0 + ":" + cG + f1 + ")");
  h.getRange(f0, col + 7).setFormula("=" + cI + f0 + "-" + cJ + f0);
  h.getRange(f0, col + 2, n, 6).setNumberFormat(PLATA);
  [1, 2, 3, col + 5, col + 6, col + 7].forEach(function (c) { unirCeldas(h, f0, c, n); });
  h.getRange(f0, 1).setNote(nota(d, it));
  h.getRange(f0, desde, 1, 3).setValues([columnasCompra(TIPOS[comboTxt] || comboTxt, it)]);
  [desde, desde + 1, desde + 2].forEach(function (c) { unirCeldas(h, f0, c, n); });
  h.getRange(f0, 1, n, desde + 2).setBorder(true, true, true, true, false, false);
  var x = extras(it);
  if (x) h.getRange(f0, 3).setValue(comboTxt + "\n⚠ Lleva " + x + " (precio a definir)").setBackground("#fff2a8").setWrap(true);
  return { fila: f0, filas: n };
}

/* Charcutería, cristalería y regalo todavía no tienen precio: no se suman
   al precio ni al costo, pero quedan marcados en amarillo en la celda COMBO */
function extras(it) {
  var l = lleva(it).map(function (k) { return k === "charcuteria" ? "charcutería" : "cristalería"; });
  if (it && it.regalo) l.push("regalo");
  return l.length > 1 ? l.slice(0, -1).join(", ") + " y " + l[l.length - 1] : l.join("");
}

/* Charcutería y cristalería que lleva el combo (también la que va incluida en el regalo) */
function lleva(it) {
  if (it && Array.isArray(it.lleva)) return ["charcuteria", "cristaleria"].filter(function (k) { return it.lleva.indexOf(k) >= 0; });
  var a = norm(it && it.adicionales), l = [];
  if (a.indexOf("CHARCUTERIA") >= 0) l.push("charcuteria");
  if (a.indexOf("CRISTALERIA") >= 0) l.push("cristaleria");
  return l;
}

/* Las tres columnas del final: tipo de compra, charcutería/cristalería y regalo */
function columnasCompra(tipo, it) {
  var l = lleva(it);
  var adic = l.length === 2 ? "CHARCUTERÍA Y CRISTALERÍA" : l[0] === "charcuteria" ? "CHARCUTERÍA" : l[0] === "cristaleria" ? "CRISTALERÍA" : "NO";
  return [tipo, adic, it && it.regalo ? "SI" : "NO"];
}

function unirCeldas(h, f0, c, n) {
  var r = h.getRange(f0, c, n, 1);
  if (n > 1) r.merge();
  r.setHorizontalAlignment("center").setVerticalAlignment("middle").setFontWeight("bold");
}

function bloqueCaja(d, it) {
  hojaCostos(); /* antes que las fórmulas que la buscan */
  var h = hojaFormato(HOJA_CAJAS, CAB_CAJAS);
  var v = variante(it.prefs);
  var clave = claveCombo(it);
  var vinos = vinosDe(clave, v.clave, it.vinos, it.botellas);
  /* Solo tintos: columnas D a K. Con rosado o blanco: M a T (como en tu Excel) */
  var col = v.clave === "TINTOS" ? 4 : 13;
  var b = bloque(h, d, it, clave, vinos, col, CAB_CAJAS.length - 2);
  h.getRange(b.fila, 12).setValue(v.texto);
  unirCeldas(h, b.fila, 12, b.filas);
}

function bloqueDuo(d, it) {
  hojaCostos();
  var h = hojaFormato(HOJA_DIARIOS, CAB_DIARIOS);
  var clave = claveCombo(it);
  var vinos = vinosDe(clave, "", it.vinos, it.botellas || 2);
  bloque(h, d, it, clave, vinos, 4, CAB_DIARIOS.length - 2);
}

/* Espumantes: caja de 6 → «ESPUMANTES»; una botella → «BOTELLAS SOLAS» */
function guardarEspumante(d) {
  var nombre = txt(d.producto, 120);
  if (!nombre) return;
  hojaCostos();
  var cant = Number(d.cantidad) === 6 ? 6 : 1;
  if (cant === 6) {
    var h = hojaFormato(HOJA_ESPUMANTES, CAB_ESPUMANTES), f = h.getLastRow() + 1;
    h.getRange(f, 1, 1, 11).setValues([[cliente(d), direccion(d), nombre, nombre, 6, Number(d.precio6) || "", costo("D" + f),
      '=IF(G' + f + '="","",F' + f + "-G" + f + ")", "=E" + f + "*F" + f,
      '=IF(G' + f + '="","",E' + f + "*G" + f + ")", '=IF(J' + f + '="","",I' + f + "-J" + f + ")"]]);
    h.getRange(f, 12, 1, 3).setValues([columnasCompra("ESPUMANTE CAJA x 6", d)]).setHorizontalAlignment("center").setFontWeight("bold");
    h.getRange(f, 6, 1, 6).setNumberFormat(PLATA);
    h.getRange(f, 1, 1, 14).setBorder(true, true, true, true, false, false);
    h.getRange(f, 1).setNote(nota(d));
  } else {
    var hb = hojaFormato(HOJA_BOTELLAS, CAB_BOTELLAS), fb = hb.getLastRow() + 1;
    hb.getRange(fb, 1, 1, 7).setValues([[cliente(d), direccion(d), nombre, 1, Number(d.precio) || "", costo("C" + fb),
      '=IF(F' + fb + '="","",E' + fb + "-F" + fb + ")"]]);
    hb.getRange(fb, 8, 1, 3).setValues([columnasCompra("BOTELLA INDIVIDUAL", d)]).setHorizontalAlignment("center").setFontWeight("bold");
    hb.getRange(fb, 5, 1, 3).setNumberFormat(PLATA);
    hb.getRange(fb, 1, 1, 10).setBorder(true, true, true, true, false, false);
    hb.getRange(fb, 1).setNote(nota(d));
  }
}
