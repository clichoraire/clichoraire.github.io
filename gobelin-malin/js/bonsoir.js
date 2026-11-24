// Goblin Malin — le clan salue son chef, le soir.
//   Entre 19 h et 20 h, quand le chef arrive au feu de camp où les gobelins l'attendent, quelques-uns le saluent.
//   S'il arrive alors que le feu est déjà allumé et que ça danse, ils lui parlent plutôt de la fête.
//   Une fois par soir (et une autre fois si la fête a commencé entre-temps). Et aussi : au puits magique, la mise s'affiche en gros.
//   Tout se règle dans CG.Bonsoir.
'use strict';
(function (CG) {
  const G = CG.G, rand = CG.rand;
  const Bs = CG.Bonsoir = { DE: 19, A: 20, LOIN: 300, PRES: 175, COMBIEN: [2, 3],
    ARRIVE: ['Ah ! C\'est le chef !', 'Youpi, le chef est arrivé !', 'Chef ! On t\'a gardé la meilleure place !', 'Le voilà ! Je vous l\'avais dit qu\'il viendrait !', 'Bonsoir, chef ! Belle journée, hein ?', 'Chef ! Chef ! Par ici !', 'Enfin ! On n\'attendait plus que toi.',
      'Tiens, voilà le patron !', 'Hourra pour le chef !', 'Chef ! Tu allumes le feu ? Dis oui !', 'Oh ! Le chef ! Tout le monde, tenez-vous droit !', 'Salut chef ! T\'as fait bonne chasse ?', 'Le chef est là ! La soirée peut commencer !', 'Chef ! J\'ai une histoire à te raconter !',
      'On commençait à s\'inquiéter, chef !', 'Regardez qui arrive ! C\'est notre chef !', 'Chef ! Viens t\'asseoir, t\'as l\'air crevé.', 'Bonsoir chef ! J\'ai faim, pas toi ?', 'Ah, chef ! Le feu t\'attend. Nous aussi.', 'C\'est lui ! C\'est le chef ! Faites de la place !',
      'Chef ! Ça sent la fête, ce soir !', 'Te voilà ! J\'ai gardé une brochette pour toi. Presque entière.', 'Vive le chef ! ...Quoi ? J\'ai bien le droit de le dire.', 'Chef ! Raconte ta journée !'],
    DANSE: ['Chef ! Viens danser avec nous !', 'Tu arrives pile pour la meilleure chanson !', 'Chef ! Regarde mes pas de danse !', 'On a commencé sans toi, désolé... mais viens !', 'Le feu est chaud, chef, approche !', 'Attention chef, je tourne ! Ouuuh, ça tourne...', 'Allez chef, dans la ronde !',
      'Chef ! Tu connais celle-là ? Lalala, la la !', 'T\'as raté le début, mais pas le meilleur !', 'Chef ! Prends une brochette, elles sont juste dorées !', 'Danse, chef, danse ! Personne te regarde. Sauf nous.', 'Chef ! Regarde comme les flammes montent haut !', 'Youhou ! Le chef vient faire la fête !', 'Viens te réchauffer, chef, il reste de la place près du feu !',
      'Chef ! Je danse depuis tantôt et j\'ai plus de jambes !', 'Écoute le tambour, chef ! Boum, boum, boum !', 'Le chef est là ! Plus fort, la musique !', 'Chef ! Montre-nous ta danse du gobelin !', 'On chante la chanson du clan, chef ! Tu connais les paroles ?', 'Hé chef ! Les étincelles font des étoiles, regarde !',
      'Un tour de ronde, chef ? Juste un !', 'Chef ! J\'ai inventé un pas. Il s\'appelle « le champignon ».', 'Enfin toi ! La fête était bien, là elle va être super !', 'Chef ! Qui danse le mieux, moi ou lui ? Dis que c\'est moi.'] };
  const tirer = (l, n) => (CG.shuffle ? CG.shuffle(l.slice()) : l.slice().sort(() => Math.random() - 0.5)).slice(0, n);
  function saluer(quoi) { const S = CG.S, f = G.firePos(), pres = S.goblins.filter(g => !g.hidden && !g.frousse && (g.state === 'party' || g.state === 'toParty' || Math.hypot(g.x - f.x, g.y - f.y) < 190));
    if (!pres.length) return 0; const n = Math.min(pres.length, Math.round(rand(Bs.COMBIEN[0], Bs.COMBIEN[1]))), qui = tirer(pres, n), mots = tirer(quoi === 'danse' ? Bs.DANSE : Bs.ARRIVE, n);
    qui.forEach((g, i) => { G.say(g, mots[i], 3.4, i * 0.9); if (quoi !== 'danse') { g.face = S.player.x > g.x ? 1 : -1; g.emoteT = 1.5; } }); return n; }
  Bs.saluer = saluer;
  { const up0 = G.update; G.update = function () { const r = up0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || R.night || R.cine || R.ko > 0) return r;
    const p = S.player, f = G.firePos(), d = Math.hypot(p.x - f.x, p.y - f.y); if (d > Bs.LOIN) R.bsLoin = true; // il faut être parti pour « arriver »
    if (R.bsJour !== S.day) { R.bsJour = S.day; R.bsFait = {}; }
    if (!R.bsLoin || d > Bs.PRES || R.alarm || S.hour < Bs.DE) return r;
    const quoi = R.fireLit ? 'danse' : S.hour < Bs.A ? 'arrive' : null; R.bsLoin = false; if (!quoi || R.bsFait[quoi]) return r;
    if (saluer(quoi)) R.bsFait[quoi] = true; return r; }; }
  // ---------- au puits magique : la mise, en gros ----------
  if (CG.Puits && CG.Puits.payer) { const pa0 = CG.Puits.payer; CG.Puits.payer = function () { const c = pa0.apply(this, arguments); try { /* un seul « -X » : le petit texte à l'écran, pas en plus celui au-dessus du chef */
      const el = document.createElement('div'); el.className = 'pz-moins'; el.textContent = '-' + c + ' 🪙'; document.body.appendChild(el); setTimeout(() => el.remove(), 1500); } catch (e) { /* rien */ } return c; }; }
  if (!document.getElementById('bs-css')) { const st = document.createElement('style'); st.id = 'bs-css'; st.textContent = '.pz-moins{position:fixed;left:50%;top:34%;z-index:80;pointer-events:none;font:800 clamp(18px,2.4vw,26px)/1 "Trebuchet MS",system-ui,sans-serif;color:#ffe36b;text-shadow:0 2px 0 #5a3a08,0 0 8px rgba(255,220,90,.5);white-space:nowrap;animation:pzMoins 1.45s cubic-bezier(.2,.9,.3,1) both}@keyframes pzMoins{0%{opacity:0;transform:translate(-50%,10px) scale(.5)}15%{opacity:1;transform:translate(-50%,0) scale(1.15)}30%{transform:translate(-50%,0) scale(1)}75%{opacity:1}100%{opacity:0;transform:translate(-50%,-40px) scale(1)}}@media (prefers-reduced-motion:reduce){.pz-moins{animation-duration:.01s;animation-delay:1.2s}}'; document.head.appendChild(st); }
})(window.CG);
