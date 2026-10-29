// Two anatomical segments: fixed lengths, one elbow pole, no stretched limbs.
(function(SK){
 'use strict';
 SK.ArmRig={
  solve(from,target,upper=.33,lower=.31,bend=1){
   const vx=target[0]-from[0],vy=target[1]-from[1],raw=Math.hypot(vx,vy);
   const dx=raw>1e-8?vx/raw:0,dy=raw>1e-8?vy/raw:1;
   const distance=Math.max(Math.abs(upper-lower)+.001,Math.min(upper+lower-.003,raw));
   const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
   const offset=Math.sqrt(Math.max(0,upper*upper-along*along));
   return {shoulder:[...from],elbow:[from[0]+dx*along-dy*offset*bend,from[1]+dy*along+dx*offset*bend],wrist:[from[0]+dx*distance,from[1]+dy*distance],upper,lower};
  }
 };
})(window.SK);
