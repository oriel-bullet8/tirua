// Reservar en cascada: las preguntas se abren una tras otra, el mensaje se arma en vivo y «Enviar por Instagram» copia el texto y abre el chat del bar (emulación: nunca se envía nada).
// Uso: BASE=http://127.0.0.1:4195/ node pruebas/reservas-datos.cjs
const L = require('./_lib.cjs');
const fs = require('fs');
const path = require('path');
let total = 0, fallas = 0;
const ok = (c, msg, det) => { total++; if (!c) fallas++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + msg + (det !== undefined ? ' → ' + det : '')); };
const CHAT = 'https://ig.me/m/bartirua';   // chat directo con la cuenta del bar

const estado = (page) => page.evaluate(() => ({
  visibles: [...document.querySelectorAll('.etapa')].filter((e) => !e.hidden).map((e) => e.dataset.etapa),
  abiertas: [...document.querySelectorAll('.etapa')].filter((e) => e.classList.contains('etapa--abierta')).map((e) => e.dataset.etapa),
  valores: Object.fromEntries([...document.querySelectorAll('.etapa')].map((e) => [e.dataset.etapa, e.querySelector('.etapa__valor').textContent])),
  vista: !document.querySelector('[data-vista]').hidden,
  msg: document.getElementById('mensaje-solicitud').textContent,
  huecos: [...document.querySelectorAll('#mensaje-solicitud .hueco')].map((h) => h.textContent.replace(/^\[|\]$/g, '')),
  wa: (() => { const a = document.querySelector('[data-clave=instagram]'); return { href: a.getAttribute('href'), dis: a.getAttribute('aria-disabled'), tag: a.tagName, target: a.getAttribute('target'), rel: a.getAttribute('rel') }; })(),
  falta: document.getElementById('vista-falta').hidden ? '' : document.getElementById('vista-falta').textContent,
  nota: document.getElementById('nota-instagram').textContent,
  sw: document.documentElement.scrollWidth, W: document.documentElement.clientWidth,
}));

(async () => {
  const b = await L.lanzar();
  for (const [w, h, movil] of [[390, 844, true], [1440, 900, false]]) {
    const t = `${w}×${h}`;
    const { ctx, page, log } = await L.contexto(b, movil ? { viewport: { width: w, height: h }, hasTouch: true, isMobile: true } : { viewport: { width: w, height: h } });
    await ctx.route(/\/\/(ig\.me|www\.instagram\.com)\//, (r) => r.abort());   // nunca se abre Instagram de verdad
    const reqs = []; page.on('request', (r) => { if (r.method() !== 'GET') reqs.push(r.method() + ' ' + r.url()); });
    await page.addInitScript(() => { window.__abiertas = []; window.open = (u) => { window.__abiertas.push(String(u)); return null; }; });
    await page.goto(L.BASE + 'reservar.html'); await L.esperar(900);

    // 1 · estado inicial: solo la primera pregunta, sin mensaje
    let e = await estado(page);
    ok(e.visibles.join() === 'personas' && e.abiertas.join() === 'personas' && !e.vista, `[${t}] al entrar solo existe «Personas» (abierta) y aún no hay mensaje`, JSON.stringify({ v: e.visibles, vista: e.vista }));
    const tes = await page.$$eval('.tesela', (x) => x.map((n) => n.textContent.trim() + '|' + n.getAttribute('aria-label')));
    ok(tes.length === 7 && tes.every((x) => /^\d\+?\|/.test(x)), `[${t}] 7 teselas con solo el número y etiqueta accesible`, tes.join(' '));

    // 2 · personas → se abre fecha sola y aparece el mensaje con huecos
    await page.click('[data-clave="p-4"]'); await L.esperar(1300);
    e = await estado(page);
    ok(e.visibles.join() === 'personas,fecha' && e.abiertas.join() === 'fecha', `[${t}] al elegir personas se abre «Fecha»`, JSON.stringify(e.abiertas));
    ok(e.valores.personas === '4 personas', `[${t}] «Personas» queda plegada con su respuesta`, e.valores.personas);
    ok(e.vista && e.huecos.join() === 'tu nombre,fecha,hora' && /Personas: 4 personas/.test(e.msg), `[${t}] aparece el mensaje con los huecos [tu nombre] [fecha] [hora]`, e.huecos.join());
    ok(e.wa.tag === 'A' && e.wa.href === null && e.wa.dis === 'true' && /falta: fecha, hora, tu nombre/.test(e.falta), `[${t}] «Enviar por Instagram» sigue deshabilitado y dicen qué falta`, e.falta);

    // 3 · fecha → hora → datos
    const dias = await page.$$eval('.dia:not([aria-disabled])', (x) => x.map((n) => n.dataset.fecha));
    await page.click(`[data-fecha="${dias[3]}"]`); await L.esperar(1300);
    e = await estado(page);
    ok(e.abiertas.join() === 'hora' && e.visibles.length === 3, `[${t}] al elegir fecha se abre «Hora»`, e.abiertas.join());
    await page.click('[data-clave="h-20:30"]'); await L.esperar(1300);
    e = await estado(page);
    ok(e.abiertas.join() === 'datos' && e.visibles.length === 4 && e.valores.hora === '20:30 h', `[${t}] al elegir hora se abre «Tus datos»`, e.abiertas.join());
    ok(e.huecos.join() === 'tu nombre' && e.wa.dis === 'true', `[${t}] solo falta el nombre: el envío sigue deshabilitado`, e.huecos.join());
    // (pulsar un enlace deshabilitado no hace nada)
    await page.click('[data-clave=instagram]', { force: true }); await L.esperar(200);
    ok((await page.evaluate(() => window.__abiertas.length)) === 0, `[${t}] pulsar «Enviar por Instagram» sin nombre no abre nada ni copia`, '');

    // 4 · el mensaje se escribe en vivo
    await page.type('#campo-nombre', 'Pablo', { delay: 20 });
    e = await estado(page);
    ok(/Nombre: Pablo/.test(e.msg) && e.huecos.length === 0 && e.wa.dis === null, `[${t}] al escribir el nombre el mensaje se completa y se habilita el envío`, JSON.stringify(e.wa));
    await page.locator('.ocasion').nth(0).click();
    await page.fill('#campo-comentario', 'Alergia   a los frutos secos');
    e = await estado(page);
    const lineas = e.msg.split('\n');
    ok(lineas[0] === 'Hola, quisiera reservar en Tirúa.' && lineas[1] === 'Nombre: Pablo' && lineas[2] === 'Personas: 4 personas' && /^Fecha: .+ de 20\d\d$/.test(lineas[3]) && lineas[4] === 'Hora: 20:30' && lineas[5] === 'Ocasión: Cumpleaños' && lineas[6] === 'Comentarios: Alergia a los frutos secos' && lineas[7] === '¿Me confirman disponibilidad?', `[${t}] el mensaje trae nombre, personas, fecha, hora, ocasión y comentarios`, JSON.stringify(lineas));
    ok(e.wa.href === CHAT, `[${t}] el enlace lleva al chat de Instagram del bar (${CHAT})`, e.wa.href);
    ok(e.wa.target === '_blank' && /noopener/.test(e.wa.rel), `[${t}] el enlace abre en otra pestaña con noopener`, `${e.wa.target} ${e.wa.rel}`);
    ok(/copiamos tu solicitud/i.test(e.nota) && /pegas/.test(e.nota), `[${t}] la nota explica que se copia la solicitud y se pega en el chat`, e.nota.slice(0, 70));
    ok(e.sw <= e.W + 1, `[${t}] sin desborde horizontal`, `${e.sw}/${e.W}`);

    // 5 · enviar por Instagram: al pulsar se copia la solicitud y se abre el chat
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    const msgAntes = e.msg;
    await page.click('[data-clave=instagram]'); await L.esperar(500);
    const nota2 = await page.evaluate(() => document.getElementById('nota-instagram').textContent);
    ok(/Copiamos tu solicitud/.test(nota2) || /No pudimos copiarla/.test(nota2), `[${t}] al pulsar, la nota confirma la copia (o explica cómo copiarla a mano)`, nota2.slice(0, 60));
    const cb = await page.evaluate(() => navigator.clipboard.readText().catch(() => null));
    ok(cb === null || cb === msgAntes, `[${t}] el portapapeles recibe la solicitud exacta`, cb === null ? 'lectura no disponible' : 'igual');
    await page.fill('#campo-nombre', 'Pablo P'); await L.esperar(100);
    ok((await page.evaluate(() => document.getElementById('nota-instagram').textContent)) !== nota2, `[${t}] al cambiar el mensaje la nota vuelve a explicar el paso`, '');

    // 6 · cambiar una respuesta ya dada
    await page.click('[data-etapa=personas] .etapa__btn'); await L.esperar(700);
    e = await estado(page);
    ok(e.abiertas.join() === 'personas' && e.visibles.length === 4, `[${t}] tocar «Personas» la reabre y las demás siguen ahí`, e.abiertas.join());
    await page.click('[data-clave="p-2"]'); await L.esperar(1300);
    e = await estado(page);
    ok(e.abiertas.length === 0 && /Personas: 2 personas/.test(e.msg) && e.wa.dis === null, `[${t}] cambiar la respuesta con todo completo pliega todo y deja el mensaje listo`, e.abiertas.join() + ' / ' + e.msg.split('\n')[2]);
    ok((await page.$eval('#campo-nombre', (n) => n.value)) === 'Pablo P' && (await page.$eval('#campo-comentario', (n) => n.value)) === 'Alergia   a los frutos secos', `[${t}] lo escrito en «Tus datos» se conserva`, '');

    // 7 · 7 o más
    await page.click('[data-etapa=personas] .etapa__btn'); await L.esperar(600);
    await page.click('[data-clave="p-grande"]'); await L.esperar(1200);
    e = await estado(page);
    ok(/Personas: 7 o más personas/.test(e.msg) && await page.isVisible('.vista__nota >> text=Para 7 o más personas'), `[${t}] «7+» entra al mensaje y avisa que el bar lo coordina a mano`, e.msg.split('\n')[2]);

    // 8 · teclado: elegir no salta solo, aparece «Continuar»
    await page.reload(); await L.esperar(700);
    await page.focus('[data-clave="p-3"]'); await page.keyboard.press('Enter'); await L.esperar(900);
    e = await estado(page);
    ok(e.abiertas.join() === 'personas' && (await page.isVisible('[data-clave=continuar]')), `[${t}] con teclado no se salta solo: aparece «Continuar»`, e.abiertas.join());
    await page.keyboard.press('Tab'); await page.focus('[data-clave=continuar]'); await page.keyboard.press('Enter'); await L.esperar(900);
    e = await estado(page);
    ok(e.abiertas.join() === 'fecha', `[${t}] «Continuar» abre la siguiente pregunta`, e.abiertas.join());
    const foco = await page.evaluate(() => document.activeElement && document.activeElement.id);
    ok(foco === 'etapa-btn-fecha', `[${t}] el foco pasa al encabezado de la nueva pregunta`, foco);

    // 9 · plegar y desplegar con el encabezado
    await page.click('[data-etapa=fecha] .etapa__btn'); await L.esperar(600);
    ok((await estado(page)).abiertas.length === 0, `[${t}] tocar la pregunta abierta la pliega`, '');

    const almacenamiento = await page.evaluate(() => localStorage.length + sessionStorage.length + document.cookie.length);
    ok(reqs.length === 0 && almacenamiento === 0, `[${t}] no envía nada ni guarda datos (0 peticiones no GET, 0 almacenamiento)`, JSON.stringify({ reqs, almacenamiento }));
    ok((await page.evaluate(() => window.__abiertas.length)) === 0, `[${t}] la prueba nunca abrió Instagram (window.open)`, '');
    ok(log.errores.length === 0, `[${t}] 0 errores de JavaScript`, JSON.stringify(log.errores));
    await ctx.close();
  }
  // 10 · hoy a las 19:10 (solo si hoy es día de atención: martes a sábado)
  if ([0, 1].includes(new Date().getDay())) console.log('OMITIDO bloque «hoy 19:10»: hoy es domingo o lunes (día sin atención)'); else  // si la hora elegida ya pasó al cambiar la fecha a hoy, se pide otra y la pregunta «Hora» lo dice
  {
    const { ctx, page, log } = await L.contexto(b, { viewport: { width: 1440, height: 900 } });
    const ahora = new Date(); ahora.setHours(19, 10, 0, 0);
    await page.clock.install({ time: ahora });
    await page.goto(L.BASE + 'reservar.html'); await page.clock.runFor(900);
    await page.click('[data-clave="p-2"]'); await page.clock.runFor(1200);
    const dias = await page.$$eval('.dia:not([aria-disabled])', (x) => x.map((n) => n.dataset.fecha));
    await page.click(`[data-fecha="${dias[2]}"]`); await page.clock.runFor(1200);
    await page.click('[data-clave="h-18:30"]'); await page.clock.runFor(1200);
    await page.click('[data-etapa=fecha] .etapa__btn'); await page.clock.runFor(700);
    await page.click(`[data-fecha="${dias[0]}"]`); await page.clock.runFor(1200);   // hoy
    const e = await estado(page);
    ok(e.abiertas.join() === 'hora' && e.valores.hora !== '18:30 h' && /Hora: \[hora\]|Hora: /.test(e.msg) && e.huecos.includes('hora'), `[hoy 19:10] la hora que ya pasó se descarta y se abre «Hora»`, JSON.stringify({ a: e.abiertas, h: e.huecos }));
    ok(await page.isVisible('.etapa--abierta .rsv__mensaje'), `[hoy 19:10] la pregunta explica que la hora ya pasó`, '');
    const pasadas = await page.$$eval('.hora[aria-disabled="true"]', (x) => x.map((n) => n.textContent.trim()));
    ok(pasadas.join() === '18:00,18:30,19:00', `[hoy 19:10] las horas pasadas quedan deshabilitadas`, pasadas.join());
    ok(log.errores.length === 0, `[hoy 19:10] 0 errores de JavaScript`, JSON.stringify(log.errores));
    await ctx.close();
  }
  await b.close();
  console.log(`\nTOTAL ${total} comprobaciones · ${total - fallas} OK · ${fallas} con falla`);
  process.exit(fallas ? 1 : 0);
})();
