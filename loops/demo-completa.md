# ENCARGO PARA LOOP BUILDER (texto listo para pegar en el recuadro inicial)

Llevar el sitio local de Bar Tirúa (HTML + CSS + JS existentes, sin dependencias nuevas) a una demo completa que Pablo pueda recorrer: conservar la identidad y la carta en baraja, corregir solo los fallos que se puedan reproducir (320 px y espacio de las descripciones en celular), y verificar navegación, baraja, buscador, categorías, reservas por Instagram, menú móvil y hero sin video, en móvil y escritorio, con teclado y movimiento reducido. Usar como propuesta provisional las categorías Bebestibles, Comidas individuales, Postres y Para compartir. No clasificar masivamente productos sin decisión de Oriel. No inventar productos, precios, fotos, horarios ni condiciones del joker. Sin publicar, desplegar, commits, mensajes, gasto ni escritura en Obsidian. Detenerse y reportar si una parte necesita una decisión humana.

Paso único para Pablo: abrir Loop Builder (https://claude.ai/artifact/XBRBMqeZHjb66b3T8TWumi), pegar el párrafo anterior en el recuadro inicial y copiar el Loop Spec y el Agent Prompt que genere. El diseño de abajo ya está hecho con Loop Architect (la Loop Skill) y sirve como referencia contra la que comparar.

---

# LOOP SPEC

Diseñado con Loop Architect (`~/.claude/skills/loop-architect`, plantillas `loop-spec.md` y `agent-prompt.md`). No se usó `/loop` ni Loop Runner. Loop Builder (el artefacto) **no fue operado desde esta sesión**: es una interfaz interactiva que requiere el paso único descrito arriba.

## Classification
Loop necessity: RECOMMENDED [INFERRED]. El resultado de cada prueba y captura decide la corrección siguiente.
Pattern: Build + Retry · se integra, se observa y se corrige un fallo concreto por vez.
Scope: CLOSED · acciones y verificaciones acotadas a `bar-tirua-sitio`.
Verification Strategy: Mixed · pruebas deterministas de navegador + inspección visual de capturas + juicio humano de Pablo sobre lo visual.
Complexity: Standard · hay State explícito, reglas de decisión y un Human Checkpoint (la evaluación visual de Pablo).

## Objective
Original: «llevar el sitio actual a una propuesta local completa que Pablo pueda recorrer, evaluar y ajustar» [USER].
Refined: dejar una demo local única y abierta, con la baraja integrada, sin fallos reproducibles abiertos y con evidencia actual de verificación [INFERRED].
User-provided constraints [USER]: HTML/CSS/JS existentes, sin migrar ni añadir dependencias; conservar identidad y carta en baraja; 4 categorías provisionales salvo decisión posterior; no clasificar masivamente; no inventar contenido; reservas = solicitud por Instagram, mapa y delivery = enlaces; no publicar, desplegar, commits, pushes, mensajes, gasto, ampliar permisos, borrar material irrecuperable ni escribir en Obsidian; no revertir trabajo ajeno; distinguir evidencia heredada, actual, emulada y real.
Suggested constraints [SUGGESTED]: servidor propio en un puerto aparte para las pruebas; un navegador a la vez; capturas en `capturas/`.
Missing information [MISSING]: decisión de Oriel sobre cómo agrupar las 27 categorías de Justo en 4 (bloquea sumar productos); permiso del local para las fotos; hero.mp4; horario real; As real; condiciones del joker.

## Definition of Done
- Un solo enlace local abre la página completa (hero, categorías, baraja, reservas, mapa, delivery, pie) y `reservar.html` [USER].
- A 320, 360, 375, 390 y 412 px: sin desplazamiento horizontal, sin texto ni control recortado por el borde en la sección Carta [USER, 320 px].
- Descripción y naipe visibles sin desplazar al llegar a `#carta` en 320×640, 360×640, 375×667, 390×664 y 390×844; las flechas también salvo límite físico declarado [USER, descripciones en celular].
- Baraja, buscador, lista rápida, chips «Próximamente», joker visual, reservas, menú móvil y hero sin video funcionan, con teclado y con `prefers-reduced-motion` [USER].
- 0 errores de JavaScript; solo se admite la línea 404 documentada de `hero.mp4` [INFERRED].
- Las pruebas heredadas dan el mismo resultado que el baseline salvo cambios intencionales documentados [INFERRED].
- README e INFORME actualizados con cambios y limitaciones comprobadas; lista de pendientes de Oriel con qué bloquea cada uno [USER].
- Ningún archivo de otro agente revertido; `bar-tirua-justo` y `bar-tirua-baraja` intactos (hashes) [USER, INFERRED].

## Initial State
Sitio en la carpeta `bar-tirua-sitio` de entonces (ya migrada a este repo); baraja ya integrada (README); 8 bebestibles reales con foto; `assets/video` vacío; servidor 4195 colgado (responde vacío), 4198 también. Baseline de hoy en puerto 4201: funcional 88/88 (390) y 84/84 (1440), extra 102/102, `prueba.cjs` sin fallas salvo `con-video` (necesita un `hero.mp4` que no existe). Sin otro escritor detectado (`ps`).

## State Variables
- Estado de cada check de la DoD (PENDING/PASS/FAIL/BLOCKED) con su evidencia y frescura.
- Fallos reproducidos y su causa; archivos modificados (con hash antes/después).
- Resultado de la última prueba por tamaño de pantalla.

## Memory
Este archivo: bloque «Estado y evidencia» al final, actualizado al cerrar cada ciclo. El contrato de arriba no se altera durante la ejecución.

## Available Actions
- Leer proyecto, vault (solo lectura), comprobar procesos y establecer baseline · AUTO.
- Medir, capturar y probar en Chromium headless (emulado) · AUTO.
- Editar `css/baraja.css`, `css/styles.css`, `js/*`, `index.html`, `README.md`, `INFORME.md`, `loops/` dentro de `bar-tirua-sitio` para corregir un fallo reproducido · AUTO.
- Reiniciar el servidor local de `bar-tirua-sitio` en 4195 · AUTO (es del propio proyecto; se registra).
- Publicar, desplegar, commit/push, enviar mensajes, gastar, escribir en Obsidian, tocar `bar-tirua-justo`/`bar-tirua-baraja` · REQUIRES APPROVAL (fuera de alcance; no se ejecutan).

## Observations
- Medición de geometría (rect de elementos por tamaño de pantalla) → si hay recorte o desborde.
- Suites de prueba → PASS/FAIL por aserción, errores JS, peticiones y 404.
- Capturas → forma real de lo que ve Pablo (inspección humana-asistida).

## Decision Rules
- IF un check falla THEN reproducir con una medición, corregir solo esa causa, volver a medir ese check y los afectados.
- IF una prueba heredada cambia THEN decidir si el cambio es intencional (documentarlo) o regresión (corregir).
- IF falta una decisión de contenido (agrupación de productos, permiso, horario, As, joker) THEN dejarlo pendiente y avanzar con lo independiente.
- IF otro proceso escribe en el sitio THEN no editar esos archivos y verificar antes de seguir.
- IF dos ciclos seguidos no producen información nueva THEN detener esa parte y ESCALATE.
- IF todos los checks tienen evidencia actual THEN SUCCESS y entregar para evaluación humana.

## Main Loop
Inspect → Baseline → Reproduce fallos → Fix (uno por vez) → Verify (checks afectados) → Regression (suites completas) → Evaluate DoD → (falla) Diagnose → Fix … / (todo PASS) Document → Human Checkpoint (Pablo evalúa la demo) → SUCCESS / ESCALATE.

## Failure Handling
- Prueba inestable → reejecutar una vez con un navegador a la vez; si persiste, clasificar arnés vs sitio con una medición distinta.
- Corrección que rompe otra prueba → revertir solo el cambio propio y buscar otra causa.
- Servidor no responde → comprobar proceso y respuesta; reiniciar solo el servidor propio.

## Human Checkpoints
- Evaluación visual de la demo · antes de declarar el diseño aceptado o iniciar cambios de dirección · aprueba: Pablo · si rechaza: volver a Fix con su feedback.
- Cualquier acción de la lista REQUIRES APPROVAL · antes de ejecutarla · aprueba: Pablo.

## Guardrails
- Sin dependencias ni migración de tecnología [USER].
- Sin inventar productos, precios, fotos, horarios, disponibilidad ni condiciones del joker [USER].
- No leer credenciales ni historiales de conversación [INFERRED, AGENTS.md de la carpeta Codex].
- No declarar compatibilidad con dispositivos o navegadores no probados [USER].
- Correcciones solo con evidencia; sin refactors ni mejoras laterales [USER].

## Resource Budget
Max iterations: 4 ciclos de corrección [SUGGESTED, confirmar].
Max consecutive failures: 2 sin información nueva [SUGGESTED, confirmar].
Max runtime / tokens / cost: No definido. No se autoriza gasto [USER].
On limit exceeded: ESCALATE.

## Success Condition
Toda la DoD con evidencia actual y los límites (emulado, Chromium, sin dispositivos reales) declarados.

## Escalation Condition
Decisión de agrupación de categorías, permiso de fotos, horario, As, video o joker; conflicto con otro escritor; una corrección que exija cambiar la dirección visual.

## Abort Condition
Acción insegura o fuera de límites; hash de `bar-tirua-justo`/`bar-tirua-baraja` alterado.

## Loop Health
Status: NEEDS ATTENTION.
- [x] Sin placeholders disfrazados · [x] DoD verificable · [x] Toda acción con observación · [x] Salidas SUCCESS/ESCALATE/ABORT · [x] Aprobaciones con checkpoint · [x] Memory ≠ State · [x] Budgets marcados [SUGGESTED] · [x] Requisitos trazables.
- Confirmar: los dos [SUGGESTED] del Resource Budget; el límite físico «flechas visibles» a 320×568.
- Falta [MISSING] (no bloquea la demo): decisiones y materiales de Oriel.

--- FIN DEL DISEÑO · INICIO DE EJECUCIÓN ---

# AGENT PROMPT

ROLE: Ingeniero senior de la demo local de Bar Tirúa; trabajas solo en `bar-tirua-sitio`.

OBJECTIVE: Dejar la demo local completa, abierta y verificada, corrigiendo solo fallos reproducidos.

DEFINITION OF DONE:
- Un enlace local abre la página y `reservar.html`.
- Sin recorte ni desborde en Carta de 320 a 412 px.
- Descripción y naipe sin desplazar al llegar a `#carta` en 320×640, 360×640, 375×667, 390×664, 390×844.
- Todas las funciones con teclado y movimiento reducido; 0 errores JS.
- Suites heredadas iguales al baseline salvo cambios documentados.
- README, INFORME y pendientes de Oriel actualizados.

STATE: estado de cada check, fallos reproducidos, archivos modificados con hash, última prueba por tamaño.

MEMORY: bloque «Estado y evidencia» al final de `loops/demo-completa.md`.

AVAILABLE ACTIONS: AUTO: leer, medir, capturar, probar, editar archivos del sitio, reiniciar el servidor propio. REQUIRES APPROVAL: publicar, desplegar, commit, push, mensajes, gasto, Obsidian, tocar otras carpetas.

LOOP:
1. Comprobar otros escritores y establecer baseline.
2. Reproducir con una medición cada fallo.
3. Corregir una causa por vez.
4. Medir el check afectado y luego las suites completas.
5. Evaluar la DoD; repetir solo con información nueva.
6. Documentar y presentar la demo a Pablo.
IF falta una decisión de contenido THEN dejarla pendiente y seguir con lo independiente.

VERIFICATION: pruebas deterministas de navegador, medición de geometría e inspección de capturas; Pablo decide lo visual. Rotula todo como emulado.

RECOVERY: no repitas sin cambio de hipótesis o dato; revierte solo tus cambios si rompen otra prueba; reinicia solo tu servidor.

HUMAN APPROVAL: detente antes de dar el diseño por aceptado. Presenta capturas, evidencia y pendientes. Sin aprobación explícita no continúas.

GUARDRAILS:
- Sin dependencias, migraciones ni funcionalidades ajenas.
- Nada inventado en contenido.
- No leer credenciales ni historiales.
- No revertir trabajo ajeno.

RESOURCE LIMITS: 4 ciclos de corrección, 2 fallos seguidos sin información nueva (propuesto, confirmar); gasto no definido y no autorizado.

STOP: SUCCESS DoD con evidencia actual · ESCALATE decisión de Oriel o dirección visual · ABORT acción insegura o alteración de carpetas protegidas.

REPORTING: estado final (SUCCESS/ESCALATE/ABORT), evidencia de la DoD, acciones hechas y pendientes.


---

# Estado y evidencia (Loop Architect · ciclo 1 · 2026-10-20)

Salida: **ESCALATE parcial** (la demo local está completa y verificada; lo que sigue necesita a Pablo y a Oriel). Evidencia de interfaz: **ACTUAL y EMULADA** (Chromium headless, viewports 320–412 px y 1440×900; no hay dispositivos reales). Detalle en `INFORME.md` y `README.md` («Demo completa»).

| # | Check (Definition of Done) | Estado | Evidencia |
|---|---|---|---|
| 1 | Un enlace abre la página completa y `reservar.html` | PASS | http://127.0.0.1:4195/ → 200 en `/` y `/reservar.html`; capturas `demo-*`. El 4195 estaba colgado y se reinició; la baraja ya estaba integrada en el sitio |
| 2 | Sin recorte ni desborde en Carta de 320 a 412 px | PASS | `movil-estrecho.cjs` 90/90 (21 fallas con el CSS anterior → 0). 280 px queda fuera (límite declarado) |
| 3 | Descripción y naipe sin desplazar al llegar a `#carta` | PASS | 320×640, 360×640, 375×667, 390×664, 390×844, 412×740. Flechas: PASS salvo **320×568** (límite físico: 637/568) |
| 4 | Funciones con teclado y movimiento reducido | PASS | `baraja-funcional` 88+84, `baraja-extra` 102, `prueba.cjs` teclado/reducido, `reservas.cjs` teclado/reducido |
| 5 | 0 errores JS; solo el 404 de `hero.mp4` | PASS | todas las salidas en `pruebas/resultados/demo-*.txt` |
| 6 | Suites heredadas = baseline (salvo cambios documentados) | PASS | funcional 88/84, extra 102, fotos 180; `prueba.cjs` y `reservas.cjs` sin errores JS y con salida equivalente (reservas: 6 idénticas y 6 con solo fecha de hoy, milisegundos y texto del aviso distintos; esos scripts no emiten veredicto por aserción). `con-video` no aplica (no hay video) |
| 7 | README, INFORME y pendientes de Oriel actualizados | PASS | README «Demo completa · estado al 2026-10-20»; INFORME nuevo al inicio |
| 8 | Nada ajeno revertido; carpetas protegidas intactas | PASS | hashes idénticos (299 archivos de `bar-tirua-justo` y `bar-tirua-baraja`); solo cambió `css/baraja.css`, README, INFORME, este archivo y una prueba nueva |

Human Checkpoint pendiente: Pablo evalúa la demo (preguntas al final del informe de la sesión). Pendientes que bloquean contenido: decisión de Oriel sobre la agrupación de categorías y el tope de 13 cartas por palo, permiso de fotos, video, horario, As real, joker (tabla en README).
Incidente propio del arnés: una pasada de suites se lanzó dos veces a la vez; se descartó y se repitió en serie. Servidores propios de prueba (4201, 4202) detenidos; 4195 queda arriba; 4198 sigue colgado y sin tocar.
