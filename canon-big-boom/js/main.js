// Écrans et boucle de jeu : titre animé, personnages, carte du monde, hangar, vague (HUD, cartes, pause, résultats).
(async function (CB) {
  'use strict';
  await window.FamilyHeads.ready;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const S = CB.Save, R = CB.Render, A = CB.Audio, I = CB.Input, F = window.FamilyHeads;
  const data = S.load(localStorage), persist = () => S.store(data, localStorage);
  A.enabled = data.settings.sound !== false;
  const app = CB.app = { screen: 'title', player: null, profile: null, wi: 0, vi: 0, wave: null, marker: null, family: 'all', shopTab: 'upgrades', charIndex: 0 };
  const fmt = n => Math.round(n).toLocaleString('fr-CA');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  $('#version').textContent = 'v' + CB.VERSION;
  const click = () => { A.init(); A.sfx('click'); };
  function head(id, size = 64, view = 'front') { const c = document.createElement('canvas'); c.width = size; c.height = size * 1.06; if (!F.draw(c.getContext('2d'), id, view, 0, 0, c.width, c.height)) { const x = c.getContext('2d'); x.fillStyle = '#f3d2b4'; x.beginPath(); x.arc(size / 2, size / 2, size * .4, 0, 7); x.fill(); } return c; }
  function badge(el, id) { const p = CB.playerById(id); el.innerHTML = ''; el.append(head(id, 40), document.createTextNode(p.name + ' (' + (CB.ROLES[p.role] || p.role) + ')')); }
  function goldPill(el, gold) { el.innerHTML = '<span class="coin"></span>' + fmt(gold); }
  let raf = 0;
  function show(id) { cancelAnimationFrame(raf); $$('.screen').forEach(e => e.classList.add('hidden')); $('#screen-' + id).classList.remove('hidden'); app.screen = id; document.body.classList.toggle('playing', id === 'wave'); window.scrollTo(0, 0); SHOW[id]?.(); }
  $$('[data-back]').forEach(b => b.onclick = () => { A.init(); A.sfx('back'); back(); });
  function back() { if (app.screen === 'characters') show('title'); else if (app.screen === 'map') show('characters'); else if (app.screen === 'shop') show('map'); }
  $('#btn-help').onclick = () => { click(); $('#help').showModal(); };
  $('#btn-sound').onclick = () => { A.init(); A.enabled = !A.enabled; data.settings.sound = A.enabled; persist(); soundLabel(); A.sfx('click'); };
  const soundLabel = () => { $('#btn-sound').textContent = A.enabled ? '🔊 Son' : '🔇 Son'; }; soundLabel();
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
  const FAM_TABS = [['all', '👨‍👩‍👧‍👦', 'Tous'], ['matt', '🅼', 'Les Matt'], ['bibi', '🅱', 'Les Bibi'], ['jay', '🅹', 'Les Jay'], ['jo', '🅾', 'Les Jo']];
  function charList() { return CB.PLAYERS.filter(p => app.family === 'all' || p.family === app.family); }
  function renderCharacters() {
    $('#family-tabs').innerHTML = FAM_TABS.map(([id, ico, label]) => '<button class="tab ' + (app.family === id ? 'active' : '') + '" data-fam="' + id + '" title="' + label + '">' + ico + '<small>' + label + '</small></button>').join('');
    $$('#family-tabs .tab').forEach(b => b.onclick = () => { click(); app.family = b.dataset.fam; app.charIndex = 0; renderCharacters(); });
    const list = charList(), grid = $('#char-grid'); grid.innerHTML = '';
    list.forEach((p, i) => { const prof = data.profiles[p.id]; const card = document.createElement('button'); card.className = 'char-card' + (i === app.charIndex ? ' selected' : ''); card.setAttribute('role', 'option'); card.append(head(p.id, 76)); card.insertAdjacentHTML('beforeend', '<b>' + esc(p.name) + '</b><small>' + esc(CB.ROLES[p.role] || p.role) + (prof ? ' · Niv. ' + prof.level : '') + '</small>'); card.onclick = () => { A.init(); if (app.charIndex === i) { A.sfx('click'); choose(p.id); } else { A.sfx('click'); app.charIndex = i; renderCharacters(); } }; grid.append(card); });
    const p = list[app.charIndex] || list[0], prof = data.profiles[p.id] || S.blank(p.id), fam = CB.FAMILIES[p.family], need = CB.xpForLevel(prof.level);
    const d = $('#char-detail'); d.innerHTML = ''; const big = head(p.id, 160); big.className = 'big'; d.append(big);
    d.insertAdjacentHTML('beforeend', '<span class="name">' + esc(p.name) + '</span><span class="fam" style="background:' + fam.color + ';color:' + (p.family === 'bibi' ? '#1b1b1b' : '#fff') + '">' + esc(fam.name.toUpperCase()) + ' · ' + esc((CB.ROLES[p.role] || p.role).toUpperCase()) + ' · ' + CB.ageOf(p.birth) + ' ANS</span>'
      + '<div class="perk"><b>' + p.perk.icon + ' ' + esc(p.perk.name) + '</b><p>' + esc(p.perk.desc) + '</p></div>'
      + '<div class="statline"><span>Niveau</span><b>' + prof.level + '</b></div><div class="xpbar"><i style="width:' + Math.round(100 * prof.xp / need) + '%"></i></div>'
      + '<div class="statline"><span>Évolutions</span><b>' + Object.values(prof.talents || {}).reduce((a, b) => a + b, 0) + (prof.points ? ' · ⭐ ' + prof.points + ' à choisir' : '') + '</b></div>' + (prof.allyBought && prof.ally ? '<div class="statline"><span>Coéquipier</span><b>' + esc(CB.playerById(prof.ally)?.name || '') + '</b></div>' : '')
      + '<div class="statline"><span>Or en banque</span><b>' + CB.COIN + ' ' + fmt(prof.gold) + '</b></div><div class="statline"><span>Aventure</span><b>' + S.completion(prof) + ' % · ★ ' + S.totalStars(prof) + '</b></div><div class="statline"><span>Canon</span><b>' + esc(CB.CANNONS[prof.cannon].name) + '</b></div><div class="statline"><span>Ennemis abattus</span><b>' + fmt(prof.kills) + '</b></div>'
      + '<button class="lego primary" id="btn-choose"><b class="btn-badge">A</b> Jouer avec ' + esc(p.name) + '</button>');
    $('#btn-choose').onclick = () => { click(); choose(p.id); };
  }
  function choose(id) { app.player = CB.playerById(id); app.profile = S.profile(data, id); data.current = id; persist(); const n = app.profile.last || S.nextWave(app.profile); app.wi = n.wi; app.vi = n.vi; show('map'); }
  SHOW.characters = () => { const list = charList(); const i = list.findIndex(p => p.id === data.current); if (i >= 0) app.charIndex = i; renderCharacters(); };

  // ---------- Carte ----------
  SHOW.map = () => {
    app.marker = { vi: app.vi, from: null, k: 1 }; app.profile.last = { wi: app.wi, vi: app.vi }; persist();
    const nextReveal = p0 => S.revealed(p0) > (p0.shown || 0) ? { vi: (p0.shown || 0) + 1, k: 0, dinged: false } : p0.portal && !p0.portalShown ? { vi: 5, k: 0, dinged: false } : null;
    app.reveal = app.wi === 0 ? nextReveal(app.profile) : null;
    badge($('#map-badge'), app.player.id); mapInfo(); levelButton();
    app.debug = false; const dev = app.player.id === 'matthieu'; $('#btn-debug').classList.toggle('hidden', !dev); $('#btn-new-wave').classList.toggle('hidden', !dev);
    let last = performance.now(), t = 0; const c = $('#map-canvas').getContext('2d');
    const loop = now => { if (app.screen !== 'map') return; raf = requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; if (app.marker.k < 1) { app.marker.k = Math.min(1, app.marker.k + dt * 1.6); if (app.marker.k >= 1) A.sfx('walk'); } if (app.reveal && app.wi === 0) { const rv = app.reveal; rv.k += dt * .7; if (rv.k >= 1 && !rv.dinged) { rv.dinged = true; A.sfx('win'); } if (rv.k >= 1.6) { if (rv.vi === 5) app.profile.portalShown = true; else app.profile.shown = rv.vi; persist(); app.reveal = nextReveal(app.profile); mapInfo(); } }
      const view = R.fitCanvas(c.canvas); R.begin(c, view); CB.Map.draw(c, { wi: app.wi, profile: app.profile, selected: app.vi, t, playerId: app.player.id, marker: app.marker, view, reveal: app.wi === 0 ? app.reveal : null }); };
    raf = requestAnimationFrame(loop);
  };
  function mapInfo() {
    const w = CB.WORLDS[app.wi], p = app.profile, def = CB.waveDef(app.wi, app.vi), stars = S.stars(p, w.id, app.vi), open = S.waveUnlocked(p, app.wi, app.vi);
    $('#world-title').textContent = 'Monde ' + (app.wi + 1) + ' · ' + w.name; goldPill($('#map-gold'), p.gold);
    $('#world-prev').disabled = app.wi === 0; $('#world-next').disabled = app.wi >= CB.WORLDS.length - 1;
    const el = $('#map-objective');
    el.innerHTML = '<span class="tag">' + (def.secret ? '🌀 LE PASSÉ' : def.type === 'boss' ? '💀 BOSS' : 'TABLEAU ' + (app.vi + 1)) + ' · ' + esc(def.name.toUpperCase()) + '</span>' + (stars ? ' <span class="stars">' + '★'.repeat(stars) + '<span style="opacity:.3">' + '★'.repeat(3 - stars) + '</span></span>' : '') + '<br>' + (open ? esc(def.text) : app.wi === 0 ? '🔒 Un secret de la nuit sans fin…' : '🔒 Termine le tableau précédent pour débloquer celui-ci.') + '<div class="icons"></div>';
    const icons = el.querySelector('.icons'); const known = [...new Set(def.endless === 'dinos' ? CB.DINOS : w.enemies)].filter(type => (p.seenBy || {})[type] > 0 && (p.killsBy || {})[type] > 0).slice(0, 10); if (!known.length) { const q = document.createElement('span'); q.className = 'unknown'; q.title = 'Monstres encore inconnus'; q.textContent = '?'; icons.append(q); } for (const type of known) { const c = document.createElement('canvas'); c.width = c.height = 72; c.title = CB.ENEMIES[type].name; R.enemyIcon(c.getContext('2d'), type, 36, 36, 9); icons.append(c); }
    if (def.type === 'boss') { const c = document.createElement('canvas'); c.width = c.height = 72; c.title = CB.BOSSES[w.boss].name; R.bossIcon(c.getContext('2d'), w.boss, 36, 40, 5); icons.append(c); }
    $('#btn-start').disabled = !open;
  }
  function selectWave(vi, walk = true) { if (vi < 0 || vi >= CB.wavesOf(app.wi) || vi === app.vi) return; const from = app.vi; app.vi = vi; app.marker = walk ? { vi, from, k: 0 } : { vi, from: null, k: 1 }; app.profile.last = { wi: app.wi, vi }; persist(); mapInfo(); A.sfx('click'); }
  function changeWorld(d) { const wi = app.wi + d; if (wi < 0 || wi >= CB.WORLDS.length) return; if (!S.worldUnlocked(app.profile, wi)) { A.sfx('nope'); $('#world-title').textContent = '🔒 Réussis ' + CB.WORLD_NEED + ' tableaux du monde ' + wi + ' d’abord !'; return; } app.wi = wi; app.vi = 0; for (let v = CB.WAVES_PER_WORLD - 1; v >= 0; v--) if (S.waveUnlocked(app.profile, wi, v) && !S.stars(app.profile, CB.WORLDS[wi].id, v)) { app.vi = v; break; } app.marker = { vi: app.vi, from: null, k: 1 }; app.profile.last = { wi, vi: app.vi }; persist(); mapInfo(); A.sfx('click'); }
  $('#world-prev').onclick = () => { A.init(); changeWorld(-1); }; $('#world-next').onclick = () => { A.init(); changeWorld(1); };
  $('#map-canvas').onpointerdown = e => { A.init(); const { x, y } = R.toLogical(e.currentTarget, e.clientX, e.clientY); const vi = CB.Map.nodeAt(app.wi, x, y); if (vi < 0) return; if (!S.waveUnlocked(app.profile, app.wi, vi)) { A.sfx('nope'); return; } if (vi === app.vi) startWave(); else selectWave(vi); };
  $('#btn-start').onclick = () => { click(); startWave(); }; $('#btn-shop').onclick = () => { click(); show('shop'); };

  // ---------- Hangar ----------
  const SHOP_TABS = [['upgrades', '⚙️', 'Améliorations', 'Dépense ton or pour rendre le canon plus fort, pour toujours.'], ['cannons', '🔫', 'Canons', 'Un nouveau canon se débloque à chaque monde terminé.'], ['balls', '🟠', 'Boulets', 'Change l’allure de tes boulets et leur traînée.'], ['effects', '✨', 'Effets spéciaux', 'Parfois, quand tu tires, il se passe quelque chose de spécial. Plus de niveaux = plus souvent !'], ['team', '👥', 'Équipe', 'Recrute un coéquipier : il tire tout seul, tout le temps, mais ses boulets font deux fois moins mal.']];
  function preview(kind, key) { const c = document.createElement('canvas'); c.width = 240; c.height = 90; const x = c.getContext('2d'); if (kind === 'cannon') R.battleCannon(x, 100, 84, 34, app.player.id, key, 1, 0, 0); else R.ballIcon(x, key, 120, 45, 28, 0); return c; }
  // Fiche du canon (hangar) : le héros assis sur son canon vu de profil, puis les stats avec des barres obliques.
  function shopHero() {
    const p = app.profile, pl = app.player, st = CB.stats(p, pl), art = $('#shop-art'), c = art.getContext('2d'); c.clearRect(0, 0, art.width, art.height);
    c.save(); c.globalAlpha = .12; c.fillStyle = '#ffe36b'; c.font = '900 260px Arial'; c.textAlign = 'center'; c.translate(230, 250); c.rotate(-.28); c.fillText('✦', 0, 0); c.restore();
    R.battleCannon(c, 180, 300, 120, pl.id, p.cannon, 1, 0, 0);
    $('#shop-name').textContent = pl.name; $('#shop-cannon').innerHTML = '<b>' + esc(CB.CANNONS[p.cannon]?.name || '') + '</b> · ' + esc(pl.perk.icon + ' ' + pl.perk.name);
    const pct = v => (v >= 0 ? '+' : '') + Math.round(v * 100) + ' %';
    const rows = [['cadence', pct(st.rate - 1)], ['degats', pct(st.damage - 1)], ['portee', pct(st.range - 1)], ['vie', st.maxHp + ' PV'], ['butin', pct(st.gold - 1)], ['critique', Math.round(st.crit * 100) + ' %'], ['reparation', st.regen ? '+' + st.regen + ' PV / 5 s' : '—']];
    // Deux couleurs par barre : la part du personnage (talents choisis + son talent de famille) et la part du canon (améliorations du hangar + canon équipé).
    const perkMods = pl.perk?.mods || {}, cannonMods = (CB.CANNONS[p.cannon] || {}).mods || {}, MOD = { cadence: 'rate', degats: 'damage', portee: 'range', butin: 'gold', critique: 'crit' };
    $('#shop-stats').innerHTML = rows.map(([key, text]) => {
      const u = CB.UPGRADES[key], per = CB.STAT_PER[key], lvl = p.upgrades[key] || 0, tal = (p.talents || {})[key] || 0;
      const hero = tal * per.talent + (key === 'vie' ? (perkMods.hp || 0) : (perkMods[MOD[key]] || 0)), cannon = lvl * per.upgrade + (cannonMods[MOD[key]] || 0), max = CB.TALENT_MAX * per.talent + u.max * per.upgrade || 1;
      const hw = Math.min(100, 100 * hero / max), cw = Math.min(100 - hw, 100 * cannon / max);
      return '<div class="stat-row' + (lvl >= u.max ? ' maxed' : '') + '"><span>' + CB.icon(u.icon) + ' ' + esc(u.name) + '</span><div class="meter duo" role="meter" aria-label="' + esc(u.name) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(hw + cw) + '"><i class="hero" style="width:' + hw + '%" title="Personnage"></i><i class="cannon" style="width:' + cw + '%" title="Canon"></i></div><b>' + text + '</b></div>'; }).join('')
      + '<div class="stat-legend"><span><i class="hero"></i> ' + esc(pl.name) + '</span><span><i class="cannon"></i> Canon</span></div>';
  }
  function renderShop() {
    const p = app.profile; goldPill($('#shop-gold'), p.gold); shopHero();
    $('#shop-tabs').innerHTML = SHOP_TABS.map(([id, ico, label]) => '<button class="tab ' + (app.shopTab === id ? 'active' : '') + '" data-tab="' + id + '" title="' + label + '">' + ico + '<small>' + label + '</small></button>').join('');
    $$('#shop-tabs .tab').forEach(b => b.onclick = () => { click(); app.shopTab = b.dataset.tab; renderShop(); });
    $('#shop-intro').textContent = SHOP_TABS.find(t => t[0] === app.shopTab)[3];
    const list = $('#shop-list'); list.innerHTML = '';
    const item = (cls, html) => { const el = document.createElement('div'); el.className = 'item ' + cls; el.innerHTML = html; list.append(el); return el; };
    const pips = (lvl, max) => '<div class="pips">' + Array.from({ length: max }, (_, i) => '<i class="' + (i < lvl ? 'on' : '') + '"></i>').join('') + '</div>';
    const buyBtn = (cost, can, label = 'Acheter') => '<button class="lego small buy" ' + (can ? '' : 'disabled') + '>' + label + ' ' + CB.COIN + ' ' + fmt(cost) + '</button>';
    if (app.shopTab === 'upgrades') for (const [key, u] of Object.entries(CB.UPGRADES)) {
      const lvl = p.upgrades[key] || 0, maxed = lvl >= u.max, cost = maxed ? 0 : CB.upgradeCost(key, lvl);
      const el = item('fun ' + (maxed ? 'owned' : ''), '<div class="ico">' + CB.icon(u.icon) + '</div><h3>' + u.name + '</h3><span class="per">' + u.per + '</span>' + pips(lvl, u.max) + '<span class="lvl">' + lvl + ' / ' + u.max + '</span>' + (maxed ? '<span class="state">MAX</span><button class="lego small buy" disabled>★ MAX</button>' : buyBtn(cost, p.gold >= cost, '+1')));
      el.title = u.desc;
      if (!maxed) el.querySelector('.buy').onclick = () => { A.init(); if (S.buyUpgrade(p, key)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); };
    }
    if (app.shopTab === 'upgrades') for (let i = 0; i < 3; i++) { const el = item('fun mystery', '<div class="ico">?</div><h3>???</h3><span class="per">Bientôt…</span>' + pips(0, 10) + '<span class="lvl">? / ?</span><button class="lego small buy" disabled>🔒</button>'); el.title = 'Une amélioration secrète arrivera plus tard.'; }
    if (app.shopTab === 'cannons') for (const [key, k] of Object.entries(CB.CANNONS)) {
      const owned = p.cannons.includes(key), equipped = p.cannon === key, unlocked = S.cannonUnlocked(p, key), world = k.world && CB.worldById(k.world);
      const mods = Object.entries(k.mods).map(([m, v]) => ({ rate: 'cadence', damage: 'dégâts', range: 'portée', gold: 'or', crit: 'critique' }[m] + ' ' + (v > 0 ? '+' : '') + Math.round(v * 100) + ' %')).concat(k.shots ? ['+' + k.shots + ' boulet par tir'] : []).join(' · ') || 'équilibré';
      const el = item(equipped ? 'equipped' : owned ? 'owned' : unlocked ? '' : 'locked', '<h3>' + k.name + '</h3><span class="per">' + mods + '</span>' + (equipped ? '<span class="state">ÉQUIPÉ</span><button class="lego small buy" disabled>Équipé</button>' : owned ? '<span class="state">ACHETÉ</span><button class="lego small buy">Équiper</button>' : unlocked ? buyBtn(k.price, p.gold >= k.price) : '<button class="lego small buy" disabled>🔒 Termine ' + esc(world.short) + '</button>'));
      el.title = k.desc; el.prepend(preview('cannon', key));
      el.querySelector('.buy').onclick = () => { A.init(); if (owned) { p.cannon = key; A.sfx('click'); } else if (!S.buyCannon(p, key)) { A.sfx('nope'); return; } else A.sfx('buy'); persist(); renderShop(); };
    }
    if (app.shopTab === 'balls') for (const [key, b] of Object.entries(CB.BALLS)) {
      const owned = p.balls.includes(key), equipped = p.ball === key;
      const el = item(equipped ? 'equipped' : owned ? 'owned' : '', '<h3>' + b.name + '</h3>' + (equipped ? '<span class="state">ÉQUIPÉ</span><button class="lego small buy" disabled>Équipé</button>' : owned ? '<span class="state">ACHETÉ</span><button class="lego small buy">Équiper</button>' : buyBtn(b.price, p.gold >= b.price)));
      el.title = b.desc; el.prepend(preview('ball', key));
      el.querySelector('.buy').onclick = () => { A.init(); if (owned) { p.ball = key; A.sfx('click'); } else if (!S.buyBall(p, key)) { A.sfx('nope'); return; } else A.sfx('buy'); persist(); renderShop(); };
    }
    if (app.shopTab === 'effects') for (const [key, e] of Object.entries(CB.EFFECTS)) {
      const lvl = p.effects[key] || 0, maxed = lvl >= e.max, cost = maxed ? 0 : CB.effectCost(key, lvl);
      const el = item('fun ' + (maxed ? 'owned' : lvl ? 'equipped' : ''), '<div class="ico">' + e.icon + '</div><h3>' + e.name + '</h3><span class="per">' + (lvl ? '🎲 ' + Math.round(lvl * CB.EFFECT_CHANCE * 100) + ' % des tirs' : e.desc) + '</span>' + pips(lvl, e.max) + '<span class="lvl">' + lvl + ' / ' + e.max + '</span>' + (maxed ? '<span class="state">MAX</span><button class="lego small buy" disabled>★ MAX</button>' : buyBtn(cost, p.gold >= cost, lvl ? '+1' : 'Acheter')));
      el.title = e.desc;
      if (!maxed) el.querySelector('.buy').onclick = () => { A.init(); if (S.buyEffect(p, key)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); };
    }
    if (app.shopTab === 'team') {
      const H = CB.HELPER;
      if (!p.allyBought) { const el = item('', '<div class="ico">👥</div><h3>' + H.name + '</h3><p>' + H.desc + '</p><span class="per">dégâts ÷ 2 · vise et tire automatiquement</span>' + buyBtn(H.price, p.gold >= H.price, 'Recruter')); el.querySelector('.buy').onclick = () => { A.init(); if (S.buyAlly(p)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); }; }
      else for (const m of CB.PLAYERS) {
        if (m.id === p.id) continue; const on = p.ally === m.id;
        const el = item(on ? 'equipped' : 'owned', '<h3>' + esc(m.name) + '</h3><p>' + esc(CB.ROLES[m.role] || m.role) + ' · ' + esc(m.perk.name) + '</p><span class="per">tire tout seul · dégâts ÷ 2</span>' + (on ? '<span class="state">EN POSTE</span><button class="lego small buy" disabled>En poste</button>' : '<button class="lego small buy">Choisir</button>'));
        const h = head(m.id, 72); h.className = 'head'; el.prepend(h);
        if (!on) el.querySelector('.buy').onclick = () => { click(); S.setAlly(p, m.id); persist(); renderShop(); };
      }
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
    for (const [key, tl] of Object.entries(CB.TALENTS)) {
      const lvl = tal[key] || 0, row = document.createElement('div'); row.className = 'stat-row' + (lvl >= CB.TALENT_MAX ? ' maxed' : ''); row.style.setProperty('--bar', 'linear-gradient(90deg, ' + tl.bar[0] + ', ' + tl.bar[1] + ')');
      row.innerHTML = '<span>' + CB.icon(tl.icon) + ' ' + esc(tl.name) + '<small>' + esc(tl.per) + ' par point</small></span><div class="meter" role="meter" aria-label="' + esc(tl.name) + '" aria-valuemin="0" aria-valuemax="' + CB.TALENT_MAX + '" aria-valuenow="' + lvl + '"><i style="width:' + (100 * lvl / CB.TALENT_MAX) + '%"></i></div><b>' + lvl + '<small>/' + CB.TALENT_MAX + '</small></b>';
      const b = document.createElement('button'); b.type = 'button'; b.className = 'stat-plus'; b.textContent = '+'; b.dataset.talent = key; b.disabled = !(n > 0) || lvl >= CB.TALENT_MAX; b.title = lvl >= CB.TALENT_MAX ? 'Maximum atteint' : tl.per; b.setAttribute('aria-label', 'Augmenter ' + tl.name);
      b.onclick = () => { if (S.spendPoint(p, key)) { A.sfx('levelup'); persist(); showLevelUp(); list.querySelector('[data-talent="' + key + '"]').focus({ preventScroll: true }); } };
      row.append(b); list.append(row);
    }
    $('#level-intro').innerHTML = n > 0 ? '⭐ <b>' + n + '</b> point' + (n > 1 ? 's' : '') + ' à dépenser : appuie sur <b>+</b>' : 'Gagne des niveaux pour obtenir des points à dépenser ici.';
    if (!dlg.open) dlg.showModal(); (n > 0 ? list.querySelector('.stat-plus:not(:disabled)') : $('#btn-level-ok'))?.focus({ preventScroll: true });
  }
  $('#levelup').onclose = () => { if (app.screen === 'map') { mapInfo(); levelButton(); } };
  $('#btn-level').onclick = () => { click(); showLevelUp(); };
  // ---------- La grande carte : tous les mondes ----------
  function showWorlds() {
    const p = app.profile, list = $('#worlds-list'); list.innerHTML = '';
    CB.WORLDS.forEach((w, i) => {
      const open = S.worldUnlocked(p, i), cleared = S.worldCleared(p, i), stars = S.worldStars(p, w.id), current = i === app.wi;
      const el = document.createElement('button'); el.type = 'button'; el.className = 'world-tile' + (open ? '' : ' locked') + (current ? ' current' : ''); el.disabled = !open;
      const cv = document.createElement('canvas'); cv.width = 320; cv.height = 180; R.background(cv.getContext('2d'), 320, 180, w, performance.now() / 1000); el.append(cv);
      el.insertAdjacentHTML('beforeend', '<div class="world-info"><b>' + w.icon + ' Monde ' + (i + 1) + '</b><span>' + esc(w.name) + '</span>' + (open ? '<em>' + '★'.repeat(Math.min(3, Math.round(stars / 5))) + ' ' + stars + ' / 15 · ' + cleared + ' / ' + CB.WAVES_PER_WORLD + ' tableaux' + (i === 0 && p.portal ? ' · 🦖 le passé' : '') + '</em>' : '<em>🔒 Réussis ' + CB.WORLD_NEED + ' tableaux du monde ' + i + '</em>') + '</div>');
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
    W.held = false; W.queued = 0; W.paused = false; W.resultShown = false; W.t = 0; W.tutorial = 4.5; W.snapshot = { kills: 0, hp: app.wave.hp, bursts: 0, shots: 0, boss: false, shield: app.wave.shield, elites: 0, cards: 0, allyShots: 0 };
    show('wave');
  }
  SHOW.wave = () => {
    W.canvas = $('#wave-canvas'); W.ctx = W.canvas.getContext('2d');
    document.body.classList.toggle('debug', !!app.debug); $('#debug-panel').classList.toggle('hidden', !app.debug); if (app.debug) CB.Debug.render();
    badge($('#wave-badge'), app.player.id); $('#overlay-pause').classList.add('hidden'); $('#overlay-cards').classList.add('hidden'); $('#overlay-result').classList.add('hidden');
    const def = app.wave.def; $('#wave-tag').textContent = (def.type === 'boss' ? 'Boss · ' : def.type === 'endless' ? '∞ · ' : 'Vague ' + (app.vi + 1) + ' · ') + def.name; $('#wave-text').textContent = def.type === 'endless' && !def.secret ? 'Survis le plus longtemps possible\u00a0!' : def.text;
    $('#wave-news').classList.add('hidden'); W.newsUntil = 0; W.newsIndex = 0; $('#btn-quit').textContent = def.type === 'endless' ? '🏁 Terminer la nuit' : '🗺 Carte';
    const tut = $('#wave-tutorial'), touch = matchMedia('(pointer: coarse)').matches; tut.classList.remove('hidden');
    $('#wave-tutorial-text').innerHTML = (touch ? 'MAINTIENS LE DOIGT POUR <b>TIRER</b>' : 'MAINTIENS LE CLIC OU <kbd>ESPACE</kbd> POUR <b>TIRER</b>') + '<br><small>LE CANON EST LENT AU DÉBUT : AMÉLIORE LA CADENCE AU HANGAR</small>';
    let last = performance.now(); const loop = now => { if (app.screen !== 'wave') return; raf = requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; waveFrame(dt); }; raf = requestAnimationFrame(loop);
  };
  const aimTo = e => { const w = app.wave; if (!w) return; const p = R.toLogical(W.canvas, e.clientX, e.clientY); Object.assign(w.aim, CB.clampAim(p.x, p.y)); };
  // Sans le pouvoir « tir automatique », chaque pression = un seul boulet ; un clic pendant le rechargement est gardé en réserve un court instant.
  const shoot = () => { const w = app.wave; if (!w || W.paused) return false; if (w.fire()) { W.queued = 0; A.sfx('shoot'); if (w.lastEffect) A.sfx(w.lastEffect === 'eclair' ? 'bolt' : w.lastEffect === 'neige' ? 'freeze' : 'elite'); W.tutorial = Math.min(W.tutorial, 1.5); return true; } if (!w.over && !w.choice) W.queued = .25; return false; };
  $('#wave-canvas').onpointerdown = e => { if (W.paused || app.wave?.over || app.wave?.choice) return; A.init(); aimTo(e); e.currentTarget.setPointerCapture(e.pointerId); W.held = true; shoot(); };
  $('#wave-canvas').onpointermove = e => { if (!W.paused) aimTo(e); };
  $('#wave-canvas').onpointerup = $('#wave-canvas').onpointercancel = () => { W.held = false; };
  $('#btn-fire').onpointerdown = e => { e.preventDefault(); A.init(); e.currentTarget.setPointerCapture(e.pointerId); W.held = true; shoot(); };
  $('#btn-fire').onpointerup = $('#btn-fire').onpointercancel = () => { W.held = false; };
  $('#btn-pause').onclick = () => { A.init(); pause(true); };
  $('#btn-resume').onclick = () => { click(); pause(false); }; $('#btn-restart').onclick = () => { click(); startWave(); }; $('#btn-quit').onclick = () => { click(); const w = app.wave; if (w && w.endless && !w.over) { w.finish(true, 'nuit'); pause(false); } else show('map'); };
  window.addEventListener('blur', () => { W.held = false; if (app.screen === 'wave' && app.wave && !app.wave.over && !app.wave.choice) pause(true); });
  function pause(on) {
    const w = app.wave; if (!w || w.over) return; W.paused = on; W.held = false; $('#overlay-pause').classList.toggle('hidden', !on);
    if (on) { $('#pause-world').textContent = 'Monde ' + (app.wi + 1) + ' · ' + CB.WORLDS[app.wi].name; $('#pause-pct').textContent = S.completion(app.profile) + ' %'; $('#pause-stats').innerHTML = '<div><b>' + w.kills + '</b>abattus</div><div><b>' + CB.COIN + ' ' + fmt(w.gold) + '</b>cette vague</div><div><b>' + Math.round(w.hp) + ' / ' + w.maxHp + '</b>points de vie</div><div><b>' + Math.round(100 * w.hits / Math.max(1, w.shots)) + ' %</b>précision</div>'; $('#btn-resume').focus(); }
  }
  function showCards() {
    const w = app.wave, list = $('#card-list'); list.innerHTML = ''; A.sfx('card'); $('#cards-kicker').textContent = 'NIVEAU ' + w.runLevel + ' !';
    w.choice.forEach((key, i) => { const c = CB.CARDS[key], el = document.createElement('button'); el.className = 'card'; el.style.position = 'relative'; const lvl = w.cardLevel(key) + 1; if (c.combo) el.classList.add('secret'); el.innerHTML = '<kbd>' + (i + 1) + '</kbd>' + (c.combo ? '<span class="ribbon">COMBO SECRET</span>' : '') + '<canvas class="ico" width="176" height="176"></canvas><b>' + c.name + '</b><em>' + (lvl > 1 || c.combo ? 'Niveau ' + lvl + (isFinite(c.max) ? ' / ' + c.max : '') : 'Nouveau pouvoir') + '</em><small>' + c.desc + '</small>'; R.cardIcon(el.querySelector('canvas').getContext('2d'), key, 88, 88, 80); el.onclick = () => pick(i); list.append(el); });
    $('#overlay-cards').classList.remove('hidden');
    function pick(i) { if (!w.choice) return; w.pickCard(i); A.sfx('levelup'); $('#overlay-cards').classList.add('hidden'); ownedCards(); }
  }
  function ownedCards() { const n = {}; for (const k of app.wave.cards) n[k] = (n[k] || 0) + 1; const box = $('#wave-cards'); box.innerHTML = ''; for (const [k, c] of Object.entries(n)) { const sp = document.createElement('span'); sp.title = CB.CARDS[k].name + ' : ' + CB.CARDS[k].desc; const cv = document.createElement('canvas'); cv.width = cv.height = 64; R.cardIcon(cv.getContext('2d'), k, 32, 32, 30); sp.append(cv); if (c > 1) sp.insertAdjacentHTML('beforeend', '<b>×' + c + '</b>'); box.append(sp); } }
  function hud() {
    const w = app.wave, d = w.def; goldPill($('#wave-gold'), app.profile.gold + w.gold);
    const endless = d.type === 'endless'; $('#wave-bar').parentElement.classList.toggle('hidden', endless); $('#wave-sub').classList.toggle('hidden', endless);
    $('#wave-bar').style.width = Math.round(w.progress * 100) + '%';
    $('#wave-sub').textContent = d.type === 'kill' || d.type === 'killTimed' ? w.kills + ' / ' + d.goal + ' abattus' : d.type === 'boss' ? (w.boss ? 'Acte ' + (w.boss.act + 1) + ' / 3 · enlève-lui un tiers (' + Math.max(0, Math.round(w.boss.hp - w.boss.target)) + ' PV)' : w.bossFight < CB.BOSS_LEVELS.length ? 'Niveau ' + w.runLevel + ' / ' + CB.BOSS_LEVELS[w.bossFight] + (w.bossFight ? ' · le boss reviendra' : ' · le boss sortira') : '') : d.type === 'endless' ? w.kills + ' abattus · ' + w.seen.length + ' / ' + CB.ENDLESS.roster.length + ' monstres · 🎁 ' + w.discoveries : w.kills + ' abattus';
    if (w.news.length > W.newsIndex && W.t >= W.newsUntil) { const n = w.news[W.newsIndex++]; const el = $('#wave-news'); el.querySelector('.tut-head').textContent = n.kind === 'discovery' ? 'DÉCOUVERTE' : n.kind === 'boss' ? 'BOSS' : 'NOUVEAU'; el.querySelector('.tut-body').textContent = n.text; el.classList.remove('hidden'); el.classList.toggle('gold', n.kind === 'discovery'); W.newsUntil = W.t + 2.6; A.sfx(n.kind === 'discovery' ? 'levelup' : n.kind === 'boss' ? 'boss' : 'elite'); } else if (W.t >= W.newsUntil) $('#wave-news').classList.add('hidden');
    const combo = $('#wave-combo'); combo.textContent = 'x' + w.combo; combo.classList.toggle('hot', w.combo >= 5);
    const hp = $('#wave-hp'); hp.style.height = Math.round(100 * w.hp / w.maxHp) + '%'; hp.classList.toggle('low', w.hp < w.maxHp * .3); $('#wave-hp-text').textContent = Math.ceil(w.hp) + (w.shield ? ' 🛡' + w.shield : '');
    $('#wave-level-n').textContent = 'NIV. ' + w.runLevel; $('#wave-level-bar').style.width = Math.round(w.runProgress * 100) + '%';
    $('#wave-timer').textContent = w.timeLeft != null ? '⏱ ' + Math.ceil(w.timeLeft) + ' s' : '⏱ ' + Math.floor(w.time) + ' s';
  }
  function waveFrame(dt) {
    const w = app.wave; if (!w) return; W.t += dt; I.poll();
    if (!W.paused && !W.freeze && !w.over && !w.choice) {
      const g = I.gamepad, kx = (I.keys.has('ArrowRight') || I.keys.has('KeyD') ? 1 : 0) - (I.keys.has('ArrowLeft') || I.keys.has('KeyA') ? 1 : 0), ky = (I.keys.has('ArrowDown') || I.keys.has('KeyS') ? 1 : 0) - (I.keys.has('ArrowUp') || I.keys.has('KeyW') ? 1 : 0);
      Object.assign(w.aim, CB.clampAim(w.aim.x + (kx + g.ax) * CB.VIEW.f * .8 * dt, w.aim.y + (ky + g.ay) * CB.VIEW.f * .6 * dt));
      if (W.held || I.keys.has('Space') || I.keys.has('Enter') || g.fire) shoot();
      else if (W.queued > 0) { W.queued -= dt; if (w.cooldown <= 0) shoot(); }
      if (I.consume('Escape') || I.consume('KeyP') || g.pause) { pause(true); I.endFrame(); return; }
      const snap = W.snapshot; const sp = W.speed || 1, steps = Math.max(1, Math.ceil(sp)); for (let k = 0; k < steps; k++) w.update(dt * sp / steps);
      if (w.kills > snap.kills) A.sfx(w.elitesKilled > snap.elites ? 'elite' : 'kill'); if (w.hp < snap.hp) A.sfx('hurt'); if (w.shield < snap.shield) A.sfx('shield'); if (w.bossSpawned && !snap.boss) A.sfx('boss');
      if (w.bursts.some(b => b.age === 0 && b.kind === 'crit')) A.sfx('crit');
      if (w.ally && w.ally.shots > snap.allyShots) A.sfx('shoot');
      Object.assign(snap, { kills: w.kills, hp: w.hp, boss: w.bossSpawned, shield: w.shield, elites: w.elitesKilled, allyShots: w.ally ? w.ally.shots : 0 });
      W.tutorial -= dt; if (W.tutorial <= 0) $('#wave-tutorial').classList.add('hidden');
    } else if (W.paused) { if (I.consume('Escape') || I.consume('KeyP') || I.gamepad.pause) pause(false); }
    else if (w.choice) { CARD_KEYS.forEach((code, i) => { if (I.consume(code)) $$('#card-list .card')[i]?.click(); }); if (I.consume('Enter')) $$('#card-list .card')[0]?.click(); }
    if (w.choice && $('#overlay-cards').classList.contains('hidden')) showCards();
    I.endFrame();
    const view = R.fitWave(W.canvas); R.scene(W.ctx, w, { playerId: app.player.id, cannon: app.profile.cannon, ball: app.profile.ball, t: W.t, view }); hud();
    if (app.debug) CB.Debug.tick();
    if (w.over && !W.resultShown) { W.resultShown = true; W.held = false; if (w.reason === 'portail' && !app.debug) { A.sfx('win'); setTimeout(travelPortal, 400); } else { if (!app.debug) setTimeout(showResult, 1100); A.sfx(w.won ? 'win' : 'lose'); } }
  }
  // Le portail nous emporte tout de suite dans le passé : on encaisse la nuit, puis on repart avec ses cartes, son niveau et sa vie.
  function travelPortal() {
    const w = app.wave; if (!w || app.screen !== 'wave') return; CB.claim(app.profile, w); persist();
    const carry = { cards: w.cards.slice(), runLevel: w.runLevel, runXp: w.runXp, hpRatio: w.hp / w.maxHp };
    app.vi = CB.WORLDS[0].secret.vi; app.profile.last = { wi: 0, vi: app.vi }; persist(); startWave(null, carry);
  }
  function showResult() {
    const w = app.wave; if (!w || app.screen !== 'wave') return; const r = CB.claim(app.profile, w); persist(); if (!r) return;
    let next = w.won && !w.def.secret ? (app.vi + 1 < CB.WAVES_PER_WORLD ? { wi: app.wi, vi: app.vi + 1 } : app.wi + 1 < CB.WORLDS.length ? { wi: app.wi + 1, vi: 0 } : null) : null;
    if (next && !S.waveUnlocked(app.profile, next.wi, next.vi)) next = null;
    const news = []; if (r.levels) { news.push('⭐ Niveau ' + r.level + ' ! Choisis ton évolution.'); A.sfx('levelup'); }
    if (r.newWorld) news.push('🗺 Nouveau monde débloqué : ' + CB.WORLDS[app.wi + 1].name + ' !');
    if (w.won && w.vi === CB.WAVES_PER_WORLD - 1 && !app.profile.cannons.includes(CB.WORLDS[app.wi].cannon)) news.push('🔫 Nouveau canon au hangar : ' + CB.CANNONS[CB.WORLDS[app.wi].cannon].name + ' !');
    if (w.won && !next) news.push('🏆 Tu as terminé toute l’aventure ! Refais les tableaux pour trois étoiles partout.');
    const panel = $('#result-panel');
    if (w.endless) { if (r.newNodes) news.unshift('🗺 ' + (r.newNodes > 1 ? r.newNodes + ' nouveaux tableaux apparaissent' : 'Un nouveau tableau apparaît') + ' sur la carte !'); news.push('⏱ Nuit survécue : ' + Math.floor(w.time / 60) + ' min ' + (Math.round(w.time) % 60) + ' s · ' + w.seen.length + ' monstres rencontrés' + (app.profile.bestTime === Math.round(w.time) ? ' · record !' : '')); }
    panel.innerHTML = '<div class="kicker">' + (w.endless ? (w.def.secret ? 'RETOUR DU PASSÉ' : 'LA NUIT SE TERMINE') : w.won ? 'TABLEAU TERMINÉ' : w.reason === 'temps' ? 'TEMPS ÉCOULÉ' : 'CANON DÉTRUIT') + '</div><h2 class="' + (w.won ? '' : 'lost') + '">' + (w.endless ? (w.stars ? 'Bien joué !' : 'Tiens plus longtemps !') : w.won ? (w.stars === 3 ? '★ Parfait !' : 'Bravo !') : 'On recommence plus fort !') + '</h2>'
      + '<div class="result-stars">' + [1, 2, 3].map(i => '<span class="' + (i <= w.stars ? 'on' : '') + '">★</span>').join('') + '</div>'
      + '<div class="result-rows"><div><span>Ennemis abattus</span><b>' + w.kills + '</b></div><div><span>Meilleur combo</span><b>x' + w.bestCombo + '</b></div><div><span>Niveau atteint</span><b>' + w.runLevel + '</b></div><div class="gold"><span>Or gagné</span><b>' + CB.COIN + ' +' + fmt(r.gold) + (w.bonusGold ? ' <small>(bonus ' + w.bonusGold + ')</small>' : '') + '</b></div><div><span>Expérience</span><b>+' + fmt(r.xp) + ' XP</b></div><div><span>Précision</span><b>' + Math.round(100 * w.hits / Math.max(1, w.shots)) + ' %</b></div><div><span>Niveau</span><b>' + app.profile.level + '</b></div></div>'
      + news.map(n => '<div class="result-news">' + esc(n) + '</div>').join('')
      + '<div class="result-buttons"><button class="lego" id="res-map">🗺 Carte</button><button class="lego" id="res-shop">🔧 Hangar</button><button class="lego ' + (w.won && next ? '' : 'primary') + '" id="res-retry">↻ Rejouer</button>' + (w.won && next ? '<button class="lego primary" id="res-next"><b class="btn-badge">A</b> Suivant</button>' : '') + '</div>';
    $('#overlay-result').classList.remove('hidden');
    $('#res-map').onclick = () => { click(); show('map'); }; $('#res-shop').onclick = () => { click(); app.screen = 'map'; show('shop'); }; $('#res-retry').onclick = () => { click(); startWave(); };
    if (next) $('#res-next').onclick = () => { click(); app.wi = next.wi; app.vi = next.vi; app.profile.last = next; persist(); startWave(); };
    ($('#res-next') || $('#res-retry')).focus();
    if (r.levels) setTimeout(showLevelUp, 600);
  }

  // ---------- Clavier dans les menus ----------
  window.addEventListener('keydown', e => {
    if ((e.target.matches && e.target.matches('input, textarea, select')) || $('#help').open || $('#levelup').open || $('#worlds').open || $('#codex').open) return;
    if (app.screen === 'title' && e.code === 'Enter') { click(); data.current && data.profiles[data.current] ? choose(data.current) : show('characters'); }
    else if (app.screen === 'characters') { const list = charList(), cols = Math.max(1, Math.floor($('#char-grid').clientWidth / 128)); const move = d => { app.charIndex = (app.charIndex + d + list.length) % list.length; A.sfx('click'); renderCharacters(); }; if (e.code === 'ArrowRight') move(1); else if (e.code === 'ArrowLeft') move(-1); else if (e.code === 'ArrowDown') move(cols); else if (e.code === 'ArrowUp') move(-cols); else if (e.code === 'Enter') { click(); choose(list[app.charIndex].id); } else if (e.code === 'Escape') back(); else if (e.code === 'PageUp' || e.code === 'PageDown') { const i = FAM_TABS.findIndex(t => t[0] === app.family); app.family = FAM_TABS[(i + (e.code === 'PageDown' ? 1 : -1) + FAM_TABS.length) % FAM_TABS.length][0]; app.charIndex = 0; renderCharacters(); } else return; e.preventDefault(); }
    else if (app.screen === 'map') { if (e.code === 'ArrowRight') { for (let v = app.vi + 1; v < CB.wavesOf(app.wi); v++) if (S.waveUnlocked(app.profile, app.wi, v)) { selectWave(v); break; } } else if (e.code === 'ArrowLeft') selectWave(app.vi - 1); else if (e.code === 'PageUp' || e.code === 'KeyQ') changeWorld(-1); else if (e.code === 'PageDown' || e.code === 'KeyE') changeWorld(1); else if (e.code === 'Enter') { click(); startWave(); } else if (e.code === 'Escape') back(); else if (e.code === 'KeyH') { click(); show('shop'); } else return; e.preventDefault(); }
    else if (app.screen === 'shop') { if (e.code === 'Escape') back(); else if (e.code === 'PageUp' || e.code === 'PageDown' || e.code === 'KeyQ' || e.code === 'KeyE') { const i = SHOP_TABS.findIndex(t => t[0] === app.shopTab); app.shopTab = SHOP_TABS[(i + (e.code === 'PageDown' || e.code === 'KeyE' ? 1 : -1) + SHOP_TABS.length) % SHOP_TABS.length][0]; click(); renderShop(); } }
  });
  I.onButton = code => { if (app.screen !== 'wave') window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); };
  Object.assign(app, { show, choose, startWave, pause, data, persist, W });
  show('title');
})(window.CB);
