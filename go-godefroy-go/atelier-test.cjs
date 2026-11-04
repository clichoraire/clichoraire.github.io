const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('./physics'),source=fs.readFileSync(__dirname+'/game.js','utf8'),art=fs.readFileSync(__dirname+'/art.js','utf8');
const original={id:'real',save:G.fresh()},before=JSON.stringify(original),nodes={};let writes=0;
const env={activeSlot:original,save:original.save,testMode:false,testReturnSlot:null,forgeSelections:{},inspectionPaused:false,document:{body:{className:''}},GGLaunch:require('./launch-gear'),$:id=>nodes[id]??=( {} ),ready(){},showTab(){},launch(){},GGProfiles:{write(){writes++;}},library:{slots:[original]},storage:{}};
vm.createContext(env);
vm.runInContext(source.slice(source.indexOf('function startTest('),source.indexOf("$('test-launch-select').innerHTML")),env);
vm.runInContext(source.slice(source.indexOf('function persist('),source.indexOf('function updateTitle(')),env);
for(let i=0;i<25;i++){env.startTest(i);assert.equal(env.save.levels.launch,i);assert.equal(env.save.owned.launch,24);env.save.gold+=999;env.save.wallDamage={'1':{0:1}};env.persist();assert.equal(JSON.stringify(original),before);assert.equal(env.testReturnSlot,original);}
assert.equal(env.save.gold,Infinity);for(const c of G.categories){while(G.owned(env.save,c.id)<G.maxLevel(c.id))assert(G.buy(env.save,c.id));}assert.equal(env.save.gold,Infinity);assert.equal(JSON.stringify(original),before);
assert.equal(writes,0);assert.notEqual(env.activeSlot,original);
let output=[],parts=[];const scratch={clearRect(){},drawImage(...a){parts.push(a)}};
const render={document:{createElement:()=>({getContext:()=>scratch})},motion:{time:1,slack:0},flight:{vx:90,vy:20,stalled:false,capeLoad:0},reducedMotion:{matches:false},knightPoses:{}};
vm.createContext(render);vm.runInContext(art.slice(art.indexOf('let poseClothCanvas'),art.indexOf('// A single illustrated silhouette')),render);
for(const frame of [3,4,5]){output=[];parts=[];render.flutterPoseArt({drawImage(...args){output.push(args)}},frame,0,512,0,0,.32);assert.equal(output.length,1);assert.equal(output[0].length,5);for(const a of parts)for(const value of a.slice(1))assert.ok(Number.isInteger(value));}
console.log('Atelier : les 25 objets sont testables sans écriture ni mutation de sauvegarde. Cape : composition entière, un seul dessin final, bandes sans recouvrement fractionnaire.');
