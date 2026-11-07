import { afterEach, describe, expect, test } from "bun:test";
import { DECISIONS_URL, ENV_KEY, keyFor } from "harness/jev.ts";

const FAKE = "sk-or-v1-FAKEENVKEY000000000000";
const saved = process.env[ENV_KEY];

afterEach(() => {
  if (saved === undefined) delete process.env[ENV_KEY];
  else process.env[ENV_KEY] = saved;
});

describe("OPENROUTER_API_KEY carries a key when none is named", () => {
  test("with no key named, the environment's key is the bearer", () => {
    process.env[ENV_KEY] = FAKE;
    // Compared as a boolean so a failure never prints whatever key apiconf would have returned.
    const keyed = keyFor(DECISIONS_URL, "decisions", {});
    expect(keyed.ok && keyed.key === FAKE).toBe(true);
  });

  test("a named key comes from apiconf even when the environment carries one", () => {
    process.env[ENV_KEY] = FAKE;
    const keyed = keyFor(DECISIONS_URL, "decisions", { keyName: "strata-test-no-such-key" });
    expect(keyed.ok).toBe(false);
    if (!keyed.ok) expect(keyed.refusal.message).toContain("strata-test-no-such-key");
  });

  test("an empty variable is no key: apiconf's default name is asked instead", () => {
    process.env[ENV_KEY] = "";
    const keyed = keyFor(DECISIONS_URL, "decisions", {});
    expect(keyed.ok && keyed.key === "").toBe(false);
  });

  test("an endpoint override is sent no key, however the environment is set", () => {
    process.env[ENV_KEY] = FAKE;
    expect(keyFor("http://127.0.0.1:9/", "decisions", { endpoint: "http://127.0.0.1:9/" })).toEqual(
      { ok: true, key: null },
    );
  });

  test("the environment's key is never sent over plain http to another machine", () => {
    process.env[ENV_KEY] = FAKE;
    const keyed = keyFor("http://strata-test.invalid/", "decisions", {});
    expect(keyed.ok).toBe(false);
    if (!keyed.ok) expect(keyed.refusal.message.includes(FAKE)).toBe(false);
  });
});
