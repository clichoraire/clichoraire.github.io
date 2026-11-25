// Goblin Malin — la forme de l'arbre des technologies : les anneaux.
// Le feu du clan au centre, puis des carrés de plus en plus grands ; on passe partout, de case voisine en case voisine, et plus c'est loin du feu, plus ça coûte.
// On avance de case voisine en case voisine. Les coins sont de petits bonus permanents (bn1, bn2...).
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, V = CG.Vues = { DON: 5, REPOS: 0.5, REPOS_PAS: 0.05, REPOS_N: 10, ECHANGES: [['b6', 'b25'], ['d3', 'd4'], ['d4', 'd1']] }; // b6 Cuisine <-> b25 Hutte du guérisseur ; d3 Maçonnerie prend la place de d4 Douves, puis d4 Douves celle de d1 Piège à pointes
  const COUL = { def: '#6f93a8', clan: '#c98a3a', guer: '#d04a34', sorc: '#8f6fe0', mode: '#35b3a0', bonus: '#ffd84a' };
  const BY = () => CG.TECH_BY_ID;
  V.vue = () => 2; // un seul visuel : les anneaux
  const enPlan = id => false; // une case débloquée par un plan acheté (plans.js) compte maintenant comme une case apprise : elle ouvre ses voisines
  const vraie = id => G.tech(id) && !enPlan(id);
  // un coin n'est pas une case à apprendre : c'est une jointure, qu'on ne franchit qu'une fois son bonus gagné
  const coinGagne = id => !!(CG.S && CG.S.tech && CG.S.tech.coins && CG.S.tech.coins[id]);
  // un coin à bonus barre le passage tant qu'il n'est pas gagné : on ne passe à travers qu'une fois ses deux voisines apprises
  const tenu = id => id === 'centre' || (BY()[id] && BY()[id].vide && BY()[id].don ? coinGagne(id) : BY()[id] && BY()[id].vide ? (plan(2).acces[id] || []).some(a => a !== 'centre' && !(BY()[a] && BY()[a].vide) && vraie(a)) : vraie(id));

  // ---------- les petits bonus permanents ----------
  const TYPES = [
    { icon: '❤️', nom: '+' + V.DON + ' vie', desc: '+' + V.DON + ' de vie maximum, pour toujours.', fn: () => { const p = CG.S.player; p.maxhp += V.DON; p.hp += V.DON; } },
    { icon: '💧', nom: '+' + V.DON + ' mana', desc: '+' + V.DON + ' de mana maximum, pour toujours.', fn: () => { const p = CG.S.player; p.maxmp += V.DON; p.mp += V.DON; } },
    { icon: '❤️', nom: '+' + V.DON + ' vie', desc: '+' + V.DON + ' de vie maximum, pour toujours.', fn: () => { const p = CG.S.player; p.maxhp += V.DON; p.hp += V.DON; } },
    { icon: '💧', nom: '+' + V.DON + ' mana', desc: '+' + V.DON + ' de mana maximum, pour toujours.', fn: () => { const p = CG.S.player; p.maxmp += V.DON; p.mp += V.DON; } },
    { icon: '💪', nom: '+1 force', desc: '+1 de dégâts à chacun de tes coups, pour toujours.', fn: () => { const t = CG.S.tech; t.force = (t.force || 0) + 1; } }
  ];
  const REPOS = { icon: '😴', nom: 'Bon sommeil', desc: 'Au réveil, tu retrouves 5 % de ta vie en plus (de base : la moitié seulement).', fn: () => { CG.UI.toast('😴 Au réveil, tu retrouveras maintenant ' + Math.round(G.reposTaux() * 100) + ' % de ta vie.'); } };
  function bonus(i) {
    const id = 'bn' + i; if (BY()[id]) return BY()[id];
    const n = { id, br: 'bonus', bonus: true, vide: true, cout: 0, icon: '', nom: '', desc: '', don: TYPES[(i - 1) % TYPES.length] }; /* un coin ne s'apprend pas : il donne son bonus quand toutes les cases qui le touchent sont apprises (voir V.coin) */ BY()[id] = n; return n;
  }
  // au réveil, le chef ne retrouve que la moitié de sa vie ; chaque « Bon sommeil » appris ajoute 5 %, jusqu'à 100 %
  G.reposTaux = () => V.REPOS;
  for (let i = 1; i <= 60; i++) bonus(i); // connus d'avance : une partie chargée retrouve les siens
  { const pd = G.playerDmg; G.playerDmg = function () { return pd.apply(this, arguments) + ((CG.S && CG.S.tech && CG.S.tech.force) || 0); }; }

  // ---------- la place de chaque case, anneau par anneau (réglée à la main avec Matthieu) ----------
  // Chaque ligne est un anneau, du centre vers le bord, dans l'ordre où les cases se posent : on part du haut et on tourne comme une
  // horloge (les coins restent vides). Anneaux 1 à 5 : 4, 12, 20, 28 et 36 cases. Le dernier : deux ailes, à droite et à gauche.
  // Pour déplacer une case, on change sa place ici. Une case absente de la liste (une nouveauté) va au bord.
  V.ANNEAUX = [
    ['d25', 'b1', 'd1', 'fm1'],
    ['d4', 'g2', 'b3', 'b2', 'b21', 'b18', 'b25', 'd10', 'g3', 'b41', 's6', 'm0'],
    ['d23', 'd26', 'd3', 'd17', 'x12', 'x11', 'b6', 'b4', 'b10', 'b42', 'b51', 'd11', 'x16', 'g20', 'x1', 'g4', 's2', 'x9', 'al1', 's12', 'm1'],
    ['d5', 'x6', 'd9', 'd27', 'x19', 'b17', 'd8', 'b22', 'x5', 'b23', 'b7', 'b11', 'x17', 'b8', 'b5', 'b29', 'g6', 'g5', 'g21', 'x13', 'g7', 'x2', 's20', 'cm1', 's3', 'x18', 'm2', 'm3'],
    ['x3', 'd6', 'd7', 'd18', 'd12', 'x15', 'd28', 'd20', 'd19', 'x7', 'b13', 'b14', 'b24', 'b52', 'b20', 'x14', 'b9', 'b19', 'b27', 'b12', 'b30', 'x4', 'g8', 'g10', 'g13', 'x8', 'g11', 'g15', 'al2', 's21', 's10', 's5', 's4', 's14', 's7', 'm4', 'm5'],
    ['m7', 'd15', 'd13', 'd21', 'd22', 'b31', 'b15', 'b26', 'b40', 'b53', 'b28', 'b16', 'g9', 'x20', 'g14', 'g12', 'x10', 's8', 'al3', 's9', 's11', 'm6']];
  V.ranger = function (files) { const tous = [].concat.apply([], files), par = {}, vu = {}, out = []; tous.forEach(n => { par[n.id] = n; });
    [].concat.apply([], V.ANNEAUX).forEach(id => { if (par[id] && !vu[id]) { vu[id] = 1; out.push(par[id]); } }); tous.forEach(n => { if (!vu[n.id]) out.push(n); }); files.length = 0; files.push(out); };
  // ---------- la forme de chaque famille ----------
  function famille(br) {
    const nodes = CG.TECH.filter(n => n.br === br), ids = new Set(nodes.map(n => n.id)), kids = {}, roots = [];
    nodes.forEach(n => { const p = n.req && ids.has(n.req[0]) ? n.req[0] : null; if (p) (kids[p] = kids[p] || []).push(n); else roots.push(n); });
    return { nodes, kids, roots };
  }
  // ---------- les anneaux ----------
  const TW = 140, TH = 50, SX = 152, SY = 64, BORD = 18;
  const anneau = k => { const l = []; for (let x = -k + 1; x <= k; x++) l.push([x, -k]); for (let y = -k + 1; y <= k; y++) l.push([k, y]); for (let x = k - 1; x >= -k; x--) l.push([x, k]); for (let y = k - 1; y >= -k; y--) l.push([-k, y]); return l; };
  function plan2() {
    // dans chaque famille : les cases de base d'abord (près du centre), les plus avancées ensuite
    const files = CG.TECH_BRANCHES.map(br => { const A = famille(br.id), out = []; let l = A.roots.slice(); while (l.length) { out.push.apply(out, l); l = [].concat.apply([], l.map(n => A.kids[n.id] || [])); } return out; });
    files.forEach((f, i) => { const plus = f.filter(n => n.rang !== undefined).sort((x, y) => x.rang - y.rang), base = f.filter(n => n.rang === undefined); plus.forEach(n => base.splice(Math.min(base.length, Math.round(base.length * n.rang)), 0, n)); files[i] = base; }); // les cases à « rang » se glissent à leur place, du centre vers le bord
    V.ECHANGES.forEach(q => files.forEach(f => { const i = f.findIndex(n => n.id === q[0]), j = f.findIndex(n => n.id === q[1]); if (i >= 0 && j >= 0) { const t = f[i]; f[i] = f[j]; f[j] = t; } })); // deux cases qui échangent leur place
    if (V.ranger) V.ranger(files);
    V._files = files.map(f => f.map(n => n.id));
    let reste = files.reduce((s, f) => s + f.length, 0), nb = 0, K = 0, partiel = false; const grille = {}, acces = {}, liens = [], cle = (x, y) => x + ',' + y;
    grille[cle(0, 0)] = 'centre';
    for (let k = 1; reste > 0 && k < 12; k++) {
      if (k > 2 && reste < 8 * k - 4) { // pas de quoi remplir un carré entier : deux petites ailes, de part et d'autre, collées aux deux passages
        K = k; partiel = true; const suite = [].concat.apply([], files.map(f => f.splice(0))), deux = (k - 1) % 2 ? [[1, 0], [-1, 0]] : [[0, -1], [0, 1]], axe = suite.length > 2 * (2 * k - 1) ? [[1, 0], [-1, 0], [0, -1], [0, 1]] : deux; reste = 0; /* trop de cases pour deux ailes : quatre ailes, une par côté */
        const ordre = [0]; for (let i = 1; i < k; i++) ordre.push(-i, i);
        suite.forEach((n, i) => { const d = axe[i % axe.length], o = ordre[Math.floor(i / axe.length)]; if (o === undefined) return; const x = d[0] * k + (d[0] ? 0 : o), y = d[1] * k + (d[1] ? 0 : o); grille[cle(x, y)] = n.id; });
        break;
      }
      K = k; const tour = anneau(k), libres = tour.filter(c => !(Math.abs(c[0]) === k && Math.abs(c[1]) === k)), m = Math.min(libres.length, reste);
      // chaque famille reçoit sa part de l'anneau, toujours dans le même ordre autour du centre
      const q = files.map(f => f.length * m / reste), pris = q.map(Math.floor); let manque = m - pris.reduce((a, b) => a + b, 0);
      q.map((v, i) => [v - pris[i], i]).sort((a, b) => b[0] - a[0]).forEach(r => { if (manque > 0 && pris[r[1]] < files[r[1]].length) { pris[r[1]]++; manque--; } });
      const suite = [].concat.apply([], files.map((f, i) => f.splice(0, pris[i]))); reste -= suite.length; let s = 0;
      tour.forEach(c => { const coin = Math.abs(c[0]) === k && Math.abs(c[1]) === k; grille[cle(c[0], c[1])] = !coin && s < suite.length ? suite[s++].id : bonus(++nb).id; });
    }
    // on passe partout : chaque case touche ses voisines d'à côté, du dessus et du dessous. Plus de passages obligés d'un carré au suivant.
    Object.keys(grille).forEach(c => { const xy = c.split(',').map(Number); [[1, 0], [0, 1]].forEach(d => { const x2 = xy[0] + d[0], y2 = xy[1] + d[1], v = grille[cle(x2, y2)]; if (!v) return; const coin = q => q !== 'centre' && BY()[q] && BY()[q].vide, r1 = Math.max(Math.abs(xy[0]), Math.abs(xy[1])), r2 = Math.max(Math.abs(x2), Math.abs(y2)); if (r1 !== r2 && (coin(grille[c]) || coin(v))) return; /* un coin ne touche que ses deux voisines du même carré : aucun chemin ne part de lui vers un autre carré */ liens.push([grille[c], v]); }); });
    liens.forEach(l => { (acces[l[0]] = acces[l[0]] || []).push(l[1]); (acces[l[1]] = acces[l[1]] || []).push(l[0]); }); delete acces.centre;
    const pos = {}; Object.keys(grille).forEach(c => { const xy = c.split(',').map(Number), id = grille[c]; pos[id] = { x: BORD + (xy[0] + K) * SX, y: BORD + (xy[1] + K) * SY, bn: id !== 'centre' && !!BY()[id].bonus }; });
    return { pos, acces, liens, K, partiel, W: BORD * 2 + 2 * K * SX + TW, H: BORD * 2 + 2 * K * SY + TH };
  }
  let cache = {};
  // plus une case est loin du feu, plus elle coûte d'étoiles : le prix minimum de chaque carré (1 = autour du feu)
  V.PRIX = [0, 1, 1, 2, 2, 3, 4, 4];
  function prix(P) { Object.keys(P.pos).forEach(id => { const n = BY()[id]; if (!n || n.vide || id === 'centre') return; const p = P.pos[id], r = Math.max(Math.abs(Math.round((p.x - BORD) / SX) - P.K), Math.abs(Math.round((p.y - BORD) / SY) - P.K)); if (n.cout0 === undefined) n.cout0 = n.cout; n.cout = Math.max(n.cout0, V.PRIX[Math.min(r, V.PRIX.length - 1)]); }); }
  function plan(v) { const k = 'c2:' + v + ':' + CG.TECH.length + ':' + CG.TECH.map(n => (n.req || [''])[0]).join(); if (!cache[v] || cache[v].k !== k) { cache[v] = plan2(); cache[v].k = k; prix(cache[v]); } return cache[v]; }
  { const ir0 = G.initRuntime; if (ir0) G.initRuntime = function () { const r = ir0.apply(this, arguments); try { plan(2); } catch (e) { /* rien */ } return r; }; } /* les prix sont prêts dès le début de la partie */
  V.plan = plan;

  // ---------- les coins : un bonus pour toujours, gagné quand les deux cases voisines du coin, dans le même carré, sont apprises ----------
  V.coin = function (id) { const n = BY()[id], r = V.anneau(id), l = (plan(2).acces[id] || []).filter(a => a !== 'centre' && BY()[a] && !BY()[a].vide && V.anneau(a) === r) /* seulement les deux cases voisines du même carré */, t = CG.S && CG.S.tech; return { n, sur: l.length, fait: l.filter(a => G.tech(a)).length, gagne: !!(t && t.coins && t.coins[id]) }; };
  { let tic = 0; const up0 = G.update; G.update = function (dt) { up0.apply(this, arguments); tic -= dt; if (tic > 0) return; tic = 1; const S = CG.S; if (!S || !S.tech || !CG.R) return; const t = S.tech, P = plan(2);
    Object.keys(P.pos).forEach(id => { const n = BY()[id]; if (id === 'centre' || !n || !n.vide || !n.don || (t.coins && t.coins[id])) return; const c = V.coin(id); if (c.sur < 2 || c.fait < c.sur) return;
      (t.coins = t.coins || {})[id] = 1; n.don.fn(); CG.sfx('level'); UI.toast('🔶 Coin de l\'arbre complété : ' + n.don.icon + ' ' + n.don.nom + ', pour toujours !'); const p = S.player; G.text(p.x, p.y - 80, n.don.icon + ' ' + n.don.nom, '#ffe36b', true); }); }; }

  // ---------- qui peut être appris ----------
  // l'anneau d'une case (1 = autour du feu) ; 99 si elle n'est pas dans l'arbre
  V.anneau = id => { const P = plan(2), p = P.pos[id]; return p ? Math.max(Math.abs(Math.round((p.x - BORD) / SX) - P.K), Math.abs(Math.round((p.y - BORD) / SY) - P.K)) : 99; };
  // les suites : la case de gauche reste fermée tant que celle de droite n'est pas apprise, même si on la touche
  V.NIVEAU = { d10: 'd1', d9: 'd3', d8: 'd3', d7: 'd5', d13: 'd12', b5: 'b4', b15: 'b14', b16: 'b15', b19: 'b25', g11: 'g3', g12: 'g11', g14: 'g6', s7: 's5', s14: 's2' };
  // une case offerte (dontech.js) ouvre ses voisines du même anneau seulement, tant qu'aucune case apprise avec des points ne la touche
  const offerte = id => !!(CG.S && CG.S.tech && CG.S.tech.dons && CG.S.tech.dons[id]);
  const reliee = id => (plan(2).acces[id] || []).some(a => a === 'centre' || (!offerte(a) && tenu(a)));

  // un coin de l'arbre (case bonus, jamais apprise) ne bloque pas le passage : les deux cases de son carré qui le touchent se touchent à travers lui
  V.acces = function (v, id) { const A = plan(v).acces, a = A[id]; if (!a) return a; const r = V.anneau(id), out = a.slice();
    a.forEach(c => { const n = BY()[c]; if (c === 'centre' || !n || !n.vide || V.anneau(c) !== r) return; (A[c] || []).forEach(x => { if (x !== id && x !== 'centre' && BY()[x] && !BY()[x].vide && V.anneau(x) === r && !out.includes(x)) out.push(x); }); }); return out; };
  G.techAvail = function (n) {
    const v = V.vue();
    if (n.vide) return false; if (G.tech(n.id) && !enPlan(n.id)) return false; /* une case sous plan peut encore être apprise pour de bon */ const a = V.acces(v, n.id); if (!a) return false; if (V.NIVEAU[n.id] && !G.tech(V.NIVEAU[n.id])) return false; /* un niveau 2 attend son niveau 1 */ const r = V.anneau(n.id); return !a.length || a.some(x => tenu(x) && !(offerte(x) && !reliee(x) && V.anneau(x) !== r));
  };
  // une case « proche » : pas encore possible, mais la suivante sur le chemin
  V.proche = function (n) {
    const v = V.vue();
    return (V.acces(v, n.id) || []).some(id => id !== 'centre' && BY()[id] && G.techAvail(BY()[id]));
  };
  V.manque = n => n && V.NIVEAU[n.id] && !G.tech(V.NIVEAU[n.id]) ? '« ' + BY()[V.NIVEAU[n.id]].nom + ' » (c\'en est la suite)' : 'une case qui touche celle-ci';

  // Les bonus permanents (« +quelque chose » : plus de vie, plus vite, plus d'expérience...) ne sont ni un pouvoir ni une chose à
  // bâtir : dans l'arbre, ce sont des médaillons ronds et bleutés, pas des planches de bois. La liste se règle ici.
  V.PASSIFS = ['g2', 'g3', 'g6', 'g7', 'g9', 'g11', 'g12', 'g14', 'g20', 'g21', 's2', 's4', 's8', 's10', 's14', 'b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b27', 'b28', 'b41', 'b42', 'd13'];
  V.passif = n => !!n && !n.vide && !(n.unlock && n.unlock.length) && (/^x\d+$/.test(n.id) || V.PASSIFS.includes(n.id));
  // ---------- le dessin ----------
  V.boutons = () => '';
  const tuile = (n, x, y, w, h, st, cls) => '<button class="tn ' + st + ' ' + cls + (V.passif(n) ? ' passif' : !(n.unlock && n.unlock.length) ? ' pouvoir' : '') + '" data-tech="' + n.id + '" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px"><u class="cb" style="background:' + COUL[n.br] + '"></u><span class="ti">' + n.icon + '</span><b>' + n.nom + '</b><em>' + (enPlan(n.id) ? '📐' : '') + (st === 'own' ? (enPlan(n.id) ? '' : '✔') : '⭐' + n.cout) + '</em>' + (st === 'can' || st === 'av' ? '<i class="st">★</i>' : '') + '</button>';
  V.corps = function (state) {
    const v = V.vue(), P = plan(v), S = CG.S; let svg = '', vignes = '', cases = '', avant = '';
    {
      const cx = BORD + P.K * SX + TW / 2, cy = BORD + P.K * SY + TH / 2;
      for (let k = P.K - (P.partiel ? 1 : 0); k >= 1; k--) svg += '<rect class="v-bande' + (k % 2 ? '' : ' b2') + '" x="' + (cx - k * SX - TW / 2 - 6) + '" y="' + (cy - k * SY - TH / 2 - 7) + '" width="' + (2 * k * SX + TW + 12) + '" height="' + (2 * k * SY + TH + 14) + '" rx="16"/>';
      P.liens.forEach(l => {
        const a = P.pos[l[0]], b = P.pos[l[1]], d = 'M' + (a.x + TW / 2) + ' ' + (a.y + TH / 2) + ' L' + (b.x + TW / 2) + ' ' + (b.y + TH / 2), deux = tenu(l[0]) && tenu(l[1]);
        if (l[2]) svg += '<path class="porte" d="' + d + '"/><path class="porte2" d="' + d + '"/>'; else svg += '<path class="br2' + (tenu(l[0]) || tenu(l[1]) ? '' : ' off') + '" d="' + d + '"/>';
        if (deux) vignes += '<path class="vine" d="' + d + '"/>';
      });
      avant = ''; // plus de légende des couleurs au-dessus de l'arbre
      Object.keys(P.pos).forEach(id => { const p = P.pos[id]; if (id === 'centre') { cases += '<button class="tn own v2t centre' + (CG.Feu2 && CG.Feu2.brille() ? ' dore' : '') + '" style="left:' + p.x + 'px;top:' + p.y + 'px;width:' + TW + 'px;height:' + TH + 'px"><span class="ti">🔥</span><b>Feu du clan</b></button>'; return; } const n = BY()[id]; if (n.vide) { const c = V.coin(id), d = n.don; if (!d || c.sur < 2) { cases += '<i class="tn-coin' + (tenu(id) ? ' on' : '') + '" style="left:' + (p.x + TW / 2 - 9) + 'px;top:' + (p.y + TH / 2 - 9) + 'px"></i>'; return; } cases += '<span class="tn-coin2' + (c.gagne ? ' on' : '') + '" title="Bonus du coin : ' + d.desc + ' ' + (c.gagne ? 'Tu l\'as gagné !' : 'Apprends les ' + c.sur + ' cases à côté de lui, dans le même carré (' + c.fait + ' sur ' + c.sur + ').') + '" style="left:' + (p.x + TW / 2) + 'px;top:' + (p.y + TH / 2) + 'px"><b>' + d.icon + ' ' + d.nom.replace(/ (vie|mana|force)$/, '') + '</b><small>' + (c.gagne ? '✔ gagné' : c.fait + ' / ' + c.sur) + '</small></span>'; return; } cases += tuile(n, p.x, p.y, TW, TH, state(n), 'v2t' + (p.bn ? ' bn2' : '')); });
      if (!document.getElementById('tn-coin-css')) { const st = document.createElement('style'); st.id = 'tn-coin-css'; st.textContent = '.tn-coin{position:absolute;width:18px;height:18px;border-radius:4px;transform:rotate(45deg);background:#6a5a3a;border:2px solid #3a2a14;box-shadow:inset 0 1px 0 rgba(255,255,255,.25);pointer-events:none}.tn-coin.on{background:#ffd84a;border-color:#8a6a1a;box-shadow:0 0 10px rgba(255,216,74,.8)}.tn-coin2{position:absolute;width:58px;height:46px;margin:-23px 0 0 -29px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:#4a3e28;border:2px dashed #b89a5a;color:#f0dcae;z-index:1;cursor:help}.tn-coin2 b{font-size:13px;line-height:1;white-space:nowrap}.tn-coin2 small{font-size:10px;line-height:1;opacity:.85}.tn-coin2.on{background:radial-gradient(#fff3b0,#ffd84a);border:2px solid #8a6a1a;color:#4a3200;box-shadow:0 0 12px rgba(255,216,74,.9)}'; document.head.appendChild(st); }
    }
    return avant + '<div class="tree v2" style="width:' + P.W + 'px;height:' + P.H + 'px"><svg class="lk" width="' + P.W + '" height="' + P.H + '">' + svg + vignes + '</svg>' + cases + '</div>';
  };
  V.apres = function (keep) {
    const v = V.vue(), pan = document.getElementById('panel'); if (v) pan.classList.add('vx', 'vue' + v);
    if (v === 2 && !keep) { const w = pan.querySelector('.techwrap'), P = plan(2); w.scrollLeft = Math.max(0, (P.W - w.clientWidth) / 2); w.scrollTop = Math.max(0, (P.H - w.clientHeight) / 2 + 20); }
  };
})(window.CG);
