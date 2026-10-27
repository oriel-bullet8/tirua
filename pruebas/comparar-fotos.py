# Compara, con píxeles reales, la ventana de foto renderizada de cada carta (capturas de baraja-fotos.cjs) con el render esperado de la copia WebP
# (object-fit: cover + object-position). Estima la deformación horizontal/vertical con una búsqueda de ±3 % y arma la hoja de contactos de las 8 cartas.
# Uso: python3 pruebas/comparar-fotos.py [dispositivo=d1440] [salida_hoja.png]
import json, os, sys, tempfile
from PIL import Image, ImageDraw, ImageFont, ImageChops, ImageStat

TMP = os.path.join(tempfile.gettempdir(), 'tirua-fotos')
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FUENTE = os.path.join(RAIZ, 'assets', 'fonts', 'Poppins_600SemiBold.ttf')

def esperado(webp, W, H, pos, rx=1.0, ry=1.0):
    im = Image.open(webp).convert('RGB'); nw, nh = im.size
    s = max(W / nw, H / nh)
    cw, ch = max(W, round(nw * s * rx)), max(H, round(nh * s * ry))
    im = im.resize((cw, ch), Image.LANCZOS)
    px, py = [float(v.strip('%')) / 100 for v in pos.split()]
    return im.crop((round((cw - W) * px), round((ch - H) * py), round((cw - W) * px) + W, round((ch - H) * py) + H))

def mae(a, b):
    d = ImageChops.difference(a, b).convert('L')
    return ImageStat.Stat(d).mean[0]

def main():
    disp = sys.argv[1] if len(sys.argv) > 1 else 'd1440'
    meta = json.load(open(os.path.join(TMP, disp + '-meta.json')))
    peor = 0; filas = []
    for m in meta:
        cap = Image.open(m['ventana']).convert('RGB'); W, H = cap.size
        # búsqueda fina: rx, ry en {1,00 … 1,02} (paso 0,25 %); si el mejor ajuste es (1,1) no hay deformación medible.
        # El render capturado se redondea al píxel (el borde de 1 px de la ventana deja el <img> en tamaño fraccionario), de ahí un ruido de ≈0,5 %.
        pasos = [1.0 + k * 0.0025 for k in range(9)]
        res = {(rx, ry): mae(cap, esperado(m['webp'], W, H, m['pos'], rx, ry)) for rx in pasos for ry in pasos}
        mejor = min(res, key=res.get)
        base = res[(1.0, 1.0)]
        sens = mae(cap, esperado(m['webp'], W, H, m['pos'], 1.03, 1.0))   # control: un estiramiento del 3 % debe verse claramente peor
        defor = abs(mejor[0] / mejor[1] - 1) * 100
        peor = max(peor, defor)
        filas.append((m['n'], m['nombre'], base, mejor, defor, sens))
        print(f"{disp} carta {m['n']} {m['nombre']}: MAE cover={base:.2f}/255 · mejor ajuste rx,ry=({mejor[0]:.4f},{mejor[1]:.4f}) (MAE {res[mejor]:.2f}) · control +3 % de ancho: MAE {sens:.2f} · deformación estimada {defor:.2f} %")
    print(f"{disp}: deformación estimada máxima {peor:.2f} % (tolerancia 1 %)")
    ok = peor <= 1.0 and all(f[2] < 12 and f[5] > f[2] for f in filas)
    print('RESULTADO', 'OK' if ok else 'FALLA')
    # Hoja de contactos con nombre y precio
    if len(sys.argv) > 2:
        cartas = [Image.open(m['carta']).convert('RGB') for m in meta]
        cw, ch = 300, int(300 * cartas[0].size[1] / cartas[0].size[0])
        pad, cap_h = 16, 54
        hoja = Image.new('RGB', (4 * cw + 5 * pad, 2 * (ch + cap_h) + 3 * pad), '#0b0b0b')
        d = ImageDraw.Draw(hoja)
        f1, f2 = ImageFont.truetype(FUENTE, 19), ImageFont.truetype(FUENTE, 17)
        for i, (m, c) in enumerate(zip(meta, cartas)):
            x = pad + (i % 4) * (cw + pad); y = pad + (i // 4) * (ch + cap_h + pad)
            hoja.paste(c.resize((cw, ch), Image.LANCZOS), (x, y))
            d.text((x, y + ch + 6), f"{m['n']}. {m['nombre']}", font=f1, fill='#f4f4f2')
            d.text((x, y + ch + 30), m['precio'], font=f2, fill='#ff5c6c')
        hoja.save(sys.argv[2]); print('hoja de contactos →', sys.argv[2], hoja.size)
    sys.exit(0 if ok else 1)
main()
