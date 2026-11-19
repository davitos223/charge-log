<div align="center">

<img src="docs/icons/icon-192.png" width="96" height="96" alt="">

# Charge Log

**A simple, good-looking log for electric car charging.**
Record each charge in a few taps and see what you spend, how much energy you use and how efficient your cars are.

[**Open the app**](https://davitos223.github.io/charge-log/) · [Windows app](https://github.com/davitos223/charge-log/releases/latest)

</div>

---

## Features

- **Quick logging**: car, charger type, date, odometer, kWh and cost, built for one-handed use at the charger
- **Home, Public, Fast DC and Work** charger types, each with its own colour
- **Several cars**: switch between cars or see them together
- **Year view**: pick a year and the chart, totals and charge list follow
- **Charts**: spend, energy, distance and efficiency per month as stacked bars, side by side, share of each month, horizontal bars or a running total, with the monthly average marked
- **Month details**: tap a month for its full page, with comparisons to the month before and the same month last year, the split by charger type and car, the work claim and every charge
- **Efficiency per car** (kWh/100 km) to see seasonal changes and spot missed entries
- **Work claims**: monthly totals of work charging, ticked off once paid back
- **Home electricity price history**: a new price from a chosen month onwards, with each charge priced by its own date
- **Sync between devices**, and one list can be shared by several people with their own logins
- **Works offline**: charges logged without signal upload when the connection returns
- **Light and dark themes** and a choice of colours
- **Backup** to a JSON file at any time

## Getting the app

### Phone

Open **[the app](https://davitos223.github.io/charge-log/)**, then add it to the home screen:

| iPhone (Safari) | Android (Chrome) |
|---|---|
| Share → **Add to Home Screen** | ⋮ menu → **Install app** / **Add to Home screen** |

It then opens full screen like a normal app.

### Windows

Download **`ChargeLog.exe`** from the [latest release](https://github.com/davitos223/charge-log/releases/latest) and run it. It needs nothing else installed. It opens the same app in its own window, so you only need to download it once.

## Updates

The app updates itself. Every change pushed to this repository goes live within a couple of minutes, and phones and the Windows app pick it up the next time they're opened. If a phone seems stuck on an older version, close the app fully and open it again. **Settings** shows the version at the bottom.

## Your data

Charges are stored in a private cloud database and only the logins that have access to a list can read it. Nothing is stored in this repository. **Settings → Save backup file** exports everything as a JSON file you can keep or load back in.

Without sync set up, the app still works and keeps charges on the device.

---

## For developers

<details>
<summary><b>Project layout</b></summary>

| Path | What it is |
|---|---|
| `docs/index.html` | The whole app: markup, styles and logic in one file, no build step |
| `docs/cloud.js` | Sign-in and sync (Firebase Authentication and Cloud Firestore with an offline cache) |
| `docs/config.js` | Which Firebase project to connect to; set it to `null` to run without sync |
| `docs/sw.js` | Service worker: offline support, always revalidating the app's own files |
| `docs/manifest.webmanifest`, `docs/icons/` | Installable app details and icons |
| `desktop/` | Windows wrapper (C#, WinForms and WebView2) that shows the live site in its own window |

GitHub Pages serves the `docs/` folder from `main`.

</details>

<details>
<summary><b>Running it locally</b></summary>

Serve the `docs/` folder with any static server, for example:

```
python -m http.server 5173 --directory docs
```

then open `http://localhost:5173`. With sync configured, a local copy connects to the same database as the live app, so sign in with a test account.

</details>

<details>
<summary><b>Releasing a change</b></summary>

GitHub Pages lets browsers cache each file for 10 minutes, so the page and its scripts are versioned together. On every release, change the version in all three places to the same value:

1. `APP_VERSION` in `docs/index.html`
2. the `?v=` on the `config.js` and `cloud.js` script tags in `docs/index.html`
3. `version` in `docs/cloud.js`

Then push to `main`.

</details>

<details>
<summary><b>Setting up your own sync</b></summary>

1. Create a Firebase project and add a **Web app** to it.
2. Turn on **Authentication → Email/Password**. It's best to turn off public sign-up so that only accounts you add can sign in.
3. Create a **Cloud Firestore** database in production mode.
4. Write security rules so that each signed-in user can only read and write their own data, plus any list that has been explicitly shared with them.
5. Put the web app's config in `docs/config.js`.

Each list lives under its owner's user ID. To share a list, the owner's settings name the other logins that may use it, and each of those logins points to the owner's list. Both are set in the Firebase console, never from the app.

</details>

<details>
<summary><b>Windows app</b></summary>

```
dotnet publish desktop -c Release -o desktop/publish
```

This builds a single self-contained `ChargeLog.exe` (.NET 8, WebView2). Rebuild it only when the wrapper itself changes. App changes reach it through the website.

</details>
