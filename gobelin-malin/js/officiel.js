// Goblin Malin — le nom officiel : ça ne se décide plus en pleine journée. Le matin, au réveil, chaque gobelin qui est prêt
// attend son nom : on lui en écrit un nouveau, ou on garde le sien. C'est ce nom-là qui le transforme, sur-le-champ :
// hobgobelin, ou chevaucheur de loup si le clan a une monture pour lui (mêmes critères qu'avant).
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, Of = CG.Officiel = {};
  const fem = g => g.sex === 'f', e = g => fem(g) ? 'e' : '';
  Of.pret = g => !g.nomme && !g.naming && !g.bebe && g.lvl >= CG.seuilEvo(g); // à un niveau tiré au sort pour chacun, entre 7 et 15
  Of.prets = () => CG.S.goblins.filter(Of.pret); // plus besoin d'un pouvoir : le niveau suffit
  const pris = (n, g) => CG.S.goblins.concat(CG.S.pets).some(o => o !== g && ((o.name || '').toLowerCase() === n.toLowerCase() || (o.naming || '').toLowerCase() === n.toLowerCase()));
  const stats = g => ({ hp: G.gobMaxHp(g), atk: G.guardDmg(g) });

  Of.nommer = function (g, nom, surPlace) { // surPlace : la scène est déjà ouverte (c'est là qu'on vient d'écrire le nom), on lui rend de quoi se jouer
    const R = CG.R, av = stats(g), old = g.name, avant = { cls: g.cls, job: g.job, nomme: !!g.nomme }; g.name = nom; g.naming = null; g.nomme = true;
    let loup = false; if (!g.child && CG.Evo && CG.Evo.hasMount() && Math.random() < CG.Evo.RIDER_CHANCE) { CG.Evo.makeRider(g); loup = true; }
    g.hp = G.gobMaxHp(g);
    G.puff(g.x, g.y - 18, '#ffe9a8', 26, 150, 4); R.rings.push({ x: g.x, y: g.y - 8, r: 80, life: 0.5, col: '#ffe36b' }); G.text(g.x, g.y - 64, (loup ? '🐺 ' : '✨ ') + g.name + ' !', '#ffe36b', true); g.emoteT = 2.5; CG.sfx('level');
    const sous = (loup ? (fem(g) ? 'devient Chevaucheuse de loup' : 'devient Chevaucheur de loup') : (fem(g) ? 'devient Hobgobeline' : 'devient Hobgobelin')) + (old !== g.name ? ' (c\'était ' + old + ')' : '');
    if (surPlace && CG.EvoGob) { try { CG.save(); } catch (er) { /* rien */ } return Object.assign(CG.EvoGob.fiche(g, avant), { st: { avant: av, apres: stats(g) } }); }
    if (CG.EvoGob) CG.EvoGob.ajouter(g, avant, { avant: av, apres: stats(g) }); // la grande scène, comme pour le chef
    else if (CG.EvoStats) CG.EvoStats.file.push({ icon: loup ? '🐺' : '🏷️', titre: g.name, sous, avant: av, apres: stats(g) });
    try { CG.save(); } catch (er) { /* rien */ }
  };
  // le matin : la page de la grande scène s'ouvre sur lui, avec son nom dans une grosse barre en haut. On confirme, il se
  // transforme sous nos yeux, on continue, et on passe au suivant.
  Of.demander = function (g) {
    const A = CG.Accueil; if (!(A && A.nommerGob && CG.EvoGob)) return Of.demanderVieux(g);
    A.nommerGob(CG.EvoGob.corps(g, { cls: g.cls, job: g.job, nomme: !!g.nomme }), {
      nom: g.name, phrase: g.name + ' a bien grandi. Écris son nom officiel, ou garde le sien : avec ce nom, ' + (fem(g) ? 'elle' : 'il') + ' va se transformer.',
      verifier: n => n.length < 2 ? 'Il faut au moins deux lettres.' : pris(n, g) ? 'Ce nom est déjà porté dans le clan.' : null,
      confirmer: n => Of.nommer(g, n, true) });
  };
  Of.demanderVieux = function (g, err) {
    const il = fem(g) ? 'elle' : 'il';
    UI.dialog({ goblin: g, who: g.name, tag: '🏷️ nom officiel', text: (err ? err + ' ' : '') + g.name + ' a bien grandi. Ce matin, ' + il + ' attend son nom officiel : écris-en un nouveau, ou garde le sien. Avec ce nom, ' + il + ' va se transformer.',
      extra: '<p><input id="of-in" type="text" maxlength="14" autocomplete="off" style="font:inherit;padding:6px 10px;border-radius:8px;border:2px solid #6b4a2a;background:#fff8e4;color:#2a1c0e;width:220px"></p>',
      options: [{ label: '✨ C\'est son nom officiel', fn: () => {
        const n = (document.getElementById('of-in').value || '').trim().replace(/\s+/g, ' ');
        if (n.length < 2) return Of.demanderVieux(g, 'Il faut au moins deux lettres.');
        if (pris(n, g)) return Of.demanderVieux(g, 'Ce nom est déjà porté dans le clan.');
        Of.nommer(g, n);
      } }, { label: '👍 Garder « ' + g.name + ' »', sub: 'Son nom de toujours devient son nom officiel', fn: () => Of.nommer(g, g.name) }] });
    const el = document.getElementById('of-in'); if (el) { el.value = g.name; el.focus(); el.select(); el.onkeydown = ev => { ev.stopPropagation(); if (ev.key === 'Enter') document.querySelector('#dialog .opts button').click(); }; }
  };
  // au réveil : un par un, une fois la nuit et les autres scènes passées
  const nd0 = D.nextDay; D.nextDay = function () {
    const r = nd0.apply(this, arguments), jeu = CG.S, file = Of.prets().slice();
    const suite = () => {
      if (CG.S !== jeu || !file.length) return;
      if (UI.modal || CG.R.night || CG.R.fade > 0.3) return void setTimeout(suite, 300);
      const g = file.shift(); if (jeu.goblins.includes(g) && Of.pret(g)) Of.demander(g);
      setTimeout(suite, 400);
    };
    if (file.length) setTimeout(suite, 600);
    return r;
  };
  // dans la discussion : plus de nom à donner en plein jour, juste où il en est
  const n0 = G.nameOpt; G.nameOpt = function (o) {
    if (o.pet) return n0.apply(this, arguments);
    const reste = n0.apply(this, arguments).filter(x => !/^🏷️/.test(x.label || ''));
    if (o.nomme) return reste;
    if (o.naming) return reste.concat([{ label: '🏷️ Son nom officiel : ' + o.naming, sub: 'Tu verras demain matin', disabled: true }]);
    return reste.concat([{ label: '🏷️ Nom officiel', sub: Of.pret(o) ? 'Prêt' + e(o) + ' : ça se passera demain matin, au réveil' : 'Pas encore prêt' + e(o) + ' : ça vient quelque part entre le niveau ' + CG.EVO_MIN + ' et le niveau ' + CG.EVO_MAX + ', on ne sait jamais quand (niveau ' + o.lvl + ' en ce moment)', disabled: true }]);
  };
})(window.CG);
