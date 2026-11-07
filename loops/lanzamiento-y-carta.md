# Loop · Lanzamiento oficial + carta completa (Tirúa)

Fuente de verdad del loop. Diseñado con loop-architect el 2026-11-07; lo ejecuta loop-runner. Estado vivo al final.

## LOOP SPEC (resumen operativo)

**Classification:** Loop RECOMMENDED · Pattern Build + Human-in-the-loop · Scope HYBRID (carta CLOSED, lanzamiento OPEN) · Verification Mixed (Playwright + conteos contra JSON; ojo humano para «atractiva»; aprobación humana para publicar) · Complexity Standard.

**Objective (original, Pablo):** «Lanzar Tirua Oficial con el dominio comprado por el mismo Bar. Conectar toda la carta actual. Fotos, descripción y organización de carta (de manera atractiva y bien hecha, con orden). Objetivo: poder tener estos puntos completos antes de mi reunión con Oriel.»

**Restricciones [USER]:** base = última versión de Oriel (`origin/codex/baraja-negro-esencial`, c078cd7); usar loop-architect/loop-runner, Playwright, plugins y skills; terminar antes de la reunión con Oriel (hoy, 2026-11-07, probablemente); dominio comprado por el bar; carta atractiva, bien hecha y con orden; no inventar productos, precios, fotos, horarios ni condiciones; sin commit/push/publicar sin pedirlo; identidad del bar; fotos de Justo autorizadas por el bar (Pablo, 2026-11-07).

**Datos de la carta [INFERRED de la captura del 2026-11-07]:** `archivo/2026-11-07-justo/carta-justo-2026-11-07.json` (+165 originales en `originales/`). 27 secciones en orden de Justo; 251 productos de carta (cada uno en 1 sección); 39 ítems internos sin sección (promos, agregados, eventos) NO son carta y se excluyen. 165 con foto, 226 con descripción, 158 con ambas, 18 sin ninguna. 74 salen «no disponible ahora» en Justo. «McTirua» y «grupo 80» sin precio.

**Missing:** nombre del dominio, registrador y quién tiene el DNS (Pablo consulta a Oriel) · dueño del proyecto Vercel = Oriel (acceso para conectar dominio) · si la carta sigue sincronizada con Justo o es foto fija · número de WhatsApp · qué hacer con los 74 «no disponible ahora».

### Definition of Done
1. Rama de trabajo desde c078cd7 con línea base de pruebas registrada.
2. Los 251 productos de carta aparecen en el sitio (los 39 internos excluidos, lista aprobada); conteo renderizado = conteo del JSON, comprobado con Playwright.
3. Cada producto muestra nombre y precio, y foto/descripción cuando existen. Sin imágenes rotas ni texto inventado.
4. Cada producto en una sola sección; navegación entre secciones funciona a 390×844 y 1440×900.
5. Capturas sin desbordamiento horizontal ni errores de consola; Pablo aprueba el aspecto.
6. `npm run verificar` en verde (pruebas obsoletas por el diseño de Oriel adaptadas o retiradas con justificación).
7. Dominio oficial responde HTTPS 200 con la versión nueva; canonical y og:url apuntan al dominio; recorrido Playwright contra el dominio pasa.
8. Informe a Pablo con lo hecho y lo pendiente.

### Actions
AUTO: crear rama, servidor local y Playwright, leer/re-extraer Justo, proponer secciones, editar la rama de trabajo, preparar fotos optimizadas localmente, verificar el dominio.
REQUIRES APPROVAL: commit/push/PR · preview de Vercel · conectar dominio/DNS/producción. (Fotos de Justo: permiso ya dado.)

### Decision Rules
- IF faltan datos/acceso del dominio THEN seguir con la carta y marcar el lanzamiento bloqueado (ESCALATE al final si persiste).
- IF una prueba falla y estaba roja en la línea base THEN heredada; si estaba verde THEN corregir la causa.
- IF producto sin foto o descripción THEN mostrarlo sin ellas; listarlo para el bar.
- IF presupuesto agotado THEN REDUCE SCOPE (secciones prioritarias).
- IF sección verificada y aprobada THEN siguiente.

### Main Loop
Base + línea base → proponer secciones → **CP1** → [por bloque: construir → verificar (Playwright, conteo, capturas) → ¿aprueba Pablo? no: corregir / sí: siguiente] → carta completa → `verificar` → **CP3** → preview → **CP4** → dominio → verificar dominio → PASS? → informe.

### Human Checkpoints
- CP1 · antes de editar la carta · Pablo · agrupación de las 27 secciones en bloques, presentación, tratamiento de datos faltantes y de los «no disponibles».
- CP3 · antes de commit/push/preview · Pablo.
- CP4 · antes de conectar dominio y producción · Pablo + quien tenga el DNS (Oriel/bar).
- (CP2 fotos de Justo: resuelto, el bar las autorizó.)

### Guardrails
No inventar datos · identidad del bar · no tocar `respaldos/`, `archivo/` ni originales · no guardar contraseñas/tokens · una prueba Playwright a la vez; nunca `http.server` (usar `servir.py`) · no pisar cambios de Oriel · no borrar sin mirar el destino.

### Budget
Iteraciones: 8 ciclos de construcción [SUGGESTED] · fallos consecutivos: 3 [SUGGESTED] · tiempo: hasta la reunión (hoy) · al exceder: REDUCE SCOPE.

### Stop
SUCCESS = DoD con evidencia · ESCALATE = falta dominio/DNS/acceso Vercel o decisión humana · ABORT = publicar sin autorización o inventar datos.

---

## AGENT PROMPT

ROLE: Ingeniero de la web de Bar Tirúa que ejecuta este loop.
OBJECTIVE: Mostrar la carta completa de Justo (foto, descripción, precio, ordenada y atractiva) sobre la versión de Oriel, y dejar el sitio listo para el dominio oficial antes de la reunión con Oriel.
STATE: rama/commit, línea base, bloques aprobados, conteo vs 251, estado del dominio, checkpoints, iteración.
MEMORY: «Estado vivo» al final de este archivo; actualízalo cada ciclo.
LOOP: 1 línea base · 2 proponer bloques (CP1) · 3 construir y verificar por bloque · 4 `npm run verificar` · 5 CP3 → preview · 6 CP4 → dominio → verificar · 7 informe.
RECOVERY: no repitas sin información nueva; heredadas se documentan; build/DNS fallido → leer log y cambiar de estrategia.
HUMAN APPROVAL: detente antes de CP1, CP3 y CP4 con capturas, conteos y diff.
RESOURCE LIMITS: 8 ciclos (propuesto, confirmar), 3 fallos seguidos (propuesto, confirmar), hasta la reunión.
STOP: SUCCESS · ESCALATE · ABORT según el spec.
REPORTING: estado final, evidencia de la DoD, hecho y pendiente.

---

## Estado vivo

- **Rama de trabajo:** `carta-y-lanzamiento`, creada el 2026-11-07 desde `origin/codex/baraja-negro-esencial` (c078cd7). Upstream desvinculado para evitar pushes accidentales. `CONTINUIDAD.md` y `README.md` con cambios locales previos sin commit (de Pablo), intactos.
- **Datos de carta:** capturados (ver arriba).
- **Línea base de pruebas (fresca, 2026-11-07, sobre c078cd7; logs en `pruebas/resultados/base-*.log`, ignorados por git):** PASS `test:recursos` (58/58), `test:historias` (59/59), `test:instagram-sync`. FAIL heredadas del rediseño de Oriel: `test:inmersivo` 114/117 (carta 5: palos a los costados; Oriel quitó los palos del frente), `test:vuelta2` 32/40 (reservas Personas→Fecha→Hora y ficha del local alineada a la izquierda; Oriel integró reservas y centró la ficha), `test:baraja:fotos` 64/188 entradas con falla (precio/nombre sobre franja, contraste, índices; Oriel quitó precio del frente), `test:reservas-datos` se cae al inicio (selector de la cascada; Oriel cambió reservar.js). Ninguna es regresión nuestra; limitación: no se probó si alguna falla además esconde un bug real.
- **CP1: APROBADO por Pablo (2026-11-07).** 6 bloques (Para compartir · Platos · Postres y café · Coctelería · Destilados, vinos y espumantes · Cervezas y bebidas); página `carta.html` + baraja destacada en el home; mostrar los 251 sin marca de disponibilidad, sin foto = línea de texto, sin descripción = solo nombre y precio, sin precio = se oculta; se excluyen los 39 ítems internos.
- **Ciclo 1 (2026-11-07) — carta construida, sin commit:** `carta.html`, `css/carta-pagina.css`, `js/carta-pagina.js`, `js/carta-datos.js` (generado), `assets/carta/` (165 webp, 6,1 MB), `scripts/carta-construir.py` (`npm run carta:construir`), `pruebas/carta-pagina.cjs` (`npm run test:carta`). Menú «Carta» → `carta.html` en inicio y reservas; botón «Ver la carta completa» en el inicio.
- **Checks (evidencia fresca, Playwright, 2026-11-07):** C-carta PASS `npm run test:carta` 64/64 (320, 390, 768 y 1440 px: 251 productos = JSON, 165 fotos, nombres/descripciones/precios/secciones coinciden uno a uno, 0 imágenes rotas, 0 errores, sin desborde, buscador, barra por bloque, menú). Regresión: `test:recursos` 227/227, `test:historias` 59/59, `test:inmersivo` 114/117 (igual que la línea base; las 3 son heredadas). Limitación: la prueba valida contenido y mecánica, no el aspecto; faltan Safari/teléfonos reales y el visto bueno visual de Pablo (DoD 5).
- **Datos que Pablo debe confirmar:** (a) rótulos corregidos por tipeo: «Entradas Frias»→«Entradas frías» y «Shop»→«Schop» (sus productos son schops); (b) «HALLOWEEN» (Shot, estacional, sin precio ni descripción) y «McTirua»/«grupo 80» sin precio: ¿se muestran?; (c) el aviso superior dice «Sitio en construcción · carta parcial y fotos por confirmar» (ya no es verdad); (d) canonical/og siguen en `tirua-website.vercel.app` hasta conocer el dominio.
- **BLOQUEADO (BLOCKED, externo):** DoD 7 (dominio). Falta nombre del dominio y acceso al DNS / proyecto Vercel (Oriel). CP3 y CP4 pendientes de Pablo. DoD 6 (`verificar` verde) PENDING: hay que adaptar o retirar las pruebas obsoletas (inmersivo 3, vuelta2 8, baraja:fotos 64, reservas-datos).
- **Dominio:** sin nombre/acceso; Pablo consulta a Oriel. Proyecto Vercel es de Oriel.
- **Iteración:** 1 · **Fallos consecutivos:** 0

### Ciclo 2 (2026-11-07, tarde) — cambio de rumbo pedido por Pablo
- **Decisión de Pablo (reemplaza parte de CP1):** la carta completa debe vivir DENTRO de la baraja de Oriel; la página `carta.html` pasa a ser la alternativa «tradicional», ofrecida como PDF en línea (`assets/carta/carta-tirua.pdf`, 12 págs, 113 KB, solo texto; `npm run carta:pdf`).
- **Hecho:** baraja con las 251 cartas en 4 palos (Para compartir 20 · Comidas individuales 29 · Postres 6 · Bebestibles 196) y una segunda fila de chips con las secciones de Justo; las 8 cartas con recorte de Oriel intactas; fotos enteras dentro del marco para las demás; sin foto = paisaje pintado. Generador: `npm run carta:construir` (escribe `js/baraja-productos.js`, `js/carta-datos.js`, `datos/carta.json`, `assets/carta/`). Delivery sigue mostrando solo las 8 bebidas estrella. Sello «Demostración» y opciones de joker ocultos (`hidden`). Aviso superior y pie actualizados (ya no dicen «en construcción / carta parcial»).
- **Guardado:** commit local `a1b2eda` (rama `carta-y-lanzamiento`, sin push) + `respaldos/tirua-carta-baraja-2026-11-07-antes-madera.zip` (+ .sha256).
- **Vista previa madera (no final):** `index.html?madera=1` (apaga con `?madera=0`), `css/preview-madera.css`. Textura aproximada por código: falta el archivo de la foto de madera real.
- **Checks frescos:** `test:carta` 67/67, `carta-baraja` 49/49 (`node pruebas/carta-baraja.cjs`). Pruebas viejas de la baraja (`test:inmersivo`, `test:vuelta2`, `test:baraja:fotos`) asumen 8 cartas y precio en el frente: FAIL por diseño; adaptar o retirar (DoD 6 sigue PENDING).

### Ciclo 3 (2026-11-07, noche) — fluidez y flujo «Escoger mazo»
- **Pedido de Pablo:** la sección de la baraja iba lenta y costaba cargar la animación; orden propuesto: «Abrir la carta» → «Escoger mazo» (categorías) → carga del mazo elegido. Se usó la skill design-motion-principles (peso: Jakub principal, Jhey secundario, Emil solo en la navegación entre cartas).
- **Medición antes (fresca):** 19.761 nodos DOM, 1.346 SVG, HTML 1,5 MB; apertura con fotogramas p95 67 ms, máx 167 ms y tareas largas de 70–140 ms. **Después:** 1.435 nodos, HTML 111 KB; p95 17 ms, máx 33 ms, 0 tareas largas.
- **Cambios:** cartas con DOM perezoso (solo ±5 de la activa y las 12 del abanico; `montar`/`desmontar` en `js/baraja.js`); entrada a pantalla completa solo con opacidad (antes clip-path circular animado); apertura del mazo 1450→950 ms, cierre 550→450 ms; paso «Escoger mazo» (`#mazos`, 4 mazos con su cantidad, entrada escalonada, salida al elegir, foco gestionado, Esc/X/Atrás cierran el selector, «Cambiar de mazo» en la bandeja); reduce-motion sin animaciones.
- **Checks frescos:** `node pruebas/carta-baraja.cjs` 79/79 (2 corridas), incluye rendimiento (p95 ≤ 34 ms, sin tareas largas); `test:carta` 67/67; `test:recursos` 261/261; `test:historias` 59/59. Limitación: Chromium sin GPU en esta máquina; falta probar en teléfonos reales/Safari.
