// Goblin Malin — la forme de l'arbre des technologies : qui mène à quoi. Chargé en dernier, il remplace les « req » écrits ailleurs.
// Règle : chaque branche part d'UNE seule case, qui se sépare en deux ; ensuite jamais plus de trois embranchements. Plus long que large.
'use strict';
(function (CG) {
  // enfant: parent (une case absente d'ici garde son parent d'origine ; '' = racine de sa branche)
  const P = CG.TECH_PARENT = {
    // ---- défense : les clôtures d'abord, puis d'un côté les murs et les tours, de l'autre les pièges et la garde
    d25: '', d1: 'd25',
    d3: 'd25', d9: 'd3', d8: 'd9', d4: 'd3', d17: 'd4',
    d5: 'd3', d7: 'd5', d6: 'd5', d20: 'd6', d21: 'd20', d22: 'd21', d26: 'd1', d27: 'd26', d28: 'd27',
    d16: 'd1', d10: 'd16', d18: 'd10', d19: 'd18', d15: 'd18',
    d23: 'd1', d11: 'd23', d12: 'd11', d13: 'd12',
    // ---- vie du clan : nourrir d'un côté, bâtir de l'autre
    b1: '', b2: 'b1', b3: 'b1',
    b6: 'b2', b7: 'b6', b17: 'b7', b25: 'b6', b9: 'b25', b19: 'b9', b11: 'b6',
    b21: 'b2', b22: 'b21', b23: 'b22', b18: 'b21', b24: 'b18', b26: 'b24',
    b4: 'b3', b5: 'b4', b8: 'b4', b12: 'b8', b10: 'b3', b13: 'b10', b20: 'b13', b14: 'b10', b15: 'b14', b16: 'b15',
    // ---- guerrier
    g1: '', g2: 'g1', g3: 'g1',
    g4: 'g2', g7: 'g4', g15: 'g7', g9: 'g7', g8: 'g4',
    g5: 'g3', g13: 'g5', g11: 'g5', g12: 'g11', g6: 'g3', g10: 'g6', g14: 'g10',
    // ---- sorcier
    s1: '', s2: 's1', s12: 's1', s13: 's12',
    s3: 's2', s4: 's3', s8: 's4', s11: 's8', s9: 's4', s6: 's2', s10: 's6', s14: 's10', s5: 's6', s7: 's5'
  };
  /* la tour de guet se bâtit dès le départ : une vieille partie qui avait payé sa case récupère son point */
  const up0 = CG.G.update; CG.G.update = function () { const t = CG.S && CG.S.tech; if (t) for (const k in t.owned) if (/^bn\d+$/.test(k)) { delete t.owned[k]; t.points += 1; } /* les petites cases bonus des coins (vie, mana, force, sommeil) n'existent plus : le point est rendu, ce qu'elles avaient donné reste */ if (t && t.owned.d2) { delete t.owned.d2; if (!(t.plans && t.plans.d2)) t.points += 1; if (t.plans) delete t.plans.d2; } return up0.apply(this, arguments); };
  CG.TECH.forEach(n => { if (!(n.id in P)) return; if (P[n.id]) n.req = [P[n.id]]; else delete n.req; });
})(window.CG);
