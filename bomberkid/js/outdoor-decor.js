// Objets de rive, jardin et vestiges ; catalogue partagé avec l'éditeur.
(function(BK){
const rows=[['lily','Nénuphar','🪷',0],['stepping','Pierre de gué','🪨',0],['buoy','Bouée de pêche','🔴',1],['float','Flotteur de pêche','🎣',1],['bush_round','Buisson arrondi','🌳',1],['bush_flowers','Buisson fleuri','🌸',1],['bush_berries','Buisson à baies','🫐',1],['birdhouse','Nichoir','🐦',1],['feeder','Mangeoire à oiseaux','🐦',1],['picnic','Table de pique-nique à carreaux','🧺',1],['grill','Barbecue en briques','🔥',1],['smoker','Fumoir','🔥',1],['waterwheel','Roue à aubes','⚙️',1],['weathervane','Girouette','🐓',1],['workbench','Établi de menuiserie','🪚',1],['web','Toile d’araignée','🕸️',0],['monolith','Monolithe gravé d’Ogham','🪨',1],['sword','Épée dans la pierre','⚔️',1],['totem','Totem aux ramures','🪶',1],['wreck','Chariot pillé renversé','🛞',1],['well','Puits moussu comblé','🪨',1],['bivouac','Bivouac éteint','🪵',0],['logs','Rondins ficelés et hache','🪓',1],['hideout','Cache sous les feuilles','🍂',0],['cairn','Cairn balisé','🪨',1]];
const mountains=[
 ['granite_arch','Arche de granite','🪨',0],
 ['basalt','Orgues de basalte','⛰️',1],
 ['quartz','Veine de quartz','💎',1],
 ['split_boulder','Rocher fendu','🪨',1],
 ['scree','Éboulis de schiste','🪨',0],
 ['ammonite','Dalle aux ammonites','🐚',0],
 ['spring','Source de montagne','💧',1],
 ['shelter','Refuge de pierre','🛖',1],
 ['eagle_crag','Nid d’aigle sur un piton','🦅',1],
 ['summit_marker','Balise de sommet','🚩',1],
 ['ice_ledge','Corniche givrée','❄️',1],
 ['storm_stone','Pierre foudroyée','⚡',1],
 ['amethyst_geode','Géode d’améthyste','💎',1],
 ['stone_mushroom','Champignon de pierre','🍄',1],
 ['carved_steps','Marches taillées dans la roche','🪨',0],
 ['copper_vein','Filon de cuivre','⛏️',1],
 ['mountain_fissure','Faille rocheuse','🪨',0],
 ['climber_anchor','Ancrage de cordée','🧗',1],
 ['quarry_winch','Treuil de carrière','🛠️',1],
 ['ore_cart','Wagonnet de minerai','🛒',1],
 ['glacial_stripes','Dalle aux stries glaciaires','❄️',0],
 ['wind_stele','Stèle des vents','🌬️',1],
 ['slate_spire','Flèche de schiste','⛰️',1],
 ['alpine_pool','Mare alpine','💧',0]
];
const cemetery=[
 ['grave_round','Pierre tombale arrondie','🪦',1],
 ['grave_gothic','Pierre tombale gothique','🪦',1],
 ['grave_broken','Pierre tombale brisée','🪦',1],
 ['grave_double','Pierre tombale double','🪦',1],
 ['grave_mossy','Pierre tombale moussue','🪦',1],
 ['grave_iron_cross','Croix funéraire en fer','✝️',1],
 ['grave_open','Fosse ouverte','🕳️',0],
 ['grave_mound','Tertre funéraire','🪦',0],
 ['grave_sarcophagus','Sarcophage de pierre','⚰️',1],
 ['grave_mausoleum','Mausolée à colonnes','🏛️',1],
 ['grave_crypt','Entrée de crypte','🗝️',1],
 ['grave_urn','Urne funéraire','🏺',1],
 ['grave_candles','Veilleuses funéraires','🕯️',0],
 ['grave_wreath','Couronne de deuil','🌿',0],
 ['grave_lantern','Lanterne de veille','🏮',1],
 ['grave_angel','Ange de pierre','🪽',1],
 ['grave_gargoyle','Gargouille du cimetière','🗿',1],
 ['grave_fence','Grille en fer forgé','🚧',1],
 ['grave_gate','Portail du cimetière','🚪',1],
 ['grave_bench','Banc de granit','🪨',1],
 ['grave_yew','If du cimetière','🌲',1],
 ['grave_brambles','Ronces du cimetière','🌿',1],
 ['grave_ossuary','Ossuaire grillagé','💀',1],
 ['grave_flowers','Bouquet de chrysanthèmes','🌼',0]
];
const caves=[
 ['cave_stalagmites','Groupe de stalagmites','🪨',1],
 ['cave_stalactites','Rideau de stalactites','🪨',0],
 ['cave_column','Colonne de calcite','🪨',1],
 ['cave_turquoise','Cristaux turquoise','💎',1],
 ['cave_pyrite','Cristaux de pyrite','✨',1],
 ['cave_rose','Quartz rose','💎',1],
 ['cave_mushrooms','Champignons des cavernes','🍄',0],
 ['cave_glowworms','Vers luisants','✨',0,true],
 ['cave_flowstone','Coulée de calcite','🪨',1],
 ['cave_basin','Bassin souterrain','💧',0],
 ['cave_stream','Ruisselet souterrain','💧',0],
 ['cave_waterfall','Cascade souterraine','🌊',1],
 ['cave_fossil','Côtes fossilisées','🦴',0],
 ['cave_tracks','Traces dans la boue','🐾',0],
 ['cave_roots','Racines pendantes','🌿',0,true],
 ['cave_rails','Rails de mine abandonnés','🛤️',0],
 ['cave_lamp','Lampe de mineur','🏮',1],
 ['cave_pick','Pioche abandonnée','⛏️',1],
 ['cave_support','Étais de mine','🪵',0],
 ['cave_painting','Peinture rupestre','🎨',0,true]
];
const catalog=(items,category)=>items.map(([id,name,icon,solid,wall=false])=>({
 deco:'outdoor_'+id,name,icon,solid,category,wall,
 ...(id==='sword'?{hint:'Avec les gants de force, appuie sur Entrée pour retirer l’épée : dégâts des bombes ×2.'}:{})
}));
BK.OUTDOOR_DECOR=[...catalog(rows,'outdoor'),...catalog(mountains,'mountain'),...catalog(cemetery,'cemetery'),...catalog(caves,'cave')];
BK.BIOME_DECOR.push(...BK.OUTDOOR_DECOR);
BK.BIOME_CATEGORIES.push({id:'outdoor',name:'🌿 Rives et campements'},{id:'mountain',name:'⛰️ Montagne et rochers'},{id:'cemetery',name:'🪦 Cimetière'},{id:'cave',name:'🪨 Grotte'});
BK.WATER_STEPS=new Set(['outdoor_lily','outdoor_stepping']);
})(window.BK);
