import type { Control } from "./page.ts";

/** What performing a candidate does to its control. */
export type Move =
  | { kind: "select"; option: string }
  | { kind: "press" }
  | { kind: "type"; text: string };

/** One thing a run could do next on the page, with the sentence Jev is asked about. */
export type Candidate = {
  /** The question key Jev answers it under: c0, c1, ... */
  key: string;
  control: Control;
  move: Move;
  description: string;
};

/**
 * Every candidate the page offers now: each option of a select that is not selected, a press of
 * each enabled button, and typing the run's words into each enabled text field that does not
 * already hold them. Only labelled controls are candidates; with no words, nothing is typed.
 */
export function candidates(controls: Control[], words: string | null): Candidate[] {
  const found: Omit<Candidate, "key">[] = [];
  for (const control of controls) {
    if (control.label === "" || !control.enabled) continue;
    switch (control.kind) {
      case "select":
        for (const option of control.options) {
          if (option === control.value) continue;
          found.push({
            control,
            move: { kind: "select", option },
            description: `set ${control.label} to ${option}`,
          });
        }
        break;
      case "button":
        found.push({ control, move: { kind: "press" }, description: `press ${control.label}` });
        break;
      case "input":
      case "textarea":
        if (words === null || control.role !== "textbox" || control.value === words) break;
        found.push({
          control,
          move: { kind: "type", text: words },
          description: `type the words into ${control.label}`,
        });
        break;
    }
  }
  return found.map((candidate, i) => ({ key: `c${i}`, ...candidate }));
}
