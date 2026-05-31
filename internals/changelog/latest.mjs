import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const CHANGELOG = path.join(ROOT, 'CHANGELOG.md')

/**
 * Returns the body of the most recent version block from a CHANGELOG.md string,
 * stripped of its `## v...` heading so it can serve as a GitHub release body
 * (the release title already carries the version).
 */
export function getLatestSection(markdown) {
  const start = markdown.search(/^## /m)
  if (start === -1) return ''

  const rest = markdown.slice(start)
  const next = rest.slice(3).search(/^## /m)
  const block = next === -1 ? rest : rest.slice(0, next + 3)

  const newline = block.indexOf('\n')
  return newline === -1 ? '' : block.slice(newline + 1).trim()
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const markdown = fs.existsSync(CHANGELOG) ? fs.readFileSync(CHANGELOG, 'utf8') : ''
  process.stdout.write(getLatestSection(markdown))
}
