// Charge le jeu dans Node (sans DOM) pour les tests : const BK = require('./headless.js');
const path = require('path');
const w = global.window = { addEventListener() { }, FamilyHeads: null };
global.localStorage = { _m: {}, getItem(k) { return this._m[k] == null ? null : this._m[k]; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } };
for (const f of ['config', 'decor-biomes', 'wildlife', 'bestiary', 'camera', 'sprites', 'sprites-biomes', 'sprites-wildlife', 'world', 'inventory', 'input', 'audio', 'ai', 'stage-1-1', 'stage-1-2', 'stage-1-3', 'stage-1-4', 'stage-1-5', 'stage-world-2', 'encounter', 'traps', 'bestiary-world', 'castle-encounter', 'sprites-bestiary', 'castle-towers', 'castle-finish', 'castle-pipes', 'castle-mechanisms', 'bomb-dome', 'adventure', 'hub', 'editor', 'match', 'duels', 'fantasy-enemies', 'challenges', 'worldselect', 'music']) require(path.join(__dirname, '..', 'js', f + '.js'));
w.BK.overlay = { show() { }, hide() { } }; w.BK.toMenu = () => { }; w.BK.showAdventureSelect = () => { };
module.exports = w.BK;
