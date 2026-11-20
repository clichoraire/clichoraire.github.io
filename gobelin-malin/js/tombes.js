// Goblin Malin — le cimetière des chefs : chaque partie perdue laisse une pierre tombale, gardée par le navigateur
// (nom, niveau, jour, ce qu'il a accompli). On le visite depuis l'écran-titre, ou depuis l'écran de fin.
'use strict';
(function (CG) {
  const UI = CG.UI, To = CG.Tombes = { CLE: 'goblin-malin-tombes', MAX: 200 };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  To.liste = function () { try { const l = JSON.parse(localStorage.getItem(To.CLE)); return Array.isArray(l) ? l : []; } catch (e) { return []; } };
  To.graver = function (chef) {
    const S = CG.S; if (!S || S._tombe) return; S._tombe = true;
    const D = CG.Diff && CG.Diff.LIST ? (CG.Diff.LIST[S.diff] || CG.Diff.LIST.difficile) : null;
    const t = { nom: S.name, niv: S.player.lvl, jour: S.day, tues: (S.stats && S.stats.kills) || 0, clan: S.goblins.length, forme: S.chefEvo || 0, diff: D ? D.nom : '', monde: S.monde || 0, demon: !!(S.demon && S.demon.mort), chef: chef !== false, quand: Date.now() };
    try { const l = To.liste(); l.push(t); localStorage.setItem(To.CLE, JSON.stringify(l.slice(-To.MAX))); } catch (e) { /* stockage indisponible : tant pis pour la pierre */ }
  };
  const go0 = UI.gameOver; UI.gameOver = function (chef) {
    const deja = !!document.getElementById('mort'); To.graver(chef); const r = go0.apply(this, arguments);
    const el = document.getElementById('mort'), b0 = el && el.querySelector('#mo-new');
    if (!deja && el && b0) setTimeout(() => To.scene(el), To.ATTENTE); // plus de bouton : la pierre va d'elle-même rejoindre les autres
    return r;
  };
  // la scène de fin : la pierre rapetisse, le cimetière du camp apparaît derrière avec les pierres des anciens chefs, et la nouvelle va prendre la place suivante
  To.ATTENTE = 3600; To.VOISINES = 7;
  const mini = t => '<div class="mo-mini"><svg viewBox="0 0 140 160" preserveAspectRatio="none"><ellipse cx="70" cy="152" rx="62" ry="7" fill="rgba(0,0,0,.5)"/><path d="M10 150 V58 Q10 8 70 8 Q130 8 130 58 V150Z" fill="#5d686e"/><path d="M10 150 V58 Q10 8 70 8 Q80 8 88 11 Q42 20 38 66 V150Z" fill="#78838a"/><path d="M10 130 q8 -14 18 -2 q-4 14 -18 18z" fill="#3f7026"/></svg><b>' + esc(t.chef === false ? 'Clan de ' + t.nom : t.nom) + '</b><span>niv. ' + t.niv + ' · jour ' + t.jour + '</span></div>';
  To.scene = function (el) {
    if (!el || !el.isConnected || el.querySelector('.mo-cim')) return; const avant = To.liste().slice(0, -1).slice(-To.VOISINES), cim = document.createElement('div'); cim.className = 'mo-cim';
    let ar = ''; [[4, 1.5], [15, 1.1], [80, 1.3], [93, 1.7]].forEach(q => { ar += '<g transform="translate(' + q[0] * 10 + ' 470) scale(' + q[1] + ')"><rect x="-5" y="-40" width="10" height="42" fill="#0c1410"/><path d="M0 -150 L-36 -76 H-18 L-46 -30 H46 L18 -76 H36Z" fill="#0f1c14"/></g>'; });
    let hut = ''; [[26, 1], [38, 0.8], [63, 0.9], [72, 1.1]].forEach((q, i) => { hut += '<g transform="translate(' + q[0] * 10 + ' 452) scale(' + q[1] + ')"><path d="M-44 0 V-34 H44 V0Z" fill="#161f18"/><path d="M-54 -32 L0 -84 L54 -32Z" fill="#1c281e"/><rect x="-9" y="-24" width="18" height="24" fill="#0a100c"/>' + (i % 2 ? '' : '<rect x="18" y="-24" width="11" height="10" fill="#ffb84a" opacity=".75"/>') + '</g>'; });
    let cl = ''; for (let i = 0; i < 26; i++) cl += '<path d="M' + (i * 40 + 4) + ' 516 v-34 l6 -8 l6 8 v34z" fill="#1a241c"/>';
    cim.innerHTML = '<svg class="mo-decor" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMax slice"><defs><radialGradient id="mo-feu" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb04a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient></defs>'
      + '<circle cx="800" cy="120" r="52" fill="#f4eecb"/><circle cx="800" cy="120" r="110" fill="#f4eecb" opacity=".08"/><circle cx="782" cy="106" r="9" fill="#d8d2ac"/><circle cx="816" cy="136" r="6" fill="#d8d2ac"/>'
      + ar + hut + '<ellipse cx="500" cy="446" rx="120" ry="46" fill="url(#mo-feu)"/><path d="M492 452 q8 -26 4 -34 q14 12 10 34z" fill="#ffb04a"/><path d="M0 470 Q250 432 500 458 Q760 482 1000 446 V620 H0Z" fill="#132016"/>'
      + cl + '<rect x="0" y="494" width="1000" height="5" fill="#1a241c"/><path d="M0 520 Q300 500 520 514 Q780 530 1000 506 V620 H0Z" fill="#0d170f"/></svg>'
      + '<div class="mo-rang">' + avant.map(mini).join('') + '<div class="mo-mini mo-place"></div></div>';
    el.insertBefore(cim, el.querySelector('.mo-in')); const tb = el.querySelector('.mo-tombe'); if (!tb) return;
    tb.style.transition = 'transform .7s ease'; tb.style.transform = 'scale(.8)'; tb.style.position = 'relative'; tb.style.zIndex = 3;
    setTimeout(() => { if (!el.isConnected) return; el.classList.add('cim'); }, 500);
    setTimeout(() => { if (!el.isConnected) return; tb.style.transition = 'none'; tb.style.transform = 'none'; const a = tb.getBoundingClientRect(), b = cim.querySelector('.mo-place').getBoundingClientRect(), k = b.height / a.height;
      tb.style.transform = 'scale(.8)'; void tb.offsetWidth; tb.style.transition = 'transform 1.7s cubic-bezier(.55,0,.2,1)';
      tb.style.transform = 'translate(' + (b.left + b.width / 2 - a.left - a.width / 2) + 'px,' + (b.top + b.height / 2 - a.top - a.height / 2 - b.height * 0.04) + 'px) scale(' + k + ')'; CG.sfx && CG.sfx('tombe'); }, 1700);
  };
  const FORMES = ['Chef gobelin', 'Chef hobgobelin', 'Goblin Lord'];
  const date = q => { try { return new Date(q).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } };
  function pierre(t, i) {
    const v = (t.quand || i) % 3, h = ((t.quand || i * 7) % 5 - 2) * 0.9, long = (t.nom || '').length > 9;
    const forme = ['M10 150 V58 Q10 8 70 8 Q130 8 130 58 V150Z', 'M10 150 V30 Q10 12 28 12 H112 Q130 12 130 30 V150Z', 'M10 150 V52 L40 12 H100 L130 52 V150Z'][v];
    return '<div class="ci-pierre" style="--i:' + Math.min(i, 24) + ';--r:' + h + 'deg" title="' + esc(date(t.quand)) + '"><svg viewBox="0 0 140 160" preserveAspectRatio="none"><ellipse cx="70" cy="152" rx="66" ry="8" fill="rgba(0,0,0,.45)"/><path d="' + forme + '" fill="#69747a"/><path d="' + forme + '" fill="#8a959b" transform="translate(4 4) scale(.5 .94)" opacity=".5"/><path d="M104 40 l-7 16 9 10 -6 16" stroke="#48525a" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="' + (v === 1 ? 0 : 0.8) + '"/><path d="M10 128 q8 -16 20 -2 q-4 16 -20 20z" fill="#4b8030"/><path d="M130 136 q-10 -12 -18 2 q6 12 18 12z" fill="#3d6e26"/></svg>'
      + '<div class="ci-txt"><small>Ci-gît</small><b' + (long ? ' class="long"' : '') + '>' + esc(t.chef === false ? 'le clan de ' + t.nom : t.nom) + '</b><em>' + FORMES[Math.min(2, t.forme || 0)] + '</em><span class="niv">Niveau ' + t.niv + '</span><span>tombé au jour ' + t.jour + (t.monde ? ', dans le marais' : '') + '</span></div>'
      + '<div class="ci-bas"><span>⚔️ ' + t.tues + '</span><span>👥 ' + t.clan + '</span>' + (t.demon ? '<span title="A vaincu le Demon Lord">😈</span>' : '') + (t.diff ? '<span class="d">' + esc(t.diff) + '</span>' : '') + '</div><div class="ci-date">' + esc(date(t.quand)) + '</div></div>';
  }
  To.ouvrir = function () {
    if (document.getElementById('cimetiere')) return; const l = To.liste().slice().reverse(), el = document.createElement('div'); el.id = 'cimetiere';
    const max = (k) => l.reduce((m, t) => Math.max(m, t[k] || 0), 0);
    let lucioles = ''; for (let i = 0; i < 16; i++) lucioles += '<i style="left:' + (i * 61 % 100) + '%;top:' + (20 + i * 37 % 70) + '%;animation-delay:-' + (i * 0.9 % 8) + 's;animation-duration:' + (7 + i % 5) + 's"></i>';
    el.innerHTML = '<div class="ci-lune"></div><div class="ci-luc">' + lucioles + '</div><div class="ci-in"><h1>Le cimetière des chefs</h1>'
      + (l.length ? '<p class="ci-sous">' + l.length + (l.length > 1 ? ' chefs reposent ici' : ' chef repose ici') + ' · le plus loin : jour ' + max('jour') + ' · le plus fort : niveau ' + max('niv') + '</p><div class="ci-rang">' + l.map(pierre).join('') + '</div>'
        : '<p class="ci-sous">Personne ne repose ici. Pas encore.</p><div class="ci-vide">🌱</div>')
      + '</div><button id="ci-fermer">← Retour</button>';
    document.body.appendChild(el); CG.sfx && CG.sfx('glas');
    const fermer = () => { el.remove(); window.removeEventListener('keydown', touche, true); };
    const touche = e => { if (e.key === 'Escape' || e.key === 'Enter') { e.stopPropagation(); e.preventDefault(); fermer(); } };
    el.querySelector('#ci-fermer').onclick = fermer; window.addEventListener('keydown', touche, true); el.querySelector('#ci-fermer').focus();
  };
  const css = document.createElement('style');
  css.textContent = '#cimetiere{position:fixed;inset:0;z-index:200;overflow:auto;color:#dfe6e0;font-family:"Trebuchet MS",system-ui,sans-serif;background:radial-gradient(ellipse at 78% 8%,#2c4660 0%,#162534 38%,#0a1216 100%);animation:ci-in .6s ease-out}@keyframes ci-in{from{opacity:0}to{opacity:1}}'
    + '.ci-lune{position:fixed;right:9%;top:6%;width:110px;height:110px;border-radius:50%;background:radial-gradient(circle at 38% 36%,#fffbe6,#e6dfb4 60%,#b9b386);box-shadow:0 0 70px 20px rgba(255,246,190,.25);pointer-events:none}'
    + '.ci-luc{position:fixed;inset:0;pointer-events:none}.ci-luc i{position:absolute;width:5px;height:5px;border-radius:50%;background:#d8ff8a;box-shadow:0 0 10px 3px rgba(200,255,120,.6);animation:ci-luc 9s ease-in-out infinite}@keyframes ci-luc{0%,100%{transform:translate(0,0);opacity:.1}30%{opacity:.9}50%{transform:translate(40px,-34px);opacity:.5}75%{transform:translate(-20px,-56px);opacity:.9}}'
    + '.ci-in{position:relative;max-width:1180px;margin:0 auto;padding:46px 28px 110px;text-align:center}.ci-in h1{margin:0;font:700 44px Georgia,serif;letter-spacing:1px;color:#f3efd8;text-shadow:0 3px 0 #0a1216,0 0 30px rgba(255,246,190,.25)}.ci-sous{margin:10px 0 36px;font-size:16px;opacity:.75}.ci-vide{font-size:70px;margin-top:70px;opacity:.6}'
    + '.ci-rang{display:grid;grid-template-columns:repeat(auto-fill,minmax(176px,1fr));gap:34px 22px;justify-items:center;padding-bottom:30px;background:linear-gradient(to bottom,transparent 0,transparent calc(100% - 60px),rgba(30,60,30,.35) 100%)}'
    + '.ci-pierre{position:relative;width:176px;height:214px;transform:rotate(var(--r));animation:ci-p .6s cubic-bezier(.2,1.2,.4,1) calc(var(--i)*.05s) both;color:#22292e}@keyframes ci-p{from{opacity:0;transform:translateY(40px) rotate(var(--r))}to{opacity:1;transform:rotate(var(--r))}}.ci-pierre svg{position:absolute;inset:0;width:100%;height:100%}'
    + '.ci-txt{position:absolute;left:18px;right:18px;top:34px;display:flex;flex-direction:column;align-items:center;gap:1px}.ci-txt small{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;opacity:.65}.ci-txt b{font:700 24px/1.05 Georgia,serif;color:#1a2025;text-shadow:0 1px 0 rgba(255,255,255,.25);word-break:break-word}.ci-txt b.long{font-size:18px}.ci-txt em{font-size:12px;font-style:italic;opacity:.75;margin-bottom:5px}.ci-txt .niv{font-weight:700;font-size:15px}.ci-txt span{font-size:12.5px}'
    + '.ci-bas{position:absolute;left:30px;right:30px;bottom:46px;display:flex;justify-content:center;flex-wrap:wrap;gap:4px 9px;font-size:12.5px;font-weight:700;color:#2a3238}.ci-bas .d{font-weight:400;font-style:italic;opacity:.8}.ci-date{position:absolute;left:0;right:0;bottom:-6px;font-size:11.5px;color:#b9c6bd;opacity:.75;transform:rotate(calc(var(--r)*-1))}'
    + '#ci-fermer{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);padding:12px 30px;border-radius:14px;border:1px solid rgba(255,255,255,.25);background:rgba(20,34,40,.85);color:#f3efd8;font:700 17px "Trebuchet MS",system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.5)}#ci-fermer:hover,#ci-fermer:focus{background:#2c4650;outline:none}'
    + '.mo-cim{position:absolute;inset:0;opacity:0;transition:opacity 1.6s ease;background:linear-gradient(#0b1420 0,#16283a 46%,#1c2c26 72%,#0a120c 100%);pointer-events:none}#mort.cim .mo-cim{opacity:1}.mo-decor{position:absolute;inset:0;width:100%;height:100%}'
    + '.mo-rang{position:absolute;left:0;right:0;bottom:5vh;display:flex;justify-content:center;align-items:flex-end;gap:14px;padding:0 20px}.mo-mini{position:relative;flex:0 0 96px;width:96px;height:112px;opacity:0;transform:translateY(30px);transition:opacity .8s ease,transform .8s cubic-bezier(.2,1.2,.4,1);color:#1c2328;text-align:center}#mort.cim .mo-mini{opacity:1;transform:none}.mo-mini:nth-child(2n){transition-delay:.15s}.mo-mini:nth-child(3n){transition-delay:.3s}'
    + '.mo-mini svg{position:absolute;inset:0;width:100%;height:100%}.mo-mini b{position:absolute;left:12px;right:12px;top:34px;font:700 13px/1.1 Georgia,serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mo-mini span{position:absolute;left:8px;right:8px;top:56px;font-size:10.5px;line-height:1.2}.mo-place{visibility:hidden}'
    + '#mort.cim .mo-glow,#mort.cim .mo-braises{opacity:.25;transition:opacity 1.5s}#mort .mo-in{transition:transform 1s ease}#mort.cim .mo-in{transform:translateY(-130px)}'
    + '#mo-tombes{display:block;margin:12px auto 0;padding:9px 20px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:rgba(0,0,0,.35);color:#e8e2d0;font:600 15px "Trebuchet MS",system-ui,sans-serif;cursor:pointer}#mo-tombes:hover{background:rgba(255,255,255,.14)}';
  document.head.appendChild(css);
})(window.CG);
