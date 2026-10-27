// Video de fondo del hero.
// Sin el archivo: se queda la portada estática (CSS), sin errores y sin reintentos.
// Con el archivo: reproducción silenciada en bucle, con botón de pausa. Una sola comprobación HEAD.
// Atributos en index.html -> <video data-video="auto|si|no" data-mp4="..." data-mp4-vertical="..." data-webm="...">
(function () {
  'use strict';

  var hero = document.querySelector('[data-hero]');
  var video = hero && hero.querySelector('video[data-video]');
  var boton = hero && hero.querySelector('[data-pausa]');
  if (!video || !boton) return;

  var modo = (video.dataset.video || 'auto').toLowerCase();
  // Celular en vertical: si existe una versión 9:16 (data-mp4-vertical) se usa esa; en el resto de pantallas, la horizontal.
  var mp4 = (video.dataset.mp4Vertical && window.matchMedia('(orientation: portrait) and (max-width: 820px)').matches) ? video.dataset.mp4Vertical : video.dataset.mp4;
  var webm = video.dataset.webm;
  if (modo === 'no' || !mp4) return;

  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pausaDelUsuario = false;
  var abandonado = false;

  function sincronizarBoton() {
    boton.setAttribute('aria-pressed', video.paused ? 'true' : 'false');
  }

  function abandonar() {
    // Archivo roto o no reproducible: volvemos a la portada y no se reintenta.
    if (abandonado) return;
    abandonado = true;
    video.pause();
    video.removeAttribute('src');
    while (video.firstChild) video.removeChild(video.firstChild);
    video.load();
    hero.classList.remove('hay-video');
    boton.hidden = true;
  }

  function intentarPlay() {
    var p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function (err) {
        // Autoplay bloqueado: se conserva la portada y se ofrece el botón para iniciar a mano.
        if (err && err.name === 'NotAllowedError') { boton.hidden = false; sincronizarBoton(); }
        else abandonar();
      });
    }
  }

  function montar() {
    if (webm) {
      var sw = document.createElement('source');
      sw.src = webm; sw.type = 'video/webm';
      video.appendChild(sw);
    }
    var sm = document.createElement('source');
    sm.src = mp4; sm.type = 'video/mp4';
    video.appendChild(sm);
    video.preload = 'metadata';

    video.addEventListener('error', abandonar, true); // errores de <source> (no burbujean: captura)
    video.addEventListener('playing', function () {
      hero.classList.add('hay-video');
      boton.hidden = false;
      sincronizarBoton();
    });
    video.addEventListener('pause', sincronizarBoton);
    video.addEventListener('play', sincronizarBoton);

    boton.addEventListener('click', function () {
      if (video.paused) { pausaDelUsuario = false; intentarPlay(); }
      else { pausaDelUsuario = true; video.pause(); }
    });

    // Ahorra CPU: pausa cuando el hero sale de pantalla (salvo que el usuario ya lo haya pausado).
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        if (abandonado || pausaDelUsuario || !hero.classList.contains('hay-video')) return;
        if (entradas[0].isIntersecting) { if (video.paused) intentarPlay(); }
        else video.pause();
      }, { threshold: 0.05 }).observe(hero);
    }

    video.load();
    if (reducido) {
      // Preferencia de movimiento reducido: no se autoreproduce; el botón deja iniciarlo a voluntad.
      pausaDelUsuario = true;
      boton.hidden = false;
      sincronizarBoton();
    } else {
      intentarPlay();
    }
  }

  // Con file:// el navegador no deja hacer fetch; se monta directo y el manejador de error cubre la ausencia.
  if (modo === 'si' || location.protocol === 'file:') { montar(); return; }

  // modo "auto": una única comprobación; si falla o no es un video, no se vuelve a intentar.
  if (!window.fetch) return;
  fetch(mp4, { method: 'HEAD', cache: 'no-store' }).then(function (r) {
    var tipo = r.headers.get('content-type') || '';
    if (r.ok && !/^text\//i.test(tipo)) montar();
  }).catch(function () { /* sin archivo o sin red: se mantiene la portada */ });
})();
