/**
 * The Values section of the world panel: for each person, every value of the world's catalogue in
 * its order, one labelled line each with the value's id, the person's importance as a number and in
 * the catalogue's words, and the value's description, all as the values body serves them. No line
 * reads as a page name the player's vocabulary takes: no "<id>: held by", no "exits:", no " -> ",
 * and no heading with parentheses. The section adds no control.
 */

function valueLine(h, { id, importance, words, description }) {
  return h("li", {}, `${id}: importance ${importance}, ${words}, ${description}`);
}

function personBlock(h, body) {
  return h(
    "div",
    {},
    h("h3", {}, `What ${body.name} values`),
    h(
      "ul",
      {},
      body.values.map((value) => valueLine(h, value)),
    ),
  );
}

/** The section, built with the panel's element helper `h` from each person's values body. */
export function valuesSection(h, bodies) {
  return h(
    "section",
    {},
    h("h2", {}, "Values"),
    h(
      "div",
      { class: "grid" },
      bodies.map((body) => personBlock(h, body)),
    ),
  );
}
