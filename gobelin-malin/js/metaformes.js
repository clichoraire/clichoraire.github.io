// Goblin Malin — une seule Métamorphose. Le grimoire n'a plus qu'UN sort « Métamorphose » (cercle 3) : le parchemin apprend
// la première forme, le squelette. Les autres formes (loup-garou, ours, démon) ne sont plus des parchemins : ce sont des
// secrets qu'on achète très cher à certains marchands de passage. Dès qu'on en connaît plus d'une, lancer le sort ouvre
// un petit choix (le jeu attend). Chargé en dernier. Tout se règle dans CG.MetaFormes.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, Me = CG.Meta, SP = CG.SPELLS, Nv = CG.Niveaux; if (!Me || !Me.F) return;
  const BASE = 'metaSquelette', AUTRES = ['metaLoup', 'metaOurs', 'metaDemon'];
  const Mf = CG.MetaFormes = { BASE, AUTRES, CHANCE: 0.35,
    PRIX: { metaLoup: 1500, metaOurs: 2500, metaDemon: 5000 },
    VEND: { metaLoup: ['elfe', 'sorciere', 'demonMarchand', 'lapin'], metaOurs: ['nain', 'sorciere', 'demonMarchand'], metaDemon: ['sorciere', 'demonMarchand'] } };
  const joueur = () => CG.S.player, formes = () => { const p = joueur(); return p.formes || (p.formes = {}); };
  const sait = () => { const p = joueur(); return p.spells.includes(BASE); };
  Mf.a = id => id === BASE || !!(CG.S && joueur().formes && joueur().formes[id]);
  Mf.connues = () => [BASE].concat(AUTRES.filter(Mf.a));

  // ---------- le sort : un nom, une page ----------
  AUTRES.forEach(id => { const i = CG.SCROLL_POOL.indexOf(id); if (i >= 0) CG.SCROLL_POOL.splice(i, 1); }); // plus jamais en parchemin
  { const nom = 'Métamorphose', court = 'Tu te changes en créature. Ta première forme : le squelette !',
      desc = 'Tu te changes en créature ! Ce parchemin t\'apprend une première forme : le squelette qui fait clic-clac. On raconte qu\'il existe d\'autres formes, mais aucun parchemin ne les donne... Ta mana baisse tout le temps que tu es transformé : quand il n\'y en a plus, pouf, tu redeviens toi. Tes sorts sont remplacés par les deux attaques de la créature, en bas à gauche.';
    SP[BASE].nom = nom; SP[BASE].desc = desc; SP[BASE].court = court; if (Nv && Nv.BASE && Nv.BASE[BASE]) { Nv.BASE[BASE].nom = nom; Nv.BASE[BASE].desc = desc; } if (Nv && Nv.rafraichir) Nv.rafraichir(); }
  if (CG.SortsDesc && CG.SortsDesc.livre) { const l0 = CG.SortsDesc.livre; CG.SortsDesc.livre = function (id) { const t = l0.apply(this, arguments); if (id !== BASE || !CG.S) return t; return t + '<br><b>Formes connues</b> : ' + Mf.connues().map(f => Me.F[f].icon + ' ' + Me.F[f].nom).join(' · '); }; }

  // ---------- apprendre une forme ----------
  Mf.apprendre = function (id) { if (!Me.F[id] || Mf.a(id)) return false; formes()[id] = true; const f = Me.F[id], p = joueur(); CG.sfx('level'); G.puff(p.x, p.y - 24, f.col, 30, 180, 5);
    G.banner('Nouvelle forme !', f.icon + ' ' + f.nom + ' : lance Métamorphose pour la choisir.', '#ffe36b'); try { CG.save(); } catch (e) { /* rien */ } return true; };
  Mf.article = function (id) { const f = Me.F[id]; return { forme: id, icon: f.icon, label: 'Secret de forme : ' + f.nom, desc: 'Une nouvelle forme pour ton sort Métamorphose : ' + f.coup + ', ' + f.desc + '.', prix: Mf.PRIX[id], stock: 1, buy: () => Mf.apprendre(id) }; };
  { const sh0 = UI.shop; UI.shop = function (v) {
    try { if (v && v.shop) { for (let i = v.shop.length - 1; i >= 0; i--) if (AUTRES.includes(v.shop[i].scroll)) v.shop.splice(i, 1); /* un vieux parchemin de forme n'a plus cours */
      if (v.formeVu === undefined && sait()) { v.formeVu = true; const l = AUTRES.filter(id => !Mf.a(id) && Mf.VEND[id].includes(v.role)); if (l.length && Math.random() < Mf.CHANCE) v.shop.push(Mf.article(l[0])); }
      v.shop.forEach(it => { if (it.forme && Mf.a(it.forme)) it.stock = 0; }); } } catch (e) { /* jamais bloquant */ }
    return sh0.apply(this, arguments); }; }
  // un parchemin de forme donné quelque part devient le parchemin de Métamorphose (ou un autre, si on l'a déjà)
  { const gs0 = G.giveScroll; G.giveScroll = function (id) { if (AUTRES.includes(id)) { const p = joueur(), autre = p.spells.includes(BASE) || p.scrolls[BASE] ? (G.newScroll && G.newScroll(true)) : BASE; if (!autre) return; arguments[0] = autre; } return gs0.apply(this, arguments); }; }

  // ---------- une ancienne partie : ses sorts de forme deviennent des formes ----------
  function ranger() { const p = joueur(); let eu = false;
    AUTRES.forEach(id => { const i = p.spells.indexOf(id); if (i >= 0) { p.spells.splice(i, 1); formes()[id] = true; eu = true; } if (p.scrolls && p.scrolls[id]) { delete p.scrolls[id]; formes()[id] = true; eu = true; }
      if (CG.Barre && CG.Barre.cases) { const C = CG.Barre.cases(); for (let k = 0; k < C.length; k++) if (C[k] === id) C[k] = null; } });
    if (eu && !p.spells.includes(BASE)) { if (p.scrolls) delete p.scrolls[BASE]; p.spells.push(BASE); } }
  { const up = D.update; D.update = function () { const R = CG.R; if (R && CG.S && R.mfVu !== CG.S) { R.mfVu = CG.S; try { ranger(); } catch (e) { /* rien */ } } return up.apply(this, arguments); }; }

  // ---------- lancer : le choix de la forme ----------
  let el = null, touche = null;
  function fermer() { if (el) { el.remove(); el = null; } if (touche) { window.removeEventListener('keydown', touche, true); touche = null; } if (UI.modal && UI.modal.name === 'formes') UI.modal = null; }
  function choisir(lancer) {
    fermer(); const p = joueur(), l = Mf.connues();
    el = document.createElement('div'); el.id = 'formes-ui';
    el.innerHTML = '<div class="fo-titre">En quoi te changes-tu ?</div><div class="fo-rang">' + l.map((id, i) => { const f = Me.F[id], c = G.spellCost(id), non = p.mp < c;
      return '<button class="fo-c' + (non ? ' non' : '') + '" data-id="' + id + '" style="--c:' + f.col + ';--i:' + i + '"><u>' + (i + 1) + '</u><i>' + f.icon + '</i><b>' + f.nom + '</b><span>' + f.coup + '</span><em>💧 ' + c + '</em></button>'; }).join('') + '</div><div class="fo-bas">Échap : annuler</div>';
    document.body.appendChild(el);
    const prendre = id => { const c = G.spellCost(id); if (p.mp < c) { CG.sfx('no'); return; } fermer(); lancer(id); };
    el.querySelectorAll('.fo-c').forEach(b => { b.onclick = () => prendre(b.dataset.id); }); el.onclick = e => { if (e.target === el) fermer(); };
    touche = e => { const n = +e.key; if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); return fermer(); } if (n >= 1 && n <= l.length) { e.stopPropagation(); e.preventDefault(); prendre(l[n - 1]); } else if (e.key.length === 1) { e.stopPropagation(); } };
    window.addEventListener('keydown', touche, true);
    if (UI.modal && !UI.modal.pauses) UI.close(); UI.modal = { name: 'formes', closable: true, pauses: true };
  }
  { const c0 = G.cast; G.cast = function (id) {
    if (id !== BASE) return c0.apply(this, arguments);
    const S = CG.S, R = CG.R, moi = this; if (!S || !R) return c0.apply(this, arguments);
    if (R.meta && R.meta.t > 0) return c0.call(this, R.meta.id); // déjà transformé : l'attaque de la créature
    const l = Mf.connues(); if (l.length < 2) return c0.call(this, BASE);
    if (R.ko > 0 || R.cine || R.night || R.castCd > 0) return;
    choisir(f => { const p = joueur(), n = Nv && Nv.niv ? Nv.niv(BASE) : 1; if (f !== BASE && n > 1) { p.sortNiv = p.sortNiv || {}; p.sortNiv[f] = n; } /* les formes suivent le niveau du sort */ c0.call(moi, f); });
  }; }
  if (!document.getElementById('fo-css')) { const st = document.createElement('style'); st.id = 'fo-css'; st.textContent =
    '#formes-ui{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:radial-gradient(ellipse at center,rgba(20,12,34,.72),rgba(6,4,12,.9));font-family:"Trebuchet MS",system-ui,sans-serif;animation:foIn .18s ease-out}@keyframes foIn{from{opacity:0}}'
    + '.fo-titre{color:#fff;font:900 clamp(24px,3.6vw,40px)/1 "Trebuchet MS",system-ui,sans-serif;text-shadow:0 3px 0 #1a0c2a,0 0 24px rgba(190,140,255,.7)}.fo-rang{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;padding:0 16px}'
    + '.fo-c{position:relative;width:150px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 10px 12px;color:#fff;font:inherit;cursor:pointer;border-radius:18px;border:3px solid var(--c);background:linear-gradient(170deg,rgba(70,50,100,.92),rgba(22,14,36,.96));box-shadow:0 7px 0 #0c0616,0 12px 24px rgba(0,0,0,.55),inset 0 2px 0 rgba(255,255,255,.18);transition:transform .12s,filter .12s;animation:foPop .4s cubic-bezier(.2,1.5,.4,1) calc(var(--i)*.07s) both}@keyframes foPop{from{opacity:0;transform:translateY(20px) scale(.8)}}'
    + '.fo-c:hover,.fo-c:focus-visible{transform:translateY(-5px);filter:brightness(1.18);outline:none}.fo-c:active{transform:translateY(4px)}.fo-c i{font:normal 52px/1 sans-serif;filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))}.fo-c b{font:900 18px/1.1 "Trebuchet MS",system-ui,sans-serif;color:var(--c)}.fo-c span{font-size:12.5px;opacity:.85;text-align:center}.fo-c em{font-style:normal;font-weight:700;font-size:13px;color:#9ad0ff}'
    + '.fo-c u{position:absolute;left:-9px;top:-11px;min-width:26px;height:26px;display:grid;place-items:center;text-decoration:none;font:900 14px "Trebuchet MS",system-ui,sans-serif;color:#3a2710;background:linear-gradient(#fff3c8,#e8c860);border:3px solid #2a1808;border-radius:9px}.fo-c.non{filter:grayscale(.8) brightness(.6);cursor:not-allowed}.fo-c.non em{color:#ff8a7a}.fo-bas{color:#cfc4e6;font-size:13px}';
    document.head.appendChild(st); }
})(window.CG);
