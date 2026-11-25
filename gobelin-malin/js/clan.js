// Goblin Malin — « Le clan », sur le tableau des nouvelles du village. Un bouton y ouvre la liste de tout le monde, rangée par
// métier : on voit combien il y en a dans chaque métier, on ouvre la fiche de chacun, et on peut changer son métier sur place.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Tb = CG.Tableau; if (!Tb || !Tb.ouvrir) return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])), $ = id => document.getElementById(id);
  const nomJ = (g, j) => { const J = CG.JOBS[j] || {}; return g && g.sex === 'f' ? J.nomF || J.nom : J.nom; };
  const ou0 = Tb.ouvrir; Tb.ouvrir = function () {
    const r = ou0.apply(this, arguments), pied = document.querySelector('#panel.tableau .tb-pied'); if (!pied) return r;
    const b = document.createElement('button'); b.id = 'tb-clan'; b.className = 'tb-autre'; b.textContent = '👥 Gérer mon clan'; b.onclick = () => { CG.sfx('page'); Tb.clan(); }; pied.insertBefore(b, pied.firstChild); return r;
  };
  Tb.clan = function () {
    const S = CG.S, gobs = S.goblins.filter(g => !g.exile), jobs = CG.JOB_ORDER.concat(Object.keys(CG.JOBS).filter(j => !CG.JOB_ORDER.includes(j))).filter(j => gobs.some(g => g.job === j)), dispo = CG.jobsAvail();
    const compte = jobs.map(j => '<span class="cl-jeton" title="' + esc(CG.JOBS[j].nom) + '">' + CG.JOBS[j].icon + ' ' + esc(CG.JOBS[j].nom) + ' <b>' + gobs.filter(g => g.job === j).length + '</b></span>').join('');
    const ligne = g => { const fixe = g.cls === 'loup' || g.bebe, choix = (dispo.includes(g.job) ? dispo : dispo.concat([g.job])).filter(j => j === g.job || !(CG.Ateliers && CG.Ateliers.plein && CG.Ateliers.plein(j, g)));
      return '<div class="cl-gob"><span class="cl-ic">' + (CG.JOBS[g.job] || {}).icon + '</span><div class="cl-nom"><b>' + esc(g.name) + '</b><small>' + (g.sex === 'f' ? '♀' : '♂') + ' niv. ' + g.lvl + (g.child ? ' · petit' : '') + '</small></div>'
        + '<select data-job="' + g.id + '"' + (fixe ? ' disabled' : '') + '>' + choix.map(j => '<option value="' + j + '"' + (j === g.job ? ' selected' : '') + (j !== g.job && CG.jobOk && !CG.jobOk(j, g) ? ' disabled' : '') + '>' + CG.JOBS[j].icon + ' ' + esc(nomJ(g, j)) + '</option>').join('') + '</select>'
        + '<button data-fiche="' + g.id + '" title="Voir sa fiche">📊 Fiche</button></div>'; };
    const groupes = jobs.map(j => { const l = gobs.filter(g => g.job === j).sort((a, b) => b.lvl - a.lvl || a.name.localeCompare(b.name)); return '<h4>' + CG.JOBS[j].icon + ' ' + esc(CG.JOBS[j].nom) + ' <i>' + l.length + '</i></h4>' + l.map(ligne).join(''); }).join('');
    const betes = S.pets.length ? '<h4>🐾 Compagnons <i>' + S.pets.length + '</i></h4>' + S.pets.map(p => '<div class="cl-gob"><span class="cl-ic">' + ((CG.P.KINDS[p.kind] || {}).icon || '🐾') + '</span><div class="cl-nom"><b>' + esc(p.name) + '</b><small>niv. ' + p.lvl + '</small></div><span class="cl-vide"></span><button data-bete="' + p.id + '" title="Voir sa fiche">📊 Fiche</button></div>').join('') : '';
    UI.modal = { name: 'tableau', closable: true, pauses: false }; CG.keys.clear();
    $('dialog').hidden = true; $('modal').className = 'soft'; $('panel').className = 'tableau';
    $('panel').innerHTML = '<div class="tb-toit"></div><div class="tb-planche"><h2>👥 Le clan</h2><div class="tb-jour">' + gobs.length + ' gobelin' + (gobs.length > 1 ? 's' : '') + (S.pets.length ? ' · ' + S.pets.length + ' compagnon' + (S.pets.length > 1 ? 's' : '') : '') + '</div><div class="cl-compte">' + compte + '</div><div class="cl-liste">' + (groupes || '<p class="cl-rien">Personne pour l\'instant.</p>') + betes + '</div>'
      + '<div class="tb-pied"><button id="tb-nouv" class="tb-autre">📋 Les nouvelles</button><button id="tb-ok">Fermer</button></div></div>';
    $('modal').hidden = false; $('tb-ok').onclick = UI.dismiss; $('tb-nouv').onclick = () => Tb.ouvrir();
    const P = $('panel'), de = id => S.goblins.find(g => g.id === +id);
    P.querySelectorAll('[data-job]').forEach(s => { ['keydown', 'keyup'].forEach(ev => s.addEventListener(ev, e => e.stopPropagation())); s.onchange = () => { const g = de(s.dataset.job); if (g && s.value !== g.job) { UI.setJob(g, s.value); CG.sfx('ok'); } Tb.clan(); }; });
    P.querySelectorAll('[data-fiche]').forEach(b => b.onclick = () => { const g = de(b.dataset.fiche); if (!g) return; UI.close(); if (CG.Inventaire && CG.Inventaire.ouvrir) CG.Inventaire.ouvrir({ cible: g, force: true }); else if (CG.Fiche) CG.Fiche.gobelin(g); });
    P.querySelectorAll('[data-bete]').forEach(b => b.onclick = () => { const p = S.pets.find(a => a.id === +b.dataset.bete); if (!p || !CG.Fiche) return; UI.close(); CG.Fiche.compagnon(p); });
  };
  const css = document.createElement('style');
  css.textContent = '#panel.tableau .tb-pied{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}'
    + '#panel.tableau .tb-autre{width:auto;padding:9px 20px;font-size:15px;font-weight:bold;color:#fff0c8;background:linear-gradient(#8a5c26,#5e3b14);border:2px solid #2e1c0a;border-radius:10px;cursor:pointer}'
    + '#panel.tableau .cl-compte{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:0 0 10px}'
    + '#panel.tableau .cl-jeton{padding:4px 10px;border-radius:14px;background:rgba(40,22,6,.55);border:1px solid rgba(255,220,150,.35);color:#fff0c8;font-size:13.5px}#panel.tableau .cl-jeton b{margin-left:3px;color:#ffe36b;font-size:15px}'
    + '#panel.tableau .cl-liste{overflow-y:auto;min-height:0;max-height:54vh;padding:2px 6px 6px}'
    + '#panel.tableau .cl-liste h4{margin:10px 0 5px;color:#fff0c8;font-size:15px;text-shadow:0 1px 0 #3a2208;border-bottom:1px solid rgba(255,220,150,.3);padding-bottom:3px}#panel.tableau .cl-liste h4:first-child{margin-top:0}#panel.tableau .cl-liste h4 i{font-style:normal;color:#ffe36b;margin-left:4px}'
    + '#panel.tableau .cl-gob{display:grid;grid-template-columns:28px minmax(0,1fr) minmax(150px,200px) auto;align-items:center;gap:8px;padding:5px 8px;margin-bottom:4px;background:linear-gradient(#fff6d8,#efdfb0);color:#3a2610;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,.35)}'
    + '#panel.tableau .cl-ic{font-size:20px;text-align:center}#panel.tableau .cl-nom b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#panel.tableau .cl-nom small{font-size:12px;opacity:.75}'
    + '#panel.tableau .cl-gob button{width:auto;padding:5px 10px;font-size:13px;font-weight:bold;color:#fff0c8;background:linear-gradient(#6b8a2a,#4a6a1a);border:2px solid #2e4410;border-radius:8px;cursor:pointer}#panel.tableau .cl-gob select{width:100%;font-size:13px}'
    + '#panel.tableau .cl-rien{color:#fff0c8;text-align:center}'
    + '@media (max-width:560px){#panel.tableau .cl-gob{grid-template-columns:24px minmax(0,1fr) auto}#panel.tableau .cl-gob select{grid-column:1 / -1;grid-row:2}}';
  document.head.appendChild(css);
})(window.CG);
