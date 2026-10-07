"""Make a 20-minute narrated slide-and-interface walkthrough, not a live recording.
Run build-docs.py, render PDFs into tmp/video/slide-XX.png with Poppler,
then run build-narration.ps1. Requires imageio-ffmpeg. Audio uses a synthetic voice.
"""
from pathlib import Path
import subprocess, wave, json
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1]; TMP=ROOT/'tmp/video'; OUT=ROOT/'output';OUT.mkdir(exist_ok=True)
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe(); chapters=[]
story=json.loads((ROOT/'docs/storyboard.json').read_text(encoding='utf-8'))
for i in range(1,21):
 audio=TMP/f'narration-{i:02}.wav'; slide=TMP/f'slide-{i:02}.png'; target=TMP/f'chapter-{i:02}.mp4'
 if target.exists() and target.stat().st_mtime > max(audio.stat().st_mtime,slide.stat().st_mtime):
  chapters.append(target);print(f'Chapter {i}/20 reused',flush=True);continue
 with wave.open(str(audio)) as wav: duration=wav.getnframes()/wav.getframerate()
 speed=duration/59
 if not 0.5<=speed<=2:raise ValueError(f'Chapter {i}: narration pace adjustment outside acceptable range: {speed}')
 subprocess.run([ffmpeg,'-y','-hide_banner','-loglevel','error','-loop','1','-framerate','5','-i',str(slide),'-i',str(audio),'-vf','scale=1280:720,format=yuv420p','-af',f'atempo={speed:.8f},apad','-t','60','-r','5','-c:v','libx264','-preset','ultrafast','-tune','stillimage','-crf','21','-c:a','aac','-b:a','112k','-ar','44100','-movflags','+faststart',str(target)],check=True)
 chapters.append(target);print(f'Chapter {i}/20 ready ({duration:.1f}s source narration)',flush=True)
listing=TMP/'concat.txt';listing.write_text('\n'.join("file '"+str(p).replace('\\','/')+"'" for p in chapters),encoding='utf-8')
metadata=TMP/'chapters.txt';metadata.write_text(';FFMETADATA1\n'+''.join(f'[CHAPTER]\nTIMEBASE=1/1000\nSTART={(i-1)*60000}\nEND={i*60000}\ntitle={s["title"]}\n' for i,s in enumerate(story,1)),encoding='utf-8')
final=OUT/'NEPHRA-20-minute-demo.mp4'
subprocess.run([ffmpeg,'-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(listing),'-f','ffmetadata','-i',str(metadata),'-map_metadata','1','-map','0:v','-map','0:a','-c','copy','-movflags','+faststart',str(final)],check=True)
print(json.dumps({'video':str(final),'bytes':final.stat().st_size,'expected_duration_seconds':1200,'kind':'Narrated slide-and-interface walkthrough with synthetic Windows voice'}))
