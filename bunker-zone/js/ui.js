// ============================================================
//  ui.js — Interface : barre du haut, console SC1, menus
// ============================================================
(function (ZC) {
  'use strict';

  const CONSOLE_H = 164;

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function opt(values, labels, current) {
    return values.map((v, i) => '<option value="' + v + '"' + (String(v) === String(current) ? ' selected' : '') + '>' + (labels ? labels[i] : v) + '</option>').join('');
  }
  // Minerai vert fluo (la monnaie)
  const ICON_MINERAL = '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 13 L6 4 L9 8 L11 3 L14 13 Z" fill="#39ff14" stroke="#0f5a0a" stroke-width="1"/><path d="M6 4 L7.5 9 L9 8 Z" fill="#d8ffd0"/></svg>';
  ZC.ICON_MINERAL = ICON_MINERAL;
  const ICON_WORKER = '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 14 L8 8" stroke="#c8a060" stroke-width="2" stroke-linecap="round"/><path d="M5 3 C8 1.5 12 2.5 14 6" fill="none" stroke="#ffd040" stroke-width="2.2" stroke-linecap="round"/><path d="M7 5 L12 10" stroke="#2a3a50" stroke-width="1.2"/></svg>';
  const ICON_SUPPLY = '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 14 L2 8 L8 3 L14 8 L14 14 Z" fill="#8fa7c7" stroke="#2a3a50" stroke-width="1"/><rect x="6.5" y="9" width="3" height="5" fill="#2a3a50"/></svg>';


  // Icônes de la carte de commandes (SVG 24x24, trait en couleur courante)
  const svg = (body, color, fill) => '<svg viewBox="0 0 24 24" width="22" height="22" fill="' + (fill ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="color:' + (color || '#eef3ff') + '">' + body + '</svg>';
  const SHIELD = 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z';
  const ICONS = {
    move: svg('<path d="M4 12h13M12 6l6 6-6 6"/>', '#9ad0ff'),
    stop: svg('<rect x="6" y="6" width="12" height="12" rx="1.5"/>', '#ff8a8a', true),
    // pistolet en contour, vu de côté, qui tire (flamme orange au bout du canon)
    attack: svg('<path d="M2 8h14v4h-4.5l-1 2.5h-2L8 12H7l-1.5 7H2.5L4 12H2z"/><path d="M7.5 12v2M12 8v-1.5"/><path style="color:#ffb347" d="M18.5 10h3.5M18 7.5l2-2M18 12.5l2 2"/><path style="color:#fff0b0" d="M17 10h1"/>', '#ff6a5a'),
    patrol: svg('<path d="M16 3l3 3-3 3M19 6H9a5 5 0 0 0 0 10h1M8 21l-3-3 3-3M5 18h10a5 5 0 0 0 0-10h-1"/>', '#9ad0ff'),
    hold: svg('<path d="' + SHIELD + '"/><path d="M10 9v6M14 9v6"/>', '#c8d4e8'),
    stim: svg('<path d="M18 3l3 3M16 5l3 3M13 8L5 16l-1 4 4-1 8-8M9 12l3 3M17 4l-4 4 3 3 4-4"/>', '#ffb347'),
    build: svg('<path d="M3 20v-7l9-6 9 6v7H3z"/><path d="M10 20v-5h4v5"/><path d="M12 7V4"/>', '#9ad0ff'),
    dropship: svg('<path d="M2 12l5-1 4-6h3l-2 6h7l2 2-2 2h-7l2 6h-3l-4-6-5-1z"/>', '#9ad0ff', true),
    weapons: svg('<path d="M7 20V9a3 3 0 0 1 6 0v11H7z"/><path d="M15 20v-9a2 2 0 0 1 4 0v9h-4z"/><path d="M7 15h6M15 16h4"/>', '#ffd040'),
    armor: svg('<path d="' + SHIELD + '"/><path d="M12 8v8M8 12h8"/>', '#5cc8ff'),
    range: svg('<circle cx="12" cy="12" r="6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>', '#7dffb0'),
    stimResearch: svg('<path d="M18 3l3 3M16 5l3 3M13 8L5 16l-1 4 4-1 8-8M9 12l3 3M17 4l-4 4 3 3 4-4"/>', '#ffb347'),
    send: svg('<path d="M3 7h12M11 3l4 4-4 4M3 12h7M3 17h12M11 13l4 4-4 4"/>', '#ff8a8a'),
    evolve: svg('<path d="M6 13l6-6 6 6M6 20l6-6 6 6"/>', '#ffd040'),
    fortify: svg('<path d="M3 21V10l4-3v3l5-4 5 4v-3l4 3v11H3z"/><path d="M10 21v-5h4v5"/><path d="M12 2v4"/>', '#ffd040'),
    unload: svg('<path d="M12 3v10M8 9l4 4 4-4"/><path d="M4 21h16M4 16v5M20 16v5"/>', '#c8d4e8'),
    units: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>', '#eef3ff'),
    worker: svg('<path d="M3 21l9-9"/><path d="M8 5c4-2 9 0 11 4"/><path d="M10 7l7 7"/>', '#ffd040'),
    hero: svg('<path d="M12 2l3 7 7 .5-5.5 4.5 2 7-6.5-4-6.5 4 2-7L2 9.5 9 9z"/>', '#ffd040', true),
    back: svg('<path d="M10 5L4 11l6 6M4 11h12a4 4 0 0 1 0 8h-2"/>', '#c8d4e8'),
    gather: svg('<path d="M12 2l5 7-5 13-5-13z"/><path d="M7 9h10"/>', '#39ff14'),
    repair: svg('<path d="M14 4a5 5 0 0 0-5 7L3 17l4 4 6-6a5 5 0 0 0 7-5l-3 3-3-1-1-3 3-3z"/>', '#ffd040'),
    tower: svg('<path d="M5 21h14M7 21V9h10v12M7 9l-2-3h14l-2 3M9 21v-5h6v5"/><path d="M12 3v3"/>', '#ff8a8a'),
    extract: svg('<path d="M5 9h14v4H5z"/><path d="M8 13v3l4 5 4-5v-3"/><path d="M9 5h6v4H9z"/>', '#39ff14'),
  };
  ZC.CMD_ICONS = ICONS;

  const HELP = `
    <div class="help-grid">
      <div><b>Clic gauche</b> sélection / glisser pour un cadre &nbsp; <b>Clic droit</b> déplacer / attaquer</div>
      <div><b>Dropship + clic droit</b> sur une zone libre : construire un bunker (ou <b>B</b> puis clic)</div>
      <div><b>Bunker sélectionné</b> : clic droit = point de ralliement ; <b>W</b> armes, <b>R</b> armure, <b>E</b> portée, <b>T</b> stimpack (pour ses marines)</div>
      <div><b>G</b> (bunker sélectionné) envoyer toutes ses troupes vers le point cliqué &nbsp; <b>N</b> bunker suivant</div>
      <div><b>Clic droit sur un bunker allié</b> : les unités sélectionnées entrent en garnison (4 max ; un bunker vide ne tire pas) &nbsp; <b>U</b> décharger &nbsp; <b>V</b> évolution (armes, armure et portée au niveau 3) : les soldats du bunker passent au niveau 2</div>
      <div><b>D</b> dropship (centre de commandement) &nbsp; <b>F</b> carte « Unités » du QG : <b>W</b> travailleur, <b>H</b> ressusciter le héros (aventure), <b>X</b> retour &nbsp; <b>T</b> stimuler les marines sélectionnés</div>
      <div><b>Travailleurs</b> : clic droit sur un gisement vert = récolter (<b>G</b>), clic droit sur un bunker allié abîmé = réparer (<b>R</b>, ${ZC.REPAIR.hpPerSec} PV/s contre ${ZC.REPAIR.costPerSec} minerais/s), <b>B</b> construire un extracteur sur un gisement (${ZC.EXTRACTOR.cost} minerais, mine tout seul), <b>T</b> construire une tour dans une de vos zones (${ZC.TOWER.cost} minerais ; chez les humains, des soldats doivent y monter pour qu'elle tire)</div>
      <div><b>A</b> attaque-déplacement &nbsp; <b>M</b> déplacer &nbsp; <b>S</b> stop &nbsp; <b>H</b> tenir &nbsp; <b>P</b> patrouille</div>
      <div><b>Double-clic / Ctrl+clic</b> même type à l'écran &nbsp; <b>Maj+clic</b> ajouter</div>
      <div><b>Ctrl+1..9</b> créer un groupe (unités ou bunker sélectionné) &nbsp; <b>1..9</b> sélectionner (2x : centrer) &nbsp; <b>Z</b> toute l'armée</div>
      <div><b>Flèches / bord de l'écran / minimap</b> caméra &nbsp; <b>C</b> centrer &nbsp; <b>Espace</b> dernière alerte</div>
      <div><b>Tab</b> tableau des scores &nbsp; <b>Échap / F10</b> menu</div>
      <div><b>Mode admin</b> (option) : achats gratuits et instantanés ; <b>Alt+M</b> +1000 minerais &nbsp; <b>Alt+H</b> tout soigner &nbsp; <b>Alt+U</b> améliorations max (bunker sélectionné) &nbsp; <b>Alt+S</b> vague immédiate &nbsp; <b>Alt+K</b> détruire la sélection</div>
    </div>`;

  class UI {
    constructor(app) {
      this.app = app;
      this.hud = document.getElementById('hud');
      this.menus = document.getElementById('menus');
      this.msgs = [];
      this.announceT = 0;
      this.lastSelVersion = -1;
      this.selRefreshT = 0;
      this.leaderboardVisible = true;
      this.waveFlashT = 0;
      this.cardKind = '';
      this.buildHud();
      this.buildMenus();
    }

    consoleHeight() { return this.hud.style.display === 'none' ? 0 : CONSOLE_H; }

    // ------------------------------------------------------------ HUD
    buildHud() {
      this.hud.innerHTML = `
        <div id="topbar">
          <div id="stats">
            <span class="stat"><span class="lbl">Zones</span><span id="st-zones">0</span></span>
            <span class="stat"><span class="lbl">Unités</span><span id="st-units">0</span></span>
            <span class="stat"><span class="lbl">Kills</span><span id="st-kills">0</span></span>
            <span class="stat"><span class="lbl">Temps</span><span id="st-time">0:00</span></span>
            <span class="stat"><span class="lbl">Bunkers</span><span id="st-bunkers">0</span></span>
            <span id="speed" title="Vitesse de lecture (+ / -)">${ZC.SPEEDS.map(v => `<button data-speed="${v}">x${v}</button>`).join('')}</span>
          </div>
          <div id="round">
            <div id="round-name">ROUND 1</div>
            <div id="round-timer"></div>
          </div>
          <div id="resources">
            <span class="res mineral">${ICON_MINERAL}<span id="st-minerals">0</span></span>
            <span class="res">${ICON_SUPPLY}<span id="st-supply">0/0</span></span>
            <span class="res" id="res-workers">${ICON_WORKER}<span id="st-workers">0/0</span></span>
          </div>
        </div>
        <div id="leaderboard"><div class="lb-title" id="lb-title">Zones contrôlées</div><div id="lb-rows"></div></div>
        <div id="messages"></div>
        <div id="announce"><div id="announce-main"></div><div id="announce-sub"></div></div>
        <div id="console" style="height:${CONSOLE_H}px">
          <div id="minimap-wrap"><canvas id="minimap" width="150" height="150"></canvas></div>
          <div id="infopanel"><div class="info-empty">BUNKER ZONE</div></div>
          <div id="cmdcard"></div>
        </div>`;
      const q = (s) => this.hud.querySelector(s);
      this.el = {
        zones: q('#st-zones'), units: q('#st-units'), supply: q('#st-supply'), workers: q('#st-workers'), kills: q('#st-kills'), time: q('#st-time'),
        minerals: q('#st-minerals'), bunkers: q('#st-bunkers'),
        roundName: q('#round-name'), roundTimer: q('#round-timer'), lb: q('#leaderboard'), lbRows: q('#lb-rows'), lbTitle: q('#lb-title'),
        messages: q('#messages'), announce: q('#announce'), announceMain: q('#announce-main'), announceSub: q('#announce-sub'),
        info: q('#infopanel'), cmd: q('#cmdcard'), speed: q('#speed'),
      };
      this.el.speed.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
      this.el.speed.addEventListener('click', e => { const b = e.target.closest('button[data-speed]'); if (b) this.app.setSpeed(+b.dataset.speed); });
      this.updateSpeed(1);
      this.minimap = q('#minimap');
      this.mctx = this.minimap.getContext('2d');
      this.el.info.addEventListener('mousedown', e => { if (e.target.closest('.qi')) { e.preventDefault(); e.stopPropagation(); } });
      this.el.info.addEventListener('click', e => {
        const q = e.target.closest('.qi[data-q]'), g = this.app.game; if (!q || !g) return;
        const b = g.selectedBunker; if (b && g.cancelQueued(g.humanId, b, q.dataset.q, +q.dataset.i)) { ZC.Audio.play('order', 0); this.refreshSelection(); }
      });
      this.el.cmd.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
      this.el.cmd.addEventListener('click', e => {
        const b = e.target.closest('button[data-cmd]');
        if (b && this.app.input && !b.classList.contains('disabled')) this.app.input.command(b.dataset.cmd);
      });
    }

    showHud(v) { this.hud.style.display = v ? 'block' : 'none'; }
    // Sous-carte du QG (« Unités ») : null = carte principale
    openSub(name) { const g = this.app.game; if (name && !(g.selectedBunker && g.selectedBunker.def.hq)) return; this.sub = name || null; this.buildCommandCard(this.selectionKind()); }
    updateSpeed(v) { for (const b of this.el.speed.querySelectorAll('button')) b.classList.toggle('on', +b.dataset.speed === v); }
    reset() { this.lbT = 1; this.msgs = []; this.el.messages.innerHTML = ''; this.lastSelVersion = -1; this.announceT = 0; this.el.announce.style.opacity = 0; this.cardKind = ''; this.setActiveCommand('normal'); }

    txt(el, s) { if (el._last !== s) { el._last = s; el.textContent = s; } }

    setActiveCommand(mode) {
      this.el.cmd.querySelectorAll('button[data-cmd]').forEach(b => b.classList.toggle('active', b.dataset.cmd === mode));
    }

    toggleLeaderboard() { this.leaderboardVisible = !this.leaderboardVisible; this.el.lb.style.display = this.leaderboardVisible ? 'block' : 'none'; }

    message(text, color) {
      this.msgs.push({ text, color: color || '#e8e8e8', t: 0 });
      if (this.msgs.length > 7) this.msgs.shift();
      this.renderMessages();
    }
    renderMessages() {
      this.el.messages.innerHTML = this.msgs.map(m => '<div class="msg" style="color:' + m.color + ';opacity:' + Math.max(0, Math.min(1, (10 - m.t) / 2)).toFixed(2) + '">' + esc(m.text) + '</div>').join('');
    }
    announce(main, sub) {
      this.el.announceMain.textContent = main;
      this.el.announceSub.textContent = sub || '';
      this.announceT = 4;
      this.el.announce.style.opacity = 1;
    }
    waveFlash() { this.waveFlashT = 0.6; }

    // ------------------------------------------------------------ carte de commandes
    // lvl = { done, queued, max } : pastilles de niveau (vert = acquis, jaune = en file, gris = à venir)
    cardButton(cmd, ico, key, label, cost, disabled, lvl) {
      let pips = '';
      if (lvl) {
        if (lvl.done >= lvl.max) pips = '<span class="lv max">MAX</span>';
        else { pips = '<span class="lv">'; for (let i = 0; i < lvl.max; i++) pips += '<i class="' + (i < lvl.done ? 'on' : i < lvl.done + lvl.queued ? 'q' : '') + '"></i>'; pips += '</span>'; }
      }
      return '<button data-cmd="' + cmd + '" class="' + (disabled ? 'disabled' : '') + '" title="' + esc(label) + (cost ? ' — ' + cost + ' minerais' : '') + '">' +
        '<span class="ico">' + (ICONS[cmd] || ico) + '</span>' + pips + '<span class="key">' + key + '</span>' + (cost ? '<span class="cost">' + cost + '</span>' : '') + '</button>';
    }
    // Retour visuel : le bouton s'enfonce (ok) ou tremble en rouge (refus)
    pressButton(cmd, ok) {
      const b = this.el.cmd.querySelector('button[data-cmd="' + cmd + '"]'); if (!b) return;
      b.classList.remove('pressed', 'refused'); void b.offsetWidth;
      b.classList.add(ok === false ? 'refused' : 'pressed');
      setTimeout(() => b.classList.remove('pressed', 'refused'), 400);
    }
    // Empreinte de la carte : niveaux, files, garnison. Si elle change, la carte se redessine (pastilles à jour)
    cardSignature() {
      const g = this.app.game, b = g.selectedBunker;
      if (!b) return 'n' + g.ownSelection.length;
      return b.id + ':' + Object.values(b.up).join('') + ':' + b.research.map(r => r.what[0]).join('') + ':' + b.queue.length + ':' + b.garrison.length + ':' + (g.hero ? (g.hero.dead ? 'd' : 'v') : '');
    }
    buildCommandCard(kind) {
      const g = this.app.game, me = g.human, e = '<button class="empty"></button>';
      let html = '';
      if (kind === 'units') {
        const bio = g.ownSelection.some(u => u.def.bio && (u.up.stim > 0 || u.def.hero));
        html = this.cardButton('move', '➜', 'M', 'Déplacer') + this.cardButton('stop', '■', 'S', 'Stop') + this.cardButton('attack', '⚔', 'A', 'Attaquer') +
          this.cardButton('patrol', '↻', 'P', 'Patrouiller') + this.cardButton('hold', '⛨', 'H', 'Tenir la position') + e +
          (bio ? this.cardButton('stim', '⚡', 'T', 'Stimpack : +50% vitesse et cadence pendant ' + ZC.STIM.duration + ' s, coûte ' + ZC.STIM.hpCost + ' PV') : e) + e + e;
      } else if (kind === 'workers') {
        html = this.cardButton('move', '➜', 'M', 'Déplacer') + this.cardButton('stop', '■', 'S', 'Stop') + this.cardButton('hold', '⛨', 'H', 'Tenir la position') +
          this.cardButton('gather', '◆', 'G', 'Récolter : cliquez sur un gisement de minerai (' + ZC.MINERALS.carry + ' minerais par voyage)') +
          this.cardButton('repair', '🔧', 'R', 'Réparer : cliquez sur un bunker allié (' + ZC.REPAIR.hpPerSec + ' PV/s, coûte ' + ZC.REPAIR.costPerSec + ' minerais/s)') +
          this.cardButton('extract', '⛏', 'B', ZC.RACES[me.race].extractor + ' : construire sur un gisement (' + ZC.EXTRACTOR.buildTime + ' s). Extrait ' + ZC.EXTRACTOR.rate + ' minerai/s directement dans votre banque, sans transport. Un seul par gisement', g.extractorCost(me.id), me.minerals < g.extractorCost(me.id)) +
          this.cardButton('tower', '⌂', 'T', ZC.UNITS[ZC.RACES[me.race].tower].name + ' : construire dans une de vos zones (' + ZC.TOWER.buildTime + ' s, ' + ZC.TOWER.perZone + ' par zone max). ' + (ZC.UNITS[ZC.RACES[me.race].tower].manned ? 'Pas de robots chez les humains : la tour ne tire que si des soldats y montent (clic droit, ' + ZC.UNITS[ZC.RACES[me.race].tower].capacity + ' places, portée +' + ZC.UNITS[ZC.RACES[me.race].tower].rangeBonus + ' cases)' : 'Tourelle autonome'), g.towerCost(me.id), me.minerals < g.towerCost(me.id)) + e + e;
      } else if (kind === 'tower') {
        const tw = g.selectedTower;
        html = (tw.garrison.length ? this.cardButton('unload', '⇩', 'U', 'Faire descendre la garnison (' + tw.garrison.length + ' unités)') : e) + e + e + e + e + e + e + e + e;
      } else if (kind === 'hqUnits') { // carte « Unités » du centre de commandement
        const wk = ZC.UNITS[ZC.RACES[me.race].worker], wc = g.workerCost(me.id), wn = g.workers(me.id).length + g.workersQueued(me.id), wmax = g.workerCap(me.id), cap = wn >= wmax;
        const worker = this.cardButton('worker', '⚒', 'W', wk.name + ' (' + wn + '/' + wmax + ', ' + ZC.WORKER.perBunker + ' par bunker) : récolte le minerai des gisements et répare les bunkers — ' + Math.round(g.workerTime(me.id)) + ' s de production', wc, cap || me.minerals < wc);
        let hero = e;
        if (g.campaign && g.hero) {
          const h = g.hero, can = g.canReviveHero(me.id), hc = g.heroReviveCost(me.id);
          hero = this.cardButton('hero', '★', 'H', h.dead ? (g.heroQueued(me.id) ? h.def.name + ' : résurrection en cours' : 'Ressusciter ' + h.def.name + ' (niveau ' + h.heroLevel + ') — ' + Math.round(ZC.HERO_RESPAWN) + ' s') : h.def.name + ' est en vie', h.dead && can ? hc : 0, !can || me.minerals < hc);
        }
        html = worker + hero + e + e + e + e + e + e + this.cardButton('back', '↩', 'X', 'Retour');
      } else if (kind === 'dropship') {
        html = this.cardButton('move', '➜', 'M', 'Déplacer') + this.cardButton('stop', '■', 'S', 'Stop') + this.cardButton('build', '⌂', 'B', 'Construire un bunker sur une zone libre') + e + e + e + e + e + e;
      } else if (kind === 'bunker') {
        const b = g.selectedBunker, nb = g.selectedBunkers.length, multi = nb > 1 ? ' — ' + nb + ' bunkers sélectionnés' : '';
        const up = (k, ico) => {
          const d = ZC.UPGRADES[k], lvl = g.pendingLevel(b, k), cost = g.upgradeCost(b, k);
          const maxed = cost < 0;
          return this.cardButton(k === 'stim' ? 'stimResearch' : k, ico, d.hotkey, d.name + (maxed ? ' (max)' : ' niveau ' + (lvl + 1) + ' — recherche ' + Math.round(d.time(lvl)) + ' s') + ' — ' + d.desc + ' (unités de ce bunker uniquement)' + multi, maxed ? 0 : cost, maxed || me.minerals < cost, { done: b.up[k], queued: lvl - b.up[k], max: d.max });
        };
        const ft = ZC.UPGRADES.fortify, ftCost = g.upgradeCost(b, 'fortify');
        const drop = b.def.hq ? this.cardButton('dropship', '✈', 'D', 'Dropship : construit un bunker sur une zone libre (' + Math.round(g.dropshipBuildTime(me.id)) + ' s de production)', g.dropshipCost(me.id), me.minerals < g.dropshipCost(me.id))
          : this.cardButton('fortify', '⌂', ft.hotkey, ft.name + ' (' + ft.time() + ' s) : ' + ft.desc, ftCost < 0 ? 0 : ftCost, ftCost < 0 || me.minerals < ftCost, { done: b.up.fortify, queued: g.pendingLevel(b, 'fortify') - b.up.fortify, max: 1 });
        const ev = ZC.UPGRADES.evolve, evCost = g.upgradeCost(b, 'evolve'), can = g.canEvolve(b);
        const l2 = ZC.UNITS[ZC.UNITS[g.spawnTypeFor(me)].evolvesTo || g.spawnTypeFor(me)];
        const evolve = this.cardButton('evolve', '⬆', ev.hotkey, evCost < 0 ? 'Évolution terminée : ce bunker produit des ' + l2.name : 'Évolution (' + ev.time() + ' s) : ' + ev.desc + '. Transforme en ' + l2.name + (can ? '' : ' — INDISPONIBLE : armes, armure et portée doivent être au niveau ' + ev.requires + ' (terminées ou en file)'), evCost < 0 ? 0 : evCost, evCost < 0 || !can || me.minerals < evCost, { done: b.up.evolve, queued: g.pendingLevel(b, 'evolve') - b.up.evolve, max: 1 });
        const unload = b.garrison.length ? this.cardButton('unload', '⇩', 'U', 'Décharger la garnison (' + b.garrison.length + ' unités)') : e;
        const units = b.def.hq ? this.cardButton('units', '⚒', 'F', 'Unités spéciales : travailleurs' + (g.campaign ? ' et résurrection du héros' : '')) : e;
        html = drop + up('weapons', '✦') + up('armor', '⛨') + up('range', '⟶') + up('stim', '⚡') +
          this.cardButton('send', '⇶', 'G', 'Envoyer les troupes : toutes les unités produites par ce bunker partent en attaque-déplacement vers le point cliqué') + evolve + unload + units;
      } else if (kind === 'none') {
        html = (me.hq ? this.cardButton('dropship', '✈', 'D', 'Dropship (produit au centre de commandement)', g.dropshipCost(me.id), me.minerals < g.dropshipCost(me.id)) : e) + e + e + e + e + e + e + e + e;
      }
      this.el.cmd.innerHTML = html;
      this.cardKind = kind;
      if (this.app.input) this.setActiveCommand(this.app.input.mode);
    }
    refreshCardAffordability() {
      const g = this.app.game, me = g.human;
      this.el.cmd.querySelectorAll('button[data-cmd]').forEach(b => {
        const costEl = b.querySelector('.cost');
        if (!costEl) return;
        const cost = +costEl.textContent;
        b.classList.toggle('disabled', me.minerals < cost);
      });
    }

    update(dt) {
      const app = this.app, g = app.game;
      if (!g) return;
      const me = g.human;
      const s = g.settings;

      if (me) {
        this.txt(this.el.zones, String(me.zones));
        this.txt(this.el.units, String(me.unitCount));
        const cap = g.supplyCap(me.id);
        this.txt(this.el.supply, Math.round(me.supply) + '/' + cap);
        this.el.supply.parentNode.classList.toggle('maxed', me.supply >= cap);
        const wn = g.workers(me.id).length, wq = g.workersQueued(me.id), wc = g.workerCap(me.id);
        this.txt(this.el.workers, wn + (wq ? '+' + wq : '') + '/' + wc);
        this.el.workers.parentNode.classList.toggle('maxed', wn + wq >= wc);
        this.el.workers.parentNode.title = 'Travailleurs : ' + wn + ' sur ' + wc + (wq ? ' (' + wq + ' en production)' : '') + ' — ' + ZC.WORKER.perBunker + ' par bunker, ' + ZC.WORKER.max + ' au plus';
        this.el.supply.parentNode.title = 'Supply : ' + Math.round(me.supply) + ' sur ' + cap + ' (' + s.supplyBase + ' + ' + s.supplyPerBunker + ' par bunker, max ' + s.unitCap + ')';
        this.txt(this.el.kills, String(me.kills));
        this.txt(this.el.minerals, String(Math.floor(me.minerals)));
        this.txt(this.el.bunkers, String(me.bunkers) + (me.hq ? '' : ' (sans QG)'));
      }
      this.txt(this.el.time, ZC.formatTime(g.time));
      const ru = g.roundUnit, adm = s.admin ? '⚙ ADMIN · ' : '';
      const diff = ' · ' + (g.campaign ? (ZC.DIFFICULTIES[g.campaign.difficulty] || {}).label || '' : 'IA ' + (ZC.DIFFICULTY[s.difficulty] || {}).label || '').toUpperCase(); // difficulté toujours visible
      if (g.isTournament) {
        this.txt(this.el.roundName, adm + 'ROUND ' + (g.roundIndex + 1) + ' — ' + ru.name.toUpperCase() + diff);
        if (g.state === 'intermission') this.txt(this.el.roundTimer, 'Round suivant dans ' + Math.ceil(g.intermissionT) + ' s');
        else {
          const limit = s.roundTimeLimit > 0 ? 'Temps restant ' + ZC.formatTime(Math.max(0, s.roundTimeLimit - g.roundTime)) + '  ·  ' : '';
          this.txt(this.el.roundTimer, limit + 'Premier à ' + s.roundsToWin + ' round' + (s.roundsToWin > 1 ? 's' : '') + '  ·  Vague dans ' + Math.ceil(g.spawnTimer) + ' s');
        }
      } else if (s.mode === 'evolution') {
        this.txt(this.el.roundName, adm + 'ROUND ' + (g.roundIndex + 1) + ' — ' + ru.name.toUpperCase() + diff);
        const nextRound = g.roundIndex < ZC.ROUNDS.length - 1 ? 'Round suivant ' + ZC.formatTime(s.roundDuration - g.roundTimer) + '  ·  ' : '';
        this.txt(this.el.roundTimer, nextRound + 'Vague dans ' + Math.ceil(g.spawnTimer) + ' s');
      } else if (g.campaign) {
        const m = this.app.campaign.mission(g.campaign.mission), o = g.campaign.objective;
        this.txt(this.el.roundName, adm + m.name.toUpperCase() + diff);
        const alive = g.players.filter(p => p.alive && !p.isHuman && !p.invader && !g.allied(p.id, g.humanId)).length; // les alliés ne comptent pas
        this.txt(this.el.roundTimer, this.objectiveStatus(g, o, alive) + (s.invasion ? '  ·  Assaut par le ' + (g.nextInvasion ? g.nextInvasion.sideName : '?') + ' dans ' + Math.ceil(g.invasionT) + ' s (vague ' + (g.invasionCount + 1) + ')' : '') + '  ·  Vague dans ' + Math.ceil(g.spawnTimer) + ' s');
      } else {
        this.txt(this.el.roundName, adm + 'BUNKER ZONE' + diff);
        this.txt(this.el.roundTimer, 'Prochaine vague (' + ru.name + ') dans ' + Math.ceil(g.spawnTimer) + ' s');
      }
      if (this.waveFlashT > 0) { this.waveFlashT -= dt; this.el.roundTimer.classList.add('flash'); } else this.el.roundTimer.classList.remove('flash');

      this.lbT = (this.lbT === undefined ? 1 : this.lbT) + dt;
      if (this.lbT > 0.5) {
        this.lbT = 0;
        const tour = g.isTournament;
        const rows = tour ? g.standings() : g.players.slice().sort((a, b) => b.zones - a.zones || b.unitCount - a.unitCount);
        this.txt(this.el.lbTitle, tour ? 'Rounds gagnés · zones' : 'Zones contrôlées');
        const row = (p) => '<div class="lb-row' + (p.alive ? '' : ' dead') + '" style="color:' + p.hex + '"><span class="sw" style="background:' + p.hex + '"></span><span class="nm">' + esc(p.name) + '</span>' + (tour ? '<span class="rw">' + '★'.repeat(p.roundsWon) + '</span>' : '') + '<span class="zn">' + p.zones + '</span><span class="un">' + p.unitCount + '</span></div>';
        const teams = !tour && g.players.some(p => p.id !== g.humanId && !p.invader && g.allied(p.id, g.humanId));
        this.el.lbRows.innerHTML = teams
          ? '<div class="lb-grp ally">Alliés</div>' + rows.filter(p => g.allied(p.id, g.humanId)).map(row).join('') + '<div class="lb-grp enemy">Ennemis</div>' + rows.filter(p => !g.allied(p.id, g.humanId)).map(row).join('')
          : rows.map(row).join('');
      }

      if (this.msgs.length) {
        let changed = false;
        for (const m of this.msgs) { m.t += dt; if (m.t > 8) changed = true; }
        if (changed || Math.random() < 0.1) {
          this.msgs = this.msgs.filter(m => m.t < 10);
          this.renderMessages();
        }
      }
      if (this.announceT > 0) {
        this.announceT -= dt;
        this.el.announce.style.opacity = Math.min(1, this.announceT).toFixed(2);
        if (this.announceT <= 0) this.el.announce.style.opacity = 0;
      }

      app.renderer.drawMinimap(this.mctx, this.minimap.width, this.minimap.height);

      // Panneau de sélection + carte de commandes
      this.selRefreshT += dt;
      if (g.selectionVersion !== this.lastSelVersion) this.sub = null; // changement de sélection : retour à la carte principale
      const kind = this.selectionKind();
      if (g.selectionVersion !== this.lastSelVersion || kind !== this.cardKind) {
        this.lastSelVersion = g.selectionVersion;
        this.buildSelection();
        this.buildCommandCard(kind); this.cardSig = this.cardSignature();
        this.selRefreshT = 0;
      } else if (this.selRefreshT > 0.2) {
        this.selRefreshT = 0; this.refreshSelection();
        const sig = this.cardSignature();
        if (sig !== this.cardSig) { this.cardSig = sig; this.buildCommandCard(kind); } else this.refreshCardAffordability();
      }
      if (g.selection.length === 1) this.drawPortrait(g.selection[0]);
    }

    // Ligne d'état de l'objectif de mission dans la barre du haut
    objectiveStatus(g, o, alive) {
      const me = g.human;
      if (o.type === 'survive') return 'Tenir encore ' + ZC.formatTime(Math.max(0, o.time - g.time));
      if (o.type === 'zones') {
        const best = g.players.filter(p => p.alive && !p.isHuman && !p.invader && !g.allied(p.id, g.humanId)).sort((a, b) => b.zones - a.zones)[0];
        return 'Vos zones : ' + me.zones + ' / ' + o.count + (best ? '  ·  Meilleur ennemi (' + best.name + ') : ' + best.zones + ' / ' + o.count : '');
      }
      if (o.type === 'conquer') return 'Chefs de guerre restants : ' + alive + '  ·  Zones occupées : ' + me.zones + ' / ' + g.map.zones.length;
      return 'Chefs de guerre restants : ' + alive;
    }

    selectionKind() {
      const g = this.app.game;
      if (g.selectedBunker) return this.sub === 'units' && g.selectedBunker.def.hq ? 'hqUnits' : 'bunker';
      if (g.selectedTower) return 'tower';
      const own = g.ownSelection;
      if (!own.length) return 'none';
      if (own.every(u => u.type === 'dropship')) return 'dropship';
      if (own.every(u => u.def.worker)) return 'workers';
      return 'units';
    }

    buildSelection() {
      const g = this.app.game, sel = g.selection, info = this.el.info;
      if (!sel.length) { info.innerHTML = '<div class="info-empty">BUNKER ZONE<small>Sélectionnez un bunker pour acheter des dropships et des améliorations · une zone sans bunker se prend au dropship</small></div>'; return; }
      if (sel.length === 1) {
        const u = sel[0], p = g.players[u.owner];
        let extra = '';
        if (u.def.tower) extra = '<div class="line sub" id="u-kills"></div><div class="line sub">' + (u.def.manned ? 'Tour habitée : clic droit avec des soldats pour y monter (' + u.def.capacity + ' places, portée +' + u.def.rangeBonus + ' cases) · U faire descendre' : 'Tourelle autonome · portée ' + (u.def.range / ZC.TILE) + ' cases · dégâts ' + u.def.dmg) + '</div>';
        else if (u.def.extractor) extra = '<div class="line sub" id="u-kills"></div><div class="line sub">Extrait ' + ZC.EXTRACTOR.rate + ' minerai/s du gisement, directement dans votre banque</div>';
        else if (u.def.structure) extra = '<div class="line sub" id="u-extra"></div><div class="line sub" id="u-up"></div><div class="line build" id="u-build"></div><div class="line build" id="u-research"></div>' + '<div class="line sub">Clic droit : point de ralliement · ' + (u.def.hq ? 'D dropship · F unités (travailleurs' + (g.campaign ? ', héros' : '') + ') · ' : 'Q centre de commandement · ') + 'W/R/E/T améliorations · V évolution · G envoyer les troupes · U décharger la garnison</div>';
        else if (u.def.worker) extra = '<div class="line sub" id="u-kills"></div><div class="line sub">Clic droit sur un gisement vert : récolter (G) · clic droit sur un bunker allié abîmé : réparer (R, ' + ZC.REPAIR.costPerSec + ' minerais/s)</div>';
        else if (u.type === 'dropship') extra = '<div class="line sub">Clic droit sur une zone libre : construire un bunker (' + g.settings.landingTime + ' s)</div>';
        else extra = '<div class="line sub">' + (u.def.level ? 'Niveau ' + u.def.level + ' · ' : '') + 'Dégâts ' + u.damage + (u.def.hits > 1 ? ' x' + u.def.hits : '') + ' (' + u.def.dtype + ') · Armure ' + u.armor + ' · Portée ' + (u.def.range ? (u.range / ZC.TILE) : 'mêlée') + (u.home && u.home.zone ? ' · Bunker ' + (u.home.zone.ix + 1) + '-' + (u.home.zone.iy + 1) : '') + '</div><div class="line sub" id="u-kills"></div>' + (u.canGarrison ? '<div class="line sub">Clic droit sur un bunker allié : entrer en garnison</div>' : '');
        info.innerHTML = `
          <div class="single">
            <div class="portrait-wrap"><canvas id="portrait" width="72" height="72"></canvas><div id="portrait-hp" class="pbar"></div></div>
            <div class="details">
              <div class="uname" style="color:${p.hex}">${esc(u.def.extractor ? ZC.RACES[p.race].extractor : u.def.name)}</div>
              <div class="owner">${esc(p.name)}</div>
              <div class="line" id="u-hp"></div>
              <div class="line" id="u-shield"></div>
              ${extra}
            </div>
          </div>`;
        this.portrait = info.querySelector('#portrait');
        this.pctx = this.portrait.getContext('2d');
        this.refreshSelection();
        return;
      }
      const max = 36;
      let html = '<div class="multi">';
      sel.slice(0, max).forEach((u, i) => {
        html += '<div class="icon" data-i="' + i + '" title="' + esc(u.def.name) + '"><canvas width="34" height="34"></canvas><div class="ibar"><div class="ifill"></div></div></div>';
      });
      if (sel.length > max) html += '<div class="more">+' + (sel.length - max) + '</div>';
      html += '</div><div class="multi-count">' + sel.length + (g.selectedBunkers.length ? ' bunkers — les commandes s\'appliquent à tous' : ' unités') + '</div>';
      info.innerHTML = html;
      const icons = info.querySelectorAll('.icon');
      icons.forEach((ic, i) => {
        const u = sel[i], c = ic.querySelector('canvas'), ctx = c.getContext('2d');
        ctx.save(); ctx.translate(17, 17); ctx.scale(u.type === 'dropship' ? 0.9 : 1.3, u.type === 'dropship' ? 0.9 : 1.3); if (!ZC.spriteIsImage(u.type)) ctx.rotate(-Math.PI / 2);
        ZC.drawUnitSprite(ctx, u.type, g.players[u.owner].hex, 0, false, 0, 0, u.up, undefined, undefined, g.players[u.owner].race);
        ctx.restore();
        ic.addEventListener('click', () => { g.select([u], false); ZC.Audio.play('select'); });
      });
      this.refreshSelection();
    }

    refreshSelection() {
      const g = this.app.game, sel = g.selection, info = this.el.info;
      if (sel.length === 1) {
        const u = sel[0];
        const hp = info.querySelector('#u-hp'); if (!hp) return;
        const f = u.hp / u.maxHp;
        hp.innerHTML = '<span class="k">Vie</span> <span style="color:' + (f > 0.66 ? '#10fc18' : f > 0.33 ? '#fcfc38' : '#fc3838') + '">' + Math.ceil(u.hp) + ' / ' + u.maxHp + '</span>';
        info.querySelector('#u-shield').innerHTML = u.def.shield ? '<span class="k">Bouclier</span> <span style="color:#4aa8ff">' + Math.ceil(u.shield) + ' / ' + u.def.shield + '</span>' : '';
        const k = info.querySelector('#u-kills'); if (k && u.def.tower) k.textContent = u.building ? 'En construction : ' + Math.round(Math.min(100, u.buildT / ZC.TOWER.buildTime * 100)) + ' %' : (u.def.manned ? 'Garnison ' + u.garrison.length + '/' + u.def.capacity + (u.garrison.length ? '' : ' (ne tire pas)') : 'En veille') + ' · Kills : ' + u.kills;
        else if (k && u.def.extractor) k.textContent = u.building ? 'En construction : ' + Math.round(Math.min(100, u.buildT / ZC.EXTRACTOR.buildTime * 100)) + ' %' : u.patch && u.patch.amount > 0 ? 'En activité · gisement : ' + Math.round(u.patch.amount) : 'Gisement épuisé';
        else if (k && u.def.worker) k.textContent = (u.order.type === 'gather' ? (u.slot ? 'Récolte en cours' : u.carry >= ZC.MINERALS.carry ? 'Rapporte ' + u.carry + ' minerais' : 'En route vers le gisement') : u.order.type === 'repair' ? 'Réparation' + (u.repairing ? ' en cours (' + ZC.REPAIR.costPerSec + ' minerais/s)' : '') : 'Inactif') + (u.carry > 0 && u.order.type !== 'gather' ? ' · transporte ' + u.carry + ' minerais' : '');
        else if (k) k.textContent = (u.def.hero ? 'Héros · Niveau ' + u.heroLevel + ' · ' + Math.floor(u.xp) + ' XP' + (u.heroLevel < ZC.HERO_MAX_LEVEL ? ' / ' + ZC.heroXpFor(u.heroLevel + 1) : '') + ' · ' : '') + 'Kills : ' + u.kills + (u.stimT > 0 ? ' · Stimulé (' + Math.ceil(u.stimT) + ' s)' : '');
        const ex = info.querySelector('#u-extra');
        if (ex && u.zone) ex.textContent = (u.def.hq ? 'QG · Travailleurs ' + g.workers(u.owner).length + '/' + g.workerCap(u.owner) + ' · ' : '') + 'Armure ' + u.armor + ' · Zone ' + (u.zone.ix + 1) + '-' + (u.zone.iy + 1) + (u.zone.super ? ' (centrale x' + g.settings.superZoneMult + ')' : '') + (u.zone.minerals ? ' · Gisement : ' + Math.round(u.zone.minerals.amount) : '') + ' · Prochaine vague dans ' + Math.ceil(g.spawnTimer) + ' s' + (u.rally ? ' · Ralliement défini' : '');
        const upl = info.querySelector('#u-up');
        if (upl) upl.textContent = (g.groupKeysOf(u) ? 'Groupe ' + g.groupKeysOf(u) + ' · ' : '') + 'Garnison ' + u.garrison.length + '/' + ZC.capacity(u) + (u.garrison.length ? '' : ' (ne tire pas)') + ' · Troupes en vie : ' + g.bunkerTroops(u).length + ' · Armes +' + u.up.weapons + ' · Armure +' + u.up.armor + ' · Portée +' + u.up.range + (u.up.stim ? ' · Stimpack' : '');
        // Files d'attente en icônes : le premier élément porte sa barre de progression, les suivants attendent
        const qIcon = (cmd, key, pct, title, gold, kind, i) => '<span class="qi' + (pct !== undefined ? ' cur' : '') + '" data-q="' + kind + '" data-i="' + i + '" title="' + esc(title) + ' — clic : annuler et rembourser">' + (ICONS[cmd] || '') + '<i>' + key + '</i>' + (pct !== undefined ? '<b class="' + (gold ? 'gold' : '') + '" style="width:' + pct.toFixed(0) + '%"></b>' : '') + '</span>';
        const rd = info.querySelector('#u-research');
        if (rd && u.def.structure) {
          if (u.research.length) {
            const r0 = u.research[0], lvls = {};
            rd.innerHTML = '<span class="k">Recherche</span> ' + u.research.map((r, i) => {
              const d = ZC.UPGRADES[r.what]; lvls[r.what] = (lvls[r.what] || u.up[r.what]) + 1;
              return qIcon(r.what === 'stim' ? 'stimResearch' : r.what, d.hotkey, i === 0 ? Math.min(100, r.t / r.total * 100) : undefined, d.name + ' niveau ' + lvls[r.what] + (i === 0 ? ' · ' + Math.ceil(r.total - r.t) + ' s' : ' · en attente'), true, 'research', i);
            }).join('') + ' <span class="bt">' + ZC.UPGRADES[r0.what].name + ' +' + (u.up[r0.what] + 1) + ' · ' + Math.ceil(r0.total - r0.t) + ' s' + (u.research.length > 1 ? ' · ' + (u.research.length - 1) + ' en attente' : '') + '</span>';
          } else rd.innerHTML = '<span class="k">Recherche</span> <span class="bt">aucune en cours</span>';
        }
        const bd = info.querySelector('#u-build');
        if (bd && u.def.structure) {
          if (u.queue.length) {
            const q0 = u.queue[0], nom = w => w === 'worker' ? ZC.UNITS[ZC.RACES[g.players[u.owner].race].worker].name : w === 'hero' ? 'Héros' : 'Dropship';
            bd.innerHTML = '<span class="k">Production</span> ' + u.queue.map((q, i) => qIcon(q.what, q.what === 'worker' ? 'W' : q.what === 'hero' ? 'H' : 'D', i === 0 ? Math.min(100, q.t / q.total * 100) : undefined, nom(q.what) + (i === 0 ? ' · ' + Math.ceil(q.total - q.t) + ' s' : ' · en attente'), false, 'queue', i)).join('') + ' <span class="bt">' + nom(q0.what) + ' · ' + Math.ceil(q0.total - q0.t) + ' s' + (u.queue.length > 1 ? ' · ' + (u.queue.length - 1) + ' en attente' : '') + '</span>';
          } else bd.innerHTML = '<span class="k">Production</span> <span class="bt">' + (u.def.hq ? 'aucune · dropship : ' + Math.round(g.dropshipBuildTime(u.owner)) + ' s · ' : '') + 'vague : ' + ZC.UNITS[g.bunkerSpawnType(u)].name + (u.up.evolve ? ' (évolué)' : '') + '</span>';
        }
        const pb = info.querySelector('#portrait-hp');
        pb.style.background = 'linear-gradient(90deg,' + (f > 0.66 ? '#10fc18' : f > 0.33 ? '#fcfc38' : '#fc3838') + ' ' + (f * 100).toFixed(0) + '%, #222 ' + (f * 100).toFixed(0) + '%)';
        return;
      }
      const icons = info.querySelectorAll('.icon');
      icons.forEach((ic, i) => {
        const u = sel[i]; if (!u) return;
        const f = u.hp / u.maxHp, fill = ic.querySelector('.ifill');
        fill.style.width = (f * 100).toFixed(0) + '%';
        fill.style.background = f > 0.66 ? '#10fc18' : f > 0.33 ? '#fcfc38' : '#fc3838';
      });
    }

    drawPortrait(u) {
      if (!this.pctx || !this.portrait || !this.portrait.isConnected) return;
      const ctx = this.pctx, g = this.app.game;
      ctx.fillStyle = '#0a0c10'; ctx.fillRect(0, 0, 72, 72);
      ctx.save(); ctx.translate(36, 38);
      const t = this.app.renderer.frameT;
      if (u.def.structure) { ctx.scale(1.3, 1.3); }
      else if (u.type === 'dropship') { ctx.scale(1.4, 1.4); ctx.rotate(-Math.PI / 2 + Math.sin(t * 0.8) * 0.15); }
      else if (ZC.spriteIsImage(u.type)) { ctx.scale(2, 2); }
      else { ctx.scale(2.4, 2.4); ctx.rotate(-Math.PI / 2 + Math.sin(t * 0.8) * 0.15); }
      ZC.drawUnitSprite(ctx, u.type, g.players[u.owner].hex, t * 6, !u.def.structure, 0, t, u.up, undefined, undefined, g.players[u.owner].race);
      ctx.restore();
    }

    // ------------------------------------------------------------ Menus
    buildMenus() {
      this.menus.innerHTML = `
        <div id="menu-title" class="screen hidden">
          <div class="corner tl">SECTEURS ACTIFS : <b id="t-zones">49</b></div>
          <div class="corner tr">STATUT : <b class="crit">CRITIQUE</b></div>
          <div class="corner bl">v<span id="t-ver">${ZC.VERSION}</span> · BUNKER ZONE</div>
          <div class="corner br">STATUT : <b class="crit">CRITIQUE</b></div>
          <div id="logo"><div class="plate"><span class="acc red"></span><span class="acc blue"></span><div class="word">BUNKER</div><div class="word">ZONE</div></div></div>
          <div id="title-menu">
            <button id="btn-play">Jouer</button>
            <button id="btn-multi" disabled title="Bientôt disponible">Multijoueur</button>
            <button id="btn-options">Options</button>
            <button id="btn-exit">Quitter</button>
          </div>
          <div id="title-note"></div>
        </div>
        <div id="menu-play" class="menu hidden">
          <h1>JOUER</h1>
          <div class="cards">
            <div class="card"><h3>Partie simple</h3><p>Une partie avec vos réglages actuels : mode, carte, nombre d'IA, difficulté...</p><button id="btn-simple" class="big">Lancer une partie</button></div>
            <div class="card"><h3>Aventure</h3><p>Quatre mondes à conquérir, un par race, ${ZC.SCENARIOS.length} missions chacun et trois difficultés par mission. Des points à dépenser dans la boutique et trois héros qui montent de niveau. L'aventure se joue avec les humains.</p><button id="btn-adventure" class="big">Entrer dans l'aventure</button></div>
          </div>
          <div class="btns"><button id="btn-play-back">Retour</button></div>
        </div>
        <div id="menu-campaign" class="screen hidden">
          <canvas id="adv-planet"></canvas>
          <div class="adv-top">
            <div class="adv-title" id="adv-title">AVENTURE</div>
            <div class="adv-points">★ <b id="adv-points">0</b> points <span class="adv-stats" id="adv-stats"></span></div>
            <div class="adv-btns"><button id="btn-shop">Boutique</button><button id="btn-heroes">Héros</button><button id="btn-adv-back">Retour</button></div>
          </div>
          <div class="adv-worlds" id="adv-worlds"></div>
          <div class="adv-desc" id="adv-desc"></div>
          <div id="adv-strip"><div id="adv-cards"></div></div>
          <div id="adv-info"></div>
          <div class="adv-races" id="adv-races"></div>
        </div>
        <div id="menu-mission" class="menu hidden">
          <h1 id="mis-title"></h1>
          <div id="mis-dialog" class="dialog">
            <div class="dlg-who"><canvas id="mis-portrait" width="96" height="96"></canvas><div class="dlg-side" id="dlg-side"></div></div>
            <div class="dlg-text"><div class="dlg-name" id="dlg-name"></div><div class="dlg-role" id="dlg-role"></div><div class="dlg-line" id="dlg-line"></div></div>
            <div class="dlg-btns"><button id="dlg-next">Suivant ▸</button><button id="dlg-skip">Passer</button></div>
          </div>
          <div id="mis-sheet" class="hidden">
            <p class="tag" id="mis-brief"></p>
            <div class="mis-obj" id="mis-obj"></div>
            <h3>Difficulté</h3><div class="diffs" id="mis-diffs"></div>
            <h3>Héros</h3><div class="heroes" id="mis-heroes"></div>
            <div class="btns"><button id="btn-mission-start" class="big">Lancer la mission</button><button id="btn-mission-back">Retour à la carte</button></div>
          </div>
        </div>
        <div id="menu-shop" class="menu hidden">
          <h1>BOUTIQUE</h1>
          <p class="tag">Améliorations passives, permanentes, valables dans toutes les missions de l'aventure. <b class="gold">★ <span id="shop-points">0</span> points disponibles</b></p>
          <div id="shop-list"></div>
          <div class="btns"><button id="btn-shop-back">Retour</button></div>
        </div>
        <div id="menu-heroes" class="menu hidden">
          <h1>HÉROS</h1>
          <p class="tag">Un héros vous accompagne en mission, gagne de l'expérience à chaque kill et conserve ses niveaux sur votre compte. S'il tombe, ressuscitez-le au centre de commandement (carte « Unités », ${ZC.HERO_RESPAWN} s, coût selon son niveau).</p>
          <div class="heroes big" id="hero-list"></div>
          <div class="btns"><button id="btn-heroes-back">Retour</button></div>
        </div>
        <div id="menu-start" class="menu hidden">
          <h1>OPTIONS</h1>
          <p class="tag">Chaque zone a un bunker en son centre : qui tient le bunker tient la zone, et chaque bunker produit des marines à chaque vague.<br>
          Votre centre de commandement est le seul à produire des dropships, qui construisent des bunkers sur les zones libres. Détruire un bunker ennemi libère sa zone.<br>
          Chaque bunker a ses propres améliorations (armes, armure, portée, stimpack), qui ne s'appliquent qu'aux marines qu'il produit. Gagnez des minerais par les zones et les kills.<br>
          Le joueur qui détruit tous les bunkers adverses l'emporte.</p>
          <div class="cols">
            <div class="form" id="start-form"></div>
            <div class="helpbox"><h3>Commandes</h3>${HELP}</div>
          </div>
          <div class="btns"><button id="btn-start" class="big">Commencer la partie</button><button id="btn-back">Retour</button></div>
        </div>
        <div id="menu-pause" class="menu hidden">
          <h2>PAUSE</h2>
          <div class="btns col">
            <button id="btn-resume">Reprendre</button>
            <button id="btn-restart">Recommencer</button>
            <button id="btn-sound">Son</button>
            <button id="btn-music">Musique</button>
            <button id="btn-quit">Quitter vers le menu</button>
          </div>
          <div class="helpbox">${HELP}</div>
        </div>
        <div id="menu-end" class="menu hidden">
          <h1 id="end-title"></h1>
          <p id="end-sub" class="tag"></p>
          <div id="end-campaign" class="campaign-result hidden"></div>
          <table id="end-stats"></table>
          <div class="btns">
            <button id="btn-observe">Continuer à observer</button>
            <button id="btn-replay">Rejouer</button>
            <button id="btn-campaign">Retour à la carte</button>
            <button id="btn-menu">Menu principal</button>
          </div>
        </div>`;
      const q = (s) => this.menus.querySelector(s);
      this.m = { title: q('#menu-title'), play: q('#menu-play'), campaign: q('#menu-campaign'), mission: q('#menu-mission'), shop: q('#menu-shop'), heroes: q('#menu-heroes'), start: q('#menu-start'), pause: q('#menu-pause'), end: q('#menu-end') };
      q('#btn-start').addEventListener('click', () => { ZC.Audio.init(); this.app.start(this.readForm()); });
      q('#btn-back').addEventListener('click', () => { this.app.settings = Object.assign({}, this.app.settings, this.readForm()); this.app.saveSettings(); this.showTitle(); });
      q('#btn-play').addEventListener('click', () => { ZC.Audio.init(); this.showPlay(); });
      q('#btn-simple').addEventListener('click', () => { ZC.Audio.init(); this.app.start(this.app.plainSettings); });
      q('#btn-adventure').addEventListener('click', () => this.showCampaign());
      q('#btn-play-back').addEventListener('click', () => this.showTitle());
      q('#btn-adv-back').addEventListener('click', () => this.showPlay());
      q('#btn-shop').addEventListener('click', () => this.showShop());
      q('#btn-shop-back').addEventListener('click', () => this.showCampaign());
      q('#btn-heroes').addEventListener('click', () => this.showHeroes());
      q('#btn-heroes-back').addEventListener('click', () => this.showCampaign());
      q('#btn-mission-back').addEventListener('click', () => this.showCampaign());
      q('#dlg-next').addEventListener('click', () => this.dialogNext());
      q('#dlg-skip').addEventListener('click', () => this.dialogEnd());
      q('#btn-mission-start').addEventListener('click', () => { ZC.Audio.init(); this.app.startMission(this.mis.id, this.mis.diff); });
      q('#btn-campaign').addEventListener('click', () => this.app.quitToCampaign());
      q('#btn-options').addEventListener('click', () => this.showStart(this.app.settings));
      q('#btn-exit').addEventListener('click', () => this.app.quit());
      q('#btn-resume').addEventListener('click', () => this.app.resume());
      q('#btn-restart').addEventListener('click', () => this.app.restart());
      q('#btn-quit').addEventListener('click', () => this.app.quitToMenu());
      q('#btn-sound').addEventListener('click', () => { this.app.toggleSound(); this.updateSoundButton(); });
      q('#btn-music').addEventListener('click', () => { this.app.toggleMusic(); this.updateSoundButton(); });
      q('#btn-observe').addEventListener('click', () => this.app.resume());
      q('#btn-replay').addEventListener('click', () => this.app.restart());
      q('#btn-menu').addEventListener('click', () => this.app.quitToMenu());
    }

    hideMenus() { for (const k in this.m) this.m[k].classList.add('hidden'); }
    updateSoundButton() {
      this.menus.querySelector('#btn-sound').textContent = 'Son : ' + (this.app.settings.sound ? 'activé' : 'coupé');
      this.menus.querySelector('#btn-music').textContent = 'Musique : ' + (this.app.settings.music !== false ? 'activée' : 'coupée');
    }

    showStart(s) {
      this.hideMenus();
      const colorSw = ZC.PLAYER_COLORS.map((c, i) => '<label class="sw-lbl" title="' + c.name + '"><input type="radio" name="playerColor" value="' + i + '"' + (i === s.playerColor ? ' checked' : '') + '><span class="sw" style="background:' + c.hex + '"></span></label>').join('');
      this.menus.querySelector('#start-form').innerHTML = `
        <label>Mode de jeu<select name="mode">${opt(['classic', 'evolution', 'rounds'], ['Classique (marines)', 'Évolution (l\'unité change)', 'Tournoi (premier à N rounds)'], s.mode)}</select></label>
        <label>Tournoi : rounds à gagner<select name="roundsToWin">${opt([1, 2, 3, 5], null, s.roundsToWin)}</select></label>
        <label>Tournoi : limite par round<select name="roundTimeLimit">${opt([0, 180, 300, 480, 720], ['Aucune (élimination)', '3:00', '5:00', '8:00', '12:00'], s.roundTimeLimit)}</select></label>
        <label>Adversaires (IA)<select name="aiCount">${opt([1, 2, 3, 4, 5, 6, 7], null, s.aiCount)}</select></label>
        <label>Difficulté<select name="difficulty">${opt(['easy', 'normal', 'hard'], ['Facile', 'Normal', 'Difficile'], s.difficulty)}</select></label>
        <label>Votre race<select name="playerRace">${opt(Object.keys(ZC.RACES), Object.values(ZC.RACES).map(r => r.name), s.playerRace)}</select></label>
        <label>Largeur de carte (zones)<select name="mapZones">${opt([3, 5, 7, 9, 11], null, s.mapZones)}</select></label>
        <label>Hauteur de carte<select name="mapZonesY">${opt([0, 1, 3, 5, 7, 9], ['Carrée', '1 (couloir)', '3', '5', '7', '9'], s.mapZonesY || 0)}</select></label>
        <label>Taille des zones<select name="zoneTiles">${opt([8, 12, 16], ['Petites (8 cases)', 'Normales (12 cases)', 'Grandes (16 cases)'], s.zoneTiles)}</select></label>
        <label>Terrain<select name="tileset">${opt(['jungle', 'badlands', 'space'], ['Jungle', 'Badlands', 'Plateforme spatiale'], s.tileset)}</select></label>
        <label>Votre couleur<span class="swatches">${colorSw}</span></label>
        <label>Intervalle des vagues<select name="spawnInterval">${opt([5, 8, 10, 15, 20], ['5 s', '8 s', '10 s', '15 s', '20 s'], s.spawnInterval)}</select></label>
        <label>Unités de départ<select name="startUnits">${opt([4, 8, 12, 20], null, s.startUnits)}</select></label>
        <label>Supply max<select name="unitCap">${opt([60, 100, 150, 200], null, s.unitCap)}</select></label>
        <label>Supply par bunker<select name="supplyPerBunker">${opt([10, 15, 20, 30, 50], ['+10', '+15', '+20', '+30', '+50'], s.supplyPerBunker)}</select></label>
        <label>Revenu par bunker / vague<select name="incomePerBunker">${opt([0, 2, 3, 5], ['Aucun (kills seulement)', '2 minerais', '3 minerais', '5 minerais'], s.incomePerBunker)}</select></label>
        <label>Coût d'un dropship<select name="dropshipCost">${opt([100, 150, 250], null, s.dropshipCost)}</select></label>
        <label>Temps d'atterrissage<select name="landingTime">${opt([3, 6, 10], ['3 s (rapide)', '6 s', '10 s (lent)'], s.landingTime)}</select></label>
        <label>Durée d'un round (évolution)<select name="roundDuration">${opt([60, 100, 150, 240], ['1:00', '1:40', '2:30', '4:00'], s.roundDuration)}</select></label>
        <label>Gisements de minerai<select name="mineralZones">${opt([0, 0.2, 0.4, 0.7], ['Aucun (zones de départ non plus)', 'Rares', 'Normaux', 'Abondants'], s.mineralZones)}</select></label>
        <label>Travailleurs au départ<select name="startWorkers">${opt([0, 2, 4], ['0', '2', '4'], s.startWorkers)}</select></label>
        <label>Vitesse du jeu<select name="gameSpeed">${opt([0.7, 1, 1.4], ['Lente', 'Normale', 'Rapide'], s.gameSpeed)}</select></label>
        <label>Sélection max<select name="selectionLimit">${opt([0, 12], ['Illimitée', '12 (comme SC1)'], s.selectionLimit)}</select></label>
        <label>Son<select name="sound">${opt([1, 0], ['Activé', 'Coupé'], s.sound ? 1 : 0)}</select></label>
        <label>Musique en partie<select name="music">${opt([1, 0], ['Activée', 'Coupée'], s.music === false ? 0 : 1)}</select></label>
        <label>Mode admin (triche)<select name="admin">${opt([0, 1], ['Désactivé', 'Activé'], s.admin ? 1 : 0)}</select></label>
        <label>Défilement au bord<select name="edgeScroll">${opt([1, 0], ['Activé', 'Désactivé'], s.edgeScroll === false ? 0 : 1)}</select></label>`;
      this.m.start.classList.remove('hidden');
    }

    readForm() {
      const f = this.menus.querySelector('#start-form');
      const v = (n) => f.querySelector('[name="' + n + '"]').value;
      return {
        mode: v('mode'), aiCount: +v('aiCount'), difficulty: v('difficulty'), mapZones: +v('mapZones'), mapZonesY: +v('mapZonesY'), playerRace: v('playerRace'), zoneTiles: +v('zoneTiles'), tileset: v('tileset'),
        playerColor: +f.querySelector('[name="playerColor"]:checked').value,
        spawnInterval: +v('spawnInterval'), roundDuration: +v('roundDuration'), roundsToWin: +v('roundsToWin'), roundTimeLimit: +v('roundTimeLimit'),
        startUnits: +v('startUnits'), unitCap: +v('unitCap'), supplyPerBunker: +v('supplyPerBunker'),
        incomePerBunker: +v('incomePerBunker'), dropshipCost: +v('dropshipCost'),
        landingTime: +v('landingTime'), gameSpeed: +v('gameSpeed'), selectionLimit: +v('selectionLimit'), mineralZones: +v('mineralZones'), startWorkers: +v('startWorkers'),
        sound: v('sound') === '1', music: v('music') === '1', edgeScroll: v('edgeScroll') === '1', admin: v('admin') === '1', humanPlayer: true,
      };
    }

    showPause() { this.hideMenus(); this.updateSoundButton(); this.m.pause.classList.remove('hidden'); }

    // ------------------------------------------------------------ Mode aventure
    showPlay() { this.hideMenus(); this.m.play.classList.remove('hidden'); }

    showCampaign(worldId) {
      this.hideMenus();
      const c = this.app.campaign, q = (s) => this.menus.querySelector(s);
      if (worldId) c.selectWorld(worldId);
      if (!c.worldUnlocked(c.data.world)) c.selectWorld('w1');
      const w = c.world(c.data.world), wi = ZC.WORLDS.indexOf(w), wp = c.worldPoints(w.id);
      q('#adv-points').textContent = String(c.points);
      q('#adv-title').textContent = 'AVENTURE · MONDE ' + (wi + 1) + ' : ' + w.name.toUpperCase();
      q('#adv-title').style.color = w.color;
      // onglets des mondes
      q('#adv-worlds').innerHTML = ZC.WORLDS.map((ww, i) => {
        const unl = c.worldUnlocked(ww.id), p = c.worldPoints(ww.id);
        return '<button class="world' + (ww.id === w.id ? ' sel' : '') + (unl ? '' : ' locked') + '" data-id="' + ww.id + '" style="--wc:' + ww.color + ';background-image:url(' + ZC.planetThumb(ww.race, 120) + ')"' + (unl ? '' : ' title="Monde verrouillé : terminez les ' + ZC.SCENARIOS.length + ' missions du monde précédent (dans n\'importe quelle difficulté)."') + '><b>' + (unl ? 'Monde ' + (i + 1) : '🔒 Monde ' + (i + 1)) + '</b><span>' + esc(ww.name) + '</span><small>' + esc(ZC.RACES[ww.race].name) + ' · ' + p.earned + ' / ' + p.total + ' ★</small></button>';
      }).join('');
      q('#adv-worlds').querySelectorAll('.world').forEach(b => b.addEventListener('click', () => { if (c.worldUnlocked(b.dataset.id)) this.showCampaign(b.dataset.id); else ZC.Audio.play('error', 0); }));
      q('#adv-desc').textContent = w.desc + ' Ennemis : ' + ZC.RACES[w.race].name.toLowerCase() + '.';
      // planète du monde en fond (redessinée si la taille de l'écran change)
      this.drawAdvPlanet(w);
      // missions du monde : grosses cases défilantes, infos de la mission choisie en dessous
      const ms = w.missions;
      const cards = q('#adv-cards');
      cards.innerHTML = ms.map((m, i) => {
        const unlocked = c.unlocked(m.id), done = c.completed(m.id), st = m.settings, o = m.objective;
        const pips = ['easy', 'medium', 'hard'].map(d => '<span class="pip ' + d + (c.done(m.id, d) ? ' on' : '') + '" title="' + ZC.DIFFICULTIES[d].label + ' : ' + m.points[d] + ' points"></span>').join('');
        const kind = ZC.objectiveKind(o, st);
        const earned = ['easy', 'medium', 'hard'].reduce((t, d) => t + (c.done(m.id, d) ? m.points[d] : 0), 0), total = m.points.easy + m.points.medium + m.points.hard;
        return '<div class="mcard' + (unlocked ? '' : ' locked') + (done ? ' done' : '') + '" data-id="' + m.id + '" style="--wc:' + w.color + '">' +
          '<div class="mc-top"><span class="mc-num">' + (unlocked ? i + 1 : '🔒') + '</span><span class="mc-kind">' + kind + '</span></div>' +
          '<div class="mc-scene"><canvas class="mc-land" width="208" height="120"></canvas>' + this.missionPreview(m, w) + '</div>' +
          '<div class="mc-name">' + esc(m.name) + '</div>' +
          '<div class="mc-foot"><span class="pips">' + pips + '</span><span class="mc-pts">' + earned + ' / ' + total + ' ★</span></div></div>';
      }).join('');
      const drawScenes = () => cards.querySelectorAll('.mcard').forEach(n => ZC.drawMissionScene(n.querySelector('.mc-land'), c.mission(n.dataset.id), w, 208, 120));
      drawScenes();
      if (!ZC.spriteIsImage('marine')) { // planche de sprites pas encore chargée : on redessine quand elle arrive
        clearTimeout(this._sceneT);
        const retry = (n) => { this._sceneT = setTimeout(() => { if (this.m.campaign.classList.contains('hidden')) return; if (ZC.spriteIsImage('marine')) drawScenes(); else if (n > 0) retry(n - 1); }, 400); };
        retry(25);
      }
      const strip = q('#adv-strip');
      if (!strip.dataset.wheel) { strip.dataset.wheel = '1'; strip.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { strip.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false }); }
      const select = (m, scroll) => {
        this.advSel = m.id;
        cards.querySelectorAll('.mcard').forEach(n => n.classList.toggle('sel', n.dataset.id === m.id));
        this.renderAdvInfo(m, w);
        if (scroll) { const n = cards.querySelector('.mcard[data-id="' + m.id + '"]'); if (n) n.scrollIntoView({ block: 'nearest', inline: 'center', behavior: scroll === 'smooth' ? 'smooth' : 'auto' }); }
      };
      cards.querySelectorAll('.mcard').forEach(n => {
        const m = c.mission(n.dataset.id);
        n.addEventListener('click', () => {
          if (this.advSel === m.id && c.unlocked(m.id)) { this.showMission(m.id); return; }  // second clic : on lance
          if (!c.unlocked(m.id)) ZC.Audio.play('error', 0);
          select(m, 'smooth');
        });
      });
      // mission choisie : la précédente, sinon la première non terminée, sinon la dernière débloquée
      const prev = this.advSel && ms.find(m => m.id === this.advSel);
      select(prev || ms.find(m => c.unlocked(m.id) && !c.completed(m.id)) || ms.filter(m => c.unlocked(m.id)).pop() || ms[0], true);
      // races : seule la race humaine est jouable dans l'aventure
      q('#adv-races').innerHTML = '<span class="rl">Votre race :</span>' + Object.keys(ZC.RACES).map(k => '<span class="race' + (k === ZC.ADVENTURE_RACE ? ' sel' : ' locked') + '" title="' + esc(ZC.RACES[k].desc) + '">' + (k === ZC.ADVENTURE_RACE ? '✓ ' : '🔒 ') + esc(ZC.RACES[k].name) + '</span>').join('');
      q('#adv-stats').textContent = '· Monde ' + (wi + 1) + ' : ' + wp.earned + ' / ' + wp.total + ' ★ · Total : ' + c.data.earned + ' / ' + c.totalPoints() + ' ★';
      this.m.campaign.classList.remove('hidden');
    }

    // Planète du monde en fond de l'écran d'aventure, redessinée quand la fenêtre change de taille
    drawAdvPlanet(w) {
      const cv = this.menus.querySelector('#adv-planet'), W = window.innerWidth, H = window.innerHeight;
      const key = w.id + ':' + W + 'x' + H;
      if (cv.dataset.key === key) return;
      cv.dataset.key = key;
      ZC.drawPlanetBackground(cv, w, W, H);
      if (!this._advResize) { this._advResize = true; window.addEventListener('resize', () => { if (!this.m.campaign.classList.contains('hidden')) this.drawAdvPlanet(this.app.campaign.world(this.app.campaign.data.world)); }); }
    }

    // Aperçu de la carte d'une mission (SVG) : grille de zones, départ du joueur, ennemis, alliés, vagues
    missionPreview(m, w) {
      const st = m.settings, zx = st.mapZones, zy = st.mapZonesY || zx, pal = ZC.TILESET_PALETTES[st.tileset] || ZC.TILESET_PALETTES.jungle;
      const cell = Math.min(100 / zx, 60 / zy), ox = (100 - zx * cell) / 2, oy = (60 - zy * cell) / 2;
      const rect = (x, y, fill, extra) => '<rect x="' + (ox + x * cell + 0.6).toFixed(1) + '" y="' + (oy + y * cell + 0.6).toFixed(1) + '" width="' + (cell - 1.2).toFixed(1) + '" height="' + (cell - 1.2).toFixed(1) + '" fill="' + fill + '"' + (extra || '') + '/>';
      let s = '<svg class="mc-map" viewBox="0 0 100 60">';
      for (let y = 0; y < zy; y++) for (let x = 0; x < zx; x++) s += rect(x, y, pal.mini);
      const cx = Math.floor(zx / 2), cy = Math.floor(zy / 2);
      if (zx * zy > 1 && zx % 2 && zy % 2) s += rect(cx, cy, 'rgba(255,208,64,0.55)');  // zone centrale (x2)
      const me = st.humanStart === 'center' ? [cx, cy] : [0, zy - 1];
      if (st.extraZones) { // zones d'avance : bloc compact autour du départ (même ordre que le jeu)
        const ring = [];
        for (let y = 0; y < zy; y++) for (let x = 0; x < zx; x++) if (x !== me[0] || y !== me[1]) ring.push([x, y]);
        ring.sort((a, b) => Math.max(Math.abs(a[0] - me[0]), Math.abs(a[1] - me[1])) - Math.max(Math.abs(b[0] - me[0]), Math.abs(b[1] - me[1])) || (Math.abs(a[0] - me[0]) + Math.abs(a[1] - me[1])) - (Math.abs(b[0] - me[0]) + Math.abs(b[1] - me[1])));
        for (const [x, y] of ring.slice(0, st.extraZones)) s += rect(x, y, 'rgba(90,154,216,0.55)');
      }
      s += rect(me[0], me[1], '#5a9ad8');  // le joueur en bleu
      const allies = st.teams ? st.teams.filter(t => t === 0).length - 1 : 0, enemies = st.aiCount - allies;
      const corners = [[zx - 1, 0], [zx - 1, zy - 1], [0, 0], [cx, 0], [cx, zy - 1], [0, cy], [zx - 1, cy]].filter(p => !(p[0] === me[0] && p[1] === me[1]));
      for (let i = 0; i < allies && corners.length; i++) s += rect(...corners.shift(), '#ffd040');
      for (let i = 0; i < enemies && corners.length; i++) s += rect(...corners.shift(), '#ff5050');
      if (st.invasion) s += '<path d="M3 30 L10 26 L10 34 Z M97 30 L90 26 L90 34 Z M50 3 L46 10 L54 10 Z M50 57 L46 50 L54 50 Z" fill="#ff5050"/>';
      return s + '</svg>';
    }

    // Panneau d'infos sous les cases : briefing, objectif, carte, points par difficulté et bouton de lancement
    renderAdvInfo(m, w) {
      const c = this.app.campaign, q = (s) => this.menus.querySelector(s), unlocked = c.unlocked(m.id);
      const o = m.objective, st = m.settings, allies = st.teams ? st.teams.filter(t => t === 0).length - 1 : 0, enemies = st.aiCount - allies;
      const obj = ZC.objectiveText(o);
      const diffs = ['easy', 'medium', 'hard'].map(d => '<span class="ai-diff' + (c.done(m.id, d) ? ' on' : '') + '"><span class="pip ' + d + (c.done(m.id, d) ? ' on' : '') + '"></span>' + ZC.DIFFICULTIES[d].label + ' · ' + m.points[d] + ' ★' + (c.done(m.id, d) ? ' ✓' : '') + '</span>').join('');
      q('#adv-info').innerHTML = '<div class="ai-head"><span class="ai-title" style="color:' + w.color + '">Mission ' + (m.index + 1) + ' — ' + esc(m.name) + '</span>' +
        (unlocked ? '<button id="adv-play">Jouer la mission ▸</button>' : '<span class="ai-lock">🔒 Terminez la mission précédente</span>') + '</div>' +
        '<div class="ai-brief">' + esc(m.brief) + '</div>' +
        '<div class="ai-meta">Objectif : ' + obj + ' · Carte ' + st.mapZones + 'x' + (st.mapZonesY || st.mapZones) + ' · ' + (st.invasion ? 'vagues d\'envahisseurs' : enemies + ' IA ennemie' + (enemies > 1 ? 's' : '')) + (allies ? ' + ' + allies + ' allié' + (allies > 1 ? 's' : '') : '') + ' · Points restants : ' + c.remaining(m.id) + ' / ' + (m.points.easy + m.points.medium + m.points.hard) + '</div>' +
        '<div class="ai-diffs">' + diffs + '</div>';
      const b = q('#adv-play'); if (b) b.addEventListener('click', () => this.showMission(m.id));
    }

    showMission(id) {
      this.hideMenus();
      const c = this.app.campaign, m = c.mission(id), q = (s) => this.menus.querySelector(s);
      this.mis = { id, diff: c.done(id, 'easy') ? (c.done(id, 'medium') ? 'hard' : 'medium') : 'easy', lines: c.dialogue(id), i: 0 };
      const w = c.world(m.world);
      q('#mis-title').textContent = 'MONDE ' + (ZC.WORLDS.indexOf(w) + 1) + ' · MISSION ' + (m.index + 1) + ' — ' + m.name.toUpperCase();
      q('#mis-brief').textContent = m.brief;
      const o = m.objective;
      const st = m.settings, allies = st.teams ? st.teams.filter(t => t === 0).length - 1 : 0;
      q('#mis-obj').textContent = 'Objectif : ' + ZC.objectiveText(o) + ' · Carte ' + st.mapZones + 'x' + (st.mapZonesY || st.mapZones) + ' · ' + (st.aiCount - allies) + ' IA ennemie' + (st.aiCount - allies > 1 ? 's' : '') + (allies ? ' + ' + allies + ' allié' + (allies > 1 ? 's' : '') : '') + ' (une ennemie de plus en difficile)' + (st.mode === 'evolution' ? ' · mode évolution' : st.mode === 'rounds' ? ' · tournoi' : '') + (st.humanStart === 'center' ? ' · départ au centre' : '') + (st.extraZones ? ' · ' + st.extraZones + ' zones d\'avance' : '');
      q('#mis-sheet').classList.add('hidden'); q('#mis-dialog').classList.remove('hidden');
      this.m.mission.classList.remove('hidden');
      this.dialogShow();
    }
    dialogShow() {
      const q = (s) => this.menus.querySelector(s), [who, line] = this.mis.lines[this.mis.i], ch = ZC.CHARACTERS[who];
      const cv = q('#mis-portrait'); ZC.drawCharPortrait(cv.getContext('2d'), ch.portrait, cv.width, ch.tint);
      q('#dlg-name').textContent = ch.name; q('#dlg-name').style.color = ch.color; q('#dlg-role').textContent = ch.role; q('#dlg-line').textContent = (ch.side === 'enemy' ? '« ' + line + ' »' : line);
      // Camp bien visible : les nôtres en bleu à gauche, l'ennemi en rouge à droite
      const side = ch.side || 'ally', dlg = q('#mis-dialog');
      dlg.classList.remove('ally', 'hero', 'enemy'); dlg.classList.add(side);
      q('#dlg-side').textContent = side === 'enemy' ? '☠ ENNEMI' : side === 'hero' ? '★ VOTRE HÉROS' : '✚ ALLIÉ';
      q('#dlg-next').textContent = this.mis.i < this.mis.lines.length - 1 ? 'Suivant ▸' : 'Briefing ▸';
    }
    dialogNext() { this.mis.i++; if (this.mis.i >= this.mis.lines.length) this.dialogEnd(); else this.dialogShow(); }
    dialogEnd() {
      const q = (s) => this.menus.querySelector(s);
      q('#mis-dialog').classList.add('hidden'); q('#mis-sheet').classList.remove('hidden');
      this.renderMissionSheet();
    }
    renderMissionSheet() {
      const c = this.app.campaign, m = c.mission(this.mis.id), q = (s) => this.menus.querySelector(s);
      q('#mis-diffs').innerHTML = ['easy', 'medium', 'hard'].map(d => {
        const done = c.done(m.id, d), D = ZC.DIFFICULTIES[d];
        return '<button class="diff ' + d + (this.mis.diff === d ? ' sel' : '') + (done ? ' done' : '') + '" data-d="' + d + '"' + (done ? ' title="Difficulté réussie : les points sont déjà encaissés"' : '') + '>' + (done ? '<span class="ribbon">RÉUSSI</span><span class="check">✓</span>' : '') + '<b>' + D.label + '</b><span class="pts">' + (done ? m.points[d] + ' points encaissés' : '★ ' + m.points[d] + ' points') + '</span><small>' + D.desc + '</small></button>';
      }).join('');
      q('#mis-diffs').querySelectorAll('.diff').forEach(b => b.addEventListener('click', () => { this.mis.diff = b.dataset.d; this.renderMissionSheet(); }));
      q('#mis-heroes').innerHTML = this.heroCards(false);
      q('#mis-heroes').querySelectorAll('.hero').forEach(h => h.addEventListener('click', () => { c.selectHero(h.dataset.id); this.renderMissionSheet(); }));
      this.drawHeroPortraits(q('#mis-heroes'));
    }
    heroCards(big) {
      const c = this.app.campaign;
      return Object.values(ZC.HEROES).map(h => {
        const st = c.hero(h.id), def = ZC.UNITS[h.unit], sc = ZC.heroScale(st.level);
        const next = st.level >= ZC.HERO_MAX_LEVEL ? null : ZC.heroXpFor(st.level + 1), prev = ZC.heroXpFor(st.level);
        const pct = next ? Math.round((st.xp - prev) / (next - prev) * 100) : 100;
        return '<div class="hero' + (c.data.hero === h.id ? ' sel' : '') + '" data-id="' + h.id + '"><canvas class="hp-cv" data-p="' + h.id + '" width="64" height="64"></canvas><div class="hero-txt"><div class="hn">' + esc(h.name) + ' <small>' + esc(h.title) + '</small></div>' +
          '<div class="hl">Niveau ' + st.level + (next ? ' · ' + Math.floor(st.xp) + ' / ' + next + ' XP' : ' (max)') + '</div><div class="xpbar"><span style="width:' + pct + '%"></span></div>' +
          (big ? '<div class="hs">' + Math.round(def.hp * sc.hp) + ' PV · ' + Math.round(def.dmg * sc.dmg) + (def.hits > 1 ? ' x' + def.hits : '') + ' dégâts · armure ' + (def.armor + sc.armor) + ' · portée ' + (def.range / ZC.TILE) + '</div><div class="hd">' + esc(h.desc) + '</div>' : '') +
          '<div class="hsel">' + (c.data.hero === h.id ? '✓ Sélectionné' : 'Choisir') + '</div></div></div>';
      }).join('');
    }
    drawHeroPortraits(root) {
      root.querySelectorAll('canvas.hp-cv').forEach(cv => { const ch = ZC.CHARACTERS[cv.dataset.p]; ZC.drawCharPortrait(cv.getContext('2d'), ch.portrait, cv.width, ch.tint); });
    }
    showShop() {
      this.hideMenus();
      const c = this.app.campaign, q = (s) => this.menus.querySelector(s);
      q('#shop-points').textContent = String(c.points);
      q('#shop-list').innerHTML = ZC.SHOP.map(u => {
        const lvl = c.level(u.id), cost = c.cost(u.id);
        const pips = Array.from({ length: u.max }, (_, i) => '<span class="pip' + (i < lvl ? ' on' : '') + '"></span>').join('');
        return '<div class="shop-row"><div class="ico">' + u.icon + '</div><div class="st"><div class="sn">' + esc(u.name) + ' <span class="pips">' + pips + '</span></div><div class="sd">' + esc(u.desc) + '</div></div>' +
          '<button class="buy" data-id="' + u.id + '"' + (cost < 0 || cost > c.points ? ' disabled' : '') + '>' + (cost < 0 ? 'Max' : '★ ' + cost) + '</button></div>';
      }).join('');
      q('#shop-list').querySelectorAll('.buy').forEach(b => b.addEventListener('click', () => { if (c.buy(b.dataset.id)) { ZC.Audio.play('upgrade', 0); this.showShop(); } else ZC.Audio.play('error', 0); }));
      this.m.shop.classList.remove('hidden');
    }
    showHeroes() {
      this.hideMenus();
      const c = this.app.campaign, q = (s) => this.menus.querySelector(s);
      q('#hero-list').innerHTML = this.heroCards(true);
      q('#hero-list').querySelectorAll('.hero').forEach(h => h.addEventListener('click', () => { c.selectHero(h.dataset.id); ZC.Audio.play('select', 0); this.showHeroes(); }));
      this.drawHeroPortraits(q('#hero-list'));
      this.m.heroes.classList.remove('hidden');
    }

    // Écran d'accueil (par-dessus la démo IA contre IA)
    showTitle(note) {
      this.hideMenus();
      const s = this.app.settings;
      this.menus.querySelector('#t-zones').textContent = String(s.mapZones * s.mapZones);
      this.menus.querySelector('#title-note').textContent = note || '';
      this.menus.querySelector('#menu-title').classList.remove('hidden');
    }

    showEnd(victory, final, res) {
      this.hideMenus();
      const g = this.app.game;
      const ec = this.menus.querySelector('#end-campaign');
      ec.classList.toggle('hidden', !res);
      this.menus.querySelector('#btn-campaign').style.display = res ? 'inline-block' : 'none';
      if (res) {
        const h = ZC.HEROES[res.heroId], D = ZC.DIFFICULTIES[g.settings.campaign.difficulty];
        let html = '<div class="cr-main">' + (res.victory ? (res.firstTime ? 'Mission accomplie en ' + D.label + ' : <b class="gold">+' + res.points + ' ★</b>' : 'Mission accomplie en ' + D.label + ' — déjà réussie à cette difficulté, aucun point supplémentaire.') : 'Mission échouée : aucun point. Réessayez, ou tentez une difficulté plus basse.') + '</div>';
        html += '<div class="cr-hero">' + esc(h.name) + ' : +' + res.xp + ' XP' + (res.levelAfter > res.levelBefore ? ' · <b class="gold">niveau ' + res.levelBefore + ' → ' + res.levelAfter + '</b>' : ' (niveau ' + res.levelAfter + ')') + ' · Points disponibles : ★ ' + this.app.campaign.points + '</div>';
        if (res.outro) html += '<div class="cr-outro">« ' + esc(res.outro) + ' »</div>';
        if (res.worldDone) html += '<div class="cr-main gold">Monde conquis ! Le monde suivant est débloqué sur la carte de l\'aventure.</div>';
        ec.innerHTML = html;
      }
      const title = this.menus.querySelector('#end-title');
      title.textContent = victory ? 'VICTOIRE' : (final ? 'PARTIE TERMINÉE' : 'DÉFAITE');
      title.className = victory ? 'victory' : 'defeat';
      const w = g.winner >= 0 ? g.players[g.winner] : null;
      const tour = g.isTournament;
      let sub;
      if (tour) {
        const score = g.standings().map(p => p.name + ' ' + p.roundsWon).join(' · ');
        sub = (victory ? 'Vous remportez le tournoi' : w ? w.name + ' remporte le tournoi' : 'Tournoi terminé') + ' en ' + (g.roundIndex + 1) + ' rounds après ' + ZC.formatTime(g.time) + ' (' + score + ').';
      } else {
        sub = victory ? 'Vous contrôlez la carte après ' + ZC.formatTime(g.time) + '.' :
          final && w ? w.name + ' remporte la partie après ' + ZC.formatTime(g.time) + '.' : 'Vous avez été éliminé après ' + ZC.formatTime(g.time) + '.';
      }
      this.menus.querySelector('#end-sub').textContent = sub;
      const rows = tour ? g.standings() : g.players.slice().sort((a, b) => (b.alive - a.alive) || b.zones - a.zones || b.eliminatedAt - a.eliminatedAt);
      this.menus.querySelector('#end-stats').innerHTML = '<tr><th>Joueur</th>' + (tour ? '<th>Rounds gagnés</th>' : '') + '<th>Zones</th><th>Bunkers construits</th><th>Kills</th><th>Pertes</th><th>Minerais gagnés</th><th>Statut</th></tr>' +
        rows.map(p => '<tr style="color:' + p.hex + '"><td>' + esc(p.name) + '</td>' + (tour ? '<td>' + p.roundsWon + '</td>' : '') + '<td>' + p.zones + '</td><td>' + p.captures + '</td><td>' + p.kills + '</td><td>' + p.losses + '</td><td>' + Math.floor(p.mineralsEarned) + '</td><td>' + (p.alive ? 'En vie' : 'Éliminé à ' + ZC.formatTime(p.eliminatedAt)) + '</td></tr>').join('');
      this.menus.querySelector('#btn-observe').style.display = final ? 'none' : 'inline-block';
      this.m.end.classList.remove('hidden');
    }
  }
  ZC.UI = UI;
})(window.ZC);
