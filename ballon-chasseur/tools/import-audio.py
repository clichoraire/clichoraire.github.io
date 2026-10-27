from pathlib import Path
import zipfile,subprocess
out=Path('assets/audio');out.mkdir(parents=True,exist_ok=True)
z=zipfile.ZipFile('/tmp/bc-music.zip')
for label,stem in [('menu','Title Screen'),('match','Level 1'),('boss','Level 3'),('result','Ending')]:
 name=next(n for n in z.namelist() if n.endswith(stem+'.wav'));tmp=Path('/tmp/bc-'+label+'.wav');tmp.write_bytes(z.read(name));subprocess.run(['ffmpeg','-v','error','-y','-i',str(tmp),'-codec:a','libmp3lame','-b:a','128k',str(out/(label+'.mp3'))],check=True)
(out/'MUSIC-LICENSE.txt').write_bytes(z.read('INFO.txt'))
z=zipfile.ZipFile('/tmp/bc-impact.zip')
for label,stem in [('hit','impactPunch_heavy_000'),('catch','impactSoft_medium_000'),('bounce','impactSoft_heavy_000'),('ui','impactWood_light_000'),('smash','impactPunch_heavy_002'),('explode','impactMetal_heavy_000'),('jump','footstep_wood_000'),('arm','impactBell_heavy_002')]:
 tmp=Path('/tmp/bc-'+label+'.ogg');tmp.write_bytes(z.read('Audio/'+stem+'.ogg'));subprocess.run(['ffmpeg','-v','error','-y','-i',str(tmp),'-codec:a','libmp3lame','-b:a','128k',str(out/(label+'.mp3'))],check=True)
(out/'SFX-LICENSE.txt').write_bytes(z.read('License.txt'))
(out/'CREDITS.txt').write_text('Music: Juhani Junkala / SubspaceAudio — 5 Chiptunes (Action), CC0.\nhttps://opengameart.org/content/5-chiptunes-action\nTitle Screen, Level 1, Level 3, Ending. Converted WAV to MP3.\n\nSound effects: Kenney — Impact Sounds, CC0.\nhttps://kenney.nl/assets/impact-sounds\nOriginal filenames mapped in tools/import-audio.py. Converted OGG to MP3.\n')
