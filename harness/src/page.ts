/**
 * Reading a page as a person does: its accessible text, and every control with the label a person
 * reads it by. Controls are found and worked by role and label, never by a selector a person
 * cannot see.
 */
import { existsSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import { join } from "node:path";
import type { Locator, Page } from "playwright";

/**
 * The account's home as the user database records it, which a moved HOME does not change (Bun's
 * os.userInfo() reads HOME); undefined when the lookup fails.
 */
function accountHome(): string | undefined {
  const user = userInfo().username;
  const lookup =
    process.platform === "darwin"
      ? ["dscl", ".", "-read", `/Users/${user}`, "NFSHomeDirectory"]
      : ["getent", "passwd", user];
  try {
    const found = Bun.spawnSync(lookup, { stdout: "pipe", stderr: "ignore" });
    if (found.exitCode !== 0) return undefined;
    const out = found.stdout.toString().trim();
    const home = process.platform === "darwin" ? out.split(": ")[1] : out.split(":")[5];
    return home === undefined || home === "" ? undefined : home;
  } catch {
    return undefined;
  }
}

/**
 * Point Playwright at this account's browser install when HOME has been moved off the account's
 * home (a test runner's fresh root): Playwright looks for its browsers under HOME, and fixes where
 * when it is first imported, so this runs before any import of playwright in the process, and its
 * children inherit it. A no-op when PLAYWRIGHT_BROWSERS_PATH is set, HOME is the account's, or the
 * account has no install.
 */
export function useAccountBrowsers(env: Record<string, string | undefined> = process.env): void {
  if ((env.PLAYWRIGHT_BROWSERS_PATH ?? "") !== "") return;
  const account = accountHome();
  if (account === undefined || account === homedir()) return;
  const caches: Partial<Record<NodeJS.Platform, string>> = {
    darwin: join(account, "Library", "Caches"),
    linux: join(account, ".cache"),
  };
  const cache = caches[process.platform];
  if (cache !== undefined && existsSync(join(cache, "ms-playwright"))) {
    env.PLAYWRIGHT_BROWSERS_PATH = join(cache, "ms-playwright");
  }
}

export type ControlKind = "button" | "select" | "input" | "textarea";

/** One control as the page shows it now. `id` is its position among the page's controls. */
export type Control = {
  id: number;
  kind: ControlKind;
  /** The accessible role it is found by: button, combobox, textbox, checkbox, ... */
  role: string;
  /** The text of its label (or a button's own text); empty when the control has none. */
  label: string;
  value: string;
  /** A select's options, in page order; empty for every other kind. */
  options: string[];
  enabled: boolean;
  /** The control's own markup, cut short: how an unlabeled control is named. */
  html: string;
};

export type PageRead = { text: string; controls: Control[] };

/** Every button, select, input and textarea on the page, read in the browser. */
function controlsInBrowser(): Control[] {
  const roleOf = (el: Element): string => {
    const explicit = el.getAttribute("role");
    if (explicit !== null) return explicit;
    if (el instanceof HTMLButtonElement) return "button";
    if (el instanceof HTMLSelectElement) return el.multiple || el.size > 1 ? "listbox" : "combobox";
    if (el instanceof HTMLTextAreaElement) return "textbox";
    if (el instanceof HTMLInputElement) {
      if (["button", "submit", "reset"].includes(el.type)) return "button";
      if (el.type === "checkbox" || el.type === "radio") return el.type;
      return "textbox";
    }
    return "generic";
  };
  /** The label's text without the text of the control it wraps. */
  const labelText = (label: HTMLLabelElement, el: Element): string => {
    const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
    let text = "";
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      if (!el.contains(node)) text += node.textContent ?? "";
    }
    return text;
  };
  const labelOf = (el: Element): string => {
    const aria = el.getAttribute("aria-label");
    if (aria !== null && aria.trim() !== "") return aria;
    if (el instanceof HTMLButtonElement) return el.textContent ?? "";
    if (el instanceof HTMLInputElement && ["button", "submit", "reset"].includes(el.type)) {
      return el.value;
    }
    const labelled = el as HTMLInputElement;
    return Array.from(labelled.labels ?? [])
      .map((label) => labelText(label, el))
      .join(" ");
  };
  return Array.from(document.querySelectorAll("button, select, input, textarea")).map((el, id) => {
    const field = el as HTMLInputElement;
    return {
      id,
      kind: el.tagName.toLowerCase() as ControlKind,
      role: roleOf(el),
      label: labelOf(el).replace(/\s+/g, " ").trim(),
      value: el instanceof HTMLButtonElement ? "" : (field.value ?? ""),
      options:
        el instanceof HTMLSelectElement ? Array.from(el.options).map((option) => option.value) : [],
      enabled: !field.disabled,
      html: el.outerHTML.slice(0, 120),
    };
  });
}

/** The page's accessible text and every control on it. */
export async function readPage(page: Page): Promise<PageRead> {
  const text = await page.locator("body").ariaSnapshot();
  const controls = await page.evaluate(controlsInBrowser);
  return { text, controls };
}

/** The controls with no label: a page that has any is refused, and none is ever a candidate. */
export function unlabeled(controls: Control[]): Control[] {
  return controls.filter((control) => control.label === "");
}

/** How a control is named when it has no label: its kind, position and markup. */
export function nameOf(control: Control): string {
  return control.label === ""
    ? `${control.kind} #${control.id} ${control.html}`
    : `${control.kind} "${control.label}"`;
}

/** The control as a person finds it: by its role and its label. */
export function locate(page: Page, control: Control): Locator {
  return page.getByRole(control.role as Parameters<Page["getByRole"]>[0], {
    name: control.label,
    exact: true,
  });
}

/**
 * Perform `action`, then wait until the page has had no request in flight for `quietMs`: the
 * action's fetches and the re-render they trigger have landed. Requests are counted from before
 * the action starts. Gives up waiting after `timeoutMs` and returns all the same.
 */
export async function settled(
  page: Page,
  action: () => Promise<void>,
  quietMs = 150,
  timeoutMs = 10_000,
): Promise<void> {
  let inFlight = 0;
  const started = () => {
    inFlight++;
  };
  const ended = () => {
    inFlight = Math.max(0, inFlight - 1);
  };
  page.on("request", started);
  page.on("requestfinished", ended);
  page.on("requestfailed", ended);
  try {
    await action();
    const deadline = Date.now() + timeoutMs;
    let quietSince = Date.now();
    while (Date.now() < deadline) {
      await Bun.sleep(25);
      if (inFlight > 0) quietSince = Date.now();
      else if (Date.now() - quietSince >= quietMs) return;
    }
  } finally {
    page.off("request", started);
    page.off("requestfinished", ended);
    page.off("requestfailed", ended);
  }
}
