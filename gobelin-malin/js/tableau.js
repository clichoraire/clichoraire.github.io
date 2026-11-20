// Clan Gobelin — le tableau des nouvelles : un gros panneau de bois près du feu. Chaque matin, on y cloue ce qui s'est passé la veille,
// et les nouvelles les plus importantes défilent en petites annonces au réveil.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, T = CG.TILE, TAU = Math.PI * 2, Tb = CG.Tableau = { ANNONCES: 3 };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const EMO = /^((?:\p{Extended_Pictographic}|\p{Regional_Indicator})️?(?:‍\p{Extended_Pictographic}️?)*)\s*/u;

  // ---------- récolter les nouvelles de la nuit ----------
  let prises = null;
  const an0 = G.applyNames; G.applyNames = function (lines) { // dernier passage sur la liste du matin, juste avant que le jour change
    const r = an0.apply(this, arguments), S = CG.S, st = CG.R.dayStats || {};
    const rec = ['food', 'bois', 'minerai', 'cuir', 'or'].filter(k => st[k] > 0).map(k => '+' + Math.round(st[k]) + ' ' + CG.RES[k].icon), bilan = [];
    if (rec.length) bilan.push('📦 Rapporté au village hier : ' + rec.join('   '));
    if (st.kills) bilan.push('⚔️ ' + st.kills + ' ennemi' + (st.kills > 1 ? 's vaincus' : ' vaincu') + ' hier.');
    if (st.morale0 !== undefined) { const d = Math.round(S.morale) - st.morale0; if (d) bilan.push((d > 0 ? '😄 Le moral du clan a monté de ' + d : '😟 Le moral du clan a baissé de ' + -d) + ' : il est à ' + Math.round(S.morale) + ' %.'); }
    prises = { day: S.day, lines: lines || [], bilan }; return r;
  };
  const nd0 = D.nextDay; D.nextDay = function () {
    prises = null; const r = nd0.apply(this, arguments), S = CG.S; if (!prises) return r;
    const lines = prises.lines.concat(prises.bilan).map(String); S.nouvelles = { day: prises.day, lines, lu: false }; prises = null;
    // les petites annonces du réveil : les plus importantes d'abord, puis le rappel du tableau
    const jeu = S, top = lines.filter(l => !l.startsWith('📦') && !l.startsWith('😄 Le moral') ).slice(0, Tb.ANNONCES - 1);
    top.forEach((l, i) => setTimeout(() => { if (CG.S === jeu && CG.running !== false) UI.toast(l); }, 1500 + i * 1900));
    setTimeout(() => { if (CG.S === jeu && S.nouvelles && !S.nouvelles.lu) UI.toast('📋 ' + (lines.length > top.length ? 'Toutes les nouvelles d\'hier' : 'Les nouvelles d\'hier') + ' sont clouées sur le tableau, près du feu.'); }, 1500 + top.length * 1900);
    try { CG.save(); } catch (e) { }
    return r;
  };

  // ---------- où planter le panneau : près du feu, sur une case libre ----------
  Tb.pos = function () {
    const R = CG.R, f = G.firePos(); if (R.tabPos && R.tabFeu === f.x + ':' + f.y && W.walkPx(R.tabPos.x, R.tabPos.y + 8)) return R.tabPos;
    R.tabFeu = f.x + ':' + f.y; R.tabPos = null;
    for (const [dx, dy] of [[-150, -78], [150, -78], [-176, 30], [176, 30], [0, -150], [-110, 120], [110, 120], [-220, -40], [220, -40], [0, 170]]) { const x = f.x + dx, y = f.y + dy; const libre = W.walkPx(x, y) && W.walkPx(x, y + 12) && W.walkPx(x - 26, y + 8) && W.walkPx(x + 26, y + 8), degage = W.walkPx(x, y - 44) && W.walkPx(x - 30, y - 44) && W.walkPx(x + 30, y - 44) && W.walkPx(x, y - 84); if (libre && !R.tabPos) R.tabPos = { x, y }; /* à défaut de mieux */ if (libre && degage) { R.tabPos = { x, y }; break; } } // de préférence sans hutte juste derrière
    return R.tabPos;
  };
  Tb.draw = function (g, o, t) {
    const x = o.x, y = o.y, S = CG.S, n = S.nouvelles, neuf = n && !n.lu;
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x, y + 3, 40, 8, 0, 0, TAU); g.fill();
    g.fillStyle = '#5a3a1c'; g.fillRect(x - 30, y - 62, 7, 66); g.fillRect(x + 23, y - 62, 7, 66); g.fillStyle = '#7a5228'; g.fillRect(x - 30, y - 62, 2.5, 66); g.fillRect(x + 23, y - 62, 2.5, 66);
    g.fillStyle = '#6b4520'; g.beginPath(); g.moveTo(x - 42, y - 62); g.lineTo(x, y - 78); g.lineTo(x + 42, y - 62); g.lineTo(x + 42, y - 57); g.lineTo(x - 42, y - 57); g.closePath(); g.fill(); // petit toit
    g.fillStyle = '#8a5c2c'; g.beginPath(); g.moveTo(x - 42, y - 62); g.lineTo(x, y - 78); g.lineTo(x + 42, y - 62); g.lineTo(x, y - 73); g.closePath(); g.fill();
    g.fillStyle = '#9a6a34'; g.fillRect(x - 36, y - 57, 72, 40); g.fillStyle = '#b07c40'; g.fillRect(x - 36, y - 57, 72, 3);
    g.strokeStyle = 'rgba(60,36,14,0.55)'; g.lineWidth = 1; g.beginPath(); for (let i = 1; i < 4; i++) { g.moveTo(x - 36, y - 57 + i * 10); g.lineTo(x + 36, y - 57 + i * 10); } g.stroke();
    g.strokeStyle = '#4a2e14'; g.lineWidth = 2; g.strokeRect(x - 36, y - 57, 72, 40);
    // les feuilles clouées
    const k = n ? Math.min(5, Math.max(1, n.lines.length)) : 0, P = [[-27, -52, 15, 18, -0.08], [-8, -53, 16, 14, 0.06], [12, -51, 17, 19, -0.04], [-22, -32, 18, 12, 0.07], [3, -34, 14, 13, -0.1]];
    for (let i = 0; i < k; i++) { const q = P[i]; g.save(); g.translate(x + q[0] + q[2] / 2, y + q[1] + q[3] / 2); g.rotate(q[4]); g.fillStyle = neuf ? '#fff6d8' : '#e2d3a8'; g.fillRect(-q[2] / 2, -q[3] / 2, q[2], q[3]); g.fillStyle = 'rgba(90,60,30,0.55)'; for (let j = 0; j < 3; j++) g.fillRect(-q[2] / 2 + 2, -q[3] / 2 + 4 + j * 3.4, q[2] - 4 - (j === 2 ? 4 : 0), 1); g.fillStyle = '#b03a2a'; g.beginPath(); g.arc(0, -q[3] / 2 + 1.5, 1.6, 0, TAU); g.fill(); g.restore(); }
    if (neuf) { const b = 1 + Math.sin(t * 6) * 0.12, by = y - 92 + Math.sin(t * 3) * 2; g.save(); g.translate(x, by); g.scale(b, b); g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill(); g.strokeStyle = '#7a4a10'; g.lineWidth = 1.6; g.stroke(); g.fillStyle = '#5a3208'; g.fillRect(-1.5, -5.5, 3, 7); g.beginPath(); g.arc(0, 4.2, 1.6, 0, TAU); g.fill(); g.restore(); }
  };

  // ---------- lire le tableau ----------
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), R = CG.R, o = Tb.pos(), p = CG.S.player, d = o ? Math.hypot(p.x - o.x, p.y - (o.y + 6)) : 1e9;
    // un gobelin qui traîne à côté ne cache pas le tableau : c'est le plus proche des deux qui gagne
    if (it && !(d < 56 && it.type === 'goblin' && it.obj && Math.hypot(p.x - it.obj.x, p.y - it.obj.y) > d)) return it;
    if (o && !(R.ko > 0) && !R.cine && !R.build && d < 56) return { type: 'tableau', obj: { x: o.x, y: o.y - 40 }, label: 'Lire les nouvelles' + (CG.S.nouvelles && !CG.S.nouvelles.lu ? ' ❗' : '') };
    return it;
  };
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'tableau') return Tb.ouvrir(); return in0.apply(this, arguments); };
  Tb.ouvrir = function () {
    const S = CG.S, n = S.nouvelles, $ = id => document.getElementById(id); CG.sfx('page'); if (n) n.lu = true;
    const notes = n && n.lines.length ? n.lines.map((l, i) => { const m = l.match(EMO), ic = m ? m[1] : '📌', txt = m ? l.slice(m[0].length) : l; return '<div class="tb-note" style="--r:' + (((i * 37) % 7) - 3) * 0.35 + 'deg"><i></i><span class="ic">' + ic + '</span><p>' + esc(txt) + '</p></div>'; }).join('')
      : '<div class="tb-note tb-vide" style="--r:-1deg"><i></i><span class="ic">' + (n ? '🌤️' : '🏕️') + '</span><p>' + (n ? 'Rien à signaler. Une nuit tranquille, pour une fois.' : (CG.Mondes && CG.Mondes.marais() ? 'Nous avons planté notre camp au cœur du marais. Un feu, quelques huttes, et beaucoup de courage : c\'est ici que tout recommence.' : 'Nous avons bâti notre premier camp ! Un feu, quelques huttes, et toute la forêt devant nous : le clan du chef ' + esc(CG.S.name) + ' est né aujourd\'hui.') + ' Reviens demain matin pour d\'autres nouvelles.') + '</p></div>';
    UI.modal = { name: 'tableau', closable: true, pauses: false }; CG.keys.clear();
    $('dialog').hidden = true; $('modal').className = 'soft'; $('panel').className = 'tableau';
    $('panel').innerHTML = '<div class="tb-toit"></div><div class="tb-planche"><h2>📋 Les nouvelles du clan</h2><div class="tb-jour">' + (n ? 'Ce qui s\'est passé au jour ' + n.day : 'Jour ' + S.day) + '</div><div class="tb-notes">' + notes + '</div><div class="tb-pied"><button id="tb-ok">Bien noté !</button></div></div>';
    $('modal').hidden = false; $('tb-ok').onclick = UI.dismiss;
  };
  const css = document.createElement('style');
  css.textContent = '#panel.tableau{background:none;border:none;box-shadow:none;padding:0;width:min(680px,94vw);max-height:90vh;overflow:visible;display:flex;flex-direction:column;position:relative;isolation:isolate}'
    // le poteau : un gros pieu de bois derrière la pancarte, bien au milieu, qui descend jusqu'en bas de l'écran
    + '#panel.tableau::after{content:"";position:absolute;z-index:-1;left:50%;top:22px;width:46px;margin-left:-23px;height:100vh;border-radius:5px 5px 0 0;background:linear-gradient(90deg,#3e2610 0,#6a4520 16%,#8a5e2e 38%,#7a5226 56%,#573618 82%,#34200c 100%);box-shadow:0 0 0 2px #2e1c0a,6px 4px 12px rgba(0,0,0,.45)}'
    + '#panel.tableau::before{content:"";position:absolute;z-index:-1;left:50%;top:22px;width:46px;margin-left:-23px;height:100vh;background:repeating-linear-gradient(180deg,transparent 0 70px,rgba(30,16,4,.35) 70px 72px,transparent 72px 131px,rgba(30,16,4,.22) 131px 132px);pointer-events:none;z-index:0}'
    + '#panel.tableau .tb-toit{position:relative;z-index:1;height:34px;margin:0 -18px -6px;background:linear-gradient(#8a5c2c,#5a3a1c);clip-path:polygon(0 100%,50% 0,100% 100%);filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))}'
    + '#panel.tableau .tb-planche{position:relative;z-index:1;padding:16px 22px 14px;border:6px solid #4a2e14;border-radius:8px;background:repeating-linear-gradient(180deg,#9a6a34 0 58px,#8a5c2c 58px 60px,#a27238 60px 118px,#7a5026 118px 120px);box-shadow:0 10px 30px rgba(0,0,0,.6),inset 0 0 40px rgba(40,20,5,.45);display:flex;flex-direction:column;min-height:0}'
    + '#panel.tableau h2{margin:0;text-align:center;color:#fff0c8;font-size:24px;text-shadow:0 2px 0 #3a2208,0 0 12px rgba(0,0,0,.4)}'
    + '#panel.tableau .tb-jour{text-align:center;color:#f0d8a0;font-size:14px;opacity:.9;margin:2px 0 12px}'
    + '#panel.tableau .tb-notes{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px 16px;overflow-y:auto;padding:8px 6px 10px;min-height:0;max-height:58vh}'
    + '#panel.tableau .tb-note{position:relative;display:flex;gap:10px;align-items:flex-start;padding:14px 12px 11px;background:linear-gradient(#fff6d8,#efdfb0);color:#3a2610;border-radius:2px;box-shadow:0 3px 7px rgba(0,0,0,.45);transform:rotate(var(--r));font-size:14.5px;line-height:1.35}'
    + '#panel.tableau .tb-note i{position:absolute;top:-5px;left:50%;width:11px;height:11px;margin-left:-5px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff8a70,#9a2416);box-shadow:0 2px 2px rgba(0,0,0,.5)}'
    + '#panel.tableau .tb-note .ic{font-size:22px;line-height:1}#panel.tableau .tb-note p{margin:0}'
    + '#panel.tableau .tb-vide{grid-column:1/-1;justify-self:center;max-width:380px}'
    + '#panel.tableau .tb-pied{text-align:center;margin-top:10px}#panel.tableau #tb-ok{width:auto;padding:9px 26px;font-size:16px;font-weight:bold;color:#fff0c8;background:linear-gradient(#6b8a2a,#4a6a1a);border:2px solid #2e4410;border-radius:9px;cursor:pointer}';
  document.head.appendChild(css);
  // à l'heure du jeu : le panneau ne bloque pas le passage, on tourne autour
})(window.CG);
