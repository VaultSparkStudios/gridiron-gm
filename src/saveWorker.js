// Compresses saves off the main thread so autosaving never stutters the game.
import LZString from "lz-string";

self.onmessage = ({ data: { id, key, value, tag } }) => {
  self.postMessage({ id, key, str: tag + LZString.compressToUTF16(JSON.stringify(value)) });
};
