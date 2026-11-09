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
     solos desde acá. Cada venta guarda el costo que tenía ese día: cuando
     cambian los costos, las ventas anteriores no cambian.
   - «Pedidos»: cada pedido que llega desde la página. Vos tildás «Pagado»
     cuando te paga. Solo las cajas pagadas suman para el regalo.
   - «Socios»: cada perfil, con el total de cajas pagadas y de plata.
   No hace falta tocar nada de este código. */

/* Una vez, desde el editor: pasa a «Pedidos» y «Socios» las compras que ya están en
   COMBOS MENSUALES, DIARIOS, ESPUMANTES y BOTELLAS SOLAS y no figuraban (por ejemplo, las
   que llegaron sin WhatsApp válido). No duplica: compara cuántas compras de cada tipo
   tiene cada nombre en las pestañas y en «Pedidos». También actualiza las fórmulas de «Socios». */
var NOMBRE_COMBO = { "RESERVA": "Caja Reserva", "CLASICO": "Caja Clásica", "ORIGEN": "Combo Origen", "AUTOR": "Combo Autor" };
function completarPedidosYSocios() {
  var ss = libro(), compras = [];
  function leer(nombres, tipoDe, comboDe, cantCol, montoCol) {
    nombres = [].concat(nombres);
    var h = null;
    for (var i = 0; i < nombres.length && !h; i++) h = ss.getSheetByName(nombres[i]);
    if (!h || h.getLastRow() < 2) return;
    var v = h.getRange(1, 1, h.getLastRow(), Math.max(montoCol, cantCol, 4)).getValues();
    var notas = h.getRange(1, 1, h.getLastRow(), 1).getNotes();
    for (var r = 1; r < v.length; r++) {
      var nom = String(v[r][0]).trim();
      if (!nom || /^PRUEBA/i.test(nom)) continue;
      var nt = notas[r][0] || "", fecha = (nt.match(/(\d\d)\/(\d\d)\/(\d{4})/) || []);
      compras.push({ nombre: nom === "Por WhatsApp (ver el chat)" ? "" : nom, tel: telKey((nt.match(/WhatsApp: (.*)/) || [])[1]),
        mes: (nt.match(/Caja de: (.*)/) || [])[1] || (fecha[2] ? MESES[Number(fecha[2]) - 1] : mesActual()),
        fecha: fecha[3] ? new Date(Number(fecha[3]), Number(fecha[2]) - 1, Number(fecha[1])) : new Date(),
        tipo: tipoDe, combo: comboDe(v[r]), cant: Number(v[r][cantCol - 1]) || 1, monto: Number(v[r][montoCol - 1]) || 0 });
    }
  }
  function combo(c) { c = String(c).split("\n")[0].trim(); return NOMBRE_COMBO[c] || c; }
  leer(HOJA_CAJAS, "caja", function (f) { return combo(f[2]); }, 6, 10);
  leer(HOJA_DIARIOS, "dúo", function (f) { return combo(f[2]); }, 5, 9);
  leer(HOJA_ESPUMANTES, "espumante", function (f) { return f[3] + " (caja x 6)"; }, 5, 9);
  leer(HOJA_BOTELLAS, "botella", function (f) { return f[2] + " (1 botella)"; }, 4, 5);
  /* Cuántas ya hay en «Pedidos» por nombre y tipo */
  var hp = hoja(HOJA_PEDIDOS, COL_PEDIDOS), pv = hp.getDataRange().getValues(), hay = {};
  for (var i = 1; i < pv.length; i++) { var key = norm(pv[i][2]) + "|" + pv[i][6]; hay[key] = (hay[key] || 0) + 1; }
  compras.forEach(function (c, n) {
    var key = norm(c.nombre || "Por WhatsApp (ver el chat)") + "|" + c.tipo;
    if (hay[key] > 0) { hay[key]--; return; }
    var k = telDelSocio(c.tel, c.nombre), f = hp.getLastRow() + 1;
    hp.getRange(f, 1, 1, 10).setValues([[c.fecha, k, c.nombre || "Por WhatsApp (ver el chat)", c.mes, c.combo, c.cant, c.tipo,
      c.monto, false, "planilla-" + Date.now() + "-" + n]]);
    hp.getRange(f, 9).insertCheckboxes();
    hp.getRange(f, 8).setNumberFormat("$ #,##0");
    if (c.nombre || k) guardarSocio(k, { nombre: c.nombre, accion: "planilla" });
  });
  /* Fórmulas nuevas (y columnas «Compras» y «Total comprado») para todos los socios */
  var hs = hoja(HOJA_SOCIOS, COL_SOCIOS);
  cabecerasFaltantes(hs, COL_SOCIOS);
  for (var s = 2; s <= hs.getLastRow(); s++) if (String(hs.getRange(s, 2).getValue()).trim()) formulasSocio(hs, s);
}

/* Una sola vez, desde el editor: pasa «COMBOS MENSUALES» del formato anterior
   (tintos en D–K, «¿QUIERE ROSADO O BLANCO?» en L, rosado/blanco en M–T, compra en U–W)
   al nuevo (D = ¿QUIERE…?, E–L = vinos, M–O = compra). No borra pedidos. */
function migrarCombos() {
  var ss = libro(), h = ss.getSheetByName(HOJA_CAJAS[0]) || ss.getSheetByName(HOJA_CAJAS[1]);
  if (!h || norm(h.getRange(1, 21).getValue()) !== norm("TIPO DE COMPRA")) return; /* ya está migrada */
  var ult = h.getLastRow(), a = h.getRange(1, 1, ult, 23).getValues();
  var inicios = [];
  for (var r = 2; r <= ult; r++) if (String(a[r - 1][0]).trim()) inicios.push(r);
  inicios.forEach(function (f0, i) {
    var n = (i + 1 < inicios.length ? inicios[i + 1] : ult + 1) - f0;
    var fila = a[f0 - 1];
    var vacioE = !String(fila[4]).trim(), conM = String(fila[12]).trim();
    if (vacioE && conM) {          /* rosado/blanco del formato anterior */
      h.getRange(f0, 4).setValue(fila[11]);
      h.getRange(f0, 13, n, 8).copyTo(h.getRange(f0, 5, n, 8));
    }
    unirCeldas(h, f0, 4, n);
    if (!String(fila[20]).trim()) {  /* sin las columnas de compra: se completan */
      var c = String(fila[2]).split("\n")[0].trim(), nt = h.getRange(f0, 1).getNote();
      var ad = (nt.match(/Adicionales: (.*)/) || [])[1] || "";
      var it = { adicionales: ad, regalo: /Regalo para/.test(nt) ? {} : null };
      h.getRange(f0, 21, 1, 3).setValues([columnasCompra(TIPOS[c] || c, it)]);
      [21, 22, 23].forEach(function (cc) { unirCeldas(h, f0, cc, n); });
    }
  });
  h.getRange(1, 1, 1, 12).setValues([CAB_CAJAS.slice(0, 12)]);
  h.deleteColumns(13, 8);
}

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
  congelarCostos(); /* las ventas anteriores se quedan con el costo viejo */
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
var COL_SOCIOS = ["WhatsApp", "Nombre", "Email", "Zona", "No quiere recibir", "Alta", "Cajas pagadas", "Total pagado",
  "Compras", "Total comprado"];

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
    if (String(r[6]) !== "caja" && String(r[6]) !== "dúo") continue; /* botellas y espumantes no cuentan para el regalo */
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

function nombreDe(d) { return txt(d.nombre || d.cliente, 80).trim(); }

/* Fila del socio en «Socios»: por WhatsApp y, si no hay o no coincide, por nombre */
function filaSocio(vals, k, nombre) {
  var n = norm(nombre), porNombre = 0;
  for (var i = 1; i < vals.length; i++) {
    if (k && telKey(vals[i][0]) === k) return i + 1;
    if (!porNombre && n && norm(vals[i][1]) === n) porNombre = i + 1;
  }
  return porNombre;
}

/* Si el pedido no trae un WhatsApp válido pero el nombre ya es socio, usa el de él */
function telDelSocio(k, nombre) {
  if (k || !nombre) return k;
  var vals = hoja(HOJA_SOCIOS, COL_SOCIOS).getDataRange().getValues(), f = filaSocio(vals, "", nombre);
  return f ? telKey(vals[f - 1][0]) : "";
}

/* Totales del socio: suma sus pedidos por WhatsApp y también los que quedaron sin WhatsApp a su nombre */
function formulasSocio(h, f) {
  var P = HOJA_PEDIDOS + "!";
  function suma(col, extra) {
    return 'IF(A' + f + '="",0,SUMIFS(' + P + col + ':' + col + ',' + P + 'B:B,A' + f + extra + '))+SUMIFS(' + P + col + ':' + col +
      ',' + P + 'B:B,"",' + P + 'C:C,B' + f + extra + ')';
  }
  function cuenta(extra) {
    return 'IF(A' + f + '="",0,COUNTIFS(' + P + 'B:B,A' + f + extra + '))+COUNTIFS(' + P + 'B:B,"",' + P + 'C:C,B' + f + extra + ')';
  }
  var pag = ',' + P + 'I:I,TRUE';
  h.getRange(f, 7, 1, 4).setFormulas([["=" + suma("F", ',' + P + 'G:G,"caja"' + pag), "=" + suma("H", pag),
    "=" + cuenta(',' + P + 'C:C,"<>"'), "=" + suma("H", "")]]);
  h.getRange(f, 8).setNumberFormat("$ #,##0");
  h.getRange(f, 10).setNumberFormat("$ #,##0");
}

function guardarSocio(k, d) {
  var nombre = nombreDe(d);
  if (!k && !nombre) return;
  var h = hoja(HOJA_SOCIOS, COL_SOCIOS);
  cabecerasFaltantes(h, COL_SOCIOS);
  var f = filaSocio(h.getDataRange().getValues(), k, nombre);
  if (f) {
    /* Ya existe: se completa el WhatsApp si no lo tenía; el perfil actualiza zona y preferencias */
    if (k && !telKey(h.getRange(f, 1).getValue())) h.getRange(f, 1).setValue(k);
    if (d.accion === "perfil") {
      if (d.zona) h.getRange(f, 4).setValue(txt(d.zona));
      h.getRange(f, 5).setValue(txt(d.prefs));
    }
    formulasSocio(h, f);
    return;
  }
  f = h.getLastRow() + 1;
  h.getRange(f, 1, 1, 6).setValues([[k, nombre, txt(d.email, 120), txt(d.zona), txt(d.prefs), new Date()]]);
  formulasSocio(h, f);
}

/* Anota filas en «Pedidos»: [mes, combo, cantidad, tipo, monto] por cada compra */
function anotarPedidos(k, nombre, id, compras) {
  if (!compras.length) return;
  var h = hoja(HOJA_PEDIDOS, COL_PEDIDOS), ahora = new Date();
  var filas = compras.map(function (c, n) {
    return [ahora, k, nombre || "Por WhatsApp (ver el chat)", c[0], c[1], c[2], c[3], c[4], false, id + "-" + n];
  });
  var desde = h.getLastRow() + 1;
  h.getRange(desde, 1, filas.length, filas[0].length).setValues(filas);
  h.getRange(desde, 9, filas.length, 1).insertCheckboxes();
  h.getRange(desde, 8, filas.length, 1).setNumberFormat("$ #,##0");
}

function guardarPedido(k, d) {
  var h = hoja(HOJA_PEDIDOS, COL_PEDIDOS);
  var id = txt(d.id, 40) || "p" + Date.now();
  var ids = h.getLastRow() > 1 ? h.getRange(2, 10, h.getLastRow() - 1, 1).getValues() : [];
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]).indexOf(id + "-") === 0) return; /* ya llegó */
  var items = Array.isArray(d.items) ? d.items.slice(0, 20) : [];
  if (!items.length) return;
  /* Primero, con el formato de tu Excel */
  items.forEach(function (it) {
    try {
      if (it.mensual === false) bloqueDuo(d, it); else bloqueCaja(d, it);
    } catch (err) { /* si falla el formato, igual queda en «Pedidos» */ }
  });
  /* Todos los pedidos van a «Pedidos» y «Socios», aunque el WhatsApp venga mal */
  var nombre = nombreDe(d);
  k = telDelSocio(k, nombre);
  anotarPedidos(k, nombre, id, items.map(function (it) {
    return [txt(it.m, 30), txt(it.c, 120), Math.max(1, Math.min(10, Number(it.n) || 1)),
      it.mensual === false ? "dúo" : "caja", Number(it.price) || 0];
  }));
  guardarSocio(k, d);
}

/* Mes en que se compró (para botellas y espumantes) */
var MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
function mesActual() {
  return MESES[(Number(Utilities.formatDate(new Date(), "America/Argentina/Buenos_Aires", "M")) || 1) - 1];
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

/* Cajas: un solo grupo de vinos (E a L) y «¿QUIERE ROSADO O BLANCO?» en D */
var CAB_CAJAS = ["CLIENTE", "DIRECCION", "COMBO", "¿QUIERE ROSADO O BLANCO?", "VINOS", "CANTIDAD", "PRECIO VTA", "COSTO",
  "GANANCIA P/BOTELLA", "PRECIO COMBO", "COSTO COMBO", "GANANCIA COMBO", "TIPO DE COMPRA", "¿CHARCUTERÍA O CRISTALERÍA?", "¿ES PARA REGALO?"];
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

/* Congela el costo de las ventas: donde la fórmula que busca en «COSTOS» ya
   encontró el vino, deja el número fijo. Si el vino todavía no está (por ejemplo
   «sorpresa (completar)»), la fórmula queda hasta que se complete. */
function congelar(r) {
  SpreadsheetApp.flush();
  var fo = r.getFormulas(), va = r.getValues();
  for (var i = 0; i < fo.length; i++) for (var j = 0; j < fo[i].length; j++) {
    if (fo[i][j].indexOf("'" + HOJA_COSTOS + "'!") >= 0 && typeof va[i][j] === "number") {
      r.getCell(i + 1, j + 1).setValue(va[i][j]);
    }
  }
}

/* Para correr desde el editor (y lo corre solo actualizarCostos antes de cargar
   costos nuevos): congela el costo de todas las ventas ya anotadas. */
function congelarCostos() {
  var ss = libro();
  [].concat(HOJA_CAJAS, HOJA_DIARIOS, HOJA_ESPUMANTES, HOJA_BOTELLAS).forEach(function (n) {
    var h = ss.getSheetByName(n);
    if (h && h.getLastRow() > 1) congelar(h.getRange(2, 1, h.getLastRow() - 1, h.getLastColumn()));
  });
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
  congelar(h.getRange(f0, col + 3, n, 1));
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
  var b = bloque(h, d, it, clave, vinos, 5, CAB_CAJAS.length - 2);
  h.getRange(b.fila, 4).setValue(v.texto);
  unirCeldas(h, b.fila, 4, b.filas);
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
  /* También a «Pedidos» y «Socios» (no suman para el regalo de las cajas) */
  var k = telDelSocio(telKey(d.tel), nombreDe(d));
  anotarPedidos(k, nombreDe(d), "e" + Date.now(), [[mesActual(), nombre + (cant === 6 ? " (caja x 6)" : " (1 botella)"), cant,
    cant === 6 ? "espumante" : "botella", cant === 6 ? (Number(d.precio6) || 0) * 6 : Number(d.precio) || 0]]);
  guardarSocio(k, d);
  if (cant === 6) {
    var h = hojaFormato(HOJA_ESPUMANTES, CAB_ESPUMANTES), f = h.getLastRow() + 1;
    h.getRange(f, 1, 1, 11).setValues([[cliente(d), direccion(d), nombre, nombre, 6, Number(d.precio6) || "", costo("D" + f),
      '=IF(G' + f + '="","",F' + f + "-G" + f + ")", "=E" + f + "*F" + f,
      '=IF(G' + f + '="","",E' + f + "*G" + f + ")", '=IF(J' + f + '="","",I' + f + "-J" + f + ")"]]);
    h.getRange(f, 12, 1, 3).setValues([columnasCompra("ESPUMANTE CAJA x 6", d)]).setHorizontalAlignment("center").setFontWeight("bold");
    congelar(h.getRange(f, 7));
    h.getRange(f, 6, 1, 6).setNumberFormat(PLATA);
    h.getRange(f, 1, 1, 14).setBorder(true, true, true, true, false, false);
    h.getRange(f, 1).setNote(nota(d));
  } else {
    var hb = hojaFormato(HOJA_BOTELLAS, CAB_BOTELLAS), fb = hb.getLastRow() + 1;
    hb.getRange(fb, 1, 1, 7).setValues([[cliente(d), direccion(d), nombre, 1, Number(d.precio) || "", costo("C" + fb),
      '=IF(F' + fb + '="","",E' + fb + "-F" + fb + ")"]]);
    hb.getRange(fb, 8, 1, 3).setValues([columnasCompra("BOTELLA INDIVIDUAL", d)]).setHorizontalAlignment("center").setFontWeight("bold");
    congelar(hb.getRange(fb, 6));
    hb.getRange(fb, 5, 1, 3).setNumberFormat(PLATA);
    hb.getRange(fb, 1, 1, 10).setBorder(true, true, true, true, false, false);
    hb.getRange(fb, 1).setNote(nota(d));
  }
}

/* ===== CIERRE DE CAJA =====
   Para correr desde el editor (o cuando quieran cerrar el mes): arma la hoja
   «CIERRE DE CAJA», una fila por mes, con lo que entró, lo que costaron los vinos
   y la ganancia. Los números de ventas y costos quedan fijos (se recalculan solo
   cuando se vuelve a correr). Los gastos se anotan a mano en la hoja «GASTOS»
   (Fecha · Concepto · Monto) y se restan solos. */
var HOJA_CIERRE = "CIERRE DE CAJA";
var HOJA_GASTOS = "GASTOS";
var CANT_SOCIOS = 3;
var CAB_CIERRE = ["MES", "COMBOS MENSUALES", "DIARIOS", "ESPUMANTES", "BOTELLAS SOLAS", "VENTAS TOTALES",
  "COBRADO", "FALTA COBRAR", "COSTO VINOS", "GANANCIA BRUTA", "MARGEN", "GASTOS", "GANANCIA NETA",
  "POR SOCIO (÷" + CANT_SOCIOS + ")"];

function cierreDeCaja() {
  var ss = libro(), meses = {}, orden = [];
  function mes(k) {
    if (!meses[k]) { meses[k] = { v: [0, 0, 0, 0], costo: 0, cobrado: 0, pedidos: 0 }; orden.push(k); }
    return meses[k];
  }
  function clave(fecha) {
    if (fecha instanceof Date) return MESES[fecha.getMonth()] + " " + fecha.getFullYear();
    var m = String(fecha || "").match(/(\d\d)\/(\d\d)\/(\d{4})/);
    return m ? MESES[Number(m[2]) - 1] + " " + m[3] : "Sin fecha";
  }
  [[HOJA_CAJAS, 0], [HOJA_DIARIOS, 1], [HOJA_ESPUMANTES, 2], [HOJA_BOTELLAS, 3]].forEach(function (x) {
    var h = null;
    [].concat(x[0]).forEach(function (n) { h = h || ss.getSheetByName(n); });
    if (!h || h.getLastRow() < 2) return;
    var v = h.getDataRange().getValues(), notas = h.getRange(1, 1, v.length, 1).getNotes();
    var cab = v[0].map(norm), c = function (n) { return cab.indexOf(norm(n)); };
    var cV = c("PRECIO COMBO"), cC = c("COSTO COMBO"), cP = c("PRECIO VTA"), cK = c("COSTO"), cN = c("CANTIDAD");
    for (var r = 1; r < v.length; r++) {
      if (!String(v[r][0]).trim()) continue; /* solo la primera fila de cada pedido */
      var venta = cV >= 0 ? Number(v[r][cV]) || 0 : (Number(v[r][cP]) || 0) * (Number(v[r][cN]) || 1);
      var costo = cC >= 0 ? Number(v[r][cC]) || 0 : (Number(v[r][cK]) || 0) * (Number(v[r][cN]) || 1);
      var m = mes(clave(notas[r][0]));
      m.v[x[1]] += venta; m.costo += costo;
    }
  });
  var hp = ss.getSheetByName(HOJA_PEDIDOS);
  if (hp && hp.getLastRow() > 1) {
    hp.getRange(2, 1, hp.getLastRow() - 1, 9).getValues().forEach(function (p) {
      if (p[8] === true) mes(clave(p[0])).cobrado += Number(p[7]) || 0;
    });
  }
  var g = ss.getSheetByName(HOJA_GASTOS);
  if (!g) {
    g = ss.insertSheet(HOJA_GASTOS);
    g.getRange(1, 1, 2, 3).setValues([["FECHA", "CONCEPTO", "MONTO"], [new Date(), "Suscripción Claude Pro", ""]]);
    g.getRange(1, 1, 1, 3).setFontWeight("bold"); g.setFrozenRows(1);
    g.getRange("A:A").setNumberFormat("dd/MM/yyyy"); g.getRange("C:C").setNumberFormat(PLATA);
  }
  var h = ss.getSheetByName(HOJA_CIERRE) || ss.insertSheet(HOJA_CIERRE, 0);
  h.clear();
  h.getRange(1, 1, 1, CAB_CIERRE.length).setValues([CAB_CIERRE]).setFontWeight("bold").setWrap(true);
  h.setFrozenRows(1);
  orden.sort(function (a, b) {
    function n(k) { var p = k.split(" "); return p.length < 2 ? 1e9 : Number(p[1]) * 12 + MESES.indexOf(p[0]); }
    return n(a) - n(b);
  });
  var filas = orden.map(function (k, i) {
    var m = meses[k], f = i + 2, tot = m.v[0] + m.v[1] + m.v[2] + m.v[3];
    var mi = MESES.indexOf(k.split(" ")[0]) + 1, an = k.split(" ")[1], G = "'" + HOJA_GASTOS + "'!";
    var gastos = k === "Sin fecha" ? 0 : "=SUMIFS(" + G + "C:C," + G + "A:A,\">=\"&DATE(" + an + "," + mi + ",1)," +
      G + "A:A,\"<\"&DATE(" + an + "," + (mi + 1) + ",1))";
    return [k, m.v[0], m.v[1], m.v[2], m.v[3], tot, m.cobrado, "=F" + f + "-G" + f, m.costo,
      "=F" + f + "-I" + f, "=IF(F" + f + "=0,\"\",J" + f + "/F" + f + ")", gastos, "=J" + f + "-L" + f,
      "=M" + f + "/" + CANT_SOCIOS];
  });
  if (filas.length) {
    h.getRange(2, 1, filas.length, CAB_CIERRE.length).setValues(filas);
    var t = filas.length + 2;
    h.getRange(t, 1).setValue("TOTAL").setFontWeight("bold");
    ["B", "C", "D", "E", "F", "G", "H", "I", "J", "L", "M", "N"].forEach(function (l) {
      h.getRange(l + t).setFormula("=SUM(" + l + "2:" + l + (t - 1) + ")").setFontWeight("bold");
    });
    h.getRange("K" + t).setFormula("=IF(F" + t + "=0,\"\",J" + t + "/F" + t + ")").setFontWeight("bold");
    h.getRange(2, 2, t - 1, 10).setNumberFormat(PLATA);
    h.getRange(2, 12, t - 1, 3).setNumberFormat(PLATA);
    h.getRange(2, 11, t - 1, 1).setNumberFormat("0%");
  }
  h.getRange(1, 1).setNote("Actualizado: " + Utilities.formatDate(new Date(), "America/Argentina/Buenos_Aires", "dd/MM/yyyy HH:mm") +
    "\nVentas y costos salen de COMBOS MENSUALES, DIARIOS, ESPUMANTES y BOTELLAS SOLAS (por fecha del pedido)." +
    "\nCobrado: pedidos con «Pagado» tildado. Gastos: hoja GASTOS.");
}
