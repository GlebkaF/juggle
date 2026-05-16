const DB_NAME = 'juggle-tracker-db';
const DB_VERSION = 1;
const STORE_NAME = 'progress';
const STATE_KEY = 'current';

const OLD_LOCAL_STORAGE_KEYS = [
  'juggle-tracker-vue-v1',
  'juggle-tracker-v10',
  'juggle-tracker-v9',
  'juggle-tracker-v8',
  'juggle-tracker-v7',
  'juggle-tracker-v6',
  'juggle-tracker-v5',
];

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readFromIndexedDB() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(STATE_KEY);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function writeToIndexedDB(value) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, STATE_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function readLegacyLocalStorage() {
  for (const key of OLD_LOCAL_STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      // Ignore corrupted legacy state.
    }
  }

  return {};
}

export async function loadProgress() {
  try {
    const indexedState = await readFromIndexedDB();
    if (indexedState && typeof indexedState === 'object') {
      return indexedState;
    }

    const legacyState = readLegacyLocalStorage();
    if (Object.keys(legacyState).length > 0) {
      await saveProgress(legacyState);
    }

    return legacyState;
  } catch {
    return readLegacyLocalStorage();
  }
}

export async function saveProgress(value) {
  try {
    await writeToIndexedDB(value);
  } catch {
    // Fallback for private mode / old browsers.
  }

  localStorage.setItem('juggle-tracker-vue-v1', JSON.stringify(value));
}
