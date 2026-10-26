// Menus, sélection des équipes, boucle du match, résultats, Coupe des familles, galerie de la famille.
// Le mode Aventure (chef, équipe, expérience) est dans js/adventure.js.
(async function (BC) {
  'use strict';
  await Promise.all([window.FamilyHeads.ready, window.MonsterHeads.ready, window.MonsterBodyArt.ready]);
  const $ = s => document.querySelector(s), S = BC.sprites;
  const app = BC.app = { screen: 'menu', settings: { difficulty: 1, sound: true }, game: null, cup: null, mode: 'solo' };
  const P_COLOR = '#ffd166';
  try { Object.assign(app.settings, JSON.parse(localStorage.getItem('bc.settings') || '{}')); } catch (e) { }
  const save = () => { try { localStorage.setItem('bc.settings', JSON.stringify(app.settings)); } catch (e) { } };
  const cupSaved = () => { try { return JSON.parse(localStorage.getItem('bc.cups') || '{}'); } catch (e) { return {}; } };

  function show(id) {
    document.querySelectorAll('.screen').forEach(e => e.classList.add('hidden'));
    $('#screen-' + id).classList.remove('hidden'); app.screen = id; BC.input.capture = id === 'match';
    hideCard(); window.scrollTo(0, 0);
  }
  app.show = show;
  const roleOf = d => BC.ROLES[d.role] || d.role;
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const birthText = d => { if (!d.birth) return ''; const b = new Date(d.birth + 'T00:00:00'); return `Né${d.look && d.look.lipstick || /a$|ie$|ée$/.test(d.name) ? 'e' : ''} le ${b.getDate() === 1 ? '1er' : b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`; };
  const statsHtml = (d, stats) => BC.AdventureUI.statsHtml(stats || d.stats);
  app.statsHtml = statsHtml;
  const kindText = P => P.kind === 'throw' ? 'V puis lancer' : P.kind === 'instant' ? 'V : tout de suite' : 'passif';

  // Fiche au survol : buste qui salue, naissance, âge, pouvoir, stats.
  let hoverRaf = 0;
  function showCard(d, team, x, y, stats) {
    const card = $('#hover-card'), P = BC.POWERS[d.power], st = stats || d.stats, key = d.name + JSON.stringify(st);
    if (card.dataset.id !== key) {
      card.dataset.id = key; card.style.setProperty('--c', team.color);
      card.innerHTML = `<canvas width="150" height="170"></canvas><div class="hc-info"><h3>${d.name}${d.birth && BC.isBirthday(d.birth) ? ' 🎂' : ''}</h3>
        <div class="hc-role">${roleOf(d)} · ${team.name}</div>
        <div class="hc-birth">${birthText(d)} · ${d.custom ? 'Personnage de famille' : d.age + (d.age > 1 ? ' ans' : ' an')}${BC.isBirthday(d.birth) ? ' · Bonne fête !' : ''}</div>
        <span class="health-badge" aria-label="${BC.phys(d, st).maxHp} points de vie"><span aria-hidden="true">♥</span> <strong>${BC.phys(d, st).maxHp}</strong><small>PV</small></span>
        <div class="hc-power"><b>${P.icon} ${P.name} <small>(${kindText(P)})</small></b><span>${P.desc}</span></div>${statsHtml(d, st)}</div>`;
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
  app.card = { show: showCard, hide: hideCard, move: moveCard };

  // ----- Menu -----
  function buildMenu() {
    $('#version').textContent = 'v' + BC.VERSION;
    const strip = $('#logos'); strip.innerHTML = '';
    for (const t of BC.TEAMS) { const c = document.createElement('canvas'); c.width = 90; c.height = 100; S.drawLogo(c.getContext('2d'), 45, 50, t, 80); c.title = t.name; strip.appendChild(c); }
    const d = $('#opt-diff'); d.innerHTML = BC.DIFFICULTIES.map((n, i) => `<option value="${i}">${n}</option>`).join('');
    d.value = app.settings.difficulty; d.onchange = () => { app.settings.difficulty = +d.value; save(); };
    const snd = $('#opt-sound'); snd.checked = app.settings.sound; snd.onchange = () => { app.settings.sound = snd.checked; BC.audio.setMuted(!snd.checked); save(); };
    BC.audio.muted = !app.settings.sound;
    $('#btn-adventure').onclick = () => { BC.audio.init(); BC.audio.play('ui'); BC.AdventureUI.open(); };
    $('#btn-solo').onclick = () => startSelect('solo');
    $('#btn-cup').onclick = () => startSelect('cup');
    $('#btn-family').onclick = () => { BC.audio.init(); BC.audio.play('ui'); openFamily(); };
    $('#btn-help').onclick = () => $('#howto').showModal();
    $('#btn-options').onclick = () => $('#menu-options').showModal();
    const faces = $('#menu-faces');
    for (const id of ['alexie', 'eliott', 'adam', 'milo', 'edison', 'zachary']) {
      const d = BC.PLAYERS[id], team = BC.TEAMS.find(t => t.players.includes(id));
      const button = document.createElement('button'); button.className = 'menu-face';
      button.setAttribute('aria-label', 'Rencontrer ' + d.name);
      button.style.setProperty('--team-color', team.color);
      const portrait = document.createElement('canvas'); portrait.width = 150; portrait.height = 170;
      S.drawBust(portrait.getContext('2d'), d, team, 150, 170);
      const label = document.createElement('span'); label.textContent = d.name;
      button.append(portrait, label); button.onclick = () => openFamily(); faces.appendChild(button);
    }
    const won = Object.keys(cupSaved()).length; $('#cups-won').textContent = won ? `${won} / ${BC.TEAMS.length} coupes gagnées` : '';
    buildHowto();
    // scène d'accueil : toute la famille lance des balles sur le terrain du parc
    const c = $('#menu-anim'), ctx = c.getContext('2d');
    const actors = Object.values(BC.PLAYERS).filter(d => !d.monster).map((d, i) => { const team = BC.TEAMS.find(t => t.players.includes(d.id)); const left = i % 2 === 0; return { d, team, x: left ? 240 + (Math.floor(i / 2) % 4) * 85 : 1040 - (Math.floor(i / 2) % 4) * 85, y: 400 + Math.floor(i / 8) * 130 + (Math.floor(i / 2) % 2) * 60, dir: left ? 1 : -1, phase: i * 0.61 }; });
    let hovered = null, mouse = null;
    c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(); const scale = Math.max(r.width / c.width, r.height / c.height); mouse = { x: (e.clientX - r.left + (c.width * scale - r.width) / 2) / scale, y: (e.clientY - r.top + (c.height * scale - r.height) / 2) / scale, cx: e.clientX, cy: e.clientY }; });
    c.addEventListener('mouseleave', () => { mouse = null; hovered = null; hideCard(); });
    (function loop(now) {
      if (app.screen === 'menu') {
        let hit = null;
        for (const a of actors) if (mouse && Math.abs(mouse.x - a.x) < 28 && mouse.y < a.y + 8 && mouse.y > a.y - 90) hit = a;
        if (hit !== hovered) { hovered = hit; if (hit) showCard(hit.d, hit.team, mouse.cx, mouse.cy); else hideCard(); }
        c.style.cursor = hit ? 'pointer' : 'default';
        BC.render.drawMenuScene(ctx, actors, now / 1000, hovered);

      }
      requestAnimationFrame(loop);
    })(performance.now());
  }

  // ----- Comment jouer -----
  const KEY = k => `<kbd class="kcap">${k}</kbd>`;
  const HOWTO = [
    { icon: '🏃', cat: 'Déplacement', color: '#5fe3ff', title: 'Bouger sur le terrain', text: 'Déplace ton joueur dans sa moitié de terrain. Appuie deux fois vite vers l\'avant pour partir à la course !', keys: `<div class="krow">${KEY('⬆')}</div><div class="krow">${KEY('⬅')}${KEY('⬇')}${KEY('➡')}</div>`, label: 'Flèches · deux fois ➡ = course' },
    { icon: '🎯', cat: 'Lancer', color: '#ffd166', title: 'Charger et lancer', text: 'Tiens X pour charger : la barre monte, plus tu tiens, plus la balle part vite et fort. Relâche pour lancer ! La balle vise toute seule l\'adversaire le mieux placé (ligne verte) et accélère en vol. ⬆ ou ⬇ tenu : en diagonale (ligne jaune).', keys: `<div class="krow">${KEY('X')}</div><div class="krow">${KEY('⬆')}${KEY('X')}</div>`, label: 'X tenu = charge · ⬆ ou ⬇ + X = diagonale' },
    { icon: '✨', cat: 'Pouvoir', color: '#d7a6ff', title: 'Ton pouvoir spécial', text: 'Chaque joueur a son pouvoir, avec V. Certains agissent tout de suite (laser, bulles, blizzard, aimant…). D\'autres s\'arment : l\'icône scintille et ton prochain lancer devient spécial (biscuits, fusée, licorne…). Après, il faut 3 attrapés de ton équipe pour le recharger : regarde les cases sous ton nom !', keys: `<div class="krow">${KEY('V')}</div>`, label: 'V · manette : X ou Y · 3 attrapés pour recharger' },
    { icon: '🧤', cat: 'Défense', color: '#7dffa0', title: 'Attraper et intercepter', text: 'Appuie juste au moment où la balle arrive sur toi : si tu l\'attrapes, zéro dégât, la balle est à toi et toute ton équipe recharge un peu son pouvoir. Tu peux aussi intercepter une passe adverse avec C, ou en sautant dessus !', keys: `<div class="krow">${KEY('C')}</div>`, label: 'Touche C sans la balle' },
    { icon: '🦘', cat: 'Esquive', color: '#ff8a7a', title: 'Sauter par-dessus', text: 'Sans la balle, X te fait sauter : la balle passe sous tes pieds. Tu peux aussi simplement t\'écarter vers le haut ou le bas.', keys: `<div class="krow">${KEY('X')}</div>`, label: 'Touche X sans la balle' },
    { icon: '🏐', cat: 'Smash', color: '#ff8a7a', title: 'Sauter et smasher', text: 'Avec la balle, C te fait sauter, sur place ou en pleine course (tu passes alors par-dessus la ligne). Tiens X en l\'air pour charger, puis relâche pour lancer. La descente est ralentie pour te laisser le temps : la balle plonge sur la cible, plus vite, plus fort et bien plus dure à attraper. Au sommet du saut, c\'est un SMASH !', keys: `<div class="krow">${KEY('➡')}${KEY('➡')}${KEY('C')}${KEY('X')}</div>`, label: 'Course, C, puis X en l\'air' },
    { icon: '🤝', cat: 'Passe', color: '#d7a6ff', title: 'Passer aux coéquipiers', text: 'Tes trois coéquipiers de l\'extérieur entourent l\'adversaire. ⬆ + C passe en haut, ⬇ + C en bas, ➡ + C au fond, ⬅ + C à un coéquipier intérieur. En saut dans le camp adverse, direction + C passe à un extérieur, qui relance immédiatement ! C seul vise celui du fond. Attention : l\'autre équipe peut intercepter !', keys: `<div class="krow">${KEY('⬆')}${KEY('C')}</div>`, label: 'Direction + C avec la balle' },
    { icon: '🗺️', cat: 'Aventure', color: '#ffd166', title: 'Monte ton équipe', text: 'Choisis ton chef parmi toute la famille, puis avant chaque match tes 3 joueurs intérieurs et 3 extérieurs. Chaque touché donne de l\'expérience, un K.-O. encore plus : à chaque palier, un point à placer dans une stat. Jusqu\'à 10 c\'est normal… 11 à 15 sont en jaune, puis 16 à 18 en rouge !', keys: `<div class="krow"><span class="kbig">👑 + ⭐ = 💪</span></div>`, label: 'Bouton Aventure dans le menu' },
    { icon: '👨‍👩‍👧', cat: 'Équipe', color: '#5fe3ff', title: 'Choisir ton joueur', text: 'Tu contrôles celui qui a la balle ou celui que la balle vise. Pour changer toi-même : 1, 2 ou 3.', keys: `<div class="krow">${KEY('1')}${KEY('2')}${KEY('3')}</div>`, label: 'Touches 1, 2, 3' },
    { icon: '🎮', cat: 'Manette', color: '#7dffa0', title: 'Avec une manette', text: 'Le stick pour bouger, A pour lancer (tenu = charge) ou sauter, B pour sauter avec la balle, passer ou attraper, X ou Y pour le pouvoir, LB / RB pour changer de joueur, Start pour la pause.', keys: `<div class="krow">${KEY('A')}${KEY('B')}${KEY('X')}</div>`, label: 'Manette Xbox ou autre' },
    { icon: '🏆', cat: 'Le but du jeu', color: '#ff8a7a', title: 'Gagner le match', text: 'Chaque joueur a des points de vie (en bas de l\'écran). Vide ceux des trois joueurs intérieurs de l\'autre équipe : ils montent au ciel en petits anges ! Dans la Coupe, bats les trois autres familles.', keys: `<div class="krow"><span class="kbig">🎯 + 💥 = 😇</span></div>`, label: 'Échap ou P : pause · M : son' },
  ];
  function buildHowto() {
    const grid = $('#howto-grid'); if (!grid) return;
    grid.innerHTML = HOWTO.map(h => `<div class="howto-card" style="--c:${h.color}"><div class="howto-top"><span class="howto-icon">${h.icon}</span><span class="howto-cat">${h.cat}</span></div><h3>${h.title}</h3><p>${h.text}</p><div class="howto-keys">${h.keys}<div class="klabel">${h.label}</div></div></div>`).join('');
    const pw = $('#powers-grid'); if (!pw) return;
    pw.innerHTML = BC.TEAMS.flatMap(t => t.players).map(pid => { const d = BC.PLAYERS[pid], P = BC.POWERS[d.power], t = BC.TEAMS.find(tm => tm.players.includes(pid)); return `<div class="power-card" style="--c:${t.color}"><span class="power-icon">${P.icon}</span><div><b>${d.name}</b> · ${P.name} <small>(${kindText(P)})</small><p>${P.desc}</p></div></div>`; }).join('');
  }

  // ----- Sélection -----
  function startSelect(mode) {
    BC.audio.init(); BC.audio.play('ui');
    app.mode = mode;
    const selectMine=()=>BC.ArcadeUI.pick({title:'Sélectionne ton équipe !',ids:BC.TEAMS.map(t=>t.players[0]),families:true,label:mode==='cup'?'Lancer la coupe':'Choisir mon adversaire',back:()=>show('menu'),confirm:id=>{const mine=BC.Adventure.familyOf(id);if(mode==='cup'){startCup(mine.id);return;}BC.ArcadeUI.pick({title:'Choisis ton adversaire !',ids:BC.TEAMS.filter(t=>t.id!==mine.id).map(t=>t.players[0]),label:'Voir l’affrontement',back:selectMine,confirm:foe=>startMatchIds(mine.id,BC.Adventure.familyOf(foe).id,['p1','cpu'])});}});
    selectMine();
  }

  // ----- Coupe -----
  const CUP_ORDER = ['bibi', 'jay', 'jo', 'matt'];
  function startCup(id) { app.cup = { team: id, opponents: CUP_ORDER.filter(x => x !== id), index: 0, results: [] }; nextCupMatch(); }
  function nextCupMatch() { const c = app.cup; startMatchIds(c.team, c.opponents[c.index], ['p1', 'cpu']); }

  // ----- Match -----
  const ui = { humans: [] };
  let raf = 0, acc = 0, lastT = 0, paused = false;
  function startMatchIds(aId, bId, ctrl) { startMatch({ teams: [BC.teamById(aId), BC.teamById(bId)], ctrl, difficulty: app.settings.difficulty }); }
  // o : { teams, ctrl, difficulty, stats (aventure), mode }
  function startMatch(o) {
    if (!o.confirmed) { BC.ArcadeUI.versus(o,()=>startMatch({...o,confirmed:true}),()=>{if(o.mode==='adventure')BC.AdventureUI.pickTeam();else if(app.mode==='cup')startSelect('cup');else startSelect('solo');}); return; }
    BC.audio.init();
    const g = new BC.Game({ teams: o.teams, ctrl: o.ctrl, difficulty: o.difficulty == null ? app.settings.difficulty : o.difficulty, intro: true, stats: o.stats, mode: o.mode });
    app.game = g; app.matchOpts = {...o, confirmed:false}; ui.humans = []; paused = false;
    o.ctrl.forEach((c, i) => { if (c === 'p1') ui.humans.push({ team: i, n: 1, label: 'TOI', color: P_COLOR }); });
    $('#pause').classList.add('hidden');
    show('match'); BC.input.flush();
    acc = 0; lastT = performance.now(); BC.audio.crowd(0.12);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  app.startMatch = startMatch;
  const canvas = $('#game'), ctx = canvas.getContext('2d');
  const SFX = { throw: 'throw', throwSuper: 'super', smash: 'smash', pass: 'pass', catch: 'catch', hit: 'hit', bounce: 'bounce', jump: 'jump', dash: 'dash', ko: 'ko', whistle: 'whistle', teleport: 'teleport', win: 'win', power: 'power', arm: 'arm', bad: 'bad', explode: 'explode', bubble: 'bubble', ghost: 'ghost' };
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
      const sfx = SFX[e.type];
      if (sfx) BC.audio.play(sfx);
      if (e.type === 'power' && (e.power === 'laser' || e.power === 'pikachu')) BC.audio.play('zap');
      if (e.type === 'hit') BC.audio.crowd(e.ko ? 0.5 : 0.3, 0.1), setTimeout(() => BC.audio.crowd(0.12, 0.8), 900);
    }
    g.events.length = 0;
    BC.render.draw(ctx, g, ui);
    if (g.phase === 'end' && g.endT > 3) showResult();
  }
  $('#btn-resume').onclick = () => { paused = false; $('#pause').classList.add('hidden'); BC.input.flush(); };
  $('#btn-quit').onclick = () => { paused = false; app.cup = null; if (app.matchOpts && app.matchOpts.mode === 'adventure') BC.AdventureUI.open(); else show('menu'); };

  // ----- Résultat -----
  function showResult() {
    const g = app.game, A = g.teams[0], B = g.teams[1], won = g.winner === 0, adventure = app.matchOpts && app.matchOpts.mode === 'adventure';
    const box = $('#result'); let html = '';
    const cup = app.cup; let cupText = '';
    if (cup) {
      cup.results[cup.index] = { opp: cup.opponents[cup.index], won };
      if (won) { cup.index++; if (cup.index >= cup.opponents.length) { cupText = '🏆 CHAMPIONS DE LA COUPE DES FAMILLES ! 🏆'; const c = cupSaved(); c[cup.team] = Date.now(); try { localStorage.setItem('bc.cups', JSON.stringify(c)); } catch (e) { } } else cupText = `Victoire ! Prochain match chez ${BC.teamById(cup.opponents[cup.index]).name}`; }
      else cupText = 'Défaite… Tu peux réessayer ce match.';
    }
    const winner = g.teams[g.winner];
    html += `<div class="final"><b style="color:${winner.color}">${winner.name}</b> gagne${winner.id === 'aventure' ? '' : 'nt'} !</div>`;
    if (cupText) html += `<div class="cup-text">${cupText}</div>`;
    if (adventure) html += BC.AdventureUI.result(g);
    html += '<div class="cols">';
    for (let t = 0; t < 2; t++) {
      const team = g.teams[t], st = g.stats[t];
      html += `<div><h3 style="color:${team.color}">${team.name}</h3><table><tr><th>Joueur</th><th>Points de vie</th><th>XP</th></tr>`;
      for (const p of g.inner(t)) html += `<tr><td>${p.def.name}</td><td>${p.alive ? p.hp + ' / ' + p.maxHp : '😇 K.-O.'}</td><td>${g.xp[p.id] || 0}</td></tr>`;
      for (const p of g.outer(t)) if (g.xp[p.id]) html += `<tr><td>${p.def.name} <small>(extérieur)</small></td><td>—</td><td>${g.xp[p.id]}</td></tr>`;
      html += `<tr class="tot"><td>Lancers</td><td colspan="2">${st.throws}</td></tr><tr class="tot"><td>Pouvoirs</td><td colspan="2">${st.supers}</td></tr><tr class="tot"><td>Touchés</td><td colspan="2">${st.hits}</td></tr><tr class="tot"><td>Attrapés</td><td colspan="2">${st.catches}</td></tr></table></div>`;
    }
    html += '</div>';
    box.innerHTML = html;
    const b = $('#result-buttons'); b.innerHTML = '';
    const btn = (label, fn, cls) => { const e = document.createElement('button'); e.textContent = label; if (cls) e.className = cls; e.onclick = fn; b.appendChild(e); };
    if (adventure) {
      btn('Continuer l\'aventure', () => BC.AdventureUI.open(), 'primary');
      btn('Menu', () => show('menu'));
    } else if (cup) {
      if (cup.index >= cup.opponents.length) btn('Retour au menu', () => { app.cup = null; show('menu'); buildMenu(); }, 'primary');
      else if (cup.results[cup.index] && !cup.results[cup.index].won) { btn('Réessayer', nextCupMatch, 'primary'); btn('Abandonner la coupe', () => { app.cup = null; show('menu'); }); }
      else { btn('Match suivant', nextCupMatch, 'primary'); btn('Abandonner la coupe', () => { app.cup = null; show('menu'); }); }
    } else {
      btn('Revanche', () => startMatch(app.matchOpts), 'primary');
      btn('Changer d\'équipes', () => startSelect(app.mode));
      btn('Menu', () => show('menu'));
    }
    show('result');
  }
  window.addEventListener('keydown', e => {
    if (app.screen === 'result' && e.code === 'Enter') { const f = $('#result-buttons button'); if (f && document.activeElement !== f) f.click(); }
  });

  // ----- Galerie : voir toute la famille côte à côte (pour faire des images) -----
  const fam = { pose: 'idle', scale: 2, byFamily: true, names: true, court: 'gym', hovered: null, spots: [] };
  function openFamily() {
    const c = $('#family-canvas'), ctx2 = c.getContext('2d');
    const opts = $('#family-options');
    if (!opts.dataset.built) {
      opts.dataset.built = '1';
      opts.innerHTML = `<label>Pose <select id="fam-pose">${[['idle', 'Debout'], ['wave', 'Salut'], ['windup', 'Prêt à lancer'], ['throw', 'Lancer'], ['jump', 'Saut'], ['catch', 'Attraper'], ['mix', 'Mélange']].map(([v, n]) => `<option value="${v}">${n}</option>`).join('')}</select></label>
        <label>Taille <input type="range" id="fam-scale" min="1.2" max="3" step="0.1" value="2"></label>
        <label>Décor <select id="fam-court">${Object.entries(BC.COURTS).map(([id, ct]) => `<option value="${id}">${ct.name}</option>`).join('')}<option value="none">Aucun (fond transparent)</option></select></label>
        <label><input type="checkbox" id="fam-family" checked> Par famille</label>
        <label><input type="checkbox" id="fam-names" checked> Noms</label>
        <button id="fam-download">Télécharger l'image (PNG)</button>
        <button id="fam-back">Retour au menu</button>`;
      $('#fam-pose').onchange = e => fam.pose = e.target.value;
      $('#fam-scale').oninput = e => fam.scale = +e.target.value;
      $('#fam-court').onchange = e => fam.court = e.target.value;
      $('#fam-family').onchange = e => fam.byFamily = e.target.checked;
      $('#fam-names').onchange = e => fam.names = e.target.checked;
      $('#fam-download').onclick = () => { const hov = fam.hovered; fam.hovered = null; BC.render.drawGallery(ctx2, Object.assign({}, fam, { t: performance.now() / 1000 })); const a = document.createElement('a'); a.download = 'famille-ballon-chasseur.png'; a.href = c.toDataURL('image/png'); a.click(); fam.hovered = hov; };
      $('#fam-back').onclick = () => { BC.audio.play('ui'); show('menu'); };
      c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(), mx = (e.clientX - r.left) * c.width / r.width, my = (e.clientY - r.top) * c.height / r.height; let hit = null; for (const s of fam.spots) if (Math.abs(mx - s.x) < s.w / 2 + 6 && my < s.y + 6 && my > s.y - s.h - 10) hit = s; if ((hit && hit.id) !== fam.hovered) { fam.hovered = hit ? hit.id : null; if (hit) showCard(BC.PLAYERS[hit.id], hit.team, e.clientX, e.clientY); else hideCard(); } else if (hit) moveCard(e); c.style.cursor = hit ? 'pointer' : 'default'; });
      c.addEventListener('mouseleave', () => { fam.hovered = null; hideCard(); });
    }
    show('family');
    (function loop(now) { if (app.screen !== 'family') return; requestAnimationFrame(loop); fam.spots = BC.render.drawGallery(ctx2, Object.assign({}, fam, { t: now / 1000 })); })(performance.now());
  }

  BC.input.init();
  buildMenu();
  // Paramètres d'adresse pour tester : ?match=matt,jo&cpu=1&diff=2 · ?screen=select|adventure|family
  const q = new URLSearchParams(location.search);
  if (q.get('match')) {
    const [a, b] = q.get('match').split(','); if (q.get('diff')) app.settings.difficulty = +q.get('diff');
    startMatchIds(a || 'matt', b || 'jo', q.get('cpu') === '2' ? ['cpu', 'cpu'] : ['p1', 'cpu']);
    const skip = +q.get('t') || 0; for (let i = 0; i < skip * 60; i++) app.game.update(BC.STEP, [null, null]); app.game.events.length = 0;   // avance rapide (captures)
  }
  if (q.get('screen') === 'select') startSelect(q.get('mode') || 'solo');
  if (q.get('screen') === 'adventure') BC.AdventureUI.open();
  if (q.get('screen') === 'family') openFamily();
})(window.BC);
