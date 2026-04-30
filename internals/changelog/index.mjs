import changelogGithub from '@changesets/changelog-github'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const DEFAULTS = {
  rootChangelog: path.join(ROOT, 'CHANGELOG.md'),
  versionPackage: path.join(ROOT, 'packages/kubb/package.json'),
  repo: 'kubb-labs/kubb',
  typeOrder: ['major', 'minor', 'patch'],
  typeHeaders: {
    major: 'Breaking Changes',
    minor: 'Features',
    patch: 'Bug Fixes',
  },
}

/** @type {Array<{packages: Record<string,string>, line: string, options: Record<string, unknown>}>} */
const pending = []

/** Deduplicates calls — changesets invokes getReleaseLine once per package in the fixed group. */
const seen = new Set()

/** Extracts the human-readable description from a changesets-github release line. */
function extractDescription(line) {
  const text = line.trim().replace(/^- /, '')
  const idx = text.indexOf('! - ')
  return (idx >= 0 ? text.slice(idx + 4) : text).trim()
}

/** Extracts PR/commit reference markdown links from a changesets-github release line. */
function extractRefs(line) {
  const refs = []
  const prMatch = line.match(/\[#(\d+)\]\((https:\/\/github\.com\/[^)]+)\)/)
  if (prMatch) refs.push(`[#${prMatch[1]}](${prMatch[2]})`)
  const shaMatch = line.match(/\[`([a-f0-9]{7,})`\]\((https:\/\/github\.com\/[^)]+)\)/)
  if (shaMatch) refs.push(`[\`${shaMatch[1]}\`](${shaMatch[2]})`)
  return refs
}

/** Extracts contributor handles like "@user" from a release line. */
function extractContributors(line) {
  return [...new Set([...line.matchAll(/\[@([\w-]+)\]\(https:\/\/github\.com\/[\w-]+\)/g)].map((m) => m[1]))]
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function buildBlock({ version, byPackage, contributors, typeOrder, typeHeaders }) {
  const lines = [`## v${version} — ${formatDate()}`, '']

  for (const pkg of [...byPackage.keys()].sort()) {
    lines.push(`### ${pkg}`, '')

    const byType = byPackage.get(pkg)
    for (const type of typeOrder) {
      const entries = byType.get(type)
      if (!entries?.length) continue

      lines.push(`#### ${typeHeaders[type]}`, '')
      for (const entry of entries) {
        const refs = extractRefs(entry)
        const suffix = refs.length ? ` (${refs.join(', ')})` : ''
        lines.push(`- ${extractDescription(entry)}${suffix}`)
      }
      lines.push('')
    }
  }

  if (contributors.length) {
    lines.push('### Contributors', '', 'Thanks to everyone who contributed to this release:', '')
    lines.push(contributors.map((c) => `[@${c}](https://github.com/${c})`).join(', '), '')
  }

  return lines.join('\n')
}

function aggregate(entries) {
  /** @type {Map<string, Map<string, string[]>>} */
  const byPackage = new Map()
  const contributors = new Set()

  for (const { packages, line } of entries) {
    for (const c of extractContributors(line)) contributors.add(c)

    for (const [pkg, pkgType] of Object.entries(packages)) {
      if (!byPackage.has(pkg)) byPackage.set(pkg, new Map())
      const byType = byPackage.get(pkg)
      if (!byType.has(pkgType)) byType.set(pkgType, [])
      byType.get(pkgType).push(line)
    }
  }

  return { byPackage, contributors: [...contributors].sort() }
}

export function flush() {
  if (!pending.length) return

  const { rootChangelog, versionPackage, typeOrder, typeHeaders } = {
    ...DEFAULTS,
    ...(pending[0]?.options ?? {}),
  }

  let version
  try {
    version = JSON.parse(fs.readFileSync(versionPackage, 'utf8')).version
  } catch {
    return
  }
  if (!version) return

  const { byPackage, contributors } = aggregate(pending)

  const existing = fs.existsSync(rootChangelog) ? fs.readFileSync(rootChangelog, 'utf8') : ''
  const body = existing.startsWith('---') ? existing.replace(/^---[\s\S]*?---\n\n?/, '') : existing

  if (new RegExp(`^##\\s+v?${version.replace(/[.+\-]/g, '\\$&')}\\b`, 'm').test(body)) return

  const block = buildBlock({ version, byPackage, contributors, typeOrder, typeHeaders })

  let newBody
  if (!body.trim()) {
    newBody = `# Changelog\n\n${block}\n`
  } else if (/^# .+\n/.test(body)) {
    newBody = body.replace(/^(# .+\n)(\n)?/, `$1\n${block}\n`)
  } else {
    newBody = `${block}\n${body}`
  }

  fs.writeFileSync(rootChangelog, newBody)
}

process.on('exit', flush)

export async function getReleaseLine(changeset, type, options = {}) {
  if (seen.has(changeset.id)) return ''
  seen.add(changeset.id)

  const line = await changelogGithub.getReleaseLine(changeset, type, options)
  const packages = Object.fromEntries(changeset.releases.map((r) => [r.name, r.type]))

  pending.push({ packages, line, options: { ...options, repo: options.repo ?? DEFAULTS.repo } })

  return ''
}

export async function getDependencyReleaseLine() {
  return ''
}
