// Goblin Malin — la Frénésie se voit : tant qu'elle dure (le sort, ou la potion de frénésie), le chef est légèrement teinté de rouge.
//   Le chef est dessiné à part, sur une petite image, puis recouvert d'un voile rouge (jamais de ctx.filter). Chargé après tout ce qui
//   habille le chef, pour que son chapeau et son arme rougissent avec lui. Tout se règle dans CG.FrenesieRouge.
'use strict';
(function (CG) {
  const Art = CG.Art; if (!Art || !Art.goblin) return;
  const Fr = CG.FrenesieRouge = { TEINTE: 'rgba(255,40,20,0.34)', BAT: 0.06 /* le voile bat un peu, comme un cœur */, TAILLE: 220, FIN: 3 /* il clignote les dernières secondes */ };
  Fr.reste = () => { const R = CG.R; return R ? Math.max(R.frenesie && R.frenesie.t > 0 ? R.frenesie.t : 0, R.pot && R.pot.frenesie > 0 ? R.pot.frenesie : 0) : 0; };
  const K = 2; let off = null, og = null, dedans = false;
  const gob0 = Art.goblin; Art.goblin = function (g, o) {
    const reste = dedans || !o || !o.chief ? 0 : Fr.reste(); if (!(reste > 0) || (CG.R && CG.R.ko > 0)) return gob0.apply(this, arguments);
    const SZ = Fr.TAILLE, t = CG.R.t || 0; if (!off) { off = document.createElement('canvas'); off.width = off.height = SZ * K; og = off.getContext('2d'); }
    og.setTransform(1, 0, 0, 1, 0, 0); og.globalCompositeOperation = 'source-over'; og.globalAlpha = 1; og.clearRect(0, 0, SZ * K, SZ * K); og.setTransform(K, 0, 0, K, (SZ / 2 - o.x) * K, (SZ * 0.78 - o.y) * K);
    const a = Array.prototype.slice.call(arguments); a[0] = og; let bon = true; dedans = true; og.save(); try { gob0.apply(this, a); } catch (e) { bon = false; } finally { og.restore(); dedans = false; }
    if (!bon) return gob0.apply(this, arguments);
    const m = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(Fr.TEINTE), fin = reste < Fr.FIN && Math.sin(t * 14) < 0 ? 0.45 : 1, al = m ? Math.max(0, (+m[4] + Math.sin(t * 9) * Fr.BAT) * fin) : 0.3;
    og.setTransform(1, 0, 0, 1, 0, 0); og.globalCompositeOperation = 'source-atop'; og.fillStyle = m ? 'rgba(' + m[1] + ',' + m[2] + ',' + m[3] + ',' + al.toFixed(3) + ')' : Fr.TEINTE; og.fillRect(0, 0, SZ * K, SZ * K); og.globalCompositeOperation = 'source-over';
    g.drawImage(off, o.x - SZ / 2, o.y - SZ * 0.78, SZ, SZ);
  };
})(window.CG);
