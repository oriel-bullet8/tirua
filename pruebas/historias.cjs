// Novedades de Instagram en el hero (js/historias.js): burbujas, visor tipo historias, datos vacíos/ausentes, seguridad de los datos.
// Uso: node pruebas/historias.cjs   (servidor: python3 servir.py). Mockea datos/instagram.json con page.route; no usa Instagram.
const { MAPAS, lanzar, contexto, esperar, BASE } = require('./_lib.cjs');
const R = [];
function ok(g, nombre, cond, detalle) { R.push({ g, nombre, ok: !!cond }); console.log((cond ? 'OK   ' : 'FALLA') + ' [' + g + '] ' + nombre + (detalle !== undefined && detalle !== '' ? ' → ' + String(detalle).slice(0, 200) : '')); }
const DATOS = { cuenta: 'bartirua', items: [
  { id: 'a1', titulo: 'Concurso de bandas', texto: 'Cada miércoles nuevas bandas.', imagen: 'assets/productos/ramajito.webp', url: 'https://www.instagram.com/p/AAA/', fecha: new Date(Date.now() - 3 * 3600e3).toISOString() },
  { id: 'a2', titulo: 'Open mic', texto: 'Sube al escenario.', url: 'https://www.instagram.com/reel/BBB/', fecha: new Date(Date.now() - 2 * 86400e3).toISOString() },
  { id: 'a3', titulo: 'Sorpresa del viernes', texto: 'Texto largo '.repeat(40), imagen: 'assets/productos/sol-de-fuego.webp', url: 'https://www.instagram.com/p/CCC/' },
  { id: 'x1', titulo: 'Enlace y foto peligrosos', texto: 'No deben pasar', imagen: 'https://evil.example/x.png', url: 'javascript:alert(1)' },
  { titulo: '' }
] };
async function conDatos(b, g, vp, datos, extra, consulta) {
  const c = await contexto(b, Object.assign({ viewport: vp }, extra || {}));
  await c.ctx.addInitScript(() => localStorage.setItem('tirua-tema', 'claro'));
  await c.page.route('**/datos/instagram.json', (r) => datos === null ? r.fulfill({ status: 404, body: 'no' }) : r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(datos) }));
  await c.page.goto(BASE + (consulta || ''), { waitUntil: 'networkidle' }); await esperar(2600);
  return c;
}
async function recorrido(b, g, vp) {
  const { ctx, page, log } = await conDatos(b, g, vp, DATOS);
  const r = await page.evaluate(() => ({ visible: !document.querySelector('[data-historias]').hidden, n: document.querySelectorAll('.historia').length, hero: document.querySelector('.hero').classList.contains('hay-historias'), sw: document.documentElement.scrollWidth - document.documentElement.clientWidth, imgs: [...document.querySelectorAll('.historia img')].map((i) => i.getAttribute('src')), btn: [...document.querySelectorAll('.historia')].map((x) => Math.round(x.getBoundingClientRect().width)) }));
  ok(g, 'con datos aparece el bloque «Novedades» en el hero con una burbuja por publicación válida (4: la vacía se descarta; la de enlace e imagen peligrosos se conserva sin ellos)', r.visible && r.n === 4 && r.hero, JSON.stringify([r.visible, r.n]));
  ok(g, 'las imágenes externas del JSON se ignoran (solo rutas locales assets/…)', r.imgs.every((s) => /^assets\//.test(s)), r.imgs.join(','));
  ok(g, 'sin desborde horizontal con el bloque', r.sw <= 1, r.sw);
  ok(g, 'burbujas táctiles (≥ 44 px de ancho)', r.btn.every((w) => w >= 44), r.btn.join(','));
  const bot = await page.evaluate(() => { const rr = document.querySelector('.hero__acciones').getBoundingClientRect(), n = document.querySelector('.historias').getBoundingClientRect(); return { botones: Math.round(rr.bottom), rail: Math.round(n.top) }; });
  ok(g, 'las burbujas quedan bajo los botones del hero (sin solaparse)', bot.rail >= bot.botones - 1, JSON.stringify(bot));
  // abrir
  await page.click('.historia >> nth=0'); await esperar(900);
  let v = await page.evaluate(() => { const d = document.querySelector('dialog.hv'); const cta = d.querySelector('.hv__cta'); return { abierto: d.open, titulo: d.querySelector('.hv__titulo').textContent, cuenta: d.querySelector('.hv__cuenta').textContent, tiempo: d.querySelector('.hv__tiempo').textContent, href: cta.getAttribute('href'), rel: cta.rel, target: cta.target, barras: d.querySelectorAll('.hv__barras i').length, htmlBloq: document.documentElement.classList.contains('hv-abierto'), foco: document.activeElement.className, estado: d.querySelector('[role=status]').textContent }; });
  ok(g, 'el visor abre en modo diálogo con la primera publicación, @cuenta, tiempo relativo y barras de progreso', v.abierto && v.titulo === 'Concurso de bandas' && v.cuenta === '@bartirua' && /hace 3 horas/.test(v.tiempo) && v.barras === 4 && v.htmlBloq, JSON.stringify(v));
  ok(g, 'el enlace «Ver en Instagram» es externo seguro (https, noopener, otra pestaña)', /^https:\/\/www\.instagram\.com\//.test(v.href) && /noopener/.test(v.rel) && v.target === '_blank', JSON.stringify([v.href, v.rel, v.target]));
  ok(g, 'el foco entra al visor y se anuncia el contenido para lectores', /hv__marco/.test(v.foco) && /Concurso de bandas/.test(v.estado), v.foco);
  // navegación
  await page.keyboard.press('ArrowRight'); await esperar(500);
  ok(g, 'flecha derecha pasa a la siguiente (Open mic)', (await page.evaluate(() => document.querySelector('.hv__titulo').textContent)) === 'Open mic', '');
  ok(g, 'una publicación sin imagen se muestra como tarjeta de texto sobre el rojo', await page.evaluate(() => document.querySelector('.hv__medio').classList.contains('hv__medio--texto')), '');
  await page.keyboard.press('ArrowLeft'); await esperar(400);
  ok(g, 'flecha izquierda vuelve', (await page.evaluate(() => document.querySelector('.hv__titulo').textContent)) === 'Concurso de bandas', '');
  await page.click('.hv__zona--der'); await esperar(400);
  ok(g, 'tocar la mitad derecha avanza', (await page.evaluate(() => document.querySelector('.hv__titulo').textContent)) === 'Open mic', '');
  // texto largo cabe
  await page.click('.hv__zona--der'); await esperar(500);
  const largo = await page.evaluate(() => { const m = document.querySelector('.hv__marco').getBoundingClientRect(), t = document.querySelector('.hv__texto').getBoundingClientRect(), c = document.querySelector('.hv__cta').getBoundingClientRect(); return { textoDentro: t.top >= m.top && t.bottom <= c.top + 2, ctaDentro: c.bottom <= m.bottom }; });
  ok(g, 'un texto muy largo (recortado a 240 car.) no se sale del marco ni pisa el botón', largo.textoDentro && largo.ctaDentro, JSON.stringify(largo));
  // auto-avance (solo con movimiento normal): 6,5 s por historia
  await page.keyboard.press('Home').catch(() => {});
  await page.evaluate(() => window.TIRUA.historias.abrir(0)); await esperar(7600);
  ok(g, 'avanza solo a la siguiente historia a los ~6,5 s', (await page.evaluate(() => document.querySelector('.hv__titulo').textContent)) === 'Open mic', '');
  // pausa con espacio
  await page.keyboard.press(' '); const p1 = await page.evaluate(() => document.querySelector('.hv__barras i:nth-child(2) b').style.transform); await esperar(1500); const p2 = await page.evaluate(() => document.querySelector('.hv__barras i:nth-child(2) b').style.transform);
  ok(g, 'la barra de espacio pausa el avance', p1 === p2, p1 + ' / ' + p2);
  // cerrar
  await page.keyboard.press('Escape'); await esperar(500);
  const c = await page.evaluate(() => ({ abierto: document.querySelector('dialog.hv').open, html: document.documentElement.classList.contains('hv-abierto'), foco: document.activeElement.className, vistas: document.querySelectorAll('.historia--vista').length, ls: localStorage.getItem('tirua-historias-vistas') }));
  ok(g, 'Esc cierra, devuelve el foco a la burbuja y marca las vistas', !c.abierto && !c.html && /historia/.test(c.foco) && c.vistas >= 2, JSON.stringify(c));
  // última historia cierra al terminar con →
  await page.click('.historia >> nth=2'); await esperar(500); await page.keyboard.press('ArrowRight'); await esperar(300); await page.keyboard.press('ArrowRight'); await esperar(500);
  ok(g, 'avanzar más allá de la última cierra el visor', !(await page.evaluate(() => document.querySelector('dialog.hv').open)), '');
  const externas = log.peticiones.filter((u) => !u.startsWith(BASE) && !u.startsWith('data:') && !MAPAS.test(u));
  ok(g, 'sin hosts externos ni errores de JS', externas.length === 0 && log.errores.length === 0, externas.concat(log.errores).join(' | '));
  await ctx.close();
}
(async () => {
  const b = await lanzar();
  await recorrido(b, 'escritorio', { width: 1440, height: 900 });
  await recorrido(b, 'movil', { width: 390, height: 844 });
  // apaisado: el visor en dos columnas
  { const g = 'apaisado'; const { ctx, page } = await conDatos(b, g, { width: 844, height: 390 }, DATOS);
    await page.click('.historia >> nth=0'); await esperar(900);
    const l = await page.evaluate(() => { const m = document.querySelector('.hv__marco').getBoundingClientRect(), t = document.querySelector('.hv__texto').getBoundingClientRect(), c = document.querySelector('.hv__cta').getBoundingClientRect(), img = document.querySelector('.hv__medio').getBoundingClientRect(); return { marcoW: Math.round(m.width), textoDerecha: t.left >= img.right - 1, dentro: t.bottom <= c.top + 2 && c.bottom <= m.bottom + 1 }; });
    ok(g, 'visor apaisado en dos columnas: imagen a la izquierda, texto y botón a la derecha, sin pisarse', l.marcoW > 600 && l.textoDerecha && l.dentro, JSON.stringify(l));
    await ctx.close(); }
  // sin publicaciones reales: la página normal muestra los ejemplos marcados; con ?demo=no el hero queda como estaba
  for (const [nombre, datos] of [['archivo ausente (404)', null], ['lista vacía', { items: [] }]]) {
    const g = 'ejemplos por defecto'; const { ctx, page, log } = await conDatos(b, g, { width: 1440, height: 900 }, datos);
    const d = await page.evaluate(() => ({ visible: !document.querySelector('[data-historias]').hidden, n: document.querySelectorAll('.historia').length, rotulos: [...document.querySelectorAll('.historia')].every((x) => /^Ejemplo\./.test(x.getAttribute('aria-label'))) }));
    ok(g, `${nombre}: sin ?demo se muestran 5 ejemplos marcados como tales`, d.visible && d.n === 5 && d.rotulos, JSON.stringify(d));
    ok(g, `${nombre}: sin errores de JS`, log.errores.length === 0, log.errores.join(' | ')); await ctx.close(); }
  // sin datos / archivo ausente / lista vacía / error (con ?demo=no): el hero queda como estaba
  for (const [nombre, datos] of [['archivo ausente (404)', null], ['lista vacía', { items: [] }], ['JSON sin items válidos', { items: [{ titulo: '' }, null] }]]) {
    const g = 'sin datos'; const { ctx, page, log } = await conDatos(b, g, { width: 1440, height: 900 }, datos, null, '?demo=no');
    const h = await page.evaluate(() => ({ oculto: document.querySelector('[data-historias]').hidden, burbujas: document.querySelectorAll('.historia').length, hero: document.querySelector('.hero').classList.contains('hay-historias'), frase: getComputedStyle(document.querySelector('.hero__frase')).opacity }));
    ok(g, `${nombre}: el bloque queda oculto y el hero intacto`, h.oculto && h.burbujas === 0 && !h.hero && h.frase === '1', JSON.stringify(h));
    ok(g, `${nombre}: sin errores de JS`, log.errores.length === 0, log.errores.join(' | ')); await ctx.close(); }
  // movimiento reducido: sin avance automático
  { const g = 'reducido'; const { ctx, page } = await conDatos(b, g, { width: 1440, height: 900 }, DATOS, { reducedMotion: 'reduce' });
    await page.click('.historia >> nth=0'); await esperar(7800);
    ok(g, 'con movimiento reducido no avanza solo (se navega a mano)', (await page.evaluate(() => document.querySelector('.hv__titulo').textContent)) === 'Concurso de bandas', '');
    await ctx.close(); }
  // hero con video: elige el archivo vertical solo en celular en vertical
  for (const [nombre, vp, esperado] of [['celular vertical', { width: 390, height: 844 }, 'hero-vertical.mp4'], ['escritorio', { width: 1440, height: 900 }, 'hero.mp4'], ['celular girado', { width: 844, height: 390 }, 'hero.mp4']]) {
    const g = 'hero-video'; const c = await contexto(b, { viewport: vp }); const pedidos = [];
    c.page.on('request', (r) => { if (/assets\/video\//.test(r.url())) pedidos.push(r.url().split('/').pop()); });
    await c.page.goto(BASE, { waitUntil: 'networkidle' }); await esperar(1200);
    ok(g, `${nombre}: pide ${esperado}`, pedidos.length >= 1 && pedidos.every((p) => p === esperado), pedidos.join(','));
    await c.ctx.close(); }

  // modo demo
  { const g = 'demo'; const c = await contexto(b, { viewport: { width: 1440, height: 900 } }); await c.page.goto(BASE + '?demo=instagram', { waitUntil: 'networkidle' }); await esperar(2600);
    const d = await c.page.evaluate(() => ({ n: document.querySelectorAll('.historia').length, rotulos: [...document.querySelectorAll('.historia')].every((b) => /^Ejemplo/.test(b.getAttribute('aria-label'))) }));
    ok(g, '?demo=instagram muestra 5 ejemplos claramente marcados como tales (aria-label «Ejemplo…»)', d.n === 5 && d.rotulos, JSON.stringify(d));
    await c.page.click('.historia >> nth=0'); await esperar(600); ok(g, 'el visor del ejemplo muestra la etiqueta «Ejemplo»', await c.page.evaluate(() => !document.querySelector('.hv__demo').hidden), ''); await c.ctx.close(); }
  await b.close();
  const f = R.filter((x) => !x.ok).length;
  console.log(`\nTOTAL ${R.length} comprobaciones · ${R.length - f} OK · ${f} con falla`);
  process.exit(f ? 1 : 0);
})();
