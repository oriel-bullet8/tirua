# Versiones de Tirúa

Una «versión» (volumen) es un paquete cerrado del sitio con nombre, fecha y lista de lo que trae. Sirve para saber en cuál vamos y qué toca después.
Cada volumen tiene una copia comprimida en la carpeta de respaldos del Mac de Pablo (`respaldos-tirua/`, con huella sha256) y una línea en `CONTINUIDAD.md`. Mientras Pablo no pida commits, el paquete .zip es el punto de restauración.

**Último volumen cerrado: Volumen 4 · «Fogón» (4.0.1), 2026-10-24. En curso: Volumen 5.**
Paquete final del Vol 4 (incluye la demo de Instagram `?demo=instagram`, domingo/lunes bloqueados y modo `--red`): `respaldos-tirua/tirua-vol4-fogon-2026-10-24-final.zip` (huella en el `.sha256` junto al zip).
Paquete anterior (4.0.0, antes de esos cambios, se conserva): `tirua-vol4-fogon-2026-10-24.zip`, sha256 `1264993a5c2c0671e6832300d5b82b4035e3e63b29c549f46222acad8a60e9f4`.

| Vol. | Nombre | Fecha | Qué trae |
|---|---|---|---|
| 1 | Demo | 2026-10-20 | Sitio completo en oscuro (Big Shoulders + Poppins): hero sin video, categorías, carta en baraja, reservas en 4 pasos con envío por WhatsApp, mapa, delivery con Justo. Aprobada por Pablo («gran avance»). |
| 2 | Segunda vuelta | 2026-10-20 | Titulares rediseñados, categorías con foto, mapa de Google con visor, vista previa de pedidos, datos de la carta de Justo con fotos reales. |
| 3 | Campo | 2026-10-23 | Pedido de Oriel: tema blanco con rojo de acento, Young Serif + Alegreya Sans, carta inmersiva a pantalla completa, corazones a los costados, ficha del trago en el reverso, reservas centradas, loop «página casi lista» (sondeo, 10 checks), carpeta única de trabajo. |
| 4 | **Fogón** | 2026-10-24 | «Novedades» de Instagram en el hero (burbujas + visor tipo historias, hoy con 5 ejemplos marcados por defecto; `?demo=no` los apaga; sincronización preparada pero inactiva), guía de video para marketing, **reservar en cascada** (preguntas que se abren solas, mensaje en vivo, enlace wa.me), pruebas renovadas. |
| 5 | (en curso) | — | Mejorar la demo de Instagram, cargar publicaciones reales, número de WhatsApp, video del hero. |

## Qué toca en el Volumen 5
0. **Mejorar la demo de Instagram** (sin bloqueo). Hecho: historias como página normal, etiqueta de evento, botón «Reservar» en el visor, hero sin saltos. Falta: contenido real, carrusel de fotos, reels (esperan contenido de marketing).
Ordenado por lo que más cambia lo que ve un visitante. «Bloquea» = depende de otra persona.

1. **Número de WhatsApp del bar** (bloquea: Oriel/bar). Sin él «Enviar por WhatsApp» no abre el chat del bar. Es una línea en `js/contenido.js`.
2. **Contenido real de Instagram** (bloquea: equipo de marketing). 4 o 5 publicaciones (imagen, título, texto) para cargar a mano y reemplazar el demo.
3. **Video del hero** (bloquea: Pablo/marketing). Horizontal 1920×1080 y vertical 1080×1920, según `docs/GUIA-VIDEO-HERO.md`.
4. **Hora de cierre** (bloquea: bar). Ya está confirmado: martes a sábado desde las 18:00 (domingo y lunes bloqueados en reservas). Falta solo a qué hora cierra.
5. **Prueba en celulares reales y Safari** (hace Pablo). Es lo único que las pruebas automáticas no cubren.
6. **Permiso de uso de las fotos de Justo** (bloquea: bar). El logo en negro ya no hace falta: Pablo prefiere la página en blanco y el logo se invierte por CSS.
7. Sin bloqueo, por si hay tiempo: mapa con respaldo cuando no carga, adaptar las pruebas viejas de la baraja, sincronización real de Instagram (requiere cuenta Business/Creator y token), primer commit y subida al repositorio cuando Pablo lo pida.

## Cómo se cierra un volumen
1. `npm run verificar` en verde (y `npm run sondeo` si hubo cambios grandes).
2. Subir el número en `package.json` y en la tabla de arriba.
3. Agregar la sección en `CONTINUIDAD.md`.
4. Generar el .zip en `respaldos-tirua/` (sin `node_modules`, `capturas`, resultados ni originales de Justo) y anotar su sha256.
