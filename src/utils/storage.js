/* ═══ LOCALSTORAGE SEGURO ═══
   Safari en modo privado lanza al escribir. Sin protección, eso rompe
   la pantalla completa — y iOS es donde más usuarios de PWA hay. */

export const store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) {
      console.warn(`storage.get(${key}):`, e.message);
      return fallback;
    }
  },

  getJSON(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      console.warn(`storage.getJSON(${key}):`, e.message);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`storage.set(${key}):`, e.message);
      return false;
    }
  },

  setJSON(key, value) {
    return store.set(key, JSON.stringify(value));
  },

  remove(key) {
    try { localStorage.removeItem(key); return true; }
    catch (e) { console.warn(`storage.remove(${key}):`, e.message); return false; }
  },
};