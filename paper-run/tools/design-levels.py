# Générateur des tableaux de Paper Run : chaque tableau est une suite de segments (chunks) posés bout à bout,
# avec un souterrain optionnel (rangées 15-29) relié par des tuyaux. Écrit js/levels.js.
# Usage : python3 tools/design-levels.py        puis   BUILD=1 node tools/test-levels.cjs
import json, os, random

G = 11            # rangée du sol du monde d'en haut (sol = rangées 11-14)
U = 26            # rangée du plancher du souterrain (plancher = rangées 26-29) ; plafond = rangée 15
UNDER = 15
H = 30

class L:
    def __init__(s, id, world, name, tip, seed):
        s.id, s.world, s.name, s.tip = id, world, name, tip
        s.g = [['.'] * 600 for _ in range(H)]; s.w = 0; s.ox = 0; s.r = random.Random(seed); s.under_spans = []; s.pipe_ids = iter('123456789')
    def put(s, r, c, ch):
        c += s.ox
        if 0 <= r < H and 0 <= c < 600: s.g[r][c] = ch; s.w = max(s.w, c + 1)
    def fill(s, r0, r1, c0, c1, ch):
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1): s.put(r, c, ch)
    def ground(s, c0, c1, top=G, bottom=14): s.fill(top, bottom, c0, c1, '#')
    def ink(s, c0, c1, top=13, bottom=14): s.fill(top, bottom, c0, c1, '~')
    def spikes(s, c0, c1, r=G):
        for c in range(c0, c1 + 1): s.put(r, c, '^')
    def plat(s, r, c0, c1, ch='-'):
        for c in range(c0, c1 + 1): s.put(r, c, ch)
    def block(s, r, c0, c1, rows=1): s.fill(r, r + rows - 1, c0, c1, '#')
    def coins(s, r, c0, c1, step=1, ch='o'):
        for c in range(c0, c1 + 1, step): s.put(r, c, ch)
    def arc(s, c0, c1, top=8):            # arc de pièces au-dessus d'un trou
        n = c1 - c0
        for i, c in enumerate(range(c0, c1 + 1)):
            s.put(top + 1 - (1 if 0 < i < n else 0), c, 'o')
    def rows(s):
        return [''.join(r[:s.w]).rstrip('.') or '.' for r in s.g]

# Ennemis au sol par monde (le générateur pige dedans)
GROUND_ENEMIES = {'prairie': 'eej', 'foret': 'eejg', 'ciseaux': 'kgek', 'chateau': 'gkke', 'ciel': 'ejj'}
DECOR = {'prairie': 'TBBT', 'foret': 'TTTB', 'ciseaux': 'B', 'chateau': '', 'ciel': 'B'}
def enemy(l): return l.r.choice(GROUND_ENEMIES[l.world])
def deco(l, c, r=G - 1):
    d = DECOR[l.world]
    if d and l.r.random() < 0.6: l.put(r, c, l.r.choice(d))

# ---------------------------------------------------------------- segments (retournent leur largeur)
def c_start(l, x):
    l.ground(x, x + 15); l.put(G - 1, x + 5, 'S'); l.put(G - 2, x + 12, '?'); deco(l, x + 2); deco(l, x + 9); return 16
def c_flat(l, x, n=12):
    l.ground(x, x + n - 1); l.coins(G - 2, x + 3, x + n - 4, 2)
    if n >= 12: l.put(G - 1, x + n // 2, enemy(l))
    deco(l, x + 1); return n
def c_gap(l, x, gap=4):
    l.ground(x, x + 3); l.ground(x + 4 + gap, x + gap + 10); l.arc(x + 4, x + 3 + gap, G - 3); deco(l, x + gap + 8); return gap + 11
def c_double_gap(l, x):
    l.ground(x, x + 3); l.ground(x + 8, x + 10); l.ground(x + 15, x + 20); l.arc(x + 4, x + 7, G - 3); l.arc(x + 11, x + 14, G - 3); l.put(G - 2, x + 9, '?'); return 21
def c_hill(l, x):
    l.ground(x, x + 17); l.block(G - 2, x + 4, x + 7, 2); l.block(G - 4, x + 9, x + 12, 4); l.coins(G - 3, x + 5, x + 6); l.coins(G - 5, x + 10, x + 11); l.put(G - 1, x + 15, enemy(l)); return 18
def c_steps(l, x):
    l.ground(x, x + 19)
    for i in range(3): l.block(G - 1 - i, x + 3 + 2 * i, x + 4 + 2 * i, i + 1)
    l.block(G - 3, x + 9, x + 13, 3); l.coins(G - 4, x + 10, x + 12); l.put(G - 4, x + 11, '?' if l.r.random() < 0.5 else 'o'); l.put(G - 1, x + 17, enemy(l)); return 20
def c_plats(l, x):
    l.ground(x, x + 23); l.plat(G - 3, x + 3, x + 7); l.coins(G - 4, x + 4, x + 6, 2); l.plat(G - 6, x + 9, x + 13); l.coins(G - 7, x + 10, x + 12, 2)
    l.block(G - 3, x + 16, x + 19); l.coins(G - 4, x + 17, x + 18); l.put(G - 7, x + 11, '?'); l.put(G - 1, x + 14, enemy(l)); deco(l, x + 21); return 24
def c_enemies(l, x):
    l.ground(x, x + 17)
    for c in (x + 4, x + 9, x + 14): l.put(G - 1, c, enemy(l))
    l.coins(G - 3, x + 3, x + 15, 3); return 18
def c_spring(l, x):
    l.ground(x, x + 5); l.put(G - 1, x + 4, 's'); l.ground(x + 12, x + 19); l.coins(G - 7, x + 6, x + 11, 1); l.block(G - 8, x + 7, x + 10); l.put(G - 9, x + 8, '*'); deco(l, x + 17); return 20
def c_spikes(l, x):
    l.ground(x, x + 15); n = l.r.choice((3, 4)); l.spikes(x + 5, x + 4 + n); l.plat(G - 3, x + 4, x + 5 + n); l.coins(G - 4, x + 5, x + 4 + n, 2); l.put(G - 1, x + 12, enemy(l)); return 16
def c_ink_mover(l, x):
    l.ground(x, x + 3); l.ink(x + 4, x + 11, 12); l.put(G, x + 4, 'm'); l.coins(G - 2, x + 6, x + 9, 3); l.ground(x + 10, x + 17); deco(l, x + 15); return 18
def c_ice(l, x):
    l.ground(x, x + 1); l.fill(G, G, x + 2, x + 9, 'I'); l.ground(x + 2, x + 9, G + 1); l.ground(x + 13, x + 14); l.fill(G, G, x + 15, x + 22, 'I'); l.ground(x + 15, x + 22, G + 1); l.ground(x + 23, x + 25)
    l.arc(x + 10, x + 12, G - 3); l.coins(G - 2, x + 3, x + 8, 2); l.coins(G - 2, x + 16, x + 21, 2); l.put(G - 1, x + 19, 'k' if l.world in ('ciseaux', 'chateau') else 'e'); return 26
def c_ice_rink(l, x):
    l.ground(x, x + 1); l.fill(G, G, x + 2, x + 19, 'I'); l.ground(x + 2, x + 19, G + 1); l.ground(x + 20, x + 21)
    l.block(G - 1, x + 7, x + 7); l.block(G - 1, x + 13, x + 13); l.coins(G - 2, x + 3, x + 18, 3); l.put(G - 3, x + 10, '?'); return 22
def c_check(l, x):
    l.ground(x, x + 7); l.put(G - 1, x + 3, 'c'); l.put(G - 2, x + 6, '?'); return 8
def c_finish(l, x):
    l.ground(x, x + 15); l.block(G - 1, x + 9, x + 15); l.put(G - 2, x + 12, 'F'); l.coins(G - 2, x + 3, x + 7, 2); deco(l, x + 2); return 16
def gate_ciseaux(l, x):
    """Mur de papier 7 de haut ; détour par deux plateformes puis le dessus du mur."""
    l.ground(x, x + 17); X = x + 13
    l.fill(G - 7, G - 1, X, X + 1, '%'); l.plat(G - 3, X - 10, X - 7); l.plat(G - 6, X - 6, X - 3); l.coins(G - 4, X - 9, X - 7, 2); l.coins(G - 7, X - 5, X - 3, 2); l.put(G - 2, X - 11, '?'); return 18
def gate_double(l, x):
    """Falaise 5 de haut : double saut tout droit, sinon escalier de plateformes."""
    l.ground(x, x + 15); X = x + 11
    l.fill(G - 5, G - 1, X, X + 1, '#'); l.plat(G - 3, X - 8, X - 5); l.plat(G - 5, X - 4, X - 2); l.coins(G - 4, X - 7, X - 5, 2); l.coins(G - 6, X - 3, X - 2); l.put(G - 6, X, '?'); return 16
def gate_elan(l, x):
    """Fosse de 6 : l'élan passe au-dessus, sinon descendre, sauter les punaises, remonter."""
    l.ground(x, x + 15); X = x + 5
    l.fill(G, G + 1, X, X + 5, '.'); l.spikes(X + 2, X + 3, G + 1); l.coins(G - 3, X + 1, X + 4, 3); l.put(G - 2, x + 13, '?'); return 16
def gate_shaft(l, x):
    """Puits à saut mural (Ruban) vers une ligne haute et droite ; en bas, un chemin lent."""
    l.ground(x, x + 35)
    l.fill(3, 8, x + 4, x + 5, '#'); l.fill(3, 8, x + 8, x + 9, '#')            # les deux murs du puits (x+6..x+7)
    l.coins(7, x + 6, x + 7); l.coins(5, x + 6, x + 7); l.plat(2, x + 10, x + 30); l.coins(1, x + 11, x + 29, 3); l.put(1, x + 20, '?')
    # chemin lent sous la ligne
    l.block(G - 2, x + 12, x + 14, 2); l.spikes(x + 17, x + 19); l.plat(G - 3, x + 16, x + 20); l.block(G - 2, x + 23, x + 25, 2); l.put(G - 1, x + 28, enemy(l)); l.spikes(x + 30, x + 32); l.plat(G - 3, x + 29, x + 33)
    return 36
def c_cannon(l, x):
    l.ground(x, x + 19); l.block(G - 2, x + 9, x + 10, 2); l.put(G - 3, x + 9, 'C'); l.coins(G - 3, x + 3, x + 6); l.coins(G - 3, x + 13, x + 16); l.put(G - 1, x + 16, enemy(l)); return 20
def c_spider(l, x):
    l.ground(x, x + 17); l.block(G - 6, x + 4, x + 13); l.put(G - 5, x + 6, 'a'); l.put(G - 5, x + 11, 'a'); l.coins(G - 2, x + 5, x + 12, 2); l.put(G - 7, x + 8, '?'); return 18
def c_jumpers(l, x):
    l.ground(x, x + 15); l.put(G - 1, x + 5, 'j'); l.put(G - 1, x + 10, 'j'); l.coins(G - 4, x + 3, x + 12, 3); return 16
def c_eraser(l, x):
    l.ground(x, x + 21); l.put(G - 1, x + 15, 'g'); l.coins(G - 2, x + 3, x + 11, 2); l.plat(G - 3, x + 12, x + 16); l.put(G - 4, x + 14, '?'); return 22
def c_spiky_ledge(l, x):
    l.ground(x, x + 15); l.block(G - 1, x + 6, x + 10); l.put(G - 2, x + 8, 'k'); l.coins(G - 3, x + 6, x + 10, 2); l.plat(G - 4, x + 5, x + 11); return 16
def c_plant_pipes(l, x):
    l.ground(x, x + 17)
    for c in (x + 4, x + 11): l.put(G - 1, c, 'p'); l.put(G - 1, c + 1, '0'); l.fill(G, G + 1, c, c + 1, '|')
    l.arc(x + 6, x + 9, G - 4); l.coins(G - 3, x + 14, x + 16); return 18
def c_coin_tower(l, x):
    l.ground(x, x + 23); l.plat(G - 3, x + 3, x + 7); l.plat(G - 6, x + 8, x + 11); l.plat(G - 9, x + 12, x + 19); l.coins(G - 10, x + 12, x + 19); l.put(G - 7, x + 10, '*'); l.plat(G - 6, x + 20, x + 22); l.coins(G - 4, x + 4, x + 6, 2); l.put(G - 1, x + 15, enemy(l)); return 24
def c_vmover(l, x):
    l.ground(x, x + 3); l.put(G, x + 5, 'n'); l.ink(x + 4, x + 19, 12); l.block(G - 4, x + 8, x + 11, 2); l.coins(G - 5, x + 9, x + 10); l.plat(G - 4, x + 14, x + 18); l.coins(G - 5, x + 15, x + 17, 2); l.ground(x + 20, x + 25); l.put(G - 6, x + 16, '?'); return 26
def c_planes(l, x):
    l.ground(x, x + 19); l.put(G - 5, x + 5, 'f'); l.put(G - 3, x + 13, 'f'); l.block(G - 3, x + 8, x + 11); l.coins(G - 4, x + 9, x + 10); l.coins(G - 2, x + 3, x + 16, 4); return 20
def c_pipe(l, x):
    """Tuyau vers un souterrain qui ressort 40 cases plus loin ; en haut, un chemin encombré."""
    a, b = next(l.pipe_ids), next(l.pipe_ids)
    l.ground(x, x + 43); l.under_spans.append((x, x + 43))
    for c, d in ((x + 3, a), (x + 38, b)):
        l.put(G - 1, c, d); l.put(G - 1, c + 1, d); l.fill(G, G + 3, c, c + 1, '|')
    # chemin lent en haut
    l.block(G - 2, x + 8, x + 11, 2); l.spikes(x + 14, x + 17); l.plat(G - 3, x + 13, x + 18); l.block(G - 1, x + 20, x + 21); l.block(G - 3, x + 22, x + 25, 3); l.spikes(x + 28, x + 31); l.plat(G - 3, x + 27, x + 32); l.put(G - 1, x + 34, enemy(l)); l.coins(G - 4, x + 14, x + 17, 3); l.coins(G - 4, x + 28, x + 31, 3); l.coins(G - 4, x + 23, x + 24)
    # souterrain
    l.fill(UNDER, UNDER, x, x + 43, '#'); l.fill(U, U + 3, x, x + 43, '#'); l.fill(UNDER, U, x, x + 1, '#'); l.fill(UNDER, U, x + 42, x + 43, '#')
    for c, d in ((x + 3, a), (x + 38, b)): l.put(U - 1, c, d); l.put(U - 1, c + 1, d)
    l.coins(U - 2, x + 7, x + 34, 3); l.put(U - 3, x + 14, '?'); l.put(U - 3, x + 27, '?'); l.fill(U, U, x + 17, x + 24, 'I')
    l.put(U - 1, x + 30, 'k' if l.world in ('ciseaux', 'chateau') else 'e'); l.put(UNDER + 1, x + 20, 'a'); l.put(U - 3, x + 9, '*'); l.put(U - 1, x + 41, 'Z')
    return 44
def c_cimes(l, x):
    """Plateformes au-dessus de l'encre (forêt / ciel)."""
    l.ground(x, x + 3); l.ink(x + 4, x + 25, 12); l.plat(G - 1, x + 6, x + 9); l.block(G - 2, x + 12, x + 14); l.plat(G - 3, x + 17, x + 20); l.plat(G - 1, x + 22, x + 24); l.ground(x + 26, x + 29)
    l.coins(G - 2, x + 6, x + 9); l.coins(G - 3, x + 12, x + 14); l.coins(G - 4, x + 17, x + 20); l.put(G - 5, x + 18, '?'); return 30

# ---------------------------------------------------------------- post-traitement
def finalize(l):
    # trous au-dessus d'un souterrain : encre au fond (sinon on resterait coincé sur le plafond)
    for a, b in l.under_spans:
        for c in range(a, b + 1):
            if all(l.g[r][c] == '.' for r in range(G, 15)): l.g[13][c] = '~'; l.g[14][c] = '~'

def build(l, seq):
    x = 0
    for f in seq:
        l.ox = 0
        x += f(l, x)
    finalize(l); return l

LV = []
def level(id, world, name, tip, seq):
    l = L(id, world, name, tip, sum(ord(c) for c in id) * 7919)
    build(l, seq); LV.append(l); return l

# Petites fabriques pour varier les segments neutres
flat10 = lambda l, x: c_flat(l, x, 10)
flat14 = lambda l, x: c_flat(l, x, 14)
gap3 = lambda l, x: c_gap(l, x, 3)
gap4 = lambda l, x: c_gap(l, x, 4)

# ---------------------------------------------------------------- les 20 tableaux
level('1-1', 'prairie', 'Premiers pas', 'Flèches ou A/D pour courir, Espace pour sauter, E pour l’objet. Premier arrivé au drapeau !',
      [c_start, c_flat, gap3, c_plats, c_enemies, c_hill, c_check, gap4, c_jumpers, c_spring, flat14, c_steps, c_check, c_spikes, c_coin_tower, gap4, c_enemies, c_plats, c_check, c_double_gap, c_hill, c_flat, c_finish])
level('1-2', 'prairie', 'Les collines', 'Les plateformes fines se traversent par en dessous. La falaise se saute avec le Double saut.',
      [c_start, c_hill, c_steps, gap4, c_check, gate_double, c_flat, c_plats, c_enemies, c_spring, c_check, c_hill, c_jumpers, c_coin_tower, gap3, c_steps, c_check, c_spikes, c_plats, c_double_gap, c_flat, c_finish])
level('1-3', 'prairie', 'Saute-mouton', 'Saute sur les Chiffonnés pour rebondir. Les Ciseaux déchirent les murs de papier.',
      [c_start, c_enemies, c_jumpers, gap4, c_check, c_enemies, gate_ciseaux, c_plats, c_spring, c_check, c_jumpers, c_hill, c_enemies, gap3, c_check, c_coin_tower, c_enemies, c_steps, c_jumpers, flat14, c_finish])
level('1-4', 'prairie', 'Le ruisseau d’encre', 'L’encre, c’est mortel ! Le tuyau vert cache un passage sous la prairie.',
      [c_start, flat10, c_ink_mover, c_check, c_pipe, c_ink_mover, c_check, c_plats, c_ink_mover, c_jumpers, c_check, gate_double, c_spring, c_ink_mover, c_coin_tower, c_check, c_enemies, c_double_gap, c_finish])
level('1-5', 'prairie', 'La grande descente', 'Deux murs de papier, une fosse à élan et un souterrain : à toi de choisir ton chemin.',
      [c_start, c_steps, gate_ciseaux, c_check, c_hill, c_spring, c_pipe, c_check, gate_elan, c_enemies, c_plats, c_check, gate_ciseaux, c_jumpers, c_coin_tower, c_check, c_spikes, c_double_gap, c_flat, c_finish])

level('2-1', 'foret', 'Entre les arbres', 'Les avions de papier volent tout droit : passe dessous ou saute dessus.',
      [c_start, c_planes, c_flat, gap4, c_check, c_plats, c_planes, gate_double, c_check, c_spider, c_enemies, c_vmover, c_check, c_planes, c_coin_tower, c_jumpers, c_check, c_spring, c_planes, c_flat, c_finish])
level('2-2', 'foret', 'Les cimes', 'Ça monte ! Au-dessus de l’encre, chaque plateforme compte.',
      [c_start, c_cimes, c_check, c_vmover, c_plats, c_cimes, c_check, gate_ciseaux, c_spider, c_cimes, c_check, c_planes, c_vmover, c_coin_tower, c_check, c_cimes, c_enemies, c_finish])
level('2-3', 'foret', 'Le vent de papier', 'De grands trous : vise les ressorts et garde ton élan.',
      [c_start, c_spring, c_planes, c_check, gap4, c_spring, c_eraser, c_check, gate_double, c_spring, c_spider, c_check, c_double_gap, c_planes, c_spring, c_check, c_coin_tower, c_jumpers, c_spring, c_finish])
level('2-4', 'foret', 'La clairière des pièces', 'Plein de pièces en hauteur, un souterrain rempli d’or… et des Gommes qui foncent.',
      [c_start, c_coin_tower, c_eraser, c_check, c_pipe, c_coin_tower, c_check, c_planes, gate_ciseaux, c_coin_tower, c_check, c_spider, c_eraser, c_double_gap, c_check, c_coin_tower, c_plats, c_finish])
level('2-5', 'foret', 'Le vieux chêne', 'Le Ruban collant grimpe les puits ; les autres font le tour par en bas.',
      [c_start, c_planes, gate_shaft, c_check, c_vmover, c_spider, c_check, c_pipe, c_coin_tower, c_check, gate_shaft, c_eraser, c_cimes, c_check, c_planes, c_enemies, c_finish])

level('3-1', 'ciseaux', 'Le sentier des punaises', 'Punaises, Trombones et Gommes : les Trombones ne s’écrasent pas, saute par-dessus.',
      [c_start, c_spikes, c_spiky_ledge, c_check, c_flat, c_spikes, gate_double, c_check, c_eraser, c_spikes, c_ice, c_check, c_spiky_ledge, c_plats, c_spikes, c_check, c_coin_tower, c_eraser, c_spikes, c_finish])
level('3-2', 'ciseaux', 'Les falaises', 'Des plateformes mobiles au-dessus de l’encre, et de la glace sur les corniches.',
      [c_start, c_ink_mover, c_ice, c_check, c_ink_mover, c_spiky_ledge, gate_ciseaux, c_check, c_vmover, c_ice, c_ink_mover, c_check, c_eraser, c_coin_tower, c_ink_mover, c_check, c_spikes, c_ice, c_finish])
level('3-3', 'ciseaux', 'Le col', 'Des ressorts en série et une grande patinoire : ne glisse pas dans le vide !',
      [c_start, c_spring, c_ice_rink, c_check, c_spring, gate_ciseaux, c_spiky_ledge, c_check, c_spring, c_ice, c_eraser, c_check, c_pipe, c_spring, c_check, c_ice_rink, c_spikes, c_spring, c_finish])
level('3-4', 'ciseaux', 'La crête', 'Avions et punaises en même temps, puis la fosse à élan.',
      [c_start, c_planes, c_spikes, c_check, c_spiky_ledge, gate_elan, c_planes, c_check, c_ice, c_spikes, gate_double, c_check, c_eraser, c_planes, c_ice_rink, c_check, c_coin_tower, c_spikes, c_finish])
level('3-5', 'ciseaux', 'Le sommet', 'Le plus long sentier des montagnes : glace, souterrain, murs de papier et trombones.',
      [c_start, c_spikes, c_ice, c_check, gate_elan, c_spiky_ledge, c_pipe, c_check, c_ice_rink, c_eraser, gate_ciseaux, c_check, c_ink_mover, c_spikes, c_coin_tower, c_check, c_ice, c_spiky_ledge, c_planes, c_check, c_spring, c_finish])

level('4-1', 'chateau', 'Le pont-levis', 'Les canons tirent de ton côté : passe entre deux boulets. Les ponts mobiles survolent les douves.',
      [c_start, c_ink_mover, c_cannon, c_check, c_ink_mover, gate_ciseaux, c_spider, c_check, c_cannon, c_ink_mover, c_eraser, c_check, c_spiky_ledge, c_ink_mover, c_coin_tower, c_check, c_cannon, c_plats, c_finish])
level('4-2', 'chateau', 'Les tours', 'Deux puits à grimper au Ruban, sinon le long chemin des escaliers.',
      [c_start, c_steps, gate_shaft, c_check, c_cannon, c_spider, c_check, gate_double, c_eraser, c_ice, c_check, gate_shaft, c_spiky_ledge, c_check, c_cannon, c_coin_tower, c_finish])
level('4-3', 'chateau', 'Les oubliettes', 'Les cachots : un souterrain glacé, des araignées et des Trombones. Trois raccourcis pour qui a les pouvoirs.',
      [c_start, c_spider, c_pipe, c_check, gate_elan, c_cannon, c_check, c_spiky_ledge, gate_ciseaux, c_ice, c_check, c_eraser, c_spider, gate_double, c_check, c_pipe, c_cannon, c_finish])
level('4-4', 'chateau', 'La salle du trône', 'Le dernier tableau du château : tout y passe. Bonne chance !',
      [c_start, c_cannon, c_spikes, c_check, c_ink_mover, gate_double, c_spider, c_check, c_ice_rink, c_eraser, gate_ciseaux, c_check, c_cannon, c_spiky_ledge, c_pipe, c_check, gate_elan, c_coin_tower, c_cannon, c_check, c_ink_mover, c_spikes, c_finish])

level('5-1', 'ciel', 'Le ciel de papier', 'Le tableau de la Coupe spéciale : des nuages, des avions, et tous les raccourcis d’un coup.',
      [c_start, c_cimes, c_planes, c_check, c_spring, gate_double, c_jumpers, c_check, c_cimes, c_vmover, gate_ciseaux, c_check, c_spring, c_planes, gate_elan, c_check, c_coin_tower, c_cimes, c_spring, c_check, c_jumpers, c_plats, c_finish])

# ---------------------------------------------------------------- écriture
out = ["// Paper Run — les tableaux. Légende dans physics.js. Les rangées courtes sont complétées par du vide.",
       "// GÉNÉRÉ par tools/design-levels.py (segments posés bout à bout) ; vérifié par tools/test-levels.cjs.",
       "(function (root) {", "  'use strict';", "  const PR = root.PR = root.PR || {};", "  PR.LEVELS = ["]
world_names = {'prairie': 'Monde 1 : la Prairie de papier', 'foret': 'Monde 2 : la Forêt de carton', 'ciseaux': 'Monde 3 : les Montagnes de ciseaux', 'chateau': 'Monde 4 : le Château d’origami', 'ciel': 'Coupe spéciale : le Ciel de papier'}
seen = set()
for l in LV:
    if l.world not in seen: seen.add(l.world); out.append("    // ---------------------------------------------------------------- " + world_names[l.world])
    tip = l.tip.replace("'", "\\'")
    out.append(f"    {{ id: '{l.id}', world: '{l.world}', name: '{l.name}', under: {UNDER}, tip: '{tip}', map: [")
    for r in l.rows(): out.append(f"      '{r}',")
    out.append("    ] },")
out += ["  ];", "  PR.levelById = id => PR.LEVELS.find(l => l.id === id);", "  PR.levelsOf = worldId => PR.LEVELS.filter(l => l.world === worldId);",
        "  if (typeof module !== 'undefined') module.exports = PR;", "})(typeof window !== 'undefined' ? window : globalThis);", ""]
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'js', 'levels.js'), 'w').write('\n'.join(out))
print('ok', len(LV), 'tableaux, largeurs :', ' '.join(f'{l.id}={l.w}' for l in LV))
