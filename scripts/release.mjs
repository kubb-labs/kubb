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

// Parse pnpm stage publish output into [{ name, version }]. Prefers the --json
// payload, in whichever shape it comes in (a bare array, or an object keyed by
// package name, both observed across pnpm/npm staged-publish responses), then
// falls back to scanning text output for `+ <name>@<version>` lines.
export function parseStaged(output) {
  try {
    const parsed = JSON.parse(output)
    const entries = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? Object.entries(parsed).map(([key, value]) => ({ name: value?.name ?? value?.packageName ?? key, version: value?.version }))
        : null

    if (entries) {
      return entries.filter((entry) => entry?.name && entry?.version).map((entry) => ({ name: entry.name, version: entry.version }))
    }
  } catch {}

  const found = []
  for (const line of output.split('\n')) {
    const match = line.match(/^\+\s+(@?[^\s@]+)@(\S+)/)
    if (match) found.push({ name: match[1], version: match[2] })
  }
  return found
}

function main() {
  const tag = readPreTag()
  const stageArgs = ['stage', 'publish', '-r', '--no-git-check', '--access', 'public', '--json']
  if (tag) stageArgs.push('--tag', tag)

  const result = spawnSync('pnpm', stageArgs, { encoding: 'utf8' })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.status !== 0) process.exit(result.status ?? 1)
  const output = result.stdout ?? ''
  const staged = parseStaged(output)

  // Tags aren't created here. A staged package may still be rejected on npm,
  // and changesets/changesets#2025 specifically warns against tagging at
  // stage time for that reason. The `promote` job creates and pushes tags
  // itself, after confirming the versions are actually live.
  //
  // Only signal a stage to the workflow if pnpm actually published something.
  // When everything was skipped (versions already on npm), let the canary step
  // fire instead — that's the intent for ordinary main pushes.
  if (staged.length > 0 && process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, 'staged=true\n')
    appendFileSync(process.env.GITHUB_OUTPUT, `staged_packages=${JSON.stringify(staged)}\n`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
