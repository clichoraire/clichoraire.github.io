// Snow Kids — pilotage des coureurs contrôlés par l'ordinateur : choix de trajectoire, freinage, sauts et figures,
// usage des tirs et des objets. Trois difficultés + léger élastique par rapport au meilleur humain.
(function (SK) {
  'use strict';
  const SEG = SK.SEG;
  const LEVELS = [
    { speed: 0.9, err: 0.3, react: 0.4, trickAmbition: 0.6, rubber: 0.14 },
    { speed: 0.96, err: 0.14, react: 0.25, trickAmbition: 0.8, rubber: 0.1 },
    { speed: 1.0, err: 0.05, react: 0.15, trickAmbition: 1, rubber: 0.06 },
  ];
  SK.AI = {};
  SK.AI.drive = function (race, r, dt) {
    const D = LEVELS[SK.clamp(race.difficulty, 0, 2)];
    const ai = r.ai || (r.ai = { lane: r.x, think: race.rng() * 0.3, shootT: 1 + race.rng() * 2, itemT: 2 + race.rng() * 4, rockT: 0 });
    const inp = r.input; inp.steer = 0; inp.up = inp.down = inp.trick = inp.shoot = inp.item = false; const wasJump = inp.jump; inp.jump = false;
    // vitesse de l'ordi : difficulté, patron (boss) et élastique vers le meilleur humain
    let f = D.speed * (r.boss ? 1.04 : 1);
    if (race.humans.length) {
      const best = Math.max.apply(null, race.humans.map(h => h.progress())), d = best - r.progress();
      if (d > 120) f *= 1 + Math.min(D.rubber, (d - 120) / 1200);
      else if (d < -120 && !r.boss) f *= 1 - Math.min(D.rubber * 0.6, (-d - 120) / 1500);
    }
    r.aiSpeed = f;
    if (r.state === 'lift' || r.state === 'done' || r.state === 'fall' || r.state === 'frozen') return;
    const T = race.track, i0 = SK.clamp(Math.floor(r.z / SEG), 0, T.segs.length - 1), s = T.segs[i0];
    // ---- trajectoire (replanifiée régulièrement)
    ai.think -= dt;
    if (ai.think <= 0) {
      ai.think = D.react;
      const wantRed = !r.shot && r.coins >= SK.SHOT_COST && race.mode !== 'time', wantBlue = !r.item && race.mode !== 'time';
      let wmin = s.w, curveSum = 0; const ahead = [];
      for (let j = 1; j <= 18 && i0 + j < T.segs.length; j++) { const sg = T.segs[i0 + j]; ahead.push(sg); wmin = Math.min(wmin, sg.w); curveSum += sg.curve; }
      const lanes = []; for (let k = 0; k < 11; k++) lanes.push((-0.85 + 1.7 * k / 10) * wmin);
      const inside = curveSum > 0.01 ? 1 : curveSum < -0.01 ? -1 : 0;
      let best = null;
      const scored = lanes.map(xl => {
        let sc = -Math.abs(xl - r.x) * 0.6 - Math.pow(Math.abs(xl) / wmin, 4) * 15 + xl * inside * 0.5;
        ahead.forEach((sg, j) => {
          const dist = 1 / (1 + j / 5);
          for (const p of sg.props) if (!p.decor && Math.abs(xl - p.x) < p.r + 1.4) sc -= 70 * dist;
          for (const b of sg.boxes) if (b.taken <= race.time && Math.abs(xl - b.x) < 1.2 && ((b.kind === 'red' && wantRed) || (b.kind === 'blue' && wantBlue))) sc += 30 * dist;
          for (const c of sg.coins) if (c.taken <= race.time && Math.abs(xl - c.x) < 1.2) sc += 7 * dist;
          for (const k of race.rocks) if (k.lap === r.lap && k.z >= sg.z && k.z < sg.z + SEG && Math.abs(xl - k.x) < 2.2) sc -= 70 * dist;
        });
        for (const o of race.racers) if (o !== r && o.lap === r.lap && o.state !== 'lift' && o.state !== 'done' && o.z > r.z && o.z < r.z + 12 && Math.abs(xl - o.x) < 1.6) sc -= 8;
        return { xl, sc };
      }).sort((a, b) => b.sc - a.sc);
      best = scored[0];
      if (race.rng() < D.err) best = scored[Math.min(scored.length - 1, 1 + race.rng.int(2))];
      ai.lane = best.xl;
    }
    if (r.lap + 1 < race.laps && r.z > race.L - 90) ai.lane = race.gateX; // le portail de la remontée est dans un coin
    // ---- direction : viser la voie, compenser la force centrifuge, freiner si ça dérape trop
    const surf = SK.SURFACES[s.surface] || SK.SURFACES.snow, kappa = s.curve / (SEG * SEG), drift = kappa * r.speed * r.speed * 4.2 * (s.surface === 'ice' ? 1.25 : 1);
    const capacity = r.steerRate * surf.grip * Math.min(1, r.speed / 12);
    inp.steer = SK.clamp((ai.lane - r.x) / 1.6 + (capacity > 0 ? drift / capacity : 0), -1, 1);
    if (r.state === 'ride' && Math.abs(drift) > capacity * 0.8) inp.down = true;
    else if (r.state === 'ride' && r.speed > 8) inp.up = true; // penché vers l'avant
    // ---- sauts : tremplin imminent (tenir le bouton) ou obstacle inévitable
    const next = T.segs[Math.min(T.segs.length - 1, i0 + 1)];
    if (r.state === 'ride') {
      if (s.jump || next.jump) inp.jump = true;
      else for (const p of s.props.concat(next.props)) if (!p.decor && Math.abs(r.x - p.x) < p.r + 0.9) { const pz = (p.sg || s).z; if (r.speed > 10 && race.rng() < 0.5 + 0.1 * r.def.trick) inp.jump = !wasJump; }
    }
    // ---- figures en l'air
    if (r.state === 'air' && !r.curTrick) {
      const g = SK.GRAVITY, vy = r.vy, h = r.h;
      let tLeft = (vy + Math.sqrt(vy * vy + 2 * g * h)) / g; const gyNow = T.groundY(r.z);
      for (let it = 0; it < 2; it++) { // le sol monte (tremplin) ou descend : corriger le temps de vol
        const drop = h + gyNow - T.groundY(r.z + r.speed * tLeft);
        tLeft = drop <= 0 ? 0 : (vy + Math.sqrt(Math.max(0, vy * vy + 2 * g * drop))) / g;
      }
      const margin = 1.15 + (1 - D.trickAmbition) * 0.3;
      const options = Object.keys(SK.TRICKS).filter(id => SK.TRICKS[id].dur / r.trickSpeed * (margin + 0.3 * SK.TRICKS[id].dur) + 0.1 < tLeft).sort((a, b) => SK.TRICKS[b].coins - SK.TRICKS[a].coins);
      let pick = options[0];
      if (!pick && race.rng() < D.err * 0.4 && tLeft > 0.3) pick = 'grab'; // erreur : figure trop longue → chute
      if (pick && race.rng() < 0.9) {
        const d = SK.TRICKS[pick].dir; if (SK.TRICKS[pick].btn === 'jump') inp.jump = !wasJump; else inp.trick = true;
        inp.steer = 0; inp.up = inp.down = false; // la direction tenue ne doit pas changer la figure voulue
        if (d === 'up') inp.up = true; else if (d === 'down') inp.down = true; else if (d === 'left') inp.steer = -1; else if (d === 'right') inp.steer = 1;
      }
    }
    // ---- tirs
    if (r.shot) {
      ai.shootT -= dt;
      const t = race.racerAhead(r);
      if (ai.shootT <= 0) {
        if (r.shot === 'poele') { if (race.racers.some(o => o !== r && !o.immune() && Math.abs(o.progress() - r.progress()) < 90)) { inp.shoot = true; ai.shootT = 1; } }
        else if (t && !t.immune() && t.progress() - r.progress() < 230) { inp.shoot = true; ai.shootT = 0.8 + race.rng(); }
        else if (!t && race.rng() < 0.002) inp.shoot = true;
      }
    }
    // ---- objets
    if (r.item) {
      ai.itemT -= dt;
      const behind = race.racerBehind(r), aheadR = race.racerAhead(r);
      const k = r.item;
      if (k === 'ventilo' && r.state === 'ride' && Math.abs(s.curve) < 0.035 && ai.itemT <= 0) inp.item = true;
      else if (k === 'rocher' && behind && behind.lap === r.lap && r.z - behind.z < 30 && r.z - behind.z > 3) inp.item = true;
      else if (k === 'rocher' && ai.itemT < -12) inp.item = true;
      else if (k === 'invisible' && (behind && behind.shot && !r.fx.invisible && r.progress() - behind.progress() < 200)) inp.item = true;
      else if (k === 'invisible' && ai.itemT < -10) inp.item = true;
      else if (k === 'fantome' && aheadR && !aheadR.immune() && (aheadR.shot || aheadR.item) && aheadR.progress() - r.progress() < 150) inp.item = true;
      else if (k === 'fantome' && ai.itemT < -15) inp.item = true;
      else if (k === 'nuage' && r.rank > 0 && ai.itemT <= 0) inp.item = true;
      if (inp.item) ai.itemT = 1 + race.rng() * 2;
    }
  };
})(window.SK);
