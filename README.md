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

Sign in once on each device with the same Charge Log account, and the phone and PC share one charge list. Charges sync through Firebase (project `charge-log-5a6c4`, Firestore in eur3). An account can only read and write its own charges, or a list it has been given access to (see below), and new accounts can only be added in the Firebase console.

Charges logged without signal are saved on the device and upload when it's back online. **Settings → Save backup file** still exports everything as a JSON file.

To run without sync, set `window.CHARGE_LOG_FIREBASE = null` in `docs/config.js`. Charges then stay on each device.

### Sharing one charge list between several logins

Each login normally has its own list at `users/{uid}/charges`. To let another login use the same list:

1. Add the person in Firebase → Authentication → Users and note their **User UID**.
2. In Firestore, on the owner's side add `users/{ownerUid}/meta/sharing` with field `members` (array) containing the new UID.
3. On the new person's side add `users/{newUid}/meta/link` with field `owner` (string) = the owner's UID.

Both entries can only be changed in the Firebase console, never from the app.

Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function canUse(uid) {
      return request.auth != null && (request.auth.uid == uid ||
        (exists(/databases/$(database)/documents/users/$(uid)/meta/sharing) &&
         request.auth.uid in get(/databases/$(database)/documents/users/$(uid)/meta/sharing).data.members));
    }
    match /users/{uid}/charges/{id}    { allow read, write: if canUse(uid); }
    match /users/{uid}/meta/settings   { allow read, write: if canUse(uid); }
    match /users/{uid}/meta/sharing    { allow read: if canUse(uid); }
    match /users/{uid}/meta/link       { allow read: if request.auth != null && request.auth.uid == uid; }
  }
}
```
