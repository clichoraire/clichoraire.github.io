// Goblin Malin — chantiers : un bouton ✖ pour annuler un arpentage, et des bricoleurs qui réparent les constructions abîmées (ça coûte du bois, petit à petit).
'use strict';
(function (CG) {
  const G = CG.G, T = CG.TILE, Ch = CG.Chantier = {};
  const FIXES = ['hut', 'chief', 'fire', 'stock']; // en ruine, ceux-là ne s'enlèvent pas : des gobelins y habitent
  Ch.canCancel = b => !!(b && b.site && !(b.ruin && FIXES.includes(b.type)));
  Ch.btn = b => ({ x: (b.tx + b.w) * T - 4, y: b.ty * T + 4 }); // le ✖, dans le coin en haut à droite du chantier
  Ch.cancel = function (b) {
    const S = CG.S; if (!Ch.canCancel(b) || S.buildings.indexOf(b) < 0) return;
    const d = CG.BUILDS[b.type], c = { x: (b.tx + b.w / 2) * T, y: (b.ty + b.h / 2) * T };
    S.goblins.forEach(g => { if (g.siteB === b) { g.siteB = null; if (g.state === 'build' || g.state === 'toSite') { g.state = 'idle'; g.pose = null; g.timer = 0.4; } } });
    G.removeBuilding(b); CG.sfx('chop');
    if (!b.ruin && d && d.cout) { let k = 0; for (const r in d.cout) if (d.cout[r]) G.gain(r, d.cout[r], c.x, c.y - 20 - (k++) * 16); } // rien n'était bâti : tout est rendu
    G.text(c.x, c.y - 50, 'Chantier annulé', '#ffd0a0', true);
  };
  // clic sur le ✖ : on demande avant de tout enlever
  Ch.click = function (wx, wy) {
    for (const b of CG.S.buildings) {
      if (!Ch.canCancel(b)) continue; const q = Ch.btn(b); if (Math.hypot(wx - q.x, wy - q.y) > 15) continue;
      const d = CG.BUILDS[b.type]; CG.sfx('ok');
      CG.UI.dialog({ who: 'Chantier : ' + d.nom, tag: Math.round(100 * b.prog / b.need) + ' % bâti', text: b.ruin ? 'Enlever ces ruines ? Elles ne seront pas rebâties, et rien ne t\'est rendu.' : 'Annuler ce chantier ? Il est retiré et tout ce que tu as payé t\'est rendu.', options: [{ label: '✖ Oui, annuler le chantier', fn: () => Ch.cancel(b) }, { label: 'Non, on continue' }] });
      return true;
    }
    return false;
  };
  Ch.draw = function (g, b, t) {
    if (!Ch.canCancel(b)) return; const q = Ch.btn(b);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(q.x, q.y + 2, 12, 0, 6.3); g.fill();
    g.fillStyle = '#d83a2a'; g.beginPath(); g.arc(q.x, q.y, 12, 0, 6.3); g.fill(); g.fillStyle = '#f0604a'; g.beginPath(); g.arc(q.x, q.y - 2, 9.5, 0, 6.3); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(q.x - 4.5, q.y - 5); g.lineTo(q.x + 4.5, q.y + 3.5); g.moveTo(q.x + 4.5, q.y - 5); g.lineTo(q.x - 4.5, q.y + 3.5); g.stroke();
  };

  // ---------- réparations par les bricoleurs ----------
  Ch.SEC = 16;    // secondes pour réparer une construction entièrement détruite, à vitesse normale
  const boisPour = b => { const c = CG.BUILDS[b.type] && CG.BUILDS[b.type].cout; return Math.max(3, Math.round(((c && c.bois) || 10) * 0.5)); }; // bois pour une réparation complète
  const abime = b => !b.site && !b.gone && (!!b.upg || (b.hp !== undefined && b.hp < G.buildMaxHp(b) - 0.5)); // abîmée, ou en cours d'amélioration
  function stop(g) { g.repB = null; g.repW = 0; if (g.state === 'toRep' || g.state === 'repair') { g.state = 'idle'; g.pose = null; g.timer = 0.6; } }
  function repStep(g, dt) {
    const S = CG.S, R = CG.R, b = g.repB;
    if (!b || !abime(b) || S.buildings.indexOf(b) < 0 || S.buildings.some(s => s.site)) { stop(g); return false; } // un chantier passe avant
    if (g.state === 'toRep') { if (G.follow(g, 96, dt)) { g.state = 'repair'; g.face = (b.tx + b.w / 2) * T > g.x ? 1 : -1; } return true; }
    if (b.upg) { b.upg.prog += dt * G.workSpeed(g); if (CG.Arrivee) CG.Arrivee.bricole(g, dt * G.workSpeed(g)); g.moving = false; g.pose = 'work'; if (Math.random() < dt * 2.5) { G.puff((b.tx + Math.random() * b.w) * T, (b.ty + b.h) * T - 8 - Math.random() * 26, '#c9c2b0', 2, 50, 2.5); if (CG.onScreen(g.x, g.y)) CG.sfx('chop'); } return true; } // déjà payée : il n'y a qu'à travailler
    if (S.res.bois < 1) { G.text(g.x, g.y - 46, 'Plus de bois pour réparer !', '#ffb0a0'); g.repCd = 20; stop(g); return false; }
    const mh = G.buildMaxHp(b), add = mh / Ch.SEC * dt * G.workSpeed(g), real = Math.min(add, mh - b.hp);
    b.hp += real; g.moving = false; g.pose = 'work'; b.repW = (b.repW || 0) + real / mh * boisPour(b); // compté sur la construction : à plusieurs, le bois part quand même
    if (b.repW >= 1) { b.repW -= 1; S.res.bois -= 1; G.text(g.x + CG.rand(-8, 8), g.y - 48, '-1 🪵', '#ffd0a0'); }
    if (Math.random() < dt * 2.5) { G.puff((b.tx + Math.random() * b.w) * T, (b.ty + b.h) * T - 8 - Math.random() * 26, '#c9a56b', 2, 50, 2.5); if (CG.onScreen(g.x, g.y)) CG.sfx('chop'); }
    if (b.hp >= mh - 0.5) { b.hp = mh; b.warned = false; G.text((b.tx + b.w / 2) * T, b.ty * T - 6, '🔧 Réparé !', '#c8ffb0', true); G.gobXp(g, 1, 5); stop(g); }
    return true;
  }
  const bj = G.buildJob;
  G.buildJob = function (g, dt) {
    if (g.repB && (g.state === 'toRep' || g.state === 'repair')) { if (repStep(g, dt)) return true; }
    if (bj.apply(this, arguments)) return true;
    const S = CG.S; if (g.repCd > 0) { g.repCd -= dt; return false; } if (CG.R.alarm) return false; const sec = S.res.bois < 1;
    let b = null, bd = 1e9; for (const s of S.buildings) { if (!abime(s) || (sec && !s.upg)) continue; const d = Math.hypot((s.tx + s.w / 2) * T - g.x, (s.ty + s.h) * T - g.y); if (d < bd) { bd = d; b = s; } }
    if (!b) return false;
    const d = G.door(b); if (!G.goTo(g, d.x + CG.rand(-b.w * 12, b.w * 12), d.y - 8 + CG.rand(-4, 6))) { g.repCd = 6; return false; }
    g.repB = b; g.repW = 0; g.state = 'toRep'; g.bubble = null; return true;
  };
})(window.CG);
