// Orchestrates the kubb-vs-heyapi benchmark matrix: for each (tool, fixture), spawns an
// isolated `node --expose-gc` child process N times and records time, memory, and output size.
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// petStore.yaml is excluded: @hey-api/openapi-ts 0.99.0 crashes on it ("Symbol finalName has
// not been resolved yet") because of the `tag.Tag` component name (a dot in the schema key),
// confirmed via bisection to be the trigger. Kubb handles it fine. Filed nowhere yet — this is
// a real hey-api limitation on this specific fixture, not a benchmark bug.
const FIXTURES = ['twitter.json', 'openai.yaml']
const TOOLS = ['kubb', 'hey-api']
const ITERATIONS = 3

function runOnce(tool, fixture) {
  const dir = tool === 'kubb' ? 'kubb' : 'heyapi'
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, dir, 'run-one.mjs')
    const child = spawn(process.execPath, ['--expose-gc', scriptPath, fixture], {
      cwd: path.join(__dirname, dir),
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
        resolve({ tool, fixture, success: false, error: `exit code ${code}: ${stderr.slice(0, 2000)}` })
        return
      }
      try {
        resolve(JSON.parse(stdout))
      } catch (parseError) {
        resolve({ tool, fixture, success: false, error: `JSON parse failure: ${parseError.message}. stdout: ${stdout.slice(0, 500)}` })
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

const totalCombos = TOOLS.length * FIXTURES.length
let done = 0
const overallStart = performance.now()

for (const fixture of FIXTURES) {
  for (const tool of TOOLS) {
    const runs = []
    for (let i = 0; i < ITERATIONS; i++) {
      const result = await runOnce(tool, fixture)
      runs.push(result)
      allRuns.push({ iteration: i + 1, ...result })
    }
    done++
    const okRuns = runs.filter((r) => r.success)
    const durations = okRuns.map((r) => r.durationMs)
    const deltaRss = okRuns.map((r) => r.memory?.deltaRssMb).filter((v) => typeof v === 'number')
    const peakRss = okRuns.map((r) => r.memory?.peakRssMb).filter((v) => typeof v === 'number')

    const summaryEntry = {
      tool,
      fixture,
      iterations: ITERATIONS,
      successfulRuns: okRuns.length,
      filesGenerated: okRuns[0]?.filesGenerated ?? null,
      outputBytes: okRuns[0]?.outputBytes ?? null,
      medianDurationMs: durations.length ? median(durations) : null,
      medianDeltaRssMb: deltaRss.length ? median(deltaRss) : null,
      medianPeakRssMb: peakRss.length ? median(peakRss) : null,
      errors: runs.filter((r) => !r.success).map((r) => r.error),
    }
    summary.push(summaryEntry)

    console.error(
      `[${done}/${totalCombos}] ${tool} ${fixture}: median=${summaryEntry.medianDurationMs?.toFixed(1)}ms files=${summaryEntry.filesGenerated} bytes=${summaryEntry.outputBytes} peakRss=${summaryEntry.medianPeakRssMb?.toFixed(1)}MB ok=${okRuns.length}/${ITERATIONS}`,
    )
  }
}

const overallEnd = performance.now()

const output = {
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  iterationsPerCombo: ITERATIONS,
  totalWallTimeMs: overallEnd - overallStart,
  tools: {
    kubb: '5.0.0-beta.104 (core) / beta.103 (plugins), plugin-ts + plugin-axios + plugin-zod',
    'hey-api': '@hey-api/openapi-ts@0.99.0, @hey-api/typescript + @hey-api/client-axios + @hey-api/sdk + zod',
  },
  fixtures: FIXTURES,
  excludedFixtures: {
    'petStore.yaml': "hey-api crashes on this fixture's `tag.Tag` component name (dotted schema key)",
  },
  summary,
  rawRuns: allRuns,
}

mkdirSync(path.join(__dirname, 'results'), { recursive: true })
writeFileSync(path.join(__dirname, 'results', 'results.json'), JSON.stringify(output, null, 2))
console.error(`\nDone in ${((overallEnd - overallStart) / 1000).toFixed(1)}s. Wrote results/results.json`)
