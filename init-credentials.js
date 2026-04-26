const fs = require('fs-extra');
const path = require('path');

const email = process.env.FB_EMAIL;
const password = process.env.FB_PASSWORD;

if (!email || !password) {
  console.log('[init-credentials] FB_EMAIL/FB_PASSWORD not set, skipping AutoLogin setup.');
  process.exit(0);
}

const dbDir = path.join(process.cwd(), 'Horizon_Database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

let BetterDB;
try {
  BetterDB = require('better-sqlite3');
} catch (e) {
  try {
    BetterDB = require(path.join(process.cwd(), 'lib/Fca-Horizon-Remastered/node_modules/better-sqlite3'));
  } catch (e2) {
    console.error('[init-credentials] better-sqlite3 not available:', e2.message);
    process.exit(0);
  }
}

const dbPath = path.join(dbDir, 'SyntheticDatabase.sqlite');
const db = new BetterDB(dbPath);
db.prepare('CREATE TABLE IF NOT EXISTS json (ID TEXT, json TEXT)').run();

function upsert(id, value) {
  const existing = db.prepare('SELECT * FROM json WHERE ID = (?)').get(id);
  const jsonValue = JSON.stringify(value);
  if (existing) {
    db.prepare('UPDATE json SET json = (?) WHERE ID = (?)').run(jsonValue, id);
  } else {
    db.prepare('INSERT INTO json (ID, json) VALUES (?, ?)').run(id, jsonValue);
  }
}

upsert('Account', email);
upsert('Password', password);

console.log('[init-credentials] AutoLogin credentials written to Horizon_Database/SyntheticDatabase.sqlite');
db.close();
