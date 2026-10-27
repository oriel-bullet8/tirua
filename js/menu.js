// Menú móvil (hamburguesa): aria-expanded, Esc, cierre al elegir un enlace, foco gestionado y atrapado.
// En escritorio el botón no se muestra y el menú es una fila de enlaces.
(function () {
  'use strict';

  var cabecera = document.querySelector('[data-cabecera]');
  var boton = document.querySelector('[data-menu-boton]');
  var menu = document.querySelector('[data-menu]');
  if (!cabecera || !boton || !menu) return;

  var movil = window.matchMedia('(max-width: 859px)');
  var resto = [document.getElementById('contenido'), document.querySelector('.pie'), document.querySelector('.saltar')];
  var abierto = false;

  function enlaces() { return Array.prototype.slice.call(menu.querySelectorAll('a')); }

  function inerte(valor) {
    resto.forEach(function (n) { if (n) { if (valor) n.setAttribute('inert', ''); else n.removeAttribute('inert'); } });
  }

  function abrir() {
    abierto = true;
    boton.setAttribute('aria-expanded', 'true');
    cabecera.classList.add('menu-abierto');
    document.documentElement.classList.add('menu-abierto');
    inerte(true);
    var primero = enlaces()[0];
    if (primero) primero.focus();
  }

  function cerrar(devolverFoco) {
    if (!abierto) return;
    abierto = false;
    boton.setAttribute('aria-expanded', 'false');
    cabecera.classList.remove('menu-abierto');
    document.documentElement.classList.remove('menu-abierto');
    inerte(false);
    if (devolverFoco) boton.focus();
  }

  boton.addEventListener('click', function () { if (abierto) cerrar(true); else abrir(); });

  // Elegir un enlace cierra el menú; el navegador se encarga de llevar a la sección.
  menu.addEventListener('click', function (ev) {
    if (ev.target.closest && ev.target.closest('a')) cerrar(false);
  });

  document.addEventListener('keydown', function (ev) {
    if (!abierto) return;
    if (ev.key === 'Escape') { ev.preventDefault(); cerrar(true); return; }
    if (ev.key !== 'Tab') return;
    // Atrapa el foco entre el botón, el logo y los enlaces del menú (lo demás está inerte).
    var orden = [boton, cabecera.querySelector('.marca')].concat(enlaces());
    var i = orden.indexOf(document.activeElement);
    if (ev.shiftKey && i <= 0) { ev.preventDefault(); orden[orden.length - 1].focus(); }
    else if (!ev.shiftKey && (i === orden.length - 1 || i === -1)) { ev.preventDefault(); orden[0].focus(); }
  });

  // Si la ventana pasa a escritorio con el menú abierto, se cierra.
  var cambio = function () { if (!movil.matches) cerrar(false); };
  if (movil.addEventListener) movil.addEventListener('change', cambio); else movil.addListener(cambio);
})();
