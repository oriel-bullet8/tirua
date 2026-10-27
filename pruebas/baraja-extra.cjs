// Pruebas complementarias de la baraja integrada (sitio, 127.0.0.1:4195): reduced-motion, red, desbordamiento, tamaños, foco, ARIA, rendimiento, foto real y multi-categoría (con datos de prueba interceptados, sin tocar los archivos).
const zlib = require('zlib');
const { MAPAS, lanzar, contexto, esperar, BASE, CAP, fs, path } = require('./_lib.cjs');
const R = [];
// Los 8 bebestibles reales (nombre, precio) tal como vienen de carta-justo.json, en el orden de la baraja.
const PRODUCTOS = [['Ramajito', '$8.000'], ['Playa Tirúa', '$8.500'], ['Sol de Fuego', '$7.900'], ['Botanical Collins', '$8.200'], ['Jackie Jr.', '$7.500'], ['Espresso Vainilla', '$6.900'], ['Ramazzotti Spritz', '$6.900'], ['Green Drinks', '$5.900']];
function ok(grupo, nombre, cond, detalle) { R.push({ grupo, nombre, ok: !!cond, detalle: detalle === undefined ? '' : String(detalle) }); console.log((cond ? 'OK   ' : 'FALLA') + ' [' + grupo + '] ' + nombre + (detalle !== undefined && detalle !== '' ? ' → ' + detalle : '')); }
function nota(grupo, nombre, detalle) { R.push({ grupo, nombre, ok: true, nota: true, detalle: String(detalle) }); console.log('NOTA  [' + grupo + '] ' + nombre + ' → ' + detalle); }
const centrar = async (page, m = 110) => { await page.evaluate(m => { const e = document.querySelector('#escena'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - m, behavior: 'instant' }); }, m); await esperar(150); };
const cap = (page, n) => !process.env.CAP_DIR ? null : page.screenshot({ path: path.join(process.env.CAP_DIR || CAP, n + '.png') });

function crc32(buf) { let c, crc = ~0; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function chunk(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([l, td, c]); }
function png(w, h) { // degradado cálido→verde, colores naturales de prueba
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = 200 - Math.round(x / w * 120); raw[o + 1] = 90 + Math.round(x / w * 110); raw[o + 2] = 40 + Math.round(y / h * 60); } }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

(async () => {
  const b = await lanzar();

  /* ===== Reduced motion ===== */
  {
    const g = 'reduced-motion';
    const { ctx, page, log } = await contexto(b, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(BASE);
    const t0 = Date.now();
    await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-open'), null, { timeout: 1000 });
    ok(g, 'se muestra abierto al cargar, sin animar y sin depender del scroll', true, (Date.now() - t0) + ' ms desde la carga');
    const r = await page.evaluate(() => ({ anim: getComputedStyle(document.querySelector('#pile')).animationName, barajar: document.querySelector('#barajar').hidden, abrir: document.querySelector('#abrir').hidden, trans: getComputedStyle(document.querySelector('.br-card')).transitionDuration }));
    ok(g, 'sin animación de «respiración» ni transiciones; «Barajar de nuevo» oculto', r.anim === 'none' && r.barajar && r.abrir && /^0s/.test(r.trans), JSON.stringify(r));
    await centrar(page);
    await esperar(300);
    const antes = await page.evaluate(() => [...document.querySelectorAll('.br-card')][1].getBoundingClientRect().left);
    await page.click('#next');
    await esperar(60);
    const c = await page.evaluate(() => { const r = [...document.querySelectorAll('.br-card')][1].getBoundingClientRect(); return { cx: r.left + r.width / 2, w: innerWidth }; });
    ok(g, 'al avanzar la carta llega a su sitio de inmediato (sin inercia): centro ≈ centro de ventana a los 60 ms', Math.abs(c.cx - c.w / 2) < 3, `centro ${Math.round(c.cx)} vs ${c.w / 2}`);
    await cap(page, 'baraja-20-d1440-reduced-motion-abierto');
    await page.click('#cerrar'); await esperar(100);
    const cerr = await page.evaluate(() => ({ cerrado: document.querySelector('#carta').classList.contains('br-is-closed'), anim: getComputedStyle(document.querySelector('#pile')).animationName }));
    ok(g, '«Cerrar baraja» es instantáneo y el mazo no respira', cerr.cerrado && cerr.anim === 'none', JSON.stringify(cerr));
    await page.click('#abrir'); await esperar(100);
    ok(g, '«Abrir la baraja» abre instantáneo', await page.evaluate(() => document.querySelector('#carta').classList.contains('br-is-open')));
    ok(g, '0 errores JS', log.errores.length === 0, log.errores.join('|'));
    await ctx.close();
    const m = await contexto(b, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    await m.page.goto(BASE); await esperar(500); await centrar(m.page);
    await cap(m.page, 'baraja-21-m390-reduced-motion-abierto');
    ok(g, 'móvil: abierto sin animar', await m.page.evaluate(() => document.querySelector('#carta').classList.contains('br-is-open')));
    await m.ctx.close();
  }

  /* ===== Desbordamiento horizontal, tamaños, ARIA, foco ===== */
  for (const [w, h, touch] of [[360, 740, true], [390, 844, true], [768, 1024, true], [1280, 720, false], [1440, 900, false], [1920, 1080, false]]) {
    const g = `layout-${w}`;
    const { ctx, page, log } = await contexto(b, { viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch });
    await page.goto(BASE);
    await centrar(page); await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-open')); await esperar(1000);
    const ovf = async () => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, iw: window.innerWidth }));
    const chk = async (estado) => { const o = await ovf(); ok(g, `sin desbordamiento horizontal (${estado})`, o.sw <= o.iw && o.bw <= o.iw, `scrollWidth ${o.sw} / body ${o.bw} / ventana ${o.iw}`); };
    await chk('abierta');
    await cap(page, `baraja-30-${w}-abierto`);
    await page.click('#next'); await esperar(700); await page.click('#next'); await esperar(700); await chk('carta 3');
    await page.focus('#baraja'); await page.keyboard.press('End'); await esperar(900); await chk('último');
    await page.click('#joker-btn'); await esperar(1600); await chk('joker');
    await page.click('#joker-btn'); await esperar(700);
    await page.fill('#buscar', 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'); await esperar(900); await chk('sin resultados con texto largo');
    await cap(page, `baraja-31-${w}-sin-resultados-texto-largo`);
    await page.click('#restablecer'); await esperar(900);
    await page.click('#abrir-lista'); await esperar(300); await chk('lista rápida abierta');
    await cap(page, `baraja-32-${w}-lista-rapida`);
    await page.keyboard.press('Escape'); await esperar(200);
    await page.click('#cerrar'); await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-closed')); await esperar(300); await chk('mazo cerrado');
    await page.click('#abrir'); await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-open')); await esperar(1000);

    // Tamaños mínimos táctiles / de clic de los controles visibles
    const peq = await page.evaluate(() => [...document.querySelectorAll('#carta button, #carta input, #carta a[href], #carta [tabindex="0"]')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('[hidden]') && !e.closest('dialog:not([open])') && !e.classList.contains('saltar-enlace'); }).map(e => { const r = e.getBoundingClientRect(); return { id: e.id || e.className, w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.w < 44 || x.h < 44));
    ok(g, 'todos los controles visibles ≥44×44 px', peq.length === 0, JSON.stringify(peq));
    // Ningún control de la sección se sale de la pantalla, salvo la fila de chips, que se desplaza horizontalmente a propósito (se prueba en baraja-funcional) (el desbordamiento horizontal queda recortado por overflow:clip y no lo vería scrollWidth)
    await page.evaluate(() => document.querySelector('#joker-btn').scrollIntoView({ block: 'center', behavior: 'instant' }));
    const fuera = await page.evaluate(() => [...document.querySelectorAll('#carta button, #carta input, #carta a[href]')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('[hidden]') && !e.closest('dialog:not([open])') && !e.closest('#chips') && (r.left < -0.5 || r.right > innerWidth + 0.5); }).map(e => (e.id || e.className) + ' ' + Math.round(e.getBoundingClientRect().left) + '..' + Math.round(e.getBoundingClientRect().right)));
    ok(g, 'ningún control de la carta se sale de la pantalla (left ≥ 0, right ≤ ancho)', fuera.length === 0, JSON.stringify(fuera));
    const jb = await page.evaluate(() => { const j = document.querySelector('#joker-btn').getBoundingClientRect(), d = document.querySelector('.br-demo').getBoundingClientRect(); return j.left >= d.left - 0.5 && j.right <= d.right + 0.5; });
    ok(g, 'el botón del joker cabe dentro de su caja «Opciones de demostración»', jb);

    if (w === 390) {
      // ARIA
      const a = await page.evaluate(() => { const r = document.querySelector('#baraja'); const cs = [...document.querySelectorAll('.br-card')].filter(c => !c.hidden); return { role: r.getAttribute('role'), rd: r.getAttribute('aria-roledescription'), label: r.getAttribute('aria-label'), tab: r.tabIndex, labels: cs.map(c => c.getAttribute('aria-label')), hid: cs.map(c => c.getAttribute('aria-hidden')), live: ['#anuncio', '#estado-busqueda'].map(s => [document.querySelector(s).getAttribute('aria-live'), document.querySelector(s).getAttribute('role')]), prev: document.querySelector('#prev').getAttribute('aria-label'), next: document.querySelector('#next').getAttribute('aria-label'), chk: document.querySelector('#carta').getAttribute('aria-labelledby'), dlg: document.querySelector('#hoja').getAttribute('aria-labelledby'), lbl: document.querySelector('label[for=buscar]').textContent, rdCard: cs[0].getAttribute('aria-roledescription') }; });
      ok(g, 'región con role=region, aria-roledescription="baraja", aria-label y tabindex=0', a.role === 'region' && a.rd === 'baraja' && a.label && a.tab === 0, JSON.stringify([a.role, a.rd, a.label, a.tab]));
      ok(g, 'cada carta tiene aria-label «Carta N de M: nombre, precio»', a.labels.length === 8 && a.labels.every((l, i) => l === `Carta ${i + 1} de 8: ${PRODUCTOS[i][0]}, ${PRODUCTOS[i][1]}`), JSON.stringify(a.labels.slice(0, 2)));
      ok(g, 'solo la carta activa queda expuesta a lectores (resto aria-hidden=true)', a.hid.filter(x => x === null).length === 1 && a.hid[0] === null, JSON.stringify(a.hid));
      ok(g, 'aria-live polite en el anuncio y en el estado de búsqueda', a.live.every(l => l[0] === 'polite'), JSON.stringify(a.live));
      ok(g, 'flechas con aria-label; buscador con label visible «Buscar en la carta»', a.prev && a.next && a.lbl === 'Buscar en la carta', [a.prev, a.next, a.lbl].join(' / '));
      await page.focus('#baraja'); await page.keyboard.press('ArrowRight'); await esperar(900);
      const an = await page.locator('#anuncio').innerText();
      ok(g, 'al cambiar de carta se anuncia «Carta 2 de 8: …» en la región aria-live', /^Carta 2 de 8: Playa Tirúa, \$8\.500$/.test(an), an);
      // Foco visible 2px blanco
      await page.evaluate(() => document.activeElement.blur()); await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      const focos = [];
      for (let i = 0; i < 16; i++) { await page.keyboard.press('Tab'); focos.push(await page.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); const w = e.closest && e.closest('.br-buscador__campo'); const cw = w ? getComputedStyle(w) : null; return { id: e.id || e.className.split(' ')[0] || e.tagName, st: cs.outlineStyle, w: cs.outlineWidth, c: cs.outlineColor, wst: cw ? cw.outlineStyle : null, ww: cw ? cw.outlineWidth : null }; })); }
      const malos = focos.filter(f => f.id !== 'BODY' && f.id !== 'baraja').filter(f => !(f.st === 'solid' && f.w === '2px' && f.c === 'rgb(255, 255, 255)') && !(f.wst === 'solid' && f.ww === '2px'));
      ok(g, 'foco visible (outline 2px sólido blanco) en los 16 primeros elementos enfocables', malos.length === 0, JSON.stringify(malos));
      // La baraja abierta dibuja el foco de teclado alrededor de la carta activa (no un marco de todo el ancho)
      await page.focus('#baraja'); await page.keyboard.press('ArrowLeft');
      const fb = await page.evaluate(() => { const r = document.getElementById('baraja'); const cs = getComputedStyle(r); const f = getComputedStyle(document.querySelector('.br-card.br-is-active .br-face')); return { regionOutline: cs.outlineStyle, cartaOutline: f.outlineStyle, w: f.outlineWidth, c: f.outlineColor }; });
      ok(g, 'foco de la baraja abierta: contorno de 2 px blanco alrededor de la carta activa (la región no dibuja un marco de ancho completo)', fb.regionOutline === 'none' && fb.cartaOutline === 'solid' && fb.w === '2px' && fb.c === 'rgb(255, 255, 255)', JSON.stringify(fb));
      nota(g, 'orden de foco', focos.map(f => f.id).join(' → '));
    }
    ok(g, '0 errores JS', log.errores.length === 0, log.errores.join('|'));
    await ctx.close();
  }

  /* ===== Rendimiento (medido en Chrome headless: render por software, NO equivale a un móvil real) ===== */
  for (const [g, vp, touch] of [['perf-d1440', { width: 1440, height: 900 }, false], ['perf-m390', { width: 390, height: 844 }, true]]) {
    const { ctx, page } = await contexto(b, { viewport: vp, hasTouch: touch, isMobile: touch });
    await page.goto(BASE);
    await page.evaluate(() => { window.scrollTo({ top: document.querySelector('#escena').getBoundingClientRect().top + scrollY - 110, behavior: 'instant' }); });
    await page.evaluate(() => { window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({ entryTypes: ['longtask'] }); } catch (e) {} window.__f = []; window.__run = true; let p = performance.now(); (function t(n) { if (!window.__run) return; window.__f.push(n - p); p = n; requestAnimationFrame(t); })(p); });
    await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-open'), null, { timeout: 5000 });
    await esperar(900);
    const medidaApertura = await page.evaluate(() => { const f = window.__f.slice(); return f; });
    await page.focus('#baraja');
    for (let i = 0; i < 6; i++) { await page.keyboard.press('ArrowRight'); await esperar(180); }
    for (let i = 0; i < 6; i++) { await page.keyboard.press('ArrowLeft'); await esperar(180); }
    await esperar(800);
    const res = await page.evaluate(() => { window.__run = false; const f = window.__f.slice(1).sort((a, b) => a - b); const sum = f.reduce((a, b) => a + b, 0); return { n: f.length, fpsMedio: Math.round(f.length / sum * 1000), p50: Math.round(f[Math.floor(f.length * .5)]), p95: Math.round(f[Math.floor(f.length * .95)]), max: Math.round(f[f.length - 1]), over50: f.filter(x => x > 50).length, longtasks: window.__lt.slice(), }; });
    nota(g, 'fotogramas rAF (apertura + 12 cambios de carta, ≈6 s en total incluye reposo)', JSON.stringify(res));
    await ctx.close();
  }

  /* ===== Foto real + multi-categoría (datos de prueba interceptados) ===== */
  {
    const g = 'datos-prueba';
    const orig = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'baraja-datos.js'), 'utf8');
    // Datos de prueba interceptados (no se tocan archivos): categoría «individuales» activa con 1 producto de prueba (foto sintética HORIZONTAL 640×480 y etiqueta «frío»).
    const FIN_PRODUCTOS = "\n  ],\n\n  /*\n   * JOKER";
    ok(g, 'el archivo de datos termina los productos donde el interceptor espera', orig.split(FIN_PRODUCTOS).length === 2);
    let modif = orig
      .replace("{ id: 'individuales',  palo: 'picas',     acento: '#5ab0ff', activa: false }", "{ id: 'individuales',  palo: 'picas',     acento: '#5ab0ff', activa: true }")
      .replace(FIN_PRODUCTOS, ",\n    { id: 'ind-1', categoria: 'individuales', nombre: 'Comida de prueba única', precio: 9500, etiquetas: ['frío'], imagen: { src: 'assets/prueba/foto.png', alt: 'Foto de prueba generada', ancho: 640, alto: 480 }, descripcion: 'Producto único de la categoría de prueba.' }" + FIN_PRODUCTOS);
    ok(g, 'el interceptor sí modificó los datos de prueba', modif !== orig && /ind-1/.test(modif) && /foto\.png/.test(modif) && /activa: true/.test(modif));
    const { ctx, page, log } = await contexto(b, { viewport: { width: 1440, height: 900 } });
    await page.route('**/js/baraja-datos.js*', r => r.fulfill({ contentType: 'application/javascript', body: modif }));
    await page.route('**/assets/prueba/foto.png', r => r.fulfill({ contentType: 'image/png', body: png(640, 480) }));
    await page.goto(BASE); await centrar(page);
    await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-open')); await esperar(1200);
    const imgInfo = (n) => page.evaluate((n) => { const i = [...document.querySelectorAll('.br-card')][n].querySelector('.br-foto__img'); if (!i) return null; const cs = getComputedStyle(i); return { alt: i.alt, w: i.getAttribute('width'), h: i.getAttribute('height'), lazy: i.loading, fit: cs.objectFit, pos: cs.objectPosition, filtro: cs.filter, nat: i.naturalWidth, natH: i.naturalHeight, src: i.getAttribute('src'), placeholder: [...document.querySelectorAll('.br-card')][n].querySelector('.br-foto__rotulo') }; }, n);
    const im = await imgInfo(0), im2 = await imgInfo(1);
    ok(g, 'imagen real (As): <img> con alt, width/height de la copia, loading=eager (la carta activa/primera), object-fit: cover, sin filtros', im && im.alt === 'Ramajito, bebestible de la carta' && im.w === '722' && im.h === '1000' && im.lazy === 'eager' && im.fit === 'cover' && im.filtro === 'none', JSON.stringify(im));
    ok(g, 'imagen real (2.ª carta): loading=lazy (no se pide hasta acercarse a la baraja)', im2 && im2.lazy === 'lazy' && im2.fit === 'cover' && im2.alt === 'Playa Tirúa, bebestible de la carta', JSON.stringify(im2));
    ok(g, 'imagen real: carga (naturalWidth>0, proporción de la copia) y la carta con imagen no muestra «Foto pendiente»', im && im.nat === 722 && im.natH === 1000 && im.placeholder === null);
    await cap(page, 'baraja-40-d1440-prueba-foto-real-natural');
    const chips = await page.evaluate(() => [...document.querySelectorAll('.br-chip')].map(c => c.querySelector('.br-chip__nombre').textContent + ':' + (c.getAttribute('aria-pressed') || c.getAttribute('aria-disabled'))));
    ok(g, 'con 2 categorías activas aparece «Todo» (seleccionado) y las otras quedan «Próximamente»', chips[0] === 'Todo:true' && chips.length === 5 && /Postres:true/.test(chips.join()), chips.join(' | '));
    const todos = await page.evaluate(() => [...document.querySelectorAll('.br-card')].filter(c => !c.hidden).length);
    ok(g, 'Todo = 9 cartas (8 + 1)', todos === 9, todos);
    const acc0 = await page.evaluate(() => getComputedStyle(document.querySelector('#carta')).getPropertyValue('--br-acc').trim());
    await page.fill('#buscar', 'frio'); await esperar(900);
    const et = await page.evaluate(() => ({ n: [...document.querySelectorAll('.br-card')].filter(c => !c.hidden).length, nombre: document.querySelector('.br-card.br-is-active .br-nombre').textContent }));
    ok(g, 'busca en etiquetas (datos de prueba): «frio» encuentra la etiqueta «frío» (1)', et.n === 1 && et.nombre === 'Comida de prueba única', JSON.stringify(et));
    await page.fill('#buscar', ''); await esperar(900);
    await page.click('.br-chip[data-id="individuales"]'); await esperar(1800);
    const e1 = await page.evaluate(() => ({ cartas: [...document.querySelectorAll('.br-card')].filter(c => !c.hidden).length, contador: document.querySelector('#contador').textContent, label: document.querySelector('.br-card.br-is-active').getAttribute('aria-label'), acc: getComputedStyle(document.querySelector('#carta')).getPropertyValue('--br-acc').trim(), valor: document.querySelector('.br-card.br-is-active .br-idx__v').textContent, nombre: document.querySelector('.br-card.br-is-active .br-nombre').textContent, precio: document.querySelector('.br-card.br-is-active .br-precio').textContent, desc: document.getElementById('p-desc').textContent }));
    ok(g, 'chip de categoría con 1 solo producto: baraja de 1 carta («1 de 1»), es el As de su palo (picas) y carta, descripción y aria-label coinciden', e1.cartas === 1 && e1.contador === '1 de 1' && e1.valor === 'A' && e1.nombre === 'Comida de prueba única' && e1.precio === '$9.500' && e1.desc === 'Producto único de la categoría de prueba.' && e1.label === 'Carta 1 de 1: Comida de prueba única, $9.500', JSON.stringify(e1));
    ok(g, 'el acento ambiental cambió suavemente de categoría (corazones → picas)', acc0 !== e1.acc && /90, ?176, ?255|#5ab0ff/i.test(e1.acc), `${acc0} → ${e1.acc}`);
    await cap(page, 'baraja-41-d1440-prueba-categoria-picas-un-producto');
    await page.click('.br-chip[data-id="bebestibles"]'); await esperar(1800);
    const e2 = await page.evaluate(() => ({ acc: getComputedStyle(document.querySelector('#carta')).getPropertyValue('--br-acc').trim(), n: [...document.querySelectorAll('.br-card')].filter(c => !c.hidden).length, label: document.querySelector('.br-card.br-is-active').getAttribute('aria-label') }));
    ok(g, 'volver a Bebestibles: 8 cartas y acento de corazones', e2.n === 8 && e2.acc !== e1.acc, JSON.stringify(e2));
    await page.fill('#buscar', 'unica'); await esperar(800);
    const e3 = await page.evaluate(() => ({ n: [...document.querySelectorAll('.br-card')].filter(c => !c.hidden).length, cat: document.querySelector('.br-chip[aria-pressed=true] .br-chip__nombre').textContent }));
    ok(g, 'búsqueda respeta la categoría activa (Bebestibles no contiene «única»): 0 resultados', e3.n === 0, JSON.stringify(e3));
    ok(g, 'imagen de prueba solicitada una vez y sin hosts externos', log.peticiones.filter(u => /foto\.png/.test(u)).length >= 1 && log.peticiones.every(u => u.startsWith(BASE) || MAPAS.test(u)), '');
    ok(g, '0 errores JS', log.errores.length === 0, log.errores.join('|'));
    await ctx.close();
  }

  /* ===== Red en carga limpia y accesorios ===== */
  {
    const g = 'red';
    const { ctx, page, log } = await contexto(b, { viewport: { width: 1440, height: 900 } });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const ext = log.peticiones.filter(u => !u.startsWith(BASE) && !MAPAS.test(u));
    const fall = log.fallidas.filter(u => !/assets\/video\/hero(-vertical)?\.mp4/.test(u));
    ok(g, 'carga limpia: 0 peticiones externas, 0 fallidas (salvo el video del hero, aún no entregado)', ext.length === 0 && fall.length === 0, JSON.stringify({ ext, fallidas: fall }));
    const recursos = await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name.replace(location.origin + '/', '') + ' ' + Math.round(e.transferSize / 1024) + 'KB'));
    nota(g, 'recursos cargados', recursos.join(', '));
    const imgs = await page.evaluate(() => [...document.images].map(i => i.src.split('/').pop() + ':' + i.naturalWidth));
    ok(g, 'todas las imágenes del DOM cargaron (naturalWidth>0)', imgs.every(x => !x.endsWith(':0')), imgs.join(', '));
    const fuera = await page.evaluate(() => [...document.querySelectorAll('[src], link[href]')].map(e => e.getAttribute('src') || e.getAttribute('href')).filter(u => /^(https?:)?\/\//.test(u)));
    const fueraSinMapa = fuera.filter(u => !MAPAS.test(u)); // el iframe del mapa de Google es el único tercero permitido
    ok(g, 'ningún src ni <link href> absoluto externo en el HTML (los enlaces <a> externos son navegación del usuario, no cargan nada)', fueraSinMapa.length === 0, JSON.stringify(fuera));
    await ctx.close();
  }

  await b.close();
  fs.writeFileSync(path.join(__dirname, 'resultados', 'baraja-extra.json'), JSON.stringify(R, null, 1));
  const f = R.filter(r => !r.ok);
  console.log(`\nTOTAL ${R.length} entradas · ${f.length} con falla`);
  f.forEach(r => console.log('  FALLA', r.grupo, r.nombre, r.detalle));
})();
