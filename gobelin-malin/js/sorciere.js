// Goblin Malin — Dame Ortie, la jeteuse de sorts. Elle passe de temps en temps près du feu. Contre de l'or, elle te jette
// un sortilège... sans dire lequel. Il y a toujours du bon et du moins bon dedans, et ça finit par passer.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, Art = CG.Art, W = CG.W, T = CG.TILE, TAU = Math.PI * 2, pick = CG.pick, rand = CG.rand;
  const So = CG.Sorciere = { CHANCE: 0.35, JOUR: 3, DUREE: 300, LAISSE: 14, DODO: 12, NOM: 'Dame Ortie, jeteuse de sorts' };
  So.prix = () => 30 + 6 * CG.S.day;
  // chaque sortilège : le bon, le moins bon, et combien de temps il dure (en secondes)
  So.E = {
    bottes: { ic: '👢', nom: 'Bottes de sept lieues', t: So.DUREE, bon: 'Tu cours 45 % plus vite.', mal: 'Quand ça s\'arrête, tu tombes de sommeil sur place pendant ' + So.DODO + ' secondes.' },
    ogre: { ic: '💪', nom: 'Poigne d\'ogre', t: So.DUREE, bon: 'Tu frappes 50 % plus fort.', mal: 'Tu ne peux pas t\'éloigner à plus de ' + So.LAISSE + ' cases du feu de camp.' },
    troll: { ic: '💚', nom: 'Sang de troll', t: So.DUREE, bon: 'Ta vie remonte toute seule, 2 points par seconde.', mal: 'Ta vie maximum baisse de 30 %.' },
    pierre: { ic: '🪨', nom: 'Peau de pierre', t: So.DUREE, bon: 'Tu reçois 40 % de dégâts en moins.', mal: 'Tu marches 25 % moins vite.' },
    source: { ic: '💧', nom: 'Source vive', t: So.DUREE, bon: 'Ton mana remonte de 4 points par seconde.', mal: 'Chaque sort que tu lances te coûte 4 points de vie.' },
    farfadet: { ic: '🍀', nom: 'Chance du farfadet', t: So.DUREE, bon: 'L\'or que tu ramasses est doublé.', mal: 'Tu reçois 30 % de dégâts en plus.' },
    furie: { ic: '🌀', nom: 'Furie', t: So.DUREE, bon: 'Tu frappes deux fois plus vite.', mal: 'Ton mana fond d\'un point par seconde.' }
  };
  const etat = () => { const S = CG.S, e = S && S.envout; return e && e.t > 0 && So.E[e.id] ? e : null; };
  const a = id => { const e = etat(); return !!e && e.id === id; };
  So.actif = etat;
  if (CG.Mondes && CG.Mondes.GLOBAL && !CG.Mondes.GLOBAL.includes('envout')) CG.Mondes.GLOBAL.push('envout');

  So.jeter = function (id) {
    const S = CG.S, R = CG.R, p = S.player; if (etat()) So.finir(true);
    id = So.E[id] ? id : pick(Object.keys(So.E)); const E = So.E[id], e = S.envout = { id, t: E.t, max: E.t };
    if (id === 'troll') { e.dhp = Math.round(p.maxhp * 0.3); p.maxhp -= e.dhp; p.hp = Math.min(p.hp, p.maxhp); }
    if (id === 'ogre') { const f = G.firePos(); e.ax = f.x; e.ay = f.y; e.m = S.monde || 0; if (Math.hypot(p.x - f.x, p.y - f.y) <= So.LAISSE * T) { e.lx = p.x; e.ly = p.y; } }
    G.puff(p.x, p.y - 24, '#b070ff', 34, 190, 5); G.puff(p.x, p.y - 24, '#7dffb0', 16, 130, 4); for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 50 + i * 40, life: 0.4 + i * 0.15, col: i % 2 ? '#7dffb0' : '#b070ff' });
    CG.sfx('spell'); G.banner(E.ic + ' ' + E.nom, E.bon + ' Mais : ' + E.mal.charAt(0).toLowerCase() + E.mal.slice(1), '#d8b0ff');
    return id;
  };
  So.finir = function (muet) {
    const S = CG.S, R = CG.R, p = S.player, e = S.envout; if (!e) return; S.envout = null; const E = So.E[e.id]; if (!E) return;
    if (e.dhp) { p.maxhp += e.dhp; }
    if (e.id === 'bottes' && !muet) { R.dodo = So.DODO; p.path = null; CG.keys.clear(); G.text(p.x, p.y - 70, '😴 Tu tombes de sommeil...', '#c8d8ff', true); }
    if (!muet) { G.puff(p.x, p.y - 24, '#d8d0e8', 18, 120, 4); UI.toast(E.ic + ' ' + E.nom + ' : le sortilège s\'est dissipé.'); }
  };
  // ---------- les effets ----------
  const hm0 = G.heroMul; G.heroMul = function () { return hm0.apply(this, arguments) * (a('bottes') ? 1.45 : a('pierre') ? 0.75 : 1); };
  const pd0 = G.playerDmg; G.playerDmg = function () { return pd0.apply(this, arguments) * (a('ogre') ? 1.5 : 1); };
  const hp0 = G.hurtPlayer; G.hurtPlayer = function (dmg) { const R = CG.R; if (R && R.dodo > 0) { R.dodo = 0; G.text(CG.S.player.x, CG.S.player.y - 70, 'Réveil en sursaut !', '#ffd0a0', true); } return hp0.call(this, a('pierre') ? dmg * 0.6 : a('farfadet') ? dmg * 1.3 : dmg); };
  const mr0 = G.manaRegen; G.manaRegen = function () { return mr0.apply(this, arguments) + (a('source') ? 4 : 0); };
  const ga0 = G.gain; G.gain = function (res, n, x, y) { if (res === 'or' && n > 0 && a('farfadet')) n *= 2; return ga0.call(this, res, n, x, y); };
  const ca0 = G.cast; G.cast = function (id) {
    if (CG.R && CG.R.dodo > 0) return; if (!a('source')) return ca0.apply(this, arguments);
    const p = CG.S.player, mp = p.mp, r = ca0.apply(this, arguments); if (p.mp < mp - 0.5 && p.hp > 1) { const n = Math.min(4, Math.floor(p.hp - 1)); if (n > 0) { p.hp -= n; G.text(p.x, p.y - 44, '-' + n + ' ❤', '#ff9a8a'); } } return r;
  };
  const up0 = G.update; G.update = function (dt) {
    const S0 = CG.S, R0 = CG.R; if (S0 && R0 && R0.dodo > 0) { CG.keys.clear(); S0.player.path = null; } // endormi : il ne bouge plus
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; const p = S.player;
    if (R.dodo > 0) { R.dodo -= dt; p.moving = false; if (R.ko > 0 || R.night) R.dodo = 0; if (R.dodo <= 0) G.text(p.x, p.y - 70, '🥱 Tu te réveilles', '#c8d8ff'); }
    const e = etat(); if (!e) { if (S.envout) S.envout = null; return; }
    if (R.night || R.cine) return; // la nuit et les scènes ne mangent pas le sortilège
    e.t -= dt;
    if (e.id === 'troll' && p.hp < p.maxhp && !(R.ko > 0)) p.hp = Math.min(p.maxhp, p.hp + 2 * dt);
    else if (e.id === 'furie') { if (R.atkCd > 0) R.atkCd -= dt; p.mp = Math.max(0, p.mp - dt); }
    else if (e.id === 'ogre') {
      if ((S.monde || 0) !== e.m) { e.m = S.monde || 0; const f = CG.Mondes && !CG.Mondes.feuIci() ? p : G.firePos(); e.ax = f.x; e.ay = f.y; e.lx = undefined; } // changé de monde : la laisse suit
      const L = So.LAISSE * T, dx = p.x - e.ax, dy = p.y - e.ay, d = Math.hypot(dx, dy);
      if (d <= L) { e.lx = p.x; e.ly = p.y; } else if (e.lx !== undefined) { p.x = e.lx; p.y = e.ly; p.path = null; e.dit = (e.dit || 0) - dt; if (e.dit <= 0) { e.dit = 2.5; G.text(p.x, p.y - 64, 'Le sortilège te retient !', '#d8b0ff'); R.rings.push({ x: p.x, y: p.y - 6, r: 34, life: 0.3, col: '#b070ff' }); } }
    }
    if (e.t <= 0) So.finir();
  };
  // la limite de la poigne d'ogre, en pointillés, et les zzZ du dormeur
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const e = etat(); if (!e || e.id !== 'ogre' || (CG.S.monde || 0) !== e.m) return; const p = CG.S.player, L = So.LAISSE * T;
    const d = Math.hypot(p.x - e.ax, p.y - e.ay); if (d < L - 420) return; // on ne la voit que quand on s'en approche
    g.save(); g.globalAlpha = CG.clamp((d - (L - 420)) / 260, 0, 0.75); g.strokeStyle = '#c090ff'; g.lineWidth = 3; g.setLineDash([14, 12]); g.lineDashOffset = -t * 20; const ang = Math.atan2(p.y - e.ay, p.x - e.ax); g.beginPath(); g.arc(e.ax, e.ay, L + 9, ang - 0.5, ang + 0.5); g.stroke(); g.restore();
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!(R.dodo > 0)) return; const p = CG.S.player;
    g.save(); g.textAlign = 'center'; g.lineJoin = 'round';
    for (let i = 0; i < 3; i++) { const k = (t * 0.45 + i / 3) % 1, x = p.x + 12 + k * 24 + Math.sin(k * 6 + i) * 4, y = p.y - 54 - k * 50; g.globalAlpha = Math.sin(k * Math.PI); g.font = 'bold ' + Math.round(12 + k * 12) + 'px "Trebuchet MS", system-ui, sans-serif'; g.lineWidth = 4; g.strokeStyle = 'rgba(20,24,60,0.8)'; g.strokeText(k > 0.55 ? 'Z' : 'z', x, y); g.fillStyle = '#dfe6ff'; g.fillText(k > 0.55 ? 'Z' : 'z', x, y); }
    g.restore();
  };
  if (CG.Buffs) {
    CG.Buffs.LISTE.push({ k: 'envout', ic: () => So.E[etat().id].ic, nom: () => 'Sortilège : ' + So.E[etat().id].nom, txt: () => { const E = So.E[etat().id]; return E.bon + ' Mais : ' + E.mal.charAt(0).toLowerCase() + E.mal.slice(1); }, t: () => { const e = etat(); return e ? Math.max(0.1, e.t) : 0; } });
    CG.Buffs.LISTE.push({ k: 'dodo', ic: '😴', mal: true, nom: () => 'Coup de barre', txt: 'Les bottes de sept lieues t\'ont vidé : tu dors debout. Un coup te réveille.', t: () => CG.R.dodo > 0 ? CG.R.dodo : 0 });
  }

  // ---------- le chaudron : il faut en avoir un au village pour qu'elle vienne ----------
  CG.BUILDS.chaudron = { nom: 'Chaudron de sorcière', icon: '🫕', w: 1, h: 1, cat: 'magie', cout: { bois: 20, minerai: 15, or: 40 }, desc: 'Un chaudron qui bouillonne tout seul. Son odeur attire Dame Ortie, la jeteuse de sorts : sans lui, elle ne vient jamais.' };
  if (CG.START_BUILDS && !CG.START_BUILDS.includes('chaudron')) CG.START_BUILDS.push('chaudron');
  So.chaudron = () => CG.S.buildings.find(b => b.type === 'chaudron' && !b.site) || null;
  { const e2 = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
    Art.extra.chaudron = { w: 56, h: 60, draw(c) {
      e2(c, 28, 52, 23, 6, 'rgba(0,0,0,0.25)'); [[12, 50], [28, 53], [44, 50]].forEach(q => { c.fillStyle = '#5a3d22'; c.fillRect(q[0] - 7, q[1] - 2, 14, 4); }); [[20, 50, '#ff8a1e'], [36, 50, '#ffb432'], [28, 48, '#ffe36b']].forEach(q => e2(c, q[0], q[1], 4, 5, q[2]));
      c.fillStyle = '#2a2630'; c.beginPath(); c.moveTo(8, 24); c.quadraticCurveTo(2, 48, 28, 48); c.quadraticCurveTo(54, 48, 48, 24); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.moveTo(11, 26); c.quadraticCurveTo(8, 42, 18, 46); c.quadraticCurveTo(13, 38, 15, 26); c.closePath(); c.fill();
      e2(c, 28, 24, 21, 6.4, '#3a3542'); e2(c, 28, 24, 17.4, 4.6, '#58d878'); e2(c, 22, 23, 6, 1.6, '#b4ffc0'); c.strokeStyle = '#3a3542'; c.lineWidth = 2.4; c.beginPath(); c.arc(28, 22, 23, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
    }, anim(g, cx, by, t) { for (let i = 0; i < 4; i++) { const k = (t * 0.32 + i / 4) % 1; g.globalAlpha = (1 - k) * 0.8; e2(g, cx - 10 + i * 7 + Math.sin(t * 2 + i * 2) * 3, by - 34 - k * 34, 2.4 + k * 2.6, 2.4 + k * 2.6, i % 2 ? '#b070ff' : '#7dffb0'); } g.globalAlpha = 1; } }; }
  // ---------- la visite ----------
  const pl0 = D.plan; D.plan = function () {
    const r = pl0.apply(this, arguments), S = CG.S, R = CG.R; if (!R.schedule || S.day < So.JOUR || !So.chaudron() || Math.random() > So.CHANCE) return r; // sans chaudron au village, elle ne vient pas
    if (CG.Mondes && (CG.Mondes.ici() === 2 || !CG.Mondes.feuIci())) return r;
    R.schedule.push({ h: rand(7.5, 15), type: 'visit', role: 'ortie' }); R.schedule.sort((x, y) => x.h - y.h); return r;
  };
  So.venir = function () {
    const S = CG.S, R = CG.R, en = pick(['ouest', 'est', 'sud']), e = W.EXITS[en], f = G.firePos(), ex = W.center(e.x, e.y);
    const v = { id: S.nextId++, role: 'ortie', look: 'ortie', x: ex.x, y: ex.y, face: 1, step: 0, moving: false, state: 'arrive', exit: ex, seed: Math.random() * 100, leaveAt: Math.min(18.5, S.hour + 4), dest: { x: f.x + 96, y: f.y + 80 }, prix: So.prix() };
    const ch = So.chaudron(); if (ch) { const d = { x: (ch.tx + ch.w / 2) * T + 34, y: (ch.ty + ch.h) * T + 8 }; if (W.walkPx(d.x, d.y)) { v.dest = d; v.aSien = true; } else if (W.walkPx(d.x - 68, d.y)) { v.dest = { x: d.x - 68, y: d.y }; v.aSien = true; } }
    if (!G.goTo(v, v.dest.x, v.dest.y)) return null; R.visitors.push(v);
    v.annonce = [So.NOM, 'L\'odeur de ton chaudron a attiré une drôle de vieille. Va lui parler (E).', '#d8b0ff']; return v;
  };
  const partir = v => { if (CG.R.visitors.includes(v)) { v.state = 'leave'; G.goTo(v, v.exit.x, v.exit.y); } };
  So.parler = function (v) {
    const S = CG.S, e = etat(), prix = v.prix || So.prix(), peut = S.res.or >= prix;
    if (v.fait) return UI.dialog({ visitor: v, who: So.NOM, text: 'Hé hé hé... Un seul par visite, mon joli. On ne mélange pas mes bouillons. Mais mon panier, lui, est toujours ouvert.', options: [{ label: '🛒 Voir ce que tu vends', fn: () => So.boutique(v) }, { label: 'Bon...' }] });
    UI.dialog({ visitor: v, who: So.NOM, tag: '🔮 un sortilège surprise',
      text: 'Approche, petit chef. Pour ' + prix + ' 🪙, je te jette un sortilège. Lequel ? Ha ! Ça, je ne le dis jamais. Il y a toujours du bon dedans... et un petit quelque chose en plus. Ça passe tout seul au bout de cinq minutes.' + (e ? ' (Tu portes déjà un sortilège : le nouveau le remplacera.)' : ''),
      options: [{ label: '🔮 Vas-y, jette-le (' + prix + ' 🪙)', sub: peut ? 'Tu ne sauras ce que c\'est qu\'après' : 'Tu n\'as que ' + Math.floor(S.res.or) + ' 🪙', disabled: !peut, fn: () => {
        if (S.res.or < prix || v.fait) return; S.res.or -= prix; v.fait = true; CG.sfx('coin'); G.say(v, pick(['Abracadabri, abracadabra... Hi hi hi !', 'Ne bouge pas... Voilà ! Bonne chance, mon joli.', 'Œil de triton, poil de troll... et hop !']), 4);
        So.jeter(); v.leaveAt = Math.min(v.leaveAt, S.hour + 0.4);
      } }, { label: '🛒 Voir ce que tu vends', fn: () => So.boutique(v) }, { label: '🤔 Je vais y penser', sub: 'Elle reste encore un peu près du feu' }, { label: '👋 Non merci, garde tes bouillons', sub: 'Elle repart en ricanant', fn: () => partir(v) }] });
  };
  // ---------- son panier : ce qui sert à la magie (fioles, os, poudres) et, parfois, très cher, le plan d'une construction magique ----------
  So.PLAN = 0.3; So.PLAN_PRIX = 1.6; So.OS = [5, 30];
  So.panier = function () {
    const S = CG.S, p = S.player, A = CG.Alchimie, svg = k => (A && A.svg ? A.svg(k) : k === 'vie' ? '🧪' : '💧'), l = [
      { icon: svg('vie'), label: 'Fiole de vie', desc: 'Te redonne de la vie.', prix: 80, stock: 3, buy: () => { p.potions++; } },
      { icon: svg('mana'), label: 'Fiole de mana', desc: 'Te redonne du mana.', prix: 80, stock: 3, buy: () => { p.fioles = p.fioles || {}; p.fioles.mana1 = (p.fioles.mana1 || 0) + 1; } },
      { icon: '🦴', label: So.OS[0] + ' os', desc: 'Pour les potions de tes alchimistes.', prix: So.OS[1], stock: 3, buy: () => { S.res.os = (S.res.os || 0) + So.OS[0]; } }];
    if (CG.Feu && CG.Feu.stock) l.push.apply(l, CG.Feu.stock());
    const Pl = CG.Plans; if (Pl && Math.random() < So.PLAN) { const m = Pl.dispo().filter(n => n.br === 'sorc' || (n.unlock || []).some(b => CG.BUILDS[b] && CG.BUILDS[b].cat === 'magie')); if (m.length) { const a = Pl.article(pick(m)); a.prix = Math.round(a.prix * So.PLAN_PRIX / 10) * 10; a.desc = 'Un secret de sorcière : tu pourras le bâtir.'; l.push(a); } }
    return l;
  };
  So.boutique = function (v) { if (!v.shop) v.shop = So.panier(); UI.shop(v, { nom: So.NOM, hello: 'Des os, des fioles, des poudres... tout ce qu\'il faut pour la magie, mon joli.' }); };
  const sv0 = D.startVisit; D.startVisit = function (ev) { if (ev.role === 'ortie') return So.venir(); return sv0.apply(this, arguments); };
  const tk0 = D.talk; D.talk = function (v) { if (v.role === 'ortie') return So.parler(v); return tk0.apply(this, arguments); };
  // ---------- son dessin : robe rouge sombre, grand chapeau, et son chaudron qui bouillonne ----------
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const vis0 = Art.visitor; Art.visitor = function (g, v, t) {
    if (v.look !== 'ortie') return vis0.apply(this, arguments);
    const portrait = v.x === 0 && v.y === 0;
    if (!portrait && !v.moving && !v.aSien) { const x = v.x - 30, y = v.y + 4, b = t * 3 + v.seed; // le chaudron, posé à côté d'elle
      ell(g, x, y + 3, 17, 5, 'rgba(0,0,0,0.25)'); g.fillStyle = '#2a2630'; g.beginPath(); g.moveTo(x - 15, y - 16); g.quadraticCurveTo(x - 19, y + 4, x, y + 4); g.quadraticCurveTo(x + 19, y + 4, x + 15, y - 16); g.closePath(); g.fill();
      ell(g, x, y - 16, 15.5, 5, '#3a3542'); ell(g, x, y - 16, 12.5, 3.6, '#58d878'); ell(g, x - 4, y - 16.6, 4, 1.4, '#b4ffc0');
      for (let i = 0; i < 3; i++) { const k = (b * 0.3 + i / 3) % 1; g.globalAlpha = (1 - k) * 0.8; ell(g, x - 7 + i * 7 + Math.sin(b + i * 2) * 2, y - 19 - k * 26, 2.2 + k * 2.4, 2.2 + k * 2.4, i % 2 ? '#b070ff' : '#7dffb0'); } g.globalAlpha = 1; }
    Art.humanoid(g, { x: v.x, y: v.y, face: v.face, t: t + v.seed, moving: v.moving, step: v.step, skin: '#a8c890', tunic: '#7a1f3a', legs: '#2a1420', sleeve: '#5a1830', hat: true, hatCol: '#3a1028', hair: '#e8e4f0', longHair: true, robe: true, weapon: 'baton', glow: '#b070ff', bigNose: true, s: 1.04 });
  };
})(window.CG);
