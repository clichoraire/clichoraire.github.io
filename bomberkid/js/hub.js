// L'île des grands-parents (Josée et Richard) avec le magasin au milieu, et la boutique façon Zelda.
(function (BK) {
  'use strict';
  const HUB = [
    '               ',
    '  ,,,,,,,,,,,  ',
    ' ,,T,,,,,,,T,, ',
    ' ,,,,,###,,,,, ',
    ' ,x,,,#H#,,,x, ',
    ' ,,,,,,.,,,,,, ',
    ' ,,,......,,T, ',
    ' ,x,,,,.,,,,x, ',
    ' ,,,,,,1,,,,,, ',
    '  ,,,,,G,,,,,  ',
    '               ',
  ];
  BK.SHOP = [
    { id: 'bomb', name: 'Bombe en plus', icon: '💣', price: 30, max: 3, desc: 'Commence chaque tableau avec une bombe de plus.' },
    { id: 'fire', name: 'Grande flamme', icon: '🔥', price: 30, max: 3, desc: 'Tes explosions vont une case plus loin.' },
    { id: 'speed', name: 'Patins', icon: '⚡', price: 40, max: 2, desc: 'Tu cours plus vite dès le départ.' },
    { id: 'kick', name: 'Coup de pied', icon: '🦵', price: 60, max: 1, desc: 'Marche pour pousser une bombe, cours pour sauter dessus.' },
    { id: 'gloves', name: 'Gants de force', icon: '🧤', price: 70, max: 1, desc: 'Soulève les roches (Espace devant) et lance-les : 2 points de dégâts, un bond de plus. Deux lancers par roche.' },
    { id: 'heart', name: 'Cœur', icon: '❤️', price: 80, max: 2, desc: '10 points de vie max de plus, pour toujours.' },
    { id: 'life', name: 'Vie en plus', icon: '👤', price: 50, max: 2, desc: 'Une vie de plus à chaque aventure.' },
    { id: 'lantern', name: 'Lanterne à fée', icon: '🏮', price: 90, max: 1, desc: 'Une petite fée dans une lanterne, accrochée au pantalon : elle s’allume le soir et éclaire autour de toi. Le jour, elle dort.' },
  ];
  BK.shopPrice = (item, owned) => item.price * (owned + 1);

  class Hub {
    constructor(charId) {
      if (BK.music) BK.music.play('hub');
      this.charId = charId; this.def = BK.charById(charId); this.save = BK.loadAdventure(charId); this.t = 0; this.msg = ''; this.msgT = 0;
      const W = this.world = new BK.World({ map: HUB, theme: 'garden', mode: 'adventure', hearts: true, exitKind: 'door', explore: true, itemChance: 0 });
      const st = W.starts[0]; this.player = W.addPlayer(this.def, st.c, st.r); this.player.dir = 2; BK.applyStats(this.player, this.save); for (const d of W.doors) d.enterable = true;
      W.addNpc(BK.charById('josee'), 4, 6, ['Bonjour mon trésor ! Viens voir mon magasin.', 'Ramasse les pièces d’or, j’ai de belles choses à vendre.', 'Une bombe, ça se lance : appuie sur Shift !']);
      W.addNpc(BK.charById('richard'), 10, 5, ['Dans mon temps, on faisait exploser les blocs à la main.', 'Vas-y mollo avec les bombes près de la maison !', 'Les cartes d’or ? Ta grand-mère les collectionne.']);
      this.cam = new BK.Camera(BK.W, BK.H); this.cam.fit(W.cols, W.rows, { top: 86, bottom: 24, left: 24, right: 24 });
      this.toast('Bienvenue chez grand-maman et grand-papa !', 4);
    }
    toast(t, d) { this.msg = t; this.msgT = d || 3; }
    enterShop() { BK.audio.door(); BK.current = new Interior(this); }
    onClick(x, y) { const sr = this.world.signRect; if (sr && x >= sr.x - 10 && x <= sr.x + sr.w + 10 && y >= sr.y - 10 && y <= sr.y + sr.h + 16) { if (this.player.nearDoor) this.enterShop(); else this.world.petAnimal(this.player); } }   // tap sur la pancarte (tactile)
    update(dt) {
      const K = BK.input, W = this.world, p = this.player; this.t += dt; if (this.msgT > 0) this.msgT -= dt;
      if (K.hit(['Escape'])) { BK.showWorldSelect(this.charId); return; }
      if (K.hit(['KeyI'])) { BK.openInventory(this); return; }
      if (K.hit(['Tab'])) { W.frozen = true; BK.showStats(this.charId, this.save, () => { W.frozen = false; BK.applyStats(p, this.save, true); }); return; }
      K.read(p, 0);
      if (p.input.bomb || p.input.action) { p.input.bomb = p.input.action = false; if (!W.petAnimal(p) && !W.talkTo(p)) this.toast('Approche-toi de grand-maman ou de grand-papa pour leur parler.', 2.5); }
      if (K.hit(['Enter'])) { if (p.nearDoor) { this.enterShop(); return; } W.petAnimal(p); }
      W.update(dt);
      for (const e of W.events) {
        if (e.type === 'exit') { BK.audio.go(); BK.showWorldSelect(this.charId); return; }
      }
      BK.playTime = (BK.playTime || 0) + dt;
    }
    render(ctx) {
      this.world.render(ctx, this.cam, {});
      ctx.save(); ctx.font = 'bold 22px Nunito, sans-serif'; ctx.textBaseline = 'middle';
      const hint = 'Espace : parler · Entrée à la porte : magasin · Tab : fiche · Quai doré : les îles'; ctx.font = 'bold 17px Nunito, sans-serif'; BK.sprites.uiPanel(ctx, 14, 12, Math.max(460, ctx.measureText(hint).width + 34), 60); ctx.font = 'bold 22px Nunito, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = BK.sprites.UI.text; ctx.fillText('🏠 Chez grand-maman et grand-papa', 30, 30);
      ctx.font = 'bold 17px Nunito, sans-serif'; ctx.fillStyle = BK.sprites.UI.muted; ctx.fillText(hint, 30, 56);
      ctx.textAlign = 'right'; BK.sprites.uiPanel(ctx, BK.W - 354, 12, 220, 60); ctx.font = 'bold 26px Nunito, sans-serif'; ctx.fillStyle = BK.sprites.UI.gold; BK.sprites.textWithCoin(ctx, '🪙 ' + (this.save.gold || 0), BK.W - 150, 42);
      BK.sprites.drawHelpBubble(ctx,this.msg,this.msgT,BK.H-24);
      ctx.restore();
    }
  }
  // ---------------------------------------------------------------- achat (partagé)
  BK.buyUpgrade = (save, id) => {
    const it = BK.SHOP.find(x => x.id === id); save.upgrades = save.upgrades || {}; save.gold = save.gold || 0;
    const owned = id === 'lantern' ? ((save.inv || []).some(s => s.type === 'lantern' && s.n > 0) ? 1 : 0) : save.upgrades[id] || 0, price = BK.shopPrice(it, owned);
    if (owned >= it.max) return { ok: false, msg: 'Tu as déjà tout ce que j’ai de ça, mon ange !' };
    if (save.gold < price) { const m = price - save.gold; return { ok: false, msg: 'Il te manque ' + m + ' pièce' + (m > 1 ? 's' : '') + '. Va chercher des pièces d’or dans les tableaux !' }; }
    save.gold -= price;
    if (id === 'lantern') { save.inv = save.inv || []; save.inv.push({ type: 'lantern', n: 1 }); return { ok: true, msg: 'Merci ! La lanterne est dans ton sac : range-la dans ta ceinture (raccourcis 1 à 8) pour la porter. La fée s’allume le soir.', item: it }; }
    save.upgrades[id] = owned + 1; return { ok: true, msg: 'Merci ! ' + it.name + ' : ' + it.desc, item: it };
  };
  // ---------------------------------------------------------------- intérieur du magasin : on s'y promène
  const SHOP_MAP = ['###############', '#yyyyyyyyyyyyy#', '#NNNyyNNNyyNNN#', '#yyyyyyyyyyyyy#', '#yyyyyyyyyyyyy#', '#yqqqqqqqqqqqy#', '#yqqqqqqqqqqqy#', '#VyyyyyyyyyyyV#', '#yyyyyy1yyyyyy#', '#######G#######'];
  const MERCHANTS = [
    { id: 'josee', c: 2, r: 1, items: ['bomb', 'fire'], lines: ['Bonjour mon trésor ! Mes bombes et mes flammes sont là devant.', 'Avance sur un article et appuie sur Espace pour l’acheter.'] },
    { id: 'richard', c: 7, r: 1, items: ['kick', 'speed', 'gloves'], lines: ['Des patins, un bon coup de pied et des gants de force : ça, c’est du solide.', 'Dans mon temps, on courait pieds nus !'] },
    { id: 'matthieu', c: 12, r: 1, items: ['heart', 'life', 'lantern'], lines: ['Salut ! Des cœurs, des vies, et une lanterne à fée pour les nuits noires.', 'Garde tes pièces pour ce qui compte vraiment.'] },
  ];
  class Interior {
    constructor(hub) {
      this.hub = hub; this.charId = hub.charId; this.def = hub.def; this.save = hub.save; this.save.upgrades = this.save.upgrades || {}; this.save.gold = this.save.gold || 0; this.t = 0; this.msg = ''; this.msgT = 0;
      const W = this.world = new BK.World({ map: SHOP_MAP, theme: 'interior', mode: 'adventure', hearts: true, exitKind: 'door', explore: true, itemChance: 0 });
      W.ensureRoomExit();
      const st = W.starts[0]; this.player = W.addPlayer(this.def, st.c, st.r); this.player.dir = 2; BK.applyStats(this.player, this.save);
      this.merchants = MERCHANTS.map(m => { const npc = W.addNpc(BK.charById(m.id), m.c, m.r, m.lines); npc.merchant = m; return npc; });
      W.displays = []; for (const m of MERCHANTS) m.items.forEach((id, k) => W.displays.push({ c: k === 2 ? m.c : m.c - 1 + k * 2, r: k === 2 ? 2 : 3, id, icon: BK.SHOP.find(x => x.id === id).icon, merchant: m.id }));
      this.refresh(); this.cam = new BK.Camera(BK.W, BK.H); this.cam.fit(W.cols, W.rows, { top: 86, bottom: 110, left: 24, right: 24 });
      this.toast('Bienvenue au magasin ! Avance sur un article et appuie sur Espace.', 4);
    }
    toast(t, d) { this.msg = t; this.msgT = d || 3; }
    refresh() { for (const d of this.world.displays) { const it = BK.SHOP.find(x => x.id === d.id), owned = d.id === 'lantern' ? ((this.save.inv || []).some(s => s.type === 'lantern' && s.n > 0) ? 1 : 0) : this.save.upgrades[d.id] || 0; d.price = BK.shopPrice(it, owned); d.soldOut = owned >= it.max; d.affordable = this.save.gold >= d.price; d.owned = owned; d.max = it.max; } }
    displayAt(p) { const c = Math.floor(p.x), r = Math.floor(p.y); return this.world.displays.find(d => d.c === c && d.r === r) || null; }
    buy(d) {
      const res = BK.buyUpgrade(this.save, d.id); const npc = this.merchants.find(n => n.merchant.id === d.merchant);
      if (npc) { BK.say(npc, res.msg); npc.dir = 0; }
      if (res.ok) { BK.saveAdventure(this.charId, this.save); BK.audio.item(); this.world.burst(d.c + 0.5, d.r + 0.5, 0.4, '#ffd54a', 12); this.refresh(); } else BK.audio.hurt();
      return res.ok;
    }
    leave() { BK.audio.click(); const hub = this.hub; hub.player.dir = 0; BK.current = hub; hub.toast('Reviens quand tu veux !', 2); }
    onClick(x, y) { const sr = this.world.signRect; if (!sr || x < sr.x - 10 || x > sr.x + sr.w + 10 || y < sr.y - 10 || y > sr.y + sr.h + 16) return; const d = this.displayAt(this.player); if (d) this.buy(d); else this.world.petAnimal(this.player); }   // tap sur la pancarte (iPad, cellulaire)
    update(dt) {
      const K = BK.input, W = this.world, p = this.player; this.t += dt; if (this.msgT > 0) this.msgT -= dt;
      if (K.hit(['KeyI'])) { BK.openInventory(this); return; }
      if (K.hit(['Escape'])) { this.leave(); return; }
      K.read(p, 0);
      if (p.input.bomb || p.input.action || K.hit(['Enter'])) { p.input.bomb = p.input.action = false; const d = this.displayAt(p); if (d) this.buy(d); else if (!W.petAnimal(p) && !W.talkTo(p)) this.toast('Avance sur un article pour l’acheter, ou parle à un marchand.', 2.5); }
      W.update(dt); for (const d of W.displays) d.active = false; const on = this.displayAt(p); if (on) on.active = true; p.nearDisplay = on;   // pancarte « Acheter » au-dessus de la tête
      for (const e of W.events) if (e.type === 'exit') { this.leave(); return; }
      BK.playTime = (BK.playTime || 0) + dt;
    }
    render(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, BK.H); g.addColorStop(0, '#1a110a'); g.addColorStop(1, '#3b2412'); ctx.fillStyle = g; ctx.fillRect(0, 0, BK.W, BK.H);
      this.world.render(ctx, this.cam, { noBackground: true });
      const S = BK.sprites; ctx.save(); ctx.font = 'bold 22px Nunito, sans-serif'; ctx.textBaseline = 'middle';
      const hint = 'Espace : acheter / parler · porte en bas ou Échap : sortir'; ctx.font = 'bold 17px Nunito, sans-serif'; S.uiPanel(ctx, 14, 12, Math.max(420, ctx.measureText(hint).width + 34), 60); ctx.font = 'bold 22px Nunito, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = S.UI.text; ctx.fillText('🏪 Le magasin de grand-maman', 30, 30); ctx.font = 'bold 17px Nunito, sans-serif'; ctx.fillStyle = S.UI.muted; ctx.fillText(hint, 30, 56);
      ctx.textAlign = 'right'; S.uiPanel(ctx, BK.W - 354, 12, 220, 60); ctx.font = 'bold 26px Nunito, sans-serif'; ctx.fillStyle = S.UI.gold; S.textWithCoin(ctx, '🪙 ' + this.save.gold, BK.W - 150, 42);
      const d = this.displayAt(this.player);
      S.uiPanel(ctx, 40, BK.H - 92, BK.W - 80, 76, { border: '#ffc53f' });
      ctx.textAlign = 'left'; ctx.fillStyle = S.UI.text; ctx.font = 'bold 21px Nunito, sans-serif';
      if (d) { const it = BK.SHOP.find(x => x.id === d.id); S.textWithCoin(ctx, it.icon + ' ' + it.name + (it.max > 1 ? '  ' + d.owned + '/' + it.max : '') + '   ·   ' + (d.soldOut ? 'Épuisé' : '🪙 ' + d.price), 64, BK.H - 68); ctx.font = 'bold 17px Nunito, sans-serif'; ctx.fillStyle = S.UI.muted; ctx.fillText(it.desc + (d.soldOut ? '' : d.affordable ? '   —   Entrée ou Espace pour acheter' : '   —   pas assez de pièces'), 64, BK.H - 38); }
      else { ctx.fillText(this.msgT > 0 ? this.msg : 'Promène-toi entre les comptoirs.', 64, BK.H - 68); ctx.font = 'bold 17px Nunito, sans-serif'; ctx.fillStyle = S.UI.muted; ctx.fillText('Josée : bombes et flammes · Richard : patins et coup de pied · Matthieu : cœurs et vies', 64, BK.H - 38); }
      ctx.restore();
    }
  }
  BK.Interior = Interior; BK.Shop = Interior;
  BK.Hub = Hub; BK.HUB_MAP = HUB;
})(window.BK);
