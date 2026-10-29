// ============================================================
//  render.js — Rendu de la carte, des unités et des effets
//  Le rendu interpole entre deux pas de simulation (alpha) pour
//  un mouvement fluide quelle que soit la fréquence d'affichage.
// ============================================================
(function (ZC) {
  'use strict';
  const TAU = Math.PI * 2;

  const TILESETS = {
    jungle:   { base: ['#4e5a2c', '#596434', '#55612f'], alt: ['#7a6a46', '#847455', '#6e5f3e'], light: '#8a9a52', dark: '#2f381b', border: 'rgba(0,0,0,0.5)', borderLight: 'rgba(200,210,160,0.2)', mini: '#3b4322', rock: '#6e6e62', grass: '#86a844' },
    badlands: { base: ['#8a6a44', '#947452', '#866743'], alt: ['#64442f', '#6e4c36', '#5c3f2c'], light: '#b89a78', dark: '#3f2a1b', border: 'rgba(0,0,0,0.5)', borderLight: 'rgba(240,210,170,0.2)', mini: '#5a4530', rock: '#7a6a5a', grass: '#8a7a3a' },
    space:    { base: ['#394049', '#3f4650', '#363d46'], alt: ['#2a303b', '#2f3642', '#262c36'], light: '#5c6679', dark: '#1a1e26', border: 'rgba(0,0,0,0.6)', borderLight: 'rgba(140,170,220,0.28)', mini: '#262a33', rock: '#52586a', grass: '#4a5668' },
  };

  function mix(a, b, t) {
    return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
  }
  function css(c, f) {
    f = f || 1;
    return 'rgb(' + Math.round(c.r * f) + ',' + Math.round(c.g * f) + ',' + Math.round(c.b * f) + ')';
  }
  function smooth(e0, e1, x) { const t = ZC.clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }

  // Bruit de valeur lisse sur une grille
  function makeNoise(rnd, w, h, cell) {
    const gx = Math.ceil(w / cell) + 2, gy = Math.ceil(h / cell) + 2;
    const grid = new Float32Array(gx * gy);
    for (let i = 0; i < grid.length; i++) grid[i] = rnd();
    return (x, y) => {
      const fx = x / cell, fy = y / cell, x0 = Math.floor(fx), y0 = Math.floor(fy);
      const sx = smooth(0, 1, fx - x0), sy = smooth(0, 1, fy - y0);
      const v = (i, j) => grid[j * gx + i];
      const a = v(x0, y0) * (1 - sx) + v(x0 + 1, y0) * sx;
      const b = v(x0, y0 + 1) * (1 - sx) + v(x0 + 1, y0 + 1) * sx;
      return a * (1 - sy) + b * sy;
    };
  }

  function buildTerrain(map, tileset, seed) {
    const pal = TILESETS[tileset] || TILESETS.jungle;
    const c = document.createElement('canvas');
    c.width = map.w; c.height = map.h;
    const g = c.getContext('2d');
    const rnd = ZC.seededRandom(seed || 1337);
    const n1 = makeNoise(rnd, map.w, map.h, 160);
    const n2 = makeNoise(rnd, map.w, map.h, 48);
    const n3 = makeNoise(rnd, map.w, map.h, 28);
    const base = pal.base.map(ZC.hexToRgb), alt = pal.alt.map(ZC.hexToRgb);
    const CELL = 8;
    for (let y = 0; y < map.h; y += CELL) {
      for (let x = 0; x < map.w; x += CELL) {
        const n = n1(x, y) * 0.65 + n2(x, y) * 0.35;
        const d = n3(x, y);
        const bi = Math.floor(d * base.length) % base.length, ai = Math.floor(d * alt.length) % alt.length;
        const col = mix(base[bi], alt[ai], smooth(0.5, 0.68, n));
        g.fillStyle = css(col, 0.97 + d * 0.06);
        g.fillRect(x, y, CELL, CELL);
      }
    }
    // Grains et petits cailloux
    const specks = Math.floor(map.w * map.h / 1400);
    for (let k = 0; k < specks; k++) {
      g.fillStyle = rnd() < 0.5 ? pal.light : pal.dark;
      g.globalAlpha = 0.25 + rnd() * 0.3;
      const s = 1 + Math.floor(rnd() * 2);
      g.fillRect(Math.floor(rnd() * map.w), Math.floor(rnd() * map.h), s, s);
    }
    g.globalAlpha = 1;

    if (tileset === 'space') {
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1;
      for (let x = 0; x <= map.w; x += 64) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, map.h); g.stroke(); }
      for (let y = 0; y <= map.h; y += 64) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(map.w, y + 0.5); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.08)';
      for (let x = 0; x < map.w; x += 64) for (let y = 0; y < map.h; y += 64) { g.fillRect(x + 3, y + 3, 2, 2); g.fillRect(x + 59, y + 59, 2, 2); }
    }

    // Décorations
    for (const z of map.zones) {
      const n = 4 + Math.floor(rnd() * 5);
      for (let k = 0; k < n; k++) {
        const x = z.x + 24 + rnd() * (ZC.ZONE_PX - 48), y = z.y + 24 + rnd() * (ZC.ZONE_PX - 48);
        if (ZC.dist(x, y, z.cx, z.cy) < 70) continue;
        const kind = rnd();
        if (tileset === 'space') {
          if (kind < 0.5) { g.fillStyle = '#1a1d24'; g.fillRect(x - 6, y - 6, 12, 12); g.fillStyle = '#5ad0ff'; g.globalAlpha = 0.7; g.fillRect(x - 2, y - 2, 4, 4); g.globalAlpha = 1; }
          else { g.fillStyle = '#2a2f3a'; g.fillRect(x - 10, y - 3, 20, 6); g.fillStyle = '#4a5062'; g.fillRect(x - 8, y - 1, 16, 2); }
        } else if (kind < 0.4) {
          g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x + 2, y + 3, 7 + rnd() * 5, 4 + rnd() * 3, 0, 0, TAU); g.fill();
          g.fillStyle = pal.rock; g.beginPath(); g.ellipse(x, y, 6 + rnd() * 5, 4 + rnd() * 3, rnd() * 3, 0, TAU); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(x - 2, y - 2, 3, 2, 0, 0, TAU); g.fill();
        } else if (kind < 0.8) {
          g.strokeStyle = pal.grass; g.lineWidth = 1.5;
          g.beginPath();
          for (let j = 0; j < 7; j++) { const a = -Math.PI / 2 + (rnd() - 0.5) * 1.8; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * (5 + rnd() * 7), y + Math.sin(a) * (5 + rnd() * 7)); }
          g.stroke();
        } else {
          g.strokeStyle = pal.dark; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y);
          let px = x, py = y;
          for (let j = 0; j < 4; j++) { px += (rnd() - 0.5) * 20; py += (rnd() - 0.5) * 20; g.lineTo(px, py); }
          g.stroke();
        }
      }
    }

    // Bordures de zones
    for (const z of map.zones) {
      g.strokeStyle = pal.border; g.lineWidth = 3;
      g.strokeRect(z.x + 1.5, z.y + 1.5, ZC.ZONE_PX - 3, ZC.ZONE_PX - 3);
      g.strokeStyle = pal.borderLight; g.lineWidth = 1;
      g.strokeRect(z.x + 4.5, z.y + 4.5, ZC.ZONE_PX - 9, ZC.ZONE_PX - 9);
      g.fillStyle = pal.dark;
      for (const [cx, cy] of [[z.x + 4, z.y + 4], [z.x + ZC.ZONE_PX - 8, z.y + 4], [z.x + 4, z.y + ZC.ZONE_PX - 8], [z.x + ZC.ZONE_PX - 8, z.y + ZC.ZONE_PX - 8]]) g.fillRect(cx, cy, 4, 4);
      // Aire d'atterrissage au centre
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(z.cx, z.cy, 40, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath(); g.arc(z.cx, z.cy, 38, 0, TAU); g.stroke(); g.setLineDash([]);
    }
    if (map.shape) {
      g.fillStyle = '#080d16';
      for (let y=0;y<map.zy;y++) for (let x=0;x<map.zx;x++)
        if (!map.zone(x,y)) g.fillRect(x*ZC.ZONE_PX,y*ZC.ZONE_PX,ZC.ZONE_PX,ZC.ZONE_PX);
    }
    return c;
  }

  class Renderer {
    constructor(canvas, game) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.game = game;
      this.tileset = game.settings.tileset;
      this.terrain = buildTerrain(game.map, this.tileset, 1337 + game.map.zx * 7);
      this.cam = { x: 0, y: 0 };
      this.viewX = 0; this.viewY = 0; this.vw = 800; this.vh = 600;
      this.hpColors = ['#fc3838', '#fcfc38', '#10fc18'];
      this.frameT = 0;
      this.miniPings = [];   // ordres donnés sur la minimap : { x, y, color, t } (monde)
    }

    miniPing(x, y, color) { this.miniPings.push({ x, y, color, t: this.frameT }); if (this.miniPings.length > 6) this.miniPings.shift(); }

    resize(w, h) {
      this.canvas.width = w; this.canvas.height = h;
      this.vw = w; this.vh = h;
    }

    centerOn(x, y) { this.cam.x = x - this.vw / 2; this.cam.y = y - this.vh / 2; }

    clampCamera() {
      const m = this.game.map;
      this.cam.x = m.w > this.vw ? ZC.clamp(this.cam.x, 0, m.w - this.vw) : (m.w - this.vw) / 2;
      this.cam.y = m.h > this.vh ? ZC.clamp(this.cam.y, 0, m.h - this.vh) : (m.h - this.vh) / 2;
      this.viewX = Math.round(this.cam.x); this.viewY = Math.round(this.cam.y);
    }

    draw(input, alpha, dtFrame) {
      const ctx = this.ctx, g = this.game, m = g.map;
      this.frameT += dtFrame || 0;
      const t = this.frameT;
      alpha = alpha === undefined ? 1 : alpha;
      this.clampCamera();
      const vx = this.viewX, vy = this.viewY, vw = this.vw, vh = this.vh;
      // Repère écran imposé à chaque image (pas de save/restore autour du monde : une exception en plein dessin
      // ne doit pas laisser une translation qui se cumule d'image en image et barbouille l'écran)
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.setLineDash([]);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, vw, vh);
      ctx.setTransform(1, 0, 0, 1, -vx, -vy); // repère monde

      const sx = Math.max(0, vx), sy = Math.max(0, vy);
      const ex = Math.min(m.w, vx + vw), ey = Math.min(m.h, vy + vh);
      if (ex > sx && ey > sy) ctx.drawImage(this.terrain, sx, sy, ex - sx, ey - sy, sx, sy, ex - sx, ey - sy);

      const z0x = ZC.clamp(Math.floor(vx / ZC.ZONE_PX), 0, m.zx - 1), z1x = ZC.clamp(Math.floor((vx + vw) / ZC.ZONE_PX), 0, m.zx - 1);
      const z0y = ZC.clamp(Math.floor(vy / ZC.ZONE_PX), 0, m.zy - 1), z1y = ZC.clamp(Math.floor((vy + vh) / ZC.ZONE_PX), 0, m.zy - 1);
      const visZones = [];
      for (let iy = z0y; iy <= z1y; iy++) for (let ix = z0x; ix <= z1x; ix++) { const z = m.zone(ix, iy); if (z) visZones.push(z); }
      this.drawZoneTints(ctx, visZones, input);
      this.drawDecals(ctx, vx, vy, vw, vh);
      for (const z of visZones) this.drawZoneCenter(ctx, z, t);
      for (const z of visZones) if (z.minerals) this.drawMinerals(ctx, z.minerals, t, input && input.hoverPatch === z.minerals);

      // Positions interpolées des unités visibles
      const ground = [], air = [];
      const units = g.units;
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        u.rx = u.prevX + (u.x - u.prevX) * alpha;
        u.ry = u.prevY + (u.y - u.prevY) * alpha;
        u.rf = u.def.structure ? 0 : ZC.angleLerp(u.prevFacing, u.facing, alpha);
        if (u.rx > vx - 60 && u.rx < vx + vw + 60 && u.ry > vy - 60 && u.ry < vy + vh + 60) (u.def.air ? air : ground).push(u);
      }
      ground.sort((a, b) => a.ry - b.ry);

      // Point de ralliement du bunker sélectionné
      for (const sb of g.selectedBunkers) {
        if (!sb.rally) continue;
        ctx.setLineDash([4, 6]); ctx.strokeStyle = ZC.rgba(g.players[sb.owner].hex, 0.7); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(sb.x, sb.y); ctx.lineTo(sb.rally.x, sb.rally.y); ctx.stroke(); ctx.setLineDash([]);
        this.drawFlag(ctx, sb.rally.x, sb.rally.y, g.players[sb.owner].hex, t);
      }

      // En mode « envoyer », on signale les troupes des bunkers sélectionnés
      const sbs = g.selectedBunkers;
      if (input && input.mode === 'send' && sbs.length) {
        ctx.strokeStyle = 'rgba(255,208,64,0.8)'; ctx.lineWidth = 1.2;
        for (let i = 0; i < ground.length; i++) {
          const u = ground[i];
          if (u.def.structure || !sbs.includes(u.home)) continue;
          ctx.beginPath(); ctx.ellipse(u.rx, u.ry + 3, u.radius + 4, (u.radius + 4) * 0.62, 0, 0, TAU); ctx.stroke();
        }
      }
      // Cercles de sélection
      const sel = g.selection;
      for (let i = 0; i < sel.length; i++) {
        const u = sel[i];
        const bob = u.def.air ? -14 : 0;
        ctx.strokeStyle = u.owner === g.humanId ? '#18e818' : g.allied(u.owner, g.humanId) ? '#ffd040' : '#f02020';
        ctx.lineWidth = 1.5;
        const r = u.radius + (u.def.structure ? 6 : 4);
        ctx.beginPath(); ctx.ellipse(u.rx, u.ry + (u.def.structure ? 10 : 3) + bob, r, r * (u.def.structure ? 0.75 : 0.62), 0, 0, TAU); ctx.stroke();
      }
      // Ombres au sol
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      for (let i = 0; i < ground.length; i++) {
        const u = ground[i];
        if (u.def.structure) { ctx.beginPath(); ctx.ellipse(u.rx + 4, u.ry + 6, u.radius * 1.15, u.radius * 0.95, 0, 0, TAU); ctx.fill(); continue; }
        ctx.beginPath(); ctx.ellipse(u.rx + 3, u.ry + 4, u.radius * 1.1, u.radius * 0.7, 0, 0, TAU); ctx.fill();
      }
      // Halo de stim
      for (let i = 0; i < ground.length; i++) {
        const u = ground[i];
        if (u.stimT > 0) { ctx.strokeStyle = 'rgba(255,80,60,' + (0.4 + 0.3 * Math.sin(t * 12)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(u.rx, u.ry + 3, u.radius + 2, (u.radius + 2) * 0.62, 0, 0, TAU); ctx.stroke(); }
        else if (u.buff) { ctx.strokeStyle = 'rgba(255,220,100,' + (0.45 + 0.3 * Math.sin(t * 8)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(u.rx, u.ry + 3, u.radius + 3, (u.radius + 3) * 0.62, 0, 0, TAU); ctx.stroke(); } // pouvoir actif
        if (u.debuff) { ctx.strokeStyle = 'rgba(200,160,255,' + (0.45 + 0.3 * Math.sin(t * 6)) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(u.rx, u.ry + 3, u.radius + 1, (u.radius + 1) * 0.62, 0, 0, TAU); ctx.stroke(); } // ralenti / affaibli
        if (u.poison) { ctx.fillStyle = 'rgba(125,255,90,' + (0.5 + 0.4 * Math.sin(t * 10)) + ')'; for (let k = 0; k < 3; k++) ctx.fillRect(u.rx - 6 + k * 5, u.ry - u.radius - 4 - ((t * 20 + k * 7) % 10), 2, 2); }
      }
      // Sprites au sol
      for (let i = 0; i < ground.length; i++) this.drawUnit(ctx, ground[i], t, 0);
      // Étoiles d'étourdissement
      for (let i = 0; i < ground.length; i++) {
        const u = ground[i];
        if (u.stunT <= 0) continue;
        ctx.fillStyle = '#ffd040';
        for (let k = 0; k < 3; k++) { const a = t * 4 + k * 2.1, x = u.rx + Math.cos(a) * 9, y = u.ry - u.radius - 8 + Math.sin(a) * 3; ctx.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 1.2 : 3, b = j * Math.PI / 5; ctx.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); } ctx.closePath(); ctx.fill(); }
      }
      // Étiquette des héros
      for (let i = 0; i < ground.length; i++) {
        const u = ground[i];
        if (!u.def.hero) continue;
        ctx.font = 'bold 9px Verdana, sans-serif'; ctx.textAlign = 'center';
        const label = u.def.name + ' · Niv. ' + u.heroLevel;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(u.rx - 44, u.ry - u.radius - 22, 88, 11);
        ctx.fillStyle = '#ffd040'; ctx.fillText(label, u.rx, u.ry - u.radius - 13);
      }
      // Barres de production des bunkers (les siens uniquement)
      for (let i = 0; i < ground.length; i++) {
        const u = ground[i];
        if (!u.def.structure || u.owner !== g.humanId) continue;
        const keys = g.groupKeysOf(u);
        if (keys) { // touche(s) de groupe assignée(s) au bunker
          const bw = 7 + keys.length * 6, bx = Math.round(u.rx - u.radius) - 4, by = Math.round(u.ry - u.radius) - 4;
          ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(bx, by, bw, 13);
          ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 12);
          ctx.fillStyle = '#ffd040'; ctx.font = 'bold 10px Verdana, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(keys, bx + bw / 2, by + 10.5);
        }
        if (u.building) { // chantier : barre de construction
          const w = 40, x = Math.round(u.rx - w / 2), y = Math.round(u.ry + u.radius + 10), total = u.buildTotal || (u.def.tower ? ZC.TOWER.buildTime : ZC.EXTRACTOR.buildTime);
          ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 7); ctx.fillStyle = '#2a2a14'; ctx.fillRect(x, y, w, 5);
          ctx.fillStyle = '#ffd040'; ctx.fillRect(x, y, Math.round(w * Math.min(1, u.buildT / total)), 5);
          continue;
        }
        if (!u.queue.length && !u.research.length) continue;
        const w = 56, x = Math.round(u.rx - w / 2);
        let y = Math.round(u.ry + u.radius + 16);
        ctx.font = 'bold 9px Verdana, sans-serif'; ctx.textAlign = 'left';
        if (u.queue.length) {
          const q = u.queue[0];
          ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 8);
          ctx.fillStyle = '#1b2a3a'; ctx.fillRect(x, y, w, 6);
          ctx.fillStyle = '#5ab8ff'; ctx.fillRect(x, y, Math.round(w * Math.min(1, q.t / q.total)), 6);
          ctx.fillStyle = '#fff'; ctx.fillText((q.what === 'worker' ? '⚒' : q.what === 'hero' ? '★' : '✈') + (u.queue.length > 1 ? ' x' + u.queue.length : ''), x + w + 4, y + 6);
          y += 10;
        }
        if (u.research.length) {
          const r = u.research[0];
          ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 8);
          ctx.fillStyle = '#2a2a14'; ctx.fillRect(x, y, w, 6);
          ctx.fillStyle = '#ffd040'; ctx.fillRect(x, y, Math.round(w * Math.min(1, r.t / r.total)), 6);
          ctx.fillStyle = '#fff'; ctx.fillText((ZC.UPGRADES[r.what] ? ZC.UPGRADES[r.what].hotkey : ZC.POWERS[r.what].key) + (u.research.length > 1 ? ' x' + u.research.length : ''), x + w + 4, y + 6);
        }
      }
      this.drawEffects(ctx, vx, vy, vw, vh, t);
      if (g.settings.invasion && g.nextInvasion && g.state === 'playing') this.drawInvasionWarning(ctx, t);
      // Unités volantes (ombre décalée + oscillation)
      for (let i = 0; i < air.length; i++) {
        const u = air[i];
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(u.rx + 12, u.ry + 18, u.radius * 1.3, u.radius * 0.7, 0, 0, TAU); ctx.fill();
        const bob = -14 + Math.sin(t * 2 + u.id) * 2;
        this.drawUnit(ctx, u, t, bob);
        if (u.order.type === 'build' && (u.landT > 0 || u.landBlocked)) { // anneau d'atterrissage ; rouge et clignotant si un ennemi bloque
          const frac = u.landT / g.settings.landingTime;
          ctx.beginPath(); ctx.arc(u.rx, u.ry, 30, 0, TAU); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 4; ctx.stroke();
          if (frac > 0) { ctx.beginPath(); ctx.arc(u.rx, u.ry, 30, -Math.PI / 2, -Math.PI / 2 + TAU * frac); ctx.strokeStyle = u.landBlocked ? (Math.sin(t * 10) > 0 ? '#ff4040' : '#802020') : g.players[u.owner].hex; ctx.lineWidth = 4; ctx.stroke(); }
          if (u.landBlocked && Math.sin(t * 10) > 0) { ctx.fillStyle = '#ff4040'; ctx.font = 'bold 11px Verdana, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ENNEMI', u.rx, u.ry - 36); }
        }
      }

      for (let i = 0; i < sel.length; i++) this.drawHpBar(ctx, sel[i]);
      if (input && input.hover && !sel.includes(input.hover)) this.drawHpBar(ctx, input.hover);

      if (input && input.mode === 'tower' && input.mouse.overCanvas) { // aperçu de la tour sous le curseur
        const wx = input.mouse.x + vx, wy = input.mouse.y + vy, ok = g.canPlaceTower(g.humanId, wx, wy), td = ZC.UNITS[ZC.RACES[g.human.race].tower];
        ctx.save(); ctx.globalAlpha = 0.6; ctx.translate(wx, wy); ZC.drawUnitSprite(ctx, td.key, g.human.hex, 0, false, 0, t, null, 0); ctx.restore();
        ctx.strokeStyle = ok.ok ? 'rgba(90,255,80,0.9)' : 'rgba(255,70,50,0.9)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.arc(wx, wy, td.radius + 6, 0, TAU); ctx.stroke();
        if (td.dmg > 0 || td.manned) { ctx.strokeStyle = ok.ok ? 'rgba(90,255,80,0.35)' : 'rgba(255,70,50,0.3)'; ctx.beginPath(); ctx.arc(wx, wy, (td.dmg > 0 ? td.range : (ZC.UNITS[ZC.RACES[g.human.race].l1].range + td.rangeBonus * ZC.TILE)) + td.radius, 0, TAU); ctx.stroke(); }
        ctx.setLineDash([]);
        if (!ok.ok) { ctx.font = 'bold 10px Verdana, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff6a5a'; ctx.fillText({ zone: 'Seulement dans vos zones', centre: 'Trop près du centre', structure: 'Trop près d\'une structure', gisement: 'Trop près du gisement', max: ZC.TOWER.perZone + ' tours max par zone' }[ok.reason] || 'Impossible ici', wx, wy - td.radius - 12); }
      }
      if (input && input.mouse.dragging) {
        const mx = input.mouse.x + vx, my = input.mouse.y + vy, x0 = input.mouse.swx, y0 = input.mouse.swy;
        ctx.strokeStyle = '#18e818'; ctx.lineWidth = 1;
        ctx.strokeRect(Math.min(x0, mx) + 0.5, Math.min(y0, my) + 0.5, Math.abs(mx - x0), Math.abs(my - y0));
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0); // retour au repère écran
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.strokeRect(-vx + 1, -vy + 1, m.w - 2, m.h - 2);
      if (g.settings.invasion && g.nextInvasion && g.state === 'playing') this.drawInvasionEdgeArrow(ctx, t);
    }

    drawUnit(ctx, u, t, bob) {
      const g = this.game;
      ctx.save();
      ctx.translate(u.rx, u.ry + bob);
      ctx.rotate(u.rf);
      ZC.drawUnitSprite(ctx, u.type, g.players[u.owner].hex, u.anim, u.moving, u.attackAnim > 0 ? u.attackAnim / 0.15 : 0, t + u.id * 0.37, u.up, u.rf, undefined, g.players[u.owner].race);
      if (u.building) { ctx.globalAlpha = 0.55; ctx.fillStyle = 'rgba(255,220,80,0.25)'; ctx.beginPath(); ctx.arc(0, 0, u.radius + 4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
      if (u.def.worker) {
        if (u.carry > 0) { // cristal transporté
          ctx.fillStyle = ZC.MINERALS.color; ctx.beginPath(); ctx.moveTo(7, -4); ctx.lineTo(12, -1); ctx.lineTo(10, 4); ctx.lineTo(6, 2); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(8, -2, 2, 2);
        }
        if (u.repairing) { // étincelles de soudure
          ctx.fillStyle = Math.random() < 0.5 ? '#fff6c0' : '#ffb040';
          for (let i = 0; i < 3; i++) ctx.fillRect(9 + Math.random() * 6, (Math.random() - 0.5) * 8, 1.5, 1.5);
        }
      }
      if (u.def.structure && !u.def.tower && !u.def.extractor && !u.def.addon && !u.building && ZC.RACES[g.players[u.owner].race].auto) { // tourelle intégrée (mécas)
        const a = u.turretFacing || 0, hot = u.attackAnim > 0;
        ctx.save(); ctx.translate(0, -10);
        ctx.fillStyle = '#3a4250'; ctx.strokeStyle = '#8c96a8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.rotate(a); ctx.fillStyle = '#2a2f38'; ctx.fillRect(3, -2, 11, 4); ctx.fillStyle = g.players[u.owner].hex; ctx.fillRect(3, -1, 4, 2);
        if (hot) { ctx.fillStyle = '#fff8d0'; ctx.fillRect(14, -2.5, 4, 5); }
        ctx.restore();
      }
      if (u.def.tower && u.garrison.length) { // tour de guet occupée : soldats sur la plateforme
        for (let i = 0; i < u.garrison.length; i++) { const gx = (i - (u.garrison.length - 1) / 2) * 9; ctx.fillStyle = '#2b2f36'; ctx.beginPath(); ctx.arc(gx, -2, 3.5, 0, TAU); ctx.fill(); ctx.fillStyle = g.players[u.owner].hex; ctx.beginPath(); ctx.arc(gx, -2, 2, 0, TAU); ctx.fill(); if (u.attackAnim > 0) { ctx.fillStyle = '#fff8d0'; ctx.fillRect(gx + 3, -3, 4, 2); } }
      } else if (u.def.structure && u.garrison.length) { // meurtrières occupées
        const ports = u.def.hq ? [[-26, -16, 6, 4], [20, -16, 6, 4], [-26, -3, 6, 4], [20, -3, 6, 4], [-26, 10, 6, 4], [20, 10, 6, 4]] : [[-11, -14, 7, 3], [4, -14, 7, 3], [-11, 11, 7, 3], [4, 11, 7, 3]];
        const hot = u.attackAnim > 0;
        for (let i = 0; i < u.garrison.length && i < ports.length; i++) {
          const p = ports[i];
          ctx.fillStyle = hot ? '#fff8d0' : '#ffd040'; ctx.fillRect(p[0], p[1], p[2], p[3]);
          ctx.fillStyle = 'rgba(255,208,64,' + (hot ? 0.5 : 0.25) + ')'; ctx.fillRect(p[0] - 1, p[1] - 1, p[2] + 2, p[3] + 2);
        }
      }
      if (u.hitFlash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.arc(0, 0, u.radius + 1, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    // Gisement de minerai vert fluo : cristaux dont la taille suit le minerai restant
    drawMinerals(ctx, p, t, hover) {
      const frac = p.max > 0 ? p.amount / p.max : 0, M = ZC.MINERALS;
      if (p.amount <= 0) { // épuisé : moignons sombres
        ctx.fillStyle = 'rgba(30,60,30,0.5)';
        for (const c of p.crystals) { ctx.beginPath(); ctx.ellipse(c.x, c.y + 2, c.r * 0.7, c.r * 0.4, 0, 0, TAU); ctx.fill(); }
        return;
      }
      const k = 0.55 + 0.45 * frac, glow = 0.35 + 0.25 * Math.sin(t * 2.5 + p.id);
      ctx.fillStyle = 'rgba(57,255,20,' + (0.08 * glow + 0.04) + ')';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 40, 24, 0, 0, TAU); ctx.fill();
      p.crystals.forEach((c, i) => {
        const r = c.r * k, h = r * 2.2;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(c.x + 2, c.y + 3, r * 1.3, r * 0.6, 0, 0, TAU); ctx.fill();
        // cristal principal + éclats
        const shards = [[0, 0, 1], [-r * 0.9, r * 0.3, 0.55], [r * 0.9, r * 0.25, 0.65]];
        for (const [dx, dy, s] of shards) {
          const x = c.x + dx, y = c.y + dy, rr = r * s, hh = h * s;
          ctx.fillStyle = '#1f9a12'; ctx.beginPath(); ctx.moveTo(x - rr, y + rr * 0.4); ctx.lineTo(x - rr * 0.3, y - hh); ctx.lineTo(x + rr * 0.9, y + rr * 0.5); ctx.closePath(); ctx.fill();
          ctx.fillStyle = M.color; ctx.beginPath(); ctx.moveTo(x - rr * 0.3, y - hh); ctx.lineTo(x + rr, y - rr * 0.2); ctx.lineTo(x + rr * 0.9, y + rr * 0.5); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(220,255,200,' + (0.5 + 0.4 * glow) + ')'; ctx.beginPath(); ctx.moveTo(x - rr * 0.3, y - hh); ctx.lineTo(x + rr * 0.1, y - hh * 0.55); ctx.lineTo(x - rr * 0.45, y - hh * 0.35); ctx.closePath(); ctx.fill();
        }
        if (c.n > 0 && Math.sin(t * 20 + i) > 0.6) { ctx.fillStyle = '#eaffdc'; ctx.fillRect(c.x - 1 + Math.sin(t * 7 + i) * 4, c.y - h * 0.6, 2, 2); }
      });
      if (hover) {
        ctx.font = 'bold 10px Verdana, sans-serif'; ctx.textAlign = 'center';
        const label = 'Minerai : ' + Math.round(p.amount) + (p.busy ? ' · ' + p.busy + ' en récolte' : '') + (p.extractor && !p.extractor.dead ? (p.extractor.building ? ' · extracteur en chantier' : ' · extracteur') : '');
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(p.x - 62, p.y - 44, 124, 13);
        ctx.fillStyle = M.color; ctx.fillText(label, p.x, p.y - 34);
      }
    }

    // Balise d'assaut : là où la prochaine vague va surgir. Anneaux radar, chevrons qui foncent vers l'intérieur,
    // compte à rebours ; tout s'accélère et rougit dans les 5 dernières secondes.
    drawInvasionWarning(ctx, t) {
      const g = this.game, n = g.nextInvasion, m = g.map, left = Math.max(0, g.invasionT);
      const urgent = left < 5, speed = urgent ? 3 : 1.2, col = urgent ? '255,60,40' : '255,120,60';
      const dir = n.side === 0 ? [0, 1] : n.side === 1 ? [0, -1] : n.side === 2 ? [1, 0] : [-1, 0]; // vers l'intérieur de la carte
      const ang = Math.atan2(dir[1], dir[0]);
      // halo au sol
      const gr = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 110);
      gr.addColorStop(0, 'rgba(' + col + ',' + (urgent ? 0.35 + 0.2 * Math.sin(t * 12) : 0.18) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(n.x, n.y, 110, 0, TAU); ctx.fill();
      // anneaux radar qui s'étendent
      for (let k = 0; k < 3; k++) {
        const ph = ((t * speed * 0.5) + k / 3) % 1, r = 12 + ph * 95;
        ctx.strokeStyle = 'rgba(' + col + ',' + ((1 - ph) * 0.9) + ')'; ctx.lineWidth = 2.5 - ph * 1.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, TAU); ctx.stroke();
      }
      // chevrons qui avancent vers l'intérieur
      ctx.save(); ctx.translate(n.x, n.y); ctx.rotate(ang);
      for (let k = 0; k < 4; k++) {
        const ph = ((t * speed * 0.7) + k / 4) % 1, d = 30 + ph * 90, a = (1 - ph) * 0.9;
        ctx.strokeStyle = 'rgba(' + col + ',' + a + ')'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(d - 14, -16); ctx.lineTo(d, 0); ctx.lineTo(d - 14, 16); ctx.stroke();
      }
      ctx.restore();
      // point central qui clignote et compte à rebours
      const blink = urgent ? (Math.sin(t * 14) > 0 ? 1 : 0.3) : 0.6 + 0.4 * Math.sin(t * 4);
      ctx.fillStyle = 'rgba(' + col + ',' + blink + ')'; ctx.beginPath(); ctx.arc(n.x, n.y, 7, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(n.x, n.y, 7, 0, TAU); ctx.stroke();
      const label = (urgent ? '⚠ ASSAUT IMMINENT ' : 'ASSAUT PAR LE ' + n.sideName.toUpperCase() + ' · ') + Math.ceil(left) + ' s', lx = ZC.clamp(n.x, 90, m.w - 90), ly = n.side === 0 ? n.y + 44 : n.y - 36;
      ctx.font = 'bold 11px Verdana, sans-serif'; ctx.textAlign = 'center';
      const w = ctx.measureText(label).width + 16;
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(lx - w / 2, ly - 11, w, 16);
      ctx.strokeStyle = 'rgba(' + col + ',0.9)'; ctx.lineWidth = 1; ctx.strokeRect(lx - w / 2 + 0.5, ly - 10.5, w - 1, 15);
      ctx.fillStyle = urgent && Math.sin(t * 14) < 0 ? '#fff' : 'rgb(' + col + ')'; ctx.fillText(label, lx, ly + 1);
    }
    // Flèche au bord de l'écran quand la balise est hors champ (espace écran)
    drawInvasionEdgeArrow(ctx, t) {
      const g = this.game, n = g.nextInvasion, vx = this.viewX, vy = this.viewY, vw = this.vw, vh = this.vh;
      const sx = n.x - vx, sy = n.y - vy;
      if (sx > 0 && sx < vw && sy > 0 && sy < vh) return;
      const cx = vw / 2, cy = vh / 2, dx = sx - cx, dy = sy - cy, M = 46;
      const k = Math.min((vw / 2 - M) / Math.abs(dx || 1e-6), (vh / 2 - M) / Math.abs(dy || 1e-6));
      const ax = cx + dx * k, ay = cy + dy * k, ang = Math.atan2(dy, dx), left = Math.max(0, g.invasionT), urgent = left < 5;
      const col = urgent ? '255,60,40' : '255,120,60', pulse = 1 + 0.12 * Math.sin(t * (urgent ? 14 : 5));
      ctx.save(); ctx.translate(ax, ay);
      ctx.fillStyle = 'rgba(' + col + ',0.25)'; ctx.beginPath(); ctx.arc(0, 0, 30 * pulse, 0, TAU); ctx.fill();
      ctx.rotate(ang); ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgb(' + col + ')'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-8, -14); ctx.lineTo(-2, 0); ctx.lineTo(-8, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.font = 'bold 11px Verdana, sans-serif'; ctx.textAlign = 'center';
      const label = (urgent ? '⚠ ' : '') + 'ASSAUT · ' + Math.ceil(left) + ' s', w = ctx.measureText(label).width + 12;
      const lx = ZC.clamp(ax, w / 2 + 4, vw - w / 2 - 4), ly = ZC.clamp(ay + 40, 50, vh - 10);
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(lx - w / 2, ly - 11, w, 15);
      ctx.fillStyle = 'rgb(' + col + ')'; ctx.fillText(label, lx, ly);
    }

    drawFlag(ctx, x, y, hex, t) {
      ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 18); ctx.stroke();
      ctx.fillStyle = hex;
      const w = 10 + Math.sin(t * 6) * 1.5;
      ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x + w, y - 14); ctx.lineTo(x, y - 10); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, y + 1, 7, 4, 0, 0, TAU); ctx.stroke();
    }

    drawZoneTints(ctx, zones, input) {
      const g = this.game, ZP = ZC.ZONE_PX;
      for (const z of zones) {
        if (z.owner >= 0) {
          const hex = g.players[z.owner].hex;
          const flash = z.flashT > 0 ? z.flashT / 1.2 * 0.25 : 0;
          ctx.fillStyle = ZC.rgba(hex, 0.12 + flash);
          ctx.fillRect(z.x, z.y, ZP, ZP);
          ctx.strokeStyle = ZC.rgba(hex, 0.7); ctx.lineWidth = 3;
          ctx.strokeRect(z.x + 3, z.y + 3, ZP - 6, ZP - 6);
        } else if (z.flashT > 0) {
          ctx.fillStyle = 'rgba(255,255,255,' + (z.flashT / 1.2 * 0.15) + ')';
          ctx.fillRect(z.x, z.y, ZP, ZP);
        }
        if (z.capturer >= 0 && z.captureT > 0) {
          const hex = g.players[z.capturer].hex;
          ctx.setLineDash([8, 6]);
          ctx.strokeStyle = ZC.rgba(hex, 0.8); ctx.lineWidth = 2;
          ctx.strokeRect(z.x + 7, z.y + 7, ZP - 14, ZP - 14);
          ctx.setLineDash([]);
        }
      }
      // Zone visée en mode construction
      if (input && input.buildZone && input.buildZone.owner < 0 && !input.buildZone.bunker) {
        const z = input.buildZone;
        ctx.setLineDash([10, 6]);
        ctx.strokeStyle = ZC.rgba(g.human.hex, 0.9); ctx.lineWidth = 3;
        ctx.strokeRect(z.x + 6, z.y + 6, ZP - 12, ZP - 12);
        ctx.setLineDash([]);
        ctx.fillStyle = ZC.rgba(g.human.hex, 0.08); ctx.fillRect(z.x, z.y, ZP, ZP);
      }
    }

    drawZoneCenter(ctx, z, t) {
      const g = this.game;
      if (z.ruined && !z.bunker) {
        ctx.save(); ctx.translate(z.cx, z.cy); ZC.drawRuins(ctx, z.id * 31 + 7); ctx.restore();
      } else if (!z.bunker) {
        // Balise neutre
        const pulse = 0.65 + 0.35 * Math.sin(t * 3 + z.id);
        ctx.beginPath(); ctx.arc(z.cx, z.cy, 22, 0, TAU); ctx.fillStyle = '#2b2b2b'; ctx.fill();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(z.cx, z.cy, 16, 0, TAU); ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(z.cx, z.cy, 10, 0, TAU); ctx.strokeStyle = 'rgba(200,200,200,0.8)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(z.cx, z.cy, 5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.5 * pulse) + ')'; ctx.fill();
      }
      if (z.super) {
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.arc(z.cx, z.cy, 46, t * 0.5, t * 0.5 + TAU);
        ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 2; ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffd040'; ctx.font = 'bold 11px Verdana, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('x' + g.settings.superZoneMult, z.cx, z.cy + 62);
      }
      if (z.capturer >= 0 && z.captureT > 0) {
        const frac = z.captureT / g.settings.captureTime;
        ctx.beginPath(); ctx.arc(z.cx, z.cy, 34, -Math.PI / 2, -Math.PI / 2 + TAU * frac);
        ctx.strokeStyle = g.players[z.capturer].hex; ctx.lineWidth = 4; ctx.stroke();
      }
    }

    drawHpBar(ctx, u) {
      const w = ZC.clamp(Math.round(u.radius * 3.2), 20, 60);
      const x = Math.round(u.rx - w / 2), y = Math.round(u.ry + u.radius + (u.def.air ? -6 : 7));
      const segs = Math.floor(w / 4);
      const bars = [];
      if (u.def.shield > 0) bars.push({ frac: u.shield / u.def.shield, color: '#4aa8ff' });
      bars.push({ frac: u.hp / u.maxHp, color: null });
      if (u.def.hero && u.fluxMax > 0) bars.push({ frac: u.flux / u.fluxMax, color: '#c080ff' }); // flux du héros
      let yy = y - (bars.length - 1) * 5;
      for (const b of bars) {
        const color = b.color || this.hpColors[b.frac > 0.66 ? 2 : b.frac > 0.33 ? 1 : 0];
        ctx.fillStyle = '#000'; ctx.fillRect(x - 1, yy - 1, segs * 4 + 2, 6);
        const filled = Math.ceil(b.frac * segs);
        for (let i = 0; i < segs; i++) {
          ctx.fillStyle = i < filled ? color : '#2a2a2a';
          ctx.fillRect(x + i * 4, yy, 3, 4);
        }
        yy += 5;
      }
    }

    drawDecals(ctx, vx, vy, vw, vh) {
      const d = this.game.decals;
      for (let i = 0; i < d.length; i++) {
        const k = d[i];
        if (k.x < vx - 60 || k.x > vx + vw + 60 || k.y < vy - 60 || k.y > vy + vh + 60) continue;
        const alpha = Math.min(1, (k.life - k.t) / 8) * 0.8;
        const rnd = ZC.seededRandom(k.seed * 1000 | 0);
        if (k.type === 'explosion' || k.type === 'bigExplosion') {
          const big = k.type === 'bigExplosion' ? 1.5 : 1;
          ctx.fillStyle = 'rgba(20,16,12,' + alpha * (big > 1 ? 0.45 : 0.7) + ')';
          ctx.beginPath(); ctx.ellipse(k.x, k.y, k.r * 1.6 * big, k.r * 1.1 * big, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(80,70,60,' + alpha * 0.5 + ')';
          for (let j = 0; j < 4 * big; j++) { ctx.beginPath(); ctx.arc(k.x + (rnd() - 0.5) * k.r * 3 * big, k.y + (rnd() - 0.5) * k.r * 3 * big, 2 + rnd() * 3, 0, TAU); ctx.fill(); }
        } else {
          const big = k.type === 'blood2' ? 2 : 1;
          ctx.fillStyle = 'rgba(110,20,60,' + alpha + ')';
          ctx.beginPath(); ctx.ellipse(k.x, k.y, k.r * 1.2 * big, k.r * 0.9 * big, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(140,30,80,' + alpha * 0.8 + ')';
          for (let j = 0; j < 5 * big; j++) {
            const a = rnd() * TAU, dd = k.r * (0.8 + rnd() * 1.6) * big;
            ctx.beginPath(); ctx.arc(k.x + Math.cos(a) * dd, k.y + Math.sin(a) * dd, 1.5 + rnd() * 2.5 * big, 0, TAU); ctx.fill();
          }
        }
      }
    }

    drawEffects(ctx, vx, vy, vw, vh, t) {
      const fx = this.game.effects, g = this.game;
      for (let i = 0; i < fx.length; i++) {
        const e = fx[i];
        const cx = e.tx !== undefined ? (e.x + e.tx) / 2 : e.x, cy = e.ty !== undefined ? (e.y + e.ty) / 2 : e.y;
        if (cx < vx - 220 || cx > vx + vw + 220 || cy < vy - 220 || cy > vy + vh + 220) continue;
        const p = e.t / e.life, inv = 1 - p;
        switch (e.type) {
          case 'corpse': {
            ctx.save();
            ctx.globalAlpha = inv;
            ctx.translate(e.x, e.y + (e.air ? -14 + p * 30 : 0));
            ctx.rotate(e.facing + (e.air ? p * 2 : 0));
            const s = e.air ? 1 - p * 0.5 : 1 - p * 0.25;
            ctx.scale(s, s);
            ZC.drawUnitSprite(ctx, e.unitType, e.color, 0, false, 0, t, e.up, e.facing, e.air ? undefined : p, e.race);
            ctx.restore();
            break;
          }
          case 'tracer': case 'tracer2': {
            const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy) || 1;
            const ox = dx / d * 10, oy = dy / d * 10;
            ctx.strokeStyle = 'rgba(255,240,150,' + inv + ')'; ctx.lineWidth = e.type === 'tracer2' ? 2 : 1.2;
            ctx.beginPath(); ctx.moveTo(e.x + ox, e.y + oy); ctx.lineTo(e.tx, e.ty); ctx.stroke();
            ctx.fillStyle = 'rgba(255,220,80,' + inv + ')';
            ctx.beginPath(); ctx.arc(e.x + ox, e.y + oy, 3 + (e.type === 'tracer2' ? 2 : 0), 0, TAU); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,' + inv * 0.8 + ')';
            ctx.beginPath(); ctx.arc(e.tx + Math.sin(i * 7.1) * 3, e.ty + Math.cos(i * 3.3) * 3, 1.5, 0, TAU); ctx.fill();
            break;
          }
          case 'shell': { // obus de tank : projectile rapide puis gerbe à l'impact
            const px = ZC.lerp(e.x, e.tx, Math.min(1, p * 1.6)), py = ZC.lerp(e.y, e.ty, Math.min(1, p * 1.6));
            if (p < 0.62) {
              const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy) || 1;
              ctx.strokeStyle = 'rgba(255,200,120,0.8)'; ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(px - dx / d * 9, py - dy / d * 9); ctx.lineTo(px, py); ctx.stroke();
              ctx.fillStyle = '#ffe6a0'; ctx.beginPath(); ctx.arc(px, py, 2.5, 0, TAU); ctx.fill();
              if (p < 0.2) { ctx.fillStyle = 'rgba(255,220,120,' + (1 - p * 5) + ')'; ctx.beginPath(); ctx.arc(e.x + dx / d * 16, e.y + dy / d * 16, 6, 0, TAU); ctx.fill(); }
            } else {
              const q = (p - 0.62) / 0.38, r = 6 + q * 14;
              ctx.fillStyle = 'rgba(255,140,40,' + (0.7 * (1 - q)) + ')'; ctx.beginPath(); ctx.arc(e.tx, e.ty, r, 0, TAU); ctx.fill();
              ctx.fillStyle = 'rgba(255,240,180,' + (0.9 * (1 - q)) + ')'; ctx.beginPath(); ctx.arc(e.tx, e.ty, r * 0.4, 0, TAU); ctx.fill();
              ctx.fillStyle = 'rgba(60,50,40,' + (0.5 * (1 - q)) + ')'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(e.tx + Math.sin(i * 3.1 + k) * r, e.ty + Math.cos(i * 1.7 + k * 2) * r * 0.7, 3 + q * 4, 0, TAU); ctx.fill(); }
            }
            break;
          }
          case 'spine': case 'bolt': {
            const px = ZC.lerp(e.x, e.tx, p), py = ZC.lerp(e.y, e.ty, p);
            if (e.type === 'spine') {
              const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy) || 1;
              ctx.strokeStyle = '#d8ff70'; ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(px - dx / d * 5, py - dy / d * 5); ctx.lineTo(px + dx / d * 3, py + dy / d * 3); ctx.stroke();
            } else {
              ctx.fillStyle = 'rgba(120,200,255,0.5)'; ctx.beginPath(); ctx.arc(px, py, 7, 0, TAU); ctx.fill();
              ctx.fillStyle = '#e8f8ff'; ctx.beginPath(); ctx.arc(px, py, 3.5, 0, TAU); ctx.fill();
            }
            if (p > 0.85) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(e.tx, e.ty, 4, 0, TAU); ctx.fill(); }
            break;
          }
          case 'flame': {
            const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy) || 1;
            const rnd = ZC.seededRandom(i * 7919 + 13);
            for (let k = 0; k < 10; k++) {
              const f = (k / 10) * Math.min(1, p * 2.5);
              const jx = (rnd() - 0.5) * 16 * f, jy = (rnd() - 0.5) * 16 * f;
              const px = e.x + dx / d * (12 + (d - 6) * f) + jx, py = e.y + dy / d * (12 + (d - 6) * f) + jy;
              ctx.fillStyle = 'rgba(255,' + Math.floor(120 + f * 100) + ',' + Math.floor(20 + f * 40) + ',' + (inv * 0.8) + ')';
              ctx.beginPath(); ctx.arc(px, py, 2 + f * 5, 0, TAU); ctx.fill();
            }
            break;
          }
          case 'slash': case 'slash2': case 'psislash': {
            const big = e.type === 'slash2' ? 2 : 1;
            ctx.strokeStyle = e.type === 'psislash' ? 'rgba(170,240,255,' + inv + ')' : 'rgba(255,255,255,' + inv + ')';
            ctx.lineWidth = 1.5 * big;
            const a0 = Math.atan2(e.ty - e.y, e.tx - e.x);
            for (let k = -1; k <= 1; k += 2) {
              ctx.beginPath(); ctx.arc(e.tx + k * 3 * big, e.ty, (6 + p * 4) * big, a0 - 0.9 + k * 0.4, a0 + 0.9 + k * 0.4); ctx.stroke();
            }
            if (e.type !== 'psislash') {
              ctx.fillStyle = 'rgba(160,30,70,' + inv * 0.7 + ')';
              ctx.beginPath(); ctx.arc(e.tx, e.ty, 2 + p * 4 * big, 0, TAU); ctx.fill();
            }
            break;
          }
          case 'lightning': {
            const rnd = ZC.seededRandom(i * 131 + Math.floor(e.t * 40));
            ctx.strokeStyle = 'rgba(200,240,255,' + inv + ')'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(e.x, e.y);
            const segs = 6;
            for (let k = 1; k <= segs; k++) {
              const f = k / segs;
              ctx.lineTo(ZC.lerp(e.x, e.tx, f) + (k < segs ? (rnd() - 0.5) * 18 : 0), ZC.lerp(e.y, e.ty, f) + (k < segs ? (rnd() - 0.5) * 18 : 0));
            }
            ctx.stroke();
            ctx.fillStyle = 'rgba(220,250,255,' + inv * 0.6 + ')';
            ctx.beginPath(); ctx.arc(e.tx, e.ty, 10 + p * 14, 0, TAU); ctx.fill();
            break;
          }
          case 'blood': case 'blood2': {
            const big = e.type === 'blood2' ? 2 : 1;
            const rnd = ZC.seededRandom(i * 977 + 5);
            for (let k = 0; k < 8 * big; k++) {
              const a = rnd() * TAU, sp = 20 + rnd() * 50;
              ctx.fillStyle = 'rgba(' + (150 + Math.floor(rnd() * 60)) + ',20,' + (60 + Math.floor(rnd() * 50)) + ',' + inv + ')';
              ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * sp * p * big, e.y + Math.sin(a) * sp * p * big, (1.5 + rnd() * 2.5) * big, 0, TAU); ctx.fill();
            }
            break;
          }
          case 'explosion': case 'bigExplosion': {
            const big = e.type === 'bigExplosion' ? 2.6 : 1;
            const r = e.r * (0.8 + p * 2.2) * big;
            const gr = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
            gr.addColorStop(0, 'rgba(255,255,200,' + inv + ')');
            gr.addColorStop(0.4, 'rgba(255,140,30,' + inv * 0.9 + ')');
            gr.addColorStop(1, 'rgba(60,40,30,0)');
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, TAU); ctx.fill();
            ctx.fillStyle = 'rgba(70,70,70,' + inv * 0.5 + ')';
            ctx.beginPath(); ctx.arc(e.x - 4, e.y - 6 - p * 14 * big, (5 + p * 10) * big, 0, TAU); ctx.fill();
            if (big > 1) {
              const rnd = ZC.seededRandom(i * 55 + 3);
              for (let k = 0; k < 10; k++) {
                const a = rnd() * TAU, sp = 40 + rnd() * 90;
                ctx.fillStyle = 'rgba(60,60,60,' + inv + ')';
                ctx.fillRect(e.x + Math.cos(a) * sp * p - 2, e.y + Math.sin(a) * sp * p - 2 - Math.sin(p * Math.PI) * 30, 4, 4);
              }
            }
            break;
          }
          case 'psi': case 'psi2': {
            const big = e.type === 'psi2' ? 2.5 : 1;
            ctx.strokeStyle = 'rgba(160,220,255,' + inv + ')'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (1 + p * 2) * big, 0, TAU); ctx.stroke();
            ctx.fillStyle = 'rgba(220,245,255,' + inv * 0.7 + ')';
            ctx.beginPath(); ctx.arc(e.x, e.y, e.r * inv * big, 0, TAU); ctx.fill();
            break;
          }
          case 'spawn': {
            ctx.strokeStyle = ZC.rgba(e.color, inv); ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(e.x, e.y, 10 + p * 40, 0, TAU); ctx.stroke();
            break;
          }
          case 'mine': { // éclats verts à la récolte
            const rnd = ZC.seededRandom(i * 311 + 9);
            ctx.fillStyle = 'rgba(120,255,90,' + inv + ')';
            for (let k = 0; k < 6; k++) { const a = rnd() * TAU, sp = 6 + rnd() * 14; ctx.fillRect(e.x + Math.cos(a) * sp * p - 1, e.y - 6 + Math.sin(a) * sp * p - 1 - p * 6, 2, 2); }
            break;
          }
          case 'repair': { // étincelles de réparation
            const rnd = ZC.seededRandom(i * 503 + 1);
            for (let k = 0; k < 5; k++) { const a = rnd() * TAU, sp = 4 + rnd() * 12; ctx.fillStyle = k % 2 ? 'rgba(255,240,180,' + inv + ')' : 'rgba(255,170,60,' + inv + ')'; ctx.fillRect(e.x + Math.cos(a) * sp * p, e.y + Math.sin(a) * sp * p + p * 8, 1.5, 1.5); }
            break;
          }
          case 'deposit': { // « +6 » qui monte au-dessus du dépôt
            ctx.font = 'bold 10px Verdana, sans-serif'; ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(57,255,20,' + inv + ')'; ctx.fillText('+' + e.amount, e.x, e.y - 6 - p * 18);
            break;
          }
          case 'gas': { // nuage lacrymogène : volutes vert-jaune qui tournent lentement, s'estompe à la fin
            const a = Math.min(1, inv * 3) * 0.55;
            for (let k = 0; k < 6; k++) { const ang = t * 0.6 + k * 1.05, rr = e.r * (0.55 + 0.25 * Math.sin(t * 1.3 + k)); ctx.fillStyle = 'rgba(184,224,96,' + (a * (0.5 + 0.5 * Math.sin(t * 2 + k))).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(e.x + Math.cos(ang) * rr * 0.6, e.y + Math.sin(ang) * rr * 0.4 - 6, rr * 0.7, 0, TAU); ctx.fill(); }
            break;
          }
          case 'heal': { // croix vertes qui montent
            ctx.strokeStyle = 'rgba(125,255,90,' + inv + ')'; ctx.lineWidth = 2;
            for (let k = 0; k < 3; k++) { const x = e.x + (k - 1) * 9, y = e.y - 6 - p * 26 - k * 4; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke(); }
            break;
          }
          case 'aura': { // disque coloré qui s'étend
            ctx.fillStyle = ZC.rgba(e.color, inv * 0.25); ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * (0.4 + 0.6 * p), e.r * (0.4 + 0.6 * p) * 0.65, 0, 0, TAU); ctx.fill();
            ctx.strokeStyle = ZC.rgba(e.color, inv); ctx.lineWidth = 2; ctx.stroke();
            break;
          }
          case 'text': { // mot flottant (esquive...)
            ctx.font = 'bold 10px Verdana, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = ZC.rgba(e.color || '#fff', 1 - p);
            ctx.fillText(e.text, e.x, e.y - p * 14);
            break;
          }
          case 'shock': { // onde de choc : anneaux concentriques
            ctx.lineWidth = 3;
            for (let k = 0; k < 3; k++) { const q = Math.max(0, p - k * 0.15) / (1 - k * 0.15); if (q <= 0) continue; ctx.strokeStyle = ZC.rgba(e.color, (1 - q) * 0.9); ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * q, e.r * q * 0.6, 0, 0, TAU); ctx.stroke(); }
            break;
          }
          case 'marker': {
            ctx.strokeStyle = e.color; ctx.lineWidth = 1.5;
            const r = 14 * inv + 3;
            ctx.beginPath(); ctx.ellipse(e.x, e.y, r, r * 0.6, 0, 0, TAU); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(e.x - r - 4, e.y); ctx.lineTo(e.x - r + 2, e.y); ctx.moveTo(e.x + r - 2, e.y); ctx.lineTo(e.x + r + 4, e.y); ctx.stroke();
            break;
          }
        }
      }
    }

    drawMinimap(mctx, mw, mh) {
      const g = this.game, m = g.map, pal = TILESETS[this.tileset] || TILESETS.jungle;
      const sc = Math.min(mw / m.w, mh / m.h);
      const ox = (mw - m.w * sc) / 2, oy = (mh - m.h * sc) / 2;
      mctx.fillStyle = '#000'; mctx.fillRect(0, 0, mw, mh);
      const zs = ZC.ZONE_PX * sc;
      for (const z of m.zones) {
        mctx.fillStyle = z.owner >= 0 ? ZC.shade(g.players[z.owner].hex, 0.55) : pal.mini;
        mctx.fillRect(ox + z.x * sc, oy + z.y * sc, zs, zs);
        if (z.capturer >= 0 && z.captureT > 0) {
          mctx.strokeStyle = g.players[z.capturer].hex; mctx.lineWidth = 1;
          mctx.strokeRect(ox + z.x * sc + 1.5, oy + z.y * sc + 1.5, zs - 3, zs - 3);
        }
        if (z.super) { mctx.fillStyle = 'rgba(255,208,64,0.6)'; mctx.fillRect(ox + z.cx * sc - 1.5, oy + z.cy * sc - 1.5, 3, 3); }
      }
      for (const p of g.patches) if (p.amount > 0) { mctx.fillStyle = ZC.MINERALS.color; mctx.fillRect(ox + p.x * sc - 1.5, oy + p.y * sc - 1.5, 3, 3); }
      mctx.strokeStyle = 'rgba(0,0,0,0.5)'; mctx.lineWidth = 1;
      for (let i = 0; i <= m.zx; i++) { mctx.beginPath(); mctx.moveTo(ox + i * zs + 0.5, oy); mctx.lineTo(ox + i * zs + 0.5, oy + m.h * sc); mctx.stroke(); }
      for (let i = 0; i <= m.zy; i++) { mctx.beginPath(); mctx.moveTo(ox, oy + i * zs + 0.5); mctx.lineTo(ox + m.w * sc, oy + i * zs + 0.5); mctx.stroke(); }
      const units = g.units;
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        mctx.fillStyle = g.players[u.owner].hex;
        const s = u.def.structure ? 5 : u.owner === g.humanId ? 2.5 : 2;
        mctx.fillRect(ox + u.x * sc - s / 2, oy + u.y * sc - s / 2, s, s);
        if (u.def.structure) { mctx.strokeStyle = '#000'; mctx.lineWidth = 1; mctx.strokeRect(ox + u.x * sc - s / 2 + 0.5, oy + u.y * sc - s / 2 + 0.5, s - 1, s - 1); }
      }
      // Alerte : bunker du joueur attaqué depuis moins de 3 s -> zone qui clignote en rouge et onde concentrique
      const ALERT = 3, now = g.time, t = this.frameT;
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (!u.def.structure || u.owner !== g.humanId || now - u.attackedT > ALERT) continue;
        const age = now - u.attackedT, z = u.zone;
        const blink = 0.5 + 0.5 * Math.sin(t * 14);
        if (z) {
          mctx.strokeStyle = blink > 0.5 ? '#ffffff' : '#ff3c28'; mctx.lineWidth = 2; // alterne blanc / rouge : visible quelle que soit la couleur du joueur
          mctx.strokeRect(ox + z.x * sc + 1, oy + z.y * sc + 1, zs - 2, zs - 2);
        }
        const cx = ox + u.x * sc, cy = oy + u.y * sc;
        const ph = (t * 1.2 + i * 0.37) % 1;  // onde qui s'étend et s'estompe
        mctx.strokeStyle = 'rgba(255,80,60,' + ((1 - ph) * 0.9) + ')'; mctx.lineWidth = 1.5;
        mctx.beginPath(); mctx.arc(cx, cy, 3 + ph * Math.max(8, zs * 0.6), 0, Math.PI * 2); mctx.stroke();
        mctx.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.6 * blink) * (1 - age / ALERT) + ')';
        mctx.fillRect(cx - 2.5, cy - 2.5, 5, 5);
      }
      if (g.settings.invasion && g.nextInvasion && g.state === 'playing') { // prochaine vague : losange rouge qui clignote au bord
        const n = g.nextInvasion, px = ox + n.x * sc, py = oy + n.y * sc, on = Math.sin(t * (g.invasionT < 5 ? 14 : 5)) > 0;
        mctx.fillStyle = on ? '#ff3c28' : '#ffb0a0'; mctx.strokeStyle = '#000'; mctx.lineWidth = 1;
        mctx.beginPath(); mctx.moveTo(px, py - 5); mctx.lineTo(px + 5, py); mctx.lineTo(px, py + 5); mctx.lineTo(px - 5, py); mctx.closePath(); mctx.fill(); mctx.stroke();
      }
      // Pings : un ordre donné sur la minimap -> trois anneaux qui s'étendent et s'estompent, sans bouger la caméra
      const PING = 1.1;
      this.miniPings = this.miniPings.filter(p => t - p.t < PING);
      for (const p of this.miniPings) {
        const age = (t - p.t) / PING, px = ox + p.x * sc, py = oy + p.y * sc, R = Math.max(10, zs * 0.7);
        for (let k = 0; k < 3; k++) {
          const ph = age - k * 0.18;
          if (ph < 0) continue;
          mctx.strokeStyle = p.color; mctx.globalAlpha = Math.max(0, 1 - ph) * 0.9; mctx.lineWidth = 1.5;
          mctx.beginPath(); mctx.arc(px, py, 2 + ph * R, 0, Math.PI * 2); mctx.stroke();
        }
        mctx.globalAlpha = 1 - age;
        mctx.fillStyle = '#fff'; mctx.fillRect(px - 1.5, py - 1.5, 3, 3);
        mctx.globalAlpha = 1;
      }
      mctx.strokeStyle = '#fff'; mctx.lineWidth = 1;
      mctx.strokeRect(ox + this.viewX * sc + 0.5, oy + this.viewY * sc + 0.5, this.vw * sc, this.vh * sc);
      this.miniScale = sc; this.miniOx = ox; this.miniOy = oy;
    }

    miniToWorld(mx, my) {
      return { x: (mx - this.miniOx) / this.miniScale, y: (my - this.miniOy) / this.miniScale };
    }
  }
  ZC.Renderer = Renderer;
  ZC.TILESET_PALETTES = TILESETS;
  ZC.buildTerrain = buildTerrain;
})(window.ZC);
