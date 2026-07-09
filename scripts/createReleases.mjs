#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { packageHeadingPattern, versionHeadingPattern } from '../internals/changelog/format.mjs'

// The custom changelog hook (internals/changelog/index.mjs) writes one root
// CHANGELOG.md with a `## v<version>` heading per release and a `### <name>`
// subsection per package inside it. This finds that whole version block, the
// shared starting point for both a combined, whole-version release and a
// single package's own subsection within it.
export function extractVersionNotes({ changelog, version }) {
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
  const versionBlock = extractVersionNotes({ changelog, version })
  if (versionBlock === null) return null

  const packageMatch = packageHeadingPattern(name).exec(versionBlock)
  if (!packageMatch) return null

  const afterPackage = versionBlock.slice(packageMatch.index + packageMatch[0].length)
  const nextHeading = /^#{2,3}\s+/m.exec(afterPackage)
  const packageBlock = nextHeading ? afterPackage.slice(0, nextHeading.index) : afterPackage

  return packageBlock.trim() || null
}

function releaseExists(tag) {
  return spawnSync('gh', ['release', 'view', tag], { encoding: 'utf8' }).status === 0
}

// A re-run of `promote` (e.g. a manual `promote: true` dispatch against a
// version that was already tagged and released) would otherwise fail here:
// `gh release create` errors on a tag that already has a release. Skipping
// cleanly makes promote safe to re-run instead of going red on a re-dispatch.
function createRelease({ tag, title, notes }) {
  if (releaseExists(tag)) {
    console.log(`Release ${tag} already exists, skipping.`)
    return
  }

  const result = spawnSync('gh', ['release', 'create', tag, '--title', title, '--notes', notes], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function getWorkspacePaths() {
  const result = spawnSync('pnpm', ['ls', '-r', '--json', '--depth', '0'], { encoding: 'utf8' })
  if (result.status !== 0) return {}
  try {
    return Object.fromEntries(JSON.parse(result.stdout).map((pkg) => [pkg.name, pkg.path]))
  } catch {
    return {}
  }
}

function createPerPackageReleases({ staged, repo }) {
  const pkgPaths = getWorkspacePaths()
  for (const pkg of staged) {
    let notes = null
    const pkgPath = pkgPaths[pkg.name]
    if (pkgPath) {
      try {
        notes = extractVersionNotes({ changelog: readFileSync(`${pkgPath}/CHANGELOG.md`, 'utf8'), version: pkg.version })
      } catch {}
    }
    notes ??= `Dependency update only, no direct changes for this package. See [CHANGELOG.md](https://github.com/${repo}/blob/main/CHANGELOG.md) for the full release notes.`
    createRelease({ tag: `${pkg.name}@${pkg.version}`, title: `${pkg.name}@${pkg.version}`, notes })
  }
}

// One release for the whole version, tagged with the flagship package's own
// tag (already created by the `changeset tag` step) rather than inventing a
// second, parallel tagging scheme.
function createCombinedRelease({ staged, changelog, repo }) {
  const flagship = staged.find((pkg) => pkg.name === 'kubb') ?? staged[0]
  if (!flagship) return

  const notes =
    extractVersionNotes({ changelog, version: flagship.version }) ??
    `Dependency update only, no direct changes for this package. See [CHANGELOG.md](https://github.com/${repo}/blob/main/CHANGELOG.md) for the full release notes.`
  createRelease({ tag: `${flagship.name}@${flagship.version}`, title: `v${flagship.version}`, notes })
}

function main() {
  const staged = JSON.parse(process.env.STAGED_PACKAGES || '[]')
  if (staged.length === 0) {
    console.error('STAGED_PACKAGES is empty. The promote job only runs when release staged something, so this should never happen.')
    process.exit(1)
  }

  const repo = process.env.GITHUB_REPOSITORY

  if (process.env.RELEASE_MODE === 'combined') {
    createCombinedRelease({ staged, changelog: readFileSync('CHANGELOG.md', 'utf8'), repo })
  } else {
    createPerPackageReleases({ staged, repo })
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
