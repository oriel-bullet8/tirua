// Prueba de la baraja del inicio con la carta completa: 251 cartas, 4 palos, 27 secciones, fotos, reverso con precio y búsqueda.
// Uso: node pruebas/carta-baraja.cjs   (servidor: python3 servir.py; BASE=http://127.0.0.1:4195/ por defecto)
// Referencia: datos/carta.json (la carta generada desde la captura de Justo; va en el repo).
const { lanzar, contexto, BASE, fs, path } = require('./_lib.cjs');
const CARTA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'datos', 'carta.json'), 'utf8'));
const secciones = CARTA.bloques.flatMap((b) => b.secciones);          // {id, nombre, productos[]}
const productos = secciones.flatMap((s) => s.productos);
const PALOS = { compartir: ['para-picar', 'entradas-frias', 'papitas-para-compartir'], individuales: ['sushi', 'ensaladas', 'sandwich', 'pizzas'], postres: ['postres'] };
PALOS.bebestibles = secciones.map((s) => s.id).filter((id) => !Object.values(PALOS).flat().includes(id));
const nSec = (id) => secciones.find((s) => s.id === id).productos.length;
const nPalo = (palo) => PALOS[palo].reduce((a, id) => a + nSec(id), 0);

let ok = 0, mal = 0;
const chequea = (n, c, d) => { if (c) { ok++; console.log('OK    ' + n); } else { mal++; console.log('FALLA ' + n + (d !== undefined ? ' → ' + JSON.stringify(d) : '')); } };
const contador = (page) => page.evaluate(() => (document.querySelector('.br-contador__txt') || {}).textContent);
const ruidoConocido = (u) => /hero(-vertical)?\.mp4/.test(u);   // el video del hero aún no existe: advertencia conocida

(async () => {
  const browser = await lanzar();
  try {
    for (const [nombre, w, h] of [['1440×900', 1440, 900], ['390×844', 390, 844]]) {
      const { ctx, page, log } = await contexto(browser, { viewport: { width: w, height: h }, hasTouch: w < 700 });
      const t = '[' + nombre + '] ';
      await page.goto(BASE, { waitUntil: 'networkidle' });
      const d = await page.evaluate(() => {
        const cartas = [...document.querySelectorAll('.br-card:not(.br-card--joker)')];
        return { n: cartas.length, conFoto: cartas.filter((c) => c.querySelector('.br-foto__img')).length, sinFoto: cartas.filter((c) => c.hasAttribute('data-sin-foto')).length,
                 feo: cartas.filter((c) => /undefined|NaN|null/.test(c.textContent)).map((c) => c.dataset.id), ancho: document.documentElement.scrollWidth, vw: innerWidth,
                 nombres: cartas.map((c) => c.querySelector('.br-nombre').textContent) };
      });
      chequea(t + `la baraja tiene las ${productos.length} cartas de la carta`, d.n === productos.length, d.n);
      chequea(t + `${productos.filter((p) => p.foto).length} cartas con foto y ${productos.filter((p) => !p.foto).length} sin foto`, d.conFoto === productos.filter((p) => p.foto).length && d.sinFoto === productos.filter((p) => !p.foto).length, { conFoto: d.conFoto, sinFoto: d.sinFoto });
      chequea(t + 'los nombres coinciden uno a uno con la carta', JSON.stringify([...d.nombres].sort()) === JSON.stringify(productos.map((p) => p.nombre).sort()));
      chequea(t + 'ninguna carta muestra «undefined», «NaN» ni «null»', d.feo.length === 0, d.feo.slice(0, 5));
      chequea(t + 'sin desbordamiento horizontal', d.ancho <= d.vw, d);

      // Abrir la carta y recorrerla
      const t0 = Date.now();
      await page.click('#abrir'); await page.waitForSelector('.br-carta.br-inm', { timeout: 5000 }); await page.waitForTimeout(1900);
      chequea(t + 'abre a pantalla completa en menos de 4 s', Date.now() - t0 < 4000, Date.now() - t0);
      chequea(t + `el contador parte en «1 de ${productos.length}»`, (await contador(page)) === `1 de ${productos.length}`, await contador(page));
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(500);
      chequea(t + 'la flecha derecha avanza a la carta 2', (await contador(page)) === `2 de ${productos.length}`);
      await page.keyboard.press('End'); await page.waitForTimeout(700);
      chequea(t + `«Fin» llega a la última carta (${productos.length} de ${productos.length})`, (await contador(page)) === `${productos.length} de ${productos.length}`, await contador(page));
      await page.keyboard.press('Home'); await page.waitForTimeout(700);
      chequea(t + '«Inicio» vuelve a la primera', (await contador(page)) === `1 de ${productos.length}`);

      // Reverso: sección, descripción y precio de la primera carta (Entraña)
      await page.keyboard.press('Enter'); await page.waitForTimeout(900);
      const rev = await page.evaluate(() => { const c = document.querySelector('.br-card.br-is-active'); return { precio: (c.querySelector('.br-precio') || {}).textContent, cat: (c.querySelector('.br-dorso__cat') || {}).textContent, desc: (c.querySelector('.br-dorso__desc') || {}).textContent }; });
      const prim = productos[0];
      chequea(t + `el reverso de «${prim.nombre}» muestra precio, sección y descripción de Justo`, rev.precio === '$' + String(prim.precio).replace(/\B(?=(\d{3})+(?!\d))/g, '.') && !!rev.cat && rev.desc === prim.descripcion, rev);
      await page.keyboard.press('Enter'); await page.waitForTimeout(500);

      // Palos y secciones desde la bandeja
      await page.click('#inm-opciones'); await page.waitForTimeout(600);
      const totalTodo = await (async () => { await page.click('.br-chip--todo'); await page.waitForTimeout(700); return contador(page); })();
      chequea(t + 'el chip «Todo» muestra las 251 cartas', totalTodo === `1 de ${productos.length}`, totalTodo);
      for (const [palo, esperado] of Object.entries({ compartir: nPalo('compartir'), individuales: nPalo('individuales'), postres: nPalo('postres'), bebestibles: nPalo('bebestibles') })) {
        await page.click(`.br-chip[data-id="${palo}"]`); await page.waitForTimeout(700);
        const c = await contador(page);
        chequea(t + `el palo «${palo}» tiene ${esperado} cartas`, c === `1 de ${esperado}`, c);
      }
      // Secciones de Bebestibles: cada chip filtra exactamente su cantidad, y sus números suman el palo
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
      // Cambiar de palo reinicia la sección; los palos de una sola sección no ofrecen segunda fila
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

      // Lista rápida con todo
      await page.click('.br-chip--todo'); await page.waitForTimeout(500);
      await page.click('#abrir-lista'); await page.waitForTimeout(500);
      const nl = await page.evaluate(() => document.querySelectorAll('.br-hoja__item').length);
      chequea(t + `la lista rápida muestra las ${productos.length} cartas`, nl === productos.length, nl);

      const fallidasReales = log.fallidas.filter((u) => !ruidoConocido(u));
      // El navegador reporta cada recurso que falla como «Failed to load resource…» sin URL: se descartan solo si TODAS las fallidas son el video conocido.
      const consolaReal = log.consola.filter((m) => !(fallidasReales.length === 0 && /Failed to load resource/.test(m)));
      const errores = log.errores.concat(consolaReal, fallidasReales);
      chequea(t + 'sin errores de JavaScript ni peticiones fallidas (salvo el video del hero, aún ausente)', errores.length === 0, errores.slice(0, 5));
      await ctx.close();
    }
  } finally { await browser.close(); }
  console.log(`\nTOTAL ${ok + mal} comprobaciones · ${ok} OK · ${mal} con falla`);
  process.exit(mal ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
