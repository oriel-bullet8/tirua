// Prueba de scripts/instagram-sync.mjs contra una API simulada en 127.0.0.1 (no usa Instagram ni red).  Uso: node --test pruebas/instagram-sync.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'instagram-sync.mjs');
const TOKEN = 'TOKEN-SECRETO-DE-PRUEBA-123';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

function servidor(modo) {
  const s = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.searchParams.get('access_token') !== TOKEN && u.pathname !== '/img.png') { res.writeHead(400, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: { message: 'Invalid OAuth access token ' + u.searchParams.get('access_token') } })); }
    if (u.pathname === '/img.png') { res.writeHead(200, { 'content-type': 'image/png' }); return res.end(PNG); }
    if (u.pathname === '/refresh_access_token') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ access_token: TOKEN, expires_in: 5184000 })); }
    if (u.pathname === '/me/media') {
      const b = `http://127.0.0.1:${s.address().port}`;
      const data = modo === 'vacio' ? [] : [
        { id: '111', caption: 'Concurso de bandas\nCada miércoles nuevas bandas #musica #pirque', media_type: 'IMAGE', media_url: b + '/img.png', permalink: 'https://www.instagram.com/p/AAA/', timestamp: '2026-10-20T20:00:00+0000' },
        { id: '222', caption: 'Open mic', media_type: 'VIDEO', thumbnail_url: b + '/img.png', media_url: 'https://cdn.example/video.mp4', permalink: 'https://www.instagram.com/reel/BBB/', timestamp: '2026-10-18T20:00:00+0000' },
        { id: '333', caption: 'Enlace malo', media_type: 'IMAGE', media_url: b + '/img.png', permalink: 'https://evil.example/p/CCC/' },
        { id: '444', caption: 'Sin imagen disponible', media_type: 'IMAGE', permalink: 'https://www.instagram.com/p/DDD/' }
      ];
      res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ data }));
    }
    res.writeHead(404); res.end();
  });
  return new Promise((ok) => s.listen(0, '127.0.0.1', () => ok(s)));
}
// Asíncrono a propósito: el servidor simulado vive en este mismo proceso y no puede responder si se bloquea el bucle de eventos.
function ejecutar(env) {
  return new Promise((ok) => execFile(process.execPath, [SCRIPT], { encoding: 'utf8', env }, (err, stdout, stderr) => ok({ status: err ? (err.code ?? 1) : 0, stdout, stderr })));
}
function correr(s, extra, dir) {
  return ejecutar({ ...process.env, IG_API_BASE: `http://127.0.0.1:${s.address().port}`, IG_TOKEN: TOKEN, IG_IMG_DIR: join(dir, 'img'), IG_JSON: join(dir, 'instagram.json'), ...extra });
}

test('sincroniza: JSON, miniaturas, descarta permalinks ajenos, no filtra el token', async () => {
  const s = await servidor('ok'); const dir = mkdtempSync(join(tmpdir(), 'ig-'));
  const r = await correr(s, {}, dir); s.close();
  assert.equal(r.status, 0, r.stderr);
  assert.ok(!r.stdout.includes(TOKEN) && !r.stderr.includes(TOKEN), 'el token no debe aparecer en la salida');
  const j = JSON.parse(readFileSync(join(dir, 'instagram.json'), 'utf8'));
  assert.equal(j.cuenta, 'bartirua'); assert.equal(j.items.length, 3, 'la de enlace ajeno se descarta');
  assert.equal(j.items[0].titulo, 'Concurso de bandas'); assert.ok(!/#/.test(j.items[0].texto), 'sin hashtags'); assert.equal(j.items[0].url, 'https://www.instagram.com/p/AAA/');
  assert.equal(j.items[1].tipo, 'video'); assert.match(j.items[1].imagen, /^assets\/instagram\/222\.png$/);
  assert.equal(j.items[2].imagen, null, 'sin imagen: tarjeta de texto');
  assert.deepEqual(readdirSync(join(dir, 'img')).sort(), ['111.png', '222.png']);
});

test('limpia imágenes viejas y no deja .tmp', async () => {
  const s = await servidor('ok'); const dir = mkdtempSync(join(tmpdir(), 'ig-')); mkdirSync(join(dir, 'img')); writeFileSync(join(dir, 'img', 'vieja.jpg'), 'x'); writeFileSync(join(dir, 'img', '.gitkeep'), '');
  const r = await correr(s, {}, dir); s.close(); assert.equal(r.status, 0, r.stderr);
  const f = readdirSync(join(dir, 'img')); assert.ok(!f.includes('vieja.jpg')); assert.ok(f.includes('.gitkeep')); assert.ok(!f.some((x) => x.endsWith('.tmp')));
});

test('con token inválido falla sin tocar el JSON anterior y sin mostrar el token', async () => {
  const s = await servidor('ok'); const dir = mkdtempSync(join(tmpdir(), 'ig-')); writeFileSync(join(dir, 'instagram.json'), '{"items":[{"id":"previo"}]}');
  const r = await correr(s, { IG_TOKEN: 'otro-token-malo' }, dir); s.close();
  assert.notEqual(r.status, 0); assert.ok(!r.stderr.includes('otro-token-malo'), 'tampoco el token malo');
  assert.equal(readFileSync(join(dir, 'instagram.json'), 'utf8'), '{"items":[{"id":"previo"}]}');
});

test('si la API devuelve cero publicaciones no se cambia nada', async () => {
  const s = await servidor('vacio'); const dir = mkdtempSync(join(tmpdir(), 'ig-')); writeFileSync(join(dir, 'instagram.json'), '{"items":[{"id":"previo"}]}');
  const r = await correr(s, {}, dir); s.close(); assert.notEqual(r.status, 0);
  assert.equal(readFileSync(join(dir, 'instagram.json'), 'utf8'), '{"items":[{"id":"previo"}]}');
});

test('sin IG_TOKEN falla con un mensaje claro', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ig-'));
  const r = await ejecutar({ PATH: process.env.PATH, IG_JSON: join(dir, 'x.json'), IG_IMG_DIR: join(dir, 'i') });
  assert.notEqual(r.status, 0); assert.match(r.stderr, /IG_TOKEN/);
});

test('IG_REFRESH=1 imprime los días y no el token', async () => {
  const s = await servidor('ok'); const dir = mkdtempSync(join(tmpdir(), 'ig-'));
  const r = await correr(s, { IG_REFRESH: '1' }, dir); s.close(); assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /vence en ~60 días/); assert.ok(!r.stdout.includes(TOKEN));
});
