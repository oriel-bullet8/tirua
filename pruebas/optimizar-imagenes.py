# Genera copias WebP optimizadas de los 8 bebestibles de Justo y el manifiesto (solo LEE datos/justo o TIRUA_JUSTO).
# Uso: python3 pruebas/optimizar-imagenes.py [directorio_salida]   (por defecto assets/productos/)
import json, hashlib, os, sys, re, unicodedata
from PIL import Image, ImageOps

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
JUSTO = os.path.abspath(os.environ.get('TIRUA_JUSTO') or os.path.join(RAIZ, 'datos', 'justo'))   # los originales (203 MB) no van en el repo: TIRUA_JUSTO=<carpeta con originales/>
SALIDA = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(RAIZ, 'assets', 'productos')
LADO_MAX, CALIDAD = 1000, 80
# (id de Justo, id estable en el sitio, archivo de salida)
ELEGIDOS = [
    ('pLzsFuhGfzKymge7H', 'beb-ramajito', 'ramajito.webp'),
    ('wvggyFMrbxTjfqRW6', 'beb-playa-tirua', 'playa-tirua.webp'),
    ('mcuRPXBYjXNBLW2uJ', 'beb-sol-de-fuego', 'sol-de-fuego.webp'),
    ('fkXLzepMnJ6wPSGcx', 'beb-botanical-collins', 'botanical-collins.webp'),
    ('uKkB8dCKbkKgdScQA', 'beb-jackie-jr', 'jackie-jr.webp'),
    ('DogEdPaYp9z32TAQn', 'beb-espresso-vainilla', 'espresso-vainilla.webp'),
    ('8BKtMNJd3HR9EBvYA', 'beb-ramazzotti-spritz', 'ramazzotti-spritz.webp'),
    ('BdLLnnMzRfZYe27sH', 'beb-green-drinks', 'green-drinks.webp'),
]
os.makedirs(SALIDA, exist_ok=True)
carta = json.load(open(os.path.join(JUSTO, 'carta-justo.json'), encoding='utf-8'))
por_id = {p['id']: p for p in carta['productos']}
manifiesto = {
    'fuente': carta['resumen']['fuente'], 'extraido': carta['resumen']['extraido'],
    'nota': 'Copias optimizadas (WebP, calidad %d, lado mayor <= %d px, proporcion original, EXIF aplicado). Los originales siguen en ../bar-tirua-justo/originales y no se modificaron. Uso de las fotos en este sitio: pendiente de confirmacion con el local.' % (CALIDAD, LADO_MAX),
    'productos': [],
}
total = 0
for jid, sid, archivo in ELEGIDOS:
    p = por_id[jid]; im = p['imagen']
    ruta_orig = os.path.join(JUSTO, im['archivo'])
    sha = hashlib.sha256(open(ruta_orig, 'rb').read()).hexdigest()
    assert sha == im['sha256'], 'sha256 distinto en ' + p['nombre']
    o = Image.open(ruta_orig); dim_orig = list(o.size)
    img = ImageOps.exif_transpose(o).convert('RGB')
    w, h = img.size
    esc = min(1.0, LADO_MAX / max(w, h))
    nw, nh = max(1, round(w * esc)), max(1, round(h * esc))
    if (nw, nh) != (w, h):
        img = img.resize((nw, nh), Image.LANCZOS)
    destino = os.path.join(SALIDA, archivo)
    img.save(destino, 'WEBP', quality=CALIDAD, method=6)
    b = os.path.getsize(destino); total += b
    with Image.open(destino) as chk:
        assert chk.size == (nw, nh)
    manifiesto['productos'].append({
        'id_justo': jid, 'id_sitio': sid, 'nombre': p['nombre'], 'url_origen': p['url_origen'],
        'original': {'ruta': '../bar-tirua-justo/' + im['archivo'], 'ancho': dim_orig[0], 'alto': dim_orig[1], 'sha256': sha, 'bytes': os.path.getsize(ruta_orig)},
        'copia': {'ruta': 'assets/productos/' + archivo, 'ancho': nw, 'alto': nh, 'bytes': b, 'formato': 'webp'},
    })
manifiesto['total_bytes_copias'] = total
json.dump(manifiesto, open(os.path.join(SALIDA, 'manifiesto.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
for m in manifiesto['productos']:
    print(m['nombre'], m['original']['ancho'], 'x', m['original']['alto'], '->', m['copia']['ancho'], 'x', m['copia']['alto'], m['copia']['bytes'], 'B')
print('TOTAL', total, 'B')
