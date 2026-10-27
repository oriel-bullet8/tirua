# LOOP SPEC

## Classification
Loop necessity: RECOMMENDED [INFERRED]. Los resultados de las pruebas y los encuadres determinan la corrección siguiente.
Pattern: Build + Retry [INFERRED]. Integrar, observar y corregir fallos concretos.
Scope: CLOSED [INFERRED]. Primera integración local de fotografías de bebestibles.
Verification Strategy: Mixed [INFERRED]. Comprobaciones de datos y archivos, pruebas de navegador e inspección visual.
Complexity: Minimal [INFERRED].

## Objective
Original: «Dame el prompt. Avancemos con Loop Builder y Loop Skill» [USER].
Refined: Preparar la ejecución de la primera integración local de productos y fotografías de Justo en la baraja [INFERRED, contexto inmediato].
User-provided constraints: Español, cambios mínimos, evidencia antes de declarar terminado y sin publicar, commits ni pushes sin petición explícita [USER, AGENTS.md].
Suggested constraints: Integrar 8 bebestibles visibles, disponibles y con foto y precio positivo; conservar originales; generar copias optimizadas; mantener la demo independiente [SUGGESTED, recomendación del turno anterior pendiente de confirmar].
Missing information: Ninguna que bloquee el diseño. La selección exacta de productos queda a criterio del ejecutor dentro del alcance confirmado [INFERRED].

## Definition of Done
- El alcance sugerido fue confirmado por Pablo en el encargo de ejecución, o se ajustó expresamente antes de editar [SUGGESTED].
- Los productos elegidos corresponden a registros del JSON, con nombre, precio, descripción cuando exista y fotografía asociados correctamente [INFERRED].
- Todas las imágenes integradas existen, abren y se sirven desde archivos locales optimizados; se registran dimensiones y peso total [INFERRED].
- La baraja muestra las fotos sin deformación y mantiene legibles nombre y precio; buscador, lista rápida, apertura, volteo y navegación funcionan [INFERRED].
- Categorías superiores llevan a la carta sin quedar tapada por la cabecera; categorías pendientes y joker conservan su comportamiento [INFERRED].
- Se prueba móvil y escritorio con capturas actuales; sin desbordamiento horizontal ni nuevos errores JavaScript respecto al estado inicial [INFERRED].
- No hay cambios ajenos al alcance, a originales ni a la demo independiente; revisión del diff o comparación de archivos lo demuestra [INFERRED].

## Initial State
La extracción reporta 289 productos y 161 fotografías en bar-tirua-justo; el sitio está en bar-tirua-sitio y la demo en bar-tirua-baraja [USER, traspaso pegado por Pablo, evidencia heredada]. Otro proceso podría seguir integrando la baraja [USER, mismo traspaso]. Verificar ambos hechos antes de editar [INFERRED].

## State Variables
- Integración previa activa o finalizada y archivos afectados [INFERRED].
- Productos seleccionados, imágenes generadas y cambios realizados [INFERRED].
- Checks con estado PENDING, PASS, FAIL o BLOCKED y evidencia correspondiente [INFERRED].

## Memory
Actualizar este archivo con un bloque de estado y evidencia al terminar cada ciclo o pausar [SUGGESTED]. Mantener el contrato arriba sin alterarlo durante la ejecución.

## Available Actions
- Leer instrucciones y archivos de proyecto, comprobar actividad y establecer estado inicial · AUTO [INFERRED].
- Seleccionar productos y preparar copias locales optimizadas, una vez confirmado el alcance · AUTO [INFERRED].
- Integrar productos e imágenes; corregir fallos reproducidos dentro del alcance · AUTO [INFERRED].
- Ejecutar pruebas locales, inspeccionar capturas y registrar evidencia · AUTO [INFERRED].

## Observations
- Inspección inicial → existencia de datos, esquema, integración terminada y ausencia de otro escritor [INFERRED].
- Selección y optimización → correspondencia producto-foto, formato, dimensiones, pesos y errores de lectura [INFERRED].
- Integración o corrección → comportamiento de la interfaz, cambios y checks afectados [INFERRED].
- Pruebas y capturas → resultados por check y fallos reproducibles que deciden el siguiente ciclo [INFERRED].

## Decision Rules
- IF hay otro proceso escribiendo el sitio THEN no editar esos archivos; verificar cuándo termina o salir ESCALATE si no se puede establecer un traspaso seguro [INFERRED].
- IF los datos o fotos no permiten cumplir el alcance confirmado THEN ESCALATE con el faltante concreto, sin inventar productos [INFERRED].
- IF un check falla THEN reproducir, diagnosticar y corregir únicamente la causa dentro del alcance; si requiere una decisión material externa, ESCALATE [INFERRED].
- IF todos los checks pasan con evidencia actual THEN SUCCESS [INFERRED].

## Main Loop
Inspeccionar → establecer baseline → seleccionar y preparar recursos → integrar → verificar → evaluar checks → corregir fallo demostrado → verificar de nuevo los checks afectados; salir SUCCESS, ESCALATE o ABORT según corresponda [INFERRED]. La implementación inicial está autorizada por el encargo confirmado; la regla de reproducir fallos aplica a las correcciones posteriores [INFERRED].

## Failure Handling
- Imagen incorrecta o dañada → comprobar relación con JSON y original; regenerar copia o reportar falta de candidato válido [INFERRED].
- Prueba falla → separar fallo previo de regresión mediante baseline y reproducción; conservar evidencia [INFERRED].
- Repetición sin información nueva → detener intentos idénticos y ESCALATE con diagnóstico y bloqueo [INFERRED].

## Human Checkpoints
Ninguno dentro de la implementación local una vez confirmado el alcance. Publicar queda fuera del objetivo; requeriría nueva autorización de Pablo y resolver el uso de fotografías con el local [USER, AGENTS.md; INFERRED, traspaso sobre permisos].

## Guardrails
- No publicar, desplegar, enviar mensajes, hacer commits ni pushes [USER, AGENTS.md].
- No leer credenciales ni historiales de conversación [USER, AGENTS.md].
- No inventar precios, descripciones, disponibilidad ni permiso de publicación [INFERRED].
- No ampliar a toda la carta ni reagrupar las 27 categorías en esta prueba [SUGGESTED].
- No rediseñar hero, reservas, mapa ni delivery [INFERRED, alcance de imágenes].

## Resource Budget
Max iterations: No definido.
Max consecutive failures: No definido.
Max runtime / tokens / cost: No definido. No se autorizan servicios pagados nuevos [INFERRED].
On limit exceeded: ABORT si existe un límite externo efectivo; reportar evidencia y pendientes [INFERRED].

## Success Condition
Todos los puntos de Definition of Done tienen PASS y evidencia actual; las pruebas con viewport emulado se identifican como tales y no como pruebas en dispositivos físicos [INFERRED].

## Escalation Condition
Conflicto con otro escritor sin traspaso, datos insuficientes, capacidades ausentes o decisión material fuera del alcance [INFERRED].

## Abort Condition
Acción insegura, guardrail activado o límite externo de recursos alcanzado [INFERRED].

## Loop Health
Status: NEEDS ATTENTION.
Revisión completa: criterios verificables, acciones con observación, tres salidas, sin presupuestos inventados, memoria separada del estado y trazabilidad de requisitos comprobados. No hay verificación humana necesaria para el éxito local ni acciones externas autorizadas.
Pendiente: confirmar el alcance sugerido de 8 bebestibles, copias optimizadas y preservación de la demo. Enviar al ejecutor el prompt asociado constituye el encargo explícito de ese alcance; este documento por sí solo no lo autoriza.


---

# Estado y evidencia (Loop Runner · ciclo 1 · 2026-10-19)

Salida: **SUCCESS**. Toda la evidencia de interfaz es **FRESCA y SIMULADA (viewports emulados 390×844 táctil y 1440×900 en Chromium headless; NO son dispositivos físicos)**; la del traspaso previo es HEREDADA y no cierra ningún check. Detalle y cifras en `INFORME.md`; salidas crudas en `pruebas/resultados/` (`baseline-*`, `final-*`, `baraja-fotos.json`).

Pre-ciclo: sin otro escritor (ps). Baseline sin editar (puerto 4201): funcional 170/170, extra 99/99, prueba.cjs sin fallas, 0 errores JS; campañas en serie 60/60 móvil y 60/60 escritorio, 0 timeouts de apertura → los 23 fallos heredados (37/60) se atribuyen al arnés (clasificación b); limitación: no descarta una tasa <~2 %. ERROR PREVIO confirmado (no corregido): en 390×844 descripción y flechas quedan bajo el pliegue al llegar a la carta (sitio y=909–961 vs demo 739–791; causa: título/bajada/rótulo de la sección). Fallo reproducido y corregido en este ciclo: el reverso de la carta ocultaba nombre y precio.

| # | Check (Definition of Done) | Estado | Método y evidencia | Frescura | Limitación |
|---|---|---|---|---|---|
| 1 | Alcance sugerido confirmado por Pablo | PASS | El encargo de ejecución confirma 8 bebestibles reales, copias optimizadas, originales y demo intactos (constancia en el prompt de este ciclo) | Fresca (instrucción de Pablo en este ciclo) | — |
| 2 | Productos ↔ registros del JSON (nombre, precio, descripción, foto) | PASS | `baraja-fotos.cjs` 180/180: los 8 ids de Justo (visible, disponible, precio>0, categoría, foto descargada); en cada carta activa nombre, precio, descripción, aria-label y `src` = registro/manifiesto; revisión a ojo de originales y de las 8 cartas (`capturas/hoja-contactos-bebestibles-8-cartas.png`, `baraja-15-*`) | Fresca | La correspondencia visual es juicio humano-asistido; Tübinger y Aperol Spritz descartados |
| 3 | Imágenes existen, abren, locales, optimizadas; dimensiones y peso | PASS | WebP válido, ≤1000 px, 23,7–35,3 KB c/u, total 237 194 B; `manifiesto.json`; hashes de originales idénticos; 0 peticiones externas y 0 404 en 390 y 1440; peso de página 1 178 514 B | Fresca | Peso medido en servidor local (bytes de cuerpo, sin compresión de red) |
| 4 | Fotos sin deformar; nombre y precio legibles; buscador, lista rápida, apertura, volteo y navegación | PASS | cover + atributos ±1 %; comparación de píxeles ≤0,75 % (límite de resolución ≈0,5 %); contraste ≥4,5:1 y ≥14/18 px; funcional 172/172, extra 102/102; campañas finales 60/60 + 60/60 (0 movidos/fuera/sin listener); reverso con nombre y precio | Fresca + simulada (emulación) | No probado en dispositivo físico ni lector de pantalla |
| 5 | Categorías → carta sin tapar; Próximamente y joker conservan comportamiento | PASS | `prueba.cjs categorias` 28/28 y `navegacion`; `baraja-fotos` (bloque «Bebestibles» → herramientas y carta bajo la cabecera); chips y joker en funcional | Fresca + simulada | Emulado |
| 6 | Móvil y escritorio con capturas actuales; sin desbordamiento; sin nuevos errores JS | PASS | 360/390/768/1280/1440/1920 sin desbordamiento; 0 errores JS en todas las pruebas (igual que baseline); capturas nuevas en `capturas/` (lista en INFORME); regresión hero con/sin video, video roto, reduced-motion, reservas (12 escenarios idénticos salvo el aviso intencional), menú, mapa, delivery | Fresca + simulada | Emulado; Chromium solo |
| 7 | Sin cambios ajenos al alcance, a originales ni a la demo | PASS | sha256 de 285 archivos (originales, `carta-justo.json`, demo `bar-tirua-baraja`) idénticos antes/después; `main/menu/hero/reservar.js` y `reservar.html` = `referencia/antes-baraja`; `styles.css` y `render.js` sin cambios; diff de hashes del sitio = solo archivos del alcance | Fresca | Comparación por hash; carpeta demo excluyó `graphify-out/` |

Pendientes fuera del loop (no bloquean SUCCESS): permiso del local para usar las fotos (publicar queda fuera y requiere nueva autorización), As real, palos/colores definitivos, productos de las otras 3 categorías, filtros alimentarios (sin datos), joker, prueba en dispositivos físicos y ERROR PREVIO del pliegue móvil. Servidor 4201 detenido; sin procesos propios; 4195 y 4198 intactos.
