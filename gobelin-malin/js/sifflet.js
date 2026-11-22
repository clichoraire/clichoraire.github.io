// Goblin Malin — le sifflet, et des animaux qui s'occupent d'eux-mêmes. Tout est réglable dans CG.Sifflet.
//   1) Le sifflet (technologie après « Compagnons fidèles », touche Y ou bouton 🎵) :
//        un coup : tous les animaux accourent, suivent le chef et se battent avec lui ;
//        deux coups rapides : ils rentrent au village tout de suite, en courant.
//   2) Au village, un animal blessé va de lui-même se faire soigner près de la hutte du guérisseur (s'il y en a un à son
//      poste), et y reste jusqu'à ce qu'il aille mieux. Le reste du temps il rôde autour du feu, comme avant.
'use strict';
(function (CG) {
  const G = CG.G, P = CG.P, UI = CG.UI, T = CG.TILE, TAU = Math.PI * 2, Si = CG.Sifflet = { TECH: 'b40', TOUCHE: 'y', DOUBLE: 0.7, RENTRE: 9, COURSE: 1.5, BLESSE: 0.7, GUERI: 0.97 };
  const t = { id: Si.TECH, br: 'clan', t: 6, r: 5, cout: 2, icon: '🎵', nom: 'Sifflet', desc: 'Nouveau pouvoir permanent (touche Y) : un coup de sifflet, et tes animaux dressés accourent et te suivent. Deux coups rapides : ils rentrent au village.', req: ['b24'] };
  CG.TECH.push(t); if (CG.TECH_BY_ID) CG.TECH_BY_ID[t.id] = t; if (CG.TECH_PARENT) CG.TECH_PARENT[t.id] = 'b24';
  if (CG.Vues && CG.Vues.NIVEAU) CG.Vues.NIVEAU[t.id] = 'b24'; // dans l'arbre : pas de sifflet sans « Compagnons fidèles », même si la case est voisine d'une autre
  const debout = () => CG.S.pets.filter(p => !p.ko && !p.ridden && P.KINDS[p.kind]);
  // ---------- le son : deux petites notes qui montent (ou qui redescendent, pour « à la maison ») ----------
  let ac = null;
  function son(retour) {
    const A = CG.audio; if (A && (A.muted || A.sfxOn === false)) return;
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const t0 = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine';
      const f = retour ? [2500, 1500] : [1700, 2700]; o.frequency.setValueAtTime(f[0], t0); o.frequency.exponentialRampToValueAtTime(f[1], t0 + 0.2);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.16 * (A && A.sfxVolume !== undefined ? A.sfxVolume : 1) + 0.0001, t0 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.26);
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + 0.28); } catch (e) { /* pas de son : tant pis */ }
  }
  let dernier = -9;
  Si.peut = () => !!CG.S && !!CG.R && CG.running && G.tech(Si.TECH) && !UI.modal && !(CG.R.ko > 0) && !CG.R.cine && !CG.R.night && !CG.R.death;
  Si.siffler = function () {
    if (!Si.peut()) return; const S = CG.S, R = CG.R, p = S.player, deux = R.t - dernier < Si.DOUBLE; dernier = deux ? -9 : R.t;
    const l = debout().filter(a => a.dresse); son(deux); R.rings.push({ x: p.x, y: p.y - 30, r: deux ? 150 : 110, life: 0.45, col: deux ? '#ffd28a' : '#bfe8ff' }); G.text(p.x + 14, p.y - 72, deux ? '♪♪' : '♪', deux ? '#ffd28a' : '#bfe8ff', true);
    if (!l.length) return;
    l.forEach(a => { a.follow = !deux; a.soin = null; a.eat = null; a.path = null; a.sleep = false; a.rentre = deux ? Si.RENTRE : 0; if (deux) { a.timer = 0; a.wx = undefined; } G.text(a.x, a.y - 46, deux ? '🏕️' : '❗', '#fff', true); });
  };
  window.addEventListener('keydown', e => { if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || (e.key || '').toLowerCase() !== Si.TOUCHE) return; const el = document.activeElement; if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return; Si.siffler(); });
  // le bouton (pour la tablette aussi) : il n'apparaît qu'une fois le sifflet appris
  window.addEventListener('load', () => {
    const bs = document.getElementById('buttons'); if (!bs) return; const b = document.createElement('button'); b.id = 'btn-sifflet'; b.title = 'Sifflet (Y) : un coup, tes animaux te suivent ; deux coups rapides, ils rentrent au village'; b.style.display = 'none';
    b.innerHTML = '<b class="e">🎵</b><span class="l"> Sifflet</span> <i>Y</i>'; b.onclick = () => { Si.siffler(); b.blur(); };
    const ref = document.getElementById('btn-help'); bs.insertBefore(b, ref || null);
    setInterval(() => { const on = !!(CG.S && CG.running && G.tech(Si.TECH)); if ((b.style.display !== 'none') !== on) b.style.display = on ? '' : 'none'; }, 700);
  });
  // ---------- les animaux du village : rentrer en courant, ou aller se faire soigner ----------
  const hutte = () => { const R = CG.R; let b = null; for (const o of CG.S.buildings) if (o.type === 'guerisseur' && !o.site && o.healer && R.t - o.healOn < 3) { b = o; break; } return b; };
  const up0 = P.update; P.update = function (dt) {
    const S = CG.S, R = CG.R, f = G.firePos(), soins = hutte(), avant = new Map();
    for (const p of S.pets) {
      if (p.ko || p.ridden || !P.KINDS[p.kind]) { p.soin = null; p.rentre = 0; continue; }
      const mh = P.maxHp(p);
      if (p.follow) p.soin = null; // celui qui suit le chef reste avec lui
      else if (p.soin) { if (!soins || p.hp >= mh * Si.GUERI) p.soin = null; }
      else if (soins && p.hp < mh * Si.BLESSE && !(p.rentre > 0)) { p.soin = { dx: ((p.id % 5) - 2) * 16, dy: 26 + (p.id % 3) * 10 }; G.text(p.x, p.y - 46, '🌿', '#fff'); }
      if (p.soin && soins) { p.wx = (soins.tx + soins.w / 2) * T + p.soin.dx; p.wy = (soins.ty + soins.h) * T + p.soin.dy; p.timer = 2; p.eat = null; } // sa prochaine « promenade » : devant la hutte de soins
      if (p.rentre > 0) { p.rentre -= dt; if (p.wx === undefined || p.timer <= 0.1) { const a = p.id * 2.4; p.wx = f.x + Math.cos(a) * 110; p.wy = f.y + 30 + Math.sin(a) * 60; } p.timer = 2; if (Math.hypot(p.wx - p.x, p.wy - p.y) < 24) p.rentre = 0; }
      if (p.soin || p.rentre > 0) avant.set(p, { x: p.x, y: p.y });
    }
    const r = up0.apply(this, arguments);
    // il y va d'un bon pas (la promenade ordinaire est lente) : on allonge le pas qu'il vient de faire
    avant.forEach((q, p) => { const dx = p.x - q.x, dy = p.y - q.y; if (!dx && !dy) return; const k = (p.rentre > 0 ? Si.COURSE : 0.8), nx = p.x + dx * k, ny = p.y + dy * k; if (P.KINDS[p.kind].fly || CG.W.walkPx(nx, ny)) { p.x = nx; p.y = ny; } });
    return r;
  };
})(window.CG);
