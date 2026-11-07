// Cours d'attaque, leçons 3 à 12 : Ignis, Sagitta, Terra, Tonnero, Vespera, Toxicus, Tremor, Tornado, Radius, Infernus.
// Même déroulement qu'aux leçons 1 et 2 (js/classe.js, qui explique les champs d'une étape) : le professeur présente le sort, montre son signe,
// le fait tracer (avec son piège), puis vient l'exercice propre au sort, devant un mannequin préparé pour lui — de glace pour le feu,
// derrière un mur pour les roches, enchaîné à deux autres pour la foudre… — et enfin la démonstration devant la classe.
// Les chiffres cités (dégâts, durées) sont ceux de js/data.js : si on y change un sort, relire sa leçon.
(function () {
  'use strict';
  var DS = window.DS, SFX = DS.audio, K = DS.classe.kit;
  var st = K.st, is = K.is, seq = K.seq, secs = K.secs, api = K.api, now = K.now, later = K.later, rand = K.rand;
  var H = function () { return window.innerHeight; };
  // Les signes du cours d'attaque, dans l'ordre des leçons (le S de Tornado est reconnu dès la leçon 2, où il sert de piège).
  // Pendant une leçon, seuls les signes déjà vus comptent (plus celui du piège) : un tracé maladroit ne lance pas un sort inconnu.
  var SIGNS = ['line', 'zigzag', 'ess', 'triangle', 'arrow', 'square', 'cup', 'crescent', 'infinity', 'emm', 'sigma', 'star'];
  function signs(n, extra) { return SIGNS.slice(0, n).concat(extra || []); }

  // ── Cibles ──
  function dummy(hp, kind, more) { // un mannequin avec sa barre de vie ; more() : ce qu'il a de spécial (bouclier, brume…)
    return function () { var t = { kind: kind || 'mannequin', auto: true, hp: hp, maxHp: hp }, m = more ? more() : null, k; for (k in m) t[k] = m[k]; return t; };
  }
  function plain(more) { return dummy(99999, 'mannequin', function () { var m = more ? more() : {}; m.noBar = true; return m; }); } // increvable, sans barre de vie : pour les exercices où l'on compte autre chose
  function row(kind, hp) { return function () { var h = hp || 1; return { kind: kind || 'mannequin', row: [h, h, h], fallen: [0, 0, 0] }; }; } // trois mannequins enchaînés
  function isDown(s, t) { return !!t && t.auto && t.hp <= 0; }
  function took(s) { return secs(now() - s.start); }
  function finalDown(s, t) { if (!isDown(s, t)) return; api().say('À terre en ' + took(s) + ' secondes !'); return true; } // dernière étape d'une leçon : on annonce le temps
  function knocked(e) { return e.n; }                       // nombre de mannequins renversés par ce sort
  function beamHit(e) { return !!e.tick && !e.blocked; }    // une salve de rayon qui touche

  // ── Apprendre un signe : le professeur le montre, l'élève le suit, tombe dans le piège (s'il y en a un), puis le refait sans modèle ──
  // o : { a: 'un triangle', show, well, trap: { say, goal, glyph ou strokes, check, well, cast }, free, freeWell, n }
  function shape(part, id, glyph, o) {
    var out = [
      { part: part, say: o.show, show: glyph },
      { part: part, say: o.guided || 'À toi ! Garde <kbd>Espace</kbd> enfoncé, pars du point vert et suis le chemin. Ne relâche qu’à la toute fin.', goal: 'Trace ' + o.a + '.', count: 1,
        guide: { glyph: glyph, alpha: 0.6, comet: true }, check: is(id, 'Presque ! Suis bien le chemin, d’un seul geste.'), well: o.well }
    ];
    if (o.trap) out.push({ part: part, say: o.trap.say, goal: o.trap.goal, count: 1, noCast: !o.trap.cast, strokes: o.trap.strokes, guide: o.trap.glyph ? { glyph: o.trap.glyph, alpha: 0.6, comet: true } : null, check: o.trap.check, well: o.trap.well });
    out.push({ part: part, say: o.free, goal: 'Trace ' + o.a + ' ' + (o.n || 2) + ' fois, sans modèle.', count: o.n || 2, check: is(id, 'Ce n’est pas ' + o.a + ' !'), well: o.freeWell });
    return out;
  }
  // Piège : on voulait faire tracer le signe d'un autre sort (want) ; si c'est encore le sort de la leçon (self) qui sort, on le dit.
  function other(want, self, msg) { return function (e) { return e.ok && e.spell.id === want ? true : e.ok && e.spell.id === self ? msg : null; }; }
  function lesson(def, a, b, c) { def.steps = a.concat(b, c); DS.classe.add(def); }

  // ───────────────────────── Leçon 3 : Ignis ─────────────────────────
  lesson({ id: 'ignis', name: 'Ignis', color: '#ff7a3a', only: signs(4), parts: ['La boule de feu', 'Le triangle', 'La brûlure', 'En duel', 'La démonstration'] }, [
    { part: 0, say: 'Bonjour à tous ! Approchez-vous du feu… Aujourd’hui, mon sort préféré : <b>Ignis</b>, la boule de feu !' },
    { part: 0, say: 'Ignis frappe <b>presque trois fois plus fort</b> que Scintilla. Et ce n’est pas tout : sa cible <b>continue de brûler</b> pendant trois secondes.' },
    { part: 0, say: 'Mais une boule de feu, c’est <b>lent</b>. Votre adversaire la voit venir de loin… et il a tout son temps pour lever son bouclier.' },
    { part: 0, say: 'Et elle coûte cher : <b>plus que trois Scintilla</b>. Ignis, on ne le gaspille pas !' }
  ], shape(1, 'ignis', 'triangle', {
    a: 'un triangle', show: 'Son signe est un <b>triangle</b> : trois côtés, et on revient <b>exactement au point de départ</b>. Suivez la lumière.',
    well: 'Et voilà ta première boule de feu ! Tu as vu comme elle prend son temps ?',
    trap: { say: 'Le piège : oublier de <b>refermer</b>. Trace seulement <b>deux côtés</b> du triangle, d’un seul geste, pour voir…', goal: 'Trace deux côtés seulement, sans refermer.',
      strokes: function () { return [st(-0.075, 0.03, 0.3, -63), st(0.075, 0.03, 0.3, 63)]; },
      check: function (e) { return e.ok && e.spell.id === 'ignis' ? 'Celui-là était bien fermé ! Arrête-toi après deux côtés.' : e.ok || e.why === 'unknown' ? true : null; },
      well: 'Pas de boule de feu ! Un triangle ouvert, ce n’est pas un triangle. <b>Refermez toujours</b> vos formes.' },
    free: 'Maintenant <b>sans modèle</b> : deux triangles, bien fermés.', freeWell: 'Deux belles boules de feu ! Ça réchauffe le cœur d’un vieux professeur.'
  }), [
    { part: 2, say: 'Passons à ce qui rend Ignis si redoutable : la <b>brûlure</b>. Venez voir, j’ai préparé un mannequin… <b>de glace</b> !' },
    { part: 2, corner: true, say: 'Ce mannequin de glace a <b>30 points de vie</b>. Lance-lui <b>un seul</b> Ignis… puis ne fais plus rien, et regarde sa barre de vie.', goal: 'Fais fondre le mannequin de glace avec Ignis.',
      target: dummy(30, 'glace'), check: is('ignis', 'Seulement Ignis, pour cet exercice !'), tick: isDown,
      well: function (s) { return (s.casts.ignis > 1 ? 'Fondu ! Mais regarde bien la prochaine fois : ' : 'Tu as vu ? ') + 'la boule de feu enlève une vingtaine de points d’un coup… et la <b>brûlure</b> continue le travail : <b>3 points par seconde</b> pendant 3 secondes.'; } },
    { part: 2, say: 'Retenez aussi ceci : la brûlure <b>ne s’additionne pas</b>. Un deuxième Ignis sur une cible qui brûle déjà relance simplement le feu pour trois secondes.' },

    { part: 3, say: 'En duel, une boule de feu lancée n’importe quand finit presque toujours dans un bouclier. Le secret : la lancer quand l’adversaire est <b>occupé</b>.' },
    { part: 3, say: 'Par exemple juste après un Fulgur : pendant qu’il encaisse l’éclat, la boule de feu est déjà en route. On appelle ça le <b>coup du dragon</b> : Z… puis triangle !' },
    { part: 3, say: 'À toi : le <b>coup du dragon</b>. Fulgur, puis Ignis !', goal: 'Lance Fulgur, puis Ignis.', count: 2, check: seq(['fulgur', 'ignis']), well: 'L’éclat, puis le feu : voilà un vrai coup de dragon !' },
    { part: 3, say: 'Dernier conseil : un grand triangle est long à tracer. En duel, faites-le <b>petit</b> : il brûle tout autant.' },
    { part: 3, say: 'Essaie : un <b>petit triangle</b>, pas plus grand que le modèle.', goal: 'Trace un petit triangle.', count: 1, guide: { glyph: 'triangle', alpha: 0.5, size: 0.16 },
      check: function (e) { return e.ok && e.spell.id === 'ignis' ? (e.geo.size <= H() * 0.27 || 'Encore trop grand ! Plus petit, comme le modèle.') : e.ok ? 'Ce n’est pas un triangle !' : null; }, well: 'Petit triangle, grosse boule de feu !' },

    { part: 4, say: 'Bien ! Qui veut montrer à la classe ce que vaut une boule de feu ?' },
    { part: 4, say: '<b>{nom}</b>, bien sûr ! Viens devant, face au mannequin.' },
    { part: 4, corner: true, say: 'Ce mannequin a <b>70 points de vie</b>. Mets-le à terre avec tout ce que tu sais : Scintilla, Fulgur… et surtout <b>Ignis</b> !', goal: 'Vide la barre de vie du mannequin.', target: dummy(70), tick: finalDown }
  ]);

  // ───────────────────────── Leçon 4 : Sagitta ─────────────────────────
  lesson({ id: 'sagitta', name: 'Sagitta', color: '#9fffd0', only: signs(5, ['arrowdown']), parts: ['La flèche magique', 'La flèche', 'Plus vite que son ombre', 'En duel', 'La démonstration'] }, [
    { part: 0, say: 'Bonjour à tous ! Après le feu, la finesse. Aujourd’hui : <b>Sagitta</b>, la flèche magique.' },
    { part: 0, say: 'Sagitta est le projectile <b>le plus rapide</b> de tout le cours d’attaque. À peine lancée, elle est déjà arrivée : presque impossible à parer !' },
    { part: 0, say: 'Elle frappe un peu plus fort que Scintilla, et coûte <b>moins cher que Fulgur</b>. Une flèche, ça ne pèse rien !' },
    { part: 0, say: 'Son seul défaut : son signe demande un peu de doigté. Regardez bien.' }
  ], shape(1, 'sagitta', 'arrow', {
    a: 'une flèche', show: 'Une <b>flèche qui pointe vers le haut</b>, d’un seul geste : on monte jusqu’à la pointe, on redescend de l’autre côté, on <b>revient à la pointe</b>… et on descend tout droit pour la tige.',
    well: 'Tu l’as à peine vue partir, pas vrai ?',
    trap: { say: 'Et si la flèche pointe <b>vers le bas</b> ? Essaie, pour voir…', goal: 'Trace une flèche vers le bas, comme le modèle.', glyph: 'arrowdown',
      check: other('gravitas', 'sagitta', 'Celle-là pointait vers le haut ! Suis le modèle : la pointe en bas.'),
      well: 'Pas de Sagitta ! Une flèche vers le bas, c’est <b>Gravitas</b>, un sort du cours d’effet. Pour Sagitta, la pointe <b>toujours vers le haut</b> !' },
    free: 'Maintenant <b>sans modèle</b> : deux flèches, la pointe en haut.', freeWell: 'Deux flèches en plein dans le mille !'
  }), [
    { part: 2, say: 'Voyons si vous êtes aussi rapides que votre flèche. J’ai installé un <b>mannequin pétard</b>. Quand sa mèche s’allume, vous avez <b>cinq secondes</b> pour l’éteindre d’une flèche. Sinon… PAF ! Et on recommence tout.' },
    { part: 2, say: 'Attention, c’est un exercice de <b>sang-froid</b> : tirer avant la mèche, ou autre chose qu’une flèche, c’est une <b>pénalité</b>. À la deuxième pénalité, on recommence du début !' },
    { part: 2, corner: true, say: 'Tiens-toi prêt ! Dès que la mèche s’allume : une <b>flèche</b>, vite ! Pas avant.', goal: 'Éteins 3 mèches de suite avec Sagitta. Une explosion, ou deux pénalités : on recommence.', count: 3,
      target: function () { return { kind: 'petard', fuse: null }; },
      enter: function (s) { s.next = now() + 2.5; s.best = 99; s.pen = 0; },
      tick: function (s, t) {
        if (!t || t.fuse || t.boomed || t.pop) return;
        if (!s.next) s.next = now() + rand(2, 3.5);                  // éteinte ou explosée : la prochaine s'allumera dans un instant
        else if (now() >= s.next) { s.next = 0; t.fuse = { t: 0, dur: 5 }; api().say('Feu !', '#ffd36b'); SFX.go(); }
      },
      onCast: function (e, s) { // jugé au moment du tracé : une faute = une pénalité (le sort ne part pas) ; la deuxième remet tout à zéro
        var why = e.spell.id !== 'sagitta' ? 'Seulement Sagitta !' : !s.tgt.fuse ? 'Trop tôt ! Attends que la mèche s’allume.' : null;
        if (!why) return true;
        s.pen = (s.pen || 0) + 1;
        if (s.pen >= 2) { K.restart('Deuxième pénalité ! On recommence du début.'); return false; }
        return why + ' ⚠ Pénalité 1 sur 2.';
      },
      allow: function (e, s) { return e.spell.id === 'sagitta' && !!s.tgt.fuse; },
      hit: function (e, s) {
        if (e.boom) { K.restart('PAF ! Trop tard… On recommence du début.'); return; }
        if (e.defused === undefined) return; s.best = Math.min(s.best, e.defused); return true;
      },
      well: function (s) { return 'Trois mèches éteintes ! Ton meilleur temps : <b>' + secs(s.best) + ' s</b>. ' + (s.best < 2.5 ? 'Plus rapide que ton ombre !' : 'Avec de l’entraînement, tu passeras sous les deux secondes et demie.'); } },

    { part: 3, say: 'En duel, Sagitta sert à <b>finir le travail</b>. Quand il ne lui reste presque plus de vie, votre adversaire se cache derrière son bouclier… mais la flèche arrive avant.' },
    { part: 3, say: 'Elle sert aussi à <b>interrompre</b> : un adversaire qui trace un gros sort ? Une flèche, et il doit tout recommencer.' },
    { part: 3, say: 'Et il y a le <b>coup de l’archer</b> : Ignis d’abord — la boule de feu part lentement — puis Sagitta tout de suite après. Les deux arrivent presque <b>en même temps</b> : impossible de parer les deux !' },
    { part: 3, say: 'À toi : le <b>coup de l’archer</b>. Ignis, puis Sagitta, sans traîner !', goal: 'Lance Ignis, puis Sagitta.', count: 2, check: seq(['ignis', 'sagitta']), well: 'La flèche a presque rattrapé la boule de feu ! Bien joué.' },
    { part: 3, say: 'Et puisque nous sommes entre nous… il existe un coup <b>secret</b> : le <b>coup de l’archer DORÉ</b> ! Les mêmes sorts, dans le même ordre… mais <b>Ignis doit arriver en dernier</b> : la flèche doit <b>dépasser</b> la boule de feu et toucher la première.' },
    { part: 3, say: 'Attention : tout le monde n’y arrive pas. Il faut tracer la flèche à toute vitesse, juste après le triangle. Il faut du… <b>talent</b> ! Veux-tu essayer ?',
      ask: [{ label: '✦ Essayer le coup de l’archer doré', primary: true }, { label: 'Non merci, continuons', skip: 1 }] },
    { part: 3, corner: true, say: 'Ignis… puis Sagitta, <b>sans respirer</b> ! La flèche doit toucher le mannequin <b>avant</b> la boule de feu.', goal: 'Coup de l’archer doré : Sagitta doit toucher le mannequin avant Ignis.', target: plain(),
      enter: function (s) { s.ig = 0; s.fails = 0; },
      check: function (e, s) { if (!e.ok) return null; if (e.spell.id === 'ignis') { s.ig = now(); return true; } if (e.spell.id === 'sagitta') { if (!s.ig) return 'Ignis d’abord !'; return true; } return 'Seulement Ignis, puis Sagitta !'; },
      hit: function (e, s) {
        if (!e.spell) return;
        var D = DS.duel.state, ignisFlying = D.shots.some(function (sh) { return sh.from === 'player' && sh.spell.id === 'ignis'; });
        if (e.spell.id === 'sagitta' && s.ig && ignisFlying) { api().say('✦ COUP DE L’ARCHER DORÉ ! ✦', '#ffe9a0'); return true; }
        if (e.spell.id === 'ignis' && s.ig) { // la boule de feu est arrivée la première : raté
          s.ig = 0; s.fails++;
          if (s.fails >= 2) K.ask('Hé hé… pas encore ce coup-là. Il faut vraiment être rapide : la flèche tout de suite après le triangle. Veux-tu continuer le cours quand même ?', [
            { label: 'Réessayer', fn: function () { K.again(); } }, { label: 'Continuer le cours', primary: true, fn: function () { K.skip(); } }]);
          else api().say('Ignis est arrivé avant la flèche ! Plus vite…', '#ffb0a0');
        }
      },
      well: function () { return 'Par ma barbe ! Le coup de l’archer <b>doré</b> ! Tu as du talent. Garde ce coup pour les grands duels.'; } },

    { part: 4, say: 'Il me faut un archer pour la démonstration…' },
    { part: 4, say: '<b>{nom}</b> ! Viens devant. Aujourd’hui, le mannequin ne se laissera pas faire.' },
    { part: 4, corner: true, say: 'Le mannequin <b>se promène</b> ! Peu importe : tes flèches le suivent. Touche-le <b>5 fois</b> avec Sagitta.', goal: 'Touche le mannequin qui bouge 5 fois avec Sagitta.', count: 5,
      target: function () { return { kind: 'mannequin', move: { amp: 0.17, per: 4.5 } }; }, check: is('sagitta', 'Seulement des flèches, pour cette démonstration !'), hit: function (e) { return !!e.spell && e.spell.id === 'sagitta'; } }
  ]);

  // ───────────────────────── Leçon 5 : Terra ─────────────────────────
  var wallCount = function (e, s) { s.k = (s.k || 0) + 1; return e.broken; };
  lesson({ id: 'terra', name: 'Terra', color: '#c49a6c', only: signs(6, ['circle']), parts: ['Le jet de roches', 'Le carré', 'Casseur de murs', 'En duel', 'La démonstration'] }, [
    { part: 0, say: 'Bonjour à tous ! Aujourd’hui, du solide : <b>Terra</b>, le jet de roches.' },
    { part: 0, say: 'Petit rappel avant de commencer : un <b>enchaînement</b> connu, lancé dans le bon ordre sans traîner, et le <b>dernier sort</b> frappe comme s’il avait <b>un niveau de plus</b>. Vous en avez déjà plusieurs dans votre grimoire : servez-vous-en !' },
    { part: 0, say: 'Terra, c’est le sort <b>malin</b> : presque aussi fort que Fulgur, presque aussi rapide… et <b>moins cher</b>.' },
    { part: 0, say: 'Mais sa vraie spécialité, c’est de <b>casser les murs</b>. Au cours d’effet, vous apprendrez Murus : un mur de pierre qui arrête tout. Terra, lui, le démolit <b>quatre fois plus vite</b> que n’importe quel autre sort : chaque cube de terre compte pour <b>quatre coups</b>.' }
  ], shape(1, 'terra', 'square', {
    a: 'un carré', show: 'Son signe est un <b>carré</b> : quatre côtés, quatre coins <b>bien marqués</b>, et on referme.',
    well: 'Et pan ! Des cailloux plein le mannequin.',
    trap: { say: 'Attention aux coins ! Si vous les arrondissez, votre carré devient… un rond. Trace un <b>rond</b>, pour voir.', goal: 'Trace un rond, comme le modèle.', glyph: 'circle',
      check: other('desarmo', 'terra', 'Celui-là avait de vrais coins ! Fais-le bien rond, comme le modèle.'),
      well: 'Pas de roches ! Le rond, c’est <b>Désarmo</b>, un sort du cours d’effet. Pour Terra : des <b>coins bien carrés</b>.' },
    free: 'Maintenant <b>sans modèle</b> : deux carrés, aux coins bien nets.', freeWell: 'Du travail de maçon !'
  }), [
    { part: 2, say: 'Place à la démolition ! Je dresse un <b>mur</b> devant le mannequin. Il résiste à <b>huit coups</b> de n’importe quelle attaque.' },
    { part: 2, corner: true, wall: 8, say: 'D’abord avec <b>Scintilla</b>. Compte tes coups !', goal: 'Casse le mur avec Scintilla.', check: is('scintilla', 'Seulement Scintilla, pour compter les coups !'), wallHit: wallCount,
      well: function (s) { return '<b>' + s.k + ' coups</b> ! C’est long… et pendant ce temps, votre adversaire, bien à l’abri, prépare tranquillement son prochain sort.'; } },
    { part: 2, corner: true, wall: 8, say: 'Je le remonte. Maintenant, avec <b>Terra</b> !', goal: 'Casse le mur avec Terra.', check: is('terra', 'Avec Terra, cette fois !'), wallHit: wallCount,
      well: function (s) { return '<b>' + s.k + ' coups</b> seulement : chaque cube de terre compte pour <b>quatre</b> contre un mur. Huit coups… ou deux !'; } },

    { part: 3, say: 'En duel, quand l’adversaire se cache derrière un mur, vous avez deux choix : attendre qu’il retombe… ou <b>sortir les roches</b>.' },
    { part: 3, say: 'Et comme Terra ne coûte presque rien, il est parfait dans une rafale. Voici le <b>coup du maçon</b> : Terra, Terra… et Fulgur pour finir !' },
    { part: 3, say: 'À toi : le <b>coup du maçon</b>. Carré, carré, Z !', goal: 'Lance Terra, Terra, puis Fulgur.', count: 3, check: seq(['terra', 'terra', 'fulgur']), well: 'Deux brouettes de cailloux et un éclat : personne n’aime recevoir ça.' },

    { part: 4, say: 'Qui veut jouer les démolisseurs devant toute la classe ?' },
    { part: 4, say: '<b>{nom}</b> ! Viens devant. Et n’abîme pas trop ma salle…' },
    { part: 4, corner: true, wall: 8, say: 'Un mur, et derrière lui, un mannequin de <b>40 points de vie</b>. Démolis le mur, puis mets le mannequin à terre !', goal: 'Casse le mur, puis vide la barre de vie du mannequin.', target: dummy(40), tick: finalDown }
  ]);


  // ───────────────────────── Les examens : tous les cinq cours, pas de place à la plaisanterie ─────────────────────────
  // On y refait les enchaînements des leçons passées, chacun en temps limité (sinon, on recommence cet enchaînement), puis une épreuve de démolition.
  function timed(name, ids, secs_, part) {
    var how = ids.map(function (id) { return DS.byId(DS.SPELLS, id).name; }).join(', ');
    return { part: part, say: '<b>' + name + '</b> : ' + how + '. En moins de <b>' + secs_ + ' secondes</b>, sinon on recommence !', goal: name + ' (' + how + ') en moins de ' + secs_ + ' s.', count: ids.length, within: secs_, check: seq(ids),
      well: function (s) { return name + ' en <b>' + secs(s.times[s.times.length - 1] - s.t0) + ' s</b>. Suivant !'; } };
  }
  function exam(n, ids, combos, final, color) {
    var def = { id: 'examen' + n, name: n === 1 ? 'Les cinq premières leçons' : 'Les dix premières leçons', exam: n, skill: true, color: color, only: signs(ids), what: 'les enchaînements des ' + (n === 1 ? 'cinq premières' : 'dix premières') + ' leçons',
      parts: ['Le jour de l’examen', 'Les enchaînements', 'L’épreuve finale'] };
    var steps = [
      { part: 0, say: 'Silence ! Aujourd’hui, c’est le <b>jour de l’examen</b>. Pas de place à la plaisanterie… ou presque.' },
      { part: 0, say: 'Vous allez me refaire les <b>enchaînements</b> des dernières leçons, chacun en <b>temps limité</b>. Trop lent ? On le recommence. Puis une épreuve finale devant le mannequin. Rappel : un enchaînement réussi, et le dernier sort a <b>un niveau de plus</b>.' },
      { part: 0, say: '<b>{nom}</b>, à toi. Baguette en main, et pas de bavardage.' }
    ];
    combos.forEach(function (c) { steps.push(timed(c[0], c[1], c[2], 1)); });
    steps = steps.concat(final);
    lesson(def, steps, [], []);
  }
  exam(1, 6, [['Le un-deux-trois', ['scintilla', 'scintilla', 'fulgur'], 6], ['Le coup du dragon', ['fulgur', 'ignis'], 4], ['Le coup de l’archer', ['ignis', 'sagitta'], 4], ['Le coup du maçon', ['terra', 'terra', 'fulgur'], 6]], [
    { part: 2, say: 'Bien. L’épreuve finale : un <b>mur de huit coups</b>, et derrière, un mannequin de <b>60 points de vie</b>. Tu as <b>25 secondes</b>. Terra pour le mur, puis tes enchaînements !' },
    { part: 2, corner: true, wall: 8, say: 'Vingt-cinq secondes. <b>Allez !</b>', goal: 'Casse le mur et mets le mannequin (60 PV) à terre en moins de 25 s.', target: dummy(60),
      enter: function (s) { s.t1 = now(); },
      tick: function (s, t) {
        if (now() - s.t1 > 25) { s.t1 = now(); api().wall(8); api().target(s.tgt = dummy(60)()); api().say('Trop lent ! Le mur remonte : on recommence.', '#ffb0a0'); return; }
        if (!isDown(s, t)) return; api().say('Examen réussi en ' + secs(now() - s.t1) + ' secondes !'); return true;
      } }
  ], '#ffd978');

  // ───────────────────────── Leçon 6 : Tonnero ─────────────────────────
  lesson({ id: 'tonnero', name: 'Tonnero', color: '#ffe14a', only: signs(7, ['ell']), parts: ['La foudre', 'Le U carré', 'Tout ce qui se touche', 'En duel', 'La démonstration'] }, [
    { part: 0, say: 'Bonjour à tous ! Aujourd’hui, attention les oreilles : <b>Tonnero</b>, la foudre !' },
    { part: 0, say: 'À première vue, rien d’extraordinaire : il frappe à peu près comme Terra, pour un peu plus cher.' },
    { part: 0, say: 'Mais la foudre a un secret : après avoir frappé, elle <b>saute sur tout ce qui touche sa cible</b>.' },
    { part: 0, say: 'Or certains sorciers — vous le verrez au cours de protection — savent se <b>dédoubler</b> : trois copies, une seule vraie. Avec Tonnero, pas besoin de chercher la bonne : la foudre les traverse toutes !' }
  ], shape(1, 'tonnero', 'cup', {
    a: 'un U carré', show: 'Son signe est un <b>U carré</b> : on descend, on va vers la droite, on remonte. Deux coins bien nets.',
    well: 'BOUM ! J’adore ce bruit.',
    trap: { say: 'Si vous vous arrêtez en route, après le deuxième trait, vous tracez un <b>L</b>. Essaie, pour voir…', goal: 'Trace un L, comme le modèle.', glyph: 'ell',
      check: other('lentus', 'tonnero', 'Celui-là remontait ! Arrête-toi après le deuxième trait.'),
      well: 'Pas de foudre ! Le L, c’est <b>Lentus</b>, un sort du cours d’effet. Pour Tonnero, n’oubliez pas de <b>remonter</b> !' },
    free: 'Maintenant <b>sans modèle</b> : deux U carrés.', freeWell: 'Deux coups de tonnerre ! Les voisins vont se plaindre.'
  }), [
    { part: 2, say: 'Voyons ce fameux secret. Venez devant : j’ai installé <b>trois mannequins</b>, reliés par une chaîne.' },
    { part: 2, corner: true, say: 'Renverse-les d’abord avec <b>Scintilla</b>. Pointe ta baguette vers celui que tu vises : la petite flèche jaune te le montre.', goal: 'Renverse les 3 mannequins avec Scintilla.', count: 3,
      target: row(), check: is('scintilla', 'D’abord avec Scintilla !'), hit: knocked, well: 'Trois sorts pour trois mannequins. Rien d’étonnant.' },
    { part: 2, corner: true, say: 'Je les relève. Maintenant, <b>un seul Tonnero</b> !', goal: 'Renverse les 3 mannequins avec Tonnero.', count: 3,
      target: row(), check: is('tonnero', 'Avec Tonnero, cette fois !'), hit: knocked, well: 'Un seul sort, trois mannequins ! La foudre a couru tout le long de la chaîne.' },
    { part: 2, corner: true, say: 'Autre amie de la foudre : le <b>fer</b>. Ce mannequin en armure se moque de vos étincelles. Essaie ce que tu veux… puis Tonnero.', goal: 'Mets le mannequin de fer à terre.',
      target: dummy(10, 'fer'), allow: function (e) { return e.spell.chain ? true : 'Ça rebondit sur le fer !'; }, tick: isDown, well: 'Le fer attire la foudre : un seul Tonnero, et l’armure ne sert plus à rien.' },

    { part: 3, say: 'En duel, la règle est simple : dès que votre adversaire <b>se dédouble</b>, Tonnero. C’est le réflexe à avoir.' },
    { part: 3, say: 'Le reste du temps, Tonnero est un bon sort de milieu de duel. Mon enchaînement préféré, le <b>coup de l’orage</b> : une flèche pour surprendre, la foudre pour frapper.' },
    { part: 3, say: 'À toi : le <b>coup de l’orage</b>. Sagitta, puis Tonnero !', goal: 'Lance Sagitta, puis Tonnero.', count: 2, check: seq(['sagitta', 'tonnero']), well: 'L’éclair, puis le tonnerre. Comme dans un vrai orage !' },

    { part: 4, say: 'Qui veut faire tomber la foudre devant toute la classe ?' },
    { part: 4, say: '<b>{nom}</b> ! Viens devant. J’ai sorti tous les mannequins de la réserve.' },
    { part: 4, corner: true, say: 'Trois rangées de mannequins, l’une après l’autre : <b>neuf mannequins</b> à renverser ! À toi de choisir tes sorts… mais je crois que tu as compris.', goal: 'Renverse 9 mannequins.', count: 9, target: row(),
      hit: function (e, s) { if (e.left === 0) later(900, function () { s.tgt.row = [1, 1, 1]; s.tgt.fallen = [0, 0, 0]; }); return e.n; } }
  ]);

  // ───────────────────────── Leçon 7 : Vespera ─────────────────────────
  var shielded = dummy(30, 'mannequin', function () { return { guard: true }; });
  lesson({ id: 'vespera', name: 'Vespera', color: '#8a78ff', only: signs(8, ['circle']), parts: ['La vague d’ombre', 'Le croissant', 'À travers les boucliers', 'En duel', 'La démonstration'] }, [
    { part: 0, say: 'Bonsoir à tous ! J’ai baissé les torches, exprès. Aujourd’hui : <b>Vespera</b>, la vague d’ombre.' },
    { part: 0, say: 'Jusqu’ici, tous vos sorts avaient le même ennemi : le <b>bouclier</b>. Un clic au bon moment, et votre belle attaque ne fait plus rien du tout.' },
    { part: 0, say: 'Vespera, elle, est faite d’ombre. Et l’ombre <b>passe à travers</b> : même parée, <b>la moitié des dégâts</b> touche quand même.' },
    { part: 0, say: 'Sans bouclier en face, elle frappe comme Tonnero. Ni très rapide, ni très lente.' }
  ], shape(1, 'vespera', 'crescent', {
    a: 'un C', show: 'Son signe est un <b>C</b>, comme un croissant de lune : on part d’en haut à droite, on arrondit par la gauche, on finit en bas à droite. Et surtout, <b>on ne referme pas</b> !',
    well: 'Une belle vague d’ombre. Brrr !',
    trap: { say: 'Vous connaissez déjà ce piège… Que se passe-t-il si on <b>referme</b> le C ? Essaie.', goal: 'Trace un rond, comme le modèle.', glyph: 'circle',
      check: other('desarmo', 'vespera', 'Celui-là était resté ouvert ! Referme-le complètement.'),
      well: 'Un rond : c’est encore <b>Désarmo</b> ! Pour Vespera, le croissant reste <b>ouvert</b>.' },
    free: 'Maintenant <b>sans modèle</b> : deux croissants de lune.', freeWell: 'Deux belles lunes. Vous feriez de bons astronomes.'
  }), [
    { part: 2, say: 'Voyons si l’ombre traverse vraiment les boucliers. Venez devant : ce mannequin est <b>ensorcelé</b>.' },
    { part: 2, corner: true, say: 'Son <b>bouclier magique</b> ne s’éteint jamais. Essaie donc de le toucher avec <b>Fulgur</b>…', goal: 'Lance Fulgur sur le bouclier.', count: 1,
      target: shielded, check: is('fulgur', 'Essaie avec Fulgur, pour voir.'), hit: function (e) { return !!e.blocked; }, well: 'Bloqué ! Pas une égratignure.' },
    { part: 2, corner: true, say: 'Maintenant, <b>Vespera</b> !', goal: 'Lance Vespera sur le bouclier.', count: 1, target: shielded, check: is('vespera', 'Avec Vespera, cette fois !'),
      hit: function (e, s) { if (!e.pierced) return; s.d = e.dmg; return true; }, well: function (s) { return '<b>' + s.d + ' points</b> de dégâts malgré le bouclier : la moitié de la vague est passée à travers.'; } },
    { part: 2, corner: true, say: 'Ce mannequin a <b>30 points de vie</b>, et il ne baissera jamais son bouclier. Mets-le à terre quand même !', goal: 'Vide la barre de vie du mannequin au bouclier.', target: shielded, tick: isDown,
      well: function (s) { return 'À terre, bouclier levé ! Il t’a fallu ' + (s.casts.vespera || 0) + ' vagues d’ombre.'; } },

    { part: 3, say: 'En duel, Vespera est l’arme contre ceux qui <b>parent tout</b>. Ils cliquent, ils cliquent… et leur vie descend quand même.' },
    { part: 3, say: 'Mais attention : contre un adversaire qui ne pare pas, Fulgur coûte moins cher et frappe plus fort. <b>Observez</b> votre adversaire avant de choisir !' },
    { part: 3, say: 'Mon truc, le <b>coup de l’éclipse</b> : une Scintilla pour lui faire lever son bouclier… et Vespera pendant qu’il se croit à l’abri.' },
    { part: 3, say: 'À toi : le <b>coup de l’éclipse</b>. Scintilla, puis Vespera !', goal: 'Lance Scintilla, puis Vespera.', count: 2, check: seq(['scintilla', 'vespera']), well: 'Il lève son bouclier pour une étincelle… et prend la vague. Malin !' },

    { part: 4, say: 'Qui veut montrer à la classe comment on vient à bout d’un bouclier ?' },
    { part: 4, say: '<b>{nom}</b> ! Viens devant. Ce mannequin-ci est plus rusé que les autres.' },
    { part: 4, corner: true, say: 'Il <b>lève et baisse</b> son bouclier. Bouclier baissé : frappe fort. Bouclier levé : <b>Vespera</b> ! Il a 60 points de vie.', goal: 'Vide la barre de vie du mannequin.', target: dummy(60),
      enter: function (s) { s.sw = now() + 3; },
      tick: function (s, t) { if (t && t.hp > 0 && now() >= s.sw) { t.guard = !t.guard; t.guardFlash = 0.3; s.sw = now() + (t.guard ? 3.5 : 3); SFX.shield(); } return finalDown(s, t); } }
  ]);

  // ───────────────────────── Leçon 8 : Toxicus ─────────────────────────
  lesson({ id: 'toxicus', name: 'Toxicus', color: '#5fd35f', only: signs(9), parts: ['Le nuage toxique', 'Le huit couché', 'Le poison travaille', 'En duel', 'La démonstration'] }, [
    { part: 0, say: 'Petit rappel avant de commencer : un <b>enchaînement</b> connu, lancé dans le bon ordre sans traîner, et le <b>dernier sort</b> frappe comme s’il avait <b>un niveau de plus</b>. Vous en avez déjà plusieurs dans votre grimoire : servez-vous-en !' },
    { part: 0, say: 'Bonjour à tous ! Bouchez-vous le nez… Aujourd’hui : <b>Toxicus</b>, le nuage toxique.' },
    { part: 0, say: 'Quand il touche, presque rien : une petite piqûre. Mais sa cible est <b>empoisonnée</b> : pendant six secondes, sa vie fond <b>petit à petit</b>.' },
    { part: 0, say: 'Au total, un seul Toxicus fait <b>plus de dégâts qu’un Fulgur</b>… si on a la patience d’attendre.' },
    { part: 0, say: 'Et pendant que le poison travaille, vous, vous êtes <b>libre de faire autre chose</b> : attaquer encore, ou vous protéger.' }
  ], shape(1, 'toxicus', 'infinity', {
    a: 'un huit couché', show: 'Son signe est un <b>huit couché</b>, le signe de l’infini : deux boucles, d’un seul geste, et on revient au point de départ.',
    guided: 'À toi ! Pars du point vert et suis le chemin. C’est un signe <b>long</b> : prends ton temps, et ne relâche qu’à la toute fin.',
    well: 'Pouah ! Quelle odeur… Ouvrez une fenêtre, quelqu’un.',
    trap: { say: 'Et un huit <b>debout</b>, comme le chiffre 8 ? Essaie, pour voir…', goal: 'Trace un 8 debout.',
      check: function (e) { return e.ok && e.spell.id === 'toxicus' ? 'Celui-là était couché ! Trace-le debout, comme le chiffre 8.' : e.ok || e.why === 'unknown' ? true : null; },
      well: 'Pas de nuage ! Le huit doit être <b>couché</b>, comme s’il faisait la sieste.' },
    free: 'Maintenant <b>sans modèle</b> : deux huit couchés.', freeWell: 'Deux nuages bien verts. Décidément, ouvrez DEUX fenêtres.'
  }), [
    { part: 2, say: 'Regardons le poison travailler. Venez devant.' },
    { part: 2, corner: true, say: 'Ce mannequin a <b>17 points de vie</b>. Lance-lui <b>un seul</b> Toxicus… puis croise les bras et regarde.', goal: 'Empoisonne le mannequin et attends.', target: dummy(17), check: is('toxicus', 'Seulement Toxicus !'), tick: isDown,
      well: 'Une petite piqûre au contact… et le poison a fait <b>tout le reste</b>, sans que tu lèves le petit doigt.' },
    { part: 2, say: 'Comme la brûlure, le poison <b>ne s’additionne pas</b> : un deuxième Toxicus remet simplement le sablier à six secondes. Inutile d’en lancer deux de suite !' },
    { part: 2, corner: true, say: 'Le vrai truc : <b>empoisonner d’abord</b>, puis attaquer pendant que ça fond. Ce mannequin a 50 points de vie. Toxicus, puis tout ce que tu veux !', goal: 'Empoisonne le mannequin, puis mets-le à terre.', target: dummy(50),
      allow: function (e, s) { return e.spell.id === 'toxicus' || s.pois ? true : 'Empoisonne-le d’abord !'; }, hit: function (e, s) { if (e.spell && e.spell.id === 'toxicus') s.pois = true; }, tick: isDown,
      well: function (s) { return 'À terre en <b>' + took(s) + ' secondes</b> : le poison travaillait pendant que tu attaquais.'; } },

    { part: 3, say: 'En duel, Toxicus se lance <b>tôt</b>. Plus le duel dure, plus il rapporte.' },
    { part: 3, say: 'Son ennemi s’appelle <b>Antidotum</b> : un sort de renfort qui efface le poison. Si votre adversaire le connaît, gardez votre énergie pour autre chose.' },
    { part: 3, say: 'Et les plus malins, une fois l’adversaire empoisonné, <b>se protègent</b> au lieu d’attaquer : le poison gagne le duel à leur place !' },
    { part: 3, say: 'À toi : le <b>coup du serpent</b>. On mord, puis on pique : Toxicus, Sagitta, Sagitta !', goal: 'Lance Toxicus, puis deux Sagitta.', count: 3, check: seq(['toxicus', 'sagitta', 'sagitta']), well: 'Sssuperbe ! Un vrai sssserpent.' },

    { part: 4, say: 'Qui veut empoisonner un mannequin devant toute la classe ? Ne vous battez pas…' },
    { part: 4, say: '<b>{nom}</b> ! Viens devant. Celui-ci est un peu spécial.' },
    { part: 4, corner: true, say: 'Ce mannequin est en <b>caoutchouc</b> : tes sorts rebondissent… sauf quand il est <b>empoisonné</b>. Il a 80 points de vie. À toi de trouver le rythme !', goal: 'Mets le mannequin de caoutchouc à terre.', target: dummy(80),
      allow: function (e, s) { return e.spell.id === 'toxicus' || s.tgt.poison > 0 ? true : 'Ça rebondit ! Empoisonne-le d’abord.'; }, tick: finalDown }
  ]);

  // ───────────────────────── Leçon 9 : Tremor ─────────────────────────
  lesson({ id: 'tremor', name: 'Tremor', color: '#d9a066', only: signs(10, ['enn']), parts: ['Les secousses', 'Le M', 'La bombe à retardement', 'En duel', 'La démonstration'] }, [
    { part: 0, say: 'Bonjour à tous ! Tenez-vous bien à vos pupitres… Aujourd’hui : <b>Tremor</b>, les secousses.' },
    { part: 0, say: 'Tremor est un sort étrange. Quand il touche… <b>il ne se passe rien</b>. Rien du tout.' },
    { part: 0, say: 'Et puis, deux ou trois secondes plus tard, le sol se met à trembler sous les pieds de la cible : <b>trois secousses</b>, coup sur coup.' },
    { part: 0, say: 'Au total, plus de dégâts qu’un Fulgur, pour le même prix. Mais il a un point faible : si l’adversaire lance <b>une protection</b> avant les secousses, tout s’annule.' }
  ], shape(1, 'tremor', 'emm', {
    a: 'un M', show: 'Son signe est un <b>M</b> : on monte, on redescend au milieu, on remonte, on redescend. Quatre traits, d’un seul geste.',
    well: 'Bien ! Et maintenant… attends un peu. Tu sens le plancher ?',
    trap: { say: 'Si vous oubliez la dernière jambe du M, vous tracez un <b>N</b>. Essaie, pour voir…', goal: 'Trace un N, comme le modèle.', glyph: 'enn',
      check: other('tenebra', 'tremor', 'Celui-là avait ses quatre jambes ! Arrête-toi après la troisième.'),
      well: 'Pas de secousses ! Le N, c’est <b>Tenebra</b>, un sort du cours d’effet. Pour Tremor : <b>quatre traits</b>, pas trois.' },
    free: 'Maintenant <b>sans modèle</b> : deux M.', freeWell: 'Parfait. Rattrapez vos encriers, ça va trembler !'
  }), [
    { part: 2, say: 'Les duellistes appellent Tremor la <b>bombe à retardement</b>. Venez voir pourquoi.' },
    { part: 2, corner: true, say: 'Ce mannequin a <b>14 points de vie</b>. Lance-lui un Tremor… et <b>compte dans ta tête</b>.', goal: 'Lance Tremor et attends les secousses.', target: dummy(14), check: is('tremor', 'Seulement Tremor !'), tick: isDown,
      well: 'Deux secondes et demie de calme… puis <b>trois secousses</b>. Il ne s’y attendait pas !' },
    { part: 2, say: 'Et pendant que ça couve, vous avez <b>les mains libres</b>. Le grand jeu, c’est de placer d’autres sorts avant même la première secousse.' },
    { part: 2, corner: true, say: 'À toi : lance <b>Tremor</b>, puis <b>deux Scintilla</b> avant que le sol se mette à trembler !', goal: 'Tremor, puis 2 Scintilla avant la première secousse.', target: plain(),
      check: function (e, s) {
        if (!e.ok) return null;
        if (e.spell.id === 'tremor') { if (s.armed) return 'Un seul Tremor suffit : maintenant, deux Scintilla !'; s.armed = true; s.k = 0; s.seen = false; return true; }
        if (e.spell.id !== 'scintilla') return 'Tremor, puis Scintilla !';
        if (!s.armed) return 'D’abord Tremor !';
        s.k++; api().say(s.k + ' !'); return true;
      },
      tick: function (s, t) {
        if (!s.armed || !t) return;
        if (s.k >= 2) return true;
        if (t.quake) s.seen = true;
        if (s.seen && (!t.quake || t.quake.done >= 1)) { s.armed = false; api().say('Trop tard ! On recommence : Tremor, puis vite deux traits.', '#ffb0a0'); }
      },
      well: 'Deux étincelles, et les secousses par-dessus le marché : ton adversaire ne sait plus où donner de la tête.' },

    { part: 3, say: 'En duel, Tremor oblige l’adversaire à <b>choisir</b> : gaspiller une protection pour l’annuler… ou encaisser.' },
    { part: 3, say: 'S’il se protège, tant mieux : pendant qu’il trace son bouclier, il ne vous attaque pas. Et vous, vous préparez déjà <b>la suite</b> !' },
    { part: 3, say: 'La suite, justement : le <b>coup de la taupe</b>. Tremor, puis Ignis. Les secousses et la boule de feu arrivent ensemble !' },
    { part: 3, say: 'À toi : le <b>coup de la taupe</b>. M, puis triangle !', goal: 'Lance Tremor, puis Ignis.', count: 2, check: seq(['tremor', 'ignis']), well: 'Par-dessous ET par-devant. Pauvre mannequin !' },

    { part: 4, say: 'Qui veut faire trembler la salle devant ses camarades ?' },
    { part: 4, say: '<b>{nom}</b> ! Viens devant. J’ai un mannequin très têtu à te présenter.' },
    { part: 4, corner: true, say: 'Celui-ci est <b>dur comme le roc</b> : rien ne l’entame… tant que le sol n’a pas tremblé sous lui. Il a 70 points de vie. Fissure-le d’abord !', goal: 'Fais trembler le mannequin, puis mets-le à terre.', target: dummy(70),
      allow: function (e, s) { return e.spell.id === 'tremor' || s.crack ? true : 'Dur comme le roc ! Fais-le d’abord trembler avec Tremor.'; }, hit: function (e, s) { if (e.quake && !s.crack) { s.crack = true; api().say('Il est fissuré : à l’attaque !', '#ffe9a0'); } }, tick: finalDown }
  ]);

  // ───────────────────────── Leçon 10 : Tornado ─────────────────────────
  var prankster = function (dur) { return function () { return { poise: true, charge: { t: 0, dur: dur, loop: true } }; }; };
  var misty = function () { return { kind: 'mannequin', mist: true }; };
  lesson({ id: 'tornado', name: 'Tornado', color: '#cfe8e0', only: signs(10), parts: ['La tornade', 'Le S', 'Couper la parole', 'Chasser la brume', 'La démonstration'] }, [
    { part: 0, say: 'Bonjour à tous ! Accrochez vos chapeaux… Aujourd’hui : <b>Tornado</b>.' },
    { part: 0, say: 'Vous souvenez-vous du Z à l’envers, à la leçon de Fulgur ? Je vous avais promis qu’on y reviendrait. <b>Nous y voilà.</b>' },
    { part: 0, say: 'Tornado frappe aussi fort que Fulgur. Mais on ne le lance pas pour ses dégâts : on le lance pour son <b>vent</b>.' },
    { part: 0, say: 'Le vent fait deux choses. Un : il <b>interrompt</b> le sort que l’adversaire est en train de tracer, à tous les coups. Deux : il <b>chasse la brume</b>. J’y reviendrai.' }
  ], shape(1, 'tornado', 'ess', {
    a: 'un S', show: 'Son signe est un <b>S</b> : on part d’en haut à droite, une boucle vers la gauche, une boucle vers la droite, et on finit en bas à gauche.',
    well: 'Quel courant d’air ! Mes parchemins…',
    trap: { cast: true, say: 'Attention à ne pas le confondre avec son cousin ! Trace un <b>Z</b>, pour comparer.', goal: 'Trace un Z.', glyph: 'zigzag',
      check: other('fulgur', 'tornado', 'Ça, c’était un S ! Trace un Z, pour comparer.'),
      well: 'Fulgur ! Le Z part vers la <b>droite</b>, le S part vers la <b>gauche</b>. Un miroir entre les deux… et deux magies différentes.' },
    free: 'Maintenant <b>sans modèle</b> : deux S, bien ronds.', freeWell: 'Deux tornades ! Refermez la porte, tout s’envole.'
  }), [
    { part: 2, say: 'À quoi sert d’interrompre ? Un adversaire qui trace un gros sort est <b>sans défense</b>… mais si vous le laissez finir, c’est vous qui le recevez.' },
    { part: 2, say: 'Une simple Scintilla suffit parfois. Mais un adversaire <b>sur ses gardes</b> ne se laisse pas avoir deux fois : il tient bon. Contre Tornado, personne ne tient bon.' },
    { part: 2, corner: true, say: 'Ce mannequin farceur prépare un <b>seau d’eau</b>… pour toi ! Regarde le cercle se remplir. Essaie de l’arrêter avec <b>Scintilla</b>.', goal: 'Essaie d’arrêter le seau d’eau avec Scintilla.',
      target: plain(prankster(6)), check: is('scintilla', 'Essaie d’abord avec Scintilla.'), tick: function (s, t) { return !!t && t.splashes >= 1; },
      well: 'Trempé ! Il se méfiait : ton étincelle ne l’a pas dérangé du tout.' },
    { part: 2, corner: true, say: 'Maintenant, coupe-lui la parole avec <b>Tornado</b>. Trois fois !', goal: 'Interromps le seau d’eau 3 fois avec Tornado.', count: 3,
      target: plain(prankster(6.5)), check: is('tornado', 'Avec Tornado !'), hit: function (e) { return !!e.interrupted; },
      well: function (s) { return s.tgt.splashes ? 'Trois fois interrompu ! (Et un peu mouillé quand même…)' : 'Trois fois interrompu, et pas une goutte sur toi !'; } },

    { part: 3, say: 'La <b>brume</b>, maintenant. Au cours de protection, vous apprendrez Vapor : on s’entoure de brume, et <b>un sort sur deux</b> passe à côté.' },
    { part: 3, corner: true, say: 'Ce mannequin se cache dans la brume. Lance-lui <b>quatre Scintilla</b>, pour voir combien le touchent.', goal: 'Lance 4 Scintilla dans la brume.', count: 4,
      target: misty, check: is('scintilla', 'Seulement Scintilla, pour compter.'), hit: function (e, s) { if (!e.missed) s.ok = (s.ok || 0) + 1; return true; },
      well: function (s) { return '<b>' + (s.ok || 0) + ' sur 4</b> ont touché. Dans la brume, c’est une vraie loterie !'; } },
    { part: 3, corner: true, say: 'Un coup de <b>Tornado</b>, et on y voit plus clair !', goal: 'Chasse la brume avec Tornado.', count: 1, target: misty, check: is('tornado', 'Avec Tornado !'), hit: function (e) { return !!e.cleared; },
      well: 'La brume s’envole… et le mannequin a pris la tornade en prime.' },
    { part: 3, say: 'En duel, gardez donc toujours assez d’énergie pour <b>un Tornado</b>. Le jour où votre adversaire commence à tracer une étoile… vous me remercierez.' },

    { part: 4, say: 'Qui veut affronter le mannequin farceur devant toute la classe ? Prévoyez une serviette.' },
    { part: 4, say: '<b>{nom}</b> ! Viens devant. Et tâche de rester au sec.' },
    { part: 4, corner: true, say: 'Il a <b>60 points de vie</b>, et il remplit son seau. S’il t’arrose, il <b>reprend des forces</b> ! Mets-le à terre… en lui coupant la parole au bon moment.', goal: 'Mets le mannequin farceur à terre.', target: dummy(60, 'mannequin', prankster(7)),
      enter: function (s) { s.sp = 0; },
      tick: function (s, t) { if (t && t.splashes > s.sp) { s.sp = t.splashes; if (t.hp > 0) { t.hp = Math.min(t.maxHp, t.hp + 15); api().say('Arrosé ! Il reprend des forces…', '#9fd8ff'); } } return finalDown(s, t); } }
  ]);

  exam(2, 11, [['Le coup de l’orage', ['sagitta', 'tonnero'], 4], ['Le coup de l’éclipse', ['scintilla', 'vespera'], 4], ['Le coup du serpent', ['toxicus', 'sagitta', 'sagitta'], 6], ['Le coup de la taupe', ['tremor', 'ignis'], 4], ['Le coup du maçon', ['terra', 'terra', 'fulgur'], 5]], [
    { part: 2, say: 'Bien. L’épreuve finale : un <b>mur de huit coups</b>, puis un mannequin <b>dans la brume</b>, 80 points de vie. Tu as <b>30 secondes</b>. Terra, Tornado… et tes enchaînements !' },
    { part: 2, corner: true, wall: 8, say: 'Trente secondes. <b>Allez !</b>', goal: 'Casse le mur, chasse la brume et mets le mannequin (80 PV) à terre en moins de 30 s.', target: dummy(80, 'mannequin', function () { return { mist: true }; }),
      enter: function (s) { s.t1 = now(); },
      tick: function (s, t) {
        if (now() - s.t1 > 30) { s.t1 = now(); api().wall(8); api().target(s.tgt = dummy(80, 'mannequin', function () { return { mist: true }; })()); api().say('Trop lent ! Le mur remonte : on recommence.', '#ffb0a0'); return; }
        if (!isDown(s, t)) return; api().say('Examen réussi en ' + secs(now() - s.t1) + ' secondes !'); return true;
      } }
  ], '#ffd978');

  // ───────────────────────── Leçon 11 : Radius ─────────────────────────
  var walker = function () { return { kind: 'mannequin', move: { amp: 0.15, per: 5 } }; };
  lesson({ id: 'radius', name: 'Radius', color: '#ff3b3b', only: signs(11), parts: ['Le rayon rouge', 'Le sigma', 'Tenir le rayon', 'En duel', 'La démonstration'] }, [
    { part: 0, say: 'Petit rappel avant de commencer : un <b>enchaînement</b> connu, lancé dans le bon ordre sans traîner, et le <b>dernier sort</b> frappe comme s’il avait <b>un niveau de plus</b>. Vous en avez déjà plusieurs dans votre grimoire : servez-vous-en !' },
    { part: 0, say: 'Bonjour à tous ! Mettez vos lunettes noires. Aujourd’hui, plus de projectile : un <b>rayon</b>. Voici <b>Radius</b>.' },
    { part: 0, say: 'Une fois le signe tracé, un rayon rouge sort de votre baguette pendant <b>trois secondes et demie</b>. Et il frappe <b>deux fois par seconde</b>, là où vous le pointez.' },
    { part: 0, say: 'Sept salves en tout. Si elles touchent toutes, c’est <b>presque autant qu’une boule de feu et sa brûlure</b>.' },
    { part: 0, say: 'Mais c’est <b>vous qui visez</b> : à côté, le rayon ne fait rien. Et tant que vous le tenez, <b>vous ne pouvez pas parer</b> !' }
  ], shape(1, 'radius', 'sigma', {
    a: 'un sigma', show: 'Son signe est un <b>Σ</b>, la lettre grecque sigma : un trait vers la gauche, une pointe qui revient vers la droite, puis un trait vers la droite. Comme un M couché.',
    guided: 'À toi ! Pars du point vert et suis le chemin. Quand le rayon sort, <b>bouge ta baguette</b> : c’est toi qui le promènes.',
    well: 'Joli ! Ne le pointe pas vers moi, s’il te plaît.',
    free: 'Maintenant <b>sans modèle</b> : deux sigmas. Pas besoin d’attendre la fin du rayon : retrace, et il se coupe.', freeWell: 'Deux rayons ! Mon tableau noir commence à sentir le brûlé.'
  }), [
    { part: 2, say: 'Tracer le signe, c’est la moitié du travail. L’autre moitié : <b>tenir le rayon sur la cible</b>. Venez devant.' },
    { part: 2, corner: true, say: 'Lance Radius, puis <b>garde ta baguette pointée sur le mannequin</b>. Chaque salve qui touche compte.', goal: 'Touche le mannequin 5 fois avec le rayon.', count: 5, check: is('radius', 'Seulement Radius !'), hit: beamHit,
      well: 'Cinq salves ! Il fume un peu, non ?' },
    { part: 2, corner: true, say: 'Trop facile ? Le voilà qui <b>se promène</b>. Suis-le avec ton rayon !', goal: 'Touche le mannequin qui bouge 5 fois avec le rayon.', count: 5, target: walker, check: is('radius', 'Seulement Radius !'), hit: beamHit,
      well: 'Tu ne l’as pas lâché ! En duel, les adversaires bougent bien moins que ça.' },
    { part: 2, say: 'En duel, votre adversaire ne se laissera pas rôtir : il déplace son <b>bouclier</b> pour arrêter le rayon. À vous d’aller là où le bouclier n’est pas !' },
    { part: 2, corner: true, say: 'Ce mannequin a un petit bouclier qui <b>court après ton rayon</b>. Sois plus rapide que lui : monte, descends, zigzague !', goal: 'Touche le mannequin 4 fois malgré son bouclier.', count: 4,
      target: function () { return { kind: 'mannequin', spot: { v: 0.42 } }; }, check: is('radius', 'Seulement Radius !'), hit: beamHit, well: 'Voilà : le rayon va toujours plus vite qu’un bouclier. À condition de <b>bouger</b> !' },

    { part: 3, say: 'En duel, Radius se lance quand l’adversaire <b>ne peut pas riposter</b> : gelé, endormi, désarmé… ou occupé à se protéger.' },
    { part: 3, say: 'Sinon, c’est lui qui vous touchera : souvenez-vous, <b>pas de parade</b> pendant le rayon. Et si vous êtes gelé ou désarmé, le rayon s’éteint tout net.' },
    { part: 3, say: 'Un bon moment pour le lancer ? Juste après Tremor. Votre adversaire s’occupe des secousses… et vous, vous sortez le rayon. C’est le <b>coup du phare</b>.' },
    { part: 3, say: 'À toi : le <b>coup du phare</b>. Tremor, puis Radius !', goal: 'Lance Tremor, puis Radius.', count: 2, check: seq(['tremor', 'radius']), well: 'Ça tremble, ça chauffe… Je n’aimerais pas être à sa place.' },

    { part: 4, say: 'Qui veut montrer son rayon à toute la classe ? Les autres, reculez d’un pas.' },
    { part: 4, say: '<b>{nom}</b> ! Viens devant. J’ai gardé le plus coriace pour toi.' },
    { part: 4, corner: true, say: 'Il <b>se promène</b>, son bouclier <b>te court après</b>, et il a 40 points de vie. Mets-le à terre… uniquement au rayon !', goal: 'Mets le mannequin à terre avec Radius.',
      target: dummy(40, 'mannequin', function () { return { move: { amp: 0.13, per: 6 }, spot: { v: 0.38 } }; }), check: is('radius', 'Uniquement le rayon, pour cette démonstration !'), tick: finalDown }
  ]);

  // ───────────────────────── Leçon 12 : Infernus ─────────────────────────
  lesson({ id: 'infernus', name: 'Infernus', color: '#ff5a1a', only: signs(12), parts: ['Le souffle du dragon', 'L’étoile', 'Dompter le dragon', 'En duel', 'Le grand final'] }, [
    { part: 0, say: 'Mes amis… nous y voilà. La <b>dernière leçon</b> du cours d’attaque. Le sort que j’ai mis vingt ans à maîtriser : <b>Infernus</b>, le souffle du dragon.' },
    { part: 0, say: 'Votre baguette crache un <b>torrent de feu</b> pendant plus de trois secondes. Huit salves, que vous dirigez. Et la cible <b>brûle encore</b> quand c’est fini.' },
    { part: 0, say: 'C’est l’attaque <b>la plus puissante</b> qui existe. Rien ne fait plus mal.' },
    { part: 0, say: 'Mais le dragon a faim : Infernus avale <b>presque toute votre énergie</b>. Et son signe est le plus difficile de tous.' }
  ], [
    { part: 1, say: 'Une <b>étoile à cinq branches</b>, d’un seul geste, sans lever la baguette : cinq grands traits qui se croisent, et on revient au point de départ. Suivez bien la lumière.', show: 'star' },
    { part: 1, say: 'À toi ! Pars du point vert et suis le chemin, branche après branche. <b>Prends tout ton temps.</b>', goal: 'Trace une étoile.', count: 1, guide: { glyph: 'star', alpha: 0.6, comet: true },
      check: is('infernus', 'Presque ! Cinq traits bien droits, qui se croisent.'), well: 'Par ma barbe ! Du premier coup, ou presque. Il m’avait fallu des semaines.' },
    { part: 1, say: 'Encore une, pour que ta main s’en souvienne. Le modèle est plus pâle, cette fois.', goal: 'Trace une étoile.', count: 1, guide: { glyph: 'star', alpha: 0.3 },
      check: is('infernus', 'Presque ! Cinq traits bien droits, qui se croisent.'), well: 'Elle rentre, cette étoile !' },
    { part: 1, say: 'Un conseil : mieux vaut une étoile <b>lente et réussie</b> qu’une étoile ratée… qui vous laisse sans défense au milieu du duel.' },
    { part: 1, say: 'Maintenant <b>sans modèle</b> : deux étoiles. Si tu n’y arrives pas tout de suite, ne t’en fais pas : moi, vingt ans !', goal: 'Trace une étoile 2 fois, sans modèle.', count: 2, check: is('infernus', 'Ce n’est pas une étoile !'),
      well: 'Deux étoiles, deux dragons. Tu es prêt pour la suite.' }
  ], [
    { part: 2, say: 'Un dragon, ça se <b>dompte</b>. Comme pour Radius, c’est vous qui dirigez le souffle. Venez devant : j’ai ressorti la glace.' },
    { part: 2, corner: true, say: 'Ce mannequin de glace a <b>35 points de vie</b>. Fais-le fondre : trace l’étoile, puis <b>garde le souffle sur lui</b>.', goal: 'Fais fondre le mannequin de glace avec Infernus.', target: dummy(35, 'glace'), check: is('infernus', 'Seulement Infernus !'), tick: isDown,
      well: function (s) { return s.casts.infernus > 1 ? 'Fondu ! Avec un souffle bien tenu, un seul aurait suffi.' : 'Fondu <b>d’un seul souffle</b> ! Il n’en reste qu’une flaque.'; } },
    { part: 2, corner: true, say: 'Plus difficile : <b>trois</b> mannequins de glace. Balaye-les avec ton souffle, de l’un à l’autre !', goal: 'Fais fondre les 3 mannequins de glace.', count: 3, target: row('glace', 10), check: is('infernus', 'Seulement Infernus !'), hit: knocked,
      well: function (s) { return s.casts.infernus > 1 ? 'Trois flaques ! Avec de l’entraînement, un seul souffle suffira pour les trois.' : 'Trois mannequins, <b>un seul souffle</b>. Un vrai dragon !'; } },

    { part: 3, say: 'En duel, on ne lance pas Infernus : on le <b>prépare</b>. Il faut que l’adversaire soit hors d’état de nuire, que votre énergie soit pleine… et que votre étoile soit parfaite.' },
    { part: 3, say: 'Si vous la ratez, vous aurez perdu un temps précieux. Si vous la réussissez… le duel est souvent <b>terminé</b>.' },
    { part: 3, say: 'Et méfiez-vous : un adversaire qui vous voit commencer une étoile n’a qu’une idée, vous <b>interrompre</b>. Vous savez maintenant avec quoi !' },

    { part: 4, say: 'Voilà. Vous connaissez les <b>douze attaques</b>. Il ne reste qu’une chose à faire : le grand examen. Un volontaire ?' },
    { part: 4, say: '<b>{nom}</b>. Évidemment. Viens devant… et montre-nous tout ce que tu as appris.' },
    { part: 4, corner: true, wall: 5, say: 'Trois épreuves : un <b>mur</b>… puis trois mannequins <b>enchaînés</b>… puis le <b>grand mannequin de glace</b>. Choisis bien tes sorts !', goal: 'Casse le mur, renverse les 3 mannequins, fais fondre la glace.',
      enter: function (s) { s.stage = 0; },
      wallHit: function (e, s) { if (e.broken && s.stage === 0) { s.stage = 1; later(1100, function () { api().target(s.tgt = row()()); api().say('Épreuve 2 : les mannequins enchaînés !'); }); } },
      hit: function (e, s) { if (s.stage === 1 && e.left === 0) { s.stage = 2; later(1100, function () { api().target(s.tgt = dummy(60, 'glace')()); api().say('Épreuve 3 : le grand mannequin de glace !'); }); } },
      tick: function (s, t) { if (s.stage !== 2 || !isDown(s, t)) return; api().say('Examen réussi en ' + took(s) + ' secondes !'); return true; } }
  ]);
})();
