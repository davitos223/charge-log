# Charge Log

A simple log for EV charging: record each charge (kWh, cost, odometer, battery %) and see monthly spend, price per kWh and efficiency.

**Open the app:** https://davitos223.github.io/charge-log/

## Phone

Open the link above, then:

- **iPhone (Safari):** Share → **Add to Home Screen**
- **Android (Chrome):** ⋮ menu → **Add to Home screen** / **Install app**

## Windows PC

Download `ChargeLog.exe` from the [latest release](https://github.com/davitos223/charge-log/releases/latest) and run it. It opens the same app in its own window and always shows the newest version, so you only download it once.

## Your data and sync

Sign in once on each device with the same Charge Log account, and the phone and PC share one charge list. Charges sync through Firebase (project `charge-log-5a6c4`, Firestore in eur3). Each account can only read and write its own charges (see the rules below), and new accounts can only be added in the Firebase console.

Charges logged without signal are saved on the device and upload when it's back online. **Settings → Save backup file** still exports everything as a JSON file.

To run without sync, set `window.CHARGE_LOG_FIREBASE = null` in `docs/config.js`. Charges then stay on each device.

Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Updating

Everything in `docs/` is the app. Push changes to `main` and GitHub Pages publishes them within a minute or two. Phones and the PC app pick up the new version the next time they open.

`desktop/` is the Windows wrapper (C#, WebView2). Rebuild it only if the wrapper itself changes:

```
dotnet publish desktop -c Release -o desktop/publish
```
