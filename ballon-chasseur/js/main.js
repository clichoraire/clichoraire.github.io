// Menus, sélection des équipes, boucle du match, résultats et Coupe des familles.
(async function (BC) {
  'use strict';
  await window.FamilyHeads.ready;
  const $ = s => document.querySelector(s), S = BC.sprites;
  const app = BC.app = { screen: 'menu', settings: { difficulty: 1, sound: true }, game: null, cup: null, mode: 'solo' };
  const P_COLORS = ['#ffd166', '#5fe3ff'];
  try { Object.assign(app.settings, JSON.parse(localStorage.getItem('bc.settings') || '{}')); } catch (e) { }
  const save = () => { try { localStorage.setItem('bc.settings', JSON.stringify(app.settings)); } catch (e) { } };
  const cupSaved = () => { try { return JSON.parse(localStorage.getItem('bc.cups') || '{}'); } catch (e) { return {}; } };

  function show(id) {
    document.querySelectorAll('.screen').forEach(e => e.classList.add('hidden'));
    $('#screen-' + id).classList.remove('hidden'); app.screen = id; BC.input.capture = id === 'match';
  }
  const roleOf = d => BC.ROLES[d.role] || d.role;
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const birthText = d => { if (!d.birth) return ''; const b = new Date(d.birth + 'T00:00:00'); return `Né${d.look && d.look.lipstick || /a$|ie$|ée$/.test(d.name) ? 'e' : ''} le ${b.getDate() === 1 ? '1er' : b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`; };
  const statBar = (v, label) => `<span class="stat" title="${label}"><i>${label}</i>${'<b></b>'.repeat(v)}${'<u></u>'.repeat(5 - v)}</span>`;
  const statsHtml = d => `<div class="stats">${statBar(d.stats.speed, 'Vitesse')}${statBar(d.stats.power, 'Lancer')}${statBar(d.stats.catch, 'Attrapé')}${statBar(d.stats.hp, 'Endurance')}</div>`;

  // Fiche au survol : buste qui salue, naissance, âge, lancer spécial, stats.
  let hoverRaf = 0;
  function showCard(d, team, x, y) {
    const card = $('#hover-card'), P = BC.SUPERS[d.superShot];
    if (card.dataset.id !== d.name) {
      card.dataset.id = d.name; card.style.setProperty('--c', team.color);
      card.innerHTML = `<canvas width="150" height="170"></canvas><div class="hc-info"><h3>${d.name}${d.birth && BC.isBirthday(d.birth) ? ' 🎂' : ''}</h3>
        <div class="hc-role">${roleOf(d)} · ${team.name}</div>
        <div class="hc-birth">${birthText(d)} · ${d.custom ? 'Personnage de famille' : d.age + (d.age > 1 ? ' ans' : ' an')}${BC.isBirthday(d.birth) ? ' · Bonne fête !' : ''} · ${BC.phys(d).maxHp} points de vie</div>
        <div class="hc-power"><b>${P.icon} ${P.name}</b><span>${P.desc}</span></div>${statsHtml(d)}</div>`;
    }
    card.classList.remove('hidden');
    const cw = card.offsetWidth || 420, ch = card.offsetHeight || 200;
    card.style.left = Math.max(8, Math.min(innerWidth - cw - 8, x + 18)) + 'px';
    card.style.top = Math.max(8, Math.min(innerHeight - ch - 8, y + 18)) + 'px';
    const c = card.querySelector('canvas'), ctx = c.getContext('2d');
    cancelAnimationFrame(hoverRaf);
    (function anim() { if (card.classList.contains('hidden')) return; S.drawBust(ctx, d, team, c.width, c.height); hoverRaf = requestAnimationFrame(anim); })();
  }
  function hideCard() { $('#hover-card').classList.add('hidden'); cancelAnimationFrame(hoverRaf); }
  function moveCard(e) { const card = $('#hover-card'); if (card.classList.contains('hidden')) return; const cw = card.offsetWidth, ch = card.offsetHeight; card.style.left = Math.max(8, Math.min(innerWidth - cw - 8, e.clientX + 18)) + 'px'; card.style.top = Math.max(8, Math.min(innerHeight - ch - 8, e.clientY + 18)) + 'px'; }

  // ----- Menu -----
  function buildMenu() {
    $('#version').textContent = 'v' + BC.VERSION;
    const strip = $('#logos'); strip.innerHTML = '';
    for (const t of BC.TEAMS) { const c = document.createElement('canvas'); c.width = 90; c.height = 100; S.drawLogo(c.getContext('2d'), 45, 50, t, 80); c.title = t.name; strip.appendChild(c); }
    const d = $('#opt-diff'); d.innerHTML = BC.DIFFICULTIES.map((n, i) => `<option value="${i}">${n}</option>`).join('');
    d.value = app.settings.difficulty; d.onchange = () => { app.settings.difficulty = +d.value; save(); };
    const snd = $('#opt-sound'); snd.checked = app.settings.sound; snd.onchange = () => { app.settings.sound = snd.checked; BC.audio.setMuted(!snd.checked); save(); };
    BC.audio.muted = !app.settings.sound;
    $('#btn-solo').onclick = () => startSelect('solo');
    $('#btn-duo').onclick = () => startSelect('duo');
    $('#btn-cup').onclick = () => startSelect('cup');
    $('#btn-help').onclick = () => { $('#howto').scrollIntoView({ behavior: 'smooth' }); };
    const won = Object.keys(cupSaved()).length; $('#cups-won').textContent = won ? `${won} / ${BC.TEAMS.length} coupes gagnées` : '';
    buildHowto();
    // scène d'accueil : toute la famille lance des balles sur le terrain du parc
    const c = $('#menu-anim'), ctx = c.getContext('2d');
    const actors = Object.values(BC.PLAYERS).map((d, i) => { const team = BC.TEAMS.find(t => t.players.includes(d.id)); const left = i % 2 === 0; return { d, team, x: left ? 240 + (Math.floor(i / 2) % 4) * 85 : 1040 - (Math.floor(i / 2) % 4) * 85, y: 400 + Math.floor(i / 8) * 130 + (Math.floor(i / 2) % 2) * 60, dir: left ? 1 : -1, phase: i * 0.61 }; });
    let hovered = null, mouse = null;
    c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(); mouse = { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height, cx: e.clientX, cy: e.clientY }; });
    c.addEventListener('mouseleave', () => { mouse = null; hovered = null; hideCard(); });
    (function loop(now) {
      if (app.screen === 'menu') {
        let hit = null;
        for (const a of actors) if (mouse && Math.abs(mouse.x - a.x) < 28 && mouse.y < a.y + 8 && mouse.y > a.y - 90) hit = a;
        if (hit !== hovered) { hovered = hit; if (hit) showCard(hit.d, hit.team, mouse.cx, mouse.cy); else hideCard(); }
        c.style.cursor = hit ? 'pointer' : 'default';
        BC.render.drawMenuScene(ctx, actors, now / 1000, hovered);
        ctx.fillStyle = '#ffd166'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = '#1b1b1b';
        ctx.strokeText('La famille s’échauffe !', 640, 230); ctx.fillText('La famille s’échauffe !', 640, 230);
        ctx.font = '18px Arial'; ctx.lineWidth = 4; ctx.strokeText('Survole un joueur pour le rencontrer', 640, 260); ctx.fillStyle = '#fff'; ctx.fillText('Survole un joueur pour le rencontrer', 640, 260);
      }
      requestAnimationFrame(loop);
    })(performance.now());
  }

  // ----- Comment jouer -----
  const KEY = k => `<kbd class="kcap">${k}</kbd>`;
  const HOWTO = [
    { icon: '🏃', cat: 'Déplacement', color: '#5fe3ff', title: 'Bouger sur le terrain', text: 'Déplace ton joueur dans sa moitié de terrain. Appuie deux fois vite vers l\'avant pour partir à la course !', keys: `<div class="krow">${KEY('⬆')}</div><div class="krow">${KEY('⬅')}${KEY('⬇')}${KEY('➡')}</div>`, label: 'Flèches · deux fois ➡ = course · joueur 2 : W A S D' },
    { icon: '🎯', cat: 'Lancer', color: '#ffd166', title: 'Viser et lancer', text: 'La balle part tout droit devant toi. Place-toi à la même hauteur que ton adversaire, puis lance !', keys: `<div class="krow">${KEY('X')}</div>`, label: 'Touche X avec la balle · joueur 2 : G' },
    { icon: '🧤', cat: 'Défense', color: '#7dffa0', title: 'Attraper la balle', text: 'Appuie juste au moment où la balle arrive sur toi : si tu l\'attrapes, zéro dégât et c\'est à toi de lancer !', keys: `<div class="krow">${KEY('C')}</div>`, label: 'Touche C sans la balle · joueur 2 : H' },
    { icon: '🦘', cat: 'Esquive', color: '#ff8a7a', title: 'Sauter par-dessus', text: 'Sans la balle, X te fait sauter : la balle passe sous tes pieds. Tu peux aussi simplement t\'écarter vers le haut ou le bas.', keys: `<div class="krow">${KEY('X')}</div>`, label: 'Touche X sans la balle · joueur 2 : G' },
    { icon: '🤝', cat: 'Passe', color: '#d7a6ff', title: 'Passer aux coéquipiers', text: 'Tes trois coéquipiers de l\'extérieur entourent l\'adversaire. ⬆ + C passe en haut, ⬇ + C en bas, ➡ + C au fond. C tout seul passe à un coéquipier intérieur.', keys: `<div class="krow">${KEY('⬆')}${KEY('C')}</div>`, label: 'Direction + C avec la balle · joueur 2 : H' },
    { icon: '💥', cat: 'Spécial', color: '#ffd166', title: 'Lancer spécial', text: 'Cours avec la balle et lance au bon pas (le troisième et les suivants), ou cours, saute avec C et lance au sommet du saut. Chaque joueur a son lancer à lui !', keys: `<div class="krow">${KEY('➡')}${KEY('➡')}${KEY('X')}</div>`, label: 'Course puis X au bon moment · ou course, C puis X en l\'air' },
    { icon: '👨‍👩‍👧', cat: 'Équipe', color: '#5fe3ff', title: 'Choisir ton joueur', text: 'Tu contrôles celui qui a la balle ou celui que la balle vise. Pour changer toi-même : 1, 2 ou 3.', keys: `<div class="krow">${KEY('1')}${KEY('2')}${KEY('3')}</div>`, label: 'Touches 1, 2, 3 · joueur 2 : 8, 9, 0' },
    { icon: '🎮', cat: 'Manette', color: '#7dffa0', title: 'Avec une manette', text: 'Le stick pour bouger, A pour lancer ou sauter, B pour passer ou attraper, LB / RB pour changer de joueur, Start pour la pause.', keys: `<div class="krow">${KEY('A')}${KEY('B')}</div>`, label: 'Manette Xbox ou autre' },
    { icon: '🏆', cat: 'Le but du jeu', color: '#ff8a7a', title: 'Gagner le match', text: 'Chaque joueur a des points de vie (en bas de l\'écran). Vide ceux des trois joueurs intérieurs de l\'autre équipe : ils montent au ciel en petits anges ! Dans la Coupe, bats les trois autres familles.', keys: `<div class="krow"><span class="kbig">🎯 + 💥 = 😇</span></div>`, label: 'Échap ou P : pause · M : son' },
  ];
  function buildHowto() {
    const grid = $('#howto-grid'); if (!grid) return;
    grid.innerHTML = HOWTO.map(h => `<div class="howto-card" style="--c:${h.color}"><div class="howto-top"><span class="howto-icon">${h.icon}</span><span class="howto-cat">${h.cat}</span></div><h3>${h.title}</h3><p>${h.text}</p><div class="howto-keys">${h.keys}<div class="klabel">${h.label}</div></div></div>`).join('');
  }

  // ----- Sélection -----
  let pick = null;
  function startSelect(mode) {
    BC.audio.init(); BC.audio.play('ui');
    app.mode = mode; pick = { step: 1, a: null };
    buildCards(); updateSelTitle(); show('select');
  }
  function updateSelTitle() {
    const t = $('#sel-title');
    if (pick.step === 1) t.innerHTML = app.mode === 'cup' ? '<span class="j1">Coupe des familles</span> — choisis ta famille' : '<span class="j1">Joueur 1</span>, choisis ta famille';
    else t.innerHTML = app.mode === 'duo' ? '<span class="j2">Joueur 2</span>, choisis ta famille' : 'Choisis la famille <span class="cpu">adverse</span> (ordi) — le match se joue chez elle';
    document.querySelectorAll('.card').forEach(c => c.classList.toggle('taken', pick.a === c.dataset.id));
  }
  function buildCards() {
    const box = $('#cards'); box.innerHTML = ''; const cups = cupSaved();
    for (const t of BC.TEAMS) {
      const card = document.createElement('div'); card.className = 'card'; card.dataset.id = t.id; card.style.setProperty('--c', t.color); card.style.setProperty('--c2', t.color2);
      const logo = document.createElement('canvas'); logo.width = 70; logo.height = 76; S.drawLogo(logo.getContext('2d'), 35, 38, t, 62);
      const head = document.createElement('div'); head.className = 'card-head'; head.appendChild(logo);
      const n = t.players.length, lent = Math.max(0, BC.INNER + BC.OUTER - n);
      head.insertAdjacentHTML('beforeend', `<div><h2>${t.name}${cups[t.id] ? ' 🏆' : ''}</h2><small>${BC.COURTS[t.court].name} · ${n} joueur${n > 1 ? 's' : ''}${lent ? ` + ${lent} cousin${lent > 1 ? 's' : ''} prêté${lent > 1 ? 's' : ''}` : ''}</small></div>`);
      card.appendChild(head);
      const list = document.createElement('div'); list.className = 'roster';
      t.players.forEach((pid, k) => {
        const d = BC.PLAYERS[pid], P = BC.SUPERS[d.superShot];
        const row = document.createElement('div'); row.className = 'pl' + (k >= BC.INNER ? ' bench' : '');
        row.appendChild(S.portrait(d, t, 64, 78, 1.15));
        row.insertAdjacentHTML('beforeend', `<div class="pl-info"><b>${d.name}${BC.isBirthday(d.birth) ? ' 🎂' : ''}</b> <em>${roleOf(d)} · ${d.custom ? 'Personnage de famille' : d.age + (d.age > 1 ? ' ans' : ' an')} · ${BC.phys(d).maxHp} PV</em>${statsHtml(d)}<div class="power" title="${P.desc}">${P.icon} ${P.name}</div></div>`);
        row.addEventListener('mouseenter', e => showCard(d, t, e.clientX, e.clientY));
        row.addEventListener('mousemove', moveCard);
        row.addEventListener('mouseleave', hideCard);
        list.appendChild(row);
      });
      card.appendChild(list);
      card.onclick = () => choose(t.id);
      box.appendChild(card);
    }
    $('#btn-sel-back').onclick = () => { BC.audio.play('ui'); show('menu'); };
  }
  function choose(id) {
    BC.audio.play('ui');
    if (pick.step === 1) {
      pick.a = id;
      if (app.mode === 'cup') { startCup(id); return; }
      pick.step = 2; updateSelTitle(); return;
    }
    if (id === pick.a) { BC.audio.play('bad'); return; }
    startMatch(pick.a, id, app.mode === 'duo' ? ['p1', 'p2'] : ['p1', 'cpu']);
  }

  // ----- Coupe -----
  const CUP_ORDER = ['bibi', 'jay', 'jo', 'matt'];
  function startCup(id) { app.cup = { team: id, opponents: CUP_ORDER.filter(x => x !== id), index: 0, results: [] }; nextCupMatch(); }
  function nextCupMatch() { const c = app.cup; startMatch(c.team, c.opponents[c.index], ['p1', 'cpu']); }

  // ----- Match -----
  const ui = { humans: [] };
  let raf = 0, acc = 0, lastT = 0, paused = false;
  function startMatch(aId, bId, ctrl) {
    BC.audio.init();
    const g = new BC.Game({ teams: [BC.teamById(aId), BC.teamById(bId)], ctrl, difficulty: app.settings.difficulty, intro: true });
    app.game = g; ui.humans = []; paused = false;
    ctrl.forEach((c, i) => { if (c === 'p1') ui.humans.push({ team: i, n: 1, label: 'JOUEUR 1', color: P_COLORS[0] }); if (c === 'p2') ui.humans.push({ team: i, n: 2, label: 'JOUEUR 2', color: P_COLORS[1] }); });
    $('#pause').classList.add('hidden');
    show('match'); BC.input.flush();
    acc = 0; lastT = performance.now(); BC.audio.crowd(0.12);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  const canvas = $('#game'), ctx = canvas.getContext('2d');
  function frame(now) {
    const g = app.game; if (!g || app.screen !== 'match') return;
    raf = requestAnimationFrame(frame);
    let dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    if (BC.input.consume('Escape') || BC.input.consume('KeyP')) { paused = !paused; $('#pause').classList.toggle('hidden', !paused); BC.input.flush(); }
    if (BC.input.consume('KeyM')) { app.settings.sound = !app.settings.sound; BC.audio.setMuted(!app.settings.sound); $('#opt-sound').checked = app.settings.sound; save(); }
    if (paused) { BC.render.draw(ctx, g, ui); return; }
    acc += dt;
    const inputs = [null, null];
    for (const h of ui.humans) inputs[h.team] = BC.input.get(h.n);
    while (acc >= BC.STEP) { g.update(BC.STEP, inputs); acc -= BC.STEP; }
    for (const e of g.events) {
      const sfx = { throw: 'throw', throwSuper: 'super', pass: 'pass', catch: 'catch', hit: 'hit', bounce: 'bounce', jump: 'jump', dash: 'dash', ko: 'ko', whistle: 'whistle', teleport: 'teleport', win: 'win' }[e.type];
      if (sfx) BC.audio.play(sfx);
      if (e.type === 'hit') BC.audio.crowd(e.ko ? 0.5 : 0.3, 0.1), setTimeout(() => BC.audio.crowd(0.12, 0.8), 900);
    }
    g.events.length = 0;
    BC.render.draw(ctx, g, ui);
    if (g.phase === 'end' && g.endT > 3) showResult();
  }
  $('#btn-resume').onclick = () => { paused = false; $('#pause').classList.add('hidden'); BC.input.flush(); };
  $('#btn-quit').onclick = () => { paused = false; app.cup = null; show('menu'); };

  // ----- Résultat -----
  function showResult() {
    const g = app.game, A = g.teams[0], B = g.teams[1], won = g.winner === 0;
    const box = $('#result'); let html = '';
    const cup = app.cup; let cupText = '';
    if (cup) {
      cup.results[cup.index] = { opp: cup.opponents[cup.index], won };
      if (won) { cup.index++; if (cup.index >= cup.opponents.length) { cupText = '🏆 CHAMPIONS DE LA COUPE DES FAMILLES ! 🏆'; const c = cupSaved(); c[cup.team] = Date.now(); try { localStorage.setItem('bc.cups', JSON.stringify(c)); } catch (e) { } } else cupText = `Victoire ! Prochain match chez ${BC.teamById(cup.opponents[cup.index]).name}`; }
      else cupText = 'Défaite… Tu peux réessayer ce match.';
    }
    const winner = g.teams[g.winner];
    html += `<div class="final"><b style="color:${winner.color}">${winner.name}</b> gagnent !</div>`;
    if (cupText) html += `<div class="cup-text">${cupText}</div>`;
    html += '<div class="cols">';
    for (let t = 0; t < 2; t++) {
      const team = g.teams[t], st = g.stats[t];
      html += `<div><h3 style="color:${team.color}">${team.name}</h3><table><tr><th>Joueur</th><th>Points de vie</th></tr>`;
      for (const p of g.inner(t)) html += `<tr><td>${p.def.name}</td><td>${p.alive ? p.hp + ' / ' + p.maxHp : '😇 K.-O.'}</td></tr>`;
      html += `<tr class="tot"><td>Lancers</td><td>${st.throws}</td></tr><tr class="tot"><td>Lancers spéciaux</td><td>${st.supers}</td></tr><tr class="tot"><td>Touchés</td><td>${st.hits}</td></tr><tr class="tot"><td>Attrapés</td><td>${st.catches}</td></tr></table></div>`;
    }
    html += '</div>';
    box.innerHTML = html;
    const b = $('#result-buttons'); b.innerHTML = '';
    const btn = (label, fn, cls) => { const e = document.createElement('button'); e.textContent = label; if (cls) e.className = cls; e.onclick = fn; b.appendChild(e); };
    if (cup) {
      if (cup.index >= cup.opponents.length) btn('Retour au menu', () => { app.cup = null; show('menu'); buildMenu(); }, 'primary');
      else if (cup.results[cup.index] && !cup.results[cup.index].won) { btn('Réessayer', nextCupMatch, 'primary'); btn('Abandonner la coupe', () => { app.cup = null; show('menu'); }); }
      else { btn('Match suivant', nextCupMatch, 'primary'); btn('Abandonner la coupe', () => { app.cup = null; show('menu'); }); }
    } else {
      btn('Revanche', () => startMatch(A.id, B.id, g.ctrl), 'primary');
      btn('Changer d\'équipes', () => startSelect(app.mode));
      btn('Menu', () => show('menu'));
    }
    show('result');
  }
  window.addEventListener('keydown', e => {
    if (app.screen === 'result' && e.code === 'Enter') { const f = $('#result-buttons button'); if (f && document.activeElement !== f) f.click(); }
  });

  BC.input.init();
  buildMenu();
  // Paramètres d'adresse pour tester : ?match=matt,jo&cpu=1&diff=2
  const q = new URLSearchParams(location.search);
  if (q.get('match')) {
    const [a, b] = q.get('match').split(','); if (q.get('diff')) app.settings.difficulty = +q.get('diff');
    startMatch(a || 'matt', b || 'jo', q.get('cpu') === '2' ? ['cpu', 'cpu'] : ['p1', 'cpu']);
    const skip = +q.get('t') || 0; for (let i = 0; i < skip * 60; i++) app.game.update(BC.STEP, [null, null]); app.game.events.length = 0;   // avance rapide (captures)
  }
  if (q.get('screen') === 'select') startSelect(q.get('mode') || 'solo');
})(window.BC);
