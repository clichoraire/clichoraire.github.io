// Goblin Malin — les armes du chef : le bâton magique, l'épée, l'arc.
//   Le bâton magique : c'est l'arme de départ, le seul objet avec lequel on commence. Tant que le chef le tient, sa mana
//     remonte un peu plus vite. Donné à un gobelin, il le fait cogner plus fort ; un chaman lance ses esprits plus souvent
//     et plus fort (evolution.js).
//   L'épée : plus de dégâts au corps à corps (comme avant).
//   L'arc : le chef tire des flèches au lieu de frapper. Il lui faut des flèches : les facteurs d'arcs en taillent pour lui
//     à l'atelier, avec du bois, tant qu'il n'en a pas assez. Sans flèches, il cogne avec son arc.
// Tout est réglable dans CG.Armes.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Bq = CG.Banque, Iv = CG.Inventaire, dist = CG.dist;
  const Ar = CG.Armes = { BATON_MANA: 0.3, BATON_GOB: 2, FLECHES_MAX: 60, FLECHES_LOT: 5, FLECHES_BOIS: 1, FLECHES_TEMPS: 12, FLECHES_DEPART: 15, PORTEE: 430, CADENCE: 0.5, ARC_DMG: [0, 0.9, 1.1, 1.35], CARQUOIS: [20, 14] }; /* FLECHES_LOT flèches pour FLECHES_BOIS bois toutes les FLECHES_TEMPS secondes, par facteur d'arcs ; CARQUOIS : [flèches, prix] chez un marchand */
  const porte = () => { const p = CG.S.player; return p.porte || (p.porte = { arme: null, armure: null }); };
  const arme = () => (CG.S && CG.S.player ? porte().arme : null);
  Ar.arc = () => { const a = arme(); return a && a.k === 'arc' ? a : null; };
  Ar.fleches = () => porte().fleches || 0;
  Ar.ajouter = n => { const P = porte(); P.fleches = Math.max(0, Math.min(Ar.FLECHES_MAX, (P.fleches || 0) + n)); return P.fleches; };
  const aUnArc = () => { const p = CG.S.player, est = o => !!o && o.k === 'arc'; return !!Ar.arc() || (p.sac || []).some(est); };
  // ---------- le bâton de départ ----------
  function depart() { const S = CG.S; if (!S || !S.player) return; const P = porte(); if (P.batonDonne) return; P.batonDonne = true; if (!P.arme) P.arme = { k: 'baton', n: 1 }; else if (Iv && Iv.ajouter) Iv.ajouter('baton', 1, 'sac'); }
  { const mr0 = G.manaRegen; G.manaRegen = function () { const a = arme(); return mr0.apply(this, arguments) + (a && a.k === 'baton' ? Ar.BATON_MANA : 0); }; }
  { const gd0 = G.guardDmg; G.guardDmg = function (g) { return gd0.apply(this, arguments) + (g && g.equip && g.equip.baton ? Ar.BATON_GOB : 0); }; }
  // ---------- l'arc : une flèche à chaque coup ----------
  let ditT = 0;
  const at0 = G.attack; G.attack = function () {
    const S = CG.S, R = CG.R, a = Ar.arc(); if (!a || !S) return at0.apply(this, arguments); const p = S.player; if (R.atkCd > 0 || R.ko > 0) return;
    if (Ar.fleches() <= 0) { if (R.t - ditT > 4) { ditT = R.t; G.text(p.x, p.y - 62, 'Plus de flèches !', '#ffd0a0', true); } return at0.apply(this, arguments); }
    if (R.invis > 0 && CG.Magie.reveal) CG.Magie.reveal();
    let tg = null, bd = 1e9; for (const e of R.enemies) { if (e.dead || e.charm > 0) continue; const d = dist(e, p); if (d > (e.calm && !e.struct ? 260 : Ar.PORTEE)) continue; const v = d + (e.calm && !e.struct ? 400 : 0); /* une bête paisible : seulement s'il n'y a rien d'autre à viser */ if (v < bd) { bd = v; tg = e; } } if (tg) bd = dist(tg, p);
    const but = tg || { x: p.x + R.dir.x * 300, y: p.y + R.dir.y * 300 + 14 };
    if (tg) { R.dir = { x: (tg.x - p.x) / (bd || 1), y: (tg.y - p.y) / (bd || 1) }; if (Math.abs(tg.x - p.x) > 4) p.face = tg.x > p.x ? 1 : -1; }
    R.atkCd = Ar.CADENCE; R.swing = 0.6; Ar.ajouter(-1); G.shoot(p, but, 'arrow', G.playerDmg() * (Ar.ARC_DMG[a.n] || 1), 'p'); CG.sfx('swing'); R.playerCombatUntil = R.t + 3;
  };
  // ---------- les flèches : taillées par les facteurs d'arcs, vendues par les marchands ----------
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !S.player) return r; depart();
    const P = porte(); if (Ar.arc() && !P.flechesDonnees) { P.flechesDonnees = true; Ar.ajouter(Ar.FLECHES_DEPART); UI.toast('🏹 Tu trouves ' + Ar.FLECHES_DEPART + ' flèches avec l\'arc. Un facteur d\'arcs t\'en taillera d\'autres.'); }
    if (R.night || R.fireLit || !aUnArc() || Ar.fleches() >= Ar.FLECHES_MAX || !S.buildings.some(b => b.type === 'archerie' && !b.site)) return r;
    for (const g of S.goblins) { if (g.job !== 'arcier' || g.hidden || g.ko === true || g.child) continue; g.flT = (g.flT || 0) + dt; if (g.flT < Ar.FLECHES_TEMPS) continue; g.flT = 0; if ((S.res.bois || 0) < Ar.FLECHES_BOIS) continue;
      S.res.bois -= Ar.FLECHES_BOIS; Ar.ajouter(Ar.FLECHES_LOT); if (CG.onScreen(g.x, g.y)) G.text(g.x, g.y - 46, '+' + Ar.FLECHES_LOT + ' 🏹', '#ffe9c8'); if (Ar.fleches() >= Ar.FLECHES_MAX) break; }
    return r;
  };
  const carquois = () => ({ icon: '🏹', label: 'Carquois de ' + Ar.CARQUOIS[0] + ' flèches', desc: 'Pour ton arc.', prix: Ar.CARQUOIS[1], stock: 3, buy: () => { Ar.ajouter(Ar.CARQUOIS[0]); } });
  if (CG.Lapins && CG.Lapins.stock) { const s0 = CG.Lapins.stock; CG.Lapins.stock = function () { const l = s0.apply(this, arguments) || []; try { if (Math.random() < 0.5) l.push({ icon: '🪄', label: 'Bâton magique', desc: '★ ' + CG.Objets.PHRASE.baton, prix: 60, stock: 1, buy: () => { const z = Bq.deposer('baton', 1, 1, 'sac'); UI.toast('🪄 Bâton magique : rangé ' + (Iv ? Iv.ou(z) : 'dans le coffre') + '.'); } }); if (CG.S && aUnArc()) l.push(carquois()); } catch (e) { /* rien */ } return l; }; }
  // ---------- le compteur de flèches, à côté des fioles, quand le chef tient un arc ----------
  let el = null, vu = '';
  window.addEventListener('load', () => { const rf0 = UI.refresh; UI.refresh = function () { const r = rf0.apply(this, arguments); try { const S = CG.S; if (!S || !S.player) return r; const on = !!Ar.arc(), cle = on ? 'f' + Ar.fleches() : '';
      if (cle !== vu) { vu = cle; if (!el) { const hp = document.getElementById('bar-hp'), hud = hp && hp.parentElement && hp.parentElement.parentElement; if (!hud) return r; el = document.createElement('div'); el.id = 'hud-fleches'; el.style.cssText = 'margin-top:4px;font:700 13px "Trebuchet MS",system-ui,sans-serif;color:#ffe9c8;text-shadow:0 1px 2px #000'; hud.appendChild(el); }
        el.style.display = on ? '' : 'none'; if (on) { el.textContent = '🏹 ' + Ar.fleches() + ' flèche' + (Ar.fleches() > 1 ? 's' : ''); el.style.color = Ar.fleches() ? '#ffe9c8' : '#ff8a7a'; } } } catch (e) { /* rien */ } return r; }; });
})(window.CG);
