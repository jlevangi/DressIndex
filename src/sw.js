import { precacheAndRoute } from 'workbox-precaching';
import { getConfig, setConfig, getAllConfig } from './idb-config.js';
import { computeEffective, getClothing, getDayRecommendation } from './weather-utils.js';
import { INSTALL_ICON_192 } from './pwa-icons.js';

precacheAndRoute(self.__WB_MANIFEST);

// Activate immediately and claim all clients
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notifications (existing)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'DressIndex', body: 'New notification' };
  event.waitUntil(
        self.registration.showNotification(data.title, {
          body: data.body,
          icon: INSTALL_ICON_192,
        })
  );
});

// Message handlers
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(event.data.title || 'DressIndex', {
        body: event.data.body || '',
        icon: INSTALL_ICON_192,
        tag: 'daily-clothing',
      })
    );
  }

  if (event.data?.type === 'SYNC_CONFIG') {
    event.waitUntil(syncConfig(event.data.config));
  }

  if (event.data?.type === 'CHECK_MISSED_NOTIFICATION') {
    event.waitUntil(checkAndFireNotification());
  }
});

// Notification click (existing)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/');
    })
  );
});

// Layer 1: Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-clothing-check') {
    event.waitUntil(checkAndFireNotification());
  }
});

// Write app config to IndexedDB so SW can access it
async function syncConfig(config) {
  for (const [key, value] of Object.entries(config)) {
    try {
      await setConfig(key, value);
    } catch (e) {
      console.error('[SW] syncConfig failed for key:', key, e);
    }
  }
}

// Core: fetch weather, compute full-day recommendation, fire notification
async function checkAndFireNotification() {
  try {
    const config = await getAllConfig();
    const { notifTime, notifEnabled, apiKey, lat, lng, personalAdj, lastNotifDate } = config;

    if (!notifTime || !apiKey || notifEnabled === false) return;

    // Check if we already fired today
    const todayStr = new Date().toISOString().slice(0, 10);
    if (lastNotifDate === todayStr) return;

    // Check if it's time (within the notification hour)
    const [targetH, targetM] = notifTime.split(':').map(Number);
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = targetH * 60 + targetM;

    // Only fire if we're at or past the target time today
    // (but not more than 4 hours past, to avoid stale late-night fires)
    const diff = nowMinutes - targetMinutes;
    if (diff < 0 || diff > 240) return;

    // Fetch weather
    const res = await fetch(
      `https://api.pirateweather.net/forecast/${apiKey}/${lat},${lng}?units=us`
    );
    if (!res.ok) return;
    const data = await res.json();

    const hourlyData = data?.hourly?.data || [];
    const adj = personalAdj || 0;

    const rec = getDayRecommendation(hourlyData, adj, targetH);

    let body;
    if (rec) {
      body = `${Math.round(rec.coldestEffective)}°F coldest effective today — wear a ${rec.clothing.top} + ${rec.clothing.bottom}`;
      if (rec.tags && rec.tags.length > 0) {
        body += ` | ${rec.tags.map((t) => t.label).join(', ')}`;
      }
    } else {
      body = 'Open DressIndex to see today\'s recommendation';
    }

    await self.registration.showNotification('DressIndex', {
      body,
      icon: INSTALL_ICON_192,
      tag: 'daily-clothing',
    });

    // Mark as fired today
    await setConfig('lastNotifDate', todayStr);
  } catch (e) {
    console.error('[SW] checkAndFireNotification failed:', e);
  }
}
