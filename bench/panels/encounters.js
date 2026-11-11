/**
 * The Encounters section of the world panel: for each person, what has passed between it and each
 * other person who received the same event, direct when it was the event's actor or a target and
 * witnessed otherwise, grouped by the other person in the order of its first encounter, one labelled
 * line per encounter in event order. No line reads as a page name the player's vocabulary takes: no
 * "<id>: held by", no "exits:", no " -> ", and no heading with parentheses. The section adds no control.
 */

const ROLE_TEXT = {
  direct: "role direct (actor or target)",
  witnessed: "role witnessed (bystander)",
};

function encounterLine(h, { role, subkind, tick, event }) {
  return h("li", {}, `${ROLE_TEXT[role]}, kind ${subkind}, tick ${tick}, event ${event}`);
}

/** The encounters grouped by the other person, keyed in the order each was first met. */
function byOther(encounters) {
  const groups = new Map();
  for (const encounter of encounters) {
    const group = groups.get(encounter.with) ?? [];
    group.push(encounter);
    groups.set(encounter.with, group);
  }
  return groups;
}

function personBlock(h, body) {
  return h(
    "div",
    {},
    h("h3", {}, `What has passed between ${body.name} and others`),
    body.encounters.length === 0
      ? h("div", { class: "muted" }, "no encounters yet")
      : h(
          "ul",
          {},
          [...byOther(body.encounters)].map(([other, group]) =>
            h(
              "li",
              {},
              `with ${other}`,
              h(
                "ul",
                {},
                group.map((encounter) => encounterLine(h, encounter)),
              ),
            ),
          ),
        ),
  );
}

/** The section, built with the panel's element helper `h` from each person's encounters body. */
export function encountersSection(h, bodies) {
  return h(
    "section",
    {},
    h("h2", {}, "Encounters"),
    h(
      "div",
      { class: "grid" },
      bodies.map((body) => personBlock(h, body)),
    ),
  );
}
