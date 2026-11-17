# MyQuickGas Rider

Expo and React Native app for Android and iOS. The browser preview supports onboarding, account and trip flows, and foreground GPS with a coordinate view. Android with a configured Google Maps key and iOS display the street map inside the app.

## Run locally

Use Node.js 22.13 or newer. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the Laravel API base ending in `/api/v1`. Use an IP reachable by the phone for local development and HTTPS for native release builds.

```bash
npm ci
npm run typecheck
npm start
```

For an Android native build, set `MYQUICKGAS_ANDROID_MAPS_API_KEY` before creating the build. Restrict the key to Maps SDK for Android, the app package `site.mylpg.rider`, and your signing certificate fingerprint. The key is embedded in the Android app and must be restricted by package and certificate. iOS uses Apple Maps.

## Rider delivery

The first-run screens explain rider verification, handovers and sharing. The trip screen shows the assigned outlet and switches to the customer drop-off after the verified pickup. A stop needs coordinates before directions and straight-line distance can be shown. The map also displays the phone's GPS accuracy and total movement recorded during the current GPS session. Directions open the maps app.

The rider explicitly starts GPS and then elects to share with the customer. Sharing is limited to the assigned one-way delivery leg after pickup. The screen stays awake while sharing. Sharing ends when the rider stops it, leaves the delivery screen, backgrounds the app or verifies the drop-off code. The server also hides expired positions automatically.

For a staging integration run, use the Laravel `feature/delivery-trip-live-tracking` branch. The branch adds `MARKETPLACE_DELIVERY_TRIP_TRACKING_ENABLED`, which defaults to false and is effective only outside production, with the existing delivery trip offers and assignment gates. Enable pickup and drop-off gates to complete the verified handovers. Multi-instance staging must use a shared Laravel cache for the latest position and stopped-session records.

The rider sends one fresh position approximately every 21 seconds when GPS is available. The customer app can poll `GET /api/v1/delivery-trips/{trip}/tracking` every ten seconds for the delivery owner's position feed, straight-line remaining distance, and arrival state. A position expires after 90 seconds without a fresh update. The customer app map is a separate implementation step.
