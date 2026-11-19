# Charge Log

A simple log for EV charging: record each charge (kWh, cost, odometer, battery %) and see monthly spend, price per kWh and efficiency.

**Open the app:** https://davitos223.github.io/charge-log/

## Phone

Open the link above, then:

- **iPhone (Safari):** Share → **Add to Home Screen**
- **Android (Chrome):** ⋮ menu → **Add to Home screen** / **Install app**

## Windows PC

Download `ChargeLog.exe` from the [latest release](https://github.com/davitos223/charge-log/releases/latest) and run it. It opens the same app in its own window and always shows the newest version, so you only download it once.

## Your data

Charges are saved on the device you enter them on. They are never uploaded. Use **Settings → Save backup file / Load backup file** to keep a backup or copy charges between devices.

## Updating

Everything in `docs/` is the app. Push changes to `main` and GitHub Pages publishes them within a minute or two. Phones and the PC app pick up the new version the next time they open.

`desktop/` is the Windows wrapper (C#, WebView2). Rebuild it only if the wrapper itself changes:

```
dotnet publish desktop -c Release -o desktop/publish
```
