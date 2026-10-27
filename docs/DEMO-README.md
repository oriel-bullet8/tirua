# Tirúa · sitio en construcción

Página única en HTML + CSS + JS, sin framework y sin dependencias. Sin recursos externos en tiempo de ejecución (fuentes, logo y estilos están en este proyecto). Los datos del local son reales (ver «Datos reales y pendientes»); la carta es **parcial**: 8 bebestibles reales con foto, tomados de la carta pública de Justo del bar el 2026-10-18 (el uso de esas fotos en este sitio está **pendiente de confirmación con el local**); las demás categorías, las fotos de los bloques de categorías y las horas de reserva siguen pendientes o de muestra.

## Arranque

```
cd bar-tirua-sitio
python3 servir.py 4195
```

**Usa `servir.py`, no `python3 -m http.server`:** el servidor normal deja que el navegador reutilice CSS/JS viejos y se ve una mezcla de versiones (HTML nuevo con estilos antiguos: anillos gigantes, «Plano ilustrativo», fotos pendientes). `servir.py` responde sin caché y además `index.html` y `reservar.html` enlazan CSS/JS con `?v=…`; al cambiar archivos, sube ese número. Si ves una versión vieja: Cmd+Shift+R.

Abrir http://127.0.0.1:4195/ (el puerto es libre; en las pruebas se usó el 4201). **Esta es la única demo que hay que abrir:** incluye la baraja (`#carta`), las categorías, las reservas por Instagram, el mapa y el delivery. `../bar-tirua-baraja` (puerto 4198 en su día) es la demo original y suelta de la baraja, se conserva sin tocar como referencia y ya no hace falta servirla. Si el 4195 abre en blanco o no responde, el servidor quedó colgado: se mata el proceso y se vuelve a lanzar el comando de arriba. Conviene usar el servidor: la comprobación del video usa `fetch`, que no funciona con doble clic (`file://`); en ese caso el sitio intenta cargar el video directamente.

## Demo completa · estado al 2026-10-20

Resumen de la revisión «demo completa» (ciclo con Loop Architect; contrato y evidencia en `loops/demo-completa.md`, detalle y cifras en `INFORME.md`). Todo lo de interfaz se probó con **viewports emulados en Chromium headless de macOS**: no hay teléfonos reales, ni Safari/iOS, ni Firefox, ni lector de pantalla.

**Corregido (cada uno reproducido antes y cubierto por `pruebas/movil-estrecho.cjs`, que falla 21 veces con el CSS anterior y 0 con el actual):**
- **320 px, cabecera de la carta:** el rótulo «Demostración · Qué significa» se salía 23 px del borde («Qué significa» cortado) y la bajada se estiraba bajo él. Ahora el rótulo y el título se compactan por debajo de 360 px (título 24 px).
- **320 px, herramientas:** el botón «Lista» quedaba fuera del borde; la rejilla usa `minmax(0, 1fr)` y el texto del buscador se recorta con «…» en vez de tapar el botón.
- **Descripción y flechas en celulares de poca altura:** con 390×664, 375×667 o 360×640 (alto visible real de un teléfono, menor que el de su pantalla) la descripción quedaba al borde y las flechas bajo el pliegue al llegar a `#carta`. Con ≤760 px de alto la bajada de la carta y la etiqueta «Buscar en la carta» pasan solo a lectores de pantalla (siguen asociadas al campo) y el naipe puede bajar hasta 172 px de ancho. Resultado medido: naipe, descripción y flechas visibles sin desplazar desde 320×640. **Límite físico:** en 320×568 la descripción se ve (561/568) pero las flechas quedan en 637: hace falta desplazar.
- **Nombre partido a mitad de palabra:** con naipes de menos de ~206 px, «RAMAZZOTTI» se partía en «RAMAZZOTT / I» (ya ocurría en la línea base con el piso de 180 px). En esos naipes la franja afina márgenes y el nombre baja de 14 a 13 px (precio sin cambio, 18 px). Propuesta visual reversible: si Pablo prefiere 14 px, el costo es que ese nombre vuelve a partirse en pantallas bajas.

**Propuestas visuales reversibles (las evalúa Pablo):** ocultar la bajada y la etiqueta del buscador en pantallas bajas; 13 px en el nombre de naipes pequeños; el resto del diseño quedó como estaba.

**Sin cambios a propósito:** hero sin video (no hay `assets/video/hero.mp4`; `data-video="auto"` hace una sola petición `HEAD` y deja una línea 404 en consola, documentada abajo), reservas por solicitud de Instagram, mapa y delivery como enlaces, joker solo visual, 4 categorías provisionales (no apareció ninguna decisión posterior que las sustituya).

**Pendientes de Oriel (qué bloquea cada uno):**

| Falta | Quién | Qué bloquea |
|---|---|---|
| **Cómo agrupar las 27 categorías de Justo en las 4 de la baraja** (o cambiar las 4). Hay 289 productos; con una propuesta provisional serían 189 de bebestibles, 29 de comidas individuales, 6 de postres, 16 para compartir, 10 por decidir (Entradas Frías, Shop) y **39 sin categoría en Justo**. Sin aplicar | Oriel (y Pablo) | Sumar productos a Comidas individuales, Postres y Para compartir (hoy «Próximamente») y ampliar Bebestibles más allá de los 8 actuales |
| **Cómo mostrar más de 13 productos por categoría.** El naipe usa valores A…K (13) y desde el 14.º repite K; Bebestibles propuesto pasaría de 189 | Pablo con Oriel | Ampliar cualquier palo a más de 13 cartas (subcategorías, destacados o un tope por palo) |
| Permiso para usar las fotos de Justo en el sitio | Local | Publicar. Hoy las 8 fotos se muestran solo en la demo local |
| Fotos para los bloques de #categorias y de las categorías nuevas | Local | Quitar los marcadores «Foto pendiente» |
| `hero.mp4` (≈10–20 s, H.264, <5 MB) | Local / Oriel | Hero con video; sin él se ve la portada animada (el sitio funciona igual) |
| Horario real y hora de cierre; días sin atención | Local | Activar `reserva.diasCerrados` y ajustar `reserva.horas` (hoy de muestra 18:00–22:30) |
| El As real (hoy el primero es provisional), palos/colores definitivos | Oriel / Pablo | Quitar los avisos «provisional» del rótulo |
| Condiciones del joker (reglas, premios, vínculo con la reserva) | Oriel | Activar el joker (hoy solo vista previa visual, sin aleatoriedad ni premios) |
| Filtros alimentarios: los datos de Justo no traen etiquetas | Oriel | Mostrar filtros (no se inventan) |
| Logo vigente y plano real; 2 enlaces más de la bio | Oriel | Reemplazar logo/plano ilustrativo |
| Cambios que Pablo acordó con Oriel y aún no aparecen | Pablo | Pregunta abierta en la entrega |

## Segunda vuelta de diseño · 2026-10-20 (respuesta a la primera evaluación de Pablo)

- **Titulares:** Big Shoulders Bold (OFL, `assets/fonts/BigShoulders-Bold.ttf`, licencia al lado), condensada y alta, como contrapunto del logo ancho. Variable `--display` en `css/styles.css`; el cuerpo sigue en Poppins. Es una propuesta reversible: cambiar `--display` y el `@font-face`.
- **Categorías:** cada bloque lleva una foto real de Justo (`assets/img/*.webp`, origen y hash en `assets/img/manifiesto.json`): Bebestibles = Playa Tirúa, Comidas individuales = Classic Burger, Postres = Volcán de Chocolate, Para compartir = Tabla Marina. **Elección de portada, no clasificación de productos.** Mismo permiso pendiente que las demás fotos. Para cambiarlas: `imagen` en `js/contenido.js`.
- **Reservas (inicio):** Personas → Fecha → Hora a gran tamaño con los anillos del logo de fondo.
- **Reservar (`reservar.html`), inspirado en el flujo de Cora Bistró (observado con Playwright, sin enviar nada):** foto de fondo, pasos conectados arriba y un paso nuevo **«Tus datos»** (nombre obligatorio; ocasión y comentarios/alergias opcionales). La solicitud ahora sale **estructurada** (Nombre, Personas, Fecha, Hora, Ocasión, Comentarios) y el botón principal es **«Enviar por WhatsApp»** (`wa.me` con el mensaje ya escrito); quedan «Copiar mensaje» y «Abrir Instagram». El número de WhatsApp del bar **no existe aún**: `LOCAL.whatsapp` en `js/contenido.js` es `null` y, mientras tanto, WhatsApp se abre con el mensaje y la persona elige el chat. No se guarda nada ni hay red al elegir.
- **Mapa:** mapa de Google incrustado (`mapa.embed` en `js/contenido.js`; `null` lo quita), con marco tipo visor y ficha del local con datos alineados a la izquierda. **Es el único tercero que carga el sitio** (google.com, gstatic.com, googleapis.com, al llegar a la sección; el iframe usa `tabindex="-1"` para no atrapar el teclado, el equivalente es «Cómo llegar»). Las pruebas lo permiten explícitamente (`MAPAS` en `pruebas/_lib.cjs`) y cualquier otro host sigue fallando.
- **Delivery:** vista previa de la carta de pedidos con los 8 bebestibles reales (foto, nombre, precio, botón +). Cada fila abre la plataforma del bar en otra pestaña; no hay carrito ni pedido en este sitio y no se informa cobertura ni tiempos.
- **Hero:** sigue sin video. Pendiente: video de prueba del Instagram del local (descargarlo requiere la autorización de Pablo y, idealmente, el visto bueno del local).
- **Ficha del local y cinta:** la ficha entra con animación escalonada, tira de la semana (Mar–Sáb, por confirmar), esquinas que crecen al pasar el cursor, barrido sobre el mapa y una cinta con datos reales del local. **Delivery:** banner «Pide por Justo, para tu puerta» con collage de fotos de pedidos; zonas, costos y tiempos quedan «por confirmar con el local».
- **Prueba nueva:** `node pruebas/vuelta2.cjs` (40 comprobaciones: fuente, fotos, reservas, mapa, pedidos, único tercero).

## Estructura de la página (en este orden)

1. Barra fina superior · 2. Cabecera (Home · Reservas · Carta · Mapa · Delivery; hamburguesa en móvil) · 3. Hero con video · 4. Conoce nuestras categorías · 5. Carta · 6. Reservas (bloque breve con «Reservar mesa») · 7. Mapa · 8. Delivery · 9. Pie.

La solicitud de reserva vive en su propia página, **`reservar.html`** (personas → fecha → hora → solicitud por Instagram).

```
index.html          página principal (los textos y bloques repetidos se llenan desde js/contenido.js)
reservar.html       asistente de solicitud de reserva
css/styles.css      estilos (tokens al inicio)
css/baraja.css      estilos de la carta en baraja (todo con prefijo br- / --br-; no pisa styles.css)
js/contenido.js     ← CONTENIDO EDITABLE: logo, textos, nombres de las 4 categorías y sus fotos, sedes,
                      delivery, pie, Instagram y todo el asistente de reservas (horas, mensaje, textos)
js/baraja-datos.js  ← DATOS EDITABLES DE LA BARAJA: productos, palos, colores y joker (un solo archivo)
assets/productos/   copias WebP de los 8 bebestibles + manifiesto.json (los originales siguen en ../bar-tirua-justo)
js/render.js        pinta contenido.js en el HTML (síncrono, antes del primer pintado)
js/main.js          cabecera transparente→negra, sección activa del menú, revelado al hacer scroll
js/menu.js          hamburguesa (aria-expanded, Esc, foco atrapado, cierre al elegir enlace)
js/baraja.js         la baraja (mazo → apertura → exploración), búsqueda, lista rápida, chips, joker visual
js/carta.js         conecta los bloques de #categorias con la baraja (categoría, scroll sin tapar la cabecera)
js/hero.js          video de fondo (comprobación, play/pausa, reduced-motion)
js/reservar.js      asistente de reservar.html (sin red, sin almacenamiento)
assets/brand/       logos y favicon     assets/fonts/  Poppins (OFL)     assets/video/  hero.mp4
pruebas/            scripts de Playwright y resultados   ·   capturas/   ·   INFORME.md
referencia/         copia congelada y SIN verificar del asistente largo descartado (solo referencia visual; no se usa ni se enlaza)
```

## Qué se edita y dónde

Casi todo en **`js/contenido.js`** (los textos marcados con `data-texto="ruta"` en `index.html` salen de ahí; en `index.html` esos elementos están vacíos a propósito):

| Quiero cambiar… | Dónde |
|---|---|
| Logo | `marca.principal` (hero), `marca.cabecera` (cabecera y pie; `null` = usa el principal), `marca.alturaCabecera`, `marca.proporcionPrincipal` |
| Aviso de la barra superior y del pie | `aviso`, `pie.aviso` |
| Menú | `navegacion` (texto y ancla) |
| Categorías (nombre, descripción, **foto** del bloque) | `categorias.items`: `imagen: 'assets/img/bebestibles.jpg'` o `null`. Los nombres se usan también en los chips y avisos de la baraja |
| **Productos de la baraja** (nombre, precio, descripción, etiquetas, foto) | `productos` en `js/baraja-datos.js` (hoy los 8 bebestibles de Justo; el id de Justo, el origen de cada foto y los hashes están en `assets/productos/manifiesto.json`) |
| **Palos y colores** (uno por categoría; cuál está activa o «Próximamente») | `categorias` en `js/baraja-datos.js`: `palo` (`corazones`, `picas`, `diamantes`, `treboles`), `acento` (color) y `activa` |
| **Joker** (solo vista previa visual) | `joker` en `js/baraja-datos.js` (`activo` queda en `false`) |
| Rótulo «Demostración · Qué significa» (único; explica qué es real y qué es provisional) | `rotulo` en `js/baraja-datos.js` |
| Título y bajada de la Carta, enlace «Ver carta completa…»; textos de Mapa, Delivery y del bloque «Reservas» | `carta`, `mapa`, `delivery`, `reservas` (el enlace usa `LOCAL.pedidos`) |
| **Datos del local** (dirección, horario, Instagram, rasgos, enlace de pedidos, «Cómo llegar») | bloque `LOCAL` al inicio de `js/contenido.js`; el resto del archivo lo reutiliza |
| **Usuario de Instagram** («Abrir Instagram» y enlace del pie) | `LOCAL.instagram` (sin «@»; alimenta `instagram.usuario`) |
| **Horas** del asistente | `reserva.horas`: `desde`, `hasta`, `cadaMin` y el rótulo (hoy 18:00–22:30 cada 30 min, **de muestra**) |
| **Días sin atención** | `reserva.diasCerrados` (hoy `[]`). Cuando el local confirme su horario, `[0, 1]` bloquea domingo y lunes (0 = domingo … 6 = sábado) |
| **Mensaje** de la solicitud | `reserva.mensaje` con `{personas}`, `{fecha}` y `{hora}` |
| Resto de textos, máximo de personas y rango de fechas del asistente | `reserva.*` (`maxPersonas`, `horizonteDias`, avisos, botones) |
| Sede (dirección, horarios, «Cómo llegar») | `mapa.sedes`; con `url: 'https://…'` el botón pasa a ser un enlace real |
| Delivery (botón «Pedir») | `delivery.url` cuando exista el servicio; con `null` queda deshabilitado |
| Colores, tipografía, espacios | variables `:root` al inicio de `css/styles.css` |

### Fotos
- **Bloques de #categorias:** pon la foto en `assets/img/` (colores naturales, formato horizontal ~4:3, ≥1200 px) y escribe su ruta en `imagen` y una descripción en `altImagen` (`js/contenido.js`). Mientras `imagen` sea `null` se muestra el marcador gris «Foto pendiente» y **no se pide ningún archivo**.
- **Cartas de la baraja:** en `js/baraja-datos.js`, `imagen: { src: 'assets/productos/….webp', alt: '…', ancho: 750, alto: 1000, posicion: '50% 50%' }` en el producto (con `null` queda el marcador). `ancho`/`alto` son los de la copia (reservan el espacio). La foto llena la ventana de la carta, que es **vertical** (60×84 unidades de carta, ≈5:7, entre los índices de las esquinas): `object-fit: cover` (recorta, nunca estira) y `posicion` (object-position) elige qué parte queda a la vista; la carta del As se pide con `loading="eager"` y las demás con `loading="lazy"`. Ver «Fotos de los bebestibles (Justo)».

### Logo
Para cambiarlo con un solo archivo: copia el nuevo a `assets/brand/` y pon su ruta en `marca.principal`; deja `marca.cabecera: null`; ajusta `marca.proporcionPrincipal` (ancho / alto del archivo, p. ej. `'1200 / 400'`) y `marca.alturaCabecera` (≈44 para un logo cuadrado, ≈26–34 para uno horizontal).
Formato que conviene: **SVG** (o PNG ≥ 1200 px) **transparente, versión blanca**, recortado al contenido (sin margen vacío alrededor). La cabecera usa altura fija con `object-fit: contain`, así que sirve cuadrado u horizontal. Los anillos animados del hero se centran en el logo y se dimensionan según su ancho.
Mientras tanto: `logo-blanco-recorte.png` (hero) y `logo-blanco-wordmark.png` (cabecera, pie) son recortes del logo original; `favicon.png` también. Si cambias el logo, reemplaza también el favicon (`index.html`, `<link rel="icon">`).

## Carta en baraja (demostración)

La sección `#carta` es la baraja aprobada en `bar-tirua-baraja`, integrada sin su cabecera ni su pie. Lleva **8 bebestibles reales** de la carta de Justo del bar ($5.900–$8.500, con foto); es una carta **parcial** y el sello «Demostración» se mantiene porque palos, colores y As son provisionales. La plataforma real de pedidos sigue siendo el enlace discreto «Ver carta completa en la plataforma del bar» (web externa, otra pestaña).

- **Comportamiento:** el mazo (con el logo) está cerrado hasta que llega a la vista; entonces se abre en abanico y pasa a exploración. Se navega con flechas, teclado (← → Inicio Fin, Enter voltea), arrastre/swipe o tocando una carta vecina. Nombre y precio van en la franja de la carta activa (y también en su reverso al voltearla); la descripción, debajo. Hay buscador (sin tildes ni mayúsculas), lista rápida (`<dialog>`, Esc cierra y devuelve el foco) y chips de categoría. El scroll de la página nunca se captura. Con `prefers-reduced-motion` aparece abierta y sin inercia.
- **Categorías ↔ palos:** Bebestibles (corazones) está activa; Comidas individuales (picas), Postres (diamantes) y Para compartir (tréboles) son «Próximamente». Pulsar un bloque de `#categorias` o un chip «Próximamente» muestra el aviso visible «<categoría>: próximamente. Todavía no tiene productos» y deja la baraja en Bebestibles. Para activar una categoría: `activa: true` en `js/baraja-datos.js` y agregar sus productos con su `categoria`; aparece «Todo» entre los chips cuando hay más de una activa.
- **Joker:** solo visual, en «Opciones de demostración» (botón «Vista previa del joker (demostración)»). No hay aleatoriedad, premios ni descuentos; «Vincular a una solicitud de reserva» está deshabilitado.
- **Para el desarrollador:** al elegir categoría o producto se disparan en `document` los eventos `tirua:categoria` (`detail = { id, nombre }`; `id: null` = Todo) y `tirua:producto` (`detail = { id }`); queda `window.TIRUA.categoriaActual` / `productoActual` y `window.TIRUA.baraja.irACategoria(id)`.
- **Estilos:** `css/baraja.css`, con todas las clases `br-*` y variables `--br-*`; los ids de la baraja (`#carta`, `#baraja`, `#buscar`…) no se repiten en el resto del sitio.

## Fotos de los bebestibles (Justo)

- **Origen:** carta pública de Justo del bar (enlace de su bio de Instagram), extraída el 2026-10-18 en `../bar-tirua-justo` (`carta-justo.json`, `originales/`). Esa carpeta y los originales **no se modifican ni se copian al sitio**.
- **Productos (en orden de baraja; el primero es el As provisional):** Ramajito $8.000 · Playa Tirúa $8.500 · Sol de Fuego $7.900 · Botanical Collins $8.200 · Jackie Jr. $7.500 · Espresso Vainilla $6.900 · Ramazzotti Spritz $6.900 · Green Drinks $5.900. Nombre, descripción y precio son los del JSON (solo se recortan espacios; los errores de tipeo de la fuente, como «Ramazzoti» o «acido», se conservan). Descartados a propósito: Tübinger (la foto muestra 3 latas distintas) y Aperol Spritz (mano en primer plano).
- **Copias:** `assets/productos/*.webp` (WebP calidad 80, lado mayor 1000 px, proporción original, orientación EXIF aplicada), ≈24–35 KB cada una, **237 194 B en total**. `assets/productos/manifiesto.json` registra, por producto: id de Justo, nombre, original (ruta, dimensiones, sha256, bytes), copia (ruta, dimensiones, bytes) y URL de origen.
- **Peso de la página (bytes de cuerpo, medido):** ver INFORME.md. Aunque las fotos llevan `loading="lazy"`, Chromium las trae todas al cargar porque la carta queda dentro de su umbral de distancia; el total de fotos es 237 KB.
- **Permiso:** **pendiente**. No hay autorización confirmada del local para usar estas fotos en el sitio; el rótulo «Qué significa» lo dice. No publicar hasta resolverlo.
- **Qué falta:** permiso de las fotos con el local, el As real (el primero es provisional), la asignación definitiva de palos y colores, los productos de las otras 3 categorías (y su foto), filtros alimentarios (los datos no traen etiquetas: no se inventan) y el joker.

## Datos reales y pendientes

**Reales** (fuente: captura del perfil de Instagram @bartirua que entregó Pablo el 2026-10-17; viven en `LOCAL` de `js/contenido.js`):
- Instagram `@bartirua` (https://www.instagram.com/bartirua/); nombre en la bio «Tirúa Bar-Restorán | Pirque»; frase «Tu lugar de encuentro» (línea discreta del hero).
- Dirección: Ramón Subercaseaux 455, Pirque, Región Metropolitana, Chile («Cómo llegar» es un enlace normal a la búsqueda de Google Maps; no se incrusta nada).
- Ambiente: terraza cerrada y calefaccionada · Pet friendly.
- Reservas: «por DM» de Instagram (por eso la solicitud termina abriendo Instagram).
- Enlace de carta y pedidos de su bio: `https://cuenta.getjusto.com/client/start/jM5QpLn7ETXwZ5SJp/menu` (botón «Pedir en la plataforma del bar», enlace normal a otra pestaña; el pedido no se hace en este sitio).

**Por confirmar:** el horario «martes a sábado desde las 18:00» sale de la bio («Mar a sáb») y **no está confirmado por el local**: se muestra solo como dato informativo rotulado «según Instagram · por confirmar con el local», y no bloquea ningún día. **La hora de cierre se desconoce.** Que domingo y lunes no haya atención es una inferencia: por eso `reserva.diasCerrados` está vacío.

**Siguen de muestra / pendientes:** las otras 3 categorías de la carta (sin productos), descripciones y fotos de los bloques de categorías, las horas de reserva (18:00–22:30, rotuladas «Horarios de muestra desde las 18:00; el cierre y la disponibilidad los confirma el equipo»), la hora de cierre, 2 enlaces más de la bio que no se conocen, el logo nuevo y un plano real (hoy un dibujo rotulado «Plano ilustrativo»).

## Solicitud de reserva por Instagram (`reservar.html`)

Es una **solicitud, no una reserva**: la página no tiene disponibilidad, cupos, datos personales ni confirmaciones. El equipo confirma la disponibilidad por Instagram.

Flujo: **Personas** (1–6 y «7 o más», con aviso de que el equipo lo coordina por Instagram) → **Fecha** (calendario propio, hasta `reserva.horizonteDias` = 90 días; solo se deshabilitan los días pasados y los fuera de rango, **también domingo y lunes se pueden elegir**) → **Hora** (horas de muestra desde las 18:00; se muestra el horario del local como dato informativo) → **Solicitud** (aviso, resumen, mensaje listo, indicación «Copia tu solicitud y pégala en el chat de Instagram» y botones).

- **«Copiar mensaje»** copia el texto al portapapeles (`navigator.clipboard`); si el navegador lo impide, deja el mensaje seleccionado y avisa para copiarlo a mano. Es el **único** lugar donde la página escribe en el portapapeles, y solo cuando se pulsa ese botón.
- **«Abrir Instagram»** es un enlace normal a `https://www.instagram.com/bartirua/` (otra pestaña, `target="_blank" rel="noopener noreferrer"`). **Solo abre el perfil: no envía ni escribe el mensaje** (los enlaces de Instagram no permiten dejar un mensaje escrito de forma fiable) y **no toca el portapapeles**. Por eso la pantalla pide copiar el mensaje y pegarlo en el chat.
- Auto-avance (~350 ms) solo en Personas y Hora, solo con puntero y solo la primera vez que se elige; se puede corregir durante la pausa. Fecha avanza con «Continuar». Con teclado, al corregir algo ya elegido, o con «7 o más», no avanza sola: usa «Continuar». Con `prefers-reduced-motion` avanza sin animación. «Atrás» vuelve un paso y conserva lo elegido; el resumen superior (3 etapas) permite volver a una etapa completada.
- Para hoy, las horas que ya pasaron no se pueden elegir (es validez, no disponibilidad).
- No guarda nada en `localStorage`/`sessionStorage`/cookies y no hace peticiones de red.

**Qué falta para integrarlo de verdad:** confirmar con el local el horario y la hora de cierre (y entonces activar `reserva.diasCerrados` y ajustar `reserva.horas`); decidir si se quiere un sistema de reservas real (con disponibilidad) o seguir con solicitudes por Instagram; y, si se quiere que el mensaje llegue escrito, un canal que lo permita, que no existe en esta etapa.

## Video del hero

1. Copia el archivo a **`assets/video/hero.mp4`** (H.264; siempre va silenciado). Recomendado: 1920×1080 o menos, 10–20 s, bien comprimido (menos de ~5 MB), pensado para repetirse en bucle.
2. Opcional: `assets/video/hero.webm` y escribe su ruta en `data-webm="assets/video/hero.webm"` del `<video>` en `index.html` (se prueba primero el webm).
3. No hay que tocar nada más. Si el archivo no existe, se ve la portada animada en CSS/SVG.

`data-video` del `<video>`: `auto` (por defecto) hace **una** petición `HEAD` a `hero.mp4`; si existe, se monta; si no, portada y sin reintentos. `si` lo carga sin comprobar. `no` no pide nada.
Con `auto` y sin archivo, Chrome registra en consola **una** línea «Failed to load resource … 404» por el `HEAD`. Es un aviso de red del navegador, no un error de JavaScript. Para que ni esa línea aparezca, usa `data-video="no"` mientras no haya video.

Con video: reproducción automática, silenciada, en bucle y en línea; botón de pausa abajo a la derecha; se pausa solo al salir del hero. Con `prefers-reduced-motion` no se reproduce solo: se ve la portada y el botón permite iniciarlo.

## Notas

- **Mapa y Delivery:** el mapa es un dibujo SVG rotulado «Plano ilustrativo» (sin iframe ni peticiones externas); «Cómo llegar» y «Pedir en la plataforma del bar» son enlaces normales a otra pestaña (Google Maps y Justo). Si `url` queda en `null`, el botón vuelve a quedar deshabilitado (`aria-disabled`, enfocable, con su nota).
- Sin JavaScript el sitio no muestra menú, categorías ni logo, y la baraja muestra un aviso `<noscript>`.
- Fuentes: Poppins (SIL Open Font License 1.1), copiada de un paquete ya presente en el equipo; como TTF sin comprimir (~155 KB cada una). Convertirlas a WOFF2 reduciría el peso.
- Retira los avisos «Sitio en construcción · carta parcial y fotos por confirmar» (`aviso`, `pie.aviso`) al publicar, y no publiques mientras el local no confirme el uso de las fotos.

## Pruebas

Con un servidor propio en el puerto 4201: `python3 -m http.server 4201 --bind 127.0.0.1` (el puerto por defecto de `_lib.cjs` es 4200; usa `BASE=http://127.0.0.1:PUERTO/`). Usa `playwright-core` ya instalado en el equipo (ver `pruebas/_lib.cjs`).

- `node pruebas/baraja-funcional.cjs [m390|d1440]`: la batería de la baraja (apertura, flechas, teclado, swipe/arrastre, vecinas, nombre y precio = aria-label = lista rápida, búsqueda, lista rápida, chips, joker sin `Math.random`, scroll natural, clics rápidos). Con `CAP_DIR=carpeta` también guarda capturas.
- `node pruebas/movil-estrecho.cjs`: móvil estrecho y de poca altura (320×568, 320×640, 360×640, 375×667, 390×664, 390×844, 412×740): sin desborde ni recorte en la cabecera y herramientas de la carta, título dentro de su columna, naipe/descripción/flechas sin desplazar (320×568: flechas no exigidas, límite físico), ningún nombre partido a mitad de palabra en las 8 cartas, tamaños mínimos y 0 errores JS. Emulación; 280 px queda fuera.
- `node pruebas/baraja-extra.cjs`: reduced-motion, 6 anchos (360, 390, 768, 1280, 1440, 1920: sin desbordamiento, controles ≥44 px), ARIA y foco, rendimiento, foto real y varias categorías (con datos interceptados), red.
- `node pruebas/baraja-campana.cjs <movil|escritorio> <N> [--cpu=4] [--fria] [--fresco] [--out=archivo.json]`: campaña de clics mezclados (cuenta botones movidos, clics fuera del botón y listeners sin disparar). **Correr una campaña a la vez** (un navegador a la vez): lanzar dos en paralelo o salir del proceso con el navegador abierto provoca los errores «Target … closed» y los timeouts de apertura vistos en la integración anterior.
- `node pruebas/baraja-fotos.cjs`: los 8 bebestibles contra `carta-justo.json` (nombre, precio, descripción, foto correcta en cada carta activa), copias WebP (existen, abren, dimensiones, pesos, hashes de los originales), foto sin deformar, contraste y tamaño de nombre y precio, red (0 externas / 0 404), peso inicial y total, bloque «Bebestibles» → carta con cabecera sin tapar. Deja material en el directorio temporal para `python3 pruebas/comparar-fotos.py <m390|d1440> [hoja.png]` (compara píxeles reales con el render esperado y arma la hoja de contactos).
- `python3 pruebas/optimizar-imagenes.py [salida]`: regenera `assets/productos/*.webp` y `manifiesto.json` desde `../bar-tirua-justo` (solo lee; necesita PIL, que ya está en el `python3` del sistema). `python3 pruebas/verificar-fotos-json.py`: revisa los 8 productos contra el JSON.
- `node pruebas/sondeo-pliegue-movil.cjs`: qué se ve sin desplazar en 390×844 al llegar a la carta (sitio vs demo).
- `node pruebas/prueba.cjs <sin-video|con-video|video-roto|reducido|teclado|tamanos|menu|categorias|navegacion|contenido-alterno>`: sitio general, categorías → carta y navegación con cabecera fija.
- `node pruebas/reservas.cjs <flujo|enlaces|domingo-lunes|dias-cerrados|copiar-fallo|sietemas|teclado|reducido|hoy|instagram-ausente|estados|inicio>` (bloquea la navegación a Instagram, Google y Justo).
- Resultados crudos en `pruebas/resultados/`; resumen en `INFORME.md`.
