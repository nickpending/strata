import * as world from "./panels/world.js";

/**
 * Every panel the bench mounts, in page order. A panel exports `mount(regions, api)`, rendering
 * what the player acts with into `regions.player` and the operator's panels into `regions.operator`.
 */
const panels = [world];

async function request(method, path, body) {
  const response = await fetch(path, {
    method,
    // The server takes a POST only as JSON, which a page of another origin cannot send unasked.
    headers: method === "POST" ? { "content-type": "application/json" } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

/** The bench API every panel calls; each method resolves to `{ status, body }`. */
const api = {
  snapshot: () => request("GET", "/api/snapshot"),
  events: (since) => request("GET", `/api/events?since=${since}`),
  received: (thing) => request("GET", `/api/received/${encodeURIComponent(thing)}`),
  knowledge: (thing) => request("GET", `/api/knowledge/${encodeURIComponent(thing)}`),
  encounters: (thing) => request("GET", `/api/encounters/${encodeURIComponent(thing)}`),
  values: (thing) => request("GET", `/api/values/${encodeURIComponent(thing)}`),
  verbs: () => request("GET", "/api/verbs"),
  act: (action) => request("POST", "/api/actions", action),
  step: () => request("POST", "/api/step"),
  reset: () => request("POST", "/api/reset"),
};

/** The page's two regions: the player's, which the harness reads, and the operator's, which it never does. */
const regionRoots = {
  player: document.getElementById("world"),
  operator: document.getElementById("operator"),
};
for (const panel of panels) {
  const regions = {
    player: document.createElement("div"),
    operator: document.createElement("div"),
  };
  regionRoots.player.append(regions.player);
  regionRoots.operator.append(regions.operator);
  panel.mount(regions, api).catch((error) => {
    regions.player.textContent = `panel failed: ${error}`;
  });
}
