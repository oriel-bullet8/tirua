# Tirúa · Bar Restorán (sitio demo)

**Versión: Volumen 4 · «Fogón» (4.0.1, 2026-10-24, cerrado; el Volumen 5 está en curso).** Historial y qué toca después: [docs/VERSIONES.md](docs/VERSIONES.md).

Sitio estático (HTML/CSS/JS sin build) de Tirúa Bar-Restorán, Pirque. La raíz de este repositorio **es** la raíz de la web.
Estado y pendientes: [CONTINUIDAD.md](CONTINUIDAD.md). Detalle técnico de la demo: [docs/DEMO-README.md](docs/DEMO-README.md). Cifras: [docs/INFORME.md](docs/INFORME.md).

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
npm run test:inmersivo        # portal + modo inmersivo de la carta, tema claro/oscuro (escritorio, móvil, 320 px, movimiento reducido)
npm run test:baraja:fotos     # datos de Justo ↔ manifiesto ↔ WebP (los originales solo si defines TIRUA_JUSTO)
npm run test:vuelta2
npm run test:reservas-datos   # reservar en cascada: preguntas que se abren solas, mensaje en vivo, enlace wa.me, copiar, teclado, «hoy»
npm run verificar             # las de arriba, en cadena

# Heredadas (pensadas para el diseño oscuro con la baraja dentro de la página: miden herramientas y cabecera que ya no están a la vista).
# Siguen en pruebas/ pero NO están en `verificar` hasta adaptarlas al modo inmersivo:
#   baraja-funcional.cjs m390|d1440 · baraja-extra.cjs · baraja-campana.cjs · movil-estrecho.cjs · prueba.cjs · reservas.cjs (asistente de pasos anterior a la cascada, ya no corresponde a la página)
```

Las pruebas usan `BASE=http://127.0.0.1:4195/` por defecto. Salidas (capturas, resultados) quedan en `capturas/` y `pruebas/resultados/`, ignoradas por Git.
Nunca envían una reserva: ninguna prueba pulsa «Enviar por WhatsApp» (solo leen el enlace `wa.me` generado) y la navegación a Instagram/Google/Justo se bloquea.

Advertencia conocida (no es un error): `assets/video/hero.mp4` no existe todavía; el sitio lo detecta solo cuando se agregue, y mientras tanto el navegador registra un 404 de ese archivo.

## Datos y originales

- `datos/justo/carta-justo.json` (+ `LEEME.md`): inventario de la carta pública de Justo. Va en el repo.
- Los **originales de Justo (~203 MB)** y las capturas crudas **no** van en el repo. Viven en la carpeta de Pablo `…/est-2/outputs/bar-tirua-justo/`. Para verificar hashes de originales: `TIRUA_JUSTO=<esa carpeta> npm run test:baraja:fotos`.
- Las fotos usadas por el sitio son copias WebP en `assets/productos/` (el uso de las fotos de Justo sigue pendiente de confirmar con el local).
- `loops/` y `docs/` conservan registros históricos con las rutas antiguas; no son parte de la ejecución.

## Reservas

`reservar.html` es una **cascada de cuatro preguntas** (personas → fecha → hora → tus datos): al responder una se abre la siguiente, las respondidas quedan plegadas con su respuesta y «Cambiar», y desde la primera respuesta aparece al lado el **mensaje que se va armando** (lo que falta se ve como `[fecha]`). Con el mensaje completo se habilitan «Enviar por WhatsApp» (enlace `wa.me` con el texto ya escrito) y «Copiar mensaje». El bar confirma la disponibilidad **a mano**; la página no envía nada por sí sola.

**Número de WhatsApp del bar:** aún no está cargado (`LOCAL.whatsapp` en `js/contenido.js`, hoy `null`). Con el número (solo dígitos y código de país, p. ej. `569XXXXXXXX`) el enlace pasa a ser `https://wa.me/<número>?text=<mensaje>` y abre WhatsApp directo en el chat del bar. Mientras sea `null`, WhatsApp se abre con el mensaje escrito y la persona elige el chat. Instagram queda solo como enlace al perfil `@bartirua`; no hay sincronización automática de reservas.
