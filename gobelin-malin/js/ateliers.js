// Clan Gobelin — les ateliers : la forge, l'atelier d'arcs et la tannerie. Chaque métier d'artisan se débloque dans l'arbre,
// et ne peut être donné que si son atelier est bâti (le bouton reste grisé sinon). Pareil pour le guérisseur et sa hutte.
'use strict';
(function (CG) {
  const G = CG.G, Art = CG.Art, T = CG.TILE, TAU = Math.PI * 2, At = CG.Ateliers = {};
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const box = (g, x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const line = (g, a, b, c, d, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); };

  CG.BUILDS.forge = { nom: 'Forge', icon: '⚒️', w: 2, h: 2, cat: 'clan', cout: { bois: 20, minerai: 12 }, tech: 'b29', desc: 'L\'atelier du forgeron : sans forge, personne ne peut forger d\'épées.' };
  CG.BUILDS.archerie = { nom: 'Atelier d\'arcs', icon: '🎯', w: 2, h: 2, cat: 'clan', cout: { bois: 30 }, tech: 'b30', desc: 'L\'atelier du facteur d\'arcs : sans lui, personne ne peut tailler d\'arcs.' };
  CG.BUILDS.tannerie = { nom: 'Tannerie', icon: '🧥', w: 2, h: 2, cat: 'clan', cout: { bois: 22, cuir: 6 }, tech: 'b31', desc: 'L\'atelier du tanneur : sans tannerie, personne ne peut coudre d\'armures de cuir.' };
  Object.assign(CG.JOBS.forgeron, { tech: 'b29', lieu: 'forge', desc: 'Forge des épées à la forge (2 minerai + 1 bois). Il faut d\'abord bâtir la forge.' });
  Object.assign(CG.JOBS.arcier, { tech: 'b30', lieu: 'archerie', desc: 'Taille des arcs à l\'atelier d\'arcs (2 bois). Il faut d\'abord bâtir l\'atelier.' });
  Object.assign(CG.JOBS.tanneur, { tech: 'b31', lieu: 'tannerie', desc: 'Coud des armures de cuir à la tannerie (2 cuir). Il faut d\'abord bâtir la tannerie.' });
  CG.JOBS.guerisseur.lieu = 'guerisseur';
  CG.TECH.push(
    { id: 'b29', br: 'clan', t: 3, r: 5, cout: 1, icon: '⚒️', nom: 'Forge', desc: 'Révèle la Forge, et le métier de Forgeron qui va avec.', req: ['b4'], unlock: ['forge'] },
    { id: 'b30', br: 'clan', t: 4, r: 5, cout: 1, icon: '🎯', nom: 'Atelier d\'arcs', desc: 'Révèle l\'Atelier d\'arcs, et le métier de Facteur d\'arcs.', req: ['b29'], unlock: ['archerie'] },
    { id: 'b31', br: 'clan', t: 4, r: 6, cout: 1, icon: '🧥', nom: 'Tannerie', desc: 'Révèle la Tannerie, et le métier de Tanneur.', req: ['b29'], unlock: ['tannerie'] });
  if (CG.TECH_PARENT) Object.assign(CG.TECH_PARENT, { b29: 'b4', b30: 'b29', b31: 'b29' });
  if (CG.TECH_BY_ID) CG.TECH.forEach(n => { if (['b29', 'b30', 'b31'].includes(n.id)) CG.TECH_BY_ID[n.id] = n; });

  // un métier se voit une fois son pouvoir appris (ou si son atelier existe déjà, ou si quelqu'un l'exerce déjà : anciennes parties)
  const bati = t => !!CG.S && CG.S.buildings.some(b => b.type === t && !b.site);
  CG.jobsAvail = () => CG.JOB_ORDER.filter(j => { const J = CG.JOBS[j]; return !J.tech || G.tech(J.tech) || (J.lieu && bati(J.lieu)) || (!!CG.S && CG.S.goblins.some(g => g.job === j)); });
  CG.jobOk = j => { const J = CG.JOBS[j]; return !J || !J.lieu || bati(J.lieu); }; // on ne peut le donner que si l'atelier est debout
  CG.jobManque = j => { const J = CG.JOBS[j]; return J && J.lieu && !bati(J.lieu) ? 'Bâtis d\'abord : ' + CG.BUILDS[J.lieu].nom : ''; };
  // l'artisan va travailler à son atelier (le plus proche) ; sans atelier (ancienne partie), il continue chez lui
  At.lieu = function (g) { const J = CG.JOBS[g.job]; if (!J || !J.lieu || !J.craft) return null; let best = null, bd = 1e9; for (const b of CG.S.buildings) { if (b.type !== J.lieu || b.site) continue; const d = Math.hypot((b.tx + 1) * T - g.x, (b.ty + 2) * T - g.y); if (d < bd) { bd = d; best = b; } } return best; };

  // ---------- les dessins ----------
  function base(c, mur, toitA, toitB) { const m = 54, b = 108; ell(c, m, b, 46, 9, 'rgba(0,0,0,0.25)'); box(c, m - 38, b - 46, 76, 46, mur); box(c, m, b - 46, 38, 46, 'rgba(0,0,0,0.13)'); box(c, m - 38, b - 8, 76, 8, 'rgba(0,0,0,0.22)'); poly(c, [m - 48, b - 42, m + 48, b - 42, m + 20, b - 88, m - 20, b - 88], toitA); poly(c, [m, b - 42, m + 48, b - 42, m + 20, b - 88, m, b - 88], toitB); box(c, m - 48, b - 46, 96, 5, 'rgba(0,0,0,0.25)'); return [m, b]; }
  Art.extra.forge = { w: 108, h: 116, draw(c) {
    const [m, b] = base(c, '#7a7068', '#5a5a62', '#44444c');
    box(c, m + 16, b - 108, 16, 30, '#4a4038'); box(c, m + 14, b - 110, 20, 5, '#2e2822'); ell(c, m + 24, b - 112, 7, 4, 'rgba(200,200,200,0.5)'); // cheminée
    box(c, m - 30, b - 34, 26, 34, '#2a1a12'); ell(c, m - 17, b - 12, 10, 12, '#ff8a2a'); ell(c, m - 17, b - 9, 6, 8, '#ffe36b'); // le foyer
    box(c, m + 6, b - 14, 22, 5, '#3a3a42'); box(c, m + 10, b - 9, 14, 9, '#55555e'); poly(c, [m + 4, b - 19, m + 30, b - 19, m + 26, b - 13, m + 8, b - 13], '#8a8a96'); // l'enclume
    line(c, m + 22, b - 24, m + 32, b - 36, '#7a4a22', 3); box(c, m + 28, b - 42, 10, 7, '#b0b0bc'); // le marteau
  } };
  Art.extra.archerie = { w: 108, h: 116, draw(c) {
    const [m, b] = base(c, '#b08a54', '#7a9a3a', '#5e7c2c');
    box(c, m - 10, b - 28, 20, 28, '#4a3018'); // porte
    c.strokeStyle = '#6a3e16'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.arc(m - 26, b - 26, 15, -1.2, 1.2); c.stroke(); line(c, m - 20.5, b - 40, m - 20.5, b - 12, '#f4ead0', 1.2); // un arc accroché
    ell(c, m + 26, b - 26, 12, 12, '#f4ead0'); ell(c, m + 26, b - 26, 8, 8, '#d8402a'); ell(c, m + 26, b - 26, 4, 4, '#f4ead0'); ell(c, m + 26, b - 26, 1.6, 1.6, '#d8402a'); // la cible
    line(c, m + 26, b - 26, m + 40, b - 36, '#6a3e16', 2); poly(c, [m + 40, b - 36, m + 46, b - 36, m + 43, b - 41], '#e8e0d0');
  } };
  Art.extra.tannerie = { w: 108, h: 116, draw(c) {
    const [m, b] = base(c, '#9a7448', '#a86a3a', '#8a5228');
    box(c, m - 10, b - 28, 20, 28, '#3e2814');
    line(c, m - 40, b - 36, m - 12, b - 36, '#5a3a1c', 3); poly(c, [m - 37, b - 35, m - 15, b - 35, m - 12, b - 22, m - 18, b - 8, m - 26, b - 13, m - 34, b - 8, m - 40, b - 22], '#c8905a'); poly(c, [m - 31, b - 30, m - 21, b - 30, m - 22, b - 18, m - 30, b - 18], '#b07a48'); // une peau tendue
    ell(c, m + 28, b - 6, 13, 5, '#5a3a1c'); box(c, m + 15, b - 22, 26, 16, '#6e4a26'); ell(c, m + 28, b - 22, 13, 5, '#4a8a7a'); ell(c, m + 28, b - 22, 9, 3, '#6ab0a0'); // la cuve
  } };
})(window.CG);
