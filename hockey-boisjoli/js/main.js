// Menus, sélection des équipes, boucle du match, résultats et Coupe Boisjoli.
(function (HK) {
  'use strict';
  const $ = s => document.querySelector(s), S = HK.sprites;
  const app = HK.app = { screen: 'menu', settings: { periodLen: 120, difficulty: 1, sound: true }, game: null, cup: null, mode: 'solo' };
  const P_COLORS = ['#ffd166', '#5fe3ff'];
  try { Object.assign(app.settings, JSON.parse(localStorage.getItem('hk.settings') || '{}')); } catch (e) { }
  const save = () => { try { localStorage.setItem('hk.settings', JSON.stringify(app.settings)); } catch (e) { } };

  function show(id) {
    document.querySelectorAll('.screen').forEach(e => e.classList.add('hidden'));
    $('#screen-' + id).classList.remove('hidden'); app.screen = id; HK.input.capture = id === 'match';
  }
  const roleOf = d => HK.ROLES[d.role] || d.role;
  const statBar = (v, label) => `<span class="stat" title="${label}"><i>${label}</i>${'<b></b>'.repeat(v)}${'<u></u>'.repeat(5 - v)}</span>`;

  // ----- Menu -----
  function buildMenu() {
    const strip = $('#logos'); strip.innerHTML = '';
    for (const t of HK.TEAMS) {
      const c = document.createElement('canvas'); c.width = 90; c.height = 100; S.drawLogo(c.getContext('2d'), 45, 50, t, 80); c.title = t.name; strip.appendChild(c);
    }
    const sel = $('#opt-period'); sel.innerHTML = HK.PERIOD_LENGTHS.map(v => `<option value="${v}">${v / 60} min</option>`).join('');
    sel.value = app.settings.periodLen; sel.onchange = () => { app.settings.periodLen = +sel.value; save(); };
    const d = $('#opt-diff'); d.innerHTML = HK.DIFFICULTIES.map((n, i) => `<option value="${i}">${n}</option>`).join('');
    d.value = app.settings.difficulty; d.onchange = () => { app.settings.difficulty = +d.value; save(); };
    const snd = $('#opt-sound'); snd.checked = app.settings.sound; snd.onchange = () => { app.settings.sound = snd.checked; HK.audio.muted = !snd.checked; if (HK.audio.master) HK.audio.master.gain.value = snd.checked ? 0.5 : 0; HK.music.setMuted(!snd.checked); save(); };
    HK.audio.muted = !app.settings.sound; HK.music.setMuted(!app.settings.sound);
    $('#btn-solo').onclick = () => startSelect('solo');
    $('#btn-duo').onclick = () => startSelect('duo');
    $('#btn-cup').onclick = () => startSelect('cup');
    $('#btn-practice').onclick = () => startSelect('practice');
    $('#stars-total').textContent = HK.drillStars.total() + ' / ' + HK.DRILLS.length * 3;
    $('#btn-help').onclick = () => { $('#help').classList.toggle('hidden'); };
    // petite animation : les joueurs patinent sous le titre
    const c = $('#menu-anim'), ctx = c.getContext('2d'); const all = Object.keys(HK.PLAYERS);
    const skaters = all.map((id, i) => ({ d: HK.PLAYERS[id], team: HK.TEAMS.find(t => t.players.includes(id) || t.goalie === id), goalie: HK.TEAMS.some(t => t.goalie === id), x: Math.random() * c.width, y: 50 + (i % 3) * 30, v: 40 + Math.random() * 50, dir: Math.random() < 0.5 ? 1 : -1, f: Math.random() * 6 })).filter(s => s.team);
    let last = performance.now();
    (function loop(now) {
      if (app.screen !== 'menu') { requestAnimationFrame(loop); return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, c.width, c.height);
      skaters.sort((a, b) => a.y - b.y);
      for (const s of skaters) {
        s.x += s.v * s.dir * dt; s.f += dt * 7;
        if (s.x > c.width + 40) s.dir = -1; if (s.x < -40) s.dir = 1;
        S.drawPerson(ctx, s.x, s.y + 40, s.d, s.team, { dir: s.dir, frame: s.f, moving: true, scale: 1.1, goalie: s.goalie });
      }
      requestAnimationFrame(loop);
    })(last);
  }

  // ----- Sélection -----
  let pick = null;
  function startSelect(mode) {
    HK.audio.init(); HK.audio.play('ui');
    app.mode = mode; pick = { step: 1, a: null };
    buildCards(); updateSelTitle(); show('select');
  }
  function updateSelTitle() {
    const t = $('#sel-title');
    if (pick.step === 1) t.innerHTML = app.mode === 'cup' ? '<span class="j1">Coupe Boisjoli</span> — choisis ton équipe' : app.mode === 'practice' ? '<span class="j1">Pratique</span> — choisis ton équipe' : '<span class="j1">Joueur 1</span>, choisis ton équipe';
    else t.innerHTML = app.mode === 'duo' ? '<span class="j2">Joueur 2</span>, choisis ton équipe' : app.mode === 'practice' ? 'Choisis le <span class="cpu">gardien adverse</span> (son équipe)' : 'Choisis l\'équipe <span class="cpu">adverse</span> (ordi)';
    document.querySelectorAll('.card').forEach(c => c.classList.toggle('taken', pick.a === c.dataset.id));
  }
  function buildCards() {
    const box = $('#cards'); box.innerHTML = '';
    for (const t of HK.TEAMS) {
      const card = document.createElement('div'); card.className = 'card'; card.dataset.id = t.id; card.style.setProperty('--c', t.accent || t.color); card.style.setProperty('--c2', t.color2);
      const logo = document.createElement('canvas'); logo.width = 70; logo.height = 76; S.drawLogo(logo.getContext('2d'), 35, 38, t, 62);
      const head = document.createElement('div'); head.className = 'card-head'; head.appendChild(logo);
      head.insertAdjacentHTML('beforeend', `<div><h2>${t.name}</h2><small>${t.players.length} joueurs · ${t.players.length > HK.ON_ICE ? (t.players.length - HK.ON_ICE) + ' au banc' : 'aucun remplaçant'}${t.goalie ? ' · gardien : ' + HK.PLAYERS[t.goalie].name : ''}</small></div>`);
      card.appendChild(head);
      const list = document.createElement('div'); list.className = 'roster';
      t.players.forEach((pid, k) => {
        const d = HK.PLAYERS[pid], P = HK.POWERS[d.power];
        const row = document.createElement('div'); row.className = 'pl' + (k >= HK.ON_ICE ? ' bench' : '');
        row.appendChild(S.portrait(d, t, 64, 78, 1.15));
        row.insertAdjacentHTML('beforeend', `<div class="pl-info"><b>${d.name}</b> <em>${roleOf(d)} · ${d.age} ans</em>
          <div class="stats">${statBar(d.stats.speed, 'Vitesse')}${statBar(d.stats.shot, 'Tir')}${statBar(d.stats.force, 'Force')}${statBar(d.stats.control, 'Contrôle')}</div>
          <div class="power" title="${P.desc}">${P.icon} ${P.name}</div></div>`);
        list.appendChild(row);
      });
      card.appendChild(list);
      card.onclick = () => choose(t.id);
      box.appendChild(card);
    }
    $('#btn-sel-back').onclick = () => { HK.audio.play('ui'); show('menu'); };
  }
  function choose(id) {
    HK.audio.play('ui');
    if (pick.step === 1) {
      pick.a = id;
      if (app.mode === 'cup') { startCup(id); return; }
      pick.step = 2; updateSelTitle(); return;
    }
    if (id === pick.a && app.mode !== 'duo') { HK.audio.play('bad'); return; }
    if (app.mode === 'practice') { startPractice(pick.a, id); return; }
    startMatch(pick.a, id, app.mode === 'duo' ? ['p1', 'p2'] : ['p1', 'cpu']);
  }

  // ----- Coupe -----
  const CUP_ORDER = ['bibi', 'jay', 'jo', 'matt', 'boys'];
  function startCup(id) {
    app.cup = { team: id, opponents: CUP_ORDER.filter(x => x !== id), index: 0, results: [] };
    nextCupMatch();
  }
  function nextCupMatch() {
    const c = app.cup; startMatch(c.team, c.opponents[c.index], ['p1', 'cpu']);
  }

  // ----- Match -----
  const ui = { humans: [], toasts: [], shake: 0, drill: null };
  let raf = 0, acc = 0, lastT = 0, paused = false, excite = 0.25;
  app.practice = null;
  function startMatch(aId, bId, ctrl) {
    HK.audio.init();
    const g = new HK.Game({ teams: [HK.teamById(aId), HK.teamById(bId)], ctrl, periodLen: app.settings.periodLen, difficulty: app.settings.difficulty, intro: true });
    app.game = g; app.practice = null; ui.humans = []; ui.toasts = []; ui.shake = 0; ui.drill = null; paused = false; lastPhase = null;
    $('#prac-ui').classList.add('hidden'); $('#skip-btn').classList.remove('hidden');
    HK.music.stopAll();
    ctrl.forEach((c, i) => { if (c === 'p1') ui.humans.push({ team: i, n: 1, label: 'JOUEUR 1', color: P_COLORS[0] }); if (c === 'p2') ui.humans.push({ team: i, n: 2, label: 'JOUEUR 2', color: P_COLORS[1] }); });
    $('#pause').classList.add('hidden');
    show('match'); HK.input.flush();
    acc = 0; lastT = performance.now(); HK.audio.crowd(0.25);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    toast('Période de ' + (g.periodLen / 60) + ' min · ' + (ctrl[1] === 'cpu' ? 'Ordi ' + HK.DIFFICULTIES[g.difficulty].toLowerCase() : '2 joueurs'), 3);
  }
  // Musique selon la phase : orgue à l'entrée et pendant les arrêts, hymne à l'alignement, chansons pendant le jeu, chanson de but.
  let lastPhase = null;
  function musicForPhase(g) {
    const ph = g.phase === 'intro' ? 'intro-' + g.intro.part : g.phase;
    if (ph === lastPhase) return; const prev = lastPhase; lastPhase = ph;
    const Mu = HK.music;
    if (ph === 'intro-entrance') Mu.hey();
    else if (ph === 'intro-anthem') Mu.anthem(() => { if (g.phase === 'intro') g.skipIntro(); });
    else if (ph === 'play') { Mu.stopAnthem(); Mu.stopOrgan(); Mu.music(); }
    else if (ph === 'goal') Mu.goalSong(6);
    else if (ph === 'over') { Mu.pauseMusic(); Mu.goalSong(12); }
    else { Mu.stopAnthem(); Mu.pauseMusic(); if (prev !== 'goal') Mu.organ(); else setTimeout(() => { if (g.phase !== 'play') Mu.organ(); }, 4500); }
    $('#skip-btn').classList.toggle('hidden', g.phase !== 'intro');
  }
  $('#skip-btn').onclick = () => { const g = app.game; if (g && g.phase === 'intro') { HK.audio.play('ui'); g.skipIntro(); } };
  function toast(text, t, color) { ui.toasts.push({ text, t: t || 2.5, color }); if (ui.toasts.length > 4) ui.toasts.shift(); }
  function frame(now) {
    const g = app.game; if (!g || app.screen !== 'match') return;
    raf = requestAnimationFrame(frame);
    const dtReal = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    const I = HK.input;
    if (I.consume('Escape') || I.consume('KeyP')) { paused = !paused; $('#pause').classList.toggle('hidden', !paused); HK.audio.play('ui'); if (paused) HK.music.pauseAll(); else HK.music.resumeAll(); }
    if (I.consume('KeyM')) { const m = HK.audio.toggle(); HK.music.setMuted(m); app.settings.sound = !m; save(); $('#opt-sound').checked = !m; toast(m ? 'Son coupé' : 'Son activé', 1.5); }
    if (g.phase === 'intro' && (I.consume('Enter') || I.consume('Space'))) { g.skipIntro(); HK.audio.play('ui'); }
    musicForPhase(g);
    if (g.phase === 'over' && (I.consume('Enter') || I.consume('Space') || I.anyPadButton())) { endMatch(); return; }
    const P = app.practice;
    if (P && P.state === 'running' && I.consume('Backspace')) stopDrill();
    if (!paused) {
      acc += dtReal;
      let n = 0;
      while (acc >= HK.STEP && n++ < 4) {
        for (const h of ui.humans) g.setHuman(h.team, I.get(h.n));
        g.update(HK.STEP); acc -= HK.STEP;
        const evs = g.takeEvents(); handleEvents(g, evs);
        if (P) { P.tick(HK.STEP, evs); ui.drill = P.hud(); }
      }
      for (const t of ui.toasts) t.t -= dtReal; ui.toasts = ui.toasts.filter(t => t.t > 0);
      ui.shake = Math.max(0, ui.shake - dtReal * 3);
      excite = Math.max(0.2, excite - dtReal * 0.15);
      HK.audio.crowd(excite);
    }
    HK.render($('#game').getContext('2d'), g, ui);
  }
  function handleEvents(g, evs) {
    const A = HK.audio;
    for (const e of evs) {
      switch (e.type) {
        case 'whistle': A.play('whistle'); break;
        case 'pass': A.play('pass'); break;
        case 'shot': A.play('shot'); excite = Math.min(0.6, excite + 0.1); break;
        case 'slapshot': A.play('slap'); break;
        case 'board': case 'boards': A.play('board'); break;
        case 'post': A.play('post'); toast('Poteau !', 1.5); excite = Math.min(0.8, excite + 0.2); break;
        case 'hit': A.play('hit'); ui.shake = Math.max(ui.shake, 0.5); excite = Math.min(0.7, excite + 0.1); break;
        case 'save': A.play('save'); excite = Math.min(0.7, excite + 0.15); break;
        case 'steal': A.play('steal'); break;
        case 'goal': A.play('goal'); ui.shake = 1; excite = 1; break;
        case 'periodEnd': A.play('period'); break;
        case 'over': A.play('win'); A.crowd(0.8); break;
        case 'change': toast(g.teams[e.team].def.name + ' : ' + e.inn.def.name + ' remplace ' + e.out.def.name, 3, g.teams[e.team].def.color); break;
        case 'power': {
          const P = HK.POWERS[e.power];
          A.play(e.power === 'crise' ? 'scream' : e.power === 'laser' ? 'laser' : 'power');
          toast(P.icon + ' ' + e.s.def.name + ' : ' + P.name + ' !', 2.5, g.teams[e.s.team].def.color);
          if (e.power === 'charge' || e.power === 'crise') ui.shake = 1; break;
        }
        case 'through': toast('À travers le gardien !', 2); break;
        case 'penalty': toast(e.s.def.name + ' au banc des punitions (' + e.t + ' s) !', 3, '#d9342b'); A.play('whistle'); break;
        case 'penaltyOver': toast(e.s.def.name + ' revient au jeu', 2); break;
        case 'perfect': toast('Tir du 66 !', 2, '#ffd700'); break;
        case 'target': A.play('post'); toast('Cible touchée !', 1.5, '#5ad66b'); break;
        case 'gate': A.play('ui'); break;
        case 'cone': A.play('board'); break;
        case 'drillWon': A.play('win'); break;
        case 'drillLost': A.play('bad'); break;
        case 'faceoff': if (g.ot && g.clock === 0 && g.period > HK.PERIODS) A.play('period'); break;
      }
    }
  }
  // ----- Pratique -----
  function startPractice(aId, bId) {
    HK.audio.init();
    const g = new HK.Game({ teams: [HK.teamById(aId), HK.teamById(bId)], ctrl: ['p1', 'cpu'], periodLen: 120, difficulty: 1, practice: true, lineup: { 0: [HK.teamById(aId).players[0]], 1: [] } });
    app.game = g; ui.humans = [{ team: 0, n: 1, label: 'PRATIQUE', color: P_COLORS[0] }]; ui.toasts = []; ui.shake = 0; ui.drill = null; paused = false; lastPhase = null;
    HK.music.stopAll(); $('#skip-btn').classList.add('hidden');
    const P = app.practice = new HK.Practice(g);
    P.onMsg = t => toast(t, 2, '#e8352b');
    P.onFinish = won => { setTimeout(showDrillResult, 1400); };
    $('#pause').classList.add('hidden'); $('#prac-ui').classList.remove('hidden');
    buildPracticePanel(); openPanel(false);
    show('match'); HK.input.flush();
    acc = 0; lastT = performance.now(); HK.audio.crowd(0.15);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    toast('Pratique libre : seul contre le gardien. Clique sur « Pratiques » pour choisir un exercice.', 4);
  }
  let panelSection = 'attaque';
  function openPanel(open) { $('#prac-panel').classList.toggle('hidden', !open); $('#prac-result').classList.add('hidden'); if (open) renderDrillList(); }
  function buildPracticePanel() {
    const P = app.practice, g = app.game;
    $('#prac-open').onclick = () => { HK.audio.play('ui'); openPanel(true); };
    $('#prac-close').onclick = () => openPanel(false);
    $('#prac-stop').onclick = () => { HK.audio.play('ui'); stopDrill(); };
    $('#prac-quit').onclick = () => { app.practice = null; HK.music.stopAll(); show('menu'); $('#stars-total').textContent = HK.drillStars.total() + ' / ' + HK.DRILLS.length * 3; };
    const tabs = $('#prac-tabs'); tabs.innerHTML = '';
    for (const sec of HK.DRILL_SECTIONS) { const b = document.createElement('button'); b.textContent = sec.icon + ' ' + sec.name; b.dataset.id = sec.id; b.onclick = () => { panelSection = sec.id; renderDrillList(); }; tabs.appendChild(b); }
    const sel = $('#prac-skater'); sel.innerHTML = g.teams[0].def.players.map(pid => `<option value="${pid}">${HK.PLAYERS[pid].name} · ${HK.POWERS[HK.PLAYERS[pid].power].icon} ${HK.POWERS[HK.PLAYERS[pid].power].name}</option>`).join('');
    sel.value = P.me.id; sel.onchange = () => { P.setSkater(sel.value); sel.blur(); };
  }
  function renderDrillList() {
    const stars = HK.drillStars.load(), list = $('#prac-list'); list.innerHTML = '';
    document.querySelectorAll('#prac-tabs button').forEach(b => b.classList.toggle('active', b.dataset.id === panelSection));
    $('#prac-stars').textContent = '⭐ ' + HK.drillStars.total() + ' / ' + HK.DRILLS.length * 3;
    for (const d of HK.DRILLS.filter(d => d.section === panelSection)) {
      const st = stars[d.id] || [false, false, false];
      const row = document.createElement('div'); row.className = 'drill';
      row.innerHTML = `<div class="drill-head"><b>${d.icon} ${d.name}</b><span class="drill-stars">${st.map(v => v ? '★' : '☆').join('')}</span></div><p>${d.desc}</p><div class="drill-levels"></div>`;
      const lv = row.querySelector('.drill-levels');
      HK.DRILL_LEVELS.forEach((name, i) => {
        const b = document.createElement('button'); b.className = st[i] ? 'done' : ''; b.innerHTML = `${name} <small>${d.unit ? d.need[i] + ' ' + d.unit : d.time[i] + ' s'}${d.unit ? ' · ' + d.time[i] + ' s' : ''}</small>`;
        b.onclick = () => startDrill(d.id, i); lv.appendChild(b);
      });
      list.appendChild(row);
    }
  }
  function startDrill(id, level) {
    HK.audio.play('ui'); const P = app.practice; P.start(id, level); openPanel(false); ui.drill = P.hud();
    $('#prac-stop').classList.remove('hidden'); $('#prac-skater').disabled = true;
    const d = HK.drillById(id); toast(d.icon + ' ' + d.name + ' (' + HK.DRILL_LEVELS[level] + ') : ' + d.desc, 5);
    HK.input.flush();
  }
  function stopDrill() { const P = app.practice; if (!P) return; P.stop(); ui.drill = null; $('#prac-stop').classList.add('hidden'); $('#prac-skater').disabled = false; $('#prac-result').classList.add('hidden'); }
  function showDrillResult() {
    const P = app.practice; if (!P || !P.drill) return;
    const d = P.drill, won = P.won, box = $('#prac-result'); box.classList.remove('hidden');
    const stars = (HK.drillStars.load()[d.id] || [false, false, false]).map(v => v ? '★' : '☆').join('');
    box.innerHTML = `<h3>${won ? '🎉 Réussi !' : '😅 Raté…'}</h3><p>${d.icon} ${d.name} · ${HK.DRILL_LEVELS[P.level]} <span class="drill-stars">${stars}</span></p><div class="buttons"></div>`;
    const b = box.querySelector('.buttons');
    const btn = (t, f, cls) => { const e = document.createElement('button'); e.textContent = t; e.className = cls || ''; e.onclick = () => { HK.audio.play('ui'); f(); }; b.appendChild(e); };
    btn(won ? 'Rejouer' : 'Réessayer', () => startDrill(d.id, P.level), 'primary');
    if (won && P.level < 2) btn('Niveau suivant', () => startDrill(d.id, P.level + 1));
    btn('Autre exercice', () => { stopDrill(); openPanel(true); });
    btn('Pratique libre', () => stopDrill());
  }
  $('#btn-resume').onclick = () => { paused = false; $('#pause').classList.add('hidden'); HK.music.resumeAll(); };
  $('#btn-quit').onclick = () => { paused = false; app.cup = null; app.practice = null; HK.music.stopAll(); show('menu'); };

  // ----- Résultats -----
  function endMatch() {
    const g = app.game, [A, B] = g.teams;
    const box = $('#result'); let html = '';
    const cup = app.cup; let cupText = '';
    if (cup) {
      const myIdx = 0, won = g.winner === myIdx;
      cup.results[cup.index] = { opp: cup.opponents[cup.index], won, score: [A.score, B.score] };
      if (won) { cup.index++; cupText = cup.index >= cup.opponents.length ? '🏆 CHAMPION DE LA COUPE BOISJOLI ! 🏆' : `Victoire ! Prochain adversaire : ${HK.teamById(cup.opponents[cup.index]).name}`; }
      else cupText = 'Défaite… Tu peux réessayer ce match.';
    }
    html += `<div class="final"><span style="color:${A.def.color}">${A.def.name}</span> <b>${A.score} — ${B.score}</b> <span style="color:${B.def.color}">${B.def.name}</span>${g.ot ? ' <small>(prolongation)</small>' : ''}</div>`;
    if (cupText) html += `<div class="cup-text">${cupText}</div>`;
    html += '<div class="cols"><div><h3>Buts</h3>';
    html += g.scorers.length ? '<ul>' + g.scorers.map(s => `<li><span style="color:${g.teams[s.team].def.color}">■</span> ${s.ot ? 'Prol.' : ['', '1re', '2e', '3e'][s.period]} ${s.time} — ${s.scorer ? s.scorer.def.name : '?'}${s.assist ? ' (passe : ' + s.assist.def.name + ')' : ''}${s.own ? ' — dans son propre filet !' : ''}</li>`).join('') + '</ul>' : '<p>Aucun but… les gardiens ont été parfaits.</p>';
    html += '</div>';
    for (const T of g.teams) {
      html += `<div><h3 style="color:${T.def.color}">${T.def.name}</h3><table><tr><th></th><th>B</th><th>P</th><th>Tirs</th><th>Échecs</th><th>Pouv.</th></tr>`;
      for (const s of T.all) html += `<tr><td>${s.def.name}</td><td>${s.stats.goals}</td><td>${s.stats.assists}</td><td>${s.stats.shots}</td><td>${s.stats.hits}</td><td>${s.stats.powers}</td></tr>`;
      html += `<tr class="tot"><td>Gardien</td><td colspan="5">${T.goalie.saves} arrêts</td></tr></table></div>`;
    }
    html += '</div>';
    box.innerHTML = html;
    const b = $('#result-buttons'); b.innerHTML = '';
    const btn = (t, f, cls) => { const e = document.createElement('button'); e.textContent = t; e.className = cls || ''; e.onclick = () => { HK.audio.play('ui'); f(); }; b.appendChild(e); return e; };
    if (cup) {
      if (cup.index >= cup.opponents.length) { btn('Retour au menu', () => { app.cup = null; show('menu'); }, 'primary'); }
      else if (cup.results[cup.index] && !cup.results[cup.index].won) { btn('Réessayer', nextCupMatch, 'primary'); btn('Abandonner la coupe', () => { app.cup = null; show('menu'); }); }
      else { btn('Match suivant', nextCupMatch, 'primary'); btn('Abandonner la coupe', () => { app.cup = null; show('menu'); }); }
    } else {
      btn('Revanche', () => startMatch(A.def.id, B.def.id, g.ctrl), 'primary');
      btn('Changer d\'équipes', () => startSelect(app.mode));
      btn('Menu', () => show('menu'));
    }
    show('result');
    const first = b.querySelector('button'); if (first) first.focus();
    HK.music.stopAll();
  }

  window.addEventListener('keydown', e => {
    if (app.screen === 'result' && e.code === 'Enter') { const f = $('#result-buttons button'); if (f && document.activeElement !== f) f.click(); }
    if (app.screen === 'select' && e.code === 'Escape') show('menu');
  });
  HK.input.init(); buildMenu(); show('menu');
  // Mode test : ?demo=1 lance tout de suite ordi contre ordi.
  const q = new URLSearchParams(location.search);
  if (q.get('demo')) startMatch(q.get('a') || 'matt', q.get('b') || 'bibi', ['cpu', 'cpu']);
  if (q.get('select')) startSelect(q.get('select'));
  if (q.get('practice')) { startPractice(q.get('a') || 'matt', q.get('b') || 'boys'); if (q.get('drill')) startDrill(q.get('drill'), +(q.get('level') || 0)); }
})(window.HK);
