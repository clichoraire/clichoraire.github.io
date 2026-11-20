// Clan Gobelin — barre de construction en bas de l'écran, placement à la souris (aperçu vert, grille, marteau, touche R).
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, D = CG.D, UI = CG.UI, Art = CG.Art, T = CG.TILE;
  const Bt = CG.Bt = { open: false, tab: 'terrain', page: 0, PAR: 9 };
  const $ = id => document.getElementById(id), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TABS = [['terrain', '🌱 Terrain'], ['defense', '🛡️ Défense'], ['vivres', '🪵 Ressources'], ['clan', '🏠 Habitations'], ['meca', '⚙️ Mécanismes'], ['magie', '✨ Magie']];
  const HAMMER = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44'><text x='2' y='34' font-size='32'>🔨</text></svg>\") 6 34, crosshair";
  const isFlat = type => !!(CG.BUILDS[type] && CG.BUILDS[type].flat);

  // ---------- image d'une construction (pour les vignettes et l'aperçu) ----------
  let sprites = {}, thumbs = {};
  function sprite(type) {
    if (sprites[type]) return sprites[type];
    const d = CG.BUILDS[type], c = document.createElement('canvas'), ax = 90, ay = 190; c.width = d.w * T + 180; c.height = d.h * T + 230;
    const g = c.getContext('2d'), b = { type, tx: 0, ty: 0, w: d.w, h: d.h, variant: 0 };
    g.translate(ax, ay);
    if (d.terrain) { g.fillStyle = d.terrain === 'path' ? '#a58a5c' : '#5aa844'; g.beginPath(); g.arc(T / 2, T / 2, 22, 0, 6.3); g.fill(); g.fillStyle = d.terrain === 'path' ? 'rgba(120,98,62,0.7)' : 'rgba(40,82,30,0.6)'; [[10, 14], [26, 24], [16, 30]].forEach(([x, y]) => g.fillRect(x, y, 4, 3)); }
    else if (isFlat(type)) Art.flats(g, [b], 0);
    else if (Art.extra[type]) Art.drawExtra(g, b, 0, false);
    else Art.building(g, b, 0, false);
    return (sprites[type] = { c, ax, ay });
  }
  function thumb(type) {
    if (thumbs[type]) return thumbs[type];
    const s = sprite(type), w = s.c.width, h = s.c.height, px = s.c.getContext('2d').getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (px[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0) return (thumbs[type] = '');
    const bw = x1 - x0 + 4, bh = y1 - y0 + 4, c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const k = Math.min(120 / bw, 120 / bh, 2.6), g = c.getContext('2d');
    g.drawImage(s.c, x0 - 2, y0 - 2, bw, bh, 64 - bw * k / 2, 124 - bh * k, bw * k, bh * k);
    return (thumbs[type] = c.toDataURL());
  }

  // ---------- la barre ----------
  /* tout ce qu'on sait bâtir dans l'onglet ; la barre en montre neuf à la fois, le reste est sur les pages suivantes */
  function tous() { return Object.keys(CG.BUILDS).filter(k => CG.BUILDS[k].cat === Bt.tab && G.buildUnlocked(k)); }
  function pages() { return Math.max(1, Math.ceil(tous().length / Bt.PAR)); }
  function items() { const n = pages(); if (Bt.page >= n) Bt.page = n - 1; if (Bt.page < 0) Bt.page = 0; return tous().slice(Bt.page * Bt.PAR, (Bt.page + 1) * Bt.PAR); }
  Bt.tourner = function (s) { const n = pages(); if (n < 2) return; Bt.page = (Bt.page + s + n) % n; CG.sfx('ok'); bulle(null); render(); };
  function render() {
    const S = CG.S, R = CG.R, el = $('buildbar'); if (!el) return;
    const sel = R.build && R.build.type, list = items(), np = pages(), d = sel && CG.BUILDS[sel];
    let h = '<div class="bb-tabs">' + TABS.map(t => { const n = Object.keys(CG.BUILDS).filter(k => CG.BUILDS[k].cat === t[0] && G.buildUnlocked(k)).length; return '<button data-bt="' + t[0] + '" class="' + (Bt.tab === t[0] ? 'on' : '') + (n ? '' : ' empty') + '">' + t[1] + '</button>'; }).join('') +
      '<button data-bb="demolir" class="tool' + (sel === 'demolir' ? ' on' : '') + '">🧨 Démolir</button><button data-bx="1" class="tool" title="Fermer (B)">✕</button></div><div class="bb-body">';
    if (np > 1) h += '<button class="bb-fl" data-pg="-1" title="Page précédente">◀</button>';
    if (!list.length) h += '<p class="bb-empty">Rien à bâtir ici pour l\'instant : apprends de nouvelles technologies (T).</p>';
    list.forEach((k, i) => {
      const b = CG.BUILDS[k], can = G.canPay(b.cout), img = thumb(k);
      h += '<button class="bb-card' + (sel === k ? ' on' : '') + (can ? '' : ' poor') + '" data-bb="' + k + '"><i>' + (i + 1) + '</i>' + (img ? '<img src="' + img + '" alt="">' : '<span class="em">' + b.icon + '</span>') + '<b>' + esc(b.nom) + '</b><small>' + Object.keys(b.cout).map(r => '<span class="' + (S.res[r] < b.cout[r] ? 'lack' : '') + '">' + CG.RES[r].icon + ' ' + b.cout[r] + '</span>').join(' ') + '</small></button>';
    });
    if (np > 1) h += '<button class="bb-fl" data-pg="1" title="Page suivante">▶<small>' + (Bt.page + 1) + '/' + np + '</small></button>';
    h += '</div>'; // plus de bandeau de description : elle s'affiche en bulle quand la souris passe sur une carte (voir bulle())
    el.innerHTML = h; Bt.key = stateKey();
    el.querySelectorAll('[data-bt]').forEach(b => b.onclick = () => { Bt.tab = b.dataset.bt; Bt.page = 0; CG.sfx('ok'); render(); });
    el.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => Bt.tourner(+b.dataset.pg));
    el.querySelectorAll('[data-bb]').forEach(b => b.onclick = () => Bt.pick(b.dataset.bb));
    el.querySelector('[data-bx]').onclick = () => Bt.toggle(false);
    if (!el.dataset.bulle) { el.dataset.bulle = '1'; el.addEventListener('pointerover', ev => bulle(ev.target.closest('[data-bb]'))); el.addEventListener('pointerleave', () => bulle(null)); el.addEventListener('wheel', ev => { ev.preventDefault(); const m = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY; if (Math.abs(m) < 8 || performance.now() - (Bt.roule || 0) < 260) return; Bt.roule = performance.now(); Bt.tourner(m > 0 ? 1 : -1); }, { passive: false }); }
    if (tipK) bulle(el.querySelector('[data-bb="' + tipK + '"]')); // la barre vient d'être redessinée : la bulle suit la carte encore survolée
  }
  // la description, en bulle au-dessus de la carte survolée
  let tip = null, tipK = null;
  function bulle(b) {
    if (!b || !Bt.open) { tipK = null; if (tip) tip.style.display = 'none'; return; }
    const k = b.dataset.bb, d = CG.BUILDS[k]; tipK = k;
    if (!tip) { tip = document.createElement('div'); tip.id = 'bb-tip'; tip.style.cssText = 'position:fixed;z-index:60;pointer-events:none;max-width:340px;padding:8px 14px 9px;border-radius:10px;background:rgba(24,16,8,.96);border:2px solid #7a5a34;box-shadow:0 8px 22px rgba(0,0,0,.55);font:13.5px/1.35 "Trebuchet MS",system-ui,sans-serif;color:#f0e4c8;text-align:center'; document.body.appendChild(tip); }
    tip.innerHTML = k === 'demolir' ? '<b style="display:block;color:#ff9a7a;margin-bottom:2px">🧨 Démolir</b>Clique sur une construction pour la retirer (la moitié du prix est rendue). Les huttes, la réserve et le feu restent en place.' : d ? '<b style="display:block;color:#ffe36b;margin-bottom:2px">' + d.icon + ' ' + esc(d.nom) + '</b>' + esc(d.desc) : '';
    if (!tip.innerHTML) { tip.style.display = 'none'; return; }
    tip.style.display = 'block'; const r = b.getBoundingClientRect(); tip.style.left = Math.max(8, Math.min(window.innerWidth - tip.offsetWidth - 8, r.left + r.width / 2 - tip.offsetWidth / 2)) + 'px'; tip.style.top = Math.max(8, r.top - tip.offsetHeight - 10) + 'px';
  }
  const stateKey = () => { const S = CG.S, R = CG.R; return Bt.tab + '|' + Bt.page + '|' + (R.build ? R.build.type : '') + '|' + ['food', 'bois', 'minerai', 'cuir', 'or'].map(r => Math.floor(S.res[r])).join(',') + '|' + Object.keys(S.tech.owned).length; };
  Bt.pick = function (type) {
    const R = CG.R; if (R.build && R.build.type === type) { R.build = null; render(); return; }
    R.build = { type, rot: 0 }; CG.sfx('ok'); render();
  };
  Bt.key1 = function (n) { const k = items()[n - 1]; if (k) Bt.pick(k); };
  Bt.toggle = function (on) {
    if (!CG.S || !CG.running) return; if (UI.modal) { if (!UI.modal.closable) return; UI.close(); }
    Bt.open = on === undefined ? !Bt.open : on; sprites = {}; thumbs = {};
    document.body.classList.toggle('building', Bt.open); $('buildbar').hidden = !Bt.open; if (!Bt.open) bulle(null);
    if (!Bt.open) CG.R.build = null; else { if (!items().length) Bt.page = 0, Bt.tab = (TABS.find(t => Object.keys(CG.BUILDS).some(k => CG.BUILDS[k].cat === t[0] && G.buildUnlocked(k))) || TABS[0])[0]; render(); }
    CG.sfx('ok');
  };
  Bt.rotate = function () { const b = CG.R.build; if (b && b.type !== 'demolir') { b.rot = (b.rot + 1) % 2; CG.sfx('swing'); } };
  // appelé à chaque image : la barre suit les ressources, le curseur devient un marteau
  Bt.tick = function () {
    const R = CG.R, cv = $('game'); if (!R) return;
    const cur = R.build ? HAMMER : ''; if (cv && Bt.cur !== cur) { Bt.cur = cur; cv.style.cursor = cur; }
    if (Bt.open && UI.modal && UI.modal.pauses) return;
    if (Bt.open && Bt.key !== stateKey()) render();
  };

  // ---------- où l'on bâtit : sous la souris ----------
  const spot0 = D.buildSpot;
  D.buildSpot = function () {
    const S = CG.S, R = CG.R, m = R.mouse; if (!m) return spot0();
    const type = R.build.type, dem = type === 'demolir', b = dem ? { w: 1, h: 1, cout: {} } : CG.BUILDS[type];
    const wx = m.x + R.cam.x, wy = m.y + R.cam.y, tx = Math.round(wx / T - b.w / 2), ty = Math.round(wy / T - b.h / 2);
    if (dem) { const t = G.buildingAt(Math.floor(wx / T), Math.floor(wy / T)); return G.canDemolish(t) ? { tx: t.tx, ty: t.ty, w: t.w, h: t.h, ok: true, target: t } : { tx: Math.floor(wx / T), ty: Math.floor(wy / T), w: 1, h: 1, ok: false }; }
    if (b.terrain) return { tx, ty, w: 1, h: 1, ok: W.terrainOk(tx, ty, b.terrain) && G.canPay(b.cout) };
    let ok = W.canBuild(tx, ty, b.w, b.h, b.on) && G.canPay(b.cout);
    const px = Math.floor(S.player.x / T), py = Math.floor(S.player.y / T); if (ok && px >= tx && px < tx + b.w && py >= ty && py < ty + b.h) ok = false;
    return { tx, ty, w: b.w, h: b.h, ok };
  };
  const place0 = D.placeBuild;
  D.placeBuild = function () {
    const R = CG.R, S = CG.S, n = S.buildings.length, flip = R.build && R.build.rot === 1;
    place0();
    if (S.buildings.length > n && S.buildings[S.buildings.length - 1].type === 'pont') S.buildings[S.buildings.length - 1].ori = flip ? 'h' : 'v'; // le pont : R choisit le sens des planches, pas un miroir
    else if (flip && S.buildings.length > n) S.buildings[S.buildings.length - 1].flip = true;
    if (S.buildings.length > n && CG.BUILDS[S.buildings[S.buildings.length - 1].type].barrier) S.goblins.concat(R.visitors, S.pets, R.enemies).forEach(e => { if (!e.struct) G.unstick(e, 8); }); // personne ne reste pris dans la clôture
    if (Bt.open) render();
  };

  // ---------- l'aperçu : grille blanche, construction en vert translucide, étiquette du coût ----------
  let tintKey = '', tintC = null;
  function tinted(type, ok) {
    const key = type + (ok ? '1' : '0'); if (tintKey === key && tintC) return tintC;
    const s = sprite(type), c = document.createElement('canvas'); c.width = s.c.width; c.height = s.c.height; const g = c.getContext('2d');
    g.drawImage(s.c, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = ok ? 'rgba(90,255,120,0.62)' : 'rgba(255,80,60,0.62)'; g.fillRect(0, 0, c.width, c.height);
    tintKey = key; return (tintC = c);
  }
  Bt.draw = function (ctx, t) {
    const S = CG.S, R = CG.R; if (!R.build) return;
    const sp = D.buildSpot(), type = R.build.type, dem = type === 'demolir', x = sp.tx * T, y = sp.ty * T, w = sp.w * T, h = sp.h * T, col = sp.ok ? '120,255,130' : '255,100,80';
    // petite grille blanche autour
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.42)'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 5]); ctx.beginPath();
    for (let i = -2; i <= sp.w + 2; i++) { ctx.moveTo(x + i * T, y - 2 * T); ctx.lineTo(x + i * T, y + h + 2 * T); }
    for (let j = -2; j <= sp.h + 2; j++) { ctx.moveTo(x - 2 * T, y + j * T); ctx.lineTo(x + w + 2 * T, y + j * T); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(' + col + ',0.28)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(' + col + ',0.95)'; ctx.lineWidth = 2.5; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    if (!dem) {
      const s = sprite(type), img = tinted(type, sp.ok); ctx.globalAlpha = 0.72 + Math.sin(t * 4) * 0.06;
      if (type === 'pont') { Art.flats(ctx, [{ type, tx: sp.tx, ty: sp.ty, w: 1, h: 1, ori: R.build.rot ? 'h' : 'v' }], t); ctx.globalAlpha = 1; }
      else { if (R.build.rot) { ctx.translate(2 * x + w, 0); ctx.scale(-1, 1); }
      ctx.drawImage(img, x - s.ax, y - s.ay); }
    }
    ctx.restore();
    // flèche de rotation au pied, et étiquette « Hutte - Coût : 20 »
    if (!dem) { ctx.strokeStyle = 'rgba(' + col + ',0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h + 6, w / 2 - 4, 9, 0, 0.25, Math.PI - 0.25); ctx.stroke(); const ax = x + w / 2 + (w / 2 - 4) * Math.cos(0.25) * (R.build.rot ? -1 : 1), ay = y + h + 8; ctx.fillStyle = 'rgba(' + col + ',0.9)'; ctx.beginPath(); ctx.moveTo(ax, ay - 8); ctx.lineTo(ax + (R.build.rot ? -9 : 9), ay + 1); ctx.lineTo(ax - (R.build.rot ? -7 : 7), ay + 6); ctx.closePath(); ctx.fill(); }
    const b = dem ? null : CG.BUILDS[type], parts = dem ? [] : Object.keys(b.cout).map(r => ({ txt: b.cout[r] + ' ' + CG.RES[r].icon, lack: S.res[r] < b.cout[r] }));
    const label = dem ? (sp.ok ? 'Démolir : ' + CG.BUILDS[sp.target.type].nom : 'Rien à démolir ici') : b.nom + ' - Coût : ';
    ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left';
    let tw = ctx.measureText(label).width; parts.forEach(p => { tw += ctx.measureText(p.txt).width + 8; });
    const bx = x + w + 16, by = y + h / 2 - 15;
    ctx.fillStyle = 'rgba(30,22,10,0.9)'; ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, tw + 20, 30, 8) : ctx.rect(bx, by, tw + 20, 30); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4ead0'; ctx.fillText(label, bx + 10, by + 20); let cx = bx + 10 + ctx.measureText(label).width;
    parts.forEach(p => { ctx.fillStyle = p.lack ? '#ff8a7a' : '#8dff8a'; ctx.fillText(p.txt, cx, by + 20); cx += ctx.measureText(p.txt).width + 8; });
  };
  // les constructions tournées (touche R) sont dessinées en miroir
  Bt.flipped = function (ctx, b, fn) { if (!b.flip) return fn(); ctx.save(); ctx.translate((2 * b.tx + b.w) * T, 0); ctx.scale(-1, 1); fn(); ctx.restore(); };

  // ---------- souris et bouton ----------
  window.addEventListener('load', () => {
    const cv = $('game'), bar = document.createElement('div'); bar.id = 'buildbar'; bar.hidden = true; $('hud').appendChild(bar);
    const pos = e => { const R = CG.R; if (R) R.mouse = { x: e.clientX / CG.viewScale(), y: e.clientY / CG.viewScale() }; };
    cv.addEventListener('mousemove', e => {
      pos(e); const R = CG.R; if (!R || !R.build || !(e.buttons & 1) || UI.modal) return;
      const d = CG.BUILDS[R.build.type]; if (!d || !d.repeat) return; // on glisse pour tracer clôtures, chemins, pièges...
      const sp = D.buildSpot(); if (sp.ok) D.placeBuild();
    });
    cv.addEventListener('contextmenu', e => { e.preventDefault(); if (CG.R && CG.R.build) { CG.R.build = null; if (Bt.open) render(); } });
    $('btn-build').onclick = () => Bt.toggle();
  });
})(window.CG);
