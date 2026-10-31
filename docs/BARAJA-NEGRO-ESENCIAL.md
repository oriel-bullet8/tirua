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

## Ajustes posteriores del 31 de octubre

Se redibujaron los ocho contornos SVG en las dimensiones reales de cada foto, con curvas específicas para bordes, adornos, tallos y bases. La foto original de Green Drinks termina antes de mostrar toda la base: se suaviza ese extremo sin inventar la parte faltante. Se ajustó el encuadre de Espresso Vainilla y se versionaron las máscaras para actualizar la caché.

La ficha de dirección, horario y ambiente está centrada, con iconos discretos, marco cálido y botón centrado. Se retiró la tira decorativa de días. La cinta de texto se movió desde el mapa a la portada, inmediatamente después de las historias, conservando su contenido y pausa fuera de pantalla.

Comprobado en navegador: ocho recortes sobre fondo de contraste; ficha completa y carta de Espresso Vainilla a 390 × 844; navegación y giro; cinta única bajo historias; ancho de documento sin desbordamiento horizontal. Sintaxis JavaScript y XML de las máscaras válidos.

## Verde de Pirque y reservas integradas

Los acentos de navegación, historias, botones y ficha del local pasan a verde bosque con salvia. La sección de reservas muestra tres pasos compactos en una sola fila y un botón verde de tamaño moderado, sin el fondo de anillos ni la tipografía sobredimensionada. El texto explica la solicitud y la confirmación por el bar de forma breve.

El asistente de reserva comparte la paleta, usa un fondo claro y controles con bordes suaves. Se conservan sus datos, horarios de muestra y la confirmación manual. Verificado en móvil: acceso desde el botón de la portada, elección de personas, fecha y apertura de horas; sin envío de solicitud. Documento sin desbordamiento horizontal.

## Simplificación solicitada: solo dos botones

El bloque de inicio se reduce a dos enlaces grandes y centrados: «Celebra tu cumpleaños» y «Reserva una mesa». Se eliminan su título, bajada, pasos y texto explicativo. El primero abre el asistente con Cumpleaños preseleccionado; el segundo conserva una solicitud normal.
