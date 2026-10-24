// Frigo Snap — simulation d'une virée : rail, caméra, outils, projectiles, créatures et clichés. Sans affichage.
(function (FS) {
  'use strict';
  const { clamp, lerp } = FS;
  const TAU = Math.PI * 2;
  const wrap = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };

  // ------------------------------------------------------------------ caméra et projection
  // Repère : x à droite, y vers le haut, z vers le fond. yaw = 0 regarde vers +z ; pitch > 0 regarde vers le haut.
  FS.project = function (cam, px, py, pz) {
    const dx = px - cam.x, dy = py - cam.y, dz = pz - cam.z;
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
    const x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy;
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const y2 = dy * cp - z1 * sp, z2 = dy * sp + z1 * cp;
    if (z2 < FS.NEAR) return null;
    const k = cam.f / z2;
    return { x: FS.W / 2 + x1 * k, y: FS.H / 2 - y2 * k, z: z2, k };
  };
  FS.forward = cam => ({ x: Math.sin(cam.yaw) * Math.cos(cam.pitch), y: Math.sin(cam.pitch), z: Math.cos(cam.yaw) * Math.cos(cam.pitch) });

  // ------------------------------------------------------------------ rail (spline échantillonnée, abscisse curviligne)
  class Rail {
    constructor(pts) {
      this.samples = []; let d = 0, prev = null;
      const n = (pts.length - 1) * 24;
      for (let i = 0; i <= n; i++) {
        const p = FS.catmull(pts, i / 24);
        if (prev) d += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
        this.samples.push({ x: p[0], z: p[1], d }); prev = p;
      }
      this.length = d;
    }
    at(d) { // position + cap (yaw) à la distance d
      const s = this.samples; d = clamp(d, 0, this.length);
      let lo = 0, hi = s.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m].d <= d) lo = m; else hi = m; }
      const a = s[lo], b = s[Math.min(hi, s.length - 1)], seg = Math.max(1e-6, b.d - a.d), t = clamp((d - a.d) / seg, 0, 1);
      const x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t);
      const b2 = s[Math.min(lo + 6, s.length - 1)], a2 = s[Math.max(lo - 6, 0)];
      return { x, z, yaw: Math.atan2(b2.x - a2.x, b2.z - a2.z) };
    }
  }
  FS.Rail = Rail;

  // ------------------------------------------------------------------ créature
  let uid = 0;
  class Creature {
    constructor(spId, x, z, opts, run) {
      this.id = ++uid; this.sp = FS.speciesById(spId); this.spId = spId;
      this.x = x; this.z = z; this.y = (opts && opts.y) || 0; this.baseY = this.y;
      this.home = { x, z, y: this.y }; this.opts = opts || {};
      this.yaw = this.opts.facing != null ? this.opts.facing : run.rng() * TAU;
      this.pose = 'idle'; this.poseT = 0; this.poseDur = Infinity; this.anim = run.rng() * 10;
      this.visible = true; this.hp = 1; this.vars = {}; this.target = null; this.bait = null; this.eaten = 0; this.scale = 1;
      this.speedMul = 1; this.special = 0; // nombre de fois que le comportement secret a été déclenché
    }
    setPose(p, dur, next) { this.pose = p; this.poseT = 0; this.poseDur = dur == null ? Infinity : dur; this.next = next || null; if (p === 'special') this.special++; }
    dist(o) { return Math.hypot(o.x - this.x, o.z - this.z); }
    faceTo(x, z) { this.yaw = Math.atan2(x - this.x, z - this.z); }
    walkTo(x, z, dt, speed) { // avance vers (x,z) ; renvoie vrai si arrivé
      const dx = x - this.x, dz = z - this.z, d = Math.hypot(dx, dz), s = (speed || this.sp.speed) * this.speedMul * dt;
      if (d <= s + 0.05) { this.x = x; this.z = z; return true; }
      this.x += dx / d * s; this.z += dz / d * s; this.yaw = Math.atan2(dx, dz); return false;
    }
    get poseInfo() { return FS.POSES[this.pose] || FS.POSES.idle; }
  }
  FS.Creature = Creature;

  // ------------------------------------------------------------------ virée
  class Run {
    constructor(o) {
      this.level = o.level; this.tools = o.tools || ['crouton']; this.rng = FS.rng(o.seed || 1);
      this.rail = new Rail(this.level.rail);
      this.dist = 0; this.time = 0; this.phase = 'ride'; // ride | over
      this.look = { yaw: 0, pitch: 0 }; this.lookTarget = { yaw: 0, pitch: 0 };
      this.cam = { x: 0, y: FS.CAM_H, z: 0, yaw: 0, pitch: 0, f: (FS.W / 2) / Math.tan(FS.HFOV / 2) };
      this.baseYaw = 0; this.dash = false;
      this.creatures = []; this.projectiles = []; this.baits = []; this.events = []; this.photos = []; this.film = FS.FILM;
      this.cooldowns = {}; this.tool = 'crouton'; this.specials = 0; this.fx = [];
      for (const c of this.level.creatures) { const cr = new Creature(c[0], c[1], c[2], c[3] || {}, this); this.creatures.push(cr); (FS.Behaviours[c[0]] || FS.Behaviours.default).init(cr, this); }
      this.updateCamera();
    }
    emit(e) { this.events.push(e); }
    takeEvents() { const e = this.events; this.events = []; return e; }
    byId(id) { return this.creatures.filter(c => c.spId === id); }
    near(x, z, r, pred) { return this.creatures.filter(c => Math.hypot(c.x - x, c.z - z) <= r && (!pred || pred(c))); }
    hasTool(id) { return this.tools.includes(id); }

    updateCamera() {
      const p = this.rail.at(this.dist);
      this.baseYaw = p.yaw; this.cam.x = p.x; this.cam.z = p.z; this.cam.y = FS.CAM_H + Math.sin(this.time * 7) * 0.015;
      this.cam.yaw = this.baseYaw + this.look.yaw; this.cam.pitch = this.look.pitch;
    }
    // Direction visée (centre de l'écran) et point d'impact : première créature touchée, sinon le sol, sinon 24 unités devant
    aimPoint() {
      const f = FS.forward(this.cam); let best = null;
      for (let d = 0.6; d < 40; d += 0.25) {
        const x = this.cam.x + f.x * d, y = this.cam.y + f.y * d, z = this.cam.z + f.z * d;
        for (const c of this.creatures) if (c.visible) { const rr = Math.max(c.sp.r, c.sp.h / 2) * c.scale; if (Math.hypot(c.x - x, c.y + c.sp.h * c.scale / 2 - y, c.z - z) < rr) return { x: c.x, y: c.y + c.sp.h * c.scale * 0.5, z: c.z, creature: c, d }; }
        if (y <= 0.02 && d > 1) return { x, y: 0, z, creature: null, d };
        best = { x, y, z, creature: null, d };
      }
      return best;
    }
    useTool(id) {
      if (!this.hasTool(id) || this.phase !== 'ride') return false;
      const def = FS.toolById(id); if ((this.cooldowns[id] || 0) > 0) return false;
      this.cooldowns[id] = def.cooldown;
      if (id === 'crouton' || id === 'tabasco') {
        const T = this.aimPoint(); const d = T.d, g = id === 'crouton' ? 9 : 5;
        const tf = id === 'crouton' ? clamp(d / 11, 0.45, 1.5) : clamp(d / 26, 0.2, 0.9);
        const ox = this.cam.x, oy = this.cam.y - 0.25, oz = this.cam.z;
        this.projectiles.push({ kind: id, x: ox, y: oy, z: oz, vx: (T.x - ox) / tf, vy: (T.y - oy) / tf + 0.5 * g * tf, vz: (T.z - oz) / tf, g, t: 0, life: 4, rot: this.rng() * TAU });
        this.emit({ type: 'throw', kind: id });
      } else if (id === 'clic') {
        this.emit({ type: 'clic', x: this.cam.x, z: this.cam.z });
        for (const c of this.near(this.cam.x, this.cam.z, FS.CLIC_R)) this.beh(c).onClic(c, this);
      } else if (id === 'flash') {
        this.emit({ type: 'flash' }); this.flashT = 0.25;
        for (const c of this.creatures) { if (!c.visible) continue; const p = FS.project(this.cam, c.x, c.y + c.sp.h / 2, c.z); if (!p || p.z > FS.FLASH_R) continue; if (p.x > -80 && p.x < FS.W + 80 && p.y > -80 && p.y < FS.H + 80) this.beh(c).onFlash(c, this); }
      }
      return true;
    }
    beh(c) { return FS.Behaviours[c.spId] || FS.Behaviours.default; }

    update(dt) {
      if (this.phase !== 'ride') return;
      this.time += dt;
      for (const k in this.cooldowns) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
      if (this.flashT) this.flashT = Math.max(0, this.flashT - dt);
      // rail
      const sp = FS.RAIL_SPEED * (this.dash && this.hasTool('dash') ? FS.DASH_MULT : 1);
      this.dist += sp * dt;
      if (this.dist >= this.rail.length - 0.01) { this.dist = this.rail.length; this.phase = 'over'; this.emit({ type: 'end' }); }
      // tête : lissage vers la cible
      this.look.yaw += (clamp(this.lookTarget.yaw, -FS.MAX_YAW, FS.MAX_YAW) - this.look.yaw) * Math.min(1, dt * 9);
      this.look.pitch += (clamp(this.lookTarget.pitch, -FS.MAX_PITCH, FS.MAX_PITCH) - this.look.pitch) * Math.min(1, dt * 9);
      this.updateCamera();
      // projectiles
      for (const p of this.projectiles) {
        p.t += dt; p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += dt * 6;
        let hit = null;
        for (const c of this.creatures) if (c.visible) { const rr = Math.max(c.sp.r, c.sp.h * 0.5) * c.scale + 0.25; if (Math.hypot(c.x - p.x, c.y + c.sp.h * c.scale * 0.5 - p.y, c.z - p.z) < rr) { hit = c; break; } }
        if (hit) {
          p.dead = true;
          if (p.kind === 'tabasco') { this.emit({ type: 'splat', x: p.x, y: p.y, z: p.z, creature: hit }); this.beh(hit).onTabasco(hit, this); }
          else { const b = this.addBait(hit.x + (this.rng() - 0.5), hit.y > 0.5 ? hit.y : 0, hit.z + (this.rng() - 0.5), hit); this.beh(hit).onBaitHit(hit, b, this); }
        } else if (p.y <= 0) {
          p.dead = true;
          if (p.kind === 'crouton') this.addBait(p.x, 0, p.z, null); else this.emit({ type: 'splat', x: p.x, y: 0, z: p.z, creature: null });
        } else if (p.t > p.life) p.dead = true;
      }
      this.projectiles = this.projectiles.filter(p => !p.dead);
      // appâts
      for (const b of this.baits) { b.life -= dt; if (b.life <= 0 && !b.eaters.length) b.dead = true; }
      this.baits = this.baits.filter(b => !b.dead);
      // créatures
      for (const c of this.creatures) {
        c.anim += dt; c.poseT += dt;
        if (c.poseT >= c.poseDur) { const n = c.next; c.poseDur = Infinity; if (n) n(c, this); else this.beh(c).rest(c, this); }
        this.beh(c).update(c, dt, this);
      }
      for (const f of this.fx) f.t += dt; this.fx = this.fx.filter(f => f.t < f.dur);
    }
    addBait(x, y, z, hitCreature) {
      const b = { x, y, z, life: FS.BAIT_LIFE, eaters: [], hit: hitCreature, id: ++uid };
      this.baits.push(b); this.emit({ type: 'land', x, y, z });
      for (const c of this.near(x, z, FS.ATTRACT_R)) this.beh(c).onBaitNear(c, b, this);
      return b;
    }

    // ---- cliché : projection de chaque créature visible ; le sujet est la plus « présente » au centre
    takePhoto(extra) {
      if (this.film <= 0 || this.phase !== 'ride') return null;
      this.film--;
      const subjects = [];
      for (const c of this.creatures) {
        if (!c.visible) continue;
        const h = c.sp.h * c.scale, w = Math.max(c.sp.r * 2, h * 0.6) * c.scale;
        const p = FS.project(this.cam, c.x, c.y + h / 2, c.z); if (!p || p.z > FS.FAR) continue;
        const ph = h * p.k, pw = w * p.k;
        const x0 = p.x - pw / 2, x1 = p.x + pw / 2, y0 = p.y - ph / 2, y1 = p.y + ph / 2;
        const ix = Math.max(0, Math.min(x1, FS.W) - Math.max(x0, 0)), iy = Math.max(0, Math.min(y1, FS.H) - Math.max(y0, 0));
        const inside = (ix * iy) / Math.max(1, pw * ph);
        if (inside <= 0) continue;
        // angle : 0 = regarde l'objectif
        const toCam = Math.atan2(this.cam.x - c.x, this.cam.z - c.z), facing = Math.abs(wrap(toCam - c.yaw));
        subjects.push({ cid: c.id, spId: c.spId, name: c.sp.name, pose: c.pose, cx: p.x / FS.W, cy: p.y / FS.H, w: pw / FS.W, h: ph / FS.H, inside, facing, dist: p.z, noFace: !!c.sp.noFace, special: c.pose === 'special' });
      }
      let best = null, bestV = -1;
      for (const s of subjects) { const centre = 1 - clamp(Math.hypot(s.cx - 0.5, s.cy - 0.5) / 0.6, 0, 1); const v = s.inside * (0.3 + s.h) * (0.25 + centre) * (s.special ? 1.4 : 1); if (v > bestV) { bestV = v; best = s; } }
      const photo = { t: this.time, idx: this.photos.length, subjects, subject: best, level: this.level.id, flash: this.flashT > 0 };
      if (best) photo.score = FS.scorePhoto(photo);
      if (extra) Object.assign(photo, extra);
      this.photos.push(photo); this.emit({ type: 'photo', photo });
      return photo;
    }
  }
  FS.Run = Run;

  // ------------------------------------------------------------------ barème du Chef Fernand
  FS.scorePhoto = function (photo) {
    const s = photo.subject; if (!s) return null;
    const centre = 1 - clamp(Math.hypot(s.cx - 0.5, s.cy - 0.5) / 0.5, 0, 1);
    const hn = s.h; let size = hn < 0.2 ? hn / 0.2 : hn <= 0.62 ? 1 : Math.max(0, 1 - (hn - 0.62) / 0.5);
    let cadrage = 500 * centre + 500 * size - 400 * (1 - s.inside); cadrage = clamp(Math.round(cadrage), 0, 1000);
    const pi = FS.POSES[s.pose] || FS.POSES.idle; const pose = pi.score;
    const a = s.facing * 180 / Math.PI; let angle = s.noFace ? 800 : a < 40 ? 1000 : a < 80 ? 750 : a < 120 ? 400 : 100;
    const others = photo.subjects.filter(o => o !== s && o.inside >= 0.5 && o.h >= 0.04).length;
    const garniture = Math.min(800, 200 * others);
    const total = cadrage + pose + angle + garniture;
    const notes = [];
    if (s.pose === 'special') notes.push(FS.FERNAND.special);
    if (!s.noFace && a >= 120) notes.push(FS.FERNAND.back);
    if (s.inside < 0.75) notes.push(FS.FERNAND.cut);
    if (hn < 0.1) notes.push(FS.FERNAND.far); else if (hn > 1.1) notes.push(FS.FERNAND.close);
    if (others >= 2) notes.push(FS.FERNAND.others);
    const tier = total < 1500 ? 'bad' : total < 2800 ? 'meh' : total < 4200 ? 'good' : 'great';
    return { cadrage, pose, angle, garniture, total, others, cat: pi.cat, tier, notes, stamp: FS.stampFor(total) };
  };
  FS.fernandLine = (score, rng) => { const arr = FS.FERNAND[score.tier]; const l = arr[Math.floor((rng ? rng() : Math.random()) * arr.length)]; return l.replace('{pts}', FS.fmt(score.total)); };
})(window.FS);
