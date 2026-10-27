// Comprueba por HTTP que los recursos críticos del sitio respondan 200 (el fallo de los 404 en js/ y css/ se vio primero aquí).
// Uso: node pruebas/recursos.cjs   (servidor: python3 servir.py; BASE=http://127.0.0.1:4195/ por defecto)
// El video del hero (assets/video/hero.mp4) está AUSENTE a propósito: es una advertencia conocida, no un fallo.
const fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:4195/';
const RAIZ = path.resolve(__dirname, '..');
const CONOCIDAS = new Set(['assets/video/hero.mp4', 'assets/video/hero-vertical.mp4']);

function archivos(dir, exts) {
  const salida = [];
  for (const e of fs.readdirSync(path.join(RAIZ, dir), { withFileTypes: true })) {
    const rel = dir + '/' + e.name;
    if (e.isDirectory()) salida.push(...archivos(rel, exts));
    else if (!exts || exts.some((x) => e.name.endsWith(x))) salida.push(rel);
  }
  return salida;
}

(async () => {
  const urls = new Set(['', 'index.html', 'reservar.html']);
  for (const d of ['js', 'css']) archivos(d).forEach((f) => urls.add(f));
  ['datos/instagram.json', 'datos/instagram.demo.json'].forEach((f) => urls.add(f));   // los lee js/historias.js
  archivos('assets').filter((f) => !/\.DS_Store$/.test(f)).forEach((f) => urls.add(f));
  for (const pag of ['index.html', 'reservar.html']) {
    const html = fs.readFileSync(path.join(RAIZ, pag), 'utf8');
    for (const m of html.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^"]*)?"/g)) if (!/^(https?:|mailto:|tel:|data:)/.test(m[1])) urls.add(m[1]);
  }
  let fallos = 0, conocidas = 0, n = 0;
  for (const u of [...urls].sort()) {
    const r = await fetch(BASE + u);
    await r.arrayBuffer();
    n++;
    if (r.status === 200) continue;
    if (CONOCIDAS.has(u)) { conocidas++; console.log('AVISO  ' + r.status + ' ' + u + ' (advertencia conocida)'); continue; }
    fallos++; console.log('FALLA  ' + r.status + ' ' + u);
  }
  const dir = await fetch(BASE + 'js/'); await dir.arrayBuffer();
  console.log(`js/ (listado de directorio): ${dir.status}`);
  console.log(`${n} recursos revisados · ${n - fallos - conocidas} con 200 · ${conocidas} advertencia(s) conocida(s) · ${fallos} fallo(s)`);
  process.exit(fallos ? 1 : 0);
})().catch((e) => { console.error('No se pudo consultar ' + BASE + ' → ' + e.message + '\n¿Está corriendo `python3 servir.py`?'); process.exit(2); });
