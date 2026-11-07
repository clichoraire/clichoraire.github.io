// Menus, progression (or, expérience, talents, niveaux des sorts, tournois) et enchaînement des écrans :
// titre → (sorcier → baguette, la première fois) → carte de l'école → un lieu (cours, magasins, grimoire, talents, tournois, salle d'entraînement).
(function () {
  'use strict';
  var DS = window.DS, A = DS.art, SFX = DS.audio;
  var $ = function (id) { return document.getElementById(id); };
  var SAVE_KEY = 'duel-sorciers-v1';
  var STARTERS = DS.SPELLS.filter(function (s) { return !s.price; }).map(function (s) { return s.id; }); // sorts connus dès le départ

  // ───────────────────────── Sauvegarde ─────────────────────────
  // level : niveau du prochain adversaire en duel rapide (monte après une victoire, redescend d'un cran après une défaite).
  // wands : baguettes possédées · owned : sorts appris · spells : la ceinture — un sort (ou null) par case, parmi owned · slv : { sort: { lv } } niveau de chaque sort · spts : points de sort à dépenser.
  // plv, xp, pts : niveau du sorcier, expérience vers le suivant, points de talent à placer · stats : points placés par talent.
  // lessons : { sort: true } leçons réussies aux cours · medals : { défi: 1|2|3 } meilleure médaille (bronze, argent, or)
  // cups : { coupe: nombre de victoires } · run : tournoi en cours { cup, rounds: [[ids…], …], round, state: 'on'|'won'|'lost' }.
  var save = { char: 'elora', wand: 'saule', wands: null, setup: false, owned: null, spells: null, slv: {}, level: 1, wins: 0, best: 1, gold: 0, xp: 0, plv: 1, pts: 0, stats: {}, lessons: {}, medals: {}, cups: {}, run: null };
  var raw = null;
  try { raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (raw) for (var k in raw) save[k] = raw[k]; } catch (e) { }
  if (raw && raw.setup === undefined) save.setup = true; // sauvegarde d'avant le club : sorcier et baguette déjà choisis
  if (!DS.byId(DS.CHARACTERS, save.char)) save.char = DS.CHARACTERS[0].id;
  save.wands = (Array.isArray(save.wands) ? save.wands : []).filter(function (id) { return !!DS.byId(DS.WANDS, id); });
  DS.WANDS.forEach(function (w) { if (!w.price && save.wands.indexOf(w.id) < 0) save.wands.push(w.id); });
  if (save.wands.indexOf(save.wand) < 0) save.wand = save.wands[0];
  var valid = function (id) { return !!DS.byId(DS.SPELLS, id); };
  save.owned = (Array.isArray(save.owned) ? save.owned : []).filter(valid);
  STARTERS.forEach(function (id) { if (save.owned.indexOf(id) < 0) save.owned.push(id); });
  ['slv', 'stats', 'cups', 'lessons', 'medals', 'potions', 'ingr', 'recipes', 'seen', 'hints', 'look'].forEach(function (key) { if (!save[key] || typeof save[key] !== 'object') save[key] = {}; });
  // tower : la Tour des Épreuves { floor, best, next } · ingr, recipes, hints : le laboratoire · fam : les familiers { owned, active } · look : chapeau, baguette, titre · seen : exploits déjà vus (js/extras.js)
  if (!save.tower || typeof save.tower !== 'object') save.tower = {}; save.tower.floor = Math.max(1, Math.floor(+save.tower.floor || 1)); save.tower.best = Math.max(0, Math.floor(+save.tower.best || 0));
  if (!save.fam || typeof save.fam !== 'object') save.fam = {}; if (!save.fam.owned || typeof save.fam.owned !== 'object') save.fam.owned = {}; if (!DS.byId(DS.FAMILIARS, save.fam.active) || !save.fam.owned[save.fam.active]) save.fam.active = null;
  Object.keys(save.ingr).forEach(function (id) { if (!DS.byId(DS.INGREDIENTS, id) || !(save.ingr[id] > 0)) delete save.ingr[id]; });
  // adv : l'aventure (js/aventure.js) { biome, loop, x, y, key, cleared, seed }
  if (!save.adv || typeof save.adv !== 'object') save.adv = {}; save.adv.biome = Math.max(0, Math.floor(+save.adv.biome || 0)) % DS.BIOMES.length; save.adv.loop = Math.max(0, Math.floor(+save.adv.loop || 0));
  if (typeof save.adv.x !== 'number') save.adv.x = -1; if (!save.adv.cleared || typeof save.adv.cleared !== 'object') save.adv.cleared = {}; if (!save.adv.seed) save.adv.seed = 1 + Math.floor(Math.random() * 1e6);
  var oldLevels = typeof save.spts !== 'number'; // sauvegarde d'avant les points de sort (les sorts montaient tout seuls à force de les lancer)
  if (!Array.isArray(save.spells)) save.spells = STARTERS.slice();
  fitBelt();
  ['gold', 'xp', 'pts', 'wins'].forEach(function (key) { save[key] = Math.max(0, Math.floor(+save[key] || 0)); });
  ['level', 'best', 'plv'].forEach(function (key) { save[key] = Math.max(1, Math.floor(+save[key] || 1)); });
  if (oldLevels) { save.slv = {}; save.spts = save.plv - 1; } // on repart du niveau 1 partout, avec un point de sort par niveau de sorcier déjà gagné
  save.spts = Math.max(0, Math.floor(+save.spts || 0));
  if (save.run && !(DS.byId(DS.CUPS, save.run.cup) && Array.isArray(save.run.rounds) && Array.isArray(save.run.levels) && Array.isArray(save.run.pre))) save.run = null; // coupe d'une ancienne version : on l'oublie
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } }

  // ───────────────────────── Progression ─────────────────────────
  function me() { return DS.byId(DS.CHARACTERS, save.char); }
  function look() { return DS.extras.styled(me()); } // notre sorcier avec son chapeau, son aura et son titre (miroir magique, js/extras.js)
  function myAge() { return DS.ageOf(save.plv); } // notre sorcier grandit avec son niveau : enfant, ado, puis vrai magicien
  function who(id) { return id === 'me' ? me() : DS.byId(DS.CHARACTERS, id) || DS.byId(DS.RIVALS, id); }
  function statMax(id) { return DS.byId(DS.STATS, id).max || DS.STAT_MAX; }
  function stat(id) { return Math.min(statMax(id), save.stats[id] || 0); }
  function beltSize() { return DS.BELT_BASE + stat('belt'); } // nombre de cases de la ceinture
  // Met la ceinture à la bonne taille : sorts connus seulement, jamais deux fois le même, au moins un.
  function fitBelt() {
    var n = beltSize(), seen = {}, out = save.spells.map(function (id) { if (id && (save.owned.indexOf(id) >= 0 || potionCount(id) > 0) && !seen[id]) { seen[id] = true; return id; } return null; }); // sorts connus, ou potions qu'on a encore
    var extra = out.slice(n).filter(Boolean); out = out.slice(0, n); // ceinture devenue plus courte : ce qui dépasse retourne dans les cases libres, s'il y en a
    while (out.length < n) out.push(null);
    extra.forEach(function (id) { var i = out.indexOf(null); if (i >= 0) out[i] = id; });
    if (!out.some(Boolean)) out[0] = STARTERS[0];
    save.spells = out;
  }
  function onBelt() { return save.spells.filter(Boolean); }
  function val(id) { return stat(id) * DS.byId(DS.STATS, id).per; }
  // Ce que les talents changent dans un duel.
  function mods() { return { hp: val('hp'), mana: val('mana'), regen: val('regen') / 100, costMul: 1 - val('cost') / 100, hold: val('guard'), guardR: stat('guard') * 0.015 }; }
  function cost(s) { return Math.max(1, Math.round(s.mana * (1 - val('cost') / 100))); }
  function slv(id) { return save.slv[id] ? Math.max(1, Math.min(DS.SPELL_MAX_LV, save.slv[id].lv || 1)) : 1; }
  // Fait monter un sort d'un niveau avec les points de sort (un par niveau de sorcier gagné). Retourne true si c'est fait.
  function upgrade(id) {
    var s = DS.byId(DS.SPELLS, id), lv = slv(id), c = DS.spellUpCost(s);
    if (lv >= DS.SPELL_MAX_LV || save.spts < c) return false;
    save.spts -= c; save.slv[id] = { lv: lv + 1 }; persist(); return true;
  }
  function resetSpellLevels() { Object.keys(save.slv).forEach(function (id) { var s = DS.byId(DS.SPELLS, id); if (s) save.spts += (slv(id) - 1) * DS.spellUpCost(s); }); save.slv = {}; persist(); }
  function addXp(n) { // retourne le nombre de niveaux gagnés (un point de talent chacun)
    var ups = 0; save.xp += n;
    while (save.xp >= DS.xpNeed(save.plv)) { save.xp -= DS.xpNeed(save.plv); save.plv++; save.pts++; save.spts++; ups++; } // chaque niveau : un point de talent et un point de sort
    return ups;
  }
  function trophies() { var n = 0; DS.CUPS.forEach(function (c) { n += save.cups[c.id] || 0; }); return n; }
  function plural(n, one, many) { return n + ' ' + (n > 1 ? many : one); }

  // ───────────────────────── Écrans ─────────────────────────
  var bookMode = 'view';  // le grimoire s'ouvre depuis la carte ('view'), avant un duel d'entraînement ('quick') ou avant un duel de tournoi ('cup')
  var duelMode = 'quick'; // 'quick' (salle d'entraînement), 'cup' (tournoi), 'tour' (un étage de la Tour des Épreuves) ou 'class' (cours : on s'exerce, rien ne compte)
  var towerCfg = null;    // l'étage en cours de la tour : { level, foe, mod, modNames, boss } (js/extras.js towerCfg)
  var advFight = null;    // le combat d'aventure en cours : { foe, level, horde, m } (js/aventure.js encounter)
  var shown = '';
  // Chaque endroit a son air, son ambiance et son bruit d'arrivée (js/music.js, js/audio.js). Le duel choisit sa musique selon sa phase (duelMusic).
  function soundFor(id) {
    var M = DS.music, wandShop = id === 'wands' && save.setup;
    if (id !== 'duel') M.play(id === 'title' || (!save.setup && (id === 'chars' || id === 'wands')) ? 'theme' : id === 'shop' || wandShop || id === 'labo' || id === 'familiers' ? 'boutique' : id === 'cups' || id === 'tour' || (id === 'book' && (bookMode === 'cup' || bookMode === 'tour')) ? 'tournoi' : 'carte');
    M.duck(1);
    if (id !== 'duel') SFX.ambience(id === 'map' ? 'nuit' : id === 'title' ? 'torches' : null);
    if (id === shown) return; // le même écran, simplement redessiné
    shown = id;
    if (id === 'book') SFX.page(); else if (id === 'shop' || wandShop || id === 'labo') SFX.bell(); else if (id === 'talents') SFX.chime(); else if (id === 'cups' || id === 'tour') SFX.horn(); else if (id !== 'title' && id !== 'duel') SFX.whoosh();
  }
  function duelMusic(ph, klass) {
    var M = DS.music, run = save.run, cup = duelMode === 'cup' && run;
    SFX.ambience(klass ? 'classe' : 'torches');
    if (klass) { if (ph === 'prep') M.play('classe'); return; }
    if (ph === 'prep') { M.heat(false); M.play('prep'); }
    else if (ph === 'countdown') M.stop(0.5);
    else if (ph === 'fight') M.play('duel', cup ? { transpose: 1 + Math.min(3, run.step), bpm: 154 + 4 * Math.min(3, run.step) } : null); // en tournoi : plus haut et plus vite à chaque tour
    else if (ph === 'end') M.sting(DS.duel.state && DS.duel.state.result ? 'victoire' : 'defaite', { then: cup ? 'tournoi' : 'carte' });
  }
  function show(id) {
    soundFor(id);
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('hidden', s.id !== 'screen-' + id); });
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    document.querySelectorAll('.gold-amt').forEach(function (el) { el.textContent = save.gold; });
    // la salle de duel n'est redessinée à chaque image que lorsqu'on la voit vraiment (titre, duel) ; sous la carte, pas du tout
    DS.duel.setIdle(id === 'map' ? 2 : id === 'duel' || id === 'title' ? 0 : 1);
    if (id === 'map') { renderMap(); DS.map.start(); } else DS.map.stop();
    if (id !== 'aventure') DS.aventure.stop();
    if (id === 'title') $('btn-reset').classList.toggle('hidden', !save.setup);
    if (id === 'title') $('title-record').textContent = save.setup ? 'Niveau ' + save.plv + ' · ' + plural(save.wins, 'victoire', 'victoires') + (trophies() ? ' · 🏆 × ' + trophies() : '') : '';
    if (id === 'chars') { buildChars(); markPicked(); $('chars-step').classList.toggle('hidden', save.setup); $('btn-chars-next').textContent = save.setup ? 'Retour à la carte' : 'Choisir la baguette →'; }
    if (id === 'wands') buildWands();
    if (id === 'book') buildBook();
    if (id === 'train') { $('train-duel-lvl').textContent = 'Un adversaire de niveau ' + save.level + ', encore et encore. Chaque victoire rapporte de l’or et de l’expérience.'; $('train-dummy-n').textContent = 'Essaie tes ' + plural(save.owned.length, 'sort', 'sorts') + ' sur un mannequin, sans adversaire. Rien ne compte : prends ton temps.'; }
    if (id === 'shop') buildShop();
    if (id === 'talents') renderTalents();
    if (id === 'cups') renderCups();
    if (id === 'tour') DS.extras.renderTower();
    if (id === 'labo') DS.extras.renderLab();
    if (id === 'familiers') DS.extras.renderFam();
    if (id === 'aventure') DS.aventure.render();
  }

  // ── Sorciers ──
  function buildChars() {
    $('char-grid').innerHTML = DS.CHARACTERS.map(function (c) {
      return '<button class="card-pick" role="option" data-id="' + c.id + '" style="--c:' + c.robe + '"><canvas width="220" height="230"></canvas><b>' + c.name + '</b><small>' + c.title + '</small><em>' + c.perkText + '</em></button>';
    }).join('');
    $('char-grid').querySelectorAll('.card-pick').forEach(function (el) {
      var c = DS.byId(DS.CHARACTERS, el.dataset.id), cv = el.querySelector('canvas');
      A.drawWizard(cv.getContext('2d'), c, 110, myAge() === 'adult' ? 625 : 590, 520, { portrait: true, face: 'happy', age: myAge() });
      el.addEventListener('click', function () { save.char = c.id; persist(); SFX.select(); markPicked(); });
      el.addEventListener('dblclick', function () { show(save.setup ? 'map' : 'wands'); });
    });
  }
  // ── Baguettes ──
  function statBar(label, v) { return '<div class="stat"><span>' + label + '</span><div><i style="width:' + Math.round(Math.min(1, (v - 0.6) / 0.9) * 100) + '%"></i></div></div>'; }
  function buildWands() {
    var shop = save.setup; // la première fois, on choisit seulement ; ensuite, c'est le magasin de baguettes
    $('wands-title').textContent = shop ? 'Magasin de baguettes' : 'Choisis ta baguette';
    $('wands-step').classList.toggle('hidden', shop); $('wands-purse').classList.toggle('hidden', !shop);
    $('btn-wands-next').textContent = shop ? 'Retour à la carte' : 'Entrer à l’école →';
    $('wand-grid').innerHTML = DS.WANDS.map(function (w) {
      var own = save.wands.indexOf(w.id) >= 0;
      return '<button class="card-pick wand' + (own ? '' : ' shop' + (w.price > save.gold ? ' poor' : '')) + '" role="option" data-id="' + w.id + '" style="--c:' + w.glow + '"><canvas width="220" height="150"></canvas><b>' + w.name + '</b><em>' + w.desc + '</em>' +
        statBar('Puissance', w.power) + statBar('Vitesse', w.speed) + statBar('Énergie', w.regen) + (w.unique ? '<span class="uniq"><b>✦ Pouvoir unique</b> ' + w.unique + '</span>' : '') + (own ? '' : '<span class="buy">Acheter · ' + w.price + ' <i class="coin"></i></span>') + '</button>';
    }).join('');
    $('wand-grid').querySelectorAll('.card-pick').forEach(function (el) {
      var w = DS.byId(DS.WANDS, el.dataset.id), g = el.querySelector('canvas').getContext('2d'), own = save.wands.indexOf(w.id) >= 0;
      A.drawWand(g, 34, 122, 186, 34, 6.5, 2.2, w); A.glowDot(g, 186, 34, 30, w.glow, own ? 0.9 : 0.5);
      el.addEventListener('click', function () {
        if (!own) return buy(el, w, function () { save.wands.push(w.id); save.wand = w.id; show('wands'); });
        save.wand = w.id; persist(); SFX.select(); markPicked();
      });
      if (own) el.addEventListener('dblclick', enterSchool);
    });
    markPicked();
  }
  function enterSchool() { save.setup = true; persist(); show('map'); }
  // Achat en deux clics, pour ne pas dépenser son or par accident. item : un sort ou une baguette (avec un price).
  function buy(el, item, done) {
    var pill = el.querySelector('.buy'), label = 'Acheter · ' + item.price + ' <i class="coin"></i>';
    if (save.gold < item.price) { pill.innerHTML = 'Il te manque ' + (item.price - save.gold) + ' <i class="coin"></i>'; setTimeout(function () { if (pill.isConnected) pill.innerHTML = label; }, 1800); return shake(el); }
    if (!el.dataset.sure) {
      el.dataset.sure = '1'; pill.innerHTML = 'Confirmer ? ' + item.price + ' <i class="coin"></i>'; SFX.click();
      setTimeout(function () { if (pill.isConnected) { delete el.dataset.sure; pill.innerHTML = label; } }, 3000);
      return;
    }
    save.gold -= item.price; SFX.coin(); done(); persist();
  }
  function shake(el) { el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); SFX.nope(); }
  function markPicked() {
    document.querySelectorAll('#book .belt-btn, #book .idx-it').forEach(function (el) {
      var on = save.spells.indexOf(el.dataset.id) >= 0; el.classList.toggle('on', on); el.setAttribute('aria-pressed', on);
      var l = el.querySelector('.lbl'); if (l) l.textContent = on ? 'À ma ceinture' : 'Mettre à ma ceinture';
    });
    $('spell-count').textContent = '🎒 Ceinture : ' + onBelt().length + ' / ' + beltSize() + ' · ⭐ ' + plural(save.spts, 'point', 'points') + ' de sort';
    document.querySelectorAll('#char-grid .card-pick').forEach(function (el) { var on = el.dataset.id === save.char; el.classList.toggle('picked', on); el.setAttribute('aria-selected', on); });
    document.querySelectorAll('#wand-grid .card-pick').forEach(function (el) { var on = el.dataset.id === save.wand; el.classList.toggle('picked', on); el.setAttribute('aria-selected', on); });
  }

  // ── Carte de l'école ──
  function renderMap() {
    var c = look(), cv = $('map-portrait'), g = cv.getContext('2d'), need = DS.xpNeed(save.plv), run = save.run, n = trophies(), M = DS.map;
    g.clearRect(0, 0, cv.width, cv.height); A.drawWizard(g, c, cv.width / 2, cv.height * (myAge() === 'adult' ? 2.5 : 2.32), cv.height * 2.1, { portrait: true, face: 'happy', age: myAge() });
    cv.style.boxShadow = c.aura ? '0 0 .9em ' + c.aura : ''; // l'aura du chapeau
    $('map-name').textContent = c.name + (c.rank ? ' ' + c.rank : '') + ' · niveau ' + save.plv;
    $('map-xp').style.width = save.xp / need * 100 + '%'; $('map-xp-txt').textContent = save.xp + ' / ' + need + ' XP';
    var toBuy = DS.SPELLS.filter(function (s) { return save.owned.indexOf(s.id) < 0; }), reach = toBuy.filter(function (s) { return s.price <= save.gold; }).length;
    DS.CATS.forEach(function (cat) { // un cours par bâtiment ; celui de protection enseigne aussi les sorts de renfort
      if (cat.course !== cat.id) return;
      var list = cat.id === 'attaque' ? DS.classe.lessons : DS.SPELLS.filter(function (s) { return DS.byId(DS.CATS, s.cat).course === cat.id; }), ok = list.filter(function (s) { return save.lessons[s.id]; }).length; // attaque : les leçons en classe
      M.set(cat.id, ok + ' / ' + list.length + ' leçons');
    });
    M.set('baguettes', DS.byId(DS.WANDS, save.wand).name);
    M.set('magie', toBuy.length ? plural(toBuy.length, 'sort', 'sorts') + ' à apprendre' : 'Tout est appris', reach);
    M.set('tournoi', run && run.state === 'on' ? stepName(run, run.step) + ' à jouer' : n ? plural(n, 'coupe gagnée', 'coupes gagnées') : '5 coupes, de 3 à 6 duels', run && run.state === 'on' ? '!' : '');
    M.set('talents', save.pts ? plural(save.pts, 'point', 'points') + ' à placer' : 'Niveau ' + save.plv, save.pts);
    M.set('grimoire', save.spts ? plural(save.spts, 'point', 'points') + ' de sort à placer' : plural(save.owned.length, 'sort connu', 'sorts connus') + ' · ceinture ' + onBelt().length + ' / ' + beltSize(), save.spts);
    M.set('entrainement', 'Mannequin · duel de niveau ' + save.level);
    var T = save.tower, nIng = Object.keys(save.ingr).reduce(function (a, k) { return a + save.ingr[k]; }, 0), nRec = Object.keys(save.recipes).length, famOn = save.fam.active, fresh = DS.extras.newUnlocks();
    M.set('tour', 'Étage ' + T.floor + (T.best ? ' · record ' + T.best : ''), T.floor % 10 === 0 ? '👑' : '');
    M.set('alchimie', nRec + ' / ' + DS.RECIPES.length + ' recettes · ' + plural(nIng, 'ingrédient', 'ingrédients'), nIng >= 2 && !save.hints.seenLab ? '!' : '');
    M.set('familiers', famOn ? DS.byId(DS.FAMILIARS, famOn).names[(save.fam.owned[famOn] || 1) - 1] : 'Adopte un familier', '');
    if (fresh) M.set('talents', plural(fresh, 'nouveauté', 'nouveautés') + ' au miroir', fresh); // un chapeau, un titre ou une couleur de baguette vient d'être débloqué
    M.set('aventure', DS.BIOMES[save.adv.biome].name + (save.adv.loop ? ' · ' + (save.adv.loop + 1) + 'e tour' : ''), '');
  }
  function onPlace(id) {
    if (id === 'attaque' || id === 'protection' || id === 'effet') startClass(id);
    else if (id === 'aventure') show('aventure');
    else if (id === 'tour') show('tour');
    else if (id === 'alchimie') { save.hints.seenLab = true; show('labo'); }
    else if (id === 'familiers') show('familiers');
    else if (id === 'baguettes') show('wands');
    else if (id === 'magie') show('shop');
    else if (id === 'tournoi') show('cups');
    else if (id === 'talents') show('talents');
    else if (id === 'grimoire') openBook('view');
    else if (id === 'entrainement') show('train');
  }

  // ── Mon grimoire : un vrai livre. Le sommaire sur la première double page, puis une page par sort (et par potion), rangées par chapitre.
  // On tourne les pages (coins, flèches, onglets, clavier) avec une page qui pivote vraiment (#flip, deux faces). Sur la page d'un sort : son signe,
  // son niveau (⬆ pour le faire monter avec des points de sort) et le gros bouton « À ma ceinture ». ──
  function nums(s, M) { return DS.spellNums(s, M); } // les chiffres du sort à son niveau actuel
  var bookAt = 0, flipping = false, PAGES = [];
  function stars(lv) { var t = ''; for (var i = 1; i <= DS.SPELL_MAX_LV; i++) t += i <= lv ? '★' : '☆'; return t; }
  function lvBox(s) { // le niveau du sort : ses chiffres maintenant et au niveau suivant, côte à côte, et le bouton pour monter
    var lv = slv(s.id), top = lv >= DS.SPELL_MAX_LV, c = DS.spellUpCost(s), now = DS.spellStats(s, DS.spellMul(lv)), nxt = top ? null : DS.spellStats(s, DS.spellMul(lv + 1));
    var rows = now.map(function (r, k) { var v2 = nxt ? nxt[k][1] : null, diff = v2 !== null && String(v2) !== String(r[1]); return '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td>' + (top ? '' : '<td class="' + (diff ? 'better' : 'same') + '">' + v2 + '</td>') + '</tr>'; }).join('');
    rows += '<tr><th>Énergie</th><td>' + cost(s) + '</td>' + (top ? '' : '<td class="same">' + cost(s) + '</td>') + '</tr>';
    return '<div class="lvbox"><table><thead><tr><th></th><td>Niveau ' + lv + '</td>' + (top ? '' : '<td class="nx">Niveau ' + (lv + 1) + '</td>') + '</tr></thead><tbody>' + rows + '</tbody></table>' +
      (top ? '<span class="up max">★ Niveau maximum</span>' : '<button class="up' + (save.spts >= c ? ' can' : '') + '" data-up="' + s.id + '">⬆ Monter au niveau ' + (lv + 1) + ' <u>' + plural(c, 'point', 'points') + '</u></button>' +
      (save.spts < c ? '<small class="need">Il te manque ' + plural(c - save.spts, 'point de sort', 'points de sort') + '.</small>' : '')) + '</div>';
  }
  function spellPage(s, cat, i, n, pn) {
    var lv = slv(s.id);
    return '<div class="sp" style="--c:' + s.color + '"><small class="chap">' + cat.icon + ' ' + cat.name + ' · ' + i + ' / ' + n + '</small>' +
      '<div class="glyph-big drag" data-id="' + s.id + '" title="Glisse-moi sur ta ceinture">' + A.glyphSvg(s.glyph, s.color) + '</div><b class="nm">' + s.name + '</b><span class="stars" title="Niveau ' + lv + ' sur ' + DS.SPELL_MAX_LV + '">' + stars(lv) + '</span>' +
      '<small class="lab">' + s.label + ' · ' + s.how + '</small><p class="desc">' + s.desc + '</p>' + lvBox(s) +
      '<button class="entry belt-btn" data-id="' + s.id + '"><span class="seal">✓</span><span class="lbl"></span></button><i class="pn">' + pn + '</i></div>';
  }
  function potionPage(p, i, n, pn) {
    return '<div class="sp potion" style="--c:' + p.color + '"><small class="chap">🧪 Potions · ' + i + ' / ' + n + '</small><div class="glyph-big drag" data-id="' + p.pid + '" title="Glisse-moi sur ta ceinture"><span class="pot">' + p.icon + '</span></div><b class="nm">' + p.name + '</b>' +
      '<span class="stars">× ' + potionCount(p.pid) + '</span><small class="lab">' + p.label + ' · ' + p.how + '</small><p class="desc">' + p.desc + '</p><p class="nums">Bue d’un clic en duel, une fiole de moins à chaque fois.</p>' +
      '<button class="entry belt-btn" data-id="' + p.pid + '"><span class="seal">✓</span><span class="lbl"></span></button><i class="pn">' + pn + '</i></div>';
  }
  function makePages() { // la liste des pages : [sommaire gauche, sommaire droite, sorts…, potions…]
    var pages = [], chaps = [], more = save.owned.length < DS.SPELLS.length;
    var spent = Object.keys(save.slv).some(function (id) { return slv(id) > 1; });
    DS.CATS.forEach(function (cat) {
      var list = DS.SPELLS.filter(function (s) { return s.cat === cat.id && save.owned.indexOf(s.id) >= 0; });
      chaps.push({ icon: cat.icon, name: cat.name, at: pages.length + 2, n: list.length, items: list });
      list.forEach(function (s, i) { pages.push({ html: spellPage(s, cat, i + 1, list.length, pages.length + 3), cat: cat.id, id: s.id }); });
    });
    var pots = DS.POTIONS.filter(function (p) { return potionCount(p.pid) > 0; });
    chaps.push({ icon: '🧪', name: 'Potions', at: pages.length + 2, n: pots.length, items: pots });
    pots.forEach(function (p, i) { pages.push({ html: potionPage(p, i + 1, pots.length, pages.length + 3), cat: 'potion', id: p.pid }); });
    var combos = '<div class="toc combos"><h3>✦ Enchaînements</h3><p class="foot top">Lance ces sorts dans l’ordre, sans traîner (' + String(DS.COMBO_GAP).replace('.', ',') + ' s au plus entre deux) : le <b>dernier</b> frappe comme s’il avait un niveau de plus. Le professeur Brasier les enseigne au cours d’attaque.</p>' +
      DS.COMBOS.map(function (c) { var known = c.seq.every(function (id) { return save.owned.indexOf(id) >= 0; }); return '<div class="combo' + (known ? ' known' : '') + '"><b>' + c.name + '</b><span class="seq">' + c.seq.map(function (id) { var sp = DS.byId(DS.SPELLS, id); return '<i style="--c:' + sp.color + '" title="' + sp.name + '">' + A.glyphSvg(sp.glyph, sp.color) + '</i>'; }).join('<em>→</em>') + '</span><small>' + c.seq.map(function (id) { return DS.byId(DS.SPELLS, id).name; }).join(', ') + (known ? '' : ' · il te manque un sort') + '</small></div>'; }).join('') + '<i class="pn">' + (pages.length + 3) + '</i></div>';
    chaps.push({ icon: '✦', name: 'Enchaînements', at: pages.length + 2, n: 1, items: [] });
    pages.push({ html: combos, cat: 'combo' });
    var left = '<div class="toc"><h3>Mon grimoire</h3><p class="foot top">Coche « À ma ceinture » sur la page d’un sort (' + plural(beltSize(), 'case', 'cases') + '). Pendant un duel, tu peux en changer : bouton 📖 ou touche B.<br>' +
      '<b>⭐ ' + plural(save.spts, 'point', 'points') + ' de sort.</b> Chaque niveau de sorcier gagné en donne un. Sur la page d’un sort, clique sur ⬆ pour le faire monter de niveau (5 au maximum).</p>' +
      '<ul class="chaps">' + chaps.map(function (c) { return '<li><button class="jump" data-go="' + c.at + '">' + c.icon + ' ' + c.name + ' <em>' + (c.n ? plural(c.n, 'page', 'pages') : 'rien encore') + '</em></button></li>'; }).join('') + '</ul>' +
      (more ? '<p class="foot">D’autres sorts se cachent au magasin de magie.</p>' : '') + (spent ? '<p class="foot"><span class="up can" role="button" id="spell-reset">↺ Reprendre tous mes points de sort</span></p>' : '') + '<i class="pn">1</i></div>';
    var right = '<div class="toc"><h3>Sommaire</h3><div class="idx">' + chaps.filter(function (c) { return c.items.length; }).map(function (c) {
      return '<h4>' + c.icon + ' ' + c.name + '</h4>' + c.items.map(function (it, i) { var id = it.pid || it.id; return '<button class="idx-it" data-id="' + id + '" data-go="' + (c.at + i) + '"><span class="seal">✓</span><span>' + it.name + '</span><em>' + (it.pid ? '× ' + potionCount(it.pid) : stars(slv(it.id))) + '</em></button>'; }).join('');
    }).join('') + '</div><i class="pn">2</i></div>';
    pages.unshift({ html: left, cat: 'toc' }, { html: right, cat: 'toc' });
    if (pages.length % 2) pages.push({ html: '<div class="blank"><span>✦</span><i class="pn">' + (pages.length + 1) + '</i></div>', cat: 'blank' });
    PAGES = pages;
    $('book-tabs').innerHTML = '<button class="tab" data-go="0" title="Sommaire">📖</button>' + chaps.map(function (c) { return '<button class="tab' + (c.n ? '' : ' off') + '" data-go="' + c.at + '" title="' + c.name + '">' + c.icon + '</button>'; }).join('');
  }
  // La ceinture, sous le livre, comme en duel : on y glisse le signe d'un sort (ou une case sur une autre pour les échanger ; hors de la ceinture pour la vider).
  function renderBelt() {
    fitBelt();
    $('book-belt').innerHTML = save.spells.map(function (id, i) {
      var s = id ? DS.item(id) : null;
      return s ? '<div class="bslot spell' + (s.potion ? ' potion' : '') + '" data-slot="' + i + '" data-id="' + id + '" style="--c:' + s.color + '"><span class="glyph-box">' + (s.potion ? '<span class="pot">' + s.icon + '</span>' : A.glyphSvg(s.glyph, s.color)) + '</span><b>' + s.name + '</b></div>'
        : '<div class="bslot spell empty" data-slot="' + i + '" style="--c:#8b7f9a"><span class="glyph-box"><span class="plus">+</span></span><b>Glisse un sort ici</b></div>';
    }).join('');
  }
  (function () { // le glisser-déposer : depuis le signe d'une page, ou depuis une case de la ceinture
    var drag = null, ghost = null;
    function at(x, y) { var el = document.elementFromPoint(x, y); return el && el.closest ? el.closest('#book-belt .bslot') : null; }
    document.addEventListener('pointerdown', function (e) {
      if ($('screen-book').classList.contains('hidden') || e.button) return;
      var src = e.target.closest ? e.target.closest('.sp .glyph-big.drag, #book-belt .bslot:not(.empty)') : null; if (!src) return;
      drag = { id: src.dataset.id, from: src.dataset.slot !== undefined ? +src.dataset.slot : -1, x: e.clientX, y: e.clientY, on: false, src: src };
      e.preventDefault();
    });
    document.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (!drag.on) { if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return; drag.on = true; // un vrai glissement : le fantôme apparaît
        ghost = document.createElement('div'); ghost.className = 'drag-ghost'; ghost.innerHTML = drag.src.querySelector('.glyph, .pot').outerHTML; document.body.appendChild(ghost); $('book-belt').classList.add('target'); drag.src.classList.add('lifting'); }
      ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
      var over = at(e.clientX, e.clientY); document.querySelectorAll('#book-belt .bslot.over').forEach(function (x) { if (x !== over) x.classList.remove('over'); }); if (over) over.classList.add('over');
    });
    document.addEventListener('pointerup', function (e) {
      if (!drag) return;
      var d = drag; drag = null; if (ghost) { ghost.remove(); ghost = null; } $('book-belt').classList.remove('target'); d.src.classList.remove('lifting');
      if (!d.on) return;
      var over = at(e.clientX, e.clientY), to = over ? +over.dataset.slot : -1, sp = save.spells;
      if (to < 0) { if (d.from >= 0) { if (onBelt().length === 1) return shake(d.src); sp[d.from] = null; } else return; } // lâché hors de la ceinture : la case se vide
      else if (d.from >= 0) { var t = sp[to]; sp[to] = sp[d.from]; sp[d.from] = t; } // d'une case à l'autre : on échange
      else { var j = sp.indexOf(d.id); if (j >= 0) sp[j] = sp[to]; sp[to] = d.id; } // depuis une page : il prend la case (et l'ancien va là où il était, s'il y était déjà)
      persist(); SFX.select(); renderBelt(); markPicked();
    });
  })();
  function renderSpread() { // les deux pages ouvertes
    bookAt = Math.max(0, Math.min(PAGES.length - 2, bookAt - bookAt % 2));
    $('page-left').innerHTML = PAGES[bookAt].html; $('page-right').innerHTML = PAGES[bookAt + 1].html;
    $('corner-left').classList.toggle('hidden', bookAt <= 0); $('corner-right').classList.toggle('hidden', bookAt + 2 >= PAGES.length);
    renderBelt();
    $('book-tabs').querySelectorAll('.tab').forEach(function (t) { var at = +t.dataset.go; t.classList.toggle('cur', at <= bookAt && (!t.nextElementSibling || +t.nextElementSibling.dataset.go > bookAt || t.nextElementSibling.classList.contains('off'))); });
    markPicked();
  }
  function goPage(at) { // tourner une page : la face avant, c'est la page qu'on soulève ; la face arrière, celle qu'on découvre
    at = Math.max(0, Math.min(PAGES.length - 2, at - at % 2));
    if (flipping || at === bookAt) return;
    var fwd = at > bookAt, fl = $('flip'), pl = $('page-left'), pr = $('page-right'), ref = fwd ? pr : pl;
    fl.style.left = ref.offsetLeft + 'px'; fl.style.top = ref.offsetTop + 'px'; fl.style.width = ref.offsetWidth + 'px'; fl.style.height = ref.offsetHeight + 'px';
    fl.querySelector('.front').innerHTML = fwd ? PAGES[bookAt + 1].html : PAGES[bookAt].html;
    fl.querySelector('.back').innerHTML = fwd ? PAGES[at].html : PAGES[at + 1].html;
    if (fwd) pr.innerHTML = PAGES[at + 1].html; else pl.innerHTML = PAGES[at].html; // ce qu'il y a sous la page qu'on soulève
    fl.className = 'flip ' + (fwd ? 'fwd' : 'back'); flipping = true; SFX.page();
    var done = function () { flipping = false; fl.className = 'flip hidden'; bookAt = at; renderSpread(); };
    fl.querySelector('.front').onanimationend = null; fl.onanimationend = function (e) { if (e.target === fl) done(); };
    setTimeout(function () { if (flipping) done(); }, 8000); // au cas où l'animation ne se termine pas (animationend)
    markPicked();
  }
  function buildBook(quiet) { // quiet : on redessine les pages sans rouvrir le livre (après avoir fait monter un sort)
    var run = save.run;
    makePages(); if (!quiet) bookAt = 0; renderSpread();
    if (bookMode === 'cup' && !(run && run.state === 'on')) bookMode = 'view';
    $('btn-book-go').textContent = bookMode === 'view' ? 'Fermer le grimoire' : '⚔ Au duel ! — ' + (bookMode === 'cup' ? stepName(run, run.step).toLowerCase() : bookMode === 'tour' ? 'étage ' + save.tower.floor + ' de la tour' : 'adversaire de niveau ' + save.level);
    if (quiet) return;
    var b = $('book'); b.classList.remove('opening'); void b.offsetWidth; b.classList.add('opening'); // le livre s'ouvre
  }
  $('book').addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null; if (!t || flipping) return;
    var up = t.closest('[data-up]'), go = t.closest('[data-go]'), belt = t.closest('.belt-btn'), reset = t.closest('#spell-reset');
    if (up) { if (!upgrade(up.dataset.up)) return shake(up.closest('.lvbox')); SFX.levelUp(); makePages(); renderSpread(); return; } // ⬆ : le sort monte d'un niveau
    if (reset) { resetSpellLevels(); SFX.back(); makePages(); renderSpread(); return; }
    if (go) { SFX.click(); goPage(+go.dataset.go); return; }
    if (belt) {
      var id = belt.dataset.id, i = save.spells.indexOf(id), free = save.spells.indexOf(null);
      if (i >= 0) { if (onBelt().length === 1) return shake(belt); save.spells[i] = null; }
      else { if (free < 0) return shake(belt); save.spells[free] = id; } // ceinture pleine : il faut d'abord en retirer un
      persist(); SFX.select(); renderBelt(); markPicked();
    }
  });
  $('corner-left').addEventListener('click', function () { goPage(bookAt - 2); });
  $('corner-right').addEventListener('click', function () { goPage(bookAt + 2); });
  window.addEventListener('keydown', function (e) {
    if ($('screen-book').classList.contains('hidden') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'ArrowRight' || e.code === 'PageDown') goPage(bookAt + 2); else if (e.code === 'ArrowLeft' || e.code === 'PageUp') goPage(bookAt - 2);
  });
  function known() { return DS.SPELLS.filter(function (s) { return save.owned.indexOf(s.id) >= 0; }).concat(DS.POTIONS.filter(function (p) { return potionCount(p.pid) > 0; })); } // tous les sorts appris, et les potions qu'on a : le tiroir
  function belt() { fitBelt(); return save.spells.map(function (id) { return id ? DS.item(id) : null; }); } // la ceinture, case par case
  function potionCount(pid) { var p = DS.item(pid); return p && p.potion ? save.potions[p.id] || 0 : 0; }
  function drinkPotion(pid) { var p = DS.item(pid); if (!p || !potionCount(pid)) return; save.potions[p.id]--; if (!save.potions[p.id]) delete save.potions[p.id]; fitBelt(); persist(); } // bue en duel
  function openBook(mode) { bookMode = mode; show('book'); }

  // ── Magasin de magie : une boutique à fouiller. Le décor (img/magasin.jpg) est couvert de zones invisibles : piles de parchemins, fioles, objets.
  // On clique partout pour chercher. Un arrivage cache quelques sorts dans les parchemins (et parfois dans le coffre ou une note) ; le reste ne sert
  // à rien, sauf un objet où traînent des pièces oubliées. Les potions, elles, sont toujours au comptoir. Nouvel arrivage après chaque duel.
  var SPOTS = DS.SHOP_SPOTS.concat(DS.SHOP_SPOTS2), shopSel = null, shopRoom = 0; // toutes les zones des deux salles ; shopRoom : celle qu'on voit
  function newStock() { // un nouvel arrivage : où se cachent les sorts, et où traînent des pièces
    var lay = {}, toLearn = shuffle(DS.SPELLS.filter(function (s) { return save.owned.indexOf(s.id) < 0; })), hides = shuffle(SPOTS.filter(function (o) { return o.hide; }));
    var n = Math.min(toLearn.length, Math.ceil(hides.length * 0.5)); // la moitié des cachettes, au plus
    var coins = function () { return 1 + Math.floor(Math.random() * 3); }; // ce qui ne sert à rien rapporte parfois 1 à 3 pièces, ou cache un ingrédient pour le laboratoire
    SPOTS.forEach(function (o) { if (!o.pid) { var r = Math.random(); lay[o.id] = { k: 'junk', t: Math.floor(Math.random() * DS.SHOP_JUNK.length), n: r < 0.4 ? coins() : 0, ing: r >= 0.4 && r < 0.62 ? DS.INGREDIENTS[Math.floor(Math.random() * DS.INGREDIENTS.length)].id : null }; } }); // deux fois sur cinq des pièces, une fois sur cinq un ingrédient
    hides.forEach(function (o, i) { if (i < n) lay[o.id] = { k: 'spell', id: toLearn[i].id }; });
    var golds = shuffle(SPOTS.filter(function (o) { return o.gold; }));
    if (golds.length) lay[golds[0].id] = { k: 'gold', n: 6 + Math.floor(Math.random() * 10) };
    save.shop = { lay: lay, found: {}, taken: {}, fresh: true };
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function stockOk() { var sh = save.shop; return sh && sh.lay && sh.found && sh.taken && Object.keys(sh.lay).every(function (id) { return DS.byId(SPOTS, id); }); }
  function spotContent(o) { // ce qu'il y a dans une zone, aujourd'hui : potion, sort (trouvé ou déjà appris), ou rien d'utile mais quelques pièces (tant qu'on ne les a pas récoltées)
    if (o.pid) return { k: 'potion', item: DS.item(o.pid) };
    var c = save.shop.lay[o.id] || { k: 'junk', n: 2 }, left = save.shop.taken[o.id] ? 0 : c.n || 0;
    if (c.k === 'spell') { var s = DS.byId(DS.SPELLS, c.id); if (!s) return { k: 'junk', n: left }; return save.owned.indexOf(s.id) >= 0 ? { k: 'bought', item: s } : { k: 'spell', item: s }; }
    return { k: c.k === 'gold' ? 'gold' : 'junk', t: c.t, n: left, ing: !save.shop.taken[o.id] && c.ing && DS.byId(DS.INGREDIENTS, c.ing) ? DS.byId(DS.INGREDIENTS, c.ing) : null };
  }
  function spotText(o, c) {
    if (c.k === 'spell') return (o.found || DS.SHOP_FOUND).replace('{sort}', '<b>' + c.item.name + '</b>');
    if (c.k === 'bought') return o.id === 'chest' ? 'Le coffre est vide : le parchemin de ' + c.item.name + ' est dans ton grimoire.' : 'Il ne reste que la ficelle : ce parchemin, c’était ' + c.item.name + '. Tu l’as déjà appris.';
    var t = o.text || DS.SHOP_JUNK[(c.t || 0) % DS.SHOP_JUNK.length];
    if (c.k === 'gold') return t + (c.n ? ' Et dessous… <b>' + plural(c.n, 'pièce oubliée', 'pièces oubliées') + '</b> !' : ' Les pièces qui traînaient là sont déjà dans ta bourse.');
    return t + (c.n ? ' Mais regarde : <b>' + plural(c.n, 'pièce d’or', 'pièces d’or') + '</b> traînaient à côté !' : c.ing ? ' Et coincé derrière, ça : ' + c.ing.icon + ' <b>' + c.ing.name + '</b>. Un ingrédient pour le laboratoire d’alchimie !' : '');
  }
  function harvest(id) { // le gros bouton jaune : on ramasse les pièces (ou l'ingrédient)
    var o = DS.byId(SPOTS, id), c = spotContent(o); if (!c.n && !c.ing) return;
    if (c.n) { save.gold += c.n; SFX.coin(); } else { save.ingr[c.ing.id] = (save.ingr[c.ing.id] || 0) + 1; SFX.chime(); }
    save.shop.taken[id] = true; persist(); buildShop(); shopDetail(id);
  }
  function buildShop() {
    var room = DS.SHOP_ROOMS[shopRoom];
    paintBg('shop', function (W, H) { return A.makeShopBg(W, H, true); }, room.img);
    if (!stockOk()) { newStock(); persist(); }
    var sc = $('shop-scene'), found = save.shop.found;
    sc.style.backgroundImage = 'url(' + room.img + ')'; sc.style.aspectRatio = room.w + ' / ' + room.h; sc.style.width = 'min(100vw, calc(100vh * ' + room.w + ' / ' + room.h + '))';
    $('store-room').textContent = shopRoom ? '◀ Retour à la boutique' : 'L’arrière-boutique ▶';
    sc.innerHTML = room.spots.map(function (o) {
      var c = spotContent(o), cls = o.pid ? 'potion' : found[o.id] ? 'found ' + (c.k === 'spell' ? 'spell' : c.k === 'bought' ? 'gone' : c.n ? 'coins' : c.ing ? 'ing' : 'junk') : '';
      var r = o.r, st = 'left:' + (r[0] / room.w * 100).toFixed(2) + '%;top:' + (r[1] / room.h * 100).toFixed(2) + '%;width:' + (r[2] / room.w * 100).toFixed(2) + '%;height:' + (r[3] / room.h * 100).toFixed(2) + '%';
      var n = o.pid ? potionCount(o.pid) : 0;
      return '<button class="spot ' + cls + (shopSel === o.id ? ' sel' : '') + '" data-id="' + o.id + '" style="' + st + (c.item ? ';--c:' + c.item.color : '') + '" aria-label="' + o.name + '">' + (n ? '<em class="n">× ' + n + '</em>' : '') + '</button>';
    }).join('');
    sc.querySelectorAll('.spot').forEach(function (el) { el.addEventListener('click', function () { search(el.dataset.id); }); });
    var left = SPOTS.filter(function (o) { return !o.pid && !found[o.id]; }).length;
    $('store-hint').innerHTML = save.shop.fresh ? '<b>Nouvel arrivage !</b> Fouille la boutique et son arrière-boutique : clique sur les parchemins et les objets. Certains cachent un sort, d’autres rien du tout.' :
      left ? 'Il reste ' + plural(left, 'endroit', 'endroits') + ' à fouiller. Le marchand reçoit de nouveaux objets après chaque duel.' : 'Tu as tout fouillé ! Reviens après un duel : le marchand aura reçu de nouveaux objets.';
    if (shopSel) shopDetail(shopSel);
    document.querySelectorAll('.gold-amt').forEach(function (el) { el.textContent = save.gold; });
  }
  function search(id) { // on fouille une zone
    var o = DS.byId(SPOTS, id), c = spotContent(o);
    shopSel = id; save.shop.fresh = false;
    if (c.k === 'spell' && !save.shop.found[id]) SFX.chime(); else SFX.select();
    save.shop.found[id] = true; persist();
    buildShop(); shopDetail(id, c);
  }
  $('store-room').addEventListener('click', function () { shopRoom = 1 - shopRoom; closeDetail(); SFX.whoosh(); buildShop(); }); // la porte vers l'autre salle
  function closeDetail() { shopSel = null; $('shop-detail').classList.add('hidden'); $('shop-scene').querySelectorAll('.spot.sel').forEach(function (x) { x.classList.remove('sel'); }); }
  function shopDetail(id, c) {
    var o = DS.byId(SPOTS, id), d = $('shop-detail'); c = c || spotContent(o);
    var s = c.item, n = s && s.potion ? (save.potions[s.id] || 0) : 0;
    d.classList.remove('hidden'); d.classList.toggle('left', o.r[0] + o.r[2] / 2 > DS.SHOP_ROOMS[shopRoom].w / 2); // la fiche s'ouvre du côté opposé à l'objet
    d.style.setProperty('--c', s ? s.color : c.k === 'gold' ? '#e9c46a' : '#8b7f9a');
    var head = c.k === 'spell' ? '<div class="unroll"><span class="rod"></span><div class="paper">' + A.glyphSvg(s.glyph, s.color) + '</div><span class="rod"></span></div><b>' + s.name + '</b><small>' + s.label + ' · ' + s.how + '</small>' // le parchemin se déroule, le signe s'y grave en brillant
      : s ? '<div class="big">' + (s.potion ? '<span class="pot">' + s.icon + '</span>' : A.glyphSvg(s.glyph, s.color)) + '</div><b>' + s.name + '</b><small>' + s.label + ' · ' + s.how + '</small>' : '<div class="big"><span class="pot">' + (c.n ? '<i class="coin"></i>' : c.ing ? c.ing.icon : o.icon) + '</span></div><b>' + o.name + '</b>';
    if (c.ing) d.style.setProperty('--c', c.ing.color);
    var body = c.k === 'potion' ? '<p>' + s.desc + '</p>' + (n ? '<p class="have">Tu en as ' + n + '.</p>' : '') + '<button class="btn primary buy">Acheter · ' + s.price + ' <i class="coin"></i></button><p class="note">' + (n && save.spells.indexOf(s.pid) < 0 ? 'Ta ceinture est pleine : coche la potion dans ton grimoire, ou glisse-la sur ta ceinture pendant un duel (touche B).' : 'Une case de ceinture par potion. Un clic dessus en duel, et elle est bue.') + '</p>'
      : c.k === 'spell' ? '<p class="tale">' + spotText(o, c) + '</p><p>' + s.desc + '</p><p class="nums">' + nums(s, DS.spellMul(1)) + ' · coûte ' + cost(s) + ' d’énergie</p><button class="btn primary buy">Acheter · ' + s.price + ' <i class="coin"></i></button><p class="note">Appris pour toujours : il rejoint ton grimoire.</p>'
      : '<p class="tale">' + spotText(o, c) + '</p>' + (c.n ? '<button class="btn primary harvest"><i class="coin"></i> Récolter ' + plural(c.n, 'pièce d’or', 'pièces d’or') + '</button>' : c.ing ? '<button class="btn primary harvest">' + c.ing.icon + ' Prendre : ' + c.ing.name + '</button>' : c.k === 'bought' ? '' : '<p class="note">' + (save.shop.taken[id] ? 'Récolté. ' : '') + 'Ça ne sert à rien d’autre. Continue à fouiller !</p>');
    d.innerHTML = '<button class="close" aria-label="Fermer">✕</button>' + head + body;
    d.querySelector('.close').addEventListener('click', closeDetail);
    if (d.querySelector('.harvest')) d.querySelector('.harvest').addEventListener('click', function () { harvest(id); });
    if (!d.querySelector('.buy')) return;
    d.querySelector('.buy').addEventListener('click', function () {
      buy(d, s, function () {
        var free = save.spells.indexOf(null);
        if (s.potion) { save.potions[s.id] = (save.potions[s.id] || 0) + 1; if (free >= 0 && save.spells.indexOf(s.pid) < 0) save.spells[free] = s.pid; }
        else { save.owned.push(s.id); if (free >= 0) save.spells[free] = s.id; }
        delete d.dataset.sure; fitBelt(); buildShop();
      });
    });
  }

  // ── Talents ──
  // Fonds peints du magasin et de la chambre du miroir (js/art.js), rendus une fois par taille d'écran. Si img/magasin.jpg ou img/miroir.jpg existe, c'est lui qu'on prend.
  var bgs = {};
  function paintBg(id, make, file) {
    var el = $('screen-' + id), key = window.innerWidth + 'x' + window.innerHeight;
    if (bgs[id] === key) return; bgs[id] = key;
    el.style.backgroundImage = 'url(' + make(Math.min(1600, window.innerWidth), Math.min(1000, window.innerHeight)).toDataURL('image/jpeg', 0.82) + ')';
    var img = new Image(); img.onload = function () { el.style.backgroundImage = 'url(' + file + ')'; bgs[id] = 'img'; }; img.src = file;
  }
  // Le miroir magique : notre reflet, et ce que le miroir nous dit. Les talents sont de grandes cartes : un clic, et le miroir exauce.
  var MIRROR_SAYS = { hp: 'Te voilà plus solide !', mana: 'Ta réserve de magie grandit.', regen: 'La magie revient plus vite en toi.', cost: 'Tes sorts te demandent moins d’effort.', gold: 'L’or te sourira davantage.', guard: 'Ton bouclier tiendra plus longtemps.', belt: 'Une case de plus à ta ceinture !' };
  var mirrorT = 0, mirrorAnim = 0;
  function drawMirrorMe() {
    var cv = $('mirror-me'); if (!cv) return;
    A.drawMirror(cv.getContext('2d'), cv.width, cv.height, look(), myAge(), mirrorT);
  }
  // Le miroir a quatre pages : les talents, et la garde-robe (chapeaux, baguette, titres — js/extras.js)
  var mirrorTab = 'talents';
  function renderTalents(said, tab) {
    paintBg('talents', A.makeMirrorBg, 'img/miroir.jpg');
    if (tab) mirrorTab = tab;
    DS.extras.mirrorTab(mirrorTab);
    $('mirror-tabs').querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === mirrorTab); });
    $('talent-pts').textContent = save.pts;
    drawMirrorMe();
    clearInterval(mirrorAnim); mirrorAnim = setInterval(function () { if ($('screen-talents').classList.contains('hidden')) return clearInterval(mirrorAnim); mirrorT += 0.1; drawMirrorMe(); }, 100);
    if (mirrorTab !== 'talents') {
      $('talent-note').innerHTML = said ? '<i>« ' + said + ' »</i>' : '<i>« Fais-toi beau, ' + me().name + '. »</i><br>' + (mirrorTab === 'hats' ? 'Chaque chapeau se gagne par un exploit. Celui que tu portes se voit sur la carte, ici et en duel.' : mirrorTab === 'wand' ? 'La couleur de ton tracé, le manche et le cœur de ta baguette.' : 'Un titre, à porter après ton prénom.');
      $('btn-talents-reset').classList.add('hidden');
      return DS.extras.renderLook(mirrorTab);
    }
    $('talent-note').innerHTML = said ? '<i>« ' + said + ' »</i>' : save.pts ? '<i>« Miroir, mon beau miroir… »</i><br>Tu as <b>' + plural(save.pts, 'point', 'points') + '</b> à placer. Dis-moi comment tu veux devenir plus fort : clique sur un +.' : '<i>« Je te vois, ' + me().name + '. »</i><br>Reviens me voir quand tu auras gagné un niveau : il te manque ' + (DS.xpNeed(save.plv) - save.xp) + ' XP.';
    // la fiche de personnage : une ligne par attribut (icône, nom, valeur totale, pastilles, bouton +), puis quelques chiffres sur le sorcier
    var wand = DS.byId(DS.WANDS, save.wand), total = function (t, n) { // ce que ça donne en tout, avec n points
      var v = n * t.per;
      var perk = me().perk || {}; return t.id === 'hp' ? (100 + (perk.hp || 0) + v) + ' PV' : t.id === 'mana' ? (50 + (perk.mana || 0) + v) + ' PM' : t.id === 'regen' ? '+' + v + ' %' : t.id === 'cost' ? '−' + v + ' %' : t.id === 'gold' ? '+' + v + ' %' : t.id === 'guard' ? '+' + v.toFixed(1).replace('.', ',') + ' s' : (DS.BELT_BASE + v) + ' cases';
    };
    $('talent-list').innerHTML = '<div class="sheet"><div class="sh-head"><b>' + me().name + '</b><span>Niveau ' + save.plv + ' · ' + save.xp + ' / ' + DS.xpNeed(save.plv) + ' XP</span><span class="pts' + (save.pts ? ' has' : '') + '">Points à placer : <b>' + save.pts + '</b></span></div>' +
      '<table class="attrs">' + DS.STATS.map(function (t) {
        var n = stat(t.id), max = statMax(t.id), can = save.pts > 0 && n < max, pips = '';
        for (var i = 0; i < max; i++) pips += '<i' + (i < n ? ' class="on"' : '') + '></i>';
        return '<tr class="' + (n ? 'has' : '') + '"><td class="ico">' + t.icon + '</td><th><b>' + t.name + '</b><small>' + t.text(t.per).replace(/^L’/, 'l’') + ' par point</small></th><td class="val">' + total(t, n) + '</td><td class="pips">' + pips + '</td>' +
          '<td class="plus"><button class="add' + (can ? ' can' : '') + '" data-id="' + t.id + '"' + (can ? '' : ' disabled') + ' title="' + (n >= max ? 'Au maximum' : 'Un point : ' + t.text(t.per).toLowerCase()) + '">' + (n >= max ? '★' : '+') + '</button></td></tr>';
      }).join('') + '</table>' +
      '<div class="sh-foot"><span>🪄 ' + wand.name + '</span><span>📖 ' + plural(save.owned.length, 'sort connu', 'sorts connus') + '</span><span>⚔ ' + plural(save.wins, 'victoire', 'victoires') + '</span><span>🏆 ' + plural(trophies(), 'coupe', 'coupes') + '</span><span>⭐ ' + plural(save.spts, 'point de sort', 'points de sort') + '</span></div></div>';
    $('talent-list').querySelectorAll('.add.can').forEach(function (b) {
      b.addEventListener('click', function () {
        save.stats[b.dataset.id] = stat(b.dataset.id) + 1; save.pts--; fitBelt(); persist(); SFX.point(stat(b.dataset.id)); SFX.sparkle();
        var m = $('mirror'); m.classList.remove('flash'); void m.offsetWidth; m.classList.add('flash'); // le miroir exauce : il s'illumine
        renderTalents(MIRROR_SAYS[b.dataset.id]);
      });
    });
    var spent = 0; DS.STATS.forEach(function (t) { spent += stat(t.id); });
    $('btn-talents-reset').classList.toggle('hidden', !spent);
  }
  function resetTalents() { DS.STATS.forEach(function (t) { save.pts += stat(t.id); }); save.stats = {}; fitBelt(); persist(); renderTalents(); }

  // ── Tournois ──
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function cupOpen(i) { return i === 0 || save.cups[DS.CUPS[i - 1].id] > 0; }
  // Niveaux des adversaires d'une coupe, tirés au hasard à chaque participation : ça monte de duel en duel, le premier n'est jamais dans la moitié haute
  // de la plage, et la finale est au niveau le plus haut (ou juste en dessous).
  function cupLevels(lo, hi, n) {
    var first = lo + Math.floor(Math.random() * (Math.floor((hi - lo) / 2) + 1)), last = hi - (Math.random() < 0.35 ? 1 : 0), mid = [];
    for (var i = 0; i < n - 2; i++) mid.push(first + Math.floor(Math.random() * (last - first + 1)));
    return [first].concat(mid.sort(function (a, b) { return a - b; }), [last]);
  }
  // run = { cup, pre: adversaires des qualifications, levels: niveau de chaque duel, rounds: le tableau des 8 tour après tour, step: numéro du duel à jouer
  // (qualifications comprises), round: tour du tableau, state: 'on' | 'won' | 'lost', lostAt: duel perdu }. Tout est tiré au hasard à chaque participation.
  function startCup(id) {
    var cup = DS.byId(DS.CUPS, id), pool = shuffle(DS.CHARACTERS.concat(DS.RIVALS).filter(function (c) { return c.id !== save.char; }).map(function (c) { return c.id; }));
    save.run = { cup: id, pre: pool.slice(0, cup.pre), levels: cupLevels(cup.levels[0], cup.levels[1], cup.pre + 3), rounds: [shuffle(pool.slice(cup.pre, cup.pre + 7).concat(['me']))], step: 0, round: 0, state: 'on' };
    persist(); renderCups();
  }
  function stepName(run, step) { var n = run.pre.length; return step < n ? 'Qualification' + (n > 1 ? ' ' + (step + 1) : '') : DS.ROUNDS[step - n]; } // nom du duel numéro step
  function rival() { // notre adversaire du duel en cours
    var run = save.run; if (run.step < run.pre.length) return run.pre[run.step];
    var r = run.rounds[run.round], i = r.indexOf('me'); return r[i ^ 1];
  }
  // Fait avancer le tableau : notre duel (gagné ou perdu) et, au hasard, ceux des autres. Perdu : on joue la coupe jusqu'au bout sans nous.
  function advance(won) {
    var run = save.run, cur = run.rounds[run.round], next = [], i;
    if (run.step < run.pre.length) { // qualification : gagnée, on passe au duel suivant ; perdue, celui qui nous a battus prend notre place dans le tableau
      if (won) { run.step++; return; }
      run.state = 'lost'; run.lostAt = run.step; cur[cur.indexOf('me')] = run.pre[run.step];
      while (cur.length > 1) { next = []; for (i = 0; i < cur.length; i += 2) next.push(cur[i + (Math.random() < 0.5 ? 0 : 1)]); run.rounds.push(next); cur = next; }
      return;
    }
    for (i = 0; i < cur.length; i += 2) {
      var mine = cur[i] === 'me' || cur[i + 1] === 'me';
      next.push(mine ? (won ? 'me' : cur[i] === 'me' ? cur[i + 1] : cur[i]) : cur[i + (Math.random() < 0.5 ? 0 : 1)]);
    }
    run.rounds.push(next);
    if (!won) { run.state = 'lost'; run.lostAt = run.step; while (next.length > 1) { cur = next; next = []; for (i = 0; i < cur.length; i += 2) next.push(cur[i + (Math.random() < 0.5 ? 0 : 1)]); run.rounds.push(next); } }
    else if (next.length === 1) run.state = 'won';
    else { run.round++; run.step++; }
  }
  function renderCups() {
    var run = save.run;
    $('cup-list').classList.toggle('hidden', !!run); $('cup-run').classList.toggle('hidden', !run);
    $('cups-title').textContent = run ? DS.byId(DS.CUPS, run.cup).name : 'Tournois';
    if (run) return renderRun();
    $('cup-list').innerHTML = DS.CUPS.map(function (c, i) {
      var open = cupOpen(i), n = save.cups[c.id] || 0;
      return '<div class="cup' + (open ? '' : ' locked') + '" style="--c:' + c.color + '"><span class="trophy">🏆</span><b>' + c.name + '</b><small>Adversaires de niveau ' + c.levels[0] + ' à ' + c.levels[1] + '</small><small>' + (c.pre + 3) + ' duels' + (c.pre ? ' (dont ' + plural(c.pre, 'qualification', 'qualifications') + ')' : '') + '</small><small>Prix : ' + c.gold + ' <i class="coin"></i> · ' + c.xp + ' XP</small>' +
        '<span class="won">' + (n ? 'Gagnée ' + n + ' fois' : '') + '</span>' +
        (open ? '<button class="btn primary" data-id="' + c.id + '">Participer</button>' : '<span class="lock">🔒 Gagne d’abord la ' + DS.CUPS[i - 1].name + '</span>') + '</div>';
    }).join('');
    $('cup-list').querySelectorAll('.btn').forEach(function (b) { b.addEventListener('click', function () { startCup(b.dataset.id); }); });
  }
  function renderRun() {
    var run = save.run, cup = DS.byId(DS.CUPS, run.cup), html = '', on = run.state === 'on', opp = on ? who(rival()) : null, nq = run.pre.length, inPre = on && run.step < nq;
    if (nq) html += '<div class="quals"><b>Qualifications</b>' + run.pre.map(function (id, k) { // les duels à gagner avant d'entrer dans le tableau des 8
      var lost = run.state === 'lost' && run.lostAt === k, st = lost ? ' won' : k < run.step || run.state === 'won' ? ' out' : on && k === run.step ? ' mine' : ' tbd'; // battu : barré ; il nous a battus : en gras
      return '<span class="who' + st + '">' + (st === ' tbd' ? '?' : who(id).name) + ' <small>niv. ' + run.levels[k] + (lost ? ' · il t’élimine' : '') + '</small></span>';
    }).join('') + '</div>';
    for (var r = 0; r < 4; r++) {
      var ids = run.rounds[r], after = run.rounds[r + 1], size = 8 >> r, col = '';
      for (var i = 0; i < size; i += 2) {
        var cell = '', mine = false;
        for (var j = i; j < Math.min(size, i + 2); j++) {
          var id = ids ? ids[j] : null;
          if (id === 'me') mine = true;
          cell += '<span class="who' + (id ? (id === 'me' ? ' me' + (inPre ? ' tbd' : '') : '') + (after ? (after.indexOf(id) >= 0 ? ' won' : ' out') : '') : ' tbd') + '">' + (id ? who(id).name + (r === 3 ? ' 🏆' : '') : '?') + '</span>';
        }
        col += '<div class="match' + (mine && on && !inPre && r === run.round ? ' mine' : '') + '">' + cell + '</div>';
      }
      html += '<div class="round"><h4>' + (DS.ROUNDS[r] || 'Vainqueur') + (r < 3 ? ' <small>niv. ' + run.levels[nq + r] + '</small>' : '') + '</h4><div class="col">' + col + '</div></div>';
    }
    $('bracket').innerHTML = html;
    $('run-note').textContent = on ? stepName(run, run.step) + ' : tu affrontes ' + opp.name + ' ' + opp.title + ' (niveau ' + run.levels[run.step] + ').' + (inPre ? ' Gagne pour entrer dans le tableau des 8.' : '')
      : run.state === 'won' ? 'Tu remportes la ' + cup.name + ' !' : 'Éliminé en ' + stepName(run, run.lostAt).toLowerCase() + '. ' + who(run.rounds[3][0]).name + ' remporte la coupe.';
    $('btn-run-go').textContent = on ? '⚔ Affronter ' + opp.name : 'Retour aux tournois';
    $('btn-run-quit').classList.toggle('hidden', !on);
  }

  // ───────────────────────── Duel ─────────────────────────
  function launch(cfg) {
    var klass = cfg.klass;
    $('duel-end').classList.add('hidden'); $('duel-pause').classList.add('hidden');
    $('hint-hold').classList.toggle('hidden', !stat('guard')); $('hint-swipe').classList.toggle('hidden', !cfg.wand.swipe);
    $('screen-duel').classList.toggle('school', !!klass); if (!klass) { DS.school.close(); DS.classe.close(); }
    $('btn-quit').textContent = duelMode === 'cup' ? 'Abandonner (tu seras éliminé de la coupe)' : klass ? 'Quitter le cours' : 'Abandonner le duel';
    $('btn-engage').innerHTML = klass ? 'Terminer le cours' : '⚔ Commencer le duel <small>Entrée</small>';
    show('duel');
    DS.duel.start(cfg, { onPause: function (v) { $('duel-pause').classList.toggle('hidden', !v); SFX.pause(v); DS.music.duck(v ? 0.35 : 1); }, onEnd: onDuelEnd,
      onPhase: function (ph) { duelMusic(ph, klass); },
      onBelt: function (ids) { save.spells = ids; fitBelt(); persist(); }, // ceinture réarrangée pendant le duel : on la retrouvera telle quelle
      onPotion: drinkPotion,
      // en cours : la leçon en classe (js/classe.js) ou la pratique et les défis (js/school.js) décident de ce que vaut chaque tracé
      onTrace: klass ? function (e) { return (DS.classe.active() ? DS.classe : DS.school).onTrace(e); } : null,
      onFoeHit: klass ? function (e) { (DS.classe.active() ? DS.classe : DS.school).onFoeHit(e); } : null,
      onFoeTry: klass ? function (e) { return DS.classe.active() ? DS.classe.onFoeTry(e) : true; } : null,
      onWall: klass ? function (e) { if (DS.classe.active()) DS.classe.onWall(e); } : null,
      onPlayerHit: klass ? function (e) { (DS.classe.active() ? DS.classe : DS.school).onPlayerHit(e); } : null });
    if (!klass) { // l'adversaire nous lance une pique, selon son âge
      var foe = DS.duel.state.f, bub = $('prep-bubble');
      $('prep-who').textContent = foe.ch.name + ' ' + foe.ch.title; $('prep-taunt').textContent = taunt(foe.ch, foe.age);
      bub.classList.remove('pop'); void bub.offsetWidth; bub.classList.add('pop');
    }
  }
  // Une réplique d'avant-duel : celle de son âge (jamais deux fois la même de suite) ; adulte, parfois sa réplique fétiche.
  var lastTaunt = '';
  function taunt(ch, age) {
    var list = (DS.TAUNTS[age] || DS.TAUNTS.adult).concat(DS.TAUNTS.all), t;
    if (ch.taunts) { do { t = ch.taunts[Math.floor(Math.random() * ch.taunts.length)]; } while (t === lastTaunt && ch.taunts.length > 1); lastTaunt = t; return t; } // un monstre a ses grognements à lui
    if (ch.nice && Math.random() < 0.6) list = DS.TAUNTS.nice; // les gentils restent polis
    if (age === 'adult' && !ch.nice && DS.QUIPS[ch.id] && DS.QUIPS[ch.id] !== lastTaunt && Math.random() < 0.34) t = DS.QUIPS[ch.id];
    else do { t = list[Math.floor(Math.random() * list.length)]; } while (t === lastTaunt && list.length > 1);
    lastTaunt = t;
    // {nom} : son prénom · {il|elle} : selon celui ou celle qui parle · [il|elle] : selon notre sorcier
    return t.replace(/\{nom\}/g, ch.name).replace(/\{([^|{}]*)\|([^|{}]*)\}/g, function (m, a, b) { return ch.f ? b : a; }).replace(/\[([^|\[\]]*)\|([^|\[\]]*)\]/g, function (m, a, b) { return me().f ? b : a; });
  }
  function potionCounts() { var out = {}; DS.POTIONS.forEach(function (p) { if (save.potions[p.id]) out[p.pid] = save.potions[p.id]; }); return out; }
  function baseCfg() {
    var levels = {};
    DS.SPELLS.forEach(function (s) { levels[s.id] = slv(s.id); });
    return { char: look(), age: myAge(), wand: DS.extras.styledWand(DS.byId(DS.WANDS, save.wand)), spells: belt(), all: known(), potions: potionCounts(), mods: mods(), slv: levels, level: save.level, look: DS.extras.lookCfg(), fam: DS.extras.famCfg() };
  }
  // Un combat de l'aventure (js/aventure.js) : une horde de monstres, par vagues, et le biome qui s'en mêle.
  function startAdventureDuel(o) {
    var cfg = baseCfg();
    advFight = o; duelMode = 'aventure'; cfg.level = o.level; cfg.foe = o.foe; cfg.horde = o.horde;
    launch(cfg);
    DS.duel.engage(); // pas de bouton « Commencer » : le combat démarre tout de suite (Yum… Kaï… 3, 2, 1)
  }
  // Un étage de la Tour des Épreuves (js/extras.js) : l'adversaire de l'étage, et ses règles.
  function startTower(tc) {
    var cfg = baseCfg();
    towerCfg = tc; duelMode = 'tour'; cfg.level = tc.level; cfg.foe = tc.foe; cfg.mod = tc.mod;
    launch(cfg);
    if (tc.modNames.length) { var bub = $('prep-taunt'); bub.innerHTML = bub.textContent + '<br><small class="rules">Règles de l’étage : ' + tc.modNames.join(' · ') + '</small>'; }
  }
  // Duel d'entraînement, ou duel du tournoi en cours si cup est vrai.
  function startDuel(cup) {
    var run = save.run, cfg = baseCfg();
    duelMode = cup && run && run.state === 'on' ? 'cup' : 'quick';
    if (duelMode === 'cup') { cfg.level = run.levels[run.step]; cfg.foe = who(rival()); }
    launch(cfg);
  }
  // Cours. Attaque : leçons en classe (js/classe.js), puis pratique et défis devant le mannequin.
  // Protection et effet : le professeur prend la place de l'adversaire, et js/school.js mène leçons et défis.
  function startClass(catId) {
    var cfg = baseCfg(), attack = catId === 'attaque';
    duelMode = 'class'; cfg.level = 1; cfg.all = DS.SPELLS.slice(); cfg.foe = DS.PROFS[catId];
    cfg.klass = { cat: catId, school: true, dummy: attack, locked: [] };
    if (attack) cfg.scene = DS.classe.room;
    launch(cfg);
    var host = { save: save, name: me().name, persist: persist, addXp: addXp, leave: function () { leaveDuel('map'); } };
    host.practice = function () { DS.classe.close(); DS.duel.school.scene(DS.classe.corner); DS.school.open(catId, host); }; // devant le mannequin (attaque) ou la professeure (protection)
    if (attack || catId === 'protection') DS.classe.open(host, catId); else DS.school.open(catId, host); // attaque et protection : les leçons en classe d'abord
  }
  // Salle d'entraînement, premier choix : le mannequin, avec tous les sorts achetés. Rien ne compte (js/school.js mène la séance).
  function startTraining() {
    var cfg = baseCfg();
    duelMode = 'class'; cfg.level = 1; cfg.foe = DS.PROFS.attaque;
    cfg.klass = { cat: 'entrainement', school: true, dummy: true, locked: [] };
    launch(cfg);
    DS.school.open('entrainement', { save: save, name: me().name, persist: persist, addXp: addXp, leave: function () { leaveDuel('map'); } });
  }
  var lastWin = false; // le dernier duel était-il gagné (pour « Étage suivant » à la tour)
  function onDuelEnd(r) {
    lastWin = !!r.win;
    var rw = DS.reward(r.win, r.level), gold = Math.round(rw.gold * (1 + val('gold') / 100)), xp = rw.xp, news = [], cupMode = duelMode === 'cup', towerMode = duelMode === 'tour', advMode = duelMode === 'aventure', final = false, cup, roundName, tw = null;
    if (r.win) save.wins++;
    if (r.win && Math.random() < 0.8) news.push('🧪 Trouvé sur place : ' + DS.extras.giveIngredients(1)[0] + ' (pour le laboratoire)'); // un ingrédient, presque à chaque victoire
    if (advMode) { // l'aventure : chaque monstre fauché rapporte un peu ; le gardien du biome, beaucoup
      var kills = r.kills || 0, boss = advFight && advFight.m && advFight.m.boss; gold = Math.round(rw.gold * (0.5 + 0.35 * kills) * (boss && r.win ? 2 : 1) * (1 + val('gold') / 100)); xp = Math.round(rw.xp * (0.5 + 0.3 * kills) * (boss && r.win ? 2 : 1));
      if (kills > 1) news.unshift('⚔ ' + plural(kills, 'monstre vaincu', 'monstres vaincus') + (r.waves > 1 ? ' en ' + plural(r.waves, 'vague', 'vagues') : ''));
      if (boss && r.win) news.unshift('👑 Gardien du biome vaincu : la sortie est libre !');
      DS.aventure.onEnd(r.win, advFight.m);
    } else if (towerMode) { tw = DS.extras.towerEnd(r.win, towerCfg); gold = Math.round(tw.gold * (1 + val('gold') / 100)); xp = tw.xp; news = tw.news.concat(news); }
    else if (cupMode) {
      cup = DS.byId(DS.CUPS, save.run.cup); roundName = stepName(save.run, save.run.step);
      advance(r.win);
      if (save.run.state === 'won') { final = true; gold += cup.gold; xp += cup.xp; save.cups[cup.id] = (save.cups[cup.id] || 0) + 1; news.unshift('🏆 Prix de la coupe : ' + cup.gold + ' <i class="coin"></i> et ' + cup.xp + ' XP'); }
    } else if (towerMode) { } else if (r.win) { save.level = r.level + 1; save.best = Math.max(save.best, save.level); } else save.level = Math.max(1, r.level - 1);
    save.gold += gold; newStock(); // et le marchand reçoit de nouveaux objets
    var ups = addXp(xp);
    if (ups) news.push('⭐ Niveau ' + save.plv + ' ! ' + (ups > 1 ? ups + ' points de talent et ' + ups + ' points de sort' : 'Un point de talent et un point de sort') + ' à placer');
    persist();
    $('end-title').textContent = final ? 'Coupe gagnée !' : towerMode && r.win ? 'Étage ' + (save.tower.floor - 1) + ' franchi !' : r.win ? 'Victoire !' : 'Défaite…';
    $('end-title').className = r.win ? 'win' : 'lose';
    $('end-sub').textContent = advMode ? (r.win ? 'La horde est vaincue. ' + r.foe.name + (r.foe.title ? ' ' + r.foe.title : '') + ' ne barrera plus la route.' : 'Les monstres ont eu le dessus… Tu te réveilles à l’entrée du biome.')
      : towerMode ? tw.sub + ' ' + (r.win ? 'Tu as vaincu ' + r.foe.name + ' ' + r.foe.title + '.' : r.foe.name + ' ' + r.foe.title + ' a été plus rapide cette fois.')
      : final ? 'Tu remportes la ' + cup.name + ' en battant ' + r.foe.name + ' ' + r.foe.title + ' en finale.'
      : r.win ? 'Tu as vaincu ' + r.foe.name + ' ' + r.foe.title + ' (niveau ' + r.level + ').' : r.foe.name + ' ' + r.foe.title + ' a été plus rapide cette fois.';
    var s = r.stats;
    $('end-stats').innerHTML = [['Sorts lancés', s.casts], ['Sorts qui ont touché', s.hits], ['Parades', s.blocks], ['Sorts renvoyés', s.perfects]].map(function (x) { return '<div><b>' + x[1] + '</b><span>' + x[0] + '</span></div>'; }).join('');
    $('end-loot').innerHTML = '<div class="gain"><span>+' + gold + ' <i class="coin"></i></span><span>+' + xp + ' XP</span></div>' + news.map(function (n) { return '<p>' + n + '</p>'; }).join('');
    $('end-level').textContent = advMode ? '' : towerMode ? tw.next : !cupMode ? 'Prochain adversaire : niveau ' + save.level : final ? '' : r.win ? 'Prochain duel : ' + stepName(save.run, save.run.step).toLowerCase() + ' (niveau ' + save.run.levels[save.run.step] + ')' : 'Éliminé en ' + roundName.toLowerCase();
    $('btn-again').textContent = advMode ? 'Continuer l’aventure →' : towerMode ? (r.win ? 'Étage suivant →' : 'Retour à la tour') : cupMode ? 'Voir le tableau →' : r.win ? 'Duel suivant →' : 'Revanche !';
    $('btn-end-spells').classList.toggle('hidden', cupMode);
    $('duel-end').classList.remove('hidden');
    if (ups || final || news.length) setTimeout(SFX.levelUp, 700);
    if (final) SFX.applause();
  }
  function leaveDuel(to) { DS.school.close(); DS.classe.close(); DS.duel.stop(); $('duel-end').classList.add('hidden'); $('duel-pause').classList.add('hidden'); show(to); }

  // ───────────────────────── Boutons ─────────────────────────
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b || b.classList.contains('card-pick')) return;
    if (/^←/.test(b.textContent.trim())) SFX.back(); else SFX.click();
  });
  var hovered = null; // petit tic quand la souris passe sur un bouton
  document.addEventListener('pointerover', function (e) {
    var b = e.target.closest && e.target.closest('button, .dspell, input[type=range]'); if (b === hovered) return;
    hovered = b; if (b && !b.disabled && e.pointerType === 'mouse') SFX.hover();
  });
  // ── Son : le bouton 🔊 ouvre les réglages (les mêmes curseurs sont dans le menu Pause) · touche M : tout couper ou remettre ──
  function syncSound() {
    var m = SFX.mute();
    document.querySelectorAll('[data-vol]').forEach(function (el) { el.value = Math.round(SFX.vol(el.dataset.vol) * 100); });
    $('btn-son').textContent = m ? '🔇' : '🔊';
    document.querySelectorAll('[data-mute]').forEach(function (el) { el.textContent = m ? '🔊 Remettre le son' : '🔇 Tout couper'; });
  }
  document.querySelectorAll('[data-vol]').forEach(function (el) {
    el.addEventListener('input', function () { SFX.vol(el.dataset.vol, el.value / 100); if (SFX.mute()) SFX.mute(false); syncSound(); });
    el.addEventListener('change', function () { if (el.dataset.vol === 'sfx') SFX.select(); el.blur(); });
  });
  document.querySelectorAll('[data-mute]').forEach(function (el) { el.addEventListener('click', function () { SFX.mute(!SFX.mute()); syncSound(); el.blur(); }); });
  $('btn-son').addEventListener('click', function () { $('son-panel').classList.toggle('hidden'); $('btn-son').blur(); });
  document.addEventListener('pointerdown', function (e) { if (!(e.target.closest && e.target.closest('#son-panel, #btn-son'))) $('son-panel').classList.add('hidden'); });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyM' && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) { SFX.mute(!SFX.mute()); syncSound(); } });
  syncSound();
  document.querySelectorAll('[data-go]').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.go); }); });
  $('btn-play').addEventListener('click', function () { SFX.unlock(); show(save.setup ? 'map' : 'chars'); });
  $('btn-chars-back').addEventListener('click', function () { show(save.setup ? 'map' : 'title'); });
  $('btn-chars-next').addEventListener('click', function () { show(save.setup ? 'map' : 'wands'); });
  $('btn-wands-back').addEventListener('click', function () { show(save.setup ? 'map' : 'chars'); });
  $('btn-wands-next').addEventListener('click', enterSchool);
  $('map-me').addEventListener('click', function () { show('chars'); });
  $('btn-book-back').addEventListener('click', function () { show(bookMode === 'cup' ? 'cups' : bookMode === 'tour' ? 'tour' : 'map'); });
  $('btn-book-go').addEventListener('click', function () { if (bookMode === 'view') show('map'); else if (bookMode === 'tour') startTower(DS.extras.towerCfg()); else startDuel(bookMode === 'cup'); });
  $('btn-talents-reset').addEventListener('click', resetTalents);
  $('btn-cups-back').addEventListener('click', function () { show('map'); });
  $('btn-run-go').addEventListener('click', function () { if (save.run.state === 'on') return openBook('cup'); save.run = null; persist(); renderCups(); });
  $('btn-run-quit').addEventListener('click', function () { save.run = null; persist(); renderCups(); });
  $('school-back').addEventListener('click', function () { leaveDuel('map'); });
  $('btn-train-dummy').addEventListener('click', startTraining);
  $('btn-train-duel').addEventListener('click', function () { openBook('quick'); });
  $('classe-back').addEventListener('click', function () { leaveDuel('map'); });
  // Effacer toute la sauvegarde : on demande confirmation, puis on repart de zéro.
  $('btn-reset').addEventListener('click', function () { $('reset-confirm').classList.remove('hidden'); });
  $('btn-reset-no').addEventListener('click', function () { $('reset-confirm').classList.add('hidden'); });
  $('btn-reset-yes').addEventListener('click', function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } location.reload(); });
  $('btn-engage').addEventListener('click', function () { if (duelMode === 'class') leaveDuel('map'); else DS.duel.engage(); });
  $('btn-resume').addEventListener('click', function () { DS.duel.setPaused(false); });
  $('btn-quit').addEventListener('click', function () { // abandonner un duel de tournoi, c'est être éliminé ; à la tour, c'est redescendre au palier
    if (duelMode === 'cup' && save.run && save.run.state === 'on') { advance(false); persist(); leaveDuel('cups'); }
    else if (duelMode === 'tour') { DS.extras.towerEnd(false, towerCfg); persist(); leaveDuel('tour'); }
    else if (duelMode === 'aventure') { DS.aventure.onEnd(false, advFight.m); leaveDuel('aventure'); } else leaveDuel('map');
  });
  $('btn-again').addEventListener('click', function () { if (duelMode === 'cup') leaveDuel('cups'); else if (duelMode === 'aventure') leaveDuel('aventure'); else if (duelMode === 'tour') { leaveDuel('tour'); if (lastWin) startTower(DS.extras.towerCfg()); } else startDuel(false); });
  $('btn-end-spells').addEventListener('click', function () { DS.duel.stop(); $('duel-end').classList.add('hidden'); openBook(duelMode === 'tour' ? 'tour' : duelMode === 'aventure' ? 'view' : 'quick'); });
  $('btn-end-menu').addEventListener('click', function () { leaveDuel('map'); });

  DS.duel.init($('stage'));
  DS.map.init({ onPlace: onPlace });
  $('mirror-tabs').querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { renderTalents(null, b.dataset.tab); }); });
  DS.extras.init({ save: save, persist: persist, show: show, me: me, who: who, myAge: myAge, buy: buy, startTower: startTower,
    touch: function () { persist(); fitBelt(); document.querySelectorAll('.gold-amt').forEach(function (el) { el.textContent = save.gold; }); },
    flash: function (id) { var m = $(id); if (!m) return; m.classList.remove('flash'); void m.offsetWidth; m.classList.add('flash'); },
    mirrorTab: function (tab, said) { renderTalents(said, tab); } });
  DS.aventure.init({ save: save, persist: persist, look: look, myAge: myAge, startAdventureDuel: startAdventureDuel });
  buildChars(); markPicked(); show('title');
  // give et unlockAll : pour essayer (ou tricher) depuis la console du navigateur, p. ex. DS.app.give(500)
  DS.app = {
    save: save, show: show, startDuel: startDuel, startClass: startClass, openBook: openBook, startCup: startCup, persist: persist,
    give: function (n) { save.gold += n; persist(); show(document.querySelector('.screen:not(.hidden)').id.replace('screen-', '')); },
    ingredients: function (n) { DS.extras.giveIngredients(n || 8); persist(); }, startTower: startTower, startAdventureDuel: startAdventureDuel,
    unlockAll: function () { save.owned = DS.SPELLS.map(function (s) { return s.id; }); persist(); },
    points: function (n) { save.pts += n; persist(); }, spellPoints: function (n) { save.spts += n; persist(); }, upgrade: upgrade
  };
})();
