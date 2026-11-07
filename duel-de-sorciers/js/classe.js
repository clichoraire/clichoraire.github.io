// La salle de classe du cours d'attaque (img/classe.jpg) et ses leçons, qu'on suit l'une après l'autre : 1. Scintilla, 2. Fulgur (ici),
// puis 3. Ignis … 12. Infernus (js/lecons.js, qui les ajoute avec DS.classe.add).
// Le cours de protection se donne avec le même moteur, dans la même salle : la professeure Égide est dessinée debout devant le pupitre, par-dessus
// le professeur Brasier de l'image (leçons dans PROT, plus bas : 1. Bloquer et renvoyer, et l'atelier du Scintillateur).
// À chaque leçon, le professeur parle (bulles), montre (une lumière trace les gestes), fait essayer, puis appelle
// l'élève devant la classe pour une démonstration sur le mannequin. Pour ajouter une leçon : une entrée de plus dans LESSONS.
// Le duel (js/duel.js) dessine le décor qu'on lui donne (room, corner) et nous prévient de chaque tracé et de chaque sort qui touche.
(function () {
  'use strict';
  var DS = window.DS, A = DS.art, SFX = DS.audio;
  var $ = function (id) { return document.getElementById(id); };
  var TAU = Math.PI * 2, IW = 1399, IH = 768; // taille de l'image de la classe ; toutes les positions ci-dessous sont en pixels de cette image
  var LESSON_XP = 30;

  // ───────────────────────── Décor : la classe ─────────────────────────
  var img = new Image(); img.src = 'img/classe.jpg';
  var view = { k: 1, ox: 0, oy: 0 }, talking = false, sprite = null;
  function fit(W, H) { view.k = Math.max(W / IW, H / IH); view.ox = (W - IW * view.k) / 2; view.oy = (H - IH * view.k) / 2; } // l'image couvre tout l'écran, centrée
  function X(x) { return view.ox + x * view.k; }
  function Y(y) { return view.oy + y * view.k; }
  var PROF = { x: 712, y: 338, rx: 52, ry: 58, py: 384 };     // le buste du professeur (découpé en ovale aux bords fondus), et son point de pivot
  var FLAMES = [[56, 250, 17], [272, 285, 11], [564, 270, 10], [1144, 285, 11], [1348, 250, 17], [706, 106, 20]]; // torches et lustre : [x, y, rayon]
  var BEAM = { x0: 824, y0: 350, x1: 892, y1: 347, r: 27 };   // le sort que le professeur tient pointé sur le mannequin
  var DUMMY = { x: 955, fy: 470, h: 170, cy: 376 };           // le mannequin de l'image : c'est là qu'arrivent nos étincelles
  var PANEL = [478, 608, 932, 768];                           // là où l'image avait un panneau dessiné : on y pose le nôtre
  // Le buste du professeur, découpé une fois pour toutes : on le redessine légèrement décalé pour qu'il respire et hoche la tête en parlant.
  function makeSprite() {
    var c = document.createElement('canvas'), w = PROF.rx * 2, h = PROF.ry * 2; c.width = w; c.height = h;
    var g = c.getContext('2d'); g.drawImage(img, PROF.x - PROF.rx, PROF.y - PROF.ry, w, h, 0, 0, w, h);
    g.globalCompositeOperation = 'destination-in'; g.translate(w / 2, h / 2); g.scale(1, PROF.ry / PROF.rx);
    var gr = g.createRadialGradient(0, 0, PROF.rx * 0.62, 0, 0, PROF.rx); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(-w, -h, w * 2, h * 2);
    return c;
  }
  // Le cours de protection : la professeure Égide, dessinée debout devant le pupitre (elle cache le professeur de l'image), sa baguette tendue vers le mannequin.
  var EGIDE = { x: 712, fy: 526, h: 232, tip: [790, 338] }, imgProt = null, aimProf = false; // aimProf : nos sorts visent la professeure elle-même, pas le mannequin (leçon d'introduction)
  // L'image sans le professeur Brasier : on recouvre sa place avec des morceaux voisins de l'image (mur au-dessus, bannière en miroir, pupitre en miroir).
  function makeProtImage() {
    var c = document.createElement('canvas'); c.width = IW; c.height = IH;
    var g = c.getContext('2d'); g.drawImage(img, 0, 0);
    g.drawImage(img, 790, 196, 60, 100, 790, 300, 60, 100);                         // le mur de pierre, à droite de la bannière (son bras et sa baguette)
    g.save(); g.translate(1420, 0); g.scale(-1, 1); g.drawImage(img, 628, 286, 56, 100, 628, 286, 56, 100); g.restore(); // la bannière : le côté gauche, en miroir, sur le côté droit
    g.save(); g.translate(1420, 0); g.scale(-1, 1); g.drawImage(img, 718, 384, 66, 30, 718, 384, 66, 30); g.restore();   // le dessus du pupitre, en miroir (sa main et la plume)
    g.drawImage(img, 690, 236, 40, 50, 690, 300, 40, 50);                            // le haut de sa tête : un bout de bannière juste au-dessus
    // Le rayon qu'il tenait pointé sur le mannequin : Égide, elle, ne l'attaque pas.
    g.drawImage(img, 794, 232, 54, 62, 794, 318, 54, 62);                            // le mur entre la bannière et le tableau
    var gr = g.createLinearGradient(0, 304, 0, 374); gr.addColorStop(0, '#1f2337'); gr.addColorStop(1, '#23273e');
    g.fillStyle = gr; g.fillRect(856, 304, 70, 72);                                  // le bas du tableau noir, repeint (l'anneau de lumière)
    g.drawImage(img, 856, 266, 70, 12, 856, 374, 70, 12);                            // le cadre du bas : une copie du cadre du haut
    for (var yy = 304; yy < 376; yy += 24) g.drawImage(img, 844, 280, 14, 24, 844, yy, 14, Math.min(24, 376 - yy)); // le cadre de gauche, éclairé en bleu : le même, pris plus haut
    g.drawImage(img, 800, 386, 46, 20, 848, 386, 46, 20); g.drawImage(img, 800, 386, 32, 20, 894, 386, 32, 20); // le mur sous le tableau
    g.save(); g.strokeStyle = 'rgba(235,240,230,0.75)'; g.lineWidth = 1.6; g.lineCap = 'round'; g.lineJoin = 'round'; // à la craie : le dessin de la parade
    g.beginPath(); g.moveTo(866, 322); g.lineTo(892, 322); g.lineTo(892, 338); g.quadraticCurveTo(892, 352, 879, 358); g.quadraticCurveTo(866, 352, 866, 338); g.closePath(); g.stroke(); // un bouclier
    g.beginPath(); g.moveTo(869, 336); g.lineTo(889, 336); g.moveTo(879, 322); g.lineTo(879, 358); g.stroke();
    g.beginPath(); g.moveTo(904, 372); g.lineTo(916, 362); g.stroke();                                                   // la baguette
    g.beginPath(); g.moveTo(898, 348); g.quadraticCurveTo(912, 338, 920, 350); g.stroke();                                // l'arc du sort qui rebondit
    g.beginPath(); g.moveTo(915, 348); g.lineTo(920, 350); g.lineTo(917, 344); g.stroke();
    g.restore();
    return c;
  }
  function drawRoom(g, W, H, t, who) {
    fit(W, H);
    if (!img.complete || !img.naturalWidth) { g.fillStyle = '#17132a'; g.fillRect(0, 0, W, H); return; }
    if (who !== 'attaque' && !imgProt) imgProt = makeProtImage();
    g.drawImage(who !== 'attaque' ? imgProt : img, view.ox, view.oy, IW * view.k, IH * view.k);
    var k = view.k, bob = Math.sin(t * 1.6) * 0.7, rot = Math.sin(t * 0.9) * 0.005, D = DS.duel.state;
    if (talking) { bob += Math.sin(t * 9.3) * 0.9 + Math.sin(t * 5.1) * 0.7; rot += Math.sin(t * 6.2) * 0.016 + Math.sin(t * 3.7) * 0.01; }
    if (who !== 'attaque') { // Égide, ou Oculus : dessinés debout devant le pupitre
      var casting = D && D.f.state === 'cast', shield = D && D.f.shield > 0, tip = casting || shield ? { x: X(EGIDE.tip[0]), y: Y(EGIDE.tip[1]) } : null; // la baguette ne se lève que pour lancer un sort, ou lever son bouclier
      A.drawWizard(g, DS.PROFS[who] || DS.PROFS.protection, X(EGIDE.x), Y(EGIDE.fy + bob * 0.6), EGIDE.h * k, { age: 'adult', tip: tip, face: casting || shield ? 'cast' : talking ? 'happy' : null, talk: talking && !casting ? t : null, glow: casting ? D.f.spell.color : shield ? '#bfe6ff' : null });
      if (shield) { // son bouclier de maître : une bulle de lumière, bien plus grande que la nôtre, qui l'enveloppe
        var al = Math.min(1, D.f.shield / 0.25), cx = X(EGIDE.x), cy = Y(EGIDE.fy - EGIDE.h * 0.52), ry = EGIDE.h * 0.62 * k, rx = ry * 0.7;
        g.save(); g.globalCompositeOperation = 'lighter'; g.translate(cx, cy); g.scale(rx / ry, 1);
        var sg = g.createRadialGradient(0, 0, ry * 0.3, 0, 0, ry); sg.addColorStop(0, 'rgba(150,215,255,0)'); sg.addColorStop(0.8, 'rgba(150,215,255,' + 0.22 * al + ')'); sg.addColorStop(1, 'rgba(190,230,255,' + 0.6 * al + ')');
        g.fillStyle = sg; g.beginPath(); g.arc(0, 0, ry, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(255,255,255,' + 0.7 * al + ')'; g.lineWidth = 2.5 * k; g.stroke(); g.restore();
        A.glowDot(g, tip.x, tip.y, 14 * k * (1 + 0.15 * Math.sin(t * 11)), '#bfe6ff', 0.8 * al);
      }
    } else {
      if (!sprite) sprite = makeSprite();
      g.save(); g.translate(X(PROF.x), Y(PROF.py + bob)); g.rotate(rot);
      g.drawImage(sprite, -PROF.rx * k, (PROF.y - PROF.ry - PROF.py) * k, PROF.rx * 2 * k, PROF.ry * 2 * k); g.restore();
    }
    g.save(); g.globalCompositeOperation = 'lighter';
      FLAMES.forEach(function (f, i) {
        var fl = 0.8 + 0.2 * Math.sin(t * 9 + i * 1.7) + 0.1 * Math.sin(t * 21 + i * 3.1), R = f[2] * 4.4 * fl * k, x = X(f[0]), y = Y(f[1]);
        var gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, 'rgba(255,190,90,' + 0.3 * fl + ')'); gr.addColorStop(0.4, 'rgba(255,130,50,' + 0.12 * fl + ')'); gr.addColorStop(1, 'rgba(255,120,40,0)');
        g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2);
      });
    g.restore();
    if (who !== 'attaque') return; // Égide et Oculus ne visent pas le mannequin : pas de rayon
    for (var i = 0; i < 3; i++) { var u = (t * 1.3 + i / 3) % 1; A.glowDot(g, X(BEAM.x0 + (BEAM.x1 - BEAM.x0) * u), Y(BEAM.y0 + (BEAM.y1 - BEAM.y0) * u), 9 * k, '#9fd8ff', 0.7 * Math.sin(u * Math.PI)); } // l'énergie court le long du sort
    A.glowDot(g, X(BEAM.x1 + 12), Y(BEAM.y1), BEAM.r * k * (1 + 0.12 * Math.sin(t * 7)), '#6fb8ff', 0.28 + 0.12 * Math.sin(t * 5));
  }
  function anchor(W, H) {
    fit(W, H); var gc = { x: X(EGIDE.tip[0]), y: Y(EGIDE.tip[1]) };
    if (aimProf) return { x: X(EGIDE.x), fy: Y(EGIDE.fy), h: EGIDE.h * view.k, cx: X(EGIDE.x), cy: Y(EGIDE.fy - EGIDE.h * 0.58), gc: gc }; // nos sorts filent vers la professeure (leçon d'introduction)
    return { x: X(DUMMY.x), fy: Y(DUMMY.fy), h: DUMMY.h * view.k, cx: X(DUMMY.x), cy: Y(DUMMY.cy), gc: gc };
  }
  var room = { draw: function (g, W, H, t) { drawRoom(g, W, H, t, 'attaque'); }, anchor: anchor };
  var roomProt = { draw: function (g, W, H, t) { drawRoom(g, W, H, t, 'protection'); }, anchor: anchor };
  var roomAna = { draw: function (g, W, H, t) { drawRoom(g, W, H, t, 'analyse'); }, anchor: anchor };
  // Le coin de la classe, face au mannequin : la salle de duel redécorée (tableau noir, élèves qui regardent).
  var cornerHall = null;
  var corner = {
    draw: function (g, W, H, t) {
      if (!cornerHall || cornerHall.key !== W + 'x' + H) { cornerHall = A.makeHall(W, H, Math.min(2, window.devicePixelRatio || 1), 'classe'); cornerHall.key = W + 'x' + H; }
      g.drawImage(cornerHall.canvas, 0, 0, W, H); A.drawHallLive(g, cornerHall.geo, t);
    }
  };

  // ───────────────────────── Les leçons ─────────────────────────
  // Un trait-modèle : centre (cx, cy) et longueur en fractions de la hauteur de l'écran, angle en degrés (0 = vers la droite, 90 = vers le bas).
  function st(cx, cy, len, deg) {
    var W = window.innerWidth, H = window.innerHeight, a = deg * Math.PI / 180, dx = Math.cos(a) * len / 2 * H / W, dy = Math.sin(a) * len / 2;
    return { x0: 0.5 + cx * H / W - dx, y0: 0.5 + cy - dy, x1: 0.5 + cx * H / W + dx, y1: 0.5 + cy + dy, state: 'todo' };
  }
  var isLine = function (e) { return e.ok && e.spell.id === 'scintilla'; };
  var isZ = function (e) { return e.ok && e.spell.id === 'fulgur'; };
  var oblique = function (e) { return Math.abs(e.geo.ang) >= 15; };
  var Z3 = function () { return [st(0, -0.12, 0.3, 0), st(0, 0.03, 0.42, 135), st(0, 0.18, 0.3, 0)]; }; // les trois traits d'un Z, séparés
  var COMBO = ['scintilla', 'scintilla', 'fulgur'], COMBO_NAMES = ['Scintilla', 'Scintilla', 'Fulgur'];   // l'enchaînement « un-deux-trois »
  var nameOf = function (id) { return DS.byId(DS.SPELLS, id).name; };
  // Vérifications toutes faites : is(id) → c'est bien ce sort · seq([ids]) → ces sorts-là, dans l'ordre
  function is(id, wrong) { return function (e) { return e.ok && e.spell.id === id ? true : e.ok ? (wrong || 'Ça, c’est ' + e.spell.name + ' ! Ici, on veut ' + nameOf(id) + '.') : null; }; }
  function seq(ids) { return function (e, s) { var want = ids[s.n % ids.length]; return e.ok && e.spell.id === want ? true : e.ok ? 'Là, il fallait ' + nameOf(want) + ' !' : null; }; }
  function secs(t) { return String(Math.round(t * 10) / 10).replace('.', ','); }
  var combo = function (e, k) { return e.ok && e.spell.id === COMBO[k % 3] ? true : e.ok ? 'Là, il fallait ' + COMBO_NAMES[k % 3] + ' !' : null; };
  // Chaque étape : part (numéro de partie), say (ce que dit le professeur), goal (objectif affiché en bas), et selon le cas :
  //   demo() → traits que le professeur montre · show → forme entière qu'il montre (une lumière la parcourt)
  //   strokes() ou guide { glyph, alpha, comet, size, flip } → modèle affiché pendant l'exercice · check(e, s) → retourne true quand un tracé compte, ou un message
  //   count → nombre de réussites demandées · within → en moins de tant de secondes · noCast → le sort ne part pas
  //   corner → on est devant le mannequin · hits → on compte les sorts qui touchent
  // Exercices devant le mannequin (voir « Cibles des cours » dans js/duel.js) :
  //   target() → la cible de l'exercice (mannequin de glace, rangée, bouclier, barre de vie…) · wall → un mur de tant de coups devant elle
  //   enter(s) → au début de l'exercice · tick(s, cible) → dix fois par seconde ; true = exercice réussi
  //   allow(e, s) → avant qu'un sort fasse effet sur la cible : un message (ou false) le refuse
  //   hit(e, s) → un sort a touché : true (ou un nombre) compte autant de réussites, un message s'affiche · wallHit(e, s) → le mur a pris un coup ; true = réussi
  //   Avec hits, hit, tick ou wallHit, check ne compte plus rien : il dit seulement si le sort a le droit de partir.
  var STEPS1 = [
    { part: 0, say: 'Bonjour à tous ! Installez-vous. Aujourd’hui, première leçon du cours d’attaque : <b>Scintilla</b>.' },
    { part: 0, say: 'C’est le sort de combat le plus populaire. Pourquoi ? Il demande <b>très peu d’énergie</b>, et il envoie sur l’adversaire une petite décharge d’énergie pure.' },
    { part: 0, say: 'Le maîtriser n’a rien de sorcier… enfin, si, justement : il suffit d’avoir <b>le don de la magie</b> !' },
    { part: 0, say: 'C’est aussi l’attaque la <b>moins puissante de toutes</b>. Et pourtant, en duel, elle vaut de l’or. Pour plusieurs raisons.' },
    { part: 0, say: 'Les dégâts, bien sûr : petits, mais ils s’additionnent. Et surtout, Scintilla <b>interrompt</b> un adversaire en train d’incanter un sort plus puissant… donc plus long à tracer.' },

    { part: 1, say: 'Le geste est tout simple : <b>un trait</b> de baguette. Peu importe l’angle… sauf à la verticale. Regardez bien.', demo: function () { return { strokes: [st(0, 0.03, 0.3, 0)], per: 0.45, gap: 0.9 }; } },
    { part: 1, say: 'À toi ! Garde <kbd>Espace</kbd> enfoncé, trace un trait comme celui-ci avec ta baguette, puis relâche.', goal: 'Trace un trait.', count: 1,
      strokes: function () { return [st(0, 0.03, 0.3, 0)]; }, check: function (e) { return isLine(e) || (e.ok ? 'Ça, c’est ' + e.spell.name + ' ! Un simple trait suffit.' : null); }, well: 'Voilà ! Tu as vu l’étincelle filer vers le mannequin ?' },
    { part: 1, say: 'Maintenant <b>en biais</b>, pour voir que l’angle n’a pas d’importance.', goal: 'Trace un trait en biais.', count: 1,
      strokes: function () { return [st(0, 0.03, 0.32, -35)]; }, check: function (e) { return isLine(e) ? (oblique(e) || 'Plus penché ! Suis le modèle.') : null; }, well: 'Parfait. En biais, ça part tout aussi bien.' },
    { part: 1, say: 'Et <b>à la verticale</b> ? Essaie, pour voir…', goal: 'Trace un trait bien vertical.', count: 1, noCast: true,
      strokes: function () { return [st(0, 0.03, 0.3, 90)]; },
      check: function (e) { return (!e.ok && e.why === 'vertical') || (isLine(e) ? 'Celui-là penchait encore un peu. Bien droit, de haut en bas !' : null); }, well: 'Rien du tout ! À la verticale, Scintilla ne part jamais. Retenez-le bien.' },

    { part: 2, say: 'Passons aux <b>rafales</b>. Quand on enchaîne plusieurs Scintilla, chacun a ses préférences : il existe plusieurs écoles.' },
    { part: 2, say: 'La plus simple, c’est la <b>rafale droite</b> : des traits horizontaux, l’un après l’autre. Comme ceci.', demo: function () { return { strokes: [st(0, -0.09, 0.3, 0), st(0, 0.03, 0.3, 0), st(0, 0.15, 0.3, 0)], per: 0.22, gap: 0.16 }; } },
    { part: 2, say: 'À toi : <b>trois traits de suite</b>, sans traîner !', goal: 'Lance 3 Scintilla en moins de 6 secondes.', count: 3, within: 6,
      strokes: function () { return [st(0, -0.09, 0.3, 0), st(0, 0.03, 0.3, 0), st(0, 0.15, 0.3, 0)]; }, check: function (e) { return isLine(e) || null; }, well: 'Belle rafale ! Trois étincelles en un clin d’œil.' },
    { part: 2, say: 'D’autres préfèrent la <b>technique du griffon</b> : deux traits en biais qui se croisent, comme un coup de griffes. Attention : on relâche la baguette entre les deux !',
      demo: function () { return { strokes: [st(0, 0.03, 0.36, 45), st(0, 0.03, 0.36, 135)], per: 0.24, gap: 0.2 }; } },
    { part: 2, say: 'À toi : les <b>griffes du griffon</b> ! Un trait en biais, tu relâches, puis l’autre en travers.', goal: 'Trace deux traits en biais qui se croisent.', count: 2,
      strokes: function () { return [st(0, 0.03, 0.36, 45), st(0, 0.03, 0.36, 135)]; },
      check: function (e, s) {
        if (!isLine(e)) return null;
        if (!oblique(e)) return 'Plus penché ! Les griffes vont en biais.';
        if (s.n === 1 && e.geo.ang * s.first > 0) return 'L’autre griffe va dans l’autre sens : croise la première !';
        s.first = e.geo.ang; return true;
      }, well: 'Un vrai coup de griffes ! Le griffon serait fier.' },
    { part: 2, say: 'Et puis il y a les amateurs de <b>rythme</b> : un trait, un trait à côté, on revient au premier, puis au second… Avec un tempo régulier, ça donne un vrai battement. Écoutez : un, deux, trois, quatre !',
      demo: function () { return { strokes: [st(-0.2, 0.03, 0.26, 0), st(0.2, 0.03, 0.26, 0)], order: [0, 1, 0, 1, 0, 1, 0, 1], per: 0.2, gap: 0.3, drum: true }; } },
    { part: 2, say: 'À toi : <b>quatre traits en rythme</b>. Gauche, droite, gauche, droite… et écoute le tambour !', goal: 'Lance 4 Scintilla en rythme.', count: 4, drum: true, order: [0, 1, 0, 1],
      strokes: function () { return [st(-0.2, 0.03, 0.26, 0), st(0.2, 0.03, 0.26, 0)]; }, check: function (e) { return isLine(e) || null; },
      well: function (s) { // régulier si les écarts entre les traits se ressemblent
        var gaps = [s.times[1] - s.times[0], s.times[2] - s.times[1], s.times[3] - s.times[2]], mean = (gaps[0] + gaps[1] + gaps[2]) / 3;
        return Math.max(Math.abs(gaps[0] - mean), Math.abs(gaps[1] - mean), Math.abs(gaps[2] - mean)) / mean < 0.3 ? 'Quel tempo ! Un vrai batteur.' : 'Pas mal ! Avec le même écart entre chaque trait, ce sera un vrai battement.';
      } },

    { part: 3, say: 'Revenons à notre trait. À force de lancer Scintilla, on découvre vite <b>deux petites choses</b>.' },
    { part: 3, say: 'Un : le trait n’a pas besoin d’être parfait. <b>Un peu croche</b>, il fonctionne quand même.' },
    { part: 3, say: 'Deux : <b>la longueur compte</b>. Trop long, le sort part… mais vous perdez un temps précieux. Trop court, il ne se passe rien du tout !' },
    { part: 3, say: 'Essaie donc un <b>tout petit trait</b>, pour voir.', goal: 'Trace un trait minuscule.', count: 1, noCast: true,
      strokes: function () { return [st(0, 0.03, 0.07, 0)]; },
      check: function (e) { return (!e.ok && e.why === 'short') || (isLine(e) ? 'Celui-là était assez long, alors il est parti ! Fais-en un vraiment minuscule.' : null); }, well: 'Tu vois ? Trop court : pas d’étincelle.' },
    { part: 3, say: 'Et maintenant, le <b>trait idéal</b> : ni trop court, ni trop long. À peu près comme le modèle.', goal: 'Trace un trait de la bonne longueur.', count: 1,
      strokes: function () { return [st(0, 0.03, 0.27, 0)]; },
      check: function (e) { return isLine(e) ? (e.geo.len <= window.innerHeight * 0.42 || 'Ça marche… mais c’est long ! Plus court, tu gagneras du temps.') : null; }, well: 'Parfait : juste ce qu’il faut.' },

    { part: 4, say: 'Bien ! Il me faut maintenant <b>un volontaire</b> pour montrer tout ça à la classe…' },
    { part: 4, say: '<b>{nom}</b> ! Oui, toi. Viens devant, face au mannequin.' },
    { part: 4, corner: true, say: 'Montre-nous : touche le mannequin <b>5 fois</b> avec Scintilla. Rafale droite, griffon ou rythme : comme tu préfères !', goal: 'Touche le mannequin 5 fois.', count: 5, hits: true,
      check: function (e) { return isLine(e) || (e.ok ? 'Seulement Scintilla, pour cette démonstration !' : null); }, well: 'Bravo ! Applaudissez votre camarade !' }
  ];
  var STEPS2 = [
    { part: 0, say: 'Bonjour à tous ! La dernière fois, vous avez apprivoisé Scintilla. Aujourd’hui, on passe à la vitesse supérieure : <b>Fulgur</b>.' },
    { part: 0, say: 'Fulgur, c’est un éclat d’énergie pure. Il frappe <b>deux fois plus fort</b> que Scintilla.' },
    { part: 0, say: 'Mais sa vraie force, c’est sa <b>vitesse</b>. Il traverse la salle en un clin d’œil : l’adversaire a rarement le temps de lever son bouclier.' },
    { part: 0, say: 'Rien n’est gratuit en magie : Fulgur coûte <b>plus du double d’énergie</b>. Deux Fulgur de suite, et votre réserve est presque vide !' },
    { part: 0, say: 'Retenez donc ceci : Scintilla pour harceler, Fulgur pour <b>frapper au bon moment</b>.' },

    { part: 1, say: 'Son signe est un <b>Z</b> : un trait vers la droite, une diagonale qui redescend vers la gauche, puis un trait vers la droite. Suivez la lumière.', show: 'zigzag' },
    { part: 1, say: 'À toi ! Garde <kbd>Espace</kbd> enfoncé, pars du point vert et suis le chemin. Ne relâche qu’à la toute fin.', goal: 'Trace un Z.', count: 1, guide: { glyph: 'zigzag', alpha: 0.6, comet: true },
      check: function (e) { return isZ(e) || (e.ok ? 'Presque ! Suis bien le chemin, d’un seul geste.' : null); }, well: 'Voilà ! Tu as vu comme il a filé ?' },
    { part: 1, say: 'Le secret du Z : il se trace <b>d’un seul geste</b>. Essaie donc de relâcher la baguette après chaque trait, pour voir ce qui part…', goal: 'Trace les 3 traits du Z, en relâchant entre chacun.', count: 3,
      strokes: Z3, check: function (e) { return isLine(e) || (isZ(e) ? 'Celui-là était d’un seul geste ! Relâche après chaque trait, pour voir.' : null); },
      well: 'Trois petites étincelles au lieu d’un éclat ! Si vous relâchez en route, votre Fulgur tombe en miettes.' },
    { part: 1, say: 'Autre piège : le Z <b>à l’envers</b>, comme dans un miroir. Essaie, pour voir…', goal: 'Trace un Z à l’envers, comme le modèle.', count: 1, noCast: true, guide: { glyph: 'zigzag', alpha: 0.6, comet: true, flip: true },
      check: function (e) { return isZ(e) ? 'Ça, c’était un vrai Z ! Fais-le à l’envers, comme le modèle.' : isLine(e) ? null : (e.ok || e.why === 'unknown'); },
      well: 'Pas de Fulgur ! Un Z à l’envers, c’est un <b>S</b>… et le S appartient à une tout autre magie, que vous apprendrez bien plus tard.' },

    { part: 2, say: 'Parlons maintenant de la qualité. Un Z <b>bien net</b>, aux deux coins bien marqués, frappe plus fort : votre baguette vous le dit, « Parfait ! ».' },
    { part: 2, say: 'Un Z <b>brouillon</b>, tout mou, part quand même… mais il frappe moins fort.' },
    { part: 2, say: 'À toi : un Z <b>soigné</b>. Prends ton temps, et marque bien les deux coins.', goal: 'Trace un Z bien net (pas de « Brouillon »).', count: 1, guide: { glyph: 'zigzag', alpha: 0.3 },
      check: function (e, s) { if (!isZ(e)) return e.ok ? 'Ce n’est pas un Z ! Un trait, une diagonale, un trait.' : null; s.q = e.quality; return e.quality !== 'passable' || 'Un peu brouillon ! Marque mieux les deux coins.'; },
      well: function (s) { return s.q === 'parfait' ? 'Parfait ! Celui-là frappe de toutes ses forces.' : 'Bien net ! Avec des coins encore plus francs, ta baguette dira « Parfait ! ».'; } },
    { part: 2, say: 'Dernière chose : la <b>taille</b>. Un grand Z est joli, mais long à tracer. En duel, on le fait <b>petit et sec</b>.' },
    { part: 2, say: 'Essaie : un <b>petit Z</b>, pas plus grand que le modèle.', goal: 'Trace un petit Z.', count: 1, guide: { glyph: 'zigzag', alpha: 0.5, size: 0.15 },
      check: function (e) { return isZ(e) ? (e.geo.len <= window.innerHeight * 0.3 || 'Encore trop grand ! Plus petit, comme le modèle.') : e.ok ? 'Ce n’est pas un Z !' : null; }, well: 'Petit, mais tout aussi puissant. Et tellement plus vite fait !' },

    { part: 3, say: 'Voyons comment on s’en sert en duel. Trois Fulgur d’affilée ? Votre réserve d’énergie n’y survivrait pas. Les bons duellistes <b>mélangent</b>.' },
    { part: 3, say: 'L’enchaînement classique, c’est le <b>un-deux-trois</b> : deux Scintilla pour occuper l’adversaire, puis Fulgur pour frapper. Trait, trait… Z !' },
    { part: 3, say: 'À toi : <b>Scintilla, Scintilla, Fulgur</b>. Trait, trait… Z !', goal: 'Lance Scintilla, Scintilla, puis Fulgur.', count: 3,
      check: function (e, s) { return combo(e, s.n); }, well: 'Un, deux… et bam ! Voilà un enchaînement de duelliste.' },
    { part: 3, say: 'Et si votre adversaire se cache derrière son bouclier à chaque étincelle ? Fulgur arrive <b>avant qu’il ait réagi</b>. À condition de le tracer vite !' },
    { part: 3, say: 'Et maintenant, le <b>secret des enchaînements</b>. Quand vous lancez les sorts d’un enchaînement connu <b>dans le bon ordre, sans traîner</b> (moins de trois secondes et demie entre deux), la magie s’accumule : le <b>dernier sort</b> frappe comme s’il avait <b>un niveau de plus</b> !' },
    { part: 3, say: 'Vous le verrez briller : « ✦ Le un-deux-trois ! ✦ ». Chaque leçon vous apprendra un enchaînement de plus : le coup du dragon, le coup de l’archer, le coup du maçon… Retenez-les bien, ils sont tous dans votre grimoire.' },
    { part: 3, say: 'Dernier exercice à vos places : <b>trois Fulgur en moins de 8 secondes</b>. Petits, nets, d’un seul geste… et sans modèle !', goal: 'Lance 3 Fulgur en moins de 8 secondes.', count: 3, within: 8,
      check: function (e) { return isZ(e) || (e.ok ? 'Seulement des Z !' : null); }, well: 'Trois éclats coup sur coup ! En duel, pense quand même à ta réserve d’énergie.' },

    { part: 4, say: 'Bien ! Il me faut <b>un volontaire</b> pour montrer Fulgur à toute la classe…' },
    { part: 4, say: '<b>{nom}</b> ! Encore toi ? Parfait. Viens devant, face au mannequin.' },
    { part: 4, corner: true, say: 'Montre-nous le <b>un-deux-trois</b>, deux fois de suite : Scintilla, Scintilla, Fulgur… et on recommence !', goal: 'Touche le mannequin : Scintilla, Scintilla, Fulgur — 2 fois.', count: 6, hits: true,
      check: function (e, s) { var r = combo(e, s.sent); if (r === true) s.sent++; return r; }, well: 'Bravo ! Applaudissez votre camarade !' }
  ];
  // id : le sort appris (et la clé de save.lessons) · only : formes reconnues pendant la leçon (toutes si absent) · sound : son des démonstrations
  var ATTACK = [
    { id: 'scintilla', name: 'Scintilla', color: '#7fd4ff', parts: ['Le sort le plus populaire', 'Un simple trait', 'Les rafales', 'Le bon geste', 'La démonstration'], steps: STEPS1 },
    { id: 'fulgur', name: 'Fulgur', color: '#dfe6ff', only: ['line', 'zigzag', 'ess'], parts: ['L’éclat qui file', 'Le Z', 'Un beau Z', 'En duel', 'La démonstration'], steps: STEPS2 }
  ];

  // ───────────────────────── Cours de protection ─────────────────────────
  // Étapes propres à ce cours (en plus de say, goal, count, well) :
  //   cast: { id, trace, flight } → la professeure nous lance ce sort, encore et encore, tant que l'exercice dure
  //   machine: { n, every, flight, irregular } → n Scintillateurs tirent une étincelle toutes les every secondes (au hasard si irregular)
  //   parry: 'any' (bloquer ou renvoyer) | 'return' (renvoyer seulement) → ce qui compte comme une réussite · figure: 'parry' | 'return' → le schéma animé
  //   riposte: k → on lance nos sorts sur la professeure elle-même : son bouclier de maître les bloque et nous les renvoie, en k fois leur temps de vol
  //            (check dit quel sort elle attend ; parry et said (e, S) → le message quand le retour nous arrive, c'est lui qui compte)
  // La leçon d'introduction, obligatoire : la professeure provoque la classe, se fait attaquer… et retourne tout à l'envoyeur, deux fois plus vite.
  var saidBack = ['Aïe ! Déjà revenu ?!', 'Encore ! Tu n’as rien vu venir.', 'Et de trois. Convaincu ?'];
  var ISTEPS = [
    { part: 0, say: 'Alors ? On fait les malins, hein ? Vous avez appris quelques sorts d’attaque, et voilà : vous êtes prêts à aller conquérir le monde.' },
    { part: 0, say: 'Mais laissez-moi vous dire une chose…' },
    { part: 0, say: '<b>VOUS. N’ÊTES. PAS. PRÊTS.</b>' },
    { part: 1, say: 'Vous ne me croyez pas ? Hé, toi ! Oui, toi, {nom}, qui a l’air d’un macaque, au fond de la classe ! Viens ici.' },
    { part: 1, say: 'Lance-moi <b>Scintilla</b>. N’aie pas peur : tu peux m’en lancer deux ou trois. Vas-y, un simple trait, de toutes tes forces.', goal: 'Lance 3 Scintilla à la professeure.', riposte: 0.5, count: 3,
      check: function (e) { return (e.ok && e.spell.id === 'scintilla') || (e.ok ? 'Non, non : <b>Scintilla</b>, un simple trait.' : null); },
      parry: function () { return true; }, said: function (e, S) { return e.outcome === 'parry' ? 'Oh ! Bloqué ! Pas mal… pour un macaque.' : saidBack[Math.min(S.n - 1, saidBack.length - 1)]; },
      well: 'Hé hé. Désolée pour la figure, {nom}. Tu as vu ça ? Avant même que ton étincelle arrive, mon <b>bouclier de maître</b> était levé… et ton sort est reparti <b>deux fois plus vite</b> qu’il n’est venu.' },
    { part: 2, say: 'Voilà pourquoi vous êtes ici. Attaquer, c’est facile : n’importe quel macaque peut lancer une étincelle. <b>Se protéger</b>, c’est ça, la vraie magie.' },
    { part: 2, say: 'Un sorcier qui ne sait pas se protéger ne gagne jamais un duel : il se fait renvoyer ses propres sorts à la figure. Un sorcier qui sait <b>bloquer</b>, <b>renvoyer</b> et <b>dévier</b> ne perd presque jamais.' },
    { part: 2, say: 'Dans ce cours, vous apprendrez tout ça. Et un jour, peut-être, vous ferez ce que je viens de faire. Retourne t’asseoir, {nom}… et bravo pour ton courage. Prochaine leçon : <b>bloquer et renvoyer</b>.' }
  ];
  var PSTEPS1 = [
    { part: 0, say: 'Bonjour à tous, bonjour, bonjour ! Prenez une place… oui, voilà, merci. Bien. Commençons immédiatement.' },
    { part: 0, say: 'Ce premier vrai cours sur la protection contre les tirs magiques se fera en deux volets : la <b>théorie</b>, puis la <b>pratique</b>.' },
    { part: 1, say: 'Sachez d’abord qu’il existe des exceptions : certains sorts ne peuvent être bloqués qu’avec un autre sort.' },
    { part: 1, say: 'Pour atteindre la défense parfaite, vous devrez donc connaître <b>tous</b> les sorts magiques. C’est justement pour cela que cette école existe !' },
    { part: 1, say: 'Pour les tirs magiques de base, tels que Scintilla, Fulgur et Ignis, une boule d’énergie magique se manifeste. Avec une attention particulière, vous pourrez la <b>bloquer</b>, la <b>renvoyer</b>, ou encore la <b>dévier</b>.' },
    { part: 1, figure: 'parry', say: 'Pour le blocage, il faut concentrer une partie de votre mana à la pointe de la baguette magique. Regardez le schéma : un anneau se referme là où le sort va frapper. Quand il devient <b>doré</b>, c’est le moment !' },
    { part: 2, say: '{nom} ! Viens devant la classe, s’il te plaît : nous allons faire une démonstration. Je vais te lancer un sort bien lent.' },
    { part: 2, figure: 'parry', say: 'Amène ta baguette <b>dans l’anneau</b> avec la souris, puis <b>clique</b> quand l’anneau devient <b>doré</b>. Trois fois !', goal: 'Bloque 3 sorts de la professeure.',
      cast: { id: 'ignis', trace: 1.1, flight: 3.2 }, parry: 'any', count: 3, well: 'Voilà ! Le bouclier se forme au bout de ta baguette, le temps d’un battement de cils. C’est tout ce qu’il faut.' },
    { part: 3, figure: 'return', say: 'Maintenant, plus fort : <b>renvoyer</b> le sort à l’envoyeur. Le secret ? Cliquer au <b>tout dernier instant</b>, quand la boule est presque sur toi.' },
    { part: 3, figure: 'return', say: 'Renvoie-moi <b>2 sorts</b>. Attends, attends… et clique juste avant qu’il te touche. N’aie pas peur pour moi, je suis solide !', goal: 'Renvoie 2 sorts à la professeure.',
      cast: { id: 'ignis', trace: 1.1, flight: 3 }, parry: 'return', count: 2, well: 'Ouille ! … Parfait, c’est exactement ça. Un sort renvoyé, c’est une attaque gratuite.' },
    { part: 3, say: 'Merci, {nom}, superbe travail ! Comme vous l’avez vu, c’est assez facile lorsqu’on sait comment faire.' },
    { part: 3, say: 'La vraie difficulté, c’est de bloquer des <b>rafales rapides</b> de magie. Si l’adversaire lance un sort lent, puis enchaîne entre-temps avec des attaques rapides… ce sera une tout autre histoire !' },
    { part: 4, say: 'La déviation, ce sera pour le deuxième cours. Ce que nous allons faire maintenant, c’est vous exercer sur… mon <b>invention personnelle</b> !' },
    { part: 4, machine: { n: 1, every: 9, flight: 2.4 }, say: 'Voici le <b>Scintillateur</b> ! Un mannequin qui tire des boules d’énergie Scintilla. Rassurez-vous, elles ne font pas mal. Enfin… presque pas.' },
    { part: 4, say: 'D’abord, un tir régulier. <b>Bloque 5 étincelles</b> : écoute le rythme, et regarde la gueule du canon briller juste avant le tir.', goal: 'Bloque 5 étincelles du Scintillateur.',
      machine: { n: 1, every: 2.3, flight: 2.4 }, parry: 'any', count: 5, well: 'Très bien ! Quand le rythme est régulier, on finit par bloquer sans même y penser.' },
    { part: 4, say: 'Attention : maintenant, il tire <b>quand ça lui chante</b> ! Ne devine pas : regarde l’anneau. <b>Bloque 6 étincelles</b>.', goal: 'Bloque 6 étincelles tirées à intervalles irréguliers.',
      machine: { n: 1, every: 1.9, flight: 2.2, irregular: true }, parry: 'any', count: 6, well: 'Bravo ! Un vrai adversaire ne tire jamais en rythme : te voilà en avance sur lui.' },
    { part: 4, say: 'Et pour finir… <b>deux Scintillateurs</b> ! Garde ton calme, une étincelle à la fois. <b>Bloque 8 étincelles</b> devant toute la classe !', goal: 'Bloque 8 étincelles tirées par deux Scintillateurs.',
      machine: { n: 2, every: 2.2, flight: 2.4 }, parry: 'any', count: 8 }
  ];
  var PROT = [
    { id: 'intro-prot', name: 'Vous n’êtes pas prêts', what: 'la première leçon : sans protection, on n’est jamais prêt', skill: true, color: '#bfe6ff', parts: ['On fait les malins ?', 'La démonstration', 'La vraie magie'], steps: ISTEPS },
    { id: 'parade', name: 'Bloquer et renvoyer', what: 'la parade et le renvoi', skill: true, color: '#ffd978', parts: ['Bienvenue', 'La théorie', 'Bloquer', 'Renvoyer', 'Mon invention personnelle'], steps: PSTEPS1 }
  ];
  // ───────────────────────── Cours d'analyse des tirs magiques ─────────────────────────
  // Pas un cours sur un sort : on apprend à lire le tir qui arrive et à choisir la bonne défense, surtout contre les sorts que le bouclier n'arrête pas.
  // Étapes propres à ce cours : cast peut avoir ids (plusieurs sorts, au hasard) · parry peut être une fonction (e, S) → true (réussi) ou un message (raté).
  // Chaque leçon a ses drills : les sorts contre lesquels on peut ensuite s'exercer à volonté (le professeur les lance en boucle).
  var FLAM = { ids: ['flammurus'], trace: 1.5, flight: 1.8 };
  var vsFlam = function (e, S) { // contre le mur de feu : un dôme (Aegis), une conversion (Absorbo) ou un miroir (Speculum) ; le bouclier ne sert à rien
    if (e.outcome === 'ward' || e.outcome === 'absorb' || e.outcome === 'mirror') return true;
    return e.outcome === 'parry' ? 'Ton bouclier ne l’arrête pas ! Trace un <b>toit</b> (Aegis) dès que tu vois les trois flammes.' : 'Touché ! Le mur de feu passe à travers le bouclier : il faut <b>Aegis</b>, tracé avant qu’il arrive.';
  };
  var vsMix = function (e, S) { // des boules d'énergie et des murs de feu mélangés : à chacun sa défense
    var wall = e.spell.unparry;
    if (!wall && e.outcome === 'parry') return true;
    if (wall && (e.outcome === 'ward' || e.outcome === 'absorb' || e.outcome === 'mirror')) return true;
    if (!wall && e.outcome === 'ward') return 'Une simple boule d’énergie : un <b>bouclier</b> suffisait ! Garde Aegis pour le mur de feu.';
    return wall ? 'Touché par le mur de feu ! Les trois flammes, c’est le signal : <b>Aegis</b>, tout de suite.' : 'Touché ! Une boule d’énergie se <b>bloque</b> : baguette dans l’anneau, clic quand il est doré.';
  };
  var ASTEPS1 = [
    { part: 0, say: 'Bonjour. Je suis le professeur Oculus. Asseyez-vous, et ouvrez grand les yeux : dans ce cours, on regarde <b>avant</b> d’agir.' },
    { part: 0, say: 'On vous a appris à bloquer, à renvoyer, bientôt à dévier. Très bien. Mais contre un <b>mur de feu</b>… votre bouclier ne sert à <b>rien</b>. Le feu passe au travers comme si de rien n’était.' },
    { part: 0, say: 'Ce cours est là pour ça : apprendre à <b>analyser</b> le tir qui arrive, et à choisir la <b>bonne</b> défense. Il aura plusieurs suites, une par famille de sorts dangereux.' },
    { part: 1, say: 'Première règle : <b>regardez la baguette</b> de l’adversaire. Avant chaque sort, elle trace un signe dans l’air. Ce signe, c’est le nom du sort. Lisez-le !' },
    { part: 1, say: 'Un trait, un Z, un triangle, un carré : des <b>boules d’énergie</b>. Scintilla, Fulgur, Ignis, Terra… Contre elles, le bouclier fait tout : bloquer, renvoyer.' },
    { part: 1, say: '<b>Trois petites flammes</b>, et une lueur orange… c’est <b>Flammurus</b>, le mur de feu. Il balaie toute la salle. Le bouclier ne l’arrête pas, et il brûle encore après.' },
    { part: 1, say: 'Contre lui, une seule famille de défense : les <b>sorts de protection</b>. <b>Aegis</b>, le dôme (un toit) : il absorbe le prochain sort qui te touche, quel qu’il soit. Trace-le <b>pendant</b> que l’adversaire trace ses flammes.' },
    { part: 1, say: 'Deux autres réponses existent, pour plus tard : <b>Absorbo</b> (un &gt;) avale l’attaque et la change en énergie, et <b>Speculum</b> (une arche) la renvoie. Mais d’abord, le dôme.' },
    { part: 2, say: 'Mais d’abord, le signe lui-même. Aegis, c’est un <b>toit</b> : on monte en biais vers la droite, et on redescend en biais. Un seul geste, deux traits. Suivez la lumière.', show: 'roof' },
    { part: 2, say: '{nom}, viens devant. Trace-moi un toit, <b>deux fois</b>. Pars du point vert, et tu verras le dôme doré se refermer autour de toi.', goal: 'Trace Aegis (un toit) 2 fois.', count: 2, guide: { glyph: 'roof', alpha: 0.55, comet: true },
      check: function (e) { return (e.ok && e.spell.id === 'aegis') || (e.ok ? 'Ça, c’est ' + e.spell.name + ' ! Un toit : on monte, on redescend.' : null); }, well: 'Voilà le dôme. Regarde-le bien : tant qu’il est là, le prochain sort qui te touche est avalé.' },
    { part: 2, say: 'Maintenant, pour de vrai. Je vais te lancer un mur de feu, lentement. Ne cherche pas l’anneau : dès que tu vois mes <b>trois flammes</b>, trace un <b>toit</b>. Trois fois.', goal: 'Arrête 3 murs de feu avec Aegis (un toit).',
      cast: FLAM, parry: vsFlam, count: 3, well: 'Voilà ! Le dôme avale le feu. Tu n’avais pas besoin de viser, juste d’avoir <b>lu</b> le signe à temps.' },
    { part: 3, say: 'Maintenant, le vrai exercice d’analyse. Je vais mélanger : des boules d’énergie, et des murs de feu, <b>sans prévenir</b>. À toi de lire ma baguette.' },
    { part: 3, say: 'Boule d’énergie : <b>bouclier</b>, dans l’anneau doré. Trois flammes : <b>Aegis</b>, tout de suite. Réussis <b>6 défenses</b> de suite, chacune la bonne.', goal: 'Choisis la bonne défense 6 fois : bouclier contre les boules, Aegis contre le mur de feu.',
      cast: { ids: ['ignis', 'flammurus', 'scintilla', 'flammurus', 'ignis', 'flammurus', 'terra'], trace: 1.3, flight: 1.9 }, parry: vsMix, count: 6, well: 'Excellent. Tu as lu chaque signe et répondu juste. C’est ça, l’analyse : les yeux d’abord, la baguette ensuite.' },
    { part: 4, say: 'Une dernière chose. Aegis coûte de l’énergie, et il n’absorbe qu’<b>un</b> sort. Un adversaire malin lancera une étincelle pour « user » ton dôme, puis le mur de feu. Alors ne le lance pas trop tôt : <b>lis</b>, puis agis.' },
    { part: 4, say: 'Et <b>Absorbo</b>, le &gt;, fait mieux encore : le feu devient de l’énergie pour toi. Son signe : on descend en biais vers la droite, puis on revient en biais vers la gauche. Suivez la lumière.', show: 'gt' },
    { part: 4, say: 'Trace-moi un &gt;, une fois, pour l’avoir dans la main.', goal: 'Trace Absorbo (un >).', count: 1, guide: { glyph: 'gt', alpha: 0.55, comet: true },
      check: function (e) { return (e.ok && e.spell.id === 'absorbo') || (e.ok ? 'Ça, c’est ' + e.spell.name + ' ! Un > : en biais vers la droite, puis on revient.' : null); }, well: 'C’est ça. Un dôme bleu, cette fois.' },
    { part: 4, say: 'Maintenant, arrête <b>2 murs de feu</b> avec Absorbo.', goal: 'Arrête 2 murs de feu avec Absorbo (un >).',
      cast: FLAM, parry: function (e) { return e.outcome === 'absorb' ? true : e.outcome === 'ward' ? 'Avec Aegis, ça marche aussi… mais ici, on veut <b>Absorbo</b> : un &gt;.' : vsFlam(e); }, count: 2 }
  ];
  var ANALYSE = [
    { id: 'analyse-feu', name: 'Lire un tir, et le mur de feu', what: 'l’analyse d’un tir et la défense contre le mur de feu', skill: true, color: '#ff8a2a', parts: ['Ouvrez les yeux', 'Lire la baguette', 'Le dôme', 'Analyse', 'Absorbo'], steps: ASTEPS1,
      drills: [{ id: 'flammurus', name: 'le mur de feu (Flammurus)', ok: vsFlam, tip: 'Dès que tu vois les trois flammes : Aegis (un toit), Absorbo (un >) ou Speculum (une arche).' },
              { id: 'mix', name: 'boules et murs de feu mélangés', ids: ['ignis', 'flammurus', 'scintilla', 'terra', 'flammurus'], ok: vsMix, tip: 'Lis le signe : boule d’énergie → bouclier · trois flammes → Aegis.' }] }
  ];
  // practice : ce que propose le bouton qui mène à js/school.js · workshop : l'atelier du Scintillateur · drills : s'exercer contre un sort précis · sister : l'autre cours de la même salle
  var COURSES = {
    attaque: { title: 'Cours d’attaque', prof: 'Professeur Brasier', lessons: ATTACK, room: room, practice: 'Continuer à pratiquer sur le mannequin' },
    protection: { title: 'Cours de protection', prof: 'Professeure Égide', lessons: PROT, room: roomProt, workshop: true, practice: 'Les sorts de protection : leçons et défis', sister: { id: 'analyse', label: '🔍 Cours d’analyse des tirs magiques (professeur Oculus)' } },
    analyse: { title: 'Analyse des tirs magiques', full: 'cours d’analyse des tirs magiques', prof: 'Professeur Oculus', lessons: ANALYSE, room: roomAna, drills: true, practice: 'Les sorts de protection : leçons et défis', sister: { id: 'protection', label: '🛡️ Cours de protection (professeure Égide)' } }
  };
  var course = COURSES.attaque, LESSONS = ATTACK;
  // Le schéma animé de la parade : l'anneau se referme, devient doré, et c'est là qu'on clique (au tout dernier instant pour renvoyer).
  function figure(kind) {
    var back = kind === 'return', T = ' dur="3s" repeatCount="indefinite"/>', k = back ? 0.86 : 0.74;
    return '<svg viewBox="0 0 300 170" width="300" height="170" aria-hidden="true">' +
      '<circle cx="85" cy="92" r="26" fill="none" stroke="#ffe9a0" stroke-width="2" stroke-dasharray="6 6" opacity=".7"/>' +
      '<circle cx="85" cy="92" r="70" fill="none" stroke="#ff8a3a" stroke-width="4"><animate attributeName="r" values="72;26;26" keyTimes="0;0.9;1"' + T + '<animate attributeName="stroke" values="#ff8a3a;#ff8a3a;#ffe9a0;#ffe9a0" keyTimes="0;0.7;0.71;1"' + T + '</circle>' +
      '<circle cx="85" cy="92" r="4" fill="#ff8a3a"><animate attributeName="r" values="3;17;17" keyTimes="0;0.9;1"' + T + '</circle>' +
      '<line x1="150" y1="168" x2="93" y2="100" stroke="#b88d58" stroke-width="5" stroke-linecap="round"/><circle cx="93" cy="100" r="4" fill="#fff"/>' +
      '<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;' + k + ';' + (k + 0.02) + ';0.97;1"' + T +
      '<circle cx="85" cy="92" r="34" fill="rgba(191,230,255,.4)" stroke="#bfe6ff" stroke-width="3"/><text x="85" y="34" text-anchor="middle" class="clic">CLIC !</text></g>' +
      '<text x="172" y="62" class="cap">① Baguette</text><text x="172" y="84" class="cap">dans l’anneau</text>' +
      '<text x="172" y="118" class="cap">② ' + (back ? 'Clic au tout' : 'Clic quand il') + '</text><text x="172" y="140" class="cap">' + (back ? 'dernier instant' : 'devient doré') + '</text></svg>';
  }
  // Les Scintillateurs : la cible (js/duel.js les dessine), leur mise en route, et le tir — appelé dix fois par seconde.
  function machine(n) { return { kind: 'canon', guns: n, heat: [0, 0] }; }
  function armGuns(n, every) { var g = [], k; for (k = 0; k < n; k++) g.push({ next: now() + 1.8 + k * every * 0.75 }); return g; }
  function fireGuns(guns, cfg) {
    var t = now(), tg = DS.duel.state.target;
    guns.forEach(function (g, k) {
      if (tg && tg.heat) tg.heat[k] = Math.max(0, Math.min(1, 1 - (g.next - t) / 0.6)); // la gueule du canon brille juste avant le tir
      if (t < g.next) return;
      api().shoot('scintilla', cfg.flight, k);
      g.next = t + cfg.every * (guns.length > 1 ? 1.5 : 1) * (cfg.irregular ? 0.4 + Math.random() * 1.3 : 1); // à deux, chacun tire un peu moins souvent
    });
  }

  // ───────────────────────── Déroulement ─────────────────────────
  var host = null, open_ = false, i = 0, S = null, run = 0, typing = 0, full = '', inCorner = false;
  var L = LESSONS[0], STEPS = L.steps, PARTS = L.parts, COLOR = L.color; // la leçon en cours
  var num = function (l) { var n = 0; for (var k = 0; k < LESSONS.length; k++) { if (LESSONS[k] === l) return l.exam ? n : n + 1; if (!LESSONS[k].exam) n++; } return n; }; // les examens ne comptent pas : « Leçon 6 » reste la sixième leçon
  var tag = function (l) { return l.exam ? 'Examen ' + l.exam : 'Leçon ' + num(l); }, learned = function (l) { return !!host.save.lessons[l.id]; };
  var api = function () { return DS.duel.school; };
  var now = function () { return DS.duel.state ? DS.duel.state.time : 0; };
  function later(ms, fn) { var r = run; setTimeout(function () { if (r === run && open_ && DS.duel.state) fn(); }, ms); }

  // Place la bulle près du professeur (ou en haut à droite, devant le mannequin) et le panneau du bas là où l'image en avait un.
  function layout() {
    if (!open_) return;
    var W = window.innerWidth, H = window.innerHeight, b = $('bulle'), p = $('classe-panel');
    fit(W, H);
    b.classList.toggle('voice', inCorner);
    if (inCorner) { b.style.right = '24px'; b.style.bottom = ''; b.style.top = '84px'; b.style.maxWidth = '380px'; }
    else { var ax = Math.max(330, X(692)), ay = Math.max(250, Y(304)); b.style.top = ''; b.style.right = W - ax + 'px'; b.style.bottom = H - ay + 'px'; b.style.maxWidth = Math.min(440, ax - 16) + 'px'; }
    var x0 = X(PANEL[0]), x1 = X(PANEL[2]), w = Math.max(460, x1 - x0);
    p.style.width = w + 'px'; p.style.left = (x0 + x1) / 2 - w / 2 + 'px';
  }
  function fitBubble() { // une bulle trop haute (avec le schéma) ne doit pas sortir de l'écran par le haut
    var b = $('bulle'); if (inCorner) return;
    if (b.getBoundingClientRect().top < 64) { b.style.bottom = ''; b.style.top = '64px'; }
  }
  function level() { var s = host.save; $('classe-lvl').textContent = '⭐ Niveau ' + s.plv + ' · ' + s.xp + ' / ' + DS.xpNeed(s.plv) + ' XP'; }
  // Bulle du professeur : le texte s'écrit lettre à lettre pendant qu'il parle. buttons : [{ label, primary, off, fn }].
  function say(html, buttons, wait) {
    var el = $('bulle-text'), n = 0, plain = html.replace(/<[^>]+>/g, '');
    clearInterval(typing); full = html; talking = true;
    $('bulle').classList.remove('hidden'); $('bulle').classList.remove('pop'); void $('bulle').offsetWidth; $('bulle').classList.add('pop');
    $('bulle-more').classList.add('hidden'); $('bulle-btns').innerHTML = '';
    var linked = A.spellRefs(html); // les noms de sorts avec leur signe (survol : la forme en grand)
    el.innerHTML = '<span class="unsaid">' + linked + '</span>'; // le texte entier, invisible, réserve la place : la bulle ne grandit pas en cours de route
    layout(); fitBubble();
    var shown = function (k) { // les k premiers caractères visibles, balises comprises
      var out = '', seen = 0, tag = false;
      for (var j = 0; j < html.length && seen < k; j++) { var ch = html[j]; if (ch === '<') tag = true; out += ch; if (!tag) seen++; if (ch === '>') tag = false; }
      return out;
    };
    var finish = function () {
      clearInterval(typing); typing = 0; talking = false; el.innerHTML = linked;
      $('bulle-btns').innerHTML = (buttons || []).map(function (b, k) { return '<button class="btn' + (b.primary ? ' primary' : ' ghost') + '" data-k="' + k + '"' + (b.off ? ' disabled' : '') + '>' + b.label + '</button>'; }).join('');
      $('bulle-btns').classList.toggle('many', !!buttons && buttons.length > 5); // beaucoup de choix : en colonnes
      $('bulle-btns').querySelectorAll('button').forEach(function (bt) { bt.addEventListener('click', function (ev) { ev.stopPropagation(); buttons[+bt.dataset.k].fn(); }); });
      $('bulle-more').classList.toggle('hidden', !!wait || !!(buttons && buttons.length));
      fitBubble(); // les boutons ont fait grandir la bulle : elle ne doit pas sortir par le haut
      A.spellTips(el);
    };
    say.finish = finish;
    typing = setInterval(function () {
      n += 2; if (n % 6 === 0) SFX.blip();
      if (n >= plain.length) return finish();
      el.innerHTML = shown(n) + '<span class="unsaid">' + plain.slice(n) + '</span>';
    }, 26);
  }
  function panel() {
    var s = STEPS[i], pct = Math.round(i / STEPS.length * 100);
    $('cp-title').textContent = tag(L) + ' : ' + L.name;
    $('cp-part').textContent = 'Partie ' + (s.part + 1) + ' sur ' + PARTS.length + ' — ' + PARTS[s.part];
    $('cp-bar').style.width = pct + '%'; $('cp-pct').textContent = pct + ' %';
    $('cp-goal').innerHTML = '<b>Objectif :</b> ' + (s.goal || 'Écoute le professeur.');
  }
  function dots() {
    var s = STEPS[i]; if (!s.count || s.count < 2) return $('classe-count').classList.add('hidden');
    var h = ''; for (var k = 0; k < s.count; k++) h += '<i' + (k < S.n ? ' class="on"' : '') + '></i>';
    $('classe-count').innerHTML = '<div class="dots">' + h + '</div>'; $('classe-count').classList.remove('hidden');
  }
  function guides() { // le prochain trait à faire est en vert vif, ceux qui sont faits s'éteignent
    var s = STEPS[i]; if (!S.strokes) return api().strokes(null);
    S.strokes.forEach(function (g, k) { var at = s.order ? s.order[S.n] : S.n; g.state = s.order ? (k === at ? 'next' : 'todo') : k < S.n ? 'done' : k === S.n ? 'next' : 'todo'; });
    api().strokes(S.strokes, COLOR);
  }
  function playDemo() { // le professeur montre : une lumière trace les traits, en boucle
    var s = STEPS[i], d = s.demo(), mine = run;
    api().strokes(d.strokes.map(function (g) { g.state = 'todo'; return g; }), COLOR, {
      t0: now() + 0.7, per: d.per, gap: d.gap, order: d.order,
      onBeat: function (k) { if (d.drum) SFX.drum(k % 4 === 0); else SFX.cast('scintilla', 0.5); },
      onEnd: function () { setTimeout(function () { if (mine === run && open_ && DS.duel.state) playDemo(); }, 1300); }
    });
  }
  function toCorner(v) {
    if (inCorner === v) return;
    inCorner = v; $('classe-fade').classList.add('on');
    setTimeout(function () { if (!open_) return; api().scene(v ? corner : course.room); api().target(v ? (S && S.tgt) || null : { kind: 'baked' }); layout(); $('classe-fade').classList.remove('on'); }, 330);
  }
  function go(k) {
    run++; i = k; var s = STEPS[i], gd = s.guide;
    S = { n: 0, sent: 0, miss: 0, times: [], first: 0, t0: 0, strokes: s.strokes ? s.strokes() : null, done: false, tgt: s.corner && s.target ? s.target() : null, casts: {}, start: 0 };
    if (s.machine) { S.tgt = machine(s.machine.n); S.guns = armGuns(s.machine.n, s.machine.every); } // cours de protection : les Scintillateurs prennent la place du mannequin
    aimProf = !!s.riposte; if (s.riposte) S.tgt = { kind: 'baked', riposte: s.riposte }; // leçon d'introduction : on vise la professeure, et son bouclier de maître nous renvoie tout
    if (s.cast) S.next = now() + 2.2;
    api().reset(); api().target(S.tgt || { kind: 'baked' }); toCorner(!!s.corner);
    $('bulle-fig').classList.toggle('hidden', !s.figure); $('bulle-fig').innerHTML = s.figure ? figure(s.figure) : ''; // le schéma, dans la bulle
    if (s.wall) api().wall(s.wall);
    if (s.enter) s.enter(S);
    api().dim(!!(s.strokes || s.demo || s.show || gd));
    DS.music.duck(s.drum || (s.demo && s.demo().drum) ? 0 : 1); // on compte au tambour : la musique se tait
    panel(); dots();
    var exercise = !!(s.check || s.parry || byHit(s) || s.ask); // un exercice (tracé, parade ou cible à toucher) ou un choix : pas de « suite » tant qu'il n'est pas réussi
    var btns = s.ask ? s.ask.map(function (o) { return { label: o.label, primary: !!o.primary, fn: function () { SFX.select(); go(i + 1 + (o.skip || 0)); } }; }) : exercise ? [] : null; // ask : des boutons, et chacun mène plus loin (skip : combien d'étapes on saute)
    say(s.say.replace('{nom}', host.name), btns, exercise);
    if (s.demo) playDemo(); else guides();
    // le professeur montre la forme entière, ou l'élève a un modèle à suivre : un peu plus petit et plus bas qu'ailleurs, pour ne pas passer sous la bulle
    if (s.show) api().guide(s.show, COLOR, 0.6, true, { size: 0.3, cy: 0.58 });
    if (gd) api().guide(gd.glyph, COLOR, gd.alpha, gd.comet, { size: gd.size || 0.3, cy: 0.58, flip: gd.flip });
  }
  // Commence la leçon k (0 = la première).
  function startLesson(k) {
    L = LESSONS[k]; STEPS = L.steps; PARTS = L.parts; COLOR = L.color;
    wsOn = false; drOn = false; $('classe-title').textContent = course.title + ' — ' + tag(L);
    api().only(L.only); go(0);
  }
  function next() {
    if (!open_ || S === null) return;
    if (typing) return say.finish();
    if (i >= STEPS.length) return;                   // leçon terminée : il n'y a plus que les boutons                 // un clic pendant qu'il parle : la phrase s'affiche d'un coup
    if ((STEPS[i].check || STEPS[i].parry || byHit(STEPS[i]) || STEPS[i].ask) && !S.done) return; // un exercice : il faut le réussir (ou le passer)
    if (i + 1 < STEPS.length) go(i + 1); else if (!S.done) { S.done = true; end(); } // une leçon qui finit sur une phrase (pas un exercice) : c'est fini
  }
  function success() {
    var s = STEPS[i];
    S.done = true; run++; api().strokes(null); api().dim(false); SFX.select();
    if (i === STEPS.length - 1) return later(600, end);
    say(typeof s.well === 'function' ? s.well(S) : s.well, [{ label: 'Suivant ▸', primary: true, fn: function () { go(i + 1); } }]);
  }
  function donePanel(label) { // panneau du bas d'une leçon finie
    $('cp-title').textContent = tag(L) + ' : ' + L.name; $('cp-part').textContent = label; $('cp-bar').style.width = '100%'; $('cp-pct').textContent = '100 %';
    $('cp-goal').innerHTML = '<b>Objectif atteint :</b> tu maîtrises ' + (L.what || L.name) + '.'; $('classe-count').classList.add('hidden');
  }
  function end() {
    var first = !learned(L), ups = 0;
    DS.music.duck(1); DS.music.sting('bravo', { keep: true }); SFX.applause(); later(500, SFX.win);
    if (first) { host.save.lessons[L.id] = true; ups = host.addXp(LESSON_XP); host.persist(); level(); }
    i = STEPS.length; donePanel('Leçon terminée');
    var owned = L.skill || host.save.owned.indexOf(L.id) >= 0, last = LESSONS.indexOf(L) === LESSONS.length - 1 && !course.workshop; // skill : un savoir-faire, pas un sort à acheter
    api().reset(); api().target({ kind: 'baked' }); $('bulle-fig').classList.add('hidden');
    say((last ? 'Bravo, ' + host.name + ' ! Tu as terminé <b>tout le ' + (course.full || course.title.toLowerCase()) + '</b>. Je n’ai plus rien à t’apprendre… pour l’instant. Applaudissez !' : L.exam ? 'Examen <b>réussi</b>, ' + host.name + ' ! Applaudissez. Tu maîtrises <b>' + (L.what || L.name) + '</b>.' : 'Bravo, ' + host.name + ' ! Applaudissez votre camarade. Tu maîtrises <b>' + (L.what || L.name) + '</b>.') +
      (first ? ' <b class="xp">+' + LESSON_XP + ' XP</b>' : '') + (owned ? '' : '<br>Pour t’en servir en duel, il te reste à l’apprendre au <b>magasin de magie</b>.') + (ups ? '<br>⭐ Niveau ' + host.save.plv + ' ! Un point de talent et un point de sort t’attendent.' : ''), choices());
  }
  // Ce qu'on peut faire entre deux leçons : la leçon suivante (les leçons se suivent dans l'ordre), pratiquer devant le mannequin, revoir une leçon réussie.
  function choices() {
    var todo = LESSONS.filter(function (l) { return !learned(l); })[0], out = [];
    if (todo) out.push({ label: tag(todo) + ' : ' + todo.name + ' ▸', primary: true, fn: function () { startLesson(LESSONS.indexOf(todo)); } });
    if (course.workshop && learned(LESSONS[0])) out.push({ label: '🎯 Atelier : régler le Scintillateur et s’exercer', primary: !todo, fn: function () { workshop(); } });
    if (course.drills && drills().length) out.push({ label: '🎯 S’exercer contre un sort…', primary: !todo, fn: pickDrill });
    if (course.sister) out.push({ label: course.sister.label, fn: function () { var h = host; close(); open(h, course.sister.id); } });
    out.push({ label: course.practice, primary: !todo && !course.workshop && !course.drills, fn: function () { host.practice(); } });
    var seen = LESSONS.filter(learned);
    if (seen.length === 1) out.push({ label: 'Revoir la leçon ' + num(seen[0]) + ' (' + seen[0].name + ')', fn: function () { startLesson(LESSONS.indexOf(seen[0])); } });
    if (seen.length > 1) out.push({ label: 'Revoir une leçon…', fn: review });
    out.push({ label: 'Retour à la carte', fn: function () { host.leave(); } });
    return out;
  }
  function review() { // la liste des leçons déjà réussies
    var out = LESSONS.filter(learned).map(function (l) { return { label: (l.exam ? 'Examen ' + l.exam : num(l)) + ' · ' + l.name, fn: function () { startLesson(LESSONS.indexOf(l)); } }; });
    out.push({ label: '← Retour', fn: function () { say('Que veux-tu faire ?', choices()); } });
    say('Quelle leçon veux-tu revoir ?', out);
  }

  // ───────────────────────── L'atelier du Scintillateur ─────────────────────────
  // Entraînement libre : on règle le rythme (régulier ou non), la cadence et le nombre de machines, et on compte les étincelles bloquées, renvoyées, reçues.
  var RATES = [{ name: 'lente', every: 2.4, flight: 2.6 }, { name: 'moyenne', every: 1.5, flight: 2 }, { name: 'rapide', every: 0.9, flight: 1.5 }];
  var WS = { n: 1, rate: 0, irr: false, ok: 0, back: 0, hit: 0, streak: 0, best: 0, guns: [] }, wsOn = false;
  function wsCfg() { var r = RATES[WS.rate]; return { every: r.every, flight: r.flight, irregular: WS.irr }; }
  function wsHud() {
    $('classe-count').innerHTML = '<div class="meta ws">🛡 Bloquées <b>' + WS.ok + '</b> · ↩ Renvoyées <b>' + WS.back + '</b> · 💥 Reçues <b>' + WS.hit + '</b> · Série <b>' + WS.streak + '</b> (record ' + WS.best + ')</div>';
    $('classe-count').classList.remove('hidden');
  }
  function workshop(msg) {
    run++; wsOn = true; i = STEPS.length; S = { done: true };
    api().reset(); api().target(machine(WS.n)); WS.guns = armGuns(WS.n, wsCfg().every);
    $('bulle-fig').classList.add('hidden'); $('classe-title').textContent = course.title + ' — Atelier';
    $('cp-title').textContent = 'L’atelier du Scintillateur'; $('cp-part').textContent = 'Entraînement libre'; $('cp-bar').style.width = '100%'; $('cp-pct').textContent = '';
    $('cp-goal').innerHTML = '<b>Bloque</b> les étincelles (clic dans l’anneau doré) ou <b>renvoie</b>-les (clic au tout dernier instant).';
    wsHud();
    var again = function (m) { return function () { SFX.select(); workshop(m); }; };
    say(msg || 'Voici mon Scintillateur, rien que pour toi ! Règle-le comme tu veux.', [
      { label: 'Rythme : ' + (WS.irr ? 'irrégulier' : 'régulier'), fn: function () { WS.irr = !WS.irr; again(WS.irr ? 'Il tirera quand ça lui chante !' : 'Un tir bien régulier.')(); } },
      { label: 'Cadence : ' + RATES[WS.rate].name, fn: function () { WS.rate = (WS.rate + 1) % RATES.length; again('Cadence ' + RATES[WS.rate].name + ' !')(); } },
      { label: 'Machines : ' + WS.n, fn: function () { WS.n = WS.n === 1 ? 2 : 1; again(WS.n === 2 ? 'Deux Scintillateurs. Courage !' : 'Un seul Scintillateur.')(); } },
      { label: 'Remettre les compteurs à zéro', fn: function () { WS.ok = WS.back = WS.hit = WS.streak = WS.best = 0; again('Compteurs à zéro !')(); } },
      { label: '← Quitter l’atelier', fn: function () { wsOn = false; run++; api().reset(); api().target({ kind: 'baked' }); $('classe-title').textContent = course.title; donePanel('Leçon déjà réussie'); say('Que veux-tu faire ?', choices()); } }
    ]);
    say.finish();
  }

  // ───────────────────────── S'exercer contre un sort précis ─────────────────────────
  // Après une leçon d'analyse : le professeur lance en boucle le sort (ou le mélange) choisi, et on compte les défenses réussies et les coups reçus.
  var DR = { d: null, speed: 1, ok: 0, hit: 0, streak: 0, best: 0, next: 0, k: 0 }, drOn = false, SPEEDS = [{ name: 'lente', trace: 1.6, flight: 2.0, gap: 2.2 }, { name: 'moyenne', trace: 1.2, flight: 1.5, gap: 1.4 }, { name: 'rapide', trace: 0.8, flight: 1.1, gap: 0.8 }];
  function drills() { var out = []; LESSONS.forEach(function (l) { if (learned(l) && l.drills) out = out.concat(l.drills); }); return out; }
  function pickDrill() {
    var out = drills().map(function (d) { return { label: 'Contre ' + d.name, fn: function () { drill(d); } }; });
    out.push({ label: '← Retour', fn: function () { say('Que veux-tu faire ?', choices()); } });
    say('Contre quel sort veux-tu t’exercer ? Je le lancerai encore et encore, à la vitesse que tu veux.', out);
  }
  function drHud() {
    $('classe-count').innerHTML = '<div class="meta ws">✅ Bonne défense <b>' + DR.ok + '</b> · 💥 Touché <b>' + DR.hit + '</b> · Série <b>' + DR.streak + '</b> (record ' + DR.best + ')</div>';
    $('classe-count').classList.remove('hidden');
  }
  function drill(d, msg) {
    run++; drOn = true; wsOn = false; i = STEPS.length; S = { done: true }; if (d !== DR.d) { DR.d = d; DR.ok = DR.hit = DR.streak = DR.best = 0; DR.k = 0; }
    api().reset(); api().target({ kind: 'baked' }); DR.next = now() + 2;
    $('bulle-fig').classList.add('hidden'); $('classe-title').textContent = course.title + ' — Exercice';
    $('cp-title').textContent = 'Exercice contre ' + d.name; $('cp-part').textContent = 'Cadence ' + SPEEDS[DR.speed].name; $('cp-bar').style.width = '100%'; $('cp-pct').textContent = '';
    $('cp-goal').innerHTML = '<b>Conseil :</b> ' + d.tip;
    drHud();
    var again = function (m) { return function () { SFX.select(); drill(d, m); }; };
    say(msg || 'En garde, ' + host.name + ' ! Je lance ' + d.name + ', encore et encore. Lis ma baguette, et réponds juste.', [
      { label: 'Cadence : ' + SPEEDS[DR.speed].name, fn: function () { DR.speed = (DR.speed + 1) % SPEEDS.length; again('Cadence ' + SPEEDS[DR.speed].name + ' !')(); } },
      { label: 'Changer de sort', fn: function () { drOn = false; run++; api().reset(); pickDrill(); } },
      { label: 'Remettre les compteurs à zéro', fn: function () { DR.ok = DR.hit = DR.streak = DR.best = 0; again('Compteurs à zéro !')(); } },
      { label: '← Arrêter l’exercice', fn: function () { drOn = false; run++; api().reset(); api().target({ kind: 'baked' }); $('classe-title').textContent = course.title; donePanel('Leçon déjà réussie'); say('Que veux-tu faire ?', choices()); } }
    ]);
    say.finish();
  }
  function drTick() {
    var sp = SPEEDS[DR.speed], d = DR.d;
    if (now() < DR.next) return;
    var ids = d.ids || [d.id], id = d.ids ? ids[Math.floor(Math.random() * ids.length)] : ids[0];
    api().foeCast(id, sp.trace, sp.flight); DR.next = now() + sp.trace + sp.flight + 4;
  }

  // ───────────────────────── Ce que le duel nous signale ─────────────────────────
  // Un tracé vient d'être terminé : true = le sort part, un message = il rate avec ce message, null = raté (message par défaut).
  function onTrace(e) {
    var s = STEPS[i]; if (!s || S.done || (!s.check && !byHit(s))) return e.ok ? true : null; // entre deux exercices, on s'amuse librement
    if (!s.check) { // exercice devant la cible : tous les sorts partent… sauf si la leçon juge le geste au moment du tracé (onCast → un message : le sort ne part pas)
      if (e.ok && s.onCast) { var rc = s.onCast(e, S); if (typeof rc === 'string') { api().say(rc, '#ffb0a0'); return null; } if (rc === false) return null; }
      if (e.ok) { if (!S.start) S.start = now(); S.casts[e.spell.id] = (S.casts[e.spell.id] || 0) + 1; } return e.ok ? true : null;
    }
    var r = s.check(e, S), t = now();
    if (r !== true) { // pas encore ça : au bout de 3 essais, on propose de passer
      if (++S.miss === 3) { var keep = full; say(keep, [{ label: 'Passer cet exercice', fn: function () { S.done = true; if (i === STEPS.length - 1) end(); else go(i + 1); } }], true); say.finish(); }
      return typeof r === 'string' ? r : null;
    }
    if (s.riposte) { S.sent++; if (!S.start) S.start = t; return true; } // le sort part vers la professeure : c'est son retour (onPlayerHit) qui comptera
    if (s.within && S.n && t - S.t0 > s.within) { S.n = 0; S.times = []; api().say('Trop lent : on recommence !', '#ffb0a0'); } // rafale trop lente : la série repart
    if (!S.n) S.t0 = t;
    S.times.push(t);
    if (s.drum) SFX.drum(S.n % 4 === 0);
    if (!S.start) S.start = t;                       // pour dire en combien de temps l'exercice a été fait
    if (e.ok) S.casts[e.spell.id] = (S.casts[e.spell.id] || 0) + 1;
    if (byHit(s)) return true;                       // devant le mannequin : c'est ce qui arrive à la cible qui compte
    S.n++; dots(); guides();
    if (S.n >= s.count) success();
    return s.noCast ? null : true;
  }
  function byHit(s) { return !!(s.hits || s.hit || s.tick || s.wallHit); }
  function gain(r) { // r : ce qu'a répondu hit ou wallHit
    var s = STEPS[i];
    if (typeof r === 'string') return api().say(r, '#ffb0a0');
    if (r === true && !s.count) return success();
    if (r === true) r = 1;
    if (!(r > 0)) return;
    S.n += r; dots(); if (s.count > 1) api().say(Math.min(S.n, s.count) + ' !');
    if (S.n >= s.count) success();
  }
  function onFoeHit(e) {
    var s = STEPS[i]; if (!s || S === null || S.done) return;
    if (s.hits) return gain(e.dmg > 0 || e.spell ? 1 : 0);
    if (s.hit) gain(s.hit(e, S));
  }
  // Un sort va faire effet sur la cible : l'exercice peut le refuser (false).
  function onFoeTry(e) {
    var s = STEPS[i]; if (!s || S === null || S.done || !s.allow) return true;
    var r = s.allow(e, S);
    if (typeof r === 'string') api().say(r, '#ffb0a0');
    return r === true || r === undefined;
  }
  // Un sort (de la professeure ou d'une machine) vient d'arriver sur nous : e.outcome = 'parry' (e.perfect : renvoyé), 'hit'…
  function onPlayerHit(e) {
    if (!open_ || S === null) return;
    var blocked = e.outcome === 'parry';
    if (wsOn) { // atelier : on tient les comptes
      if (blocked) { if (e.perfect) WS.back++; else WS.ok++; WS.streak++; WS.best = Math.max(WS.best, WS.streak); } else { WS.hit++; WS.streak = 0; }
      return wsHud();
    }
    if (drOn) { // exercice contre un sort précis
      var good = DR.d.ok(e, DR) === true; DR.next = now() + SPEEDS[DR.speed].gap;
      if (good) { DR.ok++; DR.streak++; DR.best = Math.max(DR.best, DR.streak); api().say('Bonne défense !', '#8dffb0'); } else { DR.hit++; DR.streak = 0; var why = DR.d.ok(e, DR); api().say(typeof why === 'string' ? why.replace(/<[^>]+>/g, '') : 'Touché !', '#ffb0a0'); }
      return drHud();
    }
    var s = STEPS[i]; if (!s || S.done || !s.parry) return;
    if (s.cast) S.next = now() + 1.3; // le sort suivant de la professeure
    if (typeof s.parry === 'function') { // cours d'analyse : la leçon dit ce qui compte
      var r = s.parry(e, S);
      if (r === true) { S.n++; dots(); api().say(s.said ? s.said(e, S) : S.n + ' !', s.said ? '#ffb0a0' : null); if (S.n >= s.count) success(); return; }
      api().say((typeof r === 'string' ? r : 'Touché !').replace(/<[^>]+>/g, ''), '#ffb0a0');
      if (++S.miss === 5) { var k2 = full; say(k2, [{ label: 'Passer cet exercice', fn: function () { S.done = true; if (i === STEPS.length - 1) end(); else go(i + 1); } }], true); say.finish(); }
      return;
    }
    if (blocked && (s.parry !== 'return' || e.perfect)) { S.n++; dots(); api().say(S.n + ' !'); if (S.n >= s.count) success(); return; }
    api().say(blocked ? 'Bloqué… mais pas renvoyé. Clique encore plus tard !' : s.parry === 'return' ? 'Touché ! Attends le tout dernier instant, puis clique.' : 'Touché ! Baguette dans l’anneau, puis clique quand il est doré.', '#ffb0a0');
    if (++S.miss === 5) { var keep = full; say(keep, [{ label: 'Passer cet exercice', fn: function () { S.done = true; if (i === STEPS.length - 1) end(); else go(i + 1); } }], true); say.finish(); } // au bout de 5 ratés, on propose de passer
  }
  function onWall(e) { var s = STEPS[i]; if (s && S !== null && !S.done && s.wallHit) gain(s.wallHit(e, S)); }
  function tick() { // dix fois par seconde : les exercices qui se jouent dans le temps
    var s = STEPS[i], D = DS.duel.state;
    if (!open_ || !D || D.paused) return;
    if (wsOn) return fireGuns(WS.guns, wsCfg());
    if (drOn) return drTick();
    if (!s || S === null) return;
    if (s.machine && S.guns && (!S.done || !s.parry)) fireGuns(S.guns, s.machine); // une machine qu'on présente tire aussi, tout doucement
    if (S.done) return;
    if (s.cast && now() >= S.next) { // la professeure lance son sort (ou l'un de ses sorts, dans l'ordre de la liste puis au hasard)
      var ids = s.cast.ids, id = ids ? (S.sent < ids.length ? ids[S.sent] : ids[Math.floor(Math.random() * ids.length)]) : s.cast.id; S.sent++;
      api().foeCast(id, s.cast.trace, s.cast.flight); S.next = now() + s.cast.trace + s.cast.flight + 4; // (+4 s : au cas où le sort se perdrait)
    }
    if (s.tick && s.tick(S, D.target) === true) success();
  }
  setInterval(tick, 100);

  // ───────────────────────── Entrée et sortie ─────────────────────────
  // h : { save, name, addXp(n) → niveaux gagnés, persist(), leave(), practice() } · courseId : 'attaque' (par défaut) ou 'protection'
  function open(h, courseId) {
    host = h; open_ = true; inCorner = false; i = 0; S = null; run++; wsOn = false; drOn = false;
    course = COURSES[courseId] || COURSES.attaque; LESSONS = course.lessons;
    $('classe').classList.remove('hidden'); $('bulle-fig').classList.add('hidden');
    document.querySelector('#bulle .who').textContent = course.prof;
    api().scene(course.room); api().target({ kind: 'baked' });
    level(); layout();
    if (!learned(LESSONS[0])) return startLesson(0); // tout premier cours : on commence tout de suite
    var seen = LESSONS.filter(learned);              // sinon, le professeur demande ce qu'on veut faire
    L = seen[seen.length - 1]; STEPS = L.steps; PARTS = L.parts; COLOR = L.color;
    $('classe-title').textContent = course.title; donePanel('Leçon déjà réussie');
    i = STEPS.length; S = { done: true };
    say('Te revoilà, ' + host.name + ' ! Que veux-tu faire aujourd’hui ?', choices());
  }
  function close() { if (!open_) return; open_ = false; wsOn = false; drOn = false; aimProf = false; $('bulle-fig').classList.add('hidden'); DS.music.duck(1); run++; clearInterval(typing); typing = 0; talking = false; S = null; if (DS.duel.state) api().only(null); $('classe').classList.add('hidden'); $('bulle').classList.add('hidden'); $('classe-fade').classList.remove('on'); }
  window.addEventListener('resize', layout);
  window.addEventListener('keydown', function (e) { if (open_ && (e.code === 'Enter' || e.code === 'ArrowRight') && DS.duel.state && !DS.duel.state.paused) next(); });
  document.addEventListener('click', function (e) { if (open_ && e.target.closest && e.target.closest('#bulle') && !e.target.closest('button')) next(); });

  DS.classe = {
    room: room, corner: corner, open: open, close: close, onTrace: onTrace, onFoeHit: onFoeHit, onFoeTry: onFoeTry, onWall: onWall, onPlayerHit: onPlayerHit, active: function () { return open_; },
    add: function (lesson) { ATTACK.push(lesson); },      // une leçon d'attaque de plus, à la suite (js/lecons.js)
    kit: { st: st, is: is, seq: seq, secs: secs, nameOf: nameOf, api: api, now: now, later: later, rand: function (a, b) { return a + Math.random() * (b - a); },
      restart: function (msg) { if (S) { S.n = 0; S.pen = 0; dots(); } api().say(msg, '#ffb0a0'); }, // l'exercice repart de zéro (leçons à pénalités)
      ask: function (html, buttons) { say(html.replace('{nom}', host.name), buttons, true); say.finish(); }, // le professeur pose une question en plein exercice (buttons : [{ label, primary, fn }])
      skip: function () { if (S) S.done = true; if (i === STEPS.length - 1) end(); else go(i + 1); },         // on passe à la suite sans réussir
      again: function () { go(i); } },                                                                        // l'étape repart du début
    get lessons() { return ATTACK; }, get protection() { return PROT; }, get analyse() { return ANALYSE; }, get current() { return LESSONS; }, get step() { return i; }, get state() { return S; }, get workshop() { return wsOn ? WS : null; } // pour la carte et les tests
  };
})();
