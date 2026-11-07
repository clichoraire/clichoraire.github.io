// Les cours de l'école (attaque, protection, effet). Un professeur prend la place de l'adversaire dans la salle de duel :
//   1. on choisit un sort, il explique ce que ça fait ;
//   2. leçon : tracé guidé à l'écran, puis « 3 fois de suite » pendant que le modèle s'efface ;
//   3. défis, qui rapportent de l'expérience (jamais d'or) et une médaille : bronze, argent, or.
// Le duel (js/duel.js) nous prévient de chaque tracé et de chaque sort qui touche ; on lui dit quoi afficher (DS.duel.school).
(function () {
  'use strict';
  var DS = window.DS, A = DS.art, SFX = DS.audio;
  var $ = function (id) { return document.getElementById(id); };
  var byId = function (id) { return DS.byId(DS.SPELLS, id); };

  // ───────────────────────── Réglages ─────────────────────────
  var LESSON_XP = 20;              // expérience pour une leçon réussie (la première fois seulement)
  var MEDAL_XP = [0, 10, 25, 45, 70];  // expérience totale gagnée sur un défi selon la meilleure médaille : aucune, bronze, argent, or, diamant
  var MEDALS = ['', '🥉', '🥈', '🥇', '💎'], MEDAL_NAMES = ['', 'bronze', 'argent', 'or', 'diamant'];

  DS.PROFS = {
    attaque: { id: 'prof-attaque', name: 'Professeur Brasier', title: '', robe: '#7a1f1f', trim: '#ffb347', hair: '#e8e2d4', skin: '#e3b48f', hairStyle: 'short' },
    protection: { id: 'prof-protection', name: 'Professeure Égide', title: '', robe: '#1f4f7a', trim: '#ffd978', hair: '#6b4a2a', skin: '#f3cba8', hairStyle: 'braids', glasses: true, collar: 'ruff', hat: 'tall', pattern: 'stars' },
    effet: { id: 'prof-effet', name: 'Professeur Mirage', title: '', robe: '#4a2a7a', trim: '#9fe8c0', hair: '#1c1b26', skin: '#c88f68', hairStyle: 'long', stache: 'giant', hat: 'turban', hatCol: '#e9dcc0', pattern: 'moons', accent: '#3fb58a' },
    analyse: { id: 'prof-analyse', name: 'Professeur Oculus', title: '', robe: '#2f5a3a', trim: '#e9c46a', hair: '#d8d0c0', skin: '#e8c4a0', bald: true, beard: 'long', brows: 'bushy', glasses: 'mono', collar: 'high', hat: 'none', pattern: 'dots', pat: '#9fd8a8' } // le cours d'analyse des tirs magiques (js/classe.js)
  };
  // Ce que dit le professeur de chaque sort : [ce que ça fait, comment le tracer].
  var TEXT = {
    scintilla: ['Scintilla, c’est une petite étincelle. Elle ne fait pas très mal, mais elle part vite et ne coûte presque rien. Parfaite pour embêter ton adversaire sans arrêt !', 'Un simple trait, d’un côté à l’autre.'],
    fulgur: ['Fulgur, c’est un éclat d’énergie pure. Il file si vite que ton adversaire a rarement le temps de le bloquer.', 'Un Z : un trait, une diagonale, un trait. Sans lever la baguette !'],
    ignis: ['Ignis, c’est une grosse boule de feu. Elle avance lentement, mais elle fait très mal, et l’adversaire continue de brûler après.', 'Un triangle. Ferme-le bien : reviens à ton point de départ.'],
    sagitta: ['Sagitta, c’est une flèche de lumière. Elle file plus vite que tous les autres sorts : ton adversaire n’a presque jamais le temps de la bloquer. Elle ne fait pas très mal, mais elle arrive !', 'Une flèche vers le haut : la pointe d’abord, comme un petit toit, reviens au sommet, puis descends tout droit.'],
    terra: ['Terra lance un gros cube de terre, lourd et rapide. Et contre un mur magique, chaque cube compte pour quatre coups !', 'Un carré : quatre côtés, et tu reviens à ton point de départ. Marque bien les coins !'],
    tonnero: ['Tonnero, c’est la foudre ! Elle frappe ta cible, puis saute sur tout ce qui est collé à elle. Si ton adversaire s’est dédoublé avec Copius, la foudre traverse ses copies et trouve le vrai.', 'Un U carré : tu descends, tu pars sur le côté, puis tu remontes.'],
    vespera: ['Vespera est une vague d’ombre. Même si ton adversaire la bloque, la moitié des dégâts traverse son bouclier.', 'Un C, comme un croissant de lune.'],
    toxicus: ['Toxicus empoisonne ton adversaire : sa vie fond petit à petit pendant plusieurs secondes. Seul Antidotum l’en débarrasse.', 'Un 8 couché, le signe de l’infini. Reviens à ton point de départ.'],
    tremor: ['Tremor est sournois. Quand il touche, il ne se passe rien… Puis ton adversaire se met à trembler, de plus en plus fort, et perd de la vie trois fois de suite. S’il lance une protection à temps, tout s’annule.', 'Un M : deux montagnes.'],
    tornado: ['Tornado souffle une tornade : elle blesse, elle interrompt à coup sûr le sort que ton adversaire est en train de tracer, et elle chasse sa brume.', 'Un S.'],
    radius: ['Radius fait sortir un rayon rouge de ta baguette pendant trois secondes et demie. Promène-le sur ton adversaire : il blesse deux fois par seconde. Son petit bouclier va courir après ton rayon, alors bouge !', 'Un Σ : un trait vers la gauche, un zigzag, un trait vers la droite.'],
    infernus: ['Infernus, c’est le souffle du dragon : un torrent de feu que tu diriges avec ta baguette. C’est le sort le plus puissant de l’école, et ton adversaire brûle encore après.', 'Une étoile à cinq branches, d’un seul trait. Prends ton temps : elle est difficile !'],
    foudrus: ['Foudrus est un éclair à retardement. Tu le lances… et il ne se passe rien. Deux secondes plus tard, la foudre tombe du ciel sur ton adversaire. Quand c’est lui qui te le lance, l’anneau apparaît toujours en haut de l’écran : c’est là qu’il faut parer.', 'Un éclair : en biais vers la gauche, un petit trait vers la droite, puis en biais vers la gauche.'],
    flammurus: ['Flammurus est un mur de feu qui balaie toute la salle. Aucun bouclier ne l’arrête : il faut un vrai sort de protection, comme Aegis. Et si ton adversaire s’est dédoublé, le mur brûle toutes ses copies d’un coup.', 'Trois flammes : on monte, on descend, trois fois de suite, d’un seul geste.'],
    vortex: ['Vortex est une magie puissante : un immense tourbillon d’eau enferme ton adversaire pendant cinq secondes. Il perd de la vie à chaque seconde et ne voit plus rien, comme sous l’eau. Son signe est long, mais une fois tracé, le tourbillon fonce.', 'Un trèfle à trois feuilles : trois boucles qui repassent chaque fois par le centre. Prends ton temps.'],
    glacius: ['Glacius enferme ton adversaire dans un cube de glace. Pendant deux secondes, il ne peut plus bouger ni se protéger : profites-en pour l’attaquer tout de suite ! Ses protections déjà lancées, elles, restent en place.', 'Un V : tu descends, puis tu remontes.'],
    desarmo: ['Désarmo fait voler la baguette de ton adversaire. Sans baguette, pas de sort ! Il doit la rattraper pendant qu’elle retombe… et toi aussi, quand ça t’arrivera.', 'Un cercle. Reviens bien à ton point de départ.'],
    lentus: ['Lentus ralentit ton adversaire : il réfléchit et trace ses sorts aussi vite qu’une tortue.', 'Un L : tu descends, puis tu pars sur le côté.'],
    aqua: ['Aqua lui envoie de l’eau en pleine figure ! Il voit trouble et vise à côté.', 'Un W, comme une vague : en bas, en haut, en bas, en haut.'],
    vitus: ['Vitus est le contraire de Lentus : la baguette de ton adversaire s’emballe ! Ses gestes partent trop vite et trop loin, et il rate ses formes compliquées.', 'Un L à l’envers : tu montes, puis tu pars sur le côté.'],
    fractura: ['Fractura brise les boucliers de ton adversaire : pendant cinq à six secondes, il ne peut plus rien bloquer.', 'Un coin : tu pars vers la droite, puis tu descends.'],
    gravitas: ['Gravitas rend sa baguette lourde comme une enclume : elle descend toute seule, et il doit sans cesse la remonter.', 'Une flèche vers le bas : la pointe d’abord, comme un V, reviens au creux, puis remonte tout droit.'],
    tenebra: ['Tenebra l’aveugle : il ne voit plus rien, rate presque tous ses sorts et ne bloque plus les tiens.', 'Un N : tu montes, tu descends en diagonale, tu remontes.'],
    lumina: ['Lumina l’éblouit : il ne voit plus qu’un grand éclair blanc, et sa vue ne revient que tout doucement.', 'Un crochet ] : à droite, en bas, puis à gauche.'],
    murus: ['Murus dresse un mur de pierre entre vous deux. Plus aucun sort ne passe ! Il faut cinq coups d’attaque, les tiens ou les siens, pour l’abattre.', 'Des créneaux, comme en haut d’un château : tu montes, à droite, tu descends un peu, à droite, tu remontes, à droite, et tu redescends.'],
    siphon: ['Siphon vole de l’énergie magique à ton adversaire pour remplir la tienne.', 'Un J : tu descends, puis tu fais un crochet vers la gauche.'],
    silencio: ['Silencio lui coupe le sifflet : pendant six secondes, il ne peut plus lancer un seul sort d’attaque.', 'Un poisson : pars d’en haut à droite, fais la boucle à gauche, et ressors en bas à droite.'],
    inversium: ['Inversium met tout à l’envers pour lui : sa gauche devient sa droite, son haut devient son bas.', 'Des dents de scie : tu montes, tu descends en biais, tu montes, tu descends en biais, tu montes.'],
    somnus: ['Somnus l’endort debout : ses gestes ralentissent et, quand ses yeux se ferment, il ne bloque plus rien.', 'Une spirale : pars du centre et tourne en t’éloignant, deux tours.'],
    ritardo: ['Ritardo est un sablier. Pendant dix secondes, chaque blessure que reçoit ton adversaire est notée… et à la fin, il les reçoit toutes une seconde fois, d’un seul coup.', 'Un sablier : un Z, puis tu remontes en biais jusqu’à ton point de départ.'],
    atchoum: ['Atchoum fait éternuer ton adversaire quatre fois. À chaque éternuement, il baisse la tête, rate son tracé et lâche son bouclier.', 'Un A : le toit, puis on remonte à moitié et on trace la barre.'],
    myopia: ['Myopia brouille la vue de ton adversaire, comme s’il avait perdu ses lunettes : il vise mal et pare moins bien.', 'Un X d’un seul geste : en biais vers le bas, on remonte tout droit, puis en biais dans l’autre sens.'],
    aegis: ['Aegis t’entoure d’un dôme doré qui avale le prochain sort qui te touche. Lance-le quand tu vois venir un gros sort !', 'Un toit : tu montes, puis tu redescends.'],
    calor: ['Calor te réchauffe : pendant un bon moment, les sorts de glace ne te font plus rien. Et si tu es déjà dans un glaçon, il fond tout de suite.', 'Un V, puis un grand trait qui retraverse la première branche.'],
    tenax: ['Tenax te donne une poigne de fer : Désarmo ne peut plus t’arracher ta baguette.', 'Un cercle, puis une barre qui le traverse de haut en bas et dépasse en dessous.'],
    absorbo: ['Absorbo avale la prochaine attaque qui te touche et change tous ses dégâts en énergie magique. Plus l’attaque est forte, plus tu gagnes !', 'Un > : tu descends en biais vers la droite, puis tu reviens vers la gauche.'],
    vapor: ['Vapor t’entoure de brume : un sort sur deux te passe à côté. Attention, le vent de Tornado la chasse.', 'Une boucle, comme un l en lettres attachées.'],
    copius: ['Copius te dédouble : vous êtes trois, et un seul est le vrai ! Tes copies font les mêmes gestes que toi, mais leurs sorts ne font rien. Dès que l’adversaire touche le vrai, les copies disparaissent.', 'Un 3.'],
    puritas: ['Puritas te lave de tous tes maléfices d’un seul coup : gel, sommeil, poison, brûlure… tout s’en va.', 'Trois boucles à la suite, comme un ressort. C’est un sort puissant : il demande de l’adresse.'],
    stabilis: ['Stabilis t’aide à rester concentré : les deux prochains sorts qui t’atteignent, touchés ou parés, ne peuvent pas interrompre ton tracé ni ton rayon. Pour venir à bout du Stabilis d’un adversaire, deux petites Scintilla suffisent.', 'Un H : on descend, on remonte à moitié, on traverse, on monte, puis on redescend jusqu’en bas.'],
    cura: ['Cura te rend un peu de vie.', 'Un cœur : pars de la pointe du bas.'],
    antidotum: ['Antidotum chasse le poison, et t’en protège pendant quelques secondes.', 'Le signe racine : un petit trait qui descend, un grand qui remonte, puis tout droit vers la droite.'],
    magnus: ['Magnus fait grossir le cercle de ton bouclier pendant quinze secondes : les sorts sont bien plus faciles à parer.', 'Un cercle, puis une queue qui file vers la droite.'],
    amplio: ['Amplio rend tes trois prochaines attaques plus fortes de moitié.', 'Un escalier : deux marches qui descendent.'],
    sana: ['Sana te rend beaucoup de vie d’un coup.', 'Un battement de cœur : un trait, un pic vers le haut, un pic vers le bas, un trait.'],
    fortis: ['Fortis double la force de tes attaques pendant quelques secondes. Enchaîne vite !', 'Un P : tu montes, puis tu fais la boucle.'],
    speculum: ['Speculum pose un miroir devant toi : le prochain sort qui te touche repart tout seul vers celui qui l’a lancé.', 'Une arche : tu montes, tu traverses, tu redescends.'],
    vigor: ['Vigor fait remonter ta vie toute seule, seconde après seconde.', 'Deux Z, l’un sous l’autre, sans lever la baguette.'],
    bastion: ['Bastion te fait une peau de pierre : pendant dix secondes, les attaques te font deux fois moins mal.', 'Une couronne : un U carré, puis trois pointes pour la refermer. C’est une grande forme : applique-toi !'],
    preparus: ['Preparus met ta prochaine attaque en réserve : au lieu de partir, elle flotte à côté de toi. Tu peux continuer à lancer d’autres sorts, et cliquer sur elle quand tu veux pour l’envoyer. Attention : elle clignote, puis s’éteint au bout d’un moment.', 'Un T : la barre vers la droite, on revient au milieu, puis on descend.'],
    conjura: ['Conjura appelle un animal magique qui attaque à tes côtés pendant sept secondes. Trace d’abord le chapeau, puis tout de suite le signe de ton animal : un V pour le hibou, un W pour le dragonnet, un rond pour le crapaud.', 'Un chapeau haut-de-forme : le bord, on monte, le dessus, on redescend, le bord. Puis vite : V, W ou rond !']
  };
  var DEMO = { aegis: 'scintilla', calor: 'glacius', tenax: 'desarmo', absorbo: 'scintilla', speculum: 'scintilla', antidotum: 'toxicus' };             // sort que lance le professeur pour montrer qu'une protection marche
  var ORDERS = { glacius: 'Gèle-le !', desarmo: 'Fais voler sa baguette !', lentus: 'Ralentis-le !', aqua: 'Arrose-le !', tenebra: 'Plonge-le dans le noir !', somnus: 'Endors-le !', vitus: 'Emballe sa baguette !', fractura: 'Brise ses boucliers !',
    gravitas: 'Alourdis sa baguette !', lumina: 'Éblouis-le !', murus: 'Dresse un mur !', siphon: 'Vole son énergie !', silencio: 'Fais-le taire !', inversium: 'Mets-le à l’envers !', ritardo: 'Lance le sablier !', atchoum: 'Fais-le éternuer !', myopia: 'Brouille-lui la vue !' };
  var DUMMIES = [ // mannequins et leur point faible
    { kind: 'glace', label: 'Mannequin de glace', icon: '🧊', want: 'ignis', why: 'la glace fond avec le feu : <b>Ignis</b>' },
    { kind: 'fer', label: 'Mannequin de fer', icon: '🔩', want: 'tonnero', why: 'le fer attire la foudre : <b>Tonnero</b>' },
    { kind: 'petard', label: 'Mannequin pétard', icon: '🧨', want: 'scintilla', why: 'une étincelle suffit à allumer la mèche : <b>Scintilla</b>' }
  ];

  var host = null, cat = null, prof = null, view = 'menu', L = null, C = null, run = 0, ticker = 0;
  var api = function () { return DS.duel.school; };
  var now = function () { return DS.duel.state ? DS.duel.state.time : 0; };
  var done = function (id) { return !!host.save.lessons[id]; };
  var TRAIN = { id: 'entrainement', of: '' }, training = function () { return cat === TRAIN; }; // la salle d'entraînement : pas un cours, juste le mannequin
  // Les sorts du menu. Salle d'entraînement : tous ceux qu'on a achetés. Cours d'attaque : les leçons se donnent en classe, donc devant le mannequin
  // on ne montre que les sorts dont la leçon est réussie. Protection (qui enseigne aussi les renforts) et effet : tous ceux du cours.
  var spells = function () {
    if (training()) return DS.SPELLS.filter(function (s) { return host.save.owned.indexOf(s.id) >= 0; });
    var list = DS.SPELLS.filter(function (s) { return DS.byId(DS.CATS, s.cat).course === cat.id; });
    return cat.id === 'attaque' ? list.filter(function (s) { return done(s.id); }) : list;
  };
  // Les seules formes reconnues devant le mannequin : celles des sorts qu'on a le droit d'y lancer (toutes, dans les cours de protection et d'effet).
  var allowed = function () {
    if (training()) return spells().map(function (s) { return s.glyph; });
    return cat.id === 'attaque' ? DS.SPELLS.filter(function (s) { return done(s.id); }).map(function (s) { return s.glyph; }) : null;
  };
  var doneList = function () { return spells().filter(function (s) { return done(s.id); }); };
  var medal = function (id) { return host.save.medals[id] || 0; };
  var secs = function (v) { return (Math.round(v * 10) / 10).toFixed(1).replace('.', ','); };
  function later(ms, fn) { var r = run; setTimeout(function () { if (r === run && DS.duel.state) fn(); }, ms); } // annulé si on a changé d'exercice entre-temps
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function picks(list, n) { // n éléments au hasard, jamais deux fois le même de suite si on a le choix
    var out = [], last = null;
    while (out.length < n) { var x = list[Math.floor(Math.random() * list.length)]; if (x === last && list.length > 1) continue; out.push(x); last = x; }
    return out;
  }

  // ───────────────────────── Affichage ─────────────────────────
  // Bulle du professeur : texte, puis boutons [{ label, primary, fn }].
  function say(html, buttons) {
    $('say-who').textContent = prof.name; $('say-text').innerHTML = A.spellRefs(html); // les noms de sorts avec leur signe
    $('say-btns').innerHTML = (buttons || []).map(function (b, i) { return '<button class="btn' + (b.primary ? ' primary' : ' ghost') + '" data-i="' + i + '">' + b.label + '</button>'; }).join('');
    $('say-btns').querySelectorAll('button').forEach(function (el) { el.addEventListener('click', function () { buttons[+el.dataset.i].fn(); }); });
    $('say').classList.remove('hidden'); $('say').classList.remove('pop'); void $('say').offsetWidth; $('say').classList.add('pop');
    A.spellTips($('say-text'));
  }
  function hud(html) { $('school-hud').innerHTML = html || ''; $('school-hud').classList.toggle('hidden', !html); }
  function level() { var s = host.save; $('school-lvl').textContent = '⭐ Niveau ' + s.plv + ' · ' + s.xp + ' / ' + DS.xpNeed(s.plv) + ' XP'; }
  function gain(xp) { // ajoute l'expérience et retourne la phrase à afficher
    if (!xp) return '';
    var ups = host.addXp(xp); level();
    if (ups) setTimeout(SFX.levelUp, 300);
    return ' <b class="xp">+' + xp + ' XP</b>' + (ups ? '<br>⭐ Niveau ' + host.save.plv + ' ! Un point de talent et un point de sort t’attendent.' : '');
  }
  function clearTicker() { clearInterval(ticker); ticker = 0; }
  function stopAll() { run++; clearTicker(); L = null; C = null; hud(''); api().reset(); api().banner(null); DS.music.duck(1); }

  // ───────────────────────── Menu du cours ─────────────────────────
  function challenges() {
    var n = doneList().length, list = [], got = function (ids) { return ids.every(done); };
    list.push({ id: cat.id + '-memoire', icon: '🧠', name: 'De mémoire', desc: 'Je dis le nom du sort, tu le traces. Sans modèle !', lock: n >= 2 ? '' : 'Réussis d’abord 2 leçons', start: startMemory });
    if (cat.id === 'attaque') {
      list.push({ id: 'rapidite', icon: '⚡', name: 'Attaque de rapidité', desc: 'Touche le mannequin 20 fois le plus vite possible.', lock: n >= 1 ? '' : 'Réussis d’abord une leçon', start: startSpeed });
      list.push({ id: 'tambour', icon: '🥁', name: 'Au rythme du tambour', desc: 'Un sort à chaque coup de tambour. Et ça accélère !', lock: n >= 1 ? '' : 'Réussis d’abord une leçon', start: startDrum });
      list.push({ id: 'caisses', icon: '📦', name: 'Casse-caisses', desc: 'Détruis 5 caisses le plus vite possible, avec n’importe quel sort.', lock: n >= 1 ? '' : 'Réussis d’abord une leçon', start: startCrates });
      list.push({ id: 'faibles', icon: '🎯', name: 'Points faibles', desc: 'Chaque mannequin a son point faible : trouve le bon sort.', lock: got(['scintilla', 'ignis', 'tonnero']) ? '' : 'Réussis d’abord les leçons de Scintilla, Ignis et Tonnero', start: startWeak });
    }
    if (cat.id === 'protection') list.push({ id: 'garde', icon: '🛡️', name: 'La bonne protection', desc: 'Je te lance des sorts : choisis vite la bonne protection.', lock: got(['aegis', 'calor', 'tenax']) ? '' : 'Réussis d’abord les leçons d’Aegis, Calor et Tenax', start: startGuard });
    if (cat.id === 'effet') list.push({ id: 'malefices', icon: '🎭', name: 'Le bon maléfice', desc: 'Je te dis quoi lui faire, tu lances le bon sort.', lock: n >= 3 ? '' : 'Réussis d’abord 3 leçons', start: startOrders });
    return list;
  }
  function menu(greeting) {
    if (training()) return trainMenu(greeting);
    stopAll(); view = 'menu'; api().only(allowed());
    var owned = host.save.owned, defs = challenges();
    if (cat.id === 'attaque' && !spells().length) { // rien à montrer tant qu'aucune leçon n'est réussie
      $('school-menu').innerHTML = '<h3>📘 Mes sorts d’attaque</h3><p class="none">Réussis d’abord une leçon en classe : le sort appris apparaîtra ici.</p>';
      $('school-menu').classList.remove('hidden'); level();
      return say('Tu n’as pas encore réussi de leçon. Retourne en classe : je t’y attends !', [{ label: 'Retour à la carte', primary: true, fn: function () { host.leave(); } }]);
    }
    $('school-menu').innerHTML = '<h3>' + (cat.id === 'attaque' ? '📘 Mes sorts d’attaque' : '📘 Leçons') + '</h3><div class="cards">' + spells().map(function (s) {
      var ok = done(s.id), m = medal('cadence-' + s.id);
      return '<button class="lesson' + (ok ? ' done' : '') + '" data-spell="' + s.id + '" style="--c:' + s.color + '"><span class="glyph-box">' + A.glyphSvg(s.glyph, s.color) + '</span><span class="txt"><b>' + s.name + '</b><small>' + s.label +
        (owned.indexOf(s.id) < 0 ? ' · 🔒 pas encore appris' : '') + '</small></span><span class="state">' + (ok ? '✓' + (m ? ' ' + MEDALS[m] : '') : 'À faire') + '</span></button>';
    }).join('') + '</div><h3>🏅 Défis <small>pour gagner de l’expérience</small></h3><div class="cards">' + defs.map(function (d, i) {
      return '<button class="defi' + (d.lock ? ' locked' : '') + '" data-defi="' + i + '"><span class="ico">' + d.icon + '</span><span class="txt"><b>' + d.name + '</b><small>' + (d.lock ? '🔒 ' + d.lock : d.desc) + '</small></span><span class="state">' + (MEDALS[medal(d.id)] || '') + '</span></button>';
    }).join('') + '</div>';
    $('school-menu').querySelectorAll('[data-spell]').forEach(function (el) { el.addEventListener('click', function () { SFX.select(); card(el.dataset.spell); }); });
    $('school-menu').querySelectorAll('[data-defi]').forEach(function (el) {
      el.addEventListener('click', function () { var d = defs[+el.dataset.defi]; if (d.lock) { SFX.fizzle(); say(d.lock + ', et ce défi s’ouvrira.'); } else { SFX.select(); d.start(d); } });
    });
    $('school-menu').classList.remove('hidden'); level();
    say(greeting || (doneList().length ? 'Te revoilà ! Choisis un sort à travailler, ou lance-toi dans un défi.' : 'Bienvenue au cours ' + cat.of + ' ! Choisis un sort : je t’explique ce qu’il fait, puis on le trace ensemble.'));
  }
  // ───────────────────────── Salle d'entraînement ─────────────────────────
  // Un mannequin, tous les sorts qu'on a achetés, et rien qui compte. On choisit le mannequin (simple, à abattre, trois de suite, qui bouge,
  // au bouclier) et, si on veut, il riposte avec de petits sorts inoffensifs : de quoi essayer aussi la parade et les protections.
  var KINDS = [
    { icon: '🎯', name: 'Mannequin simple', desc: 'Il encaisse tout, sans jamais tomber.', make: function () { return null; } },
    { icon: '❤️', name: 'Mannequin à abattre', desc: '150 points de vie. Il se relève tout seul.', make: function () { return { kind: 'mannequin', auto: true, hp: 150, maxHp: 150 }; } },
    { icon: '👥', name: 'Trois mannequins', desc: 'Pour les sorts qui en touchent plusieurs à la fois.', make: function () { return { kind: 'mannequin', row: [40, 40, 40], fallen: [0, 0, 0] }; } },
    { icon: '↔️', name: 'Mannequin qui bouge', desc: 'Il se promène : vise bien !', make: function () { return { kind: 'mannequin', auto: true, hp: 150, maxHp: 150, move: { amp: 0.14, per: 5 } }; } },
    { icon: '🛡️', name: 'Mannequin au bouclier', desc: 'Il bloque tout… sauf ce qui traverse les boucliers.', make: function () { return { kind: 'mannequin', auto: true, hp: 150, maxHp: 150, guard: true }; } }
  ];
  var RIPOSTE = ['scintilla', 'fulgur', 'ignis', 'glacius', 'desarmo'];
  var T = null; // { kind, riposte, next, total, last, best }
  function trainTarget() { api().target(KINDS[T.kind].make()); }
  function trainHud() { hud(T.total ? '<div class="prompt">💥 ' + T.last + '</div><div class="meta">Meilleur coup : ' + T.best + ' · Total : ' + T.total + '</div>' : ''); }
  function trainMenu(greeting) {
    stopAll(); view = 'menu'; api().only(allowed());
    T = T || { kind: 0, riposte: false, next: 0, total: 0, last: 0, best: 0 };
    T.total = T.last = T.best = 0; trainTarget();
    var owned = spells();
    $('school-menu').innerHTML = '<h3>🎯 Mannequin</h3><div class="chips">' + KINDS.map(function (k, i) {
      return '<button class="chip' + (i === T.kind ? ' on' : '') + '" data-kind="' + i + '" title="' + k.desc + '">' + k.icon + ' ' + k.name.replace('Mannequin ', '') + '</button>';
    }).join('') + '<button class="chip' + (T.riposte ? ' on' : '') + '" data-riposte="1" title="De petits sorts inoffensifs, pour essayer la parade et tes protections.">⚡ Il riposte' + (T.riposte ? ' ✓' : '') + '</button></div>' + DS.CATS.map(function (c) {
      var list = owned.filter(function (s) { return s.cat === c.id; });
      return list.length ? '<h3>' + c.icon + ' ' + c.name + '</h3><div class="cards">' + list.map(function (s) {
        return '<button class="lesson" data-spell="' + s.id + '" style="--c:' + s.color + '"><span class="glyph-box">' + A.glyphSvg(s.glyph, s.color) + '</span><span class="txt"><b>' + s.name + '</b><small>' + s.label + '</small></span><span class="state">' + s.icon + '</span></button>';
      }).join('') + '</div>' : '';
    }).join('');
    $('school-menu').querySelectorAll('[data-spell]').forEach(function (el) { el.addEventListener('click', function () { SFX.select(); card(el.dataset.spell); }); });
    $('school-menu').querySelectorAll('[data-kind]').forEach(function (el) { el.addEventListener('click', function () { SFX.select(); T.kind = +el.dataset.kind; var top = $('school-menu').scrollTop; trainMenu(KINDS[T.kind].name + ' : à toi !'); $('school-menu').scrollTop = top; }); });
    $('school-menu').querySelector('[data-riposte]').addEventListener('click', function () { SFX.select(); T.riposte = !T.riposte; var top = $('school-menu').scrollTop; trainMenu(T.riposte ? 'Attention, je riposte ! Pare au clic, ou protège-toi avec tes sorts. Ça ne fait pas mal.' : 'D’accord, je me tiens tranquille.'); $('school-menu').scrollTop = top; });
    $('school-menu').classList.remove('hidden'); level();
    T.next = now() + 3; clearTicker(); ticker = setInterval(trainTick, 200);
    say(greeting || 'Me voilà, solide comme un chêne ! Lance-moi tous les sorts que tu connais. Clique sur un sort de la liste pour revoir sa forme.');
  }
  function trainTick() {
    var D = DS.duel.state; if (!T || !D || D.paused || view !== 'menu' || !training()) return;
    var t = D.target; // à terre : il se relève après un instant
    if (t && !T.up && ((t.auto && t.hp <= 0) || (t.row && !t.row.some(function (hp) { return hp > 0; })))) { T.up = true; later(1600, function () { T.up = false; if (training() && view === 'menu') trainTarget(); }); }
    if (T.riposte && now() >= T.next) { T.next = now() + 4.5; api().foeCast(RIPOSTE[Math.floor(Math.random() * RIPOSTE.length)], 1.1, 2.4); }
  }
  function trainHit(e) { // un de nos sorts touche le mannequin : on compte les dégâts, et on dit ce que fait un maléfice (un mannequin ne dort pas…)
    if (!T || !e.spell) return;
    if (e.dmg > 0 && !e.blocked) { T.last = e.dmg; T.best = Math.max(T.best, e.dmg); T.total += e.dmg; trainHud(); }
    else if (e.spell.cat === 'effet' && !e.tick) api().say(e.spell.icon + ' ' + e.spell.name + ' : ' + e.spell.label.toLowerCase(), e.spell.color);
  }

  // On a cliqué sur un sort : le professeur explique ce qu'il fait.
  function card(id) {
    var s = byId(id), own = host.save.owned.indexOf(id) >= 0, m = medal('cadence-' + id), btns = [];
    if (training()) { // on garde le mannequin tel quel : on montre seulement la forme
      api().guide(s.glyph, s.color, 0.5, true);
      return say('<b class="sname">' + s.name + '</b> ' + TEXT[id][0] + '<br><i>' + TEXT[id][1] + '</i>', [{ label: 'Cacher le modèle', fn: function () { api().guide(null); $('say').classList.add('hidden'); } }]);
    }
    stopAll(); view = 'menu';
    btns.push({ label: done(id) ? 'Refaire la leçon' : '▶ Montre-moi comment faire !', primary: !done(id), fn: function () { lesson(id); } });
    if (done(id)) btns.push({ label: '⚡ Mission : cadence de ' + s.name + (m ? ' ' + MEDALS[m] : ''), primary: true, fn: function () { startCadence(id); } });
    api().guide(s.glyph, s.color, 0.5, true);
    say('<b class="sname">' + s.name + '</b> ' + TEXT[id][0] + (own ? '' : '<br><small>Tu ne l’as pas encore appris : il t’attend au magasin de magie (' + s.price + ' <i class="coin"></i>). Ici, tu peux déjà l’essayer.</small>'), btns);
  }

  // ───────────────────────── Leçon ─────────────────────────
  var HINTS = ['Presque ! Pars du point vert et suis le chemin, sans te presser.', 'Encore un essai : ne relâche qu’à la fin du chemin.', 'Tu y es presque ! Regarde la petite lumière : elle te montre le chemin.'];
  function lesson(id) {
    var s = byId(id);
    stopAll(); view = 'lesson'; $('school-menu').classList.add('hidden');
    L = { spell: s, step: 'guide', reps: 0, miss: 0 };
    api().guide(s.glyph, s.color, 0.6, true);
    say('À toi ! Garde <kbd>Espace</kbd> enfoncé et suis le chemin lumineux avec ta baguette, en partant du point vert. Relâche à la fin.<br><i>' + TEXT[id][1] + '</i>', [{ label: 'Retour', fn: function () { menu(); } }]);
  }
  function lessonGuide() { // le modèle s'efface à mesure qu'on réussit
    var s = L.spell, a = [0.3, 0.12, 0][L.reps] || 0;
    api().guide(a ? s.glyph : null, s.color, a, false);
    hud('<div class="prompt">' + s.name + ' : 3 fois de suite</div><div class="dots">' + [0, 1, 2].map(function (i) { return '<i' + (i < L.reps ? ' class="on"' : '') + '></i>'; }).join('') + '</div>');
  }
  function lessonReps() {
    L.step = 'reps'; L.reps = 0; lessonGuide();
    say('Bravo ! Maintenant, fais-le <b>3 fois de suite</b>. Attention : j’efface le chemin petit à petit…', [{ label: 'Retour', fn: function () { menu(); } }]);
  }
  function lessonTrace(e) {
    var s = L.spell;
    if (L.step === 'wait' || L.step === 'end') return e.ok ? true : null;
    if (!e.ok || e.spell !== s) {
      var msg = e.ok ? 'Ça, c’est ' + e.spell.name + ' !' : 'Raté…';
      if (L.step === 'guide') { say((e.ok ? 'Ça, c’est ' + e.spell.name + ' ! ' : '') + HINTS[L.miss++ % HINTS.length] + '<br><i>' + TEXT[s.id][1] + '</i>', [{ label: 'Retour', fn: function () { menu(); } }]); return msg; }
      if (L.reps > 0) say('Oups ! On reprend la série à zéro. Je te remontre le chemin.', [{ label: 'Retour', fn: function () { menu(); } }]);
      L.reps = 0; lessonGuide(); return msg;
    }
    if (L.step === 'guide') { // première réussite : pour une protection, le professeur montre qu'elle marche
      L.step = 'wait'; api().guide(null);
      if (DEMO[s.id]) { say('Bien ! Regarde, je te lance ' + byId(DEMO[s.id]).name + ' : ta protection s’en occupe.'); later(700, function () { api().foeCast(DEMO[s.id], 0.9, 1.8); }); later(4300, function () { if (L && L.step === 'wait') lessonReps(); }); }
      else { say(s.self ? 'Bien joué ! Regarde en haut à gauche, sous ta barre de vie : l’effet du sort s’y affiche.' : 'Bien joué ! Tu as vu ce que ça lui a fait ?'); later(s.beam ? 3800 : 1700, lessonReps); }
      return true;
    }
    L.reps++; api().say(L.reps + ' !'); SFX.select();
    if (L.reps < 3) { lessonGuide(); return true; }
    L.step = 'end'; lessonGuide(); later(900, lessonEnd);
    return true;
  }
  function lessonEnd() {
    var s = L.spell, first = !done(s.id), xp = '';
    if (first) { host.save.lessons[s.id] = true; xp = gain(LESSON_XP); host.persist(); }
    hud(''); api().guide(null); SFX.win(); DS.music.sting('bravo', { keep: true });
    say('🎓 Leçon réussie ! Tu sais lancer <b>' + s.name + '</b> sans modèle.' + xp, [
      { label: '⚡ Mission : cadence de ' + s.name, primary: true, fn: function () { startCadence(s.id); } },
      { label: 'Voir tous les défis', fn: function () { menu('Voici les défis du cours. Lequel te tente ?'); } },
      { label: 'Choisir un autre sort', fn: function () { menu('Quel sort veux-tu travailler maintenant ?'); } }
    ]);
  }

  // ───────────────────────── Défis ─────────────────────────
  // Un défi est une suite de consignes (prompts). score 'time' : le plus vite possible · 'count' : le plus de bonnes réponses, chacune en temps limité.
  // medals : seuils [bronze, argent, or, diamant] — secondes à ne pas dépasser ('time') ou bonnes réponses (ou points) à atteindre ('count').
  // cadence : { dur } — une seule consigne, le même sort autant de fois que possible pendant dur secondes ; def.good compte les points.
  function startChallenge(def) {
    stopAll(); view = 'challenge'; $('school-menu').classList.add('hidden');
    C = def; C.i = 0; C.good = 0; C.on = false;
    var best = medal(def.id), M = def.medals, unit = def.score === 'time' ? ' s' : def.cadence || def.points ? ' pts' : '';
    var goal = (def.score === 'time' ? 'Moins de… ' : def.cadence || def.points ? 'Points à atteindre : ' : 'Sur ' + def.prompts.length + ' : ') + [3, 2, 1, 0].map(function (k) { return MEDALS[k + 1] + ' ' + M[k] + unit; }).join(' · ');
    say('<b>' + def.icon + ' ' + def.name + '</b><br>' + def.intro + '<br><small>' + goal + (best ? ' — ta meilleure médaille : ' + MEDALS[best] : '') + '</small>', [
      { label: 'C’est parti !', primary: true, fn: go }, { label: 'Retour', fn: function () { menu(); } }
    ]);
  }
  function go() { // « C'est parti ! » : 3… 2… 1… GO ! — le chrono ne démarre qu'au GO
    $('say').classList.add('hidden');
    api().banner('3'); SFX.count();
    later(800, function () { api().banner('2'); SFX.count(); });
    later(1600, function () { api().banner('1'); SFX.count(); });
    later(2400, function () { if (!C || C.on) return; api().reset(); api().banner('GO !', 0.7); begin(); }); // reset : un sort lancé pendant le décompte ne compte pas
  }
  function begin() {
    SFX.go();
    C.on = true; C.t0 = now(); if (C.begin) C.begin();
    ticker = setInterval(tick, C.drum ? 25 : 100); next();
  }
  function showPrompt() {
    var p = C.prompts[C.i], t = now(), left = C.limit ? Math.max(0, C.limit - (t - p.t0)) : 0;
    if (C.drum) return drumHud();
    if (C.cadence) { // le chrono qui fond, les points, et la prochaine médaille à décrocher
      var k = C.cadence, rest = Math.max(0, k.dur - (t - C.t0)), nextM = C.medals.filter(function (v) { return v > C.good; })[0];
      return hud('<div class="prompt">' + p.say + '</div><div class="meta">⭐ ' + C.good + ' pts · ' + k.n + ' lancés · ' + k.perfect + ' parfaits' + (nextM ? ' · ' + MEDALS[C.medals.indexOf(nextM) + 1] + ' à ' + nextM : ' · 💎 !') + '</div><div class="clock"><i style="width:' + rest / k.dur * 100 + '%"></i></div>');
    }
    hud('<div class="prompt' + (p.bad ? ' bad' : '') + '">' + p.say + '</div><div class="meta">' + (C.hits ? '🎯 ' + C.n + ' / ' + C.hits : (C.i + 1) + ' / ' + C.prompts.length) + ' · ' + (C.score === 'time' ? '⏱ ' + secs(t - C.t0) + ' s' : '✔ ' + C.good) + '</div>' +
      (C.limit ? '<div class="clock"><i style="width:' + left / C.limit * 100 + '%"></i></div>' : ''));
  }
  function next() {
    if (!C || !C.on) return;
    if (C.i >= C.prompts.length) return finish();
    var p = C.prompts[C.i]; p.t0 = now();
    api().target(p.target || null);
    if (p.cast) api().foeCast(p.cast, 1.5, 3.1);
    showPrompt();
  }
  function tick() {
    if (!C || !C.on || !DS.duel.state || DS.duel.state.paused) return;
    var p = C.prompts[C.i]; if (!p || p.t0 === undefined) return;
    if (C.drum) return drumTick();
    if (C.cadence && now() - C.t0 >= C.cadence.dur) return finish();
    if (C.limit && !p.cast && now() - p.t0 > C.limit) return answer(false, 'Trop tard !');
    showPrompt();
  }
  // Bonne ou mauvaise réponse à la consigne en cours, puis consigne suivante.
  function answer(ok, msg, delay) {
    var p = C.prompts[C.i]; if (!p || p.over) return;
    p.over = true; if (ok) { C.good++; SFX.select(); } else SFX.fizzle();
    if (msg) api().say(msg, ok ? '#9dffb0' : '#ffb0a0');
    C.i++; later(delay || (ok ? 250 : 900), next);
  }
  function finish() {
    var def = C, t = now() - def.t0, m = 0, old = medal(def.id), xp = 0, i;
    C.on = false; clearTicker(); hud(''); api().reset(); DS.music.duck(1);
    for (i = 0; i < def.medals.length; i++) if (def.score === 'time' ? t <= def.medals[i] : def.good >= def.medals[i]) m = i + 1;
    if (m > old) { xp = MEDAL_XP[m] - MEDAL_XP[old]; host.save.medals[def.id] = m; }
    var top = def.medals.length, res = def.result ? def.result(def) : def.cadence ? def.good + ' points (' + def.cadence.n + ' lancés, dont ' + def.cadence.perfect + ' parfaits)' : def.score === 'time' ? secs(t) + ' secondes' : def.good + ' sur ' + def.prompts.length, txt;
    if (m) { SFX.medal(m); DS.music.sting('bravo', { keep: true }); txt = MEDALS[m] + ' Médaille ' + (m === 1 || m === 4 ? 'de ' : 'd’') + MEDAL_NAMES[m] + ' ! ' + res + '.' + (xp ? gain(xp) : '') + (m < top ? ' Prochaine médaille : ' + MEDALS[m + 1] + ' ' + (def.score === 'time' ? 'en moins de ' + def.medals[m] + ' s.' : 'à ' + def.medals[m] + (def.cadence || def.points ? ' points.' : '.')) : ' Impossible de faire mieux !'); }
    else { SFX.lose(); txt = res + ' : pas encore de médaille. Tu vas y arriver, réessaie !'; }
    host.persist();
    say(txt, [
      { label: 'Réessayer', primary: m < top, fn: function () { def.restart(); } },
      { label: 'Autres défis', fn: function () { menu('Quel défi veux-tu essayer ?'); } },
      { label: 'Retour à la carte', fn: function () { host.leave(); } }
    ]);
  }
  function challengeTrace(e) {
    if (!C.on) return e.ok ? true : null;
    var p = C.prompts[C.i]; if (!p || p.over) return e.ok ? true : null;
    if (!e.ok) return null;                                             // gribouillis : on peut réessayer
    if (C.drum) { if (e.spell.cat !== 'attaque') return 'Il faut un sort d’attaque !'; drumCast(); return true; }
    if (C.cadence) { // cadence : chaque sort réussi rapporte des points, selon la qualité du tracé
      if (e.spell.id !== p.want) return 'Ce n’est pas ' + byId(p.want).name + ' !';
      var pts = PTS[e.quality] || 1; C.good += pts; C.cadence.n++; if (e.quality === 'parfait') C.cadence.perfect++;
      api().say('+' + pts + (e.quality === 'parfait' ? ' Parfait !' : e.quality === 'bien' ? ' Bien' : ' Brouillon'), e.quality === 'parfait' ? '#ffe9a0' : e.quality === 'bien' ? '#9dffb0' : '#c9cfdd'); SFX.point(pts);
      showPrompt(); return true;
    }
    if (C.any) return e.spell.cat === 'attaque' ? true : 'Il faut un sort d’attaque !'; // casse-caisses : n'importe quel sort d'attaque
    if (C.guard) return true;                                           // protections : c'est l'arrivée du sort du professeur qui décide
    if (e.spell.id === p.want) { if (C.onHit) p.sent = true; else answer(true); return true; }
    if (C.score === 'count') { answer(false, 'C’était ' + byId(p.want).name + ' !'); return 'Ça, c’est ' + e.spell.name + ' !'; }
    return C.wrong || 'Ce n’est pas le bon sort !';                     // contre la montre : on perd juste du temps
  }

  // ⚡ Cadence : le même sort, autant de fois que possible en 20 secondes. Un tracé parfait vaut 3 points, un bon 2, un brouillon 1.
  // Les médailles suivent la longueur du tracé : l'or, c'est le rythme d'un bon duelliste avec des tracés corrects ; le diamant, le même rythme presque tout en parfait.
  var PTS = { parfait: 3, bien: 2, passable: 1 }, CADENCE_T = 20;
  function startCadence(id) {
    var s = byId(id), n = CADENCE_T / pace(s), M = [0.8, 1.4, 2, 2.7].map(function (k) { return Math.max(2, Math.round(n * k)); }), i;
    for (i = 1; i < 4; i++) M[i] = Math.max(M[i], M[i - 1] + 1);
    startChallenge({ id: 'cadence-' + id, icon: '⚡', name: 'Cadence de ' + s.name, score: 'count', cadence: { dur: CADENCE_T, n: 0, perfect: 0 }, medals: M,
      prompts: [{ want: id, say: 'Lance <b style="color:' + s.color + '">' + s.name + '</b>, encore et encore !' }],
      intro: 'Tu as ' + CADENCE_T + ' secondes : lance ' + s.name + ' le plus de fois possible. Un tracé <b>parfait</b> vaut 3 points, un bon tracé 2, un brouillon 1. Vite, souvent… et bien !', restart: function () { startCadence(id); } });
  }
  // 🧠 De mémoire : le professeur dit un nom, on trace. 8 secondes par sort.
  function startMemory(d) {
    var prompts = picks(doneList(), 8).map(function (s) { return { want: s.id, say: 'Lance <b style="color:' + s.color + '">' + s.name + '</b> !' }; });
    startChallenge({ id: d.id, icon: d.icon, name: d.name, score: 'count', limit: 8, medals: [4, 6, 7, 8], prompts: prompts,
      intro: 'Je dis le nom d’un sort, tu le traces de mémoire. Tu as 8 secondes à chaque fois, et un seul essai !', restart: function () { startMemory(d); } });
  }
  // Le rythme d'un bon duelliste : secondes par sort, selon la longueur du tracé. C'est lui qui fixe la médaille d'or des défis de vitesse.
  function pace(s) { return 0.15 + 0.9 * DS.duel.TRACE_TIME[s.glyph]; }
  function shooters() { var l = doneList().filter(function (s) { return s.cat === 'attaque' && s.dmg > 0 && !s.beam; }); return l.length ? l : [byId('scintilla')]; } // les sorts d'attaque qu'on sait lancer
  function timeMedals(gold) { // [bronze, argent, or, diamant], en secondes
    var M = [2.2, 1.5, 1, 0.78].map(function (k) { return Math.max(2, Math.round(gold * k)); }), i;
    for (i = 1; i < 4; i++) M[i] = Math.min(M[i], M[i - 1] - 1);
    return M;
  }
  // ⚡ Attaque de rapidité : on ne fait que tirer sur le mannequin. 20 sorts qui touchent, le plus vite possible.
  // Médailles fixées par Matthieu : bronze 12 s, argent 9 s, or 7 s, diamant 5 s (le chrono s'arrête quand le 20e sort touche).
  function startSpeed(d) {
    var N = 20;
    startChallenge({ id: d.id, icon: d.icon, name: d.name, score: 'time', any: true, hits: N, n: 0, medals: [12, 9, 7, 5], prompts: [{ say: 'Touche le mannequin ' + N + ' fois !' }],
      intro: 'Touche le mannequin ' + N + ' fois avec tes sorts d’attaque, le plus vite possible. Les petits sorts se tracent vite : mitraille !', restart: function () { startSpeed(d); } });
  }
  // 🥁 Au rythme du tambour : 4 coups pour écouter, puis 3 manches de 8 coups, de plus en plus rapides. Il faut lâcher un sort d'attaque pile sur chaque coup :
  // 3 points si c'est pile dessus, 2 si c'est proche, 1 si c'est en retard ou en avance ; rien pour un coup manqué. 72 points au maximum.
  var DRUM = { lead: 4, groups: [[8, 0.85], [8, 0.68], [8, 0.55]], win: [0.09, 0.17, 0.28], lag: 0.03 }; // lag : le son du tambour arrive un poil après son heure
  function startDrum(d) {
    var beats = [], t = 1, i;
    for (i = 0; i < DRUM.lead; i++) { beats.push({ t: t, lead: true }); t += DRUM.groups[0][1]; }
    DRUM.groups.forEach(function (g, gi) { for (i = 0; i < g[0]; i++) { beats.push({ t: t, g: gi, k: i }); t += g[1]; } });
    startChallenge({ id: d.id, icon: d.icon, name: d.name, score: 'count', points: true, drum: { beats: beats, i: 0, hit: 0, perfect: 0 }, medals: [28, 42, 54, 64], prompts: [{ say: 'Un sort à chaque coup !' }],
      begin: function () { DS.music.duck(0); }, // on compte au tambour : la musique se tait
      result: function (c) { return c.good + ' points sur 72 : ' + c.drum.hit + ' coups en rythme sur 24, dont ' + c.drum.perfect + ' pile dessus'; },
      intro: 'Écoute le tambour : 4 coups pour prendre le rythme, puis lance un sort d’attaque <b>pile sur chaque coup</b>. Trois manches de 8 coups, de plus en plus rapides. Pile dessus : 3 points !', restart: function () { startDrum(d); } });
  }
  function drumHud() {
    var k = C.drum, cur = k.beats[Math.max(0, k.i - 1)], lead = !k.i || cur.lead, g = lead ? 0 : cur.g, nextM = C.medals.filter(function (v) { return v > C.good; })[0];
    hud('<div class="prompt">🥁 ' + (lead ? 'Écoute le tambour…' : 'Un sort à chaque coup !') + '</div><div class="dots">' + k.beats.filter(function (b) { return b.g === g; }).map(function (b) {
      return '<i class="' + (b.q === 3 ? 'on' : b.q === 2 ? 'ok' : b.q === 1 ? 'meh' : b.q === 'miss' ? 'miss' : '') + (b === cur ? ' now' : '') + '"></i>';
    }).join('') + '</div><div class="meta">⭐ ' + C.good + ' pts · manche ' + (g + 1) + ' / ' + DRUM.groups.length + (nextM ? ' · ' + MEDALS[C.medals.indexOf(nextM) + 1] + ' à ' + nextM : ' · 💎 !') + '</div>');
  }
  function drumTick() {
    var k = C.drum, t = now() - C.t0, b, changed = false;
    while (k.i < k.beats.length && t >= k.beats[k.i].t) { // le coup de tambour (accent sur le premier temps de chaque mesure)
      b = k.beats[k.i]; SFX.drum(!b.lead && b.k % 4 === 0);
      if (b.lead) api().say(String(DRUM.lead - k.i), '#c9cfdd'); else if (b.k === 0) api().say(b.g ? 'Plus vite !' : 'À toi !', '#ffd27a');
      k.i++; changed = true;
    }
    k.beats.forEach(function (x) { if (!x.lead && !x.q && t > x.t + DRUM.lag + DRUM.win[2]) { x.q = 'miss'; changed = true; } }); // trop tard pour ce coup-là
    if (changed) drumHud();
    if (t > k.beats[k.beats.length - 1].t + 0.7) finish();
  }
  function drumCast() { // un sort vient de partir : à quel coup de tambour appartient-il ?
    var k = C.drum, t = now() - C.t0 - DRUM.lag, best = null, bd = 9, q;
    k.beats.forEach(function (b) { var d = Math.abs(t - b.t); if (!b.lead && !b.q && d < bd) { bd = d; best = b; } });
    if (!best || bd > DRUM.win[2]) { api().say('Hors rythme !', '#ffb0a0'); return; }
    q = bd <= DRUM.win[0] ? 3 : bd <= DRUM.win[1] ? 2 : 1; best.q = q; C.good += q; k.hit++; if (q === 3) k.perfect++;
    api().say(q === 3 ? 'Pile dessus ! +3' : q === 2 ? 'Bien +2' : (t < best.t ? 'Trop tôt +1' : 'Trop tard +1'), q === 3 ? '#ffe9a0' : q === 2 ? '#9dffb0' : '#c9cfdd'); SFX.point(q); drumHud();
  }
  // 📦 Casse-caisses : n'importe quel sort d'attaque ; les gros sorts cassent plus, mais sont plus longs à tracer.
  // L'or : pour chaque caisse, le meilleur choix parmi les sorts qu'on connaît, au rythme d'un bon duelliste.
  function startCrates(d) {
    var hps = [16, 24, 32, 40, 48], list = shooters(), gold = 0;
    hps.forEach(function (hp) { gold += 0.25 + Math.min.apply(null, list.map(function (s) { return Math.ceil(hp / s.dmg) * pace(s) + s.flight + (s.sky || 0); })); });
    var prompts = hps.map(function (hp, i) { return { say: 'Caisse ' + (i + 1) + ' : casse-la !', target: { kind: 'caisse', hp: hp, maxHp: hp } }; });
    startChallenge({ id: d.id, icon: d.icon, name: d.name, score: 'time', any: true, medals: timeMedals(gold), prompts: prompts,
      intro: 'Détruis les 5 caisses, de plus en plus solides, avec tes sorts d’attaque. Un petit sort se trace vite ; un gros sort casse plus. À toi de choisir !', restart: function () { startCrates(d); } });
  }
  // 🎯 Points faibles : chaque mannequin ne craint qu'un seul sort.
  function startWeak(d) {
    var prompts = picks(DUMMIES, 8).map(function (k) { return { want: k.want, say: k.icon + ' ' + k.label, target: { kind: k.kind, icon: k.icon } }; });
    startChallenge({ id: d.id, icon: d.icon, name: d.name, score: 'time', onHit: true, wrong: 'Ça ne lui fait rien !', medals: [55, 38, 27, 22], prompts: prompts,
      intro: 'Chaque mannequin ne craint qu’un seul sort :<br>' + DUMMIES.map(function (k) { return k.icon + ' ' + k.why; }).join('<br>') + '<br>Abats les 8 mannequins le plus vite possible !', restart: function () { startWeak(d); } });
  }
  // 🎭 Le bon maléfice : le professeur dit quoi faire à l'adversaire, on trouve le sort.
  function startOrders(d) {
    var prompts = picks(doneList(), 10).map(function (s) { return { want: s.id, say: ORDERS[s.id] }; });
    startChallenge({ id: d.id, icon: d.icon, name: d.name, score: 'count', limit: 9, medals: [5, 7, 9, 10], prompts: prompts,
      intro: 'Je te dis ce que tu dois me faire, tu lances le bon sort. Tu as 9 secondes à chaque fois, et un seul essai. N’aie pas peur, je suis solide !', restart: function () { startOrders(d); } });
  }
  // 🛡️ La bonne protection : Glacius → Calor, Désarmo → Tenax, tout le reste → Aegis. Pas de bouclier au clic.
  var NEED = { glacius: ['antiIce', 'calor'], desarmo: ['grip', 'tenax'] };
  function startGuard(d) {
    var prompts = shuffle(['glacius', 'desarmo'].concat(picks(['glacius', 'desarmo', 'ignis', 'fulgur', 'scintilla'], 6))).map(function (id) { var s = byId(id); return { cast: id, say: 'Attention, je lance <b style="color:' + s.color + '">' + s.name + '</b> !' }; });
    startChallenge({ id: d.id, icon: d.icon, name: d.name, score: 'count', guard: true, medals: [4, 6, 7, 8], prompts: prompts, begin: function () { api().noParry(true); },
      intro: 'Je te lance 8 sorts. Avant qu’ils arrivent, protège-toi avec le bon sort :<br>❄ Glacius → <b>Calor</b><br>🌀 Désarmo → <b>Tenax</b><br>🔥 tout le reste → <b>Aegis</b><br>Ici, pas de bouclier au clic !', restart: function () { startGuard(d); } });
  }

  // ───────────────────────── Ce que le duel nous signale ─────────────────────────
  // Un tracé vient d'être terminé. Retourne true (le sort part), un message (il rate, avec ce message) ou null (raté, message par défaut).
  function onTrace(e) {
    if (view === 'lesson' && L) return lessonTrace(e);
    if (view === 'challenge' && C) return challengeTrace(e);
    return e.ok ? true : null; // au menu, on s'amuse librement
  }
  // Un de nos sorts vient de toucher le professeur, une caisse ou un mannequin.
  function onFoeHit(e) {
    if (view === 'menu' && training()) return trainHit(e);
    if (view !== 'challenge' || !C || !C.on) return;
    var p = C.prompts[C.i]; if (!p || p.over) return;
    if (C.hits) { if (e.tick || !e.spell || e.spell.cat !== 'attaque') return; C.n++; if (C.n >= C.hits) answer(true, 'Terminé !'); else showPrompt(); } // attaque de rapidité : chaque sort qui touche compte
    else if (C.any && p.target) { p.target.hp -= e.dmg; if (p.target.hp <= 0) answer(true, 'Cassée !'); }
    else if (C.onHit && p.sent && e.spell.id === p.want) answer(true, 'Bien vu !');
  }
  // Un sort du professeur vient d'arriver sur nous : outcome = 'ward' (Aegis), 'antiIce' (Calor), 'grip' (Tenax), 'parry' ou 'hit'.
  function onPlayerHit(e) {
    if (view !== 'challenge' || !C || !C.on || !C.guard) return;
    var p = C.prompts[C.i]; if (!p || p.over) return;
    var need = NEED[p.cast] || ['ward', 'aegis'], ok = e.outcome === need[0] || (e.outcome === 'ward' && e[need[0]]), name = byId(need[1]).name;
    answer(ok, ok ? 'Bien protégé !' : e.outcome === 'ward' ? 'Aegis l’a avalé… mais il fallait ' + name + ' !' : 'Touché ! Il fallait ' + name + '.', 1300);
    later(1100, function () { api().cleanse(); }); // on repart à neuf pour le sort suivant
  }

  // ───────────────────────── Entrée et sortie ─────────────────────────
  // h : { save, addXp(n) → niveaux gagnés, persist(), leave() }
  function open(catId, h) {
    host = h; T = null;
    if (catId === 'entrainement') { cat = TRAIN; prof = { name: 'Le mannequin' }; } else { cat = DS.byId(DS.CATS, catId); prof = DS.PROFS[catId]; }
    $('school-title').textContent = training() ? 'Salle d’entraînement' : 'Cours ' + cat.of;
    $('school').classList.remove('hidden');
    menu();
  }
  function close() { if (!host) return; run++; clearTicker(); L = null; C = null; T = null; hud(''); $('school').classList.add('hidden'); $('say').classList.add('hidden'); host = null; }

  DS.school = { open: open, close: close, onTrace: onTrace, onFoeHit: onFoeHit, onPlayerHit: onPlayerHit };
})();
