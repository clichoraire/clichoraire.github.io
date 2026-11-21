// Goblin Malin — un village plus calme. Tout est réglable dans CG.Calme.
//   1) Pas plus de deux visiteurs à la fois près du feu : le suivant attend son tour (il viendra un peu plus tard dans la journée).
//   2) L'alerte suit ce qui se passe vraiment. Si plus aucun assaillant n'est près du village (les autres sont encore loin, ou
//      perdus dans la forêt), l'alerte se tait au bout de quelques secondes et les gobelins ressortent ; elle reprend dès que
//      les suivants arrivent. Et un assaillant qui piétine loin du village sans s'en approcher finit par abandonner.
// Chargé après tous les fichiers qui amènent des visiteurs.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, Ca = CG.Calme = { VISITEURS: 2, ATTENTE: 0.75, FIN: 17.5, SILENCE: 5, PRES_CHEF: 420, PIETINE: 25, PROGRES: 48 };
  // ---------- 1. deux visiteurs au plus ----------
  Ca.presents = function () { // ceux qui sont venus voir le chef : pas les animaux sauvages de la forêt, ni les escortes, ni ceux qui repartent
    const R = CG.R, vus = new Set(); let n = 0;
    for (const v of (R && R.visitors) || []) { if (v.state === 'leave' || v.sauvage || v.spectre || v.merci || v.maitre || v.role === 'escorte') continue;
      if (v.group) { if (vus.has(v.group)) continue; vus.add(v.group); } n++; }
    return n;
  };
  const plein = () => Ca.presents() >= Ca.VISITEURS;
  const plusTard = ev => { const S = CG.S, R = CG.R; if (!R || !R.schedule || S.hour + Ca.ATTENTE > Ca.FIN) return; if (R.schedule.includes(ev)) { ev.done = false; ev.h = S.hour + Ca.ATTENTE; } else R.schedule.push(Object.assign({}, ev, { h: S.hour + Ca.ATTENTE, done: false })); };
  const sv0 = D.startVisit; D.startVisit = function (ev) { if (ev && plein()) return void plusTard(ev); return sv0.apply(this, arguments); };
  const sd0 = D.startDemand; D.startDemand = function () { if (plein()) return void plusTard({ type: 'demande' }); return sd0.apply(this, arguments); };
  // ---------- 2. l'alerte se tait quand il n'y a plus personne en vue ----------
  let tic = 0, silence = 0;
  const up0 = D.update; D.update = function (dt) {
    const r = up0.apply(this, arguments), S = CG.S, R = CG.R, ev = R && R.event; if (!S || !ev || ev.type !== 'attack') { silence = 0; return r; }
    if ((tic -= dt) > 0) return r; tic = 0.5;
    const p = S.player, f = G.firePos(), vivants = R.enemies.filter(e => e.event && !e.dead && !e.struct); let pres = false;
    for (const e of vivants) {
      const ici = D.nearVillage(e) || CG.dist(e, p) < Ca.PRES_CHEF; if (ici) { pres = true; e.pb = undefined; e.pt = 0; continue; }
      if (e.hunt || e.retreat) continue;
      const d = CG.dist(e, f); if (e.pb === undefined || d < e.pb - Ca.PROGRES) { e.pb = d; e.pt = 0; continue; }
      if ((e.pt = (e.pt || 0) + 0.5) < Ca.PIETINE) continue; // il n'avance plus vers le village : il abandonne
      if (e.campId) { e.event = false; e.wild = { x: e.x, y: e.y }; e.target = null; e.aggro = null; e.path = null; } else e.dead = true;
    }
    if (!R.alarm || !ev.heard || ev.nightRaid || ev.demonLord || R.night) { silence = 0; return r; }
    silence = pres ? 0 : silence + 0.5;
    if (silence >= Ca.SILENCE && vivants.some(e => !e.dead)) { silence = 0; R.alarm = false; ev.quiet = true; G.banner('Plus personne en vue...', 'Reste sur tes gardes.', '#ffe9a8'); }
    return r;
  };
  // les portails sont maintenant moins solides que leur clôture : ceux des parties en cours sont ramenés à leur nouveau maximum
  const ir0 = G.initRuntime; G.initRuntime = function () { const r = ir0.apply(this, arguments); try { CG.S.buildings.forEach(b => { const m = G.buildMaxHp(b); if (m && b.hp > m) b.hp = m; }); } catch (e) { /* rien */ } return r; };
})(window.CG);
