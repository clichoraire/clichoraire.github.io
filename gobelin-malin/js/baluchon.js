// Goblin Malin — le baluchon à parchemins. On commence la partie avec, dans le sac. Une fois glissé dans sa case à lui
//   (« Baluchon », sur le chef), tous les parchemins à usage unique s'y rangent tout seuls : ils ne prennent plus de cases
//   dans le sac, et il n'y a aucune limite. Un clic (ou un toucher) sur le baluchon porté ouvre sa fenêtre : les parchemins
//   posés sur un gros baluchon de toile. On en touche un, puis on choisit : le mettre dans la barre de sorts, ou le sortir
//   dans le sac (pour le ranger au coffre, par exemple). Les tomes à copier, eux, restent dans le sac.
//   Sans le baluchon dans sa case, rien ne change : les parchemins restent dans le sac, comme avant.
// Tout se règle dans CG.Baluchon.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Bq = CG.Banque, Iv = CG.Inventaire; if (!G || !UI || !Bq || !Iv) return;
  const Ba = CG.Baluchon = { K: 'baluchon', IC: '👝', NOM: 'Baluchon à parchemins', COLONNES: 6 };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const joueur = () => CG.S && CG.S.player, pun = () => { const p = joueur(); return p.parchUn || (p.parchUn = {}); }, hors = () => { const p = joueur(); return p.parchHors || (p.parchHors = {}); };
  Bq.NOMS[Ba.K] = ['', Ba.NOM]; Bq.IC[Ba.K] = Ba.IC;
  if (CG.Objets && CG.Objets.PHRASE) CG.Objets.PHRASE[Ba.K] = 'Un baluchon sans fond pour tes parchemins. Glisse-le dans sa case, sur toi : tes parchemins s\'y rangent tout seuls. Touche-le pour l\'ouvrir.';
  Ba.porte = () => { const p = joueur(); return !!(p && p.porte && p.porte.baluchon && p.porte.baluchon.k === Ba.K); };
  Ba.ids = () => Object.keys(pun()).filter(id => pun()[id] > 0 && CG.SPELLS[id]);
  Ba.dedans = () => (Ba.porte() ? Ba.ids().filter(id => !hors()[id]) : []);
  Ba.dansSac = id => !Ba.porte() || !!hors()[id]; /* inventaire.js : ce parchemin se montre-t-il dans le sac ? */
  Ba.total = () => Ba.dedans().reduce((n, id) => n + Math.floor(pun()[id]), 0);
  { const e0 = Bq.effet; Bq.effet = function (k) { return k === Ba.K ? 'Garde tous tes parchemins' : e0.apply(this, arguments); };
    const i0 = Iv.effet; Iv.effet = function (it) { if (!it || it.k !== Ba.K) return i0.apply(this, arguments); const n = Ba.total(); return Ba.porte() ? (n ? n + ' parchemin' + (n > 1 ? 's' : '') + ' dedans' : 'Vide pour l\'instant') + ', Touche-le pour l\'ouvrir' : 'Glisse-le dans la case « Baluchon »'; }; }
  // ---------- on commence avec : une fois par chef (les parties déjà commencées le reçoivent aussi) ----------
  function donner() { const p = joueur(); if (!p || p.baluchonEu) return; const tous = (p.sac || []).concat(p.porte ? [p.porte.baluchon] : [], (CG.S.coffre || [])); p.baluchonEu = true; if (!tous.some(it => it && it.k === Ba.K)) Bq.deposer(Ba.K, 1, 1, 'sac'); }
  { const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments); try { donner(); } catch (e) { /* jamais bloquant */ } return r; }; }
  { let vu = 0; const up0 = G.update; G.update = function (dt) { const r = up0.apply(this, arguments); vu -= dt; if (vu <= 0) { vu = 1; try { donner(); const h = hors(); Object.keys(h).forEach(id => { if (!(pun()[id] > 0)) delete h[id]; }); } catch (e) { /* rien */ } } return r; }; }
  { const pk = CG.pack; if (pk) CG.pack = function () { const d = pk.apply(this, arguments), p = joueur(); if (d && d.player && p) { d.player.baluchonEu = !!p.baluchonEu; d.player.parchHors = p.parchHors || {}; } return d; }; }

  // ---------- la fenêtre ----------
  if (!document.getElementById('bl-css')) { const st = document.createElement('style'); st.id = 'bl-css'; st.textContent =
    '#panel.baluchon{max-width:640px;max-height:94vh;overflow-y:auto;background:linear-gradient(180deg,#2a2018,#1a140e);border:2px solid #7a5a34;box-shadow:0 18px 60px rgba(0,0,0,.7),inset 0 0 50px rgba(0,0,0,.45);color:#eadcc0;user-select:none;-webkit-user-select:none}' +
    '.bl-haut{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:0 4px 8px}.bl-haut h2{margin:0;font:700 24px Luminari,"Apple Chancery",Georgia,fantasy;color:#ffe9b8;text-shadow:0 2px 0 #000}.bl-haut small{opacity:.75;font-size:12.5px}' +
    '.bl-toile{position:relative;min-height:300px;border-radius:14px;overflow:hidden;background:radial-gradient(ellipse at 50% 60%,#3a2c1e,#1c150e)}.bl-toile svg.bl-fond{position:absolute;left:50%;top:50%;width:min(96%,560px);transform:translate(-50%,-50%);opacity:.95;pointer-events:none}' +
    '.bl-grille{position:relative;display:grid;gap:10px 9px;justify-content:center;padding:92px 16px 34px}' +
    '.bl-p{position:relative;width:64px;height:76px;border:0 !important;background:none !important;box-shadow:none !important;cursor:pointer;padding:0;touch-action:manipulation;transition:transform .12s}.bl-p svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}' +
    '.bl-p em{position:absolute;left:0;right:0;top:23px;text-align:center;font-style:normal;font-size:25px;line-height:1}.bl-p u{position:absolute;right:1px;bottom:9px;min-width:20px;padding:1px 4px;border-radius:9px;background:#7a2416;box-shadow:0 1px 2px rgba(0,0,0,.5);text-decoration:none;font:800 12px "Trebuchet MS",system-ui,sans-serif;color:#fff3d0}.bl-p i{position:absolute;left:-3px;top:-5px;font-style:normal;font-size:15px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.6))}' +
    '.bl-p:hover{transform:translateY(-2px)}.bl-p.on{transform:translateY(-5px) scale(1.07)}.bl-p.on .bl-feuille{stroke:#ffb400;stroke-width:3}.bl-p.on .bl-rouleau{stroke:#ffb400;stroke-width:2}' +
    /* le baluchon s'ouvre : il se pose en rebondissant, le noeud se défait, l'ouverture s'élargit, puis les parchemins en sortent un à un */
    '.bl-fond .bl-noeud{opacity:0}.bl-fond .bl-bouche{transform-box:fill-box;transform-origin:50% 60%}' +
    '.bl-toile.ouvre .bl-fond{animation:bl-pose .45s cubic-bezier(.3,1.5,.5,1) both}.bl-toile.ouvre .bl-noeud{transform-box:fill-box;transform-origin:50% 80%;animation:bl-noeud .6s .3s ease-in both}.bl-toile.ouvre .bl-bouche{animation:bl-bouche .4s .62s cubic-bezier(.3,1.6,.5,1) both}.bl-toile.ouvre .bl-p{animation:bl-sort .42s cubic-bezier(.3,1.5,.5,1) both;animation-delay:calc(.85s + var(--i,0) * .06s)}.bl-toile.ouvre .bl-vide{animation:bl-fondu .4s .9s both}' +
    '@keyframes bl-pose{0%{transform:translate(-50%,-50%) scale(.55,.5);opacity:0}100%{transform:translate(-50%,-50%) scale(1);opacity:.95}}@keyframes bl-noeud{0%{opacity:1;transform:rotate(0) scale(1)}35%{opacity:1;transform:rotate(-14deg) scale(1.12)}60%{opacity:1;transform:rotate(12deg) scale(1.05)}100%{opacity:0;transform:rotate(30deg) scale(.2) translateY(-30px)}}' +
    '@keyframes bl-bouche{0%{transform:scale(.15,0);opacity:0}100%{transform:scale(1);opacity:1}}@keyframes bl-sort{0%{transform:translateY(46px) scale(.2) rotate(-18deg);opacity:0}100%{transform:none;opacity:1}}@keyframes bl-fondu{0%{opacity:0}100%{opacity:1}}' +
    '.bl-vide{position:relative;text-align:center;padding:120px 20px 110px;font-size:14.5px;color:#f4e6c4;text-shadow:0 1px 3px #000}' +
    '.bl-choix{min-height:92px;margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.28);border:1px solid rgba(255,220,150,.18)}.bl-choix b{font:700 16px "Trebuchet MS",system-ui,sans-serif;color:#fff3d0}.bl-choix p{margin:3px 0 9px;font-size:13px;line-height:1.4;opacity:.9}' +
    '.bl-btns{display:flex;flex-wrap:wrap;gap:8px}.bl-btns button,.bl-bas button{padding:9px 16px;min-height:40px;touch-action:manipulation}.bl-bas{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap}' +
    '#panel.inventaire .iv-s[data-i="baluchon"] .iv-it{cursor:pointer}'; document.head.appendChild(st); }
  // le gros baluchon de toile, noué sur son bâton : le fond de la fenêtre
  const FOND = '<svg class="bl-fond" viewBox="0 0 560 330" aria-hidden="true"><line x1="40" y1="306" x2="520" y2="60" stroke="#5a3c1e" stroke-width="13" stroke-linecap="round"/><line x1="40" y1="306" x2="520" y2="60" stroke="#7a5630" stroke-width="5" stroke-linecap="round"/>'
    + '<path d="M84 176 C64 100 170 58 290 66 C410 58 506 108 480 196 C470 266 380 316 280 314 C170 318 96 266 84 176Z" fill="#b8452e"/><path d="M290 66 C410 58 506 108 480 196 C470 266 380 316 280 314 C366 284 424 204 384 122 C364 88 330 72 290 66Z" fill="#96341f"/>'
    + '<g fill="#f2e4c0" opacity=".85"><circle cx="140" cy="160" r="9"/><circle cx="204" cy="208" r="9"/><circle cx="262" cy="168" r="9"/><circle cx="318" cy="226" r="9"/><circle cx="396" cy="176" r="9"/><circle cx="250" cy="272" r="9"/><circle cx="424" cy="244" r="9"/><circle cx="136" cy="238" r="9"/><circle cx="342" cy="150" r="9"/></g>'
    + '<g class="bl-bouche"><path d="M150 84 C120 40 96 34 78 50 C104 60 118 84 138 104Z" fill="#c9553a"/><path d="M420 84 C452 40 478 36 494 54 C468 62 452 86 432 106Z" fill="#a83c26"/>' /* les deux coins de toile, retombés de chaque côté */
    + '<ellipse cx="286" cy="84" rx="150" ry="34" fill="#c9553a"/><ellipse cx="286" cy="86" rx="132" ry="25" fill="#2a100a"/><path d="M158 90 C200 112 372 112 414 90 C380 122 196 122 158 90Z" fill="#96341f"/>'
    + '<g opacity=".9"><rect x="214" y="62" width="20" height="34" rx="3" fill="#f6e7bd" transform="rotate(-12 224 80)"/><rect x="262" y="54" width="20" height="40" rx="3" fill="#efdca8"/><rect x="312" y="60" width="20" height="36" rx="3" fill="#f6e7bd" transform="rotate(10 322 78)"/></g><path d="M154 86 C154 110 418 110 418 86 C418 118 154 118 154 86Z" fill="#b8452e"/></g>' /* l'ouverture : on voit le fond sombre et le haut de quelques rouleaux */
    + '<g class="bl-noeud"><path d="M250 92 C214 44 292 26 312 58 C350 24 404 54 350 92 C326 106 276 106 250 92Z" fill="#c9553a"/><path d="M288 74 C292 58 318 58 318 76 C316 92 290 92 288 74Z" fill="#96341f"/></g></svg>';
  // un parchemin : une feuille entre deux rouleaux, un cachet de cire rouge en bas, l'icône du sort au milieu
  const ROULEAU = y => '<rect class="bl-rouleau" x="3" y="' + y + '" width="58" height="12" rx="6" fill="#e6cd92" stroke="#a37b3a" stroke-width="1.2"/><rect x="9" y="' + (y + 2.4) + '" width="46" height="2.6" rx="1.3" fill="#f6e7bd"/><ellipse cx="6" cy="' + (y + 6) + '" rx="3.2" ry="6" fill="#c19a55" stroke="#a37b3a" stroke-width="1"/><ellipse cx="58" cy="' + (y + 6) + '" rx="3.2" ry="6" fill="#c19a55" stroke="#a37b3a" stroke-width="1"/>';
  const PARCH = '<svg viewBox="0 0 64 76" aria-hidden="true"><rect x="9" y="12" width="46" height="54" fill="rgba(0,0,0,.28)" transform="translate(2 3)"/><rect class="bl-feuille" x="9" y="10" width="46" height="56" fill="#f8ecc8" stroke="#c9a868" stroke-width="1.2"/><path d="M9 10h46v9H9z" fill="rgba(160,120,50,.16)"/><path d="M9 57h46v9H9z" fill="rgba(160,120,50,.16)"/>'
    + '<g stroke="#b79a62" stroke-width="1.3" stroke-linecap="round" opacity=".55"><path d="M15 23h14M43 23h6M15 51h8M37 51h12"/></g>' + ROULEAU(2) + ROULEAU(60) + '<circle cx="32" cy="68" r="5.2" fill="#c0392b" stroke="#8a2318" stroke-width="1"/><circle cx="30.6" cy="66.6" r="1.5" fill="#e87a6a"/></svg>';
  let choisi = null, anime = false; /* anime : seulement au moment où on l'ouvre, pas à chaque parchemin touché */
  function rendu() {
    if (!UI.modal || UI.modal.name !== 'baluchon') return; const p = joueur(), ids = Ba.dedans().sort((a, b) => (CG.cercle ? CG.cercle(a) - CG.cercle(b) : 0) || (CG.SPELLS[a].nom < CG.SPELLS[b].nom ? -1 : 1)), dehors = Ba.ids().filter(id => hors()[id]);
    if (choisi && !ids.includes(choisi)) choisi = null; const col = Math.max(1, Math.min(Ba.COLONNES, ids.length));
    let h = '<div class="bl-haut"><h2>' + Ba.IC + ' Ton baluchon</h2><small>' + (ids.length ? 'Touche un parchemin pour choisir quoi en faire' : '') + '</small></div><div class="bl-toile' + (anime ? ' ouvre' : '') + '">' + FOND;
    if (ids.length) h += '<div class="bl-grille" style="grid-template-columns:repeat(' + col + ',64px)">' + ids.map(id => { const sp = CG.SPELLS[id], barre = !!(p.parchBarre && p.parchBarre[id]); return '<button class="bl-p' + (choisi === id ? ' on' : '') + '" data-id="' + id + '" style="--i:' + ids.indexOf(id) + '" title="' + esc(sp.nom) + '">' + PARCH + '<em>' + sp.icon + '</em>' + (barre ? '<i>⭐</i>' : '') + '<u>×' + Math.floor(pun()[id]) + '</u></button>'; }).join('') + '</div>';
    else h += '<div class="bl-vide">Ton baluchon est vide.<br>Les parchemins que tu trouveras viendront se ranger ici tout seuls.</div>';
    h += '</div><div class="bl-choix">';
    if (choisi) { const sp = CG.SPELLS[choisi], barre = !!(p.parchBarre && p.parchBarre[choisi]), n = Math.floor(pun()[choisi]);
      h += '<b>📜 ' + esc(sp.nom) + ' × ' + n + '</b><p>' + esc(sp.court || sp.desc || '') + ' Un seul usage, sans mana.' + (barre ? ' ⭐ Il est dans ta barre de sorts.' : '') + '</p><div class="bl-btns"><button id="bl-barre">' + (barre ? '↩ Retirer de la barre de sorts' : '⭐ Mettre dans la barre de sorts') + '</button><button id="bl-sortir">🎒 Sortir dans mon sac</button></div>'; }
    else h += '<p style="margin:6px 0">' + (ids.length ? 'Touche un parchemin : tu pourras le mettre dans ta barre de sorts, ou le sortir dans ton sac.' : 'Avec cinq parchemins du même sort, une Tour de magie les relie en un tome.') + '</p>';
    h += '</div><div class="bl-bas"><span>' + (dehors.length ? '<button id="bl-ranger">📥 Ranger ici les parchemins de mon sac (' + dehors.length + ')</button>' : '') + '</span><span><button id="bl-sac">🎒 Mon sac</button> <button id="bl-non">Refermer (Échap)</button></span></div>';
    const pan = document.getElementById('panel'); pan.innerHTML = h; pan.className = 'baluchon wide'; anime = false;
    pan.querySelectorAll('.bl-p').forEach(b => b.onclick = () => { choisi = choisi === b.dataset.id ? null : b.dataset.id; CG.sfx('click'); rendu(); });
    const lier = (id, fn) => { const b = document.getElementById(id); if (b) b.onclick = fn; };
    lier('bl-non', UI.dismiss); lier('bl-sac', () => { UI.close(); Iv.ouvrir({ force: true }); });
    lier('bl-barre', () => { if (CG.ParchUn && choisi) { CG.ParchUn.barre(choisi); CG.sfx('page'); } rendu(); });
    lier('bl-sortir', () => { if (choisi) { hors()[choisi] = 1; choisi = null; CG.sfx('click'); } rendu(); });
    lier('bl-ranger', () => { const h2 = hors(); Object.keys(h2).forEach(id => delete h2[id]); CG.sfx('click'); rendu(); });
  }
  Ba.ouvrir = function () { if (!CG.S || !CG.R || !Ba.porte()) return false; choisi = null; anime = true; UI.open('baluchon', '', true, true); if (UI.modal) UI.modal.pauses = true; rendu(); return true; };
  Ba.rendu = rendu;
  // un clic ou un toucher sur le baluchon porté (sans l'avoir fait glisser) : il s'ouvre
  { let depart = null;
    const sur = el => (el && el.closest ? el.closest('#panel.inventaire .iv-s[data-z="chef"][data-i="baluchon"]') : null);
    document.addEventListener('pointerdown', ev => { depart = !ev.button && UI.modal && UI.modal.name === 'inventaire' && sur(ev.target) && Ba.porte() ? { x: ev.clientX, y: ev.clientY } : null; }, true);
    document.addEventListener('pointerup', ev => { const d = depart; depart = null; if (!d || Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 6 || !UI.modal || UI.modal.name !== 'inventaire' || !Ba.porte()) return; setTimeout(() => { if (UI.modal && UI.modal.name === 'inventaire' && Ba.porte()) Ba.ouvrir(); }, 0); }, true);
  }
})(window.CG);
