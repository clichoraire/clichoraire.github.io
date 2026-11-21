// Goblin Malin — la fiche : quand on parle à un gobelin ou à un compagnon (animal, monstre allié), un bouton « Voir sa fiche »
// montre son niveau, son expérience, sa vie, sa force et ce qu'il porte.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, P = CG.P, Fi = CG.Fiche = {};
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])), n1 = v => String(Math.round(v * 10) / 10).replace('.', ',');
  const barre = (ic, nom, v, max, col) => '<div class="fi-l"><span>' + ic + ' ' + nom + '</span><div class="fi-b"><i style="width:' + Math.max(0, Math.min(100, 100 * v / (max || 1))) + '%;background:' + col + '"></i><u>' + Math.floor(v + 1e-6) + ' / ' + max + '</u></div></div>';
  const ligne = (ic, nom, val) => '<div class="fi-l"><span>' + ic + ' ' + nom + '</span><b>' + esc(val) + '</b></div>';
  const cadre = h => '<div class="fi" style="margin:8px 0;display:grid;gap:5px;font-size:14px">' + h + '</div>';
  if (!document.getElementById('fi-css')) { const st = document.createElement('style'); st.id = 'fi-css'; st.textContent = '.fi-l{display:flex;align-items:center;gap:10px}.fi-l>span{flex:0 0 150px;color:#e8c88a}.fi-l>b{color:#fff;font-weight:600}.fi-b{flex:1;position:relative;height:16px;background:rgba(0,0,0,.4);border-radius:8px;overflow:hidden}.fi-b i{position:absolute;left:0;top:0;bottom:0}.fi-b u{position:absolute;inset:0;text-align:center;font-size:11px;line-height:16px;color:#fff;text-decoration:none;text-shadow:0 1px 2px #000}'; document.head.appendChild(st); }
  Fi.gobelin = function (g) {
    const job = CG.JOBS[g.job], mh = G.gobMaxHp(g), cap = (g.job === 'garde' ? 36 : 12) * g.lvl, Bq = CG.Banque, combat = g.job === 'garde' || (g.equip && (g.equip.epee || g.equip.arc));
    const eq = Object.keys(g.equip || {}).filter(k => g.equip[k] && CG.CRAFTS[k]).map(k => CG.CRAFTS[k].icon + ' ' + (Bq ? Bq.NOMS[k][Math.min(Bq.MAX, +g.equip[k] || 1)] : CG.CRAFTS[k].nom)).join(', ');
    let h = ligne(job.icon, 'Métier', g.sex === 'f' ? job.nomF : job.nom) + ligne('⭐', 'Niveau', g.lvl) + barre('✨', 'Expérience', g.xp || 0, cap, '#5aa8ff') + barre('❤️', 'Vie', Math.max(0, Math.ceil(g.hp)), mh, '#e8503a');
    h += ligne('⚔️', 'Dégâts', combat ? n1(G.guardDmg(g)) + ' par coup' : 'Ne se bat pas (sans arme)') + ligne('🎒', 'Équipement', eq || 'Rien');
    if (G.persoNom) h += ligne('🎭', 'Caractère', G.persoNom(g));
    if (G.seeApt && G.seeApt() && g.apt) { const bon = [], mal = []; Object.keys(g.apt).forEach(j => { if (!CG.JOBS[j]) return; if (g.apt[j] > 1) bon.push(CG.JOBS[j].icon + ' ' + CG.JOBS[j].nom); else if (g.apt[j] < 1) mal.push(CG.JOBS[j].icon + ' ' + CG.JOBS[j].nom); }); h += ligne('👍', 'Doué pour', bon.join(', ') || '—') + ligne('👎', 'Moins bon pour', mal.join(', ') || '—'); }
    else h += ligne('👍', 'Talents', 'Cachés (souviens-toi de ce qu\'on t\'a dit, ou lance l\'Œil de vérité)');
    if (g.ami) h += ligne('💛', 'Amitié', Math.round(g.ami));
    UI.dialog({ goblin: g, fiche: true, who: g.name, tag: '📊 sa fiche' + (g.nomme ? ' · 🏷️ nommé' + (g.sex === 'f' ? 'e' : '') : '') + (g.child ? ' · ton enfant' : ''), text: g.venin ? 'Empoisonné en ce moment.' : g.ko === true ? 'Assommé : il se repose.' : 'Voilà où ' + (g.sex === 'f' ? 'elle' : 'il') + ' en est.', extra: cadre(h), options: [{ label: '↩ Retour', fn: () => UI.talkGoblin(g) }] });
  };
  Fi.compagnon = function (p) {
    const k = P.KINDS[p.kind], mh = P.maxHp(p), need = P.need(p), R = CG.R;
    let h = ligne(k.icon || '🐾', 'Espèce', P.title(p) + (p.bebe ? ' (petit)' : '')) + ligne('⭐', 'Niveau', p.lvl + (p.lvl >= P.NIV_MAX ? ' (maximum)' : '')) + barre('✨', 'Expérience', p.lvl >= P.NIV_MAX ? need : p.xp || 0, need, '#5aa8ff') + barre('❤️', 'Vie', Math.max(0, Math.ceil(p.hp)), mh, '#e8503a');
    h += ligne('⚔️', 'Dégâts', n1(P.dmg(p)) + ' par coup') + ligne('🍖', 'Appétit', P.eats(p) + ' par jour');
    h += ligne('📍', 'En ce moment', p.ko ? 'Mort' : R.mount === p ? 'Tu le montes' : p.follow && G.tech('b24') ? 'Te suit partout' : 'Garde le village');
    if (p.buffT > 0 && P.BUFFS[p.buff]) h += ligne(P.BUFFS[p.buff].icon, 'Bonus', P.BUFFS[p.buff].nom + ' (encore ' + Math.ceil(p.buffT) + ' s)');
    if (p.evo) h += ligne('🌟', 'Évolution', k.evo); if (p.evo && k.special) h += ligne('💥', 'Attaque spéciale', k.special);
    UI.dialog({ visitor: { role: 'animal', look: 'animal', kind: p.kind, evo: p.evo }, fiche: true, who: p.name, tag: '📊 sa fiche' + (p.nomme ? ' · 🏷️ nommé' : ''), text: 'Voilà où il en est.', extra: cadre(h), options: [{ label: '↩ Retour', fn: () => P.talkPet(p) }] });
  };
  // le bouton, ajouté à la fenêtre de discussion d'un gobelin du clan ou d'un compagnon
  const dg0 = UI.dialog; UI.dialog = function (o) {
    try { const S = CG.S;
      if (o && !o.fiche && o.options && S) {
        let fn = null;
        if (o.goblin && S.goblins.includes(o.goblin) && o.goblin.met && o.options.some(q => /Modifier le travail/.test(q.label))) { const g = o.goblin; fn = CG.Inventaire ? null : () => Fi.gobelin(g); } // sa fiche est maintenant dans la fenêtre de son inventaire (inventaire.js)
        else if (o.visitor && o.visitor.role === 'animal' && o.options.some(q => /caresser/i.test(q.label))) { const p = S.pets.find(a => a.name === o.who && a.kind === o.visitor.kind); if (p) fn = () => Fi.compagnon(p); }
        if (fn) { const l = o.options.slice(), fin = l.length && !l[l.length - 1].fn ? l.pop() : null; l.push({ label: '📊 Voir sa fiche', sub: 'Niveau, expérience, vie, dégâts, équipement', fn }); if (fin) l.push(fin); o = Object.assign({}, o, { options: l }); }
      }
    } catch (e) { /* la fiche ne doit jamais empêcher de parler */ }
    return dg0.call(this, o);
  };
})(window.CG);
