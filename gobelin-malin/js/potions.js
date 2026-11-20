// Goblin Malin — les potions à recette. Un chef ennemi vaincu cache parfois une recette d'alchimie au lieu d'un parchemin (butin.js).
// Une recette connue ajoute une potion au menu du chaudron ; les alchimistes la préparent comme les autres (os + temps), et on la boit avec V.
//   Vitesse (on court plus vite), Frénésie (on frappe plus souvent), Nénuphar (on marche sur l'eau), Géant (on grossit et on cogne plus fort), Chance (deux fois plus d'or).
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, W = CG.W, Al = CG.Alchimie, pick = CG.pick, rand = CG.rand, TAU = Math.PI * 2; if (!Al) return;
  const Po = CG.Potions = { CHANCE: 0.35, VITESSE: 1.35, FRENESIE: 0.6, GEANT: 1.4, GEANT_DMG: 1.4, OR: 2, PRIX: 25 }; // PRIX : or à payer au chaudron, par os de la recette, pour la faire déchiffrer
  Po.L = {
    vitesse: { ic: '💨', nom: 'Potion de vitesse', col: '#7ad8ff', os: 4, temps: 90, dur: 60, desc: 'Tu cours 35 % plus vite pendant 60 secondes.' },
    frenesie: { ic: '⚔️', nom: 'Potion de frénésie', col: '#ff8a4a', os: 4, temps: 90, dur: 45, desc: 'Tes coups partent beaucoup plus vite pendant 45 secondes : cinq coups dans le temps de trois.' },
    nenuphar: { ic: '🪷', nom: 'Potion de nénuphar', col: '#8ae0b0', os: 4, temps: 90, dur: 45, desc: 'Tu marches sur l\'eau pendant 45 secondes. Si l\'effet s\'arrête au milieu d\'un lac, tu te retrouves sur la rive la plus proche.' },
    geant: { ic: '🍄', nom: 'Potion de géant', col: '#d08aff', os: 6, temps: 120, dur: 40, desc: 'Tu grossis d\'un coup pendant 40 secondes, et tu frappes 40 % plus fort.' },
    chance: { ic: '🍀', nom: 'Potion de chance', col: '#9be04a', os: 6, temps: 120, dur: 90, desc: 'Pendant 90 secondes, les monstres lâchent deux fois plus d\'or.' }
  };
  Al.SPE = Po.L; const IDS = Object.keys(Po.L);
  const fi = () => { const p = CG.S.player; return p.fioles || (p.fioles = {}); }, rec = () => { const p = CG.S.player; return p.recettes || (p.recettes = {}); };
  const actif = k => { const R = CG.R; return R && R.pot && R.pot[k] > 0 ? R.pot[k] : 0; };
  Po.actif = actif;
  // une recette, c'est d'abord un bout de papier dans le sac (p.papiers) ; déposée au chaudron elle y reste (« deposee »), et une fois payée elle est connue (true)
  const pap = () => { const p = CG.S.player; return p.papiers || (p.papiers = {}); }, connue = k => rec()[k] === true;
  Po.prix = k => Po.L[k].os * Po.PRIX;
  Po.nouvelle = () => { const l = IDS.filter(k => !rec()[k] && !pap()[k]); return l.length ? pick(l) : null; };
  Po.donner = function (k, x, y) { const p = CG.S.player, q = Po.L[k]; if (!q) return; pap()[k] = 1; G.text(x === undefined ? p.x : x, (y === undefined ? p.y : y) - 60, '📄 Recette : ' + q.nom, q.col, true); CG.sfx('page'); };
  { const pk0 = G.pickUp; G.pickUp = function (d) { if (d && d.kind === 'recette') { Po.donner(d.id, d.x, d.y); G.puff(d.x, d.y - 6, '#ffe36b', 5, 60, 2); return; } return pk0.apply(this, arguments); }; }
  Po.apprendre = function (k) { rec()[k] = true; return G.tech('al1') ? 'Tes alchimistes peuvent maintenant la préparer : ouvre ton chaudron.' : 'Pour la préparer, il te faut un Chaudron de sorcière (dans l\'arbre) et un alchimiste.'; };
  const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments); rec(); return r; };
  // ---------- au chaudron ----------
  Al.cartes = function (e) { let h = ''; const or = Math.floor(CG.S.res.or);
    IDS.forEach(k => { const q = Po.L[k]; if (pap()[k]) h += '<button class="ch-r" data-dep="' + k + '"><b>📄 Déposer la recette</b><small>' + q.ic + ' ' + q.nom + ' : sors-la de ton sac</small></button>';
      else if (rec()[k] === 'deposee') h += '<button class="ch-r" data-pay="' + k + '"' + (or < Po.prix(k) ? ' disabled' : '') + ' title="' + q.desc.replace(/"/g, '&quot;') + '"><b>🔒 ' + q.ic + ' ' + q.nom + '</b><small>La faire déchiffrer : ' + Po.prix(k) + ' 🪙' + (or < Po.prix(k) ? ' (il te manque ' + (Po.prix(k) - or) + ')' : '') + '</small></button>'; });
    IDS.forEach(k => { if (!connue(k)) return; const q = Po.L[k], id = k + '1'; h += '<button class="ch-r' + (e.r === id ? ' on' : '') + '" data-r="' + id + '" title="' + q.desc.replace(/"/g, '&quot;') + '"><b>' + q.ic + ' ' + q.nom + '</b><small>' + q.dur + ' s d\'effet · ' + q.os + ' 🦴 · ' + q.temps + ' s</small></button>'; }); return h; };
  Al.besaceTxt = function () { const f = fi(), l = IDS.filter(k => f[k] > 0).map(k => Po.L[k].ic + ' ' + f[k]), n = IDS.filter(k => connue(k)).length;
    return '<br>' + (l.length ? 'Potions à recette : ' + l.join(' · ') + ' (V pour boire)' : n ? 'Recettes connues : ' + n + ' / ' + IDS.length + '.' : 'Les chefs ennemis cachent parfois des recettes de potions.'); };
  { const me0 = Al.menu; Al.menu = function (b) { const r = me0.apply(this, arguments), pan = document.getElementById('panel'); if (!pan) return r;
      pan.querySelectorAll('[data-dep]').forEach(bt => bt.onclick = () => { const k = bt.dataset.dep; if (!pap()[k]) return; delete pap()[k]; rec()[k] = 'deposee'; CG.sfx('page'); UI.toast('📄 La recette est épinglée au chaudron. Il reste à la faire déchiffrer.'); Al.menu(b); });
      pan.querySelectorAll('[data-pay]').forEach(bt => bt.onclick = () => { const k = bt.dataset.pay, S = CG.S, c = Po.prix(k); if (rec()[k] !== 'deposee' || S.res.or < c) { CG.sfx('no'); return; } S.res.or -= c; rec()[k] = true; CG.sfx('level'); UI.toast(Po.L[k].ic + ' ' + Po.L[k].nom + ' : tes alchimistes savent maintenant la préparer.'); Al.menu(b); });
      return r; }; }
  // ---------- boire ----------
  Po.boire = function (k) {
    const S = CG.S, R = CG.R, p = S.player, f = fi(), q = Po.L[k]; if (!q || !(f[k] > 0) || R.ko > 0 || R.cine) { CG.sfx('no'); return false; }
    f[k]--; (R.pot = R.pot || {})[k] = q.dur; if (k === 'nenuphar') R.surEau = q.dur; CG.sfx('heal');
    G.puff(p.x, p.y - 24, q.col, 22, 150, 4); R.rings.push({ x: p.x, y: p.y - 10, r: 54, life: 0.4, col: q.col }); G.text(p.x, p.y - 76, q.ic + ' ' + q.nom + ' : ' + q.dur + ' s', q.col, true); hudK = ''; return true;
  };
  Po.besace = function () {
    const f = fi(), l = IDS.filter(k => f[k] > 0); if (UI.modal) return; if (!l.length) { CG.sfx('no'); return UI.toast('🧪 Aucune potion à recette dans ta besace. Les chefs ennemis cachent parfois des recettes.'); }
    if (l.length === 1) return Po.boire(l[0]); // une seule sorte : on la boit tout de suite
    UI.open('besace', '<h2>🧪 Ta besace</h2><p>Quelle potion veux-tu boire ?</p><div style="display:grid;gap:8px;margin:10px 0">' + l.map((k, i) => { const q = Po.L[k]; return '<button data-k="' + k + '" style="text-align:left;padding:8px 14px"><b>' + (i + 1) + '. ' + q.ic + ' ' + q.nom + ' × ' + f[k] + '</b><br><small>' + q.desc + '</small></button>'; }).join('') + '</div><button id="bs-non">Refermer (Échap)</button>', true);
    if (UI.modal) UI.modal.pauses = true; const pan = document.getElementById('panel');
    pan.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { UI.dismiss(); Po.boire(b.dataset.k); }); document.getElementById('bs-non').onclick = UI.dismiss;
  };
  window.addEventListener('keydown', ev => { if (!UI.modal || UI.modal.name !== 'besace' || !(ev.key >= '1' && ev.key <= '9')) return; const b = document.querySelectorAll('#panel [data-k]')[+ev.key - 1]; if (b) { ev.stopPropagation(); ev.preventDefault(); b.click(); } }, true);
  // ---------- les effets ----------
  { const hm = G.heroMul; G.heroMul = function () { return hm.apply(this, arguments) * (actif('vitesse') ? Po.VITESSE : 1); };
    const pd = G.playerDmg; G.playerDmg = function () { return pd.apply(this, arguments) * (actif('geant') ? Po.GEANT_DMG : 1); };
    const at = G.attack; G.attack = function () { const R = CG.R, a = R.atkCd, r = at.apply(this, arguments); if (!(a > 0) && R.atkCd > 0 && actif('frenesie')) R.atkCd *= Po.FRENESIE; return r; };
    const dr = G.dropRes; G.dropRes = function (x, y, res, n) { return dr.call(this, x, y, res, res === 'or' && actif('chance') ? Math.round(n * Po.OR) : n); }; }
  Po.taille = function () { const R = CG.R, t = actif('geant'); if (!t) return 1; const q = Po.L.geant.dur, k = Math.min(1, (q - t) / 0.5, t / 0.5); return 1 + (Po.GEANT - 1) * k; };
  let hudT = 0, hudK = '';
  function hud() { const f = fi(), k = IDS.map(i => f[i] || 0).join(','); if (k === hudK) return; hudK = k;
    let el = document.getElementById('potions3'); const base = document.getElementById('potions2') || document.getElementById('potions'); if (!el && base) { el = document.createElement('div'); el.id = 'potions3'; el.style.cssText = 'font-size:13px;margin-top:3px;line-height:1.5;color:#f0e6d0'; base.parentNode.insertBefore(el, base.nextSibling); } if (!el) return;
    const l = IDS.filter(i => f[i] > 0).map(i => Po.L[i].ic + ' <b>' + f[i] + '</b>'); el.innerHTML = l.length ? l.join(' · ') + ' <small>(V)</small>' : ''; }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; hudT -= dt; if (hudT <= 0) { hudT = 0.4; hud(); }
    const B = R.pot; if (!B || R.night || R.cine) return; const p = S.player;
    for (const k in B) { if (!(B[k] > 0)) continue; B[k] -= dt; const q = Po.L[k];
      if (k === 'nenuphar') { R.surEau = Math.max(0, B[k]); const t = W.tile[W.idx(Math.floor(p.x / CG.TILE), Math.floor(p.y / CG.TILE))], eau = t === W.WATER || t === W.MOAT;
        if (eau && Math.random() < dt * (p.moving ? 9 : 2)) R.rings.push({ x: p.x + rand(-6, 6), y: p.y + 2, r: rand(12, 20), life: 0.45, col: '#d8f4ff' });
        if (eau && B[k] > 0 && B[k] <= 3) { const s = Math.ceil(B[k]); if (s !== R.eauN) { R.eauN = s; CG.sfx('click'); G.text(p.x, p.y - 64, s + ' — regagne la rive !', '#ffd08a', true); } } }
      else if (Math.random() < dt * 5) R.parts.push({ x: p.x + rand(-10, 10), y: p.y - rand(6, 36), vx: rand(-8, 8), vy: rand(-30, -10), life: 0.5, max: 0.5, col: q.col, size: 2.6, float: true });
      if (B[k] <= 0) { delete B[k]; G.text(p.x, p.y - 64, q.ic + ' L\'effet s\'arrête', '#e8e0ff');
        if (k === 'nenuphar') { R.surEau = 0; const x0 = p.x, y0 = p.y; if (CG.Passe && !(R.passe > 0) && CG.Passe.sortir(p)) { G.puff(x0, y0 - 10, '#bfe8ff', 18, 130, 4); G.puff(p.x, p.y - 20, '#ffffff', 14, 110, 4); R.invuln = Math.max(R.invuln || 0, 0.5); CG.sfx('zap'); } } } }
  };
  if (CG.Buffs) IDS.forEach(k => { const q = Po.L[k]; CG.Buffs.LISTE.push({ k: 'potion-' + k, ic: q.ic, nom: () => q.nom, txt: q.desc, t: () => actif(k) }); });
})(window.CG);
