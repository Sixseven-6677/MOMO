const path = require('path');
const os   = require('os');
const fs   = require('fs');

const W = 920, H = 760;
const MX = 14, MY = 14, MW = 892, MH = 732;

let _FR = false;
async function ensureFonts(GF) {
  if (_FR) return;
  try { GF.loadSystemFonts(); } catch(e) {}
  const ax = require('axios');
  const defs = [
    ['Roboto-Regular.ttf','Roboto','https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf'],
    ['Cairo-Regular.ttf','Cairo','https://github.com/google/fonts/raw/main/ofl/cairo/static/Cairo-Regular.ttf'],
    ['Cairo-Bold.ttf','Cairo','https://github.com/google/fonts/raw/main/ofl/cairo/static/Cairo-Bold.ttf'],
  ];
  for (const [file, name, url] of defs) {
    const p = path.join(os.tmpdir(), file);
    if (!fs.existsSync(p)) {
      try {
        const r = await ax.get(url, { responseType: 'arraybuffer', timeout: 10000 });
        fs.writeFileSync(p, Buffer.from(r.data));
      } catch(e) {}
    }
    if (fs.existsSync(p)) try { GF.registerFromPath(p, name); } catch(e) {}
  }
  _FR = true;
}

const F = '"Cairo","Roboto","DejaVu Sans",Arial,sans-serif';
const sv = v => (v == null) ? '—' : String(v);

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r);
  ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r);
  ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
}

function glass(ctx, x, y, w, h, r=24, fa='rgba(77,163,255,0.06)', fb='rgba(77,163,255,0.13)') {
  rr(ctx,x,y,w,h,r); ctx.fillStyle=fa; ctx.fill();
  rr(ctx,x,y,w,h,r); ctx.strokeStyle=fb; ctx.lineWidth=1; ctx.stroke();
}

function pbar(ctx, x, y, w, h, pct, c0, c1) {
  rr(ctx,x,y,w,h,5); ctx.fillStyle='rgba(255,255,255,0.07)'; ctx.fill();
  const fw = Math.max(w * Math.min(Number(pct)||0, 1), h);
  const g = ctx.createLinearGradient(x,0,x+fw,0);
  g.addColorStop(0,c0); g.addColorStop(1,c1);
  rr(ctx,x,y,fw,h,5); ctx.fillStyle=g; ctx.fill();
}

async function makeCard(data) {
  let createCanvas, GlobalFonts;
  try { ({ createCanvas, GlobalFonts } = require('@napi-rs/canvas')); }
  catch(e) { throw new Error('@napi-rs/canvas: '+e.message); }
  await ensureFonts(GlobalFonts);

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  ctx.fillStyle = '#050816';
  ctx.fillRect(0, 0, W, H);

  const g1 = ctx.createRadialGradient(W*0.12,0,0,W*0.12,0,W*0.72);
  g1.addColorStop(0,'rgba(31,79,255,0.35)'); g1.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g1; ctx.fillRect(0,0,W,H);

  const g2 = ctx.createRadialGradient(W,H,0,W,H,W*0.68);
  g2.addColorStop(0,'rgba(255,0,255,0.22)'); g2.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g2; ctx.fillRect(0,0,W,H);

  rr(ctx,MX,MY,MW,MH,32); ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fill();
  const bg = ctx.createLinearGradient(MX,MY,MX+MW,MY+MH);
  bg.addColorStop(0,'rgba(77,163,255,0.65)'); bg.addColorStop(0.5,'rgba(184,77,255,0.55)'); bg.addColorStop(1,'rgba(77,163,255,0.65)');
  rr(ctx,MX,MY,MW,MH,32); ctx.strokeStyle=bg; ctx.lineWidth=1.5; ctx.stroke();
  ctx.save(); ctx.shadowBlur=50; ctx.shadowColor='rgba(77,163,255,0.28)';
  rr(ctx,MX,MY,MW,MH,32); ctx.strokeStyle='rgba(77,163,255,0.10)'; ctx.lineWidth=4; ctx.stroke();
  ctx.restore();

  const IX = MX+30, IW = MW-60;

  const botTitle = sv(data.botName||'Fang').toUpperCase()+' DASHBOARD';
  const tg = ctx.createLinearGradient(IX,0,IX+520,0);
  tg.addColorStop(0,'#4da3ff'); tg.addColorStop(1,'#d84dff');
  ctx.font=`bold 34px ${F}`; ctx.fillStyle=tg; ctx.textAlign='left';
  ctx.fillText(botTitle, IX, MY+76);

  ctx.save();
  ctx.shadowBlur=18; ctx.shadowColor='#48ffd5';
  ctx.beginPath(); ctx.arc(MX+MW-116,MY+62,8,0,Math.PI*2);
  ctx.fillStyle='#48ffd5'; ctx.fill();
  ctx.restore();
  ctx.font=`bold 20px ${F}`; ctx.fillStyle='#48ffd5';
  ctx.fillText('ONLINE', MX+MW-100, MY+68);

  const lineG = ctx.createLinearGradient(IX,0,IX+IW,0);
  lineG.addColorStop(0,'rgba(77,163,255,0.28)'); lineG.addColorStop(0.5,'rgba(184,77,255,0.22)'); lineG.addColorStop(1,'rgba(77,163,255,0.28)');
  ctx.beginPath(); ctx.moveTo(IX,MY+90); ctx.lineTo(IX+IW,MY+90);
  ctx.strokeStyle=lineG; ctx.lineWidth=1; ctx.stroke();

  const sY = MY+100, sH = 62;
  const sCfg = [
    {lbl:'UPTIME', val:data.uptime, vc:'rgba(72,255,213,.90)', fa:'rgba(0,198,184,.07)', fb:'rgba(0,198,184,.15)'},
    {lbl:'PING',   val:data.ping,   vc:'rgba(77,163,255,.90)', fa:'rgba(77,163,255,.07)', fb:'rgba(77,163,255,.15)'},
    {lbl:'CMDS',   val:data.cmds,   vc:'rgba(210,108,255,.90)',fa:'rgba(145,61,255,.07)', fb:'rgba(145,61,255,.15)'},
    {lbl:'GROUPS', val:data.groups, vc:'rgba(255,190,92,.90)', fa:'rgba(176,106,0,.07)',  fb:'rgba(176,106,0,.15)'},
  ];
  const sW = (IW-36)/4;
  sCfg.forEach((sc,i) => {
    const x = IX+i*(sW+12);
    glass(ctx,x,sY,sW,sH,18,sc.fa,sc.fb);
    ctx.font=`bold 10px ${F}`; ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.textAlign='left';
    ctx.fillText(sc.lbl, x+14, sY+22);
    ctx.font=`normal 21px ${F}`; ctx.fillStyle=sc.vc;
    ctx.fillText(sv(sc.val), x+14, sY+50);
  });

  let cy = sY+sH+14;
  const cH=92, ISZ=70, GAP=11;
  const cards = [
    {fa:'rgba(77,83,255,.07)',fb:'rgba(77,83,255,.16)',ig:['#4d5fff','#6b8cff'],it:'CPU',
     lbl:'المعالج المستخدم', val:sv(data.cpu), vc:'rgba(255,255,255,.80)', vs:(data.cpu&&sv(data.cpu).length>18?14:18), bar:null},
    {fa:'rgba(0,198,184,.07)',fb:'rgba(0,198,184,.16)',ig:['#00c6b8','#00b894'],it:'UP',
     lbl:'وقت التشغيل', val:sv(data.uptime), vc:'#39ffe1', vs:26, bar:null},
    {fa:'rgba(145,61,255,.07)',fb:'rgba(145,61,255,.16)',ig:['#913dff','#cf63ff'],it:'MEM',
     lbl:'الذاكرة المستخدمة', val:sv(data.heapUsed)+' MB', vc:'#d26cff', vs:24,
     bar:{pct:data.heapPct,c0:'#d26cff',c1:'#b84dff',sub:(Math.min(Number(data.heapPct)||0,1)*100).toFixed(0)+'%'}},
    {fa:'rgba(27,124,255,.07)',fb:'rgba(27,124,255,.16)',ig:['#1b7cff','#4dd2ff'],it:'DSK',
     lbl:'المساحة المتاحة', val:sv(data.diskFree||'N/A'), vc:'#4dd2ff', vs:24,
     bar:data.diskFreePct!=null?{pct:data.diskFreePct,c0:'#4dd2ff',c1:'#1b7cff',sub:(Math.min(Number(data.diskFreePct)||0,1)*100).toFixed(0)+'%'}:null},
    {fa:'rgba(176,106,0,.07)',fb:'rgba(176,106,0,.18)',ig:['#b06a00','#ffb84d'],it:'NOW',
     lbl:'زمن التشغيل الحالي', val:sv(data.currentTime||new Date().toLocaleTimeString('en-US',{hour12:true})), vc:'#ffbe5c', vs:26, bar:null},
  ];

  for (const c of cards) {
    glass(ctx,IX,cy,IW,cH,24,c.fa,c.fb);

    const ig = ctx.createLinearGradient(IX+18,cy+(cH-ISZ)/2,IX+18+ISZ,cy+(cH+ISZ)/2);
    ig.addColorStop(0,c.ig[0]); ig.addColorStop(1,c.ig[1]);
    rr(ctx,IX+18,cy+(cH-ISZ)/2,ISZ,ISZ,20); ctx.fillStyle=ig; ctx.fill();
    ctx.font=`bold 15px ${F}`; ctx.fillStyle='rgba(255,255,255,0.95)';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(c.it, IX+18+ISZ/2, cy+cH/2);
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';

    const lx = IX+18+ISZ+20;
    ctx.font=`bold 22px ${F}`; ctx.fillStyle='rgba(255,255,255,0.90)';
    ctx.fillText(c.lbl, lx, cy+28);

    if (c.bar) {
      const bW = IW-ISZ-56-150;
      pbar(ctx,lx,cy+40,bW,10,c.bar.pct,c.bar.c0,c.bar.c1);
      ctx.font=`normal 14px ${F}`; ctx.fillStyle='rgba(255,255,255,0.45)';
      ctx.fillText(c.bar.sub, lx+bW+10, cy+51);
    }

    ctx.font=`bold ${c.vs}px ${F}`; ctx.fillStyle=c.vc;
    ctx.textAlign='right';
    ctx.fillText(c.val, IX+IW-18, cy+cH/2+c.vs*0.35);
    ctx.textAlign='left';

    cy += cH+GAP;
  }

  ctx.font=`bold 16px ${F}`; ctx.fillStyle='rgba(255,255,255,0.28)';
  ctx.textAlign='center';
  ctx.fillText('STAY POWERED  ⚡  FANG BOT  |  Node.js v24.13.0', W/2, MY+MH-14);
  ctx.textAlign='left';

  return canvas.toBuffer('image/png');
}

module.exports = { makeCard };
