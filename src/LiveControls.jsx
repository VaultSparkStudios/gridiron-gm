// The live game's controls on a computer screen: the game settings as segmented switches
// (every choice visible, the one that's on lit up, so "Off" never looks like a disabled button),
// and the actions (pause, skip ahead, finish) as one matched set of buttons.
import React from "react";
import { C, Pills } from "./ui.jsx";

// options: [[value, text, title?]]. The calm switch: a soft track, the chosen option a white pill.
// full: the options share the whole width (so a long row never spills out of its box).
export function Seg({ label, options, value, onChange, title, full }) {
  return (
    <div title={title} style={{ display: full ? "flex" : "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      {label && <span style={{ fontSize: 12, fontWeight: 700, color: C.mt, whiteSpace: "nowrap" }}>{label}</span>}
      <Pills full={full} items={options} value={value} onChange={(v) => v !== value && onChange(v)} style={full ? { flex: 1, width: "auto" } : undefined} />
    </div>
  );
}

// kind: "go" (resume: green), "stop" (pause: orange) or plain
export function Act({ children, onClick, kind, title, wide, big }) {
  const bg = kind === "go" ? "#16a34a" : kind === "stop" ? "#ea580c" : C.cd;
  return (
    <button type="button" onClick={onClick} title={title}
      style={{ height: big ? 48 : 36, minWidth: wide ? (big ? 190 : 108) : 0, padding: big ? "0 20px" : "0 14px", borderRadius: big ? 12 : 9, boxShadow: kind && big ? "0 6px 18px #0007" : "none", border: `1px solid ${kind ? "transparent" : C.bd}`, background: bg, color: "#fff", fontSize: big ? (wide ? 17 : 15) : 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {children}
    </button>
  );
}

// The game settings, each with a line saying what the current choice does.
const WHY = {
  call: { false: "Your coaches call every play.", true: "You call each play when you have the ball, and pick the receiver on passes." },
  field: { Big: "The field takes the whole left side; the last play and the buttons sit beside it.", Standard: "The last play and the buttons sit under the field." },
  cam: { Field: "The whole field stays in view while a play plays out, like the All-22.", Action: "The camera pushes in on the ball and follows the play." },
  live: { Key: "Third and fourth downs, goal to go, a close finish and big plays play out on the field.", All: "Every run and pass plays out on the field.", Off: "Results only: the field just resets between plays." },
};
function Setting({ title, why, children }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{title}</div>
      {children}
      <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.4, marginTop: 6 }}>{why}</div>
    </div>
  );
}
export function LiveSettings({ callMode, onCall, livePlays, onLivePlays, speed, speeds, onSpeed, cam, onCam, field, onField }) {
  return (
    <div style={{ display: "grid", gap: "16px 22px", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
      <Setting title="Play calling" why={WHY.call[callMode]}>
        <Seg full value={callMode} onChange={onCall} options={[[false, "Coaches"], [true, "Me"]]} />
      </Setting>
      <Setting title="Live plays" why={WHY.live[livePlays]}>
        <Seg full value={livePlays} onChange={onLivePlays} options={[["Key", "Key"], ["All", "Every"], ["Off", "Off"]]} />
      </Setting>
      <Setting title="Speed" why={speed === "Condensed" ? (livePlays === "Off" ? "Routine plays flash by. Turn Live plays on to watch the key ones." : "Routine plays flash by; only the key plays take time.") : "How long the game waits between plays."}>
        <Seg full value={speed} onChange={onSpeed} options={speeds.map((k) => [k, k])} />
      </Setting>
      {onCam && <Setting title="Camera" why={WHY.cam[cam]}>
        <Seg full value={cam} onChange={onCam} options={[["Field", "Field view"], ["Action", "Action cam"]]} />
      </Setting>}
      {onField && <Setting title="Field size" why={WHY.field[field]}>
        <Seg full value={field} onChange={onField} options={[["Big", "Big"], ["Standard", "Standard"]]} />
      </Setting>}
    </div>
  );
}
