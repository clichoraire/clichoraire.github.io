// Simulation sans affichage : ordinateurs seulement, pour vérifier l'équilibre des personnages, des pistes et des objets.
// Usage : node tools/headless.js [--course=rookie|all] [--races=4] [--laps=3] [--diff=1] [--seed=1] [--boards] [--verbose]
//   --all (ou --course=all) : toutes les pistes. --boards : planches tirées au hasard (sinon Freestyle pour tous).
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
globalThis.window = globalThis;
for (const f of ['config', 'track', 'game', 'ai']) vm.runInThisContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), { filename: f + '.js' });
const SK = globalThis.SK;
const flag = (n, d) => { const f = process.argv.find(a => a.startsWith('--' + n + '=')); return f ? f.slice(n.length + 3) : d; };
const races = +flag('races', 4), laps = +flag('laps', 3), diff = +flag('diff', 1), seed0 = +flag('seed', 1);
const verbose = process.argv.includes('--verbose'), randomBoards = process.argv.includes('--boards');
const courseArg = process.argv.includes('--all') ? 'all' : flag('course', 'rookie');
const courses = courseArg === 'all' ? SK.COURSES : [SK.courseById(courseArg)];
const chars = SK.CHARACTERS.filter(c => !c.hidden).map(c => c.id);
const evc = {}; const agg = {}; for (const c of SK.CHARACTERS) agg[c.id] = { races: 0, wins: 0, rankSum: 0, time: 0, coins: 0, falls: 0, shots: 0, items: 0, hits: 0, tricks: 0 };

for (const course of courses) {
  let lapSum = 0, lapN = 0, finSum = 0, finN = 0, est = 0; const t0 = Date.now();
  for (let i = 0; i < races; i++) {
    const rng = SK.rng(seed0 + i * 101);
    const pool = chars.slice(); for (let k = pool.length - 1; k > 0; k--) { const j = rng.int(k + 1); [pool[k], pool[j]] = [pool[j], pool[k]]; } pool.length = 4;
    const racers = pool.map(id => ({ charId: id, boardId: randomBoards ? rng.pick(SK.BOARDS).id : 'freestyle', ctrl: 'cpu' }));
    if (course.boss) racers.push({ charId: course.boss, boardId: 'freestyle', ctrl: 'cpu', boss: true });
    const race = new SK.Race({ course, racers, laps, seed: seed0 + i * 7919, difficulty: diff });
    let steps = 0;
    while (race.phase !== 'over' && steps < 60 * 60 * 20) {
      race.update(SK.STEP); steps++;
      if (verbose) for (const e of race.takeEvents()) {
        if (['hit', 'steal', 'rockhit', 'finish', 'lift', 'trick'].includes(e.type)) console.log(`  ${SK.fmtTime(race.time)} ${e.type} ${e.r.def.name}${e.kind ? ' ' + e.kind : ''}${e.from ? ' par ' + e.from.def.name : ''}${e.coins ? ' +' + e.coins + ' (' + e.names.join(', ') + ')' : ''}${e.wait != null ? ' attente ' + e.wait.toFixed(1) + 's' : ''}`);
      } else for (const e of race.takeEvents()) { const k = e.type + (e.kind ? ':' + e.kind : ''); evc[k] = (evc[k] || 0) + 1; }
    }
    const res = race.results();
    if (verbose) console.log(`${course.name} course ${i + 1} : ` + res.map(x => `${x.rank + 1}. ${x.name} ${SK.fmtTime(x.time)}${x.estimated ? '*' : ''} ${x.coins}p`).join(' | '));
    for (const x of res) {
      const a = agg[x.r.def.id]; a.races++; if (x.rank === 0) a.wins++; a.rankSum += x.rank + 1; a.time += x.time; a.coins += x.coins; a.falls += x.stats.falls; a.shots += x.stats.shots; a.items += x.stats.items; a.hits += x.stats.hits; a.tricks += x.tricks;
      if (x.lapTimes.length) { lapSum += x.lapTimes[0]; lapN++; } finSum += x.time; finN++; if (x.estimated) est++;
    }
  }
  console.log(`${course.name} (${course.original}) : ${(race0(course).L).toFixed(0)} m, ${race0(course).track.nRace} segments — tour moyen ${(lapSum / lapN).toFixed(1)} s, course ${(finSum / finN).toFixed(1)} s (${laps} tours, ${races} courses, diff ${diff}, ${Date.now() - t0} ms${est ? ', ' + est + ' estimés' : ''})`);
}
function race0(course) { return new SK.Race({ course, racers: [{ charId: 'slash' }], seed: 1 }); }
console.log('\nÉvénements par course : ' + Object.keys(evc).sort().map(k => k + ' ' + (evc[k] / (races * courses.length)).toFixed(1)).join(', '));
console.log('\nPersonnages (toutes courses) :');
for (const id in agg) { const a = agg[id]; if (!a.races) continue;
  console.log(`  ${id.padEnd(9)} ${a.races} courses, ${a.wins} victoires, place moyenne ${(a.rankSum / a.races).toFixed(2)}, temps ${(a.time / a.races).toFixed(1)} s, pièces ${(a.coins / a.races).toFixed(0)}, figures ${(a.tricks / a.races).toFixed(1)}, chutes ${(a.falls / a.races).toFixed(1)}, tirs ${(a.shots / a.races).toFixed(1)}, objets ${(a.items / a.races).toFixed(1)}, touches ${(a.hits / a.races).toFixed(1)}`);
}
