// Clan Gobelin — vie sociale : questions des villageois, cour aux danseuses le soir, chantiers.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, T = CG.TILE, Soc = CG.Soc = { timer: 120 };
  const pick = CG.pick, rand = CG.rand;

  // ---------- questions des villageois : [réponse, effet sur le moral] ----------
  const Q = [
    ['Chef, qu\'est-ce que tu vas faire aujourd\'hui ?', ['Veiller sur le village et sur chacun de vous.', 3], ['Ça ne te regarde pas. Retourne travailler !', -4], ['Moi, je surveille. Toi, montre-moi ce que tu vaux : au boulot, et que ça saute !', -2, 'boost'], ['Et toi, qu\'est-ce que TU as fait pour le village, hein ?', -3]],
    ['Chef, tu trouves que je travaille bien ?', ['Tu fais un travail formidable, {n}.', 3], ['Bof. Un caillou ferait mieux que toi.', -4], ['Pas assez. Je veux te voir courir, pas traîner les pieds !', -2, 'boost'], ['Je ne sais même pas ce que tu fais de tes journées.', -2]],
    ['J\'ai peur des humains, chef. Ils vont revenir ?', ['Oui, mais on les repoussera ensemble. Je serai devant.', 3], ['Si tu as peur, cache-toi et arrête de pleurnicher.', -3], ['Ha ! Ils te mangeront en premier, toi.', -5]],
    ['Chef, j\'ai cueilli cette fleur pour toi.', ['Merci, elle est magnifique. Je la garde dans ma hutte.', 3], ['Une fleur ? J\'aurais préféré de l\'or.', -2], ['(Tu la jettes par terre et tu l\'écrases.)', -5]],
    ['Est-ce qu\'on fera une belle fête ce soir ?', ['La plus belle ! Je veux vous voir tous danser.', 3], ['La fête, c\'est pour ceux qui travaillent fort. Gagne ta place autour du feu !', -2, 'boost'], ['Non. Vous faites trop de bruit, ça m\'énerve.', -4]],
    ['Mon voisin ronfle toute la nuit. Tu peux faire quelque chose ?', ['Je vais lui parler gentiment. On va arranger ça.', 2], ['Bouche-toi les oreilles avec de la mousse et laisse-moi tranquille.', -2], ['C\'est toi qui ronfles, tout le monde le dit.', -3]],
    ['Chef, pourquoi c\'est toi le chef ?', ['Parce que je veux que chacun mange à sa faim et dorme en sécurité.', 3], ['Parce que je suis plus malin que vous tous réunis, bande de nouilles.', -4], ['Tu veux ma place ? Non ? Alors tais-toi.', -3]],
    ['J\'ai fait une bêtise... j\'ai renversé un panier de baies.', ['Ce n\'est pas grave, ça arrive à tout le monde.', 3], ['Maladroit ! Tu seras privé de fête ce soir.', -4], ['Alors rattrape-toi : je veux le double avant ce soir. File !', -2, 'boost'], ['Tu me les rembourseras, baie par baie.', -2]],
    ['Tu crois qu\'un jour notre village sera grand ?', ['Oui, et ce sera grâce à vous tous.', 3], ['Pas avec des paresseux comme toi.', -4], ['Seulement si chacun se remue. À commencer par toi : allez, hop !', -1, 'boost'], ['Je m\'en fiche, tant que moi j\'ai une belle hutte.', -3]],
    ['Chef, je peux te confier un secret ? J\'ai peur du noir.', ['Moi aussi, quand j\'étais petit. On posera plus de torches.', 3], ['Ha ha ha ! Je vais le raconter à tout le monde !', -5], ['Un gobelin qui a peur du noir... quelle honte.', -3]],
    ['Je trouve que tu te bats bien, chef. Tu m\'apprendrais ?', ['Avec plaisir. Règle numéro un : ne jamais tourner le dos.', 3], ['Toi ? Tu te blesserais avec une cuillère.', -3], ['Je n\'ai pas de temps à perdre avec toi.', -3], ['Plus tard. D\'abord prouve-moi que tu sais travailler dur !', -1, 'boost']],
    ['On mange quoi ce soir, chef ?', ['Ce que le clan aura rapporté, et on partagera tout.', 2], ['Toi, rien. Tu manges déjà trop.', -4], ['Ceux qui travaillent fort mangeront les premiers. Dépêche-toi !', -2, 'boost'], ['Va demander à quelqu\'un que ça intéresse.', -2]],
    ['Chef, tu te souviens de mon nom ?', ['Bien sûr, {n}. Je n\'oublie aucun des miens.', 3], ['Euh... Machin ? Truc ?', -3], ['Pourquoi je retiendrais le nom d\'un simple gobelin ?', -5]],
    ['J\'ai une idée pour le village ! Tu veux l\'entendre ?', ['Raconte, je t\'écoute. Les bonnes idées viennent de partout.', 3], ['Non. Les idées, c\'est moi qui les ai.', -3], ['Mon idée à moi : moins de paroles, plus de travail. Exécution !', -2, 'boost'], ['Toi, une idée ? Ça doit faire mal à la tête.', -4]]
  ];
  const GOOD = ['Merci, chef ! Tu es le meilleur.', 'Ça fait chaud au cœur, chef.', 'Je vais le dire à tout le monde : on a un bon chef !', 'Hi hi ! Je retourne travailler, tout content.'];
  const BAD = ['Oh... d\'accord.', 'Je croyais que tu étais gentil, toi.', 'Je m\'en souviendrai, chef.', 'Pas la peine d\'être méchant...', 'Les autres vont l\'apprendre, tu sais.'];
  const VEXED = ['Hmpf ! Tu vas voir si je suis un paresseux !', 'D\'accord, d\'accord, j\'y cours !', 'Pas commode, le chef... mais je vais lui montrer.', 'Grr. Regarde-moi bien travailler, alors !'];
  const WATCH = {
    bad: [['Ha ha ha ha !', 1], ['Hi hi hi ! La tête qu\'il fait !', 1], ['Pfff ha ha !', 1], ['Oh ! Il a osé...', 0], ['Ouille, ça pique.', 0], ['C\'est pas gentil, chef.', 0], ['Pauvre {n}...', 0], ['😂', 1], ['😮', 0]],
    good: [['Ooooh, c\'est mignon.', 0], ['Bien dit, chef !', 0], ['Vive le chef !', 1], ['👏', 1], ['Ça, c\'est un bon chef.', 0], ['Moi aussi je veux un compliment !', 0], ['❤️', 0]],
    boost: [['Hé hé, cours, {n}, cours !', 1], ['Ça, c\'est un chef qui commande !', 0], ['Ha ha ! Plus vite !', 1], ['Oh là, je retourne travailler moi aussi...', 0], ['😅', 0]]
  };
  // les gobelins qui traînent autour réagissent, juste pour le plaisir
  function bystanders(g, mood) {
    const S = CG.S, p = S.player, near = CG.shuffle(S.goblins.filter(o => o !== g && !o.hidden && o.met && CG.dist(o, p) < 240));
    const n = Math.min(near.length, Math.floor(Math.random() * 4));
    for (let i = 0; i < n; i++) { const w = pick(WATCH[mood] || WATCH.bad); G.say(near[i], w[0].replace('{n}', g.name), 2.6, 0.5 + i * 0.5 + Math.random() * 0.4); CG.R.speech[CG.R.speech.length - 1].laugh = !!w[1]; }
  }
  Soc.bystanders = bystanders; Soc.Q = Q; Soc.POOL = { GOOD, BAD, VEXED, WATCH };
  function react(g, delta, boost, rep) {
    const S = CG.S; if (rep) rep = rep.replace(/\{n\}/g, g.name).replace(/\{e\}/g, g.sex === 'f' ? 'e' : '');
    if (!delta && !boost) { G.say(g, rep || 'Ah. Bon.', 4); if (Math.random() < 0.6) bystanders(g, 'fun'); return; } // réponse anodine : juste pour rire
    if (boost) { // vexé mais piqué au vif : il travaille deux fois plus vite et court pendant 30 secondes
      S.morale = CG.clamp(S.morale + delta, 0, 100); g.ami = CG.clamp((g.ami || 0) - 1, -6, 6); g.boost = 30;
      G.text(g.x, g.y - 50, '💢💨', '#fff', true); CG.sfx('swing');
      G.say(g, rep || pick(VEXED), 4); bystanders(g, 'boost'); CG.UI.toast('😤 ' + g.name + ' est vexé : moral ' + delta + ', mais il travaille 2× plus vite et court pendant 30 s.'); return;
    } S.morale = CG.clamp(S.morale + delta, 0, 100); g.ami = CG.clamp((g.ami || 0) + (delta > 0 ? 1 : -2), -6, 6);
    G.text(g.x, g.y - 50, delta > 0 ? '❤️' : '💢', '#fff', true);
    G.say(g, rep || pick(delta > 0 ? GOOD : BAD), 4); bystanders(g, delta > 0 ? 'good' : 'bad');
    CG.UI.toast((delta > 0 ? '😄 ' : '😠 ') + g.name + ' : moral ' + (delta > 0 ? '+' : '') + delta);
    CG.sfx(delta > 0 ? 'ok' : 'no');
  }
  Soc.react = react;
  // ---------- promesses : « je m'en occupe » veut dire aller vraiment parler à l'autre ----------
  // {f} = celui qui demande, {t} = celui qu'il faut aller voir. Réponses : [texte, effet moral, 'ok' | 'fail' | 'boost']
  const ERR = [
    { ask: 'Chef, {t} ronfle toute la nuit, on dirait un troll enrhumé ! Je n\'en peux plus. Tu peux faire quelque chose ?', same: true, but: 'parler à {t} de ses ronflements', btn: '😴 Lui parler de ses ronflements', sujet: 'C\'est à propos de tes ronflements, la nuit.',
      talk: 'Moi, ronfler ? ... Bon, peut-être un peu. C\'est {f} qui se plaint ?', opts: [['Essaie de dormir sur le côté. On te trouvera un coin plus tranquille.', 3, 'ok'], ['Encore un ronflement et tu dors dehors avec les loups !', -2, 'ok'], ['Bah, laisse tomber, oublie ce que j\'ai dit.', -2, 'fail']] },
    { ask: 'Chef ! {t} a pris mon panier sans demander et ne me l\'a jamais rendu !', but: 'demander à {t} de rendre le panier', btn: '🧺 Lui parler du panier de {f}', sujet: 'C\'est à propos d\'un panier que tu as emprunté.',
      talk: 'Le panier de {f} ? Oh... je croyais qu\'il était à tout le monde.', opts: [['Rends-le avec un mot gentil, et tout sera oublié.', 3, 'ok'], ['Au voleur ! Tu me dégoûtes.', -3, 'ok'], ['Garde-le, après tout.', -2, 'fail']] },
    { ask: 'Chef, {t} a l\'air tout triste depuis ce matin. Tu devrais aller lui parler : toi, on t\'écoute.', but: 'aller réconforter {t}', btn: '🫂 Lui demander ce qui ne va pas', sujet: 'On m\'a dit que tu avais l\'air triste aujourd\'hui.',
      talk: 'Oh, chef... Mon ancien clan me manque, c\'est tout.', opts: [['Ton clan, c\'est nous maintenant. Et on tient à toi.', 4, 'ok'], ['Arrête de pleurnicher, on a du travail.', -3, 'fail'], ['Ah. Bon. Bonne journée.', -1, 'fail']] },
    { ask: 'Chef... je trouve que {t} est formidable, mais je n\'ose pas le lui dire. Tu lui dirais pour moi ?', but: 'porter le message de {f} à {t}', btn: '💌 Lui porter le message de {f}', sujet: 'J\'ai un message gentil pour toi, de sa part.',
      talk: '{f} t\'a demandé de me parler ? À quel sujet ?', opts: [['{f} te trouve formidable, mais n\'ose pas te le dire.', 4, 'ok'], ['{f} a le béguin pour toi. Ha ha ha, la honte !', -4, 'fail'], ['Euh... rien, j\'ai oublié.', -2, 'fail']] },
    { ask: 'Chef, {t} fait la sieste derrière les huttes pendant que nous, on travaille. C\'est pas juste !', but: 'aller secouer {t}', btn: '💤 Lui parler de ses siestes', sujet: 'C\'est à propos de tes siestes pendant le travail.',
      talk: 'Hein ? Je... je reposais mes yeux, chef !', opts: [['Tout le monde compte sur toi. Je sais que tu peux faire mieux.', 2, 'ok'], ['Debout ! Fini la sieste, je veux te voir courir !', -1, 'boost'], ['Dors bien, alors.', -2, 'fail']] },
    { ask: 'J\'ai sculpté ce petit collier d\'os pour {t}, pour dire merci. Tu peux le lui porter ? Moi, je suis trop timide.', but: 'porter le collier à {t}', btn: '📿 Lui remettre le collier de {f}', sujet: 'J\'ai un cadeau à te remettre de sa part.',
      talk: 'Un collier ? Pour moi ?', opts: [['De la part de {f}, pour te dire merci.', 4, 'ok'], ['Je l\'ai trouvé par terre. Tiens.', -1, 'fail'], ['(Tu gardes le collier pour toi.)', -4, 'fail']] },
    { ask: 'J\'ai cassé la cruche de {t} sans faire exprès. Je n\'ose pas l\'avouer... Tu veux bien présenter mes excuses ?', but: 'présenter les excuses de {f} à {t}', btn: '🏺 Lui parler de sa cruche cassée', sujet: 'C\'est à propos de ta cruche. Elle est cassée.',
      talk: 'Ma cruche ! Qui a fait ça ?!', opts: [['C\'est {f}, qui regrette beaucoup et t\'en fabriquera une neuve.', 3, 'ok'], ['C\'est {f}. Tu devrais lui crier dessus un bon coup.', -3, 'fail'], ['Aucune idée. Sûrement le vent.', -2, 'fail']] },
    { ask: 'Chef, {t} chante faux toute la journée à côté de moi. J\'ai les oreilles qui saignent ! Tu peux lui en toucher un mot ?', but: 'parler à {t} de ses chansons', btn: '🎵 Lui parler de ses chansons', sujet: 'C\'est à propos des chansons que tu chantes toute la journée.',
      talk: 'Tu as entendu ma chanson, chef ? Elle est belle, hein ?', opts: [['Très belle ! Garde-la pour la fête du soir, tout le monde en profitera.', 3, 'ok'], ['On dirait un sanglier qu\'on égorge. Tais-toi.', -3, 'ok'], ['Continue, continue, c\'est parfait.', -2, 'fail']] }
  ];
  const fill = (s, f, t) => s.replace(/\{f\}/g, f.name).replace(/\{t\}/g, t.name);
  Soc.tasks = () => (CG.R.tasks = (CG.R.tasks || []).filter(k => CG.S.goblins.includes(k.from) && CG.S.goblins.includes(k.to)));
  Soc.taskFor = g => Soc.tasks().find(k => k.to === g);
  function errandDialog(g) {
    const S = CG.S, others = S.goblins.filter(o => o !== g && o.met && !Soc.taskFor(o)); if (!others.length) return false;
    const def = pick(ERR), mates = others.filter(o => o.home === g.home), to = def.same && mates.length ? pick(mates) : pick(others);
    CG.UI.dialog({ goblin: g, who: g.name, tag: 'a besoin de toi', text: fill(def.ask, g, to), options: [
      { label: '🤝 Oui, je m\'en occupe.', sub: 'Promesse : ' + fill(def.but, g, to) + ' avant la nuit', fn: () => { Soc.tasks().push({ from: g, to, def, quiz: Math.random() < 0.7 }); S.morale = Math.min(100, S.morale + 1); G.text(g.x, g.y - 50, '❤️', '#fff', true); CG.UI.toast('📌 Promesse faite à ' + g.name + ' : ' + fill(def.but, g, to) + ' avant la nuit.'); CG.sfx('ok'); } },
      { label: 'Je n\'ai pas le temps, arrangez-vous entre vous.', fn: () => react(g, -1) },
      { label: 'Tu me déranges pour ÇA ? Disparais !', fn: () => react(g, -4) }] });
    return true;
  }
  // le soir venu, encore faut-il se rappeler de quoi il fallait parler : le bon sujet est mêlé à d'autres
  const OUPS = ['Hein ? Mais non, pas du tout ! Tu dois me confondre avec quelqu\'un d\'autre, chef.', 'Quoi ? Je ne vois pas du tout de quoi tu parles...', 'Moi ? Jamais de la vie ! Qui t\'a raconté ça ?', 'Euh... non ? Tu es sûr que c\'est à moi que tu devais parler de ça ?'];
  function quizDialog(k) {
    const S = CG.S, f = k.from, t = k.to, n = 2 + (Math.random() < 0.5 ? 1 : 0);
    const faux = CG.shuffle(ERR.filter(d => d !== k.def)).slice(0, n);
    const opts = CG.shuffle([k.def].concat(faux)).map(d => ({ label: fill(d.sujet, f, t), fn: () => {
      if (d === k.def) { G.text(t.x, t.y - 50, '💡', '#fff', true); return taskDialog(k); }
      CG.R.tasks.splice(CG.R.tasks.indexOf(k), 1); S.morale = CG.clamp(S.morale - 2, 0, 100); f.ami = CG.clamp((f.ami || 0) - 2, -6, 6);
      G.say(t, pick(OUPS), 4.5); bystanders(t, 'fun'); G.text(t.x, t.y - 50, '❓', '#fff', true); CG.sfx('no');
      CG.UI.toast('🤦 Tu t\'es trompé de sujet ! Il fallait ' + fill(k.def.but, f, t) + '. ' + f.name + ' sera déçu. (moral -2)');
    } }));
    CG.UI.dialog({ goblin: t, who: t.name, tag: '📌 ta promesse à ' + f.name, text: pick([f.name + ' t\'a demandé de venir me voir ? À quel sujet, chef ?', 'Tu me cherchais, chef ? C\'est ' + f.name + ' qui t\'envoie ? Pourquoi donc ?', 'Oui, chef ? ' + f.name + ' voulait que tu me parles de quelque chose ?']), options: opts });
  }
  function taskDialog(k) {
    const S = CG.S, f = k.from, t = k.to, done = () => { CG.R.tasks.splice(CG.R.tasks.indexOf(k), 1); };
    CG.UI.dialog({ goblin: t, who: t.name, tag: '📌 ta promesse à ' + f.name, text: fill(k.def.talk, f, t), options: CG.shuffle(k.def.opts.slice()).map(o => ({ label: fill(o[0], f, t), fn: () => {
      done(); S.morale = CG.clamp(S.morale + o[1], 0, 100);
      if (o[2] === 'fail') { f.ami = CG.clamp((f.ami || 0) - 2, -6, 6); if (o[1] <= -3) t.ami = CG.clamp((t.ami || 0) - 2, -6, 6); G.say(t, pick(BAD), 4); bystanders(t, 'bad'); G.text(t.x, t.y - 50, '💢', '#fff', true); CG.sfx('no'); CG.UI.toast('😠 Promesse gâchée : ' + f.name + ' l\'apprendra vite. (moral ' + o[1] + ')'); return; }
      G.addXp(6); f.ami = CG.clamp((f.ami || 0) + 2, -6, 6); G.text(f.x, f.y - 50, '❤️', '#fff', true);
      G.say(t, o[2] === 'boost' ? pick(VEXED) : o[1] > 0 ? pick(['D\'accord, chef. Merci d\'être venu me le dire.', 'Oh ! C\'est gentil. Je vais arranger ça.', 'Promis, chef !', 'Tu diras merci à ' + f.name + ' pour moi.']) : pick(BAD), 4); bystanders(t, o[2] === 'boost' ? 'boost' : o[1] > 0 ? 'good' : 'bad');
      if (o[2] === 'boost') { t.boost = 30; G.text(t.x, t.y - 50, '💢💨', '#fff', true); CG.UI.toast('📌 Promesse tenue : ' + f.name + ' est content. ' + t.name + ' file travailler deux fois plus vite pendant 30 s. (moral ' + o[1] + ')'); }
      else if (o[1] > 0) { t.ami = CG.clamp((t.ami || 0) + 1, -6, 6); G.text(t.x, t.y - 50, '❤️', '#fff', true); CG.UI.toast('📌 Promesse tenue ! ' + f.name + ' et ' + t.name + ' te remercient. (moral +' + o[1] + ')'); }
      else { t.ami = CG.clamp((t.ami || 0) - 2, -6, 6); G.text(t.x, t.y - 50, '💢', '#fff', true); CG.UI.toast('📌 Promesse tenue, mais durement : ' + t.name + ' fait la tête. (moral ' + o[1] + ')'); }
      CG.sfx('ok');
    } })) });
  }
  Soc.taskDialog = taskDialog;
  Soc.taskOpt = g => { const k = g.met && Soc.taskFor(g); return k ? [{ label: '📌 Lui parler de la part de ' + k.from.name, sub: 'Ta promesse à ' + k.from.name + '... tu te souviens à quel sujet ?', active: true, fn: () => (k.quiz ? quizDialog(k) : taskDialog(k)) }] : []; };
  // le soir venu, les promesses oubliées se paient
  Soc.endDay = function (lines) {
    const S = CG.S; Soc.tasks().forEach(k => { S.morale = Math.max(0, S.morale - 3); k.from.ami = CG.clamp((k.from.ami || 0) - 2, -6, 6); lines.push('😞 Tu avais promis à ' + k.from.name + ' de ' + fill(k.def.but, k.from, k.to) + '... et tu n\'y es pas allé. (moral -3)'); });
    CG.R.tasks = [];
  };
  function askDialog(g) {
    if (Soc.tasks().length < 2 && Math.random() < 0.4 && errandDialog(g)) return;
    const q = pick(Q), opts = CG.shuffle(q.slice(1)).map(a => ({ label: a[0].replace('{n}', g.name).replace(/\{e\}/g, g.sex === 'f' ? 'e' : ''), fn: () => react(g, a[1], a[2] === 'boost', a[3]) }));
    CG.UI.dialog({ goblin: g, who: g.name, tag: 'vient te poser une question', text: q[0].replace(/\{e\}/g, g.sex === 'f' ? 'e' : ''), options: opts });
  }
  // appelé par la routine du gobelin tant qu'il cherche le chef
  G.askStep = function (g, dt) {
    const S = CG.S, R = CG.R, p = S.player; g.ask.t -= dt;
    if (g.ask.t <= 0 || R.alarm || R.ko > 0 || !Soc.inVillage() || CG.Soc.combat()) { g.ask = null; G.resetGoblin(g); return false; } // le chef est sorti du village : la question attendra
    const d = CG.dist(g, p); g.bubble = '❓'; g.pose = null;
    if (d > 54) { g.repath -= dt; if (!g.path || !g.path.length || g.repath <= 0) { G.goTo(g, p.x, p.y + 6); g.repath = 1; } G.follow(g, 200, dt); return true; }
    g.moving = false; g.face = p.x > g.x ? 1 : -1;
    if (!CG.UI.modal && !R.cine) { g.ask = null; G.resetGoblin(g); askDialog(g); }
    return true;
  };

  // ---------- la cour, le soir autour du feu ----------
  const OPEN = [
    ['Tu viens danser avec moi, chef ?', ['Tu danses mieux que les flammes elles-mêmes.', 1], ['J\'ai gardé la plus belle baie de la récolte pour toi.', 1], ['Bouge de là, tu me caches le feu.', -1], ['Tu danses comme un sanglier, mais bon.', -1]],
    ['Oh, chef ! Tu as vu comme la lune est belle ce soir ?', ['Elle est belle, mais moins que ton sourire.', 1], ['Viens, je connais un coin d\'où on la voit encore mieux.', 1], ['C\'est juste un caillou dans le ciel.', -1], ['Arrête de rêvasser, tu as du travail demain.', -1]],
    ['Chef ! Tu t\'es bien battu aujourd\'hui. J\'ai eu peur pour toi.', ['Je pensais à toi, ça m\'a donné du courage.', 1], ['Tant que je serai là, personne ne te fera de mal.', 1], ['Évidemment, je suis le plus fort. Pas comme vous.', -1], ['Peur ? Occupe-toi plutôt de tes affaires.', -1]]
  ];
  Soc.courtable = g => g.sex !== ((CG.Art8.chiefLook() || {}).sex || 'm') && !g.child && !g.bebe; // qui peut tomber en amour avec le chef : l'autre sexe, et jamais ses propres enfants
  Soc.talk = function (g) {
    const S = CG.S, R = CG.R, UI = CG.UI;
    if (g.exile) return;
    if (!(R.fireLit && g.state === 'party' && Soc.courtable(g) && g.met && !R.alarm && !R.cine)) return UI.talkGoblin(g);
    if (g.courtDay === S.day) return UI.dialog({ goblin: g, who: g.name, text: 'On a assez parlé pour ce soir, chef. Laisse-moi danser !', options: [{ label: 'Bonne soirée, ' + g.name + '.' }] });
    UI.dialog({ goblin: g, who: g.name, tag: 'danse autour du feu', text: pick(CG.LINES.soir), options: Soc.taskOpt(g).concat([
      { label: '💕 Lui faire la cour', sub: 'Tenter de fonder une famille avec ' + (g.sex === 'f' ? 'elle' : 'lui'), fn: () => court(g) },
      { label: '💬 Discuter', sub: 'Jaser un peu avec ' + (g.sex === 'f' ? 'elle' : 'lui'), fn: () => Soc.chat(g) },
      { label: '🛠 Modifier le travail', sub: 'Lui donner un autre métier', fn: () => UI.jobDialog(g) }, { label: g.sex === 'f' ? '👋 La laisser danser' : '👋 Le laisser danser' }]) });
  };
  function court(g) {
    const S = CG.S, UI = CG.UI; g.courtDay = S.day;
    if (S.goblins.length >= G.capacity()) return UI.dialog({ goblin: g, who: g.name, text: 'Hi hi, chef... Mais regarde : les huttes sont pleines à craquer. Où dormiraient les petits ? Bâtis d\'abord une hutte, et on en reparle.', options: [{ label: 'Tu as raison. Je m\'en occupe.' }] });
    if ((g.ami || 0) <= -2) return UI.dialog({ goblin: g, who: g.name, text: 'Après ce que tu m\'as dit l\'autre jour ? Non merci, chef. Sois d\'abord gentil avec moi.', options: [{ label: 'Je ferai mieux, promis.' }] });
    if (CG.Amour && CG.Amour.stage(g) >= 2) return round2(g); // déjà en amour : pas besoin de briser la glace
    const o = pick(OPEN);
    UI.dialog({ goblin: g, who: g.name, tag: '💕', text: o[0], options: CG.shuffle(o.slice(1)).map(a => ({ label: a[0], fn: () => a[1] > 0 ? round2(g) : refuse(g, -3) })) });
  }
  function refuse(g, delta) { react(g, delta); }
  function round2(g) {
    G.text(g.x, g.y - 50, '💕', '#fff', true);
    CG.UI.dialog({ goblin: g, who: g.name, tag: '💕', text: CG.Amour && CG.Amour.stage(g) >= 2 ? pick(CG.Amour.SOIR) : 'Hi hi ! Tu sais parler, toi. Et... qu\'est-ce que tu veux vraiment, chef ?', options: CG.shuffle([
      { label: 'Fonder une famille avec toi, si tu le veux aussi.', fn: () => accept(g) },
      { label: 'Juste danser encore un peu avec toi.', fn: () => { react(g, 1); } },
      { label: 'Je suis le chef. Tu fais ce que je dis.', fn: () => refuse(g, -5) }]) });
  }
  function accept(g) {
    const S = CG.S, R = CG.R, p = S.player, free = G.capacity() - S.goblins.length;
    if (free <= 0 || R.alarm) return;
    const r = Math.random(), n = Math.min(free, (r < 0.35 ? 1 : r < 0.7 ? 2 : r < 0.9 ? 3 : 4) + (CG.Amour ? CG.Amour.bebes(g) : 0)), door = G.door(G.find('chief'));
    CG.UI.toast('💕 ' + g.name + ' : « Oui ! Viens, allons dans ta hutte. »'); S.morale = Math.min(100, S.morale + 2); g.ami = Math.min(6, (g.ami || 0) + 2);
    G.resetGoblin(g); g.cine = true; g.state = 'cine'; G.goTo(g, door.x - 12, door.y);
    p.path = W.path(p.x, p.y, door.x + 12, door.y); R.build = null;
    R.cine = { g, phase: 'walk', n, shown: 0, t: 1.2, door };
  }
  G.cineStep = function (g, dt) { if (!g.hidden) G.follow(g, 170, dt); g.pose = null; };
  function endCine() { const R = CG.R; if (R.cine) { R.cine.g.cine = false; R.cine.g.hidden = false; G.resetGoblin(R.cine.g); R.cine = null; } }
  Soc.endCine = endCine;

  Soc.inVillage = () => CG.dist(CG.S.player, G.firePos()) < 480;
  Soc.combat = () => { const R = CG.R; return R.playerCombatUntil > R.t || !!R.horde; };
  // combien de temps entre deux questions, selon la difficulté : ×1 = une toutes les 55 à 95 secondes (comme avant).
  // Plus c'est facile, plus on laisse le chef tranquille ; en Élite et en Cauchemar, les gobelins restent bavards.
  Soc.CALME = { facile: 5, normal: 4, difficile: 3, elite: 1.4, cauchemar: 1 }; Soc.REPIT = 30;
  Soc.calme = () => Soc.CALME[CG.Diff ? CG.Diff.id() : 'difficile'] || 1;
  Soc.update = function (dt) {
    const S = CG.S, R = CG.R, p = S.player, c = R.cine;
    if (c) {
      if (R.alarm || !S.goblins.includes(c.g)) return endCine();
      if (c.phase === 'walk') {
        const arrived = G.follow0(p, 92, dt), ga = !c.g.path || !c.g.path.length;
        if (arrived && ga) { c.phase = 'hut'; c.g.hidden = true; c.t = 1.1; G.puff(c.door.x, c.door.y - 20, '#ffb0d0', 14, 80, 4); }
      } else if (c.phase === 'hut') {
        c.t -= dt; if (Math.random() < dt * 3) G.text(c.door.x + rand(-34, 34), c.door.y - rand(70, 120), '💕', '#fff');
        if (c.t <= 0) { c.shown = c.n; c.phase = 'end'; CG.D.startNight(); } // la nuit tombe tout de suite : les « +1 👶 » s'affichent pendant qu'elle passe (nuit.js)
      }
      return;
    }
    // un villageois vient poser une question (de jour, au calme)
    if (R.alarm || S.hour < 7 || S.hour > 18.3 || R.ko > 0) return;
    if (CG.UI.modal) { Soc.timer = Math.max(Soc.timer, Soc.REPIT); return; } // le chef lit ou discute déjà : l'attente ne court pas, et on lui laisse un répit ensuite
    Soc.timer -= dt; if (Soc.timer > 0) return;
    if (Soc.combat()) { Soc.timer = 6; return; } // le chef se bat : personne ne vient le déranger
    if (!Soc.inVillage()) { Soc.timer = 4; return; } // on ne dérange le chef que dans le village
    Soc.timer = rand(55, 95) * Soc.calme();
    if (S.goblins.some(g => g.ask)) return;
    const cand = S.goblins.filter(g => g.met && !g.hidden && !g.exile && !g.carry && !g.log && g.state !== 'fight' && CG.dist(g, p) < 900);
    if (cand.length) { const g = pick(cand); G.resetGoblin(g); g.ask = { t: 50 }; g.repath = 0; }
  };

  // ---------- chantiers : ce qu'on pose doit être bâti par des gobelins ----------
  G.siteNeed = type => { const c = CG.BUILDS[type].cout; let s = 0; for (const k in c) s += c[k]; return 4 + s * 0.45; };
  G.sites = () => CG.S.buildings.filter(b => b.site);
  G.finishBuild = function (b) {
    const S = CG.S, R = CG.R, d = CG.BUILDS[b.type];
    W.unblock(b); delete b.site; delete b.prog; delete b.need; W.blockBuilding(b); if (CG.BUILDS[b.type] && CG.BUILDS[b.type].barrier) CG.S.goblins.concat(CG.R.visitors, CG.S.pets, CG.R.enemies, [CG.S.player]).forEach(e => { if (!e.struct) G.unstick(e, 8); }); delete b.ruin; { const mh = G.buildMaxHp(b); if (mh) b.hp = mh; else delete b.hp; }
    const c = { x: (b.tx + b.w / 2) * T, y: (b.ty + b.h / 2) * T }, door = G.door(b);
    G.puff(c.x, c.y, '#ffe36b', 22, 130, 4); G.text(c.x, c.y - 56, d.nom + ' terminé' + (['hut', 'cloture', 'clotureFer', 'palissade', 'douve', 'tower', 'tourMagie', 'torche', 'baliste', 'scierie', 'caserne', 'taverne', 'marmite', 'chaman', 'chief', 'souschef', 'stock'].includes(b.type) ? 'e' : '') + ' !', '#ffe36b', true); if (CG.onScreen(c.x, c.y)) CG.sfx('build');
    // personne ne reste coincé dans les murs
    const inside = e => Math.floor(e.x / T) >= b.tx && Math.floor(e.x / T) < b.tx + b.w && Math.floor(e.y / T) >= b.ty && Math.floor(e.y / T) < b.ty + b.h;
    G.unstick(S.player, 9);
    S.goblins.concat(R.enemies, R.visitors, S.pets).forEach(e => { if (!e.struct) G.unstick(e, 8); });
    S.goblins.forEach(g => { if (g.siteB === b) { g.siteB = null; if (g.state === 'build' || g.state === 'toSite') { g.state = 'idle'; g.pose = null; g.timer = 0.5; } } else if (g.path && g.path.length) { const e = g.path[g.path.length - 1]; if (!G.goTo(g, e.x, e.y)) G.resetGoblin(g); } });
  };
  // renvoie vrai si le gobelin est occupé sur un chantier
  G.buildJob = function (g, dt) {
    let b = g.siteB && g.siteB.site && !g.siteB.gone ? g.siteB : null;
    if (!b) {
      let bd = 1e9; for (const s of CG.S.buildings) { if (!s.site) continue; const d = Math.hypot((s.tx + s.w / 2) * T - g.x, (s.ty + s.h) * T - g.y); if (d < bd) { bd = d; b = s; } }
      if (!b) { g.siteB = null; if (g.state === 'build' || g.state === 'toSite') { g.state = 'idle'; g.pose = null; } return false; }
      const d = G.door(b); if (!G.goTo(g, d.x + rand(-b.w * 14, b.w * 14), d.y - 8 + rand(-4, 6))) return false;
      g.siteB = b; g.state = 'toSite'; g.bubble = null;
    }
    if (g.state === 'toSite') { if (G.follow(g, 96, dt)) { g.state = 'build'; g.face = (b.tx + b.w / 2) * T > g.x ? 1 : -1; } return true; }
    if (g.state !== 'build') { g.siteB = null; return false; }
    g.moving = false; g.pose = 'work'; G.buildWork(b, dt * G.workSpeed(g), g);
    return true;
  };
  G.buildWork = function (b, amount, who) {
    b.prog += amount;
    if (Math.random() < amount * 1.5) { G.puff((b.tx + Math.random() * b.w) * T, (b.ty + b.h) * T - 10 - Math.random() * 30, '#c9a56b', 2, 50, 2.5); if (CG.onScreen(who.x, who.y)) CG.sfx('chop'); }
    if (b.prog >= b.need) G.finishBuild(b);
  };
})(window.CG);
