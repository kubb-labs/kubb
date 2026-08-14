#!/usr/bin/env node
/**
 * Runs the same generation work through Kubb v4 and the v5 beta and reports the gap.
 *
 * Each case is a spec crossed with a plugin combination. Both versions write to a fresh
 * directory with formatting, linting, and barrel files disabled, so what is left is the
 * generation pipeline itself.
 *
 * Usage:
 *   node bench.mjs                    # every case, 3 runs each
 *   node bench.mjs --runs 5           # more samples
 *   node bench.mjs --spec openai      # one spec
 *   node bench.mjs --v5-dir ./v5.local  # benchmark another v5 install
 *
 * `--v5-dir` points the v5 side at any folder holding an installed `kubb` and plugin
 * set. Use it to measure a build that is newer than what npm serves.
 */

import { spawn } from 'node:child_process'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createWriteStream, existsSync } from 'node:fs'
import { cpus, totalmem } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { pluginSets, specs, v4Config, v5Config } from './cases.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const specsDir = join(root, '.specs')
const resultsFile = join(root, 'results.json')

function buildVersions({ v5Dir }) {
  return {
    v4: {
      label: 'v4',
      dir: join(root, 'v4'),
      bin: join(root, 'v4/node_modules/@kubb/cli/bin/kubb.cjs'),
      config: v4Config,
    },
    v5: {
      label: 'v5',
      dir: v5Dir,
      bin: join(v5Dir, 'node_modules/@kubb/cli/bin/kubb.js'),
      config: v5Config,
    },
  }
}

function parseArgs(argv) {
  const args = { runs: 5, spec: undefined, set: undefined, v5Dir: join(root, 'v5') }

  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index]
    if (flag === '--runs') args.runs = Number(argv[++index])
    if (flag === '--spec') args.spec = argv[++index]
    if (flag === '--set') args.set = argv[++index]
    if (flag === '--v5-dir') args.v5Dir = resolve(root, argv[++index])
  }

  return args
}

async function downloadSpecs() {
  await mkdir(specsDir, { recursive: true })

  for (const spec of specs) {
    const target = join(specsDir, spec.file)
    if (existsSync(target)) continue

    const downloaded = join(specsDir, spec.download ?? spec.file)
    if (!existsSync(downloaded)) {
      process.stdout.write(`downloading ${spec.download ?? spec.file}\n`)
      const response = await fetch(spec.url)
      if (!response.ok) throw new Error(`${spec.url} responded ${response.status}`)

      await pipeline(Readable.fromWeb(response.body), createWriteStream(downloaded))
    }

    if (spec.toJson) {
      process.stdout.write(`converting ${spec.download} to ${spec.file}\n`)
      const { parse } = await import('yaml')
      await writeFile(target, JSON.stringify(parse(await readFile(downloaded, 'utf8'))))
    }
  }
}

/**
 * Peak resident memory comes from `VmHWM` in procfs, a high-water mark the kernel keeps
 * for the life of the process. Polling picks up the final value as long as the process
 * lives long enough to be sampled once.
 */
async function readPeakMemory(pid) {
  try {
    const status = await readFile(`/proc/${pid}/status`, 'utf8')
    const match = status.match(/VmHWM:\s+(\d+) kB/)
    return match ? Number(match[1]) * 1024 : 0
  } catch {
    return 0
  }
}

async function runOnce({ bin, cwd, configPath }) {
  const started = process.hrtime.bigint()
  const child = spawn(process.execPath, [bin, 'generate', '--config', configPath], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, KUBB_DISABLE_TELEMETRY: '1', CI: '1' },
  })

  let peakMemory = 0
  const poll = setInterval(async () => {
    peakMemory = Math.max(peakMemory, await readPeakMemory(child.pid))
  }, 25)

  let output = ''
  child.stdout.on('data', (chunk) => {
    output += chunk
  })
  child.stderr.on('data', (chunk) => {
    output += chunk
  })

  const code = await new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('close', resolve)
  })

  clearInterval(poll)
  const duration = Number(process.hrtime.bigint() - started) / 1e6

  if (code !== 0) throw new Error(`kubb exited with ${code}\n${output.slice(-4000)}`)

  // Both CLIs report failed plugins without a non-zero exit code.
  if (/\bfailed\b/i.test(output)) throw new Error(`kubb reported a failure\n${output.slice(-4000)}`)

  return { duration, peakMemory }
}

async function countFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => [])
  return entries.filter((entry) => entry.isFile()).length
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

async function benchmark({ version, spec, pluginSet, runs }) {
  const workspace = join(version.dir, '.bench', `${spec.id}-${pluginSet.id}`)
  await rm(workspace, { recursive: true, force: true })
  await mkdir(workspace, { recursive: true })

  const configPath = join(workspace, 'kubb.config.ts')
  await writeFile(
    configPath,
    version.config({
      input: join(specsDir, spec.file),
      output: join(workspace, 'gen'),
      plugins: pluginSet.plugins,
    }),
  )

  // The first run pays for the config transpile cache and cold page cache on both sides.
  await runOnce({ bin: version.bin, cwd: workspace, configPath })
  const files = await countFiles(join(workspace, 'gen'))

  const samples = []
  for (let run = 0; run < runs; run++) {
    samples.push(await runOnce({ bin: version.bin, cwd: workspace, configPath }))
  }

  await rm(workspace, { recursive: true, force: true })

  return {
    duration: median(samples.map((sample) => sample.duration)),
    peakMemory: median(samples.map((sample) => sample.peakMemory)),
    files,
    samples,
  }
}

function speedup({ baseline, current }) {
  return Math.round((baseline / current - 1) * 100)
}

function factor({ baseline, current }) {
  return baseline / current
}

function ms(value) {
  return `${Math.round(value).toLocaleString('en-US')} ms`
}

function mb(value) {
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function percent(value) {
  return value >= 0 ? `**+${value}%**` : `${value}%`
}

function toMarkdown(results) {
  const lines = []

  for (const spec of results.specs) {
    lines.push('')
    lines.push(`**\`${spec.label}\`**, ${spec.operations} operations`)
    lines.push('')
    lines.push('| Plugins | v4 time | v5 time | Speedup | v4 memory | v5 memory | Memory |')
    lines.push('| --- | --- | --- | --- | --- | --- | --- |')

    for (const row of spec.rows) {
      const time = speedup({ baseline: row.v4.duration, current: row.v5.duration })
      const memory = speedup({ baseline: row.v4.peakMemory, current: row.v5.peakMemory })
      lines.push(`| ${row.label} | ${ms(row.v4.duration)} | ${ms(row.v5.duration)} | ${percent(time)} | ${mb(row.v4.peakMemory)} | ${mb(row.v5.peakMemory)} | ${percent(memory)} |`)
    }
  }

  return lines.join('\n')
}

/** Reads what is actually installed, which is what the results should be labeled with. */
async function installedVersions(dir) {
  const names = ['kubb', '@kubb/core', '@kubb/cli', '@kubb/adapter-oas', '@kubb/plugin-oas', '@kubb/plugin-ts', '@kubb/plugin-axios', '@kubb/plugin-client', '@kubb/plugin-zod', '@kubb/plugin-faker']
  const entries = await Promise.all(
    names.map(async (name) => {
      const manifest = await readFile(join(dir, 'node_modules', name, 'package.json'), 'utf8').catch(() => undefined)
      return manifest ? [name, JSON.parse(manifest).version] : undefined
    }),
  )

  return Object.fromEntries(entries.filter(Boolean))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const versions = buildVersions({ v5Dir: args.v5Dir })
  await downloadSpecs()

  const selectedSpecs = specs.filter((spec) => !args.spec || spec.id === args.spec)
  const selectedSets = pluginSets.filter((pluginSet) => !args.set || pluginSet.id === args.set)

  const results = {
    ranAt: new Date().toISOString(),
    runs: args.runs,
    machine: {
      os: `${process.platform} ${process.report?.getReport().header.osRelease ?? ''}`.trim(),
      cpu: cpus()[0]?.model,
      cores: cpus().length,
      memory: `${(totalmem() / 1024 ** 3).toFixed(1)} GB`,
      node: process.version,
    },
    versions: {},
    specs: [],
  }

  for (const [key, version] of Object.entries(versions)) {
    results.versions[key] = await installedVersions(version.dir)
  }

  for (const spec of selectedSpecs) {
    const entry = { id: spec.id, label: spec.label, operations: spec.operations, rows: [] }

    for (const pluginSet of selectedSets) {
      const row = { id: pluginSet.id, label: pluginSet.label }

      for (const [key, version] of Object.entries(versions)) {
        process.stdout.write(`${spec.id} · ${pluginSet.id} · ${key} ... `)
        row[key] = await benchmark({ version, spec, pluginSet, runs: args.runs })
        process.stdout.write(`${ms(row[key].duration)}, ${mb(row[key].peakMemory)}, ${row[key].files} files\n`)
      }

      if (row.v4.files !== row.v5.files) {
        process.stdout.write(`  ! file counts differ: v4 ${row.v4.files}, v5 ${row.v5.files}\n`)
      }

      row.speedup = speedup({ baseline: row.v4.duration, current: row.v5.duration })
      row.factor = Number(factor({ baseline: row.v4.duration, current: row.v5.duration }).toFixed(2))
      entry.rows.push(row)
    }

    results.specs.push(entry)
  }

  await writeFile(resultsFile, `${JSON.stringify(results, null, 2)}\n`)
  process.stdout.write(`\n${toMarkdown(results)}\n`)
  process.stdout.write(`\nWrote ${resultsFile}\n`)
}

await main()
