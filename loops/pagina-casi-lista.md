# LOOP SPEC · Tirúa: página casi lista

Fuente de verdad del loop. `loop-runner` la lee, ejecuta y **actualiza** (secciones STATE y CHECKS) en cada ciclo. Nadie rediseña el loop durante la ejecución: si algo del diseño ya no sirve, se sale con ESCALATE.

## Parámetro: objetivo_esperado
`objetivo_esperado = "pagina_casi_lista"` [USER, 2026-10-23]
Significado operativo [INFERRED]: todo lo que se puede comprobar sin una persona, un teléfono real o un dato del bar está en PASS con evidencia fresca; lo que solo una persona/dispositivo/bar puede cerrar queda explícito como PENDING/BLOCKED (nunca PASS por simulación). El loop termina cuando se cumple ese estado, no antes.

## Classification
Loop necessity: RECOMMENDED — lo que se observa tras cada arreglo (un fallo nuevo, una regresión, una pantalla aburrida) cambia qué hacer después.
Pattern: Optimization + Build · se mejora iterativamente contra un conjunto fijo de checks, y se añaden detalles de diseño/animación donde los checks lo piden.
Scope: HYBRID · defectos CLOSED (reproducibles y verificables); «no aburrido / detalles bonitos» OPEN, acotado por una lista de revisión de diseño y por el presupuesto.
Verification Strategy: Mixed · pruebas deterministas (Playwright + scripts del repo) + capturas inspeccionadas + un verificador independiente al final.
Complexity: Standard

## Objective
Original: "centrarnos en la página web: buen funcionamiento, evitar bugs, buenas animaciones, detalles bonitos, uso de skills, evitar aburrimiento de la página, buen funcionamiento de la carta … el objetivo esperado es que sea casi lista la página (bugs, funcionamiento, diseño)".
Refined: llevar el sitio estático de Tirúa a estado «casi listo» según los CHECKS de abajo.
User-provided constraints [USER]: foco solo en la web; usar loop-architect y loop-runner más skills de diseño/sistema; el video del hero lo gestiona Pablo (vía Google Drive, más adelante); sin commits/push/despliegue (instrucción vigente de Pablo desde el inicio del proyecto).
Suggested constraints [SUGGESTED]: presupuesto de abajo; paleta/tipografías ya elegidas se conservan.
Missing information [MISSING]: dispositivos reales (iPhone/Safari, Android), número de WhatsApp del bar, video del hero, textos/horarios reales. No bloquean el loop; fijan checks en PENDING/BLOCKED.

## Definition of Done (CHECKS)
Estado de cada uno vive en la tabla CHECKS (abajo). SUCCESS = todos los automatizables en PASS con evidencia fresca del último ciclo; los humanos en PENDING/BLOCKED con razón.
- C1 Cero errores JS y cero respuestas ≥400 salvo `assets/video/hero.mp4` ausente, en `index.html` y `reservar.html`, en 8 tamaños (320×568, 390×844, 844×390, 768×1024, 1024×768, 1280×720, 1440×900, 1920×1080) y ambos temas [INFERRED]
- C2 Sin desbordamiento horizontal y sin texto cortado/solapado en esos tamaños [INFERRED]
- C3 Carta: abrir/cerrar, flechas, teclado, arrastre, rueda, voltear, buscar, palos, lista rápida, joker, Esc en cascada, redimensionar/girar con la carta abierta, 100 acciones aleatorias seguidas sin error ni estado inconsistente, volver a la página sin saltos de scroll [USER: «buen funcionamiento de la carta»]
- C4 Reserva: flujo completo (1–7+ personas, fecha, hora, datos, mensaje), casos borde (hoy, día lejano, nombre vacío, comentario largo, atrás/adelante), enlace WhatsApp correcto y sin enviar [INFERRED]
- C5 Navegación: menú móvil, anclas, `aria-current`, enlaces externos, pie, teclado (tab order, foco visible, sin trampas) y lector (roles/labels) [INFERRED]
- C6 Movimiento: `prefers-reduced-motion` respetado; ninguna animación bloquea la interacción; sin saltos de layout (CLS) visibles [INFERRED]
- C7 Diseño «no aburrido»: revisión crítica con la skill `impeccable critique` + lista de detalles (entrada del hero, transiciones entre secciones, microinteracciones de botones/tarjetas, estados vacíos/carga, cierre de página) con al menos los defectos «alto/medio» resueltos y las mejoras elegidas implementadas sin romper C1–C6 [USER: «buenas animaciones, detalles bonitos, evitar aburrimiento»]
- C8 Rendimiento razonable: peso de página y fuentes medidos, sin trabajo continuo innecesario con la pestaña oculta o la carta cerrada [INFERRED]
- C9 Suite del repo verde (`npm run verificar` + pruebas nuevas que este loop agregue) y `impeccable detect` sin hallazgos nuevos [INFERRED]
- C10 Verificación independiente (revisor fresco, sin contexto del build) sin hallazgos materiales abiertos [SUGGESTED]
- H1 Revisión en teléfono/tablet reales y Safari/iOS · humano/externo → PENDING [INFERRED]
- H2 Video real del hero, WhatsApp del bar, horarios y textos reales · externos → PENDING [USER/INFERRED]

## Initial State
Ver STATE. Sitio en `/Users/pablito/Documents/Codex/Proyectos/tirua`, servidor `python3 servir.py` en 127.0.0.1:4195, suite verde al 2026-10-23 (recursos 41/41, inmersivo 94, fotos 188, vuelta2 40, reservas-datos 22). Pruebas heredadas de geometría de la baraja (baraja-funcional/extra/campana, movil-estrecho, prueba.cjs) desactualizadas.

## State Variables
ciclo, CHECKS (estado + evidencia + frescura + limitación), lista de defectos (id, repro, estado), cambios hechos por ciclo, iteraciones sin progreso.

## Memory
Persiste en este archivo (STATE, CHECKS, DEFECTOS, CICLOS) y en `CONTINUIDAD.md`. No hay otra memoria.

## Available Actions
- Sondear: correr Playwright (script del repo o MCP), leer consola/red, medir DOM, tomar capturas · AUTO
- Reproducir un defecto antes de tocar código · AUTO
- Editar `css/`, `js/`, `index.html`, `reservar.html`, `pruebas/`, docs del repo · AUTO (solo tras reproducir un fallo o por un ítem de diseño aprobado en C7)
- Invocar skills `impeccable` (critique, audit, polish, animate, delight, harden, adapt, layout), `design-motion-principles`, `ui-design:*`, `interaction-design:*` · AUTO
- Lanzar el verificador independiente (agente `impeccable-finish-reviewer`) una vez, en el ciclo final · AUTO (lo autoriza la invocación de la skill)
- Instalar dependencias del sistema, tocar el repo remoto, commit, push, desplegar, enviar mensajes · REQUIRES APPROVAL (irreversible/externo) y **no previstas**
- Borrar/mover originales o carpetas antiguas · REQUIRES APPROVAL (Pablo lo prohibió)

## Observations
- Sondear → errores de consola, estados HTTP, medidas de DOM, capturas, salida de pruebas
- Editar → diff + resultado de repetir la repro
- Skill de diseño → lista priorizada de hallazgos (alto/medio/bajo)

## Decision Rules
- IF un check está FAIL con repro THEN arreglar la causa y repetir la repro y los checks vecinos
- IF un arreglo rompe un check previo THEN revertir ese arreglo y buscar otra solución (no dejar la regresión)
- IF el mismo defecto falla 2 veces seguidas tras arreglos distintos THEN CHANGE STRATEGY (causa raíz, otro enfoque) y a la 3.ª ESCALATE ese defecto
- IF una mejora de diseño no tiene criterio verificable THEN pasarla por `impeccable critique` antes y después, y registrar ambas lecturas
- IF un check solo se cierra con persona/dispositivo/bar THEN dejarlo PENDING/BLOCKED con la razón; no simular PASS
- IF un ciclo no cambia ningún check ni defecto THEN no abrir otro ciclo igual: pasar a verificación independiente o ESCALATE

## Main Loop
Sondear (todos los checks, con evidencia fresca) → Triage (defectos + ideas de diseño, priorizados) → Arreglar/mejorar (lote acotado, solo lo reproducido o lo aprobado en C7) → Verificar (repetir repro, suite, capturas) → Actualizar STATE/CHECKS → ¿automatizables todos PASS? (no) siguiente ciclo (hasta presupuesto) / (sí) Verificación independiente → hallazgos materiales → Arreglar → Reverificar → SUCCESS | ESCALATE | ABORT.

## Failure Handling
- Prueba inestable (flaky) → repetir 3 veces; si varía, medir la causa (timing, red) y estabilizar la prueba, no ignorarla
- Falso positivo del detector/skill → documentarlo en DEFECTOS como «descartado» con la razón
- Servidor colgado o 404 en subcarpetas → relanzar `python3 servir.py` desde Terminal (ver CONTINUIDAD, «Incidente de los 404»)
- Herramienta ausente (p. ej. ffmpeg) → marcar el check afectado BLOCKED y seguir con el resto

## Human Checkpoints
- Entrega final · antes de declarar SUCCESS · aprueba: Pablo (revisa el sitio y la lista H1/H2) · si rechaza: abrir ciclo con sus observaciones como defectos
No se pide aprobación intermedia: todo lo previo es reversible, local y sin publicar.

## Guardrails
- Sin commit, push, deploy ni mensajes externos [USER, instrucción vigente del proyecto]
- No tocar las carpetas originales `…/est-2/outputs/*` ni los respaldos [USER]
- No inventar contenido del bar (precios, horarios, ingredientes, fotos, WhatsApp) [USER]
- Código solo tras reproducir un fallo o por un ítem de diseño de C7 [INFERRED, loop-runner]
- Una sola mejora «de gusto» a la vez, verificada, para no acumular regresiones [SUGGESTED]
- Conservar: paleta blanca + rojo, Young Serif/Alegreya Sans, carta inmersiva, flujo WhatsApp [USER]

## Resource Budget
Max ciclos: 5 [SUGGESTED, confirmar]
Max fallos consecutivos por defecto: 2 [SUGGESTED]
Runtime / tokens / costo: No definido
On limit exceeded: ESCALATE con el estado de cada check

## Success Condition
Todos los checks C1–C10 en PASS con evidencia fresca del último ciclo, H1/H2 explícitos como PENDING, y entrega aprobada por Pablo.

## Escalation Condition
Falta acceso/decisión externa que bloquea un check automatizable; un defecto sobrevive 3 estrategias; el presupuesto se agota con checks en FAIL; Pablo rechaza la entrega.

## Abort Condition
Una acción exigiría commit/push/deploy/borrado de originales; se detecta un secreto expuesto (se reporta aparte); el sitio queda inservible sin forma de revertir.

## Loop Health
Status: NEEDS ATTENTION
- Confirmar presupuesto (5 ciclos) y que el verificador independiente (agente) se puede lanzar al final
- [MISSING] dispositivos reales, WhatsApp, video: no bloquean, quedan H1/H2

---

# AGENT PROMPT (resumen operativo)

ROLE: ejecutas el loop `pagina-casi-lista` de Tirúa sin rediseñarlo.
OBJECTIVE: objetivo_esperado = pagina_casi_lista (ver CHECKS).
LOOP: 1 Sondear todos los checks con evidencia fresca. 2 Triage. 3 Arreglar solo lo reproducido o aprobado en C7 (lote acotado). 4 Verificar (repro + suite + capturas). 5 Actualizar este archivo. 6 Repetir hasta presupuesto o éxito. 7 Verificador independiente. 8 Entrega a Pablo.
GUARDRAILS: sin commit/push/deploy; no tocar originales; no inventar contenido; no simular PASS.
STOP: SUCCESS checks en PASS fresco · ESCALATE decisión/acceso externo o defecto tras 3 estrategias · ABORT acción prohibida.
REPORTING: estado final, evidencia por check, cambios y pendientes (H1/H2).

---

# STATE
Ciclo actual: 3 cerrado (2026-10-23) · verificación independiente hecha (veredicto «fix» → arreglado y medido)
Último estado global: todos los checks automatizables C1–C10 en PASS con evidencia fresca del ciclo 3; H1/H2 PENDING (solo humano/bar).
Presupuesto usado: 3 de 5 ciclos.

# CHECKS
| Check | Estado | Evidencia / método | Frescura | Limitación |
|---|---|---|---|---|
| C1 | PASS | `pruebas/sondeo.cjs` (semilla 11): 8 tamaños × 2 páginas (claro) + 2 tamaños (oscuro): 0 errores JS, 0 respuestas ≥400 salvo hero.mp4, 0 hosts externos | fresca, ciclo 2 | solo Chromium emulado |
| C2 | PASS | mismo sondeo: sin desborde horizontal ni elementos fuera de pantalla; medición manual de solapes del delivery y el mapa en 5 anchos (`verif2`) | fresca, ciclo 2 | el sondeo no detecta solapes entre elementos: se midieron a mano los de Delivery/Mapa/bandeja |
| C3 | PASS | sondeo (3 estrés aleatorios de 70–90 acciones, cobertura medida) + `pruebas/inmersivo.cjs` 109/109 (apertura, teclado, rueda, arrastre, voltear, bandeja, lista, Esc en cascada, «Atrás», historial, reverso, asomo/pista) | fresca, ciclo 2 | sin pantalla táctil real ni teclado virtual |
| C4 | PASS | sondeo C4 (teselas, 7+, volver, hoy/horas, nombre vacío, comentario largo, wa.me = mensaje, nada enviado) + `reservas-datos` 22/22 + `reservas.cjs inicio/enlaces/flujo` | fresca, ciclo 2 | no se pulsó WhatsApp (por diseño); el número del bar no existe |
| C5 | PASS | sondeo de foco (Tab ×70, 4 páginas/tamaños: sin focos en controles ocultos/inertes) + medición de objetivos 44 px y fuentes ≥14 px (críticas A/B, re-medidas) | fresca, ciclos 1–2 | lector de pantalla real no probado |
| C6 | PASS | sondeo: con `prefers-reduced-motion` 0 animaciones infinitas corriendo; CLS < 0,1; reveal de categorías y sello con regla de movimiento reducido | fresca, ciclo 2 | — |
| C7 | PASS (parcial) | `impeccable critique` (A+B, agentes aislados) → 5 problemas + 5 ideas; resueltos: bandeja, collage/mapa/pedidos, descubribilidad del volteo, categorías «repartidas», calor del hero, contador en palos, sello, menú coherente. Pendiente de gusto: «Abrir Instagram» en el resumen, menú móvil sin CTA, pantalla de resumen aún sobria | fresca, ciclos 1–2 | gusto de Pablo/Oriel decide el resto |
| C8 | PASS | CLS 0,00x; 10 animaciones infinitas del hero se pausan fuera de pantalla (clase `.fuera`); cinta solo corre visible; peso home 2,1 MB (fuentes TTF ~0,7 MB sin comprimir: mejora posible con WOFF2) | fresca, ciclo 2 | no se midió CPU real |
| C9 | PASS | `recursos` 41/41, `inmersivo` 109/109, `baraja-fotos` 188/188, `vuelta2` 40/40, `reservas-datos` 22/22, `sondeo` 78 OK/0 fallas; `impeccable detect`: 8 hallazgos, todos falsos positivos verificados | fresca, ciclo 2 | pruebas heredadas de geometría (baraja-funcional/extra/campana, movil-estrecho, prueba.cjs) siguen sin adaptar |
| C10 | PASS (con matiz) | `impeccable-finish-reviewer` (fresco, sin contexto del build): veredicto 1 «fix» con 9 hallazgos; segunda pasada puntuó 8 resueltos y 1 parcial (el aviso de «Próximamente» quedaba bajo el pliegue); ese se corrigió y se midió a mano en 4 tamaños (1366×768, 390×844, 1440×900, 844×390: aviso visible). La 3.ª puntuación del revisor no se pidió | fresca, ciclo 3 | el «ship» formal del revisor sobre ese último arreglo no existe: la evidencia es la medición propia |
| H1 | PENDING | requiere teléfono/tablet reales y Safari/iOS | — | solo humano/dispositivo (el botón del reportado en Safari: se eliminó la causa, no se pudo probar en Safari) |
| H2 | PENDING | requiere video, WhatsApp y textos del bar | — | solo bar/Pablo |

# DEFECTOS
| Id | Defecto | Repro / evidencia | Estado |
|---|---|---|---|
| D1 | «Atrás» del navegador con la carta abierta sacaba del sitio | `page.goBack()` desde la carta inmersiva | CERRADO (pushState + popstate; test) |
| D2 | Calendario: celdas 43 px de ancho (<44) en 390 px | medición `.cal__celda button.dia` | CERRADO |
| D3 | Bandeja de la carta recortaba la carta por arriba (−29 px) en 1440×900 | `verif1` d_bandeja | CERRADO (escala .7, origen superior) |
| D4 | Fotos del collage de Delivery medían 414 px (height=400 del HTML vencía al aspect-ratio) y tapaban la lista | `verif2` en 5 anchos | CERRADO |
| D5 | Nombre del pedido «Ramazzo/tti» partido a mitad de palabra en 390 px | captura | CERRADO |
| D6 | Dirección del mapa pisaba las etiquetas de calles | captura | CERRADO (etiqueta con fondo) |
| D7 | Notas de 12–13 px | críticas B, medición | CERRADO (≥14 px) |
| D8 | «Hoy» elegible cuando ya no quedan horas | sondeo (22:30 pasado) | CERRADO |
| D9 | Menú desordenado respecto a la página y «tres pasos» ≠ cuatro | crítica A | CERRADO |
| D10 | El volteo de la carta no se descubría | crítica A | CERRADO (pista + asomo) |
| D11 | Botón «Reservar mesa» se salía por la derecha en Safari (min-width en % en columna auto) | usuario + causa en CSS | CERRADO (min-width: 0); no verificado en Safari real |
| D12 | R7 de la crítica B: «carta abierta sola con scroll continuo en 390» | scroll continuo con rueda 160 px en 390 y 1440: no se reproduce (2 intentos) | DESCARTADO (no reproducible); el sondeo ahora vigila el estado tras recorrer la página |
| D13 | Falso positivo del probe: `#pile`/`.cat__enlace` marcados como desborde | revisado | DESCARTADO |
| D14 | Heurística A «Restablecer filtros parece deshabilitado» | medido: fondo tinta, texto blanco | DESCARTADO |
| D16 | Verificador: «frase del hero ausente» en las capturas | la frase tiene opacity 1/45 px en la página real; `fullPage` reinicia las animaciones de entrada (opacity 0 justo después de capturar) | DESCARTADO como artefacto de captura; se acotó `.hero.fuera` a animaciones infinitas y se capturó con `animations: 'disabled'` |
| D17 | Entrar desde un bloque «Próximamente» abría la carta sin explicación | prueba | CERRADO (no abre; aviso visible en la página y scroll a él) |
| D18 | Esc con «Qué significa» abierto cerraba también la carta | prueba | CERRADO |
| D19 | Apaisado: contador bajo la leyenda y descripciones de 2 líneas pisando la carta | medición 844×390 | CERRADO |
| D20 | Foco perdido al entrar por categoría y al cerrar con «Atrás» | prueba | CERRADO |
| D21 | Inercia del trackpad saltaba varias cartas | simulación 25 eventos | CERRADO (1 gesto = 1 carta) |
| D22 | Inclinación 3D recortaba el naipe por arriba (−13 px) | medición | CERRADO (inclinación más suave, perspectiva 1800 px) |
| D23 | Sondeo semilla 23 «carta fuera de pantalla» | transitorio (bandeja/redimensionar): no persiste a 900 ms | DESCARTADO; el sondeo ahora solo marca lo que persiste |
| D24 | Regresión del ciclo 2: las categorías, antes de «repartirse», esperaban desplazadas a la derecha y creaban scroll horizontal de 15 px en móvil hasta revelarlas | `scrollWidth` 405/390 al cargar (lo destapó el bloque de historias); el sondeo medía solo tras recorrer la página | CERRADO (`.categorias { overflow-x: clip }`); el sondeo ahora mide el desborde al cargar |
| D15 | Heurística A «el collage tapa la nota» en 1440 | medido: sin solape en escritorio (el solape real era D4 en móvil) | REEMPLAZADO por D4 |

# CICLOS
- **Ciclo 1 (sondeo + críticas A/B):** sondeo funcional nuevo (`pruebas/sondeo.cjs`: C1–C6, C8): 0 fallas reales en las primeras corridas (los fallos iniciales eran falsos positivos de la propia prueba). Críticas A (27/40) y B. Arreglos D1–D10 tras reproducir cada uno.
- **Ciclo 2 (detalles):** categorías repartidas, calor del hero con pausa fuera de pantalla, contador en palos, sello en el resumen, hoy sin horas. Evidencia fresca: sondeo 78/0, suite verde.
- **Ciclo 3 (verificador independiente):** revisión fresca (veredicto «fix»), 9 hallazgos: 8 reales arreglados y 1 artefacto de captura descartado. Nuevo en el sitio: aviso visible en «Próximamente», Esc coherente, foco correcto, inercia de rueda, inclinación y brillo del naipe, contador/leyenda apaisado, rojo que cicla en «Personas → Fecha → Hora». `npm run verificar` verde y sondeo con semillas 7, 11, 23 y 5.
- **Extensión 2026-10-24 (pedido de Pablo):** sin video usable en Instagram (reels verticales, protegidos, con música con licencia), el hero muestra «Novedades»: burbujas + visor tipo historias alimentados por `datos/instagram.json` (a mano o `scripts/instagram-sync.mjs` con la API oficial). `?demo=instagram` para ver ejemplos. Guía de video para marketing: `docs/GUIA-VIDEO-HERO.md`; el hero ya acepta `hero-vertical.mp4`. Pruebas nuevas: `pruebas/historias.cjs` (49) y `pruebas/instagram-sync.test.mjs` (6). `npm run verificar` verde.
