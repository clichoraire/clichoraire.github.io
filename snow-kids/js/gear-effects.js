(function(SK){
 const additions=[
 ['chrono','Chronomètre magique',1000,2,'Prolonge les effets temporaires de tes objets de 15 %. Cumulable avec la montre des étoiles.','⏱'],
 ['montreEtoiles','Montre des étoiles',5000,4,'Prolonge les effets temporaires de tes objets de 35 %. Avec le chronomètre : +50 %.','⌚'],
 ['portefeuilleOr','Portefeuille en or',1500,2,'Capacité de 150 pièces par course.','👛'],
 ['portefeuilleRoyal','Portefeuille royal',3500,3,'Capacité de 500 pièces par course.','👛'],
 ['boussole','Boussole de montagne',450,1,'Indique la direction du prochain virage et la distance avant celui-ci.','🧭'],
 ['ressort','Bottes à ressort',800,2,'Bottes rebondissantes ! +1 en saut. Charge ton saut à fond pour bondir super haut : recharge en 30 secondes.','🦘'],
 ['sifflet','Sifflet de secours',900,2,'Évite le premier choc contre un sapin, un drapeau ou un cône. Une charge par course.','📣'],
 ['casqueAero','Casque aérodynamique',1800,3,'+10 % de vitesse maximale en ligne droite.','⛑'],
 ['thermos','Thermos de chocolat chaud',1600,3,'Un saut réussi depuis une butte à ligne rouge remplit le turbo deux fois plus vite : 2 sauts au lieu de 4.','☕'],
 ['sablier','Sablier d’or',4500,4,'Ralentit le temps pendant 1,5 s dans un virage critique ou en vol. Recharge : 12 s.','⌛'],
 ['meteore','Météore de poche',5500,4,'Pulvérise les obstacles proches pendant les 3 premières secondes de chaque turbo.','🌠'],
 ['couronne','Couronne du Champion',8000,4,'+1 à toutes les stats de course. Double pièces et prime si tu finis premier, dans la limite du portefeuille.','👑']
 ];
 for(const [id,name,price,rank,desc,icon] of additions)SK.GEAR.push({id,name,price,rank,desc,icon,cat:'gadget',unlock:rank>1?{wins:(rank-1)*2}:undefined});
 const ranks={portemonnaie:1,sac:1,casque:1,lunettesNeige:1,lunettesForet:1,aimant:2,bottes:2,veste:2,lunettes:2,lunettesMiroir:2,lunettesTricolores:2,fusee:3,gants:1,vip:3,masque:4};
 for(const g of SK.GEAR){g.rank=g.rank||ranks[g.id]||1;
  if(g.id==='portemonnaie'){g.name='Portefeuille en cuir';g.desc='Augmente la capacité à 50 pièces par course.';}
  if(g.id==='sac'){g.name='Boîte Cadeau Surprise';delete g.unlock;g.desc='Commence chaque manche avec un objet aléatoire prêt à utiliser.';}
  if(g.id==='gants'){g.name='Gants adhérents Freestyle';g.desc='Figures 10 % plus rapides, gains acrobatiques ×1,5 et réceptions sauvées si la figure est presque terminée.';}
  if(g.id==='bottes'){g.name='Semelles cramponnées';g.desc='+1 en virage : meilleure accroche dans les courbes.';}
 }
 const gloves=SK.gearById('gants');gloves.name='Gants adhérents Freestyle bleus';gloves.tint='#268be3';
 SK.GEAR.push({...gloves,id:'gantsMauves',name:'Gants adhérents Freestyle mauves',tint:'#9957d4'});
 SK.GEAR.push({id:'teteNoel',name:'Tête du Père Noël',cat:'other',rank:4,price:5000,desc:'Débloque le Père Noël jouable, avec son bonnet et sa barbe blanche.'},{id:'teteRobot',name:'Tête de Robot',cat:'other',rank:4,price:5000,desc:'Débloque Robot, avec sa tête métallique et ses yeux lumineux.'});
 SK.itemDuration=(r,seconds)=>seconds*(1+(r.gear.chrono?.15:0)+(r.gear.montreEtoiles?.35:0)+.1*(r.powerLevels?.item||0));
 SK.coinCapacity=g=>g.portefeuilleRoyal?500:g.portefeuilleOr?150:g.portemonnaie?50:20;
 SK.collectGold=(r,n)=>{const gained=Math.max(0,Math.min(Math.floor(n),r.coinCapacity-r.coinsTotal));r.coins+=gained;r.coinsTotal+=gained;return gained;};
 SK.raceGold=(r,prize)=>{const multi=r.gear.couronne&&r.rank===0?2:1,coins=Math.min(r.coinCapacity,r.coinsTotal*multi);return {coins,prize:Math.max(0,Math.min(r.coinCapacity-coins,prize*multi))};};
 SK.GearEffects={
  init(r){r.coinCapacity=SK.coinCapacity(r.gear);r.turboCharge=0;r.whistleUsed=false;r.sandCooldown=0;r.sandUntil=0;r.meteorUntil=0;
   const bonus=r.gear.couronne?1:0;if(bonus){r.maxSpeed=SK.speedFromStat(r.def.speed+r.board.speed+1);SK.applyHandlingStats(r,r.def.corner+(r.board.corner||0)+1,(r.def.acceleration??3)+(r.board.acceleration||0)+1);}
   if(r.gear.bottes)SK.applyHandlingStats(r,r.def.corner+(r.board.corner||0)+bonus+1,(r.def.acceleration??3)+(r.board.acceleration||0)+bonus);
   r.jumpPower=SK.jumpFromStat((r.def.jump||3)+(r.board.jump||0)+bonus+(r.gear.ressort?1:0));if(r.gear.gants)r.trickPay=1.5;
  },
  boost(r,seconds){r.fx.fan=Math.max(r.fx.fan,SK.itemDuration(r,seconds));if(r.gear.meteore)r.meteorUntil=r.race.time+3;},
  land(r){if(!r.trickRampJump)return;r.turboCharge=Math.min(1,r.turboCharge+(r.gear.thermos?.5:.25));if(r.turboCharge>=1){r.turboCharge=0;this.boost(r,3);r.race.emit({type:'gearbonus',r,text:'Turbo chargé !'});}},
  timeScale(race,dt){let active=false;for(const r of race.humans){r.sandCooldown=Math.max(0,r.sandCooldown-dt);r.sandUntil=Math.max(0,r.sandUntil-dt);
   if(r.gear.sablier&&!r.sandCooldown&&(r.state==='air'||Math.abs(race.track.segAt(r.z).curve)>1.2&&Math.abs(r.steer)>.7)){r.sandUntil=1.5;r.sandCooldown=12;race.emit({type:'gearbonus',r,text:'Sablier : le temps ralentit !'});}active=active||r.sandUntil>0;}return active?.65:1;},
  protect(r,p){if(r.gear.meteore&&r.meteorUntil>r.race.time){p.decor=true;p.destroyed=true;r.race.emit({type:'gearbonus',r,text:'Météore !'});return true;}
   if(r.gear.sifflet&&!r.whistleUsed&&['pine','flag','cone'].includes(p.type)){r.whistleUsed=true;r.race.emit({type:'gearbonus',r,text:'Choc évité !'});return true;}return false;
  }
 };
})(window.SK);
