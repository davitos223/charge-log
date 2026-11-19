// Cloud sync through Firebase (Auth email/password + Firestore with offline cache).
// Data lives at users/{uid}/charges/{id} and users/{uid}/meta/settings.
const V = "10.12.2";
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
const cfg = window.CHARGE_LOG_FIREBASE;

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
    let uid = null;
    const chargesCol = () => F.collection(fs, "users", uid, "charges");
    const chargeDoc = id => F.doc(fs, "users", uid, "charges", id);
    const settingsDoc = () => F.doc(fs, "users", uid, "meta", "settings");

    window.Cloud = {
      signIn: (email, pw) => A.signInWithEmailAndPassword(auth, email, pw),
      signOut: () => A.signOut(auth),
      resetPassword: email => A.sendPasswordResetEmail(auth, email),
      collection: () => ({
        add: d => { const r = F.doc(chargesCol()); return F.setDoc(r, d).then(() => ({ id: r.id })); },
        doc: id => ({ set: d => F.setDoc(chargeDoc(id), d), delete: () => F.deleteDoc(chargeDoc(id)) }),
      }),
      doc: () => ({ set: d => F.setDoc(settingsDoc(), d) }),
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
    A.onAuthStateChanged(auth, u => { uid = u ? u.uid : null; emit("cloud-auth", u ? { email: u.email || "" } : null); });
  } catch (e) {
    console.error("Charge Log sync failed to load", e);
    emit("cloud-failed", null);
  }
}
