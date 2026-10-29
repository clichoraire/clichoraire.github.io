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
    for (const k of title.cannons) R.cannon(c, k.x, 560, .72, k.skin, k.angle, k.recoil, k.id, t);
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
      + '<div class="statline"><span>Or en banque</span><b>🪙 ' + fmt(prof.gold) + '</b></div><div class="statline"><span>Aventure</span><b>' + S.completion(prof) + ' % · ★ ' + S.totalStars(prof) + '</b></div><div class="statline"><span>Canon</span><b>' + esc(CB.CANNONS[prof.cannon].name) + '</b></div><div class="statline"><span>Ennemis abattus</span><b>' + fmt(prof.kills) + '</b></div>'
      + '<button class="lego primary" id="btn-choose"><b class="btn-badge">A</b> Jouer avec ' + esc(p.name) + '</button>');
    $('#btn-choose').onclick = () => { click(); choose(p.id); };
  }
  function choose(id) { app.player = CB.playerById(id); app.profile = S.profile(data, id); data.current = id; persist(); const n = app.profile.last || S.nextWave(app.profile); app.wi = n.wi; app.vi = n.vi; show('map'); }
  SHOW.characters = () => { const list = charList(); const i = list.findIndex(p => p.id === data.current); if (i >= 0) app.charIndex = i; renderCharacters(); };

  // ---------- Carte ----------
  SHOW.map = () => {
    app.marker = { vi: app.vi, from: null, k: 1 }; app.profile.last = { wi: app.wi, vi: app.vi }; persist();
    badge($('#map-badge'), app.player.id); mapInfo(); $('#btn-level').classList.toggle('hidden', !(app.profile.points > 0));
    app.debug = false; const dev = app.player.id === 'matthieu'; $('#btn-debug').classList.toggle('hidden', !dev); $('#btn-new-wave').classList.toggle('hidden', !dev);
    let last = performance.now(), t = 0; const c = $('#map-canvas').getContext('2d');
    const loop = now => { if (app.screen !== 'map') return; raf = requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; if (app.marker.k < 1) { app.marker.k = Math.min(1, app.marker.k + dt * 1.6); if (app.marker.k >= 1) A.sfx('walk'); } const view = R.fitCanvas(c.canvas); R.begin(c, view); CB.Map.draw(c, { wi: app.wi, profile: app.profile, selected: app.vi, t, playerId: app.player.id, marker: app.marker, view }); };
    raf = requestAnimationFrame(loop);
  };
  function mapInfo() {
    const w = CB.WORLDS[app.wi], p = app.profile, def = CB.waveDef(app.wi, app.vi), stars = S.stars(p, w.id, app.vi), open = S.waveUnlocked(p, app.wi, app.vi);
    $('#world-title').textContent = 'Monde ' + (app.wi + 1) + ' · ' + w.name; goldPill($('#map-gold'), p.gold);
    $('#world-prev').disabled = app.wi === 0; $('#world-next').disabled = app.wi >= CB.WORLDS.length - 1;
    const el = $('#map-objective');
    el.innerHTML = '<span class="tag">' + (def.type === 'boss' ? '💀 BOSS' : 'TABLEAU ' + (app.vi + 1)) + ' · ' + esc(def.name.toUpperCase()) + '</span>' + (stars ? ' <span class="stars">' + '★'.repeat(stars) + '<span style="opacity:.3">' + '★'.repeat(3 - stars) + '</span></span>' : '') + '<br>' + (open ? esc(def.text) : '🔒 Termine le tableau précédent pour débloquer celui-ci.') + '<div class="icons"></div>';
    const icons = el.querySelector('.icons'); for (const type of [...new Set(w.enemies)]) { const c = document.createElement('canvas'); c.width = c.height = 72; c.title = CB.ENEMIES[type].name; R.enemyIcon(c.getContext('2d'), type, 36, 36, 9); icons.append(c); }
    if (def.type === 'boss') { const c = document.createElement('canvas'); c.width = c.height = 72; c.title = CB.BOSSES[w.boss].name; R.bossIcon(c.getContext('2d'), w.boss, 36, 40, 5); icons.append(c); }
    $('#btn-start').disabled = !open;
  }
  function selectWave(vi, walk = true) { if (vi < 0 || vi >= CB.WAVES_PER_WORLD || vi === app.vi) return; const from = app.vi; app.vi = vi; app.marker = walk ? { vi, from, k: 0 } : { vi, from: null, k: 1 }; app.profile.last = { wi: app.wi, vi }; persist(); mapInfo(); A.sfx('click'); }
  function changeWorld(d) { const wi = app.wi + d; if (wi < 0 || wi >= CB.WORLDS.length) return; if (!S.worldUnlocked(app.profile, wi)) { A.sfx('nope'); $('#world-title').textContent = '🔒 Termine le monde ' + wi + ' d’abord !'; return; } app.wi = wi; app.vi = 0; for (let v = CB.WAVES_PER_WORLD - 1; v >= 0; v--) if (S.waveUnlocked(app.profile, wi, v) && !S.stars(app.profile, CB.WORLDS[wi].id, v)) { app.vi = v; break; } app.marker = { vi: app.vi, from: null, k: 1 }; app.profile.last = { wi, vi: app.vi }; persist(); mapInfo(); A.sfx('click'); }
  $('#world-prev').onclick = () => { A.init(); changeWorld(-1); }; $('#world-next').onclick = () => { A.init(); changeWorld(1); };
  $('#map-canvas').onpointerdown = e => { A.init(); const { x, y } = R.toLogical(e.currentTarget, e.clientX, e.clientY); const vi = CB.Map.nodeAt(app.wi, x, y); if (vi < 0) return; if (!S.waveUnlocked(app.profile, app.wi, vi)) { A.sfx('nope'); return; } if (vi === app.vi) startWave(); else selectWave(vi); };
  $('#btn-start').onclick = () => { click(); startWave(); }; $('#btn-shop').onclick = () => { click(); show('shop'); };

  // ---------- Hangar ----------
  const SHOP_TABS = [['upgrades', '⚙️', 'Améliorations', 'Dépense ton or pour rendre le canon plus fort, pour toujours.'], ['cannons', '🔫', 'Canons', 'Un nouveau canon se débloque à chaque monde terminé.'], ['balls', '🟠', 'Boulets', 'Change l’allure de tes boulets et leur traînée.'], ['effects', '✨', 'Effets spéciaux', 'Parfois, quand tu tires, il se passe quelque chose de spécial. Plus de niveaux = plus souvent !'], ['team', '👥', 'Équipe', 'Recrute un coéquipier : il tire tout seul, tout le temps, mais ses boulets font deux fois moins mal.']];
  function preview(kind, key) { const c = document.createElement('canvas'); c.width = 240; c.height = 90; const x = c.getContext('2d'); if (kind === 'cannon') R.cannon(x, 120, 82, .62, key, -.3, 0, app.player.id, 0); else R.ballIcon(x, key, 120, 45, 28, 0); return c; }
  function renderShop() {
    const p = app.profile; goldPill($('#shop-gold'), p.gold);
    $('#shop-tabs').innerHTML = SHOP_TABS.map(([id, ico, label]) => '<button class="tab ' + (app.shopTab === id ? 'active' : '') + '" data-tab="' + id + '" title="' + label + '">' + ico + '<small>' + label + '</small></button>').join('');
    $$('#shop-tabs .tab').forEach(b => b.onclick = () => { click(); app.shopTab = b.dataset.tab; renderShop(); });
    $('#shop-intro').textContent = SHOP_TABS.find(t => t[0] === app.shopTab)[3];
    const list = $('#shop-list'); list.innerHTML = '';
    const item = (cls, html) => { const el = document.createElement('div'); el.className = 'item ' + cls; el.innerHTML = html; list.append(el); return el; };
    const pips = (lvl, max) => '<div class="pips">' + Array.from({ length: max }, (_, i) => '<i class="' + (i < lvl ? 'on' : '') + '"></i>').join('') + '</div>';
    const buyBtn = (cost, can, label = 'Acheter') => '<button class="lego small buy" ' + (can ? '' : 'disabled') + '>' + label + ' · 🪙 ' + fmt(cost) + '</button>';
    if (app.shopTab === 'upgrades') for (const [key, u] of Object.entries(CB.UPGRADES)) {
      const lvl = p.upgrades[key] || 0, maxed = lvl >= u.max, cost = maxed ? 0 : CB.upgradeCost(key, lvl);
      const el = item(maxed ? 'owned' : '', '<div class="ico">' + u.icon + '</div><h3>' + u.name + ' <span style="color:var(--cyan2)">' + lvl + '/' + u.max + '</span></h3><p>' + u.desc + '</p><span class="per">' + u.per + '</span>' + pips(lvl, u.max) + (maxed ? '<span class="state">' + (u.max === 1 ? 'ACQUIS' : 'MAX') + '</span>' : buyBtn(cost, p.gold >= cost, u.max === 1 ? 'Acheter' : 'Améliorer')));
      if (!maxed) el.querySelector('.buy').onclick = () => { A.init(); if (S.buyUpgrade(p, key)) { A.sfx('buy'); persist(); renderShop(); } else A.sfx('nope'); };
    }
    if (app.shopTab === 'cannons') for (const [key, k] of Object.entries(CB.CANNONS)) {
      const owned = p.cannons.includes(key), equipped = p.cannon === key, unlocked = S.cannonUnlocked(p, key), world = k.world && CB.worldById(k.world);
      const mods = Object.entries(k.mods).map(([m, v]) => ({ rate: 'cadence', damage: 'dégâts', range: 'portée', gold: 'or', crit: 'critique' }[m] + ' ' + (v > 0 ? '+' : '') + Math.round(v * 100) + ' %')).concat(k.shots ? ['+' + k.shots + ' boulet par tir'] : []).join(' · ') || 'équilibré';
      const el = item(equipped ? 'equipped' : owned ? 'owned' : unlocked ? '' : 'locked', '<h3>' + k.name + '</h3><p>' + k.desc + '</p><span class="per">' + mods + '</span>' + (equipped ? '<span class="state">ÉQUIPÉ</span><button class="lego small buy" disabled>Équipé</button>' : owned ? '<span class="state">ACHETÉ</span><button class="lego small buy">Équiper</button>' : unlocked ? buyBtn(k.price, p.gold >= k.price) : '<button class="lego small buy" disabled>🔒 Termine ' + esc(world.short) + '</button>'));
      el.prepend(preview('cannon', key));
      el.querySelector('.buy').onclick = () => { A.init(); if (owned) { p.cannon = key; A.sfx('click'); } else if (!S.buyCannon(p, key)) { A.sfx('nope'); return; } else A.sfx('buy'); persist(); renderShop(); };
    }
    if (app.shopTab === 'balls') for (const [key, b] of Object.entries(CB.BALLS)) {
      const owned = p.balls.includes(key), equipped = p.ball === key;
      const el = item(equipped ? 'equipped' : owned ? 'owned' : '', '<h3>' + b.name + '</h3><p>' + b.desc + '</p>' + (equipped ? '<span class="state">ÉQUIPÉ</span><button class="lego small buy" disabled>Équipé</button>' : owned ? '<span class="state">ACHETÉ</span><button class="lego small buy">Équiper</button>' : buyBtn(b.price, p.gold >= b.price)));
      el.prepend(preview('ball', key));
      el.querySelector('.buy').onclick = () => { A.init(); if (owned) { p.ball = key; A.sfx('click'); } else if (!S.buyBall(p, key)) { A.sfx('nope'); return; } else A.sfx('buy'); persist(); renderShop(); };
    }
    if (app.shopTab === 'effects') for (const [key, e] of Object.entries(CB.EFFECTS)) {
      const lvl = p.effects[key] || 0, maxed = lvl >= e.max, cost = maxed ? 0 : CB.effectCost(key, lvl);
      const el = item(maxed ? 'owned' : lvl ? 'equipped' : '', '<div class="ico">' + e.icon + '</div><h3>' + e.name + ' <span style="color:var(--cyan2)">' + lvl + '/' + e.max + '</span></h3><p>' + e.desc + '</p><span class="per">' + (lvl ? Math.round(lvl * CB.EFFECT_CHANCE * 100) + ' % des tirs' : 'pas encore acheté') + '</span>' + pips(lvl, e.max) + (maxed ? '<span class="state">MAX</span>' : buyBtn(cost, p.gold >= cost, lvl ? 'Améliorer' : 'Acheter')));
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
  function showLevelUp() {
    const p = app.profile, dlg = $('#levelup'); if (!p || !(p.points > 0)) { if (dlg.open) dlg.close(); return; }
    $('#level-intro').innerHTML = 'Niveau <b>' + p.level + '</b> · <b>' + p.points + '</b> évolution' + (p.points > 1 ? 's' : '') + ' à choisir';
    const list = $('#talent-list'); list.innerHTML = '';
    for (const [key, tl] of Object.entries(CB.TALENTS)) { const b = document.createElement('button'); b.className = 'talent'; b.innerHTML = '<span class="ico">' + tl.icon + '</span><b>' + tl.name + '</b><small>' + tl.per + '</small><em>niveau ' + ((p.talents || {})[key] || 0) + '</em>'; b.onclick = () => { if (S.spendPoint(p, key)) { A.sfx('levelup'); persist(); showLevelUp(); } }; list.append(b); }
    if (!dlg.open) dlg.showModal(); list.querySelector('.talent').focus();
  }
  $('#levelup').onclose = () => { if (app.screen === 'map') { mapInfo(); $('#btn-level').classList.toggle('hidden', !(app.profile.points > 0)); } };
  $('#btn-level').onclick = () => { click(); showLevelUp(); };
  $('#btn-debug').onclick = () => { click(); CB.Debug.open(CB.Debug.fromSlot(app.wi, app.vi)); };
  $('#btn-new-wave').onclick = () => { click(); CB.Debug.open(CB.Debug.blank(app.wi, app.vi)); };

  // ---------- Vague ----------
  const W = { canvas: null, ctx: null, held: false, queued: 0, paused: false, resultShown: false, t: 0, tutorial: 0, snapshot: null };
  const CARD_KEYS = ['Digit1', 'Digit2', 'Digit3'];
  // custom : tableau personnalisé (mode Debug). Sans argument, on garde celui du debug en cours s'il y en a un.
  function startWave(custom) {
    if (custom === undefined) custom = app.debug ? app.custom : null;
    if (!custom && !S.waveUnlocked(app.profile, app.wi, app.vi)) { A.sfx('nope'); return; }
    A.init(); app.wave = new CB.Wave({ worldIndex: app.wi, waveIndex: app.vi, profile: app.profile, player: app.player, custom });
    W.speed = 1; W.freeze = false;
    W.held = false; W.queued = 0; W.paused = false; W.resultShown = false; W.t = 0; W.tutorial = 4.5; W.snapshot = { kills: 0, hp: app.wave.hp, bursts: 0, shots: 0, boss: false, shield: app.wave.shield, elites: 0, cards: 0, allyShots: 0 };
    show('wave');
  }
  SHOW.wave = () => {
    W.canvas = $('#wave-canvas'); W.ctx = W.canvas.getContext('2d');
    document.body.classList.toggle('debug', !!app.debug); $('#debug-panel').classList.toggle('hidden', !app.debug); if (app.debug) CB.Debug.render();
    badge($('#wave-badge'), app.player.id); $('#overlay-pause').classList.add('hidden'); $('#overlay-cards').classList.add('hidden'); $('#overlay-result').classList.add('hidden');
    const def = app.wave.def; $('#wave-tag').textContent = (def.type === 'boss' ? 'Boss · ' : 'Vague ' + (app.vi + 1) + ' · ') + def.name; $('#wave-text').textContent = def.text;
    const tut = $('#wave-tutorial'), touch = matchMedia('(pointer: coarse)').matches, auto = app.wave.stats.auto; tut.classList.remove('hidden');
    $('#wave-tutorial-text').innerHTML = (touch ? 'TOUCHE L’ÉCRAN POUR <b>TIRER</b>' : 'CLIQUE OU APPUIE SUR <kbd>ESPACE</kbd> POUR <b>TIRER</b>') + (auto ? '<br><small>MAINTIENS POUR TIRER EN CONTINU</small>' : '<br><small>UN TIR PAR CLIC · LE TIR AUTOMATIQUE S’ACHÈTE AU HANGAR</small>');
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
  $('#btn-resume').onclick = () => { click(); pause(false); }; $('#btn-restart').onclick = () => { click(); startWave(); }; $('#btn-quit').onclick = () => { click(); show('map'); };
  window.addEventListener('blur', () => { W.held = false; if (app.screen === 'wave' && app.wave && !app.wave.over && !app.wave.choice) pause(true); });
  function pause(on) {
    const w = app.wave; if (!w || w.over) return; W.paused = on; W.held = false; $('#overlay-pause').classList.toggle('hidden', !on);
    if (on) { $('#pause-world').textContent = 'Monde ' + (app.wi + 1) + ' · ' + CB.WORLDS[app.wi].name; $('#pause-pct').textContent = S.completion(app.profile) + ' %'; $('#pause-stats').innerHTML = '<div><b>' + w.kills + '</b>abattus</div><div><b>🪙 ' + fmt(w.gold) + '</b>cette vague</div><div><b>' + Math.round(w.hp) + ' / ' + w.maxHp + '</b>points de vie</div><div><b>' + Math.round(100 * w.hits / Math.max(1, w.shots)) + ' %</b>précision</div>'; $('#btn-resume').focus(); }
  }
  function showCards() {
    const w = app.wave, list = $('#card-list'); list.innerHTML = ''; A.sfx('card');
    w.choice.forEach((key, i) => { const c = CB.CARDS[key], el = document.createElement('button'); el.className = 'card'; el.style.position = 'relative'; el.innerHTML = '<kbd>' + (i + 1) + '</kbd><div class="ico">' + c.icon + '</div><b>' + c.name + '</b><small>' + c.desc + '</small>'; el.onclick = () => pick(i); list.append(el); });
    $('#overlay-cards').classList.remove('hidden');
    function pick(i) { if (!w.choice) return; w.pickCard(i); A.sfx('levelup'); $('#overlay-cards').classList.add('hidden'); ownedCards(); }
  }
  function ownedCards() { $('#wave-cards').innerHTML = app.wave.cards.map(k => '<span title="' + esc(CB.CARDS[k].name + ' : ' + CB.CARDS[k].desc) + '">' + CB.CARDS[k].icon + '</span>').join(''); }
  function hud() {
    const w = app.wave, d = w.def; goldPill($('#wave-gold'), app.profile.gold + w.gold);
    $('#wave-bar').style.width = Math.round(w.progress * 100) + '%';
    $('#wave-sub').textContent = d.type === 'kill' || d.type === 'killTimed' ? w.kills + ' / ' + d.goal + ' abattus' : d.type === 'boss' ? (w.boss ? Math.round(w.boss.hp) + ' PV' : w.bossSpawned ? '' : 'Le boss arrive…') : w.kills + ' abattus';
    const combo = $('#wave-combo'); combo.textContent = 'x' + w.combo; combo.classList.toggle('hot', w.combo >= 5);
    const hp = $('#wave-hp'); hp.style.height = Math.round(100 * w.hp / w.maxHp) + '%'; hp.classList.toggle('low', w.hp < w.maxHp * .3); $('#wave-hp-text').textContent = Math.ceil(w.hp) + (w.shield ? ' 🛡' + w.shield : '');
    $('#wave-timer').textContent = w.timeLeft != null ? '⏱ ' + Math.ceil(w.timeLeft) + ' s' : '⏱ ' + Math.floor(w.time) + ' s';
  }
  function waveFrame(dt) {
    const w = app.wave; if (!w) return; W.t += dt; I.poll();
    if (!W.paused && !W.freeze && !w.over && !w.choice) {
      const g = I.gamepad, kx = (I.keys.has('ArrowRight') || I.keys.has('KeyD') ? 1 : 0) - (I.keys.has('ArrowLeft') || I.keys.has('KeyA') ? 1 : 0), ky = (I.keys.has('ArrowDown') || I.keys.has('KeyS') ? 1 : 0) - (I.keys.has('ArrowUp') || I.keys.has('KeyW') ? 1 : 0);
      Object.assign(w.aim, CB.clampAim(w.aim.x + (kx + g.ax) * CB.VIEW.f * .8 * dt, w.aim.y + (ky + g.ay) * CB.VIEW.f * .6 * dt));
      if (w.stats.auto ? (W.held || I.keys.has('Space') || I.keys.has('Enter') || g.fire) : (I.consume('Space') || I.consume('Enter') || g.firePressed)) shoot();
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
    if (w.over && !W.resultShown) { W.resultShown = true; W.held = false; if (!app.debug) setTimeout(showResult, 1100); A.sfx(w.won ? 'win' : 'lose'); }
  }
  function showResult() {
    const w = app.wave; if (!w || app.screen !== 'wave') return; const r = CB.claim(app.profile, w); persist(); if (!r) return;
    const next = w.won ? (app.vi + 1 < CB.WAVES_PER_WORLD ? { wi: app.wi, vi: app.vi + 1 } : app.wi + 1 < CB.WORLDS.length ? { wi: app.wi + 1, vi: 0 } : null) : null;
    const news = []; if (r.levels) { news.push('⭐ Niveau ' + r.level + ' ! Choisis ton évolution.'); A.sfx('levelup'); }
    if (r.newWorld) news.push('🗺 Nouveau monde débloqué : ' + CB.WORLDS[app.wi + 1].name + ' !');
    if (w.won && w.vi === CB.WAVES_PER_WORLD - 1 && !app.profile.cannons.includes(CB.WORLDS[app.wi].cannon)) news.push('🔫 Nouveau canon au hangar : ' + CB.CANNONS[CB.WORLDS[app.wi].cannon].name + ' !');
    if (w.won && !next) news.push('🏆 Tu as terminé toute l’aventure ! Refais les tableaux pour trois étoiles partout.');
    const panel = $('#result-panel');
    panel.innerHTML = '<div class="kicker">' + (w.won ? 'TABLEAU TERMINÉ' : w.reason === 'temps' ? 'TEMPS ÉCOULÉ' : 'CANON DÉTRUIT') + '</div><h2 class="' + (w.won ? '' : 'lost') + '">' + (w.won ? (w.stars === 3 ? '★ Parfait !' : 'Bravo !') : 'On recommence plus fort !') + '</h2>'
      + '<div class="result-stars">' + [1, 2, 3].map(i => '<span class="' + (i <= w.stars ? 'on' : '') + '">★</span>').join('') + '</div>'
      + '<div class="result-rows"><div><span>Ennemis abattus</span><b>' + w.kills + '</b></div><div><span>Meilleur combo</span><b>x' + w.bestCombo + '</b></div><div class="gold"><span>Or gagné</span><b>🪙 +' + fmt(r.gold) + (w.bonusGold ? ' <small>(bonus ' + w.bonusGold + ')</small>' : '') + '</b></div><div><span>Expérience</span><b>+' + fmt(r.xp) + ' XP</b></div><div><span>Précision</span><b>' + Math.round(100 * w.hits / Math.max(1, w.shots)) + ' %</b></div><div><span>Niveau</span><b>' + app.profile.level + '</b></div></div>'
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
    if ((e.target.matches && e.target.matches('input, textarea, select')) || $('#help').open || $('#levelup').open) return;
    if (app.screen === 'title' && e.code === 'Enter') { click(); data.current && data.profiles[data.current] ? choose(data.current) : show('characters'); }
    else if (app.screen === 'characters') { const list = charList(), cols = Math.max(1, Math.floor($('#char-grid').clientWidth / 128)); const move = d => { app.charIndex = (app.charIndex + d + list.length) % list.length; A.sfx('click'); renderCharacters(); }; if (e.code === 'ArrowRight') move(1); else if (e.code === 'ArrowLeft') move(-1); else if (e.code === 'ArrowDown') move(cols); else if (e.code === 'ArrowUp') move(-cols); else if (e.code === 'Enter') { click(); choose(list[app.charIndex].id); } else if (e.code === 'Escape') back(); else if (e.code === 'PageUp' || e.code === 'PageDown') { const i = FAM_TABS.findIndex(t => t[0] === app.family); app.family = FAM_TABS[(i + (e.code === 'PageDown' ? 1 : -1) + FAM_TABS.length) % FAM_TABS.length][0]; app.charIndex = 0; renderCharacters(); } else return; e.preventDefault(); }
    else if (app.screen === 'map') { if (e.code === 'ArrowRight') { for (let v = app.vi + 1; v < CB.WAVES_PER_WORLD; v++) if (S.waveUnlocked(app.profile, app.wi, v)) { selectWave(v); break; } } else if (e.code === 'ArrowLeft') selectWave(app.vi - 1); else if (e.code === 'PageUp' || e.code === 'KeyQ') changeWorld(-1); else if (e.code === 'PageDown' || e.code === 'KeyE') changeWorld(1); else if (e.code === 'Enter') { click(); startWave(); } else if (e.code === 'Escape') back(); else if (e.code === 'KeyH') { click(); show('shop'); } else return; e.preventDefault(); }
    else if (app.screen === 'shop') { if (e.code === 'Escape') back(); else if (e.code === 'PageUp' || e.code === 'PageDown' || e.code === 'KeyQ' || e.code === 'KeyE') { const i = SHOP_TABS.findIndex(t => t[0] === app.shopTab); app.shopTab = SHOP_TABS[(i + (e.code === 'PageDown' || e.code === 'KeyE' ? 1 : -1) + SHOP_TABS.length) % SHOP_TABS.length][0]; click(); renderShop(); } }
  });
  I.onButton = code => { if (app.screen !== 'wave') window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); };
  Object.assign(app, { show, choose, startWave, pause, data, persist, W });
  show('title');
})(window.CB);
