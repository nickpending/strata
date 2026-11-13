# jev-state: does building Jev's state per TypeSafe's guidance recover design B's loss?

The commits came in this order, before anything that could bias them:
- **385736c:** `docs/jev.md` "Building state", on its own.
- **912e3f6:** the rule, the typed builder and its check, the contract, the runner, B and the briefs, before any label
  existed.
- **caf99b4:** the labels, the coin split (A is dev), the held-out hashes and B's dev run, before any challenger arm.
- **9dad02e:** the scorer, written by the sonnet scorer before any challenger arm.
- **5aaf9ae:** arms B, S and F frozen, with `check-arms.ts`, the dev results and the second labeller's hash, before
  any held-out run.

The scorer's output is `heldout-final.score.md` (finals) and `heldout-secondary.score.md` (finals plus contenders).
Its E1 and E3 for the three finals match an independent recomputation from the raw logs. Raw judgments stay local
under `corpus/runs/jev-state/`.

## Answer

**No. With B's questions held fixed, neither a structured state nor a filtered one moves the per-value reading, and
both tie B at the case level. B's state stays, by the pre-registered rule.**

| | E1 direction | E2 pairs | E3 pooled ρ | E4 build / detract | P1 gate AUC | P2 among fired | USD / judgment |
|---|---|---|---|---|---|---|---|
| B | 49/70 | 9/24 | 0.548 | 0.250 / 0.064 | 0.726 | 96/98 | 2.4e-4 |
| **S** `t5` | 52/70 | 13/24 | 0.526 | 0.284 / 0.022 | 0.722 | 87/91 | 2.6e-4 |
| **F** `g4-prose` | 53/70 | 12/24 | 0.597 | 0.248 / 0.191 | 0.686 | 76/77 | 4.0e-4 |
| second labeller | 64/70 | 24/24 | 0.940 | 0.770 / 0.831 | 0.890 | 195/200 | |

- **S against B:** the E3 difference is −0.022, interval [−0.110, 0.058], a **tie**. The P1 difference is −0.004,
  interval [−0.030, 0.023], also a **tie**.
- **F against B:** the E3 difference is +0.049, interval [−0.075, 0.181], a **tie**. The P1 difference is −0.040,
  interval [−0.089, 0.007], also a **tie**, leaning against F.
- **Described only:**
  - E1: S is right on 4 cases where B is wrong, and B on 1 where S is wrong (McNemar p 0.38). F against B is 6 to 2
    (p 0.29).
  - Neither challenger's E1 or E2 lead is significant.
- **Contenders** (3 reps, secondary):

  | | E3 | P1 |
  |---|---|---|
  | `s:t1`, a preamble that names the sub-fields | 0.530 | 0.727 |
  | `f:pv`, one typed stake state per value | 0.588 | 0.718 |

  Both sit inside the finals' range.
- **No arm K.** Adding the holder's known facts read below S on dev (E3 0.666 against 0.693; P1 0.741 against 0.744).
  The engine's known rows (who holds what, who is where) mostly repeat what `earlier` and `now` already say. So K was
  not frozen, and it isn't measured on held-out.
- **Dev went the same way.** No challenger beat B outside noise on dev (freeze addendum). Held out agrees.

## What moved and what didn't (post hoc, decides nothing)

- **The per-value reading barely changes with the state.** Gate AUC reads 0.726, 0.722 and 0.686, and per value the
  pattern is the same in every arm:
  - security, the most-touched value (68 items), reads 0.62 / 0.62 / 0.58, against the labellers' 0.80;
  - benevolence reads 0.55 / 0.55 / 0.51, against 0.83.

  The typed identity puts the threat in a field. Rogue's exposure sits under `your_safety`: "if Kestrel finds him
  here, they find you too". Glitch's hunters sit under `your_safety.hunted_by`. That is the documented miss, where
  Rogue's identity names the hunters but Jev reads her security as up. Yet security's gate didn't move. Whatever loses these items, it is not that the fact was buried in prose.
- **Filtering trades fires for misses, as gate-first's hard gate did.**
  - F fires on 77 touched items against B's 98, with direction right on 76 of 77.
  - Its gate oracle no longer helps: E3 0.594 against its own 0.597. B's gate oracle lifts it from 0.548 to 0.651.
  - So F has removed most of B's false fires, and what it loses now is touched items read as nothing. That is G's
    pattern in gate-first-e2e, and the case-level result is the same: a lead that doesn't clear the interval.
  - F's author saw the same on dev. B's false fires lean the way of the encounter's overall valence (a "halo"), so
    they help B's case score. Removing them costs F about what its cleaner gate gains.
- **Typed or prose made little difference, and F read typed stake lower.** S, typed throughout, ties B. F's author
  found that, with the same content, typed stake states read P1 0.03 to 0.07 lower than prose on dev, so F's final
  sends the identity's own sentences. The typed per-value contender `f:pv` read P1 0.718 on held-out. "Typed where
  the data is typed" has no measured support here.
- **Naming fields in the preamble made no difference.** S's final kept B's `READ` preamble unchanged. The contender
  that names `now.act`, `now.by` and the identity's topics (`t1`) reads E3 0.530 and P1 0.727, the same as S.
- **The combine is still not the bottleneck.** The same labels through the same combine ("labels only") read E3
  0.844. B's gate-and-direction oracle reads 0.736. The gate alone is the biggest single fix for B, +0.10 (0.548 to
  0.651), as in gate-first-e2e.
- **Squared weighting led linear on B's held-out for the third time.** B-sq reads E3 0.613 against B-lin's 0.548
  (+0.065). v4 measured +0.09, gate-first-e2e +0.06, and this run +0.065. F-sq reads 0.624 and S-sq 0.587. Squared
  has never been a pre-registered challenger here. Three held-out runs out of three is the strongest untested signal
  in this line, and it should get a pre-registered test of its own.

## Material

- **The two labellers.** A blind opus labeller wrote 120 engine-built cases on the real world: Rogue, Glitch and
  Mux, with fresh identities and three variants each.
  - Held out: 80 cases in 56 scenarios, 36 build, 34 detract and 10 neutral, with 229 touched items out of 1,600.
  - A second blind opus labeller relabelled all 80 held-out cases at both levels.
- **Ceiling.**
  - Case level: the second labeller's pooled ρ against the first is 0.94, and 0.77 and 0.83 within direction.
    They agree on direction for 64 of 70 cases.
  - Per value: gate AUC 0.89, direction among fired 98%. The second labeller marks more items touched (stake 144
    of 800, against the first's 115).
- **Consensus subset (74 cases).** E3: B 0.582, S 0.560, F 0.613. The order is unchanged.
- **Identity facts.** S's typed facts were written once per person from the identity text on dev, each pinned to
  that text's sha256 and checked by the orchestrator against its source sentence. F's final sends the sentences
  themselves, chosen by tags.

## Cost

| run | judgments | USD |
|---|---|---|
| B dev | 80 | 0.019 |
| S author's dev tuning | as logged | 0.207 |
| F author's dev tuning | as logged | 0.353 |
| held-out finals, B, S and F × 5 reps | 1,200 | 0.362 |
| held-out contenders, 2 × 3 reps | 480 | 0.242 |
| **total** | 0 refused | **1.183** |

- The ceiling named before spending was 2.48 USD. The brief's line was 3 USD.
- Agent work: two opus labellers, two opus authors and one sonnet scorer. The TypeSafe docs were read by five
  readers for `docs/jev.md`.

## Limits

- **Power.** 80 cases in 56 scenarios. The E3 intervals are ±0.08 to ±0.13, so a real gain of 0.05 can't show here.
  F's +0.049 may be one.
- **The questions were fixed on purpose.** This tests state with B's 40 one-sided statements as asked. The
  guidance also says each question should point at the fact it turns on. Doing that means changing the statements,
  which this experiment didn't allow.
- **Knowledge was tested only on dev,** and only as the engine holds it today: locations, holders and ties. A
  richer knowledge model (what the holder knows about the other's debts, threats or loyalties) doesn't exist in the
  engine yet.
- **Each arm had one author** with about 0.2 to 0.35 USD of tuning. Another author might find a better state, but
  both authors' best variants landed within the noise of B on dev.
- **One hand wrote the material.** Security carries about a third of all touched items.

## What this means for design B

1. **Keep B's state.** Building state per the docs (typed, filtered, field-named) doesn't measurably change Jev's
   per-value reading on these questions. The state isn't where the loss lives.
2. **The loss sits in the gate, on the same values every time.** Security and benevolence fire on untouched items,
   and miss touched ones, under every state tried. B's gate oracle is still the largest single lift.
3. **The next tests, in order of signal:**
   - Squared weighting as a pre-registered challenger. It has led three held-out runs out of three.
   - Rewriting the statements for the weak values so each points at the fact it turns on. That is the part of the
     guidance this run held fixed.
