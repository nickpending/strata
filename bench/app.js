import * as world from "./panels/world.js";

/** Every panel the bench mounts, in page order. A panel exports `mount(root, api)`. */
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
  verbs: () => request("GET", "/api/verbs"),
  act: (action) => request("POST", "/api/actions", action),
  step: () => request("POST", "/api/step"),
  reset: () => request("POST", "/api/reset"),
};

const root = document.getElementById("panels");
for (const panel of panels) {
  const host = document.createElement("div");
  root.append(host);
  panel.mount(host, api).catch((error) => {
    host.textContent = `panel failed: ${error}`;
  });
}
