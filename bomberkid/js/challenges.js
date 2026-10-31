// Défis : des épreuves courtes classées par niveau (arènes de monstres avec chrono, matchs contre les bots) qui rapportent
// de l'or à toute la famille (cagnotte partagée bk.gold). La progression des défis est partagée elle aussi (bk.challenges) :
// la première réussite donne toute la récompense, les suivantes le quart.
(function (BK) {
  'use strict';
  const KEY = 'bk.challenges';
  BK.loadChallenges = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  BK.saveChallenges = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { } };
  BK.CHALLENGE_LEVELS = [null, { name: 'Facile', color: '#49e26a' }, { name: 'Moyen', color: '#3f9cff' }, { name: 'Difficile', color: '#ffd54a' }, { name: 'Expert', color: '#ff8a1f' }, { name: 'Légende', color: '#ff4d6d' }];
  // kind 'match' : les quatre styles de duel ; dans chacun, il faut battre toute la famille (or par adversaire vaincu la
  // première fois, bonus « reward » quand tout le monde y est passé). Les arènes à monstres (kind 'arena', un tableau par
  // monstre dans son biome) et le curling (kind 'curling') sont ajoutés par challenges-plus.js.
  BK.CHALLENGES = [
    { id: 'match1', level: 1, name: 'Duel d’échauffement', icon: '💣', desc: 'Un duel classique contre un adversaire facile. Une manche gagnante.', reward: 40, kind: 'match', foes: 1, botLevel: 'facile', rounds: 1, theme: 'arena' },
    { id: 'match2', level: 2, name: 'Duel à trois', icon: '💣', desc: 'Deux adversaires moyens. Une manche gagnante.', reward: 60, kind: 'match', foes: 2, botLevel: 'moyen', rounds: 1, theme: 'forest' },
    { id: 'match3', level: 3, name: 'Duel complet', icon: '💣', desc: 'Trois adversaires moyens, deux manches gagnantes.', reward: 90, kind: 'match', foes: 3, botLevel: 'moyen', rounds: 2, theme: 'random' },
    { id: 'match4', level: 4, name: 'Duel des champions', icon: '🏆', desc: 'Trois adversaires difficiles, deux manches gagnantes.', reward: 150, kind: 'match', foes: 3, botLevel: 'difficile', rounds: 2, theme: 'random' },
  ];
  BK.CHALLENGES.sort((a,b)=>a.level-b.level);
  BK.challengeMedal=score=>score>=850?{name:'Or',icon:'🥇',xp:150}:score>=600?{name:'Argent',icon:'🥈',xp:100}:{name:'Bronze',icon:'🥉',xp:50};
  BK.challengeScore=(ch,left,lives)=>{const time=Math.max(0,Math.min(1,left/(ch.time||1))),health=Math.max(0,Math.min(1,lives/(ch.lives||2)));return Math.max(300,Math.min(1000,Math.round(300+500*time+200*health)));};
  BK.matchChallengeScore=(ch,match)=>Math.round(300+500*Math.max(0,1-(match.elapsed||0)/(180*ch.rounds))+200*ch.rounds/Math.max(ch.rounds,match.round));
  // Estimation si l’épreuve est remportée maintenant ; 849,5 est arrondi à 850 points.
  BK.challengeProgress=(ch,run)=>{
    let score,seconds,possible,silverSeconds;
    if(ch.kind==='match'){
      const human=run.players.findIndex(p=>p.humanMap===0),remaining=Math.max(1,ch.rounds-(run.wins[human]||0));
      const round=Math.max(ch.rounds,run.round+remaining-1),bonus=200*ch.rounds/round;
      score=BK.matchChallengeScore(ch,{round,elapsed:run.elapsed});possible=800+bonus>=849.5;
      seconds=180*ch.rounds*(1-(849.5-300-bonus)/500)-(run.elapsed||0);
      silverSeconds=180*ch.rounds*(1-(599.5-300-bonus)/500)-(run.elapsed||0);
    }else{
      const bonus=200*Math.max(0,Math.min(1,run.lives/(ch.lives||2)));
      score=BK.challengeScore(ch,run.timeLeft,run.lives);possible=800+bonus>=849.5;
      seconds=run.timeLeft-(ch.time||0)*(849.5-300-bonus)/500;
      silverSeconds=run.timeLeft-(ch.time||0)*(599.5-300-bonus)/500;
    }
    return {score,medal:BK.challengeMedal(score),goldSeconds:Math.max(0,seconds),goldPossible:possible,silverSeconds:Math.max(0,silverSeconds)};
  };
  BK.updateChallengeFeedback=(ch,run,dt)=>{
    const info=BK.challengeProgress(ch,run),f=run.medalFeedback||(run.medalFeedback={time:0,warned:false,previous:info.medal.name,transition:0});
    f.time+=dt;f.transition=Math.max(0,f.transition-dt);
    if(!f.warned&&info.medal.name==='Or'&&info.goldSeconds>0&&info.goldSeconds<=10){f.warned=true;BK.audio.medalWarning();}
    if(!f.silverWarned&&info.medal.name==='Argent'&&info.silverSeconds>0&&info.silverSeconds<=10){f.silverWarned=true;BK.audio.medalWarning();}
    if((f.previous==='Or'&&info.medal.name==='Argent')||(f.previous==='Argent'&&info.medal.name==='Bronze')){f.transition=.8;f.from=f.previous==='Or'?'🥇':'🥈';f.to=info.medal.icon;if(info.medal.name==='Bronze')BK.audio.medalDrop();}
    f.previous=info.medal.name;
  };
  BK.drawChallengeProgress=(ctx,ch,run,y=90)=>{
    const info=BK.challengeProgress(ch,run),w=280,h=54,x=BK.W/2-w/2;
    const color=info.medal.name==='Or'?'#d9a21b':info.medal.name==='Argent'?'#8fa2bd':'#b2652b';
    const seconds=Math.ceil(info.medal.name==='Or'?info.goldSeconds:info.silverSeconds),clock=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
    ctx.save();BK.sprites.uiPanel(ctx,x,y,w,h,{border:color});
    const feedback=run.medalFeedback,reduced=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const warning=info.medal.name!=='Bronze'&&seconds>0&&seconds<=10,u=feedback?.transition>0?1-feedback.transition/.8:1;
    ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='28px sans-serif';
    ctx.save();
    if(warning&&!reduced)ctx.globalAlpha=.72+.28*Math.cos((feedback?.time||0)*Math.PI*2/1.4);
    if(u<1&&!reduced){
      // Petit retournement du ruban, puis l’argent se pose sans secousse de l’écran.
      ctx.translate(x+26,y+26-Math.sin(u*Math.PI)*5);ctx.scale(Math.max(.12,Math.abs(Math.cos(u*Math.PI))),1);
      ctx.fillText(u<.5?(feedback.from||'🥇'):(feedback.to||'🥈'),-14,0);
    }else ctx.fillText(info.medal.icon,x+12,y+26);
    ctx.restore();
    ctx.font='900 15px Nunito,sans-serif';ctx.fillStyle=color;ctx.fillText(info.medal.name+' estimé · '+info.score+' / 1 000',x+54,y+17,w-64);
    ctx.font='bold 13px Nunito,sans-serif';ctx.fillStyle=seconds>0&&seconds<=10?BK.sprites.UI.bad:BK.sprites.UI.text;ctx.fillText(info.medal.name==='Or'?'⏱ Encore '+clock+' pour l’or':info.medal.name==='Argent'?'⏱ Encore '+clock+' pour l’argent':'🥉 Bronze · termine la mission !',x+54,y+38,w-64);ctx.restore();
  };
  BK.awardChallenge=(ch,score,charId,save)=>{
    save=save||BK.loadAdventure(charId);const gold=BK.completeChallenge(ch,score),medal=BK.challengeMedal(score),records=save.challengeRecords||(save.challengeRecords={}),old=records[ch.id],xp=Math.round(medal.xp*ch.level*(old?.done ? .25 : 1)),before=BK.levelFromXp(save.xp||0).level;
    save.xp=(save.xp||0)+xp;const level=BK.levelFromXp(save.xp).level;save.points=(save.points||0)+level-before;save.gold=BK.loadGold();records[ch.id]={done:(old?.done||0)+1,best:Math.max(old?.best||0,score)};BK.saveAdventure(charId,save);return {gold,medal,xp,level};
  };
  BK.challengeResultHtml=(ch,score,reward)=>'<p class="big">'+reward.medal.icon+' '+reward.medal.name+' · '+score+' / 1 000</p><p>+'+reward.xp+' XP · Niveau '+reward.level+'</p><p><i class="goldcoin"></i> +'+reward.gold+' pièces d’or</p><p>'+ch.name+'</p>';
  BK.nextChallenge = ch => BK.CHALLENGES[BK.CHALLENGES.indexOf(ch) + 1] || null;
  BK.challengeReward = (ch, prog) => { const p = (prog || BK.loadChallenges())[ch.id]; return p && p.done ? Math.max(5, Math.round(ch.reward / 4)) : ch.reward; };
  BK.completeChallenge = (ch, score) => { const prog = BK.loadChallenges(), p = prog[ch.id] || { done: 0, best: 0 }, gold = BK.challengeReward(ch, prog); if(p.scoreVersion!==2){p.legacyBest=p.best||0;p.best=0;}p.scoreVersion=2;p.medal=BK.challengeMedal(Math.max(p.best||0,score||0)).name;p.done++; p.best = Math.max(p.best || 0, score || 0); prog[ch.id] = p; BK.saveChallenges(prog); BK.addGold(gold); return gold; };
  // Générateur pseudo-aléatoire à graine : un même défi donne toujours la même arène.
  const rng = seed => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  // Arène : bordure de roc, piliers un sur deux, buissons et blocs cubiques au hasard (jamais près du départ), monstres loin
  // du départ (les orques collés à leur shaman si « group »), carottes plantées.
  BK.challengeStage = ch => {
    if(ch.kind==='timing')return {id:'Défi',name:ch.name,world:{name:'Défis',theme:ch.theme},theme:ch.theme,explore:true,objective:'timing',items:0,hint:ch.desc,map:['#############','#...........#','#...........#','#.1.........#','#...........#','#...........#','#############']};
    const R = rng(ch.id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)), cols = ch.cols, rows = ch.rows, g = [], props = {}, enemies = [];
    for (let r = 0; r < rows; r++) { const line = []; for (let c = 0; c < cols; c++) line.push(c === 0 || r === 0 || c === cols - 1 || r === rows - 1 || (c % 2 === 0 && r % 2 === 0) ? '#' : '.'); g.push(line); }
    const start = { c: 1, r: rows - 2 }; g[start.r][start.c] = '1'; const far = (c, r) => Math.abs(c - start.c) + Math.abs(r - start.r);
    const cubes = ['melon', 'cheese', 'gift', 'dirtblock'];
    for (let r = 1; r < rows - 1; r++) for (let c = 1; c < cols - 1; c++) { if (g[r][c] !== '.' || far(c, r) <= 2) continue; if (R() < (ch.soft || 0)) { if (R() < 0.5) g[r][c] = 'x'; else { g[r][c] = '"'; props[c + ',' + r] = { deco: cubes[Math.floor(R() * cubes.length)] }; } } }
    const cells = []; for (let r = 1; r < rows - 1; r++) for (let c = 1; c < cols - 1; c++) if (g[r][c] === '.' && far(c, r) >= 5) cells.push({ c, r });
    const take = near => { let pool = near ? cells.filter(q => Math.abs(q.c - near.c) + Math.abs(q.r - near.r) <= 2) : cells; if (!pool.length) pool = cells; if (!pool.length) return null; const q = pool[Math.floor(R() * pool.length)]; cells.splice(cells.indexOf(q), 1); return q; };
    let anchor = null;
    for (const [type, n] of ch.enemies || []) for (let i = 0; i < n; i++) { const q = take(ch.group && anchor ? anchor : null); if (!q) break; if (type === 'shaman') anchor = q; enemies.push({ type, c: q.c, r: q.r }); }
    for (let i = 0; i < (ch.carrots || 0); i++) { const q = take(null); if (!q) break; g[q.r][q.c] = '"'; props[q.c + ',' + q.r] = { deco: 'carrot' }; }
    const s = BK.mapToStage({ id: 'defi-' + ch.id, name: ch.name, cols, rows, theme: ch.theme, base: '.', grid: g.map(l => l.join('')), enemies, props, houses: {}, npcs: [], shop: [] });
    s.id = 'Défi'; s.hint = ch.desc; s.world = { name: 'Défis', theme: ch.theme }; s.items = 0.3; return s;
  };
  const result = (charId, ch, won, score, extra) => {
    const next = BK.nextChallenge(ch);
    if (won) { const reward=BK.awardChallenge(ch,score,charId); BK.audio.win(); BK.overlay.show({ title: 'Défi réussi !', html: BK.challengeResultHtml(ch,score,reward), buttons: [...(next ? [{ label: 'Défi suivant : ' + next.name, primary: true, onClick: () => { BK.overlay.hide(); BK.startChallenge(charId, next); } }] : []), { label: 'Retour aux défis', primary: !next, onClick: () => { BK.overlay.hide(); BK.showChallenges(charId); } }, { label: 'Menu', onClick: () => { BK.overlay.hide(); BK.toMenu(); } }] }); }
    else { BK.audio.lose(); BK.overlay.show({ title: 'Défi raté', text: (extra || '') + ' On réessaie ?', buttons: [{ label: 'Réessayer', primary: true, onClick: () => { BK.overlay.hide(); BK.startChallenge(charId, ch); } }, { label: 'Retour aux défis', onClick: () => { BK.overlay.hide(); BK.showChallenges(charId); } }] }); }
  };
  // Duel remporté : chaque adversaire vaincu pour la première fois dans ce style rapporte de l'or ; tout le monde vaincu = bonus.
  const duelResult = (charId, ch, foes, score) => {
    const reward = BK.awardDuel(ch, score, charId, foes), next = BK.nextChallenge(ch);
    BK.audio.win(); BK.overlay.show({ playful: 'challenge', title: reward.first ? '🏆 Style complété !' : 'Duel remporté !', html: BK.duelResultHtml(ch, score, reward), buttons: [
      ...(reward.complete ? [] : [{ label: 'Prochains adversaires →', primary: true, onClick: () => { BK.overlay.hide(); BK.startChallenge(charId, ch, { foes: BK.defaultDuelFoes(charId, ch) }); } }]),
      ...(next ? [{ label: 'Défi suivant : ' + next.name, primary: !!reward.complete, onClick: () => { BK.overlay.hide(); BK.startChallenge(charId, next); } }] : []),
      { label: 'Retour aux défis', onClick: () => { BK.overlay.hide(); BK.showChallenges(charId); } }, { label: 'Menu', onClick: () => { BK.overlay.hide(); BK.toMenu(); } }] });
  };
  // opts.foes : adversaires choisis d'un duel ; opts.players : les quatre joueurs du curling en famille.
  BK.startChallenge = (charId, ch, opts) => {
    BK.editor = null; opts = opts || {};
    if (ch.kind === 'match') {
      const foes = (opts.foes && opts.foes.length === ch.foes ? opts.foes : BK.defaultDuelFoes(charId, ch)), players = [{ charId, human: 0 }, ...foes.map(id => ({ charId: id, human: null, level: ch.botLevel }))];
      BK.show('game'); BK.current = new BK.Match({ challenge:ch, players, roundsToWin: ch.rounds, theme: ch.theme, onResult: champ => { const score = BK.matchChallengeScore(ch,BK.current); if (champ.humanMap === 0) duelResult(charId, ch, foes, score); else result(charId, ch, false, score, champ.name + ' remporte le duel.'); return true; } });
      return;
    }
    if (ch.kind === 'curling') { BK.show('game'); BK.current = new BK.Curling(charId, ch, { players: ch.family ? (opts.players && opts.players.length === 4 ? opts.players : [charId, ...BK.duelOthers(charId).slice(0, 3)]) : [charId] }); return; }
    BK.show('game'); BK.current = new BK.Adventure(charId, 0, { custom: BK.challengeStage(ch), challenge: ch });
  };
  BK.CHALLENGE_ISLANDS=[
    {kind:'arena',name:'Monstres',icon:'👾',hint:'Attrape les petits monstres !',color:'#79db88'},
    {kind:'match',name:'Duels',icon:'💣',hint:'Bats toute la famille, 3 cœurs chacun !',color:'#ffbc72'},
    {kind:'curling',name:'Bon timing',icon:'🥌',hint:'Fais glisser ta bombe sur la cible !',color:'#b9a0ff'}
  ];
  BK.challengeIslandPreview=(canvas,kind,charId)=>{
    const maps={arena:['       ',' ,T,,, ',' ,#x#, ',' ,,,,, ',' ,x,#, ',' ,,,,, ','       '],match:['       ',' .#.#. ',' ..... ',' .#.#. ',' ..... ',' .#.#. ','       '],curling:['       ',' ))]]] ',' ))]]] ',' ))]]] ',' ))]]] ',' nn))) ','       ']};
    const W=new BK.World({map:maps[kind]||maps.arena,theme:kind==='match'?'castle':kind==='curling'?'winter':'garden',mode:'adventure',explore:true,hearts:true,itemChance:0});W.frozen=true;W.time=25;
    if(kind==='curling')W.timingTarget={c:4,r:2};
    if(kind==='arena'){W.addEnemy('ballon',2,3);W.addEnemy('gluant',4,4);}
    else{W.addPlayer(BK.charById(charId),2,4);if(kind==='match')W.addPlayer(BK.charById(charId==='eliott'?'adam':'eliott'),4,2);}
    const preview={cam:new BK.Camera(BK.W,BK.H),t:0},ctx=canvas.getContext('2d'),cam=preview.cam;
    cam.target={x:W.cols/2,y:W.rows/2+.3};cam.dist=13.5;cam.ox=640-BK.W/2;cam.oy=320-BK.H/2;
    const bounds=[[1,1,3],[6,1,3],[1,6,0],[6,6,0],[3.5,3.5,-9]].map(p=>cam.project(...p)),minX=Math.min(...bounds.map(p=>p.x))-25,maxX=Math.max(...bounds.map(p=>p.x))+25,minY=Math.min(...bounds.map(p=>p.y))-15,maxY=Math.max(...bounds.map(p=>p.y))+70;
    const fit=Math.min(canvas.width/(maxX-minX),canvas.height/(maxY-minY));ctx.save();ctx.translate((canvas.width-(maxX-minX)*fit)/2,(canvas.height-(maxY-minY)*fit)/2);ctx.scale(fit,fit);ctx.translate(-minX,-minY);
    BK.WorldSelect.prototype.drawIsland.call(preview,ctx,W,640,320,2,false,{});ctx.restore();
  };
  BK.showChallenges = (charId,kind) => {
    if (typeof document === 'undefined') return;
    BK.current=null;BK.show('challenges');const prog=BK.loadChallenges(),el=document.getElementById('challenge-list'),sub=document.getElementById('challenge-sub'),heading=document.getElementById('challenges-title');el.replaceChildren();
    const group=BK.CHALLENGE_ISLANDS.find(g=>g.kind===kind);
    el.className=group?'challenge-trials':'challenge-islands';
    heading.textContent=group?group.icon+' '+group.name:'Les îles des défis';
    sub.textContent=group?'Choisis ton défi !':'Sur quelle île veux-tu jouer ?';
    if(!group)for(const [i,g] of BK.CHALLENGE_ISLANDS.entries()){
      const list=BK.CHALLENGES.filter(ch=>ch.kind===g.kind),done=list.filter(ch=>prog[ch.id]?.done).length,b=document.createElement('button');b.className='challenge-island';b.style.setProperty('--island-color',g.color);b.style.setProperty('--enter-delay',i*90+'ms');
      const canvas=document.createElement('canvas');canvas.width=400;canvas.height=500;canvas.setAttribute('aria-hidden','true');b.append(canvas);
      const title=document.createElement('strong');title.textContent=g.name;const hint=document.createElement('span');hint.textContent=g.hint;const stars=document.createElement('small');stars.textContent='⭐ '+done+' / '+list.length;
      b.append(title,hint,stars);b.onclick=()=>{BK.audio.click();BK.showChallenges(charId,g.kind);};el.append(b);BK.challengeIslandPreview(canvas,g.kind,charId);
    }
    if(group)for(const [i,ch] of BK.CHALLENGES.filter(ch=>ch.kind===kind).entries()){
      const p=prog[ch.id],b=document.createElement('button');b.className='challenge-trial';b.style.setProperty('--enter-delay',Math.min(i,7)*55+'ms');
      const medal=p?.scoreVersion===2&&p.best?BK.challengeMedal(p.best).icon:p?.done?'⭐':ch.icon;
      const duel=ch.kind==='match'?BK.duelProgress(ch,charId,prog):null;
      b.innerHTML='<span class="trial-icon">'+medal+'</span><strong>'+ch.name+'</strong><span>'+BK.CHALLENGE_LEVELS[ch.level].name+(ch.monster?' · '+(BK.ENEMIES[ch.monster]?.name||'')+'':'')+'</span><small>'+(duel?'👥 '+duel.count+' / '+duel.total+' vaincus · <i class="goldcoin sm"></i> '+BK.DUEL_FOE_GOLD[ch.level]+' chacun':'<i class="goldcoin sm"></i> '+BK.challengeReward(ch,prog))+'</small>';
      b.onclick=()=>{BK.audio.click();
        if(ch.kind==='match')return BK.pickDuelFoes(charId,ch);
        if(ch.kind==='curling'&&ch.family)return BK.pickCurlingFamily(charId,ch);
        BK.overlay.show({playful:'challenge',title:ch.icon+' '+ch.name,html:'<p class="challenge-instruction">'+ch.desc+'</p><p>🥉 🥈 🥇 Gagne ta médaille !</p><details><summary>Mes récompenses</summary><p><i class="goldcoin sm"></i> '+BK.challengeReward(ch,prog)+' pièces d’or · XP selon ta médaille</p>'+(p?.scoreVersion===2?'<p>Record : '+p.best+' points</p>':'')+'</details>',buttons:[{label:'← Retour',onClick:()=>BK.overlay.hide()},{label:'C’est parti ! →',primary:true,onClick:()=>{BK.overlay.hide();BK.startChallenge(charId,ch);}}]});};el.append(b);
    }
    const back=document.getElementById('challenge-back');back.textContent=group?'← Les îles':'← Accueil';back.onclick=()=>{BK.audio.click();group?BK.showChallenges(charId):BK.toMenu();};
  };
})(window.BK);
