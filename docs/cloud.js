// Cloud sync through Firebase (Auth email/password + Firestore with offline cache).
// Each charge list lives at users/{owner}/charges/{id}, with settings at users/{owner}/meta/settings.
// A login normally owns its own list. A login can instead be linked to someone else's list
// (users/{uid}/meta/link = { owner: "<their uid>" }); the owner's users/{owner}/meta/sharing
// doc lists who may open it, and the Firestore rules enforce that.
const V = "10.12.2";
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
const cfg = window.CHARGE_LOG_FIREBASE;
const wait = ms => new Promise(r => setTimeout(r, ms));

if (cfg) {
  try {
    const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
    const A = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
    const F = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
    const app = initializeApp(cfg);
    const auth = A.getAuth(app);
    let fs;
    try { fs = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) }); }
    catch { fs = F.getFirestore(app); }
    let owner = null;   // whose charge list this login works on
    const chargesCol = () => F.collection(fs, "users", owner, "charges");
    const chargeDoc = id => F.doc(fs, "users", owner, "charges", id);
    const settingsDoc = () => F.doc(fs, "users", owner, "meta", "settings");

    window.Cloud = {
      version: "20261120a",   // must match APP_VERSION in index.html
      signIn: (email, pw) => A.signInWithEmailAndPassword(auth, email, pw),
      signOut: () => A.signOut(auth),
      resetPassword: email => A.sendPasswordResetEmail(auth, email),
      collection: () => ({
        add: d => { const r = F.doc(chargesCol()); return F.setDoc(r, d).then(() => ({ id: r.id })); },
        doc: id => ({ set: d => F.setDoc(chargeDoc(id), d), delete: () => F.deleteDoc(chargeDoc(id)) }),
      }),
      doc: () => ({ set: d => F.setDoc(settingsDoc(), d), merge: d => F.setDoc(settingsDoc(), d, { merge: true }) }),
      subscribe(onCharges, onSettings, onError) {
        const a = F.onSnapshot(chargesCol(), { includeMetadataChanges: true },
          s => onCharges(s.docs.map(d => ({ ...d.data(), id: d.id })), s.metadata), onError);
        const b = F.onSnapshot(settingsDoc(), s => onSettings(s.exists() ? s.data() : {}), onError);
        return () => { a(); b(); };
      },
      // Copy charges (keeping their ids) and, if the account has none yet, settings.
      async merge(charges, settings) {
        const list = charges.filter(c => c && c.id && c.date);
        for (let i = 0; i < list.length; i += 400) {
          const batch = F.writeBatch(fs);
          for (const c of list.slice(i, i + 400)) { const { id, ...rest } = c; batch.set(chargeDoc(String(id)), rest); }
          await batch.commit();
        }
        if (settings && Object.keys(settings).length) {
          const s = await F.getDoc(settingsDoc()).catch(() => null);
          if (!s || !s.exists()) await F.setDoc(settingsDoc(), settings);
        }
        return list.length;
      },
    };

    // Which list does this login open? Read users/{uid}/meta/link; keep retrying while offline,
    // so a linked login never starts writing into an empty list of its own by mistake.
    const cacheKey = uid => "chargelog.owner." + uid;
    async function resolveOwner(uid) {
      for (let attempt = 0; ; attempt++) {
        try {
          const s = await F.getDoc(F.doc(fs, "users", uid, "meta", "link"));
          const o = s.exists() && typeof s.data().owner === "string" && s.data().owner ? s.data().owner : uid;
          try { localStorage.setItem(cacheKey(uid), o); } catch {}
          return o;
        } catch (e) {
          if (attempt === 0) console.warn("Charge Log: waiting to look up the shared list", e && e.code);
          await wait(Math.min(15000, 2000 * (attempt + 1)));
          if (auth.currentUser?.uid !== uid) return null;   // signed out meanwhile
        }
      }
    }
    let authSeq = 0;
    A.onAuthStateChanged(auth, async u => {
      const seq = ++authSeq;
      if (!u) { owner = null; emit("cloud-auth", null); return; }
      const user = () => ({ uid: u.uid, email: u.email || "", shared: owner !== u.uid });
      let cached = null; try { cached = localStorage.getItem(cacheKey(u.uid)); } catch {}
      if (cached) { owner = cached; emit("cloud-auth", user()); }   // start straight away, check in the background
      const o = await resolveOwner(u.uid);
      if (seq !== authSeq || !o) return;
      if (o !== owner) { owner = o; emit("cloud-auth", user()); }
    });
  } catch (e) {
    console.error("Charge Log sync failed to load", e);
    emit("cloud-failed", null);
  }
}
