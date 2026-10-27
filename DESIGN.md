# DESIGN.md · Tirúa (tercera vuelta, 2026-10-23)

Documento breve escrito a mano al cerrar la vuelta (no lo generó el documentador de Impeccable; `.impeccable/design.json` no existe).

## Mundo
Bar-restorán de campo en Pirque, de noche con estufa, pero contado de día: papel blanco, tinta casi negra de marrón tostado y un solo rojo (el de los corazones del naipe). La carta es una baraja de verdad: naipes blancos con filo de tinta, índices en serif y franja de nombre/precio.

## Tokens (css/styles.css, `:root`)
| Token | Claro | Oscuro (`?tema=oscuro`) |
|---|---|---|
| `--fondo` / `--fondo-2` / `--fondo-3` | `#fff` / `#f6f3ee` / `#eee9e1` | `#000` / `#0a0a0a` / `#141414` |
| `--tinta` / `--tinta-2` / `--tinta-3` | `#17130f` / `#463e36` / `#665c52` | `#fff` / `#d4d4d4` / `#a8a8a8` |
| `--rojo` | `#b3202a` | `#ff5c6c` |
| `--display` | Young Serif | igual |
| `--sans` | Alegreya Sans | igual |

Palos (acento por categoría, `js/baraja-datos.js`): corazones `#b3202a`, picas `#2a4a6b`, diamantes `#9a620c`, tréboles `#2f6b45` en claro; sus pares luminosos en oscuro. Joker `#6b46c9`.

## Tipografía
Titulares en Young Serif, sentence case, sin interletraje; cuerpo Alegreya Sans 18 px / 1,6; etiquetas y botones en Alegreya Sans 700, sin versalitas. Young Serif se declara como rango 100–900 para que el navegador no simule negrita.

## Componentes
- Botón principal: tinta sólida, relleno rojo al pasar; botón secundario: contorno de tinta que se llena de tinta.
- Naipe: blanco, borde 1,5 px de tinta (del palo cuando está activo), foto vertical 60×84, franja `--fondo-3` con borde superior del palo.
- Portal de la carta: título, mazo cerrado que «respira», «Abrir la carta» (Young Serif).
- Modo inmersivo: pantalla completa, círculo que se abre desde el mazo, X y lupa de 52 px en círculo, flechas circulares de 56–68 px, bandeja inferior para las herramientas.
- Tarjetas de categoría: foto a sangre con velo oscuro y texto blanco (tokens oscuros locales).

## Reglas
- Un solo rojo por pantalla como acento; el resto es tinta sobre blanco.
- Nada de hosts externos salvo el mapa de Google.
- Todo motivo nuevo respeta `prefers-reduced-motion` (las animaciones `br-*` se anulan).
- El logo se usa invertido a tinta sobre claro (decisión de Pablo, 2026-10-24: se queda así, no hace falta pedir versión en negro).
