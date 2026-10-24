// Simulation sans affichage : un photographe automatique parcourt les niveaux, applique les recettes secrètes et
// photographie tout ce qu'il voit. Sert à vérifier que chaque comportement secret est atteignable depuis le rail et à
// calibrer les points. Usage : node tools/headless.js [--level=etage|all] [--tools=crouton,tabasco] [--seed=1] [--verbose]
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
globalThis.window = globalThis;
for (const f of ['config', 'game', 'creatures']) vm.runInThisContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), { filename: f + '.js' });
const FS = globalThis.FS;
const flag = (n, d) => { const f = process.argv.find(a => a.startsWith('--' + n + '=')); return f ? f.slice(n.length + 3) : d; };
const verbose = process.argv.includes('--verbose');
const levelArg = process.argv.includes('--all') ? 'all' : flag('level', 'all');
const levels = levelArg === 'all' ? FS.LEVELS : [FS.levelById(levelArg)];
const tools = flag('tools', 'crouton,tabasco,clic,flash,dash').split(',');
const seed = +flag('seed', 1);
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

function runLevel(level) {
  const run = new FS.Run({ level, tools, seed });
  const log = [];
  const done = {}; // actions déjà faites par créature
  let photoT = 0, steps = 0, waitTool = 0;
  const aimAt = (x, y, z) => { run.lookTarget.yaw = wrap(Math.atan2(x - run.cam.x, z - run.cam.z) - run.baseYaw); run.lookTarget.pitch = Math.atan2(y - run.cam.y, Math.hypot(x - run.cam.x, z - run.cam.z)); };
  const onTarget = () => Math.abs(run.lookTarget.yaw - run.look.yaw) < 0.02 && Math.abs(run.lookTarget.pitch - run.look.pitch) < 0.02 && Math.abs(run.lookTarget.yaw) <= FS.MAX_YAW;
  const canSee = c => { const a = wrap(Math.atan2(c.x - run.cam.x, c.z - run.cam.z) - run.baseYaw); return Math.abs(a) < FS.MAX_YAW - 0.05 && Math.hypot(c.x - run.cam.x, c.z - run.cam.z) < 26; };
  const mark = (c, k) => { done[c.id + k] = (done[c.id + k] || 0) + 1; };
  const times = (c, k) => done[c.id + k] || 0;
  // Recettes : renvoie {aim:[x,y,z], tool} ou null
  function recipe(c) {
    const centre = [c.x, c.y + c.sp.h * c.scale / 2, c.z], ground = [c.x, 0, c.z];
    switch (c.spId) {
      case 'bocal': if (c.pose === 'special') return null; if (c.vars.rung > 0 && c.pose !== 'react' || (c.vars.rung > 0 && c.poseT > 1)) return times(c, 'clic') ? null : { aim: centre, tool: 'clic', k: 'clic' }; return times(c, 'ring') ? null : { aim: centre, tool: 'crouton', k: 'ring' };
      case 'ketchup': case 'moutarde': { if (c.pose === 'special' || times(c, 'duel')) return null; const o = run.byId(c.spId === 'ketchup' ? 'moutarde' : 'ketchup').find(o => o.dist(c) < 16); if (!o) return null; return { aim: [(c.x + o.x) / 2, 0, (c.z + o.z) / 2], tool: 'crouton', k: 'duel', also: o }; }
      case 'miette': if (c.pose === 'special' || c.eaten >= 3 || times(c, 'feed') >= 6 || c.bait) return null; { const tx = c.home.x * 0.55, tz = Math.max(c.home.z, run.cam.z + 6); return { aim: [tx, 0, tz], tool: 'crouton', k: 'feed', gap: 1 }; }
      case 'oeuf': if (c.opts.idx !== 2 || c.pose === 'special') return null; if (c.vars.stage === 0) return times(c, 'crack') ? null : { aim: centre, tool: 'crouton', k: 'crack' }; if (c.vars.stage === 1) return times(c, 'steam') ? null : { aim: centre, tool: 'tabasco', k: 'steam' }; return times(c, 'om') ? null : { aim: centre, tool: 'clic', k: 'om' };
      case 'beurre': if (c.pose === 'special') return null; if (c.vars.melting) return times(c, 'flash') ? null : { aim: centre, tool: 'flash', k: 'flash' }; return times(c, 'melt') ? null : { aim: centre, tool: 'tabasco', k: 'melt' };
      case 'olive': return times(c, 'clic') || c.pose === 'special' ? null : { aim: centre, tool: 'clic', k: 'clic' };
      case 'yeti': if (c.pose === 'special') return null; return times(c, 'tab') >= 2 ? null : { aim: [c.x, c.y + c.sp.h * 0.6, c.z], tool: 'tabasco', k: 'tab', gap: 0.8 };
      case 'meduse': return times(c, 'flash') || c.pose === 'special' ? null : { aim: centre, tool: 'flash', k: 'flash' };
      case 'leviathan': return times(c, 'clic') || c.pose === 'special' ? null : { aim: centre, tool: 'clic', k: 'clic' };
      case 'celeri': { if (c.pose === 'special' || times(c, 'kiss')) return null; const o = run.byId('celeri').find(o => o !== c && o.dist(c) < 9 && o.pose !== 'special' && !times(o, 'kiss')); if (!o) return null; return { aim: [(c.x + o.x) / 2, 0, (c.z + o.z) / 2], tool: 'crouton', k: 'kiss', also: o }; }
      case 'sorbet': if (c.pose === 'special') return null; if (c.vars.erupt) return times(c, 'clic') ? null : { aim: centre, tool: 'clic', k: 'clic' }; return times(c, 'tab') ? null : { aim: centre, tool: 'tabasco', k: 'tab' };
      case 'moisissurex': if (c.pose === 'special') return null; if (c.vars.dancing) return times(c, 'flash') ? null : { aim: centre, tool: 'flash', k: 'flash' }; return times(c, 'clic') ? null : { aim: centre, tool: 'clic', k: 'clic' };
      default: return null;
    }
  }
  const shots = {}; let current = null; // action en cours {c, r}
  while (run.phase === 'ride' && steps < 60 * 600) {
    const dt = FS.STEP; run.update(dt); steps++; photoT += dt; waitTool -= dt;
    for (const e of run.takeEvents()) { if (e.type === 'special') log.push(`${run.time.toFixed(1)}s SECRET ${e.creature.sp.name} (${e.kind})`); else if (e.type === 'react' && verbose) log.push(`${run.time.toFixed(1)}s réaction ${e.creature.sp.name} (${e.kind})`); }
    const vis = run.creatures.filter(c => c.visible && canSee(c)); const cands = run.creatures.filter(c => (c.visible || c.spId === 'miette') && canSee(c));
    // action d'outil en cours ?
    if (current && (!canSee(current.c) || !run.hasTool(current.r.tool))) current = null;
    if (!current && waitTool <= 0) {
      for (const c of cands.sort((a, b) => Math.hypot(a.x - run.cam.x, a.z - run.cam.z) - Math.hypot(b.x - run.cam.x, b.z - run.cam.z))) {
        const r = recipe(c); if (r && run.hasTool(r.tool) && Math.hypot(c.x - run.cam.x, c.z - run.cam.z) < (r.tool === 'clic' ? FS.CLIC_R - 0.5 : r.tool === 'flash' ? FS.FLASH_R - 1 : r.k === 'feed' ? 24 : 17)) { current = { c, r }; break; }
      }
    }
    if (current) {
      const r = current.r; aimAt(r.aim[0], r.aim[1], r.aim[2]);
      if (onTarget() && run.useTool(r.tool)) { mark(current.c, r.k); if (r.also) mark(r.also, r.k); if (verbose) log.push(`${run.time.toFixed(1)}s outil ${r.tool} → ${current.c.sp.name}`); waitTool = r.gap || 0.3; current = null; }
    } else {
      // regarder la créature la plus intéressante
      const pri = c => (c.pose === 'special' ? 100 : c.pose === 'react' ? 50 : c.pose === 'eat' ? 20 : 0) - Math.hypot(c.x - run.cam.x, c.z - run.cam.z) * 0.5 - (shots[c.id + c.pose] || 0) * 30;
      const best = vis.sort((a, b) => pri(b) - pri(a))[0];
      if (best) aimAt(best.x, best.y + best.sp.h * best.scale / 2, best.z);
    }
    const special = vis.some(c => c.pose === 'special');
    if (vis.length && photoT >= (special ? 0.6 : 2.0) && run.film > 0) { photoT = 0; const p = run.takePhoto(); if (p && p.subject) shots[p.subject.cid + p.subject.pose] = (shots[p.subject.cid + p.subject.pose] || 0) + 1; if (p && p.subject && verbose) log.push(`${run.time.toFixed(1)}s photo ${p.subject.name} ${p.subject.pose} ${p.score.total}`); }
  }
  return { run, log };
}

let grandTotal = 0;
for (const level of levels) {
  const { run, log } = runLevel(level);
  console.log(`\n=== ${level.name} — ${run.rail.length.toFixed(0)} unités, ${run.time.toFixed(0)} s, ${FS.FILM - run.film} clichés, outils : ${tools.join(', ')}`);
  for (const l of log) console.log('  ' + l);
  const species = [...new Set(level.creatures.map(c => c[0]))];
  let total = 0;
  for (const id of species) {
    const sp = FS.speciesById(id); const ph = run.photos.filter(p => p.subject && p.subject.spId === id);
    const best = [1, 2, 3, 4].map(cat => { const l = ph.filter(p => p.score.cat === cat).sort((a, b) => b.score.total - a.score.total)[0]; return l ? l.score.total : 0; });
    const top = ph.sort((a, b) => b.score.total - a.score.total)[0]; total += top ? top.score.total : 0;
    const spec = run.byId(id).reduce((s, c) => s + c.special, 0);
    console.log(`  ${sp.name.padEnd(20)} ${String(ph.length).padStart(2)} clichés  étoiles : ${best.map((b, i) => (b ? '★' : '·') + (i + 1) + (b ? ':' + String(b).padStart(4) : '     ')).join(' ')}  secrets ${spec}${spec ? '' : '  ⚠ jamais déclenché'}${best[3] ? '' : '  ⚠ pas de cliché 4★'}`);
  }
  console.log(`  → meilleur cliché par espèce : ${FS.fmt(total)} points Fernand`);
  grandTotal += total;
}
if (levels.length > 1) console.log(`\nTotal des ${levels.length} niveaux : ${FS.fmt(grandTotal)} points`);
