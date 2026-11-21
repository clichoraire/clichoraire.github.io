// Clan Gobelin — les statues magiques : certains matins, une ou deux vieilles statues apparaissent dans les alentours.
// En les touchant, on reçoit une bénédiction tirée au hasard, pour un temps qui dépend du pouvoir. Chaque statue ne sert qu'une fois.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, T = CG.TILE, TAU = Math.PI * 2, pick = CG.pick, St = CG.Statues = { AUCUNE: 0.3, DEUX: 0.25 };
  // k : [icône, nom, durée (s), couleur, ce que ça fait]
  St.DONS = {
    force: { ic: '💪', nom: 'Statue de la Force', dur: 120, col: '#ff8a5a', txt: 'Tu frappes plus fort !' },
    vent: { ic: '🍃', nom: 'Statue du Vent', dur: 150, col: '#9be8ff', txt: 'Tu marches plus vite !' },
    vie: { ic: '💗', nom: 'Statue de la Source', dur: 60, col: '#ff8ab0', txt: 'Ta vie remonte toute seule !' },
    mana: { ic: '🔷', nom: 'Statue des Étoiles', dur: 60, col: '#7aa8ff', txt: 'Ton mana remonte tout seul !' },
    pierre: { ic: '🗿', nom: 'Statue de Pierre', dur: 120, col: '#c8c8d0', txt: 'Ta peau durcit comme le roc !' },
    sage: { ic: '📖', nom: 'Statue du Sage', dur: 180, col: '#ffe36b', txt: 'Tu apprends plus vite !' },
    hate: { ic: '⚡', nom: 'Statue de l\'Éclair', dur: 90, col: '#fff08a', txt: 'Tes sorts coûtent moins de mana !' },
    sort: { ic: '📜', nom: 'Statue du Savoir', dur: 120, col: '#d0a8ff', txt: () => (St.pretTxt ? St.pretTxt() : '') } // un sort prêté (pret.js)
  };
  const b = k => { const S = CG.S; return S && S.statBuffs && S.statBuffs[k] > 0 ? S.statBuffs[k] : 0; };
  St.actif = b;
  // ---------- où elles apparaissent ----------
  function tirage() {
    const S = CG.S; if (!S || (S.statues && S.statues.day === S.day)) return;
    const r = Math.random(), n = r < St.AUCUNE ? 0 : r < 1 - St.DEUX ? 1 : 2, list = [];
    const ok = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!W.walkTile(x + dx, y + dy)) return false; const d = Math.hypot(x - W.CX, y - W.CY); if (d < 15 || d > 36 || (W.reachable && !W.reachable(x, y))) return false;
      if (W.GRAVE && Math.hypot(x - W.GRAVE.x, y - W.GRAVE.y) < 8) return false; if (!Object.values(W.POI).every(p => Math.hypot(x - p.x, y - p.y) > p.r + 3)) return false;
      if ((S.autels || []).some(a => Math.hypot(x - a.tx, y - a.ty) < 6) || (S.camps || []).some(c => Math.hypot(x * T - c.x, y * T - c.y) < 300)) return false; return list.every(a => Math.hypot(x - a.tx, y - a.ty) > 22); };
    for (let k = 0; k < 4000 && list.length < n; k++) { const x = 6 + Math.floor(Math.random() * (CG.MW - 12)), y = 6 + Math.floor(Math.random() * (CG.MH - 12)); if (ok(x, y)) list.push({ tx: x, ty: y, use: false }); }
    S.statues = { day: S.day, list };
  }
  St.tirage = tirage;
  const pos = a => ({ x: a.tx * T + T / 2, y: a.ty * T + T / 2 });
  // ---------- les effets ----------
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S) return; tirage();
    const B = S.statBuffs; if (!B || R.night) return; const p = S.player;
    for (const k in B) { if (!(B[k] > 0)) continue; B[k] -= dt; if (B[k] <= 0) { delete B[k]; G.text(p.x, p.y - 64, St.DONS[k].ic + ' La bénédiction s\'éteint', '#e8e0ff'); } }
    if (R.ko > 0) return;
    if (b('vie') && p.hp < p.maxhp) p.hp = Math.min(p.maxhp, p.hp + 1.5 * dt);
    if (b('mana') && p.mp < p.maxmp) p.mp = Math.min(p.maxmp, p.mp + 2 * dt);
  };
  { const pd = G.playerDmg; G.playerDmg = function () { return pd.apply(this, arguments) * (b('force') ? 1.4 : 1); };
    const hm = G.heroMul; G.heroMul = function () { return hm.apply(this, arguments) * (b('vent') ? 1.3 : 1); };
    const hp = G.hurtPlayer; G.hurtPlayer = function (dmg) { return hp.call(this, b('pierre') ? dmg * 0.7 : dmg); };
    const ax = G.addXp; G.addXp = function (n) { return ax.call(this, b('sage') ? Math.ceil(n * 1.5) : n); };
    const sc = G.spellCost; if (sc) G.spellCost = function () { const c = sc.apply(this, arguments); return b('hate') ? Math.max(1, Math.round(c * 0.7)) : c; }; }
  // ---------- toucher une statue ----------
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments); if (it) return it; const S = CG.S, R = CG.R, p = S.player; if (!S.statues || R.ko > 0 || R.cine || R.build) return it;
    for (const a of S.statues.list) { const c = pos(a); if (Math.hypot(c.x - p.x, c.y + 10 - p.y) < 56) return a.use ? { type: 'statueVide', obj: a, label: 'Une vieille statue, éteinte' } : { type: 'statue', obj: a, label: 'Toucher la statue ✨' }; }
    return it;
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(); if (!it || (it.type !== 'statue' && it.type !== 'statueVide')) return in0.apply(this, arguments);
    if (it.type === 'statueVide') return UI.toast('🗿 La statue est froide. Sa magie est partie pour aujourd\'hui.');
    const S = CG.S, R = CG.R, a = it.obj, c = pos(a), p = S.player, libres = Object.keys(St.DONS).filter(k => !b(k)), sans = l => l.filter(x => x !== 'sort'); let k = pick(libres.length ? libres : Object.keys(St.DONS)); if (k === 'sort' && !(St.preter && St.preter())) k = pick(sans(libres).length ? sans(libres) : sans(Object.keys(St.DONS))); /* rien à prêter : une autre bénédiction */ const Dn = St.DONS[k], txt = typeof Dn.txt === 'function' ? Dn.txt() : Dn.txt;
    a.use = true; a.k = k; (S.statBuffs = S.statBuffs || {})[k] = Dn.dur; CG.sfx('discovery'); CG.sfx('heal'); W.miniDirty = true;
    R.rings.push({ x: c.x, y: c.y - 30, r: 130, life: 0.6, col: Dn.col }, { x: p.x, y: p.y - 10, r: 90, life: 0.5, col: '#ffffff' }); R.bolts.push({ x1: c.x, y1: c.y - 58, x2: p.x, y2: p.y - 26, life: 0.3 });
    for (let i = 0; i < 22; i++) { const an = Math.random() * TAU, v = 50 + Math.random() * 110; R.parts.push({ x: p.x, y: p.y - 26, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 40, life: 0.9, max: 0.9, col: i % 2 ? Dn.col : '#ffffff', size: 3.5 }); }
    G.banner(Dn.ic + ' ' + Dn.nom, txt, Dn.col); // ni chiffres ni durée : la petite icône de la bénédiction montre le temps qui reste
  };
  // ---------- le dessin ----------
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const box = (g, x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
  St.draw = function (g, a, t) {
    const c = pos(a), x = c.x, y = c.y + 12, on = !a.use, pu = 0.5 + 0.5 * Math.sin(t * 2.4 + a.tx), col = on ? '190,150,255' : '120,120,130';
    ell(g, x, y + 2, 26, 8, 'rgba(0,0,0,0.28)');
    if (on) { const gr = g.createRadialGradient(x, y - 34, 4, x, y - 34, 60); gr.addColorStop(0, 'rgba(' + col + ',' + (0.3 + pu * 0.2) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = gr; g.fillRect(x - 60, y - 94, 120, 120); }
    box(g, x - 20, y - 10, 40, 12, '#6e6e78'); box(g, x - 20, y - 10, 40, 3, '#8c8c98'); box(g, x - 15, y - 18, 30, 9, '#7c7c88'); box(g, x - 15, y - 18, 30, 2.5, '#9a9aa6'); // le socle
    g.fillStyle = on ? '#9a9aa8' : '#74747e'; g.beginPath(); g.moveTo(x - 12, y - 18); g.lineTo(x - 14, y - 44); g.quadraticCurveTo(x - 15, y - 56, x, y - 58); g.quadraticCurveTo(x + 15, y - 56, x + 14, y - 44); g.lineTo(x + 12, y - 18); g.closePath(); g.fill(); // le corps drapé
    g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x, y - 58); g.quadraticCurveTo(x + 15, y - 56, x + 14, y - 44); g.lineTo(x + 12, y - 18); g.closePath(); g.fill();
    ell(g, x, y - 66, 10, 11, on ? '#a6a6b4' : '#7e7e88'); ell(g, x + 3, y - 66, 6, 10, 'rgba(0,0,0,0.14)'); // la tête
    g.fillStyle = on ? '#a6a6b4' : '#7e7e88'; g.beginPath(); g.moveTo(x - 9, y - 70); g.lineTo(x - 21, y - 78); g.lineTo(x - 8, y - 63); g.closePath(); g.fill(); g.beginPath(); g.moveTo(x + 9, y - 70); g.lineTo(x + 21, y - 78); g.lineTo(x + 8, y - 63); g.closePath(); g.fill(); // de grandes oreilles : un ancien gobelin
    box(g, x - 9, y - 40, 18, 5, on ? '#8a8a98' : '#6a6a74'); // les mains jointes
    g.strokeStyle = 'rgba(60,90,50,0.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 14, y - 12); g.quadraticCurveTo(x - 6, y - 26, x - 12, y - 38); g.stroke(); // un peu de lierre
    if (!on) return;
    const oy = y - 43 + Math.sin(t * 2 + a.tx) * 1.5; ell(g, x, oy, 8 + pu * 1.5, 8 + pu * 1.5, 'rgba(' + col + ',0.35)'); ell(g, x, oy, 5, 5, '#e8dcff'); ell(g, x - 1.5, oy - 1.5, 2, 2, '#ffffff'); // l'orbe entre ses mains
    ell(g, x - 4, y - 68, 1.6, 1.6, 'rgba(220,200,255,' + (0.6 + pu * 0.4) + ')'); ell(g, x + 4, y - 68, 1.6, 1.6, 'rgba(220,200,255,' + (0.6 + pu * 0.4) + ')'); // ses yeux luisent
    for (let i = 0; i < 4; i++) { const k = (t * 0.4 + i / 4) % 1, an = i * 1.7 + t * 0.6; ell(g, x + Math.cos(an) * (16 + k * 8), y - 30 - k * 54, 1.6 * (1 - k) + 0.6, 1.6 * (1 - k) + 0.6, 'rgba(230,215,255,' + Math.sin(k * Math.PI) * 0.9 + ')'); }
  };
  // ---------- dans la barre des effets ----------
  if (CG.Buffs) Object.keys(St.DONS).forEach(k => { const Dn = St.DONS[k]; CG.Buffs.LISTE.push({ k: 'statue-' + k, ic: Dn.ic, nom: () => Dn.nom, txt: Dn.txt, t: () => b(k) }); });
})(window.CG);
