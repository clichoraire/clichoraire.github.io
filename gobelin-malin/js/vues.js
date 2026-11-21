// Goblin Malin — la forme de l'arbre des technologies : les anneaux.
// Le feu du clan au centre, quatre directions, puis des carrés de plus en plus grands ; on ne passe d'un carré au suivant que par deux passages.
// On avance de case voisine en case voisine. Les coins sont de petits bonus permanents (bn1, bn2...).
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, V = CG.Vues = { DON: 5, REPOS: 0.5, REPOS_PAS: 0.05, REPOS_N: 10, ECHANGES: [['b6', 'b25'], ['d3', 'd4'], ['d4', 'd1']] }; // b6 Cuisine <-> b25 Hutte du guérisseur ; d3 Maçonnerie prend la place de d4 Douves, puis d4 Douves celle de d1 Piège à pointes
  const COUL = { def: '#6f93a8', clan: '#c98a3a', guer: '#d04a34', sorc: '#8f6fe0', mode: '#35b3a0', bonus: '#ffd84a' };
  const BY = () => CG.TECH_BY_ID;
  V.vue = () => 2; // un seul visuel : les anneaux
  const enPlan = id => false; // une case débloquée par un plan acheté (plans.js) compte maintenant comme une case apprise : elle ouvre ses voisines
  const vraie = id => G.tech(id) && !enPlan(id);
  // un coin n'est plus une case à apprendre : c'est une simple jointure, qu'on franchit dès qu'on tient une de ses deux voisines
  const tenu = id => id === 'centre' || (BY()[id] && BY()[id].vide ? (plan(2).acces[id] || []).some(a => a !== 'centre' && !(BY()[a] && BY()[a].vide) && vraie(a)) : vraie(id));

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
    const n = { id, br: 'bonus', bonus: true, vide: true, cout: 0, icon: '', nom: '', desc: '' }; /* plus de petits bonus (vie, mana, force, sommeil) : le coin est vide */ BY()[id] = n; return n;
  }
  // au réveil, le chef ne retrouve que la moitié de sa vie ; chaque « Bon sommeil » appris ajoute 5 %, jusqu'à 100 %
  G.reposTaux = () => V.REPOS;
  for (let i = 1; i <= 60; i++) bonus(i); // connus d'avance : une partie chargée retrouve les siens
  { const pd = G.playerDmg; G.playerDmg = function () { return pd.apply(this, arguments) + ((CG.S && CG.S.tech && CG.S.tech.force) || 0); }; }

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
    let reste = files.reduce((s, f) => s + f.length, 0), nb = 0, K = 0, partiel = false; const grille = {}, acces = {}, liens = [], cle = (x, y) => x + ',' + y;
    grille[cle(0, 0)] = 'centre';
    for (let k = 1; reste > 0 && k < 12; k++) {
      if (k > 2 && reste < 8 * k - 4) { // pas de quoi remplir un carré entier : deux petites ailes, de part et d'autre, collées aux deux passages
        K = k; partiel = true; const axe = (k - 1) % 2 ? [[1, 0], [-1, 0]] : [[0, -1], [0, 1]], suite = [].concat.apply([], files.map(f => f.splice(0))); reste = 0;
        const ordre = [0]; for (let i = 1; i < k; i++) ordre.push(-i, i);
        suite.forEach((n, i) => { const d = axe[i % 2], o = ordre[Math.floor(i / 2)], x = d[0] * k + (d[0] ? 0 : o), y = d[1] * k + (d[1] ? 0 : o); grille[cle(x, y)] = n.id; });
        Object.keys(grille).forEach(c => { const xy = c.split(',').map(Number); if (Math.max(Math.abs(xy[0]), Math.abs(xy[1])) !== k) return; const v = axe[0][0] ? grille[cle(xy[0], xy[1] + 1)] : grille[cle(xy[0] + 1, xy[1])]; if (v) liens.push([grille[c], v]); });
        break;
      }
      K = k; const tour = anneau(k), libres = tour.filter(c => !(Math.abs(c[0]) === k && Math.abs(c[1]) === k)), m = Math.min(libres.length, reste);
      // chaque famille reçoit sa part de l'anneau, toujours dans le même ordre autour du centre
      const q = files.map(f => f.length * m / reste), pris = q.map(Math.floor); let manque = m - pris.reduce((a, b) => a + b, 0);
      q.map((v, i) => [v - pris[i], i]).sort((a, b) => b[0] - a[0]).forEach(r => { if (manque > 0 && pris[r[1]] < files[r[1]].length) { pris[r[1]]++; manque--; } });
      const suite = [].concat.apply([], files.map((f, i) => f.splice(0, pris[i]))); reste -= suite.length; let s = 0;
      tour.forEach(c => { const coin = Math.abs(c[0]) === k && Math.abs(c[1]) === k; grille[cle(c[0], c[1])] = !coin && s < suite.length ? suite[s++].id : bonus(++nb).id; });
      tour.forEach((c, i) => { const d = tour[(i + 1) % tour.length]; liens.push([grille[cle(c[0], c[1])], grille[cle(d[0], d[1])]]); });
    }
    // du centre : quatre directions, et quatre encore pour sortir du premier carré. Ensuite, deux passages seulement d'un anneau au suivant (nord-sud, puis est-ouest, en alternance).
    const portes = []; [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(d => liens.push(['centre', grille[cle(d[0], d[1])], 1]));
    for (let k = 1; k < K; k++) (k === 1 ? [[1, 0], [-1, 0], [0, -1], [0, 1]] : k % 2 ? [[1, 0], [-1, 0]] : [[0, -1], [0, 1]]).forEach(d => { /* du premier carré, on sort par les quatre côtés */ const a = grille[cle(d[0] * k, d[1] * k)], b = grille[cle(d[0] * (k + 1), d[1] * (k + 1))]; liens.push([a, b, 1]); portes.push([a, b]); });
    liens.forEach(l => { (acces[l[0]] = acces[l[0]] || []).push(l[1]); (acces[l[1]] = acces[l[1]] || []).push(l[0]); }); delete acces.centre;
    const pos = {}; Object.keys(grille).forEach(c => { const xy = c.split(',').map(Number), id = grille[c]; pos[id] = { x: BORD + (xy[0] + K) * SX, y: BORD + (xy[1] + K) * SY, bn: id !== 'centre' && !!BY()[id].bonus }; });
    return { pos, acces, liens, K, partiel, W: BORD * 2 + 2 * K * SX + TW, H: BORD * 2 + 2 * K * SY + TH };
  }
  let cache = {};
  function plan(v) { const k = v + ':' + CG.TECH.length + ':' + CG.TECH.map(n => (n.req || [''])[0]).join(); if (!cache[v] || cache[v].k !== k) { cache[v] = plan2(); cache[v].k = k; } return cache[v]; }
  V.plan = plan;

  // ---------- qui peut être appris ----------
  // l'anneau d'une case (1 = autour du feu) ; 99 si elle n'est pas dans l'arbre
  V.anneau = id => { const P = plan(2), p = P.pos[id]; return p ? Math.max(Math.abs(Math.round((p.x - BORD) / SX) - P.K), Math.abs(Math.round((p.y - BORD) / SY) - P.K)) : 99; };
  // les suites : la case de gauche reste fermée tant que celle de droite n'est pas apprise, même si on la touche
  V.NIVEAU = { d10: 'd1', d9: 'd3', d8: 'd3', d7: 'd5', d13: 'd12', b5: 'b4', b15: 'b14', b16: 'b15', b19: 'b25', g11: 'g3', g12: 'g11', g14: 'g6', s7: 's5', s14: 's2' };
  // une case offerte (dontech.js) ouvre ses voisines du même anneau seulement, tant qu'aucune case apprise avec des points ne la touche
  const offerte = id => !!(CG.S && CG.S.tech && CG.S.tech.dons && CG.S.tech.dons[id]);
  const reliee = id => (plan(2).acces[id] || []).some(a => a === 'centre' || (!offerte(a) && tenu(a)));

  G.techAvail = function (n) {
    const v = V.vue();
    if (n.vide) return false; if (G.tech(n.id) && !enPlan(n.id)) return false; /* une case sous plan peut encore être apprise pour de bon */ const a = plan(v).acces[n.id]; if (!a) return false; if (V.NIVEAU[n.id] && !G.tech(V.NIVEAU[n.id])) return false; /* un niveau 2 attend son niveau 1 */ const r = V.anneau(n.id); return !a.length || a.some(x => tenu(x) && !(offerte(x) && !reliee(x) && V.anneau(x) !== r));
  };
  // une case « proche » : pas encore possible, mais la suivante sur le chemin
  V.proche = function (n) {
    const v = V.vue();
    return (plan(v).acces[n.id] || []).some(id => id !== 'centre' && G.techAvail(BY()[id]));
  };
  V.manque = n => n && V.NIVEAU[n.id] && !G.tech(V.NIVEAU[n.id]) ? '« ' + BY()[V.NIVEAU[n.id]].nom + ' » (c\'en est la suite)' : 'une case qui touche celle-ci';

  // ---------- le dessin ----------
  V.boutons = () => '';
  const tuile = (n, x, y, w, h, st, cls) => '<button class="tn ' + st + ' ' + cls + '" data-tech="' + n.id + '" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px"><u class="cb" style="background:' + COUL[n.br] + '"></u><span class="ti">' + n.icon + '</span><b>' + n.nom + '</b><em>' + (enPlan(n.id) ? '📐' : '') + (st === 'own' ? (enPlan(n.id) ? '' : '✔') : '⭐' + n.cout) + '</em>' + (st === 'can' || st === 'av' ? '<i class="st">★</i>' : '') + '</button>';
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
      Object.keys(P.pos).forEach(id => { const p = P.pos[id]; if (id === 'centre') { cases += '<button class="tn own v2t centre" style="left:' + p.x + 'px;top:' + p.y + 'px;width:' + TW + 'px;height:' + TH + 'px"><span class="ti">🔥</span><b>Feu du clan</b></button>'; return; } const n = BY()[id]; if (n.vide) { cases += '<i class="tn-coin' + (tenu(id) ? ' on' : '') + '" style="left:' + (p.x + TW / 2 - 9) + 'px;top:' + (p.y + TH / 2 - 9) + 'px"></i>'; return; } cases += tuile(n, p.x, p.y, TW, TH, state(n), 'v2t' + (p.bn ? ' bn2' : '')); });
      if (!document.getElementById('tn-coin-css')) { const st = document.createElement('style'); st.id = 'tn-coin-css'; st.textContent = '.tn-coin{position:absolute;width:18px;height:18px;border-radius:4px;transform:rotate(45deg);background:#6a5a3a;border:2px solid #3a2a14;box-shadow:inset 0 1px 0 rgba(255,255,255,.25);pointer-events:none}.tn-coin.on{background:#ffd84a;border-color:#8a6a1a;box-shadow:0 0 10px rgba(255,216,74,.8)}'; document.head.appendChild(st); }
    }
    return avant + '<div class="tree v2" style="width:' + P.W + 'px;height:' + P.H + 'px"><svg class="lk" width="' + P.W + '" height="' + P.H + '">' + svg + vignes + '</svg>' + cases + '</div>';
  };
  V.apres = function (keep) {
    const v = V.vue(), pan = document.getElementById('panel'); if (v) pan.classList.add('vx', 'vue' + v);
    if (v === 2 && !keep) { const w = pan.querySelector('.techwrap'), P = plan(2); w.scrollLeft = Math.max(0, (P.W - w.clientWidth) / 2); w.scrollTop = Math.max(0, (P.H - w.clientHeight) / 2 + 20); }
  };
})(window.CG);
