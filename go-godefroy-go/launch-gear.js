/* One catalogue for progression, shop drawings and launch animation. Zero-based IDs. */
(function(root){
const groups=['La glisse du débutant','Les savons & graisses','La saga du skateboard','Les patins à roulettes','La luge à propulsion','Magie & alchimie ultime'];
const rows=[
['Bouclier en bois usé','shield',0,true,90],['Bouclier en bois renforcé','shield',0,true,100],['Grande poêle à frire en fonte','pan',0,true,110],['Poêle en fonte culottée au gras','pan',0,true,120],['Plateau de banquet en argent bien ciré','tray',0,true,130],
['Gros savon rosé','soap',1,false,140],['Savon rosé au lait de chèvre','soap',1,false,155],['Beurre de yack congelé','butter',1,false,175],
['Skateboard · roues en pierre','skate',2,false,190],['Skateboard · roues en acier','skate',2,false,215],['Skateboard · roues en bronze huilées','skate',2,false,245],['Skateboard ultime · roues en plastique rouge','skate',2,false,280],
['Patins · roues en acier','skates',3,true,310],['Patins · roues en plastique rouge','skates',3,true,350],['Patins avec mini-poudre d’éther','skates',3,true,400],['Patins avec petit boost alchimique','skates',3,true,460],
['Luge en bois · patins de fer','sled',4,false,530],['Luge renforcée · un boost alchimique','sled',4,false,620],['Luge de compétition · deux boosts','sled',4,false,730],
['Chaudron à réaction','cauldron',5,false,850],['Chaudron à réaction · tuyères doublées','cauldron',5,false,1000],['Tapis volant tressé d’or','carpet',5,false,1200],['Parchemin d’impulsion runique','rune',5,false,1450],['Aile de gargouille enchantée','gargoyle',5,true,1750],['Plaque de météorite astrale','meteor',5,true,2200]
];
const items=rows.map(([name,type,group,standing,speed],id)=>({id,name,type,group:groups[group],standing,speed}));
function get(id){return items[Math.max(0,Math.min(24,Math.floor(id)||0))];}
const api={items,get,groups,legacy:[5,8,16,19,20,21,22,23,24]};if(typeof module!=='undefined')module.exports=api;else root.GGLaunch=api;
})(typeof window!=='undefined'?window:globalThis);
