# Verifica los 8 productos elegidos contra carta-justo.json (solo lectura) y muestra tamaños/EXIF de originales.
import json, hashlib, os, sys
from PIL import Image, features
import os
J = os.environ.get('TIRUA_JUSTO') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'datos', 'justo')
IDS = "pLzsFuhGfzKymge7H wvggyFMrbxTjfqRW6 mcuRPXBYjXNBLW2uJ fkXLzepMnJ6wPSGcx uKkB8dCKbkKgdScQA DogEdPaYp9z32TAQn 8BKtMNJd3HR9EBvYA BdLLnnMzRfZYe27sH".split()
print('webp soportado:', features.check('webp'))
d = json.load(open(J + '/carta-justo.json'))
by = {p['id']: p for p in d['productos']}
for i in IDS:
    p = by[i]; im = p['imagen']; f = J + '/' + im['archivo']
    h = hashlib.sha256(open(f, 'rb').read()).hexdigest()
    I = Image.open(f)
    print(p['nombre'], I.size, I.format, 'exif-orient', I.getexif().get(274), 'sha', 'OK' if h == im['sha256'] else 'DISTINTO', os.path.getsize(f), 'visible', p['aparece_en_pagina_al_extraer'], 'disp', p['precio']['disponible_ahora'], 'precio', p['precio']['final'], 'cat', p['categorias'][0]['nombre'])
