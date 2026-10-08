"""Regenerate both submission PDFs and the demo narration from original content.
Requires reportlab. Run from repository root. No network or patient data used.
"""
import json, textwrap, shutil
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist'/'docs'; OUT.mkdir(parents=True,exist_ok=True)
TMP=ROOT/'tmp'/'video';TMP.mkdir(parents=True,exist_ok=True)
INK='#123D3B';TEAL='#0A8177';MINT='#ABF1D5';GREY='#607D76';PAPER='#F4F8F6'
W,H=1280,720
slides=json.loads((ROOT/'docs/storyboard.json').read_text(encoding='utf-8'))
metrics=json.loads((ROOT/'dist/data/evaluation.json').read_text())
def text(c,s,x,y,size=26,color=INK,bold=False):
 c.setFillColor(HexColor(color));c.setFont('Helvetica-Bold' if bold else 'Helvetica',size);c.drawString(x,y,s)
def para(c,s,x,y,width=1100,size=25,color=GREY):
 st=ParagraphStyle('p',fontName='Helvetica',fontSize=size,leading=size*1.45,textColor=HexColor(color))
 p=Paragraph(s,st);_,h=p.wrap(width,600);p.drawOn(c,x,y-h);return h
def footer(c,n,dark=False):
 col='#8DB5A9' if dark else '#718D82'
 text(c,'NEPHRA  /  SYNTHETIC RESEARCH PROTOTYPE',64,31,12,col)
 text(c,f'{n:02d}',1180,31,12,col)
def base(c,n,title,kicker='DIGITAL TWIN CHALLENGE 2026',dark=False):
 c.setFillColor(HexColor(INK if dark else PAPER));c.rect(0,0,W,H,fill=1,stroke=0)
 text(c,kicker,64,658,13,MINT if dark else TEAL,True)
 para(c,title,64,609,1150,45,'#FFFFFF' if dark else INK)
 footer(c,n,dark)
def screenshot(c,name):
 path=ROOT/'docs/screenshots'/name
 if not path.exists():raise FileNotFoundError(path)
 img=ImageReader(str(path));iw,ih=img.getSize()
 crops={'dashboard.png':(247,300,1410,925),'scenarios.png':(248,265,1410,948),'dropout.png':(248,263,1410,865),'workflow.png':(248,178,1410,969)}
 crops['body-twin-female.png']=(242,169,1406,973)
 x1,y1,x2,y2=crops[name];cw,ch=x2-x1,y2-y1;scale=min(1152/cw,472/ch)
 dx=64+(1152-cw*scale)/2;dy=70+(472-ch*scale)/2
 c.saveState();clip=c.beginPath();clip.rect(dx,dy,cw*scale,ch*scale);c.clipPath(clip,stroke=0)
 c.drawImage(img,dx-x1*scale,dy-(ih-y2)*scale,width=iw*scale,height=ih*scale,mask='auto');c.restoreState()
def architecture(c):
 # Functional data-flow diagram, not decorative artwork.
 nodes=[(65,412,300,100,'HISTORICAL RECORD','Dry weight, baseline BP, refill prior'),(65,260,300,100,'SENSOR REPLAY','Cuff, RBV, pulse, UF, quality'),(467,334,320,116,'CAUSAL STATE UPDATE','Validate > time gate > estimate'),(887,412,320,100,'30-MINUTE FORECAST','Pressure, sensitivity, review status'),(887,260,320,100,'SCENARIO SIMULATOR','Same state; different hypothetical UF')]
 for x,y,w,h,t,b in nodes:
  c.setFillColor(HexColor('#E7F1EC'));c.setStrokeColor(HexColor('#B6D4C5'));c.roundRect(x,y,w,h,10,fill=1,stroke=1)
  text(c,t,x+18,y+h-30,17,INK,True);para(c,b,x+18,y+h-47,w-32,17,GREY)
 c.setStrokeColor(HexColor(TEAL));c.setLineWidth(2)
 for xa,ya,xb,yb in [(365,462,420,462),(365,310,420,310),(420,310,420,462),(420,392,467,392),(787,392,839,392),(839,310,839,462),(839,462,887,462),(839,310,887,310),(1047,260,1047,203),(627,334,627,203),(627,203,1047,203)]:c.line(xa,ya,xb,yb)
 text(c,'CLINICIAN REVIEW > DRAFT EXPORT > LOCAL DEMO LOG',375,161,21,TEAL,True)
 para(c,'All patient computation stays in the browser. No machine commands, hospital connection or clinical database.',150,124,1000,18,GREY)

c=canvas.Canvas(str(OUT/'presentation.pdf'),pagesize=(W,H))
c.setTitle('NEPHRA | Digital Twin Challenge 2026');c.setAuthor('NEPHRA contributors')
for i,s in enumerate(slides,1):
 kind=s.get('kind','text');dark=kind in ['cover','closing'];base(c,i,s['title'],s.get('kicker','DIGITAL TWIN CHALLENGE 2026'),dark)
 if kind=='cover':
  text(c,'A dialysis digital twin.',64,425,57,'#FFFFFF',True)
  para(c,'Anticipate a pressure fall.<br/>Make the review easier to prepare.',64,380,900,34,MINT)
  para(c,'Historical record + changing sensors + patient-specific simulation',64,198,1100,23,'#A5C9BC')
  text(c,'Working proof of concept  |  October 2026',64,100,18,'#A5C9BC')
 elif kind=='architecture':architecture(c)
 elif kind=='screenshot':screenshot(c,s['image'])
 elif kind=='metric':
  text(c,'90%',64,352,133,TEAL,True);para(c,'Target reduction in repetitive preparation time',430,448,700,32,INK)
  para(c,'90 seconds manual > 9 seconds assisted<br/>24 patients x 8 review cycles<br/>288 minutes > 28.8 minutes per day',430,325,690,27,GREY)
  para(c,'Editable planning assumptions. No measured time savings; bedside care and clinical judgement are excluded.',64,141,1140,22,GREY)
 elif kind=='results':
  labels=['Personalised twin','Recent linear trend','Last cuff carried forward'];maes=[metrics['methods'][k]['mae'] for k in labels]
  text(c,f"{metrics['patients']} synthetic patients / {metrics['windows']:,} eligible windows",64,505,24,GREY)
  for j,(name,val) in enumerate(zip(labels,maes)):
   y=397-j*95;text(c,name,64,y+12,23,INK);c.setFillColor(HexColor(TEAL if j==0 else '#B4CBC1'));c.rect(410,y,650*val/7,32,fill=1,stroke=0);text(c,f'{val:.2f}',1087,y+7,25,INK,True)
  para(c,'Mean absolute error of the next-30-minute pressure nadir (mmHg). Lower is better. Synthetic engineering evidence only.',64,123,1140,21,GREY)
 elif kind=='closing':
  para(c,s['body'],64,455,1120,34,'#D5EEE2')
  para(c,'Team and college fields are intentionally left for the submitting team.',64,159,1120,21,'#8DB5A9')
 else:
  y=479
  for item in s.get('points',[]):
   h=para(c,item,64,y,1120,28,INK);y-=h+34
  if 'source' in s:para(c,s['source'],64,106,1135,14,GREY)
 c.showPage()
c.save()

c=canvas.Canvas(str(OUT/'architecture.pdf'),pagesize=(W,H));c.setTitle('NEPHRA system architecture');c.setAuthor('NEPHRA contributors')
base(c,1,'A local, inspectable digital twin','IMPLEMENTED ARCHITECTURE');architecture(c);c.showPage()
base(c,2,'Boundaries that make the prototype reviewable','DATA FLOW AND VALIDATION')
y=486
for title,body in [('Runtime','Static server > browser modules > memory-only synthetic observations. Only local review markers persist.'),('Model','Historical priors + current and past observations > deficit filter > refill and trend > forecast and isolated scenarios.'),('Evaluation','Separate seeded patients > future truth used only for scoring > simple baselines > metrics JSON and raw CSV.'),('Future integration','Clinical device adapters, authenticated users, secure clinical storage and external validation are not implemented.')]:
 text(c,title,65,y,27,TEAL,True);para(c,body,310,y+23,890,23,GREY);y-=100
c.showPage();c.save()
shutil.copyfile(ROOT/'docs/model-card.md',OUT/'model-card.md')
lines=['# 20-minute narrated demonstration','', 'The supplied narration is an original script for a slide-and-interface walkthrough. All interface images are actual captures of the working synthetic prototype. The final video uses a synthetic Windows voice. It is not a recording of a clinician or a clinical session.','', 'Upload the finished MP4 as Unlisted and add the exact URL to README. Re-record with a team member if preferred. Each chapter is approximately one minute; final timing is normalised to 20 minutes.','']
for i,s in enumerate(slides,1):
 lines.extend([f"## {i-1:02d}:00 - {i:02d}:00 | {s['title']}",'',s['narration'],''])
 (TMP/f'narration-{i:02d}.txt').write_text(s['narration'],encoding='utf-8')
(ROOT/'docs/demo-script.md').write_text('\n'.join(lines),encoding='utf-8')
print(json.dumps({'presentation':str(OUT/'presentation.pdf'),'architecture':str(OUT/'architecture.pdf'),'slides':len(slides),'narration_words':sum(len(s['narration'].split()) for s in slides)}))
