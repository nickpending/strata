/**
 * The Knowledge section of the world panel: for each person, what its own parts hold, who and
 * which places it knows, and its latest fact per subject with the tick and event that taught it.
 * A fact the world has since changed out of the person's sight carries the operator's stale marker.
 * No line reads as a page name the player's vocabulary takes: no "<id>: held by", no "exits:", and
 * no level-3 heading ending in a parenthesised id. The section adds no control.
 */

/** A location in words: a room, or a walk between two with its arrival tick. */
function whereText(location) {
  if (location === null || location === undefined) return "nowhere";
  if ("room" in location) return `room ${location.room}`;
  const { from, to, arrivesAt } = location.transit;
  return `in transit ${from} -> ${to}, arrives tick ${arrivesAt}`;
}

/** A fact's value in words, the same words for what it holds and for the world's value now. */
function valueText(kind, value) {
  return kind === "location" ? whereText(value) : String(value);
}

function knownPerson({ person, tick, source, subkind }) {
  return source === "authored"
    ? `knows person ${person}: authored tie, boot`
    : `knows person ${person}: first experienced tick ${tick}, ${source} ${subkind}`;
}

function factLine(h, fact) {
  const { kind, thing, value, tick, source, subkind, now, stale } = fact;
  if (kind === "place") return h("li", {}, `knows place ${thing}: authored, boot`);
  const subject = kind === "location" ? `location of ${thing}` : `holder of ${thing}`;
  return h(
    "li",
    {},
    `${subject}: ${valueText(kind, value)}, learned tick ${tick} from ${source} ${subkind}`,
    stale
      ? h("span", { class: "stale" }, ` STALE (operator view): now ${valueText(kind, now)}`)
      : null,
  );
}

function personBlock(h, body) {
  const { own, people, facts } = body;
  const holdings = own.holdings.length > 0 ? own.holdings.join(", ") : "nothing";
  return h(
    "div",
    {},
    h("h3", {}, `What ${body.name} knows`),
    h(
      "ul",
      {},
      h("li", {}, `own location (location part): ${whereText(own.location)}`),
      h("li", {}, `own holdings (holder part): ${holdings}`),
      people.map((known) => h("li", {}, knownPerson(known))),
      facts.map((fact) => factLine(h, fact)),
    ),
  );
}

/** The section, built with the panel's element helper `h` from each person's knowledge body. */
export function knowledgeSection(h, bodies) {
  return h(
    "section",
    {},
    h("h2", {}, "Knowledge"),
    h(
      "div",
      { class: "grid" },
      bodies.map((body) => personBlock(h, body)),
    ),
  );
}
