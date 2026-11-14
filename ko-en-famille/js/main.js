// K.O. en Famille — écrans, sauvegarde, aventure (jours, gym, tournoi, or, boutique, combos), boucle d’animation.
(function (root) {
  'use strict';
  const BX = root.BX, A = BX.art, AU = BX.audio, F = BX.fight, HB = BX.hub;
  const $ = s => document.querySelector(s);
  const W = 1280, H = 720;
  const app = BX.app = {};
  const COIN = '<i class="coin"></i>';

  // ---------- Sauvegarde ----------
  function blank() { return { sel: 'matthieu', chars: {} }; }
  let save = blank();
  let debugClicks = 0;
  const debugMode = () => save.debug === true;
  try { const s = JSON.parse(localStorage.getItem(BX.SAVE_KEY) || 'null'); if (s && s.chars) save = Object.assign(blank(), s); } catch (e) { }
  const persist = () => { try { localStorage.setItem(BX.SAVE_KEY, JSON.stringify(save)); } catch (e) { } };
  function prog(id) {
    const p = save.chars[id] || (save.chars[id] = { bonus: {}, beaten: [], wins: 0, losses: 0, belts: [] });
    if (!p.xp) p.xp = {}; if (!p.best) p.best = {}; if (!p.bonus) p.bonus = {};
    for (const s of BX.STATS) { if (p.xp[s.id] == null) p.xp[s.id] = 0; if (p.bonus[s.id] == null) p.bonus[s.id] = 0; }
    if(p.level==null){
      const legacy=BX.STATS.reduce((sum,s)=>sum+(p.xp[s.id]||0),0),initial=BX.progress.plan(1,0,legacy);
      p.level=initial.toLevel;p.exp=initial.toXp;p.statPoints=(initial.toLevel-1)*BX.progress.POINTS_PER_LEVEL;
    }
    p.exp=p.exp||0;p.statPoints=p.statPoints||0;
    if(p.c&&!p.c.catRoster){
      const oldOrder=BX.ORDER.filter(id=>id!=='minou'),next=oldOrder[p.c.pos];
      if(p.c.pos>=oldOrder.length)p.c.pos++;
      else if(p.c.pos>oldOrder.indexOf('meteo')+1&&next)p.c.pos=BX.ORDER.indexOf(next);
      p.c.catRoster=1;
    }
    if (BX.gym.migrateDifficulties(p)) persist();
    if (BX.migrateLeagues(p)) persist();
    const remembered=[...new Set([...(p.practiceBeaten||[]),...p.beaten])];
    if(JSON.stringify(remembered)!==JSON.stringify(p.practiceBeaten)){p.practiceBeaten=remembered;persist();}
    return p;
  }
  function statsOf(ch) { const pr = prog(ch.id), o = {}; for (const s of BX.STATS) o[s.id] = Math.min(BX.statCap(pr), (ch.stats[s.id] || 1) + (pr.bonus[s.id] || 0)); return o; }
  function gainXp(ch, stat, n) {
    const pr = prog(ch.id), plan = BX.progress.plan(pr.level, pr.exp, n);
    pr.exp=plan.toXp;pr.level=plan.toLevel;pr.statPoints+=(plan.toLevel-plan.fromLevel)*BX.progress.POINTS_PER_LEVEL;
    return plan.toLevel - plan.fromLevel;
  }

  function grantReward(ch, stat, amount) {
    const pr=prog(ch.id), reward=Object.assign({stat:'general'},BX.progress.plan(pr.level,pr.exp,amount));
    gainXp(ch,stat,amount);return reward;
  }

  // ---------- Aventure ----------
  function newCareer(ch) { return { catRoster:1, leagueRoster:2, day: 1, moments: BX.MOMENTS, pos: 0, fightDay: 3, gold: 40, items: {}, combos: [], retry: false, coach: BX.COACHES.includes(save.coach) ? save.coach : 'richard' }; }
  const career = ch => prog(ch.id).c;
  function ladderList(pr) { return BX.ladder(pr); }
  function nextBoxer(ch) {
    const pr = prog(ch.id), c = pr.c, list = ladderList(pr);
    if (pr.beaten.includes('contretemps') && !pr.beaten.includes('ombre') && c.day < c.secretRevealDay) return { b: BX.boxerById('contretemps'), title: true, pending: true };
    if (c.pos < list.length) return { b: list[c.pos], title: false };
    const top = list.slice(-4); return { b: top[c.fightDay % top.length], title: true };
  }
  const daysLeft = c => Math.max(0, c.fightDay - c.day);
  function hubInfo(ch) {
    const c = career(ch), nb = nextBoxer(ch), dl = daysLeft(c), md = dl <= 0 && !nb.pending;
    c.moments = Math.min(c.moments, BX.MOMENTS);
    return { day: c.day, moments: c.moments, gold: c.gold, matchDay: md, daysLeft: dl, fightDay: c.fightDay, fightDays: nb.pending ? (c.fightDays || []) : [...(c.fightDays || []), c.fightDay], next: nb.b, title: nb.title, coach: BX.charById(c.coach), stats: statsOf(ch), level: prog(ch.id).level, exp: prog(ch.id).exp, statPoints: prog(ch.id).statPoints, pending: !!nb.pending, debug: debugMode(), locked: { train: md && !debugMode(), door: md && !debugMode() } };
  }
  function look(ch) {
    return {...ch,gloves:BX.gloveTier(prog(ch.id).belts).color};
  }
  function gearMods(c) {
    const m = { dmg: 0, dodge: 0, def: 0, heal: 0, hearts: 0, stars: 0 };
    let glove = 0;
    for (const it of BX.ITEMS) { if (!c.items[it.id] || it.use) continue; if (it.slot === 'gants') glove = Math.max(glove, it.mods.dmg); else for (const k in it.mods) m[k] += it.mods[k]; }
    m.dmg += glove; return m;
  }
  app.save = () => save; app.persist = persist; app.prog = prog;
  app.gold = (n, id) => { const ch = BX.charById(id || save.sel), pr = prog(ch.id); if (!pr.c) pr.c = newCareer(ch); pr.c.gold += n; persist(); };
  app.xp = (stat, n, id) => { gainXp(BX.charById(id || save.sel), stat, n); persist(); };
  app.setDay = (fightIn, id) => { const pr = prog(id || save.sel); if (!pr.c) pr.c = newCareer(BX.charById(id || save.sel)); pr.c.fightDay = pr.c.day + fightIn; persist(); };
  app.pos = (n, id) => { const pr = prog(id || save.sel); if (!pr.c) pr.c = newCareer(BX.charById(id || save.sel)); pr.c.pos = n; pr.beaten = BX.ORDER.slice(0, n); persist(); };

  // ---------- Mise à l’échelle de la scène ----------
  const stage = $('#stage'), cv = $('#cv'), ctx = cv.getContext('2d');
  let q = 1, scale = 1;
  function fit() {
    scale = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = 'translate(-50%,-50%) scale(' + scale + ')';
    q = Math.min(2, Math.max(1, scale * (devicePixelRatio || 1)));
    cv.width = Math.round(W * q); cv.height = Math.round(H * q);
  }
  addEventListener('resize', fit); fit();

  // ---------- Écrans ----------
  let screen = 'title', cur = { ch: null, boxer: null }, menuArena = null, menuKey = '';
  function show(id) {
    debugClicks = 0;
    screen = id;
    cv.classList.toggle('chicken-hunt',id==='gym'&&BX.gym.state()?.mode==='poulet');
    const musicScene = id === 'fight' ? 'fight' : id === 'vs' ? 'intro' : id === 'gym' ? 'training'
      : id === 'result' ? (F.state() && F.state().result && F.state().result.win ? 'win' : 'lose') : id === 'run' ? 'run' : id === 'title' ? 'title' : 'gym';
    AU.scene(musicScene, { circuit: cur.boxer && cur.boxer.circuit });
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('hidden', s.id !== 'screen-' + id));
    $('#fight-ui').classList.toggle('hidden', id !== 'fight');
    if (id === 'select') renderSelect();
    if (id === 'circuit') renderCircuit();
    if (id !== 'fight') AU.crowd(id === 'vs' ? .8 : id === 'title' ? .35 : 0);
    if (id !== 'hub') HB.clearKeys();
  }
  app.show = show;

  $('#btn-play').onclick = () => { AU.unlock(); AU.play('select'); show('select'); };
  function soundLabels() {
    for (const key of ['sound', 'music']) $('#config-' + key).checked = AU.pref[key];
    const volume = Math.round((AU.pref.volume ?? .8) * 100);
    $('#config-volume').value = volume;
    $('#config-volume-value').textContent = volume + ' %';
  }
  $('#btn-config').onclick = () => { AU.unlock(); soundLabels(); $('#title-config').showModal(); };
  for (const key of ['sound', 'music']) $('#config-' + key).onchange = e => {
    AU.unlock(); AU[{ sound: 'setSound', music: 'setMusic' }[key]](e.target.checked); soundLabels();
  };
  $('#config-volume').oninput = e => { AU.setVolume(+e.target.value / 100); soundLabels(); };
  soundLabels();

  // ---------- Choix du boxeur ----------
  function headCanvas(id, size, view) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const draw = () => { const g = c.getContext('2d'); g.clearRect(0, 0, size, size); if (root.FamilyHeads && root.FamilyHeads.has(id)) root.FamilyHeads.draw(g, id, view || 'front', size * .08, size * .04, size * .84, size * .92); };
    draw(); if (root.FamilyHeads) root.FamilyHeads.ready.then(draw); return c;
  }
  app.headCanvas = headCanvas;
  function statRows(ch) {
    const pr = prog(ch.id), st = statsOf(ch), rows = document.createElement('div'); rows.className = 'stat-rows';
    for (const s of BX.STATS) {
      const base=ch.stats[s.id]||1,v=st[s.id];let pips='';for(let i=1;i<=10;i++)pips+='<i class="'+(i<=v-10?'double':i<=base?'b':i<=v?'x':'')+'"></i>';
      const r=document.createElement('div');r.className='stat';r.innerHTML='<span class="ic">'+s.icon+'</span><span class="nm">'+s.name+'<small>'+s.desc+'</small></span><span class="pips">'+pips+'</span><span class="val">'+v+'</span>';
      rows.appendChild(r);
    }
    return rows;
  }
  const kids = () => BX.KIDS.map(BX.charById);
  function browseKid(direction) {
    const index = BX.KIDS.indexOf(save.sel);
    save.sel = BX.KIDS[(index + direction + BX.KIDS.length) % BX.KIDS.length];
    debugClicks = 0; persist(); AU.play('select'); renderSelect();
  }
  function renderSelect() {
    if (!BX.KIDS.includes(save.sel)) save.sel = BX.KIDS[0];
    const ch = BX.charById(save.sel), pr = prog(ch.id);
    const grid = $('#roster');
    grid.innerHTML = '<div class="fighter-heading" aria-live="polite"><span class="fighter-count">' + (BX.KIDS.indexOf(ch.id) + 1) + ' / ' + BX.KIDS.length + '</span><h2>' + ch.name + '</h2><p>« ' + ch.nick + ' »</p></div><canvas id="fighter-preview" width="720" height="520" aria-label="' + ch.name + ' fait du shadow-boxing"></canvas><button id="fighter-prev" class="btn fighter-arrow" aria-label="Boxeur précédent">❮</button><button id="fighter-next" class="btn fighter-arrow" aria-label="Boxeur suivant">❯</button>';
    for (const [id, step] of [['fighter-prev', -1], ['fighter-next', 1]]) {
      $('#' + id).onclick = () => { browseKid(step); $('#' + id).focus({preventScroll:true}); };
    }
    const sheet = $('#sheet'); sheet.innerHTML = '<h2>Prêt pour le ring ?</h2>'; sheet.style.setProperty('--c', ch.tank);
    sheet.insertAdjacentHTML('beforeend', '<p class="rec">' + pr.wins + ' victoires · ' + pr.losses + ' défaites' + (pr.c ? ' · Jour ' + pr.c.day : ' · Nouvelle aventure') + '</p>');
    const rows = statRows(ch);
    rows.querySelectorAll('.nm small').forEach(desc => { desc.parentElement.parentElement.title = desc.textContent; desc.remove(); });
    sheet.appendChild(rows);
    const coachId = pr.c && BX.COACHES.includes(pr.c.coach) ? pr.c.coach : (BX.COACHES.includes(save.coach) ? save.coach : 'richard');
    const coach = BX.charById(coachId), specialty = BX.STATS.find(stat => stat.id === BX.COACH_SPEC[coachId]);
    const row = document.createElement('div'); row.className = 'coach-picker';
    row.innerHTML = '<button id="coach-prev" class="btn small" aria-label="Coach précédent">❮</button><button id="coach-face" class="coach-portrait" aria-label="Coach ' + coach.name + '"></button><div class="coach-info"><small>TON COACH</small><b>' + coach.name + '</b><span>+25 % XP · ' + specialty.name + '</span></div><button id="coach-next" class="btn small" aria-label="Coach suivant">❯</button>';
    sheet.appendChild(row); $('#coach-face').appendChild(headCanvas(coachId, 96));
    function changeCoach(step) {
      const next = BX.COACHES[(BX.COACHES.indexOf(coachId) + step + BX.COACHES.length) % BX.COACHES.length];
      save.coach = next; if (pr.c) pr.c.coach = next;
      debugClicks = 0; persist(); AU.play('select'); renderSelect();
      $(step < 0 ? '#coach-prev' : '#coach-next').focus({preventScroll:true});
    }
    $('#coach-prev').onclick = () => changeCoach(-1); $('#coach-next').onclick = () => changeCoach(1);
    $('#coach-face').onclick = () => { debugClicks = coachId === 'matthieu' ? debugClicks + 1 : 0; if (debugClicks === 7) { save.debug = true; persist(); AU.play('star'); renderSelect(); } };
    const go = document.createElement('button'); go.id = 'btn-adventure'; go.className = 'btn big primary'; go.textContent = pr.c ? '▶ Continuer l’aventure' : '🥊 Commencer l’aventure'; go.onclick = () => enterHub(); sheet.appendChild(go);
    const free = document.createElement('button'); free.id = 'btn-free-match'; free.className = 'btn'; free.textContent = 'Faire un match libre'; free.onclick = openPractice; sheet.appendChild(free);
    if (pr.c || debugMode()) {
      const more = document.createElement('details'); more.className = 'select-options'; more.innerHTML = '<summary>Options de l’aventure' + (debugMode() ? ' · debug actif' : '') + '</summary>'; sheet.appendChild(more);
      if (debugMode()) {
        const off = document.createElement('button'); off.className = 'btn small'; off.textContent = 'Désactiver le mode debug';
        off.onclick = () => { save.debug = false; debugClicks = 0; persist(); renderSelect(); }; more.appendChild(off);
      }
      if (pr.c) {
        const rs = document.createElement('button'); rs.className = 'btn small reset'; rs.textContent = '↺ Recommencer à zéro';
        rs.onclick = () => { if (confirm('Recommencer l’aventure de ' + ch.name + ' à zéro ? Stats, or, objets et victoires seront effacés.')) { delete save.chars[ch.id]; persist(); renderSelect(); } }; more.appendChild(rs);
      }
    }
    drawSelectPreview(performance.now() / 1000);
  }
  function drawSelectPreview(time) {
    const canvas = $('#fighter-preview'); if (!canvas) return;
    const g = canvas.getContext('2d'), ch = BX.charById(save.sel);
    g.clearRect(0, 0, 720, 520);
    const glow = g.createRadialGradient(360, 285, 30, 360, 285, 300);
    glow.addColorStop(0, ch.tank + '55'); glow.addColorStop(1, 'transparent');
    g.fillStyle = glow; g.fillRect(0, 0, 720, 520);
    g.fillStyle = '#0007'; g.beginPath(); g.ellipse(360, 496, 135, 19, 0, 0, Math.PI * 2); g.fill();
    const beat = time % 3.2, first = beat < .55, second = beat >= .75 && beat < 1.3;
    const phase = first ? beat / .55 : second ? (beat - .75) / .55 : 0;
    const extension = first || second ? Math.sin(phase * Math.PI) ** 2 : 0;
    A.playerFront(g, look(ch), 360 + Math.sin(time * 2.8) * 9, 496 + Math.sin(time * 5.6) * 3, .88 / A.childScale(ch), time, {side:first ? -1 : 1, e:extension});
  }
  $('#btn-select-back').onclick = () => show('title');

  function practiceRoster(ch){
    const pr=prog(ch.id),best=Math.max(-1,...pr.practiceBeaten.map(id=>BX.ORDER.indexOf(id)));
    return BX.ORDER.slice(0,best+1).map(BX.boxerById).filter(Boolean).reverse();
  }
  function openPractice(){
    cur.practice=false;cur.ch=BX.charById(save.sel);const list=practiceRoster(cur.ch);
    $('#practice-caption').textContent=list.length?cur.ch.name+' · Tes adversaires restent débloqués, même après des défaites. Pratique sans récompense ni objet consommé.':'Gagne ton premier combat dans l’aventure pour débloquer un adversaire ici.';
    const host=$('#practice-opponents');host.innerHTML='';
    for(const [i,b] of list.entries()){
      const button=document.createElement('button');button.className='btn practice-opponent';button.dataset.boxer=b.id;
      button.innerHTML='<small>'+BX.CIRCUITS.find(c=>c.id===b.circuit).name+'</small><b>'+b.nick+'</b><span>'+b.name+'</span><small>'+(i===0?'★ Dernier adversaire débloqué':'Déjà accessible')+'</small>';
      button.onclick=()=>{if(practiceRoster(cur.ch).some(x=>x.id===b.id))openVs(b,true);};host.appendChild(button);
    }
    show('practice');
  }
  $('#btn-practice-back').onclick=()=>show('select');
  function backFromVs(){AU.hush();if(cur.practice)openPractice();else show('circuit');}

  // ---------- Gym (aventure) ----------
  function enterHub(banner) {
    cur.practice=false;AU.unlock();
    const ch = BX.charById(save.sel), pr = prog(ch.id);
    let fresh = false;
    if (!pr.c) { pr.c = newCareer(ch); fresh = true; persist(); }
    cur.ch = ch;
    HB.enter(look(ch), () => hubInfo(ch), onSpot);
    closeModal(); show('hub');
    if (debugMode()) HB.banner('MODE DEBUG', 'Entraînements au choix et illimités · combats facultatifs.');
    else if (fresh) { const nb = nextBoxer(ch); HB.banner('NOUVELLE AVENTURE !', 'Ton premier combat contre ' + nb.b.nick + ' est dans ' + daysLeft(pr.c) + ' jours. Entraîne-toi !'); }
    else if (Array.isArray(banner) && typeof banner[0] === 'string') HB.banner(banner[0], banner[1], banner[2]);
  }
  app.enterHub = enterHub;
  function endDay() {
    const ch = cur.ch, c = career(ch);
    c.day++; c.moments = BX.MOMENTS; persist();
    const dl = daysLeft(c), nb = nextBoxer(ch);
    if (c.secretRevealDay === c.day && !prog(ch.id).beaten.includes('ombre')) { c.fightDay = c.day; persist(); HB.banner('UNE INVITATION MYSTÉRIEUSE…', 'Un dernier défi vient d’apparaître au tableau.', '#b58aff'); AU.play('bell1'); return; }
    if (nb.pending) HB.banner('CHAMPION DES TITANS !', 'Profite de quelques jours au gym.');
    else if (debugMode()) HB.banner('JOUR ' + c.day + ' · DEBUG', 'Entraîne-toi autant que tu veux.');
    else if (dl <= 0) HB.banner('JOUR DE COMBAT !', 'Va au tableau des combats : ' + nb.b.nick + ' t’attend.', '#ff5252');
    else HB.banner('JOUR ' + c.day, 'Combat contre ' + nb.b.nick + ' dans ' + dl + ' jour' + (dl > 1 ? 's' : '') + '.');
    AU.play('bell1');
  }
  function onSpot(id) {
    const ch = cur.ch, c = career(ch), inf = hubInfo(ch);
    if (id === 'train') { if (inf.locked.train) { HB.banner('FERMÉ', 'Pas d’entraînement le jour du combat !', '#ff5252'); return; } openTrain(); }
    if (id === 'board') show('circuit');
    if (id === 'calendar') openCalendar();
    if (id === 'stats') openStats();
    if (id === 'coach') openCoach();
    if (id === 'shop') openShop();
    if (id === 'door') {
      if (inf.locked.door) { HB.banner('PAS AUJOURD’HUI', 'Ton combat t’attend au tableau !', '#ff5252'); return; }
      modal('<h2>🚪 Rentrer dormir ?</h2><p>Il te reste <b>' + c.moments + '</b> moment' + (c.moments > 1 ? 's' : '') + ' libre' + (c.moments > 1 ? 's' : '') + ' aujourd’hui. Si tu rentres, la journée se termine.</p>',
        [['😴 Dormir', () => { closeModal(); endDay(); }, 'primary'], ['Rester', closeModal]]);
    }
  }
  // Fenêtres du gym
  function modal(html, buttons) {
    const m = $('#hub-modal'); m.innerHTML = '<div class="hub-box">' + html + '<div class="hub-btns"></div></div>'; m.classList.remove('hidden');
    const bb = m.querySelector('.hub-btns');
    for (const [label, fn, cls] of buttons || [['Fermer', closeModal]]) { const b = document.createElement('button'); b.className = 'btn ' + (cls || ''); b.textContent = label; b.onclick = fn; bb.appendChild(b); }
    HB.clearKeys(); return m;
  }
  function closeModal() { $('#hub-modal').classList.add('hidden'); }
  const modalOpen = () => !$('#hub-modal').classList.contains('hidden');
  function openCalendar(page) {
    const inf = hubInfo(cur.ch), current = Math.floor((inf.day - 1) / 30);
    page = page == null ? current : Math.max(0, page);
    const first = page * 30 + 1, offset = page * 30 % 7, fightDays = new Set(inf.fightDays);
    let html = '<div class="calendar-heading"><button class="btn small" id="calendar-prev" ' + (page === 0 ? 'disabled' : '') + '>←</button><h2>Calendrier · Mois ' + (page + 1) + '</h2><button class="btn small" id="calendar-next">→</button></div><p>Jour <b>' + inf.day + '</b> · ' + (inf.pending ? '🏆 Champion des Titans · repos au gym' : inf.matchDay ? '🥊 Ton combat est aujourd’hui !' : 'Prochain combat : <b>jour ' + inf.fightDay + '</b> contre ' + inf.next.nick) + '</p><div class="calendar-grid">';
    html += ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map(d => '<b class="weekday">' + d + '</b>').join('');
    for (let i = 0; i < offset; i++) html += '<div></div>';
    for (let d = 0; d < 30; d++) {
      const day = first + d, fight = fightDays.has(day), past = day < inf.day, today = day === inf.day;
      html += '<div class="calendar-day' + (fight ? ' match' : '') + (past ? ' past' : '') + (today ? ' today' : '') + '" title="Jour ' + day + '"><b>' + (d + 1) + '</b>' + (fight ? '<span>🥊 Combat</span>' : '') + (today ? '<small>Aujourd’hui</small>' : '') + (past ? '<em>×</em>' : '') + '</div>';
    }
    html += '</div><p class="small">× Jour terminé · 🥊 Jour de combat · Cadre doré : aujourd’hui</p>';
    const m = modal(html, [['🥊 Voir le prochain combat', () => { closeModal(); show('circuit'); }, 'primary'], ['Fermer', closeModal]]);
    m.querySelector('#calendar-prev').onclick = () => openCalendar(page - 1);
    m.querySelector('#calendar-next').onclick = () => openCalendar(page + 1);
  }
  let roulette=null;
  function openTrain(){
    const ch=cur.ch,c=career(ch);
    const exercises=BX.gym.catalog();
    if (debugMode()) {
      roulette = null;
      const m = modal('<h2>🛠 Choisis ton entraînement</h2><p class="roulette-caption">Fais défiler les cartes et clique sur ton exercice.</p><div class="coach-roulette exercise-roulette debug-workout-picker"><div class="roulette-strip debug-workouts"></div></div><p class="small">Mode debug · séances illimitées · 60 s · mitaines : 90 s · bench : 120 s max · XP générale</p>', [
        ['← Précédent', () => scrollWorkouts(-1)], ['Retour', closeModal], ['Suivant →', () => scrollWorkouts(1)]
      ]);
      const viewport = m.querySelector('.debug-workout-picker');
      const scrollWorkouts = direction => viewport.scrollBy({ left: direction * 224, behavior: 'smooth' });
      const list = m.querySelector('.debug-workouts');
      for (const ex of exercises) {
        const b = document.createElement('button'); b.className = 'roulette-card';
        b.innerHTML = '<span>' + ex.icon + '</span><b>' + ex.name + '</b>';
        b.onfocus = () => b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        b.onclick = () => { closeModal(); openDifficulty(ex.stat, ex.mode); }; list.appendChild(b);
      }
      return;
    }
    if(c.moments<=0){endDay();return;}
    if(c.pendingWorkout?.mode==='parade'){c.pendingWorkout={stat:'defense',mode:'sparring',lvl:gymUnlocked(ch,'defense','sparring')};persist();}
    if(c.pendingWorkout?.mode==='combos'){c.pendingWorkout.mode='libre';c.pendingWorkout.lvl=gymUnlocked(ch,'force','libre');persist();}
    if(c.pendingWorkout&&!exercises.some(e=>e.stat===c.pendingWorkout.stat&&(e.mode||null)===(c.pendingWorkout.mode||null))){c.pendingWorkout=null;persist();}
    if(!c.pendingWorkout){const exercise=exercises[Math.floor(Math.random()*exercises.length)];c.pendingWorkout={stat:exercise.stat,mode:exercise.mode,lvl:gymUnlocked(ch,exercise.stat,exercise.mode)};persist();}
    const chosen=c.pendingWorkout,coach=BX.charById(c.coach),target=exercises.findIndex(e=>e.stat===chosen.stat&&(e.mode||null)===(chosen.mode||null));
    const m=modal('<h2>Le tirage de '+coach.name+'</h2><p class="roulette-caption">Quel exercice pour aujourd’hui ?</p><div class="coach-roulette exercise-roulette"><div class="roulette-strip">'+exercises.map(e=>'<div class="roulette-card"><span>'+e.icon+'</span><b>'+e.name+'</b></div>').join('')+'</div></div><p class="small">Une séance · 60 s · mitaines : 90 s · bench : 120 s max · XP générale</p>',[['Passer l’animation',()=>{if(roulette)roulette.started=performance.now()-2900;}],['Retour',closeModal]]);
    roulette={started:performance.now(),cards:[...m.querySelectorAll('.roulette-card')],caption:m.querySelector('.roulette-caption'),chosen,target:Math.max(0,target),last:-1,strip:m.querySelector('.roulette-strip')};
  }
  function updateRoulette(now){
    if(!roulette)return;if(!modalOpen()||screen!=='hub'){roulette=null;return;}
    const r=roulette,t=Math.max(0,Math.min(1,(now-r.started)/2800)),count=r.cards.length,steps=count*2+r.target,index=t===1?r.target:Math.floor(A.eout(t)*steps)%count;
    r.cards.forEach((card,i)=>card.classList.toggle('on',i===index));
    const card=r.cards[index],viewport=r.strip.parentElement;
    r.strip.style.transform='translateX('+(viewport.clientWidth/2-card.offsetLeft-card.offsetWidth/2)+'px)';
    if(index!==r.last&&t<1){AU.play('tick');r.last=index;}
    if(t===1){const exercise=BX.gym.exercise(r.chosen.stat,r.chosen.mode);r.caption.textContent='Au programme : '+exercise.name+' · '+BX.gym.difficulty(r.chosen.lvl).name;r.cards[r.target].classList.add('winner');}
    if(now-r.started>=3450){const chosen=r.chosen;roulette=null;closeModal();openDifficulty(chosen.stat,chosen.mode);}
  }
  function chooseVegetable(onChoose){
    BX.gym.stop();enterHub();
    const m=modal('<p class="difficulty-eyebrow">🍣 Sushi express</p><h2>Quel légume n’aimes-tu pas ?</h2><p>Choisis celui que tu vas cogner. Laisse passer tous les autres !</p><div class="vegetable-grid">'+BX.gym.extra.vegetables.map(v=>'<button class="vegetable-choice" data-vegetable="'+v.id+'"><span>'+v.icon+'</span><b>'+v.name+'</b></button>').join('')+'</div>',[['Retour',closeModal]]);
    m.querySelectorAll('[data-vegetable]').forEach(button=>button.onclick=()=>{closeModal();onChoose(button.dataset.vegetable);});
  }
  function openDifficulty(stat, mode, vegetable) {
    if(mode==='mannequin'&&!vegetable){chooseVegetable(id=>openDifficulty(stat,mode,id));return;}
    if(mode==='parade'){stat='defense';mode='sparring';}
    if(mode==='repas'){openRestaurant();return;}
    const ch=cur.ch,pr=prog(ch.id),unlocked=gymUnlocked(ch,stat,mode),key=BX.gym.levelKey(stat,mode),ex=BX.gym.exercise(stat,mode);
    const saved=pr.gymSelected?.[key];let selected=Math.max(1,Math.min(saved||unlocked,unlocked));
    const m=modal('<p class="difficulty-eyebrow">'+ex.icon+' '+ex.name+'</p><h2>Choisis ta difficulté</h2><div class="difficulty-slider" role="group" aria-label="Difficulté de l’entraînement">'+BX.gym.DIFFICULTIES.map((difficulty,i)=>{
      const lvl=i+1,goal=BX.gym.challenge(stat,mode,lvl),locked=lvl>unlocked;
      return '<button class="difficulty-card" data-level="'+lvl+'" aria-pressed="false" '+(locked?'disabled':'')+' style="--difficulty-hue:'+(150-i*65)+'"><strong>'+difficulty.name+'</strong><p>'+difficulty.desc+'</p><span class="difficulty-goal">'+goal.target+' '+goal.label+(goal.avoid?' · '+goal.avoid+' objets évités':'')+'</span><em>'+(locked?'🔒 Réussis '+BX.gym.DIFFICULTIES[i-1].name:'XP ×'+BX.gym.xpMultiplier(lvl,unlocked).toFixed(1))+'</em></button>';
    }).join('')+'</div><p class="difficulty-summary" aria-live="polite"></p>',[
      ['Retour',closeModal],['Commencer',()=>{pr.gymSelected=pr.gymSelected||{};pr.gymSelected[key]=selected;persist();closeModal();openGym(stat,selected,mode,vegetable);}]
    ]);
    function select(lvl){selected=lvl;m.querySelectorAll('[data-level]').forEach(card=>{const on=+card.dataset.level===lvl;card.classList.toggle('selected',on);card.setAttribute('aria-pressed',String(on));});m.querySelector('.difficulty-summary').textContent=unlocked===3?'Toutes les difficultés sont débloquées.':lvl===unlocked?'Réussis en '+BX.gym.difficulty(lvl).name+' pour débloquer '+BX.gym.difficulty(lvl+1).name+'.':'Rejoue librement : le gain d’XP reste le même.';}
    m.querySelectorAll('[data-level]:not(:disabled)').forEach(card=>{card.onclick=()=>select(+card.dataset.level);card.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.code)){e.preventDefault();select(e.code==='Home'?1:e.code==='End'?unlocked:Math.max(1,Math.min(unlocked,selected+(e.code==='ArrowRight'?1:-1))));m.querySelector('[data-level="'+selected+'"]').focus();}};});
    select(selected);
  }
  const STAT_BASE_COST={force:2,vitesse:2,stamina:2,souffle:1,defense:2};
  function openStats(){
    const ch=cur.ch,pr=prog(ch.id),st=statsOf(ch),cap=BX.statCap(pr),pending=Object.fromEntries(BX.STATS.map(s=>[s.id,[]]));
    const labels={force:['<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 21h28v6H10z" fill="#9daeb8" stroke="#0b141b" stroke-width="2"/><g fill="#657681" stroke="#17232b" stroke-width="2"><rect x="4" y="13" width="7" height="22" rx="2"/><rect x="10" y="8" width="7" height="32" rx="2"/><rect x="31" y="8" width="7" height="32" rx="2"/><rect x="38" y="13" width="7" height="22" rx="2"/></g><path d="M12 11v26M33 11v26M6 16v16M40 16v16" stroke="#c3cbd0" stroke-width="2"/></svg>','Force','Dégâts des coups'],vitesse:['⚡','Rapidité','Coups plus vifs · esquives plus courtes'],stamina:['❤️','Stamina','Encaisse mieux · se relève plus vite'],defense:['🛡️','Garde','Réduction des dégâts reçus'],souffle:['🌬️','Souffle','Stamina récupérée après une esquive']};
    const order=['force','vitesse','stamina','defense','souffle'];
    const m=modal('<header class="stats-plaque"><h2>'+ch.name+' · Améliorations de niveau</h2><span class="stats-level" title="Niveau du personnage">'+pr.level+'</span></header><div class="stats-frame"><i class="frame-corner tl"></i><i class="frame-corner tr"></i><i class="frame-corner bl"></i><i class="frame-corner br"></i><div class="stats-board"><aside class="stats-character"><canvas width="500" height="660" aria-label="'+ch.name+' en tenue de boxe"></canvas><div class="stats-coach"><b>Le coach</b><span>« Chaque point compte, champion ! »</span></div></aside><section class="stats-allocation"><div class="stats-wallet" aria-live="polite"><span>Points à attribuer</span><strong></strong></div><div class="stats-xp"><b>XP</b><div role="progressbar" aria-label="Expérience du niveau" aria-valuemin="0" aria-valuemax="'+BX.gym.need(pr.level)+'" aria-valuenow="'+pr.exp+'"><i style="width:'+Math.min(100,pr.exp/BX.gym.need(pr.level)*100)+'%"></i><span>'+pr.exp+' / '+BX.gym.need(pr.level)+' XP</span></div></div><div class="stats-rows">'+order.map(id=>{const [icon,name,desc]=labels[id];return '<div class="stats-row" data-stat="'+id+'"><span class="stats-icon" aria-hidden="true">'+icon+'</span><div class="stats-meter"><div class="stats-label"><b>'+name+'</b><strong class="stats-value"></strong></div><small>'+desc+'</small><div class="stats-segments" role="meter" aria-label="'+name+'" aria-valuemin="0" aria-valuemax="'+cap+'">'+Array.from({length:10},(_,i)=>'<i style="--pip-color:hsl('+Math.round(i/9*130)+' 80% 63%)"></i>').join('')+'</div></div><div class="stats-actions"><button class="stats-plus" data-upgrade="'+id+'" aria-label="Augmenter '+name+'">+</button><small class="stats-cost"></small><button class="stats-undo" data-undo="'+id+'" aria-label="Annuler le dernier point de '+name+'">−</button></div></div>';}).join('')+'</div></section></div><footer class="stats-footer"><p>Un niveau gagné = 3 points · Plafond : '+cap+(cap===10?' · La ligue des Titans débloque 20.':' · Bleu : points 11 à 20')+'</p><div class="stats-confirmation" aria-live="polite">Prépare tes améliorations, puis valide.</div><div class="stats-footer-buttons"><button class="btn primary" id="stats-confirm">Valider les améliorations</button><button class="btn" id="stats-back">Retour</button></div></footer></div>',[]);
    m.querySelector('.hub-box').classList.add('stats-window');
    const spent=()=>Object.values(pending).flat().reduce((a,b)=>a+b,0);
    function refresh(){
      const remaining=pr.statPoints-spent();
      m.querySelector('.stats-wallet strong').innerHTML=remaining<=5?'<span class="wallet-stars">'+'★'.repeat(remaining)+'</span><span>'+remaining+' point'+(remaining===1?'':'s')+'</span>':'<span class="wallet-stars">★</span> '+remaining+' points';
      for(const id of order){const row=m.querySelector('[data-stat="'+id+'"]'),value=st[id]+pending[id].length,cost=STAT_BASE_COST[id]+Math.floor((value-1)/3),max=value>=cap;
        row.querySelector('.stats-value').innerHTML=value+' / '+cap+(pending[id].length?'<em>+'+pending[id].length+'</em>':'');
        const meter=row.querySelector('.stats-segments');meter.setAttribute('aria-valuenow',value);meter.setAttribute('aria-valuetext',value+' sur '+cap);
        [...meter.children].forEach((pip,i)=>{const baseLayer=st[id]>i?1:0,oldLayer=st[id]>i+10?2:baseLayer,newLayer=value>i+10?2:value>i?1:0;pip.className=(newLayer===2?'filled doubled':newLayer===1?'filled':'')+(newLayer>oldLayer?' planned':'');pip.title='Case '+(i+1)+(newLayer===2?' · deuxième couche : '+(i+11):'');});
        const plus=row.querySelector('[data-upgrade]');plus.disabled=max||remaining<cost;plus.title=max?'Maximum atteint':'+1 en '+labels[id][1]+' : '+cost+' points';
        row.querySelector('.stats-cost').textContent=max?'MAX':cost+' pts';row.querySelector('[data-undo]').disabled=!pending[id].length;
      }
      const total=spent();m.querySelector('#stats-confirm').disabled=!total;
      m.querySelector('.stats-confirmation').textContent=total?total+' point'+(total>1?'s':'')+' à utiliser · Les segments lumineux sont en attente.':'Prépare tes améliorations, puis valide.';
    }
    m.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>{const id=b.dataset.upgrade,value=st[id]+pending[id].length,cost=STAT_BASE_COST[id]+Math.floor((value-1)/3);if(value>=cap||pr.statPoints-spent()<cost)return;pending[id].push(cost);AU.play('select');refresh();});
    m.querySelectorAll('[data-undo]').forEach(b=>b.onclick=()=>{pending[b.dataset.undo].pop();AU.play('select');refresh();});
    m.querySelector('#stats-back').onclick=closeModal;
    m.querySelector('#stats-confirm').onclick=()=>{
      const total=spent();if(!total)return;
      if(total>pr.statPoints||BX.statCap(pr)!==cap||order.some(id=>statsOf(ch)[id]!==st[id])){openStats();return;}
      for(const id of order)pr.bonus[id]+=pending[id].length;
      pr.statPoints-=total;persist();AU.play('star');closeModal();HB.banner('AMÉLIORATIONS VALIDÉES !',total+' points investis. À toi de jouer !');
    };
    const canvas=m.querySelector('.stats-character canvas'),g=canvas.getContext('2d');
    const draw=()=>{g.clearRect(0,0,500,660);A.playerFront(g,look(ch),250,650,1.2/A.childScale(ch),0,{celebrate:true});};draw();
    if(root.FamilyHeads)root.FamilyHeads.ready.then(()=>{if(canvas.isConnected)draw();});
    refresh();
  }
  // Les anciennes sauvegardes gardent leurs difficultés accessibles lors de la migration.
  function gymUnlocked(ch, stat, mode) {
    if(debugMode())return 3;
    const pr = prog(ch.id), key = BX.gym.levelKey(stat, mode);
    if (!pr.gymLevels) pr.gymLevels = {};
    if (pr.gymLevels[key] == null) pr.gymLevels[key] = 1;
    return Math.max(1, Math.min(3, pr.gymLevels[key]));
  }
  // ---------- Coin du coach : une vraie jasette, puis une leçon interactive aux mitaines ----------
  const COMBO_FX = { undeux: { e: '🔥', tag: 'Cross de feu', pow: 2 }, corpstete: { e: '❄️', tag: 'Frappe de glace', pow: 3 }, jju: { e: '⚡', tag: 'Uppercut électrique', pow: 4 }, rafale: { e: '🌪️', tag: 'La tempête', pow: 5 } };
  function coachTalk(lines, options, extra) {
    const ch = cur.ch, c = career(ch), coach = BX.charById(c.coach);
    const m = modal('<div class="talk"><div class="talk-coach"></div><div class="talk-main"><p class="talk-name">📋 Coach ' + coach.name + '</p><div class="bubble"><span class="txt"></span></div>' + (extra || '') + '<div class="replies"></div></div></div>', []);
    const hc = headCanvas(coach.id, 220); m.querySelector('.talk-coach').appendChild(hc);
    m.querySelector('.hub-box').classList.add('talk-box');
    const txt = m.querySelector('.bubble .txt'), rep = m.querySelector('.replies'), full = Array.isArray(lines) ? pick(lines) : lines;
    let i = 0; const tick = () => { if (!m.contains(txt)) return; i += 2; txt.textContent = full.slice(0, i); if (i < full.length) setTimeout(tick, 22); else rep.classList.add('show'); };
    tick(); setTimeout(() => rep.classList.add('show'), Math.min(1800, full.length * 11 + 200));
    m.querySelector('.bubble').onclick = () => { i = full.length; txt.textContent = full; rep.classList.add('show'); };
    for (const [label, fn, cls] of options) { const b = document.createElement('button'); b.className = 'reply ' + (cls || ''); b.innerHTML = label; b.onclick = () => { AU.play('select'); fn(); }; rep.appendChild(b); }
    return m;
  }
  const pick = a => a[Math.random() * a.length | 0];
  function openCoach() {
    const ch = cur.ch, c = career(ch), nb = nextBoxer(ch), dl = daysLeft(c);
    c.talks = (c.talks || 0) + 1; persist();
    const hello = c.talks === 1 ? ['Salut ' + ch.name + ' ! C’est moi qui vais faire de toi un champion. T’es prêt·e à travailler fort ?']
      : dl <= 0 ? ['C’est AUJOURD’HUI, ' + ch.name + ' ! Respire par le nez. On a travaillé pour ça.', 'Jour de combat ! T’as des papillons ? C’est normal. Les champions aussi.']
      : c.retry ? ['Hey, une défaite, c’est juste une leçon déguisée. On se relève !', 'Pas grave pour tantôt. Moi aussi j’ai mangé des claques. On retravaille ça ?']
      : ['Yo ' + ch.name + ' ! Qu’est-ce qu’on fait aujourd’hui ?', 'Ah, mon boxeur préféré ! Qu’est-ce que je peux faire pour toi ?', 'T’as l’air en forme ! On travaille quoi ?', 'Salut champion·ne ! Il reste ' + dl + ' jour' + (dl > 1 ? 's' : '') + ' avant ton combat. On en profite ?'];
    coachTalk(hello, [
      ['🥊 <b>Apprends-moi un combo !</b>', openCombos, 'big'],
      ['🔍 Parle-moi de <b>' + nb.b.nick + '</b>', () => coachTalk([pick(nb.b.tips || ['Je le connais mal… Ouvre l’œil !']) + ' En tout cas, c’est ce que j’ai entendu dire…'], [['👍 Merci coach !', openCoach], ['👋 Salut !', closeModal]])],
      ['💡 Un conseil pour m’entraîner ?', () => {
        const st = statsOf(ch), low = BX.STATS.slice().sort((a, b) => st[a.id] - st[b.id])[0], sp = BX.STATS.find(x => x.id === BX.COACH_SPEC[c.coach]);
        coachTalk(['Ton ' + low.name.toLowerCase() + ' est ton point faible (' + st[low.id] + '). ' + (low.id === 'defense' ? 'Essaie les mitaines défensives, puis dépense tes points en Défense (V)' : 'Va voir ' + BX.gym.EX[low.id].name.toLowerCase()) + ' ! Et moi, ma spécialité c’est ' + sp.name.toLowerCase() + ' ' + sp.icon + ' : tu gagnes plus d’XP là avec moi.'], [['💪 Compris !', openCoach], ['👋 Salut !', closeModal]]);
      }],
      ['👋 Merci coach, à plus !', closeModal, 'ghost'],
    ]);
  }
  function openCombos() {
    const ch = cur.ch, c = career(ch); c.paid = c.paid || [];
    const cards = '<div class="combo-cards">' + BX.COMBOS.map(cb => {
      const fx = COMBO_FX[cb.id] || { e: '🥊', tag: '', pow: 3 }, own = c.combos.includes(cb.id), paid = c.paid.includes(cb.id), can = c.gold >= cb.cost;
      return '<button class="combo-card' + (own ? ' own' : '') + (!own && !paid && !can ? ' poor' : '') + '" data-id="' + cb.id + '"><span class="e">' + fx.e + '</span><small class="tag">' + fx.tag + '</small><b>' + cb.name + '</b>' +
        '<span class="keys">' + (cb.charge?['Maintiens Z / X → relâche']:cb.seq).map(t => '<kbd>' + (cb.charge?t:BX.gym.keyLabel(t)).replace(' (corps)', '') + '</kbd>').join('<i>›</i>') + '</span>' +
        '<span class="pow">' + '⚡'.repeat(fx.pow) + '<em>' + '⚡'.repeat(5 - fx.pow) + '</em></span>' +
        '<span class="price">' + (own ? '✔ Appris' : paid ? '▶ Finir la leçon' : cb.cost + ' ' + COIN) + '</span></button>';
    }).join('') + '</div><p class="gold-line">' + COIN + ' <b>' + c.gold + '</b> or</p>';
    const m = coachTalk(['Qu’est-ce que t’aimerais apprendre ? Choisis, pis je te montre !', 'Z’ai des combos secrets… Lequel te tente ?'], [['← Retour', openCoach, 'ghost']], cards);
    m.querySelectorAll('.combo-card').forEach(b => b.onclick = () => {
      const cb = BX.COMBOS.find(x => x.id === b.dataset.id), own = c.combos.includes(cb.id), paid = c.paid.includes(cb.id);
      AU.play('select');
      if (own) return coachTalk(['Le ' + cb.name + ', tu le connais déjà ! ' + cb.desc + ' Tu veux le repratiquer ?'], [['💪 Oui, encore !', () => startLesson(cb, true)], ['← Autre chose', openCombos]]);
      if (paid) return startLesson(cb);
      if (c.gold < cb.cost) return coachTalk(['Hmm, le ' + cb.name + ' coûte ' + cb.cost + ' or et t’en as ' + c.gold + '. Gagne des combats pis reviens me voir !'], [['← OK', openCombos]]);
      coachTalk(['Le ' + cb.name + ' ! ' + cb.desc + ' Ça va te coûter ' + cb.cost + ' or pour la salle. On s’y met ?'], [
        ['💪 <b>Let’s go, coach !</b>', () => { c.gold -= cb.cost; c.paid.push(cb.id); persist(); AU.play('win'); startLesson(cb); }, 'big'],
        ['🤔 Peut-être plus tard', openCombos, 'ghost']]);
    });
  }
  app.openCoach = () => { cur.ch = BX.charById(save.sel); openCoach(); };
  app.lesson = id => { cur.ch = BX.charById(save.sel); startLesson(BX.COMBOS.find(c => c.id === id)); };
  function startLesson(cb, again) {
    const ch = cur.ch, c = career(ch); closeModal(); AU.unlock();
    $('#gym-res').classList.add('hidden'); $('#bpm-ctl').classList.add('hidden'); show('gym'); cur.lesson = true;
    $('#btn-gym-quit').textContent = '⏸ Finir plus tard (Échap)';
    BX.gym.startLesson(cb, look(ch), BX.charById(c.coach), ok => {
      cur.lesson = false; BX.gym.stop();
      if (ok && !again) { c.paid = (c.paid || []).filter(id => id !== cb.id); if (!c.combos.includes(cb.id)) c.combos.push(cb.id); persist(); enterHub(['NOUVEAU COMBO !', cb.name + ' : ' + (cb.charge?cb.keys:cb.seq.map(BX.gym.keyLabel).join(' › ')), '#ff80ab']); }
      else if (ok) enterHub(['BIEN PRATIQUÉ !', cb.name, '#ff80ab']);
      else enterHub(['LEÇON EN PAUSE', 'C’est déjà payé : reviens voir ton coach pour finir le ' + cb.name + '.']);
    });
  }
  function openShop() {
    const ch = cur.ch, c = career(ch), boughtToday = c.shopPurchaseDay === c.day;
    const m = modal('<h2>🛒 Boutique à Gilles</h2><p>« Du bon stock pour les champions, mon ami ! »</p><p class="gold-line">' + COIN + ' <b>' + c.gold + '</b> or</p><p>'+(boughtToday?'Achat du jour effectué. Reviens demain !':'Un seul objet par jour, à toi de choisir !')+'</p><div class="shop-list"></div>');
    const list = m.querySelector('.shop-list');
    for (const it of BX.ITEMS) {
      if (it.needs && !c.items[it.needs] && !c.items[it.id]) continue;
      const have = c.items[it.id] || 0, cost = BX.itemPrice(it, have), full = it.id === 'bandage' && have >= 3, row = document.createElement('div'); row.className = 'shop-row' + (have && !it.use ? ' owned' : '');
      row.innerHTML = '<span class="ic">' + it.icon + '</span><span class="nm"><b>' + it.name + '</b>' + (it.use && have ? ' <em>(×' + have + ')</em>' : '') + '<small>' + it.desc + '</small></span>';
      const b = document.createElement('button'); b.className = 'btn small ' + (have && !it.use ? '' : 'primary');
      b.innerHTML = full ? '★ 3 / 3' : have && !it.use ? '✔ À toi' : cost + ' ' + COIN; b.disabled = boughtToday || full || (have && !it.use) || c.gold < cost;
      b.onclick = () => { if (!BX.buyShopItem(c,it.id)) return; persist(); AU.play('select'); HB.enter(look(ch), () => hubInfo(ch), onSpot); openShop(); };
      row.appendChild(b); list.appendChild(row);
    }
  }

  function openRestaurant(){
    const ch=cur.ch,c=career(ch);closeModal();BX.gym.stop();AU.unlock();
    BX.restaurant.start({ch:look(ch),coach:BX.charById(c.coach),career:c,
      onPurchase(){if(!debugMode())c.moments=Math.max(0,c.moments-1);c.pendingWorkout=null;persist();},
      onLeave(bought){c.pendingWorkout=null;persist();enterHub();if(bought&&!debugMode()&&c.moments<=0)endDay();}
    });show('restaurant');
  }

  // ---------- Séance d’entraînement ----------
  function openGym(stat, lvl, mode, vegetable) {
    if(mode==='mannequin'&&!BX.gym.extra.vegetables.some(v=>v.id===vegetable)){chooseVegetable(id=>openGym(stat,lvl,mode,id));return;}
    if(mode==='parade'){stat='defense';mode='sparring';}
    if(mode==='repas'){openRestaurant();return;}
    if(stat==='force'&&mode==='combos')mode='libre';
    AU.unlock(); AU.play('select');
    $('#btn-gym-quit').textContent = '✔ Terminer et recevoir l’XP (Échap)';
    const ch = cur.ch, c = career(ch), unlocked = gymUnlocked(ch, stat, mode);
    lvl = Math.max(1, Math.min(lvl || unlocked, unlocked));
    $('#gym-res').classList.add('hidden');
    BX.gym.start(stat, look(ch), res => {
      const pr = prog(ch.id);
      const exerciseKey=BX.gym.levelKey(stat,mode);
      const best = pr.best[exerciseKey] || 0, rec = res.score > best; if (rec) pr.best[exerciseKey] = res.score;
      const reward = grantReward(ch, stat, res.xp), ups = reward.toLevel - reward.fromLevel;
      const key = BX.gym.levelKey(stat, mode), newLevel = res.passed && lvl === unlocked && lvl < 3 ? lvl + 1 : null;
      if (newLevel) pr.gymLevels[key] = Math.max(pr.gymLevels[key], newLevel);
      if (!debugMode()) { c.moments = Math.max(0, c.moments - 1); c.pendingWorkout = null; }
      persist();
      const ex = BX.gym.exercise(stat,mode);
      const more = debugMode() || c.moments > 0;
      const box = $('#gym-res'), rating = BX.gym.rating(res.xp);
      box.innerHTML = '<div class="res-box training-grade" data-tier="'+rating.tier+'" style="--grade:'+rating.color+'"><p class="result-eyebrow">SÉANCE TERMINÉE · '+BX.gym.difficulty(lvl).name+'</p><h1>'+rating.title+'</h1><p class="result-subtitle">'+ex.icon+' '+ex.name+'</p><div class="session-metrics"><span>Score <b>'+res.score+'</b></span><span>Meilleure série <b>×'+res.best+'</b></span><span>'+(rec?'★ Nouveau record !':'Record : '+best)+'</span></div>'+
        (Number.isFinite(res.distance)?'<p class="result-subtitle">Distance parcourue : <b>'+res.distance.toFixed(1)+' m</b></p>':'')+
        (res.sparring?'<p class="result-subtitle">'+res.sparring.defended+' coups défendus · '+res.sparring.counters+' ripostes · '+res.sparring.errors+' erreurs</p>':'')+
        (res.free?'<p class="result-subtitle">'+res.free.hits+' coups · '+res.free.styles+'/5 styles · '+res.free.swings+' retours · '+res.free.dodges+' esquives · '+res.free.collisions+' collisions</p><p class="small">Coups : '+res.free.hitPoints+' pts · Variété : '+res.free.stylePoints+' pts · Balancement : '+res.free.swingPoints+' pts · Esquives : '+res.free.dodgePoints+' pts</p>':'')+
        BX.progress.markup([reward])+
        '<p class="challenge-status '+(res.passed?'passed':'')+'">'+(res.passed?'✓ DÉFI RÉUSSI':'À RÉESSAYER')+' · '+res.successes+' / '+res.challenge.target+' '+res.challenge.label+(res.challenge.avoid?' · '+res.obstaclesDodged+' / '+res.challenge.avoid+' objets évités':'')+'</p>'+
        (newLevel?'<p class="unlock-notice">🔓 Difficulté '+BX.gym.difficulty(newLevel).name+' débloquée</p>':'')+
        '<p class="small">'+(debugMode()?'Mode debug · entraînements illimités.':more?'Encore '+c.moments+' moment disponible aujourd’hui.':'La journée est terminée.')+'</p><div class="res-btns">'+(more?'<button class="btn primary" id="btn-gym-again">' + (debugMode() ? 'Choisir un entraînement' : 'Entraînement suivant 🎲') + '</button>':'')+'<button class="btn" id="btn-gym-back">Retour au gym</button></div></div>';
      box.classList.remove('hidden');$('#bpm-ctl').classList.add('hidden');BX.progress.reveal(box);BX.progress.mount(box,[reward]);
      AU.scene(rating.tier>=3?'win':'gym');AU.play(ups?'win':'chime');
      if(more)$('#btn-gym-again').onclick=()=>{BX.gym.stop();enterHub();openTrain();};
      $('#btn-gym-back').onclick = () => { BX.gym.stop(); enterHub(); if (!debugMode() && c.moments <= 0) endDay(); };
    }, lvl, { mode, vegetable, stats: statsOf(ch), mods: gearMods(c), combos: c.combos, strength: statsOf(ch).force, max: unlocked, bonus: BX.COACH_SPEC[c.coach] === stat ? 1.25 : 1, coach: BX.charById(c.coach) });
    show('gym');
    $('#bpm-ctl').classList.add('hidden');
  }
  app.openGym = (s, lvl, mode, vegetable) => { cur.ch = BX.charById(save.sel); const pr = prog(cur.ch.id); if (!pr.c) pr.c = newCareer(cur.ch); openGym(s, lvl, mode, vegetable); };
  function gymQuit() {
    if (BX.gym.isLesson()) { const S = BX.gym.state(); if (S.phase === 'go') S.onDone(false); return; }
    if (!BX.gym.finish()) { BX.gym.stop(); enterHub(); }
  }
  $('#btn-gym-quit').onclick = gymQuit;

  // ---------- Tableau des combats (circuit) ----------
  // Tableau des combats : grande scène « toi VS lui » (shadow boxing, dessinée dans drawMenu),
  // onglets des circuits, fiche de l’adversaire et échelle du circuit.
  const cb = { view: null, circ: null };
  function cbOpen(pr, list, b) { const i = list.indexOf(b); return i >= 0 && (i <= pr.c.pos || pr.beaten.includes(b.id)); }
  function renderCircuit(keep) {
    const ch = BX.charById(save.sel), pr = prog(ch.id); if (!pr.c) pr.c = newCareer(ch);
    const c = pr.c, list = ladderList(pr), nb = nextBoxer(ch), dl = daysLeft(c);
    if (!keep || !cb.view) { cb.view = nb.b; cb.circ = nb.b.circuit; }
    const v = cb.view, vi = list.indexOf(v), isNext = v === nb.b, beaten = pr.beaten.includes(v.id) || vi < c.pos;
    $('#circuit-who').innerHTML = ''; $('#circuit-who').appendChild(headCanvas(ch.id, 64));
    $('#circuit-who').insertAdjacentHTML('beforeend', '<span><b>' + ch.name + '</b> · Ligue ' + BX.leagueOf(nb.b) + ' · Jour ' + c.day + '</span>');
    // Badge de la scène
    const when = dl <= 0 ? '<b class="today">AUJOURD’HUI !</b>' : 'dans <b>' + dl + ' jour' + (dl > 1 ? 's' : '') + '</b>';
    $('#cb-badge').innerHTML = nb.pending ? '🏆 CHAMPIONNAT DES TITANS TERMINÉ' : isNext ? (nb.title ? '👑 DÉFENSE DU TITRE · ' : '🥊 PROCHAIN COMBAT · ') + when : beaten ? '✔ DÉJÀ BATTU' : '';
    const st = statsOf(ch);
    $('#cb-mine').innerHTML = '<b>' + ch.name + '</b><span class="nick">« ' + ch.nick + ' »</span><div class="pills">' + BX.STATS.map(s => '<span title="' + s.name + '">' + s.icon + ' ' + st[s.id] + '</span>').join('') + '</div>';
    // Onglets des circuits
    const tabs = $('#cb-tabs'); tabs.innerHTML = '';
    const activeLeague = BX.CIRCUITS.find(x => x.id === cb.circ).league || 1;
    tabs.dataset.league = activeLeague;
    if (pr.beaten.includes('caribou')) {
      const switcher = document.createElement('button'); switcher.className = 'cb-tab league-switch'; switcher.style.setProperty('--cc','#fff0b0');
      switcher.innerHTML = '<b>LIGUE ' + activeLeague + '</b><small>Changer ↔</small>';
      switcher.onclick = () => { const other = list.filter(b => BX.leagueOf(b) !== activeLeague && cbOpen(pr,list,b)); cb.view = other[other.length-1]; cb.circ=cb.view.circuit; renderCircuit(true); }; tabs.appendChild(switcher);
    }
    for (const circ of BX.CIRCUITS) {
      if ((circ.league || 1) !== activeLeague || (circ.secret && !list.some(b => b.circuit === circ.id))) continue;
      const items = list.filter(b => b.circuit === circ.id), any = items.some(b => cbOpen(pr, list, b));
      const done = items.filter(b => list.indexOf(b) < c.pos || pr.beaten.includes(b.id)).length;
      const t = document.createElement('button'); t.className = 'cb-tab' + (cb.circ === circ.id ? ' on' : '') + (any ? '' : ' locked'); t.style.setProperty('--cc', circ.color);
      t.innerHTML = '<b>' + (any || !circ.secret ? circ.name.replace('Circuit ', '') : '???') + (pr.belts.includes(circ.id) ? ' 🏆' : '') + '</b><small>' + (items.length ? '●'.repeat(done) + '○'.repeat(items.length - done) : '🔒') + '</small>';
      if (any) t.onclick = () => { cb.circ = circ.id; const first = items.find(b => b === nb.b) || items.filter(b => cbOpen(pr, list, b)).pop(); cb.view = first; AU.play('select'); renderCircuit(true); };
      tabs.appendChild(t);
    }
    // Fiche de l’adversaire
    const circ = BX.CIRCUITS.find(x => x.id === v.circuit), bio = BX.BIOS[v.id] || ['', ''];
    const specials = [...new Set(Object.values(v.moves).filter(m => m.name && m.name !== 'Direct' && m.name !== 'Crochet').map(m => m.name))].slice(0, 5);
    const statScale = Math.max(BX.statCap(pr), BX.leagueOf(v)===2?20:10);
    const my = { Force: st.force, 'Rapidité': st.vitesse, Endurance: st.stamina };
    $('#cb-card').style.setProperty('--cc', circ.color);
    $('#cb-card').innerHTML = '<div class="top"><div><p class="circ-name">' + circ.name + '</p><h1>' + v.nick + '</h1><h2>' + v.name + '</h2></div><div class="rec">' + v.record + '<small>' + v.weight + (v.age ? ' · ' + v.age + ' ans' : '') + '</small></div></div>' +
      '<p class="meta">📍 ' + v.city + ' · 💼 ' + v.job + '</p>' +
      '<p class="bio">' + bio[0] + '</p><p class="sign">⭐ Signe particulier : ' + bio[1] + '</p>' +
      '<div class="ostats">' + BX.oppStats(v).map(s => '<div class="os"><span>' + s.icon + ' ' + s.name + '</span><i><em style="width:' + s.v / statScale * 100 + '%"></em>' + (my[s.name] ? '<u style="left:' + my[s.name] / statScale * 100 + '%" title="Toi : ' + my[s.name] + '"></u>' : '') + '</i><b>' + s.v + '</b></div>').join('') + '</div>' +
      '<p class="signature-power">🥊 '+v.boxingStyle.name+(v.starFinish?' · ★ Uppercut étoilé obligatoire pour le mettre à terre':'')+(v.sprinter?' · Explosif au round 1, épuisé au round 3':'')+'</p>'+
      '<p class="signature-power">✦ Pouvoir : <b>'+v.power.name+'</b> · '+v.power.desc+'</p>'+
      '<div class="moves">' + specials.map(n => '<span>' + n + '</span>').join('') + '</div>' +
      '<blockquote>« ' + v.quote + ' »</blockquote>';
    // Échelle du circuit affiché
    const lad = $('#cb-ladder'); lad.innerHTML = '';
    const items = list.filter(b => b.circuit === cb.circ);
    items.forEach((b, k) => {
      const i = list.indexOf(b), open = cbOpen(pr, list, b), done = i < c.pos || pr.beaten.includes(b.id), nxt = b === nb.b && !nb.title;
      if (k) lad.insertAdjacentHTML('beforeend', '<span class="link' + (done ? ' done' : '') + '"></span>');
      const el = document.createElement('button'); el.className = 'rung' + (done ? ' done' : '') + (open ? '' : ' locked') + (nxt ? ' next' : '') + (b === v ? ' on' : '');
      const pc = document.createElement('canvas'); pc.width = pc.height = 120; const g = pc.getContext('2d');
      if (open) g.drawImage(A.portrait(b, 240, ch.id), 0, 0, 120, 120); else { g.fillStyle = '#ddd'; g.font = '64px Bungee, Impact'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 60, 66); }
      el.appendChild(pc);
      el.insertAdjacentHTML('beforeend', '<b>' + (open ? b.nick : '? ? ?') + '</b>' + (done ? '<span class="tick">✔</span>' : '') + (nxt ? '<span class="when">' + (dl <= 0 ? 'AUJ.' : dl + ' j') + '</span>' : '') + (nxt ? '<span class="you">TOI ▸</span>' : ''));
      if (open) el.onclick = () => { cb.view = b; AU.play('select'); renderCircuit(true); };
      lad.appendChild(el);
    });
    const cc = BX.CIRCUITS.find(x => x.id === cb.circ);
    lad.insertAdjacentHTML('beforeend', '<span class="link"></span><div class="belt' + (pr.belts.includes(cb.circ) ? ' won' : '') + '" style="--cc:' + cc.color + '">🏆<small>' + cc.belt + '</small></div>');
    // Pied : Retour · statut · Combattre
    const foot = $('#circuit-foot'); foot.innerHTML = '';
    const back = document.createElement('button'); back.className = 'btn'; back.textContent = '← Retour'; back.onclick = () => enterHub(); foot.appendChild(back);
    foot.insertAdjacentHTML('beforeend', '<span class="msg">' + (dl <= 0 ? 'C’est le grand jour. La foule t’attend !' : 'Combat contre <b>' + nb.b.nick + '</b> ' + when + '. Entraîne-toi ou passe les jours restants pour combattre.') + '</span>');
    const go = document.createElement('button'); go.className = 'btn big primary'; go.id = 'btn-fight-now';
    if (nb.pending) { go.textContent = '🏆 Champion des Titans'; go.disabled = true; foot.querySelector('.msg').textContent = 'Le championnat est terminé. Profite de quelques jours pour t’entraîner.'; }
    else if (dl <= 0) { go.textContent = '🔔 COMBATTRE !'; go.onclick = () => openVs(nb.b); }
    else {
      go.textContent = '🥊 COMBATTRE MAINTENANT';
      go.title = 'Passer ' + dl + ' jour' + (dl > 1 ? 's' : '') + ' et accepter le combat contre ' + nb.b.nick;
      go.onclick = () => {
        c.day = c.fightDay; c.moments = BX.MOMENTS; persist();
        openVs(nb.b);
      };
    }
    foot.appendChild(go);
  }
  function cbBrowse(d) {
    const ch = BX.charById(save.sel), pr = prog(ch.id), list = ladderList(pr).filter(b => cbOpen(pr, list0(pr), b));
    if (!list.length) return; const i = list.indexOf(cb.view); cb.view = list[(i + d + list.length) % list.length]; cb.circ = cb.view.circuit; AU.play('select'); renderCircuit(true);
  }
  const list0 = pr => ladderList(pr);

  // ---------- VS ----------
  let vsT = 0;
  function openVs(b,practice=false) {
    AU.unlock(); AU.play('fanfare');
    cur.ch = BX.charById(save.sel); cur.boxer = b; cur.practice=practice;cur.rematch = false; vsT = 0;
    const c = BX.CIRCUITS.find(x => x.id === b.circuit);
    $('#vs-card').innerHTML = '<p class="circ-name" style="color:' + c.color + '">' + c.name + '</p><h2>' + b.name + '</h2><h1>« ' + b.nick + ' »</h1>' +
      '<dl><dt>Ville</dt><dd>' + b.city + '</dd><dt>Fiche</dt><dd>' + b.record + '</dd><dt>Poids</dt><dd>' + b.weight + '</dd><dt>Âge</dt><dd>' + (b.age ? b.age + ' ans' : '—') + '</dd><dt>Métier</dt><dd>' + b.job + '</dd></dl>' +
      '<blockquote>« ' + b.quote + ' »</blockquote>';
    const st = statsOf(cur.ch);
    $('#vs-me').innerHTML = '<h2>' + cur.ch.name + '</h2><p>« ' + cur.ch.nick + ' »</p><div class="mini">' + BX.STATS.map(s => '<span>' + s.icon + ' ' + st[s.id] + '</span>').join('') + '</div>';
    show('vs');
    const rec = /^(\d+) V – (\d+) D$/.exec(b.record);
    AU.say('Mesdames et messieurs ! Dans le coin bleu… venant de ' + b.city.replace(/,.*$/, '') + (rec ? ', avec une fiche de ' + rec[1] + ' victoires et ' + rec[2] + ' défaites' : '') + '… ' + b.name + '… ' + b.nick + ' ! Et dans le coin rouge… ' + cur.ch.name + ', ' + cur.ch.nick + ' !', { interrupt: true });
  }
  $('#btn-vs-go').onclick = () => startFight();
  $('#btn-vs-back').onclick = backFromVs;

  // ---------- Combat ----------
  function startFight() {
    AU.unlock(); AU.hush();
    const ch = cur.ch, b = cur.boxer, pr = prog(ch.id), c = pr.c;
    if(cur.practice)cur.mods=c?gearMods(c):{};
    if (c && !cur.practice) c.fightDays = [...new Set([...(c.fightDays || []), c.day])];
    if (c && !cur.rematch && !cur.practice) { // les objets à usage unique servent pour ce combat (et sa revanche)
      const m = gearMods(c);
      for (const it of BX.ITEMS) if (it.use && c.items[it.id] > 0) { const used = it.id === 'bandage' ? Math.min(3, c.items[it.id]) : 1; c.items[it.id] -= used; for (const k in it.mods) m[k] += it.mods[k] * used; }
      cur.mods = m; persist();
    }
    if(c&&!cur.rematch){cur.mealBaseMods=null;const bonus=BX.restaurant.consume(c);if(Object.keys(bonus).length){cur.mealBaseMods={...cur.mods};cur.mods=BX.restaurant.apply(cur.mods,bonus);}persist();}
    cur.coach = BX.charById(c ? c.coach : BX.COACHES.filter(id => id !== ch.id)[0]);
    F.start({
      ch: look(ch), stats: statsOf(ch), boxer: b, circuit: BX.CIRCUITS.find(x => x.id === b.circuit), firstFight: pr.wins + pr.losses === 0,
      coach: cur.coach, rivalCoach: BX.RIVAL_COACHES[b.id], mods: cur.mods, combos: c ? c.combos : [], onCorner: corner, onEnd: result,
    });
    $('#corner').classList.add('hidden'); $('#pause').classList.add('hidden'); F.setPaused(false);
    renderPauseCombos();
    show('fight');
  }
  app.startFight = (boxerId, charId) => { if (charId) save.sel = charId; cur.ch = BX.charById(save.sel); cur.boxer = BX.boxerById(boxerId); cur.practice=false;cur.rematch = false; startFight(); };
  function renderPauseCombos() {
    const c = career(cur.ch), el = $('#pause-combos'); if (!el) return;
    el.innerHTML = c && c.combos.length ? '<b>Tes combos :</b> ' + c.combos.map(id => { const cb = BX.COMBOS.find(x => x.id === id); return cb.name + ' <kbd>' + cb.keys + '</kbd>'; }).join(' · ') : '';
  }

  let cornerDialogue = null;
  function advanceCorner() {
    if (!cornerDialogue) return;
    if (!cornerDialogue.done) {
      cornerDialogue.entries.forEach(entry => entry.el.textContent = entry.text);
      cornerDialogue.done = true; cornerDialogue.button.textContent = '🔔 Round ' + cornerDialogue.next + ' (Entrée)'; return;
    }
    cornerDialogue = null; AU.hush(); $('#corner').classList.add('hidden');
    AU.scene('fight', { circuit: cur.boxer.circuit }); F.nextRound();
  }
  function updateCornerDialogue() {
    if (!cornerDialogue || cornerDialogue.done) return;
    const elapsed = F.state().phT;
    cornerDialogue.entries.forEach(entry => {
      const count = Math.max(0, Math.floor((elapsed - entry.at) * 36));
      entry.el.textContent = count ? entry.text.slice(0, count) : '…';
      if (count > 0 && !entry.spoken) { entry.spoken = true; AU.say(entry.text, { pitch: entry.pitch, rate: 1.06 }); }
    });
    if (elapsed >= cornerDialogue.end) {
      cornerDialogue.done = true; cornerDialogue.button.textContent = '🔔 Round ' + cornerDialogue.next + ' (Entrée)';
    }
  }
  function corner(info) {
    AU.scene('corner');
    const el = $('#corner'); el.innerHTML = '';
    const leftText = (info.pHp < .3 ? 'Respire, garde tes gants hauts. ' : '') + info.tip;
    const entries = [];
    for (const [side, name, text, at, pitch] of [
      ['left', cur.coach.name, leftText, .2, .95],
      ['right', info.rival, info.rivalTip, leftText.length / 36 + .8, 1.18],
    ]) {
      const bubble = document.createElement('div'); bubble.className = 'corner-dialogue ' + side;
      const who = document.createElement('p'); who.className = 'speaker'; who.textContent = name + ' · ' + (side === 'left' ? 'Ton coach' : 'Coach adverse');
      const words = document.createElement('p'); words.className = 'words'; words.textContent = '…';
      bubble.append(who, words); el.appendChild(bubble); entries.push({ text, el: words, at, pitch, spoken: false });
    }
    const footer = document.createElement('div'); footer.className = 'corner-actions';
    const rest = document.createElement('p'); rest.textContent = 'Énergie récupérée au prochain round : +' + Math.round(info.heal * 100) + ' %';
    const go = document.createElement('button'); go.id = 'btn-corner-next'; go.className = 'btn primary'; go.textContent = 'Afficher les conseils (Entrée)'; go.onclick = advanceCorner;
    footer.append(rest, go); el.appendChild(footer); el.classList.remove('hidden');
    cornerDialogue = { entries, button: go, next: info.next, end: entries[1].at + info.rivalTip.length / 36, done: false };
  }

  function practiceResult(r){
    const b=cur.boxer,el=$('#screen-result');
    el.innerHTML='<div class="res-box"><p class="result-eyebrow">MATCH LIBRE · '+b.nick+'</p><h1>'+(r.win?'VICTOIRE !':'ON RÉESSAIE !')+'</h1><p>'+r.method+' · Round '+(r.round||1)+'</p><p>Ton adversaire reste disponible. Ta carrière est conservée.</p><div class="res-btns"><button class="btn big primary" id="btn-res-again">🔁 Refaire ce match</button><button class="btn big" id="btn-res-next">Choisir un adversaire</button></div></div>';
    show('result');$('#btn-res-again').onclick=()=>{cur.rematch=true;startFight();};$('#btn-res-next').onclick=()=>{F.stop();openPractice();};
  }
  function result(r) {
    if(cur.mealBaseMods){cur.mods=cur.mealBaseMods;cur.mealBaseMods=null;}
    if(cur.practice){practiceResult(r);return;}
    const ch = cur.ch, b = cur.boxer, pr = prog(ch.id), c = pr.c;
    const ci = BX.CIRCUITS.findIndex(x => x.id === b.circuit), circ = BX.CIRCUITS[ci];
    let gold = 0, belt = null, secret = false, after = '', btns = '';const rewards=[];
    if (r.win) {
      rewards.push(grantReward(ch,'general',90+ci*25+(r.method==='Décision'?0:20)));
      pr.wins++; gold = BX.GOLD_WIN[b.circuit] + (r.method !== 'Décision' ? 25 : 0);
      if (!pr.beaten.includes(b.id)) {
        pr.beaten.push(b.id);
        if (BX.BOXERS.filter(x => x.circuit === circ.id).every(x => pr.beaten.includes(x.id)) && !pr.belts.includes(circ.id)) { pr.belts.push(circ.id); belt = circ; }
        if (b.id === 'caribou') secret = true;
        if (b.id === 'contretemps' && c) c.secretRevealDay = c.day + 4;
      }
      if (c) {
        c.gold += gold; c.pos = Math.max(c.pos, BX.ORDER.indexOf(b.id) + 1); c.retry = false;
        c.fightDay = c.day + 1 + (Math.random() < .5 ? 2 : 3); c.day++; c.moments = BX.MOMENTS;
        const nb = nextBoxer(ch); after = nb.pending ? '<p class="unlock-notice">CHAMPION DES TITANS ! Quelques jours de repos bien mérités…</p>' : '<p class="next-fight">Prochain combat : <b>' + nb.b.nick + '</b> dans <b>' + daysLeft(c) + ' jours</b>.</p>';
      }
      btns = '<button class="btn big primary" id="btn-res-next">' + (belt ? '🏃 Continuer' : '🏠 Retour au gym') + '</button>';
    } else {
      pr.losses++; gold = 10 + ci * 5;
      if (c) {
        c.gold += gold;
        if (!c.retry) { c.retry = true; after = '<p class="next-fight">Tu peux demander une <b>revanche immédiate</b> sans perdre ta place. Si tu perds encore, tu recules d’une position.</p>'; btns = '<button class="btn big primary" id="btn-res-again">🔁 Revanche immédiate</button><button class="btn big" id="btn-res-next">🏠 Accepter la défaite</button>'; }
        else { drop(); after = '<p class="next-fight lose">Deux défaites de suite : tu recules d’une place au tournoi. Prochain combat dans <b>' + daysLeft(c) + ' jours</b> — le temps de t’entraîner et de magasiner !</p>'; btns = '<button class="btn big primary" id="btn-res-next">🏠 Retour au gym</button>'; }
      } else btns = '<button class="btn big primary" id="btn-res-next">🏠 Retour</button>';
    }
    persist();
    const el = $('#screen-result'), s = r.stats || {};
    const dec = r.decision ? '<p class="dec">Juges : ' + r.decision.judges.map(j => j === 'Z' ? '<b class="w">' + ch.name + '</b>' : '<b class="l">' + b.nick + '</b>').join(' · ') + '</p>' : '';
    const currentStats=statsOf(ch);
    el.innerHTML='<div class="res-box combat-result '+(r.win?'win':'lose')+'"><header class="result-header"><div><p class="result-eyebrow">'+circ.name+' · ROUND '+(r.round||1)+'</p><h1>'+(r.win?'VICTOIRE !':'ON SE RELÈVE !')+'</h1><p>'+ch.name+' · '+b.nick+' · '+r.method+'</p></div><div class="result-gold">+'+gold+' or<small>Total : '+(c?c.gold:gold)+'</small></div></header><div class="combat-result-grid"><section class="fight-details"><h3>Le combat en chiffres</h3><div class="fight-numbers"><span>Coups portés <b>'+(s.landed||0)+'</b></span><span>Esquives <b>'+(s.dodges||0)+'</b></span><span>Contres <b>'+(s.counters||0)+'</b></span><span>Étoiles <b>'+(s.stars||0)+'</b></span></div>'+dec+(belt?'<p class="unlock-notice">🏆 '+belt.belt+'</p>':'')+(secret?'<p class="unlock-notice">LIGUE 2 DÉBLOQUÉE ! Statistiques jusqu’à 20 · Bronze, Argent, Or, Diamant et Championnat des Titans.</p>':'')+after+(!r.win?'<p class="small">'+b.tips[0]+'</p>':'')+'</section><section class="fight-rewards"><h3>Ta progression</h3>'+BX.progress.markup(rewards)+'<p class="points-wallet">★ '+pr.statPoints+' points à répartir</p><div class="current-stats">'+BX.STATS.map(stat=>'<span>'+stat.icon+' '+stat.name+' <b>'+currentStats[stat.id]+'</b></span>').join('')+'</div><p class="small">Améliore tes statistiques au gym avec V. Chaque niveau rapporte 3 points.</p></section></div><div class="res-btns">'+btns+'</div></div>';
    show('result');BX.progress.reveal(el);BX.progress.mount(el,rewards);
    const again = $('#btn-res-again'); if (again) again.onclick = () => { cur.rematch = true; startFight(); };
    $('#btn-res-next').onclick = () => {
      F.stop();
      if (!r.win && c && c.retry) { drop(); persist(); }
      if (belt) playRun(belt); else enterHub(r.win && c ? ['JOUR ' + c.day, 'Bien mérité ! Prochain combat dans ' + daysLeft(c) + ' jours.'] : c && !c.retry ? ['JOUR ' + c.day, 'On se relève et on s’entraîne !', '#ff8a80'] : null);
    };
  }
  function drop() { const c = career(cur.ch); c.retry = false; c.pos = Math.max(prog(cur.ch.id).beaten.includes('caribou') ? BX.ORDER.indexOf('rempart') : 0, c.pos - 1); c.fightDay = c.day + 1 + 3; c.day++; c.moments = BX.MOMENTS; }

  // ---------- Scène de course ----------
  function playRun(circ) {
    const ch = cur.ch, c = career(ch), pr = prog(ch.id);
    const cameos = pr.beaten.map(id => BX.boxerById(id)).filter(b => b && b.circuit !== 'secret');
    const nb = nextBoxer(ch), nextCirc = BX.CIRCUITS.find(x => x.id === nb.b.circuit);
    $('#btn-run-skip').classList.add('hidden');
    BX.run.start({ ch: look(ch), coach: BX.charById(c.coach), circuit: circ, next: nextCirc && nextCirc.id !== circ.id ? nextCirc : null, cameos, onDone: () => enterHub(['JOUR ' + c.day, 'Prochain combat dans ' + daysLeft(c) + ' jours.']) });
    show('run');
  }
  app.playRun = id => { cur.ch = BX.charById(save.sel); const pr = prog(cur.ch.id); if (!pr.c) pr.c = newCareer(cur.ch); playRun(BX.CIRCUITS.find(x => x.id === (id || 'bronze'))); };
  $('#btn-run-skip').onclick = () => BX.run.skip();

  // Pause
  let pauseTab='controls';
  function refreshPause(){
    document.querySelectorAll('[data-pause-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.pausePanel!==pauseTab));
    document.querySelectorAll('[data-pause-tab]').forEach(b=>b.classList.toggle('on',b.dataset.pauseTab===pauseTab));
    for(const key of ['sound','music'])$('#pause-'+key).checked=AU.pref[key];$('#pause-volume').value=Math.round((AU.pref.volume??.8)*100);
  }
  document.querySelectorAll('[data-pause-tab]').forEach(b=>b.onclick=()=>{pauseTab=b.dataset.pauseTab;refreshPause();});
  $('#pause-sound').onchange=e=>{AU.setSound(e.target.checked);soundLabels();};
  $('#pause-music').onchange=e=>{AU.setMusic(e.target.checked);soundLabels();};
  $('#pause-volume').oninput=e=>AU.setVolume(+e.target.value/100);
  function togglePause() {
    if (screen !== 'fight' || !F.state()) return;
    const st = F.state(); if (st.phase === 'between' || st.phase === 'over') return;
    const p = !F.paused;if(p)refreshPause(); F.setPaused(p); $('#pause').classList.toggle('hidden', !p); if (p) AU.crowd(.15); else AU.crowd(1);
  }
  F.onPause = togglePause;
  $('#btn-resume').onclick = togglePause;
  $('#btn-quit').onclick = () => {
    const S = F.state(); F.setPaused(false); $('#pause').classList.add('hidden');
    const r = { win: false, method: 'abandon', round: S ? S.round : 1, stats: S ? S.stats : {}, kdO: S ? S.o.kd : 0 };
    F.stop(); result(r);
  };

  // ---------- Clavier / souris ----------
  addEventListener('keydown', e => {
    if ($('#title-config').open) return;
    if (screen === 'select' && e.target.closest?.('button, summary, select, input') && !['ArrowLeft','ArrowRight'].includes(e.code)) { if (e.code === 'Escape') show('title'); return; }
    AU.unlock();
    if (screen === 'fight') {
      if (e.code === 'Escape' || e.code === 'KeyP') { togglePause(); e.preventDefault(); return; }
      const st = F.state();
      if (st && st.phase === 'between' && (e.code === 'Enter' || e.code === 'Space')) { if (!e.repeat) advanceCorner(); e.preventDefault(); return; }
      if (F.keydown(e)) e.preventDefault();
      return;
    }
    if(screen==='restaurant'){if(e.code==='Escape')BX.restaurant.leave();return;}
    if (screen === 'gym') {
      if (!$('#gym-res').classList.contains('hidden')) { if (e.code === 'Enter') ($('#btn-gym-next') || $('#btn-gym-again') || $('#btn-gym-back')).click(); if (e.code === 'Escape') $('#btn-gym-back').click(); e.preventDefault(); return; }
      if (e.code === 'Escape') { gymQuit(); e.preventDefault(); return; }
      if (BX.gym.keydown(e)) e.preventDefault();
      return;
    }
    if (screen === 'hub') {
      if (modalOpen()) { if (e.code === 'Escape') closeModal(); return; }
      if (e.code === 'Escape') { show('select'); return; }
      if (HB.keydown(e)) e.preventDefault();
      return;
    }
    if (screen === 'run') { if ((e.code === 'Enter' || e.code === 'Escape' || e.code === 'Space') && BX.run.canSkip()) BX.run.skip(); e.preventDefault(); return; }
    if (e.code === 'Enter') {
      if (screen === 'title') $('#btn-play').click();
      else if (screen === 'select') enterHub();
      else if (screen === 'circuit') { const b = $('#btn-fight-now'); if (b && !b.disabled) b.click(); }
      else if (screen === 'vs') startFight();
      else if (screen === 'result') ($('#btn-res-again') || $('#btn-res-next')).click();
      e.preventDefault();
    }
    if (e.code === 'Escape') { if (screen === 'select') show('title'); else if (screen === 'circuit') enterHub(); else if (screen === 'practice') show('select'); else if (screen === 'vs') backFromVs(); }
    if (screen === 'circuit' && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')) { cbBrowse(e.code === 'ArrowRight' ? 1 : -1); e.preventDefault(); }
    if (screen === 'select' && (e.code === 'ArrowRight' || e.code === 'ArrowLeft')) { browseKid(e.code === 'ArrowRight' ? 1 : -1); e.preventDefault(); }
  });
  addEventListener('keyup', e => { if (screen === 'fight') F.keyup(e); if (screen === 'hub') HB.keyup(e); if (screen === 'gym') BX.gym.keyup(e); });
  addEventListener('blur', () => { F.clearKeys(); HB.clearKeys(); BX.gym.clearKeys(); if (screen === 'fight' && F.state() && !F.paused) togglePause(); });
  cv.addEventListener('click', e => {
    if(e.button!==0)return;
    const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;
    if(screen==='gym'&&$('#gym-res').classList.contains('hidden'))BX.gym.click(x,y);
    else if(screen==='hub'&&!modalOpen())HB.click(x,y);
  });

  // ---------- Boucle ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now;
    ctx.setTransform(q, 0, 0, q, 0, 0);
    if (screen === 'fight' || (screen === 'result' && F.state())) { for (let i = 0; i < (F.speed || 1); i++) F.update(dt); F.render(ctx, q); if (F.state() && F.state().phase === 'between') updateCornerDialogue(); }
    else if(screen==='restaurant'){BX.restaurant.update(dt);BX.restaurant.render(ctx);}
    else if (screen === 'gym') { BX.gym.update(dt); BX.gym.render(ctx, q); }
    else if (screen === 'hub') { if (!modalOpen()) HB.update(dt); HB.render(ctx, q); }
    else if (screen === 'run') { BX.run.update(dt); if (BX.run.state()) BX.run.render(ctx); if (BX.run.canSkip()) $('#btn-run-skip').classList.remove('hidden'); }
    else drawMenu(dt, now / 1000);
    updateRoulette(now);
    BX.progress.update(now);
    requestAnimationFrame(frame);
  }
  function drawMenu(dt, T) {
    if (screen === 'select') drawSelectPreview(T);
    if (screen === 'select' || screen === 'circuit') { ctx.drawImage(HB.background(q), 0, 0, W, H); ctx.fillStyle = 'rgba(5,3,15,.55)'; ctx.fillRect(0, 0, W, H); if (screen === 'circuit' && cb.view) drawBoardStage(T); return; }
    const circ = screen === 'vs' && cur.boxer ? BX.CIRCUITS.find(c => c.id === cur.boxer.circuit) : BX.CIRCUITS[0];
    const key = circ.id + q; if (key !== menuKey) { menuArena = A.arena(W, H, q, circ); menuKey = key; }
    ctx.drawImage(menuArena, 0, 0, W, H);
    if (screen === 'vs' && cur.boxer) {
      vsT += dt;
      const b = cur.boxer, e = A.eout(Math.min(1, vsT / .6));
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(640, 360); ctx.fillStyle = 'rgba(255,214,0,.12)'; ctx.beginPath(); ctx.moveTo(-60, -400); ctx.lineTo(60, -400); ctx.lineTo(10, 0); ctx.lineTo(70, 0); ctx.lineTo(-40, 400); ctx.lineTo(-10, 40); ctx.lineTo(-70, 40); ctx.closePath(); ctx.fill(); ctx.restore();
      A.playerFront(ctx, look(cur.ch), lerp(-200, 270, e), 760, 1.05, T);
      ctx.save(); ctx.translate(lerp(1500, 930, e), 790); const k = .95 * (b.look.h || 1); ctx.scale(k, k);
      A.boxer(ctx, b, { ph: 'intro', time: T, guard: 'high', shadowId: cur.ch.id }); ctx.restore();
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const p = 1 + Math.sin(T * 6) * .04; ctx.translate(640, 330); ctx.scale(p, p);
      ctx.font = '140px Bungee, Impact'; ctx.lineWidth = 12; ctx.strokeStyle = '#140a26'; ctx.strokeText('VS', 0, 0); ctx.fillStyle = '#ffd600'; ctx.fillText('VS', 0, 0); ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(5,3,15,.35)'; ctx.fillRect(0, 0, W, H);

    }
  }
  const lerp = A.lerp;
  // Scène du tableau : toi à gauche, l’adversaire à droite, les deux font du shadow boxing.
  function drawBoardStage(T) {
    const b = cb.view, x0 = 22, y0 = 80, w = 600, h = 538, circ = BX.CIRCUITS.find(c => c.id === b.circuit);
    ctx.save(); ctx.beginPath(); A.rr(ctx, x0, y0, w, h, 20); ctx.clip();
    const g = ctx.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, '#1a0f3a'); g.addColorStop(1, '#05030f'); ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
    // projecteurs
    for (const [sx, col] of [[x0 + 150, 'rgba(79,195,247,.16)'], [x0 + 450, circ.color]]) { ctx.save(); ctx.globalAlpha = col.startsWith('#') ? .14 : 1; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(sx - 30, y0); ctx.lineTo(sx + 30, y0); ctx.lineTo(sx + 170, y0 + h); ctx.lineTo(sx - 170, y0 + h); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = 'rgba(255,255,255,.06)'; A.ell(ctx, x0 + 300, y0 + h - 12, 290, 40); ctx.fill();
    // toi : gauche/droite en alternance, petit balancement
    const ch = look(BX.charById(save.sel)), cy = .95, u = (T % cy) / cy, n = Math.floor(T / cy);
    const pe = u < .14 ? A.eout(u / .14) : u < .4 ? 1 - A.ease((u - .14) / .26) : 0;
    A.playerFront(ctx, ch, x0 + 150 + Math.sin(T * 2.2) * 14, y0 + h - 8, .7, T, { side: n % 2 ? 1 : -1, e: pe });
    // l’adversaire : jab, jab, crochet
    const oc = 1.25, ou = (T % oc) / oc, on = Math.floor(T / oc), pose = on % 3 === 2 ? 'hook' : 'jab', from = on % 2 ? 'L' : 'R';
    let ph = 'idle', t = 0; if (ou < .16) { ph = 'strike'; t = ou / .16; } else if (ou < .42) { ph = 'after'; t = (ou - .16) / .26; }
    const R = A.pose(b, { ph, t, move: { pose, from }, time: T, guard: 'high' }); R.bx += Math.sin(T * 1.8) * 16;
    ctx.save(); ctx.translate(x0 + 445, y0 + h - 8); const k = .74 * (b.look.h || 1); ctx.scale(k, k);
    A.boxer(ctx, b, { R, time: T, guard: 'high', shadowId: save.sel }); ctx.restore();
    // VS
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const p = 1 + Math.sin(T * 6) * .05; ctx.translate(x0 + 300, y0 + 150); ctx.scale(p, p); ctx.rotate(-.06);
    ctx.font = '110px Bungee, Impact'; ctx.lineWidth = 12; ctx.strokeStyle = '#140a26'; ctx.strokeText('VS', 0, 0); ctx.fillStyle = '#ffd600'; ctx.fillText('VS', 0, 0); ctx.restore();
    ctx.restore();
  }
  if (root.FamilyHeads) root.FamilyHeads.ready.then(() => { A.clearPortraits(); if (screen === 'select') renderSelect(); if (screen === 'circuit') renderCircuit(); });
  // Raccourcis d’URL pour les tests : #fight=bobby,matthieu · #screen=select · #hub=matthieu · #run=bronze
  const hash = new URLSearchParams(location.hash.slice(1));
  show('title');
  if (hash.get('screen')) show(hash.get('screen'));
  if (hash.get('hub')) { save.sel = hash.get('hub'); enterHub(); }
  if (hash.get('run')) { if (hash.get('as')) save.sel = hash.get('as'); app.playRun(hash.get('run')); }
  if (hash.get('vs')) { save.sel = (hash.get('as') || save.sel); openVs(BX.boxerById(hash.get('vs'))); }
  if (hash.get('fight')) { const [bid, cid] = hash.get('fight').split(','); app.startFight(bid, cid); }
  requestAnimationFrame(frame);
})(window);
