// ============================================================
//  ui.js — Interface : barre du haut, console SC1, menus
// ============================================================
(function (ZC) {
  'use strict';

  const CONSOLE_H = 200;

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
    // bombe à mèche allumée (démolition : dégâts contre les bâtiments)
    siege: svg('<circle cx="10" cy="14.5" r="6.5"/><path d="M13.5 9l2-2.5"/><path d="M15.5 6.5c1.5-1 3 0 2.5 2"/><path style="color:#ffd040" d="M19.5 4.5l1.5-1.5M20.5 7.5h2M18 2.5V1"/>', '#ff8a5a'),
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
  // Icônes des pouvoirs de héros (par famille d'effet, voir ZC.POWERS[id].icon)
  const PICONS = {
    stim: ICONS.stim,
    gas: svg('<path d="M7 17a4 4 0 0 1 0-8 5 5 0 0 1 9.5-1A4 4 0 0 1 17 17H7z"/><path d="M9 20v1M13 20v2M17 20v1"/>', '#b8e060'),
    heal: svg('<path d="M12 4v16M4 12h16"/>', '#7dff5a'),
    shield: svg('<path d="' + SHIELD + '"/>', '#5ab8ff'),
    blast: svg('<path d="M12 3l2 5 5-2-2 5 5 2-5 2 2 5-5-2-2 5-2-5-5 2 2-5-5-2 5-2-2-5 5 2z"/>', '#ff8a3a'),
    dash: svg('<path d="M3 12h12M10 6l6 6-6 6"/><path d="M19 5v14"/>', '#ffd040'),
    swarm: svg('<circle cx="7" cy="8" r="2.5"/><circle cx="15" cy="6" r="2.5"/><circle cx="10" cy="16" r="2.5"/><circle cx="18" cy="15" r="2.5"/>', '#ff8a6a'),
    roar: svg('<path d="M8 9a5 5 0 0 0 0 6M5 6a9 9 0 0 0 0 12M16 9a5 5 0 0 1 0 6M19 6a9 9 0 0 1 0 12"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>', '#ff8a6a'),
    poison: svg('<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/>', '#7dff5a'),
    stun: svg('<path d="M12 3l1.8 5.2H19l-4.3 3.2 1.7 5.3L12 13.5l-4.4 3.2 1.7-5.3L5 8.2h5.2z"/>', '#ffd040'),
    nova: svg('<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>', '#c8a0ff'),
    blades: svg('<path d="M5 19L19 5M5 5l14 14"/><path d="M4 10l2 2M10 4l2 2M18 14l2 2M14 18l2 2"/>', '#fff0a0'),
    blink: svg('<path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/><path d="M19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z"/>', '#9ad0ff'),
    slow: svg('<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>', '#c8a0ff'),
    siege: ICONS.range,
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>', '#9ad0ff'),
    emp: svg('<path d="M13 2L5 14h6l-1 8 8-12h-6l1-8z"/>', '#9ad0ff'),
    wrench: ICONS.repair,
    tower: ICONS.tower,
  };
  const powerIcon = (pid) => PICONS[ZC.POWERS[pid].icon] || ICONS.hero;

  const HELP = `
    <div class="help-grid">
      <div><b>Clic gauche</b> sélection / glisser pour un cadre &nbsp; <b>Clic droit</b> déplacer / attaquer</div>
      <div><b>Dropship + clic droit</b> sur une zone libre : construire un bunker (ou <b>B</b> puis clic)</div>
      <div><b>Bunker sélectionné</b> : clic droit = point de ralliement ; <b>W</b> armes, <b>R</b> armure, <b>E</b> portée, <b>X</b> démolition (dégâts contre les bâtiments), <b>Q</b> centre de commandement (800 minerais, puis +400 à chaque centre)</div>
      <div><b>Héros</b> (un par joueur, trois au choix par race) : <b>A</b> sur un centre de commandement construit son annexe ; sélectionnez l'annexe pour développer ses deux pouvoirs (<b>T</b>, <b>Y</b>), puis lancez-les avec le héros sélectionné (<b>T</b>, <b>Y</b>, clic sur la cible au besoin)</div>
      <div><b>G</b> (bunker sélectionné) envoyer toutes ses troupes vers le point cliqué &nbsp; <b>N</b> bunker suivant</div>
      <div><b>Clic droit sur un bunker allié</b> : les unités sélectionnées entrent en garnison (4 max ; un bunker vide ne tire pas) &nbsp; <b>U</b> décharger &nbsp; <b>V</b> évolution (armes, armure et portée au niveau 3) : les soldats du bunker passent au niveau 2</div>
      <div><b>D</b> dropship (centre de commandement) &nbsp; <b>F</b> carte « Unités » du QG : <b>W</b> travailleur, <b>H</b> ressusciter le héros, <b>X</b> retour</div>
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

    consoleHeight() { return this.hud.style.display === 'none' ? 0 : Math.min(CONSOLE_H, Math.max(140, window.innerHeight * 0.25), window.innerHeight * 0.45); }

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
        <div id="console" style="height:min(${CONSOLE_H}px, max(140px, 25vh), 45vh)">
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
      // Annulation d'un élément de file au mousedown (pas au click : le panneau est redessiné 5 fois par seconde, le clic
      // se perdait quand l'icône était remplacée entre l'appui et le relâchement). Marche aussi pour l'élément en cours.
      this.el.info.addEventListener('mousedown', e => {
        const q = e.target.closest('.qi[data-q]'), g = this.app.game; if (!q) return;
        e.preventDefault(); e.stopPropagation();
        if (e.button !== 0 || !g) return;
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
    // disabled : true = pas assez de minerai (réactivé dès qu'on en a) ; 'lock' = indisponible quoi qu'il arrive (max atteint,
    // conditions non remplies...) : le bouton reste inactif jusqu'à ce que la carte soit redessinée
    cardButton(cmd, ico, key, label, cost, disabled, lvl) {
      if (this.lockAll) disabled = 'lock'; // bunker en chantier : tout est verrouillé
      let pips = '';
      if (lvl) {
        if (lvl.text) pips = '<span class="lv max">' + esc(lvl.text) + '</span>';
        else if (lvl.done >= lvl.max) pips = '<span class="lv max">MAX</span>';
        else { pips = '<span class="lv">'; for (let i = 0; i < lvl.max; i++) pips += '<i class="' + (i < lvl.done ? 'on' : i < lvl.done + lvl.queued ? 'q' : '') + '"></i>'; pips += '</span>'; }
      }
      return '<button data-cmd="' + cmd + '" class="' + (disabled ? 'disabled' : '') + '"' + (disabled === 'lock' ? ' data-lock="1"' : '') + ' title="' + esc(label) + (cost ? ' — ' + cost + ' minerais' : '') + '">' +
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
      const g = this.app.game, b = g.selectedBunker, me = g.human;
      if (!b) {
        const a = g.selectedAddon;
        if (a) return 'a' + a.id + ':' + a.research.map(r => r.what).join(',') + ':' + Object.keys(me.powers).join(',') + (a.building ? 'B' : '');
        const h = g.hero && !g.hero.dead && g.ownSelection.includes(g.hero) ? g.hero : null, H = h && ZC.HEROES[me.heroId];
        return 'n' + g.ownSelection.length + (H ? ':' + H.powers.map(pid => (me.powers[pid] ? '1' : '0') + Math.ceil(h.cd[pid] || 0)).join(',') : '');
      }
      return b.id + ':' + (b.building ? 'B' : '') + (b.addon && !b.addon.dead ? (b.addon.building ? 'ab' : 'a') : '') + Object.values(b.up).join('') + ':' + b.research.map(r => r.what[0]).join('') + ':' + b.queue.length + ':' + b.garrison.length + ':' + (g.hero ? (g.hero.dead ? 'd' : 'v') : '') + ':' + (g.workers(g.humanId).length + g.workersQueued(g.humanId));
    }
    // Un groupe de la carte : un titre et une grille 3 x 3 (les cases vides complètent la grille)
    cardGroup(title, buttons) {
      let html = buttons.join('');
      for (let i = buttons.length; i < 9; i++) html += '<button class="empty"></button>';
      return '<div class="cgrp"><div class="cgt">' + esc(title) + '</div><div class="cgrid">' + html + '</div></div>';
    }
    // Carte de commandes en deux groupes côte à côte : à gauche les ordres et la gestion des unités,
    // à droite les améliorations, les constructions ou les coups spéciaux (stimpack)
    buildCommandCard(kind) {
      const g = this.app.game, me = g.human;
      const cb = (...a) => this.cardButton(...a);
      const move = () => cb('move', '➜', 'M', 'Déplacer'), stop = () => cb('stop', '■', 'S', 'Stop'), hold = () => cb('hold', '⛨', 'H', 'Tenir la position');
      let groups;
      if (kind === 'units') {
        // Coups spéciaux : les deux pouvoirs du héros, s'il est dans la sélection (verrouillés tant qu'ils ne sont pas développés ou en recharge)
        const hero = g.hero && !g.hero.dead && g.ownSelection.includes(g.hero) ? g.hero : null, H = hero && ZC.HEROES[me.heroId];
        const spec = H ? H.powers.map((pid, i) => {
          const pw = ZC.POWERS[pid], dev = !!me.powers[pid], cd = hero.cd[pid] || 0;
          const how = pw.target === 'self' ? '' : ' : cliquez sur ' + (pw.target === 'structure' ? 'un bâtiment ennemi' : 'un point') + (pw.range ? ' à ' + (pw.range / ZC.TILE) + ' cases ou moins (le héros s\'approche sinon)' : '');
          const noFlux = dev && cd <= 0 && hero.flux < pw.flux;
          const label = pw.name + ' — ' + pw.desc + (dev ? (cd > 0 ? ' — recharge : ' + Math.ceil(cd) + ' s' : noFlux ? ' — PAS ASSEZ DE FLUX (' + Math.floor(hero.flux) + '/' + hero.fluxMax + ')' : ' — PRÊT' + how) + ' — ' + pw.flux + ' flux, recharge ' + Math.round(pw.cd * hero.build.powerCd) + ' s' : ' — À DÉVELOPPER dans l\'annexe d\'un centre de commandement (A sur le centre), ' + pw.cost + ' minerais');
          return cb('power' + (i + 1), powerIcon(pid), pw.key, label, 0, !dev || cd > 0 || noFlux ? 'lock' : false, dev ? (cd > 0 ? { text: Math.ceil(cd) + ' s' } : { text: pw.flux + ' ⚡' }) : { text: 'À DÉV.' });
        }) : [];
        groups = [['Ordres', [move(), stop(), cb('attack', '⚔', 'A', 'Attaquer'), cb('patrol', '↻', 'P', 'Patrouiller'), hold()]], ['Coups spéciaux' + (H ? ' · ' + H.name : ''), spec]];
      } else if (kind === 'workers') {
        const tw = ZC.UNITS[ZC.RACES[me.race].tower];
        groups = [['Ordres', [move(), stop(), hold(),
            cb('gather', '◆', 'G', 'Récolter : cliquez sur un gisement de minerai (' + ZC.MINERALS.carry + ' minerais par voyage)'),
            cb('repair', '🔧', 'R', 'Réparer : cliquez sur un bunker allié (' + ZC.REPAIR.hpPerSec + ' PV/s, coûte ' + ZC.REPAIR.costPerSec + ' minerais/s)')]],
          ['Constructions', [
            cb('extract', '⛏', 'B', ZC.RACES[me.race].extractor + ' : construire sur un gisement (' + ZC.EXTRACTOR.buildTime + ' s). Extrait ' + ZC.EXTRACTOR.rate + ' minerai/s directement dans votre banque, sans transport. Un seul par gisement', g.extractorCost(me.id), me.minerals < g.extractorCost(me.id)),
            cb('tower', '⌂', 'T', tw.name + ' : construire dans une de vos zones (' + ZC.TOWER.buildTime + ' s, ' + ZC.TOWER.perZone + ' par zone max). ' + (tw.manned ? 'Pas de robots chez les humains : la tour ne tire que si des soldats y montent (clic droit, ' + tw.capacity + ' places, portée +' + tw.rangeBonus + ' cases)' : 'Tourelle autonome'), g.towerCost(me.id), me.minerals < g.towerCost(me.id))]]];
      } else if (kind === 'tower') {
        const tw = g.selectedTower;
        groups = [['Garnison', tw.garrison.length ? [cb('unload', '⇩', 'U', 'Faire descendre la garnison (' + tw.garrison.length + ' unités)')] : []], ['', []]];
      } else if (kind === 'addon') { // annexe : développement des deux pouvoirs du héros
        const a = g.selectedAddon, H = ZC.HEROES[me.heroId];
        const btns = H ? H.powers.map(pid => {
          const pw = ZC.POWERS[pid], dev = !!me.powers[pid], q = a.research.some(r => r.what === pid);
          return cb(pid, powerIcon(pid), pw.key, pw.name + ' — ' + pw.desc + (dev ? ' — DÉVELOPPÉ' : q ? ' — en développement' : ' — développement ' + pw.time + ' s') + (a.building ? ' (annexe en construction)' : ''), dev || q ? 0 : pw.cost, dev || q || a.building ? 'lock' : me.minerals < pw.cost, { done: dev ? 1 : 0, queued: q ? 1 : 0, max: 1 });
        }) : [];
        groups = [['Pouvoirs' + (H ? ' de ' + H.name : ''), btns], ['', []]];
      } else if (kind === 'hqUnits') { // carte « Unités » du centre de commandement
        const wk = ZC.UNITS[ZC.RACES[me.race].worker], wc = g.workerCost(me.id), wn = g.workers(me.id).length + g.workersQueued(me.id), wmax = g.workerCap(me.id), cap = wn >= wmax;
        const prod = [cb('worker', '⚒', 'W', wk.name + ' (' + wn + '/' + wmax + ', ' + ZC.WORKER.perBunker + ' par bunker) : récolte le minerai des gisements et répare les bunkers — ' + Math.round(g.workerTime(me.id)) + ' s de production', wc, cap ? 'lock' : me.minerals < wc)];
        if (g.hero) {
          const h = g.hero, can = g.canReviveHero(me.id), hc = g.heroReviveCost(me.id);
          prod.push(cb('hero', '★', 'H', h.dead ? (g.heroQueued(me.id) ? h.def.name + ' : résurrection en cours' : 'Ressusciter ' + h.def.name + ' (niveau ' + h.heroLevel + ') — ' + Math.round(ZC.HERO_RESPAWN) + ' s') : h.def.name + ' est en vie', h.dead && can ? hc : 0, !can ? 'lock' : me.minerals < hc));
        }
        groups = [['Production', prod], ['Retour', [cb('back', '↩', 'X', 'Retour à la carte du centre de commandement')]]];
      } else if (kind === 'dropship') {
        groups = [['Ordres', [move(), stop()]], ['Constructions', [cb('build', '⌂', 'B', 'Construire un bunker sur une zone libre')]]];
      } else if (kind === 'bunker') {
        const b = g.selectedBunker, nb = g.selectedBunkers.length, multi = nb > 1 ? ' — ' + nb + ' bunkers sélectionnés' : '';
        this.lockAll = !!b.building;
        const up = (k, ico) => {
          const d = ZC.UPGRADES[k], lvl = g.pendingLevel(b, k), cost = g.upgradeCost(b, k);
          const maxed = cost < 0;
          return cb(k === 'stim' ? 'stimResearch' : k, ico, d.hotkey, d.name + (maxed ? ' (max)' : ' niveau ' + (lvl + 1) + ' — recherche ' + Math.round(d.time(lvl)) + ' s') + ' — ' + d.desc + ' (unités de ce bunker uniquement)' + multi, maxed ? 0 : cost, maxed ? 'lock' : me.minerals < cost, { done: b.up[k], queued: lvl - b.up[k], max: d.max });
        };
        const ev = ZC.UPGRADES.evolve, evCost = g.upgradeCost(b, 'evolve'), can = g.canEvolve(b), evLvl = g.pendingLevel(b, 'evolve');
        let nextT = g.spawnTypeFor(me); for (let i = 0; i <= evLvl && ZC.UNITS[nextT].evolvesTo; i++) nextT = ZC.UNITS[nextT].evolvesTo;
        const nxt = ZC.UNITS[nextT];
        const evolve = cb('evolve', '⬆', ev.hotkey, evCost < 0 ? 'Évolution terminée : ce bunker produit des ' + ZC.UNITS[g.bunkerSpawnType(b)].name + ' (niveau 3)' : 'Évolution niveau ' + (evLvl + 2) + ' (' + ev.time(evLvl) + ' s) : transforme les soldats de ce bunker (présents et futurs) en ' + nxt.name + (can ? '' : ' — INDISPONIBLE : armes, armure et portée doivent être au niveau ' + g.evolveRequires(b) + ' (terminées ou en file)'), evCost < 0 ? 0 : evCost, evCost < 0 || !can ? 'lock' : me.minerals < evCost, { done: b.up.evolve, queued: evLvl - b.up.evolve, max: ev.max });
        const upgrades = [up('weapons', '✦'), up('armor', '⛨'), up('range', '⟶'), up('siege', '💣'), evolve];
        if (b.def.hq) { // annexe : une par centre, où se développent les pouvoirs du héros
          const a = b.addon && !b.addon.dead ? b.addon : null, an = ZC.UNITS[ZC.RACES[me.race].addon].name, H = ZC.HEROES[me.heroId];
          upgrades.push(cb('addon', '⚗', 'A', an + (!H ? ' : inutile sans héros' : a ? (a.building ? ' : en construction' : ' : construite — sélectionnez-la pour développer les pouvoirs de ' + H.name) : ' (' + ZC.ADDON.buildTime + ' s) : annexe où se développent les deux pouvoirs de ' + H.name), a || !H ? 0 : ZC.ADDON.cost, a || !H ? 'lock' : me.minerals < ZC.ADDON.cost, { done: a && !a.building ? 1 : 0, queued: a && a.building ? 1 : 0, max: 1 }));
        }
        if (!b.def.hq) {
          const ft = ZC.UPGRADES.fortify, ftCost = g.upgradeCost(b, 'fortify');
          upgrades.push(cb('fortify', '⌂', ft.hotkey, ft.name + ' (' + ft.time() + ' s) : ' + ft.desc, ftCost < 0 ? 0 : ftCost, ftCost < 0 ? 'lock' : me.minerals < ftCost, { done: b.up.fortify, queued: g.pendingLevel(b, 'fortify') - b.up.fortify, max: 1 }));
        }
        const units = [];
        if (b.def.hq) {
          units.push(cb('dropship', '✈', 'D', 'Dropship : construit un bunker sur une zone libre (' + Math.round(g.dropshipBuildTime(me.id)) + ' s de production)', g.dropshipCost(me.id), me.minerals < g.dropshipCost(me.id)));
          units.push(cb('units', '⚒', 'F', 'Unités spéciales : travailleurs' + (g.campaign ? ' et résurrection du héros' : '')));
        }
        units.push(cb('send', '⇶', 'G', 'Envoyer les troupes : toutes les unités produites par ce bunker partent en attaque-déplacement vers le point cliqué'));
        if (b.garrison.length) units.push(cb('unload', '⇩', 'U', 'Décharger la garnison (' + b.garrison.length + ' unités)'));
        groups = [['Unités', units], ['Améliorations', upgrades]];
        this.lockAll = false;
      } else {
        groups = [['Production', me.hq ? [cb('dropship', '✈', 'D', 'Dropship (produit au centre de commandement)', g.dropshipCost(me.id), me.minerals < g.dropshipCost(me.id))] : []], ['', []]];
      }
      this.el.cmd.innerHTML = groups.map(([t, bs]) => this.cardGroup(t, bs)).join('');
      this.cardKind = kind;
      if (this.app.input) this.setActiveCommand(this.app.input.mode);
    }
    refreshCardAffordability() {
      const g = this.app.game, me = g.human;
      this.el.cmd.querySelectorAll('button[data-cmd]').forEach(b => {
        const costEl = b.querySelector('.cost');
        if (!costEl) return;
        const cost = +costEl.textContent;
        b.classList.toggle('disabled', b.dataset.lock === '1' || me.minerals < cost);
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
        this.el.workers.parentNode.title = 'Travailleurs : ' + wn + ' sur ' + wc + (wq ? ' (' + wq + ' en production)' : '') + ' — ' + ZC.WORKER.perBunker + ' par bunker';
        this.el.supply.parentNode.title = 'Supply : ' + Math.round(me.supply) + ' sur ' + cap + ' (' + s.supplyBase + ' + ' + s.supplyPerBunker + ' par bunker' + (s.unitCap > 0 ? ', max ' + s.unitCap : ', sans limite') + ')';
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
      if (g.selectedAddon) return 'addon';
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
        if (u.def.addon) extra = '<div class="line sub" id="u-kills"></div><div class="line sub">Annexe du centre de commandement : développez-y les deux pouvoirs de votre héros (T, Y). Elle tombe avec son centre.</div><div class="line build" id="u-research"></div>';
        else if (u.def.tower) extra = '<div class="line sub" id="u-kills"></div><div class="line sub">' + (u.def.manned ? 'Tour habitée : clic droit avec des soldats pour y monter (' + u.def.capacity + ' places, portée +' + u.def.rangeBonus + ' cases) · U faire descendre' : 'Tourelle autonome · portée ' + (u.def.range / ZC.TILE) + ' cases · dégâts ' + u.def.dmg) + '</div>';
        else if (u.def.extractor) extra = '<div class="line sub" id="u-kills"></div><div class="line sub">Extrait ' + ZC.EXTRACTOR.rate + ' minerai/s du gisement, directement dans votre banque</div>';
        else if (u.def.structure) extra = '<div class="line sub" id="u-extra"></div><div class="line sub" id="u-up"></div><div class="line build" id="u-build"></div><div class="line build" id="u-research"></div>' + '<div class="line sub">Clic droit : point de ralliement · ' + (u.def.hq ? 'D dropship · F unités (travailleurs' + (g.campaign ? ', héros' : '') + ') · ' : 'Q centre de commandement · ') + 'W/R/E/X améliorations · Q centre · A annexe (centre) · V évolution · G envoyer les troupes · U décharger la garnison</div>';
        else if (u.def.worker) extra = '<div class="line sub" id="u-kills"></div><div class="line sub">Clic droit sur un gisement vert : récolter (G) · clic droit sur un bunker allié abîmé : réparer (R, ' + ZC.REPAIR.costPerSec + ' minerais/s)</div>';
        else if (u.type === 'dropship') extra = '<div class="line sub">Clic droit sur une zone libre : construire un bunker (' + g.settings.landingTime + ' s d\'atterrissage, interrompu si un ennemi est dans la zone)</div>';
        else extra = '<div class="line sub">' + (u.def.level ? 'Niveau ' + u.def.level + ' · ' : '') + 'Dégâts ' + u.damage + (u.def.hits > 1 ? ' x' + u.def.hits : '') + ' (' + u.def.dtype + ') · Armure ' + u.armor + ' · Portée ' + (u.def.range ? (u.range / ZC.TILE) : 'mêlée') + (u.home && u.home.zone ? ' · Bunker ' + (u.home.zone.ix + 1) + '-' + (u.home.zone.iy + 1) : '') + '</div><div class="line sub" id="u-kills"></div>' + (u.canGarrison ? '<div class="line sub">Clic droit sur un bunker allié : entrer en garnison</div>' : '');
        info.innerHTML = `
          <div class="single">
            <div class="portrait-wrap"><canvas id="portrait" width="72" height="72"></canvas><div id="portrait-hp" class="pbar"></div></div>
            <div class="details${u.def.structure && !u.def.tower && !u.def.extractor && !u.def.addon ? ' building-details' : ''}">
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
        const p0 = g.players[u.owner];
        const k = info.querySelector('#u-kills'); if (k && u.building && u.buildTotal) k.textContent = 'En construction : ' + Math.round(Math.min(100, u.buildT / u.buildTotal * 100)) + ' % · ' + Math.ceil(u.buildTotal - u.buildT) + ' s · ne produit pas et ne tire pas encore';
        else if (k && u.def.addon) { const H = ZC.HEROES[p0.heroId]; k.textContent = H ? 'Pouvoirs de ' + H.name + ' : ' + H.powers.map(pid => ZC.POWERS[pid].name + (p0.powers[pid] ? ' ✓' : u.research.some(r => r.what === pid) ? ' (en cours)' : ' (à développer)')).join(' · ') : 'Aucun héros'; }
        else if (k && u.def.tower) k.textContent = u.building ? 'En construction : ' + Math.round(Math.min(100, u.buildT / ZC.TOWER.buildTime * 100)) + ' %' : (u.def.manned ? 'Garnison ' + u.garrison.length + '/' + u.def.capacity + (u.garrison.length ? '' : ' (ne tire pas)') : 'En veille') + ' · Kills : ' + u.kills;
        else if (k && u.def.extractor) k.textContent = u.building ? 'En construction : ' + Math.round(Math.min(100, u.buildT / ZC.EXTRACTOR.buildTime * 100)) + ' %' : u.patch && u.patch.amount > 0 ? 'En activité · gisement : ' + Math.round(u.patch.amount) : 'Gisement épuisé';
        else if (k && u.def.worker) k.textContent = (u.order.type === 'gather' ? (u.slot ? 'Récolte en cours' : u.carry >= ZC.MINERALS.carry ? 'Rapporte ' + u.carry + ' minerais' : 'En route vers le gisement') : u.order.type === 'repair' ? 'Réparation' + (u.repairing ? ' en cours (' + ZC.REPAIR.costPerSec + ' minerais/s)' : '') : 'Inactif') + (u.carry > 0 && u.order.type !== 'gather' ? ' · transporte ' + u.carry + ' minerais' : '');
        else if (k) k.textContent = (u.def.hero ? 'Héros · Niveau ' + u.heroLevel + ' · ' + Math.floor(u.xp) + ' / ' + ZC.heroXpFor(u.heroLevel + 1) + ' XP · Flux ' + Math.floor(u.flux) + '/' + u.fluxMax + ' · ' : '') + 'Kills : ' + u.kills + (u.stimT > 0 ? ' · Stimulé (' + Math.ceil(u.stimT) + ' s)' : '');
        const ex = info.querySelector('#u-extra');
        const tile = (label, value, color = '#80d8ff') => '<div class="status-tile" style="--accent:' + color + '"><span>' + label + '</span><strong>' + value + '</strong></div>';
        if (ex && u.zone) ex.innerHTML =
          (u.def.hq ? tile('Travailleurs', g.workers(u.owner).length + '<small> / ' + g.workerCap(u.owner) + '</small>', '#ffd166') : '') +
          tile('Garnison', u.garrison.length + '<small> / ' + ZC.capacity(u) + '</small>') +
          tile('Troupes', g.bunkerTroops(u).length) +
          tile('Vague dans', Math.ceil(g.spawnTimer) + '<small> s</small>', '#8ce6b1') +
          (u.zone.minerals ? tile('Gisement', Math.round(u.zone.minerals.amount), '#8ce6b1') : '');
        const upl = info.querySelector('#u-up');
        if (upl) upl.textContent = (u.building && u.buildTotal ? 'Construction ' + Math.round(u.buildT / u.buildTotal * 100) + '% · ' : '') +
          'Zone ' + (u.zone.ix + 1) + '-' + (u.zone.iy + 1) + ' · Armure ' + u.armor + ' · Armes +' + u.up.weapons + ' · Blindage +' + u.up.armor + ' · Portée +' + u.up.range +
          (u.up.siege ? ' · Démolition +' + u.up.siege : '') + (g.groupKeysOf(u) ? ' · Groupe ' + g.groupKeysOf(u) : '') + (u.rally ? ' · Ralliement ✓' : '');
        // Files d'attente en icônes : le premier élément porte sa barre de progression, les suivants attendent
        const qIcon = (cmd, key, pct, title, gold, kind, i) => '<span class="qi' + (pct !== undefined ? ' cur' : '') + '" data-q="' + kind + '" data-i="' + i + '" title="' + esc(title) + ' — clic : annuler (même en cours) et rembourser">' + (ICONS[cmd] || '') + '<i>' + key + '</i>' + (pct !== undefined ? '<b class="' + (gold ? 'gold' : '') + '" style="width:' + pct.toFixed(0) + '%"></b>' : '') + '</span>';
        const rd = info.querySelector('#u-research');
        if (rd && u.def.structure) {
          if (u.research.length) {
            const r0 = u.research[0], lvls = {};
            rd.innerHTML = '<span class="k">Recherche</span> ' + u.research.map((r, i) => {
              const pw = ZC.POWERS[r.what], d = pw || ZC.UPGRADES[r.what]; if (!pw) lvls[r.what] = (lvls[r.what] || u.up[r.what]) + 1;
              const ico = pw ? '<span class="qi' + (i === 0 ? ' cur' : '') + '" data-q="research" data-i="' + i + '" title="' + esc(d.name + (i === 0 ? ' · ' + Math.ceil(r.total - r.t) + ' s' : ' · en attente') + ' — clic : annuler et rembourser') + '">' + powerIcon(r.what) + '<i>' + pw.key + '</i>' + (i === 0 ? '<b class="gold" style="width:' + Math.min(100, r.t / r.total * 100).toFixed(0) + '%"></b>' : '') + '</span>' : null;
              return ico || qIcon(r.what, d.hotkey, i === 0 ? Math.min(100, r.t / r.total * 100) : undefined, d.name + ' niveau ' + lvls[r.what] + (i === 0 ? ' · ' + Math.ceil(r.total - r.t) + ' s' : ' · en attente'), true, 'research', i);
            }).join('') + ' <span class="bt">' + (ZC.POWERS[r0.what] ? ZC.POWERS[r0.what].name : ZC.UPGRADES[r0.what].name + ' +' + (u.up[r0.what] + 1)) + ' · ' + Math.ceil(r0.total - r0.t) + ' s' + (u.research.length > 1 ? ' · ' + (u.research.length - 1) + ' en attente' : '') + '</span>';
          } else rd.innerHTML = '<span class="k">Recherche</span> <span class="bt">aucune en cours</span>';
        }
        const bd = info.querySelector('#u-build');
        if (bd && u.def.structure) {
          if (u.queue.length) {
            const q0 = u.queue[0], nom = w => w === 'worker' ? ZC.UNITS[ZC.RACES[g.players[u.owner].race].worker].name : w === 'hero' ? 'Héros' : 'Dropship';
            bd.innerHTML = '<span class="k">Production</span> ' + u.queue.map((q, i) => qIcon(q.what, q.what === 'worker' ? 'W' : q.what === 'hero' ? 'H' : 'D', i === 0 ? Math.min(100, q.t / q.total * 100) : undefined, nom(q.what) + (i === 0 ? ' · ' + Math.ceil(q.total - q.t) + ' s' : ' · en attente'), false, 'queue', i)).join('') + ' <span class="bt">' + nom(q0.what) + ' · ' + Math.ceil(q0.total - q0.t) + ' s' + (u.queue.length > 1 ? ' · ' + (u.queue.length - 1) + ' en attente' : '') + '</span>';
          } else bd.innerHTML = '<span class="k">Production</span> <span class="bt">' + (u.def.hq ? 'aucune · dropship : ' + Math.round(g.dropshipBuildTime(u.owner)) + ' s · ' : '') + 'vague : ' + ZC.UNITS[g.bunkerSpawnType(u)].name + (u.up.evolve ? ' (niveau ' + (1 + u.up.evolve) + ')' : '') + (ZC.RACES[g.players[u.owner].race].auto ? ' · tourelle intégrée (' + (ZC.RACES[g.players[u.owner].race].auto.dmg + u.up.weapons) + ' x2, portée ' + ((ZC.RACES[g.players[u.owner].race].auto.range + u.up.range * ZC.TILE) / ZC.TILE) + ') · pas de garnison, 1 vague sur 4 sans production' : '') + '</span>';
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
            <div class="card simple"><div class="card-art"><canvas data-art="simple" width="760" height="272"></canvas><h3>Partie simple</h3></div><p>Une partie avec vos réglages actuels : mode, carte, nombre d'IA, difficulté...</p><button id="btn-simple" class="big">Lancer une partie</button></div>
            <div class="card adventure"><div class="card-art"><canvas data-art="adventure" width="760" height="272"></canvas><h3>Aventure</h3></div><p>Quatre mondes à conquérir, un par race, ${ZC.SCENARIOS.length} missions chacun et trois difficultés par mission. Des points à dépenser dans la boutique et trois héros qui montent de niveau. L'aventure se joue avec les humains.</p><button id="btn-adventure" class="big">Entrer dans l'aventure</button></div>
          </div>
          <div class="btns"><button id="btn-play-back">Retour</button></div>
        </div>
        <div id="menu-campaign" class="screen hidden">
          <canvas id="adv-planet"></canvas>
          <div class="adv-top">
            <div class="adv-title" id="adv-title">MONDE 1</div>
            <div class="adv-counters"><div class="adv-counter available"><span class="counter-label">★ Points disponibles</span><strong id="adv-points">0</strong><span class="counter-note">À dépenser en boutique</span></div><div id="adv-stats"></div></div>
            <div class="adv-btns"><button id="btn-shop">Boutique</button><button id="btn-heroes">Héros</button><button id="btn-adv-reset" class="danger" title="Efface toute la progression de l'aventure : missions, points, boutique, héros">Effacer la partie</button><button id="btn-adv-back">Retour</button></div>
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
        <div id="menu-sheet" class="menu sheet-menu hidden">
          <h1>FICHE DU HÉROS</h1>
          <div class="sheet">
            <div class="sh-col sh-doll">
              <div class="sh-head"><canvas id="sh-portrait" width="64" height="64"></canvas><div class="sh-headtxt"><div class="sh-name" id="sh-name"></div><div class="sh-lvl" id="sh-lvl"></div><div class="xpbar big"><span id="sh-xpfill"></span></div><div class="sh-xp" id="sh-xp"></div></div></div>
              <div class="doll" id="sh-doll"><canvas id="sh-figure" width="162" height="190"></canvas></div>
              <div class="sh-hint">Cliquez sur un emplacement pour voir l'objet porté, sur un objet de la banque pour l'équiper.</div>
            </div>
            <div class="sh-col sh-stats">
              <h3>Caractéristiques <span id="sh-unspent" class="gold"></span></h3>
              <div id="sh-statrows"></div>
              <h3>Au combat</h3>
              <div id="sh-derived" class="derived"></div>
            </div>
            <div class="sh-col sh-bank">
              <div class="sh-tabs"><button class="tab on" data-tab="bank">Banque</button><button class="tab" data-tab="shop">Boutique d'équipement</button><span class="credits" title="Crédits : gagnés à chaque mission (un quart en cas de défaite), dépensés dans la boutique d'équipement">₢ <b id="sh-credits">0</b></span></div>
              <div id="sh-items" class="items"></div>
              <div id="sh-detail" class="idetail"></div>
            </div>
          </div>
          <div class="btns"><button id="btn-sheet-back">Retour aux héros</button></div>
        </div>
        <div id="menu-start" class="menu hidden">
          <h1>OPTIONS</h1>
          <p class="tag">Chaque zone a un bunker en son centre : qui tient le bunker tient la zone, et chaque bunker produit des marines à chaque vague.<br>
          Votre centre de commandement est le seul à produire des dropships, qui construisent des bunkers sur les zones libres. Détruire un bunker ennemi libère sa zone.<br>
          Chaque bunker a ses propres améliorations (armes, armure, portée, démolition), qui ne s'appliquent qu'aux marines qu'il produit. Gagnez des minerais par les zones et les kills.<br>
          Chaque joueur a un héros (trois au choix par race) aux deux pouvoirs uniques, à développer dans l'annexe d'un centre de commandement.<br>
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
      this.m = { title: q('#menu-title'), play: q('#menu-play'), campaign: q('#menu-campaign'), mission: q('#menu-mission'), shop: q('#menu-shop'), heroes: q('#menu-heroes'), sheet: q('#menu-sheet'), start: q('#menu-start'), pause: q('#menu-pause'), end: q('#menu-end') };
      q('#btn-sheet-back').addEventListener('click', () => this.showHeroes());
      q('#menu-sheet .sh-tabs').addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (!b) return; this.sheet.tab = b.dataset.tab; this.sheet.sel = null; this.renderSheet(); });
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
      q('#btn-adv-reset').addEventListener('click', () => {
        const c = this.app.campaign, n = Object.keys(c.data.missions || {}).filter(id => Object.values(c.data.missions[id] || {}).some(Boolean)).length;
        if (!confirm('Effacer votre partie d\'aventure ?\n\n' + (n ? n + ' mission' + (n > 1 ? 's' : '') + ' réussie' + (n > 1 ? 's' : '') + ', ' : '') + c.data.points + ' points, améliorations de la boutique et niveaux des héros : tout repart à zéro.\n\nCette action est définitive.')) { ZC.Audio.play('error', 0); return; }
        c.reset(); ZC.Audio.play('lost', 0); this.showCampaign();
      });
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
      this.bindMenuSounds();
    }

    // Sons de l'interface des menus : tic au survol, clic sur les boutons et cartes (sauf si l'action vient déjà
    // de jouer un son : navigation, refus, achat...). Délégué au conteneur : les listes régénérées en profitent.
    bindMenuSounds() {
      const SEL = 'button, .mcard, .card, .hero, .world, .sw-lbl';
      const A = ZC.Audio;
      let hovered = null;
      this.menus.addEventListener('mouseover', (e) => {
        const el = e.target.closest(SEL);
        if (!el || el === hovered) { if (!el) hovered = null; return; }
        hovered = el;
        if (el.disabled || el.classList.contains('locked')) return;
        A.play('tick', 70);
      });
      this.menus.addEventListener('mouseleave', () => { hovered = null; });
      this.menus.addEventListener('click', (e) => {
        const el = e.target.closest(SEL);
        if (!el || el.disabled) return;
        A.init();
        if (A.recent(['nav', 'error', 'load', 'upgrade', 'select', 'click'], 80)) return;
        A.play('click', 0);
      });
    }

    hideMenus() { for (const k in this.m) this.m[k].classList.add('hidden'); }
    updateSoundButton() {
      this.menus.querySelector('#btn-sound').textContent = 'Son : ' + (this.app.settings.sound ? 'activé' : 'coupé');
      this.menus.querySelector('#btn-music').textContent = 'Musique : ' + (this.app.settings.music !== false ? 'activée' : 'coupée');
    }

    showStart(s) {
      this.hideMenus(); ZC.Audio.play('nav', 0);
      const colorSw = ZC.PLAYER_COLORS.map((c, i) => '<label class="sw-lbl" title="' + c.name + '"><input type="radio" name="playerColor" value="' + i + '"' + (i === s.playerColor ? ' checked' : '') + '><span class="sw" style="background:' + c.hex + '"></span></label>').join('');
      this.menus.querySelector('#start-form').innerHTML = `
        <label>Mode de jeu<select name="mode">${opt(['classic', 'evolution', 'rounds'], ['Classique (marines)', 'Évolution (l\'unité change)', 'Tournoi (premier à N rounds)'], s.mode)}</select></label>
        <label>Tournoi : rounds à gagner<select name="roundsToWin">${opt([1, 2, 3, 5], null, s.roundsToWin)}</select></label>
        <label>Tournoi : limite par round<select name="roundTimeLimit">${opt([0, 180, 300, 480, 720], ['Aucune (élimination)', '3:00', '5:00', '8:00', '12:00'], s.roundTimeLimit)}</select></label>
        <label>Adversaires (IA)<select name="aiCount">${opt([1, 2, 3, 4, 5, 6, 7], null, s.aiCount)}</select></label>
        <label>Difficulté<select name="difficulty">${opt(['easy', 'normal', 'hard'], ['Facile', 'Normal', 'Difficile'], s.difficulty)}</select></label>
        <label>Votre héros<select name="hero">${opt(['random', 'none'].concat(Object.keys(ZC.HEROES)), ['Aléatoire (selon la race)', 'Aucun'].concat(Object.values(ZC.HEROES).map(h => ZC.RACES[h.race].name + ' · ' + h.name)), s.hero || 'random')}</select></label>
        <label>Votre race<select name="playerRace">${opt(Object.keys(ZC.RACES), Object.values(ZC.RACES).map(r => r.name), s.playerRace)}</select></label>
        <label>Largeur de carte (zones)<select name="mapZones">${opt([3, 5, 7, 9, 11], null, s.mapZones)}</select></label>
        <label>Hauteur de carte<select name="mapZonesY">${opt([0, 1, 3, 5, 7, 9], ['Carrée', '1 (couloir)', '3', '5', '7', '9'], s.mapZonesY || 0)}</select></label>
        <label>Taille des zones<select name="zoneTiles">${opt([8, 12, 16], ['Petites (8 cases)', 'Normales (12 cases)', 'Grandes (16 cases)'], s.zoneTiles)}</select></label>
        <label>Terrain<select name="tileset">${opt(['jungle', 'badlands', 'space'], ['Jungle', 'Badlands', 'Plateforme spatiale'], s.tileset)}</select></label>
        <label>Votre couleur<span class="swatches">${colorSw}</span></label>
        <label>Intervalle des vagues<select name="spawnInterval">${opt([5, 8, 10, 15, 20], ['5 s', '8 s', '10 s', '15 s', '20 s'], s.spawnInterval)}</select></label>
        <label>Soldats de départ<select name="startUnits">${opt([0, 4, 8, 12, 20], ['Aucun', '4', '8', '12', '20'], s.startUnits)}</select></label>
        <label>Supply max<select name="unitCap">${opt([0, 60, 100, 150, 200, 300], ['Illimitée (selon les bunkers)', '60', '100', '150', '200', '300'], s.unitCap || 0)}</select></label>
        <label>Supply par bunker<select name="supplyPerBunker">${opt([10, 15, 20, 30, 50], ['+10', '+15', '+20', '+30', '+50'], s.supplyPerBunker)}</select></label>
        <label>Revenu par bunker / vague<select name="incomePerBunker">${opt([0, 2, 3, 5], ['Aucun (kills seulement)', '2 minerais', '3 minerais', '5 minerais'], s.incomePerBunker)}</select></label>
        <label>Coût d'un dropship<select name="dropshipCost">${opt([100, 150, 250], null, s.dropshipCost)}</select></label>
        <label>Temps d'atterrissage<select name="landingTime">${opt([3, 5, 8], ['3 s (rapide)', '5 s', '8 s (lent)'], s.landingTime)}</select></label>
        <label>Durée d'un round (évolution)<select name="roundDuration">${opt([60, 100, 150, 240], ['1:00', '1:40', '2:30', '4:00'], s.roundDuration)}</select></label>
        <label>Gisements de minerai<select name="mineralZones">${opt([0, 0.2, 0.4, 0.7], ['Aucun (zones de départ non plus)', 'Rares', 'Normaux', 'Abondants'], s.mineralZones)}</select></label>
        <label>Travailleurs au départ<select name="startWorkers">${opt([0, 2, 4, 5, 8], ['0', '2', '4', '5', '8'], s.startWorkers)}</select></label>
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
        mode: v('mode'), aiCount: +v('aiCount'), difficulty: v('difficulty'), hero: v('hero'), mapZones: +v('mapZones'), mapZonesY: +v('mapZonesY'), playerRace: v('playerRace'), zoneTiles: +v('zoneTiles'), tileset: v('tileset'),
        playerColor: +f.querySelector('[name="playerColor"]:checked').value,
        spawnInterval: +v('spawnInterval'), roundDuration: +v('roundDuration'), roundsToWin: +v('roundsToWin'), roundTimeLimit: +v('roundTimeLimit'),
        startUnits: +v('startUnits'), unitCap: +v('unitCap'), supplyPerBunker: +v('supplyPerBunker'),
        incomePerBunker: +v('incomePerBunker'), dropshipCost: +v('dropshipCost'),
        landingTime: +v('landingTime'), gameSpeed: +v('gameSpeed'), selectionLimit: +v('selectionLimit'), mineralZones: +v('mineralZones'), startWorkers: +v('startWorkers'),
        sound: v('sound') === '1', music: v('music') === '1', edgeScroll: v('edgeScroll') === '1', admin: v('admin') === '1', humanPlayer: true,
      };
    }

    showPause() { this.hideMenus(); ZC.Audio.play('nav', 0); this.updateSoundButton(); this.m.pause.classList.remove('hidden'); }

    // ------------------------------------------------------------ Mode aventure
    showPlay() {
      this.hideMenus(); ZC.Audio.play('nav', 0); this.m.play.classList.remove('hidden');
      this.m.play.querySelectorAll('canvas[data-art]').forEach(cv => ZC.drawCardArt(cv, cv.dataset.art)); // illustrations des cartes (sprites du jeu)
    }

    showCampaign(worldId) {
      this.hideMenus(); ZC.Audio.play('nav', 0);
      const c = this.app.campaign, q = (s) => this.menus.querySelector(s);
      if (worldId) c.selectWorld(worldId);
      if (!c.worldUnlocked(c.data.world)) c.selectWorld('w1');
      const w = c.world(c.data.world), wi = ZC.WORLDS.indexOf(w), wp = c.worldPoints(w.id);
      q('#adv-points').textContent = String(c.points);
      q('#adv-title').textContent = 'MONDE ' + (wi + 1) + ' : ' + w.name.toUpperCase();
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
      const counter = (label, earned, total, cls) => '<div class="adv-counter ' + cls + '"><span class="counter-label">' + label + '</span><strong>' + earned + ' <small>/ ' + total + '</small></strong><div class="counter-progress" role="progressbar" aria-label="' + label + '" aria-valuenow="' + earned + '" aria-valuemin="0" aria-valuemax="' + total + '"><i style="width:' + Math.min(100, earned / Math.max(1,total) * 100) + '%"></i></div></div>';
      q('#adv-stats').innerHTML = counter('Monde ' + (wi + 1), wp.earned, wp.total, 'world') + counter('Total des mondes', c.data.earned, c.totalPoints(), 'total');
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
      ZC.Audio.play('nav', 0);
      this.hideMenus();
      const c = this.app.campaign, m = c.mission(id), q = (s) => this.menus.querySelector(s);
      this.mis = { id, diff: c.done(id, 'easy') ? (c.done(id, 'medium') ? 'hard' : 'medium') : 'easy', lines: c.dialogue(id), i: 0 };
      const w = c.world(m.world);
      q('#mis-title').textContent = 'MONDE ' + (ZC.WORLDS.indexOf(w) + 1) + ' · MISSION ' + (m.index + 1) + ' — ' + m.name.toUpperCase();
      q('#mis-brief').textContent = m.brief;
      const o = m.objective;
      const st = m.settings, allies = st.teams ? st.teams.filter(t => t === 0).length - 1 : 0;
      q('#mis-obj').textContent = 'Objectif : ' + ZC.objectiveText(o) + ' · Carte ' + st.mapZones + 'x' + (st.mapZonesY || st.mapZones) + ' · ' + (st.aiCount - allies) + ' IA ennemie' + (st.aiCount - allies > 1 ? 's' : '') + (allies ? ' + ' + allies + ' allié' + (allies > 1 ? 's' : '') : '') + ' (ennemis alliés et un renfort en difficile)' + (m.scenario === 'corridor' ? ' · Difficile : couloir de 6 zones, avec une zone au-dessus et au-dessous de chaque extrémité' : '') + (st.mode === 'evolution' ? ' · mode évolution' : st.mode === 'rounds' ? ' · tournoi' : '') + (st.humanStart === 'center' ? ' · départ au centre' : '') + (st.extraZones ? ' · ' + st.extraZones + ' zones d\'avance' : '');
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
      return ZC.heroesOf(ZC.ADVENTURE_RACE).map(h => {
        const st = c.hero(h.id), def = ZC.UNITS[h.unit], sc = ZC.heroScale(st.level);
        const next = st.level >= ZC.HERO_MAX_LEVEL ? null : ZC.heroXpFor(st.level + 1), prev = ZC.heroXpFor(st.level);
        const pct = next ? Math.round((st.xp - prev) / (next - prev) * 100) : 100;
        return '<div class="hero' + (c.heroId === h.id ? ' sel' : '') + '" data-id="' + h.id + '"><canvas class="hp-cv" data-p="' + h.id + '" width="64" height="64"></canvas><div class="hero-txt"><div class="hn">' + esc(h.name) + ' <small>' + esc(h.title) + '</small></div>' +
          '<div class="hl">Niveau ' + st.level + (next ? ' · ' + Math.floor(st.xp) + ' / ' + next + ' XP' : ' (max)') + '</div><div class="xpbar"><span style="width:' + pct + '%"></span></div>' +
          (big ? '<div class="hs">' + Math.round(def.hp * sc.hp) + ' PV · ' + Math.round(def.dmg * sc.dmg) + (def.hits > 1 ? ' x' + def.hits : '') + ' dégâts · armure ' + (def.armor + sc.armor) + ' · portée ' + (def.range / ZC.TILE) + '</div><div class="hd">' + esc(h.desc) + '</div><div class="hd"><b class="gold">Pouvoirs</b> (à développer dans l\'annexe) : ' + h.powers.map(pid => esc(ZC.POWERS[pid].name) + ' (' + ZC.POWERS[pid].key + ') — ' + esc(ZC.POWERS[pid].desc)).join(' · ') + '</div>' : '') +
          '<div class="hsel">' + (c.heroId === h.id ? '✓ Sélectionné' : 'Choisir') + (big ? '<button class="hfiche" data-id="' + h.id + '">Fiche &amp; équipement' + (st.unspent ? ' <b class="gold">+' + st.unspent + '</b>' : '') + '</button>' : '') + '</div></div></div>';
      }).join('');
    }

    // ------------------------------------------------------------ Fiche du héros (caractéristiques, équipement, banque, boutique)
    showSheet(heroId) {
      ZC.Audio.play('nav', 0);
      this.hideMenus();
      this.sheet = { id: heroId || this.app.campaign.heroId, tab: (this.sheet && this.sheet.tab) || 'bank', sel: null };
      this.renderSheet();
      this.m.sheet.classList.remove('hidden');
    }
    renderSheet() {
      const c = this.app.campaign, S = this.sheet, q = (sel) => this.menus.querySelector(sel);
      const H = ZC.HEROES[S.id], st = c.hero(S.id), b = st.build, def = ZC.UNITS[H.unit], sc = ZC.heroScale(st.level);
      const ch = ZC.CHARACTERS[S.id]; if (ch) ZC.drawCharPortrait(q('#sh-portrait').getContext('2d'), ch.portrait, 64, ch.tint);
      q('#sh-name').innerHTML = esc(H.name) + ' <small>' + esc(H.title) + '</small>';
      q('#sh-lvl').textContent = 'Niveau ' + st.level;
      const prev = ZC.heroXpFor(st.level), next = ZC.heroXpFor(st.level + 1), pct = Math.round((st.xp - prev) / (next - prev) * 100);
      q('#sh-xpfill').style.width = pct + '%';
      q('#sh-xp').innerHTML = Math.floor(st.xp) + ' / ' + next + ' XP · <b class="gold">' + (next - Math.floor(st.xp)) + ' XP</b> avant le niveau ' + (st.level + 1) + ' <small>(environ ' + Math.ceil((next - st.xp) / 10) + ' kills de base)</small>';
      // Pantin : figure du héros avec son équipement + 6 emplacements autour
      const doll = q('#sh-doll');
      doll.querySelectorAll('.slot').forEach(e => e.remove());
      const POS = { cape: [0, 0], weapon: [0, 70], boots: [0, 140], helmet: [216, 0], armor: [216, 70], gloves: [216, 140] }; // trois emplacements de chaque côté de la figure
      for (const slot of ZC.SLOT_ORDER) {
        const it = st.gear[slot], d = document.createElement('div');
        d.className = 'slot' + (it ? ' r-' + it.rarity : ' empty') + (S.sel === 'slot:' + slot ? ' sel' : '');
        d.dataset.slot = slot; d.style.left = POS[slot][0] + 'px'; d.style.top = POS[slot][1] + 'px';
        d.title = ZC.ITEM_SLOTS[slot].name + (it ? ' : ' + it.name : ' (vide)');
        d.innerHTML = '<span class="si">' + ZC.ITEM_SLOTS[slot].icon + '</span><span class="sl">' + esc(ZC.ITEM_SLOTS[slot].name) + '</span>' + (it ? '<span class="silvl">' + it.ilvl + '</span>' : '');
        d.addEventListener('click', () => { S.sel = S.sel === 'slot:' + slot ? null : 'slot:' + slot; ZC.Audio.play('click', 0); this.renderSheet(); });
        doll.appendChild(d);
      }
      this.drawHeroFigure(q('#sh-figure'), H.unit, b);
      // Caractéristiques
      q('#sh-unspent').textContent = b.unspent ? '· ' + b.unspent + ' point' + (b.unspent > 1 ? 's' : '') + ' à répartir' : '';
      q('#sh-statrows').innerHTML = Object.keys(ZC.HERO_STATS).map(k => {
        const d = ZC.HERO_STATS[k], gearPart = b.totals[k] - st.points[k];
        return '<div class="strow"><span class="stn" tabindex="0" title="' + esc(d.desc) + '" style="color:' + d.color + '">' + esc(d.name) + '</span><span class="stv">' + b.totals[k] + (gearPart ? ' <small>(' + st.points[k] + ' + ' + gearPart + ' équip.)</small>' : '') + '</span><button class="stplus" data-stat="' + k + '"' + (b.unspent ? '' : ' disabled') + ' title="' + esc(d.desc) + '">+</button></div>';
      }).join('') + (b.spent ? '<button class="streset" id="sh-reset" title="Remet tous les points à répartir (gratuit)">Réinitialiser les points</button>' : '');
      q('#sh-statrows').querySelectorAll('.stplus').forEach(bt => bt.addEventListener('click', () => { if (c.spendPoint(S.id, bt.dataset.stat)) { ZC.Audio.play('upgrade', 0); this.renderSheet(); } }));
      const rs = q('#sh-reset'); if (rs) rs.addEventListener('click', () => { c.resetPoints(S.id); ZC.Audio.play('click', 0); this.renderSheet(); });
      // Stats dérivées (ce que le héros aura en mission, hors bonus de la boutique de points)
      const hp = Math.round(def.hp * sc.hp * b.hpMult), dmg = Math.round(def.dmg * sc.dmg * b.dmgMult) + b.dmgFlat, arm = def.armor + sc.armor + b.armor;
      const rows = [
        ['Points de vie', hp], ['Dégâts', dmg + (def.hits > 1 ? ' x' + def.hits : '') + ' (' + def.dtype + ')'], ['Armure', arm],
        ['Portée', (Math.round((def.range + b.rangeAdd) / ZC.TILE * 10) / 10) + ' cases'], ['Vitesse', Math.round(def.speed * b.speedMult)],
        ['Cadence', (Math.round(1 / (def.cooldown * b.cdMult) * 100) / 100) + ' tir/s'],
        ['Flux', b.fluxMax + ' max · +' + b.fluxRegen + '/s'],
        ['Pouvoirs', H.powers.map(pid => esc(ZC.POWERS[pid].name) + ' (' + ZC.POWERS[pid].flux + ' flux, ' + Math.round(ZC.POWERS[pid].cd * b.powerCd) + ' s)').join(' · ')],
      ];
      if (b.dodge > 0) rows.push(['Esquive', Math.round(b.dodge * 100) + ' %']);
      if (b.lifesteal > 0) rows.push(['Vol de vie', Math.round(b.lifesteal * 100) + ' % des dégâts']);
      if (b.regen > 0) rows.push(['Régénération', (Math.round(b.regen * 10) / 10) + ' PV/s']);
      if (b.splash > 0) rows.push(['Dégâts de zone', (Math.round(b.splash / ZC.TILE * 10) / 10) + ' case']);
      if (b.stunChance > 0) rows.push(['Foudre', Math.round(b.stunChance * 100) + ' % d\'étourdissement']);
      if (b.xpMult > 1) rows.push(['Expérience', '+' + Math.round((b.xpMult - 1) * 100) + ' %']);
      q('#sh-derived').innerHTML = rows.map(r => '<div><span class="dk">' + r[0] + '</span><span class="dv">' + r[1] + '</span></div>').join('');
      // Banque / boutique
      q('#sh-credits').textContent = String(c.credits);
      q('#menu-sheet .sh-tabs').querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === S.tab));
      const list = S.tab === 'bank' ? c.data.bank : c.shop();
      const items = q('#sh-items');
      items.innerHTML = list.length ? list.map(it => this.itemCard(it, { price: S.tab === 'shop', sel: S.sel === it.id, equipped: st.gear[it.slot] })).join('') : '<div class="iempty">' + (S.tab === 'bank' ? 'Banque vide. Réussissez des missions pour recevoir des objets mystère, ou achetez-en à la boutique d\'équipement.' : 'Rien en rayon pour le moment.') + '</div>';
      items.querySelectorAll('.icard').forEach(card => card.addEventListener('click', () => { S.sel = S.sel === card.dataset.id ? null : card.dataset.id; ZC.Audio.play('click', 0); this.renderSheet(); }));
      // Détail de la sélection
      let det = '';
      if (S.sel && S.sel.startsWith('slot:')) {
        const slot = S.sel.slice(5), it = st.gear[slot];
        det = it ? this.itemDetail(it) + '<div class="iact"><button data-act="unequip">Retirer (vers la banque)</button></div>' : '<div class="iempty">Emplacement ' + esc(ZC.ITEM_SLOTS[slot].name.toLowerCase()) + ' vide.</div>';
      } else if (S.sel) {
        const it = list.find(i => i.id === S.sel);
        if (it) {
          const cur = st.gear[it.slot];
          det = this.itemDetail(it) + (cur && cur.id !== it.id ? '<div class="icmp">Porté actuellement : ' + this.itemDetail(cur, true) + '</div>' : '');
          det += '<div class="iact">' + (S.tab === 'bank' ? '<button data-act="equip">Équiper' + (cur ? ' (remplace)' : '') + '</button><button data-act="sell" class="danger">Vendre ₢ ' + ZC.itemValue(it) + '</button>' : '<button data-act="buy"' + (c.credits < ZC.itemPrice(it) ? ' disabled' : '') + '>Acheter ₢ ' + ZC.itemPrice(it) + '</button>') + '</div>';
        }
      }
      q('#sh-detail').innerHTML = det || '<div class="iempty">Sélectionnez un objet ou un emplacement.</div>';
      q('#sh-detail').querySelectorAll('button[data-act]').forEach(bt => bt.addEventListener('click', () => {
        const act = bt.dataset.act; let ok = false;
        if (act === 'equip') { ok = c.equip(S.id, S.sel); if (ok) ZC.Audio.play('upgrade', 0); }
        else if (act === 'unequip') { ok = c.unequip(S.id, S.sel.slice(5)); if (ok) ZC.Audio.play('click', 0); }
        else if (act === 'sell') { ok = c.sell(S.sel) > 0; if (ok) ZC.Audio.play('capture', 0); }
        else if (act === 'buy') { ok = c.buyItem(S.sel); if (ok) ZC.Audio.play('capture', 0); }
        if (!ok) ZC.Audio.play('error', 0);
        S.sel = null; this.renderSheet();
      }));
    }
    // Carte compacte d'un objet (grille)
    itemCard(it, o) {
      o = o || {};
      return '<div class="icard r-' + it.rarity + (o.sel ? ' sel' : '') + '" data-id="' + it.id + '" title="' + esc(it.name) + ' — niveau d\'objet ' + it.ilvl + ', ' + esc(ZC.RARITIES[it.rarity].name) + '">' +
        '<div class="ii">' + ZC.ITEM_SLOTS[it.slot].icon + '</div><div class="in">' + esc(it.name) + '</div><div class="il">' + esc(ZC.ITEM_SLOTS[it.slot].name) + ' · niv. ' + it.ilvl + (o.price ? ' · <b class="gold">₢ ' + ZC.itemPrice(it) + '</b>' : '') + '</div>' +
        (o.equipped && o.equipped.id === it.id ? '<div class="ieq">porté</div>' : '') + '</div>';
    }
    // Fiche détaillée d'un objet (nom coloré par rareté, lignes de stats, affixes magiques en italique)
    itemDetail(it, small) {
      const R = ZC.RARITIES[it.rarity];
      return '<div class="ifull' + (small ? ' small' : '') + ' r-' + it.rarity + '"><div class="ifn" style="color:' + R.color + '">' + ZC.ITEM_SLOTS[it.slot].icon + ' ' + esc(it.name) + '</div><div class="ifs">' + esc(R.name) + ' · ' + esc(ZC.ITEM_SLOTS[it.slot].name) + ' · niveau d\'objet ' + it.ilvl + '</div>' +
        ZC.itemLines(it).map(l => '<div class="ifl' + (l.magic ? ' magic' : '') + '">' + (l.magic ? '✦ ' : '• ') + esc(l.text) + '</div>').join('') +
        (it.affixes.length ? '<div class="ifa">' + it.affixes.map(a => { const A = ZC.AFFIXES.find(x => x.id === a); return '<i>' + esc(A.name) + '</i> : ' + esc(A.desc); }).join(' · ') + '</div>' : '') +
        '<div class="ifv">Valeur de revente : ₢ ' + ZC.itemValue(it) + '</div></div>';
    }
    // Grande figure du héros avec son équipement (sprite de la feuille + superpositions de render.js)
    drawHeroFigure(cv, unitType, build) {
      const ctx = cv.getContext('2d'), w = cv.width, h = cv.height;
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w / 2, h * 0.6, 10, w / 2, h * 0.6, h * 0.6); g.addColorStop(0, 'rgba(73,198,255,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const fake = { type: unitType, def: ZC.UNITS[unitType], build, rf: Math.PI / 2, moving: false, attackAnim: 0, id: 1, up: { weapons: 0, armor: 0 } };
      const spec = ZC.spriteSpec(unitType), k = spec ? Math.min(3.2, (h * 0.78) / spec.h) : 3;
      ctx.save(); ctx.translate(w / 2, h * 0.5 + (spec ? (spec.h / 2 - spec.feet) * k : 0)); ctx.scale(k, k);
      const t = performance.now() / 1000;
      if (build.gear.cape) ZC.drawGear(ctx, fake, 'cape', t);
      ctx.rotate(fake.rf); ZC.drawUnitSprite(ctx, unitType, '#8ad88a', 1, false, 0, t, fake.up, fake.rf, undefined, 'human'); ctx.rotate(-fake.rf);
      for (const slot of ['boots', 'armor', 'gloves', 'helmet', 'weapon']) if (build.gear[slot]) ZC.drawGear(ctx, fake, slot, t);
      ctx.restore();
    }
    drawHeroPortraits(root) {
      root.querySelectorAll('canvas.hp-cv').forEach(cv => { const ch = ZC.CHARACTERS[cv.dataset.p]; ZC.drawCharPortrait(cv.getContext('2d'), ch.portrait, cv.width, ch.tint); });
    }
    showShop() {
      ZC.Audio.play('nav', 0);
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
      ZC.Audio.play('nav', 0);
      this.hideMenus();
      const c = this.app.campaign, q = (s) => this.menus.querySelector(s);
      q('#hero-list').innerHTML = this.heroCards(true);
      q('#hero-list').querySelectorAll('.hero').forEach(h => h.addEventListener('click', (e) => { if (e.target.closest('.hfiche')) return; c.selectHero(h.dataset.id); ZC.Audio.play('select', 0); this.showHeroes(); }));
      q('#hero-list').querySelectorAll('.hfiche').forEach(b => b.addEventListener('click', () => this.showSheet(b.dataset.id)));
      this.drawHeroPortraits(q('#hero-list'));
      this.m.heroes.classList.remove('hidden');
    }

    // Écran d'accueil (par-dessus la démo IA contre IA)
    showTitle(note) {
      this.hideMenus();
      const s = this.app.settings;
      this.menus.querySelector('#t-zones').textContent = String(s.mapZones * s.mapZones);
      this.menus.querySelector('#title-note').textContent = note || this.showTitleNote || ''; this.showTitleNote = '';
      this.menus.querySelector('#menu-title').classList.remove('hidden');
    }

    // Révélation de l'objet mystère : silhouette qui tremble, roulette des raretés, puis la carte avec un éclat
    revealLoot(it) {
      const q = (sel) => this.menus.querySelector(sel), box = q('#loot-box'), mys = q('#loot-mys'), rar = q('#loot-rar'), card = q('#loot-card');
      if (!box) return;
      const names = Object.keys(ZC.RARITIES);
      let n = 0;
      const tick = () => { if (!box.isConnected || box.classList.contains('done')) return; const k = names[n % names.length]; rar.textContent = ZC.RARITIES[k].name + '…'; rar.style.color = ZC.RARITIES[k].color; mys.style.transform = 'rotate(' + (Math.sin(n) * 8) + 'deg) scale(' + (1 + 0.04 * (n % 3)) + ')'; ZC.Audio.play('tick', 0); n++; this.lootTimer = setTimeout(tick, 90 + n * 18); };
      tick();
      setTimeout(() => {
        if (!box.isConnected) return;
        clearTimeout(this.lootTimer); box.classList.add('done', 'r-' + it.rarity);
        rar.textContent = ZC.RARITIES[it.rarity].name.toUpperCase() + ' !'; rar.style.color = ZC.RARITIES[it.rarity].color;
        mys.textContent = ZC.ITEM_SLOTS[it.slot].icon; mys.style.transform = '';
        card.innerHTML = this.itemDetail(it) + '<div class="loot-note">Rangé dans la banque : équipez-le dans la fiche du héros.</div>'; card.classList.remove('hidden');
        ZC.Audio.play(it.rarity === 'legendary' || it.rarity === 'epic' ? 'victory' : 'round', 0);
      }, 2300);
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
        const gained = res.levelAfter - res.levelBefore;
        html += '<div class="cr-hero">' + esc(h.name) + ' : <b class="gold">+' + res.xp + ' XP</b>' + (res.victory ? '' : ' (conservés malgré la défaite)') + (gained > 0 ? ' · <b class="gold">niveau ' + res.levelBefore + ' → ' + res.levelAfter + '</b> · +' + (gained * ZC.HERO_POINTS_PER_LEVEL) + ' points à répartir dans sa fiche' : ' (niveau ' + res.levelAfter + ')') + '</div>';
        html += '<div class="cr-hero">Crédits : <b class="gold">+₢ ' + res.credits + '</b>' + (res.victory ? '' : ' (un quart de la prime)') + ' · total ₢ ' + this.app.campaign.credits + ' · Points ★ ' + this.app.campaign.points + '</div>';
        if (res.loot) html += '<div class="loot" id="loot-box"><div class="loot-cap">RÉCOMPENSE MYSTÈRE</div><div class="loot-stage"><div class="loot-mys" id="loot-mys">?</div><div class="loot-rays"></div></div><div class="loot-rar" id="loot-rar">Qui est cet objet ?</div><div class="loot-card hidden" id="loot-card"></div></div>';
        if (res.outro) html += '<div class="cr-outro">« ' + esc(res.outro) + ' »</div>';
        if (res.worldDone) html += '<div class="cr-main gold">Monde conquis ! Le monde suivant est débloqué sur la carte de l\'aventure.</div>';
        ec.innerHTML = html;
        if (res.loot) this.revealLoot(res.loot);
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
