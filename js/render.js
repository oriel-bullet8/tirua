// Pinta en el HTML todo lo que viene de js/contenido.js (textos, logo, categorías, sedes, delivery, pie).
// Se ejecuta de forma síncrona al final del <body>, antes del primer pintado.
(function () {
  'use strict';

  var C = window.TIRUA_CONTENIDO;
  if (!C) return;

  // URL del perfil de Instagram a partir de instagram.usuario (null si no hay usuario válido).
  window.TIRUA = window.TIRUA || {};
  window.TIRUA.usuarioInstagram = function () {
    var u = C.instagram && typeof C.instagram.usuario === 'string' ? C.instagram.usuario.replace(/^@/, '') : '';
    return /^[A-Za-z0-9._]{1,30}$/.test(u) ? u : null;
  };
  window.TIRUA.urlInstagram = function () {
    var u = window.TIRUA.usuarioInstagram();
    return u ? 'https://www.instagram.com/' + u + '/' : null;
  };

  function el(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  }
  function ruta(obj, camino) {
    return camino.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function porAtributo(attr, fn) {
    Array.prototype.forEach.call(document.querySelectorAll('[' + attr + ']'), fn);
  }
  var FLECHA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17L17 7M9 7h8v8"/></svg>';

  // ---------- Textos ----------
  porAtributo('data-texto', function (n) {
    var t = ruta(C, n.getAttribute('data-texto'));
    if (typeof t === 'string') n.textContent = t;
  });

  // ---------- Logo (una sola configuración: marca.*) ----------
  var marca = C.marca || {};
  var logoCab = marca.cabecera || marca.principal;
  if (marca.proporcionPrincipal) document.documentElement.style.setProperty('--proporcion-logo', marca.proporcionPrincipal);
  if (marca.alturaCabecera) document.documentElement.style.setProperty('--alto-logo', marca.alturaCabecera + 'px');
  porAtributo('data-logo', function (img) {
    var src = img.getAttribute('data-logo') === 'principal' ? marca.principal : logoCab;
    if (src) img.src = src;
    if (img.hasAttribute('data-alt')) img.alt = marca.alt || '';
  });

  // ---------- Navegación (cabecera y pie) ----------
  // En reservar.html las anclas apuntan al inicio (index.html#…) y «Reservas» es la página actual.
  var enReservar = document.body.getAttribute('data-pagina') === 'reservar';
  function enlaces(lista, clase) {
    if (!lista) return;
    (C.navegacion || []).forEach(function (n) {
      var li = el('li');
      var a = el('a', clase, n.texto);
      if (enReservar && n.href === '#reservas') { a.href = 'reservar.html'; a.setAttribute('aria-current', 'page'); }
      else a.href = (enReservar ? 'index.html' : '') + n.href;
      li.appendChild(a);
      lista.appendChild(li);
    });
  }
  // El logo lleva al inicio también desde reservar.html.
  if (enReservar) Array.prototype.forEach.call(document.querySelectorAll('a.marca'), function (a) { a.href = 'index.html'; });
  enlaces(document.querySelector('[data-nav]'), 'menu__enlace');
  enlaces(document.querySelector('[data-nav-pie]'), 'pie__enlace');

  // ---------- Categorías: bloques grandes ----------
  var cats = C.categorias || { items: [] };
  // Palo y estado de cada categoría (js/baraja-datos.js, mismo id): se muestra sutilmente en cada bloque.
  var paleta = {};
  ((window.DATOS_BARAJA && window.DATOS_BARAJA.categorias) || []).forEach(function (p) { paleta[p.id] = p; });
  var lista = document.querySelector('[data-categorias]');
  if (lista) {
    cats.items.forEach(function (c, i) {
      var li = el('li', 'cat reveal');
      li.style.setProperty('--d', (i * 90) + 'ms');
      var a = el('a', 'cat__enlace');
      a.href = '#carta';
      a.setAttribute('data-categoria', c.id);
      var pal = paleta[c.id];
      var pronto = !!(pal && !pal.activa);
      a.setAttribute('aria-label', c.nombre + (pronto ? ': próximamente, ver en la carta' : ': ver en la carta'));
      if (pal) a.style.setProperty('--cat-acento', pal.acento);

      var foto = el('span', 'cat__foto cat__foto--' + (i % 4));
      foto.setAttribute('aria-hidden', 'true');
      if (c.imagen) {
        var img = new Image();
        img.src = c.imagen; img.alt = c.altImagen || ''; img.loading = 'lazy'; img.decoding = 'async';
        img.className = 'cat__img';
        foto.appendChild(img);
      } else {
        // Marcador de foto: grises y líneas finas. No hace ninguna petición.
        var cx = [270, 120, 250, 140][i % 4], cy = [110, 190, 100, 200][i % 4];
        var svg = '<svg class="cat__ph" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" focusable="false">';
        [34, 64, 100, 144, 196, 260].forEach(function (r) { svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>'; });
        foto.innerHTML = svg + '</svg>';
      }
      a.appendChild(foto);
      a.appendChild(el('span', 'cat__velo')).setAttribute('aria-hidden', 'true');

      var num = el('span', 'cat__num', (i + 1 < 10 ? '0' : '') + (i + 1));
      num.setAttribute('aria-hidden', 'true');
      if (pal) num.insertAdjacentHTML('beforeend', '<svg class="cat__palo" viewBox="0 0 100 100" focusable="false" aria-hidden="true"><use href="#palo-' + pal.palo + '"/></svg>');
      a.appendChild(num);
      if (!c.imagen) {
        var rot = el('span', 'cat__rotulo', cats.rotuloFoto || 'Foto pendiente');
        rot.setAttribute('aria-hidden', 'true');
        a.appendChild(rot);
      }
      var tx = el('span', 'cat__texto');
      tx.appendChild(el('span', 'cat__nombre', c.nombre));
      if (c.descripcion) {
        var d = el('span', 'cat__desc', c.descripcion);
        d.id = 'cat-desc-' + c.id;
        a.setAttribute('aria-describedby', d.id);
        tx.appendChild(d);
      }
      if (pronto) {
        var pr = el('span', 'cat__pronto', cats.rotuloProximamente || 'Próximamente');
        pr.id = 'cat-pronto-' + c.id;
        a.setAttribute('aria-describedby', (a.getAttribute('aria-describedby') || '') + ' ' + pr.id);
        tx.appendChild(pr);
      }
      a.appendChild(tx);
      var fl = el('span', 'cat__flecha');
      fl.setAttribute('aria-hidden', 'true');
      fl.innerHTML = FLECHA;
      a.appendChild(fl);

      li.appendChild(a);
      lista.appendChild(li);
    });
  }

  // ---------- Carta: enlace a la carta completa en la plataforma del bar (local.pedidos) ----------
  var enlaceCarta = document.querySelector('[data-carta-enlace]');
  if (enlaceCarta) {
    if (C.local && C.local.pedidos) enlaceCarta.href = C.local.pedidos;
    else enlaceCarta.parentNode.hidden = true;
  }

  // ---------- Botón «pendiente» o enlace real, según haya url ----------
  // Sin url el botón queda deshabilitado con aria-disabled (sigue recibiendo foco para que se lea su nota).
  // Con url es un enlace normal que se abre en otra pestaña (la nota avisa que es una web externa).
  var nAccion = 0;
  function accion(texto, url, clase, nota) {
    var cont = el('div', 'accion');
    var c;
    if (url) { c = el('a', 'btn ' + clase); c.href = url; c.target = '_blank'; c.rel = 'noopener noreferrer'; }
    else {
      c = el('button', 'btn ' + clase); c.type = 'button'; c.setAttribute('aria-disabled', 'true');
      c.addEventListener('click', function (ev) { ev.preventDefault(); });
    }
    c.appendChild(el('span', null, texto));
    cont.appendChild(c);
    if (nota) {
      var n = el('p', 'accion__nota', nota);
      n.id = 'accion-nota-' + (++nAccion);
      c.setAttribute('aria-describedby', n.id);
      cont.appendChild(n);
    }
    return cont;
  }

  // ---------- Mapa: sedes ----------
  var sedes = document.querySelector('[data-sedes]');
  if (sedes && C.mapa) {
    C.mapa.sedes.forEach(function (s) {
      var li = el('li', 'sede');
      li.appendChild(el('h3', 'sede__nombre', s.nombre.replace(/-/g, '\u2011')));
      var dl = el('dl', 'sede__datos');
      [['Dirección', s.direccion], ['Horario', s.horario, s.horarioNota], ['Ambiente', s.ambiente]].forEach(function (p, k) {
        if (!p[1]) return;
        var d = el('div');
        d.style.setProperty('--i', k);
        var dt = el('dt');
        var iconos = [
          '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
          '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
          '<path d="M12 21v-7M12 3 5 12h4l-4 5h14l-4-5h4L12 3Z"/>'
        ];
        dt.innerHTML = '<svg class="sede__icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + iconos[k] + '</svg>';
        dt.appendChild(el('span', null, p[0]));
        d.appendChild(dt);
        var dd = el('dd', null, p[1]);
        if (p[2]) dd.appendChild(el('span', 'sede__nota', p[2]));
        d.appendChild(dd);
        dl.appendChild(d);
      });
      li.appendChild(dl);
      var comoLlegar = accion(s.cta, s.url, 'btn--linea', s.notaCta);
      var botonMapa = comoLlegar.querySelector('.btn');
      botonMapa.insertAdjacentHTML('beforeend', '<svg class="sede__flecha" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12"/></svg>');
      li.appendChild(comoLlegar);
      sedes.appendChild(li);
    });
  }

  // ---------- Mapa de Google (iframe incrustado; mapa.embed = null lo omite) ----------
  var ifr = document.querySelector('[data-mapa-iframe]');
  if (ifr) {
    if (C.mapa && C.mapa.embed) ifr.src = C.mapa.embed;
    else ifr.remove();
  }

  // ---------- Delivery: vista previa de la carta de pedidos (productos de js/baraja-datos.js; cada fila abre la plataforma) ----------
  var pedido = document.querySelector('[data-pedido]');
  var prods = (window.DATOS_BARAJA && window.DATOS_BARAJA.productos) || [];
  if (pedido && prods.length && C.delivery && C.delivery.url) {
    var ul = pedido.querySelector('[data-pedido-lista]');
    var clp = function (n) { return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
    prods.forEach(function (p) {
      var li = el('li', 'pedido__item');
      var a = el('a', 'pedido__enlace');
      a.href = C.delivery.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', p.nombre + ', ' + clp(p.precio) + '. Abre la plataforma del bar en otra pestaña');
      if (p.imagen && p.imagen.src) {
        var im = new Image(); im.src = p.imagen.src; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.width = 160; im.height = 160;
        im.className = 'pedido__foto'; a.appendChild(im);
      }
      var tx = el('span', 'pedido__texto');
      tx.appendChild(el('span', 'pedido__nombre', p.nombre));
      tx.appendChild(el('span', 'pedido__precio', clp(p.precio)));
      a.appendChild(tx);
      var mas = el('span', 'pedido__mas'); mas.setAttribute('aria-hidden', 'true'); mas.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 5v14M5 12h14"/></svg>';
      a.appendChild(mas);
      li.appendChild(a); ul.appendChild(li);
    });
    pedido.hidden = false;
  }

  // ---------- Cinta bajo el mapa ----------
  var cintaP = document.querySelector('[data-cinta-pista]');
  if (cintaP && C.mapa && C.mapa.cinta && C.mapa.cinta.length) {
    for (var rep = 0; rep < 4; rep++) C.mapa.cinta.forEach(function (t) { cintaP.appendChild(el('span', 'cinta__item', t)); });
  } else if (cintaP) cintaP.parentNode.hidden = true;

  // ---------- Delivery: collage de tres fotos del pedido ----------
  var collage = document.querySelector('[data-collage]');
  if (collage && prods.length >= 3) {
    [1, 3, 5].forEach(function (i, k) {
      var p = prods[i]; if (!p || !p.imagen) return;
      var im = new Image(); im.src = p.imagen.src; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.width = 300; im.height = 400;
      im.className = 'delivery__foto delivery__foto--' + (k + 1); collage.appendChild(im);
    });
  } else if (collage) collage.hidden = true;

  // ---------- Delivery ----------
  var dv = document.querySelector('[data-delivery-accion]');
  if (dv && C.delivery) dv.appendChild(accion(C.delivery.cta, C.delivery.url, 'btn--principal', C.delivery.notaCta));

  // ---------- Pie: Instagram (sin enlace mientras url sea null) ----------
  var ig = document.querySelector('[data-pie-instagram]');
  if (ig && C.pie && C.pie.instagram) {
    var i = C.pie.instagram;
    var u = window.TIRUA.usuarioInstagram();
    i = { texto: i.texto || (u ? '@' + u : 'Instagram'), nota: i.nota, url: i.url || window.TIRUA.urlInstagram() };
    if (i.url) {
      ig.appendChild(el('span', 'pie__red', 'Instagram'));
      var a = el('a', 'pie__enlace pie__enlace--usuario', i.texto);
      a.href = i.url; a.rel = 'noopener noreferrer'; a.target = '_blank';
      a.setAttribute('aria-label', 'Instagram ' + i.texto + ', se abre en otra pestaña');
      ig.appendChild(a);
    } else {
      ig.appendChild(el('span', null, i.texto));
      if (i.nota) ig.appendChild(el('span', 'pie__pendiente', i.nota));
    }
  }
})();

