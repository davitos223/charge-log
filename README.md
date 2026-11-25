<div align="center">

<img src="docs/icons/icon-192.png" width="96" height="96" alt="">

# Charge Log

**A simple, good-looking log for electric car charging.**
Record each charge in a few taps and see what you spend, how much energy you use and how efficient your cars are.

[**Open the app**](https://davitos223.github.io/charge-log/) · [Windows app](https://github.com/davitos223/charge-log/releases/latest)

<br>

<img src="screenshots/desktop-dark.png" alt="Charge Log on a computer: Overview with sidebar navigation, lifetime totals and the monthly charging chart" width="100%">

<br><br>

<img src="screenshots/phone-home.png" width="23%" alt="Phone: summary cards">&nbsp;
<img src="screenshots/phone-chart.png" width="23%" alt="Phone: monthly chart">&nbsp;
<img src="screenshots/phone-log.png" width="23%" alt="Phone: logging a charge">&nbsp;
<img src="screenshots/phone-month.png" width="23%" alt="Phone: month details">

<sub>Screenshots use made-up demo data.</sub>

</div>

---

## Contents

- [Features](#features)
- [A tour of the app](#a-tour-of-the-app)
- [Getting the app](#getting-the-app)
- [Updates](#updates)
- [Your data](#your-data)
- [How it works](#how-it-works)
- [For developers](#for-developers)

## Features

- **Quick logging**: car, charger type, date, odometer, kWh and cost, built for one-handed use at the charger, with a live summary of the cost, price per kWh and distance since the last charge
- **Typo checks**: a future date, an odometer that goes backwards or jumps, or more than a full battery gets a second look before saving
- **Home, Public, Fast DC and Work** charger types, each with its own colour
- **Several cars**: switch between cars or see them together
- **Year view**: pick a year and the chart, totals and charge list follow
- **Charts**: spend, energy, distance and efficiency per month as stacked bars, side by side, share of each month, horizontal bars or a running total, with the monthly average marked
- **Month details**: tap a month for its full page, with comparisons to the month before and the same month last year, the split by charger type and car, the work claim and every charge
- **Efficiency per car** (kWh/100 km) to see seasonal changes and spot missed entries
- **Work claims**: monthly totals of work charging, ticked off once paid back, with the year's claimed and outstanding amounts
- **Home electricity price history**: a new price from a chosen month onwards, with each charge priced by its own date
- **Sync between devices**, and one list can be shared by several people with their own logins
- **Works offline**: charges logged without signal upload when the connection returns, and the app opens even when GitHub is down
- **Phone, tablet and desktop layouts**, light and dark themes, and a choice of colours
- **Backup** to a JSON file at any time

## A tour of the app

### At a glance

Open **Dashboard** for the Overview. Choose one car or all cars to see this month’s spend and energy, average price and efficiency. The chart below follows the selected year. Lifetime totals sit in the sidebar on wide screens and beneath the dashboard on smaller screens.

Use the sidebar to open **Work claims** or **Charge history**. On smaller screens, these links sit across the top. **Log a charge** is in the header.

Select **+ Add widget** to show any of six optional cards for the selected car and year. Choose from Energy per charge, Busiest month, Average charge cost, Home charging share, Largest charge and Free charges. Home charging share measures energy in kWh. Free charges counts sessions with a recorded cost of zero. Widget choices are saved on this device.

<p align="center">
<img src="screenshots/phone-home.png" width="30%" alt="Phone: car switch and four summary cards">&nbsp;&nbsp;
<img src="screenshots/phone-light.png" width="30%" alt="Phone: the same screen in the light theme">
</p>

### Charts that explain the month

Each bar is split by where the charging happened. Hover over a month on a computer for a quick breakdown, or switch between spend, energy, distance and efficiency. Months with no charges show a small dash, so a quiet month never looks like missing data.

<p align="center">
<img src="screenshots/desktop-hover.png" width="100%" alt="Hovering over July shows a card with the spend split by Home, Public, Fast DC and Work">
</p>

<table>
<tr>
<td width="50%"><img src="screenshots/desktop-share.png" alt="Share style: each month's energy as 100%, split by charger type"><br><sub><b>Share</b> shows each month as 100%, here for energy</sub></td>
<td width="50%"><img src="screenshots/desktop-efficiency.png" alt="Efficiency per car per month"><br><sub><b>Efficiency</b> per car, month by month</sub></td>
</tr>
</table>

Other styles in Settings: side by side, horizontal bars and a running total that builds up over the year.

### Month details

Tap or click any month for its own page: what it cost and how that compares with the month before and the same month last year, the split by charger type and by car, the work claim, and every charge. The arrows step through the months.

<table>
<tr>
<td width="68%"><img src="screenshots/desktop-month.png" alt="Month details on a computer"></td>
<td width="32%"><img src="screenshots/phone-month.png" alt="Month details on a phone"></td>
</tr>
</table>

### Logging a charge and browsing history

One sheet, built to be filled in at the charger. The last odometer reading and the usual charger type are filled in for you, home charges are priced from the home electricity rate for that date, and a summary shows the cost, price per kWh and the distance since the last charge before you save. Open **Charge history** to browse by year, car or charger type. Expand a month to find an older entry, then select it to edit. If a Home entry’s total differs from the rate for its date, **Use home rate** previews the recalculated total. Select **Save changes** to apply it. Likely typos, such as an odometer lower than last time, get a second look.

<p align="center">
<img src="screenshots/phone-log.png" width="32%" alt="The Log a charge sheet with a live summary card">&nbsp;&nbsp;
<img src="screenshots/phone-list.png" width="32%" alt="The charge list grouped by month">
</p>

### Work claims

Charging paid for privately and claimed back from work is kept separately. Each month shows what is owed, a tap marks it as claimed, and if a charge is added to a month after claiming, the app points out the difference.

<p align="center">
<img src="screenshots/phone-claims.png" width="32%" alt="Work claims with claimed, to-claim and months totals and a progress bar">
</p>

### Settings and themes

In **Settings → Interface palette**, preview Twilight (the default), Ink, Cocoa, Burgundy, Limestone, Graphite, Dusty rose, Pearl, Atlantic, Midnight, Terracotta, Cranberry, Denim, Porcelain. Save to remember the choice in this browser. Each parent can choose their own palette on their device. For the plum dashboard shown above, choose **Dark** and **Twilight**.

The app also offers Light and Automatic themes. All 14 palettes keep the charging key consistent: Home is teal, Public lilac, Fast DC amber and Work green. Settings also contains currency, distance unit, home electricity rates, chart style and car names.

<table>
<tr>
<td width="50%"><img src="screenshots/desktop-settings.png" alt="Settings with home electricity prices, theme, colour and chart style"></td>
<td width="50%"><img src="screenshots/desktop-light.png" alt="The dashboard in the light theme"></td>
</tr>
</table>

## Getting the app

### Phone

Open **[the app](https://davitos223.github.io/charge-log/)**, then add it to the home screen:

| iPhone (Safari) | Android (Chrome) |
|---|---|
| Share → **Add to Home Screen** | ⋮ menu → **Install app** / **Add to Home screen** |

It then opens full screen like a normal app.

### Windows

Download **`ChargeLog.exe`** from the [latest release](https://github.com/davitos223/charge-log/releases/latest) and run it. It uses the Microsoft Edge WebView2 Runtime. It opens the same app in its own window, so you only need to download it once.

## Updates

The app updates itself. Every change pushed to this repository goes live within a couple of minutes, and phones and the Windows app pick it up the next time they're opened. If a phone seems stuck on an older version, close the app fully and open it again. **Settings** shows the version at the bottom.

## Your data

Charges are stored in a private cloud database and only the logins that have access to a list can read it. Nothing is stored in this repository. **Settings → Save backup file** exports charges and list settings as a JSON file you can keep or load back in.

Without sync set up, the app still works and keeps charges on the device.

## How it works

```mermaid
flowchart LR
    subgraph Devices
        P["Phone<br/>(installed web app)"]
        W["Windows app<br/>(WebView2 window)"]
        B["Any browser"]
    end
    subgraph GitHub
        GP["GitHub Pages<br/>serves docs/"]
    end
    subgraph Firebase
        AU["Authentication<br/>email + password"]
        FS["Cloud Firestore<br/>charges + settings"]
    end
    GP -- "app files<br/>(cached for offline)" --> P & W & B
    P & W & B -- "sign in" --> AU
    P & W & B <-- "live sync<br/>(offline cache, queued writes)" --> FS
```

- **One app, everywhere.** The interface and charge calculations live in a single HTML file with no build step. Separate scripts handle Firebase configuration and sync. GitHub Pages serves it, phones install it as a web app, and the Windows app is a small window around the same page, so one push updates every device.
- **Offline first.** A service worker keeps a copy of the app, so it opens with no signal or when GitHub is down. Firestore keeps a local copy of the data, so charges can be logged anywhere and upload when the connection returns.
- **Shared lists.** Each list belongs to one login. Other logins can be given access to it, and the database rules only let a login read and write lists it owns or has been given.

---

## For developers

<details>
<summary><b>Project layout</b></summary>

| Path | What it is |
|---|---|
| `docs/index.html` | The whole app: markup, styles and logic in one file, no build step |
| `docs/beta/index.html` | Standalone preview with invented charges and browser-local storage |
| `docs/cloud.js` | Sign-in and sync (Firebase Authentication and Cloud Firestore with an offline cache) |
| `docs/config.js` | Which Firebase project to connect to; set it to `null` to run without sync |
| `docs/sw.js` | Service worker: offline support; opens the saved copy if GitHub is down, slow or showing an error |
| `docs/manifest.webmanifest`, `docs/icons/` | Installable app details and icons |
| `desktop/` | Windows wrapper (C#, WinForms and WebView2) that shows the live site in its own window |
| `screenshots/` | Images for this README, taken from a demo copy with made-up data |
| `tools/` | Automated tests and the screenshot script (Node, headless Edge or Chrome) |
| `TESTING.md` | What the tests cover, security checks and the manual checklist |

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
<summary><b>Testing</b></summary>

```
node tools/test.mjs
```

Runs 49 automated checks (including figures, editing, backups, navigation, palette previews and persistence, and layouts from 320 px phones to large screens) against a demo copy with made-up data, so it never touches real data. `node tools/screenshots.mjs` remakes the README pictures. See **[TESTING.md](TESTING.md)** for what's covered, the security checks and the manual checklist for real devices.

</details>

<details>
<summary><b>Releasing a change</b></summary>

GitHub Pages lets browsers cache each file for 10 minutes, so the page and its scripts are versioned together. On every release, change the version in all three places to the same value:

1. `APP_VERSION` in `docs/index.html`
2. the `?v=` on the `config.js` and `cloud.js` script tags in `docs/index.html`
3. `version` in `docs/cloud.js`

Run `node tools/test.mjs` first, then push to `main`.

</details>

<details>
<summary><b>Setting up your own sync</b></summary>

1. Create a Firebase project and add a **Web app** to it.
2. Turn on **Authentication → Email/Password**. It's best to turn off public sign-up so that only accounts you add can sign in.
3. Create a **Cloud Firestore** database in production mode.
4. Write security rules so that each signed-in user can only read and write their own data, plus any list that has been explicitly shared with them.
5. Put the web app's config in `docs/config.js`, and restrict its API key to your site's address in the Google Cloud console.

Each list lives under its owner's user ID. To share a list, the owner's settings name the other logins that may use it, and each of those logins points to the owner's list. Both are set in the Firebase console, never from the app.

</details>

<details>
<summary><b>Windows app</b></summary>

```
dotnet publish desktop -c Release -o desktop/publish
```

This builds a single self-contained `ChargeLog.exe` (.NET 8, WebView2). Rebuild it only when the wrapper itself changes. App changes reach it through the website.

</details>
