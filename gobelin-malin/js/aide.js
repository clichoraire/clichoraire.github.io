// Clan Gobelin — « Chef, à l'aide ! » : un gobelin parti travailler qui tombe sur un monstre vient chercher le chef, s'il est près du village.
// Si le chef accepte, le gobelin le suit jusqu'à ce que les monstres soient morts (un repère rouge les montre sur la mini-carte) : le moral monte.
// S'il refuse, le moral baisse, et le gobelin retourne travailler ailleurs.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, UI = CG.UI, Soc = CG.Soc, T = CG.TILE, pick = CG.pick, clamp = CG.clamp, Ai = CG.Aide = { RAYON: 300, GROUPE: 260, ATTENTE: 180, LOIN: 320, ARRET: 185, pause: 0 };
  const fem = g => g.sex === 'f';
  const vivants = a => a.es.filter(e => !e.dead && CG.R.enemies.includes(e));
  const centre = l => { let x = 0, y = 0; l.forEach(e => { x += e.x; y += e.y; }); return { x: x / l.length, y: y / l.length }; };
  const nomDe = l => { const n = {}; l.forEach(e => { const k = (CG.ENEMIES[e.type] || {}).nom || 'monstre'; n[k] = (n[k] || 0) + 1; }); const ks = Object.keys(n); return ks.length === 1 ? (n[ks[0]] > 1 ? n[ks[0]] + ' ' + ks[0].toLowerCase() + 's' : 'un ' + ks[0].toLowerCase()) : l.length + ' monstres'; };
  function finir(g) { const R = CG.R; if (R.aide === g.aide) R.aide = null; g.aide = null; g.bubble = null; if (g.state === 'aide') G.resetGoblin(g); /* sinon il restait figé sur place, dans un état que personne d'autre ne connaît */ }
  // ---------- qui demande de l'aide ----------
  const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return; if (Ai.pause > 0) Ai.pause -= dt;
    const a = R.aide;
    if (a) { // le repère rouge : là où sont les monstres, tant qu'il en reste
      a.ping -= dt; if ((a.ph === 'mene' || a.ph === 'la') && a.ping <= 0) { a.ping = 1.6; const l = vivants(a); if (l.length && R.pings) { const c = centre(l); R.pings = R.pings.filter(q => !q.aide); if (a.ph === 'mene') R.pings.push({ x: a.g.x, y: a.g.y, t0: performance.now() - 700, icon: '👣', dur: 3200, aide: true }); /* le guide : un repère doré rien qu'à lui */ R.pings.push({ x: c.x, y: c.y, t0: performance.now() - 700, icon: '🆘', foe: true, dur: 3200, aide: true }); l.forEach(e => { e.seen = true; }); } }
      return;
    }
    if (R.alarm || R.night || R.cine || R.ko > 0 || Ai.pause > 0 || !Soc.inVillage() || (Soc.combat && Soc.combat())) return; // pas pendant que le chef se bat
    for (const g of S.goblins) {
      if (!(g.alerte > 0)) { g.aideVu = false; continue; } if (g.aideVu || g.hidden || g.job === 'garde' || g.chicane || g.repli || g.child || !g.met) continue; g.aideVu = true; // une seule demande par frayeur
      let pres = null, bd = Ai.RAYON; for (const e of R.enemies) { if (e.dead || e.struct || e.calm || !e.wild) continue; const d = Math.hypot(e.x - g.x, e.y - g.y); if (d < bd) { bd = d; pres = e; } }
      if (!pres || CG.dist(g, G.firePos()) < 200) continue;
      const es = R.enemies.filter(e => !e.dead && !e.struct && e.wild && Math.hypot(e.x - pres.x, e.y - pres.y) < Ai.GROUPE);
      R.aide = g.aide = { g, es, lieu: { x: pres.x, y: pres.y }, ph: 'va', t: 30, ping: 0 }; G.resetGoblin(g); g.repath = 0; break;
    }
  };
  // quand la peur retombe, la prochaine frayeur pourra de nouveau déclencher une demande
  // ---------- la routine du gobelin qui cherche de l'aide, puis qui suit le chef ----------
  Ai.step = function (g, dt) {
    const R = CG.R, S = CG.S, a = g.aide, p = S.player; if (!a) { if (g.state === 'aide') G.resetGoblin(g); return false; }
    if (R.aide !== a || R.alarm || R.night) { finir(g); return false; }
    g.alerte = 0; g.pose = null; g.state = 'aide'; const d = CG.dist(g, p);
    if (a.ph === 'va') {
      a.t -= dt; if (a.t <= 0 || !vivants(a).length) { finir(g); return false; } g.bubble = '🆘'; /* le chef peut sortir du village à sa rencontre : il continue de courir vers lui */
      if (d > 56) { g.repath -= dt; if (!g.path || !g.path.length || g.repath <= 0) { G.goTo(g, p.x, p.y + 8); g.repath = 0.8; } G.follow(g, 190, dt); return true; }
      g.moving = false; g.face = p.x > g.x ? 1 : -1; if (!UI.modal && !R.cine) demander(g, a); return true;
    }
    if (a.ph === 'parle') { g.moving = false; g.face = p.x > g.x ? 1 : -1; if (!UI.modal) { finir(g); Ai.pause = 45; G.say(g, pick(['Bon... tu es occupé, chef. Je vais me débrouiller.', 'Ah. D\'accord. Je repasserai plus tard, chef.', 'Tu ne dis rien ? Bon... tant pis.']), 3.5); G.resetGoblin(g); return false; } return true; } // fenêtre fermée sans répondre : il n'insiste pas
    a.t -= dt; g.bubble = null; const l = vivants(a);
    if (!l.length) { reussi(g, a); return false; }
    if (a.t <= 0) { finir(g); S.morale = Math.max(0, S.morale - 2); G.say(g, 'Bon... on oublie ça, chef.', 3.5); UI.toast('😕 ' + g.name + ' a attendu en vain que tu chasses ' + nomDe(l) + '. (moral -2)'); G.resetGoblin(g); return false; }
    let pm = 1e9; for (const e of l) pm = Math.min(pm, Math.hypot(e.x - g.x, e.y - g.y));
    if (a.ph === 'mene') { // c'est lui qui ouvre le chemin : il attend le chef s'il traîne, et s'arrête avant les monstres
      if (pm < Ai.ARRET) { a.ph = 'la'; g.path = null; g.moving = false; a.cri = 6; G.say(g, pick(['Ils sont là, chef ! Juste devant !', 'C\'est là ! Tu les vois ? Moi, je ne vais pas plus loin.', 'Chut... les voilà, chef. À toi de jouer !']), 4.5); g.emoteT = 1; if (CG.onScreen(g.x, g.y)) CG.sfx('warning'); return true; }
      if (d > (a.pause ? 105 : 175)) { a.pause = true; g.moving = false; g.face = p.x > g.x ? 1 : -1; a.cri -= dt; if (a.cri <= 0) { a.cri = 5 + Math.random() * 4; G.say(g, pick(['Par ici, chef !', 'Suis-moi, chef ! C\'est par là !', 'Tu viens, chef ?', 'Dépêche-toi, chef !']), 2.6); } return true; }
      a.pause = false; a.rep -= dt;
      if (!g.path || !g.path.length || a.rep <= 0) { const c = centre(l); a.rep = 2.5; if (!G.goTo(g, c.x, c.y)) { a.ph = 'la'; return true; } } // pas de chemin : il reste près du chef
      G.follow(g, 104, dt); return true;
    }
    // arrivé : il reste derrière le chef pendant que ça cogne
    if (d > 700) { g.x = p.x - 30; g.y = p.y + 12; g.path = null; G.unstick(g, 8); }
    if (d > (pm < 130 ? 130 : 64)) { g.repath -= dt; if (!g.path || !g.path.length || g.repath <= 0) { G.goTo(g, p.x - (p.face || 1) * 30, p.y + 12); g.repath = 0.6; } G.follow(g, d > 180 ? 190 : 120, dt); } else { g.moving = false; g.face = p.x > g.x ? 1 : -1; }
    a.cri -= dt; if (a.cri <= 0) { a.cri = 7 + Math.random() * 6; G.say(g, pick(['Attention, chef !', 'Vas-y, chef ! Tape !', 'Je... je reste derrière toi !']), 2.6); }
    return true;
  };
  function demander(g, a) {
    const S = CG.S, l = vivants(a), quoi = nomDe(l); a.ph = 'parle';
    UI.dialog({ goblin: g, who: g.name, tag: '🆘 a besoin de toi', text: pick(['Chef ! Chef ! Il y a ' + quoi + ' là où je travaille ! J\'ai eu la peur de ma vie. Tu viens m\'aider ?', 'Chef, au secours ! Je suis tombé' + (fem(g) ? 'e' : '') + ' sur ' + quoi + ' en allant travailler. Tu peux t\'en occuper ?', 'Chef ! ' + quoi.charAt(0).toUpperCase() + quoi.slice(1) + ' ! Juste à côté de mon coin ! Je n\'y retourne pas tout' + (fem(g) ? 'e' : '') + ' seul' + (fem(g) ? 'e' : '') + ' !']), options: [
      { label: '⚔️ Oui, je viens t\'aider. Montre-moi où c\'est.', sub: g.name + ' te montre le chemin : suis le gobelin entouré d\'or (repère doré sur la mini-carte)', fn: () => { a.ph = 'mene'; a.t = Ai.ATTENTE; a.ping = 0; a.cri = 3; a.rep = 0; a.pause = false; G.text(g.x, g.y - 50, '❤️', '#fff', true); G.say(g, pick(['Merci, chef ! Suis-moi, c\'est par là !', 'Oh, merci ! Viens, je te montre !']), 3.5); CG.sfx('ok'); } },
      { label: '⏳ Je n\'ai pas le temps. Prends un autre chemin.', echap: true, sub: 'Le moral baisse un peu, et ' + (fem(g) ? 'elle' : 'il') + ' change de coin', fn: () => { refuse(g, a); } }] });
  }
  function reussi(g, a) {
    const S = CG.S; finir(g); Ai.pause = 40; S.morale = Math.min(100, S.morale + 4); G.addXp(6); g.ami = clamp((g.ami || 0) + 2, -6, 6); g.pep = Math.max(g.pep || 0, 40); g.emoteT = 2;
    G.text(g.x, g.y - 52, '❤️✨', '#fff', true); G.say(g, pick(['Tu es le meilleur chef du monde !', 'Merci, chef ! Je retourne travailler le cœur léger.', 'Hourra ! Je vais le raconter à tout le monde !']), 4); Soc.bystanders(g, 'good'); CG.sfx('victory');
    UI.toast('😄 Tu as débarrassé ' + g.name + ' des monstres : le clan sait qu\'il peut compter sur toi. (moral +4)'); if (CG.R.pings) CG.R.pings = CG.R.pings.filter(q => !q.aide); G.resetGoblin(g);
  }
  function refuse(g, a) {
    const S = CG.S; finir(g); Ai.pause = 60; S.morale = Math.max(0, S.morale - 3); g.ami = clamp((g.ami || 0) - 1, -6, 6); g.evite = { x: a.lieu.x, y: a.lieu.y, day: S.day };
    G.text(g.x, g.y - 50, '💢', '#fff', true); G.say(g, pick(['Ah... bon. D\'accord, chef.', 'Je vais aller voir ailleurs, alors.', 'Je croyais que tu nous protégeais...']), 4); Soc.bystanders(g, 'bad'); CG.sfx('no');
    UI.toast('😟 ' + g.name + ' repart travailler ailleurs, la tête basse. (moral -3)'); G.resetGoblin(g);
  }
  // après un refus : pour la journée, il évite le coin où rôdent les monstres (s'il y a un autre endroit où travailler)
  Ai.ailleurs = function (g, ns) { const v = g.evite; if (!v || v.day !== CG.S.day) return ns; const ok = ns.filter(n => Math.hypot(n.x * T + T / 2 - v.x, n.y * T + T / 2 - v.y) > Ai.LOIN); return ok.length ? ok : ns; };
  // le guide se reconnaît de loin : un halo doré qui bat sous ses pieds, et des chevrons qui pointent où il va
  const gr0 = CG.Magie.ground; CG.Magie.ground = function (c, t) {
    const R = CG.R, a = R && R.aide; if (a && (a.ph === 'mene' || a.ph === 'la') && !a.g.hidden && CG.onScreen(a.g.x, a.g.y)) { const g = a.g, pu = 0.5 + 0.5 * Math.sin(t * 5);
      c.save(); const gr = c.createRadialGradient(g.x, g.y + 2, 3, g.x, g.y + 2, 34); gr.addColorStop(0, 'rgba(255,220,90,' + (0.5 + pu * 0.2) + ')'); gr.addColorStop(1, 'rgba(255,220,90,0)'); c.fillStyle = gr; c.beginPath(); c.ellipse(g.x, g.y + 2, 34, 15, 0, 0, 6.3); c.fill();
      c.strokeStyle = 'rgba(255,236,150,' + (0.75 + pu * 0.25) + ')'; c.lineWidth = 2.5; c.setLineDash([9, 6]); c.lineDashOffset = -t * 26; c.beginPath(); c.ellipse(g.x, g.y + 2, 22 + pu * 3, 9.5 + pu * 1.3, 0, 0, 6.3); c.stroke(); c.setLineDash([]);
      if (a.ph === 'mene' && g.path && g.path.length) { const n = g.path[0], dx = n.x - g.x, dy = n.y - g.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 3;
        for (let i = 0; i < 3; i++) { const k = ((t * 1.6 + i / 3) % 1), cx = g.x + ux * (30 + k * 34), cy = g.y + 2 + uy * (30 + k * 34) * 0.8; c.strokeStyle = 'rgba(255,236,150,' + Math.sin(k * Math.PI) * 0.9 + ')'; c.beginPath(); c.moveTo(cx - ux * 6 - uy * 7, cy - uy * 5 + ux * 6); c.lineTo(cx, cy); c.lineTo(cx - ux * 6 + uy * 7, cy - uy * 5 - ux * 6); c.stroke(); } }
      c.restore(); }
    return gr0.apply(this, arguments);
  };
  // même s'il courait chercher le chef : avec une arme et une bête sur lui, il se défend d'abord (espion.js)
  { const as0 = Ai.step; Ai.step = function (g, dt) { if (CG.Espion && CG.Espion.defend && g.job !== 'garde' && !G.militia(g) && CG.Espion.defend(g, dt)) return true; return as0.apply(this, arguments); }; }
  const sd0 = D.startDay; D.startDay = function () { const R = CG.R; if (R) R.aide = null; const r = sd0.apply(this, arguments); CG.S.goblins.forEach(g => { g.aide = null; g.evite = null; }); return r; };
})(window.CG);
