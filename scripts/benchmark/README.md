# Benchmark

The numbers on the [comparison page](../../docs/5.x/explanation/comparison.md) come from this
folder. It times Kubb, HeyAPI, orval, and openapi-typescript on four specs and records peak memory
and install size.

## Run it

You need Node 22, Python 3, and `curl` on Linux or macOS.

```bash
./scripts/benchmark/bench.sh
```

The script downloads the specs and runs `npm install` in each tool folder. It then runs every
tool 5 times per spec and mode, one run at a time, and prints the medians. The full run takes
about 20 minutes on 4 cores.

Paste the medians into the `results` default of `ToolBenchmark.vue` in
[kubb-labs/platform](https://github.com/kubb-labs/platform), and update the run note on the
comparison page.

## What it measures

| Folder       | Full build                             | Types only            |
| ------------ | -------------------------------------- | --------------------- |
| `kubb-full`  | `pluginTs`, `pluginZod`, `pluginFetch` |                       |
| `kubb-types` |                                        | `pluginTs`            |
| `heyapi`     | types, Zod, fetch client, SDK          | `@hey-api/typescript` |
| `orval`      | fetch client in split mode, Zod        | models only           |
| `oats`       |                                        | `openapi-typescript`  |

- Time is wall-clock time for the CLI process.
- Memory is the peak resident set size, read with `wait4` in `run.py`.
- Install size is the size of `node_modules` after `npm install` in that folder.

orval has no types-only mode. An output with `schemas` and no `target` writes models only, which
is the closest match.

HeyAPI and openapi-typescript need the TypeScript JS API, which TypeScript 7 no longer ships, so
their folders pin TypeScript 6 and 5.9.
