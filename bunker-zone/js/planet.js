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

  ZC.planetSprite = planetSprite;
  const thumbs = {};
  // Vignette (data URL) d'une planète pour les onglets des mondes
  ZC.planetThumb = function (race, d) {
    const key = race + ':' + d;
    if (!thumbs[key]) thumbs[key] = planetSprite(race, d).toDataURL();
    return thumbs[key];
  };

  // Paysage d'une mission : un coin de terrain du monde (vrai générateur de carte), l'avant-poste ennemi et nos troupes
  const terrains = {};
  ZC.drawMissionScene = function (canvas, m, w, W, H) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d'), st = m.settings, tileset = st.tileset || w.tileset;
    if (!terrains[tileset]) terrains[tileset] = ZC.buildTerrain(new ZC.GameMap(2, 2), tileset, 4242);
    const ter = terrains[tileset], Z = ZC.ZONE_PX, sc = 0.9, sw = W / sc, sh = H / sc;
    const rnd = ZC.seededRandom(97 + m.index * 31 + w.id.charCodeAt(1) * 7);
    // fenêtre autour du centre de la zone en haut à gauche, décalée au hasard
    const sx = Z / 2 - sw * 0.45 + rnd() * 16, sy = Z / 2 - sh * 0.5 + rnd() * 12;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(ter, sx, sy, sw, sh, 0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.save(); ctx.scale(sc, sc); ctx.translate(-sx, -sy);
    const race = ZC.RACES[w.race], enemy = '#f04040', me = '#5a9ad8';
    const unit = (type, color, x, y, facing) => { ctx.save(); ctx.translate(x, y); ctx.rotate(facing); ZC.drawUnitSprite(ctx, type, color, 0, false, 0, 0, null, facing); ctx.restore(); };
    const o = m.objective;
    if (st.invasion) { // survie : pas de base ennemie, une nuée qui arrive par la droite
      unit('bunker', me, Z / 2 - 60, Z / 2 - 5, 0);
      for (let k = 0; k < 6; k++) unit(k % 3 === 2 ? race.l2 : race.l1, enemy, Z / 2 + 40 + rnd() * 70, Z / 2 - 55 + rnd() * 105, Math.PI);
      for (let k = 0; k < 3; k++) unit('marine', me, Z / 2 - 20 + rnd() * 16, Z / 2 - 40 + k * 32, 0);
    } else {
      unit(o.type === 'rounds' ? 'bunker' : m.index >= 6 ? 'hq' : 'bunker', enemy, Z / 2 + 35, Z / 2 - 15, 0);
      const n = 2 + Math.min(4, Math.floor(m.index / 3));
      for (let k = 0; k < n; k++) unit(k % 2 && m.index > 4 ? race.l2 : race.l1, enemy, Z / 2 + 5 + rnd() * 95, Z / 2 + 15 + rnd() * 35, Math.PI);
      for (let k = 0; k < 3; k++) unit(k === 1 && m.index > 2 ? 'exomarine' : 'marine', me, Z / 2 - 92 + rnd() * 14, Z / 2 - 42 + k * 30, 0);
      if (st.teams) unit('marine', '#ffd040', Z / 2 - 85, Z / 2 + 52, 0);
    }
    ctx.restore();
    // vignettage
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  };

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
  // Illustrations des cartes « Jouer » (dessinées avec les sprites du jeu, à l'échelle 2 pour rester nettes)
  //  simple    : bataille sur le terrain, engrenages de réglages à gauche
  //  adventure : espace, planètes des mondes, dropship et héros exo-marine
  ZC.drawCardArt = function (canvas, kind) {
    const ctx = canvas.getContext('2d'), W = canvas.width / 2, H = canvas.height / 2;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const unit = (type, color, x, y, facing, sc, up) => { ctx.save(); ctx.translate(x, y); ctx.rotate(facing); ctx.scale(sc || 1, sc || 1); ZC.drawUnitSprite(ctx, type, color, 0, false, 0, 0, up || null, facing); ctx.restore(); };
    const rnd = ZC.seededRandom(kind === 'simple' ? 4242 : 7373);
    if (kind === 'simple') {
      if (!terrains.jungle) terrains.jungle = ZC.buildTerrain(new ZC.GameMap(2, 2), 'jungle', 4242);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(terrains.jungle, 60, 80, W * 0.8, H * 0.8, 0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      // bataille : marines bleus à gauche, essaim rouge à droite, explosions et traçantes
      const me = '#4a8ad8', enemy = '#e04030';
      for (let k = 0; k < 4; k++) unit(k === 1 ? 'exomarine' : 'marine', me, 150 + rnd() * 20, 30 + k * 26, 0, 1.25, { weapons: 2, armor: 1 });
      for (let k = 0; k < 6; k++) unit(k % 3 === 1 ? 'beast' : 'runner', enemy, 250 + rnd() * 90, 20 + rnd() * 95, Math.PI, 1.25);
      for (let k = 0; k < 5; k++) { // explosions orange
        const x = 225 + rnd() * 110, y = 25 + rnd() * 90, r = 8 + rnd() * 12;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,245,200,0.95)'); g.addColorStop(0.35, 'rgba(255,160,40,0.85)'); g.addColorStop(1, 'rgba(255,80,20,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,230,120,0.85)'; ctx.lineWidth = 1.2;
      for (let k = 0; k < 6; k++) { const y = 30 + rnd() * 90, x = 170 + rnd() * 20; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 + rnd() * 40, y + (rnd() - 0.5) * 12); ctx.stroke(); }
      // volet sombre à gauche avec engrenages (réglages) et une petite carte
      const sh = ctx.createLinearGradient(0, 0, W * 0.5, 0);
      sh.addColorStop(0, 'rgba(6,10,18,0.96)'); sh.addColorStop(0.7, 'rgba(6,10,18,0.75)'); sh.addColorStop(1, 'rgba(6,10,18,0)');
      ctx.fillStyle = sh; ctx.fillRect(0, 0, W * 0.5, H);
      const gear = (x, y, r, n, col) => {
        ctx.save(); ctx.translate(x, y); ctx.beginPath();
        for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 0.78; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        ctx.closePath(); ctx.fillStyle = col; ctx.strokeStyle = '#0a0c10'; ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fillStyle = '#0a0c10'; ctx.fill();
        ctx.restore();
      };
      gear(44, 50, 28, 9, '#c8d2de'); gear(92, 26, 16, 7, '#9aa6b6');
      ctx.save(); ctx.translate(104, 72); ctx.rotate(-0.12);
      ctx.fillStyle = '#d8c89a'; ctx.strokeStyle = '#0a0c10'; ctx.lineWidth = 2; ctx.fillRect(-26, -16, 52, 34); ctx.strokeRect(-26, -16, 52, 34);
      ctx.fillStyle = '#7fb15a'; ctx.fillRect(-22, -12, 44, 26); ctx.strokeStyle = 'rgba(40,60,30,0.6)'; ctx.lineWidth = 1;
      for (let i = -22; i <= 22; i += 11) { ctx.beginPath(); ctx.moveTo(i, -12); ctx.lineTo(i, 14); ctx.stroke(); }
      for (let j = -12; j <= 14; j += 13) { ctx.beginPath(); ctx.moveTo(-22, j); ctx.lineTo(22, j); ctx.stroke(); }
      ctx.restore();
    } else {
      ctx.fillStyle = '#04060c'; ctx.fillRect(0, 0, W, H);
      const neb = ctx.createRadialGradient(W * 0.35, H * 0.4, 0, W * 0.35, H * 0.4, W * 0.6);
      neb.addColorStop(0, 'rgba(120,80,200,0.28)'); neb.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 160; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + rnd() * 0.7) + ')'; ctx.fillRect(rnd() * W, rnd() * H, rnd() < 0.1 ? 2 : 1, 1); }
      const planet = (race, d, x, y) => { const sp = planetSprite(race, d); ctx.drawImage(sp, x - sp.width / 2, y - sp.height / 2); };
      planet('human', 86, 62, 62); planet('insect', 34, 148, 30); planet('energy', 40, 170, 98); planet('mecha', 22, 118, 108);
      unit('dropship', '#8fb0d8', 236, 48, 0, 2.6);
      unit('exomarine', '#5a9ad8', 316, 74, Math.PI, 2.3, { weapons: 3, armor: 3 });
      // halo bleu derrière le héros
      const halo = ctx.createRadialGradient(318, 70, 10, 318, 70, 70);
      halo.addColorStop(0, 'rgba(90,170,255,0.25)'); halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = halo; ctx.fillRect(240, 0, W - 240, H); ctx.globalCompositeOperation = 'source-over';
    }
    // assombrissement du bas pour le bandeau du titre
    const bot = ctx.createLinearGradient(0, H * 0.55, 0, H);
    bot.addColorStop(0, 'rgba(0,0,0,0)'); bot.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = bot; ctx.fillRect(0, 0, W, H);
  };
})(window.ZC);
