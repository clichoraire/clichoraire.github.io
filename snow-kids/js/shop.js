// Snow Kids — la boutique : intérieur de chalet dessiné au canevas (étagères garnies, vendeur, enseigne) et vitrine
// centrale qui montre tous les articles de l'onglet (le sélectionné en grand, les autres en vignettes, cadenas sur ceux
// qui sont verrouillés). Onglets : Planches, Équipement, Améliorations (de la planche équipée), Gadgets, Autres.
(function (SK) {
  'use strict';
  const S = SK.Shop = {}, TAU = Math.PI * 2;
  SK.fmtGold = n => Math.round(n).toLocaleString('fr-CA').replace(/ | /g, ' ') + ' G';
  SK.COIN_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#c98a12"/><circle cx="19" cy="19" r="15" fill="#ffd54a"/><circle cx="19" cy="19" r="11" fill="none" stroke="#e0a81c" stroke-width="2"/><text x="19" y="25" font-family="Arial Black,Arial" font-weight="900" font-size="17" text-anchor="middle" fill="#b8720c">G</text></svg>');
  SK.drawGoldCoin = function (ctx, x, y, r) {
    ctx.fillStyle = '#c98a12'; ctx.beginPath(); ctx.arc(x + r * 0.08, y + r * 0.08, r, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.arc(x, y, r * 0.86, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#e0a81c'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#b8720c'; ctx.font = '900 ' + r * 1.1 + 'px "Arial Black", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('G', x, y + r * 0.05); ctx.textBaseline = 'alphabetic';
  };
  S.TABS = [
    { id: 'boards', name: 'Planches', color: '#f9b233', text: '#3e2723' },
    { id: 'equip', name: 'Équipement', color: '#d93b3b', text: '#fff' },
    { id: 'up', name: 'Améliorations', color: '#4caf50', text: '#fff' },
    { id: 'gadget', name: 'Gadgets', color: '#3b7dd8', text: '#fff' },
    { id: 'other', name: 'Autres', color: '#7e57c2', text: '#fff' },
  ];
  const UP_DEFS = [['speed', 'Vitesse', 'Ta planche équipée gagne +1 en vitesse de pointe.'], ['corner', 'Virage', 'Ta planche équipée accroche mieux : +1 en virage.'], ['trick', 'Figures', 'Figures plus rapides et mieux payées : +1 en figures.']];

  let raf = 0, keyHandler = null, ctx, canvas, state;
  function stop() { cancelAnimationFrame(raf); raf = 0; if (keyHandler) { window.removeEventListener('keydown', keyHandler); keyHandler = null; } }
  S.close = stop;
  const mod = v => (v > 0 ? '+' : '') + v;

  // Articles d'un onglet, avec leur état (possédé, équipé, verrouillé) pour cette sauvegarde
  function items(tab, save) {
    if (tab === 'boards') return SK.BOARDS.map(b => { const eff = SK.effectiveBoard(b.id, save), owned = save.boards.includes(b.id), lock = owned ? null : SK.lockReason(b.unlock, save); return { id: b.id, kind: 'board', name: 'Planche ' + b.name, price: b.price, color: b.color, desc: b.desc + ` Vitesse ${mod(eff.speed)} · Virage ${mod(eff.corner)} · Figures ${mod(eff.trick)}.`, owned, lock, action: lock ? 'locked' : !owned ? 'buy' : save.advBoard === b.id ? 'equipped' : 'equip' }; });
    if (tab === 'up') { const b = SK.boardById(save.advBoard), u = (save.upgrades[b.id] = save.upgrades[b.id] || { speed: 0, corner: 0, trick: 0 }); return UP_DEFS.map(([k, lab, d]) => { const lvl = u[k] || 0, max = lvl >= SK.UPGRADE_MAX, lock = max ? null : SK.lockReason(lvl >= 1 ? { wins: 3 } : null, save); return { id: 'up-' + k, kind: 'up', stat: k, boardId: b.id, name: lab + ' +1 · ' + b.name, price: max ? 0 : SK.upgradeCost(lvl), color: b.color, desc: d + ` Niveau actuel : ${lvl} / ${SK.UPGRADE_MAX}.`, owned: max, lock, action: lock ? 'locked' : max ? 'max' : 'buy', level: lvl }; }); }
    return SK.GEAR.filter(g => g.cat === tab).map(g => { const owned = save.gear.includes(g.id) || (g.id === 'masque' && save.shinobin), lock = owned ? null : SK.lockReason(g.unlock, save); return { id: g.id, kind: 'gear', name: g.name, price: g.price, desc: g.desc, owned, lock, action: lock ? 'locked' : owned ? 'owned' : 'buy' }; });
  }

  // Stats (sur 10) du Kid avec sa planche et son équipement ; previewIt = article sélectionné (acheté/équipé → aperçu)
  function statsFor(save, previewIt) {
    const ch = SK.charById(save.advChar) || SK.CHARACTERS[0];
    const calc = (boardId, gear, up) => { const b = SK.effectiveBoard(boardId, save); return { speed: ch.speed + b.speed + (up.speed || 0), corner: ch.corner + b.corner + (up.corner || 0) + (gear.has('bottes') ? 1 : 0), trick: ch.trick + b.trick + (up.trick || 0) + (gear.has('gants') ? 1 : 0) }; };
    const gear = new Set(save.gear || []), cur = calc(save.advBoard, gear, {});
    let boardId = save.advBoard, up = {}, g2 = new Set(gear);
    if (previewIt && (previewIt.action === 'buy' || previewIt.action === 'equip' || previewIt.action === 'locked')) {
      if (previewIt.kind === 'board') boardId = previewIt.id; else if (previewIt.kind === 'up') up[previewIt.stat] = 1; else g2.add(previewIt.id);
    }
    return { ch, cur, next: calc(boardId, g2, up) };
  }
  function renderMe(E, save, it) {
    const { ch, cur, next } = statsFor(save, it), board = SK.boardById(save.advBoard);
    const bar = (k, lab) => { let seg = ''; for (let i = 1; i <= 10; i++) { const on = i <= Math.min(cur[k], next[k]), gain = i > cur[k] && i <= next[k], loss = i > next[k] && i <= cur[k]; seg += `<i class="${on ? 'on' : gain ? 'gain' : loss ? 'loss' : ''}"></i>`; } const d = next[k] - cur[k]; return `<div class="me-stat"><span>${lab}</span><div class="segs">${seg}</div><em class="${d > 0 ? 'gain' : d < 0 ? 'loss' : ''}">${cur[k]}${d ? ' → ' + next[k] : ''}</em></div>`; };
    const owned = (save.gear || []).map(id => SK.gearById(id)).filter(Boolean);
    E.me.innerHTML = `<h4>Mon équipement</h4><div class="me-top"><canvas class="me-char" width="110" height="120"></canvas><div class="me-info"><b>${ch.name}</b><span class="me-board"><i style="background:${board.color}"></i>${board.name}</span><small>${owned.length ? owned.length + ' article' + (owned.length > 1 ? 's' : '') : 'Aucun article'}</small></div></div>
      <div class="me-stats">${bar('speed', 'Vitesse')}${bar('corner', 'Virage')}${bar('trick', 'Figures')}</div>
      <div class="me-gear">${owned.map(g => `<canvas width="48" height="48" data-id="${g.id}" title="${g.name}"></canvas>`).join('')}${it && it.kind === 'gear' && !it.owned ? `<canvas width="48" height="48" data-id="${it.id}" class="preview" title="${it.name} (aperçu)"></canvas>` : ''}</div>
      <p class="me-hint">${it && (it.action === 'buy' || it.action === 'equip' || it.action === 'locked') ? 'En vert : ce que « ' + it.name + ' » te ferait gagner.' : 'Choisis un article pour voir son effet sur tes barres.'}</p>`;
    const cc = E.me.querySelector('.me-char'); const c = cc.getContext('2d'); SK.Render.drawRacer(c, SK.fakeRacer(ch.id, board.id), 55, 112, 44, 0, false);
    E.me.querySelectorAll('.me-gear canvas').forEach(cv => { S.drawItem(cv.getContext('2d'), { kind: 'gear', id: cv.dataset.id }, 24, 26, 14, 0); });
  }

  // opts : { canvas, els:{gold,tabs,title,icon,strip,name,price,desc,buy,prev,next,back,me}, save, store, toast, onBack }
  S.open = function (opts) {
    stop(); canvas = opts.canvas; ctx = canvas.getContext('2d');
    const save = opts.save, E = opts.els;
    state = { tab: S._tab || 'boards', idx: 0 };
    const refresh = () => {
      const list = items(state.tab, save); if (state.idx >= list.length) state.idx = 0; const it = list[state.idx]; state.list = list;
      E.gold.innerHTML = `<img src="${SK.COIN_SVG}" alt=""><b>${SK.fmtGold(save.gold)}</b>`;
      E.tabs.innerHTML = S.TABS.map(t => `<button data-tab="${t.id}" class="shop-tab${t.id === state.tab ? ' on' : ''}" style="background:${t.color};color:${t.text}">${t.name}</button>`).join('');
      E.tabs.querySelectorAll('button').forEach(b => { b.onclick = () => { state.tab = b.dataset.tab; S._tab = state.tab; state.idx = 0; SK.Audio.sfx('click'); refresh(); }; });
      E.title.textContent = it.name;
      E.name.textContent = it.action === 'locked' ? '🔒 Verrouillé' : it.action === 'buy' ? 'Prix' : it.action === 'max' ? 'Niveau maximum' : it.action === 'equipped' ? 'Planche équipée' : it.action === 'equip' ? 'Dans ton casier' : 'Déjà acheté';
      E.price.innerHTML = it.action === 'buy' || it.action === 'locked' ? `<img src="${SK.COIN_SVG}" alt=""> ${SK.fmtGold(it.price)}` : '';
      E.price.className = 'shop-price' + ((it.action === 'buy' && save.gold < it.price) || it.action === 'locked' ? ' poor' : '');
      E.desc.innerHTML = it.lock ? `<b>Pour débloquer :</b> ${it.lock}.<br><span class="dim">${it.desc}</span>` : it.desc;
      E.buy.textContent = it.action === 'buy' ? 'ACHETER' : it.action === 'equip' ? 'ÉQUIPER' : it.action === 'equipped' ? 'ÉQUIPÉE' : it.action === 'max' ? 'MAX' : it.action === 'locked' ? 'VERROUILLÉ' : 'POSSÉDÉ';
      E.buy.disabled = !(it.action === 'buy' || it.action === 'equip');
      E.buy.onclick = () => act(it);
      // vignettes : tous les articles de l'onglet
      E.strip.innerHTML = '';
      list.forEach((o, i) => {
        const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96; cv.className = 'tile' + (i === state.idx ? ' on' : '') + (o.lock ? ' locked' : '') + (o.owned && !o.lock ? ' owned' : '');
        cv.title = o.name; cv.onclick = () => { state.idx = i; SK.Audio.sfx('click'); refresh(); };
        const c = cv.getContext('2d'); S.drawItem(c, o, 48, 50, 30, 0); if (o.lock) padlock(c, 48, 50, 18); else if (o.owned) { c.fillStyle = '#69f0ae'; c.font = '900 22px sans-serif'; c.textAlign = 'center'; c.fillText('✓', 82, 26); }
        E.strip.appendChild(cv);
      });
      renderMe(E, save, it);
      const ic = E.icon.getContext('2d'); ic.clearRect(0, 0, E.icon.width, E.icon.height); S.drawItem(ic, it, E.icon.width / 2, E.icon.height / 2, E.icon.width * 0.36, performance.now() / 1000);
      if (it.lock) { ic.fillStyle = 'rgba(20,24,42,0.55)'; ic.fillRect(0, 0, E.icon.width, E.icon.height); padlock(ic, E.icon.width / 2, E.icon.height / 2, E.icon.width * 0.2); }
    };
    const act = it => {
      if (it.action === 'buy') {
        if (save.gold < it.price) { SK.Audio.sfx('nope'); opts.toast('Pas assez d\'or : il te manque ' + SK.fmtGold(it.price - save.gold)); return; }
        save.gold -= it.price;
        if (it.kind === 'board') { save.boards.push(it.id); save.advBoard = it.id; save.board = it.id; opts.toast(it.name + ' achetée et équipée !'); }
        else if (it.kind === 'up') { save.upgrades[it.boardId][it.stat] = it.level + 1; opts.toast(it.name + ' : fait !'); }
        else { save.gear.push(it.id); if (it.id === 'masque') save.shinobin = true; opts.toast(it.name + ' : acheté !'); }
        opts.store(); SK.Audio.sfx('buy'); refresh();
      } else if (it.action === 'equip') { save.advBoard = it.id; save.board = it.id; opts.store(); SK.Audio.sfx('box'); opts.toast(it.name + ' équipée'); refresh(); }
      else if (it.action === 'locked') { SK.Audio.sfx('nope'); opts.toast('Verrouillé : ' + it.lock); }
    };
    const move = d => { state.idx = (state.idx + d + state.list.length) % state.list.length; SK.Audio.sfx('click'); refresh(); };
    E.prev.onclick = () => move(-1); E.next.onclick = () => move(1);
    E.back.onclick = () => { SK.Audio.sfx('click'); opts.onBack(); };
    keyHandler = e => {
      if (e.code === 'ArrowLeft') { move(-1); e.preventDefault(); } else if (e.code === 'ArrowRight') { move(1); e.preventDefault(); }
      else if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Tab') { const i = S.TABS.findIndex(t => t.id === state.tab); state.tab = S.TABS[(i + (e.code === 'ArrowUp' ? -1 : 1) + S.TABS.length) % S.TABS.length].id; S._tab = state.tab; state.idx = 0; SK.Audio.sfx('click'); refresh(); e.preventDefault(); }
      else if (e.code === 'Enter' || e.code === 'KeyX' || e.code === 'Space') { e.preventDefault(); if (state.list[state.idx]) act(state.list[state.idx]); }
      else if (e.code === 'Escape') opts.onBack();
    };
    window.addEventListener('keydown', keyHandler);
    refresh();
    const frame = () => { raf = requestAnimationFrame(frame); drawScene(performance.now() / 1000, save); };
    frame();
  };
  function padlock(c, x, y, s) { c.fillStyle = '#ffd54a'; c.beginPath(); c.moveTo(x - s * 0.7, y); c.lineTo(x + s * 0.7, y); c.lineTo(x + s * 0.7, y + s); c.lineTo(x - s * 0.7, y + s); c.closePath(); c.fill(); c.strokeStyle = '#ffd54a'; c.lineWidth = s * 0.25; c.beginPath(); c.arc(x, y - s * 0.1, s * 0.45, Math.PI, 0); c.stroke(); c.fillStyle = '#3e2723'; c.beginPath(); c.arc(x, y + s * 0.45, s * 0.16, 0, TAU); c.fill(); }

  // ------------------------------------------------------------------ décor : le chalet
  function drawScene(t, save) {
    const W = canvas.width, H = canvas.height, floorY = H * 0.8;
    for (let y = 0; y < floorY; y += 44) { ctx.fillStyle = (y / 44) % 2 ? '#8a5533' : '#935c38'; ctx.fillRect(0, y, W, 44); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, y + 41, W, 3); ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = (y * 7) % 300; x < W; x += 300) ctx.fillRect(x, y + 10, 90, 2); }
    const g = ctx.createLinearGradient(0, floorY, 0, H); g.addColorStop(0, '#b07a4a'); g.addColorStop(1, '#8a5a33'); ctx.fillStyle = g; ctx.fillRect(0, floorY, W, H - floorY);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2; for (let x = -200; x < W + 200; x += 70) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 90, floorY); ctx.stroke(); }
    ctx.fillStyle = '#5d3a1f'; ctx.fillRect(0, floorY - 8, W, 10);
    ctx.fillStyle = '#5d3a1f'; ctx.fillRect(0, 0, W, 26); for (let x = 60; x < W; x += 260) ctx.fillRect(x, 0, 26, 70);
    // enseigne en haut à droite, fenêtre dessous
    ctx.save(); ctx.translate(W - 150, 78); ctx.rotate(-0.05); ctx.fillStyle = '#c98a4a'; roundRect(-105, -30, 210, 60, 10); ctx.fill(); ctx.strokeStyle = '#5d3a1f'; ctx.lineWidth = 6; ctx.stroke(); ctx.fillStyle = '#d84315'; ctx.font = '900 32px "Arial Black", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BOUTIQUE', 0, 12); ctx.restore();
    ctx.fillStyle = '#4e2f18'; ctx.fillRect(W - 130, 150, 120, 110); const sg = ctx.createLinearGradient(0, 156, 0, 254); sg.addColorStop(0, '#5fb0ff'); sg.addColorStop(1, '#dff3ff'); ctx.fillStyle = sg; ctx.fillRect(W - 124, 156, 108, 98);
    ctx.fillStyle = '#eef4fb'; ctx.beginPath(); ctx.moveTo(W - 124, 254); ctx.lineTo(W - 124, 226); ctx.lineTo(W - 84, 192); ctx.lineTo(W - 48, 222); ctx.lineTo(W - 16, 208); ctx.lineTo(W - 16, 254); ctx.fill(); ctx.fillStyle = '#4e2f18'; ctx.fillRect(W - 73, 156, 6, 98); ctx.fillRect(W - 124, 202, 108, 6);
    // étagères de droite : grandes planches debout (motifs) puis casques / gants / bottes, à l'échelle réelle
    const rx = 880, rw = 230;
    shelf(rx, 300, rw); shelf(rx, 455, rw);
    SK.BOARDS.slice(0, 3).forEach((b, i) => S.drawItem(ctx, { kind: 'board', color: b.color, id: b.id }, rx + 42 + i * 74, 300 - 118, 50, 0, true));
    helmet(rx + 42, 455 - 40, 36, '#7e57c2'); S.drawItem(ctx, { kind: 'gear', id: 'gants', tint: '#e53935' }, rx + 118, 455 - 40, 30, t); S.drawItem(ctx, { kind: 'gear', id: 'bottes', tint: '#1e88e5' }, rx + 192, 455 - 44, 30, t);
    // grandes planches appuyées au mur entre le panneau et la vitrine
    SK.BOARDS.slice(3).forEach((b, i) => { ctx.save(); ctx.translate(330 + i * 34, floorY - 6); ctx.rotate(-0.14); S.drawItem(ctx, { kind: 'board', color: b.color, id: b.id }, 0, -112, 48, 0, true); ctx.restore(); });
    // vendeur (plus petit) puis comptoir par-dessus, gadgets posés sur le comptoir
    vendor(W - 130, floorY - 60, t, 0.72);
    ctx.fillStyle = '#6d4324'; ctx.fillRect(W - 320, floorY - 140, 320, 140); ctx.fillStyle = '#8a5533'; ctx.fillRect(W - 330, floorY - 148, 330, 14); ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let k = 0; k < 3; k++) ctx.fillRect(W - 310 + k * 102, floorY - 122, 92, 104);
    SK.GEAR.filter(gr => gr.cat === 'gadget').forEach((gr, i) => S.drawItem(ctx, { kind: 'gear', id: gr.id }, W - 285 + i * 64, floorY - 176, 24, t));
    ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(W - 50, floorY - 170, 16, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(W - 50, floorY - 170, 10, 0, TAU); ctx.fill(); ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(W - 50, floorY - 170, 4, 0, TAU); ctx.fill();
    // objets au sol à gauche
    ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(70, H * 0.92, 18, 0, TAU); ctx.fill(); ctx.fillStyle = '#78909c'; ctx.beginPath(); ctx.arc(120, H * 0.94, 20, 0, TAU); ctx.fill();
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function shelf(x, y, w) { ctx.fillStyle = '#5d3a1f'; ctx.fillRect(x, y, w, 14); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + 14, w, 8); ctx.fillStyle = '#5d3a1f'; ctx.fillRect(x + 10, y + 14, 10, 18); ctx.fillRect(x + w - 20, y + 14, 10, 18); }
  function helmet(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.lineTo(x + r, y + r * 0.3); ctx.lineTo(x - r, y + r * 0.3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = '#263238'; ctx.fillRect(x - r, y + r * 0.1, 2 * r, r * 0.25); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x - r * 0.1, y - r, r * 0.2, r); }
  // le vendeur : chapeau mou violet, lunettes de ski sur le chapeau, lunettes de soleil, grand sourire, veste turquoise, main ouverte vers la vitrine
  function vendor(x, y, t, k) {
    const bob = Math.sin(t * 2) * 3, wave = Math.sin(t * 3) * 0.12;
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(k || 1, k || 1);
    // corps
    ctx.fillStyle = '#00897b'; roundRect(-80, -190, 160, 230, 36); ctx.fill();
    ctx.fillStyle = '#00695c'; ctx.fillRect(-6, -170, 12, 200);
    ctx.fillStyle = '#e0f2f1'; ctx.beginPath(); ctx.moveTo(-40, -190); ctx.lineTo(0, -150); ctx.lineTo(40, -190); ctx.closePath(); ctx.fill();
    // bras droit (vers la gauche de l'écran), main ouverte paume en l'air
    ctx.strokeStyle = '#00897b'; ctx.lineWidth = 34; ctx.lineCap = 'round';
    ctx.save(); ctx.translate(-70, -150); ctx.rotate(wave); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-70, 60); ctx.lineTo(-150, 40); ctx.stroke();
    ctx.fillStyle = '#f3c9a3'; ctx.beginPath(); ctx.ellipse(-168, 36, 26, 20, -0.3, 0, TAU); ctx.fill();
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(-176 - k * 3 + (k % 2) * 6, 20 - k * 8, 7, 14, -0.9 + k * 0.25, 0, TAU); ctx.fill(); }
    ctx.restore();
    // bras gauche posé sur le comptoir
    ctx.beginPath(); ctx.moveTo(70, -150); ctx.lineTo(110, -60); ctx.stroke(); ctx.fillStyle = '#f3c9a3'; ctx.beginPath(); ctx.arc(112, -52, 20, 0, TAU); ctx.fill();
    // cou et tête
    ctx.fillStyle = '#f3c9a3'; ctx.fillRect(-18, -215, 36, 30); ctx.beginPath(); ctx.ellipse(0, -255, 62, 66, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e0a98a'; ctx.beginPath(); ctx.ellipse(44, -248, 14, 10, 0.3, 0, TAU); ctx.fill(); // nez
    // grand sourire avec dents
    ctx.fillStyle = '#5d1a1a'; ctx.beginPath(); ctx.moveTo(-36, -230); ctx.quadraticCurveTo(4, -170, 44, -230); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-32, -229); ctx.lineTo(40, -229); ctx.lineTo(36, -217); ctx.lineTo(-28, -217); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ef9a9a'; ctx.beginPath(); ctx.ellipse(4, -192, 18, 8, 0, 0, Math.PI); ctx.fill();
    // lunettes de soleil arc-en-ciel
    const lg = ctx.createLinearGradient(-50, -280, 50, -250); lg.addColorStop(0, '#e040fb'); lg.addColorStop(0.5, '#40c4ff'); lg.addColorStop(1, '#69f0ae');
    ctx.fillStyle = '#263238'; roundRect(-56, -284, 112, 34, 10); ctx.fill(); ctx.fillStyle = lg; roundRect(-50, -279, 44, 24, 8); ctx.fill(); roundRect(6, -279, 44, 24, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-44, -275, 16, 5); ctx.fillRect(12, -275, 16, 5);
    // chapeau mou violet, bande rose, lunettes de ski posées dessus
    ctx.fillStyle = '#7b1fa2'; ctx.beginPath(); ctx.ellipse(6, -300, 108, 24, 0.05, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8e24aa'; ctx.beginPath(); ctx.moveTo(-62, -302); ctx.quadraticCurveTo(-70, -380, -20, -392); ctx.quadraticCurveTo(40, -400, 70, -370); ctx.quadraticCurveTo(100, -340, 72, -300); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ec407a'; ctx.beginPath(); ctx.moveTo(-64, -312); ctx.quadraticCurveTo(6, -332, 74, -312); ctx.lineTo(74, -300); ctx.quadraticCurveTo(6, -318, -64, -300); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff8f00'; roundRect(-44, -346, 92, 26, 10); ctx.fill(); ctx.fillStyle = '#40c4ff'; roundRect(-39, -342, 38, 18, 7); ctx.fill(); roundRect(5, -342, 38, 18, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-34, -339, 14, 4); ctx.fillRect(10, -339, 14, 4);
    ctx.restore();
  }

  // ------------------------------------------------------------------ icônes des articles (vitrine, vignettes, étagères)
  S.drawItem = function (c, it, x, y, s, t, standing) {
    c.save(); c.translate(x, y);
    const id = it.kind === 'up' ? 'up-' + it.stat : it.kind === 'board' ? 'board' : it.id;
    const tint = it.tint || '#1e88e5';
    const rr2 = (xx, yy, w, h, r) => { c.beginPath(); c.moveTo(xx + r, yy); c.arcTo(xx + w, yy, xx + w, yy + h, r); c.arcTo(xx + w, yy + h, xx, yy + h, r); c.arcTo(xx, yy + h, xx, yy, r); c.arcTo(xx, yy, xx + w, yy, r); c.closePath(); };
    switch (id) {
      case 'board': {
        c.rotate(standing ? 0 : -0.6); const col = it.color || '#4caf50', bid = it.id;
        c.fillStyle = col; rr2(-s * 0.36, -s * 1.15, s * 0.72, s * 2.3, s * 0.36); c.fill();
        c.save(); rr2(-s * 0.36, -s * 1.15, s * 0.72, s * 2.3, s * 0.36); c.clip();
        if (bid === 'fusee') { c.fillStyle = '#ffab00'; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-s * 0.3 + k * s * 0.25, s * 1.1); c.quadraticCurveTo(-s * 0.1 + k * s * 0.25, s * 0.2 - k * s * 0.3, -s * 0.2 + k * s * 0.25, -s * 0.5 - k * s * 0.25); c.quadraticCurveTo(-s * 0.05 + k * s * 0.25, s * 0.3, s * 0.1 + k * s * 0.25, s * 1.1); c.fill(); } c.fillStyle = '#fff176'; c.beginPath(); c.moveTo(-s * 0.1, s * 1.1); c.quadraticCurveTo(0, 0.2 * s, -s * 0.05, -s * 0.2); c.quadraticCurveTo(0.05 * s, 0.4 * s, s * 0.12, s * 1.1); c.fill(); }
        else if (bid === 'virage') { c.strokeStyle = '#fff'; c.lineWidth = s * 0.14; c.beginPath(); for (let k = -4; k <= 4; k++) c.lineTo((k % 2 ? -1 : 1) * s * 0.22, k * s * 0.26); c.stroke(); }
        else if (bid === 'acrobate') { c.fillStyle = '#fff'; for (let k = -2; k <= 2; k++) star(c, (k % 2 ? -1 : 1) * s * 0.12, k * s * 0.42, s * 0.14); }
        else if (bid === 'alpine') { c.fillStyle = '#b0bec5'; c.beginPath(); c.moveTo(-s * 0.4, -s * 1.2); c.lineTo(s * 0.4, -s * 0.4); c.lineTo(s * 0.4, s * 0.2); c.lineTo(-s * 0.4, -s * 0.6); c.fill(); c.fillStyle = '#263238'; c.fillRect(-s * 0.4, s * 0.5, s * 0.8, s * 0.1); }
        else if (bid === 'pro') { c.fillStyle = '#ff4081'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-s * 0.4, k * s * 0.4); c.lineTo(s * 0.4, k * s * 0.4 - s * 0.5); c.lineTo(s * 0.4, k * s * 0.4 - s * 0.3); c.lineTo(-s * 0.4, k * s * 0.4 + s * 0.2); c.fill(); } }
        else if (bid === 'doree') { c.fillStyle = '#fff8e1'; for (let k = -2; k <= 2; k++) star(c, (k % 2 ? 0.15 : -0.12) * s, k * s * 0.4, s * 0.1); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(-s * 0.3, -s * 1.2, s * 0.1, s * 2.4); }
        else { c.fillStyle = 'rgba(255,255,255,0.45)'; for (let k = -2; k <= 2; k++) c.fillRect(-s * 0.4, k * s * 0.42 - s * 0.05, s * 0.8, s * 0.1); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(-s * 0.08, -s * 1.2, s * 0.16, s * 2.4); }
        c.restore();
        c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = Math.max(1, s * 0.05); rr2(-s * 0.36, -s * 1.15, s * 0.72, s * 2.3, s * 0.36); c.stroke();
        c.fillStyle = '#263238'; rr2(-s * 0.3, -s * 0.62, s * 0.6, s * 0.16, s * 0.05); c.fill(); rr2(-s * 0.3, s * 0.42, s * 0.6, s * 0.16, s * 0.05); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.35)'; rr2(-s * 0.28, -s * 1.05, s * 0.12, s * 2.1, s * 0.06); c.fill(); break; }
      case 'casque': { c.fillStyle = '#7e57c2'; c.beginPath(); c.arc(0, 0, s, Math.PI, 0); c.lineTo(s, s * 0.35); c.lineTo(-s, s * 0.35); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(-s * 0.35, -s * 0.35, s * 0.28, 0, TAU); c.fill(); c.fillStyle = '#263238'; c.fillRect(-s, s * 0.1, 2 * s, s * 0.28); c.fillStyle = '#ffd54a'; c.fillRect(-s * 0.1, -s * 0.9, s * 0.2, s); break; }
      case 'gants': { c.fillStyle = tint; rr2(-s * 0.9, -s * 0.5, s * 0.8, s * 1.3, s * 0.3); c.fill(); rr2(s * 0.1, -s * 0.5, s * 0.8, s * 1.3, s * 0.3); c.fill(); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-s * 0.9, s * 0.5, s * 0.8, s * 0.3); c.fillRect(s * 0.1, s * 0.5, s * 0.8, s * 0.3); c.fillStyle = tint; rr2(-s * 1.1, -s * 0.3, s * 0.35, s * 0.6, s * 0.15); c.fill(); rr2(s * 0.75, -s * 0.3, s * 0.35, s * 0.6, s * 0.15); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = s * 0.06; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-s * 0.75 + k * s * 0.25, -s * 0.5); c.lineTo(-s * 0.75 + k * s * 0.25, s * 0.1); c.moveTo(s * 0.25 + k * s * 0.25, -s * 0.5); c.lineTo(s * 0.25 + k * s * 0.25, s * 0.1); c.stroke(); } break; }
      case 'bottes': { c.fillStyle = tint; rr2(-s * 0.9, -s * 0.9, s * 0.7, s * 1.5, s * 0.2); c.fill(); rr2(s * 0.2, -s * 0.9, s * 0.7, s * 1.5, s * 0.2); c.fill(); c.fillStyle = '#263238'; rr2(-s * 1.0, s * 0.4, s * 0.95, s * 0.45, s * 0.15); c.fill(); rr2(s * 0.1, s * 0.4, s * 0.95, s * 0.45, s * 0.15); c.fill(); c.fillStyle = '#ffd54a'; c.fillRect(-s * 0.8, -s * 0.6, s * 0.5, s * 0.1); c.fillRect(s * 0.3, -s * 0.6, s * 0.5, s * 0.1); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(-s * 0.8, -s * 0.3, s * 0.5, s * 0.08); c.fillRect(s * 0.3, -s * 0.3, s * 0.5, s * 0.08); break; }
      case 'lunettes': { c.fillStyle = '#ff8f00'; rr2(-s * 1.1, -s * 0.45, s * 2.2, s * 0.9, s * 0.3); c.fill(); c.fillStyle = '#40c4ff'; rr2(-s * 0.95, -s * 0.3, s * 0.85, s * 0.6, s * 0.2); c.fill(); rr2(s * 0.1, -s * 0.3, s * 0.85, s * 0.6, s * 0.2); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(-s * 0.85, -s * 0.2, s * 0.3, s * 0.12); c.fillRect(s * 0.2, -s * 0.2, s * 0.3, s * 0.12); c.fillStyle = '#ff8f00'; c.fillRect(-s * 1.4, -s * 0.15, s * 0.3, s * 0.3); c.fillRect(s * 1.1, -s * 0.15, s * 0.3, s * 0.3); break; }
      case 'veste': { c.fillStyle = '#e53935'; rr2(-s * 0.8, -s * 0.9, s * 1.6, s * 1.8, s * 0.3); c.fill(); c.fillStyle = '#b71c1c'; c.fillRect(-s * 0.08, -s * 0.9, s * 0.16, s * 1.8); c.fillStyle = '#e53935'; rr2(-s * 1.2, -s * 0.8, s * 0.4, s * 1.1, s * 0.15); c.fill(); rr2(s * 0.8, -s * 0.8, s * 0.4, s * 1.1, s * 0.15); c.fill(); c.fillStyle = '#fff'; for (let k = 0; k < 3; k++) c.fillRect(-s * 0.7, -s * 0.5 + k * s * 0.5, s * 1.4, s * 0.08); break; }
      case 'portemonnaie': { c.fillStyle = '#6d4c41'; rr2(-s, -s * 0.7, s * 2, s * 1.4, s * 0.25); c.fill(); c.fillStyle = '#8d6e63'; rr2(-s, -s * 0.7, s * 2, s * 0.5, s * 0.25); c.fill(); c.fillStyle = '#ffd54a'; c.beginPath(); c.arc(s * 0.55, s * 0.1, s * 0.22, 0, TAU); c.fill(); SK.drawGoldCoin(c, -s * 0.4, -s * 0.9, s * 0.4); break; }
      case 'aimant': { c.strokeStyle = '#e53935'; c.lineWidth = s * 0.5; c.lineCap = 'butt'; c.beginPath(); c.arc(0, -s * 0.1, s * 0.7, Math.PI, 0); c.stroke(); c.fillStyle = '#e53935'; c.fillRect(-s * 0.95, -s * 0.1, s * 0.5, s * 0.8); c.fillRect(s * 0.45, -s * 0.1, s * 0.5, s * 0.8); c.fillStyle = '#eceff1'; c.fillRect(-s * 0.95, s * 0.35, s * 0.5, s * 0.35); c.fillRect(s * 0.45, s * 0.35, s * 0.5, s * 0.35); SK.drawGoldCoin(c, 0, s * 0.95, s * 0.28); break; }
      case 'fusee': { c.fillStyle = '#eceff1'; rr2(-s * 0.35, -s * 1.1, s * 0.7, s * 1.7, s * 0.3); c.fill(); c.fillStyle = '#e53935'; c.beginPath(); c.moveTo(-s * 0.35, -s * 0.9); c.lineTo(0, -s * 1.4); c.lineTo(s * 0.35, -s * 0.9); c.fill(); c.beginPath(); c.moveTo(-s * 0.35, s * 0.2); c.lineTo(-s * 0.75, s * 0.7); c.lineTo(-s * 0.35, s * 0.6); c.fill(); c.beginPath(); c.moveTo(s * 0.35, s * 0.2); c.lineTo(s * 0.75, s * 0.7); c.lineTo(s * 0.35, s * 0.6); c.fill(); c.fillStyle = '#40c4ff'; c.beginPath(); c.arc(0, -s * 0.5, s * 0.18, 0, TAU); c.fill(); c.fillStyle = '#ffab00'; c.beginPath(); c.moveTo(-s * 0.25, s * 0.6); c.lineTo(0, s * 1.2 + Math.sin((t || 0) * 20) * s * 0.1); c.lineTo(s * 0.25, s * 0.6); c.fill(); break; }
      case 'sac': { c.fillStyle = '#1e88e5'; rr2(-s * 0.8, -s * 0.7, s * 1.6, s * 1.6, s * 0.3); c.fill(); c.fillStyle = '#1565c0'; rr2(-s * 0.6, -s * 0.1, s * 1.2, s * 0.8, s * 0.2); c.fill(); c.strokeStyle = '#1565c0'; c.lineWidth = s * 0.18; c.beginPath(); c.arc(0, -s * 0.7, s * 0.45, Math.PI, 0); c.stroke(); c.fillStyle = '#fff'; c.font = 'bold ' + s * 0.8 + 'px sans-serif'; c.textAlign = 'center'; c.fillText('?', 0, s * 0.55); break; }
      case 'vip': { c.rotate(-0.15); c.fillStyle = '#ffd54a'; rr2(-s * 1.2, -s * 0.75, s * 2.4, s * 1.5, s * 0.2); c.fill(); c.fillStyle = '#263238'; c.fillRect(-s * 1.2, -s * 0.45, s * 2.4, s * 0.3); c.fillStyle = '#b8720c'; c.font = '900 ' + s * 0.7 + 'px sans-serif'; c.textAlign = 'center'; c.fillText('VIP', 0, s * 0.5); break; }
      case 'masque': { c.fillStyle = '#212121'; c.beginPath(); c.arc(0, 0, s, 0, TAU); c.fill(); c.fillStyle = '#f3c9a3'; rr2(-s * 0.75, -s * 0.3, s * 1.5, s * 0.45, s * 0.2); c.fill(); c.fillStyle = '#263238'; c.beginPath(); c.arc(-s * 0.3, -s * 0.08, s * 0.1, 0, TAU); c.arc(s * 0.3, -s * 0.08, s * 0.1, 0, TAU); c.fill(); c.fillStyle = '#d32f2f'; c.fillRect(-s, -s * 0.38, s * 2, s * 0.12); c.beginPath(); c.moveTo(s * 0.9, -s * 0.3); c.lineTo(s * 1.6, -s * 0.1); c.lineTo(s * 1.0, -s * 0.15); c.fill(); break; }
      case 'up-speed': case 'up-corner': case 'up-trick': { const col = id === 'up-speed' ? '#4fc3f7' : id === 'up-corner' ? '#69f0ae' : '#ffd54a'; c.fillStyle = it.color || '#4caf50'; rr2(-s * 0.3, -s * 0.2, s * 0.6, s * 1.3, s * 0.3); c.fill(); c.fillStyle = col; c.beginPath(); c.moveTo(0, -s * 1.2); c.lineTo(s * 0.8, -s * 0.3); c.lineTo(s * 0.35, -s * 0.3); c.lineTo(s * 0.35, s * 0.3); c.lineTo(-s * 0.35, s * 0.3); c.lineTo(-s * 0.35, -s * 0.3); c.lineTo(-s * 0.8, -s * 0.3); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.font = '900 ' + s * 0.5 + 'px sans-serif'; c.textAlign = 'center'; c.fillText(id === 'up-speed' ? '⚡' : id === 'up-corner' ? '↻' : '★', 0, s * 0.95); break; }
      default: { c.fillStyle = '#9e9e9e'; c.beginPath(); c.arc(0, 0, s * 0.8, 0, TAU); c.fill(); }
    }
    c.restore();
  };
  function star(c, x, y, r) { c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }
})(window.SK);
