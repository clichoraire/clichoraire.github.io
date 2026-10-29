// Mode Aventure : un chef choisi parmi toute la famille, une équipe de six montée avant chaque match, de l'expérience
// (dégâts infligés + bonus K.-O.) qui donne des points de stat à placer (0 à 10, puis 11 à 15 en jaune et 16 à 18 en rouge).
// Sauvegarde dans localStorage (bc.adventure). Logique ici ; les écrans sont dans BC.AdventureUI (plus bas).
(function (BC) {
  'use strict';
  const KEY = 'bc.adventure';
  const A = BC.Adventure = {};
  A.DIFFICULTIES=['Facile','Moyen','Difficile','Dangereux','Impossible'];
  A.XP_MULTIPLIERS=[1,1.5,2,3,4];
  A.STAT_BONUSES=BC.MONSTER_STAT_BONUSES||[0,2,4,8,14];

  A.load = leader => {
    try {
      const saved = leader ? JSON.parse(localStorage.getItem(KEY + '.' + leader) || 'null') : null;
      const legacy = JSON.parse(localStorage.getItem(KEY) || 'null');
      const data = saved || (legacy && (!leader || legacy.leader === leader) ? legacy : null);
      if(data?.chars){let changed=false;for(const [id,c] of Object.entries(data.chars))changed=A.normalizeStats(id,c)||changed;if(changed)A.save(data);}
      if(data&&data.bosses==null)data.bosses=Math.floor(data.match/3);
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
  A.selectedHero = s => s && [...s.team.inner,...s.team.outer].includes(s.activeHero) ? s.activeHero : s?.leader;
  A.selectHero = (s,pid) => {if(!s||![...s.team.inner,...s.team.outer].includes(pid))return false;s.activeHero=pid;A.char(s,pid);A.save(s);return true;};
  A.start = leader => A.save({ leader, chars: {}, match: 0, bosses: 0, wins: 0, losses: 0, team: { inner: [leader], outer: [] }, created: Date.now() });
  // Fiche d'aventure d'un personnage (créée à la demande avec ses stats de base).
  A.char = (s, pid) => {
    if (!s.chars[pid]) s.chars[pid] = { stats: Object.assign({}, BC.PLAYERS[pid].stats), xp: 0, points: 0, earned: 0, matches: 0, kos: 0, totalXp: 0 };
    A.normalizeStats(pid,s.chars[pid]);
    return s.chars[pid];
  };
  A.statsMap = s => Object.fromEntries(Object.entries(s.chars).map(([pid, c]) => [pid, c.stats]));
  A.level = c => 1 + Math.max(0, Number(c?.earned) || 0);
  A.statCap=()=>BC.MAX_STAT;
  A.upgradeCost=(c,key)=>key==='life'?1+Math.floor((c.stats.lifeBonus||0)/10):!BC.STAT_KEYS.includes(key)||c.stats[key]>=BC.MAX_STAT?Infinity:[1,1,1,1,2,2,3,3,5,5,8,8,12,12,18,18,25,25][c.stats[key]];
  A.normalizeStats=(pid,c)=>{if(!BC.PLAYERS[pid]||!c?.stats)return false;let migrated=false;if(!Number.isFinite(c.stats.precision)){c.stats.precision=BC.PLAYERS[pid].stats.precision??6;migrated=true;}let refund=0;for(const key of BC.STAT_KEYS){const cap=A.statCap(pid,c,key);if(c.stats[key]>cap){refund+=c.stats[key]-cap;c.stats[key]=cap;}}if(refund)c.points=(c.points||0)+refund;return migrated||refund>0;};
  A.nextCost = c => BC.xpForPoint(c.earned);
  // Ajoute de l'expérience ; à chaque palier, un point à placer. Renvoie le nombre de points gagnés.
  A.addXp = (s, pid, n) => {
    const c = A.char(s, pid); c.xp += n; c.totalXp += n; let gained = 0;
    while (c.xp >= A.nextCost(c)) { c.xp -= A.nextCost(c); c.earned++; c.points++; gained++; }
    return gained;
  };
  A.spend = (s, pid, key) => { const c = A.char(s, pid); const cost=A.upgradeCost(c,key); if (!Number.isFinite(cost)||c.points < cost) return false; if(key==='life')c.stats.lifeBonus=(c.stats.lifeBonus||0)+1;else c.stats[key]++; c.points-=cost; A.save(s); return true; };
  A.allIds = () => [...new Set(BC.TEAMS.flatMap(t => t.players))].filter(id => !BC.PLAYERS[id].monster);
  A.familyOf = pid => BC.TEAMS.find(t => t.players.includes(pid));
  // Douze rencontres par chapitre ; difficulté choisie séparément pour chaque match.
  A.next = s => {
    const count=BC.MONSTER_TEAMS.length, stage=s.match%count,tier=Math.floor(s.match/count);
    const due=s.match>0&&s.match%3===0&&(s.bosses??Math.floor(s.match/3))<Math.floor(s.match/3);
    const team=due?BC.BOSS_TEAMS[(Math.floor(s.match/3)-1)%4]:BC.MONSTER_TEAMS[stage];
    return {index:s.match,stage:due?((s.match-1)%12)+1:stage+1,chapter:due?Math.floor((s.match-1)/12)+1:tier+1,team,boss:due,difficulty:0,bonus:0,tier};
  };

  A.teamComplete = s => {
    const ids=s.team.inner.concat(s.team.outer), allowed=new Set(A.allIds());
    return s.team.inner.length===BC.INNER && s.team.outer.length===BC.OUTER && s.team.inner[0]===s.leader && new Set(ids).size===6 && ids.every(id=>allowed.has(id));
  };
  // Toute la famille peut jouer ensemble ; aucun cousin n'est prêté aux monstres.
  A.beaten=(s,team)=>Object.keys(s.clears?.[team.id]||{}).length>0 || (team.boss ? (s.bosses||0)>BC.BOSS_TEAMS.indexOf(team) : s.match>BC.MONSTER_TEAMS.indexOf(team));
  A.difficultyUnlocked=(s,difficulty)=>difficulty<3 || [...BC.MONSTER_TEAMS,...BC.BOSS_TEAMS].every(team=>(s.clears?.[team.id]?.[difficulty-1]||0)>0);
  A.difficultyRequirement=difficulty=>'Gagne les 12 équipes et les 4 boss en '+A.DIFFICULTIES[difficulty-1]+'.';
  A.resolve=(s,choice={})=>{
    const next=A.next(s),team=choice.teamId?[...BC.MONSTER_TEAMS,...BC.BOSS_TEAMS].find(t=>t.id===choice.teamId):next.team;
    if(!team)throw new Error('Adversaire inconnu.');
    const replay=!!choice.replay||team.id!==next.team.id;
    if(replay&&!A.beaten(s,team))throw new Error('Cet adversaire n’est pas encore débloqué.');
    if(!replay&&team.id!==next.team.id)throw new Error('Rencontre indisponible.');
    const difficulty=choice.difficulty??0;
    if(!Number.isInteger(difficulty)||difficulty<0||difficulty>4)throw new Error('Difficulté invalide.');
    if(!A.difficultyUnlocked(s,difficulty))throw new Error(A.difficultyRequirement(difficulty));
    return {teamId:team.id,team,replay,difficulty,xpMultiplier:A.XP_MULTIPLIERS[difficulty],revealed:A.beaten(s,team),frontierMatch:s.match,frontierBosses:s.bosses||0};
  };
  A.buildMatch = (s,choice={}) => {
    if (!A.teamComplete(s)) throw new Error('Choisis six personnages de la famille, dont ton chef.');
    const selected=A.resolve(s,choice),nx={...A.next(s),...selected},mine=s.team.inner.concat(s.team.outer),leader=BC.PLAYERS[s.leader],fam=A.familyOf(s.leader);
    const myTeam={...fam,id:'aventure',name:'Équipe '+leader.name,short:leader.name.slice(0,4).toUpperCase(),initial:leader.name[0],players:mine};
    const stats=A.statsMap(s),enemy=BC.monsterRoster(selected.team,selected.difficulty);
    for(const pid of enemy.players)stats[pid]=BC.monsterStats(pid,selected.difficulty);
    const {team,...adventure}=selected;
    return {teams:[myTeam,enemy],stats,difficulty:selected.difficulty,next:nx,adventure};
  };
  // Les récompenses se basent sur le match réellement joué, pas sur la prochaine étape.
  A.record = (s, g) => {
    if(g.adventureReport)return g.adventureReport;
    const won=g.winner===0,report=[],ctx=g.adventure||{difficulty:Math.min(4,g.difficulty||0),replay:false},difficulty=ctx.difficulty,multiplier=A.XP_MULTIPLIERS[difficulty]||1;
    const roster=g.teams[0].players.filter(id=>A.allIds().includes(id));
    for(const pid of roster){
      const c=A.char(s,pid),beforeXp=c.xp,beforeEarned=c.earned,baseXp=g.xp[pid]||0,participation=won?8:2,xp=Math.round((baseXp+participation)*multiplier);c.matches++;
      const gained=A.addXp(s,pid,xp);report.push({pid,xp,baseXp,participation,beforeXp,beforeEarned,gained,points:c.points,next:A.nextCost(c),cur:c.xp});
    }
    if(won){
      s.wins++;s.clears=s.clears||{};const wins=s.clears[g.teams[1].id]||(s.clears[g.teams[1].id]={});wins[difficulty]=(wins[difficulty]||0)+1;
      // Une revanche ne fait avancer ni les étapes ni le compteur des boss.
      if(!ctx.replay&&g.teams[1].id===A.next(s).team.id){if(g.teams[1].boss)s.bosses=(s.bosses||0)+1;else s.match++;}
    }else s.losses++;
    A.save(s);return g.adventureReport={won,report,replay:!!ctx.replay,difficulty,multiplier};
  };

  // ---------- Écrans ----------
  const U = BC.AdventureUI = {};
  const app = () => BC.app;
  let state = null, challenge = {};
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
    BC.ArcadeUI.pick({title:'Sélectionne ton joueur !',ids:A.allIds(),label:'Commencer l’aventure',level:id=>A.level(A.load(id)?.chars[id]),stats:id=>A.load(id)?.chars[id]?.stats,back:()=>app().show('menu'),badge:id=>A.load(id)?'Aventure en cours':'',confirm:id=>{state=A.load(id)||A.start(id);A.save(state);U.hub();}});
  };

  U.resume = leader => { state=A.load(leader); U.hub(); };
  U.hub = () => {
    if (!state) state = A.load();else state=A.load(state.leader)||state;
    if (!state) { U.pickLeader(); return; }
    A.char(state, state.leader);
    BC.ArcadeUI.campaign(state, {
      choice:challenge,
      // La difficulté peut encore changer sur l'écran d'affrontement : rebuild recompose le match et mémorise le choix.
      prepare: choice => {const build=c=>{challenge=c;return {...A.buildMatch(state,c),ctrl:['p1','cpu'],mode:'adventure',rebuild:d=>build({...c,difficulty:d})};};app().startMatch(build(choice));},
      compose: () => U.setupMatch(),
      manage: () => U.pickTeam(),
      replay: teamId => U.setupMatch({teamId,replay:true}),
      back: () => U.open(),
      menu: () => app().show('menu'),
      reset: () => { if (confirm('Effacer uniquement l’aventure de ' + BC.PLAYERS[state.leader].name + ' et recommencer ?')) { const id=state.leader; A.reset(id); state=A.start(id); U.hub(); } }
    });
  };
  U.setupMatch=(choice=challenge)=>{if(!A.teamComplete(state)){U.hub();return;}challenge=choice||{};BC.ArcadeUI.challenge(state,challenge,{back:()=>U.hub(),confirm:selection=>{challenge=selection;const m=A.buildMatch(state,challenge);app().startMatch({...m,ctrl:['p1','cpu'],mode:'adventure'});}});};
  // Avant le match : trois à l'intérieur (le chef y est toujours), trois à l'extérieur.
  U.pickTeam = () => {
    state=state?(A.load(state.leader)||state):A.load();if(!state){U.pickLeader();return;}
    const s=state;
    const role=id=>id===s.leader?'Chef · intérieur':s.team.inner.includes(id)?'Intérieur':s.team.outer.includes(id)?'Extérieur':'';
    const assign=(id,where)=>{if(id===s.leader)return;const list=s.team[where];if(where&& !list.includes(id)&&list.length>=3){BC.audio.play('bad');return;}s.team.inner=s.team.inner.filter(p=>p!==id);s.team.outer=s.team.outer.filter(p=>p!==id);if(where)s.team[where].push(id);A.save(s);};
    BC.ArcadeUI.composeTeam(s,{assign,back:()=>U.hub(),save:()=>{if(A.teamComplete(s)){A.save(s);U.hub();}}});
  };
  // Après le match : expérience et points gagnés.
  U.result = g => {
    const s = state || A.load(); if (!s) return '';
    const r = A.record(s, g);
    let html = `<p class="result-story">${r.won?(r.replay?'Revanche gagnée !':'Victoire !'):'Une revanche t’attend !'} · ${A.DIFFICULTIES[r.difficulty]} · XP ×${r.multiplier}</p><section class="result-rewards" aria-label="Expérience et progression"><h2>Les récompenses de ton équipe</h2><p class="reward-formula">XP du match + ${r.won?8:2} XP de participation par héros, multipliées par ${r.multiplier}.</p><div class="reward-cards">`;
    for (const row of r.report) html += `<article data-xp-before="${row.beforeXp}" data-earned-before="${row.beforeEarned}" data-xp-gain="${row.xp}" class="reward-card${row.gained?' leveled-up':''}"><canvas width="90" height="90" data-reward-face="${row.pid}" aria-label="${BC.PLAYERS[row.pid].name}"></canvas><div class="reward-info"><h3>${BC.PLAYERS[row.pid].name}</h3><span class="reward-level">Niveau ${A.level(s.chars[row.pid])}</span><strong class="reward-earned">+<span data-earned="${row.xp}">${row.xp}</span> XP</strong><progress value="${row.cur}" max="${row.next}" aria-label="Expérience de ${BC.PLAYERS[row.pid].name}"></progress><small>${row.cur} / ${row.next} XP · prochain point</small><p class="reward-points">${row.gained?`★ +${row.gained} point${row.gained>1?'s':''} gagné${row.gained>1?'s':''} ! · `:''}${row.points} à placer</p></div></article>`;
    return html + '</div></section>';
  };
})(window.BC);
