// Intelligence des joueurs non contrôlés (équipe de l'ordi et coéquipiers du joueur humain).
// Chaque joueur reçoit une intention : p.ai.move = {dx, dy}, p.ai.act = 'a' | 'b', p.ai.willCatch (décidé au moment du lancer adverse).
(function (BC) {
  'use strict';
  const C = BC.COURT;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const DIFF = [ { react: 0.55, catchMul: 0.55, superP: 0.12, dodge: 0.35, aim: 14 }, { react: 0.35, catchMul: 0.8, superP: 0.3, dodge: 0.6, aim: 8 }, { react: 0.2, catchMul: 0.9, superP: 0.5, dodge: 0.85, aim: 4 } ];

  BC.AI = class AI {
    constructor(game) { this.g = game; this.lastBallState = 'dead'; }
    get D() { return DIFF[this.g.difficulty] || DIFF[1]; }
    update(dt, ins) {
      const g = this.g, b = g.ball;
      // décision d'attrapé au moment où une balle adverse part
      if (b.state === 'live' && this.lastBallState !== 'live') this.onThrow();
      this.lastBallState = b.state;
      for (const p of g.players) {
        if (!p.alive) continue;
        if (g.isHuman(p.team) && g.controlled(p.team) === p) { p.ai.move = null; continue; }
        p.aiT -= dt;
        if (p.zone === 'out') this.outer(p, dt); else this.inner(p, dt);
      }
    }
    onThrow() {
      const g = this.g, b = g.ball;
      for (const p of g.aliveInner(1 - b.team)) {
        const d = this.D, S = b.superId ? BC.SUPERS[b.superId] : null;
        const skill = p.phys.catchSkill * d.catchMul * (S ? (1 - S.catch) : 1);
        p.ai.willCatch = Math.random() < skill; p.ai.decided = Math.random(); p.ai.reactT = d.react * (0.6 + Math.random() * 0.8);
      }
    }
    toward(p, x, y, slack) {
      const dx = x - p.x, dy = y - p.y, L = Math.hypot(dx, dy);
      if (L < (slack || 4)) return { dx: 0, dy: 0 };
      return { dx: dx / L, dy: dy / L };
    }
    inner(p, dt) {
      const g = this.g, b = g.ball, D = this.D, fwd = p.team === 0 ? 1 : -1;
      const foes = g.aliveInner(1 - p.team), ai = p.ai;
      if (!(p.state === 'idle' || p.state === 'jump' || p.state === 'catch')) { ai.move = { dx: 0, dy: 0 }; return; }
      // --- je tiens la balle : m'aligner avec une cible et lancer ---
      if (p.hasBall) {
        if (p.state === 'jump' && p.hasBall) { ai.move = { dx: fwd, dy: 0 }; if (Math.abs(p.vz) < 170) { ai.act = 'a'; ai.jumper = null; } return; }
        if (!ai.target || !ai.target.alive || ai.retarget < g.time) {
          ai.target = foes.slice().sort((a, c) => (a.hp - c.hp) * 0.4 + (Math.abs(a.y - p.y) - Math.abs(c.y - p.y)) * 0.1)[0] || null; ai.retarget = g.time + 1.2;
          ai.plan = Math.random() < D.superP ? 'super' : 'normal'; ai.hold = 0.15 + Math.random() * 0.4;
        }
        const t = ai.target; if (!t) { ai.move = { dx: 0, dy: 0 }; return; }
        ai.hold -= dt;
        const aimY = t.y + (Math.random() - 0.5) * D.aim * 0.3;
        const dy = aimY - p.y, aligned = Math.abs(dy) < 5;
        if (ai.plan === 'super' && aligned && ai.hold < 0) {
          const nearMid = fwd > 0 ? p.x > C.mid - 110 : p.x < C.mid + 110;
          if (!p.dash.active && !nearMid) { g.startDash(p, fwd); }
          if (p.dash.active) {
            ai.move = { dx: fwd, dy: 0 };
            if (ai.jumper == null) ai.jumper = Math.random() < 0.5;
            if (ai.jumper) { if (nearMid) ai.act = 'b'; }       // saut en course : on traverse la ligne en l'air
            else if (g.superWindow(p)) ai.act = 'a'; else if (nearMid) ai.act = 'a';
            return;
          }
          if (p.state === 'jump') { ai.move = { dx: fwd, dy: 0 }; if (Math.abs(p.vz) < 170) { ai.act = 'a'; ai.jumper = null; } return; }
          if (nearMid) { ai.act = 'a'; ai.plan = 'normal'; return; }
        }
        if (aligned) { if (ai.hold < 0) { ai.act = 'a'; ai.move = { dx: 0, dy: 0 }; } else ai.move = { dx: 0, dy: 0 }; return; }
        const back = ai.plan === 'super' ? 330 : 150, wantX = fwd > 0 ? C.mid - back : C.mid + back;
        ai.move = { dx: clamp((wantX - p.x) / 60, -1, 1) * 0.5, dy: clamp(dy / 20, -1, 1) };
        if (p.dash.active) ai.move.dx = fwd;
        return;
      }
      if (b.state === 'pass' && b.target === p) { ai.move = this.toward(p, b.landX, b.landY, 3); return; }
      // --- balle adverse en vol : attraper, sauter ou s'écarter ---
      if (b.state === 'live' && b.team !== p.team) {
        const towardMe = Math.sign(b.vx) === -fwd, dist = Math.abs(b.x - p.x), tta = dist / Math.max(1, Math.abs(b.vx));
        const threatened = Math.abs(b.y - p.y) < 40 && towardMe;
        if (threatened) {
          if (ai.willCatch) { if (tta < 0.17 && p.state === 'idle') { ai.act = 'b'; } ai.move = { dx: 0, dy: 0 }; return; }
          if (ai.decided < D.dodge) {
            if (tta < 0.26) {
              // sauter si la balle est basse ou si je n'ai plus le temps de bouger
              if (tta < 0.18 && ai.decided < D.dodge * 0.4 && b.superId !== 'rase' && p.state === 'idle') { ai.act = 'a'; ai.move = { dx: 0, dy: 0 }; return; }
              const up = p.y > (C.top + C.bottom) / 2 ? -1 : 1;
              ai.move = { dx: 0, dy: (b.y - p.y) > 0 ? -1 : (b.y - p.y) < 0 ? 1 : up }; return;
            }
          }
          ai.move = { dx: 0, dy: 0 }; return;
        }
        ai.move = this.spread(p, foes); return;
      }
      // --- balle morte sur mon côté : le plus proche court la chercher ---
      if (b.state === 'dead' && g.sideOf(b.x) === p.team && b.x > C.left - 10 && b.x < C.right + 10 && b.y > C.top - 20 && b.y < C.bottom + 20) {
        const mates = g.aliveInner(p.team).sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y));
        if (mates[0] === p) { ai.move = this.toward(p, b.x, b.y, 2); return; }
      }
      // --- l'adversaire a la balle : éviter d'être aligné avec le porteur, rester en retrait ---
      if (b.holder && b.holder.team !== p.team) {
        const h = b.holder, wantX = fwd > 0 ? C.left + 110 + (p.home.x - C.left) * 0.5 : C.right - 110 - (C.right - p.home.x) * 0.5;
        if (p.aiT <= 0) {                         // nouvelle décision toutes les 0,3 à 0,6 s : s'écarter du porteur ou patrouiller
          p.aiT = 0.3 + Math.random() * 0.3;
          if (Math.abs(h.y - p.y) < 55 && Math.random() < D.dodge + 0.15) ai.dy = p.y > h.y ? 1 : -1;
          else ai.dy = this.patrol(p);
        }
        let dy = ai.dy || 0;
        if (p.y < C.top + 30) dy = Math.max(dy, 0); if (p.y > C.bottom - 30) dy = Math.min(dy, 0);
        ai.move = { dx: clamp((wantX - p.x) / 40, -1, 1), dy };
        return;
      }
      ai.move = this.spread(p, foes);
    }
    // Petit va-et-vient permanent autour de sa position : les joueurs ne restent jamais plantés.
    patrol(p) {
      const want = p.home.y + Math.sin(this.g.time * 0.9 + p.home.x * 0.01 + p.team * 2) * 45;
      return Math.abs(want - p.y) < 6 ? 0 : (want > p.y ? 0.55 : -0.55);
    }
    // se répartir en profondeur, chacun vers sa position de départ, en bougeant toujours un peu
    spread(p, foes) {
      const g = this.g, b = g.ball, fwd = p.team === 0 ? 1 : -1;
      let tx = p.home.x;
      if (b.holder && b.holder.team === p.team && b.holder.zone === 'in') { tx = fwd > 0 ? C.left + 120 : C.right - 120; }
      const dx = clamp((tx - p.x) / 50, -1, 1) * 0.6;
      return { dx: Math.abs(tx - p.x) < 8 ? 0 : dx, dy: this.patrol(p) };
    }
    outer(p, dt) {
      const g = this.g, b = g.ball, ai = p.ai, foes = g.aliveInner(1 - p.team);
      if (!(p.state === 'idle')) { ai.move = { dx: 0, dy: 0 }; return; }
      if (p.hasBall) {
        ai.hold = (ai.hold == null) ? 0.5 + Math.random() * 0.5 : ai.hold - dt;
        // s'aligner sur un adversaire : haut/bas = même x, fond = même y
        const t = foes.slice().sort((a, c) => (p.lane === 'back' ? Math.abs(a.y - p.y) - Math.abs(c.y - p.y) : Math.abs(a.x - p.x) - Math.abs(c.x - p.x)))[0];
        if (!t) { ai.move = { dx: 0, dy: 0 }; return; }
        const d = p.lane === 'back' ? t.y - p.y : t.x - p.x;
        if (Math.abs(d) < 6) { if (ai.hold < 0) { ai.act = Math.random() < 0.7 ? 'a' : 'b'; ai.hold = null; } ai.move = { dx: 0, dy: 0 }; return; }
        if (ai.hold < -1.2) { ai.act = 'b'; ai.hold = null; return; }
        ai.move = p.lane === 'back' ? { dx: 0, dy: clamp(d / 15, -1, 1) } : { dx: clamp(d / 15, -1, 1), dy: 0 };
        return;
      }
      ai.hold = null;
      if (b.state === 'pass' && b.target === p) { ai.move = this.toward(p, b.landX, b.landY, 3); return; }   // on attend la passe là où elle arrive
      // suivre la balle le long du couloir si elle est de mon côté, sinon rester au centre du couloir
      const inReach = g.inLane(p, b) || (b.state !== 'held' && (p.lane === 'back' ? Math.abs(b.x - p.x) < 120 : Math.abs(b.y - p.y) < 120));
      let tx = p.x, ty = p.y;
      if (p.lane === 'back') ty = inReach ? b.y : (b.holder ? b.holder.y : (C.top + C.bottom) / 2);
      else tx = inReach ? b.x : (p.team === 0 ? C.mid + (C.right - C.mid) / 2 : C.left + (C.mid - C.left) / 2);
      ai.move = this.toward(p, tx, ty, 3);
    }
  };
})(window.BC);
