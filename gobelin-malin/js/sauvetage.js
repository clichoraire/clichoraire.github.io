// Goblin Malin — une petite à sauver. Certains jours, quelque part dans la forêt, une fillette humaine ou une petite elfe s'est
// perdue : des monstres l'encerclent. Rien ne l'annonce ; on tombe dessus en se promenant (elle crie quand le chef est assez près).
// Tant que des monstres s'acharnent sur elle, son courage fond ; à zéro, elle s'enfuit en pleurant. Si on les abat tous, elle
// remercie le chef et promet de raconter partout que les gobelins sont gentils, finalement : dès lors, des gobelins errants
// se présentent plus souvent au village (S.renom, jusqu'à 4).
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick; if (!G || !D) return;
  // CHANCE : par jour ; VOIT : distance où le drame commence ; PEUR : ce que chaque monstre encore sur elle lui coûte par seconde (sur 100) ; RENOM : chance d'un groupe d'errants de plus, par sauvetage
  const Sv = CG.Sauvetage = { CHANCE: 0.3, JOUR: 2, VOIT: 420, PEUR: 1.2, RENOM: 0.18, MAX: 4, LOIN: [16, 40], CADEAU: { or: [15, 4], parchemin: 0.25 } };
  const BETES = [['loup', 1], ['gelee', 1], ['araignee', 2], ['champi', 2], ['brigand', 3], ['squelette', 4], ['diablotin', 6]];
  const monde = () => (CG.Mondes ? CG.Mondes.ici() : 0), cas = () => { const S = CG.S, q = S && S.sauv; return q && q.day === S.day && q.m === monde() ? q : null; };
  const CRIS = ['À l\'aide ! Au secours !', 'Quelqu\'un ! S\'il vous plaît !', 'Allez-vous-en ! Laissez-moi !', 'Maman ! J\'ai peur !'];
  const MERCI = {
    humaine: ['Tu... tu m\'as sauvée ? Un gobelin ? Mon père dit que vous mangez les enfants !', 'Merci, monsieur le gobelin ! Je croyais que vous étiez tous méchants...'],
    elfe: ['Tu m\'as sauvée... Les anciens disent que les gobelins n\'ont pas de cœur. Ils se trompent.', 'Merci, petit chef. Je ne savais pas qu\'un gobelin pouvait être brave.']
  };
  // ---------- chaque matin : y a-t-il quelqu'un à sauver, et où ? ----------
  function tirer() {
    const S = CG.S, R = CG.R; R.petite = null; if (monde() !== 0) return; let q = cas();
    if (!q) { S.sauv = null; if (S.day < Sv.JOUR || Math.random() > Sv.CHANCE) return; const f = W.field();
      for (let k = 0; k < 400 && !q; k++) { const x = CG.irand(5, CG.MW - 6), y = CG.irand(5, CG.MH - 6), d = Math.hypot(x - W.CX, y - W.CY); if (f[W.idx(x, y)] < 0 || W.tile[W.idx(x, y)] !== W.GRASS || d < Sv.LOIN[0] || d > Sv.LOIN[1]) continue;
        if ((W.sites || []).some(s => Math.hypot(s.x - x, s.y - y) < s.r + 6) || Math.hypot(x - W.GRAVE.x, y - W.GRAVE.y) < 9 || S.buildings.some(b => Math.hypot(b.tx - x, b.ty - y) < 8)) continue;
        let libre = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (W.walkTile(x + dx, y + dy)) libre++; if (libre < 7) continue;
        q = S.sauv = { day: S.day, m: 0, x, y, qui: Math.random() < 0.5 ? 'humaine' : 'elfe', fini: false }; }
      if (!q) return; }
    if (q.fini) return; const c = W.center(q.x, q.y), types = BETES.filter(b => S.day >= b[1]).map(b => b[0]), type = pick(types), n = Math.min(5, 3 + Math.floor(S.day / 5));
    const o = R.petite = { x: c.x, y: c.y, qui: q.qui, etat: 'danger', courage: 100, face: 1, step: 0, moving: false, seed: Math.random() * 10, cri: 0, vue: false, bande: [], draw: dessin };
    for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(-0.2, 0.2); let x = c.x + Math.cos(a) * 44, y = c.y + Math.sin(a) * 34; if (!W.walkPx(x, y)) { x = c.x + Math.cos(a) * 22; y = c.y + Math.sin(a) * 16; } if (!W.walkPx(x, y)) continue;
      const e = G.spawnEnemy(type, x, y, { wild: true }); if (e) { e.sauv = true; e.aggroR = 170; e.leash = 300; e.mordT = rand(0.3, 1.4); o.bande.push(e); } }
  }
  const rw0 = D.rollWild; D.rollWild = function () { const r = rw0.apply(this, arguments); try { tirer(); } catch (e) { /* jamais bloquant */ } return r; };
  function partir(o, vite) { let best = null, bd = 1e9; ['ouest', 'est', 'sud'].forEach(k => { const e = W.EXITS[k], c = W.center(e.x, e.y), d = Math.hypot(c.x - o.x, c.y - o.y); if (d < bd) { bd = d; best = c; } }); o.etat = vite ? 'fuit' : 'part'; o.vit = vite ? 150 : 70; o.reste = 40; if (!best || !G.goTo(o, best.x, best.y)) o.reste = 3; }
  // ---------- son drame ----------
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R, o = R && R.petite; if (!o || R.night || R.cine) return; const p = S.player, d = Math.hypot(p.x - o.x, p.y - o.y);
    if (o.etat === 'danger') { const vifs = o.bande.filter(e => !e.dead && R.enemies.includes(e)); o.bande = vifs;
      if (!vifs.length) { o.etat = 'sauvee'; o.face = p.x > o.x ? 1 : -1; G.say(o, pick(['Ils... ils sont partis ?', 'Oh ! Tu les as chassés !']), 3.5); CG.sfx('ok'); G.puff(o.x, o.y - 20, '#fff3a8', 14, 90, 3); return; }
      if (d < Sv.VOIT) o.vue = true; let dessus = 0;
      for (const e of vifs) { if (e.target) continue; dessus++; e.face = o.x > e.x ? 1 : -1; e.mordT -= dt; if (e.mordT <= 0) { e.mordT = rand(0.9, 1.7); e.atkAnim = 1; if (CG.onScreen(o.x, o.y)) G.text(o.x + rand(-8, 8), o.y - 34, pick(['💢', '😱', '!']), '#fff'); } } // ceux qui n'ont pas vu le chef s'acharnent sur elle
      if (o.vue) { o.courage -= dessus * Sv.PEUR * dt; o.cri -= dt; if (o.cri <= 0 && d < Sv.VOIT + 120) { o.cri = rand(4.5, 7); G.say(o, pick(CRIS), 3); } }
      if (o.courage <= 0) { vifs.forEach(e => { e.sauv = false; }); G.say(o, pick(['Ouiiin ! Je veux rentrer !', 'Laissez-moi ! Laissez-moi !']), 3); partir(o, true); const q = cas(); if (q) q.fini = true; }
      return; }
    if (o.etat === 'sauvee') { o.face = p.x > o.x ? 1 : -1; o.step += dt; return; }
    o.reste -= dt; if (o.reste <= 0 || !o.path || G.follow(o, o.vit, dt)) R.petite = null; // elle s'en va, et disparaît au bout du chemin
  };
  // ---------- lui parler, une fois sauvée ----------
  const fi0 = D.findInteract; D.findInteract = function () { const it = fi0.apply(this, arguments), R = CG.R, o = R && R.petite; if (!o || o.etat !== 'sauvee' || R.ko > 0 || R.build) return it; const p = CG.S.player; if (Math.hypot(p.x - o.x, p.y - o.y) < 56 && (!it || it.type !== 'visitor')) return { type: 'petite', obj: { x: o.x, y: o.y - 26 }, label: o.qui === 'elfe' ? 'Parler à la petite elfe' : 'Parler à la petite humaine' }; return it; };
  // son cadeau tombe par terre, devant elle : on voit bien ce qu'elle donne, et on le ramasse en marchant dessus
  function cadeau(o) { const S = CG.S, d = S.day; G.dropRes(o.x, o.y, 'or', Sv.CADEAU.or[0] + d * Sv.CADEAU.or[1]); G.drop(o.x, o.y, { kind: 'potion', n: 1 });
    if (Math.random() < Sv.CADEAU.parchemin && G.newScroll) { const id = G.newScroll(); if (id) G.drop(o.x, o.y, { kind: 'scroll', id }); }
    G.puff(o.x, o.y - 20, '#ffe36b', 18, 130, 4); CG.R.rings.push({ x: o.x, y: o.y - 6, r: 54, life: 0.45, col: '#ffe36b' }); }
  const in0 = D.interact; D.interact = function () {
    const it = D.findInteract(); if (!it || it.type !== 'petite') return in0.apply(this, arguments); const S = CG.S, R = CG.R, o = R.petite, elfe = o.qui === 'elfe';
    const fin = () => { if (R.petite !== o || o.etat !== 'sauvee') return; const q = cas(); if (q) q.fini = true; S.renom = Math.min(Sv.MAX, (S.renom || 0) + 1); S.morale = Math.min(100, S.morale + 3); G.addXp(10 + S.day);
      cadeau(o); G.text(o.x, o.y - 44, '💛', '#fff', true); G.say(o, elfe ? 'Tiens, c\'est pour toi ! Je le dirai à toute la forêt : les gobelins sont gentils !' : 'Tiens, c\'est pour toi ! Je vais le dire à tout le village : les gobelins sont gentils !', 4.5); CG.sfx('heal'); setTimeout(() => { if (CG.R && CG.R.petite === o) partir(o, false); }, 2600); };
    UI.dialog({ who: elfe ? 'La petite elfe' : 'La petite humaine', tag: '💛 sauvée', text: pick(MERCI[o.qui]) + ' Je vais parler de toi à tout le monde. Ils sauront que les gobelins sont gentils, finalement !',
      options: [{ label: '🙂 Rentre vite chez toi, et fais attention.', sub: 'Elle racontera ce que tu as fait : des gobelins errants viendront plus souvent se présenter', fn: fin }, { label: '😈 Bouh !', sub: 'Elle rit... puis file quand même raconter son histoire', fn: () => { G.say(o, 'Hi hi ! Même pas peur, maintenant !', 2.4); fin(); } }] });
  };
  // ---------- la rumeur : des errants de plus ----------
  const pl0 = D.plan; D.plan = function () { const r = pl0.apply(this, arguments), S = CG.S, R = CG.R, n = S.renom || 0;
    if (n > 0 && monde() === 0 && S.day > 2 && R.schedule && !R.schedule.some(e => e.type === 'visit' && e.role === 'nomade') && S.goblins.length < G.capacity() + 2 && Math.random() < Sv.RENOM * n) { R.schedule.push({ h: rand(8, 15), type: 'visit', role: 'nomade' }); R.schedule.sort((a, b) => a.h - b.h); }
    return r; };
  // ---------- son dessin : toute petite, accroupie les mains sur la tête tant qu'elle a peur ----------
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); }, circ = (g, x, y, r, f) => ell(g, x, y, r, r, f);
  const line = (g, a, b, c, d, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  function dessin(g, o, t) {
    const elfe = o.qui === 'elfe', peur = o.etat === 'danger', pleure = o.etat === 'fuit', f = o.face < 0 ? -1 : 1, sw = o.moving ? Math.sin(o.step * TAU) : 0, tr = peur ? Math.sin(t * 40) * 0.7 : 0;
    const peau = elfe ? '#f6e0c8' : '#f4cca4', robe = elfe ? '#5aa878' : '#d8607a', robe2 = elfe ? '#3f8a5e' : '#b8445e', chev = elfe ? '#f0e4a8' : '#8a5a2a';
    ell(g, o.x, o.y + 1, 8, 3, 'rgba(0,0,0,0.22)'); g.save(); g.translate(o.x + tr, o.y); g.scale(f, 1);
    const bas = peur ? 4 : 0, by = -8 + bas, sh = by - 9 + bas * 0.3, hy = sh - 6.4 + (o.moving ? Math.abs(sw) : Math.sin(t * 2.6) * 0.4);
    if (!peur) { line(g, -2, by, -2 + sw * 3.4, -1, peau, 2.4); line(g, 2, by, 2 - sw * 3.4, -1, peau, 2.4); ell(g, -1.4 + sw * 3.4, -0.8, 2.4, 1.4, '#5a3a22'); ell(g, 2.6 - sw * 3.4, -0.8, 2.4, 1.4, '#5a3a22'); } else { ell(g, -2.4, -0.8, 2.6, 1.4, '#5a3a22'); ell(g, 3, -0.8, 2.6, 1.4, '#5a3a22'); }
    if (chev) { g.fillStyle = chev; g.beginPath(); g.ellipse(-1.2, hy + 1.4, 6.4, 7, 0, 0, TAU); g.fill(); if (elfe) poly(g, [-6.6, hy + 1, -8.4, sh + 9, -2.6, sh + 7, -1, hy + 4], chev); } // les cheveux, derrière
    poly(g, [-4.4, sh, 4.4, sh, 7.4 + bas * 0.5, by + 2.4, -7.4 - bas * 0.5, by + 2.4], robe); poly(g, [-4.4, sh, -1.2, sh, -2.4, by + 2.4, -7.4 - bas * 0.5, by + 2.4], robe2); g.fillStyle = elfe ? '#e8d890' : '#fff3e0'; g.fillRect(-4.6, sh + 4.4, 9.4, 1.5);
    if (!elfe) { line(g, -5.6, hy + 2, -6.6, sh + 6.4, chev, 2.4); line(g, 5, hy + 2.4, 5.8, sh + 6, chev, 2.2); circ(g, -6.6, sh + 6.8, 1.4, '#ffd84a'); circ(g, 5.8, sh + 6.4, 1.3, '#ffd84a'); } // deux nattes à rubans
    ell(g, 0.4, hy, 5.4, 5.6, peau); ell(g, -2.2, hy + 0.6, 2.8, 4.4, 'rgba(0,0,0,0.06)');
    if (elfe) { poly(g, [-4.2, hy - 0.8, -10.4, hy - 3.6, -4.4, hy + 2.6], peau); poly(g, [-4.8, hy, -8.6, hy - 2.4, -4.8, hy + 1.6], 'rgba(200,90,110,0.25)'); }
    g.fillStyle = chev; g.beginPath(); g.moveTo(-5.2, hy + 0.6); g.quadraticCurveTo(-6, hy - 6.6, 0.6, hy - 6); g.quadraticCurveTo(5.6, hy - 5.6, 5.9, hy - 1.8); g.quadraticCurveTo(2.4, hy - 4, -1, hy - 2.8); g.quadraticCurveTo(-3.4, hy - 2, -3.6, hy + 1); g.closePath(); g.fill();
    if (elfe) { g.strokeStyle = '#4a9a3a'; g.lineWidth = 1.1; g.beginPath(); g.arc(0.4, hy - 0.4, 5.6, Math.PI * 1.12, Math.PI * 1.9); g.stroke(); circ(g, 2.4, hy - 5.4, 1.1, '#ffb3d1'); }
    if (peur || pleure) { line(g, 1.4, hy - 0.6, 3.4, hy + 0.2, '#2a1a14', 0.9); line(g, 3.4, hy + 0.2, 1.4, hy + 1, '#2a1a14', 0.9); line(g, -2.6, hy + 0.2, -0.8, hy - 0.6, '#2a1a14', 0.9); line(g, -2.6, hy + 0.2, -0.8, hy + 1, '#2a1a14', 0.9);
      ell(g, 1.6, hy + 3.4, 1.3, 1.5, '#5a2420'); const k = (t * 1.6 + o.seed) % 1; g.globalAlpha = 1 - k; circ(g, 4, hy + 1.4 + k * 6, 1, '#9ad8ff'); circ(g, -2.8, hy + 1.4 + ((k + 0.5) % 1) * 6, 0.9, '#9ad8ff'); g.globalAlpha = 1; }
    else { ell(g, 2.6, hy - 0.2, 1.3, 1.6, '#fffdf4'); ell(g, -1.2, hy - 0.2, 1.1, 1.5, '#fffdf4'); circ(g, 2.9, hy, 0.85, elfe ? '#2a6a3a' : '#4a2a14'); circ(g, -0.9, hy, 0.75, elfe ? '#2a6a3a' : '#4a2a14'); circ(g, 3.1, hy - 0.4, 0.3, '#fff'); ell(g, 3.6, hy + 2.2, 1.5, 0.9, 'rgba(240,110,120,0.4)');
      g.strokeStyle = '#2a1a14'; g.lineWidth = 0.9; g.lineCap = 'round'; g.beginPath(); g.moveTo(0.2, hy + 2.8); g.quadraticCurveTo(1.8, hy + 4.4, 3.4, hy + 2.6); g.stroke(); }
    if (peur) { line(g, -3.8, sh + 1.4, -5.6, hy - 2.6, robe, 2.4); line(g, 3.8, sh + 1.4, 5.6, hy - 3, robe, 2.4); circ(g, -5.2, hy - 3.6, 1.6, peau); circ(g, 5.4, hy - 4, 1.6, peau); } // les mains sur la tête
    else { line(g, -3.8, sh + 1.4, -5 - sw * 2, sh + 7, robe2, 2.3); circ(g, -5 - sw * 2, sh + 7.6, 1.5, peau); const sal = o.etat === 'sauvee' ? Math.sin(t * 7) * 0.5 - 1.9 : 0.5 + sw * 0.5, hx = 3.8 + Math.sin(sal) * 6.4, hyy = sh + 1.4 + Math.cos(sal) * 6.4; line(g, 3.8, sh + 1.4, hx, hyy, robe, 2.3); circ(g, hx, hyy, 1.6, peau); } // sauvée, elle fait coucou
    g.restore();
    if (peur && o.vue && CG.onScreen(o.x, o.y)) { const w = 26, k = Math.max(0, o.courage / 100); g.fillStyle = 'rgba(20,12,8,0.7)'; g.fillRect(o.x - w / 2 - 1, o.y - 38, w + 2, 5); g.fillStyle = k > 0.4 ? '#ffd84a' : '#ff7a5a'; g.fillRect(o.x - w / 2, o.y - 37, w * k, 3); }
  }
  if (CG.Armee && CG.Armee.pousser) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); const o = CG.R && CG.R.petite; if (o && CG.onScreen(o.x, o.y)) push(o.y, 21, o, null); }; }
})(window.CG);
