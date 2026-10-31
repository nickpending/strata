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

describe("holdOnEnter: a headed run's hold over stdin", () => {
  test("a line answers go, and once stdin has ended every call answers end", async () => {
    const printed: string[] = [];
    const hold = holdOnEnter(stdin("\n"), (text) => printed.push(text));
    expect(await hold("set actor to mux")).toBe("go");
    expect(await hold("press Act")).toBe("end");
    expect(await hold("press Step")).toBe("end");
    expect(printed).toEqual([
      'hold: press Enter to perform "set actor to mux"',
      'hold: press Enter to perform "press Act"',
      'hold: press Enter to perform "press Step"',
    ]);
  });

  test("each line answers one call, however stdin chunks them", async () => {
    const hold = holdOnEnter(stdin("go on\n\nand", " on\n"), () => {});
    const answers = [await hold("a"), await hold("b"), await hold("c"), await hold("d")];
    expect(answers).toEqual(["go", "go", "go", "end"]);
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
