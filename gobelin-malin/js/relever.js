// Goblin Malin — assommé, pas mort. Un gobelin ou un animal du clan qui tombe au combat ne meurt plus sur le coup : il reste
// par terre, assommé. Le chef a DELAI secondes (du vrai temps) pour aller voir un guérisseur et lui demander d'aller le chercher.
//   Le guérisseur court jusqu'à lui (la minuterie s'arrête dès qu'il est en route), le charge sur son dos et le ramène à sa hutte.
//   Après HEURES heures du jeu, le blessé est sur pied.
//   Un guérisseur = un blessé à la fois : tant que le sien n'est pas remis, il ne peut pas en prendre un autre. Deux guérisseurs,
//   deux blessés, et ainsi de suite.
//   Personne n'est venu à temps : le gobelin meurt pour de bon (sa pierre tombale arrive) ; l'animal aussi (son corps reste
//   jusqu'au matin, le temps d'une Résurrection, comme avant).
// Un gobelin posté dans une tour de guet ne peut pas être blessé : il faut d'abord abattre la tour (game.js).
// Tout est réglable dans CG.Relever.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, P = CG.P, T = CG.TILE, TAU = Math.PI * 2;
  const Re = CG.Relever = { DELAI: 30, HEURES: 16, PRES: 30, VITESSE: 150, PORTE: 105 };
  const maintenant = () => CG.S.day * 24 + CG.S.hour, soins = () => CG.S.soins || (CG.S.soins = []);
  const estAnimal = v => !!v && CG.S.pets.includes(v), fem = v => v.sex === 'f';
  const nomDe = v => v.name || 'Quelqu\'un';
  Re.aTerre = () => { const S = CG.S; return S.goblins.filter(g => g.tombe).concat(S.pets.filter(p => p.tombe)); };
  Re.tombes = () => Re.aTerre(); /* l'ancien nom */
  Re.patient = g => soins().find(q => q.par === g.id) || null;
  Re.libre = g => !!g && g.job === 'guerisseur' && !g.child && !g.exile && g.ko !== true && !g.releve && !Re.patient(g);
  // ---------- quelqu'un tombe ----------
  const prevenir = v => { const S = CG.S, R = CG.R, libre = S.goblins.some(Re.libre), nb = S.goblins.filter(g => g.job === 'guerisseur' && !g.exile).length;
    G.text(v.x, v.y - 62, '💫 ' + nomDe(v) + ' est assommé' + (fem(v) ? 'e' : ''), '#ffd0a0', true); CG.sfx('warning');
    G.banner('💫 ' + nomDe(v) + ' est à terre !', libre ? 'Va vite demander à un guérisseur d\'aller ' + (fem(v) ? 'la' : 'le') + ' chercher : tu as ' + Re.DELAI + ' secondes.' : nb ? 'Tes guérisseurs veillent déjà sur un blessé chacun : personne ne peut ' + (fem(v) ? 'la' : 'le') + ' prendre.' : 'Sans guérisseur, personne ne peut ' + (fem(v) ? 'la' : 'le') + ' sauver.', '#ffb08a');
    if (R.pings) R.pings.push({ x: v.x, y: v.y, t0: performance.now(), icon: '💫', dur: Re.DELAI * 1000 }); };
  Re.tomber = function (g) { const S = CG.S; if (!S || g.tombe || g.bebe || g.exile) return false;
    G.resetGoblin(g); g.hp = 0; g.ko = true; g.hidden = true; g.perch = null; g.escorte = false; g.releve = null; g.tombe = { t: Re.DELAI, par: null, porte: false, x: g.x, y: g.y }; prevenir(g); return true; };
  Re.tomberAnimal = function (p) { if (p.tombe || p.enSoin) return; p.mort = false; p.tombe = { t: Re.DELAI, par: null, porte: false, x: p.x, y: p.y }; prevenir(p); };
  // personne n'est venu
  function mourir(v) { const S = CG.S; v.tombe = null; if (estAnimal(v)) { v.mort = true; G.text(v.x, v.y - 54, '☠ ' + nomDe(v) + ' est mort', '#ffb0a0', true); CG.sfx('die'); return; }
    v.ko = false; v.hidden = false; v.mourir = true; v.hp = 0; try { G.hurtGoblin(v, 1); } finally { v.mourir = false; } }
  // ---------- on demande au guérisseur ----------
  Re.partir = function (g, v) { if (!v || !v.tombe || v.tombe.par || !Re.libre(g)) { CG.sfx('no'); return false; } G.resetGoblin(g); g.releve = v; v.tombe.par = g.id; g.patient = null;
    G.say(g, CG.pick(['J\'y cours, chef ! Tiens bon, ' + nomDe(v) + ' !', 'Je vais ' + (fem(v) ? 'la' : 'le') + ' chercher. Garde-moi un lit au chaud !', 'Pousse-toi, chef, ça presse !']), 3.5); CG.sfx('ok'); return true; };
  Re.demander = function (g) { const l = Re.aTerre();
    const opts = l.map(v => { const pris = !!v.tombe.par, an = estAnimal(v), ic = an ? ((P.KINDS[v.kind] || {}).icon || '🐾') : ((CG.JOBS[v.job] || {}).icon || '🟢'); return { label: '💫 ' + ic + ' ' + nomDe(v), sub: pris ? 'Quelqu\'un y va déjà' : 'Encore ' + Math.ceil(v.tombe.t) + ' s', disabled: pris, fn: () => Re.partir(g, v) }; });
    UI.dialog({ goblin: g, who: g.name, tag: '🌿 ' + (fem(g) ? 'guérisseuse' : 'guérisseur'), text: 'Qui dois-je aller chercher, chef ? Je ' + (l.length > 1 ? 'ne peux en ramener qu\'un seul' : 'le ramène à ma hutte') + ' : il lui faudra ' + Re.HEURES + ' heures pour se remettre.', options: opts.concat([{ label: '↩ Retour', echap: true, fn: () => UI.talkGoblin(g) }]) }); };
  const hutteDe = g => { let b = null, bd = 1e9; for (const h of CG.S.buildings) { if (h.type !== 'guerisseur' || h.site || h.ruin) continue; const d = Math.hypot((h.tx + 1) * T - g.x, (h.ty + 2) * T - g.y); if (d < bd) { bd = d; b = h; } } return b; };
  function lacher(g) { const v = g.releve; g.releve = null; g.pose = null; g.bubble = null; if (v && v.tombe && v.tombe.par === g.id) { v.tombe.par = null; v.tombe.porte = false; } }
  function admettre(g, v, porte) { const S = CG.S, an = estAnimal(v); v.tombe = null; v.enSoin = true; v.ko = true; v.hp = 0; if (!an) v.hidden = true; v.x = porte.x; v.y = porte.y + 8;
    soins().push({ t: an ? 'p' : 'g', id: v.id, fin: maintenant() + Re.HEURES, par: g.id, nom: nomDe(v) }); g.releve = null; g.pose = null; g.bubble = null; G.resetGoblin(g); try { G.gobXp(g, Re.XP === undefined ? 4 : Re.XP, 5); } catch (e) { /* rien */ } /* ramener un blessé à la hutte apprend le métier : 4 points d'un coup (Re.XP) */
    G.puff(porte.x, porte.y - 14, '#b8ffb0', 16, 110, 4); CG.sfx('heal'); UI.toast('🌿 ' + nomDe(v) + ' est au chaud chez ' + g.name + '. Sur pied dans ' + Re.HEURES + ' heures.'); G.say(g, CG.pick(['Au lit ! Et pas de discussion.', 'Il était moins une. Je m\'en occupe.', 'Du repos, de la tisane d\'ortie, et ça ira.']), 3.5); }
  // il passe avant son poste à la hutte de soins
  if (G.healerStep) { const hs0 = G.healerStep; G.healerStep = function (g, dt) {
    const v = g.releve; if (!v) return hs0.apply(this, arguments);
    if (!v.tombe || v.tombe.par !== g.id || g.job !== 'guerisseur') { lacher(g); return hs0.apply(this, arguments); }
    if (g.hidden) g.hidden = false; g.pose = null;
    if (!v.tombe.porte) { const d = Math.hypot(v.x - g.x, v.y - g.y); g.bubble = '🩹';
      if (d > Re.PRES) { if (g.state !== 'toReleve' || !g.path || !g.path.length) { g.state = 'toReleve'; if (!G.goTo(g, v.x + (g.x > v.x ? 18 : -18), v.y + 4)) { g.x = v.x + 18; g.y = v.y + 4; } } G.follow(g, Re.VITESSE, dt); return true; }
      v.tombe.porte = true; g.path = null; g.state = 'porte'; G.puff(v.x, v.y - 10, '#e8ffd0', 10, 80, 3); G.say(g, CG.pick(['Hop ! Sur mon dos.', 'Ouf, ' + (fem(v) ? 'elle' : 'il') + ' pèse son poids...', 'Je te tiens. On rentre.']), 2.6); return true; }
    const h = hutteDe(g), porte = h ? G.door(h) : { x: g.x, y: g.y }; g.bubble = null;
    if (h && Math.hypot(porte.x - g.x, porte.y - g.y) > 20) { if (g.state !== 'porte' || !g.path || !g.path.length) { g.state = 'porte'; if (!G.goTo(g, porte.x, porte.y + 4)) { g.x = porte.x; g.y = porte.y + 4; } } G.follow(g, Re.PORTE, dt); v.x = g.x; v.y = g.y; return true; }
    admettre(g, v, porte); return true;
  }; }
  // ---------- chaque instant : les minuteries, les lits ----------
  let tic = 0;
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || !S.goblins) return r;
    for (const v of Re.aTerre()) { const t = v.tombe, an = estAnimal(v); if (!an) { v.hidden = true; v.ko = true; }
      if (t.par) { const g = S.goblins.find(o => o.id === t.par); if (!g || g.releve !== v || g.ko === true || g.dead) { t.par = null; t.porte = false; } }
      if (!t.par) { t.t -= dt; if (t.t <= 0) { mourir(v); continue; } }
      if (!an) { let m = t.m; if (!m || !(R.etoilesKO || []).includes(m)) { m = t.m = { x: v.x, y: v.y, fin: 0, g: { sex: v.sex, hue: v.hue, lum: v.lum, job: v.job, look: v.look, equip: v.equip, cls: v.cls || (v.nomme ? 'hob' : null), noHat: !v.hat, hatJob: v.hat } }; (R.etoilesKO = R.etoilesKO || []).push(m); }
        m.x = v.x; m.y = v.y - (t.porte ? 22 : 0); m.fin = R.t + 0.6; } }
    tic -= dt; if (tic > 0) return r; tic = 0.5; const L = soins(), h0 = maintenant();
    for (let i = L.length - 1; i >= 0; i--) { const q = L[i], v = q.t === 'p' ? S.pets.find(o => o.id === q.id) : S.goblins.find(o => o.id === q.id); if (!v) { L.splice(i, 1); continue; }
      if (h0 < q.fin) { v.enSoin = true; v.ko = true; if (q.t === 'g') v.hidden = true; continue; }
      L.splice(i, 1); v.enSoin = false; v.ko = false; v.tombe = null; const par = S.goblins.find(o => o.id === q.par), b = hutteDe(par || v), d = b ? G.door(b) : { x: v.x, y: v.y };
      if (q.t === 'p') { v.hp = P.maxHp(v); if (P.reset) P.reset(v); v.x = d.x + 26; v.y = d.y + 16; v.path = null; } else { v.hidden = false; G.resetGoblin(v); v.hp = G.gobMaxHp(v); v.x = d.x + 20; v.y = d.y + 12; if (G.unstick) G.unstick(v, 8); v.emoteT = 2; G.say(v, CG.pick(['Me revoilà ! J\'ai dormi comme une bûche.', 'Plus jamais la tisane d\'ortie. Mais merci.', 'Tout est à sa place. Je crois. Merci, chef !']), 4); }
      G.puff(d.x + 20, d.y - 6, '#b8ffb0', 20, 130, 4); R.rings.push({ x: d.x + 20, y: d.y + 6, r: 60, life: 0.5, col: '#8aff9a' }); G.text(d.x + 20, d.y - 50, '✨ ' + nomDe(v) + ' est sur pied !', '#b8ffb0', true); if (CG.onScreen(d.x, d.y)) CG.sfx('level'); S.morale = Math.min(100, S.morale + 2); }
    for (const g of S.goblins) if (g.hp <= 0 && g.ko !== true && !g.tombe && !g.enSoin && !g.dead) g.hp = 1; /* une partie rechargée pendant qu'il était à terre : il se relève, sonné */
    return r;
  };
  // la minuterie au-dessus du blessé, et le blessé sur le dos du guérisseur
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const S = CG.S; if (!S || !S.goblins) return;
    for (const v of Re.aTerre()) { const q = v.tombe; if (q.porte || !CG.onScreen(v.x, v.y)) continue; const k = Math.max(0, q.t / Re.DELAI), y = v.y - 44, presse = q.t < 10 && !q.par;
      g.fillStyle = 'rgba(20,14,8,0.8)'; g.beginPath(); g.arc(v.x, y, 13, 0, TAU); g.fill(); g.strokeStyle = q.par ? '#8aff9a' : presse && Math.floor(t * 6) % 2 ? '#ff6a4a' : '#ffd08a'; g.lineWidth = 3; g.beginPath(); g.arc(v.x, y, 11, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.stroke();
      g.font = '700 11px "Trebuchet MS", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(q.par ? '🩹' : String(Math.ceil(q.t)), v.x, y + 0.5); g.textBaseline = 'alphabetic'; } }; }
  if (CG.Art && CG.Art.pet) { const ap0 = CG.Art.pet; CG.Art.pet = function (g, o) { if (o && o.enSoin) return; return ap0.apply(this, arguments); }; } /* à la hutte : on ne le voit plus dehors */
  // dans la discussion avec un guérisseur
  const dl0 = UI.dialog; UI.dialog = function (o) {
    const g = o && o.goblin; if (g && g.job === 'guerisseur' && !g.child && Array.isArray(o.options) && o.options.some(x => x && /^🛠/.test(x.label || ''))) {
      const opts = o.options.slice(), i = opts.findIndex(x => x && /^👋/.test(x.label || '')), n = Re.aTerre().filter(v => !v.tombe.par).length, pat = Re.patient(g), enRoute = !!g.releve;
      opts.splice(i < 0 ? opts.length : i, 0, { label: '🩹 Va chercher un blessé !', sub: enRoute ? 'Déjà en route' : pat ? 'Veille sur ' + pat.nom + ' (encore ' + Math.max(1, Math.ceil(pat.fin - maintenant())) + ' h) : pas de place pour un autre' : n ? n + ' à terre : vite !' : 'Personne à terre', disabled: enRoute || !!pat || !n, fn: () => Re.demander(g) });
      o = Object.assign({}, o, { options: opts });
    }
    return dl0.call(this, o);
  };
})(window.CG);
