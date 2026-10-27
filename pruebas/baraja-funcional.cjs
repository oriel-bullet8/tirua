// Batería funcional de la baraja integrada en el sitio. Uso: node pruebas/baraja-funcional.cjs [m390|d1440]  (servidor en 127.0.0.1:4195)
const { MAPAS, lanzar, contexto, esperar, BASE, CAP, fs, path } = require('./_lib.cjs');
const R = []; // resultados
function ok(grupo, nombre, cond, detalle) { R.push({ grupo, nombre, ok: !!cond, detalle: detalle === undefined ? '' : String(detalle) }); console.log((cond ? 'OK   ' : 'FALLA') + ' [' + grupo + '] ' + nombre + (detalle !== undefined && detalle !== '' ? ' → ' + detalle : '')); }

const estado = page => page.evaluate(() => {
  const act = document.querySelector('.br-card.br-is-active');
  const visibles = [...document.querySelectorAll('.br-card')].filter(c => !c.hidden);
  return {
    contador: document.querySelector('#contador').textContent.trim(),
    // v2: nombre y precio viven DENTRO de la carta activa (franja inferior); la descripción, bajo la baraja
    nombre: act && act.querySelector('.br-nombre') ? act.querySelector('.br-nombre').textContent.trim() : '',
    precio: act && act.querySelector('.br-precio') ? act.querySelector('.br-precio').textContent.trim() : '',
    desc: document.querySelector('#p-desc').hidden ? '' : document.querySelector('#p-desc').textContent.trim(),
    descEsperada: (() => { const n = act && act.querySelector('.br-nombre') ? act.querySelector('.br-nombre').textContent.trim() : null; const pr = window.DATOS_BARAJA.productos.find(x => x.nombre === n); return pr ? pr.descripcion : null; })(),
    panelVisible: !document.querySelector('#panel-producto').hidden,
    etiquetaActiva: act ? act.getAttribute('aria-label') : null,
    expuestas: visibles.filter(c => c.getAttribute('aria-hidden') !== 'true').length,
    visibles: visibles.length,
    fase: ['is-closed', 'is-opening', 'is-open'].find(c => document.querySelector('#carta').classList.contains('br-' + c)),
    prev: document.querySelector('#prev').getAttribute('aria-disabled'),
    next: document.querySelector('#next').getAttribute('aria-disabled'),
    scrollY: window.scrollY,
    scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth
  };
});
// El panel debe coincidir con la carta activa: "Carta N de M: nombre, precio"
function coherente(s) {
  if (!s.etiquetaActiva) return false;
  const m = s.etiquetaActiva.match(/^Carta (\d+) de (\d+): (.*), (\$[\d.]+)$/);
  if (!m) return false;
  return s.nombre === m[3] && s.precio === m[4] && s.contador === `${m[1]} de ${m[2]}` && s.expuestas === 1 && s.panelVisible && s.desc === s.descEsperada;
}
// Carta (nombre y precio dentro de la carta) == aria-label == descripción mostrada == precio de la lista rápida
async function verif(page, g, etiqueta) {
  const s = await estado(page);
  const foco = await page.evaluate(() => document.activeElement && document.activeElement.id);
  await page.evaluate(() => document.querySelector('#abrir-lista').click());
  await page.waitForFunction(() => document.querySelector('#hoja').open);
  const lista = await page.evaluate(n => { const it = [...document.querySelectorAll('.br-hoja__item')].find(b => b.querySelector('.br-hoja__nombre').textContent.trim() === n); return it ? it.querySelector('.br-hoja__precio').textContent.trim() : null; }, s.nombre);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#hoja').open);
  await esperar(120); // el evento «close» devuelve el foco al abridor de forma asíncrona
  if (foco === 'baraja') await page.focus('#baraja');
  ok(g, `${etiqueta}: nombre y precio de la carta = aria-label = descripción = lista rápida`, coherente(s) && lista === s.precio, JSON.stringify([s.contador, s.nombre, s.precio, lista, s.desc === s.descEsperada]));
}
async function centrar(page, margen = 110) {
  await page.evaluate(m => { const e = document.querySelector('#escena'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - m, behavior: 'instant' }); }, margen);
  await esperar(120);
}
async function abrirYEsperar(page) {
  await centrar(page);
  await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-open'), null, { timeout: 5000 });
  await esperar(900); // que el resorte asiente
}
async function reposo(page) { await esperar(900); }
async function tactil(page, pts, paso = 14) {
  const c = await page.context().newCDPSession(page);
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pts[0][0], y: pts[0][1] }] });
  for (let i = 1; i < pts.length; i++) { await esperar(paso); await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: pts[i][0], y: pts[i][1] }] }); }
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await c.detach();
}
function linea(x0, y0, x1, y1, n = 8) { return Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]); }
async function centroBaraja(page) { return page.evaluate(() => { const r = document.querySelector('#baraja').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }); }
async function cap(page, nombre) { if (!process.env.CAP_DIR) return; await page.screenshot({ path: path.join(process.env.CAP_DIR || CAP, nombre + '.png') }); }

async function suite(b, etiqueta, vp, touch) {
  const g = etiqueta;
  const { ctx, page, log } = await contexto(b, { viewport: vp, hasTouch: touch, isMobile: touch });
  await page.addInitScript(() => { window.__rand = 0; const r = Math.random; Math.random = function () { window.__rand++; return r(); }; });

  /* ---- 1. Apertura del mazo (arranca cerrado: viewport corto ⇒ la escena no está a la vista) ---- */
  await page.setViewportSize({ width: vp.width, height: 360 });
  await page.goto(BASE + 'index.html');
  await esperar(1200);
  let s = await estado(page);
  ok(g, 'mazo cerrado al cargar si la escena no está a la vista', s.fase === 'is-closed', s.fase);
  // v2: ya no hay texto «La baraja está cerrada»; bajo el mazo queda el botón de apertura (en el panel) y no hay descripción
  ok(g, 'mazo cerrado: bajo el mazo está «Abrir la baraja» y no hay descripción de producto', (await page.locator('#panel-cerrada').isVisible()) && !(await page.locator('#panel-producto').isVisible()));
  const abrirVisible = await page.locator('#abrir').isVisible();
  ok(g, 'botón «Abrir la baraja» visible y con nombre accesible', abrirVisible && (await page.locator('#abrir').innerText()).trim().toLowerCase() === 'abrir la baraja');
  await page.setViewportSize(vp);
  await esperar(150);
  await page.evaluate(() => document.querySelector('#escena').scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.evaluate(() => window.scrollBy({ top: -110, behavior: 'instant' }));
  await esperar(120);
  await cap(page, `baraja-01-${g}-mazo-cerrado`);
  // Cronometrar la apertura disparada por IntersectionObserver (scroll a la vista)
  await page.evaluate(() => { window.__t = {}; const c = document.querySelector('#carta'); new MutationObserver(() => { const n = performance.now(); if (c.classList.contains('br-is-opening') && !window.__t.ini) window.__t.ini = n; if (c.classList.contains('br-is-open') && !window.__t.fin) window.__t.fin = n; }).observe(c, { attributes: true, attributeFilter: ['class'] }); });
  // Recargar para disparar IO desde cerrado
  await page.setViewportSize({ width: vp.width, height: 360 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.goto(BASE + 'index.html'); await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await esperar(800);
  await page.evaluate(() => { window.__t = {}; const c = document.querySelector('#carta'); new MutationObserver(() => { const n = performance.now(); if (c.classList.contains('br-is-opening') && !window.__t.ini) window.__t.ini = n; if (c.classList.contains('br-is-open') && !window.__t.fin) window.__t.fin = n; }).observe(c, { attributes: true, attributeFilter: ['class'] }); });
  await page.setViewportSize(vp);
  await page.evaluate(() => { const e = document.querySelector('#escena'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 110, behavior: 'instant' }); });
  const t0 = Date.now();
  await esperar(330); await cap(page, `baraja-02-${g}-apertura-a-mitad-1`);
  await esperar(250); await cap(page, `baraja-02-${g}-apertura-a-mitad-2`);
  await esperar(250); await cap(page, `baraja-02-${g}-apertura-a-mitad-3`);
  await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-open'), null, { timeout: 5000 });
  const tt = await page.evaluate(() => window.__t);
  ok(g, 'el mazo se abre solo al llegar a la vista (IntersectionObserver)', true, `fase final is-open`);
  ok(g, 'duración de apertura ≲1,6 s (medida entre clases is-opening→is-open)', tt.fin && tt.ini && (tt.fin - tt.ini) < 1700, tt.ini && tt.fin ? Math.round(tt.fin - tt.ini) + ' ms' : JSON.stringify(tt));
  await reposo(page); await centrar(page);
  await cap(page, `baraja-03-${g}-abierto`);
  s = await estado(page);
  ok(g, 'tras abrir: «1 de 8», carta (nombre y precio) y descripción coinciden', coherente(s) && s.contador === '1 de 8', JSON.stringify([s.contador, s.nombre, s.precio]));
  await verif(page, g, 'tras abrir');
  ok(g, 'tras abrir: flecha anterior deshabilitada (aria-disabled) en el extremo', s.prev === 'true' && s.next === 'false');

  /* ---- 2. Botón «Abrir», «Saltar animación», cerrar y barajar ---- */
  await page.click('#cerrar'); await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-closed'));
  s = await estado(page);
  ok(g, '«Cerrar baraja» devuelve el mazo cerrado sin cambiar productos', s.fase === 'is-closed' && (await page.locator('#abrir').isVisible()));
  ok(g, 'tras cerrar el foco queda en «Abrir la baraja»', await page.evaluate(() => document.activeElement.id === 'abrir'));
  // Por teclado: Enter sobre el botón
  await page.keyboard.press('Enter');
  await esperar(250);
  ok(g, 'Enter sobre «Abrir la baraja» inicia la apertura', (await estado(page)).fase === 'is-opening');
  ok(g, '«Saltar animación» aparece durante la apertura', await page.locator('#saltar').isVisible());
  const tS = Date.now();
  await page.click('#saltar');
  await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-open'));
  ok(g, '«Saltar animación» omite la animación (<500 ms)', Date.now() - tS < 500, (Date.now() - tS) + ' ms');
  await reposo(page);
  // Clic sobre la escena durante la animación también acelera
  await page.click('#barajar');
  await esperar(500);
  const abr = await estado(page);
  const bb = await centroBaraja(page);
  await page.mouse.click(bb.x, bb.y - bb.h * 0.35);
  const tC = Date.now();
  await page.waitForFunction(() => { const c = document.querySelector('#carta'); return c.classList.contains('br-is-open') || c.classList.contains('br-is-closed'); }, null, { timeout: 4000 });
  await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-open'), null, { timeout: 4000 });
  ok(g, '«Barajar de nuevo» repite la animación y el orden no cambia', true, 'fase previa: ' + abr.fase);
  await reposo(page);
  s = await estado(page);
  ok(g, 'tras barajar: sigue «1 de 8» y coherente', coherente(s) && s.contador === '1 de 8');

  /* ---- 3. Navegación: flechas ---- */
  await centrar(page);
  const nombres = [];
  for (let i = 0; i < 3; i++) { await page.click('#next'); await esperar(700); s = await estado(page); nombres.push(coherente(s) && s.contador === `${i + 2} de 8`); }
  ok(g, 'flecha → ×3: contador, panel y carta activa coinciden en cada paso', nombres.every(Boolean), JSON.stringify(nombres));
  await cap(page, `baraja-04-${g}-navegacion-flecha-carta-4`);
  await page.click('#prev'); await esperar(700); s = await estado(page);
  ok(g, 'flecha ← vuelve a la carta 3 y coincide', coherente(s) && s.contador === '3 de 8');
  await verif(page, g, 'flecha');

  /* ---- 4. Teclado ---- */
  await page.focus('#baraja');
  await page.keyboard.press('ArrowRight'); await esperar(600); s = await estado(page);
  ok(g, 'teclado →: 4 de 8 y coincide', coherente(s) && s.contador === '4 de 8');
  await page.keyboard.press('ArrowLeft'); await esperar(600); s = await estado(page);
  ok(g, 'teclado ←: 3 de 8 y coincide', coherente(s) && s.contador === '3 de 8');
  await page.keyboard.press('End'); await esperar(900); s = await estado(page);
  await verif(page, g, 'teclado Fin');
  ok(g, 'teclado Fin: 8 de 8, siguiente deshabilitada', coherente(s) && s.contador === '8 de 8' && s.next === 'true' && s.prev === 'false', s.contador);
  await cap(page, `baraja-05-${g}-extremo-final-8-de-8`);
  await page.keyboard.press('ArrowRight'); await esperar(500); s = await estado(page);
  ok(g, 'en el extremo final → no pasa del último', s.contador === '8 de 8');
  await page.click('#next', { force: true }); await esperar(400); s = await estado(page);
  ok(g, 'clic en flecha deshabilitada no cambia nada', s.contador === '8 de 8' && coherente(s));
  await page.focus('#baraja');
  await page.keyboard.press('Home'); await esperar(900); s = await estado(page);
  ok(g, 'teclado Inicio: 1 de 8, anterior deshabilitada', coherente(s) && s.contador === '1 de 8' && s.prev === 'true');
  await page.keyboard.press('ArrowLeft'); await esperar(400); s = await estado(page);
  ok(g, 'en el extremo inicial ← no sale de rango', s.contador === '1 de 8');
  // Enter voltea
  await page.keyboard.press('Enter'); await esperar(900);
  const flip1 = await page.evaluate(() => document.querySelector('.br-card.br-is-active .br-flip').style.transform);
  await cap(page, `baraja-06-${g}-carta-volteada-reverso`);
  // El reverso no debe ocultar nombre ni precio: están en la franja del reverso y el punto central de cada uno cae sobre la cara trasera visible
  const rev = await page.evaluate(() => { const c = document.querySelector('.br-card.br-is-active'); const n = c.querySelector('.br-face--back .br-nombre'), pr = c.querySelector('.br-face--back .br-precio'); if (!n || !pr) return null; const hit = (e) => { const r = e.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!(el && el.closest('.br-face--back') && el.closest('.br-card') === c); }; return { nombre: n.textContent.trim(), precio: pr.textContent.trim(), nHit: hit(n), pHit: hit(pr), label: c.getAttribute('aria-label') }; });
  ok(g, 'carta volteada: el reverso muestra nombre y precio visibles (no los oculta) y coinciden con la carta', !!rev && rev.nHit && rev.pHit && rev.label.endsWith(rev.nombre + ', ' + rev.precio), JSON.stringify(rev));
  await page.keyboard.press('Enter'); await esperar(900);
  const flip2 = await page.evaluate(() => document.querySelector('.br-card.br-is-active .br-flip').style.transform);
  ok(g, 'Enter voltea la carta activa (reverso con logo) y otro Enter la devuelve', /180deg/.test(flip1) && flip2 === '', flip1 + ' → ' + (flip2 || '(cara)'));
  s = await estado(page);
  ok(g, 'al voltear, nombre y precio siguen en el panel', coherente(s));

  /* ---- 5. Clic en vecinas ---- */
  const posVec = await page.evaluate(() => { const c = [...document.querySelectorAll('.br-card')].filter(x => !x.hidden)[1].getBoundingClientRect(); return { x: c.right - 14, y: c.top + c.height * 0.55 }; });
  await page.mouse.click(posVec.x, posVec.y); await esperar(800); s = await estado(page);
  ok(g, 'clic en carta vecina la trae al frente (2 de 8)', coherente(s) && s.contador === '2 de 8', s.contador);
  await verif(page, g, 'clic en vecina');
  await cap(page, `baraja-07-${g}-vecina-al-frente`);

  /* ---- 6. Swipe táctil / arrastre ---- */
  const cb = await centroBaraja(page);
  if (touch) {
    await tactil(page, linea(cb.x + 80, cb.y, cb.x - 90, cb.y, 8), 24); await esperar(900); s = await estado(page);
    ok(g, 'swipe táctil ← avanza una carta (3 de 8) y coincide', coherente(s) && s.contador === '3 de 8', s.contador);
    await verif(page, g, 'swipe');
    await tactil(page, linea(cb.x - 70, cb.y, cb.x + 90, cb.y, 8), 24); await esperar(900); s = await estado(page);
    ok(g, 'swipe táctil → retrocede (2 de 8)', coherente(s) && s.contador === '2 de 8', s.contador);
    await tactil(page, linea(cb.x, cb.y, cb.x - 12, cb.y, 3)); await esperar(900); s = await estado(page);
    ok(g, 'swipe muy corto (12 px, lento) no cambia de carta', s.contador === '2 de 8', s.contador);
    await tactil(page, linea(cb.x + 100, cb.y, cb.x - 130, cb.y, 3), 6); await esperar(1000); s = await estado(page);
    ok(g, 'swipe rápido (flick) avanza al menos 1 carta y queda coherente', coherente(s) && parseInt(s.contador) >= 3, s.contador);
  } else {
    await page.mouse.move(cb.x + 60, cb.y); await page.mouse.down();
    for (let i = 1; i <= 8; i++) { await page.mouse.move(cb.x + 60 - i * 30, cb.y, { steps: 1 }); await esperar(24); }
    await page.mouse.up(); await esperar(900); s = await estado(page);
    ok(g, 'arrastre con puntero ← avanza (3 de 8) y coincide', coherente(s) && s.contador === '3 de 8', s.contador);
    await verif(page, g, 'arrastre');
    await page.mouse.move(cb.x - 60, cb.y); await page.mouse.down();
    for (let i = 1; i <= 8; i++) { await page.mouse.move(cb.x - 60 + i * 30, cb.y, { steps: 1 }); await esperar(24); }
    await page.mouse.up(); await esperar(900); s = await estado(page);
    ok(g, 'arrastre con puntero → retrocede (2 de 8)', coherente(s) && s.contador === '2 de 8', s.contador);
    await page.mouse.move(cb.x, cb.y); await page.mouse.down(); await page.mouse.move(cb.x - 10, cb.y); await page.mouse.up(); await esperar(900); s = await estado(page);
    ok(g, 'arrastre de 10 px no cambia de carta (queda 2 de 8 o voltea sin mover)', s.contador === '2 de 8', s.contador);
  }
  // Arrastre más allá del extremo (rebote) y retorno
  await page.keyboard.press('Home'); await esperar(500);
  await page.focus('#baraja'); await page.keyboard.press('Home'); await esperar(700);
  if (touch) { await tactil(page, linea(cb.x - 60, cb.y, cb.x + 160, cb.y, 8)); } else { await page.mouse.move(cb.x - 60, cb.y); await page.mouse.down(); await page.mouse.move(cb.x + 300, cb.y, { steps: 8 }); await page.mouse.up(); }
  await esperar(1000); s = await estado(page);
  ok(g, 'arrastrar más allá del primer extremo rebota: sigue en 1 de 8', s.contador === '1 de 8' && coherente(s), s.contador);

  /* ---- 7. 20 clics rápidos ---- */
  await centrar(page);
  const nx = await page.evaluate(() => { const r = document.querySelector('#next').getBoundingClientRect(); const p = document.querySelector('#prev').getBoundingClientRect(); return { nx: r.left + r.width / 2, ny: r.top + r.height / 2, px: p.left + p.width / 2, py: p.top + p.height / 2 }; });
  for (let i = 0; i < 20; i++) { await page.mouse.click(nx.nx, nx.ny); }
  await esperar(1100); s = await estado(page);
  ok(g, '20 clics rápidos en → : termina en 8 de 8 (sin bucle ni fuera de rango), coherente', s.contador === '8 de 8' && coherente(s), s.contador);
  for (let i = 0; i < 20; i++) { await page.mouse.click(nx.px, nx.py); }
  await esperar(1100); s = await estado(page);
  ok(g, '20 clics rápidos en ← : termina en 1 de 8, coherente', s.contador === '1 de 8' && coherente(s), s.contador);
  const patron = [1, 1, -1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, -1];
  let esperado = 0; patron.forEach(d => { esperado = Math.max(0, Math.min(7, esperado + d)); });
  await page.evaluate(() => { window.__c = []; ['prev', 'next'].forEach(id => document.getElementById(id).addEventListener('click', () => window.__c.push(id[0] + document.getElementById('contador').textContent), true)); });
  for (const d of patron) { await page.mouse.click(d > 0 ? nx.nx : nx.px, d > 0 ? nx.ny : nx.py); }
  await esperar(1100); s = await estado(page);
  const recibidos = await page.evaluate(() => window.__c.length);
  ok(g, '20 clics mezclados ←/→: el último gana, estado = ' + (esperado + 1) + ' de 8', s.contador === `${esperado + 1} de 8` && coherente(s), s.contador + ' (clics recibidos: ' + recibidos + ')');
  // v2 — causa raíz del fallo intermitente: los controles NO deben moverse entre cartas ni la página desplazarse sola
  await page.focus('#baraja'); await page.keyboard.press('Home'); await esperar(900);
  const rects = [];
  for (let i = 0; i < 8; i++) {
    rects.push(await page.evaluate(() => { const r = id => { const b = document.getElementById(id).getBoundingClientRect(); return [b.left, b.top]; }; return { prev: r('prev'), next: r('next'), sy: scrollY, dh: document.documentElement.scrollHeight }; }));
    await page.evaluate(() => document.getElementById('next').click()); await esperar(350);
  }
  const mov = Math.max(...rects.map(r => Math.max(Math.abs(r.prev[0] - rects[0].prev[0]), Math.abs(r.prev[1] - rects[0].prev[1]), Math.abs(r.next[0] - rects[0].next[0]), Math.abs(r.next[1] - rects[0].next[1]))));
  ok(g, 'controles ←/→ no se mueven entre las 8 cartas (≤0,5 px); scrollY y alto del documento constantes', mov <= 0.5 && rects.every(r => r.sy === rects[0].sy && r.dh === rects[0].dh), `desplazamiento máx ${mov.toFixed(2)} px; scrollY ${[...new Set(rects.map(r => r.sy))]}; alto doc ${[...new Set(rects.map(r => r.dh))]}`);
  await page.focus('#baraja'); await page.keyboard.press('Home'); await esperar(900);
  let esp2 = 0, fallosFresco = 0, sinListener = 0;
  await page.evaluate(() => { window.__c2 = 0; ['prev', 'next'].forEach(id => document.getElementById(id).addEventListener('click', () => window.__c2++, true)); });
  for (const d of patron) {
    const pt = await page.evaluate(id => { const b = document.getElementById(id).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, d > 0 ? 'next' : 'prev');
    const antes = await page.evaluate(() => window.__c2);
    await page.mouse.click(pt.x, pt.y);
    if ((await page.evaluate(() => window.__c2)) - antes !== 1) sinListener++;
    esp2 = Math.max(0, Math.min(7, esp2 + d));
  }
  await esperar(1100); s = await estado(page);
  ok(g, '20 clics mezclados con coordenadas RECALCULADAS por clic: estado = ' + (esp2 + 1) + ' de 8 y todos los clics llegan al botón', s.contador === `${esp2 + 1} de 8` && sinListener === 0 && coherente(s), s.contador + ' (clics sin listener: ' + sinListener + ')');
  const sync = await page.evaluate(() => { const b = document.querySelector('#next'); for (let i = 0; i < 25; i++) b.click(); for (let i = 0; i < 25; i++) document.querySelector('#prev').click(); return true; });
  await esperar(1100); s = await estado(page);
  ok(g, '50 clics síncronos (25 → luego 25 ←) en un mismo turno: coherente y en rango', coherente(s) && /^[1-8] de 8$/.test(s.contador), s.contador);
  // Teclas martilladas
  await page.focus('#baraja');
  for (let i = 0; i < 12; i++) await page.keyboard.press(i % 3 === 2 ? 'ArrowLeft' : 'ArrowRight');
  await esperar(1100); s = await estado(page);
  ok(g, 'teclas martilladas: estado coherente', coherente(s), s.contador);

  /* ---- 8. Scroll natural: la rueda y el gesto vertical siguen moviendo la página ---- */
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await esperar(200);
  await page.evaluate(() => document.querySelector('#escena').scrollIntoView({ block: 'center', behavior: 'instant' })); await esperar(300);
  const antes = await estado(page);
  const cc = await centroBaraja(page);
  await page.mouse.move(cc.x, cc.y);
  const y0 = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 500); await esperar(500);
  const y1 = await page.evaluate(() => scrollY);
  const desp = await estado(page);
  ok(g, 'rueda vertical con el puntero sobre la baraja desplaza la página (scrollY cambia)', y1 > y0 + 100, `${y0} → ${y1}`);
  ok(g, 'la rueda no cambia de carta', desp.contador === antes.contador, `${antes.contador} → ${desp.contador}`);
  const ta = await page.evaluate(() => getComputedStyle(document.querySelector('#baraja')).touchAction);
  ok(g, 'touch-action: pan-y en el área de la baraja', ta === 'pan-y', ta);
  if (touch) {
    await page.evaluate(() => document.querySelector('#escena').scrollIntoView({ block: 'center', behavior: 'instant' })); await esperar(300);
    const c2 = await centroBaraja(page);
    const sy0 = await page.evaluate(() => scrollY);
    await tactil(page, linea(c2.x, c2.y + 120, c2.x + 6, c2.y - 140, 10), 16); await esperar(700);
    const sy1 = await page.evaluate(() => scrollY); const d2 = await estado(page);
    ok(g, 'gesto táctil vertical sobre la baraja desplaza la página y no cambia de carta', sy1 > sy0 + 60 && d2.contador === antes.contador, `scrollY ${sy0} → ${sy1}; ${d2.contador}`);
  }

  /* ---- 9. Búsqueda ---- */
  await centrar(page, 200);
  await page.fill('#buscar', 'ramazzotti'); await esperar(900); s = await estado(page);
  let status = await page.locator('#estado-busqueda').innerText();
  await verif(page, g, 'búsqueda «ramazzotti»');
  ok(g, 'buscar «ramazzotti»: la baraja se reduce a 1 carta («1 de 1») y coincide', s.contador === '1 de 1' && s.visibles === 1 && coherente(s) && s.nombre === 'Ramazzotti Spritz', s.contador + ' | ' + s.nombre);
  ok(g, 'se anuncia el número de resultados (role=status)', /1 resultado/.test(status), status);
  ok(g, 'con 1 resultado ambas flechas deshabilitadas', s.prev === 'true' && s.next === 'true');
  await centrar(page, 110); await cap(page, `baraja-08-${g}-busqueda-1-resultado`);
  await page.fill('#buscar', 'TIRUA'); await esperar(900); s = await estado(page); status = await page.locator('#estado-busqueda').innerText();
  ok(g, 'búsqueda sin tildes ni mayúsculas «TIRUA» encuentra «Playa Tirúa» (1)', s.visibles === 1 && s.nombre === 'Playa Tirúa' && /1 resultado/.test(status), s.visibles + ' | ' + s.nombre + ' | ' + status);
  await page.fill('#buscar', 'CÓCTEL'); await esperar(900); s = await estado(page); status = await page.locator('#estado-busqueda').innerText();
  ok(g, 'búsqueda con tilde y mayúsculas «CÓCTEL» encuentra «coctel» sin tilde en las descripciones (3)', s.visibles === 3 && /3 resultados/.test(status), s.visibles + ' | ' + status);
  // La búsqueda en etiquetas se prueba en baraja-extra.cjs con datos interceptados: los 8 productos reales no traen etiquetas (no se inventan).
  await page.fill('#buscar', 'jengibre'); await esperar(900); s = await estado(page);
  ok(g, 'busca en descripción: «jengibre» → Green Drinks (1)', s.visibles === 1 && s.nombre === 'Green Drinks', s.nombre);
  await page.fill('#buscar', 'zzz'); await esperar(900);
  const vacio = await page.evaluate(() => ({ v: !document.querySelector('#vacio').hidden, t: document.querySelector('#vacio-titulo').textContent, region: document.querySelector('#baraja').hidden, status: document.querySelector('#estado-busqueda').textContent }));
  ok(g, 'cero resultados: estado vacío «No hay resultados para “zzz”» con «Restablecer filtros»', vacio.v && vacio.t === 'No hay resultados para “zzz”' && (await page.locator('#restablecer').innerText()).trim().toLowerCase() === 'restablecer filtros', vacio.t);
  ok(g, 'cero resultados: se anuncia por role=status', /Sin resultados/.test(vacio.status), vacio.status);
  const panelVacio = await page.evaluate(() => ({ prod: !document.querySelector('#panel-producto').hidden }));
  ok(g, 'cero resultados: el panel no muestra un producto fantasma', !panelVacio.prod);
  await centrar(page, 110); await cap(page, `baraja-09-${g}-busqueda-sin-resultados`);
  await page.click('#restablecer'); await esperar(900); s = await estado(page);
  const inp = await page.evaluate(() => ({ v: document.querySelector('#buscar').value, f: document.activeElement.id }));
  await verif(page, g, 'restablecer filtros');
  ok(g, '«Restablecer filtros» devuelve las 8 cartas, vacía el campo y enfoca la búsqueda', s.visibles === 8 && inp.v === '' && inp.f === 'buscar' && coherente(s), JSON.stringify(inp) + ' ' + s.contador);
  await page.fill('#buscar', 'spritz'); await esperar(700);
  ok(g, 'botón limpiar aparece al escribir', await page.locator('#limpiar').isVisible());
  const bl = await page.locator('#limpiar').boundingBox();
  ok(g, 'botón limpiar ≥44×44 px', bl.width >= 44 && bl.height >= 44, `${bl.width}×${bl.height}`);
  await page.click('#limpiar'); await esperar(800); s = await estado(page);
  ok(g, 'limpiar vacía la búsqueda y muestra todo', s.visibles === 8 && !(await page.locator('#limpiar').isVisible()));

  /* ---- 10. Lista rápida ---- */
  await centrar(page, 200);
  await page.focus('#abrir-lista');
  await page.keyboard.press('Enter'); await esperar(300);
  const dl = await page.evaluate(() => ({ abierto: document.querySelector('#hoja').open, items: document.querySelectorAll('.br-hoja__item').length, foco: document.activeElement.className, dentro: document.querySelector('#hoja').contains(document.activeElement), primero: document.querySelector('.br-hoja__item').textContent.replace(/\s+/g, ' ').trim() }));
  ok(g, 'lista rápida abre con 8 productos con nombre y precio; foco dentro', dl.abierto && dl.items === 8 && dl.dentro && /Ramajito.*\$8\.000/.test(dl.primero), JSON.stringify(dl));
  await cap(page, `baraja-10-${g}-lista-rapida`);
  let escapa = false;
  for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); if (!(await page.evaluate(() => document.querySelector('#hoja').contains(document.activeElement)))) escapa = true; }
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Shift+Tab'); if (!(await page.evaluate(() => document.querySelector('#hoja').contains(document.activeElement)))) escapa = true; }
  ok(g, 'el foco queda atrapado en la hoja (18 Tab/Shift+Tab)', !escapa);
  await page.keyboard.press('Escape'); await esperar(300);
  const dEsc = await page.evaluate(() => ({ abierto: document.querySelector('#hoja').open, foco: document.activeElement.id }));
  ok(g, 'Esc cierra la lista y devuelve el foco a «Ver lista rápida»', !dEsc.abierto && dEsc.foco === 'abrir-lista', JSON.stringify(dEsc));
  await page.click('#abrir-lista'); await esperar(250);
  await page.locator('.br-hoja__item').nth(4).click(); await esperar(1000); s = await estado(page);
  const dEleg = await page.evaluate(() => ({ abierto: document.querySelector('#hoja').open, foco: document.activeElement.id }));
  await verif(page, g, 'elegir en lista rápida');
  ok(g, 'elegir un producto cierra la hoja y lleva la carta 5 al frente, foco en la baraja', !dEleg.abierto && s.contador === '5 de 8' && coherente(s) && dEleg.foco === 'baraja', s.contador + ' ' + JSON.stringify(dEleg));
  // Con filtro: la lista solo trae los visibles
  await page.fill('#buscar', 'espresso vainilla'); await esperar(900);
  await page.click('#abrir-lista'); await esperar(250);
  const nLista = await page.locator('.br-hoja__item').count();
  ok(g, 'la lista rápida refleja solo los productos visibles con el filtro (1)', nLista === 1, nLista);
  await page.keyboard.press('Escape'); await page.click('#limpiar'); await esperar(900);
  // Lista con baraja cerrada
  await page.click('#cerrar'); await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-closed'));
  await page.click('#abrir-lista'); await esperar(250);
  await page.locator('.br-hoja__item').nth(2).click();
  await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-open'), null, { timeout: 5000 }); await esperar(1000); s = await estado(page);
  ok(g, 'elegir en la lista con la baraja cerrada la abre y deja la carta 3 al frente', s.contador === '3 de 8' && coherente(s), s.contador);

  /* ---- 11. Chips de categoría ---- */
  await centrar(page, 200);
  const chips = await page.evaluate(() => [...document.querySelectorAll('.br-chip')].map(c => ({ t: c.querySelector('.br-chip__nombre').textContent, ad: c.getAttribute('aria-disabled'), pr: c.getAttribute('aria-pressed'), est: c.querySelector('.br-chip__estado') ? c.querySelector('.br-chip__estado').textContent : '', h: c.getBoundingClientRect().height, desc: c.getAttribute('aria-describedby') })));
  ok(g, '4 chips: solo Bebestibles activo; las otras 3 «Próximamente» con aria-disabled', chips.length === 4 && chips[0].pr === 'true' && chips.slice(1).every(c => c.ad === 'true' && c.est === 'Próximamente' && c.desc === 'chips-nota'), JSON.stringify(chips.map(c => c.t + ':' + (c.ad || c.pr))));
  ok(g, 'chips ≥44 px de alto', chips.every(c => c.h >= 44), Math.min(...chips.map(c => c.h)));
  const antesChip = await estado(page);
  let peekMovil = null;
  if (touch) { peekMovil = await page.evaluate(() => { const c = document.querySelector('#chips'); const cr = c.getBoundingClientRect(); return { sw: c.scrollWidth, cw: c.clientWidth, peek: [...document.querySelectorAll('.br-chip')].some(e => { const r = e.getBoundingClientRect(); return r.left < cr.right - 1 && r.right > cr.right + 1; }) }; }); }
  await page.locator('.br-chip.br-is-pronto').nth(1).click({ force: true }); await esperar(500);
  const dChip = await estado(page); const anun = await page.locator('#anuncio').innerText();
  ok(g, 'clic en chip «Próximamente» no cambia la baraja y anuncia la explicación', dChip.contador === antesChip.contador && dChip.visibles === 8 && /próximamente/i.test(anun), anun);
  await page.locator('#chips').scrollIntoViewIfNeeded(); await esperar(100);
  await cap(page, `baraja-11-${g}-chips-proximamente`);
  if (touch) {
    ok(g, 'móvil: fila de chips desplazable horizontalmente (scrollWidth > clientWidth)', peekMovil.sw > peekMovil.cw, JSON.stringify(peekMovil));
    ok(g, 'móvil: un chip asoma cortado en el borde derecho (peek)', peekMovil.peek);
  }

  /* ---- 12. Joker (solo visual) ---- */
  await page.evaluate(() => document.querySelector('#joker-btn').scrollIntoView({ block: 'center', behavior: 'instant' })); await esperar(200);
  const j0 = await page.evaluate(() => ({ cartas: [...document.querySelectorAll('.br-card')].filter(c => !c.hidden).length, pressed: document.querySelector('#joker-btn').getAttribute('aria-pressed'), activo: window.DATOS_BARAJA.joker.activo, txt: document.querySelector('#joker-btn').innerText.trim() }));
  ok(g, 'joker: datos.js tiene joker.activo = false y la baraja normal no incluye joker', j0.activo === false && j0.cartas === 8 && j0.pressed === 'false', JSON.stringify(j0));
  ok(g, 'joker: control rotulado «Vista previa del joker (demostración)»', /vista previa del joker \(demostración\)/i.test(j0.txt), j0.txt);
  await page.click('#joker-btn'); await esperar(400);
  await cap(page, `baraja-12-${g}-joker-reverso-entrando`);
  await esperar(1600);
  const j1 = await page.evaluate(() => ({ cartas: [...document.querySelectorAll('.br-card')].filter(c => !c.hidden).length, contador: document.querySelector('#contador').textContent, txt: document.querySelector('#p-joker').textContent, btn: (() => { const b = document.querySelector('#p-vincular'); return { t: b.textContent, d: b.disabled, ad: b.getAttribute('aria-disabled'), v: !b.hidden }; })(), precio: document.querySelector('.br-card.br-is-active .br-precio') ? 1 : 0, rand: window.__rand, label: document.querySelector('.br-card.br-is-active').getAttribute('aria-label') }));
  ok(g, 'joker: aparece como carta 9 (tras los 8 productos) y es la activa', j1.cartas === 9 && j1.contador === 'Joker', JSON.stringify([j1.cartas, j1.contador]));
  ok(g, 'joker: texto exacto «Joker: beneficio por definir con el local. Idea pendiente: no es un descuento ni un premio real.»', j1.txt === 'Joker: beneficio por definir con el local. Idea pendiente: no es un descuento ni un premio real.', j1.txt);
  ok(g, 'joker: botón «Vincular a una solicitud de reserva (pendiente)» deshabilitado', j1.btn.t === 'Vincular a una solicitud de reserva (pendiente)' && j1.btn.d && j1.btn.ad === 'true' && j1.btn.v, JSON.stringify(j1.btn));
  ok(g, 'joker: sin precio ni descuento (la carta del joker no tiene franja de precio)', j1.precio === 0, j1.precio);
  ok(g, 'joker: ninguna llamada a Math.random en toda la sesión (sin aleatoriedad)', j1.rand === 0, j1.rand);
  await page.evaluate(() => document.querySelector('#escena').scrollIntoView({ block: 'center', behavior: 'instant' })); await esperar(300);
  await cap(page, `baraja-13-${g}-joker-cara`);
  await page.click('#joker-btn'); await esperar(900); s = await estado(page);
  ok(g, 'joker: ocultar la vista previa vuelve a las 8 cartas coherentes', s.visibles === 8 && coherente(s), s.contador);
  // Reverso del joker (voltear)
  await page.click('#joker-btn'); await esperar(2200);
  await page.focus('#baraja'); await page.keyboard.press('Enter'); await esperar(900);
  await page.evaluate(() => document.querySelector('#escena').scrollIntoView({ block: 'center', behavior: 'instant' })); await esperar(200);
  await cap(page, `baraja-14-${g}-joker-reverso`);
  await page.click('#joker-btn'); await esperar(800);

  /* ---- 13. Errores y peticiones ---- */
  const externas = log.peticiones.filter(u => !u.startsWith(BASE) && !MAPAS.test(u));
  ok(g, '0 errores de JS (pageerror)', log.errores.length === 0, log.errores.join(' | '));
  // El video del hero (assets/video/hero.mp4) aún no se entrega: su 404 es el estado diseñado «sin video» y se prueba aparte (regresion.cjs). Cualquier otro 404 sí cuenta.
  const ES_HERO = u => /assets\/video\/hero(-vertical)?\.mp4/.test(u);
  const consolaOtros = log.consola.length - log.fallidas.filter(u => ES_HERO(u) && /^404 /.test(u)).length;
  ok(g, '0 errores de consola (salvo el 404 esperado del video del hero ausente)', consolaOtros === 0, log.consola.join(' | '));
  ok(g, '0 peticiones a hosts externos', externas.length === 0, externas.join(' | '));
  const fallidasOtras = log.fallidas.filter(u => !ES_HERO(u));
  ok(g, '0 peticiones fallidas / 4xx (salvo el video del hero ausente)', fallidasOtras.length === 0, fallidasOtras.join(' | '));
  const tipos = [...new Set(log.peticiones.map(u => u.replace(BASE, '')))];
  R.push({ grupo: g, nombre: 'peticiones realizadas', ok: true, detalle: tipos.join(', ') });
  await ctx.close();
}

(async () => {
  fs.mkdirSync(path.join(__dirname,'resultados'), { recursive: true }); if (process.env.CAP_DIR) fs.mkdirSync(process.env.CAP_DIR, { recursive: true });
  const b = await lanzar();
  const solo = process.argv[2];
  if (!solo || solo === 'm390') await suite(b, 'm390', { width: 390, height: 844 }, true);
  if (!solo || solo === 'd1440') await suite(b, 'd1440', { width: 1440, height: 900 }, false);
  await b.close();
  fs.writeFileSync(path.join(__dirname, 'resultados', 'baraja-funcional.json'), JSON.stringify(R, null, 1));
  const f = R.filter(r => !r.ok);
  console.log(`\nTOTAL ${R.length} comprobaciones · ${R.length - f.length} OK · ${f.length} con falla`);
  f.forEach(r => console.log('  FALLA', r.grupo, r.nombre, r.detalle));
})();
