// Goblin Malin — la grande trouvaille : quand le chef prend le parchemin d'un piédestal, il le brandit à bout de bras, face à nous, et une colonne de lumière jaillit vers le ciel.
'use strict';
(function (CG) {
  const G = CG.G, Tv = CG.Trouve = { DUR: 3.6, POP: 0.8 }, TAU = Math.PI * 2;
  Tv.play = function (icon, cb, ids) { const R = CG.R, p = CG.S.player; if (R.trouve) return false; R.trouve = { t: 0, icon: icon || '📜', cb, x: p.x, y: p.y, ids: ids || null, avant: Object.keys(p.scrolls || {}) }; R.dir = { x: 0, y: 1 }; CG.keys.clear(); CG.sfx('spell'); return true; };
  // le piédestal : la scène d'abord, le parchemin au moment où il le lève
  const take0 = CG.Autels.take;
  CG.Autels.take = function (a) { if (!a || a.st !== 'ouvert' || CG.R.trouve) return; Tv.play('📜', () => take0.call(CG.Autels, a)); };
  const hp0 = G.hurtPlayer; G.hurtPlayer = function () { if (CG.R.trouve) return; return hp0.apply(this, arguments); }; // rien ne le blesse pendant qu'il savoure
  const up0 = G.update;
  G.update = function (dt) {
    const R0 = CG.R, f = R0 && R0.trouve;
    if (f) { CG.keys.clear(); R0.dir = { x: 0, y: 1 }; const p = CG.S.player; p.moving = false; p.x = f.x; p.y = f.y; }
    up0.apply(this, arguments); if (!f) return; const R = CG.R, p = CG.S.player;
    f.t += dt; p.x = f.x; p.y = f.y; p.moving = false; R.dir = { x: 0, y: 1 };
    if (!f.done && f.t >= Tv.POP) { f.done = true; if (f.cb) f.cb(); annoncer(f); CG.sfx('discovery'); for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 60, r: 110 + i * 80, life: 0.55 + i * 0.18, col: i % 2 ? '#ffffff' : '#ffe36b' }); G.puff(p.x, p.y - 96, '#ffe36b', 36, 240, 5); S_goblins(p); }
    if (Math.random() < dt * 26) R.parts.push({ x: p.x + (Math.random() - 0.5) * 70, y: p.y - 20 - Math.random() * 60, vx: (Math.random() - 0.5) * 20, vy: -90 - Math.random() * 120, life: 0.9, max: 0.9, col: Math.random() < 0.5 ? '#ffe36b' : '#ffffff', size: 2.5 + Math.random() * 2.5, float: true });
    if (f.txt && f.el) { const n = Math.max(0, Math.min(f.txt.length, Math.floor((f.t - f.t0) * Tv.LETTRES))); if (n !== f.vu) { f.vu = n; f.el.querySelector('p').textContent = f.txt.slice(0, n); if (n < f.txt.length && n % 3 === 0) CG.sfx('click'); } f.el.style.opacity = Math.max(0, Math.min(1, (f.t - f.t0 + 0.3) / 0.3, (f.dur - f.t) / 0.5)); }
    if (f.t >= (f.dur || Tv.DUR)) { R.trouve = null; fermer(); }
  };
  // ---------- le nom du sort en grosses lettres, et ce qu'il fait, écrit lettre par lettre ----------
  Tv.LETTRES = 34; Tv.LIRE = 2.6; // lettres par seconde ; secondes pour relire une fois tout écrit
  { const css = document.createElement('style'); css.textContent = '#tv-sort{position:fixed;left:50%;top:58vh;transform:translateX(-50%);width:min(760px,92vw);z-index:60;text-align:center;pointer-events:none;font-family:"Trebuchet MS",system-ui,sans-serif;opacity:0}'
    + '#tv-sort small{display:block;font-size:15px;letter-spacing:3px;text-transform:uppercase;color:#ffe9a8;text-shadow:0 2px 3px #000}'
    + '#tv-sort b{display:block;margin:2px 0 10px;font-size:clamp(34px,5.4vw,58px);line-height:1.05;color:#ffe36b;text-shadow:0 3px 0 #7a4a08,0 5px 14px rgba(0,0,0,.85),0 0 26px rgba(255,220,110,.55)}'
    + '#tv-sort p{margin:0 auto;min-height:2.6em;font-size:clamp(17px,2.1vw,22px);line-height:1.3;color:#fff8e0;text-shadow:0 2px 3px #000,0 0 8px rgba(0,0,0,.9)}#tv-sort i{display:block;margin-top:8px;font-size:13px;font-style:normal;color:#e8dcc0;opacity:.75;text-shadow:0 1px 2px #000}';
    (document.head || document.documentElement).appendChild(css); }
  function fermer() { const el = document.getElementById('tv-sort'); if (el) el.remove(); }
  function annoncer(f) {
    const p = CG.S.player, sc = p.scrolls || {}, ids = (f.ids || Object.keys(sc).filter(id => sc[id] && !f.avant.includes(id))).filter(id => CG.SPELLS[id]); if (!ids.length) return;
    const sp = CG.SPELLS[ids[0]]; fermer(); const el = document.createElement('div'); el.id = 'tv-sort'; el.innerHTML = '<small></small><b></b><p></p><i>Espace ou Entrée pour passer</i>';
    el.querySelector('small').textContent = ids.length > 1 ? 'Nouveaux sorts (' + ids.length + ')' : 'Nouveau sort'; el.querySelector('b').textContent = sp.icon + ' ' + sp.nom + (ids.length > 1 ? ' …' : '');
    document.body.appendChild(el); f.el = el; f.txt = sp.desc || ''; f.t0 = f.t + 0.45; f.vu = -1; f.dur = Math.max(Tv.DUR, f.t0 + f.txt.length / Tv.LETTRES + Tv.LIRE);
  }
  window.addEventListener('keydown', e => { const f = CG.R && CG.R.trouve; if (!f || !f.txt || !(e.code === 'Space' || e.code === 'Enter')) return; const fin = f.t0 + f.txt.length / Tv.LETTRES; if (f.t < fin) f.t0 = f.t - f.txt.length / Tv.LETTRES - 0.01; else f.t = Math.max(f.t, f.dur - 0.5); }, true); // une pression : tout le texte ; une autre : on continue
  { const upF = G.update; G.update = function () { const r = upF.apply(this, arguments); if (!(CG.R && CG.R.trouve) && document.getElementById('tv-sort')) fermer(); return r; }; }
  function S_goblins(p) { CG.S.goblins.forEach(g => { if (!g.hidden && Math.hypot(g.x - p.x, g.y - p.y) < 420) g.emoteT = 2.5; }); }
  const force = f => { const a = Math.min(1, f.t / 0.5), z = Math.min(1, ((f.dur || Tv.DUR) - f.t) / 0.7); return Math.max(0, Math.min(a, z)); };
  // sous les personnages : le monde s'assombrit, le cercle au sol, les rayons et le halo de la colonne
  const gr0 = CG.Magie.ground;
  CG.Magie.ground = function (g, t) {
    gr0.apply(this, arguments); const f = CG.R.trouve; if (!f) return; const k = force(f), x = f.x, y = f.y, up = f.t >= Tv.POP ? Math.min(1, (f.t - Tv.POP) / 0.35) : 0;
    g.fillStyle = 'rgba(8,6,24,' + 0.55 * k + ')'; g.fillRect(x - 2200, y - 1600, 4400, 3200);
    g.save(); g.globalCompositeOperation = 'lighter';
    const gl = g.createRadialGradient(x, y - 50, 10, x, y - 50, 260); gl.addColorStop(0, 'rgba(255,230,140,' + 0.5 * k + ')'); gl.addColorStop(1, 'rgba(255,230,140,0)'); g.fillStyle = gl; g.fillRect(x - 270, y - 320, 540, 540);
    g.save(); g.translate(x, y - 74); g.rotate(f.t * 0.7); for (let i = 0; i < 14; i++) { g.rotate(TAU / 14); g.fillStyle = 'rgba(255,225,130,' + (i % 2 ? 0.2 : 0.1) * k * up + ')'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-26, -420); g.lineTo(26, -420); g.closePath(); g.fill(); } g.restore();
    const w = (70 + Math.sin(f.t * 9) * 8) * up, col = g.createLinearGradient(x - w, 0, x + w, 0); col.addColorStop(0, 'rgba(255,220,120,0)'); col.addColorStop(0.5, 'rgba(255,235,160,' + 0.55 * k + ')'); col.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = col; g.fillRect(x - w, y - 1500, w * 2, 1426);
    g.restore();
    g.save(); g.translate(x, y + 2); g.scale(1, 0.34); g.rotate(-f.t * 1.4); g.strokeStyle = 'rgba(255,227,107,' + 0.85 * k + ')'; g.lineWidth = 5; g.setLineDash([22, 12]); g.beginPath(); g.arc(0, 0, 62 + Math.sin(f.t * 5) * 4, 0, TAU); g.stroke(); g.setLineDash([6, 9]); g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 44, 0, TAU); g.stroke(); g.restore();
  };
  // par-dessus : le cœur de la colonne, l'objet brandi, les étincelles en spirale
  const mk0 = CG.Magie.marks;
  CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const f = CG.R.trouve; if (!f) return; const k = force(f), x = f.x, y = f.y, up = f.t >= Tv.POP ? Math.min(1, (f.t - Tv.POP) / 0.35) : 0;
    const r = Math.min(1, f.t / Tv.POP), e = r * r * (3 - 2 * r), iy = y - 34 - e * 40 - (up ? Math.sin(f.t * 3) * 3 : 0), sc = 0.6 + e * 0.9 + (f.t >= Tv.POP && f.t < Tv.POP + 0.25 ? Math.sin((f.t - Tv.POP) / 0.25 * Math.PI) * 0.5 : 0);
    g.save(); g.globalCompositeOperation = 'lighter';
    const w = (16 + Math.sin(f.t * 13) * 4) * up; g.fillStyle = 'rgba(255,255,235,' + 0.75 * k + ')'; g.fillRect(x - w / 2, y - 1500, w, 1500 + iy - y); g.fillStyle = 'rgba(255,240,170,' + 0.35 * k + ')'; g.fillRect(x - w * 1.4, y - 1500, w * 2.8, 1500 + iy - y);
    const gl = g.createRadialGradient(x, iy, 2, x, iy, 46); gl.addColorStop(0, 'rgba(255,255,230,' + 0.9 * k + ')'); gl.addColorStop(1, 'rgba(255,230,140,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, iy, 46, 0, TAU); g.fill();
    for (let i = 0; i < 16; i++) { const a = f.t * 3.2 + i * TAU / 8, h = ((f.t * 0.55 + i / 16) % 1), rad = 46 - h * 22; g.fillStyle = 'rgba(255,245,190,' + (1 - h) * k * up + ')'; g.beginPath(); g.arc(x + Math.cos(a) * rad, iy + 30 - h * 300 + Math.sin(a) * rad * 0.3, 2.6 * (1 - h) + 1, 0, TAU); g.fill(); }
    g.restore();
    g.save(); g.translate(x, iy); g.rotate(Math.sin(f.t * 2.2) * 0.08); g.scale(sc, sc); g.globalAlpha = Math.min(1, f.t / 0.2) * (f.t > (f.dur || Tv.DUR) - 0.5 ? Math.max(0, ((f.dur || Tv.DUR) - f.t) / 0.5) : 1); g.font = '30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(f.icon, 0, 0); g.restore();
  };
})(window.CG);
