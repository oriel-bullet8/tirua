# Plan: conectar el sitio con Instagram (@bartirua) — borrador 2026-10-23

Estado hoy: el sitio solo enlaza al perfil. La reserva sale por WhatsApp. Nada se sincroniza.
Perfil visto en público (sin iniciar sesión): ~17,6 mil seguidores, destacadas «Horarios · Liga · Carta digital · Reservas · Sociales · Eventos», link de bio a Justo (+2 enlaces más), reels sobre todo verticales y con gráfica de texto.

## Qué se podría automatizar (de menos a más esfuerzo)
1. **Últimas publicaciones en el sitio** (galería «Del Instagram del bar»): una tarea programada baja las N últimas publicaciones y el sitio las muestra.
2. **Video del hero y fotos del local**: salen del feed solo si el bar entrega los originales (ver abajo); no se bajan de Instagram.
3. **Horario / eventos**: hoy están en destacadas e imágenes; no hay API para leerlas como dato. Mejor que Oriel los mantenga en un archivo simple (`js/contenido.js`) o en una planilla que el sitio lea.
4. **Reservas por DM**: descartado por ahora. La API de mensajes exige app aprobada por Meta y respuestas dentro de 24 h; el flujo WhatsApp con confirmación a mano ya funciona.

## Cómo hacer el punto 1 sin romper las reglas del sitio (sin scripts de terceros)
- La **API de Instagram con Instagram Login** (reemplazo del Basic Display API, cerrado el 4-dic-2024) permite leer `GET /me/media` (id, caption, media_type, media_url, thumbnail_url, permalink, timestamp) **solo si la cuenta es Business o Creator**. Hay que verificar el tipo de cuenta de @bartirua.
- Necesita: una app en Meta for Developers (modo desarrollo basta para leer la propia cuenta si la cuenta se agrega como probador), un token de larga duración (60 días, renovable cada ≤ 60 días con `refresh_access_token`).
- **Arquitectura propuesta:** un GitHub Action programado (p. ej. cada 6 h) con el token en *Secrets* → pide los últimos 9–12 posts → descarga las miniaturas a `assets/instagram/` → escribe `datos/instagram.json` → hace commit. El sitio lee solo ese JSON local (cero llamadas a Meta en el navegador, nada de `embed.js`, carga rápida, funciona aunque Instagram esté caído). El mismo Action renueva el token.
- Alternativa más simple pero con costo y script de terceros: un widget (Behold, Elfsight, SnapWidget). Menos trabajo, menos control y rompe «sin hosts externos».
- Alternativa manual: Oriel pega 6 enlaces en un JSON cada cierto tiempo. Cero API, cero riesgo.

## Riesgos / cosas a decidir
- **Cuenta:** ¿@bartirua es Business/Creator y quién administra la app de Meta? (el dueño del bar, no Pablo ni Oriel personales).
- **Música con licencia:** los reels usan audio de la biblioteca de Instagram; no se puede reutilizar el audio fuera de la plataforma. Cualquier video del hero va **sin sonido**.
- **Personas en los videos:** salen clientes y artistas; pedir visto bueno del bar.
- **Límites y cambios de Meta:** tokens que vencen, permisos que cambian. El Action debe avisar si falla (issue o correo) y el sitio debe seguir mostrando el último JSON bueno.
- **Alcance:** la galería es solo lectura. No hay publicar desde el sitio.

## Video del hero (decisión pendiente)
Los reels del bar son verticales (360×640 y 720×1280), se sirven por streaming protegido tras un inicio de sesión y llevan música con licencia: sirven para mostrar ideas, **no** como archivo del hero (un reel vertical recortado a pantalla ancha se ve borroso).
Lo ideal: 1–2 clips **originales en horizontal** (1920×1080, 8–15 s, sin hablar a cámara, sin texto): terraza con estufas encendidas, cocina/plato terminado, brindis. Los comprimo a < 5 MB (mp4 H.264 + webm), sin audio, y se activan solos: el hero ya detecta `assets/video/hero.mp4`.


---
## Estado de la implementación (2026-10-24): «Novedades» en el hero

**Ya está construido el lado del sitio** (js/historias.js, css en styles.css): burbujas tipo historias bajo los botones del hero y un visor a pantalla completa (barras de progreso, tocar/flechas/deslizar, mantener pulsado = pausa, 6,5 s por historia, «Ver en Instagram»). Lee `datos/instagram.json`; si está vacío o falta, el hero queda como estaba (hoy está vacío a propósito: no se copió contenido del Instagram del bar sin permiso). Para ver el diseño: `http://127.0.0.1:4195/?demo=instagram` (5 ejemplos marcados «Ejemplo»).

**Cómo entra el contenido real (dos caminos, mismo archivo):**
1. **A mano** (ya funciona): se editan `datos/instagram.json` y se dejan las imágenes en `assets/instagram/` (formato en `datos/instagram.demo.json`). Útil mientras no haya API.
2. **Automático:** `scripts/instagram-sync.mjs` (API oficial, cuenta Business/Creator) descarga las últimas 12 publicaciones y escribe ese mismo JSON + miniaturas; `.github/workflows/instagram.yml` lo corre cada 6 h y renueva el token. **Inerte** hasta subir el repo a GitHub y crear el secreto `IG_TOKEN`. El script está probado contra una API simulada (`node --test pruebas/instagram-sync.test.mjs`); **no** se ha probado con Instagram real: falta el token.

**Qué hace falta de la cuenta del bar:** que sea Business o Creator, una app en Meta for Developers con la cuenta agregada como probador y un token de larga duración (60 días, el workflow lo renueva). Lo hace el dueño de la cuenta, no se comparte la contraseña.

**Límite de lo automático:** los videos/reels no se alojan (Instagram no entrega el archivo): se muestra su miniatura y el botón lleva al reel. Las destacadas no se pueden leer por API.
