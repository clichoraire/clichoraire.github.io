// Goblin Malin — l'inventaire, à la place de l'ancienne banque à menus.
//   Le sac du chef (touche I) : quelques cases qu'on porte sur soi. Ce qu'on trouve ou qu'on achète y arrive d'abord.
//   Le coffre du camp, dans la hutte du chef : une grille plus grande. En bois pour commencer ; on l'améliore dans sa fenêtre, contre des ressources (comme le feu de camp) : pierre, puis métal.
//   On glisse les objets d'une case à l'autre, sur le chef (arme, armure) ou sur un gobelin (épée, arc, armure). Double-clic : équiper ou ranger d'un coup.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Bq = CG.Banque, pick = CG.pick; if (!Bq) return;
  const Iv = CG.Inventaire = { SAC: 16, CHEF_EPEE: [0, 4, 8, 12], CHEF_ARMURE: [0, 15, 30, 45] };
  Iv.COFFRES = [null, { nom: 'Coffre en bois', n: 16, col: 4, cls: 'bois' }, { nom: 'Coffre en pierre', n: 24, col: 6, cls: 'pierre', cout: { bois: 150, minerai: 120, or: 400 } }, { nom: 'Coffre en métal', n: 36, col: 6, cls: 'metal', cout: { bois: 300, minerai: 350, or: 1200 } }];
  const QUAL = ['', 'Ordinaire', 'Belle pièce', 'Pièce de maître'], ROM = ['', 'I', 'II', 'III'];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  if (CG.Mondes && CG.Mondes.GLOBAL) ['coffre', 'coffreNiv'].forEach(k => { if (!CG.Mondes.GLOBAL.includes(k)) CG.Mondes.GLOBAL.push(k); });
  // ---------- les piles : potions et parchemins ----------
  // Dans le sac, une pile montre ce que le chef a vraiment sur lui (p.potions, p.fioles, p.scrolls) : c'est ce qu'il peut boire ou copier.
  // Dans le coffre, la pile garde son propre compte (it.q) : rangée là, elle n'est plus sur lui.
  const TAILLE = ['', 'Petite', 'Moyenne', 'Grosse'];
  const pile = it => !!it && (it.k === 'fiole' || it.k === 'parch' || it.k === 'recette'), memeP = (a, b) => pile(a) && pile(b) && a.k === b.k && a.id === b.id;
  const fio = () => { const p = CG.S.player; return p.fioles || (p.fioles = {}); }, scr = () => { const p = CG.S.player; return p.scrolls || (p.scrolls = {}); };
  const pap = () => { const p = CG.S.player; return p.papiers || (p.papiers = {}); };
  const compte = it => it.k === 'recette' ? (pap()[it.id] ? 1 : 0) : it.k === 'parch' ? (scr()[it.id] ? 1 : 0) : it.id === 'vie1' ? CG.S.player.potions || 0 : fio()[it.id] || 0;
  function fixer(it, n) { n = Math.max(0, n); if (it.k === 'recette') { if (n) pap()[it.id] = 1; else delete pap()[it.id]; } else if (it.k === 'parch') { if (n) scr()[it.id] = 1; else delete scr()[it.id]; } else if (it.id === 'vie1') CG.S.player.potions = n; else fio()[it.id] = n; }
  const FIOLES = () => ['vie1', 'vie2', 'vie3', 'mana1', 'mana2', 'mana3'].concat(CG.Potions ? Object.keys(CG.Potions.L) : []);
  Iv.fiche = function (it) {
    if (it.k === 'recette') { const q = (CG.Potions && CG.Potions.L[it.id]) || {}; return { ic: '📄', coin: q.ic || '', nom: 'Recette : ' + (q.nom || it.id), desc: q.desc || '', aide: 'Un bout de papier griffonné. Porte-le à ton chaudron pour que tes alchimistes puissent le lire.', col: q.col || '#d8d0b0' }; }
    if (it.k === 'parch') { const sp = CG.SPELLS[it.id] || {}; return { ic: '📜', coin: sp.icon || '', nom: 'Parchemin : ' + (sp.nom || it.id), desc: CG.SPELLS[it.id] ? 'Cercle de magie ' + CG.cercle(it.id) : '', aide: 'Dans ton sac : ouvre ton grimoire (G) pour le copier.', col: '#e8c860' }; }
    const q = CG.Potions && CG.Potions.L[it.id], A = CG.Alchimie || { VIE: [0, 45, 110, 250], MANA: [0, 25, 60, 140] }; if (q) return { ic: q.ic, nom: q.nom, desc: q.desc, aide: 'Dans ton sac : touche V pour la boire.', col: q.col };
    const vie = it.id[0] === 'v', n = A.niveau ? A.niveau() : +it.id.slice(-1), rend = vie ? (A.soinVie ? A.soinVie() : A.VIE[n]) : (A.soinMana ? A.soinMana() : A.MANA[n]); return { ic: vie ? '❤️' : '💧', nom: TAILLE[n] + ' potion de ' + (vie ? 'vie' : 'mana'), desc: 'Rend ' + rend + (vie ? ' points de vie' : ' points de mana') + '.', aide: 'Dans ton sac : touche ' + (vie ? 'Q' : 'Z') + ' pour la boire.', col: vie ? '#f06a80' : '#6aa8f8' };
  };
  // le sac suit ce que le chef a sur lui : une case par sorte de potion et par parchemin (le sac déborde s'il le faut, rien ne se perd)
  function synchro(s) {
    const vus = []; for (let i = 0; i < s.length; i++) { const it = s[i]; if (!pile(it)) continue; if (compte(it) <= 0 || vus.some(o => memeP(o, it))) s[i] = null; else vus.push(it); }
    const l = FIOLES().map(id => ({ k: 'fiole', id })).concat(Object.keys(scr()).filter(id => CG.SPELLS[id]).map(id => ({ k: 'parch', id }))).concat(Object.keys(pap()).filter(id => CG.Potions && CG.Potions.L[id]).map(id => ({ k: 'recette', id })));
    for (const it of l) { if (compte(it) <= 0 || vus.some(o => memeP(o, it))) continue; const i = s.indexOf(null); if (i >= 0) s[i] = it; else s.push(it); }
    while (s.length > Iv.SAC && !s[s.length - 1]) s.pop();
  }
  // boire une potion précise (double-clic dans le sac)
  Iv.boire = function (id) {
    const S = CG.S, R = CG.R, p = S.player, it = { k: 'fiole', id }, A = CG.Alchimie; if (compte(it) <= 0 || R.ko > 0) { CG.sfx('no'); return false; }
    if (CG.Potions && CG.Potions.L[id]) { if (!CG.Potions.boire(id)) return false; dire(CG.Potions.L[id].ic + ' ' + CG.Potions.L[id].nom + ' : c\'est bu !'); return true; }
    const n = +id.slice(-1), vie = id[0] === 'v', gain = vie ? (A ? A.VIE[n] : 45) : (A ? A.MANA[n] : 25); if (vie ? p.hp >= p.maxhp : p.mp >= p.maxmp) { CG.sfx('no'); return dire(vie ? 'Ta vie est déjà pleine.' : 'Ton mana est déjà plein.'); }
    fixer(it, compte(it) - 1); if (vie) p.hp = Math.min(p.maxhp, p.hp + gain); else p.mp = Math.min(p.maxmp, p.mp + gain); G.text(p.x, p.y - 56, '+' + gain + (vie ? ' 🧪' : ' 💧'), vie ? '#7dff8a' : '#9ad0ff'); CG.sfx('heal'); dire('+' + gain + (vie ? ' points de vie' : ' points de mana')); return true;
  };
  // ---------- les cases ----------
  const sac = () => { const p = CG.S.player; if (!p.sac) p.sac = []; while (p.sac.length < Iv.SAC) p.sac.push(null); synchro(p.sac); return p.sac; };
  const cap = () => Iv.COFFRES[Math.max(1, Math.min(3, CG.S.coffreNiv || 1))]; /* voir Iv.niv */
  function cof() { const S = CG.S; if (!S.coffre) S.coffre = [];
    while (S.coffre.length < cap().n) S.coffre.push(null);
    if (S.banque) { const vieux = S.banque; delete S.banque; Object.keys(vieux).forEach(key => { for (let i = 0; i < (vieux[key] || 0); i++) { const it = { k: key.slice(0, -1), n: +key.slice(-1) }, j = S.coffre.indexOf(null); if (j >= 0) S.coffre[j] = it; else S.coffre.push(it); } }); } // l'ancienne banque : tout passe dans le coffre (qui déborde s'il le faut)
    return S.coffre; }
  Iv.niv = () => Math.max(1, Math.min(3, CG.S.coffreNiv || 1));
  Iv.ameliorer = function () { const S = CG.S, l = Iv.niv(), P = Iv.COFFRES[l + 1]; if (!P || !G.canPay(P.cout)) { CG.sfx('no'); return false; } G.pay(P.cout); S.coffreNiv = l + 1; cof(); CG.sfx('build'); CG.sfx('level'); dire('🧰 ' + P.nom + ' : ' + P.n + ' cases !'); return true; };
  const porte = () => { const p = CG.S.player; return p.porte || (p.porte = { arme: null, armure: null }); };
  const libre = (l, max) => { for (let i = 0; i < Math.min(l.length, max); i++) if (!l[i]) return i; return -1; };
  // range un objet : dans le sac ou le coffre d'abord selon « pref », puis dans l'autre ; à défaut, le coffre déborde (rien ne se perd)
  Iv.ajouter = function (k, n, pref) { const it = { k, n }, s = sac(), c = cof(), ordre = pref === 'sac' ? [[s, Iv.SAC, 'sac'], [c, cap().n, 'coffre']] : [[c, cap().n, 'coffre'], [s, Iv.SAC, 'sac']];
    for (const o of ordre) { const i = libre(o[0], o[1]); if (i >= 0) { o[0][i] = it; return o[2]; } } c.push(it); return 'coffre'; };
  Iv.ou = z => z === 'sac' ? 'dans ton sac (touche I)' : 'dans le coffre du camp, dans ta hutte';
  Bq.deposer = function (k, n, q, pref) { let z = 'coffre'; for (let i = 0; i < (q || 1); i++) z = Iv.ajouter(k, n, pref); return z; };
  Bq.total = () => cof().filter(Boolean).length;
  const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments); sac(); cof(); porte(); return r; };
  // la sauvegarde ne gardait du chef qu'une liste fixe de champs : on y ajoute son sac, ce qu'il porte, ses recettes et son sort prêté
  { const pk = CG.pack; CG.pack = function () { const d = pk.apply(this, arguments), p = CG.S.player; if (d && d.player) ['sac', 'porte', 'recettes', 'papiers', 'pret'].forEach(k => { if (p[k] !== undefined && p[k] !== null) d.player[k] = p[k]; }); return d; }; }
  // ---------- ce que le chef porte ----------
  { const pd = G.playerDmg; G.playerDmg = function () { const a = CG.S.player.porte && CG.S.player.porte.arme; return pd.apply(this, arguments) + (a ? Iv.CHEF_EPEE[a.n] || 0 : 0); }; }
  function chefArmure(avant, apres) { const p = CG.S.player, d = (apres ? Iv.CHEF_ARMURE[apres.n] : 0) - (avant ? Iv.CHEF_ARMURE[avant.n] : 0); if (!d) return; p.maxhp += d; p.hp = Math.max(1, Math.min(p.maxhp, p.hp + Math.max(0, d))); }
  Iv.effet = (it, chef) => chef ? (OUT()[it.k] ? 'C\'est un outil de travail : confie-le à un gobelin' : it.k === 'epee' ? '+' + Iv.CHEF_EPEE[it.n] + ' dégâts' : it.k === 'armure' ? '+' + Iv.CHEF_ARMURE[it.n] + ' vie maximum' : 'Tu ne sais pas tirer à l\'arc') : Bq.effet(it.k, it.n);
  // ---------- lire, écrire, déplacer ----------
  const TRAV = ['pioche', 'hache', 'gant'], caseC = it => (it.k === 'armure' ? 'armure' : TRAV.includes(it.k) ? it.k : 'arme'); /* la case du chef où va cet objet */
  const nivG = (g, k) => (g.equip && +g.equip[k]) || 0, OUT = () => (CG.Outils ? CG.Outils.L : {}), caseG = it => (OUT()[it.k] ? 'outil' : TRAV.includes(it.k) ? 'travail' : it.k); /* la case d'un gobelin où va cet objet */
  let vue = null; // { cible: 'chef' | gobelin, coffre, choix }
  const cibleDe = s => s.z === 'gob' ? CG.S.goblins.find(g => g.id === s.g) : null;
  function lire(s) { if (s.z === 'sac') { const it = sac()[s.i] || null; return pile(it) ? { k: it.k, id: it.id, q: compte(it) } : it; } if (s.z === 'cof') return cof()[s.i] || null; if (s.z === 'chef') return porte()[s.i] || null; const g = cibleDe(s); if (s.i === 'outil') return g && g.outil && OUT()[g.outil] ? { k: g.outil, n: 1 } : null; if (s.i === 'travail') return g && g.travail ? { k: g.travail.k, n: g.travail.n } : null; const n = g ? nivG(g, s.i) : 0; return n ? { k: s.i, n: Math.min(Bq.MAX, n) } : null; }
  function accepte(s, it) { if (s.z === 'sac' || s.z === 'cof') return true; if (s.z === 'chef') return s.i === 'arme' ? it.k === 'epee' : it.k === s.i; return !!cibleDe(s) && (s.i === 'outil' ? !!OUT()[it.k] : s.i === 'travail' ? TRAV.includes(it.k) : s.i === it.k); }
  function ecrire(s, it) {
    if (s.z === 'sac') { const l = sac(), vieux = l[s.i]; l[s.i] = null; if (pile(vieux)) fixer(vieux, 0); /* la pile quitte le chef */
      if (pile(it)) { const deja = l.some(o => memeP(o, it)); fixer(it, compte(it) + (it.q || 1)); if (!deja) l[s.i] = { k: it.k, id: it.id }; } else l[s.i] = it || null; }
    else if (s.z === 'cof') cof()[s.i] = pile(it) ? { k: it.k, id: it.id, q: it.q || 1 } : it || null;
    else if (s.z === 'chef') { const a = porte()[s.i]; porte()[s.i] = it || null; if (s.i === 'armure') chefArmure(a, it); }
    else { const g = cibleDe(s); if (!g) return; if (s.i === 'outil') { if (it) g.outil = it.k; else delete g.outil; g.charge = 0; return; } if (s.i === 'travail') { if (it) g.travail = { k: it.k, n: it.n }; else delete g.travail; return; } const mh0 = G.gobMaxHp(g); g.equip = g.equip || {}; if (it) g.equip[s.i] = it.n; else delete g.equip[s.i]; const mh = G.gobMaxHp(g); g.hp = Math.max(1, Math.min(mh, g.hp + Math.max(0, mh - mh0))); }
  }
  const meme = (a, b) => a.z === b.z && a.i === b.i && a.g === b.g;
  Iv.deplacer = function (a, b) {
    const ia = lire(a); if (!ia || meme(a, b)) return false; if (!accepte(b, ia)) { CG.sfx('no'); return dire(b.z === 'chef' && ia.k === 'arc' ? 'Tu ne sais pas tirer à l\'arc : confie-le à un gobelin.' : 'Cet objet ne va pas à cet endroit.'); }
    if (pile(ia)) { const ib0 = lire(b); // deux piles de la même sorte se réunissent
      if (b.z === 'sac' && a.z === 'cof' && sac().some(o => memeP(o, ia))) { ecrire(a, null); fixer(ia, compte(ia) + (ia.q || 1)); CG.sfx('click'); return true; }
      if (b.z === 'cof' && memeP(ib0, ia)) { ecrire(a, null); cof()[b.i].q = (ib0.q || 1) + (ia.q || 1); CG.sfx('click'); return true; } }
    const ib = lire(b); let retour = a; if (ib && !accepte(a, ib)) { const i = libre(sac(), Iv.SAC), j = vue && vue.coffre ? libre(cof(), cap().n) : -1; if (i >= 0) retour = { z: 'sac', i }; else if (j >= 0) retour = { z: 'cof', i: j }; else { CG.sfx('no'); return dire('Plus de place pour ranger ce qu\'il porte.'); } }
    if (meme(retour, a)) { ecrire(a, null); ecrire(b, null); ecrire(b, ia); ecrire(a, ib); } else { ecrire(a, null); ecrire(b, null); ecrire(b, ia); ecrire(retour, ib); }
    CG.sfx(b.z === 'chef' || b.z === 'gob' ? 'build' : 'click');
    if (b.z === 'gob') { const g = cibleDe(b); if (g) { G.text(g.x, g.y - 46, Bq.IC[ia.k] + ' ' + Bq.NOMS[ia.k][ia.n], '#bfe8ff', true); G.say(g, pick(OUT()[ia.k] ? (OUT()[ia.k].job === g.job ? ['Oh ! Avec ça, je vais en rapporter trois fois plus, chef !', 'Enfin ! Mes pauvres bras te disent merci, chef.', 'C\'est pour moi ?! Je vais le remplir à ras bord !'] : ['Euh... merci, chef. Mais dans mon métier, ça ne me sert à rien.', 'C\'est joli. Je fais quoi avec, moi ?']) : ia.k === 'armure' ? ['Oh ! Elle me va comme un gant, chef !', 'Avec ça, je crains plus rien. Presque rien.'] : g.job === 'garde' ? ['Belle pièce, chef. Ils vont la sentir passer !', 'Merci, chef ! Je vais en prendre soin.'] : ['Pour moi ?! Bon... je me défendrai, chef. Promis.', 'Je suis pas garde, mais qu\'ils y viennent !']), 3.5); } }
    return true;
  };
  // double-clic : du sac vers celui qu'on regarde (sinon vers le coffre), et de partout ailleurs vers le sac
  Iv.vite = function (a) {
    const it = lire(a); if (!it || !vue) return false; let s = libre(sac(), Iv.SAC), c = vue.coffre ? libre(cof(), cap().n) : -1;
    if (pile(it)) { const cs = vue.coffre ? cof().findIndex(o => memeP(o, it)) : -1, ss = sac().findIndex(o => memeP(o, it)); if (cs >= 0) c = cs; /* on complète la pile déjà rangée */
      if (a.z === 'sac') { if (c >= 0) return Iv.deplacer(a, { z: 'cof', i: c }); if (vue.coffre) { CG.sfx('no'); return dire('Le coffre est plein.'); } if (it.k === 'fiole') return Iv.boire(it.id); if (it.k === 'recette') return dire('📄 Porte cette recette à ton chaudron : c\'est là qu\'elle sert.'); UI.dismiss(); if (UI.grimoire) UI.grimoire(); return true; }
      if (ss >= 0) s = ss; }
    if (a.z === 'sac') { const b = vue.cible === 'chef' ? { z: 'chef', i: caseC(it) } : { z: 'gob', g: vue.cible.id, i: caseG(it) }; if (accepte(b, it)) return Iv.deplacer(a, b); if (c >= 0) return Iv.deplacer(a, { z: 'cof', i: c }); CG.sfx('no'); return dire(vue.coffre ? 'Le coffre est plein.' : 'Tu ne peux pas porter ça.'); }
    if (s >= 0) return Iv.deplacer(a, { z: 'sac', i: s }); if (a.z !== 'cof' && c >= 0) return Iv.deplacer(a, { z: 'cof', i: c }); CG.sfx('no'); return dire('Ton sac est plein.');
  };
  // ---------- la fenêtre ----------
  if (!document.getElementById('iv-css')) { const st = document.createElement('style'); st.id = 'iv-css'; st.textContent =
    '#panel.inventaire{max-width:1010px;max-height:94vh;overflow-y:auto;background:linear-gradient(180deg,#2a2018,#1a140e);border:2px solid #7a5a34;box-shadow:0 18px 60px rgba(0,0,0,.7),inset 0 0 50px rgba(0,0,0,.45);color:#eadcc0;user-select:none;-webkit-user-select:none}' +
    '.iv-haut{display:flex;align-items:baseline;justify-content:space-between;margin:0 4px 10px}.iv-haut h2{margin:0;font:700 24px Luminari,"Apple Chancery",Georgia,fantasy;color:#ffe9b8;text-shadow:0 2px 0 #000}.iv-haut small{opacity:.75;font-size:12.5px}' +
    '.iv-cols{display:flex;gap:12px;align-items:flex-start;justify-content:center}.iv-bloc{background:rgba(0,0,0,.28);border:1px solid rgba(255,220,150,.18);border-radius:12px;padding:10px 12px}.iv-bloc h3{margin:0 0 8px;font:700 14px "Trebuchet MS",system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:#d8b878;display:flex;justify-content:space-between;gap:10px}.iv-bloc h3 i{font-style:normal;opacity:.7;text-transform:none;letter-spacing:0}' +
    '.iv-qui{width:252px;flex:0 0 auto}.iv-nom{font:700 17px "Trebuchet MS",system-ui,sans-serif;color:#fff3d0}.iv-stat{font-size:12.5px;opacity:.85;margin:2px 0 10px;line-height:1.45}.iv-port{display:flex;flex-wrap:wrap;gap:6px 9px;justify-content:center;margin-bottom:10px}.iv-it svg.fiole{width:26px;height:35px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.5))}.iv-port>div{text-align:center;font-size:11.5px;color:#c8b088}' +
    '.iv-gens{display:flex;flex-wrap:wrap;gap:5px;max-height:168px;overflow:auto;padding-top:8px;border-top:1px solid rgba(255,220,150,.15)}.iv-g{padding:3px 8px;border-radius:12px;border:1px solid rgba(255,220,150,.25);background:rgba(0,0,0,.3);color:#eadcc0;font:600 12px "Trebuchet MS",system-ui,sans-serif;cursor:pointer}.iv-g.on{background:#6a4a1e;border-color:#ffd88a;color:#fff}.iv-g.vise{border-color:#8af0a8;box-shadow:0 0 10px rgba(120,240,160,.6)}' +
    '.iv-grille{display:grid;grid-template-columns:repeat(4,52px);gap:5px}.iv-s{width:52px;height:52px;border-radius:9px;background:linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.32));box-shadow:inset 0 2px 5px rgba(0,0,0,.7),inset 0 0 0 1px rgba(255,220,150,.14);position:relative;display:flex;align-items:center;justify-content:center}' +
    '.iv-s.ok{box-shadow:inset 0 2px 5px rgba(0,0,0,.7),inset 0 0 0 2px #8af0a8,0 0 10px rgba(120,240,160,.45)}.iv-s.vise{background:rgba(90,200,120,.3)}.iv-s .fant{font-size:24px;opacity:.16;filter:grayscale(1)}' +
    '.iv-it{position:absolute;inset:3px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:26px;cursor:grab;background:linear-gradient(160deg,#4a4038,#2c2620);box-shadow:inset 0 0 0 2px var(--q),0 2px 4px rgba(0,0,0,.5);touch-action:none}.iv-it u{position:absolute;right:4px;bottom:2px;font:800 11px "Trebuchet MS",system-ui,sans-serif;color:var(--q);text-decoration:none;text-shadow:0 1px 2px #000}.iv-it.q1{--q:#b8b0a0}.iv-it.q2{--q:#5ad06a}.iv-it.q3{--q:#5aa8ff}.iv-it.pris{opacity:.25}.iv-it u.coin{font-size:13px;right:2px;bottom:1px}' +
    '#iv-fant{position:fixed;z-index:200;width:46px;height:46px;margin:-23px 0 0 -23px;pointer-events:none;inset:auto}#iv-tip{position:fixed;z-index:190;pointer-events:none;padding:8px 12px;border-radius:10px;background:rgba(14,11,8,.97);border:1px solid var(--q,#b8b0a0);box-shadow:0 8px 22px rgba(0,0,0,.6);font:500 12.5px/1.4 "Trebuchet MS",system-ui,sans-serif;color:#cfc0a2;max-width:240px}#iv-tip b{display:block;font-size:15px;color:var(--q,#fff)}#iv-tip i{display:block;font-style:normal;color:#8ae08a}' +
    // le coffre : des planches, deux bandes de fer, une serrure
    '.iv-coffre{position:relative;flex:0 0 auto;padding:34px 14px 14px;border-radius:14px 14px 10px 10px;border:2px solid #3a2410;box-shadow:inset 0 0 26px rgba(0,0,0,.55),0 6px 14px rgba(0,0,0,.5)}' +
    '.iv-coffre.bois{background:repeating-linear-gradient(90deg,#7a5228 0 46px,#6a4620 46px 48px,#80582c 48px 94px,#5e3e1c 94px 96px)}.iv-coffre.pierre{background:repeating-linear-gradient(90deg,#7c7c84 0 60px,#5e5e66 60px 62px,#86868e 62px 118px,#585860 118px 120px);border-color:#34343a}.iv-coffre.metal{background:linear-gradient(160deg,#8a96a4,#56606c 55%,#7a8694);border-color:#2a3038}' +
    '.iv-coffre::before{content:"";position:absolute;left:-2px;right:-2px;top:20px;height:9px;background:linear-gradient(180deg,#8a8e96,#4a4e56);box-shadow:0 2px 3px rgba(0,0,0,.5)}.iv-coffre::after{content:"";position:absolute;left:50%;top:10px;width:26px;height:30px;margin-left:-13px;border-radius:5px 5px 9px 9px;background:radial-gradient(circle at 50% 42%,#1a1410 0 3.5px,transparent 4px),linear-gradient(180deg,#e8c24a,#a8801e);box-shadow:0 2px 4px rgba(0,0,0,.6)}' +
    '.iv-coffre .iv-titre{position:absolute;left:12px;top:1px;font:700 12.5px "Trebuchet MS",system-ui,sans-serif;color:#ffe9b8;text-shadow:0 1px 2px #000}.iv-coffre .iv-nb{position:absolute;right:12px;top:1px;font:700 12.5px "Trebuchet MS",system-ui,sans-serif;color:#ffe9b8;text-shadow:0 1px 2px #000}.iv-coffre .iv-s{background:linear-gradient(180deg,rgba(20,12,4,.72),rgba(20,12,4,.5))}' +
    '.iv-plus{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin:10px 4px 0;font-size:13px}.iv-plus button{padding:6px 14px}.iv-plus button:disabled{opacity:.45;cursor:default}.iv-plus b.non{color:#ff9a8a}' +
    '.iv-chef{display:block;margin:0 auto 4px}.iv-fiche{font-size:12.5px;line-height:1.55;margin:2px 0 10px}.iv-fiche div{display:flex;justify-content:space-between;gap:8px;border-bottom:1px dotted rgba(255,220,150,.14)}.iv-fiche b{color:#fff3d0;font-weight:700}' +
    '.iv-msg{min-height:20px;margin:10px 0 2px;text-align:center;font-size:13px;color:#ffd08a}.iv-bas{display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:12.5px;opacity:.9}.iv-bas button{padding:7px 20px}';
    document.head.appendChild(st); }
  let msg = '', msgT = 0; function dire(t) { msg = t; msgT = Date.now(); const el = document.querySelector('#panel .iv-msg'); if (el) el.textContent = t; return false; }
  const att = s => 'data-z="' + s.z + '" data-i="' + s.i + '"' + (s.g !== undefined ? ' data-g="' + s.g + '"' : '');
  const FANT = { arme: '🗡️', armure: '🧥', epee: '🗡️', arc: '🏹', outil: '🧺', pioche: '⛏️', hache: '🪓', gant: '🧤', travail: '⛏️' }, NOMCASE = { arme: 'Arme', armure: 'Armure', epee: 'Épée', arc: 'Arc', outil: 'Spécial', pioche: 'Pioche', hache: 'Hache', gant: 'Gants', travail: 'Outil' };
  const flacon = it => { const A = CG.Alchimie; return it.k === 'fiole' && A && A.svg && /^(vie|mana)\d$/.test(it.id) ? A.svg(it.id[0] === 'v' ? 'vie' : 'mana', A.niveau ? A.niveau() : +it.id.slice(-1)) : null; }; /* une vraie fiole, puis une fiole à fond large, puis un ballon */
  function objH(it) { if (!pile(it)) return '<div class="iv-it q' + it.n + '">' + Bq.IC[it.k] + (OUT()[it.k] ? '' : '<u>' + ROM[it.n] + '</u>') + '</div>'; const F = Iv.fiche(it); return '<div class="iv-it" style="--q:' + F.col + '">' + (flacon(it) || F.ic) + (it.k === 'parch' || it.k === 'recette' ? '<u class="coin">' + F.coin + '</u>' : '<u>' + (it.q || 1) + '</u>') + '</div>'; }
  function caseH(s, fant) { const it = lire(s); return '<div class="iv-s" ' + att(s) + '>' + (it ? objH(it) : fant ? '<span class="fant">' + fant + '</span>' : '') + '</div>'; }
  function rendu() {
    if (!vue || !UI.modal || UI.modal.name !== 'inventaire') return; const S = CG.S, p = S.player, g = vue.cible === 'chef' ? null : vue.cible, C = cap(), c = cof(), s = sac();
    const cases = g ? ['epee', 'arc', 'armure', 'outil', 'travail'].map(k => ({ z: 'gob', g: g.id, i: k })) : ['arme', 'armure'].map(k => ({ z: 'chef', i: k }));
    const stat = g ? CG.JOBS[g.job].icon + ' ' + (g.sex === 'f' && CG.JOBS[g.job].nomF ? CG.JOBS[g.job].nomF : CG.JOBS[g.job].nom) + ' · niv. ' + g.lvl + '<br>❤️ ' + Math.ceil(g.hp) + ' / ' + G.gobMaxHp(g) + (g.equip && (g.equip.epee || g.equip.arc) || g.job === 'garde' ? ' · ⚔️ ' + Math.round(G.guardDmg(g) * 10) / 10 : '') : '';
    const li = (a, b) => '<div><span>' + a + '</span><b>' + b + '</b></div>', vit = Math.round((G.heroMul() - 1) * 100), n1 = v => String(Math.round(v * 10) / 10).replace('.', ',');
    const fiche = '<canvas class="iv-chef" id="iv-chef" width="150" height="130"></canvas><div class="iv-fiche">' + li('⭐ Niveau', p.lvl) + li('✨ Expérience', Math.floor(p.xp || 0) + ' / ' + G.xpNeed(p.lvl)) + li('❤️ Vie', Math.ceil(p.hp) + ' / ' + p.maxhp) + li('💧 Mana', Math.floor(p.mp) + ' / ' + p.maxmp) + li('💧 Mana par seconde', '+' + n1(G.manaRegen())) + li('⚔️ Dégâts par coup', n1(G.playerDmg())) + li('👟 Vitesse', (vit >= 0 ? '+' : '') + vit + ' %') + li('📜 Sorts connus', p.spells.length) + '</div>';
    let ficheG = ''; if (g) { const J = CG.JOBS[g.job], capX = (g.job === 'garde' ? 36 : 12) * g.lvl, combat = g.job === 'garde' || (g.equip && (g.equip.epee || g.equip.arc)); let bon = '', mal = ''; const ap = (j, fort) => '<span title="' + esc(CG.JOBS[j].nom) + (fort ? (g.apt[j] >= 1.3 ? ' : très doué (+40 %)' : ' : doué (+20 %)') : (g.apt[j] <= 0.6 ? ' : vraiment pas fait pour ça (-40 %)' : ' : pas très bon (-25 %)')) + '">' + CG.JOBS[j].icon + (fort ? (g.apt[j] >= 1.3 ? '⁺' : '') : (g.apt[j] <= 0.6 ? '⁻' : '')) + '</span>';
      if (G.seeApt && G.seeApt() && g.apt) { const ks = Object.keys(g.apt).filter(j => CG.JOBS[j]); bon = ks.filter(j => g.apt[j] > 1).map(j => ap(j, true)).join(' ') || '—'; mal = ks.filter(j => g.apt[j] < 1).map(j => ap(j, false)).join(' ') || '—'; }
      ficheG = '<canvas class="iv-chef" id="iv-gob" width="150" height="130"></canvas><div class="iv-fiche">' + li(J.icon + ' Métier', esc(g.sex === 'f' && J.nomF ? J.nomF : J.nom)) + li('⭐ Niveau', g.lvl) + li('✨ Expérience', Math.floor(g.xp || 0) + ' / ' + capX) + li('❤️ Vie', Math.max(0, Math.ceil(g.hp)) + ' / ' + G.gobMaxHp(g)) + li('⚔️ Dégâts par coup', combat ? n1(G.guardDmg(g)) : 'sans arme') + (G.persoNom ? li('🎭 Caractère', esc(G.persoNom(g))) : '') + (bon ? li('👍 Forces', bon) + li('👎 Faiblesses', mal) : li('👍 Forces et faiblesses', 'cachées')) + (g.ami ? li('💛 Amitié', Math.round(g.ami)) : '') + '</div>'; }
    const casesC = ['arme', 'armure', 'pioche', 'hache', 'gant'].map(k => ({ z: 'chef', i: k })), port = l => '<div class="iv-port">' + l.map(q => '<div>' + caseH(q, FANT[q.i]) + NOMCASE[q.i] + '</div>').join('') + '</div>';
    let gens = ''; if (vue.choix) { const l = S.goblins.filter(o => o.met !== false && !o.exile).sort((a, b) => (b.job === 'garde') - (a.job === 'garde') || b.lvl - a.lvl);
      gens = '<div class="iv-gens"><button class="iv-g' + (!g ? ' on' : '') + '" data-qui="chef">👑 ' + esc(S.name || 'Chef') + '</button>' + l.map(o => '<button class="iv-g' + (g === o ? ' on' : '') + '" data-qui="' + o.id + '">' + CG.JOBS[o.job].icon + ' ' + esc(o.name) + (['epee', 'arc', 'armure'].some(k => nivG(o, k)) || o.outil || o.travail ? ' •' : '') + '</button>').join('') + '</div>'; }
    let grilleC = ''; for (let i = 0; i < Math.max(C.n, c.length); i++) if (i < C.n || c[i]) grilleC += caseH({ z: 'cof', i });
    let plus = ''; const P = vue.coffre ? Iv.COFFRES[Iv.niv() + 1] : null; if (P) { const manque = Object.keys(P.cout).filter(r => (S.res[r] || 0) < P.cout[r]);
      plus = '<div class="iv-plus"><button id="iv-plus"' + (manque.length ? ' disabled' : '') + '>⬆️ ' + P.nom + ' (' + P.n + ' cases)</button><span>' + Object.keys(P.cout).map(r => '<b' + (manque.includes(r) ? ' class="non"' : '') + '>' + P.cout[r] + ' ' + CG.RES[r].icon + '</b>').join(' · ') + (manque.length ? ' — il te manque ' + manque.map(r => (P.cout[r] - Math.floor(S.res[r] || 0)) + ' ' + CG.RES[r].icon).join(', ') : '') + '</span></div>'; }
    const h = '<div class="iv-haut"><h2>🎒 ' + (vue.coffre ? 'Le coffre du camp' : g ? esc(g.name) + ' et toi' : 'Ton sac') + '</h2><small>Glisse un objet pour le déplacer · double-clic : équiper, ranger ou boire</small></div><div class="iv-cols">'
      + (g ? '<div class="iv-bloc iv-qui"><h3>Gobelin</h3><div class="iv-nom">' + esc(g.name) + '</div>' + ficheG + port(cases) + gens + '</div>' : '')
      + (!g || !vue.coffre ? '<div class="iv-bloc iv-qui"><h3>Sur toi</h3><div class="iv-nom">' + esc(S.name || 'Chef') + '</div>' + fiche + port(casesC) + (g ? '' : gens) + '</div>' : '') /* les deux fiches côte à côte ; devant le coffre, la place manque : seulement celle du gobelin */
      + '<div class="iv-bloc"><h3>Ton sac <i>' + s.filter(Boolean).length + ' / ' + Iv.SAC + '</i></h3><div class="iv-grille">' + s.map((_, i) => caseH({ z: 'sac', i })).join('') + '</div></div>'
      + (vue.coffre ? '<div class="iv-coffre ' + C.cls + '"><span class="iv-titre">' + C.nom + '</span><span class="iv-nb">' + c.filter(Boolean).length + ' / ' + C.n + '</span><div class="iv-grille" style="grid-template-columns:repeat(' + C.col + ',52px)">' + grilleC + '</div></div>' : '')
      + '</div>' + plus + '<div class="iv-msg">' + (Date.now() - msgT < 4000 ? esc(msg) : '') + '</div><div class="iv-bas"><span>' + (vue.coffre ? 'Le coffre reste dans ta hutte ; ton sac te suit partout.' : 'Le coffre du camp est dans ta hutte.') + '</span><button id="iv-non">Refermer (Échap)</button></div>';
    const pan = document.getElementById('panel'); pan.innerHTML = h; pan.className = 'inventaire wide'; document.getElementById('iv-non').onclick = UI.dismiss;
    { const cg = document.getElementById('iv-gob'); if (cg && g) { try { CG.Art.goblin(cg.getContext('2d'), { x: 75, y: 116, face: 1, t: 0.4, dir: CG.Art8.dirFrom(0, 1), moving: false, step: 0, cls: g.cls || (g.nomme ? 'hob' : null), noHat: !g.hat, hatJob: g.hat, fun: g.fun, sex: g.sex, hue: g.hue, lum: g.lum, job: g.job, equip: g.equip, tool: null, look: g.look || (g.look = CG.Art8.randomLook(g)), evolved: !!g.nomme, s: 2.2 }); } catch (e) { /* pas de portrait */ } } }
    { const cv = document.getElementById('iv-chef'); if (cv) { try { CG.Art.goblin(cv.getContext('2d'), { dir: CG.Art8.dirFrom(0, 1), x: 75, y: 116, face: 1, t: 0, moving: false, step: 0, sex: 'm', hue: 112, lum: 46, chief: true, tool: 'baton', glow: '#b070ff', atk: 0, equip: { armure: p.armor > 0 }, s: 2.3 * (CG.Evo ? CG.Evo.chefScale() : 1) }); } catch (e) { /* pas de portrait */ } } } { const b = document.getElementById('iv-plus'); if (b) b.onclick = () => { Iv.ameliorer(); rendu(); }; }
    pan.querySelectorAll('[data-qui]').forEach(b => b.onclick = () => { vue.cible = b.dataset.qui === 'chef' ? 'chef' : S.goblins.find(o => String(o.id) === b.dataset.qui) || 'chef'; rendu(); });
  }
  Iv.rendu = rendu;
  Iv.ouvrir = function (o) {
    o = o || {}; if (UI.modal && UI.modal.name === 'inventaire' && !o.cible && !o.coffre) return UI.dismiss(); if (UI.modal && UI.modal.name !== 'inventaire' && !o.force) return;
    vue = { cible: o.cible || 'chef', coffre: !!o.coffre, choix: !!o.coffre || !!o.choix }; UI.open('inventaire', '', true, true); if (UI.modal) UI.modal.pauses = true; rendu();
  };
  Bq.ouvrir = () => Iv.ouvrir({ coffre: true, force: true });
  { const lier = () => { const b = document.getElementById('btn-sac'); if (b) b.onclick = () => { if (CG.S && CG.R) Iv.ouvrir(); }; }; if (document.getElementById('btn-sac')) lier(); else document.addEventListener('DOMContentLoaded', lier); }
  // ---------- glisser, déposer, survoler ----------
  const caseDe = el => { const c = el && el.closest ? el.closest('#panel.inventaire .iv-s') : null; if (!c) return null; const s = { z: c.dataset.z, i: c.dataset.z === 'sac' || c.dataset.z === 'cof' ? +c.dataset.i : c.dataset.i }; if (c.dataset.g !== undefined) s.g = isNaN(+c.dataset.g) ? c.dataset.g : +c.dataset.g; return { s, el: c }; };
  const idG = v => { const g = CG.S.goblins.find(o => String(o.id) === String(v)); return g ? g.id : v; };
  let drag = null, tip = null;
  const cacheTip = () => { if (tip) tip.style.display = 'none'; };
  function montreTip(c) { const it = lire(c.s); if (!it || drag && drag.actif) return cacheTip(); if (!tip) { tip = document.createElement('div'); tip.id = 'iv-tip'; document.body.appendChild(tip); }
    const chef = c.s.z === 'chef' || (c.s.z !== 'gob' && vue && vue.cible === 'chef' && !vue.coffre);
    if (pile(it)) { const F = Iv.fiche(it); tip.style.setProperty('--q', F.col); tip.innerHTML = '<b>' + F.ic + ' ' + esc(F.nom) + (it.k === 'fiole' ? ' × ' + (it.q || 1) : '') + '</b>' + esc(F.desc) + '<i>' + esc(c.s.z === 'sac' ? F.aide : 'Rangé dans le coffre : reprends-le dans ton sac pour t\'en servir.') + '</i>'; }
    else { tip.style.setProperty('--q', ['', '#d8d0c0', '#5ad06a', '#5aa8ff'][it.n]); tip.innerHTML = '<b>' + Bq.IC[it.k] + ' ' + esc(Bq.NOMS[it.k][it.n]) + '</b>' + (OUT()[it.k] ? 'Objet spécial' : QUAL[it.n]) + '<i>Sur un gobelin : ' + esc(Bq.effet(it.k, it.n)) + '</i><i>Sur toi : ' + esc(Iv.effet(it, true)) + '</i>'; } void chef;
    tip.style.display = 'block'; const r = c.el.getBoundingClientRect(); tip.style.left = Math.max(8, Math.min(window.innerWidth - tip.offsetWidth - 8, r.right + 8)) + 'px'; tip.style.top = Math.max(8, Math.min(window.innerHeight - tip.offsetHeight - 8, r.top)) + 'px'; }
  function cibleSous(x, y) { const el = document.elementFromPoint(x, y), c = caseDe(el); if (c) return c; const b = el && el.closest ? el.closest('#panel.inventaire [data-qui]') : null; if (!b || !drag) return null; const it = drag.it; // sur le nom de quelqu'un : la bonne case de son équipement
    return { el: b, s: b.dataset.qui === 'chef' ? { z: 'chef', i: caseC(it) } : { z: 'gob', g: idG(b.dataset.qui), i: caseG(it) } }; }
  const finDrag = () => { if (drag && drag.fant) drag.fant.remove(); drag = null; document.querySelectorAll('#panel .ok,#panel .vise,#panel .pris').forEach(e => e.classList.remove('ok', 'vise', 'pris')); };
  document.addEventListener('pointerdown', ev => { if (ev.button || !UI.modal || UI.modal.name !== 'inventaire') return; const c = caseDe(ev.target); if (!c) return; const it = lire(c.s); if (!it) return; drag = { de: c.s, el: c.el, it, x: ev.clientX, y: ev.clientY, actif: false }; ev.preventDefault(); });
  document.addEventListener('pointermove', ev => {
    if (!drag) { if (UI.modal && UI.modal.name === 'inventaire') { const c = caseDe(ev.target); if (c) montreTip(c); else cacheTip(); } else cacheTip(); return; }
    if (!drag.actif) { if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 5) return; drag.actif = true; cacheTip(); const o = drag.el.querySelector('.iv-it'); drag.fant = o.cloneNode(true); drag.fant.id = 'iv-fant'; document.body.appendChild(drag.fant); o.classList.add('pris');
      document.querySelectorAll('#panel.inventaire .iv-s').forEach(e => { const c = caseDe(e); if (c && !meme(c.s, drag.de) && accepte(c.s, drag.it)) e.classList.add('ok'); }); }
    drag.fant.style.left = ev.clientX + 'px'; drag.fant.style.top = ev.clientY + 'px';
    document.querySelectorAll('#panel .vise').forEach(e => e.classList.remove('vise')); const c = cibleSous(ev.clientX, ev.clientY); if (c) c.el.classList.add('vise');
  });
  document.addEventListener('pointerup', ev => { if (!drag) return; const d = drag, c = d.actif ? cibleSous(ev.clientX, ev.clientY) : null; finDrag(); if (c && UI.modal && UI.modal.name === 'inventaire') { Iv.deplacer(d.de, c.s); rendu(); } });
  document.addEventListener('pointercancel', finDrag);
  document.addEventListener('dblclick', ev => { if (!UI.modal || UI.modal.name !== 'inventaire') return; const c = caseDe(ev.target); if (c && lire(c.s)) { Iv.vite(c.s); rendu(); cacheTip(); } });
  const cl0 = UI.close; if (cl0) UI.close = function () { finDrag(); cacheTip(); return cl0.apply(this, arguments); };
  // ---------- depuis la discussion avec un gobelin ----------
  const dg0 = UI.dialog; UI.dialog = function (o) {
    try { const S = CG.S; if (o && !o.fiche && o.options && S && o.goblin && S.goblins.includes(o.goblin) && o.goblin.met && o.options.some(q => /Modifier le travail/.test(q.label))) { const g = o.goblin, l = o.options.slice(), fin = l.length && !l[l.length - 1].fn ? l.pop() : null;
      l.push({ label: '📊 Sa fiche et son inventaire', sub: 'Ses stats et ce qu\'il porte, à côté de ta fiche et de ton sac : glisse-lui une arme, une armure ou un objet spécial', fn: () => Iv.ouvrir({ cible: g, force: true }) }); if (fin) l.push(fin); o = Object.assign({}, o, { options: l }); } } catch (e) { /* jamais bloquant */ }
    return dg0.call(this, o);
  };
})(window.CG);
