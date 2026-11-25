// Goblin Malin — le Battoir des échos : une arme unique. Elle cogne comme une bonne épée, un peu plus lentement, et elle a un
// pouvoir que rien d'autre n'a : elle renvoie les tirs. Flèche, carreau, boule de feu... tout ce qui vole vers le chef repart
// vers celui qui l'a tiré, plus vite et plus fort. Mais il faut frapper au bon moment : le coup n'ouvre qu'un tout petit
// instant (FENETRE), et un coup donné trop tôt laisse le chef à découvert le temps de reprendre son élan (CADENCE).
//   Renvoyé dans les PARFAIT premières secondes du coup : « Parfait ! », et le tir repart encore plus fort.
// On le trouve chez Borin, le marchand nain (CHANCE à chaque visite), une seule fois. Tout est réglable dans CG.Renvoi.
'use strict';
(function (CG) {
  const G = CG.G, UI = CG.UI, Bq = CG.Banque, Iv = CG.Inventaire, TAU = Math.PI * 2, rand = CG.rand; if (!Bq) return;
  const Rv = CG.Renvoi = { K: 'epeeBattoir', NOM: 'Battoir des échos', IC: '🏏', QUALITE: 3, PRIX: 3500, CHEZ: 'nain', CHANCE: 0.4,
    FENETRE: 0.2, RAYON: 46, CADENCE: 0.6, PARFAIT: 0.07, FORCE: 2, FORCE_PARFAIT: 3.5, VITESSE: 1.4 };
  const PHRASE = 'Renvoie les tirs à celui qui les a lancés, si tu frappes au bon moment.';
  Bq.NOMS[Rv.K] = ['', Rv.NOM, Rv.NOM, Rv.NOM, Rv.NOM]; Bq.IC[Rv.K] = Rv.IC; if (CG.Objets && CG.Objets.PHRASE) CG.Objets.PHRASE[Rv.K] = PHRASE;
  if (Iv && Iv.effet) { const e0 = Iv.effet; Iv.effet = function (it, chef) { if (it && it.k === Rv.K) return chef ? '+' + (Iv.CHEF_EPEE[it.n] || 0) + ' dégâts · ' + PHRASE : 'Pour le chef seulement'; return e0.apply(this, arguments); }; }
  if (Bq.effet) { const b0 = Bq.effet; Bq.effet = function (k) { return k === Rv.K ? 'Pour le chef seulement. ' + PHRASE : b0.apply(this, arguments); }; }
  Rv.porte = () => { const p = CG.S && CG.S.player, a = p && p.porte && p.porte.arme; return !!a && a.k === Rv.K; };
  Rv.donner = () => { const z = Bq.deposer(Rv.K, Rv.QUALITE, 1, 'sac'); (CG.S.battoirEu = 1); return z; };
  // ---------- le coup : il ouvre la fenêtre ----------
  const at0 = G.attack; G.attack = function () {
    const R = CG.R, pret = R && !(R.atkCd > 0) && !(R.ko > 0), r = at0.apply(this, arguments);
    if (pret && Rv.porte() && R.swing > 0.9) { R.renvoiT = Rv.FENETRE; R.atkCd = Math.max(R.atkCd, Rv.CADENCE); }
    return r;
  };
  function renvoyer(s, parfait) {
    const S = CG.S, R = CG.R, p = S.player, o = s.owner && !s.owner.dead && R.enemies.includes(s.owner) ? s.owner : null, v = Math.hypot(s.vx, s.vy) * Rv.VITESSE || 500;
    let ux = -s.vx, uy = -s.vy; if (o) { ux = o.x - s.x; uy = (o.y - 16) - s.y; } const l = Math.hypot(ux, uy) || 1;
    s.vx = ux / l * v; s.vy = uy / l * v; s.team = 'p'; s.owner = p; s.dmg = Math.max(1, s.dmg) * (parfait ? Rv.FORCE_PARFAIT : Rv.FORCE); s.life = 1.6; s.renvoye = true;
    R.rings.push({ x: s.x, y: s.y, r: parfait ? 70 : 44, life: 0.3, col: parfait ? '#ffe36b' : '#e8f4ff' }); G.puff(s.x, s.y, parfait ? '#ffe36b' : '#ffffff', parfait ? 16 : 9, 170, 3);
    (R.renvois = R.renvois || []).push({ x: s.x, y: s.y, a: Math.atan2(uy, ux), t: 0.22, max: 0.22, parfait }); R.playerCombatUntil = R.t + 3;
    G.text(p.x, p.y - 74, parfait ? '✨ Parfait !' : '↩️ Renvoyé !', parfait ? '#ffe36b' : '#e8f4ff', true); CG.sfx(parfait ? 'level' : 'chop'); if (parfait) R.shake = Math.max(R.shake || 0, 0.15);
  }
  const up0 = G.update; G.update = function (dt) {
    const S = CG.S, R = CG.R;
    if (S && R && R.renvoiT > 0 && !(R.ko > 0)) { const p = S.player, ecoule = Rv.FENETRE - R.renvoiT; R.renvoiT -= dt;
      for (const s of R.shots || []) { if (s.team !== 'e' || s.life <= 0) continue; const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt; /* là où il est, ou là où il sera à la fin de cette image */
        if (Math.hypot(p.x - s.x, p.y - 18 - s.y) < Rv.RAYON || Math.hypot(p.x - nx, p.y - 18 - ny) < Rv.RAYON) renvoyer(s, ecoule <= Rv.PARFAIT); }
      if (R.osMorts) for (const o of R.osMorts) if (!o.pare && Math.hypot(p.x - o.x, p.y - 18 - o.y) < Rv.RAYON) { o.pare = true; o.t = 99; o.dmg = 0; G.puff(o.x, o.y, '#e8e0d0', 8, 120, 3); G.text(p.x, p.y - 74, '🦴 Paré !', '#e8f4ff', true); CG.sfx('chop'); } /* un os lancé : il ne se renvoie pas, il se brise */
    }
    const r = up0.apply(this, arguments); const R2 = CG.R; if (R2 && R2.renvois && R2.renvois.length) { for (const q of R2.renvois) q.t -= dt; R2.renvois = R2.renvois.filter(q => q.t > 0); }
    return r;
  };
  // ---------- ce qu'on voit : un croissant clair devant le chef pendant la fenêtre, un éclat là où le tir rebondit ----------
  if (CG.Magie && CG.Magie.marks) { const mk0 = CG.Magie.marks; CG.Magie.marks = function (g, t) { mk0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R) return;
    if (R.renvoiT > 0 && Rv.porte()) { const p = S.player, k = R.renvoiT / Rv.FENETRE, a = Math.atan2(R.dir ? R.dir.y : 0, R.dir ? R.dir.x : p.face || 1); g.save(); g.translate(p.x, p.y - 18); g.rotate(a);
      g.globalAlpha = 0.25 + k * 0.55; g.strokeStyle = '#bfe6ff'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, Rv.RAYON - 12, -1.15, 1.15); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, Rv.RAYON - 12, -1.15, 1.15); g.stroke(); g.restore(); }
    for (const q of R.renvois || []) { const k = q.t / q.max; g.save(); g.translate(q.x, q.y); g.rotate(q.a); g.globalAlpha = k; g.fillStyle = q.parfait ? '#ffe36b' : '#ffffff';
      for (const d of [-0.9, -0.45, 0, 0.45, 0.9]) { g.save(); g.rotate(d); const l = (q.parfait ? 34 : 22) * (1.2 - k * 0.5); g.beginPath(); g.moveTo(4, -1.6); g.lineTo(l, 0); g.lineTo(4, 1.6); g.closePath(); g.fill(); g.restore(); }
      g.beginPath(); g.arc(0, 0, 4 + (1 - k) * 6, 0, TAU); g.fill(); g.restore(); } }; }
  // ---------- chez le marchand nain, une seule fois ----------
  const possede = () => { const S = CG.S, p = S.player, tous = (p.sac || []).concat(p.porte ? [p.porte.arme] : [], S.coffre || [], (S.banque && S.banque.coffre) || []); return !!S.battoirEu || tous.some(it => it && it.k === Rv.K); };
  Rv.article = () => ({ icon: Rv.IC, label: Rv.NOM, desc: '★★★ +' + ((Iv && Iv.CHEF_EPEE[Rv.QUALITE]) || 12) + ' dégâts. ' + PHRASE + ' Pour toi seulement.', prix: Rv.PRIX, stock: 1, rare: true, buy: () => { Rv.donner(); UI.toast(Rv.IC + ' ' + Rv.NOM + ' : dans ton sac. Mets-le dans ta case « Arme ».'); } });
  if (UI && UI.shop) { const sh0 = UI.shop; UI.shop = function (v) { try { if (v && Array.isArray(v.shop) && !v.battoirVu && v.role === Rv.CHEZ) { v.battoirVu = true; if (!possede() && Math.random() < Rv.CHANCE) v.shop.push(Rv.article()); } } catch (e) { /* jamais bloquant */ } return sh0.apply(this, arguments); }; }
})(window.CG);
