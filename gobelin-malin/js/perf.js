// Goblin Malin — faire tourner le jeu sans chauffer et sans saccades. Tout est réglable dans GMPerf.
//   1) Pas plus de 60 images par seconde. Sur un écran rapide (120 Hz et plus, comme un MacBook Pro), le jeu redessinait tout
//      deux fois plus souvent que nécessaire : deux fois plus de calcul pour rien. Toutes les animations du jeu passent par ici
//      (requestAnimationFrame), l'écran titre compris.
//   2) Si l'ordinateur n'arrive pas à suivre (des images sautées pendant une dizaine de secondes), le jeu s'allège d'un palier :
//        palier 1 : dessin à 80 % des points, gobelins du clan redessinés 20 fois par seconde ;
//        palier 2 : dessin à 65 % des points, gobelins redessinés 12 fois par seconde.
//      Les gobelins sont dessinés trait par trait (une centaine de formes chacun) : c'est presque la moitié du temps de dessin.
//      Allégé, chacun est gardé en image ; entre deux dessins on recolle l'image là où il est rendu (il glisse toujours aussi
//      doucement, seule son animation est moins fine). Sur un ordinateur qui suit, rien de tout ça : dessin complet.
//      Le palier est retenu pour la prochaine fois ; si tout roule pendant une quarantaine de secondes, le jeu retente un cran plus fin (une fois).
//      index.html#finesse remet le dessin complet ; index.html#palier=2 force un palier.
// Ce fichier est chargé en tout premier. Pour comparer : index.html#perf-non (tout est coupé).
'use strict';
(function () {
  const NON = /perf-non/.test(location.hash), CLE = 'goblin-malin-finesse';
  const Pf = window.GMPerf = { IMAGES: 60, PALIERS: [{ res: 1, gob: NON ? 0 : 24 }, { res: 0.8, gob: 16 }, { res: 0.65, gob: 12 }], LENT: 17.9, MARGE: 1.07, FENETRE: 150, IMMOBILE: 10, res: 1, gob: NON ? 0 : 24, palier: 0, plafond: !NON, auto: !NON, mesure: null };
  // Le nombre de points dessinés : un écran très fin (iPad, MacBook) demande quatre fois plus de points qu'un écran ordinaire, pour
  // un dessin à peine plus net. On plafonne le total : c'est le plus gros gain sur une tablette. PIXELS se règle ici.
  const TACTILE = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  Pf.PIXELS = NON ? 1e9 : TACTILE ? 2.2e6 : 3.2e6;
  Pf.dpr = (w, h, max) => Math.max(1, Math.min(max || 2, window.devicePixelRatio || 1, Math.sqrt(Pf.PIXELS / Math.max(1, w * h))));
  const pose = p => { Pf.palier = Math.max(0, Math.min(Pf.PALIERS.length - 1, p | 0)); Pf.res = Pf.PALIERS[Pf.palier].res; Pf.gob = Pf.PALIERS[Pf.palier].gob; };
  try { if (/finesse/.test(location.hash)) localStorage.removeItem(CLE); const f = /palier=(\d)/.exec(location.hash), p = f ? +f[1] : +localStorage.getItem(CLE); if (!NON && p > 0) pose(p); if (f) Pf.auto = false; } catch (e) { /* rien */ }

  // ---------- 1. le plafond d'images, et la mesure du rythme ----------
  const raf0 = window.requestAnimationFrame.bind(window), caf0 = window.cancelAnimationFrame.bind(window);
  let file = new Map(), no = 0, parti = false, dernier = 0, somme = 0, n = 0, meilleur = 1e9, lents = 0, repos = 0, bons = 0, remonte = false;
  function pompe(ts) {
    parti = false;
    if (Pf.plafond && ts - dernier < 1000 / Pf.IMAGES - 4.2) { parti = true; raf0(pompe); return; } // trop tôt : on attend l'image suivante de l'écran
    const ecart = ts - dernier; dernier = ts;
    const l = file; file = new Map(); for (const cb of l.values()) { try { cb(ts); } catch (e) { setTimeout(() => { throw e; }); } }
    if (ecart < 250 && !document.hidden) { somme += ecart; if (++n >= Pf.FENETRE) { rythme(somme / n); somme = 0; n = 0; } } else { somme = 0; n = 0; }
  }
  window.requestAnimationFrame = function (cb) { const id = ++no; file.set(id, cb); if (!parti) { parti = true; raf0(pompe); } return id; };
  window.cancelAnimationFrame = function (id) { if (!file.delete(id)) caf0(id); };

  // ---------- 2. le jeu s'allège tout seul, vers le bas seulement ----------
  function rythme(moy) {
    Pf.mesure = moy; if (moy < meilleur) meilleur = moy; // le meilleur rythme vu : celui de l'écran (un écran à 30 ou 50 images par seconde n'est pas un ordinateur lent)
    const CG = window.CG; if (!Pf.auto || !CG || !CG.running || (CG.UI && CG.UI.modal) || repos-- > 0) { lents = 0; return; }
    if (moy > Pf.LENT && moy > meilleur * Pf.MARGE) { bons = 0; if (++lents >= 2 && Pf.palier < Pf.PALIERS.length - 1) { Pf.regler(Pf.palier + 1); lents = 0; repos = 3; } }
    else { lents = 0; if (Pf.palier > 0 && !remonte && moy < meilleur * 1.03 && ++bons >= 15) { remonte = true; bons = 0; repos = 3; Pf.regler(Pf.palier - 1); } } // tout roule depuis un bon moment : on retente un cran plus fin, une seule fois par partie
  }
  Pf.regler = function (p) {
    pose(p);
    try { if (Pf.palier) localStorage.setItem(CLE, String(Pf.palier)); else localStorage.removeItem(CLE); } catch (e) { /* rien */ }
    window.dispatchEvent(new Event('resize')); // main.js refait son canevas à la nouvelle finesse
  };

  // ---------- les gobelins gardés en image (paliers 1 et 2 seulement) ----------
  window.addEventListener('load', () => {
    const CG = window.CG, Art = CG && CG.Art, cv = document.getElementById('game'); if (!Art || !Art.goblin || !cv) return;
    const ctx = cv.getContext('2d'), g0 = Art.goblin, garde = new WeakMap(), GA = 80, HA = 120, L = 160, H = 160; // la boîte autour du gobelin : 80 de chaque côté, 120 au-dessus des pieds, 40 dessous
    Pf.dessins = 0; Pf.collages = 0;
    Art.goblin = function (g, o) {
      const e = o && o.ent;
      // on ne garde en image que le cas ordinaire : un gobelin du clan, dans le jeu, sans effet spécial. Tout le reste est dessiné comme avant.
      if (!Pf.gob || !e || g !== ctx || o.alpha !== undefined || g.globalAlpha !== 1 || o.atk > 0.02 || e.cls === 'loup' || e.bigT > 0 || o.carry) return g0.apply(this, arguments);
      const m = g.getTransform(); if (m.b || m.c || m.a !== m.d || m.a <= 0) return g0.apply(this, arguments);
      const sc = m.a, w = Math.ceil(L * sc), h = Math.ceil(H * sc), now = performance.now(), cle = (o.pose || '') + (o.moving ? 'm' : 's') + (o.face < 0 ? 'g' : 'd') + (o.tool || '') + (o.job || '');
      let c = garde.get(e);
      if (!c) { c = { cv: document.createElement('canvas'), t: -1e9, cle: null, sc: 0 }; e._pfDec = Math.random() * 40; /* pas tous redessinés à la même image */ c.gx = c.cv.getContext('2d'); garde.set(e, c); }
      if (c.sc !== sc || c.cle !== cle || now - c.t >= 1000 / (o.moving ? Pf.gob : Math.min(Pf.gob, Pf.IMMOBILE)) - 3) { /* celui qui ne bouge pas est redessiné moins souvent */
        if (c.cv.width !== w || c.cv.height !== h) { c.cv.width = w; c.cv.height = h; }
        const x = c.gx; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h); x.setTransform(sc, 0, 0, sc, (GA - o.x) * sc, (HA - o.y) * sc);
        try { g0.call(this, x, o); } catch (er) { garde.delete(e); return g0.apply(this, arguments); }
        c.t = c.cle === null ? now - (e._pfDec || 0) : now; c.cle = cle; c.sc = sc; Pf.dessins++;
      } else if (e._px !== undefined) { e._px = e.x; e._py = e.y; } // (le dessin retient où était le gobelin pour savoir de quel côté il regarde)
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(c.cv, Math.round((o.x - GA) * sc + m.e), Math.round((o.y - HA) * sc + m.f)); g.setTransform(m); Pf.collages++;
    };
  });
})();
