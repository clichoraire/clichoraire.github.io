/* Bounded, test-only state history. structuredClone preserves Sets and Maps. */
(function(root){
class RewindHistory {
 constructor(seconds=10,interval=.05){this.limit=Math.ceil(seconds/interval)+1;this.interval=interval;this.frames=[];}
 clear(){this.frames.length=0;}
 record(time,value){const last=this.frames.at(-1);if(last&&time-last.time<this.interval-1e-8)return;this.frames.push({time,value:structuredClone(value)});if(this.frames.length>this.limit)this.frames.shift();}
 get available(){return this.frames.length>1;}
 back(seconds=.25){if(!this.available)return null;const target=this.frames.at(-1).time-seconds;let i=this.frames.length-2;while(i>0&&this.frames[i].time>target)i--;const frame=this.frames[i];this.frames.length=i+1;return structuredClone(frame.value);}
}
if(typeof module!=='undefined')module.exports=RewindHistory;else root.GGRewind=RewindHistory;
})(typeof window!=='undefined'?window:globalThis);
