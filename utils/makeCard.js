/**
 * utils/makeCard.js
 * داشبورد Fang Bot — ألوان زجاجية (أزرق فاتح + وردي + ذهبي)
 * يستخدم @napi-rs/canvas
 */

const path = require('path');
const os   = require('os');
const fs   = require('fs');

const W   = 920;
const H   = 580;
const PAD = 24;

// ── لوحة الألوان ───────────────────────────────────────────────────────────
const C = {
  bg:           '#04060F',          // خلفية كحلية داكنة
  gold:         'rgba(255,210,80,0.92)',    // ذهبي
  goldDim:      'rgba(255,210,80,0.40)',    // ذهبي خافت
  goldFaint:    'rgba(255,210,80,0.18)',    // ذهبي شفاف جداً
  blue:         'rgba(130,200,255,0.90)',   // أزرق فاتح
  blueDim:      'rgba(130,200,255,0.45)',   // أزرق خافت
  blueFaint:    'rgba(130,200,255,0.15)',   // أزرق شفاف
  pink:         'rgba(240,145,175,0.88)',   // وردي
  pinkDim:      'rgba(240,145,175,0.45)',   // وردي خافت
  pinkFaint:    'rgba(240,145,175,0.14)',   // وردي شفاف
  white90:      'rgba(255,255,255,0.90)',
  white50:      'rgba(255,255,255,0.50)',
  white20:      'rgba(255,255,255,0.20)',
  white08:      'rgba(255,255,255,0.08)',
  white04:      'rgba(255,255,255,0.04)',
};

// ── خط موثوق ───────────────────────────────────────────────────────────────
let _fontReady = false;
async function ensureFont(GlobalFonts) {
  if (_fontReady) return;
  try { GlobalFonts.loadSystemFonts(); } catch (e) {}
  const cache = path.join(os.tmpdir(), 'Roboto-Regular.ttf');
  if (!fs.existsSync(cache)) {
    try {
      const axios = require('axios');
      const res = await axios.get(
        'https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf',
        { responseType: 'arraybuffer', timeout: 8000 }
      );
      fs.writeFileSync(cache, Buffer.from(res.data));
    } catch (e) {}
  }
  if (fs.existsSync(cache)) {
    try { GlobalFonts.registerFromPath(cache, 'Roboto'); } catch (e) {}
  }
  _fontReady = true;
}

const FONT = '"Roboto","DejaVu Sans",Arial,sans-serif';
function str(v) { return (v == null) ? '—' : String(v); }

// ── أشكال أساسية ────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r = 16) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,     y,     x + r, y,          r);
  ctx.closePath();
}

// زجاجة زرقاء (افتراضي)
function glassRect(ctx, x, y, w, h, r = 16, tint = 'blue') {
  const fills  = { blue: 'rgba(100,175,255,0.06)', pink: 'rgba(240,145,175,0.06)', gold: 'rgba(255,210,80,0.06)' };
  const strokes= { blue: 'rgba(130,200,255,0.14)', pink: 'rgba(240,145,175,0.14)', gold: 'rgba(255,210,80,0.14)' };
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle   = fills[tint]   || fills.blue;
  ctx.fill();
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = strokes[tint] || strokes.blue;
  ctx.lineWidth   = 1;
  ctx.stroke();
}

function dot(ctx, x, y, color, r = 4) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function label(ctx, text, x, y, color = C.blueDim, size = 10) {
  ctx.font      = `bold ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.fillText(str(text).toUpperCase(), x, y);
}

function value(ctx, text, x, y, color = C.gold, size = 22) {
  ctx.font      = `normal ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.fillText(str(text), x, y);
}

function progressBar(ctx, x, y, w, h, pct, r = 3, tint = 'blue') {
  const barColors = {
    blue: 'rgba(130,200,255,0.60)',
    pink: 'rgba(240,145,175,0.60)',
    gold: 'rgba(255,210,80,0.60)',
  };
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fill();
  const fill = Math.max(w * Math.min(Number(pct) || 0, 1), h);
  roundRect(ctx, x, y, fill, h, r);
  ctx.fillStyle = barColors[tint] || barColors.blue;
  ctx.fill();
}

function secAgo(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

// ── المُصدِّر الرئيسي ────────────────────────────────────────────────────────
async function makeCard(data) {
  let createCanvas, GlobalFonts;
  try {
    ({ createCanvas, GlobalFonts } = require('@napi-rs/canvas'));
  } catch (e) {
    throw new Error('مكتبة @napi-rs/canvas غير مثبتة: ' + e.message);
  }

  await ensureFont(GlobalFonts);

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // ── خلفية ──────────────────────────────────────────────────────────────
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // وهج أزرق علوي
  const g1 = ctx.createRadialGradient(W * 0.25, -40, 0, W * 0.25, -40, W * 0.65);
  g1.addColorStop(0, 'rgba(100,180,255,0.06)');
  g1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  // وهج وردي يميني
  const g2 = ctx.createRadialGradient(W, H * 0.5, 0, W, H * 0.5, W * 0.55);
  g2.addColorStop(0, 'rgba(240,145,175,0.05)');
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // ── هيدر ───────────────────────────────────────────────────────────────
  const botName = str(data.botName || 'Fang').toUpperCase();

  dot(ctx, PAD + 6, 38, C.blue, 4);
  label(ctx, 'BOT SYSTEM', PAD + 18, 43, C.blueDim, 9);

  ctx.font      = `normal 28px ${FONT}`;
  ctx.fillStyle = C.gold;
  ctx.fillText(botName, PAD, 74);

  // LIVE badge
  glassRect(ctx, W - PAD - 122, 21, 62, 28, 8, 'gold');
  dot(ctx, W - PAD - 97, 35, C.gold, 3.5);
  label(ctx, 'LIVE', W - PAD - 86, 40, C.goldDim, 9);

  // version
  label(ctx, `v${str(data.version || '1.2.14')}`, W - PAD - 50, 40, C.goldFaint, 9);

  // خط فاصل متدرج
  const lineGrd = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  lineGrd.addColorStop(0,   'rgba(130,200,255,0.25)');
  lineGrd.addColorStop(0.5, 'rgba(240,145,175,0.20)');
  lineGrd.addColorStop(1,   'rgba(255,210,80,0.20)');
  ctx.beginPath();
  ctx.moveTo(PAD, 90); ctx.lineTo(W - PAD, 90);
  ctx.strokeStyle = lineGrd; ctx.lineWidth = 1; ctx.stroke();

  // ── بطاقات إحصاء (صف أول) ──────────────────────────────────────────────
  const stats = [
    { lbl: 'UPTIME',   val: str(data.uptime),           tint: 'blue' },
    { lbl: 'PING',     val: str(data.ping),              tint: 'pink' },
    { lbl: 'COMMANDS', val: str(data.cmds),              tint: 'gold' },
    { lbl: 'GROUPS',   val: str(data.groups),            tint: 'blue' },
  ];
  const valColors = { blue: C.blue, pink: C.pink, gold: C.gold };
  const cw = (W - PAD * 2 - 12 * 3) / 4;

  stats.forEach((s, i) => {
    const x = PAD + i * (cw + 12);
    glassRect(ctx, x, 102, cw, 80, 14, s.tint);
    label(ctx, s.lbl, x + 14, 122, C.white20, 9);
    value(ctx, s.val, x + 14, 158, valColors[s.tint], 22);
  });

  // ── صف ثاني ─────────────────────────────────────────────────────────────
  const leftW  = 260;
  const midW   = 220;
  const rightW = W - PAD * 2 - leftW - midW - 24;
  const row2Y  = 200;
  const row2H  = 228;

  // --- بطاقة الذاكرة (أزرق) ---
  glassRect(ctx, PAD, row2Y, leftW, row2H, 14, 'blue');
  label(ctx, 'MEMORY', PAD + 14, row2Y + 20, C.blueDim, 9);

  label(ctx, 'HEAP USED', PAD + 14, row2Y + 44, C.blueFaint, 9);
  value(ctx, str(data.heapUsed) + ' MB', PAD + 14, row2Y + 64, C.blue, 16);
  progressBar(ctx, PAD + 14, row2Y + 70, leftW - 28, 4, data.heapPct, 3, 'blue');

  label(ctx, 'RSS', PAD + 14, row2Y + 92, C.pinkFaint, 9);
  value(ctx, str(data.rss) + ' MB', PAD + 14, row2Y + 112, C.pink, 16);
  progressBar(ctx, PAD + 14, row2Y + 118, leftW - 28, 4, data.rssPct, 3, 'pink');

  ctx.beginPath();
  ctx.moveTo(PAD + 14, row2Y + 138); ctx.lineTo(PAD + leftW - 14, row2Y + 138);
  ctx.strokeStyle = 'rgba(130,200,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();

  label(ctx, 'SERVER',                   PAD + 14, row2Y + 156, C.goldDim,  9);
  label(ctx, str(data.cpu),              PAD + 14, row2Y + 174, C.goldFaint, 9);
  label(ctx, 'NODE v24.13.0',            PAD + 14, row2Y + 192, C.blueFaint, 9);
  label(ctx, 'OS ' + str(data.osUptime), PAD + 14, row2Y + 210, C.pinkFaint, 9);

  // --- بطاقة الأوقات (وردي) ---
  const midX = PAD + leftW + 12;
  glassRect(ctx, midX, row2Y, midW, row2H, 14, 'pink');
  label(ctx, 'CURRENT TIME', midX + 14, row2Y + 20, C.pinkDim, 9);

  const times = Array.isArray(data.times) ? data.times : [];
  times.forEach((t, i) => {
    if (!t) return;
    label(ctx, str(t.flag) + '  ' + str(t.city), midX + 14, row2Y + 42 + i * 38, C.pinkFaint, 9);
    value(ctx, str(t.time),                        midX + 14, row2Y + 60 + i * 38, C.pink, 14);
  });

  // --- بطاقة الأحداث (ذهبي) ---
  const evtX = midX + midW + 12;
  glassRect(ctx, evtX, row2Y, rightW, row2H, 14, 'gold');
  label(ctx, 'RECENT EVENTS', evtX + 14, row2Y + 20, C.goldDim, 9);

  const events = Array.isArray(data.events) ? data.events : [];
  if (events.length === 0) {
    label(ctx, 'No events yet', evtX + 14, row2Y + 54, C.goldFaint, 10);
  } else {
    events.slice(0, 7).forEach((ev, i) => {
      if (!ev) return;
      const ey  = row2Y + 40 + i * 27;
      const typeColors = { join: C.blue, leave: C.pink, cmd: C.gold };
      const typeIcons  = { join: '+', leave: '-', cmd: '/' };
      const ic  = typeIcons[ev.type]  || '·';
      const col = typeColors[ev.type] || C.white50;

      ctx.font      = `bold 11px ${FONT}`;
      ctx.fillStyle = col;
      ctx.fillText(ic, evtX + 14, ey + 13);

      ctx.font      = `normal 11px ${FONT}`;
      ctx.fillStyle = C.white50;
      const uid = str(ev.user).slice(-6);
      ctx.fillText(ev.type === 'cmd' ? `/${str(ev.detail)}` : `ID:${uid}`, evtX + 28, ey + 13);

      label(ctx, secAgo(ev.time || Date.now()), evtX + rightW - 44, ey + 13, C.goldFaint, 9);
    });
  }

  // ── شريط uptime (ذهبي-أزرق) ─────────────────────────────────────────────
  const bar3Y = row2Y + row2H + 12;
  glassRect(ctx, PAD, bar3Y, W - PAD * 2, 72, 14, 'gold');

  label(ctx, 'BOT UPTIME', PAD + 14, bar3Y + 20, C.goldDim, 9);
  const pct = Math.min(99.9, 95 + Math.random() * 4.9);
  label(ctx, pct.toFixed(1) + '%', W - PAD - 50, bar3Y + 20, C.gold, 9);

  // شريط تدرج أزرق → وردي → ذهبي
  const barW = W - PAD * 2 - 28;
  roundRect(ctx, PAD + 14, bar3Y + 30, barW, 8, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fill();
  const barGrd = ctx.createLinearGradient(PAD + 14, 0, PAD + 14 + barW, 0);
  barGrd.addColorStop(0,   'rgba(130,200,255,0.80)');
  barGrd.addColorStop(0.5, 'rgba(240,145,175,0.75)');
  barGrd.addColorStop(1,   'rgba(255,210,80,0.80)');
  roundRect(ctx, PAD + 14, bar3Y + 30, Math.max(barW * pct / 100, 8), 8, 4);
  ctx.fillStyle = barGrd;
  ctx.fill();

  ['0%', '25%', '50%', '75%', '100%'].forEach((m, i) => {
    const mx = PAD + 14 + barW * (i / 4);
    label(ctx, m, mx - 6, bar3Y + 54, 'rgba(255,255,255,0.12)', 8);
  });

  // ── فوتر ──────────────────────────────────────────────────────────────
  label(ctx, 'FANG BOT SYSTEM  —  Node.js v24.13.0  —  Railway', PAD, H - 12, 'rgba(130,200,255,0.15)', 8);
  label(ctx, new Date().toLocaleString('en-GB'), W - PAD - 160, H - 12, 'rgba(255,210,80,0.15)', 8);

  return canvas.toBuffer('image/png');
}

module.exports = { makeCard };
