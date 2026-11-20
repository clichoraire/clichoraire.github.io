// Goblin Malin — petit clan de passage : rarement, 2 à 5 gobelins campent quelque part. Si le chef est assez fort face au leur, ils le suivent... à condition de les reconduire à pied jusqu'au village.
'use strict';
(function (CG) {
  const G = CG.G, W = CG.W, D = CG.D, T = CG.TILE, PC = CG.PetitClan = {}, TAU = Math.PI * 2;
  const rand = CG.rand, pick = CG.pick, dist = CG.dist;
  PC.CHANCE = 0.14;   // chance par matin, à partir du jour 3
  PC.LOIN = 340;      // au-delà, ils perdent le chef de vue et s'arrêtent
  PC.PRES = 150;      // il faut revenir à cette distance pour qu'ils repartent
  PC.ARRIVE = 240;    // distance du feu du village où ils sont « arrivés »
  const CLANS = ['de la Dent Creuse', 'du Marais Puant', 'de la Souche Noire', 'des Trois Cailloux', 'de la Lune Verte', 'du Champignon Rouge', 'de l\'Os Tordu'];
  const boss = b => b.m[0];

  PC.spawn = function (force) {
    const S = CG.S, R = CG.R, p = S.player; if (R.band) return null;
    let spot = null;
    for (let k = 0; k < 4000 && !spot; k++) {
      const x = 6 + Math.floor(Math.random() * (CG.MW - 12)), y = 6 + Math.floor(Math.random() * (CG.MH - 12)), d = Math.hypot(x - W.CX, y - W.CY);
      if (d < 18 || d > 34 || !W.reachable(x, y)) continue; let ok = true;
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -2; dx <= 2; dx++) if (!W.walkTile(x + dx, y + dy)) { ok = false; break; }
      if (!ok || !Object.values(W.POI).every(q => Math.hypot(x - q.x, y - q.y) > q.r + 4) || !Object.values(W.EXITS).every(e => Math.hypot(x - e.x, y - e.y) > 7)) continue;
      if ((S.autels || []).some(a => Math.hypot(x - a.tx, y - a.ty) < 8)) continue;
      spot = { x: x * T + T / 2, y: y * T + T / 2 };
    }
    if (!spot) return null;
    const n = 2 + Math.floor(Math.random() * 4), used = new Set(S.goblins.map(g => g.name)), m = [];
    for (let i = 0; i < n; i++) {
      const sex = i === 0 ? 'm' : Math.random() < 0.5 ? 'f' : 'm', pool = (sex === 'f' ? CG.NAMES_F : CG.NAMES_M).filter(q => !used.has(q)), name = pool.length ? pick(pool) : 'Gob' + i; used.add(name);
      const a = i ? (i / (n - 1 || 1)) * TAU + 0.6 : -1.57, o = { id: -200 - i, name, sex, job: 'aucun', lvl: 1, equip: {}, hue: rand(74, 132), lum: rand(42, 50), x: spot.x + (i ? Math.cos(a) * 46 : 0), y: spot.y + (i ? Math.sin(a) * 30 + 8 : -34), face: 1, step: 0, moving: false, path: null, repath: 0, seed: Math.random() * 10, hx: 0, hy: 0 };
      o.hx = o.x; o.hy = o.y; o.look = CG.Art8.randomLook(o); m.push(o);
    }
    const lvl = force && force.lvl ? force.lvl : Math.max(1, p.lvl + pick([-3, -2, -1, -1, 0, 0, 1, 2])); m[0].lvl = lvl; m[0].boss = true;
    R.band = { m, x: spot.x, y: spot.y, st: 'camp', lvl, day: S.day, clan: pick(CLANS), seen: false, tried: 0 };
    return R.band;
  };
  function join(b) {
    const S = CG.S, R = CG.R; R.band = null;
    b.m.forEach(o => { const g = G.addGoblin(o.sex, 'aucun'); g.name = o.name; g.x = o.x; g.y = o.y; g.hue = o.hue; g.lum = o.lum; g.look = o.look; g.emoteT = 3; G.puff(g.x, g.y - 20, '#c8ffb0', 8, 80, 3); });
    S.morale = Math.min(100, S.morale + 5); CG.sfx('level');
    G.banner('Le clan ' + b.clan + ' rejoint ton village !', b.m.length + ' nouveaux gobelins. Va leur parler et donne-leur un métier.', '#c8ffb0');
  }
  function step(dt) {
    const S = CG.S, R = CG.R, p = S.player, b = R.band;
    if (R.bandDay !== S.day) { // un nouveau matin : le clan d'hier est reparti (sauf s'il te suit), un autre passe peut-être
      const first = R.bandDay === undefined; R.bandDay = S.day;
      if (b && (b.st === 'camp' || b.st === 'refus')) R.band = null;
      if (!first && !R.band && S.day >= 3 && Math.random() < PC.CHANCE) PC.spawn();
      return;
    }
    if (!b) return;
    const c = boss(b); if (!b.seen && CG.onScreen(c.x, c.y)) b.seen = true;
    if (b.st === 'camp' || b.st === 'refus') { // au camp : ils se dandinent près du feu
      b.m.forEach(o => { o.moving = false; o.face = (o === c ? p.x : b.x) > o.x ? 1 : -1; });
      return;
    }
    const d = dist(c, p);
    if (b.st === 'suit' && (d > PC.LOIN || R.ko > 0)) { b.st = 'attend'; b.m.forEach(o => { o.path = null; o.moving = false; }); G.say(c, pick(['Hé ! Chef ! On te voit plus !', 'Attends-nous ! On a des petites jambes !', 'Où il est passé ? On bouge plus d\'ici.']), 4); CG.sfx('no'); }
    else if (b.st === 'attend' && d < PC.PRES && !(R.ko > 0)) { b.st = 'suit'; G.say(c, pick(['Ah, te revoilà ! On te suit.', 'On a eu peur ! Allez, en route.']), 3); CG.sfx('ok'); }
    if (b.st === 'attend') { b.m.forEach(o => { o.moving = false; o.face = p.x > o.x ? 1 : -1; }); return; }
    // en file derrière le chef
    b.m.forEach((o, i) => {
      const lead = i ? b.m[i - 1] : p, gap = i ? 30 : 46, dd = dist(o, lead); o.moving = false;
      if (dd > gap) G.chase(o, lead.x, lead.y + (i ? 0 : 8), dd > 150 ? 170 : 150, dt); else o.face = lead.x > o.x ? 1 : -1;
    });
    if (dist(c, G.firePos()) < PC.ARRIVE) join(b);
  }
  const up0 = G.update; G.update = function (dt) { up0(dt); step(dt); };

  // ---------- parler à leur chef ----------
  const find0 = D.findInteract;
  D.findInteract = function () {
    const R = CG.R, b = R.band; if (b && !(R.ko > 0) && !R.cine && !R.build && dist(boss(b), CG.S.player) < 58) return { type: 'petitclan', obj: b, label: 'Parler à ' + boss(b).name + ', chef du petit clan' };
    return find0.apply(this, arguments);
  };
  const inter0 = D.interact;
  D.interact = function () {
    const it = D.findInteract(); if (!it || it.type !== 'petitclan') return inter0.apply(this, arguments);
    const S = CG.S, b = it.obj, c = boss(b), p = S.player, n = b.m.length, room = G.capacity() - S.goblins.length, tag = 'chef du clan ' + b.clan + ' · niv. ' + b.lvl + ' (toi : niv. ' + p.lvl + ')';
    if (b.st === 'suit' || b.st === 'attend') return CG.UI.dialog({ goblin: c, who: c.name, tag, text: b.st === 'attend' ? 'On t\'attendait, chef. Ne file pas si vite !' : 'On te suit, chef. C\'est encore loin, ton village ?', options: [
      { label: '👣 Suivez-moi, on y est presque.', fn: () => { b.st = 'suit'; } },
      { label: '👋 Finalement, restez chez vous.', sub: 'Ils retournent à leur camp et ne te suivront plus', fn: () => { b.st = 'refus'; b.tried = 99; b.m.forEach(o => { o.x = o.hx; o.y = o.hy; o.path = null; }); } }] });
    if (b.tried === 99) return CG.UI.dialog({ goblin: c, who: c.name, tag, text: 'Tu nous as renvoyés. On ne marche pas deux fois pour le même chef.', options: [{ label: 'Tant pis.' }] });
    const fort = p.lvl >= b.lvl;
    CG.UI.dialog({ goblin: c, who: c.name, tag, text: b.st === 'refus' ? 'Encore toi ? Tu as pris du muscle depuis tantôt ?' : 'Halte ! Moi, c\'est ' + c.name + ', chef du clan ' + b.clan + '. On est ' + n + ', on cherche un coin tranquille. Qu\'est-ce que tu veux ?', options: [
      { label: '💪 Venez dans mon clan. Je suis plus fort que toi.', sub: room < n ? 'Il te faut ' + n + ' places libres dans tes huttes (tu en as ' + Math.max(0, room) + ')' : 'S\'il te trouve assez fort, tout son clan te suivra jusqu\'au village — à pied', disabled: room < n || (b.st === 'refus' && b.tried >= p.lvl), fn: () => {
        if (!fort) { b.st = 'refus'; b.tried = p.lvl; G.say(c, pick(['Ha ! Toi, plus fort que moi ? Reviens quand tu auras grandi.', 'Hi hi hi ! Regardez-le, avec ses petits bras ! Non merci.', 'Un chef plus faible que moi ? Jamais. Reviens plus costaud.']), 5); CG.sfx('no'); return; }
        b.st = 'suit'; G.say(c, pick(['...C\'est vrai. Tu es plus fort. On te suit, chef !', 'Bon. Un chef comme toi, ça se refuse pas. Montre le chemin !']), 4); CG.sfx('level');
        CG.UI.toast('👣 Le petit clan te suit. Reconduis-le à pied jusqu\'au village : si tu t\'éloignes trop ou te téléportes, il s\'arrête et t\'attend.');
      } },
      { label: '👋 Bonne route.' }] });
  };

  // ---------- dessin ----------
  const poly = (g, q, f) => { g.fillStyle = f; g.beginPath(); g.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) g.lineTo(q[i], q[i + 1]); g.closePath(); g.fill(); };
  PC.drawCamp = function (g, b, t) {
    const x = b.x, y = b.y;
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(x + 56, y + 4, 34, 9, 0, 0, TAU); g.fill();
    poly(g, [x + 24, y + 4, x + 56, y - 46, x + 88, y + 4], '#9a6e44'); poly(g, [x + 56, y - 46, x + 88, y + 4, x + 62, y + 4], '#7c5634'); poly(g, [x + 48, y + 4, x + 56, y - 18, x + 64, y + 4], '#3a2414');
    g.fillStyle = '#5a3d22'; g.fillRect(x + 54.5, y - 54, 3, 10);
    g.fillStyle = '#6e7479'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.ellipse(x + Math.cos(a) * 13, y + 6 + Math.sin(a) * 6, 4, 3, 0, 0, TAU); g.fill(); }
    const f = Math.sin(t * 9) * 2; poly(g, [x - 8, y + 6, x, y - 18 - f, x + 8, y + 6], '#f2702a'); poly(g, [x - 4, y + 6, x + 1, y - 8 - f, x + 5, y + 6], '#ffd23a');
  };
  PC.draw = function (g, o, t) {
    const b = CG.R.band, s = o.boss ? 1.13 : 0.96;
    g.save(); g.translate(o.x, o.y); g.scale(s, s);
    CG.Art.goblin(g, { ent: o, x: 0, y: 0, face: o.face, t: t + o.seed, moving: o.moving, step: o.step, sex: o.sex, hue: o.hue, lum: o.lum, job: 'aucun', equip: {}, tool: o.boss ? 'lance' : null, look: o.look, noHat: true });
    g.restore();
    if (o.boss) { g.font = 'bold 12px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.fillStyle = '#ffe9a8'; const txt = '👑 ' + o.name + ' · niv. ' + o.lvl; g.strokeText(txt, o.x, o.y - 62); g.fillText(txt, o.x, o.y - 62); if (b && b.st === 'attend') CG.Art.bubble(g, o.x, o.y - 84 + Math.sin(t * 3) * 2, '✋'); }
  };
})(window.CG);
