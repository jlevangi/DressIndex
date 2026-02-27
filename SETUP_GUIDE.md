# DressIndex Setup Guide

## Table of Contents

- [Firebase Console Setup](#firebase-console-setup)
- [Firebase Spark Tier Limits](#firebase-spark-tier-limits)
- [Environment Variables](#environment-variables)
- [Capacitor Mobile Setup](#capacitor-mobile-setup)
- [Cost Checklist](#cost-checklist)
- [Notifications](#notifications)

---

## Firebase Console Setup

The app uses Firebase Anonymous Auth and Firestore for survey/analytics data. All setup is done through the [Firebase Console](https://console.firebase.google.com/) — no Firebase CLI is required.

### 1. Create a Firebase Project

1. Go to the Firebase Console and click **Add project**
2. Name it (e.g., `dressindex`)
3. Disable Google Analytics (not needed) or enable if desired
4. Click **Create project**

### 2. Register a Web App

1. In Project Settings > General, click the web icon (`</>`)
2. Register the app with a nickname (e.g., `dressindex-web`)
3. Copy the `firebaseConfig` values — you'll need them for `.env`

### 3. Enable Anonymous Authentication

1. Go to **Authentication** > **Sign-in method**
2. Enable **Anonymous** sign-in
3. Click **Save**

### 4. Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Select **Start in production mode**
3. Choose a location (e.g., `us-east1` for Florida users)
4. Click **Enable**

### 5. Set Firestore Security Rules

Go to **Firestore Database** > **Rules** and replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures each anonymous user can only read/write their own data.

### 6. (Optional) Firebase Hosting

If you want to deploy via Firebase Hosting:

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Run `firebase login`
3. Run `firebase init hosting` in the project root
   - Select your Firebase project
   - Set public directory to `dist`
   - Configure as single-page app: **Yes**
   - Don't overwrite `dist/index.html`
4. Deploy with `npm run build && firebase deploy --only hosting`

---

## Firebase Spark Tier Limits

The app runs on Firebase's free Spark plan. Key limits:

| Resource | Spark Limit |
|----------|-------------|
| Firestore reads | 50,000/day |
| Firestore writes | 20,000/day |
| Firestore deletes | 20,000/day |
| Firestore storage | 1 GiB |
| Authentication | Unlimited anonymous sign-ins |
| Hosting storage | 10 GB |
| Hosting transfer | 360 MB/day |
| Cloud Functions | Not available on Spark |

With anonymous auth and per-user survey data, the app should stay well within these limits for typical usage.

---

## Environment Variables

Create a `.env` file in the project root:

```
VITE_PIRATE_WEATHER_API_KEY=your_pirateweather_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

The PirateWeather API key can be obtained from [pirateweather.net](https://pirateweather.net). Firebase values come from your Firebase Console project settings.

If `VITE_PIRATE_WEATHER_API_KEY` is not set, the app falls back to a manual API key entry in the UI. If `VITE_FIREBASE_API_KEY` is not set, Firebase features (survey logging) are silently disabled.

---

## Capacitor Mobile Setup

Capacitor wraps the web app in a native WebView for iOS and Android. The project is already configured with `capacitor.config.ts`.

### Requirements

| Platform | Requirements |
|----------|-------------|
| iOS | macOS with Xcode 15+, CocoaPods |
| Android | Android Studio, JDK 17+ |

### Adding Platforms

```bash
# Build the web app first
npm run build

# Add iOS (macOS only)
npx cap add ios

# Add Android
npx cap add android

# Sync web assets to native projects
npx cap sync
```

### Running on Devices

```bash
# Open in Xcode
npx cap open ios

# Open in Android Studio
npx cap open android
```

### Live Reload (Development)

For development with live reload, find your local IP and run:

```bash
# Start Vite dev server
npm run dev

# Then update capacitor.config.ts temporarily:
# server: { url: 'http://YOUR_LOCAL_IP:5173', cleartext: true }

npx cap sync
npx cap open ios   # or android
```

Remove the `server` block from `capacitor.config.ts` before building for production.

### Platform-Specific Permissions

#### iOS (Info.plist)

After running `npx cap add ios`, the following keys should be added to `ios/App/App/Info.plist` for location access:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>DressIndex uses your location to provide weather-based clothing recommendations.</string>
```

#### Android (AndroidManifest.xml)

After running `npx cap add android`, verify these permissions in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
```

---

## Cost Checklist

| Item | Cost |
|------|------|
| Firebase Spark plan | Free |
| PirateWeather API | Free tier |
| Apple Developer Program | $99/year (required for App Store) |
| Google Play Developer | $25 one-time (required for Play Store) |
| Mac hardware | Required for iOS builds (Xcode is macOS-only) |

**Minimum to ship both platforms:** $124 + Mac access.

---

## Notifications

### Current Implementation (Web)

The app uses the Web Notifications API with a three-layer system:

1. **Periodic Background Sync** — Service worker registers `daily-clothing-check`, wakes approximately hourly, checks IndexedDB config for notification time
2. **setTimeout fallback** — In-app timer when the PWA is open (works on non-Chromium browsers)
3. **Missed notification check** — On app mount, the service worker checks if today's notification was missed and fires it immediately

### Mobile Considerations

- **Android:** Web Notifications API works inside Capacitor's WebView. The existing implementation should work without changes.
- **iOS:** Web push notifications are not supported in iOS WebViews. To support notifications on iOS, a future enhancement would add `@capacitor/local-notifications` to schedule native local notifications. This requires:
  1. `npm install @capacitor/local-notifications`
  2. A platform check to use the native plugin on iOS and the web API elsewhere
  3. Adding notification permission descriptions to `Info.plist`
