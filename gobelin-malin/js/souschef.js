// Goblin Malin — le sous-chef. Une case de l'arbre révèle la Hutte du sous-chef ; une fois bâtie, on peut nommer UN gobelin
// sous-chef (c'est un métier, dans la liste des métiers). Il tient le village quand le chef est parti :
//   - pendant que le chef est dans une forêt voisine, le clan travaille mieux qu'à moitié (ABSENT au lieu de la moitié) ;
//   - au retour, il vient faire son rapport : qui manque, qui est arrivé, qui a monté de niveau, ce que la réserve a gagné ou
//     perdu, les constructions tombées, le moral. Seulement si l'absence a duré (HEURES) ou si on a changé de jour.
// Tout se règle dans CG.SousChef.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Art = CG.Art, T = CG.TILE, Mo = CG.Mondes, Te = CG.Terres;
  const Sc = CG.SousChef = { TECH: 'b50', TYPE: 'souschef', LOIN: 22, PRES: 11, HEURES: 1.5, ABSENT: 0.8 }; /* LOIN / PRES : à combien de cases du feu le chef est « parti » / « revenu » */
  // ---------- la case de l'arbre, la hutte, le métier ----------
  CG.BUILDS[Sc.TYPE] = { nom: 'Hutte du sous-chef', icon: '🎖️', w: 2, h: 2, cat: 'clan', cout: { bois: 40, cuir: 6 }, tech: Sc.TECH, desc: 'La hutte de ton bras droit. Une fois bâtie, donne le métier de Sous-chef à un gobelin : il tient le village quand tu pars, et te raconte tout à ton retour.' };
  const noeud = { id: Sc.TECH, br: 'clan', t: 6, r: 6, cout: 2, icon: '🎖️', nom: 'Sous-chef', desc: 'Révèle la Hutte du sous-chef, et le métier de Sous-chef : un seul gobelin, qui tient le village quand tu es parti et te fait son rapport à ton retour.', unlock: [Sc.TYPE] };
  CG.TECH.push(noeud); if (CG.TECH_BY_ID) CG.TECH_BY_ID[noeud.id] = noeud;
  CG.JOBS.souschef = { tech: Sc.TECH, lieu: Sc.TYPE, nom: 'Sous-chef', nomF: 'Sous-cheffe', icon: '🎖️', desc: 'Ton bras droit. Un seul à la fois. Il tient le village quand tu pars, et te raconte ce qui s\'est passé à ton retour.' };
  { const i = CG.JOB_ORDER.indexOf('aucun'); if (!CG.JOB_ORDER.includes('souschef')) CG.JOB_ORDER.splice(i < 0 ? CG.JOB_ORDER.length : i, 0, 'souschef'); }
  if (CG.LINES) CG.LINES.souschef = ['Tout est en ordre, chef. Enfin, presque.', 'Pars tranquille : je garde un œil sur tout le monde.', 'J\'ai fait une liste. Puis une liste des listes.', 'Quand tu n\'es pas là, c\'est moi qui crie. Je crie bien.'];
  if (CG.Art8 && CG.Art8.LOOKS) CG.Art8.LOOKS.souschef = { tunic: '#2f6a8a', tunicF: '#3a7a9a', cape: '#c8a040' };
  Sc.qui = () => { const S = CG.S; return (S && S.goblins.find(g => g.job === 'souschef' && !g.exile)) || null; };
  { const ok0 = CG.jobOk, mq0 = CG.jobManque; // un seul sous-chef
    CG.jobOk = function (j, g) { if (j === 'souschef') { const q = Sc.qui(); if (q && q !== g) return false; } return !ok0 || ok0.apply(this, arguments); };
    CG.jobManque = function (j, g) { if (j === 'souschef') { const q = Sc.qui(); if (q && q !== g) return 'Tu as déjà un sous-chef : ' + q.name; } return mq0 ? mq0.apply(this, arguments) : ''; }; }
  // la hutte : des murs clairs, un toit bleu, une bannière dorée et une corne pour appeler le clan
  const box = (c, x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x, y, w, h); }, ell = (c, x, y, rx, ry, f) => { c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.3); c.fill(); };
  const poly = (c, p, f) => { c.fillStyle = f; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); c.fill(); };
  if (Art.extra) Art.extra[Sc.TYPE] = { w: 108, h: 116, draw(c) {
    const m = 54, b = 108; ell(c, m, b, 46, 9, 'rgba(0,0,0,0.25)'); box(c, m - 38, b - 46, 76, 46, '#c9b48a'); box(c, m, b - 46, 38, 46, 'rgba(0,0,0,0.13)'); box(c, m - 38, b - 8, 76, 8, 'rgba(0,0,0,0.22)');
    poly(c, [m - 48, b - 42, m + 48, b - 42, m + 20, b - 88, m - 20, b - 88], '#3f7a9a'); poly(c, [m, b - 42, m + 48, b - 42, m + 20, b - 88, m, b - 88], '#2f6480'); box(c, m - 48, b - 46, 96, 5, 'rgba(0,0,0,0.25)');
    box(c, m - 9, b - 30, 18, 30, '#4a3018'); box(c, m - 9, b - 30, 18, 3, '#c8a040'); ell(c, m + 5, b - 14, 1.6, 1.6, '#e8c84a'); // la porte
    box(c, m - 30, b - 30, 12, 12, '#3a2a18'); box(c, m - 28, b - 28, 8, 8, '#ffe9a0'); // une fenêtre éclairée
    box(c, m + 26, b - 104, 3, 62, '#6a4a2a'); poly(c, [m + 29, b - 102, m + 50, b - 96, m + 29, b - 84], '#e8c84a'); poly(c, [m + 29, b - 93, m + 50, b - 96, m + 29, b - 84], '#c8a040'); ell(c, m + 36, b - 94, 3, 3, '#a8322a'); // la bannière
    c.strokeStyle = '#e8dcc0'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(m + 16, b - 22); c.quadraticCurveTo(m + 28, b - 18, m + 32, b - 30); c.stroke(); ell(c, m + 32, b - 31, 4, 3, '#c8b890'); // la corne d'appel, accrochée au mur
  } };
  // ---------- le rapport ----------
  const RES = ['food', 'bois', 'minerai', 'cuir', 'or'];
  function photo() { const S = CG.S; return { day: S.day, hour: S.hour, res: RES.reduce((o, k) => { o[k] = Math.floor(S.res[k] || 0); return o; }, {}), morale: Math.round(S.morale), bat: S.buildings.filter(b => !b.site && !b.ruin).length, ruines: S.buildings.filter(b => b.ruin).length,
    gobs: S.goblins.map(g => ({ id: g.id, name: g.name, lvl: g.lvl, job: g.job, cls: g.cls || '' })) }; }
  Sc.rapport = function (a) {
    const S = CG.S, l = [], ic = k => (CG.RES[k] ? CG.RES[k].icon : k), ici = {}; S.goblins.forEach(g => { ici[g.id] = g; });
    const jours = S.day - a.day; l.push(jours > 0 ? 'Tu es parti ' + (jours === 1 ? 'un jour' : jours + ' jours') + '.' : 'Tu es parti ' + Math.max(1, Math.round(S.hour - a.hour)) + ' heures.');
    const partis = a.gobs.filter(o => !ici[o.id]).map(o => o.name); if (partis.length) l.push('💀 On a perdu ' + partis.join(', ') + '.');
    const avant = {}; a.gobs.forEach(o => { avant[o.id] = o; }); const neufs = S.goblins.filter(g => !avant[g.id]).map(g => g.name); if (neufs.length) l.push('👋 ' + neufs.join(', ') + (neufs.length > 1 ? ' ont rejoint' : ' a rejoint') + ' le clan.');
    S.goblins.forEach(g => { const o = avant[g.id]; if (!o) return; if ((g.cls || '') !== o.cls && g.cls) l.push('🌟 ' + g.name + ' a évolué.'); else if (g.job === o.job && g.lvl > o.lvl) l.push('⭐ ' + g.name + ' est maintenant niveau ' + g.lvl + '.'); });
    const plus = [], moins = []; RES.forEach(k => { const d = Math.floor(S.res[k] || 0) - a.res[k]; if (d > 0) plus.push('+' + d + ' ' + ic(k)); else if (d < 0) moins.push(d + ' ' + ic(k)); });
    if (plus.length) l.push('📦 La réserve a gagné : ' + plus.join(', ') + '.'); if (moins.length) l.push('📉 La réserve a perdu : ' + moins.join(', ') + '.');
    const ru = S.buildings.filter(b => b.ruin).length - a.ruines, ba = S.buildings.filter(b => !b.site && !b.ruin).length - a.bat; if (ru > 0) l.push('🏚️ ' + ru + (ru > 1 ? ' constructions sont tombées.' : ' construction est tombée.')); else if (ba > 0) l.push('🔨 ' + ba + (ba > 1 ? ' constructions de plus.' : ' construction de plus.'));
    const dm = Math.round(S.morale) - a.morale; if (dm >= 5) l.push('😀 Le moral a monté.'); else if (dm <= -5) l.push('😟 Le moral a baissé.');
    if (l.length === 1) l.push('Rien à signaler : tout est comme tu l\'as laissé.');
    return l;
  };
  function dire(g, a) {
    const l = Sc.rapport(a), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    UI.dialog({ goblin: g, fiche: true, who: g.name, tag: '🎖️ ' + (g.sex === 'f' ? 'sous-cheffe' : 'sous-chef'), text: 'Te revoilà, chef ! Voici mon rapport.', extra: '<div style="margin:8px 0;display:grid;gap:4px;font-size:14px">' + l.map(x => '<div>' + esc(x) + '</div>').join('') + '</div>', options: [{ label: '👍 Bien noté, merci', fn: () => { } }] });
    CG.sfx('page');
  }
  // le chef part : on prend une photo du village. Il revient : le sous-chef accourt.
  { const pa0 = Mo && Mo.partir; if (pa0) Mo.partir = function () { const S = CG.S; try { if (S && Mo.feuIci() && Sc.qui() && !S.scAbs) S.scAbs = photo(); Sc.dehors = !!(S && Sc.qui()); } catch (e) { /* rien */ } const r = pa0.apply(this, arguments); if (!r && S && S.scAbs && S.scAbs.day === S.day && Math.abs(S.scAbs.hour - S.hour) < 0.05 && pres()) S.scAbs = null; return r; }; }
  const distFeu = () => { const p = CG.S.player, f = G.firePos(); return Math.hypot(p.x - f.x, p.y - f.y) / T; };
  const pres = () => !Mo || (Mo.ici() !== 2 && Mo.feuIci() && distFeu() < Sc.PRES);
  { let tic = 0; const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); tic -= dt; if (tic > 0) return; tic = 0.5; const S = CG.S, R = CG.R; if (!S || !R || !S.goblins || (Mo && (Mo.pending || Mo.ici() === 2 || !Mo.feuIci()))) return;
    const g = Sc.qui(); if (!g) { if (S.scAbs) S.scAbs = null; return; }
    if (!S.scAbs) { if (distFeu() > Sc.LOIN) S.scAbs = photo(); return; } // il s'éloigne du village
    if (distFeu() > Sc.PRES || R.alarm || R.night || R.cine || R.ko > 0 || UI.modal) return;
    const a = S.scAbs; S.scAbs = null; Sc.dehors = false; if (S.day === a.day && S.hour - a.hour < Sc.HEURES) return; // un petit tour : pas de rapport
    if (g.hidden || g.ko === true) { UI.toast('🎖️ ' + g.name + ' a des nouvelles pour toi : ' + Sc.rapport(a).slice(1).join(' ')); return; }
    const p = S.player; G.resetGoblin(g); if (Math.hypot(g.x - p.x, g.y - p.y) > 90) { g.x = p.x + (p.face || 1) * -40; g.y = p.y + 10; G.unstick(g, 8); G.puff(g.x, g.y - 10, '#e8dcc0', 8, 70, 3); } g.face = p.x > g.x ? 1 : -1; dire(g, a);
  }; }
  // ---------- en l'absence du chef, le clan joue prudent ----------
  // Sc.absent() : le chef est loin du village (ou sur une autre carte) et un sous-chef tient la place
  Sc.absent = () => { const S = CG.S; return !!(S && S.scAbs && Sc.qui()); };
  // les travailleurs détalent de plus loin devant un monstre (PEUR_K fois plus tôt), et les chasseurs ne font plus les braves : ils rentrent comme les autres
  Sc.PEUR_K = 1.7;
  if (CG.Espion && typeof CG.Espion.PEUR === 'number') { const base = CG.Espion.PEUR; Object.defineProperty(CG.Espion, 'PEUR', { get: () => (Sc.absent() ? base * Sc.PEUR_K : base), set: () => { }, configurable: true }); }
  if (CG.Gibier && CG.Gibier.brave) { const br0 = CG.Gibier.brave; CG.Gibier.brave = function (g) { return br0.apply(this, arguments) && (!Sc.absent() || !!CG.R.alarm); }; }
  // dans une forêt voisine : avec un sous-chef, le clan travaille mieux pendant l'absence
  if (Te && typeof Te.PART === 'number') { const base = Te.PART; Object.defineProperty(Te, 'PART', { get: () => (Sc.dehors ? Math.max(base, Sc.ABSENT) : base), set: () => { }, configurable: true }); }
})(window.CG);
