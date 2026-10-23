// ============================================================
//  input.js — Souris, clavier, minimap (contrôles type SC1)
// ============================================================
(function (ZC) {
  'use strict';

  class Input {
    constructor(app) {
      this.app = app;
      this.game = app.game;
      this.renderer = app.renderer;
      this.canvas = app.canvas;
      // inWindow reste faux tant que la souris n'a pas bougé : sinon, la souris étant « en (0,0) », le défilement par le bord
      // emmenait la caméra au coin haut-gauche (souvent chez l'ennemi) dès le début de la partie
      this.mouse = { x: 0, y: 0, sx: 0, sy: 0, down: false, dragging: false, inWindow: false, overCanvas: false };
      this.mode = 'normal';   // normal | attack | move | patrol | build | send
      this.hover = null;
      this.hoverPatch = null;   // gisement sous la souris
      this.buildZone = null;
      this.keys = new Set();
      this.lastGroupKey = ''; this.lastGroupT = 0;
      this.ac = new AbortController();
      this.scrollSpeed = 900;
    }

    attach() {
      const sig = { signal: this.ac.signal }, c = this.canvas;
      c.addEventListener('mousedown', e => this.onMouseDown(e), sig);
      window.addEventListener('mousemove', e => this.onMouseMove(e), sig);
      window.addEventListener('mouseup', e => this.onMouseUp(e), sig);
      c.addEventListener('contextmenu', e => e.preventDefault(), sig);
      c.addEventListener('dblclick', e => this.onDblClick(e), sig);
      window.addEventListener('keydown', e => this.onKeyDown(e), sig);
      window.addEventListener('keyup', e => { this.keys.delete(e.code); }, sig);
      document.addEventListener('mouseleave', () => { this.mouse.inWindow = false; }, sig);
      document.addEventListener('mouseenter', () => { this.mouse.inWindow = true; }, sig);
      window.addEventListener('blur', () => { this.keys.clear(); this.mouse.inWindow = false; this.mouse.down = false; this.mouse.dragging = false; }, sig);
      const mm = this.app.ui.minimap;
      mm.addEventListener('mousedown', e => this.onMiniDown(e), sig);
      mm.addEventListener('mousemove', e => { if (e.buttons & 1 && this.mode === 'normal') this.miniCamera(e); }, sig);
      mm.addEventListener('contextmenu', e => e.preventDefault(), sig);
    }
    detach() { this.ac.abort(); this.canvas.style.cursor = 'default'; }

    canvasPos(e) { const r = this.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    worldPos(e) { const p = this.canvasPos(e); return { x: p.x + this.renderer.viewX, y: p.y + this.renderer.viewY }; }

    unitAt(wx, wy) {
      const g = this.game;
      let best = null, bd = Infinity, bestOwn = null, bo = Infinity;
      const q = g.hash.query(wx, wy, 50, g._q);
      for (let i = 0; i < q.length; i++) {
        const u = q[i];
        if (u.dead) continue;
        const d = ZC.dist(wx, wy, u.x, u.y + (u.def.air ? -14 : 0)) - u.radius;
        if (d > 4) continue;
        const pri = u.def.structure ? d + 30 : d;  // les unités mobiles passent devant les structures
        if (u.owner === g.humanId) { if (pri < bo) { bo = pri; bestOwn = u; } }
        else if (pri < bd) { bd = pri; best = u; }
      }
      return bestOwn || best;
    }

    setMode(m) { this.mode = m; this.updateCursor(); this.app.ui.setActiveCommand(m); }
    updateCursor() {
      if (this.mode !== 'normal') this.canvas.style.cursor = 'crosshair';
      else this.canvas.style.cursor = (this.hover && this.hover.owner !== this.game.humanId) ? 'pointer' : 'default';
    }

    hasDropship() { return this.game.ownSelection.some(u => u.type === 'dropship'); }

    onMouseDown(e) {
      if (this.app.paused) return;
      ZC.Audio.init();
      const p = this.canvasPos(e), w = this.worldPos(e);
      if (e.button === 0) {
        if (this.mode !== 'normal') {
          this.executeTargeted(w, this.unitAt(w.x, w.y));
          if (!e.shiftKey) this.setMode('normal');
          return;
        }
        this.mouse.down = true; this.mouse.dragging = false; this.mouse.sx = p.x; this.mouse.sy = p.y;
      } else if (e.button === 2) {
        if (this.mode !== 'normal') { this.setMode('normal'); return; }
        this.smartOrder(w, this.unitAt(w.x, w.y));
      }
    }

    onMouseMove(e) {
      const p = this.canvasPos(e);
      this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.inWindow = true;
      this.mouse.overCanvas = p.x >= 0 && p.y >= 0 && p.x < this.renderer.vw && p.y < this.renderer.vh;
      if (this.mouse.down && !this.mouse.dragging && ZC.dist(p.x, p.y, this.mouse.sx, this.mouse.sy) > 4) this.mouse.dragging = true;
      const w = { x: p.x + this.renderer.viewX, y: p.y + this.renderer.viewY };
      if (!this.mouse.down && this.mouse.overCanvas && !this.app.paused) this.hover = this.unitAt(w.x, w.y);
      else this.hover = null;
      this.hoverPatch = this.mouse.overCanvas && !this.hover ? this.game.patchAt(w.x, w.y) : null;
      this.buildZone = (this.mouse.overCanvas && (this.mode === 'build' || this.hasDropship())) ? this.game.map.zoneAt(w.x, w.y) : null;
      this.updateCursor();
    }

    onMouseUp(e) {
      if (e.button !== 0 || !this.mouse.down) return;
      this.mouse.down = false;
      if (this.app.paused) { this.mouse.dragging = false; return; }
      const g = this.game, r = this.renderer;
      if (this.mouse.dragging) {
        this.mouse.dragging = false;
        const x0 = Math.min(this.mouse.sx, this.mouse.x) + r.viewX, x1 = Math.max(this.mouse.sx, this.mouse.x) + r.viewX;
        const y0 = Math.min(this.mouse.sy, this.mouse.y) + r.viewY, y1 = Math.max(this.mouse.sy, this.mouse.y) + r.viewY;
        const inBox = g.units.filter(u => u.x + u.radius >= x0 && u.x - u.radius <= x1 && u.y + u.radius >= y0 && u.y - u.radius <= y1);
        g.select(inBox, e.shiftKey);
        if (g.selection.length) ZC.Audio.play('select');
      } else {
        const w = { x: this.mouse.x + r.viewX, y: this.mouse.y + r.viewY };
        const u = this.unitAt(w.x, w.y);
        if (u) {
          if (e.ctrlKey || e.metaKey) this.selectSameType(u, e.shiftKey);
          else if (e.shiftKey && g.selection.includes(u) && u.owner === g.humanId) { g.selection = g.selection.filter(v => v !== u); g.selectionVersion++; }
          else g.select([u], e.shiftKey);
          ZC.Audio.play('select');
        } else if (!e.shiftKey && g.selection.length) { g.selection = []; g.selectionVersion++; }
      }
    }

    onDblClick(e) {
      if (this.app.paused) return;
      const w = this.worldPos(e), u = this.unitAt(w.x, w.y);
      if (u && u.owner === this.game.humanId && !u.def.structure) { this.selectSameType(u, e.shiftKey); ZC.Audio.play('select'); }
    }

    selectSameType(u, add) {
      if (u.def.structure) { this.game.select([u], false); return; }
      const r = this.renderer;
      const same = this.game.units.filter(v => v.owner === u.owner && v.type === u.type &&
        v.x >= r.viewX && v.x <= r.viewX + r.vw && v.y >= r.viewY && v.y <= r.viewY + r.vh);
      this.game.select(same.length ? same : [u], add);
    }

    // Clic droit : ralliement (bunker), construction (dropship), attaque ou déplacement
    smartOrder(w, target) {
      const g = this.game;
      const b = g.selectedBunker;
      if (b) {
        b.rally = { x: w.x, y: w.y };
        this.marker(w.x, w.y, g.human.hex);
        ZC.Audio.play('order');
        return;
      }
      const sel = g.ownSelection;
      if (!sel.length) return;
      const drops = sel.filter(u => u.type === 'dropship'), others = sel.filter(u => u.type !== 'dropship');
      const workers = others.filter(u => u.def.worker), patch = !target ? g.patchAt(w.x, w.y) : null;
      if (drops.length) {
        const z = g.map.zoneAt(w.x, w.y);
        if (z && z.owner < 0 && !z.bunker) { g.orderBuild(drops, z); this.marker(z.cx, z.cy, g.human.hex); }
        else g.issueOrder(drops, { type: 'move', x: w.x, y: w.y });
      }
      if (others.length) {
        if (patch && workers.length) { // gisement : les travailleurs récoltent, les autres s'en approchent
          if (patch.amount <= 0) { ZC.Audio.play('error', 0); this.app.ui.message('Ce gisement est épuisé.', '#ff5050'); return; }
          g.issueOrder(others, { type: 'gather', patch }); this.marker(patch.x, patch.y, ZC.MINERALS.color);
        }
        else if (target && g.allied(target.owner, g.humanId) && target.def.structure && workers.length && target.hp < target.maxHp && !others.some(u => u.canGarrison)) {
          g.issueOrder(others, { type: 'repair', target }); this.marker(target.x, target.y, '#ffd040');
        }
        else if (target && target.owner !== g.humanId && !g.allied(target.owner, g.humanId)) { g.issueOrder(others, { type: 'attack', target }); this.marker(target.x, target.y, '#f02020'); }
        else if (target && target.owner === g.humanId && target.def.structure && others.some(u => u.canGarrison)) {
          // Clic droit sur son propre bunker : les unités éligibles entrent en garnison, les autres s'en approchent
          const free = ZC.BUNKER_CAPACITY - target.garrison.length;
          const can = others.filter(u => u.canGarrison), rest = others.filter(u => !u.canGarrison);
          if (free <= 0) { ZC.Audio.play('error', 0); this.app.ui.message('Ce bunker est plein (' + ZC.BUNKER_CAPACITY + ' unités).', '#ff5050'); }
          g.issueOrder(can.slice(0, Math.max(0, free)), { type: 'enter', bunker: target });
          const near = can.slice(Math.max(0, free)).concat(rest);
          if (near.length) g.issueOrder(near, { type: 'move', x: target.x, y: target.y + target.radius + 20 });
          this.marker(target.x, target.y, g.human.hex);
        }
        else { g.issueOrder(others, { type: 'move', x: w.x, y: w.y }); this.marker(w.x, w.y, '#18e818'); }
      } else if (!drops.length) return;
      ZC.Audio.play('order');
    }

    executeTargeted(w, target) {
      const g = this.game;
      if (this.mode === 'send') {
        const b = g.selectedBunker;
        if (!b) return;
        const troops = g.bunkerTroops(b);
        if (!troops.length) { ZC.Audio.play('error', 0); this.app.ui.message('Ce bunker n\'a aucune troupe en vie.', '#ff5050'); return; }
        g.issueOrder(troops, { type: 'attackmove', x: w.x, y: w.y });
        this.marker(w.x, w.y, '#f02020');
        this.app.ui.message(troops.length + ' unités du bunker envoyées.', g.human.hex);
        ZC.Audio.play('order');
        return;
      }
      const sel = g.ownSelection;
      if (!sel.length) return;
      if (this.mode === 'build') {
        const z = g.map.zoneAt(w.x, w.y);
        if (z && z.owner < 0 && !z.bunker && g.orderBuild(sel, z)) { this.marker(z.cx, z.cy, g.human.hex); ZC.Audio.play('order'); }
        else { ZC.Audio.play('error'); this.app.ui.message('Impossible de construire ici : la zone doit être libre.', '#ff5050'); }
        return;
      }
      if (this.mode === 'gather') {
        const patch = g.patchAt(w.x, w.y);
        if (patch && patch.amount > 0) { g.issueOrder(sel, { type: 'gather', patch }); this.marker(patch.x, patch.y, ZC.MINERALS.color); }
        else { ZC.Audio.play('error', 0); this.app.ui.message('Cliquez sur un gisement de minerai vert.', '#ff5050'); return; }
      } else if (this.mode === 'extract') {
        const patch = g.patchAt(w.x, w.y);
        if (patch && patch.amount > 0 && !(patch.extractor && !patch.extractor.dead && !patch.extractor.building)) { g.issueOrder(sel, { type: 'extract', patch }); this.marker(patch.x, patch.y, '#ffd040'); }
        else { ZC.Audio.play('error', 0); this.app.ui.message(patch && patch.extractor ? 'Ce gisement a déjà un extracteur.' : 'Cliquez sur un gisement de minerai vert.', '#ff5050'); return; }
      } else if (this.mode === 'repair') {
        if (target && target.def.structure && g.allied(target.owner, g.humanId)) { g.issueOrder(sel, { type: 'repair', target }); this.marker(target.x, target.y, '#ffd040'); }
        else { ZC.Audio.play('error', 0); this.app.ui.message('Cliquez sur un bunker allié à réparer.', '#ff5050'); return; }
      } else if (this.mode === 'attack') {
        if (target && target.owner !== g.humanId) { g.issueOrder(sel, { type: 'attack', target }); this.marker(target.x, target.y, '#f02020'); }
        else { g.issueOrder(sel, { type: 'attackmove', x: w.x, y: w.y }); this.marker(w.x, w.y, '#f02020'); }
      } else if (this.mode === 'move') { g.issueOrder(sel, { type: 'move', x: w.x, y: w.y }); this.marker(w.x, w.y, '#18e818'); }
      else if (this.mode === 'patrol') { g.issueOrder(sel, { type: 'patrol', x: w.x, y: w.y }); this.marker(w.x, w.y, '#18e818'); }
      ZC.Audio.play('order');
    }

    marker(x, y, color) { this.game.addEffect({ type: 'marker', x, y, life: 0.5, color }); }

    // Commandes de la carte de commandes / raccourcis
    command(cmd) {
      const g = this.game, sel = g.ownSelection, me = g.humanId, ui = this.app.ui;
      const buy = (what, b) => { const ok = g.buy(me, what, b); ui.pressButton(cmd, ok); return ok; };
      ui.pressButton(cmd, true);
      switch (cmd) {
        case 'attack': case 'move': case 'patrol':
          if (sel.length) this.setMode(cmd);
          break;
        case 'gather': case 'repair': case 'extract':
          if (sel.some(u => u.def.worker)) this.setMode(cmd);
          break;
        case 'units': this.app.ui.openSub('units'); break;
        case 'back': this.app.ui.openSub(null); break;
        case 'worker': buy('worker'); break;
        case 'hero': buy('hero'); break;
        case 'build':
          if (this.hasDropship()) this.setMode('build');
          break;
        case 'send':
          if (g.selectedBunker) this.setMode('send');
          break;
        case 'stop':
          if (sel.length) { g.issueOrder(sel, { type: 'stop' }); ZC.Audio.play('order'); }
          this.setMode('normal'); break;
        case 'hold':
          if (sel.length) { g.issueOrder(sel, { type: 'hold' }); ZC.Audio.play('order'); }
          this.setMode('normal'); break;
        case 'stim': {
          let n = 0;
          for (const u of sel) if (u.stimT <= 0 && u.stim()) n++;
          if (n) { ZC.Audio.play('stim', 0); this.app.ui.message('Stimpack !', '#ff8080'); }
          break;
        }
        case 'dropship':
          buy('dropship');
          break;
        case 'evolve':
          if (g.selectedBunker) buy('evolve', g.selectedBunker);
          break;
        case 'unload':
          if (g.selectedBunker && g.unloadBunker(g.selectedBunker)) ZC.Audio.play('order', 0);
          break;
        case 'weapons': case 'armor': case 'range': case 'stimResearch':
          if (g.selectedBunker) buy(cmd === 'stimResearch' ? 'stim' : cmd, g.selectedBunker);
          break;
      }
    }

    onKeyDown(e) {
      const app = this.app, g = this.game;
      if (e.code === 'Escape') { e.preventDefault(); if (this.mode !== 'normal') this.setMode('normal'); else if (app.ui.sub) app.ui.openSub(null); else app.togglePause(); return; }
      if (e.code === 'F10') { e.preventDefault(); app.togglePause(); return; }
      if (app.paused) return;
      this.keys.add(e.code);
      if (e.code === 'Tab') { e.preventDefault(); app.ui.toggleLeaderboard(); return; }
      if (e.code === 'Equal' || e.code === 'NumpadAdd') { e.preventDefault(); app.stepSpeed(1); return; }
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') { e.preventDefault(); app.stepSpeed(-1); return; }
      if (/^Digit[0-9]$/.test(e.code)) {
        e.preventDefault();
        const k = e.code.slice(5);
        if (e.ctrlKey || e.metaKey) {
          // Unités mobiles, ou le bunker sélectionné : au joueur de choisir ce qu'il met sur chaque touche
          const sel = g.selectedBunker ? [g.selectedBunker] : g.ownSelection.slice();
          g.groups[k] = sel;
          if (sel.length) app.ui.message('Groupe ' + k + ' assigné (' + (g.selectedBunker ? (sel[0].def.hq ? 'centre de commandement' : 'bunker') : sel.length + ' unités') + ')', '#9ad0ff');
        }
        else if (e.shiftKey) { const grp = (g.groups[k] || []).filter(u => !u.dead); if (grp.length) g.select(g.ownSelection.concat(grp), false); }
        else {
          const grp = (g.groups[k] || []).filter(u => !u.dead);
          if (grp.length) {
            const now = performance.now();
            if (this.lastGroupKey === k && now - this.lastGroupT < 400) this.centerOnUnits(grp);
            g.select(grp, false);
            this.lastGroupKey = k; this.lastGroupT = now;
            ZC.Audio.play('select');
          }
        }
        return;
      }
      if (e.altKey && g.isAdmin(g.humanId)) {
        const pw = { KeyM: 'minerals', KeyH: 'heal', KeyU: 'maxUpgrades', KeyS: 'wave', KeyK: 'kill' }[e.code];
        if (pw) { e.preventDefault(); g.adminPower(pw); return; }
      }
      const sel = g.ownSelection;
      const bunkerSel = !!g.selectedBunker, workerSel = !bunkerSel && sel.length > 0 && sel.every(u => u.def.worker);
      if (app.ui.cardKind === 'hqUnits') { // sous-carte « Unités » du QG
        const c = { KeyW: 'worker', KeyH: 'hero', KeyX: 'back' }[e.code];
        if (c) { this.command(c); return; }
      }
      switch (e.code) {
        case 'KeyA': this.command('attack'); break;
        case 'KeyM': this.command('move'); break;
        case 'KeyP': this.command('patrol'); break;
        case 'KeyS': this.command('stop'); break;
        case 'KeyH': this.command('hold'); break;
        case 'KeyB': this.command(workerSel ? 'extract' : 'build'); break;
        case 'KeyG': this.command(workerSel ? 'gather' : 'send'); break;
        case 'KeyF': if (bunkerSel && g.selectedBunker.def.hq) this.command('units'); break;
        case 'KeyD': this.command('dropship'); break;
        case 'KeyV': if (bunkerSel) this.command('evolve'); break;
        case 'KeyU': if (bunkerSel) this.command('unload'); break;
        case 'KeyW': if (bunkerSel) this.command('weapons'); break;
        case 'KeyR': if (bunkerSel) this.command('armor'); else if (workerSel) this.command('repair'); break;
        case 'KeyE': if (bunkerSel) this.command('range'); break;
        case 'KeyT': this.command(bunkerSel ? 'stimResearch' : 'stim'); break;
        case 'KeyZ': { const all = g.units.filter(u => u.owner === g.humanId && !u.def.structure && !u.def.air && !u.def.worker); if (all.length) { g.select(all, false); ZC.Audio.play('select'); } break; }
        case 'KeyC': { const sel = g.selection.filter(u => u.owner === g.humanId); if (sel.length) this.centerOnUnits(sel); break; }
        case 'KeyL': app.ui.toggleLeaderboard(); break;
        case 'KeyN': { // bunker suivant
          const bs = g.units.filter(u => u.owner === g.humanId && u.def.structure);
          if (bs.length) { const i = (bs.indexOf(g.selection[0]) + 1) % bs.length; g.select([bs[i]], false); this.centerOnUnits([bs[i]]); ZC.Audio.play('select'); }
          break;
        }
        case 'Space': e.preventDefault(); if (app.lastEvent) this.renderer.centerOn(app.lastEvent.x, app.lastEvent.y); break;
      }
    }

    centerOnUnits(units) {
      let x = 0, y = 0;
      for (const u of units) { x += u.x; y += u.y; }
      this.renderer.centerOn(x / units.length, y / units.length);
    }

    miniWorld(e) {
      const mm = this.app.ui.minimap, r = mm.getBoundingClientRect();
      const mx = (e.clientX - r.left) * (mm.width / r.width), my = (e.clientY - r.top) * (mm.height / r.height);
      const w = this.renderer.miniToWorld(mx, my);
      w.x = ZC.clamp(w.x, 0, this.game.map.w); w.y = ZC.clamp(w.y, 0, this.game.map.h);
      return w;
    }
    miniCamera(e) { const w = this.miniWorld(e); this.renderer.centerOn(w.x, w.y); }
    onMiniDown(e) {
      e.preventDefault();
      if (this.app.paused) return;
      const w = this.miniWorld(e);
      if (e.button === 2) {
        if (this.mode !== 'normal') { this.setMode('normal'); return; }
        this.smartOrder(w, null);
      } else if (e.button === 0) {
        if (this.mode !== 'normal') { this.executeTargeted(w, null); if (!e.shiftKey) this.setMode('normal'); }
        else this.miniCamera(e);
      }
    }

    update(dt) {
      if (this.app.paused) return;
      const r = this.renderer, sp = this.scrollSpeed * dt;
      let dx = 0, dy = 0;
      if (this.keys.has('ArrowLeft')) dx -= sp;
      if (this.keys.has('ArrowRight')) dx += sp;
      if (this.keys.has('ArrowUp')) dy -= sp;
      if (this.keys.has('ArrowDown')) dy += sp;
      if (this.mouse.inWindow && this.app.settings.edgeScroll !== false && !this.mouse.dragging) {
        const m = this.mouse, E = 6, W = window.innerWidth, H = window.innerHeight;
        if (m.x <= E) dx -= sp; else if (m.x >= W - E - 1) dx += sp;
        if (m.y <= E) dy -= sp; else if (m.y >= H - E - 1) dy += sp;
      }
      if (dx || dy) { r.cam.x += dx; r.cam.y += dy; }
    }
  }
  ZC.Input = Input;
})(window.ZC);
