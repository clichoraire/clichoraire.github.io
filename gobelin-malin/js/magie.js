// Goblin Malin — nouvelle magie : Pieds de vent (marcher plus vite 12 s) et Élémentaire de terre (un allié pour 2 minutes).
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, D = CG.D, T = CG.TILE, M = CG.Magie = {}, TAU = Math.PI * 2;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  M.HASTE = 12; M.HASTE_MUL = 1.6; M.GOLEM_T = 120;
  // grosse caboche : ce que dit celui qui la reçoit, et ce que lancent les autres autour
  M.CABOCHE_MOI = ['Hé ! Pourquoi tout le monde a rapetissé ?!', 'Chef... j\'ai la caboche qui pèse une tonne !', 'Wouah ! J\'ai jamais eu autant d\'idées !', 'Je passe plus dans la porte de ma hutte !', 'C\'est normal que je voie mes oreilles ?', 'Mon cou ! Mon pauvre petit cou !', 'Chef, mon chapeau me va plus. Tu me dois un chapeau.', 'Je penche... je penche... JE PENCHE !', 'J\'entends mes pensées résonner. Y\'a de l\'écho là-dedans.', 'Attention en dessous, si je tombe, ça va faire un trou.', 'Enfin une tête à la hauteur de mon génie !', 'Chef ! Je vois par-dessus les huttes !', 'Je sens que je vais attraper un gros rhume. Un TRÈS gros.', 'Qui a soufflé dans mes oreilles ?!', 'Bon. Je dors comment, moi, ce soir ?', 'Ça gratte ! Et j\'ai les bras trop courts pour me gratter !', 'Je viens de comprendre un truc compliqué. C\'est déjà reparti.', 'Ma mère disait que j\'avais la grosse tête. Elle avait raison.', 'Personne ne bouge. Si j\'éternue, on perd le village.', 'Chef, c\'est permanent ? Dis-moi que c\'est pas permanent.'];
  M.CABOCHE_EUX = ['Ha ha ha ! Regardez sa tête !', 'Hi hi hi ! Un melon sur pattes !', 'Pfffrt ! Ha ha !', 'On dirait une citrouille avec des oreilles !', 'Hé, tu caches le soleil !', 'Ça doit en prendre, du savon, pour laver ça.', 'Chef, fais-moi pareil ! ... Non, attends. Non.', 'Il va falloir agrandir sa hutte. Et la porte. Et le village.', 'Enfin quelqu\'un avec une plus grosse tête que le chef !', 'Une tête pareille, et toujours rien dedans !', 'Je parie trois baies qu\'il tombe en avant.', 'Poussez-vous, il tourne la tête !', 'Avec ça, il pourrait servir de tambour.', 'C\'est pas une tête, c\'est une colline.', 'Hi hi ! Fais « oui » de la tête pour voir ?', 'Quelqu\'un a une brouette ? Pour l\'aider à la porter.', 'Moi je trouve que ça lui va bien. Non je rigole.', 'Les oreilles ont suivi, au moins. C\'est déjà ça.', 'Chut, il réfléchit. On entend le vent passer.', 'S\'il pleut, on s\'abrite tous dessous !'];
  Object.keys(CG.SPELLS).forEach(k => { CG.SPELLS[k].prix *= 10; }); // les parchemins sont rares et chers : dix fois le prix d'avant (les sorts ci-dessous sont déjà à ce tarif)
  CG.SPELLS.hate = { nom: 'Pieds de vent', icon: '👟', mp: 10, prix: 500, desc: 'Pendant 12 secondes, tu marches beaucoup plus vite.', color: '#bfe9ff' };
  CG.SPELLS.golem = { nom: 'Élémentaire de terre', icon: '🪨', mp: 30, prix: 1300, desc: 'Un élémentaire de terre sort du sol et se bat à tes côtés pendant 2 minutes, à moins d\'être détruit avant.', color: '#c9a56b' };
  CG.SPELLS.charme = { nom: 'Charme', icon: '💞', mp: 18, prix: 1000, desc: 'L\'ennemi le plus proche se bat pour toi pendant 15 secondes. Tant qu\'il est charmé, tu ne peux pas le frapper. Ensuite il redevient méchant. Sans effet sur les chefs.', color: '#8dffb0' };
  CG.SPELLS.onde = { nom: 'Onde de choc', icon: '💨', mp: 14, prix: 750, desc: 'Une grande bourrasque part de toi : tous les ennemis autour sont projetés au loin, sonnés et un peu blessés.', color: '#bfe9ff' };
  CG.SPELLS.repousse = { nom: 'Sève de vie', icon: '🌱', mp: 12, prix: 600, desc: 'La souche la plus proche redevient un grand arbre en quelques secondes. Pratique quand tes bûcherons ont tout rasé.', color: '#7cd94a' };
  CG.SPELLS.sommeil = { nom: 'Berceuse', icon: '😴', mp: 14, prix: 700, desc: 'Le monstre le plus proche s\'endort pendant 15 secondes. Un coup le réveille, mais ce premier coup fait très mal. Les chefs ne dorment que 5 secondes.', color: '#a8c8ff' };
  CG.SPELLS.invisible = { nom: 'Voile d\'ombre', icon: '🫥', mp: 16, prix: 900, desc: 'Tu deviens invisible pendant 15 secondes : les ennemis te perdent de vue. Frapper ou lancer un autre sort te fait réapparaître.', color: '#c8b8ff' };
  CG.SPELLS.caboche = { nom: 'Grosse caboche', icon: '🎈', mp: 6, prix: 300, desc: 'Juste pour rire : la tête du gobelin le plus proche devient énorme pendant 30 secondes. S\'il y a du monde autour pour en rire, le moral monte (+1, ou +2 à partir de trois rieurs), trois fois par jour au plus. Rien de plus sur une tête déjà gonflée.', color: '#ffb0d8' };
  CG.SCROLL_POOL.push('hate', 'golem', 'charme', 'onde', 'repousse', 'sommeil', 'invisible', 'caboche');
  M.CABOCHE_RIRES = 3; M.SLEEP = 15; M.INVIS = 15; M.CABOCHE = 30; M.STAB = 0.25; M.TECH_STAB = 'g15';
  const MINE = ['hate', 'golem', 'charme', 'onde', 'repousse', 'sommeil', 'invisible', 'caboche'];
  M.CHARM = 15; M.PUSH_R = 200;

  const hm = G.heroMul; G.heroMul = () => hm() * (CG.R && CG.R.haste > 0 ? M.HASTE_MUL : 1);
  const cast0 = G.cast;
  G.cast = function (id) {
    if (!MINE.includes(id)) { if (CG.R.invis > 0) M.reveal(); return cast0(id); }
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine) return;
    const cost = G.spellCost(id); if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    p.mp -= cost; R.castCd = 0.45; R.castAnim = 1; CG.sfx('spell');
    const rate = msg => { p.mp += cost; G.text(p.x, p.y - 56, msg, CG.SPELLS[id].color); CG.sfx('no'); };
    if (id !== 'invisible' && R.invis > 0) M.reveal();
    if (id === 'repousse') {
      const MW = CG.MW, logs = new Set(S.logs.map(l => W.idx(l.tx, l.ty))); let best = -1, bd = 230;
      for (const i of S.cuts) { if (W.tile[i] !== W.CLEAR || logs.has(i)) continue; const x = (i % MW) * T + T / 2, y = Math.floor(i / MW) * T + T / 2, d = Math.hypot(x - p.x, y - p.y); if (d > 26 && d < bd && !S.buildings.some(b => (i % MW) >= b.tx && (i % MW) < b.tx + b.w && Math.floor(i / MW) >= b.ty && Math.floor(i / MW) < b.ty + b.h)) { bd = d; best = i; } }
      if (best < 0) return rate('Aucune souche près d\'ici');
      const tx = best % MW, ty = Math.floor(best / MW), x = tx * T + T / 2, y = ty * T + T / 2;
      R.bolts.push({ x1: p.x, y1: p.y - 26, x2: x, y2: y, life: 0.3 }); (R.sprouts = R.sprouts || []).push({ i: best, tx, ty, x, y, t: 0 }); S.cuts.splice(S.cuts.indexOf(best), 1);
      R.rings.push({ x, y: y + 6, r: 46, life: 0.5, col: '#7cd94a' }); G.puff(x, y, '#7cd94a', 14, 80, 3); return;
    }
    if (id === 'sommeil') {
      let tg = null, bd = 330; for (const e of R.enemies) { if (e.dead || e.struct || e.sleepT > 0 || e.charm > 0) continue; const d = dist(e, p); if (d < bd) { bd = d; tg = e; } }
      if (!tg) return rate('Personne à endormir ici');
      tg.sleepT = CG.ENEMIES[tg.type].boss ? 5 : M.SLEEP; tg.path = null; tg.moving = false; tg.kb = null;
      R.bolts.push({ x1: p.x, y1: p.y - 26, x2: tg.x, y2: tg.y - 18, life: 0.3 }); R.rings.push({ x: tg.x, y: tg.y - 6, r: 56, life: 0.5, col: '#a8c8ff' });
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; R.parts.push({ x: tg.x + Math.cos(a) * 30, y: tg.y - 22 + Math.sin(a) * 22, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 44, life: 0.5, max: 0.5, col: i % 2 ? '#ffffff' : '#a8c8ff', size: 3.5, float: true }); }
      G.text(tg.x, tg.y - 60, '😴 Dodo...', '#a8c8ff', true); return;
    }
    if (id === 'invisible') {
      R.invis = M.INVIS; for (const e of R.enemies) { if (e.target === p) e.target = null; if (e.aggro === p) { e.aggro = null; e.blase = true; } }
      R.rings.push({ x: p.x, y: p.y - 10, r: 70, life: 0.5, col: '#c8b8ff' }); for (let i = 0; i < 26; i++) R.parts.push({ x: p.x + (Math.random() - 0.5) * 30, y: p.y - 4 - Math.random() * 46, vx: (Math.random() - 0.5) * 60, vy: -30 - Math.random() * 50, life: 0.7, max: 0.7, col: i % 2 ? '#3a2c50' : '#c8b8ff', size: 5, float: true });
      G.text(p.x, p.y - 64, '🫥 Tu disparais...', '#c8b8ff', true); return;
    }
    if (id === 'caboche') {
      let g = null, bd = 260; for (const o of S.goblins) { if (o.hidden || o.perch) continue; const d = dist(o, p); if (d < bd) { bd = d; g = o; } }
      if (!g) return rate('Aucun gobelin près de toi');
      { const rieurs = g.bigT > 0 ? 0 : S.goblins.filter(o => o !== g && !o.hidden && dist(o, g) < 260).length, J = S.cabocheJ && S.cabocheJ.d === S.day ? S.cabocheJ : (S.cabocheJ = { d: S.day, n: 0 }), gain = J.n >= M.CABOCHE_RIRES ? 0 : rieurs >= 3 ? 2 : rieurs ? 1 : 0; if (gain) J.n++; else if (rieurs && J.n >= M.CABOCHE_RIRES && !J.dit) { J.dit = true; CG.UI.toast('😂 Ils rient encore, mais la blague a fait son temps pour aujourd\'hui : le moral ne montera plus avant demain.'); } /* une tête toute neuve, et du monde pour en rire : le moral monte */ if (gain) { S.morale = Math.max(S.morale, Math.min(100, S.morale + gain)); G.text(g.x, g.y - 84, '😂 +' + gain + ' moral', '#ffe36b', true); } }
      g.bigT = M.CABOCHE; g.emoteT = 2; R.bolts.push({ x1: p.x, y1: p.y - 26, x2: g.x, y2: g.y - 30, life: 0.25 }); R.rings.push({ x: g.x, y: g.y - 30, r: 44, life: 0.4, col: '#ffb0d8' });
      for (let i = 0; i < 22; i++) { const a = Math.random() * 6.283, v = 60 + Math.random() * 110; R.parts.push({ x: g.x, y: g.y - 36, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 50, life: 0.9, max: 0.9, col: CG.pick(['#ff7ab8', '#ffd23a', '#7dd3fc', '#8dffb0', '#ffffff']), size: 4 }); }
      G.text(g.x, g.y - 80, 'POUF !', '#ffb0d8', true); CG.sfx('level'); S.morale = Math.min(100, S.morale + 1);
      G.say(g, CG.pick(M.CABOCHE_MOI), 4, 0.5);
      const dits = new Set(), dejaDit = new Set();
      for (const o of S.goblins) if (o !== g && !o.hidden && dist(o, g) < 260) { o.emoteT = 2.5; if (Math.random() < 0.6 && !dits.has(o)) { let t; do { t = CG.pick(M.CABOCHE_EUX); } while (dejaDit.has(t)); dejaDit.add(t); dits.add(o); G.say(o, t, 3.4, 0.8 + dits.size * 0.9 + Math.random() * 0.5); } } // chacun sa blague, l'une après l'autre
      return;
    }
    if (id === 'charme') {
      let tg = null, bd = 320; for (const e of R.enemies) { if (e.dead || e.struct || e.charm > 0 || CG.ENEMIES[e.type].boss) continue; const d = dist(e, p); if (d < bd) { bd = d; tg = e; } }
      if (!tg) { p.mp += cost; G.text(p.x, p.y - 56, 'Personne à charmer ici', '#8dffb0'); CG.sfx('no'); return; }
      tg.charm = M.CHARM; tg.calm = true; tg.target = null; tg.aggro = null; tg.path = null; tg.fear = 0; tg.daze = 0; tg.retreat = false;
      R.bolts.push({ x1: p.x, y1: p.y - 26, x2: tg.x, y2: tg.y - 18, life: 0.3 }); R.rings.push({ x: tg.x, y: tg.y - 6, r: 60, life: 0.5, col: '#8dffb0' }); G.puff(tg.x, tg.y - 20, '#8dffb0', 20, 110, 4);
      G.text(tg.x, tg.y - 60, '💞 Charmé !', '#8dffb0', true); for (const o of R.enemies) { if (o.target === tg) o.target = null; } return;
    }
    if (id === 'onde') {
      const m = (1 + 0.12 * (p.lvl - 1)) * (G.tech('s4') ? 1.25 : 1); let n = 0; CG.sfx('fire'); CG.sfx('horn');
      R.shock = { x: p.x, y: p.y - 6, t: 0 };
      for (let i = 0; i < 46; i++) { const a = i / 46 * 6.283 + Math.random() * 0.1, v = 330 + Math.random() * 160; R.parts.push({ x: p.x + Math.cos(a) * 16, y: p.y - 8 + Math.sin(a) * 12, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.78, life: 0.55, max: 0.55, col: i % 3 ? '#ffffff' : '#9ad8ff', size: 4 + (i % 3), float: true }); }
      for (let i = 0; i < 16; i++) { const a = Math.random() * 6.283, v = 120 + Math.random() * 120; R.parts.push({ x: p.x, y: p.y - 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7 - 30, life: 0.7, max: 0.7, col: '#d8c8a0', size: 5 }); }
      for (const e of R.enemies) {
        if (e.dead || e.struct || e.charm > 0) continue; const d = dist(e, p); if (d > M.PUSH_R + e.r) continue;
        const b = CG.ENEMIES[e.type].boss, f = (b ? 0.45 : 1) * (1.15 - 0.4 * d / M.PUSH_R), dx = (e.x - p.x) / (d || 1), dy = (e.y - p.y) / (d || 1);
        e.kb = { vx: dx * 620 * f, vy: dy * 620 * f, t: 0.38 }; e.path = null; e.calm = false; e.rooted = Math.max(e.rooted, b ? 0.6 : 1.4); G.hurtEnemy(e, 5 * m, p); e.etourdi = CG.R.t + (b ? 0.6 : 1.4); n++;
      }
      if (!n) G.text(p.x, p.y - 62, 'Le vent souffle dans le vide...', '#bfe9ff');
      return;
    }
    if (id === 'hate') { R.haste = M.HASTE; R.rings.push({ x: p.x, y: p.y - 6, r: 60, life: 0.45, col: '#bfe9ff' }); G.puff(p.x, p.y - 4, '#e6f7ff', 18, 150, 3); G.text(p.x, p.y - 62, '👟 Pieds de vent !', '#bfe9ff', true); return; }
    const m = (1 + 0.12 * (p.lvl - 1)) * (G.tech('s4') ? 1.25 : 1);
    if (R.golem && !R.golem.dead) vanish(R.golem, false); // un seul à la fois : l'ancien retourne à la terre
    let x = p.x + R.dir.x * 38, y = p.y + R.dir.y * 38; if (!W.walkPx(x, y)) { x = p.x; y = p.y + 4; }
    const hp = Math.round((85 + p.lvl * 12) * m);
    R.golem = { summon: true, id: -77, x, y, r: 14, hp, maxhp: hp, dmg: (7 + p.lvl * 1.5) * m, t: M.GOLEM_T, age: 0, face: p.face || 1, step: 0, moving: false, atkCd: 0.8, atkAnim: 0, repath: 0, path: null, seek: 0, tg: null };
    G.unstick(R.golem, 12); CG.sfx('fire');
    R.rings.push({ x, y: y - 4, r: 70, life: 0.5, col: '#c9a56b' }); G.puff(x, y - 4, '#a8875e', 26, 170, 5); G.puff(x, y - 4, '#6e5236', 12, 110, 4);
  };

  function vanish(s, killed) {
    const R = CG.R; s.dead = true; if (R.golem === s) R.golem = null;
    G.puff(s.x, s.y - 20, '#8a6a48', 26, 150, 5); G.puff(s.x, s.y - 12, '#c9a56b', 12, 90, 4);
    G.text(s.x, s.y - 62, killed ? 'L\'élémentaire s\'effondre !' : 'L\'élémentaire retourne à la terre', '#e8cfa0', true); if (killed) CG.sfx('die');
  }
  M.hurt = function (s, dmg) {
    if (s.dead) return; dmg = Math.max(1, Math.round(dmg * 0.8)); s.hp -= dmg; s.flash = 0.18;
    G.text(s.x, s.y - 56, '-' + dmg, '#e8cfa0'); G.puff(s.x, s.y - 22, '#8a6a48', 4, 70, 3);
    if (s.hp <= 0) vanish(s, true);
  };
  // ---------- invisibilité et coup dans le dos ----------
  M.reveal = function () { const R = CG.R, p = CG.S.player; if (!(R.invis > 0)) return; R.invis = 0; G.puff(p.x, p.y - 20, '#c8b8ff', 12, 90, 4); G.text(p.x, p.y - 62, 'Tu réapparais', '#c8b8ff'); };
  // l'ennemi qu'on peut poignarder : il faut être invisible, tout près, et dans son dos
  M.stabTarget = function () {
    const S = CG.S, R = CG.R, p = S.player; if (!(R.invis > 0) || !G.tech(M.TECH_STAB) || R.ko > 0 || p.mp < p.maxmp * M.STAB) return null;
    let best = null, bd = 1e9;
    for (const e of R.enemies) { if (e.dead || e.struct || e.charm > 0) continue; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy); if (d > 46 + e.r || Math.abs(dy) > 30 || dx * (e.face || 1) >= -6) continue; if (d < bd) { bd = d; best = e; } }
    return best;
  };
  M.stab = function (e) {
    const S = CG.S, R = CG.R, p = S.player; if (!e || e.dead) return;
    p.mp = Math.max(0, p.mp - p.maxmp * M.STAB); R.invis = 0; R.swing = 1; R.atkCd = 0.5; p.face = e.x > p.x ? 1 : -1; if (e.sleepT > 0) e.sleepT = 0;
    const boss = CG.ENEMIES[e.type].boss, dmg = boss ? e.maxhp * 0.35 : e.hp + 999;
    R.bolts.push({ x1: p.x, y1: p.y - 22, x2: e.x, y2: e.y - 20, life: 0.2 }); R.rings.push({ x: e.x, y: e.y - 10, r: 54, life: 0.4, col: '#ff4a4a' }); G.puff(e.x, e.y - 20, '#c8281e', 24, 170, 5); G.puff(p.x, p.y - 20, '#3a2c50', 12, 90, 4);
    G.text(e.x, e.y - 74, '🗡️ ASSASSINAT !', '#ff8a7a', true); CG.sfx('swing'); CG.sfx('hit'); G.hurtEnemy(e, dmg, p);
  };
  const find1 = D.findInteract;
  D.findInteract = function () { const e = M.stabTarget(); if (e) return { type: 'assassinat', obj: e, label: '🗡️ Poignarder ' + CG.ENEMIES[e.type].nom.toLowerCase() + ' dans le dos (25 % de ton mana)' }; return find1.apply(this, arguments); };
  const inter1 = D.interact;
  D.interact = function () { const e = M.stabTarget(); if (e) return M.stab(e); return inter1.apply(this, arguments); };
  // ---------- ennemi endormi ----------
  M.sleepStep = function (e, dt) {
    e.sleepT -= dt; if (e.sleepT <= 0) { e.sleepT = 0; G.text(e.x, e.y - 56, '😠 Il se réveille !', '#ffd0a0'); return false; }
    e.moving = false; e.atkCd = Math.max(e.atkCd, 0.6); e.path = null; return true;
  };
  // ---------- ennemi charmé ----------
  function uncharm(e) {
    const R = CG.R; e.charm = 0; e.calm = false; e.target = null; e.aggro = null; e.path = null; e.seek = 0;
    for (const o of R.enemies) { if (o.target === e) o.target = null; if (o.aggro === e) o.aggro = null; }
    G.text(e.x, e.y - 60, '😡 Le charme est rompu !', '#ff9a8a', true); G.puff(e.x, e.y - 20, '#ff5a4a', 16, 110, 4); R.rings.push({ x: e.x, y: e.y - 6, r: 50, life: 0.4, col: '#ff5a4a' }); CG.sfx('no');
  }
  M.charmStep = function (e, dt) {
    const S = CG.S, R = CG.R, p = S.player; e.charm -= dt;
    if (e.charm <= 0) { uncharm(e); return false; }
    e.calm = true; e.aggro = null;
    if (Math.random() < dt * 5) R.parts.push({ x: e.x + (Math.random() - 0.5) * 22, y: e.y - 8 - Math.random() * 30, vx: 0, vy: -28, life: 0.5, max: 0.5, col: '#8dffb0', size: 3, float: true });
    if (e.rooted > 0) return true;
    let tg = null, bd = 440; for (const o of R.enemies) { if (o === e || o.dead || o.charm > 0 || (o.calm && !o.struct)) continue; const d = dist(o, e); if (d < bd) { bd = d; tg = o; } }
    const spd = e.spd * (e.slow > 0 ? 0.45 : 1) * 1.15;
    if (!tg) { const d = dist(e, p); if (d > 76) G.chase(e, p.x - (p.face || 1) * 40, p.y + 10, spd, dt); else e.face = p.x > e.x ? 1 : -1; return true; }
    e.face = tg.x > e.x ? 1 : -1;
    if (e.range && bd < e.range) { if (e.atkCd <= 0) { e.atkCd = 1.6; e.atkAnim = 1; G.hurtEnemy(tg, e.dmg, e); R.bolts.push({ x1: e.x, y1: e.y - 20, x2: tg.x, y2: tg.y - 16, life: 0.2 }); } return true; }
    if (bd > e.r + tg.r + 12) { G.chase(e, tg.x, tg.y, spd, dt); return true; }
    if (e.atkCd <= 0) { e.atkCd = 1.05; e.atkAnim = 1; G.hurtEnemy(tg, e.dmg, e); }
    return true;
  };
  // ---------- projeté par l'onde de choc ----------
  M.kbStep = function (e, dt) {
    const k = e.kb; k.t -= dt; if (k.t <= 0) { e.kb = null; return false; }
    if (!G.slide(e, k.vx * dt, k.vy * dt, 9)) { e.kb = null; G.puff(e.x, e.y - 14, '#d8c8a0', 6, 70, 3); return false; } // il s'écrase contre un obstacle
    k.vx *= 1 - dt * 3; k.vy *= 1 - dt * 3; e.moving = true; e.step += dt * 6;
    if (Math.random() < dt * 30) CG.R.parts.push({ x: e.x, y: e.y - 2, vx: 0, vy: -10, life: 0.3, max: 0.3, col: '#e8dcc0', size: 3, float: true });
    return true;
  };
  // au sol : la grande onde qui s'élargit
  M.ground = function (g, t) {
    const R = CG.R, s = R.shock; if (!s) return;
    const k = s.t / 0.55, e = 1 - Math.pow(1 - k, 2.2), r = 24 + (M.PUSH_R + 30) * e, a = 1 - k;
    g.save(); g.translate(s.x, s.y); g.scale(1, 0.78);
    const gr = g.createRadialGradient(0, 0, r * 0.55, 0, 0, r); gr.addColorStop(0, 'rgba(190,235,255,0)'); gr.addColorStop(0.75, 'rgba(190,235,255,' + 0.38 * a + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 6.3); g.fill();
    g.strokeStyle = 'rgba(255,255,255,' + 0.95 * a + ')'; g.lineWidth = 9 * a + 2; g.beginPath(); g.arc(0, 0, r, 0, 6.3); g.stroke();
    g.strokeStyle = 'rgba(150,215,255,' + 0.8 * a + ')'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, r * 0.8, 0, 6.3); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.58, 0, 6.3); g.stroke();
    g.restore();
  };
  // au-dessus des charmés : un halo vert, un cœur et le temps qui reste
  M.marks = function (g, t) {
    const R = CG.R;
    for (const s of R.sprouts || []) { const k = Math.min(1, s.t / 1.5), h = 12 + k * 70; g.fillStyle = '#6b4a2a'; g.fillRect(s.x - 3 - k * 2, s.y + 10 - h * 0.5, 6 + k * 4, h * 0.5); g.fillStyle = '#3f9a2a'; g.beginPath(); g.ellipse(s.x, s.y + 10 - h * 0.62, 8 + k * 22, 8 + k * 30, 0, 0, 6.3); g.fill(); g.fillStyle = '#6cc934'; g.beginPath(); g.ellipse(s.x - 4, s.y + 6 - h * 0.7, 5 + k * 12, 5 + k * 16, 0, 0, 6.3); g.fill(); }
    for (const e of R.enemies) { if (!(e.sleepT > 0) || e.dead || !CG.onScreen(e.x, e.y)) continue; g.fillStyle = 'rgba(120,150,255,0.22)'; g.beginPath(); g.ellipse(e.x, e.y - 18, e.r + 12, e.r + 20, 0, 0, 6.3); g.fill(); g.textAlign = 'center';
      for (let i = 0; i < 3; i++) { const u = (t * 0.5 + i / 3) % 1; g.globalAlpha = Math.sin(u * Math.PI); g.font = 'bold ' + Math.round(11 + u * 13) + 'px "Trebuchet MS", sans-serif'; g.lineWidth = 3; g.strokeStyle = 'rgba(20,24,40,0.7)'; const x = e.x + 14 + u * 16 + Math.sin(u * 6 + i) * 3, y = e.y - 40 - u * 34; g.strokeText('z', x, y); g.fillStyle = '#e8f0ff'; g.fillText('z', x, y); } g.globalAlpha = 1; }
    { const e = M.stabTarget(); if (e) { const y = e.y - 70 * (e.r > 14 ? 1.2 : 1) + Math.sin(t * 7) * 4; g.fillStyle = 'rgba(255,60,60,' + (0.3 + Math.sin(t * 7) * 0.15) + ')'; g.beginPath(); g.arc(e.x, y - 6, 17, 0, 6.3); g.fill(); g.fillStyle = '#fff'; g.font = '22px sans-serif'; g.textAlign = 'center'; g.fillText('🗡️', e.x, y); g.strokeStyle = 'rgba(255,90,90,0.9)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(e.x, e.y, e.r + 8, (e.r + 8) * 0.5, 0, 0, 6.3); g.stroke(); } }
    for (const e of CG.R.enemies) { if (!(e.charm > 0) || e.dead || !CG.onScreen(e.x, e.y)) continue; const h = 50 * (e.r > 14 ? 1.25 : 1);
      g.strokeStyle = 'rgba(120,255,160,' + (0.6 + Math.sin(t * 6) * 0.25) + ')'; g.lineWidth = 3; g.beginPath(); g.ellipse(e.x, e.y, e.r + 9, (e.r + 9) * 0.5, 0, 0, 6.3); g.stroke();
      g.fillStyle = '#fff'; g.font = '15px sans-serif'; g.textAlign = 'center'; g.fillText('💞', e.x, e.y - h - 12 + Math.sin(t * 4) * 2);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(e.x - 15, e.y - h - 6, 30, 3); g.fillStyle = e.charm < 4 ? '#ff8a5a' : '#8dffb0'; g.fillRect(e.x - 15, e.y - h - 6, 30 * e.charm / M.CHARM, 3); }
  };
  function golemStep(s, dt) {
    const S = CG.S, R = CG.R, p = S.player;
    s.age += dt; s.t -= dt; s.atkCd -= dt; s.seek -= dt; if (s.atkAnim > 0) s.atkAnim -= dt * 3; if (s.flash > 0) s.flash -= dt; s.moving = false;
    if (s.t <= 0) return vanish(s, false);
    if (s.age < 0.6) return; // il sort du sol
    if (s.tg && (s.tg.dead || dist(s, s.tg) > 380)) s.tg = null;
    if (s.seek <= 0) { // l'ennemi le plus proche de lui, ou qui s'approche trop du chef
      s.seek = 0.5; let b = null, bd = 1e9;
      for (const e of R.enemies) { if (e.dead || e.calm) continue; const d = dist(e, s); if ((d < 300 || dist(e, p) < 230) && d < bd) { bd = d; b = e; } }
      s.tg = b;
    }
    const tg = s.tg;
    if (tg) {
      const d = dist(s, tg), reach = (tg.r || 12) + 26;
      if (d > reach) return void G.chase(s, tg.x, tg.y, 70, dt);
      s.face = tg.x > s.x ? 1 : -1;
      if (s.atkCd <= 0) { s.atkCd = 1.25; s.atkAnim = 1; G.hurtEnemy(tg, s.dmg, s); G.puff(tg.x, tg.y - 10, '#a8875e', 7, 90, 4); R.rings.push({ x: tg.x, y: tg.y - 4, r: 30, life: 0.25, col: '#c9a56b' }); }
      return;
    }
    const d = dist(s, p);
    if (d > 720) { s.x = p.x - 30; s.y = p.y + 10; s.path = null; G.unstick(s, 12); G.puff(s.x, s.y - 10, '#a8875e', 14, 110, 4); }
    else if (d > 66) G.chase(s, p.x - (p.face || 1) * 34, p.y + 12, d > 200 ? 78 * G.heroMul() + 40 : 82, dt);
    else s.face = p.x > s.x ? 1 : -1;
  }
  const up0 = G.update;
  G.update = function (dt) {
    up0(dt);
    const R = CG.R, p = CG.S.player;
    if (R.haste > 0) {
      R.haste -= dt;
      if (p.moving && Math.random() < dt * 26) R.parts.push({ x: p.x - R.dir.x * 8 + (Math.random() - 0.5) * 12, y: p.y - 4 - Math.random() * 22, vx: -R.dir.x * 40, vy: -R.dir.y * 40 - 8, life: 0.4, max: 0.4, col: Math.random() < 0.5 ? '#e6f7ff' : '#9ad8ff', size: 3, float: true });
      if (R.haste <= 0) G.text(p.x, p.y - 58, 'Le vent retombe', '#bfe9ff');
    }
    if (R.golem && !R.golem.dead) golemStep(R.golem, dt);
    if (R.shock) { R.shock.t += dt; if (R.shock.t >= 0.55) R.shock = null; }
    if (R.invis > 0) { R.invis -= dt; if (p.moving && Math.random() < dt * 8) R.parts.push({ x: p.x + (Math.random() - 0.5) * 14, y: p.y - 6 - Math.random() * 30, vx: 0, vy: -14, life: 0.5, max: 0.5, col: '#c8b8ff', size: 2.5, float: true }); if (R.invis <= 0) { R.invis = 0.0001; M.reveal(); } }
    for (const g of CG.S.goblins) if (g.bigT > 0) { g.bigT -= dt; const a = Math.min(1, (M.CABOCHE - g.bigT) / 0.45), b = Math.min(1, Math.max(0, g.bigT) / 0.6); g.bigK = g.bigT > 0 ? 1 + 1.1 * a * (1 + 0.3 * Math.sin(a * Math.PI)) * b + Math.sin(R.t * 3 + g.id) * 0.03 * b : 0; if (g.bigT <= 0) { G.puff(g.x, g.y - 36, '#ffb0d8', 10, 80, 3); G.text(g.x, g.y - 60, 'Pfiouuu...', '#ffb0d8'); } }
    if (R.sprouts && R.sprouts.length) { // la souche qui redevient un arbre
      for (const s of R.sprouts) { s.t += dt; if (Math.random() < dt * 24) R.parts.push({ x: s.x + (Math.random() - 0.5) * 30, y: s.y + 8 - Math.random() * 60 * Math.min(1, s.t / 1.4), vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 40, life: 0.6, max: 0.6, col: Math.random() < 0.5 ? '#b6f25a' : '#fff7c0', size: 3, float: true });
        if (s.t >= 1.5 && !s.done) { s.done = true; if (W.tile[s.i] === W.CLEAR) { W.tile[s.i] = W.TREE; W.paintRegrow(s.tx, s.ty); W.fieldDirty = true; W.miniDirty = true; G.unstick(p, 9); for (const g of CG.S.goblins) if (!g.hidden) G.unstick(g, 9); } G.puff(s.x, s.y - 30, '#3a8a44', 22, 130, 5); R.rings.push({ x: s.x, y: s.y + 6, r: 60, life: 0.5, col: '#b6f25a' }); G.text(s.x, s.y - 90, '🌳 Il a repoussé !', '#b6f25a', true); CG.sfx('heal'); } }
      R.sprouts = R.sprouts.filter(s => !s.done);
    }
  };

  // ---------- dessin : un tas de rochers vivant, sans contour ----------
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  M.draw = function (g, s, t) {
    const grow = Math.min(1, s.age / 0.6), k = 1 - Math.pow(1 - grow, 3), bob = Math.sin(t * 2.4) * 1.6, wk = s.moving ? Math.sin(s.step * 3.2) : 0, f = s.face, hit = Math.max(0, s.atkAnim);
    ell(g, s.x, s.y, 20 * k, 6.5 * k, 'rgba(0,0,0,0.28)');
    g.save(); g.translate(s.x, s.y); g.scale(1, k);
    if (s.t < 6 && Math.floor(s.t * 5) % 2) g.globalAlpha = 0.45; // il s'effrite : plus que quelques secondes
    else if (s.flash > 0) g.globalAlpha = 0.6;
    // cailloux qui tournent autour
    for (let i = 0; i < 3; i++) { const a = t * 1.5 + i * 2.1, cx = Math.cos(a) * 25, cy = -22 + Math.sin(a) * 7; if (Math.sin(a) < 0) ell(g, cx, cy, 3.2, 2.8, '#6e5236'); }
    // jambes
    ell(g, -9, -5 - Math.max(0, wk) * 3, 7.5, 6, '#6e5236'); ell(g, 9, -5 - Math.max(0, -wk) * 3, 7.5, 6, '#6e5236');
    ell(g, -9, -7 - Math.max(0, wk) * 3, 6, 3.5, '#866645'); ell(g, 9, -7 - Math.max(0, -wk) * 3, 6, 3.5, '#866645');
    // bras arrière
    ell(g, -f * 22, -24 + bob * 1.4 + wk * 2, 7, 8, '#7a5c3c');
    // corps : gros rocher à facettes
    poly(g, [-17, -12, -19, -27, -12, -39, 3, -42, 16, -36, 19, -22, 14, -10, 0, -7], '#8a6a48');
    poly(g, [-19, -27, -12, -39, 3, -42, 16, -36, 4, -30, -8, -29], '#a8875e');
    poly(g, [-17, -12, -19, -27, -8, -29, -6, -14, 0, -7], '#7a5c3c');
    poly(g, [4, -30, 16, -36, 19, -22, 9, -19], '#96764f');
    poly(g, [-2, -24, 3, -16, -1, -10, 1, -17], '#5a4129'); // fissure
    ell(g, -10, -36 + bob * 0.3, 7, 3.2, '#5fa83a'); ell(g, -14, -33 + bob * 0.3, 4, 2.4, '#7cc94a'); ell(g, 11, -37, 4.5, 2.2, '#5fa83a'); // mousse
    // tête
    const hy = -49 + bob;
    poly(g, [-10, hy + 7, -11, hy - 3, -4, hy - 9, 6, hy - 8, 11, hy - 1, 9, hy + 7, 0, hy + 9], '#9a7a54');
    poly(g, [-11, hy - 3, -4, hy - 9, 6, hy - 8, 11, hy - 1, 2, hy - 3], '#b8976c');
    ell(g, f * 2 - 4, hy + 1, 3.6, 3.6, 'rgba(255,210,58,0.35)'); ell(g, f * 2 + 4, hy + 1, 3.6, 3.6, 'rgba(255,210,58,0.35)');
    ell(g, f * 2 - 4, hy + 1, 1.9, 2.1, '#ffd23a'); ell(g, f * 2 + 4, hy + 1, 1.9, 2.1, '#ffd23a');
    ell(g, -3, hy - 8, 3.5, 1.8, '#7cc94a');
    // poing avant : il part en avant quand il frappe
    const px = f * (21 + Math.sin(hit * Math.PI) * 15), py = -22 - bob * 1.4 - wk * 2 - Math.sin(hit * Math.PI) * 5;
    ell(g, px, py, 8.5, 9, '#96764f'); ell(g, px - 1, py - 3, 6, 4, '#b8976c');
    for (let i = 0; i < 3; i++) { const a = t * 1.5 + i * 2.1, cx = Math.cos(a) * 25, cy = -22 + Math.sin(a) * 7; if (Math.sin(a) >= 0) { ell(g, cx, cy, 3.6, 3.1, '#8a6a48'); ell(g, cx - 0.6, cy - 1, 2, 1.4, '#b8976c'); } }
    g.restore();
    if (grow >= 1) { // vie, et temps qu'il lui reste
      if (s.hp < s.maxhp - 0.5) CG.Art.bar(g, s.x, s.y - 68, 34, s.hp / s.maxhp, '#c9a56b');
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(s.x - 17, s.y - 62, 34, 3); g.fillStyle = '#ffd23a'; g.fillRect(s.x - 17, s.y - 62, 34 * Math.max(0, s.t / M.GOLEM_T), 3);
    }
  };
})(window.CG);
