// Pruebas del asistente simplificado (reservar.html). Uso: node pruebas/reservas.cjs <flujo|enlaces|domingo-lunes|dias-cerrados|copiar-fallo|sietemas|teclado|reducido|hoy|instagram-ausente|estados|inicio>
// Requiere un servidor en el puerto 4196 (ver README).
const { lanzar, espiar, BASE, CAP } = require('./_lib.cjs');
const out = {};
const log = (k, v) => { out[k] = v; console.log(k, JSON.stringify(v)); };
const esp = (p, ms) => p.waitForTimeout(ms);
const URL = BASE + 'reservar.html';
// Desde la elección de hora la página pasa al paso «Tus datos»: se completa el nombre (único campo obligatorio) y se continúa a la solicitud.
async function completarDatos(p) { await p.waitForSelector('#campo-nombre'); await p.fill('#campo-nombre', 'Pablo'); await p.click('[data-clave="continuar"]'); await p.waitForSelector('.mensaje-ig'); }
const tam = [[390, 844, 'movil'], [1440, 900, 'escritorio']];
// Bloquea la navegación saliente (no se abre Instagram, Maps ni Justo) y registra lo que se intentó abrir.
function bloquearExterno(ctx, registro) {
  return ctx.route(/^https:\/\/(www\.instagram\.com|www\.google\.com|cuenta\.getjusto\.com)\//, (r) => { registro.push(r.request().url()); r.abort(); });
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function sumar(iso, n) { const [y, m, d] = iso.split('-').map(Number); const f = new Date(y, m - 1, d, 12); f.setDate(f.getDate() + n); return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`; }
function larga(iso) { const [y, m, d] = iso.split('-').map(Number); const f = new Date(y, m - 1, d, 12); return `${DIAS[f.getDay()]} ${d} de ${MESES[m - 1]} de ${y}`; }
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

async function titulo(p) { return p.evaluate(() => (document.querySelector('[data-foco-titulo]') || {}).textContent); }
async function pasos(p) { return p.evaluate(() => [...document.querySelectorAll('.paso__btn')].map((b) => ({ e: b.dataset.etapa, label: b.getAttribute('aria-label'), actual: b.getAttribute('aria-current'), off: b.disabled }))); }
async function chicos(p) {
  return p.evaluate(() => [...document.querySelectorAll('main a[href], main button, main input, header a, header button')].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').map((e) => { const r = e.getBoundingClientRect(); return { el: (e.getAttribute('data-clave') || e.className || e.tagName).toString().slice(0, 22), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((x) => x.w < 44 || x.h < 44));
}
async function overflow(p) { return p.evaluate(() => document.documentElement.scrollWidth - innerWidth); }
async function irAFecha(p, iso) { for (let i = 0; i < 5 && !(await p.$(`[data-fecha="${iso}"]`)); i++) { await p.click('[data-clave="mes-sig"]'); await esp(p, 100); } }
async function red(p, reg, desde = 0) {
  return { peticionesNoGet: reg.peticiones.filter((r) => r.metodo !== 'GET').length, externas: reg.peticiones.filter((r) => !r.url.startsWith(BASE) && !r.url.startsWith('data:')).map((r) => r.url), nuevasDesde: reg.peticiones.slice(desde).map((r) => r.metodo + ' ' + r.url.replace(BASE, '')), localStorage: await p.evaluate(() => localStorage.length), sessionStorage: await p.evaluate(() => sessionStorage.length), cookies: await p.evaluate(() => document.cookie) };
}
async function aSolicitud(p, pers = 4, dias = 3, hora = '20:30') {
  await p.goto(URL); await p.waitForSelector('.tesela');
  await p.click(`[data-clave="p-${pers}"]`); await p.waitForSelector('.cal__tabla'); await esp(p, 100);
  const f = sumar(hoy(), dias); await irAFecha(p, f); await p.click(`[data-fecha="${f}"]`); await p.click('[data-clave=continuar]');
  await p.waitForSelector('.hora'); await p.click(`[data-clave="h-${hora}"]`); await completarDatos(p); await esp(p, 200);
  return f;
}

async function flujo(b) {
  for (const [w, h, n] of tam) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, permissions: ['clipboard-read', 'clipboard-write'] });
    const bloqueadas = []; await bloquearExterno(ctx, bloqueadas);
    const p = await ctx.newPage(); const reg = espiar(p);
    await p.goto(URL); await p.waitForSelector('.tesela'); await esp(p, 500);
    const peticionesIniciales = reg.peticiones.length;
    log(`flujo ${n} inicio`, { titulo: await titulo(p), rotulo: await p.textContent('[data-rsv-muestra]'), rotuloVisible: await p.isVisible('[data-rsv-muestra]'), teselas: await p.$$eval('.tesela', (t) => t.length), pasos: await pasos(p), listaOl: await p.$eval('[data-pasos]', (e) => e.tagName), desborde: await overflow(p) });
    await p.screenshot({ path: `${CAP}/reservas-paso-1-${n}.png` });
    const t0 = Date.now(); await p.click('[data-clave=p-4]'); await esp(p, 120);
    const antes = await titulo(p); const marcada = await p.$eval('[data-clave=p-4]', (x) => x.getAttribute('aria-pressed'));
    await p.waitForSelector('.cal__tabla'); const ms = Date.now() - t0; await esp(p, 300);
    log(`flujo ${n} auto-avance personas`, { tituloAntes: antes, marcadaAntesDeAvanzar: marcada, tituloAhora: await titulo(p), ms, pasos: await pasos(p) });
    // calendario
    const cal = await p.evaluate(() => { const hoy = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(); const dias = [...document.querySelectorAll('.dia')];
      return { meses: document.querySelectorAll('.cal__tabla').length, dias: dias.length, hoy: dias.filter((d) => d.getAttribute('aria-current') === 'date').map((d) => d.dataset.fecha), hoyMarcado: dias.filter((d) => d.classList.contains('dia--hoy')).length,
        pasadosDeshabilitados: dias.filter((d) => d.dataset.fecha < hoy).every((d) => d.getAttribute('aria-disabled') === 'true' && /fecha pasada/.test(d.getAttribute('aria-label'))), pasados: dias.filter((d) => d.dataset.fecha < hoy).length,
        habilitadosDesdeHoy: dias.filter((d) => d.dataset.fecha >= hoy).every((d) => !d.getAttribute('aria-disabled')), tabindex0: dias.filter((d) => d.tabIndex === 0).length, roles: [document.querySelector('.cal__tabla').getAttribute('role'), document.querySelector('.dia').parentElement.getAttribute('role')],
        etiquetasConDisponibilidad: dias.filter((d) => /disponible|cerrado|agotado|completo|cupo/i.test(d.getAttribute('aria-label')) && !/no se puede elegir/.test(d.getAttribute('aria-label'))).length,
        leyenda: [...document.querySelectorAll('.leyenda__item')].map((l) => l.textContent.replace(/^12/, '')), nota: document.querySelector('.rsv__pista').textContent, ejemplo: dias.find((d) => d.getAttribute('aria-current') === 'date').getAttribute('aria-label'), prevDeshabilitado: document.querySelector('[data-clave=mes-prev]').getAttribute('aria-disabled') }; });
    log(`flujo ${n} calendario`, cal);
    await p.screenshot({ path: `${CAP}/reservas-paso-2-${n}.png` });
    // rango de 90 días
    const lim = sumar(hoy(), 90);
    for (let i = 0; i < 5; i++) { const sig = await p.getAttribute('[data-clave=mes-sig]', 'aria-disabled'); if (sig) break; await p.click('[data-clave=mes-sig]'); await esp(p, 80); }
    const rango = await p.evaluate((lim) => { const dias = [...document.querySelectorAll('.dia')]; const hab = dias.filter((d) => !d.getAttribute('aria-disabled')).map((d) => d.dataset.fecha); return { ultimoHabilitado: hab[hab.length - 1], limiteEsperado: lim, primeroFueraDeRango: dias.find((d) => d.dataset.fecha > lim && d.getAttribute('aria-disabled')).getAttribute('aria-label'), sigDeshabilitado: document.querySelector('[data-clave=mes-sig]').getAttribute('aria-disabled') }; }, lim);
    log(`flujo ${n} rango de ~90 días`, rango);
    while (!(await p.getAttribute('[data-clave=mes-prev]', 'aria-disabled'))) { await p.click('[data-clave=mes-prev]'); await esp(p, 60); }
    // día pasado: no seleccionable
    const ayer = sumar(hoy(), -1); const pasadoVisible = await p.$(`[data-fecha="${ayer}"]`);
    if (pasadoVisible) { await p.click(`[data-fecha="${ayer}"]`, { force: true }); await esp(p, 200); }
    log(`flujo ${n} fecha pasada`, await p.evaluate(() => ({ elegidos: document.querySelectorAll('.dia--sel').length, mensaje: (document.querySelector('.rsv__mensaje') || {}).textContent, continuar: document.querySelector('[data-clave=continuar]').getAttribute('aria-disabled'), nota: (document.getElementById('nota-cta') || {}).textContent, describe: document.querySelector('[data-clave=continuar]').getAttribute('aria-describedby') })));
    await p.screenshot({ path: `${CAP}/reservas-fecha-pasada-${n}.png` });
    const f = sumar(hoy(), 3); await irAFecha(p, f); await p.click(`[data-fecha="${f}"]`); await esp(p, 700);
    log(`flujo ${n} fecha elegida (no avanza sola)`, { titulo: await titulo(p), pasos: (await pasos(p))[1].label, continuar: await p.getAttribute('[data-clave=continuar]', 'aria-disabled') });
    await p.click('[data-clave=continuar]'); await p.waitForSelector('.hora'); await esp(p, 400);
    const horas = await p.evaluate(() => ({ titulo: document.querySelector('[data-foco-titulo]').textContent, rotulo: document.querySelector('.rsv__rotulo').textContent, horas: [...document.querySelectorAll('.hora')].map((h) => h.textContent), conEstado: document.body.innerText.match(/agotad|pocas mesas|disponible/gi), nota: document.querySelector('.rsv__pista').textContent }));
    log(`flujo ${n} horas`, horas);
    await p.screenshot({ path: `${CAP}/reservas-paso-3-${n}.png` });
    const t1 = Date.now(); await p.click('[data-clave="h-20:30"]'); await esp(p, 120);
    const aun = { titulo: await titulo(p), marcada: await p.$eval('[data-clave="h-20:30"]', (x) => x.getAttribute('aria-pressed')) };
    await completarDatos(p); const ms2 = Date.now() - t1; await esp(p, 300);
    log(`flujo ${n} auto-avance hora`, { ...aun, tituloAhora: await titulo(p), ms: ms2 });
    // solicitud
    const esperado = `Hola, quisiera reservar para 4 personas el ${larga(f)} a las 20:30. ¿Me confirman disponibilidad?`;
    const sol = await p.evaluate(() => ({ aviso: document.getElementById('aviso-solicitud').textContent, filas: [...document.querySelectorAll('.lista-datos > div')].map((d) => d.textContent), mensaje: document.getElementById('mensaje-solicitud').textContent, pasos: [...document.querySelectorAll('.paso__btn')].map((b) => b.getAttribute('aria-label') + (b.disabled ? ' [off]' : '') + (b.getAttribute('aria-current') ? ' [current]' : '')) }));
    const AVISO = 'Esto es una solicitud, no una reserva confirmada. El bar confirmará la disponibilidad a mano, por WhatsApp.';
    log(`flujo ${n} solicitud`, { ...sol, mensajeCoincide: sol.mensaje === esperado, avisoExacto: sol.aviso === AVISO, avisoEnRegionLive: (await p.textContent('[data-estado]')).includes(AVISO), esperado });
    log(`flujo ${n} orden visual de las acciones`, await p.evaluate(() => { const r = (c) => { const b = document.querySelector(`[data-clave=${c}]`) || document.querySelector('.atras'); const x = b.getBoundingClientRect(); return { top: Math.round(x.top), left: Math.round(x.left) }; }; const a = document.querySelector('.rsv__pantalla--solicitud .atras').getBoundingClientRect(); return { whatsapp: r('whatsapp'), copiar: r('copiar'), instagram: r('instagram'), atras: { top: Math.round(a.top), left: Math.round(a.left) } }; }));
    const indic = await p.evaluate(() => { const i = document.getElementById('indicacion-copiar'); const c = document.querySelector('[data-clave=copiar]').getBoundingClientRect(); const a = document.querySelector('[data-clave=instagram]').getBoundingClientRect(); const r = i.getBoundingClientRect(); return { texto: i.textContent, sobreLosBotones: r.bottom <= Math.min(c.top, a.top) + 1, cerca: Math.round(Math.min(c.top, a.top) - r.bottom) }; });
    const ig = await p.evaluate(() => { const b = document.querySelector('[data-clave=instagram]'); return { tag: b.tagName, texto: b.textContent.trim(), href: b.getAttribute('href'), target: b.getAttribute('target'), rel: b.getAttribute('rel'), ariaLabel: b.getAttribute('aria-label'), deshabilitado: b.getAttribute('aria-disabled'), describe: document.getElementById(b.getAttribute('aria-describedby')).textContent, rotuloArribaOculto: !document.querySelector('[data-rsv-muestra]').getClientRects().length, textoPendiente: /Pendiente: falta/.test(document.body.innerText) }; });
    log(`flujo ${n} indicación y botón «Abrir Instagram»`, { indicacion: indic, instagram: ig });
    await p.evaluate(() => document.querySelector('[data-clave=instagram]').scrollIntoView({ block: 'center' }));
    await p.screenshot({ path: `${CAP}/reservas-solicitud-instagram-activo-${n}.png` });
    // «Abrir Instagram» NO toca el portapapeles
    await p.evaluate(() => navigator.clipboard.writeText('SENTINELA-DEL-USUARIO'));
    const urlAntes = p.url(); const [popup] = await Promise.all([p.waitForEvent('popup', { timeout: 3000 }).catch(() => null), p.click('[data-clave=instagram]')]); await esp(p, 400);
    const clipTras = await p.evaluate(() => navigator.clipboard.readText());
    log(`flujo ${n} Abrir Instagram no modifica el portapapeles`, { portapapelesIntacto: clipTras === 'SENTINELA-DEL-USUARIO', pestañaNueva: !!popup, peticionesBloqueadas: bloqueadas, paginaIgual: p.url() === urlAntes, avisoDeCopiado: await p.textContent('.rsv__copia') });
    if (popup) await popup.close().catch(() => {});
    await p.evaluate(() => document.querySelector('.mensaje-ig').scrollIntoView({ block: 'center' }));
    await p.click('[data-clave=copiar]'); await esp(p, 400);
    const portapapeles = await p.evaluate(() => navigator.clipboard.readText());
    log(`flujo ${n} copiar mensaje (solo con el botón)`, { copiado: portapapeles === esperado, visible: await p.textContent('.rsv__copia'), live: await p.textContent('[data-estado]') });
    await p.screenshot({ path: `${CAP}/reservas-solicitud-copiado-${n}.png` });
    // atrás conserva
    await p.click('.atras'); await p.waitForSelector('#campo-nombre'); await esp(p, 200); // solicitud → «Tus datos» (conserva el nombre)
    await p.click('.atras'); await p.waitForSelector('.hora'); await esp(p, 300);
    const enHora = await p.evaluate(() => ({ titulo: document.querySelector('[data-foco-titulo]').textContent, horaElegida: [...document.querySelectorAll('.hora[aria-pressed=true]')].map((x) => x.textContent) }));
    await p.click('.atras'); await p.waitForSelector('.cal__tabla'); await esp(p, 300);
    const enFecha = await p.evaluate(() => ({ titulo: document.querySelector('[data-foco-titulo]').textContent, fechaElegida: document.querySelectorAll('.dia--sel').length, label: document.querySelector('.dia--sel') && document.querySelector('.dia--sel').getAttribute('aria-label') }));
    await p.click('.atras'); await p.waitForSelector('.tesela'); await esp(p, 300);
    const enPers = await p.evaluate(() => ({ titulo: document.querySelector('[data-foco-titulo]').textContent, pulsada: document.querySelector('.tesela[aria-pressed=true]').getAttribute('aria-label') }));
    log(`flujo ${n} atrás un paso a la vez`, { hora: enHora, fecha: enFecha, personas: enPers, pasos: await pasos(p) });
    // cambiar personas y volver a la solicitud por el stepper
    await p.click('[data-clave=p-2]'); await esp(p, 900);
    await p.click('.paso__btn[data-etapa=hora]'); await p.waitForSelector('.hora'); await esp(p, 300);
    await p.click('[data-clave=continuar]'); await completarDatos(p);
    log(`flujo ${n} cambiar personas y volver`, { mensaje: await p.textContent('#mensaje-solicitud') });
    log(`flujo ${n} red y almacenamiento`, { ...(await red(p, reg, peticionesIniciales)), enlacesExternosAbiertos: bloqueadas.length, consola: reg.consola, erroresJS: reg.errores, desborde: await overflow(p), chicos: await chicos(p) });
    await ctx.close();
  }
}

async function fallaCopiar(b) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const reg = espiar(p);
  await p.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denegado')) } }); document.execCommand = () => false; });
  await aSolicitud(p);
  await p.click('[data-clave=copiar]'); await esp(p, 400);
  log('copiar con fallo del portapapeles', await p.evaluate(() => ({ visible: document.querySelector('.rsv__copia').textContent, live: document.querySelector('[data-estado]').textContent, seleccion: window.getSelection().toString(), mensaje: document.getElementById('mensaje-solicitud').textContent })));
  await p.screenshot({ path: `${CAP}/reservas-solicitud-copiar-fallo-escritorio.png` });
  const p2 = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p2.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: undefined }); document.execCommand = () => false; });
  await aSolicitud(p2); await p2.click('[data-clave=copiar]'); await esp(p2, 300);
  log('copiar sin API de portapapeles', await p2.evaluate(() => ({ visible: document.querySelector('.rsv__copia').textContent, seleccion: window.getSelection().toString() === document.getElementById('mensaje-solicitud').textContent })));
  log('errores', { erroresJS: reg.errores });
  await p.close(); await p2.close();
}

async function sietemas(b) {
  for (const [w, h, n] of tam) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); const reg = espiar(p);
    await p.goto(URL); await p.waitForSelector('.tesela'); await p.click('[data-clave=p-grande]'); await esp(p, 1200);
    log(`7omas ${n}`, await p.evaluate(() => { const r = document.getElementById('aviso-grande').getBoundingClientRect(); return { titulo: document.querySelector('[data-foco-titulo]').textContent, aviso: document.getElementById('aviso-grande').textContent, avisoEnViewport: r.top >= 0 && r.bottom <= innerHeight, pulsada: document.querySelector('[data-clave=p-grande]').getAttribute('aria-pressed'), continuar: document.querySelector('[data-clave=continuar]').getAttribute('aria-disabled'), paso: document.querySelector('.paso__btn[data-etapa=personas]').getAttribute('aria-label'), tesela: Math.round(document.querySelector('.tesela').getBoundingClientRect().width) }; }));
    await p.screenshot({ path: `${CAP}/reservas-7-o-mas-${n}.png` });
    await p.click('[data-clave=continuar]'); await p.waitForSelector('.cal__tabla');
    const f = sumar(hoy(), 4); await irAFecha(p, f); await p.click(`[data-fecha="${f}"]`); await p.click('[data-clave=continuar]'); await p.waitForSelector('.hora');
    await p.click('[data-clave="h-21:00"]'); await completarDatos(p); await esp(p, 200);
    log(`7omas ${n} solicitud`, { mensaje: await p.textContent('#mensaje-solicitud'), fila: await p.$eval('.lista-datos > div', (d) => d.textContent), erroresJS: reg.errores });
    await p.close();
  }
}

async function teclado(b) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage(); const reg = espiar(p);
  await p.goto(URL); await p.waitForSelector('.tesela');
  await p.focus('[data-clave=p-2]'); await p.keyboard.press('Enter'); await esp(p, 1000);
  log('teclado personas (Enter no auto-avanza)', await p.evaluate(() => ({ titulo: document.querySelector('[data-foco-titulo]').textContent, foco: document.activeElement.dataset.clave, pulsada: document.activeElement.getAttribute('aria-pressed') })));
  for (let i = 0; i < 6; i++) await p.keyboard.press('Tab');
  log('teclado foco en Continuar', await p.evaluate(() => document.activeElement.dataset.clave));
  await p.evaluate(() => document.activeElement.scrollIntoView({ block: 'center' })); await esp(p, 300);
  await p.screenshot({ path: `${CAP}/reservas-teclado-foco-cta-escritorio.png` });
  await p.keyboard.press('Enter'); await p.waitForSelector('.cal__tabla'); await esp(p, 300);
  log('teclado Continuar → fecha', { titulo: await titulo(p), foco: await p.evaluate(() => document.activeElement.tagName + '.' + document.activeElement.className) });
  const tab0 = await p.evaluate(() => [...document.querySelectorAll('.dia')].filter((d) => d.tabIndex === 0).map((d) => d.dataset.fecha));
  await p.focus('.dia[tabindex="0"]'); const inicial = await p.evaluate(() => document.activeElement.dataset.fecha);
  const seq = [inicial];
  for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) { await p.keyboard.press(k); await esp(p, 60); seq.push(await p.evaluate(() => document.activeElement.dataset.fecha)); }
  await p.keyboard.press('End'); await esp(p, 60); seq.push('End:' + await p.evaluate(() => document.activeElement.dataset.fecha));
  await p.keyboard.press('Home'); await esp(p, 60); seq.push('Home:' + await p.evaluate(() => document.activeElement.dataset.fecha));
  await p.keyboard.press('PageDown'); await esp(p, 100); seq.push('PgDn:' + await p.evaluate(() => document.activeElement.dataset.fecha));
  await p.keyboard.press('PageUp'); await esp(p, 100); seq.push('PgUp:' + await p.evaluate(() => document.activeElement.dataset.fecha));
  log('teclado calendario', { tabindex0Inicial: tab0, hoy: hoy(), secuencia: seq });
  await p.evaluate(() => document.querySelector('.cal').scrollIntoView({ block: 'center' })); await esp(p, 200);
  await p.screenshot({ path: `${CAP}/reservas-teclado-calendario-escritorio.png` });
  await p.evaluate(() => document.querySelector('.dia--no').focus()); await p.keyboard.press('Enter'); await esp(p, 200);
  log('teclado Enter en día pasado', await p.evaluate(() => ({ mensaje: (document.querySelector('.rsv__mensaje') || {}).textContent, elegidos: document.querySelectorAll('.dia--sel').length })));
  const f = sumar(hoy(), 5); await irAFecha(p, f); await p.focus(`[data-fecha="${f}"]`); await p.keyboard.press('Enter'); await esp(p, 800);
  log('teclado fecha (sin auto-avance)', await p.evaluate(() => ({ titulo: document.querySelector('[data-foco-titulo]').textContent, foco: document.activeElement.dataset.fecha })));
  await p.focus('[data-clave=continuar]'); await p.keyboard.press('Enter'); await p.waitForSelector('.hora'); await esp(p, 300);
  await p.focus('[data-clave="h-21:30"]'); await p.keyboard.press('Space'); await esp(p, 900);
  log('teclado hora (Espacio, sin auto-avance)', await p.evaluate(() => ({ titulo: document.querySelector('[data-foco-titulo]').textContent, pulsada: document.activeElement.getAttribute('aria-pressed') })));
  await p.focus('[data-clave=continuar]'); await p.keyboard.press('Enter'); await completarDatos(p); await esp(p, 300);
  // orden de tabulación en la solicitud
  await p.focus('[data-foco-titulo]'); const orden = [];
  for (let i = 0; i < 4; i++) { await p.keyboard.press('Tab'); orden.push(await p.evaluate(() => (document.activeElement.dataset.clave || document.activeElement.className || document.activeElement.tagName) + ':' + (document.activeElement.getAttribute('aria-disabled') || ''))); }
  log('teclado solicitud (orden de Tab)', orden);
  await p.focus('[data-clave=instagram]'); await p.evaluate(() => document.activeElement.scrollIntoView({ block: 'center' })); await esp(p, 200);
  await p.screenshot({ path: `${CAP}/reservas-teclado-instagram-escritorio.png` });
  await p.focus('[data-clave=copiar]'); await p.keyboard.press('Enter'); await esp(p, 400);
  log('teclado copiar (Enter)', { copiado: (await p.evaluate(() => navigator.clipboard.readText())).startsWith('Hola, quisiera reservar para 2 personas'), visible: await p.textContent('.rsv__copia') });
  log('teclado errores', { erroresJS: reg.errores });
  await ctx.close();
}

async function reducido(b) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); const reg = espiar(p);
  await p.goto(URL); await p.waitForSelector('.tesela');
  const t0 = Date.now(); await p.click('[data-clave=p-3]'); await p.waitForSelector('.cal__tabla'); const ms = Date.now() - t0; await esp(p, 200);
  log('reducido avance sin animar', { ms, animaciones: await p.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length), clase: await p.$eval('.rsv__pantalla', (x) => x.className) });
  const f = sumar(hoy(), 3); await irAFecha(p, f); await p.click(`[data-fecha="${f}"]`); await p.click('[data-clave=continuar]'); await p.waitForSelector('.hora');
  await p.click('[data-clave="h-20:00"]'); await completarDatos(p); await esp(p, 200);
  await p.evaluate(() => document.querySelector('[data-clave=copiar]').scrollIntoView({ block: 'center' })); await p.hover('[data-clave=copiar]'); await esp(p, 100);
  log('reducido CTA hover (solo cambia de color)', await p.evaluate(() => { const c = document.querySelector('[data-clave=copiar]'); const b = getComputedStyle(c, '::before'); return { transform: b.transform, opacidad: b.opacity, color: getComputedStyle(c).color }; }));
  log('reducido', { animaciones: await p.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length), erroresJS: reg.errores });
  await ctx.close();
}

async function hoyPasado(b) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const reg = espiar(p);
  await p.addInitScript(() => { const fijo = new Date('2026-10-17T20:45:00').getTime(); const R = Date; class D extends R { constructor(...a) { if (a.length === 0) super(fijo); else super(...a); } static now() { return fijo; } } window.Date = D; });
  await p.goto(URL); await p.waitForSelector('.tesela'); await p.click('[data-clave=p-2]'); await p.waitForSelector('.cal__tabla'); await esp(p, 200);
  await p.click('[data-fecha="2026-10-17"]'); await p.click('[data-clave=continuar]'); await p.waitForSelector('.hora'); await esp(p, 300);
  log('hoy 20:45: horas ya pasadas', await p.evaluate(() => ({ nota: document.querySelector('.rsv__pista').textContent, estado: [...document.querySelectorAll('.hora')].map((h) => h.textContent + (h.getAttribute('aria-disabled') ? ':no' : ':ok')), label: document.querySelector('.hora[aria-disabled]').getAttribute('aria-label') })));
  await p.click('[data-clave="h-19:30"]', { force: true }); await esp(p, 200);
  log('clic en hora pasada', await p.evaluate(() => ({ elegidas: document.querySelectorAll('.hora[aria-pressed=true]').length, mensaje: (document.querySelector('.rsv__mensaje') || {}).textContent })));
  await p.screenshot({ path: `${CAP}/reservas-horas-de-hoy-escritorio.png` });
  // hora elegida mañana, luego cambiar a hoy: la hora pasada se descarta
  await p.click('.atras'); await p.waitForSelector('.cal__tabla'); await p.click('[data-fecha="2026-10-18"]'); await p.click('[data-clave=continuar]'); await p.waitForSelector('.hora');
  await p.click('[data-clave="h-19:00"]'); await completarDatos(p); await esp(p, 200);
  await p.click('.paso__btn[data-etapa=fecha]'); await p.waitForSelector('.cal__tabla'); await esp(p, 200);
  await p.click('[data-fecha="2026-10-17"]'); await esp(p, 300);
  log('cambiar a hoy descarta la hora ya pasada', await p.evaluate(() => ({ mensaje: (document.querySelector('.rsv__mensaje') || {}).textContent, pasos: [...document.querySelectorAll('.paso__btn')].map((b) => b.getAttribute('aria-label') + (b.disabled ? ' [off]' : '')) })));
  log('errores', { erroresJS: reg.errores });
  await p.close();
}

async function instagramAusente(b) {
  // Camino de respaldo: si alguien deja local.instagram en null, el botón queda deshabilitado (no hay enlace).
  const q = await b.newPage({ viewport: { width: 1440, height: 900 } }); const reg = espiar(q);
  await q.route('**/js/contenido.js*', async (route) => { const r = await route.fetch(); let t = await r.text(); t = t.replace("instagram: 'bartirua',", 'instagram: null,'); await route.fulfill({ response: r, body: t }); });
  await aSolicitud(q);
  log('sin usuario de Instagram (respaldo)', await q.evaluate(() => ({ tag: document.querySelector('[data-clave=instagram]').tagName, aria: document.querySelector('[data-clave=instagram]').getAttribute('aria-disabled'), nota: document.getElementById('nota-instagram').textContent, rotuloArriba: document.querySelector('[data-rsv-muestra]').textContent, pie: document.querySelector('[data-pie-instagram]').textContent.replace(/\s+/g, ' ').trim() })));
  await q.screenshot({ path: `${CAP}/reservas-solicitud-sin-instagram-escritorio.png` });
  // usuario inválido → también deshabilitado
  const r2 = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await r2.route('**/js/contenido.js*', async (route) => { const r = await route.fetch(); let t = await r.text(); t = t.replace("instagram: 'bartirua',", "instagram: 'abc def/..',"); await route.fulfill({ response: r, body: t }); });
  await aSolicitud(r2);
  log('usuario inválido se trata como ausente', await r2.evaluate(() => ({ aria: document.querySelector('[data-clave=instagram]').getAttribute('aria-disabled'), tag: document.querySelector('[data-clave=instagram]').tagName })));
  log('errores', { erroresJS: reg.errores });
  await q.close(); await r2.close();
}

async function domingoLunes(b) {
  for (const [w, h, n] of tam) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); const reg = espiar(p);
    const sig = (dow) => { let f = sumar(hoy(), 1); while (new Date(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10), 12).getDay() !== dow) f = sumar(f, 1); return f; };
    const dom = sig(0), lun = sig(1);
    await p.goto(URL); await p.waitForSelector('.tesela'); await p.click('[data-clave=p-3]'); await p.waitForSelector('.cal__tabla'); await esp(p, 200);
    await irAFecha(p, dom);
    const marcas = await p.evaluate(([dom, lun]) => [dom, lun].map((f) => { const d = document.querySelector(`[data-fecha="${f}"]`); return d ? { f, deshabilitado: d.getAttribute('aria-disabled'), diagonal: d.classList.contains('dia--no'), label: d.getAttribute('aria-label') } : { f, fueraDeVista: true }; }), [dom, lun]);
    const todos = await p.evaluate(() => { const hoy = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(); return [...document.querySelectorAll('.dia')].filter((d) => d.dataset.fecha >= hoy).every((d) => !d.getAttribute('aria-disabled') && !/cerrado|sin atención|cierre/i.test(d.getAttribute('aria-label'))); });
    log(`domingo y lunes ${n} en el calendario`, { marcas, todosLosDiasFuturosSeleccionables: todos, leyendaNota: await p.textContent('.rsv__pista') });
    for (const [nom, f] of [['domingo', dom], ['lunes', lun]]) {
      await p.goto(URL); await p.waitForSelector('.tesela'); await p.click('[data-clave=p-3]'); await p.waitForSelector('.cal__tabla'); await esp(p, 150);
      await irAFecha(p, f); await p.click(`[data-fecha="${f}"]`); await p.click('[data-clave=continuar]'); await p.waitForSelector('.hora');
      const horas = await p.$$eval('.hora', (h) => h.map((x) => x.textContent));
      await p.click('[data-clave="h-18:00"]'); await completarDatos(p); await esp(p, 200);
      log(`flujo completo con ${nom} ${n}`, { fecha: f, primeraHora: horas[0], ultimaHora: horas[horas.length - 1], mensaje: await p.textContent('#mensaje-solicitud'), esperado: `Hola, quisiera reservar para 3 personas el ${larga(f)} a las 18:00. ¿Me confirman disponibilidad?` });
    }
    log(`domingo y lunes ${n} errores`, { erroresJS: reg.errores });
    await ctx.close();
  }
}

async function diasCerradosActivable(b) {
  // Comprueba que el TODO de contenido.js funciona: con diasCerrados [0, 1] domingo y lunes se bloquean.
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route('**/js/contenido.js*', async (route) => { const r = await route.fetch(); let t = await r.text(); t = t.replace('diasCerrados: [],', 'diasCerrados: [0, 1],'); await route.fulfill({ response: r, body: t }); });
  await p.goto(URL); await p.waitForSelector('.tesela'); await p.click('[data-clave=p-2]'); await p.waitForSelector('.cal__tabla'); await esp(p, 200);
  log('diasCerrados [0, 1] (prueba del TODO, solo en el test)', await p.evaluate(() => { const hoy = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(); const dias = [...document.querySelectorAll('.dia')].filter((d) => d.dataset.fecha >= hoy); const dow = (f) => new Date(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10), 12).getDay(); return { cerrados: dias.filter((d) => d.getAttribute('aria-disabled')).every((d) => [0, 1].includes(dow(d.dataset.fecha))), habilitadosOtrosDias: dias.filter((d) => ![0, 1].includes(dow(d.dataset.fecha))).every((d) => !d.getAttribute('aria-disabled')), ejemplo: dias.find((d) => dow(d.dataset.fecha) === 0).getAttribute('aria-label'), nota: document.querySelector('.rsv__pista').textContent }; }));
  await p.close();
}

async function enlaces(b) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const bloqueadas = []; await bloquearExterno(ctx, bloqueadas);
  const p = await ctx.newPage(); const reg = espiar(p);
  await p.goto(BASE); await esp(p, 3000);
  log('enlaces salientes (href, target, rel)', await p.evaluate(() => [...document.querySelectorAll('a[href^="http"]')].map((a) => ({ texto: a.textContent.trim().replace(/\s+/g, ' '), href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'), ariaLabel: a.getAttribute('aria-label'), describe: a.getAttribute('aria-describedby') ? document.getElementById(a.getAttribute('aria-describedby')).textContent : null }))));
  log('hero y barra', await p.evaluate(() => ({ aviso: document.querySelector('.aviso').textContent, frase: document.querySelector('.hero__frase').textContent, heroAlto: Math.round(document.querySelector('.hero').getBoundingClientRect().height), alto: innerHeight, pieAviso: document.querySelector('.pie__aviso').textContent, pieInstagram: document.querySelector('[data-pie-instagram]').textContent.replace(/\s+/g, ' ').trim() })));
  log('mapa y delivery (textos)', await p.evaluate(() => ({ rotulo: document.querySelector('.mapa__rotulo').textContent, marco: document.querySelector('.mapa__texto').textContent, marcoAria: document.querySelector('.mapa__marco').getAttribute('aria-label'), sede: document.querySelector('.sede').innerText.replace(/\s+/g, ' '), iframes: document.querySelectorAll('iframe').length, delivery: document.querySelector('.delivery__caja').innerText.replace(/\s+/g, ' '), botonesDeshabilitados: document.querySelectorAll('[aria-disabled=true]').length, pendienteEnMapaODelivery: /pendiente/i.test(document.querySelector('#mapa').innerText + document.querySelector('#delivery').innerText) })));
  const cargaInicial = reg.peticiones.length;
  for (const sel of ['.sede a.btn', '.delivery a.btn', '[data-pie-instagram] a']) {
    await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await esp(p, 300);
    const [popup] = await Promise.all([p.waitForEvent('popup', { timeout: 3000 }).catch(() => null), p.click(sel)]); await esp(p, 300);
    if (popup) await popup.close().catch(() => {});
  }
  log('clic en los 3 enlaces (navegación bloqueada)', { intentosBloqueados: bloqueadas, paginaIgual: p.url().replace(BASE, '') === '', peticionesNuevasDeLaPagina: reg.peticiones.slice(cargaInicial).filter((r) => !/^https:\/\/(www\.instagram\.com|www\.google\.com|cuenta\.getjusto\.com)/.test(r.url)).length });
  log('red al cargar el inicio', { externasDePagina: reg.peticiones.slice(0, cargaInicial).filter((r) => !r.url.startsWith(BASE) && !r.url.startsWith('data:')).map((r) => r.url), erroresJS: reg.errores });
  await ctx.close();
}

async function estados(b) {
  for (const [w, h, n] of [[390, 844, 'movil'], [1440, 900, 'escritorio'], [360, 640, 'movil-chico']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(URL); await p.waitForSelector('.tesela'); const res = { personas: { desborde: await overflow(p), chicos: await chicos(p) } };
    await p.click('[data-clave=p-4]'); await p.waitForSelector('.cal__tabla'); await esp(p, 300); res.fecha = { desborde: await overflow(p), chicos: await chicos(p) };
    const f = sumar(hoy(), 3); await irAFecha(p, f); await p.click(`[data-fecha="${f}"]`); await p.click('[data-clave=continuar]'); await p.waitForSelector('.hora'); await esp(p, 300); res.hora = { desborde: await overflow(p), chicos: await chicos(p) };
    await p.click('[data-clave="h-22:30"]'); await completarDatos(p); await esp(p, 400); res.solicitud = { desborde: await overflow(p), chicos: await chicos(p) };
    res.stepperRecortado = await p.evaluate(() => [...document.querySelectorAll('.paso__v')].filter((e) => e.scrollWidth > e.clientWidth).map((e) => e.textContent));
    log(`estados ${n} (desborde y controles <44px por paso)`, res);
    await p.close();
  }
}

async function inicio(b) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const reg = espiar(p);
  await p.goto(BASE); await esp(p, 2500);
  log('inicio hero, nav y bloque de reservas', await p.evaluate(() => ({ heroBotones: [...document.querySelectorAll('.hero__acciones a')].map((a) => a.textContent.trim() + '→' + a.getAttribute('href')), nav: [...document.querySelectorAll('[data-nav] a')].map((a) => a.textContent + '→' + a.getAttribute('href')), formularios: document.querySelectorAll('form').length, bloque: { titulo: document.getElementById('reservas-titulo').textContent, bajada: document.querySelector('#reservas .seccion__bajada').textContent, pasos: document.querySelector('.reservas__titulo').textContent, nota: document.querySelector('.reservas__detalle').textContent, cta: document.querySelector('[data-reservas-cta]').textContent.trim(), href: document.querySelector('[data-reservas-cta]').getAttribute('href') } })));
  await p.click('[data-nav] a[href="#reservas"]'); await esp(p, 1500);
  log('nav Reservas en el inicio lleva a la sección', await p.evaluate(() => ({ top: Math.round(document.querySelector('#reservas').getBoundingClientRect().top), actual: document.querySelector('[data-nav] [aria-current]').textContent })));
  await p.screenshot({ path: `${CAP}/inicio-reservas-escritorio.png` });
  await p.click('[data-reservas-cta]'); await p.waitForSelector('.tesela'); await esp(p, 300);
  log('«Reservar mesa» abre el asistente', { url: p.url().replace(BASE, ''), titulo: await titulo(p) });
  log('nav y logo en reservar.html', await p.evaluate(() => ({ nav: [...document.querySelectorAll('[data-nav] a')].map((a) => a.textContent + '→' + a.getAttribute('href') + (a.getAttribute('aria-current') ? ' [' + a.getAttribute('aria-current') + ']' : '')), logos: [...document.querySelectorAll('a.marca')].map((a) => a.getAttribute('href')), pie: [...document.querySelectorAll('[data-nav-pie] a')].map((a) => a.getAttribute('href')), instagramPie: document.querySelector('[data-pie-instagram]').textContent.replace(/\s+/g, ' ').trim() })));
  await p.click('[data-nav] a[href="index.html#carta"]'); await p.waitForURL('**/index.html#carta'); await esp(p, 1500);
  log('nav Carta desde reservar.html', await p.evaluate(() => ({ url: location.pathname + location.hash, top: Math.round(document.querySelector('#carta').getBoundingClientRect().top) })));
  await p.goto(BASE); await esp(p, 2500); await p.click('.hero__acciones a[href="reservar.html"]'); await p.waitForSelector('.tesela');
  log('hero Reservar → reservar.html', { url: p.url().replace(BASE, '') });
  log('errores', { erroresJS: reg.errores, externas: reg.peticiones.filter((r) => !r.url.startsWith(BASE) && !r.url.startsWith('data:')).map((r) => r.url) });
  await p.close();
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(URL); await m.waitForSelector('.tesela'); await m.click('[data-menu-boton]'); await esp(m, 600);
  log('menú móvil en reservar.html', await m.evaluate(() => ({ expandido: document.querySelector('[data-menu-boton]').getAttribute('aria-expanded'), enlaces: [...document.querySelectorAll('[data-menu] a')].map((a) => a.textContent), mainInerte: document.getElementById('contenido').hasAttribute('inert') })));
  await m.screenshot({ path: `${CAP}/reservas-menu-movil-abierto.png` });
  await m.keyboard.press('Escape'); await esp(m, 300);
  log('menú móvil Esc', await m.evaluate(() => ({ expandido: document.querySelector('[data-menu-boton]').getAttribute('aria-expanded'), foco: document.activeElement.hasAttribute('data-menu-boton') })));
  await m.close();
}

(async () => {
  const modo = process.argv[2]; const b = await lanzar();
  await ({ flujo, enlaces, 'domingo-lunes': domingoLunes, 'dias-cerrados': diasCerradosActivable, 'copiar-fallo': fallaCopiar, sietemas, teclado, reducido, hoy: hoyPasado, 'instagram-ausente': instagramAusente, estados, inicio }[modo])(b);
  await b.close();
})();
