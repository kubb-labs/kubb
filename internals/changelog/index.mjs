import changelogGithub from '@changesets/changelog-github'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const ROOT_CHANGELOG = path.join(ROOT, 'CHANGELOG.md')
const CHANGESET_DIR = path.join(ROOT, '.changeset')

const FRONTMATTER = `---
title: Kubb Changelog - Release Notes & Updates
description: Kubb changelog with release notes, bug fixes, new features, and breaking changes for all versions.
outline: deep
---

`

const TYPE_ORDER = ['major', 'minor', 'patch']

const TYPE_HEADERS = {
  major: '### 💥 Breaking Changes',
  minor: '### ✨ Features',
  patch: '### 🐛 Bug Fixes',
}

/** @type {Map<string, Map<string, Map<string, string[]>>>} version → type → pkg → entries */
const pending = new Map()

/** Deduplicates calls — changesets invokes getReleaseLine once per package in the fixed group. */
const seen = new Set()

function parseChangesetPackages(id) {
  const file = path.join(CHANGESET_DIR, `${id}.md`)
  if (!fs.existsSync(file)) return null

  const match = fs.readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null

  const packages = {}
  for (const line of match[1].split('\n')) {
    const m = line.match(/^"([^"]+)":\s*(major|minor|patch)$/)
    if (m) packages[m[1]] = m[2]
  }

  return Object.keys(packages).length ? packages : null
}

function getEntries(version, type, pkg) {
  if (!pending.has(version)) pending.set(version, new Map())
  const byType = pending.get(version)
  if (!byType.has(type)) byType.set(type, new Map())
  const byPkg = byType.get(type)
  if (!byPkg.has(pkg)) byPkg.set(pkg, [])
  return byPkg.get(pkg)
}

function buildBlock(version, byType) {
  const sections = []

  for (const type of TYPE_ORDER) {
    if (!byType.has(type)) continue

    const lines = [...byType.get(type)]
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([pkg, entries]) =>
        entries
          .map((entry) => {
            const text = entry.trim().replace(/^- /, '')
            return text ? `- **\`${pkg}\`** — ${text}` : null
          })
          .filter(Boolean),
      )

    if (lines.length) sections.push(`${TYPE_HEADERS[type]}\n\n${lines.join('\n')}`)
  }

  return sections.length ? `## ${version}\n\n${sections.join('\n\n')}` : null
}

export function flush() {
  if (!pending.size) return

  const existing = fs.existsSync(ROOT_CHANGELOG) ? fs.readFileSync(ROOT_CHANGELOG, 'utf8') : ''
  const body = existing.startsWith('---') ? existing.replace(/^---[\s\S]*?---\n\n/, '') : existing

  let newBlocks = ''
  for (const [version, byType] of pending) {
    if (body.includes(`\n## ${version}\n`) || body.startsWith(`## ${version}\n`)) continue
    const block = buildBlock(version, byType)
    if (block) newBlocks += `${block}\n\n`
  }

  if (!newBlocks) return

  let newBody
  if (!body.trim()) {
    newBody = `# Changelog\n\n${newBlocks}`
  } else if (/^# .+\n/.test(body)) {
    newBody = body.replace(/^(# .+\n)(\n)?/, `$1\n${newBlocks}`)
  } else {
    newBody = `${newBlocks}${body}`
  }

  fs.writeFileSync(ROOT_CHANGELOG, `${FRONTMATTER}${newBody}`)
}

process.on('exit', flush)

export async function getReleaseLine(changeset, type, options) {
  const version = changeset.releases[0]?.newVersion
  if (!version) return ''

  const key = `${changeset.id}:${version}`
  if (seen.has(key)) return ''
  seen.add(key)

  const line = await changelogGithub.getReleaseLine(changeset, type, options)
  const packages = parseChangesetPackages(changeset.id)

  if (packages) {
    for (const [pkg, pkgType] of Object.entries(packages)) {
      getEntries(version, pkgType, pkg).push(line)
    }
  } else {
    getEntries(version, type, changeset.id).push(line)
  }

  return ''
}

export async function getDependencyReleaseLine() {
  return ''
}
