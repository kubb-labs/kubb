# Kubb vs hey-api benchmark

Compares Kubb v5 against `@hey-api/openapi-ts`, both using their typescript + axios + zod
plugins, over the `twitter.json` and `openai.yaml` fixtures shared with `../v4-vs-v5`.

`petStore.yaml` is excluded: `@hey-api/openapi-ts@0.99.0` crashes on it ("Symbol finalName has
not been resolved yet"), bisected to the `tag.Tag` component name (a dot in the schema key).
Kubb generates that fixture fine.

## Setup

```bash
cd scripts/benchmark/kubb-vs-heyapi
(cd kubb && npm install)
(cd heyapi && npm install)
mkdir -p fixtures
cp ../v4-vs-v5/fixtures/twitter.json ../v4-vs-v5/fixtures/openai.yaml fixtures/
```

## Run

```bash
node run.mjs
```

Writes `results/results.json`. Each (tool, fixture) pair runs 3 times in an isolated
`node --expose-gc` process; the summary reports the median duration, delta/peak RSS, and the
generated file count and total byte size.
