// Goblin Malin — le feu de camp : il soigne un peu (seulement allumé), s'améliore trois fois (au feu même, contre des ressources), et change de couleur avec les poudres de la sorcière.
// Aussi ici : le sort « Peau de salamandre » (protection contre le feu).
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, Fe = CG.Feu = {};
  Fe.SOIN = [2, 3, 5, 8];          // points de vie rendus toutes les 15 minutes de jeu, selon le niveau du feu
  Fe.RAYON = [160, 180, 200, 225]; // jusqu'où il réchauffe
  Fe.TECHS = ['f1', 'f2', 'f3'];
  Fe.POUDRES = {
    bleu: { nom: 'Poudre d\'ardeur', icon: '🔵', court: 'Demain matin, tout le clan travaille plus vite.', prix: 260, jusqua: 13, cols: ['#2f8fff', '#9fe0ff', '#e8fbff'], desc: 'Ce soir, ton feu brûle bleu. Demain jusqu\'à 13 h, tout le clan travaille 50 % plus vite, marche plus vite et ne vient plus te poser de questions.', matin: 'La flamme bleue a donné de l\'ardeur au clan : tout le monde travaille plus fort jusqu\'à 13 h.' },
    mauve: { nom: 'Poudre de bravoure', icon: '🟣', court: 'Demain, tout le clan se bat mieux.', prix: 340, jusqua: 20, cols: ['#9a4ae0', '#d8a8ff', '#f6e8ff'], desc: 'Ce soir, ton feu brûle mauve. Demain toute la journée, tes gardes frappent 30 % plus fort, toi 15 %, et tes gobelins encaissent 30 % de dégâts en moins.', matin: 'La flamme mauve a rendu le clan brave : gardes plus forts et gobelins plus résistants jusqu\'au soir.' }
  };
  // le niveau du feu : il ne vient plus de l'arbre, on l'améliore au feu lui-même (E), contre des ressources et un niveau de chef suffisant.
  // Les anciennes parties gardent les crans déjà appris dans l'arbre (et leurs points de technologie sont rendus).
  const ancien = () => Fe.TECHS.filter(id => G.tech(id)).length;
  Fe.lvl = () => { const S = CG.S; return Math.min(3, S && S.feuNiv !== undefined ? S.feuNiv : ancien()); };
  Fe.PALIERS = [null, { niv: 7, cout: { bois: 200, food: 100, minerai: 30, or: 350 }, nom: 'Foyer de pierres' }, { niv: 15, cout: { bois: 400, food: 200, minerai: 80, or: 900 }, nom: 'Braises ardentes' }, { niv: 24, cout: { bois: 800, food: 400, minerai: 160, or: 2000 }, nom: 'Brasier des braves' }];
  Fe.ameliorer = function () {
    const S = CG.S, l = Fe.lvl(), P = Fe.PALIERS[l + 1]; if (!P || S.player.lvl < P.niv || !G.canPay(P.cout)) return false; G.pay(P.cout); S.feuNiv = l + 1;
    const f = G.firePos(), R = CG.R; for (let i = 0; i < 4; i++) R.rings.push({ x: f.x, y: f.y - 8, r: 50 + i * 44, life: Math.min(0.95, 0.4 + i * 0.14), col: i % 2 ? '#ffe36b' : '#ff8a1e' }); G.puff(f.x, f.y - 20, '#ff8a1e', 40, 240, 5); G.puff(f.x, f.y - 30, '#ffe36b', 26, 180, 4); CG.sfx('fire'); CG.sfx('level');
    S.morale = Math.min(100, S.morale + 5); G.banner('🔥 ' + P.nom + ' !', 'Ton feu de camp monte d\'un cran : il soigne ' + Fe.SOIN[l + 1] + ' points de vie toutes les 15 minutes quand il est allumé, et réchauffe plus loin. (Moral +5)', '#ffd0a0'); return true;
  };
  Fe.NOMS = ['Petit feu de camp', 'Foyer de pierres', 'Braises ardentes', 'Brasier des braves'];
  const cases = r => String(Math.round(r / T * 2) / 2).replace('.', ',');
  // la fenêtre du feu : notre vrai feu, dessiné en direct. L'amélioration ne se montre que lorsque le chef a le niveau qu'il faut.
  Fe.menu = function () {
    const S = CG.S, R = CG.R, UI = CG.UI, $ = id => document.getElementById(id), l = Fe.lvl(), P = Fe.PALIERS[l + 1], pret = !!P && S.player.lvl >= P.niv;
    const feu = S.buildings.find(b => b.type === 'fire' && !b.site); if (!feu) return;
    const manque = pret ? Object.keys(P.cout).filter(r => (S.res[r] || 0) < P.cout[r]) : [];
    let braises = ''; for (let i = 0; i < 16; i++) braises += '<i style="left:' + (6 + (i * 47) % 88) + '%;--d:' + (i % 8) * 0.38 + 's;--x:' + ((i * 29) % 44 - 22) + 'px"></i>';
    let h = '<div class="fn-braises">' + braises + '</div><div class="fn-titre">' + Fe.NOMS[l] + '</div><div class="fn-etat" id="fn-etat"></div>'
      + '<div class="fn-scene"><div class="fn-halo"></div><div class="fn-sol"></div><canvas id="fn-cv" width="720" height="400"></canvas></div>'
      + '<p class="fn-parole" id="fn-parole"></p>'
      + '<div class="fn-infos"><span>❤️ <b>+' + Fe.SOIN[l] + '</b> vie toutes les 15 min</span><span>🔥 jusqu\'à <b>' + cases(Fe.RAYON[l]) + '</b> cases</span>' + (S.feuPoudre && Fe.POUDRES[S.feuPoudre] ? '<span>' + Fe.POUDRES[S.feuPoudre].icon + ' ' + Fe.POUDRES[S.feuPoudre].nom + ' pour ce soir</span>' : '') + '</div>';
    if (pret) h += '<div class="fn-carte"><div class="fn-sur">✨ Ton feu peut grandir ✨</div><div class="fn-nom">' + P.nom + '</div>'
      + '<div class="fn-gain"><span>❤️ ' + Fe.SOIN[l] + ' <i>➜</i> <b>' + Fe.SOIN[l + 1] + '</b></span><span>🔥 ' + cases(Fe.RAYON[l]) + ' <i>➜</i> <b>' + cases(Fe.RAYON[l + 1]) + '</b> cases</span></div>'
      + '<div class="fn-cout">' + Object.keys(P.cout).map(r => '<span' + ((S.res[r] || 0) < P.cout[r] ? ' class="manque"' : '') + '>' + CG.RES[r].icon + ' <b>' + P.cout[r] + '</b></span>').join('') + '</div></div>';
    else if (!P) h += '<p class="fn-max">Un vrai brasier de chef : il ne peut pas être plus beau.</p>';
    h += '<div class="fn-btns"><button id="fn-non">' + (pret ? 'Plus tard' : 'S\'éloigner') + '</button>' + (pret ? '<button id="fn-oui"' + (manque.length ? ' disabled' : '') + '><b>🔥 Faire grandir le feu</b>' + (manque.length ? '<small>il te manque des ressources</small>' : '') + '</button>' : '') + '</div>';
    CG.sfx('uiOpen'); UI.modal = { name: 'feuNiv', closable: true, pauses: false }; CG.keys.clear();
    $('dialog').hidden = true; $('modal').className = 'soft flou'; $('panel').className = 'feuniv'; $('panel').innerHTML = h; $('modal').hidden = false;
    $('fn-non').onclick = UI.dismiss; if (pret && !manque.length) $('fn-oui').onclick = () => { UI.close(); Fe.ameliorer(); };
    // le feu en direct : le même dessin que dans le village, allumé ou éteint comme lui
    const cv = $('fn-cv'), g = cv.getContext('2d'), K = 4.3, fx = (feu.tx + feu.w / 2) * T, fy = (feu.ty + feu.h) * T - T / 2; let vu = null;
    const image = () => {
      if (!UI.modal || UI.modal.name !== 'feuNiv' || !cv.isConnected || !CG.S) return;
      const lit = !!CG.R.fireLit;
      if (lit !== vu) { vu = lit; $('panel').classList.toggle('allume', lit); $('fn-etat').textContent = lit ? '🔥 Allumé' : '💤 Éteint';
        $('fn-parole').textContent = lit ? '« Il brûle fort. Reste près de lui : il te rend des forces. »' : '« Il dort. Il se rallume le soir, pour la fête, et c\'est là qu\'il soigne. »'; }
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.setTransform(K, 0, 0, K, cv.width / 2 - fx * K, cv.height - 14 * K - fy * K);
      try { Art.building(g, feu, performance.now() / 1000, lit); } catch (e) { return; }
      requestAnimationFrame(image);
    };
    image();
  };
  { const css = document.createElement('style');
    css.textContent = '#panel.feuniv{position:relative;width:min(540px,94vw);max-height:96vh;overflow:hidden auto;padding:22px 28px 20px;text-align:center;color:#e6e2da;border-radius:26px;border:1.5px solid rgba(190,200,215,.35);background:radial-gradient(120% 80% at 50% 46%,#34383f 0%,#1d2026 55%,#101216 100%);box-shadow:0 24px 70px rgba(0,0,0,.75),inset 0 1px 0 rgba(255,255,255,.12);animation:fnIn .38s cubic-bezier(.2,1.3,.4,1);transition:border-color .8s,box-shadow .8s}@keyframes fnIn{from{transform:scale(.84) translateY(18px);opacity:0}}'
      + '#panel.feuniv.allume{color:#fff0d8;border-color:rgba(255,180,90,.75);background:radial-gradient(120% 80% at 50% 50%,#6a2c10 0%,#34150a 50%,#150a08 100%);box-shadow:0 0 70px rgba(255,140,50,.42),0 24px 70px rgba(0,0,0,.75),inset 0 0 70px rgba(255,140,50,.14)}'
      + '.fn-braises{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .8s}.allume .fn-braises{opacity:1}.fn-braises i{position:absolute;bottom:46%;width:4px;height:4px;border-radius:50%;background:#ffd27a;box-shadow:0 0 8px 2px rgba(255,160,60,.9);opacity:0;animation:fnBr 3s ease-out var(--d) infinite}@keyframes fnBr{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--x),-200px)}}'
      + '.fn-titre{position:relative;font:700 31px Luminari,"Apple Chancery",Georgia,fantasy;letter-spacing:1px;color:#e8e4dc;text-shadow:0 3px 0 rgba(0,0,0,.6)}.allume .fn-titre{color:#ffe2b0;text-shadow:0 0 18px #ff8a3a,0 3px 0 #2a0e04}'
      + '.fn-etat{position:relative;display:inline-block;margin-top:8px;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#b8c0cc;background:rgba(255,255,255,.07);border:1px solid rgba(190,200,215,.3)}.allume .fn-etat{color:#ffd9a0;background:rgba(255,140,50,.18);border-color:rgba(255,180,90,.6)}'
      + '.fn-scene{position:relative;height:min(200px,25vh);aspect-ratio:1.8;margin:2px auto 0}.fn-scene canvas{position:absolute;left:0;top:0;width:100%;height:100%}'
      + '.fn-sol{position:absolute;left:10%;bottom:1%;width:80%;height:36%;border-radius:50%;background:radial-gradient(closest-side,rgba(96,84,62,.85),rgba(60,56,48,.5) 70%,rgba(40,40,40,0))}.allume .fn-sol{background:radial-gradient(closest-side,rgba(150,96,44,.9),rgba(96,48,20,.5) 70%,rgba(60,24,10,0))}'
      + '.fn-halo{position:absolute;left:4%;bottom:0;width:92%;height:112%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,170,70,.5),rgba(255,120,40,0));opacity:0;transition:opacity .8s;animation:fnHalo 1.6s ease-in-out infinite alternate}.allume .fn-halo{opacity:1}@keyframes fnHalo{from{transform:scale(.92)}to{transform:scale(1.06)}}'
      + '.fn-parole{position:relative;margin:6px 0 10px;font:italic 16px Georgia,serif;color:#b9bcc2}.allume .fn-parole{color:#f0d2a8}'
      + '.fn-infos,.fn-gain,.fn-cout{position:relative;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}.fn-infos{margin-bottom:14px}.fn-infos span{padding:6px 12px;border-radius:20px;font-size:14px;background:rgba(0,0,0,.35);border:1px solid rgba(200,200,200,.22)}.allume .fn-infos span{border-color:rgba(255,190,110,.4)}.fn-infos b,.fn-gain b{color:#ffe36b}'
      + '.fn-carte{position:relative;margin:0 0 14px;padding:11px 16px 13px;border-radius:18px;background:linear-gradient(rgba(255,200,110,.16),rgba(255,140,50,.07));border:1.5px solid rgba(255,200,120,.55);box-shadow:0 0 26px rgba(255,160,60,.22),inset 0 1px 0 rgba(255,255,255,.14);animation:fnCarte 2s ease-in-out infinite alternate}@keyframes fnCarte{to{box-shadow:0 0 40px rgba(255,170,70,.42),inset 0 1px 0 rgba(255,255,255,.14)}}'
      + '.fn-sur{font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#ffd27a}.fn-nom{margin:3px 0 9px;font:700 25px Luminari,"Apple Chancery",Georgia,fantasy;color:#fff3d8;text-shadow:0 0 14px rgba(255,150,60,.8)}'
      + '.fn-gain{margin-bottom:11px;font-size:15px}.fn-gain i{font-style:normal;opacity:.6}.fn-cout span{padding:6px 12px;border-radius:12px;font-size:15px;background:rgba(0,0,0,.4);border:1px solid rgba(160,230,150,.5)}.fn-cout b{color:#c8ffb0}.fn-cout span.manque{border-color:rgba(255,120,110,.7)}.fn-cout span.manque b{color:#ff9a8a}'
      + '.fn-max{position:relative;margin:0 0 16px;font-size:15px;color:#ffd9a0}'
      + '.fn-btns{position:relative;display:flex;gap:14px;justify-content:center;align-items:center}#panel.feuniv button{width:auto;cursor:pointer;font-family:inherit}#panel.feuniv #fn-non{padding:11px 22px;font-size:15px;color:#d8d4cc;background:rgba(0,0,0,.3);border:1.5px solid rgba(200,200,200,.35);border-radius:14px}#panel.feuniv #fn-non:hover{color:#fff;border-color:#fff}'
      + '#panel.feuniv #fn-oui{display:flex;flex-direction:column;align-items:center;padding:12px 28px;font-size:20px;color:#fff;text-shadow:0 2px 2px rgba(80,20,0,.8);border:3px solid #ffe2b0;border-radius:16px;background:linear-gradient(#ffa63a,#e8561a 55%,#b0300e);box-shadow:0 6px 0 #5a1a06,0 0 26px rgba(255,150,60,.7),inset 0 2px 0 rgba(255,255,255,.45);transition:transform .12s}#panel.feuniv #fn-oui small{font-size:12px;opacity:.9;font-weight:normal}#panel.feuniv #fn-oui:hover:not(:disabled){transform:translateY(-2px) scale(1.03)}#panel.feuniv #fn-oui:active:not(:disabled){transform:translateY(5px);box-shadow:0 1px 0 #5a1a06}#panel.feuniv #fn-oui:disabled{cursor:default;filter:grayscale(.75) brightness(.75);box-shadow:0 6px 0 #2a2a2a}'
      + '@media (prefers-reduced-motion:reduce){#panel.feuniv,.fn-braises i,.fn-halo,.fn-carte{animation:none}}';
    document.head.appendChild(css); }
  { const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments), S = CG.S, n = ancien(); if (n && S.tech && !S.tech.feuRendu) { S.tech.feuRendu = true; S.tech.points = (S.tech.points || 0) + 2 * n; } return r; }; } // les points mis dans les anciennes cases du feu sont rendus
  { const fi0 = D.findInteract; D.findInteract = function () { const it = fi0.apply(this, arguments), S = CG.S, R = CG.R; if (it || R.ko > 0 || R.cine || R.build || R.alarm || !S.buildings.some(b => b.type === 'fire' && !b.site)) return it; const f = G.firePos(), p = S.player; if (Math.hypot(f.x - p.x, f.y - p.y) < 62) return { type: 'feuCamp', obj: { x: f.x, y: f.y - 40 }, label: Fe.PALIERS[Fe.lvl() + 1] && p.lvl >= Fe.PALIERS[Fe.lvl() + 1].niv ? 'Améliorer le feu de camp 🔥' : 'Regarder le feu de camp 🔥' }; return it; };
    const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'feuCamp') return Fe.menu(); return in0.apply(this, arguments); }; }
  Fe.buff = () => { const S = CG.S, b = S && S.feuBuff; return b && b.day === S.day && Fe.POUDRES[b.k] && S.hour < Fe.POUDRES[b.k].jusqua ? b.k : null; };
  Fe.couleur = () => { const S = CG.S; return (S && S.feuPoudre) || Fe.buff(); };

  // (les trois cases du feu ne sont plus dans l'arbre des technologies)

  // ---------- il soigne : toutes les 15 minutes de jeu, ceux qui sont près de lui ----------
  const up0 = G.update;
  G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || R.night) return; const p = S.player;
    if (R.pareFeu > 0) R.pareFeu -= dt;
    // il ne soigne que lorsqu'il brûle (le soir, pendant la fête) : éteint, en plein jour, il ne fait rien
    const q = Math.floor(S.hour * 4); if (R.feuQ === undefined) R.feuQ = q;
    if (q !== R.feuQ && !R.fireLit) R.feuQ = q;
    if (q !== R.feuQ) {
      R.feuQ = q; const f = G.firePos(), L = Fe.lvl(), n = Fe.SOIN[L], r = Fe.RAYON[L]; let any = false;
      if (R.ko <= 0 && Math.hypot(p.x - f.x, p.y - f.y) < r && p.hp < p.maxhp) { p.hp = Math.min(p.maxhp, p.hp + n); G.text(p.x, p.y - 58, '+' + n + ' ❤', '#ffb08a'); any = true; }
      for (const g of S.goblins) { if (g.hidden || g.ko === true || Math.hypot(g.x - f.x, g.y - f.y) > r) continue; const mh = G.gobMaxHp(g); if (g.hp < mh) { g.hp = Math.min(mh, g.hp + n); any = true; if (CG.onScreen(g.x, g.y)) G.text(g.x, g.y - 44, '+' + n + ' ❤', '#ffb08a'); } }
      if (CG.P) for (const a of S.pets || []) { if (a.ko || Math.hypot(a.x - f.x, a.y - f.y) > r) continue; const mh = CG.P.maxHp(a); if (a.hp < mh) { a.hp = Math.min(mh, a.hp + n); any = true; if (CG.onScreen(a.x, a.y)) G.text(a.x, a.y - 40, '+' + n + ' ❤', '#ffb08a'); } }
      if (any) G.puff(f.x, f.y - 20, '#ffb05a', 8, 70, 3);
    }
    // l'ardeur de la flamme bleue : personne ne vient déranger le chef, et de petites étincelles suivent les gobelins
    const k = Fe.buff(); if (!k) return;
    for (const g of S.goblins) { if (k === 'bleu' && g.ask) { g.ask = null; G.resetGoblin(g); } if (!g.hidden && Math.random() < dt * 0.9) R.parts.push({ x: g.x + (Math.random() - 0.5) * 14, y: g.y - 30, vx: 0, vy: -26, life: 0.6, max: 0.6, col: Fe.POUDRES[k].cols[1], size: 2.4, float: true }); }
  };

  // ---------- les poudres : achetées à la sorcière, elles agissent le lendemain ----------
  Fe.stock = () => Object.keys(Fe.POUDRES).map(k => { const P = Fe.POUDRES[k]; return { icon: P.icon, label: P.nom, desc: P.court || P.desc, prix: P.prix, stock: 1, buy: () => { CG.S.feuPoudre = k; CG.UI.toast(P.icon + ' ' + P.nom + ' : tu la jetteras dans le feu ce soir. Son effet commence demain matin.'); } }; });
  const nd = D.nextDay;
  D.nextDay = function () {
    const S0 = CG.S, k = S0.feuPoudre; const r = nd.apply(this, arguments);
    if (k && Fe.POUDRES[k]) { CG.S.feuBuff = { k, day: CG.S.day }; CG.S.feuPoudre = null; setTimeout(() => { if (CG.running) CG.UI.toast(Fe.POUDRES[k].icon + ' ' + Fe.POUDRES[k].matin); }, 9000); }
    return r;
  };
  const ws = G.workSpeed; G.workSpeed = g => ws(g) * (Fe.buff() === 'bleu' ? 1.5 : 1);
  const es = G.evoSpd; G.evoSpd = g => es(g) * (Fe.buff() === 'bleu' ? 1.15 : 1);
  const gd = G.guardDmg; G.guardDmg = g => gd(g) * (Fe.buff() === 'mauve' ? 1.3 : 1);
  const pd = G.playerDmg; if (pd) G.playerDmg = function () { return pd.apply(this, arguments) * (Fe.buff() === 'mauve' ? 1.15 : 1); };

  // ---------- le sort : Peau de salamandre ----------
  Fe.PARE = { dur: 20, chef: 0.2, clan: 0.5, rayon: 230 };
  CG.SPELLS.parefeu = { nom: 'Peau de salamandre', icon: '🦎', mp: 14, prix: 700, desc: 'Pendant 20 secondes, le feu ne te fait presque plus rien (boules de feu, souffles et pluies de flammes : 80 % de dégâts en moins), et moitié moins à tes gobelins tout près de toi.', color: '#ff9a4a' };
  CG.SCROLL_POOL.push('parefeu');
  const cast0 = G.cast;
  G.cast = function (id) {
    if (id !== 'parefeu') return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine) return;
    const cost = G.spellCost(id); if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell'); R.pareFeu = Fe.PARE.dur;
    R.rings.push({ x: p.x, y: p.y - 6, r: 90, life: 0.5, col: '#ff9a4a' }); G.puff(p.x, p.y - 20, '#ff9a4a', 20, 120, 4); G.text(p.x, p.y - 70, '🦎 Peau de salamandre !', '#ffd0a0', true);
  };
  // R.feuSrc est levé par le jeu au moment précis où un dégât de feu est appliqué (tir magique ennemi, flammes d'un démon)
  const hp0 = G.hurtPlayer;
  G.hurtPlayer = function (dmg) {
    const R = CG.R; if (R.feuSrc && R.pareFeu > 0) { const p = CG.S.player; dmg *= Fe.PARE.chef; G.text(p.x, p.y - 60, '🦎', '#ffd0a0'); G.puff(p.x, p.y - 20, '#ff9a4a', 5, 60, 3); }
    return hp0.call(this, dmg);
  };
  const hg0 = G.hurtGoblin;
  G.hurtGoblin = function (g, dmg) {
    const R = CG.R, p = CG.S.player;
    if (R.feuSrc && R.pareFeu > 0 && Math.hypot(g.x - p.x, g.y - p.y) < Fe.PARE.rayon) dmg *= Fe.PARE.clan;
    if (Fe.buff() === 'mauve') dmg *= 0.7;
    return hg0.call(this, g, dmg);
  };
  const mk0 = CG.Magie.marks;
  CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!(R.pareFeu > 0) || R.ko > 0) return; const p = CG.S.player, a = Math.min(1, R.pareFeu / 2);
    g.save(); g.globalAlpha = 0.55 * a; g.strokeStyle = '#ff9a4a'; g.lineWidth = 3; g.setLineDash([10, 8]); g.lineDashOffset = -t * 30; g.beginPath(); g.ellipse(p.x, p.y - 4, 30, 13, 0, 0, TAU); g.stroke(); g.setLineDash([]);
    g.globalAlpha = 0.16 * a; g.fillStyle = '#ffb060'; g.beginPath(); g.ellipse(p.x, p.y - 24, 24, 34, 0, 0, TAU); g.fill(); g.restore();
  };

  // ---------- le dessin : pierres de plus en plus belles, flamme plus grosse, et la couleur des poudres ----------
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  function flammes(g, fx, fy, t, k, cols) {
    for (let i = 0; i < 5; i++) {
      const ph = t * 7 + i * 1.7, hh = (30 + Math.sin(ph) * 8 + (i === 2 ? 16 : 0)) * k, xx = fx + (i - 2) * 6 * k + Math.sin(ph * 0.7) * 2, w = 8 * k;
      g.fillStyle = cols[i % 2]; g.beginPath(); g.moveTo(xx - w, fy); g.quadraticCurveTo(xx - w - 1, fy - hh * 0.5, xx + Math.sin(ph) * 4, fy - hh); g.quadraticCurveTo(xx + w + 1, fy - hh * 0.5, xx + w, fy); g.fill();
    }
    if (cols[2]) { const hh = (20 + Math.sin(t * 9) * 4) * k; g.fillStyle = cols[2]; g.beginPath(); g.moveTo(fx - 5 * k, fy); g.quadraticCurveTo(fx - 5 * k, fy - hh * 0.5, fx + Math.sin(t * 8) * 2, fy - hh); g.quadraticCurveTo(fx + 5 * k, fy - hh * 0.5, fx + 5 * k, fy); g.fill(); }
  }
  const bu = Art.building;
  Art.building = function (g, b, t, lit) {
    if (b.type !== 'fire') return bu.apply(this, arguments);
    const L = CG.S ? Fe.lvl() : 0, col = CG.S ? Fe.couleur() : null, fx = (b.tx + b.w / 2) * T, fy = (b.ty + b.h) * T - T / 2;
    // derrière : les pierres dressées du brasier des braves
    if (L >= 3) [[-34, -8], [34, -8]].forEach(([dx, dy]) => { ell(g, fx + dx, fy + dy + 8, 8, 3, 'rgba(0,0,0,0.25)'); g.fillStyle = '#7e7a72'; g.beginPath(); g.moveTo(fx + dx - 6, fy + dy + 8); g.lineTo(fx + dx - 4, fy + dy - 14); g.lineTo(fx + dx + 3, fy + dy - 18); g.lineTo(fx + dx + 6, fy + dy + 8); g.closePath(); g.fill(); g.fillStyle = lit ? '#ffcf6a' : '#a8a296'; g.fillRect(fx + dx - 1.5, fy + dy - 8, 3, 7); });
    bu.apply(this, arguments);
    if (L >= 1) { // un vrai cercle de pierres, plus large et plus clair
      const n = L >= 2 ? 14 : 11, rx = L >= 2 ? 31 : 28, ry = L >= 2 ? 14 : 12.5;
      for (let i = 0; i < n; i++) { const a = i / n * TAU + 0.2, x = fx + Math.cos(a) * rx, y = fy + 5 + Math.sin(a) * ry; if (Math.sin(a) < -0.2 && lit) continue; /* celles du fond passent derrière la flamme */ ell(g, x, y + 2, 6.5, 3, 'rgba(0,0,0,0.22)'); ell(g, x, y, 6.5, 5, i % 3 === 0 ? '#b4aea0' : i % 3 === 1 ? '#9a958a' : '#a8a498'); ell(g, x - 1.5, y - 1.5, 3, 2, 'rgba(255,255,255,0.28)'); }
    }
    if (L >= 2 && !lit) { const gl = 0.45 + Math.sin(t * 3) * 0.2; ell(g, fx, fy + 1, 9, 4, 'rgba(255,120,40,' + gl + ')'); } // des braises, même en plein jour
    if (lit && (L >= 2 || col)) flammes(g, fx, fy, t, [1, 1, 1.22, 1.45][L], col ? Fe.POUDRES[col].cols : L >= 3 ? ['#ff9a1e', '#ffd23a', '#fff3b0'] : ['#ff8a1e', '#ffb432']);
    if (L >= 1) for (let i = 0; i < 5; i++) { const a = (i / 5 * TAU + 0.2) * 0 + (0.35 + i * 0.6), x = fx + Math.cos(a) * (L >= 2 ? 31 : 28), y = fy + 5 + Math.sin(a) * (L >= 2 ? 14 : 12.5); ell(g, x, y, 6.5, 5, i % 2 ? '#b4aea0' : '#9a958a'); ell(g, x - 1.5, y - 1.5, 3, 2, 'rgba(255,255,255,0.28)'); } // celles de devant, par-dessus la flamme
  };

  // ---------- la fiole de vie : un vrai petit flacon rouge (plus tard viendront des potions plus grosses) ----------
  Art.fiole = function (g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#8a5a2a'; g.fillRect(-3, -15, 6, 4);                                   // le bouchon de liège
    g.fillStyle = 'rgba(220,240,255,0.9)'; g.fillRect(-2.6, -11.5, 5.2, 5);              // le goulot de verre
    g.beginPath(); g.arc(0, 0, 7.6, 0, TAU); g.fill();                                    // le ventre de verre
    g.fillStyle = '#d81e2c'; g.beginPath(); g.arc(0, 0, 6.3, -0.25, Math.PI + 0.25); g.closePath(); g.fill(); g.fillRect(-6.1, -1.6, 12.2, 1.8); // le liquide rouge
    g.fillStyle = '#ff5a62'; g.beginPath(); g.ellipse(0, -1.4, 6, 1.5, 0, 0, TAU); g.fill();   // la surface
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(-3, -1.5, 1.4, 3, 0.5, 0, TAU); g.fill(); // le reflet
    g.strokeStyle = '#5a1018'; g.lineWidth = 1.1; g.beginPath(); g.arc(0, 0, 7.6, -1.2, Math.PI + 1.2); g.lineTo(-2.6, -11.5); g.moveTo(2.6, -11.5); g.lineTo(2.75, -7.1); g.stroke();
    g.restore();
  };
  Fe.FIOLE_SVG = '<svg class="fiole" viewBox="-10 -17 20 27" width="20" height="27"><rect x="-3" y="-15.5" width="6" height="4.5" rx="1" fill="#8a5a2a"/><rect x="-2.6" y="-11.5" width="5.2" height="6" fill="#e4f2ff"/><circle r="7.8" fill="#e4f2ff" stroke="#5a1018" stroke-width="1.2"/><path d="M-6.4 -1.2 A6.5 6.5 0 0 0 6.4 -1.2 Z" fill="#d81e2c"/><ellipse cy="-1.2" rx="6.3" ry="1.5" fill="#ff5a62"/><ellipse cx="-3.2" cy="-1.6" rx="1.3" ry="2.8" fill="#fff" opacity="0.75" transform="rotate(25 -3.2 -1.6)"/></svg>';
})(window.CG);
