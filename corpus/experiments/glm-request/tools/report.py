"""Render report.md for the glm-request experiment from its score files, run.json files and proxy logs.

usage: python3 -I tools/report.py   (from corpus/experiments/glm-request; writes report.md beside tools/)
Every number below is computed here from the committed data; the prose around it is the method.
"""
import json, os, sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
EXP = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from analyze import analyse_arm, SETS  # noqa: E402

ARMS = {
    "A": ("GLM", "json_object, no provider preferences (the #3 request)"),
    "B": ("GLM", "strict json_schema, require_parameters (the #7 request, json-schema-retry)"),
    "C": ("GLM", "strict flat json_schema: kind enum, other fields optional, no anyOf, no default, a description per field; require_parameters"),
    "D": ("GLM", "B with provider.ignore [open-inference, digitalocean]"),
    "E": ("GLM", "B with every name an enum of the vocabulary the prompt lists"),
    "F": ("GLM", "json_object, provider.order [z-ai], allow_fallbacks false"),
    "G": ("GLM", "B with provider.quantizations [fp8]"),
    "H": ("Haiku", "json_object, no provider preferences (control under F's request mode; the pin is GLM's)"),
}


def target_provider(calls, record):
    t0, t1 = record["startedAt"], record["endedAt"]
    tp = [c["provider"] for c in calls if c["purpose"] == "target" and t0 <= c["t0"] and c["t1"] <= t1]
    return tp[0] if tp else None


def per_goal_routes(arms):
    """For each GLM arm A-G: goal -> [(arm, target provider, held)]."""
    import glob
    table = defaultdict(list)
    for arm in arms:
        calls = [json.loads(l) for l in open(os.path.join(EXP, arm, "calls.jsonl"))]
        for f in sorted(glob.glob(os.path.join(EXP, arm, "r*", "*.score.json"))):
            score = json.load(open(f))
            for g in score["perGoal"]:
                run = os.path.normpath(os.path.join(os.path.dirname(f), g["run"]))
                record = json.load(open(os.path.join(run, "run.json")))
                table[f"{score['set']}/{g['id']}"].append((arm, target_provider(calls, record), g["held"]))
    return table


def main():
    eps = json.load(open(os.path.join(HERE, "endpoints.json")))["data"]["endpoints"]
    quant = defaultdict(set)
    for e in eps:
        quant[e["provider_name"]].add(e["quantization"])
    results = {a: analyse_arm(EXP, a) for a in ARMS}
    out = ["# glm-request: how GLM-5.3-flash is asked, and who serves it", ""]
    out += [
        "Rendered by tools/report.py from the score files, the run.json files they name and each arm's",
        "calls.jsonl, the proxy's log of every model call with the provider OpenRouter reported. The",
        "harness code was unchanged: each arm's runs posted their json-schema-retry request to a local proxy",
        "(tools/proxy.ts, --model-endpoint) that rewrote it into the arm's request and forwarded it. The retry",
        "on a parse refusal is the harness's own and is in every arm. Runs are joined to proxy calls by time",
        "window, and the joined count is checked against each run.json's model calls (below).",
        "Endpoint data: tools/endpoints.json, read 2026-11-02.",
        "",
        "## Arms",
        "",
        "| arm | model | request | reached per rep | reached | losses by kind | retries asked / rescued | costUsd |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for arm, (model, desc) in ARMS.items():
        r = results[arm]
        held = sum(v[0] for v in r["reached"].values())
        of = sum(v[1] for v in r["reached"].values())
        reps = " / ".join(f"{v[0]}" for v in r["reached"].values())
        kinds = ", ".join(f"{k} {n}" for k, n in sorted(r["lossKinds"].items())) or "none"
        out.append(
            f"| {arm} | {model} | {desc} | {reps} of 47 | {held} of {of} | {kinds} | "
            f"{r['retries'].get('asked', 0)} / {r['retries'].get('rescued', 0)} | {r['costUsd']:.4f} |"
        )
    total = sum(r["costUsd"] for r in results.values())
    mism = sum(len(r["joinMismatches"]) for r in results.values())
    runs = sum(v[1] for r in results.values() for v in r["reached"].values())
    out += ["", f"Total reported cost of the arms: {total:.4f} USD. Runs whose joined proxy calls did not match their run.json's model calls: {mism} of {runs}.", ""]
    out += [
        "Loss kinds: garble (junk tokens or non-Latin letters in the answer used); schema (the final answer",
        "failed zod at parse); name (the model named something off the page or a speech kind the bench does",
        "not serve, and checked() turned the target into no-such-action); reasoning (a wrong end state, a",
        "no-such-action where an end state was asked, or a plan where no-such-action was expected); plan (the",
        "end state right, the run did not reach it).",
        "",
        "## Routing is sticky per goal",
        "",
    ]
    routes = per_goal_routes([a for a in ARMS if ARMS[a][0] == "GLM" and a in "ABC"])
    distinct = Counter(len({p for _, p, _ in v}) for v in routes.values())
    out.append(
        "Over arms A, B and C (9 runs a goal), the number of distinct providers that served a goal's target: "
        + ", ".join(f"{n} provider(s): {c} goals" for n, c in sorted(distinct.items()))
        + ". A, B and C therefore compare request modes on the same providers, goal by goal."
    )
    out += ["", "Goals any of A, B or C lost, each run as arm:provider:held (+) or not (-):", ""]
    for goal, v in routes.items():
        if not all(h for *_, h in v):
            out.append(f"- {goal}: " + " ".join(f"{a}:{p}:{'+' if h else '-'}" for a, p, h in v))
    out += ["", "## Losses per provider (the provider that served the target call)", ""]
    out += ["| provider | quantization | arm | target calls | goals lost | loss kinds |", "|---|---|---|---|---|---|"]
    for arm in ARMS:
        calls = [json.loads(l) for l in open(os.path.join(EXP, arm, "calls.jsonl"))]
        served = Counter(c["provider"] for c in calls if c["purpose"] == "target")
        lost = defaultdict(Counter)
        for l in results[arm]["losses"]:
            lost[l["providers"][0] if l["providers"] else None][l["kind"]] += 1
        for p, n in served.most_common():
            k = lost.get(p, Counter())
            out.append(
                f"| {p} | {'/'.join(sorted(quant.get(p, {'?'})))} | {arm} | {n} | {sum(k.values())} | "
                + (", ".join(f"{kk} {vv}" for kk, vv in sorted(k.items())) or "none")
                + " |"
            )
    out += ["", "Target calls counts every attempt, a retry included; a run's loss is charged to its first target call's provider.", ""]
    out += ["## Reached per quantization (GLM arms)", "", "| arm | quantization | reached |", "|---|---|---|"]
    for arm in ARMS:
        if ARMS[arm][0] != "GLM":
            continue
        by = defaultdict(lambda: [0, 0])
        for goal, v in per_goal_routes([arm]).items():
            for _, p, h in v:
                q = "/".join(sorted(quant.get(p, {"none"}))) if p else "none"
                by[q][0] += h
                by[q][1] += 1
        for q, (h, n) in sorted(by.items()):
            out.append(f"| {arm} | {q} | {h} of {n} |")
    out += ["", "## Garble", ""]
    garble = [(arm, g) for arm in ARMS for g in results[arm]["garble"]]
    if not garble:
        out.append("None.")
    for arm, g in garble:
        out.append(f"- {arm} {g['rep']} {g['set']}/{g['goal']} {g['purpose']} on {g['provider']}: `{g['content']}`")
    out += ["", "## Every loss", ""]
    for arm in ARMS:
        for l in results[arm]["losses"]:
            out.append(
                f"- {arm} {l['rep']} {l['set']}/{l['goal']}: {l['kind']}, outcome {l['outcome']}, "
                f"providers {', '.join(str(p) for p in l['providers'])}, target `{json.dumps(l['target'], ensure_ascii=False)}`, run `{l['run']}`"
            )
    out.append("")
    with open(os.path.join(EXP, "report.md"), "w") as f:
        f.write("\n".join(out))
    json.dump(results, open(os.path.join(EXP, "analysis.json"), "w"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
