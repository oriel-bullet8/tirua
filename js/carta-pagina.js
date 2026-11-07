// Página de carta (carta.html): dibuja bloques → secciones → productos desde js/carta-datos.js,
// con barra fija de bloques (resalta el que se está viendo) y buscador por nombre o descripción.
(function () {
  'use strict';

  var D = window.TIRUA_CARTA;
  var cont = document.querySelector('[data-cp-contenido]');
  if (!D || !cont) return;

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function plata(n) { return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function plano(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  // ---------- Nota con la fecha de la captura ----------
  var nota = document.querySelector('[data-cp-nota]');
  if (nota) {
    var f = (D.meta.capturado || '').split('-');
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var fecha = f.length === 3 ? (parseInt(f[2], 10) + ' de ' + meses[parseInt(f[1], 10) - 1] + ' de ' + f[0]) : '';
    nota.textContent = 'Precios en pesos chilenos' + (fecha ? ', según la carta del ' + fecha : '') + '. Pueden cambiar.';
  }

  // Datos del local para el encabezado del PDF
  var loc = document.querySelector('[data-cp-local]'), L = (window.TIRUA_CONTENIDO || {}).local;
  if (loc && L) loc.textContent = [L.nombre.replace(/\s*\|.*/, ''), L.direccion.replace(/, Región Metropolitana, Chile/, ''), L.horario.texto, '@' + L.instagram].join(' · ');

  // ---------- Dibujo ----------
  var navLista = document.querySelector('[data-cp-nav]');
  var items = [];      // { li, texto }
  var secs = [];       // { nodo, items[] }
  var bloques = [];    // { nodo, secs[], chip }

  function tarjeta(p) {
    var li = el('li', p.foto ? 'cp-item cp-item--foto' : 'cp-item cp-item--texto');
    if (p.foto) {
      var marco = el('div', 'cp-item__foto');
      var img = el('img');
      img.src = p.foto; img.alt = ''; img.width = p.w; img.height = p.h;
      img.loading = 'lazy'; img.decoding = 'async';
      marco.appendChild(img);
      li.appendChild(marco);
    }
    var cuerpo = el('div', 'cp-item__cuerpo');
    var cab = el('div', 'cp-item__cab');
    cab.appendChild(el('h4', 'cp-item__nombre', p.nombre));
    if (p.precio) cab.appendChild(el('span', 'cp-item__precio', plata(p.precio)));
    cuerpo.appendChild(cab);
    if (p.descripcion) cuerpo.appendChild(el('p', 'cp-item__desc', p.descripcion));
    li.appendChild(cuerpo);
    items.push({ li: li, texto: plano(p.nombre + ' ' + (p.descripcion || '')) });
    return li;
  }

  D.bloques.forEach(function (b) {
    var nodo = el('section', 'cp-bloque');
    nodo.id = 'bloque-' + b.id;
    nodo.setAttribute('aria-labelledby', 'bloque-' + b.id + '-t');
    var h2 = el('h2', 'cp-bloque__titulo', b.nombre);
    h2.id = 'bloque-' + b.id + '-t';
    nodo.appendChild(h2);

    var estructura = { nodo: nodo, secs: [], chip: null };
    b.secciones.forEach(function (s) {
      var sn = el('div', 'cp-sec');
      var h3 = el('h3', 'cp-sec__titulo');
      h3.appendChild(document.createTextNode(s.nombre));
      h3.appendChild(el('span', 'cp-sec__n', String(s.productos.length)));
      sn.appendChild(h3);
      var conFoto = s.productos.filter(function (p) { return p.foto; });
      var sinFoto = s.productos.filter(function (p) { return !p.foto; });
      var secItems = [];
      if (conFoto.length) {
        var ul = el('ul', 'cp-grid');
        conFoto.forEach(function (p) { ul.appendChild(tarjeta(p)); });
        sn.appendChild(ul);
      }
      if (sinFoto.length) {
        var ul2 = el('ul', 'cp-lista');
        sinFoto.forEach(function (p) { ul2.appendChild(tarjeta(p)); });
        sn.appendChild(ul2);
      }
      nodo.appendChild(sn);
      estructura.secs.push({ nodo: sn });
    });
    cont.appendChild(nodo);
    bloques.push(estructura);

    var li = el('li');
    var a = el('a', 'cp-nav__chip', b.nombre);
    a.href = '#bloque-' + b.id;
    li.appendChild(a);
    navLista.appendChild(li);
    estructura.chip = a;
  });

  // Cada sección conoce sus items para poder ocultarse sola al buscar.
  bloques.forEach(function (b) {
    b.secs.forEach(function (s) { s.items = Array.prototype.slice.call(s.nodo.querySelectorAll('.cp-item')); });
  });
  var porLi = new Map(); items.forEach(function (it) { porLi.set(it.li, it); });

  // ---------- Buscador ----------
  var entrada = document.querySelector('[data-cp-buscar]');
  var vacio = document.querySelector('[data-cp-vacio]');
  var estado = document.querySelector('[data-cp-estado]');
  function filtrar() {
    var q = plano(entrada.value).trim();
    var visibles = 0;
    bloques.forEach(function (b) {
      var enBloque = 0;
      b.secs.forEach(function (s) {
        var enSec = 0;
        s.items.forEach(function (li) {
          var ok = !q || porLi.get(li).texto.indexOf(q) !== -1;
          li.hidden = !ok;
          if (ok) enSec++;
        });
        s.nodo.hidden = enSec === 0;
        enBloque += enSec;
      });
      b.nodo.hidden = enBloque === 0;
      b.chip.parentNode.hidden = enBloque === 0;
      visibles += enBloque;
    });
    vacio.hidden = visibles !== 0;
    estado.textContent = q ? (visibles === 1 ? '1 producto' : visibles + ' productos') : '';
  }
  entrada.addEventListener('input', filtrar);

  // ---------- Barra fija: queda bajo la cabecera (que cambia de alto al plegar el aviso) ----------
  var cab = document.querySelector('[data-cabecera]');
  var barra = document.querySelector('[data-cp-barra]');
  function ubicar() {
    if (!cab || !barra) return;
    document.documentElement.style.setProperty('--cp-top', Math.round(cab.getBoundingClientRect().height) + 'px');
  }
  ubicar();
  window.addEventListener('scroll', function () { requestAnimationFrame(ubicar); }, { passive: true });
  window.addEventListener('resize', ubicar);
  if (cab && 'ResizeObserver' in window) new ResizeObserver(ubicar).observe(cab);

  // ---------- Bloque actual en la barra ----------
  if ('IntersectionObserver' in window) {
    var actual = null;
    var espia = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var b = bloques.filter(function (x) { return x.nodo === e.target; })[0];
        if (!b || b === actual) return;
        if (actual) actual.chip.removeAttribute('aria-current');
        b.chip.setAttribute('aria-current', 'true');
        actual = b;
        if (!entrada.value && b.chip.scrollIntoView && navLista.scrollWidth > navLista.clientWidth) {
          var ul = navLista, c = b.chip.getBoundingClientRect(), r = ul.getBoundingClientRect();
          ul.scrollTo({ left: ul.scrollLeft + (c.left - r.left) - (r.width - c.width) / 2, behavior: 'smooth' });
        }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    bloques.forEach(function (b) { espia.observe(b.nodo); });
  }
})();
