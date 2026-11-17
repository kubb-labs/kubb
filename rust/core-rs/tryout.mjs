// Parity check and benchmark for the Rust core against the real Kubb plugins.
//
//   node tryout.mjs parity                      every spec: Rust output must equal TypeScript output, byte for byte
//   node tryout.mjs bench <spec> <mode> [fs|memory] [runs]
//   node tryout.mjs report                      full matrix, fresh process per cold run, writes results.json
//
// Needs kubb-labs/plugins checked out and built next to this repo (override with KUBB_PLUGINS_REPO).
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { loadSpec, useNativeOutput } from './index.mjs'

const pluginsRepo = path.resolve(process.env.KUBB_PLUGINS_REPO ?? path.join(import.meta.dirname, '../../../plugins'))
// One module graph for core and plugins, resolved from where the plugins are installed.
const require = createRequire(path.join(pluginsRepo, 'tests/performance/package.json'))
const { adapterOas } = require('@kubb/adapter-oas')
const { Hookable, createKubb, memoryStorage, fsStorage } = require('@kubb/core')
const { defineConfig } = require('kubb/config')
const { pluginAxios } = require('@kubb/plugin-axios')
const { pluginFaker } = require('@kubb/plugin-faker')
const { pluginTs } = require('@kubb/plugin-ts')
const { pluginZod } = require('@kubb/plugin-zod')

const SPECS = ['petStore.yaml', 'box.json', 'twitter.json', 'digitalocean.yaml', 'bunq.com.json']
const MODES = { ts: {}, 'rust-load': { load: true }, 'rust-output': { output: true }, rust: { load: true, output: true } }
const specPath = (spec) => path.join(pluginsRepo, 'schemas/3.0.x', spec)

async function build({ spec, mode, storage, outDir = '/virtual/gen' }) {
  const { load, output } = MODES[mode]
  const t = { start: performance.now() }
  const hooks = new Hookable()
  hooks.hook('kubb:build:start', () => (t.buildStart = performance.now()))
  hooks.hook('kubb:plugins:end', () => (t.pluginsEnd = performance.now()))
  hooks.hook('kubb:files:processing:start', () => (t.writeStart = performance.now()))
  hooks.hook('kubb:files:processing:end', () => (t.writeEnd = performance.now()))
  const config = defineConfig({
    root: path.dirname(outDir),
    storage,
    input: load ? loadSpec(specPath(spec)) : specPath(spec),
    adapter: adapterOas({ validate: false }),
    output: { path: outDir, clean: storage.name === 'fs' },
    plugins: [
      pluginTs({ output: { path: 'types', mode: 'directory', barrel: false }, enum: { type: 'asConst' } }),
      pluginAxios({ output: { path: 'clients', mode: 'directory' } }),
      pluginZod({ output: { path: 'zod', mode: 'directory' } }),
      pluginFaker({ output: { path: 'mocks', mode: 'directory' } }),
    ],
  })
  const kubb = createKubb(config, { hooks })
  await kubb.setup()
  if (output) useNativeOutput(kubb)
  const { files } = await kubb.build()
  t.end = performance.now()
  return { files: files.length, load: t.buildStart - t.start, generate: t.pluginsEnd - t.buildStart, output: t.end - t.pluginsEnd, write: t.writeEnd - t.writeStart, total: t.end - t.start }
}

async function snapshot(spec, mode) {
  const storage = memoryStorage()
  await build({ spec, mode, storage })
  const out = new Map()
  for (const key of await storage.readKeys()) out.set(key, await storage.readItem(key))
  return out
}

async function parity() {
  let failed = 0
  for (const spec of SPECS) {
    const [expected, actual] = [await snapshot(spec, 'ts'), await snapshot(spec, 'rust')]
    const diff = [...new Set([...expected.keys(), ...actual.keys()])].filter((key) => expected.get(key) !== actual.get(key))
    failed += diff.length
    console.log(`${diff.length ? 'FAIL' : 'ok  '} ${spec}: ${expected.size - diff.length}/${expected.size} files identical`)
    for (const key of diff.slice(0, 3)) console.log(`  differs: ${key}\n--- ts\n${expected.get(key)?.slice(0, 600)}\n--- rust\n${actual.get(key)?.slice(0, 600)}`)
  }
  process.exitCode = failed ? 1 : 0
}

const median = (values) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)]
const round = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === 'number' ? Math.round(value * 10) / 10 : value]))

async function bench(spec, mode, storageName = 'fs', runs = 1) {
  const outDir = path.join(os.tmpdir(), `kubb-tryout-${mode}-${process.pid}`, 'gen')
  const rows = []
  for (let i = 0; i < runs; i++) rows.push(await build({ spec, mode, storage: storageName === 'fs' ? fsStorage() : memoryStorage(), outDir }))
  // The first run is the cold one a CLI user gets; the median of the rest is steady state (watch mode, dev server).
  const warm = rows.slice(1)
  const pick = (key) => (warm.length ? median(warm.map((row) => row[key])) : rows[0][key])
  console.log(JSON.stringify(round({ spec, mode, storage: storageName, files: rows[0].files, cold: rows[0].total, coldLoad: rows[0].load, coldGenerate: rows[0].generate, coldOutput: rows[0].output, load: pick('load'), generate: pick('generate'), output: pick('output'), write: pick('write'), total: pick('total') })))
  fs.rmSync(path.dirname(outDir), { recursive: true, force: true })
}

function report() {
  const results = []
  for (const spec of SPECS) {
    for (const mode of Object.keys(MODES)) {
      const run = (runs) => {
        const started = performance.now()
        const row = JSON.parse(execFileSync(process.execPath, [import.meta.filename, 'bench', spec, mode, 'fs', String(runs)], { encoding: 'utf8' }).trim().split('\n').at(-1))
        return { ...row, wall: performance.now() - started }
      }
      const cold = Array.from({ length: 7 }, () => run(1))
      const warm = run(8)
      const row = round({ spec, mode, files: warm.files, processWall: median(cold.map((r) => r.wall)), cold: median(cold.map((r) => r.cold)), coldLoad: median(cold.map((r) => r.coldLoad)), coldGenerate: median(cold.map((r) => r.coldGenerate)), coldOutput: median(cold.map((r) => r.coldOutput)), warm: warm.total, warmLoad: warm.load, warmGenerate: warm.generate, warmOutput: warm.output })
      results.push(row)
      console.log(JSON.stringify(row))
    }
  }
  fs.writeFileSync(path.join(import.meta.dirname, 'results.json'), `${JSON.stringify({ node: process.version, cpus: os.cpus().length, cpu: os.cpus()[0].model, results }, null, 2)}\n`)
}

const [command, ...args] = process.argv.slice(2)
if (command === 'parity') await parity()
else if (command === 'bench') await bench(args[0], args[1], args[2], Number(args[3] ?? 1))
else if (command === 'report') report()
else console.log('usage: node tryout.mjs parity | bench <spec> <mode> [fs|memory] [runs] | report')
