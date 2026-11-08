# Versiones de Tirúa

Una «versión» (volumen) es un paquete cerrado del sitio con nombre, fecha y lista de lo que trae. Sirve para saber en cuál vamos y qué toca después.
Los puntos de restauración son etiquetas de Git (`punto-restauracion-…`) y paquetes .zip con huella sha256 en `respaldos/` (local, fuera de Git).

**Último volumen cerrado: Volumen 4 · «Fogón» (4.0.1), 2026-10-24. En curso: Volumen 5 · «Carta».**

| Vol. | Nombre | Fecha | Qué trae |
|---|---|---|---|
| 1 | Demo | 2026-10-20 | Sitio completo en oscuro, hero sin video, carta en baraja, reservas, mapa, delivery con Justo. |
| 2 | Segunda vuelta | 2026-10-20 | Titulares rediseñados, categorías con foto, mapa de Google, vista previa de pedidos. |
| 3 | Campo | 2026-10-23 | Tema blanco, Young Serif + Alegreya Sans, carta inmersiva a pantalla completa. |
| 4 | **Fogón** | 2026-10-24 | «Novedades» de Instagram en el hero, reservar en cascada con mensaje en vivo. |
| 5 | **Carta** (en curso) | 2026-11-07 | Carta completa de Justo en la baraja (250 productos), «Escoger mazo» (4 mazos; Bebestibles en 3), joker escondido, versión tradicional `carta.html` + PDF, fondo continuo de vidrio, títulos centrados, reservas por Instagram, `@bartirua` enlazado. |

## Qué toca después
Ordenado por lo que más cambia lo que ve un visitante. «Bloquea» = depende de otra persona.
1. **Dominio** (bloquea: dueño del bar). Luego actualizar `canonical` y `og:url`.
2. **Video del hero** (bloquea: equipo de marketing del local). Ver `docs/GUIA-VIDEO-HERO.md`.
3. **Beneficio del Joker** (bloquea: el Bar; se define al final).
4. **Fotos de los 85 productos sin imagen** (bloquea: el Bar; listado en `docs/productos-sin-imagen-2026-11-07.docx`).
5. **Hora de cierre** del bar y zonas/costos de delivery.
6. **Prueba en celulares reales y Safari** (hace Pablo): es lo único que las pruebas automáticas no cubren.

## Cómo se cierra un volumen
1. `npm run verificar` en verde.
2. Subir el número en `package.json` y en la tabla de arriba.
3. Actualizar `CONTINUIDAD.md`.
4. Etiqueta de Git y .zip en `respaldos/` (sin `node_modules`, capturas ni originales de Justo) con su sha256.
