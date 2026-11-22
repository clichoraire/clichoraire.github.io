// Goblin Malin — la fiche d'une construction. On clique (ou on touche) une chose qu'on a bâtie : une petite fenêtre s'ouvre
// avec son dessin, ce qu'elle est en une phrase (pas de chiffres), son état, et ses boutons : la faire évoluer s'il y a une
// suite, voir qui habite une hutte... Plus besoin d'être collé dessus ni de viser entre deux clôtures. Le jeu continue derrière.
// Pas pendant une attaque, ni quand un ennemi est tout près : là, un clic reste un coup d'arme.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Art = CG.Art, T = CG.TILE, Fb = CG.FicheBati = { ENNEMI: 320 };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])), $ = id => document.getElementById(id);
  const prix = c => Object.keys(c).filter(r => c[r] > 0).map(r => c[r] + ' ' + CG.RES[r].icon).join(' ');
  // la construction sous le doigt (une chose haute se clique aussi par le haut de son dessin)
  Fb.sous = function (x, y) { const cx = Math.floor(x / T), cy = Math.floor(y / T); return [G.buildingAt(cx, cy), G.buildingAt(cx, cy + 1)].find(b => b && !b.site && !b.gone && CG.BUILDS[b.type] && !CG.BUILDS[b.type].flat && !CG.BUILDS[b.type].terrain) || null; };
  Fb.calme = function () { const R = CG.R, p = CG.S.player; return !R.alarm && !R.enemies.some(e => !e.dead && !e.struct && !e.calm && Math.hypot(e.x - p.x, e.y - p.y) < Fb.ENNEMI); };
  Fb.nom = function (b) { const Am = CG.Ameliorer, L = Am && Am.UP[b.type], n = L && b.up ? L[Math.min(L.length, b.up) - 1] : null; return n && !n.to ? n.nom : CG.BUILDS[b.type].nom; };
  // une seule phrase, sans chiffres : ce que c'est, pas ce que ça vaut
  Fb.TEXTE = { hut: 'Une hutte où dorment tes gobelins.', totem: 'Un totem qui donne du courage à ceux qui se battent près de lui.', marmite: 'Une grande marmite : la fête du soir coûte moins de nourriture.',
    cristal: 'Un cristal qui fait remonter ta mana plus vite.', puits: 'De l\'eau fraîche : le clan se réveille de meilleure humeur.', scierie: 'On y débite les troncs : chaque arbre donne plus de bois.',
    caserne: 'Tes gardes s\'y entraînent chaque matin et deviennent plus solides.', marche: 'Les marchands passent plus souvent, et tes objets se vendent mieux.', balancoire: 'Les gobelins adorent : ça leur remonte le moral.',
    mangeoire: 'Tes animaux viennent y manger.', muret: 'Un muret bas en pierre : on tire par-dessus, et il tient bien mieux qu\'une clôture.', grenier: 'Tes réserves y sont à l\'abri des pillards.',
    taverne: 'La fête du soir y est plus joyeuse.', enclos: 'Des bêtes qui donnent de la viande et du cuir.', depot: 'Un autre endroit où déposer bois, nourriture et minerai.' };
  Fb.phrase = function (b) { if (Fb.TEXTE[b.type]) return Fb.TEXTE[b.type]; const d = (CG.BUILDS[b.type].desc || '').split(/(?<=[.!?])\s+/).filter(Boolean); let s = d.find(q => !/\d/.test(q)) || d[0] || ''; s = s.replace(/\s*\([^)]*\d[^)]*\)/g, '').trim(); return s; };
  function dessin(cv, b) {
    const g = cv.getContext('2d'), k = window.devicePixelRatio > 1 ? 2 : 1, L = 150, H = 150; cv.width = L * k; cv.height = H * k; cv.style.width = L + 'px'; cv.style.height = H + 'px';
    const z = Math.min(1.5, 104 / Math.max(b.w * T, (b.h > 1 ? 150 : 96))), cx = (b.tx + b.w / 2) * T, bas = (b.ty + b.h) * T;
    try { g.setTransform(k * z, 0, 0, k * z, k * (L / 2 - cx * z), k * (H - 16 - bas * z)); const t = (CG.R && CG.R.t) || 0, peint = () => { if (Art.extra && Art.extra[b.type]) Art.drawExtra(g, b, t, false); else Art.building(g, b, t, b.type === 'fire' ? !!CG.R.fireLit : false); };
      if (CG.Bt && CG.Bt.flipped) CG.Bt.flipped(g, b, peint); else peint(); } catch (e) { /* pas de dessin : la fiche s'ouvre quand même */ }
  }
  let ouvert = null;
  Fb.ouvrir = function (b) {
    const S = CG.S, d = CG.BUILDS[b.type]; if (!d || !S.buildings.includes(b)) return; const Am = CG.Ameliorer, n = Am ? Am.next(b) : null, mh = G.buildMaxHp(b), k = mh && b.hp !== undefined ? CG.clamp(b.hp / mh, 0, 1) : 1;
    const etats = []; if (b.upg) etats.push('🔨 En travaux'); else if (n) etats.push('⬆️ Peut évoluer'); if (mh && k < 0.999) etats.push(k < 0.4 ? '💥 Très abîmé' : '🩹 Abîmé');
    let btns = '';
    if (b.upg) { const up = Am.UP[b.type][b.upg.i]; btns += '<div class="fb-travaux"><span>🔨 ' + esc(up ? up.nom : 'Travaux') + '</span><i><u style="width:' + Math.round(Math.min(1, b.upg.prog / b.upg.need) * 100) + '%"></u></i></div>'; }
    else if (n) { const ok = G.canPay(n.cout); btns += '<button class="fb-b evo" id="fb-evo"' + (ok ? '' : ' disabled') + '><b>⬆️ Évoluer en ' + esc(n.nom) + '</b><small>' + (ok ? prix(n.cout) : 'Il te manque des ressources · ' + prix(n.cout)) + '</small></button>'; }
    if (b.type === 'hut') btns += '<button class="fb-b" id="fb-hut"><b>🛖 Voir qui habite ici</b></button>';
    if (b.type === 'monolithe' && CG.Monolithe) { const e = CG.Monolithe.etat(b), ok = e.verse || (!e.plein && e.pres && e.mana);
      btns += '<button class="fb-b mana" id="fb-verse"' + (ok ? '' : ' disabled') + '><b>' + (e.verse ? '✋ Arrêter de verser ta mana' : '🔮 Lui verser ta mana') + '</b><small>' + (e.verse ? '' : e.plein ? 'Il est plein. · ' : !e.pres ? 'Approche-toi de lui d\'abord. · ' : !e.mana ? 'Tu n\'as plus de mana. · ' : 'Reste à côté pendant qu\'il boit. · ') + e.n + ' / ' + CG.Monolithe.PLEIN + '</small></button>'; }
    if (b.type === 'monolithe' && CG.Monolithe) btns += '<button class="fb-b" id="fb-mono"><b>👁️ Voir jusqu\'où il porte</b></button>';
    ouvert = b; UI.modal = { name: 'bati', closable: true, pauses: false }; CG.keys.clear(); CG.sfx('uiOpen');
    $('dialog').hidden = true; $('modal').className = 'soft'; $('panel').className = 'fiche-bati';
    $('panel').innerHTML = '<button class="fb-x" id="fb-x" title="Fermer (Échap)">✕</button><div class="fb-tete"><div class="fb-img"><canvas id="fb-cv"></canvas></div><div class="fb-titre"><h2>' + d.icon + ' ' + esc(Fb.nom(b)) + '</h2>'
      + (etats.length ? '<div class="fb-etats">' + etats.map(e => '<span>' + e + '</span>').join('') + '</div>' : '') + '<p>' + esc(Fb.phrase(b)) + '</p>'
      + (mh ? '<div class="fb-vie" title="Sa solidité"><i><u style="width:' + Math.round(k * 100) + '%"></u></i></div>' : '') + '</div></div><div class="fb-btns">' + btns + '<button class="fb-b fin" id="fb-fin"><b>Fermer</b></button></div>';
    $('modal').hidden = false; dessin($('fb-cv'), b);
    $('fb-x').onclick = $('fb-fin').onclick = UI.dismiss;
    if ($('fb-evo')) $('fb-evo').onclick = () => { if (Am.apply(b)) Fb.ouvrir(b); };
    if ($('fb-hut')) $('fb-hut').onclick = () => { UI.close(); UI.hut(b); };
    if ($('fb-verse')) $('fb-verse').onclick = () => { if (CG.Monolithe.verser(b)) UI.close(); };
    if ($('fb-mono')) $('fb-mono').onclick = () => { UI.close(); CG.Monolithe.clic(b.tx, b.ty); };
  };
  // la fiche suit ce qui se passe : les travaux qui avancent, la construction qui tombe
  let tic = 0; const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); if (!ouvert) return; if (!UI.modal || UI.modal.name !== 'bati') { ouvert = null; return; }
    if (!CG.S.buildings.includes(ouvert) || CG.R.alarm) { ouvert = null; return UI.close(); }
    if ((tic -= dt) > 0) return; tic = 0.5; if (ouvert.upg || document.querySelector('.fb-travaux') || ouvert.type === 'monolithe') Fb.ouvrir(ouvert); else { const cv = $('fb-cv'); if (cv) dessin(cv, ouvert); }
  };
  const css = document.createElement('style');
  css.textContent = '#panel.fiche-bati{position:relative;width:min(520px,94vw);padding:18px 18px 16px;border:none;border-radius:22px;color:#fff;background:linear-gradient(165deg,rgba(46,38,64,.96),rgba(18,16,28,.97));box-shadow:0 18px 50px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.18),0 0 0 1px rgba(255,255,255,.14);font-family:"Trebuchet MS",system-ui,sans-serif;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}'
    + '#panel.fiche-bati .fb-tete{display:flex;gap:16px;align-items:center}'
    + '#panel.fiche-bati .fb-img{flex:none;width:150px;height:150px;border-radius:18px;overflow:hidden;background:radial-gradient(circle at 50% 78%,#6fae4a 0,#4c8a38 46%,#2f5f2c 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2),inset 0 -22px 30px rgba(0,0,0,.25),0 6px 16px rgba(0,0,0,.4)}'
    + '#panel.fiche-bati .fb-titre{flex:1;min-width:0}#panel.fiche-bati h2{margin:0 26px 6px 0;font-size:23px;line-height:1.15;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5)}'
    + '#panel.fiche-bati p{margin:0;font-size:15.5px;line-height:1.4;color:#e6e0f2}'
    + '#panel.fiche-bati .fb-etats{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}#panel.fiche-bati .fb-etats span{padding:3px 10px;border-radius:20px;font-size:12.5px;font-weight:bold;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22)}'
    + '#panel.fiche-bati .fb-vie{margin-top:10px}#panel.fiche-bati .fb-vie i,#panel.fiche-bati .fb-travaux i{display:block;height:8px;border-radius:6px;background:rgba(0,0,0,.45);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}#panel.fiche-bati .fb-vie u{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#7ad86a,#b8ff8a)}'
    + '#panel.fiche-bati .fb-btns{display:flex;flex-direction:column;gap:8px;margin-top:16px}'
    + '#panel.fiche-bati button.fb-b{display:block;width:100%;padding:11px 16px;text-align:left;border-radius:14px;border:1px solid rgba(255,255,255,.22);background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,.05));color:#fff;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.3);text-shadow:none;transition:transform .08s,filter .08s}'
    + '#panel.fiche-bati button.fb-b:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.15)}#panel.fiche-bati button.fb-b b{display:block;font-size:16px}#panel.fiche-bati button.fb-b small{display:block;margin-top:2px;font-size:13px;opacity:.85}'
    + '#panel.fiche-bati button.fb-b.evo{border-color:rgba(255,216,80,.7);background:linear-gradient(160deg,#e0a82a,#b0721a);color:#2a1804}#panel.fiche-bati button.fb-b.evo:disabled{filter:grayscale(.6);opacity:.6}'
    + '#panel.fiche-bati button.fb-b.mana{border-color:rgba(190,150,255,.75);background:linear-gradient(160deg,#7a52d8,#4a2a9a)}#panel.fiche-bati button.fb-b.mana:disabled{filter:grayscale(.6);opacity:.6;cursor:default}'
    + '#panel.fiche-bati button.fb-b.fin{text-align:center;background:rgba(255,255,255,.07)}'
    + '#panel.fiche-bati .fb-travaux span{display:block;margin-bottom:5px;font-size:14px;font-weight:bold}#panel.fiche-bati .fb-travaux u{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#5ab0ff,#a8dcff)}'
    + '#panel.fiche-bati button.fb-x{position:absolute;top:10px;right:10px;width:32px;height:32px;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;font-size:15px;cursor:pointer;box-shadow:none;text-shadow:none}'
    + '@media (max-width:480px){#panel.fiche-bati .fb-tete{flex-direction:column;align-items:flex-start}#panel.fiche-bati .fb-img{width:100%;height:130px}}';
  document.head.appendChild(css);
})(window.CG);
