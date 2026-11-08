#!/usr/bin/env python3
"""Construye los datos y las fotos de la página de carta (carta.html).

Entrada : captura de la carta pública de Justo (carta-justo-AAAA-MM-DD.json + originales/).
Salidas : js/carta-datos.js          → window.TIRUA_CARTA (bloques → secciones → productos), para la versión tradicional (carta.html y PDF)
          js/baraja-productos.js     → productos y secciones de la BARAJA (window.DATOS_BARAJA.productos / .secciones) y su arte por carta
          datos/carta.json           → la misma carta en JSON compacto (entra al repo; la captura completa y los originales no)
          assets/carta/<id>.webp     → una foto optimizada por producto con foto
Uso     : python3 scripts/carta-construir.py [carpeta_captura]
          (por defecto archivo/2026-11-07-justo; los originales no van en el repo)
Solo LEE la captura; no inventa nada: nombre, descripción, precio y foto son los de Justo.
Se excluyen los ítems internos de Justo (promos, agregados, eventos), que no pertenecen a ninguna sección de la carta.
"""
import json, os, sys, glob, re
from PIL import Image, ImageOps

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FUENTE = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, 'archivo', '2026-11-07-justo'))
SALIDA_FOTOS = os.path.join(RAIZ, 'assets', 'carta')
LADO_MAX, CALIDAD = 720, 78

# Bloques aprobados por Pablo (CP1, 2026-11-07). El orden de las secciones dentro de cada bloque es el de Justo.
BLOQUES = [
    ('compartir', 'Para compartir', ['Para Picar', 'Entradas Frias', 'Papitas para Compartir']),
    ('platos', 'Platos', ['Sushi', 'Ensaladas', 'Sándwich', 'Pizzas']),
    ('postres', 'Postres', ['Postres']),
    ('cocteleria', 'Coctelería', ['Coctelería de autor', 'Coctelería Internacional', 'Rincón de los sour', 'Spritz', 'Mocktail', 'Jarras y licores', 'Shot']),
    ('destilados', 'Destilados, vinos y espumantes', ['Vodka', 'Gin', 'Pisco', 'Whisky', 'Ron', 'Tequila', 'Espumantes', 'Vino']),
    ('cervezas', 'Cervezas y bebidas', ['Cerveza', 'Shop', 'Bebida', 'Cafetería']),   # Cafetería va con los bebestibles, como en Justo
]
# Los nombres de las secciones son los de Justo, tal cual (decisión de Pablo, 2026-11-07).
# Eventos especiales y promos no son carta (decisión de Pablo, 2026-11-07): se dejan fuera aunque Justo los liste en una sección.
EVENTOS = {'HALLOWEEN'}
es_evento = lambda p: p['nombre'].strip().upper() in EVENTOS

archivo = glob.glob(os.path.join(FUENTE, 'carta-justo-*.json'))[0]
datos = json.load(open(archivo, encoding='utf-8'))
orden_secciones = [s['nombre'] for s in datos['secciones']]
asignadas = {n for _, _, ss in BLOQUES for n in ss}
assert asignadas == set(orden_secciones), f'secciones sin bloque o de más: {asignadas ^ set(orden_secciones)}'

os.makedirs(SALIDA_FOTOS, exist_ok=True)
for viejo in glob.glob(os.path.join(SALIDA_FOTOS, '*.webp')):
    os.remove(viejo)

def foto(p):
    if not p['foto']:
        return None
    origen = os.path.join(FUENTE, p['foto'])
    destino = f"{p['id']}.webp"
    with Image.open(origen) as im:
        im = ImageOps.exif_transpose(im).convert('RGB')
        im.thumbnail((LADO_MAX, LADO_MAX), Image.LANCZOS)
        im.save(os.path.join(SALIDA_FOTOS, destino), 'WEBP', quality=CALIDAD, method=6)
        return {'src': f'assets/carta/{destino}', 'w': im.width, 'h': im.height}

salida, total, con_foto = [], 0, 0
for bid, bnombre, secciones in BLOQUES:
    bloque = {'id': bid, 'nombre': bnombre, 'secciones': []}
    for sn in secciones:
        productos = []
        for p in datos['productos']:
            if p['secciones'] != [sn] or es_evento(p):
                continue
            f = foto(p)
            item = {'id': p['id'], 'nombre': p['nombre'].strip()}
            if p['descripcion'] and p['descripcion'].strip():
                item['descripcion'] = p['descripcion'].strip()
            if p['precio']:
                item['precio'] = p['precio']
            if f:
                item['foto'] = f['src']; item['w'] = f['w']; item['h'] = f['h']; con_foto += 1
            productos.append(item); total += 1
        bloque['secciones'].append({'id': re.sub(r'[^a-z0-9]+', '-', sn.lower().replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')).strip('-'),
                                    'nombre': sn, 'productos': productos})
    salida.append(bloque)

meta = {'fuente': datos['fuente'], 'capturado': datos['extraido'][:10], 'productos': total, 'conFoto': con_foto,
        'secciones': sum(len(b['secciones']) for b in salida)}
js = ('// DATOS DE LA CARTA (generado por scripts/carta-construir.py; no editar a mano).\n'
      '// Fuente: carta pública de Justo del bar, capturada el ' + meta['capturado'] + '. Precios en pesos chilenos.\n'
      'window.TIRUA_CARTA = ' + json.dumps({'meta': meta, 'bloques': salida}, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(RAIZ, 'js', 'carta-datos.js'), 'w', encoding='utf-8').write(js)
print(json.dumps(meta, ensure_ascii=False))
# ---------------- Baraja: 4 palos (categorías del sitio) con sus secciones de Justo ----------------
# Palo ↔ sección de Justo. Bebestibles reúne todo lo que se bebe; su orden pone la coctelería primero (la primera carta es el «As»).
PALOS = [
    ('compartir', ['Para Picar', 'Entradas Frias', 'Papitas para Compartir']),
    ('individuales', ['Sushi', 'Ensaladas', 'Sándwich', 'Pizzas']),
    ('postres', ['Postres']),
    ('bebestibles', ['Coctelería de autor', 'Coctelería Internacional', 'Rincón de los sour', 'Spritz', 'Mocktail',
                     'Vodka', 'Gin', 'Pisco', 'Whisky', 'Ron', 'Tequila', 'Shot', 'Jarras y licores',
                     'Espumantes', 'Vino', 'Cerveza', 'Shop', 'Bebida', 'Cafetería']),
]
asignadas = [n for _, ss in PALOS for n in ss]
assert sorted(asignadas) == sorted(orden_secciones), f'secciones sin palo o repetidas: {set(orden_secciones) ^ set(asignadas)}'
# Las 8 cartas con recorte hecho a mano por Oriel conservan su id, su foto y su arte (js/baraja-arte.js).
DESTACADAS = {  # id de Justo → (id del sitio, archivo en assets/productos/)
    'pLzsFuhGfzKymge7H': ('beb-ramajito', 'ramajito.webp'), 'wvggyFMrbxTjfqRW6': ('beb-playa-tirua', 'playa-tirua.webp'),
    'mcuRPXBYjXNBLW2uJ': ('beb-sol-de-fuego', 'sol-de-fuego.webp'), 'fkXLzepMnJ6wPSGcx': ('beb-botanical-collins', 'botanical-collins.webp'),
    'uKkB8dCKbkKgdScQA': ('beb-jackie-jr', 'jackie-jr.webp'), 'DogEdPaYp9z32TAQn': ('beb-espresso-vainilla', 'espresso-vainilla.webp'),
    '8BKtMNJd3HR9EBvYA': ('beb-ramazzotti-spritz', 'ramazzotti-spritz.webp'), 'BdLLnnMzRfZYe27sH': ('beb-green-drinks', 'green-drinks.webp'),
}
def escena(pid):  # paisaje pintado de fondo (0-7), estable por producto
    return sum(ord(c) for c in pid) % 8

bprods, bsecs, arte, vistos = [], [], {}, set()
for palo, secciones in PALOS:
    for sn in secciones:
        bsecs.append({'id': re.sub(r'[^a-z0-9]+', '-', sn.lower().replace('á','a').replace('é','e').replace('í','i').replace('ó','o').replace('ú','u')).strip('-'),
                      'nombre': sn, 'categoria': palo})
        for p in datos['productos']:
            if p['secciones'] != [sn] or es_evento(p):
                continue
            vistos.add(p['id'])
            d = {'categoria': palo, 'seccion': bsecs[-1]['id'], 'nombre': p['nombre'].strip(), 'justo': sn, 'precio': p['precio'] or None, 'etiquetas': []}
            if p['descripcion'] and p['descripcion'].strip():
                d['descripcion'] = p['descripcion'].strip()
            if p['id'] in DESTACADAS:
                sid, arch = DESTACADAS[p['id']]
                d['id'] = sid
                with Image.open(os.path.join(RAIZ, 'assets', 'productos', arch)) as im:
                    d['imagen'] = {'src': f'assets/productos/{arch}', 'alt': p['nombre'].strip() + ', bebestible de la carta', 'ancho': im.width, 'alto': im.height, 'posicion': '50% 50%'}
            else:
                d['id'] = p['id']
                if p['foto']:
                    with Image.open(os.path.join(SALIDA_FOTOS, p['id'] + '.webp')) as im:
                        d['imagen'] = {'src': f'assets/carta/{p["id"]}.webp', 'alt': p['nombre'].strip(), 'ancho': im.width, 'alto': im.height, 'posicion': '50% 45%'}
                arte[d['id']] = {'escena': escena(p['id']), 'plano': bool(p['foto'])}
            bprods.append(d)
assert len(bprods) == total, (len(bprods), total)
assert len(DESTACADAS) == sum(1 for d in bprods if d['id'].startswith('beb-')), 'faltan destacadas'
js2 = ('// PRODUCTOS DE LA BARAJA (generado por scripts/carta-construir.py; no editar a mano).\n'
       '// Fuente: carta pública de Justo del bar, capturada el ' + meta['capturado'] + '. Nombre, descripción, precio y foto son los de Justo.\n'
       '// Las 8 cartas con recorte propio (id beb-…) usan js/baraja-arte.js; el resto lleva su foto entera sobre un paisaje pintado.\n'
       '(function () {\n  var D = window.DATOS_BARAJA;\n'
       '  D.secciones = ' + json.dumps(bsecs, ensure_ascii=False, separators=(',', ':')) + ';\n'
       '  D.productos = ' + json.dumps(bprods, ensure_ascii=False, separators=(',', ':')) + ';\n'
       '  window.TIRUA_BARAJA_ARTE = Object.assign(window.TIRUA_BARAJA_ARTE || {}, ' + json.dumps(arte, ensure_ascii=False, separators=(',', ':')) + ');\n})();\n')
open(os.path.join(RAIZ, 'js', 'baraja-productos.js'), 'w', encoding='utf-8').write(js2)
os.makedirs(os.path.join(RAIZ, 'datos'), exist_ok=True)
json.dump({'meta': meta, 'bloques': salida}, open(os.path.join(RAIZ, 'datos', 'carta.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('baraja:', len(bprods), 'cartas en', len(bsecs), 'secciones;', {pl: sum(1 for d in bprods if d['categoria'] == pl) for pl, _ in PALOS})

tam = sum(os.path.getsize(f) for f in glob.glob(os.path.join(SALIDA_FOTOS, '*.webp')))
print(f'fotos: {con_foto} · {tam/1e6:.1f} MB · js/carta-datos.js: {os.path.getsize(os.path.join(RAIZ,"js","carta-datos.js"))/1e3:.0f} KB')
