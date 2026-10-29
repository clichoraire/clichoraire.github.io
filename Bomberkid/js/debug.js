// Écran Debug : visionneuse des personnages et de leurs animations, en gros plan et à l'échelle du jeu.
(function (BK) {
  'use strict';
  const ONE_SHOT = { pickup: 0.4, throw: 0.35, place: 0.25, hit: 0.5, dead: 1.3 };
  class Debug {
    constructor() {
      this.charIndex = Math.max(0, BK.ORDER.indexOf(BK.selectedChar || 'zachary')); this.pose = 'walk'; this.view = 'front'; this.zoom = 240; this.speed = 1; this.t = 0; this.all = false; this.scene = true; this.grid = true;
      this.panel = document.getElementById('debug-panel');
      this.build();
      // mini scène 3D à l'échelle du jeu
      this.world = new BK.World({ map: ['#########', '#   x   #', '# # # # #', '#   b   #', '# # # # #', '#   x   #', '#########'], theme: 'forest', mode: 'adventure', hearts: true, softChance: 1 });
      this.player = this.world.addPlayer(BK.charById(BK.ORDER[this.charIndex]), 4, 3);
      this.world.addEnemy('gluant', 6, 1); this.world.addEnemy('ballon', 2, 5);
      const b = { cx: 4, cy: 1, x: 4.5, y: 1.5, z: 0, t: 2.2, fire: 2, owner: null, state: 'idle', passers: new Set(), born: 0, dir: 0 }; this.world.bombs.push(b);
      this.world.spawnItem(6, 5, 'fire'); this.world.spawnItem(2, 1, 'bomb');
      this.world.frozen = true;
      this.cam = new BK.Camera(BK.W, BK.H); this.cam.fit(9, 7, { top: 70, bottom: 40, left: 640, right: 20 });
    }
    build() {
      const P = this.panel; P.innerHTML = '';
      const row = (label, el) => { const d = document.createElement('label'); d.innerHTML = '<span>' + label + '</span>'; d.appendChild(el); P.appendChild(d); return el; };
      const select = (opts, val, on) => { const s = document.createElement('select'); for (const [v, n] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = n; if (v === val) o.selected = true; s.appendChild(o); } s.addEventListener('change', () => on(s.value)); return s; };
      this.selChar = row('Personnage', select(BK.ORDER.map(id => [id, BK.charById(id).name]), BK.ORDER[this.charIndex], v => this.setChar(BK.ORDER.indexOf(v))));
      this.selPose = row('Animation', select(BK.POSES.map(p => [p, BK.POSE_NAMES[p]]), this.pose, v => { this.pose = v; this.t = 0; }));
      this.selView = row('Vue', select([['front', 'Face (vers la caméra)'], ['side', 'Côté droit'], ['sideL', 'Côté gauche'], ['back', 'Dos'], ['turn', 'Tourne (4 vues)']], this.view, v => this.view = v));
      const z = document.createElement('input'); z.type = 'range'; z.min = 80; z.max = 480; z.value = this.zoom; z.addEventListener('input', () => this.zoom = +z.value); row('Zoom', z);
      const sp = document.createElement('input'); sp.type = 'range'; sp.min = 0; sp.max = 200; sp.value = 100; sp.addEventListener('input', () => this.speed = sp.value / 100); row('Vitesse', sp);
      const chk = (label, val, on) => { const c = document.createElement('input'); c.type = 'checkbox'; c.checked = val; c.addEventListener('change', () => on(c.checked)); row(label, c); };
      chk('Toute la famille', this.all, v => this.all = v); chk('Scène à l’échelle du jeu', this.scene, v => this.scene = v); chk('Repères', this.grid, v => this.grid = v);
      const b = document.createElement('button'); b.textContent = 'Retour au menu'; b.addEventListener('click', () => BK.toMenu()); P.appendChild(b);
      const help = document.createElement('p'); help.className = 'hint'; help.textContent = '← → personnage · ↑ ↓ animation · Espace : rejoue'; P.appendChild(help);
    }
    setChar(i) { this.charIndex = (i + BK.ORDER.length) % BK.ORDER.length; this.selChar.value = BK.ORDER[this.charIndex]; this.player.def = BK.charById(BK.ORDER[this.charIndex]); this.t = 0; }
    update(dt) {
      const K = BK.input; this.t += dt * this.speed;
      if (K.hit(['ArrowRight'])) this.setChar(this.charIndex + 1); if (K.hit(['ArrowLeft'])) this.setChar(this.charIndex - 1);
      if (K.hit(['ArrowDown', 'ArrowUp'])) { const i = BK.POSES.indexOf(this.pose), n = (i + (K.hit(['ArrowDown']) ? 1 : -1) + BK.POSES.length) % BK.POSES.length; this.pose = BK.POSES[n]; this.selPose.value = this.pose; this.t = 0; }
      if (K.hit(['Space'])) this.t = 0; if (K.hit(['Escape'])) BK.toMenu();
      this.world.time += dt; for (const e of this.world.enemies) e.t += dt; for (const it of this.world.items) it.t += dt;
    }
    // temps de pose : les animations courtes se rejouent en boucle avec une pause
    poseT() { const d = ONE_SHOT[this.pose]; if (!d) return this.t; return this.t % (d + 0.7); }
    viewFor(i) {
      if (this.view === 'turn') { const k = Math.floor(this.t / 1.6 + (i || 0)) % 4; return [['front', false], ['side', false], ['back', false], ['side', true]][k]; }
      if (this.view === 'sideL') return ['side', true]; return [this.view, false];
    }
    render(ctx) {
      ctx.fillStyle = '#1b2230'; ctx.fillRect(0, 0, BK.W, BK.H);
      const def = BK.charById(BK.ORDER[this.charIndex]), pt = this.poseT();
      const walkT = this.t * 9;
      const draw = (d, x, y, s, i) => {
        const [view, flip] = this.viewFor(i);
        ctx.save(); ctx.translate(x, y);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.36 * (d.size || 1) + s * 0.05, s * 0.1, 0, 0, Math.PI * 2); ctx.fill();
        BK.sprites.drawCharacter(ctx, d, { s, pose: this.pose, t: this.t, poseT: pt, view, flip, walk: walkT, carrying: this.pose === 'carry' || this.pose === 'carrywalk' || (this.pose === 'pickup' && pt > 0.2) || (this.pose === 'throw' && pt < 0.12), bombT: this.t });
        ctx.restore();
      };
      const area = this.scene ? 620 : BK.W, cx = area / 2, cy = this.all ? 420 : 520;
      if (this.grid) { ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; for (let x = 0; x < area; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BK.H); ctx.stroke(); } for (let y = 0; y < BK.H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(area, y); ctx.stroke(); } ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(area - 20, cy); ctx.stroke(); }
      draw(def, cx, cy, this.zoom, 0);
      if (this.grid) { const H = this.zoom * (0.8 + 0.7 * (def.size || 1)); ctx.strokeStyle = 'rgba(255,213,74,0.5)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx - this.zoom * 0.5, cy - H); ctx.lineTo(cx + this.zoom * 0.5, cy - H); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#ffd54a'; ctx.font = '14px Nunito, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('hauteur ' + (H / this.zoom).toFixed(2) + ' case', cx + this.zoom * 0.52, cy - H + 5); }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 28px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(def.name + '  ·  ' + BK.POSE_NAMES[this.pose], cx, 44);
      ctx.font = '16px Nunito, sans-serif'; ctx.fillStyle = '#9fb3c8'; ctx.fillText('taille ' + def.size + ' · vitesse ' + def.speed + '★ · combinaison ' + def.outfit + ' · accent ' + def.accent + ' · t = ' + pt.toFixed(2) + ' s', cx, 70);
      if (this.all) {
        const n = BK.ORDER.length, s = Math.min(78, (area - 40) / n * 1.1);
        BK.ORDER.forEach((id, i) => { const d = BK.charById(id); draw(d, 30 + (i + 0.5) * (area - 60) / n, BK.H - 40, s, 0); ctx.fillStyle = i === this.charIndex ? '#ffd54a' : '#9fb3c8'; ctx.font = '12px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(d.name, 30 + (i + 0.5) * (area - 60) / n, BK.H - 18); });
      }
      if (this.scene) {
        const p = this.player, [view, flip] = this.viewFor(0);
        p.dir = view === 'front' ? 0 : view === 'back' ? 2 : flip ? 1 : 3; p.pose = this.pose; p.animT = this.t; p.poseT = pt; p.walk = walkT;
        p.carrying = (this.pose === 'carry' || this.pose === 'carrywalk' || (this.pose === 'pickup' && pt > 0.2) || (this.pose === 'throw' && pt < 0.12)) ? { t: 2.2, born: 0 } : null;
        ctx.save(); ctx.beginPath(); ctx.rect(area, 0, BK.W - area, BK.H); ctx.clip();
        this.world.render(ctx, this.cam, { noShake: true, names: true });
        ctx.restore();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('À l’échelle du jeu', area + (BK.W - area) / 2, 44);
      }
    }
  }
  BK.Debug = Debug;
})(window.BK);
