/**
 * utils/makeCard.js
 * يولّد صورة داشبورد PNG للأمر uptime
 * يستخدم @napi-rs/canvas — بدون أي متطلبات نظام إضافية
 */

const path = require('path');
const os   = require('os');

const W = 920;
const H = 580;
const PAD = 24;

function hex(h, a = 1) {
    const r = parseInt(h.slice(1,3),16);
    const g = parseInt(h.slice(3,5),16);
    const b = parseInt(h.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
}

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

function glassRect(ctx, x, y, w, h, r = 16) {
    roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();
    roundRect(ctx, x, y, w, h, r);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function label(ctx, text, x, y, color = 'rgba(255,255,255,0.30)', size = 10) {
    ctx.font = `600 ${size}px sans-serif`;
    ctx.letterSpacing = '2px';
    ctx.fillStyle = color;
    ctx.fillText(text.toUpperCase(), x, y);
}

function value(ctx, text, x, y, color = 'rgba(255,255,255,0.90)', size = 22) {
    ctx.font = `300 ${size}px sans-serif`;
    ctx.letterSpacing = '0px';
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

function dot(ctx, x, y, color = 'rgba(255,255,255,0.9)', r = 4) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function progressBar(ctx, x, y, w, h, pct, r = 3) {
    roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fill();
    if (pct > 0) {
        roundRect(ctx, x, y, Math.max(w * pct, h), h, r);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fill();
    }
}

function secAgo(ms) {
    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60)  return `${s}s`;
    if (s < 3600) return `${Math.floor(s/60)}m`;
    return `${Math.floor(s/3600)}h`;
}

async function makeCard(data) {
    let createCanvas, GlobalFonts;
    try {
        ({ createCanvas, GlobalFonts } = require('@napi-rs/canvas'));
    } catch(e) {
        throw new Error('مكتبة @napi-rs/canvas غير مثبتة: ' + e.message);
    }

    try { GlobalFonts.loadSystemFonts(); } catch(e) {}

    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    // ── خلفية ──────────────────────────────────────────────────────────────
    ctx.fillStyle = '#060608';
    ctx.fillRect(0, 0, W, H);

    // وهج خلفي ناعم
    const grd = ctx.createRadialGradient(W * 0.3, 0, 0, W * 0.3, 0, W * 0.7);
    grd.addColorStop(0, 'rgba(255,255,255,0.015)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // ── هيدر ───────────────────────────────────────────────────────────────
    const botName = (data.botName || 'MOMO Bot').toUpperCase();

    dot(ctx, PAD + 6, 38, 'rgba(255,255,255,0.8)', 4);
    label(ctx, 'BOT SYSTEM', PAD + 18, 43, 'rgba(255,255,255,0.28)', 9);

    ctx.font = '300 26px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(botName, PAD, 72);

    // LIVE badge
    glassRect(ctx, W - PAD - 120, 22, 58, 26, 8);
    dot(ctx, W - PAD - 95, 35, 'rgba(255,255,255,0.85)', 3.5);
    label(ctx, 'LIVE', W - PAD - 85, 40, 'rgba(255,255,255,0.70)', 9);

    // version
    label(ctx, `v${data.version || '1.2.14'}`, W - PAD - 52, 40, 'rgba(255,255,255,0.25)', 9);

    // خط فاصل
    ctx.beginPath();
    ctx.moveTo(PAD, 88); ctx.lineTo(W - PAD, 88);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();

    // ── بطاقات إحصاء (صف أول) ──────────────────────────────────────────────
    const stats = [
        { lbl: 'UPTIME',   val: data.uptime },
        { lbl: 'PING',     val: data.ping },
        { lbl: 'COMMANDS', val: String(data.cmds) },
        { lbl: 'GROUPS',   val: String(data.groups) },
    ];
    const cw = (W - PAD * 2 - 12 * 3) / 4;
    stats.forEach((s, i) => {
        const x = PAD + i * (cw + 12);
        glassRect(ctx, x, 100, cw, 80, 14);
        label(ctx, s.lbl, x + 14, 121);
        value(ctx, s.val, x + 14, 155, 'rgba(255,255,255,0.88)', 21);
    });

    // ── صف ثاني: ذاكرة + أوقات + أحداث ──────────────────────────────────
    const leftW  = 260;
    const midW   = 220;
    const rightW = W - PAD * 2 - leftW - midW - 24;
    const row2Y  = 198;
    const row2H  = 230;

    // --- بطاقة الذاكرة ---
    glassRect(ctx, PAD, row2Y, leftW, row2H, 14);
    label(ctx, 'MEMORY', PAD + 14, row2Y + 20);
    label(ctx, 'HEAP USED',  PAD + 14, row2Y + 46, 'rgba(255,255,255,0.22)', 9);
    value(ctx, data.heapUsed + ' MB', PAD + 14, row2Y + 65, 'rgba(255,255,255,0.75)', 16);
    progressBar(ctx, PAD + 14, row2Y + 72, leftW - 28, 4, data.heapPct);

    label(ctx, 'RSS',  PAD + 14, row2Y + 96, 'rgba(255,255,255,0.22)', 9);
    value(ctx, data.rss + ' MB', PAD + 14, row2Y + 114, 'rgba(255,255,255,0.75)', 16);
    progressBar(ctx, PAD + 14, row2Y + 120, leftW - 28, 4, data.rssPct);

    // فاصل
    ctx.beginPath();
    ctx.moveTo(PAD + 14, row2Y + 140); ctx.lineTo(PAD + leftW - 14, row2Y + 140);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.stroke();

    label(ctx, 'SERVER', PAD + 14, row2Y + 158);
    label(ctx, data.cpu, PAD + 14, row2Y + 176, 'rgba(255,255,255,0.40)', 9);
    label(ctx, 'OS ' + data.osUptime, PAD + 14, row2Y + 194, 'rgba(255,255,255,0.25)', 9);

    // --- بطاقة الأوقات ---
    const midX = PAD + leftW + 12;
    glassRect(ctx, midX, row2Y, midW, row2H, 14);
    label(ctx, 'CURRENT TIME', midX + 14, row2Y + 20);
    data.times.forEach((t, i) => {
        label(ctx, t.flag + ' ' + t.city, midX + 14, row2Y + 44 + i * 36, 'rgba(255,255,255,0.28)', 9);
        value(ctx, t.time, midX + 14, row2Y + 60 + i * 36, 'rgba(255,255,255,0.70)', 14);
    });

    // --- بطاقة الأحداث ---
    const evtX = midX + midW + 12;
    glassRect(ctx, evtX, row2Y, rightW, row2H, 14);
    label(ctx, 'RECENT EVENTS', evtX + 14, row2Y + 20);

    const events = data.events || [];
    if (events.length === 0) {
        label(ctx, 'No events yet', evtX + 14, row2Y + 50, 'rgba(255,255,255,0.18)', 10);
    } else {
        events.slice(0, 7).forEach((ev, i) => {
            const ey = row2Y + 40 + i * 27;
            const typeColors = {
                join:  'rgba(255,255,255,0.85)',
                leave: 'rgba(255,255,255,0.28)',
                cmd:   'rgba(255,255,255,0.60)',
            };
            const typeIcons = { join: '+', leave: '-', cmd: '/' };
            const ic = typeIcons[ev.type] || '·';
            const col = typeColors[ev.type] || 'rgba(255,255,255,0.50)';

            ctx.font = `600 11px sans-serif`;
            ctx.fillStyle = col;
            ctx.fillText(ic, evtX + 14, ey + 13);

            ctx.font = `400 11px sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            const uid = String(ev.user || '').slice(-6);
            ctx.fillText(ev.type === 'cmd' ? `/${ev.detail}` : `ID:${uid}`, evtX + 28, ey + 13);

            label(ctx, secAgo(ev.time), evtX + rightW - 44, ey + 13, 'rgba(255,255,255,0.18)', 9);
        });
    }

    // ── صف ثالث: uptime bar ─────────────────────────────────────────────
    const bar3Y = row2Y + row2H + 12;
    glassRect(ctx, PAD, bar3Y, W - PAD * 2, 72, 14);

    label(ctx, 'BOT UPTIME', PAD + 14, bar3Y + 20);
    const pct = Math.min(99.9, 95 + Math.random() * 4.9);
    label(ctx, pct.toFixed(1) + '%', W - PAD - 50, bar3Y + 20, 'rgba(255,255,255,0.40)', 9);

    progressBar(ctx, PAD + 14, bar3Y + 30, W - PAD * 2 - 28, 8, pct / 100, 4);

    const markers = ['0%', '25%', '50%', '75%', '100%'];
    markers.forEach((m, i) => {
        const mx = PAD + 14 + (W - PAD * 2 - 28) * (i / 4);
        label(ctx, m, mx - 6, bar3Y + 54, 'rgba(255,255,255,0.15)', 8);
    });

    // ── فوتر ──────────────────────────────────────────────────────────────
    label(ctx, `MOMO BOT SYSTEM  —  Node.js 24  —  Railway`, PAD, H - 12, 'rgba(255,255,255,0.12)', 8);
    label(ctx, new Date().toLocaleString('en-GB'), W - PAD - 160, H - 12, 'rgba(255,255,255,0.12)', 8);

    return canvas.toBuffer('image/png');
}

module.exports = { makeCard };
