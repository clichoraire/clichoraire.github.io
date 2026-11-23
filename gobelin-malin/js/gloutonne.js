// Goblin Malin — la plante rayonnante. Rare. Elle brille si fort qu'on la voit de loin. Si le chef lui parle (E), elle réclame
// un objet de son sac : une arme, une armure ou un outil. Elle l'avale, mâche quelques secondes, puis le recrache… en mieux.
// On ne sait jamais d'avance ce qui va sortir :
//   une étoile de plus ; ou la version elfique (la qualité au-dessus de trois étoiles) ; ou, pour une épée ou un arc, la même
//   arme en feu ou en glace, avec autant d'étoiles (armesfeu.js).
// Ça ne coûte rien. Une plante ne mange qu'une fois : après, elle digère. Tout se règle dans CG.Gloutonne.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, De = CG.Decors, Bq = CG.Banque, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick; if (!De || !Bq) return;
  const Gl = CG.Gloutonne = { CHANCE: 0.1, MACHE: 3.6, POIDS: { etoile: 0.55, elfe: 0.15, element: 0.3 }, BASE: ['epee', 'arc', 'armure', 'pioche', 'hache', 'gant'] };
  Gl.DEMANDE = ['Miam… Donne… Donne-moi quelque chose…', 'J\'ai faim. Pas de mouches. Quelque chose de dur. Qui brille.', 'Tu as un sac. Dans ton sac, il y a des choses. Donne une chose.', 'Approche, petit vert. Je ne mords pas. J\'avale.', 'Une lame, un arc, une pioche… N\'importe. Je rends toujours ce que je mange.', 'Nourris-moi. Tu ne le regretteras pas. Enfin… on verra.'];
  Gl.MACHE_TXT = ['Scrountch…', 'Miam…', 'Crac !', 'Gloup…', 'Mmmh…', 'Crounch…', 'Grmbl…'];
  Gl.REFUS = ['Celui-là est déjà parfait. Garde-le.', 'Non. Trop bon. Je ne peux pas faire mieux.'];
  const elem = () => (CG.ArmesElem ? CG.ArmesElem.L : {});
  const ic = k => (elem()[k] ? elem()[k].ic : Bq.IC[k] || '🎁'), nom = (k, n) => (Bq.NOMS[k] && Bq.NOMS[k][n]) || k, etoiles = n => (n >= 4 ? '✦' : '★'.repeat(n));
  // ce que la plante peut faire d'un objet : la liste des sorties possibles, avec leur poids
  Gl.sorties = function (it) {
    const k = it.k, n = it.n || 1, l = [];
    if (elem()[k]) { if (n < 3) l.push(['etoile', { k, n: n + 1 }, 1]); return l; }
    if (!Gl.BASE.includes(k) || n >= 4) return l; const elfe = !!(Bq.NOMS[k] && Bq.NOMS[k][4]);
    if (n < 3) l.push(['etoile', { k, n: n + 1 }, Gl.POIDS.etoile]);
    if (elfe) l.push(['elfe', { k, n: 4 }, n < 3 ? Gl.POIDS.elfe : 0.5]);
    if (k === 'epee' || k === 'arc') Object.keys(elem()).filter(q => elem()[q].base === k).forEach(q => l.push(['element', { k: q, n }, (n < 3 ? Gl.POIDS.element : 0.5) / 2]));
    return l;
  };
  Gl.tirer = function (it) { const l = Gl.sorties(it); if (!l.length) return null; let r = Math.random() * l.reduce((a, q) => a + q[2], 0); for (const q of l) { r -= q[2]; if (r <= 0) return q; } return l[0]; };
  const mangeable = it => !!it && it.n !== undefined && !it.base && (Gl.BASE.includes(it.k) || !!elem()[it.k]);
  function donner(d, i) {
    const S = CG.S, R = CG.R, p = S.player, it = p.sac[i]; if (!mangeable(it) || d.mange) return; const c = De.pos(d), s = Gl.tirer(it);
    if (!s) { G.text(c.x, c.y - 70, pick(Gl.REFUS), '#fff2a8', true); CG.sfx('no'); return; }
    p.sac[i] = null; d.mange = true; R.gloutonne = { d, t: Gl.MACHE, avant: { k: it.k, n: it.n }, apres: s[1], quoi: s[0], dit: 0 };
    G.text(c.x, c.y - 70, 'GLOUP !', '#fff2a8', true); G.puff(c.x, c.y - 30, '#fff2a8', 14, 120, 3); CG.sfx('swing');
  }
  function parler(d) {
    const S = CG.S, p = S.player, l = []; (p.sac || []).forEach((it, i) => { if (mangeable(it)) l.push({ it, i }); });
    const opts = l.slice(0, 8).map(q => ({ label: ic(q.it.k) + ' ' + nom(q.it.k, q.it.n) + ' ' + etoiles(q.it.n), fn: () => donner(d, q.i) }));
    opts.push({ label: l.length ? 'Rien du tout' : 'Je n\'ai rien pour toi', echap: true });
    UI.dialog({ who: 'Une plante rayonnante', tag: 'elle te regarde. Enfin… on dirait', text: pick(Gl.DEMANDE) + (l.length ? '' : ' (Tu n\'as ni arme, ni armure, ni outil dans ton sac.)'), options: opts });
  }
  // ---------- elle mâche, puis elle recrache ----------
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R, m = R && R.gloutonne; if (!m || !S) return r; const c = De.pos(m.d), p = S.player;
    if (UI.modal && UI.modal.pauses) return r; m.t -= dt;
    if (m.t > 0) { if (R.t > m.dit) { m.dit = R.t + rand(0.55, 0.85); G.text(c.x + rand(-14, 14), c.y - 62, pick(Gl.MACHE_TXT), '#fff2a8'); G.puff(c.x, c.y - 30, '#bfe86a', 4, 60, 2); } return r; }
    R.gloutonne = null; const a = m.apres, z = Bq.deposer(a.k, a.n, 1, 'sac'), feu = elem()[a.k], col = feu ? (feu.el === 'feu' ? '#ffb060' : '#cfeeff') : a.n >= 4 ? '#b0ffd0' : '#ffe36b', titre = ic(a.k) + ' ' + nom(a.k, a.n) + ' ' + etoiles(a.n);
    G.text(c.x, c.y - 74, 'PTOU !', '#fff2a8', true); G.puff(c.x, c.y - 30, col, 30, 200, 4); for (let i = 0; i < 12; i++) { const k = i / 12; R.parts.push({ x: c.x + (p.x - c.x) * k, y: c.y - 30 + (p.y - 24 - (c.y - 30)) * k - Math.sin(k * Math.PI) * 40, vx: 0, vy: 0, life: 0.3 + k * 0.4, max: 0.7, col, size: 3 }); }
    G.text(p.x, p.y - 84, titre, col, true); for (let i = 0; i < 2; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 46 + i * 34, life: 0.45 + i * 0.15, col }); CG.sfx('discovery');
    G.banner(titre, m.quoi === 'etoile' ? 'Elle te le rend avec une étoile de plus !' : m.quoi === 'elfe' ? 'Elle te le rend… en version elfique !' : (feu.el === 'feu' ? 'Elle te le rend… en feu !' : 'Elle te le rend… tout givré !'), col);
    if (z !== 'sac') UI.toast('🎒 Ton sac est plein : ' + nom(a.k, a.n) + ' est au coffre du camp.');
    return r;
  };
  // ---------- son dessin ----------
  const ell = (g, x, y, rx, ry, f, rot) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  function dessin(g, d, t) {
    const c = De.pos(d), x = c.x, R = CG.R, m = R.gloutonne && R.gloutonne.d === d ? R.gloutonne : null, repue = d.mange && !m, y = c.y + 8, vif = repue ? 0.35 : 1;
    const bal = Math.sin(t * 1.6 + d.seed) * 2.5, hx = x + bal, hy = y - 40 + (m ? Math.abs(Math.sin(t * 11)) * -3 : Math.sin(t * 2.2 + d.seed) * 1.5);
    ell(g, x, y + 3, 20, 6, 'rgba(0,0,0,0.25)');
    if (!repue) { g.save(); g.translate(hx, hy); g.rotate(t * 0.35); for (let i = 0; i < 10; i++) { g.rotate(TAU / 10); g.fillStyle = 'rgba(255,236,130,' + (0.13 + Math.sin(t * 3 + i * 1.3) * 0.06) + ')'; g.beginPath(); g.moveTo(-5, -14); g.lineTo(0, -52 - (i % 2) * 14); g.lineTo(5, -14); g.closePath(); g.fill(); } g.restore();
      ell(g, hx, hy, 34 + Math.sin(t * 2.6) * 3, 30 + Math.sin(t * 2.6) * 3, 'rgba(255,240,150,0.2)'); }
    g.strokeStyle = '#3f8a3a'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 7, y - 20, hx, hy + 10); g.stroke(); /* la tige */
    for (const s of [-1, 1]) { g.fillStyle = s < 0 ? '#3c9440' : '#4fae4c'; g.beginPath(); g.moveTo(x, y - 2); g.quadraticCurveTo(x + s * 16, y - 16, x + s * 24, y - 5 + Math.sin(t * 2 + s) * 1.5); g.quadraticCurveTo(x + s * 12, y - 2, x, y - 2); g.closePath(); g.fill(); }
    const pet = repue ? '#c9b56a' : '#ffd23a', pet2 = repue ? '#b39a52' : '#ffb01e'; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + Math.sin(t * 1.2) * 0.08; ell(g, hx + Math.cos(a) * 14, hy + Math.sin(a) * 13, 8, 4.6, i % 2 ? pet : pet2, a); }
    ell(g, hx, hy, 13, 12, repue ? '#6f9a48' : '#7ad04a'); ell(g, hx - 3, hy - 4, 6, 4, 'rgba(255,255,255,' + 0.22 * vif + ')');
    const ouv = m ? 1 + Math.abs(Math.sin(t * 11)) * 4 : repue ? 0.6 : 2.5 + Math.sin(t * 2.2 + d.seed) * 1; /* la bouche : elle mâche, elle dort, ou elle attend */
    ell(g, hx, hy + 3, 8.5, ouv + 1, '#3a1420'); if (ouv > 2) { g.fillStyle = '#fff'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(hx + i * 3 - 1.3, hy + 2.6 - ouv); g.lineTo(hx + i * 3, hy + 4.4 - ouv); g.lineTo(hx + i * 3 + 1.3, hy + 2.6 - ouv); g.closePath(); g.fill(); } }
    for (const s of [-1, 1]) { if (repue) { g.strokeStyle = '#2a1a14'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(hx + s * 5 - 2, hy - 4); g.lineTo(hx + s * 5 + 2, hy - 4); g.stroke(); } else { ell(g, hx + s * 5, hy - 4.5, 2.4, 2.6, '#fff'); ell(g, hx + s * 5 + (m ? 0 : Math.sin(t * 0.9) * 0.8), hy - 4.3, 1.1, 1.3, '#2a1a14'); } }
    if (repue) { const k = (t * 0.5 + d.seed) % 1; g.globalAlpha = 1 - k; g.fillStyle = '#e8e0d0'; g.font = '700 10px sans-serif'; g.fillText('z', hx + 12 + k * 6, hy - 14 - k * 12); g.globalAlpha = 1; }
  }
  De.SORTES.plante = { chance: Gl.CHANCE, marge: 1, solide: 12, draw: dessin, label: d => (d.mange ? null : 'Parler à la plante rayonnante'), agir: parler };
})(window.CG);
