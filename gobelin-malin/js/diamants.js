// Goblin Malin — les diamants. Quand une partie se termine (le chef meurt, ou le clan disparaît), on gagne quelques diamants.
// Ils ne servent pas pendant la partie : on les dépense à l'écran-titre (« Améliorations ») pour que le PROCHAIN chef commence
// un peu plus fort : plus vite, plus fort, plus de vie, plus de mana, un peu d'or, un sort de premier cercle, des jours d'avance...
// Chaque amélioration a plusieurs niveaux, de plus en plus chers. Tout est gardé par le navigateur, en dehors des parties.
// Tout se règle dans CG.Diamants.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Mo = CG.Mondes; if (!G || !UI) return;
  const Di = CG.Diamants = { CLE: 'goblin-malin-diamants',
    GAIN: { BASE: 3, JOUR: 1, NIVEAU: 0.5, TUES: 25, DEMON: 15 }, /* à la fin d'une partie : 3, +1 par jour vécu, +1 par 2 niveaux du chef, +1 par 25 ennemis vaincus, +15 si le Demon Lord est tombé */
    L: [ // prix : le premier niveau coûte « prix », le deuxième 2 × prix, le troisième 3 × prix...
      { k: 'vit', ic: '👟', nom: 'Pieds légers', max: 5, prix: 20, pas: 0.04, txt: n => '+' + n * 4 + ' % de vitesse' },
      { k: 'force', ic: '💪', nom: 'Bras solides', max: 5, prix: 20, pas: 0.06, txt: n => '+' + n * 6 + ' % de dégâts' },
      { k: 'vie', ic: '❤️', nom: 'Cœur robuste', max: 5, prix: 15, pas: 10, txt: n => '+' + n * 10 + ' de vie au départ' },
      { k: 'mana', ic: '💧', nom: 'Esprit vif', max: 5, prix: 15, pas: 8, txt: n => '+' + n * 8 + ' de mana au départ' },
      { k: 'or', ic: '🪙', nom: 'Bourse de départ', max: 5, prix: 15, pas: 50, txt: n => '+' + n * 50 + ' pièces d\'or au départ' },
      { k: 'fioles', ic: '🧪', nom: 'Trousse de secours', max: 3, prix: 20, pas: 1, txt: n => '+' + n + ' fiole' + (n > 1 ? 's' : '') + ' de vie au départ' },
      { k: 'xp', ic: '✨', nom: 'Vétéran', max: 5, prix: 25, pas: 0.05, txt: n => '+' + n * 5 + ' % d\'expérience gagnée' },
      { k: 'points', ic: '🌳', nom: 'Savoir ancien', max: 3, prix: 40, pas: 1, txt: n => '+' + n + ' point' + (n > 1 ? 's' : '') + ' de technologie au départ' },
      { k: 'sort', ic: '📜', nom: 'Premier grimoire', max: 2, prix: 50, pas: 1, txt: n => n + ' sort' + (n > 1 ? 's' : '') + ' du 1er cercle connu' + (n > 1 ? 's' : '') + ' au départ (au hasard)' },
      { k: 'rez', ic: '🕊️', nom: 'Parchemins de résurrection', max: 3, prix: 60, pas: 1, txt: n => n + ' parchemin' + (n > 1 ? 's' : '') + ' de Résurrection à usage unique au départ' },
      { k: 'jour', ic: '📅', nom: 'Longueur d\'avance', max: 7, prix: 50, pas: 1, txt: n => 'Tu peux commencer jusqu\'au jour ' + (1 + n) + ' (à choisir ci-dessous)' },
      /* la difficulté Cauchemar : très chère, et la carte n'apparaît qu'une fois l'Élite débloquée */
      { k: 'cauchemar', ic: '☠️', nom: 'Difficulté Cauchemar', max: 1, prix: 750, pas: 1, vu: () => !!(CG.Diff && CG.Diff.ouvert('elite')), txt: () => 'La difficulté Cauchemar apparaît dans le choix de difficulté' }
    ] };
  const lire = () => { try { const d = JSON.parse(localStorage.getItem(Di.CLE)); if (d && typeof d === 'object') return { d: Math.max(0, Math.floor(+d.d || 0)), n: d.n || {}, jour: +d.jour || 0 }; } catch (e) { /* rien */ } return { d: 0, n: {}, jour: 0 }; };
  const ecrire = o => { try { localStorage.setItem(Di.CLE, JSON.stringify(o)); } catch (e) { /* stockage indisponible */ } };
  Di.total = () => lire().d; Di.niv = k => Math.max(0, Math.floor(lire().n[k] || 0));
  Di.prix = k => { const q = Di.L.find(o => o.k === k), n = Di.niv(k); return q && n < q.max ? q.prix * (n + 1) : null; };
  Di.donner = n => { const o = lire(); o.d += Math.max(0, Math.floor(n)); ecrire(o); return o.d; };
  Di.acheter = function (k) { const o = lire(), q = Di.L.find(x => x.k === k), n = Math.floor(o.n[k] || 0); if (!q || n >= q.max || (q.vu && !q.vu())) return false; const c = q.prix * (n + 1); if (o.d < c) return false; o.d -= c; o.n[k] = n + 1; if (k === 'jour' && !(o.jour > 0)) o.jour = 0; ecrire(o); return true; };
  Di.jourDepart = () => { const o = lire(); return 1 + Math.max(0, Math.min(Math.floor(o.n.jour || 0), Math.floor(o.jour || 0))); };
  Di.choisirJour = j => { const o = lire(); o.jour = Math.max(0, Math.min(Math.floor(o.n.jour || 0), j - 1)); ecrire(o); };
  // ---------- ce qu'une partie rapporte ----------
  Di.gain = function (S) { const Q = Di.GAIN; if (!S || !S.player) return 0; return Math.max(1, Math.floor(Q.BASE + Q.JOUR * Math.max(0, (S.day || 1) - (S.diamJour || 1)) + Q.NIVEAU * (S.player.lvl || 1) + ((S.stats && S.stats.kills) || 0) / Q.TUES + (S.demon && S.demon.mort ? Q.DEMON : 0))); };
  const go0 = UI.gameOver; UI.gameOver = function () {
    const S = CG.S; let n = 0; if (S && !S._diam) { S._diam = true; n = Di.gain(S); Di.donner(n); }
    const r = go0.apply(this, arguments);
    if (n) { const el = document.getElementById('mort'), st = el && el.querySelector('.mo-stats'); if (st && !st.querySelector('.mo-diam')) { const sp = document.createElement('span'); sp.className = 'mo-diam'; sp.style.cssText = 'animation-delay:3.9s;color:#9ae6ff;font-weight:900;text-shadow:0 0 12px rgba(120,220,255,.8)'; sp.textContent = '💎 +' + n + ' diamant' + (n > 1 ? 's' : '') + ' (' + Di.total() + ' en tout)'; st.appendChild(sp); } }
    return r;
  };
  // ---------- le nouveau chef : ce que les diamants lui donnent ----------
  if (Mo && Mo.GLOBAL) ['diam', 'diamJour'].forEach(k => { if (!Mo.GLOBAL.includes(k)) Mo.GLOBAL.push(k); });
  function appliquer(S) {
    const p = S && S.player; if (!p || S.diam) return; const n = {}; Di.L.forEach(q => { n[q.k] = Di.niv(q.k); }); S.diam = { vit: n.vit, force: n.force, xp: n.xp };
    p.maxhp += n.vie * 10; p.hp = p.maxhp; p.maxmp += n.mana * 8; p.mp = p.maxmp; S.res.or = (S.res.or || 0) + n.or * 50; p.potions = (p.potions || 0) + n.fioles; if (S.tech) S.tech.points = (S.tech.points || 0) + n.points;
    if (n.sort) { const C = CG.CerclesPrix && CG.CerclesPrix.CERCLE, l = Object.keys(CG.SPELLS).filter(id => C && C[id] === 1 && !CG.SPELLS[id].amelio && !p.spells.includes(id)); for (let i = 0; i < n.sort && l.length; i++) p.spells.push(l.splice(Math.floor(Math.random() * l.length), 1)[0]); }
    if (n.rez) { p.parchUn = p.parchUn || {}; p.parchUn.resurrection = (p.parchUn.resurrection || 0) + n.rez; } /* parchun.js */
    const j = Di.jourDepart(); if (j > 1) { S.day = j; S.diamJour = j; }
  }
  if (G.newState) { const ns0 = G.newState; G.newState = function () { const r = ns0.apply(this, arguments); try { appliquer(CG.S); } catch (e) { /* jamais bloquant */ } return r; }; }
  const niv = k => { const S = CG.S; return (S && S.diam && S.diam[k]) || 0; };
  { const hm0 = G.heroMul; G.heroMul = function () { return hm0.apply(this, arguments) * (1 + 0.04 * niv('vit')); }; }
  { const pd0 = G.playerDmg; G.playerDmg = function () { return pd0.apply(this, arguments) * (1 + 0.06 * niv('force')); }; }
  { const ax0 = G.addXp; G.addXp = function (x) { const k = niv('xp'); return ax0.call(this, k && x > 0 ? x * (1 + 0.05 * k) : x); }; }

  // ---------- l'écran des améliorations ----------
  let el = null;
  function css() { if (document.getElementById('diam-css')) return; const st = document.createElement('style'); st.id = 'diam-css'; st.textContent =
    '#diam{position:fixed;inset:0;z-index:120;display:flex;flex-direction:column;align-items:center;background:radial-gradient(ellipse at 50% 20%,#1c2a4a,#0a0e1c 70%);color:#fff;font-family:"Trebuchet MS",system-ui,sans-serif;overflow:auto;padding:22px 16px 30px;animation:dmIn .2s ease-out}@keyframes dmIn{from{opacity:0}}'
    + '.dm-haut{display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:center;margin-bottom:6px}.dm-haut h1{margin:0;font:900 clamp(24px,3.6vw,38px)/1 "Trebuchet MS",system-ui,sans-serif;text-shadow:0 3px 0 #0a1020,0 0 22px rgba(120,200,255,.6)}'
    + '.dm-bourse{font:900 24px/1 "Trebuchet MS",system-ui,sans-serif;color:#9ae6ff;background:rgba(20,40,80,.8);border:2px solid #5ab8e8;border-radius:22px;padding:8px 18px;box-shadow:0 0 18px rgba(90,184,232,.45)}.dm-sous{opacity:.8;font-size:14px;margin:0 0 16px;text-align:center;max-width:720px}'
    + '.dm-grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;width:min(1120px,100%)}'
    + '.dm-c{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 12px 12px;border-radius:16px;border:2px solid #3a5a8a;background:linear-gradient(170deg,rgba(40,60,100,.92),rgba(16,22,44,.96));box-shadow:0 6px 0 #070a14,0 10px 20px rgba(0,0,0,.5)}'
    + '.dm-c.max{border-color:#ffe36b;box-shadow:0 6px 0 #070a14,0 0 18px rgba(255,227,107,.35)}.dm-c i{font:normal 40px/1 sans-serif;filter:drop-shadow(0 3px 5px rgba(0,0,0,.5))}.dm-c b{font:900 17px/1.1 "Trebuchet MS",system-ui,sans-serif;color:#ffe9a8;text-align:center}'
    + '.dm-c span{font-size:13px;opacity:.9;text-align:center;min-height:32px}.dm-pips{display:flex;gap:4px}.dm-pips u{width:14px;height:14px;border-radius:4px;background:#1a2440;border:1.5px solid #4a6aa0;text-decoration:none}.dm-pips u.on{background:#ffe36b;border-color:#fff3b0;box-shadow:0 0 8px rgba(255,227,107,.8)}'
    + '.dm-b{margin-top:4px;font:900 15px/1 "Trebuchet MS",system-ui,sans-serif;color:#0a1830;background:linear-gradient(#9ae6ff,#5ab8e8);border:0;border-radius:12px;padding:9px 16px;cursor:pointer;box-shadow:0 4px 0 #1c5a80}.dm-b:hover{filter:brightness(1.12)}.dm-b:active{transform:translateY(3px);box-shadow:0 1px 0 #1c5a80}.dm-b:disabled{background:#2a3450;color:#7a88a8;box-shadow:0 4px 0 #141a2c;cursor:default;filter:none;transform:none}'
    + '.dm-c.pop{animation:dmPop .45s cubic-bezier(.2,1.5,.4,1)}@keyframes dmPop{0%{transform:scale(1)}40%{transform:scale(1.09);box-shadow:0 0 30px rgba(255,227,107,.9)}100%{transform:scale(1)}}'
    + '.dm-jours{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}.dm-jours button{font:700 13px/1 "Trebuchet MS",system-ui,sans-serif;color:#fff;background:#1a2440;border:1.5px solid #4a6aa0;border-radius:8px;padding:6px 9px;cursor:pointer}.dm-jours button.on{background:#ffe36b;color:#2a1c00;border-color:#fff3b0}'
    + '.dm-ret{margin-top:20px;font:900 17px/1 "Trebuchet MS",system-ui,sans-serif;color:#fff;background:#2a3a5a;border:2px solid #5a7ab0;border-radius:14px;padding:11px 26px;cursor:pointer}.dm-ret:hover{filter:brightness(1.2)}';
    document.head.appendChild(st); }
  function rendre(pop) {
    const o = lire(), jmax = Math.floor(o.n.jour || 0), jd = Di.jourDepart();
    el.innerHTML = '<div class="dm-haut"><h1>💎 Améliorations</h1><div class="dm-bourse">💎 ' + o.d + '</div></div><p class="dm-sous">Chaque partie qui se termine te laisse quelques diamants. Ce que tu achètes ici reste pour toujours : ton prochain chef commencera avec.</p><div class="dm-grille">'
      + Di.L.filter(q => !q.vu || q.vu() || o.n[q.k] > 0).map(q => { const n = Math.floor(o.n[q.k] || 0), plein = n >= q.max, c = plein ? 0 : q.prix * (n + 1); let pips = ''; for (let i = 0; i < q.max; i++) pips += '<u class="' + (i < n ? 'on' : '') + '"></u>';
        return '<div class="dm-c' + (plein ? ' max' : '') + (pop === q.k ? ' pop' : '') + '"><i>' + q.ic + '</i><b>' + q.nom + '</b><div class="dm-pips">' + pips + '</div><span>' + (n ? q.txt(n) : 'Pas encore acheté') + (plein ? '' : '<br><small style="opacity:.75">ensuite : ' + q.txt(n + 1) + '</small>') + '</span>'
          + (q.k === 'jour' && jmax > 0 ? '<div class="dm-jours">' + Array.from({ length: jmax + 1 }, (x, i) => '<button data-jour="' + (i + 1) + '" class="' + (jd === i + 1 ? 'on' : '') + '">Jour ' + (i + 1) + '</button>').join('') + '</div>' : '')
          + '<button class="dm-b" data-k="' + q.k + '"' + (plein || o.d < c ? ' disabled' : '') + '>' + (plein ? 'Au maximum' : '💎 ' + c) + '</button></div>'; }).join('')
      + '</div><button class="dm-ret">← Retour</button>';
    el.querySelectorAll('.dm-b').forEach(b => { b.onclick = () => { if (Di.acheter(b.dataset.k)) { CG.sfx('level'); rendre(b.dataset.k); } else CG.sfx('no'); }; });
    el.querySelectorAll('[data-jour]').forEach(b => { b.onclick = () => { Di.choisirJour(+b.dataset.jour); CG.sfx('ok'); rendre(); }; });
    el.querySelector('.dm-ret').onclick = Di.fermer;
  }
  Di.ouvrir = function () { css(); if (!el) { el = document.createElement('div'); el.id = 'diam'; document.body.appendChild(el); } rendre(); };
  Di.fermer = function () { if (el) { el.remove(); el = null; } const b = document.querySelector('#a-diam .tx'); if (b) b.textContent = 'Améliorations · 💎 ' + Di.total(); };
  window.addEventListener('keydown', e => { if (el && e.key === 'Escape') { e.stopPropagation(); Di.fermer(); } }, true);
})(window.CG);
