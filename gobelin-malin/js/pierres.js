// Goblin Malin — les pierres tombales. Quand un gobelin meurt, une pierre tombale à son nom apparaît dans la barre de
// construction (Vie du clan) : une par gobelin, six dessins possibles, une case, de la roche seulement. Posée, elle quitte la barre.
// (À ne pas confondre avec tombes.js, le cimetière des chefs des parties perdues.) On clique dessus pour revoir qui il était ; avec le sort Résurrection dans le grimoire, on peut le ramener de là.
// Tant qu'elle n'est pas posée, des gobelins viennent demander quand elle le sera (1 à 4 par jour). Une fois posée, certains
// vont s'y recueillir un moment, et certains soirs le clan s'y rassemble (c'est écrit dans les nouvelles du lendemain).
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, Art = CG.Art, Soc = CG.Soc, T = CG.TILE, TAU = Math.PI * 2, rand = CG.rand, pick = CG.pick, irand = CG.irand;
  const Tm = CG.Pierres = { ROCHE: 10, MAX: 20, DEMANDES: [1, 4], ENTRE: [70, 130], VISITE: [0.25, 0.5], ENTRE_VISITES: [50, 110], SOIR: [18.5, 19.6], SOIR_CHANCE: 0.45, SOIR_DUREE: 0.6, DESSINS: 6 };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])), $ = id => document.getElementById(id);
  const liste = () => { const S = CG.S; return S ? (S.tombes || (S.tombes = [])) : []; };
  const type = t => 'tombe_' + t.id, estTombe = k => /^tombe_/.test(k || ''), deType = k => liste().find(t => type(t) === k) || null;
  const ici = () => (CG.Mondes && CG.Mondes.ici ? CG.Mondes.ici() : 0);
  const fem = r => r.sex === 'f', il = r => (fem(r) ? 'elle' : 'il'), Il = r => (fem(r) ? 'Elle' : 'Il'), lui = r => (fem(r) ? 'elle' : 'lui');
  const dire = (s, r) => s.replace(/\{m\}/g, r.name).replace(/\{il\}/g, il(r)).replace(/\{Il\}/g, Il(r)).replace(/\{lui\}/g, lui(r)).replace(/\{e\}/g, fem(r) ? 'e' : '');
  if (CG.Mondes && CG.Mondes.GLOBAL) ['tombes', 'tombeN', 'feu2Dit'].forEach(k => { if (!CG.Mondes.GLOBAL.includes(k)) CG.Mondes.GLOBAL.push(k); });

  // ---------- les six dessins ----------
  const P = { c: '#9a9ca6', f: '#7c7e8a', o: '#63656f', h: '#b9bbc4', m: '#6f9a55', t: '#5a4a3a' };
  const poly = (c, p, f) => { c.fillStyle = f; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); c.fill(); };
  const rect = (c, x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x, y, w, h); };
  function dessin(c, v, nom) {
    const m = 22, b = 52; c.fillStyle = 'rgba(0,0,0,0.26)'; c.beginPath(); c.ellipse(m, b, 17, 5, 0, 0, TAU); c.fill();
    poly(c, [m - 15, b, m - 11, b - 5, m + 11, b - 5, m + 15, b], P.t); /* la terre retournée */
    if (v === 0) { c.fillStyle = P.c; c.beginPath(); c.moveTo(m - 11, b - 3); c.lineTo(m - 11, b - 24); c.arc(m, b - 24, 11, Math.PI, 0); c.lineTo(m + 11, b - 3); c.closePath(); c.fill(); c.fillStyle = P.f; c.beginPath(); c.moveTo(m + 3, b - 3); c.lineTo(m + 3, b - 34.6); c.arc(m, b - 24, 11, -1.29, 0); c.lineTo(m + 11, b - 3); c.closePath(); c.fill(); }
    else if (v === 1) { rect(c, m - 3.5, b - 38, 7, 35, P.c); rect(c, m - 12, b - 30, 24, 7, P.c); rect(c, m + 1, b - 38, 2.5, 35, P.f); rect(c, m - 12, b - 25, 24, 2, P.f); rect(c, m - 8, b - 6, 16, 4, P.o); } /* une croix de pierre */
    else if (v === 2) { poly(c, [m - 8, b - 3, m - 6, b - 32, m, b - 42, m + 6, b - 32, m + 8, b - 3], P.c); poly(c, [m + 1, b - 3, m + 1, b - 41, m + 6, b - 32, m + 8, b - 3], P.f); rect(c, m - 11, b - 7, 22, 5, P.o); } /* une pierre dressée, pointue */
    else if (v === 3) { poly(c, [m - 12, b - 3, m - 12, b - 26, m - 7, b - 31, m + 7, b - 31, m + 12, b - 26, m + 12, b - 3], P.c); poly(c, [m + 4, b - 3, m + 4, b - 31, m + 7, b - 31, m + 12, b - 26, m + 12, b - 3], P.f); c.fillStyle = P.h; c.beginPath(); c.arc(m - 2, b - 20, 4, 0, TAU); c.fill(); rect(c, m - 4, b - 17, 4, 3, P.h); rect(c, m - 3.6, b - 21, 1.4, 1.6, P.o); rect(c, m - 1.2, b - 21, 1.4, 1.6, P.o); } /* une dalle gravée d'un petit crâne */
    else if (v === 4) { c.fillStyle = P.c; c.beginPath(); c.moveTo(m - 13, b - 3); c.quadraticCurveTo(m - 16, b - 22, m - 5, b - 30); c.quadraticCurveTo(m + 6, b - 34, m + 12, b - 22); c.quadraticCurveTo(m + 16, b - 10, m + 12, b - 3); c.closePath(); c.fill(); c.fillStyle = P.f; c.beginPath(); c.moveTo(m + 4, b - 3); c.quadraticCurveTo(m + 7, b - 20, m + 3, b - 31); c.quadraticCurveTo(m + 10, b - 30, m + 12, b - 22); c.quadraticCurveTo(m + 16, b - 10, m + 12, b - 3); c.closePath(); c.fill(); c.fillStyle = P.m; c.beginPath(); c.ellipse(m - 7, b - 25, 6, 3, -0.6, 0, TAU); c.fill(); c.beginPath(); c.ellipse(m - 10, b - 6, 5, 2.4, 0, 0, TAU); c.fill(); } /* un gros caillou couvert de mousse */
    else { rect(c, m - 9, b - 30, 18, 27, P.c); rect(c, m + 3, b - 30, 6, 27, P.f); rect(c, m - 12, b - 34, 24, 5, P.h); rect(c, m + 3, b - 34, 9, 5, P.c); rect(c, m - 12, b - 8, 24, 5, P.o); poly(c, [m - 5, b - 34, m, b - 41, m + 5, b - 34], P.c); } /* une petite stèle avec son chapeau */
    if (v !== 1 && v !== 3) { c.fillStyle = 'rgba(40,42,52,0.6)'; c.font = 'bold 11px Georgia, serif'; c.textAlign = 'center'; c.fillText((nom || '?').charAt(0).toUpperCase(), m - 2, b - 14); } /* son initiale gravée */
    rect(c, m - 13, b - 4, 5, 2, P.m); rect(c, m + 7, b - 3, 5, 2, P.m);
  }
  // au pied de la pierre : les fleurs qu'on y a laissées, les bougies d'un soir
  function pied(g, cx, by, t, tb) {
    const S = CG.S, R = CG.R; if (!S || !tb) return;
    if (tb.fleurs && S.day - tb.fleurs <= 1) [[-13, '#ffd84a'], [-7, '#ff8ac0'], [9, '#ffffff'], [14, '#c9a0ff']].forEach((f, i) => { const x = cx + f[0], y = by + 3 + (i % 2) * 3; g.fillStyle = '#4a8a3a'; g.fillRect(x - 0.5, y - 6, 1, 6); g.fillStyle = f[1]; g.beginPath(); g.arc(x, y - 7, 2.4, 0, TAU); g.fill(); g.fillStyle = '#ffb030'; g.beginPath(); g.arc(x, y - 7, 0.9, 0, TAU); g.fill(); });
    const sc = R && R.tombeSoir; if (sc && sc.t === tb && sc.k === 'bougies') [-16, -9, 10, 17].forEach((dx, i) => { const x = cx + dx, y = by + 4 + (i % 2) * 3, f = 1 + Math.sin(t * 9 + i * 2) * 0.2; g.fillStyle = '#f4ecd8'; g.fillRect(x - 1.5, y - 6, 3, 6); g.fillStyle = 'rgba(255,200,90,0.28)'; g.beginPath(); g.arc(x, y - 9, 7 * f, 0, TAU); g.fill(); g.fillStyle = '#ffb030'; g.beginPath(); g.ellipse(x, y - 8.5, 1.6, 3 * f, 0, 0, TAU); g.fill(); g.fillStyle = '#fff3b0'; g.beginPath(); g.ellipse(x, y - 8, 0.8, 1.6, 0, 0, TAU); g.fill(); });
  }
  function enregistrer(t) {
    const k = type(t), r = t.rec; if (CG.BUILDS[k]) return;
    CG.BUILDS[k] = { nom: 'Pierre tombale de ' + r.name, icon: '🪦', w: 1, h: 1, cat: 'clan', cout: { minerai: Tm.ROCHE }, tombe: t.id, desc: 'Pour se souvenir de ' + r.name + '. Pose-la là où le clan pourra venir ' + (fem(r) ? 'la' : 'le') + ' saluer.' };
    if (Art.extra) Art.extra[k] = { w: 44, h: 60, draw(c) { dessin(c, t.v, r.name); }, anim(g, cx, by, tt) { pied(g, cx, by, tt, t); } };
  }
  function oublier(t) { const S = CG.S, k = type(t); S.buildings.filter(b => b.type === k).forEach(b => G.removeBuilding(b)); const l = liste(), i = l.indexOf(t); if (i >= 0) l.splice(i, 1); delete CG.BUILDS[k]; if (Art.extra) delete Art.extra[k]; }
  const posee = t => CG.S.buildings.find(b => b.type === type(t) && !b.site) || null;
  const enAttente = () => liste().filter(t => t.pose === null || t.pose === undefined);
  Tm.liste = liste; Tm.posee = posee;

  // ---------- un gobelin meurt : sa pierre attend dans la barre de construction ----------
  const hg0 = G.hurtGoblin; G.hurtGoblin = function (g) {
    const r = hg0.apply(this, arguments); if (!g || !g.dead || g.tombeFaite || !CG.S) return r; g.tombeFaite = true;
    const S = CG.S, c = (S.morts || []).slice().reverse().find(o => o.id === g.id && o.name === g.name), rec = JSON.parse(JSON.stringify(c || { id: g.id, name: g.name, sex: g.sex, job: g.job, lvl: g.lvl, look: g.look, hue: g.hue, lum: g.lum, perso: g.perso, talent: g.talent, cls: g.cls, nomme: g.nomme, jour: S.day }));
    const t = { id: (S.tombeN = (S.tombeN || 0) + 1), rec, jour: S.day, v: irand(0, Tm.DESSINS - 1), pose: null, aime: irand(0, AIME.length - 1) }; liste().push(t); enregistrer(t);
    const l = liste(); while (l.length > Tm.MAX) { const vieux = l.find(o => o.pose === null) || l[0]; oublier(vieux); }
    return r;
  };
  const bu0 = G.buildUnlocked; G.buildUnlocked = function (k) { if (!estTombe(k)) return bu0.apply(this, arguments); const t = deType(k); return !!t && (t.pose === null || t.pose === undefined) && !CG.S.buildings.some(b => b.type === k); };
  const mh0 = G.buildMaxHp; G.buildMaxHp = b => (b && estTombe(b.type) ? 0 : mh0(b)); /* personne ne casse une pierre tombale */
  const ir0 = G.initRuntime; G.initRuntime = function () { liste().forEach(enregistrer); const r = ir0.apply(this, arguments); CG.S.goblins.forEach(g => { g.recueil = null; g.tombeDem = null; }); CG.R.tombeSoir = null; return r; };

  // ---------- sa fiche : qui il était, et le ramener si on connaît le sort ----------
  const AIME = ['les fêtes autour du feu', 'les siestes au soleil', 'les histoires du soir', 'la soupe aux champignons', 'faire rire les autres', 'compter les étoiles', 'les baies bien mûres', 'chanter (très faux)', 'les câlins des animaux du clan', 'gagner aux osselets'];
  Tm.fiche = function (b) {
    const S = CG.S, p = S.player, t = deType(b.type); if (!t) return; const r = t.rec, job = CG.JOBS[r.job] || CG.JOBS.aucun, tal = r.talent && CG.JOBS[r.talent], So = CG.Sorts2;
    const sait = p.spells.includes('resurrection') && So && So.relever, cout = sait ? So.cout(r.lvl) : 0, plein = S.goblins.length >= G.capacity();
    let perso = ''; try { perso = G.persoNom ? G.persoNom(r) : ''; } catch (e) { perso = ''; }
    const lignes = ['Tombé' + (fem(r) ? 'e' : '') + ' au jour ' + t.jour + '.', Il(r) + ' aimait ' + AIME[t.aime % AIME.length] + '.'];
    if (tal) lignes.push(Il(r) + ' était doué' + (fem(r) ? 'e' : '') + ' comme ' + (fem(r) && tal.nomF ? tal.nomF : tal.nom).toLowerCase() + '.');
    UI.modal = { name: 'bati', closable: true, pauses: false }; CG.keys.clear(); CG.sfx('uiOpen'); $('dialog').hidden = true; $('modal').className = 'soft'; $('panel').className = 'fiche-bati';
    $('panel').innerHTML = '<button class="fb-x" id="fb-x" title="Fermer (Échap)">✕</button><div class="fb-tete"><div class="fb-img"><canvas id="fb-cv" width="300" height="300" style="width:150px;height:150px"></canvas></div><div class="fb-titre"><h2>🪦 ' + esc(r.name) + '</h2>'
      + '<div class="fb-etats"><span>' + job.icon + ' ' + esc(fem(r) && job.nomF ? job.nomF : job.nom) + '</span><span>⭐ Niveau ' + r.lvl + '</span>' + (perso ? '<span>' + esc(perso) + '</span>' : '') + '</div><p>' + lignes.map(esc).join('<br>') + '</p></div></div><div class="fb-btns">'
      + (sait ? '<button class="fb-b mana" id="fb-res"' + (plein || p.mp < cout ? ' disabled' : '') + '><b>🕊️ ' + (fem(r) ? 'La' : 'Le') + ' ramener à la vie</b><small>' + (plein ? 'Plus de place dans les huttes · ' : p.mp < cout ? 'Il te manque du mana · ' : '') + cout + ' mana</small></button>' : '')
      + '<button class="fb-b fin" id="fb-fin"><b>Fermer</b></button></div>';
    $('modal').hidden = false; { const g = $('fb-cv').getContext('2d'); g.save(); g.scale(4.2, 4.2); g.translate(13.5, 6); dessin(g, t.v, r.name); g.restore(); }
    $('fb-x').onclick = $('fb-fin').onclick = UI.dismiss; if ($('fb-res')) $('fb-res').onclick = () => { UI.close(); Tm.ramener(t); };
  };
  Tm.ramener = function (t) {
    const S = CG.S, R = CG.R, p = S.player, So = CG.Sorts2, r = t.rec, cout = So.cout(r.lvl); if (p.mp < cout || S.goblins.length >= G.capacity()) { CG.sfx('no'); return false; }
    S.morts = (S.morts || []).filter(o => !(o.id === r.id && o.name === r.name)); const c = JSON.parse(JSON.stringify(r)); S.morts.push(c);
    p.mp -= cout; R.castCd = 0.8; R.castAnim = 1; const b = posee(t), g = So.relever(c); if (b) { g.x = (b.tx + 0.5) * T; g.y = (b.ty + 1) * T + 14; if (G.unstick) G.unstick(g, 8); }
    So.lumiere(g.x, g.y, g.name); G.say(g, pick(['C\'est... ma pierre ? Elle est jolie. Merci, chef.', 'Hein ? Pourquoi il y a mon nom là-dessus ?!', 'J\'ai entendu tout ce que vous disiez devant ma pierre, vous savez.', 'Chef ! Tu es venu me chercher !']), 4.5, 1.2); oublier(t); return true;
  };
  if (CG.FicheBati) { const ou0 = CG.FicheBati.ouvrir; CG.FicheBati.ouvrir = function (b) { if (b && estTombe(b.type)) return Tm.fiche(b); return ou0.apply(this, arguments); }; }

  // ---------- « Chef, et la pierre de ... ? » ----------
  const DEMANDES = ['Chef... {m} n\'a toujours pas sa pierre tombale. Tu vas la poser quand ?', 'Chef, je pense souvent à {m}. On pourrait lui mettre une pierre, quelque part ?', 'Dis, chef, tu n\'as pas oublié {m}, hein ? Sa pierre tombale attend toujours.',
    'Chef, ça me fait de la peine : {m} n\'a nulle part où reposer.', 'J\'ai cueilli des fleurs pour {m}... mais je ne sais pas où les déposer, chef.', 'Chef, {m} mérite une belle pierre. Tu la poses bientôt ?',
    'Hier soir, on a parlé de {m} autour du feu. Tout le monde demande : et sa pierre, chef ?', 'Chef, sans pierre tombale, comment {m} va savoir qu\'on pense à {lui} ?', 'Je voudrais dire au revoir à {m}, chef. Mais il n\'y a pas de pierre...',
    'Chef ! J\'ai rêvé de {m}. {Il} cherchait sa pierre tombale partout.', 'Tu sais, chef, {m} me devait trois baies. Je lui pardonne. Mais il lui faut une pierre.', 'Chef, les petits demandent où est passé{e} {m}. Une pierre, ça aiderait à leur expliquer.',
    'Chef, j\'ai trouvé un beau coin tranquille. Ce serait parfait pour la pierre de {m}, non ?', 'On dit qu\'un gobelin sans pierre revient chatouiller les pieds la nuit. Tu poses celle de {m} quand, chef ?'];
  const OUI = ['Merci, chef. {m} aurait aimé entendre ça.', 'Je savais que tu ne l\'oubliais pas.', 'D\'accord, chef. Je vais le dire aux autres.'], VITE = ['Oh, merci, chef ! Regarde dans Construire : elle t\'attend.', 'Aujourd\'hui ? {m} serait fier' + '{e} de toi, chef.', 'Merci ! Je viendrai y déposer une fleur.'], NON = ['... Pauvre {m}.', 'Ce n\'est pas gentil pour {m}, chef.', 'Et si c\'était toi, chef ?'], PRESSE = ['Bon... une autre fois, alors.', 'D\'accord. Mais {m} attend, chef.'];
  function rep(g, t, delta, l) { const S = CG.S; S.morale = CG.clamp(S.morale + delta, 0, 100); g.ami = CG.clamp((g.ami || 0) + (delta > 0 ? 1 : -1), -6, 6); G.say(g, dire(pick(l), t.rec), 4); G.text(g.x, g.y - 50, delta > 0 ? '❤️' : '💧', '#fff', true); CG.sfx(delta > 0 ? 'ok' : 'no'); if (delta > 0 && Soc.bystanders) Soc.bystanders(g, 'good'); } /* personne ne rit d'une réponse dure sur un mort */
  function demander(g, t, dl) {
    dl({ goblin: g, who: g.name, tag: '🪦 pense à ' + t.rec.name, text: dire(pick(DEMANDES), t.rec), options: CG.shuffle([
      { label: 'Bientôt, promis. Je ne l\'oublie pas.', fn: () => rep(g, t, 1, OUI) },
      { label: 'Tu as raison. Je m\'en occupe aujourd\'hui.', fn: () => rep(g, t, 2, VITE) },
      { label: 'Les morts peuvent attendre.', fn: () => rep(g, t, -3, NON) }]).concat([{ label: Soc.PRESSE || 'Je n\'ai pas le temps.', echap: true, fn: () => rep(g, t, Soc.PRESSE_MORAL || -1, PRESSE) }]) });
  }
  const dl0 = UI.dialog; UI.dialog = function (o) { // la question qu'il venait poser devient celle de la pierre
    const g = o && o.goblin, d = g && g.tombeDem; if (!d) return dl0.apply(this, arguments); g.tombeDem = null;
    const t = liste().find(x => x.id === d.id); if (!t || t.pose !== null || CG.R.t - d.t > 80 || !/question|besoin de toi/.test(o.tag || '')) return dl0.apply(this, arguments);
    return demander(g, t, q => dl0.call(UI, q));
  };
  const calme = () => { const S = CG.S, R = CG.R; return !R.alarm && !R.night && !R.cine && !(R.ko > 0) && S.hour >= 7 && S.hour <= 18.3; };
  const dispo = g => g.met && !g.hidden && !g.exile && !g.carry && !g.log && !g.cine && !g.ask && !g.child && !g.bebe && g.state !== 'fight' && g.ko !== true && !g.repli && !g.nap;

  // ---------- se recueillir : un gobelin va devant la pierre et y reste un moment ----------
  const MOTS = ['Tu me manques, {m}.', 'Salut, {m}. Le village a grandi, tu sais.', 'Je t\'ai gardé une place près du feu, {m}.', '{m}... tu ronflais fort, mais ça me manque.', 'On a gagné hier, {m}. C\'était pour toi.', 'Je t\'ai apporté une fleur, {m}.', 'Repose-toi bien, {m}.', 'Le chef pense à toi, {m}. Moi aussi.', 'Tu aurais ri aujourd\'hui, {m}.', '(renifle) ... Bon. À demain, {m}.', 'J\'ai fini ton travail, {m}. Ne t\'inquiète pas.', 'Tu te souviens de la fois où tu es tombé{e} dans la marmite, {m} ?'];
  const CHANT = ['♪ Dors, petit gobelin... ♪', '♪ La forêt veille sur toi... ♪', '♪ Près du feu, on pense à toi... ♪'];
  const lacher = g => { if (!g.recueil) return; g.recueil = null; g.cine = false; g.bubble = null; G.resetGoblin(g); };
  function envoyer(g, t, b, o) { G.resetGoblin(g); g.cine = true; g.state = 'cine'; g.recueil = Object.assign({ t, b, r: 0, route: 45, fin: 0, dx: 0, dit: false }, o || {}); }
  const cs0 = G.cineStep; G.cineStep = function (g, dt) {
    const q = g.recueil; if (!q) return cs0.apply(this, arguments); const S = CG.S, R = CG.R; g.pose = null; if (g.hidden) g.hidden = false;
    if (R.alarm || R.night || !S.buildings.includes(q.b) || !liste().includes(q.t)) return lacher(g);
    const x = (q.b.tx + 0.5) * T + q.dx, y = (q.b.ty + 1) * T + 16 + Math.abs(q.dx) * 0.25, d = Math.hypot(g.x - x, g.y - y);
    if (!q.fin && d > 16) { if ((q.route -= dt) <= 0) return lacher(g); if ((q.r -= dt) <= 0 || !g.path || !g.path.length) { q.r = 0.8; if (!G.goTo(g, x, y)) return lacher(g); } G.follow(g, 105, dt); return; }
    g.moving = false; g.path = null; g.face = (q.b.tx + 0.5) * T >= g.x ? 1 : -1;
    if (!q.fin) { q.fin = S.hour + (q.dur || rand(Tm.VISITE[0], Tm.VISITE[1])); q.mot = rand(0.6, 2.2); }
    if (!q.dit && (q.mot -= dt) <= 0) { q.dit = true; G.say(g, q.chant ? pick(CHANT) : dire(pick(MOTS), q.t.rec), 4.5); if (q.fleur) q.t.fleurs = S.day; q.encore = rand(9, 16); }
    else if (q.dit && q.soir && (q.encore -= dt) <= 0) { q.encore = rand(9, 16); G.say(g, q.chant ? pick(CHANT) : dire(pick(MOTS), q.t.rec), 4); }
    if (S.hour >= q.fin) lacher(g);
  };
  // ---------- chaque seconde : tenir la liste à jour, envoyer les demandes, les visites, la scène du soir ----------
  let tic = 0; const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || (tic -= dt) > 0) return; tic = 1; const l = liste(); if (!l.length) return; const m = ici(), p = S.player;
    for (const t of l.slice()) { // ramené par le sort : plus de pierre ; posée, enlevée : la barre suit
      if (S.goblins.some(g => g.id === t.rec.id && g.name === t.rec.name)) { oublier(t); continue; }
      const b = S.buildings.find(o => o.type === type(t));
      if (b && t.pose === null) t.pose = m; else if (!b && t.pose === m) { t.pose = null; t.finie = false; }
      if (b && !b.site && !t.finie) { t.finie = true; S.morale = Math.min(100, S.morale + 2); (S.tombeNotes || (S.tombeNotes = [])).push('🪦 La pierre tombale de ' + t.rec.name + ' est posée. Le clan peut venir ' + (fem(t.rec) ? 'la' : 'le') + ' saluer.'); }
    }
    const sc = R.tombeSoir; if (sc && (S.hour >= sc.fin || R.alarm || R.night)) R.tombeSoir = null;
    if (!calme() && !(S.hour > 18.3 && !R.alarm && !R.night && !R.cine)) return;
    // le soir, parfois, le clan se rassemble devant une pierre
    if (S.hour >= Tm.SOIR[0] && S.hour < Tm.SOIR[1] && S.tombeSoirJ !== S.day) { S.tombeSoirJ = S.day; const posees = l.filter(posee);
      if (posees.length && Math.random() < Tm.SOIR_CHANCE) { const t = pick(posees), b = posee(t), k = pick(['bougies', 'fleurs', 'chant']), qui = CG.shuffle(S.goblins.filter(dispo)).slice(0, irand(2, 4)), fin = S.hour + Tm.SOIR_DUREE;
        if (qui.length >= 2) { qui.forEach((g, i) => envoyer(g, t, b, { dx: (i - (qui.length - 1) / 2) * 26, dur: Tm.SOIR_DUREE, soir: true, chant: k === 'chant', fleur: k === 'fleurs', route: 60 })); R.tombeSoir = { t, k, fin };
          const noms = qui.map(g => g.name), tous = noms.slice(0, -1).join(', ') + ' et ' + noms[noms.length - 1], r = t.rec;
          (S.tombeNotes || (S.tombeNotes = [])).push(k === 'bougies' ? '🕯️ Hier soir, ' + tous + ' ont allumé des bougies devant la pierre de ' + r.name + '.' : k === 'fleurs' ? '🌼 Hier soir, ' + tous + ' ont déposé des fleurs sur la pierre de ' + r.name + '.' : '🎵 Hier soir, ' + tous + ' ont chanté une berceuse devant la pierre de ' + r.name + '.'); } }
      return; }
    if (!calme() || UI.modal) return;
    // les demandes : 1 à 4 par jour, tant qu'une pierre attend dans la barre
    const att = enAttente(), J = R.tombeJ && R.tombeJ.day === S.day ? R.tombeJ : (R.tombeJ = { day: S.day, n: irand(Tm.DEMANDES[0], Tm.DEMANDES[1]), fait: 0, cd: rand(25, 60), vis: rand(30, 70) });
    if (att.length && J.fait < J.n && (J.cd -= 1) <= 0 && Soc.inVillage() && !Soc.combat() && !S.goblins.some(g => g.ask)) {
      const cand = S.goblins.filter(g => dispo(g) && CG.dist(g, p) < 900); if (cand.length) { const g = pick(cand), t = pick(att); G.resetGoblin(g); g.ask = { t: 50 }; g.repath = 0; g.tombeDem = { id: t.id, t: R.t }; J.fait++; J.cd = rand(Tm.ENTRE[0], Tm.ENTRE[1]); if (Soc.timer !== undefined) Soc.timer = Math.max(Soc.timer, 40); } else J.cd = 8; }
    // les visites : de temps en temps, quelqu'un va se recueillir
    if ((J.vis -= 1) <= 0) { J.vis = rand(Tm.ENTRE_VISITES[0], Tm.ENTRE_VISITES[1]); const posees = l.filter(posee);
      if (posees.length && !S.goblins.some(g => g.recueil)) { const t = pick(posees), b = posee(t), cand = S.goblins.filter(g => dispo(g) && Math.hypot(g.x - b.tx * T, g.y - b.ty * T) < 1100); if (cand.length) envoyer(pick(cand), t, b, { fleur: Math.random() < 0.35 }); } }
  };
  // ---------- les nouvelles du lendemain ----------
  const an0 = G.applyNames; G.applyNames = function (lines) { const S = CG.S; if (S && S.tombeNotes && S.tombeNotes.length && Array.isArray(lines)) { S.tombeNotes.forEach(n => lines.push(n)); S.tombeNotes = []; } return an0.apply(this, arguments); };
  Tm.essai = function (nom) { const S = CG.S, g = S.goblins.find(o => !nom || o.name === nom); if (g) G.hurtGoblin(g, 99999); return liste()[liste().length - 1]; };
})(window.CG);
