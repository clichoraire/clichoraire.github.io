// Snow Kids — bruitages WebAudio et bande sonore MP3 locale. SK.Audio.sfx('coin'), SK.Audio.music('rookie').
(function (SK) {
  'use strict';
  const A = SK.Audio = { enabled: true, ctx: null, musicOn: true, cur: null, timer: null };
  A.init = function () { if (A.ctx) return A.ctx; try { A.ctx = new (window.AudioContext || window.webkitAudioContext)(); A.master = A.ctx.createGain(); A.master.gain.value = 0.5; A.master.connect(A.ctx.destination); A.mgain = A.ctx.createGain(); A.mgain.gain.value = 0.35; A.mgain.connect(A.master); } catch (e) { A.enabled = false; } return A.ctx; };
  const tone = (f0, f1, dur, type, vol, when) => {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + (when || 0);
    o.type = type || 'square'; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(vol || 0.2, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(A.master); o.start(t0); o.stop(t0 + dur + 0.02);
  };
  const noise = (dur, vol, when) => {
    const c = A.ctx, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = vol || 0.3; s.connect(g); g.connect(A.master); s.start(c.currentTime + (when || 0));
  };
  A.sfx = function (name) {
    if (!A.enabled || !A.ctx) return;
    if (A.ctx.state === 'suspended') A.ctx.resume();
    switch (name) {
      case 'emergency': tone(180,620,.09,'triangle',.2); tone(620,230,.16,'sine',.18,.07); break;
      case 'coin': tone(1200, 1800, 0.08, 'square', 0.12); tone(1800, 2400, 0.12, 'square', 0.1, 0.07); break;
      case 'box': tone(500, 900, 0.12, 'triangle', 0.2); tone(900, 1300, 0.15, 'triangle', 0.15, 0.1); break;
      case 'jump': tone(300, 700, 0.18, 'sine', 0.2); break;
      case 'land': noise(0.08, 0.15); break;
      case 'trick': [660, 880, 1100, 1320].forEach((f, i) => tone(f, f, 0.1, 'square', 0.12, i * 0.07)); break;
      case 'fall': noise(0.25, 0.35); tone(300, 80, 0.4, 'sawtooth', 0.2); break;
      case 'shoot': tone(200, 900, 0.2, 'sawtooth', 0.18); break;
      case 'explode': noise(0.4, 0.5); tone(120, 40, 0.5, 'square', 0.25); break;
      case 'freeze': tone(1500, 400, 0.4, 'triangle', 0.2); break;
      case 'pan': tone(900, 300, 0.3, 'square', 0.25); noise(0.15, 0.3); break;
      case 'steal': tone(400, 1200, 0.25, 'sine', 0.2); tone(1200, 400, 0.25, 'sine', 0.15, 0.25); break;
      case 'fan': tone(200, 1400, 0.6, 'sawtooth', 0.15); break;
      case 'invisible': tone(800, 1600, 0.4, 'sine', 0.12); break;
      case 'rain': noise(0.6, 0.15); break;
      case 'rock': tone(150, 60, 0.2, 'square', 0.2); break;
      case 'lift': tone(440, 660, 0.3, 'triangle', 0.15); tone(660, 880, 0.3, 'triangle', 0.15, 0.3); break;
      case 'count': tone(660, 660, 0.15, 'square', 0.2); break;
      case 'go': tone(880, 880, 0.4, 'square', 0.25); tone(1320, 1320, 0.4, 'square', 0.15, 0.05); break;
      case 'wall': noise(0.1, 0.2); break;
      case 'finish': [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.25, 'square', 0.18, i * 0.15)); break;
      case 'win': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, f, 0.3, 'triangle', 0.2, i * 0.18)); break;
      case 'buy': tone(700, 1400, 0.2, 'square', 0.18); tone(1400, 1400, 0.2, 'square', 0.15, 0.2); break;
      case 'click': tone(900, 900, 0.05, 'square', 0.1); break;
      case 'nope': tone(200, 150, 0.2, 'square', 0.15); break;
      case 'unlock': [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, f, 0.35, 'triangle', 0.2, i * 0.12)); break;
    }
  };
  // MP3 locaux : les bruitages restent synthétisés, avec un réglage indépendant.
  const TRACKS = {"1": "01-title-theme.mp3", "2": "02-options-results.mp3", "3": "03-player-and-game-selection.mp3", "4": "04-battle-race-level-and-board-selection.mp3", "5": "05-skill-game-congratulations.mp3", "6": "06-skill-game-level-and-board-selection.mp3", "7": "07-time-attack-level-and-board-selection.mp3", "8": "08-board-shop.mp3", "9": "09-battle-race-start.mp3", "10": "10-battle-race-goal.mp3", "11": "11-rookie-mountain-ninja-land-animal-land.mp3", "12": "12-big-snowman.mp3", "13": "13-sunset-rock.mp3", "14": "14-night-highway.mp3", "15": "15-grass-valley.mp3", "16": "16-dizzy-land.mp3", "17": "17-silver-mountain.mp3", "18": "18-training.mp3", "19": "19-credits.mp3"};
  const THEMES={menu:1,results:2,select:3,course:4,congrats:5,schoolSelect:6,timeSelect:7,shop:8,start:9,goal:10,rookie:11,ninja:11,snowman:12,sunset:13,highway:14,grass:15,dizzy:16,silver:17,training:18,credits:19,town:18,sand:13};
  A.player=new Audio();A.player.preload='metadata';A.player.volume=.35;
  A.music=function(name,next){
    const track=THEMES[name];
    if(!name||!track){A.stopMusic();return;}
    const changed=A.cur!==name;
    A.cur=name;
    if(changed){A.player.pause();A.player.src='assets/music/snowboard-kids/'+TRACKS[track];A.player.loop=!['start','goal'].includes(name);A.next=next||null;}
    if(!A.musicOn)return;
    if(A.player.paused)A.player.play().catch(()=>{}); // Un geste utilisateur relance si le navigateur bloque l'autoplay.
  };
  A.player.addEventListener('ended',()=>{if(A.next){const next=A.next;A.next=null;A.music(next);}});
  A.player.addEventListener('error',()=>console.warn('Musique indisponible : '+A.cur));
  A.stopMusic=function(){A.player.pause();A.cur=null;A.next=null;};
  A.setEnabled=function(on){A.enabled=on;};
  A.setMusic=function(on){A.musicOn=on;if(!on)A.player.pause();else if(A.cur)A.music(A.cur);};
})(window.SK);
