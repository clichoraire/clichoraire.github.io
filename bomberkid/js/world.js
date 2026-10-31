// Simulation partagée par les deux modes : plateau en cases, joueurs, bombes (posées, poussées, portées, lancées),
// flammes, objets, ennemis et boss. Le rendu 3D est à la fin (render).
(function (BK) {
  'use strict';
  const HARD = 1, SOFT = 2, TARGET = 5, GATE = 6, BARREL = 7, SEALED = 8, METAL = 9;
  const METAL_WOOD = { 'v': 0, '<': 1, '^': 2, '>': 3 };   // côté en bois : sud, ouest, nord, est
  // Décorations : lettre → [sorte, 0 = on passe dessus, 1 = bloque, 2 = bloc mou (se casse)]
  const DECO = { l: ['lamp', 1], n: ['bench', 1], o: ['tomb', 1], s: ['statue', 1], u: ['well', 1], w: ['fence', 1], m: ['mushrooms', 0], g: ['grass', 0], K: ['crate', 2], i: ['campfire', 1], j: ['pumpkin', 2], O: ['chest', 1], L: ['log', 1], I: ['pillar', 1], N: ['counter', 1], V: ['shelf', 1],
    2: ['signpost', 1], 3: ['cask', 1], 4: ['hay', 1], 5: ['scarecrow', 1], 6: ['flowerpot', 1], 7: ['mailbox', 1], 8: ['stump', 1], 9: ['cactus', 1], 0: ['cart', 1], J: ['fountain', 1],
    M: ['table', 1], R: ['chair', 1], S: ['bed', 1], U: ['bookshelf', 1], Y: ['fireplace', 1], Z: ['cauldron', 1], t: ['plant', 1], '@': ['piano', 1], '+': ['candelabra', 1], '?': ['anvil', 1] };
  // Décorations supplémentaires : caractère " et props["c,r"].deco = genre (0 : on marche dessus, 1 : solide)
  const DECO_PROPS = { waterjet:1, firebar:1, terrarium:1, aquarium:1, fishing_basket:1, fish_trout:1, fish_bass:1, fish_pike:1, antlers_moose:1, antlers_deer:1, fly_frame:1, lumber_saw:1, trophy_cup:1, trophy_star:1, trophy_shield:1, table_round:1, table_dining:1, table_low:1, fireplace:1, chair:1, stool:1, statue_mermaid: 1, statue_thinker: 1, statue_dancer: 1, statue_guardian: 1, wheel: 1, trough: 1, banner: 1, market: 1, beehive: 1, mossrock: 1, logpile: 1, bigmushroom: 1, bones: 0, skullpile: 1,
    snowman: 1, snowpine: 1, baretree: 1, icerock: 1, icecrystal: 1, igloo: 1, sled: 1, skis: 1, snowpile: 0, snowballs: 1,   // hiver
    jukebox: 1, guitar: 1, drum: 1, rock: 1,   // rock : la roche que les gants de force soulèvent
    carrot: 0, melon: 2, cheese: 2, gift: 2, dirtblock: 2,   // carotte à cueillir ; blocs cubiques (style Minecraft) qui se cassent avec une bombe
    volcano: 1, volcanopart: 1, mountain: 1, mountainpart: 1 };   // gros décors sur plusieurs cases : la case d'ancrage dessine tout, les « part » sont juste solides   // instruments : avec le piano, ils font jouer la musique choisie pour la pièce
  BK.INSTRUMENTS = ['piano', 'jukebox', 'guitar', 'drum'];
  BK.STATUES = ['statue', 'statue_mermaid', 'statue_thinker', 'statue_dancer', 'statue_guardian'];
  BK.LIGHT_KINDS=['lamp','candelabra','fireplace','campfire'];
  BK.LIGHT_COLORS={default:{name:'Chaleureuse (par défaut)'},red:{name:'Rouge',rgb:'255,70,70'},blue:{name:'Bleue',rgb:'70,145,255'},green:{name:'Verte',rgb:'70,225,120'},purple:{name:'Mauve',rgb:'180,100,255'},pink:{name:'Rose',rgb:'255,115,195'},white:{name:'Blanche',rgb:'235,245,255'}};
  BK.WALL_DECOR = new Set(['fish_trout','fish_bass','fish_pike','antlers_moose','antlers_deer','fly_frame','lumber_saw']);
  for(const it of BK.BIOME_DECOR){DECO_PROPS[it.deco]=it.solid;if(it.wall)BK.WALL_DECOR.add(it.deco);}
  for(const it of BK.CASTLE_DECOR){DECO_PROPS[it.deco]=it.solid;if(it.wall)BK.WALL_DECOR.add(it.deco);}
  for(const it of BK.TRAP_DECOR)DECO_PROPS[it.deco]=it.solid;
  BK.DECO = DECO; BK.DECO_PROPS = DECO_PROPS;
  BK.hasInstrument = W => W.deco.some(k => k && BK.INSTRUMENTS.includes(k));
  const T_STONE = 0, T_GRASS = 1, T_WATER = 2, T_BRIDGE = 3, T_VOID = 4, T_DIRT = 5, T_ROAD = 6, T_PLAZA = 7, T_SIDEWALK = 8, T_CURB = 9, T_WOOD = 10, T_TILE = 11, T_CARPET = 12, T_LAVA = 13, T_ICE = 14, T_SNOW = 15;
  const FLOORS = { '-': T_DIRT, '_': T_ROAD, '%': T_PLAZA, '&': T_SIDEWALK, '!': T_CURB, 'y': T_WOOD, 'z': T_TILE, 'q': T_CARPET, '[': T_LAVA, ']': T_ICE, ')': T_SNOW, ...Object.fromEntries(BK.DESERT_FLOORS.map(it=>[it.ch,it.terrain])) };
  const LEVEL = 0.6;   // hauteur d'un plateau
  const DIRS = BK.DIRS, MUSH_TOP = 1.3;   // hauteur du chapeau du gros champignon (trampoline)
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  class World {
    // o : { map: [lignes], theme, mode: 'match'|'adventure', hearts: bool, itemChance, itemPool, softChance }
    constructor(o) {
      this.mode = o.mode || 'match'; this.theme = BK.THEMES[o.theme || 'forest']; this.themeId = o.theme || 'forest';
      this.hearts = !!o.hearts; this.itemChance = o.itemChance == null ? 0.33 : o.itemChance;
      this.itemPool = o.itemPool || Object.keys(BK.ITEMS).filter(k => BK.ITEMS[k].weight > 0 && (this.hearts || !BK.ITEMS[k].adventureOnly));
      this.rows = o.map.length; this.cols = o.map[0].length;
      this.cells = new Uint8Array(this.cols * this.rows);
      this.special = new Map();   // "c,r" → { type: 'exit'|'switch', open|on }
      this.starts = [];           // positions de départ (chiffres dans la carte)
      this.spawns = [];           // ennemis (lettres)
      this.boats = []; this.switches = []; this.exit = null; this.explore = !!o.explore; this.dayCycle = !!o.dayCycle; this.wasNight = false; this.exitKind = o.exitKind || 'portal';   // 'G' devient un portail, 'door' pour les maisons et le quai
      const n = this.cols * this.rows;
      this.terrain = new Uint8Array(n); this.height = new Float32Array(n); this.ramp = new Int8Array(n);   // ramp : 0 non, 1 = le sud est plus haut, -1 = le nord, 2 = l'est, -2 = l'ouest
      this.targets = {}; this.gates = {}; this.trees = []; this.doors = []; this.cardsTotal = 0; this.pendingItems = []; this.coins = !!o.coins;
      this.trail = new Uint8Array(n); this.sparks = []; this.metal = new Int8Array(n).fill(-1); this.houses = o.houses || {}; this.props = {...(o.props || {})}; for(const [key,pr] of Object.entries(this.props)) if(pr.deco==='terrarium') this.props[key]={...pr,snails:(pr.snails||[]).map(s=>({...s}))}; this.rocks = []; this.shots = []; this.lifts = []; this.elevators = []; this.rails = []; this.movers = []; this.baseH = new Map(); this.campfires = [];this.firebars=[]; this.fishes = []; this.volcanoes = []; this.hives = []; this.bounceT = new Map(); this.growT = new Map(); this.puddles = []; this.debris = []; this.flowers = []; this.deco = new Array(n).fill(null);   // traînée de poudre : 1 = intacte, 2 = brûlée
      if (this.explore) { this.parseExplore(o.map); for(const [key,pr] of Object.entries(this.props)){if(pr.boat){const [c,r]=key.split(',').map(Number);if(this.tAt(c,r)===T_WATER)this.boats.push({x:c+.5,y:r+.5,dir:0,rowT:0,rider:null});}} }
      else for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
        const ch = o.map[r][c], i = r * this.cols + c;
        if (ch === '#') this.cells[i] = HARD;
        else if (ch === 'x') this.cells[i] = SOFT;
        else if (ch === '?') this.cells[i] = Math.random() < (o.softChance == null ? 0.72 : o.softChance) ? SOFT : 0;
        else if (ch >= '1' && ch <= '9') this.starts[+ch - 1] = { c, r };
        else if (ch === 'E') { this.exit = { c, r, open: false, kind: 'door', x: c + 0.5, y: r + 0.5 }; this.special.set(c + ',' + r, { type: 'exit' }); }
        else if (ch === 'e') { this.exit = { c, r, open: false, hidden: true, kind: 'door', x: c + 0.5, y: r + 0.5 }; this.cells[i] = SOFT; this.special.set(c + ',' + r, { type: 'exit' }); }
        else if (ch === 'S') { const sw = { c, r, on: false }; this.switches.push(sw); this.special.set(c + ',' + r, { type: 'switch', sw }); }
        else if (/[a-z]/.test(ch) && ch !== 'x' && ch !== 'e') this.spawns.push({ c, r, code: ch });
      }
      this.players = []; this.bombs = []; this.flames = []; this.items = []; this.enemies = []; this.particles = []; this.falling = []; this.floaters = [];
      this.flameAt = new Map(); this.events = []; this.time = 0; this.frozen = false; this.rain = null; this.shake = 0;
      for (const it of this.pendingItems) this.spawnItem(it.c, it.r, it.type);
      this.clouds = Array.from({ length: 6 }, (_, i) => ({ x: Math.random() * 1400 - 100, y: 40 + i * 28 + Math.random() * 30, s: 0.6 + Math.random() * 0.8, v: 4 + Math.random() * 6 }));
    }
    // Cartes d'exploration : ~ eau, . pierre, , gazon, : pierre haute, ; gazon haut, / rampe, = pont, # roc, W brique,
    // x buisson, X buisson haut, T arbre, A-F cibles rayées, a-f portes/pont-levis ouverts par la cible de même lettre,
    // 1 départ, G but, h cœur, k carte d'or, $ pièce, H maison, P baril dormant, p traînée de poudre, Q porte scellée,
    // < > ^ v bloc de métal dont la face en bois est à l'ouest / est / nord / sud (seule cette face cède aux flammes),
    // r roche, * fleurs, l n o s u w m g K i j O L I N V 2-9 0 J M R S U Y Z t @ + ? décorations (voir DECO), sols : - terre, _ rue, % place pavée, & trottoir,
    // ! bordure, y plancher de bois, z carrelage, q tapis. props["c,r"] : options d'une case (lettre d'une cible ou d'une porte, style d'arbre, couleurs des fleurs).
    parseExplore(map) {
      BK.migrateRemedyData(this.props);
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
        const ch = map[r][c], i = r * this.cols + c; let t = T_STONE, h = 0, cell = 0;
        if (ch === '~') t = T_WATER; else if (ch === ' ') t = T_VOID; else if (FLOORS[ch] != null) t = FLOORS[ch];
        else if (ch === ',') t = T_GRASS; else if (ch === ':') h = LEVEL; else if (ch === ';') { t = T_GRASS; h = LEVEL; }
        else if (ch === '=') t = T_BRIDGE; else if (ch === '/') { this.ramp[i] = 1; h = LEVEL / 2; }
        else if (ch === '}') this.lifts.push({ c, r, lv: 0, t: 1, moving: false });
        else if (ch === '{') this.elevators.push({ c, r, state: 'rest', t: 0 });
        else if (ch === '(') this.rails.push({ c, r });   // rail : une plateforme mobile y glisse (voir buildMovers)
        else if (ch === '#') cell = HARD; else if (ch === 'W') { cell = SOFT; this.special.set(c + ',' + r, { type: 'brick' }); }   // mur de briques : se casse avec une bombe
        else if (ch === 'x') cell = SOFT; else if (ch === 'X') { cell = SOFT; h = LEVEL; }
        else if (ch === 'T') { cell = HARD; this.trees.push({ c, r }); t = T_GRASS; }
        else if (ch === 'r') { cell = HARD; this.rocks.push({ c, r }); }
        else if (ch === '*') { this.flowers.push({ c, r }); t = T_GRASS; }
        else if (ch >= 'A' && ch <= 'F') { const L = ((this.props[c + ',' + r] || {}).letter || ch).toUpperCase(); cell = TARGET; this.targets[L] = { c, r, hit: false, letter: L }; }
        else if (ch >= 'a' && ch <= 'f') { const L = ((this.props[c + ',' + r] || {}).letter || ch).toLowerCase(); cell = GATE; (this.gates[L] = this.gates[L] || []).push({ c, r }); t = T_STONE; this.special.set(c + ',' + r, { type: 'gate', letter: L }); }
        else if (ch === '1') this.starts[0] = { c, r };
        else if (ch === 'G') { this.exit = { c, r, open: true, kind: this.exitKind, x: c + 0.5, y: r + 0.5 }; this.special.set(c + ',' + r, { type: 'exit' }); }
        else if (ch === '|') { this.exit = { c, r, open: true, kind: 'diamond', x: c + 0.5, y: r + 0.5 }; this.special.set(c + ',' + r, { type: 'exit' }); }
        else if (ch === 'h') this.pendingItems.push({ c, r, type: 'heart' });
        else if (ch === '$') this.pendingItems.push({ c, r, type: 'coin' });
        else if (ch === 'H') { const hp = this.houses[c + ',' + r]; this.doors.push({ c, r, enterable: !!(hp && hp.interior) }); this.special.set(c + ',' + r, { type: 'door' }); cell = HARD; }
        else if (ch === 'P') cell = BARREL; else if (ch === 'p') this.trail[i] = 1; else if (ch === 'Q') cell = SEALED;
        else if (METAL_WOOD[ch] != null) { cell = METAL; this.metal[i] = METAL_WOOD[ch]; }
        else if (ch === '"' && BK.ITEMS[(this.props[c + ',' + r] || {}).item]) { this.pendingItems.push({c, r, type:this.props[c + ',' + r].item}); }
        else if (ch === '"') { const kind = (this.props[c + ',' + r] || {}).deco || 'bones', solid = DECO_PROPS[kind] == null ? 1 : DECO_PROPS[kind]; this.deco[i] = kind; if(kind==='firebar')this.firebars.push({c,r,angle:0}); if(kind==='fireplace'||kind==='campfire')this.campfires.push({c,r}); if (kind === 'volcano') this.volcanoes.push({ c, r, t: 0, cool: 3 + Math.random() * 4, erupt: 0 }); cell = solid === 2 ? SOFT : solid === 1 ? HARD : 0; if (kind === 'beehive') this.hives.push({ c, r, cool: 0 }); }
        else if (DECO[ch]) { const [kind, solid] = DECO[ch]; this.deco[i] = kind; cell = solid === 2 ? SOFT : solid === 1 ? HARD : 0; if (kind === 'mushrooms' || kind === 'grass') t = T_GRASS; if (kind === 'campfire' || kind === 'fireplace') this.campfires.push({ c, r }); }
        else if (ch === 'k') { this.pendingItems.push({ c, r, type: 'card' }); this.cardsTotal++; }
        const plv = this.props[c + ',' + r]; if (plv && plv.lv != null && t !== T_WATER && t !== T_VOID) h = (plv.lv + (ch==='/'?.5:0)) * LEVEL;   // étage choisi dans l'éditeur (0 à 4)
        this.terrain[i] = t; this.height[i] = h; this.cells[i] = cell;
      }
      // Niveau des objets posés sur un plateau : d'après props (éditeur), sinon d'après les voisines.
      const TERRAIN = '~ .,:;/=-_%&!yzq}{[]()';   // (X, bloc sur un plateau, est un objet : son sol vient des voisines de l'étage 1)
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
        const ch = map[r][c], i = r * this.cols + c; if (TERRAIN.includes(ch)) continue;
        const pr = this.props[c + ',' + r];
        if (pr && (pr.lv != null || pr.h != null)) { this.height[i] = pr.lv != null ? pr.lv * LEVEL : (pr.h ? LEVEL : 0); if (pr.floor === 'grass' || pr.floor === ',' || pr.floor === ';') this.terrain[i] = T_GRASS; else if (pr.floor === 'stone' || pr.floor === '.' || pr.floor === ':') this.terrain[i] = T_STONE; else if (pr.floor === '=') this.terrain[i] = T_BRIDGE; else if (FLOORS[pr.floor] != null) this.terrain[i] = FLOORS[pr.floor]; continue; }
        // étage et sol d'après les voisines qui sont de vrais sols (majorité ; à égalité, l'étage le plus bas)
        // (voisines directes d'abord, puis de plus en plus loin : une case entourée d'objets prend le sol des alentours)
        const lvVotes = {}, votes = {};
        for (let ring = 1; ring <= 4 && !Object.keys(votes).length; ring++) for (let dc = -ring; dc <= ring; dc++) for (let dr = -ring; dr <= ring; dr++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) continue; const cc = c + dc, rr = r + dr; if (!this.inside(cc, rr)) continue;
          const ch2 = map[rr][cc], j = rr * this.cols + cc; if (!TERRAIN.includes(ch2) || ch2 === '~' || ch2 === ' ' || ch2 === '/') continue;
          const w = ring === 1 && dc && dr ? 1 : 2, lv = Math.round(this.height[j] / LEVEL); lvVotes[lv] = (lvVotes[lv] || 0) + w; const key = lv + ':' + this.terrain[j]; votes[key] = (votes[key] || 0) + w;
        }
        let bestLv = 0, bn = 0; for (const [lv, n2] of Object.entries(lvVotes)) if (n2 > bn || (n2 === bn && +lv < bestLv)) { bn = n2; bestLv = +lv; }
        if (ch === 'X') bestLv = 1; this.height[i] = bestLv * LEVEL;
        let best = null; bn = 0; for (const [key, n2] of Object.entries(votes)) if (key.startsWith(bestLv + ':') && n2 > bn) { bn = n2; best = +key.split(':')[1]; }
        if (best != null && (pr == null || pr.floor == null)) this.terrain[i] = best;
      }
      for (const L of this.lifts) { L.lv = Math.round(this.hAt(L.c, L.r) / LEVEL); }
      // ascenseur : plateau au repos un peu au-dessus de son sol (une bombe tient dessous), sommet deux étages plus haut
      this.buildMovers();
      for (const E of this.elevators) { const i = this.idx(E.c, E.r); E.base = this.height[i]; E.rest = E.base + 0.35; E.top = E.base + LEVEL * 2; const pr=this.props[E.c+','+E.r]||{};if(pr.autoLift){E.auto=true;E.rest=E.base;E.top=E.base+Math.max(.5,Number(pr.liftHeight)||1)*LEVEL;E.duration=Math.max(.8,Number(pr.travelTime)||2.6);E.pause=Math.max(.5,Number(pr.platformPause)||1.8);E.state='rest';} this.height[i] = E.rest; }
      // orientation des rampes et hauteur des portes (un pont-levis sur l'eau)
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
        const i = r * this.cols + c;
        if (this.ramp[i]) { const {hN,hS,hW,hE}=this.rampHeights(c,r); if (Math.abs(hS - hN) >= Math.abs(hE - hW)) this.ramp[i] = hS > hN ? 1 : -1; else this.ramp[i] = hE > hW ? 2 : -2; }
        if (this.cells[i] === GATE) { const sp = this.special.get(c + ',' + r); const wet = (cc, rr) => this.tAt(cc, rr) === T_WATER || (this.inside(cc, rr) && this.cells[rr * this.cols + cc] === GATE); sp.bridge = (wet(c, r - 1) || wet(c, r + 1)) && (wet(c - 1, r) || wet(c + 1, r)); if (sp.bridge) this.terrain[i] = T_WATER; }
      }
    }
    // Traînée de poudre : un point au centre et un trait vers chaque voisin relié (poudre, baril, porte scellée).
    drawFloorDetails(ctx,cam,c,r,z,time) {
      const i=this.idx(c,r),pr=cam.project(c+.5,r+.5,z),props=this.props[c+','+r];
      if(this.trail[i])this.drawTrail(ctx,cam,c,r,z);
      if(this.flowers.some(f=>f.c===c&&f.r===r))BK.sprites.drawFlowers(ctx,pr.x,pr.y,pr.k,props?.colors,c*31+r*7,time);
      if(this.deco[i]&&!this.cells[i])BK.sprites.drawDeco(ctx,this.deco[i],pr.x,pr.y,pr.k,time,null,c*17+r*5,props?.orientation||0,props?.lightColor,props);
    }
    drawTrail(ctx, cam, c, r, z) {
      const i = this.idx(c, r), burnt = this.trail[i] === 2, col = burnt ? 'rgba(40,30,50,0.7)' : '#b48cf0', k = cam.scaleAt(c + 0.5, r + 0.5);
      const ctr = cam.project(c + 0.5, r + 0.5, z + 0.02);
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, k * 0.09); ctx.lineCap = 'round';
      for (const D of DIRS) { const cc = c + D.dx, rr = r + D.dy; if (!this.inside(cc, rr)) continue; const j = this.idx(cc, rr); if (!this.trail[j] && this.cells[j] !== BARREL && this.cells[j] !== SEALED) continue; const e = cam.project(c + 0.5 + D.dx * 0.5, r + 0.5 + D.dy * 0.5, z + 0.02); ctx.beginPath(); ctx.moveTo(ctr.x, ctr.y); ctx.lineTo(e.x, e.y); ctx.stroke(); }
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ctr.x, ctr.y, Math.max(2, k * 0.09), 0, Math.PI * 2); ctx.fill();
      if (!burnt) { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.3 * Math.sin(this.time * 4 + c + r)) + ')'; ctx.beginPath(); ctx.arc(ctr.x, ctr.y, Math.max(1, k * 0.04), 0, Math.PI * 2); ctx.fill(); }
    }
    hAt(c, r) { return this.inside(c, r) ? this.height[r * this.cols + c] : 0; }
    tAt(c, r) { return this.inside(c, r) ? this.terrain[r * this.cols + c] : T_VOID; }
    walkableTerrain(c, r) { const t = this.tAt(c, r); return t !== T_WATER && t !== T_VOID && t !== T_LAVA; }
    elevAt(c, r) { return this.elevators.length ? this.elevators.find(E => E.c === c && E.r === r) : null; }
    isPavement(t) { return t === T_SIDEWALK || t === T_CURB; }
    // Peut-on passer d'une case à l'autre ? (même niveau, ou une rampe entre les deux)
    canStep(c0, r0, c1, r1, who) {
      if (c0 === c1 && r0 === r1) return true; if (!this.inside(c0, r0) || !this.inside(c1, r1)) return false;
      const i0 = r0 * this.cols + c0, i1 = r1 * this.cols + c1;
      if (this.ramp[i0] || this.ramp[i1]) return !who || who.faller || who.npc || who.ghost || !!who.climbs;
      if (who && who.faller && !who.npc && this.height[i1] < this.height[i0] - 0.01) return true;   // le héros peut sauter en bas d'un rebord
      if (this.elevators.length && who && who.faller && (this.elevAt(c0, r0) || this.elevAt(c1, r1)) && Math.abs(this.height[i0] - this.height[i1]) < ((this.elevAt(c0,r0)?.auto||this.elevAt(c1,r1)?.auto)?.1:.45)) return true;   // on monte sur le plateau de l'ascenseur
      return Math.abs(this.height[i0] - this.height[i1]) < 0.01;
    }
    // Altitude du sol sous un point (les rampes montent en pente douce).
    rampHeights(c,r) {
      const lv=this.props[c+','+r]?.lv,base=lv==null?null:lv*LEVEL;
      const at=(cc,rr)=>{const h=this.hAt(cc,rr);return base==null?h:Math.max(base,Math.min(base+LEVEL,h));};
      return {hN:at(c,r-1),hS:at(c,r+1),hW:at(c-1,r),hE:at(c+1,r)};
    }
    groundZ(x, y) {
      const c = Math.floor(x), r = Math.floor(y); if (!this.inside(c, r)) return 0; const i = r * this.cols + c, rp = this.ramp[i];
      if (!rp) return this.height[i];
      if (rp === 1 || rp === -1) { const {hN,hS}=this.rampHeights(c,r); return hN + (hS - hN) * (y - r); }
      const {hW,hE}=this.rampHeights(c,r); return hW + (hE - hW) * (x - c);
    }
    hitTarget(letter, by) {
      const t = this.targets[letter]; if (!t || t.hit) return false; t.hit = true;
      this.burst(t.c + 0.5, t.r + 0.5, 0.5, '#ffd54a', 16); this.events.push({ type: 'targetHit', target: t, player: by });
      const key = letter.toLowerCase(), gates = this.gates[key] || [];
      for (const g of gates) { const i = this.idx(g.c, g.r); this.cells[i] = 0; const sp = this.special.get(g.c + ',' + g.r); if (sp && sp.bridge) this.terrain[i] = T_BRIDGE; sp.open = true; sp.openT = this.time; this.burst(g.c + 0.5, g.r + 0.5, 0.4, '#c9a24a', 8, 1); }
      if (gates.length) this.events.push({ type: 'gateOpened', letter: key, cells: gates, bridge: !!(this.special.get(gates[0].c + ',' + gates[0].r) || {}).bridge });
      return true;
    }
    // Baril dormant : une flamme l'allume, l'étincelle suit la traînée de poudre et détone au bout du chemin.
    igniteBarrel(c, r, by) {
      const i = this.idx(c, r); if (this.cells[i] !== BARREL) return;
      this.cells[i] = 0; this.sparks.push({ c, r, t: 0, by: by || null, age: 0 }); this.burst(c + 0.5, r + 0.5, 0.4, '#b48cf0', 14);
      this.events.push({ type: 'barrelLit', c, r });
    }
    updateSparks(dt) {
      for (const sp of this.sparks.slice()) {
        sp.t += dt; sp.age += dt; if (sp.t < 0.16) continue; sp.t = 0;
        const next = [];
        for (const D of DIRS) { const c = sp.c + D.dx, r = sp.r + D.dy; if (!this.inside(c, r)) continue; const i = this.idx(c, r); if (this.trail[i] === 1) next.push({ c, r }); else if (this.cells[i] === BARREL) this.igniteBarrel(c, r, sp.by); }
        if (!next.length) { this.sparks.splice(this.sparks.indexOf(sp), 1); this.blast(sp.c, sp.r, sp.by); continue; }
        next.forEach((n, k) => { this.trail[this.idx(n.c, n.r)] = 2; if (k === 0) { sp.c = n.c; sp.r = n.r; } else this.sparks.push({ c: n.c, r: n.r, t: 0, by: sp.by, age: 0 }); this.burst(n.c + 0.5, n.r + 0.5, 0.15, '#ffe36b', 3); });
      }
    }
    // Détonation magique (3 × 3) : ouvre les portes scellées, casse les blocs mous, allume les barils voisins.
    blast(c, r, by) {
      this.shake = Math.max(this.shake, 0.5); this.events.push({ type: 'blast', c, r });
      const fake = { owner: by, fire: 1 };
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const cc = c + dc, rr = r + dr; if (!this.inside(cc, rr)) continue; const i = this.idx(cc, rr), v = this.cells[i];
        if (v === HARD || v === GATE || v === TARGET) continue;
        if (v === SEALED) { this.cells[i] = 0; this.burst(cc + 0.5, rr + 0.5, 0.6, '#7b3fb0', 18, 1); this.events.push({ type: 'sealedOpened', c: cc, r: rr }); }
        else if (v === METAL) this.destroyMetal(cc, rr, by);
        else if (v === SOFT) this.destroyBlock(cc, rr, by);
        else if (v === BARREL) this.igniteBarrel(cc, rr, by);
        const f = this.addFlame(cc, rr, dc === 0 && dr === 0 ? 'center' : 'mid', dc ? (dc > 0 ? 3 : 1) : (dr > 0 ? 0 : 2), fake); f.magic = true;
      }
      this.burst(c + 0.5, r + 0.5, 0.8, '#e0c3ff', 24);
    }
    destroyMetal(c, r, by) {
      const i = this.idx(c, r); this.cells[i] = 0; this.metal[i] = -1; if (by) by.score += BK.BLOCK_SCORE * 3;
      this.burst(c + 0.5, r + 0.5, 0.6, '#9aa7b8', 16, 1); this.burst(c + 0.5, r + 0.5, 0.4, '#a0703a', 8, 1); this.events.push({ type: 'metalBroken', c, r, player: by });
    }
    splash(b) {
      const i = this.bombs.indexOf(b); if (i >= 0) this.bombs.splice(i, 1); b.exploded = true;
      if (b.owner) b.owner.bombsOut = Math.max(0, b.owner.bombsOut - 1);
      this.burst(b.x, b.y, 0.4, '#8fc8ff', 12); this.events.push({ type: 'splash', bomb: b });
    }
    idx(c, r) { return r * this.cols + c; }
    inside(c, r) { return c >= 0 && r >= 0 && c < this.cols && r < this.rows; }
    cell(c, r) { return this.inside(c, r) ? this.cells[r * this.cols + c] : HARD; }
    bombAt(c, r) { return this.bombs.find(b => (b.state === 'idle' || b.state === 'sliding') && b.cx === c && b.cy === r); }
    itemAt(c, r) { return this.items.find(i => i.cx === c && i.cy === r); }
    // Une case bloque-t-elle l'entité ? (les fantômes traversent les blocs mous ; un joueur peut quitter sa bombe)
    blocked(c, r, who) {
      const v = this.cell(c, r);
      if (v === HARD || v === TARGET || v === GATE || v === BARREL || v === SEALED || v === METAL) return true;
      if (this.explore) {
        // l'eau et le vide ne bloquent pas un joueur : il peut y tomber (et il y tombera)
        if (!this.walkableTerrain(c, r)) return !(who && who.faller && !who.npc && who.alive);
        if (who && who.x != null && !this.canStep(Math.floor(who.x), Math.floor(who.y), c, r, who)) return true;
      }
      if (v === SOFT) return !(who && who.ghost);
      if (this.solidEnemyAt(c, r)) return true;
      if (this.falling.some(f => f.c === c && f.r === r && f.z < 1.2)) return true;
      const b = this.bombAt(c, r);
      if (b && !b.underElevator && !(who && b.passers && b.passers.has(who))) return true;
      return false;
    }
    liftAt(c, r) { return this.lifts.length ? this.lifts.find(L => L.c === c && L.r === r) : null; }
    raiseLift(L) {
      if (L.moving) return; if (L.lv >= 4) { this.events.push({ type: 'liftMax', lift: L }); return; }
      L.from = this.hAt(L.c, L.r); L.lv++; L.to = L.lv * LEVEL; L.t = 0; L.moving = true; this.events.push({ type: 'liftUp', lift: L });
    }
    // Rails : les cases « ( » qui se touchent forment un chemin ; une plateforme (étage +1) y fait l'aller-retour,
    // s'arrête une seconde aux bouts, et emporte le héros et les bombes posés dessus.
    buildMovers() {
      const key = (c, r) => c + ',' + r, left = new Map(this.rails.map(x => [key(x.c, x.r), x]));
      for (const x of this.rails) this.baseH.set(this.idx(x.c, x.r), this.height[this.idx(x.c, x.r)]);
      const nbs = x => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dc, dr]) => left.get(key(x.c + dc, x.r + dr))).filter(Boolean);
      while (left.size) {
        let start = null; for (const x of left.values()) { if (nbs(x).length <= 1) { start = x; break; } } if (!start) start = left.values().next().value;
        const cells = []; let cur = start; while (cur) { cells.push({ c: cur.c, r: cur.r }); left.delete(key(cur.c, cur.r)); cur = nbs(cur)[0] || null; }
        const base = this.baseH.get(this.idx(cells[0].c, cells[0].r)) || 0;
        // la plateforme monte au niveau des cases d'embarquement (voisines des deux bouts du rail), un étage par défaut
        let top = 0; for (const end of [cells[0], cells[cells.length - 1]]) for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = end.c + dc, r = end.r + dr; if (!this.inside(c, r) || left.has(key(c, r)) || this.railAt(c, r) || this.cells[this.idx(c, r)] || !this.walkableTerrain(c, r) || this.ramp[this.idx(c, r)]) continue; top = Math.max(top, this.hAt(c, r)); }
        const M = { cells, pos: 0, dir: 1, speed: 1.3, wait: 0.6, x: cells[0].c + 0.5, y: cells[0].r + 0.5, base, top: top > base + 0.01 ? top : base + LEVEL };
        const pr=this.props[cells[0].c+','+cells[0].r]||{};M.speed=Math.max(.4,Math.min(3,Number(pr.platformSpeed)||1.3));M.pause=Math.max(.5,Number(pr.platformPause)||1.8);if(pr.platformLevel!=null)M.top=Number(pr.platformLevel)*LEVEL;M.pit=!!pr.platformPit;this.movers.push(M);
      }
      this.applyMovers();
    }
    railAt(c, r) { return this.rails.some(x => x.c === c && x.r === r); }
    moverAt(c, r) { return this.movers.find(M => Math.abs(M.x - c - 0.5) <= 0.5 + 1e-6 && Math.abs(M.y - r - 0.5) <= 0.5 + 1e-6) || null; }
    applyMovers() {
      for (const [i, b] of this.baseH) this.height[i] = b;
      for(const M of this.movers)if(M.pit)for(const q of M.cells)this.terrain[this.idx(q.c,q.r)]=T_VOID;
      for (const M of this.movers) for (let k = 0; k < M.cells.length; k++) { const cl = M.cells[k]; if (Math.abs(M.x - cl.c - 0.5) <= 0.9 && Math.abs(M.y - cl.r - 0.5) <= 0.9) {this.height[this.idx(cl.c, cl.r)] = M.top;if(M.pit)this.terrain[this.idx(cl.c,cl.r)]=T_STONE;} }   // la dalle (0,94 de large) couvre la case dès qu'elle la chevauche un peu
    }
    updateMovers(dt) {
      if (!this.movers.length) return;
      for (const M of this.movers) {
        const ox = M.x, oy = M.y, n = M.cells.length; if (n < 2) continue;
        if (M.wait > 0) M.wait -= dt;
        else { M.pos += M.dir * M.speed * dt; if (M.pos >= n - 1) { M.pos = n - 1; M.dir = -1; M.wait = M.pause||1.0; } else if (M.pos <= 0) { M.pos = 0; M.dir = 1; M.wait = M.pause||1.0; } }
        const k = Math.min(n - 2, Math.floor(M.pos)), u = M.pos - k, a = M.cells[k], b = M.cells[k + 1];
        M.x = a.c + 0.5 + (b.c - a.c) * u; M.y = a.r + 0.5 + (b.r - a.r) * u;
        const dx = M.x - ox, dy = M.y - oy; if (!dx && !dy) continue;
        const top = M.top, onIt = (x, y, z) => Math.abs(x - ox) <= 0.55 && Math.abs(y - oy) <= 0.55 && Math.abs(z - top) < 0.05;
        for (const p of this.players) if (p.alive && !p.air && !p.falling && onIt(p.x, p.y, this.groundZ(p.x, p.y))) { p.x = Math.max(M.x - 0.45, Math.min(M.x + 0.45, p.x + dx)); p.y = Math.max(M.y - 0.45, Math.min(M.y + 0.45, p.y + dy)); if (p.onBomb) { p.onBomb.x += dx; p.onBomb.y += dy; } }
        for (const bm of this.bombs) if (!bm.exploded && bm.state === 'idle' && bm.z < 0.01 && onIt(bm.x, bm.y, this.groundZ(bm.x, bm.y))) { bm.x += dx; bm.y += dy; bm.cx = Math.floor(bm.x); bm.cy = Math.floor(bm.y); }
      }
      this.applyMovers();
    }
    updateElevators(dt) {
      const ease = u => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      for (const E of this.elevators) {
        const i = this.idx(E.c, E.r);
        if(E.auto&&E.state==='rest'){E.t+=dt;if(E.t>=E.pause){E.state='up';E.t=0;}}
        if (E.state === 'up') { E.t += dt; const u = Math.min(1, E.t / (E.duration||2.6)); this.height[i] = E.rest + (E.top - E.rest) * ease(u); if (u >= 1) { E.state = 'wait'; E.t = 0; this.events.push({ type: 'elevatorTop', elevator: E }); } }
        else if (E.state === 'wait') { E.t += dt; if (E.t > (E.pause||3.5)) { E.state = 'down'; E.t = 0; } }
        else if (E.state === 'down') { E.t += dt; const u = Math.min(1, E.t / (E.duration||2.6)); this.height[i] = E.top + (E.rest - E.top) * ease(u); if (u >= 1) { E.state = 'rest'; E.t = 0; } }
      }
    }
    updateLifts(dt) {
      for (const L of this.lifts) {
        if (!L.moving) continue; L.t += dt; const u = Math.min(1, L.t / 0.9), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        this.height[this.idx(L.c, L.r)] = L.from + (L.to - L.from) * e;
        if (u >= 1) { L.moving = false; this.shake = Math.max(this.shake, 0.15); this.burst(L.c + 0.5, L.r + 0.5, 0.4, 'rgba(200,200,200,0.8)', 6); }
      }
    }
    // Le trajet d'un saut de monstre est-il dégagé (pas de mur, d'eau ni de changement d'étage) ?
    jumpClear(c0, r0, c1, r1) {
      const n = Math.ceil(Math.hypot(c1 - c0, r1 - r0) * 3), h0 = this.hAt(c0, r0);
      for (let k = 1; k < n; k++) { const u = k / n, cc = Math.floor(c0 + 0.5 + (c1 - c0) * u), rr = Math.floor(r0 + 0.5 + (r1 - r0) * u); if (!this.inside(cc, rr)) return false; const v = this.cell(cc, rr); if (v === HARD || v === METAL || v === SEALED || v === GATE || v === TARGET || v === BARREL) return false; if (!this.walkableTerrain(cc, rr) || (Math.abs(this.hAt(cc, rr) - h0) > 0.01 && !this.ramp[this.idx(cc, rr)])) return false; }
      return true;
    }
    solidEnemyAt(c, r) { for (const e of this.enemies) if (!e.dead && e.def.solid && Math.floor(e.x) === c && Math.floor(e.y) === r) return e; return null; }
    // from : position de départ ; une case qu'on chevauche déjà (au pied d'un rebord dont on vient de sauter) ne bloque pas
    // tant qu'on ne s'y enfonce pas davantage, sinon on y resterait collé.
    collides(x, y, rad, who, from) {
      const c0 = Math.floor(x - rad), c1 = Math.floor(x + rad), r0 = Math.floor(y - rad), r1 = Math.floor(y + rad);
      const d2 = (c, r, px, py) => { const nx = Math.max(c, Math.min(c + 1, px)), ny = Math.max(r, Math.min(r + 1, py)); return (nx - px) * (nx - px) + (ny - py) * (ny - py); };
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const burning=who?.ally&&this.flameAt.has(this.idx(c,r));
        if (!burning&&!this.blocked(c, r, who)) continue;
        const dn = d2(c, r, x, y); if (dn >= rad * rad) continue;
        if (from) { const d0 = d2(c, r, from.x, from.y); if (d0 < rad * rad && dn >= d0 - 1e-9) continue; }
        return { c, r };
      }
      return null;
    }

    // ------------------------------------------------------------------ joueurs
    addPlayer(def, c, r, o) {
      o = o || {};
      const p = { def, id: def.id, x: c + 0.5, y: r + 0.5, dir: 0, r: BK.PLAYER_R, speed: BK.speedOf(def.speed), speedUp: 0,
        bombsMax: o.bombs || 1, bombsOut: 0, fire: o.fire || 2, kick: !!o.kick, shield: 0, hp: o.hp || 40, maxHp: o.hp || 40, lives: o.lives == null ? 3 : o.lives,
        alive: true, invuln: o.invuln || 0, carrying: null, pose: 'idle', poseT: 0, animT: 0, walk: 0, moving: false, score: 0, kills: 0,
        staminaMax: o.staminaMax || 100, stamina: o.staminaMax || 100, staminaRegen: o.regen || 8, running: false, curSpeed: 0, lastTap: null, wasMoving: false, staminaWait: 0, dustT: 0,
        input: { dx: 0, dy: 0, bomb: false, action: false }, bot: o.bot || null, human: !o.bot, faller: true, falling: null, safe: { x: c + 0.5, y: r + 0.5, dir: 0 }, air: null, onBomb: null, zOff: 0, index: this.players.length, deadT: 0, wins: 0, color: def.outfit, name: def.name };
      this.players.push(p); return p;
    }
    drawWallDeco(ctx,cam,c,r,z,time) {
      const kind=this.props[c+','+r]?.wallDeco;if(!BK.WALL_DECOR.has(kind))return;
      // Décor plaqué sur la face visible du mur, dans le même ordre de profondeur.
      const dir=(this.props[c+','+r]?.orientation||0)%4;
      const [x,y,dx,dy]=[[c+.5,r+.985,.7,0],[c+.015,r+.5,0,.7],[c+.5,r+.015,-.7,0],[c+.985,r+.5,0,-.7]][dir];
      const base=cam.project(x,y,z-.06),right=cam.project(x+dx,y+dy,z-.06),up=cam.project(x,y,z+.44);
      ctx.save();ctx.transform(right.x-base.x,right.y-base.y,base.x-up.x,base.y-up.y,base.x,base.y);
      if(BK.BIOME_DECOR.some(it=>it.deco===kind))BK.sprites.drawBiomeDeco(ctx,kind,1,time,true);else if(kind.startsWith('castle_'))BK.sprites.drawCastleDeco(ctx,kind,1,time,true);else BK.sprites.drawCabinDeco(ctx,kind,1,time,c*17+r*5,true);ctx.restore();
    }
    seatPlacedNpc(p, c, r) {
      const kind=this.deco[this.idx(c,r)];
      if(!['chair','stool'].includes(kind))return false;
      const dir=(this.props[c+','+r]?.orientation||0)%4,D=DIRS[dir];p.seat={c,r,kind,back:{x:c+.5+D.dx,y:r+.5+D.dy}};
      p.x=c+.5+D.dx*.12;p.y=r+.5+D.dy*.12;p.dir=dir;p.moving=p.running=false;this.setPose(p,'sit');return true;
    }
    nearbySeat(p) {
      if(!p.human||p.npc||!p.alive||p.seat||p.boat||p.air||p.falling||p.fishing||p.carrying||p.heldSnail||p.drinkT>0||p.nearDisplay)return null;   // sur un article du comptoir, c'est l'achat qui compte
      const c=Math.floor(p.x),r=Math.floor(p.y);
      for(const d of DIRS){const x=c+d.dx,y=r+d.dy,kind=this.deco[this.idx(x,y)];
        if(this.inside(x,y)&&['chair','stool'].includes(kind)&&Math.hypot(x+.5-p.x,y+.5-p.y)<1.3&&Math.abs(this.hAt(x,y)-this.groundZ(p.x,p.y))<.1&&!this.players.some(q=>q.seat&&q.seat.c===x&&q.seat.r===y))return {c:x,r:y,kind};
      }return null;
    }
    useSeat(p) {
      if(p.seat){const seat=p.seat,candidates=[seat.back,...DIRS.map(d=>({x:seat.c+d.dx+.5,y:seat.r+d.dy+.5}))];
        const land=candidates.find(q=>this.inside(Math.floor(q.x),Math.floor(q.y))&&this.walkableTerrain(Math.floor(q.x),Math.floor(q.y))&&!this.blocked(Math.floor(q.x),Math.floor(q.y))&&Math.abs(this.groundZ(q.x,q.y)-this.hAt(seat.c,seat.r))<.1);
        if(!land)return false;p.seat=null;p.x=land.x;p.y=land.y;p.safe={x:p.x,y:p.y,dir:p.dir};this.setPose(p,'idle');return true;
      }
      const seat=this.nearbySeat(p);if(!seat)return false;
      p.seat={...seat,back:{x:p.x,y:p.y}};p.dir=(this.props[seat.c+','+seat.r]?.orientation||0)%4;const D=DIRS[p.dir];p.x=seat.c+.5+D.dx*.12;p.y=seat.r+.5+D.dy*.12;p.moving=p.running=false;this.setPose(p,'sit');return true;
    }
    nearHuman(p) { return this.players.some(q=>q!==p&&q.human&&!q.npc&&!q.ally&&q.alive&&Math.hypot(q.x-p.x,q.y-p.y)<1.65&&Math.abs(this.groundZ(q.x,q.y)-this.groundZ(p.x,p.y))<.5); }
    nearbyBoat(p) {
      if(!p.alive || p.seat || p.boat || p.ally || p.air || p.falling || p.fishing || p.drinkT>0 || p.carrying || p.heldSnail || this.groundZ(p.x,p.y)>.25)return null;
      return this.boats.find(b=>!b.rider && Math.hypot(b.x-p.x,b.y-p.y)<1.25 && Math.abs(Math.floor(b.x)-Math.floor(p.x))+Math.abs(Math.floor(b.y)-Math.floor(p.y))===1) || null;
    }
    boatLanding(p) {
      if(!p.boat || p.boat.rider!==p || p.moving)return null;
      const b=p.boat,c=Math.floor(b.x),r=Math.floor(b.y),dirs=[DIRS[p.dir],...DIRS.filter(d=>d!==DIRS[p.dir])];
      for(const d of dirs){const x=c+d.dx,y=r+d.dy;if(this.inside(x,y)&&this.walkableTerrain(x,y)&&this.hAt(x,y)<=.25&&!this.blocked(x,y)&&!this.itemAt(x,y)&&Math.hypot(x+.5-b.x,y+.5-b.y)<1.4&&!this.players.some(q=>q!==p&&q.alive&&Math.hypot(q.x-x-.5,q.y-y-.5)<.5)&&!this.enemies.some(e=>!e.dead&&Math.hypot(e.x-x-.5,e.y-y-.5)<.6))return {c:x,r:y};}return null;
    }
    boardAllies(boat, leader) {
      boat.passengers = this.players.filter(q=>q.ally && q.leader===leader && (q.alive || q.lives>0));
      for(const q of boat.passengers){
        this.dropCarried(q);q.boat=boat;q.x=boat.x;q.y=boat.y;q.air=q.falling=q.onBomb=q.fishing=null;q.zOff=0;
        q.path=[];q.planT=0;q.running=q.moving=false;q.input={dx:0,dy:0,bomb:false,action:false};
        this.setPose(q,q.alive?'idle':'dead');
      }
    }
    unloadAllies(boat, land) {
      // Cherche uniquement des cases reliées à la rive choisie, jamais l'autre côté de l'eau.
      const cells=[],queue=[land],seen=new Set();
      for(let i=0;i<queue.length && cells.length<(boat.passengers||[]).length+1;i++){
        const q=queue[i],key=q.c+','+q.r;if(seen.has(key))continue;seen.add(key);
        if(!this.inside(q.c,q.r)||!this.walkableTerrain(q.c,q.r)||this.blocked(q.c,q.r)||this.flameAt.has(this.idx(q.c,q.r)))continue;
        if(!this.itemAt(q.c,q.r)&&!this.enemies.some(e=>!e.dead&&Math.hypot(e.x-q.c-.5,e.y-q.r-.5)<.7)&&!this.players.some(p=>!p.boat&&p.alive&&Math.hypot(p.x-q.c-.5,p.y-q.r-.5)<.5))cells.push(q);
        for(const d of DIRS)if(this.canStep(q.c,q.r,q.c+d.dx,q.r+d.dy))queue.push({c:q.c+d.dx,r:q.r+d.dy});
      }
      for(const [i,q] of (boat.passengers||[]).entries()){
        const spot=cells[i]||land;q.boat=null;q.x=spot.c+.5;q.y=spot.r+.5;q.safe={x:q.x,y:q.y,dir:q.dir};
        q.path=[];q.planT=0;q.input={dx:0,dy:0,bomb:false,action:false};q.moving=q.running=false;
      }
      boat.passengers=[];
    }
    useBoat(p) {
      if(p.boat){const boat=p.boat;if(boat.rider!==p)return false;const land=this.boatLanding(p);if(!land)return false;boat.rider=null;p.boat=null;p.x=land.c+.5;p.y=land.r+.5;p.safe={x:p.x,y:p.y,dir:p.dir};p.moving=false;this.setPose(p,'idle');this.unloadAllies(boat,land);return true;}
      const b=this.nearbyBoat(p);if(!b)return false;p.boat=b;b.rider=p;p.x=b.x;p.y=b.y;p.onBomb=p.air=p.falling=null;p.zOff=0;p.running=false;p.moving=false;this.boardAllies(b,p);return true;
    }
    updateBoat(p,dt) {
      const b=p.boat,inp=p.input;
      if(b.rider!==p){p.x=b.x;p.y=b.y;p.dir=b.dir;p.moving=p.running=false;p.pose='idle';inp.dx=inp.dy=0;inp.bomb=inp.action=false;return;}
      let dx=inp.dx||0,dy=inp.dy||0,n=Math.hypot(dx,dy);if(p.frozen>0){p.frozen=Math.max(0,p.frozen-dt);dx=dy=n=0;}if(n>1){dx/=n;dy/=n;}
      p.moving=n>.05;p.running=false;p.pose='idle';if(p.moving)p.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?3:1):(dy>0?0:2);
      const water=(x,y)=>[[0,0],[-.25,0],[.25,0],[0,-.25],[0,.25]].every(([ox,oy])=>this.tAt(Math.floor(x+ox),Math.floor(y+oy))===T_WATER&&!this.cell(Math.floor(x+ox),Math.floor(y+oy)))&&!this.boats.some(other=>other!==b&&Math.hypot(other.x-x,other.y-y)<.7);
      const steps=Math.max(1,Math.ceil(dt*2.5/.1));for(let i=0;i<steps;i++){let x=b.x+dx*2.5*dt/steps,y=b.y+dy*2.5*dt/steps;if(water(x,b.y))b.x=x;if(water(b.x,y))b.y=y;}
      b.dir=p.dir;if(p.moving)b.rowT+=dt*7;p.x=b.x;p.y=b.y;p.nearDoor=p.nearDisplay=p.nearFire=p.nearFountain=null;
      for(const q of b.passengers||[]){q.x=b.x;q.y=b.y;q.dir=b.dir;}
      inp.bomb=false;if(inp.action){inp.action=false;this.useBoat(p);}
    }
    updateAlly(p, dt) {
      BK.ai.updateAllyBombAlert(this,p);
      const leader=p.leader;p.input.dx=p.input.dy=0;
      if(p.swallowedBy)return;
      if(!leader?.alive)return;
      if(p.boat){if(!p.alive&&p.lives>0&&p.deadT>2){this.revive(p,Math.floor(p.boat.x),Math.floor(p.boat.y));p.poison=0;}return;}
      if(!p.alive) {if(p.lives>0 && p.deadT>2){const spot=this.freeCellNear(Math.floor(leader.x),Math.floor(leader.y));if(spot){this.revive(p,spot.c,spot.r);p.poison=0;p.falling=p.air=null;}}return;}
      const rescue=leader.swallowedBy&&!leader.swallowedBy.dead?leader.swallowedBy:null;
      if(p.rescueTarget!==rescue){p.rescueTarget=rescue;p.path=[];p.planT=0;p.firebarPlan=null;}
      const retreat=p.hp<=p.maxHp*.25;
      if(p.retreating!==retreat){p.retreating=retreat;p.path=[];p.planT=0;p.retreatT=0;p.firebarPlan=null;}
      if(BK.ai.allyArenaEvade(this,p,dt))return;
      if(BK.ai.allyFirebars(this,p,dt))return;
      if(BK.ai.allyBombs(this,p,dt))return;
      if(p.retreating){BK.ai.allyRetreat(this,p,dt);return;}
      p.attackT=Math.max(0,(p.attackT||0)-dt);
      const enemies=BK.ai.allyCombatEnemies(this,p,5);
      enemies.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));const enemy=enemies[0];
      if(enemy && Math.hypot(enemy.x-p.x,enemy.y-p.y)<1.15 && this.canSee(p,enemy,1.15) && Math.abs(this.groundZ(p.x,p.y)-this.groundZ(enemy.x,enemy.y))<.1 && !this.cell(Math.floor(enemy.x),Math.floor(enemy.y))) {
        if(!p.attackT){this.hurtEnemy(enemy,p,1,'other');p.attackT=.8;this.setPose(p,'throw',.25);this.burst(enemy.x,enemy.y,.5,'#ffdf85',5);}return;
      }
      p.planT=(p.planT||0)-dt;
      if(p.planT<=0) {
        p.planT=.3;const danger=BK.ai.allyDanger(this), bfs=BK.ai.bfs(this,p,danger), target=enemy||leader;
        let best=-1,score=Infinity;
        for(let k=0;k<bfs.dist.length;k++){if(bfs.dist[k]<0||danger[k]!==Infinity)continue;const c=k%this.cols,r=Math.floor(k/this.cols);if(this.special.get(c+','+r)?.type==='exit')continue;const d=Math.hypot(c+.5-target.x,r+.5-target.y),s=Math.abs(d-(enemy ? enemy.arenaBoss?2.5:.6 : 1.25))+bfs.dist[k]*.025;if(s<score){score=s;best=k;}}
        p.path=best<0?[]:BK.ai.pathTo(this,bfs,best%this.cols,Math.floor(best/this.cols));
      }
      BK.ai.allyFollow(p,p.path);
      const nextC=Math.floor(p.x+p.input.dx*p.speed*dt*2),nextR=Math.floor(p.y+p.input.dy*p.speed*dt*2);
      if(BK.ai.allyDanger(this)[this.idx(nextC,nextR)]!==Infinity){p.input.dx=p.input.dy=0;p.vx=p.vy=0;p.path=[];p.planT=0;}
    }
    nearbySnailNames(cam) {
      const humans=this.players.filter(p=>p.human&&!p.npc&&p.alive&&!p.falling),labels=[];
      for(const e of this.enemies){
        if(e.type!=='escargot'||e.dead||!e.nickname)continue;
        const near=e.carrier?humans.includes(e.carrier):humans.some(p=>Math.abs(this.groundZ(p.x,p.y)-this.groundZ(e.x,e.y))<.15&&this.canSee(e,p,2));if(!near)continue;
        const who=e.carrier||e,pr=cam.project(who.x,who.y,this.groundZ(who.x,who.y));
        labels.push({text:e.nickname,x:pr.x,y:pr.y-pr.k*(e.carrier?1.15:.36)});
      }
      const seen=new Set();
      for(const p of humans){const near=this.nearbyTerrarium(p);if(!near||seen.has(near.key))continue;seen.add(near.key);
        const pr=this.props[near.key],point=cam.project(near.c+.5,near.r+.5,this.hAt(near.c,near.r)),dir=((pr.orientation||0)%4+4)%4;
        (pr.snails||[]).forEach((sn,i)=>{if(!sn.nickname)return;const pose=BK.sprites.terrariumSnailPose(this.time,near.c*17+near.r*5,pr,i),x=pose.x,y=pose.y-.16;
          const dx=dir===2?-x:dir===1?x*.65:dir===3?-x*.65:x,dy=y+(dir===1?x*.16:dir===3?-x*.16:0);
          labels.push({text:sn.nickname,x:point.x+dx*point.k,y:point.y+dy*point.k});
        });
      }return labels;
    }
    drawSnailNames(ctx,cam) {
      const placed=[];ctx.save();ctx.font='bold 12px Nunito, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      for(const label of this.nearbySnailNames(cam)){
        const w=Math.min(180,ctx.measureText(label.text).width+16),h=22,x=Math.max(8,Math.min(BK.W-w-8,label.x-w/2));let y=label.y-h;
        while(placed.some(b=>x<b.x+b.w+4&&x+w+4>b.x&&y<b.y+b.h+4&&y+h+4>b.y))y-=h+4;
        y=Math.max(8,y);placed.push({x,y,w,h});
        ctx.strokeStyle='rgba(230,242,215,.8)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+w/2,y+h);ctx.lineTo(label.x,label.y+5);ctx.stroke();
        ctx.fillStyle='rgba(255,250,228,.96)';BK.sprites.rr(ctx,x,y,w,h,9);ctx.fill();ctx.fillStyle='#41543c';ctx.fillText(label.text,x+w/2,y+h/2,w-12);
      }ctx.restore();
    }
    nearbyTerrarium(p) {
      if(!p.alive||p.boat||p.air||p.falling||p.seat) return null;
      let best=null,dist=1.65;
      for(const [key,pr] of Object.entries(this.props)) {
        if(pr.deco!=='terrarium')continue;const [c,r]=key.split(',').map(Number),d=Math.hypot(c+.5-p.x,r+.5-p.y);
        if(this.deco[this.idx(c,r)]==='terrarium'&&d<dist&&Math.abs(c-Math.floor(p.x))+Math.abs(r-Math.floor(p.y))===1&&Math.abs(this.hAt(c,r)-this.groundZ(p.x,p.y))<0.1){best={key,c,r};dist=d;}
      }return best;
    }
    feedTerrarium(p,key) {
      if(this.nearbyTerrarium(p)?.key!==key)return false;
      const pr=this.props[key],inv=p.inv||[],i=inv.findIndex(s=>s.type==='carrot'&&s.n>0);
      if(i<0||!pr.snails?.length||pr.snailFood)return false;
      const s=inv[i];s.n--;s.perm=Math.min(s.perm||0,s.n);if(!s.n)inv.splice(i,1);
      const [c,r]=key.split(',').map(Number),seed=c*17+r*5;
      pr.snailFood={elapsed:0,breeding:pr.snails.filter(s=>!s.baby).length>=2,starts:pr.snails.map((sn,i)=>{const phase=this.time*.22+i*2.3+seed*.1;return {x:Math.sin(phase)*.31,y:-.31-(i%3)*.105,baby:!!sn.baby,growth:sn.growth||0};})};
      BK.inventoryLayout?.(p);return true;
    }
    terrariumHungry(pr) { return pr?.deco==='terrarium'&&pr.snails?.length>0&&!pr.snailFood&&!(pr.snailSatiety>0); }
    updateTerrariums(dt) {
      for(const pr of Object.values(this.props))if(pr.deco==='terrarium')pr.snailSatiety=Math.max(0,(pr.snailSatiety||0)-dt);
      for(const pr of Object.values(this.props))if(pr.deco==='terrarium'&&pr.snailFood){
        pr.snailFood.elapsed+=dt;
        if(pr.snailFood.elapsed>=12){
          const parents=pr.snails.filter(s=>!s.baby);
          if(pr.snailFood.breeding&&parents.length>=2&&pr.snails.length<8&&Math.random()<.35){
            const parent=parents[Math.floor(Math.random()*2)];pr.snails.push({color:parent.color,baby:true,perm:false});
            this.events.push({type:'snailBorn',color:parent.color});
          }
          pr.snails.forEach((sn,i)=>{if(sn.baby&&pr.snailFood.starts[i]?.baby){sn.growth=Math.min(3,(sn.growth||0)+1);if(sn.growth===3){sn.baby=false;this.events.push({type:'snailGrown'});}}});
          pr.snailFood=null;pr.snailSatiety=60;
        }
      }
    }
    renameTerrariumSnail(p,key,index,name) {
      if(this.nearbyTerrarium(p)?.key!==key||!Number.isInteger(index))return false;
      const sn=this.props[key].snails?.[index];if(!sn)return false;sn.nickname=BK.snailName(name);return true;
    }
    addSnailToBag(p,sn) {
      const type=BK.snailItemType(sn),old=(p.inv||[]).find(s=>s.type===type);if(old)BK.snailStack(old);
      if(!this.applyItem(p,{type,value:1},!!sn.perm))return false;
      const slot=p.inv.find(s=>s.type===type);BK.snailStack(slot);slot.snails[slot.n-1]={color:sn.color||sn.shellColor||'default',baby:!!sn.baby,growth:sn.growth||0,nickname:BK.snailName(sn.nickname),perm:!!sn.perm};return true;
    }
    takeBagSnail(p,slot,index=0) {
      const list=BK.snailStack(slot);if(!Number.isInteger(index)||index<0||index>=list.length)return null;
      const sn=list.splice(index,1)[0];slot.n--;slot.perm=list.filter(s=>s.perm).length;if(!slot.n)p.inv.splice(p.inv.indexOf(slot),1);return sn;
    }
    terrariumTransfer(p,key,type,take=false,index=null) {
      if(this.nearbyTerrarium(p)?.key!==key || !BK.ITEMS[type]?.snailColor)return false;
      const pr=this.props[key];pr.snails=pr.snails||[];
      if(take){
        const i=index==null?pr.snails.findIndex(s=>BK.snailItemType(s)===type):index;
        if(!Number.isInteger(i)||i<0||!pr.snails[i]||BK.snailItemType(pr.snails[i])!==type)return false;
        if(!this.addSnailToBag(p,pr.snails[i]))return false;
        pr.snails.splice(i,1);if(pr.snailFood){pr.snailFood.starts.splice(i,1);if(!pr.snails.length)pr.snailFood=null;}
      }else{
        const slot=(p.inv||[]).find(s=>s.type===type&&s.n>0);if(!slot||pr.snails.length>=8)return false;
        const sn=this.takeBagSnail(p,slot,index==null?0:index);if(!sn)return false;
        pr.snails.push(sn);if(pr.snailFood)pr.snailFood.starts.push({x:-.3,y:-.31});
      }
      BK.inventoryLayout?.(p);return true;
    }
    stowSnail(p) {
      const e=p.heldSnail;
      if(!e || !p.alive || !this.enemies.includes(e)) return false;
      const color=BK.SNAIL_COLORS[e.shellColor]?e.shellColor:'default';
      if(!this.addSnailToBag(p,e)) return false;
      this.enemies.splice(this.enemies.indexOf(e),1);e.carrier=null;p.heldSnail=null;
      BK.inventoryLayout?.(p);return true;
    }
    snailDropSpot(p,e) {
      const D=DIRS[p.dir],c=Math.floor(p.x),r=Math.floor(p.y);
      return [{c:c+D.dx,r:r+D.dy},{c,r}].find(q=>this.inside(q.c,q.r)&&this.walkableTerrain(q.c,q.r)&&!this.blocked(q.c,q.r,e)&&!this.bombAt(q.c,q.r)&&!this.flameAt.has(this.idx(q.c,q.r))&&Math.abs(this.groundZ(q.c+.5,q.r+.5)-this.groundZ(p.x,p.y))<0.25&&this.special.get(q.c+','+q.r)?.type!=='exit');
    }
    releaseSnail(p) { if(p.heldSnail) { p.heldSnail.carrier=null; p.heldSnail.target=null; p.heldSnail=null; } }
    nearbySnail(p) {
      if (!p.alive || !p.human || p.npc || p.carrying || p.heldSnail || p.seat || p.boat || p.air || p.falling) return null;
      return this.enemies.find(e=>e.type==='escargot' && !e.dead && !e.carrier && e.shell>=0.95 && this.canSee(e,p,1.4)) || null;
    }
    useSnail(p) {
      if (!p.alive || p.air || p.falling || p.boat || p.seat) return false;
      if (p.heldSnail) {
        const e=p.heldSnail;
        const spot=this.snailDropSpot(p,e);
        if (!spot) return true;
        e.x=spot.c+.5; e.y=spot.r+.5; e.home={...spot}; e.target=null; e.pause=0.5; e.carrier=null; p.heldSnail=null;
        this.setPose(p,'place',0.3); return true;
      }
      const e=this.nearbySnail(p); if (!e) return false;
      p.heldSnail=e; e.carrier=p; e.target=null; e.shell=1;
      this.setPose(p,'pickup',0.4); return true;
    }
    nearbyPet(p) {
      if (!p.alive || p.npc || !p.human || p.air || p.falling || p.carrying) return null;
      return this.enemies.filter(e => !e.dead && !!BK.PET_FOODS[e.type] && e.def.peaceful && !p.swallowedBy && Math.abs(this.groundZ(e.x,e.y)-this.groundZ(p.x,p.y))<.3 && this.canSee(e, p, 1.4)).sort((a,b) => Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0] || null;
    }
    petFood(p,e) {
      return (BK.PET_FOODS[e.type]||[]).find(type=>(p.inv||[]).some(s=>s.type===type&&s.n>0));
    }
    drawPetFood(ctx,cam) {
      this.petFoodRects=[];
      const p=this.players.find(p=>p.human&&!p.npc&&!p.ally&&p.alive);
      if(!p||p.air||p.falling||p.swallowedBy||p.carrying)return;
      for(const e of this.enemies){
        if(e.dead||!BK.PET_FOODS[e.type]||!this.canSee(e,p,1.4)||Math.abs(this.groundZ(e.x,e.y)-this.groundZ(p.x,p.y))>.3)continue;
        const pr=cam.project(e.x,e.y,this.groundZ(e.x,e.y)),w=54,h=46;
        if(pr.x<0||pr.x>BK.W||pr.y<0||pr.y>BK.H)continue;
        const x=Math.max(8,Math.min(BK.W-w-8,pr.x-w/2));let y=Math.max(8,pr.y-pr.k*.95-h);
        while(this.petFoodRects.some(r=>x<r.x+r.w+4&&x+w+4>r.x&&y<r.y+r.h+4&&y+h+4>r.y))y-=h+6;
        if(y<8)continue;
        const count=(p.inv||[]).reduce((n,s)=>n+(BK.PET_FOODS[e.type].includes(s.type)?Math.max(0,s.n):0),0);
        ctx.save();ctx.fillStyle=count?'#fff0b5':'#d0d0d5';ctx.strokeStyle=count?'#efae44':'#92929d';ctx.lineWidth=3;BK.sprites.rr(ctx,x,y,w,h,14);ctx.fill();ctx.stroke();
        ctx.beginPath();ctx.moveTo(x+w/2-6,y+h);ctx.lineTo(x+w/2+6,y+h);ctx.lineTo(x+w/2,y+h+8);ctx.closePath();ctx.fill();
        ctx.save();if(!count){ctx.filter='grayscale(1)';ctx.globalAlpha=.45;}ctx.font='25px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(BK.ITEMS[this.petFood(p,e)||BK.PET_FOODS[e.type][0]].icon,x+w/2,y+17);ctx.restore();
        ctx.font='900 12px Nunito,sans-serif';ctx.fillStyle=count?'#47355f':'#656572';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(count?'×'+count:'Vide',x+w/2,y+36,w-8);ctx.restore();
        if(e.def.wildlife){const bond=e.bond?.owner===p.id?e.bond:{pets:0,meals:0};ctx.save();ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffe8a3';ctx.strokeStyle='#483b57';ctx.lineWidth=3;const label=bond.pets>=2&&bond.meals>=1?'♥ Ami protecteur':'♥ '+Math.min(2,bond.pets)+'/2 caresses · '+Math.min(1,bond.meals)+'/1 repas';ctx.strokeText(label,x+w/2,y-9);ctx.fillText(label,x+w/2,y-9);ctx.restore();}
        this.petFoodRects.push({x,y,w,h,pet:e,count});
      }
    }
    bondPet(p,e,care) {
      if(!e.def.wildlife||!e.def.peaceful)return;
      if(e.bond?.owner!==p.id)e.bond={owner:p.id,pets:0,meals:0};
      const was=e.bond.pets>=2&&e.bond.meals>=1;
      if(care==='meal')e.bond.meals++;else if(this.time>=(e.nextBondPet||0)){e.bond.pets++;e.nextBondPet=this.time+1.2;}
      if(!was&&e.bond.pets>=2&&e.bond.meals>=1)this.addFloater(e.x,e.y,'♥ Nouvel ami !',{color:'#ffb1d5',size:.3,life:2});
    }
    feedPet(p,e,type) {
      if(!p.alive||p.npc||p.swallowedBy||p.air||p.falling||p.carrying||!this.enemies.includes(e)||e.dead||!BK.PET_FOODS[e.type]?.includes(type)||!this.canSee(e,p,1.4)||Math.abs(this.groundZ(e.x,e.y)-this.groundZ(p.x,p.y))>.3)return false;
      const inv=p.inv||[],i=inv.findIndex(s=>s.type===type&&s.n>0);if(i<0)return false;
      const slot=inv[i];slot.n--;slot.perm=Math.min(slot.perm||0,slot.n);if(!slot.n)inv.splice(i,1);
      this.bondPet(p,e,'meal');
      e.follow=p;e.followT=Math.min(180,Math.max(0,e.followT||0)+60);e.fedT=e.followT;e.followReady=false;e.target=null;e.pause=.8;e.petT=.8;e.heartT=.8;
      this.setPose(p,'place',.3);this.burst(e.x,e.y,.4,'#ffb1ca',8);this.events.push({type:'pet',player:p,animal:e,voice:true,carry:true});e.petVoiceAt=this.time+.85;return true;
    }
    petAnimal(p) {
      const e = this.nearbyPet(p); if (!e) return false;
      this.bondPet(p,e,'pet');
      e.petT = 1.1; e.pause = 1.1; e.target = null; e.follow = p; e.followT = Math.max(e.followT||0,8); e.followReady = false;
      this.setPose(p, 'pickup', 0.6); p.running = false;
      if (!e.heartT || e.heartT <= 0) {
        e.heartT = 0.8;
        for (let k=0;k<5;k++) this.particles.push({ x:e.x+(Math.random()-0.5)*0.5, y:e.y, z:(this.explore?this.groundZ(e.x,e.y):0)+0.5, gz:0, vx:0, vy:0, vz:0.6, life:1.2, t:0, color:'#ff8fab', size:0.13, heart:true, float:true });
      }
      const voice=this.time>=(e.petVoiceAt||0);if(voice)e.petVoiceAt=this.time+.85;
      this.events.push({ type:'pet', player:p, animal:e, voice, carry:true }); return true;
    }
    // Plusieurs sorties de pièce ; réparation seulement des anciennes pièces sans aucune porte.
    ensureRoomExit(fallback = true) {
      this.roomExit = true; this.roomExits=[];
      for(const [key,sp] of this.special)if(sp.type==='exit'){
        const [c,r]=key.split(',').map(Number),exit={c,r,x:c+.5,y:r+.5,kind:'door',open:true};
        sp.exit=exit;this.roomExits.push(exit);this.terrain[this.idx(c,r)]=FLOORS.y;
      }
      this.exit=this.roomExits[0]||null;
      if(this.roomExits.length || !fallback)return;
      const st = this.starts[0] || { c:1, r:1 }, seen = new Set(), cells = [], queue = [st];
      for (let n=0;n<queue.length;n++) {
        const q=queue[n], key=q.c+','+q.r; if(seen.has(key)) continue; seen.add(key);
        if(!this.inside(q.c,q.r) || this.blocked(q.c,q.r,{x:q.c+0.5,y:q.r+0.5})) continue;
        cells.push(q);
        for(const D of DIRS) if(this.canStep(q.c,q.r,q.c+D.dx,q.r+D.dy)) queue.push({c:q.c+D.dx,r:q.r+D.dy});
      }
      const candidates=cells.filter(q=>q.c!==st.c||q.r!==st.r).sort((a,b)=>b.r-a.r||Math.abs(a.c-st.c)-Math.abs(b.c-st.c));
      const q=candidates[0] || {c:st.c,r:Math.min(this.rows-1,st.r+1)}, i=this.idx(q.c,q.r);
      this.cells[i]=0; this.deco[i]=null; this.terrain[i]=this.tAt(st.c,st.r); this.height[i]=this.hAt(st.c,st.r);
      this.exit={c:q.c,r:q.r,x:q.c+0.5,y:q.r+0.5,kind:'door',open:true}; this.special.set(q.c+','+q.r,{type:'exit',exit:this.exit});this.roomExits=[this.exit];
    }
    // Personnage non joueur (grands-parents) : se tient là, se tourne vers qui lui parle, ne peut pas être blessé.
    addNpc(def, c, r, lines) { const p = this.addPlayer(def, c, r, { bot: null }); p.npc = true; p.human=false; p.lines = lines || []; p.lineIndex = 0; p.say = ''; p.sayT = 0; p.dir = 0; this.seatPlacedNpc(p,c,r); return p; }
    talkTo(speaker) {
      let best = null, bd = 1.6; for (const n of this.players) { if (!n.npc) continue; const d = Math.hypot(n.x - speaker.x, n.y - speaker.y); if (d < bd) { bd = d; best = n; } }
      if (!best || !best.lines.length) return false;
      BK.say(best, best.lines[best.lineIndex % best.lines.length]); best.lineIndex++;
      const dx = speaker.x - best.x, dy = speaker.y - best.y; if(!best.seat) best.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : (dy > 0 ? 0 : 2);
      this.events.push({ type: 'talk', npc: best, text: best.say }); return true;
    }
    setPose(p, pose, dur) { p.pose = pose; p.poseT = 0; p.poseDur = dur || 0; }
    // Petit saut sur une bombe posée : on atterrit dessus et on y reste en rebondissant.
    hopOnto(p, b) {
      b.passers = b.passers || new Set(); b.passers.add(p);
      const gz = (x, y) => this.explore ? this.groundZ(x, y) : 0;
      p.air = { x0: p.x, y0: p.y, z0: gz(p.x, p.y) + (p.zOff || 0), x1: b.x, y1: b.y, z1: gz(b.x, b.y) + 0.55, h: 0.45, t: 0, dur: 0.3, bomb: b };
      p.running = false; p.onBomb = null; this.setPose(p, 'jump', 99); this.events.push({ type: 'hop', player: p });
    }
    // Grand bond depuis la bombe : deux cases dans la direction, sinon une ; on peut retomber sur un plateau plus haut,
    // sur une autre bombe, ou dans l'eau. Rien de libre : on rebondit sur place.
    leap(p, dir) {
      const D = DIRS[dir], c0 = Math.floor(p.x), r0 = Math.floor(p.y), gz = (x, y) => this.explore ? this.groundZ(x, y) : 0;
      let target = null;
      // deux cases plus loin (un gros champignon juste à côté compte aussi) ; si c'est bloqué (mur, bloc, monstre solide,
      // trop haut), on continue jusqu'à la première case libre (5 au plus)
      { const c1 = c0 + D.dx, r1 = r0 + D.dy; if (this.inside(c1, r1) && this.deco[this.idx(c1, r1)] === 'bigmushroom') target = { x: c1 + 0.5, y: r1 + 0.5, z: gz(c1 + 0.5, r1 + 0.5) + MUSH_TOP, bomb: null, mush: true }; }
      for (let d = 2; d <= 5 && !target; d++) {
        const c = c0 + D.dx * d, r = r0 + D.dy * d; if (!this.inside(c, r)) break;
        const v = this.cells[this.idx(c, r)], mush = this.deco[this.idx(c, r)] === 'bigmushroom';
        if (mush) { target = { x: c + 0.5, y: r + 0.5, z: gz(c + 0.5, r + 0.5) + MUSH_TOP, bomb: null, mush: true }; break; }
        if (v && v !== 0) continue;
        if (this.falling.some(f => f.c === c && f.r === r) || this.solidEnemyAt(c, r)) continue;
        if (this.explore && this.walkableTerrain(c, r) && gz(c + 0.5, r + 0.5) > gz(p.x, p.y) + 0.55 + 0.1) continue;   // trop haut : un étage de plus, pas deux
        const b = this.bombAt(c, r); target = { x: c + 0.5, y: r + 0.5, z: (this.explore && !this.walkableTerrain(c, r) ? 0 : gz(c + 0.5, r + 0.5)) + (b ? 0.55 : 0), bomb: b || null };
      }
      const from = p.onBomb; p.onBomb = null;
      if (!target) target = { x: p.x, y: p.y, z: gz(p.x, p.y) + 0.55, bomb: from };
      p.air = { x0: p.x, y0: p.y, z0: gz(p.x, p.y) + (p.zOff || 0), x1: target.x, y1: target.y, z1: target.z, h: target.mush ? 1.1 : 0.9, t: 0, dur: target.x === p.x && target.y === p.y ? 0.45 : target.mush ? 0.55 : 0.5, bomb: target.bomb, dir };
      this.setPose(p, 'jump', 99); this.events.push({ type: 'leap', player: p });
    }
    updateAir(p, dt) {
      const a = p.air; a.t += dt; p.animT += dt; p.poseT += dt; const u = Math.min(1, a.t / a.dur);
      if (a.control && (p.input.dx || p.input.dy)) {   // après un rebond, on dirige très légèrement le vol
        const ox = a.ox1 == null ? (a.ox1 = a.x1) : a.ox1, oy = a.oy1 == null ? (a.oy1 = a.y1) : a.oy1;
        a.x1 = Math.max(ox - 0.6, Math.min(ox + 0.6, a.x1 + p.input.dx * 1.4 * dt)); a.y1 = Math.max(oy - 0.6, Math.min(oy + 0.6, a.y1 + p.input.dy * 1.4 * dt));
        const c = Math.floor(a.x1), r = Math.floor(a.y1); if (!this.inside(c, r) || (this.cell(c, r) && this.deco[this.idx(c, r)] !== 'bigmushroom') || this.solidEnemyAt(c, r)) { a.x1 = ox; a.y1 = oy; }
      }
      p.x = a.x0 + (a.x1 - a.x0) * u; p.y = a.y0 + (a.y1 - a.y0) * u;
      const z = a.z0 + (a.z1 - a.z0) * u + a.h * Math.sin(Math.PI * u);
      p.zOff = z - (this.explore ? this.groundZ(p.x, p.y) : 0);
      if (u < 1) return;
      p.air = null; p.x = a.x1; p.y = a.y1;
      const mc = Math.floor(p.x), mr = Math.floor(p.y);
      if (this.deco[this.idx(mc, mr)] === 'bigmushroom') { this.bounce(p, mc, mr, a); return; }
      const b = this.bombAt(Math.floor(p.x), Math.floor(p.y));
      if (b && b.state === 'idle' && !b.exploded) { p.onBomb = b; p.leapLock = true; b.passers = b.passers || new Set(); b.passers.add(p); p.zOff = 0.55; this.setPose(p, 'idle'); }
      else { p.onBomb = null; p.zOff = 0; p.safe = p.safe; this.setPose(p, 'idle'); this.burst(p.x, p.y, 0.2, 'rgba(230,220,200,0.8)', 3); this.events.push({ type: 'land', player: p }); }
    }
    // Gros champignon = trampoline : on rebondit dessus et on repart 3 cases plus loin dans la même direction
    // (2 ou 1 si c'est bloqué ; sinon on retombe d'où l'on vient). En vol, on peut se déplacer un petit peu.
    bounce(p, mc, mr, a) {
      const gz = (x, y) => this.explore ? this.groundZ(x, y) : 0;
      let dir = a.dir; if (dir == null) { const dx = a.x1 - a.x0, dy = a.y1 - a.y0; dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 3) : (dy < 0 ? 2 : 0); }
      const D = DIRS[dir]; let target = null;
      const free = (c, r) => this.inside(c, r) && (!this.cell(c, r) || this.deco[this.idx(c, r)] === 'bigmushroom') && !this.solidEnemyAt(c, r) && !this.falling.some(f => f.c === c && f.r === r);
      for (let d = 3; d >= 1 && !target; d--) { const c = mc + D.dx * d, r = mr + D.dy * d; if (free(c, r)) target = { c, r }; }
      if (!target) { const c = mc - D.dx, r = mr - D.dy; if (free(c, r)) target = { c, r }; }
      this.bounceT.set(this.idx(mc, mr), 0.45); this.burst(p.x, p.y, 0.35, 'rgba(255,255,255,0.8)', 8); this.events.push({ type: 'bounce', player: p });
      if (!target) { p.zOff = 0; p.onBomb = null; this.setPose(p, 'idle'); return; }
      const tm = this.deco[this.idx(target.c, target.r)] === 'bigmushroom', b = tm ? null : this.bombAt(target.c, target.r);
      const z1 = tm ? gz(target.c + 0.5, target.r + 0.5) + MUSH_TOP : (this.explore && !this.walkableTerrain(target.c, target.r) ? 0 : gz(target.c + 0.5, target.r + 0.5)) + (b ? 0.55 : 0);
      p.air = { x0: p.x, y0: p.y, z0: gz(p.x, p.y) + MUSH_TOP, x1: target.c + 0.5, y1: target.r + 0.5, z1, h: 1.6, t: 0, dur: 0.8, bomb: b, dir, control: true };
      p.dir = dir; this.setPose(p, 'jump', 99);
    }
    // Chute dans l'eau (plouf, on coule) ou dans le vide (on tombe en rapetissant) : un cœur de moins,
    // puis on réapparaît sur la dernière case sûre. Sans cœur restant, c'est la mort.
    startFall(p, kind) {
      if (p.falling || !p.alive) return;
      const z0 = this.explore ? this.groundZ(p.safe.x, p.safe.y) : 0;
      p.falling = { kind, t: 0, z: z0, vz: 0.5, splashed: false, dur: kind === 'water' ? 1.25 : 1.15 };
      p.invuln = 5; p.running = false; p.moving = false; this.setPose(p, 'hit', 99);
      if (p.carrying) { const b = p.carrying; p.carrying = null; b.x = p.x; b.y = p.y; this.splash(b); }
      this.events.push({ type: 'playerFell', player: p, kind });
    }
    updateFall(p, dt) {
      const f = p.falling; f.t += dt; p.animT += dt; p.poseT += dt;
      if (f.kind === 'water') {
        if (!f.splashed) { f.vz -= 14 * dt; f.z += f.vz * dt; if (f.z <= 0) { f.z = 0; f.splashed = true; f.splashT = 0; this.burst(p.x, p.y, 0.5, '#9fd4ff', 18); this.burst(p.x, p.y, 0.3, '#ffffff', 8); this.events.push({ type: 'splash', player: p }); } }
        else { f.splashT += dt; f.z = Math.max(-0.95, f.z - 1.6 * dt); if (Math.random() < 10 * dt) this.particles.push({ x: p.x + rnd(-0.2, 0.2), y: p.y + rnd(-0.1, 0.1), z: 0, gz: 0, vx: 0, vy: 0, vz: rnd(0.4, 0.9), life: rnd(0.3, 0.6), t: 0, color: 'rgba(230,245,255,0.9)', size: rnd(0.04, 0.09) }); }
      } else { f.vz -= 16 * dt; f.z += f.vz * dt; f.spin = (f.spin || 0) + dt * 5; }
      if (f.t >= f.dur) this.finishFall(p);
    }
    finishFall(p) {
      const f = p.falling; p.falling = null;
      p.x = p.safe.x; p.y = p.safe.y; p.dir = p.safe.dir; p.invuln = 0; p.input.dx = p.input.dy = 0; p.lastTap = null;
      if (!this.hearts) { p.invuln = BK.INVULN; this.setPose(p, 'hit', 0.5); this.burst(p.x, p.y, 0.4, '#ffffff', 8); return; }   // chez les grands-parents : pas de dégâts
      this.damage(p, 10, { kind: f.kind });
      if (p.hp > 0) { p.invuln = BK.INVULN; this.setPose(p, 'hit', 0.5); this.burst(p.x, p.y, 0.4, '#ffffff', 8); return; }
      this.killPlayer(p, { kind: f.kind });
    }
    hitPlayer(p, source) {
      if(p.swallowedBy)return false;
      if (!p.alive || p.invuln > 0 || this.frozen || p.npc) return false;
      if(this.mode==='adventure' && !BK.settings.friendlyFire && source?.owner && source.owner!==p && (p.ally || source.owner.ally) && (p.leader||p)===(source.owner.leader||source.owner))return false;
      if (p.shield > 0 && source && source.kind === 'flame') {
        p.shield=0;p.invuln=1; const b=source.bomb;let dx=b&&Number.isFinite(b.x)?p.x-b.x:0,dy=b&&Number.isFinite(b.y)?p.y-b.y:0;
        if(Math.hypot(dx,dy)<0.01){const D=DIRS[(p.dir+2)%4];dx=D.dx;dy=D.dy;}const len=Math.hypot(dx,dy);
        this.moveCircle(p,dx/len*0.38,dy/len*0.38,null);p.running=false;this.setPose(p,'hit',0.25);
        this.burst(p.x,p.y,0.6,'#b48cf0',14);this.events.push({type:'shieldBroken',player:p});return false;
      }
      if (this.hearts) {
        this.damage(p, (source && source.dmg) || (source && source.shot && source.shot.dmg) || (source && source.enemy && source.enemy.def.dmg) || 10, source);
        if (p.hp > 0) { p.invuln = BK.INVULN; this.setPose(p, 'hit', 0.5); this.dropCarried(p); return true; }
      }
      this.killPlayer(p, source); return true;
    }
    // Morsure de serpent : empoisonné 6 s, 2 points de vie perdus chaque seconde (le bouclier et l'invincibilité n'y font rien).
    autoAntipoison(p) { if(!(p.poison>0))return false;BK.normalizeRemedyBag(p);if( !(p.quickSlots||[]).includes('antidote'))return false;const i=(p.inv||[]).findIndex(s=>s.type==='antidote'&&s.n>0);return i>=0&&this.useItem(p,i); }
    poisonPlayer(p, e) { if (!p.alive || !this.hearts) return; p.poison = 6; p.poisonTick = 1; if(this.autoAntipoison(p))return; this.burst(p.x, p.y, 0.4, '#7ef05a', 10); this.events.push({ type: 'poisoned', player: p, enemy: e }); }
    // Points de vie : les coups enlèvent 5, 10, 15 ou 20 selon la source ; « −10 » flotte au-dessus de la tête.
    damage(p, dmg, source) {
      p.hp = Math.max(0, p.hp - dmg); this.events.push({ type: 'playerHit', player: p, source, dmg });
      this.addFloater(p.x, p.y, '−' + dmg, { color: '#ff6b6b', size: 0.34, life: 1.2, follow: p });
    }
    allyCareNeeds(p) {
      const waiting=p.npc&&p.waitingMember;
      if((!p.ally&&!waiting)||!p.alive||p.lives<=0||p.air||waiting&&p.waitingMember.alive===false)return [];
      return [
        ...(waiting?p.hp<p.maxHp?['food']:[]:p.retreating&&p.hp<=p.maxHp*.25?['food']:[]),
        ...(p.diarrheaT>0||p.shortfuseT>0||p.poison>0?['antidote']:[])
      ];
    }
    canCareForAlly(giver,ally) {
      return giver.alive&&this.players.includes(giver)&&this.players.includes(ally)&&(
        ally.ally&&!ally.npc&&ally.leader===giver ||
        ally.npc&&ally.waitingMember&&ally.waitingOwner===giver.id&&!giver.npc&&giver.human
      );
    }
    syncWaitingAllyCare(ally) {
      if(!ally.npc||!ally.waitingMember)return;
      for(const key of ['hp','poison','poisonTick','diarrheaT','shortfuseT','autoBombT'])ally.waitingMember[key]=ally[key]||0;
      ally.say='🤝 Reprendre gratuitement · ♥ '+Math.max(0,Math.ceil(ally.hp))+'/'+ally.maxHp+' · '+ally.lives+' vies';ally.sayT=999;
    }
    cureAlly(giver,ally,type) {
      type=BK.remedyId(type);BK.normalizeRemedyBag(giver);
      if(!this.canCareForAlly(giver,ally)||!ally.alive||ally.waitingMember?.alive===false||ally.lives<=0)return false;
      const needed=type==='antidote'&&(ally.diarrheaT>0||ally.shortfuseT>0||ally.poison>0);
      if(!needed)return false;
      const inv=giver.inv||[],i=inv.findIndex(s=>s.type===type&&s.n>0);if(i<0)return false;
      const slot=inv[i];slot.n--;slot.perm=Math.min(slot.perm||0,slot.n);if(!slot.n)inv.splice(i,1);
      ally.diarrheaT=ally.shortfuseT=ally.autoBombT=ally.poison=ally.poisonTick=0;
      this.syncWaitingAllyCare(ally);this.setPose(ally,'drink',.6);this.burst(ally.x,ally.y,.4,'#84d6e2',10);this.events.push({type:'cured',player:ally,carry:true});return true;
    }
    feedAlly(giver,ally,type) {
      const amount=BK.ALLY_FOOD_HEAL[type];
      if(!amount||!this.canCareForAlly(giver,ally)||!ally.alive||ally.waitingMember?.alive===false||ally.lives<=0||ally.hp>=ally.maxHp)return false;
      const inv=giver.inv||[],index=inv.findIndex(s=>s.type===type&&s.n>0);if(index<0)return false;
      const slot=inv[index];slot.n--;slot.perm=Math.min(slot.perm||0,slot.n);if(!slot.n)inv.splice(index,1);
      this.heal(ally,amount);this.syncWaitingAllyCare(ally);this.setPose(ally,'drink',.6);this.burst(ally.x,ally.y,.4,'#ff9fb7',10);return true;
    }
    heal(p, n) { const before = p.hp; p.hp = Math.min(p.maxHp, p.hp + n); if (p.hp > before) this.addFloater(p.x, p.y, '+' + (p.hp - before) + ' ❤', { color: '#ff8fab', size: 0.34, life: 1.4, follow: p }); }
    killPlayer(p, source) {
      if(p.seat){const back=p.seat.back;p.seat=null;p.x=back.x;p.y=back.y;}
      if (!p.alive) return;
      if(p.swallowedBy)this.releaseSwallowed(p);
      if(p.boat && p.boat.rider===p){const b=p.boat;b.rider=null;p.boat=null;this.unloadAllies(b,{c:Math.floor(p.safe.x),r:Math.floor(p.safe.y)});}
      p.alive = false; if(p.ally)p.lives=Math.max(0,p.lives-1); p.deadT = 0; p.invuln = 0; this.setPose(p, 'dead', 99);
      this.dropCarried(p); p.input.dx = p.input.dy = 0;
      this.events.push({ type: 'playerDied', player: p, source });
      if (source && source.owner && source.owner !== p) source.owner.kills++;
    }
    dropCarried(p) {
      const b = p.carrying; if (!b) return; p.carrying = null;
      const c = Math.floor(p.x), r = Math.floor(p.y);
      if (!this.blocked(c, r, p) || this.bombAt(c, r) === undefined) { b.state = 'idle'; b.cx = c; b.cy = r; b.x = c + 0.5; b.y = r + 0.5; b.z = 0; b.passers = new Set([p]); }
      else this.explodeBomb(b);
    }
    revive(p, c, r) {
      p.alive = true; p.hp = p.maxHp; p.invuln = BK.INVULN; p.x = c + 0.5; p.y = r + 0.5; p.carrying = null; this.setPose(p, 'idle'); p.dir = 0;
    }

    // ------------------------------------------------------------------ bombes
    placeBomb(p) {
      if (p.heldSnail || p.boat || p.bombsOut >= p.bombsMax) return false;
      const c = Math.floor(p.x), r = Math.floor(p.y);
      if (this.cell(c, r) || this.bombAt(c, r) || this.special.get(c + ',' + r)?.type === 'exit') return false;
      const b = { cx: c, cy: r, x: c + 0.5, y: r + 0.5, z: 0, big: (p.sizeScale || 1) > 1, t: BK.BOMB_FUSE * (p.shortfuseT>0?0.5:1), fire: p.fire, damage:p.bomb2?2:1, level:p.bomb2?2:1, safeItems:!!p.safeitems, dome:!!p.dome, owner: p, state: 'idle', passers: new Set([p]), born: this.time, dir: 0 };
      this.bombs.push(b); p.bombsOut++; this.setPose(p, 'place', 0.25);
      this.events.push({ type: 'bombPlaced', player: p, bomb: b }); return true;
    }
    pickupBomb(p) {
      if(p.heldSnail) return false;
      const c = Math.floor(p.x), r = Math.floor(p.y);
      let b = this.bombAt(c, r);
      if (!b) { const d = DIRS[p.dir]; b = this.bombAt(c + d.dx, r + d.dy); if (b && Math.hypot(p.x - b.x, p.y - b.y) > (b.rock ? 1.1 : 0.95)) b = null; }
      if (b && b.rock && !p.gloves) b = null;   // une roche posée ne se soulève qu'avec les gants
      if (!b && p.gloves) { const d = DIRS[p.dir], cc = c + d.dx, rr = r + d.dy; if (this.inside(cc, rr) && this.deco[this.idx(cc, rr)] === 'rock' && Math.hypot(p.x - cc - 0.5, p.y - rr - 0.5) < 1.1) return this.liftRock(p, cc, rr); }
      if (!b || b.underElevator) return false;
      if (b.rock) { b.state = 'carried'; b.carrier = p; p.carrying = b; this.setPose(p, 'pickup', 0.4); this.events.push({ type: 'rockPicked', player: p, rock: b }); return true; }
      b.state = 'carried'; b.carrier = p; p.carrying = b; this.setPose(p, 'pickup', 0.4);
      this.events.push({ type: 'bombPicked', player: p, bomb: b }); return true;
    }
    throwBomb(p) {
      const b = p.carrying; if (!b) return false;
      p.carrying = null; p.inflating=null; b.carrier=null; this.setPose(p, 'throw', 0.35);
      const d = DIRS[p.dir], c = Math.floor(p.x), r = Math.floor(p.y);
      b.state = 'flying'; b.dir = p.dir; b.x = p.x; b.y = p.y; b.z = 1.1;
      const range = !b.rock && p.longthrow ? BK.THROW_CELLS + 2 : BK.THROW_CELLS;
      let tc = c + d.dx * range, tr = r + d.dy * range;
      tc = Math.max(0, Math.min(this.cols - 1, tc)); tr = Math.max(0, Math.min(this.rows - 1, tr));
      b.from = { x: b.x, y: b.y, z: this.groundZ(p.x, p.y) + 1.1 }; b.to = { x: tc + 0.5, y: tr + 0.5, z: this.groundZ(tc + 0.5, tr + 0.5) }; b.flyT = 0; b.flyDur = 0.5; b.arc = 1.0; b.thrower = p;
      this.events.push({ type: 'bombThrown', player: p, bomb: b }); return true;
    }
    // Gants de force : la roche du décor devient un objet qu'on porte et qu'on lance comme une bombe (même animation).
    liftRock(p, c, r) {
      const i = this.idx(c, r); this.cells[i] = 0; this.deco[i] = null;
      const rk = { rock: true, uses: 2, state: 'carried', carrier: p, x: c + 0.5, y: r + 0.5, z: 0, cx: c, cy: r, t: 1e9, fire: 0, owner: null, passers: new Set(), born: this.time };
      this.bombs.push(rk); p.carrying = rk; this.setPose(p, 'pickup', 0.4); this.events.push({ type: 'rockPicked', player: p, rock: rk }); return true;
    }
    // La roche retombe : 2 points de dégâts à tout monstre dessous, un petit bond d'une case de plus dans la même direction,
    // puis elle reste là (on peut la reprendre) ; au deuxième lancer elle se brise.
    landRock(b) {
      const c = Math.floor(b.to.x), r = Math.floor(b.to.y), d = DIRS[b.dir], gz = (x, y) => this.groundZ(x, y);
      if (!this.inside(c, r) || (this.explore && !this.walkableTerrain(c, r))) { this.bombs.splice(this.bombs.indexOf(b), 1); b.exploded = true; this.burst(b.to.x, b.to.y, 0.4, this.tAt(c, r) === T_LAVA ? '#ff8a1f' : '#8fc8ff', 12); this.events.push({ type: 'rockLost', rock: b }); return; }
      for (const e of this.enemies) if (!e.dead && Math.hypot(e.x - b.to.x, e.y - b.to.y) < (e.def.hitR || e.r) + 0.45) this.hurtEnemy(e, b.thrower, 2);
      this.burst(b.to.x, b.to.y, 0.3, 'rgba(200,200,210,0.85)', 6); this.shake = Math.max(this.shake, 0.08); this.events.push({ type: 'rockLand', rock: b, c, r });
      if (!b.hops) {
        const nc = c + d.dx, nr = r + d.dy, i = this.idx(c, r);
        if (this.inside(nc, nr) && !this.cell(nc, nr) && this.walkableTerrain(nc, nr) && Math.abs(this.hAt(nc, nr) - this.hAt(c, r)) < 0.01 && !this.ramp[i] && !this.bombAt(nc, nr)) {
          b.hops = 1; b.from = { x: b.to.x, y: b.to.y, z: gz(b.to.x, b.to.y) }; b.to = { x: nc + 0.5, y: nr + 0.5, z: gz(nc + 0.5, nr + 0.5) }; b.flyT = 0; b.flyDur = 0.25; b.arc = 0.35; return;
        }
      }
      const free = (cc, rr) => this.inside(cc, rr) && !this.cell(cc, rr) && this.walkableTerrain(cc, rr) && !this.bombAt(cc, rr) && !this.enemies.some(e => !e.dead && Math.floor(e.x) === cc && Math.floor(e.y) === rr) && !this.players.some(q => q.alive && Math.floor(q.x) === cc && Math.floor(q.y) === rr);
      let rest = free(c, r) ? { c, r } : null; for (let k = 1; k <= 3 && !rest; k++) { const cc = c - d.dx * k, rr = r - d.dy * k; if (free(cc, rr)) rest = { c: cc, r: rr }; }
      b.uses--; b.hops = 0;
      if (b.uses <= 0 || !rest) { this.bombs.splice(this.bombs.indexOf(b), 1); b.exploded = true; this.burst(b.to.x, b.to.y, 0.5, '#9aa3ad', 16, 1); this.burst(b.to.x, b.to.y, 0.3, '#5a616a', 8, 1); this.events.push({ type: 'rockBroken', rock: b, c, r }); return; }
      b.state = 'idle'; b.cx = rest.c; b.cy = rest.r; b.x = rest.c + 0.5; b.y = rest.r + 0.5; b.z = 0; b.passers = new Set();
    }
    landBomb(b) {
      if (b.rock) return this.landRock(b);
      const c = Math.floor(b.to.x), r = Math.floor(b.to.y);
      const d = DIRS[b.dir];
      let nc = c + d.dx, nr = r + d.dy;
      if (this.explore && this.inside(c, r) && this.cell(c, r) === TARGET) {   // en plein dans la cible !
        const tg = Object.values(this.targets).find(t => t.c === c && t.r === r); if (tg) this.hitTarget(tg.letter, b.thrower);
        b.state = 'idle'; b.cx = c; b.cy = r; b.x = c + 0.5; b.y = r + 0.5; this.explodeBomb(b); return;
      }
      if (this.explore && this.inside(c, r) && this.cell(c, r) === BARREL) { this.igniteBarrel(c, r, b.thrower); b.state = 'idle'; b.cx = c; b.cy = r; b.x = c + 0.5; b.y = r + 0.5; this.explodeBomb(b); return; }
      if (this.explore && this.inside(c, r) && !this.walkableTerrain(c, r)) { b.x = c + 0.5; b.y = r + 0.5; if (this.tAt(c, r) === T_LAVA) { b.state = 'idle'; b.cx = c; b.cy = r; this.explodeBomb(b); } else this.splash(b); return; }
      const free = this.inside(c, r) && !this.cell(c, r) && !this.bombAt(c, r) && !this.enemies.some(e => !e.dead && Math.floor(e.x) === c && Math.floor(e.y) === r);
      if (free) {
        b.state = 'idle'; b.cx = c; b.cy = r; b.x = c + 0.5; b.y = r + 0.5; b.z = 0; b.passers = new Set(this.players.filter(p => p.alive && Math.floor(p.x) === c && Math.floor(p.y) === r));
        this.events.push({ type: 'bombLanded', bomb: b }); return;
      }
      // un ennemi en dessous ? il prend un coup, la bombe rebondit
      const e = this.enemies.find(e => !e.dead && Math.floor(e.x) === c && Math.floor(e.y) === r);
      if (e) this.hurtEnemy(e, b.thrower, 1);
      if (!this.inside(nc, nr) || this.cell(nc, nr) === HARD && !this.inside(nc + d.dx, nr + d.dy)) { b.dir = (b.dir + 2) % 4; const d2 = DIRS[b.dir]; nc = c + d2.dx; nr = r + d2.dy; }
      b.from = { x: b.x, y: b.y, z: this.groundZ(b.x, b.y) }; b.to = { x: nc + 0.5, y: nr + 0.5, z: this.groundZ(nc + 0.5, nr + 0.5) }; b.flyT = 0; b.flyDur = 0.22; b.arc = 0.35; b.bounces = (b.bounces || 0) + 1;
      if (b.bounces > 30) { b.state = 'idle'; b.cx = c; b.cy = r; this.explodeBomb(b); }
    }
    kickBomb(b, dir, kicker) { b.state = 'sliding'; b.dir = dir; b.kicker = kicker || b.owner; this.events.push({ type: 'bombKicked', bomb: b }); }
    fuseBombs(moving, target) {
      if (moving === target || moving.exploded || !moving.kicker?.kick || !moving.kicker.fusion || moving.rock || target.rock || target.exploded || target.state !== 'idle') return false;
      moving.exploded = true;
      this.bombs.splice(this.bombs.indexOf(moving), 1);
      if (moving.owner) moving.owner.bombsOut = Math.max(0, moving.owner.bombsOut - 1);
      target.giga = true; target.fire = Math.min(7, Math.max(target.fire, moving.fire) + 2);
      target.damage = Math.min(8, (target.damage || 1) + (moving.damage || 1));
      target.level = Math.max(target.level || 1, moving.level || 1);
      target.safeItems = !!(target.safeItems || moving.safeItems || moving.kicker.safeitems);
      target.t = Math.min(target.t, moving.t); target.inflation = Math.max(target.inflation || 0, moving.inflation || 0);
      target.baseFire = target.fire; target.baseDamage = target.damage; target.inflation = 0;
      this.burst(target.x, target.y, 0.6, '#d6a0ff', 24); this.shake = 0.18;
      this.events.push({type:'bombFusion', bomb:target, player:moving.kicker}); return true;
    }
    explodeGiga(b, c, r) {
      // Propagation circulaire : traverse chaque couche destructible, s'arrête aux murs solides.
      const radius = Math.min(7, b.fire), queue = [[c,r,0]], seen = new Set([c+','+r]);
      for (let i=0; i<queue.length; i++) {
        const [x,y,dist] = queue[i], v = this.cell(x,y);
        if(this.hitBridgeColumn?.(x,y,b)||this.hitBlastDrawbridge?.(x,y,b))continue;
        if (v === HARD || v === GATE || v === SEALED || v === METAL) continue;
        if (this.explore && Math.abs(this.hAt(x,y)-this.hAt(c,r))>0.01 && !this.ramp[this.idx(x,y)]) continue;
        if (v === SOFT) this.destroyBlock(x,y,b.owner);
        if (v === BARREL) this.igniteBarrel(x,y,b.owner);
        this.addFlame(x,y,'center',0,b);
        const other = this.bombAt(x,y); if (other && !other.rock) this.explodeBomb(other);
        if (dist >= radius || v === TARGET) continue;
        for (const D of DIRS) {
          const nx=x+D.dx, ny=y+D.dy, key=nx+','+ny;
          if (!this.inside(nx,ny) || seen.has(key) || Math.hypot(nx-c,ny-r)>radius) continue;
          seen.add(key); queue.push([nx,ny,dist+1]);
        }
      }
    }
    explodeBomb(b) {
      if (b.exploded || b.rock) return; b.exploded = true; b.blastSource = 'bomb';   // une roche n'explose pas : la flamme s'y arrête
      const i = this.bombs.indexOf(b); if (i >= 0) this.bombs.splice(i, 1);
      if (b.owner) b.owner.bombsOut = Math.max(0, b.owner.bombsOut - 1);
      if (b.carrier && b.carrier.carrying === b) b.carrier.carrying = null;
      const c = b.state === 'idle' || b.state === 'sliding' ? b.cx : Math.floor(b.x), r = b.state === 'idle' || b.state === 'sliding' ? b.cy : Math.floor(b.y);
      this.shake = Math.max(this.shake, 0.25);
      const E = this.elevAt(c, r);
      if (E && b.underElevator === E && !E.auto && E.state === 'rest') {   // la bombe était sous le plateau : explosion étouffée, l'ascenseur démarre
        this.events.push({ type: 'explosion', c, r, bomb: b, muffled: true }); this.burst(c + 0.5, r + 0.5, 0.5, 'rgba(160,160,160,0.8)', 12); E.state = 'up'; E.t = 0; this.events.push({ type: 'elevatorUp', elevator: E }); return;
      }
      const lift = this.liftAt(c, r);
      if (lift) {   // la bombe explose sous la plateforme : pas de flammes, la plateforme monte d'un étage
        this.events.push({ type: 'explosion', c, r, bomb: b, muffled: true }); this.burst(c + 0.5, r + 0.5, 0.5, 'rgba(160,160,160,0.8)', 12); this.raiseLift(lift); return;
      }
      this.events.push({ type: 'explosion', c, r, bomb: b });
      this.hitBridgeColumn?.(c,r,b);
      this.hitBlastDrawbridge?.(c,r,b);
      if (b.giga) { this.shake = 0.55; this.explodeGiga(b,c,r); return; }
      if (b.dome) { this.explodeDome(b,c,r); return; }
      this.addFlame(c, r, 'center', 0, b);
      for (let d = 0; d < 4; d++) {
        const D = DIRS[d];
        for (let k = 1; k <= b.fire; k++) {
          const cc = c + D.dx * k, rr = r + D.dy * k;
          if (!this.inside(cc, rr)) break;
          if(this.hitBridgeColumn?.(cc,rr,b)) break;
          if(this.hitBlastDrawbridge?.(cc,rr,b)) break;
          const v = this.cell(cc, rr);
          if (v === METAL) { if ((this.metal[this.idx(cc, rr)] + 2) % 4 === d) this.destroyMetal(cc, rr, b.owner); break; }   // la flamme frappe la face opposée à sa direction
          if (v === HARD && this.explore) { const dk = this.deco[this.idx(cc, rr)]; if (dk === 'mailbox') { this.destroyMailbox(cc, rr, b.owner); this.addFlame(cc, rr, 'end', d, b); break; } if (dk === 'beehive') { this.destroyHive(cc, rr, b.owner); this.addFlame(cc, rr, 'end', d, b); break; } if (dk === 'chest') { this.destroyChest(cc, rr, b.owner); this.addFlame(cc, rr, 'end', d, b); break; } }
          if (v === HARD || v === GATE || v === SEALED) break;
          if (this.solidEnemyAt(cc, rr)) { this.addFlame(cc, rr, 'end', d, b); break; }   // la flamme frappe le bloc ennemi et s'arrête
          if (v === BARREL) { this.igniteBarrel(cc, rr, b.owner); this.addFlame(cc, rr, 'end', d, b); break; }
          if (this.explore && !this.ramp[this.idx(cc, rr)] && Math.abs(this.height[this.idx(cc, rr)] - this.height[this.idx(c, r)]) > 0.01 && !this.ramp[this.idx(c, r)]) break;
          if (v === TARGET) { this.addFlame(cc, rr, 'end', d, b); break; }
          if (v === SOFT) { this.destroyBlock(cc, rr, b.owner); this.addFlame(cc, rr, 'end', d, b); break; }
          const ob = this.bombAt(cc, rr);
          this.addFlame(cc, rr, k === b.fire ? 'end' : 'mid', d, b);
          if (ob) { this.explodeBomb(ob); break; }
        }
      }
    }
    addFlame(c, r, kind, dir, bomb) {
      const key = this.idx(c, r), old = this.flameAt.get(key);
      const f = { cx: c, cy: r, t: 0, level:bomb.level||1, duration:BK.FLAME_TIME*(bomb.level>=2?2:1), kind: old && old.kind === 'center' ? 'center' : kind, dir, seed: Math.random() * 10, owner: bomb.owner, bomb };
      if (old) { const remaining=(old.duration||BK.FLAME_TIME)-old.t;old.duration=Math.max(remaining,f.duration);old.t=0;if(f.level>=(old.level||1)){old.level=f.level;old.owner=bomb.owner;old.bomb=bomb;}return old; }
      this.flames.push(f); this.flameAt.set(key, f);
      const it = this.itemAt(c, r); if (it && !(bomb.safeItems || bomb.owner && bomb.owner.safeitems) && this.time - it.born > 0.3) { this.items.splice(this.items.indexOf(it), 1); this.burst(c + 0.5, r + 0.5, 0.3, BK.ITEMS[it.type].color, 6); }
      if (this.cell(c, r) === TARGET) { const tg = Object.values(this.targets).find(t => t.c === c && t.r === r); if (tg) this.hitTarget(tg.letter, bomb.owner); }
      const sp = this.special.get(c + ',' + r);
      if (sp && sp.type === 'switch' && !sp.sw.on) { sp.sw.on = true; this.events.push({ type: 'switch', sw: sp.sw, player: bomb.owner }); this.burst(c + 0.5, r + 0.5, 0.4, '#ffd54a', 12); }
      return f;
    }
    destroyBlock(c, r, by) {
      if(by?.ally)by=by.leader;
      this.cells[this.idx(c, r)] = 0; const kind = this.deco[this.idx(c, r)]; this.deco[this.idx(c, r)] = null;
      const sp0 = this.special.get(c + ',' + r); if (sp0 && sp0.type === 'brick') this.special.delete(c + ',' + r);
      if (by) by.score += BK.BLOCK_SCORE;
      const SOFT_COLORS = { crate: '#a0703a', melon: '#ff5a5a', cheese: '#f4c430', gift: '#ffd54a', dirtblock: '#7d5428', pumpkin: '#ff8a1f' };
      this.burst(c + 0.5, r + 0.5, 0.5, SOFT_COLORS[kind] || (sp0 && sp0.type === 'brick' ? this.theme.hard : this.theme.soft), 10, 1);
      if (kind === 'melon') this.burst(c + 0.5, r + 0.5, 0.4, '#2e7d32', 6, 1);
      this.events.push({ type: 'blockDestroyed', c, r, player: by });
      const sp = this.special.get(c + ',' + r);
      if (sp && sp.type === 'exit') { this.exit.hidden = false; return; }
      if (kind === 'pumpkin') { for (let n = 0; n < 3; n++) this.spawnItem(c, r, 'pumpkinpiece'); return; }
      if (this.coins && Math.random() < 0.22) { this.spawnItem(c, r, 'coin'); return; }
      if (Math.random() < this.itemChance) this.spawnItem(c, r);
    }
    // Coffre : une flamme le fait éclater ; 3 à 5 pièces d'or volent sur les cases libres autour, parfois un objet en plus.
    destroyChest(c, r, by) {
      const i = this.idx(c, r); this.cells[i] = 0; this.deco[i] = null; if (by) by.score += BK.BLOCK_SCORE;
      const cand = []; for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) { const cc = c + dc, rr = r + dr; if (!this.inside(cc, rr) || this.cell(cc, rr) || !this.walkableTerrain(cc, rr) || this.solidEnemyAt(cc, rr) || Math.abs(this.hAt(cc, rr) - this.hAt(c, r)) > 0.01) continue; cand.push({ c: cc, r: rr }); }
      for (let k = cand.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [cand[k], cand[j]] = [cand[j], cand[k]]; }
      if (!cand.length) cand.push({ c, r });
      const n = 3 + Math.floor(Math.random() * 3), fly = (cell, type) => { this.spawnItem(cell.c, cell.r, type); const it = this.items[this.items.length - 1]; it.from = { x: c + 0.5, y: r + 0.5 }; it.born = this.time; it.flyDur = 0.4 + Math.random() * 0.25; };
      for (let k = 0; k < n; k++) fly(cand[k % cand.length], 'coin');
      if (Math.random() < 0.45) fly(cand[n % cand.length]);
      this.burst(c + 0.5, r + 0.5, 0.6, '#ffd54a', 14); this.burst(c + 0.5, r + 0.5, 0.4, '#8a5a2a', 8, 1); this.shake = Math.max(this.shake, 0.1);
      this.events.push({ type: 'chestOpened', c, r, coins: n });
    }
    // Boîte aux lettres : une flamme la renverse (elle tombe, bois brisé, puis s'efface) et elle laisse toujours une pièce d'or.
    destroyMailbox(c, r, by) {
      const i = this.idx(c, r); this.cells[i] = 0; this.deco[i] = null; if (by) by.score += BK.BLOCK_SCORE;
      this.debris.push({ kind: 'mailbox', c, r, t: 0, dur: 1.4, dir: Math.random() < 0.5 ? -1 : 1 });
      this.burst(c + 0.5, r + 0.5, 0.45, '#8a5a2a', 8, 1); this.burst(c + 0.5, r + 0.5, 0.3, '#d9d9d9', 4, 1);
      this.events.push({ type: 'mailboxBroken', c, r }); this.spawnItem(c, r, 'coin');
    }
    // Ruche : une flamme la casse et laisse un pot de miel (3 doses, ou props.honey).
    destroyHive(c, r, by) {
      const i = this.idx(c, r); this.cells[i] = 0; this.deco[i] = null; if (by) by.score += BK.BLOCK_SCORE; this.hives = this.hives.filter(h => h.c !== c || h.r !== r);
      this.burst(c + 0.5, r + 0.5, 0.5, '#f0a830', 12, 1); this.burst(c + 0.5, r + 0.5, 0.3, '#ffd54a', 6);
      this.events.push({ type: 'hiveBroken', c, r }); this.spawnItem(c, r, 'honey', (this.props[c + ',' + r] || {}).honey || 3);
    }
    chopTree(p) {
      if (!p.alive || p.air || p.falling || p.carrying || p.onBomb || p.fishing || (p.axeUntil || 0) > this.time) return false;
      const D=DIRS[p.dir], c=Math.floor(p.x)+D.dx, r=Math.floor(p.y)+D.dy, i=this.idx(c,r);
      if (!this.inside(c,r) || Math.abs(this.hAt(c,r)-this.groundZ(p.x,p.y))>0.1) return false;
      const tree=this.trees.find(t=>t.c===c&&t.r===r), kind=this.deco[i];
      if(!tree && kind!=='snowpine' && kind!=='baretree') return false;
      this.trees=this.trees.filter(t=>t!==tree);this.cells[i]=0;this.deco[i]='stump';
      this.debris.push({kind:tree?'tree':kind,c,r,t:0,dur:1.3,dir:p.dir===1?-1:1,props:this.props[c+','+r]});
      p.axeUntil=this.time+0.5;this.setPose(p,'throw',0.5);p.running=false;
      this.burst(c+0.5,r+0.5,0.45,'#b88249',12,1);this.burst(c+0.5,r+0.5,0.8,'#80ac48',8);
      this.spawnItem(c,r,'wood'); this.spawnItem(c,r,'wood');
      this.events.push({type:'treeChopped',player:p,c,r,carry:true});return true;
    }
    fuelFireNear(p) {
      if(!p.alive||p.npc||p.boat||p.seat||p.air||p.falling||p.fishing||p.carrying||!(p.inv||[]).some(s=>s.type==='wood'&&s.n>0))return null;
      return this.campfires.filter(f=>f.remaining>0&&Math.hypot(p.x-f.c-.5,p.y-f.r-.5)<1.6&&Math.abs(this.hAt(f.c,f.r)-this.groundZ(p.x,p.y))<.01).sort((a,b)=>Math.hypot(p.x-a.c-.5,p.y-a.r-.5)-Math.hypot(p.x-b.c-.5,p.y-b.r-.5))[0]||null;
    }
    addWoodToFire(p) {
      const fire=this.fuelFireNear(p);if(!fire)return false;
      const i=p.inv.findIndex(s=>s.type==='wood'&&s.n>0),s=p.inv[i];s.n--;if((s.perm||0)>s.n)s.perm=s.n;if(!s.n)p.inv.splice(i,1);
      fire.remaining+=15;this.setPose(p,'place',.3);this.events.push({type:'campfireFueled',player:p,carry:true});return true;
    }
    buildCampfire(p) {
      if(!this.explore || p.boat || p.air || p.falling || p.carrying || p.onBomb) return false;
      const D=DIRS[p.dir], c=Math.floor(p.x)+D.dx, r=Math.floor(p.y)+D.dy, i=this.idx(c,r);
      const fire=this.campfires.find(f=>f.c===c&&f.r===r&&f.remaining!=null);
      if(fire&&Math.abs(this.hAt(c,r)-this.groundZ(p.x,p.y))<.01){fire.remaining+=15;this.setPose(p,'place',.3);this.events.push({type:'campfireFueled',player:p,carry:true});return true;}
      if(!this.inside(c,r) || this.cell(c,r) || !this.walkableTerrain(c,r) || this.ramp[i] || this.deco[i] || this.special.has(c+','+r) || this.bombAt(c,r) || this.itemAt(c,r) || this.liftAt(c,r) || this.elevAt(c,r) || this.railAt(c,r) || Math.abs(this.hAt(c,r)-this.groundZ(p.x,p.y))>0.01 || this.players.some(q=>q.alive&&Math.floor(q.x)===c&&Math.floor(q.y)===r) || this.enemies.some(e=>!e.dead&&Math.floor(e.x)===c&&Math.floor(e.y)===r)) return false;
      this.cells[i]=HARD;this.deco[i]='campfire';this.campfires.push({c,r,remaining:15});this.setPose(p,'place',0.3);this.burst(c+0.5,r+0.5,0.4,'#ffb34f',8);this.events.push({type:'campfireBuilt',player:p,carry:true});return true;
    }
    // Inventaire (24 piles) : utiliser le pot de miel verse une flaque sous le héros ; les monstres qui y marchent sont englués.
    useItem(p, slot, snailIndex=0) {
      const inv = p.inv || []; const s = inv[slot]; if (!s || !p.alive) return false;
      const spend = () => { s.n--; if ((s.perm || 0) > s.n) s.perm = s.n; if (s.n <= 0) inv.splice(slot, 1); };
      if(BK.ITEMS[s.type]?.snailColor) {
        if(p.air||p.falling||p.boat||p.seat||p.carrying||p.heldSnail) return false;
        const spot=this.snailDropSpot(p,{r:0.12,def:BK.ENEMIES.escargot});if(!spot)return false;
        const sn=this.takeBagSnail(p,s,snailIndex);if(!sn)return false;
        this.addEnemy('escargot',spot.c,spot.r,{...sn,shellColor:sn.color,nickname:sn.nickname,shell:1,shellWait:0.7});
        this.setPose(p,'place',0.3);return true;
      }
      if(BK.remedyId(s.type)==='antidote'){if(!(p.diarrheaT>0||p.shortfuseT>0||p.poison>0))return false;p.diarrheaT=p.shortfuseT=p.autoBombT=p.poison=p.poisonTick=0;spend();this.events.push({type:'cured',player:p,carry:true});return true;}
      if (s.type === 'wood') { if(!this.buildCampfire(p)) {this.events.push({type:'campfireBlocked',player:p,carry:true});return false;}spend();return true; }
      if (s.type === 'axe') return this.chopTree(p);
      if (s.type === 'rod') return this.startFishing(p);
      if (s.type === 'fish') { if (!this.throwFish(p)) return false; spend(); return true; }
      if (s.type === 'carrot') { if (!this.throwFish(p, 'carrot')) return false; spend(); return true; }
      if (s.type === 'meatraw'||s.type==='poultryraw') return this.cookFish(p, null, s.type);
      if (s.type === 'meatcooked'||s.type==='poultrycooked') { if(p.hp>=p.maxHp)return false; this.heal(p,s.type==='poultrycooked'?15:10);this.setPose(p,'drink',0.6);spend();return true; }
      if (s.type === 'pumpkinpiece') { if (p.hp >= p.maxHp) return false; this.heal(p, 5); this.setPose(p, 'drink', 0.6); spend(); return true; }
      if (s.type === 'fishcooked') { this.eatFish(p); spend(); return true; }
      if (s.type === 'spore') { if (!this.growMushroom(p)) return false; spend(); return true; }
      if (s.type === 'honey') {
        const c = Math.floor(p.x), r = Math.floor(p.y); if (!this.walkableTerrain(c, r)) return false;
        const old = this.puddles.find(q => q.kind!=='toadSlime' && q.c === c && q.r === r); if (old) old.t = 0; else this.puddles.push({ c, r, t: 0, dur: 14 });
        this.burst(p.x, p.y, 0.35, '#f0a830', 8, 1); s.n--; if ((s.perm || 0) > s.n) s.perm = s.n; this.events.push({ type: 'honeyUsed', player: p, c, r, carry: true });   // on verse d'abord les pots trouvés
        if (s.n <= 0) { inv.splice(slot, 1); this.events.push({ type: 'honeyEmpty', player: p, carry: true }); }
        return true;
      }
      return false;
    }
    slowAt(e) { if (!this.puddles.length) return 1; const c = Math.floor(e.x), r = Math.floor(e.y); return this.puddles.some(q => q.kind!=='toadSlime' && q.c === c && q.r === r) ? 0.12 : 1; }
    // ---- Cycle jour-nuit (4 minutes) : jour, crépuscule (30 s), nuit (70 s), aube (30 s). darkness() : 0 le jour, 1 en pleine nuit.
    darkness() {
      if (!this.dayCycle) return 0; const t = this.time % BK.DAY_CYCLE, u = t / BK.DAY_CYCLE;
      if (u < 0.42) return 0; if (u < 0.54) return (u - 0.42) / 0.12; if (u < 0.84) return 1; if (u < 0.96) return 1 - (u - 0.84) / 0.12; return 0;
    }
    isNight() { return this.darkness() > 0.3; }
    dayIcon() { const d = this.darkness(); return d === 0 ? '☀️' : d < 0.3 ? '🌇' : d < 1 ? '🌙' : '🌙'; }
    lanternOn(p) { return BK.wearsLantern(p) && this.darkness() > 0.25; }
    // Les sources de lumière (rayon en cases) : lampadaires, feux de camp, volcans, lanternes à fée allumées, flammes.
    lights() {
      const L = [];
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) { const k = this.deco[r * this.cols + c]; if (k === 'lamp') L.push({ x: c + 0.5, y: r + 0.5, z: this.hAt(c, r) + 1.6, r: 2.6, warm: 0.5 }); else if (k === 'volcano') L.push({ x: c + 0.5, y: r + 0.5, z: this.hAt(c, r) + 2.3, r: 2.8, warm: 0.6 }); }
      for (const f of this.campfires) L.push({ x: f.c + 0.5, y: f.r + 0.5, z: this.hAt(f.c, f.r) + 0.3, r: 2.4 + 0.15 * Math.sin(this.time * 7), warm: 0.7 });
      for (const p of this.players) if (p.alive && this.lanternOn(p)) L.push({ x: p.x, y: p.y, z: (this.explore ? this.groundZ(p.x, p.y) : 0) + (p.zOff || 0) + 0.5, r: 3.4 + 0.1 * Math.sin(this.time * 5), warm: 0.45 });
      for (const f of this.flames) L.push({ x: f.cx + 0.5, y: f.cy + 0.5, z: 0.3, r: 1.6, warm: 0.5 });
      return L;
    }
    // Voile de nuit : un calque sombre percé de trous doux autour des lumières, plus un halo chaud et des étoiles.
    renderNight(ctx, cam) {
      const d = this.darkness(); if (d <= 0.01) return; const W = ctx.canvas.width, H = ctx.canvas.height;
      if (!this.nightCv || this.nightCv.width !== W || this.nightCv.height !== H) { this.nightCv = typeof document !== 'undefined' ? document.createElement('canvas') : null; if (!this.nightCv) return; this.nightCv.width = W; this.nightCv.height = H; }
      const nc = this.nightCv.getContext('2d'); nc.globalCompositeOperation = 'source-over'; nc.clearRect(0, 0, W, H); nc.fillStyle = 'rgba(8,12,44,' + (0.66 * d) + ')'; nc.fillRect(0, 0, W, H);
      const L = this.lights(); nc.globalCompositeOperation = 'destination-out';
      for (const l of L) { const pr = cam.project(l.x, l.y, l.z), rad = pr.k * l.r; const g = nc.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, rad); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.45, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)'); nc.fillStyle = g; nc.beginPath(); nc.arc(pr.x, pr.y, rad, 0, Math.PI * 2); nc.fill(); }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.nightCv, 0, 0);
      if (d > 0.3 && this.explore) {   // les étoiles se reflètent dans l'eau : petits points qui scintillent sur les cases d'eau (dégagées devant)
        const a = Math.min(1, (d - 0.3) / 0.7), cmin = Math.max(0, Math.floor(cam.target.x - 11)), cmax = Math.min(this.cols - 1, Math.ceil(cam.target.x + 11)), rmin = Math.max(0, Math.floor(cam.target.y - 10)), rmax = Math.min(this.rows - 1, Math.ceil(cam.target.y + 9));
        for (let r = rmin; r <= rmax; r++) for (let c = cmin; c <= cmax; c++) {
          if (this.tAt(c, r) !== T_WATER || this.tAt(c, r + 1) !== T_WATER) continue; const h = (c * 7919 + r * 104729) % 97; if (h > 13) continue;
          const pr = cam.project(c + 0.15 + (h % 7) / 10, r + 0.15 + ((h * 3) % 7) / 10, 0), tw = 0.4 + 0.6 * Math.abs(Math.sin(this.time * (1.2 + h % 3) + h));
          ctx.fillStyle = 'rgba(220,235,255,' + (a * 0.7 * tw) + ')'; ctx.beginPath(); ctx.arc(pr.x, pr.y, h % 9 === 0 ? 1.9 : 1.2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(220,235,255,' + (a * 0.12 * tw) + ')'; ctx.fillRect(pr.x - 0.6, pr.y + 2, 1.2, 2 + tw * 2);
        }
      }
      for (const l of L) { const pr = cam.project(l.x, l.y, l.z), rad = pr.k * l.r * 0.8; const g = ctx.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, rad); g.addColorStop(0, 'rgba(255,190,90,' + (0.22 * l.warm * d) + ')'); g.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pr.x, pr.y, rad, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    // Poudre de champignon : on la lance sur la case devant soi (libre, même étage) et un champignon géant y pousse
    // en grandissant (0,6 s) ; c'est ensuite un vrai gros champignon-trampoline, solide.
    growMushroom(p) {
      const D = DIRS[p.dir], c = Math.floor(p.x) + D.dx, r = Math.floor(p.y) + D.dy, i = this.inside(c, r) ? this.idx(c, r) : -1;
      const ok = i >= 0 && !this.cells[i] && this.walkableTerrain(c, r) && !this.deco[i] && !this.ramp[i] && Math.abs(this.hAt(c, r) - this.groundZ(p.x, p.y)) < 0.01 && !this.bombAt(c, r) && !this.itemAt(c, r) && !this.enemies.some(e => !e.dead && Math.floor(e.x) === c && Math.floor(e.y) === r) && !this.players.some(q => q !== p && q.alive && Math.floor(q.x) === c && Math.floor(q.y) === r) && !(this.rails.length && this.railAt(c, r)) && !this.elevAt(c, r);
      if (!ok) { this.events.push({ type: 'sporeBlocked', player: p, carry: true }); return false; }
      this.cells[i] = HARD; this.deco[i] = 'bigmushroom'; this.growT.set(i, 0); this.setPose(p, 'throw', 0.35);
      const gz = this.groundZ(p.x, p.y); for (let k = 0; k < 14; k++) this.particles.push({ x: p.x + D.dx * 0.3, y: p.y + D.dy * 0.3, z: gz + 0.8, gz, vx: D.dx * (1.2 + Math.random()) + (Math.random() - 0.5) * 0.8, vy: D.dy * (1.2 + Math.random()) + (Math.random() - 0.5) * 0.8, vz: 0.6 + Math.random() * 0.8, life: 0.7, t: 0, color: Math.random() < 0.5 ? '#f4e8d0' : '#e0b0a0', size: 0.06 + Math.random() * 0.06 });
      this.events.push({ type: 'sporeThrown', player: p, c, r, carry: true }); return true;
    }
    // ---- Canne à pêche : au bord de l'eau, on lance la ligne, le bouchon flotte, ça mord, le poisson saute dans les mains.
    waterNear(p) {
      const c = Math.floor(p.x), r = Math.floor(p.y), order = [DIRS[p.dir], ...DIRS.filter(D => D !== DIRS[p.dir])];
      for (const D of order) { const cc = c + D.dx, rr = r + D.dy; if (this.inside(cc, rr) && this.tAt(cc, rr) === T_WATER) return { c: cc, r: rr, dir: DIRS.indexOf(D) }; }
      return null;
    }
    startFishing(p) {
      if (p.fishing) return false; const w = this.waterNear(p); if (!w) { this.events.push({ type: 'noWater', player: p, carry: true }); return false; }
      p.fishing = { c: w.c, r: w.r, t: 0, dur: 2.8, bit: false, caught: false, ripple: 0 }; p.dir = w.dir; p.running = false; p.input.dx = p.input.dy = 0; p.onBomb = null;
      this.setPose(p, 'fish', 99); this.events.push({ type: 'fishCast', player: p, carry: true }); return true;
    }
    updateFishing(p, dt) {
      const f = p.fishing; f.t += dt; p.animT += dt; p.poseT += dt; p.moving = false; p.running = false; p.wasMoving = false; p.input.dx = p.input.dy = 0;
      const wx = f.c + 0.5, wy = f.r + 0.5, wz = this.groundZ(wx, wy);
      if (f.t > 0.5 && f.t < 1.9) { f.ripple += dt; if (f.ripple > 0.55) { f.ripple = 0; this.particles.push({ x: wx, y: wy, z: wz + 0.02, gz: wz, vx: 0, vy: 0, vz: 0, life: 0.8, t: 0, color: 'rgba(230,245,255,0.8)', size: 0.06, float: true, ring: true }); } }
      if (f.t >= 1.9 && !f.bit) { f.bit = true; this.burst(wx, wy, 0.3, '#9fd4ff', 12); this.events.push({ type: 'fishBite', player: p }); }
      if (f.t >= 2.15 && !f.caught) { f.caught = true; this.events.push({ type: 'fishCaught', player: p }); for (let k = 0; k < 6; k++) this.particles.push({ x: wx + (Math.random() - 0.5) * 0.4, y: wy, z: wz + 0.3, gz: wz, vx: (Math.random() - 0.5) * 0.4, vy: 0, vz: 0.8 + Math.random() * 0.4, life: 0.7, t: 0, color: '#fff6c0', size: 0.08, float: true }); }
      if (f.t >= f.dur) {
        p.fishing = null; this.setPose(p, 'idle');
        if (!this.applyItem(p, { type: 'fish', value: 1 })) { const spot = this.freeCellNear(Math.floor(p.x), Math.floor(p.y)); if (spot) this.spawnItem(spot.c, spot.r, 'fish'); }
        this.events.push({ type: 'fished', player: p });
      }
    }
    freeCellNear(c, r) {
      for (let d = 0; d <= 2; d++) for (let dr = -d; dr <= d; dr++) for (let dc = -d; dc <= d; dc++) { if (Math.max(Math.abs(dc), Math.abs(dr)) !== d) continue; const cc = c + dc, rr = r + dr; if (this.inside(cc, rr) && !this.cell(cc, rr) && this.walkableTerrain(cc, rr) && !this.itemAt(cc, rr) && !this.bombAt(cc, rr) && Math.abs(this.hAt(cc, rr) - this.hAt(c, r)) < 0.01) return { c: cc, r: rr }; }
      return null;
    }
    // Le poisson lancé vole deux cases, assomme un monstre (2-3 points) ou retombe au sol en frétillant (on le ramasse).
    // (kind = 'carrot' : la carotte vole pareil, mais ne blesse personne ; elle retombe au sol et attire les lapins)
    throwFish(p, kind) {
      const D = DIRS[p.dir], c = Math.floor(p.x), r = Math.floor(p.y); let tc = c + D.dx * 2, tr = r + D.dy * 2; if (!this.inside(tc, tr)) { tc = c + D.dx; tr = r + D.dy; } if (!this.inside(tc, tr)) return false;
      this.fishes.push({ kind: kind || 'fish', x0: p.x, y0: p.y, x1: tc + 0.5, y1: tr + 0.5, c: tc, r: tr, t: 0, dur: 0.5, by: p, x: p.x, y: p.y, z: 0.8 });
      this.setPose(p, 'throw', 0.35); this.events.push({ type: kind === 'carrot' ? 'carrotThrown' : 'fishThrown', player: p, carry: true }); return true;
    }
    updateFishes(dt) {
      for (const f of this.fishes.slice()) {
        f.t += dt; const u = Math.min(1, f.t / f.dur); f.x = f.x0 + (f.x1 - f.x0) * u; f.y = f.y0 + (f.y1 - f.y0) * u; f.z = 0.8 * (1 - u) + Math.sin(u * Math.PI) * 0.7;
        if (u < 1) continue; this.fishes.splice(this.fishes.indexOf(f), 1);
        if (f.kind === 'carrot') { if (!this.walkableTerrain(f.c, f.r) || this.cell(f.c, f.r) || this.itemAt(f.c, f.r)) { const spot = this.freeCellNear(f.c, f.r); if (!spot) { this.burst(f.x1, f.y1, 0.3, '#ff8a1f', 6); continue; } f.c = spot.c; f.r = spot.r; } this.spawnItem(f.c, f.r, 'carrot'); this.events.push({ type: 'carrotLanded', c: f.c, r: f.r }); continue; }
        const e = this.enemies.find(e => !e.dead && Math.hypot(e.x - f.x1, e.y - f.y1) < (e.def.hitR || e.r) + 0.4);
        if (e) { this.hurtEnemy(e, f.by, 2 + (Math.random() < 0.5 ? 1 : 0)); this.burst(f.x1, f.y1, 0.3, '#8fd0ff', 10); this.events.push({ type: 'fishHit', enemy: e, player: f.by }); continue; }
        if (!this.walkableTerrain(f.c, f.r) || this.cell(f.c, f.r)) { const spot = this.walkableTerrain(f.c, f.r) ? this.freeCellNear(f.c, f.r) : null; if (!spot) { this.burst(f.x1, f.y1, 0.3, '#9fd4ff', 8); this.events.push({ type: 'fishLost', player: f.by }); continue; } f.c = spot.c; f.r = spot.r; }
        if (this.itemAt(f.c, f.r)) { const spot = this.freeCellNear(f.c, f.r); if (spot) { f.c = spot.c; f.r = spot.r; } }
        this.spawnItem(f.c, f.r, 'fish'); this.events.push({ type: 'fishLanded', c: f.c, r: f.r });
      }
      for(const fire of this.campfires.slice()) {
        const elapsed=fire.remaining==null?dt:Math.min(dt,Math.max(0,fire.remaining));
        const k=fire.cook;
        if(k){
          k.t+=elapsed;
          while(k.t>=k.dur-1e-8&&(k.left||0)>0){
            k.t=Math.max(0,k.t-k.dur);k.left--;
            const spot=this.freeCellNear(fire.c,fire.r)||{c:fire.c,r:fire.r};this.spawnItem(spot.c,spot.r,k.output);
            const cooked=this.items[this.items.length-1],owner=k.by;
            if(owner?.alive&&this.players.includes(owner)&&!owner.boat&&!owner.air&&!owner.falling&&Math.hypot(owner.x-fire.c-.5,owner.y-fire.r-.5)<1.7&&Math.abs(this.groundZ(owner.x,owner.y)-this.hAt(fire.c,fire.r))<.1)this.takeItem(owner,cooked);
            this.burst(fire.c+.5,fire.r+.5,.4,'#ffd54a',10);this.events.push({type:'cookDone',fire,player:k.by});
          }
          if(!k.left)fire.cook=null;
        }
        if(fire.remaining!=null){
          fire.remaining-=dt;
          if(fire.remaining<=1e-8){
            const i=this.idx(fire.c,fire.r);if(this.deco[i]==='campfire'){this.deco[i]=null;this.cells[i]=0;}
            this.campfires.splice(this.campfires.indexOf(fire),1);
            for(const p of this.players)if(p.nearFire===fire)p.nearFire=null;
            if(fire.cook)for(let n=0;n<fire.cook.left;n++)this.spawnItem(fire.c,fire.r,fire.cook.input);
            fire.cook=null;this.burst(fire.c+.5,fire.r+.5,.2,'#aaa',6);
          }
        }
      }
    }

    // Volcan (3 × 3) : il fume sans arrêt, et toutes les 6 à 10 s il crache des blocs de lave qui retombent autour.
    updateVolcanoes(dt) {
      for (const v of this.volcanoes) {
        v.t += dt; v.cool -= dt; if (v.erupt > 0) v.erupt -= dt; const top = this.hAt(v.c, v.r) + 2.3, x = v.c + 0.5, y = v.r + 0.5;
        if (Math.random() < (v.erupt > 0 ? 12 : 2.5) * dt) this.particles.push({ x: x + (Math.random() - 0.5) * 0.4, y: y - 0.2, z: top, gz: 0, vx: (Math.random() - 0.5) * 0.2, vy: 0, vz: 0.5 + Math.random() * 0.4, life: 2.4, t: 0, color: v.erupt > 0 ? 'rgba(60,50,50,0.6)' : 'rgba(110,110,120,0.4)', size: 0.22 + Math.random() * 0.18, float: true });
        if (v.cool <= 0) {
          v.cool = 6 + Math.random() * 4; v.erupt = 1.4; this.shake = Math.max(this.shake, 0.3); this.events.push({ type: 'eruption', c: v.c, r: v.r });
          for (let k = 0; k < 18; k++) { const a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 1.6; this.particles.push({ x, y: y - 0.2, z: top, gz: this.hAt(v.c, v.r), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, vz: 3.2 + Math.random() * 2.8, life: 1.6 + Math.random() * 0.6, t: 0, color: Math.random() < 0.5 ? '#ff6a1f' : '#ffb03a', size: 0.1 + Math.random() * 0.14 }); }
          for (let k = 0; k < 10; k++) this.particles.push({ x: x + (Math.random() - 0.5) * 0.5, y: y - 0.2, z: top, gz: 0, vx: (Math.random() - 0.5) * 0.6, vy: 0, vz: 1 + Math.random(), life: 2, t: 0, color: 'rgba(40,35,35,0.7)', size: 0.3 + Math.random() * 0.2, float: true });
        }
      }
    }
    // Cuire un poisson au feu de camp (5 s) ; le poisson grillé apparaît à côté du feu.
    fireNear(p) { return this.campfires.find(f => Math.hypot(p.x - f.c - 0.5, p.y - f.r - 0.5) < 1.7) || null; }
    cookFish(p, fire, type, quantity=1) {
      fire = fire || this.fireNear(p); const inv = p.inv || [], i = inv.findIndex(s => type ? s.type === type : !!BK.COOKABLE[s.type]); if (!fire || fire.cook || i < 0 || !Number.isSafeInteger(quantity) || quantity<1 || quantity>inv[i].n || !BK.COOKABLE[inv[i].type]) return false;
      const s = inv[i]; s.n-=quantity; if ((s.perm || 0) > s.n) s.perm = s.n; if (s.n <= 0) inv.splice(i, 1);
      fire.cook = { t: 0, dur: 5, by: p, left:quantity,total:quantity,input:s.type, output: BK.COOKABLE[s.type] }; this.events.push({ type: 'cookStart', fire, player: p, carry: true }); return true;
    }
    // Manger le poisson grillé : la vie max (et la vie) double pendant 3 minutes.
    eatFish(p) {
      if (!p.feastT) { p.feastBase = p.maxHp; p.maxHp = p.feastBase * 2; p.hp = Math.min(p.maxHp, p.hp * 2); }
      p.feastT = 180; this.setPose(p, 'drink', 0.8); this.burst(p.x, p.y, 0.4, '#ff8a1f', 12); this.events.push({ type: 'feast', player: p, carry: true });
    }
    // Boire à la fontaine : 1,5 s immobile, la stamina remonte à fond.
    drink(p) {
      const f = p.nearFountain; if (!f || p.drinkT > 0) return false;
      p.drinkT = 1.5; p.running = false; p.input.dx = p.input.dy = 0; p.dir = Math.abs(f.c + 0.5 - p.x) > Math.abs(f.r + 0.5 - p.y) ? (f.c + 0.5 > p.x ? 3 : 1) : (f.r + 0.5 > p.y ? 0 : 2);
      this.setPose(p, 'drink', 1.5); this.events.push({ type: 'drink', player: p }); return true;
    }
    // Une statue brisée par un boulet, une fusée ou un crachat de monstre marin laisse toujours un objet.
    destroyStatue(c, r) {
      const i = this.idx(c, r); this.cells[i] = 0; this.deco[i] = null;
      this.burst(c + 0.5, r + 0.5, 0.6, '#9aa3ad', 14, 1); this.burst(c + 0.5, r + 0.5, 0.4, '#5f6771', 8, 1); this.shake = Math.max(this.shake, 0.15);
      this.events.push({ type: 'statueBroken', c, r });
      this.spawnItem(c, r);
    }
    spawnItem(c, r, type) {
      type=BK.remedyId(type);
      if (!type) { const pool = this.itemPool.filter(k => k!=='fusion' || this.players.some(p=>p.alive&&p.kick&&!p.fusion)).map(k => ({ k, w: BK.ITEMS[k].weight })); let tot = pool.reduce((a, p) => a + p.w, 0), x = Math.random() * tot; for (const p of pool) { x -= p.w; if (x <= 0) { type = p.k; break; } } type = type || (pool[0] && pool[0].k) || 'heart'; }
      type=BK.remedyId(type);
      const value = type === 'heart' ? (arguments[3] || [5, 10, 10, 20][Math.floor(Math.random() * 4)]) : type === 'honey' ? (arguments[3] || 3) : undefined;
      this.items.push({ cx: c, cy: r, type, value, born: this.time, t: Math.random() * 6 });
    }
    // Effet d'un objet (ramassé ou acheté). Le pot de miel va dans l'inventaire (24 piles max) ; faux si l'inventaire est plein.
    // bought : objet acheté (il reste pour toujours ; dans l'inventaire, perm compte les pots achetés, gardés d'un tableau à l'autre)
    applyItem(p, it, bought) {
      it.type=BK.remedyId(it.type);BK.normalizeRemedyBag(p);
      const I = BK.ITEMS[it.type] || {};
      if(it.type==='mini'||it.type==='giant'){p.sizeT=15;p.sizeScale=it.type==='mini'?.4:2;this.burst(p.x,p.y,.4,I.color,16);return true;}
      if(it.type==='bombdiarrhea') {p.diarrheaT=15;return true;}
      if(it.type==='shortfuse') {p.shortfuseT=20;return true;}
      if(it.type==='fusion' && !p.kick) { this.events.push({type:'needKick',player:p,carry:true});return false; }
      if(BK.BOMB_POWERS.includes(it.type)) { p[it.type]=true;return true; }
      if (I.usable) {   // objets d'inventaire (miel, canne, poisson…) : 24 cases, les mêmes s'empilent, la canne est unique
        p.inv = p.inv || []; const slot = p.inv.find(s => s.type === it.type), n = it.value || (it.type === 'honey' ? 3 : 1);
        if (slot) { if (I.unique) return false; slot.n += n; if (bought) slot.perm = (slot.perm || 0) + n; } else if (p.inv.length < BK.BAG_SIZE) p.inv.push({ type: it.type, n, perm: bought ? n : 0 });
        else { if (!it.fullT || this.time - it.fullT > 1.5) { it.fullT = this.time; this.events.push({ type: 'invFull', player: p }); } return false; }
      }
      else if (it.type === 'bomb') p.bombsMax = Math.min(BK.MAX_BOMBS, p.bombsMax + 1);
      else if (it.type === 'fire') p.fire = Math.min(BK.MAX_FIRE, p.fire + 1);
      else if (it.type === 'speed') { if (p.speedUp < BK.MAX_SPEED_UP) { p.speedUp++; p.speed += 0.45; } }
      else if (it.type === 'kick') p.kick = true;
      else if (it.type === 'gloves') p.gloves = true;
      else if (it.type === 'lantern') p.lantern = true;
      else if (it.type === 'shield') p.shield = 1;
      else if (it.type === 'card') { p.cards = (p.cards || 0) + 1; p.score += 200; }
      else if (it.type === 'coin') { p.gold = (p.gold || 0) + 1; p.score += 20; }
      else if (it.type === 'heart') this.heal(p, it.value || 10);
      return true;
    }
    // Carotte plantée : on marche dessus pour la cueillir (elle va dans l'inventaire, 24 cases).
    pickCarrot(p, c, r) {
      if (!this.applyItem(p, { type: 'carrot' })) return false;
      this.deco[this.idx(c, r)] = null; p.found = p.found || []; const f = p.found.find(x => x.type === 'carrot'); if (f) f.n++; else p.found.push({ type: 'carrot', n: 1 });
      this.setPose(p, 'pickup', 0.3); this.burst(p.x, p.y, 0.35, '#ff8a1f', 8); this.burst(p.x, p.y, 0.3, '#3fae4a', 5, 1); this.events.push({ type: 'carrotPicked', player: p, c, r }); return true;
    }
    takeItem(p, it) {
      if (!this.applyItem(p, it)) return;
      this.items.splice(this.items.indexOf(it), 1); p.score += BK.ITEM_SCORE;
      p.found = p.found || []; const f = p.found.find(x => x.type === it.type); if (f) f.n++; else p.found.push({ type: it.type, n: 1 });   // trouvés dans ce tableau (affichés sous les barres)
      this.burst(p.x, p.y, 0.4, BK.ITEMS[it.type].color, 10);
      this.events.push({ type: 'itemTaken', player: p, item: it.type });
    }
    giveItem(p, type, value, bought) { if (!this.applyItem(p, { type, value }, bought)) return false; this.burst(p.x, p.y, 0.4, BK.ITEMS[type].color, 10); this.events.push({ type: 'itemTaken', player: p, item: type }); return true; }

    // ------------------------------------------------------------------ ennemis
    addEnemy(type, c, r, o) {
      const def = BK.ENEMIES[type];
      const e = { type, def, x: c + 0.5, y: r + 0.5, dir: Math.floor(Math.random() * 4), speed: def.speed, hp: def.hp, maxHp: def.hp, r: def.r, t: Math.random() * 10, hurt: 0, dead: false, deadT: 0,
        home: def.peaceful ? { c, r } : undefined, pause: def.peaceful ? Math.random() * 1.5 : 0, ghost: def.behavior === 'ghost', target: null, state: 'walk', stateT: 0, z: 0, boss: def.boss || null, name: def.name, ...(o || {}) };
      this.enemies.push(e); return e;
    }
    hurtEnemy(e, by, dmg, source) {
      if(e.bond?.pets>=2&&e.bond?.meals>=1&&!BK.settings.friendlyFire&&(by?.id===e.bond.owner||by?.leader?.id===e.bond.owner))return false;
      if(e.arenaBoss && (by===e || e.state==='sealed' || e.state==='transform'))return false;
      const helper=by?.ally?by:null;
      if(by?.ally)by=by.leader;
      if (e.def.peaceful && !e.def.huntable || e.dead || e.hurt > 0 || (e.z > 0.2 && !((e.def.behavior==='wasp'||e.type==='oiseau')&&source==='bomb')) || e.state === 'hidden') return false;
      e.hp -= dmg || 1; e.hurt = e.boss ? 1.0 : 0.7;   // plus long que la flamme : une bombe = un coup
      if(e.swallowed&&helper&&helper.leader===e.swallowed){const captive=e.swallowed;captive.swallowT=Math.max(0,captive.swallowT-.8*(dmg||1));this.addFloater(e.x,e.y,'À la rescousse !',{color:'#a5f3ca',size:.3,life:1});if(captive.swallowT<=0)this.releaseSwallowed(captive);}
      this.events.push({ type: 'enemyHurt', enemy: e, player: by });
      if(e.hp<=0&&e.arenaBoss&&e.phase===1){e.phase=2;e.hp=e.maxHp=12;e.name='Golem de braise';e.state='transform';e.stateT=0;e.hurt=2;e.attack=null;this.events.push({type:'arenaTransform'});this.burst(e.x,e.y,1,'#ff793c',40);return true;}
      if (e.hp <= 0) {
        if(e.swallowed)this.releaseSwallowed(e.swallowed);
        e.dead = true; e.deadT = 0; if (by) { by.score += e.def.score; if (!e.def.peaceful) by.kills++; }
        this.burst(e.x, e.y, e.r * 1.4, e.def.color, e.boss ? 40 : 14);
        this.events.push({ type: 'enemyKilled', enemy: e, player: by });
        if (e.boss) this.events.push({ type: 'bossDead', enemy: e, player: by });
        if(e.type==='abeille') {
          let spot=this.freeCellNear(Math.floor(e.x),Math.floor(e.y));
          if(!spot){let distance=Infinity;for(let r=0;r<this.rows;r++)for(let c=0;c<this.cols;c++){const d=Math.hypot(c+.5-e.x,r+.5-e.y);if(d<distance&&this.walkableTerrain(c,r)&&!this.cell(c,r)&&!this.itemAt(c,r)){spot={c,r};distance=d;}}}
          if(spot)this.spawnItem(spot.c,spot.r,'honey',1);
          return true;
        }
        if (e.def.huntable) { for (let n=0;n<(e.def.meat||1);n++) this.spawnItem(Math.floor(e.x),Math.floor(e.y),source === 'bomb' ? (e.def.lootCooked||'meatcooked') : (e.def.lootRaw||'meatraw')); return true; }
        if (this.coins) { const c = Math.floor(e.x), r = Math.floor(e.y); const n = e.boss ? 10 : Math.random() < 0.7 ? 1 : 0; for (let k = 0; k < n; k++) { const cc = c + (k % 3) - 1, rr = r + Math.floor(k / 3) - 1; if (this.inside(cc, rr) && !this.cell(cc, rr) && !this.itemAt(cc, rr) && this.walkableTerrain(cc, rr)) this.spawnItem(cc, rr, 'coin'); } }
      }
      return true;
    }
    // Première case du plus court chemin de (c0,r0) vers (c1,r1) ; passable(cell) dit quelles cases on peut traverser.
    stepToward(c0, r0, c1, r1, passable) {
      if (c0 === c1 && r0 === r1) return null;
      const prev = new Map(), key = (c, r) => c + ',' + r, q = [{ c: c0, r: r0 }]; prev.set(key(c0, r0), null);
      while (q.length) {
        const cur = q.shift();
        for (const D of DIRS) { const c = cur.c + D.dx, r = cur.r + D.dy, k = key(c, r); if (!this.inside(c, r) || prev.has(k) || !passable({ c, r }, cur)) continue; prev.set(k, cur); if (c === c1 && r === r1) { let n = { c, r }; while (prev.get(key(n.c, n.r)) && (prev.get(key(n.c, n.r)).c !== c0 || prev.get(key(n.c, n.r)).r !== r0)) n = prev.get(key(n.c, n.r)); return n; } q.push({ c, r }); }
      }
      return null;
    }
    nearestPlayer(x, y) { let best = null, bd = 1e9; for (const p of this.players) { if (!p.alive || p.npc) continue; const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } } return best; }
    freeDirs(c, r, who) { const out = []; for (let d = 0; d < 4; d++) { const D = DIRS[d]; if (!this.blocked(c + D.dx, r + D.dy, who || { x: c + 0.5, y: r + 0.5 }) && !this.falling.some(f => f.c === c + D.dx && f.r === r + D.dy)) out.push(d); } return out; }

    // ------------------------------------------------------------------ mise à jour
    update(dt) {
      this.time += dt; const carried = this.events.filter(e => e.carry); this.events.length = 0; for (const e of carried) { e.carry = false; this.events.push(e); }   // événements nés hors de la mise à jour (touche, clic) : vus au prochain tour
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
      if (!this.frozen) {
        for (const p of this.players) {if(p.ally)this.updateAlly(p,dt);this.updatePlayer(p, dt);}
        this.updateArenaEffects(dt);
        for(const bar of this.firebars){const props=this.props[bar.c+','+bar.r]||{},speed=props.speed==='slow'?.5:props.speed==='fast'?2:1;bar.angle=(bar.angle+dt*.9*speed*(props.direction===-1?-1:1))%(Math.PI*2);}
        this.updateBombs(dt); this.updateTerrariums(dt); this.updateFishes(dt); this.updateVolcanoes(dt);
        if (this.dayCycle) { const night = this.darkness() > 0.3; if (night !== this.wasNight) { this.wasNight = night; this.events.push({ type: night ? 'dusk' : 'dawn' }); } }
        this.updateFlames(dt); this.updateSparks(dt);
        for (const e of this.enemies) this.updateEnemy(e, dt);
        for (const hv of this.hives) hv.cool -= dt; for (const q of this.puddles) q.t += dt; this.puddles = this.puddles.filter(q => q.t < q.dur); for (const d of this.debris) d.t += dt; this.debris = this.debris.filter(d => d.t < d.dur); for (const [k, v] of this.bounceT) { if (v - dt <= 0) this.bounceT.delete(k); else this.bounceT.set(k, v - dt); } for (const [k, v] of this.growT) { if (v + dt >= 0.6) { this.growT.delete(k); const c = k % this.cols, r = Math.floor(k / this.cols); this.burst(c + 0.5, r + 0.5, 0.45, 'rgba(240,220,200,0.8)', 10); this.events.push({ type: 'mushroomGrown', c, r }); } else { this.growT.set(k, v + dt); if (Math.random() < 8 * dt) { const c = k % this.cols, r = Math.floor(k / this.cols), z = this.hAt(c, r); this.particles.push({ x: c + 0.5 + (Math.random() - 0.5) * 0.8, y: r + 0.8, z, gz: z, vx: (Math.random() - 0.5) * 0.5, vy: 0, vz: 0.4, life: 0.5, t: 0, color: 'rgba(120,90,60,0.7)', size: 0.07 }); } } }
        this.updateShots(dt); this.updateLifts(dt); this.updateElevators(dt); this.updateMovers(dt); this.updateQuakes(dt);
        this.enemies = this.enemies.filter(e => !e.dead || e.deadT < 1.2);
        this.updateRain(dt);
        this.checkHits();
      } else { for (const p of this.players) { p.animT += dt; p.poseT += dt; } for (const e of this.enemies) e.t += dt; this.updateFlames(dt); }
      for (const it of this.items) it.t += dt;
      this.updateParticles(dt); this.updateFloaters(dt);
    }
    updatePlayer(p, dt) {
      p.animT += dt; p.poseT += dt; if (p.invuln > 0) p.invuln -= dt;
      if (p.npc) { if (p.sayT > 0) { p.sayT -= dt; if (p.sayT <= 0) BK.sayNext(p); } p.pose = p.seat ? 'sit' : 'idle'; return; }
      if (!p.alive) { p.deadT += dt; return; }
      p.tongueSlow=Math.max(0,(p.tongueSlow||0)-dt);
      p.swallowSafe=Math.max(0,(p.swallowSafe||0)-dt);
      p.sizeT=Math.max(0,(p.sizeT||0)-dt);if(!p.sizeT)p.sizeScale=1;
      p.diarrheaT=Math.max(0,(p.diarrheaT||0)-dt);p.shortfuseT=Math.max(0,(p.shortfuseT||0)-dt);p.autoBombT=Math.max(0,(p.autoBombT||0)-dt);
      if (p.drinkT > 0) {   // à la fontaine : on boit, la stamina remonte à fond
        p.drinkT -= dt; p.moving = false; p.running = false; p.wasMoving = false; p.input.dx = p.input.dy = 0; p.animT += dt; p.poseT += dt;
        p.stamina = Math.min(p.staminaMax, p.stamina + p.staminaMax / 1.2 * dt);
        if (Math.random() < 10 * dt) { const zg2 = this.explore ? this.groundZ(p.x, p.y) : 0; this.particles.push({ x: p.x + (Math.random() - 0.5) * 0.4, y: p.y, z: zg2 + 0.9, gz: zg2, vx: (Math.random() - 0.5) * 0.6, vy: 0, vz: 1.2, life: 0.5, t: 0, color: 'rgba(120,190,255,0.9)', size: 0.07 }); }
        if (p.drinkT <= 0) { p.drinkT = 0; p.stamina = p.staminaMax; this.setPose(p, 'idle'); this.events.push({ type: 'drank', player: p }); }
        return;
      }
      if (p.feastT > 0) { p.feastT -= dt; if (p.maxHp < p.feastBase * 2 - 0.01) p.maxHp = p.feastBase * 2; if (p.feastT <= 0) { p.feastT = 0; p.maxHp = p.feastBase; p.hp = Math.min(p.hp, p.maxHp); this.events.push({ type: 'feastEnd', player: p }); } }
      this.autoAntipoison(p);
      if (p.poison > 0) {   // empoisonné : bulles vertes, 2 points de vie par seconde
        p.poison -= dt; p.poisonTick -= dt; const zg = this.explore ? this.groundZ(p.x, p.y) : 0;
        if (Math.random() < 8 * dt) this.particles.push({ x: p.x + (Math.random() - 0.5) * 0.5, y: p.y, z: zg + 0.3 + Math.random() * 0.5, gz: zg, vx: (Math.random() - 0.5) * 0.2, vy: 0, vz: 0.7, life: 0.9, t: 0, color: Math.random() < 0.5 ? 'rgba(126,240,90,0.85)' : 'rgba(60,170,40,0.8)', size: 0.07 + Math.random() * 0.06, float: true });
        if (p.poisonTick <= 0) { p.poisonTick = 1; this.damage(p, 2, { kind: 'poison' }); if (p.hp <= 0) { this.killPlayer(p, { kind: 'poison' }); return; } }
        if (p.poison <= 0) { p.poison = 0; this.events.push({ type: 'poisonEnd', player: p }); }
      }
      if(p.swallowedBy){this.updateSwallowed(p,dt);return;}
      if(p.seat){p.input.bomb=false;p.moving=p.running=false;if(p.input.action||p.input.dx||p.input.dy){p.input.action=false;this.useSeat(p);}else this.setPose(p,'sit');return;}
      if (p.fishing) { this.updateFishing(p, dt); return; }
      if (p.boat) {this.updateBoat(p,dt);return;}
      if (p.input.action && this.nearbyBoat(p)) {p.input.action=false;this.useBoat(p);return;}
      if (p.falling) { this.updateFall(p, dt); return; }
      if (p.air) { this.updateAir(p, dt); return; }
      if (p.frozen > 0) { p.frozen -= dt; p.moving = false; p.running = false; p.wasMoving = false; if (!p.poseDur) p.pose = 'idle'; if (p.frozen <= 0) { p.frozen = 0; this.burst(p.x, p.y, 0.35, '#bfefff', 10); } return; }   // gelé par un éclat de glace : on attend que ça fonde
      if(this.updateBombStun?.(p,dt))return;
      const inp = p.input;
      // actions
      const busy = (p.pose === 'pickup' || p.pose === 'throw') && p.poseT < p.poseDur;
      if (inp.bomb && !busy) {
        inp.bomb = false;
        if (p.carrying) { if(p.inflate && !p.carrying.rock) p.inflating=p.carrying; else this.throwBomb(p); }
        else if (this.bombAt(Math.floor(p.x), Math.floor(p.y))) { if(this.pickupBomb(p) && p.inflate && inp.bombHeld && !p.carrying.rock) p.inflating=p.carrying; }
        else if (!this.placeBomb(p)) { if(this.pickupBomb(p) && p.inflate && inp.bombHeld && !p.carrying.rock) p.inflating=p.carrying; }
      }
      if(p.inflating) {
        const b=p.inflating;
        if(p.carrying!==b || b.exploded) p.inflating=null;
        else if(inp.bombHeld) {
          if(b.baseFire==null){b.baseFire=b.fire;b.baseDamage=b.damage||1;}
          b.inflation=Math.min(1,(b.inflation||0)+dt/1.1);b.fire=b.baseFire+Math.floor(b.inflation*2);b.damage=b.baseDamage+Math.floor(b.inflation*2);
        } else if(!busy) this.throwBomb(p);
      }
      if (inp.action && !busy) { inp.action = false; if (this.useSnail(p)) { /* escargot */ } else if (!p.carrying && this.petAnimal(p)) { /* caresse */ } else if (p.carrying) this.throwBomb(p); else this.pickupBomb(p); }
      // debout sur une bombe : on rebondit sur place ; une direction = grand bond dans cette direction
      if (p.onBomb) {
        const b = p.onBomb;
        if (b.state !== 'idle' || b.exploded || p.carrying) { p.onBomb = null; p.zOff = 0; }
        else {
          p.x = b.x; p.y = b.y; p.zOff = 0.55 + 0.07 * Math.abs(Math.sin(p.animT * 6)); p.moving = false; p.running = false; p.wasMoving = false;
          if (p.poseDur && p.poseT >= p.poseDur) { p.poseDur = 0; p.pose = 'idle'; } if (!p.poseDur) p.pose = 'idle';
          const ddx = inp.dx || 0, ddy = inp.dy || 0;
          // il faut relâcher puis réappuyer une direction : arriver sur la bombe en marchant ne catapulte pas tout de suite
          if (Math.hypot(ddx, ddy) < 0.5) p.leapLock = false;
          else if (!busy && !p.leapLock) { p.dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 3 : 1) : (ddy > 0 ? 0 : 2); this.leap(p, p.dir); }
          p.nearDoor = null; return;
        }
      }
      // déplacement
      let dx = inp.dx || 0, dy = inp.dy || 0;
      const lockMove = p.pose === 'pickup' && p.poseT < 0.25 || p.pose === 'throw' && p.poseT < 0.15 || p.pose === 'hit' && p.poseT < 0.3;
      if (lockMove) { dx = dy = 0; }
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      p.moving = len > 0.05;
      if (p.moving) { if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 3 : 1; else p.dir = dy > 0 ? 0 : 2; }
      // course : deux appuis rapides dans la même direction ; elle use la stamina et s'arrête quand on lâche
      if (!p.bot && p.moving && !p.wasMoving) { if (p.lastTap && p.lastTap.dir === p.dir && this.time - p.lastTap.t < BK.DOUBLE_TAP && p.stamina > 5) { p.running = true; p.curSpeed = p.speed; } p.lastTap = { dir: p.dir, t: this.time }; }
      if (!p.moving || p.stamina <= 0) p.running = false;
      const target = p.speed * (p.running ? BK.RUN_MULT * ((p.sizeScale || 1) < 1 ? 2 : 1) : 1) * (p.tongueSlow>0?.2:1) * this.toadSlimeSlow(p);
      p.curSpeed = p.running ? Math.min(target, Math.max(p.speed, p.curSpeed) + BK.RUN_ACCEL * dt) : target;
      if (p.running) { p.stamina = Math.max(0, p.stamina - BK.RUN_COST * dt); p.staminaWait = 0.7; p.dustT += dt; if (p.dustT > 0.14) { p.dustT = 0; this.burst(p.x - DIRS[p.dir].dx * 0.2, p.y - DIRS[p.dir].dy * 0.2, 0.15, 'rgba(230,220,200,0.8)', 2); } }
      else { p.staminaWait -= dt; if (p.staminaWait <= 0 && p.stamina < p.staminaMax) p.stamina = Math.min(p.staminaMax, p.stamina + p.staminaMax * p.staminaRegen / 100 * dt); }
      p.wasMoving = p.moving;
      const gz0 = this.explore ? this.groundZ(p.x, p.y) : 0;
      const onIce = this.explore && this.tAt(Math.floor(p.x), Math.floor(p.y)) === T_ICE;
      if (onIce) {   // glace : on glisse, les commandes répondent lentement et on continue sur sa lancée
        const tx = dx * p.curSpeed, ty = dy * p.curSpeed, k = Math.min(1, 1.6 * dt);
        p.vx = (p.vx || 0) + (tx - (p.vx || 0)) * k; p.vy = (p.vy || 0) + (ty - (p.vy || 0)) * k;
        const ox = p.x, oy = p.y; this.moveCircle(p, p.vx * dt, p.vy * dt, p);
        if (Math.abs(p.x - ox) < 1e-6) p.vx = 0; if (Math.abs(p.y - oy) < 1e-6) p.vy = 0;
        const sp = Math.hypot(p.vx, p.vy); if (p.moving) p.walk += dt * 3; if (sp > 0.3 && Math.random() < sp * 3 * dt) this.burst(p.x, p.y, 0.12, 'rgba(230,245,255,0.8)', 1);
      } else {
        p.vx = dx * p.curSpeed; p.vy = dy * p.curSpeed;
        if (p.moving) {
          const step = p.curSpeed * dt;
          this.moveCircle(p, dx * step, dy * step, p);
          p.walk += dt * (6 + p.curSpeed * 1.5);
          // neige : chaque pas crisse doucement (héros seulement)
          if (p.human && !p.npc && this.explore) { const ph = Math.floor(p.walk / 3); if (ph !== p.stepPh) { p.stepPh = ph; if (this.tAt(Math.floor(p.x), Math.floor(p.y)) === T_SNOW) this.events.push({ type: 'snowStep', player: p }); } }
        }
      }
      if(p.diarrheaT>0 && p.moving && !p.carrying && !p.air && !p.onBomb && p.autoBombT<=0) { if(this.placeBomb(p)) p.autoBombT=0.22; }
      // descendu d'un rebord : on reste en l'air un instant et on retombe avec un petit nuage
      const gz1 = this.explore ? this.groundZ(p.x, p.y) : 0;
      if (gz1 < gz0 - 0.3 && !p.onBomb) { p.zOff = (p.zOff || 0) + (gz0 - gz1); p.dropV = 0; }
      if (p.zOff > 0 && !p.onBomb && !p.air) { p.dropV = (p.dropV || 0) - 18 * dt; p.zOff = Math.max(0, p.zOff + p.dropV * dt); if (p.zOff === 0) { p.dropV = 0; this.burst(p.x, p.y, 0.2, 'rgba(230,220,200,0.8)', 3); } }
      // enfoncé dans une case qui bloque (au pied du rebord dont on vient de sauter) : on est repoussé doucement dehors
      if (this.explore && !p.onBomb) { const ov = this.collides(p.x, p.y, p.r, p); if (ov) { const nx = Math.max(ov.c, Math.min(ov.c + 1, p.x)), ny = Math.max(ov.r, Math.min(ov.r + 1, p.y)); let ux = p.x - nx, uy = p.y - ny, d = Math.hypot(ux, uy); if (d < 1e-6) { ux = p.x - ov.c - 0.5; uy = p.y - ov.r - 0.5; d = Math.hypot(ux, uy) || 1; ux /= d; uy /= d; d = 0; } else { ux /= d; uy /= d; } const push = Math.min(p.r - d + 0.002, 4 * dt), tx = p.x + ux * push, ty = p.y + uy * push; if (!this.collides(tx, ty, p.r, p, p)) { p.x = tx; p.y = ty; } } }
      // pose
      if (p.poseDur && p.poseT >= p.poseDur) { p.poseDur = 0; p.pose = 'idle'; }
      if (!p.poseDur) { if (p.carrying) p.pose = p.moving ? 'carrywalk' : 'carry'; else p.pose = p.moving ? 'walk' : 'idle'; }
      if (this.hives.length && !p.npc) for (const hv of this.hives) {
        if (Math.abs(Math.floor(p.x) - hv.c) <= 1 && Math.abs(Math.floor(p.y) - hv.r) <= 1 && hv.cool <= 0 && this.enemies.filter(e => !e.dead && e.hive === hv).length < 3) {
          hv.cool = 4; const bee = this.addEnemy('abeille', hv.c, hv.r, { hive: hv, z: 0.9, cool: 0.6 }); this.burst(hv.c + 0.5, hv.r + 0.5, 0.3, '#ffd54a', 6); this.events.push({ type: 'beeOut', enemy: bee, hive: hv });
        }
      }
      // feu de camp : la vie remonte doucement quand on se repose tout près (stat « Repos au feu »)
      if (this.campfires.length && this.hearts && p.hp < p.maxHp && this.campfires.some(f => Math.hypot(p.x - f.c - 0.5, p.y - f.r - 0.5) < 1.7)) {
        p.fireT = (p.fireT || 0) + dt; p.campGlow = Math.min(1, (p.campGlow || 0) + dt * 3);   // aura rouge qui s'allume
        if (Math.random() < 5 * dt) { const zg2 = this.explore ? this.groundZ(p.x, p.y) : 0; this.particles.push({ x: p.x + (Math.random() - 0.5) * 0.7, y: p.y + (Math.random() - 0.5) * 0.3, z: zg2 + 0.2 + Math.random() * 0.4, gz: zg2, vx: (Math.random() - 0.5) * 0.15, vy: 0, vz: 0.6 + Math.random() * 0.3, life: 1.3, t: 0, color: Math.random() < 0.5 ? '#ff4d6d' : '#ff7a8a', size: 0.14 + Math.random() * 0.08, heart: true, float: true }); }
        if (p.fireT >= 1) { p.fireT -= 1; this.heal(p, Math.max(1, Math.round(p.fireRegen || 2))); this.events.push({ type: 'campfireHeal', player: p }); for (let k = 0; k < 4; k++) this.particles.push({ x: p.x + (Math.random() - 0.5) * 0.8, y: p.y, z: (this.explore ? this.groundZ(p.x, p.y) : 0) + 0.3, gz: 0, vx: (Math.random() - 0.5) * 0.3, vy: 0, vz: 0.9, life: 1.4, t: 0, color: '#ff4d6d', size: 0.2, heart: true, float: true }); }
      } else { p.fireT = 0; p.campGlow = Math.max(0, (p.campGlow || 0) - dt * 3); }
      if(p.ally)return;
      // objets, sortie
      const c = Math.floor(p.x), r = Math.floor(p.y);
      if (this.explore) { const t = this.tAt(c, r); if (t === T_WATER || t === T_VOID) { this.startFall(p, t === T_WATER ? 'water' : 'void'); return; } if (t === T_LAVA) { if (p.invuln <= 0 && !p.onBomb) { this.burst(p.x, p.y, 0.4, '#ff8a1f', 10); this.hitPlayer(p, { kind: 'lava', dmg: 5 }); this.events.push({ type: 'burn', player: p }); } } else p.safe = { x: c + 0.5, y: r + 0.5, dir: p.dir }; }
      const it = this.itemAt(c, r); if (it) this.takeItem(p, it);
      if (this.deco[this.idx(c, r)] === 'carrot') this.pickCarrot(p, c, r);
      // devant une porte (la case juste au sud, face à elle) : la pancarte « Entrer » s'affiche, Entrée fait entrer
      p.nearFountain = null; if (this.explore) { const pc = Math.floor(p.x), pr0 = Math.floor(p.y); for (let dc = -1; dc <= 1 && !p.nearFountain; dc++) for (let dr = -1; dr <= 1; dr++) { if (this.inside(pc + dc, pr0 + dr) && this.deco[this.idx(pc + dc, pr0 + dr)] === 'fountain') { p.nearFountain = { c: pc + dc, r: pr0 + dr }; break; } } }
      p.nearFire = null; if (this.campfires.length && !p.npc && (p.inv || []).some(s => !!BK.COOKABLE[s.type])) { const f = this.fireNear(p); if (f && !f.cook) p.nearFire = f; }
      p.nearDoor = null; for (const d of this.doors) if (d.enterable && Math.abs(p.x - d.c - 0.5) < 0.6 && p.y > d.r + 1 && p.y < d.r + 2.1) p.nearDoor = d;
      const exit=this.roomExit ? this.special.get(c+','+r)?.exit : this.exit;
      if (exit && exit.open && exit.c === c && exit.r === r && !exit.used) {
        if (this.roomExit || Math.hypot(p.x - c - 0.5, p.y - r - 0.5) < (exit.kind === 'diamond' ? 0.45 : 0.3)) { exit.used = true; this.events.push({ type: 'exit', player: p, kind: exit.kind }); }
      }
    }
    // Déplace un cercle (joueur ou boss) avec aide dans les coins et coup de pied dans les bombes.
    moveCircle(e, mx, my, who) {
      const rad = e.r, step = Math.hypot(mx, my);
      for (const axis of ['x', 'y']) {
        const m = axis === 'x' ? mx : my; if (!m) continue;
        const sign = m > 0 ? 1 : -1;
        const nx = axis === 'x' ? e.x + m : e.x, ny = axis === 'y' ? e.y + m : e.y;
        const hit = this.collides(nx, ny, rad, who, e);
        if (!hit) { e.x = nx; e.y = ny; continue; }
        // coup de pied
        const b = this.bombAt(hit.c, hit.r);
        // Avec le pouvoir, marcher pousse la bombe ; courir permet toujours de sauter dessus.
        if (b && !b.rock && who && who.human && !who.npc && !who.carrying && !who.air && b.state === 'idle' && (!who.kick || who.running)) { this.hopOnto(who, b); return; }
        if (b && !b.rock && who && who.kick && b.state === 'idle' && (!who.running || !who.human)) { const d = axis === 'x' ? (sign > 0 ? 3 : 1) : (sign > 0 ? 0 : 2); const D = DIRS[d]; const other = this.bombAt(b.cx + D.dx, b.cy + D.dy); if (!this.blocked(b.cx + D.dx, b.cy + D.dy) || who.fusion && other && !other.rock && !this.cell(other.cx, other.cy)) this.kickBomb(b, d, who); }
        if (who && who.boss && this.cell(hit.c, hit.r) === SOFT) { this.destroyBlock(hit.c, hit.r, null); continue; }
        // aide dans les coins : on glisse vers le passage le plus proche
        const cur = axis === 'x' ? Math.floor(e.y) : Math.floor(e.x);
        const enterC = axis === 'x' ? Math.floor(e.x) + sign : Math.floor(e.x), enterR = axis === 'x' ? Math.floor(e.y) : Math.floor(e.y) + sign;
        const off = (axis === 'x' ? e.y : e.x) - (cur + 0.5);
        let goal = null;
        if (!this.blocked(enterC, enterR, who)) goal = cur + 0.5;
        else if (axis === 'x') { if (off > 0.05 && !this.blocked(enterC, enterR + 1, who)) goal = cur + 1.5; else if (off < -0.05 && !this.blocked(enterC, enterR - 1, who)) goal = cur - 0.5; }
        else { if (off > 0.05 && !this.blocked(enterC + 1, enterR, who)) goal = cur + 1.5; else if (off < -0.05 && !this.blocked(enterC - 1, enterR, who)) goal = cur - 0.5; }
        if (goal != null) {
          const v = axis === 'x' ? e.y : e.x, d = goal - v, mv = Math.sign(d) * Math.min(Math.abs(d), step);
          const tx = axis === 'x' ? e.x : e.x + mv, ty = axis === 'x' ? e.y + mv : e.y;
          if (!this.collides(tx, ty, rad, who)) { e.x = tx; e.y = ty; }
        }
        // on se colle au mur
        const nx2 = axis === 'x' ? e.x + m : e.x, ny2 = axis === 'y' ? e.y + m : e.y;
        if (!this.collides(nx2, ny2, rad, who)) { e.x = nx2; e.y = ny2; }
        else if (axis === 'x') { const edge = sign > 0 ? hit.c - rad - 0.001 : hit.c + 1 + rad + 0.001; if ((sign > 0 && edge > e.x) || (sign < 0 && edge < e.x)) if (!this.collides(edge, e.y, rad, who)) e.x = edge; }
        else { const edge = sign > 0 ? hit.r - rad - 0.001 : hit.r + 1 + rad + 0.001; if ((sign > 0 && edge > e.y) || (sign < 0 && edge < e.y)) if (!this.collides(e.x, edge, rad, who)) e.y = edge; }
      }
    }
    updateBombs(dt) {
      for (const b of this.bombs.slice()) {
        if (b.exploded) continue;
        b.t -= dt;
        if (b.state === 'idle') {
          if (b.passers) for (const p of Array.from(b.passers)) if (Math.hypot(p.x - b.x, p.y - b.y) > 0.5 + p.r + 0.05 || !p.alive) b.passers.delete(p);
        } else if (b.state === 'sliding') {
          const D = DIRS[b.dir], step = BK.KICK_SPEED * dt;
          const nx = b.x + D.dx * step, ny = b.y + D.dy * step;
          const nc = Math.floor(nx + D.dx * 0.5), nr = Math.floor(ny + D.dy * 0.5);
          const entering = nc !== b.cx || nr !== b.cy;
          if (entering && this.tryBombUnderElevator?.(b,nc,nr)) continue;
          if (entering && this.kickedBombImpact?.(b,nc,nr)) continue;
          const target = entering && this.bombAt(nc,nr);
          if (target && target !== b && !this.cell(nc,nr) && (!this.explore || this.canStep(b.cx,b.cy,nc,nr)) && this.fuseBombs(b,target)) continue;
          const occupied = this.blastDrawbridges?.some(q=>q.state!=='open'&&q.c===nc&&q.r===nr) || this.cell(nc, nr) || (this.explore && (!this.walkableTerrain(nc, nr) || !this.canStep(b.cx, b.cy, nc, nr))) || (this.bombAt(nc, nr) && this.bombAt(nc, nr) !== b) || this.players.some(p => p.alive && Math.floor(p.x) === nc && Math.floor(p.y) === nr) || this.enemies.some(e => !e.dead && Math.floor(e.x) === nc && Math.floor(e.y) === nr) || this.falling.some(f => f.c === nc && f.r === nr);
          if (entering && occupied) { b.state = 'idle'; b.x = b.cx + 0.5; b.y = b.cy + 0.5; b.passers = new Set(); }
          else { b.x = nx; b.y = ny; const c = Math.floor(b.x), r = Math.floor(b.y); if (c !== b.cx || r !== b.cy) { b.cx = c; b.cy = r; const it = this.itemAt(c, r); if (it && !(b.safeItems || b.owner && b.owner.safeitems)) this.items.splice(this.items.indexOf(it), 1); } }
        } else if (b.state === 'carried') {
          const p = b.carrier; b.x = p.x; b.y = p.y; b.z = 1.2;
          if (!p.alive) { b.state = 'idle'; b.cx = Math.floor(p.x); b.cy = Math.floor(p.y); b.x = b.cx + 0.5; b.y = b.cy + 0.5; b.z = 0; p.carrying = null; b.passers = new Set(); }
        } else if (b.state === 'flying') {
          b.flyT += dt; const u = Math.min(1, b.flyT / b.flyDur);
          b.x = b.from.x + (b.to.x - b.from.x) * u; b.y = b.from.y + (b.to.y - b.from.y) * u;
          b.z = b.from.z * (1 - u) + (b.to.z || 0) * u + Math.sin(u * Math.PI) * b.arc;
          if (u >= 1) { b.z = 0; this.landBomb(b); }
        }
        if (b.t <= 0 && !b.exploded) {
          if (b.state === 'carried') { const p = b.carrier; b.state = 'idle'; b.cx = Math.floor(p.x); b.cy = Math.floor(p.y); p.carrying = null; }
          if (b.state === 'flying') { b.cx = Math.floor(b.x); b.cy = Math.floor(b.y); b.state = 'idle'; }
          this.explodeBomb(b);
        }
      }
    }
    updateFlames(dt) {
      for (const f of this.flames) f.t += dt;
      const gone = this.flames.filter(f => f.t >= (f.duration||BK.FLAME_TIME));
      for (const f of gone) { this.flameAt.delete(this.idx(f.cx, f.cy)); this.flames.splice(this.flames.indexOf(f), 1); }
    }
    flameTouches(x, y, rad) {
      const c = Math.floor(x), r = Math.floor(y);
      if (this.flameAt.has(this.idx(c, r))) return this.flameAt.get(this.idx(c, r));
      if (rad > 0.4) for (let d = 0; d < 4; d++) { const D = DIRS[d], f = this.flameAt.get(this.idx(c + D.dx, r + D.dy)); if (f && Math.abs(D.dx ? x - (c + D.dx + 0.5) : y - (r + D.dy + 0.5)) < rad + 0.5) return f; }
      return null;
    }
    firebarPoints(bar) {
      if(this.deco[this.idx(bar.c,bar.r)]!=='firebar')return [];
      const props=this.props[bar.c+','+bar.r]||{},length=Math.max(2,Math.min(4,Number(props.length)||3)),angle=bar.angle+(props.orientation||0)*Math.PI/2,out=[];
      for(let arm=0;arm<(props.arms===2?2:1);arm++){const a=angle+arm*Math.PI;for(let d=.45;d<=length;d+=.4)out.push({x:bar.c+.5+Math.cos(a)*d,y:bar.r+.5+Math.sin(a)*d,z:this.hAt(bar.c,bar.r)});}
      return out;
    }
    checkHits() {
      for (const p of this.players) {
        if (!p.alive || p.air || p.falling) continue;
        if(!p.npc)for(const bar of this.firebars)if(this.firebarPoints(bar).some(q=>Math.abs(this.groundZ(p.x,p.y)+(p.zOff||0)-q.z)<.5&&Math.hypot(q.x-p.x,q.y-p.y)<p.r+.22)){this.hitPlayer(p,{kind:'firebar',dmg:10});break;}
        const f = this.flameTouches(p.x, p.y, 0);
        if (f && f.t < (f.duration||BK.FLAME_TIME) - 0.05) { if (this.hitPlayer(p, { kind: 'flame', owner: f.owner, bomb:f.bomb, dmg:10*(f.bomb && f.bomb.damage || 1) })) continue; }
        if (p.onBomb) continue;   // perché sur la bombe, les monstres ne nous atteignent pas (mais elle va sauter !)
        for (const e of this.enemies) {
          if (e.dead || e.z > 0.5 || e.state === 'hidden' || e.tame || e.def.peaceful || e.def.bestiary?.action==='bounce' || e.def.bestiary?.action==='wall' || e.preparingSwallow || e.toadAttack?.kind==='swallow' || e.swallowed || e.arenaBoss&&['sealed','transform'].includes(e.state)) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) < (e.def.hitR || e.r) + p.r * 0.8) { if (this.hitPlayer(p, { kind: 'enemy', enemy: e, dmg: e.def.dmg || 10 })) { if (e.def.poison) this.poisonPlayer(p, e); break; } }
        }
      }
      for (const e of this.enemies) {
        if (e.dead) continue;
        const f = this.flameTouches(e.x, e.y, e.r);
        if (f) this.hurtEnemy(e, f.bomb?.kicker || f.owner, f.bomb && f.bomb.damage || 1, !f.magic && f.bomb && f.bomb.blastSource === 'bomb' ? 'bomb' : 'other');
      }
    }
    // Pluie de blocs (mort subite) : spirale de l'extérieur vers l'intérieur.
    startRain(interval) {
      const order = []; let c0 = 1, r0 = 1, c1 = this.cols - 2, r1 = this.rows - 2;
      while (c0 <= c1 && r0 <= r1) {
        for (let c = c0; c <= c1; c++) order.push({ c, r: r0 }); for (let r = r0 + 1; r <= r1; r++) order.push({ c: c1, r });
        for (let c = c1 - 1; c >= c0; c--) order.push({ c, r: r1 }); for (let r = r1 - 1; r > r0; r--) order.push({ c: c0, r });
        c0++; r0++; c1--; r1--;
      }
      this.rain = { order: order.filter(p => this.cell(p.c, p.r) !== HARD), i: 0, t: 0, interval: interval || 0.22 };
    }
    updateRain(dt) {
      if (this.rain && this.rain.i < this.rain.order.length) {
        this.rain.t -= dt;
        if (this.rain.t <= 0) { const p = this.rain.order[this.rain.i++]; this.rain.t = this.rain.interval; this.falling.push({ c: p.c, r: p.r, z: 7 }); }
      }
      for (const f of this.falling.slice()) {
        f.z -= dt * 11;
        if (f.z <= 0) {
          this.falling.splice(this.falling.indexOf(f), 1); this.cells[this.idx(f.c, f.r)] = HARD; this.shake = Math.max(this.shake, 0.15);
          const b = this.bombAt(f.c, f.r); if (b) this.bombs.splice(this.bombs.indexOf(b), 1), b.owner && b.owner.bombsOut--;
          const it = this.itemAt(f.c, f.r); if (it) this.items.splice(this.items.indexOf(it), 1);
          for (const p of this.players) if (p.alive && Math.floor(p.x) === f.c && Math.floor(p.y) === f.r) { p.shield = 0; p.invuln = 0; this.killPlayer(p, { kind: 'block' }); }
          for (const e of this.enemies) if (!e.dead && Math.floor(e.x) === f.c && Math.floor(e.y) === f.r) { e.hurt = 0; this.hurtEnemy(e, null, 99); }
          this.burst(f.c + 0.5, f.r + 0.5, 0.5, this.theme.hard, 8, 1);
        }
      }
    }
    // ------------------------------------------------------------------ comportements des ennemis
    updateEnemy(e, dt) {
      e.t += dt; e.stateT += dt; if (e.hurt > 0) e.hurt -= dt;
      if (e.dead) { e.deadT += dt; return; }
      if (e.stunT > 0) { e.stunT = Math.max(0, e.stunT - dt); return; }   // étourdi par une bombe bottée : des étoiles, et il ne fait rien
      if(e.arenaBoss)return this.updateFirstBoss(e,dt);
      if(e.def.bestiary)return this.updateBestiary(e,dt);
      const bh = e.def.behavior;
      if (bh === 'peaceful') return this.updatePeaceful(e, dt);
      if (bh === 'toad') return this.updateToad(e, dt);
      if (bh === 'launcher') return this.updateLauncher(e, dt);
      if (bh === 'cannon') return this.updateCannon(e, dt);
      if (bh === 'sea') return this.updateSea(e, dt);
      if (bh === 'fire') return this.updateFire(e, dt);
      if (bh === 'ice') return this.updateIce(e, dt);
      if (bh === 'mage') return this.updateMage(e, dt);
      if (bh === 'rabbit') return this.updateRabbit(e, dt);
      if (bh === 'orc') return this.updateOrc(e, dt);
      if (bh === 'shaman') return this.updateShaman(e, dt);
      if (bh === 'mole') return this.updateMole(e, dt);
      if (bh === 'wasp') return this.updateWasp(e, dt);
      if (bh === 'plant') return this.updatePlant(e, dt);
      if (bh === 'hammer' && this.updateHammer(e, dt)) return;
      if (bh === 'skeleton' && this.updateSkeleton(e, dt)) return;
      if (bh === 'golem') return this.updateGolem(e, dt);
      // marcheurs de case en case
      if (bh === 'charger' && e.state === 'charge') {
        const D = DIRS[e.dir], step = (e.def.chargeSpeed || 5.5) * this.slowAt(e) * dt, nx = e.x + D.dx * step, ny = e.y + D.dy * step;
        const nc = Math.floor(nx + D.dx * 0.45), nr = Math.floor(ny + D.dy * 0.45);
        if (this.blocked(nc, nr, e)) { e.x = Math.floor(e.x) + 0.5; e.y = Math.floor(e.y) + 0.5; e.state = 'stun'; e.stateT = 0; e.target = null; this.shake = Math.max(this.shake, 0.15); }
        else { e.x = nx; e.y = ny; }
        return;
      }
      if (e.state === 'stun') { if (e.stateT > (e.def.stunT == null ? 1.2 : e.def.stunT)) { e.state = 'walk'; e.stateT = 0; } return; }
      if (bh === 'charger' && e.state === 'walk' && e.stateT > (e.def.readyT == null ? 0.8 : e.def.readyT)) {
        const p = this.nearestPlayer(e.x, e.y), range = e.def.range || 6;
        if (p) { const c = Math.floor(e.x), r = Math.floor(e.y), pc = Math.floor(p.x), pr = Math.floor(p.y); let d = -1;
          if (pr === r && Math.abs(pc - c) <= range) d = pc > c ? 3 : 1; else if (pc === c && Math.abs(pr - r) <= range) d = pr > r ? 0 : 2;
          if (d >= 0) { const D = DIRS[d]; let clear = true; for (let k = 1; k <= Math.abs(pc - c) + Math.abs(pr - r); k++) if (this.blocked(c + D.dx * k, r + D.dy * k, e)) { clear = false; break; }
            if (clear && Math.hypot(e.x - (c + 0.5), e.y - (r + 0.5)) < 0.1) { e.x = c + 0.5; e.y = r + 0.5; e.dir = d; e.state = 'charge'; e.stateT = 0; e.target = null; return; } }
        }
      }
      if (!e.target) {
        const c = Math.floor(e.x), r = Math.floor(e.y), dirs = this.freeDirs(c, r, e);
        if (!dirs.length) { e.target = null; return; }
        let d = e.dir;
        const p = this.nearestPlayer(e.x, e.y);
        const huntChance = bh === 'snake' ? 0.75 : bh === 'hunter' ? 0.6 : bh === 'hammer' || bh === 'skeleton' ? 0.5 : bh === 'ghost' ? 0.35 : bh === 'charger' ? 0.3 : 0.12;
        if (p && Math.random() < huntChance) {
          const dx = p.x - e.x, dy = p.y - e.y, pref = Math.abs(dx) > Math.abs(dy) ? [dx > 0 ? 3 : 1, dy > 0 ? 0 : 2] : [dy > 0 ? 0 : 2, dx > 0 ? 3 : 1];
          d = pref.find(x => dirs.includes(x)); if (d == null) d = pick(dirs);
        } else if (!dirs.includes(d) || (dirs.length > 2 && Math.random() < 0.3) || Math.random() < 0.05) d = pick(dirs);
        e.dir = d; const D = DIRS[d]; e.target = { x: c + D.dx + 0.5, y: r + D.dy + 0.5, c: c + D.dx, r: r + D.dy };
      }
      const tg = e.target, dx = tg.x - e.x, dy = tg.y - e.y, dist = Math.hypot(dx, dy), step = e.speed * this.slowAt(e) * dt;
      if (this.blocked(tg.c, tg.r, e) && dist > 0.35) { // une bombe vient de se poser devant : demi-tour
        const c = Math.floor(e.x), r = Math.floor(e.y); e.target = { x: c + 0.5, y: r + 0.5, c, r }; e.dir = (e.dir + 2) % 4; return;
      }
      if (dist <= step) { e.x = tg.x; e.y = tg.y; e.target = null; } else { e.x += dx / dist * step; e.y += dy / dist * step; }
    }
    // Squelette : marche comme un chasseur ; à portée, il lance son os en boomerang (il tourne, va jusqu'à N cases ou au
    // premier bloc, reste 1 s au bout, puis revient). Tant que l'os est dehors, le squelette ne bouge pas.
    updateSkeleton(e, dt) {
      e.cool = (e.cool == null ? 1.5 : e.cool) - dt;
      if (e.bone) { if (e.bone.dead) { e.bone = null; e.cool = 1.0; } else { e.flip = e.bone.x < e.x; e.throwT = (e.throwT || 0) + dt; return true; } }
      const p = this.nearestPlayer(e.x, e.y); if (!p) return false; const dist = Math.hypot(p.x - e.x, p.y - e.y);
      if (e.cool <= 0 && dist < e.def.range + 1.5 && dist > 0.6 && Math.hypot(e.x - Math.floor(e.x) - 0.5, e.y - Math.floor(e.y) - 0.5) < 0.15) {
        e.x = Math.floor(e.x) + 0.5; e.y = Math.floor(e.y) + 0.5; e.target = null; e.throwT = 0; e.flip = p.x < e.x;
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        e.bone = { kind: 'bone', x: e.x, y: e.y, a, speed: e.def.boneSpeed, turn: 0, life: 30, t: 0, owner: e, z: 0.55, r: 0.26, dead: false, deadT: 0, phase: 'out', dist: 0, range: e.def.range, hover: 0 };
        this.shots.push(e.bone); this.events.push({ type: 'boneThrown', enemy: e }); return true;
      }
      return false;
    }
    // Cogneur : marche comme un chasseur ; près du héros, il lève son marteau et frappe le sol : séisme sur les cases voisines.
    updateHammer(e, dt) {
      e.cool = (e.cool == null ? 2 : e.cool) - dt;
      if (e.state === 'wind') { e.wind = Math.min(1, e.stateT / 0.5); if (e.stateT >= 0.5) { this.slam(e); e.state = 'rest'; e.stateT = 0; e.wind = 0; } return true; }
      if (e.state === 'rest') { if (e.stateT > 0.9) { e.state = 'walk'; e.stateT = 0; } return true; }
      const p = this.nearestPlayer(e.x, e.y);
      if (p && e.cool <= 0 && Math.hypot(p.x - e.x, p.y - e.y) < 2.3 && Math.hypot(e.x - Math.floor(e.x) - 0.5, e.y - Math.floor(e.y) - 0.5) < 0.15) { e.x = Math.floor(e.x) + 0.5; e.y = Math.floor(e.y) + 0.5; e.target = null; e.state = 'wind'; e.stateT = 0; e.cool = 3.5; e.flip = p.x < e.x; return true; }
      return false;
    }
    slam(e) {
      const c = Math.floor(e.x), r = Math.floor(e.y); this.shake = Math.max(this.shake, 0.35); this.burst(e.x, e.y, 0.7, '#c9b37a', 14, 1); this.events.push({ type: 'stomp', enemy: e });
      this.quakes = this.quakes || [];
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) { const cc = c + dc, rr = r + dr; if (!this.inside(cc, rr)) continue; if (this.cell(cc, rr) === SOFT) this.destroyBlock(cc, rr, null); if (this.cell(cc, rr) === HARD) continue; this.quakes.push({ c: cc, r: rr, t: -(Math.abs(dc) + Math.abs(dr)) * 0.05, by: e }); }
    }
    updateQuakes(dt) {
      if (!this.quakes || !this.quakes.length) return;
      for (const q of this.quakes) { q.t += dt; if (q.t > 0 && q.t < 0.35) for (const p2 of this.players) if (p2.alive && !p2.air && !p2.onBomb && Math.floor(p2.x) === q.c && Math.floor(p2.y) === q.r) this.hitPlayer(p2, { kind: 'enemy', enemy: q.by || null }); }
      this.quakes = this.quakes.filter(q => q.t < 0.45);
    }
    // Cracheur de feu : immobile, crache une boule de feu qui rebondit en ligne droite vers le héros (axe dominant).
    updateFire(e, dt) {
      e.cool = (e.cool == null ? 1.5 : e.cool) - dt; e.recoil = Math.max(0, (e.recoil || 0) - dt * 2);
      const p = this.nearestPlayer(e.x, e.y); if (!p) return; const dx = p.x - e.x, dy = p.y - e.y; e.flip = dx < 0;
      if (e.cool <= 0 && Math.hypot(dx, dy) < 9) {
        e.cool = 2.6; e.recoil = 1; const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : (dy > 0 ? 0 : 2), D = DIRS[d];
        this.shots.push({ kind: 'fire', x: e.x + D.dx * 0.5, y: e.y + D.dy * 0.5, a: Math.atan2(D.dy, D.dx), speed: 3.4, turn: 0, life: 5, t: 0, owner: e, z: 0.3, r: 0.26, dead: false, deadT: 0 });
        this.events.push({ type: 'fireball', enemy: e });
      }
    }
    // Souffleur de glace : vise le héros et lance un éclat qui le gèle sur place (pas de dégâts, mais il ne bouge plus).
    updateIce(e, dt) {
      e.cool = (e.cool == null ? 1.8 : e.cool) - dt; e.recoil = Math.max(0, (e.recoil || 0) - dt * 2);
      const p = this.nearestPlayer(e.x, e.y); if (!p) return; const dist = Math.hypot(p.x - e.x, p.y - e.y), a = Math.atan2(p.y - e.y, p.x - e.x); e.aim = a; e.flip = p.x < e.x;
      if (e.cool <= 0 && dist < 8 && dist > 1 && !(p.frozen > 0)) {
        e.cool = 3.2; e.recoil = 1;
        this.shots.push({ kind: 'ice', x: e.x + Math.cos(a) * 0.5, y: e.y + Math.sin(a) * 0.5, a, speed: 4, turn: 0, life: 2.5, t: 0, owner: e, z: 0.45, r: 0.24, dead: false, deadT: 0 });
        this.events.push({ type: 'iceShot', enemy: e });
      }
    }
    // Magicien : se téléporte de temps en temps ; sa magie (formes qui tournent) avance 6-7 cases, s'arrête, revient vers
    // le héros, trois passes en tout, puis disparaît si elle n'a rien touché.
    updateMage(e, dt) {
      e.cool = (e.cool == null ? 1.2 : e.cool) - dt; e.tp = (e.tp == null ? 4 : e.tp) - dt; e.cast = Math.max(0, (e.cast || 0) - dt * 1.5);
      const p = this.nearestPlayer(e.x, e.y); if (!p) return; e.flip = p.x < e.x; const dist = Math.hypot(p.x - e.x, p.y - e.y);
      if (e.tp <= 0) {
        e.tp = 5 + Math.random() * 2; const c = Math.floor(e.x), r = Math.floor(e.y), cand = [];
        for (let dc = -4; dc <= 4; dc++) for (let dr = -4; dr <= 4; dr++) { const cc = c + dc, rr = r + dr; if ((!dc && !dr) || !this.inside(cc, rr) || this.cell(cc, rr) || !this.walkableTerrain(cc, rr) || this.bombAt(cc, rr) || this.solidEnemyAt(cc, rr) || Math.hypot(cc + 0.5 - p.x, rr + 0.5 - p.y) < 1.5) continue; cand.push({ cc, rr }); }
        if (cand.length) { this.burst(e.x, e.y, 0.5, '#d9a6ff', 14); const tg = cand[Math.floor(Math.random() * cand.length)]; e.x = tg.cc + 0.5; e.y = tg.rr + 0.5; this.burst(e.x, e.y, 0.5, '#d9a6ff', 14); this.events.push({ type: 'teleport', enemy: e }); }
      }
      if (e.cool <= 0 && dist < 10) {
        e.cool = 3.8; e.cast = 1; const a = Math.atan2(p.y - e.y, p.x - e.x);
        this.shots.push({ kind: 'magic', x: e.x, y: e.y, a, speed: 3.2, turn: 0, life: 20, t: 0, owner: e, z: 0.6, r: 0.3, dead: false, deadT: 0, dist: 0, range: 6.5, passes: 3, pause: 0 });
        this.events.push({ type: 'magicCast', enemy: e });
      }
    }
    // Ligne de vue : rien de solide, pas d'eau et pas de falaise entre le monstre et le héros, à moins de « range » cases.
    canSee(e, p, range) {
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy); if (d > range) return false; const h0 = this.hAt(Math.floor(e.x), Math.floor(e.y)), n = Math.ceil(d / 0.4);
      for (let i = 1; i < n; i++) { const c = Math.floor(e.x + dx * i / n), r = Math.floor(e.y + dy * i / n); if (!this.inside(c, r) || this.cell(c, r) || !this.walkableTerrain(c, r) || Math.abs(this.hAt(c, r) - h0) > 0.01) return false; }
      return true;
    }
    // Déplacement libre (pas case par case) vers un point : on glisse le long des blocs ; vrai si on a avancé.
    moveFree(e, tx, ty, speed, dt) {
      const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy); if (d < 1e-4) return true; const step = Math.min(d, speed * this.slowAt(e) * dt), ux = dx / d, uy = dy / d, h0 = this.hAt(Math.floor(e.x), Math.floor(e.y));
      const free = (x, y) => { const c = Math.floor(x), r = Math.floor(y); return this.inside(c, r) && !this.cell(c, r) && this.walkableTerrain(c, r) && !this.bombAt(c, r) && Math.abs(this.hAt(c, r) - h0) < 0.01 && (this.solidEnemyAt(c, r) || e) === e; };
      const probe = (x, y, px, py) => free(x, y) && free(x + px * e.r * 0.8, y + py * e.r * 0.8) && free(x + px * e.r * 0.8, y) && free(x, y + py * e.r * 0.8);
      const nx = e.x + ux * step, ny = e.y + uy * step, sx = Math.sign(ux), sy = Math.sign(uy);
      if (probe(nx, ny, sx, sy)) { e.x = nx; e.y = ny; if (ux) e.flip = ux < 0; return true; }
      if (ux && probe(e.x + ux * step, e.y, sx, 0)) { e.x += ux * step; e.flip = ux < 0; return true; }
      if (uy && probe(e.x, e.y + uy * step, 0, sy)) { e.y += uy * step; return true; }
      return false;
    }
    // Un animal apprivoisé protège son ami pendant qu’il le suit.
    updateAnimalFriend(e,dt) {
      const p=e.follow;
      if(!p?.alive||p.falling||e.followT<=0||e.bond?.owner!==p.id||e.bond.pets<2||e.bond.meals<1||Math.hypot(e.x-p.x,e.y-p.y)>6)return false;
      const foe=this.enemies.filter(q=>q!==e&&!q.dead&&!q.def.peaceful&&!q.tame&&q.state!=='hidden'&&q.state!=='sealed'&&q.state!=='transform'&&Math.abs(this.groundZ(q.x,q.y)-this.groundZ(e.x,e.y))<.2&&this.canSee(p,q,4)&&this.canSee(e,q,5)).sort((a,b)=>(a.swallowed===p?-10:Math.hypot(a.x-e.x,a.y-e.y))-(b.swallowed===p?-10:Math.hypot(b.x-e.x,b.y-e.y)))[0];
      if(!foe)return false;
      e.target=null;e.pause=0;
      if(Math.hypot(foe.x-e.x,foe.y-e.y)<.85){
        e.state='rest';if(!e.friendAttackT){e.friendAttackT=1.2;e.heartT=.3;this.hurtEnemy(foe,p,1,'pet');this.burst(foe.x,foe.y,.35,'#ffe4a0',5);if(foe.swallowed===p){p.swallowT=Math.max(0,p.swallowT-.8);if(!p.swallowT)this.releaseSwallowed(p);}}
        return true;
      }
      // Cherche le premier pas d’un chemin court sans traverser murs, bombes ou flammes.
      const start={c:Math.floor(e.x),r:Math.floor(e.y)},queue=[start],seen=new Set([start.c+','+start.r]);let next=null;
      for(let i=0;i<queue.length&&i<100;i++){
        const node=queue[i];if(Math.hypot(node.c+.5-foe.x,node.r+.5-foe.y)<.85){next=node.first;break;}
        for(const d of this.freeDirs(node.c,node.r,e)){const D=DIRS[d],c=node.c+D.dx,r=node.r+D.dy,key=c+','+r;
          if(seen.has(key)||this.flameAt.has(this.idx(c,r))||this.bombAt(c,r)||Math.hypot(c+.5-p.x,r+.5-p.y)>5||Math.abs(this.groundZ(c+.5,r+.5)-this.groundZ(e.x,e.y))>.2)continue;
          seen.add(key);queue.push({c,r,first:node.first||{c,r}});
        }
      }
      if(next){e.state='walk';this.moveFree(e,next.c+.5,next.r+.5,Math.max(e.speed,p.speed*.95),dt);}else e.state='rest';
      return true;
    }
    // Faune paisible : petites promenades près du point de placement, avec des pauses.
    updatePeaceful(e, dt) {
      e.fedT=Math.max(0,(e.fedT||0)-dt);
      e.z = 0; e.heartT = Math.max(0,(e.heartT||0)-dt); e.petT = Math.max(0,(e.petT||0)-dt);
      if (e.type === 'escargot') {
        if(e.carrier) {
          const p=e.carrier;
          if(p.alive && !p.falling && this.players.includes(p)) { e.shell=1; e.state='rest'; return; }
          p.heldSnail=null; e.carrier=null; e.target=null;
        }
        const nearby = this.players.some(p => p.alive && !p.falling && this.canSee(e,p,e.shellAlarm ? 2.4 : 1.8));
        e.shellAlarm = nearby;
        if (nearby) e.shellWait = 0.7;
        else e.shellWait = Math.max(0,(e.shellWait || 0)-dt);
        const hiding = nearby || e.shellWait > 0;
        e.shell = Math.max(0,Math.min(1,(e.shell || 0) + (hiding ? 5 : -0.65)*dt));
        if (hiding || e.shell > 0) { e.state = 'rest'; return; }
      }
      const pet = !!BK.PET_FOODS[e.type], p = pet ? this.nearestPlayer(e.x,e.y) : null;
      if (e.followReady == null) e.followReady = true;
      if (p && !e.follow && Math.hypot(p.x-e.x,p.y-e.y)>3.5) e.followReady=true;
      if (p && e.followReady && !e.follow && this.canSee(e,p,2.3)) { e.follow=p; e.followT=8; e.followReady=false; e.pause=0; e.target=null; }
      if (e.follow) { e.followT-=dt; if(e.followT<=0 || !e.follow.alive || e.follow.falling || Math.hypot(e.follow.x-e.x,e.follow.y-e.y)>(e.fedT>0?12:6)) { e.follow=null; e.target=null; } }
      e.friendAttackT=Math.max(0,(e.friendAttackT||0)-dt);
      if(e.petT<=0&&this.updateAnimalFriend(e,dt))return;
      if (e.pause > 0) { e.pause -= dt; e.state = 'rest'; return; }
      if (!e.target) {
        const c = Math.floor(e.x), r = Math.floor(e.y);
        const dirs = this.freeDirs(c, r, e).filter(d => { const D = DIRS[d]; const radius=Math.hypot(c-e.home.c,r-e.home.r); return (e.follow&&e.fedT>0||Math.hypot(c + D.dx - e.home.c, r + D.dy - e.home.r) <= (e.follow?6:3) || Math.hypot(c + D.dx - e.home.c, r + D.dy - e.home.r)<radius) && !this.flameAt.has(this.idx(c + D.dx, r + D.dy)); });
        if (!dirs.length) { e.pause = 0.8; e.state = 'rest'; return; }
        if(e.follow && Math.hypot(e.x-e.follow.x,e.y-e.follow.y)<1.1) { e.state='rest'; return; }
        const goal=e.follow || (Math.hypot(e.x-e.home.c-0.5,e.y-e.home.r-0.5)>3 ? {x:e.home.c+0.5,y:e.home.r+0.5}:null);
        e.dir = goal ? dirs.sort((a,b)=>Math.hypot(c+DIRS[a].dx+0.5-goal.x,r+DIRS[a].dy+0.5-goal.y)-Math.hypot(c+DIRS[b].dx+0.5-goal.x,r+DIRS[b].dy+0.5-goal.y))[0] : pick(dirs); const D = DIRS[e.dir]; if (D.dx) e.flip = D.dx < 0;
        e.target = { c: c + D.dx, r: r + D.dy, x: c + D.dx + 0.5, y: r + D.dy + 0.5 };
      }
      const tg = e.target;
      if (this.blocked(tg.c, tg.r, e)) { e.target = null; e.pause = 0.5; e.state = 'rest'; return; }
      const dx = tg.x - e.x, dy = tg.y - e.y, dist = Math.hypot(dx, dy), step = (e.follow&&e.fedT>0?Math.max(e.speed,e.follow.speed*.95):e.speed) * dt;
      e.state = 'walk';
      if (e.type === 'lapin_gentil') e.z = Math.sin(Math.min(1,Math.max(0,1-dist))*Math.PI)*0.12;
      if (e.type === 'oiseau') e.z = Math.sin(Math.min(1, Math.max(0, 1 - dist)) * Math.PI) * 0.45;
      if (dist <= step) { e.x = tg.x; e.y = tg.y; e.target = null; e.z = 0; e.pause = e.follow ? 0.12 : (e.type === 'chat' ? 1.4 : 0.5) + Math.random() * 1.8; e.state = 'rest'; }
      else { e.x += dx / dist * step; e.y += dy / dist * step; }
    }
    // Marche en bonds de case en case (lapin) : petit saut à chaque case, pause entre deux bonds.
    hopWander(e, dt, mult) {
      if (!e.target) { const c = Math.floor(e.x), r = Math.floor(e.y), dirs = this.freeDirs(c, r, e); if (!dirs.length) { e.z = 0; return; } let d = e.dir; if (!dirs.includes(d) || Math.random() < 0.3) d = pick(dirs); e.dir = d; const D = DIRS[d]; e.target = { x: c + D.dx + 0.5, y: r + D.dy + 0.5, c: c + D.dx, r: r + D.dy }; e.pause = e.tame ? 0.45 : 0.18; if (D.dx) e.flip = D.dx < 0; }
      if (e.pause > 0) { e.pause -= dt; e.z = 0; return; }
      const tg = e.target, dx = tg.x - e.x, dy = tg.y - e.y, dist = Math.hypot(dx, dy), step = e.speed * mult * this.slowAt(e) * dt;
      if (this.blocked(tg.c, tg.r, e) && dist > 0.35) { e.target = null; return; }
      e.z = Math.sin(Math.min(1, Math.max(0, 1 - dist)) * Math.PI) * 0.18;
      if (dist <= step) { e.x = tg.x; e.y = tg.y; e.target = null; e.z = 0; } else { e.x += dx / dist * step; e.y += dy / dist * step; }
    }
    // Lapin maléfique : bondit de case en case ; dès qu'il voit le héros (7 cases), il fonce super vite en ligne droite,
    // puis reste essoufflé 7,5 s avant de pouvoir recommencer. Une carotte au sol : il court la manger et devient gentil.
    updateRabbit(e, dt) {
      const p = this.nearestPlayer(e.x, e.y);
      if (e.tame) { if (Math.random() < 0.5 * dt) this.particles.push({ x: e.x, y: e.y, z: (this.explore ? this.groundZ(e.x, e.y) : 0) + 0.8, gz: 0, vx: (Math.random() - 0.5) * 0.2, vy: 0, vz: 0.5, life: 1.2, t: 0, color: '#ff8fab', size: 0.14, heart: true, float: true }); return this.hopWander(e, dt, 0.6); }
      if (e.state === 'eat') { e.z = 0; if (e.stateT > 1.8) { e.tame = true; e.state = 'hop'; e.stateT = 0; e.target = null; this.burst(e.x, e.y, 0.5, '#ff8fab', 12); this.events.push({ type: 'rabbitTamed', enemy: e }); } return; }
      let best = null, bd = 7; for (const it of this.items) { if (it.type !== 'carrot') continue; const d = Math.hypot(it.cx + 0.5 - e.x, it.cy + 0.5 - e.y); if (d < bd) { bd = d; best = it; } }
      if (best) {   // une carotte ! il court dessus
        if (e.state !== 'carrot') { e.state = 'carrot'; e.stateT = 0; e.target = null; this.events.push({ type: 'rabbitSawCarrot', enemy: e }); }
        e.z = Math.abs(Math.sin(e.t * 14)) * 0.15; this.moveFree(e, best.cx + 0.5, best.cy + 0.5, e.speed * 2.2, dt);
        if (bd < 0.35) { this.items.splice(this.items.indexOf(best), 1); e.x = best.cx + 0.5; e.y = best.cy + 0.5; e.state = 'eat'; e.stateT = 0; e.z = 0; this.events.push({ type: 'rabbitEats', enemy: e }); }
        return;
      }
      if (e.state === 'carrot') { e.state = 'hop'; e.stateT = 0; }
      if (e.state === 'tired') { e.z = 0; if (e.stateT > 7.5) { e.state = 'hop'; e.stateT = 0; } return; }
      if (e.state === 'charge') {
        const sp = 7.5, moved = this.moveFree(e, e.x + Math.cos(e.ca) * 2, e.y + Math.sin(e.ca) * 2, sp, dt); e.run = (e.run || 0) + sp * dt; e.z = Math.abs(Math.sin(e.t * 22)) * 0.1;
        if (!moved || e.run > 7 || (p && Math.hypot(p.x - e.x, p.y - e.y) < 0.5)) { e.state = 'tired'; e.stateT = 0; e.z = 0; e.run = 0; this.burst(e.x, e.y, 0.3, 'rgba(230,230,230,0.8)', 6, 1); this.events.push({ type: 'rabbitTired', enemy: e }); }
        return;
      }
      if (p && e.stateT > 0.6 && this.canSee(e, p, 7)) { e.state = 'charge'; e.stateT = 0; e.run = 0; e.ca = Math.atan2(p.y - e.y, p.x - e.x); e.flip = p.x < e.x; e.target = null; e.z = 0; this.events.push({ type: 'rabbitCharge', enemy: e }); return; }
      this.hopWander(e, dt, 1);
    }
    // Orque : garde son shaman (à 2 cases au plus). S'il voit le héros à 6 cases, il grogne et fonce en frappant de
    // l'épée ; dès qu'il s'éloigne de 4 à 6 cases de son shaman, il grogne et revient se placer à côté. Sans shaman,
    // il garde son poste de la même façon.
    updateOrc(e, dt) {
      e.swing = Math.max(0, (e.swing || 0) - dt * 3);
      if (e.shaman === undefined || (e.shaman && e.shaman.dead)) { e.shaman = null; let bd = 9; for (const o of this.enemies) if (!o.dead && o.type === 'shaman') { const d = Math.hypot(o.x - e.x, o.y - e.y); if (d < bd) { bd = d; e.shaman = o; } } }
      const p = this.nearestPlayer(e.x, e.y), S = e.shaman, home = S || e.home || (e.home = { x: e.x, y: e.y });
      const dH = Math.hypot(home.x - e.x, home.y - e.y), dP = p ? Math.hypot(p.x - e.x, p.y - e.y) : 1e9;
      if (e.state === 'walk') { e.state = 'guard'; e.stateT = 0; }
      if (e.state === 'return') { if (dH < 2) { e.state = 'guard'; e.stateT = 0; } else this.moveFree(e, home.x, home.y, e.speed * 1.2, dt); return; }
      if (e.state === 'chase') {
        if (dH > e.leash) { e.state = 'return'; e.stateT = 0; this.events.push({ type: 'growl', enemy: e, back: true }); return; }
        if (!p || dP > 9) { e.state = 'return'; e.stateT = 0; return; }
        this.moveFree(e, p.x, p.y, e.speed * 1.5, dt); e.flip = p.x < e.x;
        e.swingT = (e.swingT || 0) - dt; if (dP < 1.4 && e.swingT <= 0) { e.swingT = 0.55; e.swing = 1; this.events.push({ type: 'swing', enemy: e }); }   // coups d'épée sans arrêt
        return;
      }
      if (p && e.stateT > 0.5 && dP < 6 && this.canSee(e, p, 6)) { e.state = 'chase'; e.stateT = 0; e.leash = 4 + Math.random() * 2; this.events.push({ type: 'growl', enemy: e }); return; }
      if (dH > 2) { this.moveFree(e, home.x, home.y, e.speed, dt); return; }
      e.wanderT = (e.wanderT || 0) - dt; if (e.wanderT <= 0) { e.wanderT = 1 + Math.random(); const a = Math.random() * Math.PI * 2; e.wx = home.x + Math.cos(a) * 1.6; e.wy = home.y + Math.sin(a) * 1.6; }
      if (Math.hypot(e.wx - e.x, e.wy - e.y) > 0.2) this.moveFree(e, e.wx, e.wy, e.speed * 0.5, dt);
    }
    // Shaman orque : immobile, se téléporte de temps en temps (pas loin, pour garder ses orques), lance une magie plus
    // rapide et plus forte que celle du magicien (8 cases, 4 passes, 15 points), et soigne un orque blessé à 6 cases.
    updateShaman(e, dt) {
      e.cool = (e.cool == null ? 1.5 : e.cool) - dt; e.tp = (e.tp == null ? 7 : e.tp) - dt; e.cast = Math.max(0, (e.cast || 0) - dt * 1.5); e.healCool = (e.healCool == null ? 2.5 : e.healCool) - dt; e.heal = Math.max(0, (e.heal || 0) - dt * 1.5);
      if (e.healCool <= 0) { const orc = this.enemies.find(o => !o.dead && o.type === 'orque' && o.hp < o.maxHp && Math.hypot(o.x - e.x, o.y - e.y) < 6); if (orc) { e.healCool = 4; e.heal = 1; orc.hp = Math.min(orc.maxHp, orc.hp + 1); this.burst(orc.x, orc.y, 0.45, '#8fff8f', 12); this.addFloater(orc.x, orc.y, '+1 ❤', { color: '#8fff8f', size: 0.3, life: 1.2, follow: orc }); this.events.push({ type: 'shamanHeal', enemy: e, orc }); } }
      const p = this.nearestPlayer(e.x, e.y); if (!p) return; e.flip = p.x < e.x; const dist = Math.hypot(p.x - e.x, p.y - e.y);
      if (e.tp <= 0) {
        e.tp = 7 + Math.random() * 3; const c = Math.floor(e.x), r = Math.floor(e.y), cand = [];
        for (let dc = -3; dc <= 3; dc++) for (let dr = -3; dr <= 3; dr++) { const cc = c + dc, rr = r + dr; if ((!dc && !dr) || !this.inside(cc, rr) || this.cell(cc, rr) || !this.walkableTerrain(cc, rr) || this.bombAt(cc, rr) || this.solidEnemyAt(cc, rr) || Math.hypot(cc + 0.5 - p.x, rr + 0.5 - p.y) < 1.5) continue; cand.push({ cc, rr }); }
        if (cand.length) { this.burst(e.x, e.y, 0.5, '#8fff8f', 14); const tg = cand[Math.floor(Math.random() * cand.length)]; e.x = tg.cc + 0.5; e.y = tg.rr + 0.5; this.burst(e.x, e.y, 0.5, '#8fff8f', 14); this.events.push({ type: 'teleport', enemy: e }); }
      }
      if (e.cool <= 0 && dist < 11) {
        e.cool = 3.0; e.cast = 1; const a = Math.atan2(p.y - e.y, p.x - e.x);
        this.shots.push({ kind: 'magic', dark: true, x: e.x, y: e.y, a, speed: 4.2, turn: 0, life: 20, t: 0, owner: e, z: 0.6, r: 0.32, dead: false, deadT: 0, dist: 0, range: 8, passes: 4, pause: 0, dmg: 15 });
        this.events.push({ type: 'magicCast', enemy: e });
      }
    }
    // Taupe : avance sous terre vers le héros (une bosse de terre qui bouge), surgit près de lui, puis replonge.
    updateMole(e, dt) {
      if (e.state === 'walk') { e.state = 'hidden'; e.stateT = 0; }
      const p = this.nearestPlayer(e.x, e.y); if (!p) return;
      if (e.state === 'hidden') {
        const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; e.flip = dx < 0;
        const steps=Math.max(1,Math.ceil(e.speed*dt/.1));
        for(let i=0;i<steps;i++)this.moveFree(e,p.x,p.y,e.speed,dt/steps);
        if (Math.random() < 5 * dt) this.burst(e.x, e.y, 0.15, '#7d5428', 2, 1);
        if ((d < 1.1 && e.stateT > 1) || e.stateT > 5) { const cc = Math.floor(e.x), rr = Math.floor(e.y); if(this.cell(cc,rr))return; e.state = 'up'; e.stateT = 0; e.cool = 0.5; this.burst(e.x, e.y, 0.4, '#7d5428', 10, 1); this.events.push({ type: 'moleUp', enemy: e }); }
      } else if (e.state === 'up') {
        // sortie 3,5 s : elle lance des mottes de terre en cloche vers le héros (une toutes les 2,1 s, 1,5 × plus vite que la glace)
        e.cool -= dt; e.recoil = Math.max(0, (e.recoil || 0) - dt * 2); const dist = Math.hypot(p.x - e.x, p.y - e.y); e.flip = p.x < e.x;
        if (e.cool <= 0 && dist < 8 && dist > 0.8 && this.canSee(e,p,8)) { e.cool = 2.1; e.recoil = 1; const a = Math.atan2(p.y - e.y, p.x - e.x), speed = 4.5; this.shots.push({ kind: 'dirt', x: e.x, y: e.y, a, speed, turn: 0, life: dist / speed, dur: dist / speed, t: 0, owner: e, z: 0.3, r: 0.25, dead: false, deadT: 0 }); this.events.push({ type: 'dirtThrown', enemy: e }); }
        if (e.stateT > 3.5) { e.state = 'hidden'; e.stateT = 0; this.burst(e.x, e.y, 0.3, '#7d5428', 6, 1); }
      }
    }
    // Guêpe : vole (hors de portée des flammes), passe par-dessus l'eau et les blocs, pique en plongeant près du héros.
    updateWasp(e, dt) {
      let p = this.nearestPlayer(e.x, e.y);
      if (e.hive) {   // abeille sortie d'une ruche : vit 10 s, attaque le plus proche, héros ou monstre
        e.life = (e.life == null ? 10 : e.life) - dt; if (e.life <= 0) { e.dead = true; e.deadT = 0; this.burst(e.x, e.y, 0.2, '#ffd54a', 4); return; }
        let best = p, bd = p ? Math.hypot(p.x - e.x, p.y - e.y) : 1e9;
        for (const o of this.enemies) { if (o === e || o.dead || o.type === 'abeille' || o.state === 'hidden') continue; const d = Math.hypot(o.x - e.x, o.y - e.y); if (d < bd) { bd = d; best = o; } }
        p = best;
        if (e.state === 'low' && e.stateT < 0.1 && p && p.def && p.def.behavior && !e.stung) { if (Math.hypot(p.x - e.x, p.y - e.y) < (p.def.hitR || p.r) + 0.3) { e.stung = true; p.hurt = 0; this.hurtEnemy(p, null, 1); this.burst(p.x, p.y, 0.3, '#ffd54a', 6); } }
        if (e.state === 'walk') e.stung = false;
      }
      // Les insectes placés restent en vol sur place tant qu’aucun joueur n’approche.
      if(!e.hive&&(!p||Math.hypot(p.x-e.x,p.y-e.y)>3)) {
        e.state='walk';e.stateT=0;e.from=e.to=null;e.cool=2;e.z=.9+Math.sin(e.t*6)*.08;return;
      }
      if (!p) return; e.cool = (e.cool == null ? 2 : e.cool) - dt;
      if (e.state === 'walk') {
        e.z = 0.9 + Math.sin(e.t * 6) * 0.08; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; e.flip = dx < 0; const side = Math.sin(e.t * 3) * 0.8;
        const sl = this.slowAt(e); e.x = Math.max(0.3, Math.min(this.cols - 0.3, e.x + (dx / d * e.speed - dy / d * side) * sl * dt)); e.y = Math.max(0.3, Math.min(this.rows - 0.3, e.y + (dy / d * e.speed + dx / d * side) * sl * dt));
        if (d < 2.6 && e.cool <= 0) { e.state = 'dive'; e.stateT = 0; e.from = { x: e.x, y: e.y }; e.to = { x: p.x, y: p.y }; e.cool = 3.5; this.events.push({ type: 'dive', enemy: e }); }
      } else if (e.state === 'dive') { const u = Math.min(1, e.stateT / 0.35); e.x = e.from.x + (e.to.x - e.from.x) * u; e.y = e.from.y + (e.to.y - e.from.y) * u; e.z = 0.9 * (1 - u); if (u >= 1) { e.state = 'low'; e.stateT = 0; } }
      else if (e.state === 'low') { e.z = 0; if (e.stateT > 0.7) { e.state = 'rise'; e.stateT = 0; } }
      else if (e.state === 'rise') { e.z = Math.min(0.9, e.stateT / 0.4 * 0.9); if (e.stateT > 0.4) { e.state = 'walk'; e.stateT = 0; } }
    }
    // Plante carnivore : cachée dans le sol, elle sort régulièrement claquer des dents (sauf si le héros est juste dessus).
    updatePlant(e, dt) {
      if (e.state === 'walk') { e.state = 'hidden'; e.stateT = 0; }
      if (e.state === 'hidden') { e.up = 0; if (e.stateT > 2.0) { const p = this.nearestPlayer(e.x, e.y); if (p && Math.hypot(p.x - e.x, p.y - e.y) < 0.9) { e.stateT = 1.5; return; } e.state = 'rising'; e.stateT = 0; } }
      else if (e.state === 'rising') { e.up = Math.min(1, e.stateT / 0.4); if (e.stateT > 0.4) { e.state = 'up'; e.stateT = 0; } }
      else if (e.state === 'up') { e.up = 1; if (e.stateT > 1.8) { e.state = 'sinking'; e.stateT = 0; } }
      else if (e.state === 'sinking') { e.up = 1 - Math.min(1, e.stateT / 0.4); if (e.stateT > 0.4) { e.state = 'hidden'; e.stateT = 0; } }
    }
    // Bloc lance-fusées : immobile et solide ; toutes les 3,5 s il tire une fusée qui suit le joueur (au plus deux à la fois).
    updateLauncher(e, dt) {
      e.cool = (e.cool == null ? 1.6 : e.cool) - dt; e.recoil = Math.max(0, (e.recoil || 0) - dt * 2);
      const p = this.nearestPlayer(e.x, e.y); if (!p) return;
      const dist = Math.hypot(p.x - e.x, p.y - e.y); e.aim = Math.atan2(p.y - e.y, p.x - e.x);
      const mine = this.shots.filter(s => s.owner === e && !s.dead).length;
      if (e.cool <= 0 && dist < 10 && dist > 1.2 && mine < 2) {
        e.cool = 3.5; e.recoil = 1; const a = e.aim;
        this.shots.push({ kind: 'missile', x: e.x + Math.cos(a) * 0.55, y: e.y + Math.sin(a) * 0.55, a, speed: 2.3, turn: 2.4, life: 8, t: 0, owner: e, z: 0.45, r: 0.28, dead: false, deadT: 0 });
        this.burst(e.x + Math.cos(a) * 0.5, e.y + Math.sin(a) * 0.5, 0.3, 'rgba(140,140,140,0.7)', 6); this.events.push({ type: 'rocket', enemy: e });
      }
    }
    // Canon : vise le héros et tire un boulet en ligne droite de temps à autre ; le boulet s'arrête au premier bloc.
    // Canon : vise le héros ; avant chaque tir il se gonfle 0,6 s (indice visuel), puis le boulet part en ligne droite.
    // Trois modèles : noir (2 coups), rouge (4 coups, boulets de feu), bleu (4 coups, tire 2 × plus souvent, boulets 2 × plus lents).
    updateCannon(e, dt) {
      const def = e.def; e.cool = (e.cool == null ? 1.2 + Math.random() : e.cool) - dt; e.recoil = Math.max(0, (e.recoil || 0) - dt * 2.5);
      const p = this.nearestPlayer(e.x, e.y); if (!p) return;
      const dist = Math.hypot(p.x - e.x, p.y - e.y), want = Math.atan2(p.y - e.y, p.x - e.x);
      if (e.aim == null) e.aim = want; let d = want - e.aim; d = Math.atan2(Math.sin(d), Math.cos(d)); e.aim += Math.max(-3 * dt, Math.min(3 * dt, d)) * (e.puff > 0 ? 0.3 : 1);
      if (e.puff > 0) {   // il se gonfle… puis tire
        e.puff -= dt; e.swell = 1 - Math.max(0, e.puff) / 0.6;
        if (e.puff <= 0) {
          e.puff = 0; e.swell = 0; e.recoil = 1; const a = e.aim;
          this.shots.push({ kind: 'ball', color: def.ball || 'black', x: e.x + Math.cos(a) * 0.6, y: e.y + Math.sin(a) * 0.6, a, speed: def.ballSpeed || 5, turn: 0, life: 12 / (def.ballSpeed || 5), t: 0, owner: e, z: 0.4, r: 0.26, dead: false, deadT: 0 });
          this.burst(e.x + Math.cos(a) * 0.7, e.y + Math.sin(a) * 0.7, 0.3, def.ball === 'fire' ? 'rgba(255,120,40,0.9)' : def.ball === 'blue' ? 'rgba(120,180,255,0.9)' : 'rgba(255,200,120,0.9)', 8); this.shake = Math.max(this.shake, 0.1); this.events.push({ type: 'cannon', enemy: e });
        }
        return;
      }
      e.swell = 0;
      if (e.cool <= 0 && dist < 9 && dist > 1 && Math.abs(d) < 0.2) { e.puff = 0.6; e.cool = (def.cool || 2.4) + Math.random() * 0.4 + 0.6; this.events.push({ type: 'cannonCharge', enemy: e }); }
    }
    // Monstre marin : immobile (dans l'eau ou sur terre), tourne la tête vers le héros, ouvre la gueule et y fait grossir
    // une boule de poison (0,9 s), puis la crache en ligne droite ; la gueule se referme ensuite.
    updateSea(e, dt) {
      e.cool = (e.cool == null ? 1.5 + Math.random() : e.cool) - dt;
      const p = this.nearestPlayer(e.x, e.y); if (!p) return;
      const dist = Math.hypot(p.x - e.x, p.y - e.y), want = Math.atan2(p.y - e.y, p.x - e.x);
      if (e.aim == null) e.aim = want; let d = want - e.aim; d = Math.atan2(Math.sin(d), Math.cos(d)); e.aim += Math.max(-2.5 * dt, Math.min(2.5 * dt, d));
      if (e.state === 'walk') e.state = 'idle';
      if (e.state === 'idle') { e.mouth = Math.max(0, (e.mouth || 0) - dt * 3); e.charge = 0; if (e.cool <= 0 && dist < 9 && dist > 1 && Math.abs(d) < 0.3) { e.state = 'charge'; e.stateT = 0; } }
      else if (e.state === 'charge') {   // la gueule s'ouvre et la boule grossit dedans
        const u = Math.min(1, e.stateT / 0.9); e.mouth = Math.min(1, u * 2.5); e.charge = u;
        if (Math.random() < 10 * dt) { const m = this.mouthPos(e); this.particles.push({ x: m.x, y: m.y, z: m.z, gz: 0, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, vz: 0.6, life: 0.3, t: 0, color: 'rgba(120,255,80,0.8)', size: 0.06 }); }
        if (e.stateT >= 0.9) {
          const a = e.aim, m = this.mouthPos(e);
          this.shots.push({ kind: 'poison', x: m.x, y: m.y, a, speed: 3.4, turn: 0, life: 4, t: 0, owner: e, z: m.z, r: 0.26, dead: false, deadT: 0 });
          this.burst(m.x, m.y, 0.3, 'rgba(120,255,80,0.9)', 8); this.events.push({ type: 'poisonSpit', enemy: e });
          e.state = 'spit'; e.stateT = 0; e.charge = 0; e.cool = 2.6 + Math.random() * 0.8;
        }
      } else if (e.state === 'spit') { e.mouth = Math.max(0, 1 - e.stateT / 0.35); if (e.stateT > 0.35) { e.state = 'idle'; e.stateT = 0; } }
    }
    mouthPos(e) { const a = e.aim == null ? 0 : e.aim; return { x: e.x + Math.cos(a) * 0.6, y: e.y + Math.sin(a) * 0.6, z: 0.95 }; }
    // Projectiles : la fusée tourne vers le joueur et explose au contact (joueur, bloc, bombe) ; une flamme la détruit.
    // Le boulet file droit et s'arrête au premier bloc.
    updateShots(dt) {
      for (const s of this.shots) {
        if (s.dead) { s.deadT += dt; continue; }
        s.t += dt; s.life -= dt;
        if (s.kind === 'missile') { const p = this.nearestPlayer(s.x, s.y); if (p) { const want = Math.atan2(p.y - s.y, p.x - s.x); let d = want - s.a; d = Math.atan2(Math.sin(d), Math.cos(d)); s.a += Math.max(-s.turn * dt, Math.min(s.turn * dt, d)); } }
        if (s.kind === 'bone') {   // boomerang : aller, pause au bout, retour vers le squelette
          const o = s.owner;
          if (o.dead) { this.killShot(s); continue; }
          if (s.phase === 'out') {
            const nx = s.x + Math.cos(s.a) * s.speed * dt, ny = s.y + Math.sin(s.a) * s.speed * dt, c = Math.floor(nx), r = Math.floor(ny);
            if (!this.inside(c, r) || this.cell(c, r) || this.solidEnemyAt(c, r) || (this.explore && this.hAt(c, r) > this.hAt(Math.floor(s.x), Math.floor(s.y)) + 0.01 && !this.ramp[this.idx(c, r)])) { s.phase = 'hover'; s.hover = 1; }
            else { s.x = nx; s.y = ny; s.dist += s.speed * dt; if (s.dist >= s.range) { s.phase = 'hover'; s.hover = 1; } }
          } else if (s.phase === 'hover') { s.hover -= dt; if (s.hover <= 0) s.phase = 'back'; }
          else { s.a = Math.atan2(o.y - s.y, o.x - s.x); s.x += Math.cos(s.a) * s.speed * dt; s.y += Math.sin(s.a) * s.speed * dt; if (Math.hypot(o.x - s.x, o.y - s.y) < 0.3) { s.dead = true; s.deadT = 0; continue; } }
          const f = this.flameTouches(s.x, s.y, s.r); if (f) { this.killShot(s, f.owner); continue; }
          for (const p of this.players) { if (!p.alive || p.npc || p.air || p.falling) continue; if (Math.hypot(p.x - s.x, p.y - s.y) < s.r + p.r * 0.8) this.hitPlayer(p, { kind: 'shot', shot: s }); }
          continue;
        }
        if (s.kind === 'magic' && s.pause > 0) {   // la magie s'arrête, puis repart vers le héros
          s.pause -= dt; if (s.pause <= 0) { s.passes--; if (s.passes <= 0) { this.killShot(s); continue; } const p = this.nearestPlayer(s.x, s.y); if (p) s.a = Math.atan2(p.y - s.y, p.x - s.x); s.dist = 0; }
          continue;
        }
        if(s.kind==='dirt') {
          const distance=s.speed*dt,steps=Math.max(1,Math.ceil(distance/.1));let blocked=false;
          for(let i=1;i<=steps;i++){const x=s.x+Math.cos(s.a)*distance*i/steps,y=s.y+Math.sin(s.a)*distance*i/steps,c=Math.floor(x),r=Math.floor(y);
            if(!this.inside(c,r)||this.cell(c,r)){s.x=x;s.y=y;this.killShot(s);blocked=true;break;}
          }
          if(blocked)continue;
        }
        s.x += Math.cos(s.a) * s.speed * dt; s.y += Math.sin(s.a) * s.speed * dt;
        if (s.kind === 'magic') { s.dist += s.speed * dt; if (s.dist >= s.range) s.pause = 0.4; }
        if (s.kind === 'fire') s.z = 0.15 + Math.abs(Math.sin(s.t * 7)) * 0.5;   // rebondit
        if (s.kind === 'dirt') s.z = 0.3 + Math.sin(Math.PI * Math.min(1, s.t / s.dur)) * 1.3;   // en cloche
        const c = Math.floor(s.x), r = Math.floor(s.y);
        if (!this.inside(c, r) || s.life <= 0) { this.killShot(s); continue; }
        if (s.kind !== 'magic' && s.kind !== 'dirt') {   // la magie traverse les obstacles ; les mottes ont été vérifiées sur tout leur trajet
          const v = this.cell(c, r);
          if (v || this.solidEnemyAt(c, r) !== s.owner && this.solidEnemyAt(c, r)) { if (v === SOFT && s.kind === 'missile') this.destroyBlock(c, r, null); else if (v === HARD && (s.kind === 'missile' || s.kind === 'ball' || s.kind === 'poison' && s.owner && s.owner.type === 'marin') && BK.STATUES.includes(this.deco[this.idx(c, r)])) this.destroyStatue(c, r); this.killShot(s); continue; }
          if (this.explore && this.hAt(c, r) > this.hAt(Math.floor(s.x - Math.cos(s.a) * 0.3), Math.floor(s.y - Math.sin(s.a) * 0.3)) + 0.01 && !this.ramp[this.idx(c, r)]) { this.killShot(s); continue; }   // une falaise arrête le tir
          if (s.kind === 'fire' && this.explore && this.tAt(c, r) === T_WATER) { this.killShot(s); this.burst(s.x, s.y, 0.3, 'rgba(230,240,255,0.8)', 8); continue; }   // le feu s'éteint dans l'eau
          const b = this.bombAt(c, r); if (b && (s.kind === 'missile' || s.kind === 'fire')) { if (s.kind === 'missile') this.explodeBomb(b); this.killShot(s); continue; }
        }
        if (s.kind === 'missile' || s.kind === 'magic') { const f = this.flameTouches(s.x, s.y, s.r); if (f) { this.killShot(s, f.owner); continue; } }
        let hit = false;
        for (const p of this.players) {
          if (!p.alive || p.npc || p.air || p.falling) continue;
          if (s.kind === 'dirt' && s.z > 0.7) continue;   // la motte passe au-dessus de la tête tant qu'elle n'est pas retombée
          if (Math.hypot(p.x - s.x, p.y - s.y) < s.r + p.r * 0.8) {
            if (s.kind === 'ice') { if (p.invuln <= 0 && !(p.frozen > 0) && !this.frozen) { p.frozen = 1.6; p.running = false; p.input.dx = p.input.dy = 0; this.burst(p.x, p.y, 0.4, '#bfefff', 12); this.events.push({ type: 'frozen', player: p }); } }
            else this.hitPlayer(p, { kind: 'shot', shot: s });
            this.killShot(s); hit = true; break;
          }
        }
        if (hit) continue;
        if (s.kind === 'missile' && Math.random() < 20 * dt) this.particles.push({ x: s.x - Math.cos(s.a) * 0.3, y: s.y - Math.sin(s.a) * 0.3, z: (this.explore ? this.groundZ(s.x, s.y) : 0) + s.z - 0.1, gz: 0, vx: 0, vy: 0, vz: 0.5, life: 0.35, t: 0, color: Math.random() < 0.5 ? 'rgba(255,170,60,0.9)' : 'rgba(120,120,120,0.6)', size: 0.09 });
        if (s.kind === 'poison' && Math.random() < 14 * dt) this.particles.push({ x: s.x, y: s.y, z: (this.explore ? this.groundZ(s.x, s.y) : 0) + s.z - 0.05, gz: 0, vx: 0, vy: 0, vz: -0.4, life: 0.35, t: 0, color: 'rgba(120,255,80,0.7)', size: 0.07 });
        if (s.kind === 'ball' && s.color === 'fire' && Math.random() < 16 * dt) this.particles.push({ x: s.x, y: s.y, z: (this.explore ? this.groundZ(s.x, s.y) : 0) + s.z, gz: 0, vx: 0, vy: 0, vz: 0.8, life: 0.3, t: 0, color: 'rgba(255,140,40,0.85)', size: 0.09 });
        if (s.kind === 'fire' && Math.random() < 16 * dt) this.particles.push({ x: s.x, y: s.y, z: (this.explore ? this.groundZ(s.x, s.y) : 0) + s.z, gz: 0, vx: 0, vy: 0, vz: 0.8, life: 0.3, t: 0, color: 'rgba(255,200,60,0.8)', size: 0.08 });
        if (s.kind === 'magic' && Math.random() < 14 * dt) this.particles.push({ x: s.x, y: s.y, z: (this.explore ? this.groundZ(s.x, s.y) : 0) + s.z, gz: 0, vx: 0, vy: 0, vz: 0.3, life: 0.4, t: 0, color: ['#ff5c8a', '#ffd54a', '#3f9cff'][Math.floor(Math.random() * 3)], size: 0.07 });
      }
      this.shots = this.shots.filter(s => !s.dead || s.deadT < 0.3);
    }
    killShot(s, by) {
      if (s.dead) return; s.dead = true; s.deadT = 0;
      if (s.kind === 'missile') { this.burst(s.x, s.y, 0.45, '#ff8a1f', 10); this.burst(s.x, s.y, 0.3, '#444', 6); this.shake = Math.max(this.shake, 0.12); }
      else if (s.kind === 'fire') this.burst(s.x, s.y, 0.35, '#ffb347', 8);
      else if (s.kind === 'dirt') this.burst(s.x, s.y, 0.4, '#7d5428', 10, 1);
      else if (s.kind === 'bone') this.burst(s.x, s.y, 0.35, '#f4f0e6', 8, 1);
      else if (s.kind === 'ice') this.burst(s.x, s.y, 0.35, '#e8fbff', 10);
      else if (s.kind === 'poison') { this.burst(s.x, s.y, 0.45, 'rgba(120,255,80,0.9)', 12); this.burst(s.x, s.y, 0.3, '#1f7a2a', 6, 1); }
      else if (s.kind === 'magic') { this.burst(s.x, s.y, 0.4, '#ffd54a', 6); this.burst(s.x, s.y, 0.4, '#ff5c8a', 6); this.burst(s.x, s.y, 0.4, '#3f9cff', 6); }
      else this.burst(s.x, s.y, 0.3, '#666', 6);
      if (by) { by.score += 50; this.events.push({ type: 'shotDestroyed', shot: s, player: by }); }
      this.events.push({ type: 'shotHit', shot: s });
    }
    updateToad(e, dt) {
      if(this.updateToadPowers(e,dt))return;
      // état : 'sit' (attend) → 'jump' (en l'air vers la cible) → atterrit (onde de choc)
      if (e.state === 'walk') { e.state = 'sit'; e.stateT = 0; }
      if (e.state === 'sit') {
        e.squash = Math.max(0, 1 - e.stateT * 2);
        if (e.stateT > (e.hp <= 2 ? 1.0 : 1.5)) {
          const p = this.nearestPlayer(e.x, e.y); if (!p) return;
          const c = Math.floor(e.x), r = Math.floor(e.y); const cand = [];
          for (let dc = -2; dc <= 2; dc++) for (let dr = -2; dr <= 2; dr++) { if (!dc && !dr) continue; if (Math.abs(dc) + Math.abs(dr) > 3) continue; const tc = c + dc, tr = r + dr; if (!this.inside(tc, tr) || this.cell(tc, tr) === HARD || this.bombAt(tc, tr) || !this.walkableTerrain(tc, tr) || Math.abs(this.hAt(tc, tr) - this.hAt(c, r)) > 0.01 || this.ramp[this.idx(tc, tr)] || this.solidEnemyAt(tc, tr) || !this.jumpClear(c, r, tc, tr)) continue; cand.push({ c: tc, r: tr, d: Math.hypot(p.x - tc - 0.5, p.y - tr - 0.5) + Math.random() * 0.8 }); }
          if (!cand.length) return; cand.sort((a, b) => a.d - b.d); const tg = cand[0];
          this.leaveToadSlime(e);
          e.state = 'jump'; e.stateT = 0; e.from = { x: e.x, y: e.y }; e.to = { x: tg.c + 0.5, y: tg.r + 0.5 }; e.flip = tg.c < c;
        }
      } else if (e.state === 'jump') {
        const u = Math.min(1, e.stateT / 0.7); e.x = e.from.x + (e.to.x - e.from.x) * u; e.y = e.from.y + (e.to.y - e.from.y) * u; e.z = Math.sin(u * Math.PI) * 1.6;
        if (u >= 1) {
          e.z = 0; e.state = 'sit'; e.stateT = 0; e.squash = 1; this.shake = Math.max(this.shake, 0.3);
          const c = Math.floor(e.x), r = Math.floor(e.y); if (this.cell(c, r) === SOFT) this.destroyBlock(c, r, null);
          this.leaveToadSlime(e);
          this.burst(e.x, e.y, 0.8, '#c9b37a', 12, 1); this.events.push({ type: 'stomp', enemy: e });
          for (const p of this.players) if (p.alive && Math.hypot(p.x - e.x, p.y - e.y) < 1.25) this.hitPlayer(p, { kind: 'enemy', enemy: e });
        }
      }
    }
    updateGolem(e, dt) {
      const p = this.nearestPlayer(e.x, e.y); if (!p) return;
      e.cool = (e.cool || 0) - dt; e.cool2 = (e.cool2 || 0) - dt;
      if (e.state === 'walk') {
        const dist = Math.hypot(p.x - e.x, p.y - e.y) || 1;
        const speed = (e.hp <= 4 ? e.speed * 1.5 : e.speed) * this.slowAt(e);
        // prochaine case vers le joueur (les blocs mous comptent comme franchissables : il les écrase)
        e.pathT = (e.pathT || 0) - dt;
        if (e.pathT <= 0 || !e.next) { e.pathT = 0.5; e.next = this.stepToward(Math.floor(e.x), Math.floor(e.y), Math.floor(p.x), Math.floor(p.y), (n, from) => { const v = this.cell(n.c, n.r); return (v === 0 || v === SOFT) && !this.solidEnemyAt(n.c, n.r) && this.walkableTerrain(n.c, n.r) && this.canStep(from.c, from.r, n.c, n.r); }); }
        const tx = e.next ? e.next.c + 0.5 : p.x, ty = e.next ? e.next.r + 0.5 : p.y;
        let dx = tx - e.x, dy = ty - e.y; const d2 = Math.hypot(dx, dy) || 1; dx /= d2; dy /= d2;
        if (e.next && d2 < 0.1) e.next = null;
        this.moveCircle(e, dx * speed * dt, dy * speed * dt, e);
        e.flip = dx < 0; e.walkT = (e.walkT || 0) + dt;
        if (dist < 3.2 && e.cool <= 0) { e.state = 'stompWind'; e.stateT = 0; }
        else if (dist >= 3.2 && e.cool2 <= 0) { e.state = 'throwWind'; e.stateT = 0; e.rock = { x: p.x, y: p.y, t: 0 }; }
      } else if (e.state === 'stompWind') {
        e.stomp = Math.min(1, e.stateT / 0.8);
        if (e.stateT > 0.8) {
          e.state = 'stompDone'; e.stateT = 0; e.stomp = 0; e.cool = 4.5; this.shake = 0.5; this.events.push({ type: 'stomp', enemy: e });
          const c = Math.floor(e.x), r = Math.floor(e.y); this.burst(e.x, e.y, 1, '#c9b37a', 20, 1);
          for (const p2 of this.players) if (p2.alive && Math.hypot(p2.x - e.x, p2.y - e.y) < 1.6) this.hitPlayer(p2, { kind: 'enemy', enemy: e });
          for (let d = 0; d < 4; d++) { const D = DIRS[d]; for (let k = 1; k <= 3; k++) { const cc = c + D.dx * k, rr = r + D.dy * k; if (this.cell(cc, rr) === HARD) break; if (this.cell(cc, rr) === SOFT) { this.destroyBlock(cc, rr, null); break; } this.quakes = this.quakes || []; this.quakes.push({ c: cc, r: rr, t: -k * 0.08, by: e }); } }
        }
      } else if (e.state === 'stompDone') { if (e.stateT > 0.6) { e.state = 'walk'; e.stateT = 0; } }
      else if (e.state === 'throwWind') {
        if (e.stateT > 0.5) { e.state = 'walk'; e.cool2 = 5; this.rocks = this.rocks || []; this.rocks.push({ x: e.rock.x, y: e.rock.y, t: 0, dur: 1.1, owner: e }); this.events.push({ type: 'rockThrown', enemy: e }); }
      }
      // ondes de choc au sol et rochers qui tombent
      if (this.rocks) { for (const rk of this.rocks) { rk.t += dt; if (rk.t >= rk.dur && !rk.done) { rk.done = true; this.shake = 0.3; const c = Math.floor(rk.x), r = Math.floor(rk.y); if (this.cell(c, r) === SOFT) this.destroyBlock(c, r, null); this.burst(rk.x, rk.y, 0.6, '#8d7b6a', 12, 1); for (const p2 of this.players) if (p2.alive && Math.hypot(p2.x - rk.x, p2.y - rk.y) < 0.9) this.hitPlayer(p2, { kind: 'enemy', enemy: e }); } } this.rocks = this.rocks.filter(rk => rk.t < rk.dur + 0.3); }
    }

    // Texte qui monte au-dessus d'un point (XP, niveau…).
    // Joueur en train de tomber : dans l'eau il s'enfonce sous la surface (ronds dans l'eau, bulles) ;
    // dans le vide il rapetisse en tournoyant et s'efface.
    // Montagne (ancrée au milieu de sa rangée du bas) : crête dentelée à plusieurs pics, face avant éclairée à gauche,
    // dos sombre, arêtes, chapeau de neige ou de roc selon le type.
    drawMountain(ctx, cam, c, r, z, time) {
      const D3 = BK.draw3d, pr = this.props[c + ',' + r] || {}, w = pr.mw || 3, d = pr.md || 2, h = (pr.mh || 3) * 0.75 + 0.6, type = pr.mtype || 'neige';
      const x0 = c - Math.floor((w - 1) / 2), x1 = x0 + w, y0 = r - (d - 1), y1 = r + 1, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const P = (x, y, zz) => cam.project(x, y, z + (zz || 0)), FL = P(x0 + 0.05, y1), FR = P(x1 - 0.05, y1), BL = P(x0 + 0.05, y0), BR = P(x1 - 0.05, y0), PK = P(cx, cy, h), MID = { x: (FL.x + FR.x) / 2, y: (FL.y + FR.y) / 2 };
      const COL = { neige: ['#a9b2bd', '#7f8894', '#565e69', '#f4f8ff'], terre: ['#b5803f', '#8f6232', '#5e3f24', null], roche: ['#98a1ac', '#6f7883', '#4a515a', null], herbe: ['#78c05e', '#54994a', '#3b7533', '#9aa3ad'] }[type] || ['#a9b2bd', '#7f8894', '#565e69', '#f4f8ff'];
      const seed = c * 31 + r * 17 + w * 7 + d * 3, rnd = n => { const v = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); };
      // la crête : des points de la base gauche à la base droite, montés vers le sommet selon un profil bossu et dentelé
      const N = 4 + w * 2, ridge = [];
      for (let i = 0; i <= N; i++) { const u = i / N, b = { x: FL.x + (FR.x - FL.x) * u, y: FL.y + (FR.y - FL.y) * u }; let f = Math.pow(Math.max(0, 1 - Math.abs(u - 0.5) * 2), 0.75); if (i > 0 && i < N) f *= 0.72 + 0.36 * rnd(i) * (i % 2 ? 1 : 0.4); if (Math.abs(u - 0.5) < 1e-6) f = 1; ridge.push({ x: b.x + (PK.x - MID.x) * f, y: b.y + (PK.y - MID.y) * f, f }); }
      D3.quad(ctx, [BL, ...ridge, BR], COL[2]);   // dos
      D3.quad(ctx, [FL, ...ridge, FR], COL[0]);   // face avant éclairée
      ctx.save(); ctx.beginPath(); ctx.moveTo(FL.x, FL.y); for (const q of ridge) ctx.lineTo(q.x, q.y); ctx.lineTo(FR.x, FR.y); ctx.closePath(); ctx.clip();
      ctx.fillStyle = COL[1]; ctx.beginPath(); ctx.moveTo(PK.x, PK.y - 2); ctx.lineTo(FR.x + 2, FL.y + 4); ctx.lineTo(FR.x + 2, PK.y - 4); ctx.closePath(); ctx.fill();   // versant droit dans l'ombre
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = Math.max(1, FL.k * 0.02); for (let i = 2; i < N - 1; i += 2) { const q = ridge[i]; if (q.f < 0.45) continue; const b = { x: FL.x + (FR.x - FL.x) * (i / N + (rnd(i + 20) - 0.5) * 0.12), y: FL.y + (FR.y - FL.y) * (i / N) }; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.quadraticCurveTo((q.x + b.x) / 2 + (rnd(i + 40) - 0.5) * FL.k * 0.3, (q.y + b.y) / 2, b.x, b.y); ctx.stroke(); }   // arêtes
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < w * 3; i++) { const u = rnd(i + 60), v = 0.25 + rnd(i + 80) * 0.6, px = FL.x + (FR.x - FL.x) * u, py = FL.y + (PK.y - FL.y) * v * (1 - Math.abs(u - 0.5)), sz = FL.k * (0.06 + rnd(i + 90) * 0.08); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + sz, py + sz * 0.6); ctx.lineTo(px - sz * 0.6, py + sz * 0.7); ctx.closePath(); ctx.fill(); }   // rochers
      if (COL[3]) { const lim = type === 'herbe' ? 0.78 : 0.58, cap = []; for (const q of ridge) if (q.f >= lim) cap.push(q); if (cap.length >= 2) { const pts = [...cap]; for (let i = cap.length - 1; i >= 0; i--) { const q = cap[i], base = { x: FL.x + (FR.x - FL.x) * (ridge.indexOf(q) / N), y: FL.y + (FR.y - FL.y) * (ridge.indexOf(q) / N) }, t = lim - 0.08 + (i % 2 ? 0.07 : 0); pts.push({ x: base.x + (q.x - base.x) * (t / q.f), y: base.y + (q.y - base.y) * (t / q.f) }); } D3.quad(ctx, pts, COL[3]); } }   // chapeau
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; D3.quad(ctx, [FL, ...ridge, FR], null, 'rgba(0,0,0,0.3)');
    }
    // Volcan 3 × 3 : cône arrondi (huit pans ombrés), rebord, cratère incandescent, coulées de lave qui luisent ;
    // la fumée et les éruptions sont des particules.
    drawVolcano(ctx, cam, c, r, z, time) {
      const D3 = BK.draw3d, v = this.volcanoes.find(q => q.c === c && q.r === r) || { erupt: 0, t: time }, cx = c + 0.5, cy = r + 0.5, h = 2.3, rt = 0.6, rb = 1.5;
      const miniature=this.previewStage?(this.props[c+','+r]?.previewScale||1):1;
      const P = (x, y, zz) => cam.project(cx+(x-cx)*miniature, cy+(y-cy)*miniature, z + (zz || 0)*miniature), glow = 0.55 + 0.25 * Math.sin(time * 2.2) + (v.erupt > 0 ? 0.4 : 0), n = 10, base = [], rim = [];
      for (let i = 0; i < n; i++) { const a = Math.PI * 2 * i / n + Math.PI / n; base.push(P(cx + Math.cos(a) * rb, cy + Math.sin(a) * rb * 0.95)); rim.push(P(cx + Math.cos(a) * rt, cy + Math.sin(a) * rt, h)); }
      const order = [...Array(n).keys()].sort((i, j) => (base[i].y + base[(i + 1) % n].y) - (base[j].y + base[(j + 1) % n].y));   // pans du fond d'abord
      for (const i of order) { const a = Math.PI * 2 * (i + 0.5) / n + Math.PI / n, light = 0.62 + 0.38 * Math.max(0, Math.cos(a - Math.PI * 1.25)); const q = [base[i], base[(i + 1) % n], rim[(i + 1) % n], rim[i]]; D3.quad(ctx, q, D3.shade('#6b5f5a', light)); ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; D3.quad(ctx, q, null, 'rgba(0,0,0,0.15)'); }
      // coulées de lave sur les pans de devant
      const C = P(cx, cy, h), lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }); ctx.lineCap = 'round';
      for (const [i, k] of [[2, 0], [3, 1], [4, 2]]) { const top = lerp(rim[i], rim[(i + 1) % n], 0.5), bot = lerp(base[i], base[(i + 1) % n], 0.5), len = 0.55 + 0.15 * Math.sin(time * 1.3 + k * 2), b = lerp(top, bot, len); ctx.strokeStyle = 'rgba(255,106,31,' + (0.4 + 0.25 * glow) + ')'; ctx.lineWidth = Math.max(4, C.k * 0.15); ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.quadraticCurveTo(top.x + (k - 1) * C.k * 0.12, (top.y + b.y) / 2, b.x, b.y); ctx.stroke(); ctx.strokeStyle = 'rgba(255,213,74,' + (0.5 + 0.3 * glow) + ')'; ctx.lineWidth = Math.max(2, C.k * 0.06); ctx.stroke(); }
      // halo, cratère, rebord
      const rg = ctx.createRadialGradient(C.x, C.y, 0, C.x, C.y, C.k * 1.2); rg.addColorStop(0, 'rgba(255,170,60,' + (0.45 * glow) + ')'); rg.addColorStop(1, 'rgba(255,100,30,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(C.x, C.y, C.k * 1.2, C.k * 0.65, 0, 0, Math.PI * 2); ctx.fill();
      const lg = ctx.createRadialGradient(C.x, C.y, 0, C.x, C.y, C.k * rt); lg.addColorStop(0, '#fff2a8'); lg.addColorStop(0.5, '#ffb03a'); lg.addColorStop(1, '#e8471a'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(rim[0].x, rim[0].y); for (let i = 1; i < n; i++) ctx.lineTo(rim[i].x, rim[i].y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#3a3330'; ctx.lineWidth = Math.max(2.5, C.k * 0.09); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,200,' + (0.3 + 0.3 * Math.sin(time * 9)) + ')'; for (let k = 0; k < 3; k++) { const a = time * 3 + k * 2.1; ctx.beginPath(); ctx.arc(C.x + Math.cos(a) * C.k * 0.3, C.y + Math.sin(a) * C.k * 0.14, Math.max(1.5, C.k * 0.04), 0, Math.PI * 2); ctx.fill(); }
    }
    // Animation de pêche : canne tendue, ligne jusqu'au bouchon, rides, touche, puis le poisson saute dans les mains.
    drawFishing(ctx, cam, p, time) {
      const f = p.fishing, D = DIRS[p.dir], gz = this.explore ? this.groundZ(p.x, p.y) : 0, wx = f.c + 0.5, wy = f.r + 0.5, wz = this.explore ? this.groundZ(wx, wy) : 0;
      const cast = Math.min(1, f.t / 0.45), ease = cast * cast * (3 - 2 * cast);
      const hand = cam.project(p.x + D.dx * 0.25, p.y + D.dy * 0.1, gz + 0.95), tip = cam.project(p.x + D.dx * (0.35 + 0.95 * ease), p.y + D.dy * (0.35 + 0.95 * ease) + (D.dy ? 0 : -0.02), gz + 1.75 - 0.35 * ease);
      ctx.strokeStyle = '#8a5a2a'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, hand.k * 0.05); ctx.beginPath(); ctx.moveTo(hand.x, hand.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
      ctx.strokeStyle = '#d9b382'; ctx.lineWidth = Math.max(1, hand.k * 0.02); ctx.beginPath(); ctx.moveTo(hand.x, hand.y); ctx.lineTo(hand.x + (tip.x - hand.x) * 0.8, hand.y + (tip.y - hand.y) * 0.8); ctx.stroke();
      if (f.t < 0.45) return;
      const dip = f.bit && !f.caught ? 0.18 : 0, bobZ = wz + 0.02 - dip + Math.sin(time * 2.5) * 0.02, bob = cam.project(wx, wy, bobZ), k = bob.k;
      if (!f.caught) {   // ligne et bouchon rouge et blanc
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.quadraticCurveTo(tip.x, (tip.y + bob.y) / 2 + k * 0.1, bob.x, bob.y); ctx.stroke();
        ctx.fillStyle = '#ff3b2f'; ctx.beginPath(); ctx.arc(bob.x, bob.y - k * 0.08, k * 0.08, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bob.x, bob.y - k * 0.08, k * 0.08, 0, Math.PI); ctx.fill();
        if (f.bit) { ctx.font = 'bold ' + Math.round(k * 0.3) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd54a'; ctx.fillText('!', bob.x, bob.y - k * 0.5 - Math.sin(time * 10) * k * 0.05); }
      } else {   // le poisson saute de l'eau jusqu'aux mains, avec des étincelles
        const u = Math.min(1, (f.t - 2.15) / 0.5), fx = wx + (p.x + D.dx * 0.2 - wx) * u, fy = wy + (p.y - wy) * u, fz = wz + (gz + 0.95 - wz) * u + Math.sin(u * Math.PI) * 0.9, fp = cam.project(fx, fy, fz);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(fp.x, fp.y); ctx.stroke();
        BK.sprites.drawFish(ctx, fp.x, fp.y, fp.k * 0.9, -0.9 + u * 1.2 + Math.sin(time * 25) * 0.25);
        ctx.fillStyle = '#fff6c0'; for (let i = 0; i < 4; i++) { const a = time * 9 + i * 1.6, rr0 = fp.k * (0.25 + 0.1 * Math.sin(time * 7 + i)); ctx.beginPath(); ctx.arc(fp.x + Math.cos(a) * rr0, fp.y + Math.sin(a) * rr0 * 0.6, Math.max(1.5, fp.k * 0.03), 0, Math.PI * 2); ctx.fill(); }
      }
    }
    drawFalling(ctx, cam, p, time) {
      const f = p.falling, view = p.dir === 0 ? 'front' : p.dir === 2 ? 'back' : 'side';
      const pr = cam.project(p.x, p.y, f.z), surf = cam.project(p.x, p.y, 0);
      ctx.save();
      if (f.kind === 'water') {
        if (f.splashed) {
          // ronds dans l'eau
          for (let i = 0; i < 3; i++) { const u = ((f.splashT * 1.1 + i * 0.33) % 1); ctx.strokeStyle = 'rgba(255,255,255,' + (0.7 * (1 - u)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(surf.x, surf.y, surf.k * (0.15 + u * 0.55), surf.k * (0.08 + u * 0.28), 0, 0, Math.PI * 2); ctx.stroke(); }
          // on ne dessine que ce qui dépasse de la surface
          ctx.beginPath(); ctx.rect(surf.x - surf.k * 2, surf.y - surf.k * 4, surf.k * 4, surf.k * 4 + surf.k * 0.08); ctx.clip();
        } else D3.shadow(ctx, cam, p.x, p.y, 0.3 * (p.def.size || 1) + 0.1, 0.3 * Math.max(0.4, 1 - f.z / 2), 0);
        ctx.translate(pr.x, pr.y);
        BK.sprites.drawCharacter(ctx, p.def, { s: pr.k*(p.sizeScale||1), pose: 'hit', t: p.animT, poseT: 0.25, view, flip: p.dir === 1, walk: p.walk });
      } else {
        const u = Math.min(1, f.t / f.dur), sc = Math.max(0.05, 1 - u * 0.9);
        ctx.globalAlpha = Math.max(0, 1 - u * 1.1);
        ctx.translate(pr.x, pr.y); ctx.rotate(Math.sin(f.spin || 0) * 0.5); ctx.scale(sc, sc);
        BK.sprites.drawCharacter(ctx, p.def, { s: pr.k*(p.sizeScale||1), pose: 'hit', t: p.animT, poseT: 0.25, view, flip: p.dir === 1, walk: p.walk });
      }
      ctx.restore();
    }
    addFloater(x, y, text, o) { o = o || {}; this.floaters.push({ x, y, text, t: 0, life: o.life || 1.6, color: o.color || '#ffd54a', size: o.size || 0.34, follow: o.follow || null }); }
    updateFloaters(dt) { for (const f of this.floaters) { f.t += dt; if (f.follow) { f.x = f.follow.x; f.y = f.follow.y; } } this.floaters = this.floaters.filter(f => f.t < f.life); }
    // ------------------------------------------------------------------ particules
    burst(x, y, r, color, n, heavy) {
      const gz = this.explore ? this.groundZ(x, y) : 0; for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = rnd(0.5, 2.5); this.particles.push({ x, y, z: gz + rnd(0.1, 0.8), gz, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: rnd(2, 5), life: rnd(0.4, 0.9), t: 0, color, size: heavy ? rnd(0.08, 0.18) : rnd(0.05, 0.1), heavy }); }
    }
    updateParticles(dt) {
      for (const q of this.particles) { if (q.ring) q.size += dt * 0.5; q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; if (q.float) continue; q.vz -= 12 * dt; if (q.z < (q.gz || 0)) { q.z = q.gz || 0; q.vz *= -0.4; q.vx *= 0.7; q.vy *= 0.7; } }
      this.particles = this.particles.filter(q => q.t < q.life);
    }
    livingEnemies() { return this.enemies.filter(e => !e.dead && !e.tame && !e.def.peaceful); }   // les animaux pacifiques et les lapins apprivoisés ne comptent pas

    // ------------------------------------------------------------------ rendu
    render(ctx, cam, o) {
      o = o || {}; const T = this.theme, time = this.time;
      ctx.save();
      if (this.shake > 0 && !o.noShake) { const k = this.shake * 10; ctx.translate(rnd(-k, k), rnd(-k, k)); }
      // ciel, montagnes, nuages
      const W = cam.W, H = cam.H;
      if (!o.noBackground) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, T.sky[0]); g.addColorStop(1, T.sky[1]); ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
      const dk = this.darkness(); if (dk > 0.3) {   // étoiles dans le ciel, derrière les montagnes et le terrain
        const a = Math.min(1, (dk - 0.3) / 0.7); for (let i = 0; i < 70; i++) { const sx = ((i * 7919) % 1000) / 1000 * W, sy = ((i * 104729) % 1000) / 1000 * H * 0.42, tw = 0.5 + 0.5 * Math.sin(time * (1.5 + i % 3) + i); ctx.fillStyle = 'rgba(255,255,255,' + (a * 0.85 * tw) + ')'; ctx.beginPath(); ctx.arc(sx, sy, i % 5 === 0 ? 1.9 : 1.2, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.fillStyle = T.mountain; ctx.beginPath(); ctx.moveTo(-20, H * 0.5);
      for (let x = -20; x <= W + 40; x += 40) { const h = Math.sin(x * 0.011) * 60 + Math.sin(x * 0.027 + 2) * 35 + Math.sin(x * 0.005) * 50; ctx.lineTo(x, H * 0.36 - h); }
      ctx.lineTo(W + 40, H); ctx.lineTo(-20, H); ctx.closePath(); ctx.fill();
      const fg = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.75); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, T.fog); ctx.fillStyle = fg; ctx.fillRect(-20, H * 0.3, W + 40, H);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const c of this.clouds) { const x = ((c.x + time * c.v) % (W + 300)) - 150; for (const [ox, oy, r] of [[0, 0, 26], [22, -10, 20], [-20, -6, 18], [40, 4, 16], [-36, 6, 14]]) { ctx.beginPath(); ctx.arc(x + ox * c.s, c.y + oy * c.s, r * c.s, 0, Math.PI * 2); ctx.fill(); } }
      }
      // sol (les cases hors champ sont sautées)
      const D3 = BK.draw3d;
      const cmin = Math.max(0, Math.floor(cam.target.x - 11)), cmax = Math.min(this.cols - 1, Math.ceil(cam.target.x + 11)), rmin = Math.max(0, Math.floor(cam.target.y - 10)), rmax = Math.min(this.rows - 1, Math.ceil(cam.target.y + 9));
      const list = [], bubbles = [];
      const camX = cam.pos.x;
      const push = (y, x, fn) => {if(!this.hiddenSecretAt?.(Math.floor(x),Math.floor(y)))list.push({ y, x: -Math.abs(x - camX), fn });};
      const drawSpecial = (p, c, r) => {
        const sp = this.special.get(c + ',' + r), exit=this.roomExit ? sp?.exit : this.exit;
        if (sp && sp.type === 'exit' && !this.cell(c, r) && exit?.kind === 'door') {
          const open = exit.open; D3.quad(ctx, [D3.onQuad(p, 0.1, 0.1), D3.onQuad(p, 0.9, 0.1), D3.onQuad(p, 0.9, 0.9), D3.onQuad(p, 0.1, 0.9)], open ? '#3a2a1a' : '#6b5a4a');
          D3.quad(ctx, [D3.onQuad(p, 0.22, 0.22), D3.onQuad(p, 0.78, 0.22), D3.onQuad(p, 0.78, 0.78), D3.onQuad(p, 0.22, 0.78)], open ? (Math.sin(time * 6) > 0 ? '#ffe36b' : '#ffb03a') : '#4a3a2a');
          if (this.roomExit) { const q=D3.onQuad(p,0.5,0.5), k=cam.scaleAt(c+0.5,r+0.5); ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='bold '+Math.max(7,Math.round(k*0.13))+'px sans-serif'; ctx.fillStyle='#2b2412'; ctx.fillText('SORTIE',q.x,q.y); ctx.restore(); }
        } else if (sp && sp.type === 'switch') {
          D3.quad(ctx, [D3.onQuad(p, 0.2, 0.2), D3.onQuad(p, 0.8, 0.2), D3.onQuad(p, 0.8, 0.8), D3.onQuad(p, 0.2, 0.8)], sp.sw.on ? '#49e26a' : '#d9342b');
          D3.quad(ctx, [D3.onQuad(p, 0.3, 0.3), D3.onQuad(p, 0.7, 0.3), D3.onQuad(p, 0.7, 0.7), D3.onQuad(p, 0.3, 0.7)], sp.sw.on ? '#a8ffbe' : '#ff8a80');
        }
      };
      const floorColor = (c, r, t) => {
        if (t === T_ICE) return (c + r) % 2 ? '#cdeeff' : '#b9e3fb';
        if(t>=16&&t<=20)return BK.DESERT_FLOORS[t-16].colors[(c+r)%2];
        if (t === T_SNOW) return (c + r) % 2 ? '#f7faff' : '#eaf1fa';
        if (t === T_LAVA) return '#e8471a';
        if (t === T_GRASS) return (c + r) % 2 ? T.grass || '#5fb84a' : T.grass2 || '#55a842';
        if (t === T_BRIDGE) return '#a0703a';
        if (t === T_DIRT) return (c + r) % 2 ? '#7d5428' : '#734c24';
        if (t === T_ROAD) return (c + r) % 2 ? '#4a4d55' : '#474a52';
        if (t === T_PLAZA) return (c + r) % 2 ? '#c9b89a' : '#b9a888';
        if (t === T_SIDEWALK || t === T_CURB) return (c + r) % 2 ? '#c4c6ca' : '#babcc0';
        if (t === T_WOOD) return r % 2 ? '#b07a3e' : '#a66f35';
        if (t === T_TILE) return (c + r) % 2 ? '#f0ece4' : '#2b2f3a';
        if (t === T_CARPET) return '#9e2b2b';
        return (c + r) % 2 ? T.floor : T.floor2;
      };
      // motifs dessinés sur une tuile projetée selon le sol
      const drawLift = (p, c, r) => {
        const L = this.liftAt(c, r); const q = [D3.onQuad(p, 0.08, 0.08), D3.onQuad(p, 0.92, 0.08), D3.onQuad(p, 0.92, 0.92), D3.onQuad(p, 0.08, 0.92)];
        D3.quad(ctx, q, '#9aa3ad'); ctx.lineWidth = 1.5; D3.quad(ctx, q, null, '#4a515a');
        ctx.fillStyle = '#5a616a'; for (const [u, v] of [[0.17, 0.17], [0.83, 0.17], [0.83, 0.83], [0.17, 0.83]]) { const o = D3.onQuad(p, u, v); ctx.beginPath(); ctx.arc(o.x, o.y, 2.2, 0, Math.PI * 2); ctx.fill(); }
        const a = D3.onQuad(p, 0.5, 0.28), b = D3.onQuad(p, 0.32, 0.6), d = D3.onQuad(p, 0.68, 0.6); ctx.fillStyle = L && L.lv >= 4 ? '#888' : '#ffd54a'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(d.x, d.y); ctx.lineTo(b.x, b.y); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1; ctx.stroke();
      };
      const drawElevator = (E, c, r) => {
        const i = this.idx(c, r), base = E.base, zs = this.height[i];
        if (base > 0.01) D3.cube(ctx, cam, c, r, c + 1, r + 1, base, { top: '#4a4a52', front: T.cliff || '#8a6a4a', side: T.cliffDark || '#5e4731' }, { faces: { front: this.hAt(c, r + 1) < base - 0.01, east: this.hAt(c + 1, r) < base - 0.01, west: this.hAt(c - 1, r) < base - 0.01 } });
        else D3.tile(ctx, cam, c, r, '#4a4a52');
        D3.cube(ctx, cam, c + 0.4, r + 0.4, c + 0.6, r + 0.6, Math.max(0.02, zs - 0.12 - base), { top: '#6f7883', front: '#5a616a', side: '#4a515a' }, { z: base });
      };
      // le plateau est dessiné après la bombe qui est dessous, mais avant le héros qui est dessus
      const drawElevatorSlab = (E) => {
        const c = E.c, r = E.r, zs = this.height[this.idx(c, r)];
        const f = D3.cube(ctx, cam, c + 0.04, r + 0.04, c + 0.96, r + 0.96, 0.12, { top: this.theme.castleFloor?'#d1bf9a':'#9aa3ad', front: '#806b4c', side: '#67553e' }, { z: zs - 0.12, outline: 'rgba(0,0,0,0.25)' });
        const q = f.top; ctx.fillStyle = '#5a616a'; for (const [u, v] of [[0.15, 0.15], [0.85, 0.15], [0.85, 0.85], [0.15, 0.85]]) { const o = D3.onQuad(q, u, v); ctx.beginPath(); ctx.arc(o.x, o.y, 2.2, 0, Math.PI * 2); ctx.fill(); }
        const tri = (a, b, d) => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1; ctx.stroke(); };
        ctx.fillStyle = E.state === 'rest' ? '#ffd54a' : E.state === 'down' ? '#ff8a80' : '#49e26a'; tri(D3.onQuad(q, 0.5, 0.18), D3.onQuad(q, 0.33, 0.47), D3.onQuad(q, 0.67, 0.47)); tri(D3.onQuad(q, 0.5, 0.82), D3.onQuad(q, 0.33, 0.53), D3.onQuad(q, 0.67, 0.53));
      };
      const drawLava = (p, c, r) => {
        const g = D3.onQuad(p, 0.5 + 0.2 * Math.sin(time * 0.7 + c), 0.5 + 0.2 * Math.cos(time * 0.9 + r)); const rg = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, 22); rg.addColorStop(0, 'rgba(255,240,150,' + (0.55 + 0.2 * Math.sin(time * 3 + c * 2 + r)) + ')'); rg.addColorStop(1, 'rgba(255,200,60,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); ctx.lineTo(p[1].x, p[1].y); ctx.lineTo(p[2].x, p[2].y); ctx.lineTo(p[3].x, p[3].y); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(90,10,0,0.55)'; ctx.lineWidth = 1.5; const a = D3.onQuad(p, 0.1, 0.2 + ((c * 3) % 5) / 10), b = D3.onQuad(p, 0.5, 0.5 + ((r * 7) % 4) / 10), d = D3.onQuad(p, 0.9, 0.3 + ((c + r) % 5) / 10); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(d.x, d.y); ctx.stroke();
        const bu = ((time * 0.8 + c * 0.37 + r * 0.61) % 1); if (bu < 0.5) { const o = D3.onQuad(p, 0.3 + ((c * 5 + r) % 4) / 8, 0.3 + ((r * 3 + c) % 4) / 8); ctx.strokeStyle = 'rgba(255,230,150,' + (0.8 * (1 - bu * 2)) + ')'; ctx.beginPath(); ctx.arc(o.x, o.y, 2 + bu * 10, 0, Math.PI * 2); ctx.stroke(); }
      };
      const floorPattern = (p, c, r, t) => {
        if (this.lifts.length && this.liftAt(c, r)) { drawLift(p, c, r); return; }
        if (t === T_ICE) { const a = D3.onQuad(p, 0.12, 0.75), b = D3.onQuad(p, 0.45, 0.2), d = D3.onQuad(p, 0.55, 0.85), e = D3.onQuad(p, 0.88, 0.35); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(e.x, e.y); ctx.stroke(); if ((c * 7 + r * 3) % 4 === 0) { const f1 = D3.onQuad(p, 0.3, 0.5), f2 = D3.onQuad(p, 0.5, 0.6), f3 = D3.onQuad(p, 0.62, 0.42); ctx.strokeStyle = 'rgba(120,170,210,0.6)'; ctx.beginPath(); ctx.moveTo(f1.x, f1.y); ctx.lineTo(f2.x, f2.y); ctx.lineTo(f3.x, f3.y); ctx.stroke(); } return; }
        if (t === T_SNOW) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let k = 0; k < 3; k++) { const q = D3.onQuad(p, 0.15 + ((c * 5 + r * 7 + k * 11) % 7) / 10, 0.15 + ((c * 3 + r * 11 + k * 5) % 7) / 10); ctx.beginPath(); ctx.arc(q.x, q.y, 1.2, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = 'rgba(160,190,230,0.35)'; const q2 = D3.onQuad(p, 0.3 + ((c * 7 + r) % 5) / 10, 0.55 + ((c + r * 3) % 4) / 10); ctx.beginPath(); ctx.ellipse(q2.x, q2.y, 3.5, 1.6, 0, 0, Math.PI * 2); ctx.fill(); return; }
        const line = (u0, v0, u1, v1, col, w) => { const a = D3.onQuad(p, u0, v0), b = D3.onQuad(p, u1, v1); ctx.strokeStyle = col; ctx.lineWidth = w || 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };
        if(t>=16&&t<=20){
          const ink=t===20?'#eee1a9':'#ad7748';
          if(t===16||t===17)for(let j=0;j<4;j++)line(.1,.16+j*.21,.85,.20+j*.21,ink,t===16?.5:1.4);
          if(t===18){line(0,.3,.45,.55,ink);line(.45,.55,.7,1,ink);line(.45,.55,1,.2,ink);}
          if(t===19){line(0,.5,1,.5,ink);line(.5,0,.5,.5,ink);line(.2,.5,.2,1,ink);}
          if(t===20){line(.5,.1,.9,.5,ink,2);line(.9,.5,.5,.9,ink,2);line(.5,.9,.1,.5,ink,2);line(.1,.5,.5,.1,ink,2);}
          return;
        }
        if (t === T_DIRT) { ctx.fillStyle = 'rgba(40,25,10,0.4)'; for (let k = 0; k < 3; k++) { const q = D3.onQuad(p, 0.2 + ((c * 7 + r * 3 + k * 5) % 6) / 10, 0.2 + ((c * 3 + r * 5 + k * 7) % 6) / 10); ctx.beginPath(); ctx.arc(q.x, q.y, 1.5, 0, Math.PI * 2); ctx.fill(); } }
        else if (t === T_ROAD) { const h = this.tAt(c - 1, r) === T_ROAD || this.tAt(c + 1, r) === T_ROAD, v = this.tAt(c, r - 1) === T_ROAD || this.tAt(c, r + 1) === T_ROAD; if (h && !v) line(0.15, 0.5, 0.65, 0.5, '#e8c84a', 2); else if (v && !h) line(0.5, 0.15, 0.5, 0.65, '#e8c84a', 2); }
        else if (t === T_PLAZA) { line(0.5, 0, 0.5, 0.5, 'rgba(90,70,40,0.4)'); line(0, 0.5, 1, 0.5, 'rgba(90,70,40,0.4)'); line(0.25, 0.5, 0.25, 1, 'rgba(90,70,40,0.4)'); line(0.75, 0.5, 0.75, 1, 'rgba(90,70,40,0.4)'); }
        else if (t === T_SIDEWALK) { line(0.5, 0, 0.5, 1, 'rgba(60,60,70,0.35)'); line(0, 0.5, 1, 0.5, 'rgba(60,60,70,0.35)'); }
        else if (t === T_WOOD) { line(0, 0.5, 1, 0.5, 'rgba(60,30,10,0.35)'); line((c % 2) ? 0.3 : 0.7, 0, (c % 2) ? 0.3 : 0.7, 0.5, 'rgba(60,30,10,0.35)'); line((c % 2) ? 0.7 : 0.3, 0.5, (c % 2) ? 0.7 : 0.3, 1, 'rgba(60,30,10,0.35)'); }
        else if (t === T_CARPET) { const edge = ['n', 's', 'e', 'w'].filter((d, i) => this.tAt(c + [0, 0, 1, -1][i], r + [-1, 1, 0, 0][i]) !== T_CARPET); for (const e of edge) { if (e === 'n') line(0, 0.08, 1, 0.08, '#ffd54a', 2); if (e === 's') line(0, 0.92, 1, 0.92, '#ffd54a', 2); if (e === 'w') line(0.08, 0, 0.08, 1, '#ffd54a', 2); if (e === 'e') line(0.92, 0, 0.92, 1, '#ffd54a', 2); } }
      };
      for (let r = rmin; r <= rmax; r++) for (let c = cmin; c <= cmax; c++) {
        const i = this.idx(c, r);
        if (!this.explore) { drawSpecial(D3.tile(ctx, cam, c, r, floorColor(c, r, T_STONE)), c, r); continue; }
        const t = this.terrain[i], h = this.height[i];
        if(this.hiddenSecretAt?.(c,r)){D3.tile(ctx,cam,c,r,'#242131');continue;}
        if(this.props[c+','+r]?.raisedBridge && this.terrain[i]!==T_VOID){push(r+.02,c+.5,()=>this.drawSupportedBridge(ctx,cam,c,r,h,time));continue;}
        if (this.elevators.length) { const E = this.elevAt(c, r); if (E) { push(r + 0.02, c + 0.5, () => drawElevator(E, c, r)); continue; } }
        if (this.rails.length && this.railAt(c, r)) {
          const base = this.baseH.get(i) || 0, horiz = this.railAt(c - 1, r) || this.railAt(c + 1, r), vert = this.railAt(c, r - 1) || this.railAt(c, r + 1);
          push(r + 0.02, c + 0.5, () => {
            ctx.save();let q; if(this.props[c+','+r]?.platformPit){q=[[c,r],[c+1,r],[c+1,r+1],[c,r+1]].map(([x,y])=>cam.project(x,y,base));ctx.globalAlpha=.22;} else if (base > 0.01) q = D3.cube(ctx, cam, c, r, c + 1, r + 1, base, { top: '#3a3f4a', front: T.cliff || '#8a6a4a', side: T.cliffDark || '#5e4731' }, { faces: { front: this.hAt(c, r + 1) < base - 0.01, east: this.hAt(c + 1, r) < base - 0.01, west: this.hAt(c - 1, r) < base - 0.01 } }).top; else q = D3.tile(ctx, cam, c, r, '#3a3f4a');
            ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = Math.max(1.5, cam.scaleAt(c + 0.5, r + 0.5) * 0.05);
            const seg = (u0, v0, u1, v1) => { const a = D3.onQuad(q, u0, v0), b = D3.onQuad(q, u1, v1); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };
            if (horiz || !vert) { seg(0, 0.35, 1, 0.35); seg(0, 0.65, 1, 0.65); } if (vert) { seg(0.35, 0, 0.35, 1); seg(0.65, 0, 0.65, 1); }ctx.restore();
          });
          continue;
        }
        if (t === T_VOID) continue;
        if (t === T_LAVA) { const p0 = D3.tile(ctx, cam, c, r, Math.sin(time * 1.5 + c * 1.3 + r * 0.7) > 0.3 ? '#ff6a1f' : '#e8471a'); drawLava(p0, c, r); continue; }
        if (t === T_WATER) { const w = Math.sin(time * 1.5 + c * 1.3 + r * 0.7) > 0.3; D3.tile(ctx, cam, c, r, w ? T.water2 || '#3f84ec' : T.water || '#2f6fd6'); continue; }
        if (this.ramp[i]) {
          push(r + 0.02, c + 0.5, () => {
            const rp = this.ramp[i], {hN,hS,hW,hE}=this.rampHeights(c,r);
            const z = (cx, cy) => Math.abs(rp) === 1 ? hN + (hS - hN) * (cy - r) : hW + (hE - hW) * (cx - c);
            const q = [cam.project(c, r, z(c, r)), cam.project(c + 1, r, z(c + 1, r)), cam.project(c + 1, r + 1, z(c + 1, r + 1)), cam.project(c, r + 1, z(c, r + 1))];
            if (Math.abs(rp) === 1 && hS > hN) D3.quad(ctx, [q[3], q[2], cam.project(c + 1, r + 1, 0), cam.project(c, r + 1, 0)], T.cliff || '#8a6a4a');
            D3.quad(ctx, q, '#9a8a6a'); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
            for (let k = 1; k < 4; k++) { const a = D3.onQuad(q, 0, k / 4), b = D3.onQuad(q, 1, k / 4); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
          });
          continue;
        }
        if (h > 0) {
          const lower = (cc, rr) => this.tAt(cc, rr) === T_VOID || this.hAt(cc, rr) < h - 0.01 || this.ramp[this.idx(Math.max(0, Math.min(this.cols - 1, cc)), Math.max(0, Math.min(this.rows - 1, rr)))] !== 0;
          push(r + 0.02, c + 0.5, () => { const f = D3.cube(ctx, cam, c, r, c + 1, r + 1, h, { top: floorColor(c, r, t), front: T.cliff || '#8a6a4a', side: T.cliffDark || '#5e4731' }, { faces: { front: lower(c, r + 1), east: lower(c + 1, r), west: lower(c - 1, r) } }); if (h > LEVEL + 0.05) { ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1; for (let zz = LEVEL; zz < h - 0.05; zz += LEVEL) { const seg = (x0, y0, x1, y1) => { const a = cam.project(x0, y0, zz), b2 = cam.project(x1, y1, zz); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke(); }; if (lower(c, r + 1)) seg(c, r + 1, c + 1, r + 1); if (c + 0.5 < camX - 0.01 && lower(c + 1, r)) seg(c + 1, r, c + 1, r + 1); else if (c + 0.5 > camX + 0.01 && lower(c - 1, r)) seg(c, r, c, r + 1); } } if (t>=16 || this.lifts.length && this.liftAt(c, r)) floorPattern(f.top, c, r, t); this.drawCastleFloor?.(ctx,cam,c,r,h,time); drawSpecial(f.top, c, r); if (this.trail[i]) this.drawTrail(ctx, cam, c, r, h); if (this.flowers.some(fl => fl.c === c && fl.r === r)) { const pr = cam.project(c + 0.5, r + 0.5, h); BK.sprites.drawFlowers(ctx, pr.x, pr.y, pr.k, (this.props[c + ',' + r] || {}).colors, c * 31 + r * 7, time); } if (this.deco[i] && !this.cells[i]) { const pr = cam.project(c + 0.5, r + 0.5, h); BK.sprites.drawDeco(ctx, this.deco[i], pr.x, pr.y, pr.k, time, null, c * 17 + r * 5, this.props[c+','+r]?.orientation||0, this.props[c+','+r]?.lightColor, this.props[c+','+r]); } });
          continue;
        }
        const wet = tt => tt === T_WATER || tt === T_VOID || tt === T_LAVA;
        if (this.isPavement(t)) {   // trottoir et bordure : dalle surélevée, faces seulement vers les sols plus bas
          const low = tt => !this.isPavement(tt) && !wet(tt);
          push(r + 0.02, c + 0.5, () => { const f = D3.cube(ctx, cam, c, r, c + 1, r + 1, 0.1, { top: floorColor(c, r, t), front: t === T_CURB ? '#8a8d94' : '#a4a7ad', side: '#8a8d94' }, { faces: { front: low(this.tAt(c, r + 1)), east: low(this.tAt(c + 1, r)), west: low(this.tAt(c - 1, r)) } }); floorPattern(f.top, c, r, t); drawSpecial(f.top, c, r); if(this.trail[i])this.drawTrail(ctx,cam,c,r,.1); if(this.flowers.some(f=>f.c===c&&f.r===r)){const pr=cam.project(c+.5,r+.5,.1);BK.sprites.drawFlowers(ctx,pr.x,pr.y,pr.k,this.props[c+','+r]?.colors,c*31+r*7,time);} if (t === T_CURB) { const q = f.top; const a = D3.onQuad(q, 0, 0.85), b = D3.onQuad(q, 1, 0.85); ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } if (this.deco[i] && !this.cells[i]) { const pr = cam.project(c + 0.5, r + 0.5, 0.1); BK.sprites.drawDeco(ctx, this.deco[i], pr.x, pr.y, pr.k, time, null, c * 17 + r * 5, this.props[c+','+r]?.orientation||0, this.props[c+','+r]?.lightColor, this.props[c+','+r]); } });
          continue;
        }
        const shore = t !== T_BRIDGE && (wet(this.tAt(c, r + 1)) || wet(this.tAt(c - 1, r)) || wet(this.tAt(c + 1, r)));
        if (shore) { push(r + 0.02, c + 0.5, () => { const f = D3.cube(ctx, cam, c, r, c + 1, r + 1, 0.18, { top: floorColor(c, r, t), front: T.cliff || '#8a6a4a', side: T.cliffDark || '#5e4731' }, { z: -0.18, faces: { front: wet(this.tAt(c, r + 1)), east: wet(this.tAt(c + 1, r)), west: wet(this.tAt(c - 1, r)) } }); floorPattern(f.top, c, r, t); drawSpecial(f.top, c, r); this.drawFloorDetails(ctx,cam,c,r,0,time); }); continue; }
        const p = D3.tile(ctx, cam, c, r, floorColor(c, r, t)); floorPattern(p, c, r, t);
        this.drawFloorDetails(ctx,cam,c,r,0,time);
        if (t === T_BRIDGE) { ctx.strokeStyle = 'rgba(60,30,10,0.45)'; ctx.lineWidth = 1; for (let k = 1; k < 4; k++) { const a = D3.onQuad(p, 0, k / 4), b = D3.onQuad(p, 1, k / 4); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
        drawSpecial(p, c, r);
      }
      // flaques de miel : au-dessus du sol, sous les objets
      for (const q of this.puddles) push(q.r + 0.03, q.c + 0.5, () => { const slime=q.kind==='toadSlime', z = slime?q.z:gz(q.c + 0.5, q.r + 0.5), pr = cam.project(q.c + 0.5, q.r + 0.5, z), k = pr.k, a = Math.min(1, (q.dur - q.t) / 2) * Math.min(1, q.t * 4); ctx.save(); ctx.globalAlpha = 0.85 * a; const sp = Math.min(1, q.t * 3); ctx.fillStyle = slime?'#51832c':'#e8961e'; ctx.beginPath(); ctx.ellipse(pr.x, pr.y, k * 0.44 * sp, k * 0.25 * sp, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = slime?'#a6d653':'#f7b53a'; ctx.beginPath(); ctx.ellipse(pr.x - k * 0.04, pr.y - k * 0.03, k * 0.34 * sp, k * 0.17 * sp, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,240,200,0.6)'; ctx.beginPath(); ctx.ellipse(pr.x - k * 0.12, pr.y - k * 0.08, k * 0.1 * sp, k * 0.04 * sp, -0.4, 0, Math.PI * 2); ctx.fill(); for (let i = 0; i < 3; i++) { const bb = ((time * 0.5 + i * 0.33 + q.c * 0.1) % 1); ctx.strokeStyle = 'rgba(255,230,160,' + (0.6 * (1 - bb)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(pr.x + Math.cos(i * 2.1) * k * 0.2, pr.y + Math.sin(i * 2.1) * k * 0.1, k * (0.02 + bb * 0.06), 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); });
      // ondes de choc du golem
      if (this.quakes) for (const q of this.quakes) if (q.t > 0) { const u = q.t / 0.45; const p = D3.tile(ctx, cam, q.c, q.r, 'rgba(255,200,80,' + (0.6 * (1 - u)) + ')'); void p; }
      if (this.rocks) for (const rk of this.rocks) { if (rk.t < rk.dur) { const u = rk.t / rk.dur; D3.shadow(ctx, cam, rk.x, rk.y, 0.2 + 0.4 * u, 0.25 + 0.3 * u); } }
      // blocs, décors et objets de la carte
      for (let r = rmin; r <= rmax; r++) for (let c = cmin; c <= cmax; c++) {
        const v = this.cells[this.idx(c, r)]; if (!v) continue;
        const edge = c === 0 || r === 0 || c === this.cols - 1 || r === this.rows - 1, z = this.explore ? this.height[this.idx(c, r)] : 0;
        const sp = this.explore ? this.special.get(c + ',' + r) : null;
        push(['chair','stool'].includes(this.deco[this.idx(c,r)])?r+.25:r+1, c + 0.5, () => {
          if (this.explore && this.deco[this.idx(c, r)] === 'counter') { const same = (cc, rr) => this.inside(cc, rr) && this.deco[this.idx(cc, rr)] === 'counter'; const f = D3.cube(ctx, cam, c + (same(c - 1, r) ? 0 : 0.08), r + 0.15, c + 1 - (same(c + 1, r) ? 0 : 0.08), r + 0.85, 0.62, { top: '#c98f4f', front: '#8a5a2a', side: '#6b4a2a' }, { z, faces: { east: !same(c + 1, r), west: !same(c - 1, r) }, outline: 'rgba(0,0,0,0.25)' }); const a = D3.onQuad(f.front, 0, 0.5), b = D3.onQuad(f.front, 1, 0.5); ctx.strokeStyle = 'rgba(255,230,160,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); return; }
          const dk0 = this.explore ? this.deco[this.idx(c, r)] : null;
          if (dk0 === 'mountainpart' || dk0 === 'volcanopart') return;
          if (dk0 === 'mountain') { this.drawMountain(ctx, cam, c, r, z, time); return; }
          if (dk0 === 'volcano') { this.drawVolcano(ctx, cam, c, r, z, time); return; }
          if (this.explore && this.deco[this.idx(c, r)]) { const kind = this.deco[this.idx(c, r)], pr = cam.project(c + 0.5, r + 0.5, z); const same = (cc, rr) => this.inside(cc, rr) && this.deco[this.idx(cc, rr)] === kind; const gt = this.growT.get(this.idx(c, r)); let bt = this.bounceT.get(this.idx(c, r)); if (gt != null) { const u = Math.min(1, gt / 0.6), e2 = 1 + 2.2 * Math.pow(u - 1, 3) + 1.2 * Math.pow(u - 1, 2), sc = Math.max(0.02, e2); ctx.save(); ctx.translate(pr.x, pr.y); ctx.scale(sc * (1 + 0.15 * Math.sin(u * Math.PI)), sc); ctx.translate(-pr.x, -pr.y); bt = 0; } else if (bt) { const q = Math.sin(Math.PI * bt / 0.45) * 0.28; ctx.save(); ctx.translate(pr.x, pr.y); ctx.scale(1 + q, 1 - q); ctx.translate(-pr.x, -pr.y); } BK.sprites.drawDeco(ctx, kind, pr.x, pr.y, pr.k, time, { n: same(c, r - 1), s: same(c, r + 1), e: same(c + 1, r), w: same(c - 1, r) }, c * 17 + r * 5, this.props[c+','+r]?.orientation||0, this.props[c+','+r]?.lightColor, this.props[c+','+r]); if (bt || gt != null) ctx.restore(); return; }
          if (v === METAL) { BK.sprites.drawMetal(ctx, cam, c, r, z, this.metal[this.idx(c, r)]); return; }
          if (v === BARREL) { const pr = cam.project(c + 0.5, r + 0.5, z); BK.sprites.drawBarrel(ctx, pr.x, pr.y, pr.k, time); return; }
          if (v === SEALED) { const pr = cam.project(c + 0.5, r + 1, z); D3.cube(ctx, cam, c + 0.02, r + 0.02, c + 0.98, r + 0.98, 1.0, { top: '#6a5a8a', front: '#4a3a6a', side: '#2e2345' }, { outline: 'rgba(0,0,0,0.3)' }); BK.sprites.drawRune(ctx, pr.x, pr.y - pr.k * 0.45, pr.k * 0.28, time); return; }
          if (v === TARGET) { const tg = Object.values(this.targets).find(t => t.c === c && t.r === r); const pr = cam.project(c + 0.5, r + 0.5, z); BK.sprites.drawTarget(ctx, pr.x, pr.y, pr.k, tg && tg.hit, time, BK.targetColor(tg && tg.letter)); return; }
          if (v === GATE) {
            if (sp && sp.bridge) D3.cube(ctx, cam, c + 0.08, r + 0.08, c + 0.92, r + 0.92, 1.1, { top: '#c9a24a', front: '#a0703a', side: '#7a5228' }, { bricks: 'rgba(60,30,10,0.5)', rows: 4, cols: 1, outline: 'rgba(0,0,0,0.3)' });
            else { D3.cube(ctx, cam, c + 0.02, r + 0.02, c + 0.98, r + 0.98, 1.0, { top: '#9aa3ad', front: '#5a6270', side: '#3e454f' }, { outline: 'rgba(0,0,0,0.3)' }); const q = cam.project(c + 0.5, r + 1, z), top = cam.project(c + 0.5, r + 1, z + 1); ctx.strokeStyle = '#cfd6de'; ctx.lineWidth = Math.max(1.5, q.k * 0.05); for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(q.x + k * q.k * 0.17, q.y); ctx.lineTo(top.x + k * q.k * 0.17, top.y); ctx.stroke(); } }
            // emblème de la couleur de la cible qui l'ouvre
            const em = cam.project(c + 0.5, r + 1, z + (sp && sp.bridge ? 0.75 : 0.62)); ctx.fillStyle = BK.targetColor(sp && sp.letter); ctx.beginPath(); ctx.arc(em.x, em.y, em.k * 0.17, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = Math.max(1.5, em.k * 0.04); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(em.x - em.k * 0.05, em.y - em.k * 0.06, em.k * 0.06, 0, Math.PI * 2); ctx.fill();
            return;
          }
          if (this.explore && v === HARD && this.trees.some(t => t.c === c && t.r === r)) { const pr = cam.project(c + 0.5, r + 0.5, z); BK.sprites.drawTree(ctx, pr.x, pr.y, pr.k, time, this.props[c + ',' + r]); return; }
          if (this.explore && v === HARD && this.rocks.some(t => t.c === c && t.r === r)) { const pr = cam.project(c + 0.5, r + 0.5, z); BK.sprites.drawRock(ctx, pr.x, pr.y, pr.k, c * 13 + r * 3); return; }
          if (sp && sp.type === 'brick') { D3.cube(ctx, cam, c + 0.02, r + 0.02, c + 0.98, r + 0.98, 0.9, { top: T.hardTop, front: T.hard, side: T.hardDark }, { z, bricks: 'rgba(60,20,10,0.5)', outline: 'rgba(0,0,0,0.25)' }); this.drawWallDeco(ctx,cam,c,r,z,time); return; }   // mur de briques (se casse)
          if (this.explore && v === SOFT) { const pr = cam.project(c + 0.5, r + 0.5, z); BK.sprites.drawBush(ctx, pr.x, pr.y, pr.k, T.bush || T.soft, c * 7 + r); return; }
          if (v === HARD) {
            if (sp && sp.type === 'brick') D3.cube(ctx, cam, c + 0.02, r + 0.02, c + 0.98, r + 0.98, 0.9, { top: T.hardTop, front: T.hard, side: T.hardDark }, { z, bricks: 'rgba(60,20,10,0.5)', outline: 'rgba(0,0,0,0.25)' });
            else if (this.explore) D3.cube(ctx, cam, c + 0.04, r + 0.04, c + 0.96, r + 0.96, 0.85, { top: T.rockTop || T.hardTop, front: T.rock || T.hard, side: T.rockDark || T.hardDark }, { z, topInset: D3.shade(T.rockTop || T.hardTop, 0.9), outline: 'rgba(0,0,0,0.22)' });
            else D3.cube(ctx, cam, c + 0.02, r + 0.02, c + 0.98, r + 0.98, edge ? 1.0 : 0.9, { top: T.hardTop, front: T.hard, side: T.hardDark }, { z, topInset: D3.shade(T.hardTop, 0.93), outline: 'rgba(0,0,0,0.18)' });
          }
          if(v===HARD) this.drawWallDeco(ctx,cam,c,r,z,time);
          else D3.cube(ctx, cam, c + 0.06, r + 0.06, c + 0.94, r + 0.94, 0.86, { top: D3.shade(T.soft, 1.2), front: T.soft, side: D3.shade(T.soft, 0.75) }, { z, bricks: T.softMortar, outline: 'rgba(0,0,0,0.2)' });
        });
      }
      // boîte aux lettres renversée : elle bascule, le bois brisé reste au sol, puis tout s'efface
      for (const d of this.debris) push(d.r + 1, d.c + 0.5, () => {
        const z = gz(d.c + 0.5, d.r + 0.5), pr = cam.project(d.c + 0.5, d.r + 0.5, z), k = pr.k, fall = Math.min(1, d.t / 0.45), a = 1 - Math.max(0, (d.t - 0.6) / (d.dur - 0.6));
        ctx.save(); ctx.globalAlpha = a; ctx.translate(pr.x, pr.y);
        ctx.fillStyle = '#8a5a2a'; for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate((i - 1.5) * k * 0.18 * d.dir, k * 0.02 + (i % 2) * k * 0.05); ctx.rotate(i * 0.9 - 0.6); ctx.fillRect(-k * 0.14, -k * 0.025, k * 0.28, k * 0.05); ctx.restore(); }
        ctx.rotate(d.dir * fall * fall * Math.PI / 2 * 0.92); ctx.translate(0, Math.sin(fall * Math.PI) * -k * 0.05);
        if(d.kind==='tree') BK.sprites.drawTree(ctx,0,0,k,time,d.props); else BK.sprites.drawDeco(ctx,d.kind,0,0,k,time,null,d.c*17+d.r*5); ctx.restore();
      });
      for (const f of this.falling) push(f.r + 1, f.c + 0.5, () => { D3.shadow(ctx, cam, f.c + 0.5, f.r + 0.5, 0.45 * Math.max(0.3, 1 - f.z / 7), 0.35); D3.cube(ctx, cam, f.c + 0.02, f.r + 0.02, f.c + 0.98, f.r + 0.98, 0.9, { top: T.hardTop, front: T.hard, side: T.hardDark }, { z: f.z, outline: 'rgba(0,0,0,0.18)' }); });
      const gz = (x, y) => this.explore ? this.groundZ(x, y) : 0;
      for (const it of this.items) push(it.cy + 0.5, it.cx + 0.5, () => {
        const fu = it.from ? Math.min(1, (time - it.born) / (it.flyDur || 0.4)) : 1, ix = it.from ? it.from.x + (it.cx + 0.5 - it.from.x) * fu : it.cx + 0.5, iy = it.from ? it.from.y + (it.cy + 0.5 - it.from.y) * fu : it.cy + 0.5;
        const z = gz(ix, iy), pr = cam.project(ix, iy, z + (it.from ? Math.sin(Math.PI * fu) * 0.9 : 0)); D3.shadow(ctx, cam, ix, iy, 0.22 * (it.from ? 0.6 + 0.4 * fu : 1), 0.2, z); ctx.save(); ctx.translate(pr.x, pr.y); if (it.from && fu < 1) ctx.rotate(Math.sin(fu * Math.PI * 2) * 0.5); BK.sprites.drawItem(ctx, it.type, pr.k, it.t, it.value); ctx.restore();
      });
      for(const bar of this.firebars)for(const q of this.firebarPoints(bar))push(q.y,q.x,()=>BK.sprites.drawFlame(ctx,cam,q.x-.5,q.y-.5,.45+Math.sin(time*9+q.x)*.1,'center',0,time+q.y,q.z,false));
      for (const f of this.flames) if(!f.domeHeight || !f.bomb?.dome || f.bomb.giga) push(f.cy + 0.5, f.cx + 0.5, () => BK.sprites.drawFlame(ctx, cam, f.cx, f.cy, f.t / (f.duration||BK.FLAME_TIME), f.kind, f.dir, f.seed, gz(f.cx + 0.5, f.cy + 0.5), f.magic, f.level, f.domeHeight));
      for (const sp of this.sparks) push(sp.r + 0.5, sp.c + 0.5, () => { const pr = cam.project(sp.c + 0.5, sp.r + 0.5, gz(sp.c + 0.5, sp.r + 0.5)); ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.arc(pr.x, pr.y - pr.k * 0.1, pr.k * (0.1 + 0.04 * Math.sin(time * 40)), 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ffb03a'; ctx.lineWidth = 2; for (let k = 0; k < 5; k++) { const a = time * 30 + k * 1.3, l = pr.k * (0.15 + 0.1 * Math.sin(time * 25 + k)); ctx.beginPath(); ctx.moveTo(pr.x, pr.y - pr.k * 0.1); ctx.lineTo(pr.x + Math.cos(a) * l, pr.y - pr.k * 0.1 + Math.sin(a) * l * 0.6); ctx.stroke(); } });
      for (const b of this.bombs) if (b.state !== 'carried') push(b.y + (b.state === 'flying' ? Math.max(0, b.z) * 0.9 : 0) + (this.elevAt(Math.floor(b.x),Math.floor(b.y))&&!b.underElevator ? .015 : 0), b.x, () => {
        const Eb = this.elevators.length && b.state !== 'flying' ? this.elevAt(Math.floor(b.x), Math.floor(b.y)) : null, z0 = b.underElevator ? b.underElevator.base : gz(b.x, b.y), zb = b.state === 'flying' ? b.z : z0 + b.z, pr = cam.project(b.x, b.y, z0), top = cam.project(b.x, b.y, zb);
        D3.shadow(ctx, cam, b.x, b.y, 0.3 * Math.max(0.4, 1 - (zb - z0) / 3), 0.3, z0);
        if (b.rock) BK.sprites.drawRock(ctx, top.x, top.y - pr.k * 0.3, pr.k, { cracked: b.uses < 2 }); else { const bs = pr.k * 0.34 * (b.big ? 1.3 : 1); BK.sprites.drawBomb(ctx, top.x, top.y - bs, bs, { level:b.level, giga:b.giga, inflation:b.inflation, gift:b.gift, t: time - b.born, fuse: Math.max(0, b.t / BK.BOMB_FUSE) }); }
      });
      for (const E of this.elevators) push(E.r + 0.5, E.c + 0.5, () => drawElevatorSlab(E));
      for (const M of this.movers) push(M.y, M.x, () => {   // plateau glissant : dalle métal, bandes jaunes et noires, petite lueur dessous
        const top = M.top, f = D3.cube(ctx, cam, M.x - 0.47, M.y - 0.47, M.x + 0.47, M.y + 0.47, 0.14, { top: this.theme.castleFloor?'#d1bf9a':'#aab3bd', front: this.theme.castleFloor?'#806b4c':'#5a616a', side: this.theme.castleFloor?'#67553e':'#4a515a' }, { z: top - 0.14, outline: 'rgba(0,0,0,0.3)' });
        const q = f.top; ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = Math.max(1.5, cam.scaleAt(M.x, M.y) * 0.04); ctx.beginPath(); for (const [u, v] of [[0.06, 0.06], [0.94, 0.06], [0.94, 0.94], [0.06, 0.94], [0.06, 0.06]]) { const o = D3.onQuad(q, u, v); if (u === 0.06 && v === 0.06 && ctx.lineWidth) ctx.moveTo(o.x, o.y); else ctx.lineTo(o.x, o.y); } ctx.stroke();
        ctx.fillStyle = '#5a616a'; for (const [u, v] of [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8]]) { const o = D3.onQuad(q, u, v); ctx.beginPath(); ctx.arc(o.x, o.y, 2.2, 0, Math.PI * 2); ctx.fill(); }
        if (f.front) { ctx.fillStyle = this.theme.castleFloor?'#c2a268':'#1b1b1b'; for (let k = 0; k < 5; k += 2) { const a = D3.onQuad(f.front, k / 5, 0), b = D3.onQuad(f.front, (k + 1) / 5, 0), c2 = D3.onQuad(f.front, (k + 1) / 5, 1), d = D3.onQuad(f.front, k / 5, 1); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill(); } }
        const g0 = cam.project(M.x, M.y, M.base), rg = ctx.createRadialGradient(g0.x, g0.y, 0, g0.x, g0.y, g0.k * 0.6); rg.addColorStop(0, 'rgba(140,200,255,0.35)'); rg.addColorStop(1, 'rgba(140,200,255,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(g0.x, g0.y, g0.k * 0.6, g0.k * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      });
      for (const e of this.enemies) push(e.y, e.x, () => {
        if(e.carrier) return;
        const z0 = gz(e.x, e.y), pr = cam.project(e.x, e.y, z0), top = cam.project(e.x, e.y, z0 + (e.z || 0));
        if (!e.dead) D3.shadow(ctx, cam, e.x, e.y, (e.def.hitR || e.r) * 0.95 * Math.max(0.5, 1 - (e.z || 0) / 3), 0.3, z0);
        ctx.save(); ctx.translate(top.x, top.y);
        if (e.dead) { const u = e.deadT / 1.2; ctx.globalAlpha = Math.max(0, 1 - u); ctx.translate(0, -u * pr.k * 0.8); ctx.rotate(u * 3); }
        BK.sprites.drawEnemy(ctx, e.type, { creature:e, charged:e.charged, warning:!!e.warning, swallowed:!!e.swallowed,bellyFill:e.bellyFill,bellyKick:e.bellyKick,bellySide:e.bellySide,toadAttack:e.toadAttack?.kind,inferno:e.arenaBoss&&e.phase===2, s: pr.k * (e.def.hitR ? e.def.hitR / e.r : 1), t: e.t, hurt: e.hurt, flip: e.flip || e.dir === 1, charging: e.state === 'charge', squash: e.squash, stomp: e.stomp, aim: e.aim, recoil: e.recoil, swell: e.swell, state: e.state, shell: e.shell, shellColor:e.shellColor, baby:e.baby,growth:e.growth, mouth: e.mouth, charge: e.charge, water: this.explore && this.tAt(Math.floor(e.x), Math.floor(e.y)) === T_WATER, wind: e.wind, cast: e.cast, up: e.up, bone: !!e.bone, throwT: e.throwT, swing: e.swing, tame: e.tame, heal: e.heal, run: e.run, chasing: e.state === 'chase' || e.state === 'return' });
        ctx.restore();
        if(e.stunT>0&&!e.dead){ctx.save();ctx.font='bold '+Math.round(pr.k*.3)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';for(let i=0;i<4;i++){const a=time*5+i*Math.PI/2,sx=top.x+Math.cos(a)*pr.k*.55,sy=top.y-pr.k*1.15+Math.sin(a)*pr.k*.16;ctx.fillStyle=i%2?'#ffe36b':'#fff6c2';ctx.strokeStyle='#5b3d1a';ctx.lineWidth=2;ctx.strokeText('★',sx,sy);ctx.fillText('★',sx,sy);}ctx.restore();}
        if(e.arenaBoss&&!e.dead){ctx.save();ctx.textAlign='center';ctx.font='bold 15px Nunito';ctx.fillStyle='#fff3aa';ctx.strokeStyle='#302236';ctx.lineWidth=4;const label=e.state==='sealed'?'🔒 Bats les deux crapauds':e.state==='transform'?'🔥 Transformation !':e.attack?({fire:'🔥 Souffle de feu !',anvils:'⚠ Enclumes !',bomb:'💣 Bombe !',wave:'⚠ Onde de choc !'}[e.attack.kind]):'';ctx.strokeText(label,top.x,top.y-pr.k*3.5);ctx.fillText(label,top.x,top.y-pr.k*3.5);ctx.restore();}
        if (e.boss && !e.dead && !e.arenaBoss) { // petites barres des gardiens et autres monstres
          const w = e.arenaGuard?Math.max(38,Math.min(70,pr.k*1.3)):pr.k * 1.6, x = top.x - w / 2, y = top.y - pr.k * (e.type === 'golem' ? 3.3 : 2.4);
          ctx.fillStyle = 'rgba(0,0,0,0.5)'; BK.sprites.rr(ctx, x - 2, y - 2, w + 4, 10, 4); ctx.fill();
          ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#49e26a' : e.hp / e.maxHp > 0.25 ? '#ffb03a' : '#ff4040'; BK.sprites.rr(ctx, x, y, w * e.hp / e.maxHp, 6, 3); ctx.fill();
        }
      });
      if (this.exit && this.exit.kind !== 'door' && !this.exit.hidden) { const ex = this.exit; push(ex.r + 0.5, ex.c + 0.5, () => {
        const z0 = gz(ex.x, ex.y);
        if (ex.kind === 'portal') { const pr = cam.project(ex.x, ex.y, z0); BK.sprites.drawPortal(ctx, pr.x, pr.y, pr.k, time, ex.open, ex.boost || 0); }
        else {
          const tk = ex.taken || 0, zf = z0 + 0.55 + 0.1 * Math.sin(time * 2) + tk * tk * 2.2, pr = cam.project(ex.x, ex.y, zf), gp = cam.project(ex.x, ex.y, z0);
          if (tk < 1) { D3.shadow(ctx, cam, ex.x, ex.y, 0.4 * Math.max(0.3, 1 - tk), 0.35, z0); BK.sprites.drawDiamond(ctx, pr.x, pr.y, gp.k * (0.72 + tk * 0.5), time * (1 + tk * 6), { open: ex.open, rays: ex.open, alpha: 1 - Math.max(0, tk - 0.8) * 5 }); }
        }
      }); }
      for (const s of this.shots) { if (s.dead) continue; push(s.y, s.x, () => { const z0 = gz(s.x, s.y), pr = cam.project(s.x, s.y, z0 + s.z); D3.shadow(ctx, cam, s.x, s.y, s.r * 0.8, 0.3, z0); ctx.save(); ctx.translate(pr.x, pr.y); BK.sprites.drawShot(ctx, s, pr.k, time); ctx.restore(); }); }
      for (const d of (this.displays || []).filter(d=>!d.ally)) push(this.deco[this.idx(d.c, d.r)] === 'counter' ? d.r + 1.01 : d.r + 0.5, d.c + 0.5, () => {   // sur un comptoir : dessiné après le meuble, sinon il serait caché dessous
        const z = gz(d.c + 0.5, d.r + 0.5), pr = cam.project(d.c + 0.5, d.r + 0.5, z), k = pr.k, on = d.active;
        const onCounter = this.deco[this.idx(d.c, d.r)] === 'counter', zt = z + (onCounter ? 0.62 : 0);   // posé sur le comptoir, sinon à terre (sans socle)
        const top = cam.project(d.c + 0.5, d.r + 0.5, zt); if (on) { ctx.fillStyle = 'rgba(255,227,107,0.35)'; ctx.beginPath(); ctx.ellipse(top.x, top.y, k * 0.3, k * 0.14, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.font = Math.round(k * 0.5) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = d.soldOut ? 0.4 : 1; ctx.fillText(d.icon, top.x, top.y - k * 0.28 - Math.sin(time * 3 + d.c) * k * 0.03); ctx.globalAlpha = 1;
        ctx.font = 'bold ' + Math.round(k * 0.22) + 'px Nunito, sans-serif'; const label = d.soldOut ? 'Épuisé' : '🪙 ' + d.price + (d.once === false ? ' ∞' : ''), w = BK.sprites.coinWidth(ctx, label) + k * 0.2; ctx.fillStyle = 'rgba(0,0,0,0.6)'; BK.sprites.rr(ctx, top.x - w / 2, top.y - k * 0.88, w, k * 0.28, k * 0.06); ctx.fill(); ctx.fillStyle = d.soldOut ? '#bbb' : d.affordable ? '#ffd54a' : '#ff8a80'; BK.sprites.textWithCoin(ctx, label, top.x, top.y - k * 0.74);
      });
      for (const f of this.fishes) push(f.y, f.x, () => { const z0 = gz(f.x, f.y), pr = cam.project(f.x, f.y, z0 + f.z); D3.shadow(ctx, cam, f.x, f.y, 0.2, 0.25, z0); if (f.kind === 'carrot') BK.sprites.drawCarrot(ctx, pr.x, pr.y, pr.k * 0.9, f.t * 12); else BK.sprites.drawFish(ctx, pr.x, pr.y, pr.k * 0.9, (f.x1 - f.x0 < 0 ? Math.PI : 0) + Math.sin(f.t * 20) * 0.3); });
      for(const fire of this.campfires) if(fire.remaining!=null) push(fire.r+1.05,fire.c+.5,()=>{
        const pr=cam.project(fire.c+.5,fire.r+.5,this.hAt(fire.c,fire.r)+1.15),text='🔥 '+Math.ceil(fire.remaining)+' s';
        ctx.save();ctx.font='bold '+Math.max(12,Math.round(pr.k*.22))+'px Nunito,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';const w=ctx.measureText(text).width+14;ctx.fillStyle='rgba(30,22,15,.85)';BK.sprites.rr(ctx,pr.x-w/2,pr.y-13,w,26,7);ctx.fill();ctx.fillStyle='#ffe4a1';ctx.fillText(text,pr.x,pr.y);ctx.restore();
      });
      for (const fire of this.campfires) if (fire.cook) push(fire.r + 0.6, fire.c + 0.5, () => {   // poisson sur le feu et barre de cuisson
        const z = this.hAt(fire.c, fire.r), pr = cam.project(fire.c + 0.5, fire.r + 0.5, z + 0.55), k = pr.k, u = Math.min(1, fire.cook.t / fire.cook.dur);
        ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(1.5, k * 0.03); ctx.beginPath(); ctx.moveTo(pr.x - k * 0.45, pr.y + k * 0.25); ctx.lineTo(pr.x + k * 0.45, pr.y + k * 0.25); ctx.stroke();
        if (['meatcooked','poultrycooked'].includes(fire.cook.output)) BK.sprites.drawMeat(ctx,pr.x,pr.y+k*0.2,k*0.8,u>0.55); else BK.sprites.drawFish(ctx, pr.x, pr.y + k * 0.2 + Math.sin(time * 12) * k * 0.01, k * 0.8, 0, u > 0.55); 
        const bw = k * 0.9, bx = pr.x - bw / 2, by = pr.y - k * 0.45; ctx.fillStyle = 'rgba(0,0,0,0.55)'; BK.sprites.rr(ctx, bx - 2, by - 2, bw + 4, k * 0.16 + 4, k * 0.05); ctx.fill(); ctx.fillStyle = '#ff8a1f'; BK.sprites.rr(ctx, bx, by, bw * u, k * 0.16, k * 0.04); ctx.fill();
        ctx.font = 'bold ' + Math.round(k * 0.2) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('🍖 ' + Math.ceil(fire.cook.dur - fire.cook.t) + ' s · '+fire.cook.left+' restante'+(fire.cook.left>1?'s':''), pr.x, by - k * 0.16);
      });
      for (const p of this.players) if (p.fishing && p.alive) push(p.y + 0.01, p.x, () => this.drawFishing(ctx, cam, p, time));
      for(const b of this.boats) if(!b.rider) push(b.y+.1,b.x,()=>{const pr=cam.project(b.x,b.y,0);BK.sprites.drawBoat(ctx,pr.x,pr.y,pr.k,b.dir,b.rowT,false);BK.sprites.drawBoat(ctx,pr.x,pr.y,pr.k,b.dir,b.rowT,true);});
      for (const d of this.doors) push(d.r + 1.02, d.c + 0.5, () => BK.sprites.drawHouse(ctx, cam, d.c, d.r, time, this.explore ? this.groundZ(d.c + 0.5, d.r + 0.5) : 0, this.houses[d.c + ',' + d.r]));
      for (const p of this.players) push(p.seat ? p.seat.r + 0.5 + (p.dir === 2 ? -0.3 : 0.3) : p.y, p.x, () => {   // assis : devant la chaise (dos au dossier) ou derrière quand il regarde au loin
        if(p.swallowedBy)return;
        if(p.boat && p.boat.rider!==p)return;
        if (!p.alive && p.deadT > 1.3) return;
        if (p.falling) { this.drawFalling(ctx, cam, p, time); return; }
        const zg = gz(p.x, p.y), seatLift=p.seat?Math.max(0,(p.seat.kind==='stool'?.38:.5)-(.8+.7*(p.def.size||1))*.17):0, z0 = zg + (p.zOff || 0)+seatLift, pr = cam.project(p.x, p.y, z0);
        if (p.alive && p.campGlow > 0) {   // feu de camp : halo rouge qui flashe autour du héros
          const g0 = cam.project(p.x, p.y, zg), a = p.campGlow * (0.3 + 0.3 * Math.max(0, Math.sin(time * 7))), R = g0.k * 0.75;
          const rg = ctx.createRadialGradient(g0.x, g0.y, R * 0.2, g0.x, g0.y, R); rg.addColorStop(0, 'rgba(255,70,70,' + a + ')'); rg.addColorStop(0.7, 'rgba(255,50,60,' + (a * 0.5) + ')'); rg.addColorStop(1, 'rgba(255,40,40,0)');
          ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(g0.x, g0.y, R, R * 0.55, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(255,90,90,' + (a * 1.2) + ')'; ctx.lineWidth = Math.max(1.5, g0.k * 0.05); ctx.beginPath(); ctx.ellipse(g0.x, g0.y, R * (0.75 + 0.1 * Math.sin(time * 7)), R * 0.55 * (0.75 + 0.1 * Math.sin(time * 7)), 0, 0, Math.PI * 2); ctx.stroke();
        }
        if (p.alive) D3.shadow(ctx, cam, p.x, p.y, (0.3 * (p.def.size || 1) + 0.1) * (p.sizeScale||1) * Math.max(0.45, 1 - (p.zOff || 0) / 2.5), 0.3, p.onBomb ? zg + 0.55 : zg);
        if(p.boat){
          const crew=(p.boat.passengers||[]).filter(q=>q.alive),size=pr.k*(crew.length?1.35:1);
          BK.sprites.drawBoat(ctx,pr.x,pr.y,size,p.dir,p.boat.rowT,false);
          crew.slice(0,4).forEach((q,i)=>{ctx.save();ctx.translate(pr.x+pr.k*(i%2? .36:-.36),pr.y-pr.k*(.12+Math.floor(i/2)*.18));BK.sprites.drawCharacter(ctx,q.def,{s:pr.k*.48,pose:'idle',t:time,view:'front'});ctx.restore();});
          if(crew.length){ctx.save();ctx.font='bold '+Math.round(pr.k*.18)+'px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='#29485f';ctx.lineWidth=3;const label='🤝 '+crew.length+' allié'+(crew.length>1?'s':'')+' à bord';ctx.strokeText(label,pr.x,pr.y+pr.k*.65);ctx.fillText(label,pr.x,pr.y+pr.k*.65);ctx.restore();}
        }
        ctx.save(); ctx.translate(pr.x, pr.y+(p.boat?pr.k*.16:0));ctx.scale(p.sizeScale||1,p.sizeScale||1);
        if (p.vanish) { const u = Math.min(1, p.vanish.t / p.vanish.dur); if (u >= 1) { ctx.restore(); return; } ctx.globalAlpha = 1 - u; ctx.rotate(u * 7); ctx.scale(1 - u * 0.92, 1 - u * 0.92); }
        if (p.invuln > 0 && p.alive && Math.floor(p.animT * 18) % 2) ctx.globalAlpha = 0.45;
        const view = p.dir === 0 ? 'front' : p.dir === 2 ? 'back' : 'side';
        const b = p.carrying;
        BK.sprites.drawCharacter(ctx, p.def, { s: pr.k, pose: p.seat?'sit':p.pose, t: p.animT, poseT: p.poseT, view, flip: p.dir === 1, walk: p.walk, jolt: !!(p.fishing && p.fishing.bit && !p.fishing.caught), carrying: !!b, rock: !!(b && b.rock), rockCracked: !!(b && b.rock && b.uses < 2), bombLevel:b?.level, bombGiga:b?.giga, bombInflation:b?.inflation, bombGift:b?.gift, bombT: b ? time - b.born : 0, bombFuse: b ? Math.max(0, b.t / BK.BOMB_FUSE) : 1 });
        if (p.axeUntil > this.time) { ctx.save();ctx.translate(pr.k*(p.dir===1?-0.35:0.35),-pr.k*0.65);ctx.rotate((p.dir===1?-1:1)*(0.8-(p.axeUntil-this.time)*3));BK.sprites.drawAxe(ctx,0,0,pr.k*0.8);ctx.restore(); }
        if (BK.wearsLantern(p) && p.alive && !p.falling) BK.sprites.drawLantern(ctx, pr.k * 0.3 * (p.dir === 1 ? -1 : 1), -pr.k * 0.42, pr.k, this.lanternOn(p), time, p.dir === 2);
        if (p.frozen > 0 && p.alive) { const H = pr.k * (0.8 + 0.7 * (p.def.size || 1)); ctx.globalAlpha = 0.55; ctx.fillStyle = '#bfefff'; BK.sprites.rr(ctx, -pr.k * 0.4, -H * 1.08, pr.k * 0.8, H * 1.12, pr.k * 0.12); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-pr.k * 0.3, -H * 1.0, pr.k * 0.07, H * 0.55); }
        if (p.shield > 0 && p.alive) { ctx.strokeStyle = 'rgba(180,140,240,' + (0.5 + 0.3 * Math.sin(time * 8)) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -pr.k * 0.55, pr.k * 0.55, pr.k * 0.7, 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.restore();
        if(p.boat)BK.sprites.drawBoat(ctx,pr.x,pr.y,pr.k*((p.boat.passengers||[]).some(q=>q.alive)?1.35:1),p.dir,p.boat.rowT,true);
        if(p.human&&!p.npc&&!p.ally&&p.alive&&(p.seat||this.nearbySeat(p)))bubbles.push({x:pr.x,y:pr.y,k:pr.k,text:p.seat?'⏎ Se lever':'⏎ S’asseoir',a:1,sign:true});
        else if(p.boat && this.boatLanding(p))bubbles.push({x:pr.x,y:pr.y,k:pr.k,text:'⏎ Débarquer',a:1,sign:true});
        else if(this.nearbyBoat(p))bubbles.push({x:pr.x,y:pr.y,k:pr.k,text:'⏎ Embarquer',a:1,sign:true});
        const care=this.allyCareNeeds(p);
        const bombNotice=p.ally&&p.alive&&!p.falling&&p.bombBubble?.until>this.time;
        if(bombNotice)bubbles.push({x:pr.x,y:pr.y,k:pr.k,text:p.bombBubble.text,a:Math.min(1,(p.bombBubble.until-this.time)*3),bombNotice:p.bombBubble.kind,careOffset:care.length?58:0,size:p.def.size||1});
        if(care.length)care.forEach((type,i)=>bubbles.push({x:pr.x+(i-(care.length-1)/2)*64,anchorX:pr.x,y:pr.y,k:pr.k,allyFood:p,careType:type}));
        else if(p.ally && !bombNotice && this.nearHuman(p)) bubbles.push({x:pr.x,y:pr.y,k:pr.k,text:p.name+' · ♥ '+Math.ceil(p.hp)+'/'+p.maxHp+' · '+p.lives+' vies',a:1});
        if (p.npc && !care.length && p.sayT > 0 && (!p.recruit || this.nearHuman(p))) bubbles.push({ x: pr.x, y: pr.y, k: pr.k, text: p.say, a: Math.min(1, p.sayT * 2) });
        if(p.human&&this.nearbyTerrarium(p)) bubbles.push({x:pr.x,y:pr.y,k:pr.k,text:'🐌 Terrarium',a:1,sign:true});
        if(p.sizeT>0&&p.alive){ctx.save();ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff3bd';ctx.strokeStyle='#463652';ctx.lineWidth=3;const label=(p.sizeScale<1?'Mini · ':'Géant · ')+Math.ceil(p.sizeT)+' s',y=pr.y-pr.k*1.65*(p.sizeScale||1);ctx.strokeText(label,pr.x,y);ctx.fillText(label,pr.x,y);ctx.restore();}
        if(p.heldSnail) { ctx.save(); ctx.translate(pr.x,pr.y-pr.k*.85); BK.sprites.drawAnimal(ctx,'escargot',{s:pr.k,shell:1,shellColor:p.heldSnail.shellColor,baby:p.heldSnail.baby,growth:p.heldSnail.growth}); ctx.restore(); }
        if (!p.seat && !this.nearbySeat(p) && this.nearbyPet(p) && !p.nearDoor && !p.nearDisplay && !p.nearFire && !p.nearFountain) bubbles.push({ x: pr.x, y: pr.y, k: pr.k, text: '⏎ Caresser', a: 1, sign: true });
        if (!p.seat && !this.nearbySeat(p) && p.nearDoor && p.human && p.alive) bubbles.push({ x: pr.x, y: pr.y, k: pr.k, text: '⏎  Entrer', a: 1, sign: true });
        else if (!p.seat && !this.nearbySeat(p) && p.nearDisplay && p.human && p.alive) bubbles.push({ x: pr.x, y: pr.y, k: pr.k, text: p.nearDisplay.soldOut ? 'Épuisé' : (p.nearDisplay.waiting?'⏎  Soigner / Reprendre':(p.nearDisplay.ally?'⏎  Recruter · 🪙 ':'⏎  Acheter · 🪙 ') + p.nearDisplay.price), a: 1, sign: true, dim: p.nearDisplay.soldOut || !p.nearDisplay.affordable });
        else if (!p.seat && !this.nearbySeat(p) && p.nearFountain && p.human && p.alive && !p.drinkT && p.stamina < p.staminaMax - 0.5) bubbles.push({ x: pr.x, y: pr.y, k: pr.k, text: '⏎  Boire', a: 1, sign: true });
        else if (!p.seat && !this.nearbySeat(p) && p.nearFire && p.human && p.alive && !p.fishing) bubbles.push({ x: pr.x, y: pr.y, k: pr.k, text: '⏎  Cuisiner', a: 1, sign: true });
        if (o.names && p.alive) { ctx.font = 'bold ' + Math.round(pr.k * 0.26) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 3; const ny = pr.y - pr.k * 1.55; ctx.strokeText(p.name, pr.x, ny); ctx.fillStyle = p.color; ctx.fillText(p.name, pr.x, ny); }
      });
      for (const q of this.particles) push(q.y, q.x, () => { const pr = cam.project(q.x, q.y, q.z); ctx.globalAlpha = 1 - q.t / q.life; ctx.fillStyle = q.color; const sz = q.size * pr.k; if (q.ring) { ctx.strokeStyle = q.color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(pr.x, pr.y, sz * 3, sz * 1.3, 0, 0, Math.PI * 2); ctx.stroke(); } else if (q.heart) { const x = pr.x + Math.sin(q.t * 5 + q.x * 7) * sz * 0.35, y = pr.y, s = sz * (0.8 + 0.2 * Math.sin(q.t * 9)); ctx.beginPath(); ctx.moveTo(x, y + s * 0.45); ctx.bezierCurveTo(x - s * 0.95, y - s * 0.25, x - s * 0.5, y - s * 0.8, x, y - s * 0.3); ctx.bezierCurveTo(x + s * 0.5, y - s * 0.8, x + s * 0.95, y - s * 0.25, x, y + s * 0.45); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.stroke(); } else if (q.heavy) ctx.fillRect(pr.x - sz / 2, pr.y - sz / 2, sz, sz); else { ctx.beginPath(); ctx.arc(pr.x, pr.y, sz / 2, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; });
      this.renderArenaEffects(ctx,cam,time,push);
      list.sort((a, b) => a.y - b.y || a.x - b.x);
      for (const d of list) d.fn();
      this.drawSnailNames(ctx,cam);
      ctx.save();ctx.font='20px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      for(const [key,props] of Object.entries(this.props)){if(!this.terrariumHungry(props))continue;const [c,r]=key.split(',').map(Number);if(this.deco[this.idx(c,r)]!=='terrarium')continue;const pr=cam.project(c+.5,r+.5,this.hAt(c,r)),x=pr.x,y=pr.y-pr.k*1.12+Math.sin(time*2)*2;ctx.fillStyle='rgba(255,249,226,.96)';BK.sprites.rr(ctx,x-16,y-16,32,32,12);ctx.fill();ctx.fillText('🥕',x,y);}
      ctx.restore();
      // textes flottants (XP, niveau) au-dessus des têtes
      for (const f of this.floaters) { const u = f.t / f.life, pr = cam.project(f.x, f.y, (this.explore ? this.groundZ(f.x, f.y) : 0) + 1.7 + u * 1.2); ctx.globalAlpha = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3; const sz = Math.round(pr.k * f.size * (f.t < 0.15 ? 1 + (0.15 - f.t) * 4 : 1)); ctx.font = '900 ' + sz + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(20,20,40,0.85)'; ctx.lineWidth = Math.max(2, sz * 0.18); ctx.strokeText(f.text, pr.x, pr.y); ctx.fillStyle = f.color; ctx.fillText(f.text, pr.x, pr.y); ctx.globalAlpha = 1; }
      // bulles de dialogue par-dessus tout le décor
      this.allyFoodRects=[];
      this.signRect = null;   // la pancarte jaune (Entrer, Acheter…) : on peut aussi la toucher du doigt
      for (const b of bubbles) {
        if(b.bombNotice){
          if(b.x<0||b.x>W||b.y<0||b.y>H)continue;
          ctx.save();ctx.globalAlpha=b.a;ctx.font='bold 15px Nunito,sans-serif';
          const w=Math.min(W-16,ctx.measureText(b.text).width+24),h=34,bx=Math.max(8,Math.min(W-w-8,b.x-w/2)),by=Math.max(8,b.y-b.k*(.8+.7*b.size)-h-18-b.careOffset);
          ctx.fillStyle=b.bombNotice==='return'?'#d9f7e5':'#fff0bd';ctx.strokeStyle=b.bombNotice==='return'?'#56b991':'#e5a94a';ctx.lineWidth=2;
          BK.sprites.rr(ctx,bx,by,w,h,12);ctx.fill();ctx.stroke();
          const tip=Math.max(bx+10,Math.min(bx+w-10,b.x));ctx.beginPath();ctx.moveTo(tip-5,by+h);ctx.lineTo(tip,by+h+7);ctx.lineTo(tip+5,by+h);ctx.fill();
          ctx.fillStyle='#263b50';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.text,bx+w/2,by+h/2,w-16);ctx.restore();continue;
        }
        if(b.allyFood){
          if(b.x<0||b.x>W||b.y<0||b.y>H)continue;
          const w=58,h=46,bx=Math.max(8,Math.min(W-w-8,b.x-w/2));let by=b.y-b.k*(.8+.7*(b.allyFood.def.size||1))-h-12;
          if(by<8)continue;
          while(this.allyFoodRects.some(r=>bx<r.x+r.w+4&&bx+w+4>r.x&&by<r.y+r.h+4&&by+h+4>r.y))by-=h+6;
          if(by<8)continue;
          const giver=b.allyFood.npc&&b.allyFood.waitingMember?this.players.find(q=>q.human&&!q.npc&&q.alive&&q.id===b.allyFood.waitingOwner):b.allyFood.leader;
          if(giver)BK.normalizeRemedyBag(giver);
          const careType=b.careType||'food',count=(giver?.inv||[]).reduce((n,s)=>n+((careType==='food'?BK.ALLY_FOOD_HEAL[s.type]:s.type===careType)&&s.n>0?s.n:0),0),available=count>0;
          ctx.save();ctx.fillStyle=!available?'#d0d0d5':b.careType==='antidote'?'#cceff8':'#fff0b5';ctx.strokeStyle=!available?'#92929d':b.careType==='antidote'?'#68abc9':'#efae44';ctx.lineWidth=3;BK.sprites.rr(ctx,bx,by,w,h,15);ctx.fill();ctx.stroke();
          ctx.beginPath();ctx.moveTo(bx+w/2-6,by+h);ctx.lineTo(bx+w/2+6,by+h);ctx.lineTo(Math.max(bx+8,Math.min(bx+w-8,b.anchorX??b.x)),by+h+9);ctx.closePath();ctx.fill();
          ctx.save();if(!available){ctx.globalAlpha=.45;ctx.filter='grayscale(1)';}ctx.font='26px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#593a32';ctx.fillText(careType==='antidote'?'🧪':'🍖',bx+w/2,by+17);ctx.restore();
          ctx.font='900 12px Nunito,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=available?'#47355f':'#656572';ctx.fillText(available?'×'+count:'Vide',bx+w/2,by+36,w-8);ctx.restore();
          this.allyFoodRects.push({x:bx,y:by,w,h,ally:b.allyFood,careType,count,available});continue;
        }
        const k = b.k; ctx.font = 'bold ' + Math.round(k * 0.3) + 'px Nunito, sans-serif'; const w = BK.sprites.coinWidth(ctx, b.text) + k * 0.5, bx = Math.max(8, Math.min(W - w - 8, b.x - w / 2)), by = b.y - k * 2.5 - (b.sign ? Math.sin(time * 4) * k * 0.06 : 0); ctx.globalAlpha = b.a; ctx.fillStyle = b.sign ? (b.dim ? '#c9c2a8' : '#ffd54a') : '#fff'; BK.sprites.rr(ctx, bx, by, w, k * 0.55, k * 0.2); ctx.fill(); ctx.beginPath(); ctx.moveTo(b.x - k * 0.12, by + k * 0.55); ctx.lineTo(b.x + k * 0.12, by + k * 0.55); ctx.lineTo(b.x, by + k * 0.75); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1b2a4a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; BK.sprites.textWithCoin(ctx, b.text, bx + w / 2, by + k * 0.28); ctx.globalAlpha = 1; if (b.sign) this.signRect = { x: bx, y: by, w, h: k * 0.55 }; }
      this.drawPetFood(ctx,cam);
      this.snailRect=null;this.stowSnailRect=null;
      const snailHero=this.players.find(p=>p.human&&p.alive&&(p.heldSnail||this.nearbySnail(p)));
      if(snailHero){const pr=cam.project(snailHero.x,snailHero.y,this.groundZ(snailHero.x,snailHero.y)),label=snailHero.heldSnail?'🐌 Déposer':'🐌 Ramasser';ctx.save();ctx.font='bold 18px Nunito,sans-serif';const w=ctx.measureText(label).width+28,h=46,x=Math.max(8,Math.min(W-w-8,pr.x-w/2)),y=Math.max(8,pr.y-pr.k*1.8);ctx.fillStyle='#ffd54a';BK.sprites.rr(ctx,x,y,w,h,14);ctx.fill();ctx.fillStyle='#1b2a4a';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x+w/2,y+h/2);this.snailRect={x,y,w,h};
        if(snailHero.heldSnail){const label='🎒 Ranger dans le sac',sw=ctx.measureText(label).width+28,sx=Math.max(8,Math.min(W-sw-8,pr.x-sw/2)),sy=y+h+6;ctx.fillStyle='#d4bcff';BK.sprites.rr(ctx,sx,sy,sw,h,14);ctx.fill();ctx.fillStyle='#1b2a4a';ctx.fillText(label,sx+sw/2,sy+h/2);this.stowSnailRect={x:sx,y:sy,w:sw,h};}ctx.restore();}
      this.fuelRect=null;
      const hero=this.players.find(p=>p.human&&!p.npc&&!p.ally&&this.fuelFireNear(p));
      if(hero){const pr=cam.project(hero.x,hero.y,this.groundZ(hero.x,hero.y)),label='🪵 Ajouter du bois (+15 s)';ctx.save();ctx.font='bold '+Math.max(14,Math.round(pr.k*.25))+'px Nunito,sans-serif';const w=ctx.measureText(label).width+24,h=Math.max(44,pr.k*.52),x=Math.max(8,Math.min(W-w-8,pr.x-w/2)),y=Math.max(8,pr.y-pr.k*1.65);ctx.fillStyle='#ffd54a';BK.sprites.rr(ctx,x,y,w,h,12);ctx.fill();ctx.fillStyle='#1b2a4a';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x+w/2,y+h/2);this.fuelRect={x,y,w,h};ctx.restore();}
      ctx.restore();
    }
  }
  BK.World = World; BK.HARD = HARD; BK.SOFT = SOFT; BK.BARREL = BARREL; BK.SEALED = SEALED; BK.METAL = METAL;
})(window.BK);
