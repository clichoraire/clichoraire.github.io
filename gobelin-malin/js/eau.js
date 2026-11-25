// Goblin Malin — la magie de l'eau.
//   Cinq sorts d'attaque, du 1er au 8e cercle : le Jet d'eau, la Vague, le Geyser, la Trombe d'eau et le Raz-de-marée.
//   Ils frappent un peu plus fort que les sorts de feu du même cercle, mais il leur faut de l'EAU, en plus du mana :
//     - un lac, une rivière ou des douves à moins de PRES cases du chef : l'eau sort de là, vole jusqu'à lui, et le sort part. Rien n'est dépensé ;
//     - sinon, une gourde dans le sac : chaque sort y boit ses gouttes (de 1 pour le Jet d'eau à 5 pour le Raz-de-marée).
//   Près de l'eau, c'est toujours le lac qui sert, jamais la gourde.
//   L'eau fait le double de dégâts aux monstres de feu (FORT), la moitié à ceux qui vivent dans l'eau (FAIBLE), et comme d'habitude aux autres.
//   Les gourdes : trois tailles (50, 200 et 1000 gouttes), chez les marchands. On les remplit au bord de l'eau (E).
//   Elles ne comptent que dans le sac du chef : rangées dans le coffre, elles ne servent pas.
// Tout se règle dans CG.Eau.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, M = CG.Magie, Bq = CG.Banque, Iv = CG.Inventaire, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand;
  if (!G || !W || !M) return;
  const Ea = CG.Eau = {
    PRES: 6, /* à combien de cases un lac peut servir */ BORD: 1.7, /* à combien de cases on peut remplir sa gourde */
    FORT: 2, FAIBLE: 0.5, /* contre les monstres de feu, contre les monstres d'eau */
    APPEL: 0.28, APPEL_GOURDE: 0.14, /* le temps que l'eau met à venir jusqu'au chef, depuis un lac ou depuis sa gourde */
    COL: '#4ab0ff', DMG: '#7fd0ff', K: 'gourde',
    GOURDES: [null, { nom: 'Petite gourde', cap: 50, prix: 1500 }, { nom: 'Grande gourde', cap: 200, prix: 6000 }, { nom: 'Outre du maître des eaux', cap: 1000, prix: 20000 }],
    VEND: [null, ['nain', 'sorciere', 'elfe', 'lapin'], ['sorciere', 'elfe', 'demonMarchand', 'tisseuse'], ['elfe', 'tisseuse']], /* qui vend chaque taille (« tisseuse » : Ilwen, au village des elfes) */
    FEUX: { follet: 1, folletRouge: 1, planteFeu: 1, craneRouge: 1, mageSoleil: 1 }, /* les monstres de feu, en plus de tous les démons */
    S: { /* eau : les gouttes que boit le sort ; dmg : ses dégâts au niveau 1 du chef */
      eauJet: { nom: 'Jet d\'eau', icon: '💦', mp: 3, prix: 30, eau: 1, dmg: 8, vit: 470, portee: 520, fiche: '',
        court: 'Un petit jet d\'eau qui file tout droit.', desc: 'Pschitt ! Un petit jet d\'eau file tout droit et arrose le premier ennemi qu\'il touche.' },
      eauVague: { nom: 'Vague', icon: '🌊', mp: 8, prix: 70, eau: 2, dmg: 24, long: 300, large: 52, vit: 400, fiche: ', à tous ceux qu\'elle emporte',
        court: 'Une vague qui roule et emporte les ennemis.', desc: 'Une vague roule devant toi : elle trempe tous les ennemis sur son chemin et les fait reculer.' },
      eauGeyser: { nom: 'Geyser', icon: '⛲', mp: 12, prix: 100, eau: 3, dmg: 36, r: 74, sonne: 1.4, delai: 0.4, fiche: ', et les ennemis restent sonnés',
        court: 'L\'eau jaillit du sol sous les pieds de l\'ennemi.', desc: 'Glou, glou… PCHHH ! L\'eau jaillit du sol sous les pieds de l\'ennemi le plus proche. Ceux qui sont dessus s\'envolent et retombent tout sonnés.' },
      eauTrombe: { nom: 'Trombe d\'eau', icon: '🌧️', mp: 18, prix: 160, eau: 4, dmg: 56, r: 116, lent: 4.5, delai: 0.75, fiche: ', grande éclaboussure, ralentit',
        court: 'Une montagne d\'eau tombe du ciel. SPLASH !', desc: 'Une montagne d\'eau tombe du ciel. SPLASH ! Tous les ennemis dessous sont trempés jusqu\'aux os et avancent au ralenti.' },
      eauRaz: { nom: 'Raz-de-marée', icon: '🔱', mp: 26, prix: 220, eau: 5, dmg: 90, r: 250, dur: 0.6, fiche: ', tout autour de toi',
        court: 'Une vague géante part de toi et balaie tout.', desc: 'Une vague géante part de toi dans tous les sens et balaie tout ! Les ennemis sont emportés très loin.' }
    }
  };
  const BESOIN = ' L\'eau fait très mal aux monstres de feu, mais presque rien à ceux qui vivent dans l\'eau. Il te faut de l\'eau : un lac ou une rivière tout près, sinon une gourde pleine.';
  Object.keys(Ea.S).forEach(id => { const q = Ea.S[id];
    CG.SPELLS[id] = { nom: q.nom, icon: q.icon, mp: q.mp, prix: q.prix, color: Ea.COL, desc: q.desc + BESOIN, court: q.court };
    if (!CG.SCROLL_POOL.includes(id)) CG.SCROLL_POOL.push(id);
    if (CG.Effets && CG.Effets.FICHE) CG.Effets.FICHE[id] = ['⚔️', q.dmg, '{n} dégâts' + q.fiche + ' · ' + q.eau + ' goutte' + (q.eau > 1 ? 's' : '') + ' d\'eau']; });

  // ---------- qui craint l'eau, qui s'en moque ----------
  Ea.feu = e => { const d = e && CG.ENEMIES[e.type]; return !!d && (d.race === 'demon' || !!Ea.FEUX[e.type] || /feu|braise|flamme|lave|magma|ardent/i.test(d.nom || '')); };
  Ea.marin = e => { const d = e && CG.ENEMIES[e.type]; return !!d && (CG.Elements && CG.Elements.marin ? CG.Elements.marin(e) : /m[ée]duse|crabe|mur[èe]ne|pieuvre|alligator|des eaux|englouti/i.test(d.nom || '')); };
  Ea.contre = e => (Ea.feu(e) ? Ea.FORT : Ea.marin(e) ? Ea.FAIBLE : 1);
  function frapper(e, dmg) { const R = CG.R, k = Ea.contre(e), col = R.dmgCol; R.dmgCol = Ea.DMG; try { G.hurtEnemy(e, dmg * k, CG.S.player); } finally { R.dmgCol = col; }
    if (k !== 1 && CG.onScreen(e.x, e.y) && !(e.eauDit > R.t)) { e.eauDit = R.t + 1.5; G.text(e.x, e.y - 62, k > 1 ? '💧 Pschhh ! Ça éteint !' : '💧 Même pas mouillé…', k > 1 ? '#bfe8ff' : '#9ab6c8'); } }
  const pousser = (e, dx, dy, v) => { if (e.dead || e.struct) return; const f = CG.ENEMIES[e.type] && CG.ENEMIES[e.type].boss ? 0.4 : 1; e.kb = { vx: dx * v * f, vy: dy * v * f, t: 0.3 }; e.path = null; e.calm = false; };

  // ---------- où est l'eau ----------
  const joueur = () => CG.S && CG.S.player;
  const sousEau = () => !!(CG.GrotteNid && CG.GrotteNid.mode && CG.GrotteNid.mode() === 'eau'); /* dans le temple englouti, l'eau est partout */
  const estEau = (tx, ty) => { if (!W.inMap(tx, ty)) return false; const t = W.tile[W.idx(tx, ty)]; return t === W.WATER || t === W.MOAT || t === W.BRIDGE; };
  let memo = null;
  // la case d'eau la plus proche du chef, à « rayon » cases au plus (PRES si on ne dit rien) : { x, y } en pixels, ou null
  Ea.pres = function (rayon) {
    const p = joueur(), R = CG.R; if (!p || !R || !W.tile) return null; if (sousEau()) return { x: p.x, y: p.y - 20, partout: true };
    const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
    if (!memo || memo.tx !== tx || memo.ty !== ty || memo.tile !== W.tile || !(R.t >= memo.t0 && R.t < memo.t0 + 1)) { const n = Math.ceil(Ea.PRES) + 1; let b = null, bd = 1e9;
      for (let dy = -n; dy <= n; dy++) for (let dx = -n; dx <= n; dx++) { if (!estEau(tx + dx, ty + dy)) continue; const x = (tx + dx + 0.5) * T, y = (ty + dy + 0.5) * T, d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; b = { x, y }; } }
      memo = { tx, ty, tile: W.tile, t0: R.t, b }; }
    const b = memo.b; return b && Math.hypot(b.x - p.x, b.y - p.y) <= (rayon || Ea.PRES) * T ? b : null;
  };

  // ---------- les gourdes ----------
  const cap = it => (Ea.GOURDES[it.n] || Ea.GOURDES[1]).cap, dans = it => Math.max(0, Math.min(cap(it), Math.floor(it.eau || 0)));
  Ea.gourdes = () => { const p = joueur(); return p && Array.isArray(p.sac) ? p.sac.filter(it => it && it.k === Ea.K) : []; };
  Ea.total = () => Ea.gourdes().reduce((n, it) => n + dans(it), 0);
  Ea.place = () => Ea.gourdes().reduce((n, it) => n + cap(it), 0);
  Ea.prendre = function (n) { for (const it of Ea.gourdes().sort((a, b) => a.n - b.n)) { const k = Math.min(n, dans(it)); it.eau = dans(it) - k; n -= k; if (n <= 0) break; } }; /* la plus petite gourde d'abord */
  Ea.donner = (n, pleine) => { if (!Bq) return null; const z = Bq.deposer(Ea.K, Math.max(1, Math.min(3, n || 1)), 1, 'sac'); if (pleine) Ea.gourdes().forEach(it => { it.eau = cap(it); }); return z; };
  Ea.remplir = function () {
    const S = CG.S, R = CG.R, p = S.player, lac = Ea.pres(Ea.BORD), gs = Ea.gourdes(); if (!lac || !gs.length) return false;
    const avant = Ea.total(); gs.forEach(it => { it.eau = cap(it); }); const n = Ea.total() - avant; if (n <= 0) return false;
    R.eauPlein = { t: 0.5, max: 0.5, lac }; CG.sfx('heal'); G.text(p.x, p.y - 58, '+' + n + ' 💧', '#bfe8ff', true); G.puff(lac.x, lac.y, '#bfe8ff', 12, 110, 4);
    if (UI && UI.toast) UI.toast('🏺 ' + (gs.length > 1 ? 'Tes gourdes sont pleines' : 'Ta gourde est pleine') + ' : ' + Ea.total() + ' gouttes d\'eau pour ta magie.');
    return true;
  };
  if (Bq && Iv) {
    Bq.NOMS[Ea.K] = Ea.GOURDES.map(q => (q ? q.nom : '')); Bq.IC[Ea.K] = '🏺';
    if (CG.Objets && CG.Objets.PHRASE) CG.Objets.PHRASE[Ea.K] = 'Elle garde de l\'eau pour ta magie, quand il n\'y a ni lac ni rivière. Garde-la dans ton sac, et remplis-la au bord de l\'eau.';
    const e0 = Bq.effet; Bq.effet = function (k, n) { return k === Ea.K ? 'Garde ' + (Ea.GOURDES[n] || Ea.GOURDES[1]).cap + ' gouttes d\'eau' : e0.apply(this, arguments); };
    const i0 = Iv.effet; Iv.effet = function (it) { return it && it.k === Ea.K ? dans(it) + ' / ' + cap(it) + ' gouttes d\'eau' : i0.apply(this, arguments); };
  }
  // au bord de l'eau, avec une gourde pas pleine : E la remplit (seulement s'il n'y a rien d'autre à faire ici)
  if (D && D.findInteract && D.interact) {
    const fi0 = D.findInteract; D.findInteract = function () { const it = fi0.apply(this, arguments), R = CG.R, S = CG.S; if (it || !R || !S || R.ko > 0 || R.cine || R.build) return it;
      const gs = Ea.gourdes(); if (!gs.length || Ea.total() >= Ea.place()) return it; const lac = Ea.pres(Ea.BORD); return lac ? { type: 'gourde', obj: lac, label: (gs.length > 1 ? 'Remplir tes gourdes' : 'Remplir ta gourde') + ' 💧' } : it; };
    const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'gourde') return Ea.remplir(); return in0.apply(this, arguments); };
  }
  // chez les marchands
  Ea.article = n => { const q = Ea.GOURDES[n]; return { gourde: n, icon: '🏺', label: q.nom, desc: 'Garde ' + q.cap + ' gouttes d\'eau pour ta magie de l\'eau, quand il n\'y a ni lac ni rivière. Tu la remplis au bord de l\'eau.', prix: q.prix, stock: 1,
    buy: () => { const z = Ea.donner(n); if (UI && UI.toast) UI.toast('🏺 ' + q.nom + ' : ' + (Iv && Iv.ou ? Iv.ou(z) : 'dans ton sac') + '. Elle est vide : remplis-la au bord de l\'eau (E).'); } }; };
  if (UI && UI.shop && Bq && Iv) { const sh0 = UI.shop; UI.shop = function (v) {
    try { if (v && Array.isArray(v.shop) && !v.gourdeVu) { v.gourdeVu = true; [1, 2, 3].forEach(n => { if (Ea.VEND[n].includes(v.role) || Ea.VEND[n].includes(v.quoi)) v.shop.push(Ea.article(n)); }); } } catch (e) { /* jamais bloquant */ }
    return sh0.apply(this, arguments); }; }

  // ---------- lancer ----------
  const mul = () => { const p = joueur(); return (1 + 0.12 * (p.lvl - 1)) * (G.tech('s4') ? 1.25 : 1); };
  const rate = txt => { const p = joueur(); CG.sfx('no'); G.text(p.x, p.y - 56, txt, '#9ab6ff'); };
  const cast0 = G.cast; G.cast = function (id) {
    const q = Ea.S[id]; if (!q) return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.castCd > 0 || R.ko > 0 || R.cine || R.night || R.eauAppel) return;
    const cost = G.spellCost(id); if (p.mp < cost) return rate('Pas assez de mana');
    const lac = Ea.pres(); // près de l'eau, c'est elle qui sert : la gourde reste pleine
    if (!lac && Ea.total() < q.eau) return rate(!Ea.gourdes().length ? 'Pas d\'eau près d\'ici !' : Ea.total() > 0 ? 'Plus assez d\'eau dans ta gourde' : 'Ta gourde est vide !');
    if (!lac) Ea.prendre(q.eau);
    const d = lac ? Ea.APPEL : Ea.APPEL_GOURDE; p.mp -= cost; R.castCd = 0.45 + d; R.castAnim = 1; CG.sfx('spell'); if (M.reveal && R.invis > 0) M.reveal();
    const tg = G.nearestEnemy(p.x, p.y, 420); if (tg && Math.abs(tg.x - p.x) > 4) p.face = tg.x > p.x ? 1 : -1;
    R.eauAppel = { id, t: d, max: d, lac };
    if (lac && !lac.partout) { G.puff(lac.x, lac.y, '#bfe8ff', 10, 120, 4); R.rings.push({ x: lac.x, y: lac.y, r: 26, life: 0.35, col: '#bfe8ff' }); }
  };
  // l'eau est arrivée dans la main du chef : le sort part
  function partir(id) {
    const S = CG.S, R = CG.R, p = S.player, q = Ea.S[id], m = mul(), L = R.eaux || (R.eaux = []), ennemi = G.nearestEnemy(p.x, p.y, q.portee || 420), braise = !ennemi && CG.Braises ? CG.Braises.proche(p.x, p.y, q.portee || 420) : null, tg = ennemi || (braise ? { x: braise.x, y: braise.y + 10 } : null); /* personne à viser : un petit feu à éteindre (braises.js) */
    let dx = R.dir ? R.dir.x : 0, dy = R.dir ? R.dir.y : 0; if (tg) { dx = tg.x - p.x; dy = tg.y - p.y; } const l = Math.hypot(dx, dy); if (l) { dx /= l; dy /= l; } else { dx = p.face < 0 ? -1 : 1; dy = 0; }
    if (Math.abs(dx) > 0.1) p.face = dx > 0 ? 1 : -1;
    if (id === 'eauJet') { const sx = p.x + dx * 12, sy = p.y - 22; let vx = dx, vy = dy; if (tg) { const ax = tg.x - sx, ay = tg.y - 16 - sy, al = Math.hypot(ax, ay) || 1; vx = ax / al; vy = ay / al; }
      L.push({ k: 'jet', x: sx, y: sy, vx: vx * q.vit, vy: vy * q.vit, life: q.portee / q.vit, dmg: q.dmg * m }); }
    else if (id === 'eauVague') L.push({ k: 'vague', x0: p.x, y0: p.y, dx, dy, d: 12, fin: 0, dmg: q.dmg * m, hit: new Set() });
    else if (id === 'eauGeyser') L.push({ k: 'geyser', x: tg ? tg.x : p.x + dx * 130, y: tg ? tg.y : p.y + dy * 130, t: q.delai, age: 0, dmg: q.dmg * m });
    else if (id === 'eauTrombe') L.push({ k: 'trombe', x: tg ? tg.x : p.x + dx * 190, y: tg ? tg.y : p.y + dy * 190, t: q.delai, age: 0, dmg: q.dmg * m });
    else { L.push({ k: 'raz', x: p.x, y: p.y, age: 0, dmg: q.dmg * m, hit: new Set() }); R.shake = Math.max(R.shake || 0, 0.35); }
    CG.sfx(id === 'eauJet' ? 'swing' : 'fire');
  }
  const gouttes = (x, y, n, v, col) => { const R = CG.R; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = v * rand(0.4, 1); R.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7 - v * 0.35, life: 0.45, max: 0.45, col: col || (i % 3 ? '#9ad8ff' : '#ffffff'), size: rand(2.5, 4.5) }); } };
  const visibles = e => !e.dead && !(e.charm > 0);
  const arroser = (x, y, r) => (CG.Braises ? CG.Braises.arroser(x, y, r) : 0); /* les petits feux (braises.js) : l'eau les éteint */
  const up0 = G.update; G.update = function (dt) {
    const res = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !R.enemies || !R.parts) return res; const p = S.player;
    hudT -= dt; if (hudT <= 0) { hudT = 0.25; try { hud(); } catch (e) { /* jamais bloquant */ } }
    if (R.eauPlein) { R.eauPlein.t -= dt; if (R.eauPlein.t <= 0) R.eauPlein = null; }
    const a = R.eauAppel; if (a) { if (R.ko > 0) R.eauAppel = null; else { a.t -= dt; R.castAnim = Math.max(R.castAnim || 0, 0.6); if (a.t <= 0) { R.eauAppel = null; partir(a.id); } } }
    const L = R.eaux; if (!L || !L.length) return res;
    for (const o of L) {
      if (o.k === 'jet') { o.x += o.vx * dt; o.y += o.vy * dt; o.life -= dt; if (Math.random() < dt * 34) R.parts.push({ x: o.x, y: o.y, vx: rand(-16, 16), vy: rand(-10, 26), life: 0.3, max: 0.3, col: Math.random() < 0.4 ? '#ffffff' : '#9ad8ff', size: 2.6 });
        for (const e of R.enemies) if (visibles(e) && Math.hypot(e.x - o.x, e.y - 16 - o.y) < e.r + 9) { frapper(e, o.dmg); gouttes(o.x, o.y, 9, 120); o.life = 0; break; }
        if (o.life > 0 && arroser(o.x, o.y + 16, 15)) { gouttes(o.x, o.y, 9, 120); o.life = 0; }
        if (o.life <= 0) o.mort = true; }
      else if (o.k === 'vague') { const q = Ea.S.eauVague;
        if (o.fin > 0) { o.fin -= dt; if (o.fin <= 0) o.mort = true; continue; }
        o.d += q.vit * dt; const k = Math.min(1, o.d / q.long), w = 26 + (q.large - 26) * k; o.w = w;
        for (const e of R.enemies) { if (!visibles(e) || o.hit.has(e)) continue; const ex = e.x - o.x0, ey = e.y - o.y0, le = ex * o.dx + ey * o.dy, tr = Math.abs(ey * o.dx - ex * o.dy);
          if (le > o.d - 46 && le < o.d + 14 && tr < w + e.r) { o.hit.add(e); frapper(e, o.dmg); pousser(e, o.dx, o.dy, 330); gouttes(e.x, e.y - 14, 6, 110); } }
        arroser(o.x0 + o.dx * o.d, o.y0 + o.dy * o.d, w + 8);
        if (Math.random() < dt * 40) { const s = rand(-1, 1) * w; R.parts.push({ x: o.x0 + o.dx * o.d - o.dy * s, y: o.y0 + o.dy * o.d + o.dx * s - 6, vx: -o.dx * 40 + rand(-20, 20), vy: rand(-70, -20), life: 0.35, max: 0.35, col: '#ffffff', size: 3 }); }
        if (o.d >= q.long) o.fin = 0.25; }
      else if (o.k === 'geyser' || o.k === 'trombe') { const q = Ea.S[o.k === 'geyser' ? 'eauGeyser' : 'eauTrombe'];
        if (o.t > 0) { o.t -= dt; if (o.k === 'geyser' && Math.random() < dt * 22) R.parts.push({ x: o.x + rand(-18, 18), y: o.y + rand(-5, 5), vx: 0, vy: rand(-40, -15), life: 0.35, max: 0.35, col: '#dff4ff', size: 3, float: true });
          if (o.t <= 0) { arroser(o.x, o.y, q.r); R.rings.push({ x: o.x, y: o.y - 4, r: q.r, life: 0.45, col: '#bfe8ff' }); gouttes(o.x, o.y - 10, o.k === 'geyser' ? 18 : 34, o.k === 'geyser' ? 170 : 260); if (CG.onScreen(o.x, o.y)) { CG.sfx('fire'); if (o.k === 'trombe') R.shake = Math.max(R.shake || 0, 0.3); }
            for (const e of R.enemies) { if (!visibles(e) || Math.hypot(e.x - o.x, e.y - o.y) > q.r + e.r) continue; frapper(e, o.dmg); if (e.dead || e.struct) continue; const b = CG.ENEMIES[e.type] && CG.ENEMIES[e.type].boss;
              if (o.k === 'geyser') { const s = b ? q.sonne * 0.4 : q.sonne; e.daze = Math.max(e.daze || 0, s); e.rooted = Math.max(e.rooted || 0, s); e.etourdi = R.t + s; e.path = null; }
              else e.slow = Math.max(e.slow || 0, b ? q.lent * 0.5 : q.lent); } } }
        else { o.age += dt; if (o.age > 0.75) o.mort = true; } }
      else if (o.k === 'raz') { const q = Ea.S.eauRaz; o.age += dt; const r = o.r = 24 + (q.r - 24) * (1 - Math.pow(1 - Math.min(1, o.age / q.dur), 1.6));
        for (const e of R.enemies) { if (!visibles(e) || o.hit.has(e)) continue; const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy) || 1; if (d < r + e.r) { o.hit.add(e); frapper(e, o.dmg); pousser(e, dx / d, dy / d, 560); gouttes(e.x, e.y - 14, 5, 120); } }
        arroser(o.x, o.y, r);
        if (o.age < q.dur) for (let i = 0; i < 3; i++) { const an = Math.random() * TAU; R.parts.push({ x: o.x + Math.cos(an) * r, y: o.y + Math.sin(an) * r * 0.78 - 4, vx: Math.cos(an) * 60, vy: rand(-90, -30), life: 0.35, max: 0.35, col: i ? '#ffffff' : '#9ad8ff', size: 3.2 }); }
        if (o.age > q.dur + 0.3) o.mort = true; }
    }
    R.eaux = L.filter(o => !o.mort);
    return res;
  };

  // ---------- la petite ligne sous les potions : l'eau des gourdes, et le lac tout près ----------
  let hudT = 0, hudK = null;
  function hud() {
    const p = joueur(); if (!p) return; const gs = Ea.gourdes(), sait = (p.spells || []).some(id => Ea.S[id]), lac = (sait || gs.length) && Ea.pres() ? 1 : 0, k = gs.length + ':' + Ea.total() + ':' + Ea.place() + ':' + lac + ':' + (sait ? 1 : 0); if (k === hudK) return;
    let el = document.getElementById('eau-hud'); const base = document.getElementById('potions3') || document.getElementById('potions2') || document.getElementById('potions');
    if (!el && base) { el = document.createElement('div'); el.id = 'eau-hud'; el.style.cssText = 'font-size:13px;margin-top:3px;line-height:1.5;color:#cfeeff'; base.parentNode.insertBefore(el, base.nextSibling); } if (!el) return; hudK = k;
    const l = []; if (gs.length) l.push('🏺 <b>' + Ea.total() + '</b><small> / ' + Ea.place() + ' gouttes</small>'); if (lac && sait) l.push('🌊 <small>de l\'eau tout près</small>'); el.innerHTML = l.join(' · ');
  }

  // ---------- dessins ----------
  const ell = (g, x, y, rx, ry, f, rot) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); g.fill(); };
  // un filet d'eau qui vole de (x1, y1) à (x2, y2) : k va de 0 (il part) à 1 (il est arrivé)
  function filet(g, x1, y1, x2, y2, k, gros) {
    const d = Math.hypot(x2 - x1, y2 - y1), cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - Math.min(70, 16 + d * 0.3), pt = u => { const v = 1 - u; return [v * v * x1 + 2 * v * u * cx + u * u * x2, v * v * y1 + 2 * v * u * cy + u * u * y2]; };
    const u0 = Math.max(0, k * 1.5 - 0.5), u1 = Math.min(1, k * 1.5); if (u1 <= u0) return; g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    [['rgba(74,176,255,0.55)', 7 * gros], ['#7fd0ff', 4 * gros], ['#ffffff', 1.6 * gros]].forEach(c => { g.strokeStyle = c[0]; g.lineWidth = c[1]; g.beginPath(); for (let i = 0; i <= 10; i++) { const P = pt(u0 + (u1 - u0) * i / 10); i ? g.lineTo(P[0], P[1]) : g.moveTo(P[0], P[1]); } g.stroke(); });
    const P = pt(u1); ell(g, P[0], P[1], 4.4 * gros, 4.4 * gros, '#bfe8ff'); ell(g, P[0] - 1, P[1] - 1.2, 1.6 * gros, 1.6 * gros, '#ffffff'); g.restore();
  }
  function dessiner(g, t) {
    const S = CG.S, R = CG.R; if (!S || !R) return; const p = S.player, f = p.face < 0 ? -1 : 1, main = { x: p.x + f * 9, y: p.y - 30 }, ceinture = { x: p.x - f * 6, y: p.y - 13 };
    const a = R.eauAppel; if (a) { const k = 1 - a.t / a.max;
      if (a.lac && a.lac.partout) { g.save(); for (let i = 0; i < 7; i++) { const an = i / 7 * TAU + t * 5, r = (1 - k) * 46 + 5; g.globalAlpha = 0.5 + k * 0.5; ell(g, main.x + Math.cos(an) * r, main.y + Math.sin(an) * r * 0.7, 3.4, 3.4, i % 2 ? '#bfe8ff' : '#ffffff'); } g.restore(); }
      else if (a.lac) filet(g, a.lac.x, a.lac.y, main.x, main.y, k, 1); else filet(g, ceinture.x, ceinture.y, main.x, main.y, k, 0.7);
      g.save(); g.globalAlpha = 0.5 + k * 0.4; ell(g, main.x, main.y, 3 + k * 5, 3 + k * 5, 'rgba(127,208,255,0.8)'); ell(g, main.x - 1, main.y - 1, 1 + k * 2, 1 + k * 2, '#ffffff'); g.restore(); }
    const pl = R.eauPlein; if (pl) filet(g, pl.lac.x, pl.lac.y, ceinture.x, ceinture.y, 1 - pl.t / pl.max, 0.9);
    for (const o of R.eaux || []) {
      if (o.k === 'jet') { if (!CG.onScreen(o.x, o.y)) continue; g.save(); g.translate(o.x, o.y); g.rotate(Math.atan2(o.vy, o.vx));
        g.fillStyle = 'rgba(74,176,255,0.4)'; g.beginPath(); g.moveTo(4, -5); g.lineTo(-34, 0); g.lineTo(4, 5); g.closePath(); g.fill();
        g.fillStyle = '#4ab0ff'; g.beginPath(); g.moveTo(9, 0); g.quadraticCurveTo(4, -6.4, -6, -4.4); g.lineTo(-20, 0); g.lineTo(-6, 4.4); g.quadraticCurveTo(4, 6.4, 9, 0); g.fill();
        ell(g, 1, 0, 6.4, 3.2, '#9ad8ff'); ell(g, 3.4, -1.2, 2.6, 1.2, '#ffffff'); g.restore(); }
      else if (o.k === 'vague') { const x = o.x0 + o.dx * o.d, y = o.y0 + o.dy * o.d; if (!CG.onScreen(x, y)) continue; const w = o.w || 26, al = o.fin > 0 ? o.fin / 0.25 : Math.min(1, o.d / 40), on = Math.sin(t * 16) * 2;
        g.save(); g.translate(x, y - 8); g.rotate(Math.atan2(o.dy, o.dx)); g.globalAlpha = al;
        g.fillStyle = 'rgba(74,176,255,0.3)'; g.beginPath(); g.moveTo(-70, -w * 0.8); g.quadraticCurveTo(-20, 0, -70, w * 0.8); g.quadraticCurveTo(-36, 0, -70, -w * 0.8); g.fill(); // le sillage
        g.fillStyle = '#3a96e8'; g.beginPath(); g.moveTo(-22, -w); g.quadraticCurveTo(26 + on, 0, -22, w); g.quadraticCurveTo(-4, 0, -22, -w); g.fill();
        g.fillStyle = '#7fd0ff'; g.beginPath(); g.moveTo(-16, -w * 0.86); g.quadraticCurveTo(22 + on, 0, -16, w * 0.86); g.quadraticCurveTo(4, 0, -16, -w * 0.86); g.fill();
        g.strokeStyle = '#ffffff'; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-20, -w); g.quadraticCurveTo(28 + on, 0, -20, w); g.stroke(); // l'écume, sur la crête
        for (let i = 0; i < 5; i++) { const s = (i - 2) / 2.4, yy = s * w, xx = 8 - s * s * 20 + Math.sin(t * 20 + i * 2) * 3; ell(g, xx, yy, 3, 3, '#ffffff'); }
        g.restore(); }
      else if (o.k === 'geyser') { if (!CG.onScreen(o.x, o.y)) continue; const q = Ea.S.eauGeyser; g.save();
        if (o.t > 0) { const k = 1 - o.t / q.delai; g.globalAlpha = 0.35 + k * 0.4; ell(g, o.x, o.y + 2, q.r * 0.5 * k + 6, (q.r * 0.5 * k + 6) * 0.42, '#4ab0ff'); g.globalAlpha = 0.8; for (let i = 0; i < 5; i++) { const an = i * 1.9 + t * 3; ell(g, o.x + Math.cos(an) * q.r * 0.3 * k, o.y + 2 + Math.sin(an) * q.r * 0.12 * k, 2.4, 2.4, '#ffffff'); } }
        else { const k = o.age / 0.75, h = 128 * Math.sin(Math.PI * Math.min(1, k * 1.15)) + 4, w = 15 * (1 - k * 0.5), al = Math.min(1, (1 - k) * 2.4);
          g.globalAlpha = al * 0.5; ell(g, o.x, o.y + 2, q.r * (0.5 + k * 0.5), q.r * (0.5 + k * 0.5) * 0.42, '#7fd0ff'); g.globalAlpha = al;
          g.fillStyle = '#3a96e8'; g.beginPath(); g.moveTo(o.x - w - 5, o.y + 2); g.quadraticCurveTo(o.x - w, o.y - h * 0.5, o.x - w * 0.8, o.y - h); g.quadraticCurveTo(o.x, o.y - h - 16, o.x + w * 0.8, o.y - h); g.quadraticCurveTo(o.x + w, o.y - h * 0.5, o.x + w + 5, o.y + 2); g.closePath(); g.fill();
          g.fillStyle = '#9ad8ff'; g.beginPath(); g.moveTo(o.x - w * 0.5, o.y + 2); g.quadraticCurveTo(o.x - w * 0.4, o.y - h * 0.5, o.x - w * 0.3, o.y - h + 4); g.lineTo(o.x + w * 0.3, o.y - h + 4); g.quadraticCurveTo(o.x + w * 0.4, o.y - h * 0.5, o.x + w * 0.5, o.y + 2); g.closePath(); g.fill();
          for (let i = 0; i < 4; i++) { const yy = o.y - ((t * 190 + i * 37) % Math.max(10, h)); ell(g, o.x + Math.sin(i * 2.3) * w * 0.45, yy, 1.6, 6, '#ffffff'); }
          ell(g, o.x, o.y - h - 4, w * 1.5, w * 0.9, '#dff4ff'); ell(g, o.x - w, o.y - h + 2, w * 0.8, w * 0.6, '#ffffff'); ell(g, o.x + w, o.y - h + 3, w * 0.7, w * 0.5, '#ffffff'); }
        g.restore(); }
      else if (o.k === 'trombe') { if (!CG.onScreen(o.x, o.y)) continue; const q = Ea.S.eauTrombe; g.save();
        if (o.t > 0) { const k = 1 - o.t / q.delai, bas = o.y - 340 * (1 - k * k), w = 34 + k * 14; g.globalAlpha = 0.25 + k * 0.3; ell(g, o.x, o.y + 2, q.r * (0.3 + k * 0.6), q.r * (0.3 + k * 0.6) * 0.42, '#1e5a96'); g.globalAlpha = 0.92;
          g.fillStyle = '#3a96e8'; g.beginPath(); g.moveTo(o.x - w * 0.7, bas - 150); g.quadraticCurveTo(o.x - w * 1.3, bas - 30, o.x, bas); g.quadraticCurveTo(o.x + w * 1.3, bas - 30, o.x + w * 0.7, bas - 150); g.closePath(); g.fill();
          g.fillStyle = '#7fd0ff'; g.beginPath(); g.moveTo(o.x - w * 0.4, bas - 150); g.quadraticCurveTo(o.x - w * 0.8, bas - 34, o.x, bas - 8); g.quadraticCurveTo(o.x + w * 0.8, bas - 34, o.x + w * 0.4, bas - 150); g.closePath(); g.fill();
          for (let i = 0; i < 4; i++) ell(g, o.x + Math.sin(i * 2.1 + t * 4) * w * 0.4, bas - 30 - i * 30, 2, 8, '#ffffff'); }
        else { const k = o.age / 0.75, r = q.r * (0.35 + 0.65 * (1 - Math.pow(1 - k, 2))), al = Math.min(1, (1 - k) * 2);
          g.translate(o.x, o.y); g.scale(1, 0.46); g.globalAlpha = al * 0.4; ell(g, 0, 0, r, r, '#4ab0ff'); g.globalAlpha = al;
          g.strokeStyle = '#7fd0ff'; g.lineWidth = 12 * (1 - k) + 3; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 3.4; g.beginPath(); g.arc(0, 0, r + 5, 0, TAU); g.stroke();
          g.scale(1, 1 / 0.46); for (let i = 0; i < 10; i++) { const an = i / 10 * TAU + 0.3, rr = r * 0.8, hh = Math.sin(Math.PI * Math.min(1, k * 1.4)) * (40 + (i % 3) * 18); ell(g, Math.cos(an) * rr, Math.sin(an) * rr * 0.46 - hh, 4.4 - k * 2, 6 - k * 2, i % 2 ? '#bfe8ff' : '#ffffff'); } }
        g.restore(); }
      else if (o.k === 'raz') { const q = Ea.S.eauRaz, r = o.r || 24, al = o.age < q.dur ? 1 : Math.max(0, 1 - (o.age - q.dur) / 0.3), ep = 22 * (1 - 0.4 * Math.min(1, o.age / q.dur)) + 4;
        g.save(); g.translate(o.x, o.y); g.scale(1, 0.78); g.globalAlpha = al * 0.22; ell(g, 0, 0, r, r, '#4ab0ff'); g.globalAlpha = al;
        g.strokeStyle = '#3a96e8'; g.lineWidth = ep; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.strokeStyle = '#7fd0ff'; g.lineWidth = ep * 0.5; g.beginPath(); g.arc(0, 0, Math.max(2, r - ep * 0.15), 0, TAU); g.stroke();
        g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, r + ep * 0.5, 0, TAU); g.stroke();
        for (let i = 0; i < 18; i++) { const an = i / 18 * TAU + Math.sin(t * 9 + i) * 0.05; ell(g, Math.cos(an) * (r + ep * 0.5 + 3), Math.sin(an) * (r + ep * 0.5 + 3), 4, 4, '#ffffff'); }
        g.restore(); }
    }
  }
  if (M.marks) { const mk0 = M.marks; M.marks = function (g, t) { mk0.apply(this, arguments); try { dessiner(g, t); } catch (e) { /* jamais bloquant */ } }; }
})(window.CG);
