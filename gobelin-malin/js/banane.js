// Goblin Malin — la peau de banane. Quand un singe lance une banane, la peau reste par terre quelques secondes. Si le chef
// marche dessus : ZWIP ! Ses pieds partent en avant, il fait un tour en l'air, retombe sur le dos, voit des étoiles, puis se
// relève en titubant. Pendant cette seconde, il ne commande plus rien. (Seulement le chef : les autres regardent où ils marchent.)
// Tout se règle dans CG.Banane.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, TAU = Math.PI * 2, rand = CG.rand; if (!G || !CG.Magie) return;
  const Ba = CG.Banane = { RESTE: 6, PRES: 15, DUREE: 1, GLISSE: 70, VOL: 0.28, SOL: 0.62, REPIT: 0.6, MAX: 14 }; /* RESTE : secondes au sol ; DUREE : la chute entière ; VOL : il est en l'air jusque-là ; SOL : couché jusque-là, ensuite il se relève */
  Ba.poser = function (x, y) { const R = CG.R; if (!R || !W.walkPx(x, y)) return; const L = R.peaux || (R.peaux = []); if (L.length >= Ba.MAX) L.shift(); L.push({ x, y, t: Ba.RESTE, rot: Math.random() * TAU }); };
  Ba.glisser = function (peau) {
    const R = CG.R, p = CG.S.player, d = R.dir && (R.dir.x || R.dir.y) ? R.dir : { x: p.face < 0 ? -1 : 1, y: 0 }, l = Math.hypot(d.x, d.y) || 1;
    R.glisse = { t: 0, dx: d.x / l, dy: d.y / l, face: p.face < 0 ? -1 : 1, px: p.x, py: p.y, dit: false, choc: false }; R.build = null;
    if (peau) (R.peauxVol = R.peauxVol || []).push({ x: peau.x, y: peau.y, vx: -d.x / l * 90 + rand(-30, 30), vy: -230, t: 0, rot: peau.rot }); /* la peau s'envole en tournant */
    G.text(p.x, p.y - 74, 'ZWIP !', '#ffe36b', true); CG.sfx('swing');
  };
  const doux = k => k * k * (3 - 2 * k);
  // la pirouette : appelée par le dessin du chef (main.js)
  Ba.tourner = function (c, p, q) {
    const u = q.t / Ba.DUREE, V = Ba.VOL, S0 = Ba.SOL; let a, haut = 0;
    if (u < V) { const k = u / V; a = doux(k) * (Math.PI / 2 + 0.25); haut = Math.sin(k * Math.PI) * 26; } // les pieds partent en avant, il bascule en arrière
    else if (u < S0) { const k = (u - V) / (S0 - V); a = Math.PI / 2 + 0.25 * (1 - Math.min(1, k * 3)); haut = Math.abs(Math.sin(k * Math.PI * 2)) * 6 * (1 - k); } // sur le dos : un petit rebond
    else { const k = (u - S0) / (1 - S0); a = (Math.PI / 2) * (1 - doux(k)) + Math.sin(k * Math.PI * 3) * 0.16 * (1 - k); } // il se relève en titubant
    c.translate(p.x, p.y - 8 - haut); c.rotate(-q.face * a); c.translate(-p.x, -(p.y - 8));
  };
  const bloque = () => { const R = CG.R; return !!(R && R.glisse); };
  ['attack', 'cast'].forEach(k => { const f0 = G[k]; if (typeof f0 === 'function') G[k] = function () { if (bloque()) return; return f0.apply(this, arguments); }; });
  if (D && D.interact) { const in0 = D.interact; D.interact = function () { if (bloque()) return; return in0.apply(this, arguments); }; }
  const up0 = G.update; G.update = function (dt) {
    const R0 = CG.R, q0 = R0 && R0.glisse, S = CG.S, p0 = S && S.player, av = q0 && p0 ? { x: p0.x, y: p0.y } : null;
    const r = up0.apply(this, arguments), R = CG.R; if (!R || !S || CG.S !== S) return r; const p = S.player;
    const q = R.glisse;
    if (q && av) { // pendant la chute, ce n'est plus lui qui décide : on défait son pas, et on le fait glisser sur sa lancée
      p.x = av.x; p.y = av.y; p.moving = false; q.t += dt; const u = q.t / Ba.DUREE;
      if (u < Ba.VOL) G.slide(p, q.dx * Ba.GLISSE / (Ba.VOL * Ba.DUREE) * dt, q.dy * Ba.GLISSE / (Ba.VOL * Ba.DUREE) * dt, 9);
      else if (!q.choc) { q.choc = true; G.puff(p.x, p.y - 4, '#e8dcc0', 12, 110, 3); R.shake = Math.max(R.shake || 0, 0.14); CG.sfx('hit'); G.text(p.x, p.y - 60, 'BOUM !', '#ffd0a0', true); }
      if (u > Ba.SOL && !q.dit) { q.dit = true; G.text(p.x, p.y - 70, pick(['Aïe, mon derrière !', 'Qui a mis ça là ?!', 'Maudits singes !', 'Ouille ouille ouille...']), '#ffe9a8', true); }
      if (u >= 1) { R.glisse = null; R.glisseRepit = Ba.REPIT; }
    }
    if (R.glisseRepit > 0) R.glisseRepit -= dt;
    const L = R.peaux; if (L && L.length) { for (const o of L) o.t -= dt;
      if (!R.glisse && !(R.glisseRepit > 0) && !(R.ko > 0) && !R.mount && !(R.passe > 0) && !R.cine && p.moving) for (const o of L) if (o.t > 0 && Math.hypot(o.x - p.x, o.y - p.y) < Ba.PRES) { o.t = 0; Ba.glisser(o); break; }
      R.peaux = L.filter(o => o.t > 0); }
    const Vl = R.peauxVol; if (Vl && Vl.length) { for (const o of Vl) { o.t += dt; o.x += o.vx * dt; o.y += o.vy * dt; o.vy += 620 * dt; o.rot += dt * 14; } R.peauxVol = Vl.filter(o => o.t < 0.9); }
    return r;
  };
  const pick = CG.pick;
  // ---------- dessins ----------
  function peau(c, x, y, rot, a) { c.save(); c.translate(x, y); c.globalAlpha = a; c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(0, 3, 11, 4, 0, 0, TAU); c.fill(); c.rotate(rot); c.scale(1, 0.62);
    for (let i = 0; i < 4; i++) { c.rotate(TAU / 4); c.fillStyle = i % 2 ? '#f2cf2a' : '#ffe14a'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(5.5, -5, 12, -2.4); c.quadraticCurveTo(7, 2.6, 0, 0); c.fill(); c.fillStyle = '#fff6c0'; c.beginPath(); c.ellipse(5.5, -1.4, 3.4, 1.1, -0.25, 0, TAU); c.fill(); }
    c.fillStyle = '#6a4a1c'; c.beginPath(); c.arc(0, 0, 2, 0, TAU); c.fill(); c.restore(); }
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (c, t) {
    gr0.apply(this, arguments); const R = CG.R, L = R && R.peaux; if (!L || !L.length) return;
    for (const o of L) if (CG.onScreen(o.x, o.y)) peau(c, o.x, o.y, o.rot, o.t < 1 ? (Math.floor(o.t * 10) % 2 ? 0.45 : 0.9) * Math.max(0.3, o.t) + 0.1 : 1); /* elle clignote avant de disparaître */
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (c, t) {
    mk0.apply(this, arguments); const R = CG.R; if (!R) return;
    for (const o of R.peauxVol || []) peau(c, o.x, o.y - 10, o.rot, Math.max(0, 1 - o.t / 0.9));
    const q = R.glisse; if (!q) return; const p = CG.S.player, u = q.t / Ba.DUREE; if (u < Ba.VOL) return; // des étoiles qui tournent au-dessus de lui
    const cx = p.x - q.face * 14, cy = p.y - 26 - (u > Ba.SOL ? (u - Ba.SOL) / (1 - Ba.SOL) * 22 : 0);
    for (let i = 0; i < 4; i++) { const a = t * 6 + i * TAU / 4, x = cx + Math.cos(a) * 15, y = cy + Math.sin(a) * 5; c.fillStyle = i % 2 ? '#ffe36b' : '#fff6c8'; c.beginPath(); for (let k = 0; k < 10; k++) { const an = k / 10 * TAU - Math.PI / 2, r = k % 2 ? 2 : 4.6; c.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); } c.closePath(); c.fill(); }
  };
  Ba.essai = () => { const p = CG.S.player; Ba.poser(p.x + 60, p.y); return CG.R.peaux; }; // pour les essais
})(window.CG);
