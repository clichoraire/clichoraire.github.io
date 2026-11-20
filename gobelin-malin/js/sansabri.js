// Goblin Malin — les sans-abri : hutte en ruine = nuit autour du feu, fatigue, moral qui baisse ; et le refuge (limité) dans la hutte du chef pendant une attaque.
'use strict';
(function (CG) {
  const G = CG.G, D = CG.D, W = CG.W, Art = CG.Art, T = CG.TILE, Ab = CG.Abri = {};
  Ab.CAP = [4, 7, 10];      // places de refuge dans la hutte du chef : chaume, pierre, métal
  Ab.INVITES = 2;           // une hutte ordinaire peut cacher deux voisins en plus de ses habitants
  Ab.FATIGUE = 0.8;         // vitesse de marche et de travail après une nuit dehors
  Ab.cap = b => Ab.CAP[Math.min(2, b.up || 0)];
  Ab.sansToit = g => { const h = CG.S.buildings[g.home]; return !h || !!h.site; };
  Ab.dedans = b => CG.S.goblins.filter(g => g.hidden && g.refuge === b).length;
  const prevus = (b, moi) => CG.S.goblins.filter(o => o !== moi && o.refuge === b && !o.dehors && (o.hidden || o.state === 'flee') && CG.S.buildings[o.home] !== b).length;

  // où courir se cacher : sa hutte ; sinon la hutte du chef s'il reste de la place ; sinon chez un voisin ; sinon... dehors, devant la porte du chef
  G.shelter = function (g) {
    const S = CG.S, h = S.buildings[g.home]; g.dehors = false;
    if (h && !h.site) return h;
    const chef = S.buildings.find(b => b.type === 'chief' && !b.site);
    if (chef && prevus(chef, g) < Ab.cap(chef)) return chef;
    const voisin = S.buildings.find(b => b.type === 'hut' && !b.site && prevus(b, g) < Ab.INVITES);
    if (voisin) return voisin;
    g.dehors = true; return chef || S.buildings.find(b => b.type === 'hut' && !b.site) || h;
  };

  // ---------- le matin : ceux qui n'ont plus de toit ont dormi autour du feu ----------
  const DODO = ['J\'ai dormi par terre... j\'ai mal partout.', 'Pas fermé l\'œil de la nuit.', 'Ma hutte me manque, chef.', 'Le feu, ça ne remplace pas un toit.', 'J\'ai une racine imprimée dans le dos.'];
  const HUTTE = ['Ma hutte !', 'Non ! Ma maison !', 'Toutes mes affaires étaient là-dedans !', 'Et je dors où, moi, ce soir ?'];
  Ab.matin = function (lines) {
    const S = CG.S, sans = S.goblins.filter(Ab.sansToit); if (!sans.length) return;
    const perte = Math.min(6, sans.length); S.morale = Math.max(0, S.morale - perte);
    const noms = sans.slice(0, 4).map(g => g.name).join(', ') + (sans.length > 4 ? '...' : '');
    lines.push('🏚 Sans toit : ' + noms + (sans.length > 1 ? ' ont dormi' : ' a dormi') + ' autour du feu. Fatigué' + (sans.length > 1 ? 's' : '') + ' aujourd\'hui, et le moral baisse de ' + perte + ' tant que ' + (sans.length > 1 ? 'leur hutte n\'est' : 'sa hutte n\'est') + ' pas rebâtie.');
  };
  const sd = D.startDay;
  D.startDay = function () {
    sd.apply(this, arguments); const S = CG.S, fire = G.firePos(); let i = 0;
    S.goblins.forEach(g => {
      g.refuge = null; g.dehors = false; g.fatigue = Ab.sansToit(g); if (!g.fatigue) return;
      const a = (i++) * 1.3 + 0.6; let x = fire.x + Math.cos(a) * 62, y = fire.y + Math.sin(a) * 44; if (!W.walkPx(x, y)) { x = fire.x; y = fire.y + 50; }
      g.x = x; g.y = y; g.plainte = 2 + i * 1.6; // il se réveille près du feu, et le dit
    });
  };
  const ws = G.workSpeed; G.workSpeed = g => ws(g) * (g.fatigue ? Ab.FATIGUE : 1);
  const es = G.evoSpd; G.evoSpd = g => es(g) * (g.fatigue ? Ab.FATIGUE : 1);

  // ---------- les réactions : quand la hutte tombe, au réveil, et de temps en temps pendant la journée ----------
  const up0 = G.update;
  G.update = function (dt) {
    up0.apply(this, arguments); const S = CG.S, R = CG.R; if (!S || !R || R.night) return;
    for (const g of S.goblins) {
      const sans = Ab.sansToit(g);
      if (sans && !g.sansVu) { g.sansVu = true; if (R.t > 3 && !g.fatigue) { G.text(g.x, g.y - 52, '😢 ' + CG.pick(HUTTE), '#ffb0a0', true); g.bubble = '😢'; } } // sa hutte vient de tomber
      else if (!sans && g.sansVu) { g.sansVu = false; if (!g.hidden) { G.text(g.x, g.y - 52, '🛖 Enfin un toit !', '#b8ffb0', true); g.emoteT = 1.5; } }
      if (!g.fatigue || g.hidden || R.alarm) continue;
      g.plainte -= dt; if (g.plainte > 0) continue; g.plainte = 40 + Math.random() * 50;
      G.text(g.x, g.y - 52, '😴 ' + CG.pick(DODO), '#d8d0ff', true);
    }
    // un refuge tombé en ruine : tout le monde ressort
    for (const g of S.goblins) if (g.hidden && g.refuge && g.refuge.site) { g.hidden = false; G.unstick(g, 8); g.state = 'idle'; g.refuge = null; }
  };

  // ---------- pendant l'attaque : combien se cachent dans la hutte du chef (seulement s'il y a quelqu'un) ----------
  function pastille(g, b) {
    const R = CG.R; if (b.type !== 'chief' || b.site || !R || !R.alarm) return; const n = Ab.dedans(b); if (!n) return;
    const cap = Ab.cap(b), x = (b.tx + b.w / 2) * T, y = (b.ty + b.h) * T - 132, txt = '🫣 ' + n + ' / ' + cap, plein = n >= cap;
    g.save(); g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = g.measureText(txt).width + 18;
    g.fillStyle = plein ? 'rgba(120,20,12,0.9)' : 'rgba(30,22,10,0.88)'; g.beginPath(); g.roundRect(x - w / 2, y - 12, w, 24, 12); g.fill();
    g.strokeStyle = plein ? '#ff7a6a' : '#ffe36b'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = '#fff'; g.fillText(txt, x, y + 1); g.restore();
  }
  const de = Art.drawExtra; Art.drawExtra = function (g, b) { de.apply(this, arguments); pastille(g, b); };
  const bu = Art.building; Art.building = function (g, b) { bu.apply(this, arguments); pastille(g, b); };
})(window.CG);
