// «Novedades» en el hero: burbujas al estilo historias de Instagram + visor a pantalla completa.
// Lee datos/instagram.json (lo escribe a mano el equipo o scripts/instagram-sync.mjs desde la API oficial de Instagram).
// Sin datos o sin red el bloque se oculta y el hero se ve como siempre (mientras carga reserva su alto para que nada salte). Sin scripts ni imágenes de terceros:
// las imágenes viven en assets/instagram/ y los enlaces salen a instagram.com solo al pulsarlos.
// Mientras datos/instagram.json no tenga publicaciones, se muestran los ejemplos de datos/instagram.demo.json (marcados «Ejemplo»,
// con su etiqueta en el visor). En cuanto el bar cargue publicaciones reales, estas los reemplazan solas.
// ?demo=instagram fuerza los ejemplos; ?demo=no los apaga (el hero queda sin «Novedades» si no hay datos reales).
(function () {
  'use strict';

  var raiz = document.querySelector('[data-historias]');
  var hero = document.querySelector('[data-hero]');
  if (!raiz || !hero) return;

  var forzarDemo = /[?&]demo=instagram\b/.test(location.search);
  var sinDemo = /[?&]demo=no\b/.test(location.search);
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  var DURACION = 6500;                      // ms por historia
  var LS = 'tirua-historias-vistas';
  var items = [], actual = -1, cuenta = 'bartirua';
  var visor = null, t0 = 0, restante = DURACION, pausado = false, raf = 0, mantenido = false, ultimoFoco = null;

  function el(tag, clase, texto, attrs) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k]); });
    return n;
  }
  function recortar(t, n) { t = String(t || '').trim(); return t.length > n ? t.slice(0, n - 1).trim() + '…' : t; }
  function vistas() { try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch (e) { return []; } }
  function marcarVista(id) { try { var v = vistas(); if (v.indexOf(id) < 0) { v.push(id); localStorage.setItem(LS, JSON.stringify(v.slice(-60))); } } catch (e) { /* sin almacenamiento */ } }
  function hace(iso) {
    var t = Date.parse(iso); if (!t) return '';
    var d = Math.floor((Date.now() - t) / 60000);
    if (d < 1) return 'ahora'; if (d < 60) return 'hace ' + d + ' min';
    var h = Math.floor(d / 60); if (h < 24) return 'hace ' + h + (h === 1 ? ' hora' : ' horas');
    var dd = Math.floor(h / 24); if (dd < 30) return 'hace ' + dd + (dd === 1 ? ' día' : ' días');
    var m = Math.floor(dd / 30); return 'hace ' + m + (m === 1 ? ' mes' : ' meses');
  }
  // Solo rutas locales para imágenes y solo instagram.com para enlaces (el JSON podría editarlo cualquiera del equipo)
  function imagenSegura(r) { return typeof r === 'string' && /^assets\/[\w\-./]+\.(webp|jpe?g|png|avif)$/i.test(r) ? r : null; }
  function enlaceSeguro(u) { return typeof u === 'string' && /^https:\/\/(www\.)?instagram\.com\//i.test(u) ? u : null; }

  function limpiar(d) {
    var lista = (d && Array.isArray(d.items) ? d.items : []).map(function (x, i) {
      if (!x || !x.titulo) return null;
      return { id: String(x.id || 'i' + i), titulo: recortar(x.titulo, 80), texto: recortar(x.texto, 240), evento: recortar(x.evento, 40), reservar: x.reservar === true, imagen: imagenSegura(x.imagen), url: enlaceSeguro(x.url), fecha: x.fecha || '', tipo: x.tipo || (x.imagen ? 'imagen' : 'texto'), demo: !!(x.demo || d.demo) };
    }).filter(Boolean).slice(0, 12);
    cuenta = (d && /^[\w.]{1,30}$/.test(d.cuenta || '')) ? d.cuenta : 'bartirua';
    return lista;
  }

  // ---------- Burbujas ----------
  function pintarBurbujas() {
    var ul = raiz.querySelector('.historias__lista'); ul.textContent = '';
    var vs = vistas();
    items.forEach(function (it, i) {
      var li = el('li', 'historias__item'); li.style.setProperty('--i', i);
      var b = el('button', 'historia' + (vs.indexOf(it.id) >= 0 ? ' historia--vista' : ''), null, { type: 'button', 'aria-haspopup': 'dialog', 'aria-label': (it.demo ? 'Ejemplo. ' : '') + it.titulo, 'data-i': i });
      var aro = el('span', 'historia__aro'), cara = el('span', 'historia__cara' + (it.imagen ? '' : ' historia__cara--texto'));
      if (it.imagen) { var img = el('img', null, null, { src: it.imagen, alt: '', loading: i < 5 ? 'eager' : 'lazy', decoding: 'async', draggable: 'false' }); cara.appendChild(img); }
      else { cara.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M50 90C22 68 5 50 5 31 5 17 15 8 28 8c9 0 18 5 22 14 4-9 13-14 22-14 13 0 23 9 23 23 0 19-17 37-45 59Z"/></svg>'; }
      aro.appendChild(cara); b.appendChild(aro); b.appendChild(el('span', 'historia__nombre', it.titulo.replace(/^Ejemplo:\s*/i, '')));
      b.addEventListener('click', function () { ultimoFoco = b; abrir(i); });
      li.appendChild(b); ul.appendChild(li);
    });
  }

  // ---------- Visor ----------
  function crearVisor() {
    var d = el('dialog', 'hv', null, { 'aria-label': 'Novedades del bar' });
    d.innerHTML =
      '<div class="hv__marco" role="group" aria-roledescription="historia">' +
        '<div class="hv__barras" aria-hidden="true"></div>' +
        '<div class="hv__cab"><span class="hv__avatar"><img alt="" width="36" height="36"></span><span class="hv__cuenta"></span><span class="hv__tiempo"></span><span class="hv__demo" hidden>Ejemplo</span><button type="button" class="hv__cerrar" aria-label="Cerrar novedades"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 5 14 14M19 5 5 19"/></svg></button></div>' +
        '<div class="hv__medio" aria-hidden="true"></div>' +
        '<div class="hv__texto"><p class="hv__evento" hidden></p><h2 class="hv__titulo"></h2><p class="hv__desc"></p></div>' +
        '<div class="hv__acciones"><a class="hv__reservar" href="reservar.html" hidden><span>Reservar</span></a><a class="hv__cta" target="_blank" rel="noopener noreferrer"><span>Ver en Instagram</span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9"/></svg></a></div>' +
        '<button type="button" class="hv__zona hv__zona--izq" aria-label="Anterior"></button><button type="button" class="hv__zona hv__zona--der" aria-label="Siguiente"></button>' +
        '<p class="solo-lectores" role="status" aria-live="polite"></p>' +
      '</div>';
    document.body.appendChild(d);
    var av = d.querySelector('.hv__avatar img'); av.src = 'assets/brand/logo-blanco-recorte.png';
    d.querySelector('.hv__cerrar').addEventListener('click', cerrar);
    d.querySelector('.hv__zona--izq').addEventListener('click', function () { if (!mantenido) ir(-1); });
    d.querySelector('.hv__zona--der').addEventListener('click', function () { if (!mantenido) ir(1); });
    d.addEventListener('cancel', function (e) { e.preventDefault(); cerrar(); });
    d.addEventListener('click', function (e) { if (e.target === d) cerrar(); });          // clic en el fondo oscuro
    d.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(-1); }
      else if (e.key === ' ' && e.target === d.querySelector('.hv__marco')) { e.preventDefault(); alternarPausa(); }
    });
    // mantener pulsado = pausa (como en Instagram); soltar = sigue. Un toque corto avanza/retrocede con las zonas.
    var mantenerT = 0;
    var marco = d.querySelector('.hv__marco'); marco.tabIndex = -1;
    marco.addEventListener('pointerdown', function (e) { if (e.target.closest('a, .hv__cerrar')) return; mantenerT = setTimeout(function () { mantenido = true; pausar(true); }, 220); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { marco.addEventListener(ev, function () { clearTimeout(mantenerT); if (mantenido) { setTimeout(function () { mantenido = false; }, 60); pausar(false); } }); });
    // deslizar de lado
    var sx = null; marco.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    marco.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 60) ir(dx < 0 ? 1 : -1); }, { passive: true });
    document.addEventListener('visibilitychange', function () { if (visor && visor.open) pausar(document.hidden); });
    return d;
  }

  function barras() {
    var c = visor.querySelector('.hv__barras'); c.textContent = '';
    items.forEach(function () { var s = el('i'); s.appendChild(el('b')); c.appendChild(s); });
  }
  function pintarBarras(progreso) {
    var segs = visor.querySelectorAll('.hv__barras i');
    for (var k = 0; k < segs.length; k++) segs[k].firstChild.style.transform = 'scaleX(' + (k < actual ? 1 : k === actual ? progreso : 0) + ')';
  }

  function mostrar(i) {
    actual = i; var it = items[i];
    var m = visor.querySelector('.hv__medio'); m.textContent = '';
    m.className = 'hv__medio' + (it.imagen ? '' : ' hv__medio--texto');
    if (it.imagen) m.appendChild(el('img', null, null, { src: it.imagen, alt: '', draggable: 'false' }));
    visor.querySelector('.hv__cuenta').textContent = '@' + cuenta;
    visor.querySelector('.hv__tiempo').textContent = it.fecha ? hace(it.fecha) : '';
    visor.querySelector('.hv__demo').hidden = !it.demo;
    var ev = visor.querySelector('.hv__evento'); ev.textContent = it.evento; ev.hidden = !it.evento;
    visor.querySelector('.hv__titulo').textContent = it.titulo;
    visor.querySelector('.hv__desc').textContent = it.texto;
    var a = visor.querySelector('.hv__cta'); if (it.url) { a.href = it.url; a.hidden = false; } else { a.removeAttribute('href'); a.hidden = true; }
    visor.querySelector('.hv__reservar').hidden = !it.reservar;
    visor.querySelector('.hv__marco').setAttribute('aria-label', 'Novedad ' + (i + 1) + ' de ' + items.length);
    visor.querySelector('[role=status]').textContent = (it.demo ? 'Ejemplo. ' : '') + (it.evento ? it.evento + '. ' : '') + it.titulo + '. ' + it.texto;
    visor.querySelector('.hv__zona--izq').disabled = false;
    marcarVista(it.id);
    var burbuja = raiz.querySelector('[data-i="' + i + '"]'); if (burbuja) burbuja.classList.add('historia--vista');
    restante = DURACION; pintarBarras(0); visor.classList.remove('hv--entra'); void visor.offsetWidth; visor.classList.add('hv--entra');
    if (!reducido.matches) arrancar();
  }

  function arrancar() { cancelAnimationFrame(raf); t0 = performance.now(); pausado = false; raf = requestAnimationFrame(tick); }
  function tick(ahora) {
    if (pausado) return;
    var p = Math.min(1, 1 - (restante - (ahora - t0)) / DURACION);
    pintarBarras(p);
    if (p >= 1) { if (actual < items.length - 1) { mostrar(actual + 1); } else { cerrar(); } return; }
    raf = requestAnimationFrame(tick);
  }
  function pausar(si) {
    if (reducido.matches) return;
    if (si && !pausado) { pausado = true; restante -= performance.now() - t0; cancelAnimationFrame(raf); visor.classList.add('hv--pausa'); }
    else if (!si && pausado) { visor.classList.remove('hv--pausa'); t0 = performance.now(); pausado = false; raf = requestAnimationFrame(tick); }
  }
  function alternarPausa() { pausar(!pausado); }
  function ir(d) { var n = actual + d; if (n < 0) { mostrar(0); } else if (n >= items.length) { cerrar(); } else { mostrar(n); } }

  function abrir(i) {
    if (!visor) visor = crearVisor();
    barras();
    if (!visor.open) { visor.showModal(); document.documentElement.classList.add('hv-abierto'); }
    mostrar(i);
    visor.querySelector('.hv__marco').focus({ preventScroll: true });
  }
  function cerrar() {
    if (!visor || !visor.open) return;
    cancelAnimationFrame(raf); pausado = true; visor.classList.remove('hv--pausa');
    visor.close(); document.documentElement.classList.remove('hv-abierto');
    pintarBurbujasEstado();
    if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus({ preventScroll: true });
  }
  function pintarBurbujasEstado() { var vs = vistas(); raiz.querySelectorAll('.historia').forEach(function (b) { var it = items[+b.getAttribute('data-i')]; b.classList.toggle('historia--vista', vs.indexOf(it.id) >= 0); }); }

  // ---------- Carga ----------
  function sinNovedades() { raiz.hidden = true; raiz.classList.remove('historias--espera'); hero.classList.add('sin-historias'); }
  if (!window.fetch) { sinNovedades(); return; }
  function traer(ruta) { return fetch(ruta, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('sin datos'); return r.json(); }).then(limpiar); }
  function sinDatos() { return []; }
  var real = forzarDemo ? Promise.resolve([]) : traer('datos/instagram.json').catch(sinDatos);
  real.then(function (lista) {
    if (lista.length || sinDemo) return lista;
    return traer('datos/instagram.demo.json').catch(sinDatos);   // todavía no hay publicaciones reales: ejemplos marcados
  }).then(function (lista) {
    items = lista;
    if (!items.length) { sinNovedades(); return; }   // el CSS reserva el tamaño del hero con historias
    raiz.querySelector('.historias__cuenta').textContent = '@' + cuenta;
    pintarBurbujas();
    raiz.classList.remove('historias--espera'); raiz.hidden = false;
    hero.classList.add('hay-historias');
    window.TIRUA = window.TIRUA || {}; window.TIRUA.historias = { abrir: abrir, cerrar: cerrar, total: items.length };
  }).catch(sinNovedades);
})();
