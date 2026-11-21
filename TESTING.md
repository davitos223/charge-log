# Testing Charge Log

Run the automated checks before every release, and the manual checklist after any change to saving, syncing or sharing.

## Automated checks

```
node tools/test.mjs
```

Needs Node 22 or newer and Microsoft Edge or Google Chrome (set `BROWSER` to its path if it isn't found). It builds a demo copy of the app with invented data, runs it in a headless browser and **never touches the real database**. It prints each check and exits with an error if any fail.

| Area | What is checked |
|---|---|
| Figures | Every number on the main screen (this month, all time, the year strip, work claims) against a separate calculation written independently of the app |
| Month pages | Spend, energy and number of charges for every month, January to November |
| Adding | A new charge is saved once, with the values entered, and the month's spend rises by exactly its cost |
| Editing old charges | The charge keeps its id, cost, author and creation time; year energy and efficiency follow the change |
| Deleting | Needs two taps; the charge disappears and the totals go back |
| Typo checks | A lower odometer, a jump over 2,500 km, more than 100 kWh and a future date are all stopped until "Save anyway" |
| Backups | Loading the same backup twice adds nothing; a backup with two new charges adds exactly two |
| Settings | Saving without changes changes nothing |
| Layouts | At 11 sizes from 320 px phones to 1920 px screens: nothing wider than the screen, no figures cut off, form fields don't overlap, the month page fits |
| Errors | No JavaScript errors during the whole run |

### Screenshots

```
node tools/screenshots.mjs
```

Remakes the pictures in `screenshots/` for the README from the same demo copy. Add names to remake only some, for example `node tools/screenshots.mjs phone-log`.

## Security checks

The database rules allow a login to read and write a charge list only if it owns the list or is named in the list's sharing entry. The sharing entries and each login's link to a list can't be changed from the app, only in the Firebase console. Everything else is refused.

Checked against the live database (November 2026):

| Attempt | Result |
|---|---|
| Read charges, settings, sharing or links with no login | Refused |
| List all users with no login | Refused |
| Change sharing or settings with no login | Refused |
| A member reading the shared list | Allowed |
| A member reading another login's own list | Refused |
| A member reading someone else's link entry | Refused |
| A member adding themselves to sharing, or re-pointing their own link | Refused |
| Writing anywhere outside the users' lists | Refused |
| Creating a new account from the app | Not possible (sign-up is switched off) |

The web API key is public by design and restricted to the app's own address.

## Manual checklist (real devices)

These need two real devices and a real login, so they can't run in the automated checks. Use a test charge with a note such as "TEST" and delete it at the end.

- [ ] **Log offline.** Turn on flight mode, open the app (it should open from its saved copy), log a test charge. The sync badge shows it's saved on the phone.
- [ ] **Reconnect.** Turn flight mode off. The badge turns to "Synced" and the charge appears on the second device within a few seconds.
- [ ] **Edit on one, check the other.** Change the test charge's kWh on the second device. The first device shows the new value and updated totals.
- [ ] **Delete everywhere.** Delete the test charge on one device. It disappears on the other.
- [ ] **Two people, one list.** Signed in as two different people who share the list, each logs a charge. Both appear on both devices, each marked "added by" the right person.
- [ ] **Claims from two phones.** Mark a work month as claimed on one phone while Settings is open on the other, then save Settings there. The month stays claimed.
- [ ] **Opens when GitHub is down.** With the app opened before, it still opens with no internet.
- [ ] **Windows app.** Opens, shows the same data, and the backup download works.
- [ ] **iPhone and Android.** The Log a charge form and the month page look right in Safari and Chrome.
