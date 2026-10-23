// ============================================================
//  planet.js — Planète procédurale en fond de l'écran d'aventure.
//  Une planète par monde (race attaquée) : bruit 3D sur une sphère, éclairage,
//  atmosphère, étoiles. Dessinée une fois par monde et par taille d'écran.
// ============================================================
(function (ZC) {
  'use strict';

  // Bruit de valeur 3D (interpolation lisse entre des valeurs pseudo-aléatoires sur une grille)
  const hash = (x, y, z, seed) => {
    let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 1013904223) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const fade = (t) => t * t * (3 - 2 * t);
  const noise3 = (x, y, z, seed) => {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    const fx = fade(x - X), fy = fade(y - Y), fz = fade(z - Z);
    const lerp = (a, b, t) => a + (b - a) * t;
    const c = (dx, dy, dz) => hash(X + dx, Y + dy, Z + dz, seed);
    return lerp(
      lerp(lerp(c(0, 0, 0), c(1, 0, 0), fx), lerp(c(0, 1, 0), c(1, 1, 0), fx), fy),
      lerp(lerp(c(0, 0, 1), c(1, 0, 1), fx), lerp(c(0, 1, 1), c(1, 1, 1), fx), fy), fz);
  };
  const fbm = (x, y, z, seed, oct) => {
    let v = 0, a = 0.5, f = 1, sum = 0;
    for (let i = 0; i < oct; i++) { v += a * noise3(x * f, y * f, z * f, seed + i * 7); sum += a; a *= 0.5; f *= 2.1; }
    return v / sum;
  };

  // Styles de surface : (n = relief 0..1, m = bruit secondaire, ridge = crêtes) -> [r, g, b]
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const STYLES = {
    // Terra Prime : océans, continents verts, calottes, nuages
    human: {
      seed: 11, scale: 2.6, atmo: [110, 180, 255], glow: 0.55, clouds: true,
      color(n, m, lat) {
        if (n < 0.5) return mix([8, 30, 80], [20, 70, 150], n / 0.5);
        if (n < 0.53) return [120, 150, 100];
        const land = mix([60, 120, 50], [130, 140, 80], (n - 0.53) / 0.3);
        const c = n > 0.72 ? mix(land, [220, 220, 215], Math.min(1, (n - 0.72) / 0.1)) : land;
        return Math.abs(lat) > 0.82 ? mix(c, [235, 240, 250], Math.min(1, (Math.abs(lat) - 0.82) / 0.1)) : c;
      },
    },
    // Nidus : croûte brune craquelée, veines organiques orange, cuves sombres
    insect: {
      seed: 23, scale: 3.2, atmo: [255, 110, 60], glow: 0.5, clouds: false,
      color(n, m, lat, ridge) {
        const base = mix([70, 28, 18], [140, 70, 40], n);
        const vein = Math.pow(1 - Math.min(1, Math.abs(ridge - 0.5) * 7), 3);
        const c = mix(base, [255, 130, 80], vein * 0.9);
        return m > 0.68 ? mix(c, [25, 8, 10], Math.min(1, (m - 0.68) / 0.08)) : c;
      },
    },
    // Lumen : monde cristallin bleu-violet, facettes brillantes, anneau
    energy: {
      seed: 37, scale: 2.2, atmo: [160, 190, 255], glow: 0.7, clouds: false, ring: [200, 170, 255],
      color(n, m, lat, ridge) {
        const facet = Math.floor(n * 9) / 9;
        const base = mix([30, 30, 110], [120, 90, 220], facet);
        const edge = Math.abs(n * 9 - Math.round(n * 9)) < 0.06 ? 1 : 0;
        const c = mix(base, [200, 230, 255], edge * 0.8 + (m > 0.72 ? (m - 0.72) * 3 : 0));
        return c;
      },
    },
    // Forge-Oméga : planète-usine grise, plaques, lumières orange, anneau de débris
    mecha: {
      seed: 51, scale: 3.8, atmo: [200, 210, 230], glow: 0.3, clouds: false, ring: [120, 130, 150],
      color(n, m, lat, ridge, u, v) {
        const panel = ((Math.floor(u * 28) + Math.floor(v * 14)) % 2) ? 0.04 : 0;
        const base = mix([48, 52, 62], [110, 116, 130], n + panel);
        const seam = (u * 28) % 1 < 0.06 || (v * 14) % 1 < 0.08 ? 0.5 : 0;
        const light = m > 0.66 && ((u * 56) % 1 < 0.5) ? Math.min(1, (m - 0.66) * 5) : 0;
        return mix(mix(base, [15, 16, 20], seam), [255, 120, 40], light);
      },
    },
  };

  const cache = {};
  // Dessine la planète dans un canvas hors écran de diamètre d (mémorisé par race et taille)
  function planetSprite(race, d) {
    const key = race + ':' + d;
    if (cache[key]) return cache[key];
    const st = STYLES[race] || STYLES.human, pad = Math.round(d * 0.18), S = d + pad * 2;
    const cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const ctx = cv.getContext('2d');
    // halo atmosphérique
    const [ar, ag, ab] = st.atmo, c = S / 2, R = d / 2;
    const g = ctx.createRadialGradient(c, c, R * 0.92, c, c, R + pad);
    g.addColorStop(0, `rgba(${ar},${ag},${ab},${st.glow})`); g.addColorStop(0.35, `rgba(${ar},${ag},${ab},${st.glow * 0.25})`); g.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    // surface : pixel par pixel
    const img = ctx.createImageData(d, d), px = img.data, L = [-0.55, -0.45, 0.7];
    const ll = Math.hypot(L[0], L[1], L[2]); L[0] /= ll; L[1] /= ll; L[2] /= ll;
    for (let y = 0; y < d; y++) for (let x = 0; x < d; x++) {
      const nx = (x + 0.5 - R) / R, ny = (y + 0.5 - R) / R, rr = nx * nx + ny * ny;
      if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr);
      const u = Math.atan2(nx, nz) / Math.PI * 0.5 + 0.5, v = ny * 0.5 + 0.5;
      const sc = st.scale, n = fbm(nx * sc + 10, ny * sc + 10, nz * sc + 10, st.seed, 5);
      const m = fbm(nx * sc * 1.7 + 50, ny * sc * 1.7, nz * sc * 1.7, st.seed + 100, 3);
      const ridge = noise3(nx * sc * 2.5, ny * sc * 2.5, nz * sc * 2.5, st.seed + 200);
      let col = st.color(n, m, ny, ridge, u, v);
      if (st.clouds) { const cl = fbm(nx * 4 + 3, ny * 4, nz * 4 + 7, st.seed + 300, 4); if (cl > 0.55) col = mix(col, [255, 255, 255], Math.min(1, (cl - 0.55) * 3.5)); }
      const diff = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      const rim = Math.pow(1 - nz, 2.5);
      const light = 0.08 + diff * 0.95;
      const edge = Math.min(1, (1 - rr) * R * 0.5);  // anticrénelage du bord
      const i = (y * d + x) * 4;
      px[i] = Math.min(255, col[0] * light + ar * rim * 0.6); px[i + 1] = Math.min(255, col[1] * light + ag * rim * 0.6); px[i + 2] = Math.min(255, col[2] * light + ab * rim * 0.6); px[i + 3] = 255 * edge;
    }
    ctx.putImageData(img, pad, pad);
    if (st.ring) { // anneau incliné, passant derrière la planète pour sa moitié haute
      const [rr, rg, rb] = st.ring;
      const drawRing = (front) => {
        ctx.save(); ctx.translate(c, c); ctx.rotate(-0.35); ctx.scale(1, 0.22);
        ctx.beginPath(); ctx.rect(-S, front ? 0 : -S, S * 2, S);
        ctx.clip();
        for (let k = 0; k < 7; k++) {
          const rad = R * (1.35 + k * 0.045), a = 0.35 - k * 0.04;
          ctx.strokeStyle = `rgba(${rr},${rg},${rb},${a})`; ctx.lineWidth = R * 0.025; ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
      };
      ctx.globalCompositeOperation = 'destination-over'; drawRing(false);
      ctx.globalCompositeOperation = 'source-over'; drawRing(true);
    }
    return (cache[key] = cv);
  }

  // Fond complet : étoiles, nébuleuse colorée et planète en bas à droite
  ZC.drawPlanetBackground = function (canvas, world, W, H) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d'), st = STYLES[world.race] || STYLES.human;
    ctx.fillStyle = '#04060c'; ctx.fillRect(0, 0, W, H);
    const rnd = ZC.seededRandom(st.seed * 977);
    const [ar, ag, ab] = st.atmo;
    const neb = ctx.createRadialGradient(W * 0.25, H * 0.3, 0, W * 0.25, H * 0.3, Math.max(W, H) * 0.7);
    neb.addColorStop(0, `rgba(${ar},${ag},${ab},0.10)`); neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 420; i++) {
      const x = rnd() * W, y = rnd() * H, s = rnd() < 0.08 ? 2 : 1, a = 0.25 + rnd() * 0.75;
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(x, y, s, s);
    }
    const d = Math.round(Math.min(H * 1.25, W * 0.7));
    const sp = planetSprite(world.race, d);
    ctx.drawImage(sp, W * 0.62 - sp.width / 2, H * 0.72 - sp.height / 2);
  };
})(window.ZC);
