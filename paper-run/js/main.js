// Paper Run — écrans (titre, personnages, menu, tournois, course libre, résultats, podium, Papeterie, trophées),
// sauvegarde et lancement des courses.
(function (root) {
  'use strict';
  const PR = root.PR = root.PR || {};
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const coin = '<i class="coin"></i>';
  const TROPHY_ICON = { gold: '🏆', silver: '🥈', bronze: '🥉' };

  // ---------------------------------------------------------------- sauvegarde
  const app = PR.app = { save: null, char: null, game: null, diff: null, cup: null, run: null, screen: 'title' };
  function load() {
    try { app.save = JSON.parse(localStorage.getItem(PR.SAVE_KEY)) || null; } catch (e) { app.save = null; }
    if (!app.save || app.save.v !== 2) app.save = { v: 2, current: null, profiles: {} };
  }
  function persist() { try { localStorage.setItem(PR.SAVE_KEY, JSON.stringify(app.save)); } catch (e) { } }
  function profile(id = app.char && app.char.id) {
    if (!id) return null; const p = app.save.profiles; if (!p[id]) p[id] = { gold: 0, powers: {}, trophies: {}, races: {}, runs: 0 }; return p[id];
  }
  app.profile = profile; app.persist = persist;
  const mods = () => (app.char && app.char.perk.mods) || {};
  const goldMul = (p = profile()) => 1 + (mods().gold || 0) + 0.15 * (p.powers.tirelire || 0);
  const trophyOf = (p, cupId, diffId) => (p.trophies[cupId] || {})[diffId] || null;
  const rank = k => k === 'gold' ? 3 : k === 'silver' ? 2 : k === 'bronze' ? 1 : 0;
  const cupOpen = (cup, p = profile()) => !cup.needs || PR.CUPS.filter(c => !c.needs).filter(c => PR.DIFFICULTIES.some(d => trophyOf(p, c.id, d.id))).length >= cup.needs;
  const goldCount = (p = profile()) => PR.CUPS.reduce((n, c) => n + PR.DIFFICULTIES.filter(d => trophyOf(p, c.id, d.id) === 'gold').length, 0);
  app.cupOpen = cupOpen; app.goldCount = goldCount;

  // ---------------------------------------------------------------- écrans
  function show(name) {
    app.screen = name;
    for (const s of $$('.screen')) s.classList.toggle('hidden', s.id !== 'screen-' + name);
    PR.input.enabled = name === 'game';
    if (name !== 'game' && app.game) { app.game.stop(); app.game = null; }
    if (name === 'title') { PR.audio.stopMusic(); startTitleAnim(); } else stopTitleAnim();
    if (name !== 'game') { $('#pause').classList.add('hidden'); $('#results').classList.add('hidden'); }
  }
  app.show = show;
  function click(sel, fn) { for (const el of $$(sel)) el.addEventListener('click', e => { PR.audio.unlock(); PR.audio.play('click'); fn(e, el); }); }
  function portrait(ch, size, view = 'front') {
    const c = document.createElement('canvas'); c.width = size; c.height = size; c.className = 'portrait';
    const draw = () => { const ctx = c.getContext('2d'); ctx.clearRect(0, 0, size, size); if (root.FamilyHeads && root.FamilyHeads.has(ch.id)) root.FamilyHeads.draw(ctx, ch.id, view, size * 0.1, size * 0.05, size * 0.8, size * 0.9); };
    if (root.FamilyHeads) root.FamilyHeads.ready.then(draw); return c;
  }
  app.portrait = portrait;
  let toastTimer = 0;
  function toast(msg) { const t = $('#toast'); t.innerHTML = msg; t.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), 3400); }
  app.toast = toast;

  // ---------------------------------------------------------------- titre (scène animée)
  let titleRaf = 0, titleBg = null, titleT = 0, titleLast = 0;
  function startTitleAnim() {
    const cv = $('#title-anim'); if (!cv) return; const ctx = cv.getContext('2d');
    if (!titleBg) titleBg = PR.render.makeBackground(PR.WORLDS[0], 42);
    const runners = PR.CHARACTERS.slice().sort(() => Math.random() - 0.5).slice(0, 6).map((ch, i) => ({ ch, x: -i * 170 - Math.random() * 120, speed: 170 + Math.random() * 60, phase: Math.random() * 6 }));
    titleLast = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - titleLast) / 1000); titleLast = now; titleT += dt;
      PR.render.drawBackground(ctx, titleBg, { x: titleT * 60, y: 0 }, cv.width, cv.height, titleT);
      ctx.fillStyle = '#d9a066'; ctx.fillRect(0, cv.height - 70, cv.width, 70); ctx.fillStyle = '#7fd45a'; ctx.fillRect(0, cv.height - 70, cv.width, 14); ctx.strokeStyle = '#2b1f1a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, cv.height - 70); ctx.lineTo(cv.width, cv.height - 70); ctx.stroke();
      for (const r of runners) {
        r.x += r.speed * dt; if (r.x > cv.width + 100) r.x = -120 - Math.random() * 300;
        const hop = Math.max(0, Math.sin(titleT * 6 + r.phase)) * 22;
        PR.render.drawHero(ctx, r.ch, r.x, cv.height - 70 - hop, { face: 1, pose: hop > 12 ? 'jump' : 'run', walk: titleT * 14 + r.phase }, titleT);
      }
      titleRaf = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(titleRaf); titleRaf = requestAnimationFrame(loop);
  }
  function stopTitleAnim() { cancelAnimationFrame(titleRaf); titleRaf = 0; }

  // ---------------------------------------------------------------- personnages
  function renderChars() {
    const grid = $('#char-grid'); grid.innerHTML = '';
    for (const fam of Object.keys(PR.FAMILIES)) {
      const h = document.createElement('h3'); h.textContent = PR.FAMILIES[fam]; grid.appendChild(h);
      const row = document.createElement('div'); row.className = 'char-row';
      for (const ch of PR.CHARACTERS.filter(c => c.family === fam)) {
        const p = app.save.profiles[ch.id];
        const b = document.createElement('button'); b.className = 'char-card paper' + (app.save.current === ch.id ? ' current' : ''); b.style.setProperty('--c', ch.outfit); b.dataset.id = ch.id;
        b.appendChild(portrait(ch, 110));
        b.insertAdjacentHTML('beforeend', '<b>' + esc(ch.name) + '</b><span class="perk">' + ch.perk.icon + ' ' + esc(ch.perk.name) + '</span><small>' + esc(ch.perk.desc) + '</small>' + (p ? '<em>🏆 ' + goldCount(p) + ' · ' + coin + ' ' + p.gold + '</em>' : '<em>Nouveau</em>'));
        b.addEventListener('click', () => { PR.audio.unlock(); PR.audio.play('click'); pickChar(ch); });
        row.appendChild(b);
      }
      grid.appendChild(row);
    }
  }
  function pickChar(ch) { app.char = ch; app.save.current = ch.id; profile(); persist(); renderMenu(); show('menu'); }

  // ---------------------------------------------------------------- menu principal
  function renderMenu() {
    const p = profile();
    const badge = $('#menu-badge'); badge.innerHTML = ''; badge.appendChild(portrait(app.char, 72));
    badge.insertAdjacentHTML('beforeend', '<div><b>' + esc(app.char.name) + '</b><span>' + app.char.perk.icon + ' ' + esc(app.char.perk.name) + '</span></div>');
    $('#menu-gold').innerHTML = coin + ' ' + p.gold;
    const total = PR.CUPS.length * PR.DIFFICULTIES.length, g = goldCount(p);
    $('#menu-progress').innerHTML = '🏆 ' + g + ' / ' + total + ' trophées d’or' + (g === total ? ' — <b>TOUT EN OR !</b>' : '');
  }

  // ---------------------------------------------------------------- tournoi : difficulté puis coupe
  function renderCups() {
    const p = profile();
    const dBox = $('#diff-list'); dBox.innerHTML = '';
    if (!app.diff) app.diff = PR.DIFFICULTIES[0];
    for (const d of PR.DIFFICULTIES) {
      const b = document.createElement('button'); b.className = 'diff-card paper' + (d === app.diff ? ' active' : ''); b.style.setProperty('--c', d.color);
      const won = PR.CUPS.filter(c => trophyOf(p, c.id, d.id) === 'gold').length;
      b.innerHTML = '<span class="cc">' + d.cc + '</span><b>' + esc(d.name) + '</b><small>' + esc(d.sub) + '</small><em>' + won + ' / ' + PR.CUPS.length + ' 🏆</em>';
      b.addEventListener('click', () => { PR.audio.play('click'); app.diff = d; renderCups(); });
      dBox.appendChild(b);
    }
    $('#diff-desc').textContent = app.diff.desc;
    const grid = $('#cup-grid'); grid.innerHTML = '';
    for (const cup of PR.CUPS) {
      const open = cupOpen(cup, p), tr = trophyOf(p, cup.id, app.diff.id), w = PR.worldById(cup.world);
      const card = document.createElement('button'); card.className = 'cup-card paper' + (open ? '' : ' locked'); card.style.setProperty('--c', w.accent);
      card.innerHTML = '<span class="icon">' + cup.icon + '</span><b>' + esc(cup.name) + '</b><small>' + esc(cup.desc) + '</small>' +
        '<div class="races">' + cup.races.map(id => { const l = PR.levelById(id); return '<span>' + esc(l.id) + ' ' + esc(l.name) + '</span>'; }).join('') + '</div>' +
        '<div class="trophies">' + PR.DIFFICULTIES.map(d => { const t = trophyOf(p, cup.id, d.id); return '<span class="' + (d === app.diff ? 'cur' : '') + '" title="' + d.name + '">' + (t ? TROPHY_ICON[t] : '·') + '</span>'; }).join('') + '</div>' +
        (open ? '<span class="btn primary">▶ Courir en ' + esc(app.diff.name) + (tr ? ' <small>' + TROPHY_ICON[tr] + '</small>' : '') + '</span>' : '<span class="btn poor">🔒 Un trophée dans chaque coupe</span>');
      card.addEventListener('click', () => { PR.audio.unlock(); if (!open) { PR.audio.play('nope'); toast('Gagne un trophée dans les quatre premières coupes pour ouvrir la Coupe spéciale.'); return; } PR.audio.play('click'); startCup(cup); });
      grid.appendChild(card);
    }
  }
  function pickRivals() { return PR.CHARACTERS.filter(c => c.id !== app.char.id).sort(() => Math.random() - 0.5).slice(0, 3); }
  function startCup(cup) {
    app.cup = cup; app.run = { cup, diff: app.diff, index: 0, rivals: pickRivals(), points: {}, results: [] };
    for (const r of [app.char, ...app.run.rivals]) app.run.points[r.id] = 0;
    startRace(PR.levelById(cup.races[0]), app.run.rivals, 'cup');
  }

  // ---------------------------------------------------------------- course libre
  function renderFree() {
    const p = profile();
    const dBox = $('#free-diff'); dBox.innerHTML = '';
    if (!app.diff) app.diff = PR.DIFFICULTIES[0];
    for (const d of PR.DIFFICULTIES) { const b = document.createElement('button'); b.className = 'btn' + (d === app.diff ? ' primary' : ''); b.textContent = d.name + ' · ' + d.cc; b.addEventListener('click', () => { PR.audio.play('click'); app.diff = d; renderFree(); }); dBox.appendChild(b); }
    const grid = $('#free-grid'); grid.innerHTML = '';
    for (const cup of PR.CUPS) {
      const h = document.createElement('h3'); h.textContent = cup.icon + ' ' + cup.name; grid.appendChild(h);
      const row = document.createElement('div'); row.className = 'free-row';
      for (const id of cup.races) {
        const lv = PR.levelById(id), rec = p.races[id];
        const b = document.createElement('button'); b.className = 'level-card paper'; b.style.setProperty('--c', PR.worldById(lv.world).accent);
        b.innerHTML = '<span class="num">' + esc(lv.id) + '</span><b>' + esc(lv.name) + '</b><em>' + (rec ? rec.wins + ' victoire' + (rec.wins > 1 ? 's' : '') + ' · meilleur ' + PR.fmtTime(rec.best) : 'Jamais couru') + '</em>';
        b.addEventListener('click', () => { PR.audio.play('click'); app.run = null; startRace(lv, pickRivals(), 'free'); });
        row.appendChild(b);
      }
      grid.appendChild(row);
    }
  }

  // ---------------------------------------------------------------- course
  function startRace(level, rivals, mode) {
    app.level = level; app.mode = mode; const p = profile();
    const cfg = PR.buildCfg(p.powers, mods());
    show('game'); $('#results').classList.add('hidden'); $('#pause').classList.add('hidden');
    if (app.game) app.game.stop();
    app.game = new PR.Race({ canvas: $('#game'), char: app.char, level, cfg, diff: app.diff, rivals, onFinish: finish, onPause: paused => $('#pause').classList.toggle('hidden', !paused) });
    app.game.allowRestart = mode === 'free';
    PR.audio.unlock(); PR.audio.music(level.world);
    app.game.start();
    const tip = $('#game-tip'); tip.textContent = level.tip || ''; tip.classList.remove('hidden'); clearTimeout(tip._t); tip._t = setTimeout(() => tip.classList.add('hidden'), 6000);
  }
  app.startRace = startRace;
  function finish(r) {
    const p = profile(), lv = app.level, d = app.diff, E = PR.ECON;
    const rec = p.races[lv.id] || (p.races[lv.id] = { runs: 0, wins: 0, best: null });
    const first = rec.runs === 0; rec.runs++; if (r.pos === 1) rec.wins++; if (rec.best == null || r.time < rec.best) rec.best = r.time; p.runs++;
    const lines = []; let gold = Math.round(E.race[r.pos - 1] * d.gold); lines.push([PR.POS_NAMES[r.pos - 1] + ' place · ' + d.name, gold]);
    if (first) { gold += E.first; lines.push(['Première course ici', E.first]); }
    if (r.coins) { gold += r.coins; lines.push(['Pièces ramassées', r.coins]); }
    const bonus = Math.round(gold * (goldMul(p) - 1)); if (bonus > 0) lines.push(['Bonus ' + app.char.name + (p.powers.tirelire ? ' + Tirelire' : ''), bonus]); gold += bonus;
    p.gold += gold;
    const run = app.run;
    if (run) { r.order.forEach(o => { run.points[o.id] = (run.points[o.id] || 0) + PR.POINTS[o.pos - 1]; }); run.results.push(r); }
    persist();
    // panneau de résultats
    const box = $('#results'); box.classList.remove('hidden');
    box.querySelector('.r-title').textContent = r.pos === 1 ? 'Victoire !' : PR.POS_NAMES[r.pos - 1] + ' place';
    box.querySelector('.r-level').textContent = lv.id + ' · ' + lv.name + ' · ' + d.name + (run ? ' · course ' + (run.index + 1) + ' / ' + run.cup.races.length : '');
    const stamp = box.querySelector('.r-stamp'); stamp.className = 'r-stamp p' + r.pos; stamp.textContent = ['🥇', '🥈', '🥉', '🏁'][r.pos - 1];
    const all = [app.char, ...(run ? run.rivals : r.order.filter(o => !o.isPlayer).map(o => PR.charById(o.id)))];
    const byId = id => all.find(c => c.id === id) || PR.charById(id);
    box.querySelector('.r-table').innerHTML = '<div class="head"><span></span><span></span><span>Course</span><span>' + (run ? 'Points' : 'Temps') + '</span>' + (run ? '<span>Total</span>' : '') + '</div>' +
      r.order.map(o => { const ch = byId(o.id); return '<div class="row' + (o.isPlayer ? ' me' : '') + '"><span class="pos">' + PR.POS_NAMES[o.pos - 1] + '</span><span class="who" data-id="' + ch.id + '">' + esc(ch.name) + '</span><span>' + PR.fmtTime(o.time) + '</span><span>' + (run ? '+' + PR.POINTS[o.pos - 1] : '') + '</span>' + (run ? '<span><b>' + run.points[o.id] + '</b></span>' : '') + '</div>'; }).join('');
    for (const el of box.querySelectorAll('.who')) el.prepend(portrait(PR.charById(el.dataset.id), 36));
    box.querySelector('.r-stats').innerHTML = '<span>' + coin + ' ' + r.coins + '</span><span>💥 ' + r.hits + ' coup' + (r.hits > 1 ? 's' : '') + ' reçu' + (r.hits > 1 ? 's' : '') + '</span><span>🕳️ ' + r.deaths + ' chute' + (r.deaths > 1 ? 's' : '') + '</span>';
    box.querySelector('.r-gold').innerHTML = lines.map(([k, v]) => '<div><span>' + esc(k) + '</span><b>+' + v + '</b></div>').join('') + '<div class="total"><span>Or gagné</span><b>' + coin + ' ' + gold + '</b></div><div class="wallet"><span>Dans ta bourse</span><b>' + coin + ' ' + p.gold + '</b></div>';
    const nb = $('#r-next'), again = $('#r-again');
    if (run) {
      const last = run.index >= run.cup.races.length - 1;
      nb.innerHTML = (last ? '🏆 Voir le podium' : '▶ Course suivante') + ' <small>Entrée</small>'; again.classList.add('hidden');
      nb.onclick = () => { PR.audio.play('click'); PR.audio.duck(false); if (last) endCup(); else { run.index++; startRace(PR.levelById(run.cup.races[run.index]), run.rivals, 'cup'); } };
    } else {
      nb.innerHTML = '🗺️ Autre course <small>Entrée</small>'; again.classList.remove('hidden');
      nb.onclick = () => { PR.audio.play('click'); PR.audio.duck(false); renderFree(); show('free'); };
    }
    PR.audio.duck(true); setTimeout(() => PR.audio.play(r.pos === 1 ? 'medal' : 'click'), 300);
  }
  function endCup() {
    const run = app.run, p = profile(), d = run.diff, E = PR.ECON;
    const all = [app.char, ...run.rivals];
    const lastPos = id => { const o = run.results[run.results.length - 1].order.find(x => x.id === id); return o ? o.pos : 9; };
    const standing = all.slice().sort((a, b) => (run.points[b.id] - run.points[a.id]) || (lastPos(a.id) - lastPos(b.id)));
    const myPos = standing.findIndex(c => c.id === app.char.id) + 1, trophy = PR.TROPHY[myPos - 1];
    const prev = trophyOf(p, run.cup.id, d.id);
    let gold = 0; if (trophy) { gold = Math.round(E.trophy[trophy] * d.gold); p.gold += gold; }
    const improved = trophy && rank(trophy) > rank(prev);
    if (improved) { p.trophies[run.cup.id] = p.trophies[run.cup.id] || {}; p.trophies[run.cup.id][d.id] = trophy; }
    persist();
    const box = $('#screen-podium');
    box.querySelector('.p-title').textContent = trophy ? PR.TROPHY_NAMES[trophy] + ' !' : 'Pas de trophée cette fois…';
    box.querySelector('.p-sub').textContent = run.cup.name + ' · ' + d.name + (improved ? ' · nouveau trophée !' : (trophy && prev ? ' · tu avais déjà ' + PR.TROPHY_NAMES[prev].toLowerCase() : ''));
    const cv = box.querySelector('#podium-canvas'), ctx = cv.getContext('2d'); ctx.clearRect(0, 0, cv.width, cv.height);
    const slots = [[cv.width / 2, 1], [cv.width / 2 - 170, 2], [cv.width / 2 + 170, 3]];
    PR.render.drawBackground(ctx, PR.render.makeBackground(PR.worldById(run.cup.world), 9), { x: 0, y: 0 }, cv.width, cv.height, 1);
    for (const [x, pos] of slots) {
      const ch = standing[pos - 1]; const h = [90, 60, 40][pos - 1];
      PR.render.cut(ctx, c => PR.render.rr(c, x - 70, cv.height - 30 - h, 140, h + 30, 10), ['#ffd54a', '#dfe3ea', '#e0a070'][pos - 1], { line: 3, edge: 0 });
      PR.render.text(ctx, String(pos), x, cv.height - 30 - h / 2 + 4, 40, '#2b1f1a', 'center');
      PR.render.drawHero(ctx, ch, x, cv.height - 30 - h, { face: 1, pose: pos === 1 ? 'win' : 'idle' }, 1.2);
      PR.render.text(ctx, ch.name, x, cv.height - 30 - h - 98, 18, '#fffaf0', 'center', true);
    }
    if (trophy) PR.render.drawTrophy(ctx, cv.width - 80, 70, trophy, 80);
    const fourth = standing[3];
    box.querySelector('.p-table').innerHTML = standing.map((ch, i) => '<div class="row' + (ch.id === app.char.id ? ' me' : '') + '"><span class="pos">' + PR.POS_NAMES[i] + '</span><span class="who" data-id="' + ch.id + '">' + esc(ch.name) + '</span><span><b>' + run.points[ch.id] + ' pts</b></span></div>').join('');
    for (const el of box.querySelectorAll('.who')) el.prepend(portrait(PR.charById(el.dataset.id), 36));
    box.querySelector('.p-gold').innerHTML = trophy ? 'Prime du trophée : <b>' + coin + ' ' + gold + '</b>' : 'Finis dans les trois premiers pour gagner un trophée. ' + (fourth && fourth.id === app.char.id ? 'Un tour à la Papeterie ?' : '');
    show('podium'); PR.audio.play(trophy ? 'win' : 'nope');
    if (improved && goldCount(p) === PR.CUPS.length * PR.DIFFICULTIES.length) setTimeout(() => toast('🎉 TOUT EN OR ! Toutes les coupes, toutes les difficultés. Champion de papier absolu !'), 800);
    app.run = null;
  }
  window.addEventListener('keydown', e => {
    if (app.screen === 'game') {
      const res = !$('#results').classList.contains('hidden'), pause = !$('#pause').classList.contains('hidden');
      if (res) { if (e.code === 'Enter') $('#r-next').click(); else if (e.code === 'KeyR' && !$('#r-again').classList.contains('hidden')) $('#r-again').click(); else if (e.code === 'Escape') $('#r-menu').click(); }
      else if (pause && e.code === 'Enter') $('#p-resume').click();
    } else if (app.screen === 'podium' && e.code === 'Enter') $('#podium-back').click();
  });

  // ---------------------------------------------------------------- Papeterie
  function renderShop() {
    const p = profile(); $('#shop-gold').innerHTML = coin + ' ' + p.gold;
    const keeper = $('#shop-keeper'); keeper.innerHTML = ''; keeper.appendChild(portrait(PR.charById('josee'), 120));
    const owned = PR.POWERS.filter(pw => p.powers[pw.id]).length;
    $('#shop-say').textContent = owned === 0 ? 'Bienvenue dans ma papeterie, mon trésor ! Des bottes, des ciseaux, du ruban… tout pour gagner tes courses.' : owned < 4 ? 'Les adversaires en Carton prennent des raccourcis : équipe-toi pour les rattraper !' : 'Mon doux ! Tu vas finir par être plus rapide que le vent.';
    const grid = $('#shop-grid'); grid.innerHTML = '';
    for (const pw of PR.POWERS) {
      const lv = p.powers[pw.id] || 0, max = pw.levels.length, full = lv >= max, cost = full ? 0 : pw.cost[lv], can = !full && p.gold >= cost;
      const card = document.createElement('div'); card.className = 'power-card paper' + (full ? ' full' : '') + (lv ? ' owned' : '');
      card.innerHTML = '<span class="icon">' + pw.icon + '</span><b>' + esc(pw.name) + '</b><p>' + esc(pw.desc) + '</p>' +
        '<div class="dots">' + pw.levels.map((_, i) => '<i class="' + (i < lv ? 'on' : '') + '"></i>').join('') + '</div>' +
        '<small>' + (full ? '✔ ' + esc(pw.levels[max - 1]) : (lv ? 'Prochain : ' : '') + esc(pw.levels[lv])) + '</small>' +
        (full ? '<span class="btn done">Complet</span>' : '<button class="btn buy' + (can ? '' : ' poor') + '">' + coin + ' ' + cost + '</button>');
      if (!full) card.querySelector('.buy').addEventListener('click', () => {
        PR.audio.unlock();
        if (p.gold < cost) { PR.audio.play('nope'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); toast('Il te manque ' + (cost - p.gold) + ' pièces d’or. Cours quelques courses !'); return; }
        p.gold -= cost; p.powers[pw.id] = lv + 1; persist(); PR.audio.play('buy'); renderShop(); toast(pw.icon + ' ' + pw.name + ' : ' + pw.levels[lv] + ' !');
      });
      grid.appendChild(card);
    }
  }

  // ---------------------------------------------------------------- trophées
  function renderTrophies() {
    const p = profile(), total = PR.CUPS.length * PR.DIFFICULTIES.length, g = goldCount(p);
    $('#trophy-summary').innerHTML = '<b>' + g + ' / ' + total + '</b> trophées d’or' + (g === total ? ' · 🎉 TOUT EN OR !' : '');
    $('#trophy-grid').innerHTML = '<div class="trow head"><span></span>' + PR.DIFFICULTIES.map(d => '<span style="--c:' + d.color + '">' + esc(d.name) + '<small>' + d.cc + '</small></span>').join('') + '</div>' +
      PR.CUPS.map(c => '<div class="trow"><span class="cup">' + c.icon + ' ' + esc(c.name) + '</span>' + PR.DIFFICULTIES.map(d => { const t = trophyOf(p, c.id, d.id); return '<span class="cell ' + (t || 'none') + '">' + (t ? TROPHY_ICON[t] : (cupOpen(c, p) ? '—' : '🔒')) + '</span>'; }).join('') + '</div>').join('');
  }

  // ---------------------------------------------------------------- outils de test (Matthieu)
  app.give = n => { const p = profile(); p.gold += n; persist(); if (app.screen === 'shop') renderShop(); if (app.screen === 'menu') renderMenu(); };
  app.unlockAll = () => { const p = profile(); for (const pw of PR.POWERS) p.powers[pw.id] = pw.levels.length; persist(); };
  app.winAll = (kind = 'gold') => { const p = profile(); for (const c of PR.CUPS) { p.trophies[c.id] = {}; for (const d of PR.DIFFICULTIES) p.trophies[c.id][d.id] = kind; } persist(); };
  app.reset = () => { localStorage.removeItem(PR.SAVE_KEY); load(); location.reload(); };
  app.setDiff = id => { app.diff = PR.diffById(id); };

  // ---------------------------------------------------------------- démarrage
  function init() {
    load();
    $('#version').textContent = 'v' + PR.VERSION;
    PR.input.setupTouch($('#touch'));
    const cur = app.save.current && PR.charById(app.save.current);
    const bc = $('#btn-continue'); if (cur && app.save.profiles[cur.id]) { bc.classList.remove('hidden'); bc.innerHTML = ''; bc.appendChild(portrait(cur, 44)); bc.insertAdjacentHTML('beforeend', '<span>Continuer avec ' + esc(cur.name) + '</span>'); }
    click('#btn-continue', () => pickChar(cur));
    click('#btn-play', () => { renderChars(); show('chars'); });
    click('#mode-run', () => show('title'));
    click('#mode-loop, #btn-loop', () => { location.href = 'loop/index.html'; });   // Paper Loop vit dans loop/
    click('[data-back]', (e, el) => { const to = el.dataset.back; if (to === 'menu') renderMenu(); if (to === 'chars') renderChars(); if (to === 'cups') renderCups(); show(to); });
    click('#btn-cups', () => { renderCups(); show('cups'); });
    click('#btn-free', () => { renderFree(); show('free'); });
    click('#btn-shop, #r-shop, #podium-shop', () => { PR.audio.duck(false); renderShop(); show('shop'); });
    click('#btn-trophies', () => { renderTrophies(); show('trophies'); });
    click('#btn-change', () => { renderChars(); show('chars'); });
    click('#btn-sound, #p-sound', (e, el) => { const m = PR.audio.toggle(); for (const b of $$('#btn-sound, #p-sound')) b.textContent = m ? '🔇 Son coupé' : '🔊 Son'; });
    click('#r-again', () => { $('#results').classList.add('hidden'); PR.audio.duck(false); startRace(app.level, pickRivals(), 'free'); });
    click('#r-menu', () => { PR.audio.duck(false); app.run = null; renderMenu(); show('menu'); });
    click('#podium-back', () => { renderCups(); show('cups'); });
    click('#p-resume', () => app.game && app.game.setPaused(false));
    click('#p-restart', () => { if (app.game) { app.game.setPaused(false); app.game.restart(); } });
    click('#p-quit', () => { app.run = null; renderMenu(); show('menu'); });
    for (const b of $$('#btn-sound, #p-sound')) b.textContent = PR.audio.muted ? '🔇 Son coupé' : '🔊 Son';
    window.addEventListener('keydown', e => { if (app.screen === 'mode' && e.code === 'Enter') { show('title'); return; } if (app.screen === 'title' && (e.code === 'Enter' || e.code === 'Space')) { PR.audio.unlock(); if (cur && app.save.profiles[cur.id]) pickChar(cur); else { renderChars(); show('chars'); } } });
    window.addEventListener('pointerdown', () => PR.audio.unlock(), { once: true });
    show('mode');
  }
  document.addEventListener('DOMContentLoaded', init);
})(window);
