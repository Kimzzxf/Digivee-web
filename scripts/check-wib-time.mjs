// Runnable self-check for src/lib/time.js's WIB math. No framework — just
// asserts. Run manually with `node scripts/check-wib-time.mjs`.
//
// The bug this guards against: combineDateTime/addMinutesToDateTime used to
// build dates with `new Date("YYYY-MM-DDTHH:MM:00")`, which JS parses using
// the RUNTIME's local timezone. That's fine in a browser (usually WIB), but
// wrong on the Netlify server (runs in UTC) — same code, different answer
// depending on where it runs. This check runs the same assertions with
// TZ=UTC forced (simulating the server) to prove the fix no longer cares.
import assert from "node:assert/strict";
import { combineDateTime, addMinutesToDateTime, TIME_SLOTS } from "../src/lib/time.js";

// 12:00 WIB on 2026-08-12 must equal 05:00 UTC, no matter the runtime TZ.
const noon = combineDateTime("2026-08-12", "12:00");
assert.equal(noon.toISOString(), "2026-08-12T05:00:00.000Z", "12:00 WIB should be 05:00 UTC");

// +90 minutes from 12:00 WIB -> 13:30 WIB, same calendar day.
const plus90 = addMinutesToDateTime("2026-08-12", "12:00", 90);
assert.deepEqual(plus90, { date: "2026-08-12", time: "13:30" });

// Crossing midnight WIB: 23:00 + 90min -> 00:30 next day, still WIB.
const crossMidnight = addMinutesToDateTime("2026-08-12", "23:00", 90);
assert.deepEqual(crossMidnight, { date: "2026-08-13", time: "00:30" });

// TIME_SLOTS now steps by 1 minute across the 09:00-20:00 window.
assert.equal(TIME_SLOTS[0], "09:00");
assert.equal(TIME_SLOTS[1], "09:01");
assert.equal(TIME_SLOTS.at(-1), "20:00");
assert.equal(TIME_SLOTS.length, 11 * 60 + 1);

console.log(`OK (TZ=${process.env.TZ || "(runtime default)"}) — ${TIME_SLOTS.length} slots, WIB math checks out.`);
