#!/usr/bin/env node
// Vérifie que la course UN est faisable sans pouvoir, et que le puits au-dessus demande (et accepte) le saut mural.
// Recherche A* sur la vraie physique (js/physics.js). Usage : node tools/test-course.cjs   (depuis PaperLoop)
'use strict';
const path = require('path');
const PL = require(path.join(__dirname, '..', 'js', 'physics.js'));
require(path.join(__dirname, '..', 'js', 'world.js'));
const TICK = 1 / 20, MAX_T = 60, MAX_STATES = 2e6, WEIGHT = 2.5;

class Heap { constructor() { this.a = []; } push(f, v) { const a = this.a; a.push([f, v]); let i = a.length - 1; while (i) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() { const a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; } get size() { return this.a.length; } }

function search(lvl, cfg, s0in) {
  const actions = [{ dir: 1, held: true }, { dir: 1, held: false }, { dir: -1, held: true }, { dir: -1, held: false }, { dir: 0, held: false }, { dir: 0, held: true }];
  if (cfg.dashLevel > 0) actions.push({ dir: 1, held: false, dash: true }, { dir: 1, held: true, dash: true }, { dir: -1, held: false, dash: true });
  const seen = new Set(); const f = lvl.finish; const fx = f.x + 24, fy = f.y;
  const h = s => Math.abs(s.x + 14 - fx) / (PL.PHYS.RUN * 1.05) + Math.max(0, (s.y + 56 - fy - 48)) / 900;
  // Près de l'ascenseur (sous le trou), la phase de la plateforme compte : on ajoute le temps à la clé.
  const key = s => [Math.round(s.x / 12), Math.round(s.y / 12), Math.round(s.vx / 160), Math.round(s.vy / 300), s.held ? 1 : 0, s.prevHeld ? 1 : 0, s.ground ? 1 : 0, s.wallDir, Math.round(s.wallT * 20), (lvl.movers.length && s.x < 38 * 48 && s.y > 21 * 48) ? Math.round(s.t * 8) : 0, cfg.dashLevel > 0 ? Math.round((s.dashCd || 0) * 10) : 0].join(',');
  const open = new Heap(); const s0 = s0in ? Object.assign({}, s0in, { win: false, act: null, parent: null }) : Object.assign(PL.newState(lvl), { prevHeld: false });
  open.push(h(s0), s0); let states = 0, far = 0, high = 1e9;
  while (open.size) {
    const [, s] = open.pop();
    if (s.t > MAX_T) return { ok: false, reason: 'temps écoulé', states };
    for (const a of actions) {
      const n = Object.assign({}, s, { act: a, parent: s });
      PL.advance(n, { dir: a.dir, jump: a.held && !s.prevHeld, jumpHeld: a.held, dash: !!a.dash }, TICK, lvl, cfg);
      n.prevHeld = a.held;
      if (n.deaths > s.deaths) continue;
      if (n.win) { const acts = []; for (let q = n; q.act; q = q.parent) acts.push(q.act); acts.reverse(); return { ok: true, time: n.t, states, acts, end: n }; }
      const k = key(n); if (seen.has(k)) continue; seen.add(k); states++;
      far = Math.max(far, n.x); high = Math.min(high, n.y);
      open.push(n.t + WEIGHT * h(n), n);
    }
    if (states > MAX_STATES) return { ok: false, reason: 'trop d’états', states, far, high };
  }
  return { ok: false, reason: 'cul-de-sac', states, far, high };
}

// Construit un tableau avec S et F posés sur la carte du monde.
// Parcours long qui part dans le mauvais sens pour l'heuristique : on le coupe en segments (points de passage `via`),
// chaque segment repart de l'état exact atteint par le précédent, et on concatène les actions.
// Attention : la physique gèle l'état dès que F est touché (au milieu d'un pas de 1/20 s parfois), donc l'état de fin d'un
// segment est rejoué depuis le départ sur une carte SANS F pour repartir de l'état exact que le jeu produira.
function searchVia(mk, via, cfg) {
  const plain = mk(null, null); let s0 = null, acts = [], states = 0, time = 0;
  for (const [fx, fy] of via) {
    const r = search(mk(fx, fy), cfg, s0); states += r.states; if (!r.ok) return Object.assign(r, { states });
    acts = acts.concat(r.acts); time = r.time;
    s0 = Object.assign(PL.newState(plain), { prevHeld: false });
    for (const a of acts) { PL.advance(s0, { dir: a.dir, jump: a.held && !s0.prevHeld, jumpHeld: a.held, dash: !!a.dash }, TICK, plain, cfg); s0.prevHeld = a.held; }
  }
  return { ok: true, time, states, acts };
}
function level(sx, sy, fx, fy, variant) {
  const rows = PL.WORLD.map.map(r => r.split(''));
  rows[sy][sx] = 'S'; if (fx != null) rows[fy][fx] = 'F';
  if (variant === 'noP1') for (let x = 43; x <= 46; x++) rows[27][x] = ' ';   // sans la plateforme 1 : seule la cheminée (raccourci) reste
  // Pour les tests de course, on ferme la sortie de la salle du retour vers le puits : y entrer depuis le puits (élan au bon
  // moment en glissant sur le mur) est possible mais ne lance pas la course, donc l'A* ne doit pas passer par là.
  if (variant === 'closed2') for (let y = 17; y <= 18; y++) rows[y][78] = '#';
  if (variant === 'closed3') for (let y = 12; y <= 13; y++) rows[y][195] = '#';
  if (variant === 'pit') { for (let x = 105; x <= 111; x++) rows[33][x] = '^'; for (const [y, x0, x1] of [[30, 106, 107], [29, 109, 110]]) for (let x = x0; x <= x1; x++) rows[y][x] = ' '; }   // fossé mortel sans ses marches : seul l'élan passe
  return PL.parseLevel({ id: 'test', map: rows.map(r => r.join('')) });
}
const c = PL.WORLD.courses[0], c2 = PL.WORLD.courses[1], c3 = PL.WORLD.courses[2];
const wall = () => Object.assign(PL.defaultCfg(), { wall: true }), wallDash = () => Object.assign(PL.defaultCfg(), { wall: true, dashLevel: 1 });
const tests = [
  { name: 'Course UN sans pouvoir (du départ à la tirelire)', lvl: level(c.start.tx, c.start.ty - 1, c.goal.tx, c.goal.ty + 1), cfg: PL.defaultCfg(), expect: true, key: "course" },
  { name: 'Puits sans saut mural (doit échouer)', lvl: level(c.goal.tx, c.goal.ty + 1, 44, 5), cfg: PL.defaultCfg(), expect: false },
  { name: 'Puits avec saut mural', lvl: level(c.goal.tx, c.goal.ty + 1, 44, 5), cfg: wall(), expect: true, key: "shaft" },
  { name: 'Retour de la tirelire au pas de départ (le trou à gauche)', lvl: level(c.goal.tx, c.goal.ty + 1, c.start.tx - 1, c.start.ty - 1), cfg: PL.defaultCfg(), expect: true, key: 'back' },
  { name: 'Cheminée (raccourci) sans saut mural, plateforme 1 retirée (doit échouer)', lvl: level(c.start.tx, c.start.ty - 1, c.goal.tx, c.goal.ty + 1, 'noP1'), cfg: PL.defaultCfg(), expect: false },
  { name: 'Cheminée (raccourci) avec saut mural', lvl: level(c.start.tx, c.start.ty - 1, c.goal.tx, c.goal.ty + 1, 'noP1'), cfg: wall(), expect: true, key: 'short' },
  // tableau 2
  { name: 'Course DEUX avec saut mural, sans élan (voie basse du fossé, par points de passage)', mk: (fx, fy) => level(c2.start.tx, c2.start.ty - 1, fx, fy), via: [[122, 25], [133, 10], [c2.goal.tx, c2.goal.ty + 1]], cfg: wall(), expect: true, key: 'course2' },
  { name: 'Fossé de la DEUX sans élan, voie basse fermée (doit échouer)', lvl: level(103, 25, 122, 25, 'pit'), cfg: wall(), expect: false },
  { name: 'Fossé de la DEUX avec élan', lvl: level(103, 25, 122, 25, 'pit'), cfg: wallDash(), expect: true, key: 'gap2' },
  { name: 'Course DEUX avec élan (doit être plus rapide)', mk: (fx, fy) => level(c2.start.tx, c2.start.ty - 1, fx, fy), via: [[122, 25], [133, 10], [c2.goal.tx, c2.goal.ty + 1]], cfg: wallDash(), expect: true, key: 'course2d' },
  { name: 'Retour DEUX : de la tirelire, par la cheminée étroite, jusqu\'au couloir du hub 2', lvl: level(c2.goal.tx, c2.goal.ty + 1, 79, 5), cfg: wall(), expect: true, key: 'back2' },
  { name: 'Sauter du hub 2 dans la cheminée de retour (doit échouer : plateforme traversable)', lvl: level(80, 6, 80, 16), cfg: wallDash(), expect: false },
  // tableau 3
  { name: 'Couloirs vers le hub 3 sans élan (doit échouer)', lvl: level(139, 6, 169, 6), cfg: wall(), expect: false },
  { name: 'Couloirs vers le hub 3 avec élan', lvl: level(139, 6, 169, 6), cfg: wallDash(), expect: true, key: 'corr3' },
  { name: 'Course TROIS (saut mural + élan, par points de passage)', mk: (fx, fy) => level(c3.start.tx, c3.start.ty - 1, fx, fy), via: [[184, 28], [178, 32], [181, 13], [c3.goal.tx, c3.goal.ty + 1]], cfg: wallDash(), expect: true, key: 'course3' },
  { name: 'Retour TROIS : de la tirelire, par la cheminée, jusqu\'au couloir du hub 3', lvl: level(c3.goal.tx, c3.goal.ty + 1, 193, 5), cfg: wall(), expect: true, key: 'back3' },
];
let fail = 0;
const out = {};
const only = process.env.ONLY ? new RegExp(process.env.ONLY, 'i') : null;   // ONLY=DEUX : ne lance que les tests dont le nom correspond
for (const t of tests) {
  if (only && !only.test(t.name)) continue;
  const t0 = Date.now(), r = t.via ? searchVia(t.mk, t.via, t.cfg) : search(t.lvl, t.cfg);
  if (r.ok && t.key) out[t.key] = r.acts.map(a => a.dash ? [a.dir, a.held ? 1 : 0, 1] : [a.dir, a.held ? 1 : 0]);
  const ok = r.ok === t.expect; if (!ok) fail++;
  console.log((ok ? '✔' : '✖') + ' ' + t.name + ' → ' + (r.ok ? 'atteint en ' + r.time.toFixed(2) + ' s' : r.reason) + ' (' + r.states + ' états, ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
}
if (process.env.OUT) { const fs = require('fs'); let prev = {}; try { prev = JSON.parse(fs.readFileSync(process.env.OUT, 'utf8')); } catch (e) { } fs.writeFileSync(process.env.OUT, JSON.stringify(Object.assign(prev, out))); }   // fusion : un lancement partiel (ONLY) garde les autres suites
process.exit(fail ? 1 : 0);
