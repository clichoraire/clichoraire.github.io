// ============================================================
//  utils.js — Fonctions utilitaires et grille spatiale
// ============================================================
(function (ZC) {
  'use strict';

  ZC.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  ZC.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  ZC.lerp = (a, b, t) => a + (b - a) * t;
  ZC.rand = (a, b) => a + Math.random() * (b - a);
  ZC.randInt = (a, b) => Math.floor(ZC.rand(a, b + 1));
  ZC.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  ZC.angleLerp = (a, b, t) => {
    const d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    return a + d * t;
  };
  ZC.formatTime = (s) => {
    s = Math.max(0, Math.floor(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };

  const rgbCache = new Map();
  ZC.hexToRgb = (hex) => {
    let c = rgbCache.get(hex);
    if (c) return c;
    const n = parseInt(hex.slice(1), 16);
    c = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    rgbCache.set(hex, c);
    return c;
  };
  ZC.rgba = (hex, a) => {
    const c = ZC.hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  };
  ZC.shade = (hex, f) => {
    const c = ZC.hexToRgb(hex);
    const r = ZC.clamp(Math.round(c.r * f), 0, 255), g = ZC.clamp(Math.round(c.g * f), 0, 255), b = ZC.clamp(Math.round(c.b * f), 0, 255);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  };

  // Générateur pseudo-aléatoire déterministe (LCG)
  ZC.seededRandom = (seed) => {
    let s = seed >>> 0;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };

  ZC.shuffle = (arr, rnd) => {
    rnd = rnd || Math.random;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };

  // Positions de formation (anneaux concentriques) pour un groupe d'unités
  ZC.formation = (n, spacing) => {
    const out = [{ dx: 0, dy: 0 }];
    let ring = 1;
    while (out.length < n) {
      const count = Math.max(6, Math.round(2 * Math.PI * ring * spacing / spacing));
      for (let i = 0; i < count && out.length < n; i++) {
        const a = (i / count) * Math.PI * 2 + ring * 0.4;
        out.push({ dx: Math.cos(a) * ring * spacing, dy: Math.sin(a) * ring * spacing });
      }
      ring++;
    }
    return out;
  };

  // Grille spatiale pour les recherches de voisinage
  class SpatialHash {
    constructor(cell) {
      this.cell = cell;
      this.map = new Map();
    }
    clear() { this.map.clear(); }
    _key(cx, cy) { return (cx + 2) * 8192 + (cy + 2); }
    insert(u) {
      const k = this._key(Math.floor(u.x / this.cell), Math.floor(u.y / this.cell));
      let arr = this.map.get(k);
      if (!arr) { arr = []; this.map.set(k, arr); }
      arr.push(u);
    }
    query(x, y, r, out) {
      out.length = 0;
      const c = this.cell;
      const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c);
      const y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
      for (let cx = x0; cx <= x1; cx++) {
        for (let cy = y0; cy <= y1; cy++) {
          const arr = this.map.get(this._key(cx, cy));
          if (arr) for (let i = 0; i < arr.length; i++) out.push(arr[i]);
        }
      }
      return out;
    }
  }
  ZC.SpatialHash = SpatialHash;
})(window.ZC);
