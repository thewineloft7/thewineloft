/* The Wine Loft · planilla del club
   Se pega en la planilla de Google: Extensiones → Apps Script.
   Los pasos completos están en planilla/LEEME-planilla.txt.

   Crea sola dos hojas:
   - «Pedidos»: cada pedido que llega desde la página. Vos tildás «Pagado»
     cuando te paga. Solo las cajas pagadas suman para el regalo.
   - «Socios»: cada perfil, con el total de cajas pagadas y de plata.
   No hace falta tocar nada de este código. */

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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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

/* Para probar desde el editor: crea las dos hojas */
function preparar() {
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

/* La página manda un perfil nuevo (o cambiado) o un pedido */
function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false }); }
  var k = telKey(d.tel);
  if (!k) return json({ ok: false, error: "tel" });
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (d.accion === "perfil") guardarSocio(k, d);
    else if (d.accion === "pedido") guardarPedido(k, d);
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
