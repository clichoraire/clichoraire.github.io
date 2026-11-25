// Goblin Malin — les outils de base. Pour faire son métier, un gobelin a besoin de l'outil qui va avec :
//   cueilleur : des gants · bûcheron : une hache · mineur : une pioche · chasseur : un arc.
//   Le clan garde à la réserve des outils tout simples (aucune étoile, aucun bonus, gris pâle) : ils servent seulement à pouvoir
//   faire le métier. On ne les trouve nulle part et on ne peut pas les prendre : c'est le gobelin qui va chercher le sien à la
//   réserve quand on lui donne le métier, et qui le rapporte quand il en change.
//   Combien il y en a dépend de la difficulté : Normal = autant qu'on veut · Difficile = 3 par métier · Élite = 1 · Cauchemar = aucun.
//   Plus d'outil simple ? Le métier est grisé, sauf si le gobelin porte déjà un vrai outil (★) dans sa case « Outil de travail ».
//   Aussi ici : sur la fiche d'un gobelin (son inventaire), le métier se change dans une liste déroulante.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, rand = CG.rand, Bq = CG.Banque;
  const Ob = CG.OutilsBase = {
    STOCK: { normal: Infinity, difficile: 3, elite: 1, cauchemar: 0 },
    BESOIN: { cueilleur: 'gant', bucheron: 'hache', mineur: 'pioche', chasseur: 'arc' },
    NOMS: { gant: 'Gants simples', hache: 'Hache simple', pioche: 'Pioche simple', arc: 'Arc simple' }, IC: { gant: '🧤', hache: '🪓', pioche: '⛏️', arc: '🏹' }, QUOI: { gant: 'de gants', hache: 'de hache', pioche: 'de pioche', arc: 'd\'arc' }
  };
  if (Bq) Object.keys(Ob.NOMS).forEach(k => { if (Bq.NOMS[k]) Bq.NOMS[k][0] = Ob.NOMS[k]; });
  { const st = document.createElement('style'); st.textContent = '.iv-it.q0{--q:#9a9a9a;filter:grayscale(1);opacity:.85;cursor:default}.iv-it.q4{--q:#ffd86a}.iv-job{font:inherit;font-size:13px;padding:2px 4px;border-radius:6px;background:#2c2620;color:#fff;border:1px solid #8a6a3a;max-width:150px}'; document.head.appendChild(st); }
  const diff = () => (CG.Diff && CG.Diff.id ? CG.Diff.id() : 'difficile');
  Ob.infini = () => Ob.STOCK[diff()] === Infinity;
  const stock = () => { const S = CG.S, n = Ob.infini() ? 0 : (Ob.STOCK[diff()] || 0); if (!S.outils0) S.outils0 = {}; Object.keys(Ob.NOMS).forEach(k => { if (S.outils0[k] === undefined) S.outils0[k] = n; }); return S.outils0; };
  Ob.reste = k => (Ob.infini() ? Infinity : stock()[k] || 0);
  const prendre = k => { if (!Ob.infini()) stock()[k] = Math.max(0, (stock()[k] || 0) - 1); }, rendre = k => { if (!Ob.infini()) stock()[k] = (stock()[k] || 0) + 1; };
  const vrai = (g, k) => k === 'arc' ? !!(g.equip && g.equip.arc) : !!(g.travail && g.travail.k === k); /* un vrai outil (★) : l'arc se porte dans sa case « Arc », les autres dans « Outil » */
  Ob.a = g => { const k = Ob.BESOIN[g.job]; return !k || vrai(g, k) || g.outil0 === k; };
  // peut-on lui donner ce métier ? (il a déjà l'outil, ou il en reste un simple à la réserve)
  Ob.peut = (g, job) => { const k = Ob.BESOIN[job]; return !k || vrai(g, k) || g.outil0 === k || g.chercheOutil === k || Ob.reste(k) > 0; };
  { const ok0 = CG.jobOk, mq0 = CG.jobManque;
    CG.jobOk = function (j, g) { return (!ok0 || ok0.apply(this, arguments)) && (!g || Ob.peut(g, j)); };
    CG.jobManque = function (j, g) { const m = mq0 ? mq0.apply(this, arguments) : ''; if (m) return m; return g && !Ob.peut(g, j) ? 'Plus ' + Ob.QUOI[Ob.BESOIN[j]] + ' à la réserve : mets-lui-en un dans son inventaire' : ''; }; }
  // ---------- on change son métier : il rapporte l'ancien outil et va chercher le nouveau ----------
  function prevoir(g) {
    const k = Ob.BESOIN[g.job];
    if (g.chercheOutil && g.chercheOutil !== k) { rendre(g.chercheOutil); g.chercheOutil = null; } // il n'était pas encore allé le chercher
    if (g.outil0 && (g.outil0 !== k || vrai(g, k))) { g.rendOutil = g.outil0; g.outil0 = null; }
    if (k && !vrai(g, k) && g.outil0 !== k && g.chercheOutil !== k && Ob.reste(k) > 0) { prendre(k); g.chercheOutil = k; }
  }
  { const sj0 = UI.setJob; UI.setJob = function (g, id) { const avant = g && g.job, r = sj0.apply(this, arguments); if (g && g.job !== avant) prevoir(g); return r; }; }
  // ---------- chaque instant : le trajet à la réserve, ou l'attente quand il n'a pas d'outil ----------
  Ob.step = function (g, dt) {
    const k = Ob.BESOIN[g.job];
    if (!g.rendOutil && !g.chercheOutil) {
      if (g.outil0 && (g.outil0 !== k || vrai(g, k))) prevoir(g); // on lui a donné un vrai outil : il rapporte le simple
      else if (k && !Ob.a(g)) { if (Ob.reste(k) > 0) prevoir(g); else { if (g.state !== 'sansOutil') { G.resetGoblin(g); g.state = 'sansOutil'; } g.moving = false; g.pose = null; g.bubble = Ob.IC[k]; return true; } } // plus rien à la réserve : il attend
      if (!g.rendOutil && !g.chercheOutil) { if (g.state === 'sansOutil' || g.state === 'outil') { g.state = 'idle'; g.timer = 0.2; g.bubble = null; } return false; }
    }
    if (g.state !== 'outil') { G.resetGoblin(g); const st = (G.dropPoint && G.dropPoint(g)) || G.firePos(); if (!G.goTo(g, st.x + rand(-22, 22), st.y + rand(0, 8))) { fini(g); return true; } g.state = 'outil'; g.bubble = Ob.IC[g.chercheOutil || g.rendOutil]; }
    g.pose = null; if (G.follow(g, 112, dt)) fini(g);
    return true;
  };
  function fini(g) {
    if (g.rendOutil) { rendre(g.rendOutil); g.rendOutil = null; }
    if (g.chercheOutil) { g.outil0 = g.chercheOutil; g.chercheOutil = null; if (CG.onScreen(g.x, g.y)) { G.text(g.x, g.y - 44, Ob.IC[g.outil0], '#e0e0e0'); CG.sfx('click'); } }
    g.state = 'idle'; g.timer = 0.2; g.bubble = null; g.moving = false;
  }
  // ---------- le début d'une partie, et les parties d'avant ----------
  { const ir0 = G.initRuntime; G.initRuntime = function () {
    const r = ir0.apply(this, arguments), S = CG.S; if (!S || !S.goblins) return r; const neuve = !S.outils0 && (S.day || 1) <= 1; if (S.outils0 && S.outilsV >= 2) return r; stock(); S.outilsV = 2;
    S.goblins.forEach(g => { const k = Ob.BESOIN[g.job]; if (!k || Ob.a(g) || g.chercheOutil) return;
      if (!neuve) { g.outil0 = k; return; } // une partie d'avant : chacun garde de quoi travailler
      if (Ob.reste(k) > 0) { prendre(k); g.chercheOutil = k; } else { g.job = 'aucun'; } }); // une partie neuve : ils filent chercher leur outil ; s'il n'y en a pas, bricoleur
    return r;
  }; }
  { const pk = CG.pack; if (pk) CG.pack = function () { const d = pk.apply(this, arguments), S = CG.S; if (d && d.goblins && S) d.goblins.forEach((o, i) => { const g = S.goblins[i]; if (!g) return; if (g.outil0) o.outil0 = g.outil0; if (g.chercheOutil) o.chercheOutil = g.chercheOutil; if (g.rendOutil) o.rendOutil = g.rendOutil; }); return d; }; }
  // un gobelin qui s'en va pour de bon laisse son outil simple à la réserve
  { let tic = 0, vus = null; const up0 = G.update; G.update = function (dt) { up0.apply(this, arguments); tic -= dt; if (tic > 0 || !CG.S) return; tic = 2; const S = CG.S, la = new Set(S.goblins);
    if (vus && vus.S === S) vus.l.forEach(g => { if (!la.has(g)) { if (g.outil0) rendre(g.outil0); if (g.chercheOutil) rendre(g.chercheOutil); } }); vus = { S, l: S.goblins.slice() }; }; }
  // ---------- la fiche : le métier dans une liste déroulante ----------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  Ob.choix = function (g) {
    const dispo = CG.jobsAvail(g), l = dispo.includes(g.job) ? dispo : dispo.concat([g.job]), fixe = g.cls === 'loup' || g.bebe, nom = j => (g.sex === 'f' && CG.JOBS[j].nomF ? CG.JOBS[j].nomF : CG.JOBS[j].nom);
    return '<select class="iv-job" data-ivjob="' + g.id + '"' + (fixe ? ' disabled' : '') + '>' + l.map(j => { const non = j !== g.job && CG.jobOk && !CG.jobOk(j, g), k = Ob.BESOIN[j]; return '<option value="' + j + '"' + (j === g.job ? ' selected' : '') + (non ? ' disabled' : '') + '>' + CG.JOBS[j].icon + ' ' + esc(nom(j)) + (non ? (k && !Ob.peut(g, j) ? ' (pas d\'outil)' : ' (pas encore)') : '') + '</option>'; }).join('') + '</select>';
  };
  ['keydown', 'keyup'].forEach(ev => document.addEventListener(ev, e => { if (e.target && e.target.classList && e.target.classList.contains('iv-job')) e.stopPropagation(); }, true));
  document.addEventListener('pointerdown', e => { if (e.target && e.target.closest && e.target.closest('.iv-job')) e.stopPropagation(); }, true);
  document.addEventListener('change', e => { const s = e.target && e.target.closest ? e.target.closest('[data-ivjob]') : null; if (!s || !CG.S) return; const g = CG.S.goblins.find(o => o.id === +s.dataset.ivjob); if (!g) return;
    if (s.value !== g.job) { UI.setJob(g, s.value); CG.sfx('ok'); } if (CG.Inventaire && CG.Inventaire.rendu) CG.Inventaire.rendu(); });
})(window.CG);
