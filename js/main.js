// Cabecera transparente que se vuelve negra al hacer scroll, sección activa en el menú y revelado de secciones.
(function () {
  'use strict';

  var cabecera = document.querySelector('[data-cabecera]');
  if (cabecera) {
    var ticking = false;
    var siempreSolida = document.body.hasAttribute('data-cabecera-solida') || cabecera.classList.contains('es-solida');
    var actualizar = function () {
      var bajado = window.scrollY > 8;
      cabecera.classList.toggle('es-plegada', bajado);          // la barra de aviso se pliega
      cabecera.classList.toggle('es-solida', siempreSolida || bajado);   // el fondo pasa a negro
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(actualizar); }
    }, { passive: true });
    actualizar();
  }

  // Sección activa: marca con aria-current el enlace del menú cuya sección cruza el centro de la pantalla.
  if ('IntersectionObserver' in window) {
    var enlacesMenu = document.querySelectorAll('[data-nav] a');
    var marcar = function (id) {
      enlacesMenu.forEach(function (a) {
        if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    };
    var espia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) marcar(e.target.id === 'categorias' ? 'carta' : e.target.id); });
    }, { rootMargin: '-45% 0px -54% 0px' });
    ['inicio', 'categorias', 'carta', 'reservas', 'mapa', 'delivery'].forEach(function (id) {
      var s = document.getElementById(id); if (s) espia.observe(s);
    });
  }

  // El hero detiene sus animaciones infinitas (anillos, calor) cuando sale de pantalla
  var hero = document.querySelector('[data-hero]');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { hero.classList.toggle('fuera', !en[0].isIntersecting); }, { threshold: 0 }).observe(hero);
  }

  // La cinta solo corre mientras se ve: fuera de pantalla se detiene (menos trabajo continuo)
  var cinta = document.querySelector('.cinta');
  if (cinta && 'IntersectionObserver' in window) {
    cinta.classList.add('es-quieta');
    new IntersectionObserver(function (en) { cinta.classList.toggle('es-quieta', !en[0].isIntersecting); }, { threshold: 0.05 }).observe(cinta);
  }

  var items = document.querySelectorAll('.reveal');
  var visible = function (el) { el.classList.add('es-visible'); };
  if (!('IntersectionObserver' in window)) { items.forEach(visible); return; }

  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting) { visible(e.target); observador.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  items.forEach(function (el) { observador.observe(el); });
})();
