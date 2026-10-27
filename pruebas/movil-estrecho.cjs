// Móvil estrecho y de poca altura: la cabecera y las herramientas de la carta no se recortan, el nombre del naipe no se parte a
// mitad de palabra y, al llegar a #carta, el naipe, la descripción y las flechas se ven sin desplazar.
// Es una prueba de EMULACIÓN (viewport + táctil en Chromium headless), no de teléfonos reales ni de la barra del navegador.
// Uso: BASE=http://127.0.0.1:4195/ node pruebas/movil-estrecho.cjs
const L = require('./_lib.cjs');

// [ancho, alto, ¿las flechas deben verse sin desplazar?]. 320×568 (iPhone SE de 1.ª generación) no puede: se mide y se documenta.
// 280 px (pantalla exterior de un plegable) queda fuera: el título y el rótulo no caben juntos (se documenta como límite).
const TAMANOS = [[320, 568, false], [320, 640, true], [360, 640, true], [375, 667, true], [390, 664, true], [390, 844, true], [412, 740, true]];
let total = 0, fallas = 0;
const ok = (c, msg, det) => { total++; if (!c) fallas++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + msg + (det !== undefined ? ' → ' + det : '')); };

(async () => {
  const b = await L.lanzar();
  for (const [w, h, flechas] of TAMANOS) {
    const { ctx, page, log } = await L.contexto(b, { viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const t = `${w}×${h}`;
    await page.goto(L.BASE + 'index.html', { waitUntil: 'load' });
    await page.evaluate(() => { location.hash = '#carta'; });
    await L.esperar(4500); // apertura de la baraja
    const g = await page.evaluate(() => {
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; };
      return { W: document.documentElement.clientWidth, H: innerHeight, scrollW: document.documentElement.scrollWidth,
        rotulo: r('#rotulo'), lista: r('#abrir-lista'), buscar: r('.br-buscador__campo'), titulo: r('#carta-titulo'),
        tituloAncho: (() => { const e = document.querySelector('#carta-titulo'); return { caja: e.clientWidth, texto: e.scrollWidth }; })(),
        bajada: getComputedStyle(document.querySelector('#carta .seccion__bajada')), bajadaR: r('#carta .seccion__bajada'),
        card: r('.br-card.br-is-active'), desc: r('#p-desc'), next: r('#next'), prev: r('#prev'), panel: r('#panel') };
    });
    ok(g.scrollW <= g.W, `[${t}] sin desplazamiento horizontal`, `scrollWidth ${g.scrollW} / ancho ${g.W}`);
    for (const k of ['rotulo', 'lista', 'buscar', 'titulo']) ok(g[k] && g[k].l >= -0.5 && g[k].r <= g.W + 0.5, `[${t}] «${k}» dentro del ancho (sin recorte)`, g[k] && `${Math.round(g[k].l)}…${Math.round(g[k].r)}`);
    ok(g.tituloAncho.texto <= g.tituloAncho.caja + 1, `[${t}] el título «Carta» cabe en su columna (no pisa el rótulo)`, `texto ${g.tituloAncho.texto}px / caja ${g.tituloAncho.caja}px`);
    const bajadaVisible = g.bajada.position !== 'absolute';
    if (bajadaVisible) ok(g.bajadaR.r <= g.W + 0.5, `[${t}] la bajada de la carta cabe en el ancho`, Math.round(g.bajadaR.r));
    else ok(h <= 760, `[${t}] la bajada solo pasa a lectores de pantalla con poca altura (≤760)`, `alto ${h}`);
    ok(g.card.b <= g.H, `[${t}] el naipe activo se ve completo sin desplazar`, `borde inferior ${Math.round(g.card.b)} / alto ${g.H}`);
    ok(g.desc.b <= g.H, `[${t}] la descripción se ve sin desplazar`, `borde inferior ${Math.round(g.desc.b)} / alto ${g.H}`);
    if (flechas) ok(g.next.b <= g.H && g.prev.b <= g.H, `[${t}] las flechas se ven sin desplazar`, `borde inferior ${Math.round(g.next.b)} / alto ${g.H}`);
    else console.log(`INFO  [${t}] flechas en ${Math.round(g.next.b)} px de ${g.H} (límite físico: hace falta desplazar; no se exige)`);

    // 8 cartas: nombre sin palabra partida (se mide con overflow-wrap normal), tamaños mínimos y precio legible
    await page.addStyleTag({ content: '.br-nombre{overflow-wrap:normal !important;-webkit-line-clamp:unset !important;display:block !important;overflow:visible !important}' });
    const filas = [];
    for (let i = 0; i < 8; i++) {
      filas.push(await page.evaluate(() => {
        const c = document.querySelector('.br-card.br-is-active'), n = c.querySelector('.br-nombre'), p = c.querySelector('.br-precio');
        return { nombre: n.textContent.trim(), partida: n.scrollWidth > n.clientWidth + 1, fsN: parseFloat(getComputedStyle(n).fontSize), fsP: parseFloat(getComputedStyle(p).fontSize), cw: Math.round(c.getBoundingClientRect().width) };
      }));
      await page.evaluate(() => document.querySelector('#next').click());
      await L.esperar(900);
    }
    ok(filas.every((f) => !f.partida), `[${t}] ningún nombre se parte a mitad de palabra (8 cartas, naipe de ${filas[0].cw}px)`, filas.filter((f) => f.partida).map((f) => f.nombre).join(', ') || 'ninguno');
    ok(filas.every((f) => f.fsN >= 13 && f.fsP >= 18), `[${t}] tamaños: nombre ≥13px y precio ≥18px`, `nombre ${filas[0].fsN}px · precio ${filas[0].fsP}px`);
    ok(log.errores.length === 0, `[${t}] 0 errores de JavaScript`, JSON.stringify(log.errores));
    await ctx.close();
  }
  await b.close();
  console.log(`\nTOTAL ${total} comprobaciones · ${total - fallas} OK · ${fallas} con falla`);
  process.exit(fallas ? 1 : 0);
})();
