// Goblin Malin — une troupe d'humains de passage : certains matins, un gros campement se dresse à l'orée de la carte.
// Ils ne viennent pas pour nous : ils veulent seulement traverser le village. Le chef peut dire oui, non, ou oui à une condition
// (de l'or, des vivres, du bois...). Le capitaine accepte ou refuse selon son humeur et l'estime qu'il a pour le chef :
// elle se gagne en discutant avec lui, en répondant ce qu'il aime entendre (l'Œil de vérité montre ses goûts).
// Si le chef ne va pas au campement, le capitaine vient lui-même demander le passage : on peut encore lui parler, mais moins.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, UI = CG.UI, Art = CG.Art, T = CG.TILE, Ar = CG.Armee = { CHANCE: 0.16, JOUR: 4, ECART: 3, SUJETS: 7, SUJETS_VILLAGE: 3, MAX_VILLAGE: 55 };
  const rand = CG.rand, pick = CG.pick, dist = CG.dist, clamp = CG.clamp, TAU = Math.PI * 2;
  // ce que le capitaine aime (ou déteste) entendre
  const TR = { h: ['🛡️', 'l\'honneur'], f: ['💪', 'la force'], r: ['🦊', 'la ruse'], b: ['💚', 'la bonté'], j: ['😄', 'l\'humour'], v: ['🎯', 'la franchise'] };
  const NOMS = ['Aldric', 'Bertrand', 'Godefroy', 'Hugues', 'Roland', 'Thibaut', 'Gauvain', 'Armand', 'Isaure', 'Mathilde', 'Brunehaut', 'Clotilde'];
  const HISTOIRES = [
    'Nous venons de Roc-Gris, une forteresse du nord tombée le mois dernier. Nous marchons vers le sud rejoindre ce qu\'il reste de l\'armée.',
    'Nous escortons la solde du roi jusqu\'à la côte. Trois semaines de marche, et tes bois sont le chemin le plus court.',
    'Une fièvre a pris notre ville. Ceux que tu vois sont ceux qui tiennent debout. Nous cherchons des terres saines, loin d\'ici.',
    'On nous a envoyés chasser des brigands. Ils ont filé par ta forêt il y a deux jours. Nous les suivons, rien de plus.',
    'La guerre est finie, pour nous. Mes soldats rentrent chez eux, de l\'autre côté de ces bois. Certains n\'ont pas vu leur famille depuis quatre ans.',
    'Notre seigneur nous a congédiés sans un sou. Nous allons vendre nos épées à l\'est, là où on paie encore les soldats.',
    'Un pont s\'est effondré derrière nous. Il ne nous reste que ta forêt pour passer : crois-moi, je m\'en serais passé aussi.'];
  // les sujets : ce que dit le capitaine, puis les réponses possibles [texte, trait]
  const SUJETS = [
    ['D\'où viens-tu, chef gobelin ? On ne naît pas chef, que je sache.', ['J\'ai pris ma place à coups de massue. Les anciens chefs ne se plaignent plus.', 'f'], ['Mon clan mourait de faim. Je l\'ai nourri, il m\'a suivi.', 'b'], ['J\'ai fait croire que j\'étais le plus fort. Personne n\'a vérifié.', 'r'], ['D\'un œuf, comme tout le monde. Un gros.', 'j']],
    ['Avant d\'être chef, tu faisais quoi ?', ['Je pillais des fermes. J\'étais doué, et je n\'en suis pas fier.', 'v'], ['Je soignais les blessés du clan avec des feuilles et de la bave.', 'b'], ['Je gardais l\'entrée de la grotte. Personne n\'est jamais passé.', 'h'], ['Je volais les œufs des autres clans pendant qu\'ils dormaient.', 'r']],
    ['Tu sais ce que c\'est, toi, perdre sa maison ?', ['Oui. Des humains ont brûlé la mienne. Je ne t\'en veux pas, à toi.', 'b'], ['Une maison, ça se reprend. Par les armes.', 'f'], ['Dis-moi d\'abord qui t\'a pris la tienne, et je te dirai si je compatis.', 'v'], ['Tu avais des murs en pierre et tu les as perdus ? Il te fallait des gobelins.', 'j']],
    ['Une guerre se prépare au sud. Qu\'en penses-tu ?', ['La guerre, c\'est le métier des braves. Que ton bras soit ferme.', 'f'], ['Vos guerres tuent surtout ceux qui n\'ont rien demandé.', 'b'], ['Tant que vous vous battez entre vous, vous nous laissez tranquilles.', 'v'], ['Une guerre ? Parfait. Le prix du minerai va monter.', 'r']],
    ['Mes hommes ont peur de vous. On raconte que les gobelins mangent les enfants. C\'est vrai ?', ['Seulement ceux qui ne finissent pas leur soupe.', 'j'], ['Non. On mange des baies, du sanglier, et parfois nos bottes.', 'v'], ['Laisse-les le croire. La peur garde mieux qu\'une palissade.', 'r'], ['Mes gobelins ont des enfants aussi. Personne ne mange personne.', 'b']],
    ['Pourquoi ne nous as-tu pas attaqués en voyant nos tentes ?', ['On n\'attaque pas quelqu\'un qui dort. Ça ne se fait pas.', 'h'], ['J\'ai compté tes soldats. Je sais compter.', 'v'], ['J\'attendais de voir ce que vous aviez dans vos coffres.', 'r'], ['Vous aviez l\'air épuisés. On ne frappe pas un homme épuisé.', 'b']],
    ['Tu as une famille, chef ?', ['Tout le clan est ma famille. Même ceux qui ronflent.', 'b'], ['Une famille, ça rend faible. Moi, j\'ai des guerriers.', 'f'], ['Dix-sept cousins, et aucun ne me doit d\'argent. Un miracle.', 'j'], ['Oui. Et je ferais n\'importe quoi pour elle. Souviens-t\'en.', 'h']],
    ['Si je te donnais ma parole de ne rien toucher dans ton village, tu me croirais ?', ['Une parole donnée vaut plus qu\'un mur. Je te crois.', 'h'], ['Je te croirai quand tu seras ressorti de l\'autre côté.', 'v'], ['Je te crois. Mais mes gardes te regarderont quand même.', 'r'], ['Ta parole, plus un sac de grain. Les deux ensemble, c\'est plus solide.', 'j']],
    ['Un de mes soldats a volé une poule dans une ferme, hier. Que ferais-tu à ma place ?', ['Il rembourse la poule et il s\'excuse. Devant tout le monde.', 'h'], ['Dix coups de bâton. Les autres comprendront.', 'f'], ['Il avait faim ? Alors c\'est toi qui le nourris mal.', 'v'], ['Je lui demanderais s\'il reste une cuisse.', 'j']],
    ['Je me bats depuis vingt ans. Parfois je ne sais plus pourquoi. Toi, tu sais pourquoi tu te bats ?', ['Pour que mes gobelins dorment sans avoir peur.', 'b'], ['Parce que je gagne.', 'f'], ['Pas toujours, moi non plus. Je le dis rarement.', 'v'], ['Pour avoir la plus grosse hutte. C\'est déjà fait.', 'j']],
    ['On a croisé un portail étrange, au nord. Des choses rouges en sortent. Tu connais ?', ['Des démons. Ne campez pas près de lui : je te préviens parce que c\'est juste.', 'h'], ['J\'en tue chaque semaine. Ça met en appétit.', 'f'], ['Oui. Si tu veux, je te vends le chemin qui l\'évite.', 'r'], ['Ce sont mes cousins, du côté de ma mère. Très collants.', 'j']],
    ['Mon roi dit que les gobelins sont des bêtes. Je te parle, et j\'en doute. Que devrais-je lui dire ?', ['La vérité : qu\'on n\'est ni meilleurs ni pires que vous.', 'v'], ['Dis-lui qu\'un gobelin t\'a laissé passer en paix.', 'b'], ['Ne lui dis rien. Un roi qui nous sous-estime nous arrange.', 'r'], ['Dis-lui qu\'on sent meilleur que ses chevaux.', 'j']],
    ['Tu connais les étoiles ? La nuit, je montre le Chasseur à mes jeunes recrues.', ['Chez nous, c\'est le Grand Gobelin. Il tient une louche.', 'j'], ['Je regarde le ciel avec les petits du clan. Ça les endort.', 'b'], ['Les étoiles, ça sert à marcher la nuit sans être vu.', 'r'], ['Non. Apprends-moi : je n\'ai pas honte de ne pas savoir.', 'v']],
    ['Que vaut un chef qui recule ?', ['Rien. Un chef tient, ou il tombe.', 'f'], ['Autant qu\'un chef qui ramène tout son monde vivant.', 'b'], ['Reculer pour revenir par-derrière, c\'est tout un art.', 'r'], ['Ça dépend : avait-il promis de tenir ?', 'h']],
    ['Mes hommes n\'ont pas mangé chaud depuis quatre jours.', ['Assieds-les près de mon feu, ce soir. On partagera.', 'b'], ['Un soldat qui a faim se bat mal. Tu devrais le savoir.', 'v'], ['J\'ai de la soupe. Elle n\'est pas gratuite, mais elle est chaude.', 'r'], ['Quatre jours ? Mes gobelins pleurent au bout de quatre heures.', 'j']],
    ['Chez nous, on se serre la main pour sceller un accord. Et chez vous ?', ['On se crache dans la paume d\'abord. Tu veux essayer ?', 'j'], ['On se regarde dans les yeux. Celui qui ment cligne.', 'h'], ['On ne scelle rien. On voit qui tient parole, et on s\'en souvient.', 'v'], ['On partage un repas. Après ça, on ne peut plus se trahir.', 'b']],
    ['J\'ai perdu mon frère contre des gobelins, il y a longtemps. Pas ton clan. Mais j\'y pense en te regardant.', ['Je suis désolé pour ton frère. Vraiment.', 'b'], ['Moi, j\'ai perdu les miens contre des humains. Je ne te mentirai pas : ça ne s\'oublie pas.', 'v'], ['S\'il s\'est battu jusqu\'au bout, il est tombé en brave.', 'h'], ['Alors tu sais ce que valent les gobelins au combat.', 'f']],
    ['On raconte que tu fais de la magie. C\'est rare, chez les tiens.', ['J\'ai appris seul, dans des parchemins volés.', 'r'], ['Je m\'en sers pour soigner et protéger. Rarement pour brûler.', 'b'], ['Tu veux que je te montre ? Ne bouge surtout pas.', 'f'], ['Je peux faire grossir une tête. La tienne, par exemple.', 'j']],
    ['Si mes soldats et tes gobelins se battaient maintenant, qui gagnerait ?', ['Toi, sans doute. Mais tu repartirais avec la moitié de tes hommes.', 'v'], ['Moi. Et sans même me lever.', 'f'], ['Personne. C\'est bien pour ça qu\'on parle.', 'b'], ['Mes gobelins : ils connaissent tous les trous du terrain.', 'r']],
    ['Je dois des comptes à un seigneur qui ne s\'est jamais battu. Et toi, tu as quelqu\'un au-dessus de toi ?', ['Non. Et je ne plierai le genou devant personne.', 'f'], ['Mon clan. C\'est à lui que je rends des comptes.', 'h'], ['Ma grand-mère. Elle est terrible.', 'j'], ['Un chef qui ne se bat pas ne mérite pas qu\'on lui obéisse. Je te le dis en face.', 'v']],
    ['Que ferais-tu d\'un coffre plein d\'or ?', ['Des huttes solides, et de quoi manger tout l\'hiver.', 'b'], ['Des épées. Beaucoup d\'épées.', 'f'], ['Je le cacherais, et je dirais à tout le monde qu\'il est vide.', 'r'], ['Je me roulerais dedans. Ensuite seulement, je réfléchirais.', 'j']],
    ['J\'ai une jeune recrue qui tremble avant chaque combat. Comment fais-tu, toi, avec les peureux ?', ['Je me bats devant lui. Le courage, ça s\'attrape.', 'h'], ['Je lui donne un autre métier. Tout le monde n\'est pas fait pour la garde.', 'b'], ['Avoir peur, c\'est normal. Je le lui dis, c\'est tout.', 'v'], ['Je lui dis que l\'ennemi a encore plus peur. Même quand c\'est faux.', 'r']],
    ['Tes huttes sont en paille. Un seul de mes archers, avec une flèche enflammée...', ['Essaie. Tu verras ce qui sort des huttes.', 'f'], ['C\'est vrai. On y travaille. Merci de ne pas le faire.', 'v'], ['Elles ont l\'air en paille. C\'est voulu.', 'r'], ['Si tu brûles ma hutte, tu me dois une hutte. C\'est la règle.', 'j']],
    ['Mon père disait : « Un ennemi qui te nourrit n\'est plus un ennemi. » Le tien, il disait quoi ?', ['« Ne frappe jamais le premier, mais frappe toujours le dernier. »', 'h'], ['« Garde la soupe pour les tiens, et partage ce qui reste. »', 'b'], ['« Mange vite, on ne sait jamais. »', 'j'], ['« Souris-leur, et compte leurs épées. »', 'r']],
    ['Si je te mentais en ce moment, tu le saurais ?', ['Non. Mais je le saurais après, et je m\'en souviendrais longtemps.', 'v'], ['Oui. Tu te grattes le nez quand tu mens.', 'j'], ['Je pars du principe que tout le monde ment. Ça évite les surprises.', 'r'], ['Je préfère croire qu\'un capitaine ne s\'abaisse pas à ça.', 'h']],
    ['Combien es-tu prêt à perdre pour ton clan ?', ['Tout. C\'est ça, être chef.', 'h'], ['Rien : je m\'arrange pour que ce soit l\'autre qui perde.', 'r'], ['Mon repos, ma part de soupe, mon sang. Dans cet ordre.', 'b'], ['Je ne perds pas.', 'f']],
    ['On a trouvé un louveteau blessé sur la route. Mes hommes veulent le garder. Mauvaise idée ?', ['Gardez-le. Nous, on a apprivoisé pire.', 'b'], ['Un loup, ça se dresse pour la guerre. Belle prise.', 'f'], ['Il vous mordra un jour. Mieux vaut le savoir avant.', 'v'], ['Donne-le-moi : je te le revends dressé dans un an.', 'r']],
    ['As-tu déjà fait une promesse que tu n\'as pas tenue ?', ['Oui. Une. J\'y pense encore.', 'v'], ['Jamais. C\'est pour ça que je promets peu.', 'h'], ['J\'ai promis de ne plus manger de champignons bizarres. Trois fois.', 'j'], ['Ça dépend de ce qu\'on appelle une promesse.', 'r']],
    ['Regarde mes hommes. Tu vois quoi ?', ['Des gens fatigués qui veulent rentrer chez eux.', 'b'], ['Des soldats bien tenus. Tu les commandes bien.', 'h'], ['Douze épées, quatre arcs, et un cuisinier qui boite.', 'r'], ['Des casseroles sur pattes.', 'j']],
    ['On m\'a offert de l\'or pour raser un village comme le tien. J\'ai refusé. Je me demande encore si j\'ai été sot.', ['Tu as été droit. Ça vaut plus que l\'or.', 'h'], ['Tu as bien fait, pour une raison simple : tu aurais perdu.', 'f'], ['Merci. De la part de ce village-là, où qu\'il soit.', 'b'], ['Combien ? ... Par simple curiosité.', 'j']],
    ['Chez nous, le plus vieux parle en premier. Et chez vous ?', ['Le plus fort.', 'f'], ['Celui qui a faim. Donc tout le monde en même temps.', 'j'], ['Celui qui a quelque chose à dire. C\'est rare.', 'v'], ['Les anciens. Ils se sont battus pour qu\'on soit là.', 'h']],
    ['Crois-tu qu\'un jour, humains et gobelins vivront en paix ?', ['Aujourd\'hui, toi et moi, on y arrive. C\'est un début.', 'b'], ['Non. Mais on peut se respecter entre deux batailles.', 'v'], ['La paix dure tant que chacun y gagne. Arrangeons-nous pour y gagner.', 'r'], ['Seulement si on est assez forts pour qu\'on nous la demande.', 'f']],
    ['Qu\'est-ce qui te fait rire, chef ?', ['Un gobelin qui glisse dans la boue. Ça marche à tous les coups.', 'j'], ['Les petits du clan, quand ils imitent ma voix.', 'b'], ['Un ennemi qui croit m\'avoir eu.', 'r'], ['Pas grand-chose. Je n\'ai pas le temps.', 'f']],
    ['Nous repartirons, quoi que tu décides. Comment voudrais-tu que je me souvienne de toi ?', ['Comme d\'un chef qui tient parole.', 'h'], ['Comme de celui qu\'il ne fallait pas chercher.', 'f'], ['Comme d\'un ami, si c\'est possible.', 'b'], ['Comme du gobelin qui t\'a dit la vérité en face.', 'v']],
    ['Tes gobelins dansent autour d\'un feu chaque soir, m\'a-t-on dit. Pourquoi ?', ['Parce qu\'on est encore vivants. Ça se fête.', 'v'], ['Pour que les petits s\'endorment le cœur content.', 'b'], ['Pour que l\'ennemi nous croie plus nombreux.', 'r'], ['Parce que personne n\'a encore inventé mieux à faire le soir.', 'j']],
    ['J\'ai un vieux sergent qui ne peut plus se battre. Mes officiers veulent le renvoyer. Toi, que ferais-tu ?', ['Il a servi : on le garde, on le nourrit. C\'est une dette.', 'h'], ['Je lui donnerais les jeunes à former. Ce qu\'il sait vaut dix épées.', 'r'], ['Un soldat qui ne se bat plus n\'est plus un soldat.', 'f'], ['Chez nous, les vieux gardent la soupe. C\'est le poste le plus envié.', 'j']],
    ['On dit que les gobelins ne savent pas lire. Tu sais lire, toi ?', ['Les parchemins, oui. Le reste, je fais semblant.', 'v'], ['Assez pour lire un contrat avant de le signer.', 'r'], ['Je lis dans les yeux. C\'est plus utile.', 'h'], ['Je sais lire « danger », « miam » et « pas toucher ». Ça suffit à vivre vieux.', 'j']],
    ['Mes éclaireurs ont vu des bêtes énormes dans tes bois. Comment vivez-vous au milieu de ça ?', ['On les chasse. Ou on les apprivoise. Parfois les deux.', 'f'], ['On leur laisse leur coin, elles nous laissent le nôtre.', 'b'], ['On les laisse manger les voyageurs. Ça fait moins de visites.', 'j'], ['Mal, certains jours. J\'ai perdu de bons gobelins.', 'v']]
  ];
  const REAC = {
    bon: { h: ['Voilà qui est dit comme un homme d\'honneur... enfin, un gobelin d\'honneur.', 'Bien répondu. Je n\'en attendais pas tant.'], f: ['Ha ! Tu as du cran. J\'aime ça.', 'Voilà une réponse de guerrier.'], r: ['Malin. Très malin. Je m\'en souviendrai.', 'Tu ferais un fameux intendant, toi.'], b: ['... Tu as bon cœur. Je ne pensais pas dire ça à un gobelin.', 'C\'est une belle réponse. Mes hommes devraient l\'entendre.'], j: ['Ha ha ha ! Par ma barbe, tu es drôle !', 'Pff... ha ha ! Je ne devrais pas rire, mais c\'est plus fort que moi.'], v: ['Au moins, tu ne me racontes pas d\'histoires. Merci.', 'C\'est franc. J\'en ai peu, des gens francs.'] },
    mal: { h: ['L\'honneur, toujours l\'honneur... J\'ai enterré trop de gens honorables.', 'De belles paroles. J\'en ai entendu d\'autres.'], f: ['Des menaces ? Garde-les pour ceux que ça impressionne.', 'Toujours frapper... C\'est tout ce que tu sais faire ?'], r: ['Hmm. Tu calcules trop. Ça ne me plaît pas.', 'Je me méfie des gens trop malins.'], b: ['Tu es bien tendre pour un chef. Trop.', 'De la douceur... Ça ne nourrit pas une armée.'], j: ['Je te parle sérieusement, et tu plaisantes.', 'Ce n\'est pas le moment de faire le pitre.'], v: ['Tu pourrais y mettre les formes.', 'Toute vérité n\'est pas bonne à jeter à la figure.'] },
    bof: ['Hmm. Si tu le dis.', 'Ah. Bon.', 'Je vois.', 'Curieuse réponse.', 'Soit.', 'Chacun sa façon de voir.', 'Je n\'y avais pas pensé comme ça.']
  };
  const HUMEURS = [['😠', 'furieux'], ['😒', 'agacé'], ['😐', 'réservé'], ['🙂', 'détendu'], ['😄', 'de bonne humeur']];
  const ESTIMES = ['glaciale', 'méfiante', 'polie', 'cordiale', 'amicale', 'fraternelle'];
  const RES = { or: ['or', 1], food: ['food', 1.5], bois: ['bois', 1.2], minerai: ['minerai', 0.7], cuir: ['cuir', 0.45] };
  const TAILLES = [['Un petit quelque chose', 0.5, 15], ['Un prix honnête', 1, 42], ['Le prix fort', 1.9, 72]];

  const A = () => { const S = CG.S; return S && S.armee && S.armee.day === S.day && !S.armee.fait ? S.armee : null; };
  const cap = () => CG.R.armee && CG.R.armee.cap;
  const estimeMot = a => ESTIMES[clamp(Math.floor(a.estime / 17), 0, 5)];
  const voit = () => !!G.seeApt();
  const gouts = a => 'aime ' + a.aime.map(k => TR[k][0] + ' ' + TR[k][1]).join(' et ') + ' · déteste ' + TR[a.deteste][0] + ' ' + TR[a.deteste][1];
  const tag = a => HUMEURS[a.humeur + 2][0] + ' ' + HUMEURS[a.humeur + 2][1] + ' · estime ' + estimeMot(a) + (voit() ? ' (' + Math.round(a.estime) + ')' : '');
  const quantite = (res, k) => Math.max(3, Math.round((16 + CG.S.day * 3) * RES[res][1] * k / 5) * 5);

  // ---------- trouver où camper, et dresser le camp ----------
  function lieu() {
    const S = CG.S, f = W.field();
    for (let k = 0; k < 300; k++) {
      const cote = k % 4, tx = cote === 0 ? CG.irand(8, 12) : cote === 1 ? CG.irand(CG.MW - 13, CG.MW - 9) : CG.irand(14, CG.MW - 15), ty = cote === 2 ? CG.irand(7, 10) : cote === 3 ? CG.irand(CG.MH - 11, CG.MH - 8) : CG.irand(10, CG.MH - 11);
      if (Math.hypot(tx - W.CX, ty - W.CY) < 22 || !W.walkTile(tx, ty + 2) || f[W.idx(tx, ty + 2)] < 0) continue;
      if ((W.sites || []).some(s => Math.hypot(s.x - tx, s.y - ty) < s.r + 9) || Math.hypot(W.GRAVE.x - tx, W.GRAVE.y - ty) < 11 || Object.values(W.POI).some(p => Math.hypot(p.x - tx, p.y - ty) < p.r + 8)) continue;
      if (S.buildings.some(b => Math.hypot(b.tx - tx, b.ty - ty) < 12)) continue;
      let eau = 0; for (let y = -4; y <= 4; y++) for (let x = -6; x <= 6; x++) { const t = W.inMap(tx + x, ty + y) ? W.tile[W.idx(tx + x, ty + y)] : W.WATER; if (t === W.WATER || t === W.ROCK || t === W.WALL || t === W.FLOOR) eau++; }
      if (!eau) return { tx, ty };
    }
    return null;
  }
  function defricher(a) { const S = CG.S; for (let y = -4; y <= 4; y++) for (let x = -6; x <= 6; x++) { if ((x * x) / 40 + (y * y) / 18 > 1) continue; const tx = a.tx + x, ty = a.ty + y; if (W.inMap(tx, ty) && W.tile[W.idx(tx, ty)] === W.TREE && W.cutTree(tx, ty)) S.cuts.push(W.idx(tx, ty)); } }
  const soldat = (type, x, y) => ({ type, x, y, x0: x, y0: y, face: Math.random() < 0.5 ? 1 : -1, step: 0, moving: false, atkAnim: 0, calm: true, seed: Math.random() * 100, slow: 0, t: rand(1, 5), draw: dessinSoldat });
  function dresser(a) {
    const R = CG.R, c = W.center(a.tx, a.ty), tentes = [], sold = [];
    [[-4.6, -1.4], [-2.4, -2.6], [0, -3], [2.4, -2.6], [4.6, -1.4], [-3.4, 0.6], [3.4, 0.6]].slice(0, a.tentes).forEach((q, i) => tentes.push({ x: c.x + q[0] * T, y: c.y + q[1] * T, v: i, grand: i === 2, draw: dessinTente }));
    const types = ['soldat', 'soldat', 'archer', 'soldat', 'chevalier', 'archer', 'soldat', 'soldat', 'archer', 'chevalier', 'soldat', 'milicien'].slice(0, a.n);
    types.forEach((ty, i) => { const an = i / types.length * TAU + 0.4, r = 60 + (i % 3) * 34; let x = c.x + Math.cos(an) * r * 1.5, y = c.y + 30 + Math.abs(Math.sin(an)) * r * 0.7; if (!W.walkPx(x, y)) { x = c.x + rand(-40, 40); y = c.y + 40; } sold.push(soldat(ty, x, y)); });
    const k = soldat('capitaine', c.x, c.y + 26); k.cap = true; k.face = 1;
    R.armee = { st: 'camp', cap: k, sold, tentes, feu: { x: c.x, y: c.y + 4, draw: dessinFeu }, c, t: 0 };
    if (a.etat === 'visite') visite(true);
  }
  Ar.creer = function () {
    const S = CG.S, q = lieu(); if (!q) return null;
    const tr = CG.shuffle(Object.keys(TR));
    S.armee = { day: S.day, tx: q.tx, ty: q.ty, nom: pick(NOMS), aime: tr.slice(0, 2), deteste: tr[2], humeur: CG.irand(-1, 1), estime: CG.irand(18, 34), hist: CG.irand(0, HISTOIRES.length - 1), vus: [], n: CG.irand(9, 12), tentes: CG.irand(5, 7), hVisite: rand(12.5, 14.5), refus: 0, parle: 0 };
    defricher(S.armee); dresser(S.armee); return S.armee;
  };
  const sd0 = D.startDay; D.startDay = function () {
    const r = sd0.apply(this, arguments), S = CG.S, R = CG.R; R.armee = null;
    if (CG.Mondes && CG.Mondes.ici() !== 0) return r;
    const a = S.armee;
    if (a && a.day === S.day && !a.fait) dresser(a); // partie reprise en cours de journée : le camp est toujours là
    else if (S.day >= Ar.JOUR && (!a || S.day - a.day >= Ar.ECART) && Math.random() < Ar.CHANCE && Ar.creer()) R.armeeAnnonce = 6;
    return r;
  };

  // ---------- parler au capitaine ----------
  const qui = a => 'Capitaine ' + a.nom;
  const menu = function (intro) {
    const S = CG.S, R = CG.R, a = A(); if (!a || !R.armee) return;
    const auVillage = R.armee.st === 'visite' && !a.vuCamp, max = auVillage ? Ar.SUJETS_VILLAGE : Ar.SUJETS, reste = Math.max(0, max - a.parle);
    let txt = intro;
    if (!txt) { if (!a.dit) { a.dit = true; if (R.armee.st === 'camp') a.vuCamp = true; txt = (R.armee.st === 'camp' ? 'Halte ! ... Un gobelin. Seul. Baissez vos arcs, vous autres. ' : 'Chef gobelin. Je viens sans tirer l\'épée. ') + HISTOIRES[a.hist] + ' Je te demande le passage par ton village : nous ne toucherons à rien.'; }
      else txt = pick(['Alors, chef ? Mes hommes attendent ta réponse.', 'Te revoilà. As-tu réfléchi au passage ?', 'Je t\'écoute.', 'Le jour avance, chef gobelin. Que décides-tu ?']); }
    if (R.armee.st === 'camp') a.vuCamp = true;
    UI.dialog({ who: qui(a), tag: tag(a) + (voit() ? ' · 👁 ' + gouts(a) : ''), text: txt, options: [
      { label: '💬 Discuter avec lui', sub: reste ? (auVillage ? 'Il est venu jusqu\'ici, pressé : encore ' + reste + ' sujet' + (reste > 1 ? 's' : '') + ', pas plus' : 'Encore ' + reste + ' sujet' + (reste > 1 ? 's' : '') + ' aujourd\'hui · bien répondre fait monter son estime') : 'Il a assez parlé pour aujourd\'hui', disabled: !reste, fn: sujet },
      { label: '✅ « Passez. La route est à vous. »', sub: 'Toute la troupe traverse le village, sans rien demander', fn: () => decider('oui') },
      { label: '🤝 « Passez... à une condition. »', sub: 'Demander quelque chose en échange : il peut refuser, selon son humeur et son estime', fn: condition },
      { label: '⛔ « Non. Contournez mon village. »', sub: a.estime < 25 ? 'Il te respecte peu : il pourrait mal le prendre' : 'Il devra faire le grand tour', fn: () => decider('non') },
      { label: 'Je vais y réfléchir' }] });
  };
  function sujet() {
    const a = A(); if (!a) return; const libres = SUJETS.map((s, i) => i).filter(i => !a.vus.includes(i)); if (!libres.length) return menu('Nous avons fait le tour, je crois. Parlons du passage.');
    const i = pick(libres), s = SUJETS[i], v = voit(); a.vus.push(i); a.parle++;
    UI.dialog({ who: qui(a), tag: tag(a) + (v ? ' · 👁 ' + gouts(a) : ''), text: s[0], options: CG.shuffle(s.slice(1)).map(r => ({ label: '« ' + r[0] + ' »', sub: v ? 'Ton : ' + TR[r[1]][0] + ' ' + TR[r[1]][1] + (a.aime.includes(r[1]) ? ' · il aime ça' : a.deteste === r[1] ? ' · il déteste ça' : '') : '', fn: () => repondre(r[1]) })) });
  }
  function repondre(k) {
    const R = CG.R, a = A(); if (!a) return; const c = cap(), bon = a.aime.includes(k), mal = a.deteste === k, d = bon ? 11 : mal ? -9 : 2;
    const max = R.armee.st === 'visite' && !a.vuCamp ? Ar.MAX_VILLAGE : 100;
    a.estime = d > 0 ? Math.max(a.estime, Math.min(max, a.estime + d)) : Math.max(0, a.estime + d);
    if (bon) a.humeur = Math.min(2, a.humeur + (Math.random() < 0.6 ? 1 : 0)); else if (mal) a.humeur = Math.max(-2, a.humeur - 1);
    if (c) { G.text(c.x, c.y - 96, bon ? '💚 estime +' + d : mal ? '💢 estime ' + d : '· estime +' + d, bon ? '#b8ffb0' : mal ? '#ff9a8a' : '#e8e2d0', true); if (bon) CG.sfx('ok'); else if (mal) CG.sfx('no'); }
    menu((bon ? pick(REAC.bon[k]) : mal ? pick(REAC.mal[k]) : pick(REAC.bof)) + (bon && a.estime >= max && max < 100 ? ' (Il ne t\'estimera pas davantage aujourd\'hui : il aurait fallu aller le voir à son camp.)' : ''));
  }
  function condition() {
    const S = CG.S, a = A(); if (!a) return; const opts = [];
    TAILLES.forEach((t, ti) => { ['or', 'food', 'bois', 'minerai'].forEach(res => { if (ti === 1 || res === 'or' || res === 'food') opts.push({ label: CG.RES[res].icon + ' ' + quantite(res, t[1]) + ' ' + CG.RES[res].nom.toLowerCase(), sub: t[0], fn: () => demander(res, ti) }); }); });
    UI.dialog({ who: qui(a), tag: tag(a), text: 'Une condition ? Parle. Mais pèse bien tes mots : mes coffres ne sont pas sans fond, et ma patience non plus.', grid: true, options: opts.concat([{ label: '← Laisse-moi y repenser', fn: () => menu('Comme tu voudras.') }]) });
  }
  function demander(res, ti) {
    const a = A(); if (!a) return; const t = TAILLES[ti], n = quantite(res, t[1]), score = a.estime + a.humeur * 9 - t[2] + rand(-9, 9);
    if (score >= 0) { a.prix = { res, n }; return decider('oui', 'Marché conclu. ' + n + ' ' + CG.RES[res].icon + ' : tu les auras quand le dernier de mes hommes aura passé ton feu. ' + pick(['Tu négocies bien, pour un gobelin.', 'C\'est honnête.', 'Mes hommes grogneront, mais soit.'])); }
    a.refus++; a.estime = clamp(a.estime - (ti === 2 ? 9 : 4), 0, 100); if (a.refus >= 2) a.humeur = Math.max(-2, a.humeur - 1);
    const c = cap(); if (c) G.text(c.x, c.y - 96, '💢 refusé', '#ff9a8a', true); CG.sfx('no');
    menu(pick(ti === 2 ? ['Tu me prends pour un marchand de foire ?! C\'est non.', 'À ce prix-là, je fais le tour par les montagnes. Non.', 'Non. Et ne me redemande pas autant.'] : ['Non. Pas pour un simple droit de passage.', 'C\'est trop, pour l\'estime que j\'ai de toi. Non.', 'Je refuse. Demande moins, ou gagne ma confiance.']));
  }
  function decider(quoi, mot) {
    const S = CG.S, R = CG.R, a = A(), M = R.armee; if (!a || !M) return; const c = M.cap; a.fait = true; a.decision = quoi;
    if (quoi === 'oui') { G.say(c, mot || pick(['Merci, chef gobelin. Nous ne toucherons à rien.', 'Tu as ma parole : nous passons, rien de plus.', 'Je n\'oublierai pas ça. En route, vous autres !']), 5); marche('passe'); CG.sfx('ok'); return; }
    // refus : selon l'estime et l'humeur, il s'incline... ou il force le passage
    const colere = a.estime < 25 && (a.humeur <= -1 || a.aime.includes('f')) && Math.random() < 0.75;
    if (colere) { G.say(c, pick(['Alors nous passerons sur vos huttes. AUX ARMES !', 'J\'ai demandé poliment. Tant pis pour toi. EN AVANT !']), 4); assaut(); return; }
    if (a.estime >= 55) { G.say(c, pick(['C\'est ton droit, et je le respecte. Nous ferons le tour. Adieu, chef.', 'Dommage. Mais tu es chez toi. Bonne route à toi aussi.']), 5); S.morale = Math.min(100, S.morale + 1); }
    else G.say(c, pick(['Pff. Des jours de marche en plus, à cause d\'un gobelin. On s\'en souviendra.', 'Soit. Nous contournerons. Ne viens jamais me demander un service.']), 5);
    marche('part');
  }

  // ---------- la troupe se met en marche ----------
  const tous = M => [M.cap].concat(M.sold);
  function sortieLoin(M) { let best = null, bd = -1; Object.values(W.EXITS).forEach(e => { const p = W.center(e.x, e.y), d = Math.hypot(p.x - M.c.x, p.y - M.c.y); if (d > bd) { bd = d; best = p; } }); return best; }
  function sortiePres(M) { let best = null, bd = 1e9; Object.values(W.EXITS).forEach(e => { const p = W.center(e.x, e.y), d = Math.hypot(p.x - M.c.x, p.y - M.c.y); if (d < bd) { bd = d; best = p; } }); return best; }
  function plier(M) { M.tentes.forEach(t => G.puff(t.x, t.y - 20, '#d8cfb4', 12, 90, 4)); M.tentes = []; M.feu = null; }
  function marche(st) {
    const R = CG.R, M = R.armee, f = G.firePos(); M.st = st; M.t = 0; plier(M);
    const but = st === 'passe' ? sortieLoin(M) : sortiePres(M);
    tous(M).forEach((o, i) => { o.ph = st === 'passe' ? 0 : 1; o.attente = o.cap ? 0 : 0.6 + i * 0.45; o.but = { x: but.x + rand(-20, 20), y: but.y + rand(-20, 20) }; o.via = { x: f.x - 60 + (i % 5) * 30, y: f.y + 110 + (i % 3) * 16 }; o.path = null; o.parti = false; });
  }
  function visite(reprise) {
    const S = CG.S, R = CG.R, M = R.armee, a = A(), f = G.firePos(); if (!M || !a) return; M.st = 'visite'; a.etat = 'visite';
    const escorte = [M.cap].concat(M.sold.slice(0, 5));
    escorte.forEach((o, i) => { o.visite = true; const d = { x: f.x - 70 + (i % 3) * 34 + (o.cap ? 20 : 0), y: f.y + (o.cap ? 96 : 124 + Math.floor(i / 3) * 18) }; if (reprise) { o.x = d.x; o.y = d.y; G.unstick(o, 8); } else if (!G.goTo(o, d.x, d.y)) { o.x = d.x; o.y = d.y; G.unstick(o, 8); } });
    if (!reprise) { G.banner('Une troupe d\'humains approche', 'Ils n\'ont pas tiré l\'épée. Leur capitaine veut te parler : va le voir près du feu (E).', '#bfe8ff'); CG.sfx('horn'); }
  }
  function assaut() {
    const S = CG.S, R = CG.R, M = R.armee; plier(M);
    tous(M).forEach(o => { const e = G.spawnEnemy(o.type, o.x, o.y, {}); if (e) e.face = o.face; });
    R.armee = null; R.event = { type: 'attack', kind: 'humains', exit: 'ouest', quiet: true, msg: ['Les humains forcent le passage !', 'Tu leur as refusé la route : ils la prennent par les armes. Aux armes !'] };
    S.morale = Math.max(0, S.morale - 3); CG.sfx('warning');
  }
  function arrivee(M) { // le capitaine passe devant le feu : c'est là que tout se règle
    const S = CG.S, a = S.armee, c = M.cap, p = S.player; if (!a || M.regle) return; M.regle = true;
    if (a.prix) { G.gain(a.prix.res, a.prix.n, c.x, c.y - 60); G.say(c, pick(['Voici ce qui était convenu. Compte, si tu veux.', 'Chose promise, chose due.']), 4); UI.toast('🤝 Le capitaine ' + a.nom + ' paie son passage : +' + a.prix.n + ' ' + CG.RES[a.prix.res].icon + '.'); CG.sfx('coin'); S.morale = Math.min(100, S.morale + 2); return; }
    if (a.estime >= 60) { const n = 15 + S.day * 3; G.gain('or', n, c.x, c.y - 60); G.say(c, pick(['Tu n\'as rien demandé. Raison de plus : prends ceci.', 'Pour ton hospitalité, chef. Que nos routes se recroisent.']), 4.5); UI.toast('🎁 Le capitaine ' + a.nom + ' te laisse une bourse en remerciement : +' + n + ' 🪙. (moral +3)'); S.morale = Math.min(100, S.morale + 3); CG.sfx('coin'); }
    else if (a.estime < 30) { const n = Math.min(S.res.food, Math.max(3, Math.round(S.res.food * 0.08))); if (n > 0) { G.gain('food', -n, c.x, c.y - 60); UI.toast('😠 En passant, quelques soldats ont chapardé dans tes réserves : -' + n + ' 🍖. Leur capitaine ne t\'estimait pas assez pour les tenir.'); CG.sfx('no'); } }
    else { G.say(c, pick(['Merci pour la route, chef.', 'Nous ne faisons que passer. Adieu.']), 4); S.morale = Math.min(100, S.morale + 1); }
  }
  function pas(M, o, dt) {
    if (o.parti) return; if (o.attente > 0) { o.attente -= dt; o.moving = false; return; }
    if (o.ph === 0) { if (!o.path && !G.goTo(o, o.via.x, o.via.y)) { o.ph = 1; return; } if (G.follow0(o, 58, dt)) { o.ph = 1; o.path = null; if (o.cap) arrivee(M); } return; }
    if (!o.path && !G.goTo(o, o.but.x, o.but.y)) { o.parti = true; G.puff(o.x, o.y - 16, '#d8cfb4', 8, 80, 3); return; }
    if (G.follow0(o, 58, dt)) o.parti = true;
  }
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || R.night) return; const M = R.armee, a = S.armee; if (!M || !a) return; M.t += dt;
    M.son = (M.son || 0) - dt; if (M.son <= 0) { M.son = 0.5; if (tous(M).filter(o => o.moving && !o.parti && CG.onScreen(o.x, o.y)).length >= 3) CG.sfx('marcheHumains'); } // la troupe en marche : on entend les pas
    if (R.armeeAnnonce > 0) { R.armeeAnnonce -= dt; if (R.armeeAnnonce <= 0 && !R.alarm) { const dx = M.c.x - G.firePos().x, dy = M.c.y - G.firePos().y, ou = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'à l\'est' : 'à l\'ouest') : (dy > 0 ? 'au sud' : 'au nord'); G.banner('Des tentes à l\'orée de la forêt', 'Une troupe d\'humains campe ' + ou + '. Ils n\'ont pas l\'air d\'être là pour vous. Va voir (carte : C).', '#bfe8ff'); if (R.pings) R.pings.push({ x: M.c.x, y: M.c.y, t0: performance.now(), icon: '⛺', dur: 9000 }); } }
    if (M.st === 'camp' || M.st === 'visite') {
      for (const o of tous(M)) { // au camp : on fait les cent pas ; en visite : on marche jusqu'au feu, puis on attend
        if (o.visite && M.st === 'visite') { if (o.path && o.path.length) G.follow0(o, 58, dt); else { o.moving = false; o.face = S.player.x > o.x ? 1 : -1; } continue; }
        if (o.cap) { o.moving = false; if (dist(o, S.player) < 220) o.face = S.player.x > o.x ? 1 : -1; continue; }
        o.t -= dt; if (o.path && o.path.length) { G.follow0(o, 30, dt); continue; } o.moving = false;
        if (o.t <= 0) { o.t = rand(4, 10); const x = o.x0 + rand(-36, 36), y = o.y0 + rand(-20, 20); if (W.walkPx(x, y)) G.goTo(o, x, y); }
      }
      if (M.st === 'camp' && S.hour >= a.hVisite && !R.alarm && !R.event && !UI.modal) visite(false);
      if (S.hour >= 18.4 && !UI.modal && !a.fait) { a.fait = true; G.say(M.cap, 'La nuit tombe et tu ne dis rien. Nous ferons le tour. Adieu.', 4.5); marche('part'); }
      return;
    }
    let reste = 0; for (const o of tous(M)) { pas(M, o, dt); if (!o.parti) reste++; }
    if (M.st === 'passe' && !M.regle && M.t > 45) arrivee(M); // le chemin était barré : on règle quand même
    if (!reste) { if (M.st === 'passe' && !M.regle) arrivee(M); R.armee = null; }
  };

  // ---------- E pour parler au capitaine ----------
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), R = CG.R, M = R.armee, a = A(); if (!M || !a || R.ko > 0 || R.cine || R.build || (M.st !== 'camp' && M.st !== 'visite')) return it;
    const c = M.cap, p = CG.S.player, d = dist(p, c); if (d > 62 || (it && it.obj && it.obj.x !== undefined && it.type !== 'home' && Math.hypot(p.x - it.obj.x, p.y - it.obj.y) < d)) return it;
    return { type: 'capitaine', obj: { x: c.x, y: c.y - 30 }, label: 'Parler au capitaine ' + a.nom };
  };
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'capitaine') { if (CG.R.alarm) return UI.toast('Pas pendant une attaque !'); return menu(); } return in0.apply(this, arguments); };

  // ---------- dessins ----------
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  function dessinSoldat(g, o, t) { Art.enemy(g, o, t); }
  function dessinTente(g, o, t) {
    const x = o.x, y = o.y, s = o.grand ? 1.3 : 1, col = o.grand ? ['#a8322a', '#7c2018'] : o.v % 2 ? ['#d8cfb4', '#b0a688'] : ['#c9bfa0', '#a0957a'];
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(x, y + 2, 40 * s, 10 * s, 0, 0, TAU); g.fill();
    poly(g, [x - 38 * s, y, x, y - 58 * s, x + 38 * s, y], col[0]); poly(g, [x, y - 58 * s, x + 38 * s, y, x + 6 * s, y], col[1]); poly(g, [x - 9 * s, y, x, y - 30 * s, x + 9 * s, y], '#2a1c12');
    g.strokeStyle = '#5a3d22'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y - 58 * s); g.lineTo(x, y - 70 * s); g.stroke();
    if (o.grand) { const w = Math.sin(t * 3) * 3; poly(g, [x, y - 70 * s, x + 20 + w, y - 64 * s, x, y - 58 * s], '#e8c84a'); } else { g.strokeStyle = 'rgba(90,70,40,0.7)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 38 * s, y); g.lineTo(x - 50 * s, y + 5); g.moveTo(x + 38 * s, y); g.lineTo(x + 50 * s, y + 5); g.stroke(); }
  }
  function dessinFeu(g, o, t) {
    const x = o.x, y = o.y; g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x, y + 2, 16, 6, 0, 0, TAU); g.fill();
    g.strokeStyle = '#5a3d22'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 11, y + 2); g.lineTo(x + 9, y - 4); g.moveTo(x + 11, y + 2); g.lineTo(x - 9, y - 4); g.stroke();
    [['#ff7a1e', 9, 22], ['#ffcf3a', 6, 15], ['#fff6c0', 3, 8]].forEach((f, i) => { const h = f[2] + Math.sin(t * 9 + i * 2) * 3; g.fillStyle = f[0]; g.beginPath(); g.moveTo(x - f[1], y - 2); g.quadraticCurveTo(x - f[1] * 1.2, y - h * 0.5, x + Math.sin(t * 6 + i) * 2, y - h); g.quadraticCurveTo(x + f[1] * 1.2, y - h * 0.5, x + f[1], y - 2); g.fill(); });
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 18, y + 4); g.lineTo(x - 14, y - 30); g.lineTo(x + 14, y - 30); g.lineTo(x + 18, y + 4); g.stroke(); g.fillStyle = '#3a3a40'; g.beginPath(); g.ellipse(x, y - 22, 7, 5, 0, 0, Math.PI); g.fill();
  }
  // appelé par main.js : tout ce qui a une hauteur, trié avec le reste
  Ar.pousser = function (push) {
    const M = CG.R.armee; if (!M) return;
    for (const t of M.tentes) if (CG.onScreen(t.x, t.y - 30)) push(t.y, 21, t, null);
    if (M.feu && CG.onScreen(M.feu.x, M.feu.y)) push(M.feu.y, 21, M.feu, null);
    for (const o of tous(M)) if (!o.parti && CG.onScreen(o.x, o.y)) push(o.y, 21, o, null);
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const M = CG.R.armee, a = A(); if (!M || !a || (M.st !== 'camp' && M.st !== 'visite')) return; const c = M.cap; if (!CG.onScreen(c.x, c.y)) return;
    g.font = 'bold 12px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.fillStyle = '#ffe9a8'; g.strokeText('Capitaine ' + a.nom, c.x, c.y - 72); g.fillText('Capitaine ' + a.nom, c.x, c.y - 72);
    if (voit()) { g.font = '13px sans-serif'; g.fillStyle = '#fff'; g.fillText('👍 ' + a.aime.map(k => TR[k][0]).join('') + '  👎 ' + TR[a.deteste][0], c.x, c.y - 90); }
    else if (!UI.modal) Art.bubble(g, c.x, c.y - 96 + Math.sin(t * 3) * 2, M.st === 'visite' ? '❗' : '💬');
  };
  if (CG.Scout && CG.Scout.mini) { const mi0 = CG.Scout.mini; CG.Scout.mini = function (g, dot) { mi0.apply(this, arguments); const M = CG.R.armee; if (!M) return; if (M.tentes.length) { dot(M.c.x, M.c.y, '#fff', 6); dot(M.c.x, M.c.y, '#c8322a', 4); } for (const o of tous(M)) if (!o.parti && (M.st !== 'camp')) dot(o.x, o.y, '#ffb0a0', 2); }; }
})(window.CG);
