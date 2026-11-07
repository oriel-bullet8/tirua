// Prueba de carta.html: todos los productos de la captura de Justo aparecen, con su foto, descripción y precio, en su bloque y sección.
// Uso: node pruebas/carta-pagina.cjs   (servidor: python3 servir.py; BASE=http://127.0.0.1:4195/ por defecto)
// Referencia: archivo/2026-11-07-justo/carta-justo-2026-11-07.json (o CARTA_FUENTE=<ruta al json>); si no existe, solo se comprueba la coherencia interna.
const { lanzar, contexto, BASE, fs, path } = require('./_lib.cjs');

const RAIZ = path.join(__dirname, '..');
const FUENTE = process.env.CARTA_FUENTE || path.join(RAIZ, 'archivo', '2026-11-07-justo', 'carta-justo-2026-11-07.json');
let ok = 0, mal = 0;
function chequea(nombre, cond, detalle) {
  if (cond) { ok++; console.log('OK    ' + nombre); } else { mal++; console.log('FALLA ' + nombre + (detalle !== undefined ? ' → ' + JSON.stringify(detalle) : '')); }
}

(async () => {
  const ref = fs.existsSync(FUENTE) ? JSON.parse(fs.readFileSync(FUENTE, 'utf8')) : null;
  const prods = ref ? ref.productos.filter((p) => p.secciones.length) : null;
  const browser = await lanzar();
  try {
    for (const [nombre, w, h] of [['320×640', 320, 640], ['390×844', 390, 844], ['768×1024', 768, 1024], ['1440×900', 1440, 900]]) {
      const { ctx, page, log } = await contexto(browser, { viewport: { width: w, height: h } });
      await page.goto(BASE + 'carta.html', { waitUntil: 'networkidle' });
      // Fuerza la carga de todas las fotos diferidas
      await page.evaluate(async () => {
        for (const i of document.images) i.loading = 'eager';
        await Promise.all([...document.images].map((i) => i.decode().catch(() => null)));
      });
      const d = await page.evaluate(() => {
        const items = [...document.querySelectorAll('.cp-item')];
        return {
          n: items.length,
          fotos: items.filter((li) => li.querySelector('img')).length,
          rotas: [...document.images].filter((i) => !i.naturalWidth).length,
          sinNombre: items.filter((li) => !li.querySelector('.cp-item__nombre').textContent.trim()).length,
          bloques: [...document.querySelectorAll('.cp-bloque')].map((b) => ({ id: b.id, n: b.querySelectorAll('.cp-item').length, secs: [...b.querySelectorAll('.cp-sec__titulo')].map((t) => t.firstChild.textContent) })),
          chips: [...document.querySelectorAll('.cp-nav__chip')].map((a) => a.getAttribute('href')),
          ancho: document.documentElement.scrollWidth, vw: innerWidth,
          nombres: items.map((li) => li.querySelector('.cp-item__nombre').textContent),
          precios: items.map((li) => { const p = li.querySelector('.cp-item__precio'); return p ? p.textContent : null; }),
          descs: items.map((li) => { const p = li.querySelector('.cp-item__desc'); return p ? p.textContent : null; }),
          sinH1: document.querySelectorAll('h1').length,
          navActual: (document.querySelector('[data-nav] [aria-current="page"]') || {}).textContent,
        };
      });
      const t = '[' + nombre + '] ';
      chequea(t + 'sin errores de JavaScript ni peticiones fallidas', log.errores.length === 0 && log.consola.length === 0 && log.fallidas.length === 0, { e: log.errores, c: log.consola, f: log.fallidas });
      chequea(t + 'sin desbordamiento horizontal', d.ancho <= d.vw, { ancho: d.ancho, vw: d.vw });
      chequea(t + 'ninguna imagen rota', d.rotas === 0, d.rotas);
      chequea(t + 'un solo h1 y el menú lleva a la baraja del inicio', d.sinH1 === 1, { h1: d.sinH1 });
      chequea(t + 'seis bloques con su acceso en la barra', d.bloques.length === 6 && d.chips.length === 6 && d.chips.every((c, i) => c === '#' + d.bloques[i].id), d.chips);
      if (prods) {
        chequea(t + `muestra los ${prods.length} productos de carta de Justo`, d.n === prods.length, { n: d.n, esperado: prods.length });
        chequea(t + `${prods.filter((p) => p.foto).length} con foto, ${d.fotos} en la página`, d.fotos === prods.filter((p) => p.foto).length);
        const ordenados = (a) => [...a].sort();
        chequea(t + 'los nombres coinciden uno a uno con Justo', JSON.stringify(ordenados(d.nombres)) === JSON.stringify(ordenados(prods.map((p) => p.nombre.trim()))));
        const conDesc = prods.filter((p) => p.descripcion && p.descripcion.trim()).length;
        chequea(t + `descripciones: ${conDesc} en Justo, ${d.descs.filter(Boolean).length} en la página`, d.descs.filter(Boolean).length === conDesc);
        const conPrecio = prods.filter((p) => p.precio).length;
        chequea(t + `precios: ${conPrecio} en Justo, ${d.precios.filter(Boolean).length} en la página`, d.precios.filter(Boolean).length === conPrecio);
        // precio de un producto conocido con formato chileno
        const entr = prods.find((p) => p.nombre === 'Entraña');
        chequea(t + 'formato de precio chileno ($26.900)', entr && d.precios[d.nombres.indexOf('Entraña')] === '$' + String(entr.precio).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
        // cada producto cae en la sección que Justo le dio
        const secPorProd = await page.evaluate(() => { const m = {}; document.querySelectorAll('.cp-sec').forEach((s) => { const t = s.querySelector('.cp-sec__titulo').firstChild.textContent; s.querySelectorAll('.cp-item__nombre').forEach((n) => { (m[n.textContent] = m[n.textContent] || []).push(t); }); }); return m; });
        const norm = (x) => x === 'Entradas Frias' ? 'Entradas frías' : x === 'Shop' ? 'Schop' : x;
        const malas = prods.filter((p) => !(secPorProd[p.nombre.trim()] || []).includes(norm(p.secciones[0]))).map((p) => p.nombre);
        chequea(t + 'cada producto está en la sección que le dio Justo', malas.length === 0, malas.slice(0, 5));
      }
      await ctx.close();
    }

    // Buscador, barra y menú (escritorio y móvil)
    for (const [nombre, w, h] of [['1440×900', 1440, 900], ['390×844', 390, 844]]) {
      const { ctx, page, log } = await contexto(browser, { viewport: { width: w, height: h } });
      await page.goto(BASE + 'carta.html', { waitUntil: 'networkidle' });
      const t = '[' + nombre + '] ';
      await page.fill('[data-cp-buscar]', 'Pisco sour');
      const r = await page.evaluate(() => ({ visibles: [...document.querySelectorAll('.cp-item')].filter((li) => !li.hidden).length, bloquesVisibles: [...document.querySelectorAll('.cp-bloque')].filter((b) => !b.hidden).length, chipsVisibles: [...document.querySelectorAll('.cp-nav__lista li')].filter((li) => !li.hidden).length }));
      chequea(t + 'buscar «Pisco sour» deja solo coincidencias y oculta bloques vacíos', r.visibles > 0 && r.visibles < 40 && r.bloquesVisibles >= 1 && r.bloquesVisibles < 6 && r.chipsVisibles === r.bloquesVisibles, r);
      await page.fill('[data-cp-buscar]', 'zzzzzz');
      const vac = await page.evaluate(() => ({ aviso: !document.querySelector('[data-cp-vacio]').hidden, visibles: [...document.querySelectorAll('.cp-item')].filter((li) => !li.hidden).length }));
      chequea(t + 'búsqueda sin resultados muestra el aviso', vac.aviso && vac.visibles === 0, vac);
      await page.fill('[data-cp-buscar]', 'tequila');
      const acentos = await page.evaluate(() => [...document.querySelectorAll('.cp-item')].filter((li) => !li.hidden).length);
      await page.fill('[data-cp-buscar]', 'TEQUILA');
      const mayus = await page.evaluate(() => [...document.querySelectorAll('.cp-item')].filter((li) => !li.hidden).length);
      chequea(t + 'la búsqueda no distingue mayúsculas', acentos === mayus && acentos > 0, { acentos, mayus });
      await page.fill('[data-cp-buscar]', 'cafe');
      const sinTilde = await page.evaluate(() => [...document.querySelectorAll('.cp-item__nombre')].filter((n) => !n.closest('.cp-item').hidden).map((n) => n.textContent));
      chequea(t + '«cafe» sin tilde encuentra productos con «café»', sinTilde.length > 0, sinTilde.slice(0, 4));
      await page.fill('[data-cp-buscar]', '');
      const todos = await page.evaluate(() => [...document.querySelectorAll('.cp-item')].filter((li) => !li.hidden).length);
      chequea(t + 'vaciar la búsqueda restituye todo', todos === (prods ? prods.length : todos));

      // Un acceso de la barra lleva a su bloque, y la barra no tapa el título
      await page.click('.cp-nav__chip[href="#bloque-cervezas"]');
      await page.evaluate(() => new Promise((res) => { let ult = -1, quieto = 0; const t = setInterval(() => { if (scrollY === ult) { if (++quieto >= 6) { clearInterval(t); res(); } } else { quieto = 0; ult = scrollY; } }, 100); }));
      const pos = await page.evaluate(() => { const t = document.querySelector('#bloque-cervezas-t').getBoundingClientRect(); const b = document.querySelector('[data-cp-barra]').getBoundingClientRect(); return { titulo: Math.round(t.top), barraAbajo: Math.round(b.bottom), actual: (document.querySelector('.cp-nav__chip[aria-current="true"]') || {}).textContent }; });
      chequea(t + 'el acceso «Cervezas y bebidas» lleva al bloque, bajo la barra fija', pos.titulo >= pos.barraAbajo - 2 && pos.titulo < h * 0.6 && /Cervezas/.test(pos.actual || ''), pos);
      chequea(t + 'sin errores durante la interacción', log.errores.length === 0, log.errores);
      await ctx.close();
    }

    // El menú «Carta» lleva a la baraja (inicio) y el inicio ofrece el PDF tradicional
    {
      const { ctx, page } = await contexto(browser, { viewport: { width: 1440, height: 900 } });
      await page.goto(BASE, { waitUntil: 'networkidle' });
      const hrefs = await page.evaluate(() => ({ nav: [...document.querySelectorAll('[data-nav] a')].map((a) => a.getAttribute('href')), pdf: (document.querySelector('a[href$="carta-tirua.pdf"]') || {}).href }));
      chequea('[inicio] el menú «Carta» va a #carta y hay enlace al PDF', hrefs.nav.includes('#carta') && /carta-tirua\.pdf$/.test(hrefs.pdf || ''), hrefs);
      await page.goto(BASE + 'carta.html', { waitUntil: 'networkidle' });
      const ch = await page.evaluate(() => [...document.querySelectorAll('[data-nav] a')].map((a) => a.getAttribute('href')));
      chequea('[carta.html] el menú «Carta» vuelve a la baraja (index.html#carta)', ch.includes('index.html#carta') && ch.includes('index.html#mapa'), ch);
      await page.goto(BASE + 'reservar.html', { waitUntil: 'networkidle' });
      const rh = await page.evaluate(() => [...document.querySelectorAll('[data-nav] a')].map((a) => a.getAttribute('href')));
      chequea('[reservar] el menú «Carta» va a index.html#carta', rh.includes('index.html#carta'), rh);
      const r = await fetch(BASE + 'assets/carta/carta-tirua.pdf');
      const buf = Buffer.from(await r.arrayBuffer());
      chequea('[pdf] el PDF de la carta responde 200, es un PDF y pesa menos de 1 MB', r.status === 200 && buf.slice(0, 5).toString() === '%PDF-' && buf.length > 20000 && buf.length < 1e6, { estado: r.status, bytes: buf.length });
      const textoPdf = buf.toString('latin1');
      chequea('[pdf] tiene al menos 8 páginas', (textoPdf.match(/\/Type\s*\/Page[^s]/g) || []).length >= 8, (textoPdf.match(/\/Type\s*\/Page[^s]/g) || []).length);
      await ctx.close();
    }
  } finally { await browser.close(); }
  console.log(`\nTOTAL ${ok + mal} comprobaciones · ${ok} OK · ${mal} con falla`);
  process.exit(mal ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
