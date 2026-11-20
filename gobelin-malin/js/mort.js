// Goblin Malin — la mort du chef : ralenti, l'âme qui s'envole, l'iris qui se referme, puis l'écran Game Over. C'est définitif.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Mo = CG.Mort = {};
  Mo.SLOW = 0.3; Mo.END = 4.3;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp01 = v => Math.max(0, Math.min(1, v)), ease = k => k * k * (3 - 2 * k);
  const bounce = k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375; return n * (k -= 2.625 / d) * k + 0.984375; };
  const rise = t => t < 0.9 ? 0 : 18 + (t - 0.9) * 20 + Math.pow(t - 0.9, 2) * 5;

  G.die = function () {
    const S = CG.S, R = CG.R, p = S.player; if (R.death) return;
    p.hp = 0; R.ko = 1e9; R.death = { t: 0 }; R.build = null; CG.dead = true; CG.wipe(); // plus de sauvegarde : pas de retour en arrière
    if (UI.modal && !UI.modal.pauses) UI.close(); if (CG.Bt && CG.Bt.open) CG.Bt.toggle(false);
    if (typeof document !== 'undefined' && document.body) document.body.classList.add('mort');
    R.rings.push({ x: p.x, y: p.y - 10, r: 150, life: 0.6, col: '#ffffff' }); R.rings.push({ x: p.x, y: p.y - 10, r: 90, life: 0.45, col: '#ff5a4a' });
    G.puff(p.x, p.y - 16, '#ffffff', 26, 190, 4); G.puff(p.x, p.y - 16, '#ff5a4a', 16, 130, 4); CG.sfx('glas');
  };
  const up0 = G.update;
  G.update = function (dt) {
    up0(dt);
    const R = CG.R, d = R.death; if (!d || d.done) return;
    d.t += dt / Mo.SLOW; // en temps réel, même si le jeu tourne au ralenti
    const p = CG.S.player;
    if (d.t > 0.9 && Math.random() < dt / Mo.SLOW * 16) R.parts.push({ x: p.x + (Math.random() - 0.5) * 26, y: p.y - 10 - rise(d.t) - Math.random() * 30, vx: (Math.random() - 0.5) * 14, vy: -18 - Math.random() * 22, life: 0.35, max: 0.35, col: Math.random() < 0.5 ? '#eaffd8' : '#fff7c0', size: 2.5, float: true });
    if (d.t >= Mo.END) { d.done = true; UI.gameOver(true); }
  };

  // le chef tournoie, tombe, puis son âme monte doucement
  Mo.chief = function (g, p, t, drawChief) {
    const d = CG.R.death, k = clamp01(d.t / 0.75), b = bounce(k);
    g.save(); g.translate(p.x, p.y - 6 * b - Math.sin(k * Math.PI) * 16); g.rotate(1.45 * b + (1 - k) * Math.sin(d.t * 26) * 0.25);
    drawChief(g, { x: 0, y: 0, face: p.face || 1, moving: false, step: 0 }, 0, 1); g.restore();
    if (d.t > 0.9) {
      const a = clamp01((d.t - 0.9) / 0.7) * (1 - clamp01((d.t - 3.7) / 0.5)), sx = p.x + Math.sin(d.t * 2.4) * 7, sy = p.y - 4 - rise(d.t);
      const gl = g.createRadialGradient(sx, sy - 20, 2, sx, sy - 20, 44); gl.addColorStop(0, 'rgba(235,255,215,' + 0.55 * a + ')'); gl.addColorStop(1, 'rgba(235,255,215,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(sx, sy - 20, 44, 0, 6.3); g.fill();
      drawChief(g, { x: sx, y: sy, face: p.face || 1, moving: false, step: 0 }, d.t, 0.5 * a);
      g.strokeStyle = 'rgba(255,240,150,' + 0.9 * a + ')'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(sx, sy - 52 + Math.sin(d.t * 3) * 1.5, 11, 3.5, 0, 0, 6.3); g.stroke(); // auréole
    }
  };
  // par-dessus tout : éclair blanc, voile rouge sombre, puis l'iris noir qui se referme sur l'âme
  Mo.overlay = function (g, vw, vh, sx, sy) {
    const t = CG.R.death.t, a = clamp01(t / 1.3);
    if (t < 0.28) { g.fillStyle = 'rgba(255,255,255,' + (1 - t / 0.28) * 0.85 + ')'; g.fillRect(0, 0, vw, vh); }
    const big = Math.hypot(vw, vh), v = g.createRadialGradient(sx, sy - 24, 70, sx, sy - 24, big * 0.62);
    v.addColorStop(0, 'rgba(40,0,0,0)'); v.addColorStop(1, 'rgba(50,0,4,' + 0.82 * a + ')');
    g.fillStyle = v; g.fillRect(0, 0, vw, vh); g.fillStyle = 'rgba(8,0,10,' + 0.3 * a + ')'; g.fillRect(0, 0, vw, vh);
    if (t > 1.9) {
      const cy = sy - 26 - rise(t), r = t < 3.1 ? big - (big - 64) * ease(clamp01((t - 1.9) / 1.2)) : t < 3.6 ? 64 + Math.sin((t - 3.1) * 12) * 3 : 64 * (1 - ease(clamp01((t - 3.6) / 0.45)));
      g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, vw, vh); g.arc(sx, cy, Math.max(0, r), 0, 6.3, true); g.fill();
    }
  };

  // ---------- l'écran final : noir, une pierre tombale, GAME OVER, un seul bouton ----------
  UI.gameOver = function (chef) {
    const S = CG.S; CG.dead = true; CG.wipe(); if (document.getElementById('mort')) return;
    UI.close(); UI.modal = { name: 'over', closable: false, pauses: true }; document.body.classList.add('mort');
    const el = document.createElement('div'); el.id = 'mort';
    let br = ''; for (let i = 0; i < 26; i++) br += '<i style="left:' + (i * 37 % 100) + '%;width:' + (3 + i % 4) + 'px;height:' + (3 + i % 4) + 'px;animation-duration:' + (5 + i % 5 * 1.3) + 's;animation-delay:-' + (i * 0.83 % 7) + 's;--dx:' + ((i * 53 % 90) - 45) + 'px"></i>';
    const lettres = 'GAME OVER'.split('').map((c, i) => c === ' ' ? '<span class="sp"></span>' : '<span style="animation-delay:' + (1.1 + i * 0.13) + 's">' + c + '</span>').join('');
    const jours = S.day - 1, st = [['📅', S.day + (S.day > 1 ? ' jours' : ' jour')], ['⚔️', S.stats.kills + ' ennemi' + (S.stats.kills > 1 ? 's' : '') + ' vaincu' + (S.stats.kills > 1 ? 's' : '')], ['⭐', 'niveau ' + S.player.lvl], ['👥', S.goblins.length + ' gobelin' + (S.goblins.length > 1 ? 's' : '')]];
    el.innerHTML = '<div class="mo-glow"></div><div class="mo-braises">' + br + '</div><div class="mo-in">'
      + '<div class="mo-tombe"><svg viewBox="0 0 220 200" width="220" height="200"><ellipse cx="110" cy="182" rx="100" ry="14" fill="#1a2412"/><path d="M52 184 V84 Q52 24 110 24 Q168 24 168 84 V184Z" fill="#6f777c"/><path d="M52 184 V84 Q52 24 110 24 Q122 24 132 28 Q84 34 80 92 V184Z" fill="#878f94"/><path d="M150 60 L141 82 L152 96 L144 118" stroke="#4a5257" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M52 150 Q60 130 74 146 Q70 166 52 172Z" fill="#4f8a2c"/><path d="M168 160 Q156 146 146 162 Q152 178 168 178Z" fill="#3f7424"/>'
      + '<path d="M96 52 h28 v10 h-28z M105 42 h10 v40 h-10z" fill="#4a5257" opacity="0"/><text x="110" y="78" text-anchor="middle" font-size="19" font-weight="bold" fill="#3a4146" font-family="Trebuchet MS, sans-serif">Ci-gît</text><text x="110" y="108" text-anchor="middle" font-size="' + (S.name.length > 9 ? 19 : 25) + '" font-weight="bold" fill="#2a3035" font-family="Trebuchet MS, sans-serif">' + esc(chef ? S.name : 'le clan') + '</text><text x="110" y="134" text-anchor="middle" font-size="14" fill="#3a4146" font-family="Trebuchet MS, sans-serif">' + (chef ? 'chef gobelin' : 'de ' + esc(S.name)) + '</text><text x="110" y="154" text-anchor="middle" font-size="13" fill="#4a5257" font-family="Trebuchet MS, sans-serif">jour ' + S.day + '</text>'
      + [[30, 184, -18], [44, 186, 8], [176, 186, -8], [190, 184, 16], [70, 188, -4], [150, 188, 6]].map(b => '<path transform="translate(' + b[0] + ' ' + b[1] + ') rotate(' + b[2] + ')" d="M0 0 Q-2 -16 3 -24 Q5 -12 6 0Z" fill="#3f7424"/>').join('') + '</svg></div>'
      + '<h1 class="mo-titre">' + lettres + '</h1>'
      + '<p class="mo-txt">' + (chef ? 'Le chef ' + esc(S.name) + ' est tombé au jour ' + S.day + '. Sans lui, le clan se disperse dans la forêt…' : 'Le dernier gobelin est tombé au jour ' + S.day + '. Un chef sans clan n\'est plus un chef…') + '</p>'
      + '<div class="mo-stats">' + st.map((s, i) => '<span style="animation-delay:' + (3 + i * 0.18) + 's">' + s[0] + ' ' + s[1] + '</span>').join('') + '</div>'
      + '<button id="mo-new">🌱 Recommencer une nouvelle partie</button></div>';
    document.body.appendChild(el); void jours;
    const go = () => { CG.wipe(); location.reload(); }, t0 = performance.now();
    el.querySelector('#mo-new').onclick = go;
    window.addEventListener('keydown', e => { if (e.key === 'Enter' && performance.now() - t0 > 4200) go(); });
    CG.sfx('tombe');
  };
})(window.CG);
