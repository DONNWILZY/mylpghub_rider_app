# MyQuickGas Rider

The rider app shows My Rider Account, the onboarding and verification checklist, review history, and availability for trip quotes, dispatch, and payouts.

Built with React Native, Expo SDK 58, Expo Router, and TypeScript for Android and iOS. The app uses the existing MyQuickGas Laravel API and bearer sessions. Android and iOS store session tokens in Expo SecureStore.

## Run locally

Use Node.js 22.13 or newer and npm. In PowerShell:

```powershell
npm ci
Copy-Item .env.example .env
```

Set `EXPO_PUBLIC_API_URL` in `.env` to the Laravel environment URL ending in `/api/v1`. Use an HTTPS staging endpoint for physical devices and release builds. For local development, run Laravel with `php artisan serve --host=0.0.0.0 --port=8000` and use your machine’s LAN address. An Android emulator can address the host at `10.0.2.2` in a development environment that permits HTTP.

```powershell
npm start
```

Press **W** for a browser preview. Use an Expo Go version compatible with SDK 58 or a native development build. From this directory, run `npx expo run:android` with Android Studio installed, or `npx expo run:ios` on macOS with Xcode.

## Verify

```powershell
npm run typecheck
npx expo export --platform android --platform ios
```

Sign in with a rider account and verify that the checklist, review status, and trip availability match Laravel. Use staging accounts for QA. Store builds require native signing credentials and confirmed app identifiers.
