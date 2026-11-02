import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { type RegistryEntry, registry, subkinds } from "../src/engine/events.ts";

// The root typecheck compiles this file: an entry that says nothing of what its copies teach is a
// type error, so the directive below is used, and an optional teaches would leave it unused.
// @ts-expect-error teaches is required on every registry entry
const untaught: RegistryEntry = { payload: z.strictObject({}), visibility: { audience: "none" } };

describe("K6: every registry entry declares what its copies teach", () => {
  test("each of the ten subkinds has teaches, and time.tick's teaches nothing", () => {
    expect(subkinds).toHaveLength(10);
    expect(subkinds.filter((subkind) => typeof registry[subkind].teaches !== "function")).toEqual(
      [],
    );
    const tick = {
      id: "e1",
      tick: 1,
      seq: 1,
      kind: "time",
      actor: "clock",
      targets: [],
      place: null,
      visibility: registry["time.tick"].visibility,
      cause: "operator",
      payload: {},
    };
    const clock: RegistryEntry = registry["time.tick"];
    expect(clock.teaches(tick)).toEqual([]);
    expect("teaches" in untaught).toBe(false);
  });
});
