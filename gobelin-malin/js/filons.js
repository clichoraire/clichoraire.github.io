// Goblin Malin — les filons d'or. Près de la mine, trois rochers sont veinés d'or. Les mineurs y vont comme aux autres
// gisements (ils choisissent au hasard), mais ce qu'ils rapportent à la réserve, ce sont des pièces d'or. Le chef peut
// aussi y donner des coups de pioche lui-même (E), une fois par jour et par filon.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2;
  const Fi = CG.Filons = { N: 3, GAIN: 3, CHEF: 8 };
  const monde = () => (CG.Mondes ? CG.Mondes.ici() : 0);
  // ---------- où ils sont : toujours aux mêmes endroits pour une même carte ----------
  const gen0 = W.generate; W.generate = function (seed) {
    const r = gen0.apply(this, arguments); if (monde() === 2 || !W.POI || !W.POI.mine || !W.nodes) return r;
    const m = W.POI.mine, rng = CG.makeRng((W.seed || seed || 1) + 771 + monde() * 13); let n = 0;
    const libre = (x, y) => { const t = W.tile[W.idx(x, y)]; return (t === W.GRASS || t === W.CLEAR || t === W.PATH) && W.walkTile(x, y) && !W.nodes.some(o => Math.abs(o.x - x) <= 1 && Math.abs(o.y - y) <= 1); };
    for (let i = 0; i < 400 && n < Fi.N; i++) { const a = rng() * TAU, d = 3.4 + rng() * (2.4 + i / 80), x = Math.round(m.x + Math.cos(a) * d), y = Math.round(m.y + Math.sin(a) * d);
      if (x < 3 || y < 3 || x > CG.MW - 4 || y > CG.MH - 4 || !libre(x, y) || !W.walkTile(x, y + 1)) continue; W.nodes.push({ type: 'ore', or: true, x, y }); n++; }
    return r;
  };
  Fi.liste = () => (W.nodes || []).filter(n => n.or);
  // ---------- les mineurs : ce qu'ils rapportent d'un filon d'or, c'est de l'or ----------
  const dp0 = G.dropPoint; G.dropPoint = function (g) { if (g && g.job === 'mineur' && g.node && g.node.or && g.state === 'work') g.orVein = true; return dp0.apply(this, arguments); };
  const ga0 = G.gain; G.gain = function (res, n, x, y) {
    if (res === 'minerai' && n > 0) {
      if (Fi.chef) return ga0.call(this, 'or', Fi.CHEF, x, y);
      if (x !== undefined) { const g = CG.S.goblins.find(o => o.orVein && o.state === 'toStock' && Math.abs(o.x - x) < 0.5 && Math.abs(o.y - 30 - y) < 0.5); if (g) { g.orVein = false; return ga0.call(this, 'or', Fi.GAIN, x, y); } }
    }
    return ga0.apply(this, arguments);
  };
  const up0 = G.update; G.update = function (dt) { up0.apply(this, arguments); const S = CG.S; if (S) for (const g of S.goblins) if (g.orVein && g.state !== 'work' && g.state !== 'toStock') g.orVein = false; };
  // ---------- le réglage, gobelin par gobelin : au hasard, l'or d'abord, ou le minerai d'abord ----------
  Fi.MODES = { hasard: ['🎲', 'au hasard', 'Je prends le premier rocher qui me plaît, chef.'], or: ['🪙', 'l\'or d\'abord', 'L\'or d\'abord, chef ! Ça brille mieux, de toute façon.'], minerai: ['🪨', 'le minerai d\'abord', 'Le minerai d\'abord, chef. Le forgeron va être content.'] };
  Fi.mode = g => (Fi.MODES[g.filon] ? g.filon : 'hasard');
  if (CG.Aide && CG.Aide.ailleurs) { const ai0 = CG.Aide.ailleurs; CG.Aide.ailleurs = function (g, ns) {
    let l = ns; const m = g && g.job === 'mineur' ? Fi.mode(g) : 'hasard'; if (m !== 'hasard' && ns && ns.length) { const ok = ns.filter(n => n.type === 'ore' && !!n.or === (m === 'or')); if (ok.length) l = ok; } // s'il n'en reste plus de la sorte voulue, il prend l'autre
    return ai0.call(this, g, l);
  }; }
  // dans la discussion avec un mineur : « prioriser quelque chose », puis on choisit quoi
  Fi.CHOIX = { or: ['🪙', 'L\'or'], minerai: ['🪨', 'Le minerai'], hasard: ['🎲', 'Peu importe'] };
  Fi.demander = function (g) {
    const m = Fi.mode(g);
    CG.UI.dialog({ goblin: g, who: g.name, tag: '⛏️ mineur', text: 'Qu\'est-ce que je pioche en premier, chef ?',
      options: Object.keys(Fi.CHOIX).map(k => ({ label: Fi.CHOIX[k][0] + ' ' + Fi.CHOIX[k][1], active: k === m, sub: k === m ? 'C\'est ce qu\'' + (g.sex === 'f' ? 'elle' : 'il') + ' fait déjà' : '', fn: () => { g.filon = k; if (g.state === 'idle' || g.state === 'toNode') G.resetGoblin(g); G.say(g, Fi.MODES[k][2], 3.5); CG.sfx('click'); } })).concat([{ label: '↩ Retour', fn: () => CG.UI.talkGoblin(g) }]) });
  };
  const dl0 = CG.UI.dialog; CG.UI.dialog = function (o) {
    const g = o && o.goblin; if (g && g.job === 'mineur' && Array.isArray(o.options) && o.options.some(x => x && /^🛠/.test(x.label || '')) && Fi.liste().length) {
      const opts = o.options.slice(), i = opts.findIndex(x => x && /^👋/.test(x.label || ''));
      opts.splice(i < 0 ? opts.length : i, 0, { label: '⛏️ Lui demander de prioriser quelque chose', fn: () => Fi.demander(g) });
      o = Object.assign({}, o, { options: opts });
    }
    return dl0.call(this, o);
  };
  // la sauvegarde : ce que chaque mineur pioche en premier
  { const pk = CG.pack; if (pk) CG.pack = function () { const d = pk.apply(this, arguments), S = CG.S; if (d && d.goblins && S) d.goblins.forEach((o, i) => { const g = S.goblins[i]; if (g && g.filon) o.filon = g.filon; }); return d; }; }
  // ---------- le chef ----------
  const ps0 = G.pickStep; G.pickStep = function () { const k = CG.R && CG.R.picking; Fi.chef = !!(k && k.n && k.n.or); try { return ps0.apply(this, arguments); } finally { Fi.chef = false; } };
  const fi0 = D.findInteract; D.findInteract = function () { const it = fi0.apply(this, arguments); if (it && it.type === 'ore' && it.obj && it.obj.or && !/pioches/.test(it.label)) it.label = 'Piocher le filon d\'or (+' + Fi.CHEF + ' ' + CG.RES.or.icon + ')'; return it; };
  // ---------- le dessin : un rocher sombre, veiné d'or, qui scintille ----------
  let img = null;
  function sprite() {
    if (img) return img; const c = img = document.createElement('canvas'), g = c.getContext('2d'); c.width = 60; c.height = 56;
    const poly = (p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(30, 46, 26, 8, 0, 0, TAU); g.fill();
    poly([6, 44, 8, 22, 22, 8, 42, 6, 54, 22, 55, 44], '#5e5648'); poly([42, 6, 54, 22, 55, 44, 34, 44], '#4a4338'); poly([8, 22, 22, 8, 27, 15, 14, 26], '#7a705e');
    g.strokeStyle = '#c98708'; g.lineWidth = 4.4; g.lineCap = 'round'; g.lineJoin = 'round'; [[12, 34, 20, 26, 29, 30, 37, 20, 46, 24], [22, 42, 30, 37, 41, 40, 49, 33]].forEach(p => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); });
    g.strokeStyle = '#ffd84a'; g.lineWidth = 2.2; [[12, 34, 20, 26, 29, 30, 37, 20, 46, 24], [22, 42, 30, 37, 41, 40, 49, 33]].forEach(p => { g.beginPath(); g.moveTo(p[0], p[1] - 0.6); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1] - 0.6); g.stroke(); });
    [[20, 26, 4], [37, 20, 4.4], [30, 37, 3.6], [46, 30, 3]].forEach(q => { g.fillStyle = '#c98708'; g.beginPath(); g.arc(q[0], q[1], q[2] + 1, 0, TAU); g.fill(); g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(q[0], q[1], q[2], 0, TAU); g.fill(); g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(q[0] - 1.2, q[1] - 1.2, q[2] * 0.36, 0, TAU); g.fill(); });
    return c;
  }
  const nd0 = Art.node; Art.node = function (g, n, t) {
    if (!n || !n.or) return nd0.apply(this, arguments);
    const x = n.x * T + T / 2, y = n.y * T + T / 2; Art.rock(g, n.x, n.y, true); void sprite; // le rocher aux pépites d'or
    for (let i = 0; i < 2; i++) { const k = Math.pow(Math.max(0, Math.sin((t || 0) * 1.7 + n.x * 2.1 + i * 2.6)), 10); if (k < 0.05) continue; const sx = x + (i ? 8 : -9), sy = y - (i ? 14 : 6), r = 2 + k * 5; g.fillStyle = 'rgba(255,250,210,' + k + ')'; g.beginPath(); g.moveTo(sx, sy - r); g.lineTo(sx + r * 0.25, sy - r * 0.25); g.lineTo(sx + r, sy); g.lineTo(sx + r * 0.25, sy + r * 0.25); g.lineTo(sx, sy + r); g.lineTo(sx - r * 0.25, sy + r * 0.25); g.lineTo(sx - r, sy); g.lineTo(sx - r * 0.25, sy - r * 0.25); g.closePath(); g.fill(); }
  };
})(window.CG);
