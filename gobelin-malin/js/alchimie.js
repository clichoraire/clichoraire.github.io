// Goblin Malin — l'alchimie. Le Chaudron de sorcière se débloque dans l'arbre, et le métier d'Alchimiste avec lui.
//   On poste jusqu'à deux alchimistes par chaudron (à deux, ça va plus vite). Rien ne se passe tant qu'on n'a pas ouvert le chaudron (E)
//   pour choisir la potion à préparer : vie ou mana. Chaque potion demande des os de squelette et du temps.
//   Les potions finies vont dans une caisse posée près du chaudron ; quand elle est pleine, un alchimiste la porte à la réserve,
//   et c'est là seulement qu'on les a. Deux cases de l'arbre améliorent le chaudron : potions moyennes (4 os), puis grosses potions (8 os).
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, W = CG.W, T = CG.TILE, TAU = Math.PI * 2, pick = CG.pick, rand = CG.rand;
  const Al = CG.Alchimie = { POSTES: 2, DEUX: 1.8, CAISSE: 4, OS: [0, 2, 4, 8], DUREE: [0, 60, 90, 120], VIE: [0, 45, 110, 250], MANA: [0, 25, 60, 140], LACHE: { squelette: 1, squeletteRouge: 2, squeletteMage: 2, squeletteNoir: 3 } };
  const TAILLE = ['', 'Petite', 'Moyenne', 'Grosse'], NOMT = ['', 'petite', 'moyenne', 'grosse'];
  CG.RES.os = { nom: 'Os', icon: '🦴' };
  CG.JOBS.alchimiste = { nom: 'Alchimiste', nomF: 'Alchimiste', icon: '⚗️', tech: 'al1', lieu: 'chaudron', desc: 'Prépare des potions au chaudron, avec des os de squelette. Deux alchimistes par chaudron au plus. Il faut d\'abord poser un chaudron et y choisir une potion.' };
  if (!CG.JOB_ORDER.includes('alchimiste')) CG.JOB_ORDER.splice(CG.JOB_ORDER.indexOf('garde'), 0, 'alchimiste');
  if (CG.LINES) CG.LINES.alchimiste = ['Ça bouillonne, ça fume, ça sent le vieux champignon : tout va bien.', 'Deux os, trois tours de louche, et on ne respire pas au-dessus.', 'Si ça devient mauve, on court. Sinon, c\'est prêt.', 'J\'ai goûté la dernière. Mes oreilles ont repoussé, je crois.'];
  // le chaudron : plus une construction de départ, il se gagne dans l'arbre (ceux déjà posés restent)
  { const b = CG.BUILDS.chaudron; if (b) { b.tech = 'al1'; b.desc = 'Un chaudron qui bouillonne tout seul. Poste-y des alchimistes : avec des os de squelette, ils préparent des potions de vie et de mana.'; }
    if (CG.START_BUILDS) { const i = CG.START_BUILDS.indexOf('chaudron'); if (i >= 0) CG.START_BUILDS.splice(i, 1); } }
  [['al1', 0.30, 2, '🫕', 'Chaudron de sorcière', 'Révèle le Chaudron de sorcière, et le métier d\'Alchimiste qui va avec : des petites potions de vie et de mana (2 os chacune).', ['chaudron']],
    ['al2', 0.60, 2, '⚗️', 'Grand chaudron', 'Toutes tes potions de vie et de mana grossissent : la fiole devient un flacon rond, et chaque gorgée rend bien plus.'],
    ['al3', 0.90, 3, '🧪', 'Chaudron des maîtres', 'Toutes tes potions grossissent encore : un gros ballon cerclé d\'or, qui rend énormément.']].forEach(q => { const n = { id: q[0], br: 'sorc', rang: q[1], cout: q[2], t: 5, r: 0, icon: q[3], nom: q[4], desc: q[5] }; if (q[6]) n.unlock = q[6]; CG.TECH.push(n); if (CG.TECH_BY_ID) CG.TECH_BY_ID[n.id] = n; });
  Al.niveau = () => 1 + (G.tech('al2') ? 1 : 0) + (G.tech('al2') && G.tech('al3') ? 1 : 0);
  // Une seule sorte de potion de vie et une seule de mana. Le niveau du chaudron (arbre) les fait toutes évoluer d'un coup : celles qu'on a déjà,
  // celles des marchands, celles qu'on trouve. VIE_MUL : ce que rend la fiole de vie, par rapport à la fiole de départ ; MANA_NIV : le mana rendu.
  Al.VIE_MUL = [0, 1, 2.2, 4.5]; Al.MANA_NIV = [0, 25, 55, 115];
  const niv = () => { try { return Al.niveau(); } catch (e) { return 1; } };
  Al.soinVie = () => CG.fiole ? CG.fiole() : 45; Al.soinMana = () => Al.MANA_NIV[niv()];
  window.addEventListener('DOMContentLoaded', () => { const f0 = CG.fiole || (() => 45); CG.fiole = () => Math.round(f0() * Al.VIE_MUL[niv()] / 5) * 5; Object.defineProperty(Al.MANA, 1, { get: () => Al.MANA_NIV[niv()], enumerable: true, configurable: true });
    CG.Art.fiole = function (g, x, y, s, sorte) { Al.dessin(g, x, y, s, sorte || 'vie', niv()); }; });
  // le flacon : une fiole étroite, puis une fiole à fond large (en triangle), puis un gros ballon cerclé d'or. Rouge pour la vie, bleu pour le mana.
  const COUL = { vie: ['#d81e2c', '#ff5a62', '#5a1018'], mana: ['#1e6ad8', '#5aa8ff', '#10285a'] };
  Al.svg = function (sorte, n) { const c = COUL[sorte] || COUL.vie; n = n || niv(); const debut = '<svg class="fiole" viewBox="-10 -17 20 27" width="20" height="27">', bouchon = '<rect x="-3" y="-15.5" width="6" height="4.5" rx="1" fill="#8a5a2a"/>';
    if (n <= 1) return debut + '<rect x="-2.6" y="-15.5" width="5.2" height="4" rx="1" fill="#8a5a2a"/><path d="M-3.6 -11.5 H3.6 V4.5 A3.6 3.6 0 0 1 -3.6 4.5 Z" fill="#e4f2ff" stroke="' + c[2] + '" stroke-width="1.1"/><path d="M-2.7 -3 H2.7 V4.4 A2.7 2.7 0 0 1 -2.7 4.4 Z" fill="' + c[0] + '"/><ellipse cy="-3" rx="2.7" ry="0.9" fill="' + c[1] + '"/><rect x="-2" y="-9.5" width="1" height="11" rx="0.5" fill="#fff" opacity="0.7"/></svg>';
    if (n === 2) return debut + bouchon + '<path d="M-2.6 -11.5 H2.6 V-6 L8.3 6.6 Q9 9 6.6 9 H-6.6 Q-9 9 -8.3 6.6 L-2.6 -6 Z" fill="#e4f2ff" stroke="' + c[2] + '" stroke-width="1.2" stroke-linejoin="round"/><path d="M-5.1 0.6 H5.1 L7.2 6.3 Q7.7 7.9 6.2 7.9 H-6.2 Q-7.7 7.9 -7.2 6.3 Z" fill="' + c[0] + '"/><ellipse cy="0.6" rx="5.1" ry="1.2" fill="' + c[1] + '"/><path d="M-1.6 -9.5 V-5.4 L-5.4 3.4" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity="0.75"/></svg>';
    return debut + bouchon + '<rect x="-2.8" y="-11.5" width="5.6" height="5" fill="#e4f2ff"/><ellipse cy="0.6" rx="9.3" ry="8.6" fill="#e4f2ff" stroke="' + c[2] + '" stroke-width="1.2"/><path d="M-8.2 -2.6 A8.3 7.6 0 0 0 8.2 -2.6 Z" fill="' + c[0] + '"/><ellipse cy="-2.6" rx="8.1" ry="1.7" fill="' + c[1] + '"/><rect x="-3.6" y="-8.4" width="7.2" height="2.2" rx="1" fill="#f0c84a" stroke="#8a6a1a" stroke-width="0.5"/><ellipse cx="-4.4" cy="-1" rx="1.5" ry="3.2" fill="#fff" opacity="0.75" transform="rotate(25 -4.4 -1)"/><path d="M5 3 l0.9 1.8 1.8 0.9 -1.8 0.9 -0.9 1.8 -0.9 -1.8 -1.8 -0.9 1.8 -0.9 Z" fill="#fff6c0"/></svg>'; };
  Al.dessin = function (g, x, y, s, sorte, n) { const c = COUL[sorte] || COUL.vie; g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 1.1; g.strokeStyle = c[2];
    if (n <= 1) { g.fillStyle = '#8a5a2a'; g.fillRect(-2.6, -14.6, 5.2, 3.4); g.fillStyle = 'rgba(214,232,250,0.96)'; g.fillRect(-4.4, -11.9, 8.8, 1.6); g.beginPath(); g.moveTo(-3.6, -11.5); g.lineTo(3.6, -11.5); g.lineTo(3.6, 4.5); g.arc(0, 4.5, 3.6, 0, Math.PI); g.closePath(); g.fill(); g.fillStyle = c[0]; g.beginPath(); g.moveTo(-2.7, -3); g.lineTo(2.7, -3); g.lineTo(2.7, 4.4); g.arc(0, 4.4, 2.7, 0, Math.PI); g.closePath(); g.fill(); g.fillStyle = c[1]; g.beginPath(); g.ellipse(0, -3, 2.7, 0.9, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(-2, -9.5, 1, 11); }
    else if (n === 2) { g.fillStyle = '#8a5a2a'; g.fillRect(-3, -15.5, 6, 4.5); g.lineJoin = 'round'; g.fillStyle = 'rgba(214,232,250,0.96)'; g.beginPath(); g.moveTo(-2.6, -11.5); g.lineTo(2.6, -11.5); g.lineTo(2.6, -6); g.lineTo(8.3, 6.6); g.quadraticCurveTo(9, 9, 6.6, 9); g.lineTo(-6.6, 9); g.quadraticCurveTo(-9, 9, -8.3, 6.6); g.lineTo(-2.6, -6); g.closePath(); g.fill();
      g.fillStyle = c[0]; g.beginPath(); g.moveTo(-5.1, 0.6); g.lineTo(5.1, 0.6); g.lineTo(7.2, 6.3); g.quadraticCurveTo(7.7, 7.9, 6.2, 7.9); g.lineTo(-6.2, 7.9); g.quadraticCurveTo(-7.7, 7.9, -7.2, 6.3); g.closePath(); g.fill(); g.fillStyle = c[1]; g.beginPath(); g.ellipse(0, 0.6, 5.1, 1.2, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineCap = 'round'; g.beginPath(); g.moveTo(-1.6, -9.5); g.lineTo(-1.6, -5.4); g.lineTo(-5.4, 3.4); g.stroke(); }
    else { const gros = n >= 3, rx = gros ? 9.3 : 7.8, ry = gros ? 8.6 : 7.8, cy = gros ? 0.6 : 0, ly = gros ? -2.6 : -1.2; g.fillStyle = '#8a5a2a'; g.fillRect(-3, -15.5, 6, 4.5); g.fillStyle = 'rgba(214,232,250,0.96)'; g.fillRect(-2.7, -11.5, 5.4, 6); g.beginPath(); g.ellipse(0, cy, rx, ry, 0, 0, TAU); g.fill();
      g.fillStyle = c[0]; g.beginPath(); g.ellipse(0, cy, rx - 1.2, ry - 1.2, 0, -0.28, Math.PI + 0.28); g.closePath(); g.fill(); g.fillStyle = c[1]; g.beginPath(); g.ellipse(0, ly, rx - 1.5, 1.6, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(-rx * 0.42, cy - 1.4, 1.4, 3, 0.45, 0, TAU); g.fill();
      if (gros) { g.fillStyle = '#f0c84a'; g.fillRect(-3.6, -8.4, 7.2, 2.2); g.fillStyle = '#fff6c0'; g.beginPath(); g.moveTo(5, 3); g.lineTo(5.9, 4.8); g.lineTo(7.7, 5.7); g.lineTo(5.9, 6.6); g.lineTo(5, 8.4); g.lineTo(4.1, 6.6); g.lineTo(2.3, 5.7); g.lineTo(4.1, 4.8); g.closePath(); g.fill(); } }
    g.restore(); };
  const R_ = () => CG.R, etats = () => CG.S.alchimie || (CG.S.alchimie = {}), cle = b => b.tx + ',' + b.ty, etat = b => etats()[cle(b)] || (etats()[cle(b)] = { r: null, prog: 0, paye: false, caisse: 0, cr: null });
  const chaudrons = () => CG.S.buildings.filter(b => b.type === 'chaudron' && !b.site);
  const centre = b => ({ x: (b.tx + b.w / 2) * T, y: (b.ty + b.h) * T - 6 });
  const poste = (b, i) => { const c = centre(b); return { x: c.x + (i ? 34 : -34), y: c.y + 6 }; };
  const caissePos = b => { const c = centre(b); return { x: c.x + 4, y: c.y + 30 }; };
  const spe = r => (r && Al.SPE && Al.SPE[r.slice(0, -1)]) || null; // les potions à recette (potions.js)
  const nomR = r => spe(r) ? spe(r).nom.toLowerCase() : NOMT[+r.slice(-1)] + (r[0] === 'v' ? ' potion de vie' : ' potion de mana'), icR = r => spe(r) ? spe(r).ic : r[0] === 'v' ? '❤️' : '💧';
  Al.cout = r => !r ? 0 : spe(r) ? spe(r).os : Al.OS[+r.slice(-1)]; Al.temps = r => spe(r) ? spe(r).temps : Al.DUREE[+r.slice(-1)]; Al.coul = r => spe(r) ? spe(r).col : (r || 'v')[0] === 'v' ? '#e8506a' : '#4a9af0';
  // ---------- les os ----------
  const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments), S = CG.S; S.res.os = S.res.os || 0; const p = S.player; p.fioles = Object.assign({ vie2: 0, vie3: 0, mana1: 0, mana2: 0, mana3: 0 }, p.fioles || {}); return r; };
  const he0 = G.hurtEnemy; G.hurtEnemy = function (e) { const r = he0.apply(this, arguments); if (e && e.dead && !e.osLache && Al.LACHE[e.type]) { e.osLache = true; G.dropRes(e.x, e.y, 'os', Al.LACHE[e.type]); } return r; };
  // ---------- les potions du chef ----------
  const fi = () => CG.S.player.fioles || (CG.S.player.fioles = { vie2: 0, vie3: 0, mana1: 0, mana2: 0, mana3: 0 });
  Al.ranger = function (r, n) { const p = CG.S.player, f = fi(); if (/^vie[123]$/.test(r)) p.potions = (p.potions || 0) + n; else if (/^mana[123]$/.test(r)) f.mana1 = (f.mana1 || 0) + n; else if (spe(r)) { const k = r.slice(0, -1); f[k] = (f[k] || 0) + n; } else f[r] = (f[r] || 0) + n; };
  const dp0 = G.drinkPotion; G.drinkPotion = function () { // Q : la plus petite potion de vie qui suffit, sinon la plus grosse qu'on a
    const S = CG.S, R = CG.R, p = S.player, f = fi(); if (!(f.vie2 > 0) && !(f.vie3 > 0)) return dp0.apply(this, arguments);
    if (p.hp >= p.maxhp || R.ko > 0) { CG.sfx('no'); return; } const manque = p.maxhp - p.hp, a = [p.potions > 0, f.vie2 > 0, f.vie3 > 0];
    let n = 0; for (let i = 1; i <= 3; i++) if (a[i - 1] && Al.VIE[i] >= manque) { n = i; break; } if (!n) for (let i = 3; i >= 1; i--) if (a[i - 1]) { n = i; break; }
    if (n === 1) return dp0.apply(this, arguments); f['vie' + n]--; p.hp = Math.min(p.maxhp, p.hp + Al.VIE[n]); G.text(p.x, p.y - 56, '+' + Al.VIE[n] + ' ❤️', '#ff8a8a'); CG.sfx('heal');
  };
  G.drinkMana = function () { // Z : pareil pour le mana
    const S = CG.S, R = CG.R, p = S.player, f = fi(); if (p.mp >= p.maxmp || R.ko > 0 || !(f.mana1 > 0 || f.mana2 > 0 || f.mana3 > 0)) { CG.sfx('no'); return; } const manque = p.maxmp - p.mp;
    let n = 0; for (let i = 1; i <= 3; i++) if (f['mana' + i] > 0 && Al.MANA[i] >= manque) { n = i; break; } if (!n) for (let i = 3; i >= 1; i--) if (f['mana' + i] > 0) { n = i; break; }
    f['mana' + n]--; p.mp = Math.min(p.maxmp, p.mp + Al.MANA[n]); G.text(p.x, p.y - 56, '+' + Al.MANA[n] + ' 💧', '#9ad0ff'); CG.sfx('heal');
  };
  /* une nouvelle partie commence avec quelques fioles de mana */
  Al.DEPART_MANA = 2; { const ns = G.newState; if (ns) G.newState = function () { const S = ns.apply(this, arguments); if (S && S.player) S.player.fioles = Object.assign({ vie2: 0, vie3: 0, mana1: Al.DEPART_MANA, mana2: 0, mana3: 0 }, S.player.fioles || {}); return S; }; }
  // sous la fiole du haut de l'écran : les potions moyennes et grosses, et celles de mana
  let hudT = 0, hudK = '';
  function hud() { const p = CG.S.player, f = fi(); if (f.vie2 || f.vie3) { p.potions = (p.potions || 0) + (f.vie2 || 0) + (f.vie3 || 0); f.vie2 = f.vie3 = 0; } if (f.mana2 || f.mana3) { f.mana1 = (f.mana1 || 0) + (f.mana2 || 0) + (f.mana3 || 0); f.mana2 = f.mana3 = 0; } /* plus qu'une sorte de chaque : les anciennes moyennes et grosses rejoignent le tas */ const k = [f.vie2, f.vie3, f.mana1, f.mana2, f.mana3, Math.floor(CG.S.res.os || 0)].join(','); if (k === hudK) return; hudK = k;
    let el = document.getElementById('potions2'); const base = document.getElementById('potions'); if (!el && base) { el = document.createElement('div'); el.id = 'potions2'; el.style.cssText = 'font-size:13px;margin-top:3px;line-height:1.5;color:#f0e6d0'; base.parentNode.insertBefore(el, base.nextSibling); } if (!el) return;
    const l = []; if (f.vie2 || f.vie3) l.push('❤️ moyennes <b>' + f.vie2 + '</b> · grosses <b>' + f.vie3 + '</b> <small>(Q)</small>'); if (f.mana2 || f.mana3) l.push('💧 moyennes <b>' + f.mana2 + '</b> · grosses <b>' + f.mana3 + '</b> <small>(Z)</small>');
    el.innerHTML = l.join('<br>'); void p; }
  // ---------- l'alchimiste au travail ----------
  const auPoste = b => CG.S.goblins.filter(g => g.job === 'alchimiste' && g.chaud === cle(b) && !g.exile);
  function choisir(g) { let best = null, bd = 1e9; for (const b of chaudrons()) { if (auPoste(b).filter(o => o !== g).length >= Al.POSTES) continue; const c = centre(b), d = Math.hypot(c.x - g.x, c.y - g.y); if (d < bd) { bd = d; best = b; } } return best; }
  Al.step = function (g, dt) {
    const S = CG.S; let b = g.chaud && chaudrons().find(q => cle(q) === g.chaud); g.auChaudron = false;
    if (g.porte) { // il porte la caisse pleine à la réserve
      if (g.state !== 'toStock') { const st = G.dropPoint(g) || G.firePos(); G.goTo(g, st.x + rand(-20, 20), st.y + rand(0, 8)); g.state = 'toStock'; g.carry = 'caisse'; g.pose = null; }
      if (G.follow(g, 88, dt)) { const q = g.porte; g.porte = null; g.carry = null; g.state = 'idle'; Al.ranger(q.r, q.n); G.text(g.x, g.y - 44, '+' + q.n + ' ' + icR(q.r) + '🧪', '#bfe8ff', true); if (CG.onScreen(g.x, g.y)) CG.sfx('coin'); UI.toast('⚗️ ' + g.name + ' a rangé une caisse : +' + q.n + ' ' + '× ' + nomR(q.r) + '.'); hudK = ''; }
      return true;
    }
    if (!b) { b = choisir(g); g.chaud = b ? cle(b) : null; g.state = 'idle'; if (!b) { g.moving = false; g.bubble = '❓'; return true; } }
    const k = auPoste(b).indexOf(g); if (k >= Al.POSTES) { g.chaud = null; return true; } const q = poste(b, k);
    if (g.state !== 'work' && g.state !== 'toPoste') { if (!G.goTo(g, q.x, q.y)) { g.moving = false; return true; } g.state = 'toPoste'; g.bubble = null; }
    if (g.state === 'toPoste') { if (G.follow(g, 92, dt)) { g.state = 'work'; g.moving = false; } return true; }
    const e = etat(b); g.moving = false; g.face = centre(b).x >= g.x ? 1 : -1; g.auChaudron = true;
    if (!e.r) { g.pose = null; g.bubble = '❔'; return true; } // personne n'a encore dit quoi préparer
    if (!e.paye && (S.res.os || 0) < Al.cout(e.r)) { g.pose = null; g.bubble = '🦴'; return true; }
    g.pose = 'work'; g.bubble = null; return true;
  };
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; hudT -= dt; if (hudT <= 0) { hudT = 0.4; hud(); }
    if (R.night || R.cine || !S.alchimie) return;
    for (const b of chaudrons()) {
      const e = etats()[cle(b)]; if (!e || !e.r) continue; if (/^(vie|mana)[23]$/.test(e.r)) e.r = e.r.slice(0, -1) + '1'; if (e.cr && /^(vie|mana)[23]$/.test(e.cr)) e.cr = e.cr.slice(0, -1) + '1'; const n = +e.r.slice(-1); if (n > Al.niveau()) { e.r = null; continue; }
      const la = auPoste(b).filter(g => g.state === 'work' && !g.porte && !g.hidden && g.ko !== true); if (!la.length) continue;
      if (e.cr && e.cr !== e.r && e.caisse > 0) { // on a changé de recette : la caisse entamée part telle quelle
        const g = la[0]; g.porte = { r: e.cr, n: e.caisse }; e.caisse = 0; e.cr = null; continue; }
      if (!e.paye) { const c = Al.cout(e.r); if ((S.res.os || 0) < c) continue; S.res.os -= c; e.paye = true; e.prog = 0; hudK = ''; }
      let v = 0; la.forEach(g => { v += 1 + (g.lvl - 1) * 0.08; }); if (la.length > 1) v = v / la.length * Al.DEUX; e.prog += dt * v / Al.temps(e.r);
      if (Math.random() < dt * 3) { const c = centre(b); G.puff(c.x + rand(-8, 8), c.y - 34, spe(e.r) ? spe(e.r).col : e.r[0] === 'v' ? '#ff8a9a' : '#8ac8ff', 1, 40, 3); }
      if (e.prog < 1) continue; e.prog = 0; e.paye = false; e.caisse++; e.cr = e.r; const c = caissePos(b); G.text(c.x, c.y - 26, '+1 ' + icR(e.r), '#fff'); if (CG.onScreen(c.x, c.y)) CG.sfx('ok');
      la.forEach(g => { if (G.gobXp) G.gobXp(g, 1, 6); });
      if (e.caisse >= Al.CAISSE) { const g = la[la.length - 1]; g.porte = { r: e.cr, n: e.caisse }; e.caisse = 0; e.cr = null; G.say(g, pick(['Caisse pleine ! Je la porte à la réserve.', 'Et voilà la dernière. Poussez-vous, c\'est fragile !']), 3); }
    }
  };
  // un alchimiste qu'on change de métier lâche son poste
  const sj0 = UI.setJob; UI.setJob = function (g, id) { const r = sj0.apply(this, arguments); if (g && g.job !== 'alchimiste') { g.chaud = null; g.porte = null; g.auChaudron = false; } return r; };
  // ---------- le menu du chaudron ----------
  const fi0 = D.findInteract; D.findInteract = function () {
    const it = fi0.apply(this, arguments), S = CG.S, R = CG.R, p = S.player; if (R.ko > 0 || R.cine || R.build) return it;
    if (it && it.type !== 'home' && it.type !== 'hut' && !(it.type === 'goblin' && it.obj && it.obj.job === 'alchimiste' && it.obj.auChaudron)) return it;
    for (const b of chaudrons()) { const c = centre(b); if (Math.hypot(c.x - p.x, c.y - 12 - p.y) < 58) return { type: 'chaudron', obj: b, label: 'Ouvrir le chaudron ⚗️' }; }
    return it;
  };
  const in0 = D.interact; D.interact = function () { const it = D.findInteract(); if (it && it.type === 'chaudron') return Al.menu(it.obj); return in0.apply(this, arguments); };
  if (!document.getElementById('ch-css')) { const st = document.createElement('style'); st.id = 'ch-css'; st.textContent =
    '#panel.chaudron{background:radial-gradient(circle at 50% 0,#2c4a34,#16241c 60%,#0c1410);border:2px solid #5a9a6a;box-shadow:0 0 50px rgba(90,220,130,.35),inset 0 0 40px rgba(0,0,0,.5);text-align:center;max-width:760px;color:#e4f4e0}' +
    '.ch-titre{font:700 30px Luminari,"Apple Chancery",Georgia,fantasy;color:#d8ffd0;text-shadow:0 0 16px #50d070,0 3px 0 #0c1a10}.ch-titre span{font-size:17px;color:#8ae0a0}' +
    '.ch-pot{font-size:50px;line-height:1;margin:2px 0 0;filter:drop-shadow(0 0 16px rgba(90,230,130,.7));animation:chBulle 2.4s ease-in-out infinite alternate}@keyframes chBulle{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-6px) rotate(2deg)}}' +
    '.ch-infos{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin:6px 0 8px}.ch-infos span{padding:4px 10px;font-size:13px;background:rgba(8,20,12,.6);border:1px solid rgba(120,220,150,.35);border-radius:14px}' +
    '.ch-grille{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:0 4px 12px}.ch-r{padding:6px 6px;border-radius:10px;border:2px solid rgba(120,220,150,.3);background:rgba(8,20,12,.55);color:#e4f4e0;cursor:pointer;font:inherit}.ch-r b{display:block;font-size:15px}.ch-r small{display:block;font-size:12px;opacity:.85;margin-top:2px}.ch-r:hover:not(:disabled){border-color:#8af0a8;background:rgba(30,60,40,.7)}.ch-r.on{border-color:#ffe36b;box-shadow:0 0 14px rgba(255,227,107,.5);background:rgba(60,56,20,.6)}.ch-r:disabled{opacity:.42;cursor:not-allowed}' +
    '.ch-barre{height:18px;margin:0 30px 6px;border-radius:9px;background:rgba(0,0,0,.5);overflow:hidden;position:relative}.ch-barre i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#3aa860,#9af0a8)}.ch-barre u{position:absolute;inset:0;font-size:12px;line-height:18px;text-decoration:none;color:#fff;text-shadow:0 1px 2px #000}' +
    '.ch-note{font-size:13.5px;opacity:.9;margin:4px 20px 12px}.ch-btns button{padding:8px 22px}';
    document.head.appendChild(st); }
  Al.menu = function (b) {
    if (!UI.open) return; const S = CG.S, e = etat(b), nv = Al.niveau(), la = auPoste(b), os = Math.floor(S.res.os || 0), f = fi(), p = S.player;
    let cartes = ''; ['vie', 'mana'].forEach(s => { const id = s + 1; /* une seule potion de chaque sorte : c'est le niveau du chaudron qui dit ce qu'elle vaut */
      cartes += '<button class="ch-r' + (e.r === id ? ' on' : '') + '" data-r="' + id + '"><b>' + Al.svg(s) + ' ' + TAILLE[nv] + ' potion de ' + s + '</b><small>+' + (s === 'vie' ? Al.soinVie() + ' vie' : Al.soinMana() + ' mana') + ' · ' + Al.OS[1] + ' 🦴 · ' + Al.DUREE[1] + ' s' + (nv < 3 ? ' · plus grosse au niveau ' + (nv + 1) : '') + '</small></button>'; });
    if (Al.cartes) cartes += Al.cartes(e);
    const manque = e.r && !e.paye && os < Al.cout(e.r);
    const note = !la.length ? 'Personne au poste. Parle à un gobelin et donne-lui le métier d\'Alchimiste (deux au plus par chaudron).' : !e.r ? 'Tes alchimistes attendent : choisis la potion à préparer.' : manque ? 'Il manque des os : il en faut ' + Al.cout(e.r) + ' par potion. Les squelettes en laissent tomber : ramasse-les et porte-les à un alchimiste (parle-lui).' : 'Ça mijote tout seul. Quand la caisse est pleine (' + Al.CAISSE + '), un alchimiste la porte à la réserve.';
    UI.open('chaudron', '<div class="ch-titre"><span>✦</span> Chaudron de sorcière <span>✦</span></div><div class="ch-pot">🫕</div>'
      + '<div class="ch-infos"><span>⚗️ Chaudron niveau <b>' + nv + '</b> / 3</span><span>🧑‍🔬 <b>' + la.length + '</b> / ' + Al.POSTES + ' alchimiste' + (la.length > 1 ? 's' : '') + (la.length > 1 ? ' (plus vite)' : '') + '</span><span>🦴 <b>' + os + '</b> os</span><span>📦 Caisse <b>' + e.caisse + '</b> / ' + Al.CAISSE + '</span></div>'
      + '<div class="ch-grille">' + cartes + '</div>'
      + (e.r ? '<div class="ch-barre"><i style="width:' + Math.round((e.paye ? e.prog : 0) * 100) + '%"></i><u>' + (e.paye ? 'En préparation : ' + nomR(e.r) + ' · ' + Math.round(e.prog * 100) + ' %' : 'Prochaine : ' + nomR(e.r)) + '</u></div>' : '')
      + '<p class="ch-note">' + note + '<br>Dans ta besace : ❤️ ' + (p.potions || 0) + ' (Q pour boire) &nbsp; 💧 ' + (f.mana1 || 0) + ' (Z pour boire)' + (Al.besaceTxt ? Al.besaceTxt() : '') + '</p>'
      + '<div class="ch-btns">' + (e.r ? '<button id="ch-stop">⏸ Arrêter la préparation</button> ' : '') + '<button id="ch-non">Refermer (Échap)</button></div>', true, true);
    const pan = document.getElementById('panel'); pan.className = 'chaudron'; document.getElementById('modal').classList.add('flou');
    pan.querySelectorAll('[data-r]').forEach(bt => bt.onclick = () => { const id = bt.dataset.r; if (+id.slice(-1) > Al.niveau()) return; if (e.r !== id) { if (e.paye) { S.res.os += Al.cout(e.r); e.paye = false; } e.r = id; e.prog = 0; CG.sfx('ok'); } Al.menu(b); });
    const st = document.getElementById('ch-stop'); if (st) st.onclick = () => { if (e.paye) { S.res.os += Al.cout(e.r); e.paye = false; } e.r = null; e.prog = 0; Al.menu(b); };
    document.getElementById('ch-non').onclick = UI.dismiss;
  };
  // ---------- la caisse près du chaudron ----------
  const caisse = { b: null, draw(g, o, t) { const b = this.b, e = etats()[cle(b)]; if (!e) return; const c = caissePos(b), n = e.caisse, col = Al.coul(e.cr || e.r);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(c.x, c.y + 2, 17, 4.5, 0, 0, TAU); g.fill();
    for (let i = 0; i < n; i++) { const x = c.x - 9 + i * 6, y = c.y - 12; g.fillStyle = col; g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill(); g.fillStyle = '#e8e2d0'; g.fillRect(x - 1.2, y - 6.4, 2.4, 3.6); g.fillStyle = '#8a5a2a'; g.fillRect(x - 1.5, y - 7.6, 3, 1.6); }
    g.fillStyle = '#8a6236'; g.fillRect(c.x - 14, c.y - 10, 28, 11); g.fillStyle = '#6e4c28'; g.fillRect(c.x - 14, c.y - 10, 28, 2.4); g.fillRect(c.x - 14, c.y - 1.4, 28, 2.4); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(c.x - 5.4, c.y - 10, 1.4, 11); g.fillRect(c.x + 4, c.y - 10, 1.4, 11);
    if (e.r && e.paye) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(c.x - 14, c.y + 5, 28, 3.4); g.fillStyle = '#9af0a8'; g.fillRect(c.x - 14, c.y + 5, 28 * Math.min(1, e.prog), 3.4); } } };
  if (CG.Armee) { const po0 = CG.Armee.pousser; CG.Armee.pousser = function (push) { po0.apply(this, arguments); const S = CG.S; if (!S || !S.alchimie) return; for (const b of chaudrons()) { const e = S.alchimie[cle(b)]; if (!e || (!e.r && !e.caisse)) continue; const c = caissePos(b); if (!CG.onScreen(c.x, c.y)) continue; push(c.y, 21, { b, draw: caisse.draw }, null); } }; }
  // ---------- plus d'os : c'est l'alchimiste qui le dit en premier, dès qu'on vient lui parler ----------
  Al.SANS_OS = ['Salut, chef ! Je n\'ai plus d\'os pour faire les potions magiques. Tu m\'en rapportes ?', 'Ah, chef ! Mon chaudron est vide : il me faut des os. Les squelettes en ont plein.', 'Chef, plus un seul os ! Sans os, pas de potion. Va taper sur quelques squelettes.', 'Bonjour chef. Je tourne ma louche dans le vide : plus d\'os. Tu peux m\'en trouver ?'];
  { const dl0 = CG.UI.dialog; CG.UI.dialog = function (o) {
    const g = o && o.goblin, S = CG.S; if (g && g.job === 'alchimiste' && S && Array.isArray(o.options) && o.options.some(x => x && /^🛠/.test(x.label || '')) && (g.bubble === '🦴' || (S.res.os || 0) < Al.OS[1])) o = Object.assign({}, o, { text: CG.pick(Al.SANS_OS) });
    return dl0.call(this, o);
  }; }
  // ---------- toujours des squelettes quelque part dans le monde : leurs os servent aux potions ----------
  Al.SQUELETTES = 5;
  { const rw0 = D.rollWild; D.rollWild = function () {
    const r = rw0.apply(this, arguments), S = CG.S, R = CG.R; if (!S || !R || (CG.Mondes && CG.Mondes.ici() === 2)) return r;
    let n = R.enemies.filter(e => !e.dead && Al.LACHE[e.type]).length; if (n >= Al.SQUELETTES || !CG.ENEMIES.squelette) return r;
    const f = W.field ? W.field() : null;
    for (let k = 0; k < 600 && n < Al.SQUELETTES; k++) { // par petites bandes de deux, loin du village
      const tx = CG.irand(3, CG.MW - 4), ty = CG.irand(3, CG.MH - 4); if ((f && f[W.idx(tx, ty)] < 0) || !W.walkTile(tx, ty) || Math.hypot(tx - W.CX, ty - W.CY) < 16 || S.buildings.some(b => Math.hypot(b.tx - tx, b.ty - ty) < 7)) continue;
      for (let i = 0; i < 2 && n < Al.SQUELETTES; i++) { const e = G.spawnEnemy('squelette', tx * T + T / 2 + rand(-14, 14), ty * T + T / 2 + rand(-10, 10), { wild: true }); if (e) n++; }
    }
    return r;
  }; }
})(window.CG);
