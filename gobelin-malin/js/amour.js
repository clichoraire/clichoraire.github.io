// Clan Gobelin — l'amour : de jour, le chef peut conter fleurette aux gobelines (ou aux gobelins, si c'est une cheffe).
// L'affection monte de 0 à 100 : béguin, en amour, fou d'amour. Plus elle est haute, plus les discussions changent, et plus il naît de bébés.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Soc = CG.Soc, pick = CG.pick, clamp = CG.clamp;
  const Am = CG.Amour = { SEUILS: [25, 60, 100], GAIN: [0, 8, 14], BONUS: 6, RATE: 12, VITESSE: [1, 1, 1.1, 1.15], BEBES: [0, 0, 1, 2] };
  const fem = g => g.sex === 'f';
  Am.cible = g => !!g && g.met && !g.exile && Soc.courtable(g);
  Am.stage = g => { const a = (g && g.amour) || 0; return a >= 100 ? 3 : a >= 60 ? 2 : a >= 25 ? 1 : 0; };
  Am.nom = g => ['', 'a le béguin pour toi', 'en amour avec toi', fem(g) ? 'folle d\'amour pour toi' : 'fou d\'amour pour toi'][Am.stage(g)];
  Am.bebes = g => Am.cible(g) ? Am.BEBES[Am.stage(g)] : 0;
  Am.SOIR = ['Je t\'attendais, chef. J\'ai gardé une place près du feu, juste pour nous deux. Alors... qu\'est-ce que tu veux vraiment ?', 'Te voilà enfin ! Mon cœur danse plus vite que mes pieds. Dis-moi ce que tu as en tête, chef.', 'Chef... toute la journée, j\'ai pensé à ce soir. Qu\'est-ce que tu voulais me dire ?'];

  // ---------- les sujets : { s: étape, t: ce que dit le gobelin, o: [[réponse du chef, valeur, ton, réplique]] } ----------
  // valeur : 2 touche en plein cœur · 1 fait sourire · 0 tombe à plat · -1 blesse. Le ton préféré de sa personnalité compte plus.
  const F = [
    { s: 0, t: "Oh ! Chef... tu voulais me voir, moi ? Pour vrai ?", o: [["Oui. Tu as un sourire qui éclaire tout le village.", 2, 'f'], ["J'avais juste envie de jaser avec toi. Comment va ta journée ?", 2, 'e'], ["Je passais par là, c'est tout.", 0, 's', "Ah. Bon. Repasse quand tu veux, alors."], ["Non, c'était une erreur.", -1]] },
    { s: 0, t: "Tu me regardes drôlement, chef. J'ai une feuille dans les cheveux ?", o: [["Non, non. Je te regardais, c'est tout. Ça fait du bien aux yeux.", 2, 'f'], ["Oui, une grosse. Attends, je te l'enlève... voilà.", 2, 'g'], ["Trois feuilles, une brindille et un escargot.", 1, 'b', "Hi hi ! L'escargot, c'est mon ami. Laisse-le là."], ["Tu as surtout l'air de ne pas travailler.", -1]] },
    { s: 0, t: "Il paraît que tu parles à tout le monde aujourd'hui, chef. Même à moi ?", o: [["Surtout à toi.", 2, 's'], ["Raconte-moi quelque chose sur toi que personne ne sait.", 2, 'e', "Bon... je collectionne les cailloux ronds. J'en ai quarante-deux. Ne le dis à personne !"], ["Je fais ma tournée, c'est tout.", 0, 's', "Ah. Une tournée. Comme pour les poules."], ["Pas longtemps. Tu m'ennuies déjà.", -1]] },
    { s: 0, t: "J'ai fait une galette de baies ce matin. Elle est un peu brûlée... tu veux goûter ?", o: [["Brûlée, c'est comme ça que je les préfère. Elle est délicieuse !", 2, 'g'], ["Miam ! Tu m'en gardes une autre pour demain ?", 2, 'b'], ["Qui t'a appris à cuisiner ?", 1, 'e', "Ma grand-mère. Elle brûlait tout, elle aussi. C'est de famille."], ["Beurk. Donne ça aux cochons.", -1]] },
    { s: 0, t: "Chef... est-ce que tu trouves que j'ai de belles oreilles ?", o: [["Les plus belles oreilles du clan. Et de loin.", 2, 'f'], ["Elles bougent quand tu ris. C'est ce que je préfère.", 2, 'g'], ["Assez grandes pour faire de l'ombre aux champignons.", 1, 'b', "Hé ! ... Bon, c'est vrai. Hi hi."], ["On dirait deux feuilles de chou.", -1]] },
    { s: 0, t: "Je me demandais, chef... c'est quoi, ta couleur préférée ?", o: [["Le vert. Le même vert que toi, exactement.", 2, 'f'], ["Et la tienne ? Dis-moi la tienne d'abord.", 2, 'e', "Le jaune du feu, le soir. Quand tu es assis{E} tout près."], ["Le brun de la boue. Ça ne se salit jamais.", 1, 'b', "Ha ha ! Tu es drôle, toi."], ["Je n'ai pas de temps pour ces niaiseries.", -1]] },

    { s: 1, t: "Chef ! Je... je t'ai cueilli ça. C'est une fleur. Enfin, c'était. Je l'ai serrée trop fort.", o: [["Elle est parfaite. Je la garde sur moi toute la journée.", 2, 'g'], ["Une fleur écrasée par toi vaut dix fleurs neuves.", 2, 'f'], ["Ha ha ! On dirait une crêpe verte. Je l'adore.", 2, 'b'], ["Jette ça, ça va attirer les mouches.", -1]] },
    { s: 1, t: "Quand tu passes près de moi, mon cœur fait « poum poum poum ». C'est grave, chef ?", o: [["Pas grave du tout. Le mien fait pareil.", 2, 'g'], ["Très sérieux. Le seul remède : qu'on se voie plus souvent.", 2, 's'], ["Va voir le chaman, il a des tisanes pour ça.", 0, 'b', "J'y suis allé{e}. Il a ri et il a dit : « C'est l'amour, nouille. »"], ["C'est sûrement quelque chose que tu as mangé.", -1]] },
    { s: 1, t: "J'ai dit à {o} que tu m'avais souri hier. On ne m'a pas cru{e}.", o: [["Alors je vais te sourire devant tout le village.", 2, 'f'], ["Dis-lui que je te souris tous les jours.", 2, 'g'], ["Et qu'est-ce que tu lui as dit d'autre ?", 1, 'e', "Que tu avais de beaux yeux. Oups. Je n'aurais pas dû te le répéter."], ["{o} a raison. Je ne souris à personne.", -1]] },
    { s: 1, t: "Chef, si on allait voir le coucher du soleil ensemble, un de ces soirs ?", o: [["Ce soir, près du feu. Je te garde une place à côté de moi.", 2, 'g'], ["Oui ! Et j'apporte les baies.", 2, 'b'], ["Pourquoi il se couche, le soleil, d'après toi ?", 1, 'e', "Parce qu'il est fatigué de nous regarder travailler. Moi, je ne me fatigue pas de te regarder."], ["J'ai un village à diriger, moi.", -1]] },
    { s: 1, t: "Je me suis coiffé{e} pendant une heure ce matin. Tu... tu avais remarqué ?", o: [["Tout de suite. Tu es {beau} comme un matin sans brume.", 2, 'f'], ["Oui. Mais décoiffé{e}, je t'aimais déjà bien.", 2, 'g'], ["Une heure ? Tu fais quoi, pendant une heure ?", 1, 'e', "Je me regarde dans la mare et je répète ce que je vais te dire. Et après, j'oublie tout."], ["Non. Tu es pareil{le} que d'habitude.", -1]] },

    { s: 2, t: "Je pense à toi tout le temps, chef. Ce matin, j'ai mis du sel dans mes bottes et mes pieds dans la soupe.", o: [["Ha ha ! Garde-moi un bol, je veux goûter à ça.", 2, 'b'], ["Moi aussi je pense à toi. J'ai appelé le forgeron par ton nom.", 2, 'g'], ["Fais attention à toi, quand même. Je tiens à toi.", 2, 's'], ["Concentre-toi donc sur ton travail.", -1]] },
    { s: 2, t: "Chef... tu crois qu'un jour, il y aura des petits gobelins avec tes oreilles et mon nez ?", o: [["J'espère bien. Surtout ton nez.", 2, 'f'], ["Viens me voir ce soir, près du feu. On en reparle.", 2, 's'], ["Pauvres petits ! Avec mes oreilles, ils vont s'envoler au premier coup de vent.", 2, 'b'], ["Ne rêve pas trop.", -1]] },
    { s: 2, t: "Je t'ai tricoté une écharpe. Elle a trois bouts. Je ne sais pas ce qui s'est passé.", o: [["Trois bouts : il y en a un pour te réchauffer avec moi.", 2, 'g'], ["C'est la plus belle écharpe à trois bouts que j'aie vue de ma vie.", 2, 'f'], ["Comment tu as fait ça ?", 1, 'e', "J'ai pensé à toi et j'ai arrêté de compter les mailles."], ["Je ne mettrai jamais ça.", -1]] },
    { s: 2, t: "Dis-moi quelque chose de doux, chef. Juste une chose.", o: [["Quand tu n'es pas là, le village a l'air tout gris.", 2, 'g'], ["Tu es {beau} comme un champignon après la pluie.", 2, 'f'], ["Purée de navets tiède.", 1, 'b', "... C'est doux, c'est vrai. Hi hi ! Nono."], ["Je n'ai pas le temps pour ces niaiseries.", -1]] },
    { s: 2, t: "Hier, {o} m'a demandé pourquoi je souriais tout{e} seul{e}. Je n'ai pas su quoi répondre.", o: [["Réponds : « Parce que le chef m'aime bien. » C'est la vérité.", 2, 's'], ["Dis que c'est un secret entre toi et moi.", 2, 'g'], ["Dis que tu as avalé une luciole.", 2, 'b'], ["Dis que tu es un peu simple d'esprit.", -1]] },

    { s: 3, t: "Te voilà ! Ça faisait quatre cent douze battements de cœur que tu étais parti{E}. J'ai compté.", o: [["Moi, j'en ai compté quatre cent treize.", 2, 'b'], ["Alors je ne partirai plus aussi longtemps.", 2, 'g'], ["Tu comptes vraiment tes battements de cœur ?", 1, 'e', "Seulement quand tu n'es pas là. Sinon, ils vont trop vite."], ["Tu devrais plutôt compter le bois.", -1]] },
    { s: 3, t: "J'ai gravé nos deux noms sur le gros chêne. Avec un cœur. Bon, le cœur ressemble à une patate.", o: [["Une patate d'amour. C'est encore mieux.", 2, 'b'], ["Montre-moi. Je veux le voir tous les matins.", 2, 'g'], ["Il durera cent ans, ce chêne. Nous aussi.", 2, 's'], ["Tu abîmes les arbres, maintenant ?", -1]] },
    { s: 3, t: "Chef, quoi qu'il arrive, je reste à côté de toi. Même contre un dragon. Enfin... un petit dragon.", o: [["Et moi, je te protégerai. Même contre un gros.", 2, 's'], ["Avec toi à mes côtés, je n'ai peur de rien.", 2, 'f'], ["Un tout petit, alors. De la taille d'un poulet.", 2, 'b'], ["Tu ne tiendrais pas deux secondes.", -1]] },
    { s: 3, t: "J'ai inventé une chanson pour toi. Elle n'a qu'un mot : ton nom. Répété soixante fois.", o: [["Chante-la-moi ce soir, près du feu. Les soixante fois.", 2, 'g'], ["Soixante ? J'en veux cent.", 2, 'f'], ["Et l'air, il ressemble à quoi ?", 1, 'e', "À un crapaud heureux. C'est ce que tout le monde dit."], ["Garde-la pour toi, par pitié.", -1]] },
    { s: 3, t: "Chef... si j'étais une étoile, je me décrocherais du ciel pour venir dormir sur le toit de ta hutte.", o: [["Et moi, je grimperais sur le toit pour te tenir compagnie.", 2, 'g'], ["Tu brilles déjà plus fort que toutes les étoiles.", 2, 'f'], ["Fais attention de ne pas mettre le feu au chaume.", 2, 'b'], ["Les étoiles ne font pas ça. Va travailler.", -1]] }
  ];
  const OUI = [
    ["Hi hi ! Tu es fin{E}, chef.", "Oh ! Merci... je vais y penser toute la journée.", "(rougit jusqu'au bout des oreilles)", "Tu dis ça à tout le monde ? ... Non ? Vraiment ?"],
    ["Oh, chef... arrête, je vais rougir. Non, continue.", "Mon cœur vient de faire une pirouette.", "Hi hi hi ! Je vais travailler en chantant.", "Tu me donnes des ailes, chef."],
    ["Je t'aime gros comme la forêt, chef.", "Reviens me voir demain. Et après-demain. Et tous les jours.", "Avec toi, même la corvée de bois est belle.", "Mon cœur est à toi. Fais-y attention, il est fragile."],
    ["Je t'aime jusqu'à la lune, et je reviens à pied.", "Toi et moi, pour toujours, chef.", "Je garde chacun de tes mots dans une petite boîte.", "Viens me voir ce soir près du feu... j'ai une idée."]
  ];
  const DEJA = ["Hi hi ! Encore toi ? On a déjà roucoulé aujourd'hui, chef. Garde-m'en pour demain !", "Tu reviens déjà ? Mon cœur n'a pas fini de digérer ce que tu m'as dit tantôt.", "Chut... si on se parle trop, les autres vont jaser. À demain, chef."];
  const SALUT = [
    [],
    ["Oh ! Chef ! Je... euh... bonjour. J'espérais que tu passerais.", "C'est toi ! Attends, je replace mes cheveux. Voilà. Bonjour.", "Chef ! J'étais justement en train de... euh... de ne pas penser à toi du tout."],
    ["Te voilà ! Ma journée vient de devenir plus belle.", "Chef ! J'ai travaillé plus vite pour que tu sois content{E} de moi.", "J'ai rêvé de toi cette nuit. On mangeait des baies sur un nuage."],
    ["Mon chef à moi ! Viens ici que je te regarde.", "Enfin ! Tu m'as manqué depuis... depuis tantôt.", "Chaque fois que je te vois, c'est comme la première fois, chef."]
  ];
  const DOUX = [[], ["💗", "Coucou, chef !", "Hi hi..."], ["💕", "C'est mon chef !", "Coucou, toi !", "Tu passes me voir ?"], ["💕", "Mon amour !", "Je t'envoie un bisou !", "Reviens vite, chef !"]];
  Soc.POOL.WATCH.amour = [["Ouuuuh, les amoureux !", 1], ["Hi hi hi ! Regarde-les !", 1], ["Oh, c'est cute.", 0], ["Ça roucoule par ici...", 1], ["Moi aussi je veux qu'on me dise des mots doux.", 0], ["💕", 0], ["Beurk, de l'amour.", 1], ["Je vais le dire à tout le monde !", 1]];
  const cheffe = () => Soc.courtable({ sex: 'm' }); // si les gobelins peuvent tomber en amour, c'est que le chef est une gobeline
  function fillA(s, g, autre) { // {e} {le} {il} {beau} s'accordent avec le gobelin, {E} avec le chef, {o} est un autre villageois
    return s.replace(/\{o\}/g, autre || 'le voisin').replace(/\{n\}/g, g.name).replace(/\{le\}/g, fem(g) ? 'le' : '').replace(/\{e\}/g, fem(g) ? 'e' : '').replace(/\{il\}/g, fem(g) ? 'elle' : 'il').replace(/\{beau\}/g, fem(g) ? 'belle' : 'beau').replace(/\{E\}/g, cheffe() ? 'e' : '');
  }

  // ---------- conter fleurette ----------
  Am.add = function (g, n) {
    const avant = Am.stage(g); g.amour = clamp((g.amour || 0) + n, 0, 100); const apres = Am.stage(g);
    if (apres > avant) {
      const S = CG.S, R = CG.R, il = fem(g) ? 'Elle' : 'Il';
      G.banner('💘 ' + g.name + ' ' + (apres === 1 ? 'a le béguin pour toi' : apres === 2 ? 'est en amour avec toi' : (fem(g) ? 'est folle d\'amour pour toi' : 'est fou d\'amour pour toi')),
        apres === 1 ? 'De nouvelles discussions s\'ouvrent avec ' + (fem(g) ? 'elle' : 'lui') + '.' : apres === 2 ? il + ' travaille plus vite, et vous aurez 1 bébé de plus en fondant une famille.' : il + ' te laissera un cadeau chaque matin, et vous aurez 2 bébés de plus.', '#ffb0d0');
      G.addXp(apres * 5); S.morale = Math.min(100, S.morale + apres); CG.sfx('level'); g.emoteT = 2.5;
      for (let i = 0; i < 18; i++) { const a = Math.random() * 6.283, v = 40 + Math.random() * 90; R.parts.push({ x: g.x, y: g.y - 30, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 50, life: 1, max: 1, col: i % 2 ? '#ff7aa8' : '#ffd0e4', size: 3.5 }); }
      R.rings.push({ x: g.x, y: g.y - 10, r: 70, life: 0.6, col: '#ff9ac8' });
    }
    return apres;
  };
  Am.flirt = function (g) {
    const S = CG.S, R = CG.R, st = Am.stage(g);
    /* plus de limite d'un mot doux par jour (demande de Matthieu) : on peut lui en dire autant qu'on veut */
    if ((g.ami || 0) <= -2) return UI.dialog({ goblin: g, who: g.name, tag: '💢', text: 'Des mots doux ? Après ce que tu m\'as dit l\'autre jour ? Sois d\'abord gentil' + (cheffe() ? 'le' : '') + ' avec moi, chef.', options: [{ label: 'Je ferai mieux, promis.' }] });
    R.flirtSeen = R.flirtSeen || []; let pool = F.filter(f => f.s === st && !R.flirtSeen.includes(f)); if (!pool.length) { R.flirtSeen = R.flirtSeen.filter(f => f.s !== st); pool = F.filter(f => f.s === st); }
    const topic = pick(pool); R.flirtSeen.push(topic); const autres = S.goblins.filter(x => x !== g && x.met), autre = autres.length ? pick(autres).name : null;
    UI.dialog({ goblin: g, who: g.name, tag: '💗 mots doux', text: fillA(topic.t, g, autre), options: CG.shuffle(topic.o.slice()).map(o => ({ label: fillA(o[0], g, autre), fn: () => issue(g, o) })) });
  };
  function issue(g, o) {
    const S = CG.S, ps = G.perso(g); let v = o[1], rep = o[3] ? fillA(o[3], g) : null; g.flirtDay = S.day;
    if (v < 0) { // blessant : l'affection recule, et le moral aussi
      g.amour = clamp((g.amour || 0) - Am.RATE, 0, 100); Soc.react(g, -3, false, rep); G.text(g.x, g.y - 66, '💔', '#fff', true);
      UI.toast('💔 ' + g.name + ' a le cœur gros : affection ' + Math.round(g.amour) + ' / 100.'); return;
    }
    if (v === 0) { G.say(g, rep || 'Ah. Bon.', 4); if (Math.random() < 0.6) Soc.bystanders(g, 'fun'); UI.toast('😐 Ça tombe à plat : ' + g.name + ' attendait autre chose. (affection ' + Math.round(g.amour || 0) + ' / 100)'); return; }
    let n = Am.GAIN[v], sup = false; if (o[2] && o[2] === ps.aime) { n += Am.BONUS; sup = true; } else if (o[2] && o[2] === ps.hait) n = Math.round(n / 2);
    const avant = Am.stage(g), st = Am.add(g, n);
    g.ami = clamp((g.ami || 0) + 1, -6, 6); g.pep = Math.max(g.pep || 0, sup ? 45 : 30); G.addXp(2);
    G.text(g.x, g.y - 50, sup ? '💕✨' : '💗', '#fff', true); if (st === avant) CG.sfx('ok');
    G.say(g, rep || fillA(pick(OUI[st]), g), 4); Soc.bystanders(g, 'amour');
    UI.toast((sup ? '💕 En plein dans le mille' : '💗 ' + g.name + ' est touché' + (fem(g) ? 'e' : '')) + ' : affection +' + n + ' (' + Math.round(g.amour) + ' / 100)' + (o[2] === ps.hait ? '. Ce n\'est pas trop son genre de compliment.' : sup ? '. C\'est exactement ce qu\'' + (fem(g) ? 'elle' : 'il') + ' aime entendre.' : '.'));
  }

  // ---------- dans le menu de discussion : l'option, la jauge et l'accueil ----------
  let enCours = null;
  const tg0 = UI.talkGoblin; UI.talkGoblin = function (g) { enCours = g; try { return tg0.apply(this, arguments); } finally { enCours = null; } };
  const dl0 = UI.dialog; UI.dialog = function (o) {
    const menu = enCours; enCours = null; const g = (o && o.goblin) || null; /* la jauge se montre dans toutes les discussions avec lui, aussi autour du feu */
    if (g && Am.cible(g) && o.options && o.options.length > 1 && !/am-bar/.test(o.extra || '')) {
      const st = Am.stage(g), a = Math.round(g.amour || 0), R = CG.R, fait = g.flirtDay === CG.S.day;
      /* les mots doux se disent maintenant dans « Discuter », sans rien annoncer (discuter.js) */
      if (a > 0) {
        o.extra = (o.extra || '') + '<div class="am-bar"><span>' + (st ? '💗 ' + g.name.replace(/[<&>]/g, '') + ' ' + (st === 1 ? 'a le béguin pour toi' : st === 2 ? 'est en amour avec toi' : (fem(g) ? 'est folle d\'amour pour toi' : 'est fou d\'amour pour toi')) : '💗 Affection') + '</span><b><i style="width:' + a + '%"></i>' + Am.SEUILS.slice(0, 2).map(s => '<u style="left:' + s + '%"></u>').join('') + '</b><em>' + a + ' / 100</em></div>';
        if (menu === g && st && !R.alarm && !G.partyTime() && Math.random() < 0.6) o.text = fillA(pick(SALUT[st]), g);
      }
    }
    return dl0.call(this, o);
  };
  const css = document.createElement('style');
  css.textContent = '.am-bar{display:flex;align-items:center;gap:10px;margin:2px 0 10px;font-size:13px;color:#ffd0e4}.am-bar b{position:relative;flex:1;height:9px;border-radius:6px;background:rgba(0,0,0,.4);box-shadow:inset 0 0 0 1px rgba(255,160,200,.35);overflow:hidden;min-width:90px}.am-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:6px;background:linear-gradient(90deg,#ff7aa8,#ffb0d0)}.am-bar u{position:absolute;top:0;bottom:0;width:2px;background:rgba(255,255,255,.55)}.am-bar em{font-style:normal;opacity:.85;white-space:nowrap}';
  document.head.appendChild(css);

  // ---------- les effets : un gobelin en amour travaille plus vite, se fâche plus fort, et gâte son chef ----------
  const ws0 = G.workSpeed; G.workSpeed = g => ws0(g) * (g.amour >= 60 && Am.cible(g) ? Am.VITESSE[Am.stage(g)] : 1);
  const re0 = Soc.react; Soc.react = function (g, delta) { if (delta < 0 && g.amour > 0) g.amour = clamp(g.amour - 4, 0, 100); return re0.apply(this, arguments); }; // une méchanceté, même hors des mots doux, refroidit le cœur
  const ed0 = Soc.endDay; Soc.endDay = function (lines) {
    ed0.apply(this, arguments); const S = CG.S;
    S.goblins.forEach(g => {
      if (!Am.cible(g) || Am.stage(g) < 3) return;
      const c = pick([['food', CG.irand(5, 9), 'un panier de baies'], ['food', CG.irand(6, 10), 'une galette encore chaude'], ['or', CG.irand(6, 12), 'quelques pièces dans un mouchoir'], ['bois', CG.irand(6, 10), 'un fagot noué d\'un ruban']]);
      if (!S.res || S.res[c[0]] === undefined) return; G.gain(c[0], c[1]);
      lines.push('💝 ' + g.name + ' a laissé ' + c[2] + ' devant ta hutte : +' + c[1] + ' ' + CG.RES[c[0]].icon);
    });
  };
  // quand le chef passe tout près, les amoureux lui font un petit signe
  let tic = 0;
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); tic -= dt; if (tic > 0) return; tic = 0.6;
    const S = CG.S, R = CG.R; if (!S || R.alarm || R.cine || UI.modal || S.hour < 7 || R.ko > 0) return; const p = S.player;
    for (const g of S.goblins) {
      if (!(g.amour >= 25) || g.hidden || g.nap || g.alerte > 0 || !Am.cible(g)) continue; g.amCd = (g.amCd || 0) - 0.6;
      if (g.amCd > 0 || Math.hypot(g.x - p.x, g.y - p.y) > 110) continue; const st = Am.stage(g);
      g.amCd = 22 + Math.random() * 30; if (st < 2 && Math.random() < 0.5) continue;
      const m = pick(DOUX[st]); if (m.length <= 2) G.text(g.x, g.y - 62, m, '#fff'); else G.say(g, m, 2.4);
    }
  };

  // ---------- un petit cœur au-dessus de ceux qui sont épris, quand le chef est dans les parages ----------
  function coeur(c, x, y, s, col) { c.beginPath(); c.moveTo(x, y + s * 0.9); c.bezierCurveTo(x - s * 1.5, y - s * 0.2, x - s * 0.7, y - s * 1.2, x, y - s * 0.4); c.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.5, y - s * 0.2, x, y + s * 0.9); c.fillStyle = col; c.fill(); }
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (c, t) {
    mk0.apply(this, arguments); const S = CG.S; if (!S || CG.R.alarm) return; const p = S.player;
    for (const g of S.goblins) {
      if (!(g.amour >= 25) || g.hidden || g.nap || g.alerte > 0 || !CG.onScreen(g.x, g.y) || !Am.cible(g)) continue;
      const d = Math.hypot(g.x - p.x, g.y - p.y); if (d > 280) continue;
      const st = Am.stage(g), k = Math.min(1, (280 - d) / 90), pu = 1 + 0.14 * Math.sin(t * (4 + st) + g.id), y = g.y - 60 + Math.sin(t * 2.2 + g.id) * 2, x = g.x + 13;
      c.save(); c.globalAlpha = k * 0.95;
      coeur(c, x, y + 0.8, (3.6 + st * 0.9) * pu + 1.1, 'rgba(60,10,30,0.45)'); coeur(c, x, y, (3.6 + st * 0.9) * pu, st === 1 ? '#ff9ac8' : '#ff4f8a');
      if (st >= 2) coeur(c, x - 0.9, y - 0.9, 1.3, 'rgba(255,255,255,0.75)');
      if (st >= 3) { const a = t * 1.6 + g.id; coeur(c, x + 9 + Math.cos(a) * 2, y - 8 + Math.sin(a) * 2, 2.6, '#ffb0d0'); coeur(c, x - 7 + Math.sin(a) * 2, y - 11 + Math.cos(a) * 2, 2, '#ff7aa8'); }
      c.restore();
    }
  };
})(window.CG);
