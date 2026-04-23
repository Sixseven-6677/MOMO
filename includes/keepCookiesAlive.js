const fs = require('fs');
const path = require('path');

const REFRESH_INTERVAL_MINUTES = 15;
const RAILWAY_API = 'https://backboard.railway.com/graphql/v2';

async function updateRailwayAppState(appstateStr) {
  const token = process.env.RAILWAY_TOKEN;
  const projectId = process.env.RAILWAY_PROJECT_ID;
  const serviceId = process.env.RAILWAY_SERVICE_ID;
  const envId = process.env.RAILWAY_ENVIRONMENT_ID;

  if (!token || !projectId || !serviceId || !envId) return false;

  try {
    const res = await fetch(RAILWAY_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `mutation {
          variableUpsert(input: {
            projectId: "${projectId}"
            serviceId: "${serviceId}"
            environmentId: "${envId}"
            name: "APPSTATE"
            value: ${JSON.stringify(appstateStr)}
          })
        }`
      })
    });
    const data = await res.json();
    return !!data.data?.variableUpsert;
  } catch (e) {
    return false;
  }
}

function startCookieRefresh(api) {
  if (!api || typeof api.getAppState !== 'function') {
    console.log('[ COOKIE-KEEPER ] api.getAppState غير متاح، تم الإلغاء');
    return;
  }

  const intervalMs = REFRESH_INTERVAL_MINUTES * 60 * 1000;
  console.log(`[ COOKIE-KEEPER ] ✅ نظام تجديد الكوكيز نشط (كل ${REFRESH_INTERVAL_MINUTES} دقيقة)`);

  setInterval(async () => {
    try {
      const fresh = api.getAppState();
      if (!fresh || !Array.isArray(fresh) || fresh.length === 0) {
        console.log('[ COOKIE-KEEPER ] ⚠️ AppState فارغ، تخطي');
        return;
      }

      const appstateStr = JSON.stringify(fresh);
      const localPath = path.join(process.cwd(), 'appstate.json');
      fs.writeFileSync(localPath, appstateStr, 'utf8');

      const railwayUpdated = await updateRailwayAppState(appstateStr);
      const userId = (fresh.find(c => c.key === 'c_user') || {}).value || 'unknown';
      console.log(`[ COOKIE-KEEPER ] 🔄 تم تجديد الكوكيز | حساب: ${userId} | Railway: ${railwayUpdated ? '✅' : '⏭️ محلي فقط'}`);
    } catch (e) {
      console.log(`[ COOKIE-KEEPER ] ❌ خطأ: ${e.message}`);
    }
  }, intervalMs);
}

module.exports = { startCookieRefresh };
