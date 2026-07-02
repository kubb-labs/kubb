#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'

const RETRY_ATTEMPTS = 6
const RETRY_DELAY_MS = 10_000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isLiveOnRegistry(pkg) {
  const result = spawnSync('npm', ['view', `${pkg.name}@${pkg.version}`, '--json'], { encoding: 'utf8' })
  if (result.status !== 0) return false

  try {
    const parsed = JSON.parse(result.stdout || '{}')
    return Boolean(parsed?.version)
  } catch {
    return false
  }
}

// A green environment review only means a maintainer clicked approve, not
// that they actually ran `npm stage approve`. Retrying absorbs registry
// propagation lag right after a real approval; giving up after all attempts
// means the version genuinely isn't live yet.
export async function verifyPackage({ pkg, attempts = RETRY_ATTEMPTS, delayMs = RETRY_DELAY_MS }) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (isLiveOnRegistry(pkg)) return true
    if (attempt < attempts) await sleep(delayMs)
  }

  return false
}

async function main() {
  const staged = JSON.parse(process.env.STAGED_PACKAGES || '[]')
  const results = []

  for (const pkg of staged) {
    process.stdout.write(`Checking ${pkg.name}@${pkg.version} ...\n`)
    const live = await verifyPackage({ pkg })
    results.push({ pkg, live })
  }

  const missing = results.filter((result) => !result.live)
  if (missing.length > 0) {
    for (const { pkg } of missing) {
      console.error(
        `${pkg.name}@${pkg.version} isn't live on npm yet. Confirm npm stage approve was run for this exact version, or that the staged version hasn't expired.`,
      )
    }
    process.exit(1)
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, 'approved=true\n')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main()
}
