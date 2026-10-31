// Solicitud de reserva (reservar.html): una cascada de cuatro preguntas (Personas → Fecha → Hora → Tus datos) y, al lado,
// el mensaje que se va armando con lo elegido, con dos salidas: «Enviar por WhatsApp» (enlace wa.me al número del bar,
// con el texto ya escrito) y «Copiar mensaje».
// No hay disponibilidad, cupos ni confirmaciones, y los datos no se guardan ni se envían desde la página: el bar confirma a mano.
// No hace peticiones de red ni escribe en localStorage, sessionStorage o cookies.
// Textos, horas, mensaje y número de WhatsApp: js/contenido.js (reserva.* y local.whatsapp).
//
// Cascada (decisión de diseño):
//  - Solo se ve la pregunta en curso y las ya respondidas (plegadas, con su respuesta y «Cambiar»). Las que faltan no existen aún.
//  - Elegir con el puntero (clic o toque) abre sola la siguiente tras una pausa de ~350 ms (se puede corregir en ese lapso).
//  - Elegir con teclado (Enter/Espacio) no salta: aparece «Continuar» y el foco no se mueve sin que la persona lo decida.
//  - «Tus datos» es la última: no avanza; lo que se escribe cambia el mensaje en vivo.
//  - El mensaje aparece al responder la primera pregunta; los huecos que faltan se ven como [tu nombre], [fecha]…
//    y los botones de envío se habilitan solo cuando el mensaje está completo.
//  - Con prefers-reduced-motion todo ocurre sin animación.
(function () {
  'use strict';

  var C = window.TIRUA_CONTENIDO;
  var raiz = document.querySelector('[data-rsv]');
  if (!C || !C.reserva || !raiz) return;

  var T = C.reserva;
  var listaEtapas = raiz.querySelector('[data-etapas]');
  var vistaEl = raiz.querySelector('[data-vista]');
  var estadoEl = raiz.querySelector('[data-estado]');
  var rotuloEl = raiz.querySelector('[data-rsv-muestra]');
  raiz.querySelector('[data-rsv-titulo]').textContent = T.titulo;

  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  var PAUSA_AVANCE = 350;
  var ETAPAS = ['personas', 'fecha', 'hora', 'datos'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var CABECERA_SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  var ICONO_FLECHA = 'M4 12h16M14 6l6 6-6 6';
  var ICONO_ATRAS = 'M20 12H4M10 6l-6 6 6 6';
  var ICONO_COPIAR = 'M9 9h11v11H9zM4 15V4h11';
  var ICONO_EXTERNO = 'M7 17L17 7M9 7h8v8';
  var ICONO_LISTO = 'M5 12.5l4.5 4.5L19 7.5';

  // ---------- Utilidades ----------
  function el(tag, clase, texto, attrs) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]); });
    return e;
  }
  function svg(path, clase) {
    var n = document.createElement('span');
    n.innerHTML = '<svg class="' + (clase || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + path + '"/></svg>';
    return n.firstChild;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function aFecha(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function hoyISO() { return iso(new Date()); }
  function sumarDias(s, n) { var d = aFecha(s); d.setDate(d.getDate() + n); return iso(d); }
  function ym(s) { return s.slice(0, 7); }
  function sumarMeses(m, k) { var p = m.split('-'); var d = new Date(+p[0], +p[1] - 1 + k, 1, 12); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function minutos(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }
  function ahoraMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }
  function reemplazar(t, mapa) { return t.replace(/\{(\w+)\}/g, function (m, k) { return mapa[k] != null ? mapa[k] : m; }); }
  function fechaLarga(f, conAnio) { var d = aFecha(f); return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()] + (conAnio ? ' de ' + d.getFullYear() : ''); }
  function mayus(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function anunciar(msg) { estadoEl.textContent = ''; setTimeout(function () { estadoEl.textContent = msg; }, 30); }

  // Reglas de fechas y horas (solo validez, no disponibilidad)
  function limiteISO() { return sumarDias(hoyISO(), T.horizonteDias); }
  function estadoDia(f) {
    if (f < hoyISO()) return { ok: false, motivo: 'fecha pasada' };
    if (f === hoyISO()) { var hs = horasMuestra(); if (minutos(hs[hs.length - 1]) <= ahoraMin()) return { ok: false, motivo: 'ya pasaron todas las horas de hoy' }; }   // sin horas que ofrecer, hoy no es un callejón sin salida
    if (f > limiteISO()) return { ok: false, motivo: 'fuera del rango (hasta ' + T.horizonteDias + ' días)' };
    // diasCerrados está vacío mientras el local no confirme su horario (ver TODO en js/contenido.js).
    if ((T.diasCerrados || []).indexOf(aFecha(f).getDay()) !== -1) return { ok: false, motivo: 'día sin atención' };
    return { ok: true, motivo: '' };
  }
  function horasMuestra() {
    var h = T.horas, out = [];
    for (var m = minutos(h.desde); m <= minutos(h.hasta); m += h.cadaMin) out.push(pad(Math.floor(m / 60)) + ':' + pad(m % 60));
    return out;
  }
  function horaPasada(f, hora) { return f === hoyISO() && minutos(hora) <= ahoraMin(); }

  // ---------- Estado ----------
  var s = {
    abierta: 'personas',        // pregunta desplegada (null = todas plegadas)
    personas: null, grande: false, fecha: null, hora: null, nombre: '', ocasion: null, comentario: '',
    mes: ym(hoyISO()), focoDia: null,
    mensaje: '', mensajeEn: 'general', horaReseteada: false,
    continuarEn: null,          // pregunta que espera «Continuar» (elección con teclado)
    foco: null, copia: ''
  };
  if (new URLSearchParams(window.location.search).get('ocasion') === 'cumpleanos' && (T.ocasiones || []).indexOf('Cumpleaños') !== -1) {
    s.ocasion = 'Cumpleaños';
    raiz.querySelector('[data-rsv-titulo]').textContent = 'Celebra tu cumpleaños';
    document.title = 'Celebra tu cumpleaños · Tirúa';
  }
  var temporizador = null, avancePendiente = null;
  var nodos = {};               // por etapa: { li, btn, cuerpo, contenido, rotulo, valor }
  var vista = {};               // piezas persistentes del mensaje

  function valorEtapa(e) { if (e === 'datos') return s.nombre.trim() || null; return s[e]; }
  function primeraPendiente() {
    for (var i = 0; i < ETAPAS.length; i++) if (valorEtapa(ETAPAS[i]) == null) return ETAPAS[i];
    return 'completo';
  }
  function textoPersonas() { return s.personas == null ? null : (s.grande ? '7 o más personas' : plural(s.personas, 'persona', 'personas')); }
  function respuesta(e) {
    if (valorEtapa(e) == null) return null;
    if (e === 'personas') return textoPersonas();
    if (e === 'fecha') return mayus(fechaLarga(s.fecha));
    if (e === 'hora') return s.hora + ' h';
    return s.nombre.trim();
  }
  var PREGUNTA = { personas: 'tituloPersonas', fecha: 'tituloFecha', hora: 'tituloHora', datos: 'tituloDatos' };

  // ---------- Navegación ----------
  function cancelarAvance() { clearTimeout(temporizador); avancePendiente = null; }
  function abrir(etapa, o) {
    o = o || {};
    cancelarAvance();
    var cambia = s.abierta !== etapa;
    s.abierta = etapa;
    if (cambia) { s.mensaje = ''; s.mensajeEn = 'general'; s.continuarEn = null; }
    s.foco = null;
    refrescar();
    if (etapa) {
      var n = nodos[etapa];
      if (!o.sinFoco) n.btn.focus({ preventScroll: true });
      anunciar(reemplazar(T.pasoDe, { n: ETAPAS.indexOf(etapa) + 1, total: ETAPAS.length, nombre: T.etapas[etapa] }));
      llevarA(n.li);
    }
  }
  function llevarA(nodo) {
    // Espera a que termine de plegarse la pregunta anterior: así el destino ya no se mueve.
    setTimeout(function () { nodo.scrollIntoView({ block: 'start', behavior: reducido.matches ? 'auto' : 'smooth' }); }, reducido.matches ? 0 : 460);
  }
  // Tras responder: abre lo que falte; si ya está todo, pliega y lleva al mensaje.
  function avanzar() {
    var p = primeraPendiente();
    if (p === 'completo') {
      s.abierta = null; s.continuarEn = null; s.foco = null;
      refrescar();
      anunciar(T.listoParaEnviar);
      llevarA(vistaEl);
      return;
    }
    abrir(p);
  }
  function programarAvance(desde) {
    cancelarAvance();
    avancePendiente = desde;
    temporizador = setTimeout(function () { avancePendiente = null; avanzar(); }, reducido.matches ? 0 : PAUSA_AVANCE);
  }

  function elegir(etapa, valor, o) {
    o = o || {};
    if (etapa === 'personas') { s.grande = valor === 'grande'; s.personas = s.grande ? 7 : valor; }
    else s[etapa] = valor;
    if (etapa === 'fecha') s.focoDia = valor;
    s.mensaje = ''; s.mensajeEn = 'general';
    if (etapa === 'hora') s.horaReseteada = false;
    // Si la fecha pasa a ser hoy y la hora elegida ya pasó, se pide elegir otra.
    var aviso = '';
    if (s.fecha && s.hora && horaPasada(s.fecha, s.hora)) { s.hora = null; s.horaReseteada = true; aviso = T.horaPasada; }
    s.continuarEn = o.teclado ? etapa : null;
    s.foco = o.clave ? { clave: o.clave, sinScroll: true } : null;
    var txt = etapa === 'personas' ? textoPersonas() : etapa === 'fecha' ? fechaLarga(valor, true) : valor + ' h';
    anunciar(reemplazar(o.teclado ? T.elegidoManual : T.elegidoAvance, { valor: mayus(txt) }) + (etapa === 'personas' && s.grande ? ' ' + T.grandeAviso : '') + (aviso ? ' ' + aviso : ''));
    refrescar();
    if (o.teclado) cancelarAvance(); else programarAvance(etapa);
  }

  // ---------- Piezas de interfaz ----------
  function cta(texto, o) {
    o = o || {};
    var esEnlace = !!(o.href || o.enlace);
    var b = el(esEnlace ? 'a' : 'button', 'cta' + (o.secundario ? ' cta--sec' : ''), null, {
      type: esEnlace ? false : 'button', href: o.href || false, target: o.href ? '_blank' : false, rel: o.href ? 'noopener noreferrer' : false,
      'data-clave': o.clave || false, 'aria-label': o.etiqueta || false
    });
    b.appendChild(el('span', 'cta__texto', texto));
    b.appendChild(svg(o.icono || ICONO_FLECHA, 'cta__flecha'));
    if (o.alClic) b.addEventListener('click', o.alClic);
    return b;
  }
  function botonContinuar(etapa) {
    var c = el('div', 'etapa__continuar');
    c.appendChild(cta(T.continuar, { clave: 'continuar', alClic: function () { avanzar(); } }));
    return c;
  }
  function seguirSiTeclado(cont, etapa) {
    if (s.continuarEn === etapa && valorEtapa(etapa) != null) cont.appendChild(botonContinuar(etapa));
  }

  // ---------- Pregunta 1: Personas ----------
  function llenarPersonas(sec) {
    var g = el('div', 'teselas', null, { role: 'group', 'aria-label': T.tituloPersonas });
    for (var n = 1; n <= T.maxPersonas; n++) {
      (function (n) {
        var b = el('button', 'tesela', null, { type: 'button', 'aria-pressed': String(s.personas === n && !s.grande), 'aria-label': plural(n, 'persona', 'personas'), 'data-clave': 'p-' + n });
        b.appendChild(el('span', 'tesela__n', String(n), { 'aria-hidden': 'true' }));
        b.addEventListener('click', function (ev) { elegir('personas', n, { clave: 'p-' + n, teclado: ev.detail === 0 }); });
        g.appendChild(b);
      })(n);
    }
    var gb = el('button', 'tesela tesela--grande', null, { type: 'button', 'aria-pressed': String(s.grande), 'aria-label': (T.maxPersonas + 1) + ' o más personas', 'data-clave': 'p-grande', 'aria-describedby': s.grande ? 'aviso-grande' : false });
    gb.appendChild(el('span', 'tesela__n', (T.maxPersonas + 1) + '+', { 'aria-hidden': 'true' }));   // solo el número; el lector de pantalla oye «7 o más personas»
    gb.addEventListener('click', function (ev) { elegir('personas', 'grande', { clave: 'p-grande', teclado: ev.detail === 0 }); });
    g.appendChild(gb);
    sec.appendChild(g);
    if (s.grande) sec.appendChild(el('p', 'rsv__aviso', T.grandeAviso, { id: 'aviso-grande' }));
    if (s.personas == null) sec.appendChild(el('p', 'rsv__pista rsv__pista--avance', T.pistaAvance));
    seguirSiTeclado(sec, 'personas');
  }

  // ---------- Pregunta 2: Fecha ----------
  function nMeses() { return 1; }
  function nombreMes(m, n) {
    var a = m.split('-'), t = MESES[+a[1] - 1] + ' de ' + a[0];
    if (n > 1) { var b = sumarMeses(m, 1).split('-'); t += ' y ' + MESES[+b[1] - 1] + ' de ' + b[0]; }
    return mayus(t);
  }
  function limites() {
    var hoy = hoyISO(), fin = limiteISO();
    var finMes = new Date(+fin.slice(0, 4), +fin.slice(5, 7), 0, 12);
    return { min: ym(hoy) + '-01', max: iso(finMes), mesMin: ym(hoy), mesMax: ym(fin) };
  }
  function clamp(f, l) { return f < l.min ? l.min : (f > l.max ? l.max : f); }

  function etiquetaDia(f, est, hoy, sel) {
    var d = aFecha(f);
    var t = DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear();
    if (hoy) t += ', hoy';
    if (!est.ok) t += ', no se puede elegir: ' + est.motivo;
    if (sel) t += ', elegida';
    return t;
  }

  function tablaMes(m, foco) {
    var p = m.split('-'), anio = +p[0], mes = +p[1] - 1;
    var t = el('table', 'cal__tabla', null, { role: 'grid' });
    t.appendChild(el('caption', 'cal__mes', MESES[mes] + ' de ' + anio));
    var cab = el('tr', null, null, { role: 'row' });
    CABECERA_SEMANA.forEach(function (n) {
      var th = el('th', 'cal__sem', null, { scope: 'col', role: 'columnheader', 'aria-label': n });
      th.appendChild(el('span', null, n.slice(0, 3), { 'aria-hidden': 'true' }));
      cab.appendChild(th);
    });
    var thead = el('thead'); thead.appendChild(cab); t.appendChild(thead);
    var cuerpo = el('tbody');
    var primero = new Date(anio, mes, 1, 12), desfase = (primero.getDay() + 6) % 7, total = new Date(anio, mes + 1, 0).getDate();
    var hoy = hoyISO(), fila = null;
    for (var i = 0; i < desfase + total; i++) {
      if (i % 7 === 0) { fila = el('tr', null, null, { role: 'row' }); cuerpo.appendChild(fila); }
      var td = el('td', 'cal__celda', null, { role: 'gridcell' });
      if (i >= desfase) {
        var dia = i - desfase + 1, f = m + '-' + pad(dia);
        var est = estadoDia(f), esHoy = f === hoy, sel = f === s.fecha;
        var b = el('button', 'dia' + (est.ok ? '' : ' dia--no') + (sel ? ' dia--sel' : '') + (esHoy ? ' dia--hoy' : ''), String(dia), {
          type: 'button', 'data-fecha': f, 'data-clave': 'd-' + f, tabindex: f === foco ? '0' : '-1',
          'aria-label': etiquetaDia(f, est, esHoy, sel), 'aria-disabled': est.ok ? false : 'true', 'aria-current': esHoy ? 'date' : false
        });
        td.setAttribute('aria-selected', sel ? 'true' : 'false');
        td.appendChild(b);
      }
      fila.appendChild(td);
    }
    t.appendChild(cuerpo);
    return t;
  }

  function calendario() {
    var l = limites(), n = nMeses();
    if (s.mes < l.mesMin) s.mes = l.mesMin;
    if (sumarMeses(s.mes, n - 1) > l.mesMax) { var c0 = sumarMeses(l.mesMax, -(n - 1)); s.mes = c0 < l.mesMin ? l.mesMin : c0; }
    var visibles = []; for (var i = 0; i < n; i++) visibles.push(sumarMeses(s.mes, i));
    // Día enfocable (roving tabindex): el foco guardado, la fecha elegida, hoy o el primer día visible.
    var foco = s.focoDia && visibles.indexOf(ym(s.focoDia)) !== -1 ? s.focoDia : (s.fecha && visibles.indexOf(ym(s.fecha)) !== -1 ? s.fecha : null);
    if (!foco) {
      var hoy = hoyISO();
      foco = visibles.indexOf(ym(hoy)) !== -1 ? hoy : s.mes + '-01';
    }
    var cont = el('div', 'cal');
    var barra = el('div', 'cal__barra');
    var prev = el('button', 'cal__nav', null, { type: 'button', 'aria-label': T.mesAnterior, 'data-clave': 'mes-prev', 'aria-disabled': s.mes <= l.mesMin ? 'true' : false });
    prev.appendChild(svg(ICONO_ATRAS));
    var sig = el('button', 'cal__nav', null, { type: 'button', 'aria-label': T.mesSiguiente, 'data-clave': 'mes-sig', 'aria-disabled': sumarMeses(s.mes, n - 1) >= l.mesMax ? 'true' : false });
    sig.appendChild(svg(ICONO_FLECHA));
    prev.addEventListener('click', function () { if (prev.getAttribute('aria-disabled')) return; cancelarAvance(); s.mes = sumarMeses(s.mes, -1); s.focoDia = null; s.foco = { clave: 'mes-prev', sinScroll: true }; refrescar(); anunciar(nombreMes(s.mes, n)); });
    sig.addEventListener('click', function () { if (sig.getAttribute('aria-disabled')) return; cancelarAvance(); s.mes = sumarMeses(s.mes, 1); s.focoDia = null; s.foco = { clave: 'mes-sig', sinScroll: true }; refrescar(); anunciar(nombreMes(s.mes, n)); });
    barra.appendChild(prev); barra.appendChild(sig);
    cont.appendChild(barra);

    var meses = el('div', 'cal__meses');
    visibles.forEach(function (m) { meses.appendChild(tablaMes(m, foco)); });
    cont.appendChild(meses);

    meses.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('.dia'); if (!b) return;
      var f = b.getAttribute('data-fecha'), est = estadoDia(f);
      if (!est.ok) {
        cancelarAvance();
        s.mensaje = 'El ' + fechaLarga(f) + ' no se puede elegir: ' + est.motivo + '.'; s.mensajeEn = 'fecha';
        s.focoDia = f; s.foco = { clave: 'd-' + f, sinScroll: true };
        anunciar(s.mensaje); refrescar();
        var mm = nodos.fecha.contenido.querySelector('.rsv__mensaje'); if (mm) mm.scrollIntoView({ block: 'nearest' });
        return;
      }
      elegir('fecha', f, { clave: 'd-' + f, teclado: ev.detail === 0 });
    });
    meses.addEventListener('keydown', function (ev) {
      var b = ev.target.closest && ev.target.closest('.dia'); if (!b) return;
      var f = b.getAttribute('data-fecha'), d = aFecha(f), destino = null;
      var pasos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      if (pasos[ev.key] != null) destino = sumarDias(f, pasos[ev.key]);
      else if (ev.key === 'Home') destino = sumarDias(f, -((d.getDay() + 6) % 7));
      else if (ev.key === 'End') destino = sumarDias(f, 6 - ((d.getDay() + 6) % 7));
      else if (ev.key === 'PageUp' || ev.key === 'PageDown') {
        var k = ev.key === 'PageUp' ? -1 : 1, mm = sumarMeses(ym(f), k);
        var ult = new Date(+mm.slice(0, 4), +mm.slice(5, 7), 0, 12).getDate();
        destino = mm + '-' + pad(Math.min(d.getDate(), ult));
      }
      if (!destino) return;
      ev.preventDefault();
      destino = clamp(destino, l);
      s.focoDia = destino;
      if (ym(destino) < s.mes) s.mes = ym(destino);
      else if (ym(destino) > sumarMeses(s.mes, n - 1)) s.mes = sumarMeses(ym(destino), -(n - 1));
      s.foco = { clave: 'd-' + destino, sinScroll: true };
      refrescar();
    });
    return cont;
  }

  function leyenda() {
    var ul = el('ul', 'leyenda');
    [['sel', T.leyenda.seleccionado], ['hoy', T.leyenda.hoy], ['no', T.leyenda.no]].forEach(function (x) {
      var li = el('li', 'leyenda__item');
      li.appendChild(el('span', 'leyenda__muestra leyenda__muestra--' + x[0], '12', { 'aria-hidden': 'true' }));
      li.appendChild(el('span', null, x[1]));
      ul.appendChild(li);
    });
    return ul;
  }

  function llenarFecha(sec) {
    var bf = el('div', 'rsv__bloque');
    bf.appendChild(calendario());
    if (s.mensaje && s.mensajeEn === 'fecha') bf.appendChild(el('p', 'rsv__mensaje', s.mensaje));
    bf.appendChild(leyenda());
    bf.appendChild(el('p', 'rsv__pista', reemplazar((T.diasCerrados && T.diasCerrados.length && T.leyendaNotaCierre) || T.leyendaNota, { dias: T.horizonteDias })));
    sec.appendChild(bf);
    seguirSiTeclado(sec, 'fecha');
  }

  // ---------- Pregunta 3: Hora (horas de muestra) ----------
  function llenarHora(sec) {
    if (!s.fecha) return;
    sec.appendChild(el('p', 'rsv__rotulo', T.horas.rotulo));
    if (T.horarioLocal) sec.appendChild(el('p', 'rsv__pista', T.horarioLocal));
    sec.appendChild(el('p', 'rsv__pista', mayus(fechaLarga(s.fecha, true)) + '.' + (s.fecha === hoyISO() ? ' ' + T.horasNota : '')));
    if (s.horaReseteada) sec.appendChild(el('p', 'rsv__mensaje', T.horaPasada));
    if (s.mensaje) sec.appendChild(el('p', 'rsv__mensaje', s.mensaje));
    var fila = el('div', 'horas', null, { role: 'group', 'aria-label': T.tituloHora });
    horasMuestra().forEach(function (h) {
      var pasada = horaPasada(s.fecha, h);
      var b = el('button', 'hora', h, {
        type: 'button', 'aria-pressed': String(s.hora === h), 'aria-disabled': pasada ? 'true' : false, 'data-clave': 'h-' + h,
        'aria-label': h + (pasada ? ', ya pasó, no se puede elegir' : '')
      });
      b.addEventListener('click', function (ev) {
        if (pasada) { cancelarAvance(); s.mensaje = 'A las ' + h + ': esa hora ya pasó hoy.'; s.mensajeEn = 'general'; anunciar(s.mensaje); s.foco = { clave: 'h-' + h, sinScroll: true }; refrescar(); return; }
        elegir('hora', h, { clave: 'h-' + h, teclado: ev.detail === 0 });
      });
      fila.appendChild(b);
    });
    sec.appendChild(fila);
    seguirSiTeclado(sec, 'hora');
  }

  // ---------- Pregunta 4: Tus datos (nombre obligatorio; ocasión y comentarios opcionales). Se construye una vez: lo escrito no se pierde. ----------
  function construirDatos(sec) {
    var form = el('div', 'rsv__form');
    var cn = el('div', 'campo');
    cn.appendChild(el('label', 'campo__et', T.etiquetaNombre, { for: 'campo-nombre' }));
    var inN = el('input', 'campo__in', null, { type: 'text', id: 'campo-nombre', maxlength: '60', autocomplete: 'given-name', 'aria-describedby': 'ayuda-nombre', 'data-clave': 'nombre', required: true });
    cn.appendChild(inN);
    cn.appendChild(el('p', 'campo__ayuda', T.ayudaNombre, { id: 'ayuda-nombre' }));
    form.appendChild(cn);

    var co = el('fieldset', 'campo campo--ocasion');
    co.appendChild(el('legend', 'campo__et', T.etiquetaOcasion));
    var chips = el('div', 'ocasiones');
    (T.ocasiones || []).forEach(function (o) {
      var b = el('button', 'ocasion', o, { type: 'button', 'aria-pressed': String(s.ocasion === o), 'data-clave': 'o-' + o });
      b.addEventListener('click', function () {
        s.ocasion = s.ocasion === o ? null : o;
        Array.prototype.forEach.call(chips.children, function (c) { c.setAttribute('aria-pressed', String(c.textContent === s.ocasion)); });
        actualizarVista();
      });
      chips.appendChild(b);
    });
    co.appendChild(chips);
    form.appendChild(co);

    var cc = el('div', 'campo');
    cc.appendChild(el('label', 'campo__et', T.etiquetaComentario, { for: 'campo-comentario' }));
    var ta = el('textarea', 'campo__in campo__in--area', null, { id: 'campo-comentario', rows: '3', maxlength: '300', 'aria-describedby': 'ayuda-comentario' });
    cc.appendChild(ta);
    cc.appendChild(el('p', 'campo__ayuda', T.ayudaComentario, { id: 'ayuda-comentario' }));
    form.appendChild(cc);
    sec.appendChild(form);

    inN.addEventListener('input', function () { s.nombre = inN.value; actualizarCabeceras(); actualizarVista(); });
    inN.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      if (!s.nombre.trim()) return;
      // Con todo completo, Enter lleva al botón de WhatsApp (no envía nada por sí solo).
      if (primeraPendiente() === 'completo') { vista.wa.focus(); vistaEl.scrollIntoView({ block: 'nearest', behavior: reducido.matches ? 'auto' : 'smooth' }); }
    });
    ta.addEventListener('input', function () { s.comentario = ta.value; actualizarVista(); });
  }

  // ---------- Mensaje (vista previa en vivo, WhatsApp y copiar) ----------
  var M0 = '\u0001', M1 = '\u0002';   // marcan los huecos del mensaje
  function hueco(valor, etiqueta) { return valor || (M0 + etiqueta + M1); }
  function textoMensaje(conHuecos) {
    var com = s.comentario.trim().replace(/\s+/g, ' ');
    var nombre = s.nombre.trim();
    var datos = conHuecos
      ? { nombre: hueco(nombre, T.huecos.nombre), personas: hueco(textoPersonas(), T.huecos.personas), fecha: hueco(s.fecha && fechaLarga(s.fecha, true), T.huecos.fecha), hora: hueco(s.hora, T.huecos.hora) }
      : { nombre: nombre, personas: textoPersonas(), fecha: s.fecha && fechaLarga(s.fecha, true), hora: s.hora };
    datos.ocasion = s.ocasion ? '\nOcasión: ' + s.ocasion : '';
    datos.comentario = com ? '\nComentarios: ' + com : '';
    return reemplazar(T.mensaje, datos);
  }
  function faltantes() {
    var f = [];
    if (s.personas == null) f.push(T.huecos.personas);
    if (!s.fecha) f.push(T.huecos.fecha);
    if (!s.hora) f.push(T.huecos.hora);
    if (!s.nombre.trim()) f.push(T.huecos.nombre);
    return f;
  }
  function numeroWhatsApp() {
    var n = C.local && typeof C.local.whatsapp === 'string' ? C.local.whatsapp.replace(/\D/g, '') : '';
    return n.length >= 8 ? n : '';
  }
  // Enlace wa.me al número del bar con el texto ya escrito: abre la app de WhatsApp (o WhatsApp Web) directo en ese chat.
  // Sin número cargado (LOCAL.whatsapp null) abre WhatsApp con el texto y la persona elige el chat.
  function urlWhatsApp(texto) { return 'https://wa.me/' + numeroWhatsApp() + '?text=' + encodeURIComponent(texto); }

  function construirVista() {
    var h = el('h2', 'vista__titulo', T.tituloVista, { id: 'vista-titulo' });
    vistaEl.appendChild(h);
    vista.msg = el('div', 'mensaje-ig', null, { id: 'mensaje-solicitud', role: 'group', 'aria-labelledby': 'vista-titulo' });
    vistaEl.appendChild(vista.msg);
    vista.falta = el('p', 'vista__falta', '', { id: 'vista-falta' });
    vistaEl.appendChild(vista.falta);
    vista.grande = el('p', 'vista__nota', T.grandeAviso);
    vistaEl.appendChild(vista.grande);
    var acc = el('div', 'vista__acciones');
    vista.wa = cta(T.enviarWhatsApp, { enlace: true, icono: ICONO_EXTERNO, clave: 'whatsapp', etiqueta: T.whatsappEtiqueta });
    vista.wa.classList.add('cta--whatsapp');
    vista.wa.setAttribute('role', 'link');
    vista.wa.setAttribute('aria-describedby', 'vista-falta nota-whatsapp');
    vista.wa.addEventListener('click', function (ev) { if (vista.wa.getAttribute('aria-disabled') === 'true') ev.preventDefault(); });
    acc.appendChild(vista.wa);
    vista.copiar = cta(T.copiar, { secundario: true, icono: ICONO_COPIAR, clave: 'copiar' });
    vista.copiar.setAttribute('aria-describedby', 'vista-falta');
    vista.copiar.addEventListener('click', function () {
      if (vista.copiar.getAttribute('aria-disabled') === 'true') return;
      copiar(textoMensaje(false), vista.msg, vista.copia);
    });
    acc.appendChild(vista.copiar);
    vistaEl.appendChild(acc);
    vista.nota = el('p', 'vista__nota', '', { id: 'nota-whatsapp' });
    vistaEl.appendChild(vista.nota);
    vista.copia = el('p', 'rsv__copia', '', { 'aria-live': 'polite' });
    vistaEl.appendChild(vista.copia);
    vistaEl.appendChild(el('p', 'vista__aviso', T.avisoSolicitud));
  }

  function actualizarVista() {
    var visible = s.personas != null;
    if (visible && vistaEl.hidden) { vistaEl.hidden = false; vistaEl.classList.add('entra'); setTimeout(function () { vistaEl.classList.remove('entra'); }, 700); }
    if (!visible) { vistaEl.hidden = true; return; }

    // Mensaje: lo que falta se ve como [hueco]
    var partes = textoMensaje(true).split(new RegExp(M0 + '([^' + M1 + ']*)' + M1));
    var previo = vista.msg.textContent;
    vista.msg.textContent = '';
    partes.forEach(function (p, i) { if (i % 2) vista.msg.appendChild(el('span', 'hueco', '[' + p + ']')); else if (p) vista.msg.appendChild(document.createTextNode(p)); });
    if (vista.msg.textContent !== previo && s.copia) { s.copia = ''; vista.copia.textContent = ''; }

    var falta = faltantes(), completo = falta.length === 0;
    vista.falta.textContent = completo ? '' : reemplazar(T.faltaVista, { lista: falta.join(', ') });
    vista.falta.hidden = completo;
    vista.grande.hidden = !s.grande;
    vista.nota.textContent = numeroWhatsApp() ? T.whatsappNota : T.whatsappNotaSinNumero;
    vistaEl.classList.toggle('vista--completa', completo);

    var wa = vista.wa;
    if (completo) { wa.setAttribute('href', urlWhatsApp(textoMensaje(false))); wa.setAttribute('target', '_blank'); wa.setAttribute('rel', 'noopener noreferrer'); wa.removeAttribute('aria-disabled'); wa.removeAttribute('tabindex'); }
    else { wa.removeAttribute('href'); wa.removeAttribute('target'); wa.removeAttribute('rel'); wa.setAttribute('aria-disabled', 'true'); wa.setAttribute('tabindex', '0'); }
    if (completo) vista.copiar.removeAttribute('aria-disabled'); else vista.copiar.setAttribute('aria-disabled', 'true');
  }

  function copiar(texto, nodo, estado) {
    function ok() { s.copia = T.copiado; estado.textContent = T.copiado; anunciar(T.copiado); }
    function fallo() {
      // Respaldo: se selecciona el texto para copiarlo a mano.
      var r = document.createRange(); r.selectNodeContents(nodo);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      var copiado = false;
      try { copiado = document.execCommand && document.execCommand('copy'); } catch (e) { copiado = false; }
      if (copiado) ok(); else { s.copia = T.copiarFallo; estado.textContent = T.copiarFallo; anunciar(T.copiarFallo); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, fallo);
    } else fallo();
  }

  // ---------- Cascada ----------
  function construirEtapas() {
    ETAPAS.forEach(function (e, i) {
      var li = el('li', 'etapa', null, { 'data-etapa': e });
      var cab = el('h2', 'etapa__cab');
      var btn = el('button', 'etapa__btn', null, { type: 'button', id: 'etapa-btn-' + e, 'aria-controls': 'etapa-' + e, 'aria-expanded': 'false', 'data-clave': 'cab-' + e });
      var n = el('span', 'etapa__n', null, { 'aria-hidden': 'true' });
      n.appendChild(el('span', 'etapa__num', String(i + 1)));
      n.appendChild(svg(ICONO_LISTO, 'etapa__listo'));
      btn.appendChild(n);
      var textos = el('span', 'etapa__textos');
      var rotulo = el('span', 'etapa__rotulo', T.etapas[e]);
      var valor = el('span', 'etapa__valor');
      textos.appendChild(rotulo); textos.appendChild(valor);
      btn.appendChild(textos);
      btn.appendChild(el('span', 'etapa__cambiar', T.cambiar, { 'aria-hidden': 'true' }));
      cab.appendChild(btn);
      li.appendChild(cab);
      var cuerpo = el('div', 'etapa__cuerpo', null, { id: 'etapa-' + e, role: 'region', 'aria-labelledby': 'etapa-btn-' + e });
      var interior = el('div', 'etapa__interior');
      var contenido = el('div', 'etapa__contenido');
      interior.appendChild(contenido); cuerpo.appendChild(interior); li.appendChild(cuerpo);
      li.hidden = true;
      listaEtapas.appendChild(li);
      nodos[e] = { li: li, btn: btn, cuerpo: cuerpo, contenido: contenido, valor: valor, visible: false };
      btn.addEventListener('click', function () {
        if (s.abierta === e) { cancelarAvance(); s.abierta = null; s.continuarEn = null; refrescar(); anunciar(T.etapas[e] + ': ' + (respuesta(e) || T.sinElegir) + '.'); }
        else abrir(e);
      });
    });
    construirDatos(nodos.datos.contenido);
  }
  function actualizarCabeceras() {
    ETAPAS.forEach(function (e) {
      var n = nodos[e], listo = valorEtapa(e) != null, abierta = s.abierta === e;
      n.li.classList.toggle('etapa--lista', listo);
      n.li.classList.toggle('etapa--abierta', abierta);
      n.btn.setAttribute('aria-expanded', String(abierta));
      var texto = !abierta && listo ? respuesta(e) : T[PREGUNTA[e]];
      if (n.valor.textContent !== texto) n.valor.textContent = texto;
      n.btn.setAttribute('aria-label', T.etapas[e] + ': ' + (listo ? respuesta(e) : T.sinElegir) + (abierta ? '' : (listo ? '. ' + T.cambiar : '')));
      n.cuerpo.inert = !abierta;
    });
  }
  function llenar(e) {
    if (e === 'datos') return;
    var c = nodos[e].contenido;
    c.textContent = '';
    if (e === 'personas') llenarPersonas(c); else if (e === 'fecha') llenarFecha(c); else llenarHora(c);
  }

  function refrescar() {
    var a = document.activeElement;
    var guardado = null;
    if (!s.foco && a && a !== document.body && a.getAttribute && a.getAttribute('data-clave') && nodos[s.abierta] && nodos[s.abierta].contenido.contains(a) && s.abierta !== 'datos') guardado = { clave: a.getAttribute('data-clave'), sinScroll: true };
    var pend = primeraPendiente(), tope = pend === 'completo' ? ETAPAS.length - 1 : ETAPAS.indexOf(pend);
    var url = window.TIRUA && window.TIRUA.urlInstagram ? window.TIRUA.urlInstagram() : null;
    rotuloEl.textContent = url ? '' : T.demostracion;   // «Demostración…» mientras Instagram no esté conectado
    rotuloEl.hidden = !!url;
    ETAPAS.forEach(function (e, i) {
      var n = nodos[e], visible = i <= tope;
      if (visible && !n.visible) {
        n.li.hidden = false;
        if (!reducido.matches) { n.li.classList.add('entra'); setTimeout(function () { n.li.classList.remove('entra'); }, 700); }
      }
      if (!visible) n.li.hidden = true;
      n.visible = visible;
    });
    if (s.abierta && !nodos[s.abierta].visible) s.abierta = null;
    actualizarCabeceras();
    if (s.abierta) llenar(s.abierta);
    actualizarVista();
    var f = s.foco || guardado; s.foco = null;
    if (!f) return;
    var nodo = nodos[s.abierta] && nodos[s.abierta].contenido.querySelector('[data-clave="' + f.clave + '"]');
    if (!nodo) return;
    nodo.focus({ preventScroll: true });
    if (!f.sinScroll) nodo.scrollIntoView({ block: 'nearest' });
  }

  construirEtapas();
  construirVista();
  refrescar();
})();

