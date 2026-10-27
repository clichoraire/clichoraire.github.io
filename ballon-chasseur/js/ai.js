// Intelligence des joueurs non contrôlés (équipe de l'ordi et coéquipiers du joueur humain).
// Chaque joueur reçoit une intention : p.ai.move = {dx, dy}, p.ai.act = 'a' | 'b' | 'p', p.ai.charge (charge du lancer),
// p.ai.willCatch (décidé au moment du lancer adverse).
(function (BC) {
  'use strict';
  const C = BC.COURT;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const DIFF = [
    { react: 0.55, catchMul: 0.55, superP: 0.12, dodge: 0.35, aim: 14, charge: 0.35, powerRate: 0.1 },
    { react: 0.35, catchMul: 0.8, superP: 0.3, dodge: 0.6, aim: 8, charge: 0.6, powerRate: 0.22 },
    { react: 0.2, catchMul: 0.9, superP: 0.5, dodge: 0.85, aim: 4, charge: 0.85, powerRate: 0.4 },
    { react: 0.13, catchMul: 1.05, superP: 0.7, dodge: 0.93, aim: 2, charge: 0.95, powerRate: 0.65 },
    { react: 0.08, catchMul: 1.2, superP: 0.85, dodge: 0.98, aim: 1, charge: 1, powerRate: 0.85 },
  ];

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
        const d = this.D;
        let hard = b.power === 'boulet' ? 0.15 : b.power === 'triche' || b.power === 'licorne' ? 0 : b.power ? 0.5 : b.smash ? 0.6 : 1;
        if(['goblinbomb','fireball','skullbomb'].includes(b.power))hard=0;
        if (b.power === 'fusee') hard = g.difficulty === 0 ? 0.4 : 0;   // la fusée explose dans les mains : on l'évite
        const skill = p.phys.catchSkill * d.catchMul * hard;
        p.ai.willCatch = Math.random() < skill; p.ai.decided = Math.random(); p.ai.reactT = d.react * (0.6 + Math.random() * 0.8);
      }
    }
    toward(p, x, y, slack) {
      const dx = x - p.x, dy = y - p.y, L = Math.hypot(dx, dy);
      if (L < (slack || 4)) return { dx: 0, dy: 0 };
      return { dx: dx / L, dy: dy / L };
    }
    // Faut-il utiliser son pouvoir maintenant ? (joueurs intérieurs de l'ordi et coéquipiers)
    power(p, dt) {
      const g = this.g, b = g.ball, D = this.D, ai = p.ai, id = p.power.id;
      if (!g.powerReady(p) || p.state !== 'idle') return false;
      ai.powerT = (ai.powerT == null ? 1 : ai.powerT) - dt; if (ai.powerT > 0) return false; ai.powerT = 0.8;
      const foesHold = b.holder && b.holder.team !== p.team, weHold = b.holder && b.holder.team === p.team, foes = g.opponentsOf(p);
      let want = false, rate = D.powerRate;
      switch (id) {
        case 'tongue': want = foesHold && Math.hypot(b.holder.x-p.x,b.holder.y-p.y)<360; rate=1; break;
        case 'camouflage': want = !p.charging; break;
        case 'carapace': want = b.state==='live' && b.team!==p.team && Math.hypot(b.x-p.x,b.y-p.y)<280; rate=1; break;
        case 'coldregency': want = true; break;
        case 'ribwall': want = foesHold || b.state==='live' && b.team!==p.team; break;
        case 'bonehand': want = foesHold || b.state==='dead'; break;
        case 'marrow': want = foes.length>0; break;
        case 'icepatch': case 'hex': case 'venom': case 'screech': case 'rootcry': case 'laser': case 'pikachu': case 'blizzard': case 'bulles': want = foes.length >= 2 || foesHold; break;
        case 'priere': want = g.players.some(q=>q.team===p.team&&q.alive&&q.hp<=q.maxHp*.6); break;
        case 'cri': want = weHold || foes.length === 3; break;
        case 'zoom': want = !weHold; rate *= 0.6; break;
        case 'aimant': want = foesHold || (b.state === 'dead' && g.sideOf(b.x) !== p.team); rate *= 2; break;
        default: want = p.hasBall;                                 // pouvoirs de lancer : on s'arme quand on tient la balle
      }
      if (want && Math.random() < rate) { ai.act = 'p'; ai.move = { dx: 0, dy: 0 }; return true; }
      return false;
    }
    inner(p, dt) {
      const g = this.g, b = g.ball, D = this.D, fwd = p.team === 0 ? 1 : -1;
      const foes = g.aliveInner(1 - p.team), ai = p.ai;
      if (!(p.state === 'idle' || p.state === 'jump' || p.state === 'catch')) { ai.move = { dx: 0, dy: 0 }; return; }
      if (this.power(p, dt)) return;
      // --- je tiens la balle : m'aligner avec une cible et lancer ---
      if (p.hasBall) {
        if (p.state === 'jump') { ai.move = { dx: fwd, dy: 0 }; if (Math.abs(p.vz) < 170) { ai.act = 'a'; ai.jumper = null; } return; }
        if (!ai.target || !ai.target.alive || ai.retarget < g.time) {
          ai.target = foes.slice().sort((a, c) => (a.hp - c.hp) * 0.4 + (Math.abs(a.y - p.y) - Math.abs(c.y - p.y)) * 0.1)[0] || null; ai.retarget = g.time + 1.2;
          ai.plan = Math.random() < D.superP ? 'run' : 'normal'; ai.hold = 0.15 + Math.random() * 0.4;
          ai.charge = clamp(D.charge * (0.5 + Math.random()), 0.1, 1);   // charge du lancer (X tenu)
        }
        const t = ai.target; if (!t) { ai.move = { dx: 0, dy: 0 }; return; }
        ai.hold -= dt;
        const aimY = t.y + (Math.random() - 0.5) * D.aim * 0.3;
        const dy = aimY - p.y, aligned = Math.abs(dy) < 5;
        if (ai.plan === 'run' && aligned && ai.hold < 0) {        // course puis saut par-dessus la ligne : smash
          const nearMid = fwd > 0 ? p.x > C.mid - 110 : p.x < C.mid + 110;
          if (!p.dash.active && !nearMid) { g.startDash(p, fwd); }
          if (p.dash.active) {
            ai.move = { dx: fwd, dy: 0 };
            if (ai.jumper == null) ai.jumper = Math.random() < 0.6;
            if (ai.jumper) { if (nearMid) ai.act = 'b'; } else if (nearMid || p.dash.t > 0.6) ai.act = 'a';
            return;
          }
          if (nearMid) { ai.act = 'a'; ai.plan = 'normal'; return; }
        }
        if (aligned) { if (ai.hold < 0) { ai.act = 'a'; ai.move = { dx: 0, dy: 0 }; } else ai.move = { dx: 0, dy: 0 }; return; }
        const back = ai.plan === 'run' ? 330 : 150, wantX = fwd > 0 ? C.mid - back : C.mid + back;
        ai.move = { dx: clamp((wantX - p.x) / 60, -1, 1) * 0.5, dy: clamp(dy / 20, -1, 1) };
        if (p.dash.active) ai.move.dx = fwd;
        return;
      }
      if (b.state === 'pass' && b.target === p) { ai.move = this.toward(p, b.landX, b.landY, 3); return; }
      // --- une bulle de savon arrive sur moi : je m'écarte ---
      for (const q of g.projectiles) {
        if (q.kind !== 'bubble' || q.team === p.team) continue;
        const tta = (p.x - q.x) / (q.vx || 1); if (tta < 0 || tta > 0.6) continue;
        if (Math.abs(q.y + q.vy * tta - p.y) < 36 && ai.decided < D.dodge + 0.2) { ai.move = { dx: 0, dy: (q.y + q.vy * tta - p.y) > 0 ? -1 : 1 }; return; }
      }
      // --- balle adverse en vol : attraper, sauter ou s'écarter ---
      if (b.state === 'live' && b.team !== p.team) {
        // la balle peut venir en diagonale, ou du haut / du bas (extérieurs) : on regarde où elle passera à ma hauteur
        const ax = Math.abs(b.vx) >= Math.abs(b.vy);
        const towardMe = ax ? Math.sign(b.vx) === Math.sign(p.x - b.x) : Math.sign(b.vy) === Math.sign(p.y - b.y);
        const tta = ax ? Math.abs(b.x - p.x) / Math.max(1, Math.abs(b.vx)) : Math.abs(b.y - p.y) / Math.max(1, Math.abs(b.vy));
        const predY = b.y + b.vy * tta, predX = b.x + b.vx * tta;
        const threatened = (towardMe || b.power === 'triche') && (ax ? Math.abs(predY - p.y) : Math.abs(predX - p.x)) < 40;
        if (threatened) {
          if (ai.willCatch) { if (tta < 0.17 && p.state === 'idle') { ai.act = 'b'; } ai.move = { dx: 0, dy: 0 }; return; }
          if (ai.decided < D.dodge) {
            if (tta < 0.26) {
              // sauter si la balle est basse ou si je n'ai plus le temps de bouger (un smash plonge d'en haut : on s'écarte plutôt)
              if (tta < 0.18 && ai.decided < D.dodge * 0.4 && !b.smash && b.power !== 'tornade' && p.state === 'idle') { ai.act = 'a'; ai.move = { dx: 0, dy: 0 }; return; }
              const up = p.y > (C.top + C.bottom) / 2 ? -1 : 1;
              if (ax) ai.move = { dx: 0, dy: (predY - p.y) > 0 ? -1 : (predY - p.y) < 0 ? 1 : up };
              else ai.move = { dx: (predX - p.x) > 0 ? -1 : 1, dy: 0 };
              return;
            }
          }
          ai.move = { dx: 0, dy: 0 }; return;
        }
        ai.move = this.spread(p, foes); return;
      }
      // --- passe adverse qui passe près de moi : intercepter ---
      if (b.state === 'pass' && b.team !== p.team && ai.decided < D.dodge + 0.1) {
        const d = Math.hypot(b.x - p.x, b.y - p.y), land = Math.hypot(b.landX - p.x, b.landY - p.y);
        if (d < 40 && b.z < 90 && p.state === 'idle') { ai.act = 'b'; ai.move = { dx: 0, dy: 0 }; return; }
        if (land < 90 || d < 120) { ai.move = this.toward(p, b.x + b.vx * 0.15, b.y + b.vy * 0.15, 6); return; }
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
      if(['goblin','skeleton','lizard'].includes(p.def.monster)&&this.power(p,dt))return;
      if (p.hasBall) {
        ai.hold = (ai.hold == null) ? 0.5 + Math.random() * 0.5 : ai.hold - dt;
        if (ai.charge == null) ai.charge = clamp(this.D.charge * (0.5 + Math.random()), 0.1, 1);
        // s'aligner sur un adversaire : haut/bas = même x, fond = même y
        const t = foes.slice().sort((a, c) => (p.lane === 'back' ? Math.abs(a.y - p.y) - Math.abs(c.y - p.y) : Math.abs(a.x - p.x) - Math.abs(c.x - p.x)))[0];
        if (!t) { ai.move = { dx: 0, dy: 0 }; return; }
        const d = p.lane === 'back' ? t.y - p.y : t.x - p.x;
        if (Math.abs(d) < 6) { if (ai.hold < 0) { ai.act = Math.random() < 0.7 ? 'a' : 'b'; ai.hold = null; ai.charge = null; } ai.move = { dx: 0, dy: 0 }; return; }
        if (ai.hold < -1.2) { ai.act = 'b'; ai.hold = null; ai.charge = null; return; }
        ai.move = p.lane === 'back' ? { dx: 0, dy: clamp(d / 15, -1, 1) } : { dx: clamp(d / 15, -1, 1), dy: 0 };
        return;
      }
      ai.hold = null; ai.charge = null;
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
