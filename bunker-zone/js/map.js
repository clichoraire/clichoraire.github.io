// ============================================================
//  map.js — Carte découpée en zones
// ============================================================
(function (ZC) {
  'use strict';

  class GameMap {
    constructor(zx, zy, shape) {
      this.shape = shape; this.cells = [];
      this.zx = zx; this.zy = zy;
      this.w = zx * ZC.ZONE_PX; this.h = zy * ZC.ZONE_PX;
      this.zones = [];
      const mx = Math.floor(zx / 2), my = Math.floor(zy / 2);
      for (let iy = 0; iy < zy; iy++) {
        for (let ix = 0; ix < zx; ix++) {
          if (shape === 'corridor' && iy !== 1 && ix !== 0 && ix !== zx - 1) continue;
          this.zones.push({
            id: this.zones.length, ix, iy,
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
      for (const z of this.zones) this.cells[z.iy * zx + z.ix] = z;
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
      return this.cells[iy * this.zx + ix] || null;
    }
    zoneAt(x, y) { return this.zone(Math.floor(x / ZC.ZONE_PX), Math.floor(y / ZC.ZONE_PX)); }
    zoneIndexAt(x, y) {
      const ix = ZC.clamp(Math.floor(x / ZC.ZONE_PX), 0, this.zx - 1);
      const iy = ZC.clamp(Math.floor(y / ZC.ZONE_PX), 0, this.zy - 1);
      return (this.zone(ix, iy) || this.nearest(x, y)).id;
    }
    nearest(x, y) { return this.zones.reduce((a, b) => Math.hypot(a.cx-x,a.cy-y) < Math.hypot(b.cx-x,b.cy-y) ? a : b); }
    // Les déplacements passent par le centre du couloir avant de rejoindre une aile.
    waypoint(x, y, tx, ty) {
      if (this.shape !== 'corridor') return { x: tx, y: ty };
      const P = ZC.ZONE_PX, middle = P * 1.5;
      const wing = v => v < P ? 0 : v >= (this.zx-1)*P ? 1 : -1;
      if (wing(x) !== wing(tx)) {
        if (y < P+24 || y > P*2-24) return { x, y: middle };
        if (ty < P+24 || ty > P*2-24) return { x: tx, y: middle };
      }
      return { x: tx, y: ty };
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
