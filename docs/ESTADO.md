# Tirúa · Estado del proyecto

**Versión: Volumen 4 «Fogón» (4.0.1, cerrado) · Volumen 5 en curso · 2026-10-24** · Sitio estático local (HTML/CSS/JS), sin publicar y sin commits.
Esta hoja resume dónde vamos. El detalle técnico vive en `CONTINUIDAD.md`; las versiones, en `docs/VERSIONES.md`. Se puede pegar o importar tal cual en Notion.

## En una mirada
| | |
|---|---|
| Qué es | Sitio de Tirúa Bar-Restorán (Pirque): carta en baraja, reservas por WhatsApp, mapa, delivery con Justo. |
| Dónde está | `~/Documents/Codex/Proyectos/tirua` · se ve con `python3 servir.py` en http://127.0.0.1:4195/ |
| Último paquete | `~/Documents/Codex/respaldos-tirua/tirua-vol4-fogon-2026-10-24-final.zip` (incluye la demo de Instagram y el bloqueo de domingo/lunes) |
| Calidad automática | Todo en verde: recursos 45/45, carta inmersiva 117/117, historias 49/49, sincronización 6/6, fotos 188/188, vuelta2 40/40, reservas 64/64; sondeo de páginas y foco 72/72. |
| Lo que nadie ha probado | Celulares reales y Safari (Pablo lo prueba ahora en su iPhone). |
| Decisiones de diseño | Blanco con acento rojo, Young Serif + Alegreya Sans, logo invertido por CSS (no se pide logo en negro). |

## Versiones
| Vol. | Nombre | Fecha | Qué trae |
|---|---|---|---|
| 1 | Demo | 20-oct | Sitio completo en oscuro, reservas por WhatsApp. |
| 2 | Segunda vuelta | 20-oct | Categorías con foto, mapa, pedidos, fotos de Justo. |
| 3 | Campo | 23-oct | Tema blanco, tipografía rústica, carta inmersiva, loop «página casi lista». |
| 4 | **Fogón** | 24-oct | Novedades de Instagram en el hero, reservar en cascada con mensaje en vivo. |
| 5 | (en curso) | — | Mejorar la demo de Instagram y cargar contenido real. Ver «Qué toca». |

## Qué funciona hoy
- **Carta en baraja:** portal con el mazo, modo inmersivo a pantalla completa, voltear para ver la ficha del trago (datos de Justo), buscar, lista rápida, barajar, joker de demostración. Atrás del navegador cierra la carta.
- **Reservas:** cuatro preguntas que se abren una tras otra (Personas, Fecha, Hora, Tus datos), mensaje que se arma en vivo, «Enviar por WhatsApp» y «Copiar mensaje». Martes a sábado; domingo y lunes bloqueados. El bar confirma a mano.
- **Hero:** logo con calor de brasas y «Novedades» tipo historias de Instagram. La página normal ya las muestra: mientras no haya publicaciones reales salen 5 ejemplos marcados «Ejemplo»; cuando se carguen las reales, las reemplazan solas. `?demo=no` apaga los ejemplos.
- **Mapa, delivery con Justo, tema oscuro opcional (`?tema=oscuro`).**

## Qué falta, quién lo desbloquea
| Pendiente | Quién | Qué cambia |
|---|---|---|
| Número de WhatsApp del bar | Oriel / el bar | «Enviar por WhatsApp» abre directo el chat del bar (una línea en `js/contenido.js`). |
| ¿Reservan por WhatsApp o solo por DM de Instagram? | El bar | Si es solo DM, la salida principal pasa a ser el chat de Instagram. |
| 4 o 5 publicaciones del Instagram | Pablo / marketing | Llenan las «Novedades» del hero. |
| Video del hero (1920×1080 y 1080×1920) | Equipo de marketing | Reemplaza el hero sin video. Guía: `docs/GUIA-VIDEO-HERO.md`. |
| Hora de cierre | El bar | Reemplaza las horas de muestra (hoy hasta 22:30). |
| Permiso de uso de las fotos de Justo | El bar | Permite publicar. |
| Prueba en iPhone / Android | Pablo | Cierra el único check humano abierto (H1). |
| Agrupar las 27 categorías de Justo, tope de cartas por palo | Oriel | Permite sumar más productos a la carta. |
| Zonas y costos de delivery, as real, condiciones del joker | El bar / Oriel | Textos finales. |

## Qué toca (Volumen 5)
1. Corregir lo que salga de la prueba en iPhone.
2. Cargar las publicaciones reales en el hero.
3. Poner el número de WhatsApp (o la salida por Instagram, según lo que responda el bar).
4. Poner el video del hero cuando marketing lo entregue.
5. Sin bloqueo: mapa con respaldo si no carga, adaptar pruebas viejas de la baraja, primer commit y subida al repositorio cuando Pablo lo pida.

## Reglas que se mantienen
- Sin commits, push ni despliegues si Pablo no los pide.
- No inventar el número de WhatsApp, horarios, precios, fotos ni ingredientes.
- No compartir contraseñas en el chat.
- Servidor solo en 127.0.0.1 (el modo `--red` es opcional y de corta duración).
- No borrar ni mover las carpetas viejas (`…/est-2/outputs/`).

## Dónde mirar cada cosa
| Archivo | Para qué |
|---|---|
| `CONTINUIDAD.md` | Estado largo, decisiones, incidentes, pendientes. Leer primero. |
| `docs/VERSIONES.md` | Volúmenes y qué toca. |
| `docs/ESTADO.md` | Esta hoja. |
| `README.md` | Cómo arrancar, probar en el iPhone y verificar. |
| `PRODUCT.md`, `DESIGN.md` | Qué es el producto y su sistema de diseño. |
| `loops/pagina-casi-lista.md` | Checks de calidad, defectos encontrados y arreglados. |
| `docs/INSTAGRAM-PLAN.md`, `docs/GUIA-VIDEO-HERO.md` | Instagram y video para marketing. |
