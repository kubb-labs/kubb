// Runs the real plugins on a lazy buffer-backed AST and compares against plain objects.
//
//   node tryout.mjs parity [view|eager]   every spec: output must equal the plain build, byte for byte
//   node tryout.mjs bench <spec> <mode>    mode: plain | view | eager; prints one JSON row (cold run + median of 7 warm runs)
//   node tryout.mjs report                 every spec and mode in a fresh process, writes results.json
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { byteSize, decode, encode, view } from './view.mjs'

const pluginsRepo = path.resolve(process.env.KUBB_PLUGINS_REPO ?? path.join(import.meta.dirname, '../../../plugins'))
const require = createRequire(path.join(pluginsRepo, 'tests/performance/package.json'))
const { adapterOas } = require('@kubb/adapter-oas')
const { Hookable, createKubb, memoryStorage } = require('@kubb/core')
const { defineConfig } = require('kubb/config')
const { pluginAxios } = require('@kubb/plugin-axios')
const { pluginFaker } = require('@kubb/plugin-faker')
const { pluginTs } = require('@kubb/plugin-ts')
const { pluginZod } = require('@kubb/plugin-zod')

const SPECS = ['petStore.yaml', 'box.json', 'twitter.json', 'digitalocean.yaml', 'bunq.com.json']
const specPath = (spec) => path.join(pluginsRepo, 'schemas/3.0.x', spec)

/** The adapter with its `parse` result swapped for a view over the encoded AST. */
function viewAdapter(t, mode) {
  const adapter = adapterOas({ validate: false })
  const parse = adapter.parse.bind(adapter)
  adapter.parse = async (...args) => {
    const started = performance.now()
    const node = await parse(...args)
    t.parse = performance.now() - started
    const encodeStart = performance.now()
    const encoded = encode(node)
    t.encode = performance.now() - encodeStart
    t.bytes = byteSize(encoded)
    const viewStart = performance.now()
    const root = (mode === 'eager' ? decode : view)(encoded)
    t.view = performance.now() - viewStart
    return root
  }
  return adapter
}

function plainAdapter(t) {
  const adapter = adapterOas({ validate: false })
  const parse = adapter.parse.bind(adapter)
  adapter.parse = async (...args) => {
    const started = performance.now()
    const node = await parse(...args)
    t.parse = performance.now() - started
    return node
  }
  return adapter
}

async function build(spec, mode, storage = memoryStorage()) {
  const t = {}
  const hooks = new Hookable()
  hooks.hook('kubb:build:start', () => (t.buildStart = performance.now()))
  hooks.hook('kubb:plugins:end', () => (t.pluginsEnd = performance.now()))
  const config = defineConfig({
    root: '/virtual',
    storage,
    input: specPath(spec),
    adapter: mode === 'plain' ? plainAdapter(t) : viewAdapter(t, mode),
    output: { path: '/virtual/gen', clean: false },
    plugins: [
      pluginTs({ output: { path: 'types', mode: 'directory', barrel: false }, enum: { type: 'asConst' } }),
      pluginAxios({ output: { path: 'clients', mode: 'directory' } }),
      pluginZod({ output: { path: 'zod', mode: 'directory' } }),
      pluginFaker({ output: { path: 'mocks', mode: 'directory' } }),
    ],
  })
  const kubb = createKubb(config, { hooks })
  await kubb.setup()
  const { files } = await kubb.build()
  const end = performance.now()
  return { files: files.length, parse: t.parse, encode: t.encode ?? 0, view: t.view ?? 0, bytes: t.bytes ?? 0, generate: t.pluginsEnd - t.buildStart, output: end - t.pluginsEnd }
}

async function snapshot(spec, mode) {
  const storage = memoryStorage()
  await build(spec, mode, storage)
  const out = new Map()
  for (const key of await storage.readKeys()) out.set(key, await storage.readItem(key))
  return out
}

async function parity() {
  let failed = 0
  for (const spec of SPECS) {
    const [expected, actual] = [await snapshot(spec, 'plain'), await snapshot(spec, process.argv[3] ?? 'view')]
    const diff = [...new Set([...expected.keys(), ...actual.keys()])].filter((key) => expected.get(key) !== actual.get(key))
    failed += diff.length
    console.log(`${diff.length ? 'FAIL' : 'ok  '} ${spec}: ${expected.size - diff.length}/${expected.size} files identical`)
    for (const key of diff.slice(0, 2)) console.log(`  differs: ${key}\n--- plain\n${expected.get(key)?.slice(0, 400)}\n--- view\n${actual.get(key)?.slice(0, 400)}`)
  }
  process.exitCode = failed ? 1 : 0
}

const median = (values) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)]
const round = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === 'number' ? Math.round(v * 10) / 10 : v]))

async function bench(spec, mode) {
  const rows = []
  for (let i = 0; i < 8; i++) rows.push(await build(spec, mode))
  const warm = rows.slice(1)
  const pick = (key) => median(warm.map((row) => row[key]))
  const cold = rows[0]
  console.log(JSON.stringify(round({ spec, mode, files: cold.files, kb: cold.bytes / 1024, coldParse: cold.parse, coldEncode: cold.encode, coldGenerate: cold.generate, coldOutput: cold.output, parse: pick('parse'), encode: pick('encode'), view: pick('view'), generate: pick('generate'), output: pick('output') })))
}

function report() {
  const results = []
  for (const spec of SPECS) {
    for (const mode of ['plain', 'view', 'eager']) {
      const row = JSON.parse(execFileSync(process.execPath, [import.meta.filename, 'bench', spec, mode], { encoding: 'utf8' }).trim().split('\n').at(-1))
      results.push(row)
      console.log(JSON.stringify(row))
    }
  }
  fs.writeFileSync(path.join(import.meta.dirname, 'results.json'), `${JSON.stringify({ node: process.version, cpus: os.cpus().length, cpu: os.cpus()[0].model, results }, null, 2)}\n`)
}

const [command, ...args] = process.argv.slice(2)
if (command === 'parity') await parity()
else if (command === 'bench') await bench(args[0], args[1])
else if (command === 'report') report()
else console.log('usage: node tryout.mjs parity | bench <spec> <plain|view|eager> | report')
