# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Gente de Santiago que decide si salir a Pirque (Región Metropolitana) a comer y beber, y vecinos que piden a domicilio. Visitante principal (confirmado por Pablo, 2026-10-23): quien planea ir al local; en el celular sobre todo, buscando la carta, el ambiente y una mesa. Su trabajo: ver qué hay, decidir y pedir mesa. Pedir delivery es secundario.

## Product Purpose
Sitio de Tirúa Bar-Restorán (Ramón Subercaseaux 455, Pirque). Muestra la carta, el local y el mapa, deja armar una solicitud de reserva y enlaza al delivery. Éxito: que alguien termine con una solicitud de reserva enviada por WhatsApp, o abra la carta/delivery, y que sienta que Tirúa es un lugar al que quiere ir.

## Positioning
Un bar-restorán de campo a las afueras de Santiago, con terraza cerrada y calefaccionada y pet friendly, cuya carta se juega como una baraja de naipes (cada plato, una carta). Ningún otro local de la zona presenta su carta así.

## Operating Context
Reservas: la página no envía nada; prepara un mensaje y se envía por WhatsApp; el bar confirma a mano. Delivery: plataforma Justo del bar (enlace externo). Horario según el Instagram del bar (confirmado por Pablo, 2026-10-24): martes a sábado desde las 18:00; la hora de cierre se desconoce. Su bio dice «Reservas por DM» (ver pendiente en CONTINUIDAD.md). Sitio en construcción, sin publicar; se crea junto a Oriel (compañero de Pablo, vinculado al bar).

## Capabilities and Constraints
- Sitio estático HTML/CSS/JS sin build, sirve `python3 servir.py` en 127.0.0.1:4195. Repo: github.com/oriel-bullet8/tirua (sin commits hasta que Pablo lo pida).
- Carta en baraja: 8 bebestibles reales con foto, 4 categorías (palos); 3 en «Próximamente».
- Pendientes de Oriel/local (no inventar): número de WhatsApp, hora de cierre, zonas y costos de delivery, permiso de uso de las fotos de Justo, video del hero, condiciones del joker, as real y palos definitivos.
- Instagram solo como enlace al perfil @bartirua; sin sincronización automática.

## Brand Commitments
- Logo wordmark TIRUA (assets/brand), hoy solo en versión blanca sobre transparente.
- Frase: «Tu lugar de encuentro». Voz en español de Chile, cercana.
- Dirección pedida por Oriel y Pablo (2026-10-23, binding): probar el sitio en blanco dominante (colores invertidos, rojo como acento), tipografía menos «aviso publicitario» y más rústica/de campo, y una baraja inmersiva, grande, casi sin otros botones. Se mantiene la versión oscura accesible para comparar (?tema=oscuro).

## Evidence on Hand
Fotos de 8 bebestibles (assets/productos), 4 fotos de categoría (assets/img), mapa de Google embebido, carta de Justo (datos/justo). No hay video del hero, fotos reales del local ni testimonios: no fabricarlos.

## Product Principles
1. La carta es el protagonista: jugar con ella debe sentirse como un juego, no como un formulario.
2. Honestidad primero: nada de precios, horarios, fotos o condiciones que el local no haya confirmado.
3. Reservar es una solicitud humana, no un sistema: el bar confirma a mano.
4. El campo y la terraza calefaccionada son el ambiente; el sitio debe sentirse de ahí, no de una gráfica publicitaria.

## Accessibility & Inclusion
Sitio ya probado con teclado, reduced-motion y móvil estrecho (320 px); mantener contraste suficiente y respeto a prefers-reduced-motion. Español de Chile.
