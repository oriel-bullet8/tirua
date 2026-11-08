/*
 * baraja-datos.js — datos de la baraja de la carta: palos y colores por categoría, mazos y joker.
 * Los productos y las secciones NO se escriben aquí: los genera scripts/carta-construir.py desde la carta de Justo
 * (js/baraja-productos.js, que se carga justo después de este archivo).
 * Los NOMBRES de las categorías salen de js/contenido.js → categorias.items (por `id`).
 *
 * Se carga como script clásico (sin módulos), antes de js/render.js y js/baraja.js.
 */
window.DATOS_BARAJA = {

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
    { id: 'individuales',  palo: 'picas',     acento: '#5ab0ff', acentoClaro: '#2a4a6b', activa: true  },
    { id: 'postres',       palo: 'diamantes', acento: '#f2b544', acentoClaro: '#9a620c', activa: true  },
    { id: 'compartir',     palo: 'treboles',  acento: '#4ed08c', acentoClaro: '#2f6b45', activa: true  }
  ],

  productos: [],   // los llena js/baraja-productos.js (generado)
  secciones: [],

  /*
   * MAZOS que se ofrecen al «Abrir la carta» (paso «Escoger mazo»).
   * Cada categoría es un mazo, salvo las que se parten aquí: solo Bebestibles (196 cartas) se divide en tres.
   * `secciones` son los ids de js/baraja-productos.js → secciones.
   */
  mazos: [
    { id: 'cocteleria', categoria: 'bebestibles', nombre: 'Coctelería', descripcion: 'Tragos de autor, internacionales, sours, spritz y mocktails.',
      secciones: ['cocteleria-de-autor', 'cocteleria-internacional', 'rincon-de-los-sour', 'spritz', 'mocktail'] },
    { id: 'destilados', categoria: 'bebestibles', nombre: 'Destilados y vinos', descripcion: 'Vodka, gin, pisco, whisky, ron, tequila, espumantes y vino.',
      secciones: ['vodka', 'gin', 'pisco', 'whisky', 'ron', 'tequila', 'shot', 'jarras-y-licores', 'espumantes', 'vino'] },
    { id: 'cervezas', categoria: 'bebestibles', nombre: 'Cervezas y bebidas', descripcion: 'Cerveza, shop, bebidas y cafetería.',
      secciones: ['cerveza', 'shop', 'bebida', 'cafeteria'] }
  ],

  /*
   * JOKER — escondido en el mazo, con baja probabilidad (`probabilidad`) y como máximo `maxPorVisita` por visita.
   * Al llegar a la carta boca abajo, se da vuelta y muestra `texto`. El BENEFICIO REAL lo define el Bar
   * (descuento en la próxima visita, en reservas, en comidas individuales…): hasta entonces `texto` dice que es una demostración (pendiente, se define al final).
   * `activo: false` lo apaga por completo. `?joker=1` en la URL fuerza que salga (para probar).
   * El botón «Vista previa del joker» sigue siendo una opción de demostración.
   */
  joker: {
    activo: true,
    probabilidad: 0.12,     // chance de que un mazo recién repartido lleve el joker escondido
    maxPorVisita: 1,        // veces que puede salir en una misma visita (pestaña)
    acento: '#b79cff',
    acentoClaro: '#6b46c9',
    texto: '¡Te salió el Joker! El Bar define aquí tu beneficio (por ejemplo, un descuento en tu próxima visita). Por ahora es una demostración: no es un descuento real.'
  }
};
