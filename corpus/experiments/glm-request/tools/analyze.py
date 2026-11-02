"""Analyse the glm-request experiment: per arm reached and spread, losses by kind, garble per provider.

usage: python3 analyze.py <experiment dir> <arm>... > out.json
Each arm dir holds r<k>/<set>.*.score.json and calls.jsonl (the proxy's log); runs are joined to
the proxy's calls by time window, and the count of joined calls is checked against run.json's.
"""
import glob, json, os, re, sys, unicodedata
from collections import Counter, defaultdict

SETS = ["calibration", "blind-1", "blind-2-spent", "blind-2"]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))


def garbled(text):
    """Junk tokens or letters from a non-Latin script in an English answer's free text."""
    if text is None:
        return False
    if "<unused" in text:
        return True
    for ch in text:
        if ch.isalpha():
            try:
                if not unicodedata.name(ch).startswith("LATIN"):
                    return True
            except ValueError:
                return True
    return False


def free_text(content):
    """The answer's free text: reason or words, or the whole content when it does not parse."""
    try:
        v = json.loads(content)
    except Exception:
        return content
    if isinstance(v, dict):
        return " ".join(str(v.get(k, "")) for k in ("reason", "words"))
    return content


def load_calls(arm_dir):
    out = []
    path = os.path.join(arm_dir, "calls.jsonl")
    for line in open(path):
        out.append(json.loads(line))
    return out


def classify(goal, record, calls):
    """Kind of a loss: garble, schema, reasoning, plan, provider (no answer)."""
    exp = goal["expect"]
    target = record.get("target")
    stopped = record.get("stopped") or {}
    if any(garbled(free_text(c["content"])) for c in calls if c["content"]):
        # garble only counts as the loss's kind if the final answer used was garbled
        final_target = [c for c in calls if c["purpose"] == "target"]
        final_words = [c for c in calls if c["purpose"] == "words"]
        last = (final_words or final_target)[-1:]
        if target is None or (target.get("kind") == "no-such-action" and garbled(target.get("reason"))):
            return "garble"
        if final_words and garbled(free_text(final_words[-1]["content"])):
            return "garble"
    if target is None:
        if stopped.get("kind") == "parse":
            return "schema"
        return "provider"
    if stopped.get("call") == "words" and stopped.get("kind") == "parse":
        return "schema"
    if "outcome" in exp:
        return "reasoning"  # expected no-such-action, model planned a goal
    if target.get("kind") == "no-such-action" and re.match(
        r"(the bench serves|the page shows) no ", target.get("reason") or ""
    ):
        return "name"  # a name off the page or the served speech kinds; checked() refused it
    if target.get("kind") == "no-such-action":
        return "reasoning"
    if target.get("expect") != exp:
        return "reasoning"
    return "plan"


def analyse_arm(exp_dir, arm):
    arm_dir = os.path.join(exp_dir, arm)
    calls = load_calls(arm_dir)
    reps = sorted(d for d in os.listdir(arm_dir) if re.fullmatch(r"r\d+", d))
    rep_reached = {}
    losses = []
    served = Counter()
    garble_calls = Counter()
    garble_list = []
    refused_first = 0
    retries = Counter()
    cost = 0.0
    joined_mismatch = []
    per_goal = defaultdict(lambda: [0, 0])
    for rep in reps:
        held = of = 0
        for s in SETS:
            files = glob.glob(os.path.join(arm_dir, rep, f"{s}.*.score.json"))
            if not files:
                continue
            score = json.load(open(files[0]))
            cost += score["costUsd"]
            retries["asked"] += score["retries"]["asked"]
            retries["rescued"] += score["retries"]["rescued"]
            for g in score["perGoal"]:
                of += 1
                held += g["held"]
                per_goal[f"{s}/{g['id']}"][0] += g["held"]
                per_goal[f"{s}/{g['id']}"][1] += 1
                run_dir = os.path.normpath(os.path.join(os.path.dirname(files[0]), g["run"]))
                record = json.load(open(os.path.join(run_dir, "run.json")))
                t0, t1 = record["startedAt"], record["endedAt"]
                mine = [c for c in calls if t0 <= c["t0"] and c["t1"] <= t1]
                model_calls = [c for c in record["calls"] if c["client"] == "model"]
                if len(mine) != len(model_calls):
                    joined_mismatch.append((rep, s, g["id"], len(mine), len(model_calls)))
                for c in mine:
                    served[c["provider"]] += 1
                    if c["content"] and garbled(free_text(c["content"])):
                        garble_calls[c["provider"]] += 1
                        garble_list.append({"rep": rep, "set": s, "goal": g["id"], "purpose": c["purpose"],
                                            "provider": c["provider"], "content": c["content"][:300]})
                refused_first += sum(1 for c in model_calls if c.get("refused") and not c.get("retry"))
                if not g["held"]:
                    kind = classify(g, record, mine)
                    losses.append({"rep": rep, "set": s, "goal": g["id"], "kind": kind,
                                   "outcome": g["outcome"],
                                   "providers": [c["provider"] for c in mine],
                                   "target": record.get("target"),
                                   "run": os.path.relpath(run_dir, ROOT)})
        rep_reached[rep] = [held, of]
    return {
        "arm": arm,
        "reached": rep_reached,
        "lossKinds": dict(Counter(l["kind"] for l in losses)),
        "losses": losses,
        "servedByProvider": dict(served.most_common()),
        "garbleByProvider": dict(garble_calls.most_common()),
        "garble": garble_list,
        "firstAttemptRefusals": refused_first,
        "retries": dict(retries),
        "costUsd": cost,
        "joinMismatches": joined_mismatch,
        "lostGoals": {k: v for k, v in per_goal.items() if v[0] < v[1]},
    }


if __name__ == "__main__":
    exp_dir, arms = sys.argv[1], sys.argv[2:]
    print(json.dumps([analyse_arm(exp_dir, a) for a in arms], indent=1, ensure_ascii=False))
