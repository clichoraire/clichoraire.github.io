// Clan Gobelin — discussions : personnalités, sujets de conversation, chicanes et renvoi du clan.
'use strict';
(function (CG) {
  const G = CG.G, Soc = CG.Soc, pick = CG.pick, rand = CG.rand;

  // ---------- personnalités ----------
  // aime / hait : le ton qui marche le mieux ou qui tombe à plat
  //   g = gentil, rassurant · f = flatteur · b = blagueur · e = curieux, à l'écoute · s = sérieux, franc
  // dur : 'pleure' = se faire chicaner ne le fait pas travailler plus vite, 'long' = la chicane dure plus longtemps
  const P = CG.PERSO = {
    joyeux: { nom: 'Joyeux', nomF: 'Joyeuse', icon: '😄', aime: 'b', hait: 's', intro: "Tu verras, je ris tout le temps, même quand il pleut !",
      salut: ["Chef ! Quelle belle journée, hein ? Même les cailloux ont l'air contents !", "Hi hi ! Te voilà ! J'avais justement envie de rire avec quelqu'un."],
      oui: ["Ha ha ha ! Tu me fais trop rire, chef !", "Youpi ! Je vais sourire jusqu'à ce soir !", "Hi hi hi ! Encore, encore !"],
      bof: ["Oh là là, que c'est sérieux tout ça... Fais-moi rire, plutôt !", "Hmm. Tu parles comme un vieux hibou, chef."] },
    grognon: { nom: 'Grognon', nomF: 'Grognonne', icon: '😠', aime: 's', hait: 'b', dur: 'long', intro: "Je te préviens : je râle beaucoup, mais je fais le travail.",
      salut: ["Hmpf. C'est toi. Qu'est-ce qu'il y a encore ?", "Grmbl. Mes pieds sont mouillés et personne ne s'en soucie."],
      oui: ["Hmpf. ... C'est pas bête, ce que tu dis.", "Bon. Pour une fois, quelqu'un qui parle franchement.", "Grmbl... merci. Mais ne le répète pas."],
      bof: ["Les blagues, très peu pour moi.", "Ha. Ha. Très drôle. Non."] },
    timide: { nom: 'Timide', nomF: 'Timide', icon: '😳', aime: 'g', hait: 'b', dur: 'pleure', intro: "Excuse-moi si je parle tout bas... je suis un peu timide.",
      salut: ["Oh ! Euh... bonjour, chef. Tu... tu voulais me parler ? À moi ?", "... (rougit) ... Bonjour."],
      oui: ["Oh... merci, chef. (rougit jusqu'aux oreilles)", "C'est... c'est gentil. Vraiment.", "Je... je vais y repenser toute la journée."],
      bof: ["Tu... tu te moques de moi ? (baisse les yeux)", "Oh. Je ne sais jamais si tu blagues ou pas..."] },
    vantard: { nom: 'Vantard', nomF: 'Vantarde', icon: '😎', aime: 'f', hait: 'b', intro: "Entre nous, je suis probablement le meilleur gobelin que tu aies jamais vu.",
      salut: ["Ah, chef ! Tu viens admirer le meilleur du clan ? Je comprends.", "Tu as vu mes muscles aujourd'hui ? Regarde. Non, regarde mieux."],
      oui: ["Enfin quelqu'un qui reconnaît le talent !", "Je le savais. Mais ça fait plaisir de l'entendre.", "Tu as l'œil, chef. C'est pour ça que c'est toi le chef."],
      bof: ["Hé ! On ne rit pas de moi. Je suis une légende.", "Très drôle. Tu es jaloux, c'est tout."] },
    gourmand: { nom: 'Gourmand', nomF: 'Gourmande', icon: '🍖', aime: 'b', hait: 's', intro: "Et je te le dis tout de suite : je pense à manger du matin au soir.",
      salut: ["Chef ! Tu n'aurais pas un petit quelque chose à grignoter, par hasard ?", "Mon ventre gargouille. Il dit bonjour, lui aussi."],
      oui: ["Miam ! Ça me met en appétit, cette discussion !", "Hé hé ! Toi, tu me comprends.", "Je vais travailler fort, ça creuse... et après, on mange !"],
      bof: ["Bof. On ne parle pas de choses sérieuses le ventre vide.", "Mmmh ? Pardon, je pensais à un ragoût."] },
    paresseux: { nom: 'Paresseux', nomF: 'Paresseuse', icon: '😴', aime: 'g', hait: 's', dur: 'long', intro: "J'aime bien les siestes. Beaucoup. Peut-être un peu trop.",
      salut: ["Mmmh ? Oh, chef... je ne dormais pas. Je réfléchissais les yeux fermés.", "Baaaille... Il est déjà si tôt que ça ?"],
      oui: ["Ooooh, c'est doux à entendre. Presque autant qu'un oreiller.", "Merci, chef. Tu me donnes envie de... de faire un petit effort.", "D'accord, je m'y remets. Doucement, mais j'y vais."],
      bof: ["Pfff... rien que de t'écouter, je suis fatigué{e}.", "Trop de mots sérieux. J'ai besoin d'une sieste."] },
    reveur: { nom: 'Rêveur', nomF: 'Rêveuse', icon: '🌙', aime: 'e', hait: 's', intro: "Il paraît que j'ai toujours la tête dans les nuages. C'est vrai qu'on y est bien.",
      salut: ["Oh, chef... tu as vu ce nuage ? On dirait un dragon qui mange une tarte.", "Chut... écoute. Le vent raconte quelque chose."],
      oui: ["Tu vois les choses comme moi, chef. C'est rare.", "Oooh. Je vais y rêver toute la nuit.", "C'est beau, ce que tu dis. Je vais le garder dans ma tête."],
      bof: ["Tu es trop terre à terre, chef. Regarde un peu en haut.", "Ah... toi, tu ne rêves jamais, hein ?"] },
    peureux: { nom: 'Peureux', nomF: 'Peureuse', icon: '😨', aime: 'g', hait: 'b', dur: 'pleure', intro: "Je sursaute pour un rien, alors ne me fais pas peur, d'accord ?",
      salut: ["AH ! ... Oh, c'est toi, chef. Tu m'as fait peur.", "Chef ! Tu as entendu ce bruit ? Non ? Moi j'ai entendu un bruit."],
      oui: ["Ouf... ça me rassure. Merci, chef.", "Avec toi, j'ai un peu moins peur. Un peu.", "D'accord. Je respire. Tout va bien."],
      bof: ["C'est pas drôle ! J'ai le cœur qui bat tout croche !", "Ne blague pas avec ça, je ne dormirai plus !"] },
    farceur: { nom: 'Farceur', nomF: 'Farceuse', icon: '🤡', aime: 'b', hait: 's', intro: "Méfie-toi : j'adore jouer des tours. Vérifie tes bottes avant de les mettre.",
      salut: ["Chef ! Ne regarde pas dans ta hutte. Il n'y a AUCUNE grenouille dedans.", "Psst, chef. Tire sur mon doigt. ... Non ? Dommage."],
      oui: ["HA HA HA ! Celle-là, je la note !", "Hi hi ! Tu es presque aussi drôle que moi !", "Ho ho ! On devrait faire un spectacle, toi et moi."],
      bof: ["Oh, que tu es ennuyant quand tu fais le sérieux...", "Bâille. Réveille-moi quand tu auras une blague."] },
    curieux: { nom: 'Curieux', nomF: 'Curieuse', icon: '🧐', aime: 'e', hait: 'f', intro: "Je pose beaucoup de questions. Pourquoi ? Bonne question, justement.",
      salut: ["Chef ! Pourquoi l'herbe est verte comme nous ? On est cousins ?", "J'ai compté les fourmis ce matin. Il y en a plus que de gobelins. C'est louche."],
      oui: ["Oh ! Ça, c'est une bonne question ! Attends, je réfléchis...", "J'adore quand on cherche ensemble !", "Fascinant. Il faut que j'aille vérifier ça."],
      bof: ["Oui, oui, merci... mais tu ne réponds pas à ma question.", "Les compliments, ça ne m'apprend rien, chef."] },
    sage: { nom: 'Sage', nomF: 'Sage', icon: '🦉', aime: 's', hait: 'f', intro: "Les anciens disaient : écoute deux fois avant de parler une fois. J'essaie.",
      salut: ["Bonjour, chef. Celui qui marche lentement voit plus de champignons.", "Assieds-toi un instant. Le travail ne se sauvera pas."],
      oui: ["Bien parlé. Tu grandis en sagesse, chef.", "Voilà des paroles qui tiennent debout.", "Hmm. Oui. Je vais méditer là-dessus."],
      bof: ["La flatterie est un miel qui colle aux doigts, chef.", "Garde tes compliments pour ceux qui en ont besoin."] },
    coquet: { nom: 'Coquet', nomF: 'Coquette', icon: '💅', aime: 'f', hait: 'b', intro: "Je prends soin de moi : un gobelin propre, c'est un gobelin heureux.",
      salut: ["Chef ! Attention, ne marche pas là, je viens de cirer mes orteils.", "Tu trouves que ce vert me va bien ? C'est mon vert naturel."],
      oui: ["Oh, tu as remarqué ! Enfin quelqu'un de goût.", "Merci ! J'y ai mis toute la matinée.", "Je savais que cette plume ferait de l'effet."],
      bof: ["Ne te moque pas ! L'élégance, c'est sérieux.", "Hmpf. Toi, tu ne t'es même pas coiffé ce matin."] },
    bagarreur: { nom: 'Bagarreur', nomF: 'Bagarreuse', icon: '💪', aime: 's', hait: 'g', dur: 'long', intro: "Moi, j'aime la bagarre. Montre-moi un humain et je lui mords les genoux.",
      salut: ["Chef ! Y a personne à cogner aujourd'hui ? Je m'ennuie.", "Tu veux faire un bras de fer ? Allez ! Juste un !"],
      oui: ["Ouais ! Ça, c'est parler !", "Grrr ! Ça me donne envie de foncer !", "Compris, chef. Droit au but, comme j'aime."],
      bof: ["Hé, je ne suis pas un bébé, chef. Pas besoin de me cajoler.", "Beurk, c'est trop mielleux. Parle-moi franchement."] },
    bavard: { nom: 'Bavard', nomF: 'Bavarde', icon: '🗣️', aime: 'e', hait: 's', intro: "Je parle beaucoup. Vraiment beaucoup. D'ailleurs, est-ce que je t'ai raconté la fois où... non, plus tard.",
      salut: ["Chef ! Justement ! Il faut que je te raconte, tu ne devineras jamais ce que j'ai vu, attends, par où commencer...", "Ah, te voilà ! Alors, j'ai trois histoires, deux potins et une devinette."],
      oui: ["Ah ! Enfin quelqu'un qui écoute ! Alors, la suite...", "Tu veux tout savoir ? Tu es le meilleur chef du monde !", "Oh, j'en ai encore dix comme ça !"],
      bof: ["Oh. Tu veux déjà que j'arrête de parler, c'est ça ?", "C'est tout ? Mais je n'avais même pas commencé !"] }
  };
  const KEYS = Object.keys(P);
  G.perso = g => P[g.perso] || P[g.perso = pick(KEYS)];
  G.persoNom = g => { const p = G.perso(g); return p.icon + ' ' + (g.sex === 'f' ? p.nomF : p.nom); };
  const mb = G.makeBio; G.makeBio = function (g) { mb(g); g.perso = pick(KEYS); };
  const it = G.introText; G.introText = g => it(g) + ' ' + fillT(G.perso(g).intro, g);

  function fillT(s, g) {
    if (s.indexOf('{o}') >= 0) { const o = CG.S.goblins.filter(x => x !== g && x.met); s = s.replace(/\{o\}/g, o.length ? pick(o).name : 'le voisin'); }
    return s.replace(/\{n\}/g, g.name).replace(/\{e\}/g, g.sex === 'f' ? 'e' : '').replace(/\{il\}/g, g.sex === 'f' ? 'elle' : 'il');
  }

  // ---------- sujets de conversation ----------
  // { t: ce que dit le gobelin, p: personnalité, j: métier, w: 'soir', o: [[réponse du chef, effet, ton, réplique, suite]] }
  // effets : '+' il est content · '-' il est blessé · '0' rien, juste pour rire · '!' chicane (vexé mais 2× plus vite)
  const C = [
    // --- complètement anodin ---
    { t: "Chef, tu crois que les nuages ont un goût ?", o: [["Sûrement un goût de guimauve mouillée.", '+', 'b'], ["Bonne question. Toi, tu imagines quoi ?", '+', 'e', "Moi je dis : soupe froide. Avec un petit goût de pluie."], ["Non. Ce sont des nuages, c'est tout.", '0', 's', "Ah. Bon. Moi je dis quand même guimauve."], ["Quelle question idiote.", '-']] },
    { t: "J'ai trouvé un caillou qui ressemble à ton nez, chef. Regarde !", o: [["Ha ha ! C'est vrai qu'il est beau, ce caillou.", '+', 'b'], ["Garde-le précieusement, c'est un trésor.", '+', 'g'], ["Mon nez est beaucoup plus noble que ça.", '0', 'f', "Si tu le dis, chef. Moi je trouve qu'ils sont jumeaux."], ["Jette ça et retourne travailler.", '-']] },
    { t: "Chef, si tu étais un légume, tu serais lequel ?", o: [["Un navet. Costaud et un peu piquant.", '+', 'b'], ["Et toi ? Dis-moi d'abord ton légume.", '+', 'e', "Un champignon ! ... Ah non, ce n'est pas un légume. Une courge, alors."], ["Je ne suis pas un légume. Je suis le chef.", '0', 's', "Un chef-légume, alors. Un poireau, tiens."], ["Tu en es déjà un, toi.", '-']] },
    { t: "Tu préfères les baies rouges ou les baies bleues ?", o: [["Les rouges ! Elles tachent moins les doigts.", '0', 'b', "Les rouges ?! Hmm. Moi, les bleues. On peut quand même rester amis."], ["Les bleues, sans hésiter.", '0', 'b', "Ha ! Pareil comme moi ! On se comprend."], ["Les deux, dans la même bouchée.", '+', 'b'], ["Je préfère le silence.", '-']] },
    { t: "Chef, j'ai compté mes orteils ce matin. J'en ai sept. C'est normal ?", o: [["Parfaitement normal. Sept, c'est un chiffre chanceux.", '+', 'g'], ["Sept ! Tu dois courir plus vite que tout le monde.", '+', 'f'], ["Recompte. Tu sais compter jusqu'à combien ?", '0', 's', "Jusqu'à sept, justement. Après, je recommence."], ["Tu es bizarre. Éloigne-toi de moi.", '-']] },
    { t: "Cette nuit, j'ai rêvé que j'étais un oiseau. Je volais au-dessus du village !", o: [["Raconte ! On voyait quoi, d'en haut ?", '+', 'e', "Toutes les huttes, grosses comme des noisettes ! Et toi, tu me faisais coucou."], ["Tu aurais dû faire caca sur les humains.", '+', 'b'], ["Les gobelins ne volent pas. Garde les pieds sur terre.", '0', 's'], ["Tes rêves ne m'intéressent pas.", '-']] },
    { t: "Chef, pourquoi on est verts ?", o: [["Pour se cacher dans l'herbe. C'est très malin.", '+', 's'], ["Parce qu'on mange trop de salade.", '+', 'b'], ["Et toi, tu en penses quoi ?", '+', 'e', "Je pense qu'on a été peints par un géant. Il manquait de rouge."], ["Arrête avec tes questions bêtes.", '-']] },
    { t: "J'ai appris à siffler ! Écoute : ffff... ffffuit... pfff. Bon, presque.", o: [["Continue de t'exercer, ça s'en vient !", '+', 'g'], ["On dirait une marmite qui fuit. J'adore.", '+', 'b'], ["Tu as un talent caché, c'est sûr.", '+', 'f'], ["Arrête, tu me fais mal aux oreilles.", '-']] },
    { t: "Il y a une grenouille qui me suit depuis ce matin. Je l'ai appelée Capitaine.", o: [["Bienvenue dans le clan, Capitaine !", '+', 'b'], ["Elle a l'air de t'aimer. Prends-en soin.", '+', 'g'], ["Pourquoi Capitaine ?", '+', 'e', "Parce qu'elle a l'air de savoir où elle va. Pas comme moi."], ["On pourrait la mettre dans la soupe.", '-', '', "NON ! Pas Capitaine ! Viens, Capitaine, on s'en va."]] },
    { t: "Chef, c'est quoi ton moment préféré de la journée ?", o: [["Le soir, quand tout le clan danse autour du feu.", '+', 'g'], ["Quand je vous vois tous rentrer sains et saufs.", '+', 's'], ["Et le tien ?", '+', 'e', "Le matin ! Tout sent bon, et personne ne m'a encore rien demandé."], ["Quand tu arrêtes de parler.", '-']] },
    { t: "Tu savais que si on regarde le feu trop longtemps, on voit des petits bonshommes danser dedans ?", o: [["Je les vois aussi. Ils dansent mieux que nous.", '+', 'b'], ["Raconte-moi ce que tu vois exactement.", '+', 'e'], ["C'est juste tes yeux qui chauffent.", '0', 's', "Peut-être. Mais mes yeux ont beaucoup d'imagination."], ["Tu racontes n'importe quoi.", '-']] },
    { t: "Chef, j'ai perdu ma chaussette. Je n'en avais qu'une.", o: [["Je t'aiderai à la retrouver. Elle ne doit pas être loin.", '+', 'g'], ["Suis l'odeur, tu vas la retrouver vite.", '+', 'b'], ["Une seule chaussette, c'est déjà du luxe.", '0', 's', "Justement ! C'était MON luxe."], ["Je m'en fiche complètement.", '-']] },
    { t: "Je me demande ce que les poissons pensent de nous.", o: [["Ils pensent sûrement qu'on nage très mal.", '+', 'b'], ["Bonne question. Tu crois qu'ils nous regardent ?", '+', 'e', "Tout le temps ! Avec leurs gros yeux ronds. Ça me gêne un peu."], ["Les poissons ne pensent pas. Ils nagent.", '0', 's'], ["Et moi je me demande pourquoi tu ne travailles pas.", '!']] },
    { t: "Chef, j'ai inventé un mot : « flibouche ». Ça veut dire avoir sommeil et faim en même temps.", o: [["Alors je suis flibouche tous les soirs !", '+', 'b'], ["Excellent mot. Je l'ajoute au grimoire.", '+', 'f'], ["Et ça se dit comment, quand on a juste soif ?", '+', 'e', "Euh... « glouglotte » ! Je viens de l'inventer aussi."], ["C'est n'importe quoi.", '-']] },
    { t: "Regarde, chef ! J'arrive à me toucher le nez avec la langue.", o: [["Impressionnant ! Montre-moi encore.", '+', 'f'], ["Moi je me touche l'oreille. Regarde... presque.", '+', 'b'], ["Fascinant. À quoi ça sert ?", '0', 'e', "À rien ! C'est ça qui est beau."], ["Rentre ta langue, c'est dégoûtant.", '-']] },
    { t: "Hier, j'ai vu une étoile filer. J'ai fait un vœu, mais je ne peux pas le dire.", o: [["Garde-le bien, alors. Il se réalisera.", '+', 'g'], ["Je parie que c'était du ragoût.", '+', 'b', "... Comment tu as deviné ?!"], ["Allez, juste un indice ?", '+', 'e', "Bon... ça commence par un « v » et ça finit par « illage heureux »."], ["Les vœux, ça ne marche pas.", '-']] },
    { t: "Chef, j'ai un caillou dans ma botte depuis trois jours. Je m'y suis attaché.", o: [["Donne-lui un nom, tant qu'à faire.", '+', 'b', "Il s'appelle Roger. Il est discret, mais fidèle."], ["Enlève-le, tu vas te faire mal.", '+', 'g'], ["Trois jours ! Tu es plus endurant{e} que moi.", '+', 'f'], ["Tu es vraiment niaiseux.", '-']] },
    { t: "Tu penses qu'il y a d'autres villages de gobelins, loin, loin d'ici ?", o: [["Sûrement. Un jour, on ira leur dire bonjour.", '+', 'g'], ["Oui, mais le nôtre est le plus beau.", '+', 'f'], ["Toi, tu imagines qu'ils sont comment ?", '+', 'e', "Pareils comme nous, mais avec des chapeaux. De très grands chapeaux."], ["Occupe-toi de celui-ci, déjà.", '0', 's']] },
    { t: "J'ai essayé de parler à un écureuil. Il m'a lancé une noix.", o: [["C'est sa façon de dire bonjour.", '+', 'b'], ["Pauvre toi. Ça t'a fait mal ?", '+', 'g'], ["Tu lui avais dit quoi ?", '+', 'e', "Juste « belle queue ». Il l'a mal pris, je pense."], ["Il a bien fait.", '-']] },
    { t: "Chef, est-ce que je peux te montrer ma danse de la victoire ?", o: [["Vas-y, je regarde !", '+', 'e', "Hop ! Hop ! Et... tadaaa ! (manque de tomber)"], ["Seulement si je peux la danser avec toi.", '+', 'b'], ["Garde-la pour la fête de ce soir.", '0', 's', "D'accord... mais ce soir, tu regardes, hein ?"], ["Non. Tu danses comme une patate.", '-']] },
    { t: "Je crois que la lune nous suit. Hier, elle était encore là.", o: [["Elle veille sur le clan, comme moi.", '+', 'g'], ["Elle veut sûrement venir à la fête.", '+', 'b'], ["Tu l'observes souvent ?", '+', 'e', "Tous les soirs. Je lui raconte ma journée. Elle ne répond jamais, mais elle écoute bien."], ["La lune ne suit personne.", '0', 's']] },
    // --- la vie du clan ---
    { t: "Chef, comment tu trouves le village ces temps-ci ?", o: [["Il grandit bien, et c'est grâce à vous tous.", '+', 'g'], ["Il manque encore du travail, mais on est sur le bon chemin.", '+', 's'], ["Et toi, qu'est-ce que tu changerais ?", '+', 'e', "Moi ? Je mettrais des fleurs partout. Et une glissade."], ["Il serait mieux sans les paresseux comme toi.", '-']] },
    { t: "Est-ce que tu es fier de moi, chef ?", o: [["Très fier, {n}. Ne change rien.", '+', 'g'], ["Tu es parmi les meilleurs du clan.", '+', 'f'], ["Je le serai quand je te verrai suer un peu plus. Allez !", '!'], ["Fier de quoi, au juste ?", '-']] },
    { t: "Dis, chef... tu trouves que je sers à quelque chose ?", o: [["Bien sûr. Sans toi, le clan ne serait pas le même.", '+', 'g'], ["Chaque gobelin compte. Toi aussi.", '+', 's'], ["Pourquoi tu demandes ça ? Quelque chose te tracasse ?", '+', 'e', "Non, non... C'est juste que des fois, je me sens tout petit."], ["Franchement ? Non. Tu peux faire ton baluchon.", 'x']] },
    { t: "Je suis fatigué{e} aujourd'hui, chef. J'ai mal dormi.", o: [["Repose-toi un peu ce soir, tu l'as mérité.", '+', 'g'], ["{o} ronfle encore ? Je vais lui dire deux mots.", '+', 'b'], ["La fatigue, ça se soigne en travaillant. Allez, debout !", '!'], ["Ce n'est pas mon problème.", '-']] },
    { t: "Chef, je trouve que {o} travaille plus fort que moi. Ça me gêne.", o: [["Chacun son rythme. Tu fais ta part, et c'est bien.", '+', 'g'], ["Alors rattrape-le ! Montre-moi ce que tu as dans le ventre !", '!'], ["C'est honnête de le dire. Qu'est-ce qui te ralentit ?", '+', 'e', "Je pense que je rêvasse trop. Je vais faire attention."], ["Oui, tout le monde travaille plus fort que toi.", '-']] },
    { t: "J'ai une blague, chef ! Qu'est-ce qui est vert et qui monte et qui descend ?", o: [["Je ne sais pas. Dis-moi !", '+', 'e', "Un gobelin dans une balançoire ! HA HA HA !"], ["Un gobelin qui a le hoquet !", '+', 'b', "Oh ! La tienne est meilleure que la mienne !"], ["Je n'ai pas le temps pour les blagues.", '0', 's', "C'était un gobelin dans une balançoire. Tant pis pour toi."], ["Toi, quand je te botte le derrière.", '-']] },
    { t: "Chef, tu crois que les humains sont tous méchants ?", o: [["Non. Mais ceux qui viennent ici avec des épées, oui.", '+', 's'], ["Peu importe : tant que je suis là, ils ne te toucheront pas.", '+', 'g'], ["Toi, tu en penses quoi ?", '+', 'e', "Je pense qu'il y en a sûrement un gentil. Quelque part. Très loin."], ["Ils sont moins pires que toi.", '-']] },
    { t: "J'ai entendu dire que {o} a peur des papillons. C'est vrai ?", o: [["Chut ! On ne rit pas des peurs des autres.", '+', 's'], ["Ha ha ! Des papillons ! Pauvre {o}.", '+', 'b'], ["Qui t'a raconté ça ?", '+', 'e', "Une grenouille. Elles savent tout, les grenouilles."], ["Mêle-toi de tes affaires.", '-']] },
    { t: "Chef, est-ce qu'on pourrait avoir un jour de congé, des fois ?", o: [["La fête du soir, c'est fait pour ça. Profites-en bien !", '+', 'g'], ["Quand le village sera en sécurité, promis.", '+', 's'], ["Un congé ? Toi ? Tu es en congé depuis ta naissance ! Au travail !", '!'], ["Si tu veux un congé pour toujours, la forêt est par là.", 'x']] },
    { t: "Je me suis chicané{e} avec {o} ce matin. Pour une histoire de cuillère.", o: [["Allez vous faire un câlin. Une cuillère, ça ne vaut pas une amitié.", '+', 'g'], ["Raconte-moi. C'était la cuillère de qui ?", '+', 'e', "La mienne ! ... Ou la sienne. On ne sait plus. C'est ça le problème."], ["Une cuillère ! Je vais en faire tailler une deuxième.", '+', 's'], ["Vous êtes deux bébés.", '-']] },
    { t: "Chef, je peux te dire quelque chose ? Je suis content{e} d'être dans ce clan.", o: [["Et le clan est content de t'avoir, {n}.", '+', 'g'], ["Ça me touche. Merci de me le dire.", '+', 's'], ["Normal, c'est le meilleur clan du monde.", '+', 'b'], ["Ne t'habitue pas trop.", '-']] },
    { t: "Tu sais ce qui manque au village ? Une statue. De moi.", o: [["En or, avec un gros nez. J'y pense.", '+', 'b'], ["Tu la mériterais, c'est vrai.", '+', 'f'], ["On bâtira d'abord des huttes, ensuite on verra.", '0', 's', "Pfff. Des huttes. Toujours des huttes."], ["Une statue de paresseux, oui.", '-']] },
    { t: "Chef, j'ai marché dans quelque chose de mou. Je ne veux pas savoir ce que c'est.", o: [["Ça porte chance, à ce qu'on dit !", '+', 'b'], ["Va te rincer au bord de l'eau, ça va partir.", '+', 'g'], ["De quelle couleur ?", '+', 'e', "Brun. ... J'avais dit que je ne voulais pas savoir !"], ["Ne t'approche pas de moi.", '-']] },
    { t: "Est-ce que tu as déjà eu peur, toi, chef ?", o: [["Oui. Mais je pense à vous, et ça passe.", '+', 'g'], ["Tout le monde a peur. Le courage, c'est d'avancer quand même.", '+', 's'], ["Seulement des araignées. Ne le dis à personne.", '+', 'b'], ["Jamais. La peur, c'est pour les faibles comme toi.", '-']] },
    { t: "Chef ! J'ai trouvé un champignon bizarre. Je le mange ?", o: [["Non ! Montre-le d'abord à quelqu'un qui s'y connaît.", '+', 's'], ["Seulement s'il ne te regarde pas en retour.", '+', 'b'], ["Il est comment, ce champignon ?", '+', 'e', "Mauve, avec des pois. Et il sent les pieds. ... Bon, je vais le laisser là."], ["Oui, oui, mange-le. On verra bien.", '-', '', "... Tu veux te débarrasser de moi, c'est ça ?"]] },
    { t: "Dis, chef, c'était comment, quand tu étais petit ?", o: [["J'étais un vrai petit monstre. Demande aux anciens !", '+', 'b'], ["On avait faim souvent. C'est pour ça que je veux un beau village.", '+', 's'], ["Et toi ? Tu étais comment, petit{e} ?", '+', 'e', "J'avais les oreilles plus grandes que la tête. On m'appelait « la chauve-souris »."], ["Ça ne te regarde pas.", '-']] },
    { t: "Chef, sens-moi ça ! J'ai cuisiné une soupe aux orties et aux limaces.", o: [["Ça sent... puissant. Tu es un{e} vrai{e} chef cuisinier.", '+', 'f'], ["Garde-m'en un bol pour ce soir !", '+', 'g'], ["Ça sent les bottes de troll. J'en veux deux bols.", '+', 'b'], ["Beurk. Jette ça.", '-']] },
    { t: "Je pense que je grandis. Mon pantalon est plus court qu'hier.", o: [["Bientôt, tu seras plus grand{e} que moi !", '+', 'f'], ["Ou alors c'est ton pantalon qui rapetisse.", '+', 'b'], ["Tu l'as peut-être lavé à l'eau chaude ?", '0', 's', "Lavé ? ... Il faut laver les pantalons ?"], ["Tu grossis, c'est tout.", '-']] },
    { t: "Chef, si on gagnait beaucoup d'or, tu ferais quoi avec ?", o: [["Des huttes solides et de la bouffe pour tout le monde.", '+', 's'], ["Une fontaine de jus de baies, au milieu du village.", '+', 'b'], ["Toi, tu ferais quoi ?", '+', 'e', "J'achèterais un oreiller. Un vrai. Avec des plumes dedans."], ["Je le garderais pour moi tout seul.", '-']] },
    // --- suites en deux temps ---
    { t: "Chef... je peux te confier un secret ?", o: [["Bien sûr. Je sais garder un secret.", '0', '', '', { t: "C'est moi qui ai mangé la tarte aux baies qui refroidissait sur la fenêtre de {o}. Au complet.", o: [["Ton secret est en sécurité. Mais fais-lui-en une autre !", '+', 'g'], ["Ha ha ! Elle était bonne, au moins ?", '+', 'b', "Délicieuse. Je ne regrette presque rien."], ["Va t'excuser, et tout de suite.", '0', 's', "Oui, chef... Tu as raison. J'y vais. Bientôt."], ["Voleur ! Je vais le crier à tout le village !", '-']] }], ["Seulement s'il est croustillant.", '0', '', '', { t: "Très croustillant : je dors encore avec mon doudou. C'est un bout de couverture qui s'appelle Mimi.", o: [["Mimi fait partie du clan, alors.", '+', 'g'], ["Moi aussi, j'ai gardé le mien. Chut.", '+', 'b'], ["Ha ha ha ! Un doudou ! Tout le monde va le savoir !", '-']] }], ["Non, garde tes secrets.", '0', 's', "Oh. D'accord. Il était bon, pourtant."]] },
    { t: "Chef, devine ce que j'ai dans ma main !", o: [["Une baie ?", '0', '', '', { t: "Non ! C'est une coccinelle. Elle s'appelle Pois. Tu veux la tenir ?", o: [["Oui ! Viens ici, Pois.", '+', 'g'], ["Elle est magnifique. Tu as le tour avec les bêtes.", '+', 'f'], ["Non merci. Remets-la sur une feuille.", '0', 's'], ["(Tu souffles dessus, elle s'envole.)", '-', '', "POIS ! Reviens ! ... Pourquoi tu as fait ça ?"]] }], ["Un trésor ?", '0', '', '', { t: "Presque ! Une dent. La mienne. Elle est tombée ce matin !", o: [["Mets-la sous ton oreiller, on ne sait jamais.", '+', 'b'], ["Tu deviens grand{e}, {n} !", '+', 'g'], ["Beurk. Range ça.", '-']] }], ["Je n'ai pas le temps de jouer.", '-']] },
    { t: "Chef, je peux te poser une question gênante ?", o: [["Vas-y, je t'écoute.", '0', '', '', { t: "Est-ce que... est-ce que c'est vrai que tu parles tout seul dans ta hutte, la nuit ?", o: [["Je répète mes sorts. Enfin, c'est ce que je dis.", '+', 'b'], ["Oui. Je réfléchis à voix haute au bien du clan.", '+', 's'], ["Qui t'a dit ça ?", '+', 'e', "Personne ! ... Bon, j'écoutais à la porte. Un tout petit peu."], ["Espionner son chef ? Ça va te coûter cher. Au travail, et vite !", '!']] }], ["Non. Pas de questions gênantes.", '0', 's', "Dommage. Elle était vraiment gênante."]] },
    // --- selon la personnalité ---
    { p: 'joyeux', t: "Chef ! J'ai ri tellement fort ce matin que j'ai fait peur à un sanglier !", o: [["Garde ce rire-là pour les humains !", '+', 'b'], ["Ton rire fait du bien à tout le village.", '+', 'g'], ["Un peu de calme, quand même.", '0', 's'], ["Tu ris trop. C'est énervant.", '-']] },
    { p: 'joyeux', t: "Tu connais la chanson du gobelin content ? « Tralala, j'ai les pieds verts... »", o: [["« ...et le nez de travers ! » Je la connais !", '+', 'b'], ["Chante-la-moi au complet !", '+', 'e'], ["Tu la chanteras ce soir. Là, on travaille.", '0', 's'], ["Tais-toi donc.", '-']] },
    { p: 'grognon', t: "Le soleil tape trop fort. Et hier, il pleuvait trop. Rien ne va jamais.", o: [["Tu as raison. Je vais voir ce qu'on peut faire pour l'ombre.", '+', 's'], ["Au moins, toi, tu es constant{e}.", '0', 'b'], ["Pauvre petit chou. Tu veux un câlin ?", '0', 'g', "Un câlin ? ... Non. ... Peut-être plus tard. Ne le dis à personne."], ["Arrête de te plaindre, ou je te donne une vraie raison de râler.", '!']] },
    { p: 'grognon', t: "Qui a encore laissé traîner ses outils devant ma porte ? Hein ? QUI ?", o: [["Tu as raison d'être fâché{e}. Je vais régler ça.", '+', 's'], ["C'est le lutin des outils. Il est partout.", '0', 'b'], ["Qu'est-ce qui s'est passé, exactement ?", '+', 'e', "J'ai marché sur un marteau. Pieds nus. Deux fois."], ["C'est toi qui traînes partout.", '-']] },
    { p: 'timide', t: "Chef... est-ce que... non, rien. Laisse faire.", o: [["Prends ton temps. Je ne suis pas pressé.", '+', 'g', "Je... je voulais juste dire que tu es un bon chef. Voilà. C'est dit."], ["Allez, crache le morceau !", '0', 'b'], ["Parle plus fort, on ne t'entend jamais.", '-'], ["Si tu n'as rien à dire, va travailler. Et vite !", '!']] },
    { p: 'timide', t: "J'ai fait un dessin du village... mais il est laid. Ne le regarde pas.", o: [["Je suis sûr qu'il est beau. Montre-moi, s'il te plaît.", '+', 'g'], ["C'est une œuvre d'art ! Tu as du talent.", '+', 'f'], ["Ha ha ! C'est moi, la patate avec des bras ?", '0', 'b'], ["Tu as raison, il est laid.", '-']] },
    { p: 'vantard', t: "Hier, j'ai soulevé un rocher gros comme une hutte. Personne n'a vu, mais c'est vrai.", o: [["Je te crois. Tu es le plus fort du clan.", '+', 'f'], ["Gros comme une hutte ? Pas plutôt comme une noisette ?", '0', 'b'], ["Montre-moi ça au travail, alors.", '+', 's'], ["Menteur.", '-']] },
    { p: 'vantard', t: "Si j'étais chef à ta place, le village aurait déjà un château. Je dis ça de même.", o: [["Avec tes talents, c'est sûr. Aide-moi à y arriver !", '+', 'f'], ["Un château de sable, peut-être.", '0', 'b'], ["Tu veux ma place ? Prouve-le : cours, travaille, et on verra !", '!'], ["Si tu n'es pas content, va le bâtir ailleurs, ton château.", 'x']] },
    { p: 'gourmand', t: "Chef, j'ai une idée : et si on mangeait deux fois le soir ? Une fois avant la fête, une fois après.", o: [["Et une troisième pendant, pour être sûr.", '+', 'b'], ["Si la récolte est bonne, on verra !", '+', 'g'], ["Les réserves ne sont pas un jouet.", '0', 's'], ["Tu manges déjà pour trois.", '-']] },
    { p: 'gourmand', t: "Je sens une odeur de ragoût. Tu la sens ? Dis-moi que tu la sens.", o: [["Je la sens ! Suis ton nez, il ne ment jamais.", '+', 'b'], ["Tu as le meilleur nez du clan.", '+', 'f'], ["Le ragoût, ça se mérite. Va d'abord gagner ta part !", '!'], ["C'est tes pieds que tu sens.", '-']] },
    { p: 'paresseux', t: "Chef... tu crois qu'on pourrait travailler couchés ? J'ai des idées là-dessus.", o: [["Ha ha ! Repose-toi bien ce soir, tu travailleras mieux demain.", '+', 'g'], ["Explique-moi ton idée.", '+', 'e', "Un hamac... avec des roulettes. ... Je n'ai pas fini d'y penser."], ["Non. Debout. On travaille debout.", '0', 's'], ["Tu dors déjà debout ! Allez, secoue-toi, et plus vite que ça !", '!']] },
    { p: 'paresseux', t: "J'ai trouvé le coin de sieste parfait. Je te dis où si tu ne me chicanes pas.", o: [["Promis. C'est où ?", '+', 'g', "Derrière la réserve, là où le soleil tape l'après-midi. Chut."], ["Je vais y mettre un oreiller à ton nom.", '+', 'b'], ["La sieste, c'est après le travail.", '0', 's'], ["Encore une sieste et tu vas dormir dans la forêt. Pour toujours.", 'x']] },
    { p: 'reveur', t: "Chef, et si les étoiles étaient des feux de camp d'autres clans, très très loin ?", o: [["Alors ils dansent, eux aussi. Tu imagines ?", '+', 'e'], ["C'est une belle idée. Garde-la précieusement.", '+', 'g'], ["Ce sont des étoiles. Regarde plutôt où tu marches.", '0', 's'], ["Arrête de rêvasser.", '-']] },
    { p: 'reveur', t: "Je me demande où va le vent quand il a fini de souffler.", o: [["Et toi, tu penses qu'il va où ?", '+', 'e', "Je pense qu'il rentre dormir dans une grotte. Une grotte très bien aérée."], ["Il va se coucher dans tes oreilles.", '+', 'b'], ["Nulle part. Le vent, c'est de l'air.", '0', 's'], ["Et moi je me demande où va ton travail.", '!']] },
    { p: 'peureux', t: "Chef ! Il y avait une ombre derrière ma hutte ! Une GROSSE ombre !", o: [["Je vais aller voir. Reste près de moi, tu ne risques rien.", '+', 'g'], ["C'était sûrement la tienne.", '0', 'b'], ["On posera une torche là-bas. Fini, les ombres.", '+', 's'], ["BOUH !", '-', '', "AAAAH ! ... C'est pas drôle, chef ! Pas drôle du tout !"]] },
    { p: 'peureux', t: "Tu es sûr que les clôtures tiennent bon ? Vraiment sûr ? Sûr sûr ?", o: [["Sûr sûr. Et je monte la garde moi-même.", '+', 'g'], ["On les renforcera encore. Tu as raison d'y penser.", '+', 's'], ["Elles tiennent... à peu près.", '0', 'b'], ["Si tu as peur, cache-toi et arrête de chialer.", '-']] },
    { p: 'farceur', t: "Chef, j'ai mis une limace dans le lit de {o}. Tu ne diras rien, hein ?", o: [["Ha ha ha ! Je veux voir sa tête !", '+', 'b'], ["Juste une ? Petit joueur.", '+', 'b'], ["Va l'enlever. On ne joue pas avec le sommeil des autres.", '0', 's'], ["Tu fais des niaiseries pendant que les autres travaillent ? File !", '!']] },
    { p: 'farceur', t: "Toc toc !", o: [["Qui est là ?", '+', 'e', "Gobe. — Gobe qui ? — Gobe-lin, voyons ! HA HA HA !"], ["Entrez, mais essuyez vos pieds.", '+', 'b'], ["Je n'ai pas le temps pour ça.", '0', 's'], ["Va-t'en.", '-']] },
    { p: 'curieux', t: "Chef, comment ça marche, ton grimoire ? Les mots restent collés dedans tout seuls ?", o: [["Bonne question ! Viens, je vais t'expliquer.", '+', 'e'], ["C'est de l'encre, de la patience et un peu de magie.", '+', 's'], ["Tu es brillant{e} de te demander ça.", '0', 'f'], ["Ne touche jamais à mon grimoire.", '-']] },
    { p: 'curieux', t: "Pourquoi le feu monte et que l'eau descend ? J'y pense depuis hier.", o: [["Et tu en es arrivé{e} à quoi ?", '+', 'e', "Je pense que le feu veut rejoindre le soleil, et que l'eau veut rejoindre la mer. Chacun sa famille."], ["Parce que le feu est pressé et que l'eau est paresseuse.", '+', 'b'], ["C'est comme ça. Il ne faut pas tout comprendre.", '0', 's', "Mais si ! Justement, il faut !"], ["Tu penses trop et tu travailles pas assez. Allez !", '!']] },
    { p: 'sage', t: "Un vieux gobelin disait : « La hutte se bâtit une branche à la fois. » Qu'en penses-tu ?", o: [["Il avait raison. La patience bâtit les villages.", '+', 's'], ["Tu as connu ce vieux gobelin ?", '+', 'e'], ["Il devait être lent en titi.", '+', 'b'], ["Les vieux gobelins radotent.", '-']] },
    { p: 'sage', t: "Tu as l'air préoccupé, chef. Un chef qui porte tout seul finit par plier.", o: [["Tu as raison. Je devrais m'appuyer plus sur vous tous.", '+', 's'], ["Merci de t'en soucier. Ça me fait du bien.", '+', 'g'], ["Tu es le plus sage de nous tous.", '0', 'f'], ["Occupe-toi de tes oignons.", '-']] },
    { p: 'coquet', t: "Chef, sois honnête : ma nouvelle coiffure, tu en penses quoi ?", o: [["Superbe ! Tout le clan va vouloir la même.", '+', 'f'], ["On dirait un nid d'oiseau. Un beau nid.", '0', 'b'], ["Elle te va bien. Tu l'as faite comment ?", '+', 'e', "Avec de la boue, trois brindilles et beaucoup d'amour."], ["Tu perds ton temps à te pomponner. Au travail !", '!']] },
    { p: 'coquet', t: "Je me suis fait un collier avec des dents de lapin. C'est chic, non ?", o: [["Très chic. Tu as un goût exquis.", '+', 'f'], ["Tu m'en fais un pareil ?", '+', 'g'], ["Les lapins, eux, le trouvent moins drôle.", '0', 'b'], ["C'est laid.", '-']] },
    { p: 'bagarreur', t: "Chef ! Quand est-ce qu'ils reviennent, les humains ? J'ai les poings qui piquent !", o: [["Bientôt. Garde ta force, on en aura besoin.", '+', 's'], ["Avec toi devant, ils vont repartir en pleurant.", '+', 'f'], ["Calme-toi, mon petit. Tout va bien.", '0', 'g'], ["Tu te sauverais comme les autres.", '-']] },
    { p: 'bagarreur', t: "J'ai donné un coup de tête à un arbre. L'arbre a gagné. Pour l'instant.", o: [["La prochaine fois, prends une hache. C'est un conseil.", '+', 's'], ["L'arbre a eu de la chance.", '+', 'f'], ["Pauvre toi, tu as une bosse ? Viens que je regarde.", '0', 'g'], ["Ça explique bien des choses.", '-']] },
    { p: 'bavard', t: "Alors là, chef, tu ne me croiras pas, mais {o} a dit à quelqu'un qui me l'a dit que... tu m'écoutes ?", o: [["Je t'écoute ! Continue, c'est passionnant.", '+', 'e'], ["Attends, je vais chercher un banc. Ça va être long ?", '+', 'b'], ["Résume. En trois mots.", '0', 's'], ["Non. Tu parles trop. Tais-toi et travaille, et vite !", '!']] },
    { p: 'bavard', t: "Tu veux connaître les potins du village ? J'en ai des frais de ce matin.", o: [["Vas-y, raconte tout !", '+', 'e', "Il paraît que {o} parle en dormant. Et que ça parle de fromage."], ["Juste le plus juteux, alors.", '+', 'b', "Quelqu'un a vu le chef danser tout seul derrière sa hutte. ... Oups."], ["Les potins, ça fait du tort. Garde-les pour toi.", '0', 's'], ["Tu es une vraie pie.", '-']] },
    // --- selon le métier ---
    { j: 'aucun', t: "Chef, tu as vu mon dernier coup de marteau ? Droit comme une flèche. Presque.", o: [["Du beau travail. Le village tient debout grâce à vous.", '+', 'f'], ["Et tes doigts, ils vont bien ?", '+', 'b', "Il m'en reste assez pour compter jusqu'à huit."], ["Qu'est-ce que tu aimerais bâtir, toi ?", '+', 'e', "Une tour ! Très haute. Pour voir si la mer existe."], ["J'ai vu des castors faire mieux.", '-']] },
    { j: 'cueilleur', t: "Les buissons sont pleins aujourd'hui. J'ai les doigts tout mauves !", o: [["Bravo ! Le clan va bien manger ce soir.", '+', 'g'], ["Tes doigts ou ta bouche ? Montre ta langue.", '+', 'b', "Aaah... (elle est mauve aussi) ... C'était pour goûter. Par sécurité."], ["Tu as trouvé un bon coin ?", '+', 'e'], ["Alors pourquoi ton panier est vide ? Remplis-le, et que ça saute !", '!']] },
    { j: 'chasseur', t: "J'ai suivi une piste toute la matinée. C'était la mienne. J'ai tourné en rond.", o: [["Ha ha ! Au moins, tu t'es retrouvé{e}.", '+', 'b'], ["Ça arrive aux meilleurs. Tu auras plus de chance tantôt.", '+', 'g'], ["Apprends à lire les traces, ça t'évitera ça.", '+', 's'], ["Quel chasseur pitoyable.", '-']] },
    { j: 'bucheron', t: "Chef, des fois, je m'excuse à l'arbre avant de le couper. C'est niaiseux ?", o: [["Pas du tout. C'est respectueux.", '+', 'g'], ["Et lui, il te répond quoi ?", '+', 'b', "« Aïe. » La plupart du temps."], ["Tant que tu le coupes quand même, ça me va.", '+', 's'], ["Oui, c'est niaiseux.", '-']] },
    { j: 'mineur', t: "Au fond de la mine, j'ai entendu un toc-toc. Qui cogne dans la roche, chef ?", o: [["C'est l'écho de ta pioche. Rien de plus.", '+', 's'], ["C'est le minerai qui veut sortir. Va lui ouvrir !", '+', 'b'], ["N'aie pas peur. Si ça recommence, viens me chercher.", '+', 'g'], ["C'est un monstre. Il aime les petits mineurs.", '-']] },
    { j: 'forgeron', t: "Regarde cette lame, chef. Je l'ai battue cent fois. Bon, quatre-vingt-dix-neuf.", o: [["Elle est magnifique. Tu as des mains en or.", '+', 'f'], ["La centième, c'est pour la chance. Vas-y !", '+', 'b'], ["C'est du solide. Les gardes vont être contents.", '+', 's'], ["Elle est toute croche.", '-']] },
    { j: 'arcier', t: "J'ai testé mon nouvel arc. La flèche est partie... je ne sais pas où. Si quelqu'un crie, c'est moi.", o: [["Ha ha ! On va dire aux autres de baisser la tête.", '+', 'b'], ["L'arc a l'air puissant, en tout cas !", '+', 'f'], ["Teste-les loin des huttes, la prochaine fois.", '+', 's'], ["Tu es un danger public.", '-']] },
    { j: 'tanneur', t: "Chef, sois franc : est-ce que je pue ?", o: [["Tu sens le travail bien fait.", '+', 'g'], ["Un peu. Mais c'est l'odeur du métier.", '+', 's'], ["Les mouches t'adorent, en tout cas.", '+', 'b'], ["Oui. Reste dans le vent, loin de moi.", '-']] },
    { j: 'garde', t: "Rien à signaler, chef. Sauf un lapin suspect. Je l'ai à l'œil.", o: [["Bon réflexe. On n'est jamais trop prudent.", '+', 's'], ["Avec toi à la garde, je dors tranquille.", '+', 'f'], ["Suspect comment ?", '+', 'e', "Il me fixait. Sans cligner des yeux. Les lapins honnêtes clignent."], ["Tu surveilles des lapins pendant que les humains approchent ? Ouvre l'œil, et bouge !", '!']] },
    // --- le soir, autour du feu ---
    { w: 'soir', t: "Quelle fête, chef ! Tu danses avec nous, ou tu as les pieds en bois ?", o: [["Regarde-moi bien aller !", '+', 'b'], ["Je préfère vous regarder. Vous êtes beaux à voir.", '+', 'g'], ["Un chef ne danse pas. Il surveille.", '0', 's'], ["Vous faites trop de bruit.", '-']] },
    { w: 'soir', t: "Hic ! Le jus de baies est fort, ce soir. Tu en veux une gorgée ?", o: [["Juste une. ... Ouf ! Ça réveille !", '+', 'b'], ["Garde-le, tu l'as bien mérité.", '+', 'g'], ["Qui l'a préparé ?", '+', 'e', "Personne ne le sait. C'est ça qui est inquiétant. Hic !"], ["Tu bois trop.", '-']] },
    { w: 'soir', t: "J'aime ça, le soir. On oublie les humains, les monstres... on est juste bien.", o: [["C'est pour des soirs comme ça que je me bats.", '+', 's'], ["Profites-en, {n}. Tu as bien travaillé.", '+', 'g'], ["Et le tambour couvre les ronflements de {o}.", '+', 'b'], ["Ne t'habitue pas. Demain, c'est le travail.", '-']] },
    { w: 'soir', t: "Chef, viens voir ! J'ai fait griller une guimauve de champignon. Elle a pris en feu.", o: [["C'est comme ça qu'elles sont les meilleures !", '+', 'b'], ["Fais attention à tes doigts.", '+', 'g'], ["Bien grillée, bien dorée. Tu as le tour.", '+', 'f'], ["Tu gaspilles la nourriture.", '-']] }
  ];
  const SCOLD = ["Bon, assez jasé. Au travail, et plus vite que ça !", "C'est bien beau tout ça, mais je te paie pas à rien faire. Grouille !", "Moins de paroles, plus de sueur. File !", "Tu parles, tu parles... Montre-moi plutôt comment tu cours !"];
  const BANISH = ["Tu sais quoi ? Fais ton baluchon. Tu quittes le clan.", "J'en ai assez de toi. Tu n'as plus ta place ici.", "Le clan n'a pas besoin de toi. Va-t'en."];
  const PLEAD = ["Quoi ?! Chef... tu es sérieux ? Où est-ce que j'irais ? Je n'ai que ce clan...", "Me... me renvoyer ? Mais j'ai rien fait de mal ! S'il te plaît, chef...", "Tu veux que je parte ? Pour vrai ? ... Dis-moi que c'est une blague."];
  const ADIEU = ["Adieu, chef. Je pensais que tu étais différent.", "D'accord. Je m'en vais. Prenez soin de vous...", "Vous me manquerez tous. Même toi, chef.", "Snif... Je ne me retournerai pas."];
  const NEUTRE = ["Ah. Bon.", "Hmm. Si tu le dis, chef.", "Ha ! D'accord, d'accord.", "Ouais... je vais y penser.", "Hé hé. Bon, je retourne à mes affaires.", "Tu es drôle, des fois, chef.", "Oh. Je ne l'avais pas vu de même.", "Bon ! Sur ce, bonne journée."];
  const SNIF = ["Snif... pourquoi tu cries après moi ?", "(les yeux pleins d'eau) Je... je fais de mon mieux...", "Ouin... J'ai les jambes molles, je peux plus bouger."];
  const P0 = Soc.POOL;
  P0.GOOD.push("Hé hé ! Ça, ça me fait plaisir.", "Tu sais parler aux gobelins, toi.", "Oh ! Merci, chef. Je me sens pousser des ailes.", "Ça valait la peine de se lever ce matin !", "Je vais travailler en sifflant.", "T'es correct, chef. Vraiment correct.");
  P0.BAD.push("... Wow. D'accord.", "Ça, c'était méchant.", "Tu parles de même à tout le monde ?", "Hmpf. Bonne journée quand même.", "Snif.", "Je pensais qu'on était amis.", "Aïe. Ça, ça fait plus mal qu'un coup de bâton.");
  P0.VEXED.push("Oh, tu vas voir ! Tu vas voir de quoi je suis capable !", "Grrr... Tasse-toi, j'ai du travail !", "C'est beau, c'est beau, j'y vais !", "Paresseux, moi ? Compte bien ce que je rapporte !", "Hmpf ! Je cours, je cours !");
  P0.WATCH.bad.push(["Oh non, il a pas dit ça...", 0], ["Ha ha ha ! Dans les dents !", 1], ["Ouf. Je suis content que ce soit pas moi.", 0], ["Hi hi... oups, pardon.", 1], ["Le chef s'est levé du mauvais pied.", 0], ["🙈", 0], ["Chut, chut, fais semblant de travailler.", 0]);
  P0.WATCH.good.push(["Oh, moi aussi je veux jaser avec le chef !", 0], ["Hi hi, ils sont drôles.", 1], ["On a un bon chef, pareil.", 0], ["😊", 0], ["Ha ha ! Elle est bonne !", 1], ["C'est beau, l'amitié.", 0]);
  P0.WATCH.boost.push(["Ouille ! Vite, vite, je me cache.", 0], ["Ha ha ! Regarde-le filer !", 1], ["Moi, je travaillais déjà, hein, chef !", 0], ["Hi hi ! Ça chauffe !", 1]);
  P0.WATCH.fun = [["Ha ha !", 1], ["Hi hi hi !", 1], ["De quoi ils parlent ?", 0], ["Ils sont bizarres, ces deux-là.", 0], ["😄", 1], ["Moi je dis que c'est une bonne question.", 0], ["Pfff !", 1]];
  P0.WATCH.choc = [["Quoi ?! Il renvoie {n} ?", 0], ["Oh non... {n} !", 0], ["😱", 0], ["Chef, non !", 0], ["Ça pourrait être moi demain...", 0], ["Pauvre {n}...", 0], ["😢", 0]];

  // ---------- la discussion ----------
  function topicFor(g) {
    const R = CG.R, soir = G.partyTime(), pool = [];
    C.forEach((c, i) => {
      if (c.p && c.p !== g.perso) return; if (c.j && c.j !== g.job) return; if (c.w ? !soir : false) return;
      const w = c.p ? 5 : c.j ? 3 : c.w ? 6 : 1; for (let k = 0; k < w; k++) pool.push(i);
    });
    R.chatSeen = R.chatSeen || [];
    let fresh = pool.filter(i => !R.chatSeen.includes(i)); if (!fresh.length) { R.chatSeen = []; fresh = pool; }
    const i = pick(fresh); R.chatSeen.push(i); if (R.chatSeen.length > 45) R.chatSeen.shift(); return C[i];
  }
  Soc.chat = function (g, topic) {
    const S = CG.S, ps = G.perso(g), first = !topic; topic = topic || topicFor(g);
    const opts = CG.shuffle(topic.o.slice()).map(o => ({ label: fillT(o[0], g), fn: () => o[4] ? Soc.chat(g, o[4]) : outcome(g, o) }));
    if (first) { // des choix qui s'ajoutent au hasard : chicaner, ou carrément renvoyer du clan
      if (!topic.o.some(o => o[1] === '!') && Math.random() < 0.3) opts.push({ label: '😤 ' + pick(SCOLD), fn: () => outcome(g, ['', '!']) });
      if (!topic.o.some(o => o[1] === 'x') && Math.random() < 0.1) opts.push({ label: '🚪 ' + pick(BANISH), fn: () => outcome(g, ['', 'x']) });
    }
    CG.UI.dialog({ goblin: g, who: g.name, tag: G.persoNom(g) + ' · discussion', text: fillT(topic.t, g), options: opts });
  };
  function outcome(g, o) {
    const S = CG.S, ps = G.perso(g); let eff = o[1], tone = o[2], rep = o[3] ? fillT(o[3], g) : null, sup = false;
    if (eff === '+' && tone && tone === ps.hait) { eff = '0'; rep = fillT(pick(ps.bof), g); }
    else if (eff === '+' && tone === ps.aime) sup = true;
    else if (eff === '0' && tone && tone === ps.aime) { eff = '+'; rep = null; }
    else if (eff === '0' && tone && tone === ps.hait && !rep) rep = fillT(pick(ps.bof), g);
    if (eff === 'x') return banish(g);
    if (eff === '-') return Soc.react(g, -3, false, rep);
    if (eff === '!') {
      if (ps.dur === 'pleure') { // trop sensible : il fige au lieu de courir
        S.morale = CG.clamp(S.morale - 3, 0, 100); g.ami = CG.clamp((g.ami || 0) - 2, -6, 6); G.text(g.x, g.y - 50, '😢', '#fff', true); CG.sfx('no');
        G.say(g, pick(SNIF), 4); Soc.bystanders(g, 'bad'); CG.UI.toast('😢 ' + g.name + ' est trop sensible pour se faire chicaner : moral -3, et ' + (g.sex === 'f' ? 'elle' : 'il') + ' ne travaille pas plus vite.'); return;
      }
      Soc.react(g, -2, true, rep); if (ps.dur === 'long') g.boost = 45; return;
    }
    if (eff === '0') { G.say(g, rep || pick(NEUTRE), 4); if (Math.random() < 0.6) Soc.bystanders(g, 'fun'); return; }
    // content : un peu de moral (une fois par jour et par gobelin) et il travaille plus vite pendant 30 s
    const firstToday = g.chatDay !== S.day, m = firstToday ? (sup ? 3 : 2) : 0, dur = sup ? 45 : 30; g.chatDay = S.day;
    S.morale = CG.clamp(S.morale + m, 0, 100); g.ami = CG.clamp((g.ami || 0) + (sup ? 2 : 1), -6, 6); g.pep = Math.max(g.pep || 0, dur);
    if (firstToday) G.addXp(2);
    G.text(g.x, g.y - 50, sup ? '❤️✨' : '❤️', '#fff', true); CG.sfx('ok');
    G.say(g, rep || (sup || Math.random() < 0.5 ? fillT(pick(ps.oui), g) : pick(P0.GOOD)), 4); Soc.bystanders(g, 'good');
    CG.UI.toast((sup ? '🤩 Tu as trouvé les mots parfaits pour ' + g.name : '😄 ' + g.name + ' est content' + (g.sex === 'f' ? 'e' : '')) + (m ? ' : moral +' + m : '') + ', et ' + (g.sex === 'f' ? 'elle' : 'il') + ' travaille plus vite pendant ' + dur + ' s.' + (firstToday ? '' : ' (Vous avez déjà jasé aujourd\'hui : pas de moral en plus.)'));
  }

  // ---------- renvoyer quelqu'un du clan ----------
  function banish(g) {
    const S = CG.S;
    if (S.goblins.length <= 3 || g.child) return Soc.react(g, -4, false, g.child ? "Papa... tu ne dirais jamais ça pour vrai, hein ?" : "On est déjà presque plus personne, chef... Tu ne peux pas faire ça.");
    CG.UI.dialog({ goblin: g, who: g.name, tag: '⚠ renvoi du clan', text: pick(PLEAD), options: [
      { label: '🚪 Oui. Prends tes affaires et pars.', sub: 'Définitif : ' + g.name + ' quitte le clan pour toujours. Moral -6.', fn: () => exile(g) },
      { label: 'Non... reste. J\'ai parlé trop vite.', sub: 'Il reste, mais il s\'en souviendra.', fn: () => Soc.react(g, -2, false, "Tu m'as fait une de ces peurs, chef... Ne me refais jamais ça.") }] });
  }
  function exile(g) {
    const S = CG.S; G.resetGoblin(g); g.exile = { t: 12 }; g.ask = null; g.path = null;
    S.morale = CG.clamp(S.morale - 6, 0, 100); S.goblins.forEach(o => { if (o !== g && o.home === g.home) o.ami = CG.clamp((o.ami || 0) - 1, -6, 6); });
    for (let i = 0; i < 14 && !(g.path && g.path.length); i++) { const a = Math.random() * 6.283, d = rand(380, 560); G.goTo(g, g.x + Math.cos(a) * d, g.y + Math.sin(a) * d); }
    G.say(g, pick(ADIEU), 4.5); Soc.bystanders(g, 'choc'); CG.sfx('no');
    CG.UI.toast('🚪 Tu as renvoyé ' + g.name + ' du clan. Le village est sous le choc : moral -6.');
  }
  G.exileStep = function (g, dt) {
    const S = CG.S; g.exile.t -= dt; g.bubble = '😢'; g.pose = null;
    const there = !g.path || !g.path.length || G.follow(g, 120, dt);
    if (g.exile.t > 0 && !(there && g.exile.t < 9)) return;
    const i = S.goblins.indexOf(g); if (i < 0) return;
    G.resetGoblin(g); S.goblins.splice(i, 1); g.dead = true; if (CG.R.talking === g) CG.UI.close();
    G.puff(g.x, g.y - 14, '#cfd8c0', 14, 80, 4); G.text(g.x, g.y - 50, '🚶 ' + g.name + ' a quitté le clan', '#d8d0c0', true);
    if (CG.R.dayStats) (CG.R.dayStats.partis = CG.R.dayStats.partis || []).push(g.name);
  };

  // ---------- encore plus de questions de villageois (certaines complètement anodines) ----------
  Soc.Q.push(
    ["Chef, tu préfères les champignons ou les baies ?", ["Les champignons, bien grillés.", 0, 0, "Les champignons ! Je le savais. Tu as une tête à champignons."], ["Les baies, bien mûres.", 0, 0, "Les baies ! Moi aussi. On est pareils, toi et moi."], ["Ce que TOI tu rapportes, c'est toujours le meilleur.", 2], ["Je préfère que tu me laisses tranquille.", -3]],
    ["Chef, il est quelle heure ?", ["L'heure d'être content d'être en vie !", 2], ["Regarde le soleil, il te le dira.", 0, 0, "Il ne dit rien, le soleil. Il chauffe, c'est tout."], ["L'heure de travailler. Et tu es en retard : cours !", -2, 'boost'], ["L'heure de te taire.", -3]],
    ["Chef, tu peux me gratter le dos ? Je n'arrive pas à atteindre.", ["Tourne-toi. ... Là ?", 2, 0, "Plus haut... à gauche... AAAH oui. Tu es le meilleur chef du monde."], ["Frotte-toi sur un arbre, comme les ours.", 0, 0, "Bonne idée ! ... Pas un arbre à épines, par contre. J'ai déjà essayé."], ["Je ne suis pas ton serviteur.", -3]],
    ["Chef, comment on fait les bébés gobelins ?", ["Euh... ils poussent dans les choux. Les gros choux verts.", 0, 0, "Ah ! C'est pour ça qu'on est verts ! Tout s'explique."], ["Demande à ta mère.", 0, 0, "Elle m'a dit de te le demander à toi."], ["Quand deux gobelins s'aiment beaucoup, ils dansent autour du feu... et voilà.", 2], ["Quelle question niaiseuse.", -3]],
    ["Chef ! J'ai éternué et un oiseau m'a répondu. Tu crois qu'on se comprend ?", ["Sûrement. Tu lui as peut-être dit bonjour.", 2], ["Ou tu l'as insulté. Méfie-toi.", 0, 0, "Oh non. Il m'a regardé de travers, justement."], ["Tu perds ton temps avec des oiseaux ? Au travail, et vite !", -2, 'boost'], ["Tu es complètement fêlé.", -3]],
    ["Est-ce que tu trouves que j'ai de belles oreilles, chef ?", ["Les plus belles du clan. Bien pointues.", 3], ["Elles sont... grandes. Très grandes.", 0, 0, "C'est pour mieux t'entendre, chef !"], ["On dirait deux feuilles de chou.", -3]],
    ["Chef, je m'ennuie.", ["Viens, je vais te montrer quelque chose d'amusant.", 2], ["Compte les brins d'herbe. Tu me diras combien.", 0, 0, "Un... deux... trois... Ça va être long."], ["Tu t'ennuies ? J'ai justement une montagne de travail pour toi. File !", -2, 'boost'], ["Et moi, tu m'ennuies.", -4]],
    ["Chef, c'est vrai que tu sais lire ?", ["Oui. Si tu veux, je t'apprendrai quelques lettres.", 3], ["Oui. C'est pour ça que c'est moi qui tiens le grimoire.", 0, 0, "Wow. Et les petits dessins, ça parle pour vrai ?"], ["Évidemment. Pas comme vous autres, bande d'ignorants.", -4]],
    ["J'ai trouvé une plume géante ! Tu crois que c'est une plume de dragon ?", ["Garde-la ! Elle porte sûrement bonheur.", 2], ["Les dragons n'ont pas de plumes. C'est un très gros poulet.", 0, 0, "Un poulet géant ?! C'est encore plus épeurant !"], ["Tu ramasses des plumes au lieu de travailler ? Allez, grouille !", -2, 'boost'], ["Jette ça, c'est sale.", -3]],
    ["Chef, tu peux garder mon caillou chanceux pendant que je travaille ?", ["Avec honneur. Je le surveille comme un trésor.", 3], ["Mets-le dans ta poche, il te portera chance.", 1], ["(Tu le lances dans le bois.)", -5]],
    ["Dis, chef, est-ce que je peux t'appeler « grand chef » ?", ["Seulement si moi, je t'appelle « grand{e} {n} ».", 3], ["« Chef », c'est en masse.", 0, 0, "D'accord, chef en masse !"], ["Tu peux m'appeler « Votre Grandeur », et te mettre à genoux.", -3]],
    ["Chef, j'ai mal au ventre. J'ai mangé onze champignons.", ["Va t'étendre à l'ombre, ça va passer.", 2], ["Le douzième t'aurait achevé{e}.", 0, 0, "C'est ce que je me suis dit ! J'ai de la retenue."], ["Onze ! Et il en reste pour les autres ? Va en chercher d'autres, et au pas de course !", -2, 'boost'], ["Bien fait pour toi, goinfre.", -3]],
    ["Est-ce que le clan va m'oublier, si un jour je ne suis plus là ?", ["Jamais. Chaque gobelin laisse sa trace ici.", 3], ["On gravera ton nom sur la grande hutte.", 2], ["On t'a déjà oublié{e}. C'est quoi, ton nom ?", -5]],
    ["Chef, il y a un papillon sur ta tête.", ["Laisse-le. Il a bon goût.", 2], ["Ne bouge pas... il me porte chance.", 0, 0, "Il vient de faire caca. Je pense que c'est encore de la chance."], ["Et tu me déranges pour ça ?!", -3]],
    ["On a trouvé des traces bizarres près de l'eau. Tu penses que c'est quoi ?", ["Je vais aller voir. Merci de m'avoir averti.", 3], ["Sûrement un gros raton. Rien de grave.", 1], ["C'est le monstre mangeur de gobelins curieux.", -3]],
    ["Chef, je peux avoir un nouveau nom ? Je voudrais m'appeler « Tonnerre ».", ["Tonnerre {n}, ça sonne fort ! Adopté.", 2], ["Ton nom est très beau comme il est.", 2], ["Tonnerre ? Toi ? Plutôt « Petite Brise ».", 0, 0, "Petite Brise... C'est pas pire, finalement."], ["Tu t'appelles « Toi-là », et c'est tout.", -4]],
    ["Chef, ça te dérange si je chante en travaillant ?", ["Pas du tout ! Ça donne du cœur à tout le monde.", 3], ["Seulement si tu chantes juste.", 0, 0, "Juste... juste un peu faux, mettons."], ["Oui. Ta voix me donne mal aux dents.", -3]],
    ["Les autres disent que je parle en dormant. C'est vrai, chef ?", ["Tu disais « encore du ragoût ». C'était mignon.", 2], ["Je ne sais pas, moi je dors, la nuit.", 0, 0, "Bon point."], ["Oui, et tu dis des niaiseries, comme le jour.", -3]]
  );

  // quelques répliques de plus quand on leur parle
  const L = CG.LINES;
  L.aucun.push("J'ai trois clous dans la bouche, alors je parle peu.", "Dis-moi quoi bâtir, et recule-toi un peu.", "Bricoler, c'est comme cuisiner, mais avec plus d'échardes.");
  L.cueilleur.push("Il y a un buisson qui me griffe chaque fois. Je pense qu'il m'en veut.", "Les meilleures baies sont toujours tout au fond, évidemment.", "Je connais chaque buisson par son petit nom.");
  L.chasseur.push("Chut ! ... Non, c'était juste mon ventre.", "Un bon chasseur est patient. Moi, j'essaie.", "J'ai vu un lapin gros comme ça ! ... Bon, comme ça.");
  L.bucheron.push("J'ai des copeaux jusque dans les oreilles.", "Celui-là, il m'a donné du fil à retordre.", "Une bûche pour la hutte, une bûche pour le feu.");
  L.mineur.push("Il fait noir là-dedans, mais on s'habitue.", "J'ai de la poussière jusque dans le nez.", "Toc, toc, toc. Toute la journée.");
  L.forgeron.push("Attention, c'est chaud ! ... Tout est chaud, ici.", "Mes sourcils ont encore brûlé. Ça repousse.", "Le marteau, c'est le prolongement de mon bras.");
  L.arcier.push("Tends la corde... doucement... voilà.", "Un arc, c'est comme un gobelin : il faut qu'il plie sans casser.", "J'ai encore de la colle sur les doigts.");
  L.tanneur.push("Le cuir, plus tu le bats, plus il est doux.", "Ne respire pas trop fort ici, c'est un conseil.", "Je couds serré : ça doit arrêter une flèche.");
  L.garde.push("J'ai l'œil ouvert. Les deux, même.", "Personne ne passe. Sauf toi. Et les autres gobelins. Et les marchands.", "Mon épée s'ennuie, chef.");
  L.soir.push("Danse, chef, danse !", "Ce feu-là, on doit le voir jusqu'à la lune.", "Encore une chanson ! Encore une !", "J'ai mal aux pieds, mais je m'en fiche.");
  L.peur.push("Ils arrivent ! Ils arrivent !", "Je savais que c'était une mauvaise journée !", "Où est ma cachette ?!");
  L.faim.push("On mange quand, chef ? Mon ventre fait des bruits d'ours.", "J'ai rêvé d'un ragoût. Je me suis réveillé{e} en mordant ma couverture.".replace('{e}', ''));
})(window.CG);
