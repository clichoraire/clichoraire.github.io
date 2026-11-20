// Goblin Malin — les métamorphoses : quatre sorts, un par créature (squelette, loup-garou, ours, démon). Chacun se trouve à part.
// Le chef change de corps pendant un moment : il frappe plus fort, encaisse mieux, court autrement. Tout part de sa propre force,
// donc un squelette de niveau 20 reste un squelette de niveau 20. Relancer le même sort pendant la métamorphose déclenche
// l'attaque de la créature (le squelette lance un os qui tourne et revient comme un boomerang).
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Art = CG.Art, W = CG.W, Me = CG.Meta = { DUREE: 40, MANA: { metaSquelette: 0.6, metaLoup: 0.8, metaOurs: 1, metaDemon: 1.3 } }, /* MANA : ce que la forme coûte par seconde ; à zéro, le chef reprend sa forme */ TAU = Math.PI * 2, rand = CG.rand;
  // du plus faible au plus fort : dégâts ×, dégâts reçus ×, vitesse ×, recharge de l'attaque spéciale
  Me.F = {
    metaSquelette: { k: 'squelette', nom: 'Squelette', de: 'de squelette', icon: '💀', mp: 14, prix: 600, dmg: 1.3, def: 0.8, spd: 1.05, cd: 1.6, col: '#eee8d8', coup: 'Os boomerang', desc: 'un os qui tourne, part devant toi et revient comme un boomerang' },
    metaLoup: { k: 'loup', nom: 'Loup-garou', de: 'de loup-garou', icon: '🐺', mp: 18, prix: 900, dmg: 1.5, def: 0.9, spd: 1.35, cd: 3, col: '#9aa0b0', coup: 'Bond du loup', desc: 'un bond en avant, toutes griffes dehors' },
    metaOurs: { k: 'ours', nom: 'Ours', de: 'd\'ours', icon: '🐻', mp: 22, prix: 1200, dmg: 1.8, def: 0.6, spd: 0.92, cd: 4, col: '#b08050', coup: 'Coup de patte', desc: 'un grand coup de patte qui balaie tout autour' },
    metaDemon: { k: 'demon', nom: 'Démon', de: 'de démon', icon: '😈', mp: 28, prix: 1700, dmg: 2.1, def: 0.7, spd: 1.15, cd: 3.5, col: '#ff5a2a', coup: 'Souffle infernal', desc: 'une gerbe de feu qui explose devant toi' }
  };
  const pc = v => Math.round(Math.abs(v - 1) * 100);
  Object.keys(Me.F).forEach(id => { const f = Me.F[id];
    CG.SPELLS[id] = { nom: 'Métamorphose ' + f.de, icon: f.icon, mp: f.mp, prix: f.prix, color: f.col, desc: 'Tu te changes en ' + f.nom.toLowerCase() + ' pendant ' + Me.DUREE + ' secondes : +' + pc(f.dmg) + ' % de dégâts, −' + pc(f.def) + ' % de dégâts reçus, ' + (f.spd >= 1 ? '+' : '−') + pc(f.spd) + ' % de vitesse. Relance le sort pendant la métamorphose (gratuit) : ' + f.coup + ', ' + f.desc + '.' };
    CG.SCROLL_POOL.push(id); if (CG.Effets && CG.Effets.FICHE) CG.Effets.FICHE[id] = [f.icon, null, Me.DUREE + ' s au plus · ×' + f.dmg + ' dégâts · −' + String(Me.MANA[id]).replace('.', ',') + ' mana par seconde'];
  });
  const forme = () => { const R = CG.R, m = R && R.meta; return m && m.t > 0 ? Me.F[m.id] : null; };
  Me.forme = forme;
  function fin(dit) { const R = CG.R, p = CG.S.player; if (!R.meta) return; R.meta = null; G.puff(p.x, p.y - 24, '#ffffff', 26, 150, 4); R.rings.push({ x: p.x, y: p.y - 10, r: 70, life: 0.4, col: '#ffffff' }); if (dit) G.text(p.x, p.y - 70, 'Tu reprends ta forme', '#ffe9a8'); }
  // ---------- les attaques des créatures ----------
  // la deuxième attaque de chaque créature
  Me.DEUX = {
    squelette: { nom: 'Nuée d\'os', icon: '☠️', cd: 7, desc: 'huit os partent dans tous les sens et reviennent' },
    loup: { nom: 'Morsure sauvage', icon: '🦷', cd: 5, desc: 'une énorme morsure sur l\'ennemi le plus proche, qui te rend un peu de vie' },
    ours: { nom: 'Rugissement', icon: '🗯️', cd: 9, desc: 'un rugissement si fort que les ennemis autour se sauvent' },
    demon: { nom: 'Pluie de feu', icon: '☄️', cd: 9, desc: 'des boules de feu tombent tout autour de toi' }
  };
  Me.UN_IC = { squelette: '🦴', loup: '💨', ours: '🐾', demon: '🔥' };
  function special2(f) {
    const S = CG.S, R = CG.R, p = S.player, m = R.meta, D2 = Me.DEUX[f.k]; if (m.cd2 > 0 || R.ko > 0) return; R.castAnim = 1; const base = G.playerDmg(), ok = e => !e.dead && !e.struct && !(e.charm > 0);
    if (CG.Magie.reveal && R.invis > 0) CG.Magie.reveal();
    if (f.k === 'squelette') { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; (R.os = R.os || []).push({ x: p.x, y: p.y - 20, dx: Math.cos(a), dy: Math.sin(a), t: 0, dmg: base * 0.9, vus: new Set(), retour: false }); } CG.sfx('swing'); G.text(p.x, p.y - 80, '☠️ Clac clac !', '#eee8d8', true); }
    else if (f.k === 'loup') { let tg = null, bd = 95; for (const e of R.enemies) { if (!ok(e)) continue; const d = Math.hypot(e.x - p.x, e.y - p.y) - (e.r || 12); if (d < bd) { bd = d; tg = e; } }
      if (!tg) { CG.sfx('no'); G.text(p.x, p.y - 60, 'Personne à mordre', '#c8ccd8'); return; } p.face = tg.x > p.x ? 1 : -1; const hp0 = tg.hp; G.hurtEnemy(tg, base * 2.6, p); const soin = Math.max(2, Math.round(Math.max(0, hp0 - Math.max(0, tg.hp)) * 0.25)); p.hp = Math.min(p.maxhp, p.hp + soin); G.text(p.x, p.y - 80, '🦷 CROC ! +' + soin, '#ffb0b0', true); G.puff(tg.x, tg.y - 16, '#d83a3a', 12, 130, 4); CG.sfx('hit'); }
    else if (f.k === 'ours') { let n = 0; for (const e of R.enemies) { if (!ok(e) || Math.hypot(e.x - p.x, e.y - p.y) > 175) continue; G.hurtEnemy(e, base * 0.5, p); if (!(CG.ENEMIES[e.type] && CG.ENEMIES[e.type].boss)) { e.fear = Math.max(e.fear || 0, 3.2); e.path = null; } n++; } for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 70 + i * 52, life: 0.4 + i * 0.15, col: '#e8c890' }); G.text(p.x, p.y - 84, '🗯️ GRRRAAOOH !', '#ffd0a0', true); CG.sfx('horn'); void n; }
    else { for (let i = 0; i < 6; i++) { const a = rand(0, TAU), d = rand(50, 150); R.delayed.push({ t: 0.5 + i * 0.16, max: 0.5 + i * 0.16, x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d * 0.8 - 12, r: 62, dmg: base * 1.3 }); } G.text(p.x, p.y - 84, '☄️ Que le ciel tombe !', '#ffb080', true); CG.sfx('spell'); }
    m.cd2 = D2.cd;
  }
  // la barre du bas, pendant la métamorphose : tout à gauche le bouton pour reprendre sa forme, puis les deux attaques de la créature
  Me.barre = function () { const R = CG.R, m = R.meta, f = forme(); if (!f) return ''; const D2 = Me.DEUX[f.k], cs = (c, key, ic, nom, desc) => '<div class="spell meta' + (c > 0 ? ' low' : '') + '" data-meta="' + key + '" title="' + nom + ' — ' + desc + '"><i>' + key + '</i>' + ic + (c > 0 ? '<u>' + Math.ceil(c) + ' s</u>' : '') + '</div>';
    return '<div class="spell meta stop" data-meta="0" title="Reprendre ta forme tout de suite"><i>0</i>↩️</div>' + cs(m.cd, 1, Me.UN_IC[f.k], f.coup, f.desc) + cs(m.cd2, 2, D2.icon, D2.nom, D2.desc) + '<div class="spell meta info" title="' + f.nom + ' : il te reste du temps tant que tu as du mana">' + f.icon + '<u>' + Math.ceil(m.t) + ' s</u></div>'; };
  Me.cle = function () { const m = CG.R && CG.R.meta; return forme() ? m.id + '|' + Math.ceil(Math.max(0, m.cd)) + '|' + Math.ceil(Math.max(0, m.cd2 || 0)) + '|' + Math.ceil(m.t) : ''; };
  Me.touche = function (k) { const f = forme(); if (!f) return; if (String(k) === '0') return fin(true); if (String(k) === '1') return special(f); if (String(k) === '2') return special2(f); };
  Me.arreter = () => fin(true);
  document.addEventListener('click', ev => { const b = ev.target && ev.target.closest ? ev.target.closest('#spells [data-meta]') : null; if (!b || !CG.S || !CG.R || !CG.running || (UI && UI.modal)) return; Me.touche(b.dataset.meta); });
  function special(f) {
    const S = CG.S, R = CG.R, p = S.player, m = R.meta; if (m.cd > 0 || R.ko > 0) return; m.cd = f.cd; R.castAnim = 1; const d = R.dir && (R.dir.x || R.dir.y) ? R.dir : { x: p.face < 0 ? -1 : 1, y: 0 }, base = G.playerDmg();
    if (CG.Magie.reveal && R.invis > 0) CG.Magie.reveal();
    if (f.k === 'squelette') { (R.os = R.os || []).push({ x: p.x, y: p.y - 20, dx: d.x, dy: d.y, t: 0, dmg: base * 1.2, vus: new Set(), retour: false }); CG.sfx('swing'); }
    else if (f.k === 'loup') { m.px = p.x; m.py = p.y; for (let i = 0; i < 15; i++) { if (!G.slide(p, d.x * 10, d.y * 10, 9)) break; if (i % 3 === 0) R.parts.push({ x: p.x, y: p.y - 18, vx: 0, vy: 0, life: 0.3, max: 0.3, col: '#c8ccd8', size: 7, float: true }); } p.path = null; const x0 = m.px, y0 = m.py, vx = p.x - x0, vy = p.y - y0, L2 = vx * vx + vy * vy || 1; R.rings.push({ x: p.x, y: p.y - 10, r: 60, life: 0.35, col: '#c8ccd8' }); for (const e of R.enemies) { if (e.dead || e.charm > 0) continue; const q = CG.clamp(((e.x - x0) * vx + (e.y - y0) * vy) / L2, 0, 1); if (Math.hypot(e.x - (x0 + vx * q), e.y - (y0 + vy * q)) < 50 + e.r) G.hurtEnemy(e, base * 1.5, p); } G.text(p.x, p.y - 74, '🐺 Grrraou !', '#e0e4f0', true); }
    else if (f.k === 'ours') { G.blast(p.x, p.y - 10, 96, base * 1.8, '#c89a5a'); R.rings.push({ x: p.x, y: p.y, r: 96, life: 0.5, col: '#8a5a2a' }); G.text(p.x, p.y - 80, '🐻 GROAAR !', '#ffd0a0', true); }
    else { const x = p.x + d.x * 120, y = p.y + d.y * 120 - 10; for (let i = 1; i <= 8; i++) R.parts.push({ x: p.x + d.x * i * 15 + rand(-8, 8), y: p.y - 24 + d.y * i * 15 + rand(-8, 8), vx: d.x * 60, vy: d.y * 60 - 20, life: 0.5, max: 0.5, col: i % 2 ? '#ff8a1e' : '#ffe36b', size: 5 + i, float: true }); G.blast(x, y, 92, base * 2, '#ff5a2a'); G.text(p.x, p.y - 80, '😈 Brûlez !', '#ffb080', true); }
  }
  const cast0 = G.cast; G.cast = function (id) {
    const f = Me.F[id]; if (!f) return cast0.apply(this, arguments);
    const S = CG.S, R = CG.R, p = S.player; if (R.ko > 0 || R.cine || R.night) return;
    if (R.meta && R.meta.id === id && R.meta.t > 0) return special(f); // déjà sous cette forme : l'attaque de la créature
    if (R.castCd > 0) return; const cost = G.spellCost(id); if (p.mp < cost) { CG.sfx('no'); G.text(p.x, p.y - 56, 'Pas assez de mana', '#9ab6ff'); return; }
    if (R.mount && CG.Monture && CG.Monture.off) CG.Monture.off();
    p.mp -= cost; R.castCd = 0.6; R.castAnim = 1; CG.sfx('spell'); R.meta = { id, t: Me.DUREE, cd: 0.8, cd2: 0.8 };
    G.puff(p.x, p.y - 24, f.col, 34, 190, 5); G.puff(p.x, p.y - 24, '#ffffff', 16, 120, 4); for (let i = 0; i < 3; i++) R.rings.push({ x: p.x, y: p.y - 10, r: 50 + i * 40, life: 0.4 + i * 0.15, col: f.col });
    G.text(p.x, p.y - 84, f.icon + ' ' + f.nom + ' !', f.col, true); CG.sfx('horn');
  };
  { const mr0 = G.manaRegen; G.manaRegen = function () { return forme() ? 0 : mr0.apply(this, arguments); }; } /* transformé, le mana ne remonte plus tout seul */
  const pd0 = G.playerDmg; G.playerDmg = function () { const f = forme(); return pd0.apply(this, arguments) * (f ? f.dmg : 1); };
  const hm0 = G.heroMul; G.heroMul = function () { const f = forme(); return hm0.apply(this, arguments) * (f ? f.spd : 1); };
  const hp0 = G.hurtPlayer; G.hurtPlayer = function (dmg) { const f = forme(); return hp0.call(this, f ? dmg * f.def : dmg); };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; const p = S.player, m = R.meta;
    if (m) { m.t -= dt; if (m.cd > 0) m.cd -= dt; if (m.cd2 > 0) m.cd2 -= dt; p.mp = Math.max(0, p.mp - (Me.MANA[m.id] || 0) * dt); const vide = p.mp <= 0 && Me.MANA[m.id] > 0; if (vide && !(R.ko > 0)) { G.text(p.x, p.y - 90, 'Plus de mana !', '#9ab6ff', true); CG.sfx('no'); }
      if (m.t <= 0 || vide || R.ko > 0 || R.night) fin(m.t <= 0 || vide);
      else if (m.id === 'metaDemon') { m.feu = (m.feu || 0) - dt; if (m.feu <= 0) { m.feu = 0.7; for (const e of R.enemies) if (!e.dead && !e.struct && !(e.charm > 0) && Math.hypot(e.x - p.x, e.y - p.y) < 70) G.hurtEnemy(e, pd0() * 0.35, p); } } } // le démon brûle ce qui le touche
    const O = R.os; if (O && O.length) { for (const o of O) { o.t += dt; const v = 430 * dt;
        if (!o.retour) { o.x += o.dx * v; o.y += o.dy * v; if (o.t > 0.6 || !W.walkPx(o.x, o.y + 20)) { o.retour = true; o.vus = new Set(); } }
        else { const dx = p.x - o.x, dy = p.y - 20 - o.y, d = Math.hypot(dx, dy) || 1; o.x += dx / d * v * 1.15; o.y += dy / d * v * 1.15; if (d < 22 || o.t > 4) o.fini = true; }
        for (const e of R.enemies) if (!e.dead && !o.vus.has(e) && !(e.charm > 0) && Math.hypot(e.x - o.x, e.y - 16 - o.y) < 22 + e.r) { o.vus.add(e); G.hurtEnemy(e, o.dmg, p); } }
      R.os = O.filter(o => !o.fini); }
  };
  // ---------- le corps de la créature, à la place du chef ----------
  const ell = (g, x, y, rx, ry, f) => { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  const tri = (g, p, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  function corps(g, f, o) {
    const x = o.x, y = o.y, face = o.face < 0 ? -1 : 1, b = { x, y, face, t: o.t, moving: o.moving, step: o.step, atk: o.atk, angry: true };
    if (f.k === 'squelette') Art.humanoid(g, Object.assign(b, { skin: '#eee8d8', tunic: '#cfc8b4', legs: '#d8d2c0', sleeve: '#e0dac8', skull: true, weapon: 'epee', s: 1.3, cape: '#3a2a4a' }));
    else if (f.k === 'demon') { ell(g, x, y + 2, 30, 10, 'rgba(255,80,30,0.25)'); Art.humanoid(g, Object.assign(b, { skin: '#c8322a', tunic: '#2a1a2a', legs: '#1a1018', sleeve: '#c8322a', horns: '#ffcf5a', s: 1.6, eye: '#ffe36b', weapon: 'fouet', ears: true, fangs: true, wings: 'rgba(90,20,20,0.9)' })); }
    else if (f.k === 'loup') { Art.humanoid(g, Object.assign(b, { skin: '#8a8e9a', tunic: '#5a4636', legs: '#6c707c', sleeve: '#8a8e9a', s: 1.5, eye: '#ffe36b', ears: true, fangs: true }));
      g.save(); g.translate(x, y); g.scale(face * 1.5, 1.5); tri(g, [-7, -40, -5, -50, -1, -41], '#6c707c'); tri(g, [1, -41, 5, -50, 7, -40], '#8a8e9a'); ell(g, 6, -31, 5.5, 3.6, '#a8acb8'); ell(g, 10.4, -32, 1.5, 1.3, '#1c1410'); tri(g, [3, -29, 4, -26, 5, -29], '#fff'); tri(g, [7, -29, 8, -26, 9, -29], '#fff'); g.strokeStyle = '#6c707c'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-5, -12); g.quadraticCurveTo(-14, -12, -16, -20 + Math.sin(o.t * 5) * 3); g.stroke(); g.restore(); }
    else { const e = { type: 'ours', x: 0, y: 0, face, seed: 0, moving: o.moving, step: o.step || 0, atkAnim: o.atk > 0 ? Math.min(1, o.atk) : 0, calm: false, slow: 0 }; g.save(); g.translate(x, y); g.scale(1.45, 1.45); Art.beast(g, e, o.t); g.restore(); }
  }
  const gob0 = Art.goblin; Art.goblin = function (g, o) {
    const f = o && o.chief && o.tool === 'baton' && o.dir !== undefined && CG.R ? forme() : null; if (!f) return gob0.apply(this, arguments);
    const a = o.alpha === undefined ? 1 : o.alpha; if (a < 1) { g.save(); g.globalAlpha *= a; } corps(g, f, o); if (a < 1) g.restore();
  };
  const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) {
    mk0.apply(this, arguments); const R = CG.R;
    for (const o of R.os || []) { if (!CG.onScreen(o.x, o.y)) continue; g.save(); g.translate(o.x, o.y); g.rotate(t * 22); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 15, 0, 4); g.stroke(); g.fillStyle = '#f4efe0'; g.fillRect(-11, -2.4, 22, 4.8); [[-11, -3], [-11, 3], [11, -3], [11, 3]].forEach(q => { g.beginPath(); g.arc(q[0], q[1], 3.6, 0, TAU); g.fill(); }); g.restore(); }
    const m = R.meta, f = forme(); if (f && m.cd <= 0 && !(R.ko > 0)) { const p = CG.S.player; g.font = '12px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('✦', p.x + 22, p.y - 70 + Math.sin(t * 6) * 2); } // l'attaque de la créature est prête
  };
  if (CG.Buffs) CG.Buffs.LISTE.push({ k: 'meta', ic: '🐾', nom: () => { const f = forme(); return f ? 'Métamorphose : ' + f.nom : 'Métamorphose'; }, txt: () => { const f = forme(); return f ? '+' + pc(f.dmg) + ' % de dégâts, −' + pc(f.def) + ' % de dégâts reçus. Relance le sort pour : ' + f.coup + ' (' + f.desc + ').' : ''; }, t: () => { const m = CG.R.meta; return m && m.t > 0 ? m.t : 0; } });
  // la pyramide n'a rien à découvrir pour les éclaireurs
  if (CG.Scout && CG.Scout.reveal) { const rv0 = CG.Scout.reveal; CG.Scout.reveal = function () { if (CG.Mondes && CG.Mondes.ici() === 2) return false; return rv0.apply(this, arguments); }; }
})(window.CG);
