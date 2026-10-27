#!/usr/bin/env node
// Sincroniza las últimas publicaciones de @bartirua con el sitio (datos/instagram.json + assets/instagram/).
// Usa la API oficial «Instagram API with Instagram Login» (cuenta Business o Creator). No toca nada si falla.
//
//   IG_TOKEN=<token de larga duración> node scripts/instagram-sync.mjs
//
// Variables: IG_TOKEN (obligatoria) · IG_LIMIT (12) · IG_API_BASE (https://graph.instagram.com; solo para pruebas)
//            IG_REFRESH=1 renueva el token (válido 60 días) e imprime SOLO los días que le quedan.
// Seguridad: el token nunca se imprime ni se guarda en archivos. Solo se descargan miniaturas a assets/instagram/.
import { mkdir, writeFile, readdir, rename, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.env.IG_API_BASE || 'https://graph.instagram.com').replace(/\/$/, '');
const TOKEN = process.env.IG_TOKEN;
const LIMITE = Math.max(1, Math.min(25, parseInt(process.env.IG_LIMIT || '12', 10) || 12));
const DIR_IMG = process.env.IG_IMG_DIR || join(RAIZ, 'assets', 'instagram');
const JSON_SALIDA = process.env.IG_JSON || join(RAIZ, 'datos', 'instagram.json');

function falla(msg) { console.error('instagram-sync: ' + msg); process.exit(1); }
if (!TOKEN) falla('falta IG_TOKEN (token de larga duración de la cuenta del bar).');

async function api(ruta, params) {
  const url = new URL(BASE + ruta);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('access_token', TOKEN);
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) { let d = ''; try { d = (await r.json()).error?.message || ''; } catch { /* sin cuerpo */ } falla(`la API respondió ${r.status}${d ? ' · ' + d.replace(TOKEN, '***') : ''}`); }
  return r.json();
}
function partir(caption) {
  const lineas = String(caption || '').replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
  const titulo = (lineas.shift() || 'Novedad del bar').replace(/#\w+/g, '').trim() || 'Novedad del bar';
  const texto = lineas.join(' ').replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
  const rec = (t, n) => (t.length > n ? t.slice(0, n - 1).trim() + '…' : t);
  return { titulo: rec(titulo, 80), texto: rec(texto, 240) };
}

if (process.env.IG_REFRESH === '1') {
  const r = await api('/refresh_access_token', { grant_type: 'ig_refresh_token' });
  console.log(`token renovado: vence en ~${Math.round((r.expires_in || 0) / 86400)} días (la renovación extiende el mismo token; no se imprime ni se guarda)`);
}

const lista = await api('/me/media', { fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp', limit: String(LIMITE) });
const crudos = Array.isArray(lista.data) ? lista.data : [];
if (!crudos.length) falla('la API no devolvió publicaciones; no se cambia nada.');

await mkdir(DIR_IMG, { recursive: true });
const nuevos = [], guardadas = new Set();
for (const m of crudos) {
  if (!/^[\w-]+$/.test(String(m.id)) || !/^https:\/\/(www\.)?instagram\.com\//.test(m.permalink || '')) continue;
  const origen = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url;       // el video no se aloja: se muestra su miniatura y se enlaza
  let imagen = null;
  if (origen && /^https:\/\//.test(origen) || (origen && BASE.startsWith('http://127.0.0.1') && origen.startsWith(BASE))) {
    try {
      const r = await fetch(origen); if (!r.ok) throw new Error(String(r.status));
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > 4_000_000) throw new Error('imagen demasiado grande');
      const tipo = (r.headers.get('content-type') || '').toLowerCase();
      const ext = tipo.includes('png') ? 'png' : tipo.includes('webp') ? 'webp' : 'jpg';
      const nombre = `${m.id}.${ext}`;
      await writeFile(join(DIR_IMG, nombre + '.tmp'), buf); await rename(join(DIR_IMG, nombre + '.tmp'), join(DIR_IMG, nombre));
      imagen = `assets/instagram/${nombre}`; guardadas.add(nombre);
    } catch (e) { console.warn(`instagram-sync: sin imagen para ${m.id} (${e.message}); se publica como tarjeta de texto`); }
  }
  const { titulo, texto } = partir(m.caption);
  nuevos.push({ id: String(m.id), tipo: m.media_type === 'VIDEO' ? 'video' : 'imagen', titulo, texto, imagen, url: m.permalink, fecha: m.timestamp || '' });
}
if (!nuevos.length) falla('ninguna publicación válida; no se cambia nada.');

// Limpieza: borra imágenes que ya no están en la lista (el .gitkeep se conserva)
for (const f of await readdir(DIR_IMG)) { if (f !== '.gitkeep' && !guardadas.has(f)) await rm(join(DIR_IMG, f), { force: true }); }
await writeFile(JSON_SALIDA + '.tmp', JSON.stringify({ cuenta: 'bartirua', actualizado: new Date().toISOString(), items: nuevos }, null, 2) + '\n');
await rename(JSON_SALIDA + '.tmp', JSON_SALIDA);
console.log(`instagram-sync: ${nuevos.length} publicaciones (${guardadas.size} imágenes) → ${JSON_SALIDA}`);
