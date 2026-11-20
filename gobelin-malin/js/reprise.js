// Goblin Malin — quitter en pleine attaque : en revenant, les assaillants sont toujours là (ceux déjà arrivés, avec leurs blessures,
// et ceux qui n'étaient pas encore entrés sur la carte). Avant, recharger la partie faisait disparaître toute l'attaque.
'use strict';
(function (CG) {
  const G = CG.G, simple = o => { const r = {}; Object.keys(o || {}).forEach(k => { const v = o[k]; if (v === null || ['string', 'number', 'boolean'].includes(typeof v) || (Array.isArray(v) && v.every(x => typeof x === 'string'))) r[k] = v; }); return r; };
  const pk0 = CG.pack; CG.pack = function () {
    const d = pk0.apply(this, arguments), R = CG.R; d.attaque = null;
    if (R && R.event && R.event.type === 'attack' && !R.event.lord) {
      const es = R.enemies.filter(e => e.event && !e.dead && !e.struct && !e.campId).map(e => ({ type: e.type, x: Math.round(e.x), y: Math.round(e.y), hp: e.hp, maxhp: e.maxhp, dmg: e.dmg, exit: e.exit || null, hunt: !!e.hunt }));
      const q = (R.spawnQ || []).map(s => ({ t: s.t, type: s.type, x: s.x, y: s.y }));
      if (es.length || q.length) d.attaque = { ev: simple(R.event), alarm: !!R.alarm, es, q };
    }
    return d;
  };
  const st0 = CG.start; CG.start = function (isNew) {
    const a = !isNew && CG.peekSave && (CG.peekSave() || {}).attaque; const r = st0.apply(this, arguments);
    try { const S = CG.S, R = CG.R; if (S) S.attaque = null; if (!a || !S || !R || R.event) return r;
      a.es.forEach(o => { if (!CG.ENEMIES[o.type]) return; const e = G.spawnEnemy(o.type, o.x, o.y, { exit: o.exit, hunt: o.hunt, exact: true }); if (!e) return; e.hp = o.hp; e.maxhp = o.maxhp; e.dmg = o.dmg; });
      R.spawnQ = (a.q || []).filter(s => CG.ENEMIES[s.type]); R.event = Object.assign({ type: 'attack', quiet: true }, a.ev); R.alarm = !!a.alarm;
      if (R.alarm) { G.banner('L\'attaque continue !', 'Les assaillants sont toujours là : rien n\'a bougé pendant ton absence.', '#ff9a8a'); CG.sfx('attaque'); }
    } catch (e) { /* une sauvegarde abîmée ne doit pas empêcher de reprendre */ }
    return r;
  };
})(window.CG);
