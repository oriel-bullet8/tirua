/*
 * baraja-datos.js — ÚNICA fuente de datos de la baraja de la carta (palos, colores, productos, joker, rótulo).
 * Los NOMBRES de las categorías no se repiten aquí: salen de js/contenido.js → categorias.items (por `id`).
 *
 * Qué es REAL y qué es PROVISIONAL aquí:
 *  - REAL (carta pública de Justo del bar, tomada el 2026-10-18): los 8 bebestibles (nombre, descripción, precio, foto).
 *    Los precios pueden cambiar. El uso de las fotos en este sitio está PENDIENTE de confirmación con el local.
 *  - PROVISIONAL: el As (primera carta), la asignación palo ↔ categoría y los 4 colores de acento (propuesta de la demo).
 *  - SIN DATOS: las otras 3 categorías (chips «Próximamente»). Filtros alimentarios y joker: ideas pendientes, no activos.
 *
 * Se carga como script clásico (sin módulos), antes de js/render.js y js/baraja.js.
 */
window.DATOS_BARAJA = {

  /*
   * ÚNICO rótulo de demostración en pantalla: un sello fino «Demostración» en la cabecera con un
   * botón «Qué significa» que despliega este detalle. Concentra todos los avisos internos; no hay
   * otros rótulos repartidos por la interfaz (salvo el texto propio del joker y «Próximamente»
   * en los chips deshabilitados, que es un estado funcional).
   */
  rotulo: {
    sello: 'Demostración',
    boton: 'Qué significa',
    detalle: [
      'Los 8 bebestibles (nombres, descripciones, precios y fotos) provienen de la carta pública de Justo del bar, el enlace de su bio de Instagram, tomada el 18 de octubre de 2026. Los precios pueden cambiar.',
      'El uso de estas fotos en este sitio está pendiente de confirmación con el local.',
      'El As (primera carta) es un destacado provisional: el local debe indicar cuál es el real.',
      'Los palos y sus colores son provisionales: la asignación aún no está decidida.',
      'Las demás categorías aún no tienen productos.',
      'Los filtros alimentarios y el joker son ideas pendientes; nada de eso está activo.'
    ]
  },

  /*
   * CATEGORÍAS ↔ PALOS (provisional).
   * palo: 'corazones' | 'diamantes' | 'picas' | 'treboles'
   * acento: color del palo sobre negro (tema oscuro); acentoClaro: el mismo palo sobre papel blanco (tema claro, el predeterminado). Ambos con contraste AA.
   * activa: true  → tiene productos y se puede elegir.
   *         false → chip «Próximamente» deshabilitado (no se inventan productos).
   * El nombre visible viene de js/contenido.js (categorias.items[].nombre, mismo `id`).
   * Para cambiar la asignación basta con cambiar `palo` y `acento` de cada categoría.
   */
  categorias: [
    { id: 'bebestibles',  palo: 'corazones', acento: '#ff5c6c', acentoClaro: '#b3202a', activa: true  },
    { id: 'individuales',  palo: 'picas',     acento: '#5ab0ff', acentoClaro: '#2a4a6b', activa: false },
    { id: 'postres',       palo: 'diamantes', acento: '#f2b544', acentoClaro: '#9a620c', activa: false },
    { id: 'compartir',     palo: 'treboles',  acento: '#4ed08c', acentoClaro: '#2f6b45', activa: false }
  ],

  /*
   * PRODUCTOS (8 bebestibles REALES de la carta pública de Justo del bar, tomados el 2026-10-18).
   * Nombre, descripción y precio (CLP) vienen tal cual del JSON de datos/justo/carta-justo.json (solo se recortan espacios).
   * El ORDEN del arreglo define el valor del naipe dentro de su categoría: A, 2, 3 … 10, J, Q, K (máximo 13 por categoría).
   * El primero de cada categoría es el AS = «destacado provisional» (pendiente de que el local indique el real).
   * `id`: estable en el sitio (el id de Justo y los datos de la foto están en assets/productos/manifiesto.json).
   *
   * imagen: { src, alt, ancho, alto, posicion }  → copia optimizada en assets/productos/ (los originales NO se copian al sitio).
   *   ancho/alto = dimensiones reales de la copia (reservan el espacio). `posicion` = object-position elegido por foto: la ventana
   *   de la carta usa object-fit: cover (recorta, nunca estira) y esta posición deja la bebida completa o razonablemente centrada.
   *   imagen: null → placeholder gris con anillos (sin archivo). El uso de estas fotos en el sitio está PENDIENTE de confirmación con el local.
   *
   * justo: categoría con la que el producto aparece en la carta de Justo (datos/justo/carta-justo.json → categorias[0].nombre). Se muestra en el reverso de la carta junto a la descripción de Justo (tal cual; no se inventan ingredientes).
   *
   * destacado: true → marca el AS. Dato provisional: no se muestra ningún texto sobre él en pantalla.
   *
   * etiquetas: [] → ESTRUCTURA PARA FILTROS ALIMENTARIOS. Los datos reales no traen etiquetas: no se inventan.
   *   TODO: cuando existan datos verificados (p. ej. 'vegetariano', 'sin gluten'), se agregan aquí y se activa la UI de filtros (ver README).
   *   Hoy las etiquetas solo participan en la búsqueda de texto; NO hay filtros alimentarios funcionales.
   */
  productos: [
    { id: 'beb-ramajito', categoria: 'bebestibles', nombre: 'Ramajito', justo: 'Coctelería de autor', precio: 8000, etiquetas: [], destacado: true,
      imagen: { src: 'assets/productos/ramajito.webp', alt: 'Ramajito, bebestible de la carta', ancho: 722, alto: 1000, posicion: '50% 50%' },
      descripcion: 'La combinación perfecta entre un mojito y un Ramazzoti spritz dan resultado un coctel dulce y fresco.' },
    { id: 'beb-playa-tirua', categoria: 'bebestibles', nombre: 'Playa Tirúa', justo: 'Coctelería de autor', precio: 8500, etiquetas: [],
      imagen: { src: 'assets/productos/playa-tirua.webp', alt: 'Playa Tirúa, bebestible de la carta', ancho: 750, alto: 1000, posicion: '50% 50%' },
      descripcion: 'Refrescante coctel con una base de ron blanco, pulpa de piña, blue curaçao, limón y Ginger beer, los cuales le aportan el toque acido.' },
    { id: 'beb-sol-de-fuego', categoria: 'bebestibles', nombre: 'Sol de Fuego', justo: 'Coctelería de autor', precio: 7900, etiquetas: [],
      imagen: { src: 'assets/productos/sol-de-fuego.webp', alt: 'Sol de Fuego, bebestible de la carta', ancho: 812, alto: 1000, posicion: '50% 50%' },
      descripcion: 'Combina la idea del Tequila con el ají amarillo, evocando un sabor intenso y apasionado' },
    { id: 'beb-botanical-collins', categoria: 'bebestibles', nombre: 'Botanical Collins', justo: 'Coctelería de autor', precio: 8200, etiquetas: [],
      imagen: { src: 'assets/productos/botanical-collins.webp', alt: 'Botanical Collins, bebestible de la carta', ancho: 750, alto: 1000, posicion: '50% 50%' },
      descripcion: 'Delicioso coctel fresco y tropical, con gin Gordon\'s, pepino, pulpa de maracuyá y para terminar una Tomas Henry botanical tonic.' },
    { id: 'beb-jackie-jr', categoria: 'bebestibles', nombre: 'Jackie Jr.', justo: 'Coctelería de autor', precio: 7500, etiquetas: [],
      imagen: { src: 'assets/productos/jackie-jr.webp', alt: 'Jackie Jr., bebestible de la carta', ancho: 750, alto: 1000, posicion: '50% 50%' },
      descripcion: 'Jack Daniels, Maracuyá, naranja, limón y sirope de azúcar' },
    { id: 'beb-espresso-vainilla', categoria: 'bebestibles', nombre: 'Espresso Vainilla', justo: 'Coctelería de autor', precio: 6900, etiquetas: [],
      imagen: { src: 'assets/productos/espresso-vainilla.webp', alt: 'Espresso Vainilla, bebestible de la carta', ancho: 751, alto: 1000, posicion: '50% 50%' },
      descripcion: 'Vodka Stoli, Kahlua, jarabe de goma, cafe espresso y helado de vainilla' },
    { id: 'beb-ramazzotti-spritz', categoria: 'bebestibles', nombre: 'Ramazzotti Spritz', justo: 'Spritz', precio: 6900, etiquetas: [],
      imagen: { src: 'assets/productos/ramazzotti-spritz.webp', alt: 'Ramazzotti Spritz, bebestible de la carta', ancho: 750, alto: 1000, posicion: '50% 50%' },
      descripcion: 'Ramazzotti, espumante y soda.' },
    { id: 'beb-green-drinks', categoria: 'bebestibles', nombre: 'Green Drinks', justo: 'Mocktail', precio: 5900, etiquetas: [],
      imagen: { src: 'assets/productos/green-drinks.webp', alt: 'Green Drinks, bebestible de la carta', ancho: 1000, alto: 1000, posicion: '50% 50%' },
      descripcion: 'Manzana verde, pulpa de piña, pepino, albahaca, limón, jengibre y soda' }
  ],

  /*
   * JOKER — IDEA PENDIENTE, SOLO VISUAL.
   * activo: false → no hay aparición automática ni aleatoria. El sitio solo lo muestra
   * con el botón «Vista previa del joker (demostración)».
   * La aparición aleatoria, sus reglas y cualquier beneficio se definirán con el local.
   * Esta integración NO implementa premios, probabilidades, descuentos ni lógica real.
   */
  joker: {
    activo: false,
    acento: '#b79cff',
    acentoClaro: '#6b46c9',
    texto: 'Joker: beneficio por definir con el local. Idea pendiente: no es un descuento ni un premio real.',
    botonVincular: 'Vincular a una solicitud de reserva (pendiente)'
  }
};
