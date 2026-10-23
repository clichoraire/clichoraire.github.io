// ============================================================
//  map.js — Carte découpée en zones
// ============================================================
(function (ZC) {
  'use strict';

  class GameMap {
    constructor(zx, zy) {
      this.zx = zx; this.zy = zy;
      this.w = zx * ZC.ZONE_PX; this.h = zy * ZC.ZONE_PX;
      this.zones = [];
      const mx = Math.floor(zx / 2), my = Math.floor(zy / 2);
      for (let iy = 0; iy < zy; iy++) {
        for (let ix = 0; ix < zx; ix++) {
          this.zones.push({
            id: iy * zx + ix, ix, iy,
            x: ix * ZC.ZONE_PX, y: iy * ZC.ZONE_PX,
            cx: ix * ZC.ZONE_PX + ZC.ZONE_PX / 2, cy: iy * ZC.ZONE_PX + ZC.ZONE_PX / 2,
            owner: -1,        // index du joueur propriétaire, -1 = neutre
            capturer: -1,     // joueur en train de capturer
            captureT: 0,      // progression de la capture (s)
            super: ix === mx && iy === my, // zone centrale : production doublée
            cnt: null,        // unités présentes par joueur (rempli par Game)
            flashT: 0,        // animation lors d'un changement de propriétaire
          });
        }
      }
      // Pré-calcul des voisins (4 et 8 directions)
      this._nb4 = []; this._nb8 = [];
      for (const z of this.zones) {
        const n4 = [], n8 = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const n = this.zone(z.ix + dx, z.iy + dy);
            if (!n) continue;
            n8.push(n);
            if (!dx || !dy) n4.push(n);
          }
        }
        this._nb4.push(n4); this._nb8.push(n8);
      }
    }

    zone(ix, iy) {
      if (ix < 0 || iy < 0 || ix >= this.zx || iy >= this.zy) return null;
      return this.zones[iy * this.zx + ix];
    }
    zoneAt(x, y) { return this.zone(Math.floor(x / ZC.ZONE_PX), Math.floor(y / ZC.ZONE_PX)); }
    zoneIndexAt(x, y) {
      const ix = ZC.clamp(Math.floor(x / ZC.ZONE_PX), 0, this.zx - 1);
      const iy = ZC.clamp(Math.floor(y / ZC.ZONE_PX), 0, this.zy - 1);
      return iy * this.zx + ix;
    }
    neighbors(z, diag) { return diag ? this._nb8[z.id] : this._nb4[z.id]; }
    isDiagonal(a, b) { return a.ix !== b.ix && a.iy !== b.iy; }
    manhattan(a, b) { return Math.abs(a.ix - b.ix) + Math.abs(a.iy - b.iy); }

    // Zones de départ : coins, puis milieux des bords, puis le reste
    startPositions(n) {
      const zx = this.zx, zy = this.zy, mx = Math.floor(zx / 2), my = Math.floor(zy / 2);
      const order = [
        [0, 0], [zx - 1, zy - 1], [zx - 1, 0], [0, zy - 1],
        [mx, 0], [mx, zy - 1], [0, my], [zx - 1, my],
      ];
      const picked = [];
      const seen = new Set();
      for (const [ix, iy] of order) {
        const z = this.zone(ix, iy);
        if (z && !seen.has(z.id) && !z.super) { seen.add(z.id); picked.push(z); }
        if (picked.length >= n) break;
      }
      // Cartes minuscules : compléter avec n'importe quelle zone non centrale
      for (const z of this.zones) {
        if (picked.length >= n) break;
        if (!seen.has(z.id) && !z.super) { seen.add(z.id); picked.push(z); }
      }
      return picked.slice(0, n);
    }
  }
  ZC.GameMap = GameMap;
})(window.ZC);
