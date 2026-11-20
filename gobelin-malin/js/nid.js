// Clan Gobelin — le nid d'araignées : des toiles partout, au sol et dans les arbres, et des grappes d'œufs.
// Et les piédestaux anciens : ils ne se montrent pas tous les jours.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, T = CG.TILE, TAU = Math.PI * 2, Ni = CG.Nid = { RAYON: 7 };
  let deco = null, sprites = null, cle = null, cleJ = -1;
  function toile(n, R, seed) { // une toile ronde, dessinée une fois pour toutes
    const c = document.createElement('canvas'); c.width = c.height = R * 2 + 4; const g = c.getContext('2d'), r = CG.makeRng(seed), a0 = r() * TAU; g.translate(R + 2, R + 2); g.lineCap = 'round';
    const ray = []; for (let i = 0; i < n; i++) ray.push(R * (0.78 + r() * 0.22));
    g.strokeStyle = 'rgba(240,244,255,0.62)'; g.lineWidth = 1.1;
    for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * ray[i], Math.sin(a) * ray[i]); g.stroke(); }
    g.strokeStyle = 'rgba(240,244,255,0.42)'; g.lineWidth = 0.8;
    for (let k = 1; k <= 4; k++) { const f = k / 4.4; g.beginPath(); for (let i = 0; i <= n; i++) { const a = a0 + (i % n) / n * TAU, a1 = a0 + ((i + 0.5) % n) / n * TAU, rr = ray[i % n] * f, rm = (ray[i % n] + ray[(i + 1) % n]) / 2 * f * 0.86; if (!i) g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); if (i < n) g.quadraticCurveTo(Math.cos(a1) * rm, Math.sin(a1) * rm, Math.cos(a0 + ((i + 1) % n) / n * TAU) * ray[(i + 1) % n] * f, Math.sin(a0 + ((i + 1) % n) / n * TAU) * ray[(i + 1) % n] * f); } g.stroke(); }
    return c;
  }
  function init() {
    const P = W.POI && W.POI.nid; if (!P || !W.tile) return false; deco = { sol: [], arbres: [], oeufs: [] };
    sprites = [toile(8, 30, 11), toile(7, 22, 23), toile(9, 38, 37), toile(6, 16, 51)];
    const S0 = CG.S, jour = S0 ? S0.day || 0 : 0; if (S0 && S0.nidJour !== jour) { S0.nidJour = jour; S0.nidBrule = {}; } // chaque matin les araignées retissent tout, ailleurs : ce qui a brûlé hier est oublié
    const r = CG.makeRng(8807 + P.x * 131 + P.y + jour * 7919), RR = Ni.RAYON;
    for (let dy = -RR; dy <= RR; dy++) for (let dx = -RR - 1; dx <= RR + 1; dx++) {
      const x = P.x + dx, y = P.y + dy, d = Math.hypot(dx * 0.9, dy); if (!W.inMap(x, y) || d > RR) continue; const prox = 1 - d / RR, a = r(), b = r(), c = r(), e = r();
      const px = x * T + T / 2 + (b - 0.5) * 22, py = y * T + T / 2 + (c - 0.5) * 22;
      if (W.walkTile(x, y)) {
        if (a < 0.3 + prox * 0.45) deco.sol.push({ x: px, y: py, s: Math.floor(e * 4), k: 0.8 + b * 0.5, rot: c * TAU });
        if (e > 0.9 - prox * 0.14) { const n = 2 + Math.floor(a * 5), l = []; for (let i = 0; i < n; i++) l.push({ dx: (r() - 0.5) * 24, dy: (r() - 0.5) * 12, s: 4.5 + r() * 3.5, ph: r() * 6 }); l.sort((u, v) => u.dy - v.dy); deco.oeufs.push({ x: px, y: py + 6, l }); }
      } else if (W.tile[W.idx(x, y)] === 1 && a < 0.45 + prox * 0.4) deco.arbres.push({ x: x * T + T / 2 + (b - 0.5) * 14, y: y * T + T / 2 - 16 - c * 14, s: Math.floor(e * 4), k: 0.7 + b * 0.4, rot: c * TAU, fil: 14 + e * 22 });
    }
    deco.sol.forEach((o, i) => { o.i = 's' + i; }); deco.arbres.forEach((o, i) => { o.i = 'a' + i; });
    const br = CG.S && CG.S.nidBrule; if (br) { deco.sol = deco.sol.filter(o => !br[o.i]); deco.arbres = deco.arbres.filter(o => !br[o.i]); } // celles que le feu a déjà mangées ne reviennent pas
    return true;
  }
  const pret = () => { const k = W.tile, j = CG.S ? CG.S.day || 0 : 0; if (cle !== k || cleJ !== j) { cle = k; cleJ = j; deco = null; } return deco || init(); }; // une nouvelle carte : on retisse tout
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    if (pret()) {
      for (const o of deco.sol) { if (!CG.onScreen(o.x, o.y)) continue; const sp = sprites[o.s], w = sp.width * o.k; g.save(); g.translate(o.x, o.y); g.scale(1, 0.62); g.rotate(o.rot); g.globalAlpha = 0.8; g.drawImage(sp, -w / 2, -w / 2, w, w); g.restore(); }
      for (const o of deco.oeufs) { if (!CG.onScreen(o.x, o.y)) continue;
        g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(o.x, o.y + 4, 18, 6, 0, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(240,244,255,0.5)'; g.lineWidth = 0.9; g.beginPath(); for (const q of o.l) { g.moveTo(o.x + q.dx, o.y + q.dy - q.s); g.lineTo(o.x + q.dx * 1.9, o.y + q.dy + 6); g.moveTo(o.x + q.dx, o.y + q.dy - q.s); g.lineTo(o.x - q.dx * 0.6, o.y + q.dy + 7); } g.stroke();
        if (o.jour === CG.S.day && o.et === 2) { // éclos aujourd'hui : il ne reste que des coquilles
          for (const q of o.l) { const ex = o.x + q.dx, ey = o.y + q.dy - q.s * 0.5; g.fillStyle = '#8f9486'; g.beginPath(); g.ellipse(ex, ey, q.s * 0.8, q.s * 0.55, 0, 0, Math.PI); g.fill(); g.fillStyle = '#d9dccb'; g.beginPath(); g.moveTo(ex - q.s * 0.8, ey); g.lineTo(ex - q.s * 0.45, ey - q.s * 0.5); g.lineTo(ex - q.s * 0.1, ey - q.s * 0.1); g.lineTo(ex + q.s * 0.3, ey - q.s * 0.55); g.lineTo(ex + q.s * 0.8, ey); g.closePath(); g.fill(); g.fillStyle = 'rgba(40,60,30,0.5)'; g.beginPath(); g.ellipse(ex, ey + q.s * 0.1, q.s * 0.5, q.s * 0.22, 0, 0, TAU); g.fill(); }
          continue;
        }
        const trem = o.trem > 0 ? o.trem : 0;
        for (const q of o.l) { const pu = 1 + Math.sin(t * 1.6 + q.ph) * 0.045 + (trem ? Math.sin(t * 40 + q.ph) * 0.12 : 0), ex = o.x + q.dx, ey = o.y + q.dy - q.s * 0.9;
          g.fillStyle = '#b9bfae'; g.beginPath(); g.ellipse(ex, ey, q.s * 0.82 * pu, q.s * pu, 0, 0, TAU); g.fill();
          g.fillStyle = '#e9ecdc'; g.beginPath(); g.ellipse(ex - q.s * 0.12, ey - q.s * 0.12, q.s * 0.66 * pu, q.s * 0.82 * pu, 0, 0, TAU); g.fill();
          g.fillStyle = 'rgba(70,90,60,0.35)'; g.beginPath(); g.ellipse(ex + q.s * 0.1, ey + q.s * 0.15, q.s * 0.3, q.s * 0.4, 0, 0, TAU); g.fill(); // l'ombre de ce qui grandit dedans
          g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(ex - q.s * 0.3, ey - q.s * 0.42, q.s * 0.16, q.s * 0.24, -0.5, 0, TAU); g.fill(); }
      }
    }
    return gr0.apply(this, arguments);
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); if (!pret()) return;
    for (const o of deco.arbres) { if (!CG.onScreen(o.x, o.y)) continue; const sp = sprites[o.s], w = sp.width * o.k, sw = Math.sin(t * 0.9 + o.rot * 3) * 0.03;
      g.save(); g.translate(o.x, o.y); g.strokeStyle = 'rgba(240,244,255,0.4)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(0, w * 0.3); g.lineTo(Math.sin(t * 1.1 + o.rot) * 2, w * 0.3 + o.fil); g.stroke();
      g.rotate(o.rot + sw); g.globalAlpha = 0.72; g.drawImage(sp, -w / 2, -w / 2, w, w); g.restore(); }
  };

  // ---------- les œufs : quand le chef s'approche, parfois ils éclosent... et parfois il ne se passe rien ----------
  Ni.ECLOSION = 0.35; Ni.PRES = 70;
  { let ot = 0; const upO = G.update; G.update = function (dt) {
      upO.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !deco || R.ko > 0) return; const p = S.player, P = W.POI.nid;
      if (Math.abs(p.x - P.x * T) > (Ni.RAYON + 4) * T || Math.abs(p.y - P.y * T) > (Ni.RAYON + 4) * T) return;
      for (const o of deco.oeufs) { // ceux qui vont éclore tremblent une seconde d'abord
        if (o.jour !== S.day) { o.jour = S.day; o.et = 0; o.trem = 0; }
        if (o.trem > 0) { o.trem -= dt; if (o.trem <= 0) eclore(o); }
      }
      ot -= dt; if (ot > 0) return; ot = 0.25;
      for (const o of deco.oeufs) { if (o.et || Math.hypot(o.x - p.x, o.y - p.y) > Ni.PRES) continue; if (Math.random() < Ni.ECLOSION) { o.et = 3; o.trem = 0.9; CG.sfx('warning'); G.text(o.x, o.y - 30, '❗', '#fff', true); } else o.et = 1; }
    };
    function eclore(o) {
      const R = CG.R, n = Math.min(o.l.length, 1 + Math.floor(Math.random() * 3)); o.et = 2; o.trem = 0;
      G.puff(o.x, o.y - 8, '#e9ecdc', 20, 130, 4); G.puff(o.x, o.y - 6, '#7a9a5a', 10, 90, 3); CG.sfx('hit');
      for (let i = 0; i < n; i++) { const e = G.spawnEnemy('araignee', o.x + (Math.random() - 0.5) * 30, o.y + (Math.random() - 0.5) * 18, { wild: true }); if (!e) continue; e.hp = e.maxhp = Math.max(4, Math.round(e.maxhp * 0.45)); e.dmg *= 0.5; e.petite = 0.5; e.r = Math.max(6, Math.round(e.r * 0.6)); e.seen = true; /* de toutes petites bébés araignées */ if (G.unstick) G.unstick(e, 8); }
      G.text(o.x, o.y - 44, '🕷️ Les œufs éclosent !', '#e9ecdc', true);
    }
  }

  { const ae0 = CG.Art.enemy; CG.Art.enemy = function (g, e, t) { if (!e.petite) return ae0.apply(this, arguments); g.save(); g.translate(e.x, e.y); g.scale(e.petite, e.petite); g.translate(-e.x, -e.y); ae0.apply(this, arguments); g.restore(); }; } // les bébés sorties des œufs : la même araignée, deux fois plus petite

  // ---------- marcher dans une toile au sol, ça colle : le chef avance au ralenti ----------
  Ni.LENT = 0.5;
  Ni.dansToile = function (x, y) { const P = W.POI && W.POI.nid; if (!P || Math.abs(x - P.x * T) > (Ni.RAYON + 3) * T || Math.abs(y - P.y * T) > (Ni.RAYON + 3) * T || !pret()) return false; for (const o of deco.sol) { const r = sprites[o.s].width * o.k * 0.42, dx = (x - o.x) / r, dy = (y - o.y) / (r * 0.62); if (dx * dx + dy * dy < 1) return true; } return false; };
  // ---------- le mur de feu brûle les toiles : celles qu'il couvre et celles qui sont trop près disparaissent pour de bon ----------
  Ni.FEU = 38; // distance (en plus du rayon de la toile) à laquelle une toile prend feu
  Ni.bruler = function (w) {
    const S = CG.S, R = CG.R, vx = w.x2 - w.x1, vy = w.y2 - w.y1, L2 = vx * vx + vy * vy || 1; let n = 0;
    const pres = (x, y, r) => { const q = CG.clamp(((x - w.x1) * vx + (y - w.y1) * vy) / L2, 0, 1); return Math.hypot(x - (w.x1 + vx * q), y - (w.y1 + vy * q)) < r + Ni.FEU; };
    const flambe = (x, y) => { n++; G.puff(x, y - 4, '#ff9a2e', 9, 90, 3); G.puff(x, y - 8, '#5a5048', 6, 60, 4); for (let i = 0; i < 4; i++) R.parts.push({ x: x + (Math.random() - 0.5) * 26, y: y - Math.random() * 10, vx: (Math.random() - 0.5) * 24, vy: -30 - Math.random() * 30, life: 0.7, max: 0.7, col: i % 2 ? '#ffd84a' : '#ff6a1e', size: 2.5, float: true }); };
    const P = W.POI && W.POI.nid;
    if (P && pret() && Math.abs((w.x1 + w.x2) / 2 - P.x * T) < (Ni.RAYON + 6) * T && Math.abs((w.y1 + w.y2) / 2 - P.y * T) < (Ni.RAYON + 6) * T) {
      const br = S.nidBrule || (S.nidBrule = {}), garde = l => l.filter(o => { const r = sprites[o.s].width * o.k * 0.42; if (!pres(o.x, o.y, r)) return true; br[o.i] = 1; flambe(o.x, o.y); return false; });
      deco.sol = garde(deco.sol); deco.arbres = garde(deco.arbres);
    }
    if (R.toilesM && R.toilesM.length) R.toilesM = R.toilesM.filter(o => { if (!pres(o.x, o.y, o.r)) return true; flambe(o.x, o.y); return false; }); // les toiles crachées du marais aussi
    if (n && CG.onScreen((w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2)) CG.sfx('fire');
    return n;
  };
  { let bt = 0; const upB = G.update; G.update = function (dt) { upB.apply(this, arguments); const R = CG.R; if (!R || !R.walls || !R.walls.length) return; bt -= dt; if (bt > 0) return; bt = 0.2; for (const w of R.walls) Ni.bruler(w); }; }
  { const hm0 = G.heroMul; G.heroMul = function () { const p = CG.S && CG.S.player, R = CG.R; return hm0.apply(this, arguments) * (p && !(R && R.mount) && Ni.dansToile(p.x, p.y) ? Ni.LENT : 1); };
    let fil = 0; const upT = G.update; G.update = function (dt) { upT.apply(this, arguments); const S = CG.S, R = CG.R, p = S && S.player; if (!p || !p.moving) return; fil -= dt; if (fil > 0) return; fil = 0.16; if (Ni.dansToile(p.x, p.y)) R.parts.push({ x: p.x + (Math.random() - 0.5) * 12, y: p.y - 2, vx: (Math.random() - 0.5) * 20, vy: -10 - Math.random() * 16, life: 0.45, max: 0.45, col: '#eef2ff', size: 2, float: true }); }; }

  // ---------- les piédestaux anciens : certains jours un seul se montre, parfois deux, et parfois aucun ----------
  const Au = CG.Autels; Ni.AUCUN = 0.4; Ni.DEUX = 0.2;
  function tirage() {
    const S = CG.S; if (!S || !S.autels || S.autelsJour === S.day || (CG.R && CG.R.horde)) return; S.autelsJour = S.day;
    const libres = CG.shuffle(S.autels.filter(a => a.st === 'scelle')), r = Math.random(), n = r < Ni.AUCUN ? 0 : r < 1 - Ni.DEUX ? 1 : 2;
    S.autels.forEach(a => { a.off = a.st === 'scelle'; }); libres.slice(0, n).forEach(a => { a.off = false; });
  }
  Ni.tirage = tirage;
  const up0 = G.update; G.update = function (dt) { up0.apply(this, arguments); tirage(); };
  if (Au) { const d0 = Au.draw; Au.draw = function (g, a, t) { if (a.off && a.st === 'scelle') return; return d0.apply(this, arguments); }; }
  const fi0 = CG.D.findInteract; CG.D.findInteract = function () { const it = fi0.apply(this, arguments); if (it && it.type === 'autel' && it.obj.off && it.obj.st === 'scelle') { const S = CG.S, l = S.autels; S.autels = l.filter(a => !(a.off && a.st === 'scelle')); try { return fi0.apply(this, arguments); } finally { S.autels = l; } } return it; };
})(window.CG);
