// Une aventure indépendante par personnage; préférences audio/difficulté partagées.
(function(SK){
  'use strict';
  const P=SK.Profiles={},fields=['playSeconds','snowDig','strengthLevel','xp','trainingPoints','powerLevels','photoPieces','walkLevel','photoGoldAt','gold','boardSkins','ownedSkins','boards','unlocked','shinobin','won','best','board','advBoard','upgrades','gear','wardrobe','look','trophies','missions','cups','allCupsUnlocked','allMissionsUnlocked','ending'];
  const copy=v=>JSON.parse(JSON.stringify(v));
  const snapshot=s=>Object.fromEntries(fields.filter(k=>s[k]!==undefined).map(k=>[k,copy(s[k])]));
  let defaults;
  P.init=function(raw,base){defaults=copy(base);const s=Object.assign(copy(base),copy(raw||{}));s.profiles=s.profiles||{};s.activeProfile=s.activeProfile||s.advChar||s.char||'zach';
    for(const profile of [s,...Object.values(s.profiles)])for(const upgrade of Object.values(profile.upgrades||{})){if(upgrade.acceleration==null&&upgrade.trick!=null)upgrade.acceleration=upgrade.trick;delete upgrade.trick;}
    if(!s.profiles[s.activeProfile])s.profiles[s.activeProfile]=snapshot(s);
    s.profileVersion=1;return s;
  };
  P.capture=s=>{s.profiles[s.activeProfile]=snapshot(s);};
  P.peek=(s,id)=>Object.assign(snapshot(defaults),copy(s.profiles[id]||{}),id===s.activeProfile?snapshot(s):{});
  P.select=function(s,id){P.capture(s);const next=P.peek(s,id);for(const k of fields)delete s[k];Object.assign(s,next);s.activeProfile=id;s.advChar=id;s.char=id;P.capture(s);return s;};
})(window.SK);
