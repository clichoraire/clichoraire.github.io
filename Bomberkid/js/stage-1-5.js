// Arène du monde 1 : terre, verdure et lave.
window.BK.STAGE_1_5 = {
 "name": "Le sanctuaire de braise",
 "theme": "garden",
 "cols": 25,
 "rows": 25,
 "grid": [
  "#########################",
  "#-----------------------#",
  "#[[[--------G--------[[[#",
  "#[[[-\"\"\"---------\"\"\"-[[[#",
  "#[[[-\"\"\"---------\"\"\"-[[[#",
  "#[[[-\"\"\"---------\"\"\"-[[[#",
  "#[[[-...............-[[[#",
  "#[[[-.-------------.-[[[#",
  "#[[[-.-------------.-[[[#",
  "#[[[-.-------------.-[[[#",
  "#[[[-#-------------#-[[[#",
  "#[[[-.-------------.-[[[#",
  "#[[[-.-------------.-[[[#",
  "#,,,-.-------------.-,,,#",
  "#,,,-.-------------.-,,,#",
  "#,L,\".-------------.\",L,#",
  "#,,,-.-------------.-,,,#",
  "#,,,-.-------------.-,,,#",
  "#,,,#####-------#####,,,#",
  "#,,,#####-------#####,,,#",
  "#,L,##H##.......##H##,L,#",
  "#,,,-----------------,,,#",
  "#---\"-\"-----1-----\"-\"---#",
  "#-----------------------#",
  "#########################"
 ],
 "props": {
  "4,15": {
   "deco": "waterjet",
   "orientation": 3
  },
  "20,15": {
   "deco": "waterjet",
   "orientation": 1
  },
  "6,22": {
   "deco": "campfire"
  },
  "18,22": {
   "deco": "campfire"
  },
  "4,22": {
   "item": "heart"
  },
  "20,22": {
   "item": "heart"
  },
  "5,3": {
   "deco": "volcanopart",
   "of": "6,4"
  },
  "6,3": {
   "deco": "volcanopart",
   "of": "6,4"
  },
  "7,3": {
   "deco": "volcanopart",
   "of": "6,4"
  },
  "5,4": {
   "deco": "volcanopart",
   "of": "6,4"
  },
  "6,4": {
   "deco": "volcano"
  },
  "7,4": {
   "deco": "volcanopart",
   "of": "6,4"
  },
  "5,5": {
   "deco": "volcanopart",
   "of": "6,4"
  },
  "6,5": {
   "deco": "volcanopart",
   "of": "6,4"
  },
  "7,5": {
   "deco": "volcanopart",
   "of": "6,4"
  },
  "17,3": {
   "deco": "volcanopart",
   "of": "18,4"
  },
  "18,3": {
   "deco": "volcanopart",
   "of": "18,4"
  },
  "19,3": {
   "deco": "volcanopart",
   "of": "18,4"
  },
  "17,4": {
   "deco": "volcanopart",
   "of": "18,4"
  },
  "18,4": {
   "deco": "volcano"
  },
  "19,4": {
   "deco": "volcanopart",
   "of": "18,4"
  },
  "17,5": {
   "deco": "volcanopart",
   "of": "18,4"
  },
  "18,5": {
   "deco": "volcanopart",
   "of": "18,4"
  },
  "19,5": {
   "deco": "volcanopart",
   "of": "18,4"
  }
 },
 "enemies": [],
 "houses": {
  "6,20": {
   "w": 5,
   "d": 3,
   "roof": "#7655c7",
   "wall": "#b88450",
   "interior": {
    "cols": 13,
    "rows": 10,
    "theme": "interior",
    "base": "y",
    "roomExit": true,
    "grid": [
     "#############",
     "#yyyyy\"yyyyy#",
     "#yyyyyyyyyyy#",
     "#y\"y\"yyy\"yyy#",
     "#yyyyyyyyyyy#",
     "#yyyyyyyyyyy#",
     "#\"yyyyyyyyy\"#",
     "#yyyyyyyyyyy#",
     "######1######",
     "      G      "
    ],
    "props": {
     "2,3": {
      "deco": "chair",
      "orientation": 0
     },
     "4,3": {
      "deco": "chair",
      "orientation": 0
     },
     "8,3": {
      "deco": "chair",
      "orientation": 0
     },
     "6,1": {
      "deco": "banner"
     },
     "1,6": {
      "deco": "lamp",
      "lightColor": "default"
     },
     "11,6": {
      "deco": "lamp",
      "lightColor": "default"
     }
    },
    "enemies": [],
    "npcs": [
     {
      "c": 2,
      "r": 3,
      "id": "richard",
      "ally": true,
      "price": 250,
      "lives": 3
     },
     {
      "c": 4,
      "r": 3,
      "id": "josee",
      "ally": true,
      "price": 200,
      "lives": 2
     },
     {
      "c": 8,
      "r": 3,
      "id": "eliott",
      "ally": true,
      "price": 500,
      "lives": 5
     }
    ],
    "shop": []
   }
  },
  "18,20": {
   "w": 5,
   "d": 3,
   "roof": "#e9a53b",
   "wall": "#b88450",
   "interior": {
    "cols": 13,
    "rows": 10,
    "theme": "interior",
    "base": "y",
    "roomExit": true,
    "grid": [
     "#############",
     "#yyyyyyyyyyy#",
     "#yyyyyyyyyyy#",
     "#yyyyyyyyyyy#",
     "#yNyNyNyNyNy#",
     "#yyyyyyyyyyy#",
     "#\"yyyyyyyyy\"#",
     "#yyyyyyyyyyy#",
     "######1######",
     "      G      "
    ],
    "props": {
     "1,6": {
      "deco": "lamp",
      "lightColor": "default"
     },
     "11,6": {
      "deco": "lamp",
      "lightColor": "default"
     }
    },
    "enemies": [],
    "npcs": [
     {
      "c": 6,
      "r": 2,
      "id": "marie",
      "lines": [
       "Bienvenue ! Fais tes provisions avant le grand combat."
      ]
     }
    ],
    "shop": [
     {
      "c": 2,
      "r": 4,
      "item": "heart",
      "price": 20,
      "once": false
     },
     {
      "c": 4,
      "r": 4,
      "item": "bomb",
      "price": 40,
      "once": true
     },
     {
      "c": 6,
      "r": 4,
      "item": "fire",
      "price": 40,
      "once": true
     },
     {
      "c": 8,
      "r": 4,
      "item": "shield",
      "price": 35,
      "once": false
     },
     {
      "c": 10,
      "r": 4,
      "item": "antidote",
      "price": 15,
      "once": false
     }
    ]
   }
  }
 },
 "npcs": [],
 "shop": [],
 "music": ""
};
