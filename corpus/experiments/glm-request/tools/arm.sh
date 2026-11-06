#!/bin/bash
# usage: arm.sh <arm dir name> <port> <model> <reps...>
cd "$(dirname "$0")/../../../.." || exit 1
E=corpus/experiments/glm-request
name=$1
port=$2
model=$3
shift 3
corpus=()
[[ -n ${CORPUS:-} ]] && corpus=(--corpus "$CORPUS")
for k in "$@"; do
	for s in calibration blind-1 blind-2-spent blind-2; do
		sweep=()
		[[ $s == calibration ]] && sweep=(--sweep)
		out=$E/$name/r$k/$s.score.out
		bun run score --goals "$E/$name/r$k/$s.json" "${sweep[@]}" --tick-minutes 10 --model "$model" --model-endpoint "http://127.0.0.1:$port/" "${corpus[@]}" >"$out" 2>&1
		rc=$?
		echo "$name r$k $s exit=$rc $(grep -o '"held": [0-9]*,' "$out" | head -1)"
	done
done
echo "$name DONE"
