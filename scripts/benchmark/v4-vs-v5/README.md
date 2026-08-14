# v4 vs v5 benchmark

Generates the same code with Kubb v4 and the v5 beta and reports the difference in wall-clock
time and peak memory. The numbers in the [migration guide](https://kubb.dev/docs/5.x/migration#performance)
come from this harness.

## Running it

```bash
npm run setup
npm run bench
```

`setup` installs a pinned v4 and v5 into `v4/` and `v5/`, each with its own `node_modules` so the
two major versions can sit side by side. `bench` downloads the specs into `.specs/` on first run,
then walks the matrix in `cases.mjs`: three specs crossed with three plugin combinations, both
versions, five measured runs each after a discarded warmup. Results land in `results.json` and a
markdown table is printed for pasting into the docs.

```bash
node bench.mjs --spec openai        # one spec
node bench.mjs --set ts             # one plugin combination
node bench.mjs --runs 9             # more samples
node bench.mjs --v5-dir ./v5.local  # a v5 install of your own
```

## Benchmarking an unreleased v5

`--v5-dir` points the v5 side at any folder with `kubb` and the plugins installed, which is how
you measure a build newer than what npm serves. Pack the local workspaces and install the
tarballs:

```bash
mkdir -p /tmp/kubb-tarballs
for pkg in kubb cli core ast kit mcp adapter-oas parser-md parser-ts plugin-barrel renderer-jsx unplugin-kubb; do
  (cd ../../../packages/$pkg && pnpm pack --pack-destination /tmp/kubb-tarballs)
done
for pkg in plugin-ts plugin-axios plugin-zod plugin-faker; do
  (cd ../../../../plugins/packages/$pkg && pnpm pack --pack-destination /tmp/kubb-tarballs)
done

mkdir -p v5.local && cd v5.local
npm init -y && npm install /tmp/kubb-tarballs/*.tgz
```

`pnpm pack` resolves the `catalog:` and `workspace:` protocols the same way publishing does, so the
install matches what npm would serve. Building both repos first is required.

## What the harness controls for

Both sides run with `clean: true` and with formatting, linting, and barrel files off, so the
measurement covers generation rather than Prettier or a barrel walk. Every plugin gets its output
path and mode written out rather than relying on defaults, since the two versions resolve defaults
differently. v4's `pluginOas` writes JSON schemas alongside the generated code, which v5 has no
equivalent for, so that output is disabled.

`plugin-axios` is the v5 name. On the v4 side the same work is done by `@kubb/plugin-client` with
`client: 'axios'`, which is where the Axios client lived before the client plugins were split per
transport.

The file count for each run is recorded and compared. v5 emits its client and serializer runtime
into `gen/.kubb/`, where v4 imports the equivalent from `node_modules`, so v5 writes two to three
more files per run.

Timings are full CLI invocations: process start, config transpile, module loading, and generation.
That is what a user waits for, and module loading is part of what changed between the two versions.

## Reading the results

Absolute milliseconds and megabytes track the machine they were measured on. The speedup
percentages are the portable part. Memory is peak resident set size for the whole Node process,
read from `VmHWM` in procfs, so it includes the runtime baseline and not just the heap.
