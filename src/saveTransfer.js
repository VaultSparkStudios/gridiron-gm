// Moving a franchise between devices: the whole save as one compressed file (gzip where the browser
// can, else LZ text), shared from a phone (AirDrop, Messages, Files) or downloaded on a computer, and
// opened on the other device with Import. Plain .json saves from older versions still import.
import LZString from "lz-string";

const LZ_TAG = "FGMLZ1:";
const canGzip = () => typeof CompressionStream === "function" && typeof DecompressionStream === "function";

async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

// The save as file bytes.
export async function packSave(data) {
  const json = JSON.stringify(data);
  if (canGzip()) return pipe(new TextEncoder().encode(json), new CompressionStream("gzip"));
  return new TextEncoder().encode(LZ_TAG + LZString.compressToBase64(json));
}

// File bytes (any of the three formats) back to a save. Throws if it isn't one.
export async function unpackSave(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let text;
  if (b[0] === 0x1f && b[1] === 0x8b) {
    if (!canGzip()) throw new Error("This browser can't open compressed saves");
    text = new TextDecoder().decode(await pipe(b, new DecompressionStream("gzip")));
  } else {
    text = new TextDecoder().decode(b);
    if (text.startsWith(LZ_TAG)) text = LZString.decompressFromBase64(text.slice(LZ_TAG.length));
  }
  const d = JSON.parse(text);
  if (!d?.teams?.length || d.yr == null) throw new Error("Not a Football GM save");
  return d;
}

// "Football-GM-NYG-2031-wk7.gmsave"
export function saveFileName(d, ab) {
  const when = d.sp === "regular" ? `wk${d.wk}` : d.sp || "save";
  return `Football-GM-${ab || "team"}-${d.yr}-${when}.gmsave`;
}

// Share the file (phones: the share sheet) or download it. Resolves to "shared" | "downloaded" | "cancelled".
export async function sendSaveFile(data, ab, { share = false } = {}) {
  const bytes = await packSave(data);
  const name = saveFileName(data, ab);
  const file = typeof File === "function" ? new File([bytes], name, { type: "application/octet-stream" }) : null;
  if (share && file && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Football GM save" }); return "shared"; } catch (e) { if (e?.name === "AbortError") return "cancelled"; }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  return "downloaded";
}

export async function readSaveFile(file) {
  return unpackSave(new Uint8Array(await file.arrayBuffer()));
}
