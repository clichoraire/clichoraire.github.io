// Attach persisted rig data to the same portrait object in every family game.
(function(root){'use strict';const F=root.FamilyHeads,R=root.PortraitRig;if(!F||!R)return;
const packages=new Map(),originalAdd=F.add;
F.setLandmarks=(id,value)=>{const p=R.validatePackage(value);packages.set(id,p);return p;};
F.getLandmarks=(id,view='front')=>packages.get(id)?.views[view]||null;
F.getRig=id=>packages.get(id)||null;
F.add=async(id,src,rig)=>{const valid=rig?R.validatePackage(rig):null,loaded=await originalAdd(id,src);if(loaded){packages.delete(id);if(valid)packages.set(id,valid);}return loaded;};
// Offline exports keep the same metadata alongside embedded images.
for(const [id,value] of Object.entries(root.FAMILY_PORTRAIT_RIGS||{})){try{F.setLandmarks(id,value);}catch(e){console.warn('Repères de portrait invalides : '+id);}}
// Games that already have a family-online adapter pass the package to F.add.
// Other consumers can load a catalog atomically without depending on a game namespace.
F.loadCatalog=async(catalog,api)=>{const loaded=[];for(const p of catalog?.people||[]){if(!/^custom-[a-f0-9-]{36}$/.test(p.id)||p.portrait!=='/portraits/'+p.id+'.png')continue;try{if(await F.add(p.id,api+p.portrait,p.landmarks))loaded.push(p);}catch(e){console.warn('Portrait ou repères indisponibles : '+p.id);}}return loaded;};
})(window);
