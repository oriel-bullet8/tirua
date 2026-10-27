// Campaña de clics mezclados sobre la baraja integrada (sitio, 127.0.0.1:4195). Cuenta botones movidos, clics fuera del botón y listeners no disparados.
// Uso: node pruebas/baraja-campana.cjs <movil|escritorio> <N> [--cpu=4] [--fria] [--fresco] [--out=archivo.json]
//   (por defecto replica el test original: coordenadas de #prev/#next calculadas UNA vez; --fresco las recalcula por clic)
const { lanzar, contexto, esperar, BASE, path, fs } = require('./_lib.cjs');
const [, , disp = 'movil', Ns = '40', ...flags] = process.argv;
const N = parseInt(Ns, 10);
const cpu = parseInt((flags.find(f => f.startsWith('--cpu=')) || '--cpu=1').split('=')[1], 10);
const fria = flags.includes('--fria'), fresco = flags.includes('--fresco');
const outArg = (flags.find(f => f.startsWith('--out=')) || '').split('=')[1];
const vp = disp === 'movil' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const touch = disp === 'movil';
const patron = [1, 1, -1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, -1];
const NCARTAS = 8;   // 8 bebestibles reales (antes 7 de muestra)
const clamp = (x) => Math.max(0, Math.min(NCARTAS - 1, x));

const sonda = () => {
  const q = id => { const r = document.getElementById(id).getBoundingClientRect(); return { x: +(r.left + r.width / 2).toFixed(1), y: +(r.top + r.height / 2).toFixed(1), l: +r.left.toFixed(1), t: +r.top.toFixed(1) }; };
  const c = document.getElementById('carta').classList;
  return { prev: q('prev'), next: q('next'), sy: Math.round(scrollY), docH: document.documentElement.scrollHeight, fase: ['is-closed', 'is-opening', 'is-open'].find(k => c.contains('br-'+k)), cont: document.getElementById('contador').textContent, vv: window.visualViewport ? [visualViewport.scale, visualViewport.offsetLeft, visualViewport.offsetTop] : null };
};

async function corrida(browser, k) {
  const { ctx, page } = await contexto(browser, { viewport: vp, hasTouch: touch, isMobile: touch });
  const cdp = await ctx.newCDPSession(page);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const res = { corrida: k, disp, cpu, fria, fresco, fallos: [], clics: [] };
  await page.goto(BASE);
  await page.evaluate(() => { const e = document.querySelector('#escena'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 110, behavior: 'instant' }); });
  await page.waitForFunction(() => document.querySelector('#carta').classList.contains('br-is-open'), null, { timeout: 15000 });
  await esperar(fria ? 60 : 900);
  await page.evaluate(() => { window.__ev = []; ['prev', 'next'].forEach(id => document.getElementById(id).addEventListener('click', () => window.__ev.push({ id, cont: document.getElementById('contador').textContent, ad: document.getElementById(id).getAttribute('aria-disabled'), fase: ['is-closed', 'is-opening', 'is-open'].find(k => document.getElementById('carta').classList.contains('br-'+k)) }), true)); });
  // centrar como el test original y calcular coordenadas UNA vez
  await page.evaluate(() => { const e = document.querySelector('#escena'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 110, behavior: 'instant' }); });
  await esperar(120);
  const base = await page.evaluate(sonda);
  const tramo = async (nombre, dirs, esperadoIni) => {
    let esp = esperadoIni;
    const antesEv = await page.evaluate(() => window.__ev.length);
    for (let i = 0; i < dirs.length; i++) {
      const d = dirs[i];
      const pre = await page.evaluate(sonda);
      const bt = d > 0 ? (fresco ? pre.next : base.next) : (fresco ? pre.prev : base.prev);
      const hit = await page.evaluate(([x, y, id]) => { const e = document.elementFromPoint(x, y); const b = document.getElementById(id); return { tag: e ? (e.id || e.className || e.tagName) : null, esBoton: !!(e && (e === b || b.contains(e))) }; }, [bt.x, bt.y, d > 0 ? 'next' : 'prev']);
      const nEv0 = await page.evaluate(() => window.__ev.length);
      await page.mouse.click(bt.x, bt.y);
      const nEv1 = await page.evaluate(() => window.__ev.length);
      esp = clamp(esp + d);
      const movio = Math.abs(pre.next.y - base.next.y) > 0.5 || Math.abs(pre.next.x - base.next.x) > 0.5 || Math.abs(pre.prev.y - base.prev.y) > 0.5 || Math.abs(pre.prev.x - base.prev.x) > 0.5;
      const reg = { tramo: nombre, i, d, xy: [bt.x, bt.y], hit, listener: nEv1 - nEv0, movio, sy: pre.sy, fase: pre.fase, contAntes: pre.cont, prevBtn: [pre.prev.x, pre.prev.y], nextBtn: [pre.next.x, pre.next.y], vv: pre.vv };
      res.clics.push(reg);
      if (!hit.esBoton || nEv1 - nEv0 !== 1 || movio) res.fallos.push(Object.assign({ motivo: !hit.esBoton ? 'clic fuera del botón (elementFromPoint)' : nEv1 - nEv0 !== 1 ? 'listener no disparado' : 'botón se movió' }, reg));
    }
    await esperar(1100);
    const fin = await page.evaluate(() => document.getElementById('contador').textContent);
    const ok = fin === `${esp + 1} de ${NCARTAS}`;
    res[nombre] = { esperado: `${esp + 1} de ${NCARTAS}`, obtenido: fin, ok };
    if (!ok) res.fallos.push({ motivo: 'estado final distinto del esperado', tramo: nombre, esperado: `${esp + 1} de ${NCARTAS}`, obtenido: fin, eventosListener: (await page.evaluate(() => window.__ev)).slice(antesEv) });
    return esp;
  };
  res.base = base;
  let e = 0;
  e = await tramo('veinte_siguiente', Array(20).fill(1), e);
  e = await tramo('veinte_anterior', Array(20).fill(-1), e);
  e = await tramo('veinte_mezclados', patron, e);
  res.ok = res.veinte_siguiente.ok && res.veinte_anterior.ok && res.veinte_mezclados.ok;
  res.clicsFueraBoton = res.clics.filter(c => !c.hit.esBoton).length;
  res.clicsSinListener = res.clics.filter(c => c.listener !== 1).length;
  res.clicsBotonMovido = res.clics.filter(c => c.movio).length;
  res.clics = res.fallos.length ? res.clics : undefined; // solo se guarda el detalle completo de corridas con fallo
  await ctx.close();
  return res;
}

(async () => {
  const b = await lanzar();
  const R = [];
  for (let k = 0; k < N; k++) {
    let r;
    try { r = await corrida(b, k); }
    catch (e) { // un error de la corrida (p. ej. el mazo no se abrió en 15 s) cuenta como FALLA; no se oculta ni aborta la campaña
      r = { corrida: k, disp, ok: false, fallos: [{ motivo: 'excepción en la corrida: ' + String(e).split('\n')[0] }], clicsFueraBoton: 0, clicsSinListener: 0, clicsBotonMovido: 0 };
    }
    R.push(r);
    process.stdout.write(`${disp} cpu${cpu}${fria ? ' fria' : ''}${fresco ? ' fresco' : ''} #${k}: ${r.ok ? 'OK' : 'FALLA'} (fuera:${r.clicsFueraBoton} sinListener:${r.clicsSinListener} movido:${r.clicsBotonMovido})\n`);
  }
  await b.close();
  const pas = R.filter(r => r.ok).length;
  const resumen = { disp, cpu, fria, fresco, N, pasan: pas, fallan: N - pas, conBotonMovido: R.filter(r => r.clicsBotonMovido > 0).length, conClicFuera: R.filter(r => r.clicsFueraBoton > 0).length, conClicSinListener: R.filter(r => r.clicsSinListener > 0).length };
  console.log('RESUMEN ' + JSON.stringify(resumen));
  const out = outArg || path.join(__dirname, 'resultados', `campana-${disp}-cpu${cpu}${fria ? '-fria' : ''}${fresco ? '-fresco' : ''}.json`);
  fs.writeFileSync(out, JSON.stringify({ resumen, corridas: R }, null, 1));
})();
