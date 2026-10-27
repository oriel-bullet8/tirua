# Guía de video para el hero de Tirúa (para marketing)

El hero es la primera pantalla del sitio: ocupa **todo el alto de la ventana** (`object-fit: cover`) con el logo, «Tu lugar de encuentro», los botones y las novedades encima. El video va de fondo, **sin sonido y en bucle**. Instagram guarda los reels en vertical (9:16), que no sirve para un computador: hay que filmar/exportar el video pensando en el hero.

## Qué entregar (dos archivos)
| Archivo | Formato | Medidas | Para qué pantallas |
|---|---|---|---|
| `hero.mp4` | horizontal 16:9 | **1920×1080** | computadores, tablets y celulares girados |
| `hero-vertical.mp4` | vertical 9:16 | **1080×1920** (el mismo tamaño de un reel) | celulares en vertical |

Si solo hay uno, el sitio usa ese en todas partes (el horizontal se recorta en el celular). El vertical puede salir del mismo rodaje o de un reel de Instagram **exportado sin texto ni audio con licencia**.

## Reglas de contenido
- **8 a 15 segundos**, que el final empalme con el principio (bucle sin salto).
- **Zona segura:** en el horizontal, lo importante (personas, estufas, platos) dentro del **centro 60 % × 60 %**; los bordes se recortan según la pantalla (16:10 recorta a los lados; 21:9 recorta arriba y abajo).
- **El centro tiene que ser tranquilo:** ahí van el logo y los textos. Mejor movimiento suave (cámara lenta, luces, humo de cocina, brindis) que acción brusca.
- **Sin texto, logos ni subtítulos** dentro del video (se superponen con el del sitio) y sin carteles de «sábado 20:30»: eso va en Novedades.
- **Sin audio** (el navegador lo silencia igual) y **sin música con licencia de Instagram**: no se puede reutilizar fuera de la plataforma.
- **Personas reconocibles:** conviene el visto bueno de quienes aparezcan.
- Luz cálida y tolerante a un velo oscuro: el sitio oscurece un poco el video para que se lea el texto.
- Ideas: terraza con estufas encendidas al caer la tarde, cocina/plato terminándose, brindis, mascotas (pet friendly), el escenario sin gente hablando a cámara.

## Peso y formato técnico
- **H.264 (High), yuv420p, 24–30 fps**, `+faststart`. Objetivo: **≤ 4 MB** el horizontal y **≤ 3 MB** el vertical (≈ 2 Mbps a 1080p).
- Opcional: WebM VP9 con el mismo nombre (`hero.webm`).
- Comando de ejemplo (ffmpeg), partiendo de un original grande:
  ```
  ffmpeg -i original.mov -t 12 -an -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -maxrate 2200k -bufsize 4400k -movflags +faststart hero.mp4
  ffmpeg -i original.mov -t 12 -an -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 27 -maxrate 1800k -bufsize 3600k -movflags +faststart hero-vertical.mp4
  ```
  (Si no tienen ffmpeg, entregan el original y lo comprimimos nosotros.)

## Dónde se pone
`assets/video/hero.mp4` y `assets/video/hero-vertical.mp4`. El sitio los detecta solo (no hay que tocar código). Mientras no existan, se ven las **Novedades de Instagram** (burbujas) sobre el hero blanco con el logo.
