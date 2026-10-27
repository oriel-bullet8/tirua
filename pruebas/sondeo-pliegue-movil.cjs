// Compara qué se ve sin desplazar (pliegue) en 390x844 al llegar a la carta: sitio (#carta) vs demo aprobada (carga inicial).
// Uso: node pruebas/sondeo-pliegue-movil.cjs [urlSitio] [urlDemo]   (solo lectura; el sitio se abre por #carta y por clic en el menú «Carta»)
const { lanzar, contexto, esperar, BASE } = require('./_lib.cjs');
const sitio = process.argv[2] || BASE, demo = process.argv[3] || 'http://127.0.0.1:4198/';
const medir = () => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), vis: getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]') }; };
  return { innerH: innerHeight, scrollY: Math.round(scrollY), cab: r('.cabecera') || r('header'), escena: r('#escena'), desc: r('#p-desc'), prev: r('#prev'), next: r('#next'), contador: r('#contador'), buscar: r('#buscar'), chips: r('#chips') };
};
(async () => {
  const b = await lanzar();
  for (const [nombre, url, via] of [['sitio-hash', sitio + '#carta', 'hash'], ['sitio-menu', sitio, 'menu'], ['demo', demo, 'carga']]) {
    const { ctx, page } = await contexto(b, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await page.goto(url);
    if (via === 'menu') {
      await page.click('[data-menu-boton]'); await esperar(400);
      await page.click('#menu-principal a[href="#carta"]');
    }
    await page.waitForFunction(() => document.querySelector('#carta, .br-carta, #baraja') && (document.querySelector('.br-is-open') || document.querySelector('[class*="is-open"]')), null, { timeout: 15000 }).catch(() => {});
    await esperar(2000);
    const m = await page.evaluate(medir);
    console.log(nombre, JSON.stringify(m));
    await ctx.close();
  }
  await b.close();
})();
