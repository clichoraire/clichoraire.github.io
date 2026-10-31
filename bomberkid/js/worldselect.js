// Sélection du monde et du tableau : des îles flottantes dans le ciel, chacune bâtie avec le moteur du jeu dans son décor.
// Chaque monde porte un château coiffé d'un gros diamant. Quand on entre dans un monde, on « zoome » sur son île :
// elle devient la grande île du bas et ses tableaux apparaissent au-dessus, chacun sur sa propre petite île.
(function (BK) {
  'use strict';
  const TAU = Math.PI * 2;
  // Petites îles des mondes (légende des cartes d'exploration ; l'espace = vide, l'île flotte). Le centre reste libre pour le château.
  const MAPS = {
    foret: ['         ', ' ,x,,,x, ', ' ,,...,, ', ' ....... ', ' ,x...x, ', ' ,,,.,,, ', '         '],
    chateau: ['         ', ' W.....W ', ' ....... ', ' ....... ', ' ....... ', ' W.....W ', '         '],
    volcan: ['         ', ' ..#...# ', ' ....... ', ' #.....# ', ' ....... ', ' #...#.. ', '         '],
    perso: ['         ', ' ..,,,.. ', ' .x...x. ', ' ....... ', ' .W...W. ', ' ..,,,.. ', '         '],
    maison: ['         ', ' ,,,,,,, ', ' ,T###,, ', ' ,,#H#T, ', ' ,,,.,,, ', ' ,x,,,x, ', '         '],
  };
  // Miniatures composées à partir des éléments propres aux cinq tableaux.
  const FIRST_PREVIEWS = {
    '1-1': {map:['       ',' T,,,T ',' ,H,H, ',' ,,-,, ',' T,-,T ',' ,,-,, ','       '],houses:{'2,2':{w:1,d:1,roof:'#db6545'},'4,2':{w:1,d:1,roof:'#6b70c5'}}},
    '1-2': {map:['       ',' ,#x#, ',' ,#-#, ',' ---x, ',' x#-#, ',' ,,-,, ','       ']},
    '1-3': {map:['       ',' #x;"; ',' ,#;;; ',' A,B/C ',' ,#-;; ',' ,,-,, ','       '],props:{'4,1':{deco:'volcano',previewScale:.42},'5,3':{lv:1}}},
    '1-4': {map:['       ',' [---[ ',' --"-- ',' [---[ ',' [-[-[ ',' [---[ ','       '],props:{'3,2':{deco:'volcano'}}},
    '1-5': {map:['       ',' [#%#[ ',' [%%%[ ',' "%%%" ',' [%%%[ ',' [%-%[ ','       '],props:{'1,3':{deco:'campfire'},'5,3':{deco:'campfire'}}}
  };
  Object.assign(FIRST_PREVIEWS,{
    '2-1':{map:['       ',' #%.%# ',' ,%.%, ',' ,---, ',' ,-[-, ',' ,---, ','       ']},
    '2-2':{map:['       ',' ##.## ',' \"q.q\" ',' ,%J%, ',' T%q%T ',' ,%q%, ','       '],props:{'1,2':{deco:'castle_armor'},'5,2':{deco:'banner'}}},
    '2-3':{map:['       ',' \"q.q\" ',' zq.qz ',' Iq.qI ',' zq.qz ',' \"q.q\" ','       '],props:{'1,1':{deco:'castle_throne'},'5,1':{deco:'castle_glass'},'1,5':{deco:'bookshelf'},'5,5':{deco:'castle_lectern'}}},
    '2-4':{map:['       ',' ##G## ',' \".-.\" ',' .#-#. ',' \".-.\" ',' ..-.. ','       '],props:{'1,2':{deco:'crypt_0'},'5,2':{deco:'crypt_1'},'1,4':{deco:'crypt_3'},'5,4':{deco:'crypt_6'}}},
    '2-5':{map:['       ',' \"...\" ',' ..... ',' ..... ',' \"...\" ','   =   ','       '],props:{'1,1':{deco:'crypt_3'},'5,1':{deco:'crypt_3'},'1,4':{deco:'lamp',lightColor:'purple'},'5,4':{deco:'lamp',lightColor:'purple'}}}
  });
  const CODES = { b: 'ballon', g: 'gluant', f: 'fantome', k: 'chevalier', t: 'crapaud', o: 'golem' };
  const ease = u => u * u * (3 - 2 * u), lerp = (a, b, u) => a + (b - a) * u;
  class WorldSelect {
    constructor(charId, o) {
      o = o || {};
      this.charId = charId; this.def = BK.charById(charId); this.save = BK.loadAdventure(charId); this.t = 0; if (BK.music) BK.music.play('worlds');
      this.worlds = [{ id: 'maison', name: 'Chez les grands-parents', theme: 'garden', hub: true, stages: [] }].concat(BK.WORLDS, [{ id: 'volcan', name: 'Le Volcan', theme: 'lava', stages: [], soon: true }, { id: 'perso', name: 'Mes tableaux', theme: 'garden', stages: BK.loadMaps().map(m => ({ id: m.id, name: m.name })), custom: true }]);
      const list = BK.stageList(); this.firstIndex = this.worlds.map(w => list.findIndex(s => s.world === w));
      this.unlocked = this.worlds.map((w, i) => w.custom || w.hub || (!w.soon && (this.firstIndex[i] === 0 || this.save.unlocked > this.firstIndex[i])));
      this.index = 0; for (let i = this.worlds.length - 1; i >= 0; i--) { const w = this.worlds[i]; if (!w.hub && !w.custom && this.unlocked[i] && this.save.unlocked > this.firstIndex[i] + 1) { this.index = i; break; } }
      this.pos = this.index; this.flash = 0; this.enterT = 0;
      this.islands = this.worlds.map(w => { const W = new BK.World({ map: MAPS[w.id] || MAPS.foret, theme: w.theme, mode: 'adventure', hearts: true, explore: true, itemChance: 0 }); W.frozen = true; return W; });
      this.cam = new BK.Camera(BK.W, BK.H);
      this.clouds = Array.from({ length: 9 }, (_, i) => ({ x: Math.random() * 1500, y: 60 + Math.random() * 560, s: 0.5 + Math.random() * 1.1, v: 6 + Math.random() * 10 }));
      // mode : 'worlds' (choix du monde), 'zoomIn' / 'zoomOut' (transition), 'stages' (tableaux du monde ouvert)
      this.mode = 'worlds'; this.zt = 0; this.stageIslands = []; this.stageIndex = 0; this.world = null; this.rects = [];
      this.player = null; this.placePlayer();
      try { BK.playTime = BK.playTime || +(localStorage.getItem('bk.playtime') || 0); } catch (e) { }
      if (o.zoom != null) { const wi = typeof o.zoom === 'number' ? this.worlds.indexOf(BK.WORLDS[o.zoom]) : this.worlds.findIndex(w => w.id === o.zoom); if (wi >= 0 && this.unlocked[wi]) { this.index = this.pos = wi; this.openWorld(wi, true); if (o.pick != null) { this.stageIndex = Math.max(0, Math.min(this.stageIslands.length - 1, +o.pick)); this.placePlayer(); } } }
    }
    placePlayer() {
      for (const W of this.islands) W.players.length = 0; for (const s of this.stageIslands) s.W.players.length = 0;
      const onStage = (this.mode === 'stages' || this.mode === 'zoomIn') && this.stageIslands.length;
      const W = onStage ? this.stageIslands[this.stageIndex].W : this.islands[this.index];
      this.player = W.addPlayer(this.def, onStage ? 3 : 2, onStage&&W.previewStage?5:3); this.player.dir = 0; this.player.pose = 'idle'; this.playerWorld = W; this.equipPlayer();
    }
    // Le héros de la carte porte son sac (achats et pots de miel de la sauvegarde) : I ou le bouton « Mon sac » l'ouvrent.
    equipPlayer() { const p = this.player, save = this.save; if (!p) return; BK.applyStats(p, save); p.found = []; p.inv = (save.inv || []).filter(s => s.n > 0).map(s => ({ type: s.type, n: s.n, perm: s.n, ...(s.snails ? { snails: s.snails.map(sn => ({ ...sn })) } : {}) })); p.bagSlots = (save.bagSlots || []).slice(); p.quickSlots = (save.quickSlots || []).slice(); }
    bagHost() { const p = this.player, W = this.playerWorld; if (!p || !W) return null; return { player: p, world: W, save: this.save, charId: this.charId, syncInv: () => { BK.normalizeRemedyBag(p); this.save.bagSlots = (p.bagSlots || []).slice(); this.save.quickSlots = (p.quickSlots || []).slice(); this.save.inv = (p.inv || []).filter(s => (s.perm || 0) > 0).map(s => ({ type: s.type, n: s.perm, ...(BK.ITEMS[s.type]?.snailColor ? { snails: BK.snailStack(s).filter(sn => sn.perm).map(sn => ({ ...sn })) } : {}) })); } }; }
    // Ouvre un monde : une petite île par tableau, avec au centre le marqueur de son objectif
    // (portail, boss, monstres ou interrupteur). Le tableau choisi d'office : le premier pas encore réussi.
    openWorld(i, instant) {
      const w = this.worlds[i]; this.world = w; const all = BK.stageList(), save = this.save;
      this.stageIslands = w.stages.map((s) => {
        const gi = all.findIndex(x => x.id === s.id), theme = s.theme || w.theme, grassy = theme === 'garden' || theme === 'forest';
        let map = ['       ', grassy ? ' ,,,,, ' : ' ..... ', ' ..... ', grassy ? ' ,,,,, ' : ' ..... ', '       '].map(l => l.split(''));
        if (s.objective === 'goal' && s.preview!=='volcano') map[2][3] = 'G';
        const preview=FIRST_PREVIEWS[s.id];let props={};if(s.preview==='volcano'&&!preview)for(let r=1;r<=3;r++)for(let c=2;c<=4;c++){map[r][c]='"';props[c+','+r]=c===3&&r===2?{deco:'volcano'}:{deco:'volcanopart',of:'3,2'};}
        if(preview){map=preview.map.map(r=>r.split(''));props=preview.props||{};}
        const W = new BK.World({ map: map.map(l => l.join('')), props, houses:preview?.houses, theme, mode: 'adventure', hearts: true, explore: true, itemChance: 0 }); W.frozen = true;W.previewStage=!!preview;
        const txt = (s.map || []).join('');
        if (s.objective === 'boss') W.addEnemy(s.encounter==='castleBoss'?'alt_agahnim':(s.encounter==='firstBoss'||txt.includes('o'))?'golem':'crapaud', 3, 2);
        else if (s.objective === 'switches') { const sw = { c: 3, r: 2, on: !!save.best[s.id] }; W.switches.push(sw); W.special.set('3,2', { type: 'switch', sw }); }
        else if (s.objective === 'enemies') { const types = [...new Set(txt.split('').map(ch => CODES[ch]).filter(Boolean))]; (types.length ? types : ['ballon']).slice(0, 2).forEach((t, j) => W.addEnemy(t, j ? 4 : 2, 2)); }
        if(s.id==='2-1')W.addEnemy('bombtower',4,2);
        if(s.id==='1-5'){W.addEnemy('crapaud',2,4);W.addEnemy('crapaud',4,4);W.enemies[0].phase=2;}
        for (const e of W.enemies) e.dir = 0;
        return { stage: s, W, gi, locked: gi + 1 > save.unlocked, done: !!save.best[s.id], pop: instant ? 1 : 0 };
      });
      let si = 0; this.stageIslands.forEach((s, k) => { if (!s.locked) si = k; }); const undone = this.stageIslands.findIndex(s => !s.locked && !s.done); if (undone >= 0) si = undone; this.stageIndex = si;
      this.mode = instant ? 'stages' : 'zoomIn'; this.zt = instant ? 1 : 0; this.placePlayer();
    }
    back() { if (this.mode !== 'stages' || this.enterT > 0) return; BK.audio.click(); this.mode = 'zoomOut'; this.placePlayer(); }
    move(d) {
      if (this.mode === 'stages') { const n = this.stageIndex + d; if (n < 0 || n >= this.stageIslands.length) { this.flash = 0.2; return; } this.stageIndex = n; BK.audio.click(); this.placePlayer(); return; }
      if (this.mode !== 'worlds') return;
      const n = this.index + d; if (n < 0 || n >= this.worlds.length) { this.flash = 0.2; return; } this.index = n; BK.audio.click(); this.placePlayer();
    }
    enter() {
      if (this.enterT > 0) return;
      if (this.mode === 'stages') {
        const st = this.stageIslands[this.stageIndex]; if (!st || st.locked) { this.flash = 0.3; BK.audio.hurt(); return; }
        BK.audio.win(); this.enterT = 0.8; this.player.pose = 'win'; this.player.poseDur = 99; return;
      }
      if (this.mode !== 'worlds') return;
      if (!this.unlocked[this.index]) { this.flash = 0.3; BK.audio.hurt(); return; }
      const w = this.worlds[this.index];
      if (w.hub || w.custom) { BK.audio.win(); this.enterT = 0.9; this.player.pose = 'win'; this.player.poseDur = 99; return; }
      BK.audio.win(); this.openWorld(this.index, false);
    }
    onClick(x, y) {
      if (this.mode === 'stages') {
        for (const r of this.rects) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { if (r.action) { r.action(); return; } if (r.k === this.stageIndex) this.enter(); else { this.stageIndex = r.k; BK.audio.click(); this.placePlayer(); } return; }
        if (x < 300 && y > 200 && y < 450) this.move(-1); else if (x > 980 && y > 200 && y < 450) this.move(1);
        return;
      }
      if (this.mode !== 'worlds') return;
      if (x < 300 && y > 250 && y < 520) this.move(-1); else if (x > 980 && y > 250 && y < 520) this.move(1);
      else if (x > 300 && x < 980 && y > 150 && y < 600) this.enter();
    }
    resetProgress() { BK.confirmDialog({ title: '🗑️ Effacer la progression ?', text: 'La progression de ' + this.def.name + ' dans l’aventure (tableaux réussis, meilleurs scores) sera effacée. L’or de la famille et les défis sont conservés.', confirmLabel: 'Effacer', onConfirm: () => this.doResetProgress() }); }
    doResetProgress() {
      BK.saveAdventure(this.charId, { unlocked: 1, best: {}, score: 0 }); this.save = BK.loadAdventure(this.charId);
      this.unlocked = this.worlds.map((w, i) => w.custom || w.hub || (!w.soon && (this.firstIndex[i] === 0 || this.save.unlocked > this.firstIndex[i])));
if (this.unlocked[this.index]) this.openWorld(this.index, true); else { this.index = this.pos = 1; this.openWorld(1, true); }
    }
    update(dt) {
      const K = BK.input; this.t += dt; this.pos += (this.index - this.pos) * Math.min(1, dt * 6); if (this.flash > 0) this.flash -= dt;
      for (const W of this.islands) { W.time += dt; for (const p of W.players) { p.animT += dt; p.poseT += dt; } for (const e of W.enemies) e.t += dt; }
      for (const s of this.stageIslands) { const W = s.W; W.time += dt; for (const p of W.players) { p.animT += dt; p.poseT += dt; } for (const e of W.enemies) { e.t += dt; e.stateT += dt; } }
      if (this.mode === 'zoomIn') { this.zt = Math.min(1, this.zt + dt / 0.9); this.stageIslands.forEach((s, k) => { s.pop = Math.max(0, Math.min(1, (this.zt - 0.4 - k * 0.06) / 0.25)); }); if (this.zt >= 1) this.mode = 'stages'; return; }
      if (this.mode === 'zoomOut') { this.zt = Math.max(0, this.zt - dt / 0.7); this.stageIslands.forEach(s => { s.pop = Math.max(0, Math.min(1, (this.zt - 0.3) / 0.3)); }); if (this.zt <= 0) { this.mode = 'worlds'; this.stageIslands = []; this.world = null; this.placePlayer(); } return; }
      if (this.enterT > 0) {
        this.enterT -= dt;
        if (this.enterT <= 0) {
          if (this.mode === 'stages') { BK.startAdventure(this.charId, this.stageIslands[this.stageIndex].gi); return; }
          const w = this.worlds[this.index]; if (w.hub) BK.startHub(this.charId); else BK.showAdventureSelect(this.charId, 'custom');
        }
        return;
      }
      if (K.hit(['KeyI']) && (this.mode === 'worlds' || this.mode === 'stages')) { BK.openInventory(this); return; }
      if (K.hit(['ArrowLeft', 'KeyA'])) this.move(-1); if (K.hit(['ArrowRight', 'KeyD'])) this.move(1);
      if (K.hit(['Enter', 'Space', 'KeyX'])) this.enter();
      if (K.hit(['Escape'])) { if (this.mode === 'stages') this.back(); else { BK.current = null; BK.pickCharacter(BK.adventurePicker()); } }
    }
    // Une île : roche à facettes dessous, le monde dessiné dessus, puis (mondes) le château et son diamant.
    drawIsland(ctx, W, x, y, scale, locked, o) {
      o = o || {}; const cam = this.cam, T = W.theme;
      cam.target = { x: W.cols / 2, y: W.rows / 2 + 0.3 }; cam.dist = (W.previewStage?31:27) / scale; cam.ox = Math.round(x - BK.W / 2); cam.oy = Math.round(y - BK.H / 2);
      const x0 = 1, y0 = 1, x1 = W.cols - 1, y1 = W.rows - 1, apex = cam.project((x0 + x1) / 2, (y0 + y1) / 2, -9);
      const corners = [cam.project(x0, y0, -0.05), cam.project(x1, y0, -0.05), cam.project(x1, y1, -0.05), cam.project(x0, y1, -0.05)];
      ctx.save(); if (locked) ctx.globalAlpha *= 0.55;
      const rock = T.cliff || '#8a6a4a', dark = T.cliffDark || '#5e4731';
      const face = (a, b, col) => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(apex.x, apex.y); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
      face(corners[3], corners[2], rock); face(corners[0], corners[3], dark); face(corners[2], corners[1], dark);
      ctx.fillStyle = dark; for (let k = 0; k < 3; k++) { const a = this.t * 0.6 + k * 2.1, px = apex.x + Math.cos(a) * 70 * scale, py = apex.y + 20 * scale + Math.sin(a) * 14 * scale + k * 16 * scale; ctx.beginPath(); ctx.moveTo(px - 8 * scale, py); ctx.lineTo(px, py - 9 * scale); ctx.lineTo(px + 8 * scale, py); ctx.lineTo(px, py + 7 * scale); ctx.closePath(); ctx.fill(); }
      W.render(ctx, cam, { noBackground: true, noShake: true });
      if (o.castle) { const c = cam.project(W.cols / 2, W.rows / 2 + 0.3, 0); BK.sprites.drawCastle(ctx, c.x, c.y, c.k, this.t, T, { locked }); }
      if (o.volcano) { const c = cam.project(4.5, 1.5, 0.6); ctx.fillStyle = 'rgba(90,90,90,0.5)'; for (let k = 0; k < 3; k++) { const yy = c.y - ((this.t * 30 + k * 30) % 90) * scale; ctx.beginPath(); ctx.arc(c.x + Math.sin(this.t + k) * 10 * scale, yy, (10 + k * 4) * scale, 0, TAU); ctx.fill(); } }
      ctx.restore();
      if (locked) { const c = cam.project(W.cols / 2, W.rows / 2, o.castle ? 3.4 : 2.2); ctx.font = Math.round(56 * scale) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔒', c.x, c.y); }
    }
    panel(ctx, x, y, w, h) { BK.sprites.uiPanel(ctx, x, y, w, h, { r: 18 }); }
    title(ctx, text, x, y, size, color) { ctx.font = '900 ' + size + 'px Nunito, "Arial Rounded MT Bold", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.strokeStyle = color === BK.sprites.UI.text || color === BK.sprites.UI.bad ? '#ffffff' : '#1b2a4a'; ctx.lineWidth = size * (color === BK.sprites.UI.text || color === BK.sprites.UI.bad ? 0.1 : 0.18); ctx.strokeText(text, x, y + size * 0.06); ctx.fillStyle = color; ctx.fillText(text, x, y); }
    button(ctx, label, x, y, w, h, action, primary) {
      BK.sprites.uiButton(ctx, x, y, w, h, label, { primary });
      this.rects.push({ x, y, w, h, action });
    }
    render(ctx) {
      const W = BK.W, H = BK.H;
      // ciel, soleil, montagnes, nuages
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3f78e0'); g.addColorStop(0.6, '#8fc4ff'); g.addColorStop(1, '#d8efff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const sg = ctx.createRadialGradient(1080, 110, 10, 1080, 110, 160); sg.addColorStop(0, 'rgba(255,245,200,0.95)'); sg.addColorStop(0.3, 'rgba(255,230,150,0.5)'); sg.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = sg; ctx.fillRect(880, -50, 400, 350);
      ctx.fillStyle = '#5c6fb0'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, H * 0.78 - Math.abs(Math.sin(x * 0.006)) * 150 - Math.sin(x * 0.02) * 25); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a8cc8'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, H * 0.9 - Math.abs(Math.sin(x * 0.004 + 1)) * 110 - Math.sin(x * 0.03) * 15); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (const c of this.clouds) { const x = ((c.x + this.t * c.v) % (W + 300)) - 150; for (const [ox, oy, r] of [[0, 0, 26], [22, -10, 20], [-20, -6, 18], [40, 4, 16], [-36, 6, 14]]) { ctx.beginPath(); ctx.arc(x + ox * c.s, c.y + oy * c.s, r * c.s, 0, TAU); ctx.fill(); } }
      this.rects = [];
      // îles des mondes : la sélectionnée au centre, plus grande ; les autres de chaque côté.
      // Pendant le zoom, elle grossit et descend pour devenir la grande île du bas ; les autres s'écartent et s'effacent.
      const cx = 640, cy = 390, z = this.mode === 'worlds' ? 0 : ease(this.zt);
      const order = this.worlds.map((w, i) => ({ w, i, d: i - this.pos })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
      for (const o of order) {
        if (Math.abs(o.d) > 1.7) continue; const k = Math.min(1, Math.abs(o.d)), bob = Math.sin(this.t * 1.4 + o.i * 2) * 8;
        let x = cx + o.d * 440, y = cy - k * 90 + bob + (this.enterT > 0 && o.i === this.index && this.mode === 'worlds' ? -(0.9 - this.enterT) * 60 : 0), scale = 1 - k * 0.5;
        ctx.save();
        if (o.i === this.index) { x = lerp(x, 640, z); y = lerp(y, 715 + bob * 0.5, z); scale = lerp(scale, 1.8, z); }
        else { if (z >= 1) { ctx.restore(); continue; } ctx.globalAlpha = 1 - z; x += Math.sign(o.d || 1) * z * 500; }
        this.drawIsland(ctx, this.islands[o.i], x, y, scale, !this.unlocked[o.i], { castle: !o.w.hub, volcano: o.w.id === 'volcan' });
        ctx.restore();
      }
      if (this.mode === 'worlds' || z < 0.5) {
        const a0 = 1 - z * 2;
        ctx.save(); ctx.globalAlpha = Math.max(0, a0);
        const arrow = (x, dir, on) => { ctx.save(); ctx.translate(x + Math.sin(this.t * 4) * 5 * dir, cy); ctx.fillStyle = '#1b2a4a'; ctx.beginPath(); ctx.moveTo(dir * 44, 4); ctx.lineTo(-dir * 30, -40); ctx.lineTo(-dir * 30, 48); ctx.closePath(); ctx.fill(); ctx.fillStyle = on ? '#ff5a4a' : '#8a7a7a'; ctx.beginPath(); ctx.moveTo(dir * 40, 0); ctx.lineTo(-dir * 30, -40); ctx.lineTo(-dir * 30, 40); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(dir * 30, -4); ctx.lineTo(-dir * 24, -32); ctx.lineTo(-dir * 24, -6); ctx.closePath(); ctx.fill(); ctx.restore(); };
        arrow(150, -1, this.index > 0); arrow(1130, 1, this.index < this.worlds.length - 1);
        this.title(ctx, 'CHOISIS TON MONDE', 640, 58, 54, '#ffd54a');
        const w = this.worlds[this.index], done = w.stages.filter(s => this.save.best[s.id]).length;
        this.panel(ctx, 340, 598, 600, 96);
        this.title(ctx, w.name, 640, 630, 40, this.flash > 0 ? BK.sprites.UI.bad : BK.sprites.UI.text);
        ctx.font = 'bold 20px Nunito, sans-serif'; ctx.fillStyle = BK.sprites.UI.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; BK.sprites.textWithCoin(ctx, w.soon ? 'Bientôt…' : w.hub ? 'La maison de Josée et Richard, et le magasin · 🪙 ' + (this.save.gold || 0) : w.custom ? (w.stages.length ? w.stages.length + ' tableau' + (w.stages.length > 1 ? 'x' : '') + ' créé' + (w.stages.length > 1 ? 's' : '') + ' dans l’éditeur' : 'Aucun tableau : crée-en un avec l’Éditeur !') : this.unlocked[this.index] ? done + ' / ' + w.stages.length + ' tableaux réussis' : 'Termine le monde précédent pour y aller', 640, 672);
        const pt = Math.floor(BK.playTime || 0), hh = String(Math.floor(pt / 3600)).padStart(2, '0'), mm = String(Math.floor(pt % 3600 / 60)).padStart(2, '0');
        this.panel(ctx, 24, 24, 250, 80); ctx.textAlign = 'left'; ctx.font = 'bold 18px Nunito, sans-serif'; ctx.fillStyle = BK.sprites.UI.muted; ctx.fillText('Temps de jeu', 44, 50); ctx.font = '900 30px Nunito, sans-serif'; ctx.fillStyle = BK.sprites.UI.gold; ctx.fillText(hh + ' h ' + mm + ' min', 44, 84);
        this.panel(ctx, 1006, 24, 250, 80); ctx.textAlign = 'right'; ctx.font = 'bold 18px Nunito, sans-serif'; ctx.fillStyle = BK.sprites.UI.muted; ctx.fillText(this.def.name, 1236, 50); ctx.font = '900 26px Nunito, sans-serif'; ctx.fillStyle = BK.sprites.UI.gold; BK.sprites.textWithCoin(ctx, 'Niveau ' + BK.levelFromXp(this.save.xp || 0).level + ' · 🪙 ' + (this.save.gold || 0), 1236, 84);
        ctx.font = 'bold 17px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText('← → choisir   ·   Entrée ou clic : entrer   ·   Échap : retour', 640, 712);
        ctx.restore();
      }
      if (this.stageIslands.length && z > 0) this.renderStages(ctx, z);
    }
    // Les tableaux du monde ouvert : une rangée de petites îles au-dessus de la grande, la choisie un peu plus grosse.
    renderStages(ctx, z) {
      const S = this.stageIslands, n = S.length, w = this.world, spacing = Math.min(250, 1120 / Math.max(1, n));
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, (z - 0.5) * 2));
      this.title(ctx, w.name.toUpperCase(), 640, 58, 48, BK.sprites.UI.gold);
      ctx.font = 'bold 20px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = BK.sprites.UI.text; ctx.fillText(this.save.score ? 'Meilleur score : ' + this.save.score + '  ·  Choisis un tableau' : 'Choisis un tableau. Les suivants se débloquent en réussissant le précédent.', 640, 100);
      ctx.restore();
      const order = S.map((s, k) => k).sort((a, b) => (a === this.stageIndex) - (b === this.stageIndex));
      for (const k of order) {
        const s = S[k]; if (s.pop <= 0) continue; const sel = k === this.stageIndex, pop = ease(s.pop);
        const bob = Math.sin(this.t * 1.6 + k * 1.3) * 6, x = 640 + (k - (n - 1) / 2) * spacing, y = 325 - (sel ? 22 : 0) + bob + (1 - pop) * 60 + (this.enterT > 0 && sel ? -(0.8 - this.enterT) * 70 : 0);
        const scale = (sel ? 0.78 : 0.6) * pop;
        ctx.save(); ctx.globalAlpha = pop;
        this.drawIsland(ctx, s.W, x, y, scale, s.locked, {});
        // étiquette : numéro, nom, objectif
        const u = scale / 0.6;
        this.title(ctx, s.stage.id+(s.stage.id==='1-5'?' · BOSS':''), x, y - (s.stage.id==='1-5'?134:104) * u, Math.round(26 * u), sel ? BK.sprites.UI.gold : BK.sprites.UI.text);
        ctx.font = 'bold ' + Math.round(17 * u) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1b2a4a'; ctx.lineWidth = 4; ctx.strokeText((s.locked ? '🔒 ' : s.done ? '⭐ ' : '') + s.stage.name, x, y + 98 * u); ctx.fillStyle = '#fff'; ctx.fillText((s.locked ? '🔒 ' : s.done ? '⭐ ' : '') + s.stage.name, x, y + 98 * u);
        ctx.restore();
        this.rects.push({ x: x - 115 * u, y: y - 125 * u, w: 230 * u, h: 250 * u, k });
      }
      if (z < 1) return;
      // panneau du tableau choisi, boutons
      const st = S[this.stageIndex];
      if (st) {
        const s = st.stage, obj = s.objective === 'boss' ? (s.bossName || (s.id.endsWith('5') ? 'Mini-boss' : 'Boss')) + ' 👑' : s.objective === 'switches' ? 'Interrupteurs 🔘' : s.objective === 'goal' ? 'Trouve le portail 🌀' : 'Monstres 👾';
        this.panel(ctx, 300, 596, 680, 100);
        this.title(ctx, s.id + ' · ' + s.name, 640, 628, 34, this.flash > 0 ? BK.sprites.UI.bad : st.locked ? '#9fb0c8' : BK.sprites.UI.text);
        ctx.font = 'bold 19px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = BK.sprites.UI.muted;
        ctx.fillText(st.locked ? 'Réussis le tableau précédent pour le débloquer' : obj + (this.save.best[s.id] ? '   ·   Meilleur : ' + this.save.best[s.id] + ' pts' : '   ·   Pas encore réussi'), 640, 668);
      }
      this.button(ctx, '← Retour', 40, 640, 170, 50, () => this.back());
      this.button(ctx, 'Effacer la progression', 1040, 24, 210, 50, () => this.resetProgress());
      ctx.font = 'bold 17px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText('← → choisir   ·   Entrée ou clic : jouer   ·   Échap : retour aux mondes', 640, 712);
    }
  }
  BK.WorldSelect = WorldSelect;
})(window.BK);
