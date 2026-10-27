# Graph Report - tirua  (2026-10-24)

## Corpus Check
- 49 files · ~130,751 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 558 nodes · 1075 edges · 39 communities (37 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5b04a423`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- baraja.js
- reservar.js
- Continuidad · Bar Tirúa (estado al 2026-10-23)
- reservas.cjs
- LOOP SPEC · Tirúa: página casi lista
- LOOP SPEC
- prueba.cjs
- historias.js
- baraja-fotos.cjs
- LOOP SPEC
- scripts
- sondeo.cjs
- esperar
- Tirúa · sitio en construcción
- _lib.cjs
- Product
- baraja-campana.cjs
- baraja-extra.cjs
- inmersivo.cjs
- instagram-sync.mjs
- DESIGN.md · Tirúa (tercera vuelta, 2026-10-23)
- Plan: conectar el sitio con Instagram (@bartirua) — borrador 2026-10-23
- historias.cjs
- Guía de video para el hero de Tirúa (para marketing)
- render.js
- instagram-sync.test.mjs
- recursos.cjs
- reservas-datos.cjs
- hero.js
- menu.js
- comparar-fotos.py
- SinCache
- LEEME.md

## God Nodes (most connected - your core abstractions)
1. `esperar()` - 26 edges
2. `espiar()` - 22 edges
3. `calendario()` - 21 edges
4. `LOOP SPEC · Tirúa: página casi lista` - 20 edges
5. `LOOP SPEC` - 19 edges
6. `LOOP SPEC` - 19 edges
7. `render()` - 15 edges
8. `contexto()` - 15 edges
9. `flujo()` - 15 edges
10. `llenarHora()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `centrar()` --calls--> `esperar()`  [EXTRACTED]
  pruebas/baraja-extra.cjs → pruebas/_lib.cjs
- `navegacion()` --indirect_call--> `tactil()`  [INFERRED]
  pruebas/prueba.cjs → pruebas/baraja-funcional.cjs
- `categorias()` --calls--> `espiar()`  [EXTRACTED]
  pruebas/prueba.cjs → pruebas/_lib.cjs
- `contenidoAlterno()` --calls--> `espiar()`  [EXTRACTED]
  pruebas/prueba.cjs → pruebas/_lib.cjs
- `conVideo()` --calls--> `espiar()`  [EXTRACTED]
  pruebas/prueba.cjs → pruebas/_lib.cjs

## Import Cycles
- None detected.

## Communities (39 total, 2 thin omitted)

### Community 0 - "baraja.js"
Cohesion: 0.07
Nodes (66): abrirLista(), aislarResto(), anunciar(), aplicarFiltros(), asomo(), bandeja(), buildCard(), buildChips() (+58 more)

### Community 1 - "reservar.js"
Cohesion: 0.12
Nodes (57): abrir(), actualizarCabeceras(), actualizarVista(), aFecha(), ahoraMin(), anunciar(), avanzar(), botonContinuar() (+49 more)

### Community 2 - "Continuidad · Bar Tirúa (estado al 2026-10-23)"
Cohesion: 0.05
Nodes (36): Antes de empezar (checklist), Continuidad · Bar Tirúa (estado al 2026-10-23), Dónde quedamos, Ideas siguientes (propuestas, sin hacer), Incidente de los 404 (2026-10-23), Iteración 2 de la tercera vuelta (2026-10-23, segunda parte del pedido de Oriel), Loop «página casi lista» (2026-10-23): ver `loops/pagina-casi-lista.md`, Límites conocidos (+28 more)

### Community 3 - "reservas.cjs"
Cohesion: 0.21
Nodes (32): espiar(), aSolicitud(), bloquearExterno(), chicos(), completarDatos(), DIAS, diasCerradosActivable(), domingoLunes() (+24 more)

### Community 4 - "LOOP SPEC · Tirúa: página casi lista"
Cohesion: 0.08
Nodes (25): Abort Condition, AGENT PROMPT (resumen operativo), Available Actions, CHECKS, CICLOS, Classification, Decision Rules, DEFECTOS (+17 more)

### Community 5 - "LOOP SPEC"
Cohesion: 0.09
Nodes (22): Abort Condition, AGENT PROMPT, Available Actions, Classification, Decision Rules, Definition of Done, ENCARGO PARA LOOP BUILDER (texto listo para pegar en el recuadro inicial), Escalation Condition (+14 more)

### Community 6 - "prueba.cjs"
Cohesion: 0.23
Nodes (22): bajoCabecera(), categorias(), chk(), clsInit(), contenidoAlterno(), conVideo(), esperar(), fs (+14 more)

### Community 7 - "historias.js"
Cohesion: 0.23
Nodes (21): abrir(), alternarPausa(), arrancar(), barras(), cerrar(), crearVisor(), el(), enlaceSeguro() (+13 more)

### Community 8 - "baraja-fotos.cjs"
Cohesion: 0.15
Nodes (21): carta, clp(), contraste(), crypto, dimWebp(), dispositivo(), estaticos(), lum() (+13 more)

### Community 9 - "LOOP SPEC"
Cohesion: 0.10
Nodes (20): Abort Condition, Available Actions, Classification, Decision Rules, Definition of Done, Escalation Condition, Estado y evidencia (Loop Runner · ciclo 1 · 2026-10-19), Failure Handling (+12 more)

### Community 10 - "scripts"
Cohesion: 0.10
Nodes (20): description, devDependencies, playwright-core, engines, node, name, private, scripts (+12 more)

### Community 11 - "sondeo.cjs"
Cohesion: 0.24
Nodes (17): aviso(), azar(), desbordes(), estado(), estres(), foco(), MALA(), { MAPAS, lanzar, contexto, esperar, BASE, CAP, fs, path } (+9 more)

### Community 12 - "esperar"
Cohesion: 0.29
Nodes (15): abrirYEsperar(), cap(), centrar(), centroBaraja(), coherente(), estado(), linea(), { MAPAS, lanzar, contexto, esperar, BASE, CAP, fs, path } (+7 more)

### Community 13 - "Tirúa · sitio en construcción"
Cohesion: 0.13
Nodes (15): Arranque, Carta en baraja (demostración), Datos reales y pendientes, Demo completa · estado al 2026-10-20, Estructura de la página (en este orden), Fotos, Fotos de los bebestibles (Justo), Logo (+7 more)

### Community 14 - "_lib.cjs"
Cohesion: 0.15
Nodes (8): { chromium }, ejecutableEnCache(), lanzar(), os, L, TAMANOS, { lanzar, contexto, esperar, BASE }, L

### Community 15 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 16 - "baraja-campana.cjs"
Cohesion: 0.21
Nodes (11): clamp(), corrida(), cpu, fresco, fria, { lanzar, contexto, esperar, BASE, path, fs }, N, patron (+3 more)

### Community 17 - "baraja-extra.cjs"
Cohesion: 0.20
Nodes (8): centrar(), chunk(), crc32(), { MAPAS, lanzar, contexto, esperar, BASE, CAP, fs, path }, png(), PRODUCTOS, R, zlib

### Community 18 - "inmersivo.cjs"
Cohesion: 0.29
Nodes (9): contraste(), estado(), lum(), { MAPAS, lanzar, contexto, esperar, BASE, CAP, path }, ok(), R, recorrido(), CAP (+1 more)

### Community 19 - "instagram-sync.mjs"
Cohesion: 0.25
Nodes (7): api(), BASE, falla(), guardadas, LIMITE, nuevos, RAIZ

### Community 20 - "DESIGN.md · Tirúa (tercera vuelta, 2026-10-23)"
Cohesion: 0.29
Nodes (6): Componentes, DESIGN.md · Tirúa (tercera vuelta, 2026-10-23), Mundo, Reglas, Tipografía, Tokens (css/styles.css, `:root`)

### Community 21 - "Plan: conectar el sitio con Instagram (@bartirua) — borrador 2026-10-23"
Cohesion: 0.29
Nodes (6): Cómo hacer el punto 1 sin romper las reglas del sitio (sin scripts de terceros), Estado de la implementación (2026-10-24): «Novedades» en el hero, Plan: conectar el sitio con Instagram (@bartirua) — borrador 2026-10-23, Qué se podría automatizar (de menos a más esfuerzo), Riesgos / cosas a decidir, Video del hero (decisión pendiente)

### Community 22 - "historias.cjs"
Cohesion: 0.38
Nodes (6): conDatos(), DATOS, { MAPAS, lanzar, contexto, esperar, BASE }, ok(), R, recorrido()

### Community 23 - "Guía de video para el hero de Tirúa (para marketing)"
Cohesion: 0.33
Nodes (5): Dónde se pone, Guía de video para el hero de Tirúa (para marketing), Peso y formato técnico, Qué entregar (dos archivos), Reglas de contenido

### Community 24 - "render.js"
Cohesion: 0.47
Nodes (3): accion(), el(), enlaces()

### Community 25 - "instagram-sync.test.mjs"
Cohesion: 0.40
Nodes (4): correr(), ejecutar(), PNG, SCRIPT

### Community 26 - "recursos.cjs"
Cohesion: 0.33
Nodes (4): CONOCIDAS, fs, path, RAIZ

### Community 27 - "reservas-datos.cjs"
Cohesion: 0.33
Nodes (3): fs, L, path

### Community 28 - "hero.js"
Cohesion: 0.90
Nodes (4): abandonar(), intentarPlay(), montar(), sincronizarBoton()

### Community 29 - "menu.js"
Cohesion: 0.70
Nodes (4): abrir(), cerrar(), enlaces(), inerte()

### Community 30 - "comparar-fotos.py"
Cohesion: 0.83
Nodes (3): esperado(), mae(), main()

## Knowledge Gaps
- **208 isolated node(s):** `name`, `version`, `private`, `description`, `start` (+203 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `esperar()` connect `esperar` to `baraja-fotos.cjs`, `sondeo.cjs`, `_lib.cjs`, `baraja-campana.cjs`, `baraja-extra.cjs`, `inmersivo.cjs`, `historias.cjs`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `lanzar()` connect `_lib.cjs` to `reservas.cjs`, `prueba.cjs`, `baraja-fotos.cjs`, `sondeo.cjs`, `esperar`, `baraja-campana.cjs`, `baraja-extra.cjs`, `inmersivo.cjs`, `historias.cjs`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `CAP` connect `inmersivo.cjs` to `reservas.cjs`, `prueba.cjs`, `baraja-fotos.cjs`, `sondeo.cjs`, `esperar`, `_lib.cjs`, `baraja-extra.cjs`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _208 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `baraja.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06924882629107981 - nodes in this community are weakly interconnected._
- **Should `reservar.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12038717483363581 - nodes in this community are weakly interconnected._
- **Should `Continuidad · Bar Tirúa (estado al 2026-10-23)` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._