#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { packageHeadingPattern, versionHeadingPattern } from '../internals/changelog/format.mjs'

const CHANGELOG_PATH = 'CHANGELOG.md'

// The custom changelog hook (internals/changelog/index.mjs) writes one root
// CHANGELOG.md with a `## v<version>` heading per release and a `### <name>`
// subsection per package inside it. This finds that whole version block, the
// shared starting point for both a combined, whole-version release and a
// single package's own subsection within it.
function findVersionBlock({ changelog, version }) {
  const versionMatch = versionHeadingPattern(version).exec(changelog)
  if (!versionMatch) return null

  const afterVersion = changelog.slice(versionMatch.index + versionMatch[0].length)
  const nextVersionHeading = /^##\s+/m.exec(afterVersion)
  return (nextVersionHeading ? afterVersion.slice(0, nextVersionHeading.index) : afterVersion).trim()
}

// Reproduces what changesets/action would normally show for one package,
// sourced from this repo's aggregated CHANGELOG.md instead of a per-package
// changelog.
export function extractPackageNotes({ changelog, name, version }) {
  const versionBlock = findVersionBlock({ changelog, version })
  if (versionBlock === null) return null

  const packageMatch = packageHeadingPattern(name).exec(versionBlock)
  if (!packageMatch) return null

  const afterPackage = versionBlock.slice(packageMatch.index + packageMatch[0].length)
  const nextHeading = /^#{2,3}\s+/m.exec(afterPackage)
  const packageBlock = nextHeading ? afterPackage.slice(0, nextHeading.index) : afterPackage

  return packageBlock.trim() || null
}

// For a repo where every published package is fixed to one shared version
// (this repo's `fixed` group in .changeset/config.json covers all of them),
// one release per package is redundant noise. This returns the whole version
// block, covering every package's section in one go.
export function extractVersionNotes({ changelog, version }) {
  return findVersionBlock({ changelog, version })
}

function fallbackNotes({ repo }) {
  return `Dependency update only, no direct changes for this package. See [CHANGELOG.md](https://github.com/${repo}/blob/main/CHANGELOG.md) for the full release notes.`
}

function createRelease({ tag, title, notes }) {
  const dir = mkdtempSync(path.join(tmpdir(), 'release-notes-'))
  const notesPath = path.join(dir, 'notes.md')
  writeFileSync(notesPath, notes)

  const result = spawnSync('gh', ['release', 'create', tag, '--title', title, '--notes-file', notesPath], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function createPerPackageReleases({ staged, changelog, repo }) {
  for (const pkg of staged) {
    const notes = extractPackageNotes({ changelog, name: pkg.name, version: pkg.version }) ?? fallbackNotes({ repo })
    createRelease({ tag: `${pkg.name}@${pkg.version}`, title: `${pkg.name}@${pkg.version}`, notes })
  }
}

// One release for the whole version, tagged with the flagship package's own
// tag (already created by the `changeset tag` step) rather than inventing a
// second, parallel tagging scheme.
function createCombinedRelease({ staged, changelog, repo }) {
  const flagship = staged.find((pkg) => pkg.name === 'kubb') ?? staged[0]
  if (!flagship) return

  const notes = extractVersionNotes({ changelog, version: flagship.version }) ?? fallbackNotes({ repo })
  createRelease({ tag: `${flagship.name}@${flagship.version}`, title: `v${flagship.version}`, notes })
}

function main() {
  const staged = JSON.parse(process.env.STAGED_PACKAGES || '[]')
  if (staged.length === 0) {
    console.error('STAGED_PACKAGES is empty. The promote job only runs when release staged something, so this should never happen.')
    process.exit(1)
  }

  const repo = process.env.GITHUB_REPOSITORY
  const changelog = readFileSync(CHANGELOG_PATH, 'utf8')

  if (process.env.RELEASE_MODE === 'combined') {
    createCombinedRelease({ staged, changelog, repo })
  } else {
    createPerPackageReleases({ staged, changelog, repo })
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
