// Orchestrates the v4-vs-v5 benchmark matrix: for each (version, fixture, combo), spawns an
// isolated `node --expose-gc` child process (v4/run-one.mjs or v5/run-one.mjs) N times and
// records the raw results. Isolated processes avoid cross-run V8 JIT/heap-shape contamination
// between the two package trees, which live side by side in v4/node_modules and v5/node_modules.
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FIXTURES = ['petStore.yaml', 'twitter.json', 'openai.yaml']
const COMBOS = ['ts', 'ts-client', 'full']
const VERSIONS = ['v4', 'v5']
const ITERATIONS = 3

function runOnce(version, fixture, combo) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, version, 'run-one.mjs')
    const child = spawn(process.execPath, ['--expose-gc', scriptPath, fixture, combo], {
      cwd: path.join(__dirname, version),
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => {
      stdout += d
    })
    child.stderr.on('data', (d) => {
      stderr += d
    })

    child.on('close', (code) => {
      if (code !== 0) {
        resolve({ version, fixture, combo, success: false, error: `exit code ${code}: ${stderr.slice(0, 2000)}` })
        return
      }
      try {
        resolve(JSON.parse(stdout))
      } catch (parseError) {
        resolve({ version, fixture, combo, success: false, error: `JSON parse failure: ${parseError.message}. stdout: ${stdout.slice(0, 500)} stderr: ${stderr.slice(0, 500)}` })
      }
    })
  })
}

function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

const allRuns = []
const summary = []

const totalCombos = VERSIONS.length * FIXTURES.length * COMBOS.length
let done = 0
const overallStart = performance.now()

for (const fixture of FIXTURES) {
  for (const combo of COMBOS) {
    for (const version of VERSIONS) {
      const runs = []
      for (let i = 0; i < ITERATIONS; i++) {
        const result = await runOnce(version, fixture, combo)
        runs.push(result)
        allRuns.push({ iteration: i + 1, ...result })
      }
      done++
      const okRuns = runs.filter((r) => r.success)
      const durations = okRuns.map((r) => r.durationMs)
      const peakRss = okRuns.map((r) => r.memory?.peakRssMb).filter((v) => typeof v === 'number')
      const deltaRss = okRuns.map((r) => r.memory?.deltaRssMb).filter((v) => typeof v === 'number')

      const summaryEntry = {
        version,
        fixture,
        combo,
        iterations: ITERATIONS,
        successfulRuns: okRuns.length,
        filesGenerated: okRuns[0]?.filesGenerated ?? null,
        medianDurationMs: durations.length ? median(durations) : null,
        minDurationMs: durations.length ? Math.min(...durations) : null,
        maxDurationMs: durations.length ? Math.max(...durations) : null,
        medianPeakRssMb: peakRss.length ? median(peakRss) : null,
        medianDeltaRssMb: deltaRss.length ? median(deltaRss) : null,
        errors: runs.filter((r) => !r.success).map((r) => r.error),
      }
      summary.push(summaryEntry)

      console.error(
        `[${done}/${totalCombos}] ${version} ${fixture} ${combo}: median=${summaryEntry.medianDurationMs?.toFixed(1)}ms files=${summaryEntry.filesGenerated} peakRss=${summaryEntry.medianPeakRssMb?.toFixed(1)}MB ok=${okRuns.length}/${ITERATIONS}`,
      )
    }
  }
}

const overallEnd = performance.now()

const kubbVersions = {
  v4: {
    '@kubb/core': '4.39.2',
    '@kubb/plugin-oas': '4.39.2',
    '@kubb/plugin-ts': '4.39.2',
    '@kubb/plugin-client': '4.39.2',
    '@kubb/plugin-zod': '4.39.2',
    '@kubb/plugin-faker': '4.39.2',
  },
  v5: {
    '@kubb/core': '5.0.0-beta.104',
    '@kubb/adapter-oas': '5.0.0-beta.104',
    '@kubb/plugin-ts': '5.0.0-beta.103',
    '@kubb/plugin-axios': '5.0.0-beta.103',
    '@kubb/plugin-zod': '5.0.0-beta.103',
    '@kubb/plugin-faker': '5.0.0-beta.103',
  },
}

const output = {
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  iterationsPerCombo: ITERATIONS,
  totalWallTimeMs: overallEnd - overallStart,
  kubbVersions,
  fixtures: FIXTURES,
  combos: COMBOS,
  summary,
  rawRuns: allRuns,
}

mkdirSync(path.join(__dirname, 'results'), { recursive: true })
writeFileSync(path.join(__dirname, 'results', 'results.json'), JSON.stringify(output, null, 2))
console.error(`\nDone in ${((overallEnd - overallStart) / 1000).toFixed(1)}s. Wrote results/results.json`)
