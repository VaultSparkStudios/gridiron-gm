// The depth chart's field view opens on the grouping and package the team lines up in most.
import test from "node:test";
import assert from "node:assert/strict";
import { viewFor } from "../src/personnel.js";

test("field view follows the offensive identity", () => {
  assert.equal(viewFor({ personnel: "twoTE" }).form, "12");
  assert.equal(viewFor({ personnel: "fullback" }).form, "21");
  assert.equal(viewFor({ personnel: "spread" }).form, "11");
  assert.equal(viewFor({ personnel: "auto", coach: { oc: { scheme: "Power Run" } } }).form, "12");
});

test("field view follows the defensive lean", () => {
  assert.equal(viewFor({ defPkg: "base", coach: { dc: { scheme: "3-4" } } }).pkg, "base");
  assert.equal(viewFor({ defPkg: "nickel" }).pkg, "nickel");
});
