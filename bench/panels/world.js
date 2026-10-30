/**
 * The world panel: rooms with who is present, what they hold and their ties; who is in transit;
 * the items with any pending offer; the clock and its schedule; the act form built from the
 * served verbs; step and reset; the history; and one person's received copies.
 */

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

export async function mount(root, api) {
  const state = {
    snapshot: null,
    events: [],
    verbs: (await api.verbs()).body.verbs,
    viewer: null,
    received: [],
    form: { actor: null, verb: null, fields: {} },
    refusal: null,
  };
  const view = h("div");
  root.append(view);

  async function refresh() {
    state.snapshot = (await api.snapshot()).body;
    const last = state.events.at(-1);
    state.events.push(...(await api.events(last === undefined ? 0 : last.seq)).body.events);
    const people = Object.keys(state.snapshot.people);
    state.viewer ??= people[0] ?? null;
    state.form.actor ??= people[0] ?? null;
    state.form.verb ??= state.verbs[0]?.verb ?? null;
    state.received = state.viewer === null ? [] : (await api.received(state.viewer)).body.copies;
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
                .map(([exit, to]) => `${exit} -> ${to.to} (${to.travel_ticks} ticks)`)
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

  function render() {
    view.replaceChildren(
      actSection(),
      clockSection(),
      roomsSection(),
      transitSection(),
      itemsSection(),
      receivedSection(),
      historySection(),
    );
  }

  async function submit() {
    const { form } = state;
    const verb = state.verbs.find((v) => v.verb === form.verb);
    const action = { actor: form.actor, verb: form.verb };
    for (const field of verb?.fields ?? []) action[field] = form.fields[field] ?? "";
    const { status, body } = await api.act(action);
    if (status === 422) state.refusal = body.refused;
    else if (status !== 200) state.refusal = { code: "invalid", message: body.error ?? status };
    else {
      state.refusal = null;
      form.fields.words = "";
    }
    await refresh();
  }

  async function runStep() {
    await api.step();
    await refresh();
  }

  async function runReset() {
    await api.reset();
    state.events = [];
    state.refusal = null;
    await refresh();
  }

  await refresh();
}
