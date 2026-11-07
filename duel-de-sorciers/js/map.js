// La carte de l'école : image de fond (img/carte.jpg), chandelles flottantes et lueur des torches dessinées par-dessus,
// bulles flottantes au-dessus de chaque lieu. Toutes les positions sont en pixels de l'image d'origine (1376 × 768).
(function () {
  'use strict';
  var DS = window.DS, A = DS.art;
  var W0 = 1376, H0 = 768, TAU = Math.PI * 2;

  // zone : rectangle cliquable sur le bâtiment [x0, y0, x1, y1] · at : centre de la bulle · min : largeur minimale de la bulle
  // (les bulles recouvrent l'endroit où l'image d'origine avait une étiquette dessinée, effacée du fond).
  var PLACES = [
    { id: 'attaque', name: 'Cours d’attaque', zone: [5, 215, 240, 620], at: [172, 514], min: 160 },
    { id: 'protection', name: 'Cours de protection', zone: [222, 200, 458, 385], at: [387, 408], min: 160 },
    { id: 'effet', name: 'Cours d’effet', zone: [466, 185, 642, 378], at: [573, 402], min: 160 },
    { id: 'baguettes', name: 'Magasin de baguettes', zone: [756, 212, 906, 384], at: [829, 412], min: 180 },
    { id: 'magie', name: 'Magasin de magie', zone: [912, 205, 1042, 384], at: [1027, 412], min: 150 },
    { id: 'tournoi', name: 'Tournois', zone: [1052, 160, 1348, 398], at: [1202, 420], min: 100 },
    { id: 'talents', name: 'Miroir magique', zone: [388, 445, 590, 668], at: [509, 695], min: 166 },
    { id: 'grimoire', name: 'Mon grimoire', zone: [778, 452, 962, 668], at: [850, 698], min: 136 },
    { id: 'entrainement', name: 'Salle d’entraînement', zone: [968, 440, 1372, 690], at: [1181, 709], min: 210 },
    // le grand donjon au fond, et les deux tours d'angle (js/extras.js)
    { id: 'tour', name: 'Tour des Épreuves', zone: [598, 0, 782, 215], at: [690, 236], min: 150 },
    { id: 'alchimie', name: 'Laboratoire d’alchimie', zone: [222, 10, 322, 198], at: [272, 214], min: 150 },
    { id: 'familiers', name: 'La volière', zone: [1050, 8, 1150, 196], at: [1100, 212], min: 110 },
    { id: 'aventure', name: 'L’aventure', zone: [590, 688, 810, 768], at: [700, 740], min: 110 } // là où le tapis quitte l'école (js/aventure.js)
  ];
  // Chandelles : [x du centre, y du haut de la flamme, hauteur totale, largeur] — là où elles étaient dessinées sur l'image d'origine.
  var CANDLES = [
    [162.5, 37, 28, 7], [438, 15, 36, 8], [388.5, 60, 40, 9], [182, 118, 29, 6], [69.5, 143, 41, 9], [140, 168, 29, 6], [42.5, 187, 41, 9], [191, 207, 33, 8],
    [462.5, 55, 25, 5], [510, 33, 20, 4], [750, 52, 26, 6], [812.5, 35, 27, 5], [853, 25, 27, 6], [877, 61, 45, 10], [844.5, 142, 30, 7], [959, 22, 41, 8],
    [1191.5, 24, 23, 5], [1240.5, 92, 34, 7], [1330, 98, 29, 6], [1269.5, 408, 18, 4], [1325, 408, 17, 4], [1342, 380, 23, 5], [1351, 374, 24, 5], [1363, 369, 21, 4]
  ];
  // Torches déjà dessinées sur l'image : on ne fait que faire vaciller leur lueur. [x, y, rayon]
  var TORCHES = [[639, 238, 11], [736.5, 238, 11], [637.5, 316, 11], [736.5, 316, 11], [608.5, 556, 13], [767.5, 556, 13], [574.5, 545, 6], [482.5, 586, 6]];

  var root, cv, g, k = 1, dpr = 1, running = false, raf = 0, frameNo = 0, onPlace = null, subs = {};

  function init(opts) {
    onPlace = opts.onPlace;
    root = document.getElementById('map'); cv = document.getElementById('map-fx'); g = cv.getContext('2d');
    var box = document.getElementById('map-places'), html = '';
    PLACES.forEach(function (p, i) {
      var z = p.zone;
      html += '<button class="zone" tabindex="-1" aria-hidden="true" data-id="' + p.id + '" style="left:' + z[0] / W0 * 100 + '%;top:' + z[1] / H0 * 100 + '%;width:' + (z[2] - z[0]) / W0 * 100 + '%;height:' + (z[3] - z[1]) / H0 * 100 + '%"></button>' +
        '<button class="bubble" data-id="' + p.id + '" style="left:' + p.at[0] / W0 * 100 + '%;top:' + p.at[1] / H0 * 100 + '%;--t:' + (3.6 + (i * 0.37) % 1.3) + 's;--d:-' + (i * 0.83 % 3).toFixed(2) + 's">' +
        '<span class="in" style="min-width:' + p.min / 16 + 'em"><b>' + p.name + '</b><small></small><i class="badge hidden"></i></span></button>';
    });
    box.innerHTML = html;
    box.querySelectorAll('button').forEach(function (b) {
      var both = box.querySelectorAll('[data-id="' + b.dataset.id + '"]');
      b.addEventListener('click', function () { if (onPlace) onPlace(b.dataset.id); });
      b.addEventListener('pointerenter', function () { both.forEach(function (e) { e.classList.add('hot'); }); });
      b.addEventListener('pointerleave', function () { both.forEach(function (e) { e.classList.remove('hot'); }); });
    });
    window.addEventListener('resize', resize); resize();
  }
  // La carte garde ses proportions et tient en entier dans la fenêtre ; les textes suivent sa taille (font-size, puis em partout).
  function resize() {
    if (!root) return;
    k = Math.min(window.innerWidth / W0, window.innerHeight / H0); dpr = Math.min(2, window.devicePixelRatio || 1);
    root.style.width = W0 * k + 'px'; root.style.height = H0 * k + 'px'; root.style.fontSize = 16 * k + 'px';
    cv.width = Math.round(W0 * k * dpr); cv.height = Math.round(H0 * k * dpr);
    if (running) draw(performance.now() / 1000);
  }
  // Texte sous le nom d'un lieu, et pastille rouge éventuelle (nombre).
  function set(id, sub, badge) {
    var el = root.querySelector('.bubble[data-id="' + id + '"]'); if (!el) return;
    el.querySelector('small').textContent = sub || '';
    var b = el.querySelector('.badge'); b.textContent = badge || ''; b.classList.toggle('hidden', !badge);
    subs[id] = sub;
  }

  function candle(c, i, t) {
    var ph = i * 2.4, x = c[0] + Math.sin(t * 0.4 + ph) * 1.6, top = c[1] + Math.sin(t * 0.7 + ph * 1.3) * 4.5, h = c[2], w = c[3];
    var by = top + h * 0.36, bh = h * 0.64, r = Math.max(1.2, w * 0.2);
    var gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, '#fff6dd'); gr.addColorStop(0.55, '#f1dcae'); gr.addColorStop(1, '#c9a877');
    g.fillStyle = gr; g.strokeStyle = 'rgba(30,20,48,0.85)'; g.lineWidth = Math.max(0.7, w * 0.11);
    g.beginPath(); g.moveTo(x - w / 2, by + r); g.quadraticCurveTo(x - w / 2, by, x - w / 2 + r, by); g.lineTo(x + w / 2 - r, by); g.quadraticCurveTo(x + w / 2, by, x + w / 2, by + r);
    g.lineTo(x + w / 2, by + bh - r); g.quadraticCurveTo(x + w / 2, by + bh, x + w / 2 - r, by + bh); g.lineTo(x - w / 2 + r, by + bh); g.quadraticCurveTo(x - w / 2, by + bh, x - w / 2, by + bh - r); g.closePath();
    g.fill(); g.stroke();
    A.flame(g, x, by + 0.5, w * 0.62, t, ph);
  }
  function draw(t) {
    g.setTransform(k * dpr, 0, 0, k * dpr, 0, 0); g.clearRect(0, 0, W0, H0);
    g.save(); g.globalCompositeOperation = 'lighter';
    TORCHES.forEach(function (tc, i) {
      var fl = 0.8 + 0.2 * Math.sin(t * 9 + i * 1.7) + 0.1 * Math.sin(t * 21 + i * 3.1), R = tc[2] * 4.2 * fl;
      var gr = g.createRadialGradient(tc[0], tc[1], 0, tc[0], tc[1], R);
      gr.addColorStop(0, 'rgba(255,190,90,' + 0.34 * fl + ')'); gr.addColorStop(0.4, 'rgba(255,130,50,' + 0.13 * fl + ')'); gr.addColorStop(1, 'rgba(255,120,40,0)');
      g.fillStyle = gr; g.fillRect(tc[0] - R, tc[1] - R, R * 2, R * 2);
    });
    g.restore();
    CANDLES.forEach(function (c, i) { candle(c, i, t); });
  }
  function loop(ts) {
    if (!running) return;
    if (frameNo++ % 2 === 0) draw(ts / 1000); // 30 images par seconde suffisent pour des chandelles
    raf = requestAnimationFrame(loop);
  }
  function start() { if (running) return; running = true; resize(); raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  DS.map = { init: init, start: start, stop: stop, set: set, PLACES: PLACES };
})();
