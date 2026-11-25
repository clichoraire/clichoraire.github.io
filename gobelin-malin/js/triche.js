// Goblin Malin — mode debug suprême : dans « Comment jouer », cliquer 10 fois sur la touche M. Un bouton Triche apparaît sous le son.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Tr = CG.Triche = { inv: false }, KEY = 'goblin-malin-triche'; let n = 0, last = 0;
  const on = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
  function bouton() {
    if (document.getElementById('btn-triche')) return; const s = document.getElementById('btn-sound'); if (!s) return;
    const b = document.createElement('button'); b.id = 'btn-triche'; b.title = 'Mode debug suprême'; b.innerHTML = '🧪 Triche'; s.after(b); b.onclick = () => panneau();
  }
  function panneau(force) {
    let p = document.getElementById('triche'); if (p && !force) { p.remove(); return; } if (p) p.remove();
    p = document.createElement('div'); p.id = 'triche';
    p.innerHTML = '<h4>🧪 Debug suprême</h4>'
      + '<button id="tr-inv" class="' + (Tr.inv ? 'on' : '') + '">🛡️ Invincibilité : ' + (Tr.inv ? 'OUI' : 'non') + '</button>'
      + '<button id="tr-paix" class="' + (Tr.paix ? 'on' : '') + '">🕊️ Aucune attaque au village : ' + (Tr.paix ? 'OUI' : 'non') + '</button>'
      + '<div class="tr-cols"><div><h5>Le chef et le clan</h5><div class="tr-res">' + Object.keys(CG.RES).map(r => '<button data-r="' + r + '" class="' + ((Tr.res || 'or') === r ? 'on' : '') + '" title="' + CG.RES[r].nom + '">' + CG.RES[r].icon + '</button>').join('') + '<button data-r="potion" class="' + (Tr.res === 'potion' ? 'on' : '') + '" title="Potions de vie">🧪</button></div>'
      + '<div class="tr-l"><span id="tr-rn">' + (Tr.res === 'potion' ? 'Potions' : CG.RES[Tr.res || 'or'].nom) + '</span><input id="tr-or" type="number" value="' + (Tr.resN || 500) + '" min="1"><button data-t="or">Donner</button></div>'
      + '<div class="tr-l"><span>⭐ XP</span><input id="tr-xp" type="number" value="100" min="1"><button data-t="xp">Donner</button></div>'
      + '<div class="tr-l"><span>⬆️ Niveaux</span><input id="tr-lvl" type="number" value="1" min="1" max="30"><button data-t="lvl">Monter</button></div>'
      + '<div class="tr-l"><span>👥 Gobelins</span><input id="tr-gob" type="number" value="1" min="1" max="20"><button data-t="gob">Ajouter</button></div>'
      + '</div><div><h5>Le monde</h5><div class="tr-l"><select id="tr-ent">' + Object.keys(CG.ENEMIES).filter(k => !CG.ENEMIES[k].struct).map(k => '<option value="' + k + '"' + ((Tr.ent || 'brigand') === k ? ' selected' : '') + '>' + CG.ENEMIES[k].nom + '</option>').join('') + '</select><input id="tr-enn" type="number" value="' + (Tr.entN || 3) + '" min="1" max="30"><button id="tr-spawn">👹 Autour de moi</button></div>'
      + '<div class="tr-l"><span>🥁 Butin de chef</span><button id="tr-b1">Tome</button><button id="tr-b2">Or</button></div>'
      + '<button id="tr-sorts">📖 Tous les sorts dans le grimoire</button>'
      + '<button id="tr-dl">👹 Scène du Demon Lord (jour 31)</button>'
      + '<button id="tr-monde" class="' + (CG.S.demon && CG.S.demon.mort ? 'on' : '') + '">🌀 ' + (CG.S.demon && CG.S.demon.mort ? '2e monde débloqué' : 'Débloquer le 2e monde') + '</button></div></div>'
      + '<button id="tr-off" class="low">Quitter le mode triche</button>';
    document.getElementById('hud').appendChild(p);
    p.querySelectorAll('input').forEach(i => { ['keydown', 'keyup', 'keypress'].forEach(ev => i.addEventListener(ev, e => e.stopPropagation())); });
    p.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { Tr.res = b.dataset.r; Tr.resN = +p.querySelector('#tr-or').value || 500; CG.sfx('ok'); panneau(true); });
    p.querySelector('#tr-paix').onclick = () => { Tr.paix = !Tr.paix; try { if (Tr.paix) localStorage.setItem(KEY + '-paix', '1'); else localStorage.removeItem(KEY + '-paix'); } catch (e) { /* rien */ } if (!Tr.paix && CG.R && (!CG.Mondes || CG.Mondes.ici() === 0)) CG.R.noNightRaid = false; CG.sfx('ok'); UI.toast(Tr.paix ? '🕊️ Plus aucune attaque au village (ni le jour, ni la nuit, ni les raids des repaires). Les monstres de la forêt restent là.' : 'Les attaques reprennent.'); panneau(true); };
    p.querySelector('#tr-inv').onclick = () => { Tr.inv = !Tr.inv; CG.sfx('ok'); UI.toast(Tr.inv ? '🛡️ Invincible : plus rien ne te blesse.' : 'Invincibilité coupée.'); panneau(true); };
    p.querySelector('#tr-spawn').onclick = () => { const S = CG.S, pl = S.player, type = p.querySelector('#tr-ent').value, n = CG.clamp(Math.floor(+p.querySelector('#tr-enn').value || 1), 1, 30); Tr.ent = type; Tr.entN = n; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + Math.random() * 0.4; let x = pl.x, y = pl.y; for (const r of [150, 120, 190, 90]) { const xx = pl.x + Math.cos(a) * r, yy = pl.y + Math.sin(a) * r * 0.8; if (CG.W.walkPx(xx, yy)) { x = xx; y = yy; break; } } const e = G.spawnEnemy(type, x, y, { wild: true }); e.wild = null; e.target = pl; e.seek = 2; G.puff(x, y - 14, '#c070ff', 10, 90, 4); } CG.sfx('warning'); UI.toast('👹 ' + n + ' × ' + CG.ENEMIES[type].nom + ' autour de toi.'); };
    p.querySelector('#tr-b1').onclick = () => CG.Butin.essai('troll', 'oui'); p.querySelector('#tr-b2').onclick = () => CG.Butin.essai('troll', 'zut');
    p.querySelector('#tr-sorts').onclick = () => { const pl = CG.S.player; let n = 0; Object.keys(CG.SPELLS).forEach(id => { if (!pl.spells.includes(id)) { pl.spells.push(id); n++; } delete pl.scrolls[id]; }); CG.sfx('level'); UI.toast('📖 ' + (n ? n + ' sorts ajoutés : ton grimoire contient maintenant tous les sorts du jeu (G pour choisir lesquels sont actifs).' : 'Ton grimoire contient déjà tous les sorts.')); };
    p.querySelector('#tr-dl').onclick = () => { if (CG.DemonFeu && CG.DemonFeu.scene()) UI.toast('👹 Le portail du nord se réveille...'); };
    p.querySelector('#tr-monde').onclick = () => { const S = CG.S, pl = S.player; if (S.demon && S.demon.mort) return UI.toast('🌀 Le 2e monde est déjà débloqué : le portail démoniaque est au nord.'); S.demon = { mort: true, jour: S.day, triche: true }; if (!pl.spells.includes('mondes')) pl.spells.push('mondes'); if (CG.SPELLS.antidote && !pl.spells.includes('antidote') && !pl.scrolls.antidote) pl.scrolls.antidote = 1; CG.sfx('victory'); UI.toast('🌀 Comme si le Demon Lord était tombé : le portail démoniaque du nord est ouvert, tu connais Rappel, et tu as le tome Antidote.'); panneau(true); };
    p.querySelector('#tr-off').onclick = () => { try { localStorage.removeItem(KEY); } catch (e) { /* rien */ } Tr.inv = false; p.remove(); const b = document.getElementById('btn-triche'); if (b) b.remove(); UI.toast('Mode triche fermé.'); };
    p.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
      const S = CG.S, pl = S.player, k = b.dataset.t, v = Math.max(1, Math.floor(+p.querySelector('#tr-' + k).value || 0)); CG.sfx('coin');
      if (k === 'or') { const r = Tr.res || 'or'; if (r === 'potion') pl.potions += v; else S.res[r] = (S.res[r] || 0) + v; G.text(pl.x, pl.y - 60, '+' + v + ' ' + (r === 'potion' ? '🧪' : CG.RES[r].icon), '#ffe36b', true); }
      else if (k === 'xp') G.addXp(v);
      else if (k === 'gob') { const n = Math.min(20, v); for (let i = 0; i < n; i++) { const g = G.addGoblin(Math.random() < 0.5 ? 'f' : 'm', 'aucun'), a = Math.random() * 6.28; g.x = pl.x + Math.cos(a) * (40 + i * 6); g.y = pl.y + Math.sin(a) * (40 + i * 6); if (G.unstick) G.unstick(g, 8); G.puff(g.x, g.y - 20, '#9dff7a', 10, 90, 4); } UI.toast('👥 ' + n + ' gobelin' + (n > 1 ? 's rejoignent' : ' rejoint') + ' le clan (sans métier : va leur parler).'); }
      else for (let i = 0; i < Math.min(30, v); i++) G.addXp(Math.max(1, G.xpNeed(pl.lvl) - pl.xp));
    });
  }
  Tr.enable = function () { try { localStorage.setItem(KEY, '1'); } catch (e) { /* rien */ } bouton(); CG.sfx('level'); UI.toast('🧪 Mode debug suprême activé ! Regarde sous le bouton du son.'); };
  const hp0 = G.hurtPlayer; G.hurtPlayer = function () { if (Tr.inv) return; return hp0.apply(this, arguments); };
  // l'œuf de Pâques : 10 clics de suite sur la touche M de l'aide
  const help0 = UI.help;
  UI.help = function () {
    help0.apply(this, arguments); n = 0;
    const k = [...document.querySelectorAll('#panel .keycap')].find(e => e.textContent.trim() === 'M'); if (!k) return;
    k.onclick = () => { const t = performance.now(); n = t - last < 1500 ? n + 1 : 1; last = t; if (n >= 10) { n = 0; Tr.enable(); } /* aucun signe : ni grossissement, ni curseur en main */ };
  };
  // le bouton revient tout seul aux parties suivantes tant que le mode est actif
  const up0 = G.update; G.update = function (dt) { up0(dt); if (Tr._ok === undefined) { Tr._ok = on(); if (Tr._ok) bouton(); } };
  Tr.open = panneau;
  // ---------- « aucune attaque au village » : pour essayer des choses tranquille ----------
  // Les attaques prévues sont rayées, celles qui démarrent quand même (raid d'un repaire, de nuit...) sont annulées sur-le-champ.
  // Le Demon Lord, lui, vient quand même : c'est le chef qui l'appelle en activant le portail.
  try { Tr.paix = !!localStorage.getItem(KEY) && !!localStorage.getItem(KEY + '-paix'); } catch (e) { /* rien */ }
  { const D = CG.D, du0 = D.update; D.update = function () {
    const r = du0.apply(this, arguments), R = CG.R; if (!Tr.paix || !CG.S || !R) return r;
    (R.schedule || []).forEach(e => { if (e.type === 'attack') e.done = true; }); R.noNightRaid = true;
    const ev = R.event; if (ev && ev.type === 'attack' && !ev.demonLord && !ev.lord) {
      for (const e of R.enemies) if (e.event && !e.dead && !e.struct) { if (e.campId) { e.event = false; e.wild = { x: e.x, y: e.y }; e.target = null; e.path = null; } else e.dead = true; }
      R.spawnQ = []; R.event = null; R.alarm = false;
    }
    return r;
  }; }
  // la fenêtre : deux colonnes, jamais plus haute que l'écran (elle défile s'il le faut)
  const css = document.createElement('style');
  css.textContent = '#triche{top:64px;right:216px;width:540px;max-width:calc(100vw - 240px);max-height:calc(100vh - 84px);overflow-y:auto;box-sizing:border-box}#triche .tr-cols{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px;margin-top:10px;align-items:start}#triche h5{margin:0 0 2px;font-size:11.5px;letter-spacing:1.2px;text-transform:uppercase;color:#c9a8f0;opacity:.85}#triche .tr-cols > div > button{margin-top:8px}#triche .tr-res{margin-top:6px}#triche button.low{margin-top:12px}#triche .tr-l:has(select){flex-wrap:wrap}#triche .tr-l .ld-btn{flex:1 1 100%;width:100%}#triche .tr-l .ld-btn span{width:auto}#triche .tr-l .ld-btn .ld-lab{flex:1}#triche .tr-l .ld-btn .ld-chev{width:9px}#triche .tr-l .ld-btn .ld-ic{width:1.35em}#triche .tr-l select{flex:1 1 100%}#triche .tr-l:has(select) input{flex:0 0 60px}#triche .tr-l:has(select) button{flex:1;width:auto}#triche #tr-b1,#triche #tr-b2{flex:1;width:auto;min-width:0}#triche .tr-l:has(#tr-b1){flex-wrap:wrap}#triche .tr-l:has(#tr-b1) span{flex:1 1 100%}@media (max-width:900px){#triche .tr-cols{grid-template-columns:1fr}}';
  document.head.appendChild(css);
})(window.CG);
