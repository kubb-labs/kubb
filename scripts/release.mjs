#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'

function readPreTag() {
  try {
    return JSON.parse(readFileSync('.changeset/pre.json', 'utf8')).tag ?? null
  } catch {
    return null
  }
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function capture(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: 'utf8' })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.status !== 0) process.exit(result.status ?? 1)
  return result.stdout ?? ''
}

// Parse pnpm stage publish output into [{ name, version }]. Prefers --json
// payload, falls back to scanning text output for `+ <name>@<version>` lines.
function parseStaged(output) {
  try {
    const parsed = JSON.parse(output)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((entry) => entry?.name && entry?.version)
        .map((entry) => ({ name: entry.name, version: entry.version }))
    }
  } catch {}

  const found = []
  for (const line of output.split('\n')) {
    const match = line.match(/^\+\s+(@?[^\s@]+)@(\S+)/)
    if (match) found.push({ name: match[1], version: match[2] })
  }
  return found
}

const tag = readPreTag()
const stageArgs = ['stage', 'publish', '-r', '--no-git-check', '--access', 'public', '--json']
if (tag) stageArgs.push('--tag', tag)

const output = capture('pnpm', stageArgs)
const staged = parseStaged(output)

// Emit the marker changesets/action listens for so it creates a GitHub Release
// per staged package. Format matches @changesets/cli publish output.
for (const pkg of staged) {
  console.log(`🦋  New tag:  ${pkg.name}@${pkg.version}`)
}

// Create annotated git tags locally for the new versions, then push them so
// the Release created above has a tag to point at on the remote.
run('pnpm', ['exec', 'changeset', 'tag'])
run('git', ['push', '--tags'])

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, 'staged=true\n')
}
