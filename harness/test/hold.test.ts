import { describe, expect, test } from "bun:test";
import { holdOnEnter } from "../src/run.ts";

/** A stand-in stdin: the given chunks, then its end. */
function stdin(...chunks: string[]): () => ReadableStream<Uint8Array> {
  return () =>
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      },
    });
}

/** The hold before performing `action`. */
const before = (action: string) => ({ kind: "perform" as const, action });

describe("holdOnEnter: a headed run's hold over stdin", () => {
  test("a line answers go, and once stdin has ended every call answers end", async () => {
    const printed: string[] = [];
    const hold = holdOnEnter(stdin("\n"), (text) => printed.push(text));
    expect(await hold(before("set actor to mux"))).toBe("go");
    expect(await hold(before("press Act"))).toBe("end");
    expect(await hold(before("press Step"))).toBe("end");
    expect(printed).toEqual([
      'hold: press Enter to perform "set actor to mux"',
      'hold: press Enter to perform "press Act"',
      'hold: press Enter to perform "press Step"',
    ]);
  });

  test("the hold before the browser closes asks for Enter to close it", async () => {
    const printed: string[] = [];
    const hold = holdOnEnter(stdin("\n"), (text) => printed.push(text));
    expect(await hold(before("press Act"))).toBe("go");
    expect(await hold({ kind: "close" })).toBe("end");
    expect(printed).toEqual([
      'hold: press Enter to perform "press Act"',
      "hold: press Enter to close the browser",
    ]);
  });

  test("each line answers one call, however stdin chunks them", async () => {
    const hold = holdOnEnter(stdin("go on\n\nand", " on\n"), () => {});
    const answers = [
      await hold(before("a")),
      await hold(before("b")),
      await hold({ kind: "close" }),
      await hold(before("d")),
    ];
    expect(answers).toEqual(["go", "go", "go", "end"]);
  });

  test("holds made for separate runs over one input share it, each line answering one call", async () => {
    let opened = 0;
    const once = stdin("\n\n\n");
    const input = () => {
      opened++;
      return once();
    };
    const first = holdOnEnter(input, () => {});
    const second = holdOnEnter(input, () => {});
    expect([
      await first(before("a")),
      await first(before("b")),
      await second(before("c")),
      await second(before("d")),
    ]).toEqual(["go", "go", "go", "end"]);
    expect(opened).toBe(1);
  });

  test("stdin is not read before the first hold", () => {
    let opened = 0;
    holdOnEnter(() => {
      opened++;
      return stdin()();
    });
    expect(opened).toBe(0);
  });
});
