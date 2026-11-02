#!/bin/zsh
# usage: arm.sh <arm dir name> <port> <model> <reps...>
cd /Users/rudy/development/projects/strata
E=corpus/experiments/glm-request
name=$1; port=$2; model=$3; shift 3
corpus=${CORPUS:+--corpus $CORPUS}
for k in "$@"; do
  for s in calibration blind-1 blind-2-spent blind-2; do
    sweep=""; [[ $s == calibration ]] && sweep="--sweep"
    bun run score --goals $E/$name/r$k/$s.json $sweep --tick-minutes 10 --model $model --model-endpoint http://127.0.0.1:$port/ ${=corpus} > $E/$name/r$k/$s.score.out 2>&1
    echo "$name r$k $s exit=$? $(grep -o '"held": [0-9]*,' $E/$name/r$k/$s.score.out | head -1)"
  done
done
echo "$name DONE"
