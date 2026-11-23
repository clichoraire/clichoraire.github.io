// Goblin Malin — la fenêtre du puits magique : une vraie scène (le puits, l'eau noire, la pièce qui tombe), et le jeu s'arrête
// pendant qu'on y est (sans la fenêtre Pause). On choisit sa mise, la pièce tombe, le puits répond ou non, puis « Continuer ».
'use strict';
(function (CG) {
  const UI = CG.UI, Pu = CG.Puits; if (!Pu || !UI.open) return;
  if (!document.getElementById('pz-css')) { const st = document.createElement('style'); st.id = 'pz-css'; st.textContent =
    '#panel.puits{background:radial-gradient(circle at 50% 10%,#27325c,#141a34 55%,#0a0c1a);border:2px solid #6a7ad0;box-shadow:0 0 60px rgba(110,140,255,.4),inset 0 0 50px rgba(0,0,0,.55);text-align:center;max-width:640px;color:#e0e6ff}' +
    '.pz-titre{font:700 30px Luminari,"Apple Chancery",Georgia,fantasy;color:#dfe6ff;text-shadow:0 0 16px #6a8cff,0 3px 0 #0a0e22}.pz-titre span{font-size:17px;color:#9ab0ff}' +
    '.pz-scene{position:relative;height:190px;margin:2px auto 0;width:300px}.pz-scene svg{position:absolute;inset:0;width:100%;height:100%}' +
    '.pz-lueur{animation:pzLueur 2.6s ease-in-out infinite alternate}@keyframes pzLueur{from{opacity:.35}to{opacity:.95}}.puits.eteint .pz-lueur{display:none}' +
    '.pz-piece{position:absolute;left:50%;top:-6px;width:22px;height:22px;margin-left:-11px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3a8,#f2c22a 55%,#a87a10);box-shadow:0 0 12px rgba(255,220,90,.8);opacity:0}' +
    '.pz-piece.tombe{animation:pzTombe 1.35s cubic-bezier(.5,0,.9,.6) forwards}@keyframes pzTombe{0%{opacity:1;transform:translateY(0) rotateX(0)}70%{opacity:1}100%{opacity:0;transform:translateY(132px) rotateX(1080deg) scale(.5)}}' +
    '.pz-onde{position:absolute;left:50%;top:122px;width:20px;height:7px;margin-left:-10px;border:2px solid #cfe0ff;border-radius:50%;opacity:0}.pz-onde.va{animation:pzOnde .9s ease-out 1.25s 2}@keyframes pzOnde{from{opacity:.9;transform:scale(1)}to{opacity:0;transform:scale(5)}}' +
    '.pz-txt{min-height:66px;margin:6px 26px 10px;font-size:15.5px;line-height:1.45}.pz-voix{font:italic 22px "Apple Chancery",Georgia,serif;color:#fff;text-shadow:0 0 14px var(--c,#9ab0ff)}.pz-don{display:inline-block;margin-top:6px;padding:7px 16px;border-radius:14px;background:rgba(10,14,34,.7);border:1px solid var(--c,#9ab0ff);font-weight:700;font-size:17px}.pz-det{display:block;font-size:13.5px;opacity:.9;margin-top:5px}' +
    '.pz-infos{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:0 0 10px}.pz-infos span{padding:4px 12px;font-size:13.5px;background:rgba(10,14,34,.6);border:1px solid rgba(140,160,255,.35);border-radius:14px}' +
    '.pz-mises{display:flex;gap:10px;justify-content:center;margin:0 10px 12px}.pz-m{flex:1;max-width:170px;padding:9px 6px;border-radius:10px;border:2px solid rgba(140,160,255,.35);background:rgba(10,14,34,.55);color:#e0e6ff;cursor:pointer;font:inherit}.pz-m b{display:block;font-size:17px}.pz-m small{display:block;font-size:12px;opacity:.85;margin-top:2px}.pz-m:hover:not(:disabled){border-color:#ffe36b;background:rgba(50,50,24,.6)}.pz-m:disabled{opacity:.4;cursor:not-allowed}' +
    '.pz-btns button{padding:9px 28px;font-size:16px}';
    document.head.appendChild(st); }
  const SCENE = '<div class="pz-scene"><svg viewBox="0 0 300 190"><ellipse cx="150" cy="170" rx="104" ry="14" fill="rgba(0,0,0,.4)"/><rect x="72" y="22" width="11" height="120" fill="#5a3d22"/><rect x="217" y="22" width="11" height="120" fill="#5a3d22"/><path d="M52 34 L150 0 L248 34Z" fill="#6a3a22"/><path d="M52 34 L150 0 L150 34Z" fill="#8a5030"/>'
    + '<path d="M66 124 V162 Q150 190 234 162 V124Z" fill="#77726a"/><path d="M66 140 Q150 166 234 140 M100 132 V158 M150 138 V166 M200 132 V158" stroke="rgba(30,28,24,.45)" stroke-width="2" fill="none"/><ellipse cx="150" cy="124" rx="84" ry="24" fill="#928d84"/><ellipse cx="150" cy="124" rx="66" ry="17" fill="#07060f"/>'
    + '<ellipse class="pz-lueur" cx="150" cy="126" rx="44" ry="10" fill="#6e8cff"/><ellipse class="pz-lueur" cx="150" cy="126" rx="20" ry="4.5" fill="#dfe8ff"/>'
    + '<ellipse cx="88" cy="136" rx="20" ry="8" fill="#5f8f3a"/><ellipse cx="206" cy="152" rx="24" ry="8" fill="#4f7f30"/><ellipse cx="140" cy="166" rx="16" ry="6" fill="#5f8f3a"/></svg><i class="pz-piece"></i><i class="pz-onde"></i></div>';
  // res : null (on arrive), { attente } (la pièce tombe), { silence } ou { voix, quoi, detail, col }
  function panneau(res) {
    const S = CG.S, q = Pu.ici(); if (!q) return; const or = Math.floor(S.res.or), reste = Math.max(0, Pu.LANCERS - q.lancers), fini = q.parle || reste <= 0, attente = res && res.attente;
    let txt;
    if (attente) txt = 'La pièce tourne, brille une dernière fois, et disparaît dans le noir...';
    else if (res && res.voix) txt = '<span class="pz-voix" style="--c:' + res.col + '">' + res.voix + '</span><br><span class="pz-don" style="--c:' + res.col + '">' + res.quoi + '<span class="pz-det">' + res.detail + '</span></span>';
    else if (res && res.silence) txt = res.silence + (reste <= 0 ? '<br>Le puits est plein d\'échos : il ne répondra plus aujourd\'hui.' : '<br>Tu peux retenter ta chance.');
    else txt = q.parle ? 'L\'eau noire ne bouge plus. Ce qui vit là-dessous a déjà parlé aujourd\'hui : il ne dira plus rien avant demain... et demain, le puits sera ailleurs.' : reste <= 0 ? 'Le puits est plein d\'échos. Il ne répondra plus aujourd\'hui.' : 'Un vieux puits couvert de mousse, que personne n\'a creusé. Il n\'était pas là hier. On n\'en voit pas le fond... mais on dirait que quelque chose écoute. Plus on le nourrit, plus il en veut.';
    const mise = k => { const n = Pu.prix(k); return '<button class="pz-m" data-n="' + k + '"' + (or < n || attente ? ' disabled' : '') + '><b>🪙 ' + n + ' pièce' + (n > 1 ? 's' : '') + '</b><small>' + (or < n ? 'Tu n\'as que ' + or + ' 🪙' : k === 1 ? 'On ne sait jamais...' : k === 2 ? 'Un peu plus de chances' : 'Plus de chances, plus gros pouvoirs') + '</small></button>'; };
    UI.open('puits', '<div class="pz-titre"><span>✦</span> Le puits magique <span>✦</span></div>' + SCENE + '<p class="pz-txt">' + txt + '</p>'
      + '<div class="pz-infos"><span>🪙 Ta bourse : <b>' + or + '</b></span><span>🕳️ ' + (q.parle ? 'Il a parlé aujourd\'hui' : reste + ' essai' + (reste > 1 ? 's' : '') + ' aujourd\'hui') + '</span></div>'
      + (fini && !attente ? '' : '<div class="pz-mises">' + mise(1) + mise(2) + mise(5) + '</div>')
      + '<div class="pz-btns"><button id="pz-ok"' + (attente ? ' disabled' : '') + '>' + (attente ? '...' : 'Continuer') + '</button></div>', true, true);
    if (UI.modal) UI.modal.pauses = true; // le jeu attend, sans la fenêtre Pause
    const pan = document.getElementById('panel'); pan.className = 'puits' + (fini && !(res && res.voix) ? ' eteint' : ''); document.getElementById('modal').classList.add('flou');
    document.getElementById('pz-ok').onclick = UI.dismiss;
    if (attente) { pan.querySelector('.pz-piece').classList.add('tombe'); pan.querySelector('.pz-onde').classList.add('va'); }
    pan.querySelectorAll('.pz-m').forEach(b => b.onclick = () => jeter(+b.dataset.n));
  }
  function jeter(n) {
    const S = CG.S, q = Pu.ici(); if (!q || S.res.or < Pu.prix(n) || q.parle || q.lancers >= Pu.LANCERS) return; Pu.payer(n); q.lancers++; const repond = Math.random() < Pu.REPOND[n]; CG.sfx('coin'); panneau({ attente: true });
    setTimeout(() => { if (CG.S !== S) return; const ouvert = UI.modal && UI.modal.name === 'puits', r = Pu.reponse(n, repond, ouvert); if (ouvert && r) panneau(r); }, 1500); // fenêtre refermée entre-temps : le puits répond quand même, par un bandeau
  }
  Pu.parler = function () { panneau(null); };
  Pu.jeter = jeter;
})(window.CG);
