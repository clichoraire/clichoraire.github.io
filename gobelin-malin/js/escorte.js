// Goblin Malin — l'escorte du chef. On peut demander à un garde ou à un chasseur de nous suivre (dans sa discussion) : MAX à la fois.
//   Il marche derrière le chef et se bat à ses côtés : le garde au corps à corps, le chasseur à l'arc, à distance.
//   Blessé (RECUL de sa vie ou moins), il ne rentre pas au village : il recule derrière le chef, à l'opposé des monstres, et il
//   ne retourne au combat qu'une fois soigné (RETOUR).
//   La vie de chacun s'affiche sous celle du chef ; le bouton « _ » replie la liste.
// Tout est réglable dans CG.Escorte.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, pick = CG.pick, dist = CG.dist;
  const Es = CG.Escorte = { MAX: 3, JOBS: ['garde', 'chasseur'], COMBAT: 300, PRES: 420, RECUL: 0.5, RETOUR: 0.8, DERRIERE: 70, TIR: 230, TROP_PRES: 95 };
  const fem = g => g.sex === 'f', esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  Es.liste = () => (CG.S ? CG.S.goblins.filter(g => g.escorte && !g.dead && !g.exile) : []);
  Es.peut = g => !!g && Es.JOBS.includes(g.job) && !g.child && !g.bebe && !g.exile;
  // combien de gobelins peuvent suivre le chef : aucun au départ, puis un par case « Escorte » de l'arbre (trois cases, MAX au plus). Les animaux, eux, n'ont pas de limite.
  Es.TECH = ['b51', 'b52', 'b53'];
  [{ id: 'b51', br: 'clan', t: 6, r: 0, cout: 2, icon: '🛡️', nom: 'Escorte I', desc: 'Nouveau pouvoir permanent : un garde ou un chasseur peut te suivre partout et se battre à tes côtés. Parle-lui et dis-lui « Suis-moi ».', req: ['b1'] },
    { id: 'b52', br: 'clan', t: 6, r: 1, cout: 3, icon: '🛡️', nom: 'Escorte II', desc: 'Un deuxième gobelin peut te suivre (2 en tout).', req: ['b51'] },
    { id: 'b53', br: 'clan', t: 6, r: 2, cout: 5, icon: '🛡️', nom: 'Escorte III', desc: 'Un troisième gobelin peut te suivre (3 en tout). C\'est le maximum.', req: ['b52'] }
  ].forEach(n => { CG.TECH.push(n); if (CG.TECH_BY_ID) CG.TECH_BY_ID[n.id] = n; if (CG.TECH_PARENT) CG.TECH_PARENT[n.id] = n.req[0]; });
  if (CG.Vues && CG.Vues.NIVEAU) { CG.Vues.NIVEAU.b52 = 'b51'; CG.Vues.NIVEAU.b53 = 'b52'; }
  Es.max = () => Math.min(Es.MAX, Es.TECH.filter(id => G.tech(id)).length);
  Es.partir = function (g) { if (!Es.peut(g) || Es.liste().length >= Es.max()) { CG.sfx('no'); return false; } if (g.perch && G.unperch) G.unperch(g); G.resetGoblin(g); g.ask = null; g.repli = null; g.escorte = true; g.repath = 0; g.emoteT = 1.2;
    G.say(g, pick(g.job === 'garde' ? ['Derrière toi, chef. Qu\'ils y viennent !', 'Je te suis. Personne ne te touchera.', 'Enfin un peu d\'action ! Je te colle aux talons.'] : ['Mon arc est prêt, chef. Je reste derrière toi.', 'Je te suis. Montre-moi quoi viser.', 'D\'accord, chef. Je tire, tu cognes.']), 4); CG.sfx('ok'); return true; };
  Es.rester = function (g, muet) { if (!g.escorte) return; g.escorte = false; g.escRecul = false; g.bubble = null; G.resetGoblin(g); if (!muet) G.say(g, pick(['D\'accord, chef. Je rentre au village.', 'Bien, chef. Je retourne à mon poste.', 'Fais attention à toi, chef.']), 3.5); };
  const plusPres = (g, p, r) => { let tgt = null, bd = r; for (const e of CG.R.enemies) { if (e.dead || e.calm || e.struct || e.charm > 0) continue; const d = dist(g, e); if (d < bd && dist(e, p) < Es.PRES) { bd = d; tgt = e; } } return tgt ? { e: tgt, d: bd } : null; };
  // appelé pour chaque gobelin de l'escorte, à la place de sa journée ordinaire (game.js)
  Es.step = function (g, dt) {
    const S = CG.S, R = CG.R, p = S.player; if (!g.escorte) return false; if (!Es.peut(g) || Es.liste().indexOf(g) >= Es.max()) { Es.rester(g, true); return false; } /* une ancienne partie avec plus de monde que l'arbre ne le permet : les derniers rentrent */
    if (R.night || g.nap) return false; /* la nuit, tout le monde dort : il reprend sa place au matin */
    if (g.perch && G.unperch) G.unperch(g); g.pose = null; g.hidden = false; g.panic = 0; g.alerte = 0;
    const mh = G.gobMaxHp(g); if (!g.escRecul && g.hp <= mh * Es.RECUL) { g.escRecul = true; G.say(g, pick(['Je recule, chef ! Couvre-moi !', 'Aïe ! Je passe derrière toi !', 'J\'ai mon compte, je reste derrière !']), 2.6); } else if (g.escRecul && g.hp >= mh * Es.RETOUR) g.escRecul = false;
    const dp = dist(g, p); if (dp > 900) { g.x = p.x - 30; g.y = p.y + 14; g.path = null; if (G.unstick) G.unstick(g, 8); return true; }
    const v = plusPres(g, p, g.job === 'chasseur' ? Es.COMBAT + 60 : Es.COMBAT);
    if (g.escRecul) { // blessé : derrière le chef, à l'opposé du monstre le plus proche
      g.state = 'suit'; g.melee = false; g.bubble = '🩹'; const m = plusPres(p, p, 500); let bx = p.x - (p.face || 1) * Es.DERRIERE, by = p.y + 10;
      if (m) { const dx = p.x - m.e.x, dy = p.y - m.e.y, l = Math.hypot(dx, dy) || 1; bx = p.x + dx / l * Es.DERRIERE; by = p.y + dy / l * Es.DERRIERE; }
      if (Math.hypot(bx - g.x, by - g.y) > 22) G.chase(g, bx, by, 150, dt); else { g.moving = false; g.face = p.x > g.x ? 1 : -1; } return true; }
    if (v) { g.bubble = null; const e = v.e, d = v.d;
      if (g.job !== 'chasseur') { G.guardFight(g, e, d, dt); return true; }
      g.state = 'fight'; g.melee = false; const dx = g.x - e.x, dy = g.y - e.y; /* le chasseur : à l'arc, jamais au contact */
      if (d < Es.TROP_PRES) G.chase(g, g.x + dx / d * 70, g.y + dy / d * 70, 110, dt); else if (d > Es.TIR) G.chase(g, e.x, e.y, 110, dt); else { g.moving = false; g.path = null; }
      if (!g.moving) g.face = e.x > g.x ? 1 : -1;
      if (g.atkCd <= 0 && d <= Es.TIR + 20 && (!G.shotClear || G.shotClear(g, e))) { const Gi = CG.Gibier; g.atkCd = Gi && Gi.DEF ? Gi.DEF.CD : 1.6; g.atkAnim = 1; g.face = e.x > g.x ? 1 : -1; G.shoot(g, e, 'arrow', Gi && Gi.degats ? Gi.degats(g) : G.guardDmg(g) * 0.7, 'g', g); }
      return true; }
    if (g.state === 'fight') { g.path = null; g.melee = false; } g.state = 'suit'; g.bubble = null;
    if (dp > 62) { g.repath = (g.repath || 0) - dt; if (!g.path || !g.path.length || g.repath <= 0) { const k = Es.liste().indexOf(g) - 1; if (!G.goTo(g, p.x - (p.face || 1) * 30, p.y + 12 + k * 16)) G.goTo(g, p.x, p.y); g.repath = 0.6; } G.follow(g, dp > 190 ? 200 : 140, dt); }
    else { g.moving = false; g.path = null; g.face = p.x > g.x ? 1 : -1; }
    return true;
  };
  // la sauvegarde
  { const pk = CG.pack; if (pk) CG.pack = function () { const d = pk.apply(this, arguments), S = CG.S; if (d && d.goblins && S) d.goblins.forEach((o, i) => { const g = S.goblins[i]; if (g && g.escorte) o.escorte = true; }); return d; }; }
  // dans la discussion du gobelin
  if (G.nameOpt) { const no0 = G.nameOpt; G.nameOpt = function (o) {
    const base = no0.apply(this, arguments) || []; if (!o || o.pet || !o.met || !Es.peut(o) || o.demenage) return base; const il = fem(o) ? 'Elle' : 'Il', n = Es.liste().length;
    return base.concat(o.escorte ? [{ label: '🏠 Retourne au village', sub: il + ' arrête de te suivre et reprend son poste', fn: () => Es.rester(o) }]
      : !Es.max() ? [] /* sans la case « Escorte I » de l'arbre, le choix n'existe pas */ : [{ label: '🛡️ Suis-moi', sub: n >= Es.max() ? 'Ton escorte est complète (' + Es.max() + ' pour l\'instant)' : il + ' te suit partout et se bat à tes côtés' + (o.job === 'chasseur' ? ', à l\'arc' : '') + ' · escorte ' + n + ' / ' + Es.max(), disabled: n >= Es.max(), fn: () => Es.partir(o) }]);
  }; }
  // ---------- leurs vies, sous celle du chef ----------
  if (!document.getElementById('esc-css')) { const st = document.createElement('style'); st.id = 'esc-css'; st.textContent =
    '#escorte{margin-top:7px;padding-top:6px;border-top:1px solid rgba(255,220,150,.2);font:600 11.5px "Trebuchet MS",system-ui,sans-serif;color:#f0e4c8}#escorte:empty{display:none}'
    + '#escorte .es-t{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#d8b878}'
    + '#escorte .es-b{pointer-events:auto;width:22px;height:17px;padding:0;border-radius:5px;border:1px solid #8a6a3a;background:#3a2a14;color:#ffe9b8;font:800 12px/12px "Trebuchet MS",system-ui,sans-serif;cursor:pointer}#escorte .es-b:hover{background:#5a401c}'
    + '#escorte .es-g{margin-top:4px}#escorte .es-n{display:flex;justify-content:space-between;gap:6px;white-space:nowrap;overflow:hidden}#escorte .es-n small{opacity:.75;font-weight:400}'
    + '#escorte .es-v{position:relative;height:11px;margin-top:2px;border-radius:5px;background:rgba(0,0,0,.55);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}#escorte .es-v i{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:linear-gradient(180deg,#7ad85a,#3f9a34)}#escorte .es-v.mi i{background:linear-gradient(180deg,#f0c040,#c88a18)}#escorte .es-v.bas i{background:linear-gradient(180deg,#f06a4a,#b82a1e)}'
    + '#escorte .es-v span{position:absolute;inset:0;text-align:center;font:700 9.5px/11px "Trebuchet MS",system-ui,sans-serif;color:#fff;text-shadow:0 1px 1px #000}';
    document.head.appendChild(st); }
  let plie = false; try { plie = localStorage.getItem('goblin-malin-escorte-plie') === '1'; } catch (e) { plie = false; }
  let dernier = null, tic = 0;
  function cadre() { const pl = document.getElementById('player'); if (!pl) return null; let el = document.getElementById('escorte'); if (!el) { el = document.createElement('div'); el.id = 'escorte'; const bf = document.getElementById('buffs'); if (bf && bf.parentNode === pl) pl.insertBefore(el, bf); else pl.appendChild(el);
      el.addEventListener('click', ev => { if (!ev.target.closest('.es-b')) return; plie = !plie; try { localStorage.setItem('goblin-malin-escorte-plie', plie ? '1' : '0'); } catch (e) { /* tant pis */ } dernier = null; dessiner(); }); } return el; }
  function dessiner() {
    const el = cadre(); if (!el) return; const l = Es.liste(); let h = '';
    if (l.length) { h = '<div class="es-t"><span>🛡️ Escorte ' + l.length + ' / ' + Es.max() + '</span><button class="es-b" title="' + (plie ? 'Montrer les vies de l\'escorte' : 'Replier') + '">' + (plie ? '▢' : '_') + '</button></div>';
      if (!plie) l.forEach(g => { const mh = G.gobMaxHp(g), hp = Math.max(0, Math.ceil(g.hp)), k = Math.max(0, Math.min(1, g.hp / mh)), J = CG.JOBS[g.job];
        h += '<div class="es-g"><div class="es-n"><span>' + J.icon + ' ' + esc(g.name) + (g.escRecul ? ' 🩹' : '') + '</span><small>niv. ' + g.lvl + '</small></div><div class="es-v' + (k <= Es.RECUL ? ' bas' : k < 0.75 ? ' mi' : '') + '"><i style="width:' + Math.round(k * 100) + '%"></i><span>' + hp + ' / ' + mh + '</span></div></div>'; }); }
    if (h !== dernier) { dernier = h; el.innerHTML = h; }
  }
  const up0 = G.update; G.update = function (dt) { const r = up0.apply(this, arguments); tic -= dt; if (tic <= 0) { tic = 0.2; try { dessiner(); } catch (e) { /* jamais bloquant */ } } return r; };
})(window.CG);
