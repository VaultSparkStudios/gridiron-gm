// Saves are big (32 full rosters, schedules, box scores, draft classes), so they are stored
// compressed; browsers only give a site about 5 MB. Compression runs in a worker when it can
// so autosaves don't freeze the page. Older plain-JSON saves still load.
import LZString from "lz-string";

const TAG = "lz1:";
let worker = null, nextId = 0;
const written = {};
try {
  worker = new Worker(new URL("./saveWorker.js", import.meta.url), { type: "module" });
  worker.onmessage = ({ data: { id, key, str } }) => {
    if (id < (written[key] || 0)) return; // a newer save of this key already landed
    written[key] = id;
    try { localStorage.setItem(key, str); } catch (e) { console.warn("Save failed", e); }
  };
} catch { worker = null; }

const saveNow = (key, value) => localStorage.setItem(key, TAG + LZString.compressToUTF16(JSON.stringify(value)));

export function saveJSON(key, value) {
  if (worker) {
    try { worker.postMessage({ id: ++nextId, key, value, tag: TAG }); return; } catch { /* not cloneable: save inline */ }
  }
  saveNow(key, value);
}

export function loadJSON(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const text = raw.startsWith(TAG) ? LZString.decompressFromUTF16(raw.slice(TAG.length)) : raw;
  // saves from before the game dropped emoji still carry them in news, logs and labels
  return JSON.parse(EMOJI.test(text) ? text.replace(EMOJI_ALL, "") : text);
}
const EMOJI = /\p{Extended_Pictographic}/u;
const EMOJI_ALL = /(?:(?![\u2605\u2606])\p{Extended_Pictographic}|[\uFE0F\u200D])+ ?/gu; // the game's own stars stay

// Delete a save, and drop any write of it still being compressed (it would bring the save back).
export function removeJSON(key) {
  written[key] = ++nextId;
  try { localStorage.removeItem(key); } catch { /* private mode */ }
}
