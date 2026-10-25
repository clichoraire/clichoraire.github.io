// Snow Kids — écrans (menu, personnages, pistes, boutique, résultats, histoire), boucle de jeu et sauvegarde.
(function (SK) {
  'use strict';
  const $ = id => document.getElementById(id), A = SK.Audio, R = SK.Render, I = SK.Input;
  const SAVE_KEY = 'snowkids.save';
  const DEFAULT_SAVE = { playSeconds:0, xp:0, trainingPoints:0, gold: 0, boardSkins: {}, ownedSkins: [], boards: ['freestyle'], unlocked: 1, shinobin: false, won: {}, best: {}, char: 'zach', board: 'freestyle', char2: 'eliott', board2: 'freestyle', diff: 1, sound: true, music: true, laps: 3, ending: false, advChar: null, advBoard: 'freestyle', upgrades: {}, gear: [], wardrobe: [], look: {}, trophies: {}, missions: {} };
  let save = loadSave();
  function loadSave() { try { const text=localStorage.getItem(SAVE_KEY),raw=JSON.parse(text||'{}');
    if(text&&!raw.profileVersion&&!localStorage.getItem(SAVE_KEY+'.before-profiles'))localStorage.setItem(SAVE_KEY+'.before-profiles',text);
    return SK.Profiles.init(SK.migrateCharacters(Object.assign(JSON.parse(JSON.stringify(DEFAULT_SAVE)),raw)),DEFAULT_SAVE);
  } catch(e){return SK.Profiles.init({},DEFAULT_SAVE);} }
  function store() { SK.Profiles.capture(save);try { localStorage.setItem(SAVE_KEY,JSON.stringify(save)); } catch(e){} }
  function chooseAdventure(id){SK.Profiles.select(save,id);store();openTown();}
  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); };

  // ------------------------------------------------------------------ écrans
  const screens = ['gym', 'debug', 'menu', 'advselect', 'town', 'throne', 'museum', 'wardrobe', 'records', 'school', 'select', 'course', 'shop', 'story', 'race', 'result'];
  function show(name) { SK.Touch.show(name); if(name!=='school')SK.School?.close(); SK.PhotoPuzzles.mount(name,save); if(name!=='gym')SK.Gym.close(); if(name!=='race')SK.DebugHouse.close(); if(name!=='throne')SK.Throne.close(); if(name!=='museum')SK.Museum.close(); if (name !== 'course') openCourse.resizeObserver?.disconnect(); if (name !== 'town' && name !== 'advselect') SK.Town.close(); if (name !== 'shop') SK.Shop.close(); for (const s of screens) $('screen-' + s).classList.toggle('hidden', s !== name); SK.RoomViews.show(name); if(name==='result'){const screen=$('screen-result');screen.scrollTop=0;requestAnimationFrame(()=>{if(!screen.classList.contains('hidden'))screen.scrollTop=0;});} if (name === 'menu') { refreshMenu(); A.music('menu'); } }
  let flow = { mode: 'champ', players: 1, course: null, laps: 3, picks: [] };

  const fakeRacer = SK.fakeRacer;
  const effectiveBoard = id => SK.effectiveBoard(id, save);
  const gold = n => `<span class="gold-inline"><img src="${SK.COIN_SVG}" alt="">${SK.fmtGold(n,false)}</span>`;
  const gearObj = charId => SK.equippedGear(save,charId);
  const lookFor = charId => SK.lookOf(SK.charById(charId) || SK.CHARACTERS[0], save);

  // ---- menu
  function refreshMenu() {
    $('version').textContent = 'v' + SK.VERSION;
    $('champ-progress').textContent='Une aventure par personnage';
    $('opt-diff').value = save.diff; if (SK.Home) SK.Home.sync(); $('opt-sound').checked = save.sound; $('opt-music').checked = save.music;
  }
  function initMenu() {
    SK.DIFFICULTIES.forEach((d, i) => { const o = document.createElement('option'); o.value = i; o.textContent = d; $('opt-diff').appendChild(o); });
    $('opt-diff').onchange = () => { save.diff = +$('opt-diff').value; store(); };
    $('opt-sound').onchange = () => { save.sound = $('opt-sound').checked; A.setEnabled(save.sound); store(); };
    $('opt-music').onchange = () => { save.music = $('opt-music').checked; A.setMusic(save.music); store(); };
    $('btn-adv').onclick = () => { A.sfx('click'); openAdventure(); };
    $('btn-free').onclick = () => { flow = { mode: 'free', players: 1, picks: [] }; A.sfx('click'); openSelect(0); };
    $('btn-time').onclick = () => { flow = { mode: 'time', players: 1, picks: [] }; A.sfx('click'); openSelect(0); };
    $('btn-help').onclick = () => { A.sfx('click'); $('howto').classList.toggle('hidden'); };
    $('btn-help-close').onclick = () => { A.sfx('click'); $('howto').classList.add('hidden'); };
    $('btn-reset').onclick = () => { if (confirm('Effacer toute la progression (pièces, planches, pistes débloquées, Shinobin) ?')) { save = SK.Profiles.init({}, DEFAULT_SAVE); SK.Town._streetX = undefined; A.setEnabled(save.sound); A.setMusic(save.music); store(); refreshMenu(); toast('Sauvegarde effacée'); } };
    $('howto-grid').innerHTML = `
      <div><h3>Le but</h3><p>Descends la piste plus vite que les autres. Au bas de la piste, la <b>remontée mécanique</b> te ramène au sommet pour le tour suivant : une chaise part toutes les ${SK.LIFT_INTERVAL} secondes, une place par chaise. Au dernier tour, la ligne d'arrivée remplace la remontée.</p>
      <p class="touch-help"><b>Sur tablette ou cellulaire :</b> utilise les gros boutons en bas de l’écran. Maintiens Sauter pour charger et relâche pour sauter. Tu peux tourner avec un autre doigt. Dans le village, touche le sol pour marcher et une maison pour y entrer. Tourne la tablette à l’horizontale pour mieux voir la piste.</p><h3>Commandes (joueur 1)</h3><ul><li><kbd>←</kbd> <kbd>→</kbd> diriger · <kbd>↑</kbd> se pencher en avant (un peu plus de vitesse) · <kbd>↓</kbd> freiner (utile dans les virages serrés)</li><li><kbd>X</kbd> maintenir pour charger le saut (genoux fléchis), puis relâcher pour sauter. Charge maximale en 0,9 seconde.</li><li>Plus les genoux sont pliés au relâchement, plus le saut est haut. Une flexion complète ajoute aussi une petite poussée sous 70 km/h.</li><li>En l'air, <kbd>C</kbd> + direction : Grab (seul), <kbd>↑</kbd> salto arrière, <kbd>↓</kbd> salto avant, <kbd>←</kbd>/<kbd>→</kbd> vrille 360</li><li>En l'air, <kbd>X</kbd> + direction : Method (seul), <kbd>↑</kbd> Rodéo, <kbd>↓</kbd> Tornade, <kbd>←</kbd>/<kbd>→</kbd> vrille 720 — plus longues, mieux payées</li><li><kbd>V</kbd> tirer · <kbd>B</kbd> utiliser l'objet · <kbd>Échap</kbd> pause</li></ul>
      <p>Les manettes marchent aussi (A saut, B figure, X tir, Y objet).</p></div>
      <div><h3>Or et boîtes</h3><p>Les <b>pièces d'or</b> (1 G chacune) traînent sur la piste et s'obtiennent surtout avec les <b>figures</b> : termine-les avant d'atterrir, sinon tu tombes ! Enchaîne plusieurs figures dans un même saut pour multiplier le gain.</p>
      <p>Les <b>boîtes rouges</b> donnent un <b>tir</b>, les <b>boîtes bleues</b> un <b>objet</b> ; chaque boîte coûte 1 pièce d'or (gratuite si tu n'en as pas). Un seul tir et un seul objet à la fois.</p>
      <h3>Tirs (boîtes rouges)</h3><ul>${Object.values(SK.SHOTS).map(s => `<li>${s.icon} <b>${s.name}</b> : ${s.desc}</li>`).join('')}</ul></div>
      <div><h3>Objets (boîtes bleues)</h3><ul>${Object.values(SK.ITEMS).map(s => `<li>${s.icon} <b>${s.name}</b> : ${s.desc}</li>`).join('')}</ul>
      <h3>Les 15 coupes</h3><p>7 coupes débutantes, 5 moyennes et 3 expertes. Chaque coupe enchaîne plusieurs courses avec les mêmes adversaires. Le classement attribue 10, 7, 4 et 1 points ; le temps cumulé départage les égalités. Gagne la coupe pour débloquer la suivante. Quitter une coupe en cours remet son classement à zéro.</p>
      <h3>Aventure et village</h3><p>Choisis ton Kid, puis promène-toi dans le <b>village</b> (← → pour tourner, Entrée pour entrer dans une maison) : le <b>tournoi</b> mène aux pistes, la <b>boutique</b> vend et équipe les planches, le <b>gym</b> permet d’améliorer leurs statistiques, le <b>chalet</b> change de personnage, le <b>chalet des records</b> montre ta progression. L'<b>École</b> propose des missions (slalom entre drapeaux, figures, tir, pièces…), la <b>garde-robe</b> change ton look, le <b>musée</b> montre tes coupes. Gagne chaque piste (1<sup>re</sup> place) pour débloquer la suivante ; la première victoire sur une piste vaut un <b>trophée et ${SK.TROPHY_GOLD} G</b>. Chaque course rapporte une prime selon la place (${SK.PRIZES.slice(0, 4).join(' / ')}) plus les pièces ramassées.</p>
      <p>Au <b>Pays des Ninjas</b>, un cinquième coureur mystérieux se joint à la course… Bats-le partout et il deviendra jouable.</p>
      <h3>Surfaces</h3><p>La glace glisse (dirige tôt, freine), le sable et l'herbe ralentissent, les sables mouvants engluent. On peut sauter par-dessus les obstacles et les rochers.</p></div>`;
  }
  function menuAnim(t) { return; /* l'accueil est une illustration */
    const cv = $('menu-anim'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5fb0ff'); g.addColorStop(1, '#dff3ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(W, 130); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = '#e6f0fa'; ctx.beginPath(); ctx.moveTo(0, 75); ctx.lineTo(W, 142); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    for (let i = 0; i < 6; i++) R.drawProp(ctx, i % 2 ? 'pine' : 'fir', ((i * 190 + t * 60) % (W + 100)) - 50, 65 + (((i * 190 + t * 60) % (W + 100)) - 50) / W * 70 - 2, 7, i / 6, t, {});
    const chars = SK.CHARACTERS.filter(c => !c.hidden || save.shinobin);
    chars.forEach((c, i) => { const x = ((i * 150 + t * 90 + Math.sin(t + i) * 10) % (W + 160)) - 80, y = 70 + x / W * 70 - 5; const fr = fakeRacer(c.id); fr.input.steer = Math.sin(t * 2 + i) * 0.5; if (Math.sin(t * 1.3 + i * 2) > 0.8) { fr.state = 'air'; fr.h = (Math.sin(t * 1.3 + i * 2) - 0.8) * 8; } R.drawRacer(ctx, fr, x, y, 34, t, false); });
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 97.3 + t * 20) % W, (i * 61.7 + t * 50) % H, 3, 3);
  }

  // ---- Aventure : choix du Kid sur la neige, puis le village
  function openAdventure() { advSelect(() => show('menu')); }
  function advSelect(onBack) {
    show('advselect'); A.music('select');
    const info = $('adv-info'); let current = save.advChar || 'zach';
    SK.Town.select({
      canvas: $('adv-canvas'), info, unlocked: save.shinobin, current, lookFor: id=>SK.lookOf(SK.charById(id),SK.Profiles.peek(save,id)),
      onChange: c => { current = c.id; $('btn-adv-ok').textContent = c.gender==='girl' ? "C’est elle !" : "C’est lui !"; let bars = ''; for (const [k, lab, icon] of [['speed','Vitesse','ϟ'],['corner','Virage','↝'],['acceleration','Accélération','»'],['jump','Saut','↟'],['strength','Force','✊']]) { bars += `<div class="kid-stat"><span class="stat-icon stat-${k}" aria-hidden="true"><svg viewBox="0 0 32 34">${SK.STAT_ICONS[k]}</svg></span><span>${lab}</span><span class="kid-meter">`; for(let i=1;i<=5;i++)bars+=`<i class="${i<=c[k]?'on':''}"></i>`;bars+=`</span><strong>${c[k]}</strong></div>`; } const profile=SK.Profiles.peek(save,c.id);info.innerHTML=`<b>${c.name}</b>${bars}<div class="kid-progress">Niv. ${SK.Progression.info(profile).level} · 🏆 ${Object.values(profile.cups||{}).filter(x=>x.won).length} / 15 · ${gold(profile.gold)}</div><div class="kid-playtime" data-play-time="${c.id}">⏱ Temps de jeu : ${SK.Session.format(profile.playSeconds)}</div>`; },
      onPick: id => { A.sfx('box'); chooseAdventure(id); },
      onBack,
    });
    $('btn-adv-back').onclick = () => { A.sfx('click'); onBack(); };
    $('btn-adv-ok').onclick = () => { A.sfx('box'); chooseAdventure(current); };
  }
  function openTown() {
    SK.Town.setDebug(!!save.debugHouse);show('town'); A.music('town');
    if (!save.boards.includes(save.advBoard)) save.advBoard = 'freestyle';
    $('town-gold').innerHTML = `<img src="${SK.COIN_SVG}" alt=""><b>${SK.fmtGold(save.gold,false)}</b>`; $('town-char').textContent = SK.charById(save.advChar).name + ' · Niveau '+SK.Progression.info(save).level+' · planche ' + SK.boardById(save.advBoard).name;
    let badge=$('town-level-badge');if(!badge){badge=document.createElement('button');badge.id='town-level-badge';badge.className='level-badge';$('screen-town').appendChild(badge);badge.onclick=openGym;}
    badge.hidden=!(save.trainingPoints>0);const townLevel=SK.Progression.info(save).level,points=save.trainingPoints||0;
    badge.setAttribute('aria-label','Niveau '+townLevel+' : '+points+' points disponibles. Aller au gym');
    badge.innerHTML='<span class="town-level-star" aria-hidden="true"><i>★</i><b>'+townLevel+'</b></span><span class="town-level-copy"><span class="town-level-title">NIVEAU '+townLevel+'</span><span class="town-level-points">💪 '+points+' POINT'+(points>1?'S':'')+'</span><span class="town-level-link">Au gym ! →</span></span><span class="town-level-sparkles" aria-hidden="true">✦</span>';
    SK.Town.open({
      canvas: $('town-canvas'), save, walkLevel:save.walkLevel||0, charId: save.advChar, boardId: save.advBoard, look: lookFor(save.advChar), labelEl: $('town-label'),
      onEnter: id => {
        A.sfx('box');
        if (id === 'lift') { flow = { mode: 'champ', players: 1, picks: [{ charId: save.advChar, boardId: save.advBoard }] }; openCourse(); }
        else if(id==='debug')openDebug();
        else if (id === 'throne') openThrone();
        else if(id==='gym')openGym();
        else if (id === 'shop') openShop(openTown,'boards');
        else if (id === 'clothes') openShop(openTown,'linge');
        else if (id === 'look') openWardrobe();
        else if (id === 'ecole') openSchool();
        else if (id === 'kids') advSelect(openTown);
        else if(id==='trophees')openMuseum();
        else openRecords();
      },
      onDig: amount => {store();$('town-gold').innerHTML=gold(save.gold);A.sfx(amount?'coin':'click');},
      onChat: text => {
        const result=SK.Cheats.apply(text,save);
        if(result){store();SK.Town.setDebug(!!save.debugHouse);$('town-gold').innerHTML=gold(save.gold);A.sfx('unlock');toast(result+' — activé !');}
        return {look:lookFor(save.advChar),debugHouse:!!save.debugHouse};
      },
      onBack: () => { A.sfx('click'); show('menu'); },
    });
    $('btn-town-menu').onclick = () => { A.sfx('click'); show('menu'); };
  }
  function openDebug(){cancelAnimationFrame(raf);paused=false;show('debug');A.music('shop');SK.DebugHouse.open(save,(course,lab)=>{flow={debug:true,lab,mode:'time',players:1,picks:[{charId:save.advChar||save.char,boardId:save.advBoard}],course:lab?{...course,sections:[{t:'s',n:700,w:12}]}:JSON.parse(JSON.stringify(course)),laps:1,seed:7};startRace();},openTown);}
  function openThrone(){show('throne');A.stopMusic();SK.Throne.open({save,onBack:openTown,onChallenge:()=>{if(!SK.Throne.ready(save))return;flow={mode:'free',finalBoss:true,players:1,picks:[{charId:save.advChar,boardId:save.advBoard}],course:SK.courseById('dizzy'),laps:3};startRace();}});}
  function openGym(){show('gym');A.music('shop');SK.Gym.open({save,store,onBack:openTown});}
  function openWardrobe(){show('wardrobe');A.music('shop');SK.Wardrobe.open({save,store,onBack:openTown});}
  function openMuseum(){show('museum');A.music('town');SK.Museum.open({canvas:$('museum-canvas'),save,look:lookFor(save.advChar||save.char),onBack:openTown});}
  function openRecords() {
    show('records'); A.music('results');
    const won = Object.keys(save.won).length, done = Object.keys(save.missions || {}).length;
    $('records-sub').innerHTML = `${gold(save.gold)} · ${won} trophée${won > 1 ? 's' : ''} sur ${SK.COURSES.length} · ${done} mission${done > 1 ? 's' : ''} réussie${done > 1 ? 's' : ''} sur ${SK.MISSIONS.length} · ${save.boards.length} planche${save.boards.length > 1 ? 's' : ''}` + (save.shinobin ? ' · Shinobin débloqué 🥷' : '');
    let html = '<div class="trophies">' + SK.COURSES.map((c, i) => `<div class="trophy${save.won[c.id] ? '' : ' locked'}"><span class="cup">🏆</span><b>${i < save.unlocked || !c.hidden ? c.name : '???'}</b>${save.won[c.id] ? 'gagnée' : '—'}</div>`).join('') + '</div>';
    html += '<table class="results"><tr><th>Piste</th><th>État</th><th class="num">Record</th></tr>';
    SK.COURSES.forEach((c, i) => { const unlocked = i < save.unlocked; html += `<tr><td>${i + 1}. ${unlocked || !c.hidden ? c.name : '???'}</td><td>${save.won[c.id] ? '🏆 gagnée' : unlocked ? 'débloquée' : '🔒'}</td><td class="num">${SK.fmtTime(save.best[c.id])}</td></tr>`; });
    html += '</table><h3>Coupes du grand circuit</h3><div class="trophies">'+SK.CUPS.map(c=>{const r=save.cups?.[c.id];return `<div class="trophy${r?.won?'':' locked'}"><span class="cup">🏆</span><b>${c.name}</b>${r?.won?'Gagnée · '+r.bestPoints+' pts':SK.cupUnlocked(c,save)?'Débloquée':'Verrouillée'}</div>`;}).join('')+'</div>';
    $('records').innerHTML = html;
    $('btn-records-back').onclick = () => { A.sfx('click'); openTown(); };
  }
  // ---- École : missions de pratique
  function openSchool() {
    show('school'); A.music('schoolSelect');
    SK.School.open(save,m=>{A.sfx('click');flow={mode:'practice',players:1,picks:[{charId:save.advChar,boardId:save.advBoard}],mission:m,course:SK.courseById(m.course),laps:1};startRace();},openTown);
  }

  // ---- sélection du personnage (course libre, contre-la-montre, 2 joueurs)
  function openSelect(player) {
    show('select'); A.music('select');
    const two = flow.players === 2;
    $('sel-title').textContent = two ? 'Joueur ' + (player + 1) + ' : choisis ton personnage' : 'Choisis ton personnage';
    $('sel-sub').textContent = flow.mode === 'champ' ? 'Championnat : gagne chaque piste pour débloquer la suivante.' : flow.mode === 'time' ? 'Contre-la-montre : seul sur la piste, sans tirs ni objets.' : two ? 'Écran partagé : joueur 1 à gauche (flèches), joueur 2 à droite (WASD).' : 'Course libre contre trois ordinateurs.';
    let charId = player === 0 ? save.char : save.char2, boardId = player === 0 ? save.board : save.board2;
    if (!save.boards.includes(boardId)) boardId = 'freestyle';
    const other = two && player === 1 ? flow.picks[0].charId : null;
    const cards = $('char-cards'); cards.innerHTML = '';
    const list = SK.CHARACTERS.filter(c => !c.hidden || save.shinobin);
    if (!save.shinobin) list.push({ id: 'locked', name: '???', locked: true });
    const draw = () => {
      cards.querySelectorAll('.card').forEach(el => { el.classList.toggle('selected', el.dataset.id === charId); el.classList.toggle('p2', player === 1); });
      $('sel-board').value = boardId; $('sel-board-desc').textContent = SK.boardById(boardId).desc;
    };
    for (const c of list) {
      const el = document.createElement('div'); el.className = 'card' + (c.locked ? ' locked' : ''); el.dataset.id = c.id;
      if (c.locked) { el.innerHTML = '<div style="font-size:70px;line-height:130px">🔒</div><h3>???</h3><div class="desc">Un coureur caché… Termine l\'aventure pour le découvrir.</div>'; cards.appendChild(el); continue; }
      const cv = document.createElement('canvas'); cv.width = 150; cv.height = 140; el.appendChild(cv);
      const h = document.createElement('h3'); h.textContent = c.name + (c.hidden ? ' 🥷' : ''); el.appendChild(h);
      const stats = document.createElement('div');
      for (const [k, lab] of [['speed', 'Vitesse'], ['corner', 'Virage'], ['acceleration', 'Accélération']]) { let s = `<div class="stat"><span>${lab}</span>`; for (let i = 1; i <= 5; i++) s += `<i class="${i <= c[k] ? 'on' : ''}"></i>`; stats.innerHTML += s + '</div>'; }
      el.appendChild(stats);
      const d = document.createElement('div'); d.className = 'desc'; d.textContent = c.desc; el.appendChild(d);
      if (other === c.id) { const tg = document.createElement('span'); tg.className = 'tag'; tg.textContent = 'J1'; el.appendChild(tg); }
      el.onclick = () => { A.sfx('click'); charId = c.id; draw(); };
      cards.appendChild(el);
      const ctx = cv.getContext('2d'); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, 0, 150, 140); R.drawWalker(ctx, fakeRacer(c.id, 'freestyle', 'ride', lookFor(c.id)), 75, 130, 46, 0, 'down', false);
    }
    const sel = $('sel-board'); sel.innerHTML = '';
    for (const b of SK.BOARDS) if (save.boards.includes(b.id)) { const o = document.createElement('option'); o.value = b.id; o.textContent = b.name + (b.speed || b.corner || b.acceleration ? ` (vit ${fmtMod(b.speed)} · vir ${fmtMod(b.corner)} · acc ${fmtMod(b.acceleration)})` : ''); sel.appendChild(o); }
    sel.onchange = () => { boardId = sel.value; draw(); };
    draw();
    $('btn-sel-back').onclick = () => { A.sfx('click'); if (player === 1) openSelect(0); else show('menu'); };
    $('btn-sel-ok').onclick = () => {
      A.sfx('click');
      if (player === 0) { save.char = charId; save.board = boardId; } else { save.char2 = charId; save.board2 = boardId; } store();
      flow.picks[player] = { charId, boardId };
      if (two && player === 0) openSelect(1); else openCourse();
    };
  }
  const fmtMod = v => (v > 0 ? '+' : '') + v;

  // ---- sélection de la piste
  function coursePreview(cv, course) {
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height, th = SK.THEMES[course.theme];
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.55); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = th.ground[0]; ctx.fillRect(0, H * 0.55, W, H);
    R.drawBackdrop(ctx, th.bg, 0, H * 0.55, W, th, 0);
    const road = th.road[course.surface] || th.road[Object.keys(th.road)[0]];
    for (let i = 0; i < 8; i++) { const y1 = H * 0.55 + (H * 0.45) * i / 8, y2 = H * 0.55 + (H * 0.45) * (i + 1) / 8, w1 = 6 + 60 * i / 8, w2 = 6 + 60 * (i + 1) / 8; R.quad(ctx, W / 2 - w1, y1, W / 2 - w2, y2, W / 2 + w2, y2, W / 2 + w1, y1, road[i % 2]); R.quad(ctx, W / 2 - w1 - 4, y1, W / 2 - w2 - 5, y2, W / 2 - w2, y2, W / 2 - w1, y1, th.rumble[i % 2]); R.quad(ctx, W / 2 + w1, y1, W / 2 + w2, y2, W / 2 + w2 + 5, y2, W / 2 + w1 + 4, y1, th.rumble[i % 2]); }
    R.drawProp(ctx, th.decor[0], W * 0.18, H * 0.95, 6, 0.3, 0, {}); R.drawProp(ctx, th.decor[1], W * 0.84, H * 0.9, 5, 0.7, 0, {}); R.drawProp(ctx, th.obst[0], W * 0.62, H * 0.78, 3, 0.5, 0, {});
    if (th.stars) { ctx.fillStyle = '#fff'; for (let i = 0; i < 25; i++) ctx.fillRect((i * 37) % W, (i * 23) % (H * 0.4), 2, 2); }
  }
  function openCourse() {
    show('course'); A.music(flow.mode==='time'?'timeSelect':'course');
    const adventure=flow.mode==='champ',champ=adventure||flow.browseCups!==false,oldCup=flow.cup?.id;flow.cup=null;
    $('course-title').textContent=champ?'Tournoi : choisis ta coupe':'Choisis ton tableau';
    $('course-sub').textContent=champ?'7 coupes débutantes · 5 moyennes · 3 expertes. Gagne le classement général pour débloquer la suivante.':'Choisis une piste débloquée. Les records et les victoires sont conservés.';
    document.getElementById('course-format-tabs')?.remove();
    if(!adventure){const tabs=document.createElement('div');tabs.id='course-format-tabs';tabs.className='course-format-tabs';for(const [label,cups]of [['Tournois et leurs pistes',true],['Pistes classiques',false]]){const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-pressed',String(champ===cups));b.onclick=()=>{flow.browseCups=cups;openCourse();};tabs.append(b);}$('course-sub').after(tabs);$('course-sub').textContent=champ?'Choisis un tournoi, puis une de ses pistes ou le tournoi complet.':'Choisis une piste classique.';}
    $('laps-row').classList.toggle('hidden',champ);
    const bg=$('course-backdrop'),bc=bg.getContext('2d'),th=SK.THEMES.rookie;
    const gradient=bc.createLinearGradient(0,0,0,1000);gradient.addColorStop(0,'#07437f');gradient.addColorStop(.6,'#44a8d9');gradient.addColorStop(1,'#d8effa');bc.fillStyle=gradient;bc.fillRect(0,0,1600,1000);R.drawBackdrop(bc,'mountains',0,570,1600,th,0);bc.fillStyle='#deeff8';bc.fillRect(0,570,1600,430);
    for(let i=0;i<12;i++)R.drawProp(bc,'pine',i%2?1550-i*8:30+i*9,600+i*34,22+i*2,0,0,{});
    bc.fillStyle='#ffffff80';for(let i=0;i<80;i++){bc.beginPath();bc.arc((i*137)%1600,(i*83)%1000,2+i%3,0,Math.PI*2);bc.fill();}
    const root=$('course-cards');root.innerHTML='';
    const available=champ?SK.CUPS.filter(c=>SK.cupUnlocked(c,save)):SK.COURSES.filter((c,i)=>i<save.unlocked);
    let picked=champ?(available.find(c=>c.id===oldCup)||available.find(c=>!save.cups?.[c.id]?.won)||available.at(-1))?.id:available[0]?.id;
    const refresh=()=>{root.querySelectorAll('.cup-card').forEach(el=>{el.classList.toggle('selected',el.dataset.id===picked);el.setAttribute('aria-pressed',String(el.dataset.id===picked));});const item=champ?SK.cupById(picked):SK.courseById(picked);$('btn-course-ok').disabled=!item;$('course-choice-name').textContent=item?item.name:'Choisis une course';$('course-choice-info').textContent=champ&&item?item.tracks.length+' courses · '+item.laps+' tours par course · Points : 10 / 7 / 4 / 1':'Ton prochain défi commence ici';};
    const lockIcon='<svg viewBox="0 0 32 38" aria-hidden="true"><path d="M8 16V10a8 8 0 0 1 16 0v6" fill="none" stroke="currentColor" stroke-width="5"/><rect x="2" y="15" width="28" height="21" rx="5" fill="currentColor"/><circle cx="16" cy="24" r="3" fill="#25445e"/><path d="M16 26v5" stroke="#25445e" stroke-width="3"/></svg>';
    const rails=[];
    SK.CUP_GROUPS.forEach((group,gi)=>{
      const items=champ?SK.CUPS.filter(c=>c.group===group.id):SK.COURSES.slice([0,3,7][gi],[3,7,9][gi]);
      const section=document.createElement('section');section.className='cup-section '+group.color;
      const title=champ?group.label:['Pistes débutantes','Pistes moyennes','Pistes expertes'][gi];
      section.innerHTML=`<header class="cup-heading"><span class="cup-emblem" aria-hidden="true">🏆</span><div><h3 class="n64-title" data-text="${title}">${title}</h3><p>${items.length} ${champ?'coupes':'tableaux'} · ${champ?items[0].tracks.length+' courses par coupe':'À découvrir sur la montagne'}</p></div><div class="cup-navigation"><span class="cup-position"></span><button class="cup-prev" aria-label="Précédent : ${title}">‹</button><button class="cup-next" aria-label="Suivant : ${title}">›</button></div></header><div class="cup-rail" tabindex="0" aria-label="${title}"></div>`;
      const rail=section.querySelector('.cup-rail');
      items.forEach(item=>{
        const ci=champ?SK.CUPS.indexOf(item):SK.COURSES.indexOf(item),unlocked=champ?SK.cupUnlocked(item,save):ci<save.unlocked,hidden=!champ&&item.hidden&&!unlocked;
        const previous=champ?SK.CUPS[ci-1]:SK.COURSES[ci-1],won=champ?save.cups?.[item.id]?.won:save.won[item.id];
        const el=document.createElement('button');el.className='cup-card'+(!unlocked?' locked':'');el.dataset.id=item.id;el.setAttribute('aria-disabled',String(!unlocked));el.setAttribute('aria-pressed','false');
        const name=hidden?'Piste mystère':item.name,tracks=champ?item.tracks.map(id=>{const c=SK.courseById(id);return c.hidden&&!save.won.ninja&&!save.shinobin?'Piste mystère':c.name;}).join(' · '):item.desc;
        const best=champ?save.cups?.[item.id]?.bestTime:save.best[item.id];
        el.innerHTML=`<div class="cup-art"><canvas width="420" height="200" aria-hidden="true"></canvas><span class="cup-number">${String(ci+1).padStart(2,'0')}</span>${!unlocked?'<span class="cup-lock">'+lockIcon+'</span>':''}${won?'<span class="cup-won">✓ Gagnée</span>':''}<span class="cup-format">${champ?item.tracks.length+' courses · '+item.laps+' tours':hidden?'À découvrir':item.original}</span></div><div class="cup-copy"><h4>${name}</h4><p>${unlocked?tracks:hidden?'Gagne au Pays des Ninjas pour découvrir ce tableau.':'Gagne « '+previous.name+' » pour débloquer '+(champ?'cette coupe.':'cette piste.')}</p><span class="cup-record">${best?'Record : '+SK.fmtTime(best):'Aucun record'}${champ&&save.cups?.[item.id]?' · '+save.cups[item.id].bestPoints+' pts':''}</span></div>`;
        if(!hidden)coursePreview(el.querySelector('canvas'),champ?SK.courseById(item.tracks[0]):item);else{const c=el.querySelector('canvas').getContext('2d');c.fillStyle='#243e5a';c.fillRect(0,0,420,200);c.fillStyle='#b4d9ec';c.font='900 110px Arial';c.textAlign='center';c.fillText('?',210,135);}
        el.onclick=()=>{if(!unlocked){A.sfx('nope');toast(el.querySelector('.cup-copy p').textContent);return;}picked=item.id;A.sfx('click');refresh();};rail.appendChild(el);
      });
      const prev=section.querySelector('.cup-prev'),next=section.querySelector('.cup-next'),position=section.querySelector('.cup-position');
      const update=()=>{if(!rail.clientWidth)return;const step=rail.firstElementChild.getBoundingClientRect().width+16,first=Math.round(rail.scrollLeft/step)+1,visible=Math.max(1,Math.floor((rail.clientWidth+16)/step)),overflow=rail.scrollWidth>rail.clientWidth+2;prev.hidden=next.hidden=!overflow;prev.disabled=rail.scrollLeft<3;next.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-3;position.textContent=overflow?first+'–'+Math.min(items.length,first+visible-1)+' / '+items.length:items.length+' / '+items.length;};
      const slide=d=>rail.scrollBy({left:d*(rail.firstElementChild.getBoundingClientRect().width+16),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      prev.onclick=()=>slide(-1);next.onclick=()=>slide(1);rail.onscroll=update;
      rail.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const buttons=[...rail.children],at=Math.max(0,buttons.indexOf(document.activeElement)),to=e.key==='Home'?0:e.key==='End'?buttons.length-1:SK.clamp(at+(e.key==='ArrowRight'?1:-1),0,buttons.length-1);buttons[to].focus();buttons[to].scrollIntoView({block:'nearest',inline:'nearest'});}};
      root.appendChild(section);rails.push({rail,update});
    });
    openCourse.resizeObserver?.disconnect();openCourse.resizeObserver=new ResizeObserver(()=>rails.forEach(x=>x.update()));rails.forEach(({rail,update})=>{openCourse.resizeObserver.observe(rail);update();});
    refresh();requestAnimationFrame(()=>{const chosen=root.querySelector('.selected');if(chosen){const rail=chosen.parentElement;rail.scrollLeft=Math.max(0,chosen.offsetLeft-rail.offsetLeft);}rails.forEach(x=>x.update());});
    const sel=$('sel-laps');sel.innerHTML='';SK.LAPS_CHOICES.forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o);});sel.value=save.laps;
    $('btn-course-back').onclick=()=>{A.sfx('click');if(adventure)openTown();else openSelect(flow.players-1);};
    $('btn-course-ok').onclick=()=>{if(!picked)return;A.sfx('click');if(champ){if(adventure)startCup(SK.cupById(picked));else chooseCupFormat(SK.cupById(picked));return;}save.laps=+sel.value;store();flow.course=SK.courseById(picked);flow.laps=save.laps;startRace();};
  }
  function chooseCupFormat(cup){
    const dialog=document.createElement('dialog');dialog.className='board-skin-dialog cup-format-dialog';dialog.setAttribute('aria-label',cup.name);
    const title=document.createElement('h2');title.textContent=cup.name;dialog.append(title);const hint=document.createElement('p');hint.textContent=flow.mode==='time'?'Seul contre le chrono : une piste ou toutes les courses à la suite.':'Une piste avec des adversaires ou le tournoi complet.';dialog.append(hint);
    const launch=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{dialog.close();dialog.remove();fn();};dialog.append(b);};
    launch('🏆 Jouer le tournoi complet · '+cup.tracks.length+' courses',()=>startCup(cup));
    cup.tracks.forEach((id,stage)=>{const course=SK.cupCourse(cup,stage);launch('Course '+(stage+1)+' — '+course.name+(course.blizzard?' · Tempête':'')+' · '+cup.laps+' tours',()=>{flow.cup=null;flow.course=course;flow.laps=cup.laps;startRace();});});
    launch('Retour',()=>{});dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();
  }
  function chooseBoard(onStart,tournament) {
    document.getElementById('race-board-choice')?.remove();
    const dialog=document.createElement('dialog');dialog.id='race-board-choice';
    dialog.innerHTML='<h2>Choisis ta planche</h2><p>'+ (tournament?'Tu la garderas pendant tout le tournoi.':'Prête pour cette course !')+'</p><div class="race-board-overview" aria-live="polite"></div><div class="race-board-list"></div><p class="race-board-description"></p><div class="race-board-actions"><button type="button" class="n64-btn btn-retour">Retour</button><button type="button" class="n64-btn btn-depart">Départ !</button></div>';
    let selected=flow.picks[0]?.boardId||save.advBoard||'freestyle';
    const owned=SK.BOARDS.filter(b=>b.id==='freestyle'||(save.boards||[]).includes(b.id));if(!owned.some(b=>b.id===selected))selected='freestyle';
    const list=dialog.querySelector('.race-board-list'),baseline=selected,overview=dialog.querySelector('.race-board-overview');
    const preview=id=>{
      overview.innerHTML=flow.picks.map(pick=>{const ch=SK.charById(pick.charId),cur=SK.Gym.stats(save,baseline,pick.charId),next=SK.Gym.stats(save,id,pick.charId);
        return '<section><h3>'+ch.name+' · '+SK.boardById(id).name+'</h3><small>Comparaison avec '+SK.boardById(baseline).name+'</small>'+[['speed','Vitesse'],['corner','Virage'],['acceleration','Accélération'],['jump','Saut'],['strength','Force']].map(([key,label])=>{
          const before=cur[key],after=next[key],max=Math.max(8,before,after),delta=after-before;
          return '<div class="board-total-row"><span>'+label+'</span><div class="board-total-meter">'+Array.from({length:max},(_,i)=>'<i class="'+(i<Math.min(before,after)?'filled':i<after?'gain':i<before?'loss':'')+'"></i>').join('')+'</div><b class="'+(delta>0?'gain-text':delta<0?'loss-text':'')+'">'+(delta?before+' → ':'')+after+'</b></div>';
        }).join('')+'</section>';
      }).join('');
      dialog.querySelector('.race-board-description').textContent=SK.boardById(id).desc;
    };
    const refresh=()=>{list.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===selected)));preview(selected);};
    for(const b of owned){const button=document.createElement('button');button.type='button';button.dataset.id=b.id;
      const cv=document.createElement('canvas');cv.width=360;cv.height=630;cv.style.width='120px';cv.style.height='210px';const bc=cv.getContext('2d');bc.scale(3,3);SK.Shop.drawItem(bc,{...effectiveBoard(b.id),kind:'board'},60,103,82,0,true);bc.setTransform(1,0,0,1,0,0);SK.animateBoardPreview(cv,{...effectiveBoard(b.id),kind:'board'},180,309,246);button.append(cv);
      const name=document.createElement('strong');name.textContent=b.name;button.append(name);
      const stats=document.createElement('span');stats.className='race-board-stats';const eb=effectiveBoard(b.id);
      stats.innerHTML=[['speed','Vitesse'],['corner','Virage'],['acceleration','Accélération'],['jump','Saut']].map(([key,label])=>{const v=eb[key]||0;return '<span title="'+label+'" class="'+(v>0?'positive':v<0?'negative':'neutral')+'"><i class="stat-icon stat-'+key+'"><svg viewBox="0 0 32 34">'+SK.STAT_ICONS[key]+'</svg></i>'+fmtMod(v)+'</span>';}).join('');button.append(stats);button.onpointerenter=button.onfocus=()=>preview(b.id);button.onpointerleave=button.onblur=()=>preview(selected);button.onclick=()=>{selected=b.id;A.sfx('click');refresh();};list.append(button);
    }
    dialog.querySelector('.btn-retour').onclick=()=>dialog.close();
    dialog.querySelector('.btn-depart').onclick=()=>{for(const pick of flow.picks)pick.boardId=selected;save.board=selected;if(flow.mode==='champ'||flow.mode==='practice'||flow.finalBoss)save.advBoard=selected;store();dialog.close();onStart();};
    dialog.onclose=()=>dialog.remove();document.body.append(dialog);refresh();dialog.showModal();list.querySelector('[aria-pressed="true"]').focus();
  }
  function startCup(cup,confirmed=false) {
    if(!confirmed){chooseBoard(()=>startCup(cup,true),true);return;}
    const opponents=flow.mode==='time'?[]:pickAI(Math.max(0,4-flow.picks.length),flow.picks.map(p=>p.charId),false);
    if(flow.mode!=='time'&&cup.group==='expert'&&!flow.picks.some(p=>p.charId==='shinobin'))opponents[opponents.length-1]={charId:'shinobin',boardId:'pro',ctrl:'cpu',boss:true};
    flow.cup=SK.newCupRun(cup,opponents);startCupStage();
  }
  function startCupStage(){const cup=SK.cupById(flow.cup.id);flow.course=SK.cupCourse(cup,flow.cup.stage);flow.laps=cup.laps;startRace();}

  // ---- histoire (Shinobin)
  function story(which, next) {
    show('story'); A.music(which==='ending'?'credits':'ninja');
    const cv = $('story-canvas'), ctx = cv.getContext('2d');
    const th = SK.THEMES[which === 'ending' ? 'rookie' : which === 'dizzy' ? 'dizzy' : 'ninja'];
    const g = ctx.createLinearGradient(0, 0, 0, 220); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, 900, 220);
    ctx.fillStyle = th.ground[0]; ctx.fillRect(0, 170, 900, 50); R.drawBackdrop(ctx, th.bg, 0, 170, 900, th, 0);
    const me = fakeRacer(flow.picks[0].charId, flow.picks[0].boardId, 'ride', lookFor(flow.picks[0].charId)), sh = fakeRacer('shinobin');
    R.drawRacer(ctx, me, 300, 205, 60, 0, false); if (which !== 'ending') { sh.state = 'air'; sh.h = 0.6; } R.drawRacer(ctx, sh, 600, 205, 60, 0, false);
    const myName = me.def.name;
    const texts = {
      ninja: ['Le Pays des Ninjas', `<p>Au moment du départ, une ombre bondit du haut du château et atterrit sur la ligne, planche aux pieds.</p><p><b>Shinobin</b> : « Vous êtes sur mes terres, petits. Personne ne descend cette montagne plus vite qu'un ninja. »</p><p><b>${myName}</b> : « On va voir ça ! »</p><p>Shinobin participe à la course : il est rapide, précis et doué partout. Finis <b>1er</b> pour débloquer la piste cachée.</p>`],
      dizzy: ['Le Pays Vertige', `<p>Le parc d'attractions est ouvert rien que pour vous… et Shinobin est déjà sur la ligne de départ.</p><p><b>Shinobin</b> : « Tu as eu de la chance au château. Ici, les virages n'en finissent plus. Bats-moi encore et je t'apprendrai mes secrets. »</p><p>Gagne cette dernière course et <b>Shinobin devient jouable</b>.</p>`],
      ending: ['Champion des Snow Kids !', `<p><b>Shinobin</b> retire son masque : « Tu m'as battu partout. Tu es digne de l'art du ninja. » Il te tend sa planche rouge.</p><p>Toutes les pistes sont gagnées. <b>Shinobin est maintenant jouable</b> dans tous les modes, et tu peux continuer à collectionner les pièces pour la planche Dorée.</p><p>Merci d'avoir joué à Snow Kids !</p>`],
    };
    $('story-title').textContent = texts[which][0]; $('story-text').innerHTML = texts[which][1];
    $('btn-story-ok').onclick = () => { A.sfx('click'); next(); };
  }

  // ---- boutique (chalet dessiné dans js/shop.js)
  function openShop(back, tab) {
    show('shop'); A.music('shop');
    if (!save.boards.includes(save.advBoard)) save.advBoard = 'freestyle';
    save.gear = save.gear || []; save.upgrades = save.upgrades || {};
    SK.Shop.open({
      canvas: $('shop-canvas'), save, store, toast, tab,
      els: { gold: $('shop-gold'), tabs: $('shop-tabs'), title: $('shop-title'), icon: $('shop-item'), strip: $('shop-strip'), name: $('shop-name'), me: $('shop-me'), price: $('shop-price'), desc: $('shop-desc'), buy: $('shop-buy'), prev: $('shop-prev'), next: $('shop-next'), back: $('btn-shop-back') },
      onBack: () => { SK.Shop.close(); (back || (() => show('menu')))(); },
    });
  }

  // ------------------------------------------------------------------ course
  let race = null, raf = 0, paused = false, acc = 0, last = 0, overAt = 0, canvas, ctx;
  function pickAI(count, taken, allowShinobin) {
    const pool = SK.CHARACTERS.filter(c => !taken.includes(c.id) && (!c.hidden || (allowShinobin && save.shinobin)));
    const rng = SK.rng(flow.seed || (Date.now() & 0xffff)), out = [];
    while (out.length < count && pool.length) out.push(pool.splice(rng.int(pool.length), 1)[0]);
    const boardsByDiff = [['freestyle'], ['freestyle', 'fusee', 'virage', 'acrobate'], ['fusee', 'virage', 'acrobate', 'pro']];
    return out.map(c => ({ charId: c.id, boardId: rng.pick(boardsByDiff[save.diff]), ctrl: 'cpu' }));
  }
  function startRace(confirmed=false) {
    if(!confirmed&&!flow.cup&&!flow.debug&&!new URLSearchParams(location.search).has('demo')&&!new URLSearchParams(location.search).has('mission')){chooseBoard(()=>startRace(true),false);return;}
    show('race'); A.init(); A.music('start');
    canvas = $('game'); ctx = canvas.getContext('2d');
    const racers = flow.picks.map((p, i) => ({ charId: p.charId, boardId: p.boardId, board: effectiveBoard(p.boardId), gear: gearObj(p.charId), powerLevels:save.powerLevels, strengthLevel:save.strengthLevel, look: lookFor(p.charId), ctrl: 'human', player: i }));
    if(flow.finalBoss){racers.push({charId:'shinobin',def:{...SK.charById('shinobin'),id:'matthieuboss',name:'Matthieu',hat:'crown',colors:{jacket:'#101018',pants:'#0b0b13',hat:'#8f7132',hair:'#07070d',skin:'#07070d',board:'#382e43'}},boardId:'pro',ctrl:'cpu',boss:true});}
    else if (flow.mode === 'practice') { if (['hits','pushes'].includes(flow.mission.type)) racers.push(...pickAI(3, racers.map(r => r.charId), false)); }
    else if (flow.mode !== 'time') {
      racers.push(...(flow.cup ? flow.cup.opponents : pickAI(4 - racers.length, racers.map(r => r.charId), flow.mode !== 'champ')));
      if (!flow.cup && flow.mode === 'champ' && flow.course.boss) racers.push({ charId: flow.course.boss, boardId: 'pro', ctrl: 'cpu', boss: true });
    }
    race = new SK.Race({ course: flow.course, racers, laps: flow.laps, seed: flow.seed || (Date.now() & 0xfffff) + 1, difficulty: flow.finalBoss?2:save.diff, mode: flow.mode === 'practice' ? 'free' : flow.mode, mission: flow.mode === 'practice' ? flow.mission : null });
    for(const r of race.humans){const p=SK.Profiles.peek(save,r.def.id);r.levelInfo=SK.Progression.info(p);}
    SK.PhotoPuzzles.normalize(save);
    for(const seg of race.track?.segs||race.T?.segs||[]){if(seg.puzzle&&(save.photoPieces||[]).includes(seg.puzzle.id))seg.puzzle.taken=true;}
    if(flow.cup&&race.humans[0]){const cup=SK.cupById(flow.cup.id);R.notify(race.humans[0],cup.name+' · Course '+(flow.cup.stage+1)+' / '+cup.tracks.length,'#ffe477',true,5);}
    SK.DebugHouse.close();if(flow.debug)SK.DebugHouse.attach(race,flow.lab,openDebug,startRace,togglePause);
    paused = false; acc = 0; last = 0; overAt = 0; $('pause').classList.add('hidden');
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : SK.STEP; last = ts;
    if (!SK.Session.paused && I.anyPause()) togglePause();
    if (!paused) {
      acc += dt;
      while (acc >= SK.STEP) { for (let p = 0; p < flow.players; p++) race.setInput(p, flow.debug?SK.DebugHouse.input(I.read(p)):I.read(p)); if(flow.debug)SK.DebugHouse.tick(); race.update(SK.STEP); acc -= SK.STEP; }
      handleEvents();
      if (race.phase === 'over') { if (!overAt) overAt = performance.now(); else if (performance.now() - overAt > 1800) { cancelAnimationFrame(raf); showResults(); return; } }
    }
    I.endFrame();
    const t = performance.now() / 1000;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SK.W, SK.H);
    const humans = race.racers.filter(r => r.player >= 0);
    if (humans.length === 2) { R.drawView(ctx, race, humans[0], 0, 0, SK.W / 2 - 2, SK.H, t); R.drawView(ctx, race, humans[1], SK.W / 2 + 2, 0, SK.W / 2 - 2, SK.H, t); }
    else {
      const finished=humans[0].state==='done',watch=finished?(race.racers.find(r=>r.state!=='done')||humans[0]):humans[0];
      R.drawView(ctx,race,watch,0,0,SK.W,SK.H,t);
      if(finished&&!race.mission){
        ctx.save();ctx.fillStyle='#10253def';ctx.beginPath();ctx.roundRect(24,95,350,80+race.racers.length*82,24);ctx.fill();
        ctx.fillStyle='#ffdf56';ctx.textAlign='left';ctx.font='bold 28px Arial';ctx.fillText('ARRIVÉE !',44,139);
        race.racers.slice().sort((a,b)=>a.rank-b.rank).forEach((r,i)=>{const y=154+i*82;ctx.fillStyle=r===humans[0]?'#235f8f':'#24405a';ctx.beginPath();ctx.roundRect(38,y,322,74,14);ctx.fill();R.drawFace(ctx,r,78,y+34,29);ctx.font='900 25px Arial';ctx.lineWidth=4;ctx.strokeStyle='#142a40';ctx.strokeText(String(i+1),47,y+65);ctx.fillStyle='white';ctx.fillText(String(i+1),47,y+65);ctx.font='bold 23px Arial';ctx.fillText(r.def.name,122,y+30);ctx.font='16px Arial';ctx.fillStyle='#bfe5f7';ctx.fillText(r.state==='done'?SK.fmtTime(r.finishTime):'En piste…',122,y+55);});ctx.restore();
        if(watch!==humans[0])R.drawFinishBanner(ctx,humans[0],SK.W*.65,SK.H*.22,SK.W*.65,t);
      }
    }
  }
  function updatePauseMission(){
    const panel=$('pause-mission'),m=race?.mission;panel.hidden=!m;$('pause-help').open=!m;
    if(!m){panel.replaceChildren();return;}
    const r=race.racers.find(r=>r.ctrl==='human'),outcome=SK.missionOutcome(race,r);
    const target=m.type==='slalom'?`Au moins ${m.goal} portes avant ${SK.fmtMedalTime(m.medalTimes.bronze)}.`:m.type==='time'?`Temps maximum : ${SK.fmtTime(m.goal)}.`:['nofall','edges'].includes(m.type)?'Objectif : zéro '+(m.type==='nofall'?'chute.':'contact avec les bords.'):`Objectif : ${m.goal} ${m.type==='coins'?'pièces':m.type==='tricks'?'points de figures':m.type==='hits'?'touches':'poussées'}.`;
    panel.innerHTML='<h3>'+m.name+' · Niveau '+m.level+'</h3><p class="pause-task">'+SK.missionInstruction(m)+'</p><p class="pause-target">'+target+'</p><div class="pause-mission-score">'+(m.type==='time'?SK.fmtTime(Math.max(0,race.time)):['nofall','edges'].includes(m.type)?outcome.value+(m.type==='nofall'?' chute(s)':' contact(s)'):outcome.value+' / '+m.goal)+'</div>'+(m.type==='slalom'?'<div class="pause-medals">'+['gold','silver','bronze'].map(k=>'<span>'+SK.MEDALS[k].icon+' '+SK.MEDALS[k].name+'<b>'+SK.fmtMedalTime(m.medalTimes[k])+'</b></span>').join('')+'</div><p class="pause-perfect">🏆 Or + Parfait : toutes les portes, sans chute ni bord touché.</p>':'');
  }
  function togglePause() { if (!race || race.phase === 'over') return; paused = !paused; if(paused)updatePauseMission(); SK.Touch.pause(paused); $('pause').classList.toggle('hidden', !paused); A.sfx('click'); if (paused) A.stopMusic(); else A.music(race.phase==='count'?'start':flow.mode==='practice'?'training':flow.course.theme); }
  $('btn-resume').onclick = () => togglePause();
  $('btn-quit').onclick = () => { cancelAnimationFrame(raf); paused = false; $('pause').classList.add('hidden'); race = null; A.sfx('click'); show('menu'); };
  function handleEvents() {
    for (const e of race.takeEvents()) {
      const r = e.r, human = r && r.ctrl === 'human', fromHuman = e.from && e.from.ctrl === 'human';
      switch (e.type) {
        case 'count': A.sfx('count'); break;
        case 'go': A.sfx('go'); A.music(flow.mode==='practice'?'training':flow.course.theme); break;
        case 'puzzle': if(human&&!flow.debug&&SK.PhotoPuzzles.collect(save,e.id)){store();A.sfx('coin');R.notify(r,'Pièce de casse-tête ! '+save.photoPieces.length+' / '+SK.PhotoPuzzles.ids().length,'#ffe260',true,4);} break;
        case 'bearhit': if(human)R.notify(r,'Attention à l’ours !','#ffe59b',false,1.5);break;
        case 'snowimpact': if(human){A.sfx('land');R.notify(r,'Plouf !','#e1f5ff',true);} break;
        case 'explode': A.sfx('explode'); break;
        case 'gearbonus': if(human){A.sfx('box');R.notify(r,e.text,'#ffe477',true);} break;
        case 'coin': if (human) A.sfx('coin'); break;
        case 'box': if (human) { A.sfx('box'); const d = SK.powerPresentation(r,e.kind === 'red' ? 'shot' : 'item',e.got); R.notify(r, d.icon + ' ' + d.name + (e.kind === 'red' ? '  (−' + SK.SHOT_COST + ' G)' : ''), e.kind === 'red' ? '#ff8a80' : '#82b1ff'); } break;
        case 'boxpoor': if (human) { A.sfx('nope'); R.notify(r, 'Boîte rouge : il faut ' + SK.SHOT_COST + ' G (tu en as ' + r.coins + ')', '#ff8a80'); } break;
        case 'boxfull': if (human) { A.sfx('nope'); R.notify(r, e.kind === 'red' ? 'Tu as déjà un tir : utilise-le (' + (r.player === 1 ? 'J' : 'V') + ')' : 'Tu as déjà un objet : utilise-le (' + (r.player === 1 ? 'K' : 'B') + ')', '#ffcc80'); } break;
        case 'push': if(human||e.target?.ctrl==='human'){A.sfx('land');if(human)R.notify(r,'Poussée !','#ffe477',false,1);if(e.target?.ctrl==='human')R.notify(e.target,'Bousculé !','#ffcf8a',false,1);}break;
        case 'pump': if(human)R.notify(r,'Petite poussée !','#a4e9ff',false,.8);break;
        case 'jump': if (human && e.big) A.sfx('jump'); break;
        case 'land': if (human) A.sfx('land'); break;
        case 'trick': if (human) { A.sfx('trick'); R.notify(r, e.names.join(' + ') + ' · COMBO ×' + e.combo + ' · BOOST !  +' + e.coins + ' G', '#ffd600', true); } break;
        case 'fall': if (human) { A.sfx('fall'); R.notify(r, 'Chute !', '#ff8a80'); } break;
        case 'frozen': if (human) { A.sfx('freeze'); R.notify(r, 'Gelé !', '#80deea'); } break;
        case 'obstacle': break;
        case 'wall': if (human) A.sfx('wall'); break;
        case 'barrier': if (human) { A.sfx('nope'); R.notify(r, 'Barrière ! Le portail de la remontée est ' + (race.gateX > r.x ? 'à droite →' : '← à gauche'), '#ff8a80'); } break;
        case 'shoot': if (human) { A.sfx('shoot'); } break;
        case 'item': if (human) { A.sfx(e.kind === 'ventilo' ? 'fan' : e.kind === 'invisible' ? 'invisible' : e.kind === 'nuage' ? 'rain' : e.kind === 'rocher' ? 'rock' : 'steal'); } break;
        case 'hit': if (human || fromHuman) { A.sfx(e.kind === 'gel' ? 'freeze' : e.kind === 'poele' ? 'pan' : e.kind === 'parachute' || e.kind === 'bonhomme' ? 'steal' : 'explode'); if (human) R.notify(r, SK.powerPresentation(e.from,'shot',e.kind).icon + ' ' + SK.powerPresentation(e.from,'shot',e.kind).name + (e.from ? ' de ' + e.from.def.name : '') + ' !', '#ff8a80'); if (fromHuman && !human) R.notify(e.from, SK.powerPresentation(e.from,'shot',e.kind).icon + ' Touché : ' + r.def.name, '#69f0ae'); } break;
        case 'steal': if (human) { A.sfx('steal'); R.notify(r, '🎭 Volé à ' + e.from.def.name + ' !', '#69f0ae'); } else if (e.from.ctrl === 'human') { A.sfx('steal'); R.notify(e.from, '🎭 ' + r.def.name + ' t\'a volé un objet !', '#ff8a80'); } break;
        case 'rockhit': { const trap=SK.TRAPS[e.trapType||'rock'];if(human){A.sfx('fall');R.notify(r,trap.icon+' '+trap.name+' !','#ff8a80');}else if(e.by?.ctrl==='human')R.notify(e.by,trap.icon+' '+r.def.name+' a touché ton piège','#69f0ae');break;}
        case 'lift': if (human) { A.sfx('lift'); R.notify(r, 'Tour ' + (r.lap + 1) + ' terminé · Remontée', '#fff'); } break;
        case 'lapstart': if (human) R.notify(r, r.lap + 1 === race.laps ? 'Dernier tour !' : 'Tour ' + (r.lap + 1), '#ffd600', true); break;
        case 'finish': if (human) { if(flow.mode==='practice'){const ok=SK.missionOutcome(race,r).ok;A.sfx(ok?'win':'nope');A.music(ok?'congrats':'results');}else{A.sfx(r.rank === 0 ? 'win' : 'finish'); A.music('goal','results');} } break;
        case 'gate': if (human) { A.sfx(e.ok ? 'coin' : 'nope'); R.notify(r, e.ok ? 'Porte ' + (e.n + 1) + ' ✓' : 'Porte ' + (e.n + 1) + ' ratée', e.ok ? '#69f0ae' : '#ff8a80', false, 1); } break;
      }
    }
  }

  // ---- résultats
  function showResults() {
    if(race.resultsShown)return;race.resultsShown=true;
    if(flow.debug){openDebug();return;}
    show('result'); if(flow.mode!=='practice'&&A.cur!=='goal') A.music('results');
    const res = race.results(), champ = flow.mode === 'champ', practice = flow.mode === 'practice', me = res.find(x => x.r.ctrl === 'human');
    let earned = 0, unlockedNew = null, gotShinobin = false, trophy = false, missionOk = null, unlockedMission = null;
    for (const x of res) if (x.r.ctrl === 'human') earned += x.coins + (practice ? 0 : x.prize);
    if (practice && me) { // évaluation de la mission
      const m = flow.mission, r = me.r;
      const outcome=SK.missionOutcome(race,r),v=outcome.value;missionOk=outcome.ok;
      A.music(missionOk?'congrats':'results');
      flow.missionValue = v; flow.missionReward = 0;flow.missionFirst=false;flow.missionPerfect=outcome.perfect;flow.missionMedal=outcome.medal;flow.missionTime=outcome.time;
      if(outcome.perfect)(save.missionPerfect??={})[m.id]=true;
      if (missionOk) { const result=SK.recordMission(save,m,v,outcome);earned+=result.reward;flow.missionFirst=result.first;flow.missionReward=result.reward;unlockedMission=result.unlocked; }
    }
    if (champ && !flow.cup && me && me.rank === 0 && !save.won[flow.course.id]) { trophy = true; earned += SK.TROPHY_GOLD; }
    if (flow.mode !== 'time') { save.gold += earned; }
    if (me) { const prev = save.best[flow.course.recordId||flow.course.id]; if (me.time && (!prev || me.time < prev) && !me.estimated) save.best[flow.course.recordId||flow.course.id] = me.time; }
    if (champ && me && me.rank === 0) {
      save.won[flow.course.id] = true;
      const idx = SK.COURSES.findIndex(c=>c.id===flow.course.id);
      if (idx + 1 < SK.COURSES.length && save.unlocked < idx + 2) { save.unlocked = idx + 2; unlockedNew = SK.COURSES[idx + 1]; }
      if (flow.course.id === 'dizzy' && !save.shinobin) { save.shinobin = true; gotShinobin = true; }
    }
    let cupOutcome=null;
    if(flow.cup){SK.scoreCupRace(flow.cup,res);if(flow.cup.finished&&flow.mode!=='time'){cupOutcome=SK.recordCup(save,flow.cup);if(cupOutcome.firstWin){trophy=true;earned+=SK.TROPHY_GOLD;save.gold+=SK.TROPHY_GOLD;}}}
    if(flow.finalBoss&&me?.rank===0)save.trophies.shadowKing=true;
    const xpAmount=SK.Progression.reward({finished:!!me&&!me.estimated&&!!me.time,practice,success:missionOk,first:practice&&flow.missionFirst,rank:me?.rank});
    const xpProfile=me&&me.r.def.id!==save.activeProfile?SK.Profiles.peek(save,me.r.def.id):save;
    const xpBefore=Number(xpProfile.xp)||0;
    const progress=SK.Progression.award(xpProfile,xpAmount);
    if(xpProfile!==save)save.profiles[me.r.def.id]=xpProfile;
    store();
    $('result-title').textContent = (practice ? 'École : ' + flow.mission.name : flow.course.name + ' — ' + (flow.mode === 'time' ? 'Contre-la-montre' : champ ? 'Aventure' : 'Course libre'));
    $('result-sub').innerHTML = flow.mode === 'time' ? (me && save.best[flow.course.recordId||flow.course.id] === me.time ? '🏆 Nouveau record !' : 'Record : ' + SK.fmtTime(save.best[flow.course.recordId||flow.course.id])) : 'Gagné : ' + gold(earned) + (trophy ? ' (dont ' + SK.TROPHY_GOLD + ' G de trophée)' : practice ? (flow.missionReward ? ' (dont ' + flow.missionReward + ' G de mission)' : '') : ' (pièces ramassées + prime)') + ' · Tirelire : ' + gold(save.gold);
    $('result-sub').innerHTML += '<br>+'+progress.xp+' XP · Niveau '+progress.level+(progress.points?' · +'+progress.points+' points d’entraînement !':'');
    const tip=(content,text,cls='')=>`<span class="result-tip ${cls}" tabindex="0" data-tooltip="${text}" aria-label="${text}">${content}</span>`;
    const card=(r,rank,detail,extra='',cup=false)=>`<article class="finish-card ${r.ctrl==='human'?'is-player':''} ${cup&&rank<3?['podium-gold','podium-silver','podium-bronze'][rank]:''}"><div class="finish-face"><canvas width="160" height="160" data-face="${r.def.id}" aria-label="${r.def.name}"></canvas><strong>${rank+1}</strong></div><div><h3>${r.def.name}</h3><p>${detail}</p>${extra}</div>${rank<3?tip(['🥇','🥈','🥉'][rank],['Médaille d’or : première place','Médaille d’argent : deuxième place','Médaille de bronze : troisième place'][rank]+(cup?' au classement du tournoi.':' dans cette course.'),'finish-medal'):''}</article>`;
    let html='<div class="finish-grid">'+res.map(x=>card(x.r,x.rank,tip('⏱ '+SK.fmtTime(x.time)+(x.estimated?' ≈':''),x.estimated?'Temps estimé : ce coureur était encore en piste à la fin.':'Temps pour terminer la course.'),'<div class="finish-chips">'+tip(gold(x.coins),'Pièces gagnées par ce coureur pendant la course.')+tip('🎯 '+x.stats.hits,'Nombre de tirs qui ont touché un adversaire.')+tip('✊ '+(x.stats.pushes||0),'Nombre de poussées réussies avec N.')+'</div>')).join('')+'</div>';
    const xpInfo=SK.Progression.info(xpProfile);
    $('result-sub').innerHTML='<div class="finish-rewards"><div class="reward-gold">'+tip('<span class="reward-plus">+</span>'+'<span class="gold-inline"><img src="'+SK.COIN_SVG+'" alt=""><span class="reward-gold-number" data-gold="'+earned+'">0</span></span>','Total de pièces gagnées : récolte et récompenses de cette course.')+'</div><div class="reward-progress"><div class="reward-progress-heading">'+tip('⭐ +'+progress.xp+' XP','Expérience gagnée pendant cette course. Elle fait progresser ton personnage.')+'<strong>Niveau '+xpInfo.level+'</strong></div><progress class="result-xp-bar" value="'+xpInfo.current+'" max="'+xpInfo.needed+'" aria-label="Progression vers le niveau '+(xpInfo.level+1)+'"></progress><div class="reward-progress-caption">'+xpInfo.current+' / '+xpInfo.needed+' XP <span>Prochain niveau : '+(xpInfo.level+1)+'</span></div></div>'+(progress.points?'<div class="reward-training">'+tip('💪 +'+progress.points+' points','Points d’entraînement gagnés : utilise-les au gym pour améliorer ton personnage.')+'</div>':'')+'</div>';
    requestAnimationFrame(()=>SK.Progression.animateResult($('result-sub'),xpBefore,Number(xpProfile.xp)||0,()=>A.sfx('unlock')));
    if(flow.mode==='time')$('result-sub').innerHTML += '<p>'+ (me && save.best[flow.course.recordId||flow.course.id]===me.time?'🏆 Nouveau record !':'Record : '+SK.fmtTime(save.best[flow.course.recordId||flow.course.id]))+'</p>';
    if (champ && me && !flow.cup) html += me.rank === 0 ? `<p class="story-text">🏆 <b>Victoire !</b> ${trophy ? 'Un trophée pour ton musée, et ' + SK.TROPHY_GOLD + ' G ! ' : ''}${unlockedNew ? 'Nouvelle piste débloquée : <b>' + unlockedNew.name + '</b>.' : ''}</p>` : `<p class="story-text">Il faut finir <b>1er</b> pour débloquer la piste suivante. Réessaie, ou passe à la boutique.</p>`;
    if (practice) { $('result-title').textContent=flow.missionMedal==='gold'&&flow.missionPerfect?'🏆 OR + PARFAIT !':flow.missionPerfect?'🌟 Mission parfaite !':missionOk?'Mission réussie !':'Mission échouée';const m=flow.mission,v=flow.missionValue;html='<div class="mission-result-score">'+(m.type==='time'?SK.fmtTime(v):['nofall','edges'].includes(m.type)?v+(m.type==='nofall'?' chute(s)':' contact(s)'):v+' / '+m.goal)+'</div>'+(flow.missionPerfect?'<p class="mission-perfect">🌟 PARFAIT ! 🌟</p>':'')+(flow.missionFirst?'<p class="mission-first">🏆 Première réussite !<br>+'+flow.missionReward+' G · +120 XP</p>':'')+(!missionOk?'<p class="story-text">Veux-tu réessayer ?</p>':''); }
    if(practice&&flow.mission.type==='slalom'){
      const medal=SK.MEDALS[flow.missionMedal];html+='<div class="slalom-medal '+(flow.missionMedal||'')+'">'+(medal?medal.icon+' '+medal.name:'Pas de médaille')+'</div><p class="slalom-time">⏱ '+SK.fmtTime(flow.missionTime)+'</p>';
      if(flow.missionMedal==='gold'&&flow.missionPerfect)html+='<div class="slalom-masterpiece">✨ OR + PARFAIT ✨<br><small>Toutes les portes · Aucune chute · Aucun bord touché</small></div>';
      if(!missionOk)html+='<p class="story-text">'+(flow.missionValue<flow.mission.goal?'Il faut au moins '+flow.mission.goal+' portes. ':'')+(flow.missionTime>flow.mission.medalTimes.bronze?'Temps limite dépassé.':'')+'</p>';
    }


    if(flow.cup){const cup=SK.cupById(flow.cup.id),rows=SK.cupStandings(flow.cup);$('result-title').textContent=(flow.cup.finished?'🏆 Fin du tournoi':'Course '+(flow.cup.stage+1)+' / '+cup.tracks.length);html='<div class="finish-columns"><section aria-label="Classement de la course"><h3 class="finish-heading">🏁 Classement de la course</h3>'+html+'</section><section aria-label="Classement du tournoi"><h3 class="finish-heading">🏆 Classement du tournoi</h3><div class="finish-grid cup-cards">'+rows.map((row,i)=>{const r=race.racers.find(r=>r.def.id===row.id)||SK.fakeRacer(row.id,'freestyle','ride',lookFor(row.id));return card(r,i,tip('⭐ '+row.points+' points','Points cumulés dans les courses de ce tournoi.'),'',true);}).join('')+'</div></section></div>';if(cupOutcome)html+='<p class="story-text">'+(cupOutcome.won?'🏆 Tournoi gagné !':'La prochaine fois sera la bonne !')+'</p>';}
    if(flow.cup&&flow.mode==='time'){
      flow.cup.times ||= {};flow.cup.times[flow.cup.stage]=me?.time||0;
      const total=Object.values(flow.cup.times).reduce((a,b)=>a+b,0),cup=SK.cupById(flow.cup.id),key='cup:'+cup.id+':total:time';
      if(flow.cup.finished&&(!save.best[key]||total<save.best[key])){save.best[key]=total;store();}
      html='<h3 class="finish-heading">⏱ Temps du tournoi</h3><ol class="cup-time-list">'+cup.tracks.map((id,i)=>'<li>Course '+(i+1)+' — '+SK.cupCourse(cup,i).name+' <strong>'+(flow.cup.times[i]?SK.fmtTime(flow.cup.times[i]):'À venir')+'</strong></li>').join('')+'</ol><p class="story-text">Temps cumulé : <strong>'+SK.fmtTime(total)+'</strong>'+(save.best[key]?' · Record du tournoi : '+SK.fmtTime(save.best[key]):'')+'</p>';
    }
    if(unlockedMission){html+='<p class="mission-unlocked" role="status">🔓 Nouvelle mission débloquée !<br><strong>'+unlockedMission.name+' · Niveau '+unlockedMission.level+'</strong></p>';A.sfx('unlock');}
    $('result').innerHTML = html;
    document.querySelectorAll('[data-face]').forEach(c=>{const r=race.racers.find(r=>r.def.id===c.dataset.face)||SK.fakeRacer(c.dataset.face,'freestyle','ride',lookFor(c.dataset.face));R.drawFace(c.getContext('2d'),r,80,80,72);});
    const podium=$('cup-podium');podium.hidden=!(cupOutcome?.won);
    if(!podium.hidden)SK.Podium.start(podium,SK.cupStandings(flow.cup).slice(0,3),lookFor);

    const btns = $('result-buttons'); btns.innerHTML = ''; btns.classList.toggle('cup-actions',!!flow.cup&&!flow.cup.finished);
    const mk = (label, cls, fn) => { const b = document.createElement('button'); b.textContent = label; b.className = cls; b.onclick = () => { A.sfx('click'); fn(); }; btns.appendChild(b); };
    if(flow.cup){const cup=SK.cupById(flow.cup.id);if(!flow.cup.finished)mk('CONTINUER','primary continue-cup',()=>{flow.cup.stage++;startCupStage();});mk('Recommencer la coupe',flow.cup.finished?'primary':'',()=>startCup(cup));}else if(!practice)mk('Rejouer', 'primary', startRace);else if(!missionOk)mk('Réessayer', 'primary', ()=>startRace());
    if(flow.finalBoss){$('result-title').textContent=me?.rank===0?'Le dernier défi : victoire !':'Le dernier défi';mk('Salle du trône','gold',openThrone);mk('Village','',openTown);return;}
    if (practice) { if(unlockedMission)mk('Jouer le niveau '+unlockedMission.level,'primary',()=>{flow.mission=unlockedMission;flow.course=SK.courseById(unlockedMission.course);flow.seed=null;startRace();}); mk('Retour à l\'École', 'gold', openSchool); mk('Village', '', openTown); mk('Menu', 'ghost', () => show('menu')); return; }
    if (champ && unlockedNew && !flow.cup) mk('Piste suivante : ' + unlockedNew.name, 'gold', () => { flow.course = unlockedNew; flow.laps = unlockedNew.laps; if (unlockedNew.boss) story(unlockedNew.id === 'ninja' ? 'ninja' : 'dizzy', startRace); else startRace(); });
    if(!flow.cup)mk('Changer de piste', '', openCourse);
    if (champ||flow.cup) mk('Retour au village', 'gold', openTown); else if (flow.mode !== 'time') mk('Boutique', 'gold', () => openShop(() => show('menu')));
    if(!flow.cup)mk('Menu', 'ghost', () => show('menu'));
    if (me && me.rank === 0) A.sfx('win');
    if (gotShinobin && !flow.cup) setTimeout(() => { A.sfx('unlock'); story('ending', () => { save.ending = true; store(); openTown(); }); }, 900);
    else if (unlockedNew) setTimeout(() => A.sfx('unlock'), 600);
  }

  // ------------------------------------------------------------------ démarrage
  function boot() {
    I.init(); SK.Cheats.init({getSave:()=>save,store,refresh:refreshMenu}); initMenu(); SK.Home.init(); refreshMenu();
    A.enabled = save.sound; A.musicOn = save.music;
    document.addEventListener('pointerdown', () => { A.init(); if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); if (A.player.paused && A.cur) A.music(A.cur); }, { once: false });
    document.addEventListener('keydown', () => { A.init(); if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); if (A.player.paused && A.cur) A.music(A.cur); });
    SK.Session.init({getSave:()=>save,store,isPaused:()=>paused,pause:()=>{const running=SK.Touch.screen==='race'&&!paused&&race?.phase!=='over';const music=A.cur;if(running)togglePause();A.stopMusic();return {running,music};},resume:previous=>{if(previous.running&&paused)togglePause();else if(!paused&&previous.music)A.music(previous.music);}});
    show('menu');
    const anim = () => { if (!$('screen-menu').classList.contains('hidden')) menuAnim(performance.now() / 1000); requestAnimationFrame(anim); }; anim();
    const q = new URLSearchParams(location.search);
    if (q.has('screen')) { // ?screen=select|course|shop (captures d'écran)
      flow = { mode: q.get('mode') || 'champ', players: 1, picks: [{ charId: 'zach', boardId: 'freestyle' }] };
      if (q.has('unlock')) { save.unlocked = +q.get('unlock'); save.gold = 4200; save.shinobin = q.has('shinobin'); }
      if (q.has('unlock')) { save.advChar = 'zach'; save.boards = ['freestyle', 'fusee']; }
      ({ gym:openGym, select: () => openSelect(0), course: openCourse, shop: () => openShop(openTown, q.get('tab') || undefined), story: () => story('ninja', () => show('menu')), town: openTown, adv: () => advSelect(() => show('menu')), records: openRecords, museum: openMuseum, wardrobe: openWardrobe, school: openSchool })[q.get('screen')]();
    }
    if (q.has('mission')) { const m = SK.missionById(q.get('mission')); flow = { mode: 'practice', players: 1, picks: [{ charId: 'zach', boardId: 'freestyle' }], mission: m, course: SK.courseById(m.course), laps: 1, seed: 7 }; startRace(); if (q.has('t')) { const n = Math.round(+q.get('t') / SK.STEP); for (let i = 0; i < n && race.phase !== 'over'; i++) { race.setInput(0, { steer: Math.sin(i / 40) }); race.update(SK.STEP); } race.takeEvents(); } }
    if (q.has('demo')) { // ?demo=rookie : lance tout de suite une course (capture d'écran, tests)
      flow = { mode: 'free', players: 1, picks: [{ charId: 'zach', boardId: 'freestyle' }, { charId: 'eliott', boardId: 'freestyle' }].slice(0, 1), course: SK.courseById(q.get('demo')) || SK.COURSES[0], laps: 3, seed: +(q.get('seed') || 0) || undefined };
      startRace();
      if (q.has('cpu')) for (const r of race.racers) r.ctrl = 'cpu';
      if (q.has('t')) { const n = Math.round(+q.get('t') / SK.STEP); for (let i = 0; i < n && race.phase !== 'over'; i++) race.update(SK.STEP); race.takeEvents(); }
    }
  }
  SK.Sprites.ready.then(boot);
})(window.SK);
