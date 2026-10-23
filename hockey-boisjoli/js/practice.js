// Mode Pratique : exercices (drills) par section, avec trois difficultés et des étoiles sauvegardées.
// HK.DRILLS décrit les exercices ; HK.Practice les fait tourner sur une partie en mode `practice` (sans DOM).
(function (HK) {
  'use strict';
  const R = HK.RINK, G = HK.GOAL;
  const CY = () => HK.CY, CX = () => HK.CX;
  const LEVELS = ['Facile', 'Normal', 'Difficile'];
  HK.DRILL_LEVELS = LEVELS;
  HK.DRILL_SECTIONS = [
    { id: 'attaque', name: 'Attaque', icon: '🎯' },
    { id: 'defense', name: 'Défense', icon: '🛡️' },
    { id: 'gardien', name: 'Gardien', icon: '🥅' },
    { id: 'pouvoirs', name: 'Pouvoirs magiques', icon: '✨' },
    { id: 'habiletes', name: 'Habiletés', icon: '⛸️' },
    { id: 'defis', name: 'Défis', icon: '🏆' },
  ];
  const lv = (a, b, c) => [a, b, c];
  const goalieSkill = lv(0.45, 0.68, 0.88);

  // Chaque exercice : need = objectif par niveau, time = limite (s) par niveau, setup/onEvent/tick/reset reçoivent la Practice (P).
  HK.DRILLS = [
    // ---------------- Attaque
    { id: 'echappee', section: 'attaque', icon: '🏃', name: 'Échappée', desc: 'Seul contre le gardien : marque le plus de buts possible.',
      need: lv(3, 5, 7), time: lv(60, 60, 60), goalie: goalieSkill, unit: 'buts', onEvent: (P, e) => { if (e.type === 'goal' && e.team === 0) P.score(1); } },
    { id: 'cibles', section: 'attaque', icon: '🎯', name: 'Cibles', desc: 'Touche les cibles dans les coins du filet. Le gardien défend quand même !',
      need: lv(4, 6, 8), time: lv(60, 60, 60), goalie: lv(0.35, 0.55, 0.75), unit: 'cibles',
      reset: P => P.placeTargets(), onEvent: (P, e) => { if (e.type === 'target') P.score(1); } },
    { id: 'frappe', section: 'attaque', icon: '💪', name: 'Lancer frappé', desc: 'Seuls les tirs chargés à fond comptent (tiens C jusqu\'à ce que le bâton soit levé).',
      need: lv(3, 4, 5), time: lv(75, 75, 75), goalie: goalieSkill, unit: 'buts chargés',
      onEvent: (P, e) => { if (e.type === 'goal' && e.team === 0) { if (e.shot && e.shot.charge >= 0.9) P.score(1); else P.msg('Pas assez chargé !'); } } },
    { id: 'unetouche', section: 'attaque', icon: '🔁', name: 'Passe et tir', desc: 'Un coéquipier te fait des passes : tire dans la seconde qui suit la réception.',
      need: lv(3, 5, 7), time: lv(60, 60, 60), goalie: goalieSkill, unit: 'buts sur réception',
      setup: P => { P.passer = P.addMate('passer', CX() + 260, CY() - 170); },
      reset: P => { P.g.givePuck(P.passer, CX() + 260, CY() - 170); P.me.x = CX() + 150; P.me.y = CY() + 60; },
      onEvent: (P, e) => { if (e.type === 'pickup' && e.s === P.me) P.recvT = P.g.t; if (e.type === 'goal' && e.team === 0) { if (e.shot && P.recvT && e.shot.t - P.recvT < 1.2) P.score(1); else P.msg('Trop lent après la passe !'); } } },
    { id: 'defenseur', section: 'attaque', icon: '🚧', name: 'Déjouer la défense', desc: 'Des défenseurs te poursuivent : trouve le chemin du filet.',
      need: lv(3, 3, 3), time: lv(90, 90, 90), goalie: goalieSkill, unit: 'buts',
      setup: P => P.addOpps('chaser', [1, 2, 3][P.level]), onEvent: (P, e) => { if (e.type === 'goal' && e.team === 0) P.score(1); } },
    // ---------------- Défense
    { id: 'echec', section: 'defense', icon: '💥', name: 'Mises en échec', desc: 'Deux porteurs se sauvent avec la rondelle : fonce dessus (C sans la rondelle) et fais-les tomber.',
      need: lv(5, 8, 12), time: lv(60, 60, 60), unit: 'mises en échec',
      setup: P => P.addOpps('carrier', 2), reset: P => P.puckToBot(),
      onEvent: (P, e) => { if (e.type === 'hit' && e.by === P.me) P.score(1); if (e.type === 'pickup' && e.s === P.me) P.later(0.4, () => P.puckToBot()); } },
    { id: 'vol', section: 'defense', icon: '🕵️', name: 'Vol de rondelle', desc: 'Colle les porteurs et pique la rondelle avec ton bâton.',
      need: lv(5, 8, 12), time: lv(60, 60, 60), unit: 'vols',
      setup: P => P.addOpps('carrier', [2, 2, 3][P.level]), reset: P => P.puckToBot(),
      onEvent: (P, e) => { if (e.type === 'steal' && e.s === P.me) { P.score(1); P.later(0.6, () => P.puckToBot()); } } },
    { id: 'bloque', section: 'defense', icon: '🧱', name: 'Bloque le tir', desc: 'Ton filet est vide ! Mets-toi devant les tireurs et bloque avec ton corps ou ton bâton.',
      need: lv(5, 8, 10), time: lv(60, 60, 60), unit: 'tirs bloqués', maxAgainst: lv(4, 3, 3), noMyGoalie: true,
      setup: P => P.addOpps('shooter', [1, 2, 3][P.level], 'blue'), reset: P => { P.puckToBot(); P.me.x = HK.goalX(-1) + 120; P.me.y = CY(); },
      onEvent: (P, e) => { const ls = P.g.lastShot; const fresh = ls && ls.s.team === 1 && P.g.t - ls.t < 1.5; if ((e.type === 'deflect' || e.type === 'pickup') && e.s === P.me && fresh) { P.score(1); P.later(0.5, () => P.puckToBot()); } if (e.type === 'goal' && e.team === 1) P.against(1); } },
    { id: 'protege', section: 'defense', icon: '🛡️', name: 'Protège ton gardien', desc: 'Tiens 60 s : plaque, vole, dégage. Trop de buts contre toi et c\'est raté.',
      need: lv(1, 1, 1), time: lv(60, 60, 60), unit: '', maxAgainst: lv(4, 3, 2), myGoalie: 0.6, winOnTime: true,
      setup: P => { P.addOpps('shooter', 2, 'blue'); P.addOpps('crasher', 1); }, reset: P => P.puckToBot(),
      onEvent: (P, e) => { if (e.type === 'goal' && e.team === 1) P.against(1); } },
    // ---------------- Gardien
    { id: 'arrets', section: 'gardien', icon: '🧤', name: 'Arrêts', desc: 'Tu es le gardien (flèches pour bouger, C pour plonger). Arrête les tirs !',
      need: lv(8, 12, 16), time: lv(90, 90, 90), unit: 'arrêts', maxAgainst: lv(4, 3, 3), goalieMe: true,
      setup: P => P.addOpps('shooter', [2, 3, 3][P.level], 'spots'), reset: P => P.puckToBot(),
      onEvent: (P, e) => { if (e.type === 'save' && e.team === 0) { P.score(1); P.later(0.8, () => P.puckToBot()); } if (e.type === 'goal' && e.team === 1) P.against(1); if (e.type === 'cover') P.later(0.1, () => P.puckToBot()); } },
    { id: 'barrage', section: 'gardien', icon: '🥅', name: 'Tirs de barrage', desc: 'Cinq échappées contre toi. Arrête-en assez pour gagner.',
      need: lv(2, 3, 4), time: lv(90, 90, 90), unit: 'arrêts sur 5', goalieMe: true, attempts: 5,
      setup: P => P.addOpps('breakaway', 1), reset: P => { P.puckToBot(true); },
      onEvent: (P, e) => { if (e.type === 'save' && e.team === 0) { P.score(1); P.attempt(); } if (e.type === 'goal' && e.team === 1) P.attempt(); if (e.type === 'cover' || e.type === 'board') { if (P.g.lastShot && P.g.t - P.g.lastShot.t < 1) { P.score(1); P.attempt(); } } } },
    { id: 'rebonds', section: 'gardien', icon: '🔄', name: 'Rebonds', desc: 'Des tireurs et un gars planté devant toi pour les retours. Tiens 45 s.',
      need: lv(1, 1, 1), time: lv(45, 45, 45), unit: '', maxAgainst: lv(4, 3, 2), goalieMe: true, winOnTime: true,
      setup: P => { P.addOpps('shooter', 2, 'blue'); P.addOpps('crasher', 1); }, reset: P => P.puckToBot(),
      onEvent: (P, e) => { if (e.type === 'goal' && e.team === 1) P.against(1); if (e.type === 'cover') P.later(0.1, () => P.puckToBot()); } },
    // ---------------- Pouvoirs magiques
    { id: 'pouvoir', section: 'pouvoirs', icon: '✨', name: 'Pouvoir et but', desc: 'Ton pouvoir recharge 4 fois plus vite : marque dans les 4 s après l\'avoir utilisé.',
      need: lv(3, 4, 5), time: lv(90, 90, 90), goalie: goalieSkill, unit: 'buts magiques', fastCd: 0.25,
      setup: P => P.addOpps('chaser', [1, 2, 2][P.level]),
      onEvent: (P, e) => { if (e.type === 'power' && e.s === P.me) P.powT = P.g.t; if (e.type === 'goal' && e.team === 0) { if (P.powT != null && P.g.t - P.powT < 4) P.score(1); else P.msg('Utilise ton pouvoir avant !'); } } },
    { id: 'rafale', section: 'pouvoirs', icon: '🔥', name: 'Rafale de pouvoirs', desc: 'Recharge éclair : utilise ton pouvoir le plus souvent possible, avec des poursuivants dans les pattes.',
      need: lv(5, 8, 12), time: lv(60, 60, 60), goalie: goalieSkill, unit: 'pouvoirs', fastCd: 0.15,
      setup: P => P.addOpps('chaser', 2), onEvent: (P, e) => { if (e.type === 'power' && e.s === P.me) P.score(1); } },
    { id: 'contre', section: 'pouvoirs', icon: '🪄', name: 'Contre les pouvoirs', desc: 'Les adversaires utilisent leurs pouvoirs sans arrêt. Marque quand même.',
      need: lv(3, 3, 3), time: lv(90, 90, 90), goalie: goalieSkill, unit: 'buts', oppPowers: true,
      setup: P => P.addOpps('chaser', [2, 3, 3][P.level]), onEvent: (P, e) => { if (e.type === 'goal' && e.team === 0) P.score(1); } },
    { id: 'equipe', section: 'pouvoirs', icon: '👨‍👩‍👧', name: 'Toute la famille', desc: 'Tes trois joueurs sont là (1, 2, 3 pour changer). Utilise le pouvoir de chacun et marque 3 buts.',
      need: lv(3, 3, 3), time: lv(90, 90, 90), goalie: goalieSkill, unit: 'buts', fullTeam: true, fastCd: 0.5,
      setup: P => { P.addOpps('chaser', 2); P.used = new Set(); },
      onEvent: (P, e) => { if (e.type === 'power' && e.s.team === 0) P.used.add(e.s.id); if (e.type === 'goal' && e.team === 0) P.score(1); },
      extraText: P => `pouvoirs différents ${P.used ? P.used.size : 0}/3`, extraOk: P => P.used && P.used.size >= 3 },
    // ---------------- Habiletés
    { id: 'slalom', section: 'habiletes', icon: '⛸️', name: 'Slalom', desc: 'Passe par toutes les portes dans l\'ordre, le plus vite possible (sans rondelle).',
      need: lv(8, 8, 8), time: lv(45, 32, 24), unit: 'portes', noPuck: true, gates: true,
      tick: P => P.checkGate(false) },
    { id: 'controle', section: 'habiletes', icon: '🎮', name: 'Contrôle de rondelle', desc: 'Le même slalom, mais avec la rondelle sur le bâton.',
      need: lv(8, 8, 8), time: lv(55, 40, 30), unit: 'portes', gates: true,
      tick: P => P.checkGate(true) },
    { id: 'chapeau', section: 'habiletes', icon: '🎩', name: 'Tour du chapeau', desc: 'Trois buts, chrono serré.',
      need: lv(3, 3, 3), time: lv(40, 30, 22), goalie: goalieSkill, unit: 'buts', onEvent: (P, e) => { if (e.type === 'goal' && e.team === 0) P.score(1); } },
    { id: 'derriere', section: 'habiletes', icon: '↩️', name: 'Tour du filet', desc: 'Les buts comptent seulement si tu passes derrière le filet juste avant de tirer.',
      need: lv(3, 3, 3), time: lv(75, 75, 75), goalie: goalieSkill, unit: 'buts enveloppés',
      onEvent: (P, e) => { if (e.type === 'goal' && e.team === 0) { if (e.shot && e.shot.behind) P.score(1); else P.msg('Passe derrière le filet d\'abord !'); } } },
    { id: 'ligne', section: 'habiletes', icon: '📏', name: 'De la ligne bleue', desc: 'Tire de loin : seuls les buts marqués d\'au-delà de la ligne bleue comptent.',
      need: lv(3, 4, 5), time: lv(75, 75, 75), goalie: lv(0.35, 0.5, 0.65), unit: 'buts de loin',
      onEvent: (P, e) => { if (e.type === 'goal' && e.team === 0) { if (e.shot && e.shot.x <= CX() + R.w * 0.19) P.score(1); else P.msg('Trop proche !'); } } },
    // ---------------- Défis
    { id: 'survie', section: 'defis', icon: '⏱️', name: 'Survie', desc: 'Garde la rondelle le plus longtemps possible avec des poursuivants aux fesses.',
      need: lv(20, 25, 30), time: lv(60, 60, 60), unit: 's de possession', fastCd: 0.5,
      setup: P => P.addOpps('chaser', [2, 3, 4][P.level]), tick: (P, dt) => { if (P.g.puck.owner === P.me) P.score(dt, true); } },
    { id: 'unContreUn', section: 'defis', icon: '⚔️', name: '1 contre 1', desc: 'Un vrai duel avec gardiens des deux côtés. Premier à 3 buts.',
      need: lv(3, 3, 3), time: lv(180, 180, 180), goalie: lv(0.55, 0.72, 0.88), unit: 'buts', myGoalie: 0.72, maxAgainst: lv(3, 3, 3), fastCd: 1,
      setup: P => { P.g.difficulty = P.level; P.addOpps('ai', 1); P.puckCenter = true; },
      onEvent: (P, e) => { if (e.type === 'goal' && e.team === 0) P.score(1); if (e.type === 'goal' && e.team === 1) P.against(1); } },
    { id: 'marathon', section: 'defis', icon: '🏁', name: 'Marathon de buts', desc: 'Une minute, un gardien, le plus de buts possible.',
      need: lv(5, 8, 12), time: lv(60, 60, 60), goalie: lv(0.4, 0.6, 0.8), unit: 'buts', onEvent: (P, e) => { if (e.type === 'goal' && e.team === 0) P.score(1); } },
  ];
  HK.drillById = id => HK.DRILLS.find(d => d.id === id);

  // Étoiles sauvegardées : { drillId: [bool, bool, bool] }
  HK.drillStars = {
    load() { try { return JSON.parse(localStorage.getItem('hk.drills') || '{}'); } catch (e) { return {}; } },
    save(d) { try { localStorage.setItem('hk.drills', JSON.stringify(d)); } catch (e) { } },
    done(id, level) { const d = HK.drillStars.load(); d[id] = d[id] || [false, false, false]; d[id][level] = true; HK.drillStars.save(d); },
    total() { const d = HK.drillStars.load(); let n = 0; for (const k in d) n += d[k].filter(Boolean).length; return n; },
  };

  class Practice {
    constructor(g) {
      this.g = g; this.drill = null; this.level = 0; this.state = 'free'; this.timers = []; this.msgs = [];
      this.me = g.teams[0].skaters[0]; this.roster0 = g.teams[0].def.players.slice(); this.roster1 = g.teams[1].def.players.slice();
      this.botK = 0; this.onFinish = null; this.onMsg = null;
      g.practiceReset();
    }
    // --- aides pour les exercices
    msg(t) { if (this.onMsg) this.onMsg(t); }
    later(t, f) { this.timers.push({ t, f }); }
    score(n, silent) { this.progress += n; if (!silent && this.progress >= this.need && !(this.drill.extraOk && !this.drill.extraOk(this))) this.finish(true); }
    against(n) { this.goalsAgainst += n; if (this.drill.maxAgainst && this.goalsAgainst > this.drill.maxAgainst[this.level]) this.finish(false); }
    attempt() { this.attempts++; if (this.attempts >= this.drill.attempts) this.finish(this.progress >= this.need); else this.later(1.2, () => this.g.practiceReset()); }
    pidFor(team) { const list = team === 0 ? this.roster0.filter(p => !this.g.teams[0].skaters.some(s => s.id === p)) : this.roster1; return list[this.botK++ % list.length]; }
    addOpps(role, n, where) {
      const T = this.g.teams[1], gx0 = HK.goalX(-1);
      for (let i = 0; i < n; i++) {
        let x, y;
        if (where === 'blue') { x = gx0 + 330; y = CY() + (i - (n - 1) / 2) * 150; }
        else if (where === 'spots') { x = gx0 + 150 + (i % 2) * 120; y = CY() + (i - (n - 1) / 2) * 160; }
        else { x = CX() + 200 + i * 60; y = CY() + (i - (n - 1) / 2) * 140; }
        const s = this.g.addBot(1, this.pidFor(1), role === 'ai' ? null : role, x, y);
        if (role === 'ai') s.bot = true;
        if (this.drill && this.drill.oppPowers) s.usePowers = true;
        this.bots.push(s);
      }
    }
    addMate(role, x, y) { const s = this.g.addBot(0, this.pidFor(0), role, x, y); this.bots.push(s); return s; }
    puckToBot(center) {
      const bots = this.bots.filter(b => b.team === 1 && b.onIce); if (!bots.length) return;
      const b = bots[Math.floor(this.g.rand() * bots.length)];
      if (center) { this.g.givePuck(b, CX(), CY()); b.ai.t = 0; return; }
      const h = b.home || { x: b.x, y: b.y };
      this.g.givePuck(b, h.x, h.y); b.ai.t = 0; b.ai.holdT = 0;
    }
    placeTargets() {
      const g = this.g; const gx = HK.goalX(1); g.targets = [];
      for (const dy of [-26, 26]) g.targets.push({ x: gx + 14, y: CY() + dy, r: 13, active: true });
      g.targets.push({ x: gx + 6, y: CY(), r: 10, active: true });
    }
    makeGates() {
      const g = this.g; g.cones = []; this.gates = []; this.gateIdx = 0;
      const x0 = R.x + 180, step = (R.w - 360) / 7;
      for (let i = 0; i < 8; i++) { const y = CY() + (i % 2 ? 130 : -130); this.gates.push({ x: x0 + i * step, y, r: 42 }); g.cones.push({ x: x0 + i * step + step / 2, y: CY(), r: 12 }); }
      g.cones.pop();
    }
    checkGate(needPuck) {
      const gt = this.gates[this.gateIdx]; if (!gt) return;
      if (Math.hypot(this.me.x - gt.x, this.me.y - gt.y) < gt.r && (!needPuck || this.g.puck.owner === this.me)) { this.gateIdx++; this.g.ev({ type: 'gate', x: gt.x, y: gt.y }); this.score(1); }
    }
    // --- lancer / arrêter
    start(id, level) {
      this.stop();
      const d = HK.drillById(id), g = this.g; this.drill = d; this.level = level; this.state = 'running';
      this.progress = 0; this.need = d.need[level]; this.timeLeft = d.time[level]; this.goalsAgainst = 0; this.attempts = 0; this.bots = []; this.botK = 0; this.powT = null; this.recvT = null;
      g.o.goalieSkill = d.goalie ? d.goalie[level] : 0.72; g.myGoalieSkill = d.myGoalie || null;
      g.goalieHuman = d.goalieMe ? 0 : -1;
      const T0 = g.teams[0];
      if (d.goalieMe) { this.hidden = T0.skaters.splice(0); for (const s of this.hidden) s.onIce = false; }
      else if (d.fullTeam) { const list = this.roster0.filter(p => p !== this.me.id).slice(0, 2); for (const pid of list) { const s = g.makeSkater(pid, 0); s.onIce = true; s.x = CX() - 120; s.y = CY() + (T0.skaters.length ? 100 : -100); T0.skaters.push(s); T0.all.push(s); this.extraMates = (this.extraMates || []).concat([s]); } }
      if (d.gates) this.makeGates();
      if (d.setup) d.setup(this);
      g.practiceReset();
    }
    stop() {
      const g = this.g, T0 = g.teams[0];
      g.removeBots(); g.cones = []; g.targets = []; g.smoke = null; g.goalieHuman = -1; g.o.goalieSkill = 0.72; g.myGoalieSkill = null; g.difficulty = 1;
      if (this.hidden) { for (const s of this.hidden) { s.onIce = true; T0.skaters.push(s); } this.hidden = null; }
      if (this.extraMates) { for (const s of this.extraMates) { T0.skaters.splice(T0.skaters.indexOf(s), 1); T0.all.splice(T0.all.indexOf(s), 1); } this.extraMates = null; }
      for (const T of g.teams) { for (const s of T.box.splice(0)) { s.penalty = 0; s.onIce = true; T.skaters.push(s); } }
      this.timers = []; this.drill = null; this.state = 'free'; this.gates = null; this.me.cd = 0;
      g.controlled[0] = this.me;
      g.practiceReset();
    }
    finish(won) {
      if (this.state !== 'running') return;
      this.state = won ? 'won' : 'lost'; this.won = won;
      if (won) HK.drillStars.done(this.drill.id, this.level);
      this.g.ev({ type: won ? 'drillWon' : 'drillLost' });
      if (this.onFinish) this.onFinish(won);
    }
    tick(dt, events) {
      const g = this.g, d = this.drill;
      for (let i = this.timers.length - 1; i >= 0; i--) { const t = this.timers[i]; t.t -= dt; if (t.t <= 0) { this.timers.splice(i, 1); t.f(); } }
      for (const e of events) {
        if (e.type === 'reset') this.onReset();
        if (d && this.state === 'running' && d.onEvent) d.onEvent(this, e);
      }
      if (!d || this.state !== 'running') return;
      if (d.noMyGoalie) g.teams[0].goalie.down = 1;
      if (g.myGoalieSkill) g.teams[0].goalieSkillOverride = g.myGoalieSkill;
      if (d.fastCd) for (const s of g.teams[0].skaters) s.cd = Math.min(s.cd, HK.POWERS[s.def.power].cd * d.fastCd);
      if (d.oppPowers) for (const s of g.teams[1].skaters) { s.usePowers = true; s.cd = Math.min(s.cd, 6); }
      if (d.noPuck) { const p = g.puck; if (p.owner === this.me) { p.owner = null; } p.x = R.x + 40; p.y = R.y + 40; p.vx = p.vy = 0; }
      if (d.tick) d.tick(this, dt);
      if (g.phase === 'play') { this.timeLeft -= dt; if (this.timeLeft <= 0) { this.timeLeft = 0; this.finish(!!d.winOnTime && this.goalsAgainst <= (d.maxAgainst ? d.maxAgainst[this.level] : 99)); } }
    }
    onReset() {
      const g = this.g, d = this.drill;
      if (d && d.gates) { this.gateIdx = 0; this.progress = 0; }
      if (d && d.reset) d.reset(this);
      else if (this.puckCenter) { g.puck.x = CX(); g.puck.y = CY(); }
      else if (!d || !d.goalieMe) { if (!(d && d.noPuck)) g.givePuck(this.me, this.me.x, this.me.y); }
      if (d && d.goalieMe && !g.puck.owner) this.puckToBot(d.id === 'barrage');
      if (d && d.gates) { this.me.x = this.gates[0].x - 90; this.me.y = CY(); if (!d.noPuck) g.givePuck(this.me, this.me.x, this.me.y); }
    }
    setSkater(pid) {
      const g = this.g, T0 = g.teams[0]; if (this.state === 'running') return;
      const s = g.makeSkater(pid, 0); s.onIce = true; const k = T0.skaters.indexOf(this.me);
      if (k >= 0) T0.skaters[k] = s; else T0.skaters.push(s);
      T0.all = T0.all.filter(x => x !== this.me).concat([s]); this.me = s; g.controlled[0] = s; g.practiceReset();
    }
    hud() {
      const d = this.drill; if (!d) return null;
      const prog = d.unit ? `${Math.floor(this.progress)}/${this.need} ${d.unit}` : '';
      const extra = d.extraText ? ' · ' + d.extraText(this) : '';
      const ag = d.maxAgainst ? ` · buts contre ${this.goalsAgainst}/${d.maxAgainst[this.level]}` : '';
      const att = d.attempts ? ` · essai ${Math.min(this.attempts + 1, d.attempts)}/${d.attempts}` : '';
      return { name: d.icon + ' ' + d.name, level: LEVELS[this.level], text: prog + extra + ag + att, time: this.timeLeft, frac: Math.min(1, this.progress / this.need), state: this.state, gate: this.gates ? this.gates[this.gateIdx] : null, gates: this.gates, gateIdx: this.gateIdx };
    }
  }
  HK.Practice = Practice;
})(window.HK);
