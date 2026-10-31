// Mode Match : le vrai Bomberman. Jusqu'à quatre bombardiers, manches gagnantes, mort subite avec pluie de blocs.
(function (BK) {
  'use strict';
  const ARENA = ['###############', '#1 ?????????? 2#'.slice(0, 15), '# #?#?#?#?#?# #', '#?????????????#', '#?#?#?#?#?#?#?#', '#?????????????#', '#?#?#?#?#?#?#?#', '#?????????????#', '#?#?#?#?#?#?#?#', '#?????????????#', '#?#?#?#?#?#?#?#', '#3 ?????????? 4#'.slice(0, 15), '###############'];
  ARENA[1] = '#1 ??????????2#'; ARENA[11] = '#3 ??????????4#';
  class Match {
    // o : { players: [{ charId, human: 0|1|null, level }], roundsToWin, theme }
    constructor(o) {
      this.elapsed=0; this.o = o; this.roundsToWin = o.roundsToWin || 2; this.round = 0; this.wins = o.players.map(() => 0);
      this.cam = new BK.Camera(BK.W, BK.H); this.cam.fit(15, 13, { top: 90, bottom: 20, left: 20, right: 20 });
      this.themes = ['arena', 'forest', 'castle', 'lava'];
      this.newRound();
    }
    newRound() {
      this.round++;
      const theme = this.o.theme === 'random' || !this.o.theme ? this.themes[(this.round - 1) % this.themes.length] : this.o.theme;
      const W = this.world = new BK.World({ map: ARENA, theme, mode: 'match', hearts: true, itemPool: BK.MATCH_ITEMS, itemChance: 0.3, softChance: 0.75 });
      // les cases de départ et leurs voisines restent libres
      for (const st of W.starts) for (const [dc, dr] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) { const c = st.c + dc, r = st.r + dr; if (W.inside(c, r) && W.cell(c, r) === BK.SOFT) W.cells[W.idx(c, r)] = 0; }
      this.players = this.o.players.map((pd, i) => { const st = W.starts[i]; const p = W.addPlayer(BK.charById(pd.charId), st.c, st.r, { hp: BK.MATCH_HEARTS * 10, bombs: 1, fire: 2, bot: pd.human == null ? { level: pd.level || 'moyen' } : null }); p.humanMap = pd.human; p.wins = this.wins[i]; return p; });
      this.state = 'countdown'; this.stateT = 0; W.frozen = true; this.timer = BK.SUDDEN_DEATH; this.rainStarted = false; this.endT = 0; this.lastCount = 4; this.winner = null;
    }
    update(dt) {
      const W = this.world, K = BK.input; this.stateT += dt;
      if (this.state === 'countdown') {
        W.update(dt);
        const n = Math.ceil(3 - this.stateT); if (n !== this.lastCount) { this.lastCount = n; if (n > 0) BK.audio.countdown(); else BK.audio.go(); }
        if (this.stateT > 3.2) { this.state = 'play'; this.stateT = 0; W.frozen = false; }
        return;
      }
      if (this.state === 'play' || this.state === 'ending') {
        if (this.state === 'play' && K.hit(['Escape', 'KeyP'])) { this.state = 'pause'; W.frozen = true; BK.overlay.show({ title: 'Pause', text: 'Manche ' + this.round, buttons: [{ label: 'Continuer', primary: true, onClick: () => { BK.overlay.hide(); this.state = 'play'; W.frozen = false; } }, { label: 'Quitter', onClick: () => { BK.overlay.hide(); BK.toMenu(); } }] }); return; }
        for (const p of this.players) { if (!p.alive) continue; if (p.humanMap != null) K.read(p, p.humanMap); else BK.ai.think(W, p, dt); }
        W.update(dt); BK.audio.events(W.events);
        if (this.state === 'play') {
          this.elapsed+=dt;this.timer -= dt;
          if(this.o.challenge)BK.updateChallengeFeedback(this.o.challenge,this,dt);
          if (this.timer <= 0 && !this.rainStarted) { this.rainStarted = true; W.startRain(0.2); BK.audio.rain(); }
          if (this.rainStarted && W.events.some(e => e.type === 'blockDestroyed') === false && W.falling.length && Math.random() < 0.08) BK.audio.rain();
          const alive = this.players.filter(p => p.alive);
          if (alive.length <= 1) { this.state = 'ending'; this.stateT = 0; this.winner = alive[0] || null; }
        } else if (this.stateT > 1.6) this.endRound();
      }
    }
    endRound() {
      const W = this.world; W.frozen = true; this.state = 'result';
      const w = this.winner; if (w) { const i = this.players.indexOf(w); this.wins[i]++; w.wins = this.wins[i]; w.pose = 'win'; w.poseT = 0; w.poseDur = 99; }
      for (const p of this.players) if (p.alive && p !== w) { p.pose = 'lose'; p.poseDur = 99; }
      const champion = this.wins.findIndex(x => x >= this.roundsToWin);
      const tally = '<div class="tally">' + this.players.map((p, i) => '<div class="t"><b style="color:' + p.color + '">' + p.name + '</b><span>' + '★'.repeat(this.wins[i]) + '☆'.repeat(Math.max(0, this.roundsToWin - this.wins[i])) + '</span></div>').join('') + '</div>';
      if (champion >= 0 && this.o.onResult && this.o.onResult(this.players[champion], this)) return;   // match d'un défi : l'écran de résultat est celui du défi
      if (champion >= 0) { BK.audio.win(); BK.overlay.show({ title: this.players[champion].name + ' remporte le match !', html: tally, buttons: [{ label: 'Rejouer', primary: true, onClick: () => { BK.overlay.hide(); this.round = 0; this.wins = this.wins.map(() => 0); this.newRound(); } }, { label: 'Menu', onClick: () => { BK.overlay.hide(); BK.toMenu(); } }] }); }
      else { if (w) BK.audio.win(); else BK.audio.lose(); BK.overlay.show({ title: w ? w.name + ' gagne la manche ' + this.round : 'Manche nulle !', html: tally, buttons: [{ label: 'Manche suivante', primary: true, onClick: () => { BK.overlay.hide(); this.newRound(); } }, { label: 'Quitter', onClick: () => { BK.overlay.hide(); BK.toMenu(); } }] }); }
    }
    render(ctx) {
      const W = this.world; W.render(ctx, this.cam, { names: true });
      ctx.save(); ctx.textBaseline = 'middle';
      // cartes des joueurs
      const n = this.players.length, cw = 220, gap = 14, x0 = (BK.W - (n * cw + (n - 1) * gap)) / 2;
      this.players.forEach((p, i) => {
        const x = x0 + i * (cw + gap);
        BK.sprites.uiPanel(ctx, x, 12, cw, 62, { fill: p.alive ? undefined : 'rgba(255,214,214,0.92)' });
        ctx.fillStyle = p.color; BK.sprites.rr(ctx, x, 12, 10, 62, 5); ctx.fill();
        ctx.textAlign = 'left'; ctx.font = 'bold 20px Nunito, sans-serif'; ctx.fillStyle = p.alive ? BK.sprites.UI.text : '#9aa7c2'; ctx.fillText(p.name + (p.humanMap != null ? ' (J' + (p.humanMap + 1) + ')' : ''), x + 20, 32);
        ctx.font = '17px Nunito, sans-serif'; ctx.fillStyle = BK.sprites.UI.gold; ctx.fillText('★'.repeat(this.wins[i]) + '☆'.repeat(Math.max(0, this.roundsToWin - this.wins[i])), x + 20, 56);
        ctx.fillStyle = BK.sprites.UI.text; ctx.textAlign = 'right'; ctx.fillText('💣' + p.bombsMax + ' 🔥' + p.fire + (p.kick ? ' 🦵' : '') + (p.shield ? ' 🛡️' : ''), x + cw - 14, 56);
        ctx.font = 'bold 20px Nunito, sans-serif'; ctx.fillStyle = '#ff6b6b';
        if (!p.alive) ctx.fillText('K.-O.', x + cw - 14, 32); else { const hearts = Math.max(0, Math.min(BK.MATCH_HEARTS, Math.ceil(p.hp / 10))); ctx.fillText('♥'.repeat(hearts) + '♡'.repeat(BK.MATCH_HEARTS - hearts), x + cw - 14, 32); }
      });
      if(this.o.challenge)BK.drawChallengeProgress(ctx,this.o.challenge,this,82);
      // chrono
      const t = Math.max(0, this.timer), mm = Math.floor(t / 60), ss = Math.floor(t % 60);
      ctx.textAlign = 'center'; ctx.font = 'bold 26px Nunito, sans-serif'; ctx.fillStyle = this.rainStarted ? (Math.sin(this.stateT * 10) > 0 ? '#ff6b6b' : '#fff') : t < 20 ? '#ffd54a' : '#fff';
      BK.sprites.uiPanel(ctx, BK.W / 2 - 70, BK.H - 52, 140, 40, { r: 12 });
      ctx.fillStyle = this.rainStarted ? BK.sprites.UI.bad : t < 20 ? BK.sprites.UI.gold : BK.sprites.UI.text; ctx.fillText(this.rainStarted ? 'MORT SUBITE' : mm + ':' + String(ss).padStart(2, '0'), BK.W / 2, BK.H - 32);
      if (this.state === 'countdown') {
        const n2 = Math.ceil(3 - this.stateT); ctx.font = 'bold 120px Nunito, sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(n2 > 0 ? String(n2) : 'GO !', BK.W / 2 + 4, BK.H / 2 + 4); ctx.fillStyle = n2 > 0 ? '#ffd54a' : '#49e26a'; ctx.fillText(n2 > 0 ? String(n2) : 'GO !', BK.W / 2, BK.H / 2);
        ctx.font = 'bold 26px Nunito, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('Manche ' + this.round + '  ·  ' + this.roundsToWin + ' manche' + (this.roundsToWin > 1 ? 's' : '') + ' pour gagner  ·  ' + BK.MATCH_HEARTS + ' cœurs chacun', BK.W / 2, BK.H / 2 + 90);
      }
      if (this.state === 'ending' && this.winner) { ctx.font = 'bold 64px Nunito, sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(this.winner.name + ' gagne !', BK.W / 2 + 3, BK.H / 2 + 3); ctx.fillStyle = this.winner.color; ctx.fillText(this.winner.name + ' gagne !', BK.W / 2, BK.H / 2); }
      ctx.restore();
    }
  }
  BK.MATCH_HEARTS = 3;   // trois cœurs par bombardier : un coup de flamme en enlève un
  BK.MATCH_ITEMS = Object.keys(BK.ITEMS).filter(k => BK.ITEMS[k].weight > 0 && !BK.ITEMS[k].adventureOnly);
  BK.Match = Match; BK.ARENA = ARENA;
})(window.BK);
