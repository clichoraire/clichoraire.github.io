// Mode Aventure : un chef choisi parmi toute la famille, une équipe de six montée avant chaque match, de l'expérience
// (dégâts infligés + bonus K.-O.) qui donne des points de stat à placer (0 à 10, puis 11 à 15 en jaune et 16 à 18 en rouge).
// Sauvegarde dans localStorage (bc.adventure). Logique ici ; les écrans sont dans BC.AdventureUI (plus bas).
(function (BC) {
  'use strict';
  const KEY = 'bc.adventure';
  const A = BC.Adventure = {};

  A.load = leader => {
    try {
      const saved = leader ? JSON.parse(localStorage.getItem(KEY + '.' + leader) || 'null') : null;
      const legacy = JSON.parse(localStorage.getItem(KEY) || 'null');
      const data = saved || (legacy && (!leader || legacy.leader === leader) ? legacy : null);
      return data && BC.PLAYERS[data.leader] && (!leader || data.leader === leader) ? data : null;
    } catch (e) { return null; }
  };
  A.save = s => {
    try {
      // Conserver l'ancienne aventure avant de changer de personnage.
      const previous = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (previous && previous.leader && previous.leader !== s.leader) localStorage.setItem(KEY + '.' + previous.leader, JSON.stringify(previous));
      localStorage.setItem(KEY + '.' + s.leader, JSON.stringify(s));
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) { }
    return s;
  };
  A.reset = leader => {
    const active = A.load(), id = leader || active?.leader;
    if (!id) return;
    try { localStorage.removeItem(KEY + '.' + id); if (active?.leader === id) localStorage.removeItem(KEY); } catch (e) { }
  };
  A.start = leader => A.save({ leader, chars: {}, match: 0, wins: 0, losses: 0, team: { inner: [leader], outer: [] }, created: Date.now() });
  // Fiche d'aventure d'un personnage (créée à la demande avec ses stats de base).
  A.char = (s, pid) => {
    if (!s.chars[pid]) s.chars[pid] = { stats: Object.assign({}, BC.PLAYERS[pid].stats), xp: 0, points: 0, earned: 0, matches: 0, kos: 0, totalXp: 0 };
    return s.chars[pid];
  };
  A.statsMap = s => Object.fromEntries(Object.entries(s.chars).map(([pid, c]) => [pid, c.stats]));
  A.nextCost = c => BC.xpForPoint(c.earned);
  // Ajoute de l'expérience ; à chaque palier, un point à placer. Renvoie le nombre de points gagnés.
  A.addXp = (s, pid, n) => {
    const c = A.char(s, pid); c.xp += n; c.totalXp += n; let gained = 0;
    while (c.xp >= A.nextCost(c)) { c.xp -= A.nextCost(c); c.earned++; c.points++; gained++; }
    return gained;
  };
  A.spend = (s, pid, key) => { const c = A.char(s, pid); if (c.points <= 0 || c.stats[key] >= BC.MAX_STAT) return false; c.stats[key]++; c.points--; A.save(s); return true; };
  A.allIds = () => [...new Set(BC.TEAMS.flatMap(t => t.players))].filter(id => !BC.PLAYERS[id].monster);
  A.familyOf = pid => BC.TEAMS.find(t => t.players.includes(pid));
  // Douze rencontres par chapitre ; les chapitres suivants renforcent les monstres.
  A.next = s => {
    const count = BC.MONSTER_TEAMS.length, stage = s.match % count, tier = Math.floor(s.match / count);
    const team = BC.MONSTER_TEAMS[stage];
    return { index:s.match, stage:stage+1, chapter:tier+1, team, difficulty:Math.min(2, Math.floor(stage/4)+tier), bonus:Math.min(8,tier*2), tier };
  };
  A.teamComplete = s => {
    const ids=s.team.inner.concat(s.team.outer), allowed=new Set(A.allIds());
    return s.team.inner.length===BC.INNER && s.team.outer.length===BC.OUTER && s.team.inner[0]===s.leader && new Set(ids).size===6 && ids.every(id=>allowed.has(id));
  };
  // Toute la famille peut jouer ensemble ; aucun cousin n'est prêté aux monstres.
  A.buildMatch = s => {
    if (!A.teamComplete(s)) throw new Error('Choisis six personnages de la famille, dont ton chef.');
    const nx=A.next(s), mine=s.team.inner.concat(s.team.outer), leader=BC.PLAYERS[s.leader], fam=A.familyOf(s.leader);
    const myTeam=Object.assign({},fam,{id:'aventure',name:'Équipe '+leader.name,short:leader.name.slice(0,4).toUpperCase(),initial:leader.name[0],players:mine});
    const stats=A.statsMap(s);
    if(nx.bonus) for(const pid of nx.team.players){const base=BC.PLAYERS[pid].stats;stats[pid]=Object.fromEntries(Object.entries(base).map(([k,v])=>[k,Math.min(BC.MAX_STAT,v+nx.bonus)]));}
    return {teams:[myTeam,nx.team],stats,difficulty:nx.difficulty,next:nx};
  };
  // Fin d'un match : expérience de mes joueurs, points gagnés, victoire ou défaite.
  A.record = (s, g) => {
    const won = g.winner === 0, report = [];
    for (const pid of s.team.inner.concat(s.team.outer)) {
      const xp = g.xp[pid] || 0, c = A.char(s, pid); c.matches++;
      const gained = A.addXp(s, pid, xp);
      report.push({ pid, xp, gained, points: c.points, next: A.nextCost(c), cur: c.xp });
    }
    if (won) { s.wins++; s.match++; } else s.losses++;
    A.save(s);
    return { won, report };
  };

  // ---------- Écrans ----------
  const U = BC.AdventureUI = {};
  const app = () => BC.app;
  let state = null;
  const cell = (filled, tier, title) => `<${filled ? 'b' : 'u'}${tier ? ` class="${tier}"` : ''}${title ? ` title="${title}"` : ''}></${filled ? 'b' : 'u'}>`;
  // Barre d'une stat sur 18 : dix cases normales, cinq dorées et trois rouges (effet spécial au survol), bouton + si on a des points.
  U.statRow = (key, v, o) => {
    o = o || {}; let cells = '';
    for (let i = 1; i <= BC.MAX_STAT; i++) { const tier = i >= 16 ? 'sp red' : i > 10 ? 'sp' : '', perk = BC.PERKS[key][i]; cells += cell(i <= v, tier, perk ? `${i} — ${perk.name} : ${perk.desc}` : `${BC.STAT_NAMES[key]} : ${i} / ${BC.MAX_STAT}`); }
    const plus = o.plus && v < BC.MAX_STAT ? `<button class="plus" data-stat="${key}" title="Ajouter un point">+</button>` : '';
    return `<span class="stat stat18" data-key="${key}"><i>${BC.STAT_NAMES[key]}</i>${cells}<em>${v}</em>${plus}</span>`;
  };
  U.statsHtml = (stats, o) => `<div class="stats">${BC.STAT_KEYS.map(k => U.statRow(k, stats[k], o)).join('')}</div>`;

  // Choisir librement une aventure ; chaque chef conserve sa progression.
  U.open = () => { state = null; U.pickLeader(); };
  U.pickLeader = () => {
    BC.ArcadeUI.pick({title:'Sélectionne ton joueur !',ids:A.allIds(),label:'Commencer l’aventure',back:()=>app().show('menu'),badge:id=>A.load(id)?'Aventure en cours':'',confirm:id=>{state=A.load(id)||A.start(id);A.save(state);U.hub();}});
  };

  U.hub = () => {
    if (!state) state = A.load();
    if (!state) { U.pickLeader(); return; }
    A.char(state, state.leader);
    BC.ArcadeUI.campaign(state, {
      compose: () => U.pickTeam(),
      back: () => U.open(),
      menu: () => app().show('menu'),
      reset: () => { if (confirm('Effacer uniquement l’aventure de ' + BC.PLAYERS[state.leader].name + ' et recommencer ?')) { const id=state.leader; A.reset(id); state=A.start(id); U.hub(); } }
    });
  };
  // Avant le match : trois à l'intérieur (le chef y est toujours), trois à l'extérieur.
  U.pickTeam = () => {
    const s=state;
    const role=id=>id===s.leader?'Chef · intérieur':s.team.inner.includes(id)?'Intérieur':s.team.outer.includes(id)?'Extérieur':'';
    const assign=(id,where)=>{if(id===s.leader)return;const list=s.team[where];if(where&& !list.includes(id)&&list.length>=3){BC.audio.play('bad');return;}s.team.inner=s.team.inner.filter(p=>p!==id);s.team.outer=s.team.outer.filter(p=>p!==id);if(where)s.team[where].push(id);A.save(s);};
    BC.ArcadeUI.pick({title:'Compose ton équipe !',ids:A.allIds(),initial:s.leader,label:'Voir l’affrontement',back:()=>U.hub(),stats:id=>s.chars[id]?.stats,badge:role,hint:'Choisis un portrait, puis sa place : 3 à l’intérieur et 3 à l’extérieur.',valid:()=>A.teamComplete(s),status:()=>`INTÉRIEUR ${s.team.inner.length}/3 · ${s.team.inner.map(id=>BC.PLAYERS[id].name).join(', ')}\nEXTÉRIEUR ${s.team.outer.length}/3 · ${s.team.outer.map(id=>BC.PLAYERS[id].name).join(', ')}`,actions:id=>id===s.leader?[]:[{label:'Intérieur',run:()=>assign(id,'inner')},{label:'Extérieur',run:()=>assign(id,'outer')},{label:'Retirer',run:()=>assign(id,null)}],confirm:()=>{if(!A.teamComplete(s))return;const m=A.buildMatch(s);app().startMatch({...m,ctrl:['p1','cpu'],mode:'adventure'});}});
  };
  // Après le match : expérience et points gagnés.
  U.result = g => {
    const s = state || A.load(); if (!s) return '';
    const r = A.record(s, g);
    let html = `<div class="cup-text">${r.won ? `Victoire ! Match n° ${s.match} gagné. Prochain adversaire : ${A.next(s).team.name}.` : 'Défaite… Tu peux réessayer ce match avec une autre équipe.'}</div><table class="xp-table"><tr><th>Joueur</th><th>XP gagnée</th><th>Prochain point</th><th>Points à placer</th></tr>`;
    for (const row of r.report) html += `<tr><td>${BC.PLAYERS[row.pid].name}</td><td>+${row.xp}</td><td>${row.cur} / ${row.next}</td><td>${row.gained ? `<b>+${row.gained} point${row.gained > 1 ? 's' : ''} !</b> ` : ''}${row.points ? `(${row.points} à placer)` : ''}</td></tr>`;
    return html + '</table>';
  };
})(window.BC);
