# Kubb vs hey-api vs orval benchmark

Compares Kubb v4, Kubb v5, `@hey-api/openapi-ts`, and `orval`, all generating TypeScript types +
an axios client + Zod schemas, in each tool's default output mode, over three fixtures:

| Size   | Fixture         | Operations |
| ------ | --------------- | ---------- |
| small  | `small.yaml`    | 19         |
| medium | `twitter.json`  | 80         |
| big    | `openai.yaml`   | 281        |

`small.yaml` is the public [Swagger Petstore](https://github.com/swagger-api/swagger-petstore)
spec, used instead of kubb's own `petStore.yaml` fixture: `@hey-api/openapi-ts@0.99.0` crashes on
kubb's fixture ("Symbol finalName has not been resolved yet"), bisected to the `tag.Tag`
component name (a dot in the schema key). Kubb generates that fixture fine; this is a hey-api
limitation on that specific input, not a benchmark bug.

## Layout

```
kubb-vs-heyapi/
├── run.mjs             # orchestrator: spawns child processes, aggregates, writes results/results.json
├── results/
│   └── results.json    # output (regenerated on each run)
├── kubb-v4/             # isolated npm tree for Kubb v4 (own node_modules)
├── kubb-v5/             # isolated npm tree for Kubb v5 beta (own node_modules)
├── heyapi/              # isolated npm tree for @hey-api/openapi-ts
├── orval/               # isolated npm tree for orval
└── fixtures/             # gitignored; downloaded/copied at runtime
```

`kubb-v4` and `kubb-v5` reuse the published-package installs from `../v4-vs-v5/v4` and
`../v4-vs-v5/v5` via a `node_modules` symlink, so set those up first (see that folder's README).

## Setup

```bash
cd scripts/benchmark/kubb-vs-heyapi
(cd heyapi && npm install)
(cd orval && npm install)
ln -s ../../v4-vs-v5/v4/node_modules kubb-v4/node_modules
ln -s ../../v4-vs-v5/v5/node_modules kubb-v5/node_modules

mkdir -p fixtures
cp ../v4-vs-v5/fixtures/twitter.json ../v4-vs-v5/fixtures/openai.yaml fixtures/
curl -s https://raw.githubusercontent.com/swagger-api/swagger-petstore/master/src/main/resources/openapi.yaml -o fixtures/small.yaml
```

## Run

```bash
node run.mjs
```

Writes `results/results.json`, including a `machine` block (OS, CPU model/core count, total
memory, Node version) captured at run time. Each (tool, fixture) pair runs 3 times in an isolated
`node --expose-gc` process; the summary reports the median duration, delta/peak RSS, and the
generated file count and total byte size.

## What each tool generates

- **kubb-v4** — `@kubb/core@4.39.2`: `plugin-oas` + `plugin-ts` + `plugin-client` (axios, the
  default) + `plugin-zod`, file mode (kubb's default; no `mode: 'directory'` override).
- **kubb-v5** — `@kubb/core@5.0.0-beta.104` (plugins beta.103): `adapter-oas` + `plugin-ts` +
  `plugin-axios` + `plugin-zod`, file mode (kubb's default).
- **hey-api** — `@hey-api/openapi-ts@0.99.0`: `@hey-api/typescript` + `@hey-api/client-axios` +
  `@hey-api/sdk` + `zod` plugins in one `createClient()` call.
- **orval** — `orval@8.22.0`: two `generate()` calls into the same output tree, since orval has
  no single config that emits both an axios client and standalone Zod schemas (`client: 'zod'` is
  its own generation mode, distinct from `client: 'axios'`). This mirrors how a real project
  configures orval (two named workspaces in `orval.config.ts`).

## Kubb v5: file mode vs directory mode

`kubb-v5/run-one-directory.mjs` is a standalone variant of `kubb-v5/run-one.mjs`: same fixtures,
same plugins (`plugin-ts` + `plugin-axios` + `plugin-zod`), but `mode: 'directory'` on every
plugin's output instead of kubb's file-mode default. It exists to isolate the output-mode variable
from the `../v4-vs-v5` harness, which benchmarks directory mode plus `plugin-faker` and reports a
larger v4-vs-v5 speedup than this harness's file-mode, no-Faker numbers. Run it the same way:

```bash
node --expose-gc kubb-v5/run-one-directory.mjs small.yaml
```

It writes to `kubb-v5/.out-directory/` (gitignored) and prints the same JSON shape as the other
runners, with `tool: 'kubb-v5-directory'`.
