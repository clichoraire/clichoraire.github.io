// Clan Gobelin — interface : barre du haut, panneaux, dialogues, boutique.
'use strict';
(function (CG) {
  const UI = CG.UI = { modal: null }, G = CG.G, D = CG.D;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let S, R, lastHud = '', lastSpells = '', keyHandlers = {};
  const sync = () => { S = CG.S; R = CG.R; };

  UI.init = function () {
    $('btn-grimoire').onclick = () => UI.toggle('grimoire'); $('btn-help').onclick = () => UI.toggle('help');
    $('btn-pause').onclick = () => UI.toggle('pause'); $('btn-tech').onclick = () => UI.toggle('tech');
    const sound = $('btn-sound');
    sound.setAttribute('aria-label', 'Couper tout le son');
    sound.setAttribute('aria-pressed', String(CG.audio.muted));
    sound.onclick = () => {
      CG.audio.muted = !CG.audio.muted;
      sound.textContent = CG.audio.muted ? '🔇' : '🔊';
      sound.setAttribute('aria-pressed', String(CG.audio.muted));
      if (!CG.audio.muted) CG.sfx('click');
    };
    const modal = $('modal');
    modal.addEventListener('mousedown', e => { if (e.target === modal && UI.modal && UI.modal.closable) UI.dismiss(); });
    modal.addEventListener('keydown', e => {
      if (!UI.modal || UI.modal.name !== 'pause') return;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        e.preventDefault(); e.stopPropagation(); if (!e.repeat) UI.dismiss();
      } else if (e.key === 'Tab') {
        e.stopPropagation();
        const controls = $('panel').querySelectorAll('button, input');
        const first = controls[0], last = controls[controls.length - 1];
        if (e.target === (e.shiftKey ? first : last)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      } else if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
    });
  };
  UI.toggle = function (name) {
    if (!CG.S || (UI.modal && !UI.modal.closable)) return;
    if (UI.modal && UI.modal.name === name) return UI.dismiss();
    UI.close(); UI[name]();
  };
  function open(name, html, closable, wide) {
    sync();
    if (closable !== false && (!UI.modal || UI.modal.name !== name)) CG.sfx(name === 'grimoire' ? 'page' : 'uiOpen');
    const pauses = ['title', 'summary', 'over', 'pause', 'tech'].includes(name); /* l'arbre des technologies arrête aussi le jeu, sans la fenêtre Pause */ UI.modal = { name, closable: closable !== false, pauses }; keyHandlers = {};
    $('dialog').hidden = true; $('modal').className = pauses ? '' : 'soft';
    $('panel').className = wide ? 'wide' : ''; $('panel').innerHTML = html; $('modal').hidden = false; CG.keys.clear();
  }
  UI.close = function () { if (CG.R) { CG.R.talking = null; CG.R.hutSel = null; } UI.modal = null; $('modal').hidden = true; $('dialog').hidden = true; keyHandlers = {}; CG.keys.clear(); };
  UI.dismiss = function () { if (UI.modal) CG.sfx('uiClose'); UI.close(); };
  // le piédestal ancien : une stèle de pierre sombre, la sphère qui flotte, l'inscription, et deux boutons
  UI.autel = function (vagues, briser) {
    let runes = ''; for (let i = 0; i < 18; i++) runes += '<text x="0" y="-74" transform="rotate(' + i * 20 + ')">' + 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒ'[i] + '</text>';
    let eclats = ''; for (let i = 0; i < 14; i++) eclats += '<i style="left:' + (6 + i * 6.6) + '%;--d:' + (i % 7) * 0.5 + 's;--h:' + (40 + (i * 37) % 50) + '%"></i>';
    open('autel', '<div class="au-braises">' + eclats + '</div><div class="au-titre"><span>✦</span> Piédestal ancien <span>✦</span></div>'
      + '<div class="au-scene"><svg class="au-cercle" viewBox="-100 -100 200 200"><circle r="92" class="c1"/><circle r="84" class="c2"/><circle r="62" class="c1"/>' + runes + '<path d="M0 -58 L50 29 L-50 29 Z M0 58 L50 -29 L-50 -29 Z" class="c3"/></svg>'
      + '<div class="au-sphere"><span class="au-parch">📜</span><i class="au-reflet"></i></div><div class="au-socle"></div></div>'
      + '<p class="au-runes">« Qui brise le sceau réveille les enfers. »</p>'
      + '<div class="au-infos"><span>🌊 <b>' + vagues + '</b> vagues</span><span>👹 de plus en plus fortes</span><span>📜 <b>1</b> parchemin au bout</span></div>'
      + '<div class="au-btns"><button id="au-non">Pas maintenant</button><button id="au-oui"><b>💥 Briser la sphère</b></button></div>', true, true);
    $('panel').className = 'autel'; $('modal').classList.add('flou');
    $('au-non').onclick = UI.dismiss; $('au-oui').onclick = () => { UI.close(); briser(); }; keyHandlers['1'] = $('au-oui').onclick; $('au-non').focus();
  };
  UI.key = function (k) {
    if (!UI.modal) return;
    if (keyHandlers[k]) return keyHandlers[k]();
    if (k === 'Escape' && UI.modal.closable) return UI.dismiss();
    if (!UI.modal.closable) return;
    if (k === 'p') UI.toggle('pause');
    else if (k === 't') UI.toggle('tech'); else if (k === 'c') UI.toggle('carte'); else if (k === 'g') UI.toggle('grimoire'); else if (k === 'h') UI.toggle('help');
    else if (k === 'i' && UI.modal.name === 'inventaire') UI.dismiss();
  };
  UI.audioVolume = function (kind) {
    const percent = Math.round(CG.audio[kind + 'Volume'] * 100);
    const label = kind === 'music' ? 'Volume de la musique' : 'Volume des effets sonores';
    return '<label class="audio-volume"><span>Volume</span><input type="range" min="0" max="100" value="' + percent + '" data-audio-volume="' + kind + '" aria-label="' + label + '"><span class="audio-value" aria-hidden="true">' + percent + ' %</span></label>';
  };
  UI.bindAudioVolumes = function (root) {
    for (const input of root.querySelectorAll('[data-audio-volume]')) {
      const kind = input.dataset.audioVolume;
      input.oninput = () => {
        CG.audio[kind + 'Volume'] = input.valueAsNumber / 100;
        input.nextElementSibling.textContent = input.value + ' %';
        CG.audio.savePrefs();
      };
      if (kind === 'sfx') input.onchange = () => CG.sfx('click');
    }
  };
  UI.toast = function (msg) {
    msg = String(msg); const m = msg.match(/^((?:\p{Extended_Pictographic}|\p{Regional_Indicator})\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*)\s*/u), ic = m ? m[1] : '📣', txt = m ? msg.slice(m[0].length) : msg;
    const ton = '🔥😡😢😒🚪💀⚠️'.includes(ic) || (!m && /(^Pas question|manque|Impossible|Rien à|plus de quoi|Aucun)/.test(txt)) ? 'bad' : '🌳📜🤩😄🐺🧭🎁💰✨'.includes(ic) ? 'good' : '';
    const d = document.createElement('div'); d.className = 'toast ' + ton; const i = document.createElement('i'); i.textContent = !m && ton === 'bad' ? '✋' : ic; const sp = document.createElement('span'); sp.textContent = txt; d.appendChild(i); d.appendChild(sp); $('toasts').appendChild(d);
    { /* juste sous le cadre de vie du chef, quelle que soit sa hauteur */ const pl = $('player'), bo = $('toasts'); if (pl && bo && bo.offsetParent) { const r = pl.getBoundingClientRect(), o = bo.offsetParent.getBoundingClientRect(), k = pl.offsetHeight ? r.height / pl.offsetHeight : 1; if (r.height) bo.style.top = Math.round((r.bottom - o.top) / (k || 1) + 8) + 'px'; } }
    while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
    setTimeout(() => d.classList.add('out'), 5200); setTimeout(() => d.remove(), 6000);
  };

  // ---------- barre du haut ----------
  const pad = n => (n < 10 ? '0' : '') + n;
  UI.RES_LISTE = ['food', 'bois', 'minerai', 'cuir', 'or']; UI.RES_VU = 6; UI.resPos = 0; // cinq ressources, toujours les mêmes : plus de barre qui glisse (les os et la glu se voient là où on s'en sert)
  UI.refresh = function (hint) {
    sync(); if (!S) return;
    const p = S.player, h = Math.floor(S.hour) % 24, m = Math.floor((S.hour % 1) * 6) * 10, night = S.hour >= 19.5 || S.hour < 6;
    const r = S.res, fige = !!(CG.Mondes && CG.Mondes.ici && CG.Mondes.ici() === 2), /* donjon, arène : dehors, le temps s'est arrêté */ key = [S.day, fige ? -1 : h, m, Math.floor(r.food), Math.floor(r.bois), Math.floor(r.minerai), Math.floor(r.cuir), Math.floor(r.or), Math.floor(r.os || 0), Math.floor(r.slime || 0), UI.resPos || 0, S.goblins.length, G.capacity(), Math.round(S.morale), (p.fioles && p.fioles.mana1) || 0, Math.round(p.hp), p.maxhp, Math.floor(p.mp), p.maxmp, p.xp, p.lvl, p.potions, Math.ceil(R.shield), R.alarm, S.tech.points, (R.tasks || []).map(k => k.to.id).join('.')].join('|');
    if (key !== lastHud) {
      lastHud = key;
      $('clock').innerHTML = '<i>' + (night ? '🌙' : S.hour >= 18 ? '🌇' : '☀️') + '</i><b>Jour ' + S.day + '</b><u>' + (fige ? '--:--' : pad(h) + ':' + pad(m)) + '</u>' + (R.alarm ? '<span class="alarm">⚔ ATTAQUE</span>' : '');
      const mor = CG.Humeur ? CG.Humeur.tete() : S.morale >= 70 ? '😄' : S.morale >= 40 ? '🙂' : '😟';
      const TIP = { food: 'Pour nourrir le clan et faire la fête le soir', bois: 'Pour bâtir', minerai: 'Pour bâtir et forger', cuir: 'Pour les armures', or: 'Pour acheter et améliorer', os: 'Pour les potions du chaudron', slime: 'Une boule par flaque de glu' };
      /* les ressources défilent : six à la fois, les autres en glissant (flèches, molette, ou en tirant la barre) */ const LR = UI.RES_LISTE.filter(k => CG.RES[k]), VU = UI.RES_VU, n0 = UI.resPos = Math.max(0, Math.min(LR.length - VU, UI.resPos || 0)), nav = (d, ok) => LR.length > VU ? '<span class="r-nav' + (ok ? '' : ' off') + '" data-nav="' + d + '" data-tip="' + (d < 0 ? 'Ressources précédentes' : 'Autres ressources') + '" data-sub="Ou la molette, ou tire la barre">' + (d < 0 ? '‹' : '›') + '</span>' : '';
      $('res').innerHTML = nav(-1, n0 > 0) + LR.slice(n0, n0 + VU).map(k => '<span class="r-' + k + '" data-tip="' + CG.RES[k].icon + ' ' + CG.RES[k].nom + '" data-sub="' + TIP[k] + '"><i>' + CG.RES[k].icon + '</i><b>' + Math.floor(r[k] || 0) + '</b></span>').join('') + nav(1, n0 + VU < LR.length) + '<span class="r-clan" data-tip="👥 Gobelins" data-sub="Ceux du clan / les places dans les huttes"><i>👥</i><b>' + S.goblins.length + '<small>/' + G.capacity() + '</small></b></span><span class="r-moral" data-tip="Moral" data-sub="Sous 50 %, plus personne ne vient s’installer"><i>' + mor + '</i><b>' + Math.round(S.morale) + '<small>%</small></b></span>';
      $('p-name').textContent = S.name + ' · niv. ' + p.lvl;
      $('bar-hp').style.width = (p.hp / p.maxhp * 100) + '%'; $('txt-hp').textContent = Math.ceil(p.hp) + ' / ' + p.maxhp + (R.shield > 0 ? '  🔮' + Math.ceil(R.shield) : '');
      $('bar-mp').style.width = (p.mp / p.maxmp * 100) + '%'; $('txt-mp').textContent = Math.floor(p.mp) + ' / ' + p.maxmp;
      $('bar-xp').style.width = (p.xp / G.xpNeed(p.lvl) * 100) + '%'; $('txt-xp').textContent = 'XP ' + Math.floor(p.xp + 1e-6) + ' / ' + G.xpNeed(p.lvl);
      { const Aq = CG.Alchimie && CG.Alchimie.svg ? CG.Alchimie : null, rouge = Aq ? Aq.svg('vie') : CG.Feu ? CG.Feu.FIOLE_SVG : '🧪', bleue = Aq ? Aq.svg('mana') : CG.Feu ? CG.Feu.FIOLE_SVG.replace('#d81e2c', '#1e6ad8').replace('#ff5a62', '#5aa8ff').replace('#5a1018', '#10285a') : '💧', /* le flacon change de forme avec le niveau du chaudron */ nm = (p.fioles && p.fioles.mana1) || 0; /* la fiole rouge (vie, Q) et la bleue (mana, Z) : on peut aussi cliquer dessus */
        $('potions').innerHTML = '<span class="po-b" data-po="vie" title="Boire une fiole de vie (Q)">' + rouge + ' <b>' + p.potions + '</b> <small>(Q)</small></span><span class="po-b" data-po="mana" title="Boire une fiole de mana (Z)">' + bleue + ' <b>' + nm + '</b> <small>(Z)</small></span>';
        if (!$('potions').dataset.clic) { $('potions').dataset.clic = '1'; $('potions').addEventListener('click', ev => { const b = ev.target.closest('[data-po]'); if (!b || !CG.S || !CG.running) return; if (b.dataset.po === 'vie') G.drinkPotion(); else if (G.drinkMana) G.drinkMana(); }); } }
      const tk = CG.Soc.tasks(); $('promises').style.display = tk.length ? '' : 'none'; $('promises').innerHTML = tk.map(k => '<div>📌 Promesse à <b>' + esc(k.from.name) + '</b> : aller parler à <b>' + esc(k.to.name) + '</b> <em>(avant la nuit)</em></div>').join('');
      $('tech-pts').textContent = S.tech.points ? '⭐' + S.tech.points : ''; $('btn-tech').classList.toggle('glow', CG.TECH.some(n => G.techAvail(n) && n.cout <= S.tech.points));
    }
    const pw = Object.keys(CG.POWERS).filter(k => G.tech(CG.TECH.find(n => n.power === k).id)), pcd = R.pcd || {};
    const sk = p.spells.join(',') + '|' + Object.keys(p.scrolls).length + '|' + Math.floor(p.mp) + '|' + pw.map(k => Math.ceil(pcd[k] || 0)).join(',') + G.tech('s8') + (CG.Meta ? CG.Meta.cle() : '') + (CG.Barre ? '|' + CG.Barre.cle() : '');
    if (sk !== lastSpells) {
      lastSpells = sk;
      const reste = pw.map(k => { const P = CG.POWERS[k], cd = Math.ceil(pcd[k] || 0); return '<div class="spell power' + (cd > 0 ? ' low' : '') + '" title="' + P.nom + '"><i>' + (P.key.length > 1 ? P.key : P.key.toUpperCase()) + '</i>' + P.icon + (cd > 0 ? '<u>' + cd + ' s</u>' : '') + '</div>'; }).join('') + (Object.keys(p.scrolls).length ? '<div class="spell new" title="Parchemin à copier (G)">📜</div>' : ''); $('spells').innerHTML = CG.Barre ? CG.Barre.html(reste) : p.spells.slice(0, 10).map((id, i) => { const sp = CG.SPELLS[id]; return '<div class="spell' + (p.mp < G.spellCost(id) ? ' low' : '') + '" title="' + esc(sp.nom + ' — ' + sp.desc) + '"><i>' + (i + 1) % 10 + '</i>' + sp.icon + '<u>' + G.spellCost(id) + '</u></div>'; }).join('') + reste;
      if (CG.Meta && CG.Meta.forme()) $('spells').innerHTML = CG.Meta.barre(); /* transformé : la barre devient celle de la créature (meta.js) */
    }
    const hEl = $('hint'), txt = hint ? hint : '';
    if (hEl.dataset.t !== txt) { hEl.dataset.t = txt; hEl.innerHTML = txt; hEl.style.display = txt ? '' : 'none'; }
    const b = R.banner, bEl = $('banner');
    if (b) { if (bEl.dataset.t !== b.txt + b.sub) { bEl.dataset.t = b.txt + b.sub; bEl.innerHTML = '<b style="color:' + b.col + '">' + esc(b.txt) + '</b><span>' + esc(b.sub) + '</span>'; } bEl.style.opacity = Math.min(1, b.t * 2); bEl.style.display = ''; }
    else if (bEl.style.display !== 'none') { bEl.style.display = 'none'; bEl.dataset.t = ''; }
  };

  // ---------- portraits ----------
  function portrait(draw) {
    const c = document.createElement('canvas'); c.width = 110; c.height = 110; c.className = 'portrait';
    const g = c.getContext('2d'); g.translate(55, 100); g.scale(2.3, 2.3); draw(g); return c;
  }
  const gobPortrait = g => portrait(c => CG.Art.goblin(c, { x: 0, y: 0, face: 1, t: 0.4, cls: g.cls || (g.nomme ? 'hob' : null), noHat: !g.hat, hatJob: g.hat, fun: g.fun, sex: g.sex, hue: g.hue, lum: g.lum, job: g.job, equip: g.equip, tool: null, look: g.look || (g.look = CG.Art8.randomLook(g)), evolved: !!g.nomme }));

  // ---------- dialogues ----------
  UI.open = open; // pour les fenêtres des autres fichiers (le chaudron, alchimie.js)
  UI.dialog = function (o) {
    if (!UI.modal || UI.modal.name !== 'dialog') CG.sfx('uiOpen');
    sync(); UI.modal = { name: 'dialog', closable: true, pauses: false }; keyHandlers = {}; CG.keys.clear();
    $('modal').hidden = true; const el = $('dialog'); el.hidden = false; R.talking = o.goblin || o.visitor || null; el.innerHTML = '';
    const pc = o.goblin ? gobPortrait(o.goblin) : o.visitor ? portrait(c => { const v = Object.assign({}, o.visitor, { x: 0, y: 0, face: 1, moving: false, seed: 0 }); const z = { seigneur: 0.56, demon: 0.66, elfe: 0.72, demonMarchand: 0.72 }[v.look] || 0.8; c.scale(z, z); if (v.look === 'animal') { c.translate(0, CG.P.KINDS[v.kind].fly ? 14 : -4); c.scale(v.evo ? 1.0 : 1.5, v.evo ? 1.0 : 1.5); } CG.Art.visitor(c, v, 0.4); }) : null;
    if (pc) el.appendChild(pc);
    const body = document.createElement('div'); body.className = 'dbody';
    body.innerHTML = '<h3>' + esc(o.who) + (o.tag ? ' <small>' + o.tag + '</small>' : '') + '</h3><p>' + esc(o.text) + '</p>' + (o.extra || '');
    const opts = document.createElement('div'); opts.className = 'opts' + (o.grid ? ' grid' : '');
    const choix = o.options ? o.options.filter(x => x && !x.echap).concat(o.options.filter(x => x && x.echap)) : [{ label: 'Au revoir' }]; /* la réponse pressée (Échap) est toujours la dernière */
    choix.forEach((op, i) => {
      const b = document.createElement('button'); b.disabled = !!op.disabled; if (op.active) b.className = 'active';
      if (op.echap) b.classList.add('echap'); b.innerHTML = (op.echap ? '<i class="ech">Échap</i> ' : i < 9 ? '<i>' + (i + 1) + '</i> ' : '') + esc(op.label) + (op.sub && (op.disabled || op.active || o.infos) ? '<small>' + esc(op.sub) + '</small>' : ''); /* on ne dit plus d'avance ce que chaque réponse va faire : seulement pourquoi un choix est grisé, ou ce qui est déjà en place */
      const go = () => {
        if (op.disabled) return CG.sfx('no');
        if (!op.fn) return UI.dismiss();
        UI.close(); op.fn();
        if (!UI.modal) CG.sfx('ok');
      };
      b.onclick = go; keyHandlers[String(i + 1)] = go; if (op.echap) keyHandlers.Escape = go; /* la réponse pressée : Échap la choisit */ opts.appendChild(b);
    });
    body.appendChild(opts); el.appendChild(body);
  };
  // la première rencontre : deux petites phrases (son nom, ce qu'il aime), et on lui souhaite la bienvenue
  UI.rencontre = function (g) {
    sync(); if (!g.look && CG.Art8 && CG.Art8.randomLook) g.look = CG.Art8.randomLook(g); const P = G.introParts(g), elle = g.sex === 'f';
    UI.dialog({ goblin: g, who: g.name, tag: (elle ? '♀' : '♂') + ' · première rencontre' + (G.gourmand(g) ? ' · 🍖 gros appétit : mange pour deux' : ''), text: P.salut + ' ' + (g.child ? P.origine : P.aime),
      options: [{ label: '🤝 Bienvenue dans le clan, ' + g.name + ' !', fn: () => { g.met = true; G.addXp(4); S.morale = Math.min(100, S.morale + 1); G.text(g.x, g.y - 46, '❤️', '#fff'); UI.talkGoblin(g); } }] });
  };
  UI.talkGoblin = function (g) {
    sync(); const job = CG.JOBS[g.job];
    if (!g.met) return UI.rencontre(g); // première rencontre : un bonjour, et c'est le chef qui pose les questions
    const ps = G.perso(g), il = g.sex === 'f' ? 'elle' : 'lui';
    const pool = R.alarm ? CG.LINES.peur : G.partyTime() ? CG.LINES.soir : (S.morale < 35 && Math.random() < 0.6) ? CG.LINES.faim : CG.LINES[g.job];
    const eq = Object.keys(g.equip).map(k => CG.CRAFTS[k].icon).join(' ');
    const tag = (g.sex === 'f' ? '♀ ' + job.nomF : '♂ ' + job.nom) + (g.nomme ? ' · 🏷️ nommé' + (g.sex === 'f' ? 'e' : '') : '') + ' · niv. ' + g.lvl + ' · ❤ ' + Math.ceil(g.hp) + '/' + G.gobMaxHp(g) + (eq ? ' · ' + eq : '') + ' · ' + G.persoNom(g);
    const line = !R.alarm && !G.partyTime() && Math.random() < 0.4 ? CG.pick(ps.salut) : CG.pick(pool);
    UI.dialog({ goblin: g, who: g.name, tag, text: line.replace(/\{e\}/g, g.sex === 'f' ? 'e' : ''), options: CG.Soc.taskOpt(g).concat([
      { label: '🛠 Modifier le travail', sub: 'En ce moment : ' + job.icon + ' ' + (g.sex === 'f' ? job.nomF : job.nom), fn: () => UI.jobDialog(g) },
    ].concat(job.craft ? [{ label: '⚒️ Son atelier', sub: 'Que faire des ' + PLUR[job.craft] + ' qu\'' + (g.sex === 'f' ? 'elle' : 'il') + ' fabrique' + (g.job === 'forgeron' ? ', améliorer ton arme' : g.job === 'tanneur' ? ', renforcer ton armure' : ''), fn: () => UI.atelier(g) }] : [], [
      { label: '💬 Discuter', sub: R.alarm ? 'Pas pendant une attaque !' : 'Jaser un peu avec ' + il + ' : bien choisir tes mots lui donne du cœur à l\'ouvrage', disabled: !!R.alarm, fn: () => CG.Soc.chat(g) }].concat(G.nameOpt(g), CG.Evo ? CG.Evo.opt(g) : [], CG.Mode ? CG.Mode.opt(g) : [], [
      { label: '👋 Au revoir' }]))) });
  };
  // l'atelier de l'artisan : ce qu'on fait de ses objets, et l'équipement du chef
  const PLUR = { epee: 'épées', arc: 'arcs', armure: 'armures de cuir' };
  UI.atelier = function (g) {
    sync(); const job = CG.JOBS[g.job], k = job.craft; if (!k) return UI.talkGoblin(g);
    const c = CG.CRAFTS[k], p = S.player, n = S.goblins.filter(o => o.equip[k]).length, again = () => UI.atelier(g);
    const opts = [
      { label: '🛡️ Équiper les gardes', sub: n + ' gobelin(s) équipé(s) · quand tous les gardes en ont, le surplus est vendu', active: S.policy[k] === 'equiper', fn: () => { S.policy[k] = 'equiper'; G.say(g, 'Compris, chef : pour les gardes d\'abord !', 3); again(); } },
      { label: '🪙 Tout vendre', sub: 'Chaque objet rapporte ' + c.prix + ' 🪙', active: S.policy[k] === 'vendre', fn: () => { S.policy[k] = 'vendre'; G.say(g, 'D\'accord, chef : tout part au marché !', 3); again(); } }];
    if (g.job === 'forgeron') { const wc = { minerai: 6 + 4 * p.weapon, or: 15 + 15 * p.weapon }; opts.push({ label: '🗡️ Améliorer mon arme (+' + p.weapon + ' → +' + (p.weapon + 1) + ')', sub: '+3 dégâts · coûte ' + Object.keys(wc).map(r => wc[r] + ' ' + CG.RES[r].icon).join(' '), disabled: !G.canPay(wc), fn: () => { if (!G.canPay(wc)) return; G.pay(wc); p.weapon++; CG.sfx('build'); G.say(g, 'Voilà, chef ! Elle coupe un cheveu en quatre.', 3.5); again(); } }); }
    if (g.job === 'tanneur') { const ac = { cuir: 5 + 3 * p.armor, or: 12 + 12 * p.armor }; opts.push({ label: '🛡️ Renforcer mon armure (+' + p.armor + ' → +' + (p.armor + 1) + ')', sub: p.armor >= 7 ? 'Elle ne peut pas être plus solide' : '-8 % de dégâts reçus · coûte ' + Object.keys(ac).map(r => ac[r] + ' ' + CG.RES[r].icon).join(' '), disabled: p.armor >= 7 || !G.canPay(ac), fn: () => { if (!G.canPay(ac) || p.armor >= 7) return; G.pay(ac); p.armor++; CG.sfx('build'); G.say(g, 'Cousu main, chef. Ça arrête une flèche !', 3.5); again(); } }); }
    opts.push({ label: '↩ Retour', fn: () => UI.talkGoblin(g) });
    UI.dialog({ goblin: g, who: g.name, tag: '⚒️ atelier · ' + c.icon + ' ' + c.nom + ' (' + c.effet + ')', text: 'Qu\'est-ce que je fais de mes ' + PLUR[k] + ', chef ?', options: opts });
  };
  UI.jobDialog = function (g) {
    sync(); const job = CG.JOBS[g.job];
    UI.dialog({
      goblin: g, who: g.name, tag: (g.sex === 'f' ? '♀ ' + job.nomF : '♂ ' + job.nom) + ' · niv. ' + g.lvl + ' · ' + G.persoNom(g),
      text: 'Tu veux me confier un autre travail, chef ?', extra: '<p class="ask">Quel métier veux-tu lui donner ?</p>', grid: true,
      options: CG.jobsAvail().map(id => ({ label: CG.JOBS[id].icon + ' ' + (g.sex === 'f' ? CG.JOBS[id].nomF : CG.JOBS[id].nom) + aptMark(g, id), sub: (CG.jobManque && id !== g.job && CG.jobManque(id, g)) || aptNote(g, id).trim(), disabled: !!(CG.jobOk && id !== g.job && !CG.jobOk(id, g)), active: id === g.job, fn: () => UI.setJob(g, id) }))
    });
  };
  const aptMark = (g, j) => { if (!G.seeApt()) return ''; const a = G.apt(g, j); return a >= 1.3 ? ' ⭐⭐' : a > 1 ? ' ⭐' : a <= 0.6 ? ' 👎👎' : a < 1 ? ' 👎' : ''; };
  const aptNote = (g, j) => { if (!G.seeApt()) return ''; const a = G.apt(g, j); return a >= 1.3 ? 'Très doué (+40 %). ' : a > 1 ? 'Doué (+20 %). ' : a <= 0.6 ? 'Vraiment pas fait pour ça (-40 %). ' : a < 1 ? 'Pas très bon (-25 %). ' : ''; };
  UI.setJob = function (g, id) {
    if (g.job === id) return;
    if (CG.jobOk && !CG.jobOk(id, g)) { CG.sfx('no'); UI.toast('🔒 ' + CG.jobManque(id, g) + '.'); return; }
    if (g.cls === 'loup') { UI.toast('🐺 ' + g.name + ' ne quittera pas sa meute pour un autre métier.'); return; }
    // l'expérience appartient au métier : on range celle de l'ancien, on reprend celle du nouveau
    g.jobs = g.jobs || {}; g.jobs[g.job] = { lvl: g.lvl, xp: g.xp }; const sv = g.jobs[id] || { lvl: 1, xp: 0 }; g.lvl = sv.lvl; g.xp = sv.xp;
    g.job = id; G.resetGoblin(g); g.hp = Math.min(g.hp, G.gobMaxHp(g));
    G.text(g.x, g.y - 46, CG.JOBS[id].icon + ' ' + (g.sex === 'f' ? CG.JOBS[id].nomF : CG.JOBS[id].nom), '#ffe36b');
  };

  // ---------- boutique ----------
  UI.shop = function (v, def) {
    const render = () => {
      const p = S.player;
      let h = '<h2>' + esc(def.nom) + '</h2><p class="quote">« ' + esc(def.hello) + ' »</p><div class="gold">Ta bourse : 🪙 ' + Math.floor(S.res.or) + '</div><h4>À vendre</h4><div class="list">';
      v.shop.forEach((it, i) => {
        const known = it.scroll && (p.spells.includes(it.scroll) || p.scrolls[it.scroll]);
        const off = it.stock <= 0 || known || S.res.or < it.prix;
        h += '<div class="row"><span class="ic">' + it.icon + '</span><div><b>' + esc(it.label) + '</b><small>' + esc(it.desc) + '</small></div><button data-buy="' + i + '"' + (off ? ' disabled' : '') + '>' + (it.stock <= 0 ? 'Vendu' : known ? 'Déjà connu' : it.prix + ' 🪙') + '</button></div>';
      });
      h += '</div>';
      if (v.sells) { h += '<h4>Il t\'achète</h4><div class="list">'; D.sellList.forEach((s, i) => { h += '<div class="row"><span class="ic">' + CG.RES[s.res].icon + '</span><div><b>' + s.n + ' × ' + CG.RES[s.res].nom + '</b><small>Tu en as ' + Math.floor(S.res[s.res]) + '</small></div><button data-sell="' + i + '"' + (S.res[s.res] < s.n ? ' disabled' : '') + '>+' + s.or + ' 🪙</button></div>'; }); h += '</div>'; }
      h += '<div class="foot"><button id="x-close">Au revoir (Échap)</button></div>';
      open('shop', h); $('x-close').onclick = UI.dismiss;
      $('panel').querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const it = v.shop[+b.dataset.buy]; if (S.res.or < it.prix || it.stock <= 0) return; S.res.or -= it.prix; it.stock--; if (it.scroll) { p.scrolls[it.scroll] = 1; UI.toast('📜 ' + CG.SPELLS[it.scroll].nom + ' acheté. Ouvre ton grimoire (G) pour le copier.'); } else it.buy(); CG.sfx('achat'); render(); });
      $('panel').querySelectorAll('[data-sell]').forEach(b => b.onclick = () => { const s = D.sellList[+b.dataset.sell]; if (S.res[s.res] < s.n) return; S.res[s.res] -= s.n; S.res.or += s.or; R.dayStats.or += s.or; CG.sfx('coin'); render(); });
    };
    sync(); render(); R.talking = v;
  };

  // ---------- village ----------

  // ---------- grimoire ----------
  // ---------- le grimoire : un vrai livre qu'on feuillette. Première double page : la sélection (touches 1 à 9, puis 0) et le mage ; ensuite, une page par sort. ----------
  const GR_NOTES = {
    etincelle: 'Ma toute première. J\'ai roussi mes sourcils trois fois.', feu: 'Ne JAMAIS lancer dans la hutte. Jamais.', soin: 'Ça chatouille. Les gobelins en redemandent.', racines: 'Marche aussi sur les belles-mères, paraît-il.',
    glace: 'Garder la bouche fermée en soufflant. Leçon apprise.', bouclier: 'Solide, mais ça n\'arrête pas la honte.', eclair: 'Compter les ennemis avant. Pas pendant.', illusion: 'Même moi j\'ai eu peur la première fois.',
    retour: 'Pour les jours où mes jambes disent non.', cri: 'Prévenir les voisins. Ou pas.', murfeu: 'Excellent pour les grillades, aussi.', meteore: 'Viser LOIN du village. Très loin.', vision: 'On voit tout. Même ce qu\'on ne voulait pas.',
    caboche: 'Aucune utilité. Je l\'adore.', charme: 'Il devient gentil. Ça ne dure pas, profites-en.', golem: 'Ne parle pas beaucoup. Parfait compagnon.', hate: 'Attention aux arbres. Ils ne bougent pas, eux.',
    invisible: 'Idéal pour éviter les questions du clan.', onde: 'Tout le monde recule. Même la soupe.', repousse: 'Le bûcheron me doit une fière chandelle.', sommeil: 'Testé sur le clan un soir de fête. Chut.',
    teleport: 'Vérifier où l\'on regarde. J\'ai fini dans la marmite.', electro: 'Ne pas serrer la main des amis pendant.', verglas: 'Testé sur le forgeron. Il m\'en veut encore.', resurrection: 'À ne pas gaspiller sur le chat. Quoique.', cigogne: 'Prévoir des huttes. Beaucoup de huttes.', ombres: 'Si ça bouge dans le noir, c\'est rarement un ami.', poison: 'Ne pas respirer. Ça semble évident, et pourtant.', faucon: 'Cinq secondes de pur génie.', parefeu: 'Sentir le lézard grillé, c\'est normal.'
  };
  const GR_RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊ';
  const grArt = (id, sp) => {
    const c = sp.color || '#b98cff'; let runes = '', rays = '';
    for (let i = 0; i < 16; i++) runes += '<text x="0" y="-68" transform="rotate(' + i * 22.5 + ')" class="rn">' + GR_RUNES[(i + id.length * 3) % GR_RUNES.length] + '</text>';
    for (let i = 0; i < 24; i++) rays += '<line x1="0" y1="-88" x2="0" y2="' + (i % 2 ? -94 : -99) + '" transform="rotate(' + i * 15 + ')"/>';
    const star = n => { let d = ''; for (let i = 0; i < n; i++) { const a = (i * (n === 7 ? 3 : 2) / n) * Math.PI * 2 - Math.PI / 2; d += (i ? 'L' : 'M') + (Math.cos(a) * 56).toFixed(1) + ' ' + (Math.sin(a) * 56).toFixed(1); } return d + 'Z'; };
    return '<svg class="gr-art" viewBox="-104 -104 208 208"><defs><radialGradient id="gra-' + id + '"><stop offset="0" stop-color="' + c + '" stop-opacity="0.85"/><stop offset="0.55" stop-color="' + c + '" stop-opacity="0.32"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient></defs>'
      + '<circle r="102" fill="url(#gra-' + id + ')"/><g class="ray" stroke="' + c + '">' + rays + '</g><circle r="86" class="ink"/><circle r="80" class="ink dash"/><circle r="58" class="ink"/>' + runes
      + '<path d="' + star(id.length % 2 ? 7 : 5) + '" class="ink star" stroke="' + c + '"/><circle r="36" fill="#f8ebc6" stroke="#5a2410" stroke-width="2"/><circle r="36" fill="' + c + '" opacity="0.2"/>'
      + '<text y="2" class="em">' + sp.icon + '</text><circle cx="62" cy="-62" r="3" fill="' + c + '"/><circle cx="-70" cy="48" r="2.2" fill="' + c + '"/><circle cx="74" cy="40" r="1.8" fill="#5a2410"/></svg>';
  };
  const grKey = i => (i >= 0 && i < 10 ? String((i + 1) % 10) : '');
  // le cercle d'un sort (1, le plus faible, à 9, le plus fort) : sa puissance, d'après la valeur de son parchemin
  const GR_SEUILS = [420, 500, 600, 750, 900, 1100, 1400, 1800], GR_FIXE = { mondes: 6, hate: 5, teleport: 4 }; /* Pieds de vent : bien trop utile pour un petit cercle */
  const GR_NOMS = ['', 'Les premiers mots', 'Les tours d\'apprenti', 'Les sorts de bataille', 'La magie du mage', 'Les secrets du sorcier', 'Les arts interdits', 'La haute magie', 'Les sorts de légende', 'La magie des dieux'];
  const grCercle = id => { const fixe = CG.CerclesPrix && CG.CerclesPrix.cercle(id); if (fixe) return fixe; /* le cercle écrit dans cerclesprix.js passe avant tout */ if (GR_FIXE[id]) return GR_FIXE[id]; const v = (CG.SPELLS[id] || {}).prix || 0; let c = 1; while (c < 9 && v > GR_SEUILS[c - 1]) c++; return c; };
  CG.cercle = grCercle;
  let grPage = 0;
  UI.grimoire = function (page) {
    sync(); const p = S.player, sc = Object.keys(p.scrolls), n = p.spells.length, CS = CG.Barre && CG.Barre.cases ? CG.Barre.cases() : p.spells; /* les cases de la barre : c'est elles qui portent les touches */
    // les pages ne bougent jamais : du premier cercle au neuvième, quel que soit l'ordre des touches. Chaque cercle s'ouvre sur sa page de garde.
    const livre = p.spells.slice().sort((a, b) => grCercle(a) - grCercle(b) || CG.SPELLS[a].prix - CG.SPELLS[b].prix || CG.SPELLS[a].nom.localeCompare(CG.SPELLS[b].nom));
    const feuilles = []; { let c0 = 0; livre.forEach(id => { const c = grCercle(id); if (c !== c0) { c0 = c; feuilles.push({ c }); } feuilles.push({ id }); }); }
    const spreads = 2 + Math.ceil(feuilles.length / 2), pageDe = k => 2 + Math.floor(k / 2), /* la 2e double page : la table des matières */ pageSort = id => pageDe(feuilles.findIndex(f => f.id === id)), pageCercle = c => pageDe(feuilles.findIndex(f => f.c === c));
    const onglets = feuilles.filter(f => f.c).map(f => '<button class="gr-ong" data-go="' + pageCercle(f.c) + '" title="' + GR_NOMS[f.c] + '">' + f.c + '</button>').join('');
    if (page !== undefined) grPage = page; grPage = CG.clamp(grPage, 0, spreads - 1);
    const foot = (num, side) => '<div class="gr-num">' + (side === 'l' && grPage > 0 ? '<button class="gr-nav prec" data-go="' + (grPage - 1) + '" title="Page précédente (←)"><b>❮</b></button>' : '<i></i>') + '<span>— ' + num + ' —</span>' + (side === 'r' && grPage < spreads - 1 ? '<button class="gr-nav suiv" data-go="' + (grPage + 1) + '" title="Page suivante (→)"><b>❯</b></button>' : '<i></i>') + '</div>';
    let h = '<div class="gr-book">';
    if (grPage === 0) {
      // --- page de gauche : la sélection
      h += '<div class="gr-page l"><h2 class="gr-h">Grimoire de ' + esc(S.name) + '</h2><div class="gr-orn">✦</div><div class="gr-sub">Ma sélection — touches 1 à 9, puis 0</div><div class="gr-slots" id="gr-slots">';
      for (let i = 0; i < 10; i++) { const id = CS[i], sp = id && CG.SPELLS[id]; h += sp ? '<div class="gr-slot" data-i="' + i + '" title="' + esc(sp.nom) + '"><span class="gr-key">' + grKey(i) + '</span><span class="gr-ic">' + sp.icon + '</span><div class="gr-tx"><b>' + sp.nom + '</b><small>' + G.spellCost(id) + ' mana</small></div></div>' : '<div class="gr-slot vide" data-i="' + i + '"><span class="gr-key">' + grKey(i) + '</span><em>page blanche</em></div>'; }
      h += '</div><p class="gr-note">' + (n ? 'Clique un sort pour ouvrir sa page. Glisse-le sur une autre touche pour les échanger.' + (n > 10 ? ' ' + (n - 10) + ' autre' + (n - 10 > 1 ? 's sorts t\'attendent' : ' sort t\'attend') + ' dans les pages suivantes.' : '') : 'Les pages sont encore blanches. Pour l\'instant, tu n\'as que ton bâton (Espace) : trouve un parchemin pour apprendre ton premier sort.') + '</p>' + foot('I', 'l') + '</div>';
      // --- page de droite : le mage et son sac
      h += '<div class="gr-page r"><h2 class="gr-h">Le mage</h2><div class="gr-orn">✦</div><div class="gr-stats"><span>Niveau <b>' + p.lvl + '</b></span><span>⚔️ Dégâts <b>' + Math.round(G.playerDmg()) + '</b></span><span>🛡️ Armure <b>+' + p.armor + '</b></span><span>✨ Sorts <b>×' + (1 + 0.12 * (p.lvl - 1)).toFixed(2) + '</b></span><span>🧪 Fioles <b>' + p.potions + '</b></span><span>💧 Mana <b>+' + (+G.manaRegen().toFixed(1)) + '/s</b></span><span>📖 Sorts connus <b>' + n + '</b></span><span>📜 Parchemins <b>' + sc.length + '</b></span></div>';
      h += '<button class="gr-t-ouvre" data-go="1">📑 Table des matières</button>';
      if (onglets) h += '<div class="gr-sub">Cercles de magie</div><div class="gr-ongs">' + onglets + '</div>';
      h += '<div class="gr-sub">Parchemins dans ton sac</div><div class="gr-scroll">';
      if (!sc.length) h += '<p class="gr-note">Aucun parchemin pour l\'instant.</p>';
      sc.forEach(id => { const sp = CG.SPELLS[id]; h += '<div class="gr-sp"><span class="gr-ic sc">📜</span><div class="gr-tx"><b>' + sp.nom + '</b><small>Cercle de magie ' + grCercle(id) + '</small></div><button class="gr-copy" data-copy="' + id + '"' + (S.res.or < G.copyCost(id) ? ' disabled title="Pas assez d\'or"' : '') + '>✍️ Copier (' + G.copyCost(id) + ' 🪙)</button></div>'; });
      h += '</div><p class="gr-note">Un parchemin copié disparaît, mais le sort reste à toi pour toujours.</p>' + foot('II', 'r') + '</div>';
    } else if (grPage === 1) {
      // --- la table des matières : tous les cercles et tous les sorts sur une seule double page (chaque liste défile dans sa page : le livre garde sa hauteur)
      const numDe = x => pageSort(x) * 2 + (feuilles.findIndex(q => q.id === x) % 2) + 1, cercles = feuilles.filter(f => f.c).map(f => f.c);
      /* jamais d'ascenseur : le numéro du cercle se met à gauche de ses sorts (aucune ligne perdue), trois colonnes dès qu'il y a beaucoup de sorts, et tout rétrécit s'il le faut (voir plus bas) */
      const cols = livre.length > 24 ? 3 : 2;
      const bloc = c => '<div class="gr-t-rang"><button class="gr-t-cercle" data-go="' + pageCercle(c) + '" title="Cercle ' + c + ' : ' + GR_NOMS[c] + '"><span>' + c + '</span></button><div class="gr-t-liste c' + cols + '">' + livre.filter(x => grCercle(x) === c).map(x => '<button class="gr-t-sort" data-go="' + pageSort(x) + '" title="' + esc(CG.SPELLS[x].nom) + ' (page ' + numDe(x) + ')"><span>' + CG.SPELLS[x].icon + '</span><b>' + CG.SPELLS[x].nom + '</b>' + (cols < 3 ? '<i>' + numDe(x) + '</i>' : '') + '</button>').join('') + '</div></div>';
      const poids = c => 0.35 + Math.ceil(livre.filter(x => grCercle(x) === c).length / cols), P = cercles.map(poids), total = P.reduce((a, b) => a + b, 0); let coupe = 0, mieux = Infinity, acc = 0;
      P.forEach((v, i) => { acc += v; const d = Math.abs(total - 2 * acc); if (d < mieux) { mieux = d; coupe = i + 1; } }); /* la coupure qui équilibre le mieux les deux pages */ const gauche = cercles.slice(0, coupe), droite = cercles.slice(coupe);
      h += '<div class="gr-page l tdm"><h2 class="gr-h">Table des matières</h2><div class="gr-orn">✦</div><div class="gr-t-corps"><div class="gr-t-in">' + (cercles.length ? gauche.map(bloc).join('') : '<p class="gr-note">Aucun sort pour l\'instant. Trouve un parchemin et copie-le : il apparaîtra ici.</p>') + '</div></div>' + foot(3, 'l') + '</div>';
      h += '<div class="gr-page r tdm"><h2 class="gr-h">' + (n ? n + ' sort' + (n > 1 ? 's' : '') : 'Pages blanches') + '</h2><div class="gr-orn">✦</div><div class="gr-t-corps"><div class="gr-t-in">' + droite.map(bloc).join('') + '</div></div>' + foot(4, 'r') + '</div>';
    } else {
      // --- une page par sort
      [0, 1].forEach(k => {
        const f = feuilles[(grPage - 2) * 2 + k] || {}, id = f.id, i = id ? CS.indexOf(id) : -1, sp = id && CG.SPELLS[id], side = k ? 'r' : 'l', num = grPage * 2 + k + 1;
        if (f.c) { // la page de garde d'un cercle : son numéro, son nom, et ses sorts (un clic ouvre la page du sort)
          const les = livre.filter(x => grCercle(x) === f.c);
          h += '<div class="gr-page ' + side + ' garde"><div class="gr-g-haut">Cercle de magie</div><div class="gr-g-num"><span>' + f.c + '</span></div><div class="gr-g-nom">' + GR_NOMS[f.c] + '</div><div class="gr-orn">✦</div><div class="gr-g-liste">'
            + les.map(x => '<button class="gr-g-sort" data-go="' + pageSort(x) + '"><span>' + CG.SPELLS[x].icon + '</span><b>' + CG.SPELLS[x].nom + '</b><i>p. ' + (pageSort(x) * 2 + (feuilles.findIndex(q => q.id === x) % 2) + 1) + '</i></button>').join('') + '</div>' + foot(num, side) + '</div>'; return; }
        if (!sp) { h += '<div class="gr-page ' + side + ' blanche"><div class="gr-vide"><span>✒️</span><p>Page blanche.<br>Un sort attend quelque part d\'y être écrit...</p></div>' + foot(num, side) + '</div>'; return; }
        let keys = ''; for (let j = 0; j < 10; j++) keys += '<button class="gr-kb' + (j === i ? ' on' : '') + '" data-set="' + i + ':' + j + '" title="' + (CS[j] && j !== i ? 'Échanger avec ' + esc(CG.SPELLS[CS[j]].nom) : 'Touche ' + grKey(j)) + '">' + grKey(j) + '</button>';
        h += '<div class="gr-page ' + side + ' sort"><h2 class="gr-h">' + sp.nom + '</h2><div class="gr-orn"><button class="gr-versc" data-go="' + pageCercle(grCercle(id)) + '" title="Voir tout le cercle ' + grCercle(id) + '">Cercle ' + grCercle(id) + '</button></div>' + grArt(id, sp)
          + '<div class="gr-meta"><span>💧 <b>' + G.spellCost(id) + '</b> mana</span><span>📜 vaut <b>' + sp.prix + '</b> 🪙</span></div>' + (CG.Effets ? CG.Effets.fiche(id) : '')
          + '<p class="gr-desc">' + (CG.SortsDesc ? CG.SortsDesc.livre(id) : sp.desc) + '</p>' + (GR_NOTES[id] ? '<p class="gr-marge">« ' + GR_NOTES[id] + ' »</p>' : '')
          + '<div class="gr-place"><span>Placer sur la touche</span><div>' + keys + '</div></div>' + foot(num, side) + '</div>';
      });
    }
    h += '<span class="gr-ribbon"></span>' + (grPage ? '<button class="gr-home' + (grPage > 1 ? ' deux' : '') + '" data-go="0" title="Retour à ma sélection">⌂ Sélection</button>' : '') + (grPage > 1 ? '<button class="gr-home deux tdm" data-go="1" title="Tous les sorts sur une double page">📑 Table</button>' : '') + '<button class="gr-close" id="x-close" title="Fermer (G)">✕</button></div>';
    open('grimoire', h, true, true); $('panel').className = 'grim'; $('modal').classList.add('flou'); $('x-close').onclick = UI.dismiss;
    $('panel').querySelectorAll('.gr-t-corps').forEach(c => { const d = c.firstElementChild; if (!d || !c.clientHeight || d.offsetHeight <= c.clientHeight) return; const k = Math.max(0.5, c.clientHeight / d.offsetHeight); d.style.width = (100 / k) + '%'; d.style.transform = 'scale(' + k + ')'; }); /* la table des matières ne défile jamais : si elle dépasse, elle rétrécit */
    const P = $('panel'), go = pg => { if (pg < 0 || pg >= spreads || pg === grPage) return; CG.sfx('page'); UI.grimoire(pg); };
    P.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(+b.dataset.go));
    keyHandlers.ArrowRight = () => go(grPage + 1); keyHandlers.ArrowLeft = () => go(grPage - 1);
    P.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => { const id = b.dataset.copy, prix = G.copyCost(id); if (S.res.or < prix) { CG.sfx('no'); return UI.toast('Il te faut ' + prix + ' 🪙 d\'encre et de parchemin pour copier ce sort.'); } S.res.or -= prix; delete p.scrolls[id]; p.spells.push(id); CG.sfx('page'); CG.sfx('level'); UI.toast('✨ ' + CG.SPELLS[id].nom + ' est copié dans ton grimoire. ' + (p.spells.length <= 10 ? 'Touche ' + grKey(p.spells.length - 1) + ' pour le lancer.' : 'Ouvre sa page pour le placer sur une touche.')); UI.grimoire(); });
    // changer un sort de touche : il échange sa place avec celui qui s'y trouve (ou va au bout de la sélection si la touche est libre)
    const echange = (a, b) => { if (a === b || a < 0 || !CS[a]) return false; while (CS.length <= Math.max(a, b)) CS.push(null); const t = CS[a]; CS[a] = CS[b] || null; CS[b] = t; CG.sfx('page'); return b; };
    P.querySelectorAll('[data-set]').forEach(b => b.onclick = () => { const [a, j] = b.dataset.set.split(':').map(Number); if (echange(a, j) !== false) UI.grimoire(grPage); }); // on reste sur la même page
    // la page de sélection : un clic ouvre la page du sort, un glisser l'échange avec une autre touche
    P.querySelectorAll('.gr-slot:not(.vide)').forEach(el => {
      el.onpointerdown = e => {
        if (e.button) return; const x0 = e.clientX, y0 = e.clientY, i = +el.dataset.i; let on = false;
        const move = ev => { if (!on) { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return; on = true; el.classList.add('drag'); try { el.setPointerCapture(e.pointerId); } catch (er) { /* tant pis */ } }
          const z = el.getBoundingClientRect().width / el.offsetWidth || 1; el.style.transform = 'translate(' + (ev.clientX - x0) / z + 'px,' + (ev.clientY - y0) / z + 'px) rotate(-1.5deg)';
          el.style.pointerEvents = 'none'; const o = document.elementFromPoint(ev.clientX, ev.clientY), t = o && o.closest('.gr-slot'); el.style.pointerEvents = ''; P.querySelectorAll('.gr-slot.vise').forEach(q => q.classList.remove('vise')); if (t && t !== el) t.classList.add('vise'); };
        const up = ev => {
          window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
          if (!on) return go(pageSort(CS[i]));
          el.style.pointerEvents = 'none'; const o = document.elementFromPoint(ev.clientX, ev.clientY), t = o && o.closest('.gr-slot'); el.style.pointerEvents = '';
          if (t && t !== el) echange(i, +t.dataset.i); UI.grimoire(0);
        };
        window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
      };
    });
  };

  UI.help = function () {
    const cap = a => a.split(' ').map(x => x === '/' || x === 'à' || x === 'sur' ? '<em>' + (x === '/' ? 'ou' : x) + '</em>' : '<span class="keycap">' + x + '</span>').join('');
    const k = (a, b) => '<div class="ai-k"><div class="ai-keys">' + cap(a) + '</div><div>' + b + '</div></div>', hd = t => '<div class="ai-h">' + t + '</div>', tip = (ic, t) => '<div class="ai-tip"><i>' + ic + '</i><div>' + t + '</div></div>';
    open('help', '<div class="ai-board"><div class="ai-title">❓ Comment jouer</div><button class="ai-close" id="x-close" title="Fermer (H)">✕</button><div class="ai-cols"><div class="ai-page">' +
      hd('Bouger et se battre') + k('W A S D / ← ↑ ↓ →', 'Se déplacer') + k('Maj', 'Courir, une fois le pouvoir appris') + k('Espace / Clic', 'Frapper avec ton bâton') + k('1 à 9', 'Lancer un sort du grimoire') + k('Q', 'Boire une potion de vie') +
      hd('Diriger le village') + k('E', 'Parler, ouvrir un coffre, dormir, bâtir') + k('E sur Artisan', 'Son atelier : vendre, équiper, améliorer ton arme') + k('B', 'Construire : choisis en bas, clique sur le terrain') + k('R', 'Tourner la construction avant de la poser') +
      hd('Les fenêtres') + k('G', 'Grimoire : sorts et parchemins') + k('T', 'Arbre des technologies') + k('C', 'Carte des alentours') + k('P', 'Pause : la seule fenêtre qui arrête le temps') + k('M', 'Couper / remettre tout le son') +
      '</div><div class="ai-page">' + hd('Ton rôle de chef') +
      tip('🛠️', '<b>Donne un métier</b> à chaque gobelin : va lui parler avec E.') +
      tip('🍖', 'Il faut <b>3 🍖 par gobelin</b> pour la fête du soir. Sans nourriture, le moral chute.') +
      tip('🌙', 'Le soir, va à <b>ta hutte de chef</b> (E) pour dormir et passer au lendemain.') +
      tip('🪓', 'Les bûcherons font <b>reculer la forêt</b> : plus de place pour bâtir.') +
      tip('🔨', 'Les bricoleurs <b>bâtissent et réparent</b>. Réparer coûte un peu de bois.') +
      tip('🛡️', 'Pendant une attaque, <b>seuls toi et tes gardes</b> vous battez. Une tour de guet ne tire que si un garde y monte.') +
      tip('❤️', '<b>Ta vie ne remonte pas toute seule</b> : hutte de guérisseur, potions (Q), ou une nuit de sommeil. Si tu meurs, c\'est fini.') +
      tip('📜', 'Copie un <b>parchemin</b> dans ton grimoire (G) pour connaître le sort à jamais. L\'encre coûte de l\'or.') +
      tip('🌳', 'Chaque niveau te donne <b>2 points</b> jusqu\'au niveau 3, puis <b>de 1 à 5 points</b>, au hasard, à dépenser dans l\'arbre des technologies (T).') +
      tip('🧭', '<b>Explore les alentours</b> : la forêt cache bien des choses.') +
      tip('⚔️', 'Chaque jour, les attaques deviennent <b>plus dures</b>. Arme tes gardes !') +
      '</div></div></div>', true, true);
    $('panel').className = 'aide'; $('modal').classList.add('flou'); $('x-close').onclick = UI.dismiss;
  };
  // ---------- qui habite cette hutte ? ----------
  UI.hut = function (b) {
    sync(); const i = S.buildings.indexOf(b), res = S.goblins.filter(g => g.home === i), cap = G.hutCap(), lv = Math.min(2, b.up || 0);
    let h = '<h2>' + ['🛖 Hutte', '🏡 Maison de pierre', '🏰 Maison de métal'][lv] + '</h2><div class="chips"><span>Habitants <b>' + res.length + ' / ' + cap + '</b></span><span>Places du village <b>' + S.goblins.length + ' / ' + G.capacity() + '</b></span></div><div class="list">';
    if (!res.length) h += '<p class="note">Personne n\'habite ici pour l\'instant. Le prochain gobelin qui rejoindra le clan s\'y installera.</p>';
    res.forEach(g => {
      const job = CG.JOBS[g.job];
      h += '<div class="row"><span class="ic">' + job.icon + '</span><div><b><span class="' + g.sex + '">' + (g.sex === 'f' ? '♀' : '♂') + '</span> ' + (g.met ? esc(g.name) : '???') + '</b>' + (g.child ? ' <em>(ton enfant)</em>' : '') + '<small>' + (g.met ? (g.sex === 'f' ? job.nomF : job.nom) + ' · niveau ' + g.lvl + ' · ❤ ' + Math.ceil(g.hp) + '/' + G.gobMaxHp(g) + (Object.keys(g.equip).length ? ' · ' + Object.keys(g.equip).map(k => CG.CRAFTS[k].icon).join(' ') : '') : 'Tu ne le connais pas encore : va lui parler.') + '</small></div><span class="mp">' + (g.hidden ? 'à l\'abri dedans' : R.fireLit && g.state === 'party' ? 'à la fête' : 'dehors') + '</span></div>';
    });
    h += '</div><p class="note">Les habitants de cette hutte sont marqués d\'une flèche dans le village tant que cette fenêtre est ouverte.</p><div class="foot"><button id="x-close">Fermer (Échap)</button></div>';
    open('hut', h); R.hutSel = i; $('x-close').onclick = UI.dismiss;
  };

  // ---------- arbre des technologies ----------
  // emblèmes des branches (dessinés, sans contour)
  const ring = c => '<circle cx="50" cy="50" r="48" fill="#6f787e"/><circle cx="50" cy="50" r="45" fill="#a4adb2"/><path d="M14 30 A41 41 0 0 1 60 8" stroke="#c9d1d5" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="35" fill="' + c + '"/>';
  const EMB = {
    def: '<clipPath id="ta-sh"><path d="M6 0 H94 V56 Q94 84 50 99 Q6 84 6 56Z"/></clipPath><g clip-path="url(#ta-sh)">' + [0, 1, 2, 3, 4, 5].map(i => { const x = 11 + i * 13, t = [22, 12, 17, 9, 15, 23][i]; return '<path d="M' + x + ' ' + (t + 18) + ' L' + (x + 6.5) + ' ' + t + ' L' + (x + 13) + ' ' + (t + 18) + ' V100 H' + x + 'Z" fill="' + (i % 2 ? '#8a5a2c' : '#a67138') + '"/><path d="M' + x + ' ' + (t + 18) + ' L' + (x + 6.5) + ' ' + t + ' L' + (x + 13) + ' ' + (t + 18) + 'Z" fill="#e2bd80"/>'; }).join('') + '<rect x="6" y="50" width="88" height="7" fill="#5c3a1a"/></g><path d="M6 20 L12 16 V56 Q12 79 50 92 Q88 79 88 56 V16 L94 20 V56 Q94 84 50 99 Q6 84 6 56Z" fill="#8f989d"/><path d="M6 20 L12 16 V56 Q12 70 22 78 L18 83 Q6 72 6 56Z" fill="#b9c1c5"/><path d="M14 80 Q30 62 44 76 T74 70" stroke="#4fa828" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="30" cy="68" rx="6" ry="3" fill="#6cc934" transform="rotate(-35 30 68)"/><ellipse cx="60" cy="73" rx="6" ry="3" fill="#6cc934" transform="rotate(25 60 73)"/>',
    clan: ring('#565d62') + '<rect x="30" y="70" width="40" height="8" rx="4" fill="#8a5a2c" transform="rotate(14 50 74)"/><rect x="30" y="70" width="40" height="8" rx="4" fill="#a67138" transform="rotate(-14 50 74)"/><path d="M50 40 Q66 56 60 68 Q56 76 50 76 Q44 76 40 68 Q34 56 50 40Z" fill="#f2702a"/><path d="M50 54 Q58 64 55 70 Q53 75 50 75 Q47 75 45 70 Q42 64 50 54Z" fill="#ffd23a"/><g transform="rotate(-38 50 50)"><rect x="46" y="20" width="8" height="50" rx="3" fill="#b07a3e"/><rect x="33" y="14" width="34" height="18" rx="4" fill="#c4ccd0"/><rect x="33" y="14" width="34" height="6" rx="3" fill="#e4eaed"/></g>',
    guer: ring('#6a3028') + [-1, 1].map(s => '<g transform="rotate(' + s * 40 + ' 50 52)"><path d="M46 14 L50 6 L54 14 V60 H46Z" fill="#dfe6ea"/><path d="M50 6 L54 14 V60 H50Z" fill="#b4bec4"/><rect x="38" y="60" width="24" height="6" rx="3" fill="#e2b040"/><rect x="47" y="66" width="6" height="15" rx="2" fill="#8a5a2c"/><circle cx="50" cy="84" r="4.5" fill="#e2b040"/></g>').join(''),
    sorc: ring('#3c2f72') + '<path d="M50 20 Q54 44 78 50 Q54 56 50 80 Q46 56 22 50 Q46 44 50 20Z" fill="#ffe36b"/><path d="M50 34 Q52 47 64 50 Q52 53 50 66 Q48 53 36 50 Q48 47 50 34Z" fill="#fff8d0"/><circle cx="70" cy="30" r="4" fill="#9adcff"/><circle cx="30" cy="70" r="3" fill="#ff9ae0"/><circle cx="72" cy="70" r="2.5" fill="#fff"/>',
    mode: ring('#2f5a66') + '<path d="M36 26 L44 23 Q50 31 56 23 L64 26 L79 39 L70 50 L64 45 V77 H36 V45 L30 50 L21 39Z" fill="#e8503a"/><path d="M44 23 Q50 31 56 23 L59 24 Q50 38 41 24Z" fill="#ffd0b8"/><circle cx="50" cy="57" r="6" fill="#ffe36b"/>'
  };
  UI.tech = function (keep) {
    sync(); const CW = 198, CH = 46, TX = 224, RY = 55, X0 = 32, PT = 16, t = S.tech, nOwn = CG.TECH.filter(n => G.tech(n.id)).length, pct = Math.round(100 * nOwn / CG.TECH.length);
    const sousPlan = n => !!(t.plans && t.plans[n.id]);
    const state = n => G.tech(n.id) && !(sousPlan(n) && G.techAvail(n)) ? 'own' : G.techAvail(n) ? (t.points >= n.cout ? 'can' : 'av') : CG.Vues.proche(n) ? 'lock' : 'deep';
    const leaf = (x, y, a) => '<i class="ta-leaf" style="' + x + ';' + y + ';--a:' + a + 'deg;animation-delay:-' + (Math.abs(a) % 7) * 0.4 + 's"></i>';
    let h = '<svg class="ta-defs"><filter id="ta-rag" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter><filter id="ta-rag2" x="-3%" y="-10%" width="106%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="7" xChannelSelector="R" yChannelSelector="G"/></filter></svg><div class="ta-paper"></div>'
      + '<div class="ta-prog" title="' + nOwn + ' technologies apprises sur ' + CG.TECH.length + '"><i style="width:' + pct + '%"></i>' + [25, 25, 50, 50, 75, 75].map(m => '<b class="' + (pct >= m ? 'on' : '') + '" style="left:' + m + '%">✦</b>').join('') + '<u class="' + (pct >= 100 ? 'on' : '') + '"></u></div>'
      + leaf('left:-6px', 'top:150px', -30) + leaf('right:-4px', 'top:120px', 200) + leaf('left:2px', 'top:46%', 15) + leaf('right:-8px', 'top:58%', 160) + leaf('left:-4px', 'bottom:90px', -55) + leaf('right:2px', 'bottom:150px', 230) + leaf('left:30%', 'bottom:-5px', 100)
      + '<div class="ta-head"><button class="ta-x" id="x-gem" title="Fermer"></button><h2>🌳 Arbre des technologies <span class="pts">⭐ ' + t.points + ' point' + (t.points > 1 ? 's' : '') + '</span></h2>' + CG.Vues.boutons() + '</div><div class="techwrap">';
    if (CG.Vues.vue()) h += CG.Vues.corps(state); else CG.TECH_BRANCHES.forEach(br => {
      // la place de chaque case se calcule toute seule : une colonne par étape, et chaque chemin garde sa propre bande de rangées (les embranchements ne se croisent jamais)
      const nodes = CG.TECH.filter(n => n.br === br.id), ids = new Set(nodes.map(n => n.id)), kids = {}, pos = {}, par = n => (n.req && ids.has(n.req[0]) ? n.req[0] : null);
      nodes.forEach(n => { const p = par(n); if (p) (kids[p] = kids[p] || []).push(n); });
      let leafN = 0, maxD = 0;
      const place = (n, d) => { maxD = Math.max(maxD, d); const k = kids[n.id] || []; let r; if (!k.length) r = leafN++; else { const rs = k.map(c => place(c, d + 1)); r = (rs[0] + rs[rs.length - 1]) / 2; if (k.length > 1) leafN += 0.18; } pos[n.id] = { d, r }; return r; };
      nodes.filter(n => !par(n)).forEach(n => { place(n, 0); leafN += 0.3; });
      const W = X0 + maxD * TX + CW + 16, H = Math.ceil(leafN * RY + PT - 6), root = nodes.find(n => !par(n)), es = Math.min(104, pos[root.id].r * RY - 4), top1 = pos[root.id].r, off = 0;
      const nx = n => pos[n.id].d * TX + X0, ny = n => pos[n.id].r * RY + PT;
      h += '<div class="branch"><div class="ta-sign">' + br.nom + ' <em>' + nodes.filter(n => G.tech(n.id)).length + ' / ' + nodes.length + '</em></div><div class="tree" style="width:' + W + 'px;height:' + H + 'px"><svg class="lk" width="' + W + '" height="' + H + '"><path class="trunk" d="M8 4 V' + (H - 4) + '"/><path class="trunk2" d="M7 8 V' + (H - 8) + '"/>';
      let vines = '';
      nodes.forEach(n => {
        const y2 = ny(n) + CH / 2, x2 = nx(n) + 4, on = G.tech(n.id);
        const link = (d, cls, mx, my) => { h += '<path class="br' + cls + '" d="' + d + '"/><path class="br2' + cls + '" d="' + d + '"/>'; if (on) vines += '<path class="vine" d="' + d + '"/><ellipse class="lf" cx="' + (mx - 7) + '" cy="' + (my - 6) + '" rx="8" ry="4" transform="rotate(-35 ' + (mx - 7) + ' ' + (my - 6) + ')"/><ellipse class="lf2" cx="' + (mx + 8) + '" cy="' + (my + 6) + '" rx="7" ry="3.5" transform="rotate(145 ' + (mx + 8) + ' ' + (my + 6) + ')"/>'; };
        if (!n.req) return link('M8 ' + y2 + ' H' + x2, '', (8 + x2) / 2, y2);
        n.req.forEach(rid => { const p = CG.TECH_BY_ID[rid]; if (false) { const vx = nx(n) + CW / 2, va = ny(p) + CH - 4, vb = ny(n) + 4; return link('M' + vx + ' ' + va + ' V' + vb, G.tech(rid) ? '' : ' off', vx, (va + vb) / 2); } const x1 = nx(p) + CW - 4, y1 = ny(p) + CH / 2; link('M' + x1 + ' ' + y1 + ' C' + (x1 + 24) + ' ' + y1 + ',' + (x2 - 24) + ' ' + y2 + ',' + x2 + ' ' + y2, G.tech(rid) ? '' : ' off', (x1 + x2) / 2, (y1 + y2) / 2); });
      });
      h += vines + '</svg>' + (es < 56 ? '' : '<svg class="emb" viewBox="0 0 100 100" width="' + es + '" height="' + es + '" style="left:' + (X0 + (CW - es) / 2) + 'px;top:' + (((top1 + off) * RY - es) / 2 + 4) + 'px">' + (EMB[br.id] || ring('#565d62')) + '</svg>');
      nodes.forEach(n => {
        const st = state(n);
        h += '<button class="tn ' + st + '" data-tech="' + n.id + '" style="left:' + nx(n) + 'px;top:' + ny(n) + 'px;width:' + CW + 'px;height:' + CH + 'px"><span class="ti">' + n.icon + '</span><b>' + n.nom + '</b><em>' + (st === 'own' ? '✔' : '⭐' + n.cout) + '</em>' + (st === 'can' || st === 'av' ? '<i class="st">★</i>' : '') + '</button>';
      });
      h += '</div></div>';
    });
    h += '</div><div class="ta-foot"><div class="ta-frise"></div><button id="x-close">Fermer (T)</button></div>';
    const old = document.querySelector('.techwrap'), sc = keep && old ? [old.scrollLeft, old.scrollTop] : null;
    open('tech', h, true, true); $('panel').className = 'arbre'; $('modal').classList.add('flou'); $('x-close').onclick = $('x-gem').onclick = UI.dismiss;
    if (sc) { const w = document.querySelector('.techwrap'); w.scrollLeft = sc[0]; w.scrollTop = sc[1]; }
    CG.Vues.apres(!!sc);
    { // la description : une bulle qui apparaît à côté de la case qu'on survole
      const w = document.querySelector('.techwrap'), tip = document.createElement('div'); tip.id = 'ta-tip'; tip.hidden = true; $('panel').appendChild(tip); let cur = null;
      const cacher = () => { cur = null; tip.hidden = true; };
      const montrer = b => {
        const n = CG.TECH_BY_ID[b.dataset.tech]; if (!n) return cacher(); cur = b; const st = state(n), ferme = st === 'lock' || st === 'deep';
        tip.className = st; tip.innerHTML = '<div class="tt-h"><span></span><b></b></div><p></p><em></em>';
        tip.querySelector('span').textContent = n.icon; tip.querySelector('b').textContent = n.nom;
        tip.querySelector('p').textContent = ferme ? 'Tu sauras ce que ça fait quand tu pourras l\'apprendre.' : n.desc;
        tip.querySelector('em').textContent = st === 'own' ? (sousPlan(n) ? '📐 Appris grâce à un plan' : '✔ Déjà appris') : sousPlan(n) ? '📐 Tu as déjà le plan · ⭐ ' + n.cout + ' point' + (n.cout > 1 ? 's' : '') + ' pour l\'apprendre pour de bon et ouvrir ses voisines' + (st === 'can' ? ' (clique)' : '') : ferme ? '🔒 Apprends d\'abord : ' + CG.Vues.manque(n) : st === 'can' ? '⭐ ' + n.cout + ' point' + (n.cout > 1 ? 's' : '') + ' · clique pour l\'apprendre' : '⭐ ' + n.cout + ' point' + (n.cout > 1 ? 's' : '') + ' · il t\'en manque ' + (n.cout - t.points);
        tip.hidden = false; const r = b.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight, droite = r.right + 12 + tw < window.innerWidth - 8;
        tip.style.left = Math.round(droite ? r.right + 12 : Math.max(8, r.left - tw - 12)) + 'px'; tip.style.top = Math.round(Math.max(8, Math.min(window.innerHeight - th - 8, r.top + r.height / 2 - th / 2))) + 'px';
      };
      w.addEventListener('mouseover', e => { const b = e.target.closest && e.target.closest('.tn'); if (!b) return cacher(); if (b !== cur) montrer(b); });
      w.addEventListener('mouseleave', cacher); w.addEventListener('scroll', cacher); w.addEventListener('pointerdown', e => { if (!(e.target.closest && e.target.closest('.tn'))) cacher(); });
    }
    { // l'arbre est long : on le fait glisser en le tirant avec la souris
      const w = document.querySelector('.techwrap'); let d = null;
      w.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; d = { x: e.clientX, y: e.clientY, l: w.scrollLeft, t: w.scrollTop }; w.classList.add('pan'); w.setPointerCapture(e.pointerId); });
      w.addEventListener('pointermove', e => { if (!d) return; w.scrollLeft = d.l - (e.clientX - d.x); w.scrollTop = d.t - (e.clientY - d.y); });
      const fin = () => { d = null; w.classList.remove('pan'); }; w.addEventListener('pointerup', fin); w.addEventListener('pointercancel', fin);
    }
    $('panel').querySelectorAll('[data-tech]').forEach(b => b.onclick = () => {
      const n = CG.TECH_BY_ID[b.dataset.tech];
      if (G.tech(n.id) && !sousPlan(n)) return;
      if (!G.techAvail(n)) { CG.sfx('no'); return UI.toast('🔒 Il faut d\'abord : ' + CG.Vues.manque(n) + '.'); }
      if (!G.buyTech(n.id)) { CG.sfx('no'); return UI.toast('Il te faut ' + n.cout + ' point(s). Monte de niveau pour en gagner.'); }
      CG.sfx('level'); UI.toast('🌳 ' + n.nom + ' : ' + n.desc); lastSpells = ''; UI.tech(true);
    });
  };
  UI.pause = function () {
    const A = CG.audio;
    const audioRow = (kind, id, icon, label, status) => {
      const on = A[kind + 'On'];
      return '<div class="row"><span class="ic">' + icon + '</span><div><b>' + label + '</b>' + UI.audioVolume(kind) + '</div>' +
        '<button id="' + id + '" class="' + (on ? 'on' : '') + '" aria-label="' + label + '" aria-pressed="' + on + '">' + status[+on] + '</button></div>';
    };
    const render = focus => {
      open('pause', '<h2>⏸ Pause</h2>' + (CG.Diff && S ? '<p class="pz-diff d-' + CG.Diff.id() + '"><span>' + CG.Diff.cur().icon + '</span> Difficulté : <b>' + CG.Diff.cur().nom + '</b><small>' + esc(CG.Diff.cur().titre) + '</small></p>' : '') + '<div class="pz-tabs" id="pz-tabs"></div><p class="quote"></p><div class="list">' +
        '<div class="row"><span class="ic">' + (A.muted ? '🔇' : '🔊') + '</span><div><b>Tout le son</b><small>Coupe la musique et les effets d\'un coup (touche M)</small></div><button id="pz-mute" class="' + (A.muted ? '' : 'on') + '" aria-label="Tout le son" aria-pressed="' + !A.muted + '">' + (A.muted ? 'Coupé' : 'Activé') + '</button></div>' +
        audioRow('music', 'pz-mus', '🎵', 'Musique', ['Coupée', 'Activée']) + audioRow('sfx', 'pz-sfx', '🔔', 'Effets sonores', ['Coupés', 'Activés']) +
        '</div><p class="note">La partie se sauvegarde toute seule chaque matin, et aussi quand tu retournes au menu.</p><div class="foot"><button id="pz-menu">🏠 Retour au menu</button><button id="x-close">▶ Reprendre (P)</button></div>');
      $('x-close').onclick = UI.dismiss; keyHandlers.Enter = UI.dismiss;
      $('pz-menu').onclick = () => { CG.save(); location.reload(); };
      $('pz-mute').onclick = () => { $('btn-sound').click(); render('pz-mute'); }; // le bouton du son n'est plus dans le HUD : il vit ici
      for (const [id, prop] of [['pz-mus', 'musicOn'], ['pz-sfx', 'sfxOn']]) {
        $(id).onclick = () => { A[prop] = !A[prop]; A.savePrefs(); CG.sfx('click'); render(id); };
      }
      UI.bindAudioVolumes($('panel'));
      $(focus || 'x-close').focus();
      if (CG.Interface) CG.Interface.attach(); // onglets Son / Interface
    };
    render();
  };
  UI.summary = function (lines, babies, info) {
    const S = CG.S, p = S.player, st = (info && info.st) || {}, x0 = (info && info.xp0) || { lvl: p.lvl, xp: p.xp };
    let gained = p.xp - x0.xp; for (let l = x0.lvl; l < p.lvl; l++) gained += G.xpNeed(l);
    const tiles = [['🍖', 'Nourriture', st.food || 0, st.eaten ? '-' + st.eaten + ' à la fête' : ''], ['🪵', 'Bois', st.bois || 0], ['🪨', 'Minerai', st.minerai || 0], ['🟤', 'Cuir', st.cuir || 0], ['🪙', 'Or', st.or || 0], ['⚔️', 'Ennemis vaincus', st.kills || 0, '', 1]];
    let d = 0.25; const step = n => { d += n; return d.toFixed(2); };
    let h = '<h2>🌅 Le soleil se lève — Jour ' + S.day + '</h2>' + (babies ? '<div class="babies pop" style="animation-delay:' + step(0) + 's">👶 +' + babies + ' enfant' + (babies > 1 ? 's' : '') + ' cette nuit !</div>' : '');
    h += '<div class="sumtiles">' + tiles.map((t, i) => '<div class="pop' + (t[2] ? '' : ' zero') + '" style="animation-delay:' + step(0.16) + 's"><span>' + t[0] + '</span><b data-n="' + t[2] + '" data-d="' + d + '" data-plain="' + (t[4] || 0) + '">' + (t[4] ? '0' : '+0') + '</b><em>' + t[1] + '</em>' + (t[3] ? '<small>' + t[3] + '</small>' : '') + '</div>').join('') + '</div>';
    const xd = +step(0.35);
    h += '<div class="sumxp pop" style="animation-delay:' + xd + 's"><div class="sx-top"><b id="sx-lvl">Niveau ' + x0.lvl + '</b><span id="sx-gain">+0 XP hier</span></div><div class="sx-bar"><div id="sx-fill"></div><span id="sx-txt"></span></div></div>';
    if (info) { const dm = info.morale - (info.morale0 === undefined ? info.morale : info.morale0);
      h += '<div class="chips pop" style="animation-delay:' + step(0.3) + 's"><span>👥 Clan <b>' + info.pop + ' / ' + info.cap + '</b></span><span>' + (info.morale >= 60 ? '😄' : info.morale >= 35 ? '😐' : '😟') + ' Moral <b>' + info.morale + ' %</b>' + (dm ? ' (' + (dm > 0 ? '+' : '') + dm + ')' : '') + '</span>' + (info.pets ? '<span>🐾 Animaux <b>' + info.pets + '</b></span>' : '') + (S.tech.points ? '<span>🌳 Points à dépenser <b>' + S.tech.points + '</b></span>' : '') + (info.best ? '<span>🏅 Le plus aguerri <b>' + esc(info.best.name) + '</b> (niv. ' + info.best.lvl + ')</span>' : '') + '</div>'; }
    if (lines.length) h += '<ul class="sum">' + lines.map(l => '<li class="pop" style="animation-delay:' + step(0.22) + 's">' + esc(l) + '</li>').join('') + '</ul>';
    h += '<div class="foot"><button id="x-close">Commencer la journée (Entrée)</button></div>';
    open('summary', h, false);
    const t0 = performance.now(), need = G.xpNeed, ease = k => 1 - Math.pow(1 - k, 3), xdur = Math.min(3.2, 1.4 + (p.lvl - x0.lvl) * 0.9);
    let shown = x0.lvl, alive = true;
    const tick = () => {
      if (!alive || !UI.modal || UI.modal.name !== 'summary') return;
      const t = (performance.now() - t0) / 1000;
      $('panel').querySelectorAll('.sumtiles b').forEach(b => { const n = +b.dataset.n, k = CG.clamp((t - +b.dataset.d) / 0.7, 0, 1); b.textContent = (+b.dataset.plain ? '' : '+') + Math.round(n * ease(k)); });
      const k = ease(CG.clamp((t - xd - 0.3) / xdur, 0, 1)); let rest = gained * k, l = x0.lvl, x = x0.xp;
      while (l < p.lvl && x + rest >= need(l)) { rest -= need(l) - x; x = 0; l++; }
      x += rest; if (k >= 1) { l = p.lvl; x = p.xp; }
      $('sx-fill').style.width = CG.clamp(x / need(l) * 100, 0, 100) + '%'; $('sx-txt').textContent = Math.round(x) + ' / ' + need(l) + ' XP';
      $('sx-gain').textContent = '+' + Math.round(gained * k) + ' XP hier';
      if (l !== shown) { shown = l; const e = $('sx-lvl'); e.textContent = 'Niveau ' + l + ' !'; e.classList.remove('up'); void e.offsetWidth; e.classList.add('up'); CG.sfx('level'); }
      requestAnimationFrame(tick);
    };
    tick();
    const bye = () => { alive = false; UI.dismiss(); if (CG.R.campNote) UI.toast(CG.R.campNote); };
    $('x-close').onclick = bye; keyHandlers.Enter = bye; keyHandlers.e = bye;
  };
  UI.gameOver = function (chef) {
    if (chef && CG.peekSave()) { // le chef est tombé : on peut reprendre au dernier matin, ou tout recommencer
      open('over', '<h2>☠ Game Over</h2><p class="quote">Le chef ' + esc(CG.S.name) + ' est tombé au jour ' + CG.S.day + '. Sans lui, le clan se disperse dans la forêt... ' + CG.S.stats.kills + ' ennemis vaincus.</p><div class="foot col"><button id="x-close">↩ Reprendre au matin du jour ' + CG.peekSave().day + '</button><button id="x-new">🌱 Nouvelle partie</button></div>', false);
      $('x-close').onclick = () => { try { sessionStorage.setItem('cg-reprendre', '1'); } catch (e) { /* rien */ } location.reload(); };
      $('x-new').onclick = () => { CG.wipe(); location.reload(); }; return;
    }
    CG.wipe();
    open('over', '<h2>☠ Le clan n\'est plus</h2><p class="quote">' + (chef ? 'Le chef est tombé' : 'Le dernier gobelin est tombé') + ' au jour ' + CG.S.day + '. ' + CG.S.stats.kills + ' ennemis vaincus.</p><div class="foot"><button id="x-close">Recommencer</button></div>', false);
    $('x-close').onclick = () => location.reload();
  };
  UI.title = function () {
    const sv = CG.peekSave();
    open('title', '<h1>Goblin Malin</h1><p class="quote">Tu es le seul gobelin malin du clan. Fais grandir ton village, et protège-le.</p><label>Ton nom de chef <input id="chief-name" maxlength="14" value="Grizz"></label><div class="foot col">' + (sv ? '<button id="t-cont">▶ Continuer — ' + esc(sv.name) + ', jour ' + sv.day + '</button>' : '') + '<button id="t-new">🌱 Nouvelle partie</button><button id="t-debug">🛠 Mode debug</button></div><p class="note">v' + CG.VERSION + ' · W A S D pour bouger · E pour parler · H pour l\'aide</p>', false);
    if (sv) $('t-cont').onclick = () => { UI.close(); CG.start(false); };
    $('t-debug').onclick = () => CG.Debug.show();
    try { if (sv && sessionStorage.getItem('cg-reprendre')) { sessionStorage.removeItem('cg-reprendre'); $('t-cont').onclick(); } } catch (e) { /* rien */ }
    $('t-new').onclick = () => { if (sv && !confirm('Effacer la partie de ' + sv.name + ' (jour ' + sv.day + ') ?')) return; const n = $('chief-name').value.trim() || 'Grizz'; UI.close(); CG.start(true, n); };
  };
})(window.CG);
