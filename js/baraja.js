/*
 * baraja.js — carta de Bar Tirúa como baraja interactiva (DEMOSTRACIÓN), integrada al sitio.
 * Sin dependencias. Lee los datos de window.DATOS_BARAJA (js/baraja-datos.js) y, para los nombres de las
 * categorías y el logo del reverso, de window.TIRUA_CONTENIDO (js/contenido.js).
 * Todas las clases CSS llevan el prefijo «br-» (css/baraja.css) para no chocar con css/styles.css.
 * Eventos: «tirua:categoria» {id, nombre} y «tirua:producto» {id}. API: window.TIRUA.baraja.irACategoria(id).
 *
 * Mecánica:
 *  - Cada carta es un <div class="br-card"> absoluto en el centro de la escena. Una función
 *    de posición (explorePose) calcula su transform a partir de la distancia fraccionaria
 *    `d = índice − pos`, donde `pos` es un resorte. Arrastre, flechas y clics solo mueven
 *    el objetivo del resorte: de ahí la inercia natural y que "el último gana".
 *  - La apertura es una línea de tiempo `S.p` (0 = mazo cerrado, 1 = abierto) que mezcla
 *    tres poses: mazo → abanico → exploración, con volteo 3D por carta.
 *  - Solo se escriben transform / opacity / variables CSS en cada fotograma. Las medidas
 *    se leen únicamente al cambiar el tamaño (ResizeObserver).
 *  - Modo inmersivo (.br-inm): mientras el mazo no está cerrado, la sección ocupa toda la pantalla; la rueda/trackpad
 *    (horizontal o vertical) cambia de carta. Fuera de ese modo el scroll es siempre de la página.
 */
(function () {
  'use strict';

  var D = window.DATOS_BARAJA;
  if (!D) { return; }
  /* Tema claro (predeterminado): los palos usan su acento para papel blanco */
  var CLARO = document.documentElement.getAttribute('data-tema') !== 'oscuro';
  if (CLARO) {
    D.categorias.forEach(function (c) { if (c.acentoClaro) { c.acento = c.acentoClaro; } });
    if (D.joker && D.joker.acentoClaro) { D.joker.acento = D.joker.acentoClaro; }
  }
  var CONT = window.TIRUA_CONTENIDO || {};
  var LOGO = (CONT.marca && CONT.marca.principal) || 'assets/brand/logo-blanco-recorte.png';
  var LOGO_DIM = ((CONT.marca && CONT.marca.proporcionPrincipal) || '792 / 800').split('/').map(function (x) { return parseInt(x, 10) || 800; });
  window.TIRUA = window.TIRUA || {};

  function $(s, r) { return (r || document).querySelector(s); }

  var VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var NOMBRE_PALO = { corazones: 'Corazones', diamantes: 'Diamantes', picas: 'Picas', treboles: 'Tréboles' };
  var T_ABRIR = 1450;      // ms, apertura completa (≲1,6 s)
  var T_CERRAR = 550;      // ms
  var T_SALTAR = 220;      // ms, al saltar la animación

  function clp(n) { return '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- Referencias al DOM ---------- */
  var elCarta = $('#carta'), elBaraja = $('#baraja'), elPile = $('#pile'), elSonda = $('.br-sonda', elBaraja);
  var elEscena = $('#escena'), elVacio = $('#vacio'), elVacioTitulo = $('#vacio-titulo');
  var elBuscar = $('#buscar'), elLimpiar = $('#limpiar'), elEstadoBusq = $('#estado-busqueda');
  var elChips = $('#chips');
  var elBloque = $('#bloque'), elPanel = $('#panel'), elPanelMedida = $('#panel-medida');
  var btnPrev = $('#prev'), btnNext = $('#next'), elContador = $('#contador');
  var btnAbrir = $('#abrir'), btnSaltar = $('#saltar'), btnCerrar = $('#cerrar'), btnBarajar = $('#barajar');
  var btnJoker = $('#joker-btn'), btnLista = $('#abrir-lista');
  var elAnuncio = $('#anuncio');
  var elPanelCerrada = $('#panel-cerrada'), elPanelProd = $('#panel-producto'), elAvisoCat = $('#aviso-cat');
  var pDesc = $('#p-desc'), pJoker = $('#p-joker'), pVincular = $('#p-vincular');
  var rotuloBtn = $('#rotulo-btn'), rotuloDet = $('#rotulo-detalle');
  var dlg = $('#hoja'), dlgLista = $('#hoja-lista'), dlgSub = $('#hoja-sub'), dlgCerrar = $('#hoja-cerrar');
  var fondoBrillo = $('.br-carta__brillo'), fondoAnillos = $('.br-carta__anillos');

  elCarta.style.setProperty('--br-joker', (D.joker && D.joker.acento) || '#6b46c9');

  /* ---------- Único rótulo de demostración: sello + detalle desplegable (textos en datos.js) ---------- */
  (function () {
    var R = D.rotulo || {};
    $('.br-rotulo__sello').textContent = R.sello || 'Demostración';
    $('.br-rotulo__mas').textContent = R.boton || 'Qué significa';
    rotuloDet.innerHTML = '<ul>' + (R.detalle || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
    function abrir(v) {
      rotuloDet.hidden = !v;
      rotuloBtn.setAttribute('aria-expanded', String(v));
    }
    rotuloBtn.addEventListener('click', function () { abrir(rotuloDet.hidden); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !rotuloDet.hidden) { e.preventDefault(); abrir(false); rotuloBtn.focus(); } });   // preventDefault: el Esc de la carta inmersiva ve que ya se usó y no la cierra
    document.addEventListener('click', function (e) { if (!rotuloDet.hidden && !e.target.closest('#rotulo')) { abrir(false); } });
  })();

  /* ---------- Preferencias de movimiento ---------- */
  var mqReducir = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = mqReducir.matches;

  /* ---------- Modelo ---------- */
  var catById = {};
  var nombresContenido = {};
  ((CONT.categorias && CONT.categorias.items) || []).forEach(function (c) { nombresContenido[c.id] = c.nombre; });
  D.categorias.forEach(function (c) { c.nombre = nombresContenido[c.id] || c.nombre || c.id; catById[c.id] = c; });
  var activas = D.categorias.filter(function (c) { return c.activa; });

  var conteo = {};
  var productos = D.productos.filter(function (p) { return catById[p.categoria] && catById[p.categoria].activa; }).map(function (p) {
    var idx = conteo[p.categoria] || 0;
    conteo[p.categoria] = idx + 1;
    var cat = catById[p.categoria];
    return {
      id: p.id, cat: cat, palo: cat.palo, acento: cat.acento,
      valor: VALORES[Math.min(idx, VALORES.length - 1)], esAs: idx === 0, destacado: !!p.destacado,
      nombre: p.nombre, justo: p.justo || '', descripcion: p.descripcion, precio: p.precio, imagen: p.imagen || null,
      etiquetas: p.etiquetas || [],
      arte: (window.TIRUA_BARAJA_ARTE || {})[p.id] || {},
      /* Texto de búsqueda: nombre + descripción + etiquetas (sin tildes ni mayúsculas) */
      pajar: norm([p.nombre, p.descripcion].concat(p.etiquetas || []).join(' '))
    };
  });
  var jokerModelo = { id: 'joker', joker: true, nombre: 'Joker', valor: 'JK', palo: 'joker', acento: (D.joker && D.joker.acento) || '#6b46c9', etiquetas: [] };

  /* ---------- Aviso visible de categoría «Próximamente» (sus chips siguen deshabilitados) ---------- */
  function mostrarAvisoPronto(c) {
    var otra = activas[0];
    elAvisoCat.style.setProperty('--br-aviso', c.acento);
    elAvisoCat.innerHTML = paloSvg(c.palo, '') + '<span>' + esc(c.nombre) + ': próximamente. Todavía no tiene productos' + (otra ? '; mira ' + esc(otra.nombre) + '.' : '.') + '</span>';
    elAvisoCat.hidden = false;
  }
  /* No se oculta solo: al desaparecer, todo lo de abajo subiría sin que nadie haya hecho nada. Se va al buscar/filtrar, elegir categoría o usar el joker. */
  function ocultarAvisoPronto() { elAvisoCat.hidden = true; elAvisoCat.innerHTML = ''; }
  /* Mismo aviso, visible en la página (fuera de la bandeja) para quien llega desde un bloque de categoría */
  var elAvisoPortal = document.getElementById('aviso-portal');
  function mostrarAvisoPortal(c) {
    if (!elAvisoPortal) { return; }
    var otra = activas[0];
    elAvisoPortal.style.setProperty('--br-aviso', c.acento);
    elAvisoPortal.innerHTML = paloSvg(c.palo, '') + '<span>' + esc(c.nombre) + ': próximamente. Todavía no tiene productos' + (otra ? '; hoy la carta tiene ' + esc(otra.nombre) + '.' : '.') + '</span>';
    elAvisoPortal.hidden = false; elAvisoPortal.classList.remove('br-is-aviso'); void elAvisoPortal.offsetWidth; elAvisoPortal.classList.add('br-is-aviso');
  }
  function ocultarAvisoPortal() { if (elAvisoPortal) { elAvisoPortal.hidden = true; elAvisoPortal.innerHTML = ''; } }

  /* ---------- Resortes ---------- */
  function Spring(x, k, c) { this.x = x; this.t = x; this.v = 0; this.k = k; this.c = c; }
  Spring.prototype.set = function (t, instant) { this.t = t; if (instant || reduced) { this.x = t; this.v = 0; } };
  Spring.prototype.step = function (dt) {
    var n = Math.ceil(dt / (1 / 120)), h = dt / n;
    for (var i = 0; i < n; i++) {
      this.v += (-this.k * (this.x - this.t) - this.c * this.v) * h;
      this.x += this.v * h;
    }
    if (Math.abs(this.x - this.t) < 0.0008 && Math.abs(this.v) < 0.01) { this.x = this.t; this.v = 0; return false; }
    return true;
  };

  /* ---------- Estado ---------- */
  var S = {
    cat: activas.length === 1 ? activas[0].id : null,
    q: '',
    list: [],
    active: 0,
    phase: 'closed',           // closed | opening | open | closing
    p: 0,
    anim: null,
    joker: false,
    prevId: null,
    userClosed: false,
    autoDone: false,
    dragging: false
  };
  var pos = new Spring(0, 120, 19);
  var veil = new Spring(1, 320, 36);
  var par = { x: new Spring(0, 40, 12), y: new Spring(0, 40, 12) };
  var M = { W: 360, cw: 280, ch: 392, dx1: 80, step: 140, gap: 110 };

  /* ---------- Suits y piezas de SVG ---------- */
  function paloSvg(palo, cls) {
    return '<svg class="br-palo ' + (cls || '') + '" focusable="false" aria-hidden="true"><use href="#palo-' + palo + '"/></svg>';
  }

  function fotoHtml(p) {
    if (p.imagen && p.imagen.src) {
      /* La foto conserva su proporción; una máscara SVG separada oculta el fondo. La del As carga primero. */
      return '<img class="br-foto__img" src="' + esc(p.imagen.src) + '" alt="' + esc(p.imagen.alt || p.nombre) + '" width="' + (p.imagen.ancho || 800) + '" height="' + (p.imagen.alto || 600) + '"' +
        (p.imagen.posicion ? ' style="object-position:' + esc(p.imagen.posicion) + '"' : '') + ' loading="' + (p.esAs ? 'eager' : 'lazy') + '" decoding="async" draggable="false">';
    }
    return '<svg class="br-foto__anillos" viewBox="0 0 100 70" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke"><circle cx="50" cy="35" r="7"/><circle cx="50" cy="35" r="15"/><circle cx="50" cy="35" r="23"/><circle cx="50" cy="35" r="31"/><circle cx="50" cy="35" r="39"/><circle cx="50" cy="35" r="47"/></g></svg>';
  }

  function indiceHtml(p, cls) {
    return '<div class="br-idx ' + cls + '"><span class="br-idx__v">' + p.valor + '</span>' + paloSvg(p.palo, 'br-idx__palo') + '</div>';
  }

  /* Un único perímetro cerrado; los índices viven dentro de este marco. */
  function marcoHtml(id) {
    var uid = 'br-marco-' + id;
    return '<svg class="br-marco" viewBox="0 0 500 700" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + uid + '-oro" x1="0" y1="0" x2="0.35" y2="1"><stop stop-color="#8b622e"/><stop offset=".24" stop-color="#e1c68d"/><stop offset=".53" stop-color="#ac7d3c"/><stop offset=".78" stop-color="#d9bb78"/><stop offset="1" stop-color="#8c602d"/></linearGradient>' +
      '<g id="' + uid + '-hoja" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M25 68C27 47 38 36 65 25M28 57C20 48 25 34 37 36C48 39 39 50 34 45C29 39 39 31 45 34M35 38C31 28 41 21 47 28C51 33 45 40 41 38M42 35C47 23 61 21 63 27C65 33 50 37 44 37M39 43C49 39 57 44 55 49C52 55 43 48 39 45M34 49C42 48 46 57 40 59C35 60 33 54 34 49M29 59C26 64 31 69 34 65C36 62 32 58 29 59"/>' +
      '<path d="M28 66C35 54 46 44 63 28M30 51C35 45 41 40 50 35M31 60L35 55M49 30L57 28" stroke-width=".8"/>' +
      '<circle cx="25" cy="25" r="2" fill="currentColor" stroke="none"/></g></defs>' +
      '<g stroke="url(#' + uid + '-oro)" color="#c6a66c" stroke-width="1.35" fill="none">' +
      '<rect x="21" y="21" width="458" height="658" rx="11"/>' +
      '<rect x="27" y="27" width="446" height="646" rx="7" stroke-width=".65"/>' +
      '<rect x="24" y="24" width="452" height="652" rx="9" stroke-width=".7" stroke-dasharray=".6 3.3"/>' +
      '<use href="#' + uid + '-hoja"/><use href="#' + uid + '-hoja" transform="translate(500 0) scale(-1 1)"/>' +
      '<use href="#' + uid + '-hoja" transform="translate(0 700) scale(1 -1)"/><use href="#' + uid + '-hoja" transform="translate(500 700) scale(-1 -1)"/>' +
      '<path d="M229 24C237 24 240 18 250 18C260 18 263 24 271 24M239 24Q250 12 261 24M245 24L250 20L255 24" stroke-width=".9"/>' +
      '<path d="M229 676C237 676 240 682 250 682C260 682 263 676 271 676M239 676Q250 688 261 676" stroke-width=".9"/>' +
      '</g></svg>';
  }

  /* Franja compartida: solo el nombre en el frente; nombre y precio al girar (CSS). */
  function franjaHtml(p) {
    return '<div class="br-franja"><p class="br-nombre">' + esc(p.nombre) + '</p><p class="br-precio">' + clp(p.precio) + '</p></div>';
  }
  /* Reverso con la ficha del trago: categoría y descripción tal como aparecen en la carta de Justo (no se inventa nada).
     Con el mazo cerrado se ve el logo; con la baraja abierta, al voltear la carta, la ficha (ver css/baraja.css). */
  function dorsoInfoHtml(p) {
    return '<div class="br-dorso__info">' + paloSvg(p.palo, 'br-dorso__palo') +
      (p.justo ? '<p class="br-dorso__cat">' + esc(p.justo) + '</p>' : '') +
      '<p class="br-dorso__desc">' + esc(p.descripcion) + '</p></div>';
  }
  function dorsoHtml(p) {
    return '<div class="br-face br-face--back' + (p && !p.joker ? ' br-face--back-info' : '') + '" aria-hidden="true"><div class="br-dorso__trama"></div>' + marcoHtml(p.id + '-back') + '<img class="br-dorso__logo" src="' + LOGO + '" width="' + LOGO_DIM[0] + '" height="' + LOGO_DIM[1] + '" alt="" decoding="async" draggable="false">' + (p && !p.joker ? dorsoInfoHtml(p) + franjaHtml(p) : '') + '<i class="br-dim"></i></div>';
  }

  function jokerFrenteHtml() {
    return '<div class="br-face br-face--front br-face--joker">' + marcoHtml('joker-front') +
      indiceHtml(jokerModelo, 'br-idx--tl') +
      '<div class="br-joker__arte"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke"><circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="40"/><circle cx="50" cy="50" r="27"/></g><use href="#palo-joker" class="br-joker__estrella" x="22" y="22" width="56" height="56"/></svg></div>' +
      '<p class="br-joker__titulo">JOKER</p>' +
      indiceHtml(jokerModelo, 'br-idx--br') + '<i class="br-dim"></i></div>';
  }

  function productoFrenteHtml(p) {
    return '<div class="br-face br-face--front">' +
      '<div class="br-oleo" aria-hidden="true"></div>' +
      indiceHtml(p, 'br-idx--tl') +
      '<div class="br-foto">' + fotoHtml(p) + '</div>' +
      indiceHtml(p, 'br-idx--br') +
      franjaHtml(p) +
      marcoHtml(p.id + '-front') +
      '<i class="br-dim"></i></div>';
  }

  /* ---------- Cartas ---------- */
  function buildCard(p) {
    var div = document.createElement('div');
    div.className = 'br-card' + (p.joker ? ' br-card--joker' : '');
    div.setAttribute('role', 'group');
    div.setAttribute('aria-roledescription', 'carta');
    div.setAttribute('aria-hidden', 'true');
    div.style.setProperty('--br-c', p.acento);
    if (!p.joker && p.arte) {
      div.style.setProperty('--br-photo-mask', p.arte.mascara ? 'url("/' + p.arte.mascara + '?v=20261031b")' : 'none');
      div.style.setProperty('--br-photo-width', p.arte.ancho || '100cqw');
      div.style.setProperty('--br-photo-top', p.arte.arriba || '0cqw');
      div.style.setProperty('--br-photo-center', p.arte.centro || '50%');
      div.style.setProperty('--br-art-x', ((p.arte.escena || 0) % 4) * 100 / 3 + '%');
      div.style.setProperty('--br-art-y', Math.floor((p.arte.escena || 0) / 4) * 100 + '%');
    }
    div.dataset.id = p.id;
    div.hidden = true;
    div.innerHTML = '<div class="br-flip" aria-hidden="true">' + (p.joker ? jokerFrenteHtml() : productoFrenteHtml(p)) + dorsoHtml(p) + '</div>';
    elPile.appendChild(div);
    return { p: p, el: div, flipEl: div.firstChild, flip: new Spring(0, 150, 20) };
  }

  var cards = productos.map(buildCard);
  var jokerCard = buildCard(jokerModelo);
  var cardById = {};
  cards.concat([jokerCard]).forEach(function (c) { cardById[c.p.id] = c; });

  /* ---------- Poses ---------- */
  function jitter(i) { return Math.sin(i * 12.9898) * 1.6; }

  function deckPose(i) {
    return { x: -i * 0.5, y: -i * 1.5 + 6, z: 0, rz: jitter(i), ry: 0, s: 0.9, dim: 0, zi: 300 - i };
  }

  function fanPose(i, n) {
    var th = (i - (n - 1) / 2) * Math.min(9, 64 / Math.max(n, 1));
    var R = M.ch * 1.25, rad = th * Math.PI / 180;
    var span = Math.min(M.W * 0.5, M.cw * 1.7);
    var x = clamp(R * Math.sin(rad), -span, span);
    return { x: x, y: R * (1 - Math.cos(rad)) - M.ch * 0.04, z: 0, rz: th, ry: 0, s: 0.93, dim: 0, zi: 150 + i };
  }

  function explorePose(d) {
    var a = Math.abs(d), sg = d < 0 ? -1 : (d > 0 ? 1 : 0);
    var t1 = Math.min(a, 1), t2 = Math.max(a - 1, 0);
    return {
      x: sg * (M.dx1 * t1 + M.gap * t2),
      y: t1 * M.cw * 0.03 + t2 * M.cw * 0.02,
      z: -(t1 * 70 + t2 * 60),
      rz: sg * (t1 * 3 + Math.min(t2, 3) * 1.4),
      ry: sg * (t1 * 24 + Math.min(t2, 1) * 6),
      s: Math.max(0.5, 1 - 0.16 * t1 - 0.12 * Math.min(t2, 1) - 0.06 * Math.max(t2 - 1, 0)),
      dim: Math.min(0.78, t1 * 0.3 + t2 * 0.22),
      zi: 100 - Math.round(a * 20)
    };
  }

  function mix(a, b, t) {
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), rz: lerp(a.rz, b.rz, t), ry: lerp(a.ry, b.ry, t), s: lerp(a.s, b.s, t), dim: lerp(a.dim, b.dim, t), zi: 0 };
  }

  /* ---------- Render (solo escrituras: transform, opacity y variables CSS) ---------- */
  function render() {
    var n = S.list.length, p = S.p, i, c, d, pose, a, b, u, s, back, zi;
    for (i = 0; i < n; i++) {
      c = S.list[i];
      d = i - pos.x;
      s = n > 1 ? i / (n - 1) : 0;
      if (p >= 1) {
        pose = explorePose(d);
        b = 1;
      } else {
        a = easeOut(clamp((p / 0.5 - s * 0.5) / 0.5, 0, 1));
        u = clamp((p - 0.3) / 0.7, 0, 1);
        b = easeInOut(clamp((u - s * 0.35) / 0.65, 0, 1));
        pose = mix(mix(deckPose(i), fanPose(i, n), a), explorePose(d), b);
        zi = b > 0.5 ? explorePose(d).zi : (a > 0.15 ? 150 + i : 300 - i);
        pose.zi = zi;
        pose.z += Math.sin(Math.PI * b) * 90;
        pose.s += Math.sin(Math.PI * b) * 0.05;
      }
      back = Math.max(1 - b, clamp(c.flip.x, 0, 1));
      c.el.style.transform = 'translate3d(' + r2(pose.x) + 'px,' + r2(pose.y) + 'px,' + r2(pose.z) + 'px) rotate(' + r2(pose.rz) + 'deg) rotateY(' + r2(pose.ry) + 'deg) scale(' + r2(pose.s * 1000) / 1000 + ')';
      c.el.style.zIndex = pose.zi;
      c.el.style.setProperty('--br-dim', r2(pose.dim * b));
      /* Nombre y precio solo completos en la carta activa: en las vecinas se atenúan (un precio cortado se leería como otro) */
      c.el.style.setProperty('--br-txt', r2(1 - b * (1 - clamp(1 - (Math.abs(d) - 0.15) / 0.45, 0, 1))));
      /* Solo M.maxVis vecinas por lado: las demás se desvanecen y quedan sin visibilidad ni puntero */
      var vis = clamp(M.maxVis + 1 - Math.abs(d), 0, 1);
      var op = clamp(veil.x, 0, 1) * (1 - b + b * vis);
      c.el.style.opacity = op < 0.995 ? r2(op * 100) / 100 : '';
      c.el.style.visibility = op < 0.02 ? 'hidden' : '';
      c.flipEl.style.transform = back > 0 ? 'rotateY(' + r2(back * 180) + 'deg)' : '';
    }
    /* Parallax suave del fondo */
    var px = -(pos.x - (n - 1) / 2) * 14 + par.x.x * 18, py = par.y.x * 10;
    fondoBrillo.style.transform = 'translate3d(' + r2(px) + 'px,' + r2(py) + 'px,0)';
    fondoAnillos.style.transform = 'translate3d(' + r2(-px * 0.5) + 'px,' + r2(-py * 0.5) + 'px,0)';
  }

  /* ---------- Bucle de animación (solo corre mientras algo se mueve) ---------- */
  var raf = 0, last = 0;
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  function frame(now) {
    raf = 0;
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    var busy = false, i;
    if (S.anim) {
      var k = (now - S.anim.t0) / S.anim.dur;
      if (k >= 1) {
        S.p = S.anim.to;
        var cb = S.anim.done;
        S.anim = null;
        if (cb) { cb(); }
      } else {
        S.p = S.anim.from + (S.anim.to - S.anim.from) * k;
      }
      if (S.anim) { busy = true; }
    }
    if (!S.dragging && pos.step(dt)) { busy = true; }
    if (veil.step(dt)) { busy = true; }
    if (par.x.step(dt)) { busy = true; }
    if (par.y.step(dt)) { busy = true; }
    for (i = 0; i < S.list.length; i++) { if (S.list[i].flip.step(dt)) { busy = true; } }
    render();
    if (busy) { raf = requestAnimationFrame(frame); }
  }

  /* ---------- Medidas (solo al redimensionar) ---------- */
  function measure() {
    var W = elBaraja.clientWidth, cw = elSonda.offsetWidth || 280, s1 = 0.84;
    M.W = W; M.cw = cw; M.ch = cw * 1.4;
    M.maxVis = W >= 700 ? 2 : 1;
    if (M.maxVis === 2) {
      /* Escritorio/tableta: la segunda vecina termina dentro del contenedor (simétrico respecto del centro) */
      M.dx1 = Math.min(cw * 0.8, W / 2 - 10 - s1 * cw / 2);
      M.gap = clamp(W / 2 - 10 - M.dx1 - 0.72 * cw / 2 * 0.9, cw * 0.1, cw * 0.42);
    } else {
      /* Móvil: una vecina por lado asoma por el borde (peek) */
      M.dx1 = Math.max(cw * 0.16, Math.min(cw * 0.8, W / 2 * 1.06 - s1 * cw / 2));
      M.gap = Math.min(cw * 0.4, Math.max(M.dx1 * 0.5, 18));
    }
    M.step = Math.max(M.dx1, cw * 0.7);
    reservarDescripcion();
    render();
  }
  /* Reserva el alto del texto más largo bajo la carta: los controles no se mueven al cambiar de carta
     (si el alto cambiara, el navegador podría mover la página y el botón se iría de debajo del dedo). */
  function reservarDescripcion() {
    var textos = productos.map(function (p) { return p.descripcion; }), max = 0, i, h;
    for (i = 0; i < textos.length; i++) { elPanelMedida.textContent = textos[i]; h = elPanelMedida.offsetHeight; if (h > max) { max = h; } }
    if (S.joker && D.joker) {
      elPanelMedida.textContent = D.joker.texto; h = elPanelMedida.offsetHeight + (elPanelMedida.offsetWidth < 400 ? 64 : 48) + 10;
      if (h > max) { max = h; }
    }
    elPanelMedida.textContent = '';
    elBloque.style.setProperty('--br-panel-min', Math.max(max, 56) + 'px');
  }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { measure(); }); }
  if ('ResizeObserver' in window) { new ResizeObserver(measure).observe(elBaraja); }
  window.addEventListener('resize', measure);

  /* ---------- Lista visible ---------- */
  function computeList() {
    var q = norm(S.q), res = productos.filter(function (p) {
      if (S.cat && p.cat.id !== S.cat) { return false; }
      return !q || p.pajar.indexOf(q) !== -1;
    }).map(function (p) { return cardById[p.id]; });
    if (S.joker) { res.push(jokerCard); }
    return res;
  }

  function totalProductos() { return S.list.filter(function (c) { return !c.p.joker; }).length; }

  function cardLabel(c, i) {
    if (c.p.joker) { return 'Carta Joker, vista previa de demostración: idea pendiente, sin precio'; }
    return 'Carta ' + (i + 1) + ' de ' + totalProductos() + ': ' + c.p.nombre + ', ' + clp(c.p.precio);
  }

  function setList(list, keepId) {
    S.list = list;
    var idx = 0, i;
    if (keepId) { for (i = 0; i < list.length; i++) { if (list[i].p.id === keepId) { idx = i; } } }
    S.active = list.length ? idx : 0;
    pos.x = pos.t = S.active; pos.v = 0;
    cards.concat([jokerCard]).forEach(function (c) {
      var visible = list.indexOf(c) !== -1;
      c.el.hidden = !visible;
      if (!visible) { c.el.classList.remove('br-is-active'); c.el.setAttribute('aria-hidden', 'true'); }
    });
    refreshCards();
    refreshAll();
    kick();
  }

  function refreshCards() {
    S.list.forEach(function (c, i) {
      c.el.setAttribute('aria-label', cardLabel(c, i));
      var act = i === S.active && S.phase !== 'closed';
      c.el.classList.toggle('br-is-active', act);
      if (act) { c.el.removeAttribute('aria-hidden'); } else { c.el.setAttribute('aria-hidden', 'true'); }
    });
  }

  /* ---------- Panel, contador, acento, estado de flechas ---------- */
  function current() { return S.list[S.active] ? S.list[S.active].p : null; }

  function refreshAll() {
    var n = S.list.length, vacio = n === 0, p = current(), abierto = S.phase !== 'closed' && S.phase !== 'closing';

    elVacio.hidden = !vacio;
    elBaraja.hidden = vacio;
    elBloque.classList.toggle('br-is-vacio', vacio);
    if (vacio) {
      var q = S.q.trim();
      elVacioTitulo.textContent = q ? 'No hay resultados para “' + q + '”' : 'No hay productos para mostrar';
    }

    var total = totalProductos();
    elBaraja.setAttribute('aria-label', S.phase === 'closed' ? 'Baraja de la carta, cerrada, ' + total + (total === 1 ? ' carta' : ' cartas') : 'Baraja de la carta');

    /* Contador y flechas */
    /* Contador: el texto «3 de 8» queda para lectores (y pruebas); a la vista, una fila de palos que se van llenando */
    var texto = (p && p.joker) ? 'Joker' : (S.active + 1) + ' de ' + total, pts = '', k;
    if (!(p && p.joker) && total > 1 && total <= 13) {
      for (k = 0; k < total; k++) { pts += '<i class="br-punto' + (k === S.active ? ' br-punto--ahora' : (k < S.active ? ' br-punto--visto' : '')) + '"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><use href="#palo-' + (p ? p.palo : 'corazones') + '"/></svg></i>'; }
    }
    elContador.innerHTML = '<span class="br-contador__txt">' + texto + '</span>' + (pts ? '<span class="br-puntos" aria-hidden="true">' + pts + '</span>' : '');
    var atStart = S.active <= 0, atEnd = S.active >= n - 1;
    btnPrev.setAttribute('aria-disabled', String(atStart || !abierto || vacio));
    btnNext.setAttribute('aria-disabled', String(atEnd || !abierto || vacio));

    /* Descripción bajo la carta (el nombre y el precio van dentro de la propia carta) */
    var mostrarProd = !vacio && S.phase === 'open' && p;
    elPanelProd.hidden = !mostrarProd;
    elPanelCerrada.hidden = !!mostrarProd || vacio;
    if (mostrarProd) {
      if (p.joker) {
        pDesc.hidden = true;
        pJoker.hidden = false; pJoker.textContent = D.joker.texto;
        pVincular.hidden = false; pVincular.textContent = D.joker.botonVincular;
      } else {
        pDesc.hidden = false; pDesc.textContent = p.descripcion;
        pJoker.hidden = true; pVincular.hidden = true;
      }
    }

    emitirEstado();
    /* Acento ambiental de la sección: sigue a la carta activa */
    elCarta.style.setProperty('--br-acc', p ? p.acento : (catById[S.cat] ? catById[S.cat].acento : activas[0].acento));
    refreshChips();
  }

  /* Eventos hacia el resto del sitio: categoría (id null = Todo) y producto activo */
  var ultimaCat = '__ninguna__', ultimoProd = '__ninguno__';
  function emitirEstado() {
    var cat = S.cat ? catById[S.cat] : null, p = current();
    window.TIRUA.categoriaActual = cat ? { id: cat.id, nombre: cat.nombre } : null;
    window.TIRUA.productoActual = p && !p.joker ? { id: p.id, nombre: p.nombre, categoria: p.cat.id, precio: p.precio } : null;
    var idc = cat ? cat.id : null;
    if (ultimaCat !== '__ninguna__' && idc !== ultimaCat) { document.dispatchEvent(new CustomEvent('tirua:categoria', { detail: window.TIRUA.categoriaActual || { id: null, nombre: null } })); }
    ultimaCat = idc;
    var idp = p ? p.id : null;
    if (ultimoProd !== '__ninguno__' && idp !== ultimoProd) { document.dispatchEvent(new CustomEvent('tirua:producto', { detail: { id: idp } })); }
    ultimoProd = idp;
  }

  /* ---------- Navegación ---------- */
  var anuncioTimer = 0;
  function anunciar() {
    clearTimeout(anuncioTimer);
    anuncioTimer = setTimeout(function () {
      var c = S.list[S.active];
      if (c && S.phase === 'open') { elAnuncio.textContent = cardLabel(c, S.active); }
    }, 220);
  }

  function unflipAll(except) {
    cards.concat([jokerCard]).forEach(function (c) { if (c !== except && c.flip.t !== 0) { c.flip.set(0); } });
    marcarVolteada();
  }
  /* Con la carta activa dada vuelta su reverso ya muestra la ficha: la descripción de abajo se atenúa (sigue en el DOM para lectores de pantalla) */
  function marcarVolteada() {
    var c = S.list && S.list[S.active];
    var v = !!(c && c.flip.t === 1);
    elCarta.classList.toggle('br-volteada', v);
    if (v) { elCarta.classList.add('br-ya-volteo'); try { sessionStorage.setItem('br-volteo', '1'); } catch (e) { /* sin almacenamiento */ } }
  }
  /* Primera apertura de la sesión: un «asomo» (la carta se inclina un instante) y una pista, hasta que se voltea una carta */
  var yaVolteo = false; try { yaVolteo = sessionStorage.getItem('br-volteo') === '1'; } catch (e) { /* sin almacenamiento */ }
  if (yaVolteo) { elCarta.classList.add('br-ya-volteo'); }
  var asomoHecho = yaVolteo;
  function asomo() {
    if (asomoHecho || reduced) { return; }
    asomoHecho = true;
    setTimeout(function () { if (S.phase === 'open' && inm && inm.on) { elCarta.classList.add('br-peek'); setTimeout(function () { elCarta.classList.remove('br-peek'); }, 1400); } }, 700);
  }

  function goTo(i, opts) {
    if (!S.list.length) { return; }
    i = clamp(Math.round(i), 0, S.list.length - 1);
    var changed = i !== S.active;
    S.active = i;
    pos.set(i, opts && opts.instant);
    if (changed) { unflipAll(S.list[i]); }
    refreshCards();
    refreshAll();
    anunciar();
    kick();
  }

  function go(delta) { if (S.phase === 'open') { goTo(S.active + delta); } }

  function flipActive() {
    var c = S.list[S.active];
    if (!c || S.phase !== 'open') { return; }
    c.flip.set(c.flip.t ? 0 : 1);
    marcarVolteada();
    kick();
  }

  /* ---------- Apertura / cierre del mazo ---------- */
  function setPhase(ph) {
    S.phase = ph;
    elCarta.classList.toggle('br-is-closed', ph === 'closed');
    elCarta.classList.toggle('br-is-opening', ph === 'opening' || ph === 'closing');
    elCarta.classList.toggle('br-is-open', ph === 'open');
    btnAbrir.hidden = ph !== 'closed' || S.list.length === 0;
    btnSaltar.hidden = !(ph === 'opening' || ph === 'closing');
    btnCerrar.hidden = ph !== 'open';
    btnBarajar.hidden = ph !== 'open' || reduced;
    refreshCards();
    refreshAll();
    /* Entrar es inmediato; salir espera un instante por si el mazo se reabre enseguida (barajar de nuevo) y así no parpadea ni toca el historial */
    if (ph !== 'closed') { inmersivo(true); } else { setTimeout(function () { if (S.phase === 'closed') { inmersivo(false); } }, 0); }
  }

  function startAnim(to, dur, done) {
    S.anim = { from: S.p, to: to, dur: Math.max(dur, 1), t0: performance.now(), done: done };
    kick();
  }

  function openDeck(opts) {
    opts = opts || {};
    if (S.phase === 'open' || S.phase === 'opening' || !S.list.length) { return; }
    S.userClosed = false;
    unflipAll();
    if (reduced || opts.instant) {
      S.anim = null; S.p = 1; setPhase('open'); render();
    } else {
      setPhase('opening');
      startAnim(1, T_ABRIR * (1 - S.p), function () { setPhase('open'); anunciar(); asomo(); });
      S.anim.dur = Math.max(T_ABRIR * (1 - S.p), 200);
    }
    if (opts.focus) { elBaraja.focus({ preventScroll: true }); }
  }

  function closeDeck(opts) {
    opts = opts || {};
    if (S.phase === 'closed' || S.phase === 'closing') { return; }
    unflipAll();
    if (opts.user) { S.userClosed = true; }
    var fin = function () { setPhase('closed'); if (opts.then) { opts.then(); } else if (opts.focusAbrir) { btnAbrir.focus({ preventScroll: true }); } };
    if (reduced || opts.instant) { S.anim = null; S.p = 0; fin(); render(); return; }
    setPhase('closing');
    startAnim(0, T_CERRAR * S.p + 60, fin);
  }

  function skipAnim() {
    if (!S.anim) { return; }
    var to = S.anim.to, done = S.anim.done;
    if (reduced) { S.p = to; S.anim = null; if (done) { done(); } render(); return; }
    S.anim = { from: S.p, to: to, dur: T_SALTAR, t0: performance.now(), done: done };
    kick();
  }

  function shuffleAgain() {
    if (S.phase !== 'open' || reduced) { return; }
    closeDeck({ then: function () { openDeck(); } });
    elBaraja.focus({ preventScroll: true });
  }

  /* ---------- Búsqueda y categorías ---------- */
  var swapTimer = 0, swapFn = null;
  function swapLayout(fn) {
    if (S.phase !== 'open' || reduced) { fn(); return; }
    swapFn = fn;
    veil.t = 0; kick();
    clearTimeout(swapTimer);
    swapTimer = setTimeout(function () { var f = swapFn; swapFn = null; f(); veil.t = 1; kick(); }, 150);
  }

  function resetJoker() {
    if (!S.joker) { return; }
    S.joker = false;
    reservarDescripcion();
    btnJoker.setAttribute('aria-pressed', 'false');
    btnJoker.querySelector('span').textContent = 'Vista previa del joker (demostración)';
  }

  function aplicarFiltros() {
    ocultarAvisoPronto();
    var keep = current() && !current().joker ? current().id : null;
    elLimpiar.hidden = !S.q;
    resetJoker();
    swapLayout(function () {
      setList(computeList(), keep);
      var n = S.list.length, q = S.q.trim();
      if (q) { elEstadoBusq.textContent = n === 0 ? 'Sin resultados para “' + q + '”.' : n + (n === 1 ? ' resultado' : ' resultados') + ' para “' + q + '”.'; }
      else { elEstadoBusq.textContent = ''; }
      if (n && S.phase === 'closed' && !S.userClosed) { openDeck(); }
    });
  }

  var buscarTimer = 0;
  elBuscar.addEventListener('input', function () {
    S.q = elBuscar.value;
    elLimpiar.hidden = !S.q;
    clearTimeout(buscarTimer);
    buscarTimer = setTimeout(aplicarFiltros, 140);
  });
  $('#form-busqueda').addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(buscarTimer); aplicarFiltros(); });
  elLimpiar.addEventListener('click', function () {
    elBuscar.value = ''; S.q = ''; clearTimeout(buscarTimer); aplicarFiltros(); elBuscar.focus();
  });
  $('#restablecer').addEventListener('click', function () {
    elBuscar.value = ''; S.q = ''; S.cat = activas.length === 1 ? activas[0].id : null;
    clearTimeout(buscarTimer); aplicarFiltros(); elBuscar.focus();
  });

  /* Chips: un chip por palo/categoría. «Todo» solo aparece si hay más de una activa. */
  function buildChips() {
    var html = '';
    if (activas.length > 1) {
      html += '<button type="button" class="br-chip br-chip--todo" data-id="" style="--br-chip:#f4f4f2"><span class="br-chip__cuerpo"><span class="br-chip__nombre">Todo</span></span></button>';
    }
    D.categorias.forEach(function (c) {
      var n = productos.filter(function (p) { return p.cat.id === c.id; }).length;
      html += '<button type="button" class="br-chip' + (c.activa ? '' : ' br-is-pronto') + '" data-id="' + c.id + '" style="--br-chip:' + c.acento + '"' +
        (c.activa ? '' : ' aria-disabled="true" aria-describedby="chips-nota"') + '>' +
        paloSvg(c.palo, 'br-chip__palo') +
        '<span class="br-chip__cuerpo"><span class="br-chip__nombre">' + esc(c.nombre) + '</span>' +
        (c.activa ? '' : '<span class="br-chip__estado">Próximamente</span>') + '</span></button>';
    });
    elChips.innerHTML = html;
  }
  function refreshChips() {
    Array.prototype.forEach.call(elChips.children, function (b) {
      if (b.classList.contains('br-is-pronto')) { return; }
      var id = b.dataset.id, on = (id || null) === S.cat;
      b.setAttribute('aria-pressed', String(on));
    });
  }
  elChips.addEventListener('click', function (e) {
    var b = e.target.closest('.br-chip');
    if (!b) { return; }
    if (b.classList.contains('br-is-pronto')) {
      var c = catById[b.dataset.id];
      elAnuncio.textContent = c.nombre + ': próximamente. Se activa cuando el local entregue sus productos.';
      b.classList.remove('br-is-aviso'); void b.offsetWidth; b.classList.add('br-is-aviso');
      mostrarAvisoPronto(c);
      return;
    }
    S.cat = b.dataset.id || null;
    aplicarFiltros();
  });

  /* ---------- API para los bloques de categorías del sitio ---------- */
  function irACategoria(id) {
    var c = catById[id];
    if (!c) { return; }
    S.userClosed = false;
    if (!c.activa) {
      /* «Próximamente»: no se abre la carta a pantalla completa (sería abrirla sin explicación). El aviso se ve en la página, bajo el mazo. */
      mostrarAvisoPronto(c);
      mostrarAvisoPortal(c);
      elAnuncio.textContent = c.nombre + ': próximamente. Todavía no tiene productos.';
      var chip = elChips.querySelector('[data-id="' + id + '"]');
      if (chip) { chip.classList.remove('br-is-aviso'); void chip.offsetWidth; chip.classList.add('br-is-aviso'); }
      return S.phase !== 'closed';
    }
    ocultarAvisoPortal();
    S.cat = id;
    aplicarFiltros();
    if (S.phase === 'closed') { openDeck({ focus: true }); }
    if (S.phase !== 'closed' && !elCarta.contains(document.activeElement)) { elBaraja.focus({ preventScroll: true }); }   // aplicarFiltros puede haberla abierto sin foco
    return true;
  }
  window.TIRUA.baraja = { irACategoria: irACategoria };

  /* ---------- Joker (solo visual; sin aleatoriedad ni lógica real) ---------- */
  var jokerTimer = 0;
  btnJoker.addEventListener('click', function () {
    ocultarAvisoPronto();
    if (S.joker) {
      resetJoker();
      var keep = S.prevId;
      swapLayout(function () { setList(computeList(), keep); });
      return;
    }
    S.prevId = current() && !current().joker ? current().id : null;
    S.q = ''; elBuscar.value = ''; elLimpiar.hidden = true; elEstadoBusq.textContent = '';
    S.joker = true;
    reservarDescripcion();
    btnJoker.setAttribute('aria-pressed', 'true');
    btnJoker.querySelector('span').textContent = 'Ocultar vista previa del joker';
    jokerCard.flip.x = jokerCard.flip.t = 1;
    var mostrar = function () {
      setList(computeList(), 'joker');
      unflipAll(jokerCard);
      jokerCard.flip.x = jokerCard.flip.t = 1;
      if (S.phase === 'closed') { openDeck({ instant: true }); }
      render();
      clearTimeout(jokerTimer);
      jokerTimer = setTimeout(function () { jokerCard.flip.set(0); kick(); anunciarJoker(); }, reduced ? 0 : 650);
    };
    swapLayout(mostrar);
    elEscena.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  });
  function anunciarJoker() { elAnuncio.textContent = D.joker.texto; }

  /* ---------- Controles ---------- */
  btnPrev.addEventListener('click', function () { if (btnPrev.getAttribute('aria-disabled') !== 'true') { go(-1); } });
  btnNext.addEventListener('click', function () { if (btnNext.getAttribute('aria-disabled') !== 'true') { go(1); } });
  btnAbrir.addEventListener('click', function () { openDeck({ focus: true }); });
  btnSaltar.addEventListener('click', function () { skipAnim(); elBaraja.focus({ preventScroll: true }); });
  btnCerrar.addEventListener('click', function () { closeDeck({ user: true, focusAbrir: true }); });
  btnBarajar.addEventListener('click', shuffleAgain);

  elBaraja.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) { return; }
    var k = e.key;
    if (S.phase !== 'open') {
      if (k === 'Enter' || k === ' ') { e.preventDefault(); if (S.phase === 'closed') { openDeck({ focus: true }); } else { skipAnim(); } }
      return;
    }
    if (k === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (k === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (k === 'Home') { e.preventDefault(); goTo(0); }
    else if (k === 'End') { e.preventDefault(); goTo(S.list.length - 1); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); flipActive(); }
  });

  /* ---------- Puntero: arrastre, swipe y clic. touch-action: pan-y deja el scroll vertical al navegador ---------- */
  var drag = null;
  elBaraja.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) { return; }
    if (S.phase === 'opening' || S.phase === 'closing') { skipAnim(); return; }
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, pos0: pos.x, start: S.active, moved: false, pts: [{ x: e.clientX, t: e.timeStamp }], target: e.target };
  });

  elBaraja.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id || S.phase !== 'open') { return; }
    var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        drag.moved = true; S.dragging = true;
        try { elBaraja.setPointerCapture(e.pointerId); } catch (_) { /* sin captura */ }
        elBaraja.classList.add('br-is-arrastrando');
      } else { return; }
    }
    drag.pts.push({ x: e.clientX, t: e.timeStamp });
    if (drag.pts.length > 6) { drag.pts.shift(); }
    var raw = drag.pos0 - dx / M.step, max = S.list.length - 1;
    if (raw < 0) { raw *= 0.35; } else if (raw > max) { raw = max + (raw - max) * 0.35; }
    pos.x = raw; pos.t = raw; pos.v = 0;
    kick();
  });

  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) { return; }
    var d = drag; drag = null;
    if (!d.moved) {
      if (cancelled) { return; }
      if (S.phase === 'closed') { openDeck({ focus: true }); return; }
      if (S.phase !== 'open') { return; }
      var ce = d.target && d.target.closest ? d.target.closest('.br-card') : null;
      if (!ce) { return; }
      var idx = -1;
      S.list.forEach(function (c, i) { if (c.el === ce) { idx = i; } });
      if (idx < 0) { return; }
      if (idx === S.active) { flipActive(); } else { goTo(idx); }
      return;
    }
    S.dragging = false;
    elBaraja.classList.remove('br-is-arrastrando');
    try { elBaraja.releasePointerCapture(e.pointerId); } catch (_) { /* ya liberado */ }
    var a = d.pts[0], b = d.pts[d.pts.length - 1];
    var v = b.t > a.t ? (b.x - a.x) / (b.t - a.t) : 0;           // px/ms
    var dx = e.clientX - d.x0;
    /* Inercia: posición al soltar + un empujón proporcional a la velocidad. Un gesto lento mueve una carta; un golpe rápido, hasta tres. */
    if (Math.abs(dx) < 24) { v = 0; }                              // un roce no es un golpe
    v = clamp(v, -3, 3);
    var target = Math.round(pos.x - (v * 1000 * 0.06) / M.step);
    if (!cancelled && target === d.start && (Math.abs(dx) > 40 || (Math.abs(dx) >= 24 && Math.abs(v) > 0.35))) { target = d.start + (dx < 0 ? 1 : -1); }
    target = clamp(target, d.start - 3, d.start + 3);
    goTo(target);
  }
  elBaraja.addEventListener('pointerup', function (e) { endDrag(e, false); });
  elBaraja.addEventListener('pointercancel', function (e) { endDrag(e, true); });
  /* Solo cuando la baraja misma pierde la captura (el hijo que tenía la captura implícita táctil también la "pierde" al capturar nosotros). */
  elBaraja.addEventListener('lostpointercapture', function (e) { if (e.target === elBaraja && drag && drag.moved) { endDrag(e, true); } });
  elBaraja.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* Inclinación y brillo del naipe activo siguiendo el puntero (solo ratón, modo inmersivo, sin reduce-motion) */
  var inclinando = false, ultimoPtr = null;
  function inclinar(e) {
    ultimoPtr = e;
    if (inclinando) { return; }
    inclinando = true;
    requestAnimationFrame(function () {
      inclinando = false;
      var act = S.list[S.active], p = ultimoPtr;
      if (!act || !p || !inm.on || S.phase !== 'open') { return; }
      var r = act.el.getBoundingClientRect(), fx = (p.clientX - r.left) / r.width, fy = (p.clientY - r.top) / r.height;
      var dentro = fx >= -0.15 && fx <= 1.15 && fy >= -0.15 && fy <= 1.15;
      act.el.style.setProperty('--br-ry', dentro ? ((fx - 0.5) * 6).toFixed(2) + 'deg' : '0deg');
      act.el.style.setProperty('--br-rx', dentro ? ((0.5 - fy) * 3).toFixed(2) + 'deg' : '0deg');
      act.el.style.setProperty('--br-gx', (Math.max(0, Math.min(1, fx)) * 100).toFixed(1) + '%');
      act.el.style.setProperty('--br-gy', (Math.max(0, Math.min(1, fy)) * 100).toFixed(1) + '%');
      act.el.classList.toggle('br-brilla', dentro);
    });
  }

  /* Parallax con puntero (solo ratón y sin reduce-motion) */
  elCarta.addEventListener('pointermove', function (e) {
    if (reduced || e.pointerType !== 'mouse' || S.phase !== 'open') { return; }
    var r = elCarta.getBoundingClientRect();
    par.x.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    par.y.set(((e.clientY - r.top) / r.height - 0.5) * 2);
    inclinar(e);
    kick();
  }, { passive: true });

  /* ---------- Lista rápida (hoja accesible: <dialog> modal = foco atrapado, Esc, inert) ---------- */
  var listaOpener = null, listaElegida = false;
  function abrirLista() {
    var items = S.list.filter(function (c) { return !c.p.joker; });
    dlgSub.textContent = items.length + (items.length === 1 ? ' producto' : ' productos');
    if (!items.length) {
      dlgLista.innerHTML = '<li class="br-hoja__vacio">No hay productos visibles con los filtros actuales.</li>';
    } else {
      dlgLista.innerHTML = items.map(function (c) {
        var p = c.p;
        return '<li><button type="button" class="br-hoja__item" data-id="' + p.id + '" style="--br-c:' + p.acento + '">' +
          '<span class="br-hoja__valor">' + paloSvg(p.palo, 'br-hoja__palo') + '<span>' + p.valor + '</span></span>' +
          '<span class="br-hoja__nombre">' + esc(p.nombre) + '</span>' +
          '<span class="br-hoja__precio">' + clp(p.precio) + '</span></button></li>';
      }).join('');
    }
    listaOpener = document.activeElement; listaElegida = false;
    if (typeof dlg.showModal === 'function') { dlg.showModal(); } else { dlg.setAttribute('open', ''); }
    var first = dlgLista.querySelector('button') || dlgCerrar;
    first.focus();
  }
  btnLista.addEventListener('click', abrirLista);
  dlgCerrar.addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) { dlg.close(); } });
  /* Trampa de foco explícita: el <dialog> modal deja inertes la página, pero Tab podría salir a la interfaz del navegador. */
  dlg.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') { return; }
    var foco = dlg.querySelectorAll('button:not([disabled])');
    if (!foco.length) { return; }
    var primero = foco[0], ultimo = foco[foco.length - 1];
    if (e.shiftKey && (document.activeElement === primero || !dlg.contains(document.activeElement))) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && (document.activeElement === ultimo || !dlg.contains(document.activeElement))) { e.preventDefault(); primero.focus(); }
  });
  dlg.addEventListener('close', function () {
    var el = listaElegida ? elBaraja : listaOpener;
    if (el && el.focus) { el.focus({ preventScroll: true }); }
  });
  dlgLista.addEventListener('click', function (e) {
    var b = e.target.closest('.br-hoja__item');
    if (!b) { return; }
    var id = b.dataset.id, i = -1;
    S.list.forEach(function (c, k) { if (c.p.id === id) { i = k; } });
    listaElegida = true;
    dlg.close();
    if (i < 0) { return; }
    S.userClosed = false;
    if (S.phase === 'closed' || S.phase === 'closing') { S.active = i; pos.x = pos.t = i; openDeck({ focus: true }); }
    else if (S.phase === 'opening') { skipAnim(); }
    goTo(i);
    elEscena.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  });

  /* ---------- Reduce-motion en vivo ---------- */
  function onMotion() {
    reduced = mqReducir.matches;
    elCarta.classList.toggle('br-sin-movimiento', reduced);
    btnBarajar.hidden = S.phase !== 'open' || reduced;
    if (reduced) {
      if (S.anim) { skipAnim(); }
      pos.x = pos.t; pos.v = 0; veil.x = veil.t = 1;
      cards.concat([jokerCard]).forEach(function (c) { c.flip.x = c.flip.t; c.flip.v = 0; });
      render();
    }
  }
  if (mqReducir.addEventListener) { mqReducir.addEventListener('change', onMotion); }

  /* ---------- Arranque ---------- */
  buildChips();
  elCarta.classList.toggle('br-sin-movimiento', reduced);
  measure();
  setList(computeList(), null);
  if (!S.list.length) { setPhase('closed'); }
  else { setPhase('closed'); render(); }

  /* ---------- Modo inmersivo ----------
     El mazo cerrado es un portal dentro de la página; en cuanto empieza a abrirse la sección pasa a pantalla completa
     y, al terminar de cerrarse, vuelve a su sitio. Un espaciador conserva el alto de la sección para que la página no salte. */
  var inm = { on: false, espaciador: null, ultimoFoco: null, empujado: false, soltando: false };
  var btnInmCerrar = $('#inm-cerrar'), btnInmOpc = $('#inm-opciones'), elBandeja = $('#bandeja');
  var nombreCarta = ($('#carta-titulo') && $('#carta-titulo').textContent) || 'Carta';

  function aislarResto(on) {
    var resto = document.querySelectorAll('body > header, body > footer, body > .saltar, main > *:not(#carta), .cabecera');
    Array.prototype.forEach.call(resto, function (n) { if (n.contains(elCarta)) { return; } if (on) { n.setAttribute('inert', ''); } else { n.removeAttribute('inert'); } });
  }
  function bandeja(abierta) {
    elCarta.classList.toggle('br-bandeja-abierta', abierta);
    btnInmOpc.setAttribute('aria-expanded', abierta ? 'true' : 'false');
    if (abierta) { elBuscar.focus({ preventScroll: true }); }
  }
  function inmersivo(on) {
    if (!inm || on === inm.on) { return; }   // inm aún no existe durante la inicialización: el mazo arranca cerrado
    inm.on = on;
    if (on) {
      inm.ultimoFoco = document.activeElement;
      var h = elCarta.offsetHeight;
      inm.espaciador = document.createElement('div');
      inm.espaciador.setAttribute('aria-hidden', 'true');
      inm.espaciador.style.height = h + 'px';
      elCarta.parentNode.insertBefore(inm.espaciador, elCarta);
      elCarta.classList.add('br-inm');
      document.documentElement.classList.add('br-inm-abierto');
      elCarta.setAttribute('role', 'dialog'); elCarta.setAttribute('aria-modal', 'true');
      aislarResto(true);
      /* «Atrás» del navegador / del celular cierra la carta en vez de salir del sitio */
      try { history.pushState({ tiruaCarta: 1 }, ''); inm.empujado = true; } catch (e) { inm.empujado = false; }
    } else {
      bandeja(false);
      elCarta.classList.remove('br-inm');
      document.documentElement.classList.remove('br-inm-abierto');
      elCarta.removeAttribute('role'); elCarta.removeAttribute('aria-modal');
      aislarResto(false);
      if (inm.espaciador && inm.espaciador.parentNode) { inm.espaciador.parentNode.removeChild(inm.espaciador); }
      inm.espaciador = null;
      if (inm.empujado) { inm.empujado = false; inm.soltando = true; try { history.back(); } catch (e) { inm.soltando = false; } }
      measure();
    }
  }
  btnInmCerrar.addEventListener('click', function () {
    if (S.phase === 'open') { closeDeck({ user: true, focusAbrir: true }); }
    else if (S.phase === 'opening') { skipAnim(); closeDeck({ user: true, focusAbrir: true }); }
  });
  window.addEventListener('popstate', function () {
    if (inm.soltando) { inm.soltando = false; return; }          // el retroceso lo provocamos nosotros al cerrar
    if (inm.on) { inm.empujado = false; bandeja(false); if (S.phase !== 'open') { skipAnim(); } closeDeck({ user: true, focusAbrir: true }); }
  });
  btnInmOpc.addEventListener('click', function () { bandeja(!elCarta.classList.contains('br-bandeja-abierta')); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !inm.on || dlg.open || e.defaultPrevented) { return; }
    if (!rotuloDet.hidden) { return; }
    if (elCarta.classList.contains('br-bandeja-abierta')) { bandeja(false); btnInmOpc.focus({ preventScroll: true }); return; }
    btnInmCerrar.click();
  });

  /* Rueda y trackpad: horizontal o vertical cambian de carta (la página no se desplaza en modo inmersivo) */
  var rueda = { acum: 0, ultimo: 0, ultimoD: 0, espera: false };
  elCarta.addEventListener('wheel', function (e) {
    if (!inm.on || S.phase !== 'open' || elCarta.classList.contains('br-bandeja-abierta')) { return; }
    if (e.target.closest && e.target.closest('.br-bandeja, .br-hoja')) { return; }
    e.preventDefault();
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) { d *= 32; }
    var ahora = performance.now();
    /* Un gesto = una carta: la inercia del trackpad (eventos cada pocos ms y cada vez menores) no cuenta como gesto nuevo.
       Gesto nuevo = más de 160 ms de silencio o un empujón claramente mayor que el último evento. */
    var nuevo = (ahora - rueda.ultimo > 160) || (Math.abs(d) > Math.abs(rueda.ultimoD) * 1.6 + 6);
    rueda.ultimo = ahora; rueda.ultimoD = d;
    if (nuevo) { rueda.espera = false; rueda.acum = 0; }
    if (rueda.espera) { return; }
    rueda.acum += d;
    if (Math.abs(rueda.acum) >= 36) { go(rueda.acum > 0 ? 1 : -1); rueda.acum = 0; rueda.espera = true; }
  }, { passive: false });
})();

