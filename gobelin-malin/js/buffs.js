// Clan Gobelin — les effets en cours, en petites icônes sous les barres du chef. On passe la souris dessus pour savoir ce que c'est.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Bf = CG.Buffs = {};
  const sp = id => CG.SPELLS[id] || {};
  // chaque effet : [clé, icône, nom, ce que ça fait, () => secondes restantes | true (jusqu'à une heure donnée) | 0, texte de durée]
  Bf.LISTE = [
    { k: 'temps', ic: '⏳', nom: () => sp('temps').nom, txt: 'Les heures passent deux fois moins vite. Tout le reste bouge normalement.', t: () => { const a = CG.Temps && CG.Temps.actif(); return a && a.id === 'temps' ? a.t : 0; } },
    { k: 'hatetemps', ic: '⌛', nom: () => sp('hatetemps').nom, txt: 'Les heures passent une fois et demie plus vite. Tout le reste bouge normalement.', t: () => { const a = CG.Temps && CG.Temps.actif(); return a && a.id === 'hatetemps' ? a.t : 0; } },
    { k: 'bouclier', ic: '🛡️', nom: () => sp('bouclier').nom || 'Bouclier', txt: () => 'Absorbe encore ' + Math.ceil(CG.R.shield) + ' points de dégâts à ta place.', t: () => CG.R.shield > 0 ? Math.max(0.1, CG.R.shieldT || 0) : 0 },
    { k: 'cri', ic: '📣', nom: () => sp('cri').nom || 'Cri de guerre', txt: 'Tes gardes courent, frappent plus vite et font 50 % de dégâts en plus.', t: () => CG.R.cri },
    { k: 'hate', ic: '💨', nom: () => sp('hate').nom || 'Hâte', txt: 'Tu cours beaucoup plus vite.', t: () => CG.R.haste },
    { k: 'pareFeu', ic: '🦎', nom: () => sp('parefeu').nom, txt: 'Le feu ne te fait presque plus rien : 80 % de dégâts de feu en moins.', t: () => CG.R.pareFeu },
    { k: 'electro', ic: '🌩️', nom: () => sp('electro').nom, txt: 'Tout ennemi qui s\'approche est foudroyé, et celui qui te frappe prend une décharge.', t: () => CG.R.electro },
    { k: 'ombres', ic: '👁️', nom: () => sp('ombres').nom, txt: 'Tu vois ceux qui se cachent dans l\'ombre autour de toi.', t: () => CG.R.oeilOmbre },
    { k: 'vision', ic: '🦅', nom: () => sp('vision').nom || 'Vision', txt: 'Tu vois bien plus loin sur la mini-carte.', t: () => CG.R.vision },
    { k: 'invuln', ic: '✨', nom: () => 'Intouchable', txt: 'Rien ne peut te blesser pendant un court instant.', t: () => CG.R.invuln > 1.2 ? CG.R.invuln : 0 },
    { k: 'feu', ic: () => CG.Feu.POUDRES[CG.Feu.buff()].icon, nom: () => CG.Feu.POUDRES[CG.Feu.buff()].nom, txt: () => CG.Feu.POUDRES[CG.Feu.buff()].matin, t: () => CG.Feu && CG.Feu.buff() ? true : 0, fin: () => 'jusqu\'à ' + CG.Feu.POUDRES[CG.Feu.buff()].jusqua + ' h' },
    { k: 'bless', ic: () => CG.Allies.BLESS[CG.S.bless.id].icon, nom: () => CG.Allies.BLESS[CG.S.bless.id].nom, txt: () => CG.Allies.BLESS[CG.S.bless.id].desc, t: () => { const b = CG.S.bless; return b && b.day === CG.S.day && CG.Allies && CG.Allies.BLESS[b.id] && CG.Allies.BLESS[b.id].day ? true : 0; }, fin: () => 'jusqu\'à demain matin' },
    { k: 'euphorie', ic: '🤩', nom: () => 'Euphorie du clan', txt: () => 'Moral à ' + Math.round(100 + CG.Fete.euphorie()) + ' % : toi et tout le clan marchez 1,2 fois plus vite. Elle fond de 6 points par heure de jeu.', t: () => CG.Fete && CG.Fete.euphorie() > 0 ? true : 0, fin: () => 'encore ' + Math.ceil(CG.Fete.euphorie() / CG.Fete.FONTE * 10) / 10 + ' h de jeu' },
    { k: 'totem', ic: '🗿', nom: () => 'Totem de guerre', txt: 'Tu es dans le rayon d\'un totem : toi, tes gobelins et tes alliés faites 20 % de dégâts en plus tant que vous vous battez ici.', t: () => CG.totemPres && CG.S.buildings.some(x => x.type === 'totem' && !x.site) && CG.totemPres(CG.S.player) ? true : 0, fin: () => 'tant que tu restes près du totem' },
    { k: 'toile', ic: '🕸️', mal: true, nom: () => 'Pris dans une toile', txt: 'Tu avances deux fois moins vite tant que tu marches dans la toile.', t: () => CG.Nid && !CG.R.mount && CG.Nid.dansToile(CG.S.player.x, CG.S.player.y) ? true : 0, fin: () => 'tant que tu es dedans' }
  ];
  const val = v => typeof v === 'function' ? v() : v;
  let box = null, tip = null, vus = {}, survol = null;
  function init() {
    const pl = document.getElementById('player'); if (!pl) return false;
    box = document.createElement('div'); box.id = 'buffs'; pl.appendChild(box);
    tip = document.createElement('div'); tip.id = 'buff-tip'; tip.hidden = true; document.body.appendChild(tip);
    const css = document.createElement('style');
    css.textContent = '#buffs{display:flex;flex-wrap:wrap;gap:6px;margin-top:0;pointer-events:auto}#buffs:not(:empty){margin-top:8px}'
      + '#buffs .bf{position:relative;width:34px;height:34px;border-radius:9px;display:grid;place-items:center;font-size:18px;line-height:1;cursor:help;background:linear-gradient(160deg,rgba(90,140,70,.55),rgba(30,50,26,.8));border:1.5px solid rgba(190,240,150,.65);box-shadow:0 2px 5px rgba(0,0,0,.45),inset 0 0 8px rgba(190,255,150,.15);animation:bf-in .28s cubic-bezier(.2,1.5,.4,1);transition:transform .12s}'
      + '#buffs .bf.mal{background:linear-gradient(160deg,rgba(150,70,60,.6),rgba(54,24,22,.85));border-color:rgba(255,160,140,.7)}#buffs .bf:hover{transform:translateY(-2px) scale(1.08)}'
      + '#buffs .bf b{position:absolute;right:-4px;bottom:-5px;min-width:16px;padding:0 3px;border-radius:7px;font:700 10px/14px "Trebuchet MS",system-ui,sans-serif;text-align:center;color:#fff;background:rgba(12,10,8,.9);border:1px solid rgba(255,255,255,.25)}#buffs .bf b:empty{display:none}#buffs .bf.fin{animation:bf-fin .5s infinite alternate}'
      + '@keyframes bf-in{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}@keyframes bf-fin{from{opacity:1}to{opacity:.45}}'
      + '#buff-tip{position:fixed;z-index:60;max-width:270px;padding:11px 14px 12px;border-radius:12px;pointer-events:none;color:#f2ecdc;background:rgba(18,16,14,.86);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.16);box-shadow:0 10px 28px rgba(0,0,0,.55);font:13.5px/1.4 "Trebuchet MS",system-ui,sans-serif;animation:bt-in .14s ease-out}#buff-tip[hidden]{display:none}'
      + '#buff-tip h4{margin:0 0 4px;display:flex;align-items:center;gap:8px;font-size:15px;color:#fff}#buff-tip h4 span{font-size:19px}#buff-tip p{margin:0;opacity:.88}#buff-tip em{display:inline-block;margin-top:7px;padding:2px 8px;border-radius:20px;font-style:normal;font-size:11.5px;color:#d8ffb0;background:rgba(150,220,110,.16);border:1px solid rgba(170,240,130,.3)}#buff-tip.mal em{color:#ffc8ba;background:rgba(240,120,100,.16);border-color:rgba(255,150,130,.35)}'
      + '@keyframes bt-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}';
    document.head.appendChild(css); return true;
  }
  const duree = (b, t) => t === true ? (b.fin ? b.fin() : '') : t >= 60 ? 'encore ' + Math.floor(t / 60) + ' min ' + String(Math.ceil(t % 60)).padStart(2, '0') : 'encore ' + Math.ceil(t) + ' s';
  function montrer(b, el) {
    const t = b.t(); if (!t) return cacher(); survol = b;
    tip.className = b.mal ? 'mal' : ''; tip.innerHTML = '<h4><span></span><i style="font-style:normal"></i></h4><p></p><em></em>';
    tip.querySelector('span').textContent = val(b.ic); tip.querySelector('i').textContent = val(b.nom); tip.querySelector('p').textContent = val(b.txt); tip.querySelector('em').textContent = duree(b, t);
    tip.hidden = false; const r = el.getBoundingClientRect(); tip.style.left = Math.max(8, Math.min(window.innerWidth - tip.offsetWidth - 8, r.left)) + 'px'; tip.style.top = (r.bottom + 10) + 'px';
  }
  function cacher() { survol = null; if (tip) tip.hidden = true; }
  const rf0 = UI.refresh; UI.refresh = function () {
    rf0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || (!box && !init())) return;
    for (const b of Bf.LISTE) {
      let t = 0; try { t = b.t() || 0; } catch (e) { t = 0; }
      let el = vus[b.k];
      if (!t) { if (el) { el.remove(); delete vus[b.k]; if (survol === b) cacher(); } continue; }
      if (!el) { el = vus[b.k] = document.createElement('div'); el.className = 'bf' + (b.mal ? ' mal' : ''); el.innerHTML = '<span></span><b></b>'; el.onmouseenter = () => montrer(b, el); el.onmouseleave = cacher; box.appendChild(el); el._ic = null; el._s = null; }
      const ic = val(b.ic); if (el._ic !== ic) { el._ic = ic; el.firstChild.textContent = ic; }
      const s = t === true ? '' : t >= 60 ? Math.ceil(t / 60) + 'm' : String(Math.ceil(t)); if (el._s !== s) { el._s = s; el.lastChild.textContent = s; el.classList.toggle('fin', t !== true && t <= 5); if (survol === b) { tip.querySelector('em').textContent = duree(b, t); if (typeof b.txt === 'function') tip.querySelector('p').textContent = b.txt(); } }
    }
  };
})(window.CG);
