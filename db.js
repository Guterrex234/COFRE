// Armazenamento local criptografado.
// Tudo fica no IndexedDB deste aparelho. O PIN nunca é salvo:
// dele derivamos uma chave AES-GCM (PBKDF2) que só existe na memória enquanto o app está desbloqueado.
'use strict';

const DB = (() => {
  const DB_NAME = 'cofre';
  const STORE = 'kv';
  const ITERATIONS = 600000;
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  let key = null; // CryptoKey em memória (apenas enquanto desbloqueado)
  let meta = null; // { salt, iterations }

  function open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function get(k) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(k);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function put(k, v) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(v, k);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function clearAll() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  async function deriveKey(pin, saltB64, iterations) {
    const base = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: unb64(saltB64), iterations, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encrypt(k, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(JSON.stringify(obj)));
    return { iv: b64(iv), ct: b64(ct) };
  }

  async function decrypt(k, box) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, k, unb64(box.ct));
    return JSON.parse(dec.decode(pt));
  }

  const newSalt = () => b64(crypto.getRandomValues(new Uint8Array(16)));

  return {
    async exists() {
      return !!(await get('meta'));
    },

    // Primeiro acesso: cria o cofre com o PIN escolhido.
    async create(pin, state) {
      meta = { salt: newSalt(), iterations: ITERATIONS };
      key = await deriveKey(pin, meta.salt, meta.iterations);
      await put('meta', meta);
      await put('data', await encrypt(key, state));
    },

    // Retorna o estado se o PIN estiver certo; lança erro se estiver errado.
    // O AES-GCM autentica os dados: PIN errado = falha ao descriptografar.
    async unlock(pin) {
      const m = await get('meta');
      const box = await get('data');
      const k = await deriveKey(pin, m.salt, m.iterations);
      const state = await decrypt(k, box);
      meta = m;
      key = k;
      return state;
    },

    async verify(pin) {
      const m = await get('meta');
      const box = await get('data');
      try {
        await decrypt(await deriveKey(pin, m.salt, m.iterations), box);
        return true;
      } catch {
        return false;
      }
    },

    async save(state) {
      if (!key) return;
      await put('data', await encrypt(key, state));
    },

    async changePin(newPin, state) {
      const m = { salt: newSalt(), iterations: ITERATIONS };
      const k = await deriveKey(newPin, m.salt, m.iterations);
      const box = await encrypt(k, state);
      await put('meta', m);
      await put('data', box);
      meta = m;
      key = k;
    },

    lock() {
      key = null;
    },

    // Backup: o arquivo vai criptografado com a mesma chave/PIN do momento da exportação.
    async exportBackup(state) {
      const box = await encrypt(key, state);
      return { app: 'cofre', v: 1, salt: meta.salt, iterations: meta.iterations, iv: box.iv, ct: box.ct, at: new Date().toISOString() };
    },

    async readBackup(file, pin) {
      if (!file || file.app !== 'cofre' || !file.salt || !file.ct) throw new Error('arquivo');
      const k = await deriveKey(pin, file.salt, file.iterations || ITERATIONS);
      return decrypt(k, { iv: file.iv, ct: file.ct });
    },

    async wipe() {
      key = null;
      meta = null;
      await clearAll();
    },

    // Usado só nos testes, para conferir que os dados salvos estão ilegíveis.
    async rawData() {
      return get('data');
    },
  };
})();
