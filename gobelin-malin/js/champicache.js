// Goblin Malin — le champignon embusqué. Certains Champis-toupies ne rôdent pas : ils se cachent derrière un arbre, au bord
// d'un chemin, et ne bougent plus. On ne voit dépasser qu'un bout de chapeau. Quand le chef passe tout près, le champignon
// bondit hors de sa cachette et lui fonce dessus en tournant comme une toupie. Rien ne l'annonce.
// Tout est réglable dans CG.ChampiCache.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, T = CG.TILE, rand = CG.rand;
  const Cc = CG.ChampiCache = { JOUR: 2, NB: [2, 5], PAR_JOUR: 0.25, SAUTE: 115, LOIN_FEU: 13, PRES_CHEMIN: 3, DECALE: 15, TYPE: 'champiToupie' }; /* NB : de 2 embusqués au début jusqu'à 5 ; SAUTE : distance à laquelle il bondit ; DECALE : de combien il dépasse de l'arbre */
  const ici = () => !CG.Mondes || CG.Mondes.ici() < 2;
  function places(n) {
    const out = [], f = G.firePos(), fx = f.x / T, fy = f.y / T, tile = W.tile, I = W.idx;
    const chemin = (x, y) => { for (let dy = -Cc.PRES_CHEMIN; dy <= Cc.PRES_CHEMIN; dy++) for (let dx = -Cc.PRES_CHEMIN; dx <= Cc.PRES_CHEMIN; dx++) if (W.inMap(x + dx, y + dy) && tile[I(x + dx, y + dy)] === W.PATH) return true; return false; };
    for (let k = 0; k < 900 && out.length < n; k++) { const x = 3 + Math.floor(Math.random() * (CG.MW - 6)), y = 4 + Math.floor(Math.random() * (CG.MH - 7));
      if (tile[I(x, y)] !== W.TREE || !W.walkTile(x, y - 1) || Math.hypot(x - fx, y - fy) < Cc.LOIN_FEU || !chemin(x, y)) continue;
      const s = Math.random() < 0.5 ? -1 : 1, px = x * T + T / 2 + s * Cc.DECALE, py = (y - 1) * T + T * 0.72; if (!W.walkPx(px, py) || out.some(o => Math.hypot(o.x - px, o.y - py) < 300)) continue;
      out.push({ x: px, y: py, s }); }
    return out;
  }
  Cc.poser = function (n) {
    const S = CG.S; if (!CG.ENEMIES[Cc.TYPE]) return 0; let nb = 0;
    for (const q of places(n)) { const e = G.spawnEnemy(Cc.TYPE, q.x, q.y, { wild: true, exact: true }); if (!e) continue; e.embusque = true; e.calm = true; e.aggroR = 0; e.face = q.s; e.leash = 700; nb++; }
    return nb;
  };
  const rw0 = D.rollWild; D.rollWild = function () { const r = rw0.apply(this, arguments), S = CG.S; try { if (S && ici() && S.day >= Cc.JOUR) Cc.poser(Math.min(Cc.NB[1], Cc.NB[0] + Math.floor((S.day - Cc.JOUR) * Cc.PAR_JOUR))); } catch (e) { /* jamais bloquant */ } return r; };
  const up0 = G.update; G.update = function (dt) {
    const S = CG.S, R = CG.R;
    if (S && R && R.enemies) { const p = S.player, vu = !(R.ko > 0) && !(R.invis > 0);
      for (const e of R.enemies) { if (!e.embusque || e.dead) continue;
        if (!e.calm || e.hp < e.maxhp || (vu && Math.hypot(p.x - e.x, p.y - e.y) < Cc.SAUTE)) { // le chef est tout près (ou quelqu'un l'a frappé) : il sort d'un bond
          e.embusque = false; e.calm = false; e.aggroR = 340; e.rooted = 0; e.seek = 1.5; e.tpCd = 0; if (vu) e.target = p; e.wild = { x: e.x, y: e.y };
          G.text(e.x, e.y - 50, '❗', '#ffe36b', true); G.puff(e.x, e.y - 10, '#9be04a', 12, 100, 3); if (CG.onScreen(e.x, e.y)) CG.sfx('warning'); continue; }
        e.rooted = Math.max(e.rooted || 0, 0.2); e.target = null; e.path = null; e.moving = false; e.tpCd = 1; if (Math.random() < dt * 0.25) e.face = -e.face; } }
    return up0.apply(this, arguments);
  };
})(window.CG);
