// Goblin Malin — les spectres. Au cimetière de la forêt rôdent des spectres (ils deviennent impalpables par moments : les
// coups leur passent au travers) et, plus tard, des âmes en peine, plus coriaces, qui volent de la vie en frappant.
// Mais tous les morts ne sont pas méchants : certains jours, un vieux chef gobelin d'autrefois attend entre les tombes,
// et il a un cadeau pour celui qui vient le voir.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick;
  const Sp = CG.Spectres = { AMI: 0.35, AME_JOUR: 6, VEILLE: 0.8, DRAIN: 0.5, XP: [60, 10, 0.15] };
  Object.assign(CG.ENEMIES, {
    spectre: { nom: 'Spectre', race: 'mort', hp: 28, dmg: 6, spd: 72, xp: 22, or: 4, cost: 3, r: 12 },
    wraith: { nom: 'Âme en peine', race: 'mort', hp: 90, dmg: 11, spd: 58, xp: 60, or: 12, cost: 7, r: 15 }
  });
  const foret = () => !CG.Mondes || CG.Mondes.ici() === 0;
  const tombe = () => { for (let k = 0; k < 40; k++) { const a = Math.random() * TAU, d = rand(0.5, W.GRAVE.r + 1.5), x = (W.GRAVE.x + 0.5 + Math.cos(a) * d) * T, y = (W.GRAVE.y + 0.5 + Math.sin(a) * d) * T; if (W.walkPx(x, y)) return { x, y }; } return W.center(W.GRAVE.x, W.GRAVE.y); };
  // ---------- les méchants : ils hantent le cimetière ----------
  const rw0 = D.rollWild; D.rollWild = function () {
    const r = rw0.apply(this, arguments); if (!foret()) return r; const S = CG.S, n = Math.min(5, 2 + Math.floor(S.day / 4));
    for (let i = 0; i < n; i++) { const q = tombe(), e = G.spawnEnemy('spectre', q.x, q.y, { wild: true }); if (e) e.cimetiere = true; }
    if (S.day >= Sp.AME_JOUR) { const q = tombe(), e = G.spawnEnemy('wraith', q.x, q.y, { wild: true }); if (e) e.cimetiere = true; }
    return r;
  };
  const he0 = G.hurtEnemy; G.hurtEnemy = function (e, dmg) { // impalpable : ça passe au travers
    if (e && e.type === 'spectre' && e.vide > 0 && !e.dead) { if (CG.onScreen(e.x, e.y) && !(e.videDit > 0)) { e.videDit = 0.8; G.text(e.x, e.y - 50, 'À travers !', '#cfe0ff'); } return; }
    return he0.apply(this, arguments);
  };
  // impalpable = personne ne le vise non plus : pendant que le village, les animaux et les tours réfléchissent, le spectre transparent
  // a l'air paisible (calm), comme le rival en duel (rival.js). Pour lui-même (W.foe, le tour des ennemis), il reste un ennemi.
  { let enJeu = 0; const u0 = G.update; G.update = function () { enJeu++; try { return u0.apply(this, arguments); } finally { enJeu--; } };
    const se0 = G.spawnEnemy; G.spawnEnemy = function (type) { const e = se0.apply(this, arguments); if (e && type === 'spectre') Object.defineProperty(e, 'calm', { configurable: true, enumerable: true, get: () => enJeu > 0 && e.vide > 0 && !e.dead && !W.foe, set: () => {} }); return e; }; }
  const hp0 = G.hurtPlayer; G.hurtPlayer = function (dmg) { // l'âme en peine boit la vie qu'elle prend
    const S = CG.S, R = CG.R, p = S.player; if (S.veille === S.day) dmg *= Sp.VEILLE;
    if (!(R.invuln > 0) && !(R.ko > 0)) for (const e of R.enemies) if (!e.dead && e.type === 'wraith' && e.atkAnim > 0.4 && Math.hypot(e.x - p.x, e.y - p.y) < 60 + e.r) { const n = Math.min(e.maxhp - e.hp, Math.ceil(dmg * Sp.DRAIN)); if (n > 0) { e.hp += n; G.text(e.x, e.y - 60, '+' + n, '#b0ffb8'); R.bolts.push({ x1: p.x, y1: p.y - 24, x2: e.x, y2: e.y - 26, life: 0.2 }); } break; }
    return hp0.call(this, dmg);
  };
  // les fantômes traversent tout : arbres, rochers, eau, murs. Le jeu les fait marcher comme les autres ; on défait ce pas
  // et on les fait glisser tout droit vers leur proie (ou vers leur tombe quand ils n'ont personne à hanter).
  const FANTOME = Sp.FANTOME = { spectre: 1, wraith: 1 };
  const libre = e => !e.dead && !(e.rooted > 0) && !(e.para > 0) && !e.poly && !(e.sleepT > 0) && !(e.charm > 0) && !(e.fear > 0) && !(e.daze > 0) && !e.kb && !e.retreat;
  const up0 = G.update; G.update = function (dt) {
    const R0 = CG.R, avant = []; if (R0) for (const e of R0.enemies) if (FANTOME[e.type] && libre(e)) avant.push([e, e.x, e.y]);
    up0.apply(this, arguments); const R = CG.R; if (!R) return;
    if (R === R0) for (const q of avant) { const e = q[0]; if (!libre(e)) continue; const S = CG.S, tg = e.target && !e.target.dead && !e.target.hidden && !(e.target === S.player && (R.ko > 0 || R.invis > 0)) ? e.target : null, but = tg || (e.wild && Math.hypot(e.x - e.wild.x, e.y - e.wild.y) > 30 ? e.wild : null);
      if (!but) continue; e.x = q[1]; e.y = q[2]; const dx = but.x - e.x, dy = but.y - e.y, d = Math.hypot(dx, dy) || 1, arret = tg ? 20 + (tg.r || 0) : 4; if (d <= arret) { e.moving = false; continue; }
      const v = Math.min(d - arret, e.spd * (e.slow > 0 ? 0.45 : 1) * (tg ? 1 : 0.6) * dt); e.x = CG.clamp(e.x + dx / d * v, 20, CG.MW * T - 20); e.y = CG.clamp(e.y + dy / d * v, 20, CG.MH * T - 20); e.moving = true; e.step += dt * 3; if (Math.abs(dx) > 3) e.face = dx > 0 ? 1 : -1; e.path = null; }
    for (const e of R.enemies) { if (e.type !== 'spectre' || e.dead) continue; if (e.videDit > 0) e.videDit -= dt;
      if (e.vide > 0) e.vide -= dt; else { e.videCd = (e.videCd === undefined ? rand(2, 5) : e.videCd) - dt; if (e.videCd <= 0) { e.videCd = rand(4, 6.5); e.vide = 1.3; } } }
  };
  // ---------- le gentil : un ancien chef, certains jours ----------
  const DIRS = ['à l\'est', 'au sud-est', 'au sud', 'au sud-ouest', 'à l\'ouest', 'au nord-ouest', 'au nord', 'au nord-est'];
  function poser() {
    const S = CG.S, R = CG.R; R.visitors = R.visitors.filter(v => !v.spectre); R.specJ = S.day + ':' + (CG.Mondes ? CG.Mondes.ici() : 0); if (!foret()) return;
    if (!S.spectreAmi || S.spectreAmi.day !== S.day) S.spectreAmi = { day: S.day, la: Math.random() < Sp.AMI, vu: false };
    if (!S.spectreAmi.la || S.spectreAmi.vu) return;
    if (R.enemies.some(e => !e.dead && (e.site === 'cimetiere' || e.cimetiere))) { R.specJ = 'attente'; R.specAtt = (R.t || 0) + 0.5; return; } /* il ne se montre qu'une fois le cimetière nettoyé */
    const attendu = R.specAtt !== undefined; R.specAtt = undefined; const c = W.center(W.GRAVE.x, W.GRAVE.y); let x = c.x, y = c.y + T; if (!W.walkPx(x, y)) { const q = tombe(); x = q.x; y = q.y; }
    R.visitors.push({ id: S.nextId++, role: 'esprit', look: 'spectreAmi', spectre: true, x, y, face: 1, step: 0, moving: false, state: 'wait', exit: { x, y }, dest: { x, y }, seed: Math.random() * 100, leaveAt: 99 });
    if (attendu) { G.puff(x, y - 30, '#cfe0ff', 34, 170, 4); for (let i = 0; i < 3; i++) R.rings.push({ x, y: y - 10, r: 50 + i * 40, life: 0.5 + i * 0.15, col: '#cfe0ff' }); if (CG.onScreen(x, y)) CG.sfx('discovery'); UI.toast('👻 Le cimetière est enfin calme... Quelqu\'un t\'attend entre les tombes.'); }
  }
  Sp.poser = poser;
  // le secret murmuré : une clé sur la mini-carte et une lueur bleue au-dessus de l'endroit, jusqu'à ce qu'on le trouve ou que le jour finisse
  Sp.carte = () => !!(CG.Diff && CG.Diff.id && CG.Diff.id() === 'normal'); /* le repère sur la mini-carte : en Normal seulement. Ailleurs, il faut chercher la lueur soi-même */
  Sp.secret = function () { const S = CG.S, d = S && S.secretDit; if (!d || !CG.Secrets) return null; if (d.day !== S.day || d.monde !== (CG.Mondes ? CG.Mondes.ici() : 0)) { if (d.day !== S.day) S.secretDit = null; return null; }
    const s = CG.Secrets.liste().find(q => { const c = CG.Secrets.pos(q); return c && Math.hypot(c.x - d.x, c.y - d.y) < 90; }); if (!s) { S.secretDit = null; return null; } const c = CG.Secrets.pos(s); d.x = c.x; d.y = c.y; return c; }; /* le papillon bouge un peu : la lueur le suit */
  window.addEventListener('load', () => {
    const Sc = CG.Scout; if (Sc && Sc.mini) { const mi0 = Sc.mini; Sc.mini = function (g) { mi0.apply(this, arguments); const c = Sp.carte() ? Sp.secret() : null; if (!c) return; const x = c.x * 2 / T, y = c.y * 2 / T, k = 0.5 + Math.sin(performance.now() / 260) * 0.5;
        g.fillStyle = 'rgba(120,190,255,' + (0.25 + k * 0.3) + ')'; g.beginPath(); g.arc(x, y, 6 + k * 3, 0, TAU); g.fill(); g.fillStyle = '#eaf6ff'; g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); g.strokeStyle = '#3a7ad0'; g.lineWidth = 1; g.stroke(); }; }
    const M = CG.Magie; if (M && M.marks) { const mk0 = M.marks; M.marks = function (g, t) { mk0.apply(this, arguments); const c = Sp.secret(); if (!c || !CG.onScreen(c.x, c.y)) return;
        const k = 0.5 + Math.sin(t * 2.6) * 0.5, gr = g.createLinearGradient(0, c.y - 150, 0, c.y); gr.addColorStop(0, 'rgba(150,210,255,0)'); gr.addColorStop(1, 'rgba(150,210,255,' + (0.3 + k * 0.2) + ')');
        g.fillStyle = gr; g.beginPath(); g.moveTo(c.x - 5, c.y - 150); g.lineTo(c.x + 5, c.y - 150); g.lineTo(c.x + 16, c.y); g.lineTo(c.x - 16, c.y); g.closePath(); g.fill(); /* un fin rayon bleu qui descend du ciel */
        g.strokeStyle = 'rgba(200,235,255,' + (0.5 + k * 0.4) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(c.x, c.y, 20 + k * 4, 8 + k * 1.5, 0, 0, TAU); g.stroke();
        for (let i = 0; i < 4; i++) { const a = t * 1.3 + i * 1.57, yy = c.y - 20 - ((t * 26 + i * 37) % 110); g.fillStyle = 'rgba(235,248,255,0.85)'; g.beginPath(); g.arc(c.x + Math.cos(a) * 9, yy, 1.6, 0, TAU); g.fill(); } }; }
  });
  const du0 = D.update; D.update = function () { const r = du0.apply(this, arguments), S = CG.S, R = CG.R; if (S && R && R.visitors && !R.night && !R.cine && R.specJ !== S.day + ':' + (CG.Mondes ? CG.Mondes.ici() : 0) && !(R.specJ === 'attente' && (R.t || 0) < R.specAtt)) poser(); return r; };
  Sp.parler = function (v) {
    const S = CG.S, R = CG.R, p = S.player, f = G.firePos();
    const parti = txt => { if (!R.visitors.includes(v)) return; R.visitors.splice(R.visitors.indexOf(v), 1); S.spectreAmi.vu = true; G.puff(v.x, v.y - 30, '#cfe0ff', 30, 160, 4); R.rings.push({ x: v.x, y: v.y - 10, r: 80, life: 0.5, col: '#cfe0ff' }); CG.sfx('heal'); if (txt) UI.toast(txt); try { CG.save(); } catch (e) { /* rien */ } };
    const pos = q => CG.Secrets.pos(q), sec = CG.Secrets ? CG.Secrets.liste().filter(q => { const c = pos(q); return c && isFinite(c.x) && isFinite(c.y); }).sort((a, b) => Math.hypot(pos(a).x - f.x, pos(a).y - f.y) - Math.hypot(pos(b).x - f.x, pos(b).y - f.y))[0] || null : null, /* le secret le plus proche du feu, et dont on connaît l'endroit exact */ xp = Math.max(Sp.XP[0] + Sp.XP[1] * S.day, Math.round(G.xpNeed(p.lvl) * Sp.XP[2])), /* ses batailles : au moins XP[0] + XP[1] par jour, et jamais moins que XP[2] du niveau en cours */ opts = [];
    opts.push({ label: '🛡️ Veille sur moi', sub: 'Jusqu\'à demain matin, tu reçois 20 % de dégâts en moins', fn: () => { S.veille = S.day; parti('👻 Les ancêtres veillent sur toi jusqu\'à demain matin : 20 % de dégâts en moins.'); } });
    if (sec) opts.push({ label: '🗝️ Dis-moi un secret', sub: 'Les morts voient ce que les vivants ne remarquent pas', fn: () => { const c = pos(sec), dx = c.x - f.x, dy = c.y - f.y, d = Math.round(Math.hypot(dx, dy) / T), dir = DIRS[((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8];
      parti(); S.secretDit = { day: S.day, monde: CG.Mondes ? CG.Mondes.ici() : 0, x: c.x, y: c.y }; if (R.pings && Sp.carte()) R.pings.push({ x: c.x, y: c.y, t0: performance.now(), icon: '🗝️', dur: 9000 });
      UI.dialog({ who: 'L\'ancien chef', tag: '👻 un murmure', text: '« Il y a ' + CG.Secrets.nom(sec) + ', ' + dir + ' de ton feu, à ' + d + ' cases à peu près. ' + (Sp.carte() ? 'Je te le marque sur ta carte, et une lueur bleue flotte au-dessus.' : 'Une lueur bleue flotte au-dessus : à toi de la trouver.') + ' Vas-y avant la nuit : demain, ce ne sera plus là. »', options: [{ label: 'Merci, ancêtre' }] }); } });
    opts.push({ label: '✨ Raconte-moi ta vie', sub: 'Tu apprends de ses batailles : +' + xp + ' XP', fn: () => { G.addXp(xp); parti('👻 L\'ancien chef t\'a raconté ses batailles : +' + xp + ' XP.'); } });
    opts.push({ label: '💭 Laisse-moi y réfléchir', sub: 'L\'ancien chef t\'attendra ici' });
    UI.dialog({ visitor: v, who: 'L\'ancien chef', tag: '👻 un spectre qui ne te veut aucun mal', text: '« N\'aie pas peur, petit. J\'ai porté le bâton de chef bien avant toi, quand ces arbres n\'étaient que des glands. Ça fait du bien de voir un gobelin debout. Laisse-moi t\'aider, une fois. Que veux-tu ? »', options: opts });
  };
  const tk0 = D.talk; D.talk = function (v) { if (v.spectre) return Sp.parler(v); return tk0.apply(this, arguments); };
  if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'veille', ic: '👻', nom: () => 'Veille des ancêtres', txt: 'Un ancien chef veille sur toi : tu reçois 20 % de dégâts en moins.', t: () => CG.S.veille === CG.S.day ? true : 0, fin: () => 'jusqu\'à demain matin' });
  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f, r) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, r || 0, 0, TAU); g.fill(); };
  function drap(g, x, y, s, t, c) { // un corps de brume qui flotte, avec un bas en lambeaux
    const fl = Math.sin(t * 2.4) * 3 * s, w = 13 * s, h = 34 * s; y -= 8 * s + fl; g.fillStyle = c.corps; g.beginPath(); g.moveTo(x - w, y); g.bezierCurveTo(x - w, y - h * 0.8, x - w * 0.8, y - h, x, y - h); g.bezierCurveTo(x + w * 0.8, y - h, x + w, y - h * 0.8, x + w, y);
    for (let i = 0; i < 4; i++) { const x1 = x + w - (i + 0.5) * w / 2, x2 = x + w - (i + 1) * w / 2; g.quadraticCurveTo(x1 + Math.sin(t * 5 + i) * 2 * s, y + (8 + (i % 2) * 5) * s, x2, y); } g.closePath(); g.fill();
    ell(g, x - 3 * s, y - h * 0.62, 5 * s, 8 * s, c.clair); return { y, h, fl };
  }
  function spectre(g, e, t, c, s) {
    const face = e.face < 0 ? -1 : 1, a = g.globalAlpha; ell(g, e.x, e.y + 1, 11 * s, 3.4 * s, 'rgba(0,0,0,0.14)'); g.globalAlpha = a * (e.vide > 0 ? 0.28 : c.alpha);
    const b = drap(g, e.x, e.y, s, t + (e.seed || 0), c), hy = b.y - b.h * 0.66, at = e.atkAnim > 0 ? e.atkAnim : 0;
    [-1, 1].forEach(k => { g.strokeStyle = c.corps; g.lineWidth = 4.4 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(e.x + k * 10 * s, b.y - b.h * 0.5); g.lineTo(e.x + k * 14 * s + face * (6 + at * 10) * s, b.y - b.h * 0.42 - at * 8 * s); g.stroke(); });
    if (c.capuche) { g.fillStyle = c.capuche; g.beginPath(); g.moveTo(e.x - 11 * s, hy + 9 * s); g.quadraticCurveTo(e.x - 13 * s, hy - 14 * s, e.x + face * 2 * s, hy - 15 * s); g.quadraticCurveTo(e.x + 13 * s, hy - 12 * s, e.x + 11 * s, hy + 9 * s); g.closePath(); g.fill(); ell(g, e.x + face * 2 * s, hy, 7 * s, 8 * s, '#0c0a14'); }
    [-1, 1].forEach(k => ell(g, e.x + face * 2.4 * s + k * 3.6 * s, hy - 1 * s, 2.1 * s, (c.amical ? 2.4 : 3) * s, c.oeil));
    if (c.amical) { g.strokeStyle = c.oeil; g.lineWidth = 1.4; g.beginPath(); g.arc(e.x + face * 2.4 * s, hy + 4 * s, 3 * s, 0.3, Math.PI - 0.3); g.stroke(); g.fillStyle = '#e8c84a'; g.beginPath(); const cx = e.x, cy = hy - 12 * s; g.moveTo(cx - 8 * s, cy); g.lineTo(cx - 8 * s, cy - 7 * s); g.lineTo(cx - 4 * s, cy - 3 * s); g.lineTo(cx, cy - 9 * s); g.lineTo(cx + 4 * s, cy - 3 * s); g.lineTo(cx + 8 * s, cy - 7 * s); g.lineTo(cx + 8 * s, cy); g.closePath(); g.fill(); [-1, 1].forEach(k => { g.fillStyle = c.corps; g.beginPath(); g.moveTo(e.x + k * 9 * s, hy - 2 * s); g.lineTo(e.x + k * 21 * s, hy - 7 * s); g.lineTo(e.x + k * 10 * s, hy + 3 * s); g.closePath(); g.fill(); }); }
    else if (!c.capuche) ell(g, e.x + face * 2.4 * s, hy + 5 * s, 2.2 * s, 3.2 * s + at * 2, c.oeil);
    g.globalAlpha = a;
  }
  Sp.dessin = spectre;
  const MECHANT = { corps: 'rgba(200,220,255,0.9)', clair: 'rgba(255,255,255,0.5)', oeil: '#1c2440', alpha: 0.78 };
  const AME = { corps: 'rgba(58,44,84,0.95)', clair: 'rgba(120,100,170,0.4)', oeil: '#ff4a5a', alpha: 0.92, capuche: '#2a1e40' };
  const AMI = { corps: 'rgba(170,240,200,0.9)', clair: 'rgba(255,255,255,0.55)', oeil: '#1c4030', alpha: 0.8, amical: true };
  const en0 = Art.enemy; Art.enemy = function (g, e, t) { if (e.type === 'spectre') return spectre(g, e, t, MECHANT, 1); if (e.type === 'wraith') { ell(g, e.x, e.y - 30, 30, 34, 'rgba(120,60,180,0.12)'); return spectre(g, e, t, AME, 1.45); } return en0.apply(this, arguments); };
  const vis0 = Art.visitor; Art.visitor = function (g, v, t) { if (v.look !== 'spectreAmi') return vis0.apply(this, arguments); const portrait = v.x === 0 && v.y === 0; if (!portrait) ell(g, v.x, v.y - 28, 34, 38, 'rgba(150,255,200,0.14)'); return spectre(g, { x: v.x, y: portrait ? 6 : v.y, face: v.face, seed: v.seed, atkAnim: 0 }, t, AMI, portrait ? 1.1 : 1.25); };
})(window.CG);
