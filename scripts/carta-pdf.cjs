// Genera la carta tradicional en PDF (assets/carta/carta-tirua.pdf) desde carta.html con el estilo de impresión.
// Uso: node scripts/carta-pdf.cjs   (servidor: python3 servir.py; BASE=http://127.0.0.1:4195/ por defecto)
const { lanzar, BASE, path } = require('../pruebas/_lib.cjs');
const SALIDA = path.join(__dirname, '..', 'assets', 'carta', 'carta-tirua.pdf');
(async () => {
  const browser = await lanzar();
  try {
    const page = await (await browser.newContext()).newPage();
    await page.goto(BASE + 'carta.html', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: SALIDA, format: 'A4', printBackground: false, preferCSSPageSize: true, displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;font:8px Georgia,serif;color:#666;text-align:center">Tirúa Bar-Restorán · Pirque · página <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
      margin: { top: '16mm', bottom: '18mm', left: '15mm', right: '15mm' },
    });
    console.log('PDF:', SALIDA);
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
