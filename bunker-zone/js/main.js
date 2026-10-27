// ============================================================
//  main.js — Point d'entrée : boucle à pas fixe, événements, menus
// ============================================================
(function (ZC) {
  'use strict';

  const FX_SOUND = { tracer: 'gun', tracer2: 'gun2', flame: 'flame', spine: 'spit', slash: 'slash', slash2: 'slash2', psislash: 'psi', bolt: 'bolt', lightning: 'lightning', shell: 'gun2' };
  const DEATH_SOUND = { zerg: 'deathZerg', terran: 'deathTerran', protoss: 'deathProtoss' };

  class App {
    constructor() {
      this.canvas = document.getElementById('game');
      this.ui = new ZC.UI(this);
      this.settings = Object.assign({}, ZC.DEFAULTS, this.loadSettings());
      this.game = null; this.renderer = null; this.input = null;
      this.paused = false; this.running = false; this.lastT = 0; this.acc = 0;
      this.speed = 1; // vitesse de lecture en partie (x1, x2, x3, x5)
      this.lastEvent = null; this.lastAlertT = -100;
      this.demo = null; // partie IA contre IA jouée derrière l'écran d'accueil
      this.campaign = new ZC.Campaign(); // progression du mode aventure
      window.addEventListener('resize', () => this.resize());
      this.ui.showHud(false);
      this.resize();
      this.showTitle();
      requestAnimationFrame(t => this.loop(t));
      // Paramètres d'URL (développement) : ?autostart&ff=60&ai=3&diff=hard&mode=evolution&sel=all
      const q = new URLSearchParams(location.search);
      if (q.has('autostart')) {
        const o = {};
        if (q.has('ai')) o.aiCount = +q.get('ai');
        if (q.has('diff')) o.difficulty = q.get('diff');
        if (q.has('map')) o.mapZones = +q.get('map');
        if (q.has('tileset')) o.tileset = q.get('tileset');
        if (q.has('mode')) o.mode = q.get('mode');
        if (q.has('admin')) o.admin = true;
        this.start(o);
        const ff = +q.get('ff') || 0;
        for (let i = 0; i < ff / ZC.STEP; i++) this.game.update(ZC.STEP);
        if (q.has('buy')) {
          const h = this.game.human; h.minerals += 1000;
          for (let i = 0; i < +q.get('buy'); i++) this.game.buy(h.id, 'dropship');
          if (q.has('research')) this.game.buy(h.id, q.get('research'), h.hq);
          for (let i = 0; i < 5 / ZC.STEP; i++) this.game.update(ZC.STEP);
        }
        if (q.has('sel')) {
          const mine = this.game.units.filter(u => u.owner === this.game.humanId && !u.def.structure && !u.def.air);
          const what = q.get('sel');
          if (what === 'bunker') { const b = this.game.units.find(u => u.owner === this.game.humanId && u.def.structure); if (b) { this.game.select([b], false); this.input.centerOnUnits([b]); } }
          else { this.game.select(what === '1' ? mine.slice(0, 1) : mine, false); if (mine.length) this.input.centerOnUnits(mine); }
        }
      }
    }

    // Réglages propres à une mission : jamais gardés dans les réglages généraux (sinon « Tenir la ligne » laissait
    // ses envahisseurs et son absence d'IA aux missions et parties suivantes)
    static get MISSION_KEYS() { return ['mode', 'mapZones', 'mapZonesY', 'aiCount', 'teams', 'humanStart', 'extraZones', 'startUnits', 'startMinerals', 'spawnInterval', 'unitCap', 'roundsToWin', 'roundTimeLimit', 'roundDuration', 'invasion', 'mineralZones', 'startWorkers', 'aiRace', 'playerRace', 'difficulty', 'incomePerBunker', 'dropshipCost', 'landingTime', 'tileset', 'admin']; }
    static get TRANSIENT_KEYS() { return ['campaign', 'invasion', 'teams', 'extraZones', 'humanStart', 'aiRace', 'startMinerals']; }
    loadSettings() {
      try {
        const s = JSON.parse(localStorage.getItem('zc-settings') || '{}');
        for (const k of App.TRANSIENT_KEYS) delete s[k];
        if (s.unitCap === 100) delete s.unitCap;  // ancien défaut (plafond absolu à 100) : on repasse au nouveau défaut, illimité
        if (s.startUnits === 8) delete s.startUnits;      // anciens défauts (8 soldats, 2 travailleurs) : nouveau départ à 0 soldat et 5 travailleurs
        if (s.startWorkers === 2) delete s.startWorkers;
        if (s.landingTime === 6) delete s.landingTime;        // ancien défaut (6 s) : nouveau défaut 5 s
        if (s.hero && s.hero !== 'random' && s.hero !== 'none' && !ZC.HEROES[s.hero]) delete s.hero;
        return s;
      } catch (e) { return {}; }
    }
    saveSettings() { try { const s = Object.assign({}, this.settings); for (const k of App.TRANSIENT_KEYS) delete s[k]; localStorage.setItem('zc-settings', JSON.stringify(s)); } catch (e) { /* ignore */ } }
    // Réglages généraux (sans mission) pour une partie simple
    get plainSettings() { const s = Object.assign({}, this.settings); s.campaign = null; return s; }

    resize() {
      const w = window.innerWidth, h = Math.max(200, window.innerHeight - this.ui.consoleHeight());
      this.canvas.width = w; this.canvas.height = h;
      if (this.renderer) this.renderer.resize(w, h);
    }

    // ---------------------------------------------------------- écran d'accueil et démo
    showTitle(note) {
      this.running = false; this.paused = false;
      ZC.Music.stop();
      this.ui.showHud(false);
      this.resize();
      this.startDemo();
      this.ui.showTitle(note);
    }
    startDemo() {
      const s = this.settings;
      const game = new ZC.Game({ humanPlayer: false, aiCount: 4, difficulty: 'hard', mapZones: 7, zoneTiles: 12, mode: 'classic', tileset: s.tileset, startUnits: 12, spawnInterval: 6, admin: false });
      const renderer = new ZC.Renderer(this.canvas, game);
      renderer.resize(this.canvas.width, this.canvas.height);
      const demo = { game, renderer, t: 0, acc: 0, fx: game.map.w / 2, fy: game.map.h / 2, cx: game.map.w / 2, cy: game.map.h / 2 };
      game.on((type, d) => { if (type === 'attack') { demo.fx += (d.target.x - demo.fx) * 0.02; demo.fy += (d.target.y - demo.fy) * 0.02; } }); // foyer des combats
      for (let i = 0; i < 60 / ZC.STEP; i++) game.update(ZC.STEP); // la bataille est déjà engagée
      demo.cx = demo.fx; demo.cy = demo.fy;
      this.demo = demo;
      this.renderer = renderer;
      this.lastT = performance.now();
    }
    stopDemo() { this.demo = null; }
    quit() {
      window.close();
      setTimeout(() => { if (!window.closed) this.ui.showTitle('Le navigateur ne permet pas de fermer cet onglet depuis le jeu : fermez-le vous-même.'); }, 300);
    }

    start(settings) {
      if (this.input) this.input.detach();
      this.stopDemo();
      if (settings && settings.campaign) {
        // Mission : on part des valeurs par défaut pour tout ce qu'une mission peut régler, puis la mission s'applique
        const base = Object.assign({}, this.settings);
        for (const k of App.MISSION_KEYS) base[k] = ZC.DEFAULTS[k];
        Object.assign(base, ZC.MISSION_DEFAULTS);
        this.gs = Object.assign(base, settings);
      } else {
        this.settings = Object.assign({}, this.settings, settings);
        for (const k of App.TRANSIENT_KEYS) delete this.settings[k];
        this.saveSettings();
        this.gs = Object.assign({}, this.settings, { campaign: null });
      }
      ZC.Audio.init();
      ZC.Audio.setEnabled(!!this.settings.sound);
      ZC.Music.setEnabled(this.settings.music !== false);
      ZC.Music.start();
      ZC.Audio.play('load', 0);
      this.game = new ZC.Game(this.gs);
      this.renderer = new ZC.Renderer(this.canvas, this.game);
      this.ui.showHud(true); // avant resize : le canvas doit laisser la place à la console
      this.resize();
      this.input = new ZC.Input(this);
      this.input.attach();
      this.game.on((t, d) => this.onGameEvent(t, d));
      // Caméra sur le centre de commandement du joueur (jamais sur une zone bonus ni sur l'ennemi)
      const me0 = this.game.human, hq = me0 && me0.hq, hz = hq ? hq.zone : this.game.map.zones.find(z => z.owner === this.game.humanId);
      if (hq) this.renderer.centerOn(hq.x, hq.y); else if (hz) this.renderer.centerOn(hz.cx, hz.cy);
      this.lastEvent = hq ? { x: hq.x, y: hq.y } : hz ? { x: hz.cx, y: hz.cy } : null;
      this.lastAlertT = -100;
      this.ui.reset();
      this.ui.showHud(true);
      this.ui.hideMenus();
      this.paused = false; this.running = true; this.lastT = performance.now(); this.acc = 0;
      this.setSpeed(1);
      const h = this.game.human;
      if (this.gs.campaign) { const m = this.campaign.mission(this.gs.campaign.mission); const ot = ZC.objectiveText(m.objective); this.ui.announce(m.name.toUpperCase(), ot.charAt(0).toUpperCase() + ot.slice(1)); }
      else if (this.gs.mode === 'rounds') this.ui.announce('ROUND 1 — ' + ZC.UNITS[ZC.ROUNDS[0]].name.toUpperCase(), 'Tournoi : le premier à remporter ' + this.gs.roundsToWin + ' round' + (this.gs.roundsToWin > 1 ? 's' : '') + ' gagne la partie');
      else if (this.gs.mode === 'evolution') this.ui.announce('ROUND 1 — ' + ZC.UNITS[ZC.ROUNDS[0]].name.toUpperCase(), 'Les bunkers produisent des unités à chaque vague');
      else this.ui.announce('BUNKER ZONE', 'Prenez des zones avec votre dropship, garnissez vos bunkers, détruisez les bunkers ennemis');
      this.ui.message('Vous jouez en ' + h.colorName.toLowerCase() + '. Votre dropship peut construire un bunker sur une zone libre (clic droit).', h.hex);
    }

    loop(t) {
      requestAnimationFrame(tt => this.loop(tt));
      let dt = (t - this.lastT) / 1000;
      this.lastT = t;
      if (dt > 0.1) dt = 0.1;
      if (this.demo && !this.running) { // démo de l'écran d'accueil : la caméra dérive lentement sur la bataille
        const d = this.demo, g = d.game, r = d.renderer;
        d.t += dt; d.acc += dt;
        let n = 0; while (d.acc >= ZC.STEP && n < 4) { g.update(ZC.STEP); d.acc -= ZC.STEP; n++; }
        if (n === 4) d.acc = 0;
        if (g.state === 'over') { this.startDemo(); return; }
        d.cx += (d.fx + Math.sin(d.t * 0.3) * 60 - d.cx) * dt * 0.6; d.cy += (d.fy + Math.cos(d.t * 0.23) * 40 - d.cy) * dt * 0.6; // glisse vers le foyer des combats
        r.centerOn(d.cx, d.cy);
        r.draw(null, d.acc / ZC.STEP, dt);
        return;
      }
      if (!this.running) return;
      if (!this.paused) {
        this.acc += dt * this.settings.gameSpeed * this.speed;
        let n = 0; const cap = 8 * this.speed; // à x5, jusqu'à 40 pas de simulation par image
        while (this.acc >= ZC.STEP && n < cap) { this.game.update(ZC.STEP); this.acc -= ZC.STEP; n++; }
        if (n === cap) this.acc = 0;
        this.input.update(dt);
      }
      // Une erreur de rendu ne doit pas figer l'interface ni se répéter 60 fois par seconde dans la console
      try { this.renderer.draw(this.input, this.paused ? 1 : this.acc / ZC.STEP, dt); }
      catch (e) { if (!this.drawErrT || t - this.drawErrT > 5000) { this.drawErrT = t; console.error('Erreur de rendu :', e); } }
      this.ui.update(dt);
    }

    togglePause() {
      if (!this.running) return;
      if (this.paused) this.resume(); else { this.paused = true; ZC.Music.duck(true); this.ui.showPause(); }
    }
    resume() { this.paused = false; ZC.Music.duck(false); this.ui.hideMenus(); this.lastT = performance.now(); }
    // Vitesse de lecture : x1, x2, x3 ou x5 (ne change pas la simulation, seulement le nombre de pas par seconde)
    setSpeed(v) {
      if (!ZC.SPEEDS.includes(v)) return;
      const changed = this.speed !== v;
      this.speed = v; this.acc = 0;
      this.ui.updateSpeed(v);
      if (changed && this.running) this.ui.message('Vitesse x' + v, '#9ad0ff');
    }
    stepSpeed(dir) { const i = ZC.SPEEDS.indexOf(this.speed); this.setSpeed(ZC.SPEEDS[Math.max(0, Math.min(ZC.SPEEDS.length - 1, i + dir))]); }
    restart() { this.start(this.gs || this.settings); }
    // Lance une mission de l'aventure (les réglages de la mission priment sur les réglages généraux)
    startMission(id, diff) {
      const ms = this.campaign.missionSettings(id, diff);
      this.lastMission = { id, diff };
      const base = Object.assign({}, this.settings, { campaign: null });
      this.start(Object.assign(base, ms));
    }
    toggleSound() { this.settings.sound = !this.settings.sound; ZC.Audio.setEnabled(this.settings.sound); this.saveSettings(); }
    toggleMusic() { this.settings.music = this.settings.music === false; ZC.Music.setEnabled(this.settings.music); this.saveSettings(); }
    // Abandon d'une mission : l'expérience du héros est conservée
    keepHeroXp() { if (this.game && this.game.campaign && !this.game.missionSettled) { const g = this.campaign.saveHeroXp(this.game); this.game.missionSettled = true; if (g > 0) this.ui.showTitleNote = this.game.hero.def.name + ' conserve ' + g + ' XP de cette mission.'; } }
    quitToMenu() {
      if (this.input) { this.input.detach(); this.input = null; }
      this.keepHeroXp();
      this.showTitle();
    }
    quitToCampaign() {
      if (this.input) { this.input.detach(); this.input = null; }
      this.keepHeroXp();
      this.showTitle();
      this.ui.showCampaign();
    }

    inView(x, y) {
      const r = this.renderer;
      return x > r.viewX - 120 && x < r.viewX + r.vw + 120 && y > r.viewY - 120 && y < r.viewY + r.vh + 120;
    }

    onGameEvent(type, d) {
      const g = this.game, ui = this.ui, A = ZC.Audio, me = g.humanId;
      switch (type) {
        case 'attack':
          if (this.inView(d.unit.x, d.unit.y)) A.play(FX_SOUND[d.unit.def.fx] || 'gun', 90);
          if (d.target.owner === me && d.unit.owner !== me) this.underAttack(d.target);
          break;
        case 'death':
          if (d.unit.def.structure) { if (this.inView(d.unit.x, d.unit.y)) A.play('bigExplosion', 0); }
          else if (this.inView(d.unit.x, d.unit.y)) A.play(DEATH_SOUND[d.unit.def.race] || 'deathTerran', 110);
          break;
        case 'capture': {
          const p = g.players[d.player];
          if (d.player === me) { A.play('build', 0); ui.message((d.hq ? 'Nouveau centre de commandement établi' : 'Bunker construit') + ' ! (' + p.zones + ' zones)', p.hex); }
          break;
        }
        case 'landBlocked':
          if (d.player === me) { A.play('error', 0); ui.message('Atterrissage interrompu en zone ' + (d.zone.ix + 1) + '-' + (d.zone.iy + 1) + ' : un ennemi est dans la zone. Dégagez-la, le dropship reprendra.', '#ff5050'); this.lastEvent = { x: d.unit.x, y: d.unit.y }; }
          break;
        case 'bunkerDone': {
          const z = d.bunker.zone, zn = z ? ' en zone ' + (z.ix + 1) + '-' + (z.iy + 1) : '';
          if (d.player === me && d.bunker.def.addon) { A.play('build', 0); ui.message(d.bunker.def.name + ' terminé : sélectionnez-le pour développer les pouvoirs de ' + ZC.HEROES[g.human.heroId].name + ' (T, Y).', g.players[me].hex); }
          else if (d.player === me) { A.play('build', 0); ui.message((d.hq ? 'Centre de commandement' : 'Bunker') + ' terminé' + zn + ' : il produit à partir de la prochaine vague.', g.players[me].hex); }
          break;
        }
        case 'powerDone':
          if (d.player === me) { A.play('upgrade', 0); const pw = ZC.POWERS[d.what]; ui.announce('POUVOIR DÉVELOPPÉ', pw.name + ' — ' + g.hero.def.name); ui.message(pw.name + ' est prêt : sélectionnez ' + g.hero.def.name + ' et appuyez sur ' + pw.key + (pw.target === 'self' ? '.' : ', puis cliquez sur la cible.'), '#ffd040'); }
          break;
        case 'power':
          if (d.player === me) { A.play(d.what === 'stim' ? 'stim' : 'upgrade', 0); ui.message(d.hero.def.name + ' : ' + ZC.POWERS[d.what].name + ' ! (flux ' + Math.floor(d.hero.flux) + '/' + d.hero.fluxMax + ')', '#ffd040'); }
          else if (g.allied(d.player, me) === false && ZC.POWERS[d.what].target !== 'self') { ui.message(g.players[d.player].name + ' lance ' + ZC.POWERS[d.what].name + ' !', g.players[d.player].hex); }
          break;
        case 'bunkerDestroyed': {
          if (d.player === me) { A.play('lost', 0); ui.message(d.hq ? 'Votre centre de commandement est détruit !' + (d.lastHQ ? ' Plus de dropships possibles.' : ' Vos autres centres prennent le relais.') : 'Votre bunker a été détruit ! La zone est perdue.', '#ff5050'); this.lastEvent = { x: d.zone.cx, y: d.zone.cy }; }
          else if (d.killer === me) { ui.message((d.hq ? 'Centre de commandement ennemi détruit ! +' : 'Bunker ennemi détruit ! +') + d.bounty + ' minerais. Envoyez un dropship pour prendre la zone.', '#ffd040'); }
          break;
        }
        case 'buy':
          if (d.player === me) {
            if (d.what === 'addon') { A.play('build', 0); ui.message(ZC.UNITS[ZC.RACES[g.human.race].addon].name + ' en construction (' + Math.round(d.total) + ' s) : sélectionnez-la ensuite pour développer les pouvoirs de ' + ZC.HEROES[g.human.heroId].name + '.', '#9ad0ff'); }
            else if (d.power) { A.play('order', 0); ui.message('Développement lancé : ' + ZC.POWERS[d.what].name + ' (' + Math.round(d.total) + ' s).', '#9ad0ff'); }
            else if (d.what === 'dropship' || d.what === 'worker' || d.what === 'hero') { A.play('order', 0); ui.message((d.what === 'dropship' ? 'Dropship' : d.what === 'worker' ? ZC.UNITS[ZC.RACES[g.human.race].worker].name : 'Résurrection de ' + g.hero.def.name) + ' en production (' + Math.round(d.total) + ' s' + (d.queued > 1 ? ', ' + (d.queued - 1) + ' en attente' : '') + ').', '#9ad0ff'); }
            else { A.play('order', 0); ui.message('Recherche lancée : ' + ZC.UPGRADES[d.what].name + ' niveau ' + d.level + ' (' + Math.round(d.total) + ' s) sur le bunker ' + (d.bunker.zone ? (d.bunker.zone.ix + 1) + '-' + (d.bunker.zone.iy + 1) : '') + '.', '#9ad0ff'); }
          }
          break;
        case 'enter':
          if (d.player === me) { A.play('order', 0); ui.message(d.unit.def.name + ' en garnison (' + d.bunker.garrison.length + '/' + ZC.capacity(d.bunker) + ').', '#9ad0ff'); }
          break;
        case 'unload':
          if (d.player === me) { A.play('order', 0); ui.message(d.count + ' unités sorties du bunker.', '#9ad0ff'); }
          break;
        case 'dropshipReady':
          if (d.player === me) { A.play('build', 0); ui.message('Dropship prêt : clic droit sur une zone libre pour construire un bunker.', '#9ad0ff'); }
          break;
        case 'noHQ':
          if (d.player === me) { A.play('error', 0); ui.message('Seul le centre de commandement produit des dropships, des travailleurs et ressuscite le héros, et le vôtre est détruit.', '#ff5050'); }
          break;
        case 'workerReady':
          if (d.player === me) { A.play('build', 0); ui.message(d.unit.def.name + ' prêt' + (d.gathering ? ' : il part récolter le gisement le plus proche.' : '. Aucun gisement à proximité : clic droit sur un gisement vert pour récolter.'), '#9ad0ff'); }
          break;
        case 'extractorStart':
          if (d.player === me) { A.play('build', 0); ui.message(ZC.RACES[g.human.race].extractor + ' en chantier sur le gisement (' + ZC.EXTRACTOR.buildTime + ' s).', '#9ad0ff'); }
          break;
        case 'extractorDone':
          if (d.player === me) { A.play('upgrade', 0); ui.message(ZC.RACES[g.human.race].extractor + ' terminé : ' + ZC.EXTRACTOR.rate + ' minerai/s directement dans votre banque.', '#ffd040'); }
          break;
        case 'towerStart':
          if (d.player === me) { A.play('build', 0); ui.message(d.unit.def.name + ' en chantier (' + ZC.TOWER.buildTime + ' s).', '#9ad0ff'); }
          break;
        case 'towerDone':
          if (d.player === me) { A.play('upgrade', 0); ui.message(d.unit.def.name + ' terminée' + (d.unit.def.manned ? ' : faites-y monter des soldats (clic droit) pour qu\'elle tire.' : '.'), '#ffd040'); }
          break;
        case 'towerRefused':
          if (d.player === me) { A.play('error', 0); ui.message('Construction annulée : ' + ({ zone: 'la zone n\'est plus à vous', centre: 'trop près du centre', structure: 'trop près d\'une structure', gisement: 'trop près du gisement', max: 'maximum de tours atteint' }[d.reason] || 'emplacement impossible') + '.', '#ff5050'); }
          break;
        case 'supplyBlocked':
          if (d.player === me) ui.message('Supply max atteinte (' + d.cap + ') : ' + (!g.settings.unitCap || d.cap < g.settings.unitCap ? 'chaque nouveau bunker ajoute +' + g.settings.supplyPerBunker + '.' : 'limite absolue de la partie.'), '#ffd040');
          break;
        case 'workerCap':
          if (d.player === me) { A.play('error', 0); ui.message('Maximum de ' + d.cap + ' travailleurs atteint (' + ZC.WORKER.perBunker + ' par bunker : construisez un bunker).', '#ff5050'); }
          break;
        case 'repairNoMinerals':
          if (d.player === me) { A.play('error', 0); ui.message('Réparation interrompue : plus de minerai (' + ZC.REPAIR.costPerSec + ' minerais/s).', '#ff5050'); }
          break;
        case 'patchDepleted':
          if (d.patch.zone.owner === me) ui.message('Gisement épuisé en zone ' + (d.patch.zone.ix + 1) + '-' + (d.patch.zone.iy + 1) + '. Vos travailleurs cherchent le plus proche.', '#ffd040');
          break;
        case 'needUpgrades':
          if (d.player === me) { A.play('error', 0); ui.message(d.requires === Infinity ? 'Ce bunker est déjà au niveau 3.' : 'Évolution niveau ' + d.level + ' : armes, armure et portée doivent être au niveau ' + d.requires + ' sur ce bunker.', '#ff5050'); }
          break;
        case 'upgradeDone':
          if (d.player === me && d.what === 'fortify') { A.play('build', 0); ui.announce('CENTRE DE COMMANDEMENT', 'Le bunker ' + (d.bunker.zone ? (d.bunker.zone.ix + 1) + '-' + (d.bunker.zone.iy + 1) : '') + ' est promu : 6 places, dropships, travailleurs'); ui.message('Nouveau centre de commandement en zone ' + (d.bunker.zone ? (d.bunker.zone.ix + 1) + '-' + (d.bunker.zone.iy + 1) : '') + ' : dropships (D) et unités (F) disponibles.', '#ffd040'); if (g.selectedBunker === d.bunker) ui.buildCommandCard('bunker'); break; }
          if (d.player === me && d.what === 'evolve') { A.play('upgrade', 0); ui.announce('ÉVOLUTION' + (d.level > 1 ? ' ' + (d.level + 1) : ''), 'Les soldats du bunker ' + (d.bunker.zone ? (d.bunker.zone.ix + 1) + '-' + (d.bunker.zone.iy + 1) : '') + ' passent au niveau ' + (d.level + 1)); ui.message('Évolution terminée : ce bunker produit et transforme ses soldats en ' + ZC.UNITS[g.bunkerSpawnType(d.bunker)].name + '.', '#ffd040'); break; }
          if (d.player === me) { A.play('upgrade', 0); ui.message(ZC.UPGRADES[d.what].name + ' niveau ' + d.level + ' terminé sur le bunker ' + (d.bunker.zone ? (d.bunker.zone.ix + 1) + '-' + (d.bunker.zone.iy + 1) : '') + '.', '#ffd040'); }
          break;
        case 'cancel':
          if (d.player === me) ui.message((d.kind === 'research' ? 'Recherche annulée : ' + (ZC.UPGRADES[d.what] || ZC.POWERS[d.what]).name : 'Production annulée : ' + (d.what === 'worker' ? ZC.UNITS[ZC.RACES[g.human.race].worker].name : d.what === 'hero' ? 'résurrection du héros' : 'dropship')) + (d.refund ? ' (+' + d.refund + ' minerais remboursés)' : '') + '.', '#ffd040');
          break;
        case 'queueFull':
          if (d.player === me) { A.play('error', 0); ui.message('File d\'attente pleine sur ce bunker.', '#ff5050'); }
          break;
        case 'queueLost':
          if (d.player === me) ui.message('Bunker détruit : ' + (d.count ? d.count + ' production(s)' + (d.hero ? ' dont la résurrection du héros' : '') : '') + (d.count && d.research ? ' et ' : '') + (d.research ? d.research + ' recherche(s)' : '') + ' en cours perdu(s).', '#ff5050');
          break;
        case 'notEnough':
          if (d.player === me) { A.play('error', 0); ui.message('Minerai insuffisant.', '#ff5050'); }
          break;
        case 'cannotBuild':
          if (d.player === me) { A.play('error', 0); ui.message('Aucun point de livraison disponible.', '#ff5050'); }
          break;
        case 'grant':
          if (d.player === me) ui.message('Plus aucun bunker : vous recevez de quoi acheter un dropship (D) ; le prochain bunker sera votre nouveau QG.', '#ffd040');
          break;
        case 'invasionSoon':
          A.play('round', 0); ui.message('Assaut imminent par le ' + d.sideName + ' ! (Espace pour y aller)', '#ff5050'); this.lastEvent = { x: d.x, y: d.y };
          break;
        case 'invasion': {
          A.play('round', 0);
          this.lastEvent = { x: d.x, y: d.y };
          ui.message('Vague ' + d.wave + ' : ' + d.count + ' envahisseurs arrivent par le ' + d.side + (d.target && d.target.zone ? ' vers la zone ' + (d.target.zone.ix + 1) + '-' + (d.target.zone.iy + 1) : '') + ' (Espace pour y aller).', '#ff8080');
          if (d.wave === 1) ui.announce('ILS ARRIVENT', 'Les envahisseurs attaquent par vagues depuis les bords de la carte');
          break;
        }
        case 'wave':
          if (g.human && g.human.alive && d.spawned) A.play('spawn', 0);
          ui.waveFlash();
          break;
        case 'round':
          A.play('round', 0);
          if (g.isTournament) {
            // Nouvelle carte : recentrer sur le nouveau QG
            const hq = g.human && g.human.hq, hz = hq ? hq.zone : g.map.zones.find(z => z.owner === me);
            if (hz) { this.renderer.centerOn(hz.cx, hz.cy); this.lastEvent = { x: hz.cx, y: hz.cy }; }
            ui.announce('ROUND ' + (d.index + 1) + ' — ' + d.unit.name.toUpperCase(), 'Score : ' + this.scoreLine() + '  ·  Premier à ' + g.settings.roundsToWin);
            ui.message('Round ' + (d.index + 1) + ' : ' + d.unit.name + '. La carte est remise à zéro.', '#ffd040');
          } else {
            ui.announce('ROUND ' + (d.index + 1) + ' — ' + d.unit.name.toUpperCase(), 'Les bunkers produisent maintenant des ' + d.unit.name + 's');
            ui.message('Round ' + (d.index + 1) + ' : ' + d.unit.name, '#ffd040');
          }
          break;
        case 'roundEnd': {
          const w = d.winner >= 0 ? g.players[d.winner] : null;
          const mine = d.winner === me;
          A.play(mine ? 'victory' : 'round', 0);
          const why = d.reason === 'time' ? ' (le plus de zones au temps limite)' : '';
          if (!d.final) {
            const nextUnit = ZC.UNITS[ZC.ROUNDS[(d.index + 1) % ZC.ROUNDS.length]];
            ui.announce(mine ? 'VOUS REMPORTEZ LE ROUND ' + (d.index + 1) : 'ROUND ' + (d.index + 1) + ' : ' + (w ? w.name.toUpperCase() : 'PERSONNE'), 'Score : ' + this.scoreLine() + '  ·  Round suivant : ' + nextUnit.name);
          }
          ui.message((w ? w.name : 'Personne') + ' remporte le round ' + (d.index + 1) + why + '. Score : ' + this.scoreLine() + '.', w ? w.hex : '#ffd040');
          break;
        }
        case 'admin': {
          const txt = { minerals: '+1000 minerais', heal: 'Toutes vos unités et structures sont soignées', maxUpgrades: 'Améliorations au maximum', wave: 'Vague produite immédiatement', kill: 'Unités sélectionnées détruites' }[d.what];
          A.play('upgrade', 0); ui.message('Admin : ' + txt + '.', '#ff80ff');
          break;
        }
        case 'heroLevel':
          if (d.player !== me) break;
          A.play('upgrade', 0); ui.message(d.unit.def.name + ' passe au niveau ' + d.level + ' !' + (g.campaign ? ' +' + ZC.HERO_POINTS_PER_LEVEL + ' points à répartir dans sa fiche après la mission.' : ''), '#ffd040'); ui.announce('NIVEAU ' + d.level, d.unit.def.name + ' gagne en puissance');
          break;
        case 'heroDown':
          A.play('lost', 0); ui.message(d.unit.def.name + ' est à terre. Ressuscitez-le au centre de commandement : F puis H (' + ZC.heroReviveCost(d.unit.heroLevel) + ' minerais, ' + ZC.HERO_RESPAWN + ' s).', '#ff5050');
          break;
        case 'heroBack':
          if (d.player !== me) break;
          A.play('build', 0); ui.message(d.unit.def.name + ' est de retour au QG.', '#ffd040');
          break;
        case 'roundDefeat':
          A.play('defeat', 0);
          ui.announce('ÉLIMINÉ DE CE ROUND', 'Vous reviendrez au round suivant');
          ui.message('Vous êtes éliminé de ce round. Observez la fin du round : vous reviendrez au suivant.', '#ff5050');
          break;
        case 'eliminated':
          ui.message(d.player.name + ' a été éliminé.', d.player.hex);
          if (!d.player.isHuman) A.play('alert', 0);
          break;
        case 'defeat':
          A.play('defeat', 0);
          this.paused = true;
          if (g.campaign) { g.state = 'over'; ui.showEnd(false, true, this.campaign.onMissionEnd(g, false)); }
          else ui.showEnd(false, false);
          break;
        case 'end': {
          this.paused = true;
          const won = !!(g.human && g.human.alive && (g.allied(g.winner, me) || d.survived));
          const res = g.campaign ? this.campaign.onMissionEnd(g, won) : null;
          if (won) { A.play('victory', 0); ui.showEnd(true, true, res); }
          else ui.showEnd(false, true, res);
          break;
        }
      }
    }

    // Score du tournoi : « Vous 2 · Mengsk 1 · ... »
    scoreLine() { return this.game.standings().map(p => p.name + ' ' + p.roundsWon).join(' · '); }

    underAttack(u) {
      const g = this.game;
      if (g.time - this.lastAlertT > 8 && !this.inView(u.x, u.y)) {
        this.lastAlertT = g.time;
        this.ui.message((u.def.structure ? 'Votre bunker est attaqué !' : 'Vos forces sont attaquées !') + ' (Espace pour y aller)', '#ff5050');
        ZC.Audio.play('alert', 0);
      }
      this.lastEvent = { x: u.x, y: u.y };
    }
  }

  window.addEventListener('load', () => { window.zcApp = new App(); });
})(window.ZC);
