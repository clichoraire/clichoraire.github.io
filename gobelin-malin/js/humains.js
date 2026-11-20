// Goblin Malin — les humains, redessinés : des jambes avec des bottes, un buste épaulé, une ceinture, deux bras articulés (coude),
// un visage plus fin, et un équipement propre à chacun (jaque et casque du soldat, plates du chevalier, capuche et carquois de
// l'archer, foulard du brigand, robe et barbe du mage, cape du capitaine). Pas de contour : seulement des aplats et des ombres.
// Le coup d'épée est un vrai coup : l'arme part derrière la tête, s'abat vers l'avant en laissant une traînée, puis revient.
'use strict';
(function (CG) {
  const Art = CG.Art, TAU = Math.PI * 2; if (!Art) return;
  const Hu = CG.Humains = { DUREE: 0.46, ARME: 0.3, FRAPPE: 0.58 }; // DUREE : secondes que dure le geste ; // le coup : élan jusqu'à ARME, frappe jusqu'à FRAPPE, puis retour (parts de l'animation)
  const ell = (g, x, y, rx, ry, f, rot) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  const circ = (g, x, y, r, f) => ell(g, x, y, r, r, f);
  const line = (g, a, b, c, d, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); };
  const poly = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const rr = (g, x, y, w, h, r, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); };
  const doux = k => k * k * (3 - 2 * k), vif = k => 1 - Math.pow(1 - k, 3), mix = (a, b, k) => a + (b - a) * k;
  const OMBRE = 'rgba(0,0,0,0.16)', FER = '#c4c8d4', FER2 = '#8e929e', CUIR = '#4a3220';
  // la pose du bras qui tient l'arme, à un instant u du coup (u < 0 : au repos). a : angle du bras (0 = pendu, π/2 = tendu devant),
  // pli : coude, r : inclinaison de l'arme (0 = droite vers le haut, π/2 = pointée devant)
  function pose(w, u, sw) {
    const A = Hu.ARME, F = Hu.FRAPPE;
    if (w === 'epee' || w === 'massue') { const R = [0.35 + sw * 0.45, 0.75, -0.12];
      if (u < 0) return R; if (u < A) { const k = doux(u / A); return [mix(R[0], 3.45, k), mix(R[1], -0.35, k), mix(R[2], -0.95, k)]; }
      if (u < F) { const k = vif((u - A) / (F - A)); return [mix(3.45, 0.8, k), mix(-0.35, 0.12, k), mix(-0.95, 2.25, k)]; }
      const k = doux((u - F) / (1 - F)); return [mix(0.8, R[0], k), mix(0.12, R[1], k), mix(2.25, R[2], k)]; }
    if (w === 'fourche') { const R = [0.45 + sw * 0.3, 0.6, 0.55];
      if (u < 0) return R; if (u < A) { const k = doux(u / A); return [mix(R[0], -0.35, k), mix(R[1], 1.5, k), mix(R[2], 1.25, k)]; }
      if (u < F) { const k = vif((u - A) / (F - A)); return [mix(-0.35, 1.5, k), mix(1.5, 0.05, k), mix(1.25, 1.5, k)]; }
      const k = doux((u - F) / (1 - F)); return [mix(1.5, R[0], k), mix(0.05, R[1], k), mix(1.5, R[2], k)]; }
    if (w === 'arc') { const R = [0.7 + sw * 0.2, 0.5, 0.25]; if (u < 0) return R; const k = u < A ? doux(u / A) : u < 0.8 ? 1 : 1 - doux((u - 0.8) / 0.2); return [mix(R[0], 1.5, k), mix(R[1], 0.05, k), mix(R[2], 0, k)]; }
    const R = [0.5 + sw * 0.3, 0.55, 0.08]; if (u < 0) return R; const k = u < A ? doux(u / A) : u < F ? 1 : 1 - doux((u - F) / (1 - F)); return [mix(R[0], 2.25, k), mix(R[1], 0.2, k), mix(R[2], 0.55, k)]; // le bâton : levé vers le ciel
  }
  const main = (S, p) => { const ex = S[0] + Math.sin(p[0]) * 6.4, ey = S[1] + Math.cos(p[0]) * 6.4, a2 = p[0] + p[1]; return [ex, ey, ex + Math.sin(a2) * 6.4, ey + Math.cos(a2) * 6.4]; }; // coude, puis main
  function epee(g, grand, or) {
    const L = grand ? 27 : 23.5; poly(g, [-1.7, -3, -1.3, -L + 3.5, 0, -L, 1.3, -L + 3.5, 1.7, -3], '#e6eaf4'); poly(g, [0, -3, 0, -L, 1.3, -L + 3.5, 1.7, -3], '#b0b6c6'); line(g, -0.5, -5, -0.5, -L + 6, 'rgba(255,255,255,0.7)', 0.7);
    rr(g, -5.2, -3.6, 10.4, 2.5, 1.2, or ? '#e8c84a' : '#a8803a'); rr(g, -1.15, -1.2, 2.3, 5.4, 0.8, CUIR); circ(g, 0, 4.9, 1.8, or ? '#e8c84a' : '#a8803a');
  }
  Art.humain = function (g, o) {
    const face = o.face < 0 ? -1 : 1, s = o.s || 1, t = o.t || 0, sw = o.moving ? Math.sin(o.step * TAU) : 0, w = o.weapon, A = Hu.ARME, F = Hu.FRAPPE;
    const bob = o.moving ? Math.abs(sw) * 1.4 : Math.sin(t * 2.4) * 0.5, u = o.atk > 0 ? 1 - Math.min(1, o.atk) : -1, tranche = w === 'epee' || w === 'massue';
    let lean = 0; if (u >= 0 && (tranche || w === 'fourche')) lean = u < A ? -0.1 * doux(u / A) : u < F ? mix(-0.1, 0.2, vif((u - A) / (F - A))) : 0.2 * (1 - doux((u - F) / (1 - F)));
    const fente = Math.max(0, lean) * 14, tunic = o.tunic || '#8a6a3c', peau = o.skin || '#f0c8a0', jambes = o.armor ? FER2 : o.legs || '#3a3026', manche = o.armor ? FER : o.sleeve || tunic;
    g.save(); g.translate(o.x, o.y); Art.shadow(g, 0, 1, 12 * s); g.scale(face * s, s);
    const by = -15 - bob, sh = by - 15.5, hy = sh - 9.4;
    // ----- la cape, derrière tout -----
    if (o.cape) { const v = Math.sin(t * 3) * 1.2 + sw * 1.5; poly(g, [-6, sh + 1, 4, sh + 1, 6, by + 9 + v, -13 - Math.max(0, lean) * 20, by + 11 - v], o.cape); poly(g, [-6, sh + 1, -1, sh + 1, -4, by + 10, -13 - Math.max(0, lean) * 20, by + 11 - v], OMBRE); }
    // ----- les jambes et les bottes -----
    const pied = (dx, dir, devant) => { const fx = dx + dir * sw * 5 + (devant ? fente : -fente * 0.4), ky = by * 0.48;
      if (!o.robe) { line(g, dx, by, (dx + fx) / 2 + dir * Math.abs(sw) * 1.2, ky, jambes, 4.6); line(g, (dx + fx) / 2 + dir * Math.abs(sw) * 1.2, ky, fx, -3.5, jambes, 4.2); if (o.armor) circ(g, (dx + fx) / 2 + dir * Math.abs(sw) * 1.2 + 0.6, ky, 2.5, FER); }
      line(g, fx, -6.5, fx, -2, o.armor ? FER2 : CUIR, 5); ell(g, fx + 1.6, -1.6, 4.1, 2.4, o.armor ? '#7a7e8a' : '#3a2616'); ell(g, fx + 2.6, -2.5, 2, 0.9, 'rgba(255,255,255,0.14)'); };
    pied(-2.8, -1, false); pied(2.8, 1, true);
    // ----- le buste, qui se penche dans le coup -----
    g.save(); g.translate(0, by); g.rotate(lean); g.translate(0, -by);
    if (w === 'arc') { rr(g, -10.5, sh - 2, 4.6, 15, 2, '#6b4a2a'); [-9.6, -8.2, -6.9].forEach((x, i) => { line(g, x, sh - 2, x, sh - 6 - i % 2, '#d8c8a0', 0.9); poly(g, [x - 1.1, sh - 6 - i % 2, x, sh - 8.6 - i % 2, x + 1.1, sh - 6 - i % 2], '#c84a3a'); }); } // le carquois
    { const bx = -5.4 - sw * 3.6, byy = sh + 12.5; line(g, -5.2, sh + 2, (bx - 5.2) / 2 - 1.2, sh + 7.5, manche, 4.2); line(g, (bx - 5.2) / 2 - 1.2, sh + 7.5, bx, byy, manche, 3.9); line(g, -5.2, sh + 2, bx, byy, OMBRE, 4.2); circ(g, bx, byy + 0.6, 2.2, o.armor ? FER2 : peau); } // le bras du fond
    if (o.robe || o.hat) { poly(g, [-7.6, sh + 0.5, 7.6, sh + 0.5, 6.4, by - 3, 9.6, by + 13, -9.6, by + 13, -6.4, by - 3], tunic); poly(g, [-7.6, sh + 0.5, -2, sh + 0.5, -3, by + 13, -9.6, by + 13, -6.4, by - 3], OMBRE); line(g, 1.5, by, 2.4, by + 12.5, 'rgba(255,255,255,0.14)', 1.2); rr(g, -9.8, by + 11, 19.6, 2.4, 1, '#e8c84a'); }
    else { g.fillStyle = tunic; g.beginPath(); g.moveTo(-6.4, sh + 0.4); g.quadraticCurveTo(0, sh - 1.4, 6.4, sh + 0.4); g.quadraticCurveTo(8.6, sh + 2, 8, sh + 6); g.lineTo(6.4, by - 3); g.lineTo(7.6, by + 4.5); g.lineTo(-7.6, by + 4.5); g.lineTo(-6.4, by - 3); g.lineTo(-8, sh + 6); g.quadraticCurveTo(-8.6, sh + 2, -6.4, sh + 0.4); g.fill();
      poly(g, [-6.4, sh + 0.6, -2.4, sh, -3, by + 4.5, -7.6, by + 4.5, -6.4, by - 3, -8, sh + 6], OMBRE); line(g, 3.6, sh + 3, 4.4, by - 5, 'rgba(255,255,255,0.16)', 1.4); }
    if (o.armor) { g.fillStyle = FER; g.beginPath(); g.moveTo(-7, sh + 0.6); g.quadraticCurveTo(0, sh - 1.4, 7, sh + 0.6); g.lineTo(7.4, sh + 9); g.quadraticCurveTo(0, sh + 13.5, -7.4, sh + 9); g.closePath(); g.fill();
      poly(g, [-7, sh + 0.8, -2.2, sh, -2.6, sh + 11.6, -7.4, sh + 9], 'rgba(0,0,0,0.2)'); line(g, 3.2, sh + 2.4, 4, sh + 8, 'rgba(255,255,255,0.75)', 1.3); line(g, 0, sh + 0.4, 0, sh + 11.8, 'rgba(0,0,0,0.18)', 0.9);
      rr(g, -3.4, sh - 2.4, 6.8, 3.4, 1.6, FER2); [-4, 0, 4].forEach(x => rr(g, x - 2.6, by - 1, 5.2, 5.4, 1.4, x ? FER2 : FER)); } // le plastron, le gorgerin, les tassettes
    else if (o.helmet) { poly(g, [-2.6, sh + 1, 2.6, sh + 1, 3, by + 4.5, -3, by + 4.5], 'rgba(255,255,255,0.2)'); circ(g, 0, sh + 6, 1.7, '#e8c84a'); circ(g, 0, sh + 6, 0.8, tunic); } // le tabard du soldat et son écusson
    else if (o.hood && w !== 'arc') line(g, -6.6, sh + 2, 6.4, by - 5, '#2a1c12', 2); // la bandoulière du brigand
    else if (!o.hat) { rr(g, 1.6, sh + 6.5, 3.6, 3.6, 0.8, 'rgba(0,0,0,0.16)'); line(g, 2.2, sh + 7.2, 4.4, sh + 9.2, 'rgba(255,255,255,0.3)', 0.6); } // une pièce cousue sur la tunique du milicien
    if (!o.robe && !o.hat) { rr(g, -6.9, by - 4.4, 13.8, 2.9, 1.2, o.armor ? '#5a4630' : '#33241a'); rr(g, 1.2, by - 4.9, 3.4, 3.9, 0.8, '#e8c84a'); rr(g, 2.1, by - 4, 1.6, 2.1, 0.4, '#33241a'); }
    else { rr(g, -6.6, by - 4.2, 13.2, 2.2, 1, '#e8c84a'); line(g, 2.4, by - 2.4, 3.4, by + 4, '#e8c84a', 1.1); }
    // ----- le cou et la tête -----
    rr(g, -2.2, sh - 3.6, 4.6, 5, 1.6, peau); rr(g, -2.2, sh - 1.4, 4.6, 2.2, 1, 'rgba(0,0,0,0.14)');
    const nu = !o.helmet && !o.hood && !o.hat;
    if (o.hair && (nu || o.hat)) { g.fillStyle = o.hair; g.beginPath(); g.ellipse(-1.6, hy + 0.6, 7.2, 7.6, 0, 0, TAU); g.fill(); } // la masse des cheveux, derrière
    ell(g, 0.6, hy, 6.5, 7, peau); ell(g, -2.8, hy + 0.8, 3.4, 5.6, 'rgba(0,0,0,0.07)'); ell(g, 1.4, hy + 4.6, 4.4, 2.6, peau);
    if (nu || o.hat) { circ(g, -4.9, hy + 0.9, 2, peau); circ(g, -4.8, hy + 1, 0.95, 'rgba(0,0,0,0.18)'); }
    const frappe = u >= A && u < F + 0.15, ink = '#2a1a14';
    ell(g, 3.5, hy - 0.7, 1.75, 1.95, '#fffdf4'); ell(g, -0.9, hy - 0.7, 1.45, 1.75, '#fffdf4'); circ(g, 4, hy - 0.55, 0.95, '#241812'); circ(g, -0.55, hy - 0.55, 0.85, '#241812'); circ(g, 4.3, hy - 0.95, 0.32, '#fff'); circ(g, -0.3, hy - 0.95, 0.28, '#fff');
    if (o.angry || frappe) { line(g, 1.8, hy - 3.1, 5.6, hy - 4.1, ink, 1.15); line(g, -2.8, hy - 4, 0.3, hy - 3.1, ink, 1.15); } else { line(g, 2, hy - 3.9, 5.4, hy - 3.7, ink, 0.95); line(g, -2.6, hy - 3.7, 0.2, hy - 3.9, ink, 0.95); }
    g.fillStyle = peau; g.beginPath(); g.moveTo(5.4, hy - 0.4); g.quadraticCurveTo(8.6, hy + 1.9, 5.6, hy + 2.9); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.13)'; g.beginPath(); g.moveTo(5.6, hy + 1.2); g.quadraticCurveTo(8.2, hy + 2.1, 5.6, hy + 2.9); g.closePath(); g.fill();
    ell(g, 3.2, hy + 2.3, 1.8, 1, 'rgba(230,110,90,0.22)');
    if (frappe) { ell(g, 3.4, hy + 4.6, 1.9, 1.5, '#4a1c18'); g.fillStyle = '#fffbe8'; g.fillRect(2.2, hy + 3.4, 2.6, 0.8); } // il crie en frappant
    else { g.strokeStyle = ink; g.lineWidth = 0.95; g.lineCap = 'round'; g.beginPath(); g.moveTo(1.4, hy + 4.5); if (o.angry) g.quadraticCurveTo(3.4, hy + 3.9, 5.2, hy + 4.7); else g.quadraticCurveTo(3.4, hy + 5.5, 5.2, hy + 4.4); g.stroke(); }
    if (o.hat) { g.fillStyle = o.hair || '#eee'; g.beginPath(); g.moveTo(-4.6, hy + 2.6); g.quadraticCurveTo(-3, hy + 12.5, 2.2, hy + 15); g.quadraticCurveTo(6.6, hy + 10.5, 6.6, hy + 3.4); g.quadraticCurveTo(2, hy + 6.2, -4.6, hy + 2.6); g.fill(); poly(g, [2.2, hy + 15, 6.6, hy + 3.4, 4, hy + 9], OMBRE); ell(g, 4.4, hy + 3.5, 2.5, 1.1, o.hair || '#eee'); } // la barbe du mage
    if (o.hood && w !== 'arc') { rr(g, -3.6, hy + 1.6, 10.6, 5.4, 2.2, '#3a2a22'); line(g, -3, hy + 3.2, 6.4, hy + 2.6, 'rgba(255,255,255,0.1)', 0.8); poly(g, [-4, hy + 4, -9, hy + 7 + Math.sin(t * 5) * 1, -8.4, hy + 3.4], '#3a2a22'); } // le foulard du brigand
    // ----- ce qu'il a sur la tête -----
    if (nu && o.hair) { g.fillStyle = o.hair; g.beginPath(); g.moveTo(-6.4, hy + 1.6); g.quadraticCurveTo(-8, hy - 8.4, 0.4, hy - 8); g.quadraticCurveTo(6.6, hy - 7.6, 7, hy - 3.4); g.quadraticCurveTo(3.2, hy - 5.4, -0.6, hy - 4.2); g.quadraticCurveTo(-3.4, hy - 3, -4, hy + 1.8); g.closePath(); g.fill(); line(g, -2.4, hy - 6.6, 2.4, hy - 6.9, 'rgba(255,255,255,0.22)', 1); }
    if (o.helmet && o.armor) { const pl = o.cape || '#c8322a', v = Math.sin(t * 4) * 1.2; g.fillStyle = pl; g.beginPath(); g.moveTo(0, hy - 8.4); g.quadraticCurveTo(-2.6, hy - 20, -11.5, hy - 13 + v); g.quadraticCurveTo(-5, hy - 12.2, -1.4, hy - 7.6); g.fill();
      rr(g, -7.4, hy - 2.4, 15.2, 10.4, 3.2, FER); poly(g, [-7.4, hy - 1, -2, hy - 2.4, -2, hy + 8, -6.2, hy + 8, -7.4, hy + 5], 'rgba(0,0,0,0.2)'); g.fillStyle = FER; g.beginPath(); g.arc(0.2, hy - 1.6, 7.6, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.arc(0.2, hy - 1.6, 7.6, Math.PI, Math.PI * 1.4); g.lineTo(0.2, hy - 1.6); g.closePath(); g.fill();
      rr(g, -8, hy - 2.8, 16.4, 2.2, 1, FER2); g.fillStyle = '#1c1410'; g.fillRect(0.4, hy + 0.6, 7, 1.6); [2.6, 4.6, 6.4].forEach(x => g.fillRect(x, hy + 4, 0.8, 2.2)); rr(g, 3.3, hy - 1.8, 1.5, 9.4, 0.7, FER2); line(g, 2.6, hy - 7.6, 5.2, hy - 5.4, 'rgba(255,255,255,0.7)', 1.1); }
    else if (o.helmet) { g.fillStyle = FER; g.beginPath(); g.arc(0.3, hy - 1.8, 7.5, Math.PI, 0); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(0.3, hy - 1.8, 7.5, Math.PI, Math.PI * 1.42); g.lineTo(0.3, hy - 1.8); g.closePath(); g.fill();
      rr(g, -8.6, hy - 2.9, 18.2, 2.4, 1.1, FER2); rr(g, 4.4, hy - 2, 1.6, 5.6, 0.7, FER2); line(g, 2.2, hy - 7.8, 5, hy - 5.8, 'rgba(255,255,255,0.7)', 1.1); rr(g, -7.2, hy - 0.6, 3, 6.4, 1.4, CUIR); } // le casque du soldat, son nasal, sa jugulaire
    if (o.hood) { const c = tunic; g.fillStyle = c; g.beginPath(); g.moveTo(6.6, hy - 2.6); g.quadraticCurveTo(5.6, hy - 9.6, -0.6, hy - 9.6); g.quadraticCurveTo(-9.6, hy - 9, -8.6, hy + 2.4); g.quadraticCurveTo(-8.8, hy + 8, -4.4, hy + 9); g.quadraticCurveTo(-5.6, hy + 2, -3.6, hy - 2.4); g.quadraticCurveTo(0.6, hy - 5.4, 6.6, hy - 2.6); g.fill();
      poly(g, [-8.4, hy - 3, -13.6, hy - 5.6 + Math.sin(t * 3) * 0.6, -7.4, hy - 8], c); g.fillStyle = OMBRE; g.beginPath(); g.moveTo(-0.6, hy - 9.6); g.quadraticCurveTo(-9.6, hy - 9, -8.6, hy + 2.4); g.quadraticCurveTo(-8.8, hy + 8, -4.4, hy + 9); g.quadraticCurveTo(-6.6, hy, -0.6, hy - 9.6); g.fill(); ell(g, 2, hy - 2.9, 4.6, 1.5, 'rgba(0,0,0,0.26)'); } // la capuche, et l'ombre qu'elle jette sur le front
    if (o.hat) { const hc = o.hatCol || tunic, tip = Math.sin(t * 2.4) * 1.2; g.fillStyle = hc; g.beginPath(); g.moveTo(-6.4, hy - 4.8); g.quadraticCurveTo(-3, hy - 16, -8 + tip, hy - 25); g.quadraticCurveTo(2.6, hy - 17, 6.8, hy - 4.8); g.closePath(); g.fill(); g.fillStyle = OMBRE; g.beginPath(); g.moveTo(-6.4, hy - 4.8); g.quadraticCurveTo(-3, hy - 16, -8 + tip, hy - 25); g.quadraticCurveTo(-1.4, hy - 15, -1, hy - 4.8); g.closePath(); g.fill();
      ell(g, 0.2, hy - 4.6, 11.6, 2.9, hc); ell(g, 0.8, hy - 5.2, 9.6, 1.6, 'rgba(255,255,255,0.14)'); rr(g, -5.8, hy - 8.4, 12.2, 2, 0.8, '#e8c84a'); circ(g, 2.4, hy - 7.4, 1.3, '#fff3a8'); }
    if (o.armor) { ell(g, -6.9, sh + 2, 4.4, 3.6, FER2); ell(g, 6.9, sh + 2, 4.6, 3.8, FER); ell(g, 7.6, sh + 1, 2.2, 1.2, 'rgba(255,255,255,0.6)'); } else if (o.helmet) { ell(g, 6.6, sh + 1.8, 3.6, 2.8, '#6b4a2a'); ell(g, 7, sh + 1.2, 1.8, 0.9, 'rgba(255,255,255,0.2)'); } // les épaulières
    // ----- le bras qui tient l'arme -----
    const S0 = [5.6, sh + 2.2], P = pose(w, u, sw), M = main(S0, P), hx = M[2], hyy = M[3];
    if (tranche && u >= A && u < F + 0.16) { // la traînée de la lame : un croissant blanc qui suit la pointe
      const u1 = Math.min(u, F), u0 = Math.max(A, u1 - 0.2), n = 8, L = (o.cape ? 27 : 23.5), pts = [], bas = [], fond = u > F ? 1 - (u - F) / 0.16 : 1;
      for (let i = 0; i <= n; i++) { const uu = mix(u0, u1, i / n), p = pose(w, uu, sw), m = main(S0, p); pts.push(m[2] + Math.sin(p[2]) * L, m[3] - Math.cos(p[2]) * L); bas.unshift(m[3] - Math.cos(p[2]) * L * 0.42); bas.unshift(m[2] + Math.sin(p[2]) * L * 0.42); }
      const grad = g.createLinearGradient(pts[0], pts[1], pts[pts.length - 2], pts[pts.length - 1]); grad.addColorStop(0, 'rgba(255,255,255,0)'); grad.addColorStop(1, 'rgba(255,255,255,' + (0.62 * fond).toFixed(3) + ')'); poly(g, pts.concat(bas), grad); }
    line(g, S0[0], S0[1], M[0], M[1], manche, 4.4); line(g, M[0], M[1], hx, hyy, manche, 4.1); if (o.armor) circ(g, M[0], M[1], 2.5, FER2);
    g.save(); g.translate(hx, hyy); g.rotate(P[2]);
    if (w === 'epee') epee(g, !!o.cape, !!o.cape || !!o.armor);
    else if (w === 'massue') { line(g, 0, 6, 0, -18, '#5a3d22', 4); ell(g, 0, -24, 7, 10, '#6b4a2a'); circ(g, -4, -26, 1.5, '#d8dce8'); circ(g, 4, -22, 1.5, '#d8dce8'); }
    else if (w === 'fourche') { line(g, 0, 13, 0, -22, '#8a6234', 2.3); line(g, 0.7, 13, 0.7, -22, 'rgba(0,0,0,0.18)', 0.9); g.strokeStyle = '#b4b8c4'; g.lineWidth = 1.9; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-4.6, -31); g.lineTo(-4.6, -24); g.quadraticCurveTo(-4.6, -22, 0, -22); g.quadraticCurveTo(4.6, -22, 4.6, -24); g.lineTo(4.6, -31); g.moveTo(0, -31.5); g.lineTo(0, -22); g.stroke(); }
    else if (w === 'arc') { const tire = u >= 0 && u < 0.62 ? (u < A ? doux(u / A) : 1) : 0, cx = -tire * 8.5; g.strokeStyle = '#7a4e26'; g.lineWidth = 2.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(1.5, -15); g.quadraticCurveTo(9, 0, 1.5, 15); g.stroke(); g.strokeStyle = '#a87440'; g.lineWidth = 1; g.beginPath(); g.moveTo(2.2, -13); g.quadraticCurveTo(8.2, 0, 2.2, 13); g.stroke(); rr(g, 3.6, -2.6, 2.4, 5.2, 1, CUIR);
      g.strokeStyle = '#f0ece0'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(1.5, -15); g.lineTo(1.5 + cx, 0); g.lineTo(1.5, 15); g.stroke(); if (tire > 0.05) { line(g, 1.5 + cx, 0, 13 + cx, 0, '#d8c8a0', 1); poly(g, [13 + cx, -1.5, 16.2 + cx, 0, 13 + cx, 1.5], '#b4b8c4'); circ(g, 1.5 + cx, 0, 1.9, peau); } } // la corde se tend, la flèche est encochée
    else if (w === 'baton') { const lueur = u >= 0 ? (u < A ? doux(u / A) : u < F ? 1 : 1 - doux((u - F) / (1 - F))) : 0, col = o.glow || '#ff7a2a'; line(g, 0, 15, 0, -23, '#5a3d22', 2.6); line(g, 0.8, 15, 0.8, -23, 'rgba(0,0,0,0.2)', 0.9); poly(g, [-3.4, -22, 0, -26, 3.4, -22, 0, -20], '#8a6234');
      if (lueur > 0) { g.globalAlpha = 0.35 * lueur; circ(g, 0, -28, 9 + lueur * 5, col); g.globalAlpha = 1; } circ(g, 0, -28, 4.6 + lueur * 1.6, col); circ(g, -1.2, -29.2, 1.7, '#fff'); }
    g.restore();
    circ(g, hx, hyy, 2.4, o.armor ? FER : peau); if (o.armor) circ(g, hx + 0.5, hyy - 0.6, 0.9, 'rgba(255,255,255,0.6)');
    g.restore(); g.restore();
  };
})(window.CG);
