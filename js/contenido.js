// CONTENIDO EDITABLE DEL SITIO
// Se puede cambiar sin tocar HTML, CSS ni el resto del JS. Los textos marcados con data-texto="ruta" salen de aquí.
// Qué es REAL y qué sigue de MUESTRA:
//   REAL (fuente: perfil de Instagram @bartirua, captura entregada por Pablo el 2026-10-17): bloque «local» de abajo.
//   REAL (fuente: carta pública de Justo del bar, tomada el 2026-10-18): 8 bebestibles con foto, en js/baraja-datos.js (uso de las fotos pendiente de confirmar con el local).
//   De MUESTRA / pendiente: demás categorías de la carta, descripciones y fotos de los bloques de categorías, horas de reserva, hora de cierre,
//   el horario (hay que confirmarlo con el local), 2 enlaces de la bio que no se conocen, logo nuevo.

// ---------- DATOS DEL LOCAL (única fuente; el resto del archivo los reutiliza) ----------
(function () {
var LOCAL = {
  nombre: 'Tirúa Bar-Restorán | Pirque',          // nombre en la bio de Instagram
  frase: 'Tu lugar de encuentro',                  // frase de la bio de Instagram
  direccion: 'Ramón Subercaseaux 455, Pirque, Región Metropolitana, Chile',
  instagram: 'bartirua',                           // usuario sin «@»  → https://www.instagram.com/bartirua/
  // Horario que figura en la bio («Mar a sáb · desde las 18:00»). NO está confirmado por el local y la hora de cierre se desconoce.
  horario: { texto: 'Martes a sábado desde las 18:00', fuente: 'según el Instagram del bar', cierre: 'Hora de cierre: por confirmar' },
  rasgos: ['Terraza cerrada y calefaccionada', 'Pet friendly'],   // de la bio de Instagram
  reservas: 'Solicitud por WhatsApp; el bar la confirma a mano',
  // WhatsApp del bar para recibir las solicitudes: SOLO dígitos con código de país (ej. '569XXXXXXXX'). Falta que Oriel lo entregue.
  // Con null el botón «Enviar por WhatsApp» abre WhatsApp con el mensaje ya escrito y la persona elige el chat.
  whatsapp: null,
  // Enlace de carta y pedidos que el bar usa en su bio. Hay 2 enlaces más que no se conocen.
  pedidos: 'https://cuenta.getjusto.com/client/start/jM5QpLn7ETXwZ5SJp/menu',
  // «Cómo llegar»: enlace normal a la búsqueda de Google Maps (no se incrusta nada de Google).
  mapa: 'https://www.google.com/maps/search/?api=1&query=Ram%C3%B3n+Subercaseaux+455+Pirque'
};

window.TIRUA_CONTENIDO = {

  local: LOCAL,

  // ---------- LOGO ----------
  // Cambia el logo editando SOLO estas rutas (y poniendo el archivo nuevo en assets/brand/).
  //  - principal: logo grande del hero (indica su proporción ancho / alto en proporcionPrincipal). Funciona con logo cuadrado u horizontal, blanco sobre transparente.
  //  - cabecera:  logo de la cabecera y el pie. Si lo dejas en null se usa «principal».
  //  - alturaCabecera: alto en px del logo de la cabecera (cuadrado ~44, horizontal ~26).
  marca: {
    alt: 'Tirúa, bar restorán',
    principal: 'assets/brand/logo-blanco-recorte.png',
    proporcionPrincipal: '792 / 800',   // ancho / alto del archivo «principal» (reserva el espacio y evita saltos al cargar)
    cabecera: 'assets/brand/logo-blanco-wordmark.png',
    alturaCabecera: 26
  },

  // Barra fina superior
  aviso: 'Sitio en construcción · carta parcial y fotos por confirmar',

  // Menú (cabecera y pie). El orden es el que se ve.
  navegacion: [
    { texto: 'Inicio', href: '#inicio' },
    { texto: 'Carta', href: '#carta' },
    { texto: 'Reservas', href: '#reservas' },
    { texto: 'Mapa', href: '#mapa' },
    { texto: 'Delivery', href: '#delivery' }
  ],

  // ---------- CATEGORÍAS ----------
  // 4 categorías = 4 palos de la baraja (el palo y su color están en js/baraja-datos.js, mismo `id`).
  // imagen: ruta a la foto (por ejemplo 'assets/img/bebestibles.jpg') o null para mostrar el marcador «Foto pendiente».
  // No se pide ninguna imagen mientras el valor sea null.
  categorias: {
    titulo: 'Conoce nuestras categorías',
    bajada: 'Elige una y te llevamos a la carta.',
    rotuloFoto: 'Foto pendiente',
    rotuloProximamente: 'Próximamente',
    items: [
      { id: 'bebestibles',  nombre: 'Bebestibles',          descripcion: 'Para brindar.', imagen: 'assets/img/bebestibles.webp', altImagen: 'Playa Tirúa, un coctel azul de la carta' },
      { id: 'individuales', nombre: 'Comidas individuales', descripcion: 'Lo principal de la mesa.', imagen: 'assets/img/individuales.webp', altImagen: 'Classic Burger con papas fritas' },
      { id: 'postres',      nombre: 'Postres',              descripcion: 'Para cerrar.', imagen: 'assets/img/postres.webp', altImagen: 'Volcán de chocolate con helado y frutos rojos' },
      { id: 'compartir',    nombre: 'Para compartir',       descripcion: 'Para disfrutar entre varios.', imagen: 'assets/img/compartir.webp', altImagen: 'Tabla marina para compartir' }
    ]
  },

  // ---------- CARTA (baraja) ----------
  // Los productos (8 bebestibles reales de Justo), precios, fotos, palos y colores de la baraja viven en js/baraja-datos.js (palos y colores, provisionales).
  // Aquí solo van los textos de la sección. «local.pedidos» alimenta el enlace a la carta completa.
  carta: {
    titulo: 'Carta',
    bajada: 'Un adelanto de cómo se verá: cada plato, una carta.',
    enlaceCompleta: 'Ver carta completa en la plataforma del bar',
    enlaceNota: 'abre una web externa'
  },

  // ---------- INSTAGRAM (solicitud de reserva) ----------
  // usuario: viene de local.instagram. «Abrir Instagram» es un enlace normal a https://www.instagram.com/{usuario}/
  // en otra pestaña: SOLO abre el perfil. Los enlaces de Instagram no dejan un mensaje escrito de forma fiable
  // (y la página nunca copia al portapapeles sin que se pulse «Copiar mensaje»).
  instagram: {
    usuario: LOCAL.instagram
  },

  // ---------- RESERVAS: bloque breve del inicio ----------
  reservas: {
    titulo: 'Reservas',
    bajada: 'Pide tu mesa en un minuto.',
    pasos: 'Personas, fecha y hora',
    nota: 'Solicita tu mesa por WhatsApp. El bar te confirma la disponibilidad.',
    cta: 'Reservar mesa'
  },

  // ---------- RESERVAS: asistente de reservar.html (personas → fecha → hora → solicitud) ----------
  reserva: {
    titulo: 'Reservar mesa',
    demostracion: 'Demostración: la solicitud se prepara aquí y la envías tú por WhatsApp',   // solo si instagram.usuario fuera null
    maxPersonas: 6,              // teselas 1..6 + «7 o más»
    horizonteDias: 90,           // hasta cuántos días hacia adelante se puede pedir
    // Días sin atención (0 = domingo … 6 = sábado): el bar atiende de martes a sábado (su Instagram, confirmado por Pablo 2026-10-24).
    // Domingo y lunes no se pueden elegir en el calendario. La hora de cierre sigue sin confirmarse.
    diasCerrados: [0, 1],
    // Horas de MUESTRA (no son los horarios del bar): se generan cada «cadaMin» minutos entre «desde» y «hasta».
    horas: { desde: '18:00', hasta: '22:30', cadaMin: 30, rotulo: 'Horarios de muestra desde las 18:00; el cierre y la disponibilidad los confirma el equipo' },
    horarioLocal: 'Horario del local: ' + LOCAL.horario.texto.toLowerCase() + ' (' + LOCAL.horario.fuente + '). ' + LOCAL.horario.cierre + '.',
    // Mensaje que se arma con lo elegido. {personas} = «4 personas», «1 persona» o «7 o más personas»;
    // {fecha} = «sábado 24 de octubre de 2026»; {hora} = «20:30».
    // {ocasion} y {comentario} llevan su propio salto de línea y quedan vacíos si no se completan.
    mensaje: 'Hola, quisiera reservar en Tirúa.\nNombre: {nombre}\nPersonas: {personas}\nFecha: {fecha}\nHora: {hora}{ocasion}{comentario}\n¿Me confirman disponibilidad?',
    etapas: { personas: 'Personas', fecha: 'Fecha', hora: 'Hora', datos: 'Tus datos' },
    pasoDe: 'Paso {n} de {total}: {nombre}',
    tituloPersonas: '¿Cuántas personas serán?',
    pistaAvance: 'Al elegir, se abre la siguiente pregunta. Con teclado, usa Continuar. Puedes cambiar cualquier respuesta tocándola.',
    grandeAviso: 'Para 7 o más personas, el bar lo coordina contigo a mano. Puedes seguir con la solicitud.',
    tituloFecha: 'Elige una fecha',
    leyenda: { seleccionado: 'Elegida', hoy: 'Hoy', no: 'No se puede elegir' },
    leyendaNota: 'Con raya diagonal: fecha pasada o fuera del rango (hasta {dias} días). Las demás se pueden pedir; el equipo confirma la disponibilidad.',
    leyendaNotaCierre: 'Con raya diagonal: fecha pasada, fuera del rango (hasta {dias} días) o día sin atención. Las demás se pueden pedir; el equipo confirma la disponibilidad.',
    mesAnterior: 'Mes anterior',
    mesSiguiente: 'Mes siguiente',
    tituloHora: '¿A qué hora?',
    horasNota: 'Hoy no se pueden elegir las horas que ya pasaron.',
    tituloDatos: '¿A nombre de quién?',
    etiquetaNombre: 'Nombre',
    ayudaNombre: 'Para que el bar sepa a quién confirmarle.',
    etiquetaOcasion: 'Ocasión (opcional)',
    ocasiones: ['Cumpleaños', 'Aniversario', 'Cita', 'Con amigos', 'Cena de trabajo', 'Otra'],
    etiquetaComentario: 'Comentarios o alergias (opcional)',
    ayudaComentario: 'Por ejemplo: una alergia, una silla para bebé o preferir la terraza.',
    tituloVista: 'Tu solicitud',
    huecos: { nombre: 'tu nombre', personas: 'personas', fecha: 'fecha', hora: 'hora' },   // lo que aún falta se ve así en el mensaje: [fecha]
    faltaVista: 'Para enviarla falta: {lista}.',
    listoParaEnviar: 'Tu solicitud está lista. Envíala por WhatsApp.',
    avisoSolicitud: 'Esto es una solicitud, no una reserva confirmada. El bar confirmará la disponibilidad a mano, por WhatsApp.',
    enviarWhatsApp: 'Enviar por WhatsApp',
    whatsappNota: 'Abre WhatsApp en el chat de Tirúa con tu solicitud ya escrita: solo te queda enviarla.',
    whatsappNotaSinNumero: 'Abre WhatsApp con tu solicitud ya escrita. El número del bar aún no está cargado: elige el chat del bar y envía.',
    whatsappEtiqueta: 'Enviar la solicitud por WhatsApp, se abre en otra pestaña',
    cambiar: 'Cambiar',
    sinElegir: 'sin elegir',
    copiar: 'Copiar mensaje',
    copiado: 'Mensaje copiado. Pégalo en el chat del bar.',
    copiarFallo: 'No pudimos copiar automáticamente. El mensaje quedó seleccionado: cópialo a mano.',
    continuar: 'Continuar',
    elegidoAvance: '{valor}. Abriendo la siguiente pregunta.',
    elegidoManual: '{valor}. Pulsa Continuar cuando estés listo.',
    horaPasada: 'La hora elegida ya pasó hoy. Elige otra.'
  },

  // ---------- MAPA ----------
  // url: enlace de «Cómo llegar» (enlace normal, otra pestaña; no se incrusta ningún mapa).
  mapa: {
    titulo: 'Mapa',
    bajada: 'Estamos en Pirque, Región Metropolitana.',
    rotulo: 'Pirque · RM',
    // Cinta que corre bajo el mapa: solo datos que ya son del local (dirección, rasgos de su Instagram).
    cinta: ['Pirque, Región Metropolitana', 'Terraza cerrada y calefaccionada', 'Pet friendly', 'Ramón Subercaseaux 455', 'Tu lugar de encuentro'],
    // Mapa de Google incrustado (sin clave, carga diferida). Si es null, solo queda el marco con el enlace «Cómo llegar».
    embed: 'https://www.google.com/maps?q=Ram%C3%B3n+Subercaseaux+455+Pirque&hl=es&z=16&output=embed',
    marcoTexto: 'Ramón Subercaseaux 455, Pirque',
    sedes: [
      {
        nombre: 'Tirúa Bar-Restorán',
        direccion: LOCAL.direccion,
        horario: LOCAL.horario.texto,
        horarioNota: LOCAL.horario.fuente + '. ' + LOCAL.horario.cierre + '.',
        ambiente: LOCAL.rasgos.join(' · '),
        // Días de atención que figuran en su Instagram (0 = domingo … 6 = sábado). Solo dibuja la tira de la semana.
        dias: [2, 3, 4, 5, 6],
        cta: 'Cómo llegar',
        url: LOCAL.mapa,
        notaCta: 'Se abre Google Maps en otra pestaña'
      }
    ]
  },

  // ---------- DELIVERY / PEDIDOS ----------
  // url: enlace normal a la plataforma de pedidos que el bar usa en su Instagram (otra pestaña).
  // El pedido no se hace dentro de este sitio y aquí no se informa cobertura ni zonas de reparto.
  delivery: {
    titulo: 'Delivery',
    texto: 'Pide por Justo, para tu puerta',
    detalle: 'Justo es la plataforma de pedidos del bar (el enlace de su Instagram). Zonas de reparto, costos y tiempos: por confirmar con el local.',
    cta: 'Pedir en la plataforma del bar',
    vistaTitulo: 'Así se ve la carta de pedidos',
    vistaNota: 'Vista previa con 8 bebestibles reales. Elegir uno abre la plataforma del bar.',
    url: LOCAL.pedidos,
    notaCta: 'Se abre una web externa en otra pestaña. El pedido no se hace dentro de este sitio.'
  },

  // ---------- PIE ----------
  // El enlace de Instagram sale de instagram.usuario.
  pie: {
    instagram: { texto: null, url: null, nota: 'no disponible' },   // texto null → «@usuario» desde instagram.usuario
    aviso: 'Sitio en construcción · carta parcial y fotos por confirmar'
  }
};
})();

