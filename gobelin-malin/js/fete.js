// Clan Gobelin — la fête coûte de la nourriture à chaque heure (1 par gobelin), on peut éteindre le feu pour envoyer tout le monde au lit,
// et deux technologies rendent les fêtes moins gourmandes.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, Fe = CG.Fete = { PAR_TETE: 1, RABAIS: { b27: 0.3, b28: 0.3 } };
  // ---------- les deux technologies, sous la Taverne ----------
  CG.TECH.push(
    { id: 'b27', br: 'clan', t: 4, r: 0, cout: 2, icon: '🥣', nom: 'Fête frugale', desc: 'On partage mieux les plats : les fêtes du soir coûtent 30 % de nourriture en moins à chaque heure.', req: ['b7'] },
    { id: 'b28', br: 'clan', t: 5, r: 0, cout: 3, icon: '🍯', nom: 'Garde-manger malin', desc: 'Rien ne se perd : les fêtes du soir coûtent encore 30 % de nourriture en moins à chaque heure (60 % en tout).', req: ['b27'] });
  if (CG.TECH_PARENT) { CG.TECH_PARENT.b27 = 'b7'; CG.TECH_PARENT.b28 = 'b27'; }
  if (CG.TECH_BY_ID) CG.TECH.forEach(n => { if (n.id === 'b27' || n.id === 'b28') CG.TECH_BY_ID[n.id] = n; });
  Fe.mult = () => Math.max(0.1, 1 - (G.tech('b27') ? Fe.RABAIS.b27 : 0) - (G.tech('b28') ? Fe.RABAIS.b28 : 0));
  Fe.cout = () => Math.max(1, Math.ceil(CG.S.goblins.length * Fe.PAR_TETE * Fe.mult()));

  const fe0 = D.feast; D.feast = function () { const S0 = CG.S, f0 = S0.res.food, m0 = S0.morale, r = fe0.apply(this, arguments), S = CG.S, R = CG.R; R.feteH = Math.floor(S.hour);
    if (R.feastOk && S === S0) { const f = G.firePos(), c = Math.round(f0 - S.res.food), m = Math.round(S.morale - m0); if (c > 0) G.text(f.x, f.y - 70, '-' + c + ' 🍖', '#ffb08a', true); if (m > 0) G.text(f.x, f.y - 92, '😄 +' + m + ' moral', '#ffe9a8', true); } // ce que coûte et rapporte la fête se lit au-dessus du feu, sans message
    return r; };
  const up0 = D.update; D.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R; if (S && R && R.fireLit && G.sansFete && G.sansFete()) { R.fireLit = false; R.feastOk = false; } // partie rechargée un soir sans fête : le feu reste éteint
    if (!S || !R || R.night || !R.fireLit || S.hour < 20) return r;
    const h = Math.floor(S.hour); if (R.feteH === undefined || R.feteH === null) R.feteH = h; // partie rechargée en pleine fête : on ne fait pas payer les heures passées
    if (h <= R.feteH || h >= 24) return r; R.feteH = h;
    const c = Fe.cout(), f = G.firePos();
    if (S.res.food >= c) { G.gain('food', -c, f.x, f.y - 70); Fe.joie(Fe.MORAL, f); return r; }
    S.res.food = 0; S.morale = Math.max(0, S.morale - 3); UI.toast('😟 Plus rien à manger : la fête s\'arrête et tout le monde va se coucher le ventre creux. (moral -3)'); CG.sfx('no');
    if (D.canSleep() && !R.fadeDir) D.startNight();
    return r;
  };
  // ---------- chaque heure de fête remonte le moral ; à 100 %, le surplus devient de l'euphorie (jusqu'à 120 %) ----------
  // L'euphorie est gardée à part (S.euphorie, de 0 à 20) : le lendemain, tant qu'il en reste, tout le monde marche 1,2 fois plus vite, et elle fond de 6 points par heure.
  Fe.MORAL = 4; Fe.MAX = 20; Fe.FONTE = 6; Fe.VITESSE = 1.2;
  Fe.euphorie = () => { const S = CG.S; return S && S.morale >= 99.5 ? Math.max(0, S.euphorie || 0) : 0; };
  Fe.joie = function (n, f) {
    const S = CG.S, libre = Math.max(0, 100 - S.morale), a = Math.min(n, libre); S.morale += a; const avant = S.euphorie || 0;
    if (n > a && S.morale >= 99.5) S.euphorie = Math.min(Fe.MAX, avant + (n - a));
    if (f) G.text(f.x, f.y - 92, (S.euphorie > avant ? '🤩' : '😄') + ' +' + n + ' moral', '#ffe9a8', true);
    if (S.euphorie > 0 && !avant) UI.toast('🤩 Le clan est euphorique ! Le moral dépasse 100 % : demain, tout le monde marchera plus vite tant que ça dure.');
  };
  { const gm0 = G.gobMul; G.gobMul = function () { return gm0.apply(this, arguments) * (Fe.euphorie() > 0 ? Fe.VITESSE : 1); };
    const hm0 = G.heroMul; G.heroMul = function () { return hm0.apply(this, arguments) * (Fe.euphorie() > 0 ? Fe.VITESSE : 1); };
    const upE = D.update; D.update = function (dt) { // elle retombe doucement pendant la journée (pas pendant la fête, ni la nuit)
      const r = upE.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !(S.euphorie > 0) || R.night) return r;
      if (S.morale < 99.5) { S.euphorie = 0; return r; } // le moral est retombé sous 100 % : plus d'euphorie
      if (!R.fireLit && S.hour >= 6 && S.hour < 20) { S.euphorie = Math.max(0, S.euphorie - Fe.FONTE * dt / D.HOUR); if (!S.euphorie) UI.toast('🙂 L\'euphorie de la fête est retombée : le moral est revenu à 100 %.'); }
      return r;
    };
    // l'affichage : le moral du haut de l'écran montre le surplus
    const rf0 = UI.refresh; UI.refresh = function () { rf0.apply(this, arguments); const e = Fe.euphorie(), el = document.querySelector('#res .r-moral'); if (!el) return; const t = e > 0 ? '🤩 ' + Math.round(100 + e) + '%' : null; if (t) { if (el._euT !== t) { el._euT = t; const q = t.split(' '); el.innerHTML = '<i>' + q[0] + '</i><b>' + q[1].replace('%', '<small>%</small>') + '</b>'; el.style.color = '#ffe36b'; el._eu = true; } } else if (el._eu) { el._eu = false; el._euT = null; el.style.color = ''; el.innerHTML = '<i>' + (CG.Humeur ? CG.Humeur.tete() : CG.S.morale >= 70 ? '😄' : CG.S.morale >= 40 ? '🙂' : '😟') + '</i><b>' + Math.round(CG.S.morale) + '<small>%</small></b>'; } };
  }
  // ---------- éteindre le feu : tout près du feu, pendant la fête ----------
  const fi0 = D.findInteract; D.findInteract = function () {
    const R = CG.R, p = CG.S.player, f = G.firePos();
    if (R.fireLit && !R.night && !(R.ko > 0) && !R.build && D.canSleep() && Math.hypot(p.x - f.x, p.y - f.y) < 50) return { type: 'eteindre', obj: { x: f.x, y: f.y - 46 }, label: 'Éteindre le feu (tout le monde va dormir)' };
    return fi0.apply(this, arguments);
  };
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(); if (!it || it.type !== 'eteindre') return in0.apply(this, arguments);
    const S = CG.S, h = Math.floor(S.hour), reste = Math.max(0, 23 - Math.max(h, CG.R.feteH || h)), eco = reste * Fe.cout();
    const $ = id => document.getElementById(id), sec = Math.max(0, Math.ceil((24 - S.hour) * D.HOUR)), fois = reste;
    let braises = ''; for (let i = 0; i < 14; i++) braises += '<i style="left:' + (8 + (i * 47) % 84) + '%;--d:' + (i % 7) * 0.4 + 's;--x:' + ((i * 29) % 40 - 20) + 'px"></i>';
    CG.sfx('fire'); UI.modal = { name: 'feu', closable: true, pauses: false }; CG.keys.clear();
    $('dialog').hidden = true; $('modal').className = 'soft flou'; $('panel').className = 'feucamp';
    $('panel').innerHTML = '<div class="fc-braises">' + braises + '</div><div class="fc-titre">Le feu de camp</div>'
      + '<div class="fc-scene"><div class="fc-halo"></div><div class="fc-flamme f1"></div><div class="fc-flamme f2"></div><div class="fc-flamme f3"></div><div class="fc-buches"></div></div>'
      + '<p class="fc-parole">« La fête bat son plein. Les tambours, les rires... et les marmites qui se vident. »</p>'
      + '<div class="fc-infos"><span>🌙 minuit dans <b>' + Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0') + '</b></span><span>🍖 <b>' + Fe.cout() + '</b> par heure</span><span>😄 <b>+' + Fe.MORAL + '</b> moral par heure</span>' + (eco ? '<span>💰 <b>' + eco + '</b> à économiser</span>' : '<span>✅ plus rien à payer ce soir</span>') + '</div>'
      + '<div class="fc-btns"><button id="fc-non">🎉 On continue la fête</button><button id="fc-oui"><b>💤 Éteindre le feu</b><small>tout le monde au lit</small></button></div>';
    $('modal').hidden = false; $('fc-non').onclick = UI.dismiss;
    $('fc-oui').onclick = () => { UI.close(); const f = G.firePos(); G.puff(f.x, f.y - 20, '#9a9a9a', 26, 120, 5); CG.sfx('fire'); if (D.canSleep() && !CG.R.fadeDir) D.startNight(); };
  };
  const css = document.createElement('style');
  css.textContent = '#panel.feucamp{position:relative;width:min(560px,94vw);max-height:none;overflow:hidden;padding:26px 30px 24px;text-align:center;color:#fff0d8;border-radius:24px;border:3px solid #ffb45a;background:radial-gradient(120% 90% at 50% 100%,#6a2a10 0%,#3a1608 45%,#170a08 100%);box-shadow:0 0 60px rgba(255,140,50,.4),0 18px 50px rgba(0,0,0,.7),inset 0 0 60px rgba(255,140,50,.14)}'
    + '.fc-braises{position:absolute;inset:0;pointer-events:none}.fc-braises i{position:absolute;bottom:38%;width:4px;height:4px;border-radius:50%;background:#ffd27a;box-shadow:0 0 8px 2px rgba(255,160,60,.9);opacity:0;animation:fc-br 3s ease-out var(--d) infinite}@keyframes fc-br{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--x),-190px)}}'
    + '.fc-titre{position:relative;font:700 31px Luminari,"Apple Chancery",Georgia,fantasy;letter-spacing:1px;color:#ffe2b0;text-shadow:0 0 18px #ff8a3a,0 3px 0 #2a0e04}'
    + '.fc-scene{position:relative;height:170px;margin-top:4px}.fc-halo{position:absolute;left:50%;top:50%;width:230px;height:170px;margin:-85px 0 0 -115px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,170,70,.55),rgba(255,120,40,0));animation:fc-halo 1.6s ease-in-out infinite alternate}@keyframes fc-halo{from{transform:scale(.92);opacity:.8}to{transform:scale(1.06);opacity:1}}'
    + '.fc-flamme{position:absolute;left:50%;bottom:34px;border-radius:50% 50% 50% 50%/62% 62% 38% 38%;transform-origin:50% 100%;animation:fc-fl 0.9s ease-in-out infinite alternate}.fc-flamme.f1{width:84px;height:118px;margin-left:-42px;background:linear-gradient(#ffb03a,#e8421a);clip-path:polygon(50% 0,72% 30%,92% 58%,82% 92%,50% 100%,18% 92%,8% 58%,30% 34%)}.fc-flamme.f2{width:58px;height:84px;margin-left:-29px;background:linear-gradient(#ffe36b,#ff8a2a);clip-path:polygon(50% 0,74% 36%,90% 64%,78% 94%,50% 100%,22% 94%,10% 64%,30% 38%);animation-duration:.7s;animation-delay:.2s}.fc-flamme.f3{width:30px;height:48px;margin-left:-15px;background:linear-gradient(#fffbe0,#ffe36b);clip-path:polygon(50% 0,78% 44%,86% 74%,50% 100%,14% 74%,24% 44%);animation-duration:.55s}@keyframes fc-fl{from{transform:scale(1,1) skewX(-3deg)}to{transform:scale(.94,1.1) skewX(4deg)}}'
    + '.fc-buches{position:absolute;left:50%;bottom:18px;width:130px;height:24px;margin-left:-65px}.fc-buches::before,.fc-buches::after{content:"";position:absolute;left:8px;right:8px;top:6px;height:14px;border-radius:7px;background:linear-gradient(#7a4a22,#3a2010);box-shadow:0 3px 6px rgba(0,0,0,.5)}.fc-buches::before{transform:rotate(11deg)}.fc-buches::after{transform:rotate(-11deg)}'
    + '.fc-parole{position:relative;margin:2px 0 14px;font:italic 16px Georgia,serif;color:#f0d2a8}'
    + '.fc-infos{position:relative;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:18px}.fc-infos span{padding:6px 12px;border-radius:20px;font-size:14px;background:rgba(0,0,0,.35);border:1px solid rgba(255,190,110,.4)}.fc-infos b{color:#ffe36b}'
    + '.fc-btns{position:relative;display:flex;gap:14px;justify-content:center;align-items:center}#panel.feucamp button{width:auto;cursor:pointer;font-family:inherit}#panel.feucamp #fc-non{padding:11px 18px;font-size:15px;color:#f0d2a8;background:rgba(0,0,0,.3);border:1.5px solid rgba(255,190,110,.45);border-radius:14px}#panel.feucamp #fc-non:hover{color:#fff;border-color:#ffd9a0}'
    + '#panel.feucamp #fc-oui{display:flex;flex-direction:column;align-items:center;padding:11px 28px;font-size:20px;color:#fff;text-shadow:0 2px 2px rgba(20,10,60,.7);border:3px solid #cfd8ff;border-radius:16px;background:linear-gradient(#5a6ad8,#2a2a7a);box-shadow:0 6px 0 #14143e,0 0 26px rgba(120,140,255,.55);transition:transform .12s}#panel.feucamp #fc-oui small{font-size:12px;opacity:.85;font-weight:normal}#panel.feucamp #fc-oui:hover{transform:translateY(-2px) scale(1.03)}#panel.feucamp #fc-oui:active{transform:translateY(5px);box-shadow:0 1px 0 #14143e}';
  document.head.appendChild(css);
})(window.CG);
