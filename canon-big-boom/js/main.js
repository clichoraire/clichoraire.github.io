// Écrans et boucle de jeu : titre animé, personnages, carte du monde, hangar, vague (HUD, cartes, pause, résultats).
(async function (CB) {
  'use strict';
  await window.FamilyHeads.ready;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const S = CB.Save, R = CB.Render, A = CB.Audio, I = CB.Input, F = window.FamilyHeads;
  const data = S.load(localStorage), persist = () => S.store(data, localStorage);
  A.enabled = data.settings.sound !== false;
  const app = CB.app = { screen: 'title', player: null, profile: null, wi: 0, vi: 0, wave: null, marker: null, family: 'all', shopTab: 'cannon', charIndex: 0 };
  const fmt = n => Math.round(n).toLocaleString('fr-CA');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  $('#version').textContent = 'v' + CB.VERSION;
  const click = () => { A.init(); A.sfx('click'); };
  function head(id, size = 64, view = 'front') { const c = document.createElement('canvas'); c.width = size; c.height = size * 1.06; if (!F.draw(c.getContext('2d'), id, view, 0, 0, c.width, c.height)) { const x = c.getContext('2d'); x.fillStyle = '#f3d2b4'; x.beginPath(); x.arc(size / 2, size / 2, size * .4, 0, 7); x.fill(); } return c; }
  function badge(el, id) { const p = CB.playerById(id); el.innerHTML = ''; el.append(head(id, 40), document.createTextNode(p.name + ' (' + (CB.ROLES[p.role] || p.role) + ')')); }
  function goldPill(el, gold) { el.innerHTML = '<span class="coin"></span>' + fmt(gold); }
  let raf = 0;
  function show(id) { cancelAnimationFrame(raf); $$('.screen').forEach(e => e.classList.add('hidden')); $('#screen-' + id).classList.remove('hidden'); app.screen = id; document.body.classList.toggle('playing', id === 'wave'); window.scrollTo(0, 0); SHOW[id]?.(); M.play(id === 'wave' ? waveTrack() : 'menu'); }
  $$('[data-back]').forEach(b => b.onclick = () => { A.init(); A.sfx('back'); back(); });
  function back() { if (app.screen === 'characters') show('title'); else if (app.screen === 'map') show('characters'); else if (app.screen === 'shop') show('map'); }
  $('#btn-help').onclick = () => { click(); $('#help').showModal(); };
  // Réglages : deux barres de volume (effets sonores, musique) et un bouton qui coupe chacun d'un coup.
  const M = CB.Music; const pct = v => Math.round(v) + ' %';
  const st = data.settings; st.soundVolume = Number.isFinite(+st.soundVolume) ? +st.soundVolume : 100; st.musicVolume = Number.isFinite(+st.musicVolume) ? +st.musicVolume : 55;
  A.setVolume(st.soundVolume / 100); M.setVolume(st.musicVolume / 100 * .7); M.setEnabled(st.music !== false);
  const FX_MODES = { auto: ['Auto', 'Auto : le jeu allège les effets tout seul si ça rame.'], rich: ['Riches', 'Ombres, lueurs et rendu Retina : le plus beau, le plus lourd.'], lite: ['Légers', 'Sans ombres portées ni Retina : fluide partout.'] };
  const applyFx = () => { const m = st.fx || 'auto'; R.lite = m === 'lite' || (m === 'auto' && !!app.liteAuto); };
  const settingsUi = () => {
    { const m = FX_MODES[st.fx] ? st.fx : 'auto'; $('#fx-val').textContent = FX_MODES[m][0] + (m === 'auto' && app.liteAuto ? ' (légers)' : ''); $('#fx-hint').textContent = FX_MODES[m][1]; }
    $('#btn-sound').textContent = A.enabled && st.soundVolume > 0 ? '🔊' : '🔇'; $('#btn-music').textContent = M.enabled && st.musicVolume > 0 ? '🎵' : '🚫';
    $('#vol-sound').value = st.soundVolume; $('#vol-music').value = st.musicVolume; $('#vol-sound-val').textContent = A.enabled ? pct(st.soundVolume) : 'off'; $('#vol-music-val').textContent = M.enabled ? pct(st.musicVolume) : 'off';
    $('#vol-sound').disabled = !A.enabled; $('#vol-music').disabled = !M.enabled;
  };
  $('#btn-fx').onclick = () => { const order = ['auto', 'rich', 'lite']; st.fx = order[(order.indexOf(st.fx) + 1) % 3]; applyFx(); persist(); settingsUi(); A.sfx('click'); }; applyFx();
  $('#btn-sound').onclick = () => { A.init(); A.enabled = !A.enabled; st.sound = A.enabled; persist(); settingsUi(); A.sfx('click'); };
  $('#btn-music').onclick = () => { A.init(); M.setEnabled(!M.enabled); st.music = M.enabled; persist(); settingsUi(); A.sfx('click'); };
  $('#vol-sound').oninput = e => { A.init(); st.soundVolume = +e.target.value; A.setVolume(st.soundVolume / 100); settingsUi(); A.sfx('kill'); };
  $('#vol-sound').onchange = () => persist();
  $('#vol-music').oninput = e => { A.init(); st.musicVolume = +e.target.value; M.setVolume(st.musicVolume / 100 * .7); settingsUi(); };
  $('#vol-music').onchange = () => persist();
  const showSettings = () => { A.init(); A.sfx('click'); settingsUi(); $('#settings').showModal(); $('#vol-sound').focus({ preventScroll: true }); };
  $('#btn-settings').onclick = showSettings; $('#btn-settings-pause').onclick = showSettings;
  // Tout effacer : confirmation moderne avec un compte à rebours de 3 s avant que le bouton rouge s'active, puis rechargement.
  let wipeTimer = 0;
  const wipeDialog = $('#confirm-wipe'), wipeYes = $('#btn-wipe-yes');
  const askWipe = () => { click(); let n = 3; wipeYes.disabled = true; wipeYes.querySelector('.count').textContent = n; wipeDialog.showModal(); $('#btn-wipe-cancel').focus({ preventScroll: true }); clearInterval(wipeTimer); wipeTimer = setInterval(() => { n--; wipeYes.querySelector('.count').textContent = n; if (n <= 0) { clearInterval(wipeTimer); wipeYes.disabled = false; } }, 1000); };
  $('#btn-wipe').onclick = askWipe;
  $('#btn-wipe-cancel').onclick = () => { A.sfx('back'); clearInterval(wipeTimer); wipeDialog.close(); };
  wipeDialog.addEventListener('close', () => clearInterval(wipeTimer));
  wipeYes.onclick = () => { if (wipeYes.disabled) return; A.sfx('kaboom'); S.wipe(localStorage); CB.app.wiped = true; setTimeout(() => location.reload(), 350); };
  settingsUi();
  const waveTrack = () => { const w = app.wave; if (!w) return 'menu'; if (w.boss && !w.boss.leaving) return 'boss'; return w.scenery ? w.scenery.scene : w.world.id; };
  $('#btn-play').onclick = () => { click(); show('characters'); };
  $('#btn-continue').onclick = () => { click(); choose(data.current); };

  // ---------- Titre : plusieurs membres de la famille dans leur canon, qui tirent sur des chauves-souris ----------
  const title = { t: 0, bats: [], balls: [], bursts: [], spawn: 0, cannons: [] };
  function titleSetup() {
    const ids = CB.PLAYERS.map(p => p.id).sort(() => Math.random() - .5).slice(0, 5), skins = Object.keys(CB.CANNONS).sort(() => Math.random() - .5);
    title.cannons = [150, 320, 480, 640, 810].map((x, i) => ({ x, id: ids[i], skin: i === 2 ? 'classique' : skins[i], timer: .5 + i * .4, angle: 0, recoil: 0 }));
    title.bats = []; title.balls = []; title.bursts = [];
  }
  function titleFrame(dt) {
    const c = $('#title-anim').getContext('2d'), t = title.t += dt;
    R.background(c, 960, 640, CB.WORLDS[0], t);
    title.spawn -= dt; if (title.spawn <= 0 && title.bats.length < 9) { title.spawn = .55; const dir = Math.random() < .5 ? 1 : -1; title.bats.push({ x: dir > 0 ? -40 : 1000, y: 60 + Math.random() * 260, vx: dir * (90 + Math.random() * 90), phase: Math.random() * 6, s: 7 + Math.random() * 6, age: 0, color: Math.random() < .12 ? '#e23b3b' : '#684a91' }); }
    for (const b of title.bats) { b.age += dt; b.x += b.vx * dt; b.y += Math.sin(b.age * 3 + b.phase) * 30 * dt; }
    title.bats = title.bats.filter(b => !b.dead && b.x > -80 && b.x < 1040);
    for (const k of title.cannons) {
      k.timer -= dt; k.recoil = Math.max(0, k.recoil - dt * 4);
      if (k.timer <= 0) { k.timer = 1 + Math.random() * 1.4; const target = title.bats.filter(b => !b.aimed && Math.abs(b.x - k.x) < 400).sort((a, b) => Math.hypot(a.x - k.x, a.y - 500) - Math.hypot(b.x - k.x, b.y - 500))[0]; if (target) { target.aimed = true; k.recoil = 1; k.angle = Math.atan2(target.x - k.x, 540 - target.y) * .6; title.balls.push({ x: k.x, y: 505, tx: target, k: 0, skin: ['fer', 'feu', 'etoile', 'bowling', 'planete'][title.cannons.indexOf(k)], trail: [] }); } }
    }
    for (const b of title.balls) { b.k += dt * 2.2; const tx = b.tx.x + b.tx.vx * .2, ty = b.tx.y; b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 7) b.trail.shift(); b.x = b.x + (tx - b.x) * Math.min(1, dt * 6); b.y = b.y + (ty - b.y) * Math.min(1, dt * 6); if (Math.hypot(tx - b.x, ty - b.y) < 18 || b.k > 1.5) { b.done = true; if (!b.tx.dead) { b.tx.dead = true; title.bursts.push({ x: b.tx.x, y: b.tx.y, age: 0, color: b.tx.color }); } } }
    title.balls = title.balls.filter(b => !b.done);
    for (const b of title.bats) R.enemyIcon(c, 'bat', b.x, b.y, b.s, t + b.phase, b.color);
    for (const b of title.balls) { b.trail.forEach((p, i) => { c.globalAlpha = .3 * i / 7; R.ballIcon(c, b.skin, p.x, p.y, 7, t); }); c.globalAlpha = 1; R.ballIcon(c, b.skin, b.x, b.y, 10, t); }
    for (const b of title.bursts) { b.age += dt; c.globalAlpha = Math.max(0, 1 - b.age * 1.6); for (let i = 0; i < 8; i++) { const a = i * .785, d = b.age * 90; c.fillStyle = i % 2 ? '#ffd23f' : b.color; c.beginPath(); c.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 4, 0, 7); c.fill(); } c.globalAlpha = 1; }
    title.bursts = title.bursts.filter(b => b.age < .7);
    for (const k of title.cannons) R.battleCannon(c, k.x, 546, 46, k.id, k.skin, 0, k.recoil, k.angle * .5);
  }
  const SHOW = {};
  SHOW.title = () => {
    titleSetup(); const cont = $('#btn-continue'); if (data.current && data.profiles[data.current]) { cont.classList.remove('hidden'); cont.textContent = '▶ Continuer avec ' + CB.playerById(data.current).name; $('#btn-play').classList.remove('primary'); } else { cont.classList.add('hidden'); $('#btn-play').classList.add('primary'); }
    let last = performance.now(); const loop = now => { if (app.screen !== 'title') return; raf = requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; titleFrame(dt); }; raf = requestAnimationFrame(loop);
  };

  // ---------- Personnages ----------
  // Écussons de familles : les mêmes que dans Ballon chasseur (bouclier de la couleur de la famille, initiale blanche)
  const crest = (color, letter) => '<svg class="crest" viewBox="0 0 40 44" aria-hidden="true"><path d="M3 2h34v22q0 13-17 18Q3 37 3 24z" fill="' + color + '" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><text x="20" y="25" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="22" fill="#fff">' + letter + '</text></svg>';
  const FAM_TABS = [['all', '👨‍👩‍👧‍👦', 'Tous'], ['matt', crest(CB.FAMILIES.matt.color, 'M'), 'Les Matt'], ['bibi', crest(CB.FAMILIES.bibi.color, 'B'), 'Les Bibi'], ['jay', crest(CB.FAMILIES.jay.color, 'J'), 'Les Jay'], ['jo', crest(CB.FAMILIES.jo.color, 'J'), 'Les Jo']];
  function charList() { return CB.PLAYERS.filter(p => app.family === 'all' || p.family === app.family); }
  function renderCharacters() {
    $('#family-tabs').innerHTML = FAM_TABS.map(([id, ico, label]) => '<button class="tab ' + (app.family === id ? 'active' : '') + '" data-fam="' + id + '" title="' + label + '">' + ico + '<small>' + label + '</small></button>').join('');
    $$('#family-tabs .tab').forEach(b => b.onclick = () => { click(); app.family = b.dataset.fam; app.charIndex = 0; renderCharacters(); });
    const list = charList(), grid = $('#char-grid'); grid.innerHTML = '';
    list.forEach((p, i) => { const prof = data.profiles[p.id]; const card = document.createElement('button'); card.className = 'char-card' + (i === app.charIndex ? ' selected' : ''); card.setAttribute('role', 'option'); card.append(head(p.id, 76)); card.insertAdjacentHTML('beforeend', '<b>' + esc(p.name) + '</b><small>' + esc(CB.ROLES[p.role] || p.role) + (prof ? ' · Niv. ' + prof.level : '') + '</small>'); card.onclick = () => { A.init(); if (app.charIndex === i) { A.sfx('click'); choose(p.id); } else { A.sfx('click'); app.charIndex = i; renderCharacters(); } }; grid.append(card); });
    const p = list[app.charIndex] || list[0], prof = data.profiles[p.id] || S.blank(p.id), fam = CB.FAMILIES[p.family], need = CB.xpForLevel(prof.level);
    const d = $('#char-detail'); d.innerHTML = ''; const big = head(p.id, 160); big.className = 'big'; d.append(big);
    d.insertAdjacentHTML('beforeend', '<span class="name">' + esc(p.name) + '</span><span class="fam" style="background:' + fam.color + ';color:' + (p.family === 'bibi' ? '#1b1b1b' : '#fff') + '">' + esc(fam.name.toUpperCase()) + ' · ' + esc((CB.ROLES[p.role] || p.role).toUpperCase()) + ' · ' + CB.ageOf(p.birth) + ' ANS</span>'
      + '<div class="perk"><b>' + p.perk.icon + ' ' + esc(p.perk.name) + '</b><p class="always">' + esc(CB.PERK_SHORT[p.id] || p.perk.desc) + '</p>' + (CB.SPECIALS[p.id] ? '<p class="fun">' + esc(CB.SPECIAL_FUN[p.id] || CB.SPECIALS[p.id].desc) + '</p>' : '') + '</div>'
      + '<div class="statline"><span>Niveau</span><b>' + prof.level + '</b></div><div class="xpbar"><i style="width:' + Math.round(100 * prof.xp / need) + '%"></i></div>'
      + '<div class="statline"><span>Évolutions</span><b>' + Object.values(prof.talents || {}).reduce((a, b) => a + b, 0) + (prof.points ? ' · ⭐ ' + prof.points + ' à choisir' : '') + '</b></div>' + (prof.allyBought && prof.ally ? '<div class="statline"><span>Coéquipier</span><b>' + esc(CB.playerById(prof.ally)?.name || '') + '</b></div>' : '')
      + '<div class="statline"><span>Or en banque</span><b>' + CB.COIN + ' ' + fmt(prof.gold) + '</b></div><div class="statline"><span>Aventure</span><b>' + S.completion(prof) + ' % · ★ ' + S.totalStars(prof) + '</b></div>'
      + '<button class="lego primary" id="btn-choose"><b class="btn-badge">A</b> Jouer avec ' + esc(p.name) + '</button>');
    $('#btn-choose').onclick = () => { click(); choose(p.id); };
  }
  function choose(id) { app.player = CB.playerById(id); app.profile = S.profile(data, id); data.current = id; persist(); const n = app.profile.last || S.nextWave(app.profile); app.wi = n.wi; app.vi = n.vi; show('map'); }
  SHOW.characters = () => { const list = charList(); const i = list.findIndex(p => p.id === data.current); if (i >= 0) app.charIndex = i; renderCharacters(); };

  // ---------- Carte ----------
  SHOW.map = () => {
    if (!app.marker || app.marker.keep) { if (app.marker) delete app.marker.keep; else app.marker = { vi: app.vi, from: null, k: 1 }; } else app.marker = { vi: app.vi, from: null, k: 1 }; app.at = null; app.profile.last = { wi: app.wi, vi: app.vi }; persist();
    const w0 = CB.WORLDS[app.wi], nextReveal = p0 => app.wi === 0 ? (S.revealed(p0) > (p0.shown || 0) ? { vi: (p0.shown || 0) + 1, k: 0, dinged: false } : p0.portal && !p0.portalShown ? { vi: 5, k: 0, dinged: false } : (p0.targetsHit || 0) >= 3 && !p0.targetsShown ? { vi: 6, k: 0, dinged: false } : S.stars(p0, 'foret', 3) > 0 && !p0.brigandsShown ? { vi: 7, k: 0, dinged: false } : p0.boatSecret && !p0.boatShown ? { vi: 8, k: 0, dinged: false } : null)
      : (w0.secret && S.portalFound(p0, w0.id) && !S.portalShown(p0, w0.id) ? { vi: w0.secret.vi, k: 0, dinged: false } : null);   // autres mondes : le tableau secret N-6 se trace après le portail
    app.reveal = nextReveal(app.profile); app.cheer = null; if (app.afterWin && app.afterWin.wi === app.wi) { app.cheer = { vi: app.afterWin.vi, k: 0 }; if (app.reveal) app.reveal.hold = true; else if (app.afterWin.next != null) app.reveal = { vi: app.afterWin.next, k: 0, dinged: false, unlock: true, hold: true }; } app.afterWin = null;   // fête d'abord (le nouveau tableau reste caché), le tracé du chemin attend const hw = CB.hiddenFrom(app.wi); app.gate = hw >= 0 && S.hiddenOpen(app.profile, CB.WORLDS[hw].id) ? { on: true, k: S.hiddenShown(app.profile, CB.WORLDS[hw].id) ? 2 : 0, id: CB.WORLDS[hw].id, wi: hw, from: w0.gate } : null;   // passerelle vers le monde caché de ce monde (le chemin se trace la première fois)
    badge($('#map-badge'), app.player.id); mapInfo(); levelButton();
    app.debug = false; const dev = app.player.id === 'matthieu'; $('#btn-debug').classList.toggle('hidden', !dev); $('#btn-new-wave').classList.toggle('hidden', !dev); $('#btn-cheats').classList.toggle('hidden', !dev);
    let last = performance.now(), t = 0; const c = $('#map-canvas').getContext('2d');
    const loop = now => { if (app.screen !== 'map') return; raf = requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; if (app.marker.k < 1) { app.marker.k = Math.min(1, app.marker.k + dt * 1.6); if (app.marker.k >= 1) A.sfx('walk'); } if (app.reveal) { const rv = app.reveal; if (!rv.hold) rv.k += dt * .7; if (rv.k >= 1 && !rv.dinged) { rv.dinged = true; A.sfx('win'); } if (rv.k >= 1.6) { const done = rv.vi; if (rv.unlock) { } else if (app.wi !== 0) S.markPortalShown(app.profile, w0.id); else if (rv.vi === 5) app.profile.portalShown = true; else if (rv.vi === 6) app.profile.targetsShown = true; else if (rv.vi === 7) app.profile.brigandsShown = true; else if (rv.vi === 8) app.profile.boatShown = true; else app.profile.shown = rv.vi; persist(); app.reveal = nextReveal(app.profile); mapInfo(); if (typeof done === 'number' && (rv.unlock || done === app.vi + 1) && !app.reveal && S.waveUnlocked(app.profile, app.wi, done)) selectWave(done, true, app.vi); } }   // le nouveau tableau dessiné : le personnage y marche
      if (app.cheer) { const ch = app.cheer; if (ch.k === 0) A.sfx('win'); ch.k += dt / 1.8; if (ch.k >= 1) { app.cheer = null; if (app.reveal) app.reveal.hold = false; else { const nv = nextToDo(); if (nv >= 0 && nv !== app.vi) selectWave(nv, true, app.vi); } } }   // fête sur le tableau battu, puis le tableau suivant se dessine
      if (app.gate && app.gate.k < 2) { app.gate.k += dt * .7; if (app.gate.k >= 1.6 && !S.hiddenShown(app.profile, app.gate.id)) { S.markHiddenShown(app.profile, app.gate.id); persist(); A.sfx('win'); } }
      if (app.marker.k >= 1 && app.marker.travel) { const tr = app.marker.travel; app.marker.travel = null; travelTo(tr.wi, tr.from, tr.to); }   // arrivé au bout du chemin : on change de monde
      const ex = exitWorld(), en = entryWorld();
      const view = R.fitCanvas(c.canvas); R.begin(c, view); CB.Map.draw(c, { wi: app.wi, profile: app.profile, selected: app.at || app.vi, t, playerId: app.player.id, marker: app.marker, view, reveal: app.reveal, cheer: app.cheer, gate: app.gate, exit: ex >= 0 ? { open: S.worldUnlocked(app.profile, ex), name: CB.WORLDS[ex].short || CB.WORLDS[ex].name } : null, entry: en >= 0 ? { name: CB.WORLDS[en].short || CB.WORLDS[en].name } : null }); };
    raf = requestAnimationFrame(loop);
  };
  // Le monde après celui-ci (chemin de sortie après le boss) et celui d'avant (chemin d'entrée) ; un monde caché rentre chez son parent
  const exitWorld = () => CB.WORLDS[app.wi].hidden ? -1 : (app.wi + 1 < CB.WORLDS.length && !CB.WORLDS[app.wi + 1].hidden ? app.wi + 1 : -1);
  const entryWorld = () => { const w = CB.WORLDS[app.wi]; if (w.hidden) return CB.WORLDS.findIndex(o => o.id === w.from); return app.wi > 0 ? app.wi - 1 : -1; };
  // Marche vers un autre monde : on arrive par 'entry' (ou 'exit' / 'gate' en revenant) et on continue jusqu'à la case voulue
  function travelTo(wi, from, to) { if (!S.worldUnlocked(app.profile, wi)) return; app.wi = wi; app.vi = typeof to === 'number' ? to : 0; app.at = null; app.marker = { vi: to, from, k: 0, keep: true }; app.profile.last = { wi, vi: app.vi }; persist(); A.sfx('win'); show('map'); }
  // Flèches : on va vers la case voisine dans cette direction (haut / bas / gauche / droite), s'il y a un chemin
  function mapMove(dx, dy) {
    const cur = app.at || app.vi, from = CB.Map.pos(app.wi, cur); let best = null, bd = .45;
    for (const k of CB.Map.neighbors(app.wi, cur, !!(app.gate && app.gate.on && app.gate.k >= 1))) { const p = CB.Map.pos(app.wi, k), vx = p[0] - from[0], vy = p[1] - from[1], l = Math.hypot(vx, vy) || 1, d = (vx * dx + vy * dy) / l; if (d > bd) { bd = d; best = k; } }
    if (best == null) return false;
    if (typeof best === 'number') { if (!CB.Map.visible(app.wi, app.profile, best) || !S.waveUnlocked(app.profile, app.wi, best)) { A.sfx('nope'); return true; } selectWave(best, true, cur); app.at = null; return true; }
    if (best === 'gate') { app.at = 'gate'; app.marker = { vi: 'gate', from: cur, k: 0 }; mapInfo(); A.sfx('click'); return true; }
    const wi = best === 'exit' ? exitWorld() : entryWorld(); if (wi < 0 || !S.worldUnlocked(app.profile, wi)) { A.sfx('nope'); if (wi >= 0) $('#world-title').textContent = '🔒 Réussis ' + CB.WORLD_NEED + ' tableaux de ce monde d’abord !'; return true; }
    const hidden = CB.WORLDS[app.wi].hidden, to = best === 'exit' ? 0 : hidden ? CB.WORLDS[wi].gate : CB.WAVES_PER_WORLD - 1;   // en sortant : le tableau 1 du monde suivant ; en reculant : le boss du monde d'avant (ou la case de la passerelle du monde parent)
    app.at = best; app.marker = { vi: best, from: cur, k: 0, travel: { wi, from: best === 'exit' ? 'entry' : hidden ? 'gate' : 'exit', to } }; mapInfo(); A.sfx('click'); return true;
  }
  function enterAt() { if (app.at === 'gate' && app.gate) travelTo(app.gate.wi, 'entry', 0); else if (app.at === 'exit' || app.at === 'entry') { const tr = app.marker && app.marker.travel; if (tr) { app.marker.travel = null; travelTo(tr.wi, tr.from, tr.to); } } }
  function mapInfo() {
    const w = CB.WORLDS[app.wi], p = app.profile, def = CB.waveDef(app.wi, app.vi), stars = S.stars(p, w.id, app.vi), open = S.waveUnlocked(p, app.wi, app.vi);
    $('#world-title').textContent = (w.hidden ? w.icon + ' Monde caché' : 'Monde ' + (app.wi + 1)) + ' · ' + w.name; goldPill($('#map-gold'), p.gold);
    $('#world-prev').disabled = nextWorldIndex(-1) < 0; $('#world-next').disabled = nextWorldIndex(1) < 0;
    const el = $('#map-objective');
    if (app.at) { const target = app.at === 'gate' && app.gate ? CB.WORLDS[app.gate.wi] : CB.WORLDS[app.at === 'exit' ? exitWorld() : entryWorld()]; el.innerHTML = '<span class="tag">' + (app.at === 'gate' ? '🌀 MONDE CACHÉ' : app.at === 'exit' ? '▶ MONDE SUIVANT' : '◀ RETOUR') + '</span><br>' + (target ? esc(target.icon + ' ' + target.name) : '') + '<br>Appuie sur Jouer pour y aller !'; $('#btn-start').innerHTML = '<b class="btn-badge">A</b> Y aller'; $('#btn-start').disabled = false; return; }
    $('#btn-start').innerHTML = '<b class="btn-badge">A</b> Jouer';
    el.innerHTML = '<span class="tag">' + (def.tag ? def.tag : def.secret ? '🌀 LE PASSÉ' : def.minigame ? '🎯 MINI-JEU' : def.type === 'boss' ? '💀 BOSS' : 'TABLEAU ' + (app.vi + 1)) + ' · ' + esc(def.name.toUpperCase()) + '</span>' + (stars ? ' <span class="stars">' + '★'.repeat(stars) + '<span style="opacity:.3">' + '★'.repeat(Math.max(0, 3 - stars)) + '</span></span>' : '')   /* les mini-jeux donnent jusqu'à 4 étoiles (médaille de diamant) : repeat(-1) plantait la carte au retour */ + '<br>' + (open ? esc(def.text) : app.wi === 0 || def.secret ? '🔒 Un secret se cache dans ce monde…' : '🔒 Termine le tableau précédent pour débloquer celui-ci.') + '<div class="icons"></div>';
    const icons = el.querySelector('.icons'); const known = [...new Set(def.endless === 'dinos' ? CB.DINOS : w.enemies)].filter(type => (p.seenBy || {})[type] > 0 && (p.killsBy || {})[type] > 0).slice(0, 10); if (!known.length) { const q = document.createElement('span'); q.className = 'unknown'; q.title = 'Monstres encore inconnus'; q.textContent = '?'; icons.append(q); } for (const type of known) { const c = document.createElement('canvas'); c.width = c.height = 72; c.title = CB.ENEMIES[type].name; R.enemyIcon(c.getContext('2d'), type, 36, 36, 9); icons.append(c); }
    if (def.type === 'boss') { const c = document.createElement('canvas'); c.width = c.height = 72; c.title = CB.BOSSES[w.boss].name; R.bossIcon(c.getContext('2d'), w.boss, 36, 40, 5); icons.append(c); }
    $('#btn-start').disabled = !open;
    { const ex = exitWorld(), go = $('#btn-world-go'), can = ex >= 0 && S.worldUnlocked(p, ex); go.classList.toggle('hidden', !can); if (can) go.textContent = '▶ ' + (CB.WORLDS[ex].icon || '') + ' ' + (CB.WORLDS[ex].short || CB.WORLDS[ex].name); }   // trois tableaux réussis : le monde suivant est ouvert, pas besoin du boss
  }
  const nextToDo = () => { for (let v = 0; v < CB.WAVES_PER_WORLD; v++) if (S.waveUnlocked(app.profile, app.wi, v) && !S.stars(app.profile, CB.WORLDS[app.wi].id, v)) return v; return -1; };   // le prochain tableau du chemin principal pas encore réussi (après un mini-jeu, le personnage y retourne)
  function selectWave(vi, walk = true, from = app.at || app.vi) { if (vi < 0 || vi >= CB.wavesOf(app.wi) || (vi === app.vi && !app.at)) return; app.at = null; app.vi = vi; app.marker = walk ? { vi, from, k: 0 } : { vi, from: null, k: 1 }; app.profile.last = { wi: app.wi, vi }; persist(); mapInfo(); A.sfx('click'); }
  const nextWorldIndex = d => { for (let i = app.wi + d; i >= 0 && i < CB.WORLDS.length; i += d) if (!CB.WORLDS[i].hidden || S.worldUnlocked(app.profile, i)) return i; return -1; };   // ◀ ▶ sautent les mondes cachés pas encore trouvés
  function changeWorld(d) { const i = nextWorldIndex(d); if (i >= 0) setWorld(i); }
  function setWorld(wi) { if (wi < 0 || wi >= CB.WORLDS.length) return; if (!S.worldUnlocked(app.profile, wi)) { A.sfx('nope'); $('#world-title').textContent = CB.WORLDS[wi].hidden ? '🔒 Un monde caché… trouve son secret !' : '🔒 Réussis ' + CB.WORLD_NEED + ' tableaux du monde ' + wi + ' d’abord !'; return; } app.wi = wi; app.vi = 0; for (let v = CB.WAVES_PER_WORLD - 1; v >= 0; v--) if (S.waveUnlocked(app.profile, wi, v) && !S.stars(app.profile, CB.WORLDS[wi].id, v)) { app.vi = v; break; } app.marker = { vi: app.vi, from: null, k: 1 }; app.at = null; app.profile.last = { wi, vi: app.vi }; persist(); mapInfo(); A.sfx('click'); }
  // Panneau des cheats (bouton 🧪, Matthieu seulement) : or, invincibilité, tout débloquer, tous les objets, niveau, inviter qui il veut (même en plein tableau)
  function showCheats() { const p = app.profile, w = app.wave && !app.wave.over ? app.wave : null, list = $('#cheat-list'); list.innerHTML = ''; $('#cheat-team').classList.add('hidden');
    for (const ch of CB.CHEATS) { const b = document.createElement('button'); b.className = 'lego small' + (ch.toggle && p.cheats && p.cheats.god ? ' on' : ''); b.innerHTML = ch.icon + ' ' + ch.name + (ch.desc ? '<br><small>' + ch.desc + '</small>' : ''); b.onclick = () => { click();
        if (ch.gold) { p.gold += ch.gold; } else if (ch.id === 'unlock') cheatUnlock(); else if (ch.id === 'god') { const on = S.cheatGod(p); if (w) w.god = on; b.classList.toggle('on', on); } else if (ch.id === 'items') { S.cheatItems(p); if (w) { w.bench = p.ally3; } } else if (ch.id === 'level') { p.level = (p.level || 1) + 5; } else if (ch.id === 'team') { cheatTeam(); return; }
        persist(); A.sfx('win'); if (app.screen === 'map') mapInfo(); if (app.screen === 'shop') renderShop(); if (w) pauseTeam(w); }; list.append(b); }
    $('#overlay-cheats').classList.remove('hidden'); }
  function cheatTeam() { const p = app.profile, w = app.wave && !app.wave.over ? app.wave : null, box = $('#cheat-team'); box.innerHTML = ''; box.classList.remove('hidden'); p.allyBought = true; p.ally2Bought = true;
    for (const m of CB.PLAYERS) { if (m.id === p.id) continue; const row = document.createElement('div'); const left = w ? w.ally && w.ally.id === m.id : p.ally === m.id, right = w ? w.ally2 && w.ally2.id === m.id : p.ally2 === m.id; row.className = 'row' + (left || right ? ' on' : ''); row.append(head(m.id, 34)); const name = document.createElement('span'); name.textContent = m.name + (left ? ' · à gauche' : right ? ' · à droite' : ''); row.append(name);
      for (const [slot, label] of [[1, '← G'], [2, 'D →']]) { const b = document.createElement('button'); b.className = 'lego small'; b.textContent = label; b.onclick = () => { click(); if (slot === 1) { if (p.ally2 === m.id) p.ally2 = p.ally; p.ally = m.id; } else { if (p.ally === m.id) p.ally = p.ally2; p.ally2 = m.id; } if (w) w.swapAlly(slot, m.id); persist(); A.sfx('win'); cheatTeam(); if (w) pauseTeam(w); }; row.append(b); }
      box.append(row); } }
  $('#btn-cheats').onclick = () => { click(); showCheats(); }; $('#btn-cheats-pause').onclick = () => { click(); showCheats(); }; $('#btn-cheats-close').onclick = () => { click(); $('#overlay-cheats').classList.add('hidden'); };
  // En pause : la réserve (objet « Trio de choc ») entre en jeu à gauche ou à droite
  function pauseTeam(w) { const box = $('#pause-team'); const bm = w.bench && CB.playerById(w.bench); if (!bm) { box.classList.add('hidden'); return; } box.classList.remove('hidden'); box.innerHTML = ''; box.append(head(bm.id, 34)); const t = document.createElement('span'); t.textContent = '🔁 Réserve : ' + bm.name; box.append(t);
    for (const [slot, who] of [[1, w.ally], [2, w.ally2]]) { const b = document.createElement('button'); b.className = 'lego small'; b.textContent = (slot === 1 ? '← Gauche' : 'Droite →') + (who ? ' (' + CB.playerById(who.id).name + ')' : ''); b.onclick = () => { click(); if (w.swapAlly(slot)) { A.sfx('win'); pauseTeam(w); } else A.sfx('nope'); }; box.append(b); } }
  // Triche de Matthieu : sur la carte, taper les lettres b-o-o-m (ou toucher 7 fois vite le nom du monde) débloque tout.
  const cheatUnlock = () => { S.cheatUnlock(app.profile); persist(); app.reveal = null; A.sfx('win'); $('#world-title').textContent = '🔓 TOUT EST DÉBLOQUÉ !'; setTimeout(() => { if (app.screen === 'map') mapInfo(); }, 1500); };
  let cheatBuf = '', cheatTaps = [];
  document.addEventListener('keydown', e => { if (app.screen !== 'map' || e.key.length !== 1) return; cheatBuf = (cheatBuf + e.key.toLowerCase()).slice(-4); if (cheatBuf === 'boom') { cheatBuf = ''; cheatUnlock(); } });
  $('#world-title').addEventListener('pointerdown', () => { const now = performance.now(); cheatTaps = cheatTaps.filter(t0 => now - t0 < 2500); cheatTaps.push(now); if (cheatTaps.length >= 7) { cheatTaps = []; cheatUnlock(); } });
  $('#world-prev').onclick = () => { A.init(); changeWorld(-1); }; $('#world-next').onclick = () => { A.init(); changeWorld(1); };
  $$('#dodge-btns button').forEach(b => { const on = ev => { ev.preventDefault(); A.init(); W.dodge = +b.dataset.d; }, off = () => { if (W.dodge === +b.dataset.d) W.dodge = 0; }; b.onpointerdown = on; b.onpointerup = off; b.onpointercancel = off; b.onpointerleave = off; });
  $('#map-canvas').onpointerdown = e => { A.init(); const { x, y } = R.toLogical(e.currentTarget, e.clientX, e.clientY); if (CB.Map.hangarAt(x, y)) { click(); show('shop'); return; } if (app.gate && app.gate.k >= 1 && CB.Map.gateAt(app.wi, x, y)) { click(); travelTo(app.gate.wi, 'entry', 0); return; } const vi = CB.Map.nodeAt(app.wi, x, y); if (vi < 0) return; if (!S.waveUnlocked(app.profile, app.wi, vi)) { A.sfx('nope'); return; } if (vi === app.vi) startWave(); else selectWave(vi); };
  $('#btn-start').onclick = () => { click(); if (app.at) enterAt(); else startWave(); }; $('#btn-shop').onclick = () => { click(); show('shop'); };
  $('#btn-world-go').onclick = () => { click(); const ex = exitWorld(); if (ex >= 0 && S.worldUnlocked(app.profile, ex)) travelTo(ex, 'entry', 0); else A.sfx('nope'); };

  // ---------- Hangar ----------
  const SHOP_TABS = [['cannon', '<canvas class="tab-cv" width="44" height="30"></canvas>', 'Canon', ''], ['balls', '🟠', 'Boulets', ''], ['effects', '✨', 'Effets spéciaux', 'Parfois, quand tu tires, il se passe quelque chose de spécial. Plus de niveaux = plus souvent !'], ['team', '👥', 'Équipe', 'Des sièges à acheter, et la famille qui s’y assoit : chaque coéquipier tire tout seul (dégâts ÷ 2) et lance son pouvoir de temps en temps.'], ['powers', '🧿', 'Pouvoirs', 'Achète la case vierge, puis mets-y un deuxième pouvoir : n’importe lequel de la famille, avec sa propre jauge. Ça coûte cher !']];
  // Fiche du canon (hangar) : le héros assis sur son canon vu de profil, puis les stats avec des barres obliques.
  function shopHero() {
    const p = app.profile, pl = app.player, st = CB.stats(p, pl), art = $('#shop-art'), c = art.getContext('2d'); c.clearRect(0, 0, art.width, art.height);
    c.save(); c.globalAlpha = .12; c.fillStyle = '#ffe36b'; c.font = '900 260px Arial'; c.textAlign = 'center'; c.translate(230, 250); c.rotate(-.28); c.fillText('✦', 0, 0); c.restore();
    R.battleCannon(c, 180, 300, 120, pl.id, p.cannon, 1, 0, 0);
    { const need = CB.xpForLevel(p.level), capped = p.level >= CB.MAX_LEVEL; $('#shop-level').textContent = 'NIVEAU ' + p.level + (capped ? ' · MAX' : ''); $('#shop-xp-text').textContent = capped ? 'NIVEAU MAXIMUM' : fmt(p.xp) + ' / ' + fmt(need) + ' XP'; const bar = $('#shop-xp'); bar.max = capped ? 1 : need; bar.value = capped ? 1 : Math.min(need, p.xp); }
    $('#shop-name').textContent = pl.name; $('#shop-cannon').innerHTML = '<b>' + esc(CB.CANNONS[p.cannon]?.name || '') + '</b> · ' + esc(pl.perk.icon + ' ' + pl.perk.name);
    const pct = v => (v >= 0 ? '+' : '') + Math.round(v * 100) + ' %';
    const rows = [['cadence', pct(st.rate - 1)], ['degats', pct(st.damage - 1)], ['portee', pct(st.range - 1)], ['vie', st.maxHp + ' PV'], ['armure', st.maxArmor + ' 🛡'], ['butin', pct(st.gold - 1)], ['critique', Math.round(st.crit * 100) + ' %'], ['reparation', st.regen ? '+' + st.regen + ' PV / 5 s' : '—']];
    // Deux couleurs par barre : la part du personnage (talents choisis + son talent de famille) et la part du canon (améliorations du hangar + canon équipé).
    const perkMods = pl.perk?.mods || {}, cannonMods = (CB.CANNONS[p.cannon] || {}).mods || {}, MOD = { cadence: 'rate', degats: 'damage', portee: 'range', butin: 'gold', critique: 'crit' };
    $('#shop-stats').innerHTML = rows.map(([key, text]) => {
      const u = CB.UPGRADES[key] || CB.TALENTS[key], per = CB.STAT_PER[key], boost = CB.cannonBoost(p.cannon).power, lvl = (S.cannonUp(p)[key] || 0) * boost, tal = (p.talents || {})[key] || 0;
      const hero = tal * per.talent + (key === 'vie' ? (perkMods.hp || 0) : (perkMods[MOD[key]] || 0)), cannon = lvl * per.upgrade + (cannonMods[MOD[key]] || 0) + (key === 'armure' ? CB.cannonArmor(p.cannon) : 0), max = (CB.TALENT_MAX * per.talent + (u.max || 0) * per.upgrade * boost + (key === 'armure' ? 90 : 0)) || 1;
      const hw = Math.min(100, 100 * hero / max), cw = Math.min(100 - hw, 100 * cannon / max);
      return '<div class="stat-row' + (u.max && lvl >= u.max ? ' maxed' : '') + '"><span>' + CB.icon(u.icon) + ' ' + esc(u.name) + '</span><div class="meter duo" role="meter" aria-label="' + esc(u.name) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(hw + cw) + '"><i class="hero" style="width:' + hw + '%" title="Personnage"></i><i class="cannon" style="width:' + cw + '%" title="Canon"></i></div><b>' + text + '</b></div>'; }).join('')
      + '<div class="stat-legend"><span><i class="hero"></i> ' + esc(pl.name) + '</span><span><i class="cannon"></i> Canon</span></div>';
  }
  // Canon seul, de profil, pour le ruban des canons en bas de l'écran (pas de personnage dessus, proportions respectées).
  function cannonCard(key) { const c = document.createElement('canvas'); c.width = 220; c.height = 130; c.className = 'cannon-cv'; R.battleCannon(c.getContext('2d'), 92, 116, 58, app.player.id, key, 1, 0, 0, { noRider: true }); return c; }
  function ballCard(key) { const c = document.createElement('canvas'); c.width = 240; c.height = 110; c.className = 'preview'; const x = c.getContext('2d'), b = CB.BALLS[key], n = b.variants ? b.variants.length : 1; for (let i = 0; i < n; i++) R.ballIcon(x, key, n === 1 ? 120 : 120 + (i - (n - 1) / 2) * (200 / n), 56, n === 1 ? 32 : Math.min(26, 90 / n), .6 * i, i); return c; }   // boulets à thème : toutes les variantes côte à côte
  // Ruban des canons (onglet Canon) : pleine largeur de l'écran, en bas ; on choisit le canon dont on voit les améliorations.
  function renderCannonStrip() {
    const p = app.profile, strip = $('#cannon-strip'), inner = strip.querySelector('.strip-inner'); inner.innerHTML = '';
    for (const [key, k] of Object.entries(CB.CANNONS)) {
      const owned = p.cannons.includes(key), equipped = p.cannon === key, unlocked = S.cannonUnlocked(p, key), world = k.world && CB.worldById(k.world);
      const el = document.createElement('button'); el.type = 'button'; el.className = 'cannon-tile' + (app.shopCannon === key ? ' selected' : '') + (equipped ? ' equipped' : owned ? ' owned' : unlocked ? '' : ' locked'); el.title = k.desc;
      el.append(cannonCard(key)); el.insertAdjacentHTML('beforeend', '<b>' + esc(k.name) + '</b><small>' + (equipped ? 'ÉQUIPÉ' : owned ? 'ACHETÉ' : unlocked ? CB.COIN + ' ' + fmt(k.price) : '🔒 ' + esc(world ? world.short : '')) + ' · palier ' + ((k.tier || 0) + 1) + '</small>');
      el.onclick = () => { click(); app.shopCannon = key; renderShop(); inner.querySelector('.selected')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }; inner.append(el);
    }
  }
  // Démo de tir du hangar (onglet Boulets) : le héros tire le boulet choisi en boucle sur la fiche de gauche.
  function startDemo() {
    const my = app.demoId = (app.demoId || 0) + 1, art = $('#shop-art'), c = art.getContext('2d'); W.demo = { balls: [], shots: 0, next: .2, recoil: 0 }; let last = performance.now(), t = 0;
    const loop = now => { if (my !== app.demoId || app.screen !== 'shop' || app.shopTab !== 'balls') { if (app.screen === 'shop') shopHero(); return; } raf = requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; R.ballDemo(c, art.width, art.height, app.player.id, app.profile.cannon, app.shopBall || app.profile.ball, W.demo, dt, t); };
    raf = requestAnimationFrame(loop);
  }
  function renderShop() {
    const p = app.profile, pl0 = app.player; goldPill($('#shop-gold'), p.gold); if (app.shopTab !== 'balls') { app.demoId = (app.demoId || 0) + 1; shopHero(); }
    $('#shop-tabs').innerHTML = SHOP_TABS.map(([id, ico, label]) => '<button class="tab ' + (app.shopTab === id ? 'active' : '') + '" data-tab="' + id + '" title="' + label + '">' + ico + '<small>' + label + '</small></button>').join('');
    $$('#shop-tabs .tab').forEach(b => b.onclick = () => { click(); app.shopTab = b.dataset.tab; renderShop(); }); $$('#shop-tabs .tab-cv').forEach(cv => R.cannonGlyph(cv.getContext('2d'), 20, 20, 13));
    const intro = SHOP_TABS.find(t => t[0] === app.shopTab)[3]; $('#shop-intro').textContent = intro; $('#shop-intro').classList.toggle('hidden', !intro);
    const list = $('#shop-list'); list.innerHTML = '';
    const item = (cls, html) => { const el = document.createElement('div'); el.className = 'item ' + cls; el.innerHTML = html; list.append(el); return el; };
    const pips = (lvl, max) => '<div class="pips">' + Array.from({ length: max }, (_, i) => '<i class="' + (i < lvl ? 'on' : '') + '"></i>').join('') + '</div>';
    const buyBtn = (cost, can, label = 'Acheter') => '<button class="lego small buy" ' + (can ? '' : 'disabled') + '>' + label + ' ' + CB.COIN + ' ' + fmt(cost) + '</button>';
    const section = (title, sub) => { const h = document.createElement('h4'); h.className = 'shop-section'; h.innerHTML = esc(title) + (sub ? '<small>' + esc(sub) + '</small>' : ''); list.append(h); };
    $('#cannon-strip').classList.toggle('hidden', app.shopTab !== 'cannon'); document.body.classList.toggle('strip-on', app.screen === 'shop' && app.shopTab === 'cannon');
    if (app.shopTab === 'cannon') {
      if (!app.shopCannon || !CB.CANNONS[app.shopCannon]) app.shopCannon = p.cannon; const key = app.shopCannon, k = CB.CANNONS[key], owned = p.cannons.includes(key), equipped = p.cannon === key, unlocked = S.cannonUnlocked(p, key), world = k.world && CB.worldById(k.world);
      const mods = Object.entries(k.mods).map(([m, v]) => ({ rate: 'cadence', damage: 'dégâts', range: 'portée', gold: 'or', crit: 'critique' }[m] + ' ' + (v > 0 ? '+' : '') + Math.round(v * 100) + ' %')).concat(k.shots ? ['+' + k.shots + ' boulet par tir'] : []).concat(['🛡️ ' + CB.cannonArmor(key) + ' d’armure']).join(' · ');
      const head = item('cannon-head ' + (equipped ? 'equipped' : owned ? 'owned' : unlocked ? '' : 'locked'), '<div class="cannon-head-body"><h3>' + esc(k.name) + '</h3><span class="per">' + esc(mods) + '</span><span class="per">palier ' + ((k.tier || 0) + 1) + ' · améliorations ×' + CB.cannonBoost(key).power.toFixed(2).replace(/\.?0+$/, '') + ' · prix ×' + CB.cannonBoost(key).cost.toFixed(1).replace(/\.0$/, '') + '</span>' + (k.passive ? '<span class="per passive">🎉 ' + esc(k.passive) + '</span>' : '') + '</div>'
        + (equipped ? '<span class="state">ÉQUIPÉ</span><button class="lego small buy" disabled>✔ Équipé</button>' : owned ? '<span class="state">ACHETÉ</span><button class="lego small buy">Équiper</button>' : unlocked ? buyBtn(k.price, p.gold >= k.price, 'Acheter') : '<button class="lego small buy" disabled>🔒 Termine ' + esc(world ? world.short : '') + '</button>'));
      head.prepend(cannonCard(key)); head.title = k.desc;
      head.querySelector('.buy').onclick = () => { A.init(); if (owned) { p.cannon = key; A.sfx('click'); } else if (!S.buyCannon(p, key)) { A.sfx('nope'); return; } else A.sfx('buy'); persist(); renderShop(); };
      section('Améliorations · ' + k.name, owned ? 'Chaque canon garde ses propres niveaux. Plus son palier est haut, plus chaque niveau est fort… et cher.' : 'Achète ce canon pour l’améliorer.');
      for (const [uk, u] of Object.entries(CB.UPGRADES)) {
        const cu = S.cannonUp(p, key), lvl = cu[uk] || 0, maxed = lvl >= u.max, cost = maxed ? 0 : CB.upgradeCost(uk, lvl, key);
        const el = item('fun ' + (maxed ? 'owned' : ''), '<div class="ico">' + CB.icon(u.icon) + '</div><h3>' + u.name + '</h3><span class="per">' + esc(CB.upgradePer(uk, key)) + '</span>' + pips(lvl, u.max) + '<span class="lvl">' + lvl + ' / ' + u.max + '</span>' + (maxed ? '<span class="state">MAX</span><button class="lego small buy" disabled>★ MAX</button>' : owned ? buyBtn(cost, p.gold >= cost, '+1') : '<button class="lego small buy" disabled>🔒 ' + CB.COIN + ' ' + fmt(cost) + '</button>'));
        el.title = u.desc; if (!maxed && owned) el.querySelector('.buy').onclick = () => { A.init(); if (S.buyUpgrade(p, uk, key)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); };
      }
      section('Spécialités · ' + k.name, 'Des pouvoirs que seul ce canon possède.'); const cu = S.cannonUp(p, key);
      for (const u of CB.CANNON_UNIQUES[key] || []) { const lvl = cu.uniques[u.id] || 0, maxed = lvl >= u.max, cost = maxed ? 0 : u.prices[lvl];
        const el = item('fun unique special ' + (maxed ? 'owned' : lvl ? 'equipped' : ''), '<div class="ico">' + u.icon + '</div><h3>' + esc(u.name) + (lvl ? ' ' + CB.roman(lvl) : '') + '</h3><span class="per">' + esc(u.per(Math.max(1, lvl))) + '</span>' + pips(lvl, u.max) + '<span class="lvl">' + lvl + ' / ' + u.max + '</span>' + (maxed ? '<span class="state">MAX</span><button class="lego small buy" disabled>★ MAX</button>' : owned ? buyBtn(cost, p.gold >= cost, lvl ? 'Améliorer' : 'Acheter') : '<button class="lego small buy" disabled>🔒 ' + CB.COIN + ' ' + fmt(cost) + '</button>'));
        el.title = u.desc; if (!maxed && owned) el.querySelector('.buy').onclick = () => { A.init(); if (S.buyUnique(p, u.id, key)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); }; }
      section('Objets et pouvoirs', 'Ceux-là suivent ' + esc(pl0.name) + ', peu importe le canon.');
      for (const [ik, it] of Object.entries(CB.ITEMS)) { if (ik === 'trio') continue;   // le trio est dans l'onglet Équipe
        const ownedIt = !!(p.items && p.items[ik]), unlockedIt = S.itemUnlocked(p, ik) && (!it.needsAlly2 || p.ally2Bought);
        if (!unlockedIt) { const el = item('fun mystery', '<div class="ico">?</div><h3>???</h3><span class="per">' + esc(it.hint) + '</span><span class="lvl">POUVOIR SECRET</span><button class="lego small buy" disabled>🔒</button>'); el.title = 'Un pouvoir à débloquer en avançant dans le jeu.'; continue; }
        const el = item('fun unique ' + (ownedIt ? 'owned' : ''), '<div class="ico">' + CB.icon(it.icon) + '</div><h3>' + it.name + '</h3><span class="per">' + it.per + '</span><span class="lvl">OBJET UNIQUE</span>' + (ownedIt ? '<span class="state">À TOI</span><button class="lego small buy" disabled>✔ Acquis</button>' : buyBtn(it.price, p.gold >= it.price)));
        el.title = it.desc; if (!ownedIt) el.querySelector('.buy').onclick = () => { A.init(); if (S.buyItem(p, ik)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); }; }
      { const T = CB.TOWER, n = p.towers || 0, tUnlocked = S.towersUnlocked(p);   // tours de défense (après le monde 2) et niveau de l'attaque spéciale (niv. 9 et 20)
        if (!tUnlocked) { const el = item('fun mystery', '<div class="ico">?</div><h3>???</h3><span class="per">' + esc(T.hint) + '</span>' + pips(0, T.max) + '<span class="lvl">POUVOIR SECRET</span><button class="lego small buy" disabled>🔒</button>'); el.title = 'Un pouvoir à débloquer en avançant dans le jeu.'; }
        else { const maxed = n >= T.max, cost = maxed ? 0 : T.prices[n]; const el = item('fun unique ' + (maxed ? 'owned' : ''), '<div class="ico">' + T.icon + '</div><h3>' + T.name + (n ? ' ×' + n : '') + '</h3><span class="per">' + T.per + '</span>' + pips(n, T.max) + '<span class="lvl">' + n + ' / ' + T.max + '</span>' + (maxed ? '<span class="state">À TOI</span><button class="lego small buy" disabled>✔ Deux tours</button>' : buyBtn(cost, p.gold >= cost, n ? '2e tour' : 'Construire'))); el.title = T.desc; if (!maxed) el.querySelector('.buy').onclick = () => { A.init(); if (S.buyTower(p)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); }; }
        const pl = app.player, sp = CB.SPECIALS[pl.id], lvl = p.specialLevel || 1, nx = S.specialNext(p);
        if (sp) { const can = nx && p.level >= nx.minLevel && p.gold >= nx.price; const el = item('fun unique ' + (nx ? '' : 'owned'), '<div class="ico">' + pl.perk.icon + '</div><h3>' + esc(pl.perk.name) + '</h3><span class="per">attaque spéciale · niveau ' + lvl + '</span>' + pips(lvl, CB.SPECIAL_LEVELS.length) + '<span class="lvl">NIV. ' + lvl + ' / ' + CB.SPECIAL_LEVELS.length + '</span>' + (!nx ? '<span class="state">MAX</span><button class="lego small buy" disabled>★ MAX</button>' : p.level < nx.minLevel ? '<button class="lego small buy" disabled>🔒 Niveau ' + nx.minLevel + '</button>' : buyBtn(nx.price, can, 'Niv. ' + (lvl + 1)))); el.title = sp.desc + (nx ? ' — Niveau suivant : plus longue, plus forte, jauge plus courte.' : ''); if (nx && p.level >= nx.minLevel) el.querySelector('.buy').onclick = () => { A.init(); if (S.buySpecialLevel(p)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); }; }
        const H = CB.HOMING, hn = p.homing || 0;   // tête chercheuse (après le monde 3), 5 niveaux
        if (!S.homingUnlocked(p)) { const el = item('fun mystery', '<div class="ico">?</div><h3>???</h3><span class="per">' + esc(H.hint) + '</span>' + pips(0, H.max) + '<span class="lvl">POUVOIR SECRET</span><button class="lego small buy" disabled>🔒</button>'); el.title = 'Un pouvoir à débloquer en avançant dans le jeu.'; }
        else { const maxed = hn >= H.max, cost = maxed ? 0 : H.prices[hn]; const el = item('fun unique ' + (maxed ? 'owned' : hn ? 'equipped' : ''), '<div class="ico">' + H.icon + '</div><h3>' + H.name + (hn ? ' ' + CB.roman(hn) : '') + '</h3><span class="per">' + H.per + '</span>' + pips(hn, H.max) + '<span class="lvl">' + hn + ' / ' + H.max + '</span>' + (maxed ? '<span class="state">MAX</span><button class="lego small buy" disabled>★ MAX</button>' : buyBtn(cost, p.gold >= cost, hn ? '+1' : 'Acheter'))); el.title = H.desc; if (!maxed) el.querySelector('.buy').onclick = () => { A.init(); if (S.buyHoming(p)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); }; } }
      renderCannonStrip();
    }
    if (app.shopTab === 'balls') {   // on clique un boulet : le héros le tire en démonstration sur la fiche de gauche (même pas encore acheté)
      if (!app.shopBall || !CB.BALLS[app.shopBall]) app.shopBall = p.ball; if (!W.demo || !app.demoOn) startDemo(); app.demoOn = true;
      section('Boulets', 'Clique un boulet pour voir ' + esc(pl0.name) + ' le tirer. Les boulets à thème changent d’allure à chaque tir.');
      for (const [key, b] of Object.entries(CB.BALLS)) {
        const owned = p.balls.includes(key), equipped = p.ball === key, sel = app.shopBall === key;
        const el = item((equipped ? 'equipped' : owned ? 'owned' : '') + (b.premium ? ' premium' : '') + (sel ? ' selected' : ''), '<h3>' + b.name + (b.premium ? ' <span class="prem">★ PREMIUM</span>' : '') + '</h3><p>' + esc(b.desc) + '</p>' + (b.variants ? '<span class="per">' + b.variants.length + ' variantes : ' + esc(b.variants.map(v => CB.BALL_VARIANT_NAMES[v] || v).join(', ')) + '</span>' : '') + (equipped ? '<span class="state">ÉQUIPÉ</span><button class="lego small buy" disabled>Équipé</button>' : owned ? '<span class="state">ACHETÉ</span><button class="lego small buy">Équiper</button>' : buyBtn(b.price, p.gold >= b.price)));
        el.title = b.desc; el.prepend(ballCard(key)); el.onclick = () => { if (app.shopBall !== key) { click(); app.shopBall = key; W.demo = { balls: [], shots: 0, next: .05, recoil: 0 }; renderShop(); } };
        el.querySelector('.buy').onclick = ev => { ev.stopPropagation(); A.init(); app.shopBall = key; if (owned) { p.ball = key; A.sfx('click'); } else if (!S.buyBall(p, key)) { A.sfx('nope'); return; } else A.sfx('buy'); persist(); renderShop(); };
      }
    } else app.demoOn = false;
    if (app.shopTab === 'effects') for (const [key, e] of Object.entries(CB.EFFECTS)) {
      const lvl = p.effects[key] || 0, maxed = lvl >= e.max, cost = maxed ? 0 : CB.effectCost(key, lvl);
      const el = item('fun ' + (maxed ? 'owned' : lvl ? 'equipped' : ''), '<div class="ico">' + e.icon + '</div><h3>' + e.name + '</h3><span class="per">' + (lvl ? '🎲 ' + Math.round(lvl * CB.EFFECT_CHANCE * 100) + ' % des tirs' : e.desc) + '</span>' + pips(lvl, e.max) + '<span class="lvl">' + lvl + ' / ' + e.max + '</span>' + (maxed ? '<span class="state">MAX</span><button class="lego small buy" disabled>★ MAX</button>' : buyBtn(cost, p.gold >= cost, lvl ? '+1' : 'Acheter')));
      el.title = e.desc;
      if (!maxed) el.querySelector('.buy').onclick = () => { A.init(); if (S.buyEffect(p, key)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); };
    }
    if (app.shopTab === 'powers') { const Z = CB.SLOT2, me = app.player, mine = CB.SPECIALS[me.id];   // case vierge + un deuxième pouvoir parmi toute la famille
      item('fun unique owned', '<div class="ico">' + me.perk.icon + '</div><h3>' + esc(me.perk.name) + '</h3><span class="per">' + esc(mine ? mine.desc : '') + '</span><span class="lvl">TON POUVOIR</span><span class="state">À TOI</span><button class="lego small buy" disabled>Maj / X</button>');
      for (const [pid, Pz] of Object.entries(CB.POWERS)) { const n = S.powerLevel(p, pid);   // pouvoirs uniques (pirate, torpilles, parade, trois têtes, météores) : gagnés sur les boss des mondes cachés, remplacent (ou non) le pouvoir du personnage
        if (!S.powerOwned(p, pid)) { const el = item('fun mystery', '<div class="ico">?</div><h3>???</h3><span class="per">' + esc(Pz.hint) + '</span>' + pips(0, Pz.max) + '<span class="lvl">POUVOIR SECRET</span><button class="lego small buy" disabled>🔒</button>'); el.title = 'Un pouvoir à débloquer en avançant dans le jeu.'; continue; }
        const maxed = n >= Pz.max, cost = maxed ? 0 : Pz.prices[n], on = S.usedPower(p) === pid, per = pid === 'pirate' ? n + ' bateau' + (n > 1 ? 'x' : '') + ' · 15 s' : 'niveau ' + n + ' · ' + Pz.per;
        const el = item('fun unique pirate ' + (on ? 'equipped' : 'owned'), '<div class="ico">' + Pz.icon + '</div><h3>' + esc(Pz.name) + ' ' + CB.roman(n) + '</h3><span class="per">' + esc(per) + '</span>' + pips(n, Pz.max) + '<span class="lvl">' + n + ' / ' + Pz.max + '</span>' + (on ? '<span class="state">ÉQUIPÉ</span>' : '') + '<button class="lego small use">' + (on ? '↩ Reprendre ' + esc(me.perk.name) : '⚔ Utiliser à la place') + '</button>' + (maxed ? '<button class="lego small buy" disabled>★ MAX</button>' : buyBtn(cost, p.gold >= cost, pid === 'pirate' ? '+1 bateau' : '+1 niveau'))); el.title = Pz.desc;
        el.querySelector('.use').onclick = () => { A.init(); if (S.togglePower(p, pid)) { A.sfx('click'); persist(); renderShop(); } }; if (!maxed) el.querySelector('.buy').onclick = () => { A.init(); if (S.buyPowerLevel(p, pid)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); }; }
      const cur = p.slot2 && p.special2 && CB.playerById(p.special2); const slot = item('fun unique ' + (p.slot2 ? 'owned' : ''), '<div class="ico">' + (cur ? cur.perk.icon : Z.icon) + '</div><h3>' + (cur ? esc(cur.perk.name) : Z.name) + '</h3><span class="per">' + (cur ? 'deuxième pouvoir · touche C' : esc(Z.desc)) + '</span><span class="lvl">' + (p.slot2 ? (cur ? 'CASE REMPLIE' : 'CASE VIDE : CHOISIS CI-DESSOUS') : 'CASE VIERGE') + '</span>' + (p.slot2 ? '<span class="state">À TOI</span><button class="lego small buy" disabled>✔ Acquise</button>' : buyBtn(Z.price, p.gold >= Z.price, 'Acheter la case')));
      if (!p.slot2) slot.querySelector('.buy').onclick = () => { A.init(); if (S.buySlot2(p)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); };
      for (const m of CB.PLAYERS) { const sp = CB.SPECIALS[m.id]; if (!sp || m.id === me.id) continue; const on = p.special2 === m.id && p.slot2, unl = S.powerUnlockedBy(data, m.id), can = p.slot2 && unl && p.gold >= Z.powerPrice;   // débloqué en jouant avec ce membre jusqu'au bout du monde 1
        if (!unl) { const el = item('fun mystery', '<div class="ico">?</div><h3>' + esc(m.perk.name) + '</h3><span class="per">🔒 Joue avec ' + esc(m.name) + ' et termine le monde 1 avec ' + (m.id === 'josee' || m.id === 'marie' || m.id === 'jessica' || m.id === 'emily' || m.id === 'alexie' ? 'elle' : 'lui') + '.</span><span class="lvl">POUVOIR VERROUILLÉ</span><button class="lego small buy" disabled>🔒</button>'); el.title = 'Ce pouvoir appartient à ' + m.name + ' : il se mérite en jouant avec ' + m.name + '.'; continue; }
        const el = item(on ? 'equipped' : p.slot2 ? '' : 'mystery', '<div class="ico">' + m.perk.icon + '</div><h3>' + esc(m.perk.name) + '</h3><span class="per">' + esc(m.name) + ' · ' + esc(sp.desc) + '</span>' + (on ? '<span class="state">ÉQUIPÉ</span><button class="lego small buy" disabled>✔ Dans la case</button>' : p.slot2 ? buyBtn(Z.powerPrice, can, cur ? 'Remplacer' : 'Acheter') : '<button class="lego small buy" disabled>🔒 Case vierge d’abord</button>'));
        if (!on && p.slot2) el.querySelector('.buy').onclick = () => { A.init(); if (S.buyPower2(p, m.id, data)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); }; } }
    if (app.shopTab === 'team') {   // deux parties : mon équipe (les sièges), puis les coéquipiers à asseoir
      const seats = [1, 2, 3].filter(n => S.seatOpen(p, n)), nx = S.nextSeat(p);
      if (!app.teamSeat || !S.seatOpen(p, app.teamSeat)) app.teamSeat = seats.find(n => !S.seatOf(p, n)) || seats[0] || null;
      section('Mon équipe', 'Achète un siège, choisis-le, puis clique un membre de la famille pour l’y asseoir.');
      for (const n of seats) { const who = S.seatOf(p, n), m = who && CB.playerById(who), sel = app.teamSeat === n, SE = CB.SEATS[n - 1];
        const el = item('seat ' + (sel ? 'equipped' : who ? 'owned' : ''), '<h3>' + esc(SE.name) + '</h3><p>' + (m ? '<b>' + esc(m.name) + '</b> · ' + esc(m.perk.icon + ' ' + m.perk.name) : 'Siège vide : choisis quelqu’un ci-dessous') + '</p><span class="per">' + esc(SE.side) + (n === 3 ? ' (objet Trio de choc)' : ' · tire tout seul · dégâts ÷ 2') + '</span>' + (sel ? '<span class="state">CHOISI</span>' : '') + '<div class="seat-btns"><button class="lego small buy pick">' + (sel ? '✔ Ce siège' : 'Choisir ce siège') + '</button>' + (m ? '<button class="lego small buy free">Libérer</button>' : '') + '</div>');
        const h = m ? head(m.id, 72) : (() => { const d = document.createElement('div'); d.className = 'seat-empty'; d.textContent = '+'; return d; })(); h.className = (h.className || '') + ' head'; el.prepend(h);
        el.querySelector('.pick').onclick = () => { click(); app.teamSeat = n; renderShop(); }; const fr = el.querySelector('.free'); if (fr) fr.onclick = () => { click(); S.clearSeat(p, n); persist(); renderShop(); }; }
      if (nx) { const el = item('fun unique add-seat', '<div class="ico">➕</div><h3>' + esc(nx.name) + '</h3><span class="per">' + esc(CB.SEATS[nx.n - 1].side) + '</span><span class="lvl">AJOUTER UN SIÈGE</span>' + buyBtn(nx.price, p.gold >= nx.price, 'Acheter le siège')); el.title = 'Un siège de plus pour un membre de la famille.'; el.querySelector('.buy').onclick = () => { A.init(); if (S.buySeat(p)) { A.sfx('buy'); app.teamSeat = nx.n; persist(); renderShop(); } else A.sfx('nope'); }; }
      else item('fun unique owned add-seat', '<div class="ico">👥</div><h3>Équipe complète</h3><span class="per">trois sièges : gauche, droite et réserve</span><span class="lvl">TOUS LES SIÈGES</span><span class="state">À TOI</span><button class="lego small buy" disabled>✔ Complet</button>');
      { const fam = CB.FAMILIES[pl0.family], a1 = S.seatOf(p, 1), a2 = S.seatOf(p, 2), on = a1 && a2 && CB.playerById(a1).family === pl0.family && CB.playerById(a2).family === pl0.family;   // bonus famille : les deux coéquipiers de la même famille
        const el = item('fun unique ' + (on ? 'owned' : ''), '<div class="ico" style="background:' + fam.color + '">🛡️</div><h3>Bonus famille</h3><span class="per">' + esc(fam.name) + ' au complet (gauche et droite) : +' + Math.round(CB.FAMILY_BUFF.rate * 100) + ' % de cadence pour les trois</span><span class="lvl">' + (on ? 'ACTIF' : 'PAS ENCORE') + '</span><button class="lego small buy" disabled>' + (on ? '✔ Actif' : '2 de ' + esc(fam.name)) + '</button>'); el.title = 'Recrute deux membres de ta famille pour activer le bonus.'; }
      section('Coéquipiers', app.teamSeat ? 'Clique un membre pour l’asseoir sur ' + CB.SEATS[app.teamSeat - 1].name.toLowerCase() + '.' : 'Achète d’abord un siège.');
      for (const m of CB.PLAYERS) { if (m.id === p.id) continue; const at = [1, 2, 3].find(n => S.seatOf(p, n) === m.id), can = !!app.teamSeat && at !== app.teamSeat;
        const el = item('mate ' + (at ? 'equipped' : 'owned'), '<h3>' + esc(m.name) + '</h3><p>' + esc(CB.ROLES[m.role] || m.role) + ' · ' + esc(m.perk.icon + ' ' + m.perk.name) + '</p><span class="per">' + esc(CB.SPECIAL_FUN[m.id] || '') + '</span>' + (at ? '<span class="state">' + esc(CB.SEATS[at - 1].name.toUpperCase()) + '</span>' : '') + '<button class="lego small buy" ' + (can ? '' : 'disabled') + '>' + (at === app.teamSeat ? '✔ Assis ici' : app.teamSeat ? 'Asseoir ici' : '🔒 Un siège d’abord') + '</button>');
        const h = head(m.id, 72); h.className = 'head'; el.prepend(h); if (can) el.querySelector('.buy').onclick = () => { click(); if (S.setSeat(p, app.teamSeat, m.id)) { A.sfx('win'); persist(); renderShop(); } else A.sfx('nope'); }; }
    }
  }
  SHOW.shop = renderShop;

  // ---------- Montée de niveau : on choisit son évolution ----------
  function levelButton() { const b = $('#btn-level'), n = app.profile ? app.profile.points : 0; b.textContent = n > 0 ? '⭐ Évolution !' : '📊 Fiche'; b.classList.toggle('primary', n > 0); b.classList.toggle('pulse', n > 0); }
  // Fiche du personnage : héros + canon, niveau, XP et les six stats à barres (un point par niveau gagné, « + » pour l'augmenter).
  function showLevelUp() {
    const p = app.profile, dlg = $('#levelup'); if (!p) return;
    const pl = app.player, n = p.points || 0, tal = p.talents || {}, need = CB.xpForLevel(p.level), capped = p.level >= CB.MAX_LEVEL;
    $('#level-kicker').textContent = n > 0 ? 'NIVEAU SUPÉRIEUR !' : 'FICHE DU PERSONNAGE';
    $('#level-title').textContent = n > 0 ? 'CHOISIS TON ÉVOLUTION' : pl.name.toUpperCase() + ' ET SON CANON';
    dlg.classList.toggle('has-points', n > 0);
    const art = $('#sheet-art'), c = art.getContext('2d'); c.clearRect(0, 0, art.width, art.height);
    c.save(); c.globalAlpha = .12; c.fillStyle = '#ffe36b'; c.font = '900 300px Arial'; c.textAlign = 'center'; c.translate(210, 300); c.rotate(-.28); c.fillText('✦', 0, 0); c.restore();
    R.battleCannon(c, 210, 420, 172, pl.id, p.cannon, 0, 0, -.12);
    $('#sheet-name').textContent = pl.name;
    $('#sheet-level').textContent = 'NIVEAU ' + p.level + (capped ? ' · MAX' : '');
    $('#sheet-xp-text').textContent = capped ? 'NIVEAU MAXIMUM' : fmt(p.xp) + ' / ' + fmt(need) + ' XP';
    const bar = $('#sheet-xp'); bar.max = capped ? 1 : need; bar.value = capped ? 1 : Math.min(need, p.xp);
    $('#sheet-cannon').innerHTML = '<b>' + esc(CB.CANNONS[p.cannon]?.name || '') + '</b> · ' + esc(pl.perk.icon + ' ' + pl.perk.name);
    const list = $('#talent-list'); list.innerHTML = '';
    // Grosses tuiles sans statistiques : icône dans un carré arrondi, gros nombre, gros « + » ; la tuile et le « + » dépensent un point.
    for (const [key, tl] of Object.entries(CB.TALENTS)) {
      const lvl = tal[key] || 0, maxed = lvl >= CB.TALENT_MAX, can = n > 0 && !maxed, row = document.createElement('div');
      row.className = 'talent' + (maxed ? ' maxed' : '') + (can ? ' can' : ''); row.dataset.talent = key; row.style.setProperty('--c1', tl.bar[0]); row.style.setProperty('--c2', tl.bar[1]);
      row.innerHTML = '<button type="button" class="talent-tile" aria-label="' + esc(tl.name) + '"><span class="ico">' + CB.icon(tl.icon) + '</span><span class="nm">' + esc(tl.name) + '</span></button><b class="talent-num">' + (maxed ? 'MAX' : lvl) + '</b><button type="button" class="talent-plus" aria-label="Augmenter ' + esc(tl.name) + '">+</button>';
      const spend = () => { if (!can || !S.spendPoint(p, key)) return; A.sfx('levelup'); persist(); showLevelUp(); const r2 = list.querySelector('[data-talent="' + key + '"]'); if (r2) { r2.classList.add('pop'); (r2.querySelector('.talent-plus:not(:disabled)') || $('#btn-level-ok')).focus({ preventScroll: true }); } };
      const plus = row.querySelector('.talent-plus'); plus.disabled = !can; plus.onclick = spend; row.querySelector('.talent-tile').onclick = spend;
      list.append(row);
    }
    $('#level-intro').innerHTML = n > 0 ? '⭐ <b>' + n + '</b> point' + (n > 1 ? 's' : '') + ' à placer' : 'Monte de niveau pour gagner des points.';
    if (!dlg.open) dlg.showModal(); (n > 0 ? list.querySelector('.talent-plus:not(:disabled)') : $('#btn-level-ok'))?.focus({ preventScroll: true });
  }
  $('#levelup').onclose = () => { if (app.screen === 'map') { mapInfo(); levelButton(); } };
  $('#btn-level').onclick = () => { click(); showLevelUp(); };
  // ---------- La grande carte : tous les mondes ----------
  function showWorlds() {
    const p = app.profile, list = $('#worlds-list'); list.innerHTML = '';
    CB.WORLDS.forEach((w, i) => {
      const open = S.worldUnlocked(p, i), cleared = S.worldCleared(p, i), stars = S.worldStars(p, w.id), current = i === app.wi; if (w.hidden && !open) return;   // le monde caché n'apparaît qu'une fois trouvé
      const el = document.createElement('button'); el.type = 'button'; el.className = 'world-tile' + (open ? '' : ' locked') + (current ? ' current' : ''); el.disabled = !open;
      const cv = document.createElement('canvas'); cv.width = 320; cv.height = 180; R.background(cv.getContext('2d'), 320, 180, w, performance.now() / 1000); el.append(cv);
      el.insertAdjacentHTML('beforeend', '<div class="world-info"><b>' + w.icon + ' ' + (w.hidden ? 'Monde caché' : 'Monde ' + (i + 1)) + '</b><span>' + esc(w.name) + '</span>' + (open ? '<em>' + '★'.repeat(Math.min(3, Math.round(stars / 5))) + ' ' + stars + ' / 15 · ' + cleared + ' / ' + CB.WAVES_PER_WORLD + ' tableaux' + (i === 0 && p.portal ? ' · 🦖 le passé' : '') + '</em>' : '<em>🔒 Réussis ' + CB.WORLD_NEED + ' tableaux du monde ' + i + '</em>') + '</div>');
      if (open) el.onclick = () => { click(); app.wi = i; app.vi = 0; for (let v = CB.WAVES_PER_WORLD - 1; v >= 0; v--) if (S.waveUnlocked(p, i, v) && !S.stars(p, w.id, v)) { app.vi = v; break; } app.marker = { vi: app.vi, from: null, k: 1 }; p.last = { wi: i, vi: app.vi }; persist(); mapInfo(); $('#worlds').close(); };
      list.append(el);
    });
    $('#worlds').showModal(); (list.querySelector('.current') || list.querySelector('.world-tile:not(:disabled)'))?.focus({ preventScroll: true });
  }
  $('#btn-worlds').onclick = () => { click(); showWorlds(); };
  // ---------- Encyclopédie : pouvoirs, combos secrets, monstres ----------
  const CODEX_TABS = [['pouvoirs', '🃏', 'Pouvoirs'], ['combos', '⭐', 'Combos secrets'], ['monstres', '👾', 'Monstres']];
  function showCodex(tab) {
    app.codexTab = tab || app.codexTab || 'pouvoirs'; const p = app.profile, body = $('#codex-body'); body.innerHTML = '';
    $('#codex-tabs').innerHTML = CODEX_TABS.map(([id, ico, label]) => '<button type="button" class="tab ' + (app.codexTab === id ? 'active' : '') + '" data-tab="' + id + '">' + ico + '<small>' + label + '</small></button>').join('');
    $$('#codex-tabs .tab').forEach(b => b.onclick = () => { click(); showCodex(b.dataset.tab); });
    const tile = (cls, html) => { const el = document.createElement('div'); el.className = 'codex-card ' + cls; el.innerHTML = html; body.append(el); return el; };
    const cardIcon = key => { const cv = document.createElement('canvas'); cv.width = cv.height = 96; R.cardIcon(cv.getContext('2d'), key, 48, 48, 44); return cv; };
    if (app.codexTab === 'pouvoirs' || app.codexTab === 'combos') {
      const combos = app.codexTab === 'combos';
      body.insertAdjacentHTML('beforeend', '<p class="codex-intro">' + (combos ? 'Quand deux pouvoirs complémentaires atteignent le niveau 3, leur combo secret apparaît dans le tirage.' : 'À chaque niveau gagné pendant un tableau, choisis un pouvoir parmi trois cartes. Chaque pouvoir monte jusqu’au niveau 3.') + '</p>');
      for (const [key, c] of Object.entries(CB.CARDS)) { if (!!c.combo !== combos) continue; const el = tile(combos ? 'secret' : '', '<h3>' + esc(c.name) + '</h3><p>' + esc(c.desc) + '</p><em>' + (combos ? 'Recette : ' + c.needs.map(k => esc(CB.CARDS[k].name) + ' niv. ' + CB.comboNeed(k)).join(' + ') : c.max === Infinity ? 'Sans limite' : c.max === 1 ? 'Une seule fois' : 'Jusqu’au niveau ' + c.max) + '</em>'); el.prepend(cardIcon(key)); }
    } else {
      const groups = CB.WORLDS.map((w, i) => ({ name: w.icon + ' ' + w.name, types: [...new Set(w.enemies)], boss: w.boss, world: w.id })).concat([{ name: '🦖 Le passé : la Vallée des dinosaures', types: CB.DINOS }]);
      let known = 0, total = 0;
      for (const g of groups) {
        const sec = document.createElement('div'); sec.className = 'codex-group'; sec.innerHTML = '<h3>' + esc(g.name) + '</h3>'; body.append(sec);
        for (const type of g.types) { const d = CB.ENEMIES[type], seen = (p.seenBy || {})[type] > 0 && (p.killsBy || {})[type] > 0; total++; if (seen) known++;
          const el = document.createElement('div'); el.className = 'codex-card monster' + (seen ? '' : ' unknown'); const cv = document.createElement('canvas'); cv.width = cv.height = 96; R.enemyIcon(cv.getContext('2d'), type, 48, 50, 11); el.append(cv);
          el.insertAdjacentHTML('beforeend', seen ? '<h3>' + esc(d.name) + '</h3><p>' + esc(d.variant ? 'Variante : ' + d.variant.name : '') + '</p><em>❤️ ' + d.hp + ' · 💨 ' + d.speed + ' · 💥 ' + d.damage + ' · ' + CB.COIN + ' ' + d.gold + '</em>' : '<h3>???</h3><p>Pas encore abattu.</p><em>&nbsp;</em>'); sec.append(el); }
        if (g.boss) { const b = CB.BOSSES[g.boss], seen = S.stars(p, g.world, CB.WAVES_PER_WORLD - 1) > 0; total++; if (seen) known++; const el = document.createElement('div'); el.className = 'codex-card monster boss' + (seen ? '' : ' unknown'); const cv = document.createElement('canvas'); cv.width = cv.height = 96; R.bossIcon(cv.getContext('2d'), g.boss, 48, 54, 6); el.append(cv); el.insertAdjacentHTML('beforeend', seen ? '<h3>' + esc(b.name) + '</h3><p>Boss du monde</p><em>❤️ ' + b.hp + '</em>' : '<h3>???</h3><p>Boss encore inconnu.</p><em>&nbsp;</em>'); sec.append(el); }
      }
      body.insertAdjacentHTML('afterbegin', '<p class="codex-intro">Un monstre entre dans le cahier quand tu l’as rencontré <b>et</b> abattu une fois. <b>' + known + ' / ' + total + '</b> découverts.</p>');
    }
    if (!$('#codex').open) $('#codex').showModal();
  }
  $('#btn-codex').onclick = () => { click(); showCodex(); };
  $('#btn-debug').onclick = () => { click(); CB.Debug.open(CB.Debug.fromSlot(app.wi, app.vi)); };
  $('#btn-new-wave').onclick = () => { click(); CB.Debug.open(CB.Debug.blank(app.wi, app.vi)); };

  // ---------- Vague ----------
  const W = { canvas: null, ctx: null, held: false, queued: 0, paused: false, resultShown: false, t: 0, tutorial: 0, snapshot: null };
  const CARD_KEYS = ['Digit1', 'Digit2', 'Digit3'];
  // custom : tableau personnalisé (mode Debug). Sans argument, on garde celui du debug en cours s'il y en a un.
  function startWave(custom, carry = null) {
    if (custom === undefined) custom = app.debug ? app.custom : null;
    if (!custom && !S.waveUnlocked(app.profile, app.wi, app.vi)) { A.sfx('nope'); return; }
    A.init(); app.wave = new CB.Wave({ worldIndex: app.wi, waveIndex: app.vi, profile: app.profile, player: app.player, custom, carry });
    W.speed = 1; W.freeze = false;
    W.held = false; W.queued = 0; W.paused = false; W.resultShown = false; W.t = 0; W.tutorial = 4.5; W.dodge = 0; $('#dodge-btns').classList.toggle('hidden', !app.wave.canDodge); W.snapshot = { kills: 0, hp: app.wave.hp, bursts: 0, shots: 0, boss: false, shield: app.wave.shield, elites: 0, cards: 0, allyShots: 0 };
    show('wave');
  }
  SHOW.wave = () => {
    W.canvas = $('#wave-canvas'); W.ctx = W.canvas.getContext('2d');
    document.body.classList.toggle('debug', !!app.debug); $('#debug-panel').classList.toggle('hidden', !app.debug); if (app.debug) CB.Debug.render();
    badge($('#wave-badge'), app.player.id); $('#overlay-pause').classList.add('hidden'); $('#overlay-cards').classList.add('hidden'); $('#overlay-result').classList.add('hidden');
    const def = app.wave.def; $('#wave-tag').textContent = (def.type === 'boss' ? 'Boss · ' : def.type === 'endless' || def.type === 'swarm' ? '∞ · ' : 'Vague ' + (app.vi + 1) + ' · ') + def.name;
    const wt = $('#wave-text'), ct = app.wave.custom && typeof def.text === 'string' ? def.text.trim() : ''; wt.textContent = ct; wt.classList.toggle('hidden', !ct);   // seul le « Texte affiché » d'un tableau de l'éditeur s'affiche, dans un encadré
    app.refreshWaveTag = () => { const d2 = app.wave && app.wave.def; if (!d2) return; $('#wave-tag').textContent = (d2.type === 'boss' ? 'Boss · ' : d2.type === 'endless' || d2.type === 'swarm' ? '∞ · ' : 'Vague ' + (app.vi + 1) + ' · ') + d2.name; const c2 = app.wave.custom && typeof d2.text === 'string' ? d2.text.trim() : ''; wt.textContent = c2; wt.classList.toggle('hidden', !c2); };
    { const cv = $('#wave-obj-icon'), x = cv.getContext('2d'), w0 = app.wave.world; x.clearRect(0, 0, cv.width, cv.height); if (def.type === 'boss' && w0.boss) R.bossIcon(x, w0.boss, 36, 40, 5); else if (def.minigame) { x.font = '40px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(def.type === 'brigands' ? '🤠' : '🎯', 36, 38); } else R.enemyIcon(x, (def.roster && def.roster[0]) || (def.endless === 'dinos' ? CB.DINOS[0] : null) || w0.enemies[0] || 'bat', 36, 36, 9); }   // l'objectif, en gros : le monstre (ou le boss) du tableau
    ownedCards(); $('#wave-news').classList.add('hidden'); W.newsUntil = 0; W.newsIndex = 0; $('#btn-quit').textContent = def.type === 'endless' ? '🏁 Terminer la nuit' : def.type === 'swarm' ? '🏁 Terminer' : '🗺 Carte';
    const tut = $('#wave-tutorial'), touch = matchMedia('(pointer: coarse)').matches; tut.classList.remove('hidden');
    $('#wave-tutorial-text').innerHTML = (touch ? 'MAINTIENS LE DOIGT POUR <b>TIRER</b>' : 'MAINTIENS LE CLIC OU <kbd>ESPACE</kbd> POUR <b>TIRER</b>') + '<br><small>LE CANON EST LENT AU DÉBUT : AMÉLIORE LA CADENCE AU HANGAR</small>';
    let last = performance.now(); const loop = now => { if (app.screen !== 'wave') return; raf = requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; waveFrame(dt); }; raf = requestAnimationFrame(loop);
  };
  const aimTo = e => { const w = app.wave; if (!w) return; const p = R.toLogical(W.canvas, e.clientX, e.clientY); Object.assign(w.aim, CB.clampAim(p.x, p.y)); };
  // Sans le pouvoir « tir automatique », chaque pression = un seul boulet ; un clic pendant le rechargement est gardé en réserve un court instant.
  const SFX_BY_ID = { zachary: 'rocket', adam: 'shock', richard: 'boom', milo: 'zoom', emily: 'blizzard', edison: 'tornado', jessica: 'jackpot', jeremie: 'warp', josue: 'rally', marie: 'protect', eliott: 'ghost' };
  const specialSfx = id => A.sfx(SFX_BY_ID[id] || (id === 'richard' ? 'kaboom' : id === 'matthieu' ? 'snap' : id === 'pirate' ? 'cannon' : id === 'torpilles' ? 'rocket' : id === 'ballons' ? 'sparkle' : id === 'cerbere' ? 'ghost' : id === 'meteores' ? 'kaboom' : id === 'alexie' ? 'unicorn' : id === 'josee' ? 'prayer' : id === 'marie' ? 'levelup' : 'boss'));
  const useSpecial = () => { const w = app.wave; if (!w || W.paused || w.over) return; if (w.useSpecial()) { specialSfx(w.lastSpecial); $('#btn-special').classList.add('fired'); setTimeout(() => $('#btn-special').classList.remove('fired'), 400); } else A.sfx('nope'); };
  $('#btn-special').onpointerdown = e => { e.preventDefault(); A.init(); useSpecial(); };
  const useSpecial2 = () => { const w = app.wave; if (!w || W.paused || w.over) return; if (w.useSpecial2()) { specialSfx(w.lastSpecial); $('#btn-special2').classList.add('fired'); setTimeout(() => $('#btn-special2').classList.remove('fired'), 400); } };
  $('#btn-special2').onpointerdown = e => { e.preventDefault(); A.init(); useSpecial2(); };
  const shoot = () => { const w = app.wave; if (!w || W.paused) return false; if (w.fire()) { W.queued = 0; A.sfx('shoot'); if (w.lastEffect) A.sfx(w.lastEffect === 'eclair' ? 'bolt' : w.lastEffect === 'neige' ? 'freeze' : 'elite'); W.tutorial = Math.min(W.tutorial, 1.5); return true; } if (!w.over && !w.choice) W.queued = .25; return false; };
  const mash = () => { const w = app.wave; if (w && w.stun && !W.paused) { w.mash(); A.sfx(w.stun ? 'hit' : 'win'); return true; } return false; };
  $('#wave-canvas').onpointerdown = e => { if (W.paused || app.wave?.over || app.wave?.choice) return; A.init(); aimTo(e); e.currentTarget.setPointerCapture(e.pointerId); W.held = true; if (!mash()) shoot(); };
  $('#wave-canvas').onpointermove = e => { if (!W.paused) aimTo(e); };
  $('#wave-canvas').onpointerup = $('#wave-canvas').onpointercancel = () => { W.held = false; };
  $('#btn-fire').onpointerdown = e => { e.preventDefault(); A.init(); e.currentTarget.setPointerCapture(e.pointerId); W.held = true; if (!mash()) shoot(); };
  document.addEventListener('keydown', e => { if (app.screen === 'wave' && (e.code === 'Space' || e.code === 'Enter') && !e.repeat) mash(); });
  $('#btn-fire').onpointerup = $('#btn-fire').onpointercancel = () => { W.held = false; };
  $('#btn-pause').onclick = () => { A.init(); pause(true); };
  $('#btn-resume').onclick = () => { click(); pause(false); }; $('#btn-restart').onclick = () => { click(); startWave(); }; $('#btn-quit').onclick = () => { click(); const w = app.wave; if (w && w.openEnded && !w.over) { w.finish(true, w.swarm ? 'nuee' : 'nuit'); pause(false); } else show('map'); };
  window.addEventListener('blur', () => { W.held = false; if (app.screen === 'wave' && app.wave && !app.wave.over && !app.wave.choice) pause(true); });
  function pause(on) {
    const w = app.wave; if (!w || w.over) return; W.paused = on; W.held = false; $('#overlay-pause').classList.toggle('hidden', !on);
    if (on) { pauseTeam(w); $('#btn-cheats-pause').classList.toggle('hidden', app.player.id !== 'matthieu'); $('#pause-world').textContent = (CB.WORLDS[app.wi].hidden ? '🏴‍☠️ Monde caché' : 'Monde ' + (app.wi + 1)) + ' · ' + CB.WORLDS[app.wi].name; $('#pause-pct').textContent = S.completion(app.profile) + ' %'; $('#pause-stats').innerHTML = '<div><b>' + w.kills + '</b>abattus</div><div><b>' + CB.COIN + ' ' + fmt(w.gold) + '</b>cette vague</div><div><b>' + Math.round(w.hp) + ' / ' + w.maxHp + '</b>points de vie</div><div><b>' + Math.round(w.armor) + ' / ' + w.maxArmor + '</b>armure</div><div><b>' + Math.round(100 * w.hits / Math.max(1, w.shots)) + ' %</b>précision</div>'; $('#btn-resume').focus(); }
  }
  function showCards() {
    const w = app.wave, list = $('#card-list'); list.innerHTML = ''; A.sfx('card'); $('#cards-kicker').textContent = 'NIVEAU ' + w.runLevel + ' !';
    W.held = false; W.queued = 0; W.cardsAt = W.t; $('#overlay-cards .cards-box').classList.add('locked'); const lock = $('#cards-lock'); lock.style.setProperty('--d', CB.CARD_LOCK + 's'); lock.classList.remove('run'); void lock.offsetWidth; lock.classList.add('run');   // 3 s pour regarder : rien ne se clique, on ne tire pas
    w.choice.forEach((key, i) => { const c = CB.CARDS[key], el = document.createElement('button'), kind = c.combo ? 'secret' : c.surprise ? 'surprise' : c.max === 1 ? 'unique' : 'power', face = key === 'renfort' && w.guestPick ? CB.playerById(w.guestPick) : null; el.className = 'card ' + kind + (face ? ' gold' : ''); el.style.position = 'relative'; const lvl = w.cardLevel(key) + 1, single = c.max === 1 || c.surprise;   // bleu = pouvoir, violet = unique, doré = combo, rose = surprise ; or scintillant = un membre de la famille vient aider
      el.innerHTML = '<kbd>' + (i + 1) + '</kbd>' + (c.combo ? '<span class="ribbon">COMBO SECRET</span>' : c.surprise ? '<span class="ribbon surprise">SURPRISE</span>' : face ? '<span class="ribbon gold">FAMILLE</span>' : c.max === 1 ? '<span class="ribbon unique">UNIQUE</span>' : '') + '<canvas class="ico" width="176" height="176"></canvas><b>' + c.name + (single ? '' : ' ' + CB.roman(lvl)) + '</b><em>' + (face ? face.name.toUpperCase() + ' ARRIVE !' : single ? '' : lvl === 1 ? 'Nouveau pouvoir' : lvl >= c.max ? 'Niveau maximum' : 'Amélioration') + '</em><small>' + c.desc + '</small>' + (face ? '<i class="sparkles" aria-hidden="true"></i>' : '');
      const cv = el.querySelector('canvas'); if (face && F.has(face.id)) { const hc = head(face.id, 176); hc.className = 'ico face'; cv.replaceWith(hc); } else R.cardIcon(cv.getContext('2d'), key, 88, 88, 80); el.onclick = () => pick(i); list.append(el); });
    $('#overlay-cards').classList.remove('hidden');
    function pick(i) { if (!w.choice || W.t - W.cardsAt < CB.CARD_LOCK) return; w.pickCard(i); A.sfx('levelup'); $('#overlay-cards').classList.add('hidden'); ownedCards(); }
  }
  function ownedCards() { const n = {}; for (const k of app.wave.cards) n[k] = (n[k] || 0) + 1; const box = $('#wave-cards'); box.innerHTML = ''; for (const [k, c] of Object.entries(n)) { const sp = document.createElement('span'); sp.title = CB.CARDS[k].name + ' ' + CB.roman(c) + ' : ' + CB.CARDS[k].desc; const cv = document.createElement('canvas'); cv.width = cv.height = 64; R.cardIcon(cv.getContext('2d'), k, 32, 32, 30); sp.append(cv); if (c > 1) sp.insertAdjacentHTML('beforeend', '<b>' + CB.roman(c) + '</b>'); box.append(sp); } }
  function hud() {
    const w = app.wave, d = w.def; goldPill($('#wave-gold'), app.profile.gold + w.gold);
    const endless = d.type === 'endless' || d.type === 'swarm'; $('#wave-bar').parentElement.classList.toggle('hidden', endless); $('#wave-sub').classList.toggle('hidden', endless);
    $('#wave-bar').style.width = Math.round(w.progress * 100) + '%';
    $('#wave-sub').textContent = w.brigands ? '🤠 ' + w.brigandsHit + ' brigand' + (w.brigandsHit > 1 ? 's' : '') + ' · round ' + Math.min(w.round, w.brigands.rounds) + ' / ' + w.brigands.rounds + (w.civilsHit ? ' · ' + w.civilsHit + ' civil' + (w.civilsHit > 1 ? 's' : '') + ' touché' + (w.civilsHit > 1 ? 's' : '') : '') : w.cibles ? w.targetsHit + ' / ' + w.cibles.count + ' cibles' + (w.targetsMissed ? ' · ' + w.targetsMissed + ' ratée' + (w.targetsMissed > 1 ? 's' : '') : '') : d.type === 'sink' ? w.shipsSunk + ' / ' + d.goal + ' bateaux coulés' : d.type === 'kill' || d.type === 'killTimed' ? w.kills + ' / ' + d.goal + ' abattus' : d.type === 'boss' ? (w.boss ? 'Phase ' + (w.boss.act + 1) + ' / 3 · ' + Math.max(0, Math.round(w.boss.hp)) + ' PV' + (w.boss.def.next ? ' · à 20 % le vrai boss arrive' : '') + ' · boîtes ? = niveau · ◀ ▶ esquive' + (w.boss.def.weak ? ' · 👑 vise la couronne !' : '') : 'Le boss arrive…') : d.type === 'endless' ? w.kills + ' abattus · ' + w.seen.length + ' / ' + CB.ENDLESS.roster.length + ' monstres · 🎁 ' + w.discoveries : w.kills + ' abattus';
    if (w.news.length > W.newsIndex && W.t >= W.newsUntil) { const n = w.news[W.newsIndex++]; const el = $('#wave-news'); el.querySelector('.tut-head').textContent = n.kind === 'discovery' ? 'DÉCOUVERTE' : n.kind === 'boss' ? 'BOSS' : 'NOUVEAU'; el.querySelector('.tut-body').textContent = n.text; el.classList.remove('hidden'); el.classList.toggle('gold', n.kind === 'discovery'); W.newsUntil = W.t + 2.6; A.sfx(n.kind === 'discovery' ? 'levelup' : n.kind === 'boss' ? 'boss' : 'elite'); } else if (W.t >= W.newsUntil) $('#wave-news').classList.add('hidden');
    const sb = $('#btn-special'); if (w.special) { sb.classList.remove('hidden'); const act = w.specialLeft > 0 ? w.specialLeft / (w.special.seconds || 15) : 0; sb.style.setProperty('--k', Math.round((act || w.charge) * 100) + '%'); sb.classList.toggle('active', act > 0); sb.classList.toggle('ready', w.specialReady); sb.querySelector('.ico').textContent = w.special.icon; sb.title = w.special.name + ' : ' + w.special.desc; } else sb.classList.add('hidden');
    const sb2 = $('#btn-special2'); if (w.special2) { sb2.classList.remove('hidden'); const act2 = w.special2Left > 0 ? w.special2Left / (w.special2.seconds || 15) : 0; sb2.style.setProperty('--k', Math.round((act2 || w.charge2) * 100) + '%'); sb2.classList.toggle('active', act2 > 0); sb2.classList.toggle('ready', w.special2Ready); sb2.querySelector('.ico').textContent = w.special2.icon; sb2.title = w.special2.name + ' : ' + w.special2.desc; } else sb2.classList.add('hidden');
    const combo = $('#wave-combo'); combo.textContent = 'x' + w.combo; combo.classList.toggle('hot', w.combo >= 5);
    const hp = $('#wave-hp'), ratio = w.hp / w.maxHp; hp.style.height = Math.round(100 * ratio) + '%'; hp.classList.toggle('low', ratio <= .25); hp.classList.toggle('mid', ratio > .25 && ratio <= .55); $('#wave-hp-text').textContent = Math.ceil(w.hp) + ' / ' + w.maxHp;   // bleu, puis jaune vers la moitié, rouge quand c'est vraiment bas
    const ar = $('#wave-armor'), aratio = w.maxArmor ? w.armor / w.maxArmor : 0; ar.style.height = Math.round(100 * aratio) + '%'; ar.classList.toggle('hit', w.armorHit > 0); $('#wave-armor-text').textContent = Math.ceil(w.armor) + ' / ' + w.maxArmor; $('#wave-shield-text').textContent = w.shield ? '🛡 ' + w.shield : ''; $('#wave-shield-text').classList.toggle('hidden', !w.shield);
    $('#wave-level-n').textContent = 'NIV. ' + w.runLevel; $('#wave-level-bar').style.width = Math.round(w.runProgress * 100) + '%';
    $('#wave-timer').textContent = w.timeLeft != null ? '⏱ ' + Math.ceil(w.timeLeft) + ' s' : '⏱ ' + Math.floor(w.time) + ' s';
    { const ot = $('#wave-obj-timer'), left = w.timeLeft; ot.classList.toggle('hidden', left == null); if (left != null) { const s = Math.ceil(left); ot.textContent = (s >= 60 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : s + ' s'); ot.classList.toggle('last', s <= 10); ot.classList.toggle('lose', d.type === 'killTimed'); } }   // tableaux à temps : le chrono en haut à gauche, en gros dans les dernières secondes
  }
  function waveFrame(dt) {
    const w = app.wave; if (!w) return; W.t += dt; I.poll();
    if (!app.liteAuto && (st.fx || 'auto') === 'auto') { W.ft = W.ft == null ? dt : W.ft * .94 + dt * .06; W.ftN = (W.ftN || 0) + 1; if (W.ftN > 120 && W.ft > 1 / 38) { app.liteAuto = true; applyFx(); w.texts.push({ text: '✨ EFFETS ALLÉGÉS', x: 0, y: 11, z: 14, age: 0, color: '#9fe0ff' }); } }   /* ça rame (moins de 38 images/s en moyenne) : on passe aux effets légers pour toute la session */ if (w.countdown) { if (w.countdown.t === 0 && !w.countdown.sfx) { w.countdown.sfx = true; A.sfx(w.countdown.n === 'win' ? 'win' : 'card'); } w.countdown.t += dt; }   // 3… 2… 1… GAGNÉ !
    { const want = w.over ? (w.won ? 'menu' : waveTrack()) : waveTrack(); if (M.key !== want) M.play(want); }
    if (!W.paused && !W.freeze && !w.over && !w.choice) {
      const g = I.gamepad, kx = (I.keys.has('ArrowRight') || I.keys.has('KeyD') ? 1 : 0) - (I.keys.has('ArrowLeft') || I.keys.has('KeyA') ? 1 : 0), ky = (I.keys.has('ArrowDown') || I.keys.has('KeyS') ? 1 : 0) - (I.keys.has('ArrowUp') || I.keys.has('KeyW') ? 1 : 0);
      if (w.canDodge) { const dx = Math.max(-1, Math.min(1, kx + g.ax + (W.dodge || 0))); if (dx) w.move(dx, dt); Object.assign(w.aim, CB.clampAim(w.aim.x, w.aim.y + (ky + g.ay) * CB.VIEW.f * .6 * dt)); }   // monde des pirates : ◀ ▶ déplacent le canon, pas le viseur
      else Object.assign(w.aim, CB.clampAim(w.aim.x + (kx + g.ax) * CB.VIEW.f * .8 * dt, w.aim.y + (ky + g.ay) * CB.VIEW.f * .6 * dt));
      if (w.stun) { if (g.fire && !W.gFire) mash(); W.gFire = g.fire; } else W.gFire = g.fire;
      if (W.held || I.keys.has('Space') || I.keys.has('Enter') || g.fire) shoot();
      if (I.consume('ShiftLeft') || I.consume('ShiftRight') || I.consume('KeyX') || g.specialPressed) useSpecial();
      if (I.consume('KeyC') || g.special2Pressed) useSpecial2();
      else if (W.queued > 0) { W.queued -= dt; if (w.cooldown <= 0) shoot(); }
      if (I.consume('Escape') || I.consume('KeyP') || g.pause) { pause(true); I.endFrame(); return; }
      const snap = W.snapshot; const sp = W.speed || 1, steps = Math.max(1, Math.ceil(sp)); for (let k = 0; k < steps; k++) w.update(dt * sp / steps);
      if (w.kills > snap.kills) A.sfx(w.elitesKilled > snap.elites ? 'elite' : 'kill'); if (w.hp < snap.hp) A.sfx('hurt'); else if (w.armor < (snap.armor == null ? w.armor : snap.armor)) A.sfx('hit'); if (w.shield < snap.shield) A.sfx('shield'); if ((w.impacts || 0) > (snap.impacts || 0)) { A.sfx(w.lastImpact || 'crit'); snap.impacts = w.impacts; } if (w.confetti && w.confetti.bursts > (snap.confetti || 0)) { A.sfx('sparkle'); snap.confetti = w.confetti.bursts; } if ((w.wallHits || 0) > (snap.wallHits || 0)) { A.sfx('shield'); snap.wallHits = w.wallHits; } if (w.plane && !snap.plane) A.sfx('plane'); snap.plane = !!w.plane; if (w.bossSpawned && !snap.boss) A.sfx('boss');
      if (w.bursts.some(b => b.age === 0 && b.kind === 'crit')) A.sfx('crit');
      if ((w.kabooms || 0) > (snap.kabooms || 0)) { A.sfx('kaboom'); snap.kabooms = w.kabooms; }
      const helperShots = (w.ally ? w.ally.shots : 0) + (w.ally2 ? w.ally2.shots : 0) + (w.guest ? w.guest.shots : 0) + (w.towers || []).reduce((n, tw) => n + tw.shots, 0); if (helperShots > snap.allyShots) A.sfx('shoot'); if (w.sphere && w.sphere.hits > (snap.sphereHits || 0)) A.sfx('crit'); snap.sphereHits = w.sphere ? w.sphere.hits : 0;
      if (w.outro && !snap.outro) { A.sfx('roar'); snap.outro = true; }
      if (w.guest && !snap.guest) A.sfx('rally'); snap.guest = !!w.guest;
      if (w.unicorn && w.unicorn.shots > (snap.unicornShots || 0)) { A.sfx('sparkle'); snap.unicornShots = w.unicorn.shots; } else if (!w.unicorn) snap.unicornShots = 0;
      const angelShots = w.angels ? w.angels.reduce((n, a) => n + a.shots, 0) : 0; if (angelShots > (snap.angelShots || 0)) A.sfx('holy'); snap.angelShots = angelShots;
      if ((w.pirateShots || 0) > (snap.pirateShots || 0)) A.sfx('cannon'); snap.pirateShots = w.pirateShots || 0; if ((w.paradeShots || 0) > (snap.paradeShots || 0)) A.sfx('shoot'); snap.paradeShots = w.paradeShots || 0; if ((w.meteorHits || 0) > (snap.meteorHits || 0)) A.sfx('boom'); snap.meteorHits = w.meteorHits || 0; if ((w.shipsBroken || 0) > (snap.shipsBroken || 0)) A.sfx('crit'); snap.shipsBroken = w.shipsBroken || 0; if ((w.boatHits || 0) > (snap.boatHits || 0)) A.sfx('crit'); snap.boatHits = w.boatHits || 0; if ((w.splashes || 0) > (snap.splashes || 0)) A.sfx('splash'); snap.splashes = w.splashes || 0; if ((w.bites || 0) > (snap.bites || 0)) A.sfx('bite'); snap.bites = w.bites || 0;
      const helperSpecials = (w.ally ? w.ally.specials : 0) + (w.ally2 ? w.ally2.specials : 0); if (helperSpecials > (snap.allySpecials || 0)) { specialSfx(w.lastAllySpecial); snap.allySpecials = helperSpecials; }
      if (w.stun && !snap.stun) A.sfx(w.stun.kind === 'shock' ? 'shock' : 'freeze'); snap.stun = !!w.stun; if (w.poison > (snap.poison || 0)) A.sfx('poison'); snap.poison = w.poison; if (w.dark > (snap.dark || 0)) A.sfx('dark'); snap.dark = w.dark; if (w.eventsSeen > (snap.events || 0)) A.sfx('elite'); snap.events = w.eventsSeen;
      Object.assign(snap, { kills: w.kills, hp: w.hp, armor: w.armor, boss: w.bossSpawned, shield: w.shield, elites: w.elitesKilled, allyShots: helperShots });
      W.tutorial -= dt; if (W.tutorial <= 0) $('#wave-tutorial').classList.add('hidden');
    } else if (W.paused) { if (I.consume('Escape') || I.consume('KeyP') || I.gamepad.pause) pause(false); }
    else if (w.choice) { const locked = W.t - (W.cardsAt || 0) < CB.CARD_LOCK; $('#overlay-cards .cards-box').classList.toggle('locked', locked); if (!locked) { CARD_KEYS.forEach((code, i) => { if (I.consume(code)) $$('#card-list .card')[i]?.click(); }); if (I.consume('Enter')) $$('#card-list .card')[0]?.click(); } }
    if (w.choice && $('#overlay-cards').classList.contains('hidden')) showCards();
    I.endFrame();
    const view = R.fitWave(W.canvas); R.scene(W.ctx, w, { playerId: app.player.id, cannon: app.profile.cannon, ball: app.profile.ball, t: W.t, view }); hud();
    if (app.debug) CB.Debug.tick();
    if (w.over && !W.resultShown) { W.resultShown = true; W.held = false; if (w.reason === 'portail' && !app.debug) { A.sfx('win'); setTimeout(travelPortal, 400); } else { if (!app.debug) setTimeout(showResult, 1100); A.sfx(w.won ? 'win' : 'lose'); } }
  }
  // Le portail nous emporte tout de suite dans le passé : on encaisse la nuit, puis on repart avec ses cartes, son niveau et sa vie.
  function travelPortal() {
    const w = app.wave; if (!w || app.screen !== 'wave') return; CB.claim(app.profile, w); persist();
    const carry = { cards: w.cards.slice(), runLevel: w.runLevel, runXp: w.runXp, hpRatio: w.hp / w.maxHp, armorRatio: w.maxArmor ? w.armor / w.maxArmor : 1 };
    app.vi = CB.WORLDS[app.wi].secret.vi; app.profile.last = { wi: app.wi, vi: app.vi }; persist(); startWave(null, carry);   // le tableau secret de ce monde (1-6 le passé, N-6 l'avant-goût du monde caché)
  }
  function showResult() {
    const w = app.wave; if (!w || app.screen !== 'wave') return;
    const nxt = w.won && !w.def.secret && !w.def.minigame && app.vi + 1 < CB.WAVES_PER_WORLD ? { wi: app.wi, vi: app.vi + 1 } : null, openBefore = nxt ? S.waveUnlocked(app.profile, nxt.wi, nxt.vi) : true, firstWin = w.won && !S.stars(app.profile, w.world.id, app.vi);   // première victoire : un seul bouton, Continuer
    const r = CB.claim(app.profile, w); persist(); if (!r) return;
    app.afterWin = w.won && w.stars > 0 ? { wi: app.wi, vi: app.vi, next: nxt && !openBefore && S.waveUnlocked(app.profile, nxt.wi, nxt.vi) ? nxt.vi : null } : null;   // plus de bouton « Suivant » : on revient sur la carte, fête sur le tableau battu, puis le nouveau tableau apparaît
    if (r.levels) A.sfx('levelup'); // la fiche d'évolution s'ouvre toute seule juste après ; pas de bandeaux de texte (jeu d'enfant)
    const panel = $('#result-panel');
    const M = w.stars ? CB.MEDALS[Math.min(w.stars, CB.MEDALS.length) - 1] : null, medal = w.cibles || w.brigands ? (M ? 'MÉDAILLE ' + (/^[AO]/.test(M[0]) ? 'D’' : 'DE ') + M[0].toUpperCase() + ' ' + M[1] : 'PAS DE MÉDAILLE… ENCORE !') : null;
    panel.innerHTML = '<div class="kicker">' + (medal ? medal : w.swarm ? 'LA NUÉE SE DISPERSE' : w.endless ? (w.def.secret ? 'RETOUR DU PASSÉ' : 'LA NUIT SE TERMINE') : w.won ? 'TABLEAU TERMINÉ' : w.reason === 'temps' ? 'TEMPS ÉCOULÉ' : 'CANON DÉTRUIT') + '</div><h2 class="' + (w.won ? '' : 'lost') + '">' + (w.openEnded ? (w.stars ? 'Bien joué !' : 'Tiens plus longtemps !') : w.won ? (w.stars >= Math.max(3, w.medalMax || 0) ? '★ Parfait !' : 'Bravo !') : 'On recommence plus fort !') + '</h2>'
      + '<div class="result-stars">' + Array.from({ length: Math.max(3, w.medalMax || 0) }, (_, i) => i + 1).map(i => '<span class="' + (i <= w.stars ? 'on' : '') + '">★</span>').join('') + '</div>'
      + '<div class="result-rows"><div><span>Ennemis abattus</span><b>' + w.kills + '</b></div><div><span>Meilleur combo</span><b>x' + w.bestCombo + '</b></div><div><span>Niveau atteint</span><b>' + w.runLevel + '</b></div><div class="gold"><span>Or gagné</span><b>' + CB.COIN + ' +' + fmt(r.gold) + (w.bonusGold ? ' <small>(bonus ' + w.bonusGold + ')</small>' : '') + '</b></div><div><span>Expérience</span><b>+' + fmt(r.xp) + ' XP</b></div><div><span>Précision</span><b>' + Math.round(100 * w.hits / Math.max(1, w.shots)) + ' %</b></div><div><span>Niveau</span><b>' + app.profile.level + '</b></div></div>'
      + (w.cibles ? '<div class="result-rows"><div><span>🎯 Cibles détruites</span><b>' + w.targetsHit + ' / ' + w.cibles.count + ' (' + Math.round(100 * w.targetsHit / w.cibles.count) + ' %)</b></div></div>' : '')
      + (w.brigands ? '<div class="result-rows"><div><span>🤠 Brigands attrapés</span><b>' + w.brigandsHit + ' / ' + w.brigands.rounds + '</b></div><div><span>🙍 Civils touchés</span><b>' + w.civilsHit + '</b></div></div>' : '')
      + (w.openEnded ? '<div class="result-rows"><div><span>⏱ Temps</span><b>' + Math.floor(w.time / 60) + ' min ' + (Math.round(w.time) % 60) + ' s' + (app.profile.bestTime === Math.round(w.time) ? ' 🏆' : '') + '</b></div></div>' : '')
      + (w.powerWon ? '<div class="result-rows"><div><span>' + CB.POWERS[w.powerWon].icon + ' Nouveau pouvoir unique</span><b>' + esc(CB.POWERS[w.powerWon].name) + ' · au hangar</b></div></div>' : '') + (w.worldWon ? '<div class="result-rows"><div><span>' + (CB.worldById(w.worldWon).icon || '🗺') + ' Monde caché</span><b>' + esc(CB.worldById(w.worldWon).name) + ' : un chemin s’ouvre sur la carte !</b></div></div>' : '') + (w.boatSecret ? '<div class="result-rows"><div><span>⛵ Secret</span><b>Un nouveau tableau sur la carte !</b></div></div>' : '')
      + '<div class="result-buttons">' + (firstWin ? '' : '<button class="lego ' + (w.won ? '' : 'primary') + '" id="res-retry">↻ Rejouer</button>') + '<button class="lego ' + (w.won ? 'primary' : '') + '" id="res-map"><b class="btn-badge">A</b> ' + (firstWin ? '▶ Continuer' : '🗺 Retour à la carte') + '</button></div>';
    $('#overlay-result').classList.remove('hidden');
    $('#res-map').onclick = () => { click(); show('map'); }; if ($('#res-retry')) $('#res-retry').onclick = () => { click(); app.afterWin = null; startWave(); };
    (w.won || !$('#res-retry') ? $('#res-map') : $('#res-retry')).focus();
    if (r.levels) setTimeout(showLevelUp, 600);
  }

  // ---------- Clavier dans les menus ----------
  window.addEventListener('keydown', e => {
    if ((e.target.matches && e.target.matches('input, textarea, select')) || $('#help').open || $('#levelup').open || $('#worlds').open || $('#codex').open || $('#settings').open) return;
    if (app.screen === 'title' && e.code === 'Enter') { click(); data.current && data.profiles[data.current] ? choose(data.current) : show('characters'); }
    else if (app.screen === 'characters') { const list = charList(), cols = Math.max(1, Math.floor($('#char-grid').clientWidth / 128)); const move = d => { app.charIndex = (app.charIndex + d + list.length) % list.length; A.sfx('click'); renderCharacters(); }; if (e.code === 'ArrowRight') move(1); else if (e.code === 'ArrowLeft') move(-1); else if (e.code === 'ArrowDown') move(cols); else if (e.code === 'ArrowUp') move(-cols); else if (e.code === 'Enter') { click(); choose(list[app.charIndex].id); } else if (e.code === 'Escape') back(); else if (e.code === 'PageUp' || e.code === 'PageDown') { const i = FAM_TABS.findIndex(t => t[0] === app.family); app.family = FAM_TABS[(i + (e.code === 'PageDown' ? 1 : -1) + FAM_TABS.length) % FAM_TABS.length][0]; app.charIndex = 0; renderCharacters(); } else return; e.preventDefault(); }
    else if (app.screen === 'map') { const dir = { ArrowRight: [1, 0], KeyD: [1, 0], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] }[e.code]; if (dir) { if (app.marker.k >= 1) mapMove(dir[0], dir[1]); } else if (e.code === 'PageUp' || e.code === 'KeyQ') changeWorld(-1); else if (e.code === 'PageDown' || e.code === 'KeyE') changeWorld(1); else if (e.code === 'Enter') { click(); if (app.at) enterAt(); else startWave(); } else if (e.code === 'Escape') back(); else if (e.code === 'KeyH') { click(); show('shop'); } else return; e.preventDefault(); }
    else if (app.screen === 'shop') { if (e.code === 'Escape') back(); else if (e.code === 'PageUp' || e.code === 'PageDown' || e.code === 'KeyQ' || e.code === 'KeyE') { const i = SHOP_TABS.findIndex(t => t[0] === app.shopTab); app.shopTab = SHOP_TABS[(i + (e.code === 'PageDown' || e.code === 'KeyE' ? 1 : -1) + SHOP_TABS.length) % SHOP_TABS.length][0]; click(); renderShop(); } }
  });
  I.onButton = code => { if (app.screen !== 'wave') window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); };
  Object.assign(app, { show, choose, startWave, pause, data, persist, W });
  show('title');
})(window.CB);
