// Goblin Malin — les compagnons (animaux, orcs, trolls...). Quand l'un d'eux est prêt, rien ne l'annonce : juste un nouveau
// choix dans sa discussion : « Le renommer officiellement ». C'est en recevant son nom qu'il se transforme (même scène que le chef).
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, P = CG.P;
  const stats = p => ({ hp: P.maxHp(p), atk: P.dmg(p) });
  function transformer(p) { // ce que faisait l'éclair en plein jour, sans le spectacle
    const av = stats(p); p.evo = 1; p._evo = 1; p.evoDemain = false; p.evoT = 0; p.hp = P.maxHp(p); p.cdS = 1; return { avant: av, apres: stats(p) };
  }
  const Co = CG.Compagnons = {};
  // prêt : il a atteint son niveau (tiré au sort, jamais affiché), ou il porte déjà un nom d'une ancienne partie sans avoir changé
  Co.pret = p => { const k = P.KINDS[p.kind]; return !!k && !!k.evo && p.kind !== 'ame' && !p.evo && !p.ko && !(p.evoT > 0) && (p.nomme || p.evoDemain || p.lvl >= CG.seuilEvo(p)); };
  // « Le renommer officiellement » : on écrit son nom, et c'est là qu'il se transforme (la surprise)
  Co.demander = function (p) {
    const S = CG.S, A = CG.Accueil; if (!Co.pret(p) || !A || !A.nommerGob) return;
    const Kd = P.KINDS[p.kind] || {}, Sn = CG.SansNom, libre = n => !S.goblins.concat(S.pets).some(o => o !== p && (o.name || '').toLowerCase() === n.toLowerCase());
    const idee = p.nomme ? p.name : (Sn && CG.pick(Sn.IDEES.filter(libre))) || 'Fidèle', espece = (Sn ? Sn.espece(p) : Kd.nom || 'compagnon').toLowerCase();
    const nommer = n => { const av = stats(p); p.name = n; p.nomme = true; p.naming = null; transformer(p); try { CG.save(); } catch (e) { /* rien */ } return { av, ap: stats(p) }; };
    A.nommerGob(null, { pet: p, nom: idee, phrase: 'Écris le nom officiel de ton ' + espece + '.',
      verifier: n => n.length < 2 ? 'Il faut au moins deux lettres.' : !libre(n) ? 'Ce nom est déjà porté dans le clan.' : null,
      confirmer: n => { const r = nommer(n || idee); return { pet: p, st: { avant: r.av, apres: r.ap }, opt: { evo: [0, 1], E: { nom: p.name, col: '255,227,107', sub: 'Ton ' + espece + ' est devenu : ' + (Kd.evo || 'plus fort') + ' ! ' + (Kd.special || '') } } }; } });
  };
  // au réveil : seuls les fantômes d'anciens chefs changent tout seuls (ils gardent leur nom)
  const nd0 = D.nextDay; D.nextDay = function () {
    const r = nd0.apply(this, arguments), S = CG.S, file = S.pets.filter(p => p.kind === 'ame' && p.evoDemain && !p.evo && !p.ko).map(p => ({ p, st: transformer(p) }));
    S.pets.forEach(p => { if (p.evo) p.evoDemain = false; });
    if (!file.length || !(CG.Accueil && CG.Accueil.evolvePet)) return r;
    const jeu = S, suite = () => {
      if (CG.S !== jeu || !file.length) return;
      if (UI.modal || CG.R.night) return void setTimeout(suite, 300);
      const k = file.shift(); CG.R.evoStats = k.st; CG.Accueil.evolvePet(k.p, () => setTimeout(suite, 250));
    };
    setTimeout(suite, 400); try { CG.save(); } catch (e) { }
    return r;
  };
  // le petit signe, en attendant : des étincelles dorées de temps en temps autour de celui qui va changer
  let tic = 0; const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; tic -= dt; if (tic > 0) return; tic = 0.35;
    for (const p of S.pets) if (p.kind === 'ame' && p.evoDemain && !p.ko && !p.ridden && CG.onScreen(p.x, p.y)) R.parts.push({ x: p.x + CG.rand(-14, 14), y: p.y - 8 - CG.rand(0, 26), vx: CG.rand(-8, 8), vy: CG.rand(-30, -12), life: 0.8, max: 0.8, col: Math.random() < 0.5 ? '#ffe36b' : '#ffffff', size: 2.5, float: true });
  };
})(window.CG);
