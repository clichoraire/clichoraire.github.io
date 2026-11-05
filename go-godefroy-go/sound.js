/* Original impact Foley, rendered once to PCM; no remote assets or playback delay. */
(function(root){
'use strict';
const Music=typeof module!=='undefined'?require('./music.js'):root.GGMusic;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function render(kind,rate=44100,seed=1){
 if(kind==='coin'){
  const out=new Float32Array(Math.ceil(rate*.32)),pitch=1+(seed%7-3)*.012;
  for(let i=0;i<out.length;i++){const t=i/rate,attack=Math.min(1,t/.002);out[i]=attack*(Math.sin(2*Math.PI*1850*pitch*t)*.32*Math.exp(-t*24)+Math.sin(2*Math.PI*2970*pitch*t)*.16*Math.exp(-t*36)+Math.sin(2*Math.PI*4230*pitch*t)*.07*Math.exp(-t*48))*Math.min(1,(.32-t)/.04);}
  return out;
 }
 const length=kind==='stop'?2.1:kind==='metal'?1.35:.85,out=new Float32Array(Math.ceil(rate*length));
 let randomState=seed>>>0,low=0,mid=0;
 const random=()=>{randomState=(1664525*randomState+1013904223)>>>0;return randomState/4294967296*2-1;};
 const modes=[173,287,463,731,1097,1643],detune=1+(seed%9-4)*.013;
 const grains=Array.from({length:kind==='stop'?25:15},(_,i)=>({at:i===0?0:.012+i*i*.0015+Math.abs(random())*.018,decay:.008+Math.abs(random())*.025,gain:i===0?.8:.35/(1+i*.12)}));
 for(let i=0;i<out.length;i++){
  const t=i/rate,n=random();low+= (1-Math.exp(-2*Math.PI*260/rate))*(n-low);mid+=(1-Math.exp(-2*Math.PI*2400/rate))*(n-mid);
  let gravel=0;for(const g of grains){const age=t-g.at;if(age>=0&&age<g.decay*8)gravel+=g.gain*Math.exp(-age/g.decay);}
  const attack=Math.min(1,t/.0015);
  let metal=0;for(let m=0;m<modes.length;m++)metal+=Math.sin(2*Math.PI*modes[m]*detune*t+(m%2)*.3)*Math.exp(-t/(.16+(5-m)*.105))/(m+2);
  const ring=metal*attack*.32;
  const stone=(n-mid)*gravel*.56+(mid-low)*gravel*.75+low*Math.exp(-t*9)*1.3;
  // Descending low body + audible low-mid knock survive small speakers.
  const body=(Math.sin(2*Math.PI*(48*t+38*.045*(1-Math.exp(-t/.045))))*.58*Math.exp(-t*4.3)+Math.sin(2*Math.PI*112*t)*.24*Math.exp(-t*8))*Math.min(1,t/.004);
  let value=kind==='stone'?stone*.8+body*.12:kind==='metal'?ring+(n-mid)*Math.exp(-t*95)*.13:body+low*Math.exp(-t*5)*1.7+ring*.8+stone*.35;
  const fade=Math.min(1,(length-t)/.08);out[i]=Math.tanh(value*1.15)*fade;
 }
 return out;
}
// Continuous textures, cached separately from the transient impact voices.
function renderLoop(kind,rate=44100){
 const seconds=3,n=Math.round(rate*seconds),out=new Float32Array(n);let seed=731,low=0,mid=0;
 for(let i=0;i<n;i++){const t=i/rate;seed=(1664525*seed+1013904223)>>>0;const noise=seed/4294967296*2-1;low+=(1-Math.exp(-2*Math.PI*180/rate))*(noise-low);mid+=(1-Math.exp(-2*Math.PI*1700/rate))*(noise-mid);
 const scrape=(mid-low)*(.35+.65*Math.pow(Math.sin(2*Math.PI*13*t),8))+.10*Math.sin(2*Math.PI*383*t)*(.5+.5*Math.sin(2*Math.PI*7*t))+.06*Math.sin(2*Math.PI*617*t);
 const wind=(mid-low)*(.65+.16*Math.sin(2*Math.PI*t/3)+.09*Math.sin(2*Math.PI*4*t/3));
 const booster=low*1.9+(mid-low)*.55+Math.sin(2*Math.PI*58*t)*.10+Math.sin(2*Math.PI*89*t)*.06;
 const joint=(t*9)%1,knock=Math.exp(-joint*35)*(Math.sin(2*Math.PI*195*t)*.35+(mid-low)*.6),wheels=(mid-low)*.25+low*.7+knock;
 const edge=Math.min(1,i/(rate*.008),(n-1-i)/(rate*.008));out[i]=Math.tanh((kind==='pan'?scrape*.8+Math.sin(2*Math.PI*211*t)*Math.exp(-((t*7)%1)*22)*.4:kind==='wheels'?wheels:kind==='ramp'?scrape:kind==='wind'?wind:booster)*1.4)*edge;
 }return out;
}
function ambience(state={}){
 const speed=Math.max(0,Number(state.speed)||0),v=clamp(speed/320,0,1),slide=state.phase==='launching'&&state.progress>0,fly=state.phase==='flight'&&!state.ended;
 const muted=state.paused||state.hidden;
 return {ramp:!muted&&slide&&state.launchType!=='carpet'?.035+.565*clamp(speed/160,0,1):0,wind:!muted&&fly?Math.min(.48,speed/700)*(state.stalled?.22:1):0,booster:!muted&&fly&&state.boosting&&state.fuel>0?.30+.26*v:0,
 rampRate:.55+clamp(speed/160,0,1)*1.35,windRate:.7+v*.65,boosterRate:.82+v*.35,windCutoff:(500+v*4300)*(state.stalled?.35:1),boosterCutoff:650+v*1700};
}
function create(ctx){
 const master=ctx.createGain(),compressor=ctx.createDynamicsCompressor();master.gain.value=0;compressor.threshold.value=-14;compressor.knee.value=16;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.18;master.connect(compressor);compressor.connect(ctx.destination);
 const effects=ctx.createGain(),music=ctx.createGain();effects.gain.value=.8;music.gain.value=.55;effects.connect(master);music.connect(master);let tracks=null,fanfare=null,lastVictoryStage=0;
 const clips={
  click:['app click'],deep:['app click'],
  audience:['audience-reaction','audience-reaction-2','audience-reaction-3'],
  pop:['balloon-pop','balloon-pop-2'],bounce:['boingg','boingg-2'],
  crash:['crash'],results:['end-course-see-stats'],pickup:['get-gold-coin'],
  victory:['next-level-wall-passed'],swoosh:Array.from({length:7},(_,i)=>'swoosh-'+(i+1))
 };
 const musicFiles={title:['in-game-1'],shop:['magasin-music-1'],flight:['retro-arcade-music-in-game','music-in-game-2-synth','in-game-1','in-game-2','in-game-3','in-game-4','in-game-5']};
 const decoded=new Map(),clipIndex={},lastSample={},lastVoice={};
 let flightTrack=-1;
 const browserAudio=typeof window!=='undefined';
 const loading=new Set();
 const localFiles=typeof window!=='undefined'&&window.location?.protocol==='file:';
 const localVoices=new Set();
 let localMusic=null,localMusicName='';
 let localEffectsVolume=.8,localMusicVolume=.55;
 // While the choir of a new stage sings, the main music fades out gently; it comes back when the choir ends.
 let choirHold=null,hushMix=1,hushAt=null;
 function holdMusic(voice,fallback=10.6){
  const hold={until:ctx.currentTime+Math.max(.5,(voice?.duration||fallback)-.5)};choirHold=hold;
  const media=voice?.media;if(!media)return;
  const done=()=>{if(choirHold===hold)choirHold=null;};media.addEventListener('ended',done);media.addEventListener('error',done);
  const measure=()=>{if(choirHold===hold&&Number.isFinite(media.duration))hold.until=ctx.currentTime+Math.max(.5,media.duration-media.currentTime-.5);};
  media.addEventListener('loadedmetadata',measure);media.addEventListener('playing',measure);measure();
 }
 function hushLevel(){
  const now=ctx.currentTime,dt=hushAt===null?0:Math.max(0,Math.min(1,now-hushAt));hushAt=now;
  if(choirHold&&now>=choirHold.until)choirHold=null;
  hushMix+=((choirHold?0:1)-hushMix)*(1-Math.exp(-dt/(choirHold?.8:.7)));if(Math.abs((choirHold?0:1)-hushMix)<.004)hushMix=choirHold?0:1;
  return hushMix;
 }
 function audioPath(folder,name){return 'assets/'+folder+'/mixed/'+encodeURIComponent(name)+'.mp3';}
 function localSample(name,volume,delay){
  if(localVoices.size>=18){const oldest=localVoices.values().next().value;clearTimeout(oldest.timer);oldest.media.pause();localVoices.delete(oldest);}
  const media=new Audio(audioPath('audio',name)),voice={media,volume,timer:0};
  media.volume=Math.min(1,volume*localEffectsVolume*.72);
  localVoices.add(voice);
  const release=()=>localVoices.delete(voice);
  media.onended=release;media.onerror=release;
  const play=()=>media.play().catch(release);
  if(delay)voice.timer=setTimeout(play,delay*1000);else play();
  return {media,fade(seconds){const steps=12,start=media.volume;let i=0;clearTimeout(voice.timer);const timer=setInterval(()=>{i++;media.volume=Math.max(0,start*(1-i/steps));if(i>=steps){clearInterval(timer);media.pause();release();}},seconds*1000/steps);}};
 }
 function localMusicUpdate(theme,paused,hush=1){
  const name=musicFiles[theme]?.[theme==='flight'?Math.max(0,flightTrack):0]||'';
  if(name!==localMusicName){
   localMusic?.pause();localMusicName=name;
   localMusic=name?new Audio(audioPath('music',name)):null;
   if(localMusic){localMusic.loop=true;localMusic.volume=0;localMusic.play().catch(()=>{});}
  }
  if(localMusic){const target=localMusicVolume*.72*(paused?.35:1)*hush;localMusic.volume=Math.max(0,Math.min(1,localMusic.volume+(target-localMusic.volume)*.06));}
 }
 function load(folder,name){
  if(loading.has(name)||decoded.has(name))return;loading.add(name);
  const url=audioPath(folder,name);
  fetch(url).then(response=>{if(!response.ok)throw new Error('Audio indisponible');return response.arrayBuffer();})
   .then(bytes=>ctx.decodeAudioData(bytes)).then(buffer=>decoded.set(name,buffer)).catch(()=>{loading.delete(name);});
 }
 if(!localFiles&&typeof window!=='undefined'&&typeof ctx.decodeAudioData==='function'){
  for(const name of Object.values(clips).flat())load('audio',name);
  load('music',musicFiles.title[0]);load('music',musicFiles.shop[0]);load('music',musicFiles.flight[0]);
 }
 function sample(kind,volume=.5,delay=0){
  const available=(clips[kind]||[]).filter(name=>localFiles||decoded.has(name));
  if(!enabled||!available.length)return false;
  const cooldown={pickup:.07,bounce:.10,pop:.08,audience:1,click:.035}[kind]||0;
  if(ctx.currentTime-(lastSample[kind]??-100)<cooldown)return true;
  lastSample[kind]=ctx.currentTime;
  const index=clipIndex[kind]||0;clipIndex[kind]=index+1;
  const name=available[index%available.length];
  lastVoice[kind]=localFiles?localSample(name,volume,delay):playBuffer(decoded.get(name),volume,1,delay);
  return true;
 }
 function musicUpdate(state){const theme=Music.themeFor(state),intensity=Music.tensionFor(state);
  const hush=hushLevel();
  if(localFiles){localMusicUpdate(theme,state.paused,hush);return;}
  if(theme&&browserAudio)load('music',musicFiles[theme][theme==='flight'?Math.max(0,flightTrack):0]);
  const imported={title:decoded.get(musicFiles.title[0]),shop:decoded.get(musicFiles.shop[0]),flight:decoded.get(musicFiles.flight[Math.max(0,flightTrack)])};
  if(tracks&&theme&&imported[theme]&&tracks[theme].source.buffer!==imported[theme]){
   const old=tracks[theme].source,source=ctx.createBufferSource();
   old.stop();old.disconnect();tracks[theme].gain.gain.cancelScheduledValues(ctx.currentTime);tracks[theme].gain.gain.value=0;source.buffer=imported[theme];source.loop=true;
   source.connect(tracks[theme].gain);source.start();tracks[theme].source=source;
  }
  if(!tracks&&theme&&(!browserAudio||imported[theme])){tracks={};const prepared={};for(const name of ['flight','shop','title','tension']){if(imported[name]){prepared[name]=imported[name];continue;}const data=name==='tension'?Music.renderAccent(name):browserAudio?new Float32Array(24000):Music.render(name==='title'?'flight':name),buffer=ctx.createBuffer(1,data.length,24000);buffer.copyToChannel(data,0);prepared[name]=buffer;}const start=ctx.currentTime+.02;for(const [name,buffer] of Object.entries(prepared)){const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(music);source.start(start);tracks[name]={source,gain};}}
  const duck=fanfare?.25:1,pause=state.paused?.35:1;
  if(tracks)for(const [name,track] of Object.entries(tracks)){const target=name==='tension'?(theme==='flight'&&!fanfare?intensity*.24:0):name===theme&&(!browserAudio||imported[theme]===track.source.buffer)?(1+(name==='flight'?intensity*.10:0))*duck:0;track.gain.gain.setTargetAtTime(target*pause*hush,ctx.currentTime,.28);}
  if(fanfare)fanfare.gain.gain.setTargetAtTime(pause,ctx.currentTime,.05);
 }
 function stopFanfare(){if(!fanfare)return;const old=fanfare;fanfare=null;old.source.stop();old.source.disconnect();old.gain.disconnect();}
 function stopMusic(){localMusicUpdate(null,false);stopFanfare();if(tracks){for(const track of Object.values(tracks)){track.source.stop();track.source.disconnect();track.gain.disconnect();}tracks=null;}}
 const buffers={};for(const kind of ['stone','metal','stop','coin'])buffers[kind]=Array.from({length:4},(_,i)=>{const data=render(kind,ctx.sampleRate,19+i*23);const b=ctx.createBuffer(1,data.length,ctx.sampleRate);b.copyToChannel(data,0);return b;});
 let enabled=false,sequence=0,lastImpact=-10,lastStop=-10;const voices=new Set();let beds=null;const loopBuffers={};for(const kind of ['ramp','wind','booster','wheels','pan']){const data=renderLoop(kind,ctx.sampleRate),buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.copyToChannel(data,0);loopBuffers[kind]=buffer;}
 function stopBeds(){if(!beds)return;for(const bed of Object.values(beds)){bed.source.stop();bed.source.disconnect();bed.filter.disconnect();bed.gain.disconnect();}beds=null;}
 let rampSurface='ramp';
 function startBeds(surface){if(beds)return;rampSurface=surface;beds={};for(const kind of ['ramp','wind','booster']){const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();source.buffer=loopBuffers[kind==='ramp'?surface:kind];source.loop=true;gain.gain.value=0;filter.type='lowpass';filter.frequency.value=kind==='ramp'?3500:1500;source.connect(filter);filter.connect(gain);gain.connect(effects);source.start();beds[kind]={source,gain,filter};}}
 function clear(){choirHold=null;for(const voice of localVoices){clearTimeout(voice.timer);voice.media.pause();}localVoices.clear();stopBeds();for(const source of voices){try{source.stop();}catch{}}voices.clear();}
 function play(kind,volume,pitch=1,delay=0){if(enabled)playBuffer(buffers[kind][sequence++%4],volume*.5,pitch,delay);}
 function playBuffer(buffer,volume,pitch,delay){while(voices.size>=18){const old=voices.values().next().value;old.stop();voices.delete(old);}const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.playbackRate.value=pitch;gain.gain.value=volume;source.connect(gain);gain.connect(effects);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};source.start(ctx.currentTime+delay);
  return {duration:(buffer.duration||0)/pitch+delay,fade(seconds){const now=ctx.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);gain.gain.linearRampToValueAtTime(0,now+seconds);try{source.stop(now+seconds+.02);}catch{}}};}
 return {
  output:effects,
  sample,
  // Quick but smooth fade of the last clip of a kind (e.g. the results jingle when leaving the bilan).
  fade(kind,seconds=.45){const voice=lastVoice[kind];if(!voice)return false;lastVoice[kind]=null;voice.fade(seconds);return true;},
  coin(final=false,row=0){if(final){play('coin',.5,1);play('coin',.42,1.25,.08);play('coin',.38,1.5,.16);}else play('coin',.28,1+Math.min(8,row)*.035);},
  beginFlight(){flightTrack=(flightTrack+1)%musicFiles.flight.length;if(!localFiles&&browserAudio)load('music',musicFiles.flight[flightTrack]);lastVictoryStage=0;choirHold=null;stopFanfare();if(tracks?.flight){tracks.flight.gain.gain.cancelScheduledValues(ctx.currentTime);tracks.flight.gain.gain.value=0;}},
  fanfare(stage){if(!Number.isInteger(stage)||stage<=lastVictoryStage)return;lastVictoryStage=stage;if(!enabled)return;stopFanfare();if(sample('victory',.62)){holdMusic(lastVoice.victory);return;}const data=Music.renderAccent('fanfare');holdMusic(null,data.length/24000);const buffer=ctx.createBuffer(1,data.length,24000),source=ctx.createBufferSource(),gain=ctx.createGain();buffer.copyToChannel(data,0);source.buffer=buffer;gain.gain.value=1;source.connect(gain);gain.connect(music);const current={source,gain};fanfare=current;source.onended=()=>{if(fanfare===current)fanfare=null;source.disconnect();gain.disconnect();};source.start();},
  // 0 while the choir holds the music back, 1 otherwise (eased in between).
  musicHush(){return hushMix;},
  setVolumes(values){
   if(Number.isFinite(values.effects)){localEffectsVolume=clamp(values.effects,0,1);for(const v of localVoices)v.media.volume=Math.min(1,v.volume*localEffectsVolume*.72);}
   if(Number.isFinite(values.music))localMusicVolume=clamp(values.music,0,1);
   for(const [key,bus] of [['effects',effects],['music',music]]){const value=Number(values[key]);if(Number.isFinite(value))bus.gain.setTargetAtTime(clamp(value,0,1),ctx.currentTime,.035);}},
  update(state){if(!enabled)return;if(state.hidden){clear();stopMusic();return;}musicUpdate(state);if(state.paused){clear();return;}const target=ambience(state);if(!beds&&!target.ramp&&!target.wind&&!target.booster)return;const surface=['skate','skates'].includes(state.launchType)?'wheels':state.launchType==='pan'?'pan':'ramp';if(beds&&rampSurface!==surface)stopBeds();startBeds(surface);for(const kind of ['ramp','wind','booster']){const bed=beds[kind];bed.gain.gain.setTargetAtTime(target[kind]*.55,ctx.currentTime,kind==='wind'?.14:.035);bed.source.playbackRate.setTargetAtTime(target[kind+'Rate'],ctx.currentTime,.09);if(kind!=='ramp')bed.filter.frequency.setTargetAtTime(target[kind+'Cutoff'],ctx.currentTime,.12);}},
  setEnabled(value){enabled=value;master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(value?.72:0,ctx.currentTime,.012);if(!value){clear();stopMusic();}},
  pauseEffects:clear,
  silence(){clear();stopMusic();},
  impact(hit){if(!enabled)return;const now=ctx.currentTime;if(now-lastImpact<.055)return;lastImpact=now;const force=clamp(Math.sqrt(hit.energy||0)/190,.2,1),pitch=.90+(sequence%5)*.035;play('stone',.35+force*.45,pitch);play('metal',.28+force*.48,pitch*.94,.008);},
  stop(hit={}){if(!enabled||ctx.currentTime-lastStop<.2)return;lastStop=ctx.currentTime;const force=clamp((hit.speed||hit.impactSpeed||80)/160,.35,1);play('stop',.65+force*.3,.86);play('metal',.45,.78,.025);play('stone',.19,.74,.17);},
  ground(speed){this.stop({speed});}
 };
}
const api={render,renderLoop,ambience,create};if(typeof module!=='undefined')module.exports=api;else root.GGSound=api;
})(typeof window!=='undefined'?window:globalThis);
