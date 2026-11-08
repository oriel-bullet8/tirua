// Prueba de la baraja del inicio con la carta completa: portal → «Escoger mazo» → mazo, 251 cartas, 4 palos, 27 secciones,
// fotos, reverso con precio, búsqueda, joker y rendimiento (solo se montan las cartas cercanas a la activa).
// Uso: node pruebas/carta-baraja.cjs   (servidor: python3 servir.py; BASE=http://127.0.0.1:4195/ por defecto)
// Referencia: datos/carta.json (la carta generada desde la captura de Justo; va en el repo).
const { lanzar, contexto, BASE, fs, path } = require('./_lib.cjs');
const CARTA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'datos', 'carta.json'), 'utf8'));
const secciones = CARTA.bloques.flatMap((b) => b.secciones);          // {id, nombre, productos[]}
const productos = secciones.flatMap((s) => s.productos);
const PALOS = { compartir: ['para-picar', 'entradas-frias', 'papitas-para-compartir'], individuales: ['sushi', 'ensaladas', 'sandwich', 'pizzas'], postres: ['postres'] };
PALOS.bebestibles = secciones.map((s) => s.id).filter((id) => !Object.values(PALOS).flat().includes(id));
const MAZOS = { cocteleria: ['cocteleria-de-autor', 'cocteleria-internacional', 'rincon-de-los-sour', 'spritz', 'mocktail'],
  destilados: ['vodka', 'gin', 'pisco', 'whisky', 'ron', 'tequila', 'shot', 'jarras-y-licores', 'espumantes', 'vino'],
  cervezas: ['cerveza', 'schop', 'bebida', 'cafeteria'], individuales: PALOS.individuales, postres: PALOS.postres, compartir: PALOS.compartir };
const nSec = (id) => secciones.find((s) => s.id === id).productos.length;
const nPalo = (palo) => (PALOS[palo] || MAZOS[palo]).reduce((a, id) => a + nSec(id), 0);
const MAX_MONTADAS = 30;   // con la ventana de cartas (±5 + 12 del abanico + joker) nunca debería acercarse a esto

let ok = 0, mal = 0;
const chequea = (n, c, d) => { if (c) { ok++; console.log('OK    ' + n); } else { mal++; console.log('FALLA ' + n + (d !== undefined ? ' → ' + JSON.stringify(d) : '')); } };
const contador = (page) => page.evaluate(() => (document.querySelector('.br-contador__txt') || {}).textContent);
const montadas = (page) => page.evaluate(() => document.querySelectorAll('.br-card').length);
const ruidoConocido = (u) => /hero(-vertical)?\.mp4/.test(u);   // el video del hero aún no existe: advertencia conocida
const SUB = ['cocteleria', 'destilados', 'cervezas'];   // partes de Bebestibles: se eligen en un segundo nivel
const elegir = async (page, palo) => {
  if (SUB.includes(palo)) { await page.click('.br-mazo[data-grupo="bebestibles"]'); await page.waitForSelector(`.br-mazo[data-id="${palo}"]`, { timeout: 3000 }); await page.waitForTimeout(700); }
  await page.click(`.br-mazo[data-id="${palo}"]`); await page.waitForTimeout(1500);
};

(async () => {
  const browser = await lanzar();
  try {
    for (const [nombre, w, h] of [['1440×900', 1440, 900], ['390×844', 390, 844]]) {
      const { ctx, page, log } = await contexto(browser, { viewport: { width: w, height: h }, hasTouch: w < 700 });
      const t = '[' + nombre + '] ';
      const t0 = Date.now();
      await page.goto(BASE, { waitUntil: 'networkidle' });
      const d = await page.evaluate(() => {
        const P = window.DATOS_BARAJA.productos;
        return { n: P.length, conFoto: P.filter((p) => p.imagen).length, sinFoto: P.filter((p) => !p.imagen).length, nombres: P.map((p) => p.nombre),
                 feo: P.filter((p) => /undefined|NaN|null/.test(JSON.stringify(p))).map((p) => p.id), nodos: document.querySelectorAll('*').length,
                 ancho: document.documentElement.scrollWidth, vw: innerWidth };
      });
      chequea(t + `los datos de la baraja tienen las ${productos.length} cartas`, d.n === productos.length, d.n);
      chequea(t + `${productos.filter((p) => p.foto).length} con foto y ${productos.filter((p) => !p.foto).length} sin foto`, d.conFoto === productos.filter((p) => p.foto).length && d.sinFoto === productos.filter((p) => !p.foto).length, { conFoto: d.conFoto, sinFoto: d.sinFoto });
      chequea(t + 'los nombres coinciden uno a uno con la carta', JSON.stringify([...d.nombres].sort()) === JSON.stringify(productos.map((p) => p.nombre).sort()));
      chequea(t + 'ningún dato de carta contiene «undefined», «NaN» ni «null»', d.feo.length === 0, d.feo.slice(0, 5));
      chequea(t + 'sin desbordamiento horizontal', d.ancho <= d.vw, d);
      chequea(t + `al cargar solo hay ≤ ${MAX_MONTADAS} cartas en el DOM y menos de 4000 nodos (antes 252 cartas y ~19.800 nodos)`, (await montadas(page)) <= MAX_MONTADAS && d.nodos < 4000, { montadas: await montadas(page), nodos: d.nodos });

      // Paso 1: «Abrir la carta» → paso 2: «Escoger mazo»
      await page.evaluate(() => document.getElementById('carta').scrollIntoView({ behavior: 'instant' }));
      const t1 = Date.now();
      await page.click('#abrir'); await page.waitForSelector('#mazos:not([hidden])', { timeout: 3000 }); await page.waitForTimeout(900);
      chequea(t + '«Abrir la carta» muestra «Escoger mazo» en menos de 1,5 s, sin abrir ninguna baraja', Date.now() - t1 < 1500 && (await page.evaluate(() => !document.querySelector('#carta').classList.contains('br-is-open'))), Date.now() - t1);
      const mz = await page.evaluate(() => [...document.querySelectorAll('.br-mazo')].map((b) => ({ id: b.dataset.grupo || b.dataset.id, txt: b.textContent })));
      const raiz = ['bebestibles', 'individuales', 'postres', 'compartir'];
      chequea(t + 'al abrir hay solo 4 mazos (Bebestibles, Comidas individuales, Postres, Para compartir) con su cantidad de cartas', mz.length === 4 && mz.map((m) => m.id).join() === raiz.join() && mz.every((m) => new RegExp(String(m.id === 'bebestibles' ? 196 : nPalo(m.id)) + ' cartas').test(m.txt)), mz);
      // Bebestibles se despliega en sus 3 partes y se puede volver
      await page.click('.br-mazo[data-grupo="bebestibles"]'); await page.waitForSelector('.br-mazo[data-id="cocteleria"]', { timeout: 3000 }); await page.waitForTimeout(700);
      const sub = await page.evaluate(() => ({ ids: [...document.querySelectorAll('.br-mazo')].map((b) => b.dataset.id), tit: document.querySelector('#mazos-titulo').textContent, volver: !document.querySelector('#mazos-volver').hidden }));
      chequea(t + 'al pulsar Bebestibles se despliegan sus 3 mazos con el título «Bebestibles» y un botón para volver', sub.ids.join() === SUB.join() && sub.tit === 'Bebestibles' && sub.volver, sub);
      await page.keyboard.press('Escape'); await page.waitForTimeout(600);
      chequea(t + 'Esc dentro de Bebestibles vuelve a los 4 mazos sin cerrar el selector', await page.evaluate(() => !document.querySelector('#mazos').hidden && document.querySelectorAll('.br-mazo').length === 4 && document.querySelector('#mazos-volver').hidden));
      chequea(t + 'el foco queda en un mazo', await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('br-mazo')));
      chequea(t + 'mientras se escoge no hay cartas abiertas ni controles de la baraja a la vista', await page.evaluate(() => getComputedStyle(document.querySelector('#bloque')).visibility === 'hidden'));
      chequea(t + 'Esc cierra el paso «Escoger mazo» y vuelve al portal', await (async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(700); return page.evaluate(() => !document.querySelector('#carta').classList.contains('br-inm') && document.querySelector('#mazos').hidden); })());
      await page.evaluate(() => document.getElementById('carta').scrollIntoView({ behavior: 'instant' }));
      await page.click('#abrir'); await page.waitForSelector('#mazos:not([hidden])'); await page.waitForTimeout(700);
      await page.click('#inm-cerrar'); await page.waitForTimeout(700);
      chequea(t + 'la X cierra el paso «Escoger mazo»', await page.evaluate(() => !document.querySelector('#carta').classList.contains('br-inm')));

      // Elegir «Para compartir» (20 cartas): solo se cargan sus cartas
      await page.evaluate(() => document.getElementById('carta').scrollIntoView({ behavior: 'instant' }));
      await page.click('#abrir'); await page.waitForSelector('#mazos:not([hidden])'); await page.waitForTimeout(800);
      const t2 = Date.now();
      await page.click('.br-mazo[data-id="compartir"]'); await page.waitForSelector('.br-carta.br-is-open', { timeout: 4000 });
      chequea(t + 'elegir un mazo lo abre en menos de 2,2 s', Date.now() - t2 < 2200, Date.now() - t2);
      chequea(t + `el mazo «compartir» tiene ${nPalo('compartir')} cartas (contador «1 de ${nPalo('compartir')}»)`, (await contador(page)) === `1 de ${nPalo('compartir')}`, await contador(page));
      chequea(t + 'el selector queda cerrado al abrir el mazo', await page.evaluate(() => document.querySelector('#mazos').hidden));
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(500);
      chequea(t + 'la flecha derecha avanza a la carta 2', (await contador(page)) === `2 de ${nPalo('compartir')}`);
      await page.keyboard.press('End'); await page.waitForTimeout(700);
      chequea(t + `«Fin» llega a la última carta del mazo (${nPalo('compartir')} de ${nPalo('compartir')})`, (await contador(page)) === `${nPalo('compartir')} de ${nPalo('compartir')}`, await contador(page));
      await page.keyboard.press('Home'); await page.waitForTimeout(700);
      chequea(t + '«Inicio» vuelve a la primera', (await contador(page)) === `1 de ${nPalo('compartir')}`);

      // Reverso: sección, descripción y precio de la primera carta (Entraña)
      await page.keyboard.press('Enter'); await page.waitForTimeout(900);
      const rev = await page.evaluate(() => { const c = document.querySelector('.br-card.br-is-active'); return { precio: (c.querySelector('.br-precio') || {}).textContent, cat: (c.querySelector('.br-dorso__cat') || {}).textContent, desc: (c.querySelector('.br-dorso__desc') || {}).textContent }; });
      const prim = productos[0];
      chequea(t + `el reverso de «${prim.nombre}» muestra precio, sección y descripción de Justo`, rev.precio === '$' + String(prim.precio).replace(/\B(?=(\d{3})+(?!\d))/g, '.') && !!rev.cat && rev.desc === prim.descripcion, rev);
      await page.keyboard.press('Enter'); await page.waitForTimeout(500);

      // Cambiar de mazo desde la bandeja
      await page.click('#inm-opciones'); await page.waitForTimeout(500);
      await page.click('#cambiar-mazo'); await page.waitForSelector('#mazos:not([hidden])', { timeout: 4000 }); await page.waitForTimeout(700);
      chequea(t + '«Cambiar de mazo» vuelve al paso «Escoger mazo»', await page.evaluate(() => !document.querySelector('#mazos').hidden && document.querySelector('#carta').classList.contains('br-inm')));
      await elegir(page, 'destilados');
      chequea(t + `el mazo «Destilados y vinos» tiene ${nPalo('destilados')} cartas`, (await contador(page)) === `1 de ${nPalo('destilados')}`, await contador(page));
      const ch = await page.evaluate(() => [...document.querySelectorAll('#chips-sec .br-chip')].map((b) => b.dataset.sec));
      chequea(t + 'sus chips de sección son solo las de ese mazo (no las 19 de Bebestibles)', ch.length === MAZOS.destilados.length + 1 && MAZOS.destilados.every((id) => ch.includes(id)), ch);
      chequea(t + `con ${nPalo('destilados')} cartas hay ≤ ${MAX_MONTADAS} en el DOM`, (await montadas(page)) <= MAX_MONTADAS, await montadas(page));
      await page.keyboard.press('End'); await page.waitForTimeout(900);
      chequea(t + `«Fin» llega a la carta ${nPalo('destilados')} y sigue habiendo ≤ ${MAX_MONTADAS} cartas en el DOM`, (await contador(page)) === `${nPalo('destilados')} de ${nPalo('destilados')}` && (await montadas(page)) <= MAX_MONTADAS, { c: await contador(page), m: await montadas(page) });
      const activaOk = await page.evaluate(() => { const a = document.querySelector('.br-card.br-is-active'); return !!a && !!a.querySelector('.br-nombre').textContent; });
      chequea(t + 'la carta activa del final está montada y con nombre', activaOk);
      await page.keyboard.press('Home'); await page.waitForTimeout(900);

      // Palos y secciones desde la bandeja
      await page.click('#inm-opciones'); await page.waitForTimeout(600);
      await page.click('.br-chip--todo'); await page.waitForTimeout(700);
      chequea(t + 'el chip «Todo» muestra las 251 cartas (conserva la carta actual al cambiar de filtro)', (await contador(page)).endsWith(` de ${productos.length}`), await contador(page));
      for (const [palo, esperado] of Object.entries({ compartir: nPalo('compartir'), individuales: nPalo('individuales'), postres: nPalo('postres'), bebestibles: nPalo('bebestibles') })) {
        await page.click(`.br-chip[data-id="${palo}"]`); await page.waitForTimeout(700);
        const c = await contador(page);
        chequea(t + `el palo «${palo}» tiene ${esperado} cartas`, c === `1 de ${esperado}`, c);
      }
      await page.click('.br-chip[data-id="bebestibles"]'); await page.waitForTimeout(500);
      const sumas = await page.evaluate(() => [...document.querySelectorAll('#chips-sec .br-chip[data-sec]:not([data-sec=""])')].map((b) => ({ id: b.dataset.sec, n: parseInt(b.querySelector('.br-chip__estado').textContent, 10) })));
      chequea(t + `Bebestibles ofrece ${PALOS.bebestibles.length} secciones y sus cantidades suman ${nPalo('bebestibles')}`, sumas.length === PALOS.bebestibles.length && sumas.reduce((a, x) => a + x.n, 0) === nPalo('bebestibles'), sumas.length);
      if (w > 700) {   // las 27 secciones, una por una (en escritorio; en móvil se prueban cuatro)
        let malas = [];
        for (const [palo, ids] of Object.entries(PALOS)) {
          await page.click(`.br-chip[data-id="${palo}"]`); await page.waitForTimeout(400);
          if (ids.length < 2) continue;
          for (const id of ids) {
            await page.click(`#chips-sec .br-chip[data-sec="${id}"]`); await page.waitForTimeout(450);
            const c = await contador(page);
            if (c !== `1 de ${nSec(id)}`) malas.push({ id, c, esperado: nSec(id) });
          }
        }
        chequea(t + 'cada sección de Justo muestra exactamente sus productos', malas.length === 0, malas);
      } else {
        for (const id of ['vino', 'cerveza', 'espumantes', 'pisco']) {
          await page.click('.br-chip[data-id="bebestibles"]'); await page.waitForTimeout(400);
          await page.click(`#chips-sec .br-chip[data-sec="${id}"]`); await page.waitForTimeout(450);
          chequea(t + `la sección «${id}» muestra ${nSec(id)} cartas`, (await contador(page)) === `1 de ${nSec(id)}`, await contador(page));
        }
      }
      await page.click('.br-chip[data-id="postres"]'); await page.waitForTimeout(500);
      chequea(t + 'Postres (una sola sección) no muestra la segunda fila', await page.evaluate(() => document.querySelector('#chips-sec').hidden));

      // Búsqueda
      await page.click('.br-chip--todo'); await page.waitForTimeout(500);
      await page.fill('#buscar', 'pisco sour'); await page.waitForTimeout(900);
      const nb = parseInt((await contador(page) || '').split(' de ')[1], 10);
      chequea(t + 'buscar «pisco sour» deja solo coincidencias', nb > 0 && nb < 40, nb);
      await page.fill('#buscar', 'zzzzzz'); await page.waitForTimeout(900);
      chequea(t + 'una búsqueda sin resultados muestra el aviso', await page.evaluate(() => !document.querySelector('#vacio').hidden));
      await page.fill('#buscar', ''); await page.waitForTimeout(700);

      // Joker: vive en la carta (botón de opciones) y es la última carta del mazo
      await page.click('.br-chip[data-id="postres"]'); await page.waitForTimeout(600);
      await page.click('#joker-btn'); await page.waitForTimeout(900);
      chequea(t + 'el Joker se agrega al mazo y queda activo', await page.evaluate(() => !!document.querySelector('.br-card--joker.br-is-active')) && (await contador(page)) === 'Joker', await contador(page));

      // Lista rápida con todo
      await page.click('.br-chip--todo'); await page.waitForTimeout(600);
      await page.click('#abrir-lista'); await page.waitForTimeout(500);
      const nl = await page.evaluate(() => document.querySelectorAll('.br-hoja__item').length);
      chequea(t + `la lista rápida muestra las ${productos.length} cartas`, nl === productos.length, nl);

      const fallidasReales = log.fallidas.filter((u) => !ruidoConocido(u));
      const consolaReal = log.consola.filter((m) => !(fallidasReales.length === 0 && /Failed to load resource/.test(m)));
      const errores = log.errores.concat(consolaReal, fallidasReales);
      chequea(t + 'sin errores de JavaScript ni peticiones fallidas (salvo el video del hero, aún ausente)', errores.length === 0, errores.slice(0, 5));
      await ctx.close();
    }

    // Fluidez de la apertura (Chromium sin GPU: umbrales holgados; antes de la mejora: p95 = 67 ms, máximo = 167 ms)
    {
      const { ctx, page } = await contexto(browser, { viewport: { width: 1440, height: 900 } });
      await page.addInitScript(() => { window.__lt = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); } catch (e) {} });
      await page.goto(BASE, { waitUntil: 'load' });
      await page.evaluate(() => document.getElementById('carta').scrollIntoView({ behavior: 'instant' })); await page.waitForTimeout(700);
      await page.click('#abrir'); await page.waitForSelector('#mazos:not([hidden])'); await page.waitForTimeout(900);
      await page.evaluate(() => { window.__f = []; let u = performance.now(); (function f(t) { window.__f.push(t - u); u = t; if (window.__f.length < 240) requestAnimationFrame(f); })(u); });
      await page.click('.br-mazo[data-grupo="bebestibles"]'); await page.waitForTimeout(900); await page.evaluate(() => { window.__f = []; let u = performance.now(); (function f(t) { window.__f.push(t - u); u = t; if (window.__f.length < 240) requestAnimationFrame(f); })(u); }); await page.click('.br-mazo[data-id="destilados"]'); await page.waitForTimeout(2600);
      const fr = await page.evaluate(() => { const f = window.__f.slice(1).sort((a, b) => a - b); return { n: f.length, p95: Math.round(f[Math.floor(f.length * 0.95)]), max: Math.round(f[f.length - 1]), lt: window.__lt }; });
      chequea('[rendimiento] apertura del mazo más grande (84 cartas): fotogramas p95 ≤ 34 ms y máximo ≤ 100 ms', fr.p95 <= 34 && fr.max <= 100, fr);
      chequea('[rendimiento] sin tareas largas (≥ 50 ms) durante la apertura', fr.lt.length === 0, fr.lt);
      await ctx.close();
    }
    // Joker escondido en el mazo: aparece por sorteo, boca abajo, se descubre al detenerse en él y no cuenta como carta de la carta
    {
      const buscarJoker = async (page, max) => { for (let i = 0; i < max; i++) { if ((await contador(page)) === 'Joker') { return i; } await page.keyboard.press('ArrowRight'); await page.waitForTimeout(40); } return -1; };
      for (const [etq, azar, esperado] of [['sale (azar 0,01)', 0.01, true], ['no sale (azar 0,99)', 0.99, false]]) {
        const { ctx, page } = await contexto(browser, { viewport: { width: 1440, height: 900 } });
        await page.addInitScript((r) => { Math.random = () => r; }, azar);
        await page.goto(BASE, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.getElementById('carta').scrollIntoView({ behavior: 'instant' }));
        await page.click('#abrir'); await page.waitForSelector('#mazos:not([hidden])'); await page.waitForTimeout(700);
        await elegir(page, 'postres');
        const k = await buscarJoker(page, 9);
        chequea(`[joker] mazo de postres con ${etq}: ${esperado ? 'el Joker está escondido dentro del mazo' : 'el mazo no lleva joker'}`, esperado ? (k >= 3) : (k === -1), k);
        if (esperado) {
          await page.waitForTimeout(250);
          chequea('[joker] al llegar aún está boca abajo y no adelanta el premio', await page.evaluate(() => document.querySelector('#p-joker').hidden && !!document.querySelector('.br-card--joker.br-is-active')));
          await page.waitForTimeout(900);
          const r = await page.evaluate(() => ({ txt: document.querySelector('#p-joker').textContent, vis: !document.querySelector('#p-joker').hidden && getComputedStyle(document.querySelector('.br-panel__producto')).opacity === '1', vistos: sessionStorage.getItem('br-jokers') }));
          chequea('[joker] tras detenerse se da vuelta y muestra el texto del premio configurado en datos.js', r.vis && /Te salió el Joker/.test(r.txt) && r.vistos === '1', r);
          await page.keyboard.press('ArrowRight'); await page.waitForTimeout(500);
          const c2 = await contador(page), n = nPalo('postres');
          chequea('[joker] el Joker no cuenta en «N de ' + n + '» (la carta siguiente no se salta ningún número)', new RegExp('^\\d+ de ' + n + '$').test(c2) && parseInt(c2, 10) === k + 1, { k, c2 });
        }
        await ctx.close();
      }
      // Tope por visita: con el tope alcanzado el sorteo no vuelve a poner joker aunque el azar lo permitiera
      {
        const { ctx, page } = await contexto(browser, { viewport: { width: 1440, height: 900 } });
        await page.addInitScript(() => { Math.random = () => 0.01; try { sessionStorage.setItem('br-jokers', '1'); } catch (e) {} });
        await page.goto(BASE, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.getElementById('carta').scrollIntoView({ behavior: 'instant' }));
        await page.click('#abrir'); await page.waitForSelector('#mazos:not([hidden])'); await page.waitForTimeout(700);
        await elegir(page, 'postres');
        chequea('[joker] con el tope de 1 por visita alcanzado no vuelve a salir', (await buscarJoker(page, 9)) === -1);
        await ctx.close();
      }
    }
  } finally { await browser.close(); }
  console.log(`\nTOTAL ${ok + mal} comprobaciones · ${ok} OK · ${mal} con falla`);
  process.exit(mal ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
