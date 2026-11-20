// Goblin Malin — le portail de la crypte. Au cimetière de la forêt, certains jours (rarement), la porte de la petite crypte
// s'emplit d'une lumière mauve : un portail, juste de la taille de la porte. Il mène dans une salle hors du monde où les
// morts arrivent par vagues, comme la horde d'un piédestal (même force, même nombre de vagues). Au bout : un parchemin.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, Ar = CG.Arene, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  if (!Ar) return;
  const Cr = CG.Crypte = { CHANCE: 0.1 };
  const foret = () => !CG.Mondes || CG.Mondes.ici() === 0;
  const noeud = () => (W.nodes || []).find(n => n.type === 'crypt') || null;
  Cr.porte = () => { const n = noeud(); return n ? { x: n.x * T + T / 2, y: n.y * T + T / 2 + 8 } : null; };
  Cr.ouvert = function () { const S = CG.S; if (!S || !foret() || !noeud()) return false; if (!S.crypte || S.crypte.day !== S.day) S.crypte = { day: S.day, la: Math.random() < Cr.CHANCE, fait: false }; return S.crypte.la && !S.crypte.fait; };
  Ar.Q.crypte = { mondes: [], qui: 'La crypte', lieu: 'La salle hors du monde', theme: 'crypte', vagues: true, E: [[], [], []],
    recompense(A) { const S = CG.S, p = S.player; if (S.crypte) S.crypte.fait = true;
      if (A && A.donne) { G.banner('Le portail de la crypte se referme', 'Les morts dorment de nouveau. Tu gardes ce qu\'ils t\'ont laissé.', '#e0b0ff'); CG.sfx('ok'); return; } // la récompense a déjà été donnée au dernier monstre
      const id = G.newScroll();
      if (id) { G.giveScroll(id, p.x, p.y); G.banner('Le portail de la crypte se referme', 'Tu ressors avec un parchemin arraché aux morts.', '#e0b0ff'); } else { G.gain('or', 80, p.x, p.y - 50); G.banner('Le portail de la crypte se referme', 'Tu connais déjà tous les sorts : les morts t\'ont laissé de l\'or.', '#e0b0ff'); }
      CG.sfx('victory'); } };
  // ---------- la porte mauve ----------
  const nd0 = Art.node; Art.node = function (g, n, t) {
    nd0.apply(this, arguments); if (!n || n.type !== 'crypt' || !Cr.ouvert()) return; const x = n.x * T + T / 2, y = n.y * T + T / 2 + 8; t = t || 0;
    g.save(); g.beginPath(); g.moveTo(x - 11, y + 4); g.lineTo(x - 11, y - 20); g.arc(x, y - 20, 11, Math.PI, 0); g.lineTo(x + 11, y + 4); g.closePath(); g.clip();
    g.fillStyle = '#3a1466'; g.fillRect(x - 12, y - 32, 24, 38);
    for (let i = 0; i < 4; i++) { const k = (t * 0.5 + i / 4) % 1; g.strokeStyle = 'rgba(' + (i % 2 ? '230,170,255' : '170,90,255') + ',' + (1 - k) + ')'; g.lineWidth = 2.4; g.beginPath(); g.ellipse(x, y - 12, 2 + k * 12, 3 + k * 18, t * 1.6 + i, 0, TAU * 0.7); g.stroke(); }
    g.fillStyle = 'rgba(245,225,255,' + (0.5 + Math.sin(t * 5) * 0.2) + ')'; g.beginPath(); g.ellipse(x, y - 12, 3, 5, 0, 0, TAU); g.fill(); g.restore();
    g.fillStyle = 'rgba(180,90,255,' + (0.16 + Math.sin(t * 2.4) * 0.06) + ')'; g.beginPath(); g.ellipse(x, y - 10, 26, 30, 0, 0, TAU); g.fill();
    for (let i = 0; i < 3; i++) { const k = (t * 0.45 + i / 3) % 1; g.fillStyle = 'rgba(220,170,255,' + (1 - k) + ')'; g.beginPath(); g.arc(x - 10 + i * 10 + Math.sin(t * 2 + i) * 3, y - 6 - k * 34, 1.8, 0, TAU); g.fill(); }
  };
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), R = CG.R; if (R.ko > 0 || R.cine || R.build || !Cr.ouvert()) return it; const q = Cr.porte(), p = CG.S.player;
    if (Math.hypot(p.x - q.x, p.y - (q.y + 14)) < 46 && (!it || it.type !== 'visitor')) return { type: 'crypte', obj: { x: q.x, y: q.y - 40 }, label: 'Entrer dans le portail magique' }; return it;
  };
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (!it || it.type !== 'crypte') return in0.apply(this, arguments); Ar.partir('crypte'); };
  // ---------- les vagues : la même horde qu'un piédestal, mais de morts ----------
  function vague(h) {
    const w = h.wave; let budget = (7 + h.pw * 1.3) * (0.6 + 0.4 * w); const pool = ['squelette', 'spectre'].concat(h.pw >= 3 || w >= 2 ? ['wraith'] : []).filter(t => CG.ENEMIES[t]), out = [];
    while (budget > 2 && out.length < 14) { const ok = pool.filter(t => (CG.ENEMIES[t].cost || 2) <= budget + 0.5); if (!ok.length) break; const t = pick(ok); out.push(t); budget -= CG.ENEMIES[t].cost || 2; }
    if (!out.length) out.push('squelette');
    out.forEach((type, i) => { let x, y; for (let k = 0; k < 40; k++) { const a = Math.random() * TAU, d = rand(0.35, 0.85); x = (Ar.CX + 0.5 + Math.cos(a) * Ar.RX * d) * T; y = (Ar.CY + 0.5 + Math.sin(a) * Ar.RY * d) * T; if (W.walkPx(x, y) && Math.hypot(x - CG.S.player.x, y - CG.S.player.y) > 110) break; } h.q.push({ t: 0.6 + i * 0.45, type, x, y }); });
    const p = CG.S.player; G.text(p.x, p.y - 96, 'Vague ' + (w + 1) + ' / ' + h.waves, '#e0a0ff', true); CG.sfx('warning');
  }
  // le dernier monstre de la dernière vague tombe : la récompense, tout de suite. Souvent un parchemin (avec la grande scène), parfois des vivres et des matériaux.
  Cr.PARCHEMIN = 0.65;
  function donner() {
    const S = CG.S, A = S.arene, p = S.player, id = Math.random() < Cr.PARCHEMIN ? G.newScroll() : null; A.donne = true;
    if (id) { // le parchemin n'arrive pas dans les mains : un piédestal déjà ouvert sort du sol au milieu de la salle, il n'y a plus qu'à le prendre
      const R = CG.R, a = { tx: Ar.CX, ty: Ar.CY, st: 'ouvert', id: null, day: S.day, crypte: true }; S.autels = (S.autels || []).filter(o => !o.crypte); S.autels.push(a); A.piedestal = true;
      const c = { x: (Ar.CX + 0.5) * T, y: (Ar.CY + 0.5) * T }; if (Math.hypot(p.x - c.x, p.y - c.y) < 34) { p.y = c.y + 40; G.unstick(p, 9); } // on ne le fait pas sortir sous les pieds du chef
      G.puff(c.x, c.y - 20, '#c090ff', 34, 200, 5); G.puff(c.x, c.y - 30, '#ffe36b', 20, 140, 4); for (let i = 0; i < 3; i++) R.rings.push({ x: c.x, y: c.y - 6, r: 50 + i * 40, life: 0.45 + i * 0.15, col: i % 2 ? '#ffe36b' : '#c090ff' });
      if (R.pings) R.pings.push({ x: c.x, y: c.y, t0: performance.now(), icon: '📜', dur: 5000 }); CG.sfx('discovery'); return; }
    const d = S.day, lot = [['food', 30 + 5 * d], ['bois', 25 + 4 * d], ['or', 40 + 8 * d]].concat(Math.random() < 0.5 ? [['minerai', 12 + 2 * d]] : [['cuir', 8 + 2 * d]]);
    lot.forEach((q, i) => G.gain(q[0], q[1], p.x + (i - 1.5) * 26, p.y - 50 - (i % 2) * 14)); CG.sfx('coin');
    CG.UI.toast('💀 Pas de parchemin cette fois : les morts gardaient des vivres et des matériaux. ' + lot.map(q => '+' + q[1] + ' ' + CG.RES[q[0]].icon).join(', ') + '.');
  }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || !Ar.dans() || S.arene.id !== 'crypte' || S.arene.gagne || (CG.Mondes && CG.Mondes.pending)) return;
    let h = R.cry; if (!h) { const pw = CG.Autels ? CG.Autels.power() : S.player.lvl; h = R.cry = { pw, wave: 0, waves: 3 + Math.min(3, Math.floor(pw / 4)), q: [], list: [], t: -1.5 }; }
    if (h.t < 0) { h.t += dt; if (h.t >= 0) { h.t = 0; vague(h); } return; } // un instant pour regarder autour de soi
    for (const q of h.q) { q.t -= dt; if (q.t > 0) continue; const e = G.spawnEnemy(q.type, q.x, q.y, { wild: true, mul: 1 + h.pw * 0.03 }); if (!e) continue; e.arene = true; e.etage = 99; e.aggroR = 900; e.leash = 2000; e.calm = false; h.list.push(e); G.puff(q.x, q.y - 16, '#a060ff', 16, 120, 4); R.rings.push({ x: q.x, y: q.y - 4, r: 34, life: 0.35, col: '#c080ff' }); }
    h.q = h.q.filter(q => q.t > 0);
    if (h.q.length || h.list.some(e => !e.dead && R.enemies.includes(e))) { h.t = 0; return; }
    h.t += dt; if (h.t < 2.2) return; h.t = 0; h.wave++;
    if (h.wave < h.waves) return vague(h);
    R.cry = null; donner(); Ar.gagner();
  };
  Cr.vagues = () => CG.R && CG.R.cry;
})(window.CG);
