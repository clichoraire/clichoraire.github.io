// Clan Gobelin — gobelin articulé en 8 directions (d'après gobelin_mignon_interactif.html), sans contour épais.
// Unités : le personnage fait environ 140 de haut, pieds à l'origine. o.scale ramène à la taille voulue.
'use strict';
(function (CG) {
  const A8 = CG.Art8 = {}, TAU = Math.PI * 2;
  A8.DIRS = {
    S: { code: 'S', label: 'S (face)', deg: 90, vx: 0, vy: 1 }, SE: { code: 'SE', label: 'SE (3/4 avant)', deg: 45, vx: 0.707, vy: 0.707 },
    E: { code: 'E', label: 'E (profil droit)', deg: 0, vx: 1, vy: 0 }, NE: { code: 'NE', label: 'NE (3/4 dos)', deg: 315, vx: 0.707, vy: -0.707 },
    N: { code: 'N', label: 'N (dos)', deg: 270, vx: 0, vy: -1 }, NW: { code: 'NW', label: 'NO (3/4 dos)', deg: 225, vx: -0.707, vy: -0.707 },
    W: { code: 'W', label: 'O (profil gauche)', deg: 180, vx: -1, vy: 0 }, SW: { code: 'SW', label: 'SO (3/4 avant)', deg: 135, vx: -0.707, vy: 0.707 }
  };
  A8.dirFrom = function (dx, dy) { const d = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360; return ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'][Math.round(d / 45) % 8]; };
  // métier -> tunique, outil, chapeau
  A8.LOOKS = {
    chef: { tunic: '#6a3fa8', tool: 'baton', cape: '#c23a2a' }, garde: { tunic: '#5a6478', tunicF: '#75588a', tool: 'epee' },
    bucheron: { tunic: '#b8322a', tunicF: '#2f7a56', tool: 'hache', plaid: true }, mineur: { tunic: '#6b6258', tunicF: '#8a6450', tool: 'pioche' },
    chasseur: { tunic: '#4f7a3a', tunicF: '#8a8a36', tool: 'lance' }, cueilleur: { tunic: '#b8587a', tunicM: '#c8962e', tool: 'panier' },
    forgeron: { tunic: '#4a3a34', tunicF: '#6a3448', tool: 'marteau' }, arcier: { tunic: '#3f7a5a', tunicF: '#3f8a8a', tool: 'arc' }, tanneur: { tunic: '#9a6a3a', tunicF: '#b8804a', tool: 'couteau' },
    guerisseur: { tunic: '#e8e2cc', tunicF: '#cfe6d2', tool: 'herbes' }, aucun: { tunic: '#7d5236', tunicF: '#9a5a6e', tool: null }
  };

  const COIFFES = { garde: ['diademe', '#c4c8d4'], bucheron: ['foulard', '#2f7a56', 'carreaux'], mineur: ['bandeau', '#d8a02a', 'lampe'], chasseur: ['bandeau', '#6a7a2c', 'plume'], forgeron: ['foulard', '#8a2a3a'], arcier: ['bandeau', '#2f6a6a', 'plume'], tanneur: ['foulard', '#b8804a'], guerisseur: ['foulard', '#f1ead8', 'croix'], eclaireur: ['bandeau', '#e0b060', 'gemme'], aucun: ['fleur', '#ff9ccc'] };
  // ce que chaque évolution change au corps (multiplie les réglages du gobelin)
  A8.FORMS = { hob: { size: 1.1, belly: 1.14 }, chaman: { size: 1.12, belly: 1.12 }, assassin: { size: 1.09, belly: 1.08 }, lord: { size: 1.32, belly: 1.28 } }; // on garde son nez, son ventre, sa tête : tout grossit, c'est tout
  A8.HAT_LVL = 3; // le chapeau du métier se mérite : niveau 3 (le nom véritable, lui, demande le niveau 5)
  // les animations offertes par l'atelier ; loop = se répète, tool = outil imposé
  A8.POSES = {
    idle: { nom: 'Repos', icon: '🧘' }, walk: { nom: 'Marche', icon: '🐾' }, attack: { nom: 'Frapper', icon: '🏏', dur: 0.48 },
    chop: { nom: 'Bûcher', icon: '🪓', dur: 0.85, tool: 'hache' }, mine: { nom: 'Piocher', icon: '⛏️', dur: 0.95, tool: 'pioche' }, build: { nom: 'Bâtir', icon: '🔨', dur: 0.6, tool: 'marteau' },
    gather: { nom: 'Cueillir', icon: '🫐' }, pickup: { nom: 'Ramasser du bois', icon: '🪵', dur: 1.8 }, carry: { nom: 'Porter du bois', icon: '🚶' },
    heal: { nom: 'Soigner', icon: '🌿' }, nap: { nom: 'Sieste', icon: '💤' }, dance: { nom: 'Danser', icon: '💃' }, cheer: { nom: 'Bravo', icon: '🙌' }, sleep: { nom: 'Assommé', icon: '💫' }
  };
  // l'apparence propre à chaque gobelin (tout est réglable dans l'outil de création du mode debug)
  A8.DEF = { hue: 104, hue2: 48, lum: 50, noseW: 1, noseH: 1, teeth: 'droite', cheekHue: 350, cheekSize: 1, cheekA: 0.5, ear: 'pointu', earSize: 1, iris: 38, eyeSize: 1, size: 1, head: 1, belly: 1, eyes: 'rond', skull: 0.8, build: 1, jaw: 'rond', marks: null };
  A8.EYES = { rond: 'Ronds', ovale: 'Ovales (hauts)', amande: 'En amande', petit: 'Petits', endormi: 'Mi-clos', billes: 'Billes noires', grand: 'Grands yeux', chat: 'Pupilles de chat', tombant: 'Tombants', cils: 'Longs cils', mefiant: 'Méfiants', brillant: 'Brillants' };
  // le bas du visage : c1 = où la joue se referme, jw = largeur du menton, jb = bas du menton
  A8.JAWS = { rond: { nom: 'Rond et joufflu', c: [44, 32], jw: 24, jb: 38 }, ovale: { nom: 'Ovale (moins de joues)', c: [41, 27], jw: 17, jb: 39 }, fin: { nom: 'Menton fin (triangle)', c: [37, 22], jw: 8, jb: 41 }, pointu: { nom: 'Menton pointu', c: [40, 28], jw: 4, jb: 45 }, carre: { nom: 'Mâchoire carrée', c: [46, 37], jw: 35, jb: 39 }, bajoues: { nom: 'Grosses bajoues', c: [53, 38], jw: 30, jb: 38 } };
  A8.MARKS = { rousseur: 'Taches de rousseur', menton: 'Menton marqué', cicatrice: 'Cicatrice sur l\'œil', balafre: 'Balafre sur la joue', cernes: 'Cernes', fard: 'Fard à paupières', levres: 'Rouge à lèvres', grain: 'Grain de beauté', verrue: 'Verrue', rides: 'Rides du front', peinture: 'Peinture de guerre (1 trait)', peinture2: 'Peinture de guerre (2 traits)', pansement: 'Pansement', morve: 'Nez qui coule', lunettes: 'Lunettes rondes', lunettesC: 'Lunettes carrées', monocle: 'Monocle', cacheoeil: 'Cache-œil de pirate' };
  A8.MARK_X = [['peinture', 'peinture2'], ['lunettes', 'lunettesC', 'monocle', 'cacheoeil']]; // un seul à la fois dans chaque groupe
  A8.CREATE = { size: [0.8, 1.2], head: [0.8, 0.95] }; // à la création du chef : la moitié basse des hauteurs, le premier tiers des grosseurs de tête
  A8.HAIRS = { chauve: 'Crâne nu', court: 'Cheveux courts', brosse: 'Coupe en brosse', bol: 'Coupe au bol', raie: 'Raie sur le côté', meche: 'Accroche-cœur', emo: 'Mèche emo', ebouriffe: 'Ébouriffé', boucle: 'Bouclé', banane: 'Banane', houppette: 'Houppette', topknot: 'Petit chignon haut', couronne: 'Couronne de moine', mulet: 'Mulet', dreads: 'Dreads', carre: 'Carré à frange', long: 'Cheveux longs', couettes: 'Couettes', tresses: 'Deux tresses', natte: 'Longue natte', queue: 'Queue de cheval', chignon: 'Chignon', macarons: 'Macarons', palmier: 'Palmier', pics: 'En pics', crete: 'Crête', afro: 'Grosse touffe' };
  A8.HAIR_F = ['couettes', 'tresses', 'natte', 'macarons', 'chignon', 'palmier', 'carre']; // coiffures réservées aux gobelines
  A8.TUNICS = ['#7a3fc0', '#c23a2a', '#e8802a', '#e8c030', '#4a9a3a', '#2f8a7a', '#2f6ab8', '#3a3f8a', '#c8457e', '#8a5a34', '#4a4e58', '#f1ead8'];
  A8.HAIRC = ['#1f1a24', '#3a1f5a', '#6a3a1a', '#a8361e', '#f08a2a', '#e6cf8a', '#e8e8f0', '#c8457e', '#2f7a9a', '#3f8a3a'];
  A8.EARS = { pointu: { nom: 'Pointues' }, long: { nom: 'Longues et fines', sx: 1.3, sy: 0.82 }, court: { nom: 'Courtes', sx: 0.68, sy: 1.05 }, feuille: { nom: 'Larges en feuille', sx: 0.95, sy: 1.45 }, tombant: { nom: 'Tombantes', rot: 0.42 }, dresse: { nom: 'Dressées', rot: -0.5 }, dechire: { nom: 'Déchirées', notch: true } };
  A8.TEETH = { aucune: 'Aucune', droite: '1 dent à droite', gauche: '1 dent à gauche', deux: '2 dents (une de chaque côté)', trois: '3 dents', crocs: '2 gros crocs' };
  A8.RANGES = { hue: [70, 140], hue2: [20, 75], lum: [44, 56], noseW: [0.6, 2.2], noseH: [0.6, 2], cheekHue: [320, 390], cheekSize: [0.5, 1.6], cheekA: [0, 0.8], earSize: [0.7, 1.35], iris: [0, 360], eyeSize: [0.7, 1.4], size: [0.8, 1.6], head: [0.8, 1.25], belly: [0.8, 1.7], skull: [0.5, 1] };
  A8.randomLook = function (e) {
    const r = (a, b) => a + Math.random() * (b - a), pk = a => a[Math.floor(Math.random() * a.length)];
    return { hue: e && e.hue ? Math.max(70, Math.min(140, e.hue)) : r(70, 140), hue2: r(22, 72), lum: r(46, 54), noseW: r(0.7, 1.55), noseH: r(0.7, 1.45),
      teeth: pk(['droite', 'droite', 'gauche', 'gauche', 'deux', 'deux', 'trois', 'crocs', 'aucune']), cheekHue: r(335, 378), cheekSize: r(0.7, 1.35), cheekA: r(0.28, 0.62),
      hair: e && e.sex === 'f' ? pk(['couettes', 'couettes', 'couettes', 'long', 'long', 'queue', 'chignon', 'court', 'tresses', 'tresses', 'natte', 'carre', 'carre', 'macarons', 'palmier', 'afro', 'raie', 'boucle', 'emo', 'dreads']) : e && e.sex === 'm' ? pk(['chauve', 'chauve', 'chauve', 'chauve', 'chauve', 'chauve', 'chauve', 'chauve', 'crete', 'court', 'pics', 'bol', 'afro', 'brosse', 'raie', 'meche', 'ebouriffe', 'boucle', 'banane', 'houppette', 'topknot', 'couronne', 'mulet', 'dreads', 'emo']) : undefined,
      ear: pk(['pointu', 'pointu', 'long', 'court', 'feuille', 'tombant', 'dresse', 'dechire']), earSize: r(0.82, 1.2), iris: pk([38, 38, 38, 30, 48, 22, 58, 95, 190]), eyeSize: r(0.82, 1.2), eyes: pk(['rond', 'rond', 'rond', 'ovale', 'amande', 'petit', 'endormi', 'billes', 'grand', 'chat', 'tombant', 'cils', 'mefiant', 'brillant']), jaw: pk(['rond', 'rond', 'rond', 'ovale', 'ovale', 'fin', 'pointu', 'carre', 'bajoues']), marks: Math.random() < 0.3 ? { [pk(Object.keys(A8.MARKS).filter(k => k !== 'levres' || (e && e.sex === 'f')))]: 1 } : null, size: r(0.88, 1.15), head: r(0.9, 1.12), belly: r(0.85, 1.25) };
  };
  const CHEF_KEY = 'goblin-malin-chef-look'; let chefLook = null;
  A8.chiefLook = function () { if (!chefLook) { try { chefLook = JSON.parse(localStorage.getItem(CHEF_KEY)); } catch (e) { chefLook = null; } if (chefLook && (chefLook.skull === 0.65 || chefLook.skull === 0.72)) delete chefLook.skull; /* ancienne valeur par défaut */ chefLook = Object.assign({}, A8.DEF, { hue: 112 }, chefLook || {}); } return chefLook; };
  A8.setChiefLook = function (l) { chefLook = l ? Object.assign({}, A8.DEF, l) : null; try { if (l) localStorage.setItem(CHEF_KEY, JSON.stringify(l)); else localStorage.removeItem(CHEF_KEY); } catch (e) { /* rien */ } };
  const ease2 = k => 1 - Math.pow(1 - k, 2), ease3 = k => 1 - Math.pow(1 - k, 3);
  // frappe en 3 temps : armement, coup, retour (p de 0 à 1)
  function strike(p) {
    if (p < 0.30) { const e = ease2(p / 0.30); return { swing: -1.15 * e, lunge: -0.25 * e, twist: -0.35 * e, slash: 0 }; }
    if (p < 0.55) { const k = (p - 0.30) / 0.25, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; return { swing: -1.15 + 2.65 * e, lunge: -0.25 + 1.25 * e, twist: -0.35 + 0.85 * e, slash: Math.sin(k * Math.PI) }; }
    const e = ease3((p - 0.55) / 0.45); return { swing: 1.5 * (1 - e), lunge: 1 - e, twist: 0.5 * (1 - e), slash: 0 };
  }
  A8.strike = strike;
  const rr = (g, x, y, w, h, r, c) => { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
  const el = (g, x, y, rx, ry, c, rot) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); g.fill(); };
  const ln = (g, pts, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); };
  const pl = (g, pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };

  // o : { x, y, scale, dir, t, pose, p (avancement 0..1 des poses à durée), walk (phase), job, chief, sex, hue, lum, tool, blink }
  // ---------- le chevaucheur de loup : le loup dessous, le gobelin en selle ----------
  function rider(g, o) {
    const dir = A8.DIRS[o.dir] || A8.DIRS.S, vx = dir.vx, vy = dir.vy, ax = Math.abs(vx), t = o.t || 0, walking = o.pose === 'walk' || o.pose === 'carry', wc = o.walk === undefined ? t * 12 : o.walk;
    const b = walking ? Math.abs(Math.cos(wc)) * 7 : Math.sin(t * 3) * 1.2, isBack = vy < -0.15, sc = (o.scale || 1) * 1.34, fur = '#6b7686', light = '#aab4c2', dark = '#434c5a', E = (x, y, rx, ry, f, r) => el(g, x, y, rx, ry, f, r);
    g.save(); g.translate(o.x || 0, o.y || 0); g.scale(sc, sc);
    E(0, 3, 34 + 26 * ax, 13, 'rgba(0,0,0,0.2)');
    const tail = () => { g.save(); g.translate(-vx * (38 + 10 * ax), -38 - b * 0.5 - vy * 6); g.rotate(-vx * 1.0 + Math.sin(t * 5) * 0.18); E(0, -10, 8.5, 21, dark); E(0, -22, 5, 9, light); g.restore(); };
    const head = () => {
      const hx = vx * 44, hy = -47 - b * 0.4 + vy * 15, ex = ax > 0.1 ? 9 : 12;
      [-1, 1].forEach(k => pl(g, [hx + k * ex - 6 - vx * 4, hy - 8, hx + k * ex - vx * 6, hy - 27, hx + k * ex + 6 - vx * 4, hy - 8], k * vx > 0 ? dark : fur));
      E(hx, hy, 18, 16, fur); if (isBack) { E(hx, hy + 2, 12, 9, dark); return; }
      E(hx + vx * 13, hy + 7 + vy * 5, 12, 8.5, light); E(hx + vx * 22, hy + 4 + vy * 9, 4, 3.3, '#1c1c24');
      (ax > 0.9 ? [0] : [-1, 1]).forEach(k => { const x = hx + k * (8 - ax * 2) + vx * 5, y = hy - 3; E(x, y, 3.6, 4, '#ffd84a'); E(x + vx, y + 0.5, 1.6, 2.4, '#1c1c24'); });
      pl(g, [hx + vx * 10 - 3, hy + 13 + vy * 4, hx + vx * 10, hy + 19 + vy * 4, hx + vx * 10 + 3, hy + 13 + vy * 4], '#fff8dc');
    };
    const legs = () => { [[1, 1], [1, -1], [-1, 1], [-1, -1]].sort((p, q) => (p[0] * vy) - (q[0] * vy)).forEach(([f, s]) => {
      const sw = walking ? Math.sin(wc + (f * s > 0 ? 0 : Math.PI)) : 0, lift = Math.max(0, sw) * 7, x = f * vx * 30 + s * vy * 14 + (ax > 0.9 ? s * 4 : 0) + vx * sw * 9, y = f * vy * 6 + (ax > 0.9 ? s * 2 : 0) - lift;
      rr(g, x - 5.5, y - 26, 11, 26, 5, s * vx > 0 || (ax < 0.1 && f * vy < 0) ? dark : fur); E(x + vx * 3, y - 1, 7.5, 4.5, light);
    }); };
    if (isBack) head(); else tail();
    legs();
    E(0, -31 - b * 0.6, 23 + 30 * ax, 21, fur); E(0, -22 - b * 0.6, (23 + 30 * ax) * 0.82, 10, 'rgba(170,180,194,0.55)'); E(-vx * 8, -40 - b * 0.6, 20 + 10 * ax, 9, 'rgba(0,0,0,0.12)');
    E(-vx * 4, -47 - b * 0.6, 17 + 6 * ax, 7, '#b8322a'); rr(g, -vx * 4 - 13, -55 - b * 0.6, 26, 9, 4.5, '#7a4a22');
    A8.goblin(g, Object.assign({}, o, { x: -vx * 4, y: -45 - b * 0.6, scale: 0.66, _m: true, noLegs: true, pose: walking ? 'idle' : o.pose, alpha: undefined }));
    if (isBack) tail(); else head();
    g.restore();
  }
  A8.goblin = function (g, o) {
    if (o.chief && o.noHat === undefined) o = Object.assign({}, o, { noHat: !(CG.S && CG.S.chefHat) }); // la coiffe du chef se coud à l'atelier : sans elle, tête nue
    if (o.cls === 'loup' && !o._m) return rider(g, o);
    const dir = A8.DIRS[o.dir] || A8.DIRS.S, vx = dir.vx, vy = dir.vy, t = o.t || 0, pose = o.pose || 'idle', P = A8.POSES[pose] || {};
    const L = o.look ? Object.assign({}, A8.DEF, o.look) : Object.assign({}, A8.DEF, o.hue === undefined ? null : { hue: o.hue });
    if (o.headMul) L.head *= o.headMul; // sort « Grosse caboche »
    { const M = !o.chief && A8.FORMS[o.cls || (o.evolved ? 'hob' : '')]; if (M) for (const k in M) L[k] *= M[k]; }
    // évolutions : hob = hobgobelin, puis chaman / assassin (gobelins) ou lord (le chef)
    const cls = o.cls || (o.evolved ? 'hob' : null), heavy = cls === 'hob' || cls === 'lord', CT = { lord: '#991b1b', chaman: '#3a2a66', assassin: '#2c2840', loup: '#7a5230' };
    const evoSkin = cls && cls !== 'loup', hue = o.pierre ? 220 : evoSkin ? 22 + (L.hue2 - 20) * 0.33 : L.hue, /* évolué : la peau tourne à l'orangé (de 22 à 40), nuancée par la teinte propre à chacun */ lum0 = L.lum + (evoSkin ? 3 : 0), sat0 = evoSkin ? 60 : 46;
    const pierre = !!o.pierre, lum = pierre ? Math.min(58, lum0 + 4) : lum0, sat = pierre ? 5 : sat0; if (pierre) L.cheekA = 0; // peau de pierre : toute grise, sans rose aux joues
    const C = { skin: `hsl(${hue},${sat}%,${lum}%)`, light: `hsl(${hue},${sat + 4}%,${lum + 10}%)`, dark: `hsl(${hue},${sat}%,${lum - 13}%)`, deep: `hsl(${hue},${sat - 6}%,${lum - 30}%)`, ear: o.pierre ? '#7f838c' : '#d98689', blush: `hsla(${L.cheekHue % 360},85%,68%,${L.cheekA})` };
    const bl = (x, y, rx, ry, rot) => el(g, x, y, rx * L.cheekSize, ry * L.cheekSize, C.blush, rot);
    const job = o.chief ? 'chef' : (o.job || 'aucun'), look = A8.LOOKS[job] || A8.LOOKS.aucun, tunic = L.tunic || CT[cls] || ((o.chief ? (L.sex || o.sex) : o.sex) === 'f' ? look.tunicF : look.tunicM) || look.tunic, fun = o.fun || {}, tunicD = shade(tunic, 0.72), tunicL = shade(tunic, 1.22);
    const fem = (o.chief ? (L.sex || o.sex) : o.sex) === 'f'; // gobeline : cils, lèvres, tresses à boucles, robe
    const HS = A8.HAIRS[L.hair] ? L.hair : fem ? 'couettes' : 'chauve', HJ = o.chief ? 'chef' : (o.hatJob || o.job || 'aucun'), hasHair = HS !== 'chauve', NAPPE = HS === 'long' || HS === 'carre' || HS === 'mulet'; // la coiffure : celle choisie, sinon couettes pour elle et crâne nu pour lui
    if (fem) { const R = A8.RANGES; L.noseW = Math.min(L.noseW, (R.noseW[0] + R.noseW[1]) / 2); L.noseH = Math.min(L.noseH, (R.noseH[0] + R.noseH[1]) / 2); } // les gobelines : jamais plus que la moitié de la glissière du nez, au village comme à la création
    const isBack = vy < -0.15, pureBack = vy < -0.85, pureFront = vy > 0.85, profile = Math.abs(vy) < 0.15, side = vx >= 0 ? 1 : -1;
    const walking = pose === 'walk' || pose === 'carry', wc = o.walk === undefined ? t * 10.5 : o.walk;
    const ws = walking ? Math.sin(wc) : 0, bounce = walking ? Math.abs(Math.cos(wc)) * 8 : 0, breath = Math.sin(t * 3);
    const prog = o.p === undefined ? (P.dur ? (t / P.dur) % 1 : 0) : o.p;
    // cinématique de la pose
    let K = { swing: 0, lunge: 0, twist: 0, slash: 0 }, striking = false, dip = 0, hop = 0, lean = 0, armW = null, armF = null, sym = true, log = null, tool = o.tool === undefined ? (P.tool || look.tool) : o.tool, mouth = 'smile', eyes = 'open';
    if (pose === 'attack') { K = strike(prog); striking = true; mouth = 'shout'; }
    else if (pose === 'chop' || pose === 'mine' || pose === 'build') { K = strike(prog); K.lunge *= 0.25; K.slash = 0; K.dessus = prog < 0.30 ? 1 : prog < 0.55 ? 2 : 3; /* outil : il passe par-dessus l'épaule, pas par en dessous */ striking = true; mouth = prog > 0.3 && prog < 0.6 ? 'shout' : 'smile'; }
    else if (pose === 'gather') { const s = Math.sin(t * 5); dip = 13 + s * 2; sym = false; if (Math.abs(vx) < 0.1) { armW = 0.15 + s * 0.3; armF = -0.15 + s * 0.3; } else { armW = side * (-0.75 + s * 0.45); armF = side * (-0.75 - s * 0.45); } tool = null; }
    else if (pose === 'pickup') {
      const down = prog < 0.3 ? ease2(prog / 0.3) : prog < 0.5 ? 1 : prog < 0.75 ? 1 - ease2((prog - 0.5) / 0.25) : 0; dip = down * 20; tool = null;
      const hold = prog >= 0.42; armW = hold ? -0.55 : side * -0.5 * down + 0.28; armF = hold ? 0.55 : side * -0.5 * down - 0.28; if (hold) log = 'front';
    }
    else if (pose === 'carry') { armW = -0.55; armF = 0.55; log = 'front'; tool = null; }
    else if (pose === 'heal') { armW = 2.2 + Math.sin(t * 3) * 0.12; armF = -2.2 + Math.sin(t * 3) * 0.12; hop = 2 + Math.sin(t * 2.2) * 2; eyes = 'closed'; tool = null; }
    else if (pose === 'dance') { const s = Math.sin(t * 6); hop = Math.abs(s) * 14; lean = s * 0.16; armW = 2.5 + Math.sin(t * 12) * 0.35; armF = -2.5 + Math.sin(t * 12) * 0.35; tool = null; }
    else if (pose === 'cheer') { hop = Math.abs(Math.sin(t * 8)) * 12; armW = 2.7; armF = -2.7; mouth = 'shout'; }
    else if (pose === 'sleep') { eyes = 'closed'; mouth = 'flat'; }
    else if (pose === 'nap') { eyes = 'closed'; mouth = 'flat'; dip = 5 + Math.sin(t * 1.6) * 2.5; lean = 0.06; } // il s'est endormi au travail
    if (o.carry && (pose === 'idle' || pose === 'walk')) { armW = -0.55; armF = 0.55; log = 'front'; tool = null; }
    if (pose === 'drink') { armW = 2.25 + Math.sin(t * 1.6) * 0.3; tool = null; } else if (pose === 'drum') { const s = Math.sin(t * 14) * 0.7; armW = 0.7 + s; armF = -0.7 + s; tool = null; sym = false; }
    const blink = o.blink !== undefined ? o.blink : (t % 3.4) > 3.25;
    const bodyY = -bounce + breath * 1.8 + dip - hop;

    g.save(); g.translate(o.x || 0, o.y || 0); const sc = (o.scale || 1) * (o.ent && o.ent.bebe ? 0.7 : 1); /* nouveau-né : tout petit pendant son premier jour */ g.scale(sc, sc * L.size); /* size : la hauteur seule ; ce sont les évolutions qui font grossir */
    if (o.shadow !== false) el(g, K.lunge * vx * 24, K.lunge * vy * 14, 56 * (1 - hop * 0.012), 22 * (1 - hop * 0.012), 'rgba(0,0,0,0.3)');
    if (pose === 'sleep') { g.translate(0, -26); g.rotate(1.45 * side); g.translate(0, 60); }
    g.translate(K.lunge * vx * 24, K.lunge * vy * 14); if (lean) g.rotate(lean);

    const q = [];
    // ---- jambes
    const spread = (profile ? 6 : (Math.abs(vx) > 0.1 ? 16 : 22)) * (0.6 + 0.4 * L.belly), st = ws;
    const leg = (sgn, depth) => {
      const s2 = sgn * st, x = sgn * spread * (pureBack ? -1 : 1) * (profile ? 0.2 : 1) - vx * s2 * 14, lift = Math.max(0, s2) * 9;
      const y = -4 - (isBack ? -s2 * 5 : s2 * 5) - Math.max(0, s2) * 8 - lift - hop;
      if (walking && Math.abs(vx) > 0.1) { // de côté : la jambe part de la hanche, fléchit vers l'arrière puis revient vers l'avant
        const th = -sgn * st * 0.62, fwdV = -sgn * Math.cos(wc), lf = Math.max(0, fwdV) * 10, hxp = sgn * spread * (profile ? 0.2 : 1) * (isBack ? -1 : 1), hy = -30 - hop;
        const fx = hxp + vx * Math.sin(th) * 30, fy = -4 - hop - lf + vy * Math.sin(th) * 7, kx = (hxp + fx) / 2 + vx * (lf * 0.9 + 3), ky = (hy + fy) / 2 - lf * 0.2;
        q.push({ z: -10 + depth * 2, f: () => {
          g.strokeStyle = C.dark; g.lineWidth = 15; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(hxp, hy); g.lineTo(kx, ky); g.lineTo(fx, fy - 5); g.stroke();
          g.save(); g.translate(fx + vx * 8, fy + vy * 3); g.rotate(vx * (0.15 + (fwdV > 0 ? -lf * 0.03 : Math.max(0, -th) * 0.9))); el(g, 0, 0, 14, 9, C.skin);
          if (vy >= -0.3) for (let i = -1; i <= 1; i++) el(g, vx * 9 + i * 4.5, vy * 4 + 2, 2.5, 2.5, C.light);
          g.restore();
        } });
        return;
      }
      q.push({ z: -10 + depth * 2, f: () => {
        g.save(); g.translate(x, y); rr(g, -8, -28 + Math.min(dip, 14), 16, 24, 7, C.dark);
        g.translate(vx * 8, vy * 3); el(g, 0, 0, 14, 9, C.skin, vx * 0.15);
        if (vy >= -0.3) for (let i = -1; i <= 1; i++) el(g, vx * 9 + i * 4.5, vy * 4 + 2, 2.5, 2.5, C.light);
        g.restore();
      } });
    };
    if (!o.noLegs) { leg(-1, -vx); leg(1, vx); }
    // ---- bras
    // sgn = +1 : son bras gauche, -1 : son bras droit (celui qui tient l'outil). Sa gauche, à l'écran, c'est (vy, -vx).
    const arm = (sgn, weapon) => {
      const pure = pureFront || pureBack, depth = pure ? (pureFront ? 0.5 : -0.5) : -sgn * vx;
      let sx = profile ? (depth > 0 ? 4 : -4) : sgn * vy * (pure ? 26 : 28) + (pure ? 0 : vx * 6);
      if (!profile) sx *= 0.55 + 0.45 * L.belly;
      const out = Math.sign(sx) || 1, fwd = Math.abs(vx) > 0.1 ? side : -out, sw = walking ? (weapon ? -ws : ws) : 0;
      // de profil le bras balance en tournant ; de face ou de dos il avance et recule (il s'allonge ou raccourcit)
      let a = (profile ? 0 : -out * (0.14 + breath * 0.04)) - sw * 0.7 * vx, len = 1 + sw * 0.3 * vy;
      if (striking) { if (weapon) { const n = K.swing < 0 ? K.swing / 1.15 : K.swing / 1.5; a = n < 0 ? -n * fwd * 2.5 : -n * fwd; len = 1; if (K.dessus === 2) a = fwd * (2.5 + (n + 1) / 2 * 2.6); else if (K.dessus === 3) a = -n * 1.18 * fwd; /* levé derrière la tête, puis abattu par le haut vers l'avant */ } else a += K.swing * 0.3 * fwd; }
      const ov = weapon ? armW : armF; if (ov !== null) { a = (isBack && sym ? -1 : 1) * ov; len = 1; }
      let z = pure ? depth * (weapon ? 18 : 16) : vy > 0.15 ? 6 + depth * 8 : depth * 16;
      const far = profile && depth < 0; // de profil, le bras du côté caché reste derrière le corps, avec ce qu'il tient
      if (!isBack && !far && ((weapon && tool) || Math.abs(a) > 1.5)) z = 40; // ce qu'on tient, ou un bras levé, passe devant tout
      if (weapon && striking && !isBack && !far) z = 42; if (far) z = -20; if (log === 'front') z = isBack ? -20 : 30;
      q.push({ z, f: () => {
        g.save(); g.translate(sx, -48 + bodyY); g.rotate(a);
        rr(g, -7, -2, 14, 26 * len, 7, C.skin); if (look.plaid && !CT[cls]) { rr(g, -8, -3, 16, 15 * len, 7, tunic); rr(g, -8, 3 * len, 16, 3.5, 1, 'rgba(22,12,12,0.45)'); rr(g, -1.5, -3, 3.5, 15 * len, 1, 'rgba(22,12,12,0.4)'); } g.translate(0, 24 * len);
        if (weapon && tool && !striking && ov === null) { g.save(); g.rotate(-a + (profile ? side : out) * 0.5 - (vx >= 0 ? -0.65 : 0.65)); drawTool(g, tool, vx, t, false); g.restore(); }
        if (weapon && tool && striking) { g.save(); g.rotate(Math.PI); drawTool(g, tool, -fwd, t, true); g.restore(); }
        el(g, 0, 0, 7.5, 7.5, C.light);
        g.restore();
      } });
    };
    arm(-1, true); arm(1, false); // droitier : l'outil est toujours dans sa main droite
    // ---- cape du chef (derrière de face, devant de dos)
    const capeC = fun.cape ? (look.cape || cls === 'lord' ? '#f0c030' : '#e8302a') : cls === 'lord' ? '#7f1d1d' : cls === 'chaman' ? '#241c40' : cls === 'assassin' ? '#1c1a2a' : look.cape;
    if (capeC) q.push({ z: isBack ? 6 : -30, f: () => { const w = profile ? 20 : 34, fl = Math.sin(t * 3) * 3 + (walking ? ws * 4 : 0), ox = profile ? -side * 16 : -vx * 10; pl(g, [ox - w * 0.8, -58 + bodyY, ox + w * 0.8, -58 + bodyY, ox + w + fl, -6, ox - w + fl, -6], capeC); pl(g, [ox - w * 0.8, -58 + bodyY, ox - w * 0.2, -58 + bodyY, ox - w * 0.4 + fl, -6, ox - w + fl, -6], shade(capeC, 0.8)); } });
    // ---- torse
    q.push({ z: 0, f: () => {
      g.save(); g.translate(0, -34 + bodyY); g.scale(1 + breath * 0.025, 1 - breath * 0.025);
      const w = (profile ? 25 : 32) * L.belly, sx = vx * 10, tw = cls === 'hob' ? 1.06 : cls === 'lord' ? 0.94 : cls === 'chaman' ? 0.86 : 0.78; // carrure des épaules
      g.fillStyle = tunic; g.beginPath(); g.moveTo(-w * tw, -22); g.quadraticCurveTo(-w * 1.12, 12, -w * 0.98, 26); g.quadraticCurveTo(0, 34, w * 0.98, 26); g.quadraticCurveTo(w * 1.12, 12, w * tw, -22); g.closePath(); g.fill();
      if (fem) { const sw2 = walking ? ws * 2.5 : Math.sin(t * 2.4) * 1.2; g.beginPath(); g.moveTo(-w * 0.9, 10); g.quadraticCurveTo(-w * 1.25, 26, -w * 1.42 + sw2, 40); g.quadraticCurveTo(0, 50, w * 1.42 + sw2, 40); g.quadraticCurveTo(w * 1.25, 26, w * 0.9, 10); g.closePath(); g.fill(); g.strokeStyle = tunicL; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-w * 1.36 + sw2, 38.5); g.quadraticCurveTo(0, 48, w * 1.36 + sw2, 38.5); g.stroke(); g.fillStyle = tunic; g.beginPath(); g.moveTo(-w * tw, -22); g.quadraticCurveTo(-w * 1.12, 12, -w * 0.98, 26); g.quadraticCurveTo(0, 34, w * 0.98, 26); g.quadraticCurveTo(w * 1.12, 12, w * tw, -22); g.closePath(); }
      g.save(); g.clip(); if (look.plaid && !CT[cls]) { /* chemise carreautée */ for (let x = -w * 1.3 + sx * 0.4; x < w * 1.3; x += 15) { g.fillStyle = 'rgba(22,12,12,0.42)'; g.fillRect(x, -26, 6.5, 70); } for (let y = -19; y < 40; y += 14) { g.fillStyle = 'rgba(22,12,12,0.42)'; g.fillRect(-w * 1.4, y, w * 2.8, 6); } } el(g, -side * w * (isBack ? -0.9 : 0.9) - vx * 6, 6, w * 0.55, 34, 'rgba(0,0,0,0.13)'); g.restore();
      if (!isBack) pl(g, [sx - 11, -22, sx, -5, sx + 11, -22], C.dark);
      else { g.setLineDash([4, 4]); ln(g, [sx, -18, sx, 22], tunicL, 2); g.setLineDash([]); }
      rr(g, (isBack ? -sx : sx) + (profile ? 2 : 11) - 7, 13, 14, 11, 3, tunicL);
      if (o.armor) { g.fillStyle = '#8a5a2a'; g.beginPath(); g.moveTo(-w * 0.8, -22); g.quadraticCurveTo(-w * 1.02, -4, -w * 0.9, 5); g.lineTo(w * 0.9, 5); g.quadraticCurveTo(w * 1.02, -4, w * 0.8, -22); g.closePath(); g.fill(); rr(g, -w * 0.8, -22, w * 1.6, 6, 3, '#a9763c'); if (!profile) { rr(g, (isBack ? -sx : sx) - 2.5, -20, 5, 24, 2, '#c9a56b'); [-0.55, 0.55].forEach(k => { el(g, k * w + (isBack ? -sx : sx) * 0.4, -8, 2.6, 2.6, '#d8c08a'); }); } else rr(g, side * 6 - 2.5, -20, 5, 24, 2, '#c9a56b'); el(g, -w * 0.82, -19, 9, 7, '#6e4620'); el(g, w * 0.82, -19, 9, 7, '#6e4620'); }
      if (cls) clsTorso(w, isBack ? -sx : sx);
      rr(g, -w * 0.97, 4, w * 1.94, 9, 4, '#3b2416');
      if (!isBack) { rr(g, sx - 6, 3, 12, 11, 2.5, '#fbbf24'); rr(g, sx - 3, 6, 6, 5, 1.5, '#b8860b'); }
      if (fun.tutu) { const fl = Math.sin(t * 4) * 1.5 + (walking ? ws * 2 : 0); for (let i = -4; i <= 4; i++) el(g, i * w * 0.36 + fl * (i % 2 ? 1 : -1) * 0.4, 20 + Math.abs(i) * 0.6, w * 0.3, 10, i % 2 ? '#ff9ccc' : '#ffc0de'); rr(g, -w * 0.97, 12, w * 1.94, 5, 2.5, '#e85a9a'); }
      if (fun.noeud && !isBack) { const nx2 = sx, ny = -18; pl(g, [nx2 - 15, ny - 8, nx2, ny, nx2 - 15, ny + 8], '#e8302a'); pl(g, [nx2 + 15, ny - 8, nx2, ny, nx2 + 15, ny + 8], '#e8302a'); el(g, nx2, ny, 4.2, 4.2, '#b01e1a'); el(g, nx2 - 9, ny - 2, 2, 2, '#fff'); el(g, nx2 + 9, ny + 2, 2, 2, '#fff'); }
      g.restore();
    } });
    // ---- bûche portée
    if (log) q.push({ z: log === 'shoulder' ? (isBack ? 10 : 9) : (isBack ? -22 : 46), f: () => {
      g.save(); const ly = log === 'shoulder' ? -76 + bodyY : -34 + bodyY, len = profile ? 26 : 50; g.translate(log === 'shoulder' ? 0 : vx * 20, ly + (log === 'shoulder' ? 0 : vy * 6)); if (log === 'shoulder') g.translate(0, 8);
      if (o.carry && o.carry !== 'bois' && o.carry !== true) { const sc2 = o.carry === 'minerai' ? '#7d7a72' : o.carry === 'cuir' || o.carry === 'chasse' ? '#9a6a3a' : '#c9a56b'; rr(g, -20, -18, 40, 34, 12, sc2); rr(g, -20, -18, 40, 12, 8, shade(sc2.length === 7 ? sc2 : '#c9a56b', 1.15)); rr(g, -7, -24, 14, 9, 3, shade(sc2, 0.75)); g.restore(); return; }
      rr(g, -len, -11, len * 2, 22, 10, '#8c5832'); rr(g, -len, -11, len * 2, 8, 6, '#a56c40'); ln(g, [-len * 0.5, 2, -len * 0.1, 3], '#5e381d', 2); ln(g, [len * 0.2, -2, len * 0.6, -1], '#5e381d', 2);
      el(g, (profile ? side : 1) * len, 0, 6, 11, '#e0b888'); el(g, (profile ? side : 1) * len, 0, 3, 6, '#c0935f');
      g.restore();
    } });
    // ---- tête
    q.push({ z: isBack ? 8 : 12, f: () => head() });
    if (NAPPE && !isBack) q.push({ z: -90, f: () => head(true) }); // vus de face, les cheveux longs tombent dans le dos : on les dessine avant le corps
    q.sort((a, b) => a.z - b.z).forEach(i => i.f());
    if (K.slash > 0.01) {
      g.save(); g.translate(vx * 36, -42 + bodyY + vy * 20); g.rotate(Math.atan2(vy, vx)); g.globalAlpha = K.slash * 0.9;
      const gr = g.createLinearGradient(0, -55, 45, 55); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, '#fef08a'); gr.addColorStop(1, '#fff');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 68, -0.95, 0.95); g.arc(-12, 0, 48, 0.85, -0.85, true); g.closePath(); g.fill(); g.restore();
    }
    if (cls === 'chaman') for (let i = 0; i < 3; i++) { const a = t * 1.8 + i * 2.094, x = Math.cos(a) * 62, y = -58 + Math.sin(a) * 16 + Math.sin(t * 3 + i) * 5; g.globalAlpha = 0.35 + (Math.sin(a) > 0 ? 0.5 : 0.15); el(g, x, y, 7, 7, 'rgba(45,212,191,0.35)'); el(g, x, y, 3.6, 3.6, '#aef5e8'); g.globalAlpha = 1; }
    if (pose === 'nap' && !o.noZ) { g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 0; i < 3; i++) { const u = (t * 0.45 + i / 3) % 1; g.globalAlpha = Math.sin(u * Math.PI); g.font = 'bold ' + Math.round(16 + u * 20) + 'px "Trebuchet MS", sans-serif'; g.lineWidth = 5; g.strokeStyle = 'rgba(20,24,40,0.7)'; g.strokeText('z', 40 + u * 34 + Math.sin(u * 6 + i) * 5, -92 - u * 62); g.fillStyle = '#e8f0ff'; g.fillText('z', 40 + u * 34 + Math.sin(u * 6 + i) * 5, -92 - u * 62); } g.globalAlpha = 1; }
    if (pose === 'heal') for (let i = 0; i < 9; i++) { const u = (t * 0.45 + i * 0.37) % 1, a = i * 2.4 + t * 0.5, r = 58 + (i % 3) * 14, x = Math.cos(a) * r, y = -20 - u * 130 + Math.sin(a) * 14, k = 5 + (i % 3) * 2.5; g.globalAlpha = Math.sin(u * Math.PI) * 0.95; rr(g, x - k, y - k * 0.3, k * 2, k * 0.6, 1.5, '#8dff9a'); rr(g, x - k * 0.3, y - k, k * 0.6, k * 2, 1.5, '#8dff9a'); g.globalAlpha = 1; }
    if (pose === 'sleep') { g.restore(); g.save(); g.translate(o.x || 0, o.y || 0); g.scale(sc, sc); for (let i = 0; i < 4; i++) { const a = t * 3.2 + i * 1.571, x = side * 74 + Math.cos(a) * 34, y = -50 + Math.sin(a) * 11, k = 9 + Math.sin(a) * 2.5; g.fillStyle = Math.sin(a) > 0 ? '#ffd83a' : '#e8b820'; g.beginPath(); for (let j = 0; j < 10; j++) { const rr2 = j % 2 ? k * 0.45 : k, b = j * 0.6283 - 1.571 + t * 2; g.lineTo(x + Math.cos(b) * rr2, y + Math.sin(b) * rr2); } g.closePath(); g.fill(); } }
    g.restore();

    function eye(x, y, sx, cote) {
      g.save(); g.translate(x, y); g.scale(sx * L.eyeSize, L.eyeSize);
      if (blink || eyes === 'closed') { g.strokeStyle = C.deep; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-10, 1); g.quadraticCurveTo(0, eyes === 'closed' ? -5 : 4, 10, 1); g.stroke(); g.restore(); return; }
      const ty = L.eyes, sq = striking ? 0.84 : 1, rx = ty === 'ovale' ? 9 : ty === 'amande' ? 13 : ty === 'petit' ? 7 : ty === 'grand' ? 13.5 : ty === 'tombant' ? 12.5 : 11, ry = (ty === 'ovale' ? 14.5 : ty === 'amande' ? 8 : ty === 'petit' ? 7.5 : ty === 'grand' ? 15 : ty === 'tombant' ? 9 : ty === 'chat' ? 10.5 : 12) * sq, es = cote || Math.sign(x || 1), k = Math.min(rx, ry) / 11;
      if (ty === 'amande') g.rotate(-es * 0.16); else if (ty === 'tombant') g.rotate(es * 0.2);
      if (ty === 'billes') { el(g, 0, 0, 8.5, 9.5 * sq, '#1c1510'); el(g, -2.8, -3.2, 2.6, 2.6, '#fff'); el(g, 2.6, 3, 1.2, 1.2, 'rgba(255,255,255,0.6)'); g.restore(); return; }
      el(g, 0, 0, rx + 1, ry + 1, C.dark); g.fillStyle = '#fffdf7'; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.fill(); g.save(); g.clip();
      const iy = ty === 'endormi' ? 2 : 0; const ki = ty === 'petit' ? 0.6 : Math.max(k, 0.8); /* petits yeux : iris et pupille réduits d'autant, pour garder du blanc autour */ el(g, 0, iy, 7.2 * ki, 7.2 * ki, `hsl(${L.iris},88%,52%)`); if (ty === 'chat') { el(g, 0, 0, 9, 9, `hsl(${L.iris},88%,52%)`); el(g, 0, 0, 2.2, 8, '#1c1510'); } else if (ty === 'brillant') { el(g, 0, 0, 8.8, 8.8, `hsl(${L.iris},88%,52%)`); el(g, 0, 0, 6.6, 6.6, '#1c1510'); el(g, 2.6, 3, 1.7, 1.7, '#fff'); el(g, -3, -3.2, 1, 1, '#fff'); } else el(g, 0, iy, 4.4 * ki * (ty === 'petit' ? 0.92 : 1), 4.4 * ki * (ty === 'petit' ? 0.92 : 1), '#1c1510'); el(g, -2.5 * k * (ty === 'petit' ? 0.8 : 1), iy - 2.8 * k * (ty === 'petit' ? 0.8 : 1), ty === 'brillant' ? 3.1 : ty === 'petit' ? 1.35 : 2.2, ty === 'brillant' ? 3.1 : ty === 'petit' ? 1.35 : 2.2, '#fff');
      if (ty === 'endormi') { g.fillStyle = C.skin; g.fillRect(-rx - 2, -ry - 2, rx * 2 + 4, ry * 0.95 + 2); g.fillStyle = C.deep; g.fillRect(-rx - 2, -ry * 0.05 - 1.2, rx * 2 + 4, 2.4); }
      if (ty === 'mefiant') { pl(g, [-es * (rx + 2), -ry - 2, es * (rx + 2), -ry - 2, es * (rx + 2), -ry * 0.72, -es * (rx + 2), -1.5], C.skin); ln(g, [es * (rx + 1), -ry * 0.72, -es * (rx + 1), -1.5], C.deep, 2.4); }
      g.restore();
      if (ty === 'cils') [[0.55, -1.05], [0.95, -0.72], [1.18, -0.3]].forEach(q => ln(g, [es * rx * q[0] * 0.92, ry * q[1] * 0.9, es * (rx * q[0] + 4.5), ry * q[1] - 4.5], C.deep, 1.9));
      if (fem) { const sg = es; g.strokeStyle = '#2a2018'; g.lineWidth = 1.4; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i < 3; i++) { if (ty === 'endormi') { const lx = sg * rx * (0.3 + i * 0.36), ly = -ry * 0.05; g.moveTo(lx, ly); g.lineTo(lx + sg * (2.2 + i * 1.2), ly + 4.6 - i * 0.9); } /* mi-clos : les cils partent de la paupière baissée */ else { const a = -Math.PI / 2 + sg * (0.35 + i * 0.42); g.moveTo(Math.cos(a) * rx, Math.sin(a) * ry); g.lineTo(Math.cos(a) * (rx + 4.2), Math.sin(a) * (ry + 4.2) - 0.6); } } g.stroke(); }
      g.restore();
    }
    function nose(x, y, rx, ry, sg) { rx *= L.noseW; ry *= L.noseH; el(g, x - sg * 1.5, y + 2.5, rx * 0.92, ry * 0.85, 'rgba(36,56,28,0.25)'); el(g, x, y, rx, ry, C.light); el(g, x + sg * rx * 0.25, y - ry * 0.3, rx * 0.32, ry * 0.24, 'rgba(255,255,255,0.45)'); }
    function ear(e) {
      const ES = A8.EARS[L.ear] || {};
      g.save(); g.translate(e.x, e.y); g.scale(e.sg * e.sx, e.sy || 1); g.rotate(e.tilt + (ES.rot || 0)); g.scale(L.earSize * (ES.sx || 1), L.earSize * (ES.sy || 1));
      const gr = g.createLinearGradient(-4, 0, 30, 0); gr.addColorStop(0, C.dark); gr.addColorStop(e.z > 0 ? 0.45 : 0.8, C.skin); gr.addColorStop(1, C.skin);
      g.fillStyle = gr; g.beginPath(); g.moveTo(-4, -9); g.bezierCurveTo(18, -22, 46, -18, 54, -8); if (ES.notch) { g.lineTo(43, 1); g.lineTo(36, -5); g.lineTo(31, 9); g.bezierCurveTo(22, 14, 10, 14, -4, 12); } else g.bezierCurveTo(46, 8, 22, 16, -4, 12); g.quadraticCurveTo(-8, 1, -4, -9); g.closePath(); g.fill();
      if (e.inner) { g.fillStyle = C.ear; g.beginPath(); g.moveTo(12, -5); g.bezierCurveTo(24, -12, 38, -11, 44, -6); g.bezierCurveTo(38, 4, 24, 8, 12, 6.5); g.closePath(); g.fill(); }
      else ln(g, [10, 0, 24, -3, 40, -5], C.dark, 2.2);
      if (e.ring) { g.strokeStyle = '#f0c030'; g.lineWidth = 3; g.beginPath(); g.arc(20, 15, 6, -0.6, Math.PI + 0.6); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.arc(20, 15, 6, 0.3, 1.3); g.stroke(); }
      g.restore();
    }
    function mouthAt(mx, sg, w) {
      if (mouth === 'shout') { el(g, mx, 21, w, 6.5, '#7f1d1d'); return; }
      const rl = fem && L.marks && L.marks.levres; g.strokeStyle = rl ? '#e0182e' : fem ? '#d8457e' : C.deep; g.lineWidth = rl ? 6 : fem ? 4.2 : 2.8; g.lineCap = 'round'; g.beginPath(); if (cls === 'hob' && mouth !== 'flat') { g.lineWidth = rl ? 6 : fem ? 4.2 : 3.4; g.moveTo(mx - w * 1.3, 23); g.quadraticCurveTo(mx + sg * 2, 19, mx + w * 1.3, 23); } else { g.moveTo(mx - w, 19); if (mouth === 'flat') g.lineTo(mx + w, 19); else g.quadraticCurveTo(mx + sg * 2, 25, mx + w, 19); } g.stroke();
      teeth(mx, sg, false); if (job === 'cueilleur' && !fem) brin(mx + sg * w * 0.75, 20.5, sg);
    }
    // le cueilleur mâchouille une brindille
    function brin(x, y, sg) { const wv = Math.sin(t * 3.2) * 2.2 + (walking ? ws * 1.5 : 0), x2 = x + sg * 24, y2 = y - 7 + wv; ln(g, [x, y, x2, y2], '#7a5a2c', 2.6); ln(g, [x + sg * 13, y - 3.8 + wv * 0.55, x + sg * 17, y - 10 + wv * 0.6], '#7a5a2c', 1.8); g.save(); g.translate(x2, y2); g.rotate(sg * -0.5 + wv * 0.04); el(g, sg * 5, -1, 6, 3, '#5aa83a'); el(g, sg * 4, -1.6, 3, 1.2, 'rgba(255,255,255,0.3)'); g.restore(); }
    function teeth(mx, sg, prof) {
      if (cls === 'assassin') return;
      if (heavy) { (prof ? [-sg * 5] : [-10, 10]).forEach(d => { const x = mx + d; pl(g, [x - 4, 22.5, x + (prof ? sg : Math.sign(d)) * 1.5, 8, x + 4, 22], '#fff8dc'); pl(g, [x, 22.5, x + (prof ? sg : Math.sign(d)) * 1.5, 8, x + 4, 22], 'rgba(120,90,40,0.25)'); }); return; }
      const k = L.teeth; if (k === 'aucune') return; const big = k === 'crocs', list = prof ? (k === 'trois' ? [-3, 3] : [0]) : { droite: [6], gauche: [-6], deux: [-6, 6], trois: [-6, 0, 6], crocs: [-6, 6] }[k] || [6];
      if (prof && ((k === 'droite' && sg > 0) || (k === 'gauche' && sg < 0))) return; // de profil, on ne voit que la dent du côté tourné vers nous
      list.forEach(d => { const x = mx + d, w = big ? 3 : 2, hh = big ? 9 : 5; pl(g, [x - w, 21.5, x, 21 - hh, x + w, 20.5], '#fef3c7'); });
    }
    function brows(list) {
      const an = (striking || pose === 'attack' ? 4 : 0) + (cls === 'hob' ? 4 : cls === 'lord' ? 2.2 : cls === 'assassin' ? 2.6 : 0);
      if (heavy && (cls === 'lord' || Math.floor(L.hue2) % 2 === 0)) { /* parfois, l'évolution épaissit les sourcils : arcade sourcilière : un sourcil épais en biseau, plus large vers le nez, avec son ombre */ list.forEach(b => { const d = b[1] > b[0] ? 1 : -1, y0 = -19 - an * 0.6 * b[2], y1 = -16.5 + an * b[2]; g.fillStyle = 'rgba(0,0,0,0.14)'; g.beginPath(); g.moveTo(b[0] - d * 2, y0 + 3); g.lineTo(b[1] + d * 2, y1 + 5); g.lineTo(b[1] + d * 2, y1 + 1); g.closePath(); g.fill(); g.fillStyle = C.deep; g.beginPath(); g.moveTo(b[0] - d * 3, y0 - 0.5); g.quadraticCurveTo((b[0] + b[1]) / 2, y0 - 5.5, b[1] + d * 3, y1 - 4); g.lineTo(b[1] + d * 3.5, y1 + 3); g.quadraticCurveTo((b[0] + b[1]) / 2, y0 + 2.5, b[0] - d * 3, y0 + 2); g.closePath(); g.fill(); }); return; }
      g.strokeStyle = C.deep; g.lineWidth = cls === 'assassin' ? 3.6 : 2.8; g.lineCap = 'round'; g.beginPath(); list.forEach(b => { g.moveTo(b[0], -18 - an * 0.6 * b[2]); g.lineTo(b[1], -17 + an * b[2]); }); g.stroke();
    }
    function head(nappeSeule) {
      const kd = Math.hypot(vy, vx * L.skull), koff = side * 46 * (1 - kd); /* crâne moins profond : de profil il rétrécit par l'arrière, le visage reste en place */
      const flat = f => { g.save(); g.translate(koff, 0); g.scale(kd, 1); f(); g.restore(); };
      g.save(); g.translate(-koff * 0.5, -88 + bodyY + breath * 1.2 + (pose === 'gather' ? 5 : 0)); g.rotate(vx * 0.06 + K.twist * 0.25); g.translate(0, 38 * (1 - L.head / L.size)); g.scale(L.head, L.head / L.size); /* la tête reste ronde même si le corps s'étire */
      if (nappeSeule) { flat(() => hair(false)); g.restore(); return; }
      const fl = Math.sin(t * 3.4) * 0.05 + (striking ? K.swing * 0.12 : 0), code = dir.code, b34 = code === 'NE' || code === 'NW', f34 = code === 'SE' || code === 'SW';
      const EL = { x: -38 * vy - 14 * vx, y: -2 - vy * 1.5, z: -vx * 28 - vy * 12, sg: (-vy - vx * 0.65) >= 0 ? 1 : -1, sx: Math.max(0.68, 0.88 - vx * 0.22), sy: 0.96, tilt: -vx * 0.16 + fl, inner: vy >= -0.35 || vx < -0.5 };
      const ER = { x: 38 * vy - 14 * vx, y: -2 - vy * 1.5, z: vx * 28 - vy * 12, sg: (vy - vx * 0.65) >= 0 ? 1 : -1, sx: Math.max(0.68, 0.88 + vx * 0.22), sy: 0.96, tilt: -vx * 0.16 - fl, inner: vy >= -0.35 || vx > 0.5 };
      if (pureFront) { Object.assign(EL, { x: -38, z: -5, sg: -1, sx: 1, tilt: fl, inner: true }); Object.assign(ER, { x: 38, z: -5, sg: 1, sx: 1, tilt: -fl, inner: true }); }
      if (profile) { const bk = side > 0 ? EL : ER, fr = side > 0 ? ER : EL; Object.assign(bk, { x: -side * 24, y: -6, z: -25, sg: -side, sx: 0.85, sy: 0.92, inner: false }); Object.assign(fr, { x: -side * 6, y: 0, z: 25, sg: -side, sx: 1.02, sy: 1, inner: true }); }
      if (f34) { const bk = side > 0 ? EL : ER, fr = side > 0 ? ER : EL; Object.assign(bk, { x: side * 30, y: -4, z: -25, sg: side, sx: 0.62, sy: 0.94, inner: true }); /* l'oreille du côté où il regarde : raccourcie, elle dépasse encore derrière le visage */ Object.assign(fr, { x: -side * 20, y: -1, z: 25, sg: -side, sx: 1, sy: 1, inner: true }); }
      if (b34) { const far = side > 0 ? ER : EL, near = side > 0 ? EL : ER; /* à mi-chemin entre le dos et le profil : une oreille reste longue derrière le crâne, vers l'arrière ; l'autre pointe presque vers nous, donc toute raccourcie, posée sur le crâne */ Object.assign(far, { x: side * 22, y: 1, z: 18, sg: side, sx: 0.5, sy: 1.02, inner: false }); Object.assign(near, { x: -side * 32, y: -3, z: -10, sg: -side, sx: 0.95, inner: false }); }
      if (pureBack) { Object.assign(EL, { x: 38, z: -5, sg: 1, sx: 1, inner: false }); Object.assign(ER, { x: -38, z: -5, sg: -1, sx: 1, inner: false }); }
      if (cls === 'hob' && Math.floor(hue * 3) % 2 === 0) (Math.floor(hue) % 2 ? EL : ER).ring = true; // certains hobgobelins portent un anneau d'or à l'oreille
      const ears = [EL, ER]; ears.forEach(e => { if (e.z <= 0) ear(e); });
      if (hasHair && !isBack && !NAPPE) flat(() => hair(false));
      // crâne
      g.save(); g.translate(koff, 0); g.scale(kd, 1); g.fillStyle = C.skin; skullPath(); g.fill();
      g.save(); g.clip(); el(g, -vx * 30 + (pureFront || pureBack ? 0 : 0), 44, 50, 16, 'rgba(0,0,0,0.10)'); if (isBack) el(g, 0, 30, 40, 16, 'rgba(0,0,0,0.08)'); g.restore(); g.restore();
      if (pureBack) { /* de dos : rien que le crâne */ }
      else if (b34) { /* de trois quarts dos : on ne voit plus le visage */ }
      else if (profile) { nose(side * 45, 6, 10.5, 7.8, side); bl(side * 21, 13, 9, 5.5); eye(side * 23, -4, 0.78); brows([[side * 14, side * 31, 0.9]]); if (mouth === 'shout') el(g, side * 33, 21, 7.5, 6, '#7f1d1d'); else { const rl = fem && L.marks && L.marks.levres; g.strokeStyle = rl ? '#e0182e' : C.deep; g.lineWidth = rl ? 6 : 2.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(side * 25, 21); g.quadraticCurveTo(side * 35, 23, side * 41, 18); g.stroke(); teeth(side * 34, side, true); } }
      else if (f34) { const nx = side * 4, fx = side * 31; bl(fx + side * 4, 12, 6.5, 4.8); eye(fx, -3, 0.74, side); nose(side * 21, 7, 9.5, 6.8, side); bl(nx - side * 7, 13, 9, 5.5); eye(nx, -3, 0.96, -side); brows([[nx - side * 8, nx + side * 7, 1], [fx + side * 6, fx - side * 5, 1]]); mouthAt(side * 17, side, 9); }
      else { bl(-26, 12, 9, 5.5); bl(26, 12, 9, 5.5); eye(-18, -3, 1); eye(18, -3, 1); brows([[-26, -11, 1], [26, 11, 1]]); nose(0, 7, 7.5, 5, 0.6); mouthAt(0, 1, 11); }
      if (hasHair && isBack) flat(() => hair(true));
      if (profile && job === 'cueilleur' && !fem && mouth !== 'shout') brin(side * 39, 20.5, side);
      if (cls && !isBack) clsFace();
      if (cls === 'assassin' && !isBack) flat(masque);
      if (!isBack && L.marks) marques(f34);
      if (!isBack) funFace();
      if (hasHair && !isBack) flat(() => hair('top'));
      flat(hat);
      ears.forEach(e => { if (e.z > 0) ear(e); });
      g.restore();
    }
    function hair(back) {
      const hc = L.hairC || ['#3a1f5a', '#a8361e', '#1f1a24', '#e6cf8a', '#c8457e'][Math.floor(hue * 7) % 5], hl = shade(hc, 1.3), hd = shade(hc, 0.72), bow = ['#ff6fa8', '#ffd84a', '#7ad0ff'][Math.floor(hue * 13) % 3], sw = Math.sin(t * 5) * (walking ? 4 : 1.5);
      // une couette : une mèche en goutte qui part du ruban et finit en pointe, avec des traits de cheveux
      const couette = (x, y, k, out) => {
        el(g, x - out * 3 * k, y - 16 * k, 7 * k, 12 * k, hc);
        g.fillStyle = hc; g.beginPath(); g.moveTo(x - 6 * k, y - 4 * k); g.bezierCurveTo(x - 17 * k, y + 12 * k, x - 12 * k + out * 4 * k, y + 32 * k, x + out * 9 * k + sw, y + 46 * k); g.bezierCurveTo(x + 13 * k + out * 2 * k, y + 30 * k, x + 15 * k, y + 10 * k, x + 6 * k, y - 4 * k); g.closePath(); g.fill();
        g.strokeStyle = hd; g.lineWidth = 1.8 * k; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 2 * k, y + 2 * k); g.quadraticCurveTo(x - 6 * k, y + 22 * k, x + out * 6 * k + sw * 0.8, y + 38 * k); g.moveTo(x + 4 * k, y + 2 * k); g.quadraticCurveTo(x + 7 * k, y + 20 * k, x + out * 8 * k + sw * 0.8, y + 34 * k); g.stroke();
        g.strokeStyle = hl; g.lineWidth = 2.2 * k; g.beginPath(); g.moveTo(x - 5 * k, y + 6 * k); g.quadraticCurveTo(x - 9 * k, y + 18 * k, x - 5 * k, y + 28 * k); g.stroke();
        pl(g, [x - 10 * k, y - 11 * k, x, y - 5 * k, x - 10 * k, y + 1 * k], bow); pl(g, [x + 10 * k, y - 11 * k, x, y - 5 * k, x + 10 * k, y + 1 * k], bow); el(g, x, y - 5 * k, 3.2 * k, 3.2 * k, shade(bow, 0.8));
      };
      const meches = (list) => { g.strokeStyle = hd; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); list.forEach(m => { g.moveTo(m[0], m[1]); g.quadraticCurveTo(m[2], m[3], m[4], m[5]); }); g.stroke(); };
      // la crête : des pics le long du crâne ; le chignon : une boule nouée ; les cheveux longs : une nappe qui tombe aux épaules
      const crete = (xc, pas, y0) => { for (let i = -2; i <= 2; i++) { const x = xc + i * pas, b = y0 + Math.abs(i) * 3.5, hh = 27 - Math.abs(i) * 5; pl(g, [x - 7, b + 4, x + pas * 0.25, b - hh, x + 7, b + 4], i % 2 ? hd : hc); pl(g, [x - 2, b + 2, x + pas * 0.25, b - hh, x + 3, b + 2], hl); } };
      const chignon = (x, y, r) => { el(g, x, y, r, r * 0.92, hc); el(g, x - r * 0.3, y - r * 0.3, r * 0.42, r * 0.3, hl); g.strokeStyle = hd; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, r * 0.55, 0.4, 2.6); g.stroke(); el(g, x, y + r * 0.95, r * 0.5, 2.6, bow); };
      const nappe = (x0, x1, bas) => { const mx = (x0 + x1) / 2; g.fillStyle = hc; g.beginPath(); g.moveTo(x0, -12); g.bezierCurveTo(x0 - 5, 20, x0 - 2 + sw * 0.5, bas - 12, x0 + 5 + sw, bas); g.quadraticCurveTo(mx + sw, bas - 9, x1 - 5 + sw, bas); g.bezierCurveTo(x1 + 2 + sw * 0.5, bas - 12, x1 + 5, 20, x1, -12); g.closePath(); g.fill(); g.strokeStyle = hd; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath(); for (let i = 1; i < 5; i++) { const x = x0 + (x1 - x0) * i / 5; g.moveTo(x, 6); g.quadraticCurveTo(x + (i < 3 ? -3 : 3), bas - 24, x + sw * 0.8, bas - 6); } g.stroke(); };
      const tresse = (x, y, n, out) => { for (let i = 0; i < n; i++) { const k = i / n; el(g, x + out * i * 1.6 + sw * k, y + i * 8.5, 7.5 - k * 1.5, 6.2, i % 2 ? hd : hc); el(g, x + out * i * 1.6 + sw * k - 2, y + i * 8.5 - 2, 2.6, 1.6, hl); } const ex = x + out * n * 1.6 + sw, ey = y + n * 8.5; el(g, ex, ey - 2, 5, 3, bow); pl(g, [ex - 5, ey, ex + 5, ey, ex + sw * 0.4, ey + 12], hc); };
      const frange = () => { if (profile) { pl(g, [side * 6, -39, side * 30, -30, side * 44, -14, side * 46, -2, side * 38, -11, side * 31, -8, side * 24, -15, side * 12, -17], hc); return; } const px = vx * 14; g.fillStyle = hc; g.beginPath(); g.moveTo(-45, -3); g.bezierCurveTo(-48, -19, -34, -40, 0, -40); g.bezierCurveTo(34, -40, 48, -19, 45, -3); for (let i = 5; i >= -5; i--) g.lineTo(i * 8.2 + px * 0.3, i % 2 ? -17 : -12.5); g.closePath(); g.fill(); g.strokeStyle = hl; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-24 + px, -32); g.quadraticCurveTo(-8 + px, -37, 8 + px, -34); g.stroke(); };
      const pics = () => { for (let i = -3; i <= 3; i++) { const a = i * 0.36 - vx * 0.12, bx = Math.sin(a) * 41, by = -Math.cos(a) * 37, tx2 = Math.sin(a) * 63, ty2 = -Math.cos(a) * 62 - 3; pl(g, [bx - Math.cos(a) * 9, by - Math.sin(a) * 9 + 5, tx2, ty2, bx + Math.cos(a) * 9, by + Math.sin(a) * 9 + 5], i % 2 ? hd : hc); pl(g, [bx - Math.cos(a) * 3, by - Math.sin(a) * 3 + 3, tx2, ty2, bx + Math.cos(a) * 2, by + Math.sin(a) * 2 + 3], hl); } };
      const palmier = (x, y) => { for (let i = -2; i <= 2; i++) { const a = i * 0.5 + Math.sin(t * 3 + i) * 0.05; g.strokeStyle = i % 2 ? hd : hc; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(a) * 10, y - 22, x + Math.sin(a) * 30 + sw * 0.5, y - 26 + Math.abs(i) * 9); g.stroke(); } el(g, x, y + 1, 7, 4.5, bow); };
      const afro = plein => { if (plein) el(g, 0, -14, 50, 40, hc); for (let i = 0; i < 11; i++) { const a = i / 11 * TAU + 0.3; if (Math.sin(a) > (plein ? 0.7 : 0.2)) continue; /* rien sous les oreilles : sinon ça fait une crinière sur le corps */ el(g, Math.cos(a) * 47, -8 + Math.sin(a) * 43, 20, 19, i % 3 ? hc : hd); } for (let i = 0; i < 11; i += 2) { const a = i / 11 * TAU + 0.3; if (Math.sin(a) > (plein ? 0.7 : 0.2)) continue; el(g, Math.cos(a) * 50 - 4, -14 + Math.sin(a) * 45, 7, 5, hl); } };
      const bosses = () => { for (let i = -3; i <= 3; i++) { const a = i * 0.42; el(g, Math.sin(a) * 46, -8 - Math.cos(a) * 42, 17, 16, i % 2 ? hd : hc); } for (let i = -2; i <= 2; i += 2) el(g, Math.sin(i * 0.42) * 48 - 4, -14 - Math.cos(i * 0.42) * 44, 6, 4, hl); };
      const epis = (a0, a1, n, len, r0) => { for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * (n > 1 ? i / (n - 1) : 0.5), L2 = len * (0.7 + ((i * 37) % 10) / 16), ca = Math.sin(a), sa = -Math.cos(a), bx = ca * r0, by = -4 + sa * (r0 - 4); pl(g, [bx - sa * 9, by + ca * 9, ca * (r0 + L2) + (i % 2 ? 4 : -4), -4 + sa * (r0 - 4 + L2), bx + sa * 9, by - ca * 9], i % 2 ? hd : hc); } };
      const balayage = bas => { if (profile) { pl(g, [side * 4, -39, side * 30, -31, side * 45, -14, side * 47, bas * 0.6, side * 40, bas * 0.2 - 4, side * 34, bas * 0.7, side * 27, -6, side * 20, bas * 0.35 - 4, side * 12, -17], hc); return; } const px = vx * 14; g.fillStyle = hc; g.beginPath(); g.moveTo(-45, -8); g.bezierCurveTo(-48, -20, -34, -40, 0, -40); g.bezierCurveTo(34, -40, 48, -19, 46, -2); [[47, bas], [39, bas - 9], [34, bas + 2], [26, bas - 11], [19, bas - 3], [10, bas - 16], [1, bas - 12], [-10, -13], [-20, -9], [-30, -16], [-38, -10]].forEach(q => g.lineTo(q[0] + px * 0.3, Math.max(q[1], -30))); g.closePath(); g.fill(); g.strokeStyle = hl; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-26 + px, -30); g.quadraticCurveTo(0 + px, -36, 24 + px, -22); g.stroke(); g.strokeStyle = hd; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-10 + px, -34); g.quadraticCurveTo(14 + px, -26, 28 + px * 0.3, Math.max(bas - 12, -28)); g.stroke(); };
      const brosse = () => { pl(g, [-42, -27, -37, -58, 37, -58, 42, -27], hc); pl(g, [-37, -58, 37, -58, 36, -53, -36, -53], hl); g.strokeStyle = hd; g.lineWidth = 1.6; g.beginPath(); for (let x = -28; x <= 28; x += 8) { g.moveTo(x, -52); g.lineTo(x, -40); } g.stroke(); };
      const banane = (x, y, rx) => { el(g, x, y, rx, rx * 0.56, hc); el(g, x - rx * 0.2, y - rx * 0.2, rx * 0.55, rx * 0.2, hl); g.strokeStyle = hd; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.arc(x + rx * 0.15, y + 1, rx * 0.36, 3.6, 6.6); g.stroke(); };
      const houppette = x => { g.strokeStyle = hc; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, -37); g.quadraticCurveTo(x - 9, -60, x + 7 + sw * 0.4, -64); g.quadraticCurveTo(x + 19 + sw * 0.5, -63, x + 13 + sw * 0.5, -53); g.stroke(); g.strokeStyle = hl; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x - 2, -42); g.quadraticCurveTo(x - 7, -57, x + 5, -61); g.stroke(); };
      const dread = (x, y0, y1, i) => { g.strokeStyle = i % 2 ? hd : hc; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + sw * 0.4, y1); g.stroke(); el(g, x + sw * 0.3, y0 + (y1 - y0) * 0.72, 4.6, 2.2, bow); };
      const boucles = (r, rad, n) => { for (let i = -n; i <= n; i++) { const a = i * 1.5 / n; el(g, Math.sin(a) * rad, -6 - Math.cos(a) * (rad - 5), r, r, i % 2 ? hd : hc); el(g, Math.sin(a) * rad - 2, -8 - Math.cos(a) * (rad - 5), r * 0.4, r * 0.3, hl); } };
      const noeud = (x, y) => { pl(g, [x - 5, y - 4, x + sw * 0.3, y - 23, x + 5, y - 4], hc); el(g, x, y, 8.5, 7, hc); el(g, x - 2.5, y - 2, 3.4, 2.2, hl); el(g, x, y + 6, 6, 2.4, bow); };
      const accroche = () => { g.strokeStyle = hc; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); if (profile) { g.moveTo(side * 28, -30); g.quadraticCurveTo(side * 50, -26, side * 44, -9); } else { const px = vx * 20; g.moveTo(px - 2, -35); g.quadraticCurveTo(px + 16, -26, px + 5, -12); } g.stroke(); };
      const capTop = () => { // la chevelure sur le dessus du crâne, vue de face, de trois quarts ou de profil
        g.fillStyle = hc;
        if (profile) { const s2 = side; g.beginPath(); g.moveTo(s2 * 32, -27); g.bezierCurveTo(s2 * 20, -38, s2 * 8, -40, 0, -40); g.bezierCurveTo(-s2 * 34, -40, -s2 * 48, -16, -s2 * 46, 8); g.quadraticCurveTo(-s2 * 45, 22, -s2 * 36, 28); g.quadraticCurveTo(-s2 * 24, 20, -s2 * 20, 2); g.quadraticCurveTo(-s2 * 6, -18, s2 * 14, -20); g.quadraticCurveTo(s2 * 26, -21, s2 * 32, -27); g.closePath(); g.fill(); meches([[-s2 * 4, -36, -s2 * 26, -30, -s2 * 34, -6], [s2 * 8, -36, -s2 * 12, -26, -s2 * 26, 6]]); g.strokeStyle = hl; g.lineWidth = 3; g.beginPath(); g.moveTo(s2 * 10, -33); g.quadraticCurveTo(-s2 * 6, -36, -s2 * 20, -28); g.stroke(); return; }
        const px = vx * 20; g.beginPath(); g.moveTo(-46, 0); g.bezierCurveTo(-48, -18, -34, -40, 0, -40); g.bezierCurveTo(34, -40, 48, -18, 46, 0); g.quadraticCurveTo(42, -16, 30 + px * 0.3, -24); g.quadraticCurveTo(14 + px, -31, px, -35); g.quadraticCurveTo(-14 + px, -31, -30 + px * 0.3, -24); g.quadraticCurveTo(-42, -16, -46, 0); g.closePath(); g.fill();
        meches([[px, -35, px - 2, -38, px - 3, -40], [-14 + px * 0.6, -38, -26, -32, -36, -20], [14 + px * 0.6, -38, 26, -32, 36, -20]]); g.strokeStyle = hl; g.lineWidth = 3; g.beginPath(); g.moveTo(-28 + px * 0.4, -31); g.quadraticCurveTo(-16 + px * 0.6, -37, -6 + px, -37); g.stroke(); return;
      };
      if (back === 'top') {
        if (HS !== 'crete' && HS !== 'houppette' && HS !== 'couronne') capTop();
        if (HS === 'crete') { if (profile) crete(-side * 6, 12, -38); else crete(vx * 20, Math.abs(vx) > 0.1 ? 8 : 4.5, -38); }
        else if (HS === 'chignon') { if (profile) chignon(-side * 26, -40, 15); else chignon(-vx * 16, -48, 15); }
        else if (HS === 'macarons') { if (profile) chignon(-side * 12, -44, 13); else { chignon(-34 - vx * 8, -40, 13); chignon(34 - vx * 8, -40, 13); } }
        else if (HS === 'palmier') palmier(profile ? -side * 8 : -vx * 8, -41);
        else if (HS === 'pics') pics();
        else if (HS === 'afro') bosses();
        if (HS === 'bol' || HS === 'carre' || HS === 'ebouriffe') frange();
        if (HS === 'emo') balayage(16); else if (HS === 'raie') balayage(-10); else if (HS === 'brosse') brosse(); else if (HS === 'banane') { if (profile) banane(side * 20, -42, 25); else banane(vx * 16, -45, 27); }
        else if (HS === 'houppette') houppette(vx * 6); else if (HS === 'boucle') boucles(8.5, 44, 5); else if (HS === 'ebouriffe') epis(-1.25, 1.25, 7, 15, 38); else if (HS === 'topknot') noeud(profile ? -side * 10 : -vx * 8, -45); else if (HS === 'meche') accroche();
        else if (HS === 'couronne') { if (profile) el(g, -side * 37, 0, 13, 21, hc); else { el(g, -45 - vx * 6, -3, 9, 18, hc); el(g, 45 - vx * 6, -3, 9, 18, hc); } }
        return;
      }
      if (back && HS === 'crete') { crete(-vx * 6, pureBack ? 4.5 : 9, -38); return; }
      if (back && HS === 'houppette') { houppette(-vx * 6); return; }
      if (back && HS === 'couronne') { g.fillStyle = hc; g.beginPath(); g.moveTo(-47, -16); g.bezierCurveTo(-46, 30, 46, 30, 47, -16); g.quadraticCurveTo(44, 2, 0, 4); g.quadraticCurveTo(-44, 2, -47, -16); g.fill(); g.strokeStyle = hd; g.lineWidth = 1.8; g.beginPath(); for (let x = -30; x <= 30; x += 12) { g.moveTo(x, 6); g.lineTo(x * 0.92, 18); } g.stroke(); return; }
      if (back) { // de dos : toute la chevelure couvre le crâne jusqu'à la nuque, raie au milieu, couettes de chaque côté
        const ox = -vx * 6;
        g.fillStyle = hc; g.beginPath(); g.moveTo(0, -40); g.bezierCurveTo(34, -40, 48, -16, 46, 10); g.quadraticCurveTo(44, 26, 30, 32); g.quadraticCurveTo(14 + ox, 24, ox, 30); g.quadraticCurveTo(-14 + ox, 24, -30, 32); g.quadraticCurveTo(-44, 26, -46, 10); g.bezierCurveTo(-48, -16, -34, -40, 0, -40); g.closePath(); g.fill();
        meches([[ox, -39, ox + 2, -8, ox, 28], [ox - 10, -36, -30, -18, -34, 22], [ox + 10, -36, 30, -18, 34, 22], [ox - 6, -30, -18, -6, -18, 26], [ox + 6, -30, 18, -6, 18, 26]]);
        g.strokeStyle = hl; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(ox - 22, -28); g.quadraticCurveTo(ox - 32, -14, ox - 34, 0); g.stroke();
        if (HS === 'couettes') { couette(-36 - vx * 8, 26, 1, -1); couette(36 - vx * 8, 26, 1, 1); } else if (HS === 'long') nappe(-46, 46, 60); else if (HS === 'queue') couette(ox, 22, 1.25, vx > 0 ? -0.4 : 0.4); else if (HS === 'chignon') chignon(ox, -30, 17); else if (HS === 'macarons') { chignon(ox - 34, -36, 14); chignon(ox + 34, -36, 14); } else if (HS === 'palmier') palmier(ox, -40); else if (HS === 'pics') pics(); else if (HS === 'afro') afro(true); else if (HS === 'carre') nappe(-47, 47, 40); else if (HS === 'tresses') { tresse(-34 - vx * 8, 26, 6, -1); tresse(34 - vx * 8, 26, 6, 1); } else if (HS === 'natte') tresse(ox, 24, 7, vx > 0 ? -0.5 : 0.5);
        else if (HS === 'mulet') nappe(-32, 32, 54); else if (HS === 'brosse') brosse(); else if (HS === 'banane') banane(ox, -42, 20); else if (HS === 'boucle') { boucles(8.5, 44, 5); for (let i = 0; i < 9; i++) el(g, Math.cos(i * 0.7) * (16 + (i % 3) * 9), -8 + Math.sin(i * 0.7) * (14 + (i % 2) * 12), 9, 9, i % 2 ? hd : hc); }
        else if (HS === 'ebouriffe') epis(-2.1, 2.1, 11, 14, 40); else if (HS === 'emo') { epis(-2.5, -1.5, 4, 13, 40); epis(1.5, 2.5, 4, 13, 40); } else if (HS === 'topknot') noeud(ox, -42); else if (HS === 'dreads') for (let i = -3; i <= 3; i++) dread(i * 13 + ox, -4 - Math.abs(i) * -2, 46 - Math.abs(i) * 3, i + 3);
        return;
      }
      // derrière le crâne (de face) : seulement les couettes qui dépassent sous les oreilles
      if (HS === 'afro') { afro(false); return; }
      if (HS === 'mulet') { if (profile) nappe(side > 0 ? -50 : 14, side > 0 ? -14 : 50, 50); else nappe(-30 - vx * 8, 30 - vx * 8, 52); return; }
      if (HS === 'ebouriffe' || HS === 'emo') { epis(-2.4, -1.45, 4, 13, 40); epis(1.45, 2.4, 4, 13, 40); return; }
      if (HS === 'dreads') { if (profile) [30, 40, 49].forEach((x, i) => dread(-side * x, -6, 34 - i * 3, i)); else [-48, -40, 40, 48].forEach((x, i) => dread(x - vx * 8, 0, 34, i)); return; }
      if (HS === 'carre') { if (profile) nappe(side > 0 ? -50 : 8, side > 0 ? -8 : 50, 38); else nappe(-49 - vx * 8, 49 - vx * 8, 38); return; }
      if (HS === 'tresses') { if (profile) tresse(-side * 42, 2, 7, -side); else if (Math.abs(vx) > 0.1) { tresse(-side * 46, 24, 6, -side); tresse(side * 38, 22, 5, side); } else { tresse(-44, 24, 6, -1); tresse(44, 24, 6, 1); } return; }
      if (HS === 'natte') { if (profile) tresse(-side * 46, -2, 8, -side); else if (Math.abs(vx) > 0.1) tresse(-side * 46, 22, 6, -side); return; }
      if (HS !== 'couettes') { if (HS === 'long') { if (profile) nappe(side > 0 ? -52 : 6, side > 0 ? -6 : 52, 58); else nappe(-50 - vx * 8, 50 - vx * 8, 58); } else if (HS === 'queue') { if (profile) couette(-side * 46, -4, 1.15, -side); else if (Math.abs(vx) > 0.1) couette(-side * 44, 24, 0.9, -side); } return; }
      if (profile) { couette(-side * 42, 4, 1.05, -side); return; } /* de profil, la couette part de l'arrière du crâne, sous les cheveux, et non du cou */
      if (Math.abs(vx) > 0.1) { couette(-side * 46, 30, 1, -side); couette(side * 38, 28, 0.8, side); return; }
      couette(-44, 30, 1, -1); couette(44, 30, 1, 1);
    }
    // ---- habits et visages des évolutions
    function clsTorso(w, sx) {
      if (cls === 'hob') { // sangle de cuir cloutée + une épaulière de fer
        g.strokeStyle = '#5a3a1c'; g.lineWidth = 8; g.lineCap = 'butt'; g.beginPath(); g.moveTo(-w * 0.78, -21); g.lineTo(w * 0.86, 4); g.stroke(); [0.2, 0.5, 0.8].forEach(k => el(g, -w * 0.78 + w * 1.64 * k, -21 + 25 * k, 2.4, 2.4, '#d8c08a'));
        const ex = (isBack ? 1 : -1) * w * 0.86; el(g, ex, -19, 15, 10, '#7c818c'); el(g, ex, -21, 11, 5.5, '#a4a9b4'); el(g, ex, -17, 2.6, 2.6, '#4a4e58');
      } else if (cls === 'lord') { // plastron doré, épaulettes, rubis
        if (!isBack) { g.fillStyle = '#e8b830'; g.beginPath(); g.moveTo(-w * 0.62, -22); g.lineTo(w * 0.62, -22); g.lineTo(w * 0.5, -2); g.quadraticCurveTo(sx * 0.4, 8, -w * 0.5, -2); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.moveTo(-w * 0.5, -20); g.lineTo(-w * 0.1, -20); g.lineTo(-w * 0.3, -4); g.closePath(); g.fill(); el(g, sx * 0.5, -10, 5, 5.5, '#e8302a'); el(g, sx * 0.5 - 1.4, -11.6, 1.6, 1.6, 'rgba(255,255,255,0.8)'); }
        [-1, 1].forEach(k => { el(g, k * w * 0.9, -19, 15, 9.5, '#c8962e'); el(g, k * w * 0.9, -21, 12, 5.5, '#f0c030'); });
      } else if (cls === 'chaman') { // runes, collier d'os, talisman
        if (!isBack) { for (let i = -2; i <= 2; i++) { g.save(); g.translate(sx * 0.4 + i * w * 0.24, -17 + Math.abs(i) * -1.5 + 4); g.rotate(i * 0.25); rr(g, -2, -5, 4, 10, 2, '#f4ead0'); g.restore(); } el(g, sx * 0.4, -2, 5.5, 5.5, '#2dd4bf'); el(g, sx * 0.4, -2, 9, 9, 'rgba(45,212,191,0.25)'); }
        ln(g, [-w * 0.62, 18, -w * 0.5, 24, -w * 0.38, 18], '#2dd4bf', 2); ln(g, [w * 0.38, 18, w * 0.5, 24, w * 0.62, 18], '#2dd4bf', 2);
        [-1, 1].forEach(k => { el(g, k * w * 0.88, -19, 12, 8, '#e8dcc0'); el(g, k * w * 0.88, -18, 3, 3.4, '#3a2a66'); });
      } else if (cls === 'assassin') { // baudrier avec ses dagues de lancer
        g.strokeStyle = '#15131f'; g.lineWidth = 7; g.lineCap = 'butt'; g.beginPath(); g.moveTo(-w * 0.8, -20); g.lineTo(w * 0.86, 4); g.stroke();
        if (!isBack) [0.25, 0.5, 0.75].forEach(k => { const x = -w * 0.8 + w * 1.66 * k, y = -20 + 24 * k; g.save(); g.translate(x, y); g.rotate(0.5); rr(g, -1.6, -8, 3.2, 9, 1, '#c8ccd8'); rr(g, -2.4, 0, 4.8, 4, 1, '#a855f7'); g.restore(); });
      }
    }
    // signes particuliers : taches de rousseur, cicatrices, cernes, maquillage...
    function marques(f34) {
      const M = L.marks, A = profile ? { e: [[side * 23, -4]], c: [[side * 21, 13]], mx: side * 33, k: side, s: [0.78] } : f34 ? { e: [[side * 31, -3], [side * 4, -3]], c: [[side * 35, 12], [-side * 3, 13]], mx: side * 17, k: side, s: [0.74, 0.96] } : { e: [[-18, -3], [18, -3]], c: [[-26, 12], [26, 12]], mx: 0, k: 1, s: [1, 1] };
      const E = A.e, Ck = A.c, mx = A.mx, n = E.length - 1, e0 = E[n], c0 = Ck[n], c1 = Ck[0], scar = 'rgba(150,62,50,0.9)', mid = E.reduce((a, q) => a + q[0], 0) / E.length;
      // la forme de l'œil : rien de ce qui est sur la peau ne doit déborder dedans
      const ty = L.eyes, RX = (ty === 'ovale' ? 9 : ty === 'amande' ? 13 : ty === 'petit' ? 7 : ty === 'grand' ? 13.5 : ty === 'tombant' ? 12.5 : ty === 'billes' ? 8.5 : 11) + 1, RY = (ty === 'ovale' ? 14.5 : ty === 'amande' ? 8 : ty === 'petit' ? 7.5 : ty === 'grand' ? 15 : ty === 'tombant' ? 9 : ty === 'chat' ? 10.5 : ty === 'billes' ? 9.5 : 12) + 1;
      const ex = i => RX * A.s[i] * L.eyeSize, ey = RY * L.eyeSize, bas = i => E[i][1] + ey, haut = i => E[i][1] - ey;
      g.save(); g.beginPath(); g.rect(-90, -90, 180, 180); E.forEach((q, i) => { g.moveTo(q[0] + ex(i) + 1.5, q[1]); g.ellipse(q[0], q[1], ex(i) + 1.5, ey + 1.5, 0, 0, TAU); }); g.clip('evenodd');
      if (M.fard) E.forEach((q, i) => el(g, q[0], q[1] - ey * 0.72, ex(i) + 1, ey * 0.62, 'rgba(160,90,230,0.62)'));
      if (M.cernes) E.forEach((q, i) => { g.strokeStyle = 'rgba(70,36,90,0.45)'; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(q[0] - ex(i) * 0.8, bas(i) + 1.5); g.quadraticCurveTo(q[0], bas(i) + 7, q[0] + ex(i) * 0.8, bas(i) + 1.5); g.stroke(); });
      // taches de rousseur : sur les pommettes, sous les yeux
      if (M.rousseur) Ck.forEach((q, i) => [[-8, 1], [-3, 0], [3, 1], [8, 0], [-6, 5], [0, 5.5], [6, 5], [-2, 9.5], [4, 9.5]].forEach(d => el(g, q[0] + d[0] * A.s[i], Math.max(q[1] - 4, bas(i) + 3) + d[1], 1.45, 1.45, 'rgba(140,72,30,0.72)')));
      // peintures de guerre : une grosse barre noire sous chaque œil
      if (M.peinture2) E.forEach((q, i) => { const w = ex(i) * 0.8; g.strokeStyle = '#17130f'; g.lineWidth = 3.4; g.lineCap = 'round'; [3.5, 9.5].forEach((dy, n) => { const y = bas(i) + dy, ww = w * (n ? 0.78 : 1); g.beginPath(); g.moveTo(q[0] - ww, y - 0.5); g.quadraticCurveTo(q[0], y + 1.5, q[0] + ww, y - 0.5); g.stroke(); }); });
      if (M.peinture) E.forEach((q, i) => { const w = ex(i) * 0.82, y = bas(i) + 4.5; g.strokeStyle = '#17130f'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(q[0] - w, y - 0.5); g.quadraticCurveTo(q[0], y + 1.5, q[0] + w, y - 0.5); g.stroke(); });
      // cicatrice : elle barre le sourcil et la joue, mais pas l'œil lui-même
      if (M.cicatrice) { const x = e0[0], y1 = haut(n) - 9, y2 = bas(n) + 9; ln(g, [x - 5, y1, x + 4, y2], scar, 2.6); ln(g, [x - 7.5, y1 + 5, x - 1.5, y1 + 3], scar, 1.7); ln(g, [x - 0.5, y2 - 3, x + 5.5, y2 - 5], scar, 1.7); }
      g.restore();
      if (M.rides) [-19, -24.5, -30].forEach((y, i) => { g.strokeStyle = C.deep; g.globalAlpha = 0.7; g.lineWidth = 2.1; g.lineCap = 'round'; g.beginPath(); g.moveTo(mid - 17 + i * 3.5, y + 1); g.quadraticCurveTo(mid - 6, y - 3.5, mid, y); g.quadraticCurveTo(mid + 6, y + 2.5, mid + 17 - i * 3.5, y - 1); g.stroke(); g.globalAlpha = 1; });
      if (M.balafre) { ln(g, [c1[0] - 8, c1[1] - 2, c1[0] + 8, c1[1] + 9], scar, 2.4); [-4, 0, 4].forEach(d => ln(g, [c1[0] + d - 1.5, c1[1] + d * 0.7 + 6.5, c1[0] + d + 1.5, c1[1] + d * 0.7 + 1], scar, 1.5)); }
      if (M.grain) el(g, c0[0] + A.k * 5, c0[1] + 9, 1.9, 1.9, '#3a2416');
      // verrue : une grosse bosse poilue sur la joue
      if (M.verrue) { const x = c1[0] - A.k * 3, y = c1[1] + 9; el(g, x + 0.6, y + 1, 5, 4.6, C.deep); el(g, x, y, 4.4, 4, '#b98a5a'); el(g, x - 1.3, y - 1.3, 1.7, 1.4, 'rgba(255,240,210,0.75)'); ln(g, [x + 1, y - 3, x + 3.5, y - 8.5], '#2a1a10', 1.2); ln(g, [x - 1, y - 3.4, x - 2.5, y - 8], '#2a1a10', 1.2); }
      if (M.menton) { el(g, mx, 31.5, 7.5, 3.6, C.light); g.strokeStyle = C.dark; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(mx - 7, 33.5); g.quadraticCurveTo(mx, 37.5, mx + 7, 33.5); g.stroke(); ln(g, [mx, 30, mx, 33], C.dark, 1.5); }
      // (pas de barbe chez les gobelins)
      if (M.lunettes || M.lunettesC) { g.strokeStyle = '#2a2018'; g.lineWidth = 2.6; g.lineJoin = 'round'; E.forEach((q, i) => { const rx = ex(i) + 3.5, ry = ey + 3.5; g.fillStyle = 'rgba(200,230,255,0.2)'; g.strokeStyle = '#2a2018'; g.lineWidth = 2.6; g.beginPath(); if (M.lunettesC) g.rect(q[0] - rx, q[1] - ry * 0.82, rx * 2, ry * 1.64); else g.ellipse(q[0], q[1], rx, ry, 0, 0, TAU); g.fill(); g.stroke(); ln(g, [q[0] - rx * 0.5, q[1] - ry * 0.45, q[0] - rx * 0.1, q[1] - ry * 0.62], 'rgba(255,255,255,0.7)', 1.6); }); if (E.length > 1) { const a = E[0], b = E[1], sg = a[0] < b[0] ? 1 : -1; ln(g, [a[0] + sg * (ex(0) + 3.5), a[1] - 1, b[0] - sg * (ex(1) + 3.5), b[1] - 1], '#2a2018', 2.6); } else ln(g, [e0[0] - side * (ex(n) + 3.5), e0[1] - 2, e0[0] - side * (ex(n) + 26), e0[1] - 5], '#2a2018', 2.6); }
      if (M.monocle) { const rx = ex(n) + 3, ry = ey + 3; g.fillStyle = 'rgba(200,230,255,0.22)'; g.strokeStyle = '#e8c84a'; g.lineWidth = 2.6; g.beginPath(); g.ellipse(e0[0], e0[1], rx, ry, 0, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = '#c8a030'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(e0[0] + A.k * rx * 0.6, e0[1] + ry * 0.8); g.quadraticCurveTo(e0[0] + A.k * (rx + 8), e0[1] + 26, e0[0] + A.k * (rx + 2), e0[1] + 40); g.stroke(); }
      if (M.cacheoeil) { if (profile) ln(g, [side * 46, e0[1] - 12, -side * 30, e0[1] - 24], '#17130f', 3); else ln(g, [-45, e0[1] - 20 * A.k, 45, e0[1] + 2 * A.k], '#17130f', 3); g.fillStyle = '#17130f'; g.beginPath(); g.ellipse(e0[0], e0[1] + 1, ex(n) + 3, ey + 3, 0, 0, TAU); g.fill(); el(g, e0[0] - 3, e0[1] - 3, (ex(n) + 3) * 0.35, ey * 0.25, 'rgba(255,255,255,0.12)'); }
      if (M.morve) { const nx = profile ? side * 44 : f34 ? side * 19 : -3, ny = (profile ? 6 : 7) + 4.5 * L.noseH, k = (t * 0.55) % 1, len = k < 0.78 ? 2 + k * 11 : 2 + 8.6 * (1 - (k - 0.78) / 0.22); rr(g, nx - 1.7, ny, 3.4, len, 1.7, 'rgba(160,215,120,0.92)'); el(g, nx, ny + len, 2.7, 3.1, 'rgba(160,215,120,0.92)'); el(g, nx - 0.8, ny + len - 0.8, 0.9, 1.1, 'rgba(255,255,255,0.7)'); } // la guédille : elle descend, puis il renifle
      // le pansement : toujours au-dessus du même sourcil (celui de gauche à l'écran quand il nous regarde), quel que soit l'angle ; il suit le crâne au lieu d'en sortir, et on ne le voit plus quand la tête montre l'autre profil
      if (M.pansement && !(profile && side < 0)) { const px = profile ? 16 : f34 ? (side > 0 ? -3 : -35.5) : -25, pk = profile ? 0.85 : f34 && side < 0 ? 0.6 : 1;
        const kd2 = Math.hypot(vy, vx * L.skull), ko2 = side * 46 * (1 - kd2); g.save(); g.save(); g.translate(ko2, 0); g.scale(kd2, 1); skullPath(); g.restore(); g.clip(); g.translate(px, -22); g.rotate(-0.5); g.scale(pk, 1); rr(g, -9, -3.5, 18, 7, 3, '#f0d9b0'); rr(g, -3.5, -3.5, 7, 7, 1, '#e2c08c'); g.restore(); }
    }
    function skullPath() { const J = A8.JAWS[L.jaw] || A8.JAWS.rond, jw = J.jw, jb = J.jb, cx = J.c[0], cy = J.c[1]; /* le bas du visage change selon la forme choisie ; même visage avant et après l'évolution */ g.beginPath(); g.moveTo(0, -40); g.bezierCurveTo(34, -40, 48, -16, 46, 10); g.bezierCurveTo(cx, cy, jw, jb, 0, jb); g.bezierCurveTo(-jw, jb, -cx, cy, -46, 10); g.bezierCurveTo(-48, -16, -34, -40, 0, -40); g.closePath(); }
    function clsFace() {
      const eyesAt = profile ? [[side * 23, -4]] : f34b() ? [[side * 4, -3], [side * 31, -3]] : [[-18, -3], [18, -3]];
      if (cls === 'chaman') eyesAt.forEach(e => { rr(g, e[0] - 6, 12, 12, 3, 1.5, '#2dd4bf'); rr(g, e[0] - 4, 17, 8, 2.6, 1.3, '#2dd4bf'); });
      if (cls === 'hob') { const k = profile ? side : f34b() ? side : 1, x = profile ? side * 12 : f34b() ? -side * 12 : 30, y = 14, col = 'rgba(120,52,40,0.8)'; ln(g, [x - k * 6, y - 4, x + k * 7, y + 5], col, 2.6); ln(g, [x - k * 2.5, y - 5, x - k * 4.5, y + 0.5], col, 1.8); ln(g, [x + k * 3.5, y - 1.5, x + k * 1.5, y + 4.5], col, 1.8); }
    }
    function masque() { g.save(); skullPath(); g.clip(); g.fillStyle = '#2c2840'; g.fillRect(-60, 12, 120, 40); g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(-60, 12, 120, 2.5); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-60, 24, 120, 2); g.restore(); }
    function clsHat(hx, front) {
      const cx = vx * 26;
      if (cls === 'lord') { // couronne d'or et rubis
        const gold = '#f0c030', goldD = '#c8962e';
        [-32, -16, 0, 16, 32].forEach((x, i) => { const hh = i === 2 ? 22 : i % 2 ? 13 : 17; pl(g, [x - 9, -32, x, -34 - hh, x + 9, -32], i % 2 ? goldD : gold); el(g, x, -35 - hh, 3.2, 3.2, i === 2 ? '#e8302a' : gold); });
        rr(g, -42, -37, 84, 13, 4, gold); rr(g, -42, -28, 84, 4, 2, goldD); g.save(); g.beginPath(); g.rect(-42, -37, 84, 13); g.clip(); el(g, -vx * 26 - 14, -36, 16, 5, 'rgba(255,255,255,0.4)'); g.restore();
        if (front) { el(g, cx, -31, 5, 5.5, '#e8302a'); el(g, cx - 1.4, -32.5, 1.6, 1.6, 'rgba(255,255,255,0.85)'); [-1, 1].forEach(k => el(g, cx + k * 18, -31, 3, 3.4, '#3aa8e8')); }
      } else if (cls === 'chaman') { // crâne à cornes, gemme et plumes turquoise
        [-0.45, 0, 0.45].forEach((a, i) => { g.save(); g.translate(hx + a * 26, -42); g.rotate(a + Math.sin(t * 2.4 + i) * 0.05); el(g, 0, -20, 6, 18, i === 1 ? '#2dd4bf' : '#14a89a'); ln(g, [0, 0, 0, -36], '#0f766e', 1.6); el(g, 0, -34, 4, 5, '#f4ead0'); g.restore(); });
        [-1, 1].forEach(k => { g.strokeStyle = '#e8dcc0'; g.lineCap = 'round'; g.lineWidth = 10; g.beginPath(); g.moveTo(k * 30, -32); g.quadraticCurveTo(k * 58, -34, k * 56, -58); g.stroke(); g.lineWidth = 5; g.strokeStyle = '#c8b890'; g.beginPath(); g.moveTo(k * 56, -56); g.lineTo(k * 54, -66); g.stroke(); });
        el(g, front ? cx * 0.5 : 0, -35, 24, 15, '#f4ead0');
        if (front) { const sxk = cx * 0.5; rr(g, sxk - 12, -27, 24, 8, 3, '#e8dcc0'); el(g, sxk - 9, -35, 5.5, 6, '#3a2a66'); el(g, sxk + 9, -35, 5.5, 6, '#3a2a66'); pl(g, [sxk - 2.5, -28, sxk, -33, sxk + 2.5, -28], '#3a2a66'); el(g, sxk, -45, 4.5, 4.5, '#2dd4bf'); el(g, sxk, -45, 8, 8, 'rgba(45,212,191,0.3)'); [-7, -2.5, 2.5, 7].forEach(x => rr(g, sxk + x - 1.4, -22, 2.8, 5, 1, '#f4ead0')); }
      } else { // capuche d'ombre
        const col = '#2c2840', bx = isBack ? -vx * 12 : -side * 40; if (!pureFront) pl(g, [bx, -34, bx - (isBack ? 0 : side * 24) + (isBack ? -10 : 0), -14 + (isBack ? 34 : 0), bx + (isBack ? 10 : side * 4), -6 + (isBack ? 20 : 0)], shade(col, 0.8));
        g.fillStyle = col; g.beginPath(); g.moveTo(-48, isBack ? 16 : -4); g.bezierCurveTo(-52, -42, -24, -51, 0, -50); g.bezierCurveTo(24, -51, 52, -42, 48, isBack ? 16 : -4); if (isBack) g.quadraticCurveTo(0, 30, -48, 16); else g.quadraticCurveTo(cx * 0.4, -30, -48, -4); g.closePath(); g.fill();
        g.save(); g.clip(); el(g, -vx * 22 - 12, -40, 16, 6, 'rgba(255,255,255,0.1)'); g.restore();
        if (!isBack) { g.strokeStyle = '#a855f7'; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(-46, -6); g.quadraticCurveTo(cx * 0.4, -30, 46, -6); g.stroke(); }
      }
    }
    // vêtements amusants (atelier de couture) : lunettes de soleil, fausse moustache, nez de clown
    function funFace() {
      const pf = !(profile || f34b()), eyesAt = profile ? [[side * 23, -4, 0.78]] : f34b() ? [[side * 4, -3, 0.96], [side * 31, -3, 0.74]] : [[-18, -3, 1], [18, -3, 1]];
      const np = profile ? [side * 45, 6] : f34b() ? [side * 21, 7] : [0, 7], mx = profile ? side * 37 : f34b() ? side * 19 : 0;
      if (fun.moustache) { const c = '#3a2414'; if (profile) { el(g, mx, 15.5, 11, 4.2, c, -side * 0.25); el(g, mx - side * 9, 18, 4, 3, c); } else { el(g, mx - 9, 15.5, 10.5, 4.4, c, 0.28); el(g, mx + 9, 15.5, 10.5, 4.4, c, -0.28); el(g, mx - 19, 12.5, 3.4, 3.4, c); el(g, mx + 19, 12.5, 3.4, 3.4, c); } }
      if (fun.clown) { el(g, np[0], np[1], 9, 9, '#e8302a'); el(g, np[0] - 2.5, np[1] - 3, 2.8, 2.2, 'rgba(255,255,255,0.7)'); }
      if (fun.lunettes) {
        g.strokeStyle = '#15151c'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); if (eyesAt.length > 1) { g.moveTo(eyesAt[0][0], -6); g.lineTo(eyesAt[1][0], -6); } else { g.moveTo(eyesAt[0][0], -6); g.lineTo(-side * 8, -8); } if (pf) { g.moveTo(-30, -6); g.lineTo(-44, -9); g.moveTo(30, -6); g.lineTo(44, -9); } g.stroke();
        eyesAt.forEach(e => { const k = e[2]; rr(g, e[0] - 13.5 * k, e[1] - 10, 27 * k, 18, 6, '#15151c'); ln(g, [e[0] - 7 * k, e[1] - 6, e[0] - 1 * k, e[1] - 6], 'rgba(255,255,255,0.55)', 2); });
      }
    }
    function f34b() { return dir.code === 'SE' || dir.code === 'SW'; }
    // coiffes des gobelines : elles laissent voir les cheveux
    function coiffe(kind, col, deco) {
      const colD = shade(col, 0.72), cx = vx * 26, front = !isBack;
      const carreaux = () => { for (let x = -48; x < 48; x += 14) { g.fillStyle = 'rgba(22,12,12,0.4)'; g.fillRect(x, -50, 6, 44); } for (let y = -46; y < -8; y += 12) { g.fillStyle = 'rgba(22,12,12,0.4)'; g.fillRect(-50, y, 100, 5); } };
      if (kind === 'foulard') {
        const kx = isBack ? -vx * 10 : -side * 42; pl(g, [kx, -16, kx - 13, -2, kx - 3, -20], col); pl(g, [kx, -16, kx + 11, 2, kx + 5, -20], colD);
        g.fillStyle = col; g.beginPath(); g.moveTo(-45, -13); g.bezierCurveTo(-47, -40, -24, -47, 0, -46); g.bezierCurveTo(24, -47, 47, -40, 45, -13); g.quadraticCurveTo(0, -24, -45, -13); g.closePath(); g.fill();
        g.save(); g.clip(); if (deco === 'carreaux') carreaux(); el(g, -vx * 22 - 10, -38, 16, 6, 'rgba(255,255,255,0.18)'); g.restore(); el(g, kx, -16, 5, 5, colD);
      } else if (kind === 'bandeau') {
        rr(g, -46, -28, 92, 10, 5, col); rr(g, -46, -21, 92, 3, 1.5, colD); const kx = isBack ? -vx * 10 : -side * 44; pl(g, [kx, -23, kx - 11, -10, kx - 3, -26], col); pl(g, [kx, -23, kx + 9, -8, kx + 5, -26], colD);
      } else if (kind === 'diademe') {
        rr(g, -45, -27, 90, 7, 3.5, col); if (front) { pl(g, [cx - 11, -26, cx, -43, cx + 11, -26], col); pl(g, [cx - 22, -26, cx - 16, -35, cx - 10, -26], col); pl(g, [cx + 22, -26, cx + 16, -35, cx + 10, -26], col); el(g, cx, -30, 4.5, 4.5, '#e8302a'); el(g, cx - 1.2, -31.4, 1.5, 1.5, 'rgba(255,255,255,0.8)'); }
      } else if (kind === 'fleur') {
        const fx = front ? -side * (profile ? 12 : 30) + (pureFront ? 0 : 0) : -vx * 20 + 26, fy = -30; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3; el(g, fx + Math.cos(a) * 7, fy + Math.sin(a) * 7, 5.5, 5.5, '#ff9ccc'); } el(g, fx, fy, 4.5, 4.5, '#ffd84a'); el(g, fx - 12, fy + 9, 6, 3, '#5aa83a', 0.5);
      }
      if (!front) return;
      if (deco === 'plume') { g.save(); g.translate(-side * 26 * (profile ? 0.4 : 1), -26); g.rotate(-side * 0.45); el(g, 0, -16, 5, 17, '#f1ead8'); ln(g, [0, 0, 0, -30], '#b8a888', 1.5); g.restore(); }
      else if (deco === 'lampe') { el(g, cx, -23, 8, 8, '#5a5e68'); el(g, cx, -23, 5.5, 5.5, '#fff7c0'); }
      else if (deco === 'gemme') { el(g, cx, -23, 5.5, 5.5, '#7ad0ff'); el(g, cx - 1.5, -24.5, 1.8, 1.8, 'rgba(255,255,255,0.8)'); }
      else if (deco === 'croix') { el(g, cx, -31, 8, 8, '#fff'); rr(g, cx - 1.8, -36.5, 3.6, 11, 1, '#3f9a3a'); rr(g, cx - 5.5, -32.8, 11, 3.6, 1, '#3f9a3a'); }
    }
    function hat() {
      const job = HJ, hx = vx * 4, front = !isBack; // le chapeau porté n'est pas forcément celui du métier du moment
      if (fun.hautforme) { rr(g, hx - 25, -86, 50, 44, 5, '#1c1c24'); rr(g, hx - 25, -86, 16, 44, 5, 'rgba(255,255,255,0.09)'); rr(g, hx - 25, -54, 50, 9, 2, '#c23a2a'); el(g, hx, -43, 40, 8.5, '#1c1c24'); el(g, hx, -45, 30, 4, 'rgba(255,255,255,0.07)'); return; }
      if (cls === 'lord' || cls === 'chaman' || cls === 'assassin') { clsHat(hx, front); return; }
      if (cls === 'loup') { coiffe('bandeau', '#38a8e8', 'plume'); return; }
      if (o.noHat) { /* pas de chapeau : tête nue */ if (!hasHair) { const h = vx * 4; g.strokeStyle = C.deep; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-3 + h, -40); g.quadraticCurveTo(-8 + h, -50, -1 + h, -52); g.moveTo(2 + h, -40); g.quadraticCurveTo(8 + h, -51, 13 + h, -47); g.stroke(); } return; }
      if (fem && COIFFES[job]) { const c = COIFFES[job]; coiffe(c[0], job === 'garde' && o.elite ? '#e8c84a' : c[1], c[2]); return; }
      if (job === 'chef') { g.save(); g.translate(0, 9); g.scale(1.1, 1); /* le bandeau descend sur le front, juste au-dessus des sourcils */ const fe = (x, a, c, h) => { g.save(); g.translate(hx + x, -40); g.rotate(a + Math.sin(t * 2.5 + x) * 0.04); g.fillStyle = c; g.beginPath(); g.ellipse(0, -h / 2, 8, h / 2, 0, 0, TAU); g.fill(); ln(g, [0, 0, 0, -h + 4], 'rgba(255,255,255,0.75)', 1.6); el(g, 0, -h + 6, 5, 6, shade(c, 0.45)); g.restore(); }; const k = profile ? 0.45 : 1; fe(-22 * k, -0.5 * k, '#e2b93b', 40); fe(22 * k, 0.5 * k, '#e2b93b', 40); fe(0, 0, '#d8402a', 56); rr(g, -40, -42, 80, 12, 5, '#6b4424'); for (let i = -3; i <= 3; i++) pl(g, [hx + i * 10 - 4, -31, hx + i * 10, -40, hx + i * 10 + 4, -31], '#e2b93b'); if (front) { el(g, vx * 26, -36, 5.5, 5.5, '#2a1c10'); el(g, vx * 26, -36, 4, 4, '#5fe0d8'); }  g.restore(); }
      else if (job === 'garde') { const m = o.elite ? '#e8c84a' : '#b8bcc8', md = o.elite ? '#b8922a' : '#8a8e98';
        if (o.elite) { const px = -side * (profile ? 26 : Math.abs(vx) > 0.1 ? 18 : 0), fl = Math.sin(t * 4) * 3; g.fillStyle = '#d8402a'; g.beginPath(); g.moveTo(hx - 6, -44); g.quadraticCurveTo(hx - 4, -84, px * 1.4 + fl - (px ? 0 : 20), -66); g.quadraticCurveTo(hx + 6 + px * 0.5, -62, hx + 8, -44); g.closePath(); g.fill(); }
        g.fillStyle = m; g.beginPath(); g.moveTo(-45, -6); g.bezierCurveTo(-48, -34, -30, -46, 0, -46); g.bezierCurveTo(30, -46, 48, -34, 45, -6); g.closePath(); g.fill(); rr(g, -47, -12, 94, 9, 4, md); if (front) rr(g, vx * 26 - 4, -12, 8, 22, 3, md); el(g, -vx * 10 - 12, -32, 10, 5, 'rgba(255,255,255,0.4)', -0.4); if (!o.elite) pl(g, [hx - 5, -44, hx, -60, hx + 5, -44], '#d8402a'); else { el(g, hx, -45, 7, 5, md); if (front) el(g, vx * 26, -22, 4.5, 4.5, '#d8402a'); } }
      else if (job === 'bucheron') { g.fillStyle = '#3f4a5a'; g.beginPath(); g.moveTo(-44, -12); g.bezierCurveTo(-44, -44, -20, -52, 0, -50); g.bezierCurveTo(24, -52, 44, -40, 44, -12); g.closePath(); g.fill(); rr(g, -46, -18, 92, 13, 6, '#b8322a'); const px = -vx * 16 + Math.sin(t * 4) * 2; ln(g, [hx, -50, px + 16, -58], '#3f4a5a', 9); el(g, px + 22, -58, 8, 8, '#b8322a'); }
      else if (job === 'mineur') { g.fillStyle = '#d8a02a'; g.beginPath(); g.moveTo(-44, -10); g.bezierCurveTo(-46, -38, -26, -48, 0, -48); g.bezierCurveTo(26, -48, 46, -38, 44, -10); g.closePath(); g.fill(); rr(g, -49, -14, 98, 8, 4, '#b07c18'); rr(g, hx - 5, -48, 10, 34, 4, '#b07c18'); if (front) { el(g, vx * 28, -26, 8, 8, '#5a5e68'); el(g, vx * 28, -26, 5.5, 5.5, '#fff7c0'); } }
      else if (job === 'chasseur') { g.fillStyle = '#4f6a34'; g.beginPath(); g.moveTo(-45, -8); g.bezierCurveTo(-46, -36, -24, -46, 0, -46); g.bezierCurveTo(24, -46, 46, -36, 45, -8); g.closePath(); g.fill(); rr(g, -47, -14, 94, 8, 4, '#3a4f26'); g.save(); g.translate(-side * 24 * (profile ? 0.3 : 1), -40); g.rotate(-side * 0.5); el(g, 0, -16, 5, 18, '#e8e0c8'); ln(g, [0, 0, 0, -30], '#b8a888', 1.5); g.restore(); }
      else if (job === 'cueilleur' && !fem) { /* le cueilleur : une casquette de paysan, visière du côté où il regarde */ g.fillStyle = '#8a7a3e'; g.beginPath(); g.moveTo(-44, -12); g.bezierCurveTo(-47, -40, -22, -50, 0, -49); g.bezierCurveTo(24, -50, 47, -40, 44, -12); g.closePath(); g.fill(); g.save(); g.clip(); el(g, -vx * 26 - 10, -40, 16, 7, 'rgba(255,255,255,0.16)'); ln(g, [hx, -49, hx - 20, -14], 'rgba(0,0,0,0.13)', 2); ln(g, [hx, -49, hx + 20, -14], 'rgba(0,0,0,0.13)', 2); g.restore(); rr(g, -45, -18, 90, 7, 3, '#6a5c2c'); el(g, hx, -49, 4.5, 3, '#6a5c2c'); if (front) { if (profile) el(g, side * 48, -13, 21, 5.5, '#5a4e24'); else el(g, vx * 34, -15, 31 - Math.abs(vx) * 7, 6, '#5a4e24'); } }
      else if (job === 'cueilleur') { el(g, hx, -22, 66, 13, '#d9b866'); el(g, hx, -22, 66, 13, 'rgba(0,0,0,0.0)'); g.fillStyle = '#e6c97a'; g.beginPath(); g.moveTo(-32 + hx, -24); g.bezierCurveTo(-32 + hx, -52, 32 + hx, -52, 32 + hx, -24); g.closePath(); g.fill(); rr(g, -32 + hx, -31, 64, 7, 3, fem ? '#b8587a' : '#5a8a3a'); if (front) { el(g, vx * 22 + (pureFront ? -16 : 0), -30, 5.5, 5.5, '#fff'); el(g, vx * 22 + (pureFront ? -16 : 0), -30, 2.4, 2.4, '#ffd23a'); } }
      else if (job === 'forgeron') { g.fillStyle = '#8a2a22'; g.beginPath(); g.moveTo(-46, -8); g.bezierCurveTo(-46, -38, -22, -44, 0, -44); g.bezierCurveTo(22, -44, 46, -38, 46, -8); g.bezierCurveTo(20, -18, -20, -18, -46, -8); g.closePath(); g.fill(); const kx = isBack ? -vx * 20 : -side * 44; if (isBack || !pureFront) { pl(g, [kx, -14, kx - 14, -2, kx - 4, -18], '#8a2a22'); pl(g, [kx, -14, kx + 12, 2, kx + 6, -16], '#6e2019'); el(g, kx, -14, 5, 5, '#6e2019'); } }
      else if (job === 'arcier') { g.fillStyle = '#3f7a5a'; g.beginPath(); g.moveTo(-44, -12); g.bezierCurveTo(-40, -42, -10, -50, 6 + hx, -48); g.bezierCurveTo(30, -46, 46, -30, 44, -12); g.closePath(); g.fill(); pl(g, [side * 30, -16, side * 64, -10, side * 34, -28], isBack ? '#3f7a5a' : '#356a4c'); rr(g, -46, -18, 92, 8, 4, '#2c5a40'); g.save(); g.translate(-side * 20, -40); g.rotate(-side * 0.7); el(g, 0, -16, 5, 17, '#d8402a'); g.restore(); }
      else if (job === 'tanneur') { g.fillStyle = '#8a5a30'; g.beginPath(); g.moveTo(-45, -6); g.bezierCurveTo(-47, -36, -24, -45, 0, -45); g.bezierCurveTo(24, -45, 47, -36, 45, -6); g.closePath(); g.fill(); rr(g, -46, -12, 92, 7, 3, '#6b4424'); el(g, -40, 2, 7, 12, '#8a5a30'); el(g, 40, 2, 7, 12, '#8a5a30'); g.setLineDash([3, 4]); ln(g, [hx, -44, hx, -12], '#d6b485', 1.8); g.setLineDash([]); }
      else if (job === 'guerisseur') { rr(g, -46, -24, 92, 10, 5, '#f1ead8'); for (let i = -3; i <= 3; i++) { g.save(); g.translate(i * 13 + hx, -26); g.rotate(i * 0.22); el(g, 0, -8, 5, 10, i % 2 ? '#5aa84a' : '#7cc45e'); g.restore(); } if (front) { el(g, vx * 26, -19, 6, 6, '#fff'); rr(g, vx * 26 - 1.5, -23, 3, 8, 1, '#3f9a3a'); rr(g, vx * 26 - 4, -20.5, 8, 3, 1, '#3f9a3a'); } }
      else if (job === 'eclaireur') { g.fillStyle = '#2f5a5a'; g.beginPath(); g.moveTo(-45, -8); g.bezierCurveTo(-47, -38, -24, -47, 0, -47); g.bezierCurveTo(24, -47, 47, -38, 45, -8); g.closePath(); g.fill(); rr(g, -47, -15, 94, 9, 4, '#e0b060'); pl(g, [-side * 40, -12, -side * 62, -2, -side * 58, -16], '#e0b060'); pl(g, [-side * 40, -8, -side * 56, 10, -side * 48, -8], '#c8963e'); if (front) el(g, vx * 26, -10.5, 5, 5, '#fff7c0'); }
      else if (!fem) { const h = vx * 4; g.strokeStyle = C.deep; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-3 + h, -40); g.quadraticCurveTo(-8 + h, -50, -1 + h, -52); g.moveTo(2 + h, -40); g.quadraticCurveTo(8 + h, -51, 13 + h, -47); g.stroke(); }
    }
  };

  // ---------- branchement dans le jeu : remplace l'ancien dessin gauche / droite ----------
  const Art = CG.Art, FLIP = { E: 'W', W: 'E', SE: 'SW', SW: 'SE', NE: 'NW', NW: 'NE', S: 'S', N: 'N' }, KNOWN = { hache: 1, pioche: 1, marteau: 1, epee: 1, lance: 1, baton: 1, arc: 1, couteau: 1, panier: 1, herbes: 1 };
  Art.goblinOld = Art.goblin;
  Art.goblin = function (g, o) {
    const e = o.ent, face = o.face < 0 ? -1 : 1; let dir = o.dir;
    if (e) {
      if (e._px !== undefined && o.moving) { const dx = e.x - e._px, dy = e.y - e._py; if (dx * dx + dy * dy > 0.04) e.dir8 = A8.dirFrom(dx, dy); }
      e._px = e.x; e._py = e.y; if (!e.dir8) e.dir8 = 'S';
      if (!o.moving) { if (o.pose === 'work' || o.atk > 0.02) e.dir8 = face < 0 ? 'W' : 'E'; else if (A8.DIRS[e.dir8].vx * face < -0.1) e.dir8 = FLIP[e.dir8]; }
      dir = e.dir8; if (!e.look && !o.chief) e.look = A8.randomLook(e);
    }
    if (!dir) dir = o.moving ? (face < 0 ? 'W' : 'E') : 'S';
    let pose = 'idle', p, tool = o.tool && KNOWN[o.tool] ? o.tool : (o.tool === null || o.tool === undefined || !KNOWN[o.tool] ? null : o.tool);
    if (o.atk > 0.02) { pose = 'attack'; p = Math.max(0.3, Math.min(0.99, 0.3 + (1 - o.atk) * 0.7)); }
    else if (o.pose === 'work') pose = tool === 'hache' ? 'chop' : tool === 'pioche' ? 'mine' : tool === 'marteau' ? 'build' : 'gather';
    else if (o.pose) pose = A8.POSES[o.pose] || o.pose === 'drink' || o.pose === 'drum' ? o.pose : 'idle';
    else if (o.moving) pose = 'walk';
    if (e && e.cls === 'loup') tool = 'lance';
    if (o.alpha !== undefined) { g.save(); g.globalAlpha = o.alpha; }
    A8.goblin(g, { noLegs: o.noLegs, noZ: o.noZ, headMul: o.headMul || (e && e.bigK) || 0, noHat: o.noHat !== undefined ? o.noHat : o.chief ? !(CG.S && CG.S.chefHat) : !(o.hatJob || (e && e.hat)), hatJob: o.hatJob || (e && e.hat) || undefined, fun: o.fun || (o.chief ? (CG.S && CG.S.chefFun) : (e && e.fun)), x: o.x, y: o.y, scale: 0.24 * (o.s || 1), dir, t: o.t, pose, p, walk: (o.step || 0) * TAU, job: o.job, chief: o.chief, sex: o.sex, tool: pose === 'chop' || pose === 'mine' || pose === 'build' ? tool : (o.chief && !o.tool ? null : tool), carry: o.carry, armor: !!(o.equip && o.equip.armure), elite: !!o.elite && !o.chief,
      look: o.look || (e && e.look) || (o.chief ? A8.chiefLook() : null), hue: o.hue, pierre: o.pierre, cls: o.cls || (o.chief ? (CG.Evo && CG.Evo.chefCls()) : (e && (e.cls || (e.nomme ? 'hob' : null)))) || null, evolved: o.evolved || !!(e && e.nomme) });
    if (o.alpha !== undefined) g.restore();
  };

  // outil tenu dans la main (repère : la main, bras vers le bas). up = pendant un coup, l'outil pointe vers l'extérieur
  function drawTool(g, tool, vx, t, up) {
    g.save(); if (!up) g.rotate(vx >= 0 ? -0.65 : 0.65); const s = vx >= 0 ? 1 : -1;
    const handle = (len, c, w) => { g.strokeStyle = c || '#8c5832'; g.lineWidth = w || 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 8); g.lineTo(0, -len); g.stroke(); };
    if (tool === 'hache') { handle(46); g.fillStyle = '#aeb4c0'; g.beginPath(); g.moveTo(0, -46); g.quadraticCurveTo(s * 26, -52, s * 24, -30); g.quadraticCurveTo(s * 12, -34, 0, -32); g.closePath(); g.fill(); g.fillStyle = '#e4e8f0'; g.beginPath(); g.moveTo(s * 20, -49); g.quadraticCurveTo(s * 27, -42, s * 24, -30); g.lineTo(s * 19, -33); g.closePath(); g.fill(); }
    else if (tool === 'pioche') { handle(48); g.strokeStyle = '#8a8e98'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-24, -36); g.quadraticCurveTo(0, -56, 24, -36); g.stroke(); }
    else if (tool === 'marteau') { handle(36); rr(g, -13, -46, 26, 15, 4, '#7a7e88'); rr(g, -13, -46, 26, 5, 3, '#a8acb8'); }
    else if (tool === 'epee') { handle(8, '#5e381d', 6); rr(g, -10, -11, 20, 5, 2, '#d8a02a'); g.fillStyle = '#d5dae4'; g.beginPath(); g.moveTo(-5, -11); g.lineTo(-4, -50); g.lineTo(0, -58); g.lineTo(4, -50); g.lineTo(5, -11); g.closePath(); g.fill(); g.strokeStyle = '#9aa0ac'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -12); g.lineTo(0, -52); g.stroke(); }
    else if (tool === 'lance') { handle(64, '#8c5832', 5); g.fillStyle = '#c8ccd6'; g.beginPath(); g.moveTo(-6, -62); g.lineTo(0, -82); g.lineTo(6, -62); g.closePath(); g.fill(); }
    else if (tool === 'baton' && CG.G && CG.G.tech && CG.G.tech('g4')) { /* le bâton évolué (Coup tournoyant) : manche sombre cerclé d'or, deux crocs dorés qui serrent un gros cristal, des éclats qui tournent autour */
      handle(72, '#4a2c1a', 7); rr(g, -5, -24, 10, 5, 2, '#e0b040'); rr(g, -5, -48, 10, 5, 2, '#e0b040'); g.fillStyle = '#c8ccd6'; g.beginPath(); g.moveTo(-4, 8); g.lineTo(0, 20); g.lineTo(4, 8); g.closePath(); g.fill();
      g.strokeStyle = '#e0b040'; g.lineWidth = 5.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -64); g.quadraticCurveTo(-24, -70, -15, -98); g.moveTo(0, -64); g.quadraticCurveTo(24, -70, 15, -98); g.stroke();
      g.strokeStyle = '#fff0b0'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-3, -66); g.quadraticCurveTo(-21, -72, -15, -94); g.stroke();
      const gl = 13 + Math.sin(t * 4) * 1.5; el(g, 0, -82, gl + 8, gl + 8, 'rgba(176,112,255,0.26)'); g.fillStyle = '#b070ff'; g.beginPath(); g.moveTo(0, -82 - gl - 5); g.lineTo(gl, -82); g.lineTo(0, -82 + gl + 3); g.lineTo(-gl, -82); g.closePath(); g.fill();
      g.fillStyle = '#d8b0ff'; g.beginPath(); g.moveTo(0, -82 - gl - 5); g.lineTo(gl, -82); g.lineTo(0, -82); g.closePath(); g.fill(); el(g, -3.5, -88, 3.2, 4.2, '#f8f0ff');
      for (let i = 0; i < 3; i++) { const b = t * 2.6 + i * 2.094, x = Math.cos(b) * 23, y = -82 + Math.sin(b) * 8, k = 0.6 + Math.sin(b) * 0.4; g.fillStyle = 'rgba(255,227,107,' + (0.45 + k * 0.45) + ')'; g.beginPath(); g.moveTo(x, y - 4.5 * k); g.lineTo(x + 2.8 * k, y); g.lineTo(x, y + 4.5 * k); g.lineTo(x - 2.8 * k, y); g.closePath(); g.fill(); } }
    else if (tool === 'baton') { handle(70, '#7a4a26', 6); const gl = 12 + Math.sin(t * 4) * 1.5; el(g, 0, -76, gl + 5, gl + 5, 'rgba(176,112,255,0.3)'); el(g, 0, -76, gl, gl, '#b070ff'); el(g, -3, -80, 4, 4, '#f0e0ff'); }
    else if (tool === 'arc') { g.strokeStyle = '#8a5a2a'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.arc(-s * 10, -6, 34, s > 0 ? -1.15 : Math.PI - 1.15, s > 0 ? 1.15 : Math.PI + 1.15); g.stroke(); g.strokeStyle = '#eee'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-s * 10 + s * Math.cos(1.15) * 34, -6 - Math.sin(1.15) * 34); g.lineTo(-s * 10 + s * Math.cos(1.15) * 34, -6 + Math.sin(1.15) * 34); g.stroke(); }
    else if (tool === 'couteau') { handle(6, '#5e381d', 6); g.fillStyle = '#d5dae4'; g.beginPath(); g.moveTo(-4, -8); g.lineTo(s * 5, -30); g.lineTo(4, -8); g.closePath(); g.fill(); }
    else if (tool === 'panier') { g.rotate(vx >= 0 ? 0.65 : -0.65); g.strokeStyle = '#8a5a2a'; g.lineWidth = 3; g.beginPath(); g.arc(0, 12, 14, Math.PI, 0); g.stroke(); g.fillStyle = '#c9a56b'; g.beginPath(); g.moveTo(-17, 12); g.lineTo(17, 12); g.lineTo(13, 32); g.lineTo(-13, 32); g.closePath(); g.fill(); rr(g, -18, 10, 36, 6, 3, '#a8854a'); [['#d8402a', -8], ['#5a6ad8', 0], ['#d8402a', 8]].forEach(b => el(g, b[1], 9, 4.5, 4.5, b[0])); }
    else if (tool === 'herbes') { g.rotate(vx >= 0 ? 0.65 : -0.65); for (let i = -1; i <= 1; i++) { g.save(); g.rotate(i * 0.4); ln(g, [0, 4, 0, -18], '#3f7a2a', 2.5); el(g, 0, -22, 5, 9, i ? '#5aa84a' : '#7cc45e'); g.restore(); } }
    g.restore();
  }
})(window.CG);
