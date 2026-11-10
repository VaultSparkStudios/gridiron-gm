// A drop-in for <select>: the phone's own picker on mobile (it's good there), and on desktop a
// dark list in the game's style instead of the browser's plain white one. Takes the same
// <option>/<optgroup> children, value and onChange (called with { target: { value } }).
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MOBILE } from "./mobile.js";
import { C } from "./ui.jsx";

const text = (ch) => React.Children.toArray(ch).map((c) => (typeof c === "string" || typeof c === "number" ? c : text(c?.props?.children))).join("");

// The options as a flat list: { group } headers and { value, label, disabled } rows.
function flatten(children, out = []) {
  React.Children.forEach(children, (c) => {
    if (!c) return;
    if (c.type === React.Fragment) return flatten(c.props.children, out);
    if (c.type === "optgroup") { out.push({ group: c.props.label }); return flatten(c.props.children, out); }
    if (c.type === "option") out.push({ value: String(c.props.value ?? text(c.props.children)), label: text(c.props.children), disabled: !!c.props.disabled });
  });
  return out;
}

export default function Select({ value, onChange, children, style, disabled, ...rest }) {
  if (MOBILE) return <select value={value} onChange={onChange} style={style} disabled={disabled} {...rest}>{children}</select>;
  return <Picker value={value} onChange={onChange} style={style} disabled={disabled} label={rest["aria-label"] || rest.title}>{children}</Picker>;
}

function Picker({ value, onChange, children, style, disabled, label }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(-1);
  const [pos, setPos] = useState(null);
  const btn = useRef(null), list = useRef(null);
  const items = flatten(children);
  const opts = items.filter((x) => !x.group);
  const cur = opts.find((o) => o.value === String(value ?? ""));
  const searchable = opts.length > 14;
  const shown = q ? items.filter((x) => !x.group && x.label.toLowerCase().includes(q.toLowerCase())) : items;
  const picks = shown.filter((x) => !x.group && !x.disabled);

  const choose = (o) => { setOpen(false); setQ(""); if (o.value !== String(value ?? "")) onChange?.({ target: { value: o.value } }); };

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btn.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 12, above = r.top - 12;
      const up = below < 220 && above > below;
      const width = Math.max(r.width, 220);
      setPos({ left: Math.max(8, Math.min(window.innerWidth - width - 8, r.left)), width, top: up ? undefined : r.bottom + 4, bottom: up ? window.innerHeight - r.top + 4 : undefined, maxH: Math.min(380, up ? above : below) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (!btn.current?.contains(e.target) && !list.current?.contains(e.target)) { setOpen(false); setQ(""); } };
    document.addEventListener("mousedown", off);
    setHi(Math.max(0, picks.findIndex((o) => o.value === String(value ?? ""))));
    setTimeout(() => list.current?.querySelector("[data-on='1']")?.scrollIntoView({ block: "nearest" }), 0);
    return () => document.removeEventListener("mousedown", off);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const key = (e) => {
    if (!open) { if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) { e.preventDefault(); setOpen(true); } return; }
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); setQ(""); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(picks.length - 1, h + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (picks[hi]) choose(picks[hi]); }
  };
  useEffect(() => { list.current?.querySelector("[data-hi='1']")?.scrollIntoView({ block: "nearest" }); }, [hi]);

  const { flex, width, minWidth, maxWidth, margin, marginLeft, marginRight, marginTop, marginBottom, alignSelf } = style || {};
  // Every dropdown looks the same; a caller only sets its size.
  const { fontSize, fontWeight, padding, minHeight, height } = style || {};
  const look = { fontSize, fontWeight, padding, minHeight, height };
  Object.keys(look).forEach((k) => look[k] === undefined && delete look[k]);
  return (
    <span style={{ position: "relative", display: "inline-flex", flex, width, minWidth: minWidth ?? 0, maxWidth, margin, marginLeft, marginRight, marginTop, marginBottom, alignSelf }}>
      <button ref={btn} type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)} onKeyDown={key}
        style={{ background: "#0d1424", color: C.tx, border: "1px solid #334155", borderRadius: 8, padding: "6px 10px", fontSize: 14, fontWeight: 600, cursor: disabled ? "default" : "pointer", textAlign: "left", ...look, width: "100%", display: "flex", alignItems: "center", gap: 8, opacity: disabled ? 0.5 : 1 }}>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cur?.label ?? ""}</span>
        <span aria-hidden="true" style={{ fontSize: 10, opacity: 0.7, transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </button>
      {open && pos && createPortal(
        <div ref={list} role="listbox" onKeyDown={key} style={{ position: "fixed", left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width, maxHeight: pos.maxH, zIndex: 4000, display: "flex", flexDirection: "column", background: "#0d1424", border: `1px solid #334155`, borderRadius: 10, boxShadow: "0 14px 34px #000c", overflow: "hidden", fontFamily: getComputedStyle(btn.current).fontFamily }}>
          {searchable && <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setHi(0); }} onKeyDown={key} placeholder="Search…" style={{ margin: 6, padding: "6px 9px", borderRadius: 6, border: `1px solid ${C.bd}`, background: C.bg, color: C.tx, fontSize: 14, outline: "none" }} />}
          <div style={{ overflowY: "auto", padding: 4 }}>
            {shown.map((x, i) => x.group != null
              ? <div key={`g${i}`} style={{ padding: "8px 10px 3px", fontSize: 11, fontWeight: 800, letterSpacing: 1, color: "#64748b", textTransform: "uppercase" }}>{x.group}</div>
              : (() => { const on = x.value === String(value ?? ""), h = picks[hi] === x; return (
                <div key={x.value + i} role="option" aria-selected={on} data-on={on ? "1" : undefined} data-hi={h ? "1" : undefined} onMouseEnter={() => !x.disabled && setHi(picks.indexOf(x))} onMouseDown={(e) => e.preventDefault()} onClick={() => !x.disabled && choose(x)}
                  style={{ padding: "6px 10px", borderRadius: 6, fontSize: 14, cursor: x.disabled ? "default" : "pointer", color: x.disabled ? "#475569" : on ? "#fde68a" : C.tx, background: h ? "#1e293b" : "transparent", fontWeight: on ? 800 : 500, display: "flex", gap: 8 }}>
                  <span style={{ width: 12, flex: "0 0 12px", color: "#fde68a" }}>{on ? "✓" : ""}</span><span style={{ flex: 1, minWidth: 0 }}>{x.label}</span>
                </div>); })())}
            {!shown.length && <div style={{ padding: 10, fontSize: 13, color: C.mt }}>No matches</div>}
          </div>
        </div>, document.body)}
    </span>
  );
}
