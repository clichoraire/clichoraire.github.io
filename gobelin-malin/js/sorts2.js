// Goblin Malin — nouveaux sorts : Électrification (le corps du chef crépite), Résurrection (ramener un compagnon), Plaque de verglas (les monstres marchent sur des œufs).
'use strict';
(function (CG) {
  const G = CG.G, TAU = Math.PI * 2, So = CG.Sorts2 = {};
  const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const pret = id => { const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine) return false; if (p.mp < G.spellCost(id)) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return false; } return true; };
  const mul = () => (1 + 0.12 * (CG.S.player.lvl - 1)) * (G.tech('s4') ? 1.25 : 1);

  // ================= Électrification =================
  So.ELEC = { dur: 15, rayon: 62, tick: 0.5, dmg: 5, riposte: 6 };
  CG.SPELLS.electro = { nom: 'Électrification', icon: '🌩️', mp: 18, prix: 900, desc: 'Pendant 15 secondes, ton corps crépite d\'éclairs : tout ennemi qui s\'approche de toi est foudroyé encore et encore, et celui qui te frappe reçoit une décharge qui le fige un instant.', color: '#7ad0ff' };
  // ================= Plaque de verglas =================
  So.GLACE = { dur: 14, rayon: 120, lent: 0.32 };
  CG.SPELLS.verglas = { nom: 'Plaque de verglas', icon: '🧊', mp: 12, prix: 500, desc: 'Une grande plaque de glace se forme par terre pendant 14 secondes, sous l\'ennemi le plus proche ou devant toi. Les monstres qui marchent dessus avancent tout doucement pour ne pas glisser. Tes gobelins, eux, ont le pied sûr.', color: '#a8e4ff' };
  // ================= Résurrection =================
  So.RES = { base: 30, parNiveau: 10, garde: 12 }; // mana = base + parNiveau × niveau ; on se souvient des 12 derniers tombés
  CG.SPELLS.resurrection = { nom: 'Résurrection', icon: '🕊️', mp: 40, prix: 2500, desc: 'Un des plus grands sorts : choisis un gobelin tombé au combat, ou un compagnon mort le jour même, et ramène-le à la vie près de toi. Plus il est de haut niveau, plus il faut de mana (30, plus 10 par niveau).', color: '#fff3b0' };
  // ================= Téléportation =================
  So.TP = { cases: 4.5, min: 40 };
  CG.SPELLS.teleport = { nom: 'Téléportation', icon: '💫', mp: 8, prix: 500, desc: 'Tu disparais et réapparais d\'un coup 4 à 5 cases devant toi, même par-dessus un mur, une rangée d\'arbres ou une rivière. S\'il n\'y a pas de place là-bas, tu arrives un peu avant.', color: '#9fd0ff' };
  ['electro', 'verglas', 'resurrection', 'teleport'].forEach(id => CG.SCROLL_POOL.push(id));
  function teleporter() {
    const S = CG.S, R = CG.R, p = S.player, T = CG.TILE, dx = R.dir ? R.dir.x : p.face, dy = R.dir ? R.dir.y : 0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; let but = null;
    for (let d = So.TP.cases * T; d >= So.TP.min; d -= 8) { const x = p.x + ux * d, y = p.y + uy * d; if (CG.W.walkPx(x, y) && CG.W.walkPx(x - 8, y) && CG.W.walkPx(x + 8, y)) { but = { x, y }; break; } }
    if (!but) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas de place devant toi', '#9fd0ff'); return false; }
    const x0 = p.x, y0 = p.y;
    R.tpFx = { x0, y0, x1: but.x, y1: but.y, t: 0 };
    G.puff(x0, y0 - 20, '#9fd0ff', 22, 150, 4); R.rings.push({ x: x0, y: y0 - 10, r: 46, life: 0.35, col: '#9fd0ff' });
    p.x = but.x; p.y = but.y; p.path = null; R.build = null; if (G.unstick) G.unstick(p, 9); R.invuln = Math.max(R.invuln || 0, 0.35);
    G.puff(p.x, p.y - 20, '#ffffff', 26, 180, 4); R.rings.push({ x: p.x, y: p.y - 10, r: 70, life: 0.45, col: '#ffffff' }); CG.sfx('zap');
    return true;
  }
  So.cout = lvl => So.RES.base + So.RES.parNiveau * (lvl || 1);

  // ---------- le cimetière du clan : on garde ceux qui tombent, pour pouvoir les ramener ----------
  const GARDE = ['hat', 'hats', 'lazy', 'cls', 'fun', 'look', 'nomme', 'apt', 'weak', 'jobs', 'ami', 'child', 'met', 'perso', 'bio', 'talent', 'id', 'name', 'sex', 'job', 'lvl', 'xp', 'hue', 'lum', 'equip', 'outil', 'coiffe'];
  const hg = G.hurtGoblin;
  G.hurtGoblin = function (g) {
    const r = hg.apply(this, arguments);
    if (g && g.dead && !g.auCimetiere) { g.auCimetiere = true; const S = CG.S, c = {}; GARDE.forEach(k => { if (g[k] !== undefined) c[k] = g[k]; }); c.jour = S.day; (S.morts || (S.morts = [])).push(c); if (S.morts.length > So.RES.garde) S.morts.shift(); }
    return r;
  };
  function relever(c) { // un gobelin revient : même nom, même métier, mêmes niveaux
    const S = CG.S, R = CG.R, p = S.player, g = Object.assign({}, c); delete g.jour;
    const huts = S.buildings.map((b, i) => (b.type === 'hut' && !b.site ? i : -1)).filter(i => i >= 0), load = i => S.goblins.filter(o => o.home === i).length;
    if (!huts.length) huts.push(S.buildings.findIndex(b => b.type === 'chief')); huts.sort((a, b) => load(a) - load(b)); g.home = huts[0];
    g.equip = g.equip || {}; g.jobs = g.jobs || {}; g.x = p.x + 44 * (p.face || 1); g.y = p.y + 6; if (!CG.W.walkPx(g.x, g.y)) { g.x = p.x; g.y = p.y + 20; }
    S.goblins.push(g); G.resetGoblin(g); g.hp = Math.max(1, Math.round(G.gobMaxHp(g) * 0.5)); if (G.unstick) G.unstick(g, 8);
    S.morts.splice(S.morts.indexOf(c), 1); S.morale = Math.min(100, S.morale + 5); g.emoteT = 3; return g;
  }
  function lumiere(x, y, nom) {
    const R = CG.R; (R.resFx = R.resFx || []).push({ x, y, t: 0 }); CG.sfx('discovery'); CG.sfx('heal');
    for (let i = 0; i < 3; i++) R.rings.push({ x, y: y - 10, r: 70 + i * 60, life: 0.5 + i * 0.2, col: i % 2 ? '#ffffff' : '#fff3b0' });
    G.puff(x, y - 20, '#fff3b0', 30, 200, 5); G.text(x, y - 84, '🕊️ ' + nom + ' revient parmi nous !', '#fff8d8', true);
    CG.S.goblins.forEach(o => { if (!o.hidden && Math.hypot(o.x - x, o.y - y) < 420) o.emoteT = 2.5; });
  }
  So.relever = relever; So.lumiere = lumiere; /* pour les pierres tombales (tombes.js) */
  function choisir() {
    const S = CG.S, R = CG.R, p = S.player, opts = [];
    (S.morts || []).slice().reverse().forEach(c => { const cout = So.cout(c.lvl), job = CG.JOBS[c.job] || CG.JOBS.aucun, plein = S.goblins.length >= G.capacity();
      opts.push({ label: '☠ ' + c.name + ' — ' + (c.sex === 'f' && job.nomF ? job.nomF : job.nom) + ' niv. ' + c.lvl, sub: plein ? 'Plus de place dans les huttes' : p.mp < cout ? 'Il te faut ' + cout + ' mana (tu en as ' + Math.floor(p.mp) + ')' : cout + ' mana · tombé au jour ' + c.jour, disabled: plein || p.mp < cout,
        fn: () => { if (p.mp < cout) return; p.mp -= cout; R.castCd = 0.8; R.castAnim = 1; const g = relever(c); lumiere(g.x, g.y, g.name); if (G.say) G.say(g, CG.pick(['Hein ? J\'ai dormi longtemps ?', 'J\'ai vu une grande lumière... et un buffet !', 'Chef ! Tu es venu me chercher !', 'Aïe. Tout est à sa place ? ... Oui. Ouf.', 'Là-bas, c\'était calme. Trop calme. Merci, chef.']), 4, 1.2); } }); });
    S.pets.filter(a => a.ko && !a.tombe && !a.enSoin).forEach(a => { /* pas ceux qui sont seulement assommés ou déjà chez le guérisseur (relever.js) */ const cout = So.cout(a.lvl), K = CG.P.KINDS[a.kind];
      opts.push({ label: (K.icon || '🐾') + ' ' + a.name + ' — ' + (a.evo ? K.evo : K.nom) + ' niv. ' + a.lvl, sub: p.mp < cout ? 'Il te faut ' + cout + ' mana (tu en as ' + Math.floor(p.mp) + ')' : cout + ' mana · mort', disabled: p.mp < cout,
        fn: () => { if (p.mp < cout) return; p.mp -= cout; R.castCd = 0.8; R.castAnim = 1; a.ko = false; a.hp = CG.P.maxHp(a); lumiere(a.x, a.y, a.name); } }); });
    if (!opts.length) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Personne à ramener', '#fff3b0'); return; }
    opts.push({ label: 'Pas maintenant', fn: () => { } });
    CG.UI.dialog({ who: 'Résurrection', tag: '🕊️', text: 'Qui veux-tu ramener parmi nous ? Tu as ' + Math.floor(p.mp) + ' mana.', options: opts });
  }

  // ---------- lancer ----------
  const cast0 = G.cast;
  G.cast = function (id) {
    if (id !== 'electro' && id !== 'verglas' && id !== 'resurrection' && id !== 'teleport') return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player;
    if (id === 'teleport') { if (!pret(id)) return; if (!teleporter()) return; p.mp -= G.spellCost(id); R.castCd = 0.35; R.castAnim = 1; return; } // rien n'est dépensé s'il n'y a pas de place
    if (id === 'resurrection') { if (R.castCd > 0 || R.ko > 0 || R.cine) return; return choisir(); } // le mana se paie au moment du choix
    if (!pret(id)) return; p.mp -= G.spellCost(id); R.castCd = 0.45; R.castAnim = 1;
    if (id === 'electro') {
      R.electro = So.ELEC.dur; R.electroT = 0; CG.sfx('zap'); R.rings.push({ x: p.x, y: p.y - 10, r: So.ELEC.rayon + 30, life: 0.45, col: '#7ad0ff' }); G.puff(p.x, p.y - 24, '#cfeaff', 24, 170, 3); G.text(p.x, p.y - 78, '🌩️ Électrification !', '#cfeaff', true);
    } else {
      const tg = G.nearestEnemy(p.x, p.y, 320), x = tg ? tg.x : p.x + (R.dir ? R.dir.x : p.face) * 140, y = tg ? tg.y : p.y + (R.dir ? R.dir.y : 0) * 140;
      (R.verglas = R.verglas || []).push({ x, y, t: So.GLACE.dur, seed: Math.random() * 9 }); CG.sfx('spell');
      R.bolts.push({ x1: p.x, y1: p.y - 26, x2: x, y2: y, life: 0.25 }); R.rings.push({ x, y, r: So.GLACE.rayon, life: 0.5, col: '#a8e4ff' }); G.puff(x, y - 6, '#e0f6ff', 26, 190, 4); G.text(x, y - 60, '🧊 Verglas !', '#d8f4ff', true);
    }
  };
  // celui qui frappe le chef électrifié prend une décharge
  const hp0 = G.hurtPlayer;
  G.hurtPlayer = function (dmg) {
    const R = CG.R, p = CG.S.player;
    if (R.electro > 0 && !R.feuSrc) { let e = null, bd = 70; for (const o of R.enemies) { if (o.dead || o.struct) continue; const d = d2(o, p); if (d < bd + o.r) { bd = d; e = o; } } if (e) { R.bolts.push({ x1: p.x, y1: p.y - 26, x2: e.x, y2: e.y - 18, life: 0.2 }); e.rooted = Math.max(e.rooted || 0, 0.6); G.hurtEnemy(e, So.ELEC.riposte * mul(), p); } }
    return hp0.apply(this, arguments);
  };
  const up0 = G.update;
  G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; const p = S.player;
    if (R.electro > 0) { R.electro -= dt; R.electroT -= dt;
      if (R.electroT <= 0 && R.ko <= 0) { R.electroT = So.ELEC.tick; let n = 0; for (const e of R.enemies.slice()) { if (e.dead || e.struct || e.charm > 0 || d2(e, p) > So.ELEC.rayon + e.r) continue; R.bolts.push({ x1: p.x, y1: p.y - 26, x2: e.x, y2: e.y - 18, life: 0.16 }); G.hurtEnemy(e, So.ELEC.dmg * mul(), p); n++; } if (n && CG.onScreen(p.x, p.y)) CG.sfx('zap'); } }
    const V = R.verglas; if (V && V.length) { for (const z of V) z.t -= dt; R.verglas = V.filter(z => z.t > 0);
      for (const e of R.enemies) { if (e.dead || e.struct) continue; let dessus = false; for (const z of V) if (Math.hypot(e.x - z.x, (e.y - z.y) / 0.6) < So.GLACE.rayon) { dessus = true; break; } e.verglas = dessus ? 0.25 : Math.max(0, (e.verglas || 0) - dt); } }
    else for (const e of R.enemies) if (e.verglas > 0) e.verglas -= dt;
    if (R.tpFx) { R.tpFx.t += dt; if (R.tpFx.t > 0.45) R.tpFx = null; }
    if (R.resFx) { for (const f of R.resFx) f.t += dt; R.resFx = R.resFx.filter(f => f.t < 2.2); }
    for (const e of R.enemies) if (e.racines && !(e.rooted > 0)) e.racines = false;
  };

  // ---------- dessin ----------
  // un éclair brisé entre deux points
  function eclair(g, x1, y1, x2, y2, s, w) { g.beginPath(); g.moveTo(x1, y1); const n = 4; for (let i = 1; i < n; i++) { const k = i / n, nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny) || 1, o = (Math.sin(s * 12.9 + i * 78.2) * 43758.5 % 1) * 2 * w; g.lineTo(x1 + (x2 - x1) * k + nx / L * o, y1 + (y2 - y1) * k + ny / L * o); } g.lineTo(x2, y2); g.stroke(); }
  function electroDessin(g, t) {
    const R = CG.R; if (!(R.electro > 0) || R.ko > 0) return; const p = CG.S.player, a = Math.min(1, R.electro / 1.5), cx = p.x, cy = p.y - 26, q = Math.floor(t * 14);
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    const au = g.createRadialGradient(cx, cy, 4, cx, cy, 46); au.addColorStop(0, 'rgba(160,220,255,' + 0.34 * a + ')'); au.addColorStop(1, 'rgba(80,150,255,0)'); g.fillStyle = au; g.beginPath(); g.ellipse(cx, cy, 40, 48, 0, 0, TAU); g.fill();
    g.shadowColor = '#5ab4ff'; g.shadowBlur = 10; g.globalAlpha = a;
    // des arcs qui courent sur le corps
    for (let i = 0; i < 5; i++) { const s = q * 1.37 + i * 5.1, a1 = (Math.sin(s * 3.1) * 43758.5 % 1) * TAU, a2 = a1 + 1.2 + (i % 3) * 0.7, r1 = 15 + (i % 2) * 5, r2 = 17 + ((i + 1) % 3) * 4; g.strokeStyle = i % 2 ? '#ffffff' : '#9fdcff'; g.lineWidth = i % 2 ? 1.6 : 2.4; eclair(g, cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1 * 1.5, cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2 * 1.5, s, 7); }
    // de petits éclairs qui jaillissent vers l'extérieur
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 1.4; for (let i = 0; i < 6; i++) { const s = q * 2.3 + i * 9.7, an = (Math.sin(s) * 43758.5 % 1) * TAU, r0 = 20, r1 = 34 + (i % 3) * 8; eclair(g, cx + Math.cos(an) * r0, cy + Math.sin(an) * r0 * 1.4, cx + Math.cos(an) * r1, cy + Math.sin(an) * r1 * 1.4, s, 5); }
    g.shadowBlur = 0; g.strokeStyle = 'rgba(150,210,255,' + 0.7 * a + ')'; g.lineWidth = 2; g.setLineDash([5, 8]); g.lineDashOffset = -t * 60; g.beginPath(); g.ellipse(p.x, p.y + 2, So.ELEC.rayon, So.ELEC.rayon * 0.42, 0, 0, TAU); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { const u = (t * 1.6 + i / 4) % 1; g.globalAlpha = a * (1 - u); g.beginPath(); g.arc(p.x + Math.sin(i * 2.4 + q) * 20, p.y - 4 - u * 56, 1.8, 0, TAU); g.fill(); }
    g.restore();
  }
  function verglasDessin(g, t) {
    const V = CG.R.verglas; if (!V) return;
    for (const z of V) { if (!CG.onScreen(z.x, z.y)) continue; const a = Math.min(1, z.t / 1.5, (So.GLACE.dur - z.t) / 0.4), R0 = So.GLACE.rayon * Math.min(1, (So.GLACE.dur - z.t) / 0.4 + 0.2);
      g.save(); g.globalAlpha = a; g.translate(z.x, z.y);
      const bord = k => { g.beginPath(); for (let i = 0; i <= 24; i++) { const an = i / 24 * TAU, r = R0 * k * (1 + Math.sin(an * 3 + z.seed) * 0.08 + Math.sin(an * 7 + z.seed * 2) * 0.05); g[i ? 'lineTo' : 'moveTo'](Math.cos(an) * r, Math.sin(an) * r * 0.6); } g.closePath(); };
      bord(1.04); g.fillStyle = 'rgba(235,250,255,0.55)'; g.fill();                       // le givre du bord
      const gr = g.createRadialGradient(-R0 * 0.25, -R0 * 0.2, 6, 0, 0, R0); gr.addColorStop(0, 'rgba(230,248,255,0.92)'); gr.addColorStop(0.6, 'rgba(150,215,245,0.82)'); gr.addColorStop(1, 'rgba(90,170,225,0.75)'); bord(1); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2; g.stroke();
      g.save(); bord(1); g.clip();
      g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 5; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { const x = -R0 * 0.6 + i * R0 * 0.38 + Math.sin(z.seed + i) * 8; g.beginPath(); g.moveTo(x, -R0 * 0.3); g.lineTo(x + R0 * 0.22, -R0 * 0.3 - R0 * 0.14); g.stroke(); } // reflets
      g.strokeStyle = 'rgba(60,130,190,0.55)'; g.lineWidth = 1.3; for (let i = 0; i < 5; i++) { const an = z.seed * 3 + i * 1.3, r = R0 * 0.75; g.beginPath(); g.moveTo(Math.cos(an) * 8, Math.sin(an) * 5); g.lineTo(Math.cos(an + 0.2) * r * 0.5, Math.sin(an + 0.2) * r * 0.3); g.lineTo(Math.cos(an - 0.1) * r, Math.sin(an - 0.1) * r * 0.6); g.stroke(); } // fissures
      g.restore();
      g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const u = (t * 0.7 + i / 6 + z.seed) % 1, an = i * 2.4 + z.seed; g.globalAlpha = a * Math.sin(u * Math.PI); const x = Math.cos(an) * R0 * 0.7, y = Math.sin(an) * R0 * 0.4; g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 1.6, y - 1.6); g.lineTo(x + 5, y); g.lineTo(x + 1.6, y + 1.6); g.lineTo(x, y + 5); g.lineTo(x - 1.6, y + 1.6); g.lineTo(x - 5, y); g.lineTo(x - 1.6, y - 1.6); g.closePath(); g.fill(); } // étincelles de givre
      g.restore(); }
  }
  function resDessin(g, t) {
    const F = CG.R.resFx; if (!F) return;
    for (const f of F) { const k = Math.min(1, f.t / 0.3, (2.2 - f.t) / 0.8); if (k <= 0) continue;
      g.save(); g.globalCompositeOperation = 'lighter';
      const w = 34 + Math.sin(f.t * 10) * 5, col = g.createLinearGradient(f.x - w, 0, f.x + w, 0); col.addColorStop(0, 'rgba(255,240,170,0)'); col.addColorStop(0.5, 'rgba(255,250,215,' + 0.7 * k + ')'); col.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = col; g.fillRect(f.x - w, f.y - 900, w * 2, 904);
      g.translate(f.x, f.y - 30); g.rotate(f.t * 0.9); for (let i = 0; i < 10; i++) { g.rotate(TAU / 10); g.fillStyle = 'rgba(255,235,150,' + (i % 2 ? 0.22 : 0.12) * k + ')'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-12, -150); g.lineTo(12, -150); g.closePath(); g.fill(); }
      g.restore();
      g.save(); g.globalAlpha = k; g.strokeStyle = '#fff3b0'; g.lineWidth = 3; g.beginPath(); g.ellipse(f.x, f.y - 66 - f.t * 6, 13, 4.5, 0, 0, TAU); g.stroke(); // une petite auréole qui s'envole
      g.font = '15px sans-serif'; g.textAlign = 'center'; for (let i = 0; i < 4; i++) { const u = (f.t * 0.6 + i / 4) % 1; g.globalAlpha = k * (1 - u); g.fillText('🪶', f.x + Math.sin(i * 2 + f.t * 2) * 30, f.y - 20 - u * 90); }
      g.restore(); }
  }
  // la traînée de la téléportation : un trait de lumière et des silhouettes qui s'effacent entre le départ et l'arrivée
  function tpDessin(g) {
    const f = CG.R.tpFx; if (!f) return; const k = 1 - f.t / 0.45;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    g.strokeStyle = 'rgba(160,210,255,' + 0.55 * k + ')'; g.lineWidth = 14 * k + 2; g.beginPath(); g.moveTo(f.x0, f.y0 - 22); g.lineTo(f.x1, f.y1 - 22); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,' + 0.9 * k + ')'; g.lineWidth = 3 * k + 1; g.beginPath(); g.moveTo(f.x0, f.y0 - 22); g.lineTo(f.x1, f.y1 - 22); g.stroke();
    for (let i = 0; i < 5; i++) { const u = i / 5, x = f.x0 + (f.x1 - f.x0) * u, y = f.y0 + (f.y1 - f.y0) * u; g.fillStyle = 'rgba(140,200,255,' + 0.3 * k * (0.4 + u) + ')'; g.beginPath(); g.ellipse(x, y - 22, 11, 22, 0, 0, TAU); g.fill(); }
    g.restore();
  }
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (g, t) { gr0.apply(this, arguments); verglasDessin(g, t); };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); electroDessin(g, t); resDessin(g, t); tpDessin(g); };
  if (CG.Effets) Object.assign(CG.Effets.FICHE, { electro: ['⚔️', So.ELEC.dmg * 2, '{n} dégâts par seconde autour de toi, 15 s'], verglas: ['🧊', null, 'Ennemis 3 fois plus lents dessus, 14 s'], resurrection: ['💧', null, '30 mana + 10 par niveau du compagnon'], teleport: ['💫', null, '4 à 5 cases droit devant'] });
})(window.CG);
