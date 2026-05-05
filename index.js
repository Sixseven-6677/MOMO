const { spawn } = require('child_process');
const { readFileSync, writeFileSync } = require('fs-extra');
const http = require('http');
const axios = require('axios');
const semver = require('semver');
const logger = require('./utils/log');
const express = require('express');
const path = require('path');
const chalk = require('chalkercli');
const chalk1 = require('chalk');
const CFonts = require('cfonts');
const { rawCookiesToAppstate } = require('./utils/cookieConverter');
const app = express();
const port = process.env.PORT || 2006;
const moment = require('moment-timezone');
var gio = moment.tz('Asia/Ho_Chi_Minh').format('HH:mm:ss || D/MM/YYYY');

app.use(express.json());

// ===== APPSTATE / COOKIES INJECTION at startup =====
(function () {
  try {
    if (process.env.FB_COOKIES) {
      const appstate = rawCookiesToAppstate(process.env.FB_COOKIES);
      writeFileSync(__dirname + '/appstate.json', JSON.stringify(appstate, null, 2), 'utf8');
      console.log('[BOT] appstate.json generated from FB_COOKIES environment variable');
    } else if (process.env.APPSTATE_JSON) {
      writeFileSync(__dirname + '/appstate.json', process.env.APPSTATE_JSON, 'utf8');
      console.log('[BOT] appstate.json loaded from APPSTATE_JSON environment variable');
    }
  } catch (e) {
    console.error('[BOT] Failed to write appstate.json:', e.message);
  }
})();
// ====================================================

var thu = moment.tz('Asia/Ho_Chi_Minh').format('dddd');
if (thu == 'Sunday') thu = 'Sunday';
if (thu == 'Monday') thu = 'Monday';
if (thu == 'Tuesday') thu = 'Tuesday';
if (thu == 'Wednesday') thu = 'Wednesday';
if (thu == 'Thursday') thu = 'Thursday';
if (thu == 'Friday') thu = 'Friday';
if (thu == 'Saturday') thu = 'Saturday';

console.log('                 Today: ' + thu);

var currentChild = null;

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/cookies', function (req, res) {
  res.sendFile(path.join(__dirname, '/cookies.html'));
});

app.post('/update-cookies', function (req, res) {
  try {
    const { cookies } = req.body;
    if (!cookies || typeof cookies !== 'string' || !cookies.trim()) {
      return res.status(400).json({ success: false, error: 'No cookies provided' });
    }
    const appstate = rawCookiesToAppstate(cookies.trim());
    writeFileSync(__dirname + '/appstate.json', JSON.stringify(appstate, null, 2), 'utf8');
    console.log('[BOT] appstate.json updated via /update-cookies \u2014 restarting bot...');
    if (currentChild) {
      try { currentChild.kill('SIGTERM'); } catch (e) {}
    }
    res.json({
      success: true,
      message: '\تم حفظ الكوكيز بنجا٭ (' + appstate.length + ' كوكي). البوت يعيٯ التثX�؊يل الان...'
    });
  } catch (e) {
    console.error('[BOT] update-cookies error:', e.message);
    res.status(400).json({ success: false, error: e.message });
  }
});

app.listen(port);
console.log('Server started at port ' + port);
logger('Facebook: https://www.facebook.com/TatsuYTB', 'Facebook');

const rainbow = chalk.rainbow('\n                 [=== TatsuYTB ===]\n\n').stop();
rainbow.render();
const frame = rainbow.frame();
console.log(frame);
logger('Your version is the latest!', 'UPDATE');

function startBot(message) {
  if (message) logger(message, 'BOT RESTARTING');
  const child = spawn('node', ['--trace-warnings', '--async-stack-traces', 'main.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });
  currentChild = child;

  child.on('close', async (codeExit) => {
    currentChild = null;
    var x = String(codeExit);
    if (codeExit == 1) return startBot('BOT RESTARTING!!!');
    else if (x.indexOf(2) == 0) {
      await new Promise(resolve => setTimeout(resolve, parseInt(x.replace(2, '')) * 1000));
      startBot('Bot has been activated please wait a moment!!!');
    } else return;
  });

  child.on('error', function (error) {
    logger('An error occurred: ' + JSON.stringify(error), '[ Starting ]');
  });
}

axios.get('https://raw.githubusercontent.com/tandung1/Bot12/main/package.json').then(() => {}).catch(() => {});

setTimeout(async function () {
  rainbow.render();
  const frame2 = rainbow.frame();
  console.log(frame2);
  logger('Start loading source code', 'LOAD');
  startBot();
}, 70);
