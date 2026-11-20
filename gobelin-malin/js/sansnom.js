// Goblin Malin — les compagnons n'ont pas de nom au départ : juste « Loup », « Hibou », « Orc »...
// C'est seulement quand l'un d'eux se transforme qu'on lui en donne un (une petite fenêtre le demande, avec une idée toute prête).
// Les fantômes des anciens chefs gardent le leur, et un « nom véritable » déjà donné reste.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, P = CG.P, pick = CG.pick, Sn = CG.SansNom = {};
  Sn.COURT = { loup: 'Loup', ours: 'Ours', felin: 'Chat sauvage', hibou: 'Hibou', faucon: 'Faucon' };
  Sn.IDEES = ['Croc', 'Mousse', 'Griffe', 'Plume', 'Flocon', 'Ombre', 'Truffe', 'Éclair', 'Noisette', 'Tonnerre', 'Pépite', 'Brume', 'Caillou', 'Ronron', 'Tempête', 'Biscuit', 'Braise', 'Orage', 'Givre', 'Rocaille'];
  Sn.espece = p => { const k = P.KINDS[p.kind]; return !k ? 'Compagnon' : p.bebe && !p.evo ? k.nom : Sn.COURT[p.kind] || k.nom; };
  const generique = p => { const k = P.KINDS[p.kind]; return !!k && (p.name === k.nom || p.name === Sn.COURT[p.kind] || p.name === Sn.espece(p)); };
  const libre = n => !CG.S.goblins.concat(CG.S.pets).some(o => (o.name || '').toLowerCase() === n.toLowerCase());
  Sn.demander = function (p, err) {
    const idee = pick(Sn.IDEES.filter(libre)) || 'Fidèle', titre = P.title(p);
    UI.dialog({ visitor: { role: 'animal', look: 'animal', kind: p.kind, evo: p.evo }, who: titre, tag: '✨ il s\'est transformé',
      text: (err ? err + ' ' : '') + 'Ton ' + Sn.espece(p).toLowerCase() + ' est devenu : ' + titre + ' ! Il a bien mérité un nom. Comment l\'appelles-tu ?',
      extra: '<p><input id="sn-in" type="text" maxlength="14" autocomplete="off" value="' + idee.replace(/"/g, '') + '" style="font:inherit;padding:6px 10px;border-radius:8px;border:2px solid #6b4a2a;background:#fff8e4;color:#2a1c0e;width:220px"></p>',
      options: [{ label: '✨ Lui donner ce nom', fn: () => { const n = ((document.getElementById('sn-in') || {}).value || '').trim().replace(/\s+/g, ' ');
        if (n.length < 2) return Sn.demander(p, 'Il faut au moins deux lettres.'); if (!libre(n)) return Sn.demander(p, 'Ce nom est déjà porté dans le clan.');
        p.name = n; G.text(p.x, p.y - 54, '✨ ' + n + ' !', '#ffe36b', true); G.puff(p.x, p.y - 18, '#ffe9a8', 16, 100, 3); CG.sfx('level'); UI.toast('🏷️ ' + titre + ' s\'appelle maintenant ' + n + '.'); } },
        { label: '🎲 Choisis pour moi', fn: () => { p.name = pick(Sn.IDEES.filter(libre)) || 'Fidèle'; G.text(p.x, p.y - 54, '✨ ' + p.name + ' !', '#ffe36b', true); CG.sfx('level'); UI.toast('🏷️ ' + titre + ' s\'appelle maintenant ' + p.name + '.'); } }] });
    const el = document.getElementById('sn-in'); if (el) { el.focus(); el.select(); el.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') document.querySelector('#dialog .opts button').click(); }; }
  };
  let tic = 0; const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; tic -= dt; if (tic > 0) return; tic = 0.5;
    for (const p of S.pets) { if (p.kind === 'ame' || p.nomme || p.naming || !P.KINDS[p.kind]) continue;
      if (!p.evo) { const e = Sn.espece(p); if (p.name !== e) p.name = e; continue; } // pas encore transformé : pas de nom
      if (generique(p) && !UI.modal && !R.night && !R.cine && !R.alarm && !(R.ko > 0) && !p.evoDemain) { Sn.demander(p); return; } // transformé, et toujours sans nom : on le lui demande
    }
  };
})(window.CG);
