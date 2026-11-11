/**
 * The world panel. In the player region: the act form built from the served verbs; the clock and
 * its schedule, step and reset; each pending state with who closes it and what the clock fires;
 * rooms with who is present, what they hold and their ties; who is in transit; the items with any
 * pending offer; and the history. In the operator region, which the harness never reads: what each
 * person values; what each person knows; what has passed between each person and each other; and
 * one person's received copies.
 */
import { encountersSection } from "./encounters.js";
import { knowledgeSection } from "./knowledge.js";
import { valuesSection } from "./values.js";

function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else if (key === "class") el.className = value;
    else if (key === "value") el.value = value;
    else el.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

function select(options, current, onchange) {
  return h(
    "select",
    { onchange: (event) => onchange(event.target.value) },
    options.map((option) =>
      h("option", option === current ? { value: option, selected: "" } : { value: option }, option),
    ),
  );
}

function json(value) {
  return h("pre", {}, JSON.stringify(value, null, 1));
}

export async function mount(regions, api) {
  const state = {
    snapshot: null,
    events: [],
    verbs: (await api.verbs()).body.verbs,
    viewer: null,
    received: [],
    /** Every person's values body, in the snapshot's person order. */
    values: [],
    /** Every person's knowledge body, in the snapshot's person order. */
    knowledge: [],
    /** Every person's encounters body, in the snapshot's person order. */
    encounters: [],
    form: { actor: null, verb: null, fields: {} },
    /** A rule's refusal of the last action (422): `{ code, message }`, code from the closed set. */
    refusal: null,
    /** Why the last action was malformed (400); never shown as a refusal and carries no code. */
    invalid: null,
    /** Why the last reset could not boot; the current world kept running. */
    resetRefusal: null,
  };
  const view = h("div");
  const side = h("div");
  regions.player.append(view);
  regions.operator.append(side);

  async function refresh() {
    state.snapshot = (await api.snapshot()).body;
    const last = state.events.at(-1);
    state.events.push(...(await api.events(last === undefined ? 0 : last.seq)).body.events);
    const people = Object.keys(state.snapshot.people);
    state.viewer ??= people[0] ?? null;
    state.form.actor ??= people[0] ?? null;
    state.form.verb ??= state.verbs[0]?.verb ?? null;
    state.received = state.viewer === null ? [] : (await api.received(state.viewer)).body.copies;
    state.values = await Promise.all(people.map(async (person) => (await api.values(person)).body));
    state.knowledge = await Promise.all(
      people.map(async (person) => (await api.knowledge(person)).body),
    );
    state.encounters = await Promise.all(
      people.map(async (person) => (await api.encounters(person)).body),
    );
    render();
  }

  function holdingsOf(person) {
    return state.snapshot.views.holdings[person] ?? [];
  }

  function personLine(person) {
    const { ties } = state.snapshot.people[person];
    const holds = holdingsOf(person);
    return h(
      "li",
      {},
      h("strong", {}, person),
      holds.length > 0 ? ` holds ${holds.join(", ")}` : " holds nothing",
      h(
        "ul",
        {},
        ties.map((tie) => h("li", { class: "muted" }, `${tie.kind} -> ${tie.target}: ${tie.note}`)),
      ),
    );
  }

  function roomsSection() {
    const { rooms, views } = state.snapshot;
    return h(
      "section",
      {},
      h("h2", {}, "Rooms"),
      h(
        "div",
        { class: "grid" },
        Object.values(rooms).map((room) =>
          h(
            "div",
            {},
            h("h3", {}, `${room.name} (${room.id})`),
            h("div", { class: "muted" }, room.description),
            h(
              "div",
              {},
              "exits: ",
              Object.entries(room.exits)
                .map(
                  ([exit, to]) =>
                    `${exit} -> ${to.to} (${to.travel_ticks} ${to.travel_ticks === 1 ? "tick" : "ticks"})`,
                )
                .join("; "),
            ),
            h("ul", {}, (views.presence[room.id] ?? []).map(personLine)),
          ),
        ),
      ),
    );
  }

  function transitSection() {
    const { inTransit } = state.snapshot.views;
    return h(
      "section",
      {},
      h("h2", {}, "In transit"),
      inTransit.length === 0
        ? h("div", { class: "muted" }, "nobody")
        : h(
            "ul",
            {},
            inTransit.map((t) =>
              h("li", {}, `${t.person}: ${t.from} -> ${t.to}, arrives at tick ${t.arrivesAt}`),
            ),
          ),
      inTransit.length === 0
        ? null
        : h(
            "ul",
            {},
            inTransit.map((t) => personLine(t.person)),
          ),
    );
  }

  function itemsSection() {
    const { items, views } = state.snapshot;
    return h(
      "section",
      {},
      h("h2", {}, "Items"),
      h(
        "ul",
        {},
        Object.entries(items).map(([id, item]) => {
          const offer = views.offers.find((o) => o.item === id);
          return h(
            "li",
            {},
            `${id}: held by ${item.holder}`,
            offer === undefined
              ? null
              : ` (offered to ${offer.to} by ${offer.from} in ${offer.offerEvent}, until tick ${offer.until})`,
          );
        }),
      ),
    );
  }

  function clockSection() {
    const { tick, gameMinutes, tickMinutes, views } = state.snapshot;
    return h(
      "section",
      {},
      h("h2", {}, "Clock"),
      h("div", {}, `tick ${tick}, game time ${gameMinutes} minutes (${tickMinutes} per tick)`),
      h("button", { onclick: () => void runStep() }, "Step"),
      " ",
      h("button", { onclick: () => void runReset() }, "Reset"),
      state.resetRefusal === null
        ? null
        : h(
            "div",
            { class: "refused" },
            `reset refused (${state.resetRefusal.rule}), the current world is still running: ${state.resetRefusal.message}`,
          ),
      h("h3", {}, "Schedule"),
      views.due.length === 0
        ? h("div", { class: "muted" }, "empty")
        : h(
            "ul",
            {},
            views.due.map((entry) =>
              h(
                "li",
                {},
                `tick ${entry.at}: ${entry.subkind} of ${entry.actor} (cause ${entry.cause})`,
              ),
            ),
          ),
    );
  }

  /** `{ key: value, ... }` as `key value, ...`, the way a pending line names fields. */
  function named(fields) {
    return Object.entries(fields)
      .map(([key, value]) => `${key} ${value}`)
      .join(", ");
  }

  function resolverText({ action }) {
    const { actor, verb, ...fields } = action;
    const given = named(fields);
    return `${actor} ${verb}${given === "" ? "" : ` (${given})`}`;
  }

  /** One pending state as one line, built from its fields: what opened it, who closes it, the clock. */
  function pendingLine({ opened, due, resolutions }) {
    const to = opened.targets.length > 0 ? ` to ${opened.targets.join(", ")}` : "";
    const fields = named(opened.payload);
    const resolvers =
      resolutions.length === 0
        ? "no one resolves it"
        : `resolved by ${resolutions.map(resolverText).join(", ")}`;
    return h(
      "li",
      {},
      `${opened.subkind} ${opened.id} by ${opened.actor}${to}${fields === "" ? "" : ` (${fields})`}: ${resolvers}; at tick ${due.at} the clock fires ${due.fires}`,
    );
  }

  function pendingSection() {
    const { pending } = state.snapshot;
    return h(
      "section",
      {},
      h("h2", {}, "Pending"),
      pending.length === 0
        ? h("div", { class: "muted" }, "nothing pending")
        : h("ul", {}, pending.map(pendingLine)),
    );
  }

  function fieldInput(field) {
    const { form, snapshot } = state;
    const set = (value) => {
      form.fields[field] = value;
    };
    let options = null;
    if (field === "target") options = Object.keys(snapshot.people);
    if (field === "item") options = Object.keys(snapshot.items);
    if (field === "exit") {
      const location = snapshot.people[form.actor]?.location;
      const room = location?.room === undefined ? undefined : snapshot.rooms[location.room];
      options = room === undefined ? [] : Object.keys(room.exits);
    }
    if (options !== null) {
      if (!options.includes(form.fields[field])) form.fields[field] = options[0] ?? "";
      return h("label", {}, `${field} `, select(options, form.fields[field], set));
    }
    return h(
      "label",
      {},
      `${field} `,
      h("input", { value: form.fields[field] ?? "", oninput: (event) => set(event.target.value) }),
    );
  }

  function actSection() {
    const { form } = state;
    const verb = state.verbs.find((v) => v.verb === form.verb);
    return h(
      "section",
      {},
      h("h2", {}, "Act"),
      h(
        "form",
        {
          onsubmit: (event) => {
            event.preventDefault();
            void submit();
          },
        },
        h(
          "label",
          {},
          "actor ",
          select(Object.keys(state.snapshot.people), form.actor, (value) => {
            form.actor = value;
            render();
          }),
        ),
        h(
          "label",
          {},
          "verb ",
          select(
            state.verbs.map((v) => v.verb),
            form.verb,
            (value) => {
              form.verb = value;
              render();
            },
          ),
        ),
        (verb?.fields ?? []).map(fieldInput),
        h("button", { type: "submit" }, "Act"),
      ),
      state.refusal === null
        ? null
        : h(
            "div",
            { class: "refused" },
            `refused: ${state.refusal.code}: ${state.refusal.message}`,
          ),
      state.invalid === null
        ? null
        : h(
            "div",
            { class: "invalid" },
            `invalid action, not checked by any rule: ${state.invalid}`,
          ),
    );
  }

  function eventLine(event) {
    const { payload, ...envelope } = event;
    return h(
      "div",
      { class: "event" },
      h("strong", {}, `${envelope.id} t${envelope.tick} ${envelope.subkind}`),
      ` by ${envelope.actor}`,
      envelope.targets.length > 0 ? ` to ${envelope.targets.join(", ")}` : null,
      ` at ${envelope.place ?? "-"} (cause ${envelope.cause})`,
      h("div", { class: "muted" }, "envelope"),
      json(envelope),
      h("div", { class: "muted" }, "payload"),
      json(payload),
    );
  }

  function historySection() {
    return h(
      "section",
      {},
      h("h2", {}, "History"),
      state.events.length === 0
        ? h("div", { class: "muted" }, "no events yet")
        : [...state.events].reverse().map(eventLine),
    );
  }

  function receivedSection() {
    return h(
      "section",
      {},
      h("h2", {}, "Received"),
      h(
        "label",
        {},
        "person ",
        select(Object.keys(state.snapshot.people), state.viewer, (value) => {
          state.viewer = value;
          void refresh();
        }),
      ),
      state.received.length === 0
        ? h("div", { class: "muted" }, "nothing received")
        : [...state.received].reverse().map(eventLine),
    );
  }

  /**
   * The player region gets what the player acts with and whose world state its decisions read; the
   * operator region gets the per-person panels, all open. A panel added later goes to the operator
   * region unless its work order puts it in the player's.
   */
  function render() {
    view.replaceChildren(
      actSection(),
      clockSection(),
      pendingSection(),
      roomsSection(),
      transitSection(),
      itemsSection(),
      historySection(),
    );
    side.replaceChildren(
      valuesSection(h, state.values),
      knowledgeSection(h, state.knowledge),
      encountersSection(h, state.encounters),
      receivedSection(),
    );
  }

  async function submit() {
    const { form } = state;
    const verb = state.verbs.find((v) => v.verb === form.verb);
    const action = { actor: form.actor, verb: form.verb };
    for (const field of verb?.fields ?? []) action[field] = form.fields[field] ?? "";
    const { status, body } = await api.act(action);
    state.refusal = status === 422 ? body.refused : null;
    state.invalid = status !== 200 && status !== 422 ? (body.error ?? `HTTP ${status}`) : null;
    if (status === 200) form.fields.words = "";
    await refresh();
  }

  async function runStep() {
    await api.step();
    await refresh();
  }

  async function runReset() {
    const { status, body } = await api.reset();
    if (status !== 200) {
      state.resetRefusal = body.refusal ?? { rule: `HTTP ${status}`, message: body.error ?? "" };
      await refresh();
      return;
    }
    state.resetRefusal = null;
    state.events = [];
    state.refusal = null;
    state.invalid = null;
    await refresh();
  }

  await refresh();
}
