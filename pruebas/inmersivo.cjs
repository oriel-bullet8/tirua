// Portal de la carta y modo inmersivo (pantalla completa) + tema claro/oscuro.
// Uso: node pruebas/inmersivo.cjs   (servidor: python3 servir.py; BASE=http://127.0.0.1:4195/ por defecto)
// Cubre escritorio 1440×900, móvil 390×844 y móvil estrecho 320×568, y movimiento reducido. No envía nada.
const { MAPAS, lanzar, contexto, esperar, BASE, CAP, path } = require('./_lib.cjs');
const R = [];
function ok(g, nombre, cond, detalle) { R.push({ g, nombre, ok: !!cond }); console.log((cond ? 'OK   ' : 'FALLA') + ' [' + g + '] ' + nombre + (detalle !== undefined && detalle !== '' ? ' → ' + String(detalle).slice(0, 180) : '')); }
const estado = (page) => page.evaluate(() => [...document.querySelectorAll('[role=status]')].map((s) => s.textContent.trim()).filter(Boolean).join(' | '));
const lum = (c) => { const v = c.match(/[\d.]+/g).slice(0, 3).map((x) => { x = parseFloat(x) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const contraste = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };

async function recorrido(browser, g, vp, minCarta) {
  const { ctx, page, log } = await contexto(browser, { viewport: vp });
  await page.goto(BASE, { waitUntil: 'networkidle' }); await esperar(1200);
  const fondo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok(g, 'tema claro por defecto: fondo blanco', fondo === 'rgb(255, 255, 255)', fondo);
  const texto = await page.evaluate(() => { const e = document.querySelector('.seccion__bajada'); return getComputedStyle(e).color; });
  ok(g, 'texto secundario con contraste ≥ 4,5:1 sobre blanco', contraste(texto, 'rgb(255,255,255)') >= 4.5, contraste(texto, 'rgb(255,255,255)').toFixed(1));
  const logo = await page.evaluate(() => { const i = document.querySelector('h1 img'); return { cargado: i.complete && i.naturalWidth > 0, filtro: getComputedStyle(i).filter }; });
  ok(g, 'logo cargado y en tinta (invertido sobre papel claro)', logo.cargado && /invert/.test(logo.filtro), logo.filtro);
  const fam = await page.evaluate(() => getComputedStyle(document.querySelector('.titular')).fontFamily.split(',')[0] + ' / ' + getComputedStyle(document.body).fontFamily.split(',')[0]);
  ok(g, 'tipografías: Young Serif (titulares) y Alegreya Sans (cuerpo)', /Young Serif/.test(fam) && /Alegreya Sans/.test(fam), fam);

  // --- portal
  await page.locator('#carta').scrollIntoViewIfNeeded(); await esperar(900);
  const p0 = await page.evaluate(() => ({ inm: document.getElementById('carta').classList.contains('br-inm'), cerrada: document.getElementById('carta').classList.contains('br-is-closed'), html: document.documentElement.classList.contains('br-inm-abierto'),
    bandeja: getComputedStyle(document.getElementById('bandeja')).display, cerrar: document.getElementById('inm-cerrar').offsetParent !== null ? 'visible' : 'oculto', buscador: document.getElementById('buscar').offsetParent !== null }));
  ok(g, 'portal: la carta arranca cerrada, sin pantalla completa y sin herramientas a la vista', p0.cerrada && !p0.inm && !p0.html && p0.bandeja === 'none' && p0.cerrar === 'oculto' && !p0.buscador, JSON.stringify(p0));
  const scrollAntes = await page.evaluate(() => Math.round(scrollY));
  await esperar(2500);
  ok(g, 'portal: no se abre sola al llegar a la vista', await page.evaluate(() => document.getElementById('carta').classList.contains('br-is-closed')), '');

  // --- entrar
  await page.getByRole('button', { name: /Abrir la carta/i }).click();
  const vioAsomo = await page.waitForFunction(() => document.getElementById('carta').classList.contains('br-peek'), null, { timeout: 5000 }).then(() => true).catch(() => false);
  ok(g, 'primera apertura de la sesión: la carta hace un «asomo» (pista de que se voltea)', vioAsomo, '');
  await esperar(1700);   // el asomo dura ~1,2 s: se mide la carta ya quieta
  const pista = await page.evaluate(() => ({ hint: getComputedStyle(document.getElementById('hint-voltear')).opacity, texto: document.getElementById('hint-voltear').textContent }));
  const a = await page.evaluate(() => {
    const c = document.getElementById('carta'), r = c.getBoundingClientRect(), act = document.querySelector('.br-card.br-is-active .br-face'), ar = act.getBoundingClientRect();
    const botones = [...document.querySelectorAll('#carta button, #carta a')].filter((b) => b.offsetParent !== null && getComputedStyle(b).visibility !== 'hidden' && b.getBoundingClientRect().width > 0 && !b.closest('#bandeja')).map((b) => (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 28));
    return { inm: c.classList.contains('br-inm'), abierta: c.classList.contains('br-is-open'), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], vw: innerWidth, vh: innerHeight,
      overflow: getComputedStyle(document.documentElement).overflow, dialogo: c.getAttribute('role'), inert: document.querySelector('.cabecera').hasAttribute('inert') || document.querySelector('header').hasAttribute('inert'),
      carta: { w: Math.round(ar.width), h: Math.round(ar.height), dentro: ar.left >= -1 && ar.right <= innerWidth + 1 && ar.top >= -1 && ar.bottom <= innerHeight + 1 }, botones };
  });
  ok(g, 'la pista «Toca la carta para darle la vuelta» se ve hasta el primer volteo', +pista.hint > 0.5 && /vuelta/.test(pista.texto), JSON.stringify(pista));
  ok(g, 'al abrir, la sección ocupa toda la pantalla (modo inmersivo)', a.inm && a.abierta && a.rect[0] === 0 && a.rect[1] === 0 && a.rect[2] === a.vw && a.rect[3] === a.vh, JSON.stringify(a.rect));
  ok(g, 'la página de fondo no se desplaza ni recibe foco (overflow oculto, inert, role=dialog)', a.overflow === 'hidden' && a.inert && a.dialogo === 'dialog', `${a.overflow} inert=${a.inert} ${a.dialogo}`);
  ok(g, `la carta activa es grande (≥ ${minCarta} px de ancho) y cabe entera en pantalla`, a.carta.w >= minCarta && a.carta.dentro, JSON.stringify(a.carta));
  ok(g, 'casi sin botones a la vista (≤ 6, bandeja cerrada)', a.botones.length <= 6, a.botones.join(' · '));

  // --- navegar
  await page.keyboard.press('ArrowRight'); await esperar(800);
  ok(g, 'flecha derecha → carta 2 de 8', /Carta 2 de 8/.test(await estado(page)), await estado(page));
  await page.mouse.move(vp.width / 2, vp.height / 2);
  await page.mouse.wheel(0, 140); await esperar(800);
  ok(g, 'rueda vertical → carta siguiente (3 de 8)', /Carta 3 de 8/.test(await estado(page)), await estado(page));
  await page.mouse.wheel(160, 0); await esperar(800);
  ok(g, 'scroll lateral → carta siguiente (4 de 8)', /Carta 4 de 8/.test(await estado(page)), await estado(page));
  await page.mouse.wheel(-160, 0); await esperar(800);
  ok(g, 'scroll lateral inverso → carta anterior (3 de 8)', /Carta 3 de 8/.test(await estado(page)), await estado(page));
  await page.mouse.move(vp.width * 0.7, vp.height * 0.45); await page.mouse.down(); await page.mouse.move(vp.width * 0.3, vp.height * 0.45, { steps: 8 }); await page.mouse.up(); await esperar(900);
  ok(g, 'arrastrar hacia la izquierda avanza al menos una carta', /Carta [4-8] de 8/.test(await estado(page)), await estado(page));
  await page.keyboard.press('Home'); await esperar(700);
  ok(g, 'Inicio vuelve a la primera carta', /Carta 1 de 8/.test(await estado(page)), await estado(page));

  // --- palos a los costados de la foto (no debajo): la carta 5 lleva 3 a la izquierda y 2 a la derecha
  for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowRight'); await esperar(450); }
  await esperar(700);
  const pp = await page.evaluate(() => { const c = document.querySelector('.br-card.br-is-active'), foto = c.querySelector('.br-foto').getBoundingClientRect(), f = c.querySelector('.br-franja').getBoundingClientRect();
    const p = [...c.querySelectorAll('.br-pips .br-pip')].map((e) => e.getBoundingClientRect());
    return { izq: c.querySelectorAll('.br-pips__col--izq .br-pip').length, der: c.querySelectorAll('.br-pips__col--der .br-pip').length, costados: p.every((r) => r.right <= foto.left + 1 || r.left >= foto.right - 1), sobreFranja: p.every((r) => r.bottom <= f.top + 1), tilde: p.length }; });
  ok(g, 'carta 5: 3 palos a la izquierda y 2 a la derecha de la foto, ninguno bajo ella ni sobre la franja', pp.izq === 3 && pp.der === 2 && pp.costados && pp.sobreFranja, JSON.stringify(pp));
  await page.keyboard.press('Home'); await esperar(800);
  // --- reverso: ficha del trago con los datos de Justo (categoría + descripción), sin logo, y la leyenda de abajo se atenúa
  await page.keyboard.press('ArrowRight'); await esperar(700); await page.keyboard.press('Enter'); await esperar(1200);
  const rv = await page.evaluate(() => { const c = document.querySelector('.br-card.br-is-active'), d = c.querySelector('.br-dorso__desc'), k = c.querySelector('.br-dorso__cat'), f = c.querySelector('.br-face--back .br-franja').getBoundingClientRect(), r = d.getBoundingClientRect();
    return { desc: d.textContent, cat: k && k.textContent, panel: document.getElementById('p-desc').textContent, logo: getComputedStyle(c.querySelector('.br-dorso__logo')).display, cabe: r.bottom <= f.top + 1 && d.scrollHeight <= d.clientHeight + 1, leyenda: getComputedStyle(document.getElementById('panel-producto')).opacity }; });
  ok(g, 'reverso: muestra la descripción de Justo tal cual y su categoría («Coctelería de autor»)', rv.desc === rv.panel && rv.cat === 'Coctelería de autor' && rv.desc.length > 20, JSON.stringify([rv.cat, rv.desc.slice(0, 40)]));
  ok(g, 'reverso: el logo cede su lugar a la ficha, el texto cabe sobre la franja y la leyenda de abajo se atenúa', rv.logo === 'none' && rv.cabe && +rv.leyenda < 0.2, JSON.stringify(rv));
  await page.keyboard.press('Enter'); await esperar(900); await page.keyboard.press('Home'); await esperar(800);

  // --- bandeja: buscar, lista, palos
  await page.getByRole('button', { name: /Buscar y elegir/i }).click(); await esperar(700);
  const t = await page.evaluate(() => ({ exp: document.getElementById('inm-opciones').getAttribute('aria-expanded'), vis: getComputedStyle(document.getElementById('bandeja')).visibility, foco: document.activeElement.id }));
  ok(g, 'el botón de la esquina abre la bandeja (buscar, lista, palos) y enfoca el buscador', t.exp === 'true' && t.vis === 'visible' && t.foco === 'buscar', JSON.stringify(t));
  await page.fill('#buscar', 'spritz'); await esperar(900);
  ok(g, 'buscar «spritz» da 2 resultados', /2 resultados/.test(await estado(page)), await estado(page));
  await page.fill('#buscar', ''); await esperar(700);
  await page.click('#abrir-lista'); await esperar(700);
  ok(g, 'lista rápida abre y muestra 8 productos', (await page.evaluate(() => document.getElementById('hoja').open && document.querySelectorAll('.br-hoja__item').length)) === 8, '');
  await page.keyboard.press('Escape'); await esperar(500);
  ok(g, 'Esc cierra primero la lista rápida (la carta sigue abierta)', await page.evaluate(() => !document.getElementById('hoja').open && document.getElementById('carta').classList.contains('br-inm')), '');
  await page.keyboard.press('Escape'); await esperar(500);
  ok(g, 'Esc cierra después la bandeja', await page.evaluate(() => document.getElementById('inm-opciones').getAttribute('aria-expanded') === 'false'), '');

  // --- salir
  await page.keyboard.press('Escape'); await esperar(1600);
  const s = await page.evaluate(() => ({ inm: document.getElementById('carta').classList.contains('br-inm'), cerrada: document.getElementById('carta').classList.contains('br-is-closed'), html: document.documentElement.classList.contains('br-inm-abierto'), inert: !!document.querySelector('[inert]'), y: Math.round(scrollY), foco: document.activeElement.id }));
  ok(g, 'Esc sale del modo inmersivo: mazo cerrado, página libre y sin elementos inertes', !s.inm && s.cerrada && !s.html && !s.inert, JSON.stringify(s));
  ok(g, 'la página queda donde estaba (± 4 px) y el foco vuelve a «Abrir la carta»', Math.abs(s.y - scrollAntes) <= 4 && s.foco === 'abrir', `${scrollAntes} → ${s.y}, foco ${s.foco}`);
  // --- botón «Atrás» del navegador / del celular: cierra la carta sin salir del sitio, y Esc no deja entradas de historial de más
  const h0 = await page.evaluate(() => history.length), u0 = page.url();
  await page.getByRole('button', { name: /Abrir la carta/i }).click(); await esperar(2400);
  const hAbierta = await page.evaluate(() => history.length);
  await page.goBack(); await esperar(1500);
  const atras = await page.evaluate(() => ({ inm: document.getElementById('carta').classList.contains('br-inm'), cerrada: document.getElementById('carta').classList.contains('br-is-closed'), html: document.documentElement.classList.contains('br-inm-abierto'), y: Math.round(scrollY) }));
  ok(g, '«Atrás» del navegador cierra la carta y se queda en el sitio (misma URL, página libre, scroll intacto)', page.url() === u0 && !atras.inm && atras.cerrada && !atras.html && Math.abs(atras.y - scrollAntes) <= 4, JSON.stringify(atras));
  ok(g, 'abrir la carta agrega a lo más una entrada de historial', hAbierta <= h0 + 1, `${h0} → ${hAbierta}`);
  await page.getByRole('button', { name: /Abrir la carta/i }).click(); await esperar(2400); await page.keyboard.press('Escape'); await esperar(1800);
  for (let k = 0; k < 3; k++) { await page.getByRole('button', { name: /Abrir la carta/i }).click(); await esperar(1800); await page.keyboard.press('Escape'); await esperar(1500); }
  ok(g, 'abrir y cerrar con Esc 3 veces no hace crecer el historial (sin entradas huérfanas)', (await page.evaluate(() => history.length)) <= hAbierta && !(await page.evaluate(() => document.getElementById('carta').classList.contains('br-inm'))), String(await page.evaluate(() => history.length)));
  ok(g, 'sin errores de JavaScript', log.errores.length === 0, log.errores.join(' | '));
  const externas = log.peticiones.filter((u) => !u.startsWith(BASE) && !u.startsWith('data:') && !MAPAS.test(u));
  ok(g, 'sin peticiones a hosts externos (salvo el mapa de Google)', externas.length === 0, externas.slice(0, 3).join(' '));
  const malas = log.fallidas.filter((f) => !/hero(-vertical)?\.mp4/.test(f));
  ok(g, 'sin peticiones fallidas (salvo el hero.mp4 ausente, advertencia conocida)', malas.length === 0, malas.slice(0, 3).join(' '));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(CAP, `inmersivo-${g}-inicio.png`) });
  await ctx.close();
}

(async () => {
  const b = await lanzar();
  await recorrido(b, 'escritorio', { width: 1440, height: 900 }, 420);
  await recorrido(b, 'movil', { width: 390, height: 844 }, 280);
  await recorrido(b, 'estrecho', { width: 320, height: 568 }, 200);

  // Entradas desde los bloques de categoría, Esc con «Qué significa», inclinación del naipe e inercia de la rueda (escritorio)
  { const g = 'categorías+gestos'; const { ctx, page, log } = await contexto(b, { viewport: { width: 1440, height: 900 } });
    await page.goto(BASE, { waitUntil: 'networkidle' }); await esperar(800);
    await page.locator('.cat__enlace[data-categoria="postres"]').scrollIntoViewIfNeeded(); await esperar(1400); await page.click('.cat__enlace[data-categoria="postres"]'); await esperar(1500);
    const px = await page.evaluate(() => { const a = document.getElementById('aviso-portal'), r = a.getBoundingClientRect(); return { inm: document.getElementById('carta').classList.contains('br-inm'), txt: a.hidden ? '' : a.textContent, visible: !a.hidden && r.top >= 0 && r.bottom <= innerHeight }; });
    ok(g, 'un bloque «Próximamente» NO abre la carta a pantalla completa y muestra el aviso visible en la página', !px.inm && /próximamente/i.test(px.txt) && px.visible, JSON.stringify(px));
    await page.locator('.cat__enlace[data-categoria="bebestibles"]').scrollIntoViewIfNeeded(); await esperar(600); await page.click('.cat__enlace[data-categoria="bebestibles"]'); await esperar(3000);
    await page.keyboard.press('ArrowRight'); await esperar(700);
    ok(g, 'entrar desde un bloque activo abre la carta con el foco en la baraja (las flechas funcionan de inmediato)', /Carta 2 de 8/.test(await estado(page)), await estado(page));
    await page.click('#rotulo-btn'); await esperar(300); await page.keyboard.press('Escape'); await esperar(800);
    ok(g, 'Esc con «Qué significa» abierto cierra solo el detalle, no la carta', await page.evaluate(() => document.getElementById('carta').classList.contains('br-inm') && document.getElementById('rotulo-detalle').hidden), '');
    await page.mouse.move(900, 300); await esperar(200); await page.mouse.move(980, 340); await esperar(600);
    const tl = await page.evaluate(() => { const a = document.querySelector('.br-card.br-is-active'); return { ry: parseFloat(a.style.getPropertyValue('--br-ry')), brilla: a.classList.contains('br-brilla') }; });
    ok(g, 'el naipe activo se inclina y brilla siguiendo el puntero', Math.abs(tl.ry) > 0.5 && tl.brilla, JSON.stringify(tl));
    await page.mouse.move(720, 450); await esperar(1200); const c0 = await estado(page);
    for (let i = 0; i < 25; i++) { await page.mouse.wheel(0, Math.max(3, Math.round(90 * Math.pow(0.88, i)))); await esperar(16); }
    await esperar(800); const c1 = await estado(page);
    const n = (x) => parseInt((x.match(/Carta (\d+)/) || [])[1], 10);
    ok(g, 'un gesto de trackpad con inercia (25 eventos decrecientes) mueve UNA carta', n(c1) - n(c0) === 1, `${c0} → ${c1}`);
    await page.mouse.wheel(0, 120); await esperar(500); await page.mouse.wheel(0, 120); await esperar(700);
    ok(g, 'dos gestos separados mueven dos cartas', n(await estado(page)) - n(c1) === 2, await estado(page));
    await page.goBack(); await esperar(1600);
    ok(g, '«Atrás» devuelve el foco a «Abrir la carta»', await page.evaluate(() => document.activeElement.id === 'abrir'), await page.evaluate(() => document.activeElement.id));
    ok(g, 'sin errores de JavaScript', log.errores.length === 0, log.errores.join(' | '));
    await ctx.close(); }

  // Movimiento reducido: también arranca cerrada y abre sin animación
  { const { ctx, page } = await contexto(b, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(BASE, { waitUntil: 'networkidle' }); await esperar(800);
    ok('reducido', 'arranca cerrada (no se abre sola) con movimiento reducido', await page.evaluate(() => document.getElementById('carta').classList.contains('br-is-closed') && !document.getElementById('carta').classList.contains('br-inm')), '');
    await page.locator('#carta').scrollIntoViewIfNeeded(); await page.getByRole('button', { name: /Abrir la carta/i }).click(); await esperar(500);
    ok('reducido', 'abre directo al modo inmersivo, sin animación', await page.evaluate(() => document.getElementById('carta').classList.contains('br-is-open') && document.getElementById('carta').classList.contains('br-inm')), '');
    await page.getByRole('button', { name: /Cerrar la carta/i }).click(); await esperar(500);
    ok('reducido', 'la X cierra la carta', await page.evaluate(() => document.getElementById('carta').classList.contains('br-is-closed') && !document.getElementById('carta').classList.contains('br-inm')), '');
    await ctx.close(); }

  // Tema oscuro opcional (?tema=oscuro), conservado en el navegador; ?tema=claro lo revierte
  { const { ctx, page, log } = await contexto(b, { viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + '?tema=oscuro', { waitUntil: 'networkidle' }); await esperar(900);
    const d = await page.evaluate(() => ({ fondo: getComputedStyle(document.body).backgroundColor, tema: document.documentElement.dataset.tema, logo: getComputedStyle(document.querySelector('h1 img')).filter }));
    ok('tema', '?tema=oscuro activa el tema oscuro original (fondo negro, logo blanco)', d.fondo === 'rgb(0, 0, 0)' && d.tema === 'oscuro' && d.logo === 'none', JSON.stringify(d));
    await page.goto(BASE + 'reservar.html', { waitUntil: 'networkidle' }); await esperar(500);
    ok('tema', 'el tema oscuro persiste en reservar.html', (await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === 'rgb(0, 0, 0)', '');
    await page.goto(BASE + '?tema=claro', { waitUntil: 'networkidle' }); await esperar(500);
    ok('tema', '?tema=claro vuelve al blanco', (await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === 'rgb(255, 255, 255)', '');
    ok('tema', 'sin errores de JavaScript', log.errores.length === 0, log.errores.join(' | '));
    await ctx.close(); }

  await b.close();
  const f = R.filter((x) => !x.ok).length;
  console.log(`\nTOTAL ${R.length} comprobaciones · ${R.length - f} OK · ${f} con falla`);
  process.exit(f ? 1 : 0);
})();
