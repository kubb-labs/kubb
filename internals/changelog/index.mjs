import changelogGithub from '@changesets/changelog-github'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const DEFAULTS = {
  rootChangelog: path.join(ROOT, 'CHANGELOG.md'),
  changesetDir: path.join(ROOT, '.changeset'),
  versionPackage: path.join(ROOT, 'packages/kubb/package.json'),
  repo: 'kubb-labs/kubb',
  typeOrder: ['major', 'minor', 'patch'],
  typeHeaders: {
    major: 'Breaking Changes',
    minor: 'Features',
    patch: 'Bug Fixes',
  },
}

/** @type {Array<{type: string, packages: Record<string,string>|null, line: string, options: Record<string, unknown>}>} */
const pending = []

/** Deduplicates calls — changesets invokes getReleaseLine once per package in the fixed group. */
const seen = new Set()

function parseChangesetPackages({ id, changesetDir }) {
  const base = path.resolve(changesetDir)
  const target = path.resolve(base, `${id}.md`)
  const relative = path.relative(base, target)
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null
  if (!fs.existsSync(target)) return null

  const match = fs.readFileSync(target, 'utf8').match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const packages = {}
  for (const line of match[1].split('\n')) {
    const m = line.match(/^"([^"]+)":\s*(major|minor|patch)$/)
    if (m) packages[m[1]] = m[2]
  }

  return Object.keys(packages).length ? packages : null
}

/** Extracts the human-readable description from a changesets-github release line. */
function extractDescription({ line }) {
  const text = line.trim().replace(/^- /, '')
  const idx = text.indexOf('! - ')
  const desc = idx >= 0 ? text.slice(idx + 4) : text
  return desc.trim()
}

/** Extracts PR/commit reference markdown links from a changesets-github release line. */
function extractRefs({ line }) {
  const refs = []
  const prMatch = line.match(/\[#(\d+)\]\((https:\/\/github\.com\/[^)]+)\)/)
  if (prMatch) refs.push(`[#${prMatch[1]}](${prMatch[2]})`)
  const shaMatch = line.match(/\[`([a-f0-9]{7,})`\]\((https:\/\/github\.com\/[^)]+)\)/)
  if (shaMatch) refs.push(`[\`${shaMatch[1]}\`](${shaMatch[2]})`)
  return refs
}

/** Extracts contributor handles like "@user" from a release line. */
function extractContributors({ line }) {
  const handles = new Set()
  const re = /\[@([\w-]+)\]\(https:\/\/github\.com\/[\w-]+\)/g
  let m
  while ((m = re.exec(line)) !== null) handles.add(m[1])
  return [...handles]
}

function formatDate({ date = new Date() } = {}) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function buildBlock({ version, byPackage, contributors, typeOrder, typeHeaders }) {
  const lines = []
  lines.push(`## v${version} — ${formatDate()}`)
  lines.push('')

  const sortedPackages = [...byPackage.keys()].sort((a, b) => a.localeCompare(b))

  for (const pkg of sortedPackages) {
    lines.push(`### ${pkg}`)
    lines.push('')

    const byType = byPackage.get(pkg)
    for (const type of typeOrder) {
      const entries = byType.get(type)
      if (!entries || !entries.length) continue

      lines.push(`#### ${typeHeaders[type]}`)
      lines.push('')
      for (const entry of entries) {
        const refs = extractRefs({ line: entry })
        const desc = extractDescription({ line: entry })
        const suffix = refs.length ? ` (${refs.join(', ')})` : ''
        lines.push(`- ${desc}${suffix}`)
      }
      lines.push('')
    }
  }

  if (contributors.length) {
    lines.push('### Contributors')
    lines.push('')
    lines.push('Thanks to everyone who contributed to this release:')
    lines.push('')
    lines.push(contributors.map((c) => `[@${c}](https://github.com/${c})`).join(', '))
    lines.push('')
  }

  return lines.join('\n')
}

function aggregate({ entries }) {
  /** @type {Map<string, Map<string, string[]>>} */
  const byPackage = new Map()
  const contributors = new Set()

  for (const { type, packages, line } of entries) {
    for (const c of extractContributors({ line })) contributors.add(c)

    if (packages) {
      for (const [pkg, pkgType] of Object.entries(packages)) {
        if (!byPackage.has(pkg)) byPackage.set(pkg, new Map())
        const byType = byPackage.get(pkg)
        if (!byType.has(pkgType)) byType.set(pkgType, [])
        byType.get(pkgType).push(line)
      }
    } else {
      if (!byPackage.has('unknown')) byPackage.set('unknown', new Map())
      const byType = byPackage.get('unknown')
      if (!byType.has(type)) byType.set(type, [])
      byType.get(type).push(line)
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

  const { byPackage, contributors } = aggregate({ entries: pending })

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
  const id = changeset.id
  if (seen.has(id)) return ''
  seen.add(id)

  const line = await changelogGithub.getReleaseLine(changeset, type, options)
  let packages = parseChangesetPackages({ id, changesetDir: options.changesetDir ?? DEFAULTS.changesetDir })

  if (!packages && changeset.releases?.length) {
    packages = {}
    for (const release of changeset.releases) {
      packages[release.name] = release.type
    }
  }

  pending.push({ type, packages, line, options: { ...options, repo: options.repo ?? DEFAULTS.repo } })

  return ''
}

export async function getDependencyReleaseLine() {
  return ''
}
