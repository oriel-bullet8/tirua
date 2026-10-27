// Segunda vuelta de diseño (titulares ahora en Young Serif), categorías con foto, reservas, mapa de Google y vista previa de pedidos.
// Emulación (Chromium headless). Uso: BASE=http://127.0.0.1:4195/ node pruebas/vuelta2.cjs
const L = require('./_lib.cjs');
let total = 0, fallas = 0;
const ok = (c, msg, det) => { total++; if (!c) fallas++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + msg + (det !== undefined ? ' → ' + det : '')); };

(async () => {
  const b = await L.lanzar();
  for (const [w, h, movil] of [[320, 640, true], [390, 844, true], [768, 1024, false], [1440, 900, false]]) {
    const t = `${w}×${h}`;
    const { ctx, page, log } = await L.contexto(b, movil ? { viewport: { width: w, height: h }, hasTouch: true, isMobile: true } : { viewport: { width: w, height: h } });
    const hosts = new Set();
    page.on('request', (r) => { const u = r.url(); if (!u.startsWith(L.BASE) && !u.startsWith('data:')) hosts.add(new URL(u).host); });
    await page.goto(L.BASE + 'index.html', { waitUntil: 'load' });
    // recorre la página para que se revelen los bloques y carguen las imágenes diferidas
    for (let y = 0; y < 9000; y += 500) { await page.evaluate((v) => scrollTo(0, v), y); await L.esperar(120); }
    await L.esperar(2500);
    const r = await page.evaluate(() => {
      const q = (s) => [...document.querySelectorAll(s)];
      const ancho = (sel) => q(sel).every((e) => e.scrollWidth <= e.clientWidth + 1);
      const partidas = (sel) => { // palabra partida: se mide con overflow-wrap normal
        const out = []; q(sel).forEach((e) => { const o = e.style.overflowWrap; e.style.overflowWrap = 'normal'; if (e.scrollWidth > e.clientWidth + 1) out.push(e.textContent.trim()); e.style.overflowWrap = o; }); return out; };
      const ifr = document.querySelector('[data-mapa-iframe]');
      return {
        scrollW: document.documentElement.scrollWidth, W: document.documentElement.clientWidth,
        fuente: document.fonts.check('400 40px "Young Serif"'), fuenteTit: getComputedStyle(document.querySelector('.titular')).fontFamily.split(',')[0],
        cats: q('.cat__img').map((i) => ({ ok: i.complete && i.naturalWidth > 0, alt: i.alt })),
        pendiente: q('.cat__rotulo').length,
        pasos: q('.reservas__paso').map((e) => e.textContent.trim()),
        pasosCaben: ancho('.reservas__titulo'),
        ifr: ifr && { src: ifr.src, titulo: ifr.title, lazy: ifr.loading, w: Math.round(ifr.getBoundingClientRect().width), h: Math.round(ifr.getBoundingClientRect().height) },
        pedido: q('.pedido__enlace').map((a) => ({ href: a.href, target: a.target, rel: a.rel, label: a.getAttribute('aria-label'), foto: a.querySelector('img') && a.querySelector('img').complete && a.querySelector('img').naturalWidth > 0 })),
        nombresPartidos: partidas('.pedido__nombre, .cat__nombre, .sede__nombre, .delivery__titulo, .titular'),
        sedeIzq: q('.sede__datos dd').every((e) => getComputedStyle(e).textAlign === 'left' || getComputedStyle(e).textAlign === 'start'),
        cta: q('[data-reservas-cta]').map((a) => a.getAttribute('href'))
      };
    });
    ok(r.scrollW <= r.W, `[${t}] sin desplazamiento horizontal`, `${r.scrollW}/${r.W}`);
    ok(r.fuente && /Young Serif/.test(r.fuenteTit), `[${t}] titulares con Young Serif cargada`, r.fuenteTit);
    ok(r.cats.length === 4 && r.cats.every((c) => c.ok && c.alt.length > 5) && r.pendiente === 0, `[${t}] 4 categorías con foto cargada, con alt y sin «Foto pendiente»`, JSON.stringify(r.cats.map((c) => c.ok)));
    ok(JSON.stringify(r.pasos) === JSON.stringify(['Personas', 'Fecha', 'Hora']) && r.pasosCaben && r.cta[0] === 'reservar.html', `[${t}] reservas: Personas → Fecha → Hora, dentro del ancho y con enlace a reservar.html`, r.pasos.join(' · '));
    ok(r.ifr && /^https:\/\/www\.google\.com\/maps\?/.test(r.ifr.src) && r.ifr.titulo.length > 10 && r.ifr.lazy === 'lazy' && r.ifr.w > 250 && r.ifr.h > 300, `[${t}] mapa de Google incrustado, con título, carga diferida y tamaño útil`, JSON.stringify(r.ifr));
    ok(r.pedido.length === 8 && r.pedido.every((p) => p.target === '_blank' && /noopener/.test(p.rel) && /getjusto\.com/.test(p.href) && p.foto && /Abre la plataforma/.test(p.label)), `[${t}] delivery: 8 productos reales que abren la plataforma en otra pestaña (noopener) y con foto`, r.pedido.length);
    ok(r.nombresPartidos.length === 0, `[${t}] ningún nombre ni titular se parte a mitad de palabra`, r.nombresPartidos.join(', ') || 'ninguno');
    ok(r.sedeIzq, `[${t}] los datos del local van alineados a la izquierda`, '');
    const extra = [...hosts].filter((x) => !L.MAPAS.test('https://' + x + '/'));
    ok(extra.length === 0, `[${t}] único tercero: Google Maps`, [...hosts].join(', '));
    ok(log.errores.length === 0, `[${t}] 0 errores de JavaScript`, JSON.stringify(log.errores));
    await ctx.close();
  }
  await b.close();
  console.log(`\nTOTAL ${total} comprobaciones · ${total - fallas} OK · ${fallas} con falla`);
  process.exit(fallas ? 1 : 0);
})();
