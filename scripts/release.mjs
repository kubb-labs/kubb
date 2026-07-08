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

// Parse pnpm publish output (staged or direct) into [{ name, version }].
// Prefers the --json payload, in whichever shape it comes in (a bare array,
// or an object keyed by package name), then falls back to scanning text
// output for `+ <name>@<version>` lines.
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

  // Bypasses npm's staged-publish + environment-approval gate: packages go
  // live the moment `pnpm publish` returns.
  const skipStaging = process.env.SKIP_STAGED_PUBLISH === 'true'
  const publishArgs = skipStaging
    ? ['publish', '-r', '--no-git-check', '--access', 'public', '--json']
    : ['stage', 'publish', '-r', '--no-git-check', '--access', 'public', '--json']
  if (tag) publishArgs.push('--tag', tag)

  const result = spawnSync('pnpm', publishArgs, { encoding: 'utf8' })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.status !== 0) process.exit(result.status ?? 1)
  const output = result.stdout ?? ''
  const published = parseStaged(output)

  // Tags aren't created here. The `promote` job does that after confirming
  // (or, for a direct publish, already knowing) the versions are live. See
  // changesets/changesets#2025 for why staging shouldn't tag early.
  //
  // Only signal a publish if pnpm actually published something. When
  // everything was skipped (versions already on npm), let the canary step
  // fire instead.
  if (published.length > 0 && process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${skipStaging ? 'published' : 'staged'}=true\n`)
    appendFileSync(process.env.GITHUB_OUTPUT, `staged_packages=${JSON.stringify(published)}\n`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
