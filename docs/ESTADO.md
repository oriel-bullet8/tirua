# Tirúa · Estado del proyecto

**Volumen 5 «Carta» (en curso) · 2026-11-07** · Sitio estático (HTML/CSS/JS). Se sube al repositorio de GitHub y Oriel lo publica desde ahí.
Esta hoja resume dónde vamos. El detalle técnico vive en `CONTINUIDAD.md`; las versiones, en `docs/VERSIONES.md`. Se puede pegar o importar tal cual en Notion.

## En una mirada
| | |
|---|---|
| Qué es | Sitio de Tirúa Bar-Restorán (Pirque): carta en baraja con toda la carta de Justo, reservas por Instagram, mapa, delivery con Justo. |
| Dónde está | https://github.com/oriel-bullet8/tirua (rama `carta-y-lanzamiento`) · local: `python3 servir.py` en http://127.0.0.1:4195/ |
| Calidad automática | `npm run verificar` (recursos, carta tradicional, baraja, historias, sincronización, reservas). |
| Lo que nadie ha probado | Celulares reales y Safari. |
| Diseño | Un solo fondo de vidrio para toda la página (la Carta es la única distinta, en negro), títulos centrados, Young Serif + Alegreya Sans. |

## Qué funciona hoy
- **Carta en baraja:** «Abrir la carta» → «Escoger mazo» (Bebestibles, Comidas individuales, Postres, Para compartir; Bebestibles se despliega en Coctelería, Destilados y vinos, Cervezas y bebidas) → se reparte el mazo. Voltear para ver la ficha, buscar, lista rápida, barajar. 250 productos de Justo; 165 con foto.
- **Joker:** escondido en el mazo (12 % por reparto, máximo 1 por visita); su beneficio real lo define el Bar.
- **Carta tradicional:** `carta.html` y PDF descargable.
- **Reservas:** cuatro preguntas en cascada y mensaje en vivo; «Enviar por Instagram» copia la solicitud y abre el chat del bar. El bar confirma a mano. Martes a sábado.
- **Hero:** logo y «Novedades» de Instagram; `@bartirua` enlaza al perfil.
- **Mapa, delivery con Justo.**

## Qué falta y de quién depende
| Pendiente | Quién | Nota |
|---|---|---|
| Dominio oficial | Dueño del bar | Luego cambiar `canonical` y `og:url`. |
| Video del hero | Equipo de marketing del local | Mecanismo listo; falta `assets/video/hero.mp4`. |
| Beneficio del Joker | El Bar | Se define al final. |
| Fotos de 85 productos | El Bar | Listado en el Word de `docs/`. |
| Hora de cierre; zonas y costos de delivery | El Bar | Las horas de reserva son de muestra. |
| Prueba en teléfonos reales y Safari | Pablo | |

## Reglas del proyecto
- Identidad = la del bar. No inventar productos, precios, fotos, horarios ni condiciones del joker.
- No publicar ni hacer push sin que Pablo lo pida.
