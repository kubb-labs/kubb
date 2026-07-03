#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const CHANGELOG_PATH = 'CHANGELOG.md'

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// The custom changelog hook (internals/changelog/index.mjs) writes one root
// CHANGELOG.md with a `## v<version>` heading per release and a `### <name>`
// subsection per package inside it. Since every published package here sits
// in one fixed version group, a single version heading covers all of them,
// so pulling out one package's subsection reproduces what changesets/action
// would normally show per package, sourced from this repo's aggregated file
// instead of a per-package changelog.
export function extractPackageNotes({ changelog, name, version }) {
  const versionHeading = new RegExp(`^##\\s+v?${escapeForRegExp(version)}\\b.*$`, 'm')
  const versionMatch = versionHeading.exec(changelog)
  if (!versionMatch) return null

  const afterVersion = changelog.slice(versionMatch.index + versionMatch[0].length)
  const nextVersionHeading = /^##\s+/m.exec(afterVersion)
  const versionBlock = nextVersionHeading ? afterVersion.slice(0, nextVersionHeading.index) : afterVersion

  const packageHeading = new RegExp(`^###\\s+${escapeForRegExp(name)}\\s*$`, 'm')
  const packageMatch = packageHeading.exec(versionBlock)
  if (!packageMatch) return null

  const afterPackage = versionBlock.slice(packageMatch.index + packageMatch[0].length)
  const nextHeading = /^#{2,3}\s+/m.exec(afterPackage)
  const packageBlock = nextHeading ? afterPackage.slice(0, nextHeading.index) : afterPackage

  return packageBlock.trim() || null
}

function fallbackNotes({ repo }) {
  return `Dependency update only, no direct changes for this package. See [CHANGELOG.md](https://github.com/${repo}/blob/main/CHANGELOG.md) for the full release notes.`
}

function createRelease({ name, version, notes }) {
  const tag = `${name}@${version}`
  const dir = mkdtempSync(path.join(tmpdir(), 'release-notes-'))
  const notesPath = path.join(dir, 'notes.md')
  writeFileSync(notesPath, notes)

  const result = spawnSync('gh', ['release', 'create', tag, '--title', tag, '--notes-file', notesPath], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function main() {
  const staged = JSON.parse(process.env.STAGED_PACKAGES || '[]')
  const repo = process.env.GITHUB_REPOSITORY
  const changelog = readFileSync(CHANGELOG_PATH, 'utf8')

  for (const pkg of staged) {
    const notes = extractPackageNotes({ changelog, name: pkg.name, version: pkg.version }) ?? fallbackNotes({ repo })
    createRelease({ name: pkg.name, version: pkg.version, notes })
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
