// Le duel : tracé des sorts, projectiles et rayons, parade, maléfices et renforts, ceinture de sorts, adversaire et rendu de la scène.
(function () {
  'use strict';
  var DS = window.DS, A = DS.art, G = DS.gestures, SFX = DS.audio;
  var TAU = Math.PI * 2;
  var Z = 5;                 // profondeur de l'adversaire (1 = nous)
  var SHIELD_T = 0.34;       // durée du bouclier après un clic
  var SWIPE_V = 1.1;         // baguette de Josué : vitesse minimale du revers qui dévie un sort, en hauteurs d'écran par seconde
  var PERFECT_T = 0.14;      // clic à moins de 0,14 s de l'impact = sort renvoyé
  // temps que met l'adversaire à tracer chaque forme
  var TRACE_TIME = { tee: 0.8, bolt: 0.9, ex: 0.9, aye: 0.95, aitch: 1.0, flames3: 1.3, hat: 1.9, trefoil: 1.9, line: 0.55, vee: 0.8, ell: 0.8, roof: 0.8, gamma: 0.8, gt: 0.8, corner: 0.8, crescent: 0.9, hook: 0.9, cup: 0.95, arch: 0.95, rbracket: 0.95, zigzag: 1.0, enn: 1.0, ess: 1.0, root: 1.0, loop: 1.0,
    circle: 1.1, three: 1.1, pee: 1.1, stairs: 1.1, veecross: 1.15, wave: 1.15, emm: 1.15, square: 1.2, sigma: 1.2, pulse: 1.2, triangle: 1.25, arrow: 1.3, arrowdown: 1.3, fish: 1.3, balloon: 1.3,
    spiral: 1.4, infinity: 1.4, heart: 1.4, phi: 1.5, hourglass: 1.5, zigzag3: 1.5, saw: 1.5, crenel: 1.6, coil: 1.7, star: 1.8, crown: 1.9 };
  var BLOCK_K = { fulgur: 0.55, sagitta: 0.5, ignis: 1.2, terra: 0.8, tonnero: 0.85, desarmo: 0.8, lumina: 0.7 }; // facilité à bloquer chaque sort (1 par défaut ; les sorts d'effet : 0,9)
  var SLOW_FOE = 0.4;        // adversaire ralenti : il réfléchit et trace à 40 % de sa vitesse
  var SLOW_WAND = 0.45;      // joueur ralenti : la baguette avance au plus de 45 % de la hauteur d'écran par seconde
  var SLEEP_WAND = 0.75;     // joueur endormi : la baguette est lourde, elle aussi (moins que sous Lentus)
  var FAST_GAIN = 2.6;       // Vitus : la baguette fait 2,6 fois le chemin de la souris
  var GRAV_SPEED = 0.16, GRAV_MAX = 0.38; // Gravitas : la baguette descend de 16 % de l'écran par seconde, jusqu'à 38 % sous la souris
  var COPY_GAP = 0.17;       // Copius : écart entre deux copies de l'adversaire, en largeur d'écran
  var GHOST_GAP = 0.3;       // … et entre nos propres doubles
  var BIG_R = 1.6;           // Magnus : le cercle du bouclier grossit d'autant
  var MANA_BASE = 50;        // réserve d'énergie de départ (avant sorcier et talents) : la barre est pleine au début du duel
  var WARD_T = 3;            // au début du duel : le « 3… 2… 1… » où chacun ne peut lancer que des protections et des renforts, avant « GO ! »
  var WORDS = ['Yum…', 'Kaï…']; // les deux mots qui précèdent : « 5… 4… » dans une langue magique ancienne ; les duellistes les gardent pour marquer l'avant-duel des protections
  var MANA_REGEN = 4.5;      // énergie regagnée par seconde (avant baguette et talents)
  var RESIST = 3.5;          // après un maléfice, on résiste aux suivants pendant ce temps (sinon on s'enchaîne sans pouvoir rien faire)
  var MASTERY = { parfait: 3, bien: 2, passable: 1 }; // maîtrise gagnée par sort lancé en duel
  var QUALITY = { parfait: { mul: 1.2, text: 'Parfait !' }, bien: { mul: 1, text: '' }, passable: { mul: 0.8, text: 'Brouillon…' } };
  var FONT = "Luminari, 'Palatino Linotype', Palatino, Georgia, serif";
  var ONE = DS.spellMul(1);

  // Maléfices : ce qui empêche d'agir normalement (champ du sort → minuterie du sorcier). Un seul à la fois ; ensuite on résiste RESIST secondes.
  var HEXES = { freeze: 'frozen', disarm: 'disarmed', slow: 'slowed', soak: 'soaked', blind: 'blind', sleep: 'asleep', dazzle: 'dazzled', fast: 'fast', heavy: 'heavy', invert: 'inverted', silence: 'silenced', noShield: 'noShield', blur: 'blurred', sneeze: 'sneezing' };
  var HEX_KEYS = Object.keys(HEXES).map(function (k) { return HEXES[k]; });
  var HEX_TXT = { // [vu sur l'adversaire, vu sur nous]
    freeze: ['Gelé !', 'Te voilà dans un glaçon !'], disarm: ['Désarmé !', 'Ta baguette s’envole : rattrape-la !'], slow: ['Ralenti !', 'Ta baguette ralentit !'], soak: ['Trempé !', 'De l’eau plein la figure !'],
    blind: ['Aveuglé !', 'Tu n’y vois plus rien !'], sleep: ['Il s’endort…', 'Tu t’endors…'], dazzle: ['Ébloui !', 'Tu es ébloui !'], fast: ['Il s’emballe !', 'Ta baguette s’emballe !'],
    heavy: ['Sa baguette pèse une tonne !', 'Ta baguette pèse une tonne !'], invert: ['Tout à l’envers !', 'Tout est à l’envers !'], silence: ['Réduit au silence !', 'Silence : plus d’attaques !'], noShield: ['Boucliers brisés !', 'Tes boucliers sont brisés !'],
    blur: ['Sa vue se brouille !', 'Tout devient flou !'], sneeze: ['Son nez le chatouille…', 'Ton nez te chatouille…']
  };
  // Renforts lancés sur soi (champ du sort = minuterie du sorcier), et leur couleur.
  var BUFFS = { ward: '#ffd978', antiIce: '#ffb36b', grip: '#e0a8ff', antiPoison: '#b8f27a', absorb: '#7fb0ff', mirror: '#e8eef8', mist: '#cfd8e6', bastion: '#c9b79a', fortis: '#ff9a5a', regen: '#6fe0a0', bigR: '#9fd0ff', smoke: '#b8b8c8', invis: '#d8d8ff', swipe: '#ffd978' };
  var BUFF_KEYS = Object.keys(BUFFS);
  var TIMERS = HEX_KEYS.filter(function (k) { return k !== 'disarmed'; }).concat(BUFF_KEYS, ['burn', 'poison', 'resist', 'whirl', 'conjure', 'blizzard']); // minuteries communes au joueur et à l'adversaire
  // Ce qu'on affiche sous les barres de vie : [minuterie, icône, nom, 1 = bon pour celui qui l'a].
  var STATUS = [['burn', '🔥', 'Brûlure', 0], ['poison', '☠️', 'Poison', 0], ['frozen', '🧊', 'Gelé', 0], ['disarmed', '✋', 'Désarmé', 0], ['slowed', '🐌', 'Ralenti', 0], ['soaked', '💧', 'Trempé', 0], ['blind', '🌑', 'Aveuglé', 0],
    ['asleep', '💤', 'Endormi', 0], ['dazzled', '🌟', 'Ébloui', 0], ['fast', '🐇', 'Emballé', 0], ['heavy', '⚓', 'Alourdi', 0], ['inverted', '🔄', 'Inversé', 0], ['silenced', '🤫', 'Silence', 0], ['noShield', '🔨', 'Sans bouclier', 0], ['blurred', '👓', 'Vue brouillée', 0], ['sneezing', '🤧', 'Atchoum', 0], ['whirl', '🌊', 'Tourbillon', 0],
    ['ward', '🛡️', 'Aegis', 1], ['antiIce', '☀️', 'Anti-glace', 1], ['grip', '✊', 'Poigne de fer', 1], ['antiPoison', '🧪', 'Antidote', 1], ['absorb', '🌀', 'Absorbo', 1], ['mirror', '🪞', 'Miroir', 1], ['mist', '🌫️', 'Brume', 1],
    ['bastion', '🏰', 'Bastion', 1], ['fortis', '💪', 'Force ×2', 1], ['regen', '🌿', 'Vigor', 1], ['bigR', '⭕', 'Grand bouclier', 1], ['resist', '🍀', 'Résiste', 1],
    ['blizzard', '🌨️', 'Blizzard', 0], ['smoke', '💨', 'Fumée', 1], ['invis', '👻', 'Invisible', 1], ['swipe', '↪️', 'Déviation', 1]];

  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var $ = function (id) { return document.getElementById(id); };
  var pickOne = function (list) { return list[Math.floor(Math.random() * list.length)]; };

  var cv, ctx, W = 0, H = 0, dpr = 1, hall = null, geo = null;
  var D = null, cb = {}, last = 0, time = 0;
  var mouse = { x: 0, y: 0 }, wand = { x: 0, y: 0 };
  var idle = 0, tick = 0;    // idle : 0 = la salle est dessinée à chaque image · 1 = une image sur trois (derrière les menus) · 2 = pas du tout (carte)
  var spaceDown = false, mouseDown = false, touchStart = null, F = null, hudCache = {}, wbuf = null, wctx = null;
  var drag = null;           // sort qu'on glisse du tiroir vers la ceinture : { spell, ghost, moved, x0, y0 }

  // ───────────────────────── Mise en place ─────────────────────────
  function init(canvas) {
    cv = canvas; ctx = cv.getContext('2d');
    resize(); window.addEventListener('resize', resize);
    mouse.x = wand.x = W / 2; mouse.y = wand.y = H * 0.6;
    window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; if (drag) moveGhost(e); });
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', function () { spaceDown = false; mouseDown = false; cancelTrace(); setPeek(false); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && D && D.phase === 'fight') setPaused(true); });
    $('drawer').addEventListener('pointerdown', onDrawerDown);
    $('spellbar').addEventListener('click', onBeltClick);
    requestAnimationFrame(frame);
  }
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    hall = A.makeHall(W, H, dpr); geo = hall.geo;
  }
  // Un sorcier (nous ou l'adversaire) : vie, minuteries à zéro, rien en cours.
  function fighter(hp, extra) {
    var o = { hp: hp, maxHp: hp, burnDps: 0, poisonDps: 0, regenHps: 0, amp: 0, quake: null, echo: null, copies: null, hexMax: 1, wasHexed: false, disarmed: 0, sleepT: 0, focus: 0, prep: 0, whirlDps: 0, sneezeT: 0 }, k;
    TIMERS.forEach(function (key) { o[key] = 0; });
    for (k in extra) o[k] = extra[k];
    return o;
  }

  function start(cfg, callbacks) {
    cb = callbacks || {};
    // mods : bonus des talents du sorcier · slv : niveau de chaque sort · au-delà du niveau 9, l'adversaire gagne encore en vie et en puissance
    var ch = cfg.char, wd = cfg.wand, perk = ch.perk || {}, m = cfg.mods || {}, L = cfg.level || 1, kk = (L - 1) / 8;
    var others = DS.CHARACTERS.concat(DS.RIVALS).filter(function (c) { return c.id !== ch.id; });
    var foeCh = cfg.foe || pickOne(others);
    var mod = cfg.mod || {}, fam = cfg.fam || null; // mod : règles de l'étage (Tour des Épreuves, DS.TOWER_MODS) · fam : notre familier et son pouvoir (DS.FAMILIARS)
    var maxHp = Math.round((100 + (perk.hp || 0) + (m.hp || 0)) * (mod.pHp || 1)), maxMana = Math.round((MANA_BASE + (perk.mana || 0) + (m.mana || 0)) * (mod.pMana || 1)), foeHp = Math.round(lerp(120, 260, kk) * (mod.foeHp || 1) / 5) * 5;
    D = {
      phase: 'prep', time: 0, paused: false, level: L, ch: ch, wd: wd,
      // klass : cours de l'école { cat, school } — on reste à l'échauffement, rien ne compte, mais les effets se voient. C'est js/school.js qui mène la leçon :
      // guide = tracé modèle affiché à l'écran · target = caisse ou mannequin à la place du professeur · noParry = pas de bouclier au clic
      // only = formes reconnues pendant une leçon (les autres sont ignorées, pour qu'un tracé maladroit ne devienne pas un sort inconnu de l'élève)
      // scene = autre décor que la salle de duel { draw(ctx, W, H, t), anchor(W, H) → où se trouve la cible } · dim = décor assombri pendant un exercice
      klass: cfg.klass || null, only: null, guide: null, target: cfg.klass && cfg.klass.dummy ? { kind: 'mannequin' } : null, noParry: false, scene: cfg.scene || null, dim: false, dimK: 0,
      // all : tous les sorts qu'on connaît (le tiroir) · belt : ceux de la ceinture, les seuls qu'on peut lancer (null en cours : tout est permis)
      all: cfg.all && cfg.all.length ? cfg.all : DS.SPELLS.slice(), potions: cfg.potions || {}, belt: cfg.klass ? null : (cfg.spells && cfg.spells.length ? cfg.spells.slice() : DS.SPELLS.slice(0, DS.BELT_BASE)), pick: null,
      slv: cfg.slv || {}, costMul: m.costMul || 1, regen: 1 + (m.regen || 0), guardR: 1 + (m.guardR || 0),
      ai: { think: [Math.max(0.8, lerp(2.6, 1.1, kk)), Math.max(1.5, lerp(4, 2, kk))], castMul: Math.max(0.65, lerp(1.5, 0.85, kk)), block: Math.min(0.78, lerp(0.2, 0.65, kk)), speed: Math.min(1.4, lerp(0.75, 1.2, kk)), dmg: lerp(0.7, 1.15, kk),
        gap: clamp(lerp(0.9, 0.35, kk), 0.3, 0.9), rest: clamp(lerp(8, 6, kk), 5, 8), mana: clamp(Math.round(lerp(60, 150, kk)), 60, 240), // enchaînements : écart entre deux sorts, secondes pour refaire le plein, réserve d'énergie
        guardV: clamp(lerp(0.45, 1.5, kk), 0.45, 1.9), beamW: clamp(lerp(1.2, 2.6, kk), 1.2, 3), heals: 1 + Math.floor(L / 3) },
      p: fighter(maxHp, { mana: maxMana, maxMana: maxMana, shieldT: 0, shieldAge: 0, holdLeft: 0, holdMax: m.hold || 0, shieldCd: 0, shieldCdMax: 0.8 * (perk.shieldCd || 1), hurt: 0, speed: perk.spellSpeed || 1, fly: null, grav: 0, anchor: null }),
      f: fighter(foeHp, { ch: foeCh, wd: pickOne(DS.WANDS), state: 'idle', timer: 3, spell: null, glyph: null, castT: 0, castDur: 1, slowF: SLOW_FOE, soakMiss: 0, blindMiss: 0, sleepF: 0.5, zT: 0,
        disarmMax: 3, disarmDir: 1, caught: false, shield: 0, flash: 0, fall: 0, swayT: 0, offX: 0, guard: null, healed: 0, mana: 0, maxMana: 1, combo: [], tired: 0 }),
      beams: { p: null, f: null }, wall: null, // rayons en cours (Radius, Infernus) et mur de Murus
      held: [], foeHeld: [], allies: { p: null, f: null }, pending: [], nod: 0, kick: null, // sorts en réserve (Preparus), animaux (Conjura), éclairs en attente (Foudrus), éternuement en cours
      fx: { soak: 0, blind: 0, sleep: 0, blur: 0 }, used: {}, // fx : intensité (0..1) des effets qui brouillent notre vue · used : maîtrise gagnée par sort
      trail: null, ghosts: [], shots: [], parts: [], texts: [], fires: [], zaps: [], shake: 0, flash: 0, countdown: 0, goT: 0, endT: 0, result: null,
      practiced: {}, stats: { casts: 0, hits: 0, blocks: 0, perfects: 0 }
    };
    wand.x = mouse.x; wand.y = mouse.y; spaceDown = false; mouseDown = false;
    D.f.mana = D.f.maxMana = D.ai.mana; D.wardT = 0; D.goText = '';
    D.mod = mod; D.fam = fam; D.look = cfg.look || {}; D.famT = fam && fam.every ? 3 : 0; // look : couleurs du tracé (miroir magique)
    if (mod.regen) D.regen *= mod.regen; if (mod.cost) D.costMul *= mod.cost; if (mod.noShield) D.noParry = true;
    if (mod.foeSpeed) { D.ai.think = D.ai.think.map(function (v) { return v / mod.foeSpeed; }); D.ai.castMul /= mod.foeSpeed; D.ai.speed = Math.min(1.6, D.ai.speed * Math.sqrt(mod.foeSpeed)); }
    if (mod.heals) D.ai.heals = Math.max(D.ai.heals, mod.heals); if (mod.foeDmg) D.ai.dmg *= mod.foeDmg;
    if (fam) { if (fam.regen) D.regen *= fam.regen; if (fam.cd) D.p.shieldCdMax *= fam.cd; if (fam.ring) D.guardR *= fam.ring; }
    // Chaque adversaire a ses goûts, tirés au hasard à chaque duel : des sorts qu'il ne lance jamais, d'autres qu'il adore. Deux duels ne se ressemblent pas.
    D.ai.taste = {}; DS.SPELLS.forEach(function (s) { D.ai.taste[s.id] = foeCh.spells ? (foeCh.spells.indexOf(s.id) >= 0 ? 1.5 : 0) : s.id === 'scintilla' ? 1 : s.id === 'fulgur' || s.id === 'ignis' ? rand(0.5, 2) : Math.random() < 0.35 ? 0 : rand(0.4, 2.6); }); // un monstre ne lance que ses sorts à lui
    if (foeCh.monster) { D.f.hp = D.f.maxHp = Math.round(foeHp * (foeCh.hp || 1) / 5) * 5; }
    D.baseFoeHp = foeHp; D.pack = null; D.horde = cfg.horde || null; // horde : l'aventure — des vagues de monstres peu résistants, et des événements (startHorde)
    if (D.horde) { D.ai.block *= 0.5; D.horde.wi = -1; D.horde.nextEv = 7 + rand(0, 5); D.horde.kills = 0; nextWave(true); }
    D.age = cfg.age || 'adult'; D.f.age = cfg.klass || foeCh.monster ? 'adult' : DS.ageOf(L); // l'adversaire a l'âge de son niveau ; les professeurs sont adultes
    foeFrame(); buildHud(); setPhase('prep');
  }
  function stop() { cancelTrace(); endDrag(null); toggleDrawer(false); showAllies(false); cv.style.filter = ''; D = null; }
  function setPhase(ph) { D.phase = ph; $('screen-duel').dataset.phase = ph; $('spellbar').classList.toggle('secret', ph !== 'prep'); if (ph === 'end') toggleDrawer(false); if (cb.onPhase) cb.onPhase(ph); }
  function engage() { if (!D || D.phase !== 'prep' || D.klass) return; cancelTrace(); cleanAll(); D.countdown = WORDS.length; D.lastCount = 0; D.f.timer = rand(1.4, 2.2); setPhase('countdown'); }
  function setPaused(v) { if (!D || D.phase === 'end') return; D.paused = v; if (v) cancelTrace(); if (cb.onPause) cb.onPause(v); }
  function setPeek(v) { $('spellbar').classList.toggle('peek', !!v); $('allybar').classList.toggle('peek', !!v); }
  function canAct() { return D && !D.paused && (D.phase === 'fight' || (D.phase === 'prep' && !!D.klass)); } // avant le duel, on attend le bouton ; en cours, on s'exerce librement
  function wardOk(spell) { return (spell.cat === 'protection' || spell.cat === 'renfort') && !spell.conjure; } // ce qu'on peut lancer pendant « Protection ! » (pas d'animal : il attaquerait)
  // Remet un sorcier à neuf (maléfices, renforts, brûlure…) ; cleanAll : les deux, plus les projectiles, les rayons et le mur.
  function cleanse(o) {
    TIMERS.forEach(function (k) { o[k] = 0; });
    o.disarmed = 0; o.amp = 0; o.quake = o.echo = o.copies = null; o.wasHexed = false; o.focus = 0; o.prep = 0;
    if (o === D.p) { o.fly = null; o.grav = 0; o.anchor = null; o.shieldT = o.shieldCd = 0; } else { o.shield = 0; o.guard = null; if (o.state !== 'cast') o.state = 'idle'; }
  }
  function cleanAll() { D.held.length = 0; D.foeHeld.length = 0; D.pending.length = 0; D.allies.p = D.allies.f = null; showAllies(false); D.shots.length = 0; D.beams.p = D.beams.f = null; D.wall = null; D.f.state = 'idle'; D.f.combo = []; D.f.tired = 0; cleanse(D.p); cleanse(D.f); }

  // ───────────────────────── Commandes ─────────────────────────
  function onPointerDown(e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (!canAct() || (e.target.closest && e.target.closest('button, .overlay, .ui'))) return;
    SFX.unlock();
    if (e.pointerType === 'touch') { wand.x = mouse.x; wand.y = mouse.y; if (releaseAt(mouse.x, mouse.y)) return; touchStart = performance.now(); beginTrace(); }
    else if (e.button === 0) { if (releaseAt(mouse.x, mouse.y)) return; mouseDown = true; parry(); } // un clic sur un sort en réserve le lance ; ailleurs, il pare
  }
  function onPointerUp(e) {
    if (drag) endDrag(e);
    if (e.pointerType !== 'touch') { mouseDown = false; return; }
    if (!D || !D.trail) return;
    // au doigt : un petit tapotement = parade, un glissement = tracé
    if (performance.now() - touchStart < 260 && D.trail.len < 30) { cancelTrace(); parry(); } else endTrace();
  }
  function onKeyDown(e) {
    if (!D) return;
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat && !spaceDown) { spaceDown = true; if (canAct()) beginTrace(); } }
    else if (e.code === 'KeyG' || e.code === 'Tab') { e.preventDefault(); setPeek(true); }
    else if (e.code === 'KeyB' && !e.repeat && D.belt && D.phase !== 'end') toggleDrawer();
    else if (e.code === 'Enter' && D.phase === 'prep') { e.preventDefault(); engage(); }
    else if (e.code === 'Escape' && D.phase !== 'end') setPaused(!D.paused);
  }
  function onKeyUp(e) {
    if (e.code === 'Space') { spaceDown = false; if (D && D.trail) endTrace(); }
    else if (e.code === 'KeyG' || e.code === 'Tab') setPeek(false);
  }

  // ───────────────────────── Ceinture et tiroir à sorts ─────────────────────────
  // On ne peut lancer que les sorts de sa ceinture. Le tiroir (bouton 📖 ou touche B) montre tous ceux qu'on connaît :
  // on en glisse un sur une case de la ceinture, en plein duel si on veut — pendant ce temps, le combat continue.
  function castable() { return (D.belt ? D.belt.filter(Boolean) : D.all).filter(function (s) { return !s.potion; }); } // les potions ne se tracent pas
  function manaCost(spell) { return Math.max(1, Math.round(spell.mana * D.costMul)); }
  function buildBelt() {
    var bar = $('spellbar');
    hudCache = {};
    if (!D.belt) { bar.innerHTML = ''; return; }
    bar.classList.toggle('many', D.belt.length >= 6);
    bar.innerHTML = D.belt.map(function (s, i) {
      if (!s) return '<div class="spell empty" data-slot="' + i + '" style="--c:#8a93a8"><div class="glyph-box"><span class="plus">+</span></div><b>Libre</b><small>Glisse un sort ici</small></div>';
      if (s.potion) { var n = D.potions[s.pid] || 0; return '<div class="spell potion' + (n ? '' : ' gone') + '" data-slot="' + i + '" data-potion="' + s.pid + '" style="--c:' + s.color + '"><div class="glyph-box"><span class="pot">' + s.icon + '</span></div><b>' + s.label + '</b><small>' + (n ? 'Clic : boire' : 'Plus de potion') + '</small><em class="n">× ' + n + '</em></div>'; }
      return '<div class="spell" data-slot="' + i + '" data-id="' + s.id + '" style="--c:' + s.color + '"><div class="glyph-box">' + A.glyphSvg(s.glyph, s.color) + '<span class="q">' + s.icon + '</span></div><b>' + s.name + '</b><small>' + s.label + '</small><em>' + manaCost(s) + '</em><i class="done">✓</i></div>';
    }).join('') + '<div class="spell parry" data-id="parry" style="--c:#bfe6ff"><div class="glyph-box"><span class="shield">🛡</span></div><b>Parade</b><small>Clic sur le sort</small><i class="done">✓</i></div>' +
      '<button id="belt-open" class="belt-open" title="Changer les sorts de ma ceinture (touche B)"><span>📖</span><small>Mes sorts</small></button>';
    $('belt-open').addEventListener('click', function () { toggleDrawer(); });
  }
  function buildDrawer() {
    var el = $('drawer');
    if (!D.belt) { el.innerHTML = ''; el.classList.remove('open'); return; }
    el.innerHTML = '<p class="dr-tip">Glisse un sort sur une case de ta ceinture.</p>' + DS.CATS.concat([{ id: 'potion', icon: '🧪', name: 'Potions' }]).map(function (cat) {
      var list = D.all.filter(function (s) { return s.cat === cat.id; });
      return list.length ? '<h4>' + cat.icon + ' ' + cat.name + '</h4><div class="dr-grid">' + list.map(function (s) {
        return '<div class="dspell" data-id="' + (s.potion ? s.pid : s.id) + '" style="--c:' + s.color + '" title="' + s.label + ' — ' + s.desc + '"><span class="ic">' + s.icon + '</span><b>' + s.name + '</b><em>' + (s.potion ? '× ' + (D.potions[s.pid] || 0) : manaCost(s)) + '</em></div>';
      }).join('') + '</div>' : '';
    }).join('');
    markDrawer();
  }
  function markDrawer() {
    $('drawer').querySelectorAll('.dspell').forEach(function (el) {
      var s = DS.item(el.dataset.id);
      el.classList.toggle('on', D.belt.indexOf(s) >= 0); el.classList.toggle('sel', D.pick === s);
    });
    $('spellbar').classList.toggle('target', !!D.pick);
  }
  function toggleDrawer(v) { var el = $('drawer'), was = el.classList.contains('open'); el.classList.toggle('open', v === undefined ? !was : !!v); if (el.classList.contains('open') !== was) SFX.drawer(!was); if (D && !el.classList.contains('open') && D.pick) { D.pick = null; markDrawer(); } }
  function slotAt(x, y) { var el = document.elementFromPoint(x, y); el = el && el.closest ? el.closest('#spellbar [data-slot]') : null; return el ? +el.dataset.slot : -1; }
  function hotSlot(i) { $('spellbar').querySelectorAll('[data-slot]').forEach(function (el) { el.classList.toggle('hot', +el.dataset.slot === i); }); }
  function onDrawerDown(e) {
    var t = e.target.closest && e.target.closest('.dspell');
    if (!t || !D || !D.belt || drag) return;
    e.preventDefault();
    var s = DS.item(t.dataset.id), gh = document.createElement('div');
    gh.className = 'drag-ghost'; gh.style.setProperty('--c', s.color); gh.textContent = s.icon; document.body.appendChild(gh);
    drag = { spell: s, ghost: gh, moved: false, x0: e.clientX, y0: e.clientY }; moveGhost(e); SFX.pick();
  }
  function moveGhost(e) {
    drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) drag.moved = true;
    drag.ghost.classList.toggle('on', drag.moved); hotSlot(drag.moved ? slotAt(e.clientX, e.clientY) : -1);
  }
  function endDrag(e) {
    var d = drag; drag = null;
    if (!d) return;
    d.ghost.remove(); hotSlot(-1);
    if (!D || !D.belt || !e) return;
    if (d.moved) { var i = slotAt(e.clientX, e.clientY); if (i >= 0) place(d.spell, i); }
    else { D.pick = D.pick === d.spell ? null : d.spell; markDrawer(); } // simple clic : on choisit le sort, puis on clique sur une case
  }
  function onBeltClick(e) {
    var el = e.target.closest && e.target.closest('[data-slot]');
    if (!el || !D || !D.belt) return;
    if (D.pick) return place(D.pick, +el.dataset.slot);
    if (el.dataset.potion) drink(el.dataset.potion, el);
  }
  // Boire une potion de la ceinture : effet immédiat, et une fiole de moins.
  function drink(pid, el) {
    var s = DS.item(pid), p = D.p, n = D.potions[pid] || 0;
    if (!s || D.phase !== 'fight' || D.paused) return;
    if (!n) { flashClass(null, 'nope', el); SFX.nope(); return; }
    D.potions[pid] = n - 1; if (cb.onPotion) cb.onPotion(pid);
    var say = function (str, color) { text(W / 2, H * 0.56, str, color || s.color, 1.1); };
    if (s.heal) { p.hp = Math.min(p.maxHp, p.hp + s.heal); say('Glou glou ! +' + s.heal + ' vie', '#8dffb0'); SFX.heart(); }
    if (s.mana) { p.mana = Math.min(p.maxMana, p.mana + s.mana); say('Glou glou ! +' + s.mana + ' d’énergie', '#7fb0ff'); SFX.mend(); }
    if (s.cure) { HEX_KEYS.forEach(function (k) { p[k] = 0; }); p.disarmed = 0; p.burn = p.poison = 0; p.quake = p.echo = null; p.fly = null; p.anchor = null; say('Tout s’efface !', '#8dffb0'); SFX.mend(); }
    if (s.amp) { p.amp += s.amp; say('Force ×1,5 pour ' + s.amp + ' attaques !', '#ff9a5a'); SFX.sparkle(); }
    if (s.ward) { p.ward = s.ward; say('Un dôme te protège !', '#ffd978'); SFX.shield(); }
    burst(W * 0.5, H * 0.6, s.color, 24, 300); flashClass(null, 'cast', el);
    buildBelt(); syncHud();
  }
  // Range un sort dans la case i. S'il était déjà dans une autre case, les deux échangent leur place.
  function place(spell, i) {
    var j = D.belt.indexOf(spell);
    D.pick = null;
    if (j !== i) {
      if (j >= 0) D.belt[j] = D.belt[i];
      D.belt[i] = spell; SFX.drop(); buildBelt(); syncHud();
      flashClass(null, 'cast', document.querySelector('#spellbar [data-slot="' + i + '"]'));
      if (cb.onBelt) cb.onBelt(D.belt.map(function (s) { return s ? (s.potion ? s.pid : s.id) : null; }));
    }
    markDrawer();
  }

  // ───────────────────────── Tracé des sorts ─────────────────────────
  function beginTrace() {
    var p = D.p;
    if (!canAct() || D.trail || p.disarmed > 0) return;
    if (D.beams.p) { if (!D.klass) return; stopBeam(true); } // en cours, on peut couper son rayon pour tracer autre chose
    if (p.frozen > 0) return nag('Tu es gelé !', '#a8f0ff');
    D.trail = { pts: [{ x: wand.x, y: wand.y }], len: 0, stars: [], nextStar: 0 };
    SFX.traceStart();
  }
  function extendTrace() {
    var tr = D.trail, lastP = tr.pts[tr.pts.length - 1], d = Math.hypot(wand.x - lastP.x, wand.y - lastP.y);
    if (d < 2) return;
    tr.pts.push({ x: wand.x, y: wand.y }); tr.len += d;
    while (tr.nextStar < tr.len) { // étincelles qui restent accrochées au tracé
      var t = 1 - (tr.len - tr.nextStar) / d;
      tr.stars.push({ x: lerp(lastP.x, wand.x, t) + rand(-5, 5), y: lerp(lastP.y, wand.y, t) + rand(-5, 5), ph: rand(0, TAU), s: rand(0.6, 1.3) });
      tr.nextStar += rand(14, 26);
    }
    if (Math.random() < 0.7) part(wand.x, wand.y, rand(-25, 25), rand(-10, 45), rand(0.5, 1.1), '#8fd0ff', rand(1, 2.4), 60);
  }
  function cancelTrace() {
    if (!D || !D.trail) return;
    D.ghosts.push({ pts: D.trail.pts, color: '#8a93a8', t: 0, dur: 0.5, mode: 'fail' });
    D.trail = null; SFX.traceStop();
  }
  function spellOf(glyph) { return DS.SPELLS.filter(function (s) { return s.glyph === glyph; })[0]; }
  function endTrace() {
    var tr = D.trail, p = D.p; D.trail = null; SFX.traceStop();
    if (!tr || tr.pts.length < 2) return;
    if (p.conjure > 0 && conjureTrace(tr)) return; // après Conjura, le tracé suivant choisit l'animal
    // taille minimale d'un tracé : 9 % de la hauteur de l'écran, et 15 % pour un simple trait (sinon un tout petit coup de baguette suffirait)
    // seules les formes des sorts de la ceinture comptent (en cours : toutes)
    var opts = { min: H * 0.09, minLine: H * 0.15, only: D.belt ? castable().map(function (s) { return s.glyph; }) : D.only };
    var r = G.recognize(tr.pts, opts), why = G.why, spell = r && spellOf(r.id), other = null;
    if (!r && D.belt) { opts.only = D.all.filter(function (s) { return !s.potion; }).map(function (s) { return s.glyph; }); var r2 = G.recognize(tr.pts, opts); other = r2 && spellOf(r2.id); } // un sort connu, mais resté dans le tiroir ?
    var miss = r ? '' : other ? other.name + ' n’est pas à ta ceinture !' : why === 'short' ? 'Trop court !' : why === 'vertical' ? 'Trop vertical !' : 'Raté…', p0 = tr.pts[0], p1 = tr.pts[tr.pts.length - 1];
    var bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    tr.pts.forEach(function (q) { bx0 = Math.min(bx0, q.x); bx1 = Math.max(bx1, q.x); by0 = Math.min(by0, q.y); by1 = Math.max(by1, q.y); });
    var geo2 = { ang: G.slope(tr.pts), len: Math.hypot(p1.x - p0.x, p1.y - p0.y), cx: (p0.x + p1.x) / 2, cy: (p0.y + p1.y) / 2, size: Math.max(bx1 - bx0, by1 - by0) }; // pour les leçons : angle, longueur (d'un bout à l'autre), milieu et taille du tracé
    var fail = function (msg) {
      D.ghosts.push({ pts: tr.pts, color: '#8a93a8', t: 0, dur: 0.7, mode: 'fail' }); SFX.fizzle();
      if (msg && tr.len > (D.klass ? 12 : 60)) text(wand.x, wand.y - 30, msg, '#c9cfdd', 0.9);
    };
    if (D.klass && cb.onTrace) { // en cours, c'est le professeur qui dit si le tracé convient (true), ou pourquoi non (un message)
      var verdict = spell ? cb.onTrace({ ok: true, spell: spell, quality: r.quality, geo: geo2 }) : tr.len > 12 ? cb.onTrace({ ok: false, why: why, geo: geo2 }) : null;
      if (verdict !== true) return fail(verdict || miss);
    } else if (!spell) return fail(miss);
    if (p.silenced > 0 && spell.cat === 'attaque') return fail('Silence ! Pas d’attaque pour l’instant.');
    if (D.wardT > 0 && !wardOk(spell)) return fail('Pas encore ! Seulement des protections.');
    if (p.noShield > 0 && (spell.ward || spell.absorb)) return fail('Impossible : tes boucliers sont brisés !');
    if (spell.wall && D.wall && !D.klass) return fail('Il y a déjà un mur !');
    var practice = D.phase === 'prep', cost = manaCost(spell), S = DS.spellMul(D.slv[spell.id]); // S : bonus du niveau du sort
    if (!practice && p.mana < cost) { flashClass('me-mana-bar', 'short'); SFX.empty(); return fail('Pas assez d’énergie !'); }
    if (!practice) { p.mana -= cost; D.stats.casts++; D.used[spell.id] = (D.used[spell.id] || 0) + MASTERY[r.quality]; } else { D.practiced[spell.id] = true; }
    var q = QUALITY[r.quality], combo = comboOf(spell);
    if (p.invis > 0 && !practice) { p.invis = 0; text(W / 2, H * 0.5, 'Tu réapparais !', '#d8d8ff', 1); } // Evanesco : lancer un sort nous rend visible
    if (combo) { S = DS.spellMul(D.slv[spell.id] + 1 + (D.mod.comboLv || 0), true); D.lastCombo = { id: combo.id, t: D.time }; D.stats.combos = (D.stats.combos || 0) + 1; D.comboT = 1.6; D.comboName = combo.name; SFX.perfect(); D.flash = Math.max(D.flash, 0.12); } // enchaînement réussi : le dernier sort a un niveau de plus
    D.ghosts.push({ pts: tr.pts, color: spell.color, t: 0, dur: 0.45, mode: 'ok' });
    if (spell.self) selfCast(p, true, spell, practice && !D.klass ? 0 : q.mul * S.dur, S); // sort lancé sur soi : pas de projectile (à l'échauffement, 3 s seulement ; en cours, la vraie durée)
    else if (spell.beam) startBeam(true, spell, S, D.wd.power * q.mul * atk(p, spell, practice), practice);
    else if (p.prep > 0 && spell.cat === 'attaque') holdSpell(spell, S, D.wd.power * q.mul * atk(p, spell, practice), r.quality, practice); // Preparus : elle attendra à côté de nous
    else launch(spell, S, D.wd.power * q.mul * atk(p, spell, practice), r.quality, practice);
    SFX.cast(spell.id); if (r.quality === 'parfait') SFX.sparkle();
    text(wand.x, wand.y - 34, spell.name + ' !' + (q.text ? '  ' + q.text : ''), spell.color, 1);
    flashClass(null, 'cast', document.querySelector('#spellbar [data-id="' + spell.id + '"]'));
    for (var i = 0; i < 14; i++) part(wand.x, wand.y, rand(-140, 140), rand(-140, 140), rand(0.25, 0.6), spell.color, rand(1.5, 3), 0);
  }
  // Les enchaînements (DS.COMBOS) : on garde nos derniers sorts lancés ; si les derniers forment un enchaînement, sans traîner entre deux, il est réussi.
  function comboOf(spell) {
    var h = D.hist = D.hist || [], t = D.time;
    h.push({ id: spell.id, t: t }); if (h.length > 6) h.shift();
    for (var c = 0; c < DS.COMBOS.length; c++) {
      var seq = DS.COMBOS[c].seq, n = seq.length; if (h.length < n) continue;
      var ok = true;
      for (var k = 0; k < n && ok; k++) { var e = h[h.length - n + k]; if (e.id !== seq[k] || (k && e.t - h[h.length - n + k - 1].t > DS.COMBO_GAP)) ok = false; }
      if (ok) { D.hist = []; return DS.COMBOS[c]; } // un enchaînement ne se cumule pas : on repart de zéro
    }
    return null;
  }
  function nag(msg, color) { var p = D.p; if (D.time - (p.nagT || -9) > 0.8) { p.nagT = D.time; text(wand.x, wand.y - 40, msg, color, 0.9); SFX.fizzle(); } }

  // ───────────────────────── Maléfices, renforts, dégâts ─────────────────────────
  function hexed(o) { for (var i = 0; i < HEX_KEYS.length; i++) if (o[HEX_KEYS[i]] > 0) return true; return false; }
  function isHex(sp) { for (var k in HEXES) if (sp[k]) return true; return false; }
  // Fortis double les dégâts ; Amplio renforce les prochaines attaques (et s'use à chacune).
  function atk(o, spell, practice) {
    var k = o.fortis > 0 ? 2 : 1;
    if (o.amp > 0 && (spell.dmg || spell.beam || spell.quake)) { k *= 1.5; if (!practice) o.amp--; }
    if (o === D.p) { k *= D.mod.pDmg || 1; if (D.mod.fireDmg && (spell.burn || (spell.beam && spell.beam.fire) || spell.meteors)) k *= D.mod.fireDmg; } // règles de la tour : nos sorts (de feu) frappent plus fort
    return k;
  }
  // Le sorcier o perd de la vie. Bastion divise par deux ; Ritardo note les dégâts pour les resservir plus tard (raw : ni l'un ni l'autre).
  function hurt(o, isP, dmg, raw) {
    if (!raw) { if (o.bastion > 0) dmg = Math.ceil(dmg / 2); if (isP && D.fam && D.fam.guard) dmg = Math.ceil(dmg * (1 - D.fam.guard)); if (o.echo) o.echo.dmg += dmg; } // le golem encaisse une part des coups
    if (dmg <= 0) return;
    if (!isP && D.pack) { // une horde : c'est le monstre visé qui encaisse
      var pk = D.pack, mb = pk.m[pk.hit != null && pk.m[pk.hit].hp > 0 ? pk.hit : pk.act]; if (mb.hp <= 0) mb = packAlive()[0]; if (!mb) return;
      mb.hp = Math.max(0, mb.hp - dmg); mb.flash = 0.25; packSync(); var dx = foeSlotDx(pk.m.indexOf(mb)); text(F.chest.x + dx + rand(-20, 20), F.chest.y - F.h * 0.5, '-' + dmg, '#fff1a8', 1.15); return;
    }
    o.hp = Math.max(0, o.hp - dmg);
    if (isP) text(W / 2 + rand(-30, 30), H * 0.45, '-' + dmg, '#ff8a8a', 1.5); else text(F.chest.x + rand(-20, 20), F.chest.y - F.h * 0.5, '-' + dmg, '#fff1a8', 1.15);
  }
  // Sort lancé sur soi (o : le joueur ou l'adversaire). mul allonge les durées ; mul = 0 : simple essai de 3 secondes, à l'échauffement.
  function selfCast(o, isP, spell, mul, S) {
    var d = function (v) { return mul ? v * mul : 3; }, live = D.phase === 'fight', other = isP ? D.f : D.p;
    var note = function (str, color) { text(isP ? W / 2 : F.chest.x, isP ? H * 0.56 : F.chest.y - F.h * 0.66, str, color || spell.color, isP ? 1 : 0.9); };
    BUFF_KEYS.forEach(function (k) { if (spell[k]) o[k] = d(spell[k]); });
    if (spell.antiIce) o.frozen = 0;                                  // et le glaçon fond tout de suite
    if (spell.antiPoison) o.poison = 0;
    if (spell.regen) { o.regen = d(spell.regen.dur); o.regenHps = spell.regen.hps; }
    if (spell.amp) o.amp = spell.amp;
    if (spell.shieldHp) { o.shieldHp = Math.round(spell.shieldHp * S.pow); note(isP ? 'Arcanum : ' + o.shieldHp + ' dégâts encaissés pour toi' : 'Un bouclier arcanique !'); }
    if (spell.needles) { // Stalagma : des aiguilles de glace partout autour : les sorts qui venaient vers nous éclatent, et l'autre en prend
      var hits = 0; for (var si = D.shots.length - 1; si >= 0; si--) { var sh = D.shots[si]; if ((isP ? sh.from === 'foe' : sh.from === 'player') && !sh.sky) { var q = shotPos(sh); burst(q.x, q.y, '#bfe6ff', 16, 220); D.shots.splice(si, 1); hits++; } }
      for (var ni = 0; ni < 26; ni++) { var na = rand(0, TAU), nv = rand(200, 620); part(isP ? wand.x : F.chest.x, isP ? wand.y : F.chest.y, Math.cos(na) * nv, Math.sin(na) * nv, rand(0.4, 0.9), ni % 3 ? '#bfe6ff' : '#ffffff', rand(2, 5), 300); }
      SFX.freeze(); D.shake = Math.max(D.shake, 8); if (hits) note(isP ? hits + ' sort(s) brisé(s) en vol !' : 'Ses aiguilles brisent tes sorts !', '#bfe6ff');
      var nd = Math.round(spell.dmg * (mul ? S.dmg : 0)); if (nd && (live || D.klass)) { if (isP) { if (D.target) hitTarget(spell, nd, F.chest.x, F.chest.y, false, null, 1); else if (live) { hurt(other, true, nd); if (other.hp <= 0) finish(true); } } else if (live) { hurt(other, false, nd); p.hurt = 0.4; if (other.hp <= 0) finish(false); } }
    }
    if (spell.invis) note(isP ? 'Tu disparais ! Les boules te traversent…' : 'Il disparaît !');
    if (spell.swipe) note(isP ? 'Ta baguette dévie : un revers dans l’anneau doré' : 'Sa baguette dévie !');
    if (spell.smoke) note(isP ? 'Un écran de fumée : il ne voit plus tes gestes' : 'Il se cache dans la fumée !');
    if (spell.focus) { o.focus = spell.focus; note(isP ? 'Concentré : 2 sorts ne t’interrompront pas' : 'Il se concentre !'); }
    if (spell.prep) { o.prep = Math.min(HOLD_MAX, (o.prep || 0) + 1); note(isP ? 'Ta prochaine attaque restera en réserve' : 'Il prépare quelque chose…'); }
    if (spell.conjure) { if (isP) { o.conjure = spell.conjure; showAllies(true); note('Vite, trace ton animal !'); } else spawnAlly(false, pickOne(DS.ALLIES), 1); }
    if (spell.heal && (live || D.klass)) { var hp = Math.round(spell.heal * S.pow); if (live) o.hp = Math.min(o.maxHp, o.hp + hp); note('+' + hp, '#8dffb0'); if (!isP) o.healed++; }
    if (spell.purge) { HEX_KEYS.concat(['burn', 'poison', 'whirl']).forEach(function (k) { o[k] = 0; }); o.quake = o.echo = null; o.wasHexed = false; if (isP) { o.fly = null; o.anchor = null; } note(isP ? 'Purifié !' : 'Il se purifie !'); }
    if (spell.copies) { o.copies = { real: isP ? 1 : Math.floor(Math.random() * 3), alive: [true, true, true], t: d(spell.copies), spread: 0 }; SFX.pop(); }
    if (spell.wall) { D.wall = { hp: spell.wall, max: spell.wall, t: mul ? 25 : 3, rise: 0, flash: 0 }; SFX.crash(0.5); }
    if (spell.cat === 'protection' && o.quake) { o.quake = null; note(isP ? 'Tremor est dissipé !' : 'Il dissipe Tremor !', '#ffd978'); } // une protection lancée à temps arrête les secousses
    if (spell.ward || spell.absorb || spell.mirror || spell.bastion) for (var i = 0; i < 18; i++) part((isP ? wand.x : F.chest.x) + rand(-40, 40), (isP ? wand.y : F.chest.y) + rand(-40, 40), rand(-60, 60), rand(-120, -30), rand(0.4, 0.9), spell.color, rand(1.5, 3.5), 0);
    return other;
  }
  // Un maléfice s'abat sur o… s'il n'en subit pas déjà un et n'y résiste pas.
  function applyHex(o, isP, sp, S, note) {
    var k = null, key, f = D.f, p = D.p, c = F.chest, i;
    for (key in HEXES) if (sp[key]) k = key;
    if (!k) return;
    if (hexed(o) || o.resist > 0) return note('Il résiste !', 'Tu résistes !', '#c9cfdd');
    var dur = sp[k] * (isP ? 0.85 : S.dur);
    o[HEXES[k]] = o.hexMax = dur; note(HEX_TXT[k][0], HEX_TXT[k][1]);
    if (k === 'freeze') { if (isP) { cancelTrace(); stopBeam(true); p.shieldT = 0; } else { abortFoeCast(); stopBeam(false); f.shield = 0; } SFX.freeze(); }
    if (k === 'slow' && !isP) f.slowF = Math.max(0.25, SLOW_FOE - 0.03 * (S.lv - 1));
    if (k === 'disarm') {
      if (isP) disarmPlayer();
      else { // lui aussi doit rattraper sa baguette : plus il est fort, plus souvent il y arrive
        abortFoeCast(); stopBeam(false); f.caught = Math.random() < clamp(D.ai.block + 0.1, 0.25, 0.8);
        if (f.caught) f.disarmed = Math.min(dur, 1.4);
        f.disarmMax = f.disarmed; f.disarmDir = Math.random() < 0.5 ? -1 : 1;
      }
    }
    if (k === 'soak') {
      SFX.splash();
      if (isP) for (i = 0; i < 60; i++) part(rand(0, W), rand(-0.1, 0.6) * H, rand(-60, 60), rand(60, 420), rand(0.5, 1.2), '#9fd8ff', rand(2, 6), 500);
      else { f.soakMiss = Math.min(0.6, 0.35 + 0.05 * (S.lv - 1)); for (i = 0; i < 26; i++) part(c.x + rand(-12, 12) * F.u, c.y - rand(20, 45) * F.u, rand(-150, 150), rand(-260, -40), rand(0.5, 1), '#9fd8ff', rand(2, 4), 620); }
    }
    if (k === 'blind' && !isP) f.blindMiss = Math.min(0.9, 0.7 + 0.05 * (S.lv - 1)); // il rate presque tous ses sorts et ne voit plus les nôtres
    if (k === 'sleep') { o.sleepT = 0; if (!isP) { f.sleepF = Math.max(0.3, 0.5 - 0.04 * (S.lv - 1)); f.zT = 0.3; } }
    if (k === 'fast' && isP) p.anchor = null;
    if (k === 'sneeze') o.sneezeT = 0.6; // premier éternuement dans un instant, puis un toutes les secondes et demie
  }
  // Désarmo sur nous : la baguette part en l'air dans une direction au hasard. On la rattrape en vol pendant qu'elle retombe, sinon il faut la ramasser par terre.
  function disarmPlayer() {
    var p = D.p, side = Math.random() < 0.5 ? -1 : 1;
    p.disarmed = 1; cancelTrace(); stopBeam(true); p.shieldT = 0;
    p.fly = { x: wand.x, y: Math.min(wand.y, H * 0.8), vx: side * W * rand(0.1, 0.34), vy: -H * rand(0.95, 1.2), rot: rand(0, TAU), spin: side * rand(8, 14), ground: false, hold: 0 };
  }
  function rearm(msg) { var p = D.p; p.disarmed = 0; p.fly = null; SFX.perfect(); text(wand.x, wand.y - 40, msg, '#ffe9a0', 1.1); burst(wand.x, wand.y, '#ffe9a0', 16, 200); }
  function updateFly(dt) {
    var p = D.p, w = p.fly, near;
    if (!w) return;
    near = Math.hypot(wand.x - w.x, wand.y - w.y) < H * 0.1;
    if (!w.ground) {
      w.vy += H * 1.6 * dt; w.x += w.vx * dt; w.y += w.vy * dt; w.rot += w.spin * dt;
      if (w.x < W * 0.05) w.vx = Math.abs(w.vx); if (w.x > W * 0.95) w.vx = -Math.abs(w.vx);
      if (w.vy > 0 && near) return rearm('Rattrapée !');
      if (w.y >= H * 0.9) { w.ground = true; w.y = H * 0.9; w.rot = 0.12; SFX.thud(); }
    } else { // par terre : il faut garder la main dessus un petit moment
      w.hold = near ? w.hold + dt : Math.max(0, w.hold - dt * 2);
      if (w.hold >= 0.7) rearm('Ramassée !');
    }
  }
  // Copius : les doubles disparaissent un à un quand on tire dessus, et tous d'un coup dès que le vrai est trouvé.
  function aliveSlots(cp) { return [0, 1, 2].filter(function (i) { return cp.alive[i]; }); }
  function foeSlotDx(slot) { var cp = D.f.copies; if (D.pack) return slot != null ? packDx(slot) - packDx(D.pack.act) : 0; if (D.target && D.target.row && slot != null) return rowDx(slot); return cp && slot != null ? (slot - cp.real) * W * COPY_GAP * cp.spread : 0; }

  // ───────────────────────── Hordes (l'aventure) ─────────────────────────
  // D.horde = { waves: [[monstre…], …], events: [{ spell | quake, say }], level } · D.pack : la vague en cours { m: [{ ch, hp, maxHp, fall, flash, age }], act }.
  // Chaque monstre a sa vie (peu : une horde se fauche vite) ; l'adversaire f, lui, porte l'état commun (minuteries, énergie) et c'est le monstre act qui trace.
  // f.offX suit le monstre qui lance, donc F.x est toujours sur lui ; les autres sont dessinés décalés de packDx. Nos sorts visent le monstre le plus proche de la baguette.
  function packDx(i) { var n = D.pack ? D.pack.m.length : 1; return (i - (n - 1) / 2) * W * (n > 2 ? 0.15 : 0.19); }
  function packAlive() { return D.pack ? D.pack.m.filter(function (mb) { return mb.hp > 0; }) : []; }
  function packSlot() { var off = viewOff(), best = D.pack.act, bd = Infinity; D.pack.m.forEach(function (mb, i) { if (mb.hp <= 0) return; var d = Math.abs(wand.x - (F.chest.x + off.x + foeSlotDx(i))); if (d < bd) { bd = d; best = i; } }); return best; }
  function packPace() { var n = packAlive().length; return D.pack ? 1 / (0.55 + 0.45 * Math.max(1, n)) : 1; } // plus ils sont nombreux, plus les sorts pleuvent
  function nextWave(first) {
    var f = D.f, hd = D.horde; hd.wi++;
    var list = hd.waves[hd.wi], m = list.map(function (ch, i) { var hp = Math.round(D.baseFoeHp * (ch.hp || 1) * (ch.size > 1.2 ? 0.8 : 0.33) / 5) * 5; return { ch: ch, hp: Math.max(10, hp), maxHp: Math.max(10, hp), fall: 0, flash: 0, age: first ? 9 : 0 }; });
    D.pack = { m: m, act: Math.floor(Math.random() * m.length), pending: 0 };
    f.hp = f.maxHp = m.reduce(function (a, mb) { return a + mb.maxHp; }, 0); f.state = 'idle'; f.combo = []; f.timer = first ? f.timer : rand(0.7, 1.3); f.fall = 0;
    setActive(D.pack.act); if (!first) { f.offX = packDx(D.pack.act); packHud(); }
    if (!first) { SFX.crash(0.6); D.shake = Math.max(D.shake, 10); text(W / 2, H * 0.3, list.length > 1 ? '⚠ ' + list.length + ' autres arrivent !' : '⚠ En voilà un autre !', '#ff9a7a', 1.3); }
  }
  function setActive(i) { var ch = D.pack.m[i].ch; D.pack.act = i; D.ai.taste = {}; DS.SPELLS.forEach(function (s) { D.ai.taste[s.id] = ch.spells && ch.spells.indexOf(s.id) >= 0 ? 1.5 : 0; }); }
  function packNextActive() { var al = []; D.pack.m.forEach(function (mb, i) { if (mb.hp > 0) al.push(i); }); if (!al.length) return; setActive(al.length > 1 && Math.random() < 0.7 ? pickOne(al.filter(function (i) { return i !== D.pack.act; })) : al[0]); }
  function packHud() { var m = packAlive(), hd = D.horde; $('foe-name').textContent = m.map(function (mb) { return mb.ch.name + (mb.ch.title ? ' ' + mb.ch.title : ''); }).join(' & '); $('foe-level').textContent = 'Vague ' + (hd.wi + 1) + ' / ' + hd.waves.length + ' · niveau ' + D.level; if (m.length) portrait('hud-foe', m[0].ch, 'adult'); }
  function packTick(dt) {
    var pk = D.pack, f = D.f, hd = D.horde, live = D.phase === 'fight', i;
    pk.m.forEach(function (mb, i) {
      mb.age += dt; if (mb.flash > 0) mb.flash -= dt;
      if (mb.hp <= 0 && !mb.dead) { mb.dead = true; hd.kills++; text(F.x + foeSlotDx(i), F.fy - F.h * 0.9, mb.ch.name + ' est vaincu' + (mb.ch.f ? 'e' : '') + ' !', '#ffe9a0', 1); SFX.crash(0.4); if (i === pk.act && packAlive().length) { abortFoeCast(); packNextActive(); f.timer = Math.min(f.timer, rand(0.5, 1)); packHud(); } }
      if (mb.dead) mb.fall = Math.min(1, mb.fall + dt * 1.6);
    });
    if (f.hp <= 0 && !pk.pending && hd.wi < hd.waves.length - 1) pk.pending = 1.1; // tous à terre : la vague suivante arrive
    if (pk.pending > 0) { pk.pending -= dt; if (pk.pending <= 0) { pk.pending = 0; nextWave(false); } }
    if (live && f.hp > 0 && hd.events.length && (hd.nextEv -= dt) <= 0) { hd.nextEv = 9 + rand(0, 7); fireEvent(pickOne(hd.events)); } // le monde s'en mêle
    pk.hit = null;
  }
  function fireEvent(ev) { // un événement du biome : un sort tombé du ciel, ou le sol qui tremble
    var p = D.p; D.banner = { str: ev.say, t: 1.6, dur: 1.6 }; SFX.horn(); D.horde.fired = (D.horde.fired || []).concat(ev.say);
    if (ev.quake) { p.quake = { t: 0, delay: 2.4, n: 3, done: 0, dmg: Math.round(6 * D.ai.dmg), orb: false }; D.shake = Math.max(D.shake, 12); text(W / 2, H * 0.56, 'Une protection, vite : elle arrêtera les secousses !', '#d9a066', 1); return; }
    var sp = DS.byId(DS.SPELLS, ev.spell); if (!sp) return;
    fireFoe(sp, { x: W * rand(0.3, 0.7), y: -H * 0.05 }); SFX.cast(sp.id, 0.7);
  }
  function packSync() { // les dégâts continus (brûlure, poison…) s'appliquent à f : on les reporte sur le monstre actif
    var pk = D.pack, f = D.f, sum = 0; pk.m.forEach(function (mb) { sum += Math.max(0, mb.hp); });
    if (f.hp < sum - 0.001) { var mb = pk.m[pk.act]; if (mb.hp > 0) mb.hp = Math.max(0, mb.hp - (sum - f.hp)); else { var al = packAlive(); if (al.length) al[0].hp = Math.max(0, al[0].hp - (sum - f.hp)); } }
    sum = 0; pk.m.forEach(function (mb) { sum += Math.max(0, mb.hp); }); f.hp = sum;
  }
  function ghostDx(slot) { return (slot - 1) * W * GHOST_GAP; }
  function puff(x, y) { for (var i = 0; i < 22; i++) { var a = rand(0, TAU), v = rand(30, 160); part(x + rand(-12, 12), y + rand(-30, 30), Math.cos(a) * v, Math.sin(a) * v - 40, rand(0.4, 0.9), i % 2 ? '#ffc8f0' : '#ffffff', rand(2, 5), -30); } SFX.pop(); }
  function popCopy(o, isP, i) {
    var cp = o.copies;
    if (!cp || !cp.alive[i]) return;
    cp.alive[i] = false;
    if (isP) { puff(wand.x + ghostDx(i), wand.y); text(W / 2 + ghostDx(i) * 0.8, H * 0.5, 'Il a touché un double !', '#ffc8f0', 1); }
    else { puff(F.chest.x + foeSlotDx(i), F.chest.y); text(F.chest.x + foeSlotDx(i), F.chest.y - F.h * 0.66, 'Une copie !', '#ffc8f0', 0.9); }
    if (aliveSlots(cp).length <= 1) endCopies(o, isP, false);
  }
  function endCopies(o, isP, found) {
    var cp = o.copies;
    if (!cp) return;
    aliveSlots(cp).forEach(function (i) { if (i !== cp.real) { if (isP) puff(wand.x + ghostDx(i), wand.y); else puff(F.chest.x + foeSlotDx(i), F.chest.y); } });
    o.copies = null;
    if (found) text(isP ? W / 2 : F.chest.x, isP ? H * 0.62 : F.chest.y - F.h * 0.8, isP ? 'Il t’a trouvé !' : 'Trouvé !', '#ffc8f0', 1);
  }
  // Copie de l'adversaire que vise notre baguette : la plus proche, de gauche à droite.
  function aimSlot() {
    var cp = D.f.copies, off = viewOff(), best = cp.real, bd = Infinity;
    aliveSlots(cp).forEach(function (i) { var d = Math.abs(wand.x - (F.chest.x + off.x + foeSlotDx(i))); if (d < bd) { bd = d; best = i; } });
    return best;
  }

  // ───────────────────────── Sorts en réserve, animaux, éclairs à retardement, éternuements ─────────────────────────
  var HOLD_LIFE = 14, HOLD_BLINK = 5, HOLD_MAX = 3; // un sort en réserve tient 14 s ; il clignote, de plus en plus vite, pendant les 5 dernières
  // Stabilis : un sort qui nous atteint (touché ou paré) use une charge, et ne peut pas nous interrompre.
  function steady(o, s) {
    if (!(o.focus > 0) || s.tick || s.fake || (s.practice && !D.klass)) return false;
    o.focus--;
    var isP = o === D.p;
    text(isP ? W / 2 : F.chest.x, isP ? H * 0.7 : F.chest.y - F.h * 1.02, isP ? (o.focus ? 'Stabilis : encore ' + o.focus : 'Stabilis s’éteint') : (o.focus ? 'Il reste concentré !' : 'Sa concentration cède !'), '#9fe0c8', 0.85);
    return true;
  }
  // Lance une attaque, depuis la baguette ou depuis l'endroit où elle attendait (from). Foudrus ne part pas : il tombera du ciel plus tard.
  function launch(spell, S, mul, quality, practice, from) {
    if (spell.sky) { for (var k = 0; k < (spell.meteors || 1); k++) D.pending.push({ t: spell.sky + k * 0.24, isP: true, spell: spell, S: S, mul: mul, quality: quality, practice: practice }); } // Meteorus : une pluie, un météore après l'autre
    else { firePlayer(spell, S, mul, quality, practice, from); for (var v = 1; v < (spell.volley || 1); v++) D.pending.push({ t: v * 0.22, isP: true, volley: true, spell: spell, S: S, mul: mul, quality: quality, practice: practice }); } // Nocturna : trois boules à la file
  }
  // Preparus : l'attaque reste à flotter à côté de nous jusqu'à ce qu'on clique dessus… ou qu'elle s'éteigne.
  function holdSpell(spell, S, mul, quality, practice) {
    var slot = 0, used;
    D.p.prep--;
    if (D.held.length >= HOLD_MAX) release(D.held[0]); // plus de place : la plus ancienne part
    used = D.held.map(function (h) { return h.slot; });
    while (used.indexOf(slot) >= 0) slot++;
    D.held.push({ spell: spell, S: S, mul: mul, quality: quality, practice: practice, t: 0, ph: 0, slot: slot });
    text(wand.x, wand.y - 62, 'En réserve : clique dessus pour la lancer', '#b8c8ff', 0.85); SFX.pick();
  }
  function heldPos(h) { return { x: W * (h.slot === 0 ? 0.085 : 0.915), y: H * (h.slot === 2 ? 0.4 : 0.6) + Math.sin(time * 2 + h.slot * 2.1) * H * 0.012 }; }
  function heldR() { return H * 0.05; }
  function release(h) {
    var i = D.held.indexOf(h), q = heldPos(h); if (i < 0) return;
    D.held.splice(i, 1); launch(h.spell, h.S, h.mul, h.quality, h.practice, q); SFX.cast(h.spell.id); burst(q.x, q.y, h.spell.color, 14, 200);
  }
  function releaseAt(x, y) { // un clic sur un sort en réserve le lance (true : le clic a servi à ça, pas à parer)
    for (var i = 0; i < D.held.length; i++) { var q = heldPos(D.held[i]); if (Math.hypot(x - q.x, y - q.y) < heldR() * 1.6) { release(D.held[i]); return true; } }
    return false;
  }
  function foeHeldPos(i) { return { x: F.x - (60 + 26 * i) * F.u, y: F.fy - (112 + Math.sin(time * 2.4 + i) * 3) * F.u }; }
  // Conjura : les trois animaux s'affichent au-dessus de la ceinture le temps de tracer le sien (formes cachées en duel, comme celles de la ceinture).
  function buildAllies() {
    $('allybar').innerHTML = DS.ALLIES.map(function (a) { return '<div class="spell" style="--c:' + a.color + '"><div class="glyph-box">' + A.glyphSvg(a.glyph, a.color) + '<span class="q">' + a.icon + '</span></div><b>' + a.name + '</b><small>' + a.how + '</small></div>'; }).join('');
  }
  function showAllies(v) { var el = $('allybar'); if (D) D.allyBar = !!v; el.classList.toggle('hidden', !v); el.classList.toggle('secret', !!D && D.phase === 'fight'); }
  function conjureTrace(tr) {
    var r = G.recognize(tr.pts, { min: H * 0.09, minLine: H * 0.15, only: DS.ALLIES.map(function (a) { return a.glyph; }) }), a = r ? DS.ALLIES.filter(function (x) { return x.glyph === r.id; })[0] : null;
    if (!a && D.klass) { D.p.conjure = 0; showAllies(false); return false; } // en cours, on n'insiste pas : le tracé compte comme un sort ordinaire
    if (!a) { D.ghosts.push({ pts: tr.pts, color: '#8a93a8', t: 0, dur: 0.7, mode: 'fail' }); SFX.fizzle(); if (tr.len > 60) text(wand.x, wand.y - 30, 'Ce n’est pas un animal !', '#c9cfdd', 0.9); return true; }
    D.ghosts.push({ pts: tr.pts, color: a.color, t: 0, dur: 0.45, mode: 'ok' });
    D.p.conjure = 0; showAllies(false); spawnAlly(true, a, QUALITY[r.quality].mul);
    return true;
  }
  function allyPos(isP) { return isP ? { x: W * 0.13, y: H * 0.36 + Math.sin(time * 2.3) * H * 0.014 } : { x: F.x + 64 * F.u, y: F.fy - (104 + Math.sin(time * 2.3) * 3) * F.u }; }
  function spawnAlly(isP, a, mul) {
    D.allies[isP ? 'p' : 'f'] = { a: a, t: a.life, next: 0.7, mul: mul || 1, pop: 0 };
    var q = allyPos(isP); puff(q.x, q.y); SFX.cast('self');
    text(isP ? q.x + W * 0.05 : q.x, q.y - (isP ? H * 0.1 : 24 * F.u), a.name + ' !', a.color, 1);
  }
  function famPos() { return { x: W * 0.08, y: H * 0.52 + Math.sin(time * 1.9) * H * 0.012 }; } // notre familier, perché à gauche
  function allyFire(isP, al, from) {
    var sp = al.a.shot, q = from || allyPos(isP), f = D.f, prep = D.phase === 'prep';
    if (isP) D.shots.push({ from: 'player', spell: sp, lv: 1, t: 0, dur: sp.flight, sx: q.x, sy: q.y, mul: D.wd.power * al.mul, dmg: Math.round(sp.dmg * D.wd.power * al.mul), quality: 'bien', practice: prep, volley: 0, ally: true,
      slot: f.copies ? pickOne(aliveSlots(f.copies)) : D.target && D.target.row ? rowSlot() : null });
    else D.shots.push(aimAtPlayer({ from: 'foe', spell: sp, lv: 1, t: 0, dur: sp.flight * 1.7 / (prep ? 0.6 : D.ai.speed), sx: q.x, sy: q.y, miss: false, mul: D.ai.dmg, dmg: Math.round(sp.dmg * D.ai.dmg), practice: prep, volley: 0, ally: true }));
    SFX.cast('scintilla', 0.35);
  }
  // Foudrus : l'éclair tombe enfin. Sur nous, il arrive toujours par le haut de l'écran : c'est là qu'il faut parer.
  function skyStrike(pe) {
    var sp = pe.spell, f = D.f, s;
    if (pe.isP) {
      if (f.hp <= 0) return;
      s = { from: 'player', spell: sp, lv: pe.S.lv, t: 0, dur: sp.flight, sx: 0, sy: -H * 0.05, dx: rand(-0.1, 0.1) * W, sky: true, mul: pe.mul, dmg: Math.round(sp.dmg * pe.mul * pe.S.dmg), quality: pe.quality, practice: pe.practice, volley: 0,
        slot: f.copies ? aimSlot() : D.target && D.target.row ? rowSlot() : null };
    } else {
      s = aimAtPlayer({ from: 'foe', spell: sp, lv: 1, t: 0, dur: 0.8 / clamp(D.ai.speed, 0.75, 1.2), sx: 0, sy: -H * 0.06, sky: true, miss: false, mul: pe.mul, dmg: Math.round(sp.dmg * pe.mul), practice: pe.practice, volley: 0 });
      s.ty = rand(0.14, 0.24) * H; s.sx = s.tx + rand(-0.08, 0.08) * W;
    }
    D.shots.push(s); SFX.thunder();
  }
  // Atchoum : la tête plonge et la baguette part de travers (nous) ; il rate son tracé et lâche son bouclier (lui).
  function sneeze(isP) {
    var f = D.f;
    SFX.sneeze();
    if (isP) { D.nod = 1; D.kick = { x: rand(-1, 1) * W * 0.2, y: H * rand(0.12, 0.2), t: 0.5 }; D.shake = Math.max(D.shake, 7); text(W / 2, H * 0.42, 'ATCHOUM !', '#ffe08a', 1.5); return; }
    f.sneezeAnim = 0.5; f.shield = 0; text(F.chest.x, F.chest.y - F.h * 0.95, 'Atchoum !', '#ffe08a', 1.1);
    if (f.state === 'beam') stopBeam(false); else abortFoeCast();
    f.timer = Math.max(f.timer, 0.5);
  }
  function updateExtras(dt) {
    var p = D.p, f = D.f, i, h, left, on = D.phase === 'fight' || D.phase === 'prep';
    for (i = D.held.length - 1; i >= 0; i--) { // sorts en réserve : ils clignotent avant de s'éteindre
      h = D.held[i]; h.t += dt; left = HOLD_LIFE - h.t;
      if (left < HOLD_BLINK) h.ph += dt * lerp(6, 24, 1 - left / HOLD_BLINK);
      if (left <= 0) { var q = heldPos(h); D.held.splice(i, 1); burst(q.x, q.y, '#8a93a8', 12, 120); SFX.fizzle(); text(q.x, q.y - heldR() * 2, 'Éteint…', '#c9cfdd', 0.85); }
    }
    for (i = D.foeHeld.length - 1; i >= 0; i--) { // les siens partent tout seuls, un peu plus tard
      h = D.foeHeld[i]; h.t += dt;
      if (h.t >= h.life && on && f.hp > 0 && f.frozen <= 0 && f.disarmed <= 0 && !(f.asleep > 0)) { var fq = foeHeldPos(i); D.foeHeld.splice(i, 1); fireFoe(h.spell, fq); SFX.cast(h.spell.id, 0.55); }
    }
    for (i = D.pending.length - 1; i >= 0; i--) { var pe = D.pending[i]; if ((pe.t -= dt) > 0) continue; D.pending.splice(i, 1); if (!on) continue; if (pe.volley) { if (pe.isP) firePlayer(pe.spell, pe.S, pe.mul, pe.quality, pe.practice); else fireFoe(pe.spell, { x: F.gc.x, y: F.gc.y }); } else skyStrike(pe); }
    ['p', 'f'].forEach(function (k) { // animaux magiques : ils tirent tout seuls, puis s'en vont
      var al = D.allies[k], isP = k === 'p'; if (!al) return;
      al.t -= dt; al.next -= dt; if (al.pop > 0) al.pop -= dt;
      if (al.t <= 0 || !on) { var q2 = allyPos(isP); puff(q2.x, q2.y); D.allies[k] = null; return; }
      if (al.next <= 0 && f.hp > 0 && p.hp > 0) { al.next = al.a.every; al.pop = 0.25; allyFire(isP, al); }
    });
    if (D.allyBar && !(p.conjure > 0)) { showAllies(false); text(W / 2, H * 0.56, 'Conjura s’éteint : aucun animal tracé', '#c9cfdd', 0.9); }
    [[p, true], [f, false]].forEach(function (e) { var o = e[0]; if (o.sneezing > 0 && o.hp > 0 && on && (o.sneezeT -= dt) <= 0) { o.sneezeT = 1.5; sneeze(e[1]); } });
    if (f.sneezeAnim > 0) f.sneezeAnim -= dt;
    if (D.nod > 0) D.nod = Math.max(0, D.nod - dt / 0.7);
    if (D.kick && (D.kick.t -= dt) <= 0) D.kick = null;
    if (f.whirl > 0 && f.hp > 0 && !D.target && Math.random() < 0.7) part(F.x + rand(-26, 26) * F.u, F.fy - rand(5, 105) * F.u, rand(-90, 90), rand(-60, 20), rand(0.3, 0.7), '#9fd8ff', rand(1.5, 3.5), 200);
    var bl = Math.round(D.fx.blur * 14) / 2; // Myopia : toute la scène devient floue (le reste de l'écran reste net)
    if (bl !== D.blurPx) { D.blurPx = bl; cv.style.filter = bl ? 'blur(' + bl + 'px)' : ''; }
  }
  // Tourbillon d'eau de Vortex : des anneaux d'eau qui tournent, de plus en plus larges vers le haut.
  function drawWhirl(cx, fy, h, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
    for (var i = 0; i < 9; i++) {
      var k = i / 8, y = fy - h * (0.04 + 1.06 * k), rx = h * (0.2 + 0.34 * k) * (1 + 0.08 * Math.sin(time * 5 + i)), ph = time * (8 - 3 * k) + i * 1.3;
      ctx.strokeStyle = i % 2 ? 'rgba(190,232,255,0.9)' : 'rgba(63,168,255,0.85)'; ctx.lineWidth = h * (0.035 + 0.022 * k);
      ctx.beginPath(); ctx.ellipse(cx + Math.sin(time * 3 + i) * h * 0.03, y, rx, rx * 0.26, 0, ph, ph + Math.PI * 1.35); ctx.stroke();
    }
    ctx.restore();
  }
  function drawOrb(x, y, r, sp, alpha, ring) { // une attaque qui attend son heure
    A.glowDot(ctx, x, y, r * 2.6, sp.color, 0.9 * alpha);
    ctx.save(); ctx.globalAlpha = alpha; ctx.font = Math.round(r * 1.5) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(sp.icon || '✨', x, y + r * 0.08);
    if (ring) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.arc(x, y, r * 1.55, time * 2, time * 2 + TAU); ctx.stroke(); }
    ctx.restore();
  }
  function drawAlly(al, q, size) {
    var k = al.t < 1.5 ? 0.35 + 0.65 * Math.abs(Math.sin(time * 9)) : 1, s = size * (1 + (al.pop > 0 ? al.pop * 1.2 : 0));
    A.glowDot(ctx, q.x, q.y, s * 1.5, al.a.color, 0.55 * k);
    ctx.save(); ctx.globalAlpha = k; ctx.font = Math.round(s) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(al.a.icon, q.x, q.y); ctx.restore();
  }
  // Autour de l'adversaire : son tourbillon, son animal, ses sorts en réserve.
  function drawFoeExtras() {
    var f = D.f, u = F.u, i;
    if (f.smoke > 0) for (i = 0; i < 9; i++) { var sa = time * 0.5 + i * 0.7; fog(F.x + Math.cos(sa) * F.h * 0.45 + (i - 4) * F.h * 0.12, F.fy - F.h * (0.15 + (i % 3) * 0.3) + Math.sin(sa * 1.3) * F.h * 0.05, F.h * 0.6, F.h * 0.4, 0.7 * Math.min(1, f.smoke / 0.5)); } // Fumus : il se cache dans la fumée
    if (f.blizzard > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (i = 0; i < 40; i++) { var bx = F.x + ((i * 0.37 + time * (0.25 + (i % 4) * 0.1)) % 1 - 0.5) * F.h * 1.6, by = F.fy - F.h * 1.3 + ((i * 0.61 + time * (0.6 + (i % 3) * 0.2)) % 1) * F.h * 1.5; ctx.fillStyle = 'rgba(235,248,255,' + (0.5 + 0.4 * Math.sin(i)) + ')'; ctx.beginPath(); ctx.arc(bx, by, (1 + (i % 3)) * u * 0.9, 0, TAU); ctx.fill(); } ctx.restore(); fog(F.x, F.fy - F.h * 0.5, F.h * 1.3, F.h * 1.1, 0.35); }
    if (f.quake && f.quake.orb && f.hp > 0) drawStormOrb(F.x + F.h * 0.42, F.fy - F.h * 0.9, 9 * u, F.chest.x, F.chest.y); // Orbis : la sphère d'orage le foudroie
    if ((f.amp > 0 || f.fortis > 0) && f.state !== 'cast' && f.disarmed <= 0 && f.hp > 0) A.flame(ctx, F.x - 31 * u, F.fy - 70 * u, 9 * u, time, 2.1); // Amplio, Fortis : sa baguette flambe
    if (f.whirl > 0 && f.hp > 0 && !D.target) drawWhirl(F.x, F.fy, F.h, Math.min(1, f.whirl / 0.4));
    if (D.allies.f) drawAlly(D.allies.f, allyPos(false), 30 * u);
    D.foeHeld.forEach(function (h, i) { var q = foeHeldPos(i); drawOrb(q.x, q.y, 9 * u, h.spell, 0.6 + 0.4 * Math.sin(time * 6 + i), false); });
  }
  // Autour de nous : le tourbillon qui nous enferme, notre animal, nos sorts en réserve (anneau pointillé : on peut cliquer dessus).
  function drawPlayerExtras() {
    var p = D.p, i;
    if (p.whirl > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, p.whirl / 0.4) * 0.7; ctx.lineCap = 'round';
      for (i = 0; i < 7; i++) { var ph = time * (6 - i * 0.4) + i * 1.1; ctx.strokeStyle = i % 2 ? 'rgba(190,232,255,0.8)' : 'rgba(63,168,255,0.8)'; ctx.lineWidth = H * 0.035; ctx.beginPath(); ctx.ellipse(W / 2, H * (0.08 + 0.15 * i), W * (0.46 + 0.03 * Math.sin(time * 3 + i)), H * 0.07, 0, ph, ph + Math.PI * 1.3); ctx.stroke(); }
      ctx.restore();
    }
    if (D.allies.p) drawAlly(D.allies.p, allyPos(true), H * 0.1);
    if (D.fam && D.phase !== 'end') { // notre familier : il flotte à gauche, et sursaute quand il agit
      var fq = famPos(), fs = H * 0.075 * (1 + (D.famPop > 0 ? D.famPop : 0));
      A.glowDot(ctx, fq.x, fq.y, fs * 1.3, D.fam.color, 0.4 + 0.1 * Math.sin(time * 3));
      ctx.save(); ctx.font = Math.round(fs) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(D.fam.icon, fq.x, fq.y); ctx.restore();
    }
    D.held.forEach(function (h) { var q = heldPos(h); drawOrb(q.x, q.y, heldR(), h.spell, HOLD_LIFE - h.t < HOLD_BLINK ? 0.25 + 0.75 * (0.5 + 0.5 * Math.cos(h.ph)) : 1, true); });
  }
  // Orbis : une sphère d'orage qui crépite près de sa cible, et lui envoie un arc à chaque secousse
  function drawStormOrb(x, y, r, tx, ty) {
    var i; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    A.glowDot(ctx, x, y, r * 2.6, '#ffe14a', 0.9); ctx.fillStyle = '#fff9d0'; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff27a'; ctx.lineWidth = Math.max(1, r * 0.18); ctx.lineCap = 'round';
    for (i = 0; i < 4; i++) { var a = time * 7 + i * 1.6, x1 = x + Math.cos(a) * r * 1.3, y1 = y + Math.sin(a) * r * 1.3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x1 + rand(-r, r) * 0.5, y1 + rand(-r, r) * 0.5); ctx.lineTo(x1 * 2 - x + rand(-r, r), y1 * 2 - y + rand(-r, r)); ctx.stroke(); }
    if (Math.random() < 0.12) bolt(x, y, tx + rand(-r, r) * 2, ty + rand(-r, r) * 2, 0.8, Math.max(1.5, r * 0.25));
    ctx.restore();
  }
  // Projectiles pas comme les autres : l'éclair de Foudrus, le mur de feu de Flammurus, le tourbillon de Vortex.
  function drawSkyBolt(s, pos) {
    if (s.spell.meteors) { // Meteorus : un rocher qui tombe en flammes, avec sa traînée
      var k = s.t, mr = s.from === 'player' ? Math.max(5, 7 * F.u) : H * 0.035, mx = lerp(pos.x + (s.from === 'player' ? -W * 0.12 : W * 0.15), pos.x, k), my = lerp(-mr * 2, pos.y, k * k), i;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (i = 1; i < 7; i++) { var tk = Math.max(0, k - i * 0.05), tx = lerp(pos.x + (s.from === 'player' ? -W * 0.12 : W * 0.15), pos.x, tk), ty = lerp(-mr * 2, pos.y, tk * tk); A.glowDot(ctx, tx, ty, mr * (1.6 - i * 0.2), i % 2 ? '#ff9a3a' : '#ffd36b', 0.5 - i * 0.06); }
      ctx.restore();
      A.flame(ctx, mx, my - mr * 0.2, mr * 1.6, time, s.sx * 0.01);
      ctx.save(); ctx.translate(mx, my); ctx.rotate(time * 5 + s.sx); ctx.fillStyle = '#5a4030'; ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = Math.max(1, mr * 0.15);
      ctx.beginPath(); [[-1, -0.5], [-0.3, -1.1], [0.8, -0.8], [1.15, 0.1], [0.5, 1], [-0.6, 0.9]].forEach(function (q, n) { if (n) ctx.lineTo(q[0] * mr, q[1] * mr); else ctx.moveTo(q[0] * mr, q[1] * mr); }); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff6a2a'; ctx.beginPath(); ctx.arc(-mr * 0.2, -mr * 0.2, mr * 0.35, 0, TAU); ctx.fill(); ctx.restore();
      return;
    }
    var x0 = pos.x + (s.from === 'player' ? s.dx * 0.5 : (s.sx - s.tx) * 0.6), w = s.from === 'player' ? Math.max(2, 2 * F.u) : 5;
    bolt(x0, -10, pos.x, pos.y, 1, w); bolt(x0 + rand(-20, 20), -10, pos.x, pos.y, 0.7, w * 0.6);
    A.glowDot(ctx, pos.x, pos.y, (s.from === 'player' ? 16 * F.u : H * 0.07), '#fff27a', 0.9);
  }
  function drawFireWall(s) {
    var k = s.t, n = 11, x, y, w, r, i;
    if (s.from === 'player') { w = lerp(W * 0.85, F.h * 1.5, k); y = lerp(H * 0.9, F.fy, k); r = lerp(H * 0.1, F.h * 0.12, k); x = lerp(W / 2, F.chest.x, k); }
    else { k *= k; w = lerp(F.h * 1.4, W * 1.15, k); y = lerp(F.fy, H * 1.0, k); r = lerp(F.h * 0.1, H * 0.22, k); x = lerp(F.x, W / 2, k); }
    for (i = 0; i < n; i++) A.flame(ctx, x + (i / (n - 1) - 0.5) * w + Math.sin(time * 7 + i * 1.9) * r * 0.25, y, r * (0.8 + 0.3 * Math.sin(time * 9 + i * 2.3)), time, i * 1.3);
    if (s.from === 'foe') { ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 10); ctx.font = 'bold ' + Math.round(H * 0.03) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd9a0'; ctx.fillText('Mur de feu : le bouclier ne l’arrête pas !', W / 2, H * 0.3); ctx.restore(); }
  }
  function drawVortexShot(pos) {
    var r = pos.r * 1.7, i;
    A.glowDot(ctx, pos.x, pos.y, r * 2.4, '#3fa8ff', 0.9);
    ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(time * 11); ctx.strokeStyle = '#e8f6ff'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, r * 0.2);
    for (i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.arc(0, 0, r * (0.45 + i * 0.28), 0, Math.PI * 1.1); ctx.stroke(); }
    ctx.restore();
  }

  // ───────────────────────── Parade ─────────────────────────
  // Clic = bouclier pendant SHIELD_T. Avec le talent Garde, garder le clic enfoncé le prolonge de holdMax secondes.
  // Baguette de Josué : pas besoin de cliquer. Si la baguette traverse vite l'anneau d'un sort ennemi pendant qu'il est doré, le sort est dévié
  // dans la direction du revers. Pas pendant qu'on trace un sort (Espace) : sinon tout tracé parerait par hasard.
  function swipeParry(s) {
    var p = D.p, sp = s.spell, sw = D.swipe;
    if (!(D.wd.swipe || p.swipe > 0) || !sw || D.trail || !canShield() || s.miss || sp.unparry || (p.copies && s.slot !== 1)) return false;
    if ((1 - s.t) * s.dur > SHIELD_T || sw.sp < H * SWIPE_V) return false;
    var off = viewOff(), cx = s.tx + off.x, cy = s.ty + off.y, dx = sw.x - sw.x0, dy = sw.y - sw.y0, l2 = dx * dx + dy * dy || 1;
    var k = clamp(((cx - sw.x0) * dx + (cy - sw.y0) * dy) / l2, 0, 1); // point du trajet de la baguette le plus proche du centre de l'anneau
    if (Math.hypot(sw.x0 + dx * k - cx, sw.y0 + dy * k - cy) > parryR() * 0.6) return false;
    var d = Math.hypot(sw.vx, sw.vy) || 1, ux = sw.vx / d, uy = sw.vy / d;
    if (s.fake) { burst(cx, cy, '#ffc8f0', 14, 160); text(cx, cy - 24, 'Illusion !', '#ffc8f0', 0.9); SFX.pop(); return true; }
    steady(p, s); D.practiced.parry = true; if (!s.practice) D.stats.blocks++;
    burst(cx, cy, '#ffe9a0', 20, 280); SFX.block(); SFX.whoosh(); text(cx, cy - parryR(), 'Dévié !', '#ffe9a0', 1.1);
    (D.flung = D.flung || []).push({ spell: sp, x: s.tx, y: s.ty, vx: ux * H * 2.2, vy: uy * H * 2.2, t: 0, dur: 0.6, r: shotPos(s).r });
    if (sp.pierce && !s.practice) { hurt(p, true, Math.round(s.dmg * sp.pierce)); p.hurt = 0.4; text(W / 2, H * 0.56, 'L’ombre traverse quand même !', sp.color, 1); if (p.hp <= 0) finish(false); }
    if (D.klass && cb.onPlayerHit) cb.onPlayerHit({ spell: sp, outcome: 'parry', antiIce: p.antiIce > 0, grip: p.grip > 0 });
    return true;
  }
  function parryR() { return H * 0.13 * (D ? D.guardR * (D.p.bigR > 0 ? BIG_R : 1) : 1); }
  function canShield() { var p = D.p; return p.disarmed <= 0 && p.frozen <= 0 && p.noShield <= 0 && !D.noParry && !D.beams.p; }
  function parry() {
    var p = D.p;
    if (p.disarmed > 0 || D.noParry || D.beams.p) return;
    if (p.frozen > 0) return nag('Tu es gelé !', '#a8f0ff');
    if (p.noShield > 0) return nag('Tes boucliers sont brisés !', '#ff8a6b');
    if (D.beams.f) { if (p.shieldT <= 0) SFX.shield(); p.shieldT = SHIELD_T; p.shieldAge = 1; return; } // contre un rayon : on martèle le clic ou on le garde enfoncé, sans temps de recharge
    if (p.shieldCd > 0) return;
    p.shieldT = SHIELD_T * (D.mod.shieldT || 1); p.shieldAge = 0; p.holdLeft = p.holdMax; p.shieldCd = p.shieldCdMax; SFX.shield();
  }

  // ───────────────────────── Adversaire ─────────────────────────
  function quakeK(q) { return q ? clamp((q.t - (q.delay - 1.4)) / 1.4, 0, 1) : 0; } // Tremor : les secousses montent juste avant les dégâts
  function foeFrame() {
    var an = D.scene && D.scene.anchor ? D.scene.anchor(W, H) : null, f = D.f;
    if (an) { F = { x: an.x, fy: an.fy, h: an.h, h0: an.h, u: an.h / 100 }; F.chest = { x: an.cx, y: an.cy }; F.gc = an.gc || { x: an.x, y: an.cy }; F.gs = 30 * F.u; return; } // gc : d'où partent les sorts du professeur // décor de la classe : la cible est le mannequin de l'image
    var hh = geo.foe.h * (f.ch.monster ? f.ch.size || 1 : DS.AGES[f.age || 'adult'].h), u = hh / 100; // un enfant ou un ado est plus petit ; un monstre a sa taille à lui
    var tg = D.target, walk = tg && tg.move ? Math.sin(D.time * TAU / tg.move.per) * tg.move.amp * W : 0; // un mannequin sur rails
    F = { x: geo.foe.x + walk + f.offX + Math.sin(f.swayT * 0.8) * W * 0.012 + (f.soaked > 0 ? Math.sin(f.swayT * 5) * W * 0.006 : 0) + (f.flash > 0 ? rand(-2, 2) * u : 0) + rand(-5, 5) * u * quakeK(f.quake), fy: geo.foe.y, h: hh, h0: geo.foe.h, u: u };
    F.chest = { x: F.x, y: F.fy - (tg && tg.kind === 'caisse' ? 24 : tg ? 66 : 58) * u };
    F.gc = { x: F.x - 35 * u, y: F.fy - 101 * u }; F.gs = 30 * u; // centre et taille du tracé de l'adversaire
  }
  function foeGlyphPts(upTo) {
    var f = D.f, n = Math.max(2, Math.round(f.glyph.length * upTo)), out = [];
    for (var i = 0; i < n; i++) out.push({ x: F.gc.x + f.glyph[i].x * F.gs, y: F.gc.y + f.glyph[i].y * F.gs });
    return out;
  }
  function abortFoeCast() {
    var f = D.f;
    if (f.state === 'cast' && !f.ch.monster) D.ghosts.push({ pts: foeGlyphPts(f.castT / f.castDur), color: '#8a93a8', t: 0, dur: 0.5, mode: 'fail' });
    if (f.state === 'cast' || f.state === 'guard') { f.state = 'idle'; f.guard = null; f.timer = Math.max(f.timer, rand(0.4, 0.9)); }
  }
  // Ce que l'adversaire choisit de lancer. Les sorts les plus vicieux n'arrivent qu'avec le niveau ; il se soigne et se protège selon ce qui lui arrive.
  // kind : 'ward' (protections et renforts du début de duel), 'self' (protection ou renfort), 'effet' (maléfice), 'big' (attaque autre que Scintilla) ; sans kind : tout.
  function pickFoeSpell(kind) {
    if (D.phase === 'prep') { // échauffement : étincelles inoffensives ; au cours de protection, aussi de quoi essayer Calor et Tenax
      return D.klass && D.klass.cat === 'protection' ? DS.byId(DS.SPELLS, pickOne(['scintilla', 'glacius', 'desarmo'])) : DS.SPELLS[0];
    }
    var p = D.p, f = D.f, L = D.level, has = function (id) { return D.all.some(function (s) { return s.id === id; }); };
    var free = !hexed(p) && p.resist <= 0 && !D.wall; // inutile de nous lancer un maléfice si on en subit déjà un, si on y résiste, ou derrière un mur
    var low = f.hp / f.maxHp, sick = hexed(f) || f.burn > 0 || f.poison > 0, heal = f.healed < D.ai.heals, sh = f.noShield <= 0, wall = !!D.wall;
    var mon = !!f.ch.spells, at = function (lv, w) { return L >= lv || mon ? w : 0; }; // un monstre connaît ses sorts quel que soit son niveau
    var w = {
      scintilla: 3, fulgur: 2, ignis: 2, sagitta: 1.5, terra: wall ? 3 : 1.5,
      vespera: at(2, 1.2), toxicus: at(2, p.poison > 0 ? 0 : p.antiPoison > 0 ? 0.2 : 1), tonnero: at(3, p.copies ? 4 : 1.4), tremor: at(3, p.quake ? 0 : 1), tornado: at(3, p.mist > 0 ? 3 : 0.9), radius: at(5, 0.9), infernus: at(7, 0.7),
      glacius: free ? (p.antiIce > 0 ? 0.3 : 1.2) : 0, lentus: free ? 1.2 : 0, desarmo: at(2, free ? (p.grip > 0 ? 0.3 : 1) : 0), aqua: at(2, free ? 1.3 : 0),
      tenebra: at(3, free ? 1.1 : 0), somnus: at(3, free ? 1 : 0), fractura: at(3, free ? 0.8 : 0), lumina: at(3, free ? 0.9 : 0), silencio: at(3, free ? 0.8 : 0),
      vitus: at(4, free ? 0.6 : 0), gravitas: at(4, free ? 0.7 : 0), inversium: at(4, free ? 0.7 : 0),
      siphon: at(3, !wall && p.mana > 20 ? 0.7 : 0), ritardo: at(4, !wall && !p.echo ? 0.6 : 0), murus: at(4, !wall && low < 0.6 ? 0.6 : 0),
      aegis: at(2, f.ward <= 0 && sh ? (f.quake ? 3 : 0.8) : 0), calor: at(3, has('glacius') && f.antiIce <= 0 ? 0.4 : 0), tenax: at(3, has('desarmo') && f.grip <= 0 ? 0.4 : 0),
      absorbo: at(4, f.absorb <= 0 && sh ? 0.5 : 0), vapor: at(4, f.mist <= 0 ? 0.5 : 0), copius: at(5, f.copies ? 0 : 0.7), puritas: at(5, sick ? 1.5 : 0),
      cura: at(2, heal && low < 0.7 ? 1 : 0), sana: at(5, heal && low < 0.5 ? 1.2 : 0), antidotum: at(3, f.poison > 0 ? 2 : 0), amplio: at(4, f.amp <= 0 ? 0.5 : 0),
      foudrus: at(3, 1), flammurus: at(6, p.copies ? 4 : 0.7), vortex: at(7, p.whirl > 0 ? 0 : 0.6), atchoum: at(2, free ? 1 : 0), myopia: at(3, free ? 0.9 : 0),
      stabilis: at(4, f.focus > 0 ? 0 : 0.5), preparus: at(5, f.prep > 0 || D.foeHeld.length ? 0 : 0.5), conjura: at(6, D.allies.f ? 0 : 0.6),
      fortis: at(5, f.fortis <= 0 ? 0.6 : 0), speculum: at(5, f.mirror <= 0 ? 0.6 : 0), vigor: at(5, heal && low < 0.6 && f.regen <= 0 ? 0.8 : 0), bastion: at(5, f.bastion <= 0 ? 0.6 : 0)
    };
    for (var tid in w) w[tid] *= D.ai.taste[tid] === undefined ? 1 : D.ai.taste[tid];
    if (kind === 'ward' && !mon) w.aegis = Math.max(w.aegis, f.ward <= 0 ? 1 : 0); // au début du duel, même un débutant sait se protéger
    var list = DS.SPELLS.filter(function (s) {
      if (f.silenced > 0 && s.cat === 'attaque') return false;
      return kind === 'ward' ? wardOk(s) : kind === 'self' ? s.cat === 'protection' || s.cat === 'renfort' : kind === 'effet' ? s.cat === 'effet' : kind === 'big' ? s.cat === 'attaque' && s.id !== 'scintilla' : true;
    }), tot = 0, i, r;
    for (i = 0; i < list.length; i++) tot += w[list[i].id] || 0;
    if (tot <= 0) return kind ? null : DS.byId(DS.SPELLS, 'aegis');
    r = Math.random() * tot;
    for (i = 0; i < list.length; i++) { r -= w[list[i].id] || 0; if (r <= 0) return list[i]; }
    return list[0];
  }
  function foeSpeed() { var f = D.f, v = Math.min(f.slowed > 0 ? f.slowF : 1, f.asleep > 0 ? f.sleepF : 1, f.heavy > 0 ? 0.7 : 1); return f.fast > 0 ? v * 1.6 : v; }
  // Aveuglé, trempé, ébloui, emballé… il vise mal : chance que son sort parte à côté.
  function foeMiss() {
    var f = D.f, m = 0;
    if (f.blind > 0) m = Math.max(m, f.blindMiss); if (f.soaked > 0) m = Math.max(m, f.soakMiss); if (f.dazzled > 0) m = Math.max(m, 0.85 * f.dazzled / f.hexMax);
    if (f.fast > 0) m = Math.max(m, 0.25); if (f.heavy > 0) m = Math.max(m, 0.3); if (f.inverted > 0) m = Math.max(m, 0.3);
    if (f.whirl > 0) m = Math.max(m, f.soakMiss || 0.4); if (f.blurred > 0) m = Math.max(m, 0.45); if (f.sneezing > 0) m = Math.max(m, 0.35);
    return m;
  }
  // Emballé (Vitus), il rate les formes compliquées ; à l'envers (Inversium), presque une fois sur deux.
  function foeBotch(sp) { var f = D.f; return f.fast > 0 ? clamp((TRACE_TIME[sp.glyph] - 0.6) * 0.9, 0, 0.8) : f.inverted > 0 ? 0.45 : 0; }
  // Ce qui le gêne pour bloquer (1 = rien).
  function blockK() {
    var f = D.f, c = 1;
    if (f.slowed > 0) c *= 0.5; if (f.blind > 0) c *= 0.25; if (f.soaked > 0) c *= 0.6; if (f.dazzled > 0) c *= 0.3; if (f.fast > 0) c *= 0.6; if (f.heavy > 0) c *= 0.7; if (f.inverted > 0) c *= 0.5;
    if (f.whirl > 0 && !(f.soaked > 0)) c *= 0.6; if (f.blurred > 0) c *= 0.5;
    return c;
  }
  function foeCanShield() { var f = D.f; return f.hp > 0 && f.disarmed <= 0 && f.frozen <= 0 && f.noShield <= 0 && !(f.asleep > 0 && eyeOpen(f.sleepT) < 0.4); }
  // Paupières de quelqu'un qui s'endort : elles tombent d'un coup, restent fermées, se rouvrent lentement… (0 = fermées, 1 = ouvertes)
  function eyeOpen(t) {
    var ph = (t % 2.6) / 2.6, e;
    if (ph < 0.1) return 1 - ph / 0.1;
    if (ph < 0.3) return 0;
    if (ph < 0.82) { e = (ph - 0.3) / 0.52; return e * e * (3 - 2 * e); }
    return 1;
  }
  function foeAI(dt) {
    var f = D.f, ai = D.ai, prep = D.phase === 'prep';
    if (f.hp <= 0 || f.disarmed > 0 || f.frozen > 0 || f.state === 'guard' || f.state === 'beam') return;
    var slow = foeSpeed();
    if (f.state === 'idle') {
      if (D.klass && D.klass.school) return; // le professeur ne lance un sort que lorsque la leçon le demande (school.foeCast)
      if (prep && !D.klass) return;          // avant « Commencer le duel », il attend
      f.timer -= dt * slow;
      if (f.timer <= 0 && f.shield <= 0) {
        var nx = prep ? pickFoeSpell() : foeNext();
        if (!nx) { f.timer = 0.35; return; }
        f.spell = nx; f.glyph = G.template(f.spell.glyph, 40);
        if (f.invis > 0) { f.invis = 0; text(F.chest.x, F.chest.y - F.h * 0.8, 'Il réapparaît !', '#d8d8ff', 0.9); }
        f.state = 'cast'; f.castT = 0; f.castDur = TRACE_TIME[f.spell.glyph] * (prep ? 1.6 : ai.castMul * (f.combo.length ? 0.85 : 1)); SFX.foeCast();
        if (f.ch.monster) { f.castDur *= 0.8; text(F.chest.x, F.chest.y - F.h * 0.95, '« ' + f.spell.name.toUpperCase() + ' ! »', f.spell.color, 1.35); } // un monstre ne trace rien : il crie le nom de son sort, comme un Pokémon
      }
    } else {
      f.castT += dt * slow;
      if (f.castT >= f.castDur) {
        var sp = f.spell, bad = !D.klass && !f.ch.monster && Math.random() < foeBotch(sp);
        if (!f.ch.monster) D.ghosts.push({ pts: foeGlyphPts(1), color: bad ? '#8a93a8' : sp.color, t: 0, dur: bad ? 0.6 : 0.4, mode: bad ? 'fail' : 'ok' });
        f.state = 'idle'; f.poise = false;
        f.timer = (prep ? rand(3.5, 5) : D.wardT > 0 ? rand(0.3, 0.7) : f.combo.length ? ai.gap * rand(0.85, 1.15) : rand(ai.think[0], ai.think[1]) * 0.8) * packPace(); // au milieu d'un enchaînement, le sort suivant part tout de suite
        if (D.pack) { f.combo = []; packNextActive(); } // dans une horde, un autre monstre prend le relais
        if (!prep && !f.combo.length && !(D.wardT > 0) && f.mana < f.maxMana * 0.25) foeTire();
        if (bad) { text(F.chest.x, F.chest.y - F.h * 0.66, 'Il rate son tracé !', '#c9cfdd', 0.9); SFX.fizzle(); }
        else { fireFoe(sp); SFX.cast(sp.id, 0.55); }
        f.flightDur = 0;
      }
    }
  }
  // Enchaînement : parfois une protection ou un maléfice pour ouvrir, puis quelques sorts rapides (des étincelles, surtout), puis un gros coup.
  // Plus l'adversaire est fort, plus c'est long et serré. Chaque sort lui coûte de l'énergie : à sec, il doit souffler, et c'est à nous de jouer.
  function foeCombo() {
    var f = D.f, L = D.level, out = [], jabs = L >= 9 ? (Math.random() < 0.5 ? 4 : 3) : L >= 6 ? 3 : L >= 3 ? 2 : 1, quick = ['scintilla', 'scintilla', 'scintilla'], r = Math.random(), sp, i;
    var needy = f.hp < f.maxHp * 0.5 || hexed(f) || f.burn > 0 || f.poison > 0;
    if (L >= 4) quick.push('fulgur'); // presque toujours des étincelles : rapides, pas chères, et il en pleut
    if (f.silenced > 0) { sp = pickFoeSpell(); return sp && sp.cat !== 'attaque' ? [sp] : []; } // réduit au silence : pas d'attaque, il fait autre chose
    if (L >= 2 && r < (needy ? 0.7 : 0.22)) { sp = pickFoeSpell('self'); if (sp) out.push(sp); } // il se soigne ou se protège d'abord
    else if (L >= 2 && r < 0.5) { sp = pickFoeSpell('effet'); if (sp) out.push(sp); }          // ou un maléfice pour ouvrir
    for (i = 0; i < jabs; i++) out.push(DS.byId(DS.SPELLS, pickOne(quick)));
    sp = pickFoeSpell('big'); if (sp) out.push(sp);
    return out;
  }
  function foeTire() { var f = D.f; if (f.tired > 0) return; f.tired = 1; f.combo = []; text(F.chest.x, F.chest.y - F.h * 0.9, 'À bout d’énergie !', '#9fdcff', 1.1); SFX.empty(); }
  // Le prochain sort de l'adversaire (null : il attend). Il paie son énergie dès qu'il commence à tracer : l'interrompre la lui fait perdre.
  function foeNext() {
    var f = D.f, sc = DS.SPELLS[0], sp;
    if (D.wardT > 0) { // début du duel : une protection ou deux, pas plus (il garde son énergie pour attaquer)
      f.combo = []; if ((f.wardN || 0) >= (D.level >= 5 ? 2 : 1)) return null;
      sp = pickFoeSpell('ward'); if (!sp || f.mana < sp.mana) return null; f.wardN = (f.wardN || 0) + 1;
    }
    else {
      if (f.tired > 0) return null;
      if (!f.combo.length) f.combo = foeCombo();
      sp = f.combo.shift(); if (!sp) return null;
      if (f.silenced > 0 && sp.cat === 'attaque') { f.combo = []; return null; }
      if (f.mana < sp.mana) { // plus assez d'énergie : une dernière étincelle s'il peut, sinon il souffle
        if (sp.cat === 'attaque' && sp !== sc && f.mana >= sc.mana) { sp = sc; f.combo = []; } else { foeTire(); return null; }
      }
    }
    f.mana -= sp.mana;
    return sp;
  }
  function decideBlock(s) {
    var f = D.f, cp = f.copies; s.decided = true;
    if (D.target && D.target.riposte && !s.fake) { s.willBlock = true; f.shield = (1 - s.t) * s.dur + 0.45; SFX.block(); return; } // cours : la professeure lève son bouclier de maître, bien avant que le sort arrive
    if (s.practice || s.fake || !foeCanShield() || f.ward > 0 || f.mirror > 0 || f.state === 'beam' || f.state === 'guard') return; // bouclier impossible, ou déjà protégé
    if (s.spell.unparry) return;                           // Flammurus : aucun bouclier ne l'arrête
    if (D.p.smoke > 0) return;                              // Fumus : il ne voit pas nos gestes, il ne voit rien venir
    if (cp && s.slot !== cp.real && !s.spell.chain) return; // ce sort-là file vers une copie
    var c = D.ai.block * (BLOCK_K[s.spell.id] || (s.spell.cat === 'effet' ? 0.9 : 1)) * blockK(), casting = f.state === 'cast';
    if (s.reflected) c *= 0.7; if (s.quality === 'parfait') c *= 0.85; if (f.tired > 0) c *= 0.35; // à bout d'énergie, il se protège mal
    if (casting) { if (f.castT / f.castDur > 0.6 || f.focus > 0) return; c *= 0.7; } // trop avancé dans son tracé (ou concentré, avec Stabilis) : il le termine
    if (Math.random() < c) {
      var left = (1 - s.t) * s.dur;
      if (casting) { D.ghosts.push({ pts: foeGlyphPts(f.castT / f.castDur), color: '#8a93a8', t: 0, dur: 0.5, mode: 'fail' }); f.state = 'idle'; f.timer = 0; } // il abandonne son tracé pour se protéger
      s.willBlock = true; f.shield = left + 0.35; f.timer = Math.max(f.timer, left + rand(0.3, 0.8));
    }
  }

  // ───────────────────────── Projectiles ─────────────────────────
  function copyShot(s, extra) { var o = {}, k; for (k in s) o[k] = s[k]; for (k in extra) o[k] = extra[k]; return o; }
  // Notre sort part de la baguette. mul : tout ce qui multiplie ses dégâts (baguette, qualité du tracé, Fortis, Amplio).
  function firePlayer(spell, S, mul, quality, practice, from) {
    var p = D.p, f = D.f;
    var s = { from: 'player', spell: spell, lv: S.lv, t: 0, dur: spell.flight / (D.wd.speed * p.speed * S.speed), sx: from ? from.x : wand.x, sy: from ? from.y : wand.y, mul: mul, dmg: Math.round(spell.dmg * mul * S.dmg), quality: quality, practice: practice, volley: 0, slot: D.pack ? packSlot() : f.copies ? aimSlot() : D.target && D.target.row ? rowSlot() : null };
    D.shots.push(s);
    if (p.copies) aliveSlots(p.copies).forEach(function (i) { if (i !== 1) D.shots.push(copyShot(s, { sx: wand.x + ghostDx(i), fake: true })); }); // nos doubles lancent le même sort, pour du vent
  }
  // Où le sort de l'adversaire va arriver sur notre écran. Si on a des doubles, il en vise un au hasard… ou nous.
  function aimAtPlayer(s) {
    var cp = D.p.copies;
    s.slot = cp ? pickOne(aliveSlots(cp)) : null;
    s.tx = cp ? W * 0.5 + ghostDx(s.slot) * 0.95 + rand(-0.05, 0.05) * W : rand(0.25, 0.75) * W; s.ty = rand(0.32, 0.66) * H;
    return s;
  }
  function fireFoe(sp, from) { // from : le sort part de là où il attendait (Preparus)
    var f = D.f, ai = D.ai, prep = D.phase === 'prep', k = prep ? 1 : atk(f, sp), cp = f.copies, c = F.chest;
    if (sp.self) { selfCast(f, false, sp, 1, ONE); text(c.x, c.y - F.h * 0.8, sp.name + ' !', sp.color, 0.9); return; }
    if (sp.beam) { text(c.x, c.y - F.h * 0.8, sp.name + ' !', sp.color, 0.9); return startBeam(false, sp, ONE, ai.dmg * k, prep); }
    if (!from && f.prep > 0 && sp.cat === 'attaque') { f.prep--; D.foeHeld.push({ spell: sp, t: 0, life: rand(1.6, 3.2) }); text(c.x, c.y - F.h * 0.8, 'Il garde ' + sp.name + ' en réserve…', sp.color, 0.9); return; }
    if (sp.sky) { for (var mk = 0; mk < (sp.meteors || 1); mk++) D.pending.push({ t: sp.sky + mk * 0.24, isP: false, spell: sp, mul: ai.dmg * k, practice: prep }); return; } // rien pour l'instant…
    if (sp.volley && !from) for (var vk = 1; vk < sp.volley; vk++) D.pending.push({ t: vk * 0.22, isP: false, volley: true, spell: sp, mul: ai.dmg * k, practice: prep });
    var miss = !D.klass && !sp.sweep && Math.random() < foeMiss(), side = Math.random() < 0.5 ? -1 : 1;
    var s = aimAtPlayer({ from: 'foe', spell: sp, lv: 1, t: 0, dur: f.flightDur || sp.flight * 1.7 / (prep ? 0.6 : ai.speed), sx: from ? from.x : F.gc.x, sy: from ? from.y : F.gc.y, miss: miss, mul: ai.dmg * k, dmg: Math.round(sp.dmg * ai.dmg * k), practice: prep, volley: 0 });
    if (miss) { s.tx = W * (0.5 + side * 0.6); s.ty = rand(0.12, 0.55) * H; }
    D.shots.push(s);
    if (cp) aliveSlots(cp).forEach(function (i) { if (i !== cp.real) D.shots.push(copyShot(s, { sx: F.gc.x + foeSlotDx(i), tx: rand(0.22, 0.78) * W, ty: rand(0.32, 0.66) * H, miss: false, slot: null, fake: true })); }); // ses copies lancent le même sort, sans effet
  }
  // Sort renvoyé vers l'adversaire (parade parfaite, miroir) ou vers nous (son miroir, ou son bouclier pendant un échange).
  function bounceToFoe(s, x, y) {
    var cp = D.f.copies;
    D.shots.push({ from: 'player', spell: s.spell, lv: 1, t: 0, dur: clamp(s.dur * 0.55, 0.35, 0.9), backDur: s.dur, sx: x, sy: y, mul: D.wd.power * 1.2, dmg: Math.round(s.spell.dmg * D.wd.power * 1.2), back: s.dmg, backMul: s.mul,
      reflected: true, quality: 'bien', practice: s.practice, volley: (s.volley || 0) + 1, slot: cp ? pickOne(aliveSlots(cp)) : null });
  }
  function bounceToPlayer(s, x, y) {
    D.shots.push(aimAtPlayer({ from: 'foe', spell: s.spell, lv: 1, t: 0, dur: Math.max(0.6, (s.backDur || s.spell.flight * 1.7 / D.ai.speed) * 0.85), sx: x, sy: y, mul: s.backMul || D.ai.dmg,
      dmg: s.back != null ? s.back : Math.round(s.spell.dmg * D.ai.dmg), practice: s.practice, volley: (s.volley || 0) + 1 }));
  }
  function shotPos(s) {
    var z, u;
    if (s.sky) { // l'éclair de Foudrus tombe tout droit du ciel
      var tx = s.from === 'player' ? F.chest.x + foeSlotDx(s.slot) : s.tx, ty = s.from === 'player' ? F.chest.y : s.ty;
      return { x: s.from === 'player' ? tx + s.dx * (1 - s.t) : lerp(s.sx, tx, s.t), y: lerp(s.sy, ty, s.t), r: H * 0.02 };
    }
    if (s.from === 'player') {
      z = 1 + (Z - 1) * s.t; u = (1 - 1 / z) / (1 - 1 / Z);
      return { x: lerp(s.sx, F.chest.x + foeSlotDx(s.slot), u), y: lerp(s.sy, F.chest.y, u) - Math.sin(Math.PI * u) * H * 0.035, r: H * 0.055 / z };
    }
    // sort qui arrive : perspective adoucie, pour qu'on le voie venir au lieu de surgir à la dernière seconde
    z = Z - (Z - 1) * s.t; u = 0.5 * s.t + 0.5 * (1 / z - 1 / Z) / (1 - 1 / Z);
    return { x: lerp(s.sx, s.tx, u), y: lerp(s.sy, s.ty, u), r: H * 0.085 / z };
  }

  // Le sort (ou une salve de rayon : s.tick) touche vraiment le sorcier o, en (x, y) à l'écran. Miroir, Absorbo, Aegis et immunités passent d'abord.
  // Retourne ce qui s'est passé : 'mirror', 'absorb', 'ward', 'antiIce', 'grip', 'antiPoison' ou 'hit'.
  function resolve(o, isP, s, x, y) {
    var sp = s.spell, S = DS.spellMul(s.lv), live = !s.practice, show = live || !!D.klass, p = D.p, f = D.f, other = isP ? f : p; // à l'échauffement, rien ne se passe ; en cours, on voit l'effet du sort (sans dégâts)
    var note = function (a, b, color) { text(isP ? W / 2 : F.chest.x, isP ? H * 0.56 : F.chest.y - F.h * 0.66, isP ? b : a, color || sp.color, isP ? 1 : 0.9); };
    var calm = steady(o, s); // Stabilis : ce sort-là ne l'interrompra pas
    if (show && o.mirror > 0) { // Speculum : retour à l'envoyeur
      o.mirror = 0; SFX.perfect(); burst(x, y, '#e8eef8', 26, 320); note('Son miroir le renvoie !', 'Ton miroir le renvoie !', '#e8eef8');
      if (s.tick) { if (live) { hurt(other, !isP, s.dmg); if (other.hp <= 0) finish(isP); } }
      else if (isP) bounceToFoe(s, x, y); else bounceToPlayer(s, x, y);
      return 'mirror';
    }
    if (show && o.absorb > 0 && sp.cat === 'attaque') { // Absorbo : les dégâts deviennent de l'énergie
      var gain = s.dmg || Math.round((sp.quake ? sp.quake.dmg * sp.quake.ticks : 6) * (s.mul || 1));
      o.absorb = 0; SFX.block(); burst(x, y, '#7fb0ff', 26, 300);
      if (isP) { if (live) p.mana = Math.min(p.maxMana, p.mana + gain); note('', 'Absorbo : +' + gain + ' d’énergie !', '#7fb0ff'); } else { f.timer = Math.max(0.2, f.timer - gain / 12); note('Absorbé !', '', '#7fb0ff'); }
      return 'absorb';
    }
    if (o.ward > 0 && (isP || live)) { // Aegis absorbe le sort, puis disparaît
      o.ward = 0; SFX.block(); burst(x, y, '#ffd978', 28, isP ? 380 : 240); if (isP) D.flash = 0.1; note('Absorbé !', 'Absorbé par Aegis !', '#ffd978');
      return 'ward';
    }
    var imm = sp.freeze && o.antiIce > 0 ? 'antiIce' : sp.disarm && o.grip > 0 ? 'grip' : sp.poison && o.antiPoison > 0 ? 'antiPoison' : '';
    if (show && imm) { // Calor, Tenax ou Antidotum : ce sort-là ne fait rien
      var pc = BUFFS[imm]; SFX.block(); burst(x, y, pc, 24, isP ? 340 : 200);
      if (imm === 'antiIce') note('La glace fond !', 'Calor fait fondre la glace !', pc); else if (imm === 'grip') note('Il tient bon !', 'Tenax : tu tiens bon !', pc); else note('Le poison ne prend pas !', 'Antidotum : le poison ne prend pas !', pc);
      return imm;
    }
    if (isP) { SFX.hurt(); D.shake = Math.max(D.shake, s.tick ? 9 : 18); p.hurt = s.tick ? 0.35 : 0.6; burst(x, y, sp.color, s.tick ? 14 : 34, 420); }
    else { burst(x, y, sp.color, s.tick ? 12 : 28, 220); f.flash = s.tick ? 0.12 : 0.25; SFX.hit(); }
    impactFx(sp, isP, x, y);
    if (!show) { if (isP) text(x, y - 30, 'Touché ! (ça ne compte pas)', '#ffb0a0', 0.9); return 'hit'; }
    if (isP && s.practice && !s.tick) text(x, y - 30, s.riposte ? 'Touché !' : 'Touché ! (ça ne compte pas)', '#ffb0a0', s.riposte ? 1.2 : 0.9);
    if (!isP && D.klass && cb.onFoeHit) cb.onFoeHit({ spell: sp, dmg: s.dmg });
    var dmg = s.dmg;
    if (o.shieldHp > 0 && dmg > 0 && (live || D.klass)) { // Arcanum : le bouclier arcanique encaisse d'abord
      var took = Math.min(o.shieldHp, dmg); o.shieldHp -= took; dmg -= took; SFX.block(); burst(x, y, '#8fb8ff', 20, isP ? 300 : 200);
      note(o.shieldHp > 0 ? 'Son bouclier arcanique encaisse' : 'Son bouclier arcanique se brise !', o.shieldHp > 0 ? 'Arcanum encaisse ' + took : 'Arcanum se brise !', '#8fb8ff');
    }
    if (sp.bomb) { SFX.crash(0.9); D.shake = Math.max(D.shake, isP ? 24 : 10); for (var bk = 0; bk < 44; bk++) { var bka = rand(0, TAU), bkv = rand(100, 500); part(x, y, Math.cos(bka) * bkv, Math.sin(bka) * bkv, rand(0.4, 1), bk % 3 ? sp.color : '#ffe9a0', rand(2, 6), 300); } note('BOUM !', 'BOUM !', '#ffe9a0'); }
    if (live) { hurt(o, isP, dmg); if (!isP && !s.tick) D.stats.hits++; }
    if (D.mod.leech && live && dmg > 0 && !sp.leech) { var vb = Math.round(dmg * D.mod.leech); if (vb) { other.hp = Math.min(other.maxHp, other.hp + vb); note('+' + vb + ' de vie volée', 'Il te vole ' + vb + ' de vie', '#c04a8a'); } } // nuit des vampires
    if (sp.leech && live && dmg > 0) { var back = Math.round(dmg * sp.leech * (isP ? 1 : S.pow)); other.hp = Math.min(other.maxHp, other.hp + back); note('+' + back + ' de vie volée !', 'Il te vole ' + back + ' de vie !', '#c04a8a'); }
    if (sp.blizzard) { o.blizzard = sp.blizzard.dur * S.dur; o.blizzardDps = sp.blizzard.dps * (isP ? 0.8 : S.pow); SFX.freeze(); note('Pris dans le blizzard !', 'BLIZZARD ! Tu n’y vois plus rien !', '#dff6ff'); }
    // Le niveau du sort allonge les effets (S.dur) et les rend plus forts (S.pow) ; l'adversaire lance toujours au niveau 1.
    if (sp.burn) { o.burn = sp.burn.dur * S.dur; o.burnDps = sp.burn.dps * (isP ? 0.7 : S.pow); }
    if (sp.poison) { o.poison = sp.poison.dur * S.dur; o.poisonDps = sp.poison.dps * (isP ? 0.8 : S.pow); note('Empoisonné !', 'Tu es empoisonné !'); }
    if (sp.whirl) { o.whirl = sp.whirl.dur * S.dur; o.whirlDps = sp.whirl.dps * (isP ? 0.8 : S.pow); if (!isP) f.soakMiss = Math.max(f.soakMiss, 0.4); SFX.splash(); note('Pris dans le tourbillon !', 'Tu es pris dans le tourbillon !'); }
    if (sp.quake) o.quake = { t: 0, delay: sp.quake.delay, n: sp.quake.ticks, done: 0, dmg: Math.max(1, Math.round(sp.quake.dmg * (s.mul || 1) * S.dmg)), orb: !!sp.orb }; // rien pour l'instant… ça viendra (Orbis : la sphère d'orage reste là)
    if (sp.echo) { o.echo = { t: sp.echo, dmg: 0, k: S.pow }; note('Ritardo : ses blessures reviendront !', 'Ritardo : tes blessures reviendront dans 10 s !'); }
    if (sp.drain) { // Siphon : de l'énergie change de camp
      var n = Math.round(sp.drain * S.pow);
      if (isP) { n = Math.min(n, Math.floor(p.mana)); if (live) { p.mana -= n; f.mana = Math.min(f.maxMana, f.mana + n); } f.timer = Math.max(0.2, f.timer - 0.8); note('', 'Il te vole ' + n + ' d’énergie !'); }
      else { if (live) { p.mana = Math.min(p.maxMana, p.mana + n); f.mana = Math.max(0, f.mana - n); } f.timer += 1.2; note('+' + n + ' d’énergie pour toi !', ''); }
    }
    applyHex(o, isP, sp, S, note);
    if (sp.wind && o.mist > 0) { o.mist = 0; note('Sa brume s’envole !', 'Ta brume s’envole !', '#cfe8e0'); }
    if (!isP && !s.tick && !calm) { // un sort reçu en plein tracé le fait rater… mais pas deux fois de suite (sauf Tornado) ; un rayon s'arrête net
      if (f.state === 'cast' && (!f.poise || sp.wind)) { f.poise = true; abortFoeCast(); f.timer = f.combo.length ? rand(0.4, 0.7) : rand(0.8, 1.6); text(F.chest.x, F.chest.y - F.h * 0.9, 'Interrompu !', '#ffd27a', 0.9); }
      else if (f.state === 'beam') { stopBeam(false); text(F.chest.x, F.chest.y - F.h * 0.9, 'Interrompu !', '#ffd27a', 0.9); }
    }
    if (isP && sp.wind && !calm && (D.trail || D.beams.p)) { cancelTrace(); stopBeam(true); text(W / 2, H * 0.64, 'Ton sort est interrompu !', '#ffd27a', 1); }
    if (o.hp <= 0) finish(!isP);
    return 'hit';
  }
  // Petit spectacle à l'impact : flammes d'Ignis, éclairs de Tonnero.
  function impactFx(sp, isP, x, y) {
    var i, u = F.u;
    if (sp.burn) {
      SFX.cast('ignis', 0.5);
      if (isP) for (i = 0; i < 7; i++) D.fires.push({ x: rand(0.04, 0.96) * W, y: H * rand(0.86, 1.02), r: H * rand(0.05, 0.09), t: 0, dur: rand(0.7, 1.2), ph: rand(0, 9), screen: true });
      else for (i = 0; i < 5; i++) D.fires.push({ x: x + rand(-16, 16) * u, y: y + rand(-6, 40) * u, r: rand(4, 8) * u, t: 0, dur: rand(0.5, 0.9), ph: rand(0, 9) });
    }
    if (sp.chain || sp.sky) {
      SFX.thunder();
      if (isP) { D.flash = Math.max(D.flash, 0.22); for (i = 0; i < 5; i++) D.zaps.push({ x0: x, y0: y, x1: rand(0, W), y1: pickOne([0, H]), t: 0, dur: 0.4, screen: true }); }
      else { D.zaps.push({ x0: x + rand(-30, 30) * u, y0: 0, x1: x, y1: y - 30 * u, t: 0, dur: 0.4 }); for (i = 0; i < 3; i++) D.zaps.push({ x0: x + rand(-14, 14) * u, y0: y - rand(10, 40) * u, x1: x + rand(-18, 18) * u, y1: y + rand(10, 55) * u, t: 0, dur: 0.45 }); }
    }
  }
  // ───────────────────────── Cibles des cours ─────────────────────────
  // D.target = { kind: 'mannequin' | 'glace' | 'fer' | 'petard' | 'caisse' | 'baked' (déjà dans l'image du décor), icon }. Tout le reste est facultatif :
  //   auto + hp, maxHp : le duel tient lui-même sa barre de vie (dégâts, brûlure, poison, secousses) ; sinon c'est la leçon qui compte · noBar : barre cachée
  //   row: [vie, vie, vie] trois mannequins enchaînés — on vise celui qu'on a devant sa baguette, Tonnero les frappe tous
  //   guard : bouclier magique (seul un sort perçant passe, en partie) · spot : petit bouclier qui court après notre rayon
  //   mist : brume, un sort sur deux rate (le vent la chasse) · move: { amp, per } il se promène
  //   charge: { t, dur, loop } il prépare un seau d'eau ; poise : seul le vent l'interrompt · fuse: { t, dur } mèche allumée (un sort l'éteint)
  //   riposte: k → le bouclier de maître de la professeure : tout sort est bloqué et renvoyé vers nous, en k fois son temps de vol (info.returned)
  // Avant qu'un sort fasse effet, cb.onFoeTry(info) peut le refuser (false) ; ensuite cb.onFoeHit(info) dit ce qui s'est passé :
  // info = { spell, dmg, tick, slot, blocked, pierced, missed, cleared, interrupted, defused, n (mannequins renversés), left, down, quake }.
  function rowDx(i) { return (i - 1) * F.h * 0.6; }
  function rowSlot() {
    var t = D.target, off = viewOff(), best = 1, bd = Infinity;
    t.row.forEach(function (hp, i) { var d = Math.abs(wand.x - (F.chest.x + off.x + rowDx(i))); if (hp > 0 && d < bd) { bd = d; best = i; } });
    return best;
  }
  function tgtDamage(t, i, dmg) { // enlève de la vie ; true si le mannequin tombe
    if (t.row) { if (!(t.row[i] > 0)) return false; t.row[i] = Math.max(0, t.row[i] - dmg); if (t.row[i] > 0) return false; t.fallen = t.fallen || [0, 0, 0]; t.fallen[i] = 0.001; return true; }
    if (!t.auto || !(t.hp > 0)) return false;
    t.hp = Math.max(0, t.hp - dmg); if (t.hp > 0) return false;
    t.fall = 0.001; t.burn = t.poison = 0; t.quake = null; t.charge = null; return true;
  }
  function hitTarget(sp, dmg, x, y, tick, slot, mul) {
    var t = D.target, c = F.chest, u = F.u, info = { spell: sp, dmg: dmg || 0, tick: !!tick, slot: slot }, i;
    var say = function (str, color) { if (!tick || D.time - (t.saidT || -9) > 0.8) { t.saidT = D.time; text(x, c.y - F.h * 0.62, str, color, 0.9); } };
    var tell = function () { if (cb.onFoeHit) cb.onFoeHit(info); };
    if (sp.quake && !t.auto && !t.row) info.dmg = Math.round(sp.quake.dmg * sp.quake.ticks * (mul || 1)); // sans barre de vie tenue par le duel : toutes les secousses d'un coup
    if ((t.row && !(t.row[slot] > 0)) || (t.auto && !(t.hp > 0))) { burst(x, y, '#9aa3b5', 8, 90); return; } // déjà par terre
    if (t.riposte) { // le bouclier de maître de la professeure : le sort est bloqué net… et renvoyé, bien plus vite qu'il n'est venu (riposte : fraction de son temps de vol)
      burst(x, y, '#bfe6ff', 26, 300); SFX.perfect(); D.flash = Math.max(D.flash, 0.12); text(x, c.y - F.h * 0.62, 'Renvoyé !', '#ffe9a0', 1.1);
      D.shots.push(aimAtPlayer({ from: 'foe', spell: sp, lv: 1, t: 0, dur: Math.max(0.28, sp.flight * t.riposte), sx: x, sy: c.y, miss: false, mul: 1, dmg: sp.dmg, practice: true, volley: 1, riposte: true }));
      info.blocked = true; info.returned = true; return tell();
    }
    if (t.mist && !sp.wind && Math.random() < 0.5) { say('Raté dans la brume…', '#cfd8e6'); info.missed = true; info.dmg = 0; return tell(); }
    if (t.spot && tick && Math.hypot(x - t.spot.x, y - t.spot.y) < guardR() * 1.1) { burst(x, y, '#bfe6ff', 8, 120); SFX.block(); say('Bloqué', '#bfe6ff'); info.blocked = true; info.dmg = 0; return tell(); }
    if (t.guard && !sp.pierce) { burst(x, y, '#ffd978', 16, 200); SFX.block(); t.guardFlash = 0.3; say('Bloqué !', '#ffd978'); info.blocked = true; info.dmg = 0; return tell(); }
    if (cb.onFoeTry && cb.onFoeTry(info) === false) { burst(x, y, '#9aa3b5', 10, 120); SFX.block(); return; } // la leçon n'en veut pas : sans effet
    if (t.guard) { info.dmg = Math.round(info.dmg * sp.pierce); info.pierced = true; t.guardFlash = 0.3; }
    burst(x, y, sp.color, tick ? 12 : 28, 220); SFX.hit(); t.flash = tick ? 0.15 : 0.25; t.hits = (t.hits || 0) + 1;
    t.swingV = (t.swingV || 0) + (tick ? 0.5 : 1.4 + Math.min(2, info.dmg * 0.07)) * (Math.random() < 0.5 ? -1 : 1);
    if (!tick) impactFx(sp, false, x, y);
    if (sp.wind && t.mist) { t.mist = false; info.cleared = true; text(c.x, c.y - F.h * 0.85, 'La brume s’envole !', '#cfe8e0', 1); }
    if (t.charge) {
      if (t.charge.wait > 0) { /* il vient d'être interrompu : il n'a pas encore recommencé */ }
      else if (sp.wind || !t.poise) { t.charge.t = 0; t.charge.wait = 1.4; info.interrupted = true; text(c.x, c.y - F.h * 0.95, 'Interrompu !', '#ffd27a', 1.1); SFX.pop(); }
      else if (!tick) text(c.x, c.y - F.h * 0.95, 'Il tient bon !', '#c9cfdd', 0.9);
    }
    if (t.fuse) { info.defused = t.fuse.t; t.fuse = null; text(c.x, c.y - F.h * 0.95, 'Éteinte !', '#9dffb0', 1.1); }
    if (sp.burn) { t.burn = sp.burn.dur; t.burnDps = sp.burn.dps; }
    if (sp.poison) { t.poison = sp.poison.dur; t.poisonDps = sp.poison.dps; }
    if (sp.quake && (t.auto || t.row)) t.quake = { t: 0, delay: sp.quake.delay, n: sp.quake.ticks, done: 0, dmg: Math.max(1, Math.round(sp.quake.dmg * (mul || 1))), spell: sp };
    if (t.row) {
      var list = sp.chain || sp.sweep ? [0, 1, 2].filter(function (k) { return t.row[k] > 0; }) : [slot];
      if (sp.chain) list.forEach(function (k) { if (k !== slot) D.zaps.push({ x0: c.x + rowDx(slot), y0: c.y, x1: c.x + rowDx(k), y1: c.y - 8 * u, t: 0, dur: 0.5 }); });
      info.n = 0; list.forEach(function (k) { if (tgtDamage(t, k, info.dmg)) { info.n++; SFX.thud(); } });
      info.left = t.row.filter(function (hp) { return hp > 0; }).length;
    } else if (tgtDamage(t, 0, info.dmg)) { info.down = true; SFX.crash(0.6); }
    if (info.dmg > 0 && t.kind !== 'caisse') text(x + rand(-14, 14) * u, c.y - F.h * 0.42, '-' + info.dmg + (info.pierced ? ' à travers le bouclier' : ''), '#fff1a8', 1.15);
    tell();
  }
  // Ce qui s'écoule tout seul sur la cible : ressort, chute, brûlure, poison, secousses, seau d'eau, mèche, petit bouclier.
  function updateTarget(dt) {
    var t = D.target, c = F.chest, u = F.u, i;
    if (!t) return;
    if (t.flash > 0) t.flash -= dt;
    if (t.kind === 'baked' || t.kind === 'caisse') return;
    if (t.guardFlash > 0) t.guardFlash -= dt;
    t.swing = t.swing || 0; t.swingV = (t.swingV || 0) - (t.swing * 70 + t.swingV * 4.5) * dt; t.swing += t.swingV * dt; // il se balance sur son pied, puis se redresse
    if (t.fall) t.fall = Math.min(1, t.fall + dt * 1.8);
    if (t.fallen) for (i = 0; i < 3; i++) if (t.fallen[i]) t.fallen[i] = Math.min(1, t.fallen[i] + dt * 1.8);
    var alive = t.row ? t.row.some(function (hp) { return hp > 0; }) : !t.auto || t.hp > 0;
    if (t.burn > 0) { t.burn -= dt; if (alive && Math.random() < 0.5) part(F.x + rand(-14, 14) * u, F.fy - rand(30, 105) * u, rand(-10, 10), rand(-70, -30), rand(0.3, 0.7), Math.random() < 0.5 ? '#ff7a3a' : '#ffd36b', rand(1.5, 3), -40); }
    if (t.poison > 0) { t.poison -= dt; if (alive && Math.random() < 0.4) part(F.x + rand(-16, 16) * u, F.fy - rand(30, 105) * u, rand(-6, 6), rand(-40, -15), rand(0.6, 1.1), '#5fd35f', rand(2, 4), 0); }
    if (t.auto && t.hp > 0 && !t.row) { // brûlure et poison rongent sa vie
      var dps = (t.burn > 0 ? t.burnDps : 0) + (t.poison > 0 ? t.poisonDps : 0);
      if (dps && tgtDamage(t, 0, dps * dt)) { SFX.crash(0.6); if (cb.onFoeHit) cb.onFoeHit({ spell: null, dmg: 0, down: true, dot: true }); }
    }
    var q = t.quake;
    if (q && alive) {
      q.t += dt; t.swingV += rand(-1, 1) * 22 * quakeK(q) * dt;
      if (q.t >= q.delay + q.done) {
        q.done++; if (q.done >= q.n) t.quake = null;
        var down = !t.row && tgtDamage(t, 0, q.dmg);
        text(c.x, c.y - F.h * 0.42, t.auto ? '-' + q.dmg : 'Secousse !', '#d9a066', 1.15); SFX.hit(); D.shake = Math.max(D.shake, 8); t.flash = 0.2; t.swingV += pickOne([-2.6, 2.6]);
        if (down) SFX.crash(0.6);
        if (cb.onFoeHit) cb.onFoeHit({ spell: q.spell, dmg: q.dmg, quake: q.done, down: down });
      }
    } else if (q) t.quake = null;
    var ch = t.charge;
    if (ch && alive) {
      if (ch.wait > 0) ch.wait -= dt;
      else if ((ch.t += dt) >= ch.dur) { // le seau est plein : splash ! (pour rire : on est juste mouillé un instant)
        t.splashes = (t.splashes || 0) + 1; SFX.splash(); D.p.soaked = Math.max(D.p.soaked, 1.8); D.p.hexMax = Math.max(D.p.hexMax || 0, 1.8); text(W / 2, H * 0.4, 'SPLASH !', '#9fd8ff', 1.5);
        for (i = 0; i < 60; i++) part(rand(0, W), rand(-0.1, 0.6) * H, rand(-60, 60), rand(60, 420), rand(0.5, 1.2), '#9fd8ff', rand(2, 6), 500);
        if (ch.loop) { ch.t = 0; ch.wait = 1.6; } else t.charge = null;
      }
    }
    if (t.fuse && (t.fuse.t += dt) >= t.fuse.dur) { // la mèche est au bout : PAF ! Le mannequin vole en douze morceaux, puis un neuf prend sa place
      t.fuse = null; t.boom = (t.boom || 0) + 1; SFX.crash(0.7); SFX.pop(); D.shake = Math.max(D.shake, 14); text(c.x, c.y - F.h * 0.95, 'PAF !', '#ffd36b', 1.5);
      for (i = 0; i < 46; i++) { var a = rand(0, TAU), v = rand(80, 420); part(c.x, c.y - 30 * u, Math.cos(a) * v, Math.sin(a) * v - 80, rand(0.5, 1.2), pickOne(['#ffd36b', '#ff7a3a', '#7fd4ff', '#9dffb0', '#ff9ad5']), rand(2, 5), 380); }
      t.boomed = 2.2; t.debris = []; // les morceaux : planches, bras, tête, pied… chacun part dans sa direction et tourne
      var L2 = DUMMY_LOOK.petard, kinds = [[L2.head, 14, 14, 'head'], [L2.arm, 26, 6], [L2.arm, 26, 6], [L2.post, 9, 30], [L2.post, 9, 24], [L2.post, 20, 6], [L2.s1, 16, 10], [L2.s2, 16, 10], [L2.post, 12, 12], [L2.arm, 18, 6], [L2.s1, 10, 10], [L2.post, 30, 5]];
      for (i = 0; i < kinds.length; i++) { var a2 = -Math.PI / 2 + rand(-1.25, 1.25), v2 = rand(260, 620); t.debris.push({ x: c.x + rand(-14, 14) * u, y: c.y + rand(-40, 20) * u, vx: Math.cos(a2) * v2, vy: Math.sin(a2) * v2, r: rand(0, TAU), vr: rand(-9, 9), w: kinds[i][1] * u, h: kinds[i][2] * u, col: kinds[i][0], head: kinds[i][3] === 'head' }); }
      if (D.klass && cb.onFoeHit) cb.onFoeHit({ spell: null, dmg: 0, boom: true });
    }
    if (t.boomed) { // les morceaux retombent (et rebondissent sur le sol), le temps qu'un mannequin neuf arrive
      t.debris.forEach(function (d) { d.vy += 1300 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.r += d.vr * dt; if (d.y > F.fy && d.vy > 0) { d.y = F.fy; d.vy *= -0.4; d.vx *= 0.7; d.vr *= 0.6; } });
      t.boomed -= dt; if (t.boomed <= 0) { t.boomed = 0; t.debris = null; t.pop = 0.6; SFX.pop(); }
    }
    if (t.pop) { t.pop -= dt; if (t.pop < 0) t.pop = 0; }
    if (t.spot) { // son petit bouclier court après notre rayon, sans quitter son corps ; sans rayon, il revient devant lui
      var b = D.beams.p, gx = b ? clamp(b.x, c.x - F.h * 0.17, c.x + F.h * 0.17) : c.x, gy = b ? clamp(b.y, c.y - F.h * 0.4, c.y + F.h * 0.4) : c.y;
      if (t.spot.x === undefined) { t.spot.x = c.x; t.spot.y = c.y; }
      t.spot.x += walkDx(t, dt);
      var d = Math.hypot(gx - t.spot.x, gy - t.spot.y), v2 = F.h * (t.spot.v || 0.5) * dt;
      if (d > v2) { t.spot.x += (gx - t.spot.x) / d * v2; t.spot.y += (gy - t.spot.y) / d * v2; } else { t.spot.x = gx; t.spot.y = gy; }
    }
  }
  function walkDx(t, dt) { return t.move ? (Math.sin(D.time * TAU / t.move.per) - Math.sin((D.time - dt) * TAU / t.move.per)) * t.move.amp * W : 0; } // de combien le mannequin vient d'avancer

  function arriveAtFoe(s) {
    var f = D.f, c = F.chest, sp = s.spell, cp = f.copies, x;
    if (D.pack) { var pk = D.pack; if (s.slot == null || s.slot >= pk.m.length || pk.m[s.slot].hp <= 0) s.slot = pk.m[pk.act].hp > 0 ? pk.act : pk.m.indexOf(packAlive()[0]); pk.hit = s.slot; c = { x: c.x + foeSlotDx(s.slot), y: c.y }; } // horde : le monstre visé (ou, s'il est tombé entre-temps, un autre encore debout)
    x = c.x + (D.pack ? 0 : foeSlotDx(s.slot));
    if (s.fake) { burst(x, c.y, '#ffc8f0', 8, 90); return; } // sort lancé par un de nos doubles : du vent
    if (D.target) return hitTarget(sp, s.dmg, x, c.y, false, s.slot, s.mul); // cours : une caisse ou un mannequin à la place du professeur
    if (cp && (sp.chain || sp.sweep) && !s.practice) { // Tonnero saute d'une copie à l'autre, Flammurus les balaie toutes : le vrai est touché à coup sûr
      aliveSlots(cp).forEach(function (i) { if (sp.chain) D.zaps.push({ x0: x, y0: c.y, x1: c.x + foeSlotDx(i), y1: c.y - 20 * F.u, t: 0, dur: 0.45 }); else D.fires.push({ x: c.x + foeSlotDx(i), y: c.y + 30 * F.u, r: 9 * F.u, t: 0, dur: 0.8, ph: i }); });
      endCopies(f, false, true); cp = null;
    }
    if (cp && s.slot !== cp.real) return popCopy(f, false, s.slot);
    if ((f.mist > 0 || D.mod.dodge) && f.hp > 0 && !s.practice && !sp.wind && Math.random() < (f.mist > 0 ? 0.5 : D.mod.dodge)) { text(c.x, c.y - F.h * 0.62, 'Il passe dans la brume…', '#cfd8e6', 0.9); return; } // Vapor (ou la brume de la tour) : un sort sur deux le traverse sans le toucher
    if (f.invis > 0 && f.hp > 0 && !s.practice && !sp.unparry) { text(c.x, c.y - F.h * 0.62, 'Il est invisible : ton sort le traverse !', '#d8d8ff', 0.9); burst(c.x, c.y, '#d8d8ff', 8, 90); return; } // Evanesco
    if (s.willBlock && foeCanShield() && sp.bomb && !s.practice) { // Bombus : il a beau bloquer, ça lui explose dessus
      steady(f, s); SFX.crash(0.8); f.flash = 0.3; D.shake = Math.max(D.shake, 8); text(c.x, c.y - F.h * 0.62, 'BOUM ! Ça explose dans son bouclier !', sp.color, 1.1);
      for (var bj = 0; bj < 36; bj++) { var bja = rand(0, TAU), bjv = rand(80, 360); part(c.x, c.y, Math.cos(bja) * bjv, Math.sin(bja) * bjv, rand(0.4, 0.9), bj % 3 ? sp.color : '#ffe9a0', rand(2, 5), 260); }
      hurt(f, false, Math.round(s.dmg * 0.6)); D.stats.hits++; if (f.hp <= 0) finish(true); return;
    }
    if (s.willBlock && foeCanShield()) {
      steady(f, s); burst(c.x, c.y, '#bfe6ff', 16, 160); SFX.block(); text(c.x, c.y - F.h * 0.62, 'Bloqué', '#bfe6ff', 0.8);
      if (sp.pierce && !s.practice) { hurt(f, false, Math.round(s.dmg * sp.pierce)); text(c.x, c.y - F.h * 0.78, (sp.id === 'umbra' ? 'L’ombre traverse !' : sp.name + ' traverse !'), sp.color, 0.9); if (f.hp <= 0) finish(true); return; }
      if (s.reflected && s.volley < 5 && Math.random() < 0.45) { bounceToPlayer(s, c.x, c.y); text(c.x, c.y - F.h * 0.78, 'Renvoyé !', '#ffb0a0', 0.9); } // l'échange continue : il nous le renvoie, plus vite
      return;
    }
    resolve(f, false, s, c.x, c.y);
    if (cp && f.copies && D.phase !== 'end') endCopies(f, false, true);
  }
  function arriveAtPlayer(s) {
    if (s.miss) { text(clamp(s.tx, 150, W - 150), s.ty, 'Manqué !', '#c9cfdd', 0.9); return; } // il visait à côté
    var p = D.p, sp = s.spell, off = viewOff(), ax = s.tx + off.x, ay = s.ty + off.y, cp = p.copies; // ax, ay : là où on voit le sort (sous l'eau, l'image tangue)
    if (s.fake) { burst(ax, ay, '#ffc8f0', 14, 160); text(ax, ay - 24, 'Illusion !', '#ffc8f0', 0.9); SFX.pop(); return; } // sort lancé par une de ses copies
    var tell = function (o, perfect) { if (D && D.klass && cb.onPlayerHit) cb.onPlayerHit({ spell: sp, outcome: o, perfect: !!perfect, antiIce: had.antiIce, grip: had.grip, riposte: !!s.riposte }); }, had = { antiIce: p.antiIce > 0, grip: p.grip > 0 }; // pour le professeur (riposte : un de nos sorts, que son bouclier de maître nous a renvoyé)
    if (cp && (sp.chain || sp.sweep)) { endCopies(p, true, true); cp = null; } // Tonnero foudroie nos doubles, Flammurus les balaie : ils nous trouvent
    if (cp && s.slot !== 1) return popCopy(p, true, s.slot);
    if (p.mist > 0 && !sp.wind && Math.random() < 0.5) { text(ax, ay - 30, 'Il passe dans ta brume !', '#cfd8e6', 1); burst(ax, ay, '#cfd8e6', 12, 120); return tell('mist'); }
    if (p.invis > 0 && !sp.unparry && !s.tick) { text(ax, ay - 30, 'Il te traverse : tu es invisible !', '#d8d8ff', 1); burst(ax, ay, '#d8d8ff', 10, 100); return tell('invis'); } // Evanesco
    var near = Math.hypot(wand.x - ax, wand.y - ay) < parryR();
    if (sp.unparry && p.shieldT > 0 && near) text(W / 2, H * 0.64, 'Ton bouclier ne l’arrête pas !', sp.color, 1);
    if (p.shieldT > 0 && near && p.disarmed <= 0 && !sp.unparry) {
      var perfect = p.shieldAge <= PERFECT_T; steady(p, s);
      D.practiced.parry = true; if (!s.practice) D.stats.blocks++;
      burst(ax, ay, '#bfe6ff', 22, 260);
      if (perfect) {
        if (!s.practice) D.stats.perfects++;
        SFX.perfect(); D.flash = 0.18; text(ax, ay - parryR(), 'PARFAIT ! Renvoyé !', '#ffe9a0', 1.25); bounceToFoe(s, ax, ay);
      } else if (sp.bomb) { // Bombus : bloquer ne suffit pas, il explose dans le bouclier
        var bd = Math.round(s.dmg * 0.6); SFX.crash(0.9); D.shake = Math.max(D.shake, 22); D.flash = 0.25; text(ax, ay - parryR(), 'BOUM ! Il explose dans ton bouclier !', sp.color, 1.3);
        for (var bi = 0; bi < 50; bi++) { var ba = rand(0, TAU), bv = rand(100, 520); part(ax, ay, Math.cos(ba) * bv, Math.sin(ba) * bv, rand(0.4, 1), bi % 3 ? sp.color : '#ffe9a0', rand(2, 6), 300); }
        if (!s.practice) { hurt(p, true, bd); p.hurt = 0.6; if (p.hp <= 0) finish(false); }
      } else {
        SFX.block(); text(ax, ay - parryR(), 'Bloqué !', '#bfe6ff', 1);
        if (sp.pierce && !s.practice) { hurt(p, true, Math.round(s.dmg * sp.pierce)); p.hurt = 0.4; text(W / 2, H * 0.56, (sp.id === 'umbra' ? 'L’ombre traverse ton bouclier !' : sp.name + ' traverse ton bouclier !'), sp.color, 1); if (p.hp <= 0) finish(false); }
      }
      return tell('parry', perfect); // perfect : le sort est reparti vers l'envoyeur
    }
    tell(resolve(p, true, s, ax, ay));
    if (cp && p.copies && D.phase !== 'end') endCopies(p, true, true);
  }
  // Murus : le sort s'écrase sur le mur. Seules les attaques l'entament (Terra compte pour quatre, une salve de rayon pour une demie).
  function wallHit(s, x, y) {
    var w = D.wall, sp = s.spell;
    if (s.fake) { burst(x, y, '#ffc8f0', 8, 90); return; }
    if (sp.cat !== 'attaque') { burst(x, y, '#9aa3b5', 10, 120); SFX.block(); text(x, y - 20, 'Arrêté par le mur', '#c9cfdd', 0.8); return; }
    w.hp -= s.tick ? 0.5 : (sp.wallDmg || 1); w.flash = 0.2; burst(x, y, '#d9c8a8', 18, 200); SFX.hit(); D.shake = Math.max(D.shake, 5);
    if (cb.onWall) cb.onWall({ spell: sp, hp: Math.max(0, w.hp), broken: w.hp <= 0, tick: !!s.tick });
    if (w.hp > 0) return;
    for (var i = 0; i < 60; i++) part(F.chest.x + rand(-0.9, 0.9) * F.h, F.fy - rand(-0.2, 0.7) * F.h, rand(-120, 120), rand(-200, 60), rand(0.6, 1.3), pickOne(['#8d7b68', '#b9a58c', '#6a5a4a']), rand(3, 8), 700);
    D.wall = null; SFX.crash(1); D.shake = Math.max(D.shake, 14); text(F.chest.x, F.chest.y - F.h * 0.5, 'Le mur s’écroule !', '#e8dcc4', 1.1);
  }
  function finish(win) {
    if (D.phase === 'end') return;
    if (win && D.pack && D.horde.wi < D.horde.waves.length - 1) { if (!D.pack.pending) D.pack.pending = 1.1; return; } // une horde : la vague suivante arrive, ce n'est pas fini
    if (D.pack) D.pack.m.forEach(function (mb) { if (mb.hp <= 0 && !mb.dead) { mb.dead = true; D.horde.kills++; } }); // le dernier monstre fauché compte aussi
    var p = D.p;
    cancelTrace(); D.shots.length = 0; D.beams.p = D.beams.f = null; D.wall = null; D.result = win; D.endT = 0; D.f.state = 'idle'; D.f.shield = 0; D.f.guard = null; D.f.copies = null; D.f.offX = 0;
    p.soaked = p.blind = p.asleep = p.dazzled = p.frozen = p.inverted = p.fast = p.heavy = p.disarmed = 0; p.fly = null; p.copies = null; p.quake = null; // on y voit de nouveau clair
    D.held.length = 0; D.foeHeld.length = 0; D.pending.length = 0; D.allies.p = D.allies.f = null; showAllies(false); p.whirl = p.blurred = p.sneezing = p.conjure = 0; D.f.whirl = 0;
    setPhase('end'); if (!cb.onPhase) { if (win) SFX.win(); else SFX.lose(); } // la ritournelle de fin est jouée par celui qui écoute les phases (js/main.js)
  }

  // ───────────────────────── Rayons (Radius, Infernus) ─────────────────────────
  // Le rayon sort de la baguette pendant quelques secondes et blesse à chaque salve (tick). On le promène où on veut.
  // Le nôtre : l'adversaire peut lever un petit bouclier qui court après le rayon — il faut viser là où le bouclier n'est pas.
  // Le sien : il le promène sur nous ; il faut garder son bouclier dessus (clic enfoncé ou martelé) et suivre le rayon avec la baguette.
  function startBeam(isP, spell, S, mul, practice) {
    var b = spell.beam, f = D.f, o = { spell: spell, lv: S.lv, t: 0, dur: b.dur, tick: b.tick, next: b.tick, mul: mul, dmg: Math.max(1, Math.round(b.dmg * mul * S.dmg)), practice: practice, said: -9 };
    if (isP) {
      o.x = wand.x; o.y = wand.y; D.beams.p = o;
      if (!practice && !D.target && foeCanShield() && f.state !== 'beam' && Math.random() < Math.min(0.92, D.ai.block * blockK() + 0.3)) { abortFoeCast(); f.state = 'guard'; f.guard = { x: F.chest.x, y: F.chest.y }; }
    } else { o.ph = rand(0, TAU); o.ph2 = rand(0, TAU); o.slot = D.p.copies ? pickOne(aliveSlots(D.p.copies)) : null; o.x = W / 2; o.y = H * 0.5; f.state = 'beam'; D.beams.f = o; }
    SFX.beam(!!b.fire);
  }
  function stopBeam(isP) {
    var f = D.f;
    if (isP) { if (!D.beams.p) return; D.beams.p = null; if (f.state === 'guard') { f.state = 'idle'; f.guard = null; f.timer = rand(0.4, 1); } }
    else { if (!D.beams.f) return; D.beams.f = null; if (f.state === 'beam') { f.state = 'idle'; f.timer = rand(D.ai.think[0], D.ai.think[1]); } }
  }
  function inBody(x, y, cx) { var h = Math.max(F.h, F.h0 * 0.9), dx = (x - cx) / (h * 0.2), dy = (y - F.chest.y) / (h * 0.52); return dx * dx + dy * dy < 1; } // un petit adversaire n'est pas plus dur à viser
  function guardR() { return F.h * 0.2; }
  function beamSay(b, x, y, str, color) { if (D.time - b.said > 0.9) { b.said = D.time; text(x, y, str, color, 0.85); } }
  function beamTickFoe(b) {
    var f = D.f, cp = f.copies, hit = -1, tk = { spell: b.spell, lv: b.lv, dmg: b.dmg, mul: b.mul, practice: b.practice, tick: true };
    if (D.wall && D.wall.rise > 0.5) return wallHit(tk, b.x, clamp(b.y, F.fy - F.h * 0.7, F.fy));
    if (D.target) { // cours : le rayon touche le mannequin (ou celui de la rangée) qu'il a devant lui
      var row = D.target.row, sl = null;
      if (row) { row.forEach(function (hp, i) { if (hp > 0 && inBody(b.x, b.y, F.chest.x + rowDx(i))) sl = i; }); if (sl === null) return; }
      else if (!inBody(b.x, b.y, F.chest.x)) return;
      return hitTarget(b.spell, b.dmg, b.x, b.y, true, sl, b.mul);
    }
    (cp ? aliveSlots(cp) : [null]).forEach(function (i) { if (inBody(b.x, b.y, F.chest.x + foeSlotDx(i))) hit = i === null ? 9 : i; });
    if (hit < 0 || f.hp <= 0) return; // à côté
    if (cp && hit !== cp.real) return popCopy(f, false, hit);
    if (f.state === 'guard' && f.guard && Math.hypot(b.x - f.guard.x, b.y - f.guard.y) < guardR()) { burst(b.x, b.y, '#bfe6ff', 8, 120); SFX.block(); return beamSay(b, b.x, b.y - F.h * 0.3, 'Bloqué', '#bfe6ff'); }
    if (f.mist > 0 && !b.practice && Math.random() < 0.5) return beamSay(b, b.x, b.y - F.h * 0.3, 'Dans la brume…', '#cfd8e6');
    resolve(f, false, tk, b.x, b.y);
    if (cp && f.copies && D.phase !== 'end') endCopies(f, false, true);
  }
  function beamTickPlayer(b) {
    var p = D.p, off = viewOff(), ax = b.x + off.x, ay = b.y + off.y, cp = p.copies, tk = { spell: b.spell, lv: 1, dmg: b.dmg, mul: b.mul, practice: b.practice, tick: true };
    if (D.wall && D.wall.rise > 0.5) return wallHit(tk, F.chest.x + rand(-0.3, 0.3) * F.h, F.fy - rand(0.1, 0.6) * F.h);
    if (cp && b.slot !== 1) { popCopy(p, true, b.slot); b.slot = p.copies ? pickOne(aliveSlots(p.copies)) : null; return; }
    if (p.mist > 0 && Math.random() < 0.5) return beamSay(b, ax, ay - 40, 'Dans ta brume…', '#cfd8e6');
    if (p.shieldT > 0 && p.disarmed <= 0 && Math.hypot(wand.x - ax, wand.y - ay) < parryR()) { burst(ax, ay, '#bfe6ff', 10, 200); SFX.block(); D.practiced.parry = true; if (!b.practice) D.stats.blocks++; return beamSay(b, ax, ay - parryR(), 'Bloqué !', '#bfe6ff'); }
    resolve(p, true, tk, ax, ay);
    if (cp && p.copies && D.phase !== 'end') { endCopies(p, true, true); b.slot = null; }
  }
  function updateBeams(dt) {
    var p = D.p, f = D.f, off = viewOff(), b = D.beams.p, g, d, v;
    if (b) {
      b.t += dt; b.x = wand.x - off.x; b.y = wand.y - off.y; // là où pointe la baguette, dans la scène
      g = f.guard;
      if (f.state === 'guard' && g) { // son bouclier court après le rayon, sans quitter son corps
        var gx = clamp(b.x, F.chest.x - F.h * 0.16, F.chest.x + F.h * 0.16), gy = clamp(b.y, F.chest.y - F.h * 0.42, F.chest.y + F.h * 0.42);
        d = Math.hypot(gx - g.x, gy - g.y); v = F.h * D.ai.guardV * foeSpeed() * blockK() * dt;
        if (d > v) { g.x += (gx - g.x) / d * v; g.y += (gy - g.y) / d * v; } else { g.x = gx; g.y = gy; }
        if (!foeCanShield()) { f.state = 'idle'; f.guard = null; }
      }
      if (p.frozen > 0 || p.disarmed > 0) stopBeam(true);
      else {
        if (b.spell.beam.fire && Math.random() < 0.9) part(b.x + rand(-10, 10), b.y + rand(-10, 10), rand(-40, 40), rand(-120, -30), rand(0.3, 0.7), pickOne(['#ff7a3a', '#ffd36b']), rand(2, 5), -60);
        while (D.beams.p === b && b.t >= b.next) { b.next += b.tick; beamTickFoe(b); if (D.phase === 'end') return; }
        if (D.beams.p === b && b.t >= b.dur) stopBeam(true);
      }
    }
    b = D.beams.f;
    if (b) {
      b.t += dt;
      var wide = b.slot == null || b.slot === 1, cx = W * 0.5 + (b.slot != null ? ghostDx(b.slot) * 0.95 : 0), w = D.ai.beamW * foeSpeed();
      var tx = cx + Math.sin(b.t * w + b.ph) * W * (wide && !p.copies ? 0.2 : 0.06), ty = H * 0.5 + Math.sin(b.t * w * 1.37 + b.ph2) * H * 0.15;
      b.x += (tx - b.x) * Math.min(1, dt * 5); b.y += (ty - b.y) * Math.min(1, dt * 5);
      if (f.frozen > 0 || f.disarmed > 0 || f.hp <= 0) return stopBeam(false);
      while (D.beams.f === b && b.t >= b.next) { b.next += b.tick; beamTickPlayer(b); if (D.phase === 'end') return; }
      if (D.beams.f === b && b.t >= b.dur) stopBeam(false);
    }
  }

  // ───────────────────────── Particules et textes ─────────────────────────
  function part(x, y, vx, vy, life, color, size, grav) { if (D.parts.length < 700) D.parts.push({ x: x, y: y, vx: vx, vy: vy, life: life, max: life, color: color, size: size, grav: grav || 0 }); }
  function burst(x, y, color, n, speed) { for (var i = 0; i < n; i++) { var a = rand(0, TAU), v = rand(0.2, 1) * speed; part(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(0.3, 0.8), i % 3 ? color : '#ffffff', rand(1.5, 4), 120); } }
  function text(x, y, str, color, size) { if (str) D.texts.push({ x: clamp(x, 120, W - 120), y: y, str: str, color: color, size: size, t: 0 }); }
  function flashClass(id, cls, el) { el = el || $(id); if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  // ───────────────────────── Mise à jour ─────────────────────────
  // Là où la baguette veut aller : la souris, sauf maléfice (inversée, emballée, alourdie).
  function wandTarget() {
    var p = D.p, x = mouse.x, y = mouse.y, a;
    if (p.inverted > 0) { x = W - x; y = H - y; }
    if (p.fast > 0) { a = p.anchor || (p.anchor = { mx: x, my: y, wx: wand.x, wy: wand.y }); x = a.wx + (x - a.mx) * FAST_GAIN; y = a.wy + (y - a.my) * FAST_GAIN; } else p.anchor = null;
    if (D.kick) { var kk = D.kick.t / 0.5; x += D.kick.x * kk; y += D.kick.y * kk; } // Atchoum : la baguette part de travers
    return { x: clamp(x, 0, W), y: clamp(y + p.grav, 0, H) };
  }
  // Ce qui s'écoule tout seul sur un sorcier : copies, secousses de Tremor, écho de Ritardo, brûlure, poison, régénération.
  function tickFighter(o, isP, dt, live) {
    var cp = o.copies, q = o.quake, e = o.echo;
    if (cp) { cp.spread = Math.min(1, cp.spread + dt * 3); cp.t -= dt; if (cp.t <= 0) endCopies(o, isP, false); }
    if (q) {
      q.t += dt;
      if (isP) D.shake = Math.max(D.shake, 14 * quakeK(q));
      if (q.t >= q.delay + q.done) {
        q.done++;
        if (live) hurt(o, isP, q.dmg); else text(isP ? W / 2 : F.chest.x, isP ? H * 0.45 : F.chest.y - F.h * 0.5, 'Secousse !', '#d9a066', 1);
        if (isP) { SFX.hurt(); o.hurt = 0.4; D.shake = 20; } else { o.flash = 0.2; SFX.hit(); }
        if (q.done >= q.n) o.quake = null;
      }
    }
    if (e) {
      e.t -= dt;
      if (e.t <= 0) { // Ritardo : tout ce qui a été reçu pendant le compte à rebours revient d'un seul coup
        var d = Math.round(e.dmg * e.k); o.echo = null;
        if (d > 0 && live) { text(isP ? W / 2 : F.chest.x, isP ? H * 0.36 : F.chest.y - F.h * 0.8, 'Écho de Ritardo !', '#e8c36b', 1.1); hurt(o, isP, d, true); if (isP) { SFX.hurt(); o.hurt = 0.6; D.shake = 18; } else { o.flash = 0.3; SFX.hit(); } }
      }
    }
    if (live && o.hp > 0) {
      if (o.burn > 0) o.hp -= o.burnDps * dt;
      if (o.poison > 0) o.hp -= o.poisonDps * dt;
      if (o.whirl > 0) o.hp -= o.whirlDps * dt;
      if (o.blizzard > 0) o.hp -= o.blizzardDps * dt;
      if (o.regen > 0) o.hp = Math.min(o.maxHp, o.hp + o.regenHps * dt);
      o.hp = Math.max(0, o.hp);
      if (isP && (o.burn > 0 || o.poison > 0 || o.regen > 0) && (o.sfxT = (o.sfxT || 0) - dt) <= 0) { o.sfxT = 0.9; if (o.burn > 0) SFX.sizzle(); else if (o.poison > 0) SFX.bubble(); else SFX.mend(); } // ça grésille, ça bouillonne ou ça guérit
    }
    if (live && o.hp <= 0) finish(!isP);
  }
  function update(dt) {
    var p = D.p, f = D.f, i, s, live = D.phase === 'fight', w = D.wall;
    D.time += dt;
    p.grav = p.heavy > 0 ? Math.min(H * GRAV_MAX, p.grav + H * GRAV_SPEED * dt) : Math.max(0, p.grav - H * 1.2 * dt);
    if (p.frozen <= 0) { // dans un glaçon, la baguette ne bouge plus
      var tg = wandTarget(), mx = tg.x - wand.x, my = tg.y - wand.y, md = Math.hypot(mx, my);
      var cap = Math.min(p.slowed > 0 ? SLOW_WAND : Infinity, p.asleep > 0 ? SLEEP_WAND : Infinity), step = H * cap * dt;
      if (md > step) { wand.x += mx / md * step; wand.y += my / md * step; } // ralentie ou endormie, la baguette ne suit plus la souris qu'à petite vitesse
      else { wand.x += mx * Math.min(1, dt * 60); wand.y += my * Math.min(1, dt * 60); }
    }
    f.swayT += dt * (f.frozen > 0 ? 0 : foeSpeed());
    wand.x = clamp(wand.x, 0, W); wand.y = clamp(wand.y, 0, H);
    var sw = D.swipe || (D.swipe = { x: wand.x, y: wand.y, x0: wand.x, y0: wand.y, vx: 0, vy: 0, sp: 0 }); // le dernier mouvement de la baguette (pour le revers de la baguette de Josué)
    sw.x0 = sw.x; sw.y0 = sw.y; sw.x = wand.x; sw.y = wand.y; sw.sp = Math.hypot(sw.x - sw.x0, sw.y - sw.y0) / Math.max(dt, 0.001);
    sw.vx = lerp(sw.vx, (sw.x - sw.x0) / Math.max(dt, 0.001), 0.5); sw.vy = lerp(sw.vy, (sw.y - sw.y0) / Math.max(dt, 0.001), 0.5);
    var goal = D.pack ? packDx(D.pack.act) : f.copies ? (f.copies.real - 1) * W * COPY_GAP * f.copies.spread : 0; // il rejoint sa place parmi les copies, puis revient au centre ; dans une horde, le monstre qui lance
    f.offX = f.copies || D.pack ? goal : f.offX + clamp(goal - f.offX, -W * 0.5 * dt, W * 0.5 * dt); // dans une horde, le repère saute d'un monstre à l'autre : les autres ne bougent pas
    foeFrame();
    if (D.pack && D.phase !== 'end') { packSync(); packTick(dt); }
    if (D.trail) extendTrace();

    if (D.beams.f && mouseDown && canShield()) { p.shieldT = Math.max(p.shieldT, 0.15); p.shieldAge = 1; } // face à un rayon, garder le clic enfoncé tient le bouclier
    if (p.shieldT > 0) {
      p.shieldAge += dt;
      if (mouseDown && p.holdLeft > 0) { var hd = Math.min(dt, p.holdLeft); p.holdLeft -= hd; p.shieldT = Math.min(SHIELD_T, p.shieldT + hd); p.shieldCd = p.shieldCdMax; } // clic maintenu : le bouclier tient encore un peu
    }
    TIMERS.forEach(function (k) { if (p[k] > 0) p[k] = Math.max(0, p[k] - dt); if (f[k] > 0) f[k] = Math.max(0, f[k] - dt); });
    ['shieldT', 'shieldCd', 'hurt'].forEach(function (k) { if (p[k] > 0) p[k] = Math.max(0, p[k] - dt); });
    ['shield', 'flash', 'disarmed'].forEach(function (k) { if (f[k] > 0) f[k] = Math.max(0, f[k] - dt); });
    [p, f].forEach(function (o) { var h = hexed(o); if (o.wasHexed && !h) o.resist = RESIST; o.wasHexed = h; });
    [['soak', Math.max(p.soaked, p.whirl)], ['blind', p.blind], ['sleep', p.asleep], ['blur', p.blurred]].forEach(function (e) { D.fx[e[0]] = clamp(D.fx[e[0]] + (e[1] > 0 ? dt * 4 : -dt * 3), 0, 1); });
    if (p.asleep > 0) p.sleepT += dt;
    if (f.asleep > 0 && f.hp > 0) { f.sleepT += dt; f.zT -= dt; if (f.zT <= 0) { f.zT = 0.75; text(F.x + rand(8, 20) * F.u, F.fy - 102 * F.u, 'z', '#ff9ad5', 0.8); } }
    D.shake = Math.max(0, D.shake - dt * 45); D.flash = Math.max(0, D.flash - dt);
    D.dimK = clamp(D.dimK + (D.dim ? dt * 4 : -dt * 4), 0, 1);
    updateTarget(dt); updateExtras(dt);
    if (w) { w.rise = Math.min(1, w.rise + dt * 2.5); w.flash = Math.max(0, w.flash - dt); w.t -= dt; if (w.t <= 0) { D.wall = null; text(F.chest.x, F.chest.y - F.h * 0.5, 'Le mur retombe', '#e8dcc4', 0.9); } }
    updateFly(dt);

    if (D.comboT > 0) D.comboT -= dt;
    if (D.phase === 'countdown') {
      D.countdown -= dt;
      var n = Math.ceil(D.countdown);
      if (n !== D.lastCount && n > 0) { D.lastCount = n; SFX.count(); } // Yum… Kaï…
      if (D.countdown <= 0) { D.wardT = WARD_T; D.lastCount = 0; f.timer = rand(0.3, 0.8); setPhase('fight'); } // 3… : on peut déjà se protéger
    } else if (live && D.wardT > 0) { // 3… 2… 1… : des protections seulement, des deux côtés, puis GO !
      D.wardT -= dt;
      var m = Math.ceil(D.wardT);
      if (m !== D.lastCount && m > 0) { D.lastCount = m; SFX.count(); }
      if (D.wardT <= 0) { D.wardT = 0; D.goT = 0.9; D.goText = 'GO !'; SFX.go(); f.combo = []; if (f.state === 'idle') f.timer = rand(0.5, 1.1); }
    }
    if (live && f.hp > 0) { // énergie de l'adversaire : elle remonte lentement pendant qu'il attaque, vite quand il souffle
      f.mana = Math.min(f.maxMana, f.mana + f.maxMana / (f.tired > 0 ? D.ai.rest : 45) * dt);
      if (f.tired > 0 && f.mana >= f.maxMana * 0.85) { f.tired = 0; f.timer = rand(0.4, 0.9); text(F.chest.x, F.chest.y - F.h * 0.9, 'Il a repris son souffle !', '#ffb0a0', 0.9); }
    }
    if (D.goT > 0) D.goT -= dt;
    if (D.banner) { D.banner.t -= dt; if (D.banner.t <= 0) D.banner = null; }
    if (live) p.mana = Math.min(p.maxMana, p.mana + MANA_REGEN * D.wd.regen * D.regen * dt);
    if (D.fam && live && p.hp > 0) { // notre familier : la fée soigne quand on va mal, le dragon crache du feu tout seul
      if (D.fam.hps && p.hp < p.maxHp * 0.5) { p.hp = Math.min(p.maxHp, p.hp + D.fam.hps * dt); if (Math.random() < 0.3) { var fq = famPos(); part(fq.x + rand(-20, 20), fq.y, rand(-20, 20), rand(-60, -20), rand(0.5, 1), '#9fe8c0', rand(1.5, 3), 0); } }
      if (D.fam.shot && f.hp > 0 && (D.famT -= dt) <= 0) { D.famT = D.fam.every; D.famPop = 0.3; allyFire(true, { a: D.fam, mul: 1 }, famPos()); }
    }
    if (D.famPop > 0) D.famPop -= dt;
    if (live || D.phase === 'prep') {
      tickFighter(p, true, dt, live); if (D.phase !== 'end') tickFighter(f, false, dt, live);
      if (D.phase !== 'end') { foeAI(dt); updateBeams(dt); }
    }
    if (D.phase === 'fight') { // un des deux est presque à terre : la musique s'emballe ; nous : le cœur bat
      var hot = p.hp < p.maxHp * 0.35 || f.hp < f.maxHp * 0.3;
      if (hot !== D.hot) { D.hot = hot; if (DS.music) DS.music.heat(hot); }
      if (p.hp < p.maxHp * 0.25 && (D.heartT = (D.heartT || 0) - dt) <= 0) { D.heartT = 0.85; SFX.heart(); }
    }
    if (D.phase === 'end') {
      D.endT += dt;
      if (D.result) f.fall = Math.min(1, f.fall + dt * 1.6);
      if (D.pack) D.pack.m.forEach(function (mb) { if (mb.hp <= 0) mb.fall = Math.min(1, mb.fall + dt * 1.6); }); // la horde s'effondre
      if (D.endT > 1.9 && !D.endShown) { D.endShown = true; if (cb.onEnd) cb.onEnd({ win: D.result, stats: D.stats, foe: f.ch, level: D.level, used: D.used, kills: D.horde ? D.horde.kills : 0, waves: D.horde ? D.horde.waves.length : 0 }); }
    }

    for (i = D.shots.length - 1; i >= 0; i--) {
      s = D.shots[i]; s.t += dt / s.dur * (D.mod.speed || 1);
      var pos = shotPos(s);
      if (Math.random() < 0.8) part(pos.x + rand(-1, 1) * pos.r * 0.5, pos.y + rand(-1, 1) * pos.r * 0.5, rand(-20, 20), rand(-30, 10), rand(0.2, 0.5), s.spell.color, Math.max(1, pos.r * 0.3), s.spell.burn ? -160 : 0);
      if (s.from === 'player' && !s.decided && s.t >= (D.target && D.target.riposte ? 0.12 : 0.55)) decideBlock(s); // le bouclier de maître (cours) se lève presque tout de suite
      if (!s.passed && s.t >= 0.5) { // à mi-chemin : s'il y a un mur, le sort s'y écrase
        if (D.wall && D.wall.rise > 0.5 && !s.miss) { D.shots.splice(i, 1); wallHit(s, pos.x, pos.y); continue; }
        s.passed = true;
      }
      if (s.from === 'foe' && swipeParry(s)) { D.shots.splice(i, 1); if (D.phase === 'end') break; continue; } // baguette de Josué : dévié d'un revers
      if (s.t >= 1) { D.shots.splice(i, 1); if (s.from === 'player') arriveAtFoe(s); else arriveAtPlayer(s); if (D.phase === 'end') break; }
    }
    if (D.flung) for (i = D.flung.length - 1; i >= 0; i--) { // les sorts déviés filent sur le côté, en grossissant comme s'ils passaient derrière nous
      var fl = D.flung[i]; fl.t += dt; fl.x += fl.vx * dt; fl.y += fl.vy * dt;
      part(fl.x + rand(-6, 6), fl.y + rand(-6, 6), rand(-30, 30), rand(-30, 30), rand(0.2, 0.45), fl.spell.color, rand(2, 4), 0);
      if (fl.t >= fl.dur) D.flung.splice(i, 1);
    }
    // ce qui flotte autour de l'adversaire : braises, givre, bulles de poison, brume…
    var u = F.u;
    if (f.hp > 0 && !D.target) {
      if (f.burn > 0 && Math.random() < 0.5) part(F.x + rand(-14, 14) * u, F.fy - rand(10, 90) * u, rand(-10, 10), rand(-70, -30), rand(0.3, 0.7), Math.random() < 0.5 ? '#ff7a3a' : '#ffd36b', rand(1.5, 3), -40);
      if (f.poison > 0 && Math.random() < 0.35) part(F.x + rand(-16, 16) * u, F.fy - rand(20, 95) * u, rand(-6, 6), rand(-40, -15), rand(0.6, 1.1), '#5fd35f', rand(2, 4), 0);
      if (f.slowed > 0 && Math.random() < 0.3) part(F.x + rand(-22, 22) * u, F.fy - rand(0, 95) * u, rand(-4, 4), rand(-12, -4), rand(0.8, 1.4), '#a6e36a', rand(1.5, 3), 0);
      if (f.soaked > 0 && Math.random() < 0.5) part(F.x + rand(-16, 16) * u, F.fy - rand(40, 98) * u, rand(-6, 6), rand(20, 60), rand(0.4, 0.8), '#9fd8ff', rand(1.5, 3), 400);
      if (f.regen > 0 && Math.random() < 0.3) part(F.x + rand(-18, 18) * u, F.fy - rand(0, 60) * u, 0, rand(-50, -25), rand(0.6, 1), '#6fe0a0', rand(1.5, 3), 0);
    }
    if (p.burn > 0 && Math.random() < 0.6) part(rand(0, W), H + 5, rand(-10, 10), rand(-260, -120), rand(0.4, 0.9), Math.random() < 0.5 ? '#ff7a3a' : '#ffd36b', rand(2, 5), -60);
    if (p.poison > 0 && Math.random() < 0.4) part(rand(0, W), H + 5, rand(-10, 10), rand(-160, -70), rand(0.8, 1.5), '#5fd35f', rand(3, 7), 0);
    if (p.regen > 0 && Math.random() < 0.4) part(rand(0, W), H + 5, 0, rand(-200, -90), rand(0.8, 1.4), '#6fe0a0', rand(2, 4), 0);

    for (i = D.parts.length - 1; i >= 0; i--) { var q = D.parts[i]; q.life -= dt; if (q.life <= 0) { D.parts.splice(i, 1); continue; } q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    for (i = D.texts.length - 1; i >= 0; i--) { D.texts[i].t += dt; if (D.texts[i].t > 1.3) D.texts.splice(i, 1); }
    for (i = D.ghosts.length - 1; i >= 0; i--) { D.ghosts[i].t += dt; if (D.ghosts[i].t > D.ghosts[i].dur) D.ghosts.splice(i, 1); }
    for (i = D.fires.length - 1; i >= 0; i--) { D.fires[i].t += dt; if (D.fires[i].t > D.fires[i].dur) D.fires.splice(i, 1); }
    for (i = D.zaps.length - 1; i >= 0; i--) { D.zaps[i].t += dt; if (D.zaps[i].t > D.zaps[i].dur) D.zaps.splice(i, 1); }
    syncHud();
  }

  // ───────────────────────── Rendu ─────────────────────────
  // Trait lumineux : halo large, cœur coloré, filet blanc.
  function glowPath(pts, color, alpha, w) {
    if (pts.length < 2 || alpha <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = color; ctx.globalAlpha = alpha * 0.18; ctx.lineWidth = w * 5; ctx.stroke();
    ctx.globalAlpha = alpha * 0.55; ctx.lineWidth = w * 2.1; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = alpha * 0.95; ctx.lineWidth = w * 0.7; ctx.stroke();
    ctx.restore();
  }
  // Éclair : une ligne brisée qui change à chaque image.
  function bolt(x0, y0, x1, y1, alpha, w) {
    var pts = [{ x: x0, y: y0 }], n = 7, d = Math.hypot(x1 - x0, y1 - y0) * 0.09;
    for (var i = 1; i < n; i++) pts.push({ x: lerp(x0, x1, i / n) + rand(-d, d), y: lerp(y0, y1, i / n) + rand(-d, d) });
    pts.push({ x: x1, y: y1 });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); for (i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = '#ffe14a'; ctx.globalAlpha = alpha * 0.35; ctx.lineWidth = w * 4; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = alpha; ctx.lineWidth = w; ctx.stroke();
    ctx.restore();
  }
  function sparkle(x, y, r, alpha) {
    ctx.globalAlpha = alpha; ctx.beginPath();
    ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.28, 0, TAU); ctx.fill();
  }
  function drawTrail() {
    var tr = D.trail; if (!tr) return;
    var w = H * 0.0062;
    var mute = D.p.silenced > 0 && D.phase === 'fight'; // réduit au silence : le tracé vire au rouge, on voit tout de suite que les attaques ne partiront pas
    glowPath(tr.pts, mute ? '#ff3b3b' : D.look.trail || '#3fa2ff', 1, w); // la couleur du tracé se choisit au miroir magique
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = mute ? '#ffc4c4' : D.look.trailHi || '#cfeaff'; ctx.fillStyle = mute ? '#ffd9d9' : '#ffffff'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    tr.stars.forEach(function (s) { var tw = 0.5 + 0.5 * Math.sin(time * 9 + s.ph); sparkle(s.x, s.y, w * s.s * (0.9 + tw * 1.3), 0.35 + 0.65 * tw); });
    ctx.restore();
  }
  function drawGhosts() {
    D.ghosts.forEach(function (gh) {
      var k = gh.t / gh.dur, pts = gh.pts;
      if (gh.mode === 'fail') pts = pts.map(function (p, i) { return { x: p.x + Math.sin(i * 1.7 + gh.t * 9) * 4 * k, y: p.y + k * k * H * 0.12 }; });
      glowPath(pts, gh.color, (1 - k) * (gh.mode === 'ok' ? 1.2 : 0.7), H * 0.0062 * (gh.mode === 'ok' ? 1 + k * 1.6 : 1));
    });
  }
  function drawShot(s) {
    var pos = shotPos(s), r = pos.r * (s.from === 'player' && !s.ally ? DS.spellMul(s.lv).size : 1), id = s.spell.id, c = s.spell.color, i, a; // nos sorts grossissent avec leur niveau
    if (s.sky) return drawSkyBolt(s, pos);
    if (id === 'flammurus') return drawFireWall(s);
    if (id === 'vortex') return drawVortexShot(pos);
    A.glowDot(ctx, pos.x, pos.y, r * 3, c, 0.95);
    ctx.save(); ctx.translate(pos.x, pos.y); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = Math.max(1, r * 0.14);
    if (id === 'scintilla') {
      ctx.rotate(time * 6); ctx.beginPath(); ctx.moveTo(-r * 1.6, 0); ctx.lineTo(r * 1.6, 0); ctx.moveTo(0, -r * 1.6); ctx.lineTo(0, r * 1.6); ctx.stroke();
    } else if (id === 'fulgur') { // un éclat : losange d'argent qui tournoie
      ctx.rotate(time * 9); ctx.beginPath(); ctx.moveTo(0, -r * 1.7); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r * 1.7); ctx.lineTo(-r * 0.7, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(-r * 1.9, 0); ctx.lineTo(r * 1.9, 0); ctx.stroke();
    } else if (id === 'tonnero') { // boule de foudre : des éclairs en jaillissent
      for (i = 0; i < 5; i++) { a = rand(0, TAU); ctx.beginPath(); ctx.moveTo(0, 0); var x1 = Math.cos(a) * r * 1.1, y1 = Math.sin(a) * r * 1.1; ctx.lineTo(x1 + rand(-0.5, 0.5) * r, y1 + rand(-0.5, 0.5) * r); ctx.lineTo(x1 * 2.1, y1 * 2.1); ctx.stroke(); }
      ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, TAU); ctx.fill();
    } else if (id === 'ignis') { // boule de feu : la même flamme que les torches de la salle
      ctx.fillStyle = A.rgba('#ff5a1a', 0.75); ctx.beginPath(); ctx.arc(0, 0, r * 1.05, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over'; A.flame(ctx, 0, r * 0.9, r * 0.95, time, s.sx);
    } else if (id === 'glacius') {
      ctx.rotate(time * 3); for (i = 0; i < 6; i++) { ctx.rotate(TAU / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 1.5, 0); ctx.moveTo(r * 0.9, 0); ctx.lineTo(r * 1.2, r * 0.3); ctx.moveTo(r * 0.9, 0); ctx.lineTo(r * 1.2, -r * 0.3); ctx.stroke(); }
    } else if (id === 'lentus') {
      ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, r * 0.2); ctx.rotate(-time * 2.5); ctx.beginPath();
      for (i = 0; i <= 40; i++) { a = i / 40 * TAU * 2; ctx.lineTo(Math.cos(a) * r * 1.7 * i / 40, Math.sin(a) * r * 1.7 * i / 40); }
      ctx.stroke();
    } else if (id === 'aqua') { // grosse goutte et ses éclaboussures
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = A.rgba('#2f8fe0', 0.85); ctx.beginPath(); ctx.arc(0, 0, r * 1.1, 0, TAU); ctx.fill();
      ctx.fillStyle = A.rgba('#9fd8ff', 0.9); for (i = 0; i < 3; i++) { a = time * 4 + i * 2.1; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.7, Math.sin(a) * r * 1.7, r * 0.25, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.38, r * 0.2, -0.6, 0, TAU); ctx.fill();
    } else if (id === 'tenebra' || id === 'vespera') { // boule de nuit ; croissant d'ombre
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(8,4,20,0.94)'; ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, r * 0.18);
      if (id === 'vespera') { ctx.rotate(time * 5); ctx.beginPath(); ctx.arc(0, 0, r * 1.4, 0.949, TAU - 0.949); ctx.arc(r * 0.6, 0, r * 1.15, TAU - 1.39, 1.39, true); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else {
        ctx.beginPath(); ctx.arc(0, 0, r * 1.2, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff'; for (i = 0; i < 3; i++) { a = time * 1.5 + i * 2.1; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a * 1.3) * r * 0.55, Math.max(0.8, r * 0.07), 0, TAU); ctx.fill(); }
      }
    } else if (id === 'somnus') { // croissant de lune qui se balance
      ctx.rotate(-0.5 + Math.sin(time * 2.2) * 0.3); ctx.fillStyle = '#fff0f8';
      ctx.beginPath(); ctx.arc(0, 0, r * 1.15, 0.949, TAU - 0.949); ctx.arc(r * 0.5, 0, r * 0.95, TAU - 1.39, 1.39, true); ctx.closePath(); ctx.fill();
    } else if (id === 'desarmo') {
      ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, r * 0.2);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.5, r * 0.6, time * 5, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.5, r * 0.6, -time * 5 + 1, 0, TAU); ctx.stroke();
    } else if (id === 'nocturna') { // une boule de nuit, noire, cerclée de flammes mauves qui tournent
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#0a0414'; ctx.beginPath(); ctx.arc(0, 0, r * 1.15, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < 7; i++) { a = time * 5 + i * TAU / 7; var fx = Math.cos(a) * r * 1.2, fy = Math.sin(a) * r * 1.2, fr = r * (0.55 + 0.25 * Math.sin(time * 13 + i * 2)); ctx.fillStyle = i % 2 ? 'rgba(177,76,255,0.85)' : 'rgba(255,120,255,0.7)'; ctx.beginPath(); ctx.moveTo(fx - fr * 0.5, fy); ctx.quadraticCurveTo(fx + Math.cos(a) * fr * 1.6, fy + Math.sin(a) * fr * 1.6, fx + fr * 0.5, fy); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = 'rgba(200,140,255,0.9)'; ctx.lineWidth = Math.max(1, r * 0.18); ctx.beginPath(); ctx.arc(0, 0, r * 1.15, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.3, 0, TAU); ctx.fill();
    } else if (id === 'terra') { // un cube de terre brune qui tourne sur lui-même : trois faces visibles, des mottes et des cailloux dessus
      ctx.globalCompositeOperation = 'source-over'; ctx.rotate(time * 3); ctx.strokeStyle = '#2e1d10'; ctx.lineWidth = Math.max(1, r * 0.1); ctx.lineJoin = 'round';
      var cs = r * 1.15, ox = cs * 0.45, oy = -cs * 0.4; // le cube : face avant, puis le dessus et le côté en perspective
      ctx.fillStyle = '#4e3620'; ctx.beginPath(); ctx.moveTo(cs, -cs); ctx.lineTo(cs + ox, -cs + oy); ctx.lineTo(cs + ox, cs + oy); ctx.lineTo(cs, cs); ctx.closePath(); ctx.fill(); ctx.stroke(); // côté (sombre)
      ctx.fillStyle = '#8a5f36'; ctx.beginPath(); ctx.moveTo(-cs, -cs); ctx.lineTo(-cs + ox, -cs + oy); ctx.lineTo(cs + ox, -cs + oy); ctx.lineTo(cs, -cs); ctx.closePath(); ctx.fill(); ctx.stroke(); // dessus (clair)
      ctx.fillStyle = '#6b4526'; ctx.beginPath(); ctx.rect(-cs, -cs, cs * 2, cs * 2); ctx.fill(); ctx.stroke(); // face avant
      ctx.fillStyle = '#58371c'; [[-0.5, -0.4, 0.28], [0.35, 0.2, 0.22], [-0.2, 0.55, 0.18]].forEach(function (q) { ctx.beginPath(); ctx.arc(q[0] * cs, q[1] * cs, q[2] * cs, 0, TAU); ctx.fill(); }); // des mottes
      ctx.fillStyle = '#a89078'; [[0.45, -0.55, 0.12], [-0.65, 0.3, 0.1], [0.1, -0.05, 0.09]].forEach(function (q) { ctx.beginPath(); ctx.arc(q[0] * cs, q[1] * cs, q[2] * cs, 0, TAU); ctx.fill(); }); // des cailloux
      ctx.strokeStyle = '#3f7a2a'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.beginPath(); ctx.moveTo(-cs * 0.2, -cs + oy * 0.5); ctx.quadraticCurveTo(-cs * 0.1, -cs * 1.6, cs * 0.15, -cs * 1.7); ctx.stroke(); // un brin d'herbe sur le dessus
    } else if (id === 'sagitta') { // une flèche de lumière, pointe en avant
      var sg = s.from === 'player' ? -1 : 1;
      ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, r * 0.22); ctx.beginPath(); ctx.moveTo(0, -sg * r * 1.9); ctx.lineTo(0, sg * r * 1.6); ctx.moveTo(-r * 0.7, sg * r * 0.7); ctx.lineTo(0, sg * r * 1.6); ctx.lineTo(r * 0.7, sg * r * 0.7); ctx.stroke();
    } else if (id === 'tornado') { // un tourbillon
      ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, r * 0.16);
      for (i = 0; i < 4; i++) { var ry = (i - 1.5) * r * 0.6, rx = r * (0.5 + i * 0.3); ctx.beginPath(); ctx.ellipse(Math.sin(time * 9 + i) * r * 0.25, -ry, rx, r * 0.22, 0, 0, TAU); ctx.stroke(); }
    } else if (id === 'toxicus') { // bulles de poison
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = A.rgba('#3aa83a', 0.85);
      for (i = 0; i < 4; i++) { a = time * 3 + i * 1.6; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.7, Math.sin(a * 1.2) * r * 0.7, r * (0.55 + 0.15 * Math.sin(a * 2)), 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(220,255,200,0.8)'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.22, 0, TAU); ctx.fill();
    } else { // les autres : leur petite image dans une bulle de lumière
      ctx.globalCompositeOperation = 'source-over'; ctx.font = Math.round(Math.max(8, r * 2.3)) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.rotate(Math.sin(time * 5) * 0.25); ctx.fillText(s.spell.icon || '✨', 0, r * 0.1);
    }
    ctx.restore();
  }
  // Cible d'un sort qui arrive : un anneau se resserre ; doré = c'est le moment de cliquer.
  function drawIncoming(s) {
    if (s.miss || s.spell.unparry) return; // celui-là passe à côté ; le mur de feu, lui, ne se pare pas
    var left = (1 - s.t) * s.dur, R = parryR() * 0.55, now = left <= SHIELD_T, c = now ? '#ffe9a0' : s.spell.color;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = c;
    ctx.globalAlpha = 0.25 + 0.5 * s.t; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.arc(s.tx, s.ty, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 0.35 + 0.65 * s.t; ctx.lineWidth = now ? 5 : 3; ctx.beginPath(); ctx.arc(s.tx, s.ty, R + parryR() * 2.2 * (1 - s.t), 0, TAU); ctx.stroke();
    ctx.restore();
  }
  // Rayon : plus large d'un bout que de l'autre, halo coloré et cœur blanc ; Infernus y ajoute des flammes.
  function drawBeam(x0, y0, w0, x1, y1, w1, spell) {
    var fire = spell.beam.fire, i; if (fire) { w0 *= 2.4; w1 *= 2.4; } // un souffle de dragon est bien plus large qu'un rayon
    var dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, fl = 0.85 + 0.15 * Math.sin(time * 40);
    var quad = function (k) { ctx.beginPath(); ctx.moveTo(x0 + nx * w0 * k, y0 + ny * w0 * k); ctx.lineTo(x1 + nx * w1 * k, y1 + ny * w1 * k); ctx.lineTo(x1 - nx * w1 * k, y1 - ny * w1 * k); ctx.lineTo(x0 - nx * w0 * k, y0 - ny * w0 * k); ctx.closePath(); ctx.fill(); };
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = A.rgba(spell.color, 0.22 * fl); quad(3);
    ctx.fillStyle = A.rgba(spell.color, 0.6 * fl); quad(1.4);
    ctx.fillStyle = fire ? 'rgba(255,233,160,0.9)' : 'rgba(255,255,255,0.95)'; quad(0.5);
    ctx.restore();
    if (fire) for (i = 1; i <= 9; i++) { var k = (i - (time * 2.5) % 1) / 9, r = lerp(w0, w1, k) * 1.1; if (k > 0.04) A.flame(ctx, lerp(x0, x1, k) + Math.sin(time * 9 + i) * r * 0.5, lerp(y0, y1, k) + r, r, time, i * 1.3); } // des flammes filent le long du souffle
    A.glowDot(ctx, x1, y1, Math.max(w0, w1) * (fire ? 2.6 : 3.2) * fl, spell.color, 0.9);
  }
  // Cours : caisse à casser, ou mannequin d'entraînement — celui de l'image de la classe : pied en croix, poteau, bras en rondin,
  // tête de bois et grand écu blanc et or. Il existe aussi en glace, en fer et en pétard (DUMMY_LOOK).
  var DUMMY_LOOK = {
    mannequin: { post: '#5a3b22', arm: '#8f633a', head: '#dcb27a', line: '#2a1a12', s1: '#f1e8d4', s2: '#e3b33d', rim: '#3a2616' },
    glace: { post: '#7fb8d8', arm: '#a8dcf2', head: '#dcf5ff', line: '#3d7fa6', s1: '#f4fcff', s2: '#9fdcf7', rim: '#4f9cc4', shine: true },
    fer: { post: '#4a4f5c', arm: '#7d8496', head: '#b9c1d0', line: '#1f2330', s1: '#d9dfea', s2: '#8a93a8', rim: '#2b3040', shine: true },
    petard: { post: '#5a3b22', arm: '#8f633a', head: '#e4604f', line: '#3a1210', s1: '#f3dfa8', s2: '#d94a3a', rim: '#5a1a14' },
    canon: { post: '#3a3350', arm: '#6a5a8c', head: '#c9a25e', line: '#1a1528', s1: '#d8b45c', s2: '#8a6a2e', rim: '#2a2238', shine: true } // le Scintillateur du cours de protection
  };
  function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
  // Un mannequin, les pieds en (F.x, F.fy). fall : 0 debout → 1 par terre (la glace fond au lieu de tomber). side : de quel côté il tombe.
  function drawDummy(t, fall, side) {
    var u = F.u * 1.1, L = DUMMY_LOOK[t.kind] || DUMMY_LOOK.mannequin, hit = t.flash > 0 && fall < 1, ice = t.kind === 'glace', e = fall * fall, i;
    ctx.save(); ctx.translate(F.x + (hit ? rand(-1.5, 1.5) * u : 0), F.fy); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 27 * u, 5.5 * u, 0, 0, TAU); ctx.fill();
    if (ice && fall > 0) { ctx.fillStyle = 'rgba(168,220,242,' + 0.75 * e + ')'; ctx.beginPath(); ctx.ellipse(0, 0, 30 * u * e, 6.5 * u * e, 0, 0, TAU); ctx.fill(); } // la flaque
    ctx.strokeStyle = L.line; ctx.lineWidth = 1.2 * u;
    // pied en croix
    ctx.fillStyle = L.post; rrect(-18 * u, -4.5 * u, 36 * u, 5.5 * u, 1.6 * u); ctx.fill(); ctx.stroke(); rrect(-5.5 * u, -8 * u, 11 * u, 7.5 * u, 1.6 * u); ctx.fill(); ctx.stroke();
    if (fall >= 1 && ice) { ctx.restore(); return; }
    if (ice) { ctx.globalAlpha = 1 - e * 0.7; ctx.scale(1 + e * 0.25, 1 - e * 0.9); } // la glace fond sur place
    else { ctx.translate(0, -6 * u); ctx.rotate((t.swing || 0) * 0.42 + e * 1.42 * side); ctx.translate(0, 6 * u); if (fall > 0) ctx.globalAlpha = 1 - e * 0.25; }
    // poteau
    ctx.fillStyle = L.post; ctx.beginPath(); ctx.rect(-3.4 * u, -62 * u, 6.8 * u, 56 * u); ctx.fill(); ctx.stroke();
    // bras : un rondin en travers, avec ses deux bouts sciés
    ctx.fillStyle = L.arm; rrect(-30 * u, -73 * u, 60 * u, 8 * u, 4 * u); ctx.fill(); ctx.stroke();
    ctx.fillStyle = A.shade(L.arm, 0.28); [-1, 1].forEach(function (sd) { ctx.beginPath(); ctx.ellipse(sd * 28.6 * u, -69 * u, 2.1 * u, 3.4 * u, 0, 0, TAU); ctx.fill(); ctx.stroke(); });
    // cou et tête : un bloc de bois aux coins ronds
    ctx.fillStyle = L.post; ctx.beginPath(); ctx.rect(-2.6 * u, -88 * u, 5.2 * u, 7 * u); ctx.fill(); ctx.stroke();
    ctx.fillStyle = hit ? '#ffffff' : L.head; rrect(-10.5 * u, -108 * u, 21 * u, 21 * u, 6 * u); ctx.fill(); ctx.stroke();
    if (!hit) { ctx.save(); ctx.strokeStyle = A.rgba(L.line, 0.22); ctx.lineWidth = 0.7 * u; ctx.beginPath(); ctx.moveTo(-7 * u, -104 * u); ctx.quadraticCurveTo(0, -106 * u, 7 * u, -103.5 * u); ctx.moveTo(-8 * u, -90.5 * u); ctx.quadraticCurveTo(-1 * u, -89 * u, 7.5 * u, -91 * u); ctx.stroke(); ctx.restore(); } // veines du bois
    // visage : étonné quand il prend un coup, inquiet quand il brûle, barbouillé quand il est empoisonné
    ctx.fillStyle = L.line; ctx.lineWidth = 1.1 * u;
    if (hit || fall > 0) {
      [-1, 1].forEach(function (sd) { ctx.beginPath(); ctx.moveTo(sd * 6.2 * u, -100.5 * u); ctx.lineTo(sd * 3 * u, -98.5 * u); ctx.lineTo(sd * 6.2 * u, -96.5 * u); ctx.stroke(); });
      ctx.beginPath(); ctx.ellipse(0, -92.5 * u, 1.8 * u, 2.2 * u, 0, 0, TAU); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(-4.4 * u, -99 * u, 1.45 * u, 0, TAU); ctx.arc(4.4 * u, -99 * u, 1.45 * u, 0, TAU); ctx.fill();
      ctx.beginPath();
      if (t.poison > 0) { ctx.moveTo(-4 * u, -92.5 * u); ctx.quadraticCurveTo(-2 * u, -94.5 * u, 0, -92.5 * u); ctx.quadraticCurveTo(2 * u, -90.5 * u, 4 * u, -92.5 * u); }
      else if (t.burn > 0 || t.quake || t.charge) { ctx.moveTo(-3.6 * u, -91.5 * u); ctx.quadraticCurveTo(0, -94.5 * u, 3.6 * u, -91.5 * u); }
      else { ctx.moveTo(-3.8 * u, -92.5 * u); ctx.lineTo(3.8 * u, -92.5 * u); }
      ctx.stroke();
      if (t.burn > 0 || t.quake) [-1, 1].forEach(function (sd) { ctx.beginPath(); ctx.moveTo(sd * 6.4 * u, -102 * u); ctx.lineTo(sd * 2.6 * u, -103.6 * u); ctx.stroke(); });
    }
    // l'écu : écartelé, bordé de sombre, quatre rivets
    var sx = 18.5 * u, top = -84 * u, mid = -60 * u, tip = -33 * u, shield = function () { ctx.beginPath(); ctx.moveTo(-sx, top); ctx.lineTo(sx, top); ctx.lineTo(sx, mid); ctx.quadraticCurveTo(sx, -43 * u, 0, tip); ctx.quadraticCurveTo(-sx, -43 * u, -sx, mid); ctx.closePath(); };
    ctx.save(); shield(); ctx.clip();
    ctx.fillStyle = L.s1; ctx.fillRect(-sx, top, sx * 2, tip - top);
    ctx.fillStyle = L.s2; ctx.fillRect(0, top, sx, mid - top + 2 * u); ctx.fillRect(-sx, mid + 2 * u, sx, tip - mid);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(sx * 0.45, top, sx, tip - top); // un peu d'ombre sur le côté
    if (L.shine) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(-8 * u, -70 * u, 3.5 * u, 11 * u, 0.35, 0, TAU); ctx.fill(); }
    for (i = 0; i < Math.min(6, t.hits || 0) && !ice; i++) { ctx.fillStyle = 'rgba(40,24,12,0.2)'; ctx.beginPath(); ctx.ellipse(Math.sin(i * 2.4 + 1) * 10 * u, (-60 + Math.cos(i * 1.7) * 16) * u, 3.2 * u, 2.2 * u, i, 0, TAU); ctx.fill(); } // traces des coups reçus
    if (t.poison > 0) { ctx.fillStyle = 'rgba(95,211,95,0.3)'; ctx.fillRect(-sx, top, sx * 2, tip - top); }
    if (hit) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-sx, top, sx * 2, tip - top); }
    ctx.restore();
    ctx.lineWidth = 2.6 * u; ctx.strokeStyle = L.rim; shield(); ctx.stroke();
    ctx.fillStyle = L.rim; [[-13.5, -79.5], [13.5, -79.5], [-13.5, -62], [13.5, -62]].forEach(function (r) { ctx.beginPath(); ctx.arc(r[0] * u, r[1] * u, 1.1 * u, 0, TAU); ctx.fill(); });
    ctx.strokeStyle = L.line; ctx.lineWidth = 1.2 * u;
    if (t.kind === 'petard' && !t.boomed) { // la mèche : entière au repos, elle raccourcit une fois allumée
      var k = t.fuse ? 1 - t.fuse.t / t.fuse.dur : 1, ex = (1 + 9 * k) * u, ey = (-108 - 9 * k) * u;
      ctx.beginPath(); ctx.moveTo(0, -108 * u); ctx.quadraticCurveTo(1.5 * u, ey, ex, ey); ctx.stroke();
      if (t.fuse || !t.auto && t.fuse === undefined) A.glowDot(ctx, ex, ey, (t.fuse ? 5.5 : 4) * u + Math.sin(time * 22) * u, '#ffd36b', 0.95);
    }
    if (t.burn > 0 && fall < 0.5) { A.flame(ctx, -6 * u, -104 * u, 7 * u, time, 1.3); A.flame(ctx, 7 * u, -80 * u, 8 * u, time, 2.9); A.flame(ctx, -11 * u, -56 * u, 7 * u, time, 4.2); }
    ctx.restore();
  }
  function drawCrate(t) {
    var u = F.u, hit = t.flash > 0, sz = 46 * u;
    ctx.save(); ctx.translate(F.x + (hit ? rand(-2, 2) * u : 0), F.fy); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 24 * u, 5 * u, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 1.2 * u;
    ctx.fillStyle = hit ? '#e9c79a' : '#9a6a36'; ctx.fillRect(-sz / 2, -sz, sz, sz); ctx.strokeRect(-sz / 2, -sz, sz, sz);
    ctx.strokeStyle = '#5a3a1a'; ctx.beginPath();
    [0.25, 0.5, 0.75].forEach(function (k) { ctx.moveTo(-sz / 2, -sz * k); ctx.lineTo(sz / 2, -sz * k); });
    ctx.moveTo(-sz / 2, -sz); ctx.lineTo(sz / 2, 0); ctx.moveTo(sz / 2, -sz); ctx.lineTo(-sz / 2, 0); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(-sz / 2, -sz - 9 * u, sz, 4 * u); // ce qu'il lui reste à encaisser
    ctx.fillStyle = '#ff9a8a'; ctx.fillRect(-sz / 2, -sz - 9 * u, sz * Math.max(0, t.hp / t.maxHp), 4 * u);
    ctx.restore();
  }
  function gunDx(k) { var t = D.target, n = t && t.guns || 1; return n > 1 ? (k - (n - 1) / 2) * F.h * 0.9 : 0; } // où se tient la machine numéro k
  function drawTarget() {
    var t = D.target, u = F.u * 1.1, c = F.chest, i;
    if (t.kind === 'baked') return; // le mannequin fait déjà partie de l'image du décor
    if (t.kind === 'caisse') return drawCrate(t);
    if (t.guns) { // les machines du cours de protection : des mannequins de laiton, avec une gueule de canon qui chauffe juste avant de tirer (t.heat)
      for (i = 0; i < t.guns; i++) {
        var heat = t.heat ? t.heat[i] || 0 : 0, gy = c.y - 4 * u;
        ctx.save(); ctx.translate(gunDx(i), 0); drawDummy(t, 0, 1);
        ctx.fillStyle = '#d8b45c'; ctx.beginPath(); ctx.arc(F.x, gy, 11 * u, 0, TAU); ctx.fill();
        ctx.fillStyle = '#17132a'; ctx.beginPath(); ctx.arc(F.x, gy, 8 * u, 0, TAU); ctx.fill();
        if (heat > 0) A.glowDot(ctx, F.x, gy, (10 + 18 * heat) * u, '#7fd4ff', 0.9 * heat);
        ctx.restore();
      }
      return;
    }
    if (t.row) {
      ctx.save(); ctx.strokeStyle = '#7d8496'; ctx.lineWidth = 2.2 * u; ctx.setLineDash([3 * u, 2.2 * u]); // la chaîne qui les relie
      for (i = 0; i < 2; i++) if (t.row[i] > 0 && t.row[i + 1] > 0) { ctx.beginPath(); ctx.moveTo(F.x + rowDx(i) + 29 * u, F.fy - 68 * u); ctx.quadraticCurveTo(F.x + (rowDx(i) + rowDx(i + 1)) / 2, F.fy - 60 * u, F.x + rowDx(i + 1) - 29 * u, F.fy - 68 * u); ctx.stroke(); }
      ctx.restore();
      t.row.forEach(function (hp, k) { ctx.save(); ctx.translate(rowDx(k), 0); drawDummy(t, hp > 0 ? 0 : t.fallen ? t.fallen[k] || 1 : 1, k === 0 ? -1 : 1); ctx.restore(); });
      if (t.row.some(function (hp) { return hp > 0; })) { // petite flèche : celui que vise notre baguette
        var ax = F.x + rowDx(rowSlot()), ay = F.fy - (128 + Math.sin(time * 6) * 3) * u, r = 7 * u;
        ctx.save(); ctx.fillStyle = '#ffe9a0'; ctx.strokeStyle = 'rgba(10,8,24,0.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax - r, ay - r); ctx.lineTo(ax + r, ay - r); ctx.lineTo(ax, ay + r * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      return;
    }
    var down = t.auto && !(t.hp > 0);
    if (t.boomed && t.debris) { // le mannequin pétard en morceaux
      ctx.save(); ctx.lineJoin = 'round';
      t.debris.forEach(function (d) {
        ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.r); ctx.fillStyle = d.col; ctx.strokeStyle = DUMMY_LOOK.petard.line; ctx.lineWidth = 1.2 * u;
        if (d.head) { ctx.beginPath(); ctx.ellipse(0, 0, d.w / 2, d.h / 2, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = DUMMY_LOOK.petard.line; ctx.beginPath(); ctx.arc(-d.w * 0.18, -d.h * 0.1, d.w * 0.07, 0, TAU); ctx.arc(d.w * 0.18, -d.h * 0.1, d.w * 0.07, 0, TAU); ctx.fill(); }
        else { rrect(-d.w / 2, -d.h / 2, d.w, d.h, 1.5 * u); ctx.fill(); ctx.stroke(); }
        ctx.restore();
      });
      ctx.restore(); return;
    }
    if (t.pop) { ctx.save(); ctx.translate(F.x, F.fy); var pk = 1 - t.pop / 0.6, sc = 0.3 + 0.7 * (1 - (1 - pk) * (1 - pk)) * (1 + 0.18 * Math.sin(pk * Math.PI)); ctx.scale(sc, sc); ctx.translate(-F.x, -F.fy); drawDummy(t, t.fall || 0, 1); ctx.restore(); return; } // le neuf arrive en grandissant
    drawDummy(t, t.fall || 0, 1);
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (t.mist) for (i = 0; i < 7; i++) { var ang = time * 0.7 + i * 0.9; fog(F.x + Math.cos(ang) * 30 * u, F.fy - (12 + i * 15) * u + Math.sin(ang * 1.3) * 5 * u, 40 * u, 18 * u, 0.5); }
    if (t.guard && !down) { // bouclier magique : une bulle dorée devant lui
      var gl = t.guardFlash > 0 ? 1 : 0, gr = ctx.createRadialGradient(F.x, c.y - 6 * u, 8 * u, F.x, c.y - 6 * u, 56 * u);
      gr.addColorStop(0, 'rgba(255,217,120,' + (0.05 + gl * 0.25) + ')'); gr.addColorStop(0.8, 'rgba(255,217,120,' + (0.2 + gl * 0.3) + ')'); gr.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(F.x, c.y - 6 * u, 40 * u, 56 * u, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,233,160,' + (0.55 + 0.2 * Math.sin(time * 4) + gl * 0.25) + ')'; ctx.lineWidth = 2.2 * u; ctx.beginPath(); ctx.ellipse(F.x, c.y - 6 * u, 38 * u, 54 * u, 0, 0, TAU); ctx.stroke();
    }
    if (t.spot && t.spot.x !== undefined && !down) { // petit bouclier rond
      var sr = guardR(), g2 = ctx.createRadialGradient(t.spot.x, t.spot.y, sr * 0.2, t.spot.x, t.spot.y, sr);
      g2.addColorStop(0, 'rgba(160,215,255,0.25)'); g2.addColorStop(1, 'rgba(120,190,255,0.6)');
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(t.spot.x, t.spot.y, sr, 0, TAU); ctx.fill(); ctx.strokeStyle = '#d8f0ff'; ctx.lineWidth = 2.4 * u; ctx.stroke();
    }
    if (t.charge && !down) { // le seau d'eau qui se remplit au-dessus de sa tête
      var k = clamp(t.charge.t / t.charge.dur, 0, 1), bx = F.x + 48 * u, by = F.fy - 110 * u, br = 13 * u;
      ctx.fillStyle = 'rgba(10,8,24,0.6)'; ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill();
      ctx.strokeStyle = k > 0.75 ? '#ff8a6a' : '#6fc3ff'; ctx.lineWidth = 3.4 * u; ctx.beginPath(); ctx.arc(bx, by, br, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
      ctx.font = Math.round(15 * u) + 'px sans-serif'; ctx.fillStyle = '#fff'; ctx.save(); ctx.translate(bx, by); ctx.rotate(k > 0.75 ? Math.sin(time * 30) * 0.2 : 0); ctx.fillText('🪣', 0, 1 * u); ctx.restore();
    }
    if (t.auto && t.maxHp && !t.noBar) { // sa barre de vie
      var bw = 62 * u, hy = F.fy - 124 * u, hp = Math.max(0, t.hp);
      ctx.fillStyle = 'rgba(10,8,24,0.75)'; rrect(F.x - bw / 2 - 1.5 * u, hy - 1.5 * u, bw + 3 * u, 10 * u, 3 * u); ctx.fill();
      ctx.fillStyle = t.poison > 0 ? '#5fd35f' : t.burn > 0 ? '#ff9a4a' : '#ff6b5e'; if (hp > 0) { rrect(F.x - bw / 2, hy, bw * hp / t.maxHp, 7 * u, 2 * u); ctx.fill(); }
      ctx.font = 'bold ' + Math.round(8.5 * u) + 'px ' + FONT; ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(10,8,24,0.9)'; ctx.fillStyle = '#fff';
      ctx.strokeText(Math.ceil(hp) + ' / ' + t.maxHp, F.x, hy - 7.5 * u); ctx.fillText(Math.ceil(hp) + ' / ' + t.maxHp, F.x, hy - 7.5 * u);
    } else if (t.icon) { ctx.font = Math.round(15 * u) + 'px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(t.icon, F.x, F.fy + (-124 + Math.sin(time * 3) * 1.5) * u); }
    ctx.restore();
  }
  // Cours : des traits à faire l'un après l'autre. strokes : [{ x0, y0, x1, y1 } en fractions de l'écran, state: 'next' | 'done' | 'todo'].
  // demo : { t0, per, gap, order } — une lumière trace les traits dans l'ordre donné (per secondes par trait, gap entre deux) ; onBeat(i) et onEnd() préviennent la leçon.
  function drawStrokes(gd) {
    ctx.save(); ctx.lineCap = 'round';
    gd.strokes.forEach(function (st) {
      var x0 = st.x0 * W, y0 = st.y0 * H, x1 = st.x1 * W, y1 = st.y1 * H, done = st.state === 'done', next = st.state === 'next', a = done ? 0.3 : next ? 1 : 0.5;
      var line = function () { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
      ctx.strokeStyle = done ? 'rgba(125,255,154,0.4)' : A.rgba(gd.color, next ? 0.42 : 0.22); ctx.lineWidth = H * 0.032; line();
      ctx.setLineDash([H * 0.004, H * 0.022]); ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.lineWidth = H * 0.006; line(); ctx.setLineDash([]);
      if (done) return;
      var r = H * 0.016, ux = (x1 - x0), uy = (y1 - y0);
      ctx.save(); ctx.translate(x0 + ux * 0.82, y0 + uy * 0.82); ctx.rotate(Math.atan2(uy, ux)); ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
      ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(-r * 0.7, r * 0.75); ctx.lineTo(-r * 0.7, -r * 0.75); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = next ? 'rgba(110,255,150,1)' : 'rgba(110,255,150,0.45)'; ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x0, y0, r * (next ? 1 + 0.2 * Math.sin(time * 6) : 0.8), 0, TAU); ctx.fill(); ctx.stroke();
    });
    var d = gd.demo;
    if (d && !d.ended) {
      var order = d.order || gd.strokes.map(function (st, i) { return i; }), step = d.per + d.gap, t = D.time - d.t0, i = Math.floor(t / step), u = (t - i * step) / d.per;
      if (t >= 0 && i < order.length) {
        if (d.last !== i) { d.last = i; if (d.onBeat) d.onBeat(i); }
        if (u <= 1.25) {
          var st = gd.strokes[order[i]], k = Math.min(1, u), px = lerp(st.x0, st.x1, k) * W, py = lerp(st.y0, st.y1, k) * H;
          glowPath([{ x: st.x0 * W, y: st.y0 * H }, { x: px, y: py }], '#3fa2ff', u > 1 ? 1 - (u - 1) * 4 : 1, H * 0.0062);
          if (u <= 1) A.glowDot(ctx, px, py, H * 0.035, '#ffffff', 0.95);
        }
      } else if (t >= 0) { d.ended = true; if (d.onEnd) d.onEnd(); }
    }
    ctx.restore();
  }
  // Cours : le tracé modèle à suivre — bande de couleur, pointillés, flèches, point de départ vert et petite lumière qui montre le chemin.
  function drawGuide() {
    var gd = D.guide; if (!gd) return;
    if (gd.strokes) return drawStrokes(gd);
    if (gd.alpha <= 0.01) return;
    if (gd.size !== W + 'x' + H) { gd.size = W + 'x' + H; gd.pts = G.template(gd.glyph, 64).map(function (q) { return { x: W / 2 + (gd.flip ? -q.x : q.x) * H * gd.k, y: H * gd.cy + q.y * H * gd.k }; }); }
    var pts = gd.pts, a = gd.alpha, n = pts.length, i, strong = Math.min(1, a * 1.6);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (i = 1; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = A.rgba(gd.color, a * 0.32); ctx.lineWidth = H * 0.032; ctx.stroke();
    ctx.setLineDash([H * 0.004, H * 0.022]); ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.lineWidth = H * 0.006; ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
    [0.3, 0.62, 0.9].forEach(function (k) {
      var j = Math.floor(k * (n - 2)), q = pts[j], q2 = pts[j + 1], r = H * 0.016;
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(Math.atan2(q2.y - q.y, q2.x - q.x));
      ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(-r * 0.7, r * 0.75); ctx.lineTo(-r * 0.7, -r * 0.75); ctx.closePath(); ctx.fill(); ctx.restore();
    });
    ctx.fillStyle = 'rgba(110,255,150,' + strong + ')'; ctx.strokeStyle = 'rgba(255,255,255,' + strong + ')'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, H * 0.016 * (1 + 0.2 * Math.sin(time * 6)), 0, TAU); ctx.fill(); ctx.stroke();
    if (gd.comet) {
      ctx.font = 'bold ' + Math.round(H * 0.022) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(160,255,190,' + strong + ')'; ctx.fillText('Départ', pts[0].x, pts[0].y - H * 0.032);
      var k2 = (time * 0.45) % 1.3;
      if (k2 <= 1) { var fl = k2 * (n - 1), j2 = Math.min(n - 2, Math.floor(fl)), tt = fl - j2; A.glowDot(ctx, lerp(pts[j2].x, pts[j2 + 1].x, tt), lerp(pts[j2].y, pts[j2 + 1].y, tt), H * 0.035, '#ffffff', 0.95); }
    }
    ctx.restore();
  }
  // L'adversaire lui-même (dessiné une fois par copie quand il s'est dédoublé : toutes font exactement la même chose).
  function drawFoeBody(mb) { // mb : un monstre d'une horde (sinon, l'adversaire lui-même)
    var f = D.f, u = F.u, pose = { wand: f.wd, age: f.age }, tip, i, ch = mb ? mb.ch : f.ch, flash = mb ? mb.flash : f.flash, fall = mb ? mb.fall : f.fall, dead = mb ? mb.hp <= 0 : f.hp <= 0, lead = !mb || mb === D.pack.m[D.pack.act];
    if (flash > 0) { pose.tint = ['#ffffff', 0.65]; pose.face = 'hit'; }
    else if (f.frozen > 0) pose.tint = ['#bfe9ff', 0.6];
    else if (f.asleep > 0) pose.tint = ['#ff9ad5', 0.22];
    else if (f.soaked > 0 || f.whirl > 0) pose.tint = ['#4fb8ff', 0.3];
    else if (f.slowed > 0) pose.tint = ['#a6e36a', 0.3];
    else if (f.poison > 0) pose.tint = ['#5fd35f', 0.28];
    else if (f.dazzled > 0) pose.tint = ['#ffffff', 0.35];
    else if (f.bastion > 0) pose.tint = ['#a89a84', 0.4];
    else if (f.burn > 0) pose.tint = ['#ff8a3a', 0.22];
    if (dead) pose.face = 'hit';
    else if (!pose.face && f.asleep > 0 && eyeOpen(f.sleepT) < 0.4) pose.face = 'sleep';
    if (f.disarmed > 0) pose.noWand = true;
    else if (!lead) tip = null;
    else if (f.state === 'cast') { if (ch.monster) { tip = null; pose.face = pose.face || 'cast'; pose.glow = f.spell.color; pose.charge = f.castT / f.castDur; } else { var gp = foeGlyphPts(f.castT / f.castDur); tip = gp[gp.length - 1]; pose.face = pose.face || 'cast'; pose.glow = f.spell.color; } }
    else if (f.state === 'beam' && D.beams.f) { tip = { x: F.x - 20 * u, y: F.fy - 74 * u }; pose.face = pose.face || 'cast'; pose.glow = D.beams.f.spell.color; }
    else if (f.shield > 0 || f.state === 'guard') tip = { x: F.x - 6 * u, y: F.fy - 96 * u };
    else if (D.phase === 'end' && !D.result) { tip = { x: F.x - 26 * u, y: F.fy - 122 * u }; pose.face = 'happy'; pose.glow = '#ffe9a0'; }
    else tip = { x: F.x - 31 * u + Math.sin(f.swayT * 1.3) * 2 * u, y: F.fy - 66 * u + Math.cos(f.swayT * 1.7) * 1.5 * u };
    if (tip) pose.tip = { x: tip.x - F.x, y: tip.y - F.fy };
    ctx.save(); ctx.translate(F.x, F.fy);
    if (f.inverted > 0 && f.hp > 0) { var ivk = Math.min(1, (f.hexMax - f.inverted) * 2.5, f.inverted * 2.5), iva = 0.5 - 0.5 * Math.cos(Math.PI * ivk); ctx.translate(0, -F.h * 0.55 * iva - Math.sin(time * 3) * 4 * u * iva); ctx.rotate(Math.PI * iva + Math.sin(time * 2.2) * 0.08 * iva); ctx.translate(0, -F.h * 0.55 * iva); } // Inversium : il s'envole et se retrouve la tête en bas
    if (f.invis > 0) ctx.globalAlpha = 0.12 + 0.08 * Math.sin(time * 9); // Evanesco : une silhouette à peine là
    if (f.blizzard > 0 && f.hp > 0) ctx.translate(rand(-1.5, 1.5) * u, rand(-1, 1) * u);
    if (fall > 0) { var e = fall * fall; ctx.rotate(e * 1.45); ctx.globalAlpha = 1 - e * (mb ? 1 : 0.15); }
    else if (f.sneezeAnim > 0 && lead) { ctx.rotate(Math.sin(f.sneezeAnim / 0.5 * Math.PI) * 0.2); pose.face = 'hit'; } // il éternue : plié en deux
    if (mb && mb.age < 0.5) { var ak = mb.age / 0.5; ctx.scale(0.3 + 0.7 * ak, 0.3 + 0.7 * ak); } // un monstre qui arrive surgit du sol
    if (ch.monster) { pose.t = time; A.drawMonster(ctx, ch, 0, 0, F.h * (mb ? clamp((ch.size || 1) / (f.ch.size || 1), 0.8, 1.25) : 1), pose); } else A.drawWizard(ctx, ch, 0, 0, F.h, pose); // un monstre de l'aventure, ou un sorcier
    ctx.restore();
    if (mb && (!lead || dead)) return; // les autres monstres de la horde : seulement leur corps

    if (f.disarmed > 0 && f.hp > 0 && !f.ch.monster) { // sa baguette vole dans une direction au hasard : il la rattrape… ou elle reste par terre
      var q = f.caught ? 1 - f.disarmed / f.disarmMax : Math.min(1, (f.disarmMax - f.disarmed) / 0.8), dir = f.disarmDir, hx = F.x - 30 * u; // hx : sa main
      var wx = hx + dir * (f.caught ? Math.sin(q * Math.PI) * 30 : q * 30) * u, wy = F.fy - 60 * u - Math.sin(q * Math.PI) * 50 * u + (f.caught ? 0 : q * 57 * u), an = q * TAU * 2 + 0.3, flat = !f.caught && q >= 1 ? 0.25 : 1;
      A.drawWand(ctx, wx - Math.cos(an) * 10 * u, wy - Math.sin(an) * 10 * u * flat, wx + Math.cos(an) * 10 * u, wy + Math.sin(an) * 10 * u * flat, 1.5 * u, 0.6 * u, f.wd);
    }
    if (f.hp <= 0) return;
    if (f.burn > 0) { // il brûle : les mêmes flammes que les torches de la salle
      var bk = Math.min(1, f.burn / 0.4);
      [[-15, -2, 5.5], [14, -1, 6], [-10, -70, 3.6], [11, -68, 3.4], [0, -99, 3.2], [2, -30, 4.5]].forEach(function (q2, n) { A.flame(ctx, F.x + q2[0] * u, F.fy + q2[1] * u, q2[2] * u * bk, time, n * 1.9); });
    }
    if (f.blind > 0) { // un nuage de nuit lui cache les yeux
      ctx.save(); ctx.fillStyle = 'rgba(14,8,30,' + 0.82 * Math.min(1, f.blind / 0.4) + ')';
      for (i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(F.x + Math.cos(time * 1.3 + i * 1.9) * 7 * u, F.fy - 90 * u + Math.sin(time * 1.7 + i * 2.3) * 3.5 * u, 8 * u, 5.5 * u, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    if (f.dazzled > 0) A.glowDot(ctx, F.x, F.fy - 89 * u, 22 * u * (0.6 + 0.4 * f.dazzled / f.hexMax), '#ffffff', 0.9); // une lumière aveuglante devant ses yeux
    if (f.silenced > 0 || f.inverted > 0 || f.heavy > 0 || f.fast > 0 || f.noShield > 0) { // les autres maléfices : leur icône flotte au-dessus de sa tête
      ctx.save(); ctx.font = Math.round(13 * u) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(f.silenced > 0 ? '🤫' : f.inverted > 0 ? '🔄' : f.heavy > 0 ? '⚓' : f.fast > 0 ? '🐇' : '🔨', F.x, F.fy - (118 + Math.sin(time * 3) * 2) * u); ctx.restore();
    }
    if (f.mist > 0) { // Vapor : des volutes de brume tournent autour de lui
      for (i = 0; i < 7; i++) { var ang = time * 0.7 + i * 0.9; fog(F.x + Math.cos(ang) * 26 * u, F.fy - (15 + i * 13) * u + Math.sin(ang * 1.3) * 5 * u, 34 * u, 16 * u, 0.42 * Math.min(1, f.mist / 0.5)); }
    }
    var n = 0; // les autres renforts : un anneau de couleur à ses pieds
    BUFF_KEYS.forEach(function (k) {
      if (f[k] <= 0 || k === 'ward' || k === 'mist' || k === 'absorb' || k === 'mirror') return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = A.rgba(BUFFS[k], 0.85 * Math.min(1, f[k] / 0.5) * (0.7 + 0.3 * Math.sin(time * 5 + n))); ctx.lineWidth = Math.max(2, 1.6 * u);
      ctx.beginPath(); ctx.ellipse(F.x, F.fy - 2 * u, (25 + n * 5) * u, (6 + n * 1.4) * u, 0, 0, TAU); ctx.stroke(); ctx.restore(); n++;
    });
    if (f.amp > 0) { ctx.save(); ctx.font = Math.round(11 * u) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⏫', F.x + 22 * u, F.fy - 100 * u); ctx.restore(); }
    if (f.state === 'cast' && !f.ch.monster) glowPath(foeGlyphPts(f.castT / f.castDur), f.spell.color, 1, H * 0.0042);
    if (f.state === 'cast' && f.ch.monster) { var ck = f.castT / f.castDur; ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glowDot(ctx, F.x, F.chest.y, F.h * (0.25 + 0.35 * ck), f.spell.color, 0.35 + 0.45 * ck); ctx.restore(); } // la magie monte en lui
    if (f.frozen > 0) iceBlock(F.x, F.fy, u, Math.min(1, f.frozen / 0.25));
    if (f.ward > 0) bubble(F.x, F.chest.y, F.h * 0.4, F.h * 0.64, '255,217,120', Math.min(1, f.ward / 0.5) * (0.75 + 0.25 * Math.sin(time * 4))); // Aegis
    if (f.absorb > 0) bubble(F.x, F.chest.y, F.h * 0.37, F.h * 0.61, '127,176,255', Math.min(1, f.absorb / 0.5) * (0.7 + 0.3 * Math.sin(time * 6)));
    if (f.mirror > 0) bubble(F.x, F.chest.y, F.h * 0.34, F.h * 0.58, '235,240,250', Math.min(1, f.mirror / 0.5) * (0.8 + 0.2 * Math.sin(time * 9)));
    if (f.shield > 0) bubble(F.x, F.chest.y, F.h * 0.36, F.h * 0.6, '150,215,255', Math.min(1, f.shield / 0.3));
    if (f.state === 'guard' && f.guard) bubble(f.guard.x, f.guard.y, guardR(), guardR(), '150,215,255', 1); // petit bouclier qui court après notre rayon
  }
  function drawFoe() {
    if (D.target) return drawTarget();
    if (D.pack) { // la horde : chaque monstre à sa place, le mort s'efface ; celui qui lance est dessiné en dernier, avec ses effets
      var pk = D.pack, lead = pk.m[pk.act];
      pk.m.forEach(function (mb, i) { if (mb === lead || mb.fall >= 1) return; ctx.save(); ctx.translate(foeSlotDx(i), 0); drawFoeBody(mb); ctx.restore(); });
      if (lead.fall < 1) drawFoeBody(lead);
      return;
    }
    var cp = D.f.copies;
    if (!cp) return drawFoeBody();
    aliveSlots(cp).forEach(function (i) { ctx.save(); ctx.translate(foeSlotDx(i), 0); drawFoeBody(); ctx.restore(); });
    var aim = aimSlot(), x = F.x + foeSlotDx(aim), y = F.fy - (128 + Math.sin(time * 6) * 3) * F.u, r = 7 * F.u; // petite flèche : la copie que vise notre baguette
    ctx.save(); ctx.fillStyle = '#ffe9a0'; ctx.strokeStyle = 'rgba(10,8,24,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y - r); ctx.lineTo(x, y + r * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  // Glacius : un bloc de glace autour du sorcier.
  function iceBlock(x, fy, u, a) {
    var x0 = x - 27 * u, x1 = x + 27 * u, y0 = fy - 114 * u, y1 = fy + 3 * u, d = 9 * u;
    ctx.save(); ctx.globalAlpha = a; ctx.lineJoin = 'round';
    var gr = ctx.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(225,246,255,0.62)'); gr.addColorStop(0.5, 'rgba(150,215,255,0.38)'); gr.addColorStop(1, 'rgba(110,180,240,0.55)');
    ctx.fillStyle = gr; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = 'rgba(235,250,255,0.5)'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + d, y0 - d); ctx.lineTo(x1 + d, y0 - d); ctx.lineTo(x1, y0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(120,190,240,0.45)'; ctx.beginPath(); ctx.moveTo(x1, y0); ctx.lineTo(x1 + d, y0 - d); ctx.lineTo(x1 + d, y1 - d); ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1.5, u); ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.lineWidth = Math.max(1, u * 0.7); ctx.beginPath(); ctx.moveTo(x0 + 6 * u, y0 + 30 * u); ctx.lineTo(x0 + 20 * u, y0 + 8 * u); ctx.moveTo(x0 + 10 * u, y0 + 46 * u); ctx.lineTo(x0 + 30 * u, y0 + 14 * u); ctx.moveTo(x1 - 8 * u, y1 - 12 * u); ctx.lineTo(x1 - 18 * u, y1 - 34 * u); ctx.stroke();
    ctx.restore();
  }
  // Murus : un mur de pierre entre nous deux, fendu à mesure qu'on l'entame.
  function drawWall() { // Murus : un mur de pierres runiques, scellé de magie (un liseré de lumière entre les pierres, des runes qui flottent, un dôme de lueur), qui se fissure et noircit à mesure qu'on le frappe
    var w = D.wall; if (!w) return;
    var u = F.u, cx = D.scene ? F.x : geo.foe.x, half = Math.max(F.h * 0.95, D.f.copies ? W * (COPY_GAP + 0.09) : 0), top = F.fy - 76 * u, bot = F.fy + 30 * u, k = 1 - Math.pow(1 - w.rise, 3), y0 = bot - (bot - top) * k, bh = 14 * u, bw = 34 * u, row, x, i;
    var hurt = 1 - w.hp / w.max, col = w.spellColor || '#d8c8ff', pulse = 0.5 + 0.5 * Math.sin(time * 3), glow = 0.35 + 0.25 * pulse;
    // le halo magique derrière le mur
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var hg = ctx.createRadialGradient(cx, (y0 + bot) / 2, 10 * u, cx, (y0 + bot) / 2, half * 1.1); hg.addColorStop(0, 'rgba(190,170,255,' + 0.22 * k + ')'); hg.addColorStop(1, 'rgba(190,170,255,0)');
    ctx.fillStyle = hg; ctx.fillRect(cx - half * 1.2, y0 - 40 * u, half * 2.4, bot - y0 + 60 * u); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(cx - half, y0 - 10 * u, half * 2, bot - y0 + 10 * u); ctx.clip();
    // les pierres : chacune avec sa teinte, biseautée, plus sombre vers le bas et vers la fin
    var seedAt = function (n) { return (Math.sin(n * 12.9898) * 43758.5453) % 1; };
    for (row = 0; y0 + row * bh < bot + bh; row++) {
      var y = y0 + row * bh, off = row % 2 ? bw / 2 : 0, n = 0;
      for (x = cx - half - off; x < cx + half; x += bw, n++) {
        var sd = Math.abs(seedAt(row * 31 + n * 7 + 3)), tone = 0.82 + sd * 0.25, dark = 1 - 0.35 * (row / 7) - hurt * 0.35 * Math.abs(seedAt(row * 5 + n * 13));
        var rr = Math.round(120 * tone * dark), gg = Math.round(112 * tone * dark), bb = Math.round(130 * tone * dark);
        ctx.fillStyle = 'rgb(' + rr + ',' + gg + ',' + bb + ')'; rrect(x + 1.2 * u, y + 1.2 * u, bw - 2.4 * u, bh - 2.4 * u, 2.5 * u); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x + 1.2 * u, y + 1.2 * u, bw - 2.4 * u, 2 * u); // le biseau clair du haut
        ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x + 1.2 * u, y + bh - 3.6 * u, bw - 2.4 * u, 2.4 * u);   // l'ombre du bas
      }
    }
    // le liseré de magie entre les pierres
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = col; ctx.globalAlpha = glow * (1 - hurt * 0.6); ctx.lineWidth = Math.max(1, u * 0.9); ctx.beginPath();
    for (row = 0; y0 + row * bh < bot; row++) { var yy = y0 + row * bh; ctx.moveTo(cx - half, yy); ctx.lineTo(cx + half, yy); for (x = cx - half + (row % 2 ? bw / 2 : 0); x < cx + half; x += bw) { ctx.moveTo(x, yy); ctx.lineTo(x, yy + bh); } }
    ctx.stroke(); ctx.restore();
    // les runes gravées, qui luisent chacune à leur rythme
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.font = 'bold ' + Math.round(9 * u) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ'];
    for (i = 0; i < 9; i++) { var rx = cx - half * 0.85 + (i / 8) * half * 1.7, ry = y0 + (0.2 + 0.6 * Math.abs(seedAt(i * 3 + 1))) * (bot - y0), al = (0.3 + 0.7 * Math.abs(Math.sin(time * 1.7 + i * 1.3))) * (1 - hurt * 0.7); if (ry > bot - 6 * u) continue; ctx.fillStyle = col; ctx.globalAlpha = al; ctx.fillText(runes[i % runes.length], rx, ry); }
    ctx.restore();
    // les créneaux
    ctx.fillStyle = '#6a6278'; for (x = cx - half; x < cx + half; x += bw * 1.5) { rrect(x, y0 - 8 * u, bw * 0.8, 10 * u, 2 * u); ctx.fill(); }
    // les fissures : plus le mur a encaissé, plus elles s'étendent, noircies de magie qui s'échappe
    ctx.strokeStyle = 'rgba(16,10,22,0.9)'; ctx.lineWidth = Math.max(1.5, u * 1.3); ctx.lineJoin = 'round';
    for (i = 0; i < Math.round(hurt * w.max * 1.8); i++) {
      var sx = cx + Math.sin(i * 2.7 + 1) * half * 0.8, sy = y0 + (0.1 + 0.6 * ((i * 0.37) % 1)) * (bot - y0);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 9 * u, sy + 12 * u); ctx.lineTo(sx + 2 * u, sy + 22 * u); ctx.lineTo(sx + 12 * u, sy + 36 * u); ctx.moveTo(sx + 9 * u, sy + 12 * u); ctx.lineTo(sx + 20 * u, sy + 15 * u); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = col; ctx.globalAlpha = 0.35 * pulse; ctx.lineWidth = Math.max(1, u * 0.6); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 9 * u, sy + 12 * u); ctx.lineTo(sx + 2 * u, sy + 22 * u); ctx.stroke(); ctx.restore(); // la magie suinte des fissures
    }
    if (w.flash > 0) { ctx.fillStyle = 'rgba(255,240,210,' + w.flash * 2.5 + ')'; ctx.fillRect(cx - half, y0 - 10 * u, half * 2, bot - y0 + 10 * u); }
    ctx.restore();
    // le voile de lumière devant le mur, et les étincelles qui montent
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var vg = ctx.createLinearGradient(0, y0 - 10 * u, 0, bot); vg.addColorStop(0, 'rgba(200,180,255,' + 0.16 * (1 - hurt) + ')'); vg.addColorStop(1, 'rgba(200,180,255,0)');
    ctx.fillStyle = vg; ctx.fillRect(cx - half, y0 - 10 * u, half * 2, bot - y0 + 10 * u);
    for (i = 0; i < 10; i++) { var st = (time * 0.35 + i * 0.1) % 1, px = cx - half + ((i * 0.618) % 1) * half * 2, py = bot - st * (bot - y0 + 20 * u); ctx.fillStyle = col; ctx.globalAlpha = (1 - st) * 0.6 * (1 - hurt * 0.5); ctx.beginPath(); ctx.arc(px, py, (1 + (i % 3)) * u * 0.5, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.font = 'bold ' + Math.round(9 * u) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,8,24,0.85)'; ctx.fillStyle = '#e8dcc4';
    var lbl = '🧱 ' + Math.ceil(w.hp) + ' / ' + w.max; ctx.strokeText(lbl, cx - half + 20 * u, y0 - 15 * u); ctx.fillText(lbl, cx - half + 20 * u, y0 - 15 * u); ctx.restore(); // ce qu'il lui reste à encaisser
  }
  // Bulle de protection : bord lumineux, centre transparent.
  function bubble(x, y, rx, ry, rgbStr, al) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.scale(rx / ry, 1);
    var gr = ctx.createRadialGradient(0, 0, ry * 0.2, 0, 0, ry);
    gr.addColorStop(0, 'rgba(' + rgbStr + ',0)'); gr.addColorStop(0.82, 'rgba(' + rgbStr + ',' + 0.2 * al + ')'); gr.addColorStop(1, 'rgba(' + rgbStr + ',' + 0.55 * al + ')');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, ry, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,' + 0.55 * al + ')'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }
  function drawPlayer() {
    var p = D.p, R = parryR(), tracing = !!D.trail, b = D.beams.p, cp = p.copies, tip = wand, n = 0, tot = 0;
    if (b) tip = { x: lerp(W * 0.56, wand.x, 0.3), y: lerp(H * 0.92, wand.y, 0.3) }; // pendant un rayon, la baguette pointe vers l'endroit visé
    if (cp) aliveSlots(cp).forEach(function (i) { // nos doubles : ils font exactement les mêmes gestes
      if (i === 1) return;
      ctx.save(); ctx.globalAlpha = 0.45 * Math.min(1, cp.spread * 2); ctx.translate(ghostDx(i) * cp.spread, 0);
      drawTrail(); A.drawPlayerWand(ctx, W, H, tip, D.ch, D.wd, { hidden: p.disarmed > 0, glow: tracing ? 1 : 0, color: tracing ? '#7fc4ff' : D.wd.glow });
      if (b) drawBeam(tip.x, tip.y, H * 0.012, wand.x, wand.y, H * 0.006, b.spell);
      ctx.restore();
    });
    A.drawPlayerWand(ctx, W, H, tip, D.ch, D.wd, { hidden: p.disarmed > 0, glow: tracing || b ? 1 : 0, color: b ? b.spell.color : tracing ? D.look.trailHi || '#7fc4ff' : p.swipe > 0 ? '#ffd978' : D.wd.glow });
    if ((p.amp > 0 || p.fortis > 0) && p.disarmed <= 0) { // Amplio, Fortis : la baguette s'enflamme sur toute sa longueur
      var hx = W * 0.72, hy = H * 1.02, fi; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (fi = 0; fi < 7; fi++) { var fk = 0.15 + fi * 0.13, fx2 = lerp(hx, tip.x, fk), fy2 = lerp(hy, tip.y, fk); A.flame(ctx, fx2 + Math.sin(time * 9 + fi * 2) * H * 0.004, fy2, H * (0.022 + 0.01 * Math.sin(time * 11 + fi)) * (0.6 + fk * 0.6), time, fi * 1.3); }
      A.flame(ctx, tip.x, tip.y - H * 0.01, H * 0.05, time, 0.4); ctx.restore();
      if (Math.random() < 0.5) part(lerp(hx, tip.x, Math.random()), lerp(hy, tip.y, Math.random()), rand(-30, 30), rand(-120, -40), rand(0.3, 0.7), '#ffb347', rand(1.5, 3.5), 0);
    }
    if (p.swipe > 0 && p.disarmed <= 0) A.glowDot(ctx, tip.x, tip.y, H * 0.03 * (1 + 0.15 * Math.sin(time * 6)), '#ffd978', 0.7); // Deviatus : la pointe luit en or
    if (b) { // notre rayon, et le temps qu'il lui reste
      drawBeam(tip.x, tip.y, H * 0.012, wand.x, wand.y, H * 0.006, b.spell);
      ctx.save(); ctx.strokeStyle = A.rgba(b.spell.color, 0.9); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(wand.x, wand.y, H * 0.035, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, 1 - b.t / b.dur)); ctx.stroke(); ctx.restore();
    }
    BUFF_KEYS.forEach(function (k) { if (p[k] > 0 && k !== 'ward') tot++; });
    if (p.disarmed <= 0 && !b) BUFF_KEYS.forEach(function (k) { // renforts : une petite lueur de couleur tourne autour de la baguette
      if (p[k] <= 0 || k === 'ward') return;
      var a = time * 3.4 + n * TAU / tot; n++;
      A.glowDot(ctx, wand.x + Math.cos(a) * 19, wand.y + Math.sin(a) * 19, 7, BUFFS[k], Math.min(1, p[k] / 0.5));
    });
    if (p.fly) { // Désarmo : la baguette tournoie en l'air ; un anneau doré dit quand on peut l'attraper
      var w = p.fly, l = H * 0.13, ok = w.ground || w.vy > 0, c = Math.cos(w.rot), s = Math.sin(w.rot);
      A.drawWand(ctx, w.x - c * l, w.y - s * l, w.x + c * l, w.y + s * l, H * 0.0125, H * 0.0042, D.wd);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = ok ? 'rgba(255,233,160,0.95)' : 'rgba(200,200,220,0.35)'; ctx.lineWidth = ok ? 4 : 2; ctx.setLineDash(ok ? [] : [8, 8]);
      ctx.beginPath(); ctx.arc(w.x, w.y, H * 0.1 * (ok ? 1 + 0.06 * Math.sin(time * 10) : 1), 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      if (w.ground) { ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(w.x, w.y, H * 0.115, -Math.PI / 2, -Math.PI / 2 + TAU * w.hold / 0.7); ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.font = 'bold ' + Math.round(H * 0.024) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,8,24,0.85)'; ctx.fillStyle = '#ffe9a0';
      var lbl = w.ground ? 'Ramasse-la : garde la main dessus' : ok ? 'Attrape-la !' : ''; ctx.strokeText(lbl, clamp(w.x, 160, W - 160), w.y - H * 0.125); ctx.fillText(lbl, clamp(w.x, 160, W - 160), w.y - H * 0.125); ctx.restore();
    }
    if (p.shieldT > 0) {
      var al = p.shieldT / SHIELD_T;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var gr = ctx.createRadialGradient(wand.x, wand.y, R * 0.2, wand.x, wand.y, R);
      gr.addColorStop(0, 'rgba(120,200,255,0)'); gr.addColorStop(0.75, 'rgba(120,200,255,' + 0.25 * al + ')'); gr.addColorStop(1, 'rgba(220,245,255,' + 0.7 * al + ')');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(wand.x, wand.y, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(230,248,255,' + al + ')'; ctx.lineWidth = 3; ctx.stroke();
      ctx.setLineDash([R * 0.22, R * 0.16]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(wand.x, wand.y, R * 0.72, time * 4, time * 4 + TAU); ctx.stroke(); ctx.setLineDash([]);
      if (p.holdMax > 0 && p.holdLeft > 0) { // talent Garde : ce qu'il reste à tenir en gardant le clic enfoncé
        ctx.strokeStyle = 'rgba(255,233,160,0.95)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(wand.x, wand.y, R * 1.09, -Math.PI / 2, -Math.PI / 2 + TAU * p.holdLeft / p.holdMax); ctx.stroke();
      }
      ctx.restore();
    } else if (p.noShield > 0 && p.disarmed <= 0) { // boucliers brisés : un marteau près de la baguette
      ctx.save(); ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 6); ctx.fillText('🔨', wand.x + 26, wand.y - 22); ctx.restore();
    } else if (p.bigR > 0 && p.disarmed <= 0 && !b) { // Magnus : on voit la taille du grand bouclier
      ctx.save(); ctx.strokeStyle = 'rgba(159,208,255,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([6, 10]); ctx.beginPath(); ctx.arc(wand.x, wand.y, R, 0, TAU); ctx.stroke(); ctx.restore();
    } else if (p.shieldCd > 0 && p.disarmed <= 0 && !b) { // petit arc : recharge du bouclier
      ctx.save(); ctx.strokeStyle = 'rgba(190,225,255,0.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(wand.x, wand.y, 20, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - p.shieldCd / p.shieldCdMax)); ctx.stroke(); ctx.restore();
    }
  }
  // Sous l'eau (Aqua) : l'image est floue, ondule, bleuit, et des bulles montent. La baguette et le tracé restent nets.
  function underwater(k) {
    var q = 4, bw = Math.ceil(cv.width / q), bh = Math.ceil(cv.height / q), sh = Math.round(8 * dpr), n = Math.ceil(cv.height / sh), i;
    if (!wbuf) { wbuf = document.createElement('canvas'); wctx = wbuf.getContext('2d'); }
    if (wbuf.width !== bw || wbuf.height !== bh) { wbuf.width = bw; wbuf.height = bh; }
    wctx.drawImage(cv, 0, 0, bw, bh); // copie réduite : agrandie, elle devient floue
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = Math.min(1, k * 1.3);
    for (i = 0; i < n; i++) { // on la redessine par bandes décalées : ça ondule
      var y = i * sh, dx = (Math.sin(y / dpr * 0.034 + time * 3.2) * 10 + Math.sin(y / dpr * 0.011 - time * 1.7) * 7) * dpr * k;
      ctx.drawImage(wbuf, 0, y / q, bw, sh / q, dx - 20 * dpr, y, cv.width + 40 * dpr, sh);
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(24,104,190,' + 0.3 * k + ')'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.strokeStyle = 'rgba(215,240,255,' + 0.6 * k + ')'; ctx.fillStyle = 'rgba(215,240,255,' + 0.14 * k + ')'; ctx.lineWidth = 1.5;
    for (i = 0; i < 16; i++) {
      var sp = 0.12 + (i * 37 % 10) / 40, bx = (i * 0.6180339 % 1) * W + Math.sin(time * 1.4 + i) * 14, by = H * 1.05 - ((time * sp + i * 0.37) % 1.15) * H, br = 4 + (i * 53 % 9);
      ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  // Aveuglé (Tenebra) : tout est noir, sauf une petite lueur autour de la baguette.
  function darkness(k) {
    var R = H * 0.21, gr = ctx.createRadialGradient(wand.x, wand.y, R * 0.2, wand.x, wand.y, R);
    gr.addColorStop(0, 'rgba(4,2,12,' + 0.3 * k + ')'); gr.addColorStop(0.6, 'rgba(4,2,12,' + 0.82 * k + ')'); gr.addColorStop(1, 'rgba(4,2,12,' + 0.985 * k + ')');
    ctx.fillStyle = gr; ctx.fillRect(-40, -40, W + 80, H + 80);
  }
  // Endormi (Somnus) : on ne voit plus qu'à travers la fente de l'œil, en amande, qui s'ouvre et se referme (o : 0 = fermé, 1 = ouvert).
  function eyelids(k, o) {
    var x0 = W * 0.02, x1 = W * 0.98, cy = H * 0.5, hgt = H * 0.86 * o;
    var almond = function () { ctx.moveTo(x0, cy); ctx.quadraticCurveTo(W / 2, cy - hgt, x1, cy); ctx.quadraticCurveTo(W / 2, cy + hgt, x0, cy); ctx.closePath(); };
    ctx.save(); ctx.fillStyle = ctx.strokeStyle = '#04020a'; ctx.globalAlpha = k;
    ctx.beginPath(); ctx.rect(-10, -10, W + 20, H + 20); almond(); ctx.fill('evenodd');
    [[90, 0.22], [50, 0.32], [22, 0.5]].forEach(function (e) { ctx.globalAlpha = k * e[1]; ctx.lineWidth = e[0]; ctx.beginPath(); almond(); ctx.stroke(); }); // bord flou des paupières
    ctx.restore();
  }
  // Gelé (Glacius) : on regarde à travers un bloc de glace — bords givrés, reflets, fêlures.
  function iceView(k) {
    var i, m = Math.min(W, H);
    ctx.save();
    ctx.fillStyle = 'rgba(150,215,255,' + 0.26 * k + ')'; ctx.fillRect(0, 0, W, H);
    var gr = ctx.createRadialGradient(W / 2, H / 2, m * 0.22, W / 2, H / 2, Math.max(W, H) * 0.7);
    gr.addColorStop(0, 'rgba(225,246,255,0)'); gr.addColorStop(0.7, 'rgba(225,246,255,' + 0.5 * k + ')'); gr.addColorStop(1, 'rgba(245,252,255,' + 0.92 * k + ')');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,' + 0.13 * k + ')'; // grands reflets en biais
    [[0.08, 0.2], [0.34, 0.07], [0.6, 0.14]].forEach(function (b) { ctx.beginPath(); ctx.moveTo(W * b[0], H); ctx.lineTo(W * (b[0] + b[1]), H); ctx.lineTo(W * (b[0] + b[1] + 0.3), 0); ctx.lineTo(W * (b[0] + 0.3), 0); ctx.closePath(); ctx.fill(); });
    ctx.strokeStyle = 'rgba(255,255,255,' + 0.75 * k + ')'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; // fêlures qui partent des coins
    [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].forEach(function (c2) {
      ctx.beginPath(); ctx.moveTo(c2[0], c2[1]);
      for (i = 1; i <= 5; i++) ctx.lineTo(c2[0] + c2[2] * m * (0.05 * i + 0.02 * Math.sin(i * 7)), c2[1] + c2[3] * m * (0.045 * i + 0.025 * Math.cos(i * 5)));
      ctx.moveTo(c2[0] + c2[2] * m * 0.1, c2[1] + c2[3] * m * 0.09); ctx.lineTo(c2[0] + c2[2] * m * 0.2, c2[1] + c2[3] * m * 0.07); ctx.stroke();
    });
    ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(235,250,255,' + 0.8 * k + ')'; ctx.strokeRect(5, 5, W - 10, H - 10);
    ctx.restore();
  }
  // Ignis sur nous : des flammes montent du bas de l'écran, les mêmes que celles des torches.
  function smokeView(k) { // Fumus : un gros nuage gris devant nous, du bas de l'écran jusqu'au milieu ; nos sorts en sortent, les siens y entrent
    for (var i = 0; i < 12; i++) { var a = time * 0.4 + i * 0.52; fog(W * (0.08 + (i % 6) * 0.168) + Math.cos(a) * W * 0.03, H * (i < 6 ? 0.52 : 0.68) + Math.sin(a * 1.5) * H * 0.03, W * 0.26, H * 0.2, 0.55 * k); }
  }
  function blizzardView(k) { // Blizzardus : tout l'écran disparaît dans la neige qui fouette
    ctx.save(); ctx.fillStyle = 'rgba(225,240,255,' + 0.55 * k + ')'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,255,255,' + 0.7 * k + ')'; ctx.lineCap = 'round';
    for (var i = 0; i < 90; i++) { var sp = 0.35 + (i % 5) * 0.12, x = ((i * 0.618 + time * sp * 1.4) % 1) * W * 1.2 - W * 0.1, y = ((i * 0.377 + time * sp * 2.2) % 1) * H, len = H * (0.02 + (i % 3) * 0.015); ctx.lineWidth = 1 + (i % 3); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - len * 1.6, y + len); ctx.stroke(); }
    ctx.restore();
    var gr = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8); gr.addColorStop(0, 'rgba(240,248,255,0)'); gr.addColorStop(1, 'rgba(240,248,255,' + 0.8 * k + ')'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  }
  function burnView(k) { for (var i = 0; i < 8; i++) A.flame(ctx, W * (0.05 + i * 0.128) + Math.sin(time * 1.3 + i) * W * 0.012, H * 1.03, H * (0.075 + 0.02 * Math.sin(time * 2.1 + i * 2)) * k, time, i * 1.7); }
  // Vapor sur nous : de la brume flotte sur les bords de l'écran.
  function fog(x, y, rx, ry, a) { // une volute de brume aux bords fondus
    ctx.save(); ctx.translate(x, y); ctx.scale(rx / ry, 1);
    var gr = ctx.createRadialGradient(0, 0, 0, 0, 0, ry); gr.addColorStop(0, 'rgba(220,230,244,' + a + ')'); gr.addColorStop(1, 'rgba(220,230,244,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, ry, 0, TAU); ctx.fill(); ctx.restore();
  }
  function mistView(k) { for (var i = 0; i < 10; i++) { var a = time * 0.3 + i * 0.63, side = i % 2 ? 1 : 0; fog(W * (side ? 0.93 : 0.07) + Math.cos(a) * W * 0.05, H * (0.1 + (i >> 1) * 0.2) + Math.sin(a * 1.4) * H * 0.04, W * 0.22, H * 0.16, 0.3 * k); } }
  // Sous l'eau, l'image tangue : décalage de la scène (et donc de l'endroit où il faut parer).
  function viewOff() {
    var k = D ? D.fx.soak : 0, o = k > 0 ? { x: Math.sin(time * 2.1) * W * 0.03 * k, y: Math.sin(time * 3.3) * H * 0.012 * k } : { x: 0, y: 0 };
    if (D && D.nod > 0) o.y -= Math.sin(D.nod * Math.PI) * H * 0.1; // Atchoum : on baisse la tête, la salle remonte
    return o;
  }
  function bigText(str, y, size, color, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.font = 'bold ' + Math.round(size) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.12; ctx.strokeStyle = 'rgba(12,8,28,0.85)'; ctx.strokeText(str, W / 2, y); ctx.fillStyle = color; ctx.fillText(str, W / 2, y); ctx.restore();
  }
  function edgeGlow(color, alpha, inner) {
    var gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * inner, W / 2, H / 2, Math.max(W, H) * 0.72);
    gr.addColorStop(0, A.rgba(color, 0)); gr.addColorStop(1, A.rgba(color, alpha));
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var off = viewOff(), soak = D ? D.fx.soak : 0, zoom = 1 + 0.08 * soak; // sous l'eau : la salle tangue (un léger zoom cache ses bords)
    ctx.save(); ctx.translate(W / 2 + off.x, H / 2 + off.y); ctx.scale(zoom, zoom);
    if (D && D.p.inverted > 0) { var ik = Math.min(1, (D.p.hexMax - D.p.inverted) * 2.5, D.p.inverted * 2.5); ctx.rotate(Math.PI * (0.5 - 0.5 * Math.cos(Math.PI * ik))); }
    ctx.translate(-W / 2, -H / 2);
    if (D && D.scene) D.scene.draw(ctx, W, H, time);
    else { ctx.drawImage(hall.canvas, 0, 0, W, H); A.drawHallLive(ctx, geo, time); }
    ctx.restore();
    if (!D) return;
    var p = D.p, i, b = D.beams.f, u = F.u;
    ctx.save();
    if (p.inverted > 0) { var fk = Math.min(1, (p.hexMax - p.inverted) * 2.5, p.inverted * 2.5), fa = Math.PI * (0.5 - 0.5 * Math.cos(Math.PI * fk)); ctx.translate(W / 2, H / 2); ctx.rotate(fa); ctx.translate(-W / 2, -H / 2); } // la tête en bas : la salle bascule, puis se remet d'aplomb à la fin
    if (D.shake > 0) ctx.translate(rand(-1, 1) * D.shake, rand(-1, 1) * D.shake);
    if (D.dimK > 0.01) { ctx.fillStyle = 'rgba(6,4,16,' + 0.5 * D.dimK + ')'; ctx.fillRect(0, 0, W, H); }
    ctx.save(); ctx.translate(off.x, off.y);
    drawFoe(); drawFoeExtras(); drawWall();
    D.shots.forEach(function (s) { if (s.from === 'player') drawShot(s); });
    if (b) { // son rayon : il s'élargit en venant vers nous ; l'anneau doré montre où tenir le bouclier
      drawBeam(F.x - 20 * u, F.fy - 74 * u, 1.2 * u, b.x, b.y, H * (b.spell.beam.fire ? 0.02 : 0.03), b.spell);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.arc(b.x, b.y, parryR() * 0.55, time * 3, time * 3 + TAU); ctx.stroke(); ctx.restore();
    }
    D.shots.forEach(function (s) { if (s.from === 'foe') { drawIncoming(s); drawShot(s); } });
    (D.flung || []).forEach(function (fl) { var k = fl.t / fl.dur; A.glowDot(ctx, fl.x, fl.y, fl.r * (3 + 5 * k), fl.spell.color, 0.95 * (1 - k)); });
    D.fires.forEach(function (fr) { if (!fr.screen) A.flame(ctx, fr.x, fr.y, fr.r * Math.sin(Math.PI * Math.min(1, fr.t / fr.dur)), time, fr.ph); });
    D.zaps.forEach(function (z) { if (!z.screen) bolt(z.x0, z.y0, z.x1, z.y1, 1 - z.t / z.dur, Math.max(1.5, 1.2 * u)); });
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < D.parts.length; i++) { var q = D.parts[i]; ctx.globalAlpha = Math.min(1, q.life / q.max * 1.6); ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.restore();
    // dômes autour de nous : Aegis (doré), Absorbo (bleu), Speculum (argent)
    if (p.ward > 0) bubble(W / 2, H * 0.62, W * 0.47, H * 0.57, '255,217,120', Math.min(1, p.ward / 0.5) * (0.75 + 0.25 * Math.sin(time * 4)));
    if (p.absorb > 0) bubble(W / 2, H * 0.62, W * 0.45, H * 0.55, '127,176,255', Math.min(1, p.absorb / 0.5) * (0.6 + 0.3 * Math.sin(time * 6)));
    if (p.mirror > 0) bubble(W / 2, H * 0.62, W * 0.43, H * 0.53, '235,240,250', Math.min(1, p.mirror / 0.5) * (0.7 + 0.25 * Math.sin(time * 9)));
    if (p.mist > 0) mistView(Math.min(1, p.mist / 0.5));
    if (p.smoke > 0) smokeView(Math.min(1, p.smoke / 0.5));
    if (p.blizzard > 0) blizzardView(Math.min(1, p.blizzard / 0.4));
    if (p.quake && p.quake.orb) drawStormOrb(W * 0.82, H * 0.3, H * 0.022, W * 0.5, H * 0.75);
    if (soak > 0.01) underwater(soak);
    if (D.fx.blind > 0.01) darkness(D.fx.blind);
    if (p.burn > 0) burnView(Math.min(1, p.burn / 0.5));
    D.fires.forEach(function (fr) { if (fr.screen) A.flame(ctx, fr.x, fr.y, fr.r * Math.sin(Math.PI * Math.min(1, fr.t / fr.dur)), time, fr.ph); });
    D.zaps.forEach(function (z) { if (z.screen) bolt(z.x0, z.y0, z.x1, z.y1, 1 - z.t / z.dur, 4); });
    if (p.frozen > 0) iceView(Math.min(1, p.frozen / 0.25));
    if (p.dazzled > 0) { ctx.fillStyle = 'rgba(255,255,255,' + clamp(p.dazzled / p.hexMax * 1.35, 0, 1) + ')'; ctx.fillRect(0, 0, W, H); } // Lumina : tout est blanc, puis la vue revient doucement
    drawGuide(); drawGhosts(); drawTrail();
    drawPlayerExtras();
    if (D.phase !== 'end' || D.result) { if (p.invis > 0) ctx.globalAlpha = 0.3 + 0.1 * Math.sin(time * 8); drawPlayer(); ctx.globalAlpha = 1; }
    ctx.restore();
    if (D.fx.sleep > 0.01) eyelids(D.fx.sleep, eyeOpen(p.sleepT));

    if (p.slowed > 0) edgeGlow('#6fae2e', Math.min(0.42, p.slowed * 0.4), 0.28);
    if (p.burn > 0) edgeGlow('#ff6a1a', Math.min(0.35, p.burn * 0.3), 0.32);
    if (p.poison > 0) edgeGlow('#3aa83a', Math.min(0.4, p.poison * 0.3), 0.3);
    if (p.heavy > 0) edgeGlow('#5a4a9a', Math.min(0.4, p.heavy * 0.4), 0.3);
    if (p.fast > 0) edgeGlow('#ffd24a', Math.min(0.3, p.fast * 0.4) * (0.7 + 0.3 * Math.sin(time * 18)), 0.32);
    if (p.inverted > 0) edgeGlow('#ff7ad9', Math.min(0.36, p.inverted * 0.4), 0.3);
    if (p.swipe > 0) edgeGlow('#ffd978', Math.min(0.2, p.swipe * 0.4) * (0.7 + 0.3 * Math.sin(time * 5)), 0.45);
    if (p.invis > 0) edgeGlow('#d8d8ff', 0.18, 0.4);
    if (p.silenced > 0) edgeGlow('#7a84a8', Math.min(0.36, p.silenced * 0.4), 0.3);
    if (p.bastion > 0) edgeGlow('#a89a84', Math.min(0.3, p.bastion * 0.4), 0.36);
    if (p.fortis > 0) edgeGlow('#ff9a5a', Math.min(0.22, p.fortis * 0.4), 0.4);
    if (p.hurt > 0) edgeGlow('#ff1a1a', p.hurt * 0.9, 0.2);
    if (D.flash > 0) { ctx.fillStyle = 'rgba(255,245,210,' + D.flash * 1.4 + ')'; ctx.fillRect(0, 0, W, H); }
    if (D.phase === 'end' && !D.result) { ctx.fillStyle = 'rgba(30,0,10,' + Math.min(0.55, D.endT * 0.4) + ')'; ctx.fillRect(0, 0, W, H); }

    D.texts.forEach(function (t) {
      var k = t.t / 1.3, sz = H * 0.034 * t.size * (1 + 0.35 * Math.max(0, 1 - t.t * 6));
      ctx.save(); ctx.globalAlpha = Math.min(1, (1 - k) * 2.2); ctx.font = 'bold ' + Math.round(sz) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = sz * 0.2; ctx.strokeStyle = 'rgba(10,8,24,0.85)'; ctx.strokeText(t.str, t.x, t.y - k * H * 0.07); ctx.fillStyle = t.color; ctx.fillText(t.str, t.x, t.y - k * H * 0.07); ctx.restore();
    });
    if (D.phase === 'countdown') { var n = Math.ceil(D.countdown), fr = D.countdown - (n - 1); bigText(WORDS[WORDS.length - n] || '', H * 0.42, H * 0.17 * (1 + (1 - fr) * 0.3), '#d9c8ff', Math.min(1, fr * 2.5)); } // Yum… Kaï…
    if (D.phase === 'fight' && D.wardT > 0 && D.goT <= 0) { // 3… 2… 1…, et le rappel : des protections seulement
      var cn = Math.ceil(D.wardT), cf = D.wardT - (cn - 1); bigText(String(cn), H * 0.42, H * 0.2 * (1 + (1 - cf) * 0.3), '#ffe9a0', Math.min(1, cf * 2.5));
      bigText('🛡 Protections seulement', H * 0.7, H * 0.046, '#bfe6ff', 0.95);
    }
    if (D.banner) { var bk = D.banner.t / D.banner.dur; bigText(D.banner.str, H * 0.42, H * 0.2 * (1 + (1 - bk) * 0.3), '#ffe9a0', Math.min(1, bk * 2.5)); } // décompte des défis
    if (D.goT > 0) bigText(D.goText || 'DUEL !', H * 0.42, H * 0.16 * (1.4 - D.goT * 0.4), '#ffe9a0', Math.min(1, D.goT * 2.5));
    if (D.comboT > 0) { bigText('✦ ' + D.comboName + ' ! ✦', H * 0.3, H * 0.062 * (1.15 - D.comboT * 0.1), '#ffe9a0', Math.min(1, D.comboT * 2)); bigText('Le dernier sort a un niveau de plus', H * 0.355, H * 0.03, '#fff3c9', Math.min(1, D.comboT * 2) * 0.9); } // enchaînement réussi
    if (D.phase === 'end') bigText(D.result ? 'VICTOIRE !' : 'DÉFAITE…', H * 0.4, H * 0.13 * Math.min(1, 0.6 + D.endT), D.result ? '#ffe9a0' : '#ff9a9a', Math.min(1, D.endT * 2) * (D.endShown ? 0 : 1));
  }

  var speedUp = 1;
  function frame(ts) {
    tick++;
    if (!D && (idle === 2 || (idle === 1 && tick % 3))) { requestAnimationFrame(frame); return; } // hors duel, on ménage l'ordinateur
    var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; time += dt;
    if (D && !D.paused) for (var k = 0; k < speedUp; k++) update(dt); // speedUp : le temps du duel en accéléré, pour les tests (DS.duel.debug.speed)
    render();
    requestAnimationFrame(frame);
  }

  // ───────────────────────── Affichage tête haute ─────────────────────────
  function portrait(id, ch, age) { var c = $(id), g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); if (ch.monster) return A.drawMonster(g, ch, c.width / 2, c.height * 0.93, c.height * 0.8, { t: 0 }); A.drawWizard(g, ch, c.width / 2, c.height * (age === 'adult' ? 2.5 : 2.32), c.height * 2.1, { portrait: true, age: age }); } // adulte : cadré plus bas, pour voir le chapeau
  function buildHud() {
    $('me-name').textContent = D.ch.name + (D.ch.rank ? ' ' + D.ch.rank : ''); $('foe-name').textContent = D.f.ch.name + (D.f.ch.title ? ' ' + D.f.ch.title : ''); $('foe-level').textContent = 'Niveau ' + D.level;
    if (D.pack) packHud();
    portrait('hud-me', D.ch, D.age); portrait('hud-foe', D.f.ch, D.f.age); buildAllies();
    buildBelt(); buildDrawer(); toggleDrawer(false);
    syncHud();
  }
  function set(key, val, fn) { if (hudCache[key] !== val) { hudCache[key] = val; fn(val); } }
  // Maléfices et renforts en cours, sous la barre de vie : icône, nom et secondes restantes (rouge = mauvais, vert = bon).
  function chips(o) {
    var out = '', chip = function (good, icon, name, n) { out += '<span class="fx ' + (good ? 'good' : 'bad') + '">' + icon + ' ' + name + (n ? ' <i>' + n + '</i>' : '') + '</span>'; };
    STATUS.forEach(function (st) { if (o[st[0]] > 0) chip(st[3], st[1], st[2], st[0] === 'disarmed' && o === D.p ? '' : Math.ceil(o[st[0]])); });
    if (o.tired > 0) chip(1, '😮‍💨', 'À bout d’énergie', '');
    if (o.quake) chip(0, '💢', 'Tremor', '');
    if (o.echo) chip(0, '⏳', 'Ritardo' + (o.echo.dmg ? ' −' + Math.round(o.echo.dmg * o.echo.k) : ''), Math.ceil(o.echo.t));
    if (o.amp > 0) chip(1, '⏫', 'Amplio ×' + o.amp, '');
    if (o.shieldHp > 0) chip(1, '🔷', 'Arcanum', Math.ceil(o.shieldHp));
    if (o.copies) chip(1, '👥', 'Copies', Math.ceil(o.copies.t));
    if (o.focus > 0) chip(1, '🧘', 'Stabilis ×' + o.focus, '');
    if (o.prep > 0) chip(1, '🔮', 'Preparus' + (o.prep > 1 ? ' ×' + o.prep : ''), '');
    if (o.conjure > 0) chip(1, '🎩', 'Conjura', Math.ceil(o.conjure));
    var al = D.allies[o === D.p ? 'p' : 'f']; if (al) chip(1, al.a.icon, al.a.name, Math.ceil(al.t));
    return out;
  }
  // Grande barre de vie : elle jaunit sous la moitié, rougit et clignote sous le quart, et lance un éclair blanc à chaque coup reçu.
  // La vie perdue reste un instant en clair derrière (-lag), le temps de voir ce que le coup a coûté.
  function hpBar(key, id, o) {
    var was = hudCache[key];
    set(key, Math.ceil(o.hp), function (v) {
      var w = v / o.maxHp * 100 + '%', bar = $(id + '-hp-bar'), r = v / o.maxHp;
      $(id + '-hp').style.width = w; $(id + '-hp-lag').style.width = w; $(id + '-hp-txt').innerHTML = v + '<small>/ ' + o.maxHp + '</small>';
      bar.classList.toggle('mid', id === 'me' && r <= 0.5 && r > 0.25); bar.classList.toggle('low', r <= 0.25 && v > 0);
      if (was !== undefined && v < was) flashClass(null, 'hit', bar);
    });
  }
  function syncHud() {
    var p = D.p, f = D.f;
    hpBar('php', 'me', p);
    set('pmana', Math.floor(p.mana), function (v) { $('me-mana').style.width = v / p.maxMana * 100 + '%'; $('me-mana-txt').textContent = v; });
    hpBar('fhp', 'foe', f);
    set('fmana', Math.floor(f.mana), function (v) { $('foe-mana').style.width = v / f.maxMana * 100 + '%'; $('foe-mana-txt').textContent = v; });
    set('ftired', f.tired > 0, function (v) { $('foe-mana-bar').classList.toggle('tired', v); });
    set('pst', chips(p), function (v) { $('me-status').innerHTML = v; });
    set('fst', chips(f), function (v) { $('foe-status').innerHTML = v; });
    if (!D.belt) return;
    var fight = D.phase !== 'prep';
    D.belt.forEach(function (s, i) {
      if (!s || s.potion) return;
      var sel = '#spellbar [data-slot="' + i + '"]', no = fight && (p.mana < manaCost(s) || (p.silenced > 0 && s.cat === 'attaque') || (D.wardT > 0 && !wardOk(s)));
      set('low-' + i, no, function (v) { var el = document.querySelector(sel); if (el) el.classList.toggle('low', v); });
      set('ok-' + i, !!D.practiced[s.id], function (v) { var el = document.querySelector(sel); if (el) el.classList.toggle('ok', v); });
    });
    set('ok-parry', !!D.practiced.parry, function (v) { var el = document.querySelector('#spellbar [data-id="parry"]'); if (el) el.classList.toggle('ok', v); });
  }

  // Pour les tests et les captures : trace une forme parfaite au centre de l'écran.
  function debugTrace(glyph, size) {
    var pts = G.template(glyph, 40), s = size || H * 0.3;
    D.trail = { pts: pts.map(function (p) { return { x: W / 2 + p.x * s, y: H * 0.45 + p.y * s }; }), len: s * 3, stars: [], nextStar: 0 };
    wand.x = mouse.x = D.trail.pts[39].x; wand.y = mouse.y = D.trail.pts[39].y;
  }
  // Le professeur (ou l'adversaire, pour un test) trace puis lance un sort : trace = durée du tracé, flight = durée du vol.
  function foeCast(id, trace, flight) {
    var f = D.f;
    f.spell = DS.byId(DS.SPELLS, id); f.glyph = G.template(f.spell.glyph, 40); f.state = 'cast'; f.castT = 0; f.castDur = trace; f.flightDur = flight; SFX.foeCast();
  }

  // Ce dont js/school.js et js/classe.js se servent pour mener une leçon.
  var school = {
    // opts : { size: taille du modèle en fraction de la hauteur d'écran (0,36 par défaut), cy: hauteur de son centre (0,48), flip: modèle retourné comme dans un miroir }
    guide: function (glyph, color, alpha, comet, opts) { if (D) D.guide = glyph ? { glyph: glyph, color: color, alpha: alpha, comet: !!comet, k: opts && opts.size || 0.36, cy: opts && opts.cy || 0.48, flip: !!(opts && opts.flip) } : null; },
    only: function (list) { if (D) D.only = list || null; },
    target: function (t) { if (D) D.target = t || (D.klass && D.klass.dummy ? { kind: 'mannequin' } : null); }, // sans cible précise, le mannequin de pratique revient
    strokes: function (list, color, demo) { if (D) D.guide = list ? { strokes: list, color: color, demo: demo || null } : null; },
    scene: function (sc) { if (D) D.scene = sc; },
    wall: function (hp) { if (D) D.wall = hp ? { hp: hp, max: hp, t: 1e9, rise: 0, flash: 0 } : null; }, // un mur devant la cible, qui ne retombe pas tout seul
    dim: function (v) { if (D) D.dim = !!v; },
    noParry: function (v) { if (D) D.noParry = !!v; },
    foeCast: function (id, trace, flight) { if (!D) return; cleanse(D.f); foeCast(id, trace, flight); }, // sort inoffensif du professeur
    // Un sort inoffensif part tout de suite de la cible (de la machine numéro k, s'il y en a plusieurs) et vole flight secondes vers nous.
    shoot: function (id, flight, k) {
      if (!D) return;
      var sp = DS.byId(DS.SPELLS, id), x = F.chest.x + (D.target && D.target.guns ? gunDx(k || 0) : 0), y = F.chest.y - 4 * F.u * 1.1;
      D.shots.push(aimAtPlayer({ from: 'foe', spell: sp, lv: 1, t: 0, dur: flight || sp.flight * 1.7, sx: x, sy: y, miss: false, mul: 1, dmg: sp.dmg, practice: true, volley: 0 }));
      burst(x, y, sp.color, 10, 160); SFX.cast(id, 0.5);
    },
    cleanse: function () { if (D) { cleanse(D.p); cleanse(D.f); D.beams.p = D.beams.f = null; D.wall = null; } },  // plus aucun maléfice ni renfort sur personne
    // Remet tout le monde à neuf entre deux exercices.
    reset: function () { if (!D) return; cancelTrace(); D.guide = null; school.target(null); D.noParry = false; D.dim = false; cleanAll(); },
    say: function (str, color) { if (D) text(W / 2, H * 0.3, str, color || '#ffe9a0', 1.3); },
    banner: function (str, dur) { if (D) D.banner = str ? { str: str, t: dur || 0.8, dur: dur || 0.8 } : null; } // un très gros mot au milieu de l'écran (3, 2, 1, GO !)
  };
  DS.duel = { school: school, TRACE_TIME: TRACE_TIME, init: init, start: start, stop: stop, engage: engage, setPaused: setPaused, setIdle: function (v) { idle = v; }, get state() { return D; },
    debug: { set speed(v) { speedUp = Math.max(1, Math.round(v)); }, trace: debugTrace, endTrace: function () { endTrace(); }, parry: function () { parry(); }, hold: function (v) { mouseDown = !!v; }, mouse: mouse, wand: wand, foeCast: function (id, trace, flight) { foeCast(id, trace || 0.3, flight || 0); }, get F() { return F; }, place: function (id, i) { place(DS.byId(DS.SPELLS, id), i); } } };
})();
