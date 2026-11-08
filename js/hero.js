// El paisaje acompaña el scroll en escritorio; en celular y con movimiento
// reducido permanece quieto. No se crean bucles de animación en reposo.
(function () {
  'use strict';
  var capa = document.querySelector('.fondo-vivo__profundidad');
  if (!capa) return;
  var movimiento = window.matchMedia('(min-width: 701px) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  var pendiente = false;
  function pintar() {
    pendiente = false;
    var recorrido = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var proporcion = Math.max(0, Math.min(1, window.scrollY / recorrido));
    capa.style.setProperty('--bosque-y', movimiento.matches ? (-32 * proporcion).toFixed(2) + 'px' : '0px');
  }
  function solicitar() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(pintar);
  }
  window.addEventListener('scroll', solicitar, { passive: true });
  window.addEventListener('resize', solicitar, { passive: true });
  if (movimiento.addEventListener) movimiento.addEventListener('change', solicitar);
  pintar();
})();
