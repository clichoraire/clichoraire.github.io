/* Two original modal themes: lively pipe/lute/tabor and quiet plucked strings. */
(function(root){
const cache=new Map();
function render(theme,rate=24000){
 const key=theme+':'+rate;if(cache.has(key))return cache.get(key);
 const flight=theme==='flight',beat=60/(flight?124:76),beats=64,length=Math.round(beats*beat*rate),out=new Float32Array(length);
 const hz=m=>440*Math.pow(2,(m-69)/12);
 function note(m,start,duration,volume,instrument){const f=hz(m),count=Math.ceil(duration*rate),offset=Math.round(start*beat*rate);for(let i=0;i<count;i++){const t=i/rate,attack=Math.min(1,t/(instrument==='pipe'?.035:.004)),release=Math.min(1,(duration-t)/.08);let sample;
 if(instrument==='pipe'){const phase=2*Math.PI*f*(t+.00025*Math.sin(2*Math.PI*5*t));sample=(Math.sin(phase)+.22*Math.sin(2*phase)+.08*Math.sin(3*phase))*.55*attack*release;}
 else sample=(Math.sin(2*Math.PI*f*t)+.36*Math.sin(2*Math.PI*f*2.003*t)+.14*Math.sin(2*Math.PI*f*3*t))*Math.exp(-t*4)*attack*release;
 out[(offset+i)%length]+=sample*volume;}}
 const melody=[74,77,79,81,79,77,76,74,72,74,77,79,77,76,72,69,74,76,77,81,84,81,79,77,76,74,72,69,72,76,74,74];
 const roots=[50,48,53,48,50,55,48,50];
 for(let bar=0;bar<16;bar++){const start=bar*4,rootNote=roots[bar%8];
 for(let q=0;q<8;q++)note(rootNote+[0,7,12,7,3,7,12,7][q],start+q*.5,flight?.65:1.3,flight?.11:.16,'lute');
 note(rootNote,start,beat*3.8,.10,'lute');
 if(flight){for(let q=0;q<4;q++)note(melody[(bar*4+q)%melody.length]+(bar>=8&&bar<12?12:0),start+q,q===3?beat*.88:beat*.70,.15,'pipe');}
 else if(bar%2===0){note(melody[bar*2%32]-12,start+1,beat*1.8,.08,'pipe');note(melody[(bar*2+2)%32]-12,start+3,beat*1.5,.07,'lute');}
 if(flight)for(let q=0;q<4;q++){const offset=Math.round((start+q)*beat*rate);for(let i=0;i<rate*.18;i++){const t=i/rate,noise=Math.sin(i*127.1+bar*43.7)*Math.sin(i*311.7),drum=q%2?noise*Math.exp(-t*35)*.07:Math.sin(2*Math.PI*(78*t+1.8*(1-Math.exp(-t*35))))*Math.exp(-t*22)*.16;out[(offset+i)%length]+=drum*Math.min(1,t/.003);}}}
 for(let i=0;i<length;i++)out[i]=Math.tanh(out[i]);cache.set(key,out);return out;
}
function tensionFor(state){
 if(state.phase!=='flight'||state.ended||state.paused||state.hidden||!Number.isFinite(state.nextWallAt)||!Number.isFinite(state.x))return 0;
 const progress=Math.max(0,Math.min(1,1-(state.nextWallAt-state.x)/1200));return progress*progress*(3-2*progress);
}
function renderAccent(kind,rate=24000){
 const key=kind+':'+rate;if(cache.has(key))return cache.get(key);
 const beat=60/124,length=kind==='tension'?render('flight',rate).length:Math.ceil(rate*3.4),out=new Float32Array(length);
 function brass(m,at,duration,gain){const f=440*Math.pow(2,(m-69)/12),start=Math.round(at*rate);for(let i=0;i<duration*rate&&start+i<length;i++){const t=i/rate,env=Math.min(1,t/.025)*Math.min(1,(duration-t)/.15),p=2*Math.PI*f*t;out[start+i]+=(Math.sin(p)+.45*Math.sin(p*2)+.22*Math.sin(p*3)+.1*Math.sin(p*4))*.45*env*gain;}}
 function drum(at,gain,roll=false){const start=Math.round(at*rate);for(let i=0;i<rate*.2&&start+i<length;i++){const t=i/rate,n=Math.sin(i*127.1)*Math.sin(i*311.7);out[start+i]+=(roll?n*Math.exp(-t*35):Math.sin(2*Math.PI*(70*t+1.8*(1-Math.exp(-t*30))))*Math.exp(-t*18))*gain*Math.min(1,t/.002);}}
 if(kind==='tension'){const roots=[50,48,53,48,50,55,48,50];for(let b=0;b<64;b++){drum(b*beat,.22);drum((b+.5)*beat,.11,true);drum((b+.75)*beat,.055,true);brass(roots[Math.floor(b/4)%8]+12,b*beat,beat*.32,.10);}}
 else {for(const [at,m,duration] of [[0,74,.22],[.25,74,.22],[.5,81,.38],[.94,86,.5],[1.5,86,1.65]]){brass(m,at,duration,.30);brass(m-12,at,duration,.18);}for(const m of [62,66,69,74])brass(m,1.5,1.65,.12);for(const at of [0,.25,.5,.94,1.5])drum(at,.35);for(const at of [1.2,1.28,1.36,1.44])drum(at,.14,true);}
 for(let i=0;i<length;i++)out[i]=Math.tanh(out[i]);cache.set(key,out);return out;
}
function themeFor(state){return state.hidden||state.phase==='title'?null:state.tab==='forge'?'shop':['launching','flight','landing'].includes(state.phase)?'flight':null;}
const api={render,renderAccent,tensionFor,themeFor};if(typeof module!=='undefined')module.exports=api;else root.GGMusic=api;
})(typeof window!=='undefined'?window:globalThis);
