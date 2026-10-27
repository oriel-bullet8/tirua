# Continuidad · Bar Tirúa (estado al 2026-10-24 · Volumen 4 «Fogón»)

Versiones y próximo paso: `docs/VERSIONES.md`. Hoja de estado (para Notion): `docs/ESTADO.md`.

Leer esto antes de tocar el sitio. Arranque y verificación: `README.md`. Detalle técnico de la demo: `docs/DEMO-README.md` («Demo completa» y «Segunda vuelta»), cifras: `docs/INFORME.md`, contrato del ciclo (histórico): `loops/demo-completa.md`.

**Carpeta de trabajo única desde 2026-10-23:** `/Users/pablito/Documents/Codex/Proyectos/tirua` (clon de https://github.com/oriel-bullet8/tirua; la raíz del repo es la raíz de la web). Las carpetas anteriores en `…/2026-10-15/est-2/outputs/` (`bar-tirua-sitio`, `-justo`, `-baraja`, `-web`, `-hermes`) siguen intactas como respaldo: no trabajar ahí.

## Dónde quedamos
**Volumen 4 «Fogón» (2026-10-24).** Sitio estático local, sin publicar y sin commits (paquete .zip como respaldo). `index.html`: hero con logo y «Novedades» de Instagram (burbujas tipo historias, hoy vacías: demo en `?demo=instagram`), categorías con foto, carta en baraja inmersiva a pantalla completa, reservas, mapa de Google, delivery con Justo. `reservar.html`: cascada de cuatro preguntas (Personas, Fecha, Hora, Tus datos) con mensaje en vivo y dos salidas, «Enviar por WhatsApp» (enlace `wa.me`) y «Copiar mensaje». Tema blanco con rojo de acento; Young Serif + Alegreya Sans; oscuro disponible con `?tema=oscuro`. Estado completo en una hoja: `docs/ESTADO.md`; versiones: `docs/VERSIONES.md`.

## Antes de empezar (checklist)
1. **Servidor:** `python3 servir.py` (o `npm start`; puerto 4195, solo 127.0.0.1, sin caché; sirve la carpeta del script, funciona desde cualquier directorio). Lanzarlo desde Terminal, no desde un proceso con sandbox (ver «Incidente de los 404»). NO usar `python3 -m http.server`: muestra versiones viejas mezcladas. Si algo se ve viejo: Cmd+Shift+R y subir `?v=` en `index.html`/`reservar.html`.
2. Los servidores se cuelgan con el tiempo (respuesta vacía): matar solo el proceso de Tirúa (`lsof -nP -iTCP:4195 -sTCP:LISTEN`) y relanzar. El 4198 (demo suelta `bar-tirua-baraja`) ya no hace falta.
3. Confirmar que no haya otro agente escribiendo (`ps`). Los originales de Justo (203 MB) no están en el repo: `TIRUA_JUSTO=<…/bar-tirua-justo> npm run test:baraja:fotos` los verifica; no modificarlos. Respaldo previo a la migración: `~/Documents/Codex/respaldos-tirua/2026-10-23-antes-de-migrar/`.
4. `npm install` una vez; luego correr las pruebas UNA a la vez (`npm run test:recursos`, `test:baraja:m390|d1440|extra|fotos`, `test:movil`, `test:vuelta2`, `test:reservas-datos`, `node pruebas/prueba.cjs <modo>`, `node pruebas/reservas.cjs <escenario>`; BASE=http://127.0.0.1:4195/). `prueba.cjs con-video` no aplica sin `hero.mp4`. Resultados de la pasada del 2026-10-23: ver el informe de la migración / `pruebas/resultados/` (ignorado por Git).
5. Identidad = la del bar (negro/blanco del logo), nunca el sistema visual personal de Pablo. No inventar productos, precios, fotos, horarios ni condiciones del joker.

## Pendiente de Pablo
- Probar en el iPhone (`python3 servir.py 4196 --red`) y contar qué falla (H1 del loop).
- Pasar 4 o 5 publicaciones del Instagram del bar (imagen, título, texto) para el hero. No compartir contraseñas: ver `docs/INSTAGRAM-PLAN.md`.
- Pedir al equipo de marketing el video del hero (`docs/GUIA-VIDEO-HERO.md`).
- Confirmar con el bar si reciben reservas por WhatsApp o solo por DM de Instagram.

## Pendiente de Oriel / del bar (qué bloquea cada cosa)
- **Número de WhatsApp del bar** → `LOCAL.whatsapp` en `js/contenido.js` (hoy `null`). No inventarlo. Si el bar solo recibe reservas por DM, cambia la salida principal (ver «Decisiones de Pablo» al final).
- **Hora de cierre** → hoy las horas de reserva son de muestra hasta las 22:30. (Martes a sábado desde las 18:00 ya está confirmado.)
- Permiso de uso de las fotos de Justo → bloquea publicar.
- Agrupar las 27 categorías de Justo en las 4 (o cambiarlas) → bloquea sumar los ~289 productos (hay 39 sin categoría en Justo). Qué hacer con más de 13 cartas por palo.
- Zonas, costos y tiempos de delivery; as real, palos definitivos, condiciones del joker, filtros alimentarios, plano real.
- Resuelto: logo en negro (no hace falta), horario de días (martes a sábado).

## Ideas siguientes (propuestas, sin hacer)
Más animación y estructuras llamativas: hero con video o parallax de logo, transiciones entre secciones, galería real del local, la carta en baraja más protagonista, microinteracciones en reservas. Para diseño usar Impeccable (`/impeccable`, hay v4.7.0 disponible; actualizar solo si Pablo lo pide) y registrar PRODUCT.md con `init` cuando se rediseñe en serio.

## Límites conocidos
Solo Chromium headless emulado (nada de teléfonos reales, Safari/iOS, Firefox, lector de pantalla). 320×568: las flechas de la baraja no caben sin desplazar; 280 px no soportado. El mapa de Google es el único tercero (iframe `tabindex=-1`). Fuentes TTF sin comprimir (~0,7 MB; WOFF2 pendiente). Fotos y precios de Justo del 18-oct-2026.

## Incidente de los 404 (2026-10-23)
`js/*`, `/js/`, `/assets/…/` daban 404 en el proceso viejo de 4195 (PID 6199, `python3 servir.py 4195`, lanzado el 20-oct desde otra herramienta; padre = launchd) mientras `index.html`, `reservar.html` y `css/*` sí cargaban. Los archivos existían y tenían permisos 644/755 normales.
**Causa comprobada (correlación, no traza de syscall):** de 176 archivos del sitio, el proceso solo servía los que llevaban en `com.apple.macl` (control por app de macOS sobre `~/Documents`) la entrada `127744B2…`: 50/50 con esa entrada → 200; 126/126 sin ella (69 con solo otra entrada `F8420C88…` y 57 sin atributo) → 404. Las carpetas nunca la tienen, por eso el listado daba «No permission to list directory». Un `servir.py` nuevo, lanzado desde la terminal local sobre la misma carpeta, sirvió 176/176 con 200; el contenido y los permisos no cambiaron. No se desactivó ninguna protección ni se cambiaron permisos.
**Qué no se probó:** no se identificó qué app corresponde a cada UUID del atributo ni se trazó el `open()` fallido (macOS no deja `dtruss` sin desactivar SIP). La solución es el reinicio desde un terminal normal; si vuelve a pasar, relanzar así antes de buscar otra causa.

## Qué no se trajo a esta carpeta (sigue en las carpetas antiguas y en el respaldo)
`referencia/` (boceto descartado del asistente de reservas, 1,5 MB), `capturas/` (50 MB de capturas de pasadas anteriores; se regeneran con las pruebas), `bar-tirua-justo/originales` y `crudo` (203 MB), `bar-tirua-baraja`, `bar-tirua-web`, `bar-tirua-hermes`.

## Tercera vuelta de diseño (2026-10-23): blanco, voz de campo, carta inmersiva
Pedido de Oriel (vía Pablo): probar el sitio en blanco, tipografía menos «aviso publicitario» y más de campo, y la carta como experiencia inmersiva.
- **Tema:** claro por defecto (fondo blanco, tinta marrón casi negra `#17130f`, rojo Tirúa `#b3202a`). El oscuro original sigue disponible: `?tema=oscuro` (queda guardado en el navegador) y `?tema=claro` lo revierte. Todo cuelga de tokens (`--fondo`, `--tinta`, `--rojo`…) en `css/styles.css`; las fotos de categoría conservan texto blanco sobre velo oscuro. El logo solo existe en blanco: sobre papel claro se invierte por CSS (`filter: invert(1)`); lo ideal es pedir a Oriel el logo en negro.
- **Tipografía:** Young Serif (titulares) + Alegreya Sans (cuerpo), autoalojadas (OFL, `assets/fonts/`). Elegida por Pablo sobre una muestra de 5 pares (Young Serif, Zilla Slab, Caprasimo, IM Fell English SC, Amatic SC). Sin versalitas tracked de cartel.
- **Carta:** en la página es un portal (mazo cerrado + «Abrir la carta»). Al abrirse, `#carta` pasa a pantalla completa (`.br-inm`, la activa `js/baraja.js` mientras el mazo no esté cerrado): cartas de hasta 560 px, flechas, arrastre, rueda/trackpad (vertical u horizontal) y teclado; solo quedan la X, un botón de lupa (bandeja con buscar, lista rápida, palos, barajar y joker de demostración) y el sello «Demostración». Esc cierra lista → bandeja → carta. Ya no se abre sola al llegar a la vista.
- **Pruebas:** `npm run test:inmersivo` cubre portal, modo inmersivo y tema. Las pruebas viejas de geometría de la baraja (`baraja-funcional`, `baraja-extra`, `baraja-campana`, `movil-estrecho`, `prueba.cjs`, parte de `reservas.cjs`) asumen el diseño oscuro con herramientas dentro de la página y están pendientes de adaptar; no están en `npm run verificar`.
- **Pendiente de ojo humano:** contraste de textos sobre las fotos de categoría y del fondo del mapa en claro, y cómo se ve el hero si algún día hay video (conserva tokens oscuros con `.hay-video`).

### Iteración 2 de la tercera vuelta (2026-10-23, segunda parte del pedido de Oriel)
- **Palos a los costados:** en cada naipe los corazones ya no se apilan bajo la foto; se suman en dos columnas verticales, una a cada lado (izquierda primero: A = 1+0, 2 = 1+1, 3 = 2+1 … 8 = 4+4). La foto creció (94 cqw de alto) al liberar la franja de abajo. Código: `pipsHtml` en `js/baraja.js`, `.br-pips__col` en `css/baraja.css`.
- **Reserva, personas:** las teselas muestran solo el número (la séptima, «7+»); «persona/personas» queda solo en el `aria-label` para lectores de pantalla. Las cifras usan numerales alineados (`lnum`).
- **Cartas más grandes y horizontal primero:** en escritorio la carta activa pasa de ~500 a ~550 px (a 1920×1080, ~680 px). El contador bajó a la esquina inferior izquierda. Con pantalla apaisada y baja (celular girado, 844×390) la descripción pasa a una leyenda sobre el borde inferior, las flechas salen a los costados y la carta ocupa casi todo el alto (`@media (orientation: landscape) and (max-height: 620px)`).
- Idea de Oriel pendiente: grabar el recorrido de la página en pantalla para un Reel/TikTok; se puede automatizar con Playwright (`recordVideo`).
- **Reverso con la ficha del trago (2026-10-23):** con la baraja abierta, al voltear una carta (clic/toque/Enter) el reverso muestra en lugar del logo la categoría de Justo (`justo` en `js/baraja-datos.js`: «Coctelería de autor», «Spritz», «Mocktail») y la descripción de Justo tal cual; abajo siguen nombre y precio. Con el mazo cerrado (portal) el reverso sigue mostrando el logo. La carta activa lleva un icono discreto de «voltear» y la leyenda de abajo se atenúa mientras está dada vuelta. La carta de Justo no trae ingredientes en lista, alérgenos ni volúmenes: no se inventan; si el local los entrega, se agregan al dato y a `dorsoInfoHtml` en `js/baraja.js`.
- **Reservas centradas + botón píldora (2026-10-23):** el botón «Reservar mesa» se salía por la derecha en Safari porque `min-width: min(100%, 320px)` en una columna `auto` lo resuelve como 320 px; se reemplazó por `min-width: 0`. La sección Reservas quedó centrada y el botón es una píldora con círculo de flecha (rojo, se rellena al pasar el mouse); los botones del hero también son píldora.
- **Hero con video:** probado el mecanismo (`assets/video/hero.mp4`) con un clip sintético: logo blanco, velo oscuro y botón de pausa funcionan sobre el tema claro. Falta el video real. Ver `docs/INSTAGRAM-PLAN.md` (por qué los reels no sirven como archivo y qué pedir al bar).
- **Plan Instagram:** `docs/INSTAGRAM-PLAN.md`.

### Loop «página casi lista» (2026-10-23): ver `loops/pagina-casi-lista.md`
Estado: todo lo automatizable en PASS (C1–C10). Pendiente solo humano/bar (H1 teléfonos y Safari reales; H2 video, WhatsApp, horarios). Se agregaron `pruebas/sondeo.cjs` (`npm run sondeo`: errores, desbordes, foco, estrés aleatorio de la carta, reserva, movimiento; ~20 min con `SOLO=` para bloques) y más comprobaciones en `pruebas/inmersivo.cjs`. Cambios de funcionamiento: «Atrás» cierra la carta, bloques «Próximamente» no abren la carta, Esc/foco/inercia de la rueda, `hoy` sin horas no se puede elegir, aviso suave en lunes/domingo, delivery sin solapes, calendario de 44 px. Detalles: pista y asomo del volteo, contador en palos, categorías repartidas, calor del hero (pausado fuera de pantalla), sello en el resumen, inclinación/brillo del naipe con el mouse.

### Novedades de Instagram en el hero (2026-10-24)
Sin video de hero utilizable, el hero muestra burbujas tipo historias bajo los botones y un visor a pantalla completa (`js/historias.js`, datos en `datos/instagram.json`; vacío por defecto: el hero queda como antes). Ver el diseño: `/?demo=instagram`. Contenido real: a mano (JSON + `assets/instagram/`) o automático con `scripts/instagram-sync.mjs` + `.github/workflows/instagram.yml` (inerte hasta tener repo en GitHub y secreto `IG_TOKEN`; probado solo contra API simulada). Detalle y límites: `docs/INSTAGRAM-PLAN.md`. Para el video futuro: `docs/GUIA-VIDEO-HERO.md` (horizontal 1920×1080 + vertical 1080×1920; `assets/video/hero.mp4` y `hero-vertical.mp4`).

### Reservar en cascada (2026-10-24)
Pedido de Pablo: que las preguntas se abran a medida que se responde, que se vea el mensaje a enviar mientras se rellena, y que «Enviar por WhatsApp» sea un hipervínculo que abra WhatsApp en el chat del bar con el texto pegado.
- **Cascada:** `reservar.html` ya no es un asistente de una pantalla por paso con barra de pasos. Son cuatro preguntas apiladas (`.etapa`): solo existen la actual y las respondidas (plegadas con la respuesta y «Cambiar»). Elegir con puntero abre la siguiente tras ~350 ms; con teclado aparece «Continuar» y el foco no se mueve solo. Cambiar una respuesta con todo completo pliega todo y lleva al mensaje. Calendario de un solo mes. Código: `js/reservar.js`; estilos al final de `css/styles.css`.
- **Mensaje en vivo (`.vista`):** aparece al elegir personas; lo que falta se ve como `[fecha]`, `[hora]`, `[tu nombre]`; «Enviar por WhatsApp» y «Copiar mensaje» se habilitan solo con el mensaje completo. Se quitó «Abrir Instagram» de este flujo (pedido: dos opciones).
- **WhatsApp:** el enlace es `https://wa.me/<LOCAL.whatsapp>?text=<mensaje>`. **Falta el número del bar** (`LOCAL.whatsapp`, hoy `null`): con `null` abre WhatsApp con el texto y se elige el chat. En cuanto Oriel/Pablo entreguen el número (solo dígitos con código de país), el enlace abre directo el chat del bar sin tocar más código. La prueba lo comprueba inyectando un número ficticio.
- **Pruebas:** `npm run test:reservas-datos` reescrita (64 comprobaciones: cascada, huecos, enlace, copiar, teclado, «hoy» con reloj simulado, móvil y escritorio); bloque de reserva de `sondeo.cjs` adaptado. `pruebas/reservas.cjs` queda como histórico del asistente anterior (no corre contra la página actual).

### Decisiones de Pablo (2026-10-24, después del Vol 4)
- **Horario:** el bar atiende de martes a sábado desde las 18:00 (su Instagram). Domingo y lunes pasan a ser días sin atención en el calendario de reservas (`diasCerrados: [0, 1]`); se quitó el aviso suave de esos días. La hora de cierre sigue sin saberse (las horas siguen siendo «de muestra» hasta las 22:30).
- **Logo:** se queda el invertido por CSS; no se pide versión en negro. La página en blanco es la propuesta elegida.
- **Instagram:** las publicaciones del hero se sacarán del Instagram del bar (Pablo las pasa; ver `docs/INSTAGRAM-PLAN.md`). El video del hero es petición al equipo de marketing.
- **Número de WhatsApp:** sigue sin existir. **Ojo:** la bio dice «Reservas por DM»; falta confirmar si el bar usa WhatsApp o solo mensajes de Instagram para reservar. Si es solo DM, la salida sería un botón a `ig.me/m/bartirua` (abre el chat de Instagram; el texto hay que pegarlo con «Copiar mensaje»).
- **Probar en iPhone:** `python3 servir.py --red` (opcional; el modo normal sigue solo en 127.0.0.1).

### Cierre del Vol 4 y apertura del Vol 5 (2026-10-24)
Pablo probó en su iPhone («funciona muy bien», sin fallas que reportar) y pidió que la versión con Instagram (`?demo=instagram`) quede dentro del Vol 4 completo. Vol 4 cerrado como 4.0.1 con `npm run verificar` en verde; paquete `tirua-vol4-fogon-2026-10-24-final.zip`. El Volumen 5 parte con foco en mejorar la demo de Instagram (ver `docs/VERSIONES.md`).

### Las historias son la página normal (2026-10-26)
Pablo pidió que el enlace «verdadero» del sitio sea el que tiene las historias de Instagram, sin necesitar `?demo=instagram`. `js/historias.js` ahora lee `datos/instagram.json` y, si no trae publicaciones válidas, cae a `datos/instagram.demo.json` (5 ejemplos con «Ejemplo» en la burbuja, en el visor y en el aria-label). Con publicaciones reales no se ven los ejemplos. `?demo=instagram` los fuerza y `?demo=no` los apaga. Pruebas: `historias.cjs` 53/53 (con casos nuevos «ejemplos por defecto» y los de «sin datos» usando `?demo=no`); sondeo 97 OK / 0 fallas (la lista de burbujas es un carrusel horizontal permitido; el check de «hoy» ahora entiende domingo y lunes cerrados). Al activar la sincronización real o cargar publicaciones a mano, los ejemplos desaparecen solos.
