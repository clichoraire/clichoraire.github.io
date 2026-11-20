// Clan Gobelin — quand quelqu'un évolue (le chef, un gobelin, un animal), on montre ce que ça change : vie, mana, attaque,
// en tuiles nettes : une icône, l'ancien chiffre, une flèche, le nouveau.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Es = CG.EvoStats = {};
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const STAT = { hp: ['❤️', 'Vie', 'hp'], mp: ['💧', 'Mana', 'mp'], atk: ['⚔️', 'Attaque', 'atk'] };
  const rond = v => Math.round(v * 10) / 10;
  Es.tuiles = function (avant, apres) {
    return Object.keys(STAT).filter(k => avant[k] !== undefined && apres[k] !== undefined).map((k, i) => { const a = rond(avant[k]), b = rond(apres[k]), d = rond(b - a), S = STAT[k];
      return '<div class="st-tuile st-' + S[2] + (d > 0 ? ' up' : d < 0 ? ' down' : '') + '" style="--i:' + i + '"><span class="st-ic">' + S[0] + '</span><div class="st-c"><small>' + S[1] + '</small><div class="st-v"><s>' + a + '</s><svg viewBox="0 0 28 14" class="st-fl"><path d="M1 7 H21 M15 1.5 L22 7 L15 12.5" /></svg><b>' + b + '</b></div></div>' + (d ? '<em>' + (d > 0 ? '+' : '') + d + '</em>' : '') + '</div>'; }).join('');
  };
  const chefStats = () => { const p = CG.S.player; return { hp: p.maxhp, mp: p.maxmp, atk: G.playerDmg() }; };
  const gobStats = g => g.pet ? { hp: CG.P.maxHp(g), atk: CG.P.dmg(g) } : { hp: G.gobMaxHp(g), atk: G.guardDmg(g) };
  const change = (a, b) => Object.keys(a).some(k => rond(a[k]) !== rond(b[k]));

  // ---------- la nuit : on note les chiffres avant, on compare après ----------
  const an0 = G.applyNames; G.applyNames = function () {
    const S = CG.S, R = CG.R, chef0 = chefStats(), evo0 = S.chefEvo || 0;
    const suivis = S.goblins.concat(S.pets).filter(o => o.naming || o.classing).map(o => ({ o, nom0: o.name, av: gobStats(o), cls0: o.cls, nomme0: !!o.nomme }));
    const r = an0.apply(this, arguments);
    if ((S.chefEvo || 0) > evo0) R.evoStats = { avant: chef0, apres: chefStats() };
    suivis.forEach(k => { const ap = gobStats(k.o); if (!change(k.av, ap) && k.o.cls === k.cls0) return; const o = k.o, f = o.sex === 'f', C = !o.pet && o.cls && CG.Evo && CG.Evo.CLASSES[o.cls];
      Es.file.push({ icon: C ? C.icon : o.pet ? '🐾' : '🏷️', titre: o.name, sous: C && o.cls !== k.cls0 ? 'est maintenant ' + (f ? 'une ' + (C.nomF || C.nom) : 'un ' + C.nom) : o.pet ? 'a reçu son nom' : (f ? 'devient Hobgobeline' : 'devient Hobgobelin') + (k.nom0 !== o.name ? ' (c\'était ' + k.nom0 + ')' : ''), avant: k.av, apres: ap }); });
    return r;
  };
  // ---------- en plein jour : un animal ou un allié qui se transforme ----------
  let tic = 0; const up0 = G.update; G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S; if (!S) return; tic -= dt; if (tic > 0) return; tic = 0.4;
    for (const p of S.pets) { const e = p.evo || 0; if (p._evo === undefined) { p._evo = e; continue; } if (e === p._evo) continue;
      const neu = p.evo; p.evo = p._evo; const av = gobStats(p); p.evo = neu; p._evo = e; const K = CG.P.KINDS[p.kind] || {};
      if (e) Es.file.push({ icon: K.icon || '🐾', titre: p.name, sous: 'se transforme' + (K.evo ? ' : ' + K.evo : ''), avant: av, apres: gobStats(p) }); }
    Es.suite(dt);
  };
  // ---------- les cartes : une à la fois, en bas de l'écran ----------
  Es.file = []; let carte = null, reste = 0, boite = null;
  Es.suite = function () {
    const R = CG.R; if (!boite) { boite = document.createElement('div'); boite.id = 'evo-cartes'; document.body.appendChild(boite); }
    if (carte) { reste -= 0.4; if (reste > 0) return; const c = carte; carte = null; c.classList.add('out'); setTimeout(() => c.remove(), 450); return; }
    if (!Es.file.length || R.night || UI.modal || (R.fade > 0.2)) return;
    const k = Es.file.shift(); carte = document.createElement('div'); carte.className = 'evo-carte';
    carte.innerHTML = '<div class="ec-tete"><span class="ec-ic">' + k.icon + '</span><div><b>' + esc(k.titre) + '</b><small>' + esc(k.sous) + '</small></div><i>✨ évolution</i></div><div class="st-rang">' + Es.tuiles(k.avant, k.apres) + '</div>';
    carte.onclick = () => { reste = 0; }; boite.appendChild(carte); reste = 7; CG.sfx('level');
  };
  // ---------- la scène du chef : les tuiles apparaissent avec le bouton Continuer ----------
  const Acc = CG.Accueil;
  if (Acc && Acc.evolve) { const ev0 = Acc.evolve; Acc.evolve = function () {
    const r = ev0.apply(this, arguments), R = CG.R, st = R && R.evoStats; if (R) R.evoStats = null; const b = document.querySelector('#evo-go'); if (!st || !b) return r;
    const d = document.createElement('div'); d.className = 'st-rang st-chef'; d.innerHTML = Es.tuiles(st.avant, st.apres); b.parentNode.insertBefore(d, b);
    const iv = setInterval(() => { if (!document.body.contains(d)) return clearInterval(iv); if (b.style.display !== 'none') { d.classList.add('on'); clearInterval(iv); } }, 120); return r;
  }; }
  const css = document.createElement('style');
  css.textContent = '.st-rang{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}'
    + '.st-tuile{position:relative;display:flex;align-items:center;gap:11px;padding:10px 16px 10px 10px;border-radius:16px;color:#fff;background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.22);box-shadow:0 8px 22px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.2);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-family:"Trebuchet MS",system-ui,sans-serif;animation:st-in .5s cubic-bezier(.2,1.4,.4,1) calc(var(--i)*.14s) both}'
    + '.st-ic{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;font-size:24px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.3),0 4px 10px rgba(0,0,0,.35)}.st-hp .st-ic{background:linear-gradient(145deg,#ff7a7a,#b0202c)}.st-mp .st-ic{background:linear-gradient(145deg,#7ab8ff,#2444b8)}.st-atk .st-ic{background:linear-gradient(145deg,#ffcf6a,#c2581a)}'
    + '.st-c small{display:block;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;opacity:.7;text-align:left}.st-v{display:flex;align-items:center;gap:8px;font-variant-numeric:tabular-nums}.st-v s{text-decoration:none;font-size:17px;opacity:.6}.st-v b{font-size:25px;line-height:1;color:#fff}.st-tuile.up .st-v b{color:#b8ff8a;text-shadow:0 0 14px rgba(150,255,110,.55)}.st-tuile.down .st-v b{color:#ff9a8a}'
    + '.st-fl{width:28px;height:14px;fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;opacity:.9;animation:st-fl 1.1s ease-in-out infinite}.st-tuile.up .st-fl{stroke:#b8ff8a}@keyframes st-fl{0%,100%{transform:translateX(-2px)}50%{transform:translateX(3px)}}'
    + '.st-tuile em{position:absolute;top:-9px;right:-7px;padding:2px 8px;border-radius:20px;font:700 12px/16px "Trebuchet MS",system-ui,sans-serif;font-style:normal;color:#10300a;background:linear-gradient(#d8ff9a,#8ae05a);box-shadow:0 3px 8px rgba(0,0,0,.4)}.st-tuile.down em{color:#3a0a06;background:linear-gradient(#ffc0b0,#f07a66)}'
    + '@keyframes st-in{from{opacity:0;transform:translateY(16px) scale(.85)}to{opacity:1;transform:none}}'
    + '.st-chef{margin:14px 0 18px;visibility:hidden}.st-chef.on{visibility:visible}.st-chef:not(.on) .st-tuile{animation:none}'
    + '#evo-cartes{position:fixed;left:50%;bottom:118px;transform:translateX(-50%);z-index:40;pointer-events:none}'
    + '.evo-carte{pointer-events:auto;cursor:pointer;padding:14px 18px 16px;border-radius:20px;color:#fff;background:linear-gradient(170deg,rgba(40,30,60,.9),rgba(16,14,24,.92));border:1px solid rgba(255,255,255,.2);box-shadow:0 16px 40px rgba(0,0,0,.6),0 0 40px rgba(180,130,255,.25);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-family:"Trebuchet MS",system-ui,sans-serif;animation:ec-in .45s cubic-bezier(.2,1.3,.4,1);transition:opacity .4s,transform .4s}.evo-carte.out{opacity:0;transform:translateY(20px)}'
    + '.ec-tete{display:flex;align-items:center;gap:12px;margin-bottom:13px}.ec-ic{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:23px;background:radial-gradient(circle at 35% 30%,#fff3c4,#c79aff 60%,#6a3ab8);box-shadow:0 0 16px rgba(190,140,255,.6)}.ec-tete b{display:block;font-size:18px}.ec-tete small{font-size:13px;opacity:.8}.ec-tete i{margin-left:auto;padding:3px 10px;border-radius:20px;font-style:normal;font-size:11.5px;letter-spacing:.6px;color:#f0dcff;background:rgba(190,140,255,.2);border:1px solid rgba(210,170,255,.4)}'
    + '@keyframes ec-in{from{opacity:0;transform:translateY(30px) scale(.92)}to{opacity:1;transform:none}}';
  document.head.appendChild(css);
})(window.CG);
