// Batería de pruebas del sitio. Uso: node pruebas/prueba.cjs <sin-video|con-video|video-roto|reducido|teclado|tamanos|menu|categorias|navegacion|contenido-alterno>
// Requiere el servidor del proyecto: python3 servir.py  (BASE=http://127.0.0.1:4195/ por defecto)
const { MAPAS, lanzar, espiar, BASE, CAP } = require('./_lib.cjs');
const fs = require('fs'), path = require('path');
const out = {};
const log = (k, v) => { out[k] = v; console.log(k, JSON.stringify(v)); };
const resumenRed = (reg) => ({
  externas: reg.peticiones.filter((r) => !r.url.startsWith(BASE) && !r.url.startsWith('data:') && !MAPAS.test(r.url)).map((r) => r.url),
  peticionesHeroMp4: reg.peticiones.filter((r) => /hero\.(mp4|webm)/.test(r.url)).map((r) => r.metodo + ' ' + r.url.split('/').pop()),
  estados404: reg.respuestas.filter((r) => r.estado >= 400).map((r) => r.estado + ' ' + r.url.split('/').pop()),
  consola: reg.consola, erroresJS: reg.errores, fallidas: reg.fallidas.map((f) => f.url.split('/').pop() + ' ' + f.fallo),
});
const esperar = (p, ms) => p.waitForTimeout(ms);
async function revelarTodo(p) {
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 300) { await p.evaluate((y) => scrollTo(0, y), y); await esperar(p, 120); }
  await esperar(p, 1200); await p.evaluate(() => scrollTo(0, 0)); await esperar(p, 500);
}
async function metricas(p, w) {
  return p.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth, innerW: innerWidth, innerH: innerHeight,
    heroH: document.querySelector('.hero').getBoundingClientRect().height,
    fuente: document.fonts.check('800 20px Poppins') && document.fonts.check('300 16px Poppins'),
    cls: window.__cls || 0,
  }));
}
const clsInit = () => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); };

async function sinVideo(b) {
  for (const [w, h, n] of [[1440, 900, 'escritorio'], [390, 844, 'movil']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const reg = espiar(p); await p.addInitScript(clsInit);
    await p.goto(BASE);
    await esperar(p, 700); await p.screenshot({ path: `${CAP}/hero-${n}-entrada.png` });
    await esperar(p, 3500); await p.screenshot({ path: `${CAP}/hero-${n}-sin-video.png` });
    const video = await p.evaluate(() => { const v = document.querySelector('.hero__video'); return { src: v.currentSrc, hijos: v.children.length, op: getComputedStyle(v).opacity, botonOculto: document.querySelector('[data-pausa]').hidden }; });
    const cab0 = await p.evaluate(() => ({ fondo: getComputedStyle(document.querySelector('.cabecera__fila')).backgroundColor, avisoAlto: Math.round(document.querySelector('.aviso').getBoundingClientRect().height) }));
    await revelarTodo(p);
    await p.evaluate(() => scrollTo(0, 0)); await esperar(p, 300);
    await p.screenshot({ path: `${CAP}/pagina-${n}.png`, fullPage: true });
    await p.evaluate(() => document.querySelector('#carta').scrollIntoView({ behavior: 'instant' })); await esperar(p, 900);
    const cab1 = await p.evaluate(() => ({ fondo: getComputedStyle(document.querySelector('.cabecera__fila')).backgroundColor, avisoAlto: Math.round(document.querySelector('.aviso').getBoundingClientRect().height) }));
    for (const id of ['categorias', 'carta', 'reservas', 'mapa', 'delivery']) {
      await p.evaluate((id) => document.querySelector('#' + id).scrollIntoView({ behavior: 'instant' }), id); await esperar(p, 1000);
      await p.screenshot({ path: `${CAP}/${id === 'reservas' ? 'inicio-reservas' : id}-${n}.png` });
    }
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await esperar(p, 800);
    await p.screenshot({ path: `${CAP}/pie-${n}.png` });
    log(`sin-video ${n}`, { ...await metricas(p), video, cabeceraArriba: cab0, cabeceraScroll: cab1, red: resumenRed(reg) });
    await p.close();
  }
}

async function conVideo(b) {
  for (const [w, h, n] of [[1440, 900, 'escritorio'], [390, 844, 'movil']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const reg = espiar(p); await p.goto(BASE);
    await p.waitForFunction(() => document.querySelector('.hero').classList.contains('hay-video'), null, { timeout: 8000 }).catch(() => {});
    await esperar(p, 1800);
    const est = () => p.evaluate(() => { const v = document.querySelector('.hero__video'), b = document.querySelector('[data-pausa]'); const r = b.getBoundingClientRect(); return { hayVideo: document.querySelector('.hero').classList.contains('hay-video'), pausado: v.paused, muted: v.muted, loop: v.loop, inline: v.playsInline, t: +v.currentTime.toFixed(2), preload: v.preload, fit: getComputedStyle(v).objectFit, botonVisible: !b.hidden, boton: [Math.round(r.width), Math.round(r.height)], pressed: b.getAttribute('aria-pressed'), label: b.getAttribute('aria-label'), videoW: v.videoWidth }; });
    const e1 = await est();
    await p.screenshot({ path: `${CAP}/hero-${n}-con-video.png` });
    await p.click('[data-pausa]'); await esperar(p, 400);
    const e2 = await est(); const t2 = e2.t; await esperar(p, 700); const e2b = await est();
    await p.screenshot({ path: `${CAP}/hero-${n}-video-pausado.png` });
    await p.click('[data-pausa]'); await esperar(p, 900);
    const e3 = await est();
    // scroll fuera del hero: se pausa; al volver, se reanuda
    await p.evaluate(() => scrollTo(0, 1600)); await esperar(p, 700); const e4 = await est();
    await p.evaluate(() => scrollTo(0, 0)); await esperar(p, 900); const e5 = await est();
    log(`con-video ${n}`, { inicio: e1, trasPausa: e2, pausaSigueQuieta: e2b.t === t2, trasReanudar: e3, fueraDeHero: e4.pausado, alVolver: e5.pausado, scrollW: await p.evaluate(() => document.documentElement.scrollWidth), red: resumenRed(reg) });
    await p.close();
  }
}

async function videoRoto(b) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const reg = espiar(p); await p.goto(BASE); await esperar(p, 4000);
  const e = await p.evaluate(() => ({ hayVideo: document.querySelector('.hero').classList.contains('hay-video'), botonOculto: document.querySelector('[data-pausa]').hidden, hijos: document.querySelector('.hero__video').children.length }));
  await p.screenshot({ path: `${CAP}/hero-video-no-reproducible.png` });
  log('video-roto', { ...e, red: resumenRed(reg) }); await p.close();
}

async function reducido(b) {
  for (const [w, h, n] of [[1440, 900, 'escritorio'], [390, 844, 'movil']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); const reg = espiar(p); await p.goto(BASE); await esperar(p, 600);
    await p.screenshot({ path: `${CAP}/hero-${n}-movimiento-reducido.png` });
    const r = await p.evaluate(() => {
      const anim = document.getAnimations().filter((a) => a.playState === 'running').length;
      const v = document.querySelector('.hero__video'); const b = document.querySelector('[data-pausa]');
      const rv = [...document.querySelectorAll('.reveal')].map((e) => getComputedStyle(e).opacity);
      return { animacionesActivas: anim, videoPausado: v.paused, tVideo: v.currentTime, hayVideoClase: document.querySelector('.hero').classList.contains('hay-video'), hijos: v.children.length, botonVisible: !b.hidden, pressed: b.getAttribute('aria-pressed'), revealOpacidades: [...new Set(rv)], opLogo: getComputedStyle(document.querySelector('.logo__img')).opacity, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior };
    });
    const td = await p.evaluate(() => getComputedStyle(document.querySelector('.hero a[href="#carta"]')).transitionDuration);
    chk('reducido ' + n, 'la regla de movimiento reducido de la baraja no pisa al resto del sitio (hero conserva 0.01 ms, no 0 s)', /^(1e-05s|0\.00001s)/.test(td), td);
    let tras = null;
    if (r.botonVisible) { await p.click('[data-pausa]'); await esperar(p, 1200); tras = await p.evaluate(() => ({ pausado: document.querySelector('.hero__video').paused, pressed: document.querySelector('[data-pausa]').getAttribute('aria-pressed') })); }
    log(`reducido ${n}`, { ...r, trasPulsarBoton: tras, red: resumenRed(reg) }); await ctx.close();
  }
}

async function teclado(b) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const reg = espiar(p); await p.goto(BASE); await esperar(p, 3000);
  const orden = [];
  for (let i = 0; i < 20; i++) {
    await p.keyboard.press('Tab'); await esperar(p, 120);
    const f = await p.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { el: e.tagName.toLowerCase() + (e.getAttribute('href') ? `[${e.getAttribute('href')}]` : '') + ' ' + (e.textContent || e.getAttribute('aria-label') || e.id || '').trim().slice(0, 24), outline: cs.outlineStyle + ' ' + cs.outlineWidth, w: Math.round(r.width), h: Math.round(r.height) }; });
    orden.push(f);
    if (i === 7) await p.screenshot({ path: `${CAP}/teclado-foco-ver-carta.png` });
    if (i === 0) await p.screenshot({ path: `${CAP}/teclado-saltar.png` });
  }
  log('teclado orden', orden);
  // Enter sobre «Ver carta»
  await p.evaluate(() => scrollTo(0, 0)); await p.evaluate(() => document.querySelector('.btn--principal').focus());
  await p.keyboard.press('Enter'); await esperar(p, 1500);
  const y = await p.evaluate(() => ({ scrollY: Math.round(scrollY), cartaTop: Math.round(document.querySelector('#carta').getBoundingClientRect().top), cab: getComputedStyle(document.querySelector('.cabecera__fila')).backgroundColor }));
  // Volver arriba con teclado
  await p.evaluate(() => document.querySelector('.volver').focus()); await esperar(p, 200);
  await p.screenshot({ path: `${CAP}/teclado-foco-volver-arriba.png` });
  await p.keyboard.press('Enter'); await esperar(p, 1800);
  const arriba = await p.evaluate(() => ({ scrollY: Math.round(scrollY), foco: document.activeElement.id || document.activeElement.tagName }));
  log('teclado enter', { alVerCarta: y, trasVolverArriba: arriba, erroresJS: reg.errores });
  await p.close();
}

async function tamanos(b) {
  for (const [w, h, n] of [[390, 844, 'movil'], [1440, 900, 'escritorio'], [360, 640, 'movil-chico'], [844, 390, 'movil-horizontal']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); await p.goto(BASE); await revelarTodo(p);
    const r = await p.evaluate(() => {
      const interact = [...document.querySelectorAll('a[href], button, input, select')].filter((e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed');
      const peq = interact.map((e) => { const r = e.getBoundingClientRect(); return { el: (e.textContent || e.getAttribute('aria-label') || e.id || e.tagName).trim().slice(0, 20), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((x) => (x.w < 44 || x.h < 44) && !/Saltar/.test(x.el));
      return { avisoRecortado: document.querySelector('.aviso').scrollWidth > document.querySelector('.aviso').clientWidth, scrollW: document.documentElement.scrollWidth, innerW: innerWidth, heroH: Math.round(document.querySelector('.hero').getBoundingClientRect().height), innerH: innerHeight, mayoresQue44: interact.length - peq.length, menoresQue44: peq };
    });
    log(`tamanos ${n}`, r); await p.close();
  }
}


async function menu(b) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const reg = espiar(p); await p.goto(BASE); await esperar(p, 2500);
  const info = () => p.evaluate(() => { const bt = document.querySelector('[data-menu-boton]'); const r = bt.getBoundingClientRect(); const m = document.querySelector('[data-menu]'); const a = document.activeElement;
    return { boton: [Math.round(r.width), Math.round(r.height)], visible: getComputedStyle(bt).display !== 'none', expandido: bt.getAttribute('aria-expanded'), controla: bt.getAttribute('aria-controls'), existeControlado: !!document.getElementById(bt.getAttribute('aria-controls')), menuVisibilidad: getComputedStyle(m).visibility, mainInerte: document.getElementById('contenido').hasAttribute('inert'), pieInerte: document.querySelector('.pie').hasAttribute('inert'), scrollBloqueado: getComputedStyle(document.documentElement).overflow, foco: a.tagName.toLowerCase() + ' ' + (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 20), enlaces: [...m.querySelectorAll('a')].map((x) => x.textContent) }; });
  log('menu cerrado', await info());
  await p.screenshot({ path: `${CAP}/menu-movil-cerrado.png` });
  await p.click('[data-menu-boton]'); await esperar(p, 700);
  log('menu abierto', await info());
  await p.screenshot({ path: `${CAP}/menu-movil-abierto.png` });
  const tabs = [];
  for (let i = 0; i < 7; i++) { await p.keyboard.press('Tab'); tabs.push((await info()).foco); }
  log('menu tab (7 pulsaciones, atrapa foco)', tabs);
  await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Shift+Tab'); log('menu shift+tab', (await info()).foco);
  await p.keyboard.press('Escape'); await esperar(p, 500);
  log('menu tras Esc', await info());
  // elegir enlace cierra
  await p.click('[data-menu-boton]'); await esperar(p, 500);
  await p.click('[data-menu] a[href="#mapa"]'); await esperar(p, 1800);
  const t = await p.evaluate(() => ({ mapaTop: Math.round(document.querySelector('#mapa').getBoundingClientRect().top), cabecera: getComputedStyle(document.querySelector('.cabecera__fila')).backgroundColor }));
  log('menu elegir Mapa', { ...(await info()), ...t });
  await p.screenshot({ path: `${CAP}/menu-movil-tras-elegir-mapa.png` });
  // abrir con teclado
  await p.evaluate(() => document.querySelector('[data-menu-boton]').focus()); await p.keyboard.press('Enter'); await esperar(p, 500);
  const ab = (await info()).expandido; await p.keyboard.press('Escape'); await esperar(p, 300);
  log('menu teclado Enter abre, Esc cierra', { abre: ab, cierra: (await info()).expandido, foco: (await info()).foco });
  // cambiar a escritorio con el menú abierto
  await p.click('[data-menu-boton]'); await esperar(p, 400);
  await p.setViewportSize({ width: 1440, height: 900 }); await esperar(p, 600);
  log('menu al pasar a escritorio abierto', await info());
  await p.close();

  // escritorio
  const d = await b.newPage({ viewport: { width: 1440, height: 900 } }); await d.goto(BASE); await esperar(d, 2500);
  const de = () => d.evaluate(() => ({ botonVisible: getComputedStyle(document.querySelector('[data-menu-boton]')).display !== 'none', enlaces: [...document.querySelectorAll('[data-nav] a')].map((a) => a.textContent), todosVisibles: [...document.querySelectorAll('[data-nav] a')].every((a) => a.getBoundingClientRect().width > 0 && getComputedStyle(document.querySelector('[data-menu]')).visibility === 'visible'), avisoAlto: Math.round(document.querySelector('.aviso').getBoundingClientRect().height), avisoTexto: document.querySelector('.aviso').textContent, fondo: getComputedStyle(document.querySelector('.cabecera__fila')).backgroundColor, actual: (document.querySelector('[data-nav] [aria-current]') || {}).textContent }));
  log('cabecera escritorio arriba', await de());
  await d.screenshot({ path: `${CAP}/cabecera-escritorio-arriba.png`, clip: { x: 0, y: 0, width: 1440, height: 140 } });
  const res = {};
  for (const id of ['categorias', 'carta', 'reservas', 'mapa', 'delivery']) {
    await d.evaluate((id) => document.querySelector('#' + id).scrollIntoView({ behavior: 'instant' }), id); await esperar(d, 900);
    res[id] = { actual: (await de()).actual, avisoAlto: (await de()).avisoAlto };
  }
  log('scrollspy (sección → enlace activo)', res);
  await d.screenshot({ path: `${CAP}/cabecera-escritorio-scroll.png`, clip: { x: 0, y: 0, width: 1440, height: 140 } });
  // anclas desde el menú de escritorio
  const anclas = {};
  for (const [href, id] of [['#reservas', 'reservas'], ['#carta', 'carta'], ['#mapa', 'mapa'], ['#delivery', 'delivery'], ['#inicio', 'inicio']]) {
    await d.click(`[data-nav] a[href="${href}"]`); await esperar(d, 1700);
    anclas[href] = await d.evaluate((id) => ({ top: Math.round(document.querySelector('#' + id).getBoundingClientRect().top), scrollY: Math.round(scrollY) }), id);
  }
  log('anclas escritorio (top de la sección respecto a la ventana)', anclas);
  log('errores', { erroresJS: reg.errores, consola: reg.consola.filter((c) => c.tipo === 'error').length });
  await d.close();
}

// Comprobaciones con veredicto (no solo registro): cada una cuenta y el proceso termina con código 1 si alguna falla.
let FALLAS = 0;
const chk = (g, nombre, cond, detalle) => { if (!cond) FALLAS++; console.log((cond ? 'OK   ' : 'FALLA') + ` [${g}] ${nombre}` + (detalle !== undefined && detalle !== '' ? ' → ' + detalle : '')); };
// Distancia entre el borde inferior de la cabecera fija y el borde superior de un elemento: debe ser ≥ 0 (no tapado) y razonable (sin salto raro).
const bajoCabecera = (p, sel) => p.evaluate((sel) => { const h = document.querySelector('.cabecera').getBoundingClientRect(); const t = document.querySelector(sel).getBoundingClientRect(); return { cab: Math.round(h.bottom), top: Math.round(t.top), holgura: Math.round(t.top - h.bottom), scrollY: Math.round(scrollY) }; }, sel);

async function categorias(b) {
  for (const [w, h, n] of [[1440, 900, 'escritorio'], [390, 844, 'movil']]) {
    const g = 'categorias ' + n;
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const reg = espiar(p); await p.goto(BASE); await esperar(p, 800);
    await p.evaluate(() => { window.__ev = []; document.addEventListener('tirua:categoria', (e) => window.__ev.push(e.detail)); });
    const bl = await p.evaluate(() => [...document.querySelectorAll('.cat__enlace')].map((a) => ({ id: a.dataset.categoria, nombre: a.querySelector('.cat__nombre').textContent, palo: !!a.querySelector('.cat__palo use'), foto: (a.querySelector('.cat__rotulo') || {}).textContent, pronto: (a.querySelector('.cat__pronto') || {}).textContent || null, label: a.getAttribute('aria-label') })));
    chk(g, '4 bloques con los nombres vigentes, en orden', JSON.stringify(bl.map((x) => x.nombre)) === JSON.stringify(['Bebestibles', 'Comidas individuales', 'Postres', 'Para compartir']), bl.map((x) => x.nombre).join(' | '));
    chk(g, 'cada bloque muestra su palo y su foto (sin «Foto pendiente»)', bl.every((x) => x.palo && x.foto === undefined) && (await p.evaluate(() => [...document.querySelectorAll('.cat__enlace')].every((a) => { const i = a.querySelector('img.cat__img'); return i && /assets\/img\/.+\.webp$/.test(i.getAttribute('src')) && i.alt.length > 5; }))));
    chk(g, 'solo Bebestibles está activa; las otras 3 dicen «Próximamente»', bl[0].pronto === null && bl.slice(1).every((x) => x.pronto === 'Próximamente'), JSON.stringify(bl.map((x) => x.pronto)));
    chk(g, 'ya no quedan chips ni carrusel antiguos', (await p.evaluate(() => document.querySelectorAll('.chip, .carr, .slide, [data-carta-contenido], [data-chips]').length)) === 0);
    chk(g, 'al cargar ningún bloque está marcado como actual (el estado inicial del mazo no es una elección)', (await p.evaluate(() => document.querySelectorAll('.cat__enlace[aria-current]').length)) === 0);
    await p.evaluate(() => document.querySelector('#categorias').scrollIntoView({ behavior: 'instant' })); await esperar(p, 1200);
    await p.screenshot({ path: `${CAP}/categorias-${n}.png` });
    await p.focus('.cat__enlace[data-categoria="bebestibles"]'); await esperar(p, 700);
    await p.screenshot({ path: `${CAP}/categorias-${n}-foco.png` });
    await p.hover('.cat__enlace[data-categoria="individuales"]').catch(() => {}); await esperar(p, 800);
    await p.screenshot({ path: `${CAP}/categorias-${n}-hover.png` });
    // ---- bloque activo (Bebestibles) → carta con la categoría y la baraja abierta
    await p.click('.cat__enlace[data-categoria="bebestibles"]'); await esperar(p, 2600);
    const est = await p.evaluate(() => ({ abierta: document.querySelector('#carta').classList.contains('br-is-open'), chip: (document.querySelector('#chips [aria-pressed="true"]') || {}).dataset && document.querySelector('#chips [aria-pressed="true"]').dataset.id, actual: window.TIRUA.categoriaActual && window.TIRUA.categoriaActual.id, tile: [...document.querySelectorAll('.cat__enlace[aria-current]')].map((a) => a.dataset.categoria), hash: location.hash, contador: document.querySelector('#contador').textContent, foco: document.activeElement.dataset.id || document.activeElement.id, aviso: !document.querySelector('#aviso-cat').hidden }));
    chk(g, 'clic en «Bebestibles»: baraja abierta, chip y bloque marcados, URL #carta', est.abierta && est.chip === 'bebestibles' && est.actual === 'bebestibles' && est.tile.join() === 'bebestibles' && est.hash === '#carta' && est.contador === '1 de 8' && !est.aviso, JSON.stringify(est));
    const pos = await bajoCabecera(p, '#carta .br-herramientas');
    chk(g, 'tras el clic la cabecera fija no tapa la carta y no hay salto raro (0 ≤ holgura ≤ 40 px)', pos.holgura >= 0 && pos.holgura <= 40, JSON.stringify(pos));
    await p.screenshot({ path: `${CAP}/carta-${n}-desde-categoria-bebestibles.png` });
    // ---- bloque «Próximamente» → carta, aviso claro, baraja intacta
    await p.evaluate(() => scrollTo(0, 0)); await esperar(p, 700);
    await p.evaluate(() => document.querySelector('#categorias').scrollIntoView({ behavior: 'instant' })); await esperar(p, 500);
    await p.click('.cat__enlace[data-categoria="postres"]'); await esperar(p, 2200);
    const pr = await p.evaluate(() => ({ aviso: document.querySelector('#aviso-cat').hidden ? null : document.querySelector('#aviso-cat').textContent.trim(), abierta: document.querySelector('#carta').classList.contains('br-is-open'), contador: document.querySelector('#contador').textContent, visibles: [...document.querySelectorAll('.br-card')].filter((c) => !c.hidden).length, anuncio: document.querySelector('#anuncio').textContent, errores: 0 }));
    chk(g, 'clic en «Postres» (Próximamente): aviso visible «todavía no tiene productos», baraja abierta y sin cambios (8 cartas)', pr.aviso && /Postres: próximamente\. Todavía no tiene productos/.test(pr.aviso) && pr.abierta && pr.contador === '1 de 8' && pr.visibles === 8, JSON.stringify(pr));
    chk(g, '«Postres» no queda marcado como actual: el bloque marcado sigue siendo Bebestibles', (await p.evaluate(() => [...document.querySelectorAll('.cat__enlace[aria-current]')].map((a) => a.dataset.categoria).join())) === 'bebestibles');
    const pos2 = await bajoCabecera(p, '#carta .br-herramientas');
    chk(g, '«Postres»: cabecera sin tapar la carta (0 ≤ holgura ≤ 40 px)', pos2.holgura >= 0 && pos2.holgura <= 40, JSON.stringify(pos2));
    await p.screenshot({ path: `${CAP}/carta-${n}-desde-categoria-proximamente.png` });
    // el aviso se va al elegir una categoría activa / buscar
    await p.fill('#buscar', 'spritz'); await esperar(p, 500);
    chk(g, 'el aviso se oculta al volver a buscar/filtrar', await p.evaluate(() => document.querySelector('#aviso-cat').hidden));
    await p.fill('#buscar', ''); await esperar(p, 400);
    // ---- teclado: Enter sobre un bloque
    await p.evaluate(() => scrollTo(0, 0)); await esperar(p, 600);
    await p.focus('.cat__enlace[data-categoria="compartir"]'); await p.keyboard.press('Enter'); await esperar(p, 2200);
    const kb = await p.evaluate(() => ({ aviso: document.querySelector('#aviso-cat').hidden ? null : document.querySelector('#aviso-cat').textContent.trim(), foco: document.activeElement.dataset.id }));
    chk(g, 'Enter en «Para compartir»: aviso visible y el foco pasa a su chip', kb.aviso && /Para compartir: próximamente/.test(kb.aviso) && kb.foco === 'compartir', JSON.stringify(kb));
    chk(g, 'los bloques «Próximamente» no cambian la categoría activa (sigue Bebestibles)', await p.evaluate(() => window.TIRUA.categoriaActual.id === 'bebestibles'));
    const img = reg.peticiones.map((r) => r.url.split('/').slice(3).join('/')).filter((u) => /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(u));
    chk(g, '0 peticiones externas y 0 errores JS', resumenRed(reg).externas.length === 0 && reg.errores.length === 0, JSON.stringify({ externas: resumenRed(reg).externas, erroresJS: reg.errores }));
    log(`${g} imágenes pedidas (solo logos: las categorías no piden fotos)`, img);
    await p.close();
  }
}

// Navegación hacia la carta: menú «Carta», botón «Ver carta» del hero, «Bajar»; con la cabecera fija sin tapar nada.
async function navegacion(b) {
  for (const [w, h, n, tactil] of [[1440, 900, 'escritorio', false], [390, 844, 'movil', true], [360, 740, 'movil-360', true], [768, 1024, 'tablet', false]]) {
    const g = 'navegacion ' + n;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: tactil, isMobile: tactil });
    const p = await ctx.newPage(); const reg = espiar(p);
    await p.goto(BASE); await esperar(p, 1000);
    const abrirMenu = async () => { if (await p.locator('[data-menu-boton]').isVisible()) { await p.click('[data-menu-boton]'); await esperar(p, 500); } };
    // 1. Menú «Carta»
    await abrirMenu();
    await p.click('a[href="#carta"]:visible'); await esperar(p, 2600);
    let pos = await bajoCabecera(p, '#carta .br-encabezado h2, #carta h2');
    chk(g, 'menú «Carta»: el título de la sección queda bajo la cabecera, sin tapar (0 ≤ holgura ≤ 80 px)', pos.holgura >= 0 && pos.holgura <= 80, JSON.stringify(pos));
    const t = await p.evaluate(() => ({ titulo: document.querySelector('#carta h2').textContent.trim(), bajada: document.querySelector('#carta .seccion__bajada, #carta .br-bajada, #carta .br-encabezado p') && document.querySelector('#carta .seccion__bajada, #carta .br-bajada, #carta .br-encabezado p').textContent.trim(), rotulos: [...document.querySelectorAll('#carta .br-rotulo')].length, abierta: document.querySelector('#carta').classList.contains('br-is-open'), ovf: document.documentElement.scrollWidth - innerWidth }));
    chk(g, 'título «Carta» + bajada «Un adelanto de cómo se verá: cada plato, una carta.» + un solo rótulo de demostración', t.titulo === 'Carta' && t.bajada === 'Un adelanto de cómo se verá: cada plato, una carta.' && t.rotulos === 1, JSON.stringify(t));
    await p.screenshot({ path: `${CAP}/nav-${n}-menu-carta.png` });
    // 2. Botón «Ver carta» del hero
    await p.evaluate(() => scrollTo(0, 0)); await esperar(p, 900);
    await p.click('.hero a[href="#carta"]'); await esperar(p, 2600);
    pos = await bajoCabecera(p, '#carta h2');
    chk(g, 'hero «Ver carta»: la sección llega sin quedar tapada por la cabecera fija (0 ≤ holgura ≤ 80 px)', pos.holgura >= 0 && pos.holgura <= 80, JSON.stringify(pos));
    await p.screenshot({ path: `${CAP}/nav-${n}-hero-ver-carta.png` });
    // 3. «Bajar»
    await p.evaluate(() => scrollTo(0, 0)); await esperar(p, 900);
    const bajar = await p.evaluate(() => { const a = document.querySelector('.bajar'); return a ? a.getAttribute('href') : null; });
    await p.click('.bajar'); await esperar(p, 2600);
    const dest = bajar && bajar.slice(1);
    pos = await bajoCabecera(p, '#' + dest);
    chk(g, `«Bajar» (${bajar}) llega a su destino sin que la cabecera lo tape (0 ≤ holgura ≤ 80 px)`, pos.holgura >= 0 && pos.holgura <= 80, JSON.stringify(pos));
    // 4. Hash directo
    await p.goto(BASE + '#carta'); await esperar(p, 2600);
    pos = await bajoCabecera(p, '#carta h2');
    chk(g, 'abrir la URL con #carta no deja el título bajo la cabecera', pos.holgura >= 0 && pos.holgura <= 80, JSON.stringify(pos));
    chk(g, 'sin desbordamiento horizontal, 0 errores JS, 0 peticiones externas', (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0 && reg.errores.length === 0 && resumenRed(reg).externas.length === 0, JSON.stringify({ errores: reg.errores, ext: resumenRed(reg).externas }));
    // 4b. «Qué significa»: el detalle desplegable cabe en la pantalla
    await p.evaluate(() => document.querySelector('#rotulo-btn').scrollIntoView({ block: 'center' })); await esperar(p, 400);
    await p.click('#rotulo-btn'); await esperar(p, 300);
    const det = await p.evaluate(() => { const r = document.querySelector('#rotulo-detalle').getBoundingClientRect(); return { vis: r.width > 0, left: Math.round(r.left), right: Math.round(r.right), iw: innerWidth }; });
    chk(g, 'el detalle de «Qué significa» queda dentro de la pantalla (left ≥ 0, right ≤ ancho)', det.vis && det.left >= 0 && det.right <= det.iw, JSON.stringify(det));
    await p.screenshot({ path: `${CAP}/nav-${n}-rotulo-detalle.png` });
    await p.keyboard.press('Escape'); await esperar(p, 200);
    // 5. Enlace a la carta completa (web externa) discreto
    const en = await p.evaluate(() => { const a = document.querySelector('[data-carta-enlace]'); return a ? { href: a.getAttribute('href'), target: a.target, rel: a.rel, texto: a.textContent.trim(), nota: document.querySelector('#carta-enlace-nota').textContent.trim() } : null; });
    chk(g, 'enlace «Ver carta completa en la plataforma del bar»: nueva pestaña, noopener noreferrer, nota «abre una web externa»', en && en.target === '_blank' && /noopener/.test(en.rel) && /noreferrer/.test(en.rel) && /Ver carta completa en la plataforma del bar/.test(en.texto) && en.nota === 'abre una web externa' && /^https:\/\//.test(en.href), JSON.stringify(en));
    await ctx.close();
  }
}

// Rutas simuladas (sin tocar archivos): foto real en una categoría y logo horizontal como logo único.
async function contenidoAlterno(b) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const reg = espiar(p);
  await p.route('**/js/contenido.js*', async (route) => {
    const r = await route.fetch(); let t = await r.text();
    t = t.replace("imagen: 'assets/img/bebestibles.webp'", "imagen: 'assets/img/prueba-bebestibles.svg'").replace("imagen: 'assets/img/individuales.webp'", "imagen: null");
    t = t.replace("principal: 'assets/brand/logo-blanco-recorte.png',", "principal: 'assets/brand/logo-blanco-wordmark.png',").replace("'792 / 800'", "'767 / 202'").replace("cabecera: 'assets/brand/logo-blanco-wordmark.png',", "cabecera: null,").replace("alturaCabecera: 26", "alturaCabecera: 34");
    await route.fulfill({ response: r, body: t });
  });
  await p.route('**/assets/img/prueba-bebestibles.svg', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#b0562a"/><circle cx="200" cy="150" r="80" fill="#e9c46a"/></svg>' }));
  await p.goto(BASE); await esperar(p, 3200);
  const r = await p.evaluate(() => ({ bebestibles: (() => { const a = document.querySelector('.cat__enlace[data-categoria="bebestibles"]'); return { img: !!a.querySelector('img.cat__img'), ph: !!a.querySelector('.cat__ph'), rotulo: !!a.querySelector('.cat__rotulo') }; })(), individuales: (() => { const a = document.querySelector('.cat__enlace[data-categoria="individuales"]'); return { img: !!a.querySelector('img.cat__img'), ph: !!a.querySelector('.cat__ph'), rotulo: !!a.querySelector('.cat__rotulo') }; })(),
    logoCabecera: document.querySelector('[data-logo="cabecera"]').getAttribute('src'), logoHero: document.querySelector('[data-logo="principal"]').getAttribute('src'), altoLogo: document.querySelector('.cabecera .marca img').getBoundingClientRect().height, scrollW: document.documentElement.scrollWidth }));
  const nImg = reg.peticiones.filter((x) => /prueba-bebestibles/.test(x.url)).length;
  log('contenido alterno (foto en Bebestibles + logo horizontal único)', { ...r, imagenesPedidas: nImg, erroresJS: reg.errores });
  const g = 'contenido alterno';
  chk(g, 'Bebestibles con foto usa <img> y sin «Foto pendiente»; Comidas individuales sigue con placeholder', r.bebestibles.img && !r.bebestibles.ph && !r.bebestibles.rotulo && !r.individuales.img && r.individuales.ph && r.individuales.rotulo, JSON.stringify([r.bebestibles, r.individuales]));
  chk(g, 'la foto se pidió y no hay desbordamiento ni errores JS', nImg >= 1 && r.scrollW <= 1440 && reg.errores.length === 0, JSON.stringify({ nImg, scrollW: r.scrollW, errores: reg.errores }));
  await p.evaluate(() => document.querySelector('.cat__enlace[data-categoria="bebestibles"]').scrollIntoView({ behavior: 'instant', block: 'center' })); await esperar(p, 1200);
  await p.screenshot({ path: `${CAP}/prueba-contenido-alterno-categorias.png` });
  await p.evaluate(() => scrollTo(0, 0)); await esperar(p, 500);
  await p.screenshot({ path: `${CAP}/prueba-contenido-alterno-hero.png` });
  await p.close();
}

(async () => {
  const modo = process.argv[2]; const b = await lanzar();
  await ({ menu, categorias, navegacion, 'contenido-alterno': contenidoAlterno, 'sin-video': sinVideo, 'con-video': conVideo, 'video-roto': videoRoto, reducido, teclado, tamanos }[modo])(b);
  await b.close();
  if (FALLAS) { console.log(`\n${FALLAS} comprobaciones con falla`); process.exitCode = 1; }
})();
