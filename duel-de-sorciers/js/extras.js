// Les quatre lieux ajoutés à l'école : la Tour des Épreuves (donjon sans fin), le laboratoire d'alchimie (recettes et codex),
// la volière (familiers) et la garde-robe du miroir magique (chapeaux, baguette, titres). Les données sont dans js/data.js ;
// main.js nous donne un hôte (host) : la sauvegarde, persist(), show(), l'achat, le lancement d'un duel, et nous rappelle à la fin d'un duel de la tour.
(function () {
  'use strict';
  var DS = window.DS, A = DS.art, SFX = DS.audio;
  var $ = function (id) { return document.getElementById(id); };
  var host = null, save = null;
  var plural = function (n, one, many) { return n + ' ' + (n > 1 ? many : one); };
  var coin = '<i class="coin"></i>';
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function gold() { document.querySelectorAll('.gold-amt').forEach(function (el) { el.textContent = save.gold; }); }

  // ───────────────────────── La Tour des Épreuves ─────────────────────────
  // save.tower = { floor : étage à jouer, best : record, seed : la graine qui fixe tous les étages (DS.towerFloor), crowned : le dragon du sommet est vaincu }
  // Comme une échelle de Mortal Kombat : on monte d'un étage à chaque victoire, on redescend d'un à chaque défaite (ou abandon). Quitter le jeu ne change rien.
  var floorCache = {}, bgDone = '';
  function floorOf(n) { var key = save.tower.seed + ':' + n; return floorCache[key] || (floorCache[key] = DS.towerFloor(save.tower.seed, n)); }
  function modsOf(ids) { return ids.map(function (id) { return DS.byId(DS.TOWER_MODS, id); }).filter(Boolean); }
  function mergeMods(list) { // les règles de l'étage réunies en un seul jeu de multiplicateurs (D.mod, js/duel.js)
    var out = {};
    list.forEach(function (m) { for (var k in m) { if (k === 'id' || k === 'icon' || k === 'name' || k === 'desc') continue; out[k] = typeof m[k] === 'number' && typeof out[k] === 'number' ? out[k] * m[k] : m[k]; } });
    return out;
  }
  function foeNames(fl) { return fl.foes.map(function (ch) { return ch.name + (ch.title ? ' ' + ch.title : ''); }).join(' & '); }
  function hiddenTop(fl) { return fl.final && (save.tower.best || 0) < DS.TOWER_FLOORS - 10 && !save.tower.crowned; } // le dragon reste une ombre tant qu'on n'approche pas du sommet
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function rowHtml(n, cur) {
    var fl = floorOf(n), hid = hiddenTop(fl), cls = 'trow' + (n === cur ? ' cur' : '') + (fl.boss ? ' boss' : '') + (fl.final ? ' final' : '');
    var small = 'Étage ' + n + (fl.final ? ' · Le sommet' : fl.boss ? ' · Maître de la tour' : ''), em = 'Niv. ' + fl.level + (fl.foes.length > 1 ? '<small>' + fl.foes.length + ' contre 1</small>' : '');
    var pics = fl.foes.map(function (ch, k) { return '<canvas class="pic" width="64" height="64" data-n="' + n + '" data-k="' + k + '"></canvas>'; }).join('');
    return '<li class="' + cls + '"><span class="num">' + n + '</span><span class="pics">' + pics + '</span><span class="txt"><small>' + small + '</small><b>' + (hid ? '? ? ?' : esc(foeNames(fl))) + '</b></span><em class="lvl">' + em + '</em></li>';
  }
  function drawFloorPortrait(cv, fl, k) {
    var ch = fl.foes[k], g = cv.getContext('2d'), pose = { t: 0 }; g.clearRect(0, 0, cv.width, cv.height);
    if (hiddenTop(fl)) pose.tint = ['#05030a', 0.94];
    A.drawMonster(g, ch, cv.width / 2 - (ch.kind === 'dragon' ? cv.width * 0.04 : 0), cv.height * 0.96, cv.height * (fl.final ? 0.62 : ch.size > 1.2 ? 0.78 : 0.9), pose);
  }
  function renderTower() {
    var T = save.tower, cur = Math.min(DS.TOWER_FLOORS, T.floor), fl = floorOf(cur), rows = {}, i;
    rows[DS.TOWER_FLOORS] = 1; var nb = Math.ceil((cur + 1) / DS.TOWER_BOSS_EVERY) * DS.TOWER_BOSS_EVERY; if (nb < DS.TOWER_FLOORS) rows[nb] = 1; // le sommet, le prochain maître, et les cinq étages au-dessus du nôtre
    for (i = cur; i <= Math.min(cur + 5, DS.TOWER_FLOORS); i++) rows[i] = 1;
    var ns = Object.keys(rows).map(Number).sort(function (a, b) { return b - a; }), html = '', prev = null;
    ns.forEach(function (n) { if (prev !== null && prev - n > 1) html += '<li class="tgap">⋯</li>'; prev = n; html += rowHtml(n, cur); });
    var box = $('tower-rows'); box.innerHTML = html;
    box.querySelectorAll('canvas[data-n]').forEach(function (cv) { drawFloorPortrait(cv, floorOf(+cv.dataset.n), +cv.dataset.k); });
    var list = modsOf(fl.mods), rw = towerReward(fl), who = esc(foeNames(fl));
    $('tower-info').innerHTML = (list.length ? '<div class="mods-line">' + list.map(function (m) { return '<span class="mod-pill" title="' + esc(m.desc) + '">' + m.icon + ' ' + m.name + '</span>'; }).join('') + '</div>' : '') +
      '<div class="rw">' + (fl.final ? (hiddenTop(fl) ? 'Quelque chose d’immense garde le sommet. ' : '<b>' + who + '</b> garde le sommet : feu, nuit et magie. ') : fl.boss ? 'Maître de la tour : <b>' + who + '</b>. ' : fl.foes.length > 1 ? 'Ils sont <b>' + fl.foes.length + ' contre toi</b>. ' : '') +
      'Cet étage rapporte <b>' + rw.gold + ' ' + coin + '</b> et <b>' + rw.xp + ' XP</b>' + (fl.boss ? ', plus le <b>coffre du maître</b> (un point de sort, des ingrédients)' : '') + '.</div>' +
      '<small class="note">' + (cur > 1 ? 'Une défaite te fait redescendre à l’étage ' + (cur - 1) + '.' : 'Une défaite te fait recommencer ici.') + ' Quitter le jeu ne fait rien perdre : tu reprendras à cet étage.</small>';
    $('tower-best').textContent = (T.crowned ? '👑 Tour conquise · ' : '') + (T.best ? 'Record : étage ' + T.best + ' sur ' + DS.TOWER_FLOORS : 'Aucun étage gravi encore') + ' · Entrée pour monter';
    $('btn-tower-go').textContent = fl.final ? (T.crowned ? '🐉 Défier Pyrrhax encore' : '🐉 Affronter le dragon') : '⚔️ Monter à l’étage ' + cur;
    drawTowerBg(); box.scrollTop = box.scrollHeight;
  }
  // Le donjon derrière l'échelle : un mur de pierre, deux piliers, le sol dallé et le tapis rouge, la lueur des torches (les flammes bougent en CSS). Dessiné une fois par taille d'écran.
  function drawTowerBg() {
    var cv = $('tower-bg'), sc = cv.parentNode, w = sc.clientWidth, h = sc.clientHeight; if (!w || !h) return; var key = w + 'x' + h; if (key === bgDone) return; bgDone = key;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var r = DS.rng(4242), i, j, bh = 34, bw = 74, horizon = h * 0.76;
    g.fillStyle = '#1d2018'; g.fillRect(0, 0, w, h);
    for (j = 0; j * bh < horizon; j++) { var off = (j % 2) * bw / 2; for (i = -1; i * bw < w + bw; i++) { var x = i * bw + off, y = j * bh, k = 0.82 + r() * 0.32; g.fillStyle = 'rgb(' + Math.round(58 * k) + ',' + Math.round(63 * k) + ',' + Math.round(50 * k) + ')'; g.beginPath(); if (g.roundRect) g.roundRect(x + 2, y + 2, bw - 4, bh - 4, 4); else g.rect(x + 2, y + 2, bw - 4, bh - 4); g.fill(); } }
    g.fillStyle = '#2b2e27'; g.fillRect(0, horizon, w, h - horizon); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1.5;
    for (i = 0; i < 9; i++) { var yy = horizon + Math.pow(i / 8, 1.6) * (h - horizon); g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); }
    for (i = -7; i <= 7; i++) { g.beginPath(); g.moveTo(w / 2 + i * w * 0.045, horizon); g.lineTo(w / 2 + i * w * 0.2, h); g.stroke(); }
    g.fillStyle = '#6a1e22'; g.beginPath(); g.moveTo(w * 0.43, horizon); g.lineTo(w * 0.57, horizon); g.lineTo(w * 0.72, h); g.lineTo(w * 0.28, h); g.closePath(); g.fill(); // le tapis rouge
    g.strokeStyle = 'rgba(233,196,106,0.4)'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.445, horizon); g.lineTo(w * 0.31, h); g.moveTo(w * 0.555, horizon); g.lineTo(w * 0.69, h); g.stroke();
    [0.14, 0.86].forEach(function (px) { // les piliers
      var x = w * px, pw = Math.max(50, w * 0.05), gr = g.createLinearGradient(x - pw / 2, 0, x + pw / 2, 0); gr.addColorStop(0, '#22251c'); gr.addColorStop(0.5, '#5a5f4d'); gr.addColorStop(1, '#1d2018');
      g.fillStyle = gr; g.fillRect(x - pw / 2, 0, pw, horizon + 12); g.fillStyle = '#474b3d'; g.fillRect(x - pw * 0.7, horizon + 2, pw * 1.4, 12); g.fillRect(x - pw * 0.65, 0, pw * 1.3, 14);
      g.fillStyle = 'rgba(0,0,0,0.2)'; for (i = 1; i * 40 < horizon; i++) g.fillRect(x - pw / 2, i * 40, pw, 2);
    });
    document.querySelectorAll('#screen-tour .torch').forEach(function (t) { // la lueur des torches, et leur support
      var x = parseFloat(t.style.left) / 100 * w, y = parseFloat(t.style.top) / 100 * h, gl = g.createRadialGradient(x, y, 4, x, y, w * 0.15);
      g.fillStyle = '#2a1a0a'; g.fillRect(x - 4, y + 8, 8, 28); g.fillStyle = '#3a2a1a'; g.fillRect(x - 9, y + 34, 18, 6);
      gl.addColorStop(0, 'rgba(255,170,70,0.5)'); gl.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gl; g.fillRect(x - w * 0.15, y - w * 0.15, w * 0.3, w * 0.3);
    });
    var vg = g.createRadialGradient(w / 2, h * 0.45, h * 0.2, w / 2, h * 0.45, Math.max(w, h) * 0.72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.85)'); g.fillStyle = vg; g.fillRect(0, 0, w, h); // la pénombre
  }
  function towerReward(fl) { // l'or et l'expérience de l'étage : selon son niveau, sa hauteur, ses monstres (variantes, nombre) et ses règles
    var r = DS.reward(true, fl.level), mg = 1; modsOf(fl.mods).forEach(function (m) { if (m.gold) mg *= m.gold; });
    return { gold: Math.round(r.gold * (1 + fl.n / 60) * fl.gold * mg * (fl.final && save.tower.crowned ? 0.25 : 1)), xp: Math.round(r.xp * (1 + fl.n / 60) * (fl.final ? 3 : fl.boss ? 1.5 : 1)) };
  }
  function towerCfg() { // la configuration du duel pour l'étage à jouer : un monstre seul, ou une horde d'un seul coup (plusieurs monstres, ou le dragon et ses événements)
    var fl = floorOf(Math.min(DS.TOWER_FLOORS, save.tower.floor)), list = modsOf(fl.mods), many = fl.foes.length > 1 || fl.final;
    return { floor: fl, level: fl.level, foe: fl.foes[0], mod: mergeMods(list), modNames: list.map(function (m) { return m.icon + ' ' + m.name; }), boss: fl.boss, final: fl.final,
      horde: many ? { waves: [fl.foes], events: fl.final ? DS.TOWER_DRAGON_EVENTS : [], hpK: fl.hpK, label: 'Étage ' + fl.n + ' · niveau ' + fl.level } : null };
  }
  // Fin d'un duel de la tour : gagné, l'étage d'après (ou la tour conquise) ; perdu, un étage plus bas. Retourne ce que main.js affiche.
  function towerEnd(win, cfg) {
    var T = save.tower, fl = cfg.floor, n = fl.n, news = [], rw = towerReward(fl), who = foeNames(fl), many = fl.foes.length > 1, out = { gold: 0, xp: 0, news: news, title: '', sub: '', next: '', again: false };
    if (win) {
      var rec = n > (T.best || 0); out.gold = rw.gold; out.xp = rw.xp; T.best = Math.max(T.best || 0, n);
      if (fl.final) {
        if (!T.crowned) { save.spts += 3; news.push('🐉 Pyrrhax est vaincu ! La tour est à toi : 3 points de sort, et un titre au miroir magique.'); }
        T.crowned = true; out.title = 'La tour est conquise !'; out.sub = 'Au sommet des cent étages, ' + who + ' s’effondre dans un dernier souffle de feu.'; out.next = 'Tu peux redescendre quand tu veux… ou l’affronter encore.';
      } else {
        T.floor = n + 1; out.again = true;
        if (fl.boss) { save.spts++; news.push('🎁 Coffre du maître : un point de sort et ' + giveIngredients(2).join(', ')); }
        out.title = 'Étage ' + n + ' franchi !'; out.sub = fl.boss ? who + ', maître de la tour, s’incline.' : many ? who + ' sont vaincus.' : who + ' est vaincu' + (fl.foes[0].f ? 'e' : '') + '.';
        var nx = floorOf(T.floor); out.next = 'Prochain : étage ' + T.floor + (nx.final ? ' — le dragon t’attend au sommet' : nx.boss ? ' — un maître de la tour t’attend' : nx.foes.length > 1 ? ' — ' + nx.foes.length + ' contre 1' : '');
        if (rec) news.push('🏰 Nouveau record : étage ' + n + ' !');
      }
    } else {
      var back = Math.max(1, n - 1); out.gold = Math.round(rw.gold * 0.25); out.xp = Math.round(rw.xp * 0.4); T.floor = back;
      out.title = 'Défaite…'; out.sub = who + (many ? ' ont' : ' a') + ' eu le dessus à l’étage ' + n + '.'; out.next = back < n ? 'Tu redescends à l’étage ' + back + '.' : 'Tu repars du premier étage.';
    }
    return out;
  }

  // ───────────────────────── Le laboratoire d'alchimie ─────────────────────────
  // save.ingr = { ingrédient : nombre } · save.recipes = { recette : true } découvertes · le chaudron : deux ingrédients et, pour les sorts, une base (un sort connu)
  var slots = [null, null], base = null, brewing = false, labTab = 'ingr', labT = 0, labAnim = 0, labSaid = '';
  function ingr(id) { return DS.byId(DS.INGREDIENTS, id); }
  function have(id) { return save.ingr[id] || 0; }
  function giveIngredients(n) { // n ingrédients au hasard (butin) : retourne leurs noms
    var out = []; for (var i = 0; i < n; i++) { var it = DS.INGREDIENTS[Math.floor(Math.random() * DS.INGREDIENTS.length)]; save.ingr[it.id] = have(it.id) + 1; out.push(it.icon + ' ' + it.name); }
    return out;
  }
  function recipeFor(a, b, bs) { // la recette qui correspond à ces deux ingrédients (dans n'importe quel ordre) et cette base
    return DS.RECIPES.filter(function (r) { return ((r.ins[0] === a && r.ins[1] === b) || (r.ins[0] === b && r.ins[1] === a)) && (r.base || null) === (bs || null); })[0] || null;
  }
  function recipeResult(r) { return r.spell ? DS.byId(DS.SPELLS, r.spell) : DS.byId(DS.POTIONS, r.potion); }
  function renderLab(said) {
    var found = Object.keys(save.recipes).length;
    $('lab-count').textContent = found + ' / ' + DS.RECIPES.length + ' recettes';
    $('lab-slots').innerHTML = slots.map(function (id, i) { var it = id ? ingr(id) : null; return '<button class="lslot' + (it ? ' full' : '') + '" data-slot="' + i + '" style="--c:' + (it ? it.color : '#8b7f9a') + '">' + (it ? '<span class="ico">' + it.icon + '</span><b>' + it.name + '</b>' : '<span class="ico">+</span><b>Ingrédient ' + (i + 1) + '</b>') + '</button>'; }).join('') +
      (function () { var s = base ? DS.byId(DS.SPELLS, base) : null; return '<button class="lslot base' + (s ? ' full' : '') + '" data-slot="base" style="--c:' + (s ? s.color : '#8b7f9a') + '">' + (s ? '<span class="ico">' + A.glyphSvg(s.glyph, s.color) + '</span><b>' + s.name + '</b>' : '<span class="ico">✦</span><b>Sort de base<br><small>(pas toujours)</small></b>') + '</button>'; })();
    $('lab-slots').querySelectorAll('.lslot').forEach(function (b) { b.addEventListener('click', function () { if (brewing) return; if (b.dataset.slot === 'base') base = null; else slots[+b.dataset.slot] = null; SFX.back(); renderLab(); }); });
    if (said) labSaid = said; // le dernier message reste, même quand on change d'onglet
    $('lab-say').innerHTML = labSaid || (found ? 'Glisse deux ingrédients dans le chaudron. Pour un sort, ajoute un sort que tu connais comme base.' : 'Bienvenue au laboratoire ! Mélange deux ingrédients… et parfois un sort que tu connais. Le codex gardera chaque recette trouvée.');
    $('btn-brew').disabled = brewing || !(slots[0] && slots[1]);
    var tabs = $('lab-tabs'); tabs.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === labTab); });
    var shelf = $('lab-shelf');
    if (labTab === 'ingr') shelf.innerHTML = '<div class="jars">' + DS.INGREDIENTS.map(function (it) { var n = have(it.id); return '<button class="jar' + (n ? '' : ' empty') + '" data-ing="' + it.id + '" style="--c:' + it.color + '" title="' + it.desc + '"><span class="ico">' + it.icon + '</span><b>' + it.name + '</b><em>× ' + n + '</em></button>'; }).join('') + '</div><p class="note">On en trouve au magasin de magie, parmi les objets qui ne servent à rien, et après chaque duel gagné.</p>';
    else if (labTab === 'base') shelf.innerHTML = '<div class="jars spells">' + DS.SPELLS.filter(function (s) { return save.owned.indexOf(s.id) >= 0; }).map(function (s) { return '<button class="jar' + (base === s.id ? ' on' : '') + '" data-base="' + s.id + '" style="--c:' + s.color + '"><span class="ico">' + A.glyphSvg(s.glyph, s.color) + '</span><b>' + s.name + '</b></button>'; }).join('') + '</div><p class="note">Un sort connu sert de base à certaines recettes : il n’est pas consommé.</p>';
    else shelf.innerHTML = '<div class="codex">' + DS.RECIPES.map(function (r) {
      var ok = save.recipes[r.id], res = recipeResult(r), hint = save.hints && save.hints[r.id];
      return '<div class="rec' + (ok ? ' found' : hint ? ' hint' : '') + '">' + (ok ? r.ins.map(function (id) { var it = ingr(id); return '<span class="in" title="' + it.name + '">' + it.icon + '</span>'; }).join('<em>+</em>') + (r.base ? '<em>+</em><span class="in base" title="' + DS.byId(DS.SPELLS, r.base).name + '">' + A.glyphSvg(DS.byId(DS.SPELLS, r.base).glyph, DS.byId(DS.SPELLS, r.base).color) + '</span>' : '') + '<em>=</em><b>' + (res.potion ? res.icon + ' ' : '') + r.name + (r.qty > 1 ? ' × ' + r.qty : '') + '</b>'
        : (hint ? '<span class="in" title="' + ingr(hint).name + '">' + ingr(hint).icon + '</span><em>+</em><span class="in">?</span>' : '<span class="in">?</span><em>+</em><span class="in">?</span>') + (r.base ? '<em>+</em><span class="in">✦</span>' : '') + '<em>=</em><b class="unk">' + (r.spell ? 'Un sort' : 'Une potion') + '</b>') + '</div>';
    }).join('') + '</div><p class="note">✦ : il faut un sort de base. Un ingrédient affiché : tu l’as déjà mis dans un mélange à moitié bon.</p>';
    shelf.querySelectorAll('[data-ing]').forEach(function (b) { b.addEventListener('click', function () { if (brewing || !have(b.dataset.ing)) return shake(b); var i = slots[0] ? slots[1] ? -1 : 1 : 0; if (i < 0) return shake(b); slots[i] = b.dataset.ing; SFX.drop(); renderLab(); }); });
    shelf.querySelectorAll('[data-base]').forEach(function (b) { b.addEventListener('click', function () { if (brewing) return; base = base === b.dataset.base ? null : b.dataset.base; SFX.select(); renderLab(); }); });
    drawCauldron();
  }
  function shake(el) { el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); SFX.nope(); }
  // Le chaudron : une marmite sur le feu, dont le contenu prend la couleur des ingrédients et bouillonne.
  var bub = [];
  function drawCauldron() {
    var cv = $('cauldron'), g = cv.getContext('2d'), W = cv.width, H = cv.height, t = labT, i;
    var cols = slots.filter(Boolean).map(function (id) { return ingr(id).color; }), c1 = cols[0] || '#3a7a6a', c2 = cols[1] || cols[0] || '#2a5a8a';
    g.clearRect(0, 0, W, H);
    A.flame(g, W * 0.5, H * 0.9, W * 0.16, t, 0); A.flame(g, W * 0.38, H * 0.9, W * 0.11, t, 1.3); A.flame(g, W * 0.62, H * 0.9, W * 0.11, t, 2.4);
    g.fillStyle = '#3a2a1a'; g.fillRect(W * 0.25, H * 0.88, W * 0.5, H * 0.05);
    var px = W * 0.5, py = H * 0.55, rx = W * 0.36, ry = H * 0.3;
    var gr = g.createRadialGradient(px - rx * 0.4, py - ry * 0.3, rx * 0.1, px, py, rx * 1.2); gr.addColorStop(0, '#5a5a6a'); gr.addColorStop(0.6, '#2a2a34'); gr.addColorStop(1, '#101018');
    g.fillStyle = gr; g.beginPath(); g.ellipse(px, py + ry * 0.15, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1a1a22'; g.beginPath(); g.ellipse(px, py - ry * 0.6, rx * 1.02, ry * 0.3, 0, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.ellipse(px, py - ry * 0.6, rx * 0.9, ry * 0.22, 0, 0, Math.PI * 2); g.clip();
    gr = g.createLinearGradient(px - rx, 0, px + rx, 0); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(px - rx, py - ry, rx * 2, ry);
    g.fillStyle = 'rgba(255,255,255,0.18)'; for (i = 0; i < 3; i++) { var wx = px + Math.sin(t * 1.5 + i * 2) * rx * 0.4, wy = py - ry * 0.6 + Math.cos(t * 2 + i) * ry * 0.08; g.beginPath(); g.ellipse(wx, wy, rx * 0.2, ry * 0.05, 0, 0, Math.PI * 2); g.fill(); }
    g.restore();
    if (bub.length < (brewing ? 40 : slots[0] ? 12 : 5) && Math.random() < 0.5) bub.push({ x: px + (Math.random() - 0.5) * rx * 1.4, y: py - ry * 0.6, r: 2 + Math.random() * 5, vy: 20 + Math.random() * 40, life: 1, c: Math.random() < 0.5 ? c1 : c2 });
    g.save(); g.globalCompositeOperation = 'lighter';
    for (i = bub.length - 1; i >= 0; i--) { var b = bub[i]; b.y -= b.vy / 30; b.life -= 0.025; if (b.life <= 0) { bub.splice(i, 1); continue; } g.globalAlpha = b.life * 0.8; g.fillStyle = b.c; g.beginPath(); g.arc(b.x, b.y, b.r * (brewing ? 1.6 : 1), 0, Math.PI * 2); g.fill(); }
    g.restore();
    if (brewing) { g.save(); g.globalCompositeOperation = 'lighter'; A.glowDot(g, px, py - ry * 0.6, rx * (0.6 + 0.3 * Math.sin(t * 12)), '#ffffff', 0.35); g.restore(); }
    g.fillStyle = '#7a5a3a'; g.fillRect(px - rx * 1.15, py - ry * 0.9, rx * 0.08, ry * 1.2); g.fillRect(px + rx * 1.07, py - ry * 0.9, rx * 0.08, ry * 1.2); g.fillRect(px - rx * 1.15, py - ry * 0.95, rx * 2.3, ry * 0.1);
  }
  function brew() {
    if (brewing || !(slots[0] && slots[1])) return;
    var r = recipeFor(slots[0], slots[1], base), a = slots[0], b = slots[1];
    brewing = true; SFX.cast('aqua', 0.8); renderLab('Ça bouillonne…'); $('btn-brew').disabled = true;
    setTimeout(function () {
      brewing = false;
      if (r) {
        save.ingr[a]--; save.ingr[b]--; if (!save.ingr[a]) delete save.ingr[a]; if (!save.ingr[b]) delete save.ingr[b];
        var first = !save.recipes[r.id], res = recipeResult(r), txt;
        save.recipes[r.id] = true;
        if (r.spell) { if (save.owned.indexOf(r.spell) < 0) { save.owned.push(r.spell); txt = '✨ <b>' + res.name + '</b> ! Les signes brillent au-dessus du chaudron : tu connais ce sort pour toujours. Il est dans ton grimoire.'; } else { txt = 'La recette de <b>' + res.name + '</b>, que tu connaissais déjà. Un peu d’or en souvenir : +25 ' + coin + '.'; save.gold += 25; } }
        else { save.potions[r.potion] = (save.potions[r.potion] || 0) + r.qty; txt = res.icon + ' <b>' + res.name + (r.qty > 1 ? ' × ' + r.qty : '') + '</b> ! ' + (r.qty > 1 ? 'Les fioles sont' : 'La fiole est') + ' dans ton grimoire, page des potions.'; }
        if (first) { txt += '<br>📜 Recette ajoutée au codex (' + Object.keys(save.recipes).length + ' / ' + DS.RECIPES.length + ').'; SFX.levelUp(); host.flash('cauldron'); } else SFX.chime();
        slots = [null, null]; if (r.base) base = null; host.persist(); gold(); renderLab(txt); host.touch();
      } else {
        var near = DS.RECIPES.filter(function (x) { return !save.recipes[x.id] && (x.ins.indexOf(a) >= 0 || x.ins.indexOf(b) >= 0); }), hint = '';
        var same = near.filter(function (x) { return x.ins.indexOf(a) >= 0 && x.ins.indexOf(b) >= 0; })[0]; // les deux bons ingrédients, mais pas la bonne base
        if (same) hint = same.base && base !== same.base ? 'Les deux ingrédients vont ensemble… mais il manque <b>le bon sort de base</b> : ' + (base ? 'pas celui-là.' : 'ajoute un sort que tu connais.') : 'Les deux ingrédients vont ensemble… mais pas avec ce sort de base : essaie sans.';
        else if (near.length) { var x = near[0], good = x.ins.indexOf(a) >= 0 ? a : b; save.hints = save.hints || {}; save.hints[x.id] = good; hint = 'Une fumée grise. Pourtant, ' + ingr(good).name + ' réagit un peu : <b>' + (x.spell ? 'un sort' : 'une potion') + '</b> se cache par là, avec un autre ingrédient' + (x.base ? ' et un sort de base' : '') + '.'; }
        else hint = 'Une fumée grise, et une odeur d’œuf pourri. Rien à tirer de ces deux-là ensemble.';
        SFX.fizzle(); host.persist(); renderLab('💨 ' + hint + ' Les ingrédients sont intacts.');
      }
    }, 1800);
  }
  function startLabAnim() { clearInterval(labAnim); labAnim = setInterval(function () { if ($('screen-labo').classList.contains('hidden')) return clearInterval(labAnim); labT += 0.1; drawCauldron(); }, 100); }

  // ───────────────────────── La volière : les familiers ─────────────────────────
  // save.fam = { owned: { familier: niveau }, active: familier | null }
  var famT = 0, famAnim = 0;
  function famLv(id) { return save.fam.owned[id] || 0; }
  function famName(f, lv) { return f.names[Math.max(0, Math.min(2, lv - 1))]; }
  function famCfg() { // le familier qui vient au duel, avec son pouvoir (lu par js/duel.js)
    var id = save.fam.active, f = id && DS.byId(DS.FAMILIARS, id), lv = f ? famLv(id) : 0; if (!f || !lv) return null;
    var p = f.power(lv), out = { id: f.id, icon: f.icon, color: f.color, name: famName(f, lv), lv: lv }; for (var k in p) out[k] = p[k]; return out;
  }
  function renderFam(said) {
    var act = save.fam.active;
    $('fam-list').innerHTML = DS.FAMILIARS.map(function (f) {
      var lv = famLv(f.id), on = act === f.id;
      return '<div class="famc' + (lv ? ' owned' : '') + (on ? ' on' : '') + '" style="--c:' + f.color + '"><canvas width="150" height="130" data-fam="' + f.id + '"></canvas><b>' + (lv ? famName(f, lv) : f.names[0]) + '</b>' +
        '<span class="lvl">' + (lv ? '★'.repeat(lv) + '☆'.repeat(3 - lv) : f.desc) + '</span><small>' + (lv ? f.text(lv) : f.text(1)) + '</small>' +
        (lv ? (on ? '<span class="tag">✓ Il vient au duel</span>' : '<button class="btn ghost" data-pick="' + f.id + '">L’emmener au duel</button>') + (lv < 3 ? '<small class="next">Niveau ' + (lv + 1) + ' : ' + f.names[lv] + '</small><button class="btn primary small buy" data-feed="' + f.id + '">🍖 Nourrir · ' + f.feed[lv - 1] + ' ' + coin + '</button>' : '<span class="tag max">Niveau maximum</span>')
          : '<button class="btn primary small buy" data-adopt="' + f.id + '">Adopter · ' + f.price + ' ' + coin + '</button>') + '</div>';
    }).join('');
    $('fam-list').querySelectorAll('[data-adopt]').forEach(function (b) { b.addEventListener('click', function () { var f = DS.byId(DS.FAMILIARS, b.dataset.adopt); host.buy(b.closest('.famc'), f, function () { save.fam.owned[f.id] = 1; save.fam.active = f.id; renderFam(f.names[0] + ' est à toi ! ' + f.desc); host.touch(); }); }); });
    $('fam-list').querySelectorAll('[data-feed]').forEach(function (b) { b.addEventListener('click', function () { var f = DS.byId(DS.FAMILIARS, b.dataset.feed), lv = famLv(f.id); host.buy(b.closest('.famc'), { price: f.feed[lv - 1] }, function () { save.fam.owned[f.id] = lv + 1; SFX.levelUp(); renderFam('✨ ' + f.names[lv - 1] + ' évolue : voici ' + f.names[lv] + ' ! ' + f.text(lv + 1)); host.touch(); }); }); });
    $('fam-list').querySelectorAll('[data-pick]').forEach(function (b) { b.addEventListener('click', function () { save.fam.active = b.dataset.pick; host.persist(); SFX.select(); renderFam(famName(DS.byId(DS.FAMILIARS, b.dataset.pick), famLv(b.dataset.pick)) + ' viendra avec toi au duel.'); }); });
    $('fam-none').classList.toggle('hidden', !act); $('fam-none').onclick = function () { save.fam.active = null; host.persist(); SFX.back(); renderFam('Tu iras au duel sans familier.'); };
    $('fam-say').innerHTML = said || (act ? famName(DS.byId(DS.FAMILIARS, act), famLv(act)) + ' t’accompagne au duel. Nourris-le pour qu’il évolue : trois niveaux, et un pouvoir de plus en plus fort.' : 'Adopte un familier : il viendra au duel avec toi et t’y aidera, à sa façon. Un seul à la fois.');
    gold(); drawFams();
    clearInterval(famAnim); famAnim = setInterval(function () { if ($('screen-familiers').classList.contains('hidden')) return clearInterval(famAnim); famT += 0.1; drawFams(); }, 100);
  }
  // Chaque familier, dessiné : une créature simple qui flotte, respire et cligne, avec une lueur de sa couleur ; plus grand et plus orné à chaque niveau.
  function drawFams() {
    document.querySelectorAll('#fam-list canvas').forEach(function (cv) {
      var f = DS.byId(DS.FAMILIARS, cv.dataset.fam), lv = famLv(f.id), g = cv.getContext('2d'), W = cv.width, H = cv.height, t = famT;
      g.clearRect(0, 0, W, H); g.save(); if (!lv) g.globalAlpha = 0.55;
      var s = H * (0.44 + 0.08 * Math.max(0, lv - 1)), x = W / 2, y = H * 0.55 + Math.sin(t * 1.7 + f.id.length) * H * 0.03;
      A.glowDot(g, x, y, s * 1.1, f.color, 0.45 + 0.12 * Math.sin(t * 3));
      if (lv >= 2) for (var i = 0; i < 6; i++) { var a = t * 0.8 + i * 1.05, r = s * (0.9 + 0.1 * Math.sin(t * 2 + i)); g.fillStyle = f.color; g.globalAlpha = (lv ? 1 : 0.55) * (0.5 + 0.5 * Math.sin(t * 4 + i)); g.beginPath(); g.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, 2 + (lv - 1), 0, Math.PI * 2); g.fill(); }
      g.globalAlpha = lv ? 1 : 0.55;
      g.font = Math.round(s) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(f.icon, x, y);
      if (lv >= 3) { g.font = Math.round(s * 0.4) + 'px sans-serif'; g.fillText('👑', x, y - s * 0.62); }
      g.restore();
    });
  }

  // ───────────────────────── Le miroir magique 2.0 : garde-robe ─────────────────────────
  // save.look = { hat, trail, handle, core, title } · tout se débloque par un exploit (unlock), les premiers sont offerts.
  var mirrorTab = 'talents';
  function unlocked(it) { return !!it.unlock(save); }
  function pick(kind) { // ce qui est choisi, s'il est encore débloqué (sinon le premier)
    var list = kind === 'hat' ? DS.HATS : kind === 'title' ? DS.TITLES : DS.WAND_LOOKS[kind], it = DS.byId(list, save.look[kind]);
    return it && unlocked(it) ? it : list[0];
  }
  function titleOf() { var t = pick('title'); return t.id === 'apprenti' ? '' : t.names[host.me().f ? 1 : 0]; }
  // Notre sorcier tel qu'on le voit partout (carte, miroir, duel) : le chapeau choisi, son aura, et le titre.
  function styled(ch) {
    var h = pick('hat'), out = {}, k; for (k in ch) out[k] = ch[k];
    if (h.hat) { out.hat = h.hat; out.hatCol = h.hatCol; if (h.pattern) out.pattern = h.pattern; out.aura = h.aura; }
    out.rank = titleOf(); return out;
  }
  function styledWand(wd) { var out = {}, k; for (k in wd) out[k] = wd[k]; var hd = pick('handle'), co = pick('core'); if (hd.color) out.handle = hd.color; if (co.color) out.glow = co.color; return out; }
  function lookCfg() { var tr = pick('trail'); return { trail: tr.color, trailHi: tr.hi }; }
  function newUnlocks() { var n = 0; DS.HATS.concat(DS.TITLES, DS.WAND_LOOKS.trail, DS.WAND_LOOKS.handle, DS.WAND_LOOKS.core).forEach(function (it) { if (unlocked(it) && !save.seen[it.id]) n++; }); return n; } // de quoi mettre une pastille sur la carte
  function renderLook(tab) {
    var html = '', list, kind = tab === 'hats' ? 'hat' : tab === 'titles' ? 'title' : null;
    if (tab === 'wand') {
      html = ['trail', 'handle', 'core'].map(function (k) { return '<h4>' + (k === 'trail' ? '✨ Couleur du tracé' : k === 'handle' ? '🪵 Manche' : '💫 Cœur magique') + '</h4><div class="looks">' + DS.WAND_LOOKS[k].map(function (it) { return lookCard(k, it, '<i class="sw" style="--c:' + (it.color || (k === 'handle' ? DS.byId(DS.WANDS, save.wand).handle : DS.byId(DS.WANDS, save.wand).glow)) + '"></i>'); }).join('') + '</div>'; }).join('');
      html += '<div class="wand-preview"><canvas id="look-wand" width="420" height="90"></canvas></div>';
    } else {
      list = kind === 'hat' ? DS.HATS : DS.TITLES;
      html = '<div class="looks' + (kind === 'title' ? ' titles' : '') + '">' + list.map(function (it) { return lookCard(kind, it, kind === 'hat' ? '<canvas width="120" height="120" data-hat="' + it.id + '"></canvas>' : '<span class="ttl">' + (it.id === 'apprenti' ? 'Aucun titre' : it.names[host.me().f ? 1 : 0]) + '</span>'); }).join('') + '</div>';
    }
    $('talent-list').innerHTML = '<div class="wardrobe">' + html + '</div>';
    $('talent-list').querySelectorAll('[data-hat]').forEach(function (cv) { var it = DS.byId(DS.HATS, cv.dataset.hat), ch = {}, k, me = host.me(); for (k in me) ch[k] = me[k]; if (it.hat) { ch.hat = it.hat; ch.hatCol = it.hatCol; if (it.pattern) ch.pattern = it.pattern; } A.drawWizard(cv.getContext('2d'), ch, 60, 118 * 2.5, 118 * 2.1, { portrait: true, face: 'happy', age: it.hat ? host.myAge() : 'adult' }); });
    $('talent-list').querySelectorAll('[data-pick-look]').forEach(function (b) { b.addEventListener('click', function () { var k = b.dataset.kind, it = DS.byId(k === 'hat' ? DS.HATS : k === 'title' ? DS.TITLES : DS.WAND_LOOKS[k], b.dataset.pickLook); if (!unlocked(it)) return shake(b); save.look[k] = it.id; host.persist(); SFX.sparkle(); host.flash('mirror'); host.mirrorTab(mirrorTab, k === 'title' ? 'Te voilà ' + host.me().name + (titleOf() ? ' ' + titleOf() : '') + ' !' : k === 'hat' ? 'Ça te va à ravir.' : 'Ta baguette a fière allure.'); }); });
    var wc = $('look-wand'); if (wc) { var g = wc.getContext('2d'), wd = styledWand(DS.byId(DS.WANDS, save.wand)); A.drawWand(g, 30, 60, 380, 24, 8, 2.6, wd); A.glowDot(g, 380, 24, 34, wd.glow, 0.9); var tr = pick('trail'); g.strokeStyle = tr.color; g.lineWidth = 5; g.lineCap = 'round'; g.shadowColor = tr.hi; g.shadowBlur = 12; g.beginPath(); g.moveTo(385, 22); g.quadraticCurveTo(400, 10, 415, 30); g.stroke(); }
    DS.HATS.concat(DS.TITLES, DS.WAND_LOOKS.trail, DS.WAND_LOOKS.handle, DS.WAND_LOOKS.core).forEach(function (it) { if (unlocked(it)) save.seen[it.id] = true; }); host.persist();
  }
  function lookCard(kind, it, inner) {
    var ok = unlocked(it), on = pick(kind).id === it.id, fresh = ok && !save.seen[it.id];
    return '<button class="look' + (ok ? '' : ' locked') + (on ? ' on' : '') + (fresh ? ' fresh' : '') + '" data-kind="' + kind + '" data-pick-look="' + it.id + '">' + inner + '<b>' + it.name + '</b><small>' + (ok ? it.desc || '' : '🔒 ' + it.how) + '</small>' + (on ? '<span class="tag">✓ Porté</span>' : ok && it.how ? '<span class="tag got">' + (fresh ? '✨ Nouveau !' : it.how) + '</span>' : '') + '</button>';
  }

  // ───────────────────────── Entrée ─────────────────────────
  function init(h) {
    host = h; save = h.save;
    $('btn-tower-go').addEventListener('click', function () { host.startTower(towerCfg()); });
    window.addEventListener('resize', function () { if (!$('screen-tour').classList.contains('hidden')) { bgDone = ''; drawTowerBg(); } });
    $('btn-brew').addEventListener('click', brew);
    $('lab-tabs').querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { labTab = b.dataset.tab; SFX.click(); renderLab(); }); });
  }
  DS.extras = {
    init: init, styled: styled, styledWand: styledWand, lookCfg: lookCfg, famCfg: famCfg, titleOf: titleOf, giveIngredients: giveIngredients, newUnlocks: newUnlocks, towerCfg: towerCfg,
    renderTower: renderTower, towerEnd: towerEnd, towerFloor: floorOf, renderLab: function () { labSaid = ''; renderLab(); startLabAnim(); }, renderFam: renderFam, renderLook: renderLook, pick: pick,
    mirrorTab: function (t) { mirrorTab = t; }
  };
})();
