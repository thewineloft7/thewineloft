/* =====================================================================
   THE WINE LOFT · TUS DATOS
   =====================================================================

   Este es el único archivo que tenés que tocar para cambiar la página.
   Se abre con el Bloc de notas (clic derecho > Abrir con > Bloc de notas).
   No le hagas doble clic: Windows intenta ejecutarlo y muestra un error.
   La guía completa está en LEEME.txt (vino junto con la página).

   REGLAS PARA NO ROMPER NADA
   1. Cambiá solo lo que está ENTRE COMILLAS "así".
   2. No borres las comillas, las comas del final ni las llaves { } [ ].
   3. Si un dato no lo tenés, dejalo vacío así: ""  (la página lo oculta).
   4. Para que una parte del texto salga en CURSIVA, ponela entre
      asteriscos: "Un club de vinos con *acento del Litoral.*"
   5. Si querés usar comillas dentro de un texto, usá estas: « »
   6. Guardá (Ctrl + G o Ctrl + S) y volvé a abrir index.html.

   Si algo se rompe, la página igual muestra los textos originales:
   mirá las comillas y las comas de lo último que cambiaste.
   ===================================================================== */

window.__BRAND__ = {

  /* ------------------------------------------------------------------
     1. CONTACTO
     ------------------------------------------------------------------ */

  nombre: "The Wine Loft",
  ciudad: "Paraná, Entre Ríos",

  // WhatsApp: SOLO NÚMEROS, con 549 + característica sin el 0 + número sin el 15.
  // Ejemplo para Paraná (343): "5493434123456"
  whatsapp: "",

  instagram: "",   // Solo el usuario, sin @. Ejemplo: "thewineloft"
  email: "",       // Ejemplo: "hola@thewineloft.com.ar"

  // Avisos a tu mail: cada perfil nuevo, cada cambio de «no quiero
  // recibir» y una copia de cada pedido. Pegá acá la clave («Access Key»)
  // que te da web3forms.com (gratis). Vacío ("") = no se manda nada.
  claveAvisos: "",

  // Franja rosa de arriba de todo. Vacío ("") = no se muestra.
  aviso: "Sitio en preparación: todavía no se cobra online ni se envían pedidos.",

  /* ------------------------------------------------------------------
     2. EL MES
     Las fechas van así: "AAAA-MM-DD"  (año-mes-día).
     La página calcula sola si las reservas de las cajas están abiertas.
     ------------------------------------------------------------------ */

  mes: "octubre",
  anio: "2026",
  reservasDesde: "2026-10-01",
  reservasHasta: "2026-10-03",

  // Cómo se lee la regla del club en toda la página.
  reservas: "1 al 3",       // días para reservar la caja
  pago: "hasta el 6",       // hasta qué día se puede pagar
  entregas: "7 al 10",      // días de entrega

  // Cada cuántas cajas del mes llega el regalo sorpresa.
  regaloCada: "5",

  /* ------------------------------------------------------------------
     3. COMBOS Y VINOS
     tipo: "caja" = se reserva del 1 al 3 y suma para el regalo.
           "duo"  = se pide cualquier día del mes.
     precio: sin puntos ni signo $.
     agotado: "si" = se sigue mostrando, marcado «Sold out», sin opción
           de compra. "" = a la venta.
     foto: una foto de la carpeta assets/img (vacío = espacio marcado
           «IMAGEN AQUÍ»). Las fotos se ven siempre completas.
     linkPago: el link de pago de Mercado Pago de ese combo (opcional).
     Cada vino: nombre, varietal (con año), región, nota a mano y foto
     de la botella (la que aparece al pasar el mouse en los dúos).
     ------------------------------------------------------------------ */

  combos: [
    {
      id: "reserva",
      nombre: "Caja Reserva",
      tipo: "caja",
      precio: "70000",
      botellas: "4",
      descripcion: "Cuatro vinos con más guarda y más historia.",
      destacado: "La más pedida",
      agotado: "si",
      agotadoTexto: "Esta caja ya no se vende. La dejamos acá para que conozcas lo que trajo.",
      foto: "caja-reserva-octubre.webp",
      fotoTexto: "Los cuatro vinos de la Caja Reserva de octubre en la biblioteca del loft: Corazón Valiente, Calivista, Chañarmuyo y Tükma",
      linkPago: "",
      vinos: [
        { nombre: "Chañarmuyo", varietal: "Malbec 2022", region: "La Rioja", nota: "Este pide asado.", foto: "" },
        { nombre: "Tükma Reserva", varietal: "Cabernet Sauvignon 2022", region: "Salta", nota: "Abrilo media hora antes.", foto: "" }
      ]
    },
    {
      id: "clasica",
      nombre: "Caja Clásica",
      tipo: "caja",
      precio: "55000",
      botellas: "4",
      descripcion: "Cuatro vinos para todos los días, bien elegidos.",
      destacado: "",
      agotado: "",
      foto: "",
      fotoTexto: "Los vinos de la Caja Clásica sobre la mesa, foto vertical",
      linkPago: "",
      vinos: [
        { nombre: "Tinto a confirmar", varietal: "Varietal", region: "Región", nota: "Nota del que eligió.", foto: "" },
        { nombre: "Tinto a confirmar", varietal: "Varietal", region: "Región", nota: "Nota del que eligió.", foto: "" }
      ]
    },
    {
      id: "duo-reserva",
      nombre: "Combo Autor",
      tipo: "duo",
      precio: "25000",
      botellas: "2",
      descripcion: "Dos vinos para una ocasión que lo merece.",
      destacado: "",
      agotado: "",
      foto: "duo-reserva-cielo.webp",
      fotoTexto: "Marioneta Malbec y 13 Clés Malbec",
      linkPago: "",
      vinos: [
        { nombre: "Marioneta", varietal: "Malbec", region: "Mendoza", nota: "Pide pizza casera.", foto: "v-marioneta-recorte.webp" },
        { nombre: "13 Clés", varietal: "Malbec", region: "Argentina", nota: "Guardalo para el domingo.", foto: "v-13cles-recorte.webp" }
      ]
    },
    {
      id: "duo-clasico",
      nombre: "Combo Origen",
      tipo: "duo",
      precio: "18500",
      botellas: "2",
      descripcion: "Dos vinos para la cena de esta noche.",
      destacado: "",
      agotado: "",
      foto: "duo-clasico-cielo.webp",
      fotoTexto: "Tepeyac Reserva Malbec y Criolla Argentina Tinta",
      linkPago: "",
      vinos: [
        { nombre: "Tepeyac Reserva", varietal: "Malbec", region: "Mendoza", nota: "Para el asado del sábado.", foto: "v-tepeyac-recorte.webp" },
        { nombre: "Criolla Argentina", varietal: "Tinta · Bodega Niven 2025", region: "Mendoza", nota: "Con algo para picar.", foto: "v-criolla-recorte.webp" }
      ]
    }
  ],

  // Lo que la gente puede pedir que NO le toque en las sorpresas.
  preferencias: ["Sin blancos", "Sin rosados", "Sin espumantes"],

  // Zonas de entrega (aparecen en el formulario del pedido).
  zonas: ["Paraná", "Alrededores de Paraná", "Interior de Entre Ríos"],

  // Adicionales que se ofrecen en el último paso del pedido.
  // precio: sin puntos ni $. Vacío ("") = dice «precio a confirmar».
  adicionales: {
    charcuteria: { nombre: "Charcutería", detalle: "Salame y queso", precio: "" },
    cristaleria: { nombre: "Cristalería", detalle: "Una copa de cristal", precio: "" },
    regalo: {
      nombre: "Para regalo",
      detalle: "Lo enviamos a donde nos indiques, con una carta de feliz cumpleaños. Incluye charcutería o cristalería, el que elijas (o los dos: el segundo se suma aparte).",
      precio: ""
    }
  },

  /* ------------------------------------------------------------------
     4. FOTOS DE LA PÁGINA
     Vacío ("") = se ve el espacio marcado «IMAGEN AQUÍ» con lo que
     conviene fotografiar. Cuando tengas la foto, copiala en assets/img
     y escribí su nombre. Las fotos se ven siempre completas.
     ------------------------------------------------------------------ */

  fotos: {
    // Portada: foto de fondo detrás del título, con una capa azul noche
    // encima para que se lea bien (ideal: foto horizontal, de paisaje)
    portada: "portada-vinedo.webp",
    portadaTexto: "Viñedo al atardecer, con las hileras de vides hacia el horizonte",

    // «Vinos por estación»: una foto por estación (ideal: verticales)
    est1: "est-verano-uvas.webp",
    est1Texto: "Verano: racimo de uvas blancas en una vid vieja, al sol de la tarde",
    est2: "est-otono-uvas.webp",
    est2Texto: "Otoño: hojas rojas y doradas en el viñedo",
    est3: "est-invierno-uvas.webp",
    est3Texto: "Invierno: una mano junto a un racimo de uvas tintas",
    est4: "est-primavera-uvas.webp",
    est4Texto: "Primavera: racimo de uvas que empiezan a tomar color",

    // Bloque «Este mes, que el vino lo elija otro.»: foto de fondo detrás
    // del título, con capa azul noche (puede recortar los bordes)
    momento: "momento-duos-fondo.webp",
    momentoTexto: "Los vinos de los dúos de octubre sobre la mesa del loft: Tepeyac, 13 Clés, Criolla Argentina y Marioneta",

    // Bloque «Regalá un mes de vino» (ideal: vertical)
    regalo: "regalo-loft.webp",
    regaloTexto: "Una botella con la faja de cuero azul de The Wine Loft",

    // Fondo de la frase destacada (ideal: horizontal y oscura)
    cita: "",
    citaTexto: "Foto horizontal oscura: vino sirviéndose en una copa, en primer plano",

    // Cierre, antes del pie (ideal: horizontal)
    cierre: "",
    cierreTexto: "Paisaje del Litoral: el río Paraná al atardecer, foto horizontal"
  },

  /* ------------------------------------------------------------------
     5. MENSAJES DE WHATSAPP
     {combo}, {mes}, {total}, {sorpresas}, {adicionales}, {regalo},
     {direccion}, {nombre}, {telefono} y {proximoMes} se completan solos. \n = salto de línea.
     pedido = un solo combo. pedidoVarios = cuando suman más de un combo
     distinto ({detalle} es la lista de combos, uno por renglón).
     ------------------------------------------------------------------ */

  mensajes: {
    pedido: "Hola! Quiero pedir la {combo} de {mes} ({total}).\nSorpresas: {sorpresas}.\nAdicionales: {adicionales}.{regalo}\nMis datos: {direccion}.\nNombre: {nombre} · WhatsApp: {telefono}",
    pedidoVarios: "Hola! Quiero hacer este pedido de {mes} ({total}):\n{detalle}\nNombre: {nombre} · WhatsApp: {telefono}",
    avisame: "Hola! Quiero que me avisen cuando abran las reservas de la caja de {proximoMes}. Me interesa la {combo}.",
    consulta: "Hola! Quiero saber más sobre The Wine Loft."
  },

  /* ------------------------------------------------------------------
     6. TEXTOS DE LA PÁGINA (de arriba hacia abajo)
     ------------------------------------------------------------------ */

  textos: {
    // Portada
    portadaTitulo: "Un club de vinos con *acento del Litoral.*",

    // El club: la caja del mes
    cajaEtiqueta: "El club · La caja del mes",
    cajaTitulo: "Cuatro vinos, *dos sorpresas.*",
    cajaTexto: "Cada mes elegimos cuatro vinos por vos y te los llevamos a casa. Dos tintos te los contamos de antemano; los otros dos llegan como sorpresa.",
    cajaNota: "Si no querés blancos, rosados o espumantes, lo marcás al reservar y no te tocan.",

    // La regla del club (franja clara con los números grandes)
    reglaEtiqueta: "La regla del club",
    reglaReserva: "Reservás hasta el",
    reglaPago: "pagás hasta el",
    reglaTitulo: "Reservás hasta el 3, pagás hasta el 6.",
    reglaTexto: "Del 1 al 3 de cada mes reservás tu caja. Tenés tiempo hasta el 6 para pagarla con Mercado Pago, y del 7 al 10 te la llevamos a casa.",

    // Dúos
    duosTitulo: "Dúos.",
    duosTexto: "Dos vinos elegidos por nosotros, para pedir cualquier día del mes. También cambian todos los meses.",
    duosAclaracion: "Los dúos van por fuera del club: no tienen fechas de reserva ni sorpresas, y no suman para el regalo sorpresa. Los pedís cualquier día del mes.",

    // Vinos por estación. texto = cómo son los vinos de esa época;
    // uvas = las variedades de ejemplo, separadas por coma o por «y».
    estacionesTitulo: "Vinos por *estación.*",
    estacionesTexto: "Qué uvas acompañan mejor cada época del año.",
    estaciones: [
      { nombre: "Verano", meses: "Diciembre a febrero",
        texto: "Acidez alta, poco cuerpo y bien fríos. Con el calor, lo que pide el cuerpo es refrescarse.",
        uvas: "Chardonnay sin barrica y Criolla Chica" },
      { nombre: "Otoño", meses: "Marzo a mayo",
        texto: "Cuerpo medio, frutados y con taninos amables, para pastas, carnes al horno y hongos.",
        uvas: "Malbec y Pinot Noir" },
      { nombre: "Invierno", meses: "Junio a agosto",
        texto: "Cuerpo pleno, taninos firmes y crianza en madera, a la altura del locro, los guisos y el cordero.",
        uvas: "Cabernet Sauvignon y Tannat" },
      { nombre: "Primavera", meses: "Septiembre a noviembre",
        texto: "Frescos, aromáticos y livianos, para una cocina más verde y ligera que no canse el paladar.",
        uvas: "Torrontés y Sauvignon Blanc" }
    ],

    // «Este mes, que el vino lo elija otro.»
    momentoTitulo: "Este mes, que el vino *lo elija otro.*",

    // Regalá (bloque de regalo)
    regaloTitulo: "Regalá un mes de *vino.*",
    regaloTexto: "Elegí tu caja o tu dúo y marcá «Para regalo» al pedirlo. Lo enviamos a donde nos indiques, con una carta de feliz cumpleaños y charcutería o cristalería incluida (o las dos).",
    regaloNota: "mejor que otra corbata",

    // Tu perfil en el club (en «Cómo funciona»: el regalo sorpresa).
    // En el celular se ve en «Mi perfil». clubTextoPerfil es el texto
    // que ve quien ya tiene perfil.
    // Si cambiás regaloCada, cambiá también «cinco» y «la quinta».
    clubEtiqueta: "Tu perfil en el club",
    clubTitulo: "Cada caja *suma.*",
    clubTexto: "Creá tu perfil y seguí tus cajas del mes. Al completar cinco, te llevamos un regalo sorpresa junto con la quinta.",
    clubTextoPerfil: "Seguí acá tus cajas del mes. Al completar cinco, te llevamos un regalo sorpresa junto con la quinta.",
    clubNota: "no te vamos a decir qué es",

    // Preguntas frecuentes (pregunta y respuesta)
    preguntasTitulo: "Preguntas *frecuentes.*",
    preguntasNota: "y si no está acá, escribinos",
    preguntas: [
      { p: "¿Cuándo reservo la caja del mes?", r: "Del 1 al 3 de cada mes. Tenés hasta el 6 para pagarla con Mercado Pago y te la llevamos del 7 al 10." },
      { p: "¿Y los dúos?", r: "Los dúos van por fuera del club: no tienen fechas de reserva, los pedís cualquier día del mes. Son dos vinos elegidos por nosotros y cambian todos los meses." },
      { p: "¿A dónde envían?", r: "A Paraná y alrededores, y al interior de Entre Ríos. Al cargar tu dirección te confirmamos el costo de envío." },
      { p: "¿Puedo elegir qué no me toque?", r: "Sí. Al reservar marcás si no querés blancos, rosados o espumantes, y armamos tus dos sorpresas con eso en cuenta." },
      { p: "¿Cómo funciona el regalo sorpresa del club?", r: "Cada caja del mes que recibís suma una marca en tu perfil. Con la quinta, llega el regalo sorpresa." },
      { p: "¿Puedo regalar una caja?", r: "Sí. Al pedir, marcá «Para regalo»: lo enviamos a donde nos indiques, con una carta de feliz cumpleaños, e incluye charcutería (salame y queso) o cristalería (una copa de cristal), el que elijas. Si querés los dos, el segundo se suma como adicional." },
      { p: "¿Qué adicionales puedo sumar?", r: "Charcutería (salame y queso) y cristalería (una copa de cristal). Los elegís en el último paso del pedido, antes de confirmar." }
    ],

    // Frase destacada
    cita: "Abrí uno el jueves, guardá otro para el domingo.",
    citaFirma: "Nota del que eligió",

    // Cierre y pie
    cierreTitulo: "Reservá tu caja *antes del 3.*",
    pieTitulo: "Un club de vinos con acento del Litoral.",
    pieTexto: "Cada mes elegimos cuatro vinos por vos y te los llevamos a casa. Sin catálogo infinito y sin palabras que intimidan.",

    // Pedido (paso «¿Dónde te la llevamos?»)
    envioTexto: "Enviamos a Paraná, alrededores y el interior de Entre Ríos."
  }
};
