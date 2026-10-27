// Utilidades comunes de las pruebas (playwright-core; se instala con `npm install` en la raíz del proyecto).
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');
const BASE = process.env.BASE || 'http://127.0.0.1:4195/';
// Navegador: TIRUA_CHROMIUM=/ruta/al/ejecutable lo fuerza; si no, el de Playwright (`npx playwright-core install chromium-headless-shell`)
// y, si falta, el chrome-headless-shell más nuevo de la caché de Playwright de esta máquina.
function ejecutableEnCache() {
  const raices = [path.join(os.homedir(), 'Library/Caches/ms-playwright'), path.join(os.homedir(), '.cache/ms-playwright'), path.join(process.env.LOCALAPPDATA || '', 'ms-playwright')];
  for (const raiz of raices) {
    if (!fs.existsSync(raiz)) continue;
    const dirs = fs.readdirSync(raiz).filter((d) => d.startsWith('chromium_headless_shell-')).sort((a, b) => parseInt(b.split('-')[1]) - parseInt(a.split('-')[1]));
    for (const d of dirs) {
      for (const sub of fs.readdirSync(path.join(raiz, d))) {
        for (const nombre of ['chrome-headless-shell', 'chrome-headless-shell.exe']) {
          const exe = path.join(raiz, d, sub, nombre);
          if (fs.existsSync(exe)) return exe;
        }
      }
    }
  }
  return null;
}
// Único tercero permitido: el mapa de Google incrustado en #mapa (iframe, carga diferida). Cualquier otro host sigue contando como externo.
const MAPAS = /^https:\/\/([a-z0-9-]+\.)?(google\.com|gstatic\.com|googleapis\.com|googleusercontent\.com)\//;
const CAP = path.join(__dirname, '..', 'capturas');
fs.mkdirSync(CAP, { recursive: true });
fs.mkdirSync(path.join(__dirname, 'resultados'), { recursive: true });   // carpeta ignorada por git: no existe tras clonar
async function lanzar() {
  if (process.env.TIRUA_CHROMIUM) return chromium.launch({ executablePath: process.env.TIRUA_CHROMIUM });
  try { return await chromium.launch(); }
  catch (e) {
    const exe = ejecutableEnCache();
    if (!exe) throw new Error('No hay navegador para Playwright. Ejecuta: npx playwright-core install chromium-headless-shell  (o define TIRUA_CHROMIUM)\n' + e.message);
    return chromium.launch({ executablePath: exe });
  }
}
// Registra consola, errores de página y peticiones de una página.
function espiar(page) {
  const reg = { consola: [], errores: [], peticiones: [], fallidas: [], respuestas: [] };
  page.on('console', (m) => reg.consola.push({ tipo: m.type(), texto: m.text() }));
  page.on('pageerror', (e) => reg.errores.push(String(e)));
  page.on('request', (r) => reg.peticiones.push({ url: r.url(), metodo: r.method() }));
  page.on('requestfailed', (r) => reg.fallidas.push({ url: r.url(), fallo: r.failure() && r.failure().errorText }));
  page.on('response', (r) => reg.respuestas.push({ url: r.url(), estado: r.status() }));
  return reg;
}
async function contexto(browser, opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1440, height: 900 } }, opts));
  const page = await ctx.newPage();
  const log = { errores: [], consola: [], peticiones: [], fallidas: [] };
  page.on('pageerror', (e) => log.errores.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') log.consola.push(m.text()); });
  page.on('request', (r) => log.peticiones.push(r.url()));
  page.on('requestfailed', (r) => log.fallidas.push(r.url()));
  page.on('response', (r) => { if (r.status() >= 400) log.fallidas.push(r.status() + ' ' + r.url()); });
  return { ctx, page, log };
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
module.exports = { MAPAS, lanzar, espiar, contexto, esperar, BASE, CAP, fs, path };
