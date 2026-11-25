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
      if (A && A.lot) Cr.prendreLot(A); /* reparti sans le ramasser : il le garde quand même */
      if (A && A.donne) { G.banner('Le portail de la crypte se referme', 'Les morts dorment de nouveau. Tu gardes ce qu\'ils t\'ont laissé.', '#e0b0ff'); CG.sfx('ok'); return; } // la récompense a déjà été donnée au dernier monstre
      const id = G.newScroll();
      if (id) { G.giveScroll(id, p.x, p.y); G.banner('Le portail de la crypte se referme', 'Tu ressors avec un tome de sort arraché aux morts.', '#e0b0ff'); } else { G.gain('or', 80, p.x, p.y - 50); G.banner('Le portail de la crypte se referme', 'Tu connais déjà tous les sorts : les morts t\'ont laissé de l\'or.', '#e0b0ff'); }
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
    if (Math.hypot(p.x - q.x, p.y - (q.y + 14)) < 46 && (!it || it.type !== 'visitor')) return Cr.propre() ? { type: 'crypte', obj: { x: q.x, y: q.y - 40 }, label: 'Entrer dans le portail magique' } : { type: 'crypteGardee', obj: { x: q.x, y: q.y - 40 }, label: 'Le portail est gardé : nettoie d\'abord le cimetière' }; return it;
  };
  // le portail ne s'ouvre qu'une fois le cimetière nettoyé ; et au retour, il reste vide pour la journée
  const gardien = e => !e.dead && (e.site === 'cimetiere' || e.cimetiere);
  Cr.propre = () => !CG.R.enemies.some(gardien);
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'crypteGardee') { CG.sfx('no'); return UI.toast('Des morts rôdent encore entre les tombes. Le portail ne te laissera passer qu\'une fois le cimetière nettoyé.'); }
    if (!it || it.type !== 'crypte') return in0.apply(this, arguments); const S = CG.S; if (S.crypte) S.crypte.net = true; Ar.partir('crypte'); };
  { let tic = 0; const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || (tic -= dt) > 0) return; tic = 0.5;
    if (!foret() || !S.crypte || S.crypte.day !== S.day || !S.crypte.net) return;
    if (R.enemies.some(gardien)) R.enemies = R.enemies.filter(e => !gardien(e)); // ceux que le retour dans la forêt aurait ramenés
    (R.siteDone || (R.siteDone = {})).cimetiere = true; if (R.siteCoffre) delete R.siteCoffre.cimetiere;
  }; }
  // ---------- les vagues : la même horde qu'un piédestal, mais de morts ----------
  function vague(h) {
    const w = h.wave; let budget = (7 + h.pw * 1.3) * (0.6 + 0.4 * w); const pool = ['squelette', 'spectre'].concat(h.pw >= 3 || w >= 2 ? ['wraith'] : []).filter(t => CG.ENEMIES[t]), out = [];
    while (budget > 2 && out.length < 14) { const ok = pool.filter(t => (CG.ENEMIES[t].cost || 2) <= budget + 0.5); if (!ok.length) break; const t = pick(ok); out.push(t); budget -= CG.ENEMIES[t].cost || 2; }
    if (!out.length) out.push('squelette');
    out.forEach((type, i) => { let x, y; for (let k = 0; k < 40; k++) { const a = Math.random() * TAU, d = rand(0.35, 0.85); x = (Ar.CX + 0.5 + Math.cos(a) * Ar.RX * d) * T; y = (Ar.CY + 0.5 + Math.sin(a) * Ar.RY * d) * T; if (W.walkPx(x, y) && Math.hypot(x - CG.S.player.x, y - CG.S.player.y) > 110) break; } h.q.push({ t: 0.6 + i * 0.45, type, x, y }); });
    const p = CG.S.player; G.text(p.x, p.y - 96, 'Vague ' + (w + 1) + ' / ' + h.waves, '#e0a0ff', true); CG.sfx('warning');
  }
  // le dernier monstre de la dernière vague tombe : UN objet apparaît au milieu de la salle, toujours. Lequel ? Au hasard :
  // un sort, une arme, une armure, un outil, ou de la vie ou du mana en plus pour toujours. On le prend en marchant dessus.
  Cr.LOT = { sort: 0.3, arme: 0.2, armure: 0.15, outil: 0.15, vie: 0.1, mana: 0.1 }; // la chance de chaque sorte
  Cr.SORTS = { illusion: 0.2, invisible: 0.2, passe: 0.2, teleport: 0.2, resurrection: 0.05, lames: 0.15 }; // si c'est un sort : lequel
  Cr.VIE = 10; Cr.MANA = 8; Cr.PRES = 30;
  const tirage = P => { const k = Object.keys(P); let tot = 0; k.forEach(i => { tot += P[i]; }); let x = Math.random() * tot; for (const i of k) { x -= P[i]; if (x < 0) return i; } return k[0] || null; };
  Cr.tirerLot = function () {
    const S = CG.S, p = S.player, Bq = CG.Banque, q = p.lvl >= 9 ? 3 : 2, sorte = tirage(Cr.LOT), nom = (k, n) => (Bq && Bq.NOMS[k] && Bq.NOMS[k][n]) || k, ic = k => (Bq && Bq.IC[k]) || '🎁';
    if (sorte === 'sort') { const P = {}; Object.keys(Cr.SORTS).forEach(id => { if (CG.SPELLS[id] && !p.spells.includes(id) && !(p.scrolls && p.scrolls[id]) && (!CG.Cercles || !CG.Cercles.permis || CG.Cercles.permis(id))) P[id] = Cr.SORTS[id]; }); /* pas de sort trop fort pour le jour (cercles.js) */ const id = tirage(P); if (id) return { k: 'sort', id, ic: '📖', nom: 'Tome : ' + CG.SPELLS[id].nom }; } // il les connaît tous : autre chose
    if (sorte === 'arme' && Bq) { const k = pick(['epee', 'arc']); return { k: 'objet', o: k, n: q, ic: ic(k), nom: nom(k, q) }; }
    if (sorte === 'armure' && Bq) return { k: 'objet', o: 'armure', n: q, ic: ic('armure'), nom: nom('armure', q) };
    if (sorte === 'outil' && CG.Outils && CG.Outils.L) { const k = pick(Object.keys(CG.Outils.L)); return { k: 'objet', o: k, n: 1, ic: ic(k), nom: nom(k, 1) }; }
    return sorte === 'mana' ? { k: 'mana', ic: '💧', nom: '+' + Cr.MANA + ' mana pour toujours' } : { k: 'vie', ic: '❤️', nom: '+' + Cr.VIE + ' vie pour toujours' };
  };
  Cr.prendreLot = function (A0) {
    const S = CG.S, A = A0 || S.arene, p = S.player, L = A && A.lot; if (!L) return false; A.lot = null; let ou = '';
    if (L.k === 'sort') G.giveScroll(L.id, p.x, p.y);
    else if (L.k === 'objet') { const z = CG.Inventaire ? CG.Inventaire.ajouter(L.o, L.n, 'sac') : null; ou = z && CG.Inventaire.ou ? ' Rangé ' + CG.Inventaire.ou(z) + '.' : ''; }
    else if (L.k === 'vie') { p.maxhp += Cr.VIE; p.hp += Cr.VIE; }
    else { p.maxmp += Cr.MANA; p.mp += Cr.MANA; }
    G.puff(p.x, p.y - 24, '#ffe36b', 22, 150, 4); CG.R.rings.push({ x: p.x, y: p.y - 10, r: 60, life: 0.45, col: '#ffe36b' }); G.text(p.x, p.y - 74, L.ic + ' ' + L.nom, '#ffe36b', true); CG.sfx('discovery');
    if (L.k !== 'sort') CG.UI.toast('💀 Les morts gardaient ça : ' + L.ic + ' ' + L.nom + '.' + ou); return true;
  };
  function donner() {
    const S = CG.S, R = CG.R, A = S.arene, p = S.player; A.donne = true; A.lot = Cr.tirerLot(); S.autels = (S.autels || []).filter(o => !o.crypte);
    const c = { x: (Ar.CX + 0.5) * T, y: (Ar.CY + 0.5) * T }; if (Math.hypot(p.x - c.x, p.y - c.y) < 50) { p.y = c.y + 56; G.unstick(p, 9); } // pas sous les pieds du chef : il doit le voir apparaître
    G.puff(c.x, c.y - 20, '#c090ff', 34, 200, 5); G.puff(c.x, c.y - 30, '#ffe36b', 20, 140, 4); for (let i = 0; i < 3; i++) R.rings.push({ x: c.x, y: c.y - 6, r: 50 + i * 40, life: 0.45 + i * 0.15, col: i % 2 ? '#ffe36b' : '#c090ff' });
    if (R.pings) R.pings.push({ x: c.x, y: c.y, t0: performance.now(), icon: A.lot.ic, dur: 5000 }); CG.sfx('discovery');
  }
  { const up1 = G.update; G.update = function () { // on le prend en marchant dessus
    const r = up1.apply(this, arguments), S = CG.S; if (!S || !S.arene || !S.arene.lot || !Ar.dans() || S.arene.id !== 'crypte' || CG.R.ko > 0) return r; const p = S.player;
    if (Math.hypot(p.x - (Ar.CX + 0.5) * T, p.y - (Ar.CY + 0.5) * T) < Cr.PRES) Cr.prendreLot(); return r; }; }
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (c, t) { // l'objet flotte dans une colonne de lumière
    mk0.apply(this, arguments); const S = CG.S, L = S && S.arene && S.arene.lot; if (!L || !Ar.dans() || S.arene.id !== 'crypte') return; const x = (Ar.CX + 0.5) * T, y = (Ar.CY + 0.5) * T, fy = y - 30 + Math.sin(t * 2.4) * 4;
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, y - 150, 0, y); g.addColorStop(0, 'rgba(255,227,107,0)'); g.addColorStop(1, 'rgba(255,227,107,0.34)'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 9, y - 150); c.lineTo(x + 9, y - 150); c.lineTo(x + 22, y); c.lineTo(x - 22, y); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,227,107,' + (0.2 + Math.sin(t * 3) * 0.06) + ')'; c.beginPath(); c.ellipse(x, y + 2, 26, 11, 0, 0, TAU); c.fill(); c.restore();
    for (let i = 0; i < 4; i++) { const a = t * 1.6 + i * TAU / 4; c.fillStyle = 'rgba(255,246,200,0.9)'; c.beginPath(); c.arc(x + Math.cos(a) * 22, fy + Math.sin(a) * 8, 1.8, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(30,14,50,0.55)'; c.beginPath(); c.arc(x, fy, 17, 0, TAU); c.fill(); c.strokeStyle = '#ffe36b'; c.lineWidth = 2; c.stroke();
    c.font = '20px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(L.ic, x, fy + 1); c.textBaseline = 'alphabetic'; }; }
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
