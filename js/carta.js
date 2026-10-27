// Bloques de categorías (#categorias) → carta. La baraja vive en js/baraja.js; aquí solo se conectan los bloques.
// Al pulsar un bloque: se va a la carta (sin que la cabecera fija la tape), se selecciona su categoría y se abre la baraja.
// Si la categoría es «Próximamente», la baraja muestra un aviso visible (todavía no tiene productos) sin romper nada.
(function () {
  'use strict';

  var destino = document.querySelector('#carta');
  var bloques = Array.prototype.slice.call(document.querySelectorAll('.cat__enlace[data-categoria]'));
  if (!destino || !bloques.length) return;

  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)');

  function pintarActual(id) {
    bloques.forEach(function (b) {
      if (b.getAttribute('data-categoria') === id) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  }
  // Los bloques siguen a la categoría activa de la baraja (chips, botón «Restablecer», etc.).
  document.addEventListener('tirua:categoria', function (e) { pintarActual(e.detail && e.detail.id); });

  bloques.forEach(function (bloque) {
    bloque.addEventListener('click', function (ev) {
      ev.preventDefault();
      var id = bloque.getAttribute('data-categoria');
      var abrio = window.TIRUA && window.TIRUA.baraja ? window.TIRUA.baraja.irACategoria(id) : false;
      // Si la carta se abre a pantalla completa no hace falta desplazar; si es una categoría «Próximamente» se baja al aviso, para que se vea la respuesta al clic.
      var aviso = document.getElementById('aviso-portal');
      if (!abrio) (aviso && !aviso.hidden ? aviso : destino).scrollIntoView({ behavior: reducido.matches ? 'auto' : 'smooth', block: 'center' });
      if (history.replaceState) history.replaceState(history.state, '', '#carta');
      // El bloque marcado es siempre la categoría activa de la baraja (una «Próximamente» no la cambia).
      pintarActual(window.TIRUA && window.TIRUA.categoriaActual ? window.TIRUA.categoriaActual.id : null);
    });
  });
})();
