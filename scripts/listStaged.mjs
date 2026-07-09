#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { parseStaged } from './release.mjs'

// Used for a manual `promote`-only dispatch: when a previous run staged
// packages on npm but was interrupted before `promote` could verify and
// release them, there is no new version to stage, so `changesets/action`
// reports nothing. `pnpm stage list` reads what is already sitting on npm
// awaiting approval, so promote can run without anyone typing a version in.
function main() {
  const result = spawnSync('pnpm', ['stage', 'list', '-r', '--json'], { encoding: 'utf8' })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.status !== 0) process.exit(result.status ?? 1)

  const staged = parseStaged(result.stdout ?? '')
  if (staged.length === 0) {
    console.error('No staged packages found on npm (pnpm stage list). Nothing to promote.')
    process.exit(1)
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, 'staged=true\n')
    appendFileSync(process.env.GITHUB_OUTPUT, `staged_packages=${JSON.stringify(staged)}\n`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
