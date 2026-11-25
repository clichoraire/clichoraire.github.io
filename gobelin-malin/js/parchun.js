// Goblin Malin — les parchemins à usage unique. Ce ne sont pas les parchemins qu'on copie dans le grimoire : ceux-ci se
// lisent une seule fois. On les trouve dans les coffres (assez souvent) et sur les ennemis qui font de la magie. Chacun prend
// une case de la barre des sorts (un parchemin ouvert, avec l'icône du sort dedans, et le nombre qu'il en reste) : on le lance
// comme un sort, sans mana, et il part en fumée. On peut lancer ainsi un sort qu'on ne connaît pas.
// Avec CINQ parchemins du même sort, la Tour de magie peut en faire un vrai sort (niveau I) : ça ne coûte que du temps, de
// 1 heure (1er cercle) à 24 heures (9e cercle). Tout se règle dans CG.ParchUn.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, T = CG.TILE; if (!G || !D || !UI) return;
  const Pu = CG.ParchUn = { COFFRE: 0.14, MAGE: 0.04, BOSS: 0.3, IL_EN_FAUT: 5, HEURES: [1, 24], TOUR: 'tourMagie', PRES: 70,
    PAS: { metaSquelette: 1, metaLoup: 1, metaOurs: 1, metaDemon: 1, mondes: 1, retour: 1 } }; /* PAS : ceux qui n'existent pas en usage unique */
  const sac = () => { const p = CG.S.player; return p.parchUn || (p.parchUn = {}); };
  Pu.n = id => Math.max(0, Math.floor(sac()[id] || 0));
  Pu.possibles = () => (CG.SCROLL_POOL || []).filter(id => CG.SPELLS[id] && !CG.SPELLS[id].amelio && !Pu.PAS[id]);
  Pu.tirer = function () { const l = Pu.possibles(), Ce = CG.Cercles; if (!l.length) return null; let tot = 0; const w = l.map(id => (tot += Ce && Ce.poids ? Ce.poids(id) : 1)); let x = Math.random() * tot; for (let i = 0; i < l.length; i++) if (x < w[i]) return l[i]; return l[0]; };
  Pu.barre = function (id, oui) { const p = CG.S.player, b = p.parchBarre || (p.parchBarre = {}); if (oui === undefined) oui = !b[id]; if (oui && Pu.n(id) > 0) b[id] = 1; else delete b[id]; return !!b[id]; }; /* du sac à la barre de sorts, et retour */
  Pu.donner = function (id, n, x, y) {
    const S = CG.S, p = S.player, sp = CG.SPELLS[id]; if (!sp) return false; n = n || 1; sac()[id] = Pu.n(id) + n; const k = Pu.n(id);
    G.text(x === undefined ? p.x : x, (y === undefined ? p.y : y) - 64, '📜 Parchemin : ' + sp.nom + (k > 1 ? ' (×' + k + ')' : ''), '#ffe9a8', true); CG.sfx('page');
    if (!S.parchUnDit) { S.parchUnDit = true; UI.toast('📜 Un parchemin à usage unique : il est dans ton sac (touche I). Double-clic dessus pour le mettre dans ta barre de sorts ; tu le lances une fois, sans mana. Avec ' + Pu.IL_EN_FAUT + ' du même sort, une Tour de magie les relie en un tome : le sort est alors à toi pour toujours.'); }
    else if (k === Pu.IL_EN_FAUT && !p.spells.includes(id)) UI.toast('📜 ' + Pu.IL_EN_FAUT + ' parchemins de ' + sp.nom + ' : une Tour de magie peut les relier en un tome.');
    return true;
  };
  // ---------- où on les trouve ----------
  { const oc0 = D.openChest; D.openChest = function (c) { const ouvert = c && c.open, r = oc0.apply(this, arguments); try { if (c && !ouvert && c.open && c.kind !== 'piege' && Math.random() < Pu.COFFRE) { const id = Pu.tirer(); if (id) Pu.donner(id, 1, c.x, c.y); } } catch (e) { /* jamais bloquant */ } return r; }; }
  { const he0 = G.hurtEnemy; G.hurtEnemy = function (e) { const vivant = e && !e.dead, r = he0.apply(this, arguments); if (vivant && e.dead && !e.parchVu) { e.parchVu = true; const d = CG.ENEMIES[e.type] || {}, ch = d.boss ? Pu.BOSS : d.magic ? Pu.MAGE : 0; if (ch && Math.random() < ch) { const id = Pu.tirer(); if (id) Pu.donner(id, 1, e.x, e.y); } } return r; }; }
  // ---------- les lire : une fois, sans mana ----------
  { const sc0 = G.spellCost; G.spellCost = function (id) { const R = CG.R; return R && R.parchGratis === id ? 0 : sc0.apply(this, arguments); }; }
  if (CG.Sorts2 && CG.Sorts2.cout) { const co0 = CG.Sorts2.cout; CG.Sorts2.cout = function () { const R = CG.R; return R && (R.parchGratis === 'resurrection' || R.parchRez) ? 0 : co0.apply(this, arguments); }; }
  function bruler(id) { const p = CG.S.player, b = sac(); b[id] = Math.max(0, Pu.n(id) - 1); if (!b[id]) { delete b[id]; if (p.parchBarre) delete p.parchBarre[id]; } G.puff(p.x + (p.face || 1) * 14, p.y - 30, '#f6e8bc', 10, 90, 3); G.puff(p.x + (p.face || 1) * 14, p.y - 30, '#ff8a1e', 6, 70, 2.5); }
  const cast0 = G.cast; G.cast = function (id) {
    if (typeof id !== 'string' || id.slice(0, 2) !== 'u:') return cast0.apply(this, arguments);
    const R = CG.R, b = id.slice(2); if (!R || !CG.SPELLS[b] || Pu.n(b) <= 0 || R.parchRez) return; if (R.castCd > 0 || R.ko > 0 || R.cine) return;
    R.parchGratis = b; try { G.cast(b); } finally { R.parchGratis = null; } // par G.cast : le sort passe par toutes ses enveloppes (niveaux, dessins, sons)
    if (R.castCd > 0) return bruler(b); // lancé : le parchemin part en fumée
    if (b === 'resurrection' && UI.modal) R.parchRez = true; // il choisit qui relever : le parchemin brûle seulement s'il va au bout
  };
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), R = CG.R, S = CG.S; if (!R || !S) return r;
    if (R.parchRez) { if (R.castCd > 0.5) { R.parchRez = false; bruler('resurrection'); } else if (!UI.modal) R.parchRez = false; }
    const Tr = S.transcription; if (Tr && S.day * 24 + S.hour >= Tr.fin) { S.transcription = null; const p = S.player, sp = CG.SPELLS[Tr.id]; if (sp) { if (!p.spells.includes(Tr.id)) p.spells.push(Tr.id); if (p.scrolls) delete p.scrolls[Tr.id]; G.banner('Le tome est relié !', '📖 ' + sp.nom + ' est maintenant dans ton grimoire (G).', '#e0b0ff'); CG.sfx('level'); try { CG.save(); } catch (e) { /* rien */ } } }
    return r;
  };
  // ---------- la Tour de magie : cinq parchemins pareils deviennent un vrai sort ----------
  Pu.heures = id => { const c = CG.cercle ? CG.cercle(id) || 1 : 1; return Math.round(Pu.HEURES[0] + (Pu.HEURES[1] - Pu.HEURES[0]) * (Math.min(9, Math.max(1, c)) - 1) / 8); };
  Pu.prets = () => { const p = CG.S.player; return Object.keys(sac()).filter(id => Pu.n(id) >= Pu.IL_EN_FAUT && CG.SPELLS[id] && !p.spells.includes(id)); };
  Pu.confier = function (id) { const S = CG.S; if (S.transcription || Pu.n(id) < Pu.IL_EN_FAUT || S.player.spells.includes(id)) { CG.sfx('no'); return false; } const b = sac(); b[id] -= Pu.IL_EN_FAUT; if (!b[id]) delete b[id]; const h = Pu.heures(id);
    S.transcription = { id, fin: S.day * 24 + S.hour + h, h }; CG.sfx('spell'); UI.toast('🔮 La Tour de magie relie tes cinq parchemins en un tome de ' + CG.SPELLS[id].nom + ' : prêt dans ' + h + ' heure' + (h > 1 ? 's' : '') + '.'); try { CG.save(); } catch (e) { /* rien */ } return true; };
  const tour = () => { const S = CG.S, p = S.player; let b = null, bd = Pu.PRES; for (const o of S.buildings) { if (o.type !== Pu.TOUR || o.site || o.ruin) continue; const x = (o.tx + o.w / 2) * T, y = (o.ty + o.h) * T, d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; b = o; } } return b; };
  Pu.parler = function () {
    const S = CG.S, Tr = S.transcription, l = Pu.prets(), reste = Tr ? Math.max(0, Tr.fin - (S.day * 24 + S.hour)) : 0, opts = [];
    if (!Tr) l.forEach(id => { const sp = CG.SPELLS[id], h = Pu.heures(id); opts.push({ label: sp.icon + ' ' + sp.nom, sub: Pu.IL_EN_FAUT + ' parchemins (tu en as ' + Pu.n(id) + ') · cercle ' + (CG.cercle ? CG.cercle(id) : '?') + ' · prêt dans ' + h + ' heure' + (h > 1 ? 's' : ''), fn: () => Pu.confier(id) }); });
    opts.push({ label: '👋 Plus tard' });
    const autres = Object.keys(sac()).filter(id => Pu.n(id) > 0 && Pu.n(id) < Pu.IL_EN_FAUT && CG.SPELLS[id]).map(id => CG.SPELLS[id].icon + ' ' + Pu.n(id) + '/' + Pu.IL_EN_FAUT).join('  ');
    UI.dialog({ who: 'La Tour de magie', tag: Tr ? '🔮 au travail' : '🔮 parchemins à usage unique',
      text: Tr ? 'Des plumes courent toutes seules sur un grand livre. La tour recopie « ' + CG.SPELLS[Tr.id].nom + ' » : encore ' + (reste < 1 ? 'moins d\'une heure' : Math.ceil(reste) + ' heure' + (Math.ceil(reste) > 1 ? 's' : '')) + '. Elle ne peut faire qu\'un sort à la fois.'
        : l.length ? 'Pose cinq parchemins du même sort sur le pupitre : la tour les relie en un tome, et le sort entre dans ton grimoire. Ça ne coûte rien, seulement du temps.' : 'Le pupitre est vide. Apporte cinq parchemins à usage unique du même sort (que tu ne connais pas encore) : la tour les reliera en un tome.' + (autres ? ' Tu as : ' + autres + '.' : ''), options: opts });
  };
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), S = CG.S, R = CG.R; if (it || !S || !R || R.ko > 0 || R.cine || R.build) return it;
    const b = tour(); if (!b || !(S.transcription || Object.keys(sac()).some(id => Pu.n(id) > 0))) return it;
    return { type: 'tourParch', obj: { x: (b.tx + b.w / 2) * T, y: b.ty * T - 30 }, label: S.transcription ? 'Tour de magie : voir où elle en est' : Pu.prets().length ? 'Tour de magie : relier 5 parchemins en un tome 📖' : 'Tour de magie : parchemins' };
  };
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (!it || it.type !== 'tourParch') return in0.apply(this, arguments); Pu.parler(); };
  // un petit livre qui flotte au-dessus de la tour pendant qu'elle recopie
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const S = CG.S, Tr = S && S.transcription; if (!Tr) return;
    for (const o of S.buildings) { if (o.type !== Pu.TOUR || o.site) continue; const x = (o.tx + o.w / 2) * T, y = o.ty * T - 26 + Math.sin(t * 2.4) * 3; if (!CG.onScreen(x, y)) continue; const k = 1 - Math.max(0, Math.min(1, (Tr.fin - (S.day * 24 + S.hour)) / (Tr.h || 1)));
      g.fillStyle = 'rgba(20,10,30,0.7)'; g.beginPath(); g.arc(x, y, 13, 0, 6.3); g.fill(); g.strokeStyle = '#e0b0ff'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 12, -Math.PI / 2, -Math.PI / 2 + k * 6.283); g.stroke(); g.font = '14px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('📜', x, y + 5); break; } }; }
  { const pk = CG.pack; if (pk) CG.pack = function () { const d = pk.apply(this, arguments), p = CG.S && CG.S.player; if (d && d.player && p && p.parchUn) { d.player.parchUn = p.parchUn; d.player.parchBarre = p.parchBarre || {}; } return d; }; } // la sauvegarde ne garde du chef que ce qu'on lui nomme
  Pu.essai = (id, n) => Pu.donner(id || 'feu', n || 1); // pour les essais
})(window.CG);
