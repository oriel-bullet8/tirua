# Baraja Negro esencial

Dirección visual aprobada e implementada el 31 de octubre de 2026.

- Cartas negras con marco clásico europeo en SVG, perímetro continuo e índices dentro del marco.
- Dorso con el logo circular original de Tirúa, sin paisaje.
- Frente con fotografía original del producto y solo su nombre. Precio y descripción disponibles al girar.
- Se conservan los ocho productos, sus datos y la interacción existente de apertura, navegación, barajado y giro.

## Recursos

`js/baraja-arte.js` asigna un paisaje y el encuadre a cada producto. Las máscaras SVG de `assets/baraja/recortes/` ocultan el fondo de las fotos sin modificar los archivos originales. `assets/baraja/paisajes-oleo.webp` contiene ocho fondos pictóricos generados; no contiene bebidas generadas. El marco y los índices son elementos vectoriales y texto, no parte de la imagen.

## Validación

Revisión visual en navegador a tamaño de escritorio y a 390 × 844; recorrido de las ocho bebidas, apertura, giro con ficha y precio y cierre del mazo. Se comprobó que las ocho fotos cargan y sus archivos mantienen los SHA de Git de la versión base; referencias locales, XML de las ocho máscaras y sintaxis JavaScript válidos. El vídeo de portada sigue ausente, como en la versión base.

Las pruebas históricas que esperan el precio visible en el frente ya no describen el diseño aprobado. El verificador HTTP no pudo alcanzar el servidor de vista previa administrado desde la terminal; no se declara aprobado.
