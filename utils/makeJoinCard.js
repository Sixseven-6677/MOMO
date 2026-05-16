const path = require('path');
const os   = require('os');
const fs   = require('fs');

let _FR = false;
async function ensureFonts(GF) {
  if (_FR) return;
  try { GF.loadSystemFonts(); } catch(e) {}
  const ax = require('axios');
  const defs = [
    ['Roboto-Regular.ttf','Roboto','https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf'],
    ['Roboto-Bold.ttf','RobotoBold','https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Bold.ttf'],
  ];
  for (const [file, name, url] of defs) {
    const p = path.join(os.tmpdir(), file);
    if (!fs.existsSync(p)) {
      try {
        const r = await ax.get(url, { responseType: 'arraybuffer', timeout: 10000 });
        if (r.data.byteLength > 5000) fs.writeFileSync(p, Buffer.from(r.data));
      } catch(e) {}
    }
    if (fs.existsSync(p)) try { GF.registerFromPath(p, name); } catch(e) {}
  }
  _FR = true;
}

const FB = '"RobotoBold","Roboto","DejaVu Sans",Arial,sans-serif';
const FR = '"Roboto","DejaVu Sans",Arial,sans-serif';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r);
  ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r);
  ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
}

async function makeJoinCard({ name, threadName, memberCount, author, avatarUrl }) {
  let createCanvas, GlobalFonts, loadImage;
  try { ({ createCanvas, GlobalFonts, loadImage } = require('@napi-rs/canvas')); }
  catch(e) { throw new Error('@napi-rs/canvas: ' + e.message); }
  await ensureFonts(GlobalFonts);

  const W = 820, H = 420;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#080e1a';
  ctx.fillRect(0, 0, W, H);

  // Glow blobs
  const g1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 480);
  g1.addColorStop(0, 'rgba(0,220,110,0.30)');
  g1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

  const g2 = ctx.createRadialGradient(W, H, 0, W, H, 420);
  g2.addColorStop(0, 'rgba(0,140,255,0.22)');
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

  // Outer border
  rr(ctx, 10, 10, W-20, H-20, 30);
  const borderG = ctx.createLinearGradient(10, 10, W-10, H-10);
  borderG.addColorStop(0, 'rgba(0,230,120,0.75)');
  borderG.addColorStop(0.5, 'rgba(0,180,255,0.50)');
  borderG.addColorStop(1, 'rgba(0,230,120,0.75)');
  ctx.strokeStyle = borderG; ctx.lineWidth = 1.8; ctx.stroke();

  // Avatar circle
  const AX = 80, AY = H / 2, AR = 88;

  ctx.save();
  ctx.shadowBlur = 30; ctx.shadowColor = '#00e678';
  ctx.beginPath(); ctx.arc(AX, AY, AR + 4, 0, Math.PI * 2);
  const ringG = ctx.createLinearGradient(AX-AR, AY-AR, AX+AR, AY+AR);
  ringG.addColorStop(0, '#00e678'); ringG.addColorStop(1, '#0096ff');
  ctx.strokeStyle = ringG; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath(); ctx.arc(AX, AY, AR, 0, Math.PI * 2); ctx.clip();
  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);
      ctx.drawImage(img, AX - AR, AY - AR, AR * 2, AR * 2);
    } catch(e) {
      ctx.fillStyle = 'rgba(0,230,120,0.18)'; ctx.fill();
      ctx.font = `bold 48px ${FB}`; ctx.fillStyle = '#00e678';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((name || '?')[0].toUpperCase(), AX, AY);
    }
  } else {
    ctx.fillStyle = 'rgba(0,230,120,0.18)'; ctx.fill();
    ctx.font = `bold 48px ${FB}`; ctx.fillStyle = '#00e678';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((name || '?')[0].toUpperCase(), AX, AY);
  }
  ctx.restore();

  const LX = 190;
  ctx.textBaseline = 'alphabetic';

  // JOINED badge
  const badgeG = ctx.createLinearGradient(LX, 60, LX + 280, 80);
  badgeG.addColorStop(0, '#00e678'); badgeG.addColorStop(1, '#0096ff');
  ctx.font = `bold 12px ${FB}`; ctx.fillStyle = badgeG; ctx.textAlign = 'left';
  ctx.fillText('● JOINED THE GROUP', LX, 72);

  // Name
  const nameText = (name || '').length > 24 ? name.slice(0, 24) + '…' : (name || '—');
  const nameSize = nameText.length > 18 ? 28 : 34;
  const ng = ctx.createLinearGradient(LX, 90, LX + 580, 130);
  ng.addColorStop(0, '#ffffff'); ng.addColorStop(1, '#a0e0ff');
  ctx.font = `bold ${nameSize}px ${FB}`; ctx.fillStyle = ng;
  ctx.fillText(nameText, LX, 126);

  // Divider
  const divG = ctx.createLinearGradient(LX, 0, LX + 560, 0);
  divG.addColorStop(0, 'rgba(0,230,120,0.45)'); divG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.moveTo(LX, 144); ctx.lineTo(LX + 580, 144);
  ctx.strokeStyle = divG; ctx.lineWidth = 1; ctx.stroke();

  // Info rows
  const tn = (threadName || '—').length > 30 ? threadName.slice(0, 30) + '…' : (threadName || '—');
  const auth = (author || 'Link Join').length > 26 ? author.slice(0, 26) + '…' : (author || 'Link Join');
  const rows = [
    { label: 'GROUP',    val: tn,            color: '#4dd2ff' },
    { label: 'MEMBER',   val: `#${memberCount || '?'}`, color: '#00e678' },
    { label: 'ADDED BY', val: auth,          color: '#d26cff' },
  ];

  rows.forEach((row, i) => {
    const y = 184 + i * 58;
    ctx.font = `bold 11px ${FB}`; ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillText(row.label, LX, y);
    ctx.font = `bold 20px ${FR}`; ctx.fillStyle = row.color;
    ctx.fillText(row.val, LX, y + 28);
  });

  // Footer
  ctx.font = `bold 12px ${FB}`; ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.textAlign = 'center';
  ctx.fillText(`WELCOME  •  ${global?.config?.BOTNAME || 'MOMO'} BOT`, W / 2, H - 18);

  return canvas.toBuffer('image/png');
}

module.exports = { makeJoinCard };
