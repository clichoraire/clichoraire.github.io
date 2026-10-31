// Défis « plus » : arènes par monstre (biome, monstres reliés, pas de plantage), duels contre toute la famille (or par
// adversaire vaincu la première fois, bonus quand tout le monde y est passé), trois cœurs en match, curling solo et en famille.
const assert=require('node:assert/strict'),BK=require('./headless');
BK.audio=new Proxy(BK.audio||{},{get:(t,k)=>k in t?t[k]:()=>{}});
BK.show=()=>{};

// ---- arènes à monstres : un tableau par monstre, biome assorti, monstres tous reliés au héros
const arenas=BK.CHALLENGES.filter(ch=>ch.kind==='arena');
assert(arenas.length>=30,'un tableau par monstre : '+arenas.length);
assert(arenas.every(ch=>ch.biome&&BK.ARENA_BIOMES[ch.biome]),'chaque arène a un biome connu');
const byMonster={cracheurs:'lava',glaceurs:'winter',fantomes:'castle',serpents:'desert',ballons:'garden'};
for(const ch of arenas){
 const s=BK.challengeStage(ch);
 assert.equal(s.map.length,ch.rows);assert(s.map.every(l=>l.length===ch.cols),'largeur '+ch.id);
 if(byMonster[ch.id])assert.equal(s.theme,byMonster[ch.id],'thème assorti pour '+ch.id);
 const expected=ch.enemies.reduce((a,[,n])=>a+n,0);
 assert.equal(s.enemies.length,expected,'tous les monstres placés dans '+ch.id);
 const a=new BK.Adventure('adam',0,{custom:s,challenge:ch});a.state='play';a.world.frozen=false;
 assert.equal(a.world.livingEnemies().length,expected,'monstres vivants dans '+ch.id);
 for(let i=0;i<180;i++)a.update(1/60);   // trois secondes sans plantage
 assert.equal(a.state,'play',ch.id+' tourne');
 if(ch.id==='fantomes')assert(a.world.isNight(),'le cimetière commence de nuit');
}
// la lave et l'eau tiennent compte du biome
const forge=BK.challengeStage(BK.CHALLENGES.find(c=>c.id==='rouges'));assert(forge.map.some(l=>l.includes('[')),'de la lave dans la forge');
const lagoon=BK.challengeStage(BK.CHALLENGES.find(c=>c.id==='marins'));assert(lagoon.map.some(l=>l.includes('~')),'de l’eau dans le lagon');
assert(lagoon.enemies.every(e=>lagoon.map[e.r][e.c]==='~'),'les monstres marins sont dans l’eau');
const crypt=BK.challengeStage(BK.CHALLENGES.find(c=>c.id==='fantomes'));assert(Object.values(crypt.props).some(p=>/^crypt_/.test(p.deco||'')),'décor de crypte');
// un biome identique donne toujours la même arène
assert.deepEqual(BK.challengeStage(BK.CHALLENGES.find(c=>c.id==='gluants')).map,BK.challengeStage(BK.CHALLENGES.find(c=>c.id==='gluants')).map);

// ---- duels : trois cœurs, puis battre toute la famille
const m1=BK.CHALLENGES.find(c=>c.id==='match1'),m3=BK.CHALLENGES.find(c=>c.id==='match3');
const match=new BK.Match({players:[{charId:'adam',human:0},{charId:'milo',human:null,level:'facile'}],roundsToWin:1,theme:'arena'});
const [me,foe]=match.players;match.world.frozen=false;assert.equal(me.hp,30);assert(match.world.hearts,'le match a des cœurs');
match.world.hitPlayer(me,{kind:'flame',owner:foe});assert.equal(me.hp,20);assert(me.alive,'un coup = un cœur, on reste en vie');
me.invuln=0;match.world.hitPlayer(me,{kind:'flame',owner:foe});me.invuln=0;match.world.hitPlayer(me,{kind:'flame',owner:foe});assert(!me.alive,'trois coups et K.-O.');
assert(!BK.MATCH_ITEMS.includes('antidote')&&BK.MATCH_ITEMS.includes('bomb'),'objets de match seulement');
assert.deepEqual(BK.defaultDuelFoes('adam',m1),['zachary']);
assert.deepEqual(BK.defaultDuelFoes('adam',m3),['zachary','alexie','eliott']);
const gold0=BK.loadGold();let r=BK.awardDuel(m1,900,'adam',['zachary']);
assert.equal(r.gold,BK.DUEL_FOE_GOLD[1]);assert.deepEqual(r.fresh,['zachary']);assert.equal(BK.loadGold(),gold0+10);assert.equal(r.progress.count,1);assert.equal(r.progress.total,14);
assert.deepEqual(BK.defaultDuelFoes('adam',m1),['alexie'],'le prochain adversaire est le premier pas encore battu');
r=BK.awardDuel(m1,700,'adam',['zachary']);assert.equal(r.gold,5,'déjà vaincu : consolation');assert.equal(r.fresh.length,0);
for(const id of BK.duelOthers('adam'))r=BK.awardDuel(m1,800,'adam',[id]);
assert(r.complete&&r.first,'tout le monde vaincu');assert.equal(r.gold,BK.DUEL_FOE_GOLD[1]+m1.reward,'dernier adversaire + bonus du style complété');
assert.equal(BK.loadChallenges().match1.done,1);
r=BK.awardDuel(m1,800,'adam',['milo']);assert(r.complete&&!r.first);assert.equal(r.gold,5);
assert.equal(BK.duelProgress(m1,'milo').count,13,'Milo ne compte pas lui-même');
assert(BK.loadAdventure('adam').xp>0,'XP reçue');
const html=BK.duelResultHtml(m1,800,BK.awardDuel(m3,800,'milo',['adam','eliott','zachary']));assert(html.includes('Adam')&&html.includes('Zachary'));

// ---- curling en solo : zone, botté, anneaux, huit lancers
const curl1=BK.CHALLENGES.find(c=>c.id==='curl1'),fam=BK.CHALLENGES.find(c=>c.id==='curlfam');
assert.equal(curl1.throws,8);assert.equal(BK.curlingPoints(0),10);assert.equal(BK.curlingPoints(1),7);assert.equal(BK.curlingPoints(2),4);assert.equal(BK.curlingPoints(3),2);assert.equal(BK.curlingPoints(4),0);
const targets=BK.curlingTargets(curl1,5);assert.equal(targets.length,8);assert(targets.every(t=>t.r===4&&t.c>=12&&t.c<=17),'niveau 1 : cibles sur la ligne');
assert(new Set(BK.curlingTargets(BK.CHALLENGES.find(c=>c.id==='curl3'),5).map(t=>t.r)).size>1,'niveau 3 : lignes différentes');
const C=new BK.Curling('adam',curl1,{seed:3});const W=C.world,p=C.players[0];
assert.equal(C.players.length,1);assert(p.kick,'le coup de pied est prêté');
C.update(1);BK.input.pressed.add('Space');C.update(1/60);BK.input.flush();assert.equal(C.state,'play','une touche lance la partie');
// bombe hors zone : refusée
p.x=9.5;p.y=4.5;p.input.bomb=true;C.update(1/60);assert.equal(W.bombs.length,0,'bombe hors de la zone retirée');assert.equal(p.bombsOut,0);
// bombe dans la zone, jamais bottée : zéro point
p.x=3.5;p.y=4.5;p.input.bomb=true;C.update(1/60);assert.equal(W.bombs.length,1);
for(let i=0;i<60*3&&C.state==='play';i++)C.update(1/60);
assert.equal(C.state,'scored');assert.equal(p.points,0);assert.equal(p.results.length,1);assert.equal(C.lastThrow.label,'Il faut la botter !');
for(let i=0;i<60*2&&C.state==='scored';i++)C.update(1/60);assert.equal(C.state,'play');assert.equal(C.throwIndex,1);assert.deepEqual(C.target,targets[1]);
// bombe bottée vers la cible : elle glisse, explose, et marque selon l'anneau
p.x=3.5;p.y=C.target.r+.5;p.input.bomb=true;C.update(1/60);const b=W.bombs[0];
const wait=b.t-(C.target.c-b.cx)/BK.KICK_SPEED;for(let i=0;i<Math.round(wait*60);i++)C.update(1/60);
W.kickBomb(b,3,p);for(let i=0;i<60*4&&C.state==='play';i++)C.update(1/60);
assert.equal(C.state,'scored');assert(b.scored);assert(p.points>=7,'bottée au bon moment : '+p.points+' points, label '+C.lastThrow.label);
// fin de partie après huit lancers
for(let n=p.results.length;n<8;n++){for(let i=0;i<60*2&&C.state==='scored';i++)C.update(1/60);p.x=3.5;p.y=C.target.r+.5;p.input.bomb=true;C.update(1/60);const q=W.bombs[0];const w=q.t-(C.target.c-q.cx)/BK.KICK_SPEED;for(let i=0;i<Math.round(w*60);i++)C.update(1/60);W.kickBomb(q,3,p);for(let i=0;i<60*4&&C.state==='play';i++)C.update(1/60);}
for(let i=0;i<60*2&&C.state==='scored';i++)C.update(1/60);
assert.equal(C.state,'result','huit lancers, partie finie');assert.equal(p.results.length,8);assert(p.points>=curl1.target,'réussi avec '+p.points);
assert.equal(BK.curlingScore(curl1,80,true),1000);assert.equal(BK.curlingScore(curl1,curl1.target,true),300);assert.equal(BK.curlingScore(curl1,10,false),0);

// ---- curling en famille : chacun son tour, les autres sur le banc font les fous
const F=new BK.Curling('adam',fam,{players:['adam','milo','alexie','eliott'],seed:2});const FW=F.world;
assert.equal(F.players.length,4);assert.equal(F.throwsTotal,16);
assert(F.players.slice(1).every(q=>q.npc&&Math.floor(q.y)===9),'trois joueurs sur le banc');
F.update(1);BK.input.pressed.add('Space');F.update(1/60);BK.input.flush();assert.equal(F.state,'handoff','on attend que le joueur soit prêt');
F.confirmTurn();assert.equal(F.state,'play');assert.equal(F.active,F.players[0]);
for(let i=0;i<60*8;i++)F.update(1/60);
assert(F.antics>=3,'les spectateurs s’amusent : '+F.antics);
const a0=F.active;a0.x=3.5;a0.y=F.target.r+.5;a0.input.bomb=true;F.update(1/60);FW.kickBomb(FW.bombs[0],3,a0);
for(let i=0;i<60*4&&F.state==='play';i++)F.update(1/60);assert.equal(F.state,'scored');
assert(F.players.slice(1).every(q=>q.bubble),'tout le banc réagit au lancer');
for(let i=0;i<60*2&&F.state==='scored';i++)F.update(1/60);
assert.equal(F.state,'handoff');assert.equal(F.pendingTurn.next,F.players[1]);F.confirmTurn();
assert.equal(F.active,F.players[1]);assert(!F.players[1].npc&&Math.floor(F.players[1].y)===4,'Milo est sur la glace');
assert(F.players[0].npc&&Math.floor(F.players[0].y)===9,'Adam est passé sur le banc');
assert.equal(F.players[0].x,F.players[1].x===7.5?7.5:F.players[0].x);
const spots=F.players.filter(q=>q.npc).map(q=>q.x);assert.equal(new Set(spots).size,3,'une place de banc par spectateur');
console.log('Défis plus : '+arenas.length+' arènes à monstres dans leur biome, duels à 3 cœurs et or par adversaire vaincu, curling solo (zone, botté, anneaux, 8 lancers) et en famille (tours, banc rigolo) OK.');
