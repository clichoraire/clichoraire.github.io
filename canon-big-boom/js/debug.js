// Mode Debug / éditeur de tableaux (temporaire, visible seulement avec le personnage Matthieu).
// Permet de lancer un tableau, le mettre en pause, l'accélérer ou le ralentir, modifier les monstres et leurs arrivées
// (paquets de X toutes les N secondes), le visuel, l'objectif, puis sauvegarder le tout en JSON dans tableaux/.
(function (CB) {
  const D = CB.Debug = {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TYPES = { endless: 'Nuit sans fin (infini)', kill: 'Abattre N ennemis', survive: 'Survivre X secondes', killTimed: 'Abattre N avant la fin du chrono', boss: 'Boss' };
  const SPEEDS = [.25, .5, 1, 2, 4];

  D.fromSlot = (wi, vi) => {
    const w = CB.WORLDS[wi], d = CB.waveDef(wi, vi);
    return { slot: w.id + '-' + (vi + 1), world: w.id, name: d.name, text: d.text, type: d.type, goal: d.goal || 10, seconds: d.seconds || 40, density: d.density || 1,
      scene: w.id, sky: w.sky.slice(), ground: w.ground, space: !!w.space, random: { enabled: true, enemies: [...new Set(w.enemies)] }, spawns: [], boss: d.type === 'boss' ? w.boss : null, hpScale: 1, speedScale: 1 };
  };
  D.blank = (wi, vi) => Object.assign(D.fromSlot(wi, vi), { name: 'Nouveau tableau', text: 'Abats 10 ennemis !', type: 'kill', goal: 10, random: { enabled: false, enemies: [] },
    spawns: [{ at: 1, type: 'bat', count: 3, every: .5, packs: 2, interval: 6, elite: false }], boss: null });
  D.open = def => { const app = CB.app; app.debug = true; app.custom = def; app.startWave(def); };
  D.close = () => { const app = CB.app; app.debug = false; app.custom = null; app.show('map'); };
  D.restart = () => CB.app.startWave(CB.app.custom);

  // Les champs visuels s'appliquent tout de suite à la vague en cours ; le reste demande « Appliquer ».
  const live = () => { const w = CB.app.wave, c = CB.app.custom; if (!w || !c) return; Object.assign(w.world, { scene: c.scene, sky: c.sky, ground: c.ground, space: !!c.space }); };

  D.render = () => {
    const app = CB.app, c = app.custom, el = $('#debug-panel'); if (!c || !el) return;
    const enemyOpts = sel => Object.entries(CB.ENEMIES).map(([k, e]) => '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(e.name) + '</option>').join('');
    const num = (key, v, step = 1, min = 0) => '<input type="number" data-k="' + key + '" value="' + v + '" step="' + step + '" min="' + min + '">';
    el.innerHTML = '<div class="dbg-head"><b>🐞 DEBUG · ' + esc(c.slot || 'nouveau') + '</b><button class="dbg-x" data-act="close" title="Quitter">✕</button></div>'
      + '<div class="dbg-row"><button data-act="freeze">⏸ Pause</button><button data-act="restart">↻ Recommencer</button><span class="dbg-status" id="dbg-status"></span></div>'
      + '<div class="dbg-row">Vitesse ' + SPEEDS.map(s => '<button data-speed="' + s + '" class="' + ((app.W.speed || 1) === s ? 'on' : '') + '">' + s + '×</button>').join('') + '</div>'
      + '<fieldset><legend>Objectif</legend><div class="dbg-row"><label>Nom <input data-k="name" value="' + esc(c.name) + '"></label></div><div class="dbg-row"><label>Texte <input data-k="text" value="' + esc(c.text) + '"></label></div>'
      + '<div class="dbg-row"><label>Type <select data-k="type">' + Object.entries(TYPES).map(([k, n]) => '<option value="' + k + '"' + (k === c.type ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label></div>'
      + '<div class="dbg-row"><label>À abattre ' + num('goal', c.goal) + '</label><label>Secondes ' + num('seconds', c.seconds) + '</label><label>Densité ' + num('density', c.density, .05) + '</label></div>'
      + '<div class="dbg-row"><label>Boss <select data-k="boss"><option value="">aucun</option>' + Object.entries(CB.BOSSES).map(([k, b]) => '<option value="' + k + '"' + (k === c.boss ? ' selected' : '') + '>' + esc(b.name) + '</option>').join('') + '</select></label></div>'
      + '<div class="dbg-row"><label>PV × ' + num('hpScale', c.hpScale || 1, .1, .1) + '</label><label>Vitesse × ' + num('speedScale', c.speedScale || 1, .1, .1) + '</label></div></fieldset>'
      + '<fieldset><legend>Visuel</legend><div class="dbg-row"><label>Scène <select data-k="scene">' + CB.Render.SCENE_KEYS.map(k => '<option' + (k === c.scene ? ' selected' : '') + '>' + k + '</option>').join('') + '</select></label><label><input type="checkbox" data-k="space"' + (c.space ? ' checked' : '') + '> pont de vaisseau</label></div>'
      + '<div class="dbg-row">Ciel ' + [0, 1, 2].map(i => '<input type="color" data-sky="' + i + '" value="' + c.sky[i] + '">').join('') + ' Sol <input type="color" data-k="ground" value="' + c.ground + '"></div></fieldset>'
      + '<fieldset><legend>Monstres aléatoires</legend><div class="dbg-row"><label><input type="checkbox" data-k="randomOn"' + (c.random.enabled ? ' checked' : '') + '> activés (selon la densité)</label></div><div class="dbg-row dbg-wrap">' + Object.entries(CB.ENEMIES).map(([k, e]) => '<label><input type="checkbox" data-enemy="' + k + '"' + (c.random.enemies.includes(k) ? ' checked' : '') + '> ' + esc(e.name) + '</label>').join('') + '</div></fieldset>'
      + '<fieldset><legend>Arrivées planifiées</legend><table class="dbg-table"><tr><th>à (s)</th><th>monstre</th><th>×</th><th>écart</th><th>paquets</th><th>toutes les</th><th>élite</th><th></th></tr>'
      + c.spawns.map((s, i) => '<tr><td><input type="number" data-sp="' + i + '" data-f="at" value="' + s.at + '" step=".5" min="0"></td><td><select data-sp="' + i + '" data-f="type">' + enemyOpts(s.type) + '</select></td><td><input type="number" data-sp="' + i + '" data-f="count" value="' + s.count + '" min="1"></td><td><input type="number" data-sp="' + i + '" data-f="every" value="' + s.every + '" step=".1" min=".05"></td><td><input type="number" data-sp="' + i + '" data-f="packs" value="' + s.packs + '" min="1"></td><td><input type="number" data-sp="' + i + '" data-f="interval" value="' + s.interval + '" step=".5" min=".1"></td><td><input type="checkbox" data-sp="' + i + '" data-f="elite"' + (s.elite ? ' checked' : '') + '></td><td><button data-del="' + i + '">✕</button></td></tr>').join('')
      + '</table><div class="dbg-row"><button data-act="add">+ Ajouter une arrivée</button></div></fieldset>'
      + '<div class="dbg-row dbg-actions"><button class="primary" data-act="apply">✔ Appliquer et recommencer</button><button data-act="save">💾 Sauvegarder JSON</button><label class="dbg-file">📂 Charger JSON<input type="file" accept=".json,application/json" id="dbg-file"></label><button data-act="blank">🆕 Nouveau tableau vide</button><button data-act="close">🗺 Quitter le debug</button></div>'
      + '<p class="dbg-help">Le JSON se télécharge dans ton dossier de téléchargements : dépose-le dans <b>CanonBigBoom/tableaux/</b>. Pour le relier à la carte, voir tableaux/README.md.</p>';
    el.querySelectorAll('[data-k]').forEach(inp => inp.onchange = () => {
      const k = inp.dataset.k;
      if (k === 'randomOn') c.random.enabled = inp.checked; else if (k === 'space') c.space = inp.checked; else if (inp.type === 'number') c[k] = +inp.value; else c[k] = inp.value;
      if (k === 'boss' && !c.boss) c.boss = null; live();
    });
    el.querySelectorAll('[data-sky]').forEach(inp => inp.oninput = () => { c.sky[+inp.dataset.sky] = inp.value; live(); });
    el.querySelector('[data-k="ground"]').oninput = e => { c.ground = e.target.value; live(); };
    el.querySelectorAll('[data-enemy]').forEach(inp => inp.onchange = () => { const k = inp.dataset.enemy; c.random.enemies = c.random.enemies.filter(x => x !== k); if (inp.checked) c.random.enemies.push(k); });
    el.querySelectorAll('[data-sp]').forEach(inp => inp.onchange = () => { const s = c.spawns[+inp.dataset.sp], f = inp.dataset.f; if (!s) return; s[f] = inp.type === 'checkbox' ? inp.checked : inp.type === 'number' ? +inp.value : inp.value; });
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { c.spawns.splice(+b.dataset.del, 1); D.render(); });
    el.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => { app.W.speed = +b.dataset.speed; D.render(); });
    el.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
      const a = b.dataset.act;
      if (a === 'freeze') { app.W.freeze = !app.W.freeze; b.textContent = app.W.freeze ? '▶ Reprendre' : '⏸ Pause'; }
      else if (a === 'restart' || a === 'apply') D.restart();
      else if (a === 'add') { c.spawns.push({ at: Math.round((app.wave ? app.wave.time : 0) + 1), type: c.random.enemies[0] || 'bat', count: 3, every: .5, packs: 1, interval: 5, elite: false }); D.render(); }
      else if (a === 'save') D.save();
      else if (a === 'blank') { const wi = CB.WORLDS.findIndex(w => w.id === c.world); app.custom = D.blank(Math.max(0, wi), app.vi); D.restart(); }
      else if (a === 'close') D.close();
    });
    $('#dbg-file').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(txt => { try { const j = JSON.parse(txt); if (!j || typeof j !== 'object') throw 0; app.custom = Object.assign(D.blank(app.wi, app.vi), j, { random: Object.assign({ enabled: false, enemies: [] }, j.random || {}), spawns: Array.isArray(j.spawns) ? j.spawns : [] }); D.restart(); } catch (err) { alert('JSON invalide'); } }); };
    D.tick();
  };
  D.tick = () => {
    const w = CB.app.wave, st = $('#dbg-status'); if (!w || !st) return;
    st.textContent = w.time.toFixed(1) + ' s · ' + w.enemies.length + ' ennemis · ' + w.kills + ' abattus · ' + Math.ceil(w.hp) + ' PV' + (w.over ? (w.won ? ' · ✔ GAGNÉ' : ' · ✖ PERDU (' + w.reason + ')') : '');
  };
  D.save = () => {
    const c = CB.app.custom, json = JSON.stringify(c, null, 2), name = 'tableau-' + (c.slot || 'nouveau') + '.json';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    try { navigator.clipboard && navigator.clipboard.writeText(json); } catch (e) { }
  };
})(window.CB);
