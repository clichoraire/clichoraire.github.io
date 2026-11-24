// Goblin Malin — la mémoire des donjons. Les monstres ne sont pas dans la sauvegarde : en quittant le jeu au milieu d'un donjon
//   puis en revenant, tout le monde était recréé, même ceux déjà battus (et les coffres déjà ouverts se refermaient).
//   Ici : dans un donjon, le peuplement est tiré avec un hasard fixe (la graine du donjon), donc toujours le même ; on retient
//   le rang de chaque monstre battu et de chaque coffre ouvert (S.arene), et au retour on les retire.
//   Ceux qui s'installent juste après (une meute qui rejoint, dans les TARD premières secondes) sont comptés par sorte :
//   on retient combien il en reste en vie, et au retour il n'en revient pas plus.
//   Chargé en dernier : il doit envelopper tout ce qui peuple un donjon (D.rollWild).
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, Dm = CG.DonjonMemoire = { TARD: 5 };
  const dedans = () => !!(CG.S && CG.S.arene && CG.Arene && CG.Arene.dans && CG.Arene.dans());
  const cle = () => { const S = CG.S, A = S.arene; return [A.id, A.seed || 0, A.palier || 0, S.etages || 0, A.vague || 0, A.bossVu ? 1 : 0].join(':'); };
  const compte = e => !!e.arene && !e.revenu;
  let enRoll = false;
  const rw0 = D.rollWild; D.rollWild = function () {
    if (!dedans()) return rw0.apply(this, arguments);
    const S = CG.S, A = S.arene, k = cle(), vrai = Math.random; let r;
    if (A.memCle !== k) { A.memCle = k; A.morts = []; A.tard = {}; A.tardFait = false; A.tardTues = 0; A.coffresOuverts = []; }
    let h = 0; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
    Math.random = CG.makeRng((h >>> 0) % 2000000000 + 17); enRoll = true; try { r = rw0.apply(this, arguments); } finally { Math.random = vrai; enRoll = false; }
    const R = CG.R; if (!R || A.gagne) return r;
    const tous = R.enemies.slice(), morts = new Set(A.morts || []); let deja = 0;
    R.arTous = tous.map((e, i) => ({ e, i, fait: morts.has(i) })); R.arT0 = R.t || 0; R.arQuota = A.tardFait ? Object.assign({}, A.tard || {}) : null; R.arClos = false; R.memN = 0;
    if (morts.size || A.tardTues) { R.enemies = R.enemies.filter(e => { if (!morts.has(tous.indexOf(e))) return true; if (compte(e)) deja++; return false; }); if (R.grotte && R.grotte.reine && !R.enemies.includes(R.grotte.reine)) R.grotte.reine = null;
      R.cptD = { tues: deja + (A.tardTues || 0), vivants: R.enemies.reduce((a, e) => a + (!e.dead && compte(e) ? 1 : 0), 0) }; }
    return r;
  };
  const sp0 = G.spawnEnemy; G.spawnEnemy = function () {
    const e = sp0.apply(this, arguments), R = CG.R; if (!e || enRoll || !R || !R.arTous || R.arClos || !dedans()) return e;
    const A = CG.S.arene, k = e.type, Q = R.arQuota;
    if (Q) { if (!(Q[k] > 0)) { e.dead = true; e.hp = 0; const i = R.enemies.indexOf(e); if (i >= 0) R.enemies.splice(i, 1); return e; } Q[k]--; } /* au retour : pas plus qu'il n'en restait */
    else { const t = A.tard || (A.tard = {}); t[k] = (t[k] || 0) + 1; }
    R.arTous.push({ e, tard: k, fait: false }); return e;
  };
  let tic = 0;
  const up0 = G.update; G.update = function (dt) {
    const r = up0.apply(this, arguments), R = CG.R; if (!R || !R.arTous || !dedans()) return r; const A = CG.S.arene;
    if (!R.arClos && (R.t || 0) - (R.arT0 || 0) > Dm.TARD) { R.arClos = true; const Q = R.arQuota; if (Q) Object.keys(Q).forEach(k => { if (Q[k] > 0 && A.tard) A.tard[k] = Math.max(0, (A.tard[k] || 0) - Q[k]); }); A.tardFait = true; } /* l'installation est finie */
    for (const q of R.arTous) if (!q.fait && (q.e.dead || !R.enemies.includes(q.e))) { q.fait = true; if (q.tard) { if (A.tard && A.tard[q.tard] > 0) A.tard[q.tard]--; A.tardTues = (A.tardTues || 0) + 1; } else (A.morts = A.morts || []).push(q.i); }
    tic -= dt; if (tic > 0) return r; tic = 0.5; const ouverts = A.coffresOuverts || (A.coffresOuverts = []);
    for (const c of R.chests || []) { if (c.memI === undefined) c.memI = c.pg ? 'pg' : 'c' + (R.memN = (R.memN || 0) + 1); /* un coffre se reconnaît à son rang, celui de la salle piégée à part */
      if (c.open) { if (!ouverts.includes(c.memI)) ouverts.push(c.memI); } else if (ouverts.includes(c.memI)) c.open = true; }
    return r;
  };
})(window.CG);
