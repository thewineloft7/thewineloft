# The Wine Loft · instrucciones para Claude Code

Este proyecto es una **página estática**: `index.html` + `datos.js` + `main.js` + `styles.css` + `assets/img`.
**No tiene build, no tiene framework, no tiene package.json, no tiene variables de entorno.**
Se publica tal cual en **Vercel** desde esta misma carpeta usando la CLI de Vercel.

## Qué NO hacer
- No crear `package.json`, no instalar frameworks, no "modernizar" nada.
- No mover `index.html` a una subcarpeta (`public/`, `dist/`, `src/`): tiene que quedar en la raíz.
- No borrar `vercel.json`, `.vercelignore`, `.gitignore`, `.htaccess` ni `_headers`.
- No tocar `main.js` ni `styles.css` salvo que el dueño lo pida. Los datos de la página se editan solo en `datos.js`.
- No usar `vercel.com/drop` ni `vercel dev` para publicar: el deploy es con `vercel --prod` (abajo).

## Deploy (la primera vez)

Ejecutar **desde la raíz de esta carpeta** (donde está `index.html`), en este orden:

```bash
# 1. CLI de Vercel (necesita Node.js >= 18 instalado; si no está, instalarlo desde nodejs.org LTS)
npm install -g vercel

# 2. Iniciar sesión en Vercel (abre el navegador; el dueño elige entrar con GitHub, Google o email)
vercel login

# 3. Publicar a producción
vercel --prod --yes --name thewineloft
```

Qué va a preguntar la CLI la primera vez (y qué contestar):
- `Set up and deploy?` → **Y**
- `Which scope?` → la cuenta personal del dueño (la única opción si no tiene equipos)
- `Link to existing project?` → **N**
- `What's your project's name?` → `thewineloft`
- `In which directory is your code located?` → `./` (Enter)
- Si detecta "Other" como framework y pregunta por build/output: **dejar todo vacío** (Enter). No hay build.

Resultado: una URL `https://thewineloft.vercel.app` (o `thewineloft-xxxx.vercel.app` si el nombre está tomado).
Eso deja una carpeta `.vercel/` con el link al proyecto; **no borrarla** (está en `.gitignore`, no se sube a git).

## Deploy (cada vez que cambia algo, por ejemplo todos los meses)

```bash
vercel --prod
```

Listo. Misma URL, versión nueva, en menos de un minuto. Sube siempre la carpeta completa.

## Verificación después del deploy
1. Abrir la URL que devolvió la CLI. Tiene que aparecer la pregunta «¿Sos mayor de 18 años?».
2. `curl -I https://<url>/datos.js` tiene que devolver `200` y `cache-control: no-cache, must-revalidate`.
3. `curl -I https://<url>/assets/img/logo.webp` tiene que devolver `200` y `cache-control: public, max-age=2592000`.
4. Si el dueño ya cargó su WhatsApp en `datos.js`, hacer un pedido de prueba desde el celular.

## Opcional: dejarlo en git + GitHub para deploy automático
Si el dueño quiere que cada `git push` publique solo:
```bash
git init -b main
git add -A
git commit -m "The Wine Loft: sitio estático listo para Vercel"
```
Luego crear un repo vacío en GitHub, hacer `git remote add origin <url>` y `git push -u origin main`.
Después, en el dashboard de Vercel: proyecto `thewineloft` → Settings → Git → **Connect Git Repository**.
Framework Preset: **Other**. Build Command y Output Directory: **vacíos**. Root Directory: `./`.

## Dominio propio (.com.ar)
Está explicado paso a paso en `LEEME.txt`, parte 9 C ("TU DOMINIO PROPIO"). Resumen: en Vercel → proyecto → Settings → Domains → Add; en NIC.ar delegar a `ns1.vercel-dns.com` y `ns2.vercel-dns.com`.

## Si algo falla
- `vercel: command not found` → cerrar y abrir la terminal; si sigue, falta Node.js (instalar LTS de nodejs.org y repetir el paso 1).
- `Error: The specified token is not valid` o pide login otra vez → `vercel logout` y de nuevo `vercel login`.
- La página se ve pero sin fotos → revisar que `assets/img` esté en la raíz junto a `index.html` y que los nombres en `datos.js` coincidan exactamente.
- Deployó pero se ve la versión vieja → `Ctrl + F5` o ventana de incógnito. Vercel no cachea el HTML ni el JS (ver `vercel.json`).
- Vercel dice que el plan Hobby no permite uso comercial → el sitio vende, así que lo correcto es el plan Pro (USD 20/mes) o, gratis y sin esa restricción, **Cloudflare Pages** (ver `LEEME.txt`, parte 9 D: se sube arrastrando esta misma carpeta, sin cambios).
