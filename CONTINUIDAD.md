# Continuidad · Bar Tirúa (estado al 2026-11-07)

Leer esto antes de tocar el sitio. Arranque y pruebas: `README.md`. Diseño: `DESIGN.md` y `PRODUCT.md`. Loop de trabajo vigente: `loops/lanzamiento-y-carta.md`. Versiones: `docs/VERSIONES.md`.

**Carpeta de trabajo única:** el clon de https://github.com/oriel-bullet8/tirua (la raíz del repo es la raíz de la web; en el Mac de Pablo vive en `~/Documents/Codex/Proyectos/proyectos oriel/tirua`). Lo que no va al repo (originales de Justo, respaldos, capturas) está en `archivo/`, `respaldos/` y `capturas/`, excluidos de Git.

## Cómo se publica
Pablo sube el trabajo a la rama `carta-y-lanzamiento` del repo de GitHub; **Oriel lo publica (Vercel) desde ahí**. El dueño del proyecto Vercel es Oriel. Nada se publica sin que Pablo lo pida.

## Dónde quedamos
Sitio estático (HTML/CSS/JS, sin build). `index.html`:
- **Hero** con el logo (ahí irá el video de marketing) y «Novedades @bartirua» (historias de Instagram; `@bartirua` enlaza al perfil).
- **Categorías**, **Carta**, **Reservas**, **Mapa** y **Delivery**, con títulos centrados y **un solo fondo** para toda la página (sello de vidrio sobre papel cálido y luces lentas, `css/fondo.css`). La Carta es lo único con fondo distinto (negro). `reservar.html` lleva el mismo fondo; `carta.html` (la versión tradicional/PDF) no.
- **Carta en baraja** (`js/baraja.js`): «Abrir la carta» → «Escoger mazo» → se reparte el mazo. Hay 4 mazos (Bebestibles, Comidas individuales, Postres, Para compartir); Bebestibles se despliega en 3 (Coctelería, Destilados y vinos, Cervezas y bebidas, definidos en `js/baraja-datos.js → mazos`). Las cartas se montan bajo demanda (rendimiento).
- **Joker** escondido en el mazo: 12 % por reparto, máximo 1 por visita, boca abajo, se descubre al detenerse en él (`js/baraja-datos.js → joker`; `?joker=1` fuerza que salga; el botón de la lupa lo muestra a demanda).
- **Carta tradicional:** `carta.html` + `assets/carta/carta-tirua.pdf` (se genera con `npm run carta:pdf`).
- **Reservas** (`reservar.html`, cascada personas → fecha → hora → datos): el bar confirma a mano. El envío es por **Instagram**: «Enviar por Instagram» copia la solicitud y abre el chat `https://ig.me/m/bartirua`; la persona la pega y la envía.

## Datos de la carta (Justo)
Fuente: carta pública de Justo del bar, capturada el 2026-11-07 (`archivo/2026-11-07-justo/`, fuera de Git). `npm run carta:construir` genera `js/baraja-productos.js`, `js/carta-datos.js`, `datos/carta.json` y `assets/carta/*.webp`. **250 productos** (165 con foto, 85 sin foto), 27 secciones.
- Los nombres de secciones son los de Justo, sin correcciones («Entradas Frias», «Shop»).
- **Cafetería** va dentro de bebestibles, como en Justo.
- **Eventos especiales no son carta** (HALLOWEEN; McTirúa y grupo 80 no tienen sección en Justo): se dejan fuera.
- Productos sin foto: `docs/productos-sin-imagen-2026-11-07.docx`.

## Decisiones de Pablo (2026-11-07)
Sin foto/fondo de madera (descartado) · el sello «Demostración» se quitó · rótulos de Justo tal cual · fondo nuevo en `index.html` y `reservar.html` · reservas por Instagram, sin WhatsApp · eventos especiales fuera de la carta.

## Pendiente
- **Dominio:** lo define el dueño del bar. Cuando exista: cambiar `canonical` y `og:url` (hoy `tirua-website.vercel.app`) en `index.html`, `reservar.html` y `carta.html`.
- **Beneficio del Joker:** se define al final con el Bar (hoy el texto dice que es una demostración).
- **Hero:** lo define el equipo de marketing del local (video; mecanismo listo en `assets/video/hero.mp4`, que aún no existe).
- **Fotos faltantes:** 85 productos (ver el Word). **Horario de cierre** del bar (las horas de reserva son de muestra hasta las 22:30). Zonas, costos y tiempos de delivery.
- **Probar en teléfono real y Safari/iOS** (`python3 servir.py --red`): todo lo medido fue en Chromium emulado.

## Límites conocidos
Solo Chromium headless emulado. El mapa de Google es el único tercero (iframe). Fuentes TTF sin comprimir (~0,7 MB). Advertencia esperada: 404 de `assets/video/hero.mp4` hasta que haya video.

## Puntos de restauración
Etiqueta git `punto-restauracion-2026-11-07-carta-joker` (carta completa + 6 mazos + joker, antes del fondo nuevo) y los .zip con sha256 de `respaldos/` (local).

## Incidente de los 404 (2026-10-23, para no repetirlo)
Un servidor lanzado desde una herramienta con sandbox sirvió solo algunos archivos de `~/Documents` (atributo `com.apple.macl`) y dio 404 en el resto. Solución: lanzar `python3 servir.py` desde Terminal normal. No usar `python3 -m http.server` (caché).
