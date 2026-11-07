// Paper Loop — écrans (titre, personnages, jeu), sauvegarde par personnage, menu de pause.
(function (root) {
  'use strict';
  const PL = root.PL = root.PL || {};
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const coin = '<i class="coin"></i>';

  // ---------------------------------------------------------------- sauvegarde
  const app = PL.app = { save: null, char: null, game: null, screen: 'title' };
  function load() {
    try { app.save = JSON.parse(localStorage.getItem(PL.SAVE_KEY)) || null; } catch (e) { app.save = null; }
    if (!app.save || app.save.v !== 1) app.save = { v: 1, current: null, profiles: {} };
  }
  function persist() { try { localStorage.setItem(PL.SAVE_KEY, JSON.stringify(app.save)); } catch (e) { } }
  function profile(id = app.char && app.char.id) {
    if (!id) return null; const p = app.save.profiles; if (!p[id]) p[id] = PL.newProfile(); return PL.migrateProfile(p[id]);
  }
  app.profile = profile; app.persist = persist;

  // ---------------------------------------------------------------- écrans
  function show(name) {
    app.screen = name;
    for (const s of $$('.screen')) s.classList.toggle('hidden', s.id !== 'screen-' + name);
    PL.input.enabled = name === 'game';
    if (name !== 'game' && app.game) { app.game.stop(); app.game = null; persist(); }
    if (name === 'title') { PL.audio.stopMusic(); startTitleAnim(); renderTitle(); } else stopTitleAnim();
    if (name !== 'game') $('#pause').classList.add('hidden');
  }
  app.show = show;
  function click(sel, fn) { for (const el of $$(sel)) el.addEventListener('click', e => { PL.audio.unlock(); PL.audio.play('click'); fn(e, el); }); }
  function portrait(ch, size, view = 'front') {
    const c = document.createElement('canvas'); c.width = size; c.height = size; c.className = 'portrait';
    const draw = () => { const ctx = c.getContext('2d'); ctx.clearRect(0, 0, size, size); if (root.FamilyHeads && root.FamilyHeads.has(ch.id)) root.FamilyHeads.draw(ctx, ch.id, view, size * 0.1, size * 0.05, size * 0.8, size * 0.9); };
    if (root.FamilyHeads) root.FamilyHeads.ready.then(draw); return c;
  }
  let toastTimer = 0;
  function toast(msg) { const t = $('#toast'); t.innerHTML = msg; t.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), 3400); }
  app.toast = toast;

  // ---------------------------------------------------------------- titre (scène animée : coureurs et clones gris)
  let titleRaf = 0, titleT = 0, titleLast = 0, titleWall = null;
  function renderTitle() {
    const b = $('#btn-continue'), id = app.save.current, ch = id && PL.charById(id), p = id && app.save.profiles[id];
    if (!ch || !p) { b.classList.add('hidden'); return; }
    b.innerHTML = ''; b.appendChild(portrait(ch, 44)); b.insertAdjacentHTML('beforeend', '<span>Continuer avec ' + esc(ch.name) + ' <small>' + coin + ' ' + PL.fmtGold(p.gold) + '</small></span>'); b.classList.remove('hidden');
  }
  function startTitleAnim() {
    const cv = $('#title-anim'); if (!cv) return; const ctx = cv.getContext('2d');
    if (!titleWall) titleWall = PL.render.makeWall({ pw: 2600, ph: 600 }, 5);
    const runners = PL.CHARACTERS.slice().sort(() => Math.random() - 0.5).slice(0, 5).map((ch, i) => ({ ch, x: -i * 200 - Math.random() * 120, speed: 170 + Math.random() * 60, phase: Math.random() * 6, clone: i > 0 }));
    titleLast = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - titleLast) / 1000); titleLast = now; titleT += dt;
      PL.render.drawWall(ctx, titleWall, { x: titleT * 60 % 1200, y: 0 }, cv.width, cv.height);
      ctx.fillStyle = '#c99d66'; ctx.fillRect(0, cv.height - 70, cv.width, 70); ctx.fillStyle = '#f3e4c6'; ctx.fillRect(0, cv.height - 70, cv.width, 12); ctx.strokeStyle = '#2b1f1a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, cv.height - 70); ctx.lineTo(cv.width, cv.height - 70); ctx.stroke();
      for (const r of runners) {
        r.x += r.speed * dt; if (r.x > cv.width + 100) r.x = -120 - Math.random() * 300;
        const hop = Math.max(0, Math.sin(titleT * 6 + r.phase)) * 22, v = { face: 1, pose: hop > 12 ? 'jump' : 'run', walk: titleT * 14 + r.phase };
        if (r.clone) PL.render.drawClone(ctx, runners[0].ch, r.x, cv.height - 70 - hop, v, titleT); else PL.render.drawHero(ctx, r.ch, r.x, cv.height - 70 - hop, v, titleT);
      }
      titleRaf = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(titleRaf); titleRaf = requestAnimationFrame(loop);
  }
  function stopTitleAnim() { cancelAnimationFrame(titleRaf); titleRaf = 0; }

  // ---------------------------------------------------------------- personnages
  function renderChars() {
    const grid = $('#char-grid'); grid.innerHTML = '';
    for (const fam of Object.keys(PL.FAMILIES)) {
      const h = document.createElement('h3'); h.textContent = PL.FAMILIES[fam]; grid.appendChild(h);
      const row = document.createElement('div'); row.className = 'char-row';
      for (const ch of PL.CHARACTERS.filter(c => c.family === fam)) {
        const p = app.save.profiles[ch.id];
        const b = document.createElement('button'); b.className = 'char-card paper' + (app.save.current === ch.id ? ' current' : ''); b.style.setProperty('--c', ch.outfit); b.dataset.id = ch.id;
        b.appendChild(portrait(ch, 100));
        b.insertAdjacentHTML('beforeend', '<b>' + esc(ch.name) + '</b>' + (p ? '<em>' + coin + ' ' + PL.fmtGold(p.gold) + ' · ' + PL.totalClones(p) + ' clone' + (PL.totalClones(p) > 1 ? 's' : '') + '</em>' : '<em>Nouveau</em>'));
        b.addEventListener('click', () => { PL.audio.unlock(); PL.audio.play('click'); pickChar(ch); });
        row.appendChild(b);
      }
      grid.appendChild(row);
    }
  }
  function pickChar(ch) { app.char = ch; app.save.current = ch.id; profile(); persist(); startGame(); }

  // ---------------------------------------------------------------- jeu
  function startGame() {
    show('game'); $('#pause').classList.add('hidden');
    if (app.game) app.game.stop();
    app.game = new PL.Game({ canvas: $('#game'), char: app.char, profile: profile(), onChange: persist, onPause: paused => { $('#pause').classList.toggle('hidden', !paused); if (paused) $('#pause-info').innerHTML = esc(app.char.name) + ' · ' + coin + ' ' + PL.fmtGold(profile().gold) + ' · ' + PL.totalClones(profile()) + ' clone' + (PL.totalClones(profile()) > 1 ? 's' : ''); } });
    PL.audio.unlock(); PL.audio.music('prairie');
    app.game.start();
  }
  app.startGame = startGame;
  app.give = n => { const p = profile(); if (p) { p.gold += n; persist(); } };
  app.reset = () => { app.save = { v: 1, current: null, profiles: {} }; persist(); };

  // ---------------------------------------------------------------- branchements
  function init() {
    load();
    $('#version').textContent = 'v' + PL.VERSION;
    PL.input.setupTouch($('#touch'));
    click('#btn-play', () => { renderChars(); show('chars'); });
    click('#btn-continue', () => { app.char = PL.charById(app.save.current); startGame(); });
    click('[data-back]', (e, el) => show(el.dataset.back));
    const soundLabel = () => { for (const b of $$('#btn-sound, #p-sound')) b.textContent = PL.audio.muted ? '🔇 Son coupé' : '🔊 Son'; };
    click('#btn-sound, #p-sound', () => { PL.audio.toggle(); soundLabel(); }); soundLabel();
    click('#p-resume', () => app.game && app.game.setPaused(false));
    click('#p-change', () => { renderChars(); show('chars'); });
    click('#btn-run, #p-games', () => { PL.audio.stopMusic(); location.href = '../index.html'; });   // retour à l'écran de choix (Paper Run)
    click('#p-reset', () => { if (confirm('Effacer la partie de ' + app.char.name + ' (pièces, clones, pouvoirs) ?')) { delete app.save.profiles[app.char.id]; persist(); startGame(); } });
    window.addEventListener('keydown', e => { if (e.code === 'Enter' && app.screen === 'game' && app.game && app.game.paused) app.game.setPaused(false); });
    show('title');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window);
