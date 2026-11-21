// Goblin Malin — les objets spéciaux des gobelins. En plus de son arme et de son armure, chaque gobelin a une troisième case
// (inventaire.js) pour un outil de travail : avec lui, il fait plusieurs récoltes d'affilée avant de rentrer, et rapporte tout d'un coup.
//   panier d'osier : cueilleur · brouette : mineur · traîneau à bûches : bûcheron · gibecière : chasseur
'use strict';
(function (CG) {
  const G = CG.G, Bq = CG.Banque, Art = CG.Art, TAU = Math.PI * 2;
  const Ou = CG.Outils = { FOIS: 3 };
  Ou.L = {
    panier: { nom: 'Panier d\'osier', ic: '🧺', job: 'cueilleur', prix: 70, quoi: 'cueille' },
    brouette: { nom: 'Brouette', ic: '🛒', job: 'mineur', prix: 110, quoi: 'pioche' },
    traineau: { nom: 'Traîneau à bûches', ic: '🛷', job: 'bucheron', prix: 90, quoi: 'coupe' },
    gibeciere: { nom: 'Gibecière', ic: '👝', job: 'chasseur', prix: 90, quoi: 'chasse' }
  };
  Object.keys(Ou.L).forEach(k => { const o = Ou.L[k], J = CG.JOBS[o.job]; o.effet = J.nom + ' : il ' + o.quoi + ' ' + Ou.FOIS + ' fois avant de rentrer, et rapporte ' + Ou.FOIS + ' fois plus d\'un coup'; if (Bq) { Bq.NOMS[k] = ['', o.nom, o.nom, o.nom]; Bq.IC[k] = o.ic; } });
  if (Bq) { const e0 = Bq.effet; Bq.effet = function (k) { return Ou.L[k] ? Ou.L[k].effet : e0.apply(this, arguments); }; }
  // l'outil sert-il à ce gobelin ? (il faut le bon métier)
  Ou.sert = g => !!(g && g.outil && Ou.L[g.outil] && Ou.L[g.outil].job === g.job);
  Ou.cap = g => (Ou.sert(g) ? Ou.FOIS : 1);
  // appelé quand une récolte vient de finir : vrai s'il reste de la place et qu'il repart en chercher sans rentrer
  G.outilSuite = function (g) {
    const cap = Ou.cap(g); g.charge = (g.charge || 0) + 1; if (cap <= 1 || g.charge >= cap) return false;
    if (CG.onScreen(g.x, g.y)) G.text(g.x, g.y - 44, Ou.L[g.outil].ic + ' ' + g.charge + ' / ' + cap, '#ffe9b8');
    g.state = 'idle'; g.timer = 0.3; g.pose = null; g.path = null; return true;
  };
  // combien de récoltes il rapporte ; son chargement est alors vidé
  G.outilVide = function (g) { const n = Math.max(1, g.charge || 1); g.charge = 0; return n; };
  { const rg = G.resetGoblin; if (rg) G.resetGoblin = function (g) { if (g) g.charge = 0; return rg.apply(this, arguments); }; }
  // la sauvegarde : l'outil de chacun
  { const pk = CG.pack; CG.pack = function () { const d = pk.apply(this, arguments), S = CG.S; if (d && d.goblins && S) d.goblins.forEach((o, i) => { const g = S.goblins[i]; if (g && g.outil) o.outil = g.outil; }); return d; }; }
  // chez les marchands
  Ou.stock = function (role) {
    const l = role === 'nain' ? ['brouette', 'traineau'] : role === 'elfe' ? ['panier', 'gibeciere'] : role === 'sorciere' ? [] : CG.shuffle(Object.keys(Ou.L)).slice(0, 2);
    return l.map(k => { const o = Ou.L[k]; return { icon: o.ic, label: o.nom, desc: 'Pour un ' + CG.JOBS[o.job].nom.toLowerCase() + ' : il rapporte plus à chaque voyage.', prix: o.prix, stock: 1, buy: () => { const z = CG.Inventaire ? CG.Inventaire.ajouter(k, 1, 'sac') : 'coffre'; if (CG.UI && CG.Inventaire) CG.UI.toast(o.ic + ' ' + o.nom + ' : rangé ' + CG.Inventaire.ou(z) + '.'); } }; });
  };
  // ---------- dessin : l'outil suit le gobelin au travail ----------
  const rr = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }, el = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const PLEIN = { panier: ['#d83a4a', '#e85a6a'], brouette: ['#8a8e98', '#a8acb8'], traineau: ['#8a5a30', '#b88a50'], gibeciere: ['#c8a070', '#a87a4a'] };
  function dessiner(g, k, n, cap, roule) {
    const C = PLEIN[k], tas = (x, y, w) => { for (let i = 0; i < n; i++) el(g, x + (i - (n - 1) / 2) * w * 0.3, y - (i % 2) * 2, w * 0.22, w * 0.18, C[i % 2]); };
    el(g, 0, 1, 11, 3, 'rgba(0,0,0,0.2)');
    if (k === 'brouette') { g.strokeStyle = '#6b4a2a'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(6, -8); g.lineTo(15, -11); g.stroke(); if (n) tas(-1, -12, 15);
      g.fillStyle = '#9a6a3a'; g.beginPath(); g.moveTo(-10, -12); g.lineTo(8, -12); g.lineTo(5, -4); g.lineTo(-7, -4); g.closePath(); g.fill(); rr(g, -10, -13, 18, 2, '#b88a50');
      el(g, -6, -2, 4, 4, '#3a3028'); el(g, -6, -2, 1.6, 1.6, '#c8b890'); g.strokeStyle = '#c8b890'; g.lineWidth = 1; g.beginPath(); g.moveTo(-6 + Math.cos(roule) * 3.4, -2 + Math.sin(roule) * 3.4); g.lineTo(-6 - Math.cos(roule) * 3.4, -2 - Math.sin(roule) * 3.4); g.stroke(); }
    else if (k === 'traineau') { g.strokeStyle = '#6b4a2a'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(-12, -1); g.lineTo(9, -1); g.quadraticCurveTo(13, -1, 13, -6); g.stroke(); rr(g, -10, -5, 18, 3, '#9a6a3a');
      for (let i = 0; i < n; i++) { const y = -8 - i * 4; rr(g, -9 + i, y - 2, 16 - i * 2, 4, C[0]); el(g, -9 + i, y, 1.6, 2, C[1]); el(g, 7 - i, y, 1.6, 2, C[1]); } }
    else if (k === 'panier') { if (n) tas(0, -11, 15); g.fillStyle = '#c89a4a'; g.beginPath(); g.moveTo(-8, -11); g.lineTo(8, -11); g.lineTo(6, -1); g.lineTo(-6, -1); g.closePath(); g.fill(); g.strokeStyle = 'rgba(110,70,20,0.55)'; g.lineWidth = 1; g.beginPath(); for (let i = -4; i <= 4; i += 4) { g.moveTo(i, -11); g.lineTo(i * 0.8, -1); } g.moveTo(-7.4, -7.5); g.lineTo(7.4, -7.5); g.moveTo(-6.6, -4); g.lineTo(6.6, -4); g.stroke(); rr(g, -9, -12, 18, 2, '#e0b060');
      g.strokeStyle = '#a87a30'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(0, -12, 6, 6.5, 0, Math.PI, 0); g.stroke(); }
    else { g.fillStyle = '#8a5a30'; g.beginPath(); g.moveTo(-7, -9); g.lineTo(7, -9); g.quadraticCurveTo(9, -1, 0, -1); g.quadraticCurveTo(-9, -1, -7, -9); g.fill(); g.fillStyle = '#a87440'; g.beginPath(); g.moveTo(-7.5, -10); g.lineTo(7.5, -10); g.lineTo(5, -5.5); g.lineTo(-5, -5.5); g.closePath(); g.fill(); el(g, 0, -5.8, 1.3, 1.3, '#e8c84a');
      for (let i = 0; i < n; i++) el(g, -4 + i * 4, -11.5, 2.2, 1.8, C[i % 2]); }
    void cap;
  }
  Ou.dessiner = dessiner;
  const AU_TRAVAIL = { toNode: 1, work: 1, toStock: 1, timber: 1, toLog: 1, logWork: 1, toChamp: 1, champ: 1, toStockC: 1 };
  if (Art && Art.goblin) { const gob0 = Art.goblin; Art.goblin = function (g, o) {
    const e = o && o.ent; if (!e || !e.outil || !Ou.sert(e) || e.hidden || !(AU_TRAVAIL[e.state] || e.charge > 0)) return gob0.apply(this, arguments);
    const f = e.face < 0 ? -1 : 1, n = e.state === 'toStock' || e.state === 'toStockC' ? Math.max(1, e.charge || 1) : (e.charge || 0), dessus = e.outil === 'gibeciere';
    const poser = () => { g.save(); g.translate(o.x - f * (dessus ? 9 : 19), o.y + (dessus ? -9 : 1)); g.scale(f * (dessus ? 0.8 : 1), dessus ? 0.8 : 1); dessiner(g, e.outil, Math.min(Ou.FOIS, n), Ou.FOIS, (e.step || 0) * TAU); g.restore(); };
    if (!dessus) poser(); const r = gob0.apply(this, arguments); if (dessus) poser(); return r; }; }
  // pour les essais : un outil dans le sac
  Ou.donner = k => (CG.Inventaire ? CG.Inventaire.ajouter(k, 1, 'sac') : null);
})(window.CG);
