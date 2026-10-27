# Informe · tercera vuelta (2026-10-20, noche)

**Causa de «no se ven los cambios en Mac»:** el navegador mostraba CSS/JS viejos con HTML nuevo (caché del `http.server` de Python): de ahí los anillos gigantes sin contexto (eran los anillos nuevos de Reservas sin su CSS), «Foto pendiente», «Plano ilustrativo» y el cuadro blanco (el iframe del mapa sin estilos). Corregido con `servir.py` (sin caché) y `?v=` en los enlaces; si aún ves lo viejo, Cmd+Shift+R.
Cambios: reservar con foto de fondo, pasos conectados y paso «Tus datos» (flujo observado en Cora Bistró con Playwright, sin enviar nada) → mensaje estructurado y «Enviar por WhatsApp» (`wa.me`; el número del bar no existe aún); ficha del local animada con tira de la semana, cinta bajo el mapa; banner de delivery «Pide por Justo, para tu puerta» con collage.
Pruebas (4195, emulado): `reservas-datos.cjs` 22/22 (nuevo), `vuelta2.cjs` 40/40, `movil-estrecho.cjs` 90/90, funcional 88/88 y 84/84, extra 102/102, fotos 180/180, `prueba.cjs` y `reservas.cjs` (12 escenarios) sin fallas ni errores JS. Los tests de reservas se adaptaron al paso nuevo (completan el nombre). No verificado: abrir WhatsApp real (sin número del bar ni cuenta), mapa fuera de Chromium, dispositivos reales.

---

# Informe · segunda vuelta de diseño (2026-10-20, tarde)

Respuesta a la evaluación de Pablo: titulares más llamativos (Big Shoulders), categorías con foto, reservas y delivery menos «genéricos», mapa de Google con visor y ficha del local rediseñada. Detalle en README («Segunda vuelta de diseño»). Detector de diseño de Impeccable ejecutado una vez: se corrigió el punto pulsante (ahora estático); el resto fueron falsos positivos (imágenes que llena `render.js`) o heredados.

Verificación (servidor 4195, emulado): `vuelta2.cjs` 40/40, `movil-estrecho.cjs` 90/90, funcional 88/88 y 84/84, extra 102/102, fotos 180/180, `prueba.cjs` y `reservas.cjs` sin fallas ni errores JS. Cambios en las pruebas, todos intencionales: se permite el iframe de Google Maps como único tercero y las categorías ahora esperan foto. Hallazgo real: el iframe atrapaba el teclado y no mostraba foco (no se puede estilar el foco dentro de un iframe de otro origen); se quitó de la secuencia con Tab.
Límites: mapa de Google verificado solo en Chromium headless con red; precios y plataforma de Justo del 18-oct; fotos de comidas/postres/compartir con permiso pendiente; sin video en el hero.

---

# Informe · demo completa (2026-10-20)

Ciclo con **Loop Architect** (la Loop Skill; no se usó `/loop` ni Loop Runner): contrato y estado en `loops/demo-completa.md`. Loop Builder (el artefacto) **no se operó** desde esta sesión: el encargo para pegar está al inicio de ese archivo. Navegador de pruebas: Chromium headless shell 1248 (Playwright-core), **un navegador a la vez**, servidor propio en 4195 (el que estaba colgado se reinició). Sin commits, push ni publicación.

**Todas las pruebas de interfaz son con viewport EMULADO (320–412 px táctil y 1440×900) en Chromium headless de macOS. No hay teléfonos reales, Safari/iOS, Firefox ni lector de pantalla; la barra del navegador móvil no se emuló (el «alto visible» se aproximó con el alto del viewport).**

## Qué se encontró al arrancar
- El sitio ya integraba la baraja (`#carta`): no había dos páginas que unir. `../bar-tirua-baraja` es la demo original y suelta; se conserva intacta.
- Los servidores 4195 y 4198 respondían vacío (`ERR_EMPTY_RESPONSE`); el 4195 se reinició con el comando del README.
- Baseline de hoy (servidor propio 4201, antes de editar): funcional 88/88 (390) y 84/84 (1440), extra 102/102, `prueba.cjs` sin fallas, salvo `con-video`, que necesita un `hero.mp4` que no existe (`assets/video/` vacío): no aplica.
- No se encontró un informe adjunto con el reporte de 320 px: se tomó este INFORME como el informe del proyecto y los fallos se reprodujeron midiendo.

## Fallos reproducidos y corregidos (solo `css/baraja.css`)
| Fallo (medido en la línea base) | Corrección | Prueba |
|---|---|---|
| 320 px: rótulo «Demostración · Qué significa» de 206 px no cabe: borde derecho en 343 (>320) y «Qué significa» cortado; la bajada se estiraba a 338 | cabecera con `minmax(0,1fr)`; por debajo de 360 px título 24 px y rótulo compacto | `movil-estrecho.cjs` |
| 320 px: botón «Lista» en 321 (fuera) porque el campo de búsqueda empujaba la rejilla | `minmax(0,1fr)` y `text-overflow: ellipsis` en el campo | ídem |
| Celulares de poca altura (390×664, 375×667, 360×640, 320×640): flechas en 709–710 px y descripción al borde al llegar a `#carta` | con ≤760 px de alto: bajada y etiqueta «Buscar» solo para lectores de pantalla; naipe mínimo 172 px | ídem |
| «RAMAZZOTTI» (94 px) partido a mitad de palabra en naipes <206 px (ya con el piso de 180 px de la línea base) | franja afinada y nombre 13 px en esos naipes | ídem |

La prueba nueva `pruebas/movil-estrecho.cjs` (90 comprobaciones) **falla 21 veces con el CSS anterior** (copia temporal servida en otro puerto) y da **0 con el actual**: discrimina.

## Verificación final (servidor 4195, en serie; evidencia ACTUAL + EMULADA)
| Comprobación | Resultado |
|---|---|
| `baraja-funcional.cjs` 390 / 1440 | 88/88 y 84/84 |
| `movil-estrecho.cjs` (7 tamaños) | 90/90 |
| `baraja-extra.cjs` (reduced-motion, 6 anchos, ARIA/foco, rendimiento, red) | 102/102 |
| `baraja-fotos.cjs` (8 bebestibles contra Justo, WebP, contraste, red) | 180/180 |
| `prueba.cjs` (sin-video, video-roto, reducido, teclado, tamaños, menú, categorías, navegación, contenido-alterno) | sin fallas |
| `reservas.cjs` (12 escenarios: flujo, enlaces, domingo-lunes, días cerrados, copiar-fallo, 7 o más, teclado, reducido, hoy, Instagram ausente, estados, inicio) | 0 errores JS, 0 peticiones no GET, 0 externas. Este script vuelca datos y **no emite veredicto por aserción**: 6 salidas idénticas a las guardadas; las otras 6 difieren solo en la fecha de hoy (19→20 oct), milisegundos y el texto del aviso (cambio del 19-oct), revisado a ojo |
| Errores de JavaScript | 0 en todas las pruebas |
| Red | 0 peticiones externas; única línea 404: `HEAD hero.mp4` (esperada y documentada: no hay video) |
| Carpetas ajenas | `bar-tirua-justo` y `bar-tirua-baraja`: 299 archivos con hash idéntico antes/después |
| Archivos del sitio que cambiaron | `css/baraja.css`, `README.md`, `INFORME.md`, `loops/demo-completa.md`, `pruebas/movil-estrecho.cjs` (nuevo) y capturas |

Heredado y NO contado como evidencia: campañas de clics del informe anterior (60/60 y 60/60 del 19-oct) y la prueba de «con video» (no hay video). Una pasada previa de las suites se lanzó dos veces a la vez por un error propio del arnés; sus resultados se descartaron y se repitió todo en serie.

## Límites y lo que NO se probó
- 320×568: la descripción se ve (561/568) pero las flechas quedan en 637: hace falta desplazar (límite físico con el diseño actual).
- 280 px (pantalla exterior de un plegable): el título y el rótulo no caben juntos; no se soporta ni se probó como requisito.
- Sin dispositivos físicos, Safari/iOS, Firefox, ni auditoría de accesibilidad automática (axe/Lighthouse).
- Peso: las 3 fuentes Poppins son TTF sin comprimir (≈612 KB de ≈1,15 MB al cargar); convertirlas a WOFF2 es una mejora pendiente (no se hizo: requiere una herramienta nueva).
- `hero.mp4` ausente: el hero se evaluó solo sin video (portada animada). Los precios y el enlace a Justo son del 18-oct-2026 y no se verificó el servicio externo.
- Contenido pendiente de Oriel (agrupación de las 27 categorías, límite de 13 cartas por palo, permiso de fotos, video, horario, As, joker): ver README, sección «Demo completa».

## Capturas (`capturas/`, prefijo `demo-`)
Escritorio 1440 (`demo-escritorio-1440-01…07`: inicio, categorías, carta, reservas, mapa, delivery y pie, reservar) y móvil 390 y 320 (`demo-movil-390-01…05`, `demo-movil-320-01…05`: inicio, menú, carta, lista rápida, reservar). Las demás capturas de la carpeta son las que regeneran las suites.

---

# Informe anterior · 8 bebestibles reales con foto (2026-10-19)

# Informe · 8 bebestibles reales con foto (Justo) en la baraja

Fecha: 2026-10-19. Ejecutado con Loop Runner sobre `loops/imagenes-bebestibles.md` (el contrato no se tocó; el estado de cada check está al final de ese archivo). Navegador de pruebas: Chromium headless shell 1248 (Playwright-core), **un navegador a la vez**. Servidor propio en el puerto **4201** (detenido al terminar; 4195 y 4198 no se tocaron). Sin commits, push ni publicación.

**Todas las pruebas de interfaz son con viewport EMULADO (390×844 táctil y 1440×900) en Chromium headless de macOS. No hay dispositivos físicos, Safari/iOS, Firefox ni lector de pantalla.**

## Qué cambió
- **8 bebestibles reales** (de `../bar-tirua-justo/carta-justo.json`, extracción 2026-10-18) reemplazan los 7 de muestra en `js/baraja-datos.js`: Ramajito $8.000 (As provisional) · Playa Tirúa $8.500 · Sol de Fuego $7.900 · Botanical Collins $8.200 · Jackie Jr. $7.500 · Espresso Vainilla $6.900 · Ramazzotti Spritz $6.900 · Green Drinks $5.900. Los 8 cumplían: visibles en la extracción, `disponible_ahora`, foto descargada, precio > 0, con categoría; la foto de cada uno se revisó a ojo (hoja de contactos de originales y capturas de cada carta activa). Se confirmó la preselección de Hermes; descartados Tübinger y Aperol Spritz. Nombre, descripción y precio sin reescribir (se conservan erratas de la fuente: «Ramazzoti», «acido»). `etiquetas: []` (los datos no traen).
- **Copias WebP** en `assets/productos/` (calidad 80, ≤1000 px, proporción original, EXIF aplicado): 23,7–35,3 KB cada una, **237 194 B en total**; `manifiesto.json` con id de Justo, original (ruta, dimensiones, sha256), copia (ruta, dimensiones, bytes) y URL de origen. Originales no copiados y sin modificar (sha256 idénticos antes/después).
- **Carta (`css/baraja.css`, `js/baraja.js`):** la ventana de foto pasó de 84×56 (horizontal) a **60×84 (vertical, ≈5:7)** entre los índices de las esquinas, porque las fotos son 3:4 y 1:1 y en la horizontal la copa salía cortada; `object-fit: cover` + `object-position` por foto (`posicion`; tras revisar cada carta todas quedaron en `50% 50%`: la bebida se ve completa). Fila de pips centrada bajo la foto. Franja de nombre y precio intacta. `<img>` con `width`/`height` de la copia, alt «<Nombre>, bebestible de la carta», `loading="eager"` solo en el As y `lazy` en el resto.
- **Rótulo único «Demostración»:** reescrito con lo cierto (8 bebestibles, descripciones, precios y fotos de la carta pública de Justo del bar, tomados el 18-oct-2026; precios pueden cambiar; uso de las fotos pendiente de confirmar con el local; As provisional; palos y colores provisionales; demás categorías sin productos; filtros alimentarios y joker no activos). Barra superior y pie: «Sitio en construcción · carta parcial y fotos por confirmar»; `<meta description>`, comentarios y README ajustados. «Todavía no tiene productos de muestra» → «Todavía no tiene productos».
- **Contador inicial** «1 de 8» en `index.html` (lo reescribe `baraja.js`).
- **Corrección reproducida (fallo previo respecto del requisito «el reverso no debe ocultar nombre ni precio»):** al voltear una carta, nombre y precio desaparecían de pantalla (captura de baseline `baraja-06-m390`, reverso solo con logo). Ahora el reverso de los productos lleva la misma franja de nombre y precio (el logo se centra en el espacio de arriba); el joker no. Nueva aserción en `baraja-funcional.cjs`: el centro de nombre y precio del reverso cae sobre la cara trasera visible (`elementFromPoint`).

## Baseline (antes de editar) y la campaña heredada
- Sin otro escritor (`ps`: ningún proceso sobre el sitio; solo 4195 y 4198 ajenos). Baseline con el sitio sin cambios, puerto 4201: `baraja-funcional` 170/170, `baraja-extra` 99/99, `prueba.cjs` (sin-video, con-video, video-roto, reducido, teclado, tamaños, menú, categorías, navegación, contenido-alterno) sin fallas, 0 errores JS (la única línea de consola es el 404 esperado de `hero.mp4`), sin desbordamiento.
- **Campañas de clics/apertura en serie** (una tras otra, un navegador a la vez, 60 corridas por dispositivo, 10:02–10:15): **móvil 60/60, escritorio 60/60**; 0 botones movidos, 0 clics fuera, 0 sin listener, **0 timeouts de apertura**. Los 2/60 `waitForFunction` y los 21 «Target … closed» de los JSON heredados (`campana-*-cpu1.json`: 37/60 y 23 fallas idénticas) **no reproducen** en el sitio sin cambios → clasificación **(b): atribuidos al arnés/carga** (campañas simultáneas y navegador muerto al salir el proceso). Limitación: 60+60 corridas descartan una tasa alta pero no una muy baja (<~2 %). Los JSON heredados se conservan como registro (evidencia heredada, no cuentan); los baseline y finales son `baseline-campana-*.json` y `final-campana-*.json`.
- **«Al llegar a la carta en móvil la descripción y las flechas aparecen al desplazar un poco» → CONFIRMADO como ERROR PREVIO** (`pruebas/sondeo-pliegue-movil.cjs`, 390×844): en el sitio (por `#carta` o por el menú) las flechas están en y=909–961 (pliegue 844) y la descripción en 789–861 (cortada); en la demo aprobada, al cargar, las flechas están en 739–791 y la descripción en 619–691. Causa: el sitio antepone título, bajada y rótulo (≈170 px) a buscador y chips. **No se corrigió** (no es pequeño ni concreto: es una decisión de maquetación de la cabecera de la sección, ya anotada como no aplicada en la integración anterior). Con las descripciones reales (hasta 4 líneas en 390 px) la descripción ocupa más, pero la reserva de alto mantiene quietos los controles. «Bajar» del hero sigue apuntando a `#categorias` (sin cambios).

## Resultados finales (evidencia fresca, emulada)
| Prueba | Resultado |
|---|---|
| `baraja-funcional.cjs` (m390 táctil + d1440) | **172/172** (170 + aserción nueva del reverso ×2); apertura, volteo, flechas, teclado, swipe, extremos, 20+20+20 clics, 50 síncronos, controles inmóviles entre las 8 cartas, búsqueda (sin tildes: «TIRUA», «CÓCTEL»; descripción: «jengibre»; cero resultados), lista rápida, chips, joker; 0 errores JS, 0 externas |
| `baraja-extra.cjs` | **102/102**: reduced-motion, **360/390/768/1280/1440/1920 sin desbordamiento** en 8 estados, controles ≥44 px, ARIA (`Carta N de 8: nombre, precio` con los 8 reales), foto real (As eager, 2.ª lazy, cover), multi-categoría con datos interceptados (incluida la búsqueda en etiquetas, movida aquí) |
| `baraja-fotos.cjs` (nuevo) | **180/180**: datos↔JSON, archivos (WebP válido, dimensiones, ≤1000 px, ≤120 KB, proporción ±0,5 %), 8 cartas en cada dispositivo (producto=JSON, foto correcta, sin deformar, contraste, tamaños, red), bloque «Bebestibles» → carta bajo la cabecera |
| `comparar-fotos.py` (píxeles reales) | Deformación estimada máx. **0,50 % (1440)** y **0,75 % (390)** ≤1 %; control con +3 % de ancho sale claramente peor. Limitación: la captura se redondea al píxel (≈0,5 % de ruido); por geometría la deformación es 0 (cover, transform identidad, rect = layout) |
| Contraste y tamaño | Nombre ≥ 4,5:1 y precio ≥ 4,5:1 sobre la franja sólida `#151515` en las 8 cartas (nombre `#f4f4f2`, precio color del palo); nombre ≥14 px y precio ≥18 px peso 800 en 390 y 1440, sin recorte |
| Campañas finales (en serie, tras los cambios) | móvil **60/60**, escritorio **60/60**; 0 movidos / 0 fuera / 0 sin listener |
| `prueba.cjs` (10 modos) | Sin fallas; `categorias` 28/28 tras actualizar 3 valores de prueba (abajo); hero con/sin video, video roto, reduced-motion, teclado, tamaños, menú, navegación (cabecera sin tapar a 1440/390/360/768), contenido alterno |
| `reservas.cjs` (12 escenarios) | Salida idéntica a la guardada, salvo el texto del aviso de barra/pie (cambio intencional); 0 errores JS |
| Fuera de alcance | `main.js`, `menu.js`, `hero.js`, `reservar.js`, `reservar.html` idénticos a `referencia/antes-baraja/`; `css/styles.css` y `render.js` sin cambios; hashes de `../bar-tirua-justo/originales`, `carta-justo.json` y `../bar-tirua-baraja` (285 archivos) idénticos antes/después |

**Pesos (bytes de cuerpo, medidos en 390 y 1440):** página al cargar sin desplazarse **1 178 514 B (1151 KB)**, de los cuales las 8 fotos 237 194 B (20 %); sin fotos serían ≈941 KB (3 fuentes TTF = 612 KB). **Decisión medida:** `loading="lazy"` no evita la descarga: Chromium trae las 8 al cargar porque la carta queda dentro de su umbral de distancia; el total es de solo 237 KB, así que no se añadió carga diferida por JS (cambio sin fallo que reproducir). Tras recorrer las 8 cartas el peso no cambia.

## Cambios de pruebas (sin relajar aserciones)
- Contadores, clamps y conteos 7→8 (`de 7`→`de 8`, `Math.min(6…)`→`7`, 7 cartas→8, joker «carta 8»→«carta 9»); el patrón y la lógica de las campañas no cambian.
- Búsquedas que dependían del texto de muestra («7», «DESCRIPCION», «segundo bebestible», «bebestible de muestra 6») ahora usan datos reales («ramazzotti»→1, «TIRUA»→1 con tilde en el dato, «CÓCTEL»→3 con tilde en la consulta, «jengibre»→1, «espresso vainilla»→1); se añadió la comprobación inversa de tildes.
- **Etiquetas («frio» → etiqueta «frío»):** los 8 reales no traen etiquetas, así que esa aserción pasó a `baraja-extra.cjs` con datos interceptados (el mecanismo sigue probado; no se inventan etiquetas en los datos).
- **Lazy de la foto:** la aserción `loading=lazy` sobre la primera carta pasó a «As eager + 2.ª carta lazy» (el As es la carta activa/primera por contrato); la de «Foto pendiente» se conserva.
- `prueba.cjs categorias`: «1 de 7»→«1 de 8», «sin productos de muestra»→«todavía no tiene productos», 7→8 cartas, búsqueda «muestra»→«spritz».
- Baraja: `baraja-extra` calculaba mal el acento tras mover la búsqueda de etiquetas (error propio de la prueba, corregido en el mismo ciclo).

## Límites
- Solo Chromium headless emulado; swipe con eventos táctiles de CDP; sin dispositivos físicos, Safari/iOS, Firefox ni lector de pantalla. Rendimiento medido por software, no equivale a un móvil real.
- **Permiso de uso de las fotos: pendiente** (decisión del local); no publicar antes.
- Siguen pendientes: As real (el primero es provisional), palos y colores definitivos, productos y fotos de las otras 3 categorías, filtros alimentarios (sin datos), joker (solo visual), horas de reserva de muestra.
- Los precios y el enlace de «Ver carta completa en la plataforma del bar» son del 18-oct-2026; no se verificó el servicio externo.
- ERROR PREVIO sin corregir: descripción y flechas bajo el pliegue en 390×844 al llegar a la carta (ver arriba).
- Contraste calculado de colores computados, sin auditoría automática completa (axe/Lighthouse).
- `referencia/` conserva copias congeladas sin verificar.

## Capturas (`capturas/`)
Eliminadas las de la carta con placeholders (`baraja-*`, `carta-*`, `pagina-*`, `nav-*`) y regeneradas. Nuevas, en 390 (`m390`) y 1440 (`d1440`): `baraja-01` mazo cerrado · `-02` apertura · `-03` abierta · `-04` carta 4 · `-05` **extremo 8 de 8** · `-06` reverso (con nombre y precio) · `-07` vecina · `-08` **búsqueda con resultado** · `-09` sin resultados · `-10` **lista rápida** · `-11` chips · `-12…14` joker · `-15` **cartas 2, 4, 6 y 7** (Playa Tirúa, Botanical Collins, Espresso Vainilla, Ramazzotti Spritz) · `-16` **desde el bloque «Bebestibles»** · `-20/21` reduced-motion · `-30…32` seis anchos (360…1920) · `-40/41` datos interceptados de prueba; `carta-*-desde-categoria-*`, `nav-*`, `pagina-*`; y **`hoja-contactos-bebestibles-8-cartas.png`** (las 8 cartas con nombre y precio). El resto (hero, reservas, mapa, delivery, menú) se regeneró con las pruebas.

## Material de apoyo
`pruebas/optimizar-imagenes.py`, `verificar-fotos-json.py`, `baraja-fotos.cjs`, `comparar-fotos.py`, `sondeo-pliegue-movil.cjs`; resultados crudos en `pruebas/resultados/` (`baseline-*`, `final-*`, `baraja-fotos.json`).
