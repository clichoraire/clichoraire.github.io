// Goblin Malin — le menu des constructions. Un clic (ou un toucher) sur une construction du clan ouvre sa fiche : ce qu'elle
// est, et un bouton pour chaque chose qu'on peut y faire. La hutte du chef propose de dormir, la sieste, le sac ; une hutte,
// de voir qui l'habite ; la réserve montre tout ce que le clan possède (vivres, potions, outils, équipement).
// Les actions qu'on fait d'habitude avec E en étant à côté y sont aussi : il faut être près de la construction pour les lancer.
// Pas de menu quand des ennemis sont tout près (le clic sert à frapper). Tout se règle dans CG.BatMenu.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, T = CG.TILE;
  const Bm = CG.BatMenu = { PRES: 110, CALME: 230,
    /* les actions « E » qui ne viennent pas de la construction elle-même */
    AUTRES: ['goblin', 'pet', 'visitor', 'bush', 'chest', 'chestDay', 'build', 'arbreChef', 'troncChef', 'sleep', 'home', 'sieste', 'hut', 'tombeLeve'] };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const centre = b => ({ x: (b.tx + b.w / 2) * T, y: (b.ty + b.h / 2) * T });
  const ecart = b => { const p = CG.S.player, x0 = b.tx * T, y0 = b.ty * T, x1 = x0 + b.w * T, y1 = y0 + b.h * T, dx = Math.max(x0 - p.x, 0, p.x - x1), dy = Math.max(y0 - p.y, 0, p.y - y1); return Math.hypot(dx, dy); };
  // ce que E proposerait autour de cette construction : on regarde depuis quelques points autour d'elle
  function actionsE(b) {
    const p = CG.S.player, x0 = p.x, y0 = p.y, c = centre(b), d = G.door(b), vus = {}, l = [];
    const pts = [[d.x, d.y], [d.x, d.y - 20], [d.x, d.y + 10], [c.x, b.ty * T - 18], [b.tx * T - 18, c.y], [(b.tx + b.w) * T + 18, c.y], [c.x, (b.ty + b.h) * T + 30]];
    try { for (const q of pts) { p.x = q[0]; p.y = q[1]; let it = null; try { it = D.findInteract(); } catch (e) { it = null; }
      if (!it || Bm.AUTRES.includes(it.type) || (it.obj && it.obj !== b && it.obj.tx !== undefined)) continue; const k = it.type + '|' + it.label; if (vus[k]) continue; vus[k] = 1; l.push({ type: it.type, label: it.label, x: q[0], y: q[1] }); } }
    finally { p.x = x0; p.y = y0; }
    return l;
  }
  function faire(a) { const p = CG.S.player, x0 = p.x, y0 = p.y; p.x = a.x; p.y = a.y; try { const it = D.findInteract(); if (it && it.type === a.type) D.interact(); } finally { if (p.x === a.x && p.y === a.y) { p.x = x0; p.y = y0; } } }
  // ---------- l'inventaire du clan (dans la réserve) ----------
  function inventaire() {
    const S = CG.S, p = S.player, Bq = CG.Banque, Ou = CG.Outils, Eq = CG.Equipement, c = S.banque || {}, puce = (ic, n, nom, gris) => '<span class="bm-p' + (gris ? ' vide' : '') + '"><i>' + ic + '</i><b>' + n + '</b><em>' + esc(nom) + '</em></span>';
    const F = p.fioles && typeof p.fioles === 'object' ? p.fioles : {}, somme = re => Object.keys(F).reduce((t, k) => t + (re.test(k) ? F[k] || 0 : 0), 0), vieN = (p.potions || 0) + somme(/^vie/), manaN = somme(/^mana/) + (typeof p.fioles === 'number' ? p.fioles : 0); /* les potions de tous les niveaux, ensemble */
    let h = '<div class="bm-inv"><h4>Vivres et matériaux</h4><div class="bm-l">' + Object.keys(CG.RES).map(k => puce(CG.RES[k].icon, Math.floor(S.res[k] || 0), CG.RES[k].nom, !(S.res[k] > 0))).join('') + '</div>';
    h += '<h4>Potions et parchemins</h4><div class="bm-l">' + puce('🧪', vieN, 'Potions de vie', !vieN) + puce('💧', manaN, 'Potions de mana', !manaN) + puce('📜', Object.keys(p.scrolls || {}).length, 'Parchemins à copier', !Object.keys(p.scrolls || {}).length) + (S.runes ? puce('🔷', S.runes.vierges || 0, 'Runes vierges', !S.runes.vierges) : '') + '</div>';
    const enReserve = k => [1, 2, 3].reduce((a, n) => a + (c[k + n] || 0), 0);
    if (Ou && Ou.L) h += '<h4>Outils de travail</h4><div class="bm-l">' + Object.keys(Ou.L).map(k => { const r = enReserve(k), porte = S.goblins.filter(g => g.outil === k).length; return puce(Ou.L[k].ic, r, Ou.L[k].nom + (porte ? ' (+' + porte + ' porté' + (porte > 1 ? 's' : '') + ')' : ''), !r); }).join('') + '</div>';
    const autres = Object.keys(c).filter(k => c[k] > 0).map(k => { const m = /^([a-zA-Z]+)(\d)$/.exec(k); return m ? { k: m[1], n: +m[2], q: c[k] } : null; }).filter(o => o && !(Ou && Ou.L && Ou.L[o.k]));
    h += '<h4>Équipement dans le coffre du camp</h4><div class="bm-l">' + (autres.length ? autres.map(o => { const L = Eq && Eq.L && Eq.L[o.k], nom = (Bq && Bq.NOMS[o.k] && Bq.NOMS[o.k][o.n]) || (L && (L.noms ? L.noms[o.n] : L.nom)) || o.k; return puce((Bq && Bq.IC[o.k]) || (L && L.ic) || '📦', o.q, nom); }).join('') : '<span class="bm-rien">Le coffre est vide.</span>') + '</div>';
    const sac = (p.sac || []).filter(Boolean).length; h += '<p class="bm-note">Dans ton sac : ' + sac + ' objet' + (sac > 1 ? 's' : '') + '. Clan : ' + S.goblins.length + ' gobelin' + (S.goblins.length > 1 ? 's' : '') + ' pour ' + G.capacity() + ' place' + (G.capacity() > 1 ? 's' : '') + '.</p></div>';
    return h;
  }
  Bm.inventaire = inventaire;
  // ---------- la fiche ----------
  Bm.ouvrir = function (b) {
    const S = CG.S, R = CG.R, d = CG.BUILDS[b.type] || {}, pres = ecart(b) <= Bm.PRES, opts = [], Fa = CG.Fatigue;
    const max = G.buildMaxHp ? G.buildMaxHp(b) : 0, vie = max && b.hp !== undefined ? ' Solidité : ' + Math.max(0, Math.round(b.hp)) + ' / ' + Math.round(max) + '.' : '';
    if (b.type === 'chief') {
      const peut = D.canSleep();
      opts.push({ label: '🌙 Dormir jusqu\'au matin', sub: peut ? 'La nuit passe d\'un coup' : R.alarm ? 'Pas pendant une attaque' : S.hour < 19 ? 'À partir de 19 h' : 'Pas maintenant', disabled: !peut, fn: () => D.sleep() });
      if (CG.Sieste) opts.push({ label: '😴 Faire la sieste', sub: R.alarm ? 'Pas pendant une attaque' : '+' + CG.Sieste.SOIN + ' ❤ par demi-heure', disabled: !!R.alarm || !!R.sieste, fn: () => CG.Sieste.debut() });
      if (Fa && Fa.sieste) { const ok = Fa.peutSieste(); opts.push({ label: '🥱 Dormir ' + Fa.SIESTE.heures + ' heures d\'un coup', sub: ok ? 'Enlève ' + Fa.SIESTE.heures + ' crans de fatigue' : Fa.crans() < 1 ? 'Tu n\'es pas fatigué' : S.siesteJour === S.day ? 'Déjà fait aujourd\'hui' : 'Seulement de jour, au calme', disabled: !ok, fn: () => Fa.sieste() }); }
      opts.push({ label: '🎒 Mon sac et le coffre du camp', fn: () => { if (CG.Inventaire) CG.Inventaire.ouvrir({ force: true }); } });
    }
    if (b.type === 'hut') opts.push({ label: '👥 Voir qui habite ici', fn: () => UI.hut(b) });
    if (b.type === 'stock' || b.type === 'depot') opts.push({ label: '🎒 Ouvrir le coffre du camp', fn: () => { if (CG.Inventaire) CG.Inventaire.ouvrir({ force: true, coffre: true }); } });
    if (!b.site) actionsE(b).forEach(a => opts.push({ label: a.label, sub: 'Approche-toi pour le faire', disabled: !pres, fn: () => faire(a) }));
    else opts.push({ label: '🔨 Donner un coup de marteau', sub: 'Approche-toi du chantier', disabled: !pres, fn: () => { const q = G.door(b); faire({ type: 'site', x: q.x, y: q.y - 20 }); } });
    opts.push({ label: 'Fermer', echap: true });
    const stock = b.type === 'stock' || b.type === 'depot';
    UI.dialog({ who: (d.icon ? d.icon + ' ' : '') + (d.nom || 'Construction'), tag: b.site ? '🚧 en chantier' : '', text: (d.desc || '') + vie, extra: stock ? inventaire() : '', infos: true, options: opts });
    const el = document.getElementById('dialog'); if (el) el.classList.toggle('bm-large', stock);
  };
  { const dg0 = UI.dialog; UI.dialog = function () { const el = document.getElementById('dialog'); if (el) el.classList.remove('bm-large'); return dg0.apply(this, arguments); }; }
  // ---------- le clic ----------
  // la construction sous le clic : sa case, ou la case juste en dessous (les huttes et les tours dépassent vers le haut). Pas les chemins, clôtures, murs et pièges : là, le clic frappe. Pas les chantiers : leur ✖ garde son clic.
  Bm.sous = function (wx, wy) { const tx = Math.floor(wx / T), ty = Math.floor(wy / T); for (const q of [[tx, ty], [tx, ty + 1]]) { const b = G.buildingAt(q[0], q[1]); if (!b || b.site) continue; const d = CG.BUILDS[b.type] || {}; if (d.flat || d.terrain || d.tile || d.hp || d.repeat) continue; return b; } return null; };
  window.addEventListener('mousedown', function (e) {
    try { if (e.button !== 0 || !CG.running || !CG.S || !CG.R || UI.modal || !e.target || e.target.id !== 'game' || !CG.versMonde) return; const R = CG.R, S = CG.S, p = S.player;
      if (R.build || R.ko > 0 || R.cine || R.night || R.sieste || R.alarm) return; const m = CG.versMonde(e.clientX, e.clientY);
      const b = Bm.sous(m.x, m.y); if (!b) return;
      if (R.enemies.some(q => !q.dead && !(q.charm > 0) && !q.calm && Math.hypot(q.x - p.x, q.y - p.y) < Bm.CALME)) return; // des ennemis tout près : on se bat
      e.stopImmediatePropagation(); e.preventDefault(); CG.sfx('click'); Bm.ouvrir(b);
    } catch (err) { /* jamais bloquant : le clic garde son effet habituel */ }
  }, true);
  if (!document.getElementById('bm-css')) { const st = document.createElement('style'); st.id = 'bm-css'; st.textContent =
    '#dialog.bm-large{max-width:min(720px,94vw)}.bm-inv{margin:6px 0 10px;max-height:46vh;overflow:auto;padding:0 4px 8px 0}.bm-inv h4{margin:10px 0 5px;font:700 12px "Trebuchet MS",system-ui,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#e8c860}'
    + '.bm-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:5px}.bm-p{display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:9px;background:rgba(255,236,190,.1);border:1px solid rgba(255,220,150,.22);font:600 13px "Trebuchet MS",system-ui,sans-serif;color:#fbf0d4}'
    + '.bm-p i{font-style:normal;font-size:16px}.bm-p b{min-width:22px;color:#ffe36b}.bm-p em{font-style:normal;font-weight:400;font-size:12px;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bm-p.vide{opacity:.45}.bm-rien,.bm-note{font:400 12.5px "Trebuchet MS",system-ui,sans-serif;color:#d8c8a0;margin:6px 0 0}';
    document.head.appendChild(st); }
})(window.CG);
