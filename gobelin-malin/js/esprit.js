// Clan Gobelin — l'esprit de la forêt : une fenêtre enchantée, trois cadeaux au choix, sans explication. On découvre ce qu'on a choisi.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Al = CG.Allies, pick = CG.pick; if (!Al) return;
  const trois = v => { const ids = Object.keys(Al.BLESS); v.offers = (v.offers || []).filter((x, i, a) => Al.BLESS[x] && a.indexOf(x) === i); while (v.offers.length < 3) { const r = ids.filter(i => !v.offers.includes(i)); if (!r.length) break; v.offers.push(pick(r)); } return v.offers.slice(0, 3); };
  const st0 = Al.startSpirit; Al.startSpirit = function () { const v = st0.apply(this, arguments); if (v) trois(v); return v; };
  const PAROLES = ['« Petit chef... la forêt te regarde, et elle sourit. »', '« Tu marches doucement sur mes racines. Prends. »', '« Trois graines dans ma main. Une seule pour toi. »', '« Le vent m\'a parlé de ton clan. Choisis. »'];
  Al.talkSpirit = function (v) {
    const S = CG.S, R = CG.R, $ = id => document.getElementById(id), offres = trois(v);
    const gone = () => { if (!R.visitors.includes(v)) return; R.visitors.splice(R.visitors.indexOf(v), 1); G.puff(v.x, v.y - 30, '#c8ffd8', 30, 160, 4); R.rings.push({ x: v.x, y: v.y - 10, r: 80, life: 0.5, col: '#aef5c8' }); };
    let lucioles = ''; for (let i = 0; i < 16; i++) lucioles += '<i style="left:' + (4 + (i * 53) % 92) + '%;top:' + (8 + (i * 37) % 80) + '%;--d:' + (i % 8) * 0.45 + 's;--s:' + (3 + i % 4) + 'px"></i>';
    let feuilles = ''; for (let i = 0; i < 8; i++) feuilles += '<path d="M0 -62 C14 -50 14 -34 0 -24 C-14 -34 -14 -50 0 -62 Z" transform="rotate(' + i * 45 + ')"/>';
    CG.sfx('heal'); UI.modal = { name: 'esprit', closable: true, pauses: false }; CG.keys.clear(); R.talking = v;
    $('dialog').hidden = true; $('modal').className = 'soft flou'; $('panel').className = 'esprit';
    $('panel').innerHTML = '<div class="es-lucioles">' + lucioles + '</div><div class="es-titre">Esprit de la forêt</div>'
      + '<div class="es-scene"><svg class="es-couronne" viewBox="-80 -80 160 160">' + feuilles + '<circle r="70" class="c"/></svg><div class="es-orbe"><span>🍃</span></div></div>'
      + '<p class="es-parole">' + pick(PAROLES) + '</p>'
      + '<div class="es-dons">' + offres.map((id, i) => { const B = Al.BLESS[id]; return '<button class="es-don" data-id="' + id + '" style="--i:' + i + '"><span class="ic">' + B.icon + '</span><span class="nm">' + B.nom + '</span></button>'; }).join('') + '</div>'
      + '<button class="es-non" id="es-non">🙏 Merci, je n\'ai besoin de rien</button>';
    $('modal').hidden = false;
    $('panel').querySelectorAll('.es-don').forEach(b => { b.onclick = () => {
      const id = b.dataset.id, B = Al.BLESS[id]; UI.close(); if (!R.visitors.includes(v)) return; if (B.now) B.now(); if (B.day) S.bless = { id, day: S.day };
      const p = S.player; G.puff(p.x, p.y - 24, '#aef5c8', 26, 150, 4); R.rings.push({ x: p.x, y: p.y - 10, r: 110, life: 0.6, col: '#aef5c8' }); CG.sfx('heal'); S.morale = Math.min(100, S.morale + 3);
      G.banner(B.icon + ' ' + B.nom, B.desc, '#c8ffd8'); gone(); // on découvre le cadeau une fois choisi
    }; });
    $('es-non').onclick = () => { UI.close(); gone(); };
  };
  const css = document.createElement('style');
  css.textContent = '#panel.esprit{position:relative;width:min(580px,94vw);max-height:none;overflow:hidden;padding:26px 28px 20px;text-align:center;color:#eafff0;border-radius:26px;border:3px solid #8fe0a8;background:radial-gradient(120% 90% at 50% 0%,#2f6a48 0%,#173a2a 45%,#0b1f18 100%);box-shadow:0 0 60px rgba(120,255,170,.35),0 18px 50px rgba(0,0,0,.7),inset 0 0 60px rgba(120,255,170,.12)}'
    + '.es-lucioles{position:absolute;inset:0;pointer-events:none}.es-lucioles i{position:absolute;width:var(--s);height:var(--s);border-radius:50%;background:#e8ffb0;box-shadow:0 0 8px 2px rgba(220,255,140,.8);opacity:0;animation:es-luc 3.6s ease-in-out var(--d) infinite}@keyframes es-luc{0%,100%{opacity:0;transform:translate(0,0)}40%{opacity:1}60%{opacity:.8;transform:translate(10px,-16px)}}'
    + '.es-titre{position:relative;font:700 31px Luminari,"Apple Chancery",Georgia,fantasy;letter-spacing:1px;color:#e2ffd8;text-shadow:0 0 18px #6fe090,0 3px 0 #0a2014}'
    + '.es-scene{position:relative;height:170px;margin:6px 0 0;display:grid;place-items:center}.es-couronne{position:absolute;width:170px;height:170px;animation:es-tour 26s linear infinite}.es-couronne path{fill:rgba(140,230,150,.55);stroke:#c8ffc0;stroke-width:1}.es-couronne .c{fill:none;stroke:rgba(200,255,200,.35);stroke-width:1.2;stroke-dasharray:3 7}@keyframes es-tour{to{transform:rotate(360deg)}}'
    + '.es-orbe{position:relative;width:84px;height:84px;border-radius:50%;display:grid;place-items:center;font-size:38px;background:radial-gradient(circle at 35% 30%,#f4fff0,#9af0b0 45%,#3aa868 100%);box-shadow:0 0 34px 10px rgba(140,255,180,.55),inset 0 -8px 16px rgba(20,90,50,.5);animation:es-flotte 3.2s ease-in-out infinite}@keyframes es-flotte{0%,100%{transform:translateY(-4px)}50%{transform:translateY(5px)}}'
    + '.es-parole{position:relative;margin:4px 0 16px;font:italic 16.5px Georgia,serif;color:#cfeedd}'
    + '.es-dons{position:relative;display:flex;gap:14px;justify-content:center}#panel.esprit .es-don{flex:1;max-width:160px;display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px 13px;cursor:pointer;color:#f0fff2;border-radius:18px;border:2px solid rgba(170,240,180,.6);background:linear-gradient(170deg,rgba(90,170,110,.5),rgba(20,60,40,.75));box-shadow:0 5px 0 #0c2a1c,0 8px 18px rgba(0,0,0,.45);transition:transform .15s,box-shadow .15s,border-color .15s;animation:es-pop .5s cubic-bezier(.2,1.5,.4,1) calc(var(--i)*.12s) both}'
    + '#panel.esprit .es-don:hover{transform:translateY(-5px) scale(1.04);border-color:#eaffc0;box-shadow:0 10px 0 #0c2a1c,0 0 26px rgba(170,255,170,.55)}#panel.esprit .es-don:active{transform:translateY(3px);box-shadow:0 1px 0 #0c2a1c}'
    + '.es-don .ic{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;font-size:32px;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.35),rgba(60,140,90,.4));border:2px solid rgba(220,255,200,.55);box-shadow:inset 0 0 14px rgba(200,255,200,.3)}.es-don .nm{font:700 15.5px "Trebuchet MS",system-ui,sans-serif;line-height:1.2}@keyframes es-pop{from{opacity:0;transform:translateY(18px) scale(.8)}to{opacity:1;transform:none}}'
    + '#panel.esprit .es-non{position:relative;width:auto;margin-top:16px;padding:7px 16px;font-size:13.5px;color:#bfe0cc;background:none;border:1px solid rgba(170,230,190,.3);border-radius:20px;cursor:pointer}#panel.esprit .es-non:hover{color:#fff;border-color:rgba(200,255,210,.7)}';
  document.head.appendChild(css);
})(window.CG);
