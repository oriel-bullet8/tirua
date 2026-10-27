// Verificación de los 8 bebestibles reales con foto (Justo) en la baraja del sitio. Solo LEE datos/justo (o TIRUA_JUSTO).
// Uso: node pruebas/baraja-fotos.cjs   (servidor: python3 servir.py; BASE=http://127.0.0.1:4195/)
//  A. datos estáticos: manifiesto ↔ carta-justo.json ↔ copias WebP (existen, abren, dimensiones, pesos, hashes de los originales)
//  B. por dispositivo emulado (móvil 390 táctil, escritorio 1440): correspondencia producto↔foto en cada carta activa, proporción sin deformar,
//     contraste y tamaño de nombre y precio, ausencia de peticiones externas/404, peso inicial y total, cabecera sin tapar (desde el bloque «Bebestibles»).
// Deja en <tmp>/tirua-fotos/ las capturas de la ventana de foto (para pruebas/comparar-fotos.py) y meta.json; las capturas de la carta van a capturas/.
const { MAPAS, lanzar, contexto, esperar, BASE, CAP, fs, path } = require('./_lib.cjs');
const crypto = require('crypto'), os = require('os');
const R = [];
function ok(grupo, nombre, cond, detalle) { R.push({ grupo, nombre, ok: !!cond, detalle: detalle === undefined ? '' : String(detalle) }); console.log((cond ? 'OK   ' : 'FALLA') + ' [' + grupo + '] ' + nombre + (detalle !== undefined && detalle !== '' ? ' → ' + detalle : '')); }
function nota(grupo, nombre, detalle) { R.push({ grupo, nombre, ok: true, nota: true, detalle: String(detalle) }); console.log('NOTA  [' + grupo + '] ' + nombre + ' → ' + detalle); }

const RAIZ = path.resolve(__dirname, '..'), JUSTO = process.env.TIRUA_JUSTO ? path.resolve(process.env.TIRUA_JUSTO) : path.resolve(RAIZ, 'datos', 'justo');   // carta-justo.json va en el repo; los originales (203 MB) no: TIRUA_JUSTO=<carpeta con originales/> los verifica
const TMP = path.join(os.tmpdir(), 'tirua-fotos');
const carta = JSON.parse(fs.readFileSync(path.join(JUSTO, 'carta-justo.json'), 'utf8'));
const man = JSON.parse(fs.readFileSync(path.join(RAIZ, 'assets', 'productos', 'manifiesto.json'), 'utf8'));
const porId = Object.fromEntries(carta.productos.map(p => [p.id, p]));
const clp = n => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
// Contraste WCAG
function rgb(c) { const m = c.match(/rgba?\(([^)]+)\)/); const v = m[1].split(',').map(x => parseFloat(x)); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; }
function lum({ r, g, b }) { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
function contraste(a, b) { const l1 = lum(rgb(a)), l2 = lum(rgb(b)); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
function dimWebp(f) { // VP8 (con pérdida) o VP8X
  const b = fs.readFileSync(f); if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const t = b.toString('ascii', 12, 16);
  if (t === 'VP8 ') return { ancho: b.readUInt16LE(26) & 0x3fff, alto: b.readUInt16LE(28) & 0x3fff, tipo: t };
  if (t === 'VP8X') return { ancho: 1 + b.readUIntLE(24, 3), alto: 1 + b.readUIntLE(27, 3), tipo: t };
  return { ancho: 0, alto: 0, tipo: t };
}

/* ===== A. Datos estáticos ===== */
function estaticos() {
  const g = 'datos';
  ok(g, 'el manifiesto lista 8 productos', man.productos.length === 8, man.productos.length);
  let total = 0;
  for (const m of man.productos) {
    const j = porId[m.id_justo], n = m.nombre;
    ok(g, `${n}: existe en carta-justo.json con el mismo nombre, precio > 0, disponible ahora, visible en la extracción, con categoría y foto descargada`,
      !!j && j.nombre === n && j.precio.final > 0 && j.precio.disponible_ahora === true && j.aparece_en_pagina_al_extraer === true && j.categorias.length > 0 && j.imagen && j.imagen.descargada === true,
      j ? `${j.precio.final} · ${j.categorias[0].nombre}` : 'sin registro');
    const orig = path.join(JUSTO, j.imagen.archivo);
    if (fs.existsSync(orig)) ok(g, `${n}: el original existe, su sha256 coincide con el JSON y con el manifiesto (intacto)`, sha(orig) === j.imagen.sha256 && j.imagen.sha256 === m.original.sha256 && fs.statSync(orig).size === j.imagen.bytes, j.imagen.archivo);
    else { ok(g, `${n}: el sha256 del JSON coincide con el del manifiesto`, j.imagen.sha256 === m.original.sha256, j.imagen.sha256.slice(0, 12)); nota(g, `${n}: original omitido (no está en esta copia; define TIRUA_JUSTO para verificarlo)`, j.imagen.archivo); }
    const copia = path.join(RAIZ, m.copia.ruta);
    const ex = fs.existsSync(copia), bytes = ex ? fs.statSync(copia).size : 0, d = ex ? dimWebp(copia) : null;
    total += bytes;
    ok(g, `${n}: la copia existe, es WebP válido y sus dimensiones y peso coinciden con el manifiesto`, ex && !!d && d.ancho === m.copia.ancho && d.alto === m.copia.alto && bytes === m.copia.bytes, ex && d ? `${d.ancho}×${d.alto} ${bytes} B` : 'falta');
    ok(g, `${n}: copia ≤1000 px en el lado mayor y ≲120 KB`, ex && Math.max(m.copia.ancho, m.copia.alto) <= 1000 && bytes <= 120 * 1024, `${Math.max(m.copia.ancho, m.copia.alto)} px, ${(bytes / 1024).toFixed(1)} KB`);
    const rO = m.original.ancho / m.original.alto, rC = m.copia.ancho / m.copia.alto;
    ok(g, `${n}: la copia conserva la proporción del original (≤0,5 %)`, Math.abs(rC / rO - 1) <= 0.005, `original ${rO.toFixed(4)} · copia ${rC.toFixed(4)} · dif ${(Math.abs(rC / rO - 1) * 100).toFixed(3)} %`);
    ok(g, `${n}: URL de origen registrada`, /^https:\/\/cuenta\.getjusto\.com\//.test(m.url_origen) && m.url_origen === j.url_origen);
  }
  ok(g, 'peso total de las 8 copias ≲1 MB', total <= 1024 * 1024 && total === man.total_bytes_copias, `${total} B (${(total / 1024).toFixed(1)} KB)`);
  nota(g, 'peso total de las copias', `${total} B`);
  const dirFotos = fs.readdirSync(path.join(RAIZ, 'assets', 'productos')).sort();
  ok(g, 'assets/productos/ contiene solo las 8 copias y el manifiesto (los originales no se copiaron al sitio)', dirFotos.length === 9 && dirFotos.filter(f => f.endsWith('.webp')).length === 8 && !dirFotos.some(f => /\.jpe?g$/i.test(f)), dirFotos.join(', '));
}

/* ===== B. Por dispositivo ===== */
const medir = () => {
  const c = document.querySelector('.br-card.br-is-active');
  const img = c.querySelector('.br-face--front .br-foto__img'), fr = c.querySelector('.br-face--front .br-franja');
  const n = fr.querySelector('.br-nombre'), p = fr.querySelector('.br-precio'), foto = c.querySelector('.br-face--front .br-foto');
  const cs = e => getComputedStyle(e), r = e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
  const m = new DOMMatrix(cs(c).transform);
  const idx = [...c.querySelectorAll('.br-face--front .br-idx')].map(r);
  return {
    valor: c.querySelector('.br-idx__v').textContent, nombre: n.textContent.trim(), precio: p.textContent.trim(), label: c.getAttribute('aria-label'),
    desc: document.querySelector('#p-desc').textContent.trim(), contador: document.querySelector('#contador').textContent,
    img: img ? { src: img.getAttribute('src'), alt: img.alt, wAttr: +img.getAttribute('width'), hAttr: +img.getAttribute('height'), nat: [img.naturalWidth, img.naturalHeight], completo: img.complete && img.naturalWidth > 0,
      box: [img.clientWidth, img.clientHeight], fit: cs(img).objectFit, pos: cs(img).objectPosition, loading: img.loading } : null,
    transformCarta: { sx: Math.hypot(m.a, m.b), sy: Math.hypot(m.c, m.d) },
    colores: { fondo: cs(fr).backgroundColor, nombre: cs(n).color, precio: cs(p).color }, opac: [+cs(n).opacity, +cs(p).opacity],
    tam: { nombre: parseFloat(cs(n).fontSize), precio: parseFloat(cs(p).fontSize) }, peso: [cs(n).fontWeight, cs(p).fontWeight],
    cortado: { nombre: n.scrollHeight > n.clientHeight + 1, precio: p.scrollWidth > p.clientWidth + 1 },
    caja: { fr: r(fr), n: r(n), p: r(p), foto: r(foto), idx },
  };
};

async function dispositivo(b, g, vp, touch) {
  fs.mkdirSync(TMP, { recursive: true });
  const { ctx, page, log } = await contexto(b, { viewport: vp, hasTouch: touch, isMobile: touch, deviceScaleFactor: 2 });
  /* --- Carga inicial (sin desplazarse): peso y fotos pedidas --- */
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const recIni = await page.evaluate(() => performance.getEntriesByType('resource').map(e => ({ u: e.name.replace(location.origin + '/', ''), b: e.encodedBodySize })));
  const docIni = await page.evaluate(() => performance.getEntriesByType('navigation')[0].encodedBodySize);
  const fotosIni = recIni.filter(x => /^assets\/productos\//.test(x.u));
  const pesoIni = recIni.reduce((a, x) => a + x.b, 0) + docIni;
  // Medido: con loading=lazy Chromium igual trae las 8 al cargar (la carta queda dentro de su umbral de distancia a la primera pantalla); se mide y se informa, no se asume.
  ok(g, 'carga inicial: la foto del As (eager) se pide; solo hay fotos de productos locales', fotosIni.some(x => /ramajito\.webp$/.test(x.u)) && fotosIni.length <= 8, `${fotosIni.length} fotos pedidas al cargar: ` + fotosIni.map(x => x.u.split('/').pop() + ' ' + x.b + ' B').join(', '));
  nota(g, 'peso inicial de la página (documento + recursos, bytes de cuerpo, sin desplazarse)', `${pesoIni} B (${(pesoIni / 1024).toFixed(0)} KB), de los cuales fotos de productos: ${fotosIni.reduce((a, x) => a + x.b, 0)} B`);
  await page.screenshot({ path: path.join(TMP, `${g}-mazo-cerrado-inicio.png`) }).catch(() => {});

  /* --- Llegada a la carta y recorrido de las 8 cartas --- */
  await page.evaluate(() => { const e = document.querySelector('#escena'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 110, behavior: 'instant' }); });
  await page.click('#abrir');   // la carta ya no se abre sola: es un portal que pasa a pantalla completa al abrirse
  await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-open'), null, { timeout: 15000 });
  await esperar(1300);
  const meta = [];
  for (let i = 0; i < 8; i++) {
    const m0 = man.productos[i], j = porId[m0.id_justo];
    await page.waitForFunction(() => { const i = document.querySelector('.br-card.br-is-active .br-face--front .br-foto__img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 8000 }).catch(() => {});
    await esperar(900);
    const m = await page.evaluate(medir);
    const t = `${g} carta ${i + 1} ${m0.nombre}`;
    ok(g, `${t}: valor, contador, nombre, precio y descripción = registro de Justo (${m0.id_justo})`,
      m.valor === (i === 0 ? 'A' : String(i + 1)) && m.contador === `${i + 1} de 8` && m.nombre === j.nombre.trim() && m.precio === clp(j.precio.final) && m.desc === j.descripcion.trim() && m.label === `Carta ${i + 1} de 8: ${j.nombre.trim()}, ${clp(j.precio.final)}`,
      JSON.stringify([m.valor, m.contador, m.nombre, m.precio]));
    ok(g, `${t}: la foto mostrada es la copia de ese producto (src del manifiesto), alt «${m0.nombre}, bebestible de la carta», con width/height de la copia`,
      m.img && m.img.src === m0.copia.ruta && m.img.alt === `${j.nombre.trim()}, bebestible de la carta` && m.img.wAttr === m0.copia.ancho && m.img.hAttr === m0.copia.alto, JSON.stringify(m.img && [m.img.src, m.img.alt, m.img.wAttr, m.img.hAttr]));
    ok(g, `${t}: la imagen cargó (naturalWidth×alto = copia) y loading=${i === 0 ? 'eager (As)' : 'lazy'}`, m.img.completo && m.img.nat[0] === m0.copia.ancho && m.img.nat[1] === m0.copia.alto && m.img.loading === (i === 0 ? 'eager' : 'lazy'), JSON.stringify([m.img.nat, m.img.loading]));
    // Sin deformar: cover (recorta, no estira); el atributo width/height tiene la proporción natural; la carta activa escala uniforme
    const [bw, bh] = m.img.box, [nw, nh] = m.img.nat, s = Math.max(bw / nw, bh / nh);
    const rn = nw / nh, ra = m.img.wAttr / m.img.hAttr, esc = Math.abs(m.transformCarta.sx / m.transformCarta.sy - 1);
    const recorte = bw / bh < rn ? 1 - (bw / bh) / rn : 1 - rn / (bw / bh);   // fracción recortada en el eje limitante
    ok(g, `${t}: foto sin deformar (object-fit: cover, proporción de atributos = natural ±1 %, escala de la carta uniforme ±1 %)`, m.img.fit === 'cover' && Math.abs(ra / rn - 1) <= 0.01 && esc <= 0.01,
      `caja ${bw}×${bh} (${(bw / bh).toFixed(3)}) · natural ${nw}×${nh} (${rn.toFixed(3)}) · contenido renderizado ${(nw * s).toFixed(1)}×${(nh * s).toFixed(1)} · recorte ${(recorte * 100).toFixed(1)} % · object-position ${m.img.pos} · escala carta ${(esc * 100).toFixed(2)} %`);
    // Legibilidad
    const cN = contraste(m.colores.nombre, m.colores.fondo), cP = contraste(m.colores.precio, m.colores.fondo);
    ok(g, `${t}: contraste AA de nombre y precio sobre la franja sólida (≥4,5:1)`, rgb(m.colores.fondo).a === 1 && cN >= 4.5 && cP >= 4.5 && m.opac[0] >= 0.99 && m.opac[1] >= 0.99, `nombre ${cN.toFixed(2)}:1 · precio ${cP.toFixed(2)}:1 · fondo ${m.colores.fondo} · opacidad ${m.opac}`);
    ok(g, `${t}: tamaño legible (nombre ≥14 px, precio ≥18 px) y peso ≥400; sin recortar; dentro de la franja y sin tocar la foto`,
      m.tam.nombre >= 14 && m.tam.precio >= 18 && m.peso.every(x => +x >= 400) && !m.cortado.nombre && !m.cortado.precio &&
      m.caja.n.l >= m.caja.fr.l - 1 && m.caja.p.r <= m.caja.fr.r + 1 && m.caja.n.t >= m.caja.fr.t - 1 && m.caja.n.b <= m.caja.fr.b + 1 && m.caja.p.t >= m.caja.fr.t - 1 && m.caja.p.b <= m.caja.fr.b + 1 &&
      m.caja.foto.b <= m.caja.fr.t + 1 && m.caja.n.r <= m.caja.p.l + 1,
      `nombre ${m.tam.nombre.toFixed(1)} px, precio ${m.tam.precio.toFixed(1)} px, peso ${m.peso}`);
    ok(g, `${t}: la ventana de foto no tapa los índices de las esquinas`, m.caja.idx.every(x => x.r <= m.caja.foto.l + 1 || x.l >= m.caja.foto.r - 1 || x.b <= m.caja.foto.t + 1 || x.t >= m.caja.foto.b - 1));
    // Capturas: ventana de foto (para comparar píxeles) y carta activa
    const carta = await page.$('.br-card.br-is-active');
    const fotoEl = await page.$('.br-card.br-is-active .br-face--front .br-foto__img');
    await fotoEl.screenshot({ path: path.join(TMP, `${g}-ventana-${i + 1}.png`) });
    await carta.screenshot({ path: path.join(TMP, `${g}-carta-${i + 1}.png`) });
    meta.push({ n: i + 1, nombre: m0.nombre, precio: clp(j.precio.final), webp: path.join(RAIZ, m0.copia.ruta), caja: m.img.box, pos: m.img.pos, nat: m.img.nat, ventana: path.join(TMP, `${g}-ventana-${i + 1}.png`), carta: path.join(TMP, `${g}-carta-${i + 1}.png`) });
    if ([1, 3, 5, 6].includes(i)) { await page.screenshot({ path: path.join(CAP, `baraja-15-${g}-carta-${i + 1}-${slug(m0.nombre)}.png`) }); }
    if (i < 7) { await page.click('#next'); }
  }
  fs.writeFileSync(path.join(TMP, `${g}-meta.json`), JSON.stringify(meta, null, 1));

  /* --- Después de recorrer todo: peso total y red --- */
  const recFin = await page.evaluate(() => performance.getEntriesByType('resource').map(e => ({ u: e.name.replace(location.origin + '/', ''), b: e.encodedBodySize })));
  const fotosFin = recFin.filter(x => /^assets\/productos\//.test(x.u));
  const pesoFin = recFin.reduce((a, x) => a + x.b, 0) + docIni;
  ok(g, 'tras recorrer la baraja: las 8 fotos pedidas una sola vez', fotosFin.length === 8 && new Set(fotosFin.map(x => x.u)).size === 8, fotosFin.length);
  nota(g, 'peso de la página tras recorrer las 8 cartas (documento + recursos, bytes de cuerpo)', `${pesoFin} B (${(pesoFin / 1024).toFixed(0)} KB); fotos ${fotosFin.reduce((a, x) => a + x.b, 0)} B`);
  const externas = log.peticiones.filter(u => !u.startsWith(BASE) && !u.startsWith('data:') && !MAPAS.test(u));
  const malas = log.fallidas.filter(u => !/assets\/video\/hero(-vertical)?\.mp4/.test(u));
  ok(g, '0 peticiones externas, 0 fallidas/404 (salvo el video del hero, aún no entregado)', externas.length === 0 && malas.length === 0, JSON.stringify({ externas, malas }));
  ok(g, '0 errores JS', log.errores.length === 0, log.errores.join('|'));
  const desb = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  ok(g, 'sin desbordamiento horizontal con las 8 fotos cargadas', desb.sw <= desb.iw, JSON.stringify(desb));

  /* --- Desde el bloque «Bebestibles» de las categorías: carta con la cabecera fija sin tapar --- */
  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.locator('.cat__enlace[data-categoria="bebestibles"]').scrollIntoViewIfNeeded();
  await page.click('.cat__enlace[data-categoria="bebestibles"]');
  await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-open'), null, { timeout: 15000 });
  await esperar(2200);
  const cab = await page.evaluate(() => { const c = document.querySelector('#carta'), a = document.querySelector('.br-card.br-is-active .br-face').getBoundingClientRect(), chip = document.querySelector('.br-chip[data-id="bebestibles"]'); return { inm: c.classList.contains('br-inm'), abierta: c.classList.contains('br-is-open'), dentro: a.left >= -1 && a.right <= innerWidth + 1 && a.top >= -1 && a.bottom <= innerHeight + 1, hash: location.hash, pressed: chip && chip.getAttribute('aria-pressed') }; });
  ok(g, 'bloque «Bebestibles» → carta: abre la baraja a pantalla completa con la carta activa a la vista, chip activo, URL #carta', cab.inm && cab.abierta && cab.dentro && cab.hash === '#carta' && cab.pressed === 'true', JSON.stringify(cab));
  await page.screenshot({ path: path.join(CAP, `baraja-16-${g}-desde-bloque-bebestibles.png`) });
  await ctx.close();
}

(async () => {
  estaticos();
  const b = await lanzar();
  await dispositivo(b, 'm390', { width: 390, height: 844 }, true);
  await dispositivo(b, 'd1440', { width: 1440, height: 900 }, false);
  await b.close();
  fs.writeFileSync(path.join(__dirname, 'resultados', 'baraja-fotos.json'), JSON.stringify(R, null, 1));
  const f = R.filter(r => !r.ok);
  console.log(`\nTOTAL ${R.length} entradas · ${f.length} con falla · material para comparar-fotos.py en ${TMP}`);
  f.forEach(r => console.log('  FALLA', r.grupo, r.nombre, r.detalle));
})();
