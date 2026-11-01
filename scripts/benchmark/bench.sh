#!/usr/bin/env bash
# Runs every tool 5 times per spec and mode, one run at a time, and writes results.tsv.
set -euo pipefail
cd "$(dirname "$0")"
SCHEMAS=https://raw.githubusercontent.com/kubb-labs/plugins/main/schemas/3.0.x

mkdir -p specs
for spec in petStore.yaml twitter.json bunq.com.json; do
  [ -f specs/$spec ] || curl -sSfL -o specs/$spec $SCHEMAS/$spec
done
[ -f specs/cloudflare.json ] || curl -sSfL -o specs/cloudflare.json https://raw.githubusercontent.com/cloudflare/api-schemas/main/openapi.json

for dir in kubb-full kubb-types heyapi orval oats; do
  [ -d $dir/node_modules ] || (cd $dir && npm install --no-audit --no-fund)
  echo "install $dir $(du -sb $dir/node_modules | awk '{printf "%.1f MB", $1 / 1e6}')"
done

: > results.tsv
for spec in petStore.yaml twitter.json bunq.com.json cloudflare.json; do
  export SPEC=$PWD/specs/$spec
  for mode in full types; do
    export MODE=$mode
    for tool in kubb heyapi orval oats; do
      # openapi-typescript writes types only
      [ $tool = oats ] && [ $mode = full ] && continue
      for _ in 1 2 3 4 5; do
        case $tool in
          kubb) r=$(python3 run.py kubb-$mode node_modules/.bin/kubb generate) ;;
          heyapi) r=$(python3 run.py heyapi node_modules/.bin/openapi-ts -f openapi-ts.config.mjs) ;;
          orval) rm -rf orval/gen && r=$(python3 run.py orval node_modules/.bin/orval --config orval.config.mjs) ;;
          oats) r=$(python3 run.py oats node_modules/.bin/openapi-typescript "$SPEC" -o gen/schema.ts) ;;
        esac
        printf '%s\t%s\t%s\t%s\n' $mode $spec $tool "$r" | tee -a results.tsv
      done
    done
  done
done

python3 median.py results.tsv
