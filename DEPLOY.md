# The Wine Loft · cómo publicar la página (3 formas, elegí una)

La carpeta ya está lista para subir **tal cual**. No hay que compilar nada ni configurar nada.
Es una página estática: `index.html`, `datos.js`, `main.js`, `styles.css` y la carpeta `assets`.

---

## Forma 1 (recomendada): que lo haga tu Claude

1. Abrí **Claude Code** en esta carpeta (la que tiene `index.html`).
   En la app de Claude: pestaña **Code** → **Open folder** → elegí esta carpeta.
2. Pegale esto:

```
Leé CLAUDE.md y publicá este sitio en Vercel siguiendo exactamente esos pasos.
Cuando termine, pasame la URL y verificá que /datos.js y /assets/img/logo.webp respondan 200.
```

3. En algún momento te va a abrir el navegador para que entres a Vercel (`vercel login`).
   Si no tenés cuenta, creala ahí mismo con tu Google o tu email. Es gratis.
4. Cuando termine te da una dirección tipo `https://thewineloft.vercel.app`. Esa es tu página.

**Para subir cambios después** (cada mes, cuando edites `datos.js`), le decís a Claude:
```
Publicá los cambios con vercel --prod
```
o lo corrés vos en la terminal, parado en la carpeta: `vercel --prod`

---

## Forma 2: sin Claude ni terminal, arrastrando la carpeta

1. Entrá a https://vercel.com y creá tu cuenta (Google o email).
2. Entrá a https://vercel.com/drop y arrastrá **esta carpeta completa** (la que tiene `index.html` adentro).
3. Nombre del proyecto: `thewineloft`. Tocá **Deploy**. En un minuto tenés la URL.
4. Para subir un cambio después: entrá a vercel.com → tu proyecto `thewineloft` → arrastrá
   la **carpeta completa** de nuevo sobre la página del proyecto. **No uses vercel.com/drop
   otra vez** (crea otro proyecto con otra dirección).

---

## Forma 3: GitHub + Vercel (se publica solo con cada cambio)

Es lo más cómodo a largo plazo, pero necesita cuenta de GitHub. Tu Claude lo hace solo
con la sección "Opcional: git + GitHub" de `CLAUDE.md`. Después, cada vez que guardás un
cambio y hacés `git push`, Vercel publica solo.

---

## Antes de publicar (una sola vez), está en LEEME.txt, parte 3
- Tu número de WhatsApp en `datos.js` → `whatsapp: "549..."`
- Tu Instagram → `instagram: "tuusuario"`
- La clave de web3forms para avisos por mail → `claveAvisos: "..."`
- Sacar el cartel rosa → `aviso: ""`

Si todavía no tenés el número, publicá igual: la página queda en "modo prueba" y después la volvés a subir.

## Tu dominio .com.ar
Paso a paso en `LEEME.txt`, parte 9 C. En resumen: en Vercel → Settings → Domains → Add,
y en NIC.ar delegás a `ns1.vercel-dns.com` y `ns2.vercel-dns.com`.

## Una aclaración sobre el plan
El plan gratis de Vercel (Hobby) es para uso personal. Como el club vende, lo formal es el plan
Pro (USD 20/mes). Si no querés pagar, **Cloudflare Pages es gratis y permite uso comercial**:
se sube arrastrando esta misma carpeta (está explicado en `LEEME.txt`, parte 9 D). Nada cambia
en los archivos: sirven para los dos.

## Qué hay en la carpeta (y qué no tocar)
| Archivo | Para qué | ¿Lo toco? |
|---|---|---|
| `datos.js` | WhatsApp, combos, precios, textos, fotos | **Sí, es el único** |
| `index.html`, `main.js`, `styles.css` | La página en sí | No |
| `assets/img/` | Fotos y logo | Solo para agregar fotos |
| `vercel.json` | Le dice a Vercel cómo servir y cachear | No |
| `.vercelignore`, `.gitignore` | Qué no subir | No |
| `.htaccess`, `_headers` | Por si algún día la subís a Hostinger / Netlify / Cloudflare | No |
| `CLAUDE.md` | Instrucciones para tu Claude | No |
| `LEEME.txt` | La guía completa de uso de la página | Leela |
