// Reconnaissance des tracés de sorts.
// Un tracé (liste de points écran) est rééchantillonné, recentré, mis à l'échelle,
// puis comparé point par point à chaque gabarit. Fonctionne dans le navigateur et dans Node (tests).
(function (root) {
  'use strict';
  var api = { why: '' };
  var N = 48;
  var ANGLES = [-0.42, -0.21, 0, 0.21, 0.42]; // tolérance d'inclinaison (±24°)
  var ACCEPT = 0.2, PERFECT = 0.085, GOOD = 0.14;
  var LINE_MAX_ANGLE = 68; // un trait se trace dans n'importe quel sens, sauf (presque) à la verticale : au-delà de 68° de l'horizontale, ce n'est plus Scintilla

  function P(x, y) { return { x: x, y: y }; }
  // Arc d'ellipse de centre (cx, cy), de l'angle a0 à l'angle a1 en degrés (0° = à droite, 90° = en bas : l'écran a son y vers le bas).
  function arc(cx, cy, rx, ry, a0, a1, n) {
    var a = []; n = n || 24;
    for (var i = 0; i <= n; i++) { var t = (a0 + (a1 - a0) * i / n) * Math.PI / 180; a.push(P(cx + rx * Math.cos(t), cy + ry * Math.sin(t))); }
    return a;
  }
  function curve(n, fn) { var a = []; for (var i = 0; i <= n; i++) a.push(fn(i / n)); return a; }
  function circle() { return arc(0.5, 0.5, 0.5, 0.5, -90, 270, 40); }
  function spiral() { return curve(60, function (s) { var t = s * Math.PI * 4, r = 0.5 * s; return P(0.5 + r * Math.cos(t), 0.5 + r * Math.sin(t)); }); } // du centre vers l'extérieur, deux tours
  function flipY(pts) { return pts.map(function (p) { return P(p.x, 1 - p.y); }); }
  var ARROW = [P(0.15, 0.42), P(0.5, 0), P(0.85, 0.42), P(0.5, 0), P(0.5, 1)]; // la pointe comme un toit, on revient au sommet, puis le manche
  function star() { var a = []; for (var i = 0; i <= 5; i++) { var t = (-90 + i * 144) * Math.PI / 180; a.push(P(0.5 + 0.5 * Math.cos(t), 0.5 + 0.5 * Math.sin(t))); } return a; }
  function heart() { // de la pointe du bas : on monte à gauche, premier arrondi, creux du milieu, second arrondi, retour à la pointe
    return [P(0.5, 1), P(0.04, 0.42)].concat(arc(0.27, 0.27, 0.27, 0.27, 150, 330, 10), [P(0.5, 0.36)], arc(0.73, 0.27, 0.27, 0.27, 210, 390, 10), [P(0.96, 0.42), P(0.5, 1)]);
  }

  // Formes de base, dans un carré 0..1 (y vers le bas). Pour ajouter un sort : ajouter une forme ici.
  // closed : forme fermée (on peut la commencer n'importe où) · mirror : accepte aussi son image miroir
  // ease : indulgence pour les formes difficiles (la distance mesurée est multipliée par ce nombre)
  // iq : rondeur attendue [min, max] (1 = cercle parfait, 0,79 = carré, 0,6 = triangle) — départage le cercle, le carré et le triangle
  // turns : nombre d'orientations acceptées (une spirale peut partir dans n'importe quelle direction).
  var GLYPHS = {
    line: { closed: false, pts: [P(0, 0), P(1, 0)] },
    zigzag: { closed: false, pts: [P(0, 0), P(1, 0), P(0, 1), P(1, 1)] },                        // un Z (son miroir est le S de Tornado)
    triangle: { closed: true, iq: [0.5, 0.78], pts: [P(0.5, 0), P(1, 0.88), P(0, 0.88), P(0.5, 0)] },
    vee: { closed: false, pts: [P(0, 0), P(0.5, 1), P(1, 0)] },
    circle: { closed: true, iq: [0.92, 1.2], pts: circle() },
    ell: { closed: false, pts: [P(0, 0), P(0, 1), P(0.72, 1)] },
    roof: { closed: false, pts: [P(0, 1), P(0.5, 0), P(1, 1)] },
    veecross: { closed: false, pts: [P(0.42, 0), P(0.66, 1), P(1, 0.05), P(0, 1)] },           // un V, puis un trait qui retraverse sa première branche
    phi: { closed: false, mirror: true, pts: circle().concat([P(0.5, 1.55)]) },                 // un cercle, puis une barre qui le traverse et dépasse en bas
    enn: { closed: false, pts: [P(0, 1), P(0, 0), P(1, 1), P(1, 0)] },                          // un N
    wave: { closed: false, pts: [P(0, 0), P(0.25, 0.75), P(0.5, 0), P(0.75, 0.75), P(1, 0)] }, // un W
    spiral: { closed: false, mirror: true, turns: 8, pts: spiral() },
    cup: { closed: false, pts: [P(0, 0), P(0, 1), P(1, 1), P(1, 0)] },                          // un U carré : un L, puis on remonte
    square: { closed: true, iq: [0.78, 0.92], pts: [P(0, 0), P(1, 0), P(1, 1), P(0, 1), P(0, 0)] },
    crescent: { closed: false, pts: arc(0.5, 0.5, 0.5, 0.5, -55, -305, 30) },                   // un C, comme un croissant de lune
    arrow: { closed: false, pts: ARROW },                                                       // le manche de bas en haut, puis la pointe en triangle
    arrowdown: { closed: false, pts: flipY(ARROW) },
    ess: { closed: false, pts: arc(0.5, 0.25, 0.32, 0.25, -20, -270, 20).concat(arc(0.5, 0.75, 0.32, 0.25, -90, 160, 20).slice(1)) },
    infinity: { closed: true, pts: curve(48, function (s) { var t = s * Math.PI * 2; return P(0.5 + 0.5 * Math.sin(t), 0.5 + 0.25 * Math.sin(2 * t)); }) },
    hourglass: { closed: true, ease: 0.85, pts: [P(0, 0), P(1, 0), P(0, 1), P(1, 1), P(0, 0)] },            // un Z, puis on remonte en biais jusqu'au départ
    emm: { closed: false, pts: [P(0, 0.75), P(0.25, 0), P(0.5, 0.75), P(0.75, 0), P(1, 0.75)] },
    sigma: { closed: false, pts: [P(1, 0), P(0, 0), P(0.55, 0.5), P(0, 1), P(1, 1)] },
    star: { closed: true, ease: 0.8, pts: star() },                                                        // l'étoile à cinq branches, d'un seul trait
    three: { closed: false, pts: arc(0.3, 0.26, 0.5, 0.24, -110, 90, 16).concat(arc(0.3, 0.74, 0.5, 0.24, -90, 110, 16).slice(1)) },
    gamma: { closed: false, pts: [P(0, 1), P(0, 0), P(0.72, 0)] },                              // un L à l'envers
    crenel: { closed: false, pts: [P(0, 1), P(0, 0), P(0.33, 0), P(0.33, 0.55), P(0.67, 0.55), P(0.67, 0), P(1, 0), P(1, 1)] }, // les créneaux d'un mur
    hook: { closed: false, pts: [P(0.75, 0)].concat(arc(0.5, 0.78, 0.25, 0.22, 0, 180, 16)) },  // un J
    crown: { closed: true, ease: 0.85, iq: [0.3, 0.7], pts: [P(0, 0), P(0, 1), P(1, 1), P(1, 0), P(0.75, 0.5), P(0.5, 0), P(0.25, 0.5), P(0, 0)] },
    zigzag3: { closed: false, pts: [P(0, 0), P(1, 0), P(0, 0.5), P(1, 0.5), P(0, 1), P(1, 1)] }, // deux Z l'un sous l'autre
    heart: { closed: true, iq: [0.5, 0.78], pts: heart() },
    pulse: { closed: false, pts: [P(0, 0.5), P(0.38, 0.5), P(0.46, 0.1), P(0.54, 0.9), P(0.62, 0.5), P(1, 0.5)] }, // un battement de cœur
    root: { closed: false, pts: [P(0, 0.55), P(0.18, 1), P(0.42, 0), P(1, 0)] },                // le signe racine
    pee: { closed: false, pts: [P(0, 1)].concat(arc(0, 0.28, 0.6, 0.28, -90, 90, 16)) },        // un P
    loop: { closed: false, pts: curve(40, function (s) { var t = s * Math.PI * 2; return P(s + 0.3 * Math.sin(t), 0.5 + 0.5 * Math.cos(t)); }) },   // une boucle, comme un l en lettres attachées
    coil: { closed: false, pts: curve(72, function (s) { var t = s * Math.PI * 6; return P(s + 0.11 * Math.sin(t), 0.2 + 0.2 * Math.cos(t)); }) }, // trois boucles de suite, comme un ressort
    gt: { closed: false, pts: [P(0, 0), P(1, 0.5), P(0, 1)] },
    arch: { closed: false, pts: [P(0, 1), P(0, 0), P(1, 0), P(1, 1)] },                         // une arche carrée
    fish: { closed: false, pts: [P(1, 0.1), P(0.45, 0.72), P(0.2, 0.85), P(0.02, 0.68), P(0, 0.5), P(0.02, 0.32), P(0.2, 0.15), P(0.45, 0.28), P(1, 0.9)] },
    stairs: { closed: false, pts: [P(0, 0), P(0, 0.5), P(0.5, 0.5), P(0.5, 1), P(1, 1)] },                  // deux marches d'escalier
    saw: { closed: false, pts: [P(0, 1), P(0, 0), P(0.5, 1), P(0.5, 0), P(1, 1), P(1, 0)] },   // des dents de scie : deux N collés
    rbracket: { closed: false, pts: [P(0, 0), P(1, 0), P(1, 1), P(0, 1)] },                     // un crochet fermant : ]
    balloon: { closed: false, pts: circle().concat([P(1.35, 0)]) },                             // un cercle, puis une queue qui file vers la droite
    corner: { closed: false, pts: [P(0.28, 0), P(1, 0), P(1, 1)] },                              // un coin : à droite, puis en bas
    // sorts ajoutés ensuite : Vortex, Preparus, Flammurus, Foudrus, Myopia, Stabilis, Conjura, Atchoum
    trefoil: { closed: true, ease: 0.85, pts: curve(72, function (s) { var t = s * Math.PI, r = 0.5 * Math.sin(3 * t); return P(0.5 + r * Math.cos(t), 0.5 + r * Math.sin(t)); }) },
    tee: { closed: false, pts: [P(0, 0), P(1, 0), P(0.5, 0), P(0.5, 1)] },                                   // un T : la barre, on revient au milieu, on descend
    flames3: { closed: false, pts: [P(0, 1), P(0.17, 0), P(0.33, 1), P(0.5, 0), P(0.67, 1), P(0.83, 0), P(1, 1)] }, // trois flammes : ΛΛΛ
    bolt: { closed: false, pts: [P(0.7, 0), P(0.1, 0.55), P(0.9, 0.45), P(0.3, 1)] },                          // un éclair
    ex: { closed: false, pts: [P(0, 0), P(1, 1), P(1, 0), P(0, 1)] },                           // un X d'un seul geste : en biais, on remonte, en biais
    aitch: { closed: false, pts: [P(0, 0), P(0, 1), P(0, 0.5), P(1, 0.5), P(1, 0), P(1, 1)] },   // un H
    hat: { closed: false, pts: [P(0, 1), P(0.25, 1), P(0.25, 0), P(0.75, 0), P(0.75, 1), P(1, 1)] }, // un chapeau haut-de-forme
    aye: { closed: false, pts: [P(0, 1), P(0.5, 0), P(1, 1), P(0.75, 0.5), P(0.25, 0.5)] },          // un A : le toit, puis la barre
    // ── les signes des sorts ajoutés le 6 novembre 2026 ──
    why: { closed: false, pts: [P(0, 0), P(0.5, 0.5), P(1, 0), P(0.5, 0.5), P(0.5, 1)] },             // un Y : une branche, l'autre, puis le pied
    meteor: { closed: false, pts: arc(0.25, 0.3, 0.25, 0.25, 0, 360, 24).concat([P(0.62, 0.42), P(0.74, 0.28), P(0.84, 0.72), P(0.93, 0.5), P(1, 1)]) }, // une boucle, puis une queue qui zigzague vers le bas
    asterisk: { closed: false, pts: [P(0.5, 0), P(0.5, 1), P(0.5, 0.5), P(0, 0.25), P(1, 0.75), P(0.5, 0.5), P(0, 0.75), P(1, 0.25)] }, // un flocon : la barre, puis deux diagonales par le centre
    lt: { closed: false, pts: [P(1, 0), P(0, 0.5), P(1, 1)] },                                       // un <
    stairsup: { closed: false, pts: [P(0, 1), P(0, 0.5), P(0.5, 0.5), P(0.5, 0), P(1, 0)] },          // deux marches qui montent
    two: { closed: false, pts: [P(0, 0.22), P(0.5, 0), P(1, 0.25), P(0, 1), P(1, 1)] },               // un 2
    kay: { closed: false, pts: [P(0, 0), P(0, 1), P(0, 0.5), P(1, 0), P(0, 0.5), P(1, 1)] },          // un K
    four: { closed: false, pts: [P(0.7, 0), P(0, 0.65), P(1, 0.65), P(0.7, 0.65), P(0.7, 1)] },       // un 4 d'un seul trait
    cross: { closed: false, pts: [P(0.5, 0), P(0.5, 1), P(0.5, 0.5), P(0, 0.5), P(1, 0.5)] },         // une croix : la barre debout, retour au centre, la barre couchée
    arrowright: { closed: false, pts: [P(0, 0.5), P(1, 0.5), P(0.68, 0.15), P(1, 0.5), P(0.68, 0.85)] }, // une flèche vers la droite : le manche, puis la pointe
    arrowleft: { closed: false, pts: [P(1, 0.5), P(0, 0.5), P(0.32, 0.15), P(0, 0.5), P(0.32, 0.85)] },  // une flèche vers la gauche
    check: { closed: false, pts: [P(0, 0.6), P(0.35, 1), P(1, 0)] },                                  // un crochet ✓
    perp: { closed: false, pts: [P(0, 1), P(1, 1), P(0.5, 1), P(0.5, 0)] },                            // un T à l'envers : la base, retour au milieu, la barre qui monte
    step: { closed: false, pts: [P(0, 0), P(0.5, 0), P(0.5, 1), P(1, 1)] },                            // une marche : à droite, en bas, à droite
    psi: { closed: false, pts: [P(0, 0), P(0.08, 0.6), P(0.5, 0.72), P(0.92, 0.6), P(1, 0), P(0.5, 0.72), P(0.5, 1)] }  // un psi : la coupe, puis le pied
  };

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function pathLength(pts) { var d = 0; for (var i = 1; i < pts.length; i++) d += dist(pts[i - 1], pts[i]); return d; }
  function resample(src, n) {
    var pts = src.map(function (p) { return P(p.x, p.y); });
    var I = pathLength(pts) / (n - 1), D = 0, out = [P(pts[0].x, pts[0].y)];
    if (I <= 0) { while (out.length < n) out.push(P(pts[0].x, pts[0].y)); return out; }
    for (var i = 1; i < pts.length; i++) {
      var d = dist(pts[i - 1], pts[i]);
      if (D + d >= I && d > 0) {
        var t = (I - D) / d, q = P(pts[i - 1].x + t * (pts[i].x - pts[i - 1].x), pts[i - 1].y + t * (pts[i].y - pts[i - 1].y));
        out.push(q); pts.splice(i, 0, q); D = 0;
      } else D += d;
    }
    while (out.length < n) out.push(P(pts[pts.length - 1].x, pts[pts.length - 1].y));
    out.length = n;
    return out;
  }
  function bbox(pts) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(function (p) { if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  // Recentre sur la boîte englobante et met à l'échelle uniformément (un trait reste un trait).
  function normalize(pts) {
    var b = bbox(pts), s = Math.max(b.w, b.h) || 1, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    return pts.map(function (p) { return P((p.x - cx) / s, (p.y - cy) / s); });
  }
  function rotate(pts, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return pts.map(function (p) { return P(p.x * c - p.y * s, p.x * s + p.y * c); });
  }
  // Rondeur d'un tracé refermé : 4π × aire / périmètre² (quotient isopérimétrique). Un point sur deux : le tremblement de la main compte moins.
  function roundness(pts) {
    var a = 0, per = 0, n = pts.length;
    for (var i = 0; i < n; i += 2) { var p = pts[i], q = pts[(i + 2) % n]; a += p.x * q.y - q.x * p.y; per += dist(p, q); }
    return per > 0 ? 2 * Math.PI * Math.abs(a) / (per * per) : 0;
  }
  function avgDist(a, b) { var d = 0; for (var i = 0; i < a.length; i++) d += Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y); return d / a.length; }

  // Variantes de chaque gabarit : les deux sens du tracé, et n'importe quel point de départ pour les formes fermées.
  var TEMPLATES = [];
  function add(name, closed, pts) { TEMPLATES.push({ name: name, closed: closed, iq: GLYPHS[name].iq, ease: GLYPHS[name].ease || 1, pts: normalize(resample(pts, N)) }); }
  Object.keys(GLYPHS).forEach(function (name) {
    var gl = GLYPHS[name], shapes = [gl.pts];
    if (gl.mirror) shapes.push(gl.pts.map(function (p) { return P(1 - p.x, p.y); }));
    if (gl.turns) shapes.slice().forEach(function (sh) {
      for (var k = 1; k < gl.turns; k++) { var c = Math.cos(k / gl.turns * Math.PI * 2), sn = Math.sin(k / gl.turns * Math.PI * 2); shapes.push(sh.map(function (p) { return P(0.5 + (p.x - 0.5) * c - (p.y - 0.5) * sn, 0.5 + (p.x - 0.5) * sn + (p.y - 0.5) * c); })); }
    });
    shapes.forEach(function (shape) {
      var base = resample(shape, N);
      if (!gl.closed) { add(name, false, base); add(name, false, base.slice().reverse()); return; }
      var loop = base.slice(0, N - 1);
      for (var k = 0; k < N - 1; k += 3) {
        var r = loop.slice(k).concat(loop.slice(0, k)); r.push(r[0]);
        add(name, true, r); add(name, true, r.slice().reverse());
      }
    });
  });

  var LINE = normalize(resample(GLYPHS.line.pts, N));
  // Angle d'un tracé par rapport à l'horizontale, en degrés, entre -90 et 90 (positif : il descend vers la droite).
  function slope(raw) {
    var dx = raw[raw.length - 1].x - raw[0].x, dy = raw[raw.length - 1].y - raw[0].y;
    if (dx < 0) { dx = -dx; dy = -dy; }
    return Math.atan2(dy, dx) * 180 / Math.PI;
  }
  // Retourne { id, dist, quality } ou null si le tracé ne ressemble à aucun sort ; api.why dit alors pourquoi :
  // 'short' (trop petit), 'vertical' (un trait trop vertical) ou 'unknown'.
  // opts.min : taille minimale d'un tracé, en pixels · opts.minLine : longueur minimale d'un trait (Scintilla)
  // opts.only : liste des formes possibles (les sorts de la ceinture) — les autres sont ignorées.
  function recognize(raw, opts) {
    opts = opts || {}; api.why = 'unknown';
    var min = opts.min || 45;
    if (!raw || raw.length < 6) { api.why = 'short'; return null; }
    var b = bbox(raw), plen = pathLength(raw), chord = dist(raw[0], raw[raw.length - 1]);
    if (plen < 60 || Math.max(b.w, b.h) < min) { api.why = 'short'; return null; }
    var cand = normalize(resample(raw, N));
    var gap = dist(cand[0], cand[N - 1]);
    var rots = ANGLES.map(function (a) { return a ? normalize(rotate(cand, a)) : cand; });
    var best = {}, only = opts.only, iq = roundness(cand);
    TEMPLATES.forEach(function (t) {
      if (only && only.indexOf(t.name) < 0) return;
      var pen = t.closed ? (gap > 0.62 ? 0.12 : gap > 0.45 ? 0.05 : 0) : (gap < 0.25 ? 0.12 : 0);
      if (t.iq) pen += 2.5 * Math.max(0, t.iq[0] - iq, iq - t.iq[1]);
      for (var r = 0; r < rots.length; r++) {
        var d = avgDist(rots[r], t.pts) * t.ease + pen;
        if (best[t.name] === undefined || d < best[t.name]) best[t.name] = d;
      }
    });
    // Le trait : on le compare redressé, donc peu importe son angle… sauf s'il est trop vertical.
    var straight = chord / plen > 0.8, steep = Math.abs(slope(raw)) > LINE_MAX_ANGLE, hasLine = !only || only.indexOf('line') >= 0;
    if (chord / plen > 0.9) best = {}; // un tracé bien droit ne peut être qu'un trait, jamais une autre forme
    if (best.line === undefined) best.line = Infinity;
    if (straight && !steep && hasLine) best.line = Math.min(best.line, avgDist(normalize(rotate(cand, -Math.atan2(raw[raw.length - 1].y - raw[0].y, raw[raw.length - 1].x - raw[0].x))), LINE));
    if (steep) best.line = Infinity;
    var names = Object.keys(best).sort(function (a, b2) { return best[a] - best[b2]; });
    var d0 = best[names[0]];
    if (d0 > ACCEPT) { if (straight && steep) api.why = 'vertical'; return null; }
    if (names[0] === 'line' && chord < (opts.minLine || min)) { api.why = 'short'; return null; }
    return { id: names[0], dist: d0, quality: d0 < PERFECT ? 'parfait' : d0 < GOOD ? 'bien' : 'passable' };
  }

  // Points d'une forme (centrée, taille 1) pour l'afficher ou la faire tracer par l'adversaire.
  function template(name, n) { return normalize(resample(GLYPHS[name].pts, n || N)); }

  api.GLYPHS = GLYPHS; api.recognize = recognize; api.template = template; api.resample = resample; api.normalize = normalize; api.slope = slope; api.roundness = roundness;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.DS = root.DS || {}; root.DS.gestures = api; }
})(typeof window !== 'undefined' ? window : globalThis);
