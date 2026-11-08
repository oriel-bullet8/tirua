# Tirúa · Bar Restorán (sitio demo)

**Versión: Volumen 5 · «Carta» (2026-11-07, en curso).** Historial y qué toca después: [docs/VERSIONES.md](docs/VERSIONES.md).

Sitio estático (HTML/CSS/JS sin build) de Tirúa Bar-Restorán, Pirque. La raíz de este repositorio **es** la raíz de la web.
Estado y pendientes: [CONTINUIDAD.md](CONTINUIDAD.md). Diseño: [DESIGN.md](DESIGN.md) y [PRODUCT.md](PRODUCT.md).

## Arrancar (un solo comando)

```bash
python3 servir.py          # o: npm start
```

Abre <http://127.0.0.1:4195/>. Solo escucha en 127.0.0.1, con caché desactivada (`Cache-Control: no-store`), y sirve siempre la carpeta donde vive `servir.py`, se lance desde donde se lance. Requiere solo Python 3.

**No uses `python3 -m http.server`**: deja que el navegador mezcle versiones viejas de CSS/JS.

Si el puerto 4195 está ocupado: `lsof -nP -iTCP:4195 -sTCP:LISTEN` para ver qué proceso es (confirma que sea el de Tirúa antes de detenerlo).

> **macOS: arráncalo desde Terminal (o el terminal del editor), no desde un proceso con sandbox.** En `~/Documents` macOS controla por app qué archivos puede leer cada proceso (atributo `com.apple.macl`). Un servidor lanzado por una herramienta con acceso limitado sirvió solo algunos archivos y devolvió 404 para el resto (ver CONTINUIDAD.md, «Incidente de los 404»).

## Probar en el iPhone (misma red Wi-Fi)

El servidor normal solo se ve desde este Mac. Para abrirlo en el celular, en Terminal: `python3 servir.py --red`. Imprime una dirección tipo `http://192.168.x.x:4195/`; ábrela en Safari del iPhone (Mac y iPhone en el mismo Wi-Fi; si macOS pregunta por conexiones entrantes, «Permitir»). Mientras corre, la carpeta del sitio es visible para esa red: detenlo con Ctrl+C al terminar. El modo normal (`python3 servir.py`) sigue siendo solo 127.0.0.1. Qué mirar: sección «H1» de `loops/pagina-casi-lista.md`.

## Verificar

Una vez, tras clonar: `npm install` (solo instala `playwright-core`; sin navegador propio: usa el `chrome-headless-shell` de la caché de Playwright, o instala uno con `npx playwright-core install chromium-headless-shell`, o apunta `TIRUA_CHROMIUM=/ruta/al/ejecutable`).

Con el servidor andando, **una prueba por vez** (se pisan las capturas y el CPU si van en paralelo):

```bash
npm run test:recursos         # todos los js/css/assets/páginas responden 200 (el chequeo de los 404)
npm run test:carta            # carta.html (versión tradicional) y su PDF contra la captura de Justo
npm run test:baraja           # baraja: 4 mazos + Bebestibles en 3, joker, búsqueda, teclado, fluidez, 250 cartas
npm run test:historias        # «Novedades» del hero y el enlace @bartirua
npm run test:instagram-sync   # sincronización de Instagram (inactiva)
npm run test:reservas         # reservar en cascada: mensaje en vivo, «Enviar por Instagram», teclado, «hoy»
npm run verificar             # todas, en cadena
```

Las pruebas usan `BASE=http://127.0.0.1:4195/` por defecto. Las salidas quedan en `capturas/` y `pruebas/resultados/`, ignoradas por Git.
Nunca envían una reserva: la navegación a Instagram/Google/Justo se bloquea.

Advertencia conocida (no es un error): `assets/video/hero.mp4` no existe todavía; el sitio lo detecta solo cuando se agregue, y mientras tanto el navegador registra un 404 de ese archivo.

## Datos de la carta

- La carta sale de la captura pública de Justo del bar (`archivo/2026-11-07-justo/`, fuera de Git). `npm run carta:construir` genera `js/baraja-productos.js`, `js/carta-datos.js`, `datos/carta.json` y `assets/carta/*.webp`; `npm run carta:pdf` genera `assets/carta/carta-tirua.pdf`. Nombres de secciones tal cual en Justo; los eventos especiales no son carta.
- `datos/justo/carta-justo.json` (+ `LEEME.md`): inventario anterior (2026-10-18) de Justo. Las 8 fotos con recorte propio viven en `assets/productos/` (`js/baraja-arte.js`).
- Listado de productos sin foto: `docs/productos-sin-imagen-2026-11-07.docx`.

## Reservas

`reservar.html` es una **cascada de cuatro preguntas** (personas → fecha → hora → tus datos): al responder una se abre la siguiente, las respondidas quedan plegadas con su respuesta y «Cambiar», y desde la primera respuesta aparece el **mensaje que se va armando** (lo que falta se ve como `[fecha]`). Con el mensaje completo se habilita «Enviar por Instagram»: copia la solicitud y abre el chat `https://ig.me/m/bartirua`; la persona la pega y la envía (Instagram no deja un texto escrito de antemano). El bar confirma la disponibilidad **a mano**; la página no envía nada por sí sola. No hay sincronización automática de reservas.
