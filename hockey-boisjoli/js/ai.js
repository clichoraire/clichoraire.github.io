// Intelligence des patineurs non contrôlés (ordinateur et coéquipiers du joueur).
(function (HK) {
  'use strict';
  const R = HK.RINK;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  HK.ai = {};

  HK.ai.think = function (g, s, dt) {
    const T = g.teams[s.team], A = s.ai;
    const diff = g.ctrl[s.team] === 'cpu' ? g.difficulty : 1;
    A.t -= dt;
    const inp = { dx: 0, dy: 0, a: false, b: false, p: false };
    if (A.shootT > 0) { A.shootT -= dt; inp.b = A.shootT > 0; }
    const smoked = g.smoke && g.smoke.team !== s.team && Math.hypot(s.x - g.smoke.x, s.y - g.smoke.y) < g.smoke.r;
    if (A.t <= 0) {
      A.t = [0.22, 0.14, 0.08][diff];
      if (smoked) { A.tx = s.x + (g.rand() - 0.5) * 300; A.ty = s.y + (g.rand() - 0.5) * 300; A.act = null; }
      else if (s.role) roleDecide(g, s, T, diff); else decide(g, s, T, diff);
    }
    const dx = A.tx - s.x, dy = A.ty - s.y, l = Math.hypot(dx, dy);
    if (l > 8) { inp.dx = dx / l; inp.dy = dy / l; }
    if (A.act === 'pass') { inp.a = true; A.act = null; }
    else if (A.act === 'passTo') { if (g.puck.owner === s) g.pass(s, A.passTo); A.act = null; }
    else if (A.act === 'shoot') { A.shootT = A.want; inp.b = true; A.act = null; }
    else if (A.act === 'check') { inp.b = true; A.act = null; }
    else if (A.act === 'power') { inp.p = true; A.act = null; }
    s.input = inp;
  };

  function decide(g, s, T, diff) {
    const A = s.ai, p = g.puck, O = g.teams[1 - s.team], dir = -T.side, CY = HK.CY;
    const oppGX = HK.goalX(-T.side), ownGX = HK.goalX(T.side);
    const noise = [45, 20, 6][diff];
    const n = () => (g.rand() - 0.5) * 2 * noise;
    const mates = T.skaters.filter(o => o !== s && o.down <= 0);
    const opps = O.skaters.filter(o => o.down <= 0 && o.stun <= 0);
    const c = p.owner;
    if (c === s) {
      const dNet = Math.hypot(oppGX - s.x, CY - s.y);
      const inFront = (oppGX - s.x) * dir > 30;
      const pressured = opps.some(o => d2(o, s) < 75);
      const blocker = opps.find(o => Math.abs(o.y - s.y) < 44 && (o.x - s.x) * dir > 0 && (o.x - s.x) * dir < 100);
      const range = 170 + 30 * diff;
      const toNet = Math.atan2(CY - s.y, oppGX - s.x), facing = Math.abs(Math.atan2(Math.sin(s.face - toNet), Math.cos(s.face - toNet)));
      if (inFront && dNet < range && Math.abs(s.y - CY) < 175 && A.shootT <= 0 && facing < 0.9) {
        A.act = 'shoot'; A.want = clamp(dNet / 420, 0.12, 0.6) * (pressured ? 0.45 : 1);
        A.tx = oppGX - dir * 40; A.ty = CY; return;
      }
      if (pressured && mates.length && g.rand() < 0.5 + 0.17 * diff) {
        const open = mates.filter(m => !opps.some(o => d2(o, m) < 60) && (m.x - s.x) * dir > -80);
        if (open.length) { A.act = 'pass'; }
      }
      let ty = blocker ? s.y + (s.y >= blocker.y ? 95 : -95) : s.y + (CY - s.y) * 0.4;
      if (!inFront) ty = s.y + (s.y > CY ? 120 : -120);   // derrière le filet : on contourne
      A.tx = oppGX - dir * 80 + n(); A.ty = clamp(ty + n(), R.y + 50, R.y + R.h - 50);
    } else if (c && c.team === s.team) {
      const others = T.skaters.filter(o => o !== c);
      const k = others.indexOf(s);
      if (k === 0) { A.tx = c.x + dir * 170; A.ty = c.y > CY ? c.y - 140 : c.y + 140; }
      else { A.tx = c.x - dir * 110; A.ty = CY + (c.y > CY ? -90 : 90); }
      A.tx = clamp(A.tx + n(), R.x + 70, R.x + R.w - 70); A.ty = clamp(A.ty + n(), R.y + 50, R.y + R.h - 50);
    } else if (c) {
      const sorted = T.skaters.filter(o => o.down <= 0 && o.stun <= 0).sort((a, b) => d2(a, c) - d2(b, c));
      const rank = sorted.indexOf(s);
      if (rank === 0) {
        A.tx = c.x + c.vx * 0.2 + n(); A.ty = c.y + c.vy * 0.2 + n();
        if (d2(s, c) < 52 && s.lungeCd <= 0 && g.rand() < 0.15 + 0.1 * diff) A.act = 'check';
      } else if (rank === 1) { A.tx = (c.x + ownGX * 2) / 3 + n(); A.ty = (c.y + CY * 2) / 3 + n(); }
      else { A.tx = ownGX + dir * 120 + n(); A.ty = CY + (c.y > CY ? -70 : 70) + n(); }
    } else {
      const px = p.x + p.vx * 0.3, py = p.y + p.vy * 0.3;
      const sorted = T.skaters.filter(o => o.down <= 0 && o.stun <= 0).sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py));
      const rank = sorted.indexOf(s);
      if (rank <= 1 || Math.hypot(s.x - px, s.y - py) < 130) { A.tx = px + n(); A.ty = py + n(); }
      else { A.tx = ownGX + dir * 150 + n(); A.ty = CY + (py > CY ? -60 : 60) + n(); }
    }
    A.tx = clamp(A.tx, R.x + s.r + 6, R.x + R.w - s.r - 6); A.ty = clamp(A.ty, R.y + s.r + 6, R.y + R.h - s.r - 6);
    if (s.cd <= 0 && !A.act && g.rand() < 0.35 + 0.25 * diff && HK.ai.wantPower(g, s)) A.act = 'power';
  }

  // Robots des exercices de pratique.
  function roleDecide(g, s, T, diff) {
    const A = s.ai, p = g.puck, O = g.teams[1 - s.team], dir = -T.side, CY = HK.CY, c = p.owner;
    const oppGX = HK.goalX(-T.side);
    const opps = O.skaters.filter(o => o.down <= 0 && o.stun <= 0);
    const human = T.skaters.find(o => !o.bot) || null;
    const flee = () => {   // porteur qui fuit l'adversaire le plus proche et se promène
      let fx = 0, fy = 0;
      for (const o of opps) { const d = HK.dist(s, o); if (d < 160) { fx += (s.x - o.x) / (d + 1) * (160 - d); fy += (s.y - o.y) / (d + 1) * (160 - d); } }
      if (!A.wander || A.wanderT <= 0 || Math.hypot(A.wander.x - s.x, A.wander.y - s.y) < 40) { A.wander = { x: R.x + 120 + g.rand() * (R.w - 240), y: R.y + 80 + g.rand() * (R.h - 160) }; A.wanderT = 3; }
      A.wanderT -= A.t;
      A.tx = s.x + fx * 1.5 + (A.wander.x - s.x) * 0.5; A.ty = s.y + fy * 1.5 + (A.wander.y - s.y) * 0.5;
    };
    const goPuck = () => { A.tx = p.x + p.vx * 0.3; A.ty = p.y + p.vy * 0.3; };
    const shootNow = () => { const dNet = Math.hypot(oppGX - s.x, CY - s.y); A.act = 'shoot'; A.want = clamp(dNet / 380, 0.15, 0.7); A.tx = oppGX - dir * 40; A.ty = CY; };
    switch (s.role) {
      case 'carrier': if (c === s) flee(); else if (!c || c.team !== s.team) goPuck(); else flee(); break;
      case 'chaser':
        if (c === s) flee();
        else if (c && c.team !== s.team) { A.tx = c.x + c.vx * 0.25; A.ty = c.y + c.vy * 0.25; if (HK.dist(s, c) < 55 && s.lungeCd <= 0 && g.rand() < 0.3 + 0.2 * diff) A.act = 'check'; }
        else if (!c) goPuck(); else flee();
        break;
      case 'shooter': {
        if (c === s) {
          const toNet = Math.atan2(CY - s.y, oppGX - s.x), facing = Math.abs(Math.atan2(Math.sin(s.face - toNet), Math.cos(s.face - toNet)));
          const dNet = Math.hypot(oppGX - s.x, CY - s.y);
          if (dNet > 330 || facing >= 0.8) { A.tx = oppGX - dir * 120; A.ty = CY + (s.home ? (s.home.y - CY) * 0.3 : 0); A.holdT = 0; }
          else if (A.shootT <= 0 && (A.holdT = (A.holdT || 0) + A.t) > 0.35) shootNow();
          else { A.tx = s.x + (oppGX - s.x) * 0.1; A.ty = s.y; }
        } else { A.holdT = 0; if (!c) goPuck(); else { A.tx = s.home.x; A.ty = s.home.y; } }
        break;
      }
      case 'breakaway': {
        if (c === s) { const dNet = Math.hypot(oppGX - s.x, CY - s.y); if (dNet < 150 + 40 * diff && A.shootT <= 0) shootNow(); else { A.tx = oppGX - dir * 60; A.ty = CY + (g.rand() - 0.5) * 40; } }
        else if (!c) goPuck(); else { A.tx = s.home.x; A.ty = s.home.y; }
        break;
      }
      case 'passer': {
        if (c === s) { A.holdT = (A.holdT || 0) + A.t; A.tx = s.home.x; A.ty = s.home.y; if (A.holdT > 0.8 && human) { A.act = 'passTo'; A.passTo = human; A.holdT = 0; } }
        else { A.holdT = 0; if (!c) goPuck(); else { A.tx = s.home.x; A.ty = s.home.y; } }
        break;
      }
      case 'crasher': {
        if (c === s) { const dNet = Math.hypot(oppGX - s.x, CY - s.y); if (dNet < 140 && A.shootT <= 0) shootNow(); else { A.tx = oppGX - dir * 60; A.ty = CY; } }
        else if (!c && HK.dist(s, p) < 220) goPuck(); else { A.tx = oppGX - dir * 85; A.ty = CY + (s.home ? s.home.y - CY : 0); }
        break;
      }
      default: decide(g, s, T, diff); return;
    }
    A.tx = clamp(A.tx, R.x + s.r + 6, R.x + R.w - s.r - 6); A.ty = clamp(A.ty, R.y + s.r + 6, R.y + R.h - s.r - 6);
    if (s.cd <= 0 && !A.act && s.usePowers && g.rand() < 0.5 && HK.ai.wantPower(g, s)) A.act = 'power';
  }

  HK.ai.wantPower = function (g, s) {
    const T = g.teams[s.team], O = g.teams[1 - s.team], p = g.puck, c = p.owner, dir = -T.side, CY = HK.CY;
    const near = (o, d) => Math.hypot(o.x - s.x, o.y - s.y) < d;
    const opps = O.skaters.filter(o => o.down <= 0 && o.stun <= 0);
    const oppGX = HK.goalX(-T.side), ownGX = HK.goalX(T.side);
    const dNet = Math.hypot(oppGX - s.x, CY - s.y);
    const oppHas = c && c.team !== s.team, mine = c === s;
    switch (s.def.power) {
      case 'cheat': return (oppHas && near(c, 280)) || (mine && dNet < 380);
      case 'biscuits': return opps.some(o => near(o, 110)) && (mine || (oppHas && near(c, 110)));
      case 'charge': return (oppHas && near(c, 85)) || (mine && opps.some(o => near(o, 80)));
      case 'laser': {
        if (!oppHas) return false;
        const dx = c.x - s.x, dy = c.y - s.y, along = dx * Math.cos(s.face) + dy * Math.sin(s.face), across = Math.abs(-dx * Math.sin(s.face) + dy * Math.cos(s.face));
        return along > 20 && along < 320 && across < 30;
      }
      case 'bulle': return mine && opps.some(o => near(o, 100));
      case 'crise': return opps.filter(o => near(o, 125)).length >= 2 || (oppHas && near(c, 110));
      case 'zoom': return (!c && HK.dist(s, p) > 160) || (mine && dNet > 320) || (oppHas && HK.dist(s, c) > 130 && HK.dist(s, c) < 400);
      case 'teleport': return (!c && HK.dist(s, p) > 260) || (oppHas && HK.dist(s, c) > 220) || (mine && dNet > 420);
      case 'aimant': return (!c && HK.dist(s, p) > 90 && HK.dist(s, p) < 320) || (oppHas && HK.dist(s, c) < 170);
      case 'glissade': {
        if (!oppHas) return false;
        const dx = c.x - s.x, dy = c.y - s.y, d = Math.hypot(dx, dy) || 1;
        return d < 220 && (dx * Math.cos(s.face) + dy * Math.sin(s.face)) / d > 0.8;
      }
      case 'capitaine': return c && c.team === s.team && (c.x - ownGX) * dir > 300;
      case 'blizzard': return oppHas && (c.x - ownGX) * dir < 480;
      case 'fantome': return mine && opps.some(o => near(o, 120));
      case 'slap': return mine && dNet < 380 && (oppGX - s.x) * dir > 60;
      case 'flash': return (oppHas && near(c, 180)) || (mine && dNet < 260 && opps.some(o => near(o, 150)));
      case 'tempsmort': return oppHas && (c.x - ownGX) * dir < 420;
      case 'charme': return (oppHas && near(c, 110)) || (mine && opps.some(o => near(o, 100)));
      case 'deal': return oppHas && HK.dist(s, c) < 300 && HK.dist(s, c) > 60;
      case 'objection': return oppHas && (c.x - ownGX) * dir < 500;
      case 'docteur': return T.skaters.some(m => m.down > 0 || m.stun > 0) || T.skaters.every(m => m.stamina < 0.5);
      case 'rage': return (oppHas && HK.dist(s, c) < 200) || (mine && opps.some(o => near(o, 110)));
      case 'mur': return oppHas && (c.x - ownGX) * dir < 350 && Math.abs(s.x - ownGX) < 260;
      case 'lemieux': return mine && dNet < 360 && (oppGX - s.x) * dir > 60;
      case 'nerfs': return (mine && opps.some(o => near(o, 110))) || (!c && HK.dist(s, p) > 150);
      case 'boucane': return (oppHas && near(c, 120)) || (mine && opps.filter(o => near(o, 130)).length >= 2);
      case 'chaise': return oppHas && (c.x - ownGX) * dir < 450;
    }
    return false;
  };
})(window.HK);
