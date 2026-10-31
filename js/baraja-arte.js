/* Dirección visual aprobada: fotografía original + recorte vectorial no destructivo.
   Las máscaras SVG solo ocultan el fondo original en la carta; no se modifican los WebP.
   El atlas contiene únicamente paisajes pintados, nunca productos generados. */
(function () {
  'use strict';
  window.TIRUA_BARAJA_ARTE = {
    'beb-ramajito': {
      mascara: 'assets/baraja/recortes/beb-ramajito.svg',
      escena: 0, ancho: '108cqw', arriba: '-23cqw', centro: '50%'
    },
    'beb-playa-tirua': {
      mascara: 'assets/baraja/recortes/beb-playa-tirua.svg',
      escena: 1, ancho: '92cqw', arriba: '0cqw', centro: '50%'
    },
    'beb-sol-de-fuego': {
      mascara: 'assets/baraja/recortes/beb-sol-de-fuego.svg',
      escena: 2, ancho: '145cqw', arriba: '-57cqw', centro: '48%'
    },
    'beb-botanical-collins': {
      mascara: 'assets/baraja/recortes/beb-botanical-collins.svg',
      escena: 3, ancho: '130cqw', arriba: '-50cqw', centro: '50%'
    },
    'beb-jackie-jr': {
      mascara: 'assets/baraja/recortes/beb-jackie-jr.svg',
      escena: 4, ancho: '135cqw', arriba: '-58cqw', centro: '55%'
    },
    'beb-espresso-vainilla': {
      mascara: 'assets/baraja/recortes/beb-espresso-vainilla.svg',
      escena: 5, ancho: '105cqw', arriba: '-20cqw', centro: '47%'
    },
    'beb-ramazzotti-spritz': {
      mascara: 'assets/baraja/recortes/beb-ramazzotti-spritz.svg',
      escena: 6, ancho: '115cqw', arriba: '-27cqw', centro: '52%'
    },
    'beb-green-drinks': {
      mascara: 'assets/baraja/recortes/beb-green-drinks.svg',
      escena: 7, ancho: '110cqw', arriba: '0cqw', centro: '47%'
    }
  };
})();
