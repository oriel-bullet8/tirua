// Sondeo funcional de «página casi lista» (loops/pagina-casi-lista.md): C1 errores, C2 desbordes, C3 carta (estrés),
// C4 reserva, C5 teclado/foco, C6 movimiento, C8 peso/CLS. No envía nada. Uso: node pruebas/sondeo.cjs [semilla]
// Salida: líneas OK/FALLA/AVISO + pruebas/resultados/sondeo.json. Una prueba por vez (usa un navegador propio).
const { MAPAS, lanzar, contexto, esperar, BASE, CAP, fs, path } = require('./_lib.cjs');
const SEMILLA = parseInt(process.argv[2] || '7', 10);
const R = [];
function ok(g, nombre, cond, detalle) { R.push({ g, nombre, estado: cond ? 'OK' : 'FALLA', detalle: detalle === undefined ? '' : String(detalle) }); console.log((cond ? 'OK   ' : 'FALLA') + ' [' + g + '] ' + nombre + (detalle ? ' → ' + String(detalle).slice(0, 260) : '')); }
function aviso(g, nombre, detalle) { R.push({ g, nombre, estado: 'AVISO', detalle: String(detalle) }); console.log('AVISO [' + g + '] ' + nombre + ' → ' + String(detalle).slice(0, 260)); }
let sem = SEMILLA; const azar = () => { sem = (sem * 1664525 + 1013904223) % 4294967296; return sem / 4294967296; };
const VPS = [['320x568', 320, 568], ['390x844', 390, 844], ['844x390', 844, 390], ['768x1024', 768, 1024], ['1024x768', 1024, 768], ['1280x720', 1280, 720], ['1440x900', 1440, 900], ['1920x1080', 1920, 1080]];
const MALA = (u) => /assets\/video\/hero(-vertical)?\.mp4/.test(u);

async function preparar(b, vp, tema, extra) {
  const c = await contexto(b, Object.assign({ viewport: vp }, extra || {}));
  await c.ctx.addInitScript((t) => { try { localStorage.setItem('tirua-tema', t); } catch (e) {} }, tema);
  return c;
}

async function desbordes(page) {
  return page.evaluate(() => {
    const W = document.documentElement.clientWidth, malos = [];
    const permitido = (e) => e.closest('.cinta, .reservas__anillos, .logo__anillos, .br-carta__fondo, .br-chips, .historias__lista, .br-bandeja, .br-baraja, .hero__fondo, .mapa__iframe, svg.br-carta__anillos, [data-menu], .menu__lista') || e.matches('.solo-lectores, .saltar');
    document.querySelectorAll('body *').forEach((e) => {
      const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
      const cs = getComputedStyle(e); if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') return;
      if ((r.right > W + 1 || r.left < -1) && !permitido(e)) malos.push((e.id ? '#' + e.id : e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : e.tagName) + ' [' + Math.round(r.left) + ',' + Math.round(r.right) + ']');
    });
    const cortados = [];
    document.querySelectorAll('h1,h2,h3,p,a,button,li,dt,dd,label,span').forEach((e) => {
      const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if ((cs.overflow === 'hidden' || cs.overflowX === 'hidden') && e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0 && cs.textOverflow !== 'ellipsis' && !e.closest('.cinta, .br-card, .br-hoja, .br-chips, .solo-lectores, .cat__enlace') && cs.position !== 'absolute') cortados.push((e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : e.tagName) + ' ' + (e.textContent || '').trim().slice(0, 24));
    });
    return { sw: document.documentElement.scrollWidth, W, malos: [...new Set(malos)].slice(0, 8), cortados: [...new Set(cortados)].slice(0, 6) };
  });
}

async function paginas(b) {
  for (const tema of ['claro', 'oscuro']) {
    for (const [n, w, h] of VPS) {
      if (tema === 'oscuro' && !['390x844', '1440x900'].includes(n)) continue;
      for (const pag of ['index.html', 'reservar.html']) {
        const g = `${tema}·${n}·${pag.replace('.html', '')}`;
        const { ctx, page, log } = await preparar(b, { width: w, height: h }, tema);
        await page.goto(BASE + pag, { waitUntil: 'networkidle' }); await esperar(900);
        const swInicial = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);   // antes de desplazarse: lo que aún no se reveló también cuenta
        ok(g, 'C2 sin desborde horizontal al cargar (antes de revelar nada)', swInicial <= 1, swInicial);
        const alto = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < alto; y += Math.max(300, h * 0.7)) { await page.evaluate((y) => window.scrollTo(0, y), y); await esperar(120); }
        await page.evaluate(() => window.scrollTo(0, 0)); await esperar(400);
        const d = await desbordes(page);
        ok(g, 'C1 sin errores JS ni respuestas ≥400 (salvo hero.mp4)', log.errores.length === 0 && log.fallidas.filter((f) => !MALA(f)).length === 0, [...log.errores, ...log.fallidas.filter((f) => !MALA(f))].join(' | '));
        const externas = log.peticiones.filter((u) => !u.startsWith(BASE) && !u.startsWith('data:') && !MAPAS.test(u));
        if (externas.length) ok(g, 'C1 sin hosts externos', false, externas.slice(0, 3).join(' '));
        ok(g, 'C2 sin desborde horizontal ni elementos fuera de pantalla', d.sw <= d.W + 1 && d.malos.length === 0, `sw=${d.sw} W=${d.W} ${d.malos.join(', ')}`);
        if (d.cortados.length) aviso(g, 'C2 texto posiblemente cortado', d.cortados.join(' | '));
        if (tema === 'claro' && ['390x844', '1440x900'].includes(n) && pag === 'index.html') await page.screenshot({ path: path.join(CAP, `sondeo-${n}-home.png`), fullPage: true });
        await ctx.close();
      }
    }
  }
}

async function foco(b) {
  for (const [n, w, h] of [['1440x900', 1440, 900], ['390x844', 390, 844]]) {
    for (const pag of ['index.html', 'reservar.html']) {
      const g = `foco·${n}·${pag.replace('.html', '')}`;
      const { ctx, page, log } = await preparar(b, { width: w, height: h }, 'claro');
      await page.goto(BASE + pag, { waitUntil: 'networkidle' }); await esperar(800);
      const vistos = [], sinAnillo = [], ocultos = [];
      for (let i = 0; i < 70; i++) {
        await page.keyboard.press('Tab'); await esperar(40);
        const f = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e), r = e.getBoundingClientRect(); const vis = r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
          const anillo = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none') || e.matches('.br-baraja');
          return { id: (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') + ' ' + e.tagName + ' ' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 24), vis, anillo, dentro: r.bottom > 0 && r.top < innerHeight, inert: !!e.closest('[inert]') }; });
        if (!f) continue; vistos.push(f.id); if (!f.vis || f.inert) ocultos.push(f.id); else if (!f.anillo) sinAnillo.push(f.id);
      }
      const unicos = new Set(vistos).size;
      ok(g, 'C5 el Tab recorre muchos controles distintos sin atascarse', unicos >= 12, `${unicos} distintos de ${vistos.length}`);
      ok(g, 'C5 ningún foco cae en un control oculto/inerte', ocultos.length === 0, [...new Set(ocultos)].slice(0, 5).join(', '));
      if (sinAnillo.length) aviso(g, 'C5 foco sin indicador visible (revisar)', [...new Set(sinAnillo)].slice(0, 6).join(', '));
      ok(g, 'C1 sin errores JS durante el recorrido', log.errores.length === 0, log.errores.join(' | '));
      await ctx.close();
    }
  }
}

async function estado(page) {
  return page.evaluate(() => { const c = document.getElementById('carta'), act = document.querySelectorAll('.br-card.br-is-active'), a = act[0], r = a && a.querySelector('.br-face').getBoundingClientRect();
    return { inm: c.classList.contains('br-inm'), cerrada: c.classList.contains('br-is-closed'), abierta: c.classList.contains('br-is-open'), html: document.documentElement.classList.contains('br-inm-abierto'), activas: act.length,
      anuncio: (document.getElementById('anuncio') || {}).textContent, contador: (document.getElementById('contador') || {}).textContent, inert: document.querySelectorAll('[inert]').length, espaciadores: [...document.querySelectorAll('#carta ~ div[aria-hidden], main > div[aria-hidden][style*=height]')].length,
      dentro: r ? (r.left >= -2 && r.right <= innerWidth + 2 && r.top >= -2 && r.bottom <= innerHeight + 2) : null, tray: c.classList.contains('br-bandeja-abierta'), dlg: document.getElementById('hoja').open, y: Math.round(scrollY) }; });
}

async function estres(b, nombre, vp, pasos) {
  const g = `C3·${nombre}`;
  const { ctx, page, log } = await preparar(b, vp, 'claro');
  await page.goto(BASE, { waitUntil: 'networkidle' }); await esperar(800);
  await page.locator('#carta').scrollIntoViewIfNeeded(); await esperar(600);
  const y0 = (await estado(page)).y;
  const acciones = [
    ['abrir', async () => { const e = await estado(page); if (e.cerrada) await page.click('#abrir'); }],
    ['derecha', () => page.keyboard.press('ArrowRight')], ['izquierda', () => page.keyboard.press('ArrowLeft')], ['inicio', () => page.keyboard.press('Home')], ['fin', () => page.keyboard.press('End')],
    ['voltear', () => page.keyboard.press('Enter')], ['rueda+', () => page.mouse.wheel(0, 120)], ['rueda-', () => page.mouse.wheel(-140, 0)],
    ['arrastre', async () => { const y = vp.height * 0.45; await page.mouse.move(vp.width * 0.7, y); await page.mouse.down(); await page.mouse.move(vp.width * (0.2 + azar() * 0.2), y, { steps: 5 }); await page.mouse.up(); }],
    ['flecha-next', async () => { const e = page.locator('#next'); if (await e.isVisible()) await e.click({ timeout: 800 }).catch(() => {}); }],
    ['flecha-prev', async () => { const e = page.locator('#prev'); if (await e.isVisible()) await e.click({ timeout: 800 }).catch(() => {}); }],
    ['bandeja', async () => { const e = page.locator('#inm-opciones'); if (await e.isVisible()) await e.click({ timeout: 800 }).catch(() => {}); }],
    ['buscar', async () => { if (await page.locator('#buscar').isVisible()) await page.fill('#buscar', ['spritz', 'ron', 'xyz', 'a', ''][Math.floor(azar() * 5)]); }],
    ['lista', async () => { if (await page.locator('#abrir-lista').isVisible()) await page.click('#abrir-lista', { timeout: 800 }).catch(() => {}); }],
    ['joker', async () => { if (await page.locator('#joker-btn').isVisible()) await page.click('#joker-btn', { timeout: 800 }).catch(() => {}); }],
    ['esc', () => page.keyboard.press('Escape')], ['esc', () => page.keyboard.press('Escape')],
    ['cerrar-x', async () => { const e = page.locator('#inm-cerrar'); if (await e.isVisible()) await e.click({ timeout: 800 }).catch(() => {}); }],
    ['redimensionar', async () => { const [w, h] = [[vp.width, vp.height], [Math.round(vp.height), Math.round(vp.width)], [Math.round(vp.width * 0.9), Math.round(vp.height * 0.9)]][Math.floor(azar() * 3)]; await page.setViewportSize({ width: Math.max(300, w), height: Math.max(300, h) }); }],
    ['esperar', () => esperar(150 + Math.floor(azar() * 500))],
  ];
  const inconsistencias = [], visto = { inm: 0, tray: 0, dlg: 0, flip: 0, cierres: 0 }; let ultimo = '', estabaInm = false;
  for (let i = 0; i < pasos; i++) {
    const cerradaAhora = await page.evaluate(() => document.getElementById('carta').classList.contains('br-is-closed'));
    const a = (cerradaAhora && azar() < 0.8) ? acciones[0] : acciones[Math.floor(azar() * acciones.length)]; ultimo = a[0];
    await a[1]().catch(() => {}); await esperar(60);
    if (i % 3 === 0 || ['esc', 'cerrar-x', 'redimensionar'].includes(a[0])) {
      await esperar(260); const e = await estado(page); if (e.inm) visto.inm++; if (e.tray) visto.tray++; if (e.dlg) visto.dlg++; if (estabaInm && !e.inm) visto.cierres++; estabaInm = e.inm;
      if (e.activas > 1) inconsistencias.push(`${i} ${a[0]}: ${e.activas} cartas activas`);
      if (e.inm && !e.html) inconsistencias.push(`${i} ${a[0]}: modo inmersivo sin bloqueo de scroll`);
      if (!e.inm && e.html) inconsistencias.push(`${i} ${a[0]}: scroll bloqueado sin modo inmersivo`);
      if (!e.inm && e.inert) inconsistencias.push(`${i} ${a[0]}: elementos inertes fuera del modo inmersivo`);
      if (e.inm && e.abierta && e.dentro === false && !e.tray) {   // puede ser una transición en curso (bandeja que se cierra, reacomodo tras redimensionar): se reconfirma tras 900 ms
        await esperar(900); const e2 = await estado(page);
        if (e2.inm && e2.abierta && e2.dentro === false && !e2.tray) inconsistencias.push(`${i} ${a[0]}: carta activa fuera de pantalla (persiste)`);
      }
    }
  }
  // volver a un estado limpio y comprobar la página
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Escape'); await esperar(150); }
  await page.setViewportSize(vp); await esperar(1500);
  let e = await estado(page);
  if (e.inm) { await page.click('#inm-cerrar').catch(() => {}); await esperar(1500); e = await estado(page); }
  ok(g, `C3 ${pasos} acciones aleatorias (semilla ${SEMILLA}) sin errores JS`, log.errores.length === 0, log.errores.slice(0, 3).join(' | '));
  ok(g, 'C3 el estrés realmente abrió/cerró la carta, la bandeja y la lista (cobertura)', visto.inm >= 5 && visto.cierres >= 1, JSON.stringify(visto));
  ok(g, 'C3 estado consistente durante el estrés', inconsistencias.length === 0, inconsistencias.slice(0, 5).join(' ; '));
  ok(g, 'C3 al terminar: carta cerrada, página libre, sin inertes ni espaciadores huérfanos', !e.inm && !e.html && e.inert === 0 && e.cerrada, JSON.stringify(e));
  const sp = await page.evaluate(() => document.querySelectorAll('main > div[aria-hidden="true"][style*="height"]').length);
  ok(g, 'C3 no quedan espaciadores huérfanos', sp === 0, sp);
  await ctx.close();
}

async function reservasInterno(b, g) {
  const { ctx, page, log } = await preparar(b, { width: 1440, height: 900 }, 'claro');
  await page.addInitScript(() => { window.__abiertas = []; window.open = (u) => { window.__abiertas.push(String(u)); return null; }; });
  await page.goto(BASE + 'reservar.html', { waitUntil: 'networkidle' }); await esperar(700);
  const abiertas = () => page.evaluate(() => [...document.querySelectorAll('.etapa--abierta')].map((e) => e.dataset.etapa).join());
  const tes = await page.evaluate(() => [...document.querySelectorAll('.tesela')].map((t) => t.textContent.trim() + '|' + t.getAttribute('aria-label')));
  ok(g, 'C4 7 teselas con solo número y etiqueta accesible', tes.length === 7 && tes.every((t) => /^\d\+?\|/.test(t)), tes.join(' '));
  // personas 7+ avisa y abre la fecha
  await page.getByRole('button', { name: /7 o más/ }).click(); await esperar(1100);
  ok(g, 'C4 «7+» abre la fecha y el mensaje avisa que el bar lo coordina', (await abiertas()) === 'fecha' && /7 o más personas/.test(await page.evaluate(() => document.querySelector('.vista').innerText)), await abiertas());
  // hoy: se puede elegir mientras queden horas
  const tarde = (() => { const d = new Date(); return d.getDay() <= 1 || d.getHours() * 60 + d.getMinutes() >= 22 * 60 + 30; })();   // domingo y lunes: sin atención
  const hoyOff = await page.evaluate(() => { const b = [...document.querySelectorAll('.dia')].find((x) => /hoy/i.test(x.getAttribute('aria-label') || '')); return b ? (b.disabled || b.getAttribute('aria-disabled') === 'true') : null; });
  ok(g, 'C4 «hoy» no se puede elegir cuando ya pasó la última hora (y sí antes)', hoyOff === tarde || hoyOff === null, `deshabilitado=${hoyOff} tarde=${tarde}`);
  const hoy = await page.evaluate(() => { const b = [...document.querySelectorAll('.dia')].find((x) => /hoy/i.test(x.getAttribute('aria-label') || '') && x.getAttribute('aria-disabled') !== 'true'); return b ? b.getAttribute('aria-label') : null; });
  if (hoy) { await page.getByRole('button', { name: hoy }).click(); await esperar(1100); const horas = await page.evaluate(() => [...document.querySelectorAll('.hora')].map((h) => ({ t: h.textContent.trim(), off: h.getAttribute('aria-disabled') === 'true' }))); aviso(g, 'C4 horas de hoy (informativo)', horas.map((h) => h.t + (h.off ? '✗' : '')).join(' ')); }
  // fecha lejana + hora + datos
  await page.getByRole('button', { name: /^viernes 30 de octubre de 2026/ }).click().catch(async () => { await page.click('[data-etapa=fecha] .etapa__btn'); await esperar(600); await page.getByRole('button', { name: /^viernes 30 de octubre de 2026/ }).click(); });
  await esperar(1100);
  await page.getByRole('button', { name: '21:00' }).first().click(); await esperar(1100);
  ok(g, 'C4 tras elegir hora se abre «Tus datos» y el envío sigue deshabilitado sin nombre', (await abiertas()) === 'datos' && (await page.getAttribute('[data-clave=whatsapp]', 'aria-disabled')) === 'true', await abiertas());
  const largo = 'Alergia a los frutos secos. '.repeat(30);
  await page.getByRole('textbox', { name: 'Nombre' }).fill('Pablo Prueba (no enviar)');
  await page.getByRole('textbox', { name: /Comentarios/ }).fill(largo); await esperar(300);
  const m = await page.evaluate(() => { const msg = document.getElementById('mensaje-solicitud'), wa = document.querySelector('[data-clave=whatsapp]'); return { msg: msg && msg.textContent, href: wa && wa.getAttribute('href'), sw: document.documentElement.scrollWidth, W: document.documentElement.clientWidth }; });
  let decod = ''; try { decod = new URL(m.href).searchParams.get('text'); } catch (e) {}
  ok(g, 'C4 el enlace wa.me lleva exactamente el mensaje mostrado (también con comentario largo)', m.msg && decod === m.msg && m.msg.length > 300, `${(m.msg || '').length} car. (el comentario se recorta a propósito)`);
  ok(g, 'C4 sin desborde con el mensaje largo', m.sw <= m.W + 1, `${m.sw}/${m.W}`);
  ok(g, 'C4 nada se envió ni se abrió (la prueba no pulsa WhatsApp)', (await page.evaluate(() => window.__abiertas.length)) === 0, '');
  ok(g, 'C1 sin errores JS en el flujo de reserva', log.errores.length === 0, log.errores.join(' | '));
  await ctx.close();
}

async function reservas(b) {
  const g = 'C4·reserva';
  try { await reservasInterno(b, g); } catch (e) { ok(g, 'C4 el flujo de reserva se recorre completo', false, String(e.message).split('\n').slice(0, 6).join(' / ')); }
}

async function movimiento(b) {
  const g = 'C6·movimiento';
  {
    const { ctx, page } = await preparar(b, { width: 1440, height: 900 }, 'claro', { reducedMotion: 'reduce' });
    await page.goto(BASE, { waitUntil: 'networkidle' }); await esperar(2500);
    const n = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations === Infinity).map((a) => (a.effect.target && (a.effect.target.className || a.effect.target.tagName)) + ':' + (a.animationName || a.transitionProperty || '')).slice(0, 6));
    ok(g, 'C6 con movimiento reducido no corre ninguna animación infinita', n.length === 0, n.join(' | '));
    await ctx.close();
  }
  {
    const { ctx, page } = await preparar(b, { width: 1440, height: 900 }, 'claro');
    await page.goto(BASE, { waitUntil: 'networkidle' }); await esperar(1500);
    const cls = await page.evaluate(() => new Promise((res) => { let s = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) s += e.value; }).observe({ type: 'layout-shift', buffered: true }); setTimeout(() => res(s), 1200); }));
    ok(g, 'C8 CLS de la carga < 0,1', cls < 0.1, cls.toFixed(3));
    const infinitas = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations === Infinity).length);
    aviso('C8·trabajo continuo', 'animaciones infinitas activas en el hero (informativo)', infinitas);
    const peso = await page.evaluate(() => performance.getEntriesByType('resource').reduce((a, r) => a + r.encodedBodySize, 0) + performance.getEntriesByType('navigation')[0].encodedBodySize);
    aviso('C8·peso', 'peso de la home sin video (bytes de cuerpo)', `${Math.round(peso / 1024)} KB`);
    await ctx.close();
  }
}

(async () => {
  const b = await lanzar();
  const t0 = Date.now();
  const SOLO = (process.env.SOLO || 'paginas,foco,estres,reservas,movimiento').split(',');   // SOLO=reservas para repetir un bloque
  if (SOLO.includes('paginas')) await paginas(b);
  if (SOLO.includes('foco')) await foco(b);
  if (SOLO.includes('estres')) {
    await estres(b, 'escritorio', { width: 1440, height: 900 }, 90);
    await estres(b, 'movil', { width: 390, height: 844 }, 90);
    await estres(b, 'apaisado', { width: 844, height: 390 }, 70);
  }
  if (SOLO.includes('reservas')) await reservas(b);
  if (SOLO.includes('movimiento')) await movimiento(b);
  await b.close();
  fs.mkdirSync(path.join(__dirname, 'resultados'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'resultados', 'sondeo.json'), JSON.stringify(R, null, 1));
  const f = R.filter((x) => x.estado === 'FALLA'), a = R.filter((x) => x.estado === 'AVISO');
  console.log(`\nTOTAL ${R.length} entradas · ${R.length - f.length - a.length} OK · ${a.length} avisos · ${f.length} con falla · ${Math.round((Date.now() - t0) / 1000)} s`);
  process.exit(f.length ? 1 : 0);
})();
