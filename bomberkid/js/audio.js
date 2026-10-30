// Sons synthétisés (WebAudio) : aucun fichier à charger.
(function (BK) {
  'use strict';
  let ctx = null, master = null, muted = false;
  const A = BK.audio = {};
  const ensure = () => { if (ctx) return ctx; try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination); } catch (e) { ctx = null; } return ctx; };
  A.unlock = () => { const c = ensure(); if (c && c.state === 'suspended') c.resume(); };
  A.mute = m => { muted = m; };
  function tone(f0, f1, dur, type, vol, delay) {
    const c = ensure(); if (!c || muted) return; const t0 = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(vol || 0.3, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol, lp) {
    const c = ensure(); if (!c || muted) return; const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = buf; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp || 900; const g = c.createGain(); g.gain.value = vol || 0.5;
    s.connect(f); f.connect(g); g.connect(master); s.start();
  }
  // Petites voix douces, avec une attaque arrondie et une intonation animale.
  function animalVoice(start,peak,end,duration,volume,delay,formant) {
    const c=ensure();if(!c||muted)return;const t=c.currentTime+(delay||0),o=c.createOscillator(),filter=c.createBiquadFilter(),gain=c.createGain();
    o.type='sawtooth';o.frequency.setValueAtTime(start,t);o.frequency.exponentialRampToValueAtTime(peak,t+duration*.25);o.frequency.exponentialRampToValueAtTime(end,t+duration);
    filter.type='bandpass';filter.Q.value=1.6;filter.frequency.setValueAtTime(formant,t);filter.frequency.exponentialRampToValueAtTime(formant*.65,t+duration);
    gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(volume,t+.025);gain.gain.setValueAtTime(volume*.7,t+duration*.45);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
    o.connect(filter);filter.connect(gain);gain.connect(master);o.start(t);o.stop(t+duration+.025);
  }
  A.meow=()=>animalVoice(430,690,270,.65,.23,0,1250);
  A.bark=()=>{animalVoice(170,310,100,.17,.25,0,850);animalVoice(190,330,115,.19,.2,.25,950);};
  A.pet=e=>{
    if(e.petSoundPlayed||e.voice===false)return;e.petSoundPlayed=true;
    if(e.animal?.type==='chat')A.meow();else if(e.animal?.type==='chien')A.bark();else if(e.animal?.def.wildlife){const shape=e.animal.def.wildlife.shape;if(['owl','bat','duck','peacock'].includes(shape))animalVoice(650,950,500,.3,.12,0,1500);else animalVoice(220,320,180,.3,.13,0,900);}
  };
  A.place = () => tone(220, 110, 0.12, 'square', 0.15);
  A.pickup = () => tone(300, 600, 0.12, 'triangle', 0.25);
  A.throw = () => tone(500, 200, 0.25, 'triangle', 0.2);
  // Deux signatures courtes : rebond joyeux et double bip d'alerte.
  A.allyBombReturn = () => { tone(520,780,.12,'triangle',.22); tone(880,1175,.2,'sine',.19,.12); };
  A.allyBombWarning = () => { tone(880,660,.14,'square',.15); tone(880,660,.18,'square',.15,.22); };
  A.kick = () => tone(180, 90, 0.1, 'square', 0.15);
  A.explode = () => { noise(0.5, 0.8, 700); tone(90, 30, 0.45, 'sawtooth', 0.3); };
  A.block = () => noise(0.15, 0.3, 1500);
  A.coin = () => { tone(988, 988, 0.08, 'sine', 0.25); tone(1319, 1319, 0.3, 'sine', 0.28, 0.08); tone(2637, 2637, 0.12, 'sine', 0.08, 0.08); };
  A.item = () => { tone(660, 880, 0.08, 'square', 0.2); tone(880, 1320, 0.12, 'square', 0.2, 0.08); };
  A.hurt = () => { tone(300, 80, 0.3, 'sawtooth', 0.3); };
  A.die = () => { for (let i = 0; i < 5; i++) tone(500 - i * 80, 300 - i * 50, 0.12, 'square', 0.2, i * 0.1); };
  A.enemy = () => { tone(400, 100, 0.2, 'square', 0.2); noise(0.1, 0.2, 2000); };
  A.boss = () => { tone(120, 60, 0.4, 'sawtooth', 0.3); noise(0.3, 0.4, 500); };
  A.switch = () => { tone(520, 780, 0.1, 'square', 0.2); tone(780, 1040, 0.15, 'square', 0.2, 0.1); };
  A.door = () => { for (let i = 0; i < 4; i++) tone(400 + i * 120, 400 + i * 120, 0.12, 'triangle', 0.2, i * 0.09); };
  A.win = () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.18, 'square', 0.2, i * 0.13)); };
  A.lose = () => { [400, 350, 300, 200].forEach((f, i) => tone(f, f * 0.9, 0.25, 'triangle', 0.25, i * 0.2)); };
  A.stomp = () => { noise(0.3, 0.6, 400); tone(60, 30, 0.3, 'sine', 0.4); };
  A.click = () => tone(800, 600, 0.05, 'square', 0.1);
  A.medalDrop=()=>{tone(660,590,.16,'sine',.1);tone(494,440,.2,'sine',.08,.14);};
  A.medalWarning=()=>{tone(740,740,.14,'sine',.12);tone(988,988,.2,'sine',.1,.18);};
  A.countdown = () => tone(440, 440, 0.1, 'square', 0.2);
  A.go = () => tone(880, 880, 0.3, 'square', 0.25);
  A.rain = () => { noise(0.1, 0.25, 600); tone(100, 50, 0.12, 'square', 0.15); };
  A.shield = () => tone(900, 300, 0.3, 'sine', 0.3);
  A.fanfare = () => { [[523, 0], [523, 0.13], [523, 0.26], [659, 0.39], [784, 0.65], [659, 0.85], [784, 1.05]].forEach(([f, d]) => tone(f, f, 0.22, 'square', 0.22, d)); [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, f, 0.9, 'triangle', 0.16, 1.35 + i * 0.03)); };
  A.portal = () => { tone(220, 1400, 1.0, 'sine', 0.22); tone(330, 1800, 0.8, 'triangle', 0.12, 0.1); noise(0.7, 0.25, 2500); };
  A.diamond = () => { tone(1568, 2093, 0.25, 'sine', 0.22); tone(2093, 2637, 0.3, 'sine', 0.18, 0.12); };
  A.fire = () => { noise(0.2, 0.4, 1500); tone(320, 120, 0.25, 'sawtooth', 0.15); };
  A.ice = () => { tone(1400, 2200, 0.18, 'sine', 0.2); noise(0.1, 0.2, 4000); };
  A.magic = () => { tone(500, 900, 0.25, 'triangle', 0.18); tone(900, 500, 0.25, 'triangle', 0.18, 0.2); tone(700, 1100, 0.2, 'sine', 0.12, 0.4); };
  A.freeze = () => { tone(1800, 500, 0.45, 'sine', 0.22); noise(0.15, 0.25, 5000); };
  A.lift = () => { noise(0.2, 0.5, 400); tone(120, 420, 0.8, 'square', 0.18); };
  A.rocket = () => { noise(0.3, 0.5, 1800); tone(200, 900, 0.3, 'sawtooth', 0.12); };
  A.cannon = () => { noise(0.3, 0.7, 500); tone(110, 40, 0.3, 'square', 0.3); };
  A.charge = () => tone(110, 380, 0.55, 'sawtooth', 0.1);
  A.spit = () => { tone(180, 60, 0.22, 'sawtooth', 0.18); noise(0.12, 0.4, 700); };
  A.crumble = () => { noise(0.35, 0.6, 300); tone(90, 50, 0.3, 'square', 0.2); };
  A.shotHit = () => { noise(0.15, 0.4, 900); tone(300, 60, 0.2, 'sawtooth', 0.2); };
  A.jump = () => tone(320, 760, 0.14, 'square', 0.16);
  A.gulp = () => { for (let i = 0; i < 3; i++) { tone(230, 95, 0.18, 'sine', 0.35, i * 0.27); tone(600, 300, 0.05, 'triangle', 0.12, i * 0.27 + 0.1); } };
  A.honey = () => { tone(260, 120, 0.3, 'sine', 0.2); noise(0.12, 0.25, 600); };
  A.boing = () => { tone(180, 900, 0.3, 'sine', 0.22); tone(240, 1200, 0.25, 'triangle', 0.12); };
  A.buzz = () => tone(220, 260, 0.25, 'sawtooth', 0.1);
  A.land = () => noise(0.05, 0.12, 1200);
  A.snowStep = () => noise(0.07, 0.06, 1500);
  A.thud = () => { noise(0.12, 0.4, 500); tone(80, 40, 0.15, 'sine', 0.25); };   // roche qui retombe   // pas dans la neige : un petit crissement discret
  A.fall = () => tone(700, 120, 0.8, 'triangle', 0.22);
  A.splash = () => { noise(0.25, 0.5, 900); tone(500, 150, 0.25, 'sine', 0.2); };
  // Joue les sons correspondant aux événements du monde.
  A.events = (events) => { const allySounds=new Set(); for (const e of events) { if(e.type==='allyBombReturn'||e.type==='allyBombWarning'){if(allySounds.has(e.type))continue;allySounds.add(e.type);} const f = A.MAP[e.type]; if (f) f(e); } };
  A.rumble = () => { noise(0.7, 0.5, 220); tone(55, 30, 0.7, 'sine', 0.3); };
  A.plop = () => { tone(520, 180, 0.12, 'sine', 0.22); noise(0.08, 0.2, 1200); };
  A.munch = () => { for (let i = 0; i < 2; i++) { noise(0.08, 0.3, 900); tone(200, 120, 0.1, 'square', 0.12, i * 0.22); } };
  A.puff = () => noise(0.18, 0.25, 2500);
  A.pop = () => { tone(260, 720, 0.22, 'sine', 0.22); tone(520, 1040, 0.12, 'triangle', 0.1, 0.1); };
  A.growl = () => { tone(95, 45, 0.5, 'sawtooth', 0.28); noise(0.35, 0.3, 300); };   // grognement d'orque
  A.hiss = () => noise(0.4, 0.3, 3500);   // sifflement de serpent
  A.squeak = () => { tone(900, 1500, 0.1, 'square', 0.12); tone(1500, 1100, 0.08, 'square', 0.1, 0.1); };   // lapin qui démarre
  A.swing = () => noise(0.12, 0.22, 2200);   // coup d'épée
  A.heal = () => { tone(600, 900, 0.2, 'sine', 0.15); tone(900, 1300, 0.25, 'sine', 0.12, 0.15); };
  A.secret = () => { [659,523,587,784,659,1047].forEach((f,i)=>tone(f,f,i===5?.6:.14,'triangle',.24,.15+i*.15)); };
  A.MAP = { allyBombReturn:A.allyBombReturn, allyBombWarning:A.allyBombWarning, secretFound:A.secret, pet: A.pet, growl: A.growl, swing: A.swing, poisoned: A.hiss, rabbitCharge: A.squeak, rabbitTamed: A.item, rabbitEats: A.munch, shamanHeal: A.heal, carrotPicked: A.pickup, carrotThrown: A.throw, carrotLanded: A.land, snowStep: A.snowStep, sporeThrown: A.puff, mushroomGrown: A.pop, eruption: A.rumble, fishCast: A.throw, fishBite: A.plop, fishCaught: A.item, fishThrown: A.throw, fishHit: A.shotHit, fishLost: A.splash, fishLanded: A.land, cookStart: A.fire, cookDone: A.switch, feast: A.munch, rockPicked: A.pickup, rockLand: A.thud, rockBroken: A.crumble, rockLost: A.splash, bombPlaced: A.place, bombPicked: A.pickup, bombThrown: A.throw, bombKicked: A.kick, explosion: e => e.muffled ? A.stomp() : A.explode(), blockDestroyed: A.block, itemTaken: e => e.item === 'coin' ? A.coin() : A.item(), playerHit: A.hurt, playerDied: A.die, playerFell: e => e.kind === 'void' ? A.fall() : A.splash(), hop: A.jump, leap: A.jump, bounce: A.boing, beeOut: A.buzz, drink: A.gulp, honeyUsed: A.honey, mailboxBroken: A.block, hiveBroken: A.block, land: A.land, rocket: A.rocket, cannon: A.cannon, cannonCharge: A.charge, poisonSpit: A.spit, statueBroken: A.crumble, shotHit: A.shotHit, fireball: A.fire, iceShot: A.ice, magicCast: A.magic, frozen: A.freeze, teleport: A.switch, moleUp: A.block, dirtThrown: A.throw, boneThrown: A.throw, dive: A.kick,
    enemyKilled: e => e.enemy.boss ? A.boss() : A.enemy(), enemyHurt: e => e.enemy.boss && A.hurt(), switch: A.switch, stomp: A.stomp, shieldBroken: A.shield };
})(window.BK);
