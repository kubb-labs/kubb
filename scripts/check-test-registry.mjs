import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Every committed test file needs an entry in configs/test-registry.json that says why it exists.
const registryUrl = new URL('../configs/test-registry.json', import.meta.url)
const registry = JSON.parse(readFileSync(registryUrl, 'utf8'))

// Same suffixes Vitest discovers by default, plus benchmarks.
const testFile = /\.(test|spec|bench)\.[cm]?[jt]sx?$/
const committed = execFileSync('git', ['ls-files', '-z'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' })
  .split('\0')
  .filter((file) => testFile.test(file))

const unregistered = committed.filter((file) => !(file in registry))
const stale = Object.keys(registry).filter((file) => !committed.includes(file))
const unjustified = Object.entries(registry)
  .filter(([, reason]) => typeof reason !== 'string' || reason.trim() === '')
  .map(([file]) => file)

const report = (title, files) => {
  if (files.length) {
    console.error(`${title}\n${files.map((file) => `  ${file}`).join('\n')}`)
  }
}

report('Test files missing from configs/test-registry.json (add an entry with a justification, or delete the test):', unregistered)
report('Registry entries whose file no longer exists (remove them):', stale)
report('Registry entries without a justification:', unjustified)

if (unregistered.length || stale.length || unjustified.length) {
  process.exit(1)
}
console.log(`Test registry OK: ${committed.length} test files, each with a justification.`)
