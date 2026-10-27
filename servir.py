#!/usr/bin/env python3
"""Servidor local de la demo SIN caché (http.server normal deja que el navegador reutilice CSS/JS viejos y se ve una mezcla de versiones).
Uso:  python3 servir.py [puerto]          (por defecto 4195, solo 127.0.0.1)
      python3 servir.py [puerto] --red    (opcional: también visible en tu Wi-Fi, para probar en el celular)
Sirve siempre la carpeta donde vive este archivo, se ejecute desde donde se ejecute."""
import socket
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RAIZ = Path(__file__).resolve().parent

class SinCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    puerto = int(args[0]) if args else 4195
    en_red = "--red" in sys.argv
    print(f"Tirúa: http://127.0.0.1:{puerto}/  (sirviendo {RAIZ})", flush=True)
    if en_red:
        # Solo a pedido: cualquier equipo de tu misma red Wi-Fi puede abrir el sitio mientras este proceso esté andando. Ctrl+C lo detiene.
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(("8.8.8.8", 80)); ip = s.getsockname()[0]; s.close()
        except OSError:
            ip = "<la IP de tu Mac en el Wi-Fi>"
        print(f"MODO RED: en el celular (misma red Wi-Fi) abre  http://{ip}:{puerto}/", flush=True)
        print("Mientras esté activo, la carpeta del sitio es visible para los equipos de tu red. Detenlo con Ctrl+C al terminar.", flush=True)
    ThreadingHTTPServer(("0.0.0.0" if en_red else "127.0.0.1", puerto), partial(SinCache, directory=str(RAIZ))).serve_forever()
